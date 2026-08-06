# CI findings after a push

Watching the checks and the reviews a push produces, and routing what they
report back into the fix cycle. `step-06-epic-boundary.md` owns the push, the
PR, and the branch; this file owns everything between a push and the moment
that step may proceed to close the epic. It MUST be followed exactly and MUST
NOT be restated inline there.

## Watching the checks

Runs after every push, including the one that just opened the draft PR — its
existence is what makes this push's CI run visible at all, so skipping the
watch on the first push would silently discard the earliest signal this
design exists to surface.

- MUST run `gh pr checks --watch`. It blocks natively until every reported
  check concludes, but a required check that never gets queued at all — a
  race between this push and GitHub registering the workflow run — makes it
  return reporting zero checks, which MUST NOT be read as a pass. MUST retry
  a bare `gh pr checks` after a short pause until at least one check is
  reported, up to a 10-minute bound from this push (comfortably longer than
  this repository's single Node build-and-test job ever takes to start); if
  none is ever reported within that bound, MUST escalate under condition 5 —
  CI never being queued is infrastructure, not a code finding. This rollup
  includes Greptile's own `Greptile Review` check, gated here like any other
  reported check — but MUST NOT be treated as covering what Greptile found, for
  the reason the next section gives.
- Once at least one check is reported, `--watch` itself has no ceiling of its
  own, so a check stuck queued or pending forever would hang it indefinitely
  — and nothing in `worker-waiting.md` applies, since this is not a
  dispatched worker. MUST wrap the watch in an external wall-clock bound of
  30 minutes; reaching it before every check concludes MUST be treated as
  inconclusive, never as a pass, and escalated under condition 5.
## Reading the reviews a push produced

**A passing `Greptile Review` check does not mean no finding.** That is the trap
this section exists to close, and it is not hypothetical: on this repository's
PR #36 the check passed while Greptile posted a review carrying a P1 security
finding that was correct. A check-only detector misses exactly that class, so
the reviews MUST be read on their own, after the checks conclude and before any
green verdict.

- MUST list the PR's reviews with `gh pr view <n> --json reviews` and MUST treat
  a review whose author login is `greptile-apps` as present regardless of its
  state; `COMMENTED` is the state it used on PR #36 and MUST NOT be read as
  "no findings".
- MUST NOT read that review's own body as the findings. On PR #36 the body was
  empty and the finding existed only as an inline comment, so a detector
  stopping at the body reports clean on a P1.
- MUST fetch the inline findings with
  `gh api repos/{owner}/{repo}/pulls/<n>/comments` and MUST match the author as
  the **comments API** reports it, which is `greptile-apps[bot]` — a different
  string from the review author login above. An exact match on one login misses
  the other, and that is the whole detector.
- MUST treat every such comment as a finding and MUST NOT grade it first: the
  severity arrives as a badge image in the comment body, so a severity filter
  would silently drop findings whose badge markup changes. A finding is a
  finding.
- MUST record each routed comment's own id in this story's journal `note`, and
  MUST NOT route an id already recorded there. Greptile does not resolve its
  comments when the fix lands, so without this bound every later round would
  re-find the same comment and burn the three-round cap on work already done.
- The check rollup above and this review read are complementary, not
  duplicates: the rollup gates on whether checks are green, this section on what
  a reviewer actually said. MUST run both and MUST NOT drop either as redundant.

## Routing a finding into the fix cycle

- A failing check, or any unrouted Greptile finding, is **findings, not a
  verdict**: MUST route it through the same fix-then-panel cycle
  `step-04-review-panel.md` owns, reusing that step's `fix_rounds` count,
  three-round cap, and adjudication for this story exactly as written there —
  MUST NOT re-derive the loop, the cap, or the adjudication here.
- Routing it MUST be a **recorded phase transition**, never an implied one,
  because every step downstream gates on the phase and at this moment the
  story reads `committed`: MUST record the failing checks' own reported names
  and output, or the routed comment ids and their text, in this story's journal
  `note`, MUST increment its `ci_rounds` by
  one, MUST set `panel.confirmation: pending`, and MUST set
  `phase: developed` — the one transition out of `committed` — leaving
  `fix_rounds` as it stands so that step's three-round cap keeps binding
  across the boundary. Without this transition the fix is unreachable:
  `step-04-review-panel.md` MUST NOT run below `phase: developed` and
  `step-05-commit-gate.md` MUST NOT run below `phase: reviewed`, so a red
  check would have nothing that could ever turn it green.
- A fix lands as a **new** commit through `step-05-commit-gate.md` for the
  same story key — MUST NOT amend or rewrite the commit already on this
  branch — and that step's resume check reads `ci_rounds` to know how many
  code commits this story is expected to carry, so the incremented value MUST
  be in the journal before the story is handed back. `step-06-epic-boundary.md`
  then runs again on that new `phase: committed` event: push, watch again. When
  the cap is exhausted, MUST escalate under exactly the condition
  `step-04-review-panel.md`'s Fix round section names for it — never a
  condition of this loop's own invention for a post-commit finding.
- Only once every reported check is green **and** every Greptile finding is
  either routed or already recorded as routed MUST `step-06-epic-boundary.md`
  proceed to its "Closing the epic" section. Green checks alone MUST NOT satisfy
  this, which is the same trap in its last possible place.
