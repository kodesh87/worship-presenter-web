/**
 * Registry template doctor — reports (and optionally applies) what the artifact
 * registry seeder would do to every shipped template on a given database.
 *
 * Why this exists: the "reset the stale template rows on production" task was
 * written when seeding was insert-missing-only. Startup now self-heals
 * (`reseedArtifactTemplateIfUntouched`), so most rows need nothing — but a row an
 * administrator edited, or one that reached a post-backfill database with no
 * recorded hash, is kept and does need a manual reset. Guessing which is which is
 * how you reset a layout somebody deliberately changed. This reports it instead.
 *
 * It reuses the application's own `serializeTemplate` / `hashTemplatePayload` /
 * `resetArtifactTemplate` rather than reimplementing the comparison, so it cannot
 * drift from the behaviour it describes. Relaunches itself under the TypeScript
 * loader for that reason.
 *
 *   npm run registry:doctor                       # diagnose the DB_PATH database
 *   npm run registry:doctor -- --ids=welcome,sermon
 *   npm run registry:doctor -- --apply            # perform the manual resets
 *   npm run registry:doctor -- --shipped-seed     # ignore data/local override
 *
 * `--apply` writes to the database directly, bypassing the HTTP admin session the
 * /admin/artifacts Reset button goes through. That is deliberate, and the same
 * class of local maintenance access `auth-set-password.mjs` and `import-kjv.mjs`
 * already use. Back up the database file first.
 *
 * The database is opened read-only unless `--apply` is passed.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// `src/lib/registry/seed.ts` resolves the seed file from process.cwd(), so the
// child must run at the repository root regardless of where npm was invoked.
if (!process.env.WPW_REGISTRY_DOCTOR_CHILD) {
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      pathToFileURL(path.join(root, 'tests', 'register-ts-resolve.mjs')).href,
      '--experimental-strip-types',
      fileURLToPath(import.meta.url),
      ...process.argv.slice(2),
    ],
    {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, WPW_REGISTRY_DOCTOR_CHILD: '1' },
    }
  );
  process.exit(result.status ?? 1);
}

const { default: Database } = await import('better-sqlite3');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const idsArg = args.find((a) => a.startsWith('--ids='));
const TARGET_IDS = idsArg
  ? idsArg
      .slice('--ids='.length)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

const dbPath = process.env.DB_PATH || path.join(root, 'data.db');

/**
 * `tests/register-ts-resolve.mjs` — the TypeScript loader this tool rides in on —
 * sets WPW_USE_SHIPPED_REGISTRY=1 so unit tests assert against the committed
 * public seed and ignore a developer's private override. Correct for tests, wrong
 * here: an operational diagnosis must use the seed the app actually uses, which
 * prefers `data/local/default-registry.json`. Undo it unless asked otherwise.
 */
if (args.includes('--shipped-seed')) {
  process.env.WPW_USE_SHIPPED_REGISTRY = '1';
} else {
  delete process.env.WPW_USE_SHIPPED_REGISTRY;
}

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;
const store = await import(srcUrl('lib', 'registry', 'store.ts'));
const seedMod = await import(srcUrl('lib', 'registry', 'seed.ts'));

const templates = seedMod.loadSeedTemplates();

console.log(`database : ${dbPath}`);
console.log(`seed file: ${seedMod.resolveSeedPath()}`);
console.log(`mode     : ${APPLY ? 'APPLY (writes)' : 'diagnose (read-only)'}\n`);

const db = new Database(dbPath, { readonly: !APPLY, fileMustExist: true });

/**
 * Whether the one-time `seed_hash` backfill has run. The whole report turns on
 * this: before it runs, a NULL-hash row is stamped with its own payload hash and
 * then re-seeded in the SAME boot, because `getDb` runs the backfill immediately
 * before `seedArtifactRegistry`. After it has run, a NULL-hash row is kept for
 * good and is the operator's problem.
 */
const backfilled = Boolean(
  db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get('artifact_seed_hash_backfilled')
);

const readRow = db.prepare(
  `SELECT payload, updated_at, seed_hash FROM artifact_templates WHERE id = ?`
);

/** Mirrors reseedArtifactTemplateIfUntouched without writing. */
function diagnose(row, template) {
  if (!row) return 'missing';
  if (row.payload === store.serializeTemplate(template)) return 'already-current';
  if (!row.seed_hash) {
    return backfilled ? 'KEPT-no-recorded-hash' : 'auto-after-backfill';
  }
  if (store.hashTemplatePayload(row.payload) !== row.seed_hash) {
    return 'KEPT-edited-by-admin';
  }
  return 'auto-reseed-on-restart';
}

const EXPLAIN = {
  missing: 'row absent — startup inserts it',
  'already-current': 'byte-identical to the seed — nothing to do',
  'auto-reseed-on-restart':
    'still provably the seed it came from — startup replaces it, no action needed',
  'auto-after-backfill':
    'no recorded hash yet, but the backfill has not run — next boot stamps it then re-seeds it, no action needed',
  'KEPT-no-recorded-hash':
    'no recorded hash and the backfill already ran — startup will NEVER touch it; manual reset required',
  'KEPT-edited-by-admin':
    'payload differs from the hash it was seeded with — an administrator edited it; startup keeps theirs. A manual reset DISCARDS that edit',
};

const selected = TARGET_IDS
  ? templates.filter((t) => TARGET_IDS.includes(t.id))
  : templates;

if (TARGET_IDS) {
  const found = new Set(selected.map((t) => t.id));
  for (const id of TARGET_IDS) {
    if (!found.has(id)) console.log(`!! "${id}" is not in the seed file`);
  }
}

const byOutcome = new Map();
const needsManual = [];

for (const template of selected) {
  const row = readRow.get(template.id);
  const outcome = diagnose(row, template);
  if (!byOutcome.has(outcome)) byOutcome.set(outcome, []);
  byOutcome.get(outcome).push(template.id);
  if (outcome.startsWith('KEPT-')) needsManual.push({ template, row });
}

for (const [outcome, ids] of byOutcome) {
  console.log(`${outcome}  (${ids.length})`);
  console.log(`   ${EXPLAIN[outcome]}`);
  for (const id of ids) console.log(`   - ${id}`);
  console.log('');
}

console.log(
  `seed_hash backfill  : ${backfilled ? 'already run' : 'NOT yet run (next boot runs it)'}`
);
console.log(
  `templates checked   : ${selected.length} of ${templates.length} in the seed`
);
console.log(`needing manual reset: ${needsManual.length}`);

if (!APPLY) {
  console.log('');
  if (needsManual.length === 0) {
    console.log(
      'Nothing to do by hand. A rebuild + restart applies every pending change.'
    );
  } else {
    console.log('Re-run with --apply to reset the KEPT-* rows above.');
    console.log(
      'Read the KEPT-edited-by-admin note first — that reset discards an edit.'
    );
  }
  db.close();
  process.exit(0);
}

if (needsManual.length === 0) {
  console.log('\nNothing to apply.');
  db.close();
  process.exit(0);
}

console.log('\napplying resets:');
let ok = 0;
let failed = 0;
for (const { template, row } of needsManual) {
  try {
    store.resetArtifactTemplate(db, template.id, template, row.updated_at);
    console.log(`   reset  ${template.id}`);
    ok += 1;
  } catch (err) {
    console.error(
      `   FAILED ${template.id}: ${err instanceof Error ? err.message : String(err)}`
    );
    failed += 1;
  }
}
console.log(`\n${ok} reset, ${failed} failed`);
db.close();
process.exit(failed > 0 ? 1 : 0);
