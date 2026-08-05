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
- On `--outcome failed`, or on a dispatch `dispatch-recipes.md`'s liveness
  classification resolves to `failed`/`stopped` without it ever reporting,
  MUST retry once using `dispatch-recipes.md`'s retry mechanics — release the
  failed worker if it settled, or simply record it if it never did, then
  either way create a fresh task for the same role and the same story key;
  MUST NOT re-dispatch the task Orca already marked failed. MUST escalate
  under condition 5 if the retry also fails — a worker that cannot complete
  create-story twice in a row is infrastructure down, not a story problem.
- On success, MUST set this story's `phase: created` in the journal.

## Validate story

- MUST dispatch the "validate story" role in a new terminal — MUST NOT reuse
  the create dispatch's terminal or handle, since validation MUST run in a
  different session from the creator.
- MUST pick, from the validate-story routing row, a CLI alternative from a
  different CLI family than the one recorded on the create dispatch entry
  whose `outcome` is `succeeded` in the journal's `dispatches` list — a create
  retry can leave more than one create entry, possibly in different families,
  and only the succeeded one is the creator. MUST read the family from the
  journal rather than memory, so a run resuming at `phase: created` honours
  this rule identically to a run that never paused.
- MUST wait for `worker_done`. On `--outcome failed`, or on a dispatch
  `dispatch-recipes.md`'s liveness classification resolves to
  `failed`/`stopped` without it ever reporting, MUST apply the same
  retry-once-then-escalate-under-5 rule as create story, following
  `dispatch-recipes.md`'s retry mechanics.
- On success, MUST set `phase: validated`.

## Dev story

- MUST dispatch the "dev story" role, initial intent.
- MUST wait for `worker_done`. On `--outcome failed`, or on a dispatch
  `dispatch-recipes.md`'s liveness classification resolves to
  `failed`/`stopped` without it ever reporting, MUST apply the same
  retry-once-then-escalate-under-5 rule as create and validate, following
  `dispatch-recipes.md`'s retry mechanics: the loop
  MUST NOT advance to the review panel without an implementation to review —
  a panel dispatched against an unimplemented story would burn five
  reviewers to discover nothing was built — and a worker that fails the same
  dispatch twice is past what this loop can resolve on its own, which is
  exactly what condition 5 covers. This rule governs only the initial dev
  dispatch failing to complete at all; it is distinct from the dev worker
  completing and reporting review findings, blockers, or fix rounds, which
  remain the review-panel step's concern, not this step's.
- On success, MUST set `phase: developed`. This step only carries the story
  from `validated` to `developed`.

## Mid-leg artifact repairs

- Any of the three dispatches above MAY report that it cannot proceed until a
  spec update, an architecture update, or a correct-course run happens. On
  such a report, MUST NOT edit the artifact from the coordinator — MUST
  instead dispatch the owning skill (`bmad-spec`, `bmad-architecture`, or
  `bmad-correct-course`) as its own worker, through the same recipe, and wait
  for its `worker_done`.
- If the reported need arrived as a `question` message rather than inside a
  `worker_done`, MUST close that question with
  `orca orchestration reply --id <message_id> --body "<answer>" --json`
  (`dispatch-recipes.md`'s wait protocol) as part of initiating the repair.
  MUST NOT dispatch the repair skill while leaving the asking worker's
  question pending and unanswered.
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

- Condition 5 (infrastructure is down — `SKILL.md` holds the full
  definition; this bullet only cites it, never restates it) — this step
  raises it when: a `--outcome failed`, or a dead dispatch `worker-show`
  classifies `failed`/`stopped`, repeats after one retry on create, validate,
  or the initial dev dispatch; when a dispatch `worker-show` still reports
  `outcome_unknown` after both `worker-stop` and `worker-abandon`; or when a
  worker `escalation` on any of the three names no repair need and no
  specific condition, after one retry.
- Condition 6 — before any correct-course dispatch whose reported scope would
  move a PRD-level goal, retire an epic, or renumber an existing `AD-n`.

On either, MUST follow the HALT protocol in `SKILL.md`: write the condition
and this story's current `phase` to the journal, then account for every
dispatch this leg opened — release a dispatch that already settled exactly
as `dispatch-recipes.md` describes, and for a dispatch that never settled,
record its `role`, `family`, `task`, `dispatch`, `terminal`, and `last_state`
with `outcome: unsettled` and leave its terminal live rather than releasing
it — and stop without a further dispatch.
