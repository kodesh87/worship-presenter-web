/**
 * The corpora ship, and a clone can use them.
 *
 * FR-19 was recorded `done` on 2026-07-19 and did not work on any fresh clone:
 * the UI, the API route and the empty-corpus message all shipped, and the corpus
 * never did. These assertions are structural rather than sampled for that
 * reason — a missing chapter is a Sabbath morning failure, and "spot-checked
 * John 3:16" is what let the gap sit for two weeks.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  DEFAULT_SONG_BOOK,
  DEFAULT_TRANSLATION,
  bibleCorpusPath,
  loadBibleCorpus,
  loadSongBookCorpus,
  songBookCorpusPath,
} from '../src/lib/corpus.ts';

/** Canonical Protestant KJV shape — not read back from the file under test. */
const KJV = { books: 66, chapters: 1189, verses: 31102 };
const SDAH_HYMNS = 695;

test('both corpora are committed, not left to an ops step', () => {
  assert.ok(
    fs.existsSync(bibleCorpusPath(DEFAULT_TRANSLATION)),
    'data/bible/kjv.json must be in the repository'
  );
  assert.ok(
    fs.existsSync(songBookCorpusPath(DEFAULT_SONG_BOOK)),
    'data/song-book/sdah.json must be in the repository'
  );
});

test('the KJV corpus is complete, counted rather than sampled', () => {
  const corpus = loadBibleCorpus(DEFAULT_TRANSLATION);
  assert.equal(corpus.code, 'KJV');
  assert.deepEqual(corpus.counts, KJV);
});

test('every KJV chapter and verse is dense from 1', () => {
  const corpus = loadBibleCorpus(DEFAULT_TRANSLATION);
  for (const book of corpus.books) {
    assert.ok(book.chapters.length > 0, `${book.name} has no chapters`);
    for (const [index, verses] of book.chapters.entries()) {
      assert.ok(
        verses.length > 0,
        `${book.name} ${index + 1} has no verses`
      );
      for (const [v, text] of verses.entries()) {
        assert.ok(
          text.trim().length > 0,
          `${book.name} ${index + 1}:${v + 1} is empty`
        );
      }
    }
  }
});

test('no @N source markup survived the conversion', () => {
  const corpus = loadBibleCorpus(DEFAULT_TRANSLATION);
  const offenders = [];
  for (const book of corpus.books) {
    book.chapters.forEach((verses, c) => {
      verses.forEach((text, v) => {
        if (/@\d+/.test(text)) offenders.push(`${book.name} ${c + 1}:${v + 1}`);
      });
    });
  }
  assert.deepEqual(offenders, []);
});

test('the KJV corpus states its licence and its provenance', () => {
  const raw = JSON.parse(
    fs.readFileSync(bibleCorpusPath(DEFAULT_TRANSLATION), 'utf8')
  );
  assert.match(
    raw.translation.licence,
    /Crown copyright/i,
    'the UK Crown copyright exception is stated rather than glossed'
  );
  assert.ok(raw.translation.provenance.trim().length > 0);
});

test('the song book holds 695 hymns, numbered 1..695 with no gaps', () => {
  const corpus = loadSongBookCorpus(DEFAULT_SONG_BOOK);
  assert.equal(corpus.code, 'SDAH');
  assert.equal(corpus.hymns.length, SDAH_HYMNS);
  corpus.hymns.forEach((hymn, index) => {
    assert.equal(hymn.number, index + 1, `gap or reorder at index ${index}`);
  });
});

test('the song book names its copyright holder and how to have it removed', () => {
  const raw = JSON.parse(
    fs.readFileSync(songBookCorpusPath(DEFAULT_SONG_BOOK), 'utf8')
  );
  assert.match(raw.book.attribution, /Review and Herald/i);
  assert.match(
    raw.book.licence,
    /taken down|removed/i,
    'the takedown offer is part of the corpus, not only of ATTRIBUTIONS.md'
  );
});

/**
 * The readback PRD :120 relies on is the only defence against a valid-but-wrong
 * hymn number, and it echoed a lyric line until 2026-08-01. A title that is
 * merely the opening words back again is not a check a human can fail.
 */
test('hymn titles are titles, not first lyric lines', () => {
  const corpus = loadSongBookCorpus(DEFAULT_SONG_BOOK);

  const overlong = corpus.hymns.filter((h) => h.title.length > 45);
  assert.deepEqual(
    overlong.map((h) => `${h.number}: ${h.title}`),
    [],
    'no title should run past 45 characters'
  );

  // Four the old generator got wrong, each a hymn whose title is nowhere in its
  // first line. If these regress, deriveTitle() has come back.
  const known = new Map([
    [83, 'O Worship the King'],
    [86, 'How Great Thou Art'],
    [159, 'The Old Rugged Cross'],
    [522, 'My Hope Is Built on Nothing Less'],
  ]);
  for (const [number, title] of known) {
    const hymn = corpus.hymns.find((h) => h.number === number);
    assert.equal(hymn.title, title, `SDAH #${number}`);
  }
});

/**
 * Story 23.2's criterion, encoded as the criterion rather than as a line list:
 * a line list rots, and six spine citations rotted inside one session on
 * 2026-08-01.
 *
 * Scope is what *instructs a reader*: the README, `docs/`, and the code and
 * scripts a reader runs. `_bmad-output/` is deliberately out of scope. Those
 * are plans and records — an epic that diagnoses "the only writer was
 * `scripts/import-kjv.mjs`" is describing the gap it was opened to close, not
 * telling anyone to run it, and rewriting a record makes it lie about what was
 * measured on the day.
 */
const INSTRUCTIONAL_ROOTS = ['README.md', 'ATTRIBUTIONS.md', 'package.json', 'docs', 'src', 'scripts'];

function walkInstructionalFiles() {
  const root = path.resolve(import.meta.dirname, '..');
  const files = [];

  const walk = (abs) => {
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(abs)) walk(path.join(abs, entry));
      return;
    }
    if (!/\.(md|mjs|ts|tsx|json)$/.test(abs)) return;
    files.push({ rel: path.relative(root, abs).replace(/\\/g, '/'), abs });
  };

  for (const target of INSTRUCTIONAL_ROOTS) {
    const abs = path.join(root, target);
    if (fs.existsSync(abs)) walk(abs);
  }
  return files;
}

test('nothing a reader follows sends them to a retired import command', () => {
  const retired = /npm run import:(kjv|hymnal)|scripts\/import-(kjv|hymnal)\.mjs/;
  const offenders = walkInstructionalFiles()
    .filter(({ abs }) => retired.test(fs.readFileSync(abs, 'utf8')))
    .map(({ rel }) => rel);

  assert.deepEqual(
    offenders,
    [],
    'these name a command that no longer exists in package.json'
  );
});

test('nothing a reader follows names data/hymns.json as the corpus path', () => {
  const moved = /data\/hymns\.json/;
  const offenders = walkInstructionalFiles()
    .filter(({ abs }) => moved.test(fs.readFileSync(abs, 'utf8')))
    .map(({ rel }) => rel);

  assert.deepEqual(offenders, [], 'the corpus moved to data/song-book/sdah.json');
});

/**
 * The retired scripts are gone, so `package.json` cannot still point at them —
 * the failure mode Story 22.1 named explicitly: a script entry pointing at a
 * file nobody has.
 */
test('package.json runs no script whose file was deleted', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const { scripts } = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8')
  );
  const missing = [];
  for (const [name, command] of Object.entries(scripts)) {
    for (const match of command.matchAll(/(?:^|\s)(scripts\/[\w.-]+\.mjs)/g)) {
      if (!fs.existsSync(path.join(root, match[1]))) {
        missing.push(`${name} -> ${match[1]}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});
