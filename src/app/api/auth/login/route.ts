import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/accounts';
import { getClientIp } from '@/lib/auth/client-ip';
import {
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
} from '@/lib/auth/rate-limit';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from '@/lib/auth/session';
import { getDb } from '@/lib/db';

/** Same body for wrong password, unknown user and a locked window. */
const INVALID_CREDENTIALS = 'Invalid username or password';
const RATE_LIMITED = 'Too many login attempts. Try again later.';

const MAX_PASSWORD_LEN = 128;
/**
 * `accounts.username` is capped at 64 characters on create, so nothing longer
 * can match a row. The slack absorbs whitespace that the trim would remove.
 */
const MAX_USERNAME_INPUT_LEN = 96;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

export async function POST(request: NextRequest) {
  try {
    // Ensure schema + bootstrap seed run before auth lookup
    getDb();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const rawUsername = asString((body as Record<string, unknown>).username);
    const password = asString((body as Record<string, unknown>).password);

    // Neither an over-long username nor an over-long password can match a
    // stored credential, so neither is a credential attempt. Answer before any
    // DB work and — critically — without charging the failure ledger: charging
    // would let five junk-sized requests buy a targeted lockout for free.
    if (
      rawUsername.length > MAX_USERNAME_INPUT_LEN ||
      password.length > MAX_PASSWORD_LEN
    ) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    const username = rawUsername.trim();

    if (!username || !password) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    const clientIp = getClientIp(request.headers);

    const secret = process.env.AUTH_SECRET?.trim();
    if (!secret || secret.length < 16) {
      console.error('AUTH_SECRET is missing or shorter than 16 characters');
      return NextResponse.json(
        { error: 'Auth not configured' },
        { status: 503 }
      );
    }

    // Before any credential work: a locked window must not run scrypt, and the
    // body must not differ between a real and an imaginary account. The lock is
    // scoped to this (username, address) pair, so it refuses the attacker who
    // earned it and not the operator signing in from somewhere else.
    const limit = checkLoginRateLimit(username, clientIp);
    if (limit.limited) {
      const res = NextResponse.json({ error: RATE_LIMITED }, { status: 429 });
      res.headers.set('Retry-After', String(limit.retryAfterSeconds));
      return res;
    }

    const account = authenticate(username, password);
    if (!account) {
      recordLoginFailure(username, clientIp);
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // Clears this pair and this address; other addresses keep their ledger.
    clearLoginFailures(account.username, clientIp);

    const token = await signSession({
      uid: account.id,
      role: account.role,
      tv: account.token_version,
    });

    const res = NextResponse.json({
      ok: true,
      role: account.role,
      username: account.username,
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
