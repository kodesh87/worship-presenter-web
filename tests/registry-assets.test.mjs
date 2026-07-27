/**
 * Bundled background assets: the seed's references, the generated map that
 * produced them, and their fidelity to the source deck.
 *
 * The defect this guards against was a *mapping* bug. `transform-registry-v1.mjs`
 * used to copy `slides-new/slide-NN.jpg` to `public/assets/<name>.jpg` assuming
 * `slide-NN` was deck slide NN; that folder held 57 renders of a 60-slide deck,
 * so the numbering drifted and sixteen of seventeen backgrounds showed the wrong
 * slide with its text baked into the pixels. Backgrounds now come byte-for-byte
 * out of the deck's own `ppt/media/`, driven by `data/asset-map.json`.
 *
 * The deck itself is gitignored (100 MB), so the byte-identity check skips with
 * a clear message when it is absent. Everything else runs everywhere.
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
const assetsDir = path.join(root, 'public', 'assets');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-assets-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const srcUrl = (...parts) => pathToFileURL(path.join(root, 'src', ...parts)).href;

const { loadSeedTemplates } = await import(srcUrl('lib', 'registry', 'seed.ts'));
const { isRegistryImageRef, isBundledAssetRef } = await import(
  srcUrl('lib', 'registry', 'asset-safety.ts')
);

const assetMap = JSON.parse(
  fs.readFileSync(path.join(root, 'data', 'asset-map.json'), 'utf8')
);
const seedTemplates = loadSeedTemplates();

const md5 = (file) =>
  crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');

/** Every bundled `/assets/*` reference the seed makes, with where it came from. */
function seedAssetRefs() {
  const refs = [];
  for (const template of seedTemplates) {
    for (const [layoutKey, layout] of Object.entries(template.layouts ?? {})) {
      if (!layout) continue;
      if (layout.backgroundImage) {
        refs.push({
          where: `${template.id}.${layoutKey}.backgroundImage`,
          ref: layout.backgroundImage,
        });
      }
      for (const element of layout.elements ?? []) {
        if (element.imageRef) {
          refs.push({
            where: `${template.id}.${layoutKey}.${element.id}.imageRef`,
            ref: element.imageRef,
          });
        }
      }
    }
  }
  return refs;
}

test('every seed image reference resolves to a committed asset', () => {
  const refs = seedAssetRefs();
  assert.ok(refs.length > 0, 'seed declares no image references at all');

  for (const { where, ref } of refs) {
    assert.ok(
      isRegistryImageRef(ref),
      `${where}: ${ref} is not an acceptable registry image reference`
    );
    assert.ok(
      isBundledAssetRef(ref),
      `${where}: ${ref} does not resolve to a committed file under public/assets`
    );
    const file = path.join(assetsDir, ref.slice('/assets/'.length));
    assert.ok(fs.statSync(file).size > 0, `${where}: ${file} is empty`);
  }
});

test('the seed and the asset map agree on every reference', () => {
  const bySeedLocation = new Map(seedAssetRefs().map((r) => [r.where, r.ref]));

  for (const entry of assetMap.entries) {
    const where =
      entry.refKind === 'imageRef'
        ? `${entry.templateId}.${entry.layoutKey}.${entry.elementId}.imageRef`
        : `${entry.templateId}.${entry.layoutKey}.backgroundImage`;

    if (entry.refKind === null) {
      // Deliberately left on a solid fill; the map must say why.
      assert.ok(
        typeof entry.reason === 'string' && entry.reason.length > 0,
        `${entry.templateId} has no background but the map records no reason`
      );
      assert.equal(
        bySeedLocation.get(where),
        undefined,
        `${entry.templateId} is mapped as having no background, but the seed still sets one`
      );
      continue;
    }

    assert.equal(
      bySeedLocation.get(where),
      entry.assetRef,
      `${where} does not match data/asset-map.json`
    );
  }

  // Nothing in the seed may reference bundled art the map does not account for.
  const mapped = new Set(
    assetMap.entries.filter((e) => e.assetRef).map((e) => e.assetRef)
  );
  for (const { where, ref } of seedAssetRefs()) {
    assert.ok(mapped.has(ref), `${where}: ${ref} is not listed in data/asset-map.json`);
  }
});

test('templates the map marks as distinct do not share a file or an md5', () => {
  const byTemplate = new Map();
  for (const entry of assetMap.entries) {
    if (!entry.exportedFile) continue;
    const key = `${entry.templateId}.${entry.layoutKey}`;
    byTemplate.set(key, entry);
  }

  const digests = new Map();
  for (const [key, entry] of byTemplate) {
    const file = path.join(assetsDir, entry.exportedFile);
    const digest = md5(file);
    const prior = digests.get(digest);
    if (prior && prior.entry.exportedFile !== entry.exportedFile) {
      assert.fail(
        `${key} (${entry.exportedFile}) and ${prior.key} (${prior.entry.exportedFile}) are ` +
          'different committed files with identical bytes — one of them is a stale duplicate'
      );
    }
    if (!prior) digests.set(digest, { key, entry });
  }

  // A shared plate must be one file with two references, never two copies.
  const partToFile = new Map();
  for (const entry of assetMap.entries) {
    if (!entry.mediaPart) continue;
    const prior = partToFile.get(entry.mediaPart);
    if (prior) {
      assert.equal(
        prior,
        entry.exportedFile,
        `${entry.mediaPart} is exported under two names (${prior} and ${entry.exportedFile})`
      );
    } else {
      partToFile.set(entry.mediaPart, entry.exportedFile);
    }
  }
});

test('public/assets holds exactly the files the map exports', () => {
  const expected = new Set(
    assetMap.entries.filter((e) => e.exportedFile).map((e) => e.exportedFile)
  );
  const onDisk = new Set(fs.readdirSync(assetsDir));

  for (const name of expected) {
    assert.ok(onDisk.has(name), `data/asset-map.json exports ${name}, but it is not committed`);
  }
  for (const name of onDisk) {
    assert.ok(
      expected.has(name),
      `public/assets/${name} is committed but no longer referenced by data/asset-map.json`
    );
  }
});

test('every exported asset is byte-identical to its media part in the source deck', async (t) => {
  const deck = path.join(root, assetMap.sourceDeck);
  if (!fs.existsSync(deck)) {
    t.skip(
      `source deck not present (${assetMap.sourceDeck}); it is gitignored, so byte-identity ` +
        'against ppt/media cannot be checked here. Run `node scripts/extract-pptx-assets.mjs export` ' +
        'on a machine that has the deck to re-verify.'
    );
    return;
  }

  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(deck));

  for (const entry of assetMap.entries) {
    if (!entry.mediaPart) continue;
    const part = zip.file(entry.mediaPart);
    assert.ok(
      part,
      `${entry.templateId}: ${entry.mediaPart} is absent from ${assetMap.sourceDeck}`
    );
    const deckBytes = await part.async('nodebuffer');
    const committed = fs.readFileSync(path.join(assetsDir, entry.exportedFile));
    assert.equal(
      crypto.createHash('md5').update(committed).digest('hex'),
      crypto.createHash('md5').update(deckBytes).digest('hex'),
      `${entry.exportedFile} is not byte-identical to ${entry.mediaPart} ` +
        `(slide ${entry.sourceSlide}); it must be copied, never re-encoded`
    );
  }
});
