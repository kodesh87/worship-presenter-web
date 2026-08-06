# Step 4: The review panel — dispatch, adjudicate, fix, confirm

Carries one story from `phase: developed` to `phase: reviewed`, populating
the journal's `panel` block and `fix_rounds` count. This step MUST NOT run
until the journal records `phase: developed` for this story from
`step-03-story-cycle.md`, and MUST read that story's succeeded dev dispatch
entry from the journal to learn the dev role's `family` before dispatching
anything.

Every dispatch below MUST use the recipe in `dispatch-recipes.md` — MUST NOT
reimplement `terminal create` → `wait` → `dispatch` inline here — and MUST be
waited on exactly as `worker-waiting.md` describes and accounted for exactly
as `worker-accounting.md` describes. Any dispatch in this step that never
completes — `--outcome failed`, or a liveness classification of
`failed`/`stopped` — MUST take the same retry-once-then-escalate-under-5 path
`step-03-story-cycle.md` applies to create, validate, and dev: a worker that
cannot finish the same review, adjudication, fix, or confirmation dispatch
twice is infrastructure down, not a finding to adjudicate. A reported need for
a spec, architecture, or correct-course repair from any dispatch in this step
MUST be routed through `step-03-story-cycle.md`'s mid-leg artifact repair
mechanism unchanged, by reference — MUST NOT be reimplemented here.

## Dispatching the panel in parallel

- MUST create all five reviewer dispatches — four `agy`, one other — before
  opening any wait on them, since the panel is parallel, not sequential.
- MUST dispatch the four `agy` reviewers as two workers on each of the two
  model rows the operator's bmad-code-review panel rule mandates, and MUST
  NOT substitute the row that same rule names as silently served as the
  other row on this account — that substitution would collapse two intended
  reviewers into one served model. MUST perform that rule's own served-model
  verification for both `agy` rows before counting the four as covering two
  distinct models.
- MUST pick the fifth reviewer's CLI alternative from the review-panel
  routing row from a family other than the dev family just read from the
  journal — never an `agy` alternative, since the four `agy` slots are fixed.
- MUST record that the four `agy` reviewers cannot fan out into
  `bmad-code-review`'s internal adversarial layers and so run it inline;
  only the fifth reviewer gets the full internal panel. This is why the
  fifth reviewer's findings are never outvoted below — it is the one report
  drawn from the complete method, not an argument to weaken that rule.
- Once all five are dispatched, MUST keep one shared wait loop rolling,
  matching each arriving message to its own dispatch by `dispatch_id` per
  `worker-waiting.md`'s matching rule, until every one of the five has
  either settled or completed the retry-once-then-escalate path above.
  MUST NOT begin adjudication while any of the five is still outstanding.

## Adjudication

- MUST dispatch exactly one adjudicator worker that reads all five reviewer
  reports plus the code and diff, and returns one merged fix list with an
  explicit pass or fail verdict. The coordinator MUST NOT read the code or
  diff itself — that invariant is why the adjudicator dispatch exists at all.
- Panel output MUST be treated as findings, not verdicts. MUST NOT close the
  review on any single reviewer's own approval, `agy` or otherwise — only the
  adjudicator's merged verdict may close a round.
- On a documentation-heavy change set, agreement among the four `agy`
  reviewers MUST NOT be read as evidence the change is clean — Story 17.6
  recorded both mandated `agy` votes passing a set with four real defects.
  Every finding the fifth reviewer raises MUST reach a verified disposition
  in the adjudicator's merged list and MUST NOT be dismissed as a minority
  view solely because the four `agy` reviewers disagreed with it.
- MUST treat an adjudicator `worker_done` that omits an explicit pass or fail
  verdict as `--outcome failed` for retry purposes — an adjudication that
  names neither is not a distinct state this step can act on, and giving it
  one closes exactly the failure shape this task exists to prevent.
- MUST record the adjudicator's verdict and its reasoning in this story's
  journal `note`, and record `panel.agy_pass` (0–4, the `agy` reviewers whose
  own report was clean) and `panel.fifth_pass` (bool, the fifth reviewer's
  own report) for this round — informational only, since the raw split
  never itself closes the review; the adjudicator's merged verdict does.

## Fix round

- On a fail verdict, MUST dispatch exactly one dev-fix worker (the dev role's
  fix intent) carrying the adjudicator's merged fix list, then MUST re-run
  the full five-reviewer panel again on the fixed tree — a fix dispatch is a
  dev dispatch and MUST follow `dispatch-recipes.md` and
  `worker-waiting.md`/`worker-accounting.md` exactly like the initial dev
  dispatch in `step-03-story-cycle.md`.
- MUST increment this story's journal `fix_rounds` by one per fix dispatched,
  counting a confirmation-triggered fix (below) the same way.
- From the second fix round on, MUST resolve the higher effort level the
  dev-fix role's own routing-table row allows, per `dispatch-recipes.md`'s
  resolution rule — MUST NOT spell out which level that is here.
- MUST NOT dispatch a fourth fix round. MUST escalate under condition 3 when
  the fifth reviewer's own report — during a panel round, or, at the
  confirmation stage below, the confirmation reviewer's own report — still
  names a blocker after three fix rounds have already been dispatched.
- MUST escalate under condition 2 when the same named test, reported
  identically by a reviewer or the adjudicator across three fix rounds, is
  still failing — compared only by the test name and failure text the
  workers' own reports state, never by reading the diff, since the
  coordinator MUST NOT read code itself.
- A third fix round's panel that still returns a fail verdict MUST be
  attributable to one of the two escalations above. MUST treat any such fail
  verdict the adjudicator does not attribute to a specific still-failing
  test as the fifth reviewer's blocker for condition 3 — the fifth
  reviewer's report is this panel's only protected, non-outvotable
  authority, and the coordinator has no other objective basis to judge a
  persisting fail without reading code itself.
- On a clean verdict (pass, with zero fix rounds dispatched in this cycle so
  far), MUST skip confirmation entirely, MUST record `panel.confirmation:
  passed` — the schema has no value for a skipped check, and the five
  reviewers' own clean reports already cover the exact tree being committed
  — and proceed straight to setting `phase: reviewed` below.

## Confirmation

- Once a fix round has run and the panel subsequently reports clean, MUST
  dispatch exactly one confirmation reviewer before the commit gate, because
  a fix round changes the tree the panel judged and Story 17.6's own record
  shows a fix round closing findings while touching sites no reviewer had
  flagged.
- MUST resolve the confirmation reviewer the same way as the fifth reviewer
  — a non-`agy` alternative from the review-panel routing row — from a
  family other than the family recorded on the dev-fix dispatch that
  produced the tree being confirmed. It runs `bmad-code-review` with its
  full internal adversarial layers, exactly as the fifth reviewer does,
  since only `agy` cannot fan out.
- On a passed confirmation, MUST record `panel.confirmation: passed` and
  proceed to set `phase: reviewed`.
- On a failed confirmation, MUST first apply the same fourth-round
  prohibition as the Fix round section: if the three-fix-round cap is
  already spent, MUST escalate immediately under condition 3 (or condition
  2, when the confirmation reviewer's report names the same still-failing
  test the fix-round rule above tracks) without a further dispatch.
  Otherwise MUST treat the blocker exactly as a fix-round blocker: dispatch
  one dev-fix worker carrying the confirmation reviewer's findings
  (incrementing `fix_rounds` per the rule above), then MUST re-dispatch
  confirmation alone against the newly fixed tree — MUST NOT re-run the
  full five-reviewer panel for a confirmation-triggered fix, since
  confirmation exists precisely to re-check a fix round's own tree.
- MUST record `panel.confirmation: pending` while a confirmation dispatch is
  outstanding, so a resumed run does not read the field as decided.

## Closing this step

- MUST set `phase: reviewed` only once either (a) the panel reported clean
  with zero fix rounds, or (b) a fix round's panel reported clean and the
  confirmation reviewer that ran afterward reported passed. Both are the
  only states this step exits into `phase: reviewed` from.
- MUST leave the commit gate itself to the step that owns git — this step's
  job ends at `phase: reviewed`, `fix_rounds`, and a fully populated `panel`
  block.

## Escalation

This step MUST escalate under exactly three of the seven conditions, and
MUST continue on any other outcome:

- Condition 2 (`SKILL.md` holds the full definition; cited here, never
  restated) — the same named test fails identically across three fix
  rounds.
- Condition 3 — the fifth reviewer, in a panel round, or the confirmation
  reviewer, at the confirmation stage, still reports a blocker after three
  fix rounds have been dispatched for this story.
- Condition 5 — any reviewer, the adjudicator, a fix dispatch, or the
  confirmation dispatch fails or goes dead a second time after one retry,
  per the recipe files' own mechanics; or a repair need routed through
  `step-03-story-cycle.md`'s mechanism escalates under 5 there.

On any of these, MUST follow the HALT protocol in `SKILL.md`: write the
condition and this story's current `phase` to the journal, account for every
dispatch this step opened exactly as `worker-accounting.md` describes for a
settled dispatch and as `worker-waiting.md` describes for one that never
settled, and stop without a further dispatch.
