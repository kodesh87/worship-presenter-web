/**
 * Self-healing seed: startup re-seeds a template only while the row is
 * provably still the seed it was last seeded or reset from.
 *
 * The guard deliberately does NOT compare the row against the *current*
 * shipped seed — that cannot tell "the administrator edited it" from "we
 * shipped a correction" — so every case here drives a *changed* seed against a
 * row in a known state and asserts which way the guard fell.
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-reseed-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const {
  getArtifactTemplate,
  updateArtifactTemplate,
  resetArtifactTemplate,
  reseedArtifactTemplateIfUntouched,
  serializeTemplate,
  hashTemplatePayload,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'store.ts')).href
);
const { seedArtifactRegistry, getSeedTemplateById, loadSeedTemplates } =
  await import(
    pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'seed.ts')).href
  );

/** A template every case can scribble on: editable, and not read-only. */
const TEMPLATE_ID = 'contact';
const BACKDATED = '2000-01-01T00:00:00.000Z';

function readRow(db, id) {
  return db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at, seed_hash
       FROM artifact_templates WHERE id = ?`
    )
    .get(id);
}

/** A shipped correction: the same template with one element nudged. */
function shippedCorrection(template, x) {
  const layout = template.layouts.default;
  return {
    ...template,
    layouts: {
      ...template.layouts,
      default: {
        ...layout,
        elements: layout.elements.map((element) =>
          element.id === 'e1' ? { ...element, x } : element
        ),
      },
    },
  };
}

/**
 * Put the row back to the shipped seed with a recorded hash, so each case
 * starts from the same state whatever order the file runs in.
 */
function restoreToSeed(db, id = TEMPLATE_ID) {
  const current = getArtifactTemplate(db, id);
  resetArtifactTemplate(db, id, getSeedTemplateById(id), current.updatedAt);
}

/** Force a distinct earlier `updated_at` so timestamp changes are provable. */
function backdate(db, id = TEMPLATE_ID) {
  db.prepare(`UPDATE artifact_templates SET updated_at = ? WHERE id = ?`).run(
    BACKDATED,
    id
  );
}

/**
 * The upgrade path, for real: a database file whose `artifact_templates` has no
 * `seed_hash` column at all and whose rows hold whatever seed shipped last.
 * `mapTemplate` swaps in an older payload for the templates a case cares about.
 */
function createLegacyDatabase(name, mapTemplate = (t) => t) {
  const file = path.join(tmp, name);
  const legacy = new Database(file);
  legacy.exec(`
    CREATE TABLE artifact_templates (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      base_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  const insert = legacy.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  for (const template of loadSeedTemplates()) {
    const stored = mapTemplate(template);
    insert.run(
      stored.id,
      stored.label,
      stored.baseType,
      serializeTemplate(stored),
      BACKDATED
    );
  }
  legacy.close();
  return file;
}

/**
 * `getDb()` runs its migrations once per process, so a boot has to *be* a
 * process. This runs the real startup path — DDL, `seed_hash` migration,
 * seeding — against `dbFile` and returns everything it logged.
 */
const BOOT_SCRIPT = path.join(tmp, 'boot-db.mjs');
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

function openFile(dbFile) {
  return new Database(dbFile);
}

/**
 * A database whose row is snatched away between the guard's read and its write:
 * the re-seed UPDATE is compare-and-swapped on `updated_at`, so a concurrent
 * reset lands and the seeding write matches nothing.
 */
function dbWithConcurrentWriteBeforeReseed(db, id) {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop !== 'prepare') return Reflect.get(target, prop, receiver);
      return (sql) => {
        const statement = target.prepare(sql);
        const isReseedWrite =
          /UPDATE artifact_templates/.test(sql) && /SET label/.test(sql);
        if (!isReseedWrite) return statement;
        return {
          run: (...args) => {
            target
              .prepare(
                `UPDATE artifact_templates SET updated_at = ? WHERE id = ?`
              )
              .run(new Date(Date.now() + 60_000).toISOString(), id);
            return statement.run(...args);
          },
        };
      };
    },
  });
}

test('startup records the seed hash of every inserted row', () => {
  const db = getDb();
  const row = readRow(db, TEMPLATE_ID);
  assert.ok(row, 'expected the seeded row');
  assert.equal(
    row.seed_hash,
    hashTemplatePayload(serializeTemplate(getSeedTemplateById(TEMPLATE_ID)))
  );
  assert.equal(row.payload, serializeTemplate(getSeedTemplateById(TEMPLATE_ID)));
});

test('an untouched row is re-seeded when the shipped seed changes', () => {
  const db = getDb();
  restoreToSeed(db);
  backdate(db);

  const corrected = shippedCorrection(getSeedTemplateById(TEMPLATE_ID), 42.5);
  assert.equal(reseedArtifactTemplateIfUntouched(db, corrected), 'reseeded');

  const row = readRow(db, TEMPLATE_ID);
  assert.equal(row.payload, serializeTemplate(corrected));
  assert.equal(
    getArtifactTemplate(db, TEMPLATE_ID).layouts.default.elements.find(
      (e) => e.id === 'e1'
    ).x,
    42.5
  );

  // The row now records the seed it holds, so the next correction lands too.
  assert.equal(row.seed_hash, hashTemplatePayload(row.payload));
  const nextCorrection = shippedCorrection(
    getSeedTemplateById(TEMPLATE_ID),
    43.5
  );
  assert.equal(
    reseedArtifactTemplateIfUntouched(db, nextCorrection),
    'reseeded'
  );

  restoreToSeed(db);
});

test('a re-seed advances updatedAt like any other write', () => {
  const db = getDb();
  restoreToSeed(db);
  backdate(db);
  assert.equal(readRow(db, TEMPLATE_ID).updated_at, BACKDATED);

  const corrected = shippedCorrection(getSeedTemplateById(TEMPLATE_ID), 11.25);
  assert.equal(reseedArtifactTemplateIfUntouched(db, corrected), 'reseeded');

  const after = readRow(db, TEMPLATE_ID).updated_at;
  assert.notEqual(after, BACKDATED);
  assert.ok(Date.parse(after) > Date.parse(BACKDATED));

  restoreToSeed(db);
});

test('a row already holding the current seed is left completely alone', () => {
  const db = getDb();
  restoreToSeed(db);
  backdate(db);

  const seed = getSeedTemplateById(TEMPLATE_ID);
  assert.equal(reseedArtifactTemplateIfUntouched(db, seed), 'unchanged');
  // No churn: an untouched startup must not move `updatedAt` under an open
  // editor holding that value for optimistic concurrency.
  assert.equal(readRow(db, TEMPLATE_ID).updated_at, BACKDATED);

  restoreToSeed(db);
});

test("an edited row is preserved even when the shipped seed changed", () => {
  const db = getDb();
  restoreToSeed(db);

  const before = getArtifactTemplate(db, TEMPLATE_ID);
  const adminEdit = shippedCorrection(before, 77.75);
  const { updatedAt: _ignored, ...body } = adminEdit;
  const saved = updateArtifactTemplate(db, TEMPLATE_ID, body, before.updatedAt);
  assert.equal(
    saved.layouts.default.elements.find((e) => e.id === 'e1').x,
    77.75
  );
  const afterEdit = readRow(db, TEMPLATE_ID);

  // An administrator's save must not re-record the seed hash: leaving the old
  // one in place is exactly what makes the next startup read this as edited.
  assert.equal(
    afterEdit.seed_hash,
    hashTemplatePayload(serializeTemplate(getSeedTemplateById(TEMPLATE_ID)))
  );
  assert.notEqual(hashTemplatePayload(afterEdit.payload), afterEdit.seed_hash);

  const corrected = shippedCorrection(getSeedTemplateById(TEMPLATE_ID), 5.5);
  assert.equal(
    reseedArtifactTemplateIfUntouched(db, corrected),
    'skipped-edited'
  );

  const afterSeed = readRow(db, TEMPLATE_ID);
  assert.equal(afterSeed.payload, afterEdit.payload);
  assert.equal(afterSeed.updated_at, afterEdit.updated_at);

  restoreToSeed(db);
});

test('a row that reaches the guard with no recorded seed hash is preserved', () => {
  const db = getDb();
  restoreToSeed(db);
  backdate(db);
  // Content that still matches an old seed, with no evidence that it does. On a
  // real upgrade the `seed_hash` migration backfills this state away before the
  // guard ever sees it (see the migration cases below); this pins what the
  // guard does if it is reached anyway.
  db.prepare(
    `UPDATE artifact_templates SET seed_hash = NULL WHERE id = ?`
  ).run(TEMPLATE_ID);
  const before = readRow(db, TEMPLATE_ID);
  assert.equal(before.seed_hash, null);

  const corrected = shippedCorrection(getSeedTemplateById(TEMPLATE_ID), 9.5);
  assert.equal(
    reseedArtifactTemplateIfUntouched(db, corrected),
    'skipped-unrecorded'
  );

  const after = readRow(db, TEMPLATE_ID);
  assert.equal(after.payload, before.payload);
  assert.equal(after.updated_at, BACKDATED);
  assert.equal(after.seed_hash, null);

  restoreToSeed(db);
});

test('a missing row is inserted with its seed hash recorded', () => {
  const db = getDb();
  db.prepare(`DELETE FROM artifact_templates WHERE id = ?`).run(TEMPLATE_ID);
  assert.equal(readRow(db, TEMPLATE_ID), undefined);

  const report = seedArtifactRegistry(db);
  assert.deepEqual(report.inserted, [TEMPLATE_ID]);

  const row = readRow(db, TEMPLATE_ID);
  assert.ok(row);
  assert.equal(row.payload, serializeTemplate(getSeedTemplateById(TEMPLATE_ID)));
  assert.equal(row.seed_hash, hashTemplatePayload(row.payload));
});

test('reset restores the current shipped seed and re-records the hash', () => {
  const db = getDb();
  restoreToSeed(db);

  // Drift the row away from the seed *and* away from its recorded hash.
  const before = getArtifactTemplate(db, TEMPLATE_ID);
  const { updatedAt: _ignored, ...body } = shippedCorrection(before, 61.25);
  const edited = updateArtifactTemplate(
    db,
    TEMPLATE_ID,
    body,
    before.updatedAt
  );
  db.prepare(`UPDATE artifact_templates SET seed_hash = ? WHERE id = ?`).run(
    'stale-hash-from-an-older-seed',
    TEMPLATE_ID
  );

  const seed = getSeedTemplateById(TEMPLATE_ID);
  const reset = resetArtifactTemplate(db, TEMPLATE_ID, seed, edited.updatedAt);
  assert.equal(
    reset.layouts.default.elements.find((e) => e.id === 'e1').x,
    seed.layouts.default.elements.find((e) => e.id === 'e1').x
  );

  const row = readRow(db, TEMPLATE_ID);
  assert.equal(row.payload, serializeTemplate(seed));
  assert.equal(row.seed_hash, hashTemplatePayload(serializeTemplate(seed)));

  // The re-recorded hash makes the row eligible for the next correction.
  backdate(db);
  assert.equal(
    reseedArtifactTemplateIfUntouched(db, shippedCorrection(seed, 33.25)),
    'reseeded'
  );

  restoreToSeed(db);
});

test('a stale hash on a row that already holds the current seed is repaired', () => {
  const db = getDb();
  restoreToSeed(db);
  backdate(db);
  // The administrator hand-applied the same correction the team is shipping:
  // the payload matches the seed, the recorded hash does not. Left stale, this
  // row would report `skipped-edited` for every *future* correction.
  db.prepare(`UPDATE artifact_templates SET seed_hash = ? WHERE id = ?`).run(
    'stale-hash-from-an-older-seed',
    TEMPLATE_ID
  );

  const seed = getSeedTemplateById(TEMPLATE_ID);
  assert.equal(reseedArtifactTemplateIfUntouched(db, seed), 'unchanged');

  const row = readRow(db, TEMPLATE_ID);
  assert.equal(row.seed_hash, hashTemplatePayload(serializeTemplate(seed)));
  assert.equal(row.payload, serializeTemplate(seed));
  // Repairing the evidence is not a write to the template: an open editor
  // holding this timestamp for optimistic concurrency must not be invalidated.
  assert.equal(row.updated_at, BACKDATED);

  // And the repair is what puts the row back in reach of the next correction.
  assert.equal(
    reseedArtifactTemplateIfUntouched(db, shippedCorrection(seed, 21.5)),
    'reseeded'
  );

  restoreToSeed(db);
});

test('a re-seed whose compare-and-swap matches nothing is reported as a conflict', () => {
  const db = getDb();
  restoreToSeed(db);
  backdate(db);

  const before = readRow(db, TEMPLATE_ID);
  const corrected = shippedCorrection(getSeedTemplateById(TEMPLATE_ID), 8.75);
  assert.equal(
    reseedArtifactTemplateIfUntouched(
      dbWithConcurrentWriteBeforeReseed(db, TEMPLATE_ID),
      corrected
    ),
    'skipped-conflict'
  );

  // Nothing was written, so the operator log must not claim a re-seed.
  const after = readRow(db, TEMPLATE_ID);
  assert.equal(after.payload, before.payload);
  assert.equal(after.seed_hash, before.seed_hash);

  restoreToSeed(db);
});

test('seedArtifactRegistry reports every shipped template exactly once', () => {
  const db = getDb();
  const report = seedArtifactRegistry(db);
  const seen = [
    ...report.inserted,
    ...report.reseeded,
    ...report.unchanged,
    ...report['skipped-edited'],
    ...report['skipped-unrecorded'],
    ...report['skipped-conflict'],
  ];
  const seedIds = loadSeedTemplates().map((t) => t.id);
  assert.equal(new Set(seen).size, seen.length, 'a template was reported twice');
  assert.deepEqual(new Set(seen), new Set(seedIds));
});

/**
 * The migration path — the only one that exists on the hub this feature was
 * built for. These boot the real `getDb()` in a child process against a
 * database file that predates the `seed_hash` column.
 */

test('a database predating seed_hash is migrated and re-seeded on the next boot', () => {
  const seed = getSeedTemplateById(TEMPLATE_ID);
  // Exactly what an upgrade finds: the row holds the *older* shipped seed, so
  // it matches neither the new seed nor any recorded hash.
  const file = createLegacyDatabase('legacy-untouched.db', (template) =>
    template.id === TEMPLATE_ID ? shippedCorrection(template, 3.75) : template
  );

  const logs = bootAgainst(file);

  const legacy = openFile(file);
  const row = readRow(legacy, TEMPLATE_ID);
  legacy.close();

  const seedPayload = serializeTemplate(seed);
  assert.equal(row.payload, seedPayload, 'the legacy row was never re-seeded');
  assert.equal(row.seed_hash, hashTemplatePayload(seedPayload));
  assert.notEqual(row.updated_at, BACKDATED);

  const total = loadSeedTemplates().length;
  assert.match(
    logs,
    new RegExp(`recorded a seed hash for ${total} template\\(s\\)`),
    `expected the migration to stamp all ${total} legacy rows:\n${logs}`
  );
  assert.match(logs, /0 inserted, 1 re-seeded/, logs);
  assert.match(logs, /0 kept without a recorded seed hash/, logs);
});

test('the seed_hash backfill does not re-arm a row edited after the migration', () => {
  const file = createLegacyDatabase('legacy-then-edited.db', (template) =>
    template.id === TEMPLATE_ID ? shippedCorrection(template, 4.75) : template
  );
  bootAgainst(file);

  // The administrator saves a layout on the migrated database.
  const upgraded = openFile(file);
  const current = getArtifactTemplate(upgraded, TEMPLATE_ID);
  const { updatedAt: _ignored, ...body } = shippedCorrection(current, 88.5);
  const edited = updateArtifactTemplate(
    upgraded,
    TEMPLATE_ID,
    body,
    current.updatedAt
  );
  upgraded.close();

  const logs = bootAgainst(file);

  const after = openFile(file);
  const row = readRow(after, TEMPLATE_ID);
  after.close();

  assert.equal(
    JSON.parse(row.payload).layouts.default.elements.find((e) => e.id === 'e1')
      .x,
    88.5,
    'the administrator edit was overwritten by a second migration'
  );
  assert.notEqual(
    row.payload,
    serializeTemplate(getSeedTemplateById(TEMPLATE_ID)),
    'the row was reset to the shipped seed'
  );
  assert.equal(row.updated_at, edited.updatedAt);
  assert.match(logs, /0 inserted, 0 re-seeded/, logs);
  assert.match(logs, /1 kept as edited/, logs);
});
