# Worker accounting

Settlement, release, and retry — accounting for a dispatch that has stopped
being outstanding, or that must be attempted again. Waiting on it, the
message-type branches, liveness classification, and the wall-clock ceiling are
`worker-waiting.md`'s job. Every step that dispatches a worker MUST follow this
file exactly for every dispatch `dispatch-recipes.md` starts, and MUST NOT
restate it inline.

## Settlement and accounting

- `worker_done` settles a dispatch under **either** outcome: `--outcome
  succeeded` and `--outcome failed` are both settled and both MUST be released
  the same way. MUST NOT treat `--outcome failed` as unsettled or unreleasable.
- The forbidden-to-release states are exactly seven: a timeout, a TUI-idle state,
  a heartbeat, a `status` message, a `question`, an `escalation`, and a rejected
  or stale `worker_done`. MUST NOT release for any of them — none is settlement.
- On a settled report, MUST attempt
  `orca orchestration worker-release --dispatch <id> --json` and record the
  outcome (`succeeded`/`failed`) against that dispatch's journal entry. Where
  the receipt reports the terminal retained (for example as pre-existing), MUST
  close it explicitly with `orca terminal close --terminal <handle> --json` —
  this skill never reuses a terminal, so any terminal it created is safe to
  close once settled, and the guide promises a follow-up recovery command only
  for the next case. Where the receipt instead reports `release_pending` or
  `release_unknown`, MUST follow that receipt's own recovery action exactly —
  MUST NOT substitute `terminal close` there, and MUST NOT guess.
- MUST NOT attempt release for a dispatch that never settled — the guide
  forbids it; that is the reason, not evidence preservation, since a released or
  closed worker's output stays readable through
  `worker-read --dispatch <id> --json`. This covers a HALT reached while a
  dispatch is outstanding, a dead dispatch classified `failed` or `stopped` by
  `worker-waiting.md`'s classification without ever sending `worker_done`, and a
  dispatch that exhausted its ceiling. A dispatch awaiting a reply is not a
  fourth case: equally never released, but it stays `pending` per that file's
  `question` branch. For the three, MUST instead record that dispatch's `role`,
  `family`, `task`, `dispatch`, `terminal`, and `last_state` with
  `outcome: unsettled`, and MUST leave the terminal live for the owner to
  diagnose — unless a `worker-stop` already closed it during classification, in
  which case nothing is left to leave live and the record plus `worker-read`
  preserves the evidence.

## Retrying a failed dispatch

- After 3 consecutive failures Orca circuit-breaks the task and marks it failed,
  so a retry MUST NOT re-dispatch the task that already failed.
  `worker-start --retry-of` is the guide's own retry path, unavailable here for
  the same reason `worker-start` is.
- For a dispatch settled by `worker_done --outcome failed`, MUST release the
  failed worker first (per the settlement rule above), then create a **fresh
  task** with `task-create` for the second attempt, then dispatch it through
  this same recipe from `terminal create` onward.
- For a dispatch that never settled — classified `failed` or `stopped` by
  `worker-waiting.md`'s classification, or an `escalation` that its escalation
  branch's third sub-branch routes here — MUST skip the release attempt (nothing
  settled exists to release) and go straight from recording it
  (`outcome: unsettled`) to the fresh `task-create`.
- Either way, MUST record both task ids in the journal's `dispatches` list,
  each with its own `dispatch` id and `outcome`.
