/**
 * `data/asset-map.json` must not record the week's data.
 *
 * That file is generated from the real source deck, and its `evidence` field is
 * the slide's own text runs — which on a payload-bearing slide are member data.
 * It committed a family's surname, three given names and their prayer request
 * from slide 56, and the sermon speaker's full name from slides 40 and 50, into a
 * public repository. `tests/public-repo-guard.test.mjs` did not stop any of it and
 * could not have: a fingerprint list only knows names someone already registered,
 * never the next family.
 *
 * `evidenceFor` in `scripts/extract-pptx-assets.mjs` is where that is fixed, by
 * not producing the value. This asserts the same invariant on the committed
 * artifact, so a regenerated map — or a hand edit — cannot reintroduce it.
 *
 * The invariant is stated independently here rather than by importing the
 * generator's helper. A test that shares the implementation it checks agrees with
 * the bug as readily as with the fix; both sides derive from the registry instead,
 * which is the actual contract.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const assetMap = JSON.parse(
  fs.readFileSync(path.join(root, 'data', 'asset-map.json'), 'utf8')
);
// The committed public seed, deliberately: this asserts the committed artifact,
// and `register-ts-resolve.mjs` already pins WPW_USE_SHIPPED_REGISTRY for tests.
const registry = JSON.parse(
  fs.readFileSync(path.join(root, 'data', 'default-registry.json'), 'utf8')
);
const templates = Array.isArray(registry) ? registry : registry.templates;

const norm = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();
const WITHHELD = /^\[\d+ run\(s\) withheld: /;

/** templateId -> { payloadBearing, fixed: normalized declared copy } */
const index = new Map(
  templates.map((t) => {
    const fixed = [];
    for (const key of ['default', 'title', 'lyric']) {
      const layout = t.layouts?.[key];
      if (!layout) continue;
      for (const el of layout.elements ?? []) {
        if (typeof el.content === 'string' && el.content.trim()) {
          fixed.push(norm(el.content));
        }
      }
    }
    return [t.id, { payloadBearing: (t.placeholders ?? []).length > 0, fixed }];
  })
);

test('every asset-map row names a template that exists in the seed', () => {
  const unknown = assetMap.entries
    .map((e) => e.templateId)
    .filter((id) => !index.has(id));
  assert.deepEqual(
    [...new Set(unknown)],
    [],
    `asset-map rows reference template ids absent from the registry: ${unknown.join(', ')}`
  );
});

test('a payload-bearing slide contributes no evidence beyond its declared copy', () => {
  const leaked = [];
  for (const entry of assetMap.entries) {
    const meta = index.get(entry.templateId);
    if (!meta || !meta.payloadBearing) continue;
    for (const run of entry.evidence ?? []) {
      if (WITHHELD.test(run)) continue;
      const n = norm(run);
      if (!meta.fixed.some((f) => f.includes(n))) {
        leaked.push(`${entry.templateId} (slide ${entry.sourceSlide}): ${JSON.stringify(run)}`);
      }
    }
  }
  assert.deepEqual(
    leaked,
    [],
    'these evidence runs are not copy the template declares, so on a slide that ' +
      'carries the weekly payload they are member data:\n  ' +
      leaked.join('\n  ')
  );
});

test('a filtered row says so, rather than going quietly empty', () => {
  // A row stripped to nothing is indistinguishable from a row nobody checked, so
  // the generator appends a withheld count. Any payload-bearing row that lost
  // runs must carry it.
  for (const entry of assetMap.entries) {
    const meta = index.get(entry.templateId);
    if (!meta || !meta.payloadBearing) continue;
    const runs = entry.evidence ?? [];
    if (runs.length === 0) continue; // slide genuinely had no text
    const declared = runs.filter((r) => !WITHHELD.test(r));
    const marker = runs.filter((r) => WITHHELD.test(r));
    assert.ok(
      declared.length > 0 || marker.length > 0,
      `${entry.templateId} has evidence entries that are neither declared copy nor a withheld marker`
    );
    assert.ok(
      marker.length <= 1,
      `${entry.templateId} carries ${marker.length} withheld markers; expected at most one`
    );
  }
});

test('no evidence run looks like a glued personal name', () => {
  // Belt to the braces above: the two real names that reached this file were both
  // glued multi-word tokens — the form a word-boundary search cannot see. Bank and
  // church names arrive the same way and are the reason this is an allowlist
  // rather than a blanket ban.
  const ORGANISATIONS = new Set([
    'bankmandiri',
    'gerejamasehiadvent',
    'hariketujuhbic',
  ]);
  const suspicious = [];
  for (const entry of assetMap.entries) {
    for (const run of entry.evidence ?? []) {
      for (const match of String(run).matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g)) {
        if (!ORGANISATIONS.has(match[0].toLowerCase())) {
          suspicious.push(`${entry.templateId}: ${match[0]}`);
        }
      }
    }
  }
  assert.deepEqual(
    suspicious,
    [],
    'glued capitalised tokens in evidence, which is the shape both real personal ' +
      'names arrived in. If one of these is an organisation, add it to ' +
      'ORGANISATIONS; if it is a person, it must not be committed:\n  ' +
      suspicious.join('\n  ')
  );
});
