import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseServiceId } from '@/lib/service-id';
import { narrowUpdateBody, readJsonBody } from '@/lib/services/body';
import { deleteService } from '@/lib/services/queries';
import { updateService } from '@/lib/services/update-service';

/** DELETE /api/services/[id] — remove a service (announcements cascade). */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const serviceId = parseServiceId(id);

    if (serviceId === null) {
      return NextResponse.json({ error: 'Invalid Service ID' }, { status: 400 });
    }

    if (!deleteService(getDb(), serviceId)) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Service deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** PUT /api/services/[id] — edit a service under optimistic concurrency. */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const serviceId = parseServiceId(id);

    if (serviceId === null) {
      return NextResponse.json({ error: 'Invalid Service ID' }, { status: 400 });
    }

    const body = await readJsonBody(request);
    if (!body.ok) {
      return NextResponse.json({ error: body.message }, { status: 400 });
    }

    const input = narrowUpdateBody(body.value);
    if (!input.ok) {
      return NextResponse.json({ error: input.message }, { status: 400 });
    }

    const result = updateService(getDb(), serviceId, input.value);
    if (!result.ok) {
      if (result.kind === 'not-found') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      if (result.kind === 'conflict') {
        return NextResponse.json(
          {
            error: 'Conflict: service was modified; refresh and retry',
            updated_at: result.updatedAt,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: 'Service updated successfully',
        failedHymnNumbers: result.failedHymnNumbers,
        updated_at: result.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
