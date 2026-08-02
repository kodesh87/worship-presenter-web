/**
 * AD-25's closure: corpus tables are written only on the boot path, and no
 * corpus read path filters by locale in SQL.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbIndexPath = path.join(repoRoot, 'src', 'lib', 'db', 'index.ts');
const dbIndexRel = 'src/lib/db/index.ts';

const CORPUS_TABLE_ALLOWLIST = new Set([
  'bible_translations',
  'bible_books',
  'bible_verses',
  'hymns',
]);

const ddlText = fs.readFileSync(dbIndexPath, 'utf8');
const ddlTables = [
  ...ddlText.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g),
].map((m) => m[1]);

const corpusTables = ddlTables.filter((name) => CORPUS_TABLE_ALLOWLIST.has(name));

test('startup DDL names every corpus table this guard watches', () => {
  assert.deepEqual(corpusTables.sort(), [...CORPUS_TABLE_ALLOWLIST].sort());
});

const readPaths = [
  'src/lib/corpus.ts',
  'src/lib/scripture.ts',
  'src/lib/db/index.ts',
];

function walkSrcFiles() {
  const files = [];
  const walk = (absDir) => {
    for (const entry of fs.readdirSync(absDir)) {
      const abs = path.join(absDir, entry);
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) {
        walk(abs);
        continue;
      }
      if (/\.(ts|tsx)$/.test(entry)) files.push(abs);
    }
  };
  walk(path.join(repoRoot, 'src'));
  return files;
}

/**
 * The block-comment arm needs its closing `\/`: without it the pattern compiles
 * as `\/\*[\s\S]*?\*`, which eats `/**` and leaves the comment body behind — so a
 * JSDoc line describing a corpus write read as a corpus write.
 */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('no corpus table is written outside the boot module', () => {
  const offenders = [];
  const writePattern = (table) =>
    new RegExp(
      `\\b(?:INSERT\\s+(?:OR\\s+\\w+\\s+)?INTO\\s+${table}\\b|UPDATE\\s+${table}\\b|DELETE\\s+FROM\\s+${table}\\b)`,
      'i'
    );
  for (const abs of walkSrcFiles()) {
    const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
    if (rel === dbIndexRel) continue;
    const code = stripComments(fs.readFileSync(abs, 'utf8'));
    for (const table of corpusTables) {
      if (writePattern(table).test(code)) offenders.push(`${rel} writes ${table}`);
    }
  }
  assert.deepEqual(offenders, []);
});

/**
 * Story 21.2 AC-13: exactly one bible corpus ships until Story 21.4 arbitrates
 * `bible_books`. Parameterising the emptiness guard armed AD-27's two-owner
 * hazard — `name` / `short_name` are per-translation values in a table holding
 * one global row per book, so the translation reconciling last owns every book
 * name for every reader. A second committed corpus fires it.
 *
 * Tracked files, not `discoverBibleTranslationFiles()`: an operator installing a
 * translation is a file drop by design (AC-3) and must not fail this suite, and
 * `tests/corpus-reconcile.test.mjs` stages an untracked sidecar corpus in a
 * parallel process while this runs.
 */
test('exactly one bible corpus is committed until Story 21.4 (AC-13)', () => {
  const tracked = execFileSync(
    'git',
    ['ls-files', '--', 'data/*/bible-translation/*.json'],
    { cwd: repoRoot, encoding: 'utf8' }
  )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  assert.deepEqual(
    tracked,
    ['data/en/bible-translation/kjv.json'],
    'a second committed corpus arms AD-27: whichever translation reconciles ' +
      'last owns every bible_books name. Land Story 21.4 first, then update ' +
      'this expectation in the same change set'
  );
});

test('corpus read paths carry no locale predicate in SQL', () => {
  const offenders = [];
  const localePredicate =
    /WHERE[\s\S]*?\blocale\b\s*(=|LIKE|IN\b|<>|!=)/i;
  for (const rel of readPaths) {
    const code = stripComments(fs.readFileSync(path.join(repoRoot, rel), 'utf8'));
    if (localePredicate.test(code)) offenders.push(rel);
  }
  assert.deepEqual(offenders, []);
});
