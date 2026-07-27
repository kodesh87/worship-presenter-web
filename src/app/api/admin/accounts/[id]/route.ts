import { NextRequest, NextResponse } from 'next/server';
import { deleteAccount, updateAccount } from '@/lib/auth/accounts';
import { requireAdminSession } from '@/lib/auth/require';
import { bumpTokenVersion } from '@/lib/auth/revocation';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  type Role,
} from '@/lib/auth/session';
import { getDb } from '@/lib/db';

function isClientError(message: string): boolean {
  return /username|password|role|not found|last admin|invalid|required|too long|may only/i.test(
    message
  );
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id: idRaw } = await context.params;
    const id = parseId(idRaw);
    if (id === null) {
      return NextResponse.json({ error: 'invalid account id' }, { status: 400 });
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
    const patch: { role?: Role; password?: string } = {};
    if ('role' in o) patch.role = o.role as Role;
    if ('password' in o) patch.password = String(o.password ?? '');

    if (patch.role === undefined && patch.password === undefined) {
      return NextResponse.json(
        { error: 'Provide role and/or password to update' },
        { status: 400 }
      );
    }

    // An admin reset is the "assume compromise" case too: without this, resetting
    // a stolen account's password leaves the attacker's cookie working for up to
    // the full 7-day TTL. A role change needs no bump — the gate already rejects
    // a cookie whose role no longer matches the row.
    //
    // Both writes go in one transaction: a bump that threw after a committed
    // password write would leave the new password in place with every existing
    // cookie still valid, while the admin sees the request fail.
    const { account, tokenVersion } = getDb().transaction(() => {
      const updated = updateAccount(id, patch);
      return {
        account: updated,
        tokenVersion:
          patch.password !== undefined ? bumpTokenVersion(id) : null,
      };
    })();

    if (tokenVersion !== null && id === session.uid) {
      // The admin reset their own password: re-issue so they are not signed
      // out of the browser they are working in, matching change-password.
      const token = await signSession({
        uid: account.id,
        role: account.role,
        tv: tokenVersion,
      });
      const res = NextResponse.json({ account }, { status: 200 });
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      return res;
    }

    return NextResponse.json({ account }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    if (isClientError(message)) {
      const status = /not found/i.test(message) ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminSession(request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id: idRaw } = await context.params;
    const id = parseId(idRaw);
    if (id === null) {
      return NextResponse.json({ error: 'invalid account id' }, { status: 400 });
    }

    deleteAccount(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    if (isClientError(message)) {
      const status = /not found/i.test(message) ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
