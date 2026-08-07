/**
 * One-shot registry read used by plan building.
 *
 * better-sqlite3 is synchronous and server-only, so the whole registry is read
 * once per plan build and handed to hydration as an in-memory map. Hydration
 * never touches the database.
 */
import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db';
import { validateArtifactTemplate } from '@/lib/registry/validate';
import type { StoredArtifactTemplate } from '@/lib/registry/types';
import { ArtifactHydrationError } from './runtime-contract';

export type RegistrySnapshot = ReadonlyMap<string, StoredArtifactTemplate>;

type Row = {
  id: string;
  payload: string;
  updated_at: string;
};

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * A persisted row is only trusted once it passes the same validator the admin
 * editor and the store use.
 *
 * Returning `null` here rejects the persisted row: no layout is available for
 * that id, so the planner omits its slide. This prevents a rejected row from changing
 * the deck — so every rejection is logged with the template id and the reason.
 * Skipping validation is worse: a row that is valid JSON but not a valid
 * template used to reach hydration and crash it with an unattributed
 * `TypeError` on `template.placeholders`.
 */
function parseRow(row: Row): StoredArtifactTemplate | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.payload);
  } catch (error) {
    console.error(
      `[registry] template "${row.id}": persisted row rejected (stored payload is not valid JSON); no layout is available: ${reason(error)}`
    );
    return null;
  }

  try {
    const template = validateArtifactTemplate(parsed);
    if (template.id !== row.id) {
      throw new Error(`payload id "${template.id}" does not match the row id`);
    }
    return { ...template, updatedAt: row.updated_at };
  } catch (error) {
    console.error(
      `[registry] template "${row.id}": persisted row rejected (stored payload is not a valid template); no layout is available: ${reason(error)}`
    );
    return null;
  }
}

/**
 * Every template keyed by id, in the order `artifact_templates.position`
 * defines (AC-1) — `buildRequestPlan` reads that iteration order directly, so
 * this is the ordered registry snapshot AC-2 requires.
 *
 * Story 20.1 (AC-7, AC-8) removes the read-time seed fallback entirely: a row
 * absent from the database, or present but rejected by {@link parseRow},
 * contributes no layout — there is no substitution left to distinguish those
 * two cases from each other. A row an administrator deletes directly in SQL
 * therefore stays deleted through this read, and a row that fails validation
 * is never quietly replaced by the shipped template it happens to share an id
 * with; both are logged and both make the planner omit the slide they would
 * have produced (`slide-plan.ts`'s `hydrateLeafOrOmit`).
 */
export function loadRegistrySnapshot(db?: Database.Database): RegistrySnapshot {
  const database = db ?? getDb();
  const rows = database
    .prepare(`SELECT id, payload, updated_at FROM artifact_templates ORDER BY position`)
    .all() as Row[];

  const snapshot = new Map<string, StoredArtifactTemplate>();
  for (const row of rows) {
    const stored = parseRow(row);
    if (stored) {
      snapshot.set(stored.id, stored);
    } else {
      console.error(
        `[registry] template "${row.id}": rejected and absent from the shipped seed, no layout is available for it`
      );
    }
  }

  return snapshot;
}

export function requireTemplate(
  snapshot: RegistrySnapshot,
  templateId: string,
  instanceId?: string
): StoredArtifactTemplate {
  const template = snapshot.get(templateId);
  if (!template) {
    throw new ArtifactHydrationError('Unknown artifact template', {
      templateId,
      instanceId,
    });
  }
  return template;
}
