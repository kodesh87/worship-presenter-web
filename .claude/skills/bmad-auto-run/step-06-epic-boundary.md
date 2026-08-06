# Step 6: Epic boundary — branch, draft PR, CI watch, ready

Owns the branch and PR lifecycle across an epic: one branch per epic, a draft
PR opened after that epic's first commit, CI/Greptile watched after every
push, and the PR marked ready once the epic's last backlog story lands. This
step opens no worker dispatch of its own — every action below runs as the
coordinator, exactly like `step-05-commit-gate.md`, so `dispatch-recipes.md`,
`worker-waiting.md`, and `worker-accounting.md` do not apply here. It runs at
two points, both driven by state the other steps already own:

- **Before `step-03-story-cycle.md` dispatches anything** for a newly
  selected story — to ensure the epic's branch exists and is checked out.
- **Immediately after `step-05-commit-gate.md` records `phase: committed`**
  — to push, manage the PR, and watch CI.

## Ensuring the epic's branch (before `step-03` dispatches)

- The expected branch name is `<git config user.name>/epic-<epic>-auto-<date>`,
  where `<epic>` is the journal's top-level `epic` field
  `step-02-select-story.md` just set for the newly selected story, and
  `<date>` is the date embedded in this run's own journal filename (today's
  journal per `SKILL.md`'s Activation section) — fixed once recorded in the
  journal's `branch` field and never regenerated on a later resume.
- If the journal's `branch` already names this same epic number, MUST do
  nothing further — either a previous story of this epic already checked it
  out, or the epic-close step below already created and checked it out
  preemptively.
- If it instead names a *different* epic number, the old epic's remaining
  stories were all *skipped* rather than committed — the one crossing that
  never reaches "Closing the epic" below and its `gh pr ready`. MUST check
  `gh pr view --json isDraft -q .isDraft` for the old branch/PR and, if
  `true`, run `gh pr ready` on it first — a skip-only ending MUST NOT leave
  a PR draft forever.
- Either way, MUST create the new branch:
  - MUST resolve the repo default base with
    `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` — MUST
    NOT hardcode `main` for this lookup. Today's default and the PR's own
    literal `--base main` below happen to agree, but a renamed default would
    otherwise silently branch from the wrong base while still opening PRs
    against the literal `main` that command names.
  - MUST run `git fetch origin <default>` then
    `git checkout -b <branch> origin/<default>`, and MUST update the
    journal's top-level `branch: <name>` and `pr: null` immediately.
  - A dirty tree here would be unexpected — `step-01-preflight.md` or
    `step-05-commit-gate.md` should already guarantee one — so if it happens
    anyway, MUST record the exact `git status --short` output and escalate
    under condition 5, never guess or discard anything.
- If the journal already names this epic's branch but it is not the branch
  currently checked out (a resumed run in a fresh session), MUST
  `git fetch origin <branch>` then `git checkout <branch>` rather than
  recreating it — recreating either fails outright or silently forks a
  divergent duplicate history, the same hazard condition 7 keeps out of this
  loop's own hands.

## After a commit: push, PR lifecycle, CI watch

Runs once per `phase: committed` event from `step-05-commit-gate.md`.

- MUST push: `git push -u origin <branch>` the first time this branch is
  pushed, `git push` on every later push. A rejected, non-fast-forward push
  MUST NOT be resolved by forcing it through — MUST record the rejection and
  escalate under condition 7; only a force-push fixes a divergence this loop
  never itself created; MUST NOT create one to worm past it.
- The journal's top-level `pr` field, not a commit count, is the single
  source of truth for whether this epic's PR is open — a HALT before
  recording a returned PR URL simply resumes below on retry, and the
  existing-PR check there absorbs the case where it was already created.

### `pr: null` — this push opens (or adopts) the draft PR

- MUST first check for an existing PR with `gh pr view --json url -q .url`
  (run with the branch checked out, so it resolves without a `--head` flag).
  If found — a resumed run, or a PR opened outside this loop — MUST adopt
  that URL into the journal's `pr` field and MUST NOT call `gh pr create`;
  calling it again on a branch with an open PR fails outright for nothing
  worth escalating on its own.
- Otherwise MUST run exactly `gh pr create --draft --base main --fill` and
  record the returned URL as the journal's `pr`. `.github/workflows/test.yml`
  triggers only on `push` to `main` and `pull_request` to `main`, so a
  feature-branch push alone produces no CI signal at all; opening this draft
  PR right after the epic's *first* commit, not at its end, is what gives
  every later story in the epic a live CI/Greptile signal while still fresh,
  instead of the run staying blind until the epic closes and inheriting a
  pile of failures from many stories at once. This reason applies every
  epic, not only this one — MUST NOT be "tidied" into a later trigger.
- A nonzero exit that is not "a PR already exists for this branch" (auth
  failure, network, API error) MUST NOT be retried silently — MUST record the
  exact error in the journal `note` and escalate under condition 5.

### Watching CI and Greptile

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
  CI never being queued is infrastructure, not a code finding.
- Once at least one check is reported, `--watch` itself has no ceiling of its
  own, so a check stuck queued or pending forever would hang it indefinitely
  — and nothing in `worker-waiting.md` applies, since this is not a
  dispatched worker. MUST wrap the watch in an external wall-clock bound of
  30 minutes; reaching it before every check concludes MUST be treated as
  inconclusive, never as a pass, and escalated under condition 5.
- MUST also check for a Greptile review on this push with `gh pr view --json
  reviews --jq '.reviews[] | select(.author.login | test("(?i)greptile"))'`.
  Unlike the CI workflow this repo defines and owns, Greptile is optional
  third-party infrastructure nothing here guarantees runs: MUST wait up to
  the same 30-minute bound for a review to appear, but MUST NOT escalate on
  its absence — MUST simply proceed as if this push carries no finding.
- A failing check, or a Greptile review that is not a plain approval, is
  **findings, not a verdict**: MUST route it through the same fix-then-panel
  cycle `step-04-review-panel.md` owns, reusing that step's `fix_rounds`
  count, three-round cap, and adjudication for this story exactly as written
  there — MUST NOT re-derive the loop, the cap, or the adjudication here. A
  fix lands as a **new** commit through `step-05-commit-gate.md` for the same
  story key — MUST NOT amend or rewrite the commit already on this branch —
  and this step then runs again on that new `phase: committed` event: push,
  watch again. When the cap is exhausted, MUST escalate under exactly the
  condition `step-04-review-panel.md`'s Fix round section names for it —
  never a condition of this step's own invention for a post-commit finding.
- Only once every reported check is green and no unresolved Greptile finding
  remains MUST this step proceed to the last-story check below.

## Closing the epic: ready, then the next branch

- MUST determine whether this was the epic's last backlog story by scanning
  `sprint-status.yaml` for any key matching the same `<n>-<n>-<name>` pattern
  `step-02-select-story.md` matches, restricted to this epic number, with
  status exactly `backlog` **and** not already `phase: skipped` in this run's
  journal — a permanently skipped story MUST NOT reserve this epic's
  boundary forever, since this run will never attempt it either.
- If any such key remains, MUST stop here and hand control back — the loop
  continues to the next story within the same epic and branch.
- If none remain, MUST mark the PR ready: `gh pr ready`. A nonzero exit MUST
  NOT be retried blindly — MUST check `gh pr view --json isDraft -q
  .isDraft`; `false` means it is already ready (idempotent), anything else
  MUST be recorded in the journal `note` and escalated under condition 5.
- MUST then create the next epic's branch and continue without asking, so
  the epic boundary never stalls waiting for a story that will never select
  it:
  - MUST derive a candidate next epic number by scanning
    `sprint-status.yaml` top to bottom for the first key matching the pattern
    above with status exactly `backlog` — pattern match only, MUST NOT
    evaluate `step-02-select-story.md`'s own dependency check here.
  - If no such key exists anywhere in the file, MUST NOT create a next
    branch — there is nothing left to prepare for, and
    `step-02-select-story.md`'s own "no candidate at all" case is what hands
    control back without a dispatch, not this step.
  - Otherwise MUST create and check out that epic's branch immediately, per
    "Ensuring the epic's branch" above, and MUST set the journal's top-level
    `epic`, `branch`, and `pr: null` to it.
  - Because this guess skips the dependency check, it MAY name a different
    epic than the one actually selected next, if the guessed epic turns out
    entirely dependency-blocked. MUST NOT treat that as an error — "Ensuring
    the epic's branch" above already reconciles the mismatch next time it
    runs, overwriting this provisional guess. The abandoned local branch
    carries no commits and was never pushed, so MUST NOT be deleted — it is
    inert, not an artifact condition 7 protects.

## Non-negotiables

- MUST NOT force-push, rewrite history (`commit --amend`, `rebase`, or
  similar), or delete an artifact for any reason here — each is condition 7's
  own irreversible-operation case and MUST escalate there instead.
- MUST NOT merge a PR at any point, draft or ready — the merge is the
  owner's call alone.

## Escalation

This step MUST escalate under exactly two of the seven conditions on its own
account, MUST continue on any other outcome, and MUST otherwise cite whatever
condition the routed-through step already names:

- Condition 5 — `gh pr create` failing for a reason other than an existing
  PR, `gh pr checks --watch` never getting a check queued or never
  concluding within its bound, `gh pr ready` failing past the `isDraft`
  check, or an unexpectedly dirty tree before a branch switch.
- Condition 7 — a non-fast-forward push rejection, or any operation that
  would require a force-push, a history rewrite, or deleting an artifact to
  proceed.
- A CI or Greptile finding that exhausts `step-04-review-panel.md`'s
  three-fix-round cap escalates under whichever of that step's own
  conditions (2 or 3) its Fix round section names — cited there, not
  restated here.

On any of these, MUST follow the HALT protocol in `SKILL.md`: write the
condition and this story's current `phase` to the journal and stop without a
further dispatch. This step opens no worker dispatch of its own, so there is
nothing here for `worker-waiting.md` or `worker-accounting.md` to release —
only a routed-through fix-round dispatch carries that obligation, and it is
`step-04-review-panel.md`'s own to discharge.
