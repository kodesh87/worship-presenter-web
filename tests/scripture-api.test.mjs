/**
 * GET /api/scripture contract — translation parameter, registry validation, 503.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scripture-api-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const dbModuleUrl =
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href +
  `?scripture-api-${Date.now()}`;
const { getDb } = await import(dbModuleUrl);
getDb();

const { GET } = await import(
  pathToFileURL(path.join(root, 'src', 'app', 'api', 'scripture', 'route.ts')).href
);

function request(search) {
  return { nextUrl: new URL(`http://localhost/api/scripture?${search}`) };
}

test('GET returns 400 for unknown translation', async () => {
  const res = await GET(request('ref=John+3:16&translation=NIV'));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Unknown bible translation "NIV"/);
});

test('GET returns 200 with default translation', async () => {
  const res = await GET(request('ref=John+3:16'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.translation, 'KJV');
  assert.match(body.text, /For God so loved/);
});

test('GET returns 200 with explicit translation', async () => {
  const res = await GET(request('ref=John+3:16&translation=KJV'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.translation, 'KJV');
});

test('GET returns 503 when translation table is empty', async () => {
  const database = getDb();
  database.prepare('DELETE FROM bible_verses WHERE translation_code = ?').run('KJV');
  const res = await GET(request('ref=John+3:16&translation=KJV'));
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.match(body.error, /KJV corpus is empty/);
  assert.match(body.error, /reconciled from that file on boot/);
});
