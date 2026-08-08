/**
 * Live Preview projection: operator vocabulary, SongSet grouping and the
 * linear indexes that must stay locked to `buildSlidePlan` output.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-preview-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const { buildPreviewEntries, previewBadgeTone, previewLabel } = await import(
  srcUrl('lib', 'artifacts', 'preview-model.ts')
);
const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
const { buildArtifactPlan, buildSlidePlan } = await import(
  srcUrl('lib', 'slide-plan.ts')
);
const { loadSeedTemplates } = await import(srcUrl('lib', 'registry', 'seed.ts'));

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);

const FLYER = 'https://cdn.example.com/a.jpg';
const RICH_MEDIA = {
  flyers: [FLYER],
  sermonGraphicUrl: 'https://example.com/sermon.png',
  familyPhotoUrl: 'https://example.com/family.png',
  youthPhotoUrl: 'https://example.com/youth.png',
};

function richParsed() {
  const parsed = parseRundown(sample);
  parsed.familyPrayerRequest = 'Pray for the Lees';
  parsed.youthPrayerRequest = 'Youth camp';
  parsed.familyYouth = null;
  parsed.verseReading = { reference: 'Psalm 23:1', text: 'The Lord is my shepherd.' };
  return parsed;
}

/** PascalCase / underscore template labels must never reach an operator. */
const PASCAL_OR_SNAKE = /(?:[a-z0-9][A-Z])|_/;

test('every entry carries an operator-recognizable label', () => {
  const entries = buildPreviewEntries(
    buildArtifactPlan('2026-07-11', richParsed(), RICH_MEDIA)
  );
  assert.ok(entries.length > 40, 'sample rundown should produce a full plan');

  const seedLabels = new Set(
    loadSeedTemplates()
      .map((t) => t.label)
      .filter((label) => PASCAL_OR_SNAKE.test(label))
  );
  assert.equal(
    seedLabels.size,
    0,
    'seed registry must not use PascalCase or underscore labels'
  );

  for (const entry of entries) {
    assert.equal(typeof entry.label, 'string');
    assert.ok(entry.label.trim().length > 0, `empty label on ${entry.instanceId}`);
    assert.ok(
      !PASCAL_OR_SNAKE.test(entry.label),
      `raw template label leaked: ${entry.label}`
    );
    assert.ok(
      !seedLabels.has(entry.label),
      `raw template label leaked: ${entry.label}`
    );
  }

  const labels = new Set(entries.map((e) => e.label));
  for (const expected of [
    'Welcome',
    'Song Title',
    'Song Lyric',
    'Theme Verse',
    'Verse Reading',
    'Offering & Tithe',
    'Family & Youth',
    'Sermon Flyer',
    'Announcements',
    'Thank You',
  ]) {
    assert.ok(labels.has(expected), `missing operator label "${expected}"`);
  }
});

test('row labels are shown as-is; empty labels fall back to readable words', () => {
  assert.equal(
    previewLabel({
      templateId: 'brand-new-thing',
      label: 'My Custom Label',
      layoutKey: 'default',
    }),
    'My Custom Label'
  );
  assert.equal(
    previewLabel({
      templateId: 'another-thing',
      label: '',
      layoutKey: 'default',
    }),
    'Another Thing'
  );
});

test('SongSet children share one group and carry title/lyric roles', () => {
  const entries = buildPreviewEntries(
    buildArtifactPlan('2026-07-11', parseRundown(sample), [])
  );

  const opening = entries.filter((e) => e.groupId === 'bt-opening');
  assert.ok(opening.length >= 2, 'opening song should expand to several slides');

  const groupLabels = new Set(opening.map((e) => e.groupLabel));
  assert.equal(groupLabels.size, 1);
  const [groupLabel] = [...groupLabels];
  assert.ok(groupLabel && groupLabel.trim().length > 0);

  assert.equal(opening[0].role, 'title');
  assert.equal(opening[0].label, 'Song Title');
  // Story 20.1 (AC-6) gives this transitional weekly position its own clone
  // of the `song-set` template (`bt-opening-song`), not the shared row —
  // both templates carry `baseType: 'song-set'`, which is what the "Song
  // Title" / "Song Lyric" preview labels are keyed on (preview-model.ts).
  for (const child of opening.slice(1)) {
    assert.equal(child.role, 'lyric');
    assert.equal(child.label, 'Song Lyric');
    assert.equal(child.baseType, 'song-set');
  }

  // Story 20.1 (AC-3 delta a/c, AC-5): the standing Intercessory pair is no
  // longer a title-suppressed SongSet group at all — it is a fixed General
  // leaf, so it carries no group fields and Live Preview cannot nest it.
  assert.ok(!entries.some((e) => e.groupId === 'intercessory-671'));
  const standing671 = entries.find((e) => e.instanceId === 'intercessory-671-lyric-1');
  assert.ok(standing671);
  assert.equal(standing671.groupId, undefined);
  assert.equal(standing671.role, undefined);

  // Group children stay contiguous, so nesting cannot reorder the deck.
  const seen = new Map();
  entries.forEach((entry, idx) => {
    if (!entry.groupId) return;
    const previous = seen.get(entry.groupId);
    if (previous !== undefined) assert.equal(idx, previous + 1);
    seen.set(entry.groupId, idx);
  });

  // Leaves outside a group carry no grouping fields at all.
  const welcome = entries.find((e) => e.instanceId === 'welcome');
  assert.ok(welcome);
  assert.equal(welcome.groupId, undefined);
  assert.equal(welcome.groupLabel, undefined);
  assert.equal(welcome.role, undefined);
});

test('entry.index matches the slide position in buildSlidePlan', () => {
  const parsed = richParsed();
  const plan = buildSlidePlan('2026-07-11', parsed, RICH_MEDIA);
  const entries = buildPreviewEntries(
    buildArtifactPlan('2026-07-11', parsed, RICH_MEDIA)
  );

  assert.equal(entries.length, plan.length);
  entries.forEach((entry, idx) => {
    assert.equal(entry.index, idx);
    assert.equal(entry.instanceId, plan[idx].id);
    assert.equal(entry.templateId, plan[idx].artifact.templateId);
    assert.equal(entry.baseType, plan[idx].artifact.baseType);
  });
});

test('a service with no flyers or family content produces no empty groups', () => {
  const parsed = parseRundown(sample);
  parsed.familyPrayerRequest = null;
  parsed.youthPrayerRequest = null;
  parsed.familyYouth = null;

  const entries = buildPreviewEntries(
    buildArtifactPlan('2026-07-11', parsed, [])
  );
  const ids = entries.map((e) => e.instanceId);

  assert.ok(!ids.includes('family-youth'));
  assert.ok(!ids.includes('announcements'));
  assert.ok(!ids.includes('sermon-graphic'));
  assert.ok(!ids.some((id) => id.startsWith('flyer-')));

  const labels = entries.map((e) => e.label);
  assert.ok(!labels.includes('Family & Youth'));
  assert.ok(!labels.includes('Announcements'));
  assert.ok(!labels.includes('Announcement Flyer'));
  assert.ok(!labels.includes('Sermon Flyer'));

  // Every referenced group is non-empty and named.
  const byGroup = new Map();
  for (const entry of entries) {
    if (!entry.groupId) continue;
    assert.ok(entry.groupLabel && entry.groupLabel.trim().length > 0);
    assert.ok(entry.role === 'title' || entry.role === 'lyric');
    byGroup.set(entry.groupId, (byGroup.get(entry.groupId) || 0) + 1);
  }
  assert.ok(byGroup.size > 0);
  for (const [groupId, count] of byGroup) {
    assert.ok(count >= 1, `empty group ${groupId}`);
  }
});

test('entries expose no unresolved placeholders and no registry internals', () => {
  const entries = buildPreviewEntries(
    buildArtifactPlan('2026-07-11', richParsed(), RICH_MEDIA)
  );
  const allowed = new Set([
    'index',
    'instanceId',
    'templateId',
    'label',
    'baseType',
    'groupId',
    'groupLabel',
    'role',
  ]);

  for (const entry of entries) {
    for (const key of Object.keys(entry)) {
      assert.ok(allowed.has(key), `unexpected preview field "${key}"`);
    }
    for (const value of Object.values(entry)) {
      if (typeof value !== 'string') continue;
      assert.ok(!value.includes('{{'), `unresolved placeholder in "${value}"`);
      assert.ok(!value.includes('}}'), `unresolved placeholder in "${value}"`);
      assert.ok(!value.includes('${'), `unresolved placeholder in "${value}"`);
    }
  }
});

test('badge tone is derived once for both preview surfaces', () => {
  const entries = buildPreviewEntries(
    buildArtifactPlan('2026-07-11', richParsed(), RICH_MEDIA)
  );
  const toneOf = (instanceId) => {
    const entry = entries.find((e) => e.instanceId === instanceId);
    assert.ok(entry, `missing entry ${instanceId}`);
    return previewBadgeTone(entry);
  };

  assert.equal(toneOf('bt-opening-title'), 'song-title');
  assert.equal(toneOf('bt-opening-lyric-1'), 'song-lyric');
  assert.equal(toneOf('theme-verse'), 'scripture');
  assert.equal(toneOf('verse-reading'), 'scripture');
  assert.equal(toneOf('flyer-0'), 'image');
  assert.equal(toneOf('sermon-graphic'), 'image');
  assert.equal(toneOf('welcome'), 'default');

  const tones = new Set(entries.map((e) => previewBadgeTone(e)));
  for (const tone of tones) {
    assert.ok(
      ['song-title', 'song-lyric', 'scripture', 'image', 'default'].includes(
        tone
      ),
      `unknown tone ${tone}`
    );
  }
});
