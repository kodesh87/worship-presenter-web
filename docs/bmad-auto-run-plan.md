# bmad-auto-run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `bmad-auto-run` skill so the BMad cycle runs across stories and epics unattended, escalating only on the seven conditions in `docs/bmad-auto-run-design.md`.

**Architecture:** A thin coordinator dispatches every heavy step to an Orca terminal worker with explicit model/effort/unattended argv, keeps its own state in a committed journal so it survives compaction, and gates every commit on build + test + the public-repo guard. The deliverable is instruction files plus one structural test that fails when those files drift from this repo's rules.

**Tech Stack:** Markdown skill files under `.claude/skills/bmad-auto-run/`; `node:test` for the structural test; the `orca` CLI for dispatch; `gh` for PRs.

## Global Constraints

Every task's requirements implicitly include these. Values are verbatim.

- Skill instruction files MUST be written in English, MUST attach a normative keyword (MUST/MUST NOT/SHOULD/SHOULD NOT/MAY) to every instruction, and SHOULD stay under 200 lines per file.
- No skill file may contain a CLI model id or a vendor flag spelling. Routing MUST be resolved by reference to the Orca Agent Dispatch tables in the operator's global rules, which are loaded in every session. This is both the operator's no-duplication rule and the reason a public repository can hold this skill.
- The guard command, verbatim: `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
- The commit gate: `npm run build` green, `npm test` green, guard green, nothing forbidden staged. A guard failure stops the run; the guard MUST NOT be weakened.
- `.github/workflows/test.yml` triggers only on `push` to `main` and `pull_request` to `main`. A feature-branch push produces no CI signal, so the epic's draft PR MUST be opened after the epic's first commit.
- `npm test` has no auto-discovery: 44 test files are listed explicitly in `package.json`. A new test file MUST be added to that list.
- Escalation has exactly seven conditions. The count and wording MUST match `docs/bmad-auto-run-design.md`.
- Every worker MUST be created with `orca terminal create --command "<exact argv>"`, waited to `tui-idle`, then dispatched. `orchestration worker-start` MUST NOT be used: it exposes no model/effort/permission flag.
- `agy` workers MUST be dispatched without `--inject`, and their brief MUST carry `taskId`, `dispatchId`, and the exact `worker_done` command, delivered with `orca terminal send`.
- Journal path: `_bmad-output/implementation-artifacts/auto-run/<date>-journal.md`.

## File Structure

| File | Responsibility |
|---|---|
| `.claude/skills/bmad-auto-run/SKILL.md` | Activation, dry-run contract, journal schema, HALT + escalation protocol, step index |
| `.../step-01-preflight.md` | Read-only environment and baseline checks, once per run |
| `.../step-02-select-story.md` | Story selection from sprint-status, dependency skip |
| `.../step-03-story-cycle.md` | Dispatch create → validate → dev |
| `.../step-04-review-panel.md` | Five reviewers, adjudication, confirmation review, fix loop |
| `.../step-05-commit-gate.md` | Build/test/guard, journal write, commit, push |
| `.../step-06-epic-boundary.md` | Branch and draft PR lifecycle, CI watch, next epic |
| `.../dispatch-recipes.md` | How to assemble worker argv and dispatch by role, without naming models |
| `tests/bmad-auto-run-skill.test.mjs` | Fails when the skill drifts from the constraints above |
| `package.json` | Register the new test |

---

### Task 1: Structural test, and the skill's spine

**Files:**
- Create: `tests/bmad-auto-run-skill.test.mjs`
- Create: `.claude/skills/bmad-auto-run/SKILL.md`
- Create: `.claude/skills/bmad-auto-run/step-01-preflight.md`
- Modify: `package.json` (the `test` script)

**Interfaces:**
- Produces: the journal schema every later step writes; the `phase` enum `selected|created|validated|developed|reviewed|committed|skipped|escalated`; the step-index convention that the test enforces.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs`
Expected: FAIL — `SKILL.md is missing`.

- [ ] **Step 3: Write `SKILL.md`**

Frontmatter `name: bmad-auto-run` and a description naming the trigger. Then, each as normative instructions:

- **Invocation.** The only entry point is `/bmad-auto-run`, optionally with `dry-run`. The operator MUST NOT have to invoke the `orchestration` skill first, and this skill MUST NOT invoke it either: that skill is a discovery stub whose two required actions — resolving the Orca executable and loading the version-matched guide from the binary — are performed by `step-01-preflight.md`. Stating this prevents both a redundant load and a stale cached copy of the guide.
- **Activation.** Resolve the journal for today; if one exists with unfinished stories, MUST resume from its last `phase` rather than restarting.
- **Dry-run contract.** When invoked with `dry-run`, MUST execute step-01 and step-02 read-only, MUST print the planned dispatch sequence and gates, and MUST NOT create a terminal, write a file, or run a git command.
- **Journal schema**, exactly:

```yaml
run: <date>-<n>
epic: <n>
branch: <name>
pr: <url|null>
preflight: passed|failed
stories:
  - key: <sprint-status key>
    phase: selected|created|validated|developed|reviewed|committed|skipped|escalated
    fix_rounds: <n>
    panel: { agy_pass: <n>, fifth_pass: <bool>, confirmation: passed|failed|pending }
    commit: <sha|null>
    note: <one line>
```

- **HALT protocol.** On any escalation the run MUST write the condition and the story's `phase` to the journal, MUST leave no worker terminal unaccounted for, and MUST stop without a further dispatch.
- **`## Escalation`** — the seven conditions, numbered `1.` to `7.`, worded as in the design record.
- **Step index** naming `step-01-preflight.md` through `step-06-epic-boundary.md` and `dispatch-recipes.md`.

- [ ] **Step 4: Write `step-01-preflight.md`**

Each check normative, all read-only, and each with the exact command. First MUST resolve the Orca executable once and reuse it for every later command, in the order the orchestration stub gives: `ORCA_CLI_COMMAND` when set, then `orca-dev` in a dev checkout exposing `ORCA_DEV_REPO_ROOT`, then `orca-ide` on Linux outside an Orca terminal — where bare `orca` MUST NOT be run because it resolves to the GNOME screen reader and starts speech on the operator's machine — otherwise `orca`. If the resolved executable cannot run, MUST report its exact error and escalate rather than falling through to another, which could silently target a different Orca build. Then MUST load the version-matched guide with `<orca> skills get orchestration` and MUST NOT act on a remembered or cached copy of it. Then: `<orca> status --json` reachable; `gh auth status`; `git status --porcelain` empty; the `agy` workspace-trust gate cleared for this worktree path; and the baseline — `npm run build` then `npm test` green **before** the first story, so an inherited failure is never charged to it. MUST record `preflight:` in the journal. Any failed check MUST escalate under condition 5, except a red baseline, which MUST escalate under condition 1 or 2 by whichever failed.

- [ ] **Step 5: Register the test and make it pass**

Append ` tests/bmad-auto-run-skill.test.mjs` to the `test` script in `package.json`.
Run: `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs`
Expected: PASS, 6/6.

- [ ] **Step 6: Commit**

```bash
git add tests/bmad-auto-run-skill.test.mjs .claude/skills/bmad-auto-run package.json
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs
git commit -m "feat: bmad-auto-run spine, pre-flight, and its drift test"
```

---

### Task 2: Story selection that skips instead of stopping

**Files:**
- Create: `.claude/skills/bmad-auto-run/step-02-select-story.md`
- Modify: `.claude/skills/bmad-auto-run/SKILL.md` (step index)

**Interfaces:**
- Consumes: `preflight: passed` from Task 1's journal.
- Produces: the selected story key and `phase: selected`, or `phase: skipped` rows with a reason.

- [ ] **Step 1: Write `step-02-select-story.md`**

MUST read `_bmad-output/implementation-artifacts/sprint-status.yaml` in full and take the first key matching `<n>-<n>-<name>` whose status is `backlog`, reading top to bottom — the same rule `bmad-create-story` applies, so selection never disagrees with the skill it dispatches. MUST NOT treat `review` as blocking. MUST read the story's epic row and any dependency note; if a dependency is unmet, MUST record `phase: skipped` with the reason and take the next backlog story. MUST escalate under condition 4 only when every remaining backlog story is skipped. MUST record the epic of the selected story so step-06 can detect an epic boundary.

- [ ] **Step 2: Verify selection against real repository state**

Run: `sed 's/#.*//' _bmad-output/implementation-artifacts/sprint-status.yaml | grep -nE "^\s+[0-9]+-[0-9]+-.*: backlog" | head -3`
Expected: the first row is `17-7-projected-shell-route-group`. The skill's selection rule MUST pick that same key.

- [ ] **Step 3: Run the structural test and commit**

```bash
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs
git add .claude/skills/bmad-auto-run
git commit -m "feat: story selection with dependency skip"
```

---

### Task 3: Dispatch recipes, and the create → validate → dev leg

**Files:**
- Create: `.claude/skills/bmad-auto-run/dispatch-recipes.md`
- Create: `.claude/skills/bmad-auto-run/step-03-story-cycle.md`
- Modify: `.claude/skills/bmad-auto-run/SKILL.md` (step index)

**Interfaces:**
- Consumes: the selected story key from Task 2.
- Produces: a documented `dispatch(role, task_spec) -> dispatch_id` recipe used by Task 4; journal phases `created`, `validated`, `developed`.

- [ ] **Step 1: Write `dispatch-recipes.md`**

MUST resolve every role's CLI, model, and effort from the per-skill routing table in the operator's global Orca Agent Dispatch rules, and MUST assemble argv from that table's CLI columns for model, effort, and unattended flags. MUST NOT copy an id or a flag spelling into this file. The recipe, with placeholders only:

```
orca orchestration run-create --objective "<run id>" --json      # once per run
orca orchestration task-create --spec "<role>: <story key>" --json
orca terminal create --worktree active --title "<role>" --command "<assembled argv>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

MUST state the `agy` exception: dispatch without `--inject`, then `orca terminal send --terminal <handle> --text "<brief with taskId, dispatchId, and the verbatim worker_done command>" --enter --json`. MUST state that a settled worker is accounted for before the next wait: attempt `orca orchestration worker-release --dispatch <id> --json`, and where the receipt reports the terminal retained as pre-existing, close it explicitly. MUST NOT release on a timeout, idle state, or rejected report. MUST record every `dispatch_id` in the journal so a resumed run can read a worker it did not start.

- [ ] **Step 2: Write `step-03-story-cycle.md`**

Three dispatches in order, each waited to `worker_done` before the next: create story; validate, which MUST run in a different session **and** a different CLI family than the creator; then dev. A `--outcome failed` on create or validate MUST retry once with the same role, then escalate under condition 5. MUST update `phase` after each. MUST dispatch the owning skill — never edit an artifact from the coordinator — when a worker reports it needs a spec update, an architecture update, or a correct course, then MUST resume the interrupted leg. MUST escalate under condition 6 before a correct-course dispatch that would move a PRD-level goal, retire an epic, or renumber an existing `AD-n`.

- [ ] **Step 3: Run the structural test and commit**

```bash
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs
git add .claude/skills/bmad-auto-run
git commit -m "feat: dispatch recipes and the create-validate-dev leg"
```

Expected: the banned-literal test still passes — proof the recipes reference the tables rather than copying them.

---

### Task 4: The review panel and the two holes it closes

**Files:**
- Create: `.claude/skills/bmad-auto-run/step-04-review-panel.md`
- Modify: `.claude/skills/bmad-auto-run/SKILL.md` (step index)

**Interfaces:**
- Consumes: `phase: developed`, the story key, the dev role's CLI family.
- Produces: `phase: reviewed` with the `panel` block populated, or a fix round.

- [ ] **Step 1: Write `step-04-review-panel.md`**

MUST dispatch the five reviewers mandated by the operator's panel rules in parallel — four `agy` workers on the mandated pair of model rows, never the row that this account silently downgrades, plus a fifth from a family other than the one that ran dev — each running the project's code-review skill. MUST record that the four `agy` reviewers cannot fan out into that skill's internal layers and so review inline; only the fifth gets them.

Then, as rules:

- Panel output MUST be treated as findings, not verdicts. MUST NOT close on any single reviewer's approval.
- MUST dispatch one adjudicator worker that reads all five reports plus the code and returns one merged fix list with a pass/fail. The coordinator MUST NOT read the code itself.
- On a documentation-heavy change set, `agy` agreement MUST NOT count as evidence. Every finding from the fifth reviewer MUST reach a verified disposition and MUST NOT be dismissed as a minority view.
- Blockers MUST go to one fix dispatch, then the panel MUST run again. From the second fix round the dev role MUST take the higher effort its table row allows.
- After the last fix round, one confirmation reviewer from a family other than the fixer's MUST read the final state before the commit gate, because a fix round changes the tree the panel judged.
- MUST escalate under condition 3 when the fifth reviewer still reports a blocker after three fix rounds, and under condition 2 when a test fails identically after three.

- [ ] **Step 2: Run the structural test and commit**

```bash
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs
git add .claude/skills/bmad-auto-run
git commit -m "feat: five-reviewer panel, adjudication, confirmation review"
```

---

### Task 5: The commit gate

**Files:**
- Create: `.claude/skills/bmad-auto-run/step-05-commit-gate.md`
- Modify: `.claude/skills/bmad-auto-run/SKILL.md` (step index)

**Interfaces:**
- Consumes: `phase: reviewed` with `confirmation: passed`.
- Produces: `phase: committed` with the commit sha.

- [ ] **Step 1: Write `step-05-commit-gate.md`**

In order, all normative: MUST run `npm run build` then `npm test` and require both green; MUST run the guard command verbatim; MUST inspect `git status --short` and refuse to stage `.env*`, `data/local/`, `data/uploads/`, `data.db*`, `slides*/`, `*.pptx`, `*.potx`, or any real congregation, payment, or production-host data; MUST write the journal row before committing so a crash mid-commit is legible; MUST commit as the coordinator, never a worker; MUST NOT pass `--no-verify` or bypass signing. A guard failure MUST escalate under condition 1, and the guard MUST NOT be weakened to pass — the finding is the point. MUST record in the journal that the loop set the story's status, and that the owner's review lands at the PR.

- [ ] **Step 2: Run the structural test and commit**

```bash
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs
git add .claude/skills/bmad-auto-run
git commit -m "feat: commit gate"
```

Expected: the verbatim-guard test passes because the gate quotes the command exactly.

---

### Task 6: Epic boundary, draft PR, CI watch

**Files:**
- Create: `.claude/skills/bmad-auto-run/step-06-epic-boundary.md`
- Modify: `.claude/skills/bmad-auto-run/SKILL.md` (step index)

**Interfaces:**
- Consumes: `phase: committed`, the story's epic, the journal's `branch` and `pr`.
- Produces: an updated `pr`, and a new `epic`/`branch` pair when the boundary is crossed.

- [ ] **Step 1: Write `step-06-epic-boundary.md`**

MUST keep one branch per epic, named `<git user>/epic-<n>-auto-<date>`, created from the repo default base. After the epic's first commit MUST push and open a draft PR with `gh pr create --draft --base main --fill`, because CI triggers only on `main` and a feature-branch push otherwise produces no signal. After each later push MUST watch with `gh pr checks --watch` and MUST treat a failing check or a Greptile finding as findings entering the same fix-then-panel cycle in step-04. When the epic's last backlog story is committed MUST mark the PR ready with `gh pr ready`, then MUST create the next epic's branch and continue without asking. MUST NOT force-push, rewrite history, or delete an artifact — those escalate under condition 7. MUST NOT merge a PR; the merge is the owner's.

- [ ] **Step 2: Run the structural test and commit**

```bash
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs
git add .claude/skills/bmad-auto-run
git commit -m "feat: epic boundary, draft PR lifecycle, CI watch"
```

---

### Task 7: Prove it on a dry run, then close the record

**Files:**
- Modify: `docs/bmad-auto-run-design.md` (link the plan)
- Modify: `.claude/skills/bmad-auto-run/SKILL.md` if the dry run exposes a gap

- [ ] **Step 1: Dry-run the skill**

Invoke `/bmad-auto-run dry-run`. Expected: pre-flight results printed; the selected story is `17-7-projected-shell-route-group`; the printed plan names every dispatch with its role and the table row it resolved; no terminal created, no file written, no git command run.

- [ ] **Step 2: Confirm the run is inert**

Run: `git status --porcelain && orca terminal list --json`
Expected: no new modification from the dry run, and no new terminal.

- [ ] **Step 3: Full suite**

Run: `npm run build && npm test`
Expected: all green, including the new structural test at 6/6.

- [ ] **Step 4: Link the plan from the design record and commit**

```bash
git add docs/bmad-auto-run-design.md .claude/skills/bmad-auto-run
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs
git commit -m "docs: link the bmad-auto-run plan, close the build record"
```

---

## Self-review

**Spec coverage.** Thin coordinator, journal, and resume — Task 1. Story selection and dependency skip — Task 2. Routing by reference, the low-level argv path, the `agy` injection exception, worker accounting, and artifact repairs — Task 3. Panel, adjudication, and both encoded lessons — Task 4. Commit gate — Task 5. Epic PR boundary and CI watch — Task 6. Pre-flight — Task 1, step 4. All seven escalation conditions are cited by number in the task that raises them: 1 and 2 in Tasks 1 and 5, 2 and 3 in Task 4, 4 in Task 2, 5 in Tasks 1 and 3, 6 in Task 3, 7 in Task 6.

**Gap accepted deliberately:** the design's non-goals — headless driving, automatic retrospectives, per-story worktrees — have no task, which is the intent.

**Placeholders.** None. The one intentional placeholder is `<assembled argv>` in Task 3, and it must stay a placeholder: a literal there would fail the banned-literal test by design.

**Type consistency.** The journal `phase` enum is defined once in Task 1 and every later task writes only its own value from that list. `dispatch_id`, `handle`, and `task_id` keep the names the orchestration guide uses. The guard command string is identical in the constraints, Task 1, Task 5, and Task 7.
