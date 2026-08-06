# Step 5: The commit gate

Carries one story from `phase: reviewed` (with `panel.confirmation: passed`)
to `phase: committed` with a recorded commit sha. This step MUST NOT run
until the journal shows that precondition for this story, set by
`step-04-review-panel.md`. This step owns git for this story: it opens no
worker dispatch, so `dispatch-recipes.md`, `worker-waiting.md`, and
`worker-accounting.md` do not apply here — every action below runs as the
coordinator itself.

## Final build, test, guard

- MUST run `npm run build`, then `npm test`, in that order — the suite
  includes a test that spawns the built server and throws unless `.next`
  exists, so testing before building is not an equivalent ordering. MUST
  require both green.
- MUST then run the guard command exactly as `SKILL.md` quotes it, character
  for character:

  ```
  node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs
  ```

  `npm test` already runs this file once as one of its registered tests;
  this second, standalone run is `AGENTS.md`'s own commit-audit step 2,
  repeated here deliberately as the last check before staging, and MUST NOT
  be skipped as redundant with the run inside `npm test`.
- MUST NOT retry a red build, a red test, or a red guard run. A silent retry
  could mask a test that only fails intermittently, which is exactly the
  unwatched spin this design exists to prevent — one red result is enough to
  act on.
- A red guard MUST escalate under condition 1. MUST NOT weaken, skip, or
  narrow the guard to make it pass — in this repository the finding is the
  point.
- A red build or a red test that is not the guard MUST escalate under
  condition 2, the same broadening `step-01-preflight.md` already applies to
  a red pre-flight baseline. MUST NOT escalate under condition 5, since a
  red build or test here is not infrastructure down, and MUST NOT be routed
  back into `step-04-review-panel.md`'s fix-round mechanism — that step's own
  job already ended at `phase: reviewed`.
- On either escalation, MUST leave this story's `phase` unchanged (still
  `reviewed`): nothing here has committed anything yet, so nothing has
  advanced.

## Staging: refuse what must never be committed

- MUST run `git status --short` and read every reported path. MUST judge
  each path by name only, never by reading its content — this step inherits
  the same "MUST NOT read a diff" rule `SKILL.md` states for the whole
  skill. A content-level leak (a real name, a payment QR image, private text
  inside a tracked file) is the guard test's job above, not this manual
  check's.
- MUST refuse to stage any path matching `.env*`, `data/local/`,
  `data/uploads/`, `data.db*`, `slides*/`, `*.pptx`, `*.potx`, or that
  otherwise names a congregation, payment, or production-host artifact by
  its path alone — `AGENTS.md`'s "Never commit" list.
- MUST treat a path whose match against that list is unclear the same as a
  match: MUST NOT stage it and MUST NOT guess it is clean. `AGENTS.md`
  itself prefers not producing such a value over blocking it after the
  fact; refusing an unclear path is the cheaper mistake.
- If any path is refused, MUST NOT stage or commit anything else for this
  story this cycle either — a partial commit around a refused path is still
  a decision about what the story's change set contains, and this step does
  not read the diff to make that decision safely. MUST escalate under
  condition 1: a hand-caught match against `AGENTS.md`'s own list is the
  same finding the automated guard exists to catch, whichever caught it
  first, and it MUST NOT be worked around by the loop itself.
- Otherwise, MUST stage every remaining path individually by name. MUST NOT
  use `git add -A` or `git add .`, since either would stage a path this step
  never actually inspected.

## Writing the journal row before the commit

- MUST update this story's journal entry now, before running `git commit`:
  record that this loop is the one setting the story's `sprint-status.yaml`
  status (`bmad-code-review` sets it to `done` natively) and that the
  owner's own review happens at the PR, so the recorded status is never
  mistaken for the owner's sign-off. MUST leave `phase` at `reviewed` and
  `commit` at `null` in this write — nothing has been committed yet, and
  writing `phase: committed` here would misstate that if the commit below
  never lands.
- This write is what makes a crash mid-commit legible: if the process dies
  during `git commit` below, a resumed run reads `phase: reviewed` with a
  note recording that the gate passed and a commit was attempted, and knows
  to check `git log` for whether it actually landed rather than either
  assuming success or blindly re-running a gate that may have already
  produced a commit.

## Committing

- MUST run `git commit` with a message naming this story's key, as the
  coordinator itself — never a dispatched worker commits. MUST NOT pass
  `--no-verify` and MUST NOT bypass commit signing.
- A nonzero exit MUST NOT be retried and MUST NOT be forced through with
  `--no-verify`. MUST record the failure output in the journal `note` and
  escalate under condition 2 — the guard already passed above, so a local
  hook failing here is an ordinary check failing, not infrastructure and not
  the guard. `phase` stays `reviewed`; nothing committed, nothing to
  advance.
- On a zero exit, MUST capture the resulting sha with `git rev-parse HEAD`.

## Recording the sha

- A commit cannot contain its own resulting hash, so the sha is recorded in
  a second, small commit: update the journal entry to `phase: committed` and
  `commit: <the captured sha>`, stage only the journal file by name, and
  commit it — the coordinator again, no `--no-verify`, no bypassed signing.
- A nonzero exit on this second commit MUST NOT be retried in place and MUST
  NOT be forced through with `--no-verify`; MUST record the failure output
  in the journal `note` and escalate under condition 2, the same as a
  nonzero exit under "Committing" above — the story's code already landed,
  but an unrecorded sha left unescalated is a silent gap this step exists to
  close, not a cosmetic one to wave through.
- Once both commits have landed, this step's job ends.
  `step-02-select-story.md` picks the next story once it observes
  `phase: committed` here.

## Resuming after an interruption

- If this second commit is interrupted, the working tree still holds the
  corrected journal entry uncommitted, with the code commit from
  "Committing" already landed. Before gating whichever story is currently
  selected, MUST check for exactly this signature — an earlier story already
  reads `phase: committed` in the journal while `git status --short` shows
  only the journal file modified and nothing else — and if found, MUST
  finish that one pending commit first: `git add` the journal file only,
  then commit.
- MUST NOT repeat the build, the test, the guard, or the staging check for
  that earlier story in this case: its code commit already succeeded, and
  re-running the gate would judge a tree it has already left.
- MUST NOT proceed past this check on a partial or ambiguous match — for
  example, an earlier `phase: committed` story found alongside other
  modified paths that are not the journal file, which is not the signature
  above. MUST NOT guess which of those paths belong to the pending sha
  fix-up and which belong to the newly selected story; MUST record the
  ambiguity in the journal `note` and escalate under condition 2 rather than
  stage or commit anything.

## Escalation

This step MUST escalate under exactly two of the seven conditions, and MUST
continue on any other outcome:

- Condition 1 — the guard command fails, or a path refused by name under
  "Staging" above is found.
- Condition 2 — the build, the test suite, or the commit itself is red for a
  reason that is not the guard.

On either, MUST follow the HALT protocol in `SKILL.md`: write the condition
and this story's current `phase` to the journal, and stop without a further
dispatch. This step opens no worker dispatch of its own, so there is nothing
for `worker-waiting.md` or `worker-accounting.md` to release or record here.
