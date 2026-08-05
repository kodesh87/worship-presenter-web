# Dispatch recipes

This file is the one recipe every step in this skill MUST follow to start and
account for a worker. `step-03-story-cycle.md` uses it for create, validate,
and dev; later steps reuse it unchanged for the review panel, the
adjudicator, and any artifact-repair dispatch. A step file MUST NOT
reimplement this recipe inline — it MUST point back here instead.

## Why the low-level path, not `worker-start`

`orca orchestration worker-start` composes worktree, terminal, readiness, and
dispatch in one call and looks like the obvious choice. It MUST NOT be used
by this skill: it accepts only `--agent <id>` and exposes no flag for model,
effort, or permission mode, and every worker this skill starts carries all
three. Recording this here is deliberate — a later reader who "simplifies" a
step back onto `worker-start` would silently lose the model/effort/unattended
argv this whole design depends on. That is why every dispatch instead
composes `terminal create` → `terminal wait --for tui-idle` → `dispatch`,
spelled out below.

## Resolve CLI, model, and effort — never write one down here

- MUST resolve the CLI, model, and effort for a role by opening the
  corresponding row of the per-skill routing table in the operator's global
  Orca Agent Dispatch rules — loaded in every session — never from memory or
  from a prior run's output.
- MUST assemble the dispatch argv's model flag, effort flag, and unattended
  flag from that CLI's own row in the CLI table (the table with the
  `Command`, `Model`, `Effort`, and `Unattended` columns). MUST NOT spell a
  model id, an effort level, or a flag out in this file or any other file in
  this skill directory — the structural test's banned-literal check exists to
  catch exactly that regression.
- Role → BMad skill map for the roles this skill dispatches so far: "create
  story" is `bmad-create-story`'s create intent; "validate story" is
  `bmad-create-story`'s validate intent; "dev story" is `bmad-dev-story`'s
  initial intent (its fix intent is a later step's concern). A later step MAY
  add further roles to this map — the review panel, the adjudicator, an
  artifact-repair dispatch — each resolved the same way, against that role's
  own skill row.
- Where a routing row offers more than one CLI alternative, MUST pick any one
  of them unless the calling step states a constraint (for example, "a
  different family than the creator"). That constraint MUST be honored by the
  calling step; this file only supplies the mechanism.

## `dispatch(role, task_spec) -> dispatch_id`

Once per run, before the first dispatch:

```
orca orchestration run-create --objective "<run id>" --json
```

For every dispatch:

```
orca orchestration task-create --spec "<role>: <story key>" --json
orca terminal create --worktree active --title "<role>" --command "<assembled argv>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

- MUST run `task-create` once per dispatch, naming the role and the exact
  story key in `--spec` — never left for the worker to infer.
- MUST wait for `tui-idle` before dispatching. A dispatch sent to a
  not-yet-ready TUI MUST NOT be recorded as that worker's `--outcome failed`.
- MUST always run `check --wait` and let it return one of `worker_done`,
  `escalation`, or `question` before acting. Which of the three arrived, and
  what to do about it, is the calling step's decision — this recipe only
  guarantees the wait happens before that decision is made.
- MUST record the returned `dispatch_id` in the journal as soon as it is
  known, so a resumed run can find and account for a worker it did not itself
  start.

## The `agy` exception

`agy` cannot receive the injected orchestration preamble. For an `agy`
worker:

- MUST dispatch without `--inject`.
- MUST deliver the brief with
  `orca terminal send --terminal <handle> --text "<brief>" --enter --json`,
  and that brief MUST carry the `taskId`, the `dispatchId`, and the exact
  `worker_done` command verbatim — without the injected preamble the worker
  has no other way to learn any of the three.

## Accounting for a worker afterwards

- MUST treat only a settled report as grounds for cleanup. MUST NOT release
  on a timeout, an idle state, a heartbeat, or a rejected report — none of
  those is settlement.
- On a settled report, MUST attempt
  `orca orchestration worker-release --dispatch <id> --json`.
- Where that receipt reports the terminal retained as pre-existing, MUST
  close the terminal explicitly — `worker-release` does not close a terminal
  it did not create.
- MUST NOT leave a worker unaccounted for across a resume: the HALT protocol
  in `SKILL.md` already forbids leaving a terminal unaccounted for on
  escalation, and this accounting rule is what makes that requirement
  possible to satisfy.
