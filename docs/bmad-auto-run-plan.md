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
- The commit gate: `npm run build` green, `npm test` green, nothing forbidden staged, then guard green **after staging and immediately before the commit** — the guard's scan set is `git ls-files`, so an untracked file is invisible to it until staged, and running it first lets a sensitive untracked file under an unlisted path reach public history uninspected. A guard failure stops the run and leaves the staging in place for the owner; the guard MUST NOT be weakened.
- `.github/workflows/test.yml` triggers only on `push` to `main` and `pull_request` to `main`. A feature-branch push produces no CI signal, so the epic's draft PR MUST be opened after the epic's first commit.
- `npm test` has no auto-discovery: 44 test files are listed explicitly in `package.json`. A new test file MUST be added to that list.
- Escalation has exactly seven conditions. The count and wording MUST match `docs/bmad-auto-run-design.md`, and the structural test MUST assert both — several files cite a condition by number, so wording that drifts in one file silently redirects every citation. A condition MUST NOT be renumbered for any reason; a wording that must broaden MUST broaden in both files at once.
- Every backticked bare `*.md` reference in **every** skill file MUST resolve to a file in that directory, and the structural test MUST assert it across all of them rather than SKILL.md alone.
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
| `.../dispatch-recipes.md` | How to assemble worker argv and dispatch by role, without naming models — getting a worker running |
| `.../worker-waiting.md` | Waiting, ack discipline, the `worker_done`/`escalation`/`question` branches, liveness classification, and the wall-clock ceiling — everything the loop does while a dispatch is still outstanding |
| `.../worker-accounting.md` | Settlement, release, and retry — accounting for a dispatch once it stops being outstanding. Split out of the recipes file once three rounds of findings landed exclusively here, then split again along the waiting/accounting seam when the same pressure returned; both halves are reused unchanged by every later step that dispatches |
| `.../commit-resume.md` | Which parts of the commit gate a resumed run repeats and which it MUST NOT, keyed on what git durably holds. Split out of `step-05-commit-gate.md` as a pure move when the guard's reordering would have pushed that file past the line guidance |
| `.../ci-findings.md` | Watching the checks and reviews a push produces, their bounds, and routing any finding back into step-04's fix cycle. Split out of `step-06-epic-boundary.md` as a pure move when the restored review-based Greptile detection would have pushed that file past the line guidance |
| `.../artifact-repairs.md` | Repair-then-resume when a dispatch reports it needs a spec, architecture, or correct-course change, with its two bounds and its precedence over a leg's retry. Split out of `step-03-story-cycle.md` as a pure move once that file reached the 200-line guidance; `step-04-review-panel.md` and `worker-waiting.md` route into it unchanged |
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
- Produces: the journal schema every later step writes; the `phase` enum `selected|created|validated|developed|reviewed|committed|skipped`; the per-story `halted:` field that records an escalation (no `phase` value does, since HALT records the phase the story was already in); the step-index convention that the test enforces.

- [ ] **Step 1: Write the failing test**

This is the test as Task 1 wrote it. The final whole-branch review added two
assertions on top — the conditions' wording, and cross-file `*.md` references —
so `tests/bmad-auto-run-skill.test.mjs` in the repository is authoritative over
the snippet below.

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
  // Match any backticked bare filename. An allow-list of known prefixes goes blind
  // the moment a file is added under a new name — which is how it missed one.
  for (const [, ref] of skill.matchAll(/`([a-z][a-z0-9-]*\.md)`/g)) {
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
- **Activation.** Resolve the **most recent** journal, never strictly today's. Per-dispatch ceilings of 60 and 120 minutes across many stories cross midnight routinely, and a HALT is often cleared the next morning; keying on today's date alone starts a second run beside a live one — a new Orca Run reading an empty mailbox, a second branch and PR for the same epic, and `bmad-create-story` re-run over a story file a live worker may still hold. A journal file MAY hold more than one run document, separated by `---`, and `run: <date>-<n>` numbers them within the file. If the latest document holds a story that is neither `committed` nor `skipped`, MUST bind that document — `orca_run`, `branch`, and `pr` included — and resume that story from its recorded `phase`. MUST NOT resume a story whose entry carries a `halted:` condition; clearing it is the owner's act.
- **Dry-run contract.** When invoked with `dry-run`, MUST execute step-01 and step-02, MUST print the planned dispatch sequence and gates, and MUST NOT mutate Orca or repository state — no terminal, no dispatch, no journal or artifact write, no state-changing git command. Worded as "no file written, no git command" it contradicts step-01 three ways: that step writes `preflight:`, runs `git status --porcelain`, and runs `npm run build`, which writes `.next/`. Read-only inspection and an ignored build directory are not mutations; the journal write and the `agy` probe terminal are, so step-01 MUST carry a dry-run branch that prints the record it would have written and names what it cannot verify without creating a terminal.
- **Journal schema**, exactly:

```yaml
run: <date>-<n>                  # <n> is this document's ordinal within its file
orca_run: <orca run id>          # bound on resume, never re-created
epic: <n>
branch: <name>
pr: <url|null>
preflight: passed|failed
agy_probe: <one line per mandated agy row: the row and the model it was served>
stories:
  - key: <sprint-status key>
    phase: selected|created|validated|developed|reviewed|committed|skipped
    halted: <condition number>       # written by the HALT protocol, cleared by the owner
    fix_rounds: <n>
    ci_rounds: <n>                 # post-commit CI fix cycles routed back to review
    panel: { agy_pass: <n>, fifth_pass: <bool>, confirmation: passed|failed|pending }
    commit: <sha|null>             # the most recent code commit for this story
    note: <free text; a block scalar where the evidence needs one>
    dispatches:
      - role: <role>
        family: <cli family>     # so a resumed run can honour "a different family than the creator"
        task: <task_id>
        dispatch: <dispatch_id>
        terminal: <handle>       # the terminal a HALT names; live unless already closed
        started: <timestamp>     # when this dispatch was sent, so its ceiling survives a resume
        strikes: <n>             # classifications producing no new message, per dispatch
        outcome: succeeded|failed|pending|unsettled
        last_state: <free text; a block scalar where the evidence needs one>
```

`note` and `last_state` MUST NOT be constrained to one line. Several steps write
a worker's own error text, a failing check's output, or an adjudicator's
reasoning into them, and a one-line schema makes an agent obeying both truncate
the evidence a HALT exists to hand the owner. A value needing more than one line
MUST be written as a YAML block scalar.

`orca_run` and `dispatches` are not bookkeeping for its own sake. Without the
recorded family, a run resuming at `phase: created` cannot know which family
created the story and would validate in the same one half the time — defeating
the rule outright. Without `orca_run`, a resumed run that creates a second Orca
Run reads an empty mailbox and never receives the prior workers' reports.
Without `started` and `strikes`, the wall-clock ceiling and the classification
bound reset on every interruption, so each holds within one run only.

- **HALT protocol.** On any escalation the run MUST write the condition and the story's `phase` to the journal, MUST write that condition number into the story's `halted:` field, MUST leave no worker terminal unaccounted for, and MUST stop without a further dispatch. The `halted:` field is load-bearing: HALT records the phase the story was already in, and several steps require leaving `phase` unchanged, so without it a halted story is indistinguishable from one in flight and Activation resumes it.
- **`## Escalation`** — the seven conditions, numbered `1.` to `7.`, worded as in the design record.
- **Step index** naming `step-01-preflight.md` only. The index MUST grow one entry per task, because the structural test requires every referenced file to exist — a forward reference to a file Task 2 has not written yet fails this task. Tasks 2 to 6 each append their own entry.

- [ ] **Step 4: Write `step-01-preflight.md`**

Each check normative and each with the exact command; every one MUST leave repository state unmutated, read-only apart from the two exceptions named below. First MUST resolve the Orca executable once and reuse it for every later command, in the order the orchestration stub gives: `ORCA_CLI_COMMAND` when set, then `orca-dev` in a dev checkout exposing `ORCA_DEV_REPO_ROOT`, then `orca-ide` on Linux outside an Orca terminal — where bare `orca` MUST NOT be run because it resolves to the GNOME screen reader and starts speech on the operator's machine — otherwise `orca`. If the resolved executable cannot run, MUST report its exact error and escalate rather than falling through to another, which could silently target a different Orca build. Then MUST load the version-matched guide with `<orca> skills get orchestration` and MUST NOT act on a remembered or cached copy of it. Then: `<orca> status --json` reachable; `gh auth status`; `git status --porcelain` empty; the `agy` workspace-trust gate **and** both mandated `agy` rows' served models proven by one probe — one terminal per row, real runs only — because no read-only command reports either, so a declarative precondition here would be a rule with no detector and its condition-5 branch a branch nothing can trigger. That probe's result MUST go to a **top-level** journal field (`agy_probe`), never a story's `note`: pre-flight runs before any story entry exists, and the record outlives every story that reads it. This step's own preamble MUST name the probe terminals and the build as deliberate exceptions to "read-only", or an agent resolving the contradiction in the preamble's favour skips the probe and removes the only detector there is. Then the baseline — `npm run build` then `npm test` green **before** the first story, so an inherited failure is never charged to it. MUST record `preflight:` in the journal. Any failed check MUST escalate under condition 5, except a red guard, which MUST escalate under condition 1, and a red baseline build or test, which MUST escalate under condition 2. Condition 2's wording MUST therefore cover a pre-flight baseline as well as a test still failing after three fix rounds — and, per the final review, the commit gate's own ordinary local failures too — in the skill and the design record alike, because a run that logs "condition 2" for an event the condition's own text says cannot happen yet misleads whoever reads the journal. Condition 5's wording MUST cover the `agy` account serving one model where the panel requires two, for the same reason. Neither broadening MAY renumber a condition or change the count of seven.

- [ ] **Step 5: Register the test and make it pass**

Append ` tests/bmad-auto-run-skill.test.mjs` to the `test` script in `package.json`.
Run: `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/bmad-auto-run-skill.test.mjs`
Expected: PASS — 6/6 as written for this task; the final review adds two more assertions, taking it to 8/8.

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
- Create: `.claude/skills/bmad-auto-run/worker-waiting.md` and `.../worker-accounting.md` — the waiting and accounting halves, split out of the recipes file under review pressure rather than planned up front
- Create: `.claude/skills/bmad-auto-run/artifact-repairs.md` — the repair-then-resume path, split out of `step-03-story-cycle.md` as a pure move when that file reached the line guidance
- Modify: `.claude/skills/bmad-auto-run/SKILL.md` (step index)

**Interfaces:**
- Consumes: the selected story key from Task 2.
- Produces: a documented `dispatch(role, task_spec) -> dispatch_id` recipe used by Task 4; journal phases `created`, `validated`, `developed`.

- [ ] **Step 1: Write `dispatch-recipes.md`**

MUST resolve every role's CLI, model, and effort from the per-skill routing table in the operator's global Orca Agent Dispatch rules, and MUST assemble argv from that table's CLI columns for model, effort, and unattended flags. MUST NOT copy an id or a flag spelling into this file. The recipe, with placeholders only:

```
orca orchestration run-create --objective "bmad-auto-run <run id>" --json   # once per run; run-list is how a resume finds it
orca orchestration task-create --spec "<role>: <story key> — <the four required elements>" --json
orca terminal create --worktree active --title "<role>" --command "<assembled argv>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

MUST state what the `--spec` carries, because it is the whole of what the worker is told: the role, the story key as its only target, the owning BMad skill **and intent** resolved from the role map — a worker handed only `validate story: <key>` cannot derive validate intent from create intent, and that map is the coordinator's routing, invisible to the worker — the operator's standing clause that the worker decides routine matters itself and reserves `orca orchestration ask` for a decision changing a contract, an AC, or an artifact's authority, and the expectation that it reports an artifact-repair need rather than making the change itself. The `question` and `escalation` branches both assume workers use `ask` that way.

A review-class role — any panel reviewer, the adjudicator, the confirmation reviewer — MUST additionally carry a **read-only clause**: review and report only, no write to the story file, `sprint-status.yaml`, or any artifact. All of them run the code-review skill, which sets a story status natively, and Task 4 runs five in parallel in one worktree; without the clause they are concurrent writers on two tracked files and one reviewer's inline verdict marks the story `done` before adjudication, confirmation, or the commit gate.

MUST state the `agy` exception: dispatch without `--inject`, then `orca terminal send --terminal <handle> --text "<brief with taskId, dispatchId, and the verbatim worker_done command>" --enter --json`. Because `--inject` is what would otherwise deliver the spec, that brief MUST also carry everything the `--spec` carries.

MUST state the wait protocol, because every part of it fails silently when omitted. A `check --wait` returns one Delivery batch of up to 50 messages and **replays that same batch until it is acknowledged**, so each message MUST be matched by its `dispatch_id` against the dispatch being awaited before it is acted on, and the Delivery MUST be acknowledged with `check --ack <delivery_id> --wait --types ... --timeout-ms <n> --json` only after every message and every required release decision is handled. A timeout or `{count:0}` MUST be treated as a checkpoint and the wait rolled, never as a worker failure — real coding dispatches run 15 to 60 minutes, and the window is the floor of that range. Before any retry the worker's liveness MUST be checked, and a readiness match MUST NOT be taken as proof it started. A `question` MUST get an explicit branch: answer it with `orca orchestration reply --id <message_id> --body "<answer>" --json` when the answer is inside this loop's authority, and escalate when it would change a contract, an AC, or an artifact's authority.

MUST state when a message counts as handled for acknowledgement, because the ack rule and a deferred reply are otherwise incompatible. A message is handled once the action it requires is **set in motion**, not once that action finishes: for a `question` routed to an artifact repair, that means the repair has been dispatched. The Delivery MUST therefore be acknowledged at dispatch, never at the repair's completion — an unacknowledged Delivery replays instead of yielding new mail, so the repair's own `worker_done` can never arrive behind it, and waiting deadlocks the loop against itself while burning the repair's ceiling. MUST also state that acknowledging is not answering: the ack consumes the coordinator's mail batch, while the question stays pending against its own message id until a `reply` names that id, so the ack goes early and the answer still goes late. Neither may be written so that it implies the other.

MUST state settlement precisely, in both directions. A `worker_done` with `--outcome failed` IS settled and MUST be released like a success. The forbidden releases are the guide's seven non-settlement states — timeout, TUI idle, heartbeat, status, question, escalation, and a rejected or stale `worker_done` — and a HALT under any escalation condition MUST account for a live worker by recording its `dispatch_id`, terminal handle, and last known state in the journal and leaving the terminal live for the owner, never by releasing it.

MUST specify the retry mechanically: for a dispatch settled by `worker_done --outcome failed`, release the failed worker first; for one that never settled, record it `unsettled` instead, since release is forbidden for a dispatch that never settled. Either way the second attempt MUST create a **fresh task** rather than re-dispatch one Orca has already marked failed, recording both task ids. `worker-start --retry-of` is the guide's own retry path and is unavailable here for the same reason `worker-start` is, so the retry MUST be assembled from the low-level path.

Every command in the recipe MUST have a failure branch, including the ones that bind the Run. `run-create`, `run-list`, and `run-use` MUST retry once and then record and escalate under condition 5 — and a resumed run whose journal `orca_run` is absent from `run-list` MUST take that same branch, never fall back to `run-create`, because a second Run reads an empty mailbox and loses every prior worker's report. `check --ack` MUST have one too: a nonzero ack leaves the batch replaying while the loop declines to act on a question it has already handled, so it MUST retry once, then record and escalate under condition 5.

A role with no row in the operator's per-skill routing table — the adjudicator, the confirmation reviewer, the fifth reviewer's alternative — MUST resolve its tier from the role-to-dispatch table in `docs/bmad-auto-run-design.md` and its family constraint from the calling step. That table is the sanctioned record for those roles; ids and flags still MUST NOT be copied out of it into any skill file.

MUST give a dispatch that never reports a terminating classification rather than an assumption: `worker-show --dispatch <id>` decides it, `failed` or `stopped` takes the retry path, and `outcome_unknown` takes `worker-stop` then a re-classification then `worker-abandon` with an escalation under condition 5. A `ready` verdict MUST NOT return a terminal that has provably exited or disappeared to another rolled wait — the guide names an exited terminal as a reason to stop waiting — and the number of classifications that produce no new message MUST be bounded, so no branch can spin silently. MUST state `worker-abandon`'s real effect: it fences the dispatch and performs no process or filesystem action, so resources may still be live and a journal record written after it MUST NOT imply a worker dealt with.

MUST give `escalation` its own branch — the repair path, or a HALT under the condition it names, or one retry then condition 5 — and MUST account for the escalating worker on every one of those paths, not only on HALT, since it cannot be released. MUST state that a settled worker is accounted for before the next wait: attempt `orca orchestration worker-release --dispatch <id> --json`, and where the receipt reports the terminal retained as pre-existing, close it explicitly — this skill never reuses a terminal, so any terminal it created is safe to close, and the guide promises a follow-up recovery command only for a `release_pending` or `release_unknown` receipt, which MUST be followed exactly rather than substituted. MUST record every `dispatch_id` in the journal so a resumed run can read a worker it did not start. The release predicate itself is stated once, below, in both directions — it MUST NOT be restated here in a narrower form.

- [ ] **Step 2: Write `step-03-story-cycle.md`**

Three dispatches in order, each waited to `worker_done` before the next: create story; validate, which MUST run in a different session **and** a different CLI family than the creator; then dev. The create dispatch MUST name the story key step-02 selected, and MUST NOT let the create-story skill auto-discover its own target: a skip is recorded in the journal only, so `sprint-status.yaml` still shows a skipped story as `backlog` and an independent re-scan would select the very story step-02 rejected as blocked. A `--outcome failed` on create, validate, or dev MUST retry once with the same role, then escalate under condition 5. Dev is included deliberately: the loop MUST NOT advance to the review panel without an implementation, and a worker that fails the same dispatch twice is past what the loop can resolve on its own. MUST update `phase` after each. MUST dispatch the owning skill — never edit an artifact from the coordinator — when a worker reports it needs a spec update, an architecture update, or a correct course, then MUST resume the interrupted leg. How the need arrived decides who still owns that leg, and the two MUST NOT be treated alike: `ask` blocks until answered, so a worker that asked is still at its prompt and resumes its own leg when the reply lands — the repair MUST be dispatched, the reply MUST carry its outcome, that dispatch MUST stay `pending` with the question in `last_state`, and the leg MUST NOT be re-dispatched, or two workers run concurrently against one story key and one story file. Only a need arriving inside a `worker_done` leaves the leg ownerless and MUST be resumed by re-dispatching the role. A repair can outlast the worker's own `ask` timeout; the guide keeps a timed-out question pending and resumable by its original message id, so the deferred reply still answers it, and a worker that never resumes MUST take the liveness classification path. That cycle MUST be bounded in both shapes: a leg that reports the same repair need after the repair has already run MUST NOT be repaired again, and MUST escalate under condition 5 instead — and that bound MUST key on a repair recorded `pending` as well as one recorded `succeeded`, or a replayed or repeated report starts a second worker on the same governed artifact while the first is still in flight; and the total number of repairs per story MUST be capped, or a chain of technically-new needs cycles forever — an unbounded repair-then-resume cycle is the one loop with no human in it. A repair dispatch's own failure or dead classification MUST take the same retry-once path as any other dispatch, not an unstated one. When one report triggers both the repair path and a leg's retry rule, the precedence MUST be stated rather than left to the agent, and the resuming re-dispatch MUST NOT silently consume the leg's retry allowance.

A wall-clock ceiling per dispatch MUST exist, stated in the waiting file the File Structure assigns it to rather than in this step, which MUST only cite it. Every other bound in this design is a strike count, and a strike count cannot terminate a worker that stays alive and keeps emitting activity — so an unattended run has no terminating condition at all for that case. A dispatch exceeding its ceiling MUST escalate under condition 5 with its `last_state` recorded. That ceiling MUST be evaluated before every wait is opened, whatever the previous wait returned, and MUST NOT be attached to the timeout branch: a worker returning an in-`--types` message inside every window never times out, never reaches a liveness checkpoint, and never increments the strike count, so a ceiling checked only there never fires for the worker that most needs it. Wall-clock is the one bound indifferent to what the worker is doing, which is why it exists — with exactly one exception, stated in that same file: while a repair dispatched to answer a worker's `question` is in flight, the asking worker's ceiling MUST be suspended and MUST resume when the reply is sent, or any asker that asks past its halfway mark HALTs under condition 5 while its own repair is healthy and running. The repair carries its own ceiling, so the pair stays bounded. MUST escalate under condition 6 before a correct-course dispatch that would move a PRD-level goal, retire an epic, or renumber an existing `AD-n`.

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

MUST dispatch the five reviewers mandated by the operator's panel rules in parallel — four `agy` workers on the mandated pair of model rows, never the row that same rule excludes as silently served as another, plus a fifth from a family other than the one that ran dev — each running the project's code-review skill, and each `--spec` carrying the read-only clause from Task 3. MUST take the served-model verification from pre-flight's probe rather than re-verifying per panel. MUST record that the four `agy` reviewers cannot fan out into that skill's internal layers and so review inline; only the fifth gets them.

Then, as rules:

- Panel output MUST be treated as findings, not verdicts. MUST NOT close on any single reviewer's approval.
- MUST dispatch one adjudicator worker that reads all five reports plus the code and returns one merged fix list with a pass/fail. The coordinator MUST NOT read the code itself.
- On a documentation-heavy change set, `agy` agreement MUST NOT count as evidence. Every finding from the fifth reviewer MUST reach a verified disposition and MUST NOT be dismissed as a minority view.
- Blockers MUST go to one fix dispatch, then the panel MUST run again. From the second fix round the dev role MUST take the higher effort its table row allows.
- After the last fix round, one confirmation reviewer from a family other than the fixer's MUST read the final state before the commit gate, because a fix round changes the tree the panel judged.
- MUST escalate under condition 3 when the fifth reviewer still reports a blocker after three fix rounds, and under condition 2 when a test fails identically after three.
- MUST name where a worker `question` lands, as Task 3's step does. This step dispatches up to eight workers, and the waiting file routes an out-of-authority question to the calling step's own rules; without them a reviewer that asks anything blocks for its full ceiling and then HALTs under condition 5, mislabelling a working `ask` as infrastructure down.

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

In order, all normative: MUST run `npm run build` then `npm test` and require both green; MUST inspect `git status --short` and refuse to stage `.env*`, `data/local/`, `data/uploads/`, `data.db*`, `slides*/`, `*.pptx`, `*.potx`, or any real congregation, payment, or production-host data; MUST stage what remains by name; MUST then run the guard command verbatim, after that staging and immediately before the commit, because its scan set is `git ls-files` and an untracked file is outside that set until staged; MUST write the journal row before committing so a crash mid-commit is legible; MUST commit as the coordinator, never a worker; MUST NOT pass `--no-verify` or bypass signing. A guard failure MUST escalate under condition 1 with the staged paths recorded and the staging left in place — an automatic unstage would destroy the evidence — and the guard MUST NOT be weakened to pass; the finding is the point. Because review-class workers are read-only (Task 3), this step is what sets the story's status to `done` in `sprint-status.yaml`, staged with the journal in the sha-recording commit; step-02 selects the first `backlog` key, so a committed story left `backlog` would be selected again. MUST record in the journal that the loop set that status, and that the owner's review lands at the PR.

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

MUST keep one branch per epic, named `<git user>/epic-<n>-auto-<date>`, created from the repo default base. After the epic's first commit MUST push and open a draft PR with `gh pr create --draft --base main --fill`, because CI triggers only on `main` and a feature-branch push otherwise produces no signal. After each later push MUST watch with `gh pr checks --watch`, and MUST **also** read the PR's reviews. An earlier ruling here — that Greptile posts only a status check with no separate review object — was generalised from PR #35 and is wrong: on PR #36 Greptile posted a review as `greptile-apps` with state `COMMENTED` and an empty body, carrying a correct P1 security finding as an inline comment, **while its `Greptile Review` check passed**. So a passing check MUST NOT be read as no finding, the review body MUST NOT be read as the findings, and the inline comments MUST be fetched from `gh api repos/{owner}/{repo}/pulls/<n>/comments`, whose author login is `greptile-apps[bot]` — a different string from the review author login. Routed comment ids MUST be recorded so a later round does not re-find a closed one. The check rollup and the review read are complementary and both MUST run. A failing check or an unrouted review finding MUST enter the same fix-then-panel cycle in step-04, and routing it there MUST be a **recorded phase transition** — `committed` back to `developed`, `ci_rounds` incremented, `panel.confirmation` reset to `pending`, `fix_rounds` carried — because step-04 MUST NOT run below `phase: developed` and step-05 MUST NOT run below `phase: reviewed`: without the transition the fix is unreachable and a red check can never turn green. That fix's own commit is a *second* code commit for the same story key, so step-05's resume check MUST count code commits against `ci_rounds` rather than read the second one as an ambiguity to escalate on. When the epic's last backlog story is committed MUST mark the PR ready with `gh pr ready`, then MUST hand control back — the next epic's branch is created reactively by this step's own branch section once selection has cleared that story's dependency check, never guessed ahead of it. MUST NOT force-push, rewrite history, or delete an artifact — those escalate under condition 7. MUST NOT merge a PR; the merge is the owner's.

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
Expected: all green, including the structural test (8/8 once the final review's two assertions land).

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
