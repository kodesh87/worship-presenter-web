/**
 * Import KJV books + verses from .work/tp_bible_*.json into SQLite.
 * Usage: npm run import:kjv
 * Never used for deck theme/verse slides — Presenter Mode scripture only.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function findLatest(globPrefix) {
  const workDir = path.join(root, '.work');
  if (!fs.existsSync(workDir)) {
    throw new Error(`Missing .work directory at ${workDir}`);
  }
  const files = fs
    .readdirSync(workDir)
    .filter((f) => f.startsWith(globPrefix) && f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    throw new Error(`No ${globPrefix}*.json found in .work/`);
  }
  return path.join(workDir, files[files.length - 1]);
}

function stripVerseMarkup(text) {
  return String(text || '')
    .replace(/@\d+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const booksPath = findLatest('tp_bible_book_translations_');
const versesPath = findLatest('tp_bible_verses_');
const dbPath = process.env.DB_PATH || path.join(root, 'data.db');

console.log('Books:', booksPath);
console.log('Verses:', versesPath);
console.log('DB:', dbPath);

const booksJson = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
const versesJson = JSON.parse(fs.readFileSync(versesPath, 'utf8'));

const bookRows = booksJson.tp_bible_book_translations;
if (!Array.isArray(bookRows)) {
  throw new Error('Expected tp_bible_book_translations array');
}

const verseKey = Object.keys(versesJson).find((k) =>
  Array.isArray(versesJson[k])
);
if (!verseKey) {
  throw new Error('Expected verse array in verses JSON');
}
const verseRows = versesJson[verseKey];

const enBooks = bookRows.filter(
  (b) =>
    b &&
    (b.locale === 'en' || !b.locale) &&
    Number(b.row_status) !== 0 &&
    b.id_bible_books
);

const kjvVerses = verseRows.filter((v) => {
  if (!v) return false;
  const code = String(v.code_bible_translations || '').toUpperCase();
  return code === 'KJV' && Number(v.row_status) !== 0;
});

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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
`);

const upsertBook = db.prepare(`
  INSERT INTO bible_books (id, name, short_name)
  VALUES (@id, @name, @short_name)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    short_name = excluded.short_name
`);

const upsertVerse = db.prepare(`
  INSERT INTO bible_verses (book_id, chapter, verse, verse_text, translation)
  VALUES (@book_id, @chapter, @verse, @verse_text, 'KJV')
  ON CONFLICT(book_id, chapter, verse, translation) DO UPDATE SET
    verse_text = excluded.verse_text
`);

const tx = db.transaction(() => {
  for (const b of enBooks) {
    upsertBook.run({
      id: Number(b.id_bible_books),
      name: String(b.name || '').trim(),
      short_name: String(b.short_name || b.name || '').trim(),
    });
  }
  for (const v of kjvVerses) {
    const text = stripVerseMarkup(v.verse_text);
    if (!text) continue;
    upsertVerse.run({
      book_id: Number(v.id_bible_books),
      chapter: Number(v.chapter),
      verse: Number(v.verse),
      verse_text: text,
    });
  }
});

tx();

const bookCount = db.prepare(`SELECT COUNT(*) AS n FROM bible_books`).get().n;
const verseCount = db
  .prepare(`SELECT COUNT(*) AS n FROM bible_verses WHERE translation = 'KJV'`)
  .get().n;

console.log(`Imported ${bookCount} books, ${verseCount} KJV verses.`);
db.close();
