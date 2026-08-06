# Step 5: The commit gate

Carries one story from `phase: reviewed` (with `panel.confirmation: passed`)
to `phase: committed` with a recorded commit sha. This step MUST NOT run
until the journal shows that precondition for this story, set by
`step-04-review-panel.md`. It owns git for this story and opens no worker
dispatch, so `dispatch-recipes.md`, `worker-waiting.md`,
`worker-accounting.md`, and `artifact-repairs.md` do not apply here — every
action below runs as the coordinator itself.

## Resuming after an interruption

- Before running anything below for the currently selected story, MUST follow
  `commit-resume.md` — it decides, from what git durably holds rather than from
  the journal alone, which parts of this step a resumed run MUST repeat and
  which it MUST NOT. MUST NOT reimplement that decision here.

## Final build and test

- MUST first require `git branch --show-current` to equal the journal's
  `branch` field. Anything else — the repository default, another epic's
  branch, a detached HEAD — MUST escalate under condition 2 before building or
  staging: `step-06-epic-boundary.md` should have checked that branch out
  before `step-03-story-cycle.md` dispatched, so a mismatch means this story
  is about to be committed somewhere the loop never chose.
- MUST run `npm run build`, then `npm test`, in that order and MUST require
  both green — the suite includes a test that spawns the built server and
  throws unless `.next` exists, so the reverse order is not equivalent.
- MUST NOT retry a red build or a red test. A silent retry could mask an
  intermittent failure, the unwatched spin this design exists to prevent —
  one red result is enough to act on.
- A red build or a red test MUST escalate under condition 2, the same
  broadening `step-01-preflight.md` applies to a red baseline. MUST NOT
  escalate under condition 5 — this is not infrastructure down — and MUST NOT
  be routed back into `step-04-review-panel.md`'s fix-round mechanism, whose
  job ended at `phase: reviewed`.
- On that escalation, MUST leave this story's `phase` unchanged (still
  `reviewed`): nothing here has committed anything yet. The guard is **not**
  run in this section; it runs after staging, for the reason its own section
  below gives. Build and test need no staging and MUST stay here.

## Staging: refuse what must never be committed

- MUST run `git status --short` and read every reported path. MUST judge
  each path by name only, never by reading its content — this step inherits
  `SKILL.md`'s "MUST NOT read a diff" rule, and a content-level leak is the
  guard's job below, not this manual check's.
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

## The guard: after staging, immediately before the commit

- MUST run the guard exactly as `git-audit.md` requires — this is that file's
  point 1, and everything about running it and about a red result lives there.
- This ordering is load-bearing and MUST NOT be moved back above staging, nor
  folded into a section titled for the build and test. The guard's scan set is
  the index, so run before staging it cannot see the content of a file a story
  worker left untracked — such a file, under a path the list above does not
  name, passes the path check, gets staged, and gets committed, and the guard
  reports it on the *next* run, once it is already public history. In this
  repository that is the one failure that cannot be walked back.
- MUST NOT retry a red guard run.

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
  file's `last_updated`, MUST stage only those two files by name, MUST then run
  the guard exactly as `git-audit.md` requires — this is that file's point 2, and
  the likeliest of the three to catch a leak, since the journal carries whatever
  a worker reported — and MUST commit them with the message
  `<story key>: record commit sha` (fixed, verbatim) — the coordinator again, no
  `--no-verify`, no bypassed signing.
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
