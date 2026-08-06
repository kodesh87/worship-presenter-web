# Step 6: The branch and PR boundary — branch, draft PR, CI watch, ready

Owns the branch and PR lifecycle: one branch and one PR per **unit**, a draft PR
opened after that unit's first commit, CI watched after every push, and the PR
marked ready once the unit has no remaining work. This step opens no worker
dispatch of its own — every action runs as the coordinator, exactly like
`step-05-commit-gate.md`, so `dispatch-recipes.md`, `worker-waiting.md`, and
`worker-accounting.md` do not apply here. It runs at two points:

- **Before `step-03-story-cycle.md` dispatches anything** for a newly
  selected story — to ensure the unit's branch exists and is checked out.
- **Immediately after `step-05-commit-gate.md` records `phase: committed`**
  — to push, manage the PR, and watch CI.

The first point is `branch-setup.md`'s: it resolves the unit from the run's mode
and ensures that unit's branch is checked out. This step MUST follow that file
there and MUST NOT restate it. Everything below is the second point.

## After a commit: push, PR lifecycle, CI watch

Runs once per `phase: committed` event from `step-05-commit-gate.md`.

- MUST push: `git push -u origin <branch>` the first time this branch is
  pushed, `git push` on every later push. A rejected, non-fast-forward push
  MUST NOT be resolved by forcing it through — MUST record the rejection and
  escalate under condition 7; only a force-push fixes a divergence this loop
  never itself created; MUST NOT create one to worm past it.
- The journal's top-level `pr` field, not a commit count, is the single
  source of truth for whether this unit's PR is open — a HALT before
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
  PR right after the **run's first** commit, not at the unit's end, is what
  gives every later story a live CI signal (Greptile's check and its review
  both) while still fresh, instead of staying blind until the unit closes and
  inheriting a pile of failures at once. This reason holds for every unit and
  every mode — MUST NOT be "tidied" into a later trigger.
- A nonzero exit that is not "a PR already exists for this branch" (auth
  failure, network, API error) MUST NOT be retried silently — MUST record the
  exact error in the journal `note` and escalate under condition 5.

### The `one-story` stop

Reached in `mode: one-story` only, once the commit has been pushed and the PR
opened or adopted. In every other mode this section MUST do nothing at all.

- MUST watch the checks and read the reviews through `ci-findings.md`, with the
  bounds that file already specifies. Stopping before the watch would mark work
  reviewable without knowing whether its checks passed; a watch is a bounded
  wait, not a second story's work.
- MUST NOT enter that file's fix cycle, and MUST NOT dispatch a fix of any
  kind. This mode exists so the owner sees what the machinery did; the fix
  decision is theirs.
- **Every check green and no Greptile finding** — MUST mark the PR ready with
  `gh pr ready`, under the same `isDraft` idempotency and the same condition-5
  branch as "Closing the epic" below, then stop. The run produced one complete,
  reviewable story.
- **A red check, or a Greptile finding** — MUST leave the PR a draft, and MUST
  record the failing check names or the routed comment ids in the journal so the
  owner sees exactly what was found without re-deriving it.
- Either way MUST set `stopped: scope reached` and stop cleanly per `SKILL.md`'s
  scope-mode rules — not a HALT, and MUST NOT write a `halted:` condition on the
  story. A red check here is the mode working, not the run failing.

### Watching what the push produced

- In `mode: one-epic` and `mode: full`, after every push including the one that
  just opened the draft PR, MUST follow `ci-findings.md` exactly — the checks,
  the reviews, their bounds, and the routing of any finding back into
  `step-04-review-panel.md`'s fix cycle. MUST NOT reimplement any of it here.
  Both modes run it identically: an epic is not finished until its checks are
  green.
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
- In `mode: one-epic` the run MUST stop once that `gh pr ready` has succeeded,
  instead of handing control back. This is the mode's whole difference from
  `full`: everything up to and including the ready PR is identical. MUST set
  `stopped: scope reached` and stop cleanly per `SKILL.md`'s scope-mode rules —
  not a HALT, and no `halted:` condition. Where the run was resumed mid-epic,
  "its epic" MUST be the one the journal's `epic` field names, never an epic
  inferred from the story in hand.
- Otherwise MUST hand control back without a further dispatch — MUST NOT create
  the next epic's branch here. `step-02-select-story.md` selects the next
  story (in this epic, if any remain, or the next one entirely), and
  `branch-setup.md` is the one place a branch is created —
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
