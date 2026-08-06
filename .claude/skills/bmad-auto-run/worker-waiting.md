# Worker waiting

Waiting, ack discipline, the message-type branches, liveness classification, and
the wall-clock ceiling — everything the loop does while a dispatch is still
outstanding. Once a dispatch stops being outstanding, `worker-accounting.md`
takes over with settlement, release, and retry. Every step that dispatches a
worker MUST follow this file exactly for every dispatch `dispatch-recipes.md`
starts, and MUST NOT restate it inline.

## Waiting: the Delivery batch, `--ack`, and what each type means

```
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

- Before opening **any** wait — the first, and every re-open after a reply, a
  release, or a timeout — MUST evaluate every outstanding dispatch's wall-clock
  ceiling below. The ceiling MUST NOT be attached to the timeout branch alone: a
  worker returning an in-`--types` message inside every window never times out,
  never reaches a liveness checkpoint, and never increments `strikes`, so a
  ceiling checked only there never fires for the worker that most needs it.
- A `check --wait` returns one Delivery batch (up to 50 messages) and **replays
  that same batch** until acknowledged. MUST process it message by message and
  MUST match each message's `dispatch_id` against the dispatch being awaited
  before acting — MUST NOT assume the first message is the newest dispatch's.
- MUST NOT acknowledge until every message in the batch, and every release
  decision that follows from it, has been handled. Only then MUST the Delivery
  be acknowledged, in the same call that opens the next wait — or, when a leg
  ends with nothing further to wait for, in the standalone form:

  ```
  orca orchestration check --ack <delivery_id> --wait --types worker_done,escalation,question --timeout-ms 900000 --json
  orca orchestration check --ack <delivery_id> --json    # nothing left to wait for
  ```

  A message is *handled* once the action it requires has been **set in motion**,
  not once that action has finished. For a `question` routed to an artifact
  repair this MUST mean the repair has been dispatched: the repair's own
  `worker_done` cannot arrive until this Delivery is acknowledged, because an
  unacknowledged Delivery replays instead of yielding new mail, so waiting for
  the repair before acking deadlocks the loop against itself and burns the
  repair's ceiling. MUST NOT re-defer the ack to the repair's completion for any
  reason.

  Acknowledging the Delivery MUST NOT be confused with answering the question.
  They are different acts on different objects: the ack consumes this
  coordinator's mail batch, while the question stays pending against its own
  message id until a `reply` names that id. So the ack goes early, at dispatch,
  and the answer still goes late, once the repair settles and there is something
  true to say. MUST NOT treat an acked Delivery as a question already answered,
  and MUST NOT skip the later `reply` because the batch is gone.

- A timeout or `{count: 0}` MUST be treated as a checkpoint, never a worker
  failure — the 900000ms window is the floor of the guide's 15-to-60-minute
  range for a real coding dispatch, not a deadline. MUST NOT retry or escalate
  on a bare timeout. Before rolling the wait again, MUST check liveness with
  `orca orchestration task-list --json`, `orca terminal read --terminal
  <handle> --json`, or `orca terminal wait --terminal <handle> --for tui-idle
  --timeout-ms 60000 --json`. A worker still visibly active MUST get another
  rolled wait, never a retry — subject only to the ceiling below.
- If liveness instead shows the terminal exited, disappeared, or went idle
  without ever producing a report, MUST NOT guess what that means — MUST
  classify it with `orca orchestration worker-show --dispatch <id> --json`:
  - `ready`, with no independent sign the terminal has exited or
    disappeared — MUST treat it as still alive and roll the wait again, and
    MUST increment that dispatch's own `strikes` field in the journal for
    every classification that produced no new message, escalating under
    condition 5 at 3 (this skill's three-strikes bound) so the branch cannot
    spin silently. That count MUST be read from and written to the journal
    entry, never the session only, and is per `dispatches` entry so one
    dispatch's strikes never bound another's.
  - `ready`, but the terminal HAS been independently observed to have exited
    or disappeared — MUST NOT roll another wait on `ready` alone; the guide
    names an exited or disappeared terminal as a reason to *stop* waiting.
    MUST instead take the `outcome_unknown` branch below.
  - `failed` or `stopped` — MUST treat it as a failed attempt and take the retry
    path in `worker-accounting.md`'s "Retrying a failed dispatch", using its
    never-settled branch: this dispatch never sent `worker_done`, so
    `worker-release` has nothing to act on.
  - `outcome_unknown` — MUST run `orca orchestration worker-stop --dispatch
    <id> --json` and classify once more with `worker-show`. This second
    classification is terminal, not another roll: a clean `failed`/`stopped`
    takes the retry path above; anything else — including a stray `ready`,
    which cannot be trusted against a terminal `worker-stop` just closed —
    MUST run `orca orchestration worker-abandon --dispatch <id> --json` and
    escalate under condition 5. `worker-abandon` fences the dispatch and
    performs no process or filesystem action — resources may still be live — so
    the HALT record MUST NOT imply this worker was stopped or cleaned up, only
    that the loop could no longer prove its state.
  - If `worker-stop` itself fails — the terminal is already gone, or Orca cannot
    prove the identity it would close — MUST NOT retry it and MUST NOT read its
    failure as a verdict about the worker. MUST record what it reported in
    `last_state` and proceed to the same second classification, which already
    ends in `worker-abandon` plus condition 5 for anything but a clean
    `failed`/`stopped`. A failed `worker-stop` MUST NOT count as having closed
    the terminal, so `worker-accounting.md`'s leave-it-live carve-out MUST NOT
    follow one.
  - Any other result MUST NOT be guessed at. If `worker-show` reports this
    dispatch has already settled — which a resumed run reading a stale
    `pending` entry can hit — the report itself is durable in the bound Run's
    Delivery, so MUST roll the wait once more to collect it and then take
    `worker-accounting.md`'s settlement path. That roll MUST increment
    `strikes` exactly as the `ready` branch above does, and MUST escalate under
    condition 5 at 3 — the bound is only a bound if every branch reusing it
    also counts. If `worker-show` errors, or cannot resolve the dispatch at
    all, MUST take the `outcome_unknown` branch above rather than inventing a
    fourth verdict.
- An `escalation` MUST get its own branch, distinct from a `question` — a worker
  sends it only when ownership is valid and the coordinator must intervene. On
  all three sub-branches below, MUST record the escalating worker's `role`,
  `family`, `task`, `dispatch`, `terminal`, and `last_state` with
  `outcome: unsettled` — an `escalation` is one of the seven non-settlement
  states, so it is never released whichever branch runs next:
  - If it reports that an artifact repair is needed, MUST take
    `artifact-repairs.md`'s repair-dispatch path for that artifact, including
    that path's own bounds on repeating a repair — this branch MUST NOT be read
    as a way into an unbounded repair-then-resume cycle.
  - If it names one of the seven conditions, MUST follow the HALT protocol in
    `SKILL.md` under that condition.
  - Otherwise, MUST treat the leg as blocked, retry once, then escalate under
    condition 5.
- A `question` MUST get an explicit branch: reply with
  `orca orchestration reply --id <message_id> --body "<answer>" --json` when the
  answer is inside this loop's own authority, or escalate — per the calling
  step's own escalation rules, which MUST name where such a question lands
  instead of leaving it pending against a condition that does not exist — when it
  would change a contract, an AC, or an artifact's authority. MUST NOT use
  `gate-create` for a `question`; that is for coordinator-managed task-DAG
  decisions, not for answering an `ask`.
- An asking worker MUST be accounted for as still live, not as unsettled. The
  guide's `ask` blocks until answered, so the worker sits at its prompt and
  resumes its own leg the moment the reply lands: neither settled nor gone. Its
  entry MUST stay `outcome: pending` with the question in `last_state`, MUST NOT
  be released (a `question` is one of the seven non-settlement states), and MUST
  NOT be recorded `unsettled` — that would tell a resumed run this is a liveness
  problem when it is a worker doing what it was told. Its ceiling keeps running.

## The wall-clock ceiling

A strike count cannot terminate a worker that stays alive and keeps emitting
activity, so for that worker the guide's rolling wait never ends. This ceiling
is an addition for unattended use, not a reading of the guide, whose exits from
a rolling wait are `worker_done`/`escalation`, the terminal exiting, or a user
saying stop — and unattended there is no user. It MUST NOT be used to stop a
worker: the guide forbids stopping, closing, killing, or restarting one merely
for not having reported yet.

- MUST measure elapsed time from the dispatch's `started` field, recorded at
  dispatch time by `dispatch-recipes.md`, never from the current session's
  start — a resumed run inherits the elapsed clock as it inherits `strikes`.
- MUST evaluate the ceiling before opening every wait, whatever the previous
  wait returned, per the first rule of "Waiting" above. Wall-clock is
  deliberately the one bound indifferent to what the worker is doing, so
  nothing a worker emits may postpone it.
- MUST NOT add a cap on replies to one dispatch: the ceiling already bounds
  elapsed time with no completion, which is what harms an unattended run, while
  a reply cap would cut off a worker asking many quick, legitimate questions.
  Each question MUST be recorded in `last_state` instead, so a ceiling HALT
  hands the owner the chattiness as evidence.
- The ceiling MUST be 60 minutes for a role that neither writes nor reviews code
  (create story, validate story, an artifact repair) — the top of the guide's own
  15-to-60-minute range for a real coding task — and 120 minutes for a role that
  implements or reviews code (dev story, a reviewer, the adjudicator), double
  that bound, so exhaustion means twice outside the guide's normal.
- On exhaustion MUST record that dispatch `outcome: unsettled` with a
  `last_state` naming the ceiling and what was last observed, then MUST escalate
  under condition 5 and leave the terminal live per `worker-accounting.md`'s
  settlement rule. MUST NOT run `worker-stop`, `worker-abandon`, or a retry on
  exhaustion alone: the worker is left running, so a ceiling reached early costs
  one resumable HALT while no ceiling costs a run that never ends.
