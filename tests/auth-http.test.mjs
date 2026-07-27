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
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const nextDir = path.join(root, '.next');
if (!fs.existsSync(nextDir)) {
  throw new Error('Run `npm run build` before auth-http tests');
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-http-test-'));
const port = 3500 + Math.floor(Math.random() * 200);
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

async function waitForServer(base, attempts = 60) {
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
const base = `http://127.0.0.1:${port}`;

before(async () => {
  child = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
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
  await waitForServer(base);
});

after(() => {
  if (child && !child.killed) {
    child.kill('SIGTERM');
  }
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
