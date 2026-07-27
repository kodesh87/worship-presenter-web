/**
 * Read/delete SQL for the services table. No HTTP concerns live here.
 */
import type Database from 'better-sqlite3';
import type { ServiceListItem, ServiceRow } from './types';

const LIST_COLUMNS = `id, date, raw_payload, parsed_data, created_at,
                  COALESCE(updated_at, created_at) AS updated_at`;

/** Tolerant parse of a stored JSON column — corrupt rows read as `null`. */
function parseStoredJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function toListItem(row: ServiceRow): ServiceListItem {
  return {
    id: row.id,
    date: row.date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    raw_payload: row.raw_payload,
    parsed_data: parseStoredJson(row.parsed_data),
  };
}

/**
 * List services, newest first. A non-empty `q` LIKE-matches date, raw payload
 * and stored parsed data.
 */
export function listServices(
  db: Database.Database,
  q: string
): ServiceListItem[] {
  if (q) {
    const like = `%${q}%`;
    const rows = db
      .prepare<[string, string, string], ServiceRow>(
        `SELECT ${LIST_COLUMNS}
           FROM services
           WHERE date LIKE ?
              OR raw_payload LIKE ?
              OR IFNULL(parsed_data, '') LIKE ?
           ORDER BY date DESC, id DESC`
      )
      .all(like, like, like);
    return rows.map(toListItem);
  }

  const rows = db
    .prepare<[], ServiceRow>(
      `SELECT ${LIST_COLUMNS}
         FROM services
         ORDER BY date DESC, id DESC`
    )
    .all();
  return rows.map(toListItem);
}

/**
 * Delete a service. Returns false when no row matched.
 * `announcement_items` rows disappear via the FK cascade.
 */
export function deleteService(
  db: Database.Database,
  serviceId: number
): boolean {
  const result = db
    .prepare<[number]>('DELETE FROM services WHERE id = ?')
    .run(serviceId);
  return result.changes > 0;
}

/** Effective optimistic-concurrency token for a row. */
export function readUpdatedAt(row: {
  updated_at?: string | null;
  created_at?: string | null;
}): string {
  return row.updated_at || row.created_at || '';
}
