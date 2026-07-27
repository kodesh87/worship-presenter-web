import type {
  ParsedItem,
  ParsedRundown,
  ParsedScripture,
  ParsedSermon,
} from './parser';
import { lookupHymn, parseScriptureValue } from './parser';
import { bucketHymnsBySection } from './hymn-sections';

export type StructuredServiceFields = {
  themeVerse?: ParsedScripture | null;
  verseReading?: ParsedScripture | null;
  /** @deprecated Prefer familyPrayerRequest / youthPrayerRequest */
  familyYouth?: string | null;
  familyPrayerRequest?: string | null;
  youthPrayerRequest?: string | null;
  sermon?: ParsedSermon | null;
  specialSong?: string | null;
  closingPrayerPerson?: string | null;
  song1Number?: string | null;
  song2Number?: string | null;
  song3Number?: string | null;
  song4Number?: string | null;
};

function coerceScripture(value: unknown): ParsedScripture | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return parseScriptureValue(value);
  if (typeof value !== 'object' || Array.isArray(value)) return undefined;

  const refRaw = (value as { reference?: unknown }).reference;
  const textRaw = (value as { text?: unknown }).text;
  const reference =
    typeof refRaw === 'string' && refRaw.trim() ? refRaw.trim() : null;
  const text = typeof textRaw === 'string' ? textRaw.trim() : '';

  if (!reference && !text) return null;
  return { reference, text };
}

function coerceSpecialSong(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-' || trimmed === '—' || /^none$/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function coerceNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  return value.trim() || null;
}

function coerceSongNumber(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/(\d{1,4})/);
  return m ? m[1] : null;
}

function parseSongNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse optional structured patch fields from a PUT/POST body. */
export function coerceStructuredFields(
  body: unknown
): StructuredServiceFields | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const src =
    (body as { fields?: unknown }).fields !== undefined
      ? (body as { fields: unknown }).fields
      : body;

  if (!src || typeof src !== 'object' || Array.isArray(src)) return null;

  const fields: StructuredServiceFields = {};
  let any = false;

  if (Object.prototype.hasOwnProperty.call(src, 'themeVerse')) {
    const v = coerceScripture((src as { themeVerse?: unknown }).themeVerse);
    if (v !== undefined) {
      fields.themeVerse = v;
      any = true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(src, 'verseReading')) {
    const v = coerceScripture((src as { verseReading?: unknown }).verseReading);
    if (v !== undefined) {
      fields.verseReading = v;
      any = true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(src, 'familyYouth')) {
    const v = coerceNullableString((src as { familyYouth?: unknown }).familyYouth);
    if (v !== undefined) {
      fields.familyYouth = v;
      any = true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(src, 'familyPrayerRequest')) {
    const v = coerceNullableString(
      (src as { familyPrayerRequest?: unknown }).familyPrayerRequest
    );
    if (v !== undefined) {
      fields.familyPrayerRequest = v;
      any = true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(src, 'youthPrayerRequest')) {
    const v = coerceNullableString(
      (src as { youthPrayerRequest?: unknown }).youthPrayerRequest
    );
    if (v !== undefined) {
      fields.youthPrayerRequest = v;
      any = true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(src, 'sermon')) {
    const raw = (src as { sermon?: unknown }).sermon;
    if (raw === null) {
      fields.sermon = null;
      any = true;
    } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const speaker = String(
        (raw as { speaker?: unknown }).speaker ?? ''
      ).trim();
      const title = String((raw as { title?: unknown }).title ?? '').trim();
      fields.sermon = speaker ? { speaker, title } : null;
      any = true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(src, 'specialSong')) {
    const v = coerceSpecialSong((src as { specialSong?: unknown }).specialSong);
    if (v !== undefined) {
      fields.specialSong = v;
      any = true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(src, 'closingPrayerPerson')) {
    const v = coerceNullableString(
      (src as { closingPrayerPerson?: unknown }).closingPrayerPerson
    );
    if (v !== undefined) {
      fields.closingPrayerPerson = v;
      any = true;
    }
  }

  for (const key of [
    'song1Number',
    'song2Number',
    'song3Number',
    'song4Number',
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      const v = coerceSongNumber((src as Record<string, unknown>)[key]);
      if (v !== undefined) {
        fields[key] = v;
        any = true;
      }
    }
  }

  const flat = src as {
    sermonSpeaker?: unknown;
    sermonTitle?: unknown;
  };
  if (
    fields.sermon === undefined &&
    (Object.prototype.hasOwnProperty.call(src, 'sermonSpeaker') ||
      Object.prototype.hasOwnProperty.call(src, 'sermonTitle'))
  ) {
    const speaker =
      typeof flat.sermonSpeaker === 'string' ? flat.sermonSpeaker.trim() : '';
    const title =
      typeof flat.sermonTitle === 'string' ? flat.sermonTitle.trim() : '';
    fields.sermon = speaker ? { speaker, title } : null;
    any = true;
  }

  return any ? fields : null;
}

function isBibleTalkSection(title: string): boolean {
  return /^BIBLE\s+TALK\b/i.test(title);
}

function isDivineServiceSection(title: string): boolean {
  return /^DIVINE\s+SERVICE\b/i.test(title);
}

/** Insert hymn after the Nth hymn already in the target section (0-based slot). */
function insertHymnInSection(
  items: ParsedItem[],
  section: 'bt' | 'ds',
  slotInSection: number,
  hymnItem: Extract<ParsedItem, { type: 'hymn' }>
): void {
  let current: 'bt' | 'ds' | null = null;
  let hymnsInSection = 0;
  let insertAt = items.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === 'section') {
      if (isBibleTalkSection(item.title)) current = 'bt';
      else if (isDivineServiceSection(item.title)) current = 'ds';
      else current = null;
      continue;
    }
    if (item.type !== 'hymn' || current !== section) continue;
    if (hymnsInSection === slotInSection) {
      insertAt = i;
      items.splice(insertAt, 0, hymnItem);
      return;
    }
    hymnsInSection += 1;
    insertAt = i + 1;
  }

  // Section missing or fewer hymns than slot: ensure section marker then append.
  const sectionTitle = section === 'bt' ? 'BIBLE TALK' : 'DIVINE SERVICE';
  const hasSection = items.some(
    (i) =>
      i.type === 'section' &&
      (section === 'bt'
        ? isBibleTalkSection(i.title)
        : isDivineServiceSection(i.title))
  );
  if (!hasSection) {
    items.push({ type: 'section', title: sectionTitle });
  }
  // Append after last item of that section if present
  let lastInSection = -1;
  current = null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === 'section') {
      if (isBibleTalkSection(item.title)) current = 'bt';
      else if (isDivineServiceSection(item.title)) current = 'ds';
      else current = null;
      if (current === section) lastInSection = i;
      continue;
    }
    if (current === section) lastInSection = i;
  }
  if (lastInSection >= 0) {
    items.splice(lastInSection + 1, 0, hymnItem);
  } else {
    items.push(hymnItem);
  }
}

function applySongOverlay(
  parsed: ParsedRundown,
  slot: 0 | 1 | 2 | 3,
  number: number
): void {
  const found = lookupHymn(number);
  const hymnItem: Extract<ParsedItem, { type: 'hymn' }> = {
    type: 'hymn',
    number,
    title: found.title,
    lyrics: found.lyrics,
    incomplete: found.incomplete,
  };

  const buckets = bucketHymnsBySection(parsed.items);
  const targetBucket =
    slot < 2 ? buckets.bibleTalkHymns : buckets.divineServiceHymns;
  const idxInBucket = slot % 2;
  const existing = targetBucket[idxInBucket];

  if (existing) {
    const itemIdx = parsed.items.indexOf(existing);
    if (itemIdx >= 0) {
      const oldNumber = existing.number;
      parsed.items[itemIdx] = { ...hymnItem, timing: existing.timing };
      // Prune failed number for replaced incomplete hymn
      if (oldNumber !== number) {
        parsed.failedHymnNumbers = parsed.failedHymnNumbers.filter(
          (n) => n !== oldNumber
        );
      }
      if (found.incomplete && !parsed.failedHymnNumbers.includes(number)) {
        parsed.failedHymnNumbers.push(number);
      } else if (!found.incomplete) {
        parsed.failedHymnNumbers = parsed.failedHymnNumbers.filter(
          (n) => n !== number
        );
      }
      return;
    }
  }

  if (found.incomplete && !parsed.failedHymnNumbers.includes(number)) {
    parsed.failedHymnNumbers.push(number);
  } else if (!found.incomplete) {
    parsed.failedHymnNumbers = parsed.failedHymnNumbers.filter(
      (n) => n !== number
    );
  }

  const section = slot < 2 ? 'bt' : 'ds';
  insertHymnInSection(parsed.items, section, idxInBucket, hymnItem);
}

/** Overlay structured fields onto a ParsedRundown (in place). */
export function applyStructuredFields(
  parsed: ParsedRundown,
  fields: StructuredServiceFields
): ParsedRundown {
  if (fields.themeVerse !== undefined) parsed.themeVerse = fields.themeVerse;
  if (fields.verseReading !== undefined) {
    parsed.verseReading = fields.verseReading;
  }
  if (fields.familyYouth !== undefined) parsed.familyYouth = fields.familyYouth;
  if (
    fields.familyPrayerRequest !== undefined ||
    fields.youthPrayerRequest !== undefined
  ) {
    if (fields.familyPrayerRequest !== undefined) {
      parsed.familyPrayerRequest = fields.familyPrayerRequest;
    }
    if (fields.youthPrayerRequest !== undefined) {
      parsed.youthPrayerRequest = fields.youthPrayerRequest;
    }
    // Split fields are source of truth — clear legacy combined text
    parsed.familyYouth = null;
  }
  if (fields.specialSong !== undefined) parsed.specialSong = fields.specialSong;
  if (fields.closingPrayerPerson !== undefined) {
    let person = fields.closingPrayerPerson;
    if (
      person &&
      /^the\s+speaker$/i.test(person.trim()) &&
      parsed.sermon?.speaker
    ) {
      person = parsed.sermon.speaker;
    }
    parsed.closingPrayerPerson = person;
    const idx = parsed.items.findIndex(
      (i) => i.type === 'role' && /^Closing Prayer$/i.test(i.role)
    );
    if (person) {
      if (idx >= 0) {
        parsed.items[idx] = {
          type: 'role',
          role: 'Closing Prayer',
          name: person,
        };
      } else {
        parsed.items.push({
          type: 'role',
          role: 'Closing Prayer',
          name: person,
        });
      }
    } else if (idx >= 0) {
      parsed.items.splice(idx, 1);
    }
  }
  if (fields.sermon !== undefined) {
    parsed.sermon = fields.sermon;
    const idx = parsed.items.findIndex(
      (i) => i.type === 'role' && /^Sermon$/i.test(i.role)
    );
    if (fields.sermon) {
      const name = fields.sermon.title
        ? `${fields.sermon.speaker} — ${fields.sermon.title}`
        : fields.sermon.speaker;
      if (idx >= 0) {
        parsed.items[idx] = { type: 'role', role: 'Sermon', name };
      } else {
        parsed.items.push({ type: 'role', role: 'Sermon', name });
      }
      if (
        parsed.closingPrayerPerson &&
        /^the\s+speaker$/i.test(parsed.closingPrayerPerson.trim())
      ) {
        parsed.closingPrayerPerson = fields.sermon.speaker;
        const cpIdx = parsed.items.findIndex(
          (i) => i.type === 'role' && /^Closing Prayer$/i.test(i.role)
        );
        if (cpIdx >= 0) {
          parsed.items[cpIdx] = {
            type: 'role',
            role: 'Closing Prayer',
            name: fields.sermon.speaker,
          };
        }
      }
    } else if (idx >= 0) {
      parsed.items.splice(idx, 1);
    }
  }

  const songSlots: Array<{
    key: keyof StructuredServiceFields;
    slot: 0 | 1 | 2 | 3;
  }> = [
    { key: 'song1Number', slot: 0 },
    { key: 'song2Number', slot: 1 },
    { key: 'song3Number', slot: 2 },
    { key: 'song4Number', slot: 3 },
  ];
  for (const { key, slot } of songSlots) {
    if (fields[key] === undefined) continue;
    const n = parseSongNumber(fields[key] as string | null);
    if (n != null) applySongOverlay(parsed, slot, n);
  }

  return parsed;
}

export { songNumbersFromParsed } from './worship-form-fields';

/** Normalize legacy parsed_data JSON missing newer keys. */
export function normalizeParsedRundown(parsed: ParsedRundown): ParsedRundown {
  const familyYouth = parsed.familyYouth ?? null;
  let familyPrayerRequest = parsed.familyPrayerRequest ?? null;
  let youthPrayerRequest = parsed.youthPrayerRequest ?? null;
  // Legacy combined field → family prayer when split fields empty.
  // applyStructuredFields clears familyYouth when split fields are saved.
  if (!familyPrayerRequest && !youthPrayerRequest && familyYouth) {
    familyPrayerRequest = familyYouth;
  }

  return {
    date: parsed.date ?? null,
    items: Array.isArray(parsed.items) ? parsed.items : [],
    unmappedLines: Array.isArray(parsed.unmappedLines)
      ? parsed.unmappedLines
      : [],
    failedHymnNumbers: Array.isArray(parsed.failedHymnNumbers)
      ? parsed.failedHymnNumbers
      : [],
    sermon: parsed.sermon ?? null,
    specialSong: parsed.specialSong ?? null,
    closingPrayerPerson: parsed.closingPrayerPerson ?? null,
    themeVerse: parsed.themeVerse ?? null,
    verseReading: parsed.verseReading ?? null,
    familyYouth,
    familyPrayerRequest,
    youthPrayerRequest,
  };
}
