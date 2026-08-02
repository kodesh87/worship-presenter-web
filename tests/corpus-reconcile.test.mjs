/**
 * Bible corpus reconcile: AC-7 negative test and AC-14 reboot correction.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadBibleCorpus } from '../src/lib/corpus.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadDbModule(tag) {
  const url =
    pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href + `?${tag}`;
  return await import(url);
}

/**
 * AC-7 breaks a corpus file on purpose, so it breaks a throwaway one rather than
 * the committed KJV. `node --test` runs test files in parallel processes, and
 * `tests/corpus.test.mjs` and `tests/scripture-api.test.mjs` both read
 * `data/en/bible-translation/kjv.json` while this file runs — truncating it here
 * raced them, and a killed process left the 4.36 MB source of record truncated in
 * the working tree. Discovery is `data/<locale>/bible-translation/<code>.json`, so
 * a sidecar locale is enough, and it buys the sibling-untouched half of AC-7 too.
 */
const SIDECAR_LOCALE = 'zz';
const SIDECAR_CODE = 'ZZZ';
const sidecarLocaleDir = path.join(root, 'data', SIDECAR_LOCALE);
const sidecarPath = path.join(
  sidecarLocaleDir,
  'bible-translation',
  `${SIDECAR_CODE.toLowerCase()}.json`
);

/** Book id 999 exists in no real corpus, so `bible_books` never collides. */
const SIDECAR_CORPUS = {
  translation: {
    code: SIDECAR_CODE,
    name: 'Throwaway Test Translation',
    locale: SIDECAR_LOCALE,
    licence: 'Test fixture — not a translation, never shipped.',
    provenance: 'Written and removed by tests/corpus-reconcile.test.mjs.',
  },
  books: [
    {
      id: 999,
      name: 'Book of Nothing',
      shortName: 'Noth',
      chapters: [['first verse', 'second verse']],
    },
  ],
  counts: { books: 1, chapters: 1, verses: 2 },
};

test('unparseable corpus file reconciles nothing, siblings untouched (AC-7)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-reconcile-ac7-'));
  process.env.DB_PATH = path.join(tmp, 'ac7.db');

  fs.mkdirSync(path.dirname(sidecarPath), { recursive: true });
  fs.writeFileSync(sidecarPath, JSON.stringify(SIDECAR_CORPUS, null, 2));

  try {
    const { getDb, reconcileBibleCorpus } = await loadDbModule('ac7');
    const db = getDb();
    const verses = (code) =>
      db
        .prepare('SELECT COUNT(*) AS n FROM bible_verses WHERE translation_code = ?')
        .get(code).n;

    const kjvBefore = verses('KJV');
    assert.ok(kjvBefore > 0, 'KJV seeded on first boot');
    assert.equal(verses(SIDECAR_CODE), 2, 'sidecar seeded on first boot');

    fs.writeFileSync(sidecarPath, '{ "translation": {');
    reconcileBibleCorpus(db);

    assert.equal(verses(SIDECAR_CODE), 2, 'unparseable file removes nothing');
    assert.equal(kjvBefore, verses('KJV'), 'a sibling translation is never touched');
    assert.ok(
      db
        .prepare('SELECT code FROM bible_translations WHERE code = ?')
        .get(SIDECAR_CODE),
      'the registry row survives a file that cannot be read'
    );
  } finally {
    fs.rmSync(sidecarLocaleDir, { recursive: true, force: true });
  }
});

test('edited verse is corrected from file on next reconcile (AC-14)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-reconcile-ac14-'));
  process.env.DB_PATH = path.join(tmp, 'ac14.db');

  const { getDb, reconcileBibleCorpus } = await loadDbModule('ac14');
  const db = getDb();
  const corpus = loadBibleCorpus('KJV');
  const john = corpus.books.find((b) => b.id === 43);
  assert.ok(john, 'John book id 43');
  const fileText = john.chapters[2][15];

  db.prepare(
    `UPDATE bible_verses SET verse_text = ?
     WHERE book_id = 43 AND chapter = 3 AND verse = 16 AND translation_code = 'KJV'`
  ).run('WRONG TEXT IN DB');

  reconcileBibleCorpus(db);

  const row = db
    .prepare(
      `SELECT verse_text FROM bible_verses
       WHERE book_id = 43 AND chapter = 3 AND verse = 16 AND translation_code = 'KJV'`
    )
    .get();
  assert.equal(row.verse_text, fileText);
});
