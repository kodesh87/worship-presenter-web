# Step 6: Epic boundary — branch, draft PR, CI watch, ready

Owns the branch and PR lifecycle across an epic: one branch per epic, a draft
PR opened after that epic's first commit, CI watched after every push, and
the PR marked ready once the epic's last backlog story lands. This step
opens no worker dispatch of its own — every action below runs as the
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
  nothing further — a previous story of this epic already checked it out.
- If it instead names a *different*, non-null epic number, an epic boundary
  is being crossed — this is the only place a branch switches, since
  branches are created reactively, never in advance. Before creating the new
  branch below, MUST first close the outgoing one: the previous epic's PR
  may already be ready (a normal last-story commit already marked it so via
  "Closing the epic" below) or may still be draft (its remaining stories
  were all *skipped* rather than committed — the one ending that never
  reaches that section's `gh pr ready`). Either way MUST check `gh pr view
  --json isDraft -q .isDraft` for the old branch/PR and, if `true`, run
  `gh pr ready` on it — a skip-only ending MUST NOT leave a PR draft forever.
- Either way — `branch` null (the run's first story, nothing to close) or
  corrected just above — MUST create the new branch:
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
  every later story in the epic a live CI signal (Greptile's check included)
  while still fresh, instead of the run staying blind until the epic closes
  and inheriting a pile of failures from many stories at once. This reason
  applies every epic, not only this one — MUST NOT be "tidied" into a later
  trigger.
- A nonzero exit that is not "a PR already exists for this branch" (auth
  failure, network, API error) MUST NOT be retried silently — MUST record the
  exact error in the journal `note` and escalate under condition 5.

### Watching what the push produced

- After every push, including the one that just opened the draft PR, MUST follow
  `ci-findings.md` exactly — the checks, the reviews, their bounds, and the
  routing of any finding back into `step-04-review-panel.md`'s fix cycle. MUST
  NOT reimplement any of it here.
- MUST NOT proceed to "Closing the epic" below until that file says this step
  may.

## Closing the epic: ready

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
- MUST then hand control back without a further dispatch — MUST NOT create
  the next epic's branch here. `step-02-select-story.md` selects the next
  story (in this epic, if any remain, or the next one entirely), and
  "Ensuring the epic's branch" above is the one place a branch is created —
  reactively, once selection has actually cleared that story's own
  dependency check, never as a guess ahead of it.

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
- A failing check that exhausts `step-04-review-panel.md`'s three-fix-round
  cap escalates under whichever of that step's own conditions (2 or 3) its
  Fix round section names — cited there, not restated here.

On any of these, MUST follow the HALT protocol in `SKILL.md`: write the
condition and this story's current `phase` to the journal and stop without a
further dispatch. This step opens no worker dispatch of its own, so there is
nothing here for `worker-waiting.md` or `worker-accounting.md` to release —
only a routed-through fix-round dispatch carries that obligation, and it is
`step-04-review-panel.md`'s own to discharge.
