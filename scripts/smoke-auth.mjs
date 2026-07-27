/**
 * Smoke: unauth redirect / operator 403 on admin / last-admin delete / no bible.
 * Spins up `next start` against a temp SQLite DB (does not touch data.db).
 */
import { spawn } from 'child_process';
import { createHash, randomBytes, scryptSync } from 'crypto';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    console.error(`FAIL  ${name}`);
    failed += 1;
  }
}

// --- No bible / KJV imports in app source ---
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      walk(p, out);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

const srcFiles = walk(path.join(root, 'src'));
let bibleHit = null;
for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (
    /tp_bible|kjv|bible_verses|bible_book_translations/i.test(text) ||
    /\.work[/\\]tp_bible/i.test(text)
  ) {
    bibleHit = file;
    break;
  }
}
check('no bible/kjv imports in src/', bibleHit === null);
if (bibleHit) console.error('  found in', path.relative(root, bibleHit));

// Next 16 renamed the middleware convention to `proxy` (Node.js runtime).
const mw = fs.readFileSync(path.join(root, 'src', 'proxy.ts'), 'utf8');
check(
  'proxy does not use AUTH_PASSWORD / Basic Auth',
  !/AUTH_PASSWORD/.test(mw) && !/WWW-Authenticate/.test(mw) && !/basicAuth/.test(mw)
);
check(
  'proxy matcher excludes api/webhook',
  /api\/webhook/.test(mw)
);

// --- Last-admin delete (DB helper parity) ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-smoke-'));
const unitDbPath = path.join(tmp, 'unit.db');
const unitDb = new Database(unitDbPath);

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}$${hash.toString('hex')}`;
}

unitDb.exec(`
  CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

unitDb
  .prepare(
    `INSERT INTO accounts (username, password_hash, role) VALUES (?, ?, 'admin')`
  )
  .run('solo', hashPassword('password123'));

function countAdmins(db) {
  return Number(
    db.prepare(`SELECT COUNT(*) AS n FROM accounts WHERE role = 'admin'`).get()
      .n
  );
}

function tryDelete(db, id) {
  const row = db
    .prepare(`SELECT id, role FROM accounts WHERE id = ?`)
    .get(id);
  if (!row) throw new Error('account not found');
  if (row.role === 'admin' && countAdmins(db) <= 1) {
    throw new Error('Cannot delete the last admin');
  }
  db.prepare(`DELETE FROM accounts WHERE id = ?`).run(id);
}

let lastAdminBlocked = false;
try {
  tryDelete(unitDb, 1);
} catch (e) {
  lastAdminBlocked = /last admin/i.test(String(e.message));
}
check('last-admin delete blocked (unit)', lastAdminBlocked);

unitDb
  .prepare(
    `INSERT INTO accounts (username, password_hash, role) VALUES (?, ?, 'admin')`
  )
  .run('second', hashPassword('password123'));
tryDelete(unitDb, 1);
check(
  'can delete admin when another admin remains',
  countAdmins(unitDb) === 1
);
unitDb.close();

// --- HTTP smoke against next start ---
const port = 3457 + Math.floor(Math.random() * 200);
const dbPath = path.join(tmp, 'http.db');
const AUTH_SECRET = createHash('sha256').update(`smoke-${Date.now()}`).digest('hex');
const WEBHOOK_SECRET = 'smoke-webhook-secret';
const BOOTSTRAP_USER = 'admin';
const BOOTSTRAP_PASSWORD = 'bootstrap-pass-99';

function fetchRaw(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: opts.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function parseSetCookie(header) {
  if (!header) return null;
  const list = Array.isArray(header) ? header : [header];
  for (const c of list) {
    const m = /^auth_session=([^;]+)/.exec(c);
    if (m) return m[1];
  }
  return null;
}

async function waitForServer(base, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchRaw(`${base}/login`);
      if (res.status && res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not become ready');
}

const nextBin = path.join(
  root,
  'node_modules',
  'next',
  'dist',
  'bin',
  'next'
);
const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    DB_PATH: dbPath,
    AUTH_SECRET,
    AUTH_BOOTSTRAP_USER: BOOTSTRAP_USER,
    AUTH_BOOTSTRAP_PASSWORD: BOOTSTRAP_PASSWORD,
    WEBHOOK_SECRET,
    NODE_ENV: 'production',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverLog = '';
child.stdout.on('data', (d) => {
  serverLog += d.toString();
});
child.stderr.on('data', (d) => {
  serverLog += d.toString();
});

const base = `http://127.0.0.1:${port}`;

try {
  await waitForServer(base);

  const unauth = await fetchRaw(`${base}/`);
  const loc = unauth.headers.location || '';
  check(
    'unauthenticated GET / redirects to /login',
    (unauth.status === 307 || unauth.status === 302 || unauth.status === 303) &&
      /\/login/.test(loc)
  );
  check(
    'unauthenticated hub does not leak Services markup',
    !/No Services Found|Worship Hub<\/h1>/i.test(unauth.body) ||
      /\/login/.test(loc)
  );

  const unauthApi = await fetchRaw(`${base}/api/announcements`);
  check('unauthenticated API returns 401 JSON', unauthApi.status === 401);

  const badLogin = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: BOOTSTRAP_USER, password: 'wrong-password' }),
  });
  check('bad login returns 401', badLogin.status === 401);

  const adminLogin = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: BOOTSTRAP_USER,
      password: BOOTSTRAP_PASSWORD,
    }),
  });
  const adminCookie = parseSetCookie(adminLogin.headers['set-cookie']);
  check('admin login succeeds', adminLogin.status === 200 && !!adminCookie);

  const createOp = await fetchRaw(`${base}/api/admin/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_session=${adminCookie}`,
    },
    body: JSON.stringify({
      username: 'operator1',
      password: 'operator-pass-99',
      role: 'operator',
    }),
  });
  check('admin can create operator', createOp.status === 201);

  const opLogin = await fetchRaw(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'operator1',
      password: 'operator-pass-99',
    }),
  });
  const opCookie = parseSetCookie(opLogin.headers['set-cookie']);
  check('operator login succeeds', opLogin.status === 200 && !!opCookie);

  const opHub = await fetchRaw(`${base}/`, {
    headers: { Cookie: `auth_session=${opCookie}` },
  });
  check(
    'operator can access hub',
    opHub.status === 200 && /Worship Hub/i.test(opHub.body)
  );

  const opAdminPage = await fetchRaw(`${base}/admin`, {
    headers: { Cookie: `auth_session=${opCookie}` },
  });
  check('operator GET /admin → 403', opAdminPage.status === 403);

  const opAdminApi = await fetchRaw(`${base}/api/admin/accounts`, {
    headers: { Cookie: `auth_session=${opCookie}` },
  });
  check('operator GET /api/admin/accounts → 403', opAdminApi.status === 403);

  // Resolve bootstrap admin id, then try delete as last admin
  const listRes = await fetchRaw(`${base}/api/admin/accounts`, {
    headers: { Cookie: `auth_session=${adminCookie}` },
  });
  const listJson = JSON.parse(listRes.body);
  const adminId = listJson.accounts.find((a) => a.username === BOOTSTRAP_USER)?.id;
  const opId = listJson.accounts.find((a) => a.username === 'operator1')?.id;

  // Delete operator first so only one admin remains, then block admin delete
  if (opId) {
    await fetchRaw(`${base}/api/admin/accounts/${opId}`, {
      method: 'DELETE',
      headers: { Cookie: `auth_session=${adminCookie}` },
    });
  }
  const delLast = await fetchRaw(`${base}/api/admin/accounts/${adminId}`, {
    method: 'DELETE',
    headers: { Cookie: `auth_session=${adminCookie}` },
  });
  const delBody = JSON.parse(delLast.body || '{}');
  check(
    'HTTP last-admin delete blocked',
    delLast.status === 400 && /last admin/i.test(String(delBody.error || ''))
  );

  const webhook = await fetchRaw(`${base}/api/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ text: 'smoke rundown placeholder' }),
  });
  // Valid secret reaches the handler (payload may still 400); must not redirect/session-401.
  check(
    'webhook with secret reaches handler (no session gate)',
    webhook.status !== 302 &&
      webhook.status !== 307 &&
      webhook.status !== 303 &&
      !(webhook.status === 401 && /Unauthorized/.test(webhook.body) && !WEBHOOK_SECRET)
  );
  check(
    'webhook with secret is not hub-session 401',
    webhook.status !== 401
  );
  const webhookNoSecret = await fetchRaw(`${base}/api/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'smoke' }),
  });
  check('webhook without secret → 401', webhookNoSecret.status === 401);
} catch (e) {
  console.error('FAIL  HTTP smoke error:', e);
  console.error(serverLog.slice(-2000));
  failed += 1;
} finally {
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
  // Give the server a moment to exit before cleaning temp DB (Windows file locks)
  await new Promise((r) => setTimeout(r, 500));
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll auth smoke checks passed');
