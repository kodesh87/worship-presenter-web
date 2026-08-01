import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../auth/password';
import {
  DEFAULT_SONG_BOOK,
  bibleCorpusContentHash,
  discoverBibleTranslationFiles,
  loadBibleCorpus,
  loadSongBookCorpus,
  type HymnSeed,
} from '../corpus';
import { seedArtifactRegistry } from '../registry/seed';
import { recordSeedHashesForMigratedRows } from '../registry/store';

/**
 * Marks that the one-time seed-hash backfill has run. Kept in `settings` rather
 * than inferred from the schema so the backfill cannot be skipped by a database
 * that received the column from an earlier build.
 */
const SEED_HASH_BACKFILL_KEY = 'artifact_seed_hash_backfilled';

let db: Database.Database | null = null;

/**
 * `hymns` was created with `number INTEGER NOT NULL UNIQUE` — globally unique,
 * and every song book has a #1, so a second book could not be stored. SQLite
 * cannot add or drop a table constraint in place, so the table is rebuilt once.
 * Existing rows are all SDAH: it was the only corpus that ever shipped.
 */
function migrateHymnsForSongBooks(database: Database.Database) {
  const columns = database.prepare(`PRAGMA table_info(hymns)`).all() as {
    name: string;
  }[];
  if (columns.length === 0) return;
  if (columns.some((c) => c.name === 'book_code')) return;

  database.exec(`
    CREATE TABLE hymns_with_book_code (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_code TEXT NOT NULL DEFAULT '${DEFAULT_SONG_BOOK}',
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      lyrics TEXT NOT NULL,
      UNIQUE(book_code, number)
    );
    INSERT INTO hymns_with_book_code (id, book_code, number, title, lyrics)
      SELECT id, '${DEFAULT_SONG_BOOK}', number, title, lyrics FROM hymns;
    DROP TABLE hymns;
    ALTER TABLE hymns_with_book_code RENAME TO hymns;
  `);

  console.info(
    `[corpus] migration: hymns keyed by (book_code, number); existing rows ` +
      `recorded as ${DEFAULT_SONG_BOOK}`
  );
}

/**
 * Song book corpus rides the boot upsert it has always ridden: title and lyrics
 * are re-applied from the committed file on every boot. Whether a shipped
 * reference corpus should keep that channel is an open architecture question
 * (no AD governs it yet) — this function does not answer it, it only stops
 * reading the old un-keyed path.
 */
function upsertHymns(database: Database.Database) {
  const corpus = loadSongBookCorpus(DEFAULT_SONG_BOOK);

  const upsert = database.prepare(`
    INSERT INTO hymns (book_code, number, title, lyrics)
    VALUES (@book_code, @number, @title, @lyrics)
    ON CONFLICT(book_code, number) DO UPDATE SET
      title = excluded.title,
      lyrics = excluded.lyrics
  `);

  const tx = database.transaction((rows: HymnSeed[]) => {
    for (const hymn of rows) {
      upsert.run({ ...hymn, book_code: corpus.code });
    }
  });

  tx(corpus.hymns);
}

/**
 * `bible_verses.translation` was renamed to `translation_code` (Story 21.2).
 * SQLite cannot rename a column in place when the UNIQUE constraint names it,
 * so the table is rebuilt once.
 */
function migrateBibleVersesTranslationCode(database: Database.Database) {
  const columns = database.prepare(`PRAGMA table_info(bible_verses)`).all() as {
    name: string;
  }[];
  if (columns.length === 0) return;
  if (columns.some((c) => c.name === 'translation_code')) return;

  database.exec(`
    CREATE TABLE bible_verses_with_translation_code (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      verse_text TEXT NOT NULL,
      translation_code TEXT NOT NULL DEFAULT 'KJV',
      UNIQUE(book_id, chapter, verse, translation_code),
      FOREIGN KEY (book_id) REFERENCES bible_books(id)
    );
    INSERT INTO bible_verses_with_translation_code
      (id, book_id, chapter, verse, verse_text, translation_code)
      SELECT id, book_id, chapter, verse, verse_text, translation FROM bible_verses;
    DROP TABLE bible_verses;
    ALTER TABLE bible_verses_with_translation_code RENAME TO bible_verses;
  `);

  console.info(
    '[corpus] migration: bible_verses.translation renamed to translation_code'
  );
}

/**
 * Bible corpus reconciles from its committed file on every boot (AD-25).
 * Measured ~133-152 ms per reconcile on a developer machine (Story 21.2).
 */
function reconcileBibleCorpus(database: Database.Database) {
  const descriptors = discoverBibleTranslationFiles();

  const upsertRegistry = database.prepare(`
    INSERT INTO bible_translations (code, name, locale, licence, provenance, content_hash)
    VALUES (@code, @name, @locale, @licence, @provenance, @content_hash)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      locale = excluded.locale,
      licence = excluded.licence,
      provenance = excluded.provenance,
      content_hash = excluded.content_hash
  `);

  const insertBook = database.prepare(`
    INSERT INTO bible_books (id, name, short_name)
    VALUES (@id, @name, @short_name)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      short_name = excluded.short_name
  `);

  const upsertVerse = database.prepare(`
    INSERT INTO bible_verses (book_id, chapter, verse, verse_text, translation_code)
    VALUES (@book_id, @chapter, @verse, @verse_text, @translation_code)
    ON CONFLICT(book_id, chapter, verse, translation_code) DO UPDATE SET
      verse_text = excluded.verse_text
  `);

  const deleteVerse = database.prepare(`
    DELETE FROM bible_verses
    WHERE translation_code = @translation_code
      AND book_id = @book_id
      AND chapter = @chapter
      AND verse = @verse
  `);

  for (const descriptor of descriptors) {
    const corpusPath = descriptor.corpusPath;
    let corpus;
    try {
      corpus = loadBibleCorpus(descriptor.code);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(
        `[corpus] bible translation ${descriptor.code} at ${corpusPath} ` +
          `failed to load — table left unchanged: ${reason}`
      );
      continue;
    }

    const contentHash = bibleCorpusContentHash(corpusPath);
    const reconcileStart = Date.now();

    const reconcileOne = database.transaction(() => {
      upsertRegistry.run({
        code: corpus.code,
        name: corpus.name,
        locale: corpus.locale,
        licence: corpus.licence,
        provenance: corpus.provenance,
        content_hash: contentHash,
      });

      const fileKeys = new Set<string>();

      for (const book of corpus.books) {
        insertBook.run({
          id: book.id,
          name: book.name,
          short_name: book.shortName,
        });
        book.chapters.forEach((verses, chapterIndex) => {
          verses.forEach((verse_text, verseIndex) => {
            const chapter = chapterIndex + 1;
            const verse = verseIndex + 1;
            fileKeys.add(`${book.id}:${chapter}:${verse}`);
            upsertVerse.run({
              book_id: book.id,
              chapter,
              verse,
              verse_text,
              translation_code: corpus.code,
            });
          });
        });
      }

      const stored = database
        .prepare(
          `SELECT book_id, chapter, verse FROM bible_verses
           WHERE translation_code = ?`
        )
        .all(corpus.code) as {
        book_id: number;
        chapter: number;
        verse: number;
      }[];

      for (const row of stored) {
        const key = `${row.book_id}:${row.chapter}:${row.verse}`;
        if (!fileKeys.has(key)) {
          deleteVerse.run({
            translation_code: corpus.code,
            book_id: row.book_id,
            chapter: row.chapter,
            verse: row.verse,
          });
        }
      }
    });

    reconcileOne();

    const elapsedMs = Date.now() - reconcileStart;
    console.info(
      `[corpus] reconciled ${corpus.counts.verses} ${corpus.code} verses across ` +
        `${corpus.counts.books} books (${elapsedMs} ms)`
    );
  }
}

/** Every installed bible translation with locale — no locale filter on the query. */
export function listBibleTranslations() {
  const database = getDb();
  return database
    .prepare(
      `SELECT code, name, locale, licence, provenance
       FROM bible_translations
       ORDER BY code`
    )
    .all() as {
    code: string;
    name: string;
    locale: string;
    licence: string;
    provenance: string;
  }[];
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

      -- Keyed by (book_code, number), never by number alone: every song book
      -- has a #1. book_code matches the corpus file at data/song-book/<code>.json.
      CREATE TABLE IF NOT EXISTS hymns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_code TEXT NOT NULL DEFAULT 'SDAH',
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        lyrics TEXT NOT NULL,
        UNIQUE(book_code, number)
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

      CREATE TABLE IF NOT EXISTS bible_translations (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        locale TEXT NOT NULL,
        licence TEXT NOT NULL,
        provenance TEXT NOT NULL,
        content_hash TEXT
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
        translation_code TEXT NOT NULL DEFAULT 'KJV',
        UNIQUE(book_id, chapter, verse, translation_code),
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

    migrateHymnsForSongBooks(db);
    migrateBibleVersesTranslationCode(db);
    upsertHymns(db);
    reconcileBibleCorpus(db);
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
