import { getDb } from './db';

export type LyricSlide = {
  /** e.g. "1/3", "Reff", "Chorus" */
  label: string;
  text: string;
};

export type HymnRecord = {
  number: number;
  title: string;
  lyrics: string;
};

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lookup hymn by SDAH number. */
export function lookupHymnByNumber(number: number): HymnRecord | null {
  if (!Number.isInteger(number) || number <= 0) return null;
  const db = getDb();
  const row = db
    .prepare('SELECT number, title, lyrics FROM hymns WHERE number = ?')
    .get(number) as HymnRecord | undefined;
  if (!row?.lyrics?.trim()) return null;
  return { number: row.number, title: row.title, lyrics: row.lyrics };
}

/**
 * Fuzzy title match against hymnal DB.
 * Prefers exact normalized match, then prefix/includes of the query.
 */
export function lookupHymnByTitleFuzzy(query: string): HymnRecord | null {
  const needle = normalizeTitle(query);
  if (!needle) return null;

  const db = getDb();
  const rows = db
    .prepare('SELECT number, title, lyrics FROM hymns')
    .all() as HymnRecord[];

  let best: { score: number; hymn: HymnRecord } | null = null;

  for (const row of rows) {
    if (!row.lyrics?.trim()) continue;
    const hay = normalizeTitle(row.title);
    if (!hay) continue;

    let score = 0;
    if (hay === needle) score = 100;
    else if (hay.startsWith(needle) || needle.startsWith(hay)) score = 80;
    else if (hay.includes(needle) || needle.includes(hay)) score = 60;
    else {
      // token overlap (e.g. "We Have This Hope" vs full title)
      const nTokens = needle.split(' ').filter(Boolean);
      const hTokens = new Set(hay.split(' ').filter(Boolean));
      const hits = nTokens.filter((t) => hTokens.has(t)).length;
      if (hits >= 3 && hits / nTokens.length >= 0.75) {
        score = 40 + hits;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { score, hymn: row };
    }
  }

  return best?.hymn ?? null;
}

/**
 * Fixed Template Skeleton Intercessory standing pair (not payload Song
 * Blocks). Their fixed lyric text now lives in the registry seed as two
 * General rows (`intercessory-671-lyric-1`, `intercessory-684-lyric-1` —
 * AD-20, Story 20.1), but this set still filters #671/#684 out of the weekly
 * hymn buckets (`slide-plan.ts`) so a rundown that lists either number cannot
 * claim a weekly song position.
 */
export const INTERCESSORY_STANDING_NUMBERS = [671, 684] as const;

type LyricSection = {
  kind: 'verse' | 'chorus' | 'reff' | 'body';
  verseIndex?: number;
  lines: string[];
};

const SECTION_HEADER =
  /^(Verse(?:\s+(\d+))?|Chorus|Reff|Refrain)\s*$/i;

/** Soft readability budget for continuous prose on one lyric slide. */
const CONTINUOUS_CHAR_BUDGET = 320;

/** Terminal punct, optionally followed by a closing quote/bracket. */
const TERMINAL_PUNCTUATION = /[.!,?;:]["'`’”)\]]?$/;

/**
 * Join section lines into continuous prose.
 * Terminal punctuation (`. , ! ? ; :`) → space; otherwise → `"; "`.
 */
function joinLinesContinuous(lines: string[]): string {
  if (lines.length === 0) return '';
  let result = lines[0];
  for (let i = 1; i < lines.length; i++) {
    const sep = TERMINAL_PUNCTUATION.test(result) ? ' ' : '; ';
    result = `${result}${sep}${lines[i]}`;
  }
  return result;
}

/**
 * Split continuous prose under a character budget.
 * Prefers breaks after `"; "` or sentence endings; word-boundary before hard slice.
 */
function chunkContinuousText(
  text: string,
  maxChars: number = CONTINUOUS_CHAR_BUDGET
): string[] {
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    let breakAt = -1;
    for (const sep of ['; ', '. ', '! ', '? ', ': '] as const) {
      let idx = remaining.lastIndexOf(sep, maxChars - 1);
      while (idx > 0) {
        const end = idx + sep.length;
        if (end <= maxChars && end < remaining.length) {
          breakAt = Math.max(breakAt, end);
          break;
        }
        idx = remaining.lastIndexOf(sep, idx - 1);
      }
    }
    if (breakAt <= 0) {
      // Prefer last whitespace in budget so we do not mid-word hard-slice.
      const spaceIdx = remaining.lastIndexOf(' ', maxChars - 1);
      breakAt = spaceIdx > 0 ? spaceIdx + 1 : maxChars;
    }

    chunks.push(remaining.slice(0, breakAt).trimEnd());
    remaining = remaining.slice(breakAt).trimStart();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

/**
 * Chunk a section for slides.
 * Default: continuous prose gated by {@link CONTINUOUS_CHAR_BUDGET}.
 * With `preserveLineBreaks`: keep `\n` joins and chunk by `maxLinesPerSlide`.
 */
function chunkLines(
  lines: string[],
  maxLinesPerSlide: number,
  preserveLineBreaks = false
): string[] {
  if (lines.length === 0) return [];
  if (preserveLineBreaks) {
    const chunks: string[] = [];
    for (let i = 0; i < lines.length; i += maxLinesPerSlide) {
      chunks.push(lines.slice(i, i + maxLinesPerSlide).join('\n'));
    }
    return chunks;
  }
  return chunkContinuousText(joinLinesContinuous(lines));
}

function parseSections(lyrics: string): LyricSection[] {
  const normalized = lyrics.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;
  let autoVerse = 0;

  const pushCurrent = () => {
    if (current && current.lines.some((l) => l.trim())) {
      sections.push({
        ...current,
        lines: current.lines.map((l) => l.trim()).filter(Boolean),
      });
    }
    current = null;
  };

  for (const raw of rawLines) {
    const line = raw.trim();
    const header = line.match(SECTION_HEADER);
    if (header) {
      pushCurrent();
      const kindRaw = header[1].toLowerCase();
      if (kindRaw.startsWith('verse')) {
        autoVerse += 1;
        const n = header[2] ? parseInt(header[2], 10) : autoVerse;
        current = { kind: 'verse', verseIndex: n, lines: [] };
      } else if (kindRaw.startsWith('chorus')) {
        current = { kind: 'chorus', lines: [] };
      } else {
        current = { kind: 'reff', lines: [] };
      }
      continue;
    }

    if (!current) {
      current = { kind: 'body', lines: [] };
    }

    // Preserve blank lines as stanza breaks inside a section by ignoring
    // empties here; blank lines just separate text within the block.
    if (line) current.lines.push(line);
  }

  pushCurrent();
  return sections;
}

/**
 * Fill empty Chorus/Reff placeholders with the first non-empty refrain text.
 */
function fillEmptyRefrains(sections: LyricSection[]): LyricSection[] {
  const template =
    sections.find(
      (s) =>
        (s.kind === 'chorus' || s.kind === 'reff') && s.lines.length > 0
    ) ?? null;

  if (!template) return sections;

  return sections.map((s) => {
    if ((s.kind === 'chorus' || s.kind === 'reff') && s.lines.length === 0) {
      return { ...s, lines: [...template.lines] };
    }
    return s;
  });
}

/**
 * Always emit Verse→Chorus after every verse when ≥1 verse and ≥1 refrain exist.
 * Uses the first non-empty Chorus/Reff/Refrain as the template; appends body last.
 */
function expandTrailingRefrain(sections: LyricSection[]): LyricSection[] {
  const verses = sections.filter((s) => s.kind === 'verse');
  const refrains = sections.filter(
    (s) => s.kind === 'chorus' || s.kind === 'reff'
  );
  const bodies = sections.filter((s) => s.kind === 'body');

  if (verses.length === 0 || refrains.length === 0) {
    return sections;
  }

  const template = refrains.find((r) => r.lines.length > 0);
  if (!template) {
    return sections;
  }

  const expanded: LyricSection[] = [];
  for (const verse of verses) {
    expanded.push(verse, { ...template, lines: [...template.lines] });
  }
  expanded.push(...bodies);
  return expanded;
}

export type SplitLyricsOptions = {
  /**
   * When true, keep original line breaks (`\n`) instead of CAP-1 continuous
   * prose joining (`; ` / space). Chunks by `maxLinesPerSlide`.
   */
  preserveLineBreaks?: boolean;
};

/**
 * Split lyrics into labeled slides. Verse/Chorus/Reff aware:
 * - empty Chorus/Reff placeholders inherit the first refrain text
 * - any song with ≥1 verse and ≥1 refrain emits Verse→Chorus after every verse
 * - section lines join into continuous prose (punctuation-aware); long text splits by char budget
 * - with `preserveLineBreaks`, lines stay newline-separated and chunk by maxLinesPerSlide
 * - verse labels are `n/total`; refrain slides use `Reff` or `Chorus`
 */
export function splitLyricsLabeled(
  lyrics: string,
  maxLinesPerSlide: number = 4,
  options?: SplitLyricsOptions
): LyricSlide[] {
  if (maxLinesPerSlide <= 0) {
    throw new Error('maxLinesPerSlide must be > 0');
  }

  if (!lyrics?.trim()) return [];

  const preserveLineBreaks = options?.preserveLineBreaks === true;

  let sections = parseSections(lyrics);
  sections = fillEmptyRefrains(sections);
  sections = expandTrailingRefrain(sections);

  const verseTotal = sections.filter((s) => s.kind === 'verse').length;
  const slides: LyricSlide[] = [];

  for (const section of sections) {
    const chunks = chunkLines(
      section.lines,
      maxLinesPerSlide,
      preserveLineBreaks
    );
    if (chunks.length === 0) continue;

    let label = '';
    if (section.kind === 'verse') {
      const n = section.verseIndex ?? 1;
      label = verseTotal > 0 ? `${n}/${verseTotal}` : String(n);
    } else if (section.kind === 'reff') {
      label = 'Reff';
    } else if (section.kind === 'chorus') {
      label = 'Chorus';
    }

    for (const text of chunks) {
      slides.push({ label, text });
    }
  }

  // Fallback: unlabeled blank-line stanzas (no Verse/Chorus headers)
  if (slides.length === 0) {
    const stanzas = lyrics
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n\s*\n/);
    for (const stanza of stanzas) {
      const lines = stanza
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      for (const text of chunkLines(
        lines,
        maxLinesPerSlide,
        preserveLineBreaks
      )) {
        slides.push({ label: '', text });
      }
    }
  }

  return slides;
}

/** Backward-compatible plain text slides (no labels). */
export function splitLyricsIntoSlides(
  lyrics: string,
  maxLinesPerSlide: number = 4,
  options?: SplitLyricsOptions
): string[] {
  return splitLyricsLabeled(lyrics, maxLinesPerSlide, options).map(
    (s) => s.text
  );
}
