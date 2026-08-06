// tests/bmad-auto-run-skill.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const DIR = '.claude/skills/bmad-auto-run';
// Normalise newlines. This repository is cloned on Windows with core.autocrlf=true,
// so a fresh checkout hands these files back with CRLF and every anchored pattern
// below would fail on line endings rather than on content.
const read = (f) => readFileSync(`${DIR}/${f}`, 'utf8').replace(/\r\n/g, '\n');
const readRoot = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
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
  // Match any backticked bare filename. An allow-list of known prefixes goes blind
  // the moment a file is added under a new name — which is how it missed one.
  for (const [, ref] of skill.matchAll(/`([a-z][a-z0-9-]*\.md)`/g)) {
    assert.ok(existsSync(`${DIR}/${ref}`), `SKILL.md references missing ${ref}`);
  }
});

test('every backticked skill-file reference resolves, in every skill file', () => {
  // SKILL.md alone was checked before, so a step file could forward-reference a
  // filename nobody ever wrote — which is exactly what happened once.
  const refs = new Set();
  for (const f of mdFiles()) {
    for (const [, ref] of read(f).matchAll(/`([a-z][a-z0-9-]*\.md)`/g)) {
      refs.add(ref);
      assert.ok(existsSync(`${DIR}/${ref}`), `${f} references missing ${ref}`);
    }
  }
  // Proof the pattern matched real filenames rather than nothing: SKILL.md must
  // reference every other file in the directory, so the set cannot be smaller.
  assert.ok(
    refs.size >= mdFiles().length - 1,
    `only ${refs.size} references resolved across ${mdFiles().length} files — the pattern is matching nothing`,
  );
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
  assert.ok(readRoot('AGENTS.md').includes(GUARD_CMD), 'AGENTS.md changed the guard command');
  const gate = mdFiles().map(read).join('\n');
  assert.ok(gate.includes(GUARD_CMD), 'no skill file runs the guard command verbatim');
});

// Bound the section at the next heading, or a numbered list further down inflates the count.
const escalationSection = (text) => (text.split(/^## Escalation.*$/m)[1] ?? '').split(/^## /m)[0];
// One item per numbered line plus its indented continuations. The list ends at the
// first blank line after it, so trailing prose in either file cannot join condition 7.
const escalationItems = (text) => {
  const items = [];
  for (const line of escalationSection(text).split('\n')) {
    if (/^\s*[1-7]\. /.test(line)) items.push([line.trim()]);
    else if (!line.trim()) {
      if (items.length) break;
    } else if (items.length && /^\s+\S/.test(line)) items[items.length - 1].push(line.trim());
  }
  return items.map((lines) => lines.join(' ').replace(/\s+/g, ' '));
};

test('the skill and the design record agree on seven escalations', () => {
  assert.equal(escalationItems(read('SKILL.md')).length, 7, 'SKILL.md does not list exactly seven escalation conditions');
  const design = readRoot('docs/bmad-auto-run-design.md');
  assert.equal(escalationItems(design).length, 7, 'the design record no longer lists seven escalation conditions');
});

test('the seven conditions are worded identically in both files', () => {
  // The count matching is not enough: several files cite a condition by number,
  // so wording that drifts in one file silently redirects every citation.
  const skill = escalationItems(read('SKILL.md'));
  const design = escalationItems(readRoot('docs/bmad-auto-run-design.md'));
  assert.ok(skill.length > 0, 'no escalation conditions parsed out of SKILL.md');
  for (let i = 0; i < skill.length; i++) {
    assert.equal(skill[i], design[i], `condition ${i + 1} is worded differently in SKILL.md and the design record`);
  }
});

test('every scope mode the skill advertises can be recorded, and none falls through', () => {
  // A mode named with no journal value to hold it, or an argument list with no
  // rule against falling through, is the "state named, no branch" shape that
  // every serious defect on this branch turned out to be.
  const skill = read('SKILL.md');
  const enumLine = read('journal.md').match(/^mode: (\S+)/m);
  assert.ok(enumLine, 'journal.md declares no mode: enum');
  const modes = enumLine[1].split('|');
  assert.deepEqual(modes, ['full', 'dry-run', 'one-story', 'one-epic'], 'the mode enum changed');

  const frontmatter = skill.split(/^---$/m)[1] ?? '';
  const advertised = new Set([...frontmatter.matchAll(/`(one-story|one-epic|dry-run)`/g)].map((m) => m[1]));
  assert.equal(advertised.size, 3, `the description advertises ${advertised.size} scope modes, expected 3`);
  for (const m of advertised) assert.ok(modes.includes(m), `the description names ${m}, which the journal cannot record`);

  assert.match(skill, /MUST NOT fall through/, 'SKILL.md no longer forbids an unrecognised argument falling through');
  assert.match(skill, /stopped: scope reached|scope was reached/, 'SKILL.md no longer distinguishes a scope stop from an escalation');
});

test('the test registers itself in npm test', () => {
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(scripts.test.includes('tests/bmad-auto-run-skill.test.mjs'), 'not registered in npm test');
});
