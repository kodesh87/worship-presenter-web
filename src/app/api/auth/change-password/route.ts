import { NextRequest, NextResponse } from 'next/server';
import { getAccountById, updateAccount } from '@/lib/auth/accounts';
import { getClientIp } from '@/lib/auth/client-ip';
import { verifyPassword } from '@/lib/auth/password';
import {
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
} from '@/lib/auth/rate-limit';
import { requireSession } from '@/lib/auth/require';
import { bumpTokenVersion } from '@/lib/auth/revocation';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from '@/lib/auth/session';
import { getDb } from '@/lib/db';

const MAX_PASSWORD_LEN = 128;
const RATE_LIMITED = 'Too many attempts. Try again later.';
const WRONG_CURRENT = 'Current password is incorrect';

export async function POST(request: NextRequest) {
  try {
    // Full DB re-check: a cookie that logout or an earlier password change
    // already revoked must not be able to set a new password.
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const { currentPassword, newPassword } = body as Record<string, unknown>;

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required' },
        { status: 400 }
      );
    }

    if (
      !newPassword ||
      typeof newPassword !== 'string' ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (newPassword.length > MAX_PASSWORD_LEN) {
      return NextResponse.json(
        { error: `Password must be at most ${MAX_PASSWORD_LEN} characters` },
        { status: 400 }
      );
    }

    const account = getAccountById(session.uid);
    if (!account) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Being signed in does not make this endpoint safe to hammer: the whole
    // point of the current-password check is that the caller may be holding a
    // stolen cookie, and an unthrottled check is a password oracle they can
    // replay in a loop. Same ledger as login, keyed on the account's username
    // and the caller's address.
    const clientIp = getClientIp(request.headers);
    const limit = checkLoginRateLimit(account.username, clientIp);
    if (limit.limited) {
      const res = NextResponse.json({ error: RATE_LIMITED }, { status: 429 });
      res.headers.set('Retry-After', String(limit.retryAfterSeconds));
      return res;
    }

    // Over-long input cannot match a stored hash, so it is not a credential
    // attempt and must not be charged to the ledger.
    if (currentPassword.length > MAX_PASSWORD_LEN) {
      return NextResponse.json({ error: WRONG_CURRENT }, { status: 401 });
    }

    if (!verifyPassword(currentPassword, account.password_hash)) {
      recordLoginFailure(account.username, clientIp);
      return NextResponse.json({ error: WRONG_CURRENT }, { status: 401 });
    }

    clearLoginFailures(account.username, clientIp);

    // One transaction: if the bump threw after a committed password write, the
    // password would already have changed with nothing revoked — a stolen
    // cookie left live while the user is told the change failed.
    const tokenVersion = getDb().transaction(() => {
      updateAccount(session.uid, { password: newPassword });
      return bumpTokenVersion(session.uid);
    })();

    // Assume compromise: every existing cookie for this account dies, then the
    // caller gets a fresh one so the device they just used stays signed in.
    const token = await signSession({
      uid: account.id,
      role: account.role,
      tv: tokenVersion,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
