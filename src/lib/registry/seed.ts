import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';
import type { ArtifactTemplate } from './types';
import { validateArtifactTemplateList } from './validate';
import {
  reseedArtifactTemplateIfUntouched,
  RegistryNotFoundError,
  type ReseedOutcome,
} from './store';

const SEED_PATH = path.join(process.cwd(), 'data', 'default-registry.json');

/**
 * Optional private override, git-ignored in full.
 *
 * The committed seed is a worked example with placeholder contact and payment
 * details, because this repository is public and a congregation's real details
 * do not belong in it. A deployment drops its own registry here and the app
 * seeds from that instead — same shape, same validation, never committed.
 *
 * See `docs/PRIVATE-DATA.md`.
 */
const LOCAL_SEED_PATH = path.join(
  process.cwd(),
  'data',
  'local',
  'default-registry.json'
);

/** The private override when present, otherwise the committed seed. */
export function resolveSeedPath(): string {
  return fs.existsSync(LOCAL_SEED_PATH) ? LOCAL_SEED_PATH : SEED_PATH;
}

/**
 * The shipped seed is a build artifact: it cannot change while the process is
 * running, yet it used to be re-read and fully re-validated on every registry
 * snapshot — i.e. on every plan build, which is once per debounced keystroke in
 * the Live Preview. Parse and validate it once per process instead.
 *
 * The cached templates are shared by every caller and must be treated as
 * read-only; nothing in the registry mutates them in place (the store and the
 * snapshot both copy before writing).
 */
let cachedSeedTemplates: ArtifactTemplate[] | null = null;

export function loadSeedTemplates(): ArtifactTemplate[] {
  if (cachedSeedTemplates) return cachedSeedTemplates;

  const seedPath = resolveSeedPath();
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Missing registry seed at ${seedPath}`);
  }
  if (seedPath === LOCAL_SEED_PATH) {
    console.info(
      '[registry] seeding from the private override at data/local/default-registry.json'
    );
  }
  const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as unknown;
  // Only cache after a clean validation, so a bad seed keeps throwing.
  cachedSeedTemplates = validateArtifactTemplateList(raw);
  return cachedSeedTemplates;
}

export type SeedReport = Record<ReseedOutcome, string[]>;

function emptyReport(): SeedReport {
  return {
    inserted: [],
    reseeded: [],
    unchanged: [],
    'skipped-edited': [],
    'skipped-unrecorded': [],
    'skipped-conflict': [],
  };
}

/**
 * Startup is the only moment a corrected template can reach a running hub
 * without an administrator pressing Reset on it, so every outcome is logged.
 *
 * The two decisions an operator has to be able to audit — a row replaced from
 * the seed, and a row deliberately left alone — are logged per template id.
 * `skipped-unrecorded` is a bulk condition — a row that reached the guard with
 * no evidence at all, which the `seed_hash` migration backfill is what keeps
 * from being every row on an upgraded database — so it is logged once as a list
 * rather than one line per template. Rows already byte-identical to the seed are
 * not logged at all, because startup did nothing to them.
 */
function logSeedReport(report: SeedReport) {
  for (const id of report.inserted) {
    console.info(`[registry] seed: inserted "${id}"`);
  }
  for (const id of report.reseeded) {
    console.info(
      `[registry] seed: re-seeded "${id}" (stored row still matched the seed it was seeded from)`
    );
  }
  for (const id of report['skipped-edited']) {
    console.info(
      `[registry] seed: kept "${id}" (edited by an administrator; the shipped seed was not applied)`
    );
  }
  for (const id of report['skipped-conflict']) {
    console.warn(
      `[registry] seed: could not re-seed "${id}" (the row changed while startup was seeding; it was left alone)`
    );
  }
  if (report['skipped-unrecorded'].length > 0) {
    console.info(
      `[registry] seed: kept ${report['skipped-unrecorded'].length} template(s) with no recorded seed hash ` +
        `(written before seed_hash existed, so there is no evidence they are untouched): ` +
        report['skipped-unrecorded'].join(', ')
    );
  }
  console.info(
    `[registry] seed: ${report.inserted.length} inserted, ${report.reseeded.length} re-seeded, ` +
      `${report.unchanged.length} already current, ${report['skipped-edited'].length} kept as edited, ` +
      `${report['skipped-unrecorded'].length} kept without a recorded seed hash, ` +
      `${report['skipped-conflict'].length} left to a concurrent write`
  );
}

/**
 * Insert every missing shipped template and re-seed the ones the administrator
 * has never edited. See {@link reseedArtifactTemplateIfUntouched} for the guard
 * that decides which rows are safe to replace.
 */
export function seedArtifactRegistry(database: Database.Database): SeedReport {
  const templates = loadSeedTemplates();
  const tx = database.transaction(
    (rows: ReturnType<typeof loadSeedTemplates>): SeedReport => {
      const report = emptyReport();
      for (const template of rows) {
        report[reseedArtifactTemplateIfUntouched(database, template)].push(
          template.id
        );
      }
      return report;
    }
  );
  // BEGIN IMMEDIATE, not the default deferred BEGIN: this pass reads every row
  // and then writes, so a deferred transaction takes its read snapshot first and
  // upgrading to a write lock afterwards fails with SQLITE_BUSY_SNAPSHOT, which
  // `busy_timeout` does not retry. Several maintenance scripts open the same
  // file directly (`scripts/auth-unlock.mjs`, `auth-set-password.mjs`,
  // `import-kjv.mjs`), so one of them running while the server boots would
  // otherwise crash startup. Taking the write lock up front closes that window.
  const report = tx.immediate(templates);
  logSeedReport(report);
  return report;
}

export function getSeedTemplateById(id: string) {
  const templates = loadSeedTemplates();
  const found = templates.find((t) => t.id === id);
  if (!found) {
    throw new RegistryNotFoundError(id);
  }
  return found;
}
