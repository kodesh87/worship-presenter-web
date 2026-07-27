/**
 * Services list search + concurrency helpers (unit-level DB).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'services-api-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
process.env.AUTH_BOOTSTRAP_USER = 'admin';
process.env.AUTH_BOOTSTRAP_PASSWORD = 'bootstrap-pass-99';

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { parseRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href
);
const { cleanupExpiredPptxCache, writePptxCache, pptxCacheDir } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'pptx-cache.ts')).href
);
const { setPptxRetentionDays } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'settings.ts')).href
);

test('services table has updated_at; search matches date/raw', () => {
  const db = getDb();
  const parsed = parseRundown('SABBATH, JULY 11, 2026\nSermon: Ada "Hope"');
  db.prepare(
    `INSERT INTO services (date, raw_payload, parsed_data, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  ).run('2026-07-11', 'unique-token-xyz', JSON.stringify(parsed));

  const byDate = db
    .prepare(
      `SELECT id FROM services WHERE date LIKE ? OR raw_payload LIKE ? OR IFNULL(parsed_data,'') LIKE ?`
    )
    .all('%2026-07%', '%2026-07%', '%2026-07%');
  assert.ok(byDate.length >= 1);

  const byRaw = db
    .prepare(
      `SELECT id FROM services WHERE date LIKE ? OR raw_payload LIKE ? OR IFNULL(parsed_data,'') LIKE ?`
    )
    .all('%unique-token-xyz%', '%unique-token-xyz%', '%unique-token-xyz%');
  assert.equal(byRaw.length, 1);

  const row = db
    .prepare(`SELECT updated_at FROM services WHERE id = ?`)
    .get(byRaw[0].id);
  assert.ok(row.updated_at);
});

test('pptx cache retention deletes only old cache files', () => {
  process.env.PPTX_CACHE_DIR = path.join(tmp, 'pptx-cache');
  setPptxRetentionDays(1);
  const filePath = writePptxCache(99, Buffer.from('fake-pptx'));
  assert.ok(fs.existsSync(filePath));

  // Make mtime old
  const old = Date.now() - 3 * 24 * 60 * 60 * 1000;
  fs.utimesSync(filePath, new Date(old), new Date(old));

  const removed = cleanupExpiredPptxCache(Date.now());
  assert.equal(removed, 1);
  assert.ok(!fs.existsSync(filePath));
  assert.ok(fs.existsSync(pptxCacheDir()));
});
