import { createHash } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  ArtifactBaseType,
  ArtifactTemplate,
  ArtifactTemplateSummary,
  StoredArtifactTemplate,
} from './types';
import { READ_ONLY_BASE_TYPES } from './types';
import { RegistryValidationError, validateArtifactTemplate } from './validate';
import { getSeedTemplateById } from './seed';

export class RegistryNotFoundError extends Error {
  constructor(id: string) {
    super(`Unknown template: ${id}`);
    this.name = 'RegistryNotFoundError';
  }
}

export class RegistryStaleError extends Error {
  constructor() {
    super('Template was modified by another session');
    this.name = 'RegistryStaleError';
  }
}

type Row = {
  id: string;
  label: string;
  base_type: string;
  payload: string;
  updated_at: string;
};

function rowToStored(row: Row): StoredArtifactTemplate {
  const parsed = JSON.parse(row.payload) as ArtifactTemplate;
  return { ...parsed, updatedAt: row.updated_at };
}

/**
 * Serialized form of a template as it is persisted. Both the seed loader and
 * every write path go through the validator first, which rebuilds each object
 * with a fixed key order, so two templates with the same content always
 * serialize to the same bytes.
 */
export function serializeTemplate(template: ArtifactTemplate): string {
  return JSON.stringify(template);
}

/** Content hash of a persisted payload string. */
export function hashTemplatePayload(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * What startup did with one seed template.
 *
 * The `skipped-*` outcomes are the whole point of `seed_hash`: comparing the
 * stored row against the *current* shipped seed cannot tell "the administrator
 * edited it" from "we shipped a correction", so the row instead records the
 * hash of the seed payload it was last seeded or reset from.
 *
 * `skipped-conflict` is not a decision this guard made: it means the row moved
 * underneath the pass, so the compare-and-swap wrote nothing.
 */
export type ReseedOutcome =
  | 'inserted'
  | 'reseeded'
  | 'unchanged'
  | 'skipped-edited'
  | 'skipped-unrecorded'
  | 'skipped-conflict';

export function listArtifactSummaries(
  db: Database.Database
): ArtifactTemplateSummary[] {
  const rows = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at
       FROM artifact_templates
       ORDER BY label COLLATE NOCASE`
    )
    .all() as Row[];

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    baseType: row.base_type as ArtifactBaseType,
    updatedAt: row.updated_at,
    editable: !READ_ONLY_BASE_TYPES.has(row.base_type as ArtifactBaseType),
  }));
}

export function getArtifactTemplate(
  db: Database.Database,
  id: string
): StoredArtifactTemplate | null {
  const row = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at
       FROM artifact_templates WHERE id = ?`
    )
    .get(id) as Row | undefined;
  if (!row) return null;
  return rowToStored(row);
}

/**
 * Element authoring stability rules (Story 16.5).
 *
 * An administrator may add their own elements and delete the ones they added,
 * but the shipped skeleton must survive every save:
 *  - every element id present in the seed layout must still be present;
 *  - a seeded element's `required` flag may not be changed: flipping it to
 *    `true` would make every later plan build hard-fail hydration for the slide;
 *  - every currently persisted element marked `required` must still be present;
 *  - ids beyond that are the administrator's own and are free to come and go.
 *
 * Duplicate/empty element ids are already rejected by `validateArtifactTemplate`,
 * which runs before this check.
 */
function assertStableAgainstSeed(
  incoming: ArtifactTemplate,
  existing: ArtifactTemplate
) {
  const seed = getSeedTemplateById(incoming.id);
  if (incoming.baseType !== seed.baseType) {
    throw new RegistryValidationError('baseType cannot be changed');
  }

  const seedPlaceholderKeys = new Set(seed.placeholders.map((p) => p.key));
  const incomingPlaceholderKeys = new Set(incoming.placeholders.map((p) => p.key));
  if (seedPlaceholderKeys.size !== incomingPlaceholderKeys.size) {
    throw new RegistryValidationError('placeholder keys cannot be added or removed');
  }
  for (const key of seedPlaceholderKeys) {
    if (!incomingPlaceholderKeys.has(key)) {
      throw new RegistryValidationError(`missing placeholder key: ${key}`);
    }
  }

  const seedLayoutKeys = Object.keys(seed.layouts);
  const incomingLayoutKeys = Object.keys(incoming.layouts);
  if (seedLayoutKeys.length !== incomingLayoutKeys.length) {
    throw new RegistryValidationError('layouts cannot be added or removed');
  }
  for (const layoutKey of seedLayoutKeys) {
    const seedLayout = seed.layouts[layoutKey as keyof typeof seed.layouts];
    const incomingLayout = incoming.layouts[layoutKey as keyof typeof incoming.layouts];
    if (!seedLayout || !incomingLayout) {
      throw new RegistryValidationError(`missing layout: ${layoutKey}`);
    }
    const incomingById = new Map<string, (typeof incomingLayout.elements)[number]>();
    for (const element of incomingLayout.elements) {
      if (!element.id.trim()) {
        throw new RegistryValidationError(
          `element id is required in layout ${layoutKey}`
        );
      }
      if (incomingById.has(element.id)) {
        throw new RegistryValidationError(
          `duplicate element id ${element.id} in layout ${layoutKey}`
        );
      }
      incomingById.set(element.id, element);
    }
    const incomingElementIds = new Set(incomingById.keys());

    const existingLayout =
      existing.layouts[layoutKey as keyof typeof existing.layouts];
    const existingById = new Map(
      (existingLayout?.elements ?? []).map((element) => [element.id, element])
    );

    for (const seedElement of seedLayout.elements) {
      const incomingElement = incomingById.get(seedElement.id);
      if (!incomingElement) {
        throw new RegistryValidationError(
          `element ${seedElement.id} is part of the shipped template and cannot be removed or renamed in layout ${layoutKey}`
        );
      }
      // The stored row is the baseline, so a template that already drifted can
      // still be saved — but the flip itself is always refused.
      const baseline = existingById.get(seedElement.id) ?? seedElement;
      if (Boolean(incomingElement.required) !== Boolean(baseline.required)) {
        throw new RegistryValidationError(
          `element ${seedElement.id} is part of the shipped template and its required flag cannot be changed in layout ${layoutKey}`
        );
      }
    }

    for (const existingElement of existingLayout?.elements ?? []) {
      if (!existingElement.required) continue;
      if (!incomingElementIds.has(existingElement.id)) {
        throw new RegistryValidationError(
          `element ${existingElement.id} is required and cannot be removed in layout ${layoutKey}`
        );
      }
    }
  }
}

export function updateArtifactTemplate(
  db: Database.Database,
  id: string,
  payload: unknown,
  expectedUpdatedAt: string,
  options?: {
    allowReadOnly?: boolean;
    /**
     * Set when this write restores the row to a shipped seed (reset, guarded
     * re-seed), so the row records which seed it now holds. An administrator's
     * own save never sets it: leaving the previous hash in place is exactly
     * what makes the next startup read the row as edited.
     */
    markAsSeeded?: boolean;
  }
): StoredArtifactTemplate {
  const existing = getArtifactTemplate(db, id);
  if (!existing) {
    throw new RegistryNotFoundError(id);
  }
  if (existing.updatedAt !== expectedUpdatedAt) {
    throw new RegistryStaleError();
  }
  if (!options?.allowReadOnly && READ_ONLY_BASE_TYPES.has(existing.baseType)) {
    throw new RegistryValidationError('Template base type is read-only');
  }

  const validated = validateArtifactTemplate(payload);
  if (validated.id !== id) {
    throw new RegistryValidationError('Template id in payload must match route id');
  }
  if (!options?.allowReadOnly) {
    assertStableAgainstSeed(validated, existing);
  }

  const nextPayload = serializeTemplate(validated);
  const now = new Date().toISOString();
  const result = options?.markAsSeeded
    ? db
        .prepare(
          `UPDATE artifact_templates
           SET label = ?, base_type = ?, payload = ?, updated_at = ?, seed_hash = ?
           WHERE id = ? AND updated_at = ?`
        )
        .run(
          validated.label,
          validated.baseType,
          nextPayload,
          now,
          hashTemplatePayload(nextPayload),
          id,
          expectedUpdatedAt
        )
    : db
        .prepare(
          `UPDATE artifact_templates
           SET label = ?, base_type = ?, payload = ?, updated_at = ?
           WHERE id = ? AND updated_at = ?`
        )
        .run(
          validated.label,
          validated.baseType,
          nextPayload,
          now,
          id,
          expectedUpdatedAt
        );

  if (result.changes === 0) {
    throw new RegistryStaleError();
  }

  const updated = getArtifactTemplate(db, id);
  if (!updated) {
    throw new RegistryNotFoundError(id);
  }
  return updated;
}

export function resetArtifactTemplate(
  db: Database.Database,
  id: string,
  seedTemplate: ArtifactTemplate,
  expectedUpdatedAt: string
): StoredArtifactTemplate {
  if (seedTemplate.id !== id) {
    throw new RegistryValidationError('Seed template id mismatch');
  }
  return updateArtifactTemplate(db, id, seedTemplate, expectedUpdatedAt, {
    allowReadOnly: true,
    markAsSeeded: true,
  });
}

export function insertArtifactTemplateIfMissing(
  db: Database.Database,
  template: ArtifactTemplate
): boolean {
  const existing = db
    .prepare(`SELECT id FROM artifact_templates WHERE id = ?`)
    .get(template.id);
  if (existing) return false;

  const payload = serializeTemplate(template);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, seed_hash)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    template.id,
    template.label,
    template.baseType,
    payload,
    now,
    hashTemplatePayload(payload)
  );
  return true;
}

/**
 * One-time backfill for the `seed_hash` migration, and for nothing else.
 *
 * Every row written before the column existed has `seed_hash = NULL`, which the
 * guard below reads as "no evidence, keep theirs". On the only databases the
 * self-healing seed was ever built for — the ones already running — that means
 * it reaches *zero* templates: nothing is ever re-seeded and every shipped
 * correction still waits for a manual Reset. Comparing such a row against the
 * current shipped seed does not rescue it either; it holds the *older* seed, so
 * it matches neither the new seed nor any recorded hash.
 *
 * Stamping each legacy row with the hash of its own stored payload makes it
 * read as untouched exactly once, so the next seeding pass replaces it with the
 * current shipped template. Afterwards the guard behaves normally, because an
 * administrator's `updateArtifactTemplate` deliberately leaves the recorded
 * hash stale.
 *
 * Treating those rows as untouched is safe only because no administrator edit
 * can exist in a database predating this release: the canvas editor threw on
 * mount for *every* template (an explicit `undefined` `fontStyle` reaching
 * Fabric v6's font cache) until that was fixed in this same release, so no
 * layout could be saved at all. That justification expires the moment the
 * column exists — the caller must therefore run this on the migration path
 * only. Running it again on an already-migrated table would re-arm rows the
 * administrator has since edited and silently discard their work.
 *
 * `updated_at` is deliberately left alone: recording evidence *about* a row is
 * not a write to the template an open editor holds a timestamp for.
 *
 * @returns how many rows were stamped.
 */
export function recordSeedHashesForMigratedRows(db: Database.Database): number {
  const rows = db
    .prepare(
      `SELECT id, payload FROM artifact_templates WHERE seed_hash IS NULL`
    )
    .all() as { id: string; payload: string }[];

  const record = db.prepare(
    `UPDATE artifact_templates
     SET seed_hash = ?
     WHERE id = ? AND seed_hash IS NULL`
  );
  let recorded = 0;
  for (const row of rows) {
    recorded += record.run(hashTemplatePayload(row.payload), row.id).changes;
  }
  return recorded;
}

/**
 * Startup's self-healing step for one shipped template.
 *
 * A corrected template used to reach a running hub only if an administrator
 * pressed Reset on it, which nobody does at 08:55. This inserts a missing row
 * and otherwise replaces the stored row **only** while it is provably still the
 * seed it was last seeded or reset from:
 *
 * ```
 * stored payload == the current seed          -> nothing to do; record the hash
 * stored payload hash == recorded seed hash   -> untouched, safe to re-seed
 * stored payload hash != recorded seed hash   -> the administrator edited it, keep theirs
 * no recorded hash                            -> no evidence, keep theirs
 * ```
 *
 * A row that already holds the current seed byte-for-byte is not rewritten, so
 * `updatedAt` does not churn on every boot; a real re-seed is an ordinary write
 * and advances `updatedAt` like any other.
 */
export function reseedArtifactTemplateIfUntouched(
  db: Database.Database,
  template: ArtifactTemplate
): ReseedOutcome {
  if (insertArtifactTemplateIfMissing(db, template)) {
    return 'inserted';
  }

  const row = db
    .prepare(
      `SELECT payload, updated_at, seed_hash
       FROM artifact_templates WHERE id = ?`
    )
    .get(template.id) as
    | { payload: string; updated_at: string; seed_hash: string | null }
    | undefined;
  if (!row) {
    // Only reachable if the row vanished between the insert probe and here.
    throw new RegistryNotFoundError(template.id);
  }

  const seedPayload = serializeTemplate(template);
  const seedHash = hashTemplatePayload(seedPayload);

  if (row.payload === seedPayload) {
    // The row *is* the current seed, byte for byte, so by definition it carries
    // no edit — whatever its recorded hash says. Repairing that hash is what
    // keeps an administrator who hand-applied the same correction we are
    // shipping from being frozen out of every *future* correction, which the
    // stale hash would otherwise report as `skipped-edited` forever.
    //
    // Only the evidence is written: `updatedAt` must not move under an open
    // editor holding it for optimistic concurrency. The payload is part of the
    // WHERE clause so a row that changed since the read above is left alone.
    if (row.seed_hash !== seedHash) {
      db.prepare(
        `UPDATE artifact_templates
         SET seed_hash = ?
         WHERE id = ? AND payload = ?`
      ).run(seedHash, template.id, seedPayload);
    }
    return 'unchanged';
  }

  if (!row.seed_hash) return 'skipped-unrecorded';
  if (hashTemplatePayload(row.payload) !== row.seed_hash) {
    return 'skipped-edited';
  }

  const result = db
    .prepare(
      `UPDATE artifact_templates
       SET label = ?, base_type = ?, payload = ?, updated_at = ?, seed_hash = ?
       WHERE id = ? AND updated_at = ?`
    )
    .run(
      template.label,
      template.baseType,
      seedPayload,
      new Date().toISOString(),
      seedHash,
      template.id,
      row.updated_at
    );

  // Same compare-and-swap `updateArtifactTemplate` enforces. If it matched
  // nothing the row moved between the read and the write (a concurrent reset,
  // or a caller outside the seeding transaction), so nothing was re-seeded and
  // the operator log must not claim otherwise.
  if (result.changes === 0) return 'skipped-conflict';
  return 'reseeded';
}
