/**
 * The single place an `unknown` service request body is narrowed.
 *
 * The legacy handlers interleaved body validation with domain checks
 * (`Could not parse service date…` on create; the 404/409 gates on update).
 * To keep every error response byte-identical, the checks that ran *after*
 * those gates are narrowed here but returned as a `Narrowed<…>` payload the
 * domain function surfaces at the original point in the sequence.
 */
import { coerceWorshipAnnouncements } from '@/lib/announcements';
import type { WorshipAnnouncementInput } from '@/lib/announcements';
import { coerceImageUrls, coerceOptionalSafeImageUrl } from '@/lib/images';
import { coerceStructuredFields } from '@/lib/parsed-fields';
import { ABSENT, validationFailure } from './types';
import type {
  CreateServiceInput,
  CreateServicePayload,
  FieldPatch,
  Narrowed,
  UpdateImagesPatch,
  UpdateServiceInput,
  UpdateServicePayload,
} from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && typeof value === 'object' && !Array.isArray(value)
  );
}

function hasKey(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Read a JSON request body, mapping a parse failure to the shared 400. */
export async function readJsonBody(request: Request): Promise<Narrowed<unknown>> {
  try {
    return { ok: true, value: (await request.json()) as unknown };
  } catch {
    return validationFailure('Invalid JSON');
  }
}

function narrowAnnouncements(
  body: Record<string, unknown>
): Narrowed<WorshipAnnouncementInput[] | null> {
  if (!hasKey(body, 'announcements')) return { ok: true, value: null };
  try {
    return { ok: true, value: coerceWorshipAnnouncements(body.announcements) };
  } catch (e) {
    return validationFailure(messageOf(e, 'Invalid announcements'));
  }
}

function narrowParticipants(
  body: Record<string, unknown>
): Narrowed<FieldPatch<string | null>> {
  if (!hasKey(body, 'participantsRaw')) return { ok: true, value: ABSENT };
  const raw = body.participantsRaw;
  if (raw !== null && typeof raw !== 'string') {
    return validationFailure('participantsRaw must be a string or null');
  }
  return {
    ok: true,
    value: { present: true, value: typeof raw === 'string' ? raw : null },
  };
}

/** Create: images → participants → announcements (legacy order). */
function narrowCreatePayload(
  body: Record<string, unknown>
): Narrowed<CreateServicePayload> {
  let sermonGraphicUrl: string | null;
  let familyPhotoUrl: string | null;
  let youthPhotoUrl: string | null;
  try {
    sermonGraphicUrl =
      coerceOptionalSafeImageUrl(body.sermonGraphicUrl, 'sermonGraphicUrl') ??
      null;
    familyPhotoUrl =
      coerceOptionalSafeImageUrl(body.familyPhotoUrl, 'familyPhotoUrl') ?? null;
    youthPhotoUrl =
      coerceOptionalSafeImageUrl(body.youthPhotoUrl, 'youthPhotoUrl') ?? null;
  } catch (e) {
    return validationFailure(messageOf(e, 'Invalid image URL'));
  }

  const images = Array.isArray(body.images) ? coerceImageUrls(body.images) : [];

  const participants = narrowParticipants(body);
  if (!participants.ok) return participants;

  const announcements = narrowAnnouncements(body);
  if (!announcements.ok) return announcements;

  return {
    ok: true,
    value: {
      imagesPayload: {
        images,
        sermonGraphicUrl,
        familyPhotoUrl,
        youthPhotoUrl,
      },
      participantsRaw: participants.value.present
        ? participants.value.value
        : null,
      announcements: announcements.value,
    },
  };
}

/** Update: images → announcements → participants (legacy order). */
function narrowUpdatePayload(
  body: Record<string, unknown>
): Narrowed<UpdateServicePayload> {
  const hasImages = hasKey(body, 'images');
  const hasSermonGraphic = hasKey(body, 'sermonGraphicUrl');
  const hasFamilyPhoto = hasKey(body, 'familyPhotoUrl');
  const hasYouthPhoto = hasKey(body, 'youthPhotoUrl');

  let images: UpdateImagesPatch = {
    any: false,
    urls: ABSENT,
    sermonGraphicUrl: ABSENT,
    familyPhotoUrl: ABSENT,
    youthPhotoUrl: ABSENT,
  };

  if (hasImages || hasSermonGraphic || hasFamilyPhoto || hasYouthPhoto) {
    try {
      const urls: FieldPatch<string[]> = hasImages
        ? { present: true, value: coerceImageUrls(body.images) }
        : ABSENT;
      const sermonGraphicUrl: FieldPatch<string | null> = hasSermonGraphic
        ? {
            present: true,
            value:
              coerceOptionalSafeImageUrl(
                body.sermonGraphicUrl,
                'sermonGraphicUrl'
              ) ?? null,
          }
        : ABSENT;
      const familyPhotoUrl: FieldPatch<string | null> = hasFamilyPhoto
        ? {
            present: true,
            value:
              coerceOptionalSafeImageUrl(body.familyPhotoUrl, 'familyPhotoUrl') ??
              null,
          }
        : ABSENT;
      const youthPhotoUrl: FieldPatch<string | null> = hasYouthPhoto
        ? {
            present: true,
            value:
              coerceOptionalSafeImageUrl(body.youthPhotoUrl, 'youthPhotoUrl') ??
              null,
          }
        : ABSENT;

      images = {
        any: true,
        urls,
        sermonGraphicUrl,
        familyPhotoUrl,
        youthPhotoUrl,
      };
    } catch (e) {
      return validationFailure(messageOf(e, 'Invalid image URL'));
    }
  }

  const announcements = narrowAnnouncements(body);
  if (!announcements.ok) return announcements;

  const participants = narrowParticipants(body);
  if (!participants.ok) return participants;

  return {
    ok: true,
    value: {
      images,
      announcements: announcements.value,
      participants: participants.value,
    },
  };
}

/** Narrow a `POST /api/services` body. */
export function narrowCreateBody(body: unknown): Narrowed<CreateServiceInput> {
  if (!isPlainObject(body)) return validationFailure('Invalid body');

  const rawPayload = body.raw_payload;
  if (typeof rawPayload !== 'string' || !rawPayload.trim()) {
    return validationFailure('raw_payload is required');
  }

  return {
    ok: true,
    value: {
      rawPayload,
      structured: coerceStructuredFields(body),
      clearMaster: body.clearMaster === true,
      allowSecond: body.allowSecond === true,
      payload: narrowCreatePayload(body),
    },
  };
}

/** Narrow a `PUT /api/services/[id]` body. */
export function narrowUpdateBody(body: unknown): Narrowed<UpdateServiceInput> {
  if (!isPlainObject(body)) return validationFailure('Invalid body');

  const clientUpdatedAt = body.updated_at;
  if (typeof clientUpdatedAt !== 'string' || !clientUpdatedAt.trim()) {
    return validationFailure(
      'updated_at is required for concurrent edit protection'
    );
  }

  const rawValue = body.raw_payload;
  const rawPayload =
    typeof rawValue === 'string' && rawValue.length > 0 ? rawValue : null;
  const structured = coerceStructuredFields(body);

  if (rawPayload === null && !structured) {
    return validationFailure('Missing raw_payload or structured fields');
  }

  return {
    ok: true,
    value: {
      updatedAt: clientUpdatedAt.trim(),
      rawPayload,
      structured,
      clearMaster: body.clearMaster === true,
      payload: narrowUpdatePayload(body),
    },
  };
}
