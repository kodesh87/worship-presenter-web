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
  spec update, an architecture update, or a correct-course run happens. On
  such a report, MUST NOT edit the artifact from the coordinator — MUST
  instead dispatch the owning skill (`bmad-spec`, `bmad-architecture`, or
  `bmad-correct-course`) as its own worker, through the same recipe, and wait
  for its `worker_done`.
- Whether the need arrived as a `question` or inside a `worker_done` decides
  who still owns the interrupted leg, and the two MUST NOT be treated alike.
  An `ask` blocks until answered: the asking worker is sitting at its prompt,
  still owns its leg, and resumes it the moment the reply lands. A
  `worker_done` means that worker finished and exited, leaving the leg with no
  owner at all.
- On the `question` path, MUST dispatch the repair first and reply only once
  the repair settles, with
  `orca orchestration reply --id <message_id> --body "<answer>" --json`
  carrying the repair's outcome so the asking worker can continue. MUST NOT
  re-dispatch that leg on this path: the reply is what resumes it, and a
  re-dispatch would put a second worker on the same story key and the same
  story file while the first is still live. MUST keep that dispatch
  `outcome: pending` with the question in `last_state`, per
  `worker-waiting.md`'s asking-worker rule — never `unsettled`.
- A worker's `ask` carries its own timeout and a repair can outlast it. The
  guide states a timed-out question stays pending and is resumed by its
  original message id, so the deferred reply above is still the answer to that
  same question and MUST NOT be re-asked or re-sent as a new one. After
  replying, MUST confirm the worker actually resumed using
  `worker-waiting.md`'s liveness probes; one that never resumes MUST be
  treated as a dispatch that never reports and MUST take that file's liveness
  classification.
- Before dispatching a `bmad-correct-course` repair, MUST read the reporting
  worker's stated scope for that correct-course and escalate under condition
  6 instead of dispatching when that scope would move a PRD-level goal,
  retire an epic, or renumber an existing `AD-n`. MUST NOT dispatch the
  correct-course worker first and discover the scope from its result —
  condition 6 is a gate before the dispatch, not a review after it.
- Once the repair worker reports `worker_done` — and, for a correct-course
  repair, once condition 6 has been checked and not triggered — MUST resume
  the interrupted leg by re-dispatching the same role (create, validate, or
  dev) that reported the need **only where that need arrived inside a
  `worker_done`**, because that worker exited and the leg has no owner left.
  Where it arrived as a `question`, the reply above is the resumption and MUST
  NOT be followed by a re-dispatch. On either path the repair MUST NOT itself
  be treated as satisfying the leg.
- Every repair dispatch MUST be recorded in the journal's `dispatches` list
  with a `role` naming both the owning skill and the artifact it repaired, so
  the two bounds below survive a resume that reads the journal rather than
  this session's memory.
- The repair-then-resume cycle MUST be bounded in both of its shapes, because
  it is the one loop in this design with no human inside it:
  - **Same need twice.** A leg that reports a repair need whose owning skill
    and artifact match a repair already recorded `succeeded` for this story
    MUST NOT be repaired again, and MUST escalate under condition 5 instead.
    A role that still needs the change the repair just made is past what this
    loop can resolve by dispatching the same two workers at each other again.
  - **A chain of different needs.** MUST NOT dispatch more than 3 repairs in
    total for one story, counting every artifact and every leg; the fourth
    MUST escalate under condition 5. Bounding only the identical repeat would
    leave a story cycling spec → architecture → correct-course → spec forever,
    each need technically new.
- A repair dispatch's own failure MUST take the same path as any other
  dispatch, not an unstated one: on `--outcome failed`, or on a liveness
  classification of `failed`/`stopped` without it ever reporting, MUST apply
  retry-once-then-escalate-under-5 through `worker-accounting.md`'s retry
  mechanics; on ceiling exhaustion MUST escalate under condition 5 directly,
  with no retry, exactly as that file requires for every other dispatch. A
  retried repair MUST NOT be counted a second time against the 3-repair cap
  above — it is one repair attempted twice, not two repairs.
- When one report triggers both this repair path and a leg's retry rule — a
  `worker_done --outcome failed` that also reports a repair need — the repair
  path MUST take precedence and the retry MUST NOT be issued for that report.
  Retrying first would re-dispatch the same role against the same unrepaired
  artifact and fail identically, burning the leg's only retry on a known
  outcome. The re-dispatch that resumes the leg after the repair MUST NOT be
  counted as that leg's retry — it is a resumption, and the leg keeps its
  retry-once allowance for a later failure that reports no repair need. The
  repair bounds above are what keep this from being a way around the retry
  bound.

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
  - a leg reports a repair need already repaired for this story, or a fourth
    repair would be dispatched for one story;
  - a worker `escalation` on any of the three legs names no repair need and no
    specific condition, after one retry.
- Condition 6 — before any correct-course dispatch whose reported scope would
  move a PRD-level goal, retire an epic, or renumber an existing `AD-n`.
- A worker `question` MUST NOT be left waiting on a condition that does not
  exist. When its answer is inside this loop's authority, `worker-waiting.md`
  requires a `reply`. When it would change a contract, an AC, or an artifact's
  authority, MUST escalate under condition 6 if its scope is one of that
  condition's three; otherwise MUST treat it as a reported repair need and
  answer it by taking the repair path above, since the owning skill — not the
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
