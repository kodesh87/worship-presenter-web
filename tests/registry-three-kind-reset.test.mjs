/**
 * Story 20.2 AC-9: one-time reset when a database carries retired base types.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-three-kind-reset-'));

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const {
  ARTIFACT_REGISTRY_BOOTSTRAP_KEY,
  bootstrapArtifactRegistry,
  CURRENT_DATA_VERSION,
  DATA_VERSION_KEY,
  loadSeedTemplates,
} = await import(srcUrl('lib', 'registry', 'seed.ts'));
const {
  assertContiguousPositions,
  getArtifactTemplate,
} = await import(srcUrl('lib', 'registry', 'store.ts'));
const {
  repairPreThreeKindArtifactRegistry,
} = await import(srcUrl('lib', 'db', 'index.ts'));

/**
 * `getDb()` runs its migrations once per process, so a boot has to *be* a
 * process. This runs the real startup path against `dbFile`.
 */
const BOOT_SCRIPT = path.join(tmp, 'boot-three-kind-reset.mjs');
fs.writeFileSync(
  BOOT_SCRIPT,
  [
    "import path from 'path';",
    "import { pathToFileURL } from 'url';",
    'const { getDb } = await import(',
    "  pathToFileURL(path.join(process.argv[2], 'src', 'lib', 'db', 'index.ts')).href",
    ');',
    'getDb();',
    '',
  ].join('\n')
);

function bootAgainst(dbFile) {
  try {
    return execFileSync(
      process.execPath,
      [
        '--import',
        pathToFileURL(path.join(root, 'tests', 'register-ts-resolve.mjs')).href,
        '--experimental-strip-types',
        BOOT_SCRIPT,
        root,
      ],
      {
        cwd: root,
        env: { ...process.env, DB_PATH: dbFile },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
  } catch (err) {
    throw new Error(
      `boot against ${dbFile} failed\n--- stdout ---\n${err.stdout ?? ''}\n--- stderr ---\n${err.stderr ?? ''}`
    );
  }
}

function openFile(file) {
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  return db;
}

function settingsValue(db, key) {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
  return row?.value;
}

function createPreCollapseDatabase(name) {
  const file = path.join(tmp, name);
  const db = new Database(file);
  db.exec(`
    CREATE TABLE artifact_templates (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      base_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      seed_hash TEXT,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const templates = loadSeedTemplates();
  const welcome = templates.find((t) => t.id === 'welcome');
  const legacy = {
    ...welcome,
    baseType: 'text-placeholder',
  };
  const payload = JSON.stringify(legacy);
  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, position)
     VALUES (?, ?, ?, ?, ?, 0)`
  ).run(legacy.id, legacy.label, 'text-placeholder', payload, '2000-01-01T00:00:00.000Z');

  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`).run(
    ARTIFACT_REGISTRY_BOOTSTRAP_KEY,
    '1'
  );
  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`).run(
    DATA_VERSION_KEY,
    String(CURRENT_DATA_VERSION)
  );
  db.close();
  return file;
}

test('repairPreThreeKindArtifactRegistry clears rows and the bootstrap marker', () => {
  const file = createPreCollapseDatabase('pre-collapse.db');
  const db = openFile(file);

  repairPreThreeKindArtifactRegistry(db);
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get().n,
    0
  );
  assert.equal(settingsValue(db, ARTIFACT_REGISTRY_BOOTSTRAP_KEY), undefined);

  bootstrapArtifactRegistry(db);
  const templates = loadSeedTemplates();
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get().n,
    templates.length
  );
  assertContiguousPositions(db);
  assert.equal(settingsValue(db, DATA_VERSION_KEY), String(CURRENT_DATA_VERSION));
  assert.equal(getArtifactTemplate(db, 'welcome')?.baseType, 'general');

  db.close();
});

test('repairPreThreeKindArtifactRegistry is a no-op once only three kinds exist', () => {
  const file = createPreCollapseDatabase('idempotent.db');
  const db = openFile(file);
  repairPreThreeKindArtifactRegistry(db);
  bootstrapArtifactRegistry(db);
  const before = db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get().n;

  repairPreThreeKindArtifactRegistry(db);
  const after = db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get().n;
  assert.equal(after, before);

  db.close();
});

test('the real getDb() resets a pre-collapse database to the re-authored 38-row seed', () => {
  const file = createPreCollapseDatabase('real-boot.db');

  bootAgainst(file);

  const db = openFile(file);
  const templates = loadSeedTemplates();
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS n FROM artifact_templates`).get().n,
    templates.length,
    'getDb must reset retired base types and re-bootstrap the shipped seed'
  );
  assertContiguousPositions(db);
  assert.equal(settingsValue(db, ARTIFACT_REGISTRY_BOOTSTRAP_KEY), '1');
  assert.equal(settingsValue(db, DATA_VERSION_KEY), String(CURRENT_DATA_VERSION));
  assert.equal(getArtifactTemplate(db, 'welcome')?.baseType, 'general');
  db.close();
});
