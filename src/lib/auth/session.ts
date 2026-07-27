/**
 * Signed session cookie helpers.
 * Edge-safe: Web Crypto HMAC only (no Node crypto / SQLite).
 */

export const SESSION_COOKIE = 'auth_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = 'admin' | 'operator';

export type SessionPayload = {
  uid: number;
  role: Role;
  /** Per-session id — logout revokes exactly this one. */
  sid: string;
  /** Account token version — a password change bumps it and kills every session. */
  tv: number;
  exp: number;
};

/** 128 bits of randomness, base64url — same alphabet `SID_PATTERN` accepts. */
const SID_BYTES = 16;
const SID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function generateSessionId(): string {
  const bytes = new Uint8Array(SID_BYTES);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  if (secret.length < 16) {
    throw new Error('AUTH_SECRET must be at least 16 characters');
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad =
    padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'operator';
}

function isValidSid(value: unknown): value is string {
  return typeof value === 'string' && SID_PATTERN.test(value);
}

function isValidTokenVersion(value: unknown): value is number {
  const tv = Number(value);
  return Number.isInteger(tv) && tv >= 1;
}

function parsePayload(raw: unknown): SessionPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const uid = Number(o.uid);
  const exp = Number(o.exp);
  if (!Number.isInteger(uid) || uid <= 0) return null;
  if (!Number.isFinite(exp) || exp <= 0) return null;
  if (!isRole(o.role)) return null;
  // Fail closed on cookies that predate `sid`/`tv`: a token without them cannot
  // be checked against the revocation list, so it is not a valid session.
  if (!isValidSid(o.sid)) return null;
  if (!isValidTokenVersion(o.tv)) return null;
  return { uid, role: o.role, sid: o.sid, tv: Number(o.tv), exp };
}

/**
 * The signing side enforces exactly what `parsePayload` enforces on verify.
 * Two things this stops: a caller reusing an existing `sid` (logout would then
 * revoke a session that is still being handed out), and a `tv` outside the
 * range `parsePayload` accepts (which would mint a cookie that can never
 * verify). Both are programmer errors, so they throw rather than fail closed.
 */
export async function signSession(
  payload: Omit<SessionPayload, 'exp' | 'sid'> & { sid?: string; exp?: number }
): Promise<string> {
  const secret = getAuthSecret();
  if (payload.sid !== undefined && !isValidSid(payload.sid)) {
    throw new Error('signSession: sid is not a valid session id');
  }
  if (!isValidTokenVersion(payload.tv)) {
    throw new Error('signSession: tv must be an integer >= 1');
  }
  const body: SessionPayload = {
    uid: payload.uid,
    role: payload.role,
    sid: payload.sid ?? generateSessionId(),
    tv: Number(payload.tv),
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadB64 = toBase64Url(
    new TextEncoder().encode(JSON.stringify(body))
  );
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64)
  );
  return `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let secret: string;
  try {
    secret = getAuthSecret();
  } catch {
    return null;
  }

  try {
    const key = await importHmacKey(secret);
    const sig = Uint8Array.from(fromBase64Url(sigB64));
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      new TextEncoder().encode(payloadB64)
    );
    if (!ok) return null;

    const json = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = parsePayload(JSON.parse(json) as unknown);
    if (!payload) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
