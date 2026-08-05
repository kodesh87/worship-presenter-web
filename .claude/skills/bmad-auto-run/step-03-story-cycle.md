# Step 3: Story cycle — create, validate, dev

Carries one story from `phase: selected` to `phase: developed`. This step
MUST NOT run until the journal records `phase: selected` for this story from
`step-02-select-story.md`. It MUST run once per story, before the review
panel step runs.

Every dispatch below MUST use the recipe in `dispatch-recipes.md` — MUST NOT
reimplement `terminal create` → `wait` → `dispatch` inline here.

## Create story

- MUST dispatch the "create story" role with the `task_spec` naming exactly
  the story key `step-02-select-story.md` selected. MUST NOT let
  `bmad-create-story` run its own auto-discovery against
  `sprint-status.yaml` in this run: a story `step-02-select-story.md`
  rejected as dependency-blocked is recorded `phase: skipped` in the journal
  only, so `sprint-status.yaml` still reads that row as `backlog`, and an
  independent re-scan would select the very story just rejected.
- MUST wait for `worker_done` before proceeding.
- On `--outcome failed`, MUST retry once, dispatched fresh with the same role
  and the same story key. MUST escalate under condition 5 if the retry also
  fails — a worker that cannot complete create-story twice in a row is
  infrastructure down, not a story problem.
- On success, MUST set this story's `phase: created` in the journal.

## Validate story

- MUST dispatch the "validate story" role in a new terminal — MUST NOT reuse
  the create dispatch's terminal or handle, since validation MUST run in a
  different session from the creator.
- MUST pick, from the validate-story routing row, a CLI alternative from a
  different CLI family than the one actually used for create — not merely a
  different alternative within the same family.
- MUST wait for `worker_done`. On `--outcome failed`, MUST apply the same
  retry-once-then-escalate-under-5 rule as create story.
- On success, MUST set `phase: validated`.

## Dev story

- MUST dispatch the "dev story" role, initial intent.
- MUST wait for `worker_done`.
- On success, MUST set `phase: developed`. A dev worker's own review
  findings, blockers, or fix rounds are the review-panel step's concern, not
  this step's — this step only carries the story from `validated` to
  `developed`.

## Mid-leg artifact repairs

- Any of the three dispatches above MAY report that it cannot proceed until a
  spec update, an architecture update, or a correct-course run happens. On
  such a report, MUST NOT edit the artifact from the coordinator — MUST
  instead dispatch the owning skill (`bmad-spec`, `bmad-architecture`, or
  `bmad-correct-course`) as its own worker, through the same recipe, and wait
  for its `worker_done`.
- Before dispatching a `bmad-correct-course` repair, MUST read the reporting
  worker's stated scope for that correct-course and escalate under condition
  6 instead of dispatching when that scope would move a PRD-level goal,
  retire an epic, or renumber an existing `AD-n`. MUST NOT dispatch the
  correct-course worker first and discover the scope from its result —
  condition 6 is a gate before the dispatch, not a review after it.
- Once the repair worker reports `worker_done` — and, for a correct-course
  repair, once condition 6 has been checked and not triggered — MUST resume
  the interrupted leg by re-dispatching the same role (create, validate, or
  dev) that reported the need. The repair MUST NOT itself be treated as
  satisfying that leg.

## Escalation

This step MUST escalate under exactly two of the seven conditions, and MUST
continue on any other outcome:

- Condition 5 — a `--outcome failed` on create or validate that repeats after
  one retry with the same role.
- Condition 6 — before any correct-course dispatch whose reported scope would
  move a PRD-level goal, retire an epic, or renumber an existing `AD-n`.

On either, MUST follow the HALT protocol in `SKILL.md`: write the condition
and this story's current `phase` to the journal, leave no worker terminal
unaccounted for (per `dispatch-recipes.md`'s accounting rule), and stop
without a further dispatch.
