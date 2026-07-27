/**
 * GET /api/hymns query contract: `all`, `numbers`, `q`, `limit`, malformed params.
 * Imports the route handler directly against a temp SQLite DB.
 */
import { test } from 'node:test';
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hymns-api-test-'));
const previousDbPath = process.env.DB_PATH;
process.env.DB_PATH = path.join(tmp, 'test.db');

const { GET } = await import(
  pathToFileURL(path.join(root, 'src', 'app', 'api', 'hymns', 'route.ts')).href
);
const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const { NextRequest } = await import('next/server');

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 40;

/** Hymns actually present in the seeded corpus. */
const seededHymns = getDb()
  .prepare('SELECT number, title FROM hymns ORDER BY number ASC')
  .all();
const seededNumbers = seededHymns.map((row) => row.number);

/** Rows whose number or title literally contains `needle` (client semantics). */
function literalMatches(needle) {
  const q = needle.toLowerCase();
  return seededHymns.filter(
    (h) => String(h.number).includes(q) || h.title.toLowerCase().includes(q)
  );
}

async function call(search) {
  const res = await GET(new NextRequest(`http://localhost/api/hymns${search}`));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.hymns), 'body.hymns must be an array');
  return body.hymns;
}

function assertSortedByNumber(hymns) {
  for (let i = 1; i < hymns.length; i++) {
    assert.ok(
      hymns[i - 1].number < hymns[i].number,
      'rows must be ascending and unique by number'
    );
  }
}

test('corpus is seeded so the assertions below are meaningful', () => {
  assert.ok(seededNumbers.length > MAX_LIMIT, 'need more hymns than the cap');
});

test('no params returns the default page of the index', async () => {
  const hymns = await call('');
  assert.equal(hymns.length, DEFAULT_LIMIT);
  assertSortedByNumber(hymns);
  assert.deepEqual(
    hymns.map((h) => h.number),
    seededNumbers.slice(0, DEFAULT_LIMIT)
  );
  assert.equal(typeof hymns[0].title, 'string');
});

test('q matches number or title substrings, capped at the default limit', async () => {
  const byTitle = await call('?q=amaz');
  assert.ok(byTitle.length > 0);
  assert.ok(byTitle.length <= DEFAULT_LIMIT);
  for (const hymn of byTitle) {
    assert.ok(
      hymn.title.toLowerCase().includes('amaz') ||
        String(hymn.number).includes('amaz'),
      `unexpected match: ${hymn.number} - ${hymn.title}`
    );
  }
  assertSortedByNumber(byTitle);

  const byNumber = await call('?q=15');
  assert.ok(byNumber.length > 0);
  for (const hymn of byNumber) {
    assert.ok(
      String(hymn.number).includes('15') || hymn.title.toLowerCase().includes('15')
    );
  }
});

test('q escapes LIKE wildcards: % and _ are literals, not patterns', async () => {
  // Unescaped, `%...%` around `%` matches every row and `_` matches any single
  // character, so the server answered rows the client then filtered away with
  // `String.includes` and reported "No hymns found".
  for (const raw of ['%', '_', '%%', 'a%b', '_a_']) {
    const hymns = await call(`?q=${encodeURIComponent(raw)}`);
    const expected = literalMatches(raw);
    assert.equal(
      hymns.length,
      Math.min(expected.length, DEFAULT_LIMIT),
      `q=${JSON.stringify(raw)} must match literally`
    );
    for (const hymn of hymns) {
      assert.ok(
        hymn.title.toLowerCase().includes(raw.toLowerCase()) ||
          String(hymn.number).includes(raw),
        `q=${JSON.stringify(raw)} returned a non-literal match: ${hymn.title}`
      );
    }
  }

  // Same needle with and without a `_`: the plain one matches a real title, the
  // wildcarded one must not (it would if `_` still meant "any character").
  const sample = seededHymns.find((h) => h.title.length >= 8);
  assert.ok(sample, 'need a title long enough to slice');
  const slice = sample.title.slice(1, 6);
  const wildcarded = `${slice.slice(0, 2)}_${slice.slice(3)}`;
  assert.ok((await call(`?q=${encodeURIComponent(slice)}`)).length > 0);
  assert.equal(
    (await call(`?q=${encodeURIComponent(wildcarded)}`)).length,
    Math.min(literalMatches(wildcarded).length, DEFAULT_LIMIT)
  );
});

test('q escapes backslashes so the ESCAPE character cannot be smuggled in', async () => {
  for (const raw of ['\\', '\\%', '100\\']) {
    const hymns = await call(`?q=${encodeURIComponent(raw)}`);
    assert.equal(hymns.length, Math.min(literalMatches(raw).length, DEFAULT_LIMIT));
  }
});

test('q with no match returns an empty list, not an error', async () => {
  const hymns = await call('?q=zzzznotahymnzzzz');
  assert.deepEqual(hymns, []);
});

test('limit widens the page up to the cap', async () => {
  assert.equal((await call('?limit=3')).length, 3);
  assert.equal((await call('?limit=40')).length, MAX_LIMIT);
  assert.equal((await call('?limit=500')).length, MAX_LIMIT);
  assert.equal((await call('?q=e&limit=40')).length, MAX_LIMIT);
});

test('malformed limit falls back to the default instead of 400', async () => {
  for (const raw of ['abc', '', '0', '-5', '1.5.2', '20abc', 'NaN']) {
    const hymns = await call(`?limit=${encodeURIComponent(raw)}`);
    assert.equal(
      hymns.length,
      DEFAULT_LIMIT,
      `limit=${JSON.stringify(raw)} should fall back to ${DEFAULT_LIMIT}`
    );
  }
});

test('numbers returns exactly the requested hymns, ascending', async () => {
  const wanted = [seededNumbers[9], seededNumbers[2], seededNumbers[0]];
  const hymns = await call(`?numbers=${wanted.join(',')}`);
  assert.deepEqual(
    hymns.map((h) => h.number),
    [...wanted].sort((a, b) => a - b)
  );
  assertSortedByNumber(hymns);
});

test('numbers ignores malformed and duplicate entries', async () => {
  const first = seededNumbers[0];
  const second = seededNumbers[1];
  const hymns = await call(
    `?numbers=${first},abc,,${first}, ${second} ,-3,1e3,${9999999}`
  );
  assert.deepEqual(
    hymns.map((h) => h.number),
    [first, second]
  );
});

test('numbers with nothing usable returns an empty list', async () => {
  assert.deepEqual(await call('?numbers='), []);
  assert.deepEqual(await call('?numbers=abc,-1,0'), []);
  assert.deepEqual(await call('?numbers=99999999'), []);
});

test('numbers takes precedence over q and ignores limit', async () => {
  const wanted = seededNumbers.slice(0, 20);
  const hymns = await call(`?numbers=${wanted.join(',')}&q=amaz&limit=2`);
  assert.deepEqual(
    hymns.map((h) => h.number),
    wanted
  );
});

test('all=1 still returns the whole index, unaffected by limit', async () => {
  for (const search of ['?all=1', '?all=true', '?all=1&limit=5', '?all=1&q=amaz']) {
    const hymns = await call(search);
    assert.equal(hymns.length, seededNumbers.length, search);
  }
  assertSortedByNumber(await call('?all=1'));
});

test('all=0 is not a truthy flag and falls through to the default page', async () => {
  const hymns = await call('?all=0');
  assert.equal(hymns.length, DEFAULT_LIMIT);
});

test('DB_PATH env mutation is restored', () => {
  if (previousDbPath === undefined) delete process.env.DB_PATH;
  else process.env.DB_PATH = previousDbPath;
  assert.equal(process.env.DB_PATH, previousDbPath);
});
