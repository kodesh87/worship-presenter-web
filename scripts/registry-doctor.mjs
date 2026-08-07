/**
 * Registry template doctor — reports (and optionally applies) which shipped
 * templates a given database has drifted from, and resets the ones an
 * administrator wants reverted.
 *
 * Story 20.1 (AD-17, AC-7) retired the startup self-heal this script used to
 * describe: the seeder now runs once, from zero, and never re-applies a
 * shipped correction to a row afterwards — an edited row and a row a shipped
 * correction changed look identical to a later boot, and both are simply left
 * alone. So there is nothing left to diagnose automatically; this tool now
 * reports one plain fact per template — `missing` (no row at all — an
 * administrator deleted it, or it has never existed here), `current`
 * (byte-identical to the shipped seed) or `edited` (the row differs) — and
 * `--apply` resets every `edited` row to the shipped seed via
 * `resetArtifactTemplate`, the same explicit action `/admin/artifacts`' Reset
 * button takes. It does not, and cannot, reinsert a `missing` row: Story 20.3
 * owns the create verb that would do that.
 *
 * It reuses the application's own `serializeTemplate` / `hashTemplatePayload` /
 * `resetArtifactTemplate` rather than reimplementing the comparison, so it cannot
 * drift from the behaviour it describes. Relaunches itself under the TypeScript
 * loader for that reason.
 *
 *   npm run registry:doctor                       # diagnose the DB_PATH database
 *   npm run registry:doctor -- --ids=welcome,sermon
 *   npm run registry:doctor -- --apply            # reset every `edited` row
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

const readRow = db.prepare(
  `SELECT payload, updated_at, seed_hash FROM artifact_templates WHERE id = ?`
);

/** A direct payload comparison — there is no automatic reseed left to mirror. */
function diagnose(row, template) {
  if (!row) return 'missing';
  if (row.payload === store.serializeTemplate(template)) return 'current';
  return 'edited';
}

const EXPLAIN = {
  missing:
    'no row at all — an administrator deleted it (AC-7: it stays deleted through a restart) or it has never existed here. `--apply` cannot recreate it; Story 20.3 owns the create verb',
  current: 'byte-identical to the shipped seed — nothing to do',
  edited:
    'the row differs from the shipped seed — could be an administrator edit or a shipped correction since; `--apply` resets it to the current seed either way',
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
  if (outcome === 'edited') needsManual.push({ template, row });
}

for (const [outcome, ids] of byOutcome) {
  console.log(`${outcome}  (${ids.length})`);
  console.log(`   ${EXPLAIN[outcome]}`);
  for (const id of ids) console.log(`   - ${id}`);
  console.log('');
}

console.log(
  `templates checked   : ${selected.length} of ${templates.length} in the seed`
);
console.log(`needing manual reset: ${needsManual.length}`);

if (!APPLY) {
  console.log('');
  if (needsManual.length === 0) {
    console.log('Nothing to do by hand.');
  } else {
    console.log(
      'Re-run with --apply to reset the `edited` rows above to the shipped seed.'
    );
    console.log(
      'That discards whatever content is on them now, admin edit or not — there is no automatic path left that would do this for you.'
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
