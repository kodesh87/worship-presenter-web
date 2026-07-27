/**
 * Login throttling contract for `POST /api/auth/login` and the current-password
 * check in `POST /api/auth/change-password`.
 *
 * The refusal decision is scoped to the (username, client address) pair, never
 * to a username on its own, so the tests below assert both halves of that:
 * an attacker grinding one account from one address gets locked out, and the
 * same account signing in from a different address is untouched. The shared
 * `unknown` address bucket is never throttled at all, because it is also the
 * direct-to-box recovery path.
 *
 * Every case uses its own `cf-connecting-ip` so one case's failures cannot
 * bleed into another's address counter.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Next ships `next/server.js` without an ESM exports map; node needs the
// extension. Chained ahead of the repo's ts-resolve hook.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(specifier, context, nextResolve) {
         if (specifier === 'next/server') {
           return nextResolve('next/server.js', context);
         }
         return nextResolve(specifier, context);
       }`
    )
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-rate-limit-test-'));
const previousDbPath = process.env.DB_PATH;
const previousAuthSecret = process.env.AUTH_SECRET;
process.env.DB_PATH = path.join(tmp, 'test.db');
process.env.AUTH_SECRET = 'rate-limit-test-secret-0123456789';

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;

const { POST } = await import(srcUrl('app', 'api', 'auth', 'login', 'route.ts'));
const { POST: changePassword } = await import(
  srcUrl('app', 'api', 'auth', 'change-password', 'route.ts')
);
const { getDb } = await import(srcUrl('lib', 'db', 'index.ts'));
const { createAccount, getAccountByUsername } = await import(
  srcUrl('lib', 'auth', 'accounts.ts')
);
const { getClientIp, parseClientIp, UNKNOWN_CLIENT_IP } = await import(
  srcUrl('lib', 'auth', 'client-ip.ts')
);
const {
  RATE_LIMIT_WINDOW_SECONDS,
  PAIR_FAILURE_THRESHOLD,
  IP_FAILURE_THRESHOLD,
  MAX_LOGIN_ATTEMPT_ROWS,
  pruneLoginAttempts,
} = await import(srcUrl('lib', 'auth', 'rate-limit.ts'));
const { SESSION_COOKIE, signSession } = await import(
  srcUrl('lib', 'auth', 'session.ts')
);
const { NextRequest } = await import('next/server');

after(() => {
  if (previousDbPath === undefined) delete process.env.DB_PATH;
  else process.env.DB_PATH = previousDbPath;
  if (previousAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousAuthSecret;
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

const LOGIN_URL = 'http://localhost/api/auth/login';
const CHANGE_URL = 'http://localhost/api/auth/change-password';
const INVALID = { error: 'Invalid username or password' };
const GOOD_PASSWORD = 'correct-horse-99';

/** Must match PAIR_SEPARATOR in src/lib/auth/rate-limit.ts. */
const PAIR_SEPARATOR = String.fromCharCode(0x1f);
const pairKey = (username, ip) =>
  `${username.trim().toLowerCase()}${PAIR_SEPARATOR}${ip}`;

function account(username) {
  createAccount({ username, password: GOOD_PASSWORD, role: 'operator' });
  return username;
}

function toResult(res) {
  return res.json().then((body) => ({
    status: res.status,
    body,
    retryAfter: res.headers.get('retry-after'),
  }));
}

/** One login attempt; returns status, parsed body and the Retry-After header. */
async function attempt(username, password, ip) {
  const headers = { 'content-type': 'application/json' };
  if (ip !== undefined) headers['cf-connecting-ip'] = ip;
  return toResult(
    await POST(
      new NextRequest(LOGIN_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, password }),
      })
    )
  );
}

const fail = (username, ip) => attempt(username, 'wrong-password', ip);

/** One current-password guess against `/api/auth/change-password`. */
async function guessCurrentPassword(token, currentPassword, ip) {
  return toResult(
    await changePassword(
      new NextRequest(CHANGE_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-connecting-ip': ip,
          cookie: `${SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword: 'brand-new-pw-1' }),
      })
    )
  );
}

/** Slide every attempt for one (username, address) pair backwards in time. */
function backdate(username, ip, seconds) {
  getDb()
    .prepare(
      `UPDATE login_attempts SET attempted_at = attempted_at - ?
        WHERE (scope = 'user-ip' AND key = ?) OR (scope = 'ip' AND key = ?)`
    )
    .run(seconds, pairKey(username, ip), ip);
}

function countRows(scope, key) {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM login_attempts WHERE scope = ? AND key = ?`
    )
    .get(scope, key);
  return Number(row.n);
}

test('threshold constants are the documented ones', () => {
  assert.equal(PAIR_FAILURE_THRESHOLD, 5);
  assert.equal(IP_FAILURE_THRESHOLD, 20);
  assert.equal(RATE_LIMIT_WINDOW_SECONDS, 15 * 60);
  assert.equal(MAX_LOGIN_ATTEMPT_ROWS, 5000);
});

test('wrong password and unknown user are indistinguishable', async () => {
  const ip = '203.0.113.1';
  const known = account('known-one');

  const wrong = await fail(known, ip);
  const unknown = await fail('no-such-account', ip);

  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.body, INVALID);
  assert.deepEqual(unknown.body, INVALID);
});

test('the sixth failure from one address is 429 and skips the password check', async () => {
  const ip = '203.0.113.2';
  const user = account('locked-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    const res = await fail(user, ip);
    assert.equal(res.status, 401, `attempt ${i + 1} should still be 401`);
    assert.equal(res.retryAfter, null);
  }

  const sixth = await fail(user, ip);
  assert.equal(sixth.status, 429);
  assert.ok(sixth.retryAfter, 'Retry-After must be present');
  assert.ok(Number(sixth.retryAfter) > 0);
  assert.ok(Number(sixth.retryAfter) <= RATE_LIMIT_WINDOW_SECONDS);

  // Rate-limited even with the right password: no comparison is performed.
  const correct = await attempt(user, GOOD_PASSWORD, ip);
  assert.equal(correct.status, 429);
  assert.equal(correct.body.error, sixth.body.error);
});

test('an attacker at one address cannot lock the account out of another', async () => {
  const attackerIp = '203.0.113.10';
  const operatorIp = '203.0.113.11';
  const user = account('sabbath-operator');

  // Well past the old global threshold: three full windows' worth of guesses.
  for (let i = 0; i < PAIR_FAILURE_THRESHOLD * 3; i++) {
    await fail(user, attackerIp);
  }
  assert.equal(
    (await attempt(user, GOOD_PASSWORD, attackerIp)).status,
    429,
    'the grinding address must stay locked'
  );

  const ok = await attempt(user, GOOD_PASSWORD, operatorIp);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.username, user);

  // The operator's success must not hand the attacker a fresh allowance.
  assert.equal((await attempt(user, GOOD_PASSWORD, attackerIp)).status, 429);
});

test('a locked pair does not lock a different username at the same address', async () => {
  const ip = '203.0.113.3';
  const victim = account('victim-user');
  const bystander = account('bystander-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    await fail(victim, ip);
  }
  assert.equal((await fail(victim, ip)).status, 429);

  const ok = await attempt(bystander, GOOD_PASSWORD, ip);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.username, bystander);
});

test('the 429 body is identical for a real and an imaginary account', async () => {
  const ip = '203.0.113.4';
  const real = account('real-user');
  const ghost = 'ghost-user';

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    await fail(real, ip);
    await fail(ghost, ip);
  }

  const lockedReal = await fail(real, ip);
  const lockedGhost = await fail(ghost, ip);
  assert.equal(lockedReal.status, 429);
  assert.equal(lockedGhost.status, 429);
  assert.deepEqual(lockedReal.body, lockedGhost.body);
});

test('a successful login clears that pair and the count restarts', async () => {
  const ip = '203.0.113.5';
  const user = account('reset-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD - 1; i++) {
    assert.equal((await fail(user, ip)).status, 401);
  }

  const success = await attempt(user, GOOD_PASSWORD, ip);
  assert.equal(success.status, 200, JSON.stringify(success.body));

  // Four failures already happened; without the reset the very next one would
  // be the fifth and the one after it would lock.
  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    assert.equal(
      (await fail(user, ip)).status,
      401,
      `attempt ${i + 1} after reset should still be 401`
    );
  }
  assert.equal((await fail(user, ip)).status, 429);
});

test('a successful login also clears the shared address ledger', async () => {
  const ip = '203.0.113.12';

  // One short of the address threshold, spread over usernames so that no single
  // pair locks: the church NAT with several operators fumbling passwords.
  for (let i = 0; i < IP_FAILURE_THRESHOLD - 1; i++) {
    assert.equal((await fail(`nat-fumble-${i}`, ip)).status, 401);
  }
  assert.equal(countRows('ip', ip), IP_FAILURE_THRESHOLD - 1);

  const user = account('nat-operator');
  const ok = await attempt(user, GOOD_PASSWORD, ip);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));

  assert.equal(countRows('ip', ip), 0, 'the address ledger must be cleared too');
  assert.equal((await fail('nat-fumble-again', ip)).status, 401);
});

test('Retry-After counts from the oldest surviving attempt, so it shrinks', async () => {
  const ip = '203.0.113.6';
  const user = account('shrink-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    await fail(user, ip);
  }

  const fresh = Number((await fail(user, ip)).retryAfter);
  assert.ok(fresh > RATE_LIMIT_WINDOW_SECONDS - 10, `got ${fresh}`);

  backdate(user, ip, 600);
  const later = Number((await fail(user, ip)).retryAfter);
  assert.ok(later < fresh, `expected ${later} < ${fresh}`);
  assert.ok(Math.abs(later - (RATE_LIMIT_WINDOW_SECONDS - 600)) <= 5, `got ${later}`);
});

test('Retry-After is clamped to the window when the clock steps backwards', async () => {
  const ip = '203.0.113.13';
  const user = account('skew-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    await fail(user, ip);
  }
  // A backwards clock step leaves rows stamped in the future.
  backdate(user, ip, -100_000);

  const limited = await fail(user, ip);
  assert.equal(limited.status, 429);
  assert.equal(Number(limited.retryAfter), RATE_LIMIT_WINDOW_SECONDS);
});

test('once the window passes, the correct password logs in again', async () => {
  const ip = '203.0.113.7';
  const user = account('window-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    await fail(user, ip);
  }
  assert.equal((await fail(user, ip)).status, 429);

  backdate(user, ip, RATE_LIMIT_WINDOW_SECONDS + 1);

  const ok = await attempt(user, GOOD_PASSWORD, ip);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
});

test('surviving attempts still count after the oldest ones expire', async () => {
  const ip = '203.0.113.8';
  const user = account('partial-window-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    await fail(user, ip);
  }
  // Age everything past the window, then add three fresh failures back.
  backdate(user, ip, RATE_LIMIT_WINDOW_SECONDS + 1);
  for (let i = 0; i < 3; i++) {
    assert.equal((await fail(user, ip)).status, 401);
  }

  assert.equal(
    countRows('user-ip', pairKey(user, ip)),
    3,
    'expired rows must be pruned, not counted'
  );

  assert.equal((await fail(user, ip)).status, 401);
  assert.equal((await fail(user, ip)).status, 401);
  assert.equal((await fail(user, ip)).status, 429);
});

test('the address threshold locks a username that has never failed', async () => {
  const ip = '203.0.113.20';

  // Distinct usernames so no single pair reaches its own threshold.
  for (let i = 0; i < IP_FAILURE_THRESHOLD; i++) {
    const res = await fail(`ip-spray-${i}`, ip);
    assert.equal(res.status, 401, `spray ${i} should be 401`);
  }

  const fresh = account('never-failed-user');
  const blocked = await attempt(fresh, GOOD_PASSWORD, ip);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.retryAfter) > 0);

  // A different client address is unaffected.
  const elsewhere = await attempt(fresh, GOOD_PASSWORD, '203.0.113.21');
  assert.equal(elsewhere.status, 200, JSON.stringify(elsewhere.body));
});

test('the unknown-address bucket never locks anyone out', async () => {
  const user = account('loopback-operator');

  // No forwarding header at all: loopback, LAN, direct-to-box recovery. Well
  // past both thresholds.
  for (let i = 0; i < IP_FAILURE_THRESHOLD + 5; i++) {
    const res = await fail(user, undefined);
    assert.equal(res.status, 401, `headerless attempt ${i + 1} must not be 429`);
    assert.equal(res.retryAfter, null);
  }

  // Nothing was written under the shared bucket name, so no other headerless
  // client inherits a lock either.
  assert.equal(countRows('ip', UNKNOWN_CLIENT_IP), 0);
  assert.equal(countRows('user-ip', pairKey(user, UNKNOWN_CLIENT_IP)), 0);

  const ok = await attempt(user, GOOD_PASSWORD, undefined);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));

  // A separate address is likewise untouched by the headerless flood.
  const elsewhere = await attempt(user, GOOD_PASSWORD, '203.0.113.22');
  assert.equal(elsewhere.status, 200, JSON.stringify(elsewhere.body));
});

test('a junk forwarding header is not trusted as a bucket name', async () => {
  const user = account('junk-header-user');

  // The literal string `unknown` is what legacy proxies put in `x-forwarded-for`
  // and it used to become a shared key. It must not lock anything.
  for (let i = 0; i < IP_FAILURE_THRESHOLD + 5; i++) {
    assert.equal((await fail(user, 'unknown')).status, 401);
  }
  assert.equal(countRows('ip', 'unknown'), 0);
  assert.equal((await attempt(user, GOOD_PASSWORD, 'unknown')).status, 200);
});

test('client ip prefers cf-connecting-ip, then leftmost XFF, then x-real-ip', () => {
  assert.equal(
    getClientIp(
      new Headers({
        'cf-connecting-ip': '1.1.1.1',
        'x-forwarded-for': '2.2.2.2, 3.3.3.3',
        'x-real-ip': '4.4.4.4',
      })
    ),
    '1.1.1.1'
  );
  assert.equal(
    getClientIp(
      new Headers({ 'x-forwarded-for': ' 2.2.2.2 , 3.3.3.3', 'x-real-ip': '4.4.4.4' })
    ),
    '2.2.2.2'
  );
  assert.equal(getClientIp(new Headers({ 'x-real-ip': '4.4.4.4' })), '4.4.4.4');
  assert.equal(getClientIp(new Headers()), UNKNOWN_CLIENT_IP);
  assert.equal(
    getClientIp(new Headers({ 'cf-connecting-ip': '   ', 'x-real-ip': '4.4.4.4' })),
    '4.4.4.4'
  );
});

test('only real addresses are accepted as rate-limit keys', () => {
  assert.equal(parseClientIp('203.0.113.7'), '203.0.113.7');
  assert.equal(parseClientIp(' 203.0.113.7:443 '), '203.0.113.7');
  assert.equal(parseClientIp('2001:DB8::1'), '2001:db8::1');
  assert.equal(parseClientIp('[2001:db8::1]:443'), '2001:db8::1');
  assert.equal(parseClientIp('::ffff:203.0.113.7'), '::ffff:203.0.113.7');
  assert.equal(parseClientIp('fe80::1%eth0'), 'fe80::1');

  for (const junk of [
    'unknown',
    '',
    '   ',
    'not-an-ip',
    '203.0.113',
    '203.0.113.999',
    '01.2.3.4',
    '2001:db8::1::2',
    'x'.repeat(200),
    "203.0.113.7'; DROP TABLE login_attempts;--",
  ]) {
    assert.equal(parseClientIp(junk), null, `should reject: ${junk}`);
  }

  // A junk leftmost entry falls through to the next parseable hop.
  assert.equal(
    getClientIp(new Headers({ 'x-forwarded-for': 'unknown, 198.51.100.9' })),
    '198.51.100.9'
  );
  assert.equal(
    getClientIp(new Headers({ 'cf-connecting-ip': 'not-an-ip' })),
    UNKNOWN_CLIENT_IP
  );
});

test('username keys are case-insensitive, matching the account lookup', async () => {
  const ip = '203.0.113.9';
  const user = account('case-user');

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    await fail(user.toUpperCase(), ip);
  }
  assert.equal((await fail(user, ip)).status, 429);
});

test('an over-long password is refused without charging the ledger', async () => {
  const ip = '203.0.113.14';
  const user = account('long-password-user');
  const huge = 'z'.repeat(129);

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD + 3; i++) {
    const res = await attempt(user, huge, ip);
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, INVALID);
  }

  assert.equal(countRows('user-ip', pairKey(user, ip)), 0);
  assert.equal(countRows('ip', ip), 0);
  assert.equal((await attempt(user, GOOD_PASSWORD, ip)).status, 200);
});

test('an over-long username is refused without charging the ledger', async () => {
  const ip = '203.0.113.15';
  const huge = 'u'.repeat(5000);

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD + 3; i++) {
    const res = await attempt(huge, 'wrong-password', ip);
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, INVALID);
  }

  assert.equal(countRows('ip', ip), 0);
  const fresh = account('long-username-bystander');
  assert.equal((await attempt(fresh, GOOD_PASSWORD, ip)).status, 200);
});

test('change-password throttles current-password guessing', async () => {
  const attackerIp = '203.0.113.30';
  const ownerIp = '203.0.113.31';
  const user = account('cp-victim');
  const row = getAccountByUsername(user);
  const stolenCookie = await signSession({
    uid: row.id,
    role: row.role,
    tv: Number(row.token_version),
  });

  for (let i = 0; i < PAIR_FAILURE_THRESHOLD; i++) {
    const res = await guessCurrentPassword(stolenCookie, 'nope-' + i, attackerIp);
    assert.equal(res.status, 401, JSON.stringify(res.body));
    assert.equal(res.body.error, 'Current password is incorrect');
  }

  const blocked = await guessCurrentPassword(stolenCookie, 'nope-x', attackerIp);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.retryAfter) > 0);
  assert.equal(typeof blocked.body.error, 'string');

  // One ledger: the attacker cannot switch to the login route to keep guessing.
  assert.equal((await attempt(user, GOOD_PASSWORD, attackerIp)).status, 429);
  // The real owner, at their own address, is unaffected.
  assert.equal((await attempt(user, GOOD_PASSWORD, ownerIp)).status, 200);
});

test('the ledger is capped inside the window', () => {
  const db = getDb();
  // Self-contained: this case owns the table so the cap is what is measured.
  db.prepare(`DELETE FROM login_attempts`).run();

  const at = Math.floor(Date.now() / 1000);
  const insert = db.prepare(
    `INSERT INTO login_attempts (scope, key, attempted_at) VALUES (?, ?, ?)`
  );
  const overflow = 1000;
  db.transaction(() => {
    // A flood that rotates its key every request: nothing here is old enough
    // for time-based pruning to touch.
    for (let i = 0; i < MAX_LOGIN_ATTEMPT_ROWS + overflow; i++) {
      insert.run('ip', `198.51.100.${i}`, at);
    }
  })();

  pruneLoginAttempts();

  const row = db.prepare(`SELECT COUNT(*) AS n FROM login_attempts`).get();
  assert.equal(Number(row.n), MAX_LOGIN_ATTEMPT_ROWS);

  db.prepare(`DELETE FROM login_attempts`).run();
});
