// tests/bmad-auto-run-skill.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const DIR = '.claude/skills/bmad-auto-run';
const read = (f) => readFileSync(`${DIR}/${f}`, 'utf8');
const mdFiles = () => readdirSync(DIR).filter((f) => f.endsWith('.md'));

const GUARD_CMD =
  'node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs';

test('the skill exists and declares its own name', () => {
  assert.ok(existsSync(`${DIR}/SKILL.md`), 'SKILL.md is missing');
  assert.match(read('SKILL.md'), /^---\nname: bmad-auto-run\n/);
});

test('every step file is referenced, and every reference exists', () => {
  const skill = read('SKILL.md');
  for (const f of mdFiles()) {
    if (f === 'SKILL.md') continue;
    assert.ok(skill.includes(f), `${f} exists but SKILL.md never references it`);
  }
  for (const ref of skill.match(/(?:step-\d\d-[a-z-]+|dispatch-recipes)\.md/g) ?? []) {
    assert.ok(existsSync(`${DIR}/${ref}`), `SKILL.md references missing ${ref}`);
  }
});

test('no skill file hardcodes a model id or a vendor flag', () => {
  const banned =
    /gemini-\d|gpt-5|composer-\d|claude-(?:sonnet|opus|haiku)-\d|--permission-mode|--dangerously-|model_reasoning_effort/;
  for (const f of mdFiles()) {
    const hit = read(f).match(banned);
    assert.equal(hit, null, `${f} hardcodes ${hit?.[0]} instead of referencing the dispatch tables`);
  }
});

test('the guard command is quoted verbatim from AGENTS.md', () => {
  assert.ok(readFileSync('AGENTS.md', 'utf8').includes(GUARD_CMD), 'AGENTS.md changed the guard command');
  const gate = mdFiles().map(read).join('\n');
  assert.ok(gate.includes(GUARD_CMD), 'no skill file runs the guard command verbatim');
});

test('the skill and the design record agree on seven escalations', () => {
  // Bound the section at the next heading, or a numbered list further down inflates the count.
  const section = (text) => (text.split(/^## Escalation.*$/m)[1] ?? '').split(/^## /m)[0];
  const count = (text) => (section(text).match(/^\s*[1-7]\. /gm) ?? []).length;
  assert.equal(count(read('SKILL.md')), 7, 'SKILL.md does not list exactly seven escalation conditions');
  const design = readFileSync('docs/bmad-auto-run-design.md', 'utf8');
  assert.equal(count(design), 7, 'the design record no longer lists seven escalation conditions');
});

test('the test registers itself in npm test', () => {
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(scripts.test.includes('tests/bmad-auto-run-skill.test.mjs'), 'not registered in npm test');
});
