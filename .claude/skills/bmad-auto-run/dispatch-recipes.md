# Dispatch recipes

This file is the one recipe every step in this skill MUST follow to bind or
create the Orca Run and start a worker. `step-03-story-cycle.md` uses it for
create, validate, and dev; later steps reuse it unchanged for the review
panel, the adjudicator, and any artifact-repair dispatch. A step file MUST
NOT reimplement this recipe inline — it MUST point back here instead. Once a
worker is started, waiting on it is `worker-waiting.md`'s job and accounting
for it is `worker-accounting.md`'s, not this file's — see the closing section
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
- A role with **no row** in that per-skill table — the adjudicator, the
  confirmation reviewer, and, strictly, the fifth reviewer's alternative —
  MUST resolve its tier from the role-to-dispatch table in
  `docs/bmad-auto-run-design.md`, which is the sanctioned record for exactly
  the roles that are not BMad skills, and MUST take its family constraint from
  the calling step. MUST NOT invent a per-skill row for such a role, and MUST
  NOT copy an id, an effort level, or a flag out of that table into this skill
  directory.
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

- If `run-create`, `run-list`, or `run-use` itself fails — including the case
  where `run-list` succeeds but the journal's `orca_run` is not in it — MUST
  retry that one command once, then MUST record the failure with its exact
  error and the `orca_run` being sought in the journal and escalate under
  condition 5. MUST NOT fall back to `run-create` on a resumed run to get past
  it: a second Run reads an empty mailbox and every prior worker's report is
  lost. This is the entry point of every interrupted run, so it MUST NOT be
  the one command in this recipe with no failure branch.

## `dispatch(role, task_spec) -> dispatch_id`

```
orca orchestration task-create --spec "<role>: <story key> — <the four elements below>" --json
orca terminal create --worktree active --title "<role>" --command "<assembled argv>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
```

- MUST run `task-create` once per dispatch. The `--spec` text is the whole of
  what the worker will be told, so it MUST lead with the role and the exact
  story key and MUST also carry, in that same text, all four of:
  - the **owning BMad skill and its intent**, named explicitly as resolved
    from the role map above. A worker handed only `validate story: <story
    key>` cannot reliably derive that it must run `bmad-create-story`'s
    validate intent rather than its create intent — that map is how the
    coordinator routes and is not visible to the worker, so the resolved
    skill and intent MUST be written into the spec rather than implied by the
    role name.
  - the **story key as the only target**, stated as the story to work on, so
    the worker MUST NOT auto-discover one of its own.
  - the **decision authority clause** the operator's global rules require of
    every dispatched worker's brief: the worker decides routine matters
    itself and reserves `orca orchestration ask` for a decision that would
    change a contract, an AC, or an artifact's authority.
    `worker-waiting.md`'s `question` and `escalation` branches both assume
    workers use `ask` that way, so the spec MUST say it rather than leave it
    to a worker's own defaults.
  - the **repair-reporting expectation**: if the role cannot proceed until a
    spec, architecture, or correct-course change happens, it MUST report that
    need rather than making the change itself, since the repair path in
    `artifact-repairs.md` is what owns that change.
- For a **review-class role** — any of the five panel reviewers, the
  adjudicator, and the confirmation reviewer — the `--spec` MUST also carry a
  fifth element, a **read-only clause**: the worker reviews and reports only,
  MUST report every finding in its `worker_done` body, and MUST NOT write the
  story file, `sprint-status.yaml`, or any other artifact, however its own
  skill would normally record a status. Without it the clause is missing where
  it matters most: all seven of those roles run `bmad-code-review`, which
  natively sets the story's Status section and rewrites `sprint-status.yaml`,
  and `step-04-review-panel.md` runs five of them in parallel in one worktree —
  so they become concurrent writers on two tracked files, and a single
  reviewer's inline verdict marks the story `done` before adjudication, before
  confirmation, and before the commit gate. The guide states the same rule
  from its own side: a review-only `worker_done` reports findings and
  authorizes no file edits.
- MUST wait for `tui-idle` before dispatching. A dispatch sent to a
  not-yet-ready TUI MUST NOT be recorded as that worker's `--outcome failed`,
  and a `tui-idle` match MUST NOT itself be taken as proof the worker has
  started the task — it only proves the terminal is ready to receive it.
- If `task-create`, `terminal create`, or `dispatch` itself fails, no worker
  exists yet and there is nothing to classify or release. MUST retry that one
  command once, then MUST record the failure in the journal with its exact
  error and escalate under condition 5. MUST NOT proceed to the next command
  in the recipe with a missing task id or handle. Where a terminal was already
  created before the failing command, MUST close it with
  `orca terminal close --terminal <handle> --json` — no dispatch owns it, so
  `worker-release` does not apply and leaving it would strand a terminal no
  journal entry names.
- On a `tui-idle` timeout the terminal is not ready and MUST NOT be
  dispatched to. MUST re-wait once with the same command, since a slow CLI
  start is ordinary; if it still never reaches `tui-idle`, MUST record the
  attempt with a `last_state` naming the timeout and escalate under condition
  5 — a CLI that will not come up is infrastructure down, and on an `agy`
  terminal it is most often the workspace-trust gate `step-01-preflight.md`
  checks. No dispatch exists yet, so `worker-release` does not apply and MUST
  NOT be attempted; MUST close the terminal this recipe created with
  `orca terminal close --terminal <handle> --json`.
- MUST record this dispatch's `role`, `family` (the CLI family actually
  used), `task`, `dispatch`, `terminal` (the same `<handle>` this recipe's own
  `terminal create` returned — `worker-show --dispatch <id> --json`'s
  `worker.agent_terminal_handle` field confirms the same value later if ever
  needed), and `started` (the moment the `dispatch` call returned) in the
  journal's per-story `dispatches` list as soon as each is known, with
  `outcome: pending` and `strikes: 0` — so a resumed run can find and account
  for a worker it did not itself start, can read which family an earlier one
  used, has the handle its liveness probes require, and inherits both
  per-dispatch bounds in `worker-waiting.md` instead of restarting them.

## The `agy` exception

`agy` cannot receive the injected orchestration preamble. For an `agy`
worker:

- MUST dispatch without `--inject`.
- MUST deliver the brief with
  `orca terminal send --terminal <handle> --text "<brief>" --enter --json`,
  and that brief MUST carry the `taskId`, the `dispatchId`, and the exact
  `worker_done` command verbatim — without the injected preamble the worker
  has no other way to learn any of the three.
- That brief MUST also carry everything the `--spec` above carries, all four
  elements included. `--inject` is what would otherwise deliver the spec, so
  an `agy` worker that receives only the three ids has been told the
  lifecycle and not the task.

## Waiting, settlement, and retry

Every dispatch this recipe starts MUST be waited on exactly as
`worker-waiting.md` describes — the Delivery/`--ack` discipline, the
`worker_done`/`escalation`/`question` branches, liveness classification for a
dispatch that never reports, and the wall-clock ceiling — and MUST then be
accounted for exactly as `worker-accounting.md` describes: settlement,
release, and the retry mechanics. Both files are reused unchanged by every
later step that dispatches a worker; MUST NOT restate either inline here or in
any step file.
