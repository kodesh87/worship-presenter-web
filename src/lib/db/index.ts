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
import {
  bootstrapArtifactRegistry,
  DATA_VERSION_KEY,
} from '../registry/seed';

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
export function reconcileBibleCorpus(database: Database.Database) {
  const descriptors = discoverBibleTranslationFiles();

  // AD-27's two-owner hazard, armed by Story 21.2 and closed by Story 21.4. It
  // stays a warning rather than a refusal: installing a translation is a file
  // drop with no registration step (AC-3), so refusing here would break the
  // documented install path to prevent a wrong book name.
  if (descriptors.length > 1) {
    console.warn(
      `[corpus] ${descriptors.length} bible translations installed ` +
        `(${descriptors.map((d) => d.code).join(', ')}) — bible_books holds one ` +
        `global row per book, so the translation reconciling last owns every ` +
        `book name for every reader. Story 21.4 arbitrates this; until it lands, ` +
        `book names are last-writer-wins.`
    );
  }

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

  // The `DO UPDATE` below is AD-27's arbitration point, and it arbitrates by
  // last writer. `bible_books` is one global row per book while `name` and
  // `short_name` are per-translation values, so a second corpus repoints every
  // book name for every reader — silently. It cannot fire while one corpus ships,
  // which `tests/corpus-closure.test.mjs` pins (AC-13). Story 21.4 owns the fix;
  // do not add a corpus file before it lands.
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
    try {
      const corpus = loadBibleCorpus(descriptor.code);
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
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(
        `[corpus] bible translation ${descriptor.code} at ${corpusPath} ` +
          `failed to load — table left unchanged: ${reason}`
      );
    }
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

/**
 * AD-21's pre-counter repair: a database holding `artifact_templates` rows
 * with no `data_version` key predates this story's counter, and its absence
 * is not read as version 0 (AD-21). AD-4 records that no deployment exists
 * yet, so AD-18's total-replacement licence applies — the compacted version-1
 * shape is not migrated row by row; the pre-20.1 rows are wiped so the
 * AD-17 bootstrap that runs immediately after reseeds the compacted shape
 * (position included) from zero. This is the story's one recorded repair
 * transition, and it runs at most once: once the bootstrap stamps
 * `data_version`, the guard's own condition is false on every later boot.
 *
 * DEV NOTE (AC-10): if your local `data.db` predates Story 20.1, this wipes
 * its `artifact_templates` rows on your next boot and reseeds fresh at
 * version 1 — any layout edit you made there is not migrated forward, only
 * the shipped seed. This is a one-time developer-database reset, licensed by
 * AD-4 (no deployment exists yet) and AD-18's total-replacement rule; that
 * licence **expires at first deploy**, after which the same kind of change
 * needs a real migration over live `artifact_templates` rows instead.
 *
 * Exported for `tests/registry-reseed.test.mjs`, which calls this and
 * {@link bootstrapArtifactRegistry} directly, in each order, to prove the
 * `getDb` step order matters.
 */
export function repairPreCounterArtifactRegistry(database: Database.Database) {
  const hasVersion = database
    .prepare(`SELECT 1 FROM settings WHERE key = ?`)
    .get(DATA_VERSION_KEY);
  if (hasVersion) return;

  const { count } = database
    .prepare(`SELECT COUNT(*) AS count FROM artifact_templates`)
    .get() as { count: number };
  if (count === 0) return;

  database.prepare(`DELETE FROM artifact_templates`).run();
  console.info(
    `[registry] Story 20.1: this database predates the AD-21 data-version counter. ` +
      `Compacting ${count} pre-20.1 template row(s) into a fresh data-version-1 bootstrap ` +
      `(developer database reset, licensed by AD-4/AD-18 — that licence expires at first ` +
      `deploy). Any layout edit on those rows was not carried forward; re-apply it after this boot.`
  );
}

export function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.db');
    const dir = path.dirname(dbPath);
    if (dir && dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath);

    try {
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
      -- reset from; an explicit Reset stamps it so the row records which seed
      -- it now holds. See src/lib/registry/store.ts (resetArtifactTemplate).
      --
      -- position is the row's place in the deck (AC-1 of Story 20.1): the
      -- persisted set is exactly 0..N-1 with no duplicate and no gap. It is
      -- assigned once by the AD-17 bootstrap below and never duplicated into
      -- the payload.
      CREATE TABLE IF NOT EXISTS artifact_templates (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        base_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        seed_hash TEXT,
        position INTEGER NOT NULL DEFAULT 0
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
    // Migrate DBs created before the registry recorded which seed a row an
    // explicit Reset restores. Schema only — no row's stored value changes.
    try {
      db.prepare(
        'ALTER TABLE artifact_templates ADD COLUMN seed_hash TEXT'
      ).run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
    // Migrate DBs created before AC-1's ordering column existed. The default
    // is never trusted as a real position — repairPreCounterArtifactRegistry
    // below wipes any row that predates the AD-21 counter, and the AD-17
    // bootstrap that follows assigns every position fresh.
    try {
      db.prepare(
        'ALTER TABLE artifact_templates ADD COLUMN position INTEGER NOT NULL DEFAULT 0'
      ).run();
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
    migrateHymnsForSongBooks(db);
    migrateBibleVersesTranslationCode(db);

    // --- data migrations (AD-18 / AD-21) ---
    repairPreCounterArtifactRegistry(db);

    // --- corpus reconcile (AD-25) ---
    upsertHymns(db);
    reconcileBibleCorpus(db);

    // --- first-boot bootstrap (AD-17) ---
    bootstrapArtifactRegistry(db);

    bootstrapAdminIfEmpty(db);
    } catch (err) {
      db.close();
      db = null;
      throw err;
    }
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
