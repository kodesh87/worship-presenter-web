/**
 * Auth middleware HTTP: unauthenticated API → 401.
 * Requires `npm run build` first. Uses temp SQLite.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/**
 * This is the only suite that asserts against the **built** app rather than
 * against `src/` directly, which makes it the only one that can go stale.
 *
 * Until 2026-08-01 the precondition below was `existsSync('.next')` — presence,
 * not freshness. A fresh worktree has no `.next` and failed loudly, which was
 * fine; the dangerous case was the other one. Build once, edit `src/proxy.ts`,
 * run `npm test`, and this suite would spawn the *previous* build, prove the
 * old gate still refuses an unauthenticated call, and pass — a green tick over
 * code that no longer exists. Every other suite loads `src/**` through the
 * strip-types loader and cannot drift this way.
 *
 * CI was never exposed (`npm ci` → `npm run build` → `npm test`, fresh runner).
 * What was exposed is local feedback on AD-5, the gate this repo guards hardest.
 *
 * `BUILD_ID` is the marker because Next writes it when a build *completes*, so
 * an interrupted build cannot leave a timestamp that reads as current. Touching
 * a file without changing it will demand a rebuild — this errs toward failing
 * loudly, which is the whole point of the change.
 */
const nextDir = path.join(root, '.next');
const buildId = path.join(nextDir, 'BUILD_ID');
const REBUILD = 'Run `npm run build` before auth-http tests';

if (!fs.existsSync(buildId)) {
  throw new Error(REBUILD);
}

const builtAt = fs.statSync(buildId).mtimeMs;

/** Everything whose change lands in the build output. */
const BUILD_INPUTS = [
  'src',
  'next.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
  'components.json',
  'package.json',
];

function newestChange(target) {
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return { at: stat.mtimeMs, file: target };
  let newest = { at: stat.mtimeMs, file: target };
  for (const entry of fs.readdirSync(target)) {
    const found = newestChange(path.join(target, entry));
    if (found.at > newest.at) newest = found;
  }
  return newest;
}

for (const input of BUILD_INPUTS) {
  const full = path.join(root, input);
  if (!fs.existsSync(full)) continue;
  const { at, file } = newestChange(full);
  if (at > builtAt) {
    throw new Error(
      `${REBUILD} — ${path.relative(root, file)} changed after the build, so this suite would test the previous one`
    );
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-http-test-'));
const dbPath = path.join(tmp, 'http.db');
const AUTH_SECRET = createHash('sha256')
  .update(`auth-http-${Date.now()}`)
  .digest('hex');
const WEBHOOK_SECRET = 'test-webhook-secret';

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

/**
 * Ask the OS for a free port instead of guessing one.
 *
 * This used to be `3500 + random(200)`, which collides: the suite runs its files in
 * parallel, so two runs — or one run and any other process on the machine — can pick
 * the same number. Binding port 0 makes the kernel choose a port it knows is free.
 * There is still a gap between closing this listener and Next binding it, so the
 * caller retries; that gap is a race, whereas a guess was a coin flip.
 */
function reservePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(base, attempts = 120) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchRaw(`${base}/login`);
      if (res.status && res.status < 500) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not become ready');
}

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
let child;
let base;

/** Start Next on `port`, capturing its output so a failure can explain itself. */
function startServer(port) {
  const proc = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: dbPath,
      AUTH_SECRET,
      AUTH_BOOTSTRAP_USER: 'admin',
      AUTH_BOOTSTRAP_PASSWORD: 'bootstrap-pass-99',
      WEBHOOK_SECRET,
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // stdio was already piped and then never read. When the server failed to come up,
  // the only evidence was "Server did not become ready" — the reason it gave was
  // sitting unread in a pipe. Drain both streams so the error can quote them.
  const output = [];
  proc.stdout.on('data', (c) => output.push(c.toString()));
  proc.stderr.on('data', (c) => output.push(c.toString()));
  return { proc, output };
}

function stop(proc) {
  if (proc && !proc.killed) proc.kill('SIGTERM');
}

before(async () => {
  const failures = [];
  // Retry the whole start: the reserve-then-bind gap can lose a port to another
  // process, and losing it should cost one retry rather than the whole file.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const port = await reservePort();
    const started = startServer(port);
    try {
      await waitForServer(`http://127.0.0.1:${port}`);
      child = started.proc;
      base = `http://127.0.0.1:${port}`;
      return;
    } catch (err) {
      stop(started.proc);
      failures.push(`attempt ${attempt} on port ${port}: ${err.message}\n${started.output.join('')}`);
    }
  }
  throw new Error(`Server did not become ready after 3 attempts:\n${failures.join('\n---\n')}`);
});

after(() => {
  stop(child);
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

test('unauthenticated API returns 401', async () => {
  const res = await fetchRaw(`${base}/api/announcements`);
  assert.equal(res.status, 401);
});

test('webhook wrong secret returns 401', async () => {
  const res = await fetchRaw(`${base}/api/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'nope',
    },
    body: JSON.stringify({ text: 'SABBATH, JULY 11, 2026\n' }),
  });
  assert.equal(res.status, 401);
});

test('webhook missing secret returns 401', async () => {
  const res = await fetchRaw(`${base}/api/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'SABBATH, JULY 11, 2026\n' }),
  });
  assert.equal(res.status, 401);
});
