/**
 * Bible corpus reconcile: AC-7 negative test and AC-14 reboot correction.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { bibleCorpusPath, loadBibleCorpus } from '../src/lib/corpus.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kjvPath = bibleCorpusPath('KJV');

async function loadDbModule(tag) {
  const url =
    pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href + `?${tag}`;
  return await import(url);
}

test('truncated corpus file leaves existing bible_verses rows (AC-7)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-reconcile-ac7-'));
  process.env.DB_PATH = path.join(tmp, 'ac7.db');

  const { getDb, reconcileBibleCorpus } = await loadDbModule('ac7');
  const original = fs.readFileSync(kjvPath, 'utf8');
  const db = getDb();
  const before = db
    .prepare('SELECT COUNT(*) AS n FROM bible_verses WHERE translation_code = ?')
    .get('KJV').n;
  assert.ok(before > 0);

  fs.writeFileSync(kjvPath, '{ "translation": {');
  try {
    reconcileBibleCorpus(db);
    const after = db
      .prepare('SELECT COUNT(*) AS n FROM bible_verses WHERE translation_code = ?')
      .get('KJV').n;
    assert.equal(after, before);
  } finally {
    fs.writeFileSync(kjvPath, original);
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
