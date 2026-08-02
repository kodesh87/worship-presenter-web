import { getDb } from './db';

export type ScripturePassage = {
  reference: string;
  text: string;
  translation: string;
};

/**
 * Strip source markup like `@9was@7` / `@6…@5` — the export encoded the words
 * the 1611 translators supplied (printed italic in the KJV) this way. The
 * committed corpus at `data/en/bible-translation/kjv.json` is already clean and
 * `npm run corpus:verify` fails if a marker reappears, so this now guards
 * verses that reached the table by some other route.
 */
export function stripVerseMarkup(text: string): string {
  return text.replace(/@\d+/g, '').replace(/\s{2,}/g, ' ').trim();
}

type ParsedRef = {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
};

/** Strip placeholder prefixes operators often leave in the field (e.g. from UI copy). */
function normalizeScriptureInput(raw: string): string {
  return decodeURIComponent(raw)
    .replace(/\+/g, ' ')
    .trim()
    .replace(/^(?:e\.g\.|eg\.|example:)\s*/i, '')
    .trim();
}

/** Parse refs like `John 4:23`, `John+4:23`, `1 John 1:1-3`, `Acts 18:9,10`. */
export function parseScriptureRef(raw: string): ParsedRef | null {
  const value = normalizeScriptureInput(raw);
  if (!value) return null;

  const m = value.match(
    /^((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–]\s*(\d+)|\s*,\s*(\d+))?\s*$/
  );
  if (!m) return null;

  const book = m[1].replace(/\s+/g, ' ').trim();
  const chapter = Number(m[2]);
  const verseStart = Number(m[3]);
  const verseEnd = Number(m[4] || m[5] || m[3]);
  if (
    !Number.isInteger(chapter) ||
    !Number.isInteger(verseStart) ||
    !Number.isInteger(verseEnd) ||
    chapter <= 0 ||
    verseStart <= 0 ||
    verseEnd < verseStart
  ) {
    return null;
  }

  return { book, chapter, verseStart, verseEnd };
}

/** Common operator aliases → canonical bible_books.name / short_name. */
const BOOK_ALIASES: Record<string, string> = {
  psalm: 'Psalms',
  psalms: 'Psalms',
  ps: 'Psalms',
  'song of solomon': 'Song of Solomon',
  songofsolomon: 'Song of Solomon',
  sos: 'Song of Solomon',
};

function resolveBookId(bookName: string): number | null {
  const db = getDb();
  const normalized = bookName.trim().toLowerCase();
  const aliased = (BOOK_ALIASES[normalized] || bookName).trim();
  const candidates = Array.from(
    new Set([aliased, bookName.trim(), aliased.replace(/\s+/g, '')])
  );

  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    const row = db
      .prepare(
        `SELECT id FROM bible_books
         WHERE lower(name) = ? OR lower(short_name) = ?
            OR lower(replace(short_name, ' ', '')) = ?
         LIMIT 1`
      )
      .get(key, key, key.replace(/\s+/g, '')) as { id: number } | undefined;
    if (row) return row.id;
  }
  return null;
}

/** True when the named translation holds no verses in the table. */
export function isBibleTranslationEmpty(translationCode: string): boolean {
  const code = translationCode.trim().toUpperCase();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM bible_verses WHERE translation_code = ?`
    )
    .get(code) as { n: number };
  return !row || row.n === 0;
}

/**
 * Look up scripture text for a reference in the named translation. For deck
 * theme/verse slides, do NOT call this — use rundown-supplied scripture only.
 */
export function lookupScripture(
  ref: string,
  translationCode: string
): ScripturePassage | null {
  const code = translationCode.trim().toUpperCase();
  const parsed = parseScriptureRef(ref);
  if (!parsed) return null;

  const bookId = resolveBookId(parsed.book);
  if (bookId == null) return null;

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT verse, verse_text FROM bible_verses
       WHERE book_id = ? AND chapter = ? AND verse >= ? AND verse <= ?
         AND translation_code = ?
       ORDER BY verse ASC`
    )
    .all(
      bookId,
      parsed.chapter,
      parsed.verseStart,
      parsed.verseEnd,
      code
    ) as {
    verse: number;
    verse_text: string;
  }[];

  if (rows.length === 0) return null;

  const text = rows.map((r) => stripVerseMarkup(r.verse_text)).join(' ');
  const reference =
    parsed.verseStart === parsed.verseEnd
      ? `${parsed.book} ${parsed.chapter}:${parsed.verseStart}`
      : `${parsed.book} ${parsed.chapter}:${parsed.verseStart}-${parsed.verseEnd}`;

  return { reference, text, translation: code };
}
