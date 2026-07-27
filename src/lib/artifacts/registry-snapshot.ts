/**
 * One-shot registry read used by plan building.
 *
 * better-sqlite3 is synchronous and server-only, so the whole registry is read
 * once per plan build and handed to hydration as an in-memory map. Hydration
 * never touches the database.
 */
import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db';
import { loadSeedTemplates } from '@/lib/registry/seed';
import { validateArtifactTemplate } from '@/lib/registry/validate';
import type { StoredArtifactTemplate } from '@/lib/registry/types';
import { ArtifactHydrationError } from './runtime-contract';

export type RegistrySnapshot = ReadonlyMap<string, StoredArtifactTemplate>;

/** `updatedAt` reported for templates served from the shipped seed. */
export const SEED_FALLBACK_UPDATED_AT = new Date(0).toISOString();

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
 * Returning `null` here makes {@link loadRegistrySnapshot} fall back to the
 * shipped seed for that id, which silently substitutes a different layout into
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
      `[registry] template "${row.id}": stored payload is not valid JSON, falling back to the shipped seed: ${reason(error)}`
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
      `[registry] template "${row.id}": stored payload is not a valid template, falling back to the shipped seed: ${reason(error)}`
    );
    return null;
  }
}

/**
 * Every template keyed by id: valid persisted rows win, shipped seed fills the
 * gaps (a row can be absent when the seed gained a template after first
 * startup, or be rejected by {@link parseRow} as corrupt).
 */
export function loadRegistrySnapshot(db?: Database.Database): RegistrySnapshot {
  const database = db ?? getDb();
  const rows = database
    .prepare(`SELECT id, payload, updated_at FROM artifact_templates`)
    .all() as Row[];

  const snapshot = new Map<string, StoredArtifactTemplate>();
  const rejected = new Set<string>();
  for (const row of rows) {
    const stored = parseRow(row);
    if (stored) snapshot.set(stored.id, stored);
    else rejected.add(row.id);
  }

  for (const seed of loadSeedTemplates()) {
    if (!snapshot.has(seed.id)) {
      snapshot.set(seed.id, { ...seed, updatedAt: SEED_FALLBACK_UPDATED_AT });
    }
    rejected.delete(seed.id);
  }

  for (const id of rejected) {
    console.error(
      `[registry] template "${id}": rejected and absent from the shipped seed, no layout is available for it`
    );
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
