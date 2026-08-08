/**
 * Artifact admin boundary helpers without Next.js route imports.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'artifacts-api-test-'));
process.env.DB_PATH = path.join(tmp, 'test.db');

const { getDb } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'db', 'index.ts')).href
);
const {
  getArtifactTemplate,
  updateArtifactTemplate,
  RegistryNotFoundError,
} = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'store.ts')).href
);
const { RegistryValidationError } = await import(
  pathToFileURL(path.join(root, 'src', 'lib', 'registry', 'validate.ts')).href
);

test('unknown template read returns null', () => {
  const db = getDb();
  assert.equal(getArtifactTemplate(db, 'missing-template'), null);
});

test('unknown template update returns not found', () => {
  const db = getDb();
  assert.throws(
    () =>
      updateArtifactTemplate(
        db,
        'missing-template',
        {
          schemaVersion: 1,
          id: 'missing-template',
          label: 'Missing',
          baseType: 'general',
          placeholders: [],
          layouts: {
            default: {
              aspectRatio: '16:9',
              backgroundColor: '#000000',
              elements: [],
            },
          },
        },
        new Date().toISOString()
      ),
    RegistryNotFoundError
  );
});

test('invalid template payload is rejected before persistence', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const { updatedAt } = welcome;
  assert.throws(
    () =>
      updateArtifactTemplate(
        db,
        'welcome',
        { ...welcome, unknownField: true },
        updatedAt
      ),
    RegistryValidationError
  );
  const unchanged = getArtifactTemplate(db, 'welcome');
  assert.equal(unchanged?.updatedAt, updatedAt);
});

test('PUT refuses to change a row kind against its persisted state', () => {
  const db = getDb();
  const welcome = getArtifactTemplate(db, 'welcome');
  assert.ok(welcome);
  const { updatedAt, ...body } = welcome;
  assert.throws(
    () =>
      updateArtifactTemplate(
        db,
        'welcome',
        { ...body, baseType: 'song-set' },
        updatedAt
      ),
    (err) =>
      err instanceof RegistryValidationError &&
      err.message === 'baseType cannot be changed'
  );
  const after = getArtifactTemplate(db, 'welcome');
  assert.equal(after?.baseType, 'general');
  assert.equal(after?.updatedAt, welcome.updatedAt);
});
