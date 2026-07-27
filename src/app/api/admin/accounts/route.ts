import { NextRequest, NextResponse } from 'next/server';
import { createAccount, listAccounts } from '@/lib/auth/accounts';
import { requireAdminSession } from '@/lib/auth/require';
import type { Role } from '@/lib/auth/session';

function isClientError(message: string): boolean {
  return /username|password|role|already exists|required|too long|may only/i.test(
    message
  );
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminSession(request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const accounts = listAccounts();
    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    console.error('Error listing accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdminSession(request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const o = body as Record<string, unknown>;
    const username = String(o.username ?? '');
    const password = String(o.password ?? '');
    const role = o.role as Role;

    const account = createAccount({ username, password, role });
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    if (isClientError(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
