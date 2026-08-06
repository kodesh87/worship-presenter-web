# The commit and push audit

`AGENTS.md`'s commit audit is literal: "Before **every** `git commit` and
**every** `git push`". This file states that rule once and names every point in
this skill it binds. `step-05-commit-gate.md` and `step-06-epic-boundary.md` are
the only steps that commit or push; both MUST follow this file at every such
point and MUST NOT restate it inline.

## The rule

- Every `git commit` and every `git push` this skill makes MUST be immediately
  preceded by the guard command `SKILL.md` quotes, character for character.
  There is no exception, and "the guard already ran earlier in this step" is not
  one.
- The reason is mechanical rather than ceremonial: this repository is public and
  the guard's scan set is the index, which
  `tests/public-repo-guard.test.mjs` builds from `git ls-files`. Anything staged
  after a guard run was outside that set when it ran, so committing it commits
  content nobody inspected, and pushing it publishes that content.
- The run of the same file inside `npm test` MUST NOT be treated as satisfying
  this. It happens before staging, so it inspects a different index.

## The three points, and it MUST be all three

1. **The code commit** — `step-05-commit-gate.md`'s guard section, after staging
   and immediately before the commit.
2. **The sha-recording commit** — the same step's "Recording the sha". Of the
   three this is the likeliest to carry a leak, because the journal deliberately
   captures arbitrary worker output in `note` and `last_state`: a build failure,
   a `git status --short`, a worker's own question text. Any of those can hold a
   path, a hostname, or a person's name.
3. **The push** — `step-06-epic-boundary.md`'s push. The boundary where content
   actually becomes public.

A fix aimed at one of these MUST NOT be taken as covering the others, and a
later reader MUST NOT drop one as redundant with another. Every reviewer on this
branch verified that the guard *command* matched `AGENTS.md` character for
character; none asked whether it ran everywhere `AGENTS.md` requires. The string
was checked and the coverage never was, which is how two of the three points
shipped unguarded.

## When the guard comes back red

- MUST escalate under condition 1, at every one of the three points, and MUST
  NOT weaken, skip, or narrow the guard to get past it — in this repository the
  finding is the point.
- MUST NOT commit, MUST NOT push, and MUST NOT unstage or reset anything. MUST
  record every staged path and the guard's own output in the journal `note`: the
  owner needs to see exactly what tripped it, and undoing the staging destroys
  that evidence.
- **At point 1** nothing has landed. The story's `phase` MUST stay `reviewed`.
- **At point 2** the code commit has already landed and the journal is mid-write.
  This is recoverable rather than a dead end, and MUST NOT be treated as one:
  `commit-resume.md`'s "code-commit matches equal to expected, housekeeping
  matches one fewer" branch is exactly this state, so a resumed run takes the
  matched commit's own sha and re-enters "Recording the sha" — where this audit
  binds again. The story's `phase` MUST stay `reviewed` until that housekeeping
  commit lands, exactly as that step already requires.
- **At point 3** the commits are landed locally and nothing is published. MUST
  NOT reset, revert, or force anything to tidy it: the owner can inspect a local
  branch and cannot un-publish a pushed one.
