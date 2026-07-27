import { NextRequest, NextResponse } from 'next/server';
import {
  addAnnouncementItem,
  listAnnouncementItems,
  replaceAnnouncementItems,
  type AnnouncementInput,
} from '@/lib/announcements';

function isClientError(message: string): boolean {
  return (
    /image_url|Video\/MP4|service_id|items|announcements|must be/i.test(
      message
    ) || /not found/i.test(message)
  );
}

export async function GET() {
  try {
    const items = listAnnouncementItems();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error listing announcements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const item = addAnnouncementItem(body as AnnouncementInput);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    if (isClientError(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('Error adding announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const itemsRaw = (body as { items?: unknown }).items;
    if (!Array.isArray(itemsRaw)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 }
      );
    }

    const items = replaceAnnouncementItems(itemsRaw as AnnouncementInput[]);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    if (isClientError(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('Error replacing announcements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
