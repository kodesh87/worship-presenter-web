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

/** Standing liturgy fallback when hymnal lookup fails (SDAH #214). */
export const WE_HAVE_THIS_HOPE_FALLBACK: HymnRecord = {
  number: 214,
  title: 'We Have This Hope',
  lyrics: `Verse 1
We have this hope that burns within our hearts,
Hope in the coming of the Lord.
We have this faith that Christ alone imparts,
Faith in the promise of His Word.
We believe the time is here,
When the nations far and near
Shall awake, and shout, and sing
Hallelujah! Christ is King!
We have this hope that burns within our hearts,
Hope in the coming of the Lord.

Verse 2
We are united in Jesus Christ our Lord.
We are united in His love.
Love for the waiting people of the world.
People who need our Savior's love.
Soon the heavn's will open wide,
Christ will come to claim His bride.
All the universe will sing
Hallelujah! Christ is King!
We have this hope, this faith, and God's great love,
We are united in Christ.`,
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
 * Resolve standing liturgy "We Have This Hope":
 * title fuzzy match → known SDAH #214 → embedded fallback lyrics.
 */
export function resolveWeHaveThisHope(): HymnRecord {
  const byTitle = lookupHymnByTitleFuzzy('We Have This Hope');
  if (byTitle) return byTitle;

  const byNumber = lookupHymnByNumber(214);
  if (byNumber) return byNumber;

  return WE_HAVE_THIS_HOPE_FALLBACK;
}

/** Fixed Template Skeleton Intercessory standing pair (not payload Song Blocks). */
export const INTERCESSORY_STANDING_NUMBERS = [671, 684] as const;

/**
 * Resolve standing Intercessory response hymns #671 / #684 via hymnal number lookup.
 * Does not invent lyrics — throws if either number is missing from the corpus.
 */
export function resolveIntercessoryStandingHymns(): {
  before: HymnRecord;
  during: HymnRecord;
} {
  const before = lookupHymnByNumber(671);
  const during = lookupHymnByNumber(684);
  if (!before || !during) {
    const missing = [
      !before ? '671' : null,
      !during ? '684' : null,
    ]
      .filter(Boolean)
      .join(', #');
    throw new Error(
      `Intercessory standing hymns missing from hymnal corpus: #${missing}`
    );
  }
  return { before, during };
}

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

/** Boundary line ending slide 1 of standing "We Have This Hope" (CAP-4). */
const WE_HAVE_THIS_HOPE_SLIDE1_END =
  /^Faith in the promise of His Word\.?$/i;

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

/**
 * CAP-4: standing liturgy "We Have This Hope" — Verse 1 only, exactly 2 slides,
 * original line breaks preserved (exempt from CAP-1 continuous `;` joining).
 *
 * Slide 1 ends at "Faith in the promise of His Word."
 * Slide 2 starts at "We believe the time is here," through
 * "Hope in the coming of the Lord."
 */
export function splitWeHaveThisHopeSlides(
  lyrics: string = WE_HAVE_THIS_HOPE_FALLBACK.lyrics
): LyricSlide[] {
  if (!lyrics?.trim()) return [];

  const sections = parseSections(lyrics);
  const verse1 =
    sections.find((s) => s.kind === 'verse' && (s.verseIndex ?? 1) === 1) ??
    sections.find((s) => s.kind === 'verse') ??
    sections.find((s) => s.kind === 'body' && s.lines.length > 0);

  if (!verse1?.lines.length) return [];

  const lines = verse1.lines.map((l) => l.trim()).filter(Boolean);
  let splitAfter = lines.findIndex((l) => WE_HAVE_THIS_HOPE_SLIDE1_END.test(l));
  if (splitAfter < 0) {
    // Defensive: traditional first stanza is 4 lines when boundary text is missing.
    splitAfter = Math.min(3, lines.length - 1);
  }

  const slide1Lines = lines.slice(0, splitAfter + 1);
  const slide2Lines = lines.slice(splitAfter + 1);
  if (slide1Lines.length === 0 || slide2Lines.length === 0) {
    return [{ label: '1/1', text: lines.join('\n') }];
  }

  return [
    { label: '1/1', text: slide1Lines.join('\n') },
    { label: '1/1', text: slide2Lines.join('\n') },
  ];
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
