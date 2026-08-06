# Step 3: Story cycle — create, validate, dev

Carries one story from `phase: selected` to `phase: developed`. This step
MUST NOT run until the journal records `phase: selected` for this story from
`step-02-select-story.md`. It MUST run once per story, before the review
panel step runs.

Every dispatch below MUST use the recipe in `dispatch-recipes.md` — MUST NOT
reimplement `terminal create` → `wait` → `dispatch` inline here — and MUST be
waited on exactly as `worker-waiting.md` describes and accounted for exactly
as `worker-accounting.md` describes.

## Create story

- MUST dispatch the "create story" role with the `task_spec` naming exactly
  the story key `step-02-select-story.md` selected. MUST NOT let
  `bmad-create-story` run its own auto-discovery against
  `sprint-status.yaml` in this run: a story `step-02-select-story.md`
  rejected as dependency-blocked is recorded `phase: skipped` in the journal
  only, so `sprint-status.yaml` still reads that row as `backlog`, and an
  independent re-scan would select the very story just rejected.
- MUST wait for `worker_done` before proceeding.
- On `--outcome failed`, or on a dispatch `worker-waiting.md`'s liveness
  classification resolves to `failed`/`stopped` without it ever reporting,
  MUST retry once using `worker-accounting.md`'s retry mechanics — release the
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
  `worker-waiting.md`'s liveness classification resolves to
  `failed`/`stopped` without it ever reporting, MUST apply the same
  retry-once-then-escalate-under-5 rule as create story, following
  `worker-accounting.md`'s retry mechanics.
- On success, MUST set `phase: validated`.

## Dev story

- MUST dispatch the "dev story" role, initial intent.
- MUST wait for `worker_done`. On `--outcome failed`, or on a dispatch
  `worker-waiting.md`'s liveness classification resolves to
  `failed`/`stopped` without it ever reporting, MUST apply the same
  retry-once-then-escalate-under-5 rule as create and validate, following
  `worker-accounting.md`'s retry mechanics: the loop
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
  spec update, an architecture update, or a correct-course run happens. That
  report MUST be handled exactly as `artifact-repairs.md` describes —
  repair-then-resume, its two bounds, and its precedence over a leg's retry —
  and MUST NOT be reimplemented here.

## Escalation

This step MUST escalate under exactly two of the seven conditions, MUST
continue on any other outcome, and MUST resolve a worker `question` without
reaching for a third:

- Condition 5 (infrastructure is down — `SKILL.md` holds the full definition;
  this bullet only cites it, never restates it) — this step raises it when:
  - a `--outcome failed`, or a dead dispatch `worker-show` classifies
    `failed`/`stopped`, repeats after one retry on create, validate, the
    initial dev dispatch, or a repair dispatch;
  - a dispatch `worker-show` still reports `outcome_unknown` after both
    `worker-stop` and `worker-abandon`, or `worker-show` cannot resolve it at
    all;
  - a dispatch exceeds the wall-clock ceiling in `worker-waiting.md`;
  - a leg reports a repair need already repaired for this story, or one still in
    flight for it, or a fourth repair would be dispatched for one story;
  - a worker `escalation` on any of the three legs names no repair need and no
    specific condition, after one retry.
- Condition 6 — before any correct-course dispatch whose reported scope would
  move a PRD-level goal, retire an epic, or renumber an existing `AD-n`.
- A worker `question` MUST NOT be left waiting on a condition that does not
  exist. When its answer is inside this loop's authority, `worker-waiting.md`
  requires a `reply`. When it would change a contract, an AC, or an artifact's
  authority, MUST escalate under condition 6 if its scope is one of that
  condition's three; otherwise MUST treat it as a reported repair need and
  answer it by taking `artifact-repairs.md`'s path, since the owning skill — not the
  coordinator and not the asking worker — owns that change. The seven
  conditions have no entry for an artifact change below condition 6's scope,
  and this step MUST NOT invent an eighth.

On either condition, MUST follow the HALT protocol in `SKILL.md`: write it
and this story's current `phase` to the journal, then account for every
dispatch this leg opened — release a dispatch that already settled exactly
as `worker-accounting.md` describes, and for a dispatch that never settled,
record its `role`, `family`, `task`, `dispatch`, `terminal`, and `last_state`
with `outcome: unsettled` and leave its terminal live rather than releasing
it — and stop without a further dispatch. Where that terminal was already
closed by a `worker-stop` during liveness classification, the record MUST say
so rather than annotating it as left live, and MUST name
`worker-read --dispatch <id> --json` as where its output is: `worker-accounting.md`
holds that carve-out, and a record that sends the owner looking for a live
process that is not there is worse than no record. Where a HALT lands while a
question is still unanswered — a repair that failed on the `question` path — the
record MUST name that question as outstanding, because a worker blocked on a
reply that will now never come looks idle and is not.
