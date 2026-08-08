import { createHash } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  ArtifactBaseType,
  ArtifactTemplate,
  ArtifactTemplateSummary,
  StoredArtifactTemplate,
} from './types';
import { isCanvasAuthorable } from './types';
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

export function listArtifactSummaries(
  db: Database.Database
): ArtifactTemplateSummary[] {
  const rows = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at
       FROM artifact_templates
       ORDER BY position`
    )
    .all() as Row[];

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    baseType: row.base_type as ArtifactBaseType,
    updatedAt: row.updated_at,
    editable: isCanvasAuthorable(row.base_type as ArtifactBaseType),
  }));
}

/**
 * AC-1: the persisted position set must be exactly `0..N-1` with no duplicate
 * and no gap after every write path this story leaves in place (the bootstrap
 * and the existing `PUT`, neither of which may leave the column inconsistent).
 */
export function assertContiguousPositions(db: Database.Database): void {
  const rows = db
    .prepare(`SELECT id, position FROM artifact_templates ORDER BY position`)
    .all() as { id: string; position: number }[];

  const seen = new Set<number>();
  rows.forEach((row, index) => {
    if (seen.has(row.position)) {
      throw new Error(
        `artifact_templates.position is not well-formed: duplicate position ${row.position} (row "${row.id}")`
      );
    }
    seen.add(row.position);
    if (row.position !== index) {
      throw new Error(
        `artifact_templates.position is not well-formed: expected ${index} at index ${index}, found ${row.position} (row "${row.id}")`
      );
    }
  });
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
  const row = db
    .prepare(
      `SELECT id, label, base_type, payload, updated_at
       FROM artifact_templates WHERE id = ?`
    )
    .get(id) as Row | undefined;
  if (!row) {
    throw new RegistryNotFoundError(id);
  }
  const existing = rowToStored(row);
  const persistedBaseType = row.base_type as ArtifactBaseType;
  if (existing.updatedAt !== expectedUpdatedAt) {
    throw new RegistryStaleError();
  }
  if (!options?.allowReadOnly && !isCanvasAuthorable(persistedBaseType)) {
    throw new RegistryValidationError('Template base type is read-only');
  }

  if (
    !options?.allowReadOnly &&
    payload &&
    typeof payload === 'object' &&
    'baseType' in payload &&
    typeof (payload as { baseType?: unknown }).baseType === 'string' &&
    (payload as { baseType: string }).baseType !== persistedBaseType
  ) {
    throw new RegistryValidationError('baseType cannot be changed');
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

/**
 * Insert one seed template at a fixed position. Used only by the AD-17
 * first-boot bootstrap (AC-7): the table starts empty, so this always inserts.
 * The `if missing` guard stays defensive — it must never overwrite a row a
 * concurrent boot already placed — but it is no longer a per-boot gap-filler.
 */
export function insertArtifactTemplateIfMissing(
  db: Database.Database,
  template: ArtifactTemplate,
  position: number
): boolean {
  const existing = db
    .prepare(`SELECT id FROM artifact_templates WHERE id = ?`)
    .get(template.id);
  if (existing) return false;

  const payload = serializeTemplate(template);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at, seed_hash, position)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    template.id,
    template.label,
    template.baseType,
    payload,
    now,
    hashTemplatePayload(payload),
    position
  );
  return true;
}
