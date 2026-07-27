import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/require';
import { getDb } from '@/lib/db';
import { getSeedTemplateById } from '@/lib/registry/seed';
import {
  getArtifactTemplate,
  RegistryNotFoundError,
  RegistryStaleError,
  resetArtifactTemplate,
} from '@/lib/registry/store';
import { RegistryValidationError } from '@/lib/registry/validate';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const updatedAt = (body as { updatedAt?: unknown }).updatedAt;
    if (typeof updatedAt !== 'string' || !updatedAt.trim()) {
      return NextResponse.json({ error: 'updatedAt is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = getArtifactTemplate(db, id);
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const seedTemplate = getSeedTemplateById(id);
    const saved = resetArtifactTemplate(db, id, seedTemplate, updatedAt);
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof RegistryValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof RegistryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof RegistryStaleError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error resetting artifact template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
