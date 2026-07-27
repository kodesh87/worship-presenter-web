/**
 * Parser regression: sample addendum rundown (sermon / The Speaker / Special Song / hymns).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { parseRundown } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'parser.ts')).href
);

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);

test('sample rundown: sermon speaker + title', () => {
  const parsed = parseRundown(sample);
  assert.ok(parsed.sermon);
  assert.equal(parsed.sermon.speaker, 'Timotius Wicaksana');
  assert.equal(parsed.sermon.title, 'Working Out');
});

test('sample rundown: Special Song "-" is none', () => {
  const parsed = parseRundown(sample);
  assert.equal(parsed.specialSong, null);
});

test('sample rundown: The Speaker → sermon speaker on closing prayer', () => {
  const parsed = parseRundown(sample);
  assert.equal(parsed.closingPrayerPerson, 'Timotius Wicaksana');
});

test('sample rundown: hymns resolve with titles from hymnal', () => {
  const parsed = parseRundown(sample);
  const hymns = parsed.items.filter((i) => i.type === 'hymn');
  const numbers = hymns.map((h) => h.number);
  assert.ok(numbers.includes(159));
  assert.ok(numbers.includes(163));
  assert.ok(numbers.includes(83));
  assert.ok(numbers.includes(249));
  const h159 = hymns.find((h) => h.number === 159);
  assert.ok(h159?.title);
  assert.notEqual(h159.title, 'Unknown SDAH 159');
  assert.ok(h159.lyrics?.length > 0);
});
