import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/require';
import { getDb } from '@/lib/db';
import { listArtifactSummaries } from '@/lib/registry/store';

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    return NextResponse.json({ templates: listArtifactSummaries(db) });
  } catch (error) {
    console.error('Error listing artifact templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
