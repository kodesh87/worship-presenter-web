/**
 * Committed default seed corpora.
 *
 * Both corpora ship in the repository: a clone resolves a scripture reference
 * and a hymn number with no file handed to it and no network at boot. That is
 * the rule, not a permission — see `_bmad-output/project-context.md`.
 *
 * Layout is one file per book/translation, keyed by its own code, so a second
 * one is an addition rather than a rewrite:
 *
 *   data/bible/<translation-code>.json   e.g. kjv.json
 *   data/song-book/<book-code>.json      e.g. sdah.json
 *
 * Neither file has a generator any more. The exports they were converted from
 * are gone, so these files are the source of record; `scripts/verify-corpora.mjs`
 * asserts their structure instead of rebuilding them.
 */
import fs from 'fs';
import path from 'path';

export const DEFAULT_TRANSLATION = 'KJV';
export const DEFAULT_SONG_BOOK = 'SDAH';

export type BibleBookSeed = {
  id: number;
  name: string;
  shortName: string;
  /** chapters[c - 1][v - 1] — dense, verified on load. */
  chapters: string[][];
};

export type BibleCorpus = {
  code: string;
  name: string;
  books: BibleBookSeed[];
  counts: { books: number; chapters: number; verses: number };
};

export type HymnSeed = {
  number: number;
  title: string;
  lyrics: string;
};

export type SongBookCorpus = {
  code: string;
  name: string;
  hymns: HymnSeed[];
};

export function bibleCorpusPath(code = DEFAULT_TRANSLATION): string {
  return path.join(process.cwd(), 'data', 'bible', `${code.toLowerCase()}.json`);
}

export function songBookCorpusPath(code = DEFAULT_SONG_BOOK): string {
  return path.join(
    process.cwd(),
    'data',
    'song-book',
    `${code.toLowerCase()}.json`
  );
}

function readCorpusFile(corpusPath: string, label: string): unknown {
  if (!fs.existsSync(corpusPath)) {
    throw new Error(
      `Missing ${label} corpus at ${corpusPath}. It ships with the repository — ` +
        `restore it from version control rather than regenerating it.`
    );
  }
  try {
    return JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  } catch (err) {
    throw new Error(
      `Unreadable ${label} corpus at ${corpusPath}: ` +
        (err instanceof Error ? err.message : String(err))
    );
  }
}

/** Load and structurally validate a bible translation corpus. */
export function loadBibleCorpus(code = DEFAULT_TRANSLATION): BibleCorpus {
  const corpusPath = bibleCorpusPath(code);
  const raw = readCorpusFile(corpusPath, 'bible') as Record<string, unknown>;

  const meta = (raw?.translation ?? {}) as Record<string, unknown>;
  const declaredCode = String(meta.code ?? '').toUpperCase();
  if (!declaredCode) {
    throw new Error(`Bible corpus declares no translation code: ${corpusPath}`);
  }
  if (declaredCode !== code.toUpperCase()) {
    throw new Error(
      `Bible corpus at ${corpusPath} declares "${declaredCode}" but was loaded as "${code}"`
    );
  }

  const bookRows = raw?.books;
  if (!Array.isArray(bookRows) || bookRows.length === 0) {
    throw new Error(`Bible corpus has no books: ${corpusPath}`);
  }

  let chapters = 0;
  let verses = 0;
  const books: BibleBookSeed[] = bookRows.map((row, index) => {
    const r = (row ?? {}) as Record<string, unknown>;
    const id = Number(r.id);
    const name = String(r.name ?? '').trim();
    const shortName = String(r.shortName ?? name).trim();
    if (!Number.isInteger(id) || id <= 0 || !name) {
      throw new Error(`Bible corpus book ${index} is malformed: ${corpusPath}`);
    }
    const chapterRows = r.chapters;
    if (!Array.isArray(chapterRows) || chapterRows.length === 0) {
      throw new Error(`Bible corpus book ${name} has no chapters: ${corpusPath}`);
    }
    const encoded = chapterRows.map((verseRows, c) => {
      if (!Array.isArray(verseRows) || verseRows.length === 0) {
        throw new Error(
          `Bible corpus ${name} ${c + 1} has no verses: ${corpusPath}`
        );
      }
      return verseRows.map((text, v) => {
        const value = String(text ?? '').trim();
        if (!value) {
          throw new Error(
            `Bible corpus ${name} ${c + 1}:${v + 1} is empty: ${corpusPath}`
          );
        }
        verses += 1;
        return value;
      });
    });
    chapters += encoded.length;
    return { id, name, shortName, chapters: encoded };
  });

  const seen = new Set<number>();
  for (const book of books) {
    if (seen.has(book.id)) {
      throw new Error(`Bible corpus repeats book id ${book.id}: ${corpusPath}`);
    }
    seen.add(book.id);
  }

  const counts = { books: books.length, chapters, verses };
  const declared = (raw?.counts ?? null) as Record<string, unknown> | null;
  if (declared) {
    for (const key of ['books', 'chapters', 'verses'] as const) {
      const stated = Number(declared[key]);
      if (Number.isFinite(stated) && stated !== counts[key]) {
        throw new Error(
          `Bible corpus declares ${stated} ${key} but holds ${counts[key]}: ${corpusPath}`
        );
      }
    }
  }

  return {
    code: declaredCode,
    name: String(meta.name ?? declaredCode),
    books,
    counts,
  };
}

/** Load and structurally validate a song book corpus. */
export function loadSongBookCorpus(code = DEFAULT_SONG_BOOK): SongBookCorpus {
  const corpusPath = songBookCorpusPath(code);
  const raw = readCorpusFile(corpusPath, 'song book') as Record<string, unknown>;

  const meta = (raw?.book ?? {}) as Record<string, unknown>;
  const declaredCode = String(meta.code ?? '').toUpperCase();
  if (!declaredCode) {
    throw new Error(`Song book corpus declares no book code: ${corpusPath}`);
  }
  if (declaredCode !== code.toUpperCase()) {
    throw new Error(
      `Song book corpus at ${corpusPath} declares "${declaredCode}" but was loaded as "${code}"`
    );
  }

  const hymnRows = raw?.hymns;
  if (!Array.isArray(hymnRows) || hymnRows.length === 0) {
    throw new Error(`Song book corpus has no hymns: ${corpusPath}`);
  }

  const numbers = new Set<number>();
  const hymns: HymnSeed[] = hymnRows.map((row, index) => {
    const r = (row ?? {}) as Record<string, unknown>;
    const number = Number(r.number);
    const title = String(r.title ?? '').trim();
    const lyrics = String(r.lyrics ?? '').trim();
    if (!Number.isInteger(number) || number <= 0 || !title || !lyrics) {
      throw new Error(
        `Song book corpus entry ${index} is malformed: ${corpusPath}`
      );
    }
    if (numbers.has(number)) {
      throw new Error(
        `Song book corpus repeats number ${number}: ${corpusPath}`
      );
    }
    numbers.add(number);
    return { number, title, lyrics };
  });

  const declared = (raw?.counts ?? null) as Record<string, unknown> | null;
  const stated = Number(declared?.hymns);
  if (Number.isFinite(stated) && stated !== hymns.length) {
    throw new Error(
      `Song book corpus declares ${stated} hymns but holds ${hymns.length}: ${corpusPath}`
    );
  }

  hymns.sort((a, b) => a.number - b.number);
  return {
    code: declaredCode,
    name: String(meta.name ?? declaredCode),
    hymns,
  };
}
