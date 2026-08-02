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
 *   data/<locale>/bible-translation/<code>.json   e.g. en/bible-translation/kjv.json
 *   data/song-book/<book-code>.json               e.g. sdah.json
 *
 * Neither file has a generator any more. The exports they were converted from
 * are gone, so these files are the source of record; `scripts/verify-corpora.mjs`
 * asserts their structure instead of rebuilding them.
 */
import crypto from 'crypto';
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
  locale: string;
  licence: string;
  provenance: string;
  books: BibleBookSeed[];
  counts: { books: number; chapters: number; verses: number };
};

export type BibleTranslationDescriptor = {
  code: string;
  name: string;
  locale: string;
  licence: string;
  provenance: string;
  corpusPath: string;
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

const DATA_ROOT = path.join(process.cwd(), 'data');

/** Not locale directories — git-ignored or non-corpus paths under `data/`. */
const RESERVED_DATA_DIRS = new Set(['local', 'uploads']);

/** Read translation metadata from a corpus file without validating book payloads. */
function readBibleTranslationMeta(
  corpusPath: string
): BibleTranslationDescriptor | null {
  try {
    const raw = JSON.parse(fs.readFileSync(corpusPath, 'utf8')) as Record<
      string,
      unknown
    >;
    const meta = (raw?.translation ?? {}) as Record<string, unknown>;
    const code = String(meta.code ?? '').toUpperCase();
    if (!code) return null;
    const locale = String(meta.locale ?? meta.language ?? '').trim();
    return {
      code,
      name: String(meta.name ?? code),
      locale,
      licence: String(meta.licence ?? '').trim(),
      provenance: String(meta.provenance ?? '').trim(),
      corpusPath,
    };
  } catch {
    return null;
  }
}

/** Every installed bible translation file on disk, with locale from its directory. */
export function discoverBibleTranslationFiles(): BibleTranslationDescriptor[] {
  const byCode = new Map<string, BibleTranslationDescriptor[]>();

  if (!fs.existsSync(DATA_ROOT)) return [];

  for (const locale of fs.readdirSync(DATA_ROOT)) {
    if (RESERVED_DATA_DIRS.has(locale)) continue;
    const localeDir = path.join(DATA_ROOT, locale);
    if (!fs.statSync(localeDir).isDirectory()) continue;

    const bibleDir = path.join(localeDir, 'bible-translation');
    if (!fs.existsSync(bibleDir) || !fs.statSync(bibleDir).isDirectory()) continue;

    for (const file of fs.readdirSync(bibleDir)) {
      if (!file.endsWith('.json')) continue;
      const corpusPath = path.join(bibleDir, file);
      const code = file.replace(/\.json$/i, '').toUpperCase();
      const entry: BibleTranslationDescriptor = {
        code,
        name: code,
        locale,
        licence: '',
        provenance: '',
        corpusPath,
      };
      const list = byCode.get(code) ?? [];
      list.push(entry);
      byCode.set(code, list);
    }
  }

  const duplicates: string[] = [];
  for (const [code, entries] of byCode) {
    if (entries.length > 1) {
      duplicates.push(
        `${code}: ${entries.map((e) => e.corpusPath).join(' and ')}`
      );
    }
  }
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate bible translation code(s) on disk — boot refuses: ${duplicates.join('; ')}`
    );
  }

  const descriptors: BibleTranslationDescriptor[] = [];
  for (const entries of byCode.values()) {
    descriptors.push(entries[0]);
  }
  descriptors.sort((a, b) => a.code.localeCompare(b.code));
  return descriptors;
}

export function bibleCorpusPath(code = DEFAULT_TRANSLATION): string {
  const normalized = code.toUpperCase();
  const match = discoverBibleTranslationFiles().find(
    (d) => d.code === normalized
  );
  if (!match) {
    throw new Error(
      `No bible translation corpus installed for code "${code}". ` +
        `Installed: ${discoverBibleTranslationFiles()
          .map((d) => d.code)
          .join(', ') || 'none'}`
    );
  }
  return match.corpusPath;
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

function directoryLocaleForPath(corpusPath: string): string {
  const rel = path.relative(DATA_ROOT, corpusPath).replace(/\\/g, '/');
  const parts = rel.split('/');
  return parts[0] ?? '';
}

/** Stable fingerprint of a corpus file's bytes for reconcile skip. */
export function bibleCorpusContentHash(corpusPath: string): string {
  const bytes = fs.readFileSync(corpusPath);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

/** Load and structurally validate a bible translation corpus. */
export function loadBibleCorpus(code = DEFAULT_TRANSLATION): BibleCorpus {
  const corpusPath = bibleCorpusPath(code);
  const directoryLocale = directoryLocaleForPath(corpusPath);
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

  const declaredLocale = String(meta.locale ?? meta.language ?? '').trim();
  if (!declaredLocale) {
    throw new Error(`Bible corpus declares no locale: ${corpusPath}`);
  }
  if (declaredLocale !== directoryLocale) {
    throw new Error(
      `Bible corpus at ${corpusPath} declares locale "${declaredLocale}" ` +
        `but sits under directory "${directoryLocale}"`
    );
  }

  const licence = String(meta.licence ?? '').trim();
  const provenance = String(meta.provenance ?? '').trim();
  if (!licence) {
    throw new Error(`Bible corpus declares no licence: ${corpusPath}`);
  }
  if (!provenance) {
    throw new Error(`Bible corpus declares no provenance: ${corpusPath}`);
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
    locale: declaredLocale,
    licence,
    provenance,
    books,
    counts,
  };
}

/** Every installed bible translation with metadata projected from its corpus file. */
export function listInstalledBibleTranslations(): BibleTranslationDescriptor[] {
  return discoverBibleTranslationFiles().map((descriptor) => {
    const meta = readBibleTranslationMeta(descriptor.corpusPath);
    if (meta?.locale) return meta;
    return descriptor;
  });
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
