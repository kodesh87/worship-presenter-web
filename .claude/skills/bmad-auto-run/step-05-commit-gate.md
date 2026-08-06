# Step 5: The commit gate

Carries one story from `phase: reviewed` (with `panel.confirmation: passed`)
to `phase: committed` with a recorded commit sha. This step MUST NOT run
until the journal shows that precondition for this story, set by
`step-04-review-panel.md`. It owns git for this story and opens no worker
dispatch, so `dispatch-recipes.md`, `worker-waiting.md`,
`worker-accounting.md`, and `artifact-repairs.md` do not apply here — every
action below runs as the coordinator itself.

## Final build, test, guard

- MUST first require `git branch --show-current` to equal the journal's
  `branch` field. Anything else — the repository default, another epic's
  branch, a detached HEAD — MUST escalate under condition 2 before building or
  staging: `step-06-epic-boundary.md` should have checked that branch out
  before `step-03-story-cycle.md` dispatched, so a mismatch means this story
  is about to be committed somewhere the loop never chose.
- MUST run `npm run build`, then `npm test`, in that order and MUST require
  both green — the suite includes a test that spawns the built server and
  throws unless `.next` exists, so the reverse order is not equivalent.
- MUST then run the guard command exactly as `SKILL.md` quotes it, character
  for character:

  ```
  node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs
  ```

  `npm test` already runs this file once, but this standalone run is
  `AGENTS.md`'s own commit-audit step 2 and MUST NOT be skipped as redundant.
- MUST NOT retry a red build, a red test, or a red guard run. A silent retry
  could mask an intermittent failure, the unwatched spin this design exists
  to prevent — one red result is enough to act on.
- A red guard MUST escalate under condition 1. MUST NOT weaken, skip, or
  narrow the guard to make it pass — in this repository the finding is the
  point.
- A red build or a red test that is not the guard MUST escalate under
  condition 2, the same broadening `step-01-preflight.md` applies to a red
  baseline. MUST NOT escalate under condition 5 — this is not infrastructure
  down — and MUST NOT be routed back into `step-04-review-panel.md`'s
  fix-round mechanism, whose job ended at `phase: reviewed`.
- On either escalation, MUST leave this story's `phase` unchanged (still
  `reviewed`): nothing here has committed anything yet, so nothing has
  advanced.

## Staging: refuse what must never be committed

- MUST run `git status --short` and read every reported path. MUST judge
  each path by name only, never by reading its content — this step inherits
  `SKILL.md`'s "MUST NOT read a diff" rule, and a content-level leak is the
  guard test's job above, not this manual check's.
- MUST refuse to stage any path matching `.env*`, `data/local/`,
  `data/uploads/`, `data.db*`, `slides*/`, `*.pptx`, `*.potx`, or that
  otherwise names a congregation, payment, or production-host artifact by
  its path alone — `AGENTS.md`'s "Never commit" list.
- MUST treat a path whose match against that list is unclear as a match: MUST
  NOT stage it and MUST NOT guess it is clean. Refusing an unclear path is the
  cheaper mistake.
- If any path is refused, MUST NOT stage or commit anything else for this
  story this cycle either — a partial commit around a refused path is still a
  decision about the change set's contents, and this step does not read the
  diff to make it safely. MUST escalate under condition 1: a hand-caught match
  against `AGENTS.md`'s own list is the same finding the automated guard exists
  to catch, and MUST NOT be worked around by the loop itself.
- Otherwise, MUST stage every remaining path individually by name. MUST NOT
  use `git add -A` or `git add .`, since either would stage a path this step
  never actually inspected.

## Writing the journal row before the commit

- MUST update this story's journal entry now, before running `git commit`:
  record that this loop — not a reviewer, whom `dispatch-recipes.md`'s
  read-only clause forbids the write, and not the owner — is what sets the
  story's `sprint-status.yaml` status under "Recording the sha" below, and
  that the owner's own review happens at the PR, so the recorded status is
  never mistaken for the owner's sign-off. MUST leave `phase` at `reviewed` and
  `commit` at `null` in this write — nothing has been committed yet, and
  writing `phase: committed` here would misstate that if the commit below
  never lands.
- This write is what makes a crash mid-commit legible: a resumed run reads
  `phase: reviewed` with a note saying the gate passed and a commit was
  attempted, so it checks `git log` instead of assuming either outcome.
- If writing this update to the journal file itself fails (for example, a
  disk or permission error), MUST NOT proceed to `git commit` below — there
  is nothing on disk yet for it to commit. MUST escalate under condition 2,
  the same bucket a red commit takes: this story cannot be committed right
  now for an ordinary reason, not the guard.

## Committing

- MUST run `git commit` with a message of the exact form
  `<story key>: <one-line summary>`, as the coordinator itself — never a
  dispatched worker commits. The fixed `<story key>: ` prefix MUST NOT be
  dropped for a generic summary: it is what the resume check below searches
  `git log` for. MUST NOT pass `--no-verify` and MUST NOT bypass commit
  signing.
- A nonzero exit MUST NOT be retried and MUST NOT be forced through with
  `--no-verify`. MUST record the failure output in the journal `note` and
  escalate under condition 2 — the guard already passed above, so a local
  hook failing here is an ordinary check failing, not infrastructure and not
  the guard. `phase` stays `reviewed`; nothing committed, nothing to
  advance.

## Recording the sha

- A commit cannot contain its own resulting hash, so the sha is recorded in
  a second, small commit. MUST update the journal entry to
  `phase: committed` and `commit: <the sha of the commit made under
  "Committing">`, MUST set this story's status to `done` in
  `_bmad-output/implementation-artifacts/sprint-status.yaml` and refresh that
  file's `last_updated`, MUST stage only those two files by name, and MUST
  commit them with the message `<story key>: record commit sha` (fixed,
  verbatim) — the coordinator again, no `--no-verify`, no bypassed signing.
  This exact, fixed message is what distinguishes this housekeeping commit
  from the code commit above during the resume check below.
- That status write is the coordinator's alone, and it is not optional
  bookkeeping: every review-class worker is forbidden to make it, and
  `step-02-select-story.md` takes the first `backlog` key, so a committed
  story left at `backlog` would be selected again on the next pass.
- If writing this journal update itself fails, MUST NOT run the housekeeping
  commit described in the bullet above — MUST escalate under condition 2, the
  same as a failure writing the pre-commit row: the code commit already
  landed, and the resume check below recovers it on the next attempt rather
  than guessing at a sha the journal was never able to record.
- A nonzero exit on this second commit MUST NOT be retried in place and MUST
  NOT be forced through with `--no-verify`; MUST record the failure output in
  the journal `note` and escalate under condition 2, as under "Committing"
  above — the code landed, but an unrecorded sha left unescalated is a silent
  gap this step exists to close.
- Once both commits have landed, this step's job ends and
  `step-06-epic-boundary.md` runs on that `phase: committed` event.

## Resuming after an interruption

The signature a resumed run keys on MUST be what git itself durably holds, not
the journal alone: the code commit under "Committing" can land while the process
dies before "Recording the sha" runs, leaving the journal at `phase: reviewed`
— indistinguishable, on that field, from a story with nothing committed.
Trusting it would re-run the gate and record a *second* commit holding only the
journal edit as the story's `commit`, orphaning the one that holds the work.

A story can also legitimately reach this step more than once. A post-commit
CI finding sends a committed story back through `step-04-review-panel.md` and
returns it here for a further code commit under the same story key, per
`step-06-epic-boundary.md`'s failing-check rule. So the check MUST count
commits against what the journal says to expect, and MUST NOT read a second
code commit as an ambiguity the loop created.

- Before running anything else in this step for the currently selected
  story, MUST read that story's `ci_rounds` from the journal — absent means
  zero — and MUST call `ci_rounds + 1` the **expected** number of code
  commits: one for the original gate, one for each post-commit CI round
  already routed back.
- MUST search `git log` for commits whose message matches the fixed
  `<story key>: ` prefix from "Committing" (for example,
  `git log --grep "^<story key>: " --oneline`), then MUST discard, from
  those results, any commit whose message is exactly the fixed
  `<story key>: record commit sha` housekeeping message from "Recording the
  sha" — the two searches use deliberately distinct fixed forms so one can
  be found without the other. Call what remains the code-commit matches, and
  the discarded ones the housekeeping matches.
- **Code-commit matches one fewer than expected** — this round's code commit
  has not landed yet, which on a story's first pass is zero of one. MUST
  proceed through the full gate from "Final build, test, guard" onward, as a
  fresh attempt.
- **Code-commit matches equal to expected, housekeeping matches equal too** —
  both commits for this round already landed and this story is fully
  committed at its current `ci_rounds`. MUST NOT repeat any part of the gate
  and MUST NOT create a further commit; there is nothing left for this step
  to do.
- **Code-commit matches equal to expected, housekeeping matches one fewer** —
  the code commit landed but the process died before "Recording the sha"
  completed. MUST NOT repeat the build, the test, the guard, the staging
  check, or the code commit. MUST take the **most recent** code-commit
  match's own hash as the sha to record — `git log` reports newest first —
  and never a freshly read `git rev-parse HEAD`, since HEAD may have moved on
  for a reason unrelated to this story by the time the run resumes. MUST then
  proceed directly to "Recording the sha" using it, whether or not the journal
  file's working copy already carries a matching, uncommitted edit from
  the interrupted attempt.
- **Any other pair of counts** — MUST NOT guess which commit holds the
  authoritative work. MUST record both counts and the expected number in the
  journal `note` and escalate under condition 2 rather than stage, commit, or
  pick one. More code commits than `ci_rounds` accounts for is the case the
  earlier more-than-one rule caught, and it stays an escalation.

## Escalation

This step MUST escalate under exactly two of the seven conditions, and MUST
continue on any other outcome:

- Condition 1 — the guard command fails, or a path refused by name under
  "Staging" above is found.
- Condition 2 — the build, the test suite, or the commit itself is red for a
  reason that is not the guard.

On either, MUST follow the HALT protocol in `SKILL.md` and stop without a
further dispatch. This step opens no worker dispatch of its own, so there is
nothing for `worker-waiting.md` or `worker-accounting.md` to release here.
