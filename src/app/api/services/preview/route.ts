import { NextRequest, NextResponse } from 'next/server';
import { parseRundown } from '@/lib/parser';
import { coerceOptionalSafeImageUrl } from '@/lib/images';
import {
  applyStructuredFields,
  coerceStructuredFields,
  normalizeParsedRundown,
} from '@/lib/parsed-fields';
import { buildSlidePlan } from '@/lib/slide-plan';
import { buildPreviewEntries } from '@/lib/artifacts/preview-model';
import {
  assertAnnouncementImageUrl,
  isAnnouncementImageUrl,
} from '@/lib/announcements';
import { fieldsFromParsed } from '@/lib/worship-form-fields';

export async function POST(request: NextRequest) {
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

    const rawPayload = (body as { raw_payload?: unknown }).raw_payload;
    if (typeof rawPayload !== 'string' || !rawPayload.trim()) {
      return NextResponse.json(
        { error: 'raw_payload is required' },
        { status: 400 }
      );
    }

    let parsedData = parseRundown(rawPayload);
    if (!parsedData.date) {
      return NextResponse.json(
        { error: 'Could not parse service date from raw_payload' },
        { status: 400 }
      );
    }
    const serviceDate = parsedData.date;

    const structured = coerceStructuredFields(body);
    if (structured) {
      parsedData = applyStructuredFields(parsedData, structured);
    }
    parsedData = normalizeParsedRundown(parsedData);

    let sermonGraphicUrl: string | null = null;
    let familyPhotoUrl: string | null = null;
    let youthPhotoUrl: string | null = null;
    try {
      sermonGraphicUrl =
        coerceOptionalSafeImageUrl(
          (body as { sermonGraphicUrl?: unknown }).sermonGraphicUrl,
          'sermonGraphicUrl'
        ) ?? null;
      familyPhotoUrl =
        coerceOptionalSafeImageUrl(
          (body as { familyPhotoUrl?: unknown }).familyPhotoUrl,
          'familyPhotoUrl'
        ) ?? null;
      youthPhotoUrl =
        coerceOptionalSafeImageUrl(
          (body as { youthPhotoUrl?: unknown }).youthPhotoUrl,
          'youthPhotoUrl'
        ) ?? null;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Prefer announcements[] (same shape as persist); fall back to images[]
    let flyers: string[] = [];
    const announcements = (body as { announcements?: unknown }).announcements;
    if (Array.isArray(announcements)) {
      flyers = announcements
        .map((item) => {
          if (!item || typeof item !== 'object') return '';
          const url = (item as { image_url?: unknown }).image_url;
          if (typeof url !== 'string') return '';
          try {
            return assertAnnouncementImageUrl(url);
          } catch {
            return isAnnouncementImageUrl(url) ? url.trim() : '';
          }
        })
        .filter(Boolean);
    } else if (Array.isArray((body as { images?: unknown }).images)) {
      flyers = ((body as { images: unknown[] }).images as unknown[])
        .filter((u): u is string => typeof u === 'string')
        .filter((u) => isAnnouncementImageUrl(u));
    }

    const media = {
      flyers,
      sermonGraphicUrl,
      familyPhotoUrl,
      youthPhotoUrl,
    };

    // `plan` stays the untouched legacy payload existing clients already
    // render; the preview entries are the semantic projection beside it.
    //
    // Both come from ONE plan build. `buildArtifactPlan` used to be called as
    // well, which meant a second full registry snapshot — another `SELECT` over
    // `artifact_templates`, another 28 `JSON.parse`s and another seed
    // validation — on every debounced keystroke in the rundown textarea.
    // `buildPreviewEntries` only reads the flattened `ArtifactInstance`s (group
    // membership included), so wrapping the already-flat plan as leaf nodes
    // yields byte-identical entries in the same order.
    const plan = buildSlidePlan(serviceDate, parsedData, media);
    const previewEntries = buildPreviewEntries(
      plan.map((item) => ({ kind: 'artifact' as const, instance: item.artifact }))
    );

    return NextResponse.json(
      {
        plan,
        previewEntries,
        date: serviceDate,
        failedHymnNumbers: parsedData.failedHymnNumbers,
        fields: fieldsFromParsed(parsedData),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
