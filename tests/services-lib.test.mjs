/**
 * Service domain library (src/lib/services/*) — covers the create / update /
 * delete / list rows of the Epic 14 debt spec I/O matrix against a temp DB.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'services-lib-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const libUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', 'lib', ...parts)).href;

const { getDb } = await import(libUrl('db', 'index.ts'));
const { narrowCreateBody, narrowUpdateBody, readJsonBody } = await import(
  libUrl('services', 'body.ts')
);
const { createService } = await import(libUrl('services', 'create-service.ts'));
const { updateService } = await import(libUrl('services', 'update-service.ts'));
const { listServices, deleteService, readUpdatedAt } = await import(
  libUrl('services', 'queries.ts')
);
const { listAnnouncementItems } = await import(libUrl('announcements.ts'));

after(() => {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

const RAW = (dateLine) => `${dateLine}
DIVINE SERVICE
Opening Song: SDAH #159
Sermon: Pastor Adam
Closing Prayer: The Speaker`;

/** narrow + create in one step, asserting the body narrowed cleanly. */
function create(body) {
  const input = narrowCreateBody(body);
  assert.equal(input.ok, true, `expected body to narrow: ${input.message}`);
  return createService(getDb(), input.value);
}

function update(id, body) {
  const input = narrowUpdateBody(body);
  assert.equal(input.ok, true, `expected body to narrow: ${input.message}`);
  return updateService(getDb(), id, input.value);
}

function storedRow(id) {
  return getDb()
    .prepare(
      `SELECT date, raw_payload, images_payload, participants_payload,
              created_at, updated_at
       FROM services WHERE id = ?`
    )
    .get(id);
}

test('create: valid raw payload inserts and reports the parsed date', () => {
  const result = create({ raw_payload: RAW('SABBATH, JULY 25, 2026') });
  assert.equal(result.ok, true);
  assert.equal(result.date, '2026-07-25');
  assert.ok(result.id > 0);
  assert.ok(Array.isArray(result.failedHymnNumbers));

  const row = storedRow(result.id);
  assert.equal(row.date, '2026-07-25');
  assert.equal(
    row.images_payload,
    JSON.stringify({
      images: [],
      sermonGraphicUrl: null,
      familyPhotoUrl: null,
      youthPhotoUrl: null,
    })
  );
  assert.equal(row.participants_payload, null);
});

test('create: body narrowing rejects non-objects and missing raw_payload', () => {
  assert.deepEqual(narrowCreateBody(null), {
    ok: false,
    kind: 'validation',
    message: 'Invalid body',
  });
  assert.deepEqual(narrowCreateBody([1, 2]), {
    ok: false,
    kind: 'validation',
    message: 'Invalid body',
  });
  assert.deepEqual(narrowCreateBody({}), {
    ok: false,
    kind: 'validation',
    message: 'raw_payload is required',
  });
  assert.deepEqual(narrowCreateBody({ raw_payload: '   ' }), {
    ok: false,
    kind: 'validation',
    message: 'raw_payload is required',
  });
});

test('create: undated rundown fails before the deferred payload checks', () => {
  const result = create({ raw_payload: 'no date anywhere in this text' });
  assert.deepEqual(result, {
    ok: false,
    kind: 'validation',
    message: 'Could not parse service date from raw_payload',
  });

  // Legacy order: the date error still wins over a bad image URL.
  const both = create({
    raw_payload: 'no date anywhere in this text',
    sermonGraphicUrl: 'http://127.0.0.1/evil.png',
  });
  assert.equal(both.kind, 'validation');
  assert.equal(both.message, 'Could not parse service date from raw_payload');
});

test('create: unsafe image URL and bad participants/announcements are validation errors', () => {
  const badImage = create({
    raw_payload: RAW('SABBATH, AUGUST 1, 2026'),
    sermonGraphicUrl: 'http://127.0.0.1/evil.png',
  });
  assert.equal(badImage.ok, false);
  assert.equal(badImage.kind, 'validation');
  assert.match(badImage.message, /sermonGraphicUrl/);

  const badParticipants = create({
    raw_payload: RAW('SABBATH, AUGUST 1, 2026'),
    participantsRaw: 42,
  });
  assert.deepEqual(badParticipants, {
    ok: false,
    kind: 'validation',
    message: 'participantsRaw must be a string or null',
  });

  const badAnnouncements = create({
    raw_payload: RAW('SABBATH, AUGUST 1, 2026'),
    announcements: 'not-an-array',
  });
  assert.deepEqual(badAnnouncements, {
    ok: false,
    kind: 'validation',
    message: 'announcements must be an array',
  });
});

test('create: date collision returns collision, allowSecond inserts a second row', () => {
  const first = create({ raw_payload: RAW('SABBATH, AUGUST 8, 2026') });
  assert.equal(first.ok, true);

  const collision = create({ raw_payload: RAW('SABBATH, AUGUST 8, 2026') });
  assert.deepEqual(collision, {
    ok: false,
    kind: 'collision',
    existingId: first.id,
    date: '2026-08-08',
  });

  const second = create({
    raw_payload: RAW('SABBATH, AUGUST 8, 2026'),
    allowSecond: true,
  });
  assert.equal(second.ok, true);
  assert.notEqual(second.id, first.id);

  const rows = getDb()
    .prepare('SELECT id FROM services WHERE date = ?')
    .all('2026-08-08');
  assert.equal(rows.length, 2);
});

test('create: announcements sync honours clearMaster', () => {
  const db = getDb();
  db.prepare('DELETE FROM announcement_items').run();
  db.prepare(
    `INSERT INTO announcement_items (image_url, service_id, sort_order)
     VALUES (?, NULL, 0)`
  ).run('https://example.com/keep-master.png');

  const kept = create({
    raw_payload: RAW('SABBATH, AUGUST 15, 2026'),
    announcements: [
      { image_url: 'https://example.com/week-only.png', is_recurring: false },
    ],
  });
  assert.equal(kept.ok, true);
  assert.equal(
    listAnnouncementItems().filter((i) => i.service_id === null).length,
    1
  );
  assert.equal(
    listAnnouncementItems().filter((i) => i.service_id === kept.id).length,
    1
  );

  const cleared = create({
    raw_payload: RAW('SABBATH, AUGUST 22, 2026'),
    clearMaster: true,
    announcements: [
      { image_url: 'https://example.com/week-only.png', is_recurring: false },
    ],
  });
  assert.equal(cleared.ok, true);
  assert.equal(
    listAnnouncementItems().filter((i) => i.service_id === null).length,
    0
  );
});

test('create: announcement sync writes through the caller-supplied connection', () => {
  getDb().prepare('DELETE FROM announcement_items').run();

  // Deliberately *not* the process singleton. `createService` opens its
  // transaction on the handle it is given, so the announcement INSERT has to
  // use that same handle: issued on another connection it would contend for
  // the write lock and, once committed, survive a rollback of the insert.
  const other = new Database(process.env.DB_PATH);
  try {
    const input = narrowCreateBody({
      raw_payload: RAW('SABBATH, JANUARY 9, 2027'),
      announcements: [
        { image_url: 'https://example.com/threaded.png', is_recurring: false },
      ],
    });
    assert.equal(input.ok, true);

    const result = createService(other, input.value);
    assert.equal(result.ok, true);

    assert.deepEqual(
      other
        .prepare('SELECT image_url, service_id FROM announcement_items')
        .all(),
      [{ image_url: 'https://example.com/threaded.png', service_id: result.id }]
    );
    assert.equal(other.inTransaction, false);
  } finally {
    other.close();
  }
});

test('list: returns DTOs newest first and LIKE-filters on q', () => {
  const created = create({
    raw_payload: `${RAW('SABBATH, SEPTEMBER 5, 2026')}
unique-search-token-abc`,
  });
  assert.equal(created.ok, true);

  const all = listServices(getDb(), '');
  assert.ok(all.length >= 1);
  const item = all.find((s) => s.id === created.id);
  assert.ok(item);
  assert.equal(item.date, '2026-09-05');
  assert.ok(typeof item.raw_payload === 'string');
  assert.ok(item.parsed_data && typeof item.parsed_data === 'object');
  assert.ok(item.updated_at);
  // Newest first by date DESC, id DESC
  const dates = all.map((s) => s.date);
  assert.deepEqual(dates, [...dates].sort().reverse());

  const filtered = listServices(getDb(), 'unique-search-token-abc');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, created.id);

  assert.equal(listServices(getDb(), 'no-such-token-anywhere').length, 0);
});

test('list: corrupt parsed_data reads as null instead of throwing', () => {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO services (date, raw_payload, parsed_data) VALUES (?, ?, ?)`
    )
    .run('2026-10-03', 'corrupt-parsed-token', '{not json');
  const id = Number(info.lastInsertRowid);

  const found = listServices(db, 'corrupt-parsed-token');
  assert.equal(found.length, 1);
  assert.equal(found[0].id, id);
  assert.equal(found[0].parsed_data, null);
});

test('update: body narrowing enforces updated_at and at least one payload', () => {
  assert.deepEqual(narrowUpdateBody({}), {
    ok: false,
    kind: 'validation',
    message: 'updated_at is required for concurrent edit protection',
  });
  assert.deepEqual(narrowUpdateBody({ updated_at: '  ' }), {
    ok: false,
    kind: 'validation',
    message: 'updated_at is required for concurrent edit protection',
  });
  assert.deepEqual(narrowUpdateBody({ updated_at: '2026-01-01 00:00:00' }), {
    ok: false,
    kind: 'validation',
    message: 'Missing raw_payload or structured fields',
  });
  assert.deepEqual(narrowUpdateBody(null), {
    ok: false,
    kind: 'validation',
    message: 'Invalid body',
  });
});

test('update: valid edit rewrites the row and returns the new token', () => {
  const created = create({ raw_payload: RAW('SABBATH, NOVEMBER 7, 2026') });
  assert.equal(created.ok, true);
  const before = storedRow(created.id);

  const result = update(created.id, {
    updated_at: readUpdatedAt(before),
    raw_payload: `${RAW('SABBATH, NOVEMBER 7, 2026')}
edited-token-xyz`,
    participantsRaw: 'Elder: Ada',
  });
  assert.equal(result.ok, true);
  assert.ok(result.updatedAt);
  assert.ok(Array.isArray(result.failedHymnNumbers));

  const after = storedRow(created.id);
  assert.match(after.raw_payload, /edited-token-xyz/);
  assert.equal(after.participants_payload, 'Elder: Ada');
  assert.equal(after.date, '2026-11-07');
});

test('update: unknown id is not-found even when the payload is invalid', () => {
  const missing = update(999999, {
    updated_at: '2026-01-01 00:00:00',
    raw_payload: RAW('SABBATH, NOVEMBER 14, 2026'),
  });
  assert.deepEqual(missing, { ok: false, kind: 'not-found' });

  // Legacy order: 404 still wins over the deferred image validation.
  const alsoMissing = update(999999, {
    updated_at: '2026-01-01 00:00:00',
    raw_payload: RAW('SABBATH, NOVEMBER 14, 2026'),
    sermonGraphicUrl: 'http://127.0.0.1/evil.png',
  });
  assert.deepEqual(alsoMissing, { ok: false, kind: 'not-found' });
});

test('update: stale updated_at conflicts and leaves the row unchanged', () => {
  const created = create({ raw_payload: RAW('SABBATH, NOVEMBER 21, 2026') });
  assert.equal(created.ok, true);
  const before = storedRow(created.id);

  const result = update(created.id, {
    updated_at: '1999-01-01 00:00:00',
    raw_payload: `${RAW('SABBATH, NOVEMBER 21, 2026')}
should-not-persist`,
  });
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'conflict');
  assert.equal(result.updatedAt, readUpdatedAt(before));

  const after = storedRow(created.id);
  assert.equal(after.raw_payload, before.raw_payload);
  assert.equal(readUpdatedAt(after), readUpdatedAt(before));

  // Legacy order: 409 wins over the deferred image validation too.
  const stillConflict = update(created.id, {
    updated_at: '1999-01-01 00:00:00',
    raw_payload: RAW('SABBATH, NOVEMBER 21, 2026'),
    sermonGraphicUrl: 'http://127.0.0.1/evil.png',
  });
  assert.equal(stillConflict.kind, 'conflict');
});

test('update: a write lost in the WHERE clause conflicts without committing', () => {
  const db = getDb();
  const created = create({ raw_payload: RAW('SABBATH, JANUARY 23, 2027') });
  assert.equal(created.ok, true);

  // Reach the in-transaction guard (rather than the pre-check) deterministically:
  // `readUpdatedAt` falls back to created_at for an empty updated_at, while the
  // UPDATE's `COALESCE(updated_at, created_at)` keeps ''. So the pre-check
  // accepts the token and only the WHERE clause rejects the write — the branch
  // that must ROLLBACK, not COMMIT, whatever statements the transaction grows.
  db.prepare(`UPDATE services SET updated_at = '' WHERE id = ?`).run(created.id);
  const before = storedRow(created.id);
  const announcementsBefore = listAnnouncementItems().length;

  const result = update(created.id, {
    updated_at: before.created_at,
    raw_payload: `${RAW('SABBATH, JANUARY 23, 2027')}
must-not-persist`,
    announcements: [
      { image_url: 'https://example.com/rolled-back.png', is_recurring: false },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.kind, 'conflict');
  assert.equal(result.updatedAt, before.created_at);

  const after = storedRow(created.id);
  assert.equal(after.raw_payload, before.raw_payload);
  assert.equal(after.updated_at, '');
  assert.equal(listAnnouncementItems().length, announcementsBefore);
  // The private stale sentinel never escapes and never leaves a transaction open.
  assert.equal(db.inTransaction, false);
});

test('update: image keys are merge-or-keep', () => {
  const created = create({
    raw_payload: RAW('SABBATH, NOVEMBER 28, 2026'),
    images: ['https://example.com/a.png'],
    sermonGraphicUrl: 'https://example.com/sermon.png',
  });
  assert.equal(created.ok, true);

  // Body omits every image key → stored payload untouched.
  const kept = update(created.id, {
    updated_at: readUpdatedAt(storedRow(created.id)),
    participantsRaw: 'Elder: Ada',
    raw_payload: RAW('SABBATH, NOVEMBER 28, 2026'),
  });
  assert.equal(kept.ok, true);
  let images = JSON.parse(storedRow(created.id).images_payload);
  assert.deepEqual(images.images, ['https://example.com/a.png']);
  assert.equal(images.sermonGraphicUrl, 'https://example.com/sermon.png');

  // Body sets images: [] → array replaced, other keys kept from storage.
  const replaced = update(created.id, {
    updated_at: readUpdatedAt(storedRow(created.id)),
    raw_payload: RAW('SABBATH, NOVEMBER 28, 2026'),
    images: [],
  });
  assert.equal(replaced.ok, true);
  images = JSON.parse(storedRow(created.id).images_payload);
  assert.deepEqual(images.images, []);
  assert.equal(images.sermonGraphicUrl, 'https://example.com/sermon.png');

  // Explicit null clears just that field.
  const cleared = update(created.id, {
    updated_at: readUpdatedAt(storedRow(created.id)),
    raw_payload: RAW('SABBATH, NOVEMBER 28, 2026'),
    sermonGraphicUrl: null,
  });
  assert.equal(cleared.ok, true);
  images = JSON.parse(storedRow(created.id).images_payload);
  assert.equal(images.sermonGraphicUrl, null);
});

test('update: bad image URL is reported after the gates pass', () => {
  const created = create({ raw_payload: RAW('SABBATH, DECEMBER 5, 2026') });
  assert.equal(created.ok, true);

  const result = update(created.id, {
    updated_at: readUpdatedAt(storedRow(created.id)),
    raw_payload: RAW('SABBATH, DECEMBER 5, 2026'),
    sermonGraphicUrl: 'http://127.0.0.1/evil.png',
  });
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'validation');
  assert.match(result.message, /sermonGraphicUrl/);
});

test('update: structured-only edit re-normalizes the stored rundown', () => {
  const created = create({ raw_payload: RAW('SABBATH, DECEMBER 12, 2026') });
  assert.equal(created.ok, true);

  const result = update(created.id, {
    updated_at: readUpdatedAt(storedRow(created.id)),
    sermon: { speaker: 'Pr. Noah', title: 'Hope' },
  });
  assert.equal(result.ok, true);

  const parsed = JSON.parse(
    getDb()
      .prepare('SELECT parsed_data FROM services WHERE id = ?')
      .get(created.id).parsed_data
  );
  assert.equal(parsed.sermon.speaker, 'Pr. Noah');
  assert.equal(parsed.sermon.title, 'Hope');
});

test('delete: removes an existing row once and reports unknown ids', () => {
  const created = create({ raw_payload: RAW('SABBATH, DECEMBER 19, 2026') });
  assert.equal(created.ok, true);

  assert.equal(deleteService(getDb(), created.id), true);
  assert.equal(deleteService(getDb(), created.id), false);
  assert.equal(deleteService(getDb(), 999999), false);
});

test('readJsonBody maps unparseable bodies to the shared Invalid JSON failure', async () => {
  const bad = await readJsonBody(
    new Request('http://localhost/api/services', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    })
  );
  assert.deepEqual(bad, {
    ok: false,
    kind: 'validation',
    message: 'Invalid JSON',
  });

  const good = await readJsonBody(
    new Request('http://localhost/api/services', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ raw_payload: 'x' }),
    })
  );
  assert.equal(good.ok, true);
  assert.deepEqual(good.value, { raw_payload: 'x' });
});
