# Artifact repairs taken mid-leg

The repair-then-resume mechanism: what the loop does when a dispatched worker
reports it cannot proceed until a spec, architecture, or correct-course change
happens. `step-03-story-cycle.md` owns the three legs this most often
interrupts; `step-04-review-panel.md` and `worker-waiting.md` route into this
file unchanged. Every step that dispatches a worker MUST follow this file
exactly for such a report and MUST NOT restate it inline.

- Any of the three dispatches in `step-03-story-cycle.md` MAY report that it
  cannot proceed until a
  spec update, an architecture update, or a correct-course run happens. On such a
  report, MUST NOT edit the artifact from the coordinator — MUST instead dispatch
  the owning skill (`bmad-spec`, `bmad-architecture`, or `bmad-correct-course`)
  as its own worker, through `dispatch-recipes.md`'s recipe, and wait for its
  `worker_done`.
- Whether the need arrived as a `question` or inside a `worker_done` decides who
  still owns the interrupted leg, and the two MUST NOT be treated alike. An `ask`
  blocks until answered: the asking worker is sitting at its prompt, still owns
  its leg, and resumes it the moment the reply lands. A `worker_done` means that
  worker finished and exited, leaving the leg with no owner at all.
- On the `question` path, MUST dispatch the repair first and reply only once the
  repair settles, with
  `orca orchestration reply --id <message_id> --body "<answer>" --json` carrying
  the repair's outcome so the asking worker can continue. MUST NOT re-dispatch
  that leg on this path: the reply is what resumes it, and a re-dispatch would
  put a second worker on the same story key and the same story file while the
  first is still live. MUST keep that dispatch `outcome: pending` and never
  `unsettled`, with the question in `last_state`, per `worker-waiting.md`'s
  asking-worker rule. That worker's own wall-clock ceiling MUST be suspended
  while this repair is in flight, per that file's one ceiling exception — the
  asker is waiting on the loop, not failing.
- MUST acknowledge the Delivery carrying that question as soon as the repair is
  dispatched, never once it settles — `worker-waiting.md`'s ack rule holds the
  mechanism and why acking is not answering. Because it is acked, that question
  MUST NOT be acted on again and a second repair MUST NOT be dispatched for it.
- A worker's `ask` carries its own timeout and a repair can outlast it. The
  guide states a timed-out question stays pending and is resumed by its original
  message id, so the deferred reply above is still the answer to that same
  question and MUST NOT be re-asked or re-sent as a new one. After replying,
  MUST confirm the worker actually resumed using `worker-waiting.md`'s liveness
  probes; one that never resumes MUST be treated as a dispatch that never
  reports and MUST take that file's liveness classification.
- Before dispatching a `bmad-correct-course` repair, MUST read the reporting
  worker's stated scope for that correct-course and escalate under condition
  6 instead of dispatching when that scope would move a PRD-level goal,
  retire an epic, or renumber an existing `AD-n`. MUST NOT dispatch the
  correct-course worker first and discover the scope from its result —
  condition 6 is a gate before the dispatch, not a review after it.
- Once the repair worker reports `worker_done` — and, for a correct-course
  repair, once condition 6 has been checked and not triggered — MUST resume
  the interrupted leg by re-dispatching the same role (create, validate, or
  dev) that reported the need **only where that need arrived inside a
  `worker_done`**, because that worker exited and the leg has no owner left.
  Where it arrived as a `question`, the reply above is the resumption and MUST
  NOT be followed by a re-dispatch. On either path the repair MUST NOT itself
  be treated as satisfying the leg.
- Every repair dispatch MUST be recorded in the journal's `dispatches` list
  with a `role` naming both the owning skill and the artifact it repaired, so
  the two bounds below survive a resume that reads the journal rather than
  this session's memory.
- The repair-then-resume cycle MUST be bounded in both of its shapes, because
  it is the one loop in this design with no human inside it:
  - **Same need twice.** A leg that reports a repair need whose owning skill and
    artifact match a repair already recorded `succeeded` — or one still recorded
    `pending`, since a repair in flight has not made its change yet and a second
    would put two workers on one governed artifact at once — MUST NOT be
    repaired again, and MUST escalate under condition 5 instead. A role that
    still needs the change the repair just made is past what this loop can
    resolve by dispatching the same two workers at each other again.
  - **A chain of different needs.** MUST NOT dispatch more than 3 repairs in
    total for one story, counting every artifact and every leg; the fourth
    MUST escalate under condition 5. Bounding only the identical repeat would
    leave a story cycling spec → architecture → correct-course → spec forever,
    each need technically new.
- A repair dispatch's own failure MUST take the same path as any other
  dispatch, not an unstated one: on `--outcome failed`, or on a liveness
  classification of `failed`/`stopped` without it ever reporting, MUST apply
  retry-once-then-escalate-under-5 through `worker-accounting.md`'s retry
  mechanics; on ceiling exhaustion MUST escalate under condition 5 directly,
  with no retry, exactly as that file requires for every other dispatch. A
  retried repair MUST NOT be counted a second time against the 3-repair cap
  above — it is one repair attempted twice, not two repairs.
- When one report triggers both this repair path and a leg's retry rule — a
  `worker_done --outcome failed` that also reports a repair need — the repair
  path MUST take precedence and the retry MUST NOT be issued for that report.
  Retrying first would re-dispatch the same role against the same unrepaired
  artifact and fail identically, burning the leg's only retry on a known
  outcome. The re-dispatch that resumes the leg after the repair MUST NOT be
  counted as that leg's retry — it is a resumption, and the leg keeps its
  retry-once allowance for a later failure that reports no repair need. The
  repair bounds above are what keep this from being a way around the retry
  bound.
