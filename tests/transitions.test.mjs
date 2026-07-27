/**
 * Slide transitions: the one table both surfaces read, and the PowerPoint XML
 * that actually lands in a generated deck.
 *
 * The deck assertions matter most — no browser check can tell you that the
 * configured style is the element PowerPoint will find in the slide part.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'transitions-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const { default: JSZip } = await import(
  pathToFileURL(path.join(root, 'node_modules', 'jszip', 'lib', 'index.js')).href
);
const {
  DEFAULT_SLIDE_TRANSITION,
  SLIDE_TRANSITIONS,
  SLIDE_TRANSITION_SPECS,
  isSlideTransition,
  parseSlideTransition,
  slideTransitionXml,
  transitionLayerStyle,
} = await import(srcUrl('lib', 'transitions.ts'));
const { getSetting, setSetting, getSlideTransition, setSlideTransition } =
  await import(srcUrl('lib', 'settings.ts'));
const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
const { buildSlidePlan } = await import(srcUrl('lib', 'slide-plan.ts'));
const { generatePptx } = await import(srcUrl('lib', 'pptx.ts'));

const SETTING_KEY = 'slide_transition';

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);
const parsed = parseRundown(sample);
// Flyers are the per-slide opt-out in the wild: `buildSlidePlan` marks them
// `fade: false` so a photo never animates.
// RFC 2606 reserves `.invalid`, so the fetch fails immediately and the slide
// degrades to its "Image unavailable" box — still a slide, still opted out.
const media = { flyers: ['http://images.example.invalid/flyer-a.jpg'] };

const slideParts = (zip) =>
  Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n) && !zip.files[n].dir)
    .sort(
      (a, b) =>
        Number(a.match(/slide(\d+)\.xml$/)[1]) -
        Number(b.match(/slide(\d+)\.xml$/)[1])
    );

test('the offered set is exactly the five plain-`p:` styles', () => {
  assert.deepEqual([...SLIDE_TRANSITIONS], [
    'none',
    'cut',
    'fade',
    'dissolve',
    'push',
  ]);
  assert.equal(DEFAULT_SLIDE_TRANSITION, 'fade');
});

test('each style maps to its PowerPoint element', () => {
  assert.equal(slideTransitionXml('none'), null);
  assert.equal(
    slideTransitionXml('cut'),
    '<p:transition spd="fast"><p:cut/></p:transition>'
  );
  // Byte-identical to the string this app shipped before the style was
  // selectable: configuring nothing must change nothing.
  assert.equal(
    slideTransitionXml('fade'),
    '<p:transition spd="slow"><p:fade/></p:transition>'
  );
  assert.equal(
    slideTransitionXml('dissolve'),
    '<p:transition spd="slow"><p:dissolve/></p:transition>'
  );
  assert.equal(
    slideTransitionXml('push'),
    '<p:transition spd="med"><p:push dir="l"/></p:transition>'
  );
});

test('no offered style needs the p14 extension namespace', () => {
  for (const id of SLIDE_TRANSITIONS) {
    const xml = slideTransitionXml(id);
    if (xml === null) continue;
    assert.ok(!xml.includes('p14:'), `${id} smuggles in a p14 element`);
    assert.ok(
      !xml.includes('mc:AlternateContent'),
      `${id} needs an AlternateContent fallback`
    );
  }
});

test('every style carries browser parameters, and the two instant ones say so', () => {
  for (const id of SLIDE_TRANSITIONS) {
    const { browser } = SLIDE_TRANSITION_SPECS[id];
    assert.ok(browser.durationMs >= 0);
    assert.ok(browser.incoming.from && browser.incoming.to);
  }

  // `none` and `cut` differ only in the deck; on screen both are a hard swap
  // with no outgoing slide kept mounted.
  for (const id of ['none', 'cut']) {
    assert.equal(SLIDE_TRANSITION_SPECS[id].browser.durationMs, 0);
    assert.equal(SLIDE_TRANSITION_SPECS[id].browser.outgoing, null);
  }

  // Everything animated keeps the outgoing slide, or there is nothing to
  // cross-fade over and nothing to push.
  for (const id of ['fade', 'dissolve', 'push']) {
    assert.ok(SLIDE_TRANSITION_SPECS[id].browser.durationMs > 0);
    assert.ok(SLIDE_TRANSITION_SPECS[id].browser.outgoing);
  }

  // Documented approximation: dissolve has no faithful CSS equivalent, so the
  // browser runs the same cross-fade as `fade`.
  assert.deepEqual(
    SLIDE_TRANSITION_SPECS.dissolve.browser,
    SLIDE_TRANSITION_SPECS.fade.browser
  );
});

test('layer styles pin transitions off before the run and on during it', () => {
  const before = transitionLayerStyle('fade', 'incoming', 'initial');
  assert.equal(before.opacity, 0);
  assert.equal(before.transition, 'none');

  const during = transitionLayerStyle('fade', 'incoming', 'active');
  assert.equal(during.opacity, 1);
  assert.match(during.transition, /^opacity 500ms /);

  // Push moves both layers; the outgoing one leaves to the left, which is what
  // `<p:push dir="l"/>` does in PowerPoint.
  assert.equal(
    transitionLayerStyle('push', 'incoming', 'initial').transform,
    'translateX(100%)'
  );
  assert.equal(
    transitionLayerStyle('push', 'outgoing', 'active').transform,
    'translateX(-100%)'
  );

  // An instant style keeps no outgoing layer, so it has no styles to give.
  assert.deepEqual(transitionLayerStyle('cut', 'outgoing', 'active'), {});
});

test('an unknown value coerces to the default instead of throwing', () => {
  assert.equal(parseSlideTransition('wipe'), 'fade');
  assert.equal(parseSlideTransition('FADE'), 'fade');
  assert.equal(parseSlideTransition(''), 'fade');
  assert.equal(parseSlideTransition(null), 'fade');
  assert.equal(parseSlideTransition(undefined), 'fade');
  assert.equal(parseSlideTransition(7), 'fade');
  assert.equal(parseSlideTransition({ id: 'push' }), 'fade');

  assert.equal(isSlideTransition('push'), true);
  assert.equal(isSlideTransition('morph'), false);
});

test('a junk settings row falls back to fade and stays put', () => {
  const restore = getSetting(SETTING_KEY);
  try {
    setSetting(SETTING_KEY, 'glitter');
    assert.equal(getSlideTransition(), 'fade');
    // Reading must not rewrite the row: an administrator's typo is theirs to
    // see and fix, not something a page load silently launders.
    assert.equal(getSetting(SETTING_KEY), 'glitter');

    setSlideTransition('push');
    assert.equal(getSlideTransition(), 'push');
    assert.throws(() => setSlideTransition('morph'), /slide_transition/);
    assert.equal(getSlideTransition(), 'push');
  } finally {
    if (restore === null) setSetting(SETTING_KEY, DEFAULT_SLIDE_TRANSITION);
    else setSetting(SETTING_KEY, restore);
  }
});

// The unconfigured default is asserted against a real archive in
// `pptx-media-dedup.test.mjs`, which already generates one; a deck here costs
// about five seconds, so the two below are the ones that earn their keep.
test('the configured style is the element that lands, and opt-out slides get none', async () => {
  const restore = getSetting(SETTING_KEY);
  try {
    setSlideTransition('push');

    const plan = buildSlidePlan('2026-07-11', parsed, media);
    const optedOut = plan.filter((item) => item.fade === false).length;
    assert.ok(optedOut > 0, 'the fixture must exercise the per-slide opt-out');

    const zip = await JSZip.loadAsync(
      await generatePptx('2026-07-11', parsed, media)
    );
    const parts = slideParts(zip);
    assert.equal(parts.length, plan.length);

    for (const [i, name] of parts.entries()) {
      const xml = await zip.file(name).async('string');
      if (plan[i].fade === false) {
        assert.ok(
          !xml.includes('<p:transition'),
          `${name} opted out but carries a transition`
        );
        continue;
      }
      assert.ok(
        xml.includes('<p:transition spd="med"><p:push dir="l"/></p:transition>'),
        `${name} is missing the configured push`
      );
      for (const other of ['<p:fade/>', '<p:cut/>', '<p:dissolve/>']) {
        assert.ok(!xml.includes(other), `${name} also carries ${other}`);
      }
    }
  } finally {
    if (restore === null) setSetting(SETTING_KEY, DEFAULT_SLIDE_TRANSITION);
    else setSetting(SETTING_KEY, restore);
  }
});

test('none writes no transition element at all', async () => {
  const zip = await JSZip.loadAsync(
    await generatePptx('2026-07-11', parsed, media, 'none')
  );
  for (const name of slideParts(zip)) {
    const xml = await zip.file(name).async('string');
    assert.ok(!xml.includes('<p:transition'), `${name} should carry nothing`);
  }
});
