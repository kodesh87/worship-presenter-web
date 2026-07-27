import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../auth/password';
import { seedArtifactRegistry } from '../registry/seed';
import { recordSeedHashesForMigratedRows } from '../registry/store';

/**
 * Marks that the one-time seed-hash backfill has run. Kept in `settings` rather
 * than inferred from the schema so the backfill cannot be skipped by a database
 * that received the column from an earlier build.
 */
const SEED_HASH_BACKFILL_KEY = 'artifact_seed_hash_backfilled';

let db: Database.Database | null = null;

type HymnSeed = {
  number: number;
  title: string;
  lyrics: string;
};

function loadHymnCorpus(): HymnSeed[] {
  const corpusPath = path.join(process.cwd(), 'data', 'hymns.json');
  if (!fs.existsSync(corpusPath)) {
    throw new Error(
      `Missing hymnal corpus at ${corpusPath}. Run: npm run import:hymnal`
    );
  }

  const raw = JSON.parse(fs.readFileSync(corpusPath, 'utf8')) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error(`Invalid hymnal corpus (expected array): ${corpusPath}`);
  }

  const hymns = raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const number = Number(r.number);
      const title = String(r.title ?? '').trim();
      const lyrics = String(r.lyrics ?? '').trim();
      if (!Number.isInteger(number) || number <= 0 || !title || !lyrics) {
        return null;
      }
      return { number, title, lyrics };
    })
    .filter((h): h is HymnSeed => h !== null);

  if (hymns.length === 0) {
    throw new Error(`Hymnal corpus is empty: ${corpusPath}`);
  }

  return hymns;
}

function upsertHymns(database: Database.Database) {
  const hymns = loadHymnCorpus();

  const upsert = database.prepare(`
    INSERT INTO hymns (number, title, lyrics)
    VALUES (@number, @title, @lyrics)
    ON CONFLICT(number) DO UPDATE SET
      title = excluded.title,
      lyrics = excluded.lyrics
  `);

  const tx = database.transaction((rows: HymnSeed[]) => {
    for (const hymn of rows) {
      upsert.run(hymn);
    }
  });

  tx(hymns);
}

export function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.db');
    const dir = path.dirname(dbPath);
    if (dir && dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath);

    // Single-node production defaults (better-sqlite3)
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        raw_payload TEXT NOT NULL,
        parsed_data TEXT,
        images_payload TEXT,
        participants_payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hymns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number INTEGER NOT NULL UNIQUE,
        title TEXT NOT NULL,
        lyrics TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS announcement_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        service_id INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
        token_version INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Failed-login ledger for the login rate limiter. scope is 'user-ip'
      -- (key = "<username>\x1f<address>") or 'ip' (key = the address);
      -- see src/lib/auth/rate-limit.ts and scripts/auth-unlock.mjs.
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY,
        scope TEXT NOT NULL,
        key TEXT NOT NULL,
        attempted_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_login_attempts_scope_key_time
        ON login_attempts (scope, key, attempted_at);

      -- Per-session revocation list; expires_at is the cookie's own exp (unix seconds).
      CREATE TABLE IF NOT EXISTS revoked_sessions (
        sid TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_revoked_sessions_expires_at
        ON revoked_sessions (expires_at);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bible_books (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bible_verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        verse_text TEXT NOT NULL,
        translation TEXT NOT NULL DEFAULT 'KJV',
        UNIQUE(book_id, chapter, verse, translation),
        FOREIGN KEY (book_id) REFERENCES bible_books(id)
      );

      -- seed_hash is the hash of the seed payload this row was last seeded or
      -- reset from; startup re-seeds a row only while its stored payload still
      -- hashes to that value. NULL means "no evidence" and is treated as
      -- edited; the migration below backfills it once so rows written before
      -- the column are not stuck there. See src/lib/registry/store.ts.
      CREATE TABLE IF NOT EXISTS artifact_templates (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        base_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        seed_hash TEXT
      );
    `);

    // Migrate older DBs that predate images_payload / updated_at / participants_payload
    try {
      db.prepare('ALTER TABLE services ADD COLUMN images_payload TEXT').run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
    try {
      db.prepare(
        `ALTER TABLE services ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`
      ).run();
      db.prepare(
        `UPDATE services SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)`
      ).run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
    try {
      db.prepare(
        'ALTER TABLE services ADD COLUMN participants_payload TEXT'
      ).run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
    // Migrate DBs created before session revocation existed.
    try {
      db.prepare(
        `ALTER TABLE accounts ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1`
      ).run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
    // Migrate DBs created before the registry recorded which seed a row came
    // from. Adding the column alone would leave every existing row NULL, which
    // the guard reads as "kept, no evidence" — so self-healing would reach zero
    // templates on exactly the databases it exists for. The backfill stamps
    // each legacy row with its own payload hash so it is read as untouched
    // once and re-seeded to the current shipped template; see
    // `recordSeedHashesForMigratedRows` for why that is safe exactly once.
    //
    // The backfill is gated on its own marker rather than on the ALTER
    // succeeding. Tying it to the ALTER strands any database that received the
    // column from an earlier build before the backfill existed: the ALTER then
    // throws `duplicate column`, the backfill never runs, and those rows keep a
    // NULL hash for good. The marker also makes it idempotent, so a row the
    // administrator edits after migrating is never re-armed.
    try {
      db.prepare(
        'ALTER TABLE artifact_templates ADD COLUMN seed_hash TEXT'
      ).run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
    const backfillSeedHashes = db.transaction((database: Database.Database) => {
      const done = database
        .prepare(`SELECT value FROM settings WHERE key = ?`)
        .get(SEED_HASH_BACKFILL_KEY) as { value: string } | undefined;
      if (done) return 0;
      const recorded = recordSeedHashesForMigratedRows(database);
      database
        .prepare(
          `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`
        )
        .run(SEED_HASH_BACKFILL_KEY, String(recorded));
      return recorded;
    });
    const recorded = backfillSeedHashes.immediate(db);
    if (recorded > 0) {
      console.info(
        `[registry] migration: recorded a seed hash for ${recorded} template(s) ` +
          `written before the column existed; startup re-seeds the ones still ` +
          `holding their seed`
      );
    }

    upsertHymns(db);
    seedArtifactRegistry(db);
    bootstrapAdminIfEmpty(db);
  }

  return db;
}

/** When accounts is empty and bootstrap env is set, seed the first admin. */
function bootstrapAdminIfEmpty(database: Database.Database) {
  const row = database.prepare(`SELECT COUNT(*) AS n FROM accounts`).get() as {
    n: number;
  };
  if (Number(row.n) > 0) return;

  const user = process.env.AUTH_BOOTSTRAP_USER?.trim().toLowerCase();
  const password = process.env.AUTH_BOOTSTRAP_PASSWORD;
  if (!user || !password) return;

  if (user.length > 64 || !/^[a-z0-9._-]+$/.test(user)) {
    throw new Error(
      'AUTH_BOOTSTRAP_USER must be 1–64 chars: letters, numbers, . _ -'
    );
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error(
      'AUTH_BOOTSTRAP_PASSWORD must be 8–128 characters'
    );
  }

  try {
    database
      .prepare(
        `INSERT INTO accounts (username, password_hash, role)
         VALUES (?, ?, 'admin')`
      )
      .run(user, hashPassword(password));
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) return;
    throw e;
  }
}
