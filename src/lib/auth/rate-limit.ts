/**
 * SQLite-backed login throttling.
 *
 * Single node, no external store: every failed credential check appends rows to
 * `login_attempts`, and a later attempt is refused with `429` once a scope has
 * reached its threshold inside the sliding window.
 *
 * ## Scoping, and why it is not per-username
 *
 * The refusal decision is scoped to the **(username, client address) pair**,
 * never to a username on its own. A global per-username counter is a remote
 * account-lockout weapon: anyone who knows the operator's username can send a
 * handful of wrong passwords every window, from anywhere, and the real operator
 * can never sign in again — on a hub that has to work at a fixed hour on
 * Sabbath morning, with no unlock path short of opening the database by hand.
 * Pair scoping keeps the useful half (one attacker cannot grind one account)
 * and drops the harmful half (that attacker cannot deny the account to an
 * operator arriving from a different address).
 *
 * A second, looser scope stays on the address alone, so one client cannot spray
 * many usernames.
 *
 *   user-ip : 5 failures  -> that pair is refused for the rest of the window
 *   ip      : 20 failures -> that address is refused across all usernames
 *
 * ## The residual trade-off, stated honestly
 *
 * A *distributed* attacker now gets more attempts against a single username
 * than a global counter allowed: 5 per source address rather than 5 in total.
 * That is deliberate. Cloudflare sits in front of this origin and is the
 * volumetric layer; a botnet spread thinly enough to beat pair scoping is
 * already past what a SQLite counter can answer, whereas the global counter it
 * replaces handed any single host a permanent, one-request-per-2.5-minutes
 * denial of the admin account. Password strength and `scrypt` remain the real
 * defence against a slow distributed guess.
 *
 * ## The unknown bucket is never throttled
 *
 * `getClientIp` returns `UNKNOWN_CLIENT_IP` when no forwarding header parses.
 * That value is shared by every client reaching the origin without one —
 * loopback, LAN, and the direct-to-box path used for recovery when the tunnel
 * is down — so throttling it would let a few failed attempts lock out the one
 * route back into a wedged box. Requests in that bucket are therefore neither
 * counted nor refused. On the public path cloudflared always sets
 * `cf-connecting-ip`, so the bucket is not reachable from the internet; if the
 * origin is ever exposed without a proxy that sets one of these headers, login
 * throttling is off and Cloudflare-style volumetric protection has to be
 * restored in front of it.
 *
 * `scripts/auth-unlock.mjs` is the operator escape hatch for every case above.
 */

import { UNKNOWN_CLIENT_IP } from '@/lib/auth/client-ip';
import { getDb } from '@/lib/db';

export const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
/** Failures for one (username, address) pair before that pair is refused. */
export const PAIR_FAILURE_THRESHOLD = 5;
/** Failures from one address across any usernames. */
export const IP_FAILURE_THRESHOLD = 20;
/**
 * Hard ceiling on live ledger rows. Time-based pruning alone does not bound the
 * table — a flood that rotates its key on every request stays inside the window
 * — and this ledger lives in the same SQLite file as the worship and member
 * data. Under such a flood the oldest rows are dropped first, which can release
 * a lock early; losing a lock is the cheaper failure.
 */
export const MAX_LOGIN_ATTEMPT_ROWS = 5000;

export type LoginAttemptScope = 'user-ip' | 'ip';

export type LoginRateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

const MAX_KEY_LENGTH = 128;

/**
 * Separator inside a `user-ip` key (US, `0x1f`). It is stripped out of the
 * username half and a validated address can never contain it, so the first
 * occurrence always splits the pair — `scripts/auth-unlock.mjs` depends on that
 * when it resolves `--username` / `--ip`.
 */
const PAIR_SEPARATOR = String.fromCharCode(0x1f);

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Mirrors `normalizeUsername` in `accounts.ts` so keys match the lookup. */
function usernameKey(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .split(PAIR_SEPARATOR)
    .join('')
    .slice(0, MAX_KEY_LENGTH);
}

/** `user` must already be normalized by `usernameKey`. */
function pairKey(user: string, ip: string): string {
  return `${user}${PAIR_SEPARATOR}${ip}`;
}

/** See the header: the shared unknown bucket is deliberately exempt. */
function isThrottleable(ip: string): boolean {
  return Boolean(ip) && ip !== UNKNOWN_CLIENT_IP;
}

/** Opportunistic: drop everything that can no longer influence a decision. */
export function pruneLoginAttempts(): void {
  const db = getDb();
  db.prepare(`DELETE FROM login_attempts WHERE attempted_at < ?`).run(
    nowSeconds() - RATE_LIMIT_WINDOW_SECONDS
  );

  const row = db.prepare(`SELECT COUNT(*) AS n FROM login_attempts`).get() as {
    n: number;
  };
  if (Number(row.n) <= MAX_LOGIN_ATTEMPT_ROWS) return;

  db.prepare(
    `DELETE FROM login_attempts
       WHERE id NOT IN (
         SELECT id FROM login_attempts
          ORDER BY attempted_at DESC, id DESC
          LIMIT ?
       )`
  ).run(MAX_LOGIN_ATTEMPT_ROWS);
}

/**
 * Charge one failed credential check to both scopes. Call this only for an
 * actual credential rejection: a request that could never have matched a stored
 * credential (an over-long password, an over-long username) must not be charged
 * or it becomes a cheap way to buy someone else a lockout.
 */
export function recordLoginFailure(username: string, ip: string): void {
  if (!isThrottleable(ip)) return;
  const user = usernameKey(username);
  if (!user) return;

  const db = getDb();
  const at = nowSeconds();
  const insert = db.prepare(
    `INSERT INTO login_attempts (scope, key, attempted_at) VALUES (?, ?, ?)`
  );
  db.transaction(() => {
    insert.run('user-ip', pairKey(user, ip), at);
    insert.run('ip', ip, at);
  })();
}

/**
 * Clear the ledger after a proven-legitimate credential check.
 *
 * Both scopes are cleared. The address scope matters most: operators behind one
 * NAT'd church address share a bucket, and if only the pair scope reset then a
 * few collective fumbles would lock the whole site out with no number of
 * correct logins able to undo it. Pairs for the same username at *other*
 * addresses are deliberately left alone — a success here says nothing about
 * whoever is guessing from somewhere else.
 */
export function clearLoginFailures(username: string, ip: string): void {
  if (!isThrottleable(ip)) return;
  const user = usernameKey(username);
  if (!user) return;

  const db = getDb();
  const byPair = db.prepare(
    `DELETE FROM login_attempts WHERE scope = 'user-ip' AND key = ?`
  );
  const byIp = db.prepare(
    `DELETE FROM login_attempts WHERE scope = 'ip' AND key = ?`
  );
  db.transaction(() => {
    byPair.run(pairKey(user, ip));
    byIp.run(ip);
  })();
}

/**
 * `retryAfterSeconds` counts from the oldest attempt still inside the window,
 * so it shrinks as the window slides instead of resetting on every rejection.
 * It is clamped to `[1, window]`: a clock that steps backwards would otherwise
 * produce a value far beyond the window the caller is actually waiting on.
 */
function evaluateScope(
  scope: LoginAttemptScope,
  key: string,
  threshold: number,
  now: number
): LoginRateLimitResult {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n, MIN(attempted_at) AS oldest
         FROM login_attempts
        WHERE scope = ? AND key = ? AND attempted_at >= ?`
    )
    .get(scope, key, now - RATE_LIMIT_WINDOW_SECONDS) as {
    n: number;
    oldest: number | null;
  };

  const count = Number(row.n);
  if (count < threshold || row.oldest === null) return { limited: false };

  const retryAfterSeconds = Math.min(
    RATE_LIMIT_WINDOW_SECONDS,
    Math.max(1, Number(row.oldest) + RATE_LIMIT_WINDOW_SECONDS - now)
  );
  return { limited: true, retryAfterSeconds };
}

export function checkLoginRateLimit(
  username: string,
  ip: string
): LoginRateLimitResult {
  pruneLoginAttempts();
  if (!isThrottleable(ip)) return { limited: false };

  const now = nowSeconds();
  const user = usernameKey(username);

  if (user) {
    const byPair = evaluateScope(
      'user-ip',
      pairKey(user, ip),
      PAIR_FAILURE_THRESHOLD,
      now
    );
    if (byPair.limited) return byPair;
  }

  return evaluateScope('ip', ip, IP_FAILURE_THRESHOLD, now);
}
