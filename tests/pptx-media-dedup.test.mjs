/**
 * Offline PPTX archive: identical embedded media collapse onto one file while
 * every relationship target still resolves and the configured transition
 * survives.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pptx-dedup-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const { default: JSZip } = await import(
  pathToFileURL(path.join(root, 'node_modules', 'jszip', 'lib', 'index.js')).href
);
const { DEFAULT_SLIDE_TRANSITION, slideTransitionXml } = await import(
  srcUrl('lib', 'transitions.ts')
);
const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
const { generatePptx } = await import(srcUrl('lib', 'pptx.ts'));
const { buildSlidePlan } = await import(srcUrl('lib', 'slide-plan.ts'));

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);
const parsed = parseRundown(sample);
const plan = buildSlidePlan('2026-07-11', parsed, []);
const buffer = await generatePptx('2026-07-11', parsed, []);
const zip = await JSZip.loadAsync(buffer);
const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);

test('archive is a valid zip with one slide part per planned slide', () => {
  const slides = names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  assert.equal(slides.length, plan.length);
  assert.ok(names.includes('[Content_Types].xml'));
  assert.ok(names.includes('ppt/presentation.xml'));
});

test('no two embedded media files carry identical bytes', async () => {
  const media = names.filter((n) => n.startsWith('ppt/media/'));
  assert.ok(media.length > 0, 'deck should embed registry backgrounds');

  const seen = new Map();
  for (const name of media) {
    const bytes = await zip.file(name).async('nodebuffer');
    const key = `${crypto.createHash('sha256').update(bytes).digest('hex')}${path.posix
      .extname(name)
      .toLowerCase()}`;
    assert.ok(!seen.has(key), `duplicate media ${name} == ${seen.get(key)}`);
    seen.set(key, name);
  }

  // Backgrounds repeat across ~50 slides, so dedup must actually bite.
  assert.ok(
    media.length < plan.length,
    `expected fewer media files (${media.length}) than slides (${plan.length})`
  );
});

test('every relationship media target resolves to an existing entry', async () => {
  const entries = new Set(names);
  const rels = names.filter((n) => n.endsWith('.rels'));
  let mediaTargets = 0;

  for (const rel of rels) {
    const xml = await zip.file(rel).async('string');
    for (const match of xml.matchAll(/Target="([^"]*media\/[^"]+)"/g)) {
      // Targets are relative to the part directory, not the `_rels` directory.
      const partDir = path.posix.dirname(rel).replace(/\/_rels$/, '');
      const resolved = path.posix.normalize(
        path.posix.join(partDir, match[1])
      );
      mediaTargets += 1;
      assert.ok(
        entries.has(resolved),
        `${rel} points at missing ${match[1]}`
      );
    }
  }

  assert.ok(mediaTargets > 0, 'slides should reference media');
});

test('content type defaults still cover every embedded extension', async () => {
  const contentTypes = await zip.file('[Content_Types].xml').async('string');
  const declared = new Set(
    [...contentTypes.matchAll(/Extension="([^"]+)"/g)].map((m) =>
      m[1].toLowerCase()
    )
  );
  for (const name of names.filter((n) => n.startsWith('ppt/media/'))) {
    const ext = path.posix.extname(name).slice(1).toLowerCase();
    assert.ok(declared.has(ext), `missing content type default for .${ext}`);
  }
});

test('the configured transition survives the deduplication pass', async () => {
  // Counting `<p:transition>` would pass with the wrong style in every slide,
  // so this asserts the element the configuration actually calls for. Nothing
  // is configured here, so that is the default fade.
  const expected = slideTransitionXml(DEFAULT_SLIDE_TRANSITION);
  const slides = names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  let faded = 0;
  for (const name of slides) {
    const xml = await zip.file(name).async('string');
    if (!xml.includes('<p:transition')) continue;
    assert.ok(
      xml.includes(expected),
      `${name} carries a transition that is not ${DEFAULT_SLIDE_TRANSITION}`
    );
    faded += 1;
  }
  assert.ok(faded > 0, 'transition injection must still run after dedup');
});

test('the shipped archive is DEFLATE-compressed, not STORE', () => {
  let compressed = 0;
  let uncompressed = 0;
  for (const name of names) {
    const data = zip.files[name]._data;
    compressed += data.compressedSize ?? 0;
    uncompressed += data.uncompressedSize ?? 0;
  }

  assert.ok(uncompressed > 0, 'archive should carry content');
  assert.ok(
    compressed < uncompressed,
    `post-processing re-emitted STORE (${compressed} === ${uncompressed})`
  );
});

/**
 * The reliability invariant: pptxgenjs resolves media lazily inside `write()`,
 * so a path or URL handed to `addImage` fails the *whole* presentation long
 * after the per-element try/catch returned. Every image must therefore be
 * embedded as bytes before a slide is drawn, and anything that cannot be
 * embedded must degrade to the visible "Image unavailable" box.
 */
test('unreadable and remote images degrade to one slide, never fail the deck', async () => {
  const missingUpload = `/api/uploads/${'a'.repeat(32)}.jpg`;
  // RFC 2606 reserves `.invalid`, so this never resolves — it stands in for
  // every remote failure mode (DNS, timeout, 404, non-image content type).
  const deadRemote = 'http://images.example.invalid/flyer.jpg';

  const degraded = await generatePptx('2026-07-11', parsed, {
    flyers: [missingUpload, deadRemote],
  });
  assert.ok(degraded.length > 0, 'a bad image must not fail generation');

  const degradedZip = await JSZip.loadAsync(degraded);
  const degradedNames = Object.keys(degradedZip.files).filter(
    (n) => !degradedZip.files[n].dir
  );
  const degradedPlan = buildSlidePlan('2026-07-11', parsed, {
    flyers: [missingUpload, deadRemote],
  });
  const slideParts = degradedNames.filter((n) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(n)
  );
  assert.equal(slideParts.length, degradedPlan.length);

  let fallbacks = 0;
  for (const name of slideParts) {
    const xml = await degradedZip.file(name).async('string');
    if (xml.includes('Image unavailable')) fallbacks += 1;
  }
  assert.equal(
    fallbacks,
    2,
    'each unusable flyer should render exactly one fallback box'
  );

  // Nothing unresolvable may survive into the archive as a lazy reference.
  for (const name of degradedNames.filter((n) => n.endsWith('.rels'))) {
    const xml = await degradedZip.file(name).async('string');
    assert.ok(
      !xml.includes('example.invalid'),
      `${name} still carries a remote media reference`
    );
  }
});
