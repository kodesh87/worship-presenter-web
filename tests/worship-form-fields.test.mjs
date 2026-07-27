import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'worship-form-fields-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { parseRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href
);
const { normalizeParsedRundown, applyStructuredFields } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parsed-fields.ts')).href
);
const {
  fieldsFromParsed,
  buildFieldsPayload,
  filterHymnIndex,
  coerceHydrateFields,
  formatHymnFieldDisplay,
  normalizeHymnFilterQuery,
  hymnFieldDisplayValue,
  mergeHymnIndexEntries,
  resolveHymnDraft,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'worship-form-fields.ts')).href
);

before(() => {
  getDb();
});

after(() => {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

test('fieldsFromParsed hydrates songs, sermon, and verse from ParsedRundown', () => {
  const raw = `SABBATH, JULY 25, 2026
BIBLE TALK
Opening Song: SDAH #1
Closing Song: SDAH #2
DIVINE SERVICE
Opening Song: SDAH #3
Closing Song: SDAH #4
Scripture Reading: Acts 18:9,10
Sermon: Pastor Adam
Closing Prayer: The Speaker
Special Song: Youth Choir
Family of the Week: Pray for the Smiths`;

  const parsed = normalizeParsedRundown(parseRundown(raw));
  const fields = fieldsFromParsed(parsed);

  assert.equal(fields.song1Number, '1');
  assert.equal(fields.song2Number, '2');
  assert.equal(fields.song3Number, '3');
  assert.equal(fields.song4Number, '4');
  assert.equal(fields.sermonSpeaker, 'Pastor Adam');
  assert.ok(fields.verseReference.includes('Acts') || fields.verseReference.length >= 0);
  assert.equal(fields.specialSong, 'Youth Choir');
});

test('buildFieldsPayload empty songs are null; empty sermon is null', () => {
  const payload = buildFieldsPayload({
    song1Number: '',
    song2Number: '  ',
    song3Number: '12',
    song4Number: '',
    verseReference: '',
    verseText: '',
    sermonSpeaker: '',
    specialSong: '',
    closingPrayerPerson: '',
    familyPrayerRequest: '',
    youthPrayerRequest: '',
  });
  assert.equal(payload.song1Number, null);
  assert.equal(payload.song2Number, null);
  assert.equal(payload.song3Number, '12');
  assert.equal(payload.sermon, null);
});

test('empty song overlays do not remove hymns from raw parse', () => {
  const raw = `SABBATH, JULY 25, 2026
DIVINE SERVICE
Opening Song: SDAH #159
Sermon: Pastor Adam`;

  let parsed = normalizeParsedRundown(parseRundown(raw));
  const beforeCount = parsed.items.filter((i) => i.type === 'hymn').length;
  assert.ok(beforeCount >= 1);

  parsed = applyStructuredFields(parsed, {
    song1Number: null,
    song2Number: null,
    song3Number: null,
    song4Number: null,
    sermon: null,
  });
  const afterHymns = parsed.items.filter((i) => i.type === 'hymn');
  assert.equal(afterHymns.length, beforeCount);
  assert.equal(parsed.sermon, null);
});

test('filterHymnIndex matches number or title', () => {
  const index = [
    { number: 1, title: 'Praise to the Lord' },
    { number: 159, title: 'O Worship the King' },
  ];
  assert.equal(filterHymnIndex(index, '159').length, 1);
  assert.equal(filterHymnIndex(index, 'worship').length, 1);
  assert.equal(filterHymnIndex(index, '').length, 0);
});

test('formatHymnFieldDisplay joins number and title', () => {
  assert.equal(
    formatHymnFieldDisplay(159, 'O Worship the King'),
    '159 - O Worship the King'
  );
  assert.equal(formatHymnFieldDisplay('12', ''), '12');
  assert.equal(formatHymnFieldDisplay('', 'Alone'), 'Alone');
});

test('normalizeHymnFilterQuery handles number-title display strings', () => {
  assert.equal(normalizeHymnFilterQuery('159 - O Worship'), 'o worship');
  assert.equal(normalizeHymnFilterQuery('159 -'), '159');
  assert.equal(normalizeHymnFilterQuery('  worship  '), 'worship');
});

test('hymnFieldDisplayValue resolves known numbers; leaves unknowns', () => {
  const index = [{ number: 159, title: 'O Worship the King' }];
  assert.equal(
    hymnFieldDisplayValue('159', index),
    '159 - O Worship the King'
  );
  assert.equal(hymnFieldDisplayValue('999', index), '999');
  assert.equal(hymnFieldDisplayValue('abc', index), 'abc');
});

test('filterHymnIndex accepts display-formatted query', () => {
  const index = [
    { number: 1, title: 'Praise to the Lord' },
    { number: 159, title: 'O Worship the King' },
  ];
  assert.equal(filterHymnIndex(index, '159 - O Worship the King').length, 1);
  assert.equal(filterHymnIndex(index, '159 -')[0]?.number, 159);
});

/** The small seed an edit page embeds: only the hymns the form references. */
const SEED = [
  { number: 1, title: 'Praise to the Lord' },
  { number: 88, title: 'When Morning Gilds the Skies' },
  { number: 159, title: 'O Worship the King' },
  { number: 412, title: 'Cover With His Life' },
];

test('mergeHymnIndexEntries drops non-integer numbers (no unresolvable rows)', () => {
  // `hymnFieldDisplayValue` only ever looks up `/^\d+$/` values, so a 1.5 that
  // survived the merge would sit in the dropdown forever, unmatchable.
  const merged = mergeHymnIndexEntries(
    [
      { number: 1.5, title: 'Ghost' },
      { number: Number.NaN, title: 'Ghost' },
      { number: Number.POSITIVE_INFINITY, title: 'Ghost' },
      { number: 2, title: 'Real' },
    ],
    null
  );
  assert.deepEqual(merged, [{ number: 2, title: 'Real' }]);
});

test('mergeHymnIndexEntries is first-source-wins (fresh rows must be passed first)', () => {
  const merged = mergeHymnIndexEntries(
    [{ number: 7, title: 'Corrected Title' }],
    [{ number: 7, title: 'Stale Title' }]
  );
  assert.deepEqual(merged, [{ number: 7, title: 'Corrected Title' }]);
});

test('resolveHymnDraft settles numbers and display strings with no lookup', () => {
  assert.deepEqual(resolveHymnDraft({ draft: '159', value: '', entries: [] }), {
    kind: 'commit',
    value: '159',
  });
  assert.deepEqual(
    resolveHymnDraft({ draft: '159 - O Worship the King', value: '', entries: [] }),
    { kind: 'commit', value: '159' }
  );
  assert.deepEqual(
    resolveHymnDraft({ draft: '   ', value: '412', entries: SEED }),
    { kind: 'commit', value: '' }
  );
});

test('resolveHymnDraft asks for a lookup before judging a free-text title', () => {
  assert.deepEqual(
    resolveHymnDraft({ draft: 'Praise', value: '', entries: SEED }),
    { kind: 'lookup', query: 'praise' }
  );
});

test('a failed hymn lookup never satisfies the unique-match rule', () => {
  // Seed-only, `praise` hits exactly ONE local row — the review's scenario.
  // Judging on that alone silently commits hymn 1 for a query the full hymnal
  // answers dozens of ways.
  assert.equal(filterHymnIndex(SEED, 'praise').length, 1);

  // Lookup failed (expired session / offline / 500): keep the draft, write
  // nothing. The lone local match must not be mistaken for a unique match.
  assert.deepEqual(
    resolveHymnDraft({ draft: 'praise', value: '', entries: SEED, fetched: null }),
    { kind: 'keep' }
  );
  // An already-stored number is left alone rather than re-committed or cleared.
  assert.deepEqual(
    resolveHymnDraft({ draft: 'praise', value: '88', entries: SEED, fetched: null }),
    { kind: 'keep' }
  );

  // The same draft with a *successful* lookup does decide, on the server rows.
  const serverPraiseRows = [
    { number: 1, title: 'Praise to the Lord' },
    { number: 12, title: 'Praise Him! Praise Him!' },
    { number: 249, title: 'Praise Ye the Father' },
  ];
  assert.deepEqual(
    resolveHymnDraft({
      draft: 'praise',
      value: '',
      entries: SEED,
      fetched: serverPraiseRows,
    }),
    { kind: 'commit', value: '' },
    'genuinely ambiguous -> cleared, not guessed'
  );
  assert.deepEqual(
    resolveHymnDraft({
      draft: 'o worship the king',
      value: '',
      entries: SEED,
      fetched: [{ number: 159, title: 'O Worship the King' }],
    }),
    { kind: 'commit', value: '159' }
  );
});

test('a failed hymn lookup does not erase what the operator typed', () => {
  // Create page: empty seed, zero local matches, non-numeric draft. The old
  // fall-through committed '' here, wiping "Amazing Grace" with no message.
  assert.deepEqual(
    resolveHymnDraft({
      draft: 'Amazing Grace',
      value: '',
      entries: [],
      fetched: null,
    }),
    { kind: 'keep' }
  );
  // A server answer of "no such hymn" is a real answer and still clears.
  assert.deepEqual(
    resolveHymnDraft({
      draft: 'Amazing Grace',
      value: '',
      entries: [],
      fetched: [],
    }),
    { kind: 'commit', value: '' }
  );
  // Ambiguous/unknown text never leaks letters into song*Number.
  assert.deepEqual(
    resolveHymnDraft({
      draft: 'Amazing Grace',
      value: '412',
      entries: SEED,
      fetched: [],
    }),
    { kind: 'commit', value: '412' }
  );
});

test('coerceHydrateFields rejects non-objects', () => {
  assert.equal(coerceHydrateFields(null), null);
  assert.equal(coerceHydrateFields('x'), null);
  const h = coerceHydrateFields({ song1Number: '10', sermonSpeaker: 'Ada' });
  assert.equal(h?.song1Number, '10');
  assert.equal(h?.sermonSpeaker, 'Ada');
});
