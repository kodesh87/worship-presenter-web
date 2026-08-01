/**
 * Assert the committed default seed corpora are complete and loadable.
 * Usage: npm run corpus:verify
 *
 * This replaces `import:kjv` and `import:hymnal`. Neither corpus has a
 * generator any more — the exports they were built from are gone, so these
 * files are the source of record. What a maintainer needs is not a rebuild but
 * a check that what shipped is still whole, asserted structurally rather than
 * sampled: a missing chapter is a Sabbath morning failure, not a test failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Canonical Protestant KJV shape. Not derived from the file it checks. */
const KJV_EXPECTED = { books: 66, chapters: 1189, verses: 31102 };
const SDAH_EXPECTED = { hymns: 695, firstNumber: 1, lastNumber: 695 };

const failures = [];
const notes = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function readJson(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    failures.push(`${relPath}: missing`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    failures.push(`${relPath}: unparseable — ${err.message}`);
    return null;
  }
}

function verifyBible(relPath, expected) {
  const corpus = readJson(relPath);
  if (!corpus) return;

  const code = String(corpus.translation?.code || '');
  check(Boolean(code), `${relPath}: no translation.code`);
  check(
    Boolean(String(corpus.translation?.licence || '').trim()),
    `${relPath}: no translation.licence — a shipped corpus states its terms`
  );
  check(
    Boolean(String(corpus.translation?.provenance || '').trim()),
    `${relPath}: no translation.provenance`
  );
  check(
    path.basename(relPath) === `${code.toLowerCase()}.json`,
    `${relPath}: filename does not match declared code "${code}"`
  );

  const books = Array.isArray(corpus.books) ? corpus.books : [];
  let chapters = 0;
  let verses = 0;
  const ids = new Set();

  for (const book of books) {
    const label = book?.name || `book ${book?.id}`;
    check(Number.isInteger(book?.id) && book.id > 0, `${relPath}: ${label} has no id`);
    check(Boolean(String(book?.name || '').trim()), `${relPath}: book ${book?.id} has no name`);
    check(
      Boolean(String(book?.shortName || '').trim()),
      `${relPath}: ${label} has no shortName`
    );
    check(!ids.has(book?.id), `${relPath}: duplicate book id ${book?.id}`);
    ids.add(book?.id);

    const chapterRows = Array.isArray(book?.chapters) ? book.chapters : [];
    check(chapterRows.length > 0, `${relPath}: ${label} has no chapters`);
    chapters += chapterRows.length;

    chapterRows.forEach((verseRows, c) => {
      if (!Array.isArray(verseRows) || verseRows.length === 0) {
        failures.push(`${relPath}: ${label} ${c + 1} has no verses`);
        return;
      }
      verses += verseRows.length;
      verseRows.forEach((text, v) => {
        if (typeof text !== 'string' || !text.trim()) {
          failures.push(`${relPath}: ${label} ${c + 1}:${v + 1} is empty`);
        } else if (/@\d+/.test(text)) {
          failures.push(
            `${relPath}: ${label} ${c + 1}:${v + 1} still carries @N source markup`
          );
        }
      });
    });
  }

  check(
    books.length === expected.books,
    `${relPath}: ${books.length} books, expected ${expected.books}`
  );
  check(
    chapters === expected.chapters,
    `${relPath}: ${chapters} chapters, expected ${expected.chapters}`
  );
  check(
    verses === expected.verses,
    `${relPath}: ${verses} verses, expected ${expected.verses}`
  );

  for (const key of ['books', 'chapters', 'verses']) {
    const stated = Number(corpus.counts?.[key]);
    const actual = { books: books.length, chapters, verses }[key];
    check(
      stated === actual,
      `${relPath}: counts.${key} says ${stated}, file holds ${actual}`
    );
  }

  notes.push(
    `${relPath}: ${books.length} books, ${chapters} chapters, ${verses} verses`
  );
}

function verifySongBook(relPath, expected) {
  const corpus = readJson(relPath);
  if (!corpus) return;

  const code = String(corpus.book?.code || '');
  check(Boolean(code), `${relPath}: no book.code`);
  check(
    Boolean(String(corpus.book?.attribution || '').trim()),
    `${relPath}: no book.attribution — the copyright holder is named or it does not ship`
  );
  check(
    Boolean(String(corpus.book?.licence || '').trim()),
    `${relPath}: no book.licence — the takedown statement is part of the corpus`
  );
  check(
    path.basename(relPath) === `${code.toLowerCase()}.json`,
    `${relPath}: filename does not match declared code "${code}"`
  );

  const hymns = Array.isArray(corpus.hymns) ? corpus.hymns : [];
  const numbers = new Set();
  for (const hymn of hymns) {
    const n = hymn?.number;
    check(Number.isInteger(n) && n > 0, `${relPath}: hymn with no number`);
    check(!numbers.has(n), `${relPath}: duplicate hymn number ${n}`);
    numbers.add(n);
    check(
      Boolean(String(hymn?.title || '').trim()),
      `${relPath}: hymn ${n} has no title`
    );
    check(
      Boolean(String(hymn?.lyrics || '').trim()),
      `${relPath}: hymn ${n} has no lyrics`
    );
  }

  check(
    hymns.length === expected.hymns,
    `${relPath}: ${hymns.length} hymns, expected ${expected.hymns}`
  );
  const sorted = [...numbers].sort((a, b) => a - b);
  check(
    sorted[0] === expected.firstNumber &&
      sorted[sorted.length - 1] === expected.lastNumber,
    `${relPath}: numbers run ${sorted[0]}–${sorted[sorted.length - 1]}, ` +
      `expected ${expected.firstNumber}–${expected.lastNumber}`
  );
  const gaps = [];
  for (let n = expected.firstNumber; n <= expected.lastNumber; n += 1) {
    if (!numbers.has(n)) gaps.push(n);
  }
  check(gaps.length === 0, `${relPath}: missing numbers ${gaps.join(', ')}`);

  const stated = Number(corpus.counts?.hymns);
  check(
    stated === hymns.length,
    `${relPath}: counts.hymns says ${stated}, file holds ${hymns.length}`
  );

  notes.push(`${relPath}: ${hymns.length} hymns, ${sorted[0]}–${sorted[sorted.length - 1]}`);
}

verifyBible('data/bible/kjv.json', KJV_EXPECTED);
verifySongBook('data/song-book/sdah.json', SDAH_EXPECTED);

for (const note of notes) console.log(`ok   ${note}`);

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):`);
  for (const failure of failures) console.error(`fail ${failure}`);
  process.exit(1);
}

console.log('\nCommitted corpora are complete.');
