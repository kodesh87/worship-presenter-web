/**
 * Shared slide plan: Part C standing slides + order used by PPTX / slideshow.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slide-plan-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;

const { parseRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href
);
const { buildSlidePlan } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'slide-plan.ts')).href
);

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);

test('sample rundown preserves timings on roles/sections', () => {
  const parsed = parseRundown(sample);
  const bibleTalk = parsed.items.find(
    (i) => i.type === 'section' && /BIBLE TALK/i.test(i.title)
  );
  assert.ok(bibleTalk?.timing);
  assert.match(bibleTalk.timing, /09/);

  const prayerPartners = parsed.items.find(
    (i) => i.type === 'role' && /Prayer Partners/i.test(i.role)
  );
  assert.ok(prayerPartners?.timing);
  assert.match(prayerPartners.timing, /5\s*m/i);

  const sermon = parsed.items.find(
    (i) => i.type === 'role' && /^Sermon$/i.test(i.role)
  );
  assert.ok(sermon?.timing);
  assert.match(sermon.timing, /45/i);
});

test('buildSlidePlan omits announcements title when flyers empty; Part C standing remains', () => {
  const parsed = parseRundown(sample);
  const plan = buildSlidePlan('2026-07-11', parsed, []);
  const ids = plan.map((s) => s.id);

  assert.ok(!ids.includes('announcements'));
  assert.ok(ids.includes('welcome-repeat'));
  assert.ok(ids.includes('offering-tithe'));
  assert.ok(ids.includes('midweek-prayer'));
  assert.ok(ids.includes('fellowship-etiquette'));
  assert.ok(ids.includes('contact'));
  assert.ok(ids.includes('thank-you'));

  const offering = plan.find((s) => s.id === 'offering-tithe');
  assert.ok(offering?.lines?.some((l) => /Bank Mandiri/i.test(l)));

  assert.ok(ids.indexOf('offering-tithe') < ids.indexOf('thank-you'));
  assert.ok(!ids.includes('special-song'));
});

test('buildSlidePlan includes announcements title when flyers present', () => {
  const parsed = parseRundown(sample);
  const flyer = 'https://cdn.example.com/a.jpg';
  const plan = buildSlidePlan('2026-07-11', parsed, [flyer]);
  const ids = plan.map((s) => s.id);

  assert.ok(ids.includes('announcements'));
  assert.ok(ids.includes('welcome-repeat'));
  assert.ok(ids.includes('flyer-0'));
  assert.ok(ids.indexOf('announcements') < ids.indexOf('flyer-0'));
});

test('buildSlidePlan ignores extensionless flyer URLs for announcements title', () => {
  const parsed = parseRundown(sample);
  const plan = buildSlidePlan('2026-07-11', parsed, [
    'https://cdn.example.com/clip',
  ]);
  const ids = plan.map((s) => s.id);
  assert.ok(!ids.includes('announcements'));
  assert.ok(!ids.includes('flyer-0'));
});

test('buildSlidePlan emits Intercessory standing pair without title slides; lyrics + order remain', () => {
  const parsed = parseRundown(sample);
  const plan = buildSlidePlan('2026-07-11', parsed, []);
  const ids = plan.map((s) => s.id);

  const beforeDivider = ids.indexOf('intercessory-prayer');
  const lyric671 = ids.findIndex((id) => id.startsWith('intercessory-671-lyric-'));
  const duringDivider = ids.indexOf('intercessory-prayer-during');
  const lyric684 = ids.findIndex((id) => id.startsWith('intercessory-684-lyric-'));

  assert.ok(beforeDivider >= 0);
  assert.ok(lyric671 >= 0);
  assert.ok(duringDivider >= 0);
  assert.ok(lyric684 >= 0);
  assert.ok(!ids.includes('intercessory-671-title'));
  assert.ok(!ids.includes('intercessory-684-title'));
  assert.ok(beforeDivider < lyric671);
  assert.ok(lyric671 < duringDivider);
  assert.ok(duringDivider < lyric684);

  const openingCue = ids.indexOf('ds-opening-song-cue');
  assert.ok(openingCue >= 0);
  assert.ok(openingCue < beforeDivider);

  // Payload listed #671/#684 in sample rundown — standing pair only, not ds-middle.
  assert.ok(!ids.some((id) => id.startsWith('ds-middle-')));

  const sdah671 = plan.filter(
    (s) => s.kind === 'song-title' && /SDAH\s*671/i.test(s.subtitle || '')
  );
  const sdah684 = plan.filter(
    (s) => s.kind === 'song-title' && /SDAH\s*684/i.test(s.subtitle || '')
  );
  assert.equal(sdah671.length, 0);
  assert.equal(sdah684.length, 0);

  // Hope: no title slide; CAP-4 fixed 2 lyric slides with line breaks
  assert.ok(!ids.includes('hope-title'));
  const hopeLyrics = plan.filter((s) => s.id.startsWith('hope-lyric-'));
  assert.equal(hopeLyrics.length, 2);
  assert.ok(hopeLyrics[0].body?.endsWith('Faith in the promise of His Word.'));
  assert.ok(hopeLyrics[1].body?.startsWith('We believe the time is here,'));
  assert.ok(hopeLyrics[1].body?.endsWith('Hope in the coming of the Lord.'));
  assert.ok(hopeLyrics[0].body?.includes('\n'));
  assert.ok(!hopeLyrics[0].body?.includes(';'));
  assert.ok(!hopeLyrics[1].body?.includes(';'));

  // BT/DS opening still keep song-title slides
  assert.ok(ids.includes('bt-opening-title'));
  assert.ok(ids.includes('ds-opening-title'));
});

test('buildSlidePlan omits KJV lookup — theme uses standing default text', () => {
  const parsed = parseRundown(sample);
  parsed.themeVerse = null;
  const plan = buildSlidePlan('2026-07-11', parsed, []);
  const theme = plan.find((s) => s.id === 'theme-verse');
  assert.equal(theme?.subtitle, 'John 4:23');
  assert.ok(theme?.body?.includes('true worshipers'));
});

test('buildSlidePlan combines Family & Youth on single Slide 56', () => {
  const parsed = parseRundown(sample);
  parsed.familyPrayerRequest = 'Pray for the Lees';
  parsed.youthPrayerRequest = 'Youth camp';
  parsed.familyYouth = null;
  const plan = buildSlidePlan('2026-07-11', parsed, {
    familyPhotoUrl: 'https://example.com/family.png',
    youthPhotoUrl: 'https://example.com/youth.png',
  });
  const familySlides = plan.filter((s) => s.id === 'family-youth');
  assert.equal(familySlides.length, 1);
  assert.equal(familySlides[0].kind, 'family');
  assert.match(familySlides[0].body || '', /Family: Pray for the Lees/);
  assert.match(familySlides[0].body || '', /Youth: Youth camp/);
  assert.equal(familySlides[0].imageUrl, 'https://example.com/family.png');
  assert.equal(
    familySlides[0].secondaryImageUrl,
    'https://example.com/youth.png'
  );
  assert.equal(plan.filter((s) => s.id === 'family-photo').length, 0);
  assert.equal(plan.filter((s) => s.id === 'youth-photo').length, 0);
});
