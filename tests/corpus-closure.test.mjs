/**
 * AD-25's closure: corpus tables are written only on the boot path, and no
 * corpus read path filters by locale in SQL.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
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

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*/g, '')
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
