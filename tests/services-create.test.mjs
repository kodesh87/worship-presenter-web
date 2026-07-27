import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'services-create-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { parseRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href
);
const { applyStructuredFields, normalizeParsedRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parsed-fields.ts')).href
);
const {
  syncWorshipAnnouncements,
  coerceWorshipAnnouncements,
  listAnnouncementItems,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'announcements.ts')).href
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

test('Parser and structured fields work correctly', () => {
  const raw = `SABBATH, JULY 25, 2026
DIVINE SERVICE
Opening Song: SDAH #159
Sermon: Pastor Adam
Closing Prayer: The Speaker`;

  let parsed = parseRundown(raw);
  assert.equal(parsed.date, '2026-07-25');
  assert.equal(parsed.sermon?.speaker, 'Pastor Adam');

  const overlays = {
    sermon: { speaker: 'Pr. Noah', title: '' },
    familyPrayerRequest: 'Pray for the Smiths',
    youthPrayerRequest: 'Youth retreat',
  };
  parsed = applyStructuredFields(parsed, overlays);
  parsed = normalizeParsedRundown(parsed);

  assert.equal(parsed.sermon?.speaker, 'Pr. Noah');
  assert.equal(parsed.familyPrayerRequest, 'Pray for the Smiths');
  assert.equal(parsed.youthPrayerRequest, 'Youth retreat');
});

test('syncWorshipAnnouncements does not wipe master when unchanged', () => {
  const db = getDb();

  db.prepare('DELETE FROM announcement_items').run();
  db.prepare(
    `INSERT INTO announcement_items (image_url, service_id, sort_order)
     VALUES (?, NULL, 0)`
  ).run('https://example.com/master-a.png');
  db.prepare(
    `INSERT INTO announcement_items (image_url, service_id, sort_order)
     VALUES (?, NULL, 1)`
  ).run('https://example.com/master-b.png');

  const info = db
    .prepare(
      `INSERT INTO services (date, raw_payload, parsed_data, images_payload, participants_payload)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      '2026-07-25',
      'SABBATH, JULY 25, 2026',
      JSON.stringify({ date: '2026-07-25', items: [] }),
      JSON.stringify({}),
      'Elder: Ada'
    );
  const serviceId = Number(info.lastInsertRowid);

  const items = coerceWorshipAnnouncements([
    { image_url: 'https://example.com/master-a.png', is_recurring: true },
    { image_url: 'https://example.com/one-off.png', is_recurring: false },
    { image_url: 'https://example.com/master-b.png', is_recurring: true },
  ]);

  syncWorshipAnnouncements(serviceId, items);

  const master = listAnnouncementItems().filter((i) => i.service_id === null);
  const oneOffs = listAnnouncementItems().filter(
    (i) => i.service_id === serviceId
  );

  assert.equal(master.length, 2);
  assert.equal(master[0].image_url, 'https://example.com/master-a.png');
  assert.equal(master[1].image_url, 'https://example.com/master-b.png');
  assert.equal(oneOffs.length, 1);
  assert.equal(oneOffs[0].image_url, 'https://example.com/one-off.png');

  // Second service same date allowed at DB level (CAP-4 second record)
  const info2 = db
    .prepare(
      `INSERT INTO services (date, raw_payload, parsed_data)
       VALUES (?, ?, ?)`
    )
    .run(
      '2026-07-25',
      'SABBATH, JULY 25, 2026\nSECOND',
      JSON.stringify({ date: '2026-07-25', items: [] })
    );
  assert.ok(Number(info2.lastInsertRowid) > serviceId);

  // Unchanged master sync on second service must not delete master
  syncWorshipAnnouncements(Number(info2.lastInsertRowid), [
    { image_url: 'https://example.com/master-a.png', is_recurring: true },
    { image_url: 'https://example.com/master-b.png', is_recurring: true },
  ]);
  const masterAfter = listAnnouncementItems().filter(
    (i) => i.service_id === null
  );
  assert.equal(masterAfter.length, 2);
});

test('participants_payload column exists', () => {
  const db = getDb();
  const cols = db.prepare(`PRAGMA table_info(services)`).all();
  assert.ok(cols.some((c) => c.name === 'participants_payload'));
});

test('empty master sync keeps master unless clearMaster', () => {
  const db = getDb();
  db.prepare('DELETE FROM announcement_items').run();
  db.prepare(
    `INSERT INTO announcement_items (image_url, service_id, sort_order)
     VALUES (?, NULL, 0)`
  ).run('https://example.com/keep-master.png');

  const info = db
    .prepare(
      `INSERT INTO services (date, raw_payload, parsed_data)
       VALUES (?, ?, ?)`
    )
    .run(
      '2026-08-01',
      'SABBATH, AUGUST 1, 2026',
      JSON.stringify({ date: '2026-08-01', items: [] })
    );
  const serviceId = Number(info.lastInsertRowid);

  // One-off only — without clearMaster, master must remain
  syncWorshipAnnouncements(serviceId, [
    { image_url: 'https://example.com/week-only.png', is_recurring: false },
  ]);
  let master = listAnnouncementItems().filter((i) => i.service_id === null);
  assert.equal(master.length, 1);
  assert.equal(master[0].image_url, 'https://example.com/keep-master.png');

  // Explicit clearMaster empties global master
  syncWorshipAnnouncements(
    serviceId,
    [{ image_url: 'https://example.com/week-only.png', is_recurring: false }],
    { clearMaster: true }
  );
  master = listAnnouncementItems().filter((i) => i.service_id === null);
  assert.equal(master.length, 0);
});

test('applyStructuredFields clears legacy familyYouth when split prayers set', () => {
  let parsed = parseRundown('SABBATH, JULY 25, 2026\nDIVINE SERVICE\nSDAH #1');
  parsed.familyYouth = 'Legacy combined';
  parsed = applyStructuredFields(parsed, {
    familyPrayerRequest: null,
    youthPrayerRequest: 'Youth only',
  });
  parsed = normalizeParsedRundown(parsed);
  assert.equal(parsed.familyYouth, null);
  assert.equal(parsed.familyPrayerRequest, null);
  assert.equal(parsed.youthPrayerRequest, 'Youth only');
});
