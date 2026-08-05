# Dispatch recipes

This file is the one recipe every step in this skill MUST follow to bind or
create the Orca Run and start a worker. `step-03-story-cycle.md` uses it for
create, validate, and dev; later steps reuse it unchanged for the review
panel, the adjudicator, and any artifact-repair dispatch. A step file MUST
NOT reimplement this recipe inline — it MUST point back here instead. Once a
worker is started, waiting on it and accounting for it is
`worker-accounting.md`'s job, not this file's — see the closing section
below.

## Why the low-level path, not `worker-start`

`orca orchestration worker-start` composes worktree, terminal, readiness, and
dispatch in one call and looks like the obvious choice. It MUST NOT be used
by this skill: it accepts only `--agent <id>` and exposes no flag for model,
effort, or permission mode, and every worker this skill starts carries all
three. Recording this here is deliberate — a later reader who "simplifies" a
step back onto `worker-start` would silently lose the model/effort/unattended
argv this whole design depends on. That is why every dispatch instead
composes `terminal create` → `terminal wait --for tui-idle` → `dispatch`,
spelled out below. This skill also MUST NOT reuse a worker's terminal for a
follow-up dispatch — every dispatch gets its own fresh terminal — so
accounting for a settled worker, per `worker-accounting.md`, always takes the
release branch, never a transfer to a follow-up task on the same terminal.

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

## Binding the Orca Run

- On a fresh run (no journal entry to resume), MUST create exactly one Run
  before the first dispatch, with a human-readable `--objective` naming this
  run's own id (the journal's `run:` field) rather than a bare identifier —
  `run-list` is how a resumed session finds this Run again, and a bare id is
  not distinguishable in that listing:

  ```
  orca orchestration run-create --objective "bmad-auto-run <run id>" --json
  ```

  MUST record the returned run id as the journal's `orca_run` field
  immediately.

- On a resumed run, MUST NOT call `run-create` again — a second Run reads an
  empty mailbox and never receives a prior worker's report. MUST instead find
  the journal's `orca_run` in `orca orchestration run-list --json` and bind
  this terminal to it:

  ```
  orca orchestration run-use --id <orca_run> --json
  ```

## `dispatch(role, task_spec) -> dispatch_id`

```
orca orchestration task-create --spec "<role>: <story key>" --json
orca terminal create --worktree active --title "<role>" --command "<assembled argv>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
```

- MUST run `task-create` once per dispatch, naming the role and the exact
  story key in `--spec` — never left for the worker to infer.
- MUST wait for `tui-idle` before dispatching. A dispatch sent to a
  not-yet-ready TUI MUST NOT be recorded as that worker's `--outcome failed`,
  and a `tui-idle` match MUST NOT itself be taken as proof the worker has
  started the task — it only proves the terminal is ready to receive it.
- MUST record this dispatch's `role`, `family` (the CLI family actually
  used), `task`, and `dispatch` in the journal's per-story `dispatches` list
  as soon as each is known, with `outcome: pending` — so a resumed run can
  find and account for a worker it did not itself start, and so a later
  dispatch can read which family an earlier one used.

## The `agy` exception

`agy` cannot receive the injected orchestration preamble. For an `agy`
worker:

- MUST dispatch without `--inject`.
- MUST deliver the brief with
  `orca terminal send --terminal <handle> --text "<brief>" --enter --json`,
  and that brief MUST carry the `taskId`, the `dispatchId`, and the exact
  `worker_done` command verbatim — without the injected preamble the worker
  has no other way to learn any of the three.

## Waiting, settlement, and retry

Every dispatch this recipe starts MUST be waited on and accounted for
exactly as `worker-accounting.md` describes — the Delivery/`--ack`
discipline, the `worker_done`/`escalation`/`question` branches, liveness
classification for a dispatch that never reports, settlement and release,
and the retry mechanics. That file is reused unchanged by every later step
that dispatches a worker; MUST NOT restate it inline here or in any step
file.
