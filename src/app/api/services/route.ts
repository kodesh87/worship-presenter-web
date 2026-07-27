import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { narrowCreateBody, readJsonBody } from '@/lib/services/body';
import { createService } from '@/lib/services/create-service';
import { listServices } from '@/lib/services/queries';

/**
 * GET /api/services?q= — list services; optional text search on date/raw/parsed.
 * Session required (proxy gate).
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() || '';
    const services = listServices(getDb(), q);

    return NextResponse.json({
      services,
      q: q || null,
      count: services.length,
    });
  } catch (error) {
    console.error('Error listing services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** POST /api/services — create a service from a raw rundown payload. */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (!body.ok) {
      return NextResponse.json({ error: body.message }, { status: 400 });
    }

    const input = narrowCreateBody(body.value);
    if (!input.ok) {
      return NextResponse.json({ error: input.message }, { status: 400 });
    }

    const result = createService(getDb(), input.value);
    if (!result.ok) {
      if (result.kind === 'collision') {
        return NextResponse.json(
          {
            error: 'Service already exists for this date',
            existingId: result.existingId,
            date: result.date,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: 'Service created successfully',
        id: result.id,
        date: result.date,
        failedHymnNumbers: result.failedHymnNumbers,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
