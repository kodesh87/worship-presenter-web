import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/require';
import { getDb } from '@/lib/db';
import {
  getArtifactTemplate,
  RegistryNotFoundError,
  RegistryStaleError,
  updateArtifactTemplate,
} from '@/lib/registry/store';
import { RegistryValidationError } from '@/lib/registry/validate';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const db = getDb();
    const template = getArtifactTemplate(db, id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error reading artifact template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const updatedAt = (body as { updatedAt?: unknown }).updatedAt;
    if (typeof updatedAt !== 'string' || !updatedAt.trim()) {
      return NextResponse.json({ error: 'updatedAt is required' }, { status: 400 });
    }

    const { updatedAt: _ignored, ...payload } = body as Record<string, unknown>;
    const db = getDb();
    const saved = updateArtifactTemplate(db, id, payload, updatedAt);
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (error instanceof RegistryValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof RegistryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof RegistryStaleError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error updating artifact template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
