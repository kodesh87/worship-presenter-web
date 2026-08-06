# Step 2: Story selection

Decides which story the run works on next. This step MUST NOT run until the
journal records `preflight: passed` for this run. It MUST run once each time
the loop needs a story: the first time right after pre-flight, and again once
`step-06-epic-boundary.md` has finished with the previous story — its push, its
PR, and its watch — and handed control back, or when the loop has just skipped a
story and needs the next candidate. MUST NOT be triggered by `phase: committed`
itself: the commit is the middle of the cycle `SKILL.md` states, not its end,
and selecting on it would start the next story before the previous one is
pushed.

## Selection rule (mirrors `bmad-create-story`)

This is the same auto-discover rule `bmad-create-story` applies on its own
activation. Matching that algorithm is necessary but not sufficient: a skip
is recorded in this run's journal only, never in `sprint-status.yaml`, so
that file keeps reading `backlog` for a story this step just rejected.
Agreement between the two algorithms alone does not stop `bmad-create-story`
from re-scanning that unchanged file and selecting the same blocked story
back if it is ever left to run its own auto-discovery. The guarantee that
this skill and `bmad-create-story` never disagree holds only together with
the handoff rule below.

- MUST read the complete `_bmad-output/implementation-artifacts/sprint-status.yaml`
  file, top to bottom, before selecting anything.
- MUST take the first key matching the pattern `<n>-<n>-<name>` (e.g.
  `17-7-projected-shell-route-group`) whose status value is exactly `backlog`.
- MUST NOT treat an `epic-<n>` key or an `epic-<n>-retrospective` key as a
  candidate — only a two-number story key counts.
- MUST NOT require that any preceding story be `done` first, and MUST NOT
  treat a preceding story's `review` status as blocking. Neither condition is
  part of the rule `bmad-create-story` applies, so neither is part of this
  rule either.

## Dependency check

`sprint-status.yaml` carries no machine-readable dependency field. This
check MUST read prose from the sources below. It MUST NOT invent a
dependency schema the file does not have.

- For the candidate story, MUST read: the YAML comment block immediately
  above that epic's own `epic-<n>:` row, any YAML comment immediately above
  the candidate story's own row, and the candidate story's heading and prose
  in `_bmad-output/planning-artifacts/epics.md`.
- MUST treat the dependency as unmet only when one of those sources names a
  specific prerequisite story or artifact and that prerequisite is not yet
  `done` (or, for an artifact, does not yet exist). Silence on dependencies
  in all three sources MUST be read as no dependency, not as an unmet one.
- If the dependency is unmet, MUST append a journal entry for that key with
  `phase: skipped` and a `note` naming the unmet prerequisite, then MUST
  return to the selection rule and take the next matching key, continuing top
  to bottom from where the candidate was found.
- Before evaluating any candidate, MUST check whether the journal already
  holds an entry for that key. If it is already `phase: skipped`, MUST NOT
  re-evaluate its dependency or write a duplicate entry — MUST move directly
  to the next matching key instead.
- MUST NOT select a key this run's journal already records at any `phase`
  other than `skipped`. That story is this run's own work — in progress or
  already committed — and `SKILL.md`'s Activation resumes it from its recorded
  `phase` instead of selecting it afresh. `sprint-status.yaml` is not proof
  otherwise: the write that clears a committed story out of `backlog` lands in
  `step-05-commit-gate.md`'s second commit, so an interruption between that
  step's two commits leaves the row reading `backlog` for a story already
  committed.
- A skip MUST NOT be reported or logged as an error. It is the loop
  continuing to the next backlog story, not a failure of any kind.

## No candidate at all

If no key matches the pattern with status `backlog` anywhere in the file —
none skipped, none selectable — the run has no more stories left to do. This
MUST NOT escalate under condition 4, which is for backlog stories that exist
but are all blocked. MUST instead stop selecting and hand control back to the
run without a further dispatch.

## Recording a selection

Once a candidate clears the dependency check:

- MUST append a journal entry with `key: <that story's sprint-status key>`
  and `phase: selected`. `fix_rounds`, `panel`, `commit`, and `note` MAY be
  left for the steps that populate them later in the cycle.
- MUST set the journal's top-level `epic: <n>` field to that story's epic
  number, taken from the leading digits of its key, so a later step can
  detect when the next selection crosses into a different epic.

## Handoff to the create-story dispatch

This step's selection is only as good as how the next step uses it:

- The step that dispatches `bmad-create-story` (Task 3's
  `step-03-story-cycle.md`) MUST pass this step's selected key to that
  dispatch directly, as the story to create. It MUST NOT let
  `bmad-create-story` run its own auto-discovery against
  `sprint-status.yaml` in this run.
- `sprint-status.yaml` MUST NOT be treated, by any step in this skill, as
  reflecting this run's skips — the file has no field for them. The journal
  is the only record of what this run has skipped.

## Dry-run branch

On a `dry-run` invocation this step MUST still select, since the selected key is
the one thing the dry run exists to show, but `SKILL.md`'s contract forbids the
journal write every rule above requires:

- MUST NOT append or modify any journal entry — neither `phase: selected` nor
  `phase: skipped` nor the top-level `epic`. MUST instead print each entry it
  would have written, in order.
- MUST hold its skip decisions in this session only, and MUST NOT rely on the
  journal's already-skipped check, which has nothing to read on a dry run.

## Escalation

MUST escalate under condition 4 only after every key matching the pattern
with status `backlog` in the file has been evaluated in this pass and every
one of them is recorded `phase: skipped` — none left to select. On that
escalation, MUST follow the HALT protocol defined in `SKILL.md`.
