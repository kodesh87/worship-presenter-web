# Worker accounting

Waiting, ack discipline, liveness classification, settlement, release, and
retry — accounting for a worker that has stopped, or will not. Every step that
dispatches a worker MUST follow this file exactly for every dispatch
`dispatch-recipes.md` starts, and MUST NOT restate it inline in a step file.

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

  When a leg ends with nothing further to wait for, MUST acknowledge in the
  standalone form instead of fusing it to another wait:

  ```
  orca orchestration check --ack <delivery_id> --json
  ```

- A timeout or `{count: 0}` MUST be treated as a checkpoint, never a worker
  failure — the 900000ms window is the floor of the guide's 15-to-60-minute
  range for a real coding dispatch, not a deadline. MUST NOT retry or escalate
  on a bare timeout. Before rolling the wait again, MUST check liveness with
  `orca orchestration task-list --json`, `orca terminal read --terminal
  <handle> --json`, or `orca terminal wait --terminal <handle> --for tui-idle
  --timeout-ms 60000 --json`. A worker still visibly active MUST get another
  rolled wait, never a retry — until the wall-clock ceiling below is reached,
  which MUST be evaluated at this same checkpoint.
- If liveness instead shows the terminal exited, disappeared, or went idle
  without ever producing a report, MUST NOT guess what that means — MUST
  classify it with `orca orchestration worker-show --dispatch <id> --json`:
  - `ready`, with no independent sign the terminal has exited or
    disappeared — MUST treat it as still alive and roll the wait again, and
    MUST increment that dispatch's own `strikes` field in the journal for
    every classification that produced no new message, escalating under
    condition 5 at 3 (this skill's three-strikes bound) so the branch cannot
    spin silently. That count MUST be read from and written to the journal
    entry, never the session only: a resumed run would otherwise restart at
    zero and the bound would hold within one run instead of across the run's
    life. It is per `dispatches` entry, so one dispatch's strikes never bound
    another's.
  - `ready`, but the terminal HAS been independently observed to have exited
    or disappeared — MUST NOT roll another wait on `ready` alone; the guide
    names an exited or disappeared terminal as a reason to *stop* waiting.
    MUST instead take the `outcome_unknown` branch below.
  - `failed` or `stopped` — MUST treat it as a failed attempt and take the
    retry path in "Retrying a failed dispatch" below, using its
    never-settled branch — this dispatch never sent `worker_done`, so there
    is nothing for `worker-release` to act on.
  - `outcome_unknown` — MUST run `orca orchestration worker-stop --dispatch
    <id> --json` and classify once more with `worker-show`. This second
    classification is terminal, not another roll: a clean `failed`/`stopped`
    takes the retry path above; anything else — including a stray `ready`,
    which cannot be trusted against a terminal `worker-stop` just closed —
    MUST run `orca orchestration worker-abandon --dispatch <id> --json` and
    escalate under condition 5. `worker-abandon` fences the dispatch and
    performs no process or filesystem action — resources may still be live —
    so the journal's HALT record MUST NOT imply this worker was stopped or
    cleaned up, only that the loop could no longer prove its state.
  - If `worker-stop` itself fails — the terminal is already gone, or Orca
    cannot prove the identity it would close — MUST NOT retry it and MUST NOT
    read its failure as a verdict about the worker. MUST record what it
    reported in `last_state` and proceed to the same second classification,
    which already ends in `worker-abandon` plus condition 5 for anything
    other than a clean `failed`/`stopped`. A failed `worker-stop` MUST NOT be
    counted as having closed the terminal, so the leave-it-live carve-out in
    "Settlement and accounting" MUST NOT be applied after one.
  - Any other result MUST NOT be guessed at. If `worker-show` reports this
    dispatch has already settled — which a resumed run reading a stale
    `pending` entry can hit — the report itself is durable in the bound Run's
    Delivery, so MUST roll the wait once more to collect it and then take the
    settlement path below; if it still does not arrive within the same
    3-strike bound, MUST escalate under condition 5. If `worker-show` errors,
    or cannot resolve the dispatch at all, MUST take the `outcome_unknown`
    branch above rather than inventing a fourth verdict.
- An `escalation` MUST get its own branch, distinct from a `question` — a
  worker sends it only when ownership is valid and the coordinator must
  intervene. On all three sub-branches below, MUST record the escalating
  worker's `role`, `family`, `task`, `dispatch`, `terminal`, and `last_state`
  with `outcome: unsettled` — an `escalation` is one of the seven
  non-settlement states, so it is never released whichever branch runs next:
  - If it reports that an artifact repair is needed, MUST take the calling
    step's repair-dispatch path for that artifact, including that path's own
    bounds on repeating a repair — this branch MUST NOT be read as a way into
    an unbounded repair-then-resume cycle.
  - If it names one of the seven conditions, MUST follow the HALT protocol in
    `SKILL.md` under that condition.
  - Otherwise, MUST treat the leg as blocked, retry once, then escalate under
    condition 5.
- A `question` MUST get an explicit branch: reply with
  `orca orchestration reply --id <message_id> --body "<answer>" --json` when
  the answer is inside this loop's own authority, or escalate — per the calling
  step's own escalation rules, which MUST name where such a question lands
  instead of leaving it pending against a condition that does not exist — when
  it would change a contract, an AC, or an artifact's authority. MUST NOT use
  `gate-create` for a worker's `question`; that command is for
  coordinator-managed task-DAG decisions only, not for answering an `ask`.

## The wall-clock ceiling

Every other bound here is a strike count, and a strike count cannot terminate
a worker that stays alive and keeps emitting activity: for that worker the
guide's rolling wait never ends, which is right for a supervised run and
leaves an unattended one with no terminating condition at all. This ceiling is
therefore an addition for unattended use, not a reading of the guide, and it
MUST NOT be used to stop a worker — the guide forbids stopping, closing,
killing, or restarting one merely because it has not reported yet.

- MUST measure elapsed time from the dispatch's `started` field, recorded at
  dispatch time by `dispatch-recipes.md`, never from the current session's
  start — a resumed run inherits the elapsed clock as it inherits `strikes`.
- MUST evaluate the ceiling at every liveness checkpoint, which is where a
  rolled 900000ms window already lands the loop.
- The ceiling MUST be 60 minutes for a role that neither writes nor reviews
  code — create story, validate story, an artifact repair: the top of the
  guide's own 15-to-60-minute range for a real coding task, so a non-coding
  dispatch past it is already outside anything the guide calls normal.
- The ceiling MUST be 120 minutes for a role that implements or reviews code
  — dev story, a reviewer, the adjudicator: double that upper bound, so
  exhaustion means the dispatch is outside the guide's normal twice over
  rather than merely a large story taking its time.
- On exhaustion MUST record that dispatch `outcome: unsettled` with a
  `last_state` naming the ceiling and what was last observed, then MUST
  escalate under condition 5 and leave the terminal live per the settlement
  rule below. MUST NOT run `worker-stop`, `worker-abandon`, or a retry on
  exhaustion alone: nothing about the worker has been proven, only that the
  loop waited longer than this design will wait unattended. These ceilings can
  afford to be tight precisely because the worker is left running — a ceiling
  reached early costs one resumable HALT, while no ceiling at all costs a run
  that never ends.

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
  MUST close it explicitly with
  `orca terminal close --terminal <handle> --json` — this skill never reuses a
  terminal, so any terminal it created is safe to close once its dispatch is
  settled, and the guide promises a follow-up recovery command only for the
  next case. Where the receipt instead reports `release_pending` or
  `release_unknown`, MUST follow that receipt's own recovery action exactly —
  MUST NOT substitute `terminal close` there, and MUST NOT guess.
- MUST NOT attempt release for a dispatch that never settled — the guide
  forbids it; that is the reason, not evidence preservation, since a released
  or closed worker's output stays readable through
  `worker-read --dispatch <id> --json`. This covers a HALT reached while a
  dispatch is still outstanding, a dead dispatch classified `failed` or
  `stopped` above without ever sending `worker_done`, and a dispatch that
  exhausted its ceiling. For all three, MUST instead record that dispatch's
  `role`, `family`, `task`, `dispatch`, `terminal`, and `last_state` with
  `outcome: unsettled`, and MUST leave the terminal live for the owner to
  diagnose — unless a `worker-stop` already closed it during classification
  above, in which case there is no terminal left to leave live and the journal
  record plus `worker-read` preserves the evidence instead.

## Retrying a failed dispatch

- After 3 consecutive failures Orca circuit-breaks the task and marks it
  failed, so a retry MUST NOT re-dispatch the task that already failed.
  `worker-start --retry-of` is the guide's own retry path and is unavailable
  here for the same reason `worker-start` is.
- For a dispatch settled by `worker_done --outcome failed`, MUST release the
  failed worker first (per the settlement rule above), then create a
  **fresh task** with `task-create` for the second attempt, then dispatch it
  through this same recipe from `terminal create` onward.
- For a dispatch that never settled — classified `failed` or `stopped` by
  `worker-show` above, or an `escalation` that the escalation branch's third
  sub-branch routes here — MUST skip the release attempt (nothing settled
  exists to release) and go straight from recording it (`outcome: unsettled`)
  to the fresh `task-create`.
- Either way, MUST record both task ids in the journal's `dispatches` list,
  each with its own `dispatch` id and `outcome`.
