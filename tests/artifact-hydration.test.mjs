/**
 * Artifact hydration: placeholder resolution, defaults, omission, failures,
 * and parity between the hierarchical artifact plan and the flat slide plan.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-hydration-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
delete process.env.IMAGE_URL_ALLOWLIST;

const srcUrl = (...parts) =>
  pathToFileURL(path.join(root, 'src', ...parts)).href;

const {
  ARTIFACT_RUNTIME_VERSION,
  REFERENCE_CANVAS,
  ArtifactHydrationError,
  assertRuntimeVersion,
  flattenArtifactPlan,
} = await import(srcUrl('lib', 'artifacts', 'runtime-contract.ts'));
const { hydrateArtifact, hydrateArtifactFromSnapshot } = await import(
  srcUrl('lib', 'artifacts', 'hydrate.ts')
);
const { loadRegistrySnapshot } = await import(
  srcUrl('lib', 'artifacts', 'registry-snapshot.ts')
);
const { loadSeedTemplates } = await import(srcUrl('lib', 'registry', 'seed.ts'));
const { parseRundown } = await import(srcUrl('lib', 'parser.ts'));
const { buildArtifactPlan, buildSlidePlan } = await import(
  srcUrl('lib', 'slide-plan.ts')
);

const seeds = new Map(loadSeedTemplates().map((t) => [t.id, t]));
const seed = (id) => {
  const found = seeds.get(id);
  assert.ok(found, `missing seed template ${id}`);
  return found;
};

const sample = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'sample-rundown.txt'),
  'utf8'
);

test('reference canvas and runtime version are pinned', () => {
  assert.equal(ARTIFACT_RUNTIME_VERSION, 1);
  assert.deepEqual({ ...REFERENCE_CANVAS }, { width: 960, height: 540 });
});

test('fixed content and background hydrate; absent optional date is omitted', () => {
  const instance = hydrateArtifact(seed('welcome'), { instanceId: 'welcome' });

  assert.equal(instance.runtimeVersion, ARTIFACT_RUNTIME_VERSION);
  assert.equal(instance.templateId, 'welcome');
  assert.equal(instance.baseType, 'text-placeholder');
  assert.equal(instance.layoutKey, 'default');
  assert.equal(instance.layout.aspectRatio, '16:9');
  assert.equal(instance.layout.backgroundImage, '/assets/welcome-bg.png');
  assert.equal(instance.layout.elements.length, 2);
  assert.deepEqual(
    instance.layout.elements.map((e) => e.text),
    ['Welcome to', 'BANDUNG INTERNATIONAL COMMUNITY']
  );
  assert.ok(instance.layout.elements.every((e) => e.placeholderKey === undefined));
  assert.doesNotThrow(() => assertRuntimeVersion(instance));
});

test('welcome renders the service date when one is supplied', () => {
  const instance = hydrateArtifact(seed('welcome'), {
    instanceId: 'welcome',
    values: { date: '2026-07-11' },
  });
  const date = instance.layout.elements.find((e) => e.placeholderKey === 'date');
  assert.ok(date, 'welcome must bind an element to the date placeholder');
  assert.equal(date.text, '2026-07-11');
});

test('placeholder elements resolve; fixed elements keep their content', () => {
  const instance = hydrateArtifact(seed('sermon'), {
    instanceId: 'sermon',
    values: { title: 'Living Water', speaker: 'Ps. Doe' },
  });

  const byKey = Object.fromEntries(
    instance.layout.elements
      .filter((e) => e.placeholderKey)
      .map((e) => [e.placeholderKey, e.text])
  );
  assert.deepEqual(byKey, { title: 'Living Water', speaker: 'Ps. Doe' });

  // The citation slot must carry the *rundown's* reference — never a baked-in
  // sample citation (that silently printed the wrong verse every week).
  const verse = hydrateArtifact(seed('verse-reading'), {
    instanceId: 'verse-reading',
    values: { reference: 'Rom 1:1', text: 'Paul, a servant.' },
  });
  const citation = verse.layout.elements.find((e) => e.id === 'e3');
  assert.equal(citation.placeholderKey, 'reference');
  assert.equal(citation.text, 'Rom 1:1');
  assert.ok(
    verse.layout.elements.every(
      (e) => typeof e.text !== 'string' || !e.text.includes('1 Corinthians 1:10')
    ),
    'verse-reading must not carry a hard-coded citation'
  );
});

test('required-with-default placeholders fall back to the seed default', () => {
  const instance = hydrateArtifact(seed('bible-verse-contemplation'), {
    instanceId: 'theme-verse',
  });

  const reference = instance.layout.elements.find(
    (e) => e.placeholderKey === 'reference'
  );
  const text = instance.layout.elements.find((e) => e.placeholderKey === 'text');
  assert.equal(reference.text, 'John 4:23');
  assert.match(text.text, /true worshipers/);
  assert.equal(instance.baseType, 'text-placeholder');
});

test('optional placeholder absent omits the element', () => {
  const withLabel = hydrateArtifact(seed('song-set'), {
    instanceId: 'bt-opening-lyric-1',
    layoutKey: 'lyric',
    values: { label: 'Verse 1', lyrics: 'line one\nline two' },
  });
  assert.equal(withLabel.layout.elements.length, 2);

  const withoutLabel = hydrateArtifact(seed('song-set'), {
    instanceId: 'bt-opening-lyric-2',
    layoutKey: 'lyric',
    values: { lyrics: 'line one' },
  });
  assert.equal(withoutLabel.layout.elements.length, 1);
  assert.equal(withoutLabel.layout.elements[0].placeholderKey, 'lyrics');
  assert.equal(withoutLabel.layout.elements[0].text, 'line one');
});

test('required element without a value throws ArtifactHydrationError', () => {
  assert.throws(
    () => hydrateArtifact(seed('sermon-flyer'), { instanceId: 'sermon-graphic' }),
    (err) => {
      assert.ok(err instanceof ArtifactHydrationError);
      assert.equal(err.instanceId, 'sermon-graphic');
      assert.equal(err.templateId, 'sermon-flyer');
      assert.equal(err.placeholderKey, 'imageUrl');
      assert.match(err.message, /instance=sermon-graphic/);
      return true;
    }
  );
});

test('array placeholder resolves to the first URL; empty array + required throws', () => {
  const instance = hydrateArtifact(seed('announcement-flyer'), {
    instanceId: 'flyer-0',
    values: { imageUrl: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'] },
  });
  assert.equal(
    instance.layout.elements[0].imageUrl,
    'https://cdn.example.com/a.jpg'
  );

  assert.throws(
    () =>
      hydrateArtifact(seed('announcement-flyer'), {
        instanceId: 'flyer-1',
        values: { imageUrl: [] },
      }),
    ArtifactHydrationError
  );
});

test('text[] joins on newline and empty string counts as supplied', () => {
  const template = {
    schemaVersion: 1,
    id: 'synthetic-lines',
    label: 'Synthetic',
    baseType: 'text-placeholder',
    placeholders: [
      { key: 'lines', type: 'text[]', required: true },
      { key: 'note', type: 'text', required: true, defaultValue: 'fallback' },
    ],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [
          {
            id: 'a',
            type: 'text',
            required: false,
            x: 0,
            y: 0,
            w: 50,
            h: 10,
            zIndex: 0,
            placeholderKey: 'lines',
          },
          {
            id: 'b',
            type: 'text',
            required: false,
            x: 0,
            y: 20,
            w: 50,
            h: 10,
            zIndex: 0,
            placeholderKey: 'note',
          },
        ],
      },
    },
  };

  const instance = hydrateArtifact(template, {
    instanceId: 'synthetic-1',
    values: { lines: ['one', 'two', 'three'], note: '' },
  });
  assert.equal(instance.layout.elements[0].text, 'one\ntwo\nthree');
  // Empty string is a supplied value, so the default must NOT be applied.
  assert.equal(instance.layout.elements[1].text, '');
});

test('elements come out sorted by zIndex then source order', () => {
  const template = {
    schemaVersion: 1,
    id: 'synthetic-order',
    label: 'Order',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [
          { id: 'z2-a', type: 'text', required: false, x: 0, y: 0, w: 1, h: 1, zIndex: 2, content: 'c' },
          { id: 'z0', type: 'text', required: false, x: 0, y: 0, w: 1, h: 1, zIndex: 0, content: 'a' },
          { id: 'z2-b', type: 'text', required: false, x: 0, y: 0, w: 1, h: 1, zIndex: 2, content: 'd' },
          { id: 'z1', type: 'text', required: false, x: 0, y: 0, w: 1, h: 1, zIndex: 1, content: 'b' },
        ],
      },
    },
  };

  const instance = hydrateArtifact(template, { instanceId: 'order-1' });
  assert.deepEqual(
    instance.layout.elements.map((e) => e.id),
    ['z0', 'z1', 'z2-a', 'z2-b']
  );
});

test('off-canvas geometry survives hydration unclamped', () => {
  const instance = hydrateArtifact(seed('family-youth'), {
    instanceId: 'family-youth',
    values: { familyText: 'F', youthText: 'Y' },
  });
  const offCanvas = instance.layout.elements.find((e) => e.id === 'e4');
  assert.equal(offCanvas.x, -14.44);
  assert.ok(instance.layout.elements.every((e) => e.type !== 'image-placeholder'));
});

test('unknown layout key and unknown template id throw', () => {
  assert.throws(
    () => hydrateArtifact(seed('welcome'), { instanceId: 'welcome', layoutKey: 'lyric' }),
    (err) => {
      assert.ok(err instanceof ArtifactHydrationError);
      assert.equal(err.layoutKey, 'lyric');
      return true;
    }
  );

  const snapshot = loadRegistrySnapshot();
  assert.throws(
    () =>
      hydrateArtifactFromSnapshot(snapshot, {
        instanceId: 'nope',
        templateId: 'does-not-exist',
      }),
    (err) => {
      assert.ok(err instanceof ArtifactHydrationError);
      assert.match(err.message, /Unknown artifact template/);
      return true;
    }
  );
});

test('registry snapshot covers every seeded template exactly once', () => {
  const snapshot = loadRegistrySnapshot();
  for (const id of seeds.keys()) {
    assert.ok(snapshot.has(id), `snapshot missing ${id}`);
  }
  assert.ok(snapshot.size >= seeds.size);
});

test('buildArtifactPlan flattens to the same order as buildSlidePlan', () => {
  const parsed = parseRundown(sample);
  const media = { flyers: ['https://cdn.example.com/a.jpg'] };

  const nodes = buildArtifactPlan('2026-07-11', parsed, media);
  const plan = buildSlidePlan('2026-07-11', parsed, media);

  assert.deepEqual(
    flattenArtifactPlan(nodes).map((i) => i.instanceId),
    plan.map((s) => s.id)
  );

  for (const item of plan) {
    assert.ok(item.artifact, `slide ${item.id} carries no artifact`);
    assert.equal(item.artifact.instanceId, item.id);
    assert.equal(item.artifact.runtimeVersion, ARTIFACT_RUNTIME_VERSION);
    assert.ok(seeds.has(item.artifact.templateId));
    // JSON-serializable: server pages hand these to client components.
    assert.deepEqual(
      JSON.parse(JSON.stringify(item.artifact)),
      item.artifact
    );
  }
});

test('SongSets become one group node with ordered title/lyric children', () => {
  const parsed = parseRundown(sample);
  const nodes = buildArtifactPlan('2026-07-11', parsed, []);

  const groups = nodes.filter((n) => n.kind === 'group');
  assert.ok(groups.length > 0);

  const btOpening = groups.find((g) => g.id === 'bt-opening');
  assert.ok(btOpening);
  assert.equal(btOpening.children[0].instance.layoutKey, 'title');
  assert.equal(btOpening.children[0].instance.group.role, 'title');
  assert.equal(btOpening.children[0].instance.group.id, 'bt-opening');
  assert.ok(btOpening.children.length > 1);
  assert.ok(
    btOpening.children
      .slice(1)
      .every((c) => c.instance.layoutKey === 'lyric' && c.instance.group.role === 'lyric')
  );

  for (const group of groups) {
    assert.ok(
      group.children.every((c) => c.instance.templateId === 'song-set'),
      `group ${group.id} holds a non song-set child`
    );
  }

  // Standing intercessory pairs are lyric-only groups (no title slide).
  const intercessory = groups.find((g) => g.id === 'intercessory-671');
  assert.ok(intercessory);
  assert.ok(intercessory.children.every((c) => c.instance.layoutKey === 'lyric'));
});

test('standing Part C copy is registry-sourced', () => {
  const parsed = parseRundown(sample);
  const plan = buildSlidePlan('2026-07-11', parsed, []);

  for (const id of [
    'offering-tithe',
    'midweek-prayer',
    'fellowship-etiquette',
    'contact',
  ]) {
    const slide = plan.find((s) => s.id === id);
    assert.ok(slide, `missing ${id}`);
    assert.ok(slide.lines.every((l) => l.trim().length > 0));

    // Lines read top-to-bottom then left-to-right, and never repeat the title.
    const fromArtifact = slide.artifact.layout.elements
      .filter((e) => e.type === 'text' && typeof e.text === 'string')
      .map((e) => ({ x: e.x, y: e.y, text: e.text }))
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .flatMap((e) => e.text.split('\n'))
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== slide.title);
    assert.deepEqual(slide.lines, fromArtifact);
    assert.ok(!slide.lines.includes(slide.title), `${id} repeats its title`);
  }

  // Three of the four carry their copy as registry text.
  for (const id of ['offering-tithe', 'midweek-prayer', 'contact']) {
    const slide = plan.find((s) => s.id === id);
    assert.ok(slide.lines.length > 0, `${id} has no derived lines`);
  }

  // Fellowship Etiquette is the exception: the source deck hides its live text
  // box behind a later full-bleed picture, and `fellowship-bg.png` already
  // carries that sentence in its pixels. The registry element was removed for
  // deck parity, so the layout is background-only and derives no lines.
  const etiquette = plan.find((s) => s.id === 'fellowship-etiquette');
  assert.deepEqual(etiquette.lines, []);
  assert.equal(etiquette.artifact.layout.elements.length, 0);

  // Visual order, not z-order: the bank name sits above its account number.
  const offering = plan.find((s) => s.id === 'offering-tithe');
  assert.deepEqual(offering.lines, [
    'Bank Mandiri',
    '1234567890123',
    'Gereja Masehi Advent Hari Ketujuh BIC',
  ]);
});

test('theme verse default comes from the registry, weekly value overrides it', () => {
  const parsed = parseRundown(sample);
  parsed.themeVerse = null;
  const fallback = buildSlidePlan('2026-07-11', parsed, []).find(
    (s) => s.id === 'theme-verse'
  );
  assert.equal(fallback.subtitle, 'John 4:23');
  assert.match(fallback.body, /true worshipers/);
  assert.equal(fallback.artifact.templateId, 'bible-verse-contemplation');
  assert.equal(fallback.artifact.baseType, 'text-placeholder');

  const weekly = parseRundown(sample);
  weekly.themeVerse = { reference: 'Ps 23:1', text: 'The Lord is my shepherd.' };
  const overridden = buildSlidePlan('2026-07-11', weekly, []).find(
    (s) => s.id === 'theme-verse'
  );
  assert.equal(overridden.subtitle, 'Ps 23:1');
  assert.equal(overridden.body, 'The Lord is my shepherd.');
});

test('optional weekly media is omitted instead of failing hydration', () => {
  const parsed = parseRundown(sample);
  parsed.familyPrayerRequest = 'Pray for the Lees';
  parsed.youthPrayerRequest = null;
  parsed.familyYouth = null;

  const plan = buildSlidePlan('2026-07-11', parsed, {});
  const family = plan.find((s) => s.id === 'family-youth');
  assert.ok(family);
  assert.equal(family.imageUrl, undefined);
  assert.ok(
    family.artifact.layout.elements.every((e) => e.type !== 'image-placeholder')
  );
  assert.ok(
    family.artifact.layout.elements.some(
      (e) => e.placeholderKey === 'familyText' && e.text === 'Pray for the Lees'
    )
  );
  assert.ok(
    !family.artifact.layout.elements.some((e) => e.placeholderKey === 'youthText')
  );
});
