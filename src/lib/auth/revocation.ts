/**
 * Server-side session invalidation.
 *
 * The cookie is a self-contained signed token, so revoking it needs a record
 * the gate can consult. Two mechanisms, answering different questions:
 *
 *   sid -> one session   (logout: kill this cookie, leave other devices alone)
 *   tv  -> all sessions  (password change: assume compromise, kill everything)
 */

import { getDb } from '@/lib/db';
import { SESSION_TTL_SECONDS } from '@/lib/auth/session';

/**
 * How far past a cookie's own `exp` its denylist row is kept.
 *
 * Pruning on wall-clock time alone is only safe if the clock never moves
 * backwards. If the host clock steps forward (bad NTP, a VM resume, a manual
 * correction) and is then put back, a prune inside that window would delete
 * rows for cookies that are still perfectly valid — and every logged-out
 * cookie it deleted would start working again, silently and permanently.
 * A full TTL of slack means the row outlives any skew smaller than the cookie
 * lifetime itself. The table holds one short row per logout, so the cost of
 * keeping them twice as long is nil.
 */
const REVOCATION_RETENTION_SECONDS = SESSION_TTL_SECONDS;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Drop rows whose cookie expired at least `REVOCATION_RETENTION_SECONDS` ago —
 * bounds the table without racing the clock.
 */
export function pruneExpiredRevocations(): void {
  getDb()
    .prepare(`DELETE FROM revoked_sessions WHERE expires_at <= ?`)
    .run(nowSeconds() - REVOCATION_RETENTION_SECONDS);
}

/**
 * `expiresAt` is the token's own `exp` (unix seconds). The row is dead weight
 * only once that moment is `REVOCATION_RETENTION_SECONDS` in the past.
 */
export function revokeSession(sid: string, expiresAt: number): void {
  // Callers treat "did not throw" as "the revocation is recorded" — logout
  // reports failure otherwise. Nothing may return quietly without a row.
  if (!sid) throw new Error('revokeSession: sid is required');
  getDb()
    .prepare(
      `INSERT INTO revoked_sessions (sid, expires_at) VALUES (?, ?)
       ON CONFLICT(sid) DO UPDATE SET expires_at = MAX(expires_at, excluded.expires_at)`
    )
    .run(sid, Math.floor(expiresAt));
  // Opportunistic prune, only once the row that matters is safely down: rows
  // are only ever created here, so cleaning up on insert keeps growth
  // proportional to live sessions. Housekeeping must never turn a revocation
  // that did land into a reported logout failure.
  try {
    pruneExpiredRevocations();
  } catch (error) {
    console.error('Revocation prune failed:', error);
  }
}

export function isSessionRevoked(sid: string): boolean {
  if (!sid) return true;
  const row = getDb()
    .prepare(`SELECT 1 AS hit FROM revoked_sessions WHERE sid = ?`)
    .get(sid) as { hit: number } | undefined;
  return row !== undefined;
}

/** Bumps `accounts.token_version`, invalidating every cookie for the account. */
export function bumpTokenVersion(accountId: number): number {
  const db = getDb();
  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE accounts SET token_version = token_version + 1 WHERE id = ?`
      )
      .run(accountId);
    if (result.changes === 0) throw new Error('account not found');
    const row = db
      .prepare(`SELECT token_version FROM accounts WHERE id = ?`)
      .get(accountId) as { token_version: number };
    return Number(row.token_version);
  });
  return tx();
}
