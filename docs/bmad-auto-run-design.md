# Design: `bmad-auto-run`

Date: 2026-08-06
Status: approved by the owner and implemented, under
[the implementation plan](./bmad-auto-run-plan.md), which is the task-by-task
record of how this design was built and where it was corrected. The skill itself
lives in `.claude/skills/bmad-auto-run/`; where this record and those files
disagree, the files govern and this record MUST be corrected in the same change
set.

A skill that drives the BMad cycle across many stories and many epics without
human interaction, stopping only on the seven conditions listed in
[Escalation](#escalation-the-complete-list).

## Purpose

Today each BMad step is invoked by hand: `bmad-create-story`, then validate in a
fresh session, then `bmad-dev-story`, then a five-reviewer `bmad-code-review`
panel, then commit / push / PR, then watch CI. The steps are already scripted;
the *sequencing* is not, so the owner spends attention on ceremony that carries
no decision. `bmad-auto-run` owns the sequencing.

Not a replacement for `bmad-dev-auto`. That skill is **one unattended dev
iteration**. This one is the driver across stories and epics, and it dispatches
the existing skills rather than reimplementing them.

## Scope modes

The run takes one optional scope mode. This closes a gap the first design had:
the epic boundary is a *PR* boundary, not a stop — step-06 marks the PR ready and
hands control back, and step-02 then takes the next `backlog` key regardless of
epic — so the only scope was the whole backlog, 22 stories across 8 epics, whose
only exits were an escalation or killing the session. Killing the session strands
live Orca workers, which is the one outcome the accounting protocol exists to
prevent.

| Argument | Stops |
|---|---|
| *(none)* | backlog exhausted, or a condition escalates |
| `dry-run` | after printing the plan; mutates nothing |
| `one-story` | after the first story is committed, pushed, its checks watched, and its PR readied or left draft |
| `one-epic` | after its epic's PR is marked ready |

**The branch and PR unit is a function of the mode.** `one-story` takes one branch
and one PR for that story — an epic-scoped PR there would be a draft for an epic
that will never finish, which is the parked draft-PR defect reached by design
rather than by a skip tail. `one-epic` and bare keep one branch and one PR per
epic. The branch name holds one shape across both,
`<user>/<unit>-<id>-auto-<date>`, with `<unit>` `epic` or `story`.

Four modes, one skill, the mode as an argument and a journal field. Not four
skills: the cycle is identical in all of them and only the stop point differs, so
separate skills would duplicate a thirteen-file instruction set and triplicate the
structural test's seven-condition and step-index invariants — the drift class six
review rounds went into killing.

`one-story` stops after the push and the PR, not after the commit: an unpushed
commit means CI never sees the work, and observing the machinery is the mode's
whole purpose. It **watches** the checks — marking a PR ready without knowing
they passed is sloppy, and a watch is a bounded wait rather than a second story's
work — then marks the PR ready if they are green, or leaves it a draft and records
the failing check names or routed comment ids if they are not. It never enters the
*fix* cycle: the fix decision is the owner's, which is what the mode is for.
`one-epic` behaves exactly as the default does within its epic, checks and
CI-findings cycle included, then stops instead of handing control back.

At any clean stop, a still-draft PR whose unit has no remaining selectable work is
marked ready. That is what closes the skip-tail ending for the epic-scoped modes,
and it belongs to the stop rather than to story selection.

Both are **clean stops, not HALTs**, recorded as such: an owner who cannot tell a
scope stop from an escalation will read a normal ending as a failure. Two rules
carry the weight. An unrecognised argument stops and reports rather than falling
through, because a typo falling through reaches the most expensive mode there is.
And the mode is read from the journal on resume, because a `one-story` run that
halts and resumes would otherwise widen to the full backlog exactly when nobody
is watching — which is also why the mode is data, not skill identity.

## Non-goals

- No headless Orca automation or cron driver. Escalation has nowhere to land in
  a headless run, and interactively-authenticated MCP servers can be absent.
- No automatic epic retrospectives. Their tracked status is `optional`.
- No worktree per story — and, as implemented, no worktree per epic either.
  Every worker runs in the **active** worktree and the per-epic unit is a
  *branch*, not a checkout, which is the simpler choice and the one the skill
  files encode. So the `agy` workspace-trust gate is cleared once for that one
  worktree path, and pre-flight proves it with a probe rather than asserting
  it.

## Architecture

**A thin coordinator.** The invoking session never reads a story file, product
code, or a diff. It reads `sprint-status.yaml`, dispatches workers, reads their
status summaries, writes the journal, and owns git. Every heavy step runs in a
worker, so coordinator context stays small across a whole epic.

This is also the answer to "compact between stories": no tool can invoke
`/compact`, so the design keeps the coordinator small structurally instead of
relying on a compaction command that does not exist.

**Workers are Orca terminals, dispatched**, not in-process subagents. Two
reasons: the review panel requires more than one CLI family, and the operator's
global Orca Agent Dispatch rules require this path. Workers reach the
coordinator only through `orchestration ask`.

The composed `orchestration worker-start` cannot be used here, and the reason
should be stated so nobody later "simplifies" the loop back onto it. It accepts
`--agent <id>` and exposes no flag for model, effort, or permission mode — the
orchestration guide says so directly, naming custom agent argv as the case that
requires the low-level path. Every worker in this design carries a model, an
effort, and an unattended flag, so every worker takes that path:

```
orca terminal create --worktree active --title <role> --command "<exact argv>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
```

One exception, already known to the operator's rules: `agy` cannot receive the
injected orchestration preamble. Its four reviewers are dispatched **without**
`--inject`, and their brief — carrying `taskId`, `dispatchId`, and the exact
`worker_done` command verbatim — is delivered with `orca terminal send`.

Because these terminals are coordinator-created rather than `worker-start`-owned,
cleanup follows each receipt rather than an assumption: attempt
`worker-release --dispatch <id>`, and where the receipt reports the terminal
retained as pre-existing, close it explicitly.

**Routing** follows the Orca Agent Dispatch table in the operator's global rules,
which is loaded in every session. This design records only which alternative each
role takes, because those rows offer several. Three of the roles below — the
adjudicator, the confirmation reviewer, and the fifth reviewer's alternative —
have no row of their own in that per-skill table because they are not BMad
skills, so this table is the sanctioned source a skill file resolves their tier
from; the skill files still MUST NOT copy an id, an effort level, or a flag out
of it.

| Role | Dispatch |
|---|---|
| create story | the `claude` alternative at `high` |
| validate story | the `codex` alternative at `high` — a different session *and* a different family from the creator |
| dev story (initial) | the `claude` alternative at `high` |
| dev story (fix) | same; `xhigh` from the second fix round on |
| review panel | the four mandated `agy` reviewers plus a fifth from a family other than the one that ran dev |
| adjudicator | the `claude` alternative at `high` |
| spec / architecture / correct-course updates | the `claude` alternative at `high` |

The two `agy` reviewer rows are the pair the operator's panel rule mandates, and
the row that same rule excludes stays excluded: one row is silently served as
another, so pairing those two would collapse the panel's two intended models
into one. The ids belong to the operator's own rules, not to this repository —
read them there, and confirm what is actually being served with pre-flight's
`agy` probe rather than trusting either source.

**The journal** lives at
`_bmad-output/implementation-artifacts/auto-run/<date>-journal.md` and is
committed alongside each story. It is the resume source: if the session dies or
context is compacted, the loop re-reads the journal rather than its own memory.
It is also the audit trail the owner reads *instead of* watching the run.

## Per-story cycle

```
select the first backlog story, top-down, from sprint-status.yaml
  └─ dependencies unmet? → skip it, record why, take the next one (not an escalation)
create story        → validate (different session and family)
dev story
review panel        → five reviewers in parallel, one round
adjudicate          → one worker reads all five outputs plus the code,
                      emits a single merged fix list and a pass/fail
  ├─ blockers → dev story fix → panel again
  └─ clean → confirmation review → commit gate
```

Story selection matches what `bmad-create-story` actually does: it takes the
first story whose status is `backlog`, reading top to bottom. Status `review`
blocks nothing. Dependency checks are therefore this skill's job, not the
method's — and an unmet dependency is a skip, not a stop. Only when *every*
remaining backlog story is blocked does the run escalate.

`bmad-code-review` sets `done` natively, and every reviewer runs it in the same
worktree — so review-class workers are dispatched **read-only**: they report
findings and write nothing. The status write is the coordinator's, made once at
the commit gate. The journal records that the loop set it and that the owner's
review happens at the PR, so the status stays honest.

## Artifact repairs taken mid-run

A step can report that it cannot proceed until an artifact is repaired. The loop
dispatches the repair itself and resumes — a spec update, an architecture spine
update, or a correct-course run — because each of those is an execution
decision once the story's acceptance criteria are already approved. The
`AGENTS.md` process gate is satisfied by dispatching the owning skill, never by
editing the artifact directly from the coordinator.

Correct-course is the one with a ceiling, and the ceiling is escalation
condition 6: it may reconcile drift and adjust delivery, but the moment it would
move a PRD-level goal, retire an epic, or renumber an existing `AD-n`, the run
stops. That boundary is the owner's own stated condition — autonomy holds *as
long as the agreed application goal still holds* — and it is the last brake in a
loop with no human in it, because a run that can rewrite the definition of done
can also declare itself done.

`bmad-quick-dev` is not part of the story cycle; `bmad-dev-story` is the path
for anything a story owns. Quick-dev is dispatched only for a scoped repair that
belongs to no story, such as fixing an inherited test failure found at
pre-flight.

## The review panel, and two holes it has to close

`bmad-code-review` already fans out internally into three adversarial layers.
The mandated five-reviewer panel sits on top: five workers each run the skill.
One consequence cannot be designed away — `agy` may only *be* a worker and
cannot spawn, so the four `agy` reviewers run their review inline without those
three layers. Only the fifth reviewer gets the full internal panel. That is an
argument for the existing rule that the fifth reviewer's findings are never
outvoted, not a reason to weaken it.

Two failures already recorded in this repository are encoded as rules:

**`agy` reviewers pass documentation defects.** On Story 17.6 both mandated
`agy` votes passed a change set that carried four real defects. So: on a
documentation-heavy change set, `agy` agreement is not evidence, and every
finding from the fifth reviewer must reach a verified disposition.

**Nobody reads the final state.** Story 17.6's own record says it plainly — the
panel reviewed the pre-fix tree, two fix rounds then closed four findings *and*
touched three sites no reviewer had flagged, and only the coordinator verified
the result. So: after the last fix round, one confirmation reviewer from a
family other than the fixer's reads the final state before the commit gate. One
worker, and it closes a hole that has already opened twice.

## Commit gate and PR boundary

Before every commit, with no exception: `npm run build && npm test` green,
nothing forbidden staged, and the public-repo guard green. A guard failure stops
the run and escalates. The loop may never weaken the guard — the finding is the
point. Commit, push, and PR are always the coordinator's, never a worker's.

**The guard runs at every commit and every push, and after staging rather than
before it.** Two separate rules, both learned from Greptile findings on this
branch, and the first is the one nobody checked. `AGENTS.md` says "before
**every** `git commit` and **every** `git push`", and the skill ran it once: the
code commit was covered, the sha-recording commit and the push were not. The
sha-recording commit is the likeliest of the three to leak, because the journal
deliberately captures arbitrary worker output — build failures, `git status`
output, a worker's question text — in `note` and `last_state`, any of which can
hold a path, a hostname, or a name. The rule is now stated once, with all three
points named, and each step cites it. The lesson generalises past this defect:
every reviewer verified the guard *command* was character-identical to
`AGENTS.md`, and none asked whether it ran everywhere `AGENTS.md` requires — the
string was checked and the coverage never was.

**And the guard runs after staging, not before it.** Its scan set is the index
(`git ls-files`), and an untracked file joins that set only when it is staged.
Run first, it cannot see the content of a file a story worker left untracked, so
such a file under a path the denylist does not name would be committed and only
reported on the following run — already public. Verified rather than reasoned
about: staging a new file puts it in `git ls-files` immediately. A guard that
fails after staging leaves the staging in place, records the staged paths, and
escalates; unstaging automatically would destroy the evidence the owner needs.

The PR boundary is the **epic**. Per epic: a branch, a draft PR opened after the
first story's commit, and ready-for-review after the last story of that epic
passes. Then a new branch for the next epic and the loop continues without
asking.

The draft PR opens early for a concrete reason: `.github/workflows/test.yml`
triggers only on `push` to `main` and `pull_request` to `main`, so pushing a
feature branch produces no CI signal at all. Without an open PR the run is blind
until the end and then inherits a pile of failures from many stories at once.
With one, Node.js CI and the Greptile review run per push and a failure surfaces
while its story is still fresh. CI or Greptile findings enter the same
dev-fix-then-review cycle.

**Greptile is watched twice, and the reason is a defect this project already
shipped.** A review-based detector was removed from the loop on the strength of
PR #35, where Greptile posted only a status check. PR #36 disproved the
generalisation: the `Greptile Review` check passed while Greptile posted a review
as `greptile-apps`, state `COMMENTED`, body empty, carrying a correct P1 security
finding as an inline comment — the very defect above, which a check-only detector
had no way to see. So the loop gates on the check rollup *and* reads the reviews:
the review body is not the findings, the inline comments are, they come from
`pulls/<n>/comments` where the author login is `greptile-apps[bot]` rather than
`greptile-apps`, and routed comment ids are recorded so a closed finding is not
re-found. Two observations of one integration were enough to be wrong twice; the
detector is now keyed on verified fields, not on inference.

## Pre-flight, once per run

Orca reachable; the version-matched orchestration guide read from the binary;
`claude`, `codex`, and `agy` accounts usable; `gh auth status` good; the tree
clean; and a baseline `npm run build && npm test` green *before the first
story*, so an inherited failure is never charged to the story that happened to
run next.

The `agy` workspace-trust gate has no read-only check, so a declarative
precondition would be a rule with no detector. Instead one probe — a terminal
per mandated `agy` row, real runs only — proves the gate and reveals each row's
served model at the same time. In dry-run mode both are reported unverified,
because the probe is the one pre-flight check that cannot run without creating
a terminal.

## Escalation: the complete list

1. The public-repo guard fails, or the commit gate's own staging inspection
   catches a forbidden path by hand — the guard is one detector of that
   harm, not its definition.
2. The same test fails identically after three fix rounds, the pre-flight
   baseline is red before the first story is even selected, or the commit gate
   cannot complete for an ordinary local reason that is not the guard — a red
   build or test, a failed journal write, a rejected commit, or a branch or
   commit history it cannot reconcile.
3. The fifth reviewer or the confirmation reviewer still reports a blocker
   after three fix rounds.
4. Every remaining backlog story is dependency-blocked.
5. Infrastructure is down — Orca, a worker, an expired auth, the `agy` trust
   gate, or an `agy` account serving one model where the panel requires two.
6. A correct-course run would change a PRD-level goal, retire an epic, or
   renumber an existing `AD-n`.
7. An irreversible operation would be required — force-push, history rewrite,
   deleting an artifact. These are never automatic.

Anything else: continue. The owner's standing instruction is that escalations
which merely confirm a recommendation are ceremony, and ceremony is the cost
this skill exists to remove.

## Known defects, shipped deliberately

One finding from the final review is still parked with a ruling rather than fixed.
It is recorded here rather than left in a git-ignored scratch file, because a
defect nobody wrote down is a defect the next reader rediscovers the hard way.

Two others that stood here have since been closed by the scope-mode work, and the
reasoning that parked them is worth keeping. *The last unit's PR could stay a
draft* — parked because closing it seemed to hand story selection a PR
responsibility it should not own. That was true of story selection and false of
the run's own clean stop, which is where the check now lives, so no step gained a
duty that is not its own. *One stale trigger phrase* — story selection naming
`phase: committed` as its trigger — is now worded to agree with the per-story
cycle instead of contradicting it.

**A crash between the commit gate's two adjacent writes can leave work
uncommitted.** The journal's `phase: committed` and the story's `done` in
`sprint-status.yaml` are written one after the other. If the first lands and the
second does not, a resumed run may re-create and re-develop that story; the
gate's refusal to make a second code commit for one story key then catches it,
so the new work stays uncommitted in the tree rather than landing twice. Bounded
and self-limiting, but a narrow window. It stays open deliberately: closing it
would mean merging two commits that are separate on purpose, because a commit
cannot contain its own hash.

Two things this design has never had verified, stated so they are not mistaken
for covered: no run has executed against a live story, and the five-reviewer
panel's cost per story is unmeasured. The dry run proved the skill inert and
proved it selects the story a human would; it proved nothing about what happens
after the first worker starts.
