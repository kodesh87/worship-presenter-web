/**
 * Seed conformance: structural invariants the registry seed must satisfy before
 * it can be trusted to produce a deck.
 *
 * `validate.ts` already rejects an element that binds an *undeclared* placeholder.
 * The reverse direction is the one that bites, and it is silent: a template can
 * declare a placeholder that no element binds, hydration computes the weekly value
 * for it, and the value never reaches a slide. `pptx-content.test.mjs` records that
 * exact failure — "the verse-reading citation, the special-song performer and the
 * welcome date silently vanished from real decks."
 *
 * That test catches it only for the templates its one fixture exercises. These
 * assertions cover every template in the seed, which is what makes them a gate on
 * editing the seed rather than a gate on one sample service.
 *
 * Layout is data now (FR-20), so these run against the committed public seed —
 * `register-ts-resolve.mjs` sets WPW_USE_SHIPPED_REGISTRY=1, so a developer's
 * private `data/local/default-registry.json` cannot change the verdict.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const { loadSeedTemplates } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'seed.ts')).href
);

const templates = loadSeedTemplates();
const LAYOUT_KEYS = ['default', 'title', 'lyric'];

/** [layoutKey, layout] for every layout a template actually defines. */
function layoutsOf(template) {
  return LAYOUT_KEYS.filter((k) => template.layouts[k]).map((k) => [
    k,
    template.layouts[k],
  ]);
}

test('the seed is non-empty and every template id is unique', () => {
  assert.ok(templates.length > 0, 'seed contains no templates');
  const seen = new Set();
  for (const t of templates) {
    assert.ok(!seen.has(t.id), `duplicate template id in seed: ${t.id}`);
    seen.add(t.id);
  }
});

test('every declared placeholder is bound by at least one element', () => {
  const unbound = [];
  for (const template of templates) {
    const bound = new Set();
    for (const [, layout] of layoutsOf(template)) {
      for (const el of layout.elements) {
        if (el.placeholderKey) bound.add(el.placeholderKey);
      }
    }
    for (const p of template.placeholders) {
      if (!bound.has(p.key)) unbound.push(`${template.id}.${p.key}`);
    }
  }
  assert.deepEqual(
    unbound,
    [],
    `placeholders declared but bound by no element (their value would be computed and then never rendered): ${unbound.join(', ')}`
  );
});

test('no layout binds the same placeholder from two elements', () => {
  // Two elements bound to one key render the same content twice. The Part C
  // fellowship-etiquette slide shipped with exactly that doubling, which is why
  // this is asserted rather than assumed.
  const doubled = [];
  for (const template of templates) {
    for (const [layoutKey, layout] of layoutsOf(template)) {
      const counts = new Map();
      for (const el of layout.elements) {
        if (!el.placeholderKey) continue;
        counts.set(el.placeholderKey, (counts.get(el.placeholderKey) ?? 0) + 1);
      }
      for (const [key, n] of counts) {
        if (n > 1) doubled.push(`${template.id}.${layoutKey}.${key} (${n}x)`);
      }
    }
  }
  assert.deepEqual(doubled, [], `placeholder bound twice in one layout: ${doubled.join(', ')}`);
});

test('every element that binds a placeholder binds a declared one', () => {
  // The direction validate.ts already enforces on write. Asserted here too so a
  // hand-edited seed file cannot reach a deck build without tripping a test.
  const unknown = [];
  for (const template of templates) {
    const declared = new Set(template.placeholders.map((p) => p.key));
    for (const [layoutKey, layout] of layoutsOf(template)) {
      for (const el of layout.elements) {
        if (el.placeholderKey && !declared.has(el.placeholderKey)) {
          unknown.push(`${template.id}.${layoutKey}.${el.id} -> ${el.placeholderKey}`);
        }
      }
    }
  }
  assert.deepEqual(unknown, [], `element binds an undeclared placeholder: ${unknown.join(', ')}`);
});

test('every template id the planner emits exists in the seed', () => {
  // Read the ids out of the planner source rather than executing it: a missing
  // template only throws on the branch that emits it, and several branches are
  // conditional (Special Song, announcement flyers, sermon graphic). A source scan
  // covers the branches a single fixture would never reach.
  //
  // The trade-off is stated plainly: this sees literal `templateId: '...'` only. A
  // computed id would slip past, so keep planner ids literal.
  const planner = fs.readFileSync(
    path.join(root, 'src', 'lib', 'slide-plan.ts'),
    'utf8'
  );
  const emitted = [
    ...planner.matchAll(/templateId:\s*'([^']+)'/g),
  ].map((m) => m[1]);

  assert.ok(
    emitted.length > 0,
    'found no literal templateId in slide-plan.ts — the scan pattern has gone stale, not the seed'
  );

  const seedIds = new Set(templates.map((t) => t.id));
  const missing = [...new Set(emitted)].filter((id) => !seedIds.has(id));
  assert.deepEqual(
    missing,
    [],
    `planner emits template ids with no seed template (hydration hard-fails when that slide is built): ${missing.join(', ')}`
  );
});

test('every layout is 16:9 with at least one element', () => {
  for (const template of templates) {
    const layouts = layoutsOf(template);
    assert.ok(layouts.length > 0, `${template.id} defines no layout`);
    for (const [layoutKey, layout] of layouts) {
      assert.equal(
        layout.aspectRatio,
        '16:9',
        `${template.id}.${layoutKey} is not 16:9`
      );
      const hasContent =
        layout.elements.length > 0 || Boolean(layout.backgroundImage);
      assert.ok(
        hasContent,
        `${template.id}.${layoutKey} has no elements and no background image — it would render blank`
      );
    }
  }
});
