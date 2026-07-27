/**
 * Service creation: parse, structured overlay, collision policy, and the
 * INSERT + announcement sync transaction.
 */
import type Database from 'better-sqlite3';
import { syncWorshipAnnouncements } from '@/lib/announcements';
import { parseRundown } from '@/lib/parser';
import {
  applyStructuredFields,
  normalizeParsedRundown,
} from '@/lib/parsed-fields';
import type { CreateServiceInput, CreateServiceResult } from './types';

/**
 * Create a service from an already narrowed body.
 *
 * Sequence is load-bearing: the date check precedes the deferred image /
 * participants / announcements validation, which precedes the date-collision
 * check, exactly as the original route handler did.
 */
export function createService(
  db: Database.Database,
  input: CreateServiceInput
): CreateServiceResult {
  let parsedData = parseRundown(input.rawPayload);
  if (!parsedData.date) {
    return {
      ok: false,
      kind: 'validation',
      message: 'Could not parse service date from raw_payload',
    };
  }
  const serviceDate = parsedData.date;

  if (!input.payload.ok) return input.payload;
  const payload = input.payload.value;

  if (input.structured) {
    parsedData = applyStructuredFields(parsedData, input.structured);
  }
  parsedData = normalizeParsedRundown(parsedData);

  const existing = db
    .prepare<[string], { id: number }>('SELECT id FROM services WHERE date = ?')
    .get(serviceDate);

  if (existing && !input.allowSecond) {
    return {
      ok: false,
      kind: 'collision',
      existingId: existing.id,
      date: serviceDate,
    };
  }

  const parsedJson = JSON.stringify(parsedData);
  const imagesJson = JSON.stringify(payload.imagesPayload);
  const { announcements } = payload;
  const { clearMaster } = input;

  let serviceId = 0;
  const commit = db.transaction(() => {
    const result = db
      .prepare<[string, string, string, string, string | null]>(
        `INSERT INTO services
             (date, raw_payload, parsed_data, images_payload, participants_payload, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .run(
        serviceDate,
        input.rawPayload,
        parsedJson,
        imagesJson,
        payload.participantsRaw
      );
    serviceId = Number(result.lastInsertRowid);

    if (announcements) {
      syncWorshipAnnouncements(serviceId, announcements, { clearMaster }, db);
    }
  });
  commit();

  return {
    ok: true,
    id: serviceId,
    date: serviceDate,
    failedHymnNumbers: parsedData.failedHymnNumbers,
  };
}
