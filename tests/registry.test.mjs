/**
 * Artifact registry persistence, validation, seed, and concurrency.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const {
  getArtifactTemplate,
  updateArtifactTemplate,
  resetArtifactTemplate,
  RegistryStaleError,
  RegistryNotFoundError,
  listArtifactSummaries,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'store.ts')).href
);
const { seedArtifactRegistry, getSeedTemplateById, loadSeedTemplates } =
  await import(
    pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'seed.ts')).href
  );
const { validateArtifactTemplate, RegistryValidationError } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'validate.ts')).href
);

test('getSeedTemplateById throws RegistryNotFoundError for missing seed', () => {
  assert.throws(() => getSeedTemplateById('not-in-seed-ever'), RegistryNotFoundError);
});

test('update rejects templates missing from seed file', () => {
  const db = getDb();
  const orphan = {
    schemaVersion: 1,
    id: 'orphan-db-only',
    label: 'Orphan',
    baseType: 'general',
    placeholders: [],
    layouts: {
      default: {
        aspectRatio: '16:9',
        backgroundColor: '#000000',
        elements: [],
      },
    },
  };
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO artifact_templates (id, label, base_type, payload, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(orphan.id, orphan.label, orphan.baseType, JSON.stringify(orphan), now);

  assert.throws(
    () => updateArtifactTemplate(db, orphan.id, orphan, now),
    RegistryNotFoundError
  );
});

test('registry seed loads validated templates', () => {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) AS n FROM artifact_templates').get().n;
  assert.ok(count >= 28);
  const summaries = listArtifactSummaries(db);
  assert.ok(summaries.some((item) => item.id === 'welcome'));
  assert.ok(summaries.some((item) => item.id === 'song-set' && !item.editable));
});

test('a startup seeding pass preserves an administrator-edited template', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const layout = welcome.layouts.default;
  assert.ok(layout);
  const { updatedAt, ...body } = welcome;
  const mutated = {
    ...body,
    layouts: {
      ...body.layouts,
      default: {
        ...layout,
        elements: layout.elements.map((element) =>
          element.id === 'e1' ? { ...element, x: element.x + 2.5 } : element
        ),
      },
    },
  };
  updateArtifactTemplate(db, 'welcome', mutated, updatedAt);
  seedArtifactRegistry(db);
  const reloaded = getArtifactTemplate(db, 'welcome');
  assert.ok(reloaded);
  const moved = reloaded.layouts.default?.elements.find((e) => e.id === 'e1');
  assert.ok(moved);
  assert.ok(Math.abs(moved.x - (layout.elements.find((e) => e.id === 'e1')?.x ?? 0) - 2.5) < 0.01);
});

test('registry rejects stale updates', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const { updatedAt, ...body } = welcome;
  assert.throws(
    () => updateArtifactTemplate(db, 'welcome', body, 'stale-timestamp'),
    RegistryStaleError
  );
});

test('registry reset restores one template from seed', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const { updatedAt, ...body } = welcome;
  const layout = welcome.layouts.default;
  assert.ok(layout);
  const mutated = {
    ...body,
    layouts: {
      ...body.layouts,
      default: {
        ...layout,
        elements: layout.elements.map((element) =>
          element.id === 'e1' ? { ...element, x: 99 } : element
        ),
      },
    },
  };
  const saved = updateArtifactTemplate(db, 'welcome', mutated, updatedAt);
  const seed = getSeedTemplateById('welcome');
  const reset = resetArtifactTemplate(db, 'welcome', seed, saved.updatedAt);
  const seedElement = reset.layouts.default?.elements.find((e) => e.id === 'e1');
  const originalSeedElement = seed.layouts.default?.elements.find((e) => e.id === 'e1');
  assert.equal(seedElement?.x, originalSeedElement?.x);
});

test('validator rejects unknown template fields', () => {
  const templates = loadSeedTemplates();
  const welcome = templates.find((t) => t.id === 'welcome');
  assert.ok(welcome);
  assert.throws(
    () => validateArtifactTemplate({ ...welcome, extraField: true }),
    RegistryValidationError
  );
});

test('read-only templates reject mutation', () => {
  const db = getDb();
  const songSet = getArtifactTemplate(db, 'song-set');
  assert.ok(songSet);
  const { updatedAt, ...body } = songSet;
  assert.throws(
    () => updateArtifactTemplate(db, 'song-set', body, updatedAt),
    RegistryValidationError
  );
});

test('save cannot remove seeded element ids', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const { updatedAt, ...body } = welcome;
  const layout = welcome.layouts.default;
  assert.ok(layout);
  const stripped = {
    ...body,
    layouts: {
      ...body.layouts,
      default: { ...layout, elements: [] },
    },
  };
  assert.throws(
    () => updateArtifactTemplate(db, 'welcome', stripped, updatedAt),
    RegistryValidationError
  );
});

/** Story 16.5 — canvas element authoring stability rules. */

function withDefaultElements(template, elements) {
  const { updatedAt, ...body } = template;
  return {
    ...body,
    layouts: {
      ...body.layouts,
      default: { ...template.layouts.default, elements },
    },
  };
}

function userElement(id, overrides = {}) {
  return {
    id,
    type: 'shape',
    required: false,
    x: 10,
    y: 12,
    w: 20,
    h: 15,
    zIndex: 9,
    style: { fillColor: '#123456', opacity: 1 },
    ...overrides,
  };
}

test('save can add a new element to an editable template', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const seedCount = welcome.layouts.default.elements.length;
  const payload = withDefaultElements(welcome, [
    ...welcome.layouts.default.elements,
    userElement('usr-added-shape'),
  ]);

  const saved = updateArtifactTemplate(db, 'welcome', payload, welcome.updatedAt);
  assert.equal(saved.layouts.default.elements.length, seedCount + 1);
  const added = saved.layouts.default.elements.find(
    (e) => e.id === 'usr-added-shape'
  );
  assert.ok(added);
  assert.equal(added.type, 'shape');
  assert.equal(added.style.fillColor, '#123456');
  assert.notEqual(saved.updatedAt, welcome.updatedAt);

  const reloaded = getArtifactTemplate(db, 'welcome');
  assert.ok(
    reloaded.layouts.default.elements.some((e) => e.id === 'usr-added-shape')
  );
});

test('save can delete a previously added non-seed element', () => {
  const db = getDb();
  const before = getArtifactTemplate(db, 'welcome');
  assert.ok(before);

  // Seed this case's own precondition instead of inheriting the element added
  // by a sibling case, so the file stays runnable in any order / in isolation.
  const withElement = updateArtifactTemplate(
    db,
    'welcome',
    withDefaultElements(before, [
      ...before.layouts.default.elements,
      userElement('usr-deletable-shape'),
    ]),
    before.updatedAt
  );
  assert.ok(
    withElement.layouts.default.elements.some(
      (e) => e.id === 'usr-deletable-shape'
    )
  );

  const payload = withDefaultElements(
    withElement,
    withElement.layouts.default.elements.filter(
      (e) => e.id !== 'usr-deletable-shape'
    )
  );
  const saved = updateArtifactTemplate(
    db,
    'welcome',
    payload,
    withElement.updatedAt
  );
  assert.ok(
    !saved.layouts.default.elements.some((e) => e.id === 'usr-deletable-shape')
  );
  assert.ok(saved.layouts.default.elements.some((e) => e.id === 'e1'));
});

test('save rejecting a seeded element removal leaves the row unchanged', () => {
  const db = getDb();
  const before = getArtifactTemplate(db, 'welcome');
  assert.ok(before);
  const payload = withDefaultElements(
    before,
    before.layouts.default.elements.filter((e) => e.id !== 'e1')
  );

  assert.throws(
    () => updateArtifactTemplate(db, 'welcome', payload, before.updatedAt),
    (err) =>
      err instanceof RegistryValidationError && /\be1\b/.test(err.message)
  );
  assert.deepEqual(getArtifactTemplate(db, 'welcome'), before);
});

test('save cannot flip a seeded element required flag', () => {
  const db = getDb();
  const before = getArtifactTemplate(db, 'welcome');
  assert.ok(before);
  const seeded = before.layouts.default.elements.find((e) => e.id === 'e1');
  assert.ok(seeded);
  assert.equal(seeded.required, false, 'e1 ships as optional');

  const payload = withDefaultElements(
    before,
    before.layouts.default.elements.map((e) =>
      e.id === 'e1' ? { ...e, required: true } : e
    )
  );

  assert.throws(
    () => updateArtifactTemplate(db, 'welcome', payload, before.updatedAt),
    (err) =>
      err instanceof RegistryValidationError &&
      /\be1\b/.test(err.message) &&
      /required/.test(err.message)
  );
  assert.deepEqual(getArtifactTemplate(db, 'welcome'), before);

  // The same save minus the flag flip is still accepted, so the guard is not
  // simply freezing seeded elements.
  const moved = updateArtifactTemplate(
    db,
    'welcome',
    withDefaultElements(
      before,
      before.layouts.default.elements.map((e) =>
        e.id === 'e1' ? { ...e, x: e.x + 1 } : e
      )
    ),
    before.updatedAt
  );
  assert.equal(
    moved.layouts.default.elements.find((e) => e.id === 'e1').required,
    false
  );
});

test('save cannot delete a required element', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const withRequired = updateArtifactTemplate(
    db,
    'welcome',
    withDefaultElements(welcome, [
      ...welcome.layouts.default.elements,
      userElement('usr-required-shape', { required: true }),
    ]),
    welcome.updatedAt
  );
  assert.ok(
    withRequired.layouts.default.elements.some(
      (e) => e.id === 'usr-required-shape' && e.required
    )
  );

  const stripped = withDefaultElements(
    withRequired,
    withRequired.layouts.default.elements.filter(
      (e) => e.id !== 'usr-required-shape'
    )
  );
  assert.throws(
    () => updateArtifactTemplate(db, 'welcome', stripped, withRequired.updatedAt),
    (err) =>
      err instanceof RegistryValidationError &&
      /usr-required-shape/.test(err.message)
  );
  assert.deepEqual(getArtifactTemplate(db, 'welcome'), withRequired);

  // restore the shipped seed so later cases start clean
  resetArtifactTemplate(
    db,
    'welcome',
    getSeedTemplateById('welcome'),
    withRequired.updatedAt
  );
});

test('save rejects duplicate element ids within one layout', () => {
  const db = getDb();
  const before = getArtifactTemplate(db, 'welcome');
  assert.ok(before);
  const payload = withDefaultElements(before, [
    ...before.layouts.default.elements,
    { ...before.layouts.default.elements[0] },
  ]);

  assert.throws(
    () => updateArtifactTemplate(db, 'welcome', payload, before.updatedAt),
    (err) =>
      err instanceof RegistryValidationError && /Duplicate element id/.test(err.message)
  );
  assert.deepEqual(getArtifactTemplate(db, 'welcome'), before);
});

test('save cannot add elements to read-only templates', () => {
  const db = getDb();
  for (const [id, layoutKey] of [
    ['song-set', 'title'],
    ['announcement-flyer', 'default'],
    ['sermon-flyer', 'default'],
  ]) {
    const before = getArtifactTemplate(db, id);
    assert.ok(before, `expected seeded template ${id}`);
    const { updatedAt, ...body } = before;
    const layout = before.layouts[layoutKey];
    assert.ok(layout, `expected layout ${layoutKey} on ${id}`);
    const payload = {
      ...body,
      layouts: {
        ...body.layouts,
        [layoutKey]: {
          ...layout,
          elements: [...layout.elements, userElement(`usr-${id}-shape`)],
        },
      },
    };

    assert.throws(
      () => updateArtifactTemplate(db, id, payload, updatedAt),
      RegistryValidationError,
      `${id} must reject element authoring`
    );
    assert.deepEqual(getArtifactTemplate(db, id), before);
  }
});

test('stale updatedAt on a valid element add still returns 409 path', () => {
  const db = getDb();
  const before = getArtifactTemplate(db, 'welcome');
  assert.ok(before);
  const payload = withDefaultElements(before, [
    ...before.layouts.default.elements,
    userElement('usr-stale-shape'),
  ]);

  assert.throws(
    () => updateArtifactTemplate(db, 'welcome', payload, 'stale-timestamp'),
    RegistryStaleError
  );
  assert.deepEqual(getArtifactTemplate(db, 'welcome'), before);
});

test('seed bundled assets exist on disk', () => {
  const templates = loadSeedTemplates();
  for (const template of templates) {
    for (const layout of Object.values(template.layouts)) {
      if (!layout?.backgroundImage) continue;
      const file = path.join(
        root,
        'public',
        layout.backgroundImage.replace(/^\//, '')
      );
      assert.ok(fs.existsSync(file), `Missing asset for ${template.id}: ${file}`);
    }
  }
});
