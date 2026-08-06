# The unit's branch, before anything is dispatched

Which branch a story is worked on, and how the unit that owns it is resolved
from the run's mode. This is the first of the two points
`step-06-epic-boundary.md` runs at — before `step-03-story-cycle.md` dispatches
anything for a newly selected story. That step MUST follow this file there and
MUST NOT restate it; everything after the commit stays its own.

## The unit is a function of the run's mode

- MUST resolve the unit from the journal's recorded `mode` before deciding
  anything about a branch or a PR:
  - `mode: one-story` — the unit is **that story**. One branch, one PR, for it
    alone. An epic-scoped PR here would be a draft for an epic that will never
    finish, since the run stops after one story.
  - `mode: one-epic` and `mode: full` — the unit is the **epic**, exactly as
    before.
- The branch name MUST keep one shape across both:
  `<git config user.name>/<unit>-<id>-auto-<date>`, where `<unit>` is `epic` or
  `story`, `<id>` is the journal's top-level `epic` field or the story key that
  `step-02-select-story.md` just selected, and `<date>` is the date embedded in
  this run's own journal filename. It is fixed once recorded in the journal's
  `branch` and MUST NOT be regenerated on a later resume.
- `mode: one-story` has exactly one unit, so the journal's `branch` being
  non-null MUST be read as "this run's branch already exists" and nothing
  further done. That mode MUST NOT reach the boundary-crossing rule below, and
  MUST NOT create a second branch for any reason.

## Ensuring the unit's branch

- If the journal's `branch` already names this same unit, MUST do
  nothing further — a previous story of this epic already checked it out, or in
  `one-story` mode this run already created it.
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
- If the journal already names this unit's branch but it is not the branch
  currently checked out (a resumed run in a fresh session), MUST
  `git fetch origin <branch>` then `git checkout <branch>` rather than
  recreating it — recreating either fails outright or silently forks a
  divergent duplicate history, the same hazard condition 7 keeps out of this
  loop's own hands.

