---
name: bmad-auto-run
description: Drive the BMad development cycle — create story, validate, dev, five-reviewer panel, commit, PR — across many stories and epics without human interaction, dispatching the existing BMad skills to Orca terminal workers. Use when the user invokes `/bmad-auto-run`, optionally with `dry-run`.
---

# bmad-auto-run

A thin coordinator. It MUST read `sprint-status.yaml`, dispatch workers, read
their status summaries, write a journal, and own git. It MUST NOT read a story
file, product code, or a diff itself — every heavy step MUST run in a
dispatched worker. The full design this skill implements lives in
`docs/bmad-auto-run-design.md`; this file and its step files are the
executable instructions, and MUST stay consistent with that record.

## Invocation

- The only entry point MUST be `/bmad-auto-run`, optionally followed by
  `dry-run`.
- The operator MUST NOT have to invoke the `orchestration` skill before this
  one.
- This skill MUST NOT invoke the `orchestration` skill itself. That skill is a
  discovery stub whose two required actions — resolving the Orca executable
  and loading the version-matched guide from the binary — MUST instead be
  performed by `step-01-preflight.md`. Performing them there, once, avoids
  both a redundant load of the stub and a stale, remembered copy of the guide
  surviving into a later story.

## Activation

- On activation the run MUST resolve today's journal before doing anything
  else.
- If a journal exists for today with unfinished stories, the run MUST resume
  from that journal's last recorded `phase` for the affected story rather than
  restarting the cycle from the beginning.

## Dry-run contract

When invoked with `dry-run`:

- The run MUST execute `step-01-preflight.md` and the story-selection step
  read-only.
- The run MUST print the planned dispatch sequence and the gates it would
  pass through.
- The run MUST NOT create a terminal, write a file, or run a git command.

## Journal schema

Every run MUST write one journal at
`_bmad-output/implementation-artifacts/auto-run/<date>-journal.md` — the same
file Activation resolves as "today's journal" — in exactly this shape. Every
later step MUST write only a value already present below, and MUST NOT
introduce a `phase` outside the enum on the `phase:` line.

```yaml
run: <date>-<n>
orca_run: <orca run id>          # bound on resume, never re-created
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
    dispatches:
      - role: <role>
        family: <cli family>     # so a resumed run can honour "a different family than the creator"
        task: <task_id>
        dispatch: <dispatch_id>
        terminal: <handle>       # the terminal a HALT names; live unless already closed
        started: <timestamp>     # when this dispatch was sent, so its ceiling survives a resume
        strikes: <n>             # classifications producing no new message, per dispatch
        outcome: succeeded|failed|pending|unsettled
        last_state: <one line>   # what was last observed, for an unsettled dispatch
```

`orca_run` and `dispatches` are not bookkeeping for its own sake. Without the
recorded `family`, a run resuming at `phase: created` cannot know which
family created the story and would validate in the same one half the time —
defeating that rule outright. Without `orca_run`, a resumed run that creates
a second Orca Run reads an empty mailbox and never receives a prior worker's
report. Without `terminal` and `last_state`, a HALT's own record-and-leave-
live rule has nothing to write — the journal the owner reads would never
name which terminal was left running or why. Without `started` and `strikes`,
`worker-waiting.md`'s two per-dispatch bounds reset every time the run is
interrupted, so both would hold within one run only and an unattended run
resumed twice would never reach either.

## HALT protocol

On any escalation:

- The run MUST write the escalation condition and the affected story's current
  `phase` to the journal.
- The run MUST leave no worker terminal unaccounted for.
- The run MUST stop without issuing a further dispatch.

## Escalation

The run MUST stop and escalate to the owner on exactly these seven conditions.
On anything else the run MUST continue: an escalation that merely confirms a
recommendation is ceremony, and ceremony is the cost this skill exists to
remove.

1. The public-repo guard fails.
2. The same test fails identically after three fix rounds, or the pre-flight
   baseline is red before the first story is even selected.
3. The fifth reviewer still reports a blocker after three fix rounds.
4. Every remaining backlog story is dependency-blocked.
5. Infrastructure is down — Orca, a worker, an expired auth, the `agy` trust
   gate.
6. A correct-course run would change a PRD-level goal, retire an epic, or
   renumber an existing `AD-n`.
7. An irreversible operation would be required — force-push, history rewrite,
   deleting an artifact. These are never automatic.

Condition 1's guard is the exact command `AGENTS.md`'s commit audit already
names, quoted here once so every later step can point back to this line
instead of retyping it, and MUST NOT be paraphrased or abbreviated elsewhere:

```
node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs
```

## Step index

The run MUST read and follow each step file fully, in the order the run
reaches it. This index MUST grow by exactly one entry per task that adds a
step file, because the structural test in `tests/bmad-auto-run-skill.test.mjs`
requires every file this skill references to exist, and every `.md` file in
this directory to be referenced.

1. `step-01-preflight.md` — read-only environment and baseline checks, run
   once before the first story of the run.
2. `step-02-select-story.md` — pick the next backlog story, skipping any
   whose dependency is unmet, run each time the loop needs a new story.
3. `step-03-story-cycle.md` — dispatch create story, validate, and dev in
   order for the selected story, following the recipe in
   `dispatch-recipes.md`, the wait, classification, and ceiling rules in
   `worker-waiting.md`, and the settlement and retry rules in
   `worker-accounting.md`.
4. `step-04-review-panel.md` — dispatch the five-reviewer panel, adjudicate,
   run fix rounds, and confirm, carrying the story from `phase: developed`
   to `phase: reviewed`, run once the dev dispatch in `step-03-story-cycle.md`
   succeeds.
