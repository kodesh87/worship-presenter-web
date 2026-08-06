---
name: bmad-auto-run
description: Drive the BMad development cycle — create story, validate, dev, five-reviewer panel, commit, PR — across many stories and epics without human interaction, dispatching the existing BMad skills to Orca terminal workers. Use when the user invokes `/bmad-auto-run`, optionally with a scope mode: `dry-run`, `one-story`, or `one-epic`. Bare, it runs until the backlog is exhausted.
---

# bmad-auto-run

A thin coordinator. It MUST read `sprint-status.yaml`, dispatch workers, read
their status summaries, write a journal, and own git. It MUST NOT read a story
file, product code, or a diff itself — every heavy step MUST run in a
dispatched worker. The full design lives in `docs/bmad-auto-run-design.md`;
this file and its step files are the executable instructions and MUST stay
consistent with that record.

## Invocation and scope modes

The only entry point MUST be `/bmad-auto-run`, optionally followed by exactly one
scope mode. The cycle is identical in every mode; only where the run stops
differs, which is why the mode is an argument and a journal field rather than a
separate skill.

| Argument | `mode:` | Stops |
|---|---|---|
| *(none)* | `full` | when the backlog is exhausted, or a condition escalates |
| `dry-run` | `dry-run` | after printing the plan; mutates nothing |
| `one-story` | `one-story` | after the first story is committed, pushed, and its PR opened or adopted |
| `one-epic` | `one-epic` | after its epic's PR is marked ready |

- MUST resolve the argument against that table and nothing else. **An argument
  that is not one of the three MUST stop and report it, naming the three valid
  modes, and MUST NOT fall through to any mode.** A typo such as `one-stroy`
  falling through would silently start the most expensive run there is — and the
  epic boundary is a PR boundary, not a stop, so its only exits would be an
  escalation or killing the session, which strands live workers.
- MUST record the resolved mode as the journal's `mode` before the first
  dispatch, and MUST take the mode from the journal on a resumed run — never
  from how this session happened to be invoked. Otherwise a `one-story` run that
  halts and resumes widens to the whole backlog at the moment nobody is
  watching.
- `one-story` and `one-epic` stop where `step-06-epic-boundary.md` says they do,
  and a `full` run stops when `step-02-select-story.md` finds no candidate left.
  All three are **clean stops, not HALTs**: the journal complete, every worker
  accounted for by `worker-accounting.md`, nothing mid-dispatch. The run MUST
  record that it stopped because its scope was reached, distinguishable from an
  escalation, so the journal never reads as though a condition fired.
- **At every clean stop**, before the run ends, MUST check whether the journal's
  `pr` is still a draft and the unit it belongs to has no remaining selectable
  work; if so, MUST run `gh pr ready` on it, with the same `isDraft` idempotency
  and the same condition-5 branch on a nonzero exit that
  `step-06-epic-boundary.md` already specifies. This is the only place that
  catches a unit whose trailing stories were all *skipped* rather than
  committed: nothing ever marks its PR ready otherwise, and a draft PR nobody
  asked to stay a draft is work the owner cannot see. A HALT MUST NOT do this —
  a halted run's PR is genuinely unfinished.
- The operator MUST NOT have to invoke the `orchestration` skill before this
  one, and this skill MUST NOT invoke it itself. Its two required actions —
  resolving the Orca executable and loading the version-matched guide from the
  binary — MUST instead be performed once by `step-01-preflight.md`, which
  avoids both a redundant load of that stub and a stale remembered guide.

## Activation

- On activation the run MUST resolve its journal before doing anything else —
  before resolving its own mode, since a resumed run takes the mode from there —
  and MUST resolve the **most recent** journal rather than strictly today's.
  Ceilings of 60 and 120 minutes across many stories cross midnight routinely,
  and a HALT is often cleared the next morning; keying on today's date alone
  starts a second run beside a live one.
- MUST list `_bmad-output/implementation-artifacts/auto-run/*-journal.md`, take
  the latest by the date in the filename, and read the **last** run document in
  it — a journal file MAY hold more than one, separated by `---`.
- If that run document records any story that is neither `phase: committed`
  nor `phase: skipped`, the run MUST bind it and resume that story from its
  last recorded `phase`, MUST NOT restart the cycle, and MUST NOT open a new
  run document. Binding it MUST include its `orca_run`, `branch`, `pr`, and
  `mode`: the first three are what stop `dispatch-recipes.md` from calling
  `run-create` into an empty mailbox and `step-06-epic-boundary.md` from opening
  a second branch and PR for an epic already under way, and the fourth is what
  keeps a resumed run inside the scope it was given.
- MUST NOT resume a story whose entry carries a `halted:` condition. It stopped
  on an escalation nobody has cleared, so the run MUST report that condition
  with the story key and stop without a dispatch. Removing the field once the
  cause is fixed is the owner's act, not this loop's.
- Only where no journal exists, or every story in the latest run document is
  `committed` or `skipped`, MUST the run start a fresh run document — appended
  to today's journal file when one already exists, otherwise as a new file.

## Dry-run contract

When invoked with `dry-run`:

- The run MUST execute `step-01-preflight.md` and `step-02-select-story.md`, and
  MUST print the planned dispatch sequence and the gates it would pass through.
- The run MUST NOT mutate Orca or repository state: no terminal, no dispatch,
  no journal or artifact write, no state-changing git command. Read-only
  inspection is not a mutation and MUST NOT be skipped as one, so
  `step-01-preflight.md` still runs its checks, and its own dry-run branch
  states what it would have recorded and what it cannot verify without
  mutating.

## Journal

Every run MUST write its state to one journal, whose shape and per-field
reasoning live in `journal.md`. Every step MUST write only a field already
present there.

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
2. The same test fails identically after three fix rounds, the pre-flight
   baseline is red before the first story is even selected, or the commit gate
   cannot complete for an ordinary local reason that is not the guard — a red
   build or test, a failed journal write, a rejected commit, or a branch or
   commit history it cannot reconcile.
3. The fifth reviewer or the confirmation reviewer still reports a blocker
   after three fix rounds.
4. Every remaining backlog story is dependency-blocked.
5. Infrastructure is down — Orca, a worker, an expired auth, the `agy` trust
   gate, or an `agy` account serving one model where the panel requires two.
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

The run MUST read and follow each step file fully. Every `.md` file in this
directory MUST be referenced from this index, and every reference in any of them
MUST resolve — `tests/bmad-auto-run-skill.test.mjs` asserts both.

1. `step-01-preflight.md` — environment and baseline checks, plus the one `agy`
   probe, run once before the first story of the run.
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
5. `step-05-commit-gate.md` — build, test, refuse forbidden paths, stage,
   guard, then commit as the coordinator, carrying `phase: reviewed` to
   `phase: committed`; `commit-resume.md` holds its recovery rules.
6. `step-06-epic-boundary.md` — owns the branch and PR lifecycle across an
   epic: ensure the epic's branch, then after a commit push, open or update the
   draft PR, watch what that push produced and route its findings back to
   `step-04-review-panel.md` per `ci-findings.md`, and mark the PR ready once
   the epic's last backlog story lands.
