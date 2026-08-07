/**
 * Lyric continuous join, char-budget split, and Verse→Chorus expansion.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const { splitLyricsLabeled } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'lyrics.ts')).href
);

test('continuous join: terminal punctuation joins with space', () => {
  const slides = splitLyricsLabeled(`Verse 1
Hope in the coming of the Lord.
We have this faith that Christ alone imparts.`);
  assert.equal(slides.length, 1);
  assert.equal(slides[0].label, '1/1');
  assert.equal(
    slides[0].text,
    'Hope in the coming of the Lord. We have this faith that Christ alone imparts.'
  );
  assert.ok(!slides[0].text.includes('\n'));
});

test('continuous join: punctuation before closing quote joins with space', () => {
  const slides = splitLyricsLabeled(`Verse 1
He said, "Hope in the Lord."
We trust His Word.`);
  assert.equal(slides.length, 1);
  assert.equal(
    slides[0].text,
    'He said, "Hope in the Lord." We trust His Word.'
  );
});

test('continuous join: no terminal punctuation joins with "; "', () => {
  const slides = splitLyricsLabeled(`Verse 1
Shall awake and shout and sing
Hallelujah! Christ is King!`);
  assert.equal(slides.length, 1);
  assert.equal(
    slides[0].text,
    'Shall awake and shout and sing; Hallelujah! Christ is King!'
  );
});

test('short verse fits budget as one slide', () => {
  const slides = splitLyricsLabeled(`Verse 1
Line one ends here.
Line two is short.`);
  assert.equal(slides.length, 1);
  assert.equal(slides[0].label, '1/1');
  assert.ok(slides[0].text.length <= 320);
});

test('long verse splits into multiple slides under char budget', () => {
  const longLines = Array.from({ length: 12 }, (_, i) => {
    // No terminal punct so joins with "; " — keeps soft break opportunities
    return `Phrase number ${i + 1} with enough words to grow the continuous string`;
  });
  const lyrics = `Verse 1\n${longLines.join('\n')}`;
  const slides = splitLyricsLabeled(lyrics);
  assert.ok(slides.length >= 2, `expected ≥2 slides, got ${slides.length}`);
  for (const s of slides) {
    assert.equal(s.label, '1/1');
    assert.ok(
      s.text.length <= 320,
      `chunk exceeds budget: ${s.text.length}`
    );
  }
  const rejoined = slides.map((s) => s.text).join(' ');
  assert.ok(rejoined.includes('Phrase number 1'));
  assert.ok(rejoined.includes('Phrase number 12'));
});

test('chorus after every verse when refrain present', () => {
  const slides = splitLyricsLabeled(`Verse 1
First verse line.
Verse 2
Second verse line.
Chorus
Shared chorus text.`);
  assert.deepEqual(
    slides.map((s) => s.label),
    ['1/2', 'Chorus', '2/2', 'Chorus']
  );
  assert.equal(slides[1].text, 'Shared chorus text.');
  assert.equal(slides[3].text, 'Shared chorus text.');
});

test('interleaved refrain still expands Verse→Chorus for every verse', () => {
  const slides = splitLyricsLabeled(`Verse 1
A line.
Chorus
The chorus.
Verse 2
B line.`);
  assert.deepEqual(
    slides.map((s) => s.label),
    ['1/2', 'Chorus', '2/2', 'Chorus']
  );
});

test('no chorus: verses only', () => {
  const slides = splitLyricsLabeled(`Verse 1
Only verse one.
Verse 2
Only verse two.`);
  assert.deepEqual(
    slides.map((s) => ({ label: s.label, text: s.text })),
    [
      { label: '1/2', text: 'Only verse one.' },
      { label: '2/2', text: 'Only verse two.' },
    ]
  );
});

test('preserveLineBreaks keeps newlines instead of continuous join', () => {
  const slides = splitLyricsLabeled(
    `Verse 1
Shall awake and shout and sing
Hallelujah! Christ is King!`,
    4,
    { preserveLineBreaks: true }
  );
  assert.equal(slides.length, 1);
  assert.equal(
    slides[0].text,
    'Shall awake and shout and sing\nHallelujah! Christ is King!'
  );
  assert.ok(!slides[0].text.includes(';'));
});

// Story 20.1 (AC-4, AD-20): `splitWeHaveThisHopeSlides` and its
// `WE_HAVE_THIS_HOPE_FALLBACK` constant are deleted, not migrated — "We Have
// This Hope" is now two fixed General rows (`hope-lyric-1` / `hope-lyric-2`)
// authored directly in the registry seed, byte-for-byte what this splitter
// used to produce (AC-5). `tests/registry-seed-conformance.test.mjs` and
// `tests/artifact-hydration.test.mjs` cover those rows; there is no longer a
// splitter here to unit-test in isolation.
