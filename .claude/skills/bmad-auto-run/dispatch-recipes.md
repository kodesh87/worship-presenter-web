# Dispatch recipes

This file is the one recipe every step in this skill MUST follow to bind or
create the Orca Run, start a worker, wait on it, and account for it
afterward. `step-03-story-cycle.md` uses it for create, validate, and dev;
later steps reuse it unchanged for the review panel, the adjudicator, and any
artifact-repair dispatch. A step file MUST NOT reimplement this recipe inline
— it MUST point back here instead.

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
accounting for a settled worker always takes the release branch below, never
a transfer to a follow-up task on the same terminal.

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

## Waiting: the Delivery batch, `--ack`, and what each type means

```
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

- A `check --wait` returns one Delivery batch (up to 50 messages) and
  **replays that same batch** until it is acknowledged. MUST process the
  batch message by message and MUST match each message's `dispatch_id`
  against the dispatch being awaited before acting on it — MUST NOT assume
  the first message in a batch belongs to the dispatch just started.
- MUST NOT acknowledge until every message in the batch, and every release
  decision that follows from it, has been handled. Only then MUST the
  Delivery be acknowledged, in the same call that opens the next wait:

  ```
  orca orchestration check --ack <delivery_id> --wait --types worker_done,escalation,question --timeout-ms 900000 --json
  ```

- A timeout or `{count: 0}` MUST be treated as a checkpoint, never as a
  worker failure — real coding dispatches run 15 to 60 minutes, and the
  900000ms window is the floor of that range, not a deadline. MUST NOT retry
  or escalate on a bare timeout. Before rolling the wait again, MUST check
  liveness with `orca orchestration task-list --json`,
  `orca terminal read --terminal <handle> --json`, or
  `orca terminal wait --terminal <handle> --for tui-idle` — a worker still
  visibly active MUST get another rolled wait, never a retry. Only a
  terminal that has exited, disappeared, or gone idle without ever producing
  a report is a genuine failure.
- A `question` MUST get an explicit branch: reply with
  `orca orchestration reply --id <message_id> --body "<answer>" --json` when
  the answer is inside this loop's own authority, or escalate — per the
  calling step's own escalation rules — when it would change a contract, an
  AC, or an artifact's authority. MUST NOT use `gate-create` for a worker's
  `question`; that command is for coordinator-managed task-DAG decisions
  only, not for answering a worker's `ask`.

## The `agy` exception

`agy` cannot receive the injected orchestration preamble. For an `agy`
worker:

- MUST dispatch without `--inject`.
- MUST deliver the brief with
  `orca terminal send --terminal <handle> --text "<brief>" --enter --json`,
  and that brief MUST carry the `taskId`, the `dispatchId`, and the exact
  `worker_done` command verbatim — without the injected preamble the worker
  has no other way to learn any of the three.

## Settlement and accounting

- `worker_done` settles a dispatch under **either** outcome: `--outcome
  succeeded` and `--outcome failed` are both settled and both MUST be
  released the same way. MUST NOT treat `--outcome failed` as unsettled or
  as forbidden to release.
- The forbidden-to-release states are exactly seven: a timeout, a TUI-idle
  state, a heartbeat, a `status` message, a `question`, an `escalation`, and
  a rejected or stale `worker_done`. MUST NOT release a worker for any of
  these seven — none of them is settlement.
- On a settled report, MUST attempt
  `orca orchestration worker-release --dispatch <id> --json` and record the
  outcome (`succeeded`/`failed`) against that dispatch's journal entry. Where
  the receipt reports the terminal retained (for example as pre-existing),
  MUST close it explicitly — this skill never reuses a terminal, so any
  terminal this recipe created is always safe to close once its dispatch is
  settled. Where the receipt instead reports `release_pending` or
  `release_unknown`, MUST NOT substitute `terminal close` — MUST follow the
  exact recovery action the receipt itself returns.
- MUST NOT attempt release for a dispatch that never settled. A worker down,
  or any HALT reached while a dispatch is still outstanding, is exactly that
  case — there is nothing settled to release. For those, MUST instead record
  that dispatch's `role`, `family`, `task`, `dispatch`, and last known state
  in the journal with `outcome: pending`, and MUST leave the terminal live —
  the owner needs it to diagnose the halt, and releasing it would destroy
  the evidence.

## Retrying a failed dispatch

- After 3 consecutive failures Orca circuit-breaks the task and marks it
  failed, so a retry MUST NOT re-dispatch the task that already failed.
  `worker-start --retry-of` is the guide's own retry path and is unavailable
  here for the same reason `worker-start` is.
- MUST retry mechanically as: release the failed worker first (per the
  settlement rule above), then create a **fresh task** with `task-create` for
  the second attempt, then dispatch it through this same recipe from
  `terminal create` onward. MUST record both task ids in the journal's
  `dispatches` list, each with its own `dispatch` id and `outcome`.
