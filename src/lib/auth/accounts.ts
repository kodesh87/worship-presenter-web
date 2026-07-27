import { getDb } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import type { Role } from '@/lib/auth/session';

export type Account = {
  id: number;
  username: string;
  role: Role;
  created_at: string;
};

export type AccountRow = Account & {
  password_hash: string;
  token_version: number;
};

/** `Account` plus the token version the freshly issued cookie must carry. */
export type AuthenticatedAccount = Account & {
  token_version: number;
};

const MAX_PASSWORD_LEN = 128;
/** Dummy hash so missing-username path still runs scrypt (timing). */
const DUMMY_HASH =
  '00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function assertRole(role: unknown): Role {
  if (role === 'admin' || role === 'operator') return role;
  throw new Error('role must be admin or operator');
}

function assertPassword(password: string) {
  if (!password || password.length < 8) {
    throw new Error('password must be at least 8 characters');
  }
  if (password.length > MAX_PASSWORD_LEN) {
    throw new Error('password is too long');
  }
}

function countAdmins(db = getDb()): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM accounts WHERE role = 'admin'`)
    .get() as { n: number };
  return Number(row.n);
}

export function listAccounts(): Account[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, username, role, created_at FROM accounts ORDER BY id ASC`
    )
    .all() as Account[];
}

export function getAccountById(id: number): AccountRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, username, role, password_hash, token_version, created_at FROM accounts WHERE id = ?`
    )
    .get(id) as AccountRow | undefined;
  return row ?? null;
}

export function getAccountByUsername(username: string): AccountRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, username, role, password_hash, token_version, created_at FROM accounts WHERE username = ?`
    )
    .get(normalizeUsername(username)) as AccountRow | undefined;
  return row ?? null;
}

export function authenticate(
  username: string,
  password: string
): AuthenticatedAccount | null {
  if (password.length > MAX_PASSWORD_LEN) return null;
  const row = getAccountByUsername(username);
  const ok = verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    token_version: Number(row.token_version),
    created_at: row.created_at,
  };
}

export function createAccount(input: {
  username: string;
  password: string;
  role: Role;
}): Account {
  const username = normalizeUsername(input.username);
  if (!username) throw new Error('username is required');
  if (username.length > 64) throw new Error('username is too long');
  if (!/^[a-z0-9._-]+$/.test(username)) {
    throw new Error(
      'username may only contain letters, numbers, dots, underscores, hyphens'
    );
  }
  assertPassword(input.password);
  const role = assertRole(input.role);
  const password_hash = hashPassword(input.password);

  const db = getDb();
  try {
    const result = db
      .prepare(
        `INSERT INTO accounts (username, password_hash, role)
         VALUES (?, ?, ?)`
      )
      .run(username, password_hash, role);
    const id = Number(result.lastInsertRowid);
    const created = getAccountById(id);
    if (!created) throw new Error('Failed to create account');
    return {
      id: created.id,
      username: created.username,
      role: created.role,
      created_at: created.created_at,
    };
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) {
      throw new Error('username already exists');
    }
    throw e;
  }
}

export function updateAccount(
  id: number,
  patch: { role?: Role; password?: string }
): Account {
  if (!Number.isInteger(id) || id <= 0) throw new Error('invalid account id');

  const db = getDb();
  const tx = db.transaction(() => {
    const existing = db
      .prepare(
        `SELECT id, username, role, password_hash, token_version, created_at FROM accounts WHERE id = ?`
      )
      .get(id) as AccountRow | undefined;
    if (!existing) throw new Error('account not found');

    if (patch.role !== undefined) {
      const role = assertRole(patch.role);
      if (existing.role === 'admin' && role !== 'admin' && countAdmins(db) <= 1) {
        throw new Error('Cannot change role of the last admin');
      }
      db.prepare(`UPDATE accounts SET role = ? WHERE id = ?`).run(role, id);
    }

    if (patch.password !== undefined) {
      assertPassword(patch.password);
      db.prepare(`UPDATE accounts SET password_hash = ? WHERE id = ?`).run(
        hashPassword(patch.password),
        id
      );
    }
  });
  tx();

  const updated = getAccountById(id);
  if (!updated) throw new Error('account not found');
  return {
    id: updated.id,
    username: updated.username,
    role: updated.role,
    created_at: updated.created_at,
  };
}

export function deleteAccount(id: number): void {
  if (!Number.isInteger(id) || id <= 0) throw new Error('invalid account id');

  const db = getDb();
  const tx = db.transaction(() => {
    const existing = db
      .prepare(
        `SELECT id, username, role, password_hash, token_version, created_at FROM accounts WHERE id = ?`
      )
      .get(id) as AccountRow | undefined;
    if (!existing) throw new Error('account not found');
    if (existing.role === 'admin' && countAdmins(db) <= 1) {
      throw new Error('Cannot delete the last admin');
    }
    db.prepare(`DELETE FROM accounts WHERE id = ?`).run(id);
  });
  tx();
}
