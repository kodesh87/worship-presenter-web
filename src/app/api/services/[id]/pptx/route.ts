import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generatePptx } from '@/lib/pptx';
import { parseServiceId } from '@/lib/service-id';
import { resolveSlideMediaForService } from '@/lib/announcements';
import { normalizeParsedRundown } from '@/lib/parsed-fields';
import {
  cleanupExpiredPptxCache,
  writePptxCache,
} from '@/lib/pptx-cache';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const serviceId = parseServiceId(id);

    if (serviceId === null) {
      return new NextResponse('Invalid Service ID', { status: 400 });
    }

    const db = getDb();
    const record = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as
      | {
          date: string;
          parsed_data: string;
          images_payload: string | null;
        }
      | undefined;

    if (!record || !record.parsed_data) {
      return new NextResponse('Service not found or not parsed', { status: 404 });
    }

    let parsedData;
    try {
      const raw = JSON.parse(record.parsed_data);
      if (!raw || !Array.isArray(raw.items)) {
        return new NextResponse('Corrupt parsed data', { status: 500 });
      }
      parsedData = normalizeParsedRundown(raw);
    } catch {
      return new NextResponse('Corrupt parsed data', { status: 500 });
    }

    const media = resolveSlideMediaForService(serviceId, record.images_payload);
    const pptxBuffer = await generatePptx(record.date, parsedData, media);

    try {
      writePptxCache(serviceId, pptxBuffer);
      cleanupExpiredPptxCache();
    } catch (cacheErr) {
      console.warn('PPTX cache write/cleanup failed:', cacheErr);
    }

    // @ts-expect-error NextResponse typing mismatch with Node Buffer; works at runtime
    return new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="Service-${record.date}.pptx"`,
      },
    });
  } catch (error) {
    console.error('Error generating PPTX:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
