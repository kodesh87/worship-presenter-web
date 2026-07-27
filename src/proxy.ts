/**
 * The single request gate for everything except `/api/webhook`, the login page
 * and the login/logout APIs.
 *
 * Renamed from `middleware.ts` (Next 16 deprecates that convention). The rename
 * is load-bearing, not cosmetic: a `middleware.ts` entry is still compiled for
 * the Edge runtime unless it exports `runtime = 'nodejs'`, while a `proxy.ts`
 * entry always runs on Node.js — which is what lets this file open SQLite and
 * check revocation for every gated request instead of trusting the signature
 * alone. Do not add a `runtime` export here; Next throws if a Proxy file has
 * one.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';
import { validateSessionAgainstDb } from '@/lib/auth/require';
import { safeNextPath } from '@/lib/auth/safe-next';

function wantsJson(request: NextRequest): boolean {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/')) return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json');
}

/**
 * Everything behind this gate is per-user, and the hub is published through a
 * Cloudflare Tunnel where a "cache everything" rule would otherwise be free to
 * store a rendered page and serve it to the next visitor without the origin —
 * and therefore without this gate — ever running. Say so on every gated
 * response, allowed or refused.
 */
function noStore<T extends NextResponse>(response: T): T {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Cookie');
  return response;
}

function unauthorized(request: NextRequest) {
  if (wantsJson(request) || request.nextUrl.pathname.startsWith('/api/')) {
    return noStore(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }
  const login = new URL('/login', request.url);
  const next = safeNextPath(
    request.nextUrl.pathname + request.nextUrl.search
  );
  if (next !== '/') {
    login.searchParams.set('next', next);
  }
  return noStore(NextResponse.redirect(login));
}

function forbidden(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return noStore(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
  }
  return noStore(new NextResponse('Forbidden', { status: 403 }));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  if (!session) {
    return unauthorized(request);
  }

  // Signature + expiry are not enough: logout and password changes revoke
  // server-side, and `requireSession` is only called by the `/api/admin/**`
  // routes and `change-password` — every page and every other API route relies
  // on this check alone. Fail closed if the lookup itself fails: an unreadable
  // DB must not open the hub.
  let current: ReturnType<typeof validateSessionAgainstDb>;
  try {
    current = validateSessionAgainstDb(session);
  } catch (error) {
    console.error('Session re-check failed:', error);
    current = null;
  }

  if (!current) {
    return unauthorized(request);
  }

  const isAdminPath =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/admin');

  if (isAdminPath && current.role !== 'admin') {
    return forbidden(request);
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * This regex is the authorization boundary: anything it does not match is
     * served with no session check at all. `tests/proxy-matcher.test.mjs` pins
     * both halves of it — add an exclusion there in the same change set.
     *
     * Every exclusion is anchored with `(?:/|$)` (or `$`) so a prefix cannot be
     * widened by accident: bare `_next/static` would also exempt a route named
     * `/_next/staticfoo`.
     *
     * Excluded, and why:
     * - api/webhook   -- gated by WEBHOOK_SECRET instead, never by a cookie
     * - api/auth/login, api/auth/logout, login -- reachable while signed out
     * - _next/static, _next/image, favicon.ico -- build output, no user data
     * - assets        -- public/assets/*, the slide backgrounds. Not sensitive,
     *   and a projector deck pulls ~17 of them at once; each one would
     *   otherwise cost two synchronous SQLite queries on the event loop.
     *
     * NOT excluded, deliberately: /api/uploads/* serves member photos and stays
     * gated even though it is served like a static file.
     */
    '/((?!api/webhook(?:/|$)|api/auth/login(?:/|$)|api/auth/logout(?:/|$)|login(?:/|$)|assets(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|favicon\\.ico$).*)',
  ],
};
