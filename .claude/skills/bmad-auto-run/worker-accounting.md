# Worker accounting

Waiting, ack discipline, liveness classification, settlement, release, and
retry — accounting for a worker that has stopped, or will not. Split out of
`dispatch-recipes.md` once three rounds of findings landed exclusively here.
Every step that dispatches a worker — `step-03-story-cycle.md` today, and
later the review panel, the adjudicator, and any artifact-repair dispatch —
MUST follow this file exactly for every dispatch `dispatch-recipes.md`
starts. MUST NOT restate it inline in a step file.

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

- A timeout or `{count: 0}` MUST be treated as a checkpoint, never as a
  worker failure — real coding dispatches run 15 to 60 minutes, and the
  900000ms window is the floor of that range, not a deadline. MUST NOT retry
  or escalate on a bare timeout. Before rolling the wait again, MUST check
  liveness with `orca orchestration task-list --json`,
  `orca terminal read --terminal <handle> --json`, or
  `orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000
  --json`. A worker still visibly active MUST get another rolled wait, never
  a retry.
- If liveness instead shows the terminal exited, disappeared, or went idle
  without ever producing a report, MUST NOT guess what that means — MUST
  classify it with `orca orchestration worker-show --dispatch <id> --json`:
  - `ready`, with no independent sign the terminal has exited or
    disappeared — MUST treat it as still alive and roll the wait again, up
    to 3 classifications that produce no new message (matching this skill's
    other three-strikes bounds), then MUST escalate under condition 5 so
    this branch cannot spin silently.
  - `ready`, but the terminal HAS been independently observed to have
    exited or disappeared — MUST NOT roll another wait on `ready` alone; the
    guide names an exited or disappeared terminal as a reason to *stop*
    waiting, not continue. MUST instead take the `outcome_unknown` branch
    below.
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
- An `escalation` MUST also get an explicit branch, distinct from a
  `question` — a worker sends this only when ownership is valid and the
  coordinator must intervene. On every one of the three sub-branches below,
  MUST record the escalating worker's `role`, `family`, `task`, `dispatch`,
  `terminal`, and `last_state` in the journal with `outcome: unsettled` — an
  `escalation` is one of the seven non-settlement states, so this worker is
  never released, whichever branch runs next:
  - If it reports that an artifact repair is needed, MUST take the calling
    step's repair-dispatch path for that artifact.
  - If it names one of the seven conditions, MUST follow the HALT protocol in
    `SKILL.md` under that condition.
  - Otherwise, MUST treat the leg as blocked, retry once, then escalate under
    condition 5.
- A `question` MUST get an explicit branch: reply with
  `orca orchestration reply --id <message_id> --body "<answer>" --json` when
  the answer is inside this loop's own authority, or escalate — per the
  calling step's own escalation rules — when it would change a contract, an
  AC, or an artifact's authority. MUST NOT use `gate-create` for a worker's
  `question`; that command is for coordinator-managed task-DAG decisions
  only, not for answering a worker's `ask`.

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
  `orca terminal close --terminal <handle> --json` — this skill never reuses
  a terminal, so any terminal this recipe created is always safe to close
  once its dispatch is settled, and the guide does not promise a follow-up
  command for this case the way it does for the next one. Where the receipt
  instead reports `release_pending` or `release_unknown`, MUST follow that
  receipt's own recovery action exactly — MUST NOT substitute
  `terminal close` there, and MUST NOT guess.
- MUST NOT attempt release for a dispatch that never settled — the guide
  forbids releasing a dispatch that has not settled; that is the reason, not
  evidence preservation, since a released or closed worker's output stays
  readable through `worker-read --dispatch <id> --json`. This covers both a
  HALT reached while a dispatch is still outstanding, and a dead dispatch
  classified `failed` or `stopped` by `worker-show` above without ever
  sending `worker_done`. For either, MUST instead record that dispatch's
  `role`, `family`, `task`, `dispatch`, `terminal`, and `last_state` in the
  journal with `outcome: unsettled`. MUST leave the terminal live for the
  owner to diagnose — unless `worker-stop` already closed it during
  classification above, in which case there is no terminal left to leave
  live, and the journal record plus `worker-read` is what preserves the
  evidence instead.

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
  `worker-show` above — MUST skip the release attempt (nothing settled
  exists to release) and go straight from recording it (`outcome: unsettled`)
  to the fresh `task-create`.
- Either way, MUST record both task ids in the journal's `dispatches` list,
  each with its own `dispatch` id and `outcome`.
