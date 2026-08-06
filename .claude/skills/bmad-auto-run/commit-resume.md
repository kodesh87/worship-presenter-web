# Resuming the commit gate after an interruption

Which parts of `step-05-commit-gate.md` a resumed run MUST repeat and which it
MUST NOT, decided from what git durably holds rather than from the journal
alone. That step MUST follow this file before running anything else for the
currently selected story, and MUST NOT restate it inline.

The signature a resumed run keys on MUST be what git itself durably holds, not
the journal alone: the code commit under "Committing" can land while the process
dies before "Recording the sha" runs, leaving the journal at `phase: reviewed`
— indistinguishable, on that field, from a story with nothing committed.
Trusting it would re-run the gate and record a *second* commit holding only the
journal edit as the story's `commit`, orphaning the one that holds the work.

A story can also legitimately reach that step more than once. A post-commit
CI finding sends a committed story back through `step-04-review-panel.md` and
returns it there for a further code commit under the same story key, per
`step-06-epic-boundary.md`'s failing-check rule. So the check MUST count
commits against what the journal says to expect, and MUST NOT read a second
code commit as an ambiguity the loop created.

- Before running anything else in `step-05-commit-gate.md` for the currently
  selected story, MUST read that story's `ci_rounds` from the journal — absent
  means zero — and MUST call `ci_rounds + 1` the **expected** number of code
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
  proceed through the full gate from "Final build and test" onward, as a
  fresh attempt.
- **Code-commit matches equal to expected, housekeeping matches equal too** —
  both commits for this round already landed and this story is fully
  committed at its current `ci_rounds`. MUST NOT repeat any part of the gate
  and MUST NOT create a further commit; there is nothing left for that step
  to do.
- **Code-commit matches equal to expected, housekeeping matches one fewer** —
  the code commit landed but the process died before "Recording the sha"
  completed. MUST NOT repeat the build, the test, the staging check, the guard,
  or the code commit. MUST take the **most recent** code-commit
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
