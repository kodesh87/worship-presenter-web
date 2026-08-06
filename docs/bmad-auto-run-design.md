# Design: `bmad-auto-run`

Date: 2026-08-06
Status: approved by the owner, not yet implemented

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

## Non-goals

- No headless Orca automation or cron driver. Escalation has nowhere to land in
  a headless run, and interactively-authenticated MCP servers can be absent.
- No automatic epic retrospectives. Their tracked status is `optional`.
- No worktree per story. One worktree per epic — which also means the `agy`
  workspace-trust gate is cleared once per epic instead of once per story.

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
role takes, because those rows offer several:

| Role | Dispatch |
|---|---|
| create story | the `claude` alternative at `high` |
| validate story | the `codex` alternative at `high` — a different session *and* a different family from the creator |
| dev story (initial) | the `claude` alternative at `high` |
| dev story (fix) | same; `xhigh` from the second fix round on |
| review panel | the four mandated `agy` reviewers plus a fifth from a family other than the one that ran dev |
| adjudicator | the `claude` alternative at `high` |
| spec / architecture / correct-course updates | the `claude` alternative at `high` |

The two `agy` model ids are the mandated pair of `pro-low` and `flash-high`,
never `pro-high`, which this account silently serves as flash-high and which
would collapse two reviewers into one model.

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

`bmad-code-review` sets `done` natively. The journal records that the loop set
it and that the owner's review happens at the PR, so the status stays honest.

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

Before every commit, with no exception: `npm run build && npm test` green, the
public-repo guard green, and nothing forbidden staged. A guard failure stops the
run and escalates. The loop may never weaken the guard — the finding is the
point. Commit, push, and PR are always the coordinator's, never a worker's.

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

## Pre-flight, once per run

Orca reachable; the version-matched orchestration guide read from the binary;
`claude`, `codex`, and `agy` accounts usable; the `agy` workspace-trust gate
cleared for the worktree path; `gh auth status` good; the tree clean; and a
baseline `npm run build && npm test` green *before the first story*, so an
inherited failure is never charged to the story that happened to run next.

## Escalation: the complete list

1. The public-repo guard fails, or the commit gate's own staging inspection
   catches a forbidden path by hand — the guard is one detector of that
   harm, not its definition.
2. The same test fails identically after three fix rounds, or the pre-flight
   baseline is red before the first story is even selected.
3. The fifth reviewer or the confirmation reviewer still reports a blocker
   after three fix rounds.
4. Every remaining backlog story is dependency-blocked.
5. Infrastructure is down — Orca, a worker, an expired auth, the `agy` trust gate.
6. A correct-course run would change a PRD-level goal, retire an epic, or
   renumber an existing `AD-n`.
7. An irreversible operation would be required — force-push, history rewrite,
   deleting an artifact. These are never automatic.

Anything else: continue. The owner's standing instruction is that escalations
which merely confirm a recommendation are ceremony, and ceremony is the cost
this skill exists to remove.
