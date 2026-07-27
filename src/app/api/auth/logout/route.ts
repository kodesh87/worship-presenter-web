import { NextRequest, NextResponse } from 'next/server';
import { revokeSession } from '@/lib/auth/revocation';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySession,
} from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const accept = request.headers.get('accept') || '';
  const wantsJson = accept.includes('application/json');

  // Clearing the cookie only helps this browser; record the `sid` so a copy of
  // the same cookie stops working everywhere else too. Other devices hold a
  // different `sid` and stay signed in.
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    try {
      revokeSession(session.sid, session.exp);
    } catch (error) {
      // Fail closed, the same way the gate does. If the write did not land
      // (disk full, SQLITE_BUSY past the busy timeout, read-only volume) the
      // token is still valid for the rest of its 7-day life — and so is any
      // copy of it, which is the exact thing `sid` exists to kill. Reporting
      // success here while dropping the cookie would leave the user believing
      // they had signed out. Keep the cookie so this browser is still visibly
      // signed in, and say the logout failed so it can be retried.
      console.error('Logout revocation failed:', error);
      return wantsJson
        ? NextResponse.json({ error: 'Logout failed' }, { status: 500 })
        : new NextResponse('Logout failed', { status: 500 });
    }
  }

  const res = wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL('/login', request.url), 303);

  res.cookies.set(SESSION_COOKIE, '', {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
