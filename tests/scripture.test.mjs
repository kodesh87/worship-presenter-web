/**
 * KJV scripture lookup helpers (Presenter Mode only).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scripture-test-'));
const dbPath = path.join(tmp, 'test.db');
process.env.DB_PATH = dbPath;

const db = new Database(dbPath);
db.exec(`
  CREATE TABLE bible_books (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL
  );
  CREATE TABLE bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    verse_text TEXT NOT NULL,
    translation_code TEXT NOT NULL DEFAULT 'KJV',
    UNIQUE(book_id, chapter, verse, translation_code)
  );
`);
db.prepare(
  `INSERT INTO bible_books (id, name, short_name) VALUES (43, 'John', 'John')`
).run();
db.prepare(
  `INSERT INTO bible_books (id, name, short_name) VALUES (19, 'Psalms', 'Ps')`
).run();
db.prepare(
  `INSERT INTO bible_verses (book_id, chapter, verse, verse_text, translation_code)
   VALUES (43, 4, 23, '@6But the hour cometh@5', 'KJV')`
).run();
db.prepare(
  `INSERT INTO bible_verses (book_id, chapter, verse, verse_text, translation_code)
   VALUES (43, 4, 24, 'God is a Spirit', 'KJV')`
).run();
db.prepare(
  `INSERT INTO bible_verses (book_id, chapter, verse, verse_text, translation_code)
   VALUES (19, 23, 1, 'The LORD is my shepherd', 'KJV')`
).run();
db.prepare(
  `INSERT INTO bible_verses (book_id, chapter, verse, verse_text, translation_code)
   VALUES (43, 3, 16, 'For God so loved the world', 'TB')`
).run();
db.close();

const { parseScriptureRef, lookupScripture, stripVerseMarkup, isBibleTranslationEmpty } =
  await import(pathToFileURL(path.join(root, 'src', 'lib', 'scripture.ts')).href);

test('stripVerseMarkup removes @n tags', () => {
  assert.equal(stripVerseMarkup('@6But the hour@5'), 'But the hour');
});

test('parseScriptureRef handles John+4:23 and ranges', () => {
  assert.deepEqual(parseScriptureRef('John+4:23'), {
    book: 'John',
    chapter: 4,
    verseStart: 23,
    verseEnd: 23,
  });
  assert.deepEqual(parseScriptureRef('John 4:23-24'), {
    book: 'John',
    chapter: 4,
    verseStart: 23,
    verseEnd: 24,
  });
  assert.deepEqual(parseScriptureRef('e.g. Acts 18:9,10'), {
    book: 'Acts',
    chapter: 18,
    verseStart: 9,
    verseEnd: 10,
  });
});

test('lookupScripture returns KJV text for John 4:23', () => {
  const passage = lookupScripture('John 4:23', 'KJV');
  assert.ok(passage);
  assert.equal(passage.reference, 'John 4:23');
  assert.equal(passage.translation, 'KJV');
  assert.match(passage.text, /But the hour cometh/);
});

test('lookupScripture range joins verses', () => {
  const passage = lookupScripture('John 4:23-24', 'KJV');
  assert.ok(passage);
  assert.match(passage.text, /But the hour cometh/);
  assert.match(passage.text, /God is a Spirit/);
});

test('lookupScripture aliases Psalm to Psalms', () => {
  const passage = lookupScripture('Psalm 23:1', 'KJV');
  assert.ok(passage);
  assert.match(passage.text, /The LORD is my shepherd/);
});

test('lookupScripture reads only the named translation', () => {
  const kjv = lookupScripture('John 3:16', 'KJV');
  const tb = lookupScripture('John 3:16', 'TB');
  assert.ok(kjv);
  assert.ok(tb);
  assert.equal(tb.translation, 'TB');
  assert.equal(tb.text, 'For God so loved the world');
  assert.notEqual(kjv.text, tb.text);
});

test('isBibleTranslationEmpty is per translation', () => {
  assert.equal(isBibleTranslationEmpty('KJV'), false);
  assert.equal(isBibleTranslationEmpty('TB'), false);
  assert.equal(isBibleTranslationEmpty('NIV'), true);
});

test('lookupScripture normalizes translation code casing', () => {
  const passage = lookupScripture('John 4:23', 'kjv');
  assert.ok(passage);
  assert.equal(passage.translation, 'KJV');
});
