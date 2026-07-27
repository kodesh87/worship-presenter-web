/**
 * HTTP contract for `/api/services` and `/api/services/[id]`.
 *
 * The Epic 14 debt refactor moved every domain rule into `src/lib/services/*`
 * on the promise that each status code and JSON body stays byte-identical —
 * with one documented exception: malformed `PUT` JSON now answers
 * `400 { error: 'Invalid JSON' }` where it used to fall through to a 500.
 *
 * `tests/services-lib.test.mjs` covers the domain functions; this file covers
 * the mapping the routes perform, so a handler that stopped translating
 * `kind: 'collision'` into 409 (or reordered the gates) fails here. Every case
 * asserts both the status code and the exact JSON body.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Next ships `next/server.js` without an ESM exports map; node needs the
// extension. Chained ahead of the repo's ts-resolve hook.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(specifier, context, nextResolve) {
         if (specifier === 'next/server') {
           return nextResolve('next/server.js', context);
         }
         return nextResolve(specifier, context);
       }`
    )
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'services-http-test-'));
const previousDbPath = process.env.DB_PATH;
process.env.DB_PATH = path.join(tmp, 'test.db');

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;

const { GET, POST } = await import(
  srcUrl('app', 'api', 'services', 'route.ts')
);
const { PUT, DELETE } = await import(
  srcUrl('app', 'api', 'services', '[id]', 'route.ts')
);
const { getDb } = await import(srcUrl('lib', 'db', 'index.ts'));
const { NextRequest } = await import('next/server');

after(() => {
  if (previousDbPath === undefined) delete process.env.DB_PATH;
  else process.env.DB_PATH = previousDbPath;
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

const SERVICES_URL = 'http://localhost/api/services';
const itemUrl = (id) => `${SERVICES_URL}/${id}`;
/** Route handler `context` — `params` is a Promise in the App Router. */
const routeContext = (id) => ({ params: Promise.resolve({ id: String(id) }) });

const UNSAFE_IMAGE = 'http://127.0.0.1/evil.png';

/** A rundown the parser accepts, optionally with extra trailing lines. */
const RAW = (dateLine, extra = '') =>
  [
    dateLine,
    'DIVINE SERVICE',
    'Opening Song: SDAH #159',
    'Sermon: Pastor Adam',
    'Closing Prayer: The Speaker',
    ...(extra ? [extra] : []),
  ].join('\n');

function jsonRequest(url, method, rawBody) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: rawBody,
  });
}

async function envelope(response) {
  return { status: response.status, body: await response.json() };
}

const getServices = (search = '') =>
  GET(new NextRequest(`${SERVICES_URL}${search}`)).then(envelope);
const postRaw = (rawBody) =>
  POST(jsonRequest(SERVICES_URL, 'POST', rawBody)).then(envelope);
const post = (body) => postRaw(JSON.stringify(body));
const putRaw = (id, rawBody) =>
  PUT(jsonRequest(itemUrl(id), 'PUT', rawBody), routeContext(id)).then(envelope);
const put = (id, body) => putRaw(id, JSON.stringify(body));
const del = (id) =>
  DELETE(new NextRequest(itemUrl(id), { method: 'DELETE' }), routeContext(id)).then(
    envelope
  );

/** Create a service over HTTP and return its id, failing loudly if it did not. */
async function createdService(body) {
  const res = await post(body);
  assert.equal(res.status, 201, `setup create failed: ${JSON.stringify(res.body)}`);
  return res.body.id;
}

/** Current optimistic-concurrency token, read back over HTTP. */
async function tokenOf(id) {
  const { body } = await getServices();
  const found = body.services.find((s) => s.id === id);
  assert.ok(found, `service ${id} missing from GET /api/services`);
  return found.updated_at;
}

function storedRow(id) {
  return getDb()
    .prepare(
      'SELECT date, raw_payload, images_payload FROM services WHERE id = ?'
    )
    .get(id);
}

const sortedKeys = (obj) => Object.keys(obj).sort();

test('GET returns the { services, q, count } envelope', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, JANUARY 3, 2026') });

  const { status, body } = await getServices();
  assert.equal(status, 200);
  assert.deepEqual(sortedKeys(body), ['count', 'q', 'services']);
  assert.equal(body.q, null);
  assert.ok(Array.isArray(body.services));
  assert.equal(body.count, body.services.length);
  assert.ok(body.count >= 1);

  const item = body.services.find((s) => s.id === id);
  assert.ok(item);
  assert.deepEqual(sortedKeys(item), [
    'created_at',
    'date',
    'id',
    'parsed_data',
    'raw_payload',
    'updated_at',
  ]);
  assert.equal(item.date, '2026-01-03');
  assert.equal(typeof item.raw_payload, 'string');
  assert.equal(typeof item.updated_at, 'string');
  assert.ok(item.parsed_data && typeof item.parsed_data === 'object');
});

test('GET ?q= LIKE-matches the date and the raw payload', async () => {
  const id = await createdService({
    raw_payload: RAW('SABBATH, JANUARY 10, 2026', 'http-token-january-ten'),
  });

  const byDate = await getServices('?q=2026-01-10');
  assert.equal(byDate.status, 200);
  assert.equal(byDate.body.q, '2026-01-10');
  assert.deepEqual(
    byDate.body.services.map((s) => s.id),
    [id]
  );
  assert.equal(byDate.body.count, 1);

  const byRaw = await getServices('?q=http-token-january-ten');
  assert.equal(byRaw.status, 200);
  assert.equal(byRaw.body.q, 'http-token-january-ten');
  assert.deepEqual(
    byRaw.body.services.map((s) => s.id),
    [id]
  );

  const noMatch = await getServices('?q=zzz-no-such-service-zzz');
  assert.equal(noMatch.status, 200);
  assert.deepEqual(noMatch.body, {
    services: [],
    q: 'zzz-no-such-service-zzz',
    count: 0,
  });

  // Whitespace-only q trims to empty, so the envelope reports `q: null`.
  const blank = await getServices('?q=%20%20');
  assert.equal(blank.status, 200);
  assert.equal(blank.body.q, null);
  assert.ok(blank.body.count >= 1);
});

test('POST valid rundown returns 201 with the create envelope', async () => {
  const { status, body } = await post({
    raw_payload: RAW('SABBATH, JANUARY 17, 2026'),
  });

  assert.equal(status, 201);
  assert.deepEqual(sortedKeys(body), [
    'date',
    'failedHymnNumbers',
    'id',
    'message',
  ]);
  assert.equal(body.message, 'Service created successfully');
  assert.ok(Number.isInteger(body.id) && body.id > 0);
  assert.equal(body.date, '2026-01-17');
  assert.deepEqual(body.failedHymnNumbers, []);
});

test('POST reports unresolved hymn numbers in failedHymnNumbers', async () => {
  const { status, body } = await post({
    raw_payload: `SABBATH, JANUARY 24, 2026
DIVINE SERVICE
Opening Song: SDAH #9999
Sermon: Pastor Adam`,
  });

  assert.equal(status, 201);
  assert.deepEqual(body.failedHymnNumbers, [9999]);
});

test('POST malformed JSON returns 400 Invalid JSON', async () => {
  const { status, body } = await postRaw('{not json');
  assert.equal(status, 400);
  assert.deepEqual(body, { error: 'Invalid JSON' });
});

test('POST non-object body returns 400 Invalid body', async () => {
  for (const raw of ['5', '"a string"', '[1,2]', 'null', 'true']) {
    const { status, body } = await postRaw(raw);
    assert.equal(status, 400, raw);
    assert.deepEqual(body, { error: 'Invalid body' }, raw);
  }
});

test('POST without raw_payload returns 400 raw_payload is required', async () => {
  for (const payload of [{}, { raw_payload: '   ' }, { raw_payload: 42 }]) {
    const { status, body } = await post(payload);
    assert.equal(status, 400, JSON.stringify(payload));
    assert.deepEqual(body, { error: 'raw_payload is required' });
  }
});

test('POST undated rundown returns 400 with the date message', async () => {
  const { status, body } = await post({
    raw_payload: 'no date anywhere in this text',
  });
  assert.equal(status, 400);
  assert.deepEqual(body, {
    error: 'Could not parse service date from raw_payload',
  });
});

test('POST on a taken date returns 409, allowSecond returns 201', async () => {
  const firstId = await createdService({
    raw_payload: RAW('SABBATH, FEBRUARY 7, 2026'),
  });

  const collision = await post({ raw_payload: RAW('SABBATH, FEBRUARY 7, 2026') });
  assert.equal(collision.status, 409);
  assert.deepEqual(collision.body, {
    error: 'Service already exists for this date',
    existingId: firstId,
    date: '2026-02-07',
  });

  const second = await post({
    raw_payload: RAW('SABBATH, FEBRUARY 7, 2026'),
    allowSecond: true,
  });
  assert.equal(second.status, 201);
  assert.equal(second.body.date, '2026-02-07');
  assert.notEqual(second.body.id, firstId);

  const rows = getDb()
    .prepare('SELECT id FROM services WHERE date = ?')
    .all('2026-02-07');
  assert.equal(rows.length, 2);
});

test('PUT with a matching updated_at returns 200 with the update envelope', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, MARCH 7, 2026') });

  const { status, body } = await put(id, {
    updated_at: await tokenOf(id),
    raw_payload: RAW('SABBATH, MARCH 7, 2026', 'edited-over-http'),
    participantsRaw: 'Elder: Ada',
  });

  assert.equal(status, 200);
  assert.deepEqual(sortedKeys(body), [
    'failedHymnNumbers',
    'message',
    'updated_at',
  ]);
  assert.equal(body.message, 'Service updated successfully');
  assert.deepEqual(body.failedHymnNumbers, []);
  assert.equal(typeof body.updated_at, 'string');
  assert.ok(body.updated_at.length > 0);
  assert.match(storedRow(id).raw_payload, /edited-over-http/);
});

test('PUT malformed JSON returns 400 Invalid JSON instead of 500', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, MARCH 14, 2026') });
  const { status, body } = await putRaw(id, '{not json');
  assert.equal(status, 400);
  assert.deepEqual(body, { error: 'Invalid JSON' });
});

test('PUT non-object body returns 400 Invalid body', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, MARCH 21, 2026') });
  const { status, body } = await putRaw(id, '"a string"');
  assert.equal(status, 400);
  assert.deepEqual(body, { error: 'Invalid body' });
});

test('PUT without updated_at returns the concurrency 400', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, MARCH 28, 2026') });

  for (const payload of [
    { raw_payload: RAW('SABBATH, MARCH 28, 2026') },
    { updated_at: '   ', raw_payload: RAW('SABBATH, MARCH 28, 2026') },
    { updated_at: 7, raw_payload: RAW('SABBATH, MARCH 28, 2026') },
  ]) {
    const { status, body } = await put(id, payload);
    assert.equal(status, 400, JSON.stringify(payload));
    assert.deepEqual(body, {
      error: 'updated_at is required for concurrent edit protection',
    });
  }
});

test('PUT with neither raw_payload nor structured fields returns 400', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, APRIL 4, 2026') });
  const { status, body } = await put(id, { updated_at: await tokenOf(id) });
  assert.equal(status, 400);
  assert.deepEqual(body, { error: 'Missing raw_payload or structured fields' });
});

test('PUT on an unknown id returns 404 Service not found', async () => {
  const { status, body } = await put(999999, {
    updated_at: '2026-01-01 00:00:00',
    raw_payload: RAW('SABBATH, APRIL 11, 2026'),
  });
  assert.equal(status, 404);
  assert.deepEqual(body, { error: 'Service not found' });
});

test('PUT with a stale updated_at returns 409 and leaves the row unchanged', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, APRIL 18, 2026') });
  const before = storedRow(id);
  const currentToken = await tokenOf(id);

  const { status, body } = await put(id, {
    updated_at: '1999-01-01 00:00:00',
    raw_payload: RAW('SABBATH, APRIL 18, 2026', 'must-not-persist'),
  });

  assert.equal(status, 409);
  assert.deepEqual(body, {
    error: 'Conflict: service was modified; refresh and retry',
    updated_at: currentToken,
  });

  const after = storedRow(id);
  assert.equal(after.raw_payload, before.raw_payload);
  assert.equal(await tokenOf(id), currentToken);
});

test('PUT keeps the stored image payload when the body omits images', async () => {
  const id = await createdService({
    raw_payload: RAW('SABBATH, APRIL 25, 2026'),
    images: ['https://example.com/a.png'],
    sermonGraphicUrl: 'https://example.com/sermon.png',
  });

  const kept = await put(id, {
    updated_at: await tokenOf(id),
    raw_payload: RAW('SABBATH, APRIL 25, 2026'),
    participantsRaw: 'Elder: Ada',
  });
  assert.equal(kept.status, 200);
  const untouched = JSON.parse(storedRow(id).images_payload);
  assert.deepEqual(untouched, {
    images: ['https://example.com/a.png'],
    sermonGraphicUrl: 'https://example.com/sermon.png',
    familyPhotoUrl: null,
    youthPhotoUrl: null,
  });

  const replaced = await put(id, {
    updated_at: await tokenOf(id),
    raw_payload: RAW('SABBATH, APRIL 25, 2026'),
    images: [],
  });
  assert.equal(replaced.status, 200);
  const afterReplace = JSON.parse(storedRow(id).images_payload);
  assert.deepEqual(afterReplace, {
    images: [],
    sermonGraphicUrl: 'https://example.com/sermon.png',
    familyPhotoUrl: null,
    youthPhotoUrl: null,
  });
});

test('PUT with an unsafe image URL returns 400 once the gates pass', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, MAY 2, 2026') });
  const { status, body } = await put(id, {
    updated_at: await tokenOf(id),
    raw_payload: RAW('SABBATH, MAY 2, 2026'),
    sermonGraphicUrl: UNSAFE_IMAGE,
  });
  assert.equal(status, 400);
  assert.deepEqual(sortedKeys(body), ['error']);
  assert.match(body.error, /sermonGraphicUrl/);
});

test('DELETE removes an existing service, then reports 404', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, MAY 9, 2026') });

  const removed = await del(id);
  assert.equal(removed.status, 200);
  assert.deepEqual(removed.body, { message: 'Service deleted successfully' });

  const again = await del(id);
  assert.equal(again.status, 404);
  assert.deepEqual(again.body, { error: 'Service not found' });

  const unknown = await del(999999);
  assert.equal(unknown.status, 404);
  assert.deepEqual(unknown.body, { error: 'Service not found' });
});

test('a non-numeric id returns 400 Invalid Service ID on PUT and DELETE', async () => {
  for (const id of ['abc', '0', '-1', '1.5', '1e3', ' 1', '01x']) {
    const removed = await del(id);
    assert.equal(removed.status, 400, `DELETE ${id}`);
    assert.deepEqual(removed.body, { error: 'Invalid Service ID' }, `DELETE ${id}`);

    // The id is rejected before the body is even read.
    const updated = await putRaw(id, '{not json');
    assert.equal(updated.status, 400, `PUT ${id}`);
    assert.deepEqual(updated.body, { error: 'Invalid Service ID' }, `PUT ${id}`);
  }
});

test('error precedence: the date 400 wins over a bad image URL on POST', async () => {
  const { status, body } = await post({
    raw_payload: 'no date anywhere in this text',
    sermonGraphicUrl: UNSAFE_IMAGE,
  });
  assert.equal(status, 400);
  assert.deepEqual(body, {
    error: 'Could not parse service date from raw_payload',
  });
});

test('error precedence: the 404 wins over a bad image URL on PUT', async () => {
  const { status, body } = await put(999999, {
    updated_at: '2026-01-01 00:00:00',
    raw_payload: RAW('SABBATH, MAY 16, 2026'),
    sermonGraphicUrl: UNSAFE_IMAGE,
  });
  assert.equal(status, 404);
  assert.deepEqual(body, { error: 'Service not found' });
});

test('error precedence: the 409 wins over a bad image URL on PUT', async () => {
  const id = await createdService({ raw_payload: RAW('SABBATH, MAY 23, 2026') });
  const currentToken = await tokenOf(id);

  const { status, body } = await put(id, {
    updated_at: '1999-01-01 00:00:00',
    raw_payload: RAW('SABBATH, MAY 23, 2026'),
    sermonGraphicUrl: UNSAFE_IMAGE,
  });
  assert.equal(status, 409);
  assert.deepEqual(body, {
    error: 'Conflict: service was modified; refresh and retry',
    updated_at: currentToken,
  });
});
