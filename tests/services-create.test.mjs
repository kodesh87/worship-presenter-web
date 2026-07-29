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

/**
 * FR-11b consequence: the create/edit form manages the Announcement List, and the
 * order the operator puts the flyers in is the order they appear on the slides
 * (FR-6: "Each Announcement List item produces one announcement slide … in list
 * order"). Nothing asserted that a *reorder* survived the sync — the existing
 * coverage happened to use inputs already in stored order, so a sync that ignored
 * position would have stayed green.
 */
test('announcement sync preserves operator-chosen order, including a reorder', () => {
  const db = getDb();
  db.prepare('DELETE FROM announcement_items').run();

  const info = db
    .prepare(
      `INSERT INTO services (date, raw_payload, parsed_data)
       VALUES (?, ?, ?)`
    )
    .run(
      '2026-08-08',
      'SABBATH, AUGUST 8, 2026',
      JSON.stringify({ date: '2026-08-08', items: [] })
    );
  const serviceId = Number(info.lastInsertRowid);

  const url = (name) => `https://example.com/${name}.png`;
  const recurring = (name) => ({ image_url: url(name), is_recurring: true });
  const masterUrls = () =>
    listAnnouncementItems()
      .filter((i) => i.service_id === null)
      .map((i) => i.image_url);

  syncWorshipAnnouncements(
    serviceId,
    coerceWorshipAnnouncements([recurring('a'), recurring('b'), recurring('c')])
  );
  assert.deepEqual(
    masterUrls(),
    [url('a'), url('b'), url('c')],
    'first sync did not store the submitted order'
  );

  // The operator drags the third flyer to the top and swaps the other two.
  syncWorshipAnnouncements(
    serviceId,
    coerceWorshipAnnouncements([recurring('c'), recurring('a'), recurring('b')])
  );
  assert.deepEqual(
    masterUrls(),
    [url('c'), url('a'), url('b')],
    'a reorder was not persisted — announcement slides would render in the old order'
  );

  // sort_order must actually carry the order rather than the read happening to
  // return insertion order: distinct, ascending, and matching the listed sequence.
  const rows = listAnnouncementItems().filter((i) => i.service_id === null);
  const orders = rows.map((r) => r.sort_order);
  assert.equal(
    new Set(orders).size,
    orders.length,
    `duplicate sort_order values would make slide order arbitrary: ${orders.join(',')}`
  );
  assert.deepEqual(
    orders,
    [...orders].sort((a, b) => a - b),
    `sort_order is not ascending in listed order: ${orders.join(',')}`
  );

  // A one-off keeps its position among the recurring items it was placed between.
  syncWorshipAnnouncements(
    serviceId,
    coerceWorshipAnnouncements([
      recurring('c'),
      { image_url: url('one-off'), is_recurring: false },
      recurring('a'),
    ])
  );
  const oneOffs = listAnnouncementItems().filter(
    (i) => i.service_id === serviceId
  );
  assert.equal(oneOffs.length, 1);
  assert.equal(oneOffs[0].image_url, url('one-off'));
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
