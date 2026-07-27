import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseRundown } from '@/lib/parser';
import { coerceImageUrls, localIsoDate } from '@/lib/images';
import {
  assertAnnouncementImageUrl,
  replaceOneOffAnnouncementsForService,
} from '@/lib/announcements';
import {
  assertWebhookSecretValue,
  readWebhookSecretFromHeaders,
} from '@/lib/webhook-auth';
import {
  applyStructuredFields,
  coerceStructuredFields,
  normalizeParsedRundown,
} from '@/lib/parsed-fields';
import { parseServiceId } from '@/lib/service-id';

function assertWebhookSecret(request: NextRequest): NextResponse | null {
  const failure = assertWebhookSecretValue(
    process.env.WEBHOOK_SECRET,
    readWebhookSecretFromHeaders(request.headers)
  );
  if (!failure) return null;
  return NextResponse.json({ error: failure.error }, { status: failure.status });
}

function findServiceByDateOrId(
  db: ReturnType<typeof getDb>,
  date: string | null,
  serviceId: number | null
): { id: number; date: string; raw_payload: string; parsed_data: string | null } | null {
  if (serviceId != null) {
    const row = db
      .prepare(
        `SELECT id, date, raw_payload, parsed_data FROM services WHERE id = ?`
      )
      .get(serviceId) as
      | { id: number; date: string; raw_payload: string; parsed_data: string | null }
      | undefined;
    return row ?? null;
  }
  if (date) {
    const row = db
      .prepare(
        `SELECT id, date, raw_payload, parsed_data FROM services WHERE date = ?`
      )
      .get(date) as
      | { id: number; date: string; raw_payload: string; parsed_data: string | null }
      | undefined;
    return row ?? null;
  }
  return null;
}

function handleCorrection(
  body: Record<string, unknown>
): NextResponse {
  const dateRaw = body.date;
  const date =
    typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw.trim())
      ? dateRaw.trim()
      : typeof dateRaw === 'string'
        ? parseRundown(dateRaw).date
        : null;

  const serviceId = parseServiceId(
    body.serviceId != null ? String(body.serviceId) : body.id != null ? String(body.id) : ''
  );

  const text =
    typeof body.text === 'string'
      ? body.text
      : typeof (body as { message?: { text?: unknown } }).message?.text === 'string'
        ? ((body as { message: { text: string } }).message.text)
        : null;

  const structured = coerceStructuredFields(body);

  if (!text && !structured) {
    return NextResponse.json(
      { error: 'Correction requires text and/or fields' },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = findServiceByDateOrId(db, date, serviceId);
  if (!existing) {
    return NextResponse.json(
      { error: 'Service not found for correction' },
      { status: 404 }
    );
  }

  let parsedData = text
    ? parseRundown(text)
    : (() => {
        if (existing.parsed_data) {
          try {
            return normalizeParsedRundown(JSON.parse(existing.parsed_data));
          } catch {
            // fall through
          }
        }
        return parseRundown(existing.raw_payload);
      })();

  if (structured && !text) {
    parsedData = applyStructuredFields(parsedData, structured);
  } else if (structured && text) {
    // Full text re-parse wins; still allow structured overlay for explicit fields
    parsedData = applyStructuredFields(parsedData, structured);
  }
  parsedData = normalizeParsedRundown(parsedData);

  const rawPayload = text ?? existing.raw_payload;
  const newDate = parsedData.date || existing.date;
  const parsedJson = JSON.stringify(parsedData);

  db.prepare(
    `UPDATE services
     SET date = ?, raw_payload = ?, parsed_data = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(newDate, rawPayload, parsedJson, existing.id);

  const resolvedHymns = (parsedData.items || [])
    .filter(
      (i): i is Extract<typeof i, { type: 'hymn' }> => i.type === 'hymn'
    )
    .map((h) => ({ number: h.number, title: h.title }));

  return NextResponse.json({
    message: 'Service correction applied',
    action: 'correct',
    id: existing.id,
    date: newDate,
    parsedData,
    resolvedHymns,
    failedHymnNumbers: parsedData.failedHymnNumbers,
    updated: true,
  });
}

export async function POST(request: NextRequest) {
  const authError = assertWebhookSecret(request);
  if (authError) return authError;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const record = body as Record<string, unknown>;
    if (record.action === 'correct') {
      return handleCorrection(record);
    }

    const rawPayload =
      (record as { text?: unknown }).text ||
      (record as { message?: { text?: unknown } }).message?.text;
    const imagesPayload = coerceImageUrls(
      (record as { images?: unknown }).images
    );
    const hasAnnouncements = Object.prototype.hasOwnProperty.call(
      record,
      'announcements'
    );
    const announcementsRaw = (record as { announcements?: unknown }).announcements;

    if (!rawPayload || typeof rawPayload !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text payload in request body' },
        { status: 400 }
      );
    }

    let announcementUrls: string[] | null = null;
    if (hasAnnouncements) {
      if (announcementsRaw === null || announcementsRaw === undefined) {
        return NextResponse.json(
          { error: 'announcements must be an array of image URLs' },
          { status: 400 }
        );
      }
      if (!Array.isArray(announcementsRaw)) {
        return NextResponse.json(
          { error: 'announcements must be an array of image URLs' },
          { status: 400 }
        );
      }
      try {
        announcementUrls = announcementsRaw.map((url) =>
          assertAnnouncementImageUrl(url)
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Invalid announcements';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const db = getDb();
    const parsedData = parseRundown(rawPayload);
    const serviceDate = parsedData.date || localIsoDate();
    const imagesJson = JSON.stringify(imagesPayload);
    const parsedJson = JSON.stringify(parsedData);

    let serviceId = 0;
    let updated = false;
    let announcementsAdded = 0;

    const commit = db.transaction(() => {
      const existing = db
        .prepare('SELECT id FROM services WHERE date = ?')
        .get(serviceDate) as { id: number } | undefined;

      if (existing) {
        db.prepare(
          `UPDATE services
           SET raw_payload = ?, parsed_data = ?, images_payload = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).run(rawPayload, parsedJson, imagesJson, existing.id);
        serviceId = existing.id;
        updated = true;
      } else {
        const result = db
          .prepare(
            `INSERT INTO services (date, raw_payload, parsed_data, images_payload, updated_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
          )
          .run(serviceDate, rawPayload, parsedJson, imagesJson);
        serviceId = Number(result.lastInsertRowid);
        updated = false;
      }

      if (announcementUrls !== null) {
        const added = replaceOneOffAnnouncementsForService(
          serviceId,
          announcementUrls
        );
        announcementsAdded = added.length;
      }
    });
    commit();

    const resolvedHymns = (parsedData.items || [])
      .filter(
        (i): i is Extract<typeof i, { type: 'hymn' }> => i.type === 'hymn'
      )
      .map((h) => ({ number: h.number, title: h.title }));

    return NextResponse.json(
      {
        message: updated
          ? 'Webhook received; existing service for date updated'
          : 'Webhook received and processed successfully',
        id: serviceId,
        date: serviceDate,
        parsedData,
        resolvedHymns,
        failedHymnNumbers: parsedData.failedHymnNumbers,
        imagesCount: imagesPayload.length,
        announcementsAdded,
        updated,
      },
      { status: updated ? 200 : 201 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
