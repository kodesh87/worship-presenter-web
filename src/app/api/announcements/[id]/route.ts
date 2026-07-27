import { NextRequest, NextResponse } from 'next/server';
import {
  deleteAnnouncementItem,
  updateAnnouncementItem,
  type AnnouncementInput,
} from '@/lib/announcements';

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function isClientError(message: string): boolean {
  return (
    /image_url|Video\/MP4|service_id|must be/i.test(message) ||
    /not found/i.test(message)
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid announcement id' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const item = updateAnnouncementItem(id, body as Partial<AnnouncementInput>);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    if (/Announcement not found/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (isClientError(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid announcement id' }, { status: 400 });
    }

    const deleted = deleteAnnouncementItem(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Announcement deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
