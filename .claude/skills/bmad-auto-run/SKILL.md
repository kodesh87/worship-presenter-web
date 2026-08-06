---
name: bmad-auto-run
description: Drive the BMad development cycle — create story, validate, dev, five-reviewer panel, commit, PR — across many stories and epics without human interaction, dispatching the existing BMad skills to Orca terminal workers. Use when the user invokes `/bmad-auto-run`, optionally with `dry-run`.
---

# bmad-auto-run

A thin coordinator. It MUST read `sprint-status.yaml`, dispatch workers, read
their status summaries, write a journal, and own git. It MUST NOT read a story
file, product code, or a diff itself — every heavy step MUST run in a
dispatched worker. The full design lives in `docs/bmad-auto-run-design.md`;
this file and its step files are the executable instructions and MUST stay
consistent with that record.

## Invocation

- The only entry point MUST be `/bmad-auto-run`, optionally with `dry-run`.
- The operator MUST NOT have to invoke the `orchestration` skill before this
  one, and this skill MUST NOT invoke it itself. Its two required actions —
  resolving the Orca executable and loading the version-matched guide from the
  binary — MUST instead be performed once by `step-01-preflight.md`, which
  avoids both a redundant load of that stub and a stale remembered guide.

## Activation

- On activation the run MUST resolve its journal before doing anything else,
  and MUST resolve the **most recent** journal rather than strictly today's.
  Ceilings of 60 and 120 minutes across many stories cross midnight routinely,
  and a HALT is often cleared the next morning; keying on today's date alone
  would discard the state a resumed run depends on and start a second run
  beside a live one.
- MUST list `_bmad-output/implementation-artifacts/auto-run/*-journal.md`, take
  the latest by the date in the filename, and read the **last** run document in
  it — a journal file MAY hold more than one, separated by `---`.
- If that run document records any story that is neither `phase: committed`
  nor `phase: skipped`, the run MUST bind it and resume that story from its
  last recorded `phase`, MUST NOT restart the cycle, and MUST NOT open a new
  run document. Binding it MUST include its `orca_run`, `branch`, and `pr`:
  those three are what stop `dispatch-recipes.md` from calling `run-create`
  into an empty mailbox and `step-06-epic-boundary.md` from opening a second
  branch and a second PR for an epic already under way.
- MUST NOT resume a story whose entry carries a `halted:` condition. It stopped
  on an escalation nobody has cleared, so the run MUST report that condition
  with the story key and stop without a dispatch. Removing the field once the
  cause is fixed is the owner's act, not this loop's.
- Only where no journal exists, or every story in the latest run document is
  `committed` or `skipped`, MUST the run start a fresh run document — appended
  to today's journal file when one already exists, otherwise as a new file.

## Dry-run contract

When invoked with `dry-run`:

- The run MUST execute `step-01-preflight.md` and `step-02-select-story.md`,
  and MUST print the planned dispatch sequence and the gates it would pass
  through.
- The run MUST NOT mutate Orca or repository state: no terminal, no dispatch,
  no journal or artifact write, no state-changing git command. Read-only
  inspection is not a mutation and MUST NOT be skipped as one, so
  `step-01-preflight.md` still runs its checks, and its own dry-run branch
  states what it would have recorded and what it cannot verify without
  mutating.

## Journal schema

Every run MUST write one run document at
`_bmad-output/implementation-artifacts/auto-run/<date>-journal.md` — the file
Activation resolves above — in exactly this shape. Every later step MUST write
only a field already present below, and MUST NOT introduce a `phase` outside
the enum on the `phase:` line. A value needing more than one line, such as a
worker's own error text, MUST be written as a YAML block scalar rather than
truncated to fit: that evidence is what a HALT hands the owner.

```yaml
run: <date>-<n>                  # <n> is this document's ordinal within its file
orca_run: <orca run id>          # bound on resume, never re-created
epic: <n>
branch: <name>
pr: <url|null>
preflight: passed|failed
stories:
  - key: <sprint-status key>
    phase: selected|created|validated|developed|reviewed|committed|skipped
    halted: <condition number>       # written by the HALT protocol, cleared by the owner
    fix_rounds: <n>
    ci_rounds: <n>                 # post-commit CI fix cycles routed back to review
    panel: { agy_pass: <n>, fifth_pass: <bool>, confirmation: passed|failed|pending }  # latest round
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

`ci_rounds` makes a story's *second* trip through the cycle legible: a
post-commit CI finding returns a committed story to `step-04-review-panel.md`
and then to `step-05-commit-gate.md` for a further code commit under the same
key, whose resume check counts commits against it. Absent MUST read as zero.
`halted` keeps an escalated story from being resumed as if nothing happened,
which `phase` cannot: the HALT protocol records the phase it was already in.

`orca_run` and `dispatches` are not bookkeeping for its own sake. Without the
recorded `family` a run resuming at `phase: created` would validate in the
creator's family half the time; without `orca_run` a resumed run creates a
second Orca Run and reads an empty mailbox; without `terminal` and
`last_state` a HALT's record-and-leave-live rule has nothing to write; without
`started` and `strikes` `worker-waiting.md`'s two per-dispatch bounds reset on
every interruption, so a run resumed twice would never reach either.

## HALT protocol

On any escalation:

- The run MUST write the escalation condition and the affected story's current
  `phase` to the journal, and MUST write that condition number into that
  story's `halted:` field — recording the phase alone leaves a halted story
  indistinguishable from one in flight, and Activation would resume it.
- The run MUST leave no worker terminal unaccounted for, and MUST stop without
  issuing a further dispatch.

## Escalation

The run MUST stop and escalate to the owner on exactly these seven conditions.
On anything else the run MUST continue: an escalation that merely confirms a
recommendation is ceremony, the cost this skill exists to remove.

1. The public-repo guard fails, or the commit gate's own staging inspection
   catches a forbidden path by hand — the guard is one detector of that
   harm, not its definition.
2. The same test fails identically after three fix rounds, or the pre-flight
   baseline is red before the first story is even selected.
3. The fifth reviewer or the confirmation reviewer still reports a blocker
   after three fix rounds.
4. Every remaining backlog story is dependency-blocked.
5. Infrastructure is down — Orca, a worker, an expired auth, the `agy` trust
   gate.
6. A correct-course run would change a PRD-level goal, retire an epic, or
   renumber an existing `AD-n`.
7. An irreversible operation would be required — force-push, history rewrite,
   deleting an artifact. These are never automatic.

Condition 1's guard is the exact command `AGENTS.md`'s commit audit names,
quoted here once so every later step can point back instead of retyping it,
and MUST NOT be paraphrased or abbreviated elsewhere:

```
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs
```

## Step index, and the order the cycle runs them in

The files are numbered for reference and MUST NOT be read as a sequence. After
`step-01-preflight.md` has run once for the run, every story MUST follow
exactly this order and MUST NOT reach a step out of it:

`step-02` select → `step-06` ensure the epic's branch → `step-03`
create/validate/dev → `step-04` panel, adjudicate, fix, confirm → `step-05`
commit gate → `step-06` push, PR, CI watch — and, on a failing check, back to
`step-04`, then `step-05`, then `step-06` again.

`step-06-epic-boundary.md` therefore runs twice per story, and its branch half
MUST run before `step-03-story-cycle.md` dispatches anything. Taken in numeric
order instead, the run reaches the commit gate on whatever branch happens to be
checked out — plausibly the repository default, which the operator's own rules
forbid committing to — so `step-05-commit-gate.md` asserts the checked-out
branch itself as the backstop.

The run MUST read and follow each step file fully. This index MUST grow by
exactly one entry per task that adds a step file: the structural test in
`tests/bmad-auto-run-skill.test.mjs` requires every file this skill references
to exist, and every `.md` file in this directory to be referenced.

1. `step-01-preflight.md` — read-only environment and baseline checks, run
   once before the first story of the run.
2. `step-02-select-story.md` — pick the next backlog story, skipping any
   whose dependency is unmet.
3. `step-03-story-cycle.md` — dispatch create story, validate, and dev in
   order for the selected story, following the recipe in
   `dispatch-recipes.md`, the wait, classification, and ceiling rules in
   `worker-waiting.md`, the settlement and retry rules in
   `worker-accounting.md`, and `artifact-repairs.md` for a repair need.
4. `step-04-review-panel.md` — dispatch the five-reviewer panel, adjudicate,
   run fix rounds, and confirm, carrying the story from `phase: developed`
   to `phase: reviewed`.
5. `step-05-commit-gate.md` — final build/test/guard, refuse forbidden
   paths, write the journal row, and commit as the coordinator, carrying the
   story from `phase: reviewed` to `phase: committed` with its commit sha.
6. `step-06-epic-boundary.md` — owns the branch and PR lifecycle across an
   epic: ensure the epic's branch, then after a commit push, open or update the
   draft PR, watch CI, route a failing check back to
   `step-04-review-panel.md`, and mark the PR ready once the epic's last
   backlog story lands.
