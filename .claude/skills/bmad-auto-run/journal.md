# The journal

The run's own state: what every step writes, and why each field exists. It is
the resume source and the record the owner reads instead of watching the run.
`SKILL.md` resolves which journal a run binds; this file is its shape. Every
step MUST follow it exactly and MUST NOT introduce a field of its own.

## Shape

Every run MUST write one run document at
`_bmad-output/implementation-artifacts/auto-run/<date>-journal.md` — the file
`SKILL.md`'s Activation resolves — in exactly this shape. Every later step MUST
write only a field already present below, and MUST NOT introduce a `phase` outside
the enum on the `phase:` line. A value needing more than one line MUST be
written as a YAML block scalar rather than truncated: that evidence is what a
HALT hands the owner.

```yaml
run: <date>-<n>                  # <n> is this document's ordinal within its file
mode: full|dry-run|one-story|one-epic   # resolved once at invocation, read on resume
stopped: <scope reached|escalated: <condition>|null>
orca_run: <orca run id>          # bound on resume, never re-created
epic: <n>
branch: <name>
pr: <url|null>
preflight: passed|failed
agy_probe: <one line per mandated agy row: the row and the model it was served>
stories:
  - key: <sprint-status key>
    phase: selected|created|validated|developed|reviewed|committed|skipped
    halted: <condition number>       # written by the HALT protocol, cleared by the owner
    fix_rounds: <n>
    ci_rounds: <n>                 # post-commit CI fix cycles routed back to review
    panel: { agy_pass: <n>, fifth_pass: <bool>, confirmation: passed|failed|pending }  # latest round
    commit: <sha|null>             # the most recent code commit for this story
    note: <free text; a block scalar where the evidence needs one>
    dispatches:
      - role: <role>
        family: <cli family>     # so a resumed run can honour "a different family than the creator"
        task: <task_id>
        dispatch: <dispatch_id>
        terminal: <handle>       # the terminal a HALT names; live unless already closed
        started: <timestamp>     # when this dispatch was sent, so its ceiling survives a resume
        strikes: <n>             # classifications producing no new message, per dispatch
        outcome: succeeded|failed|pending|unsettled
        last_state: <free text; a block scalar where the evidence needs one>
```

`mode` and `stopped` are what make a run's scope survive the run. `mode` MUST be
written before the first dispatch and MUST be the only source a resumed run
reads its scope from, or a `one-story` run that halts overnight resumes as a
full-backlog one. `stopped` MUST distinguish a scope stop from an escalation:
both leave a finished-looking journal, and an owner who cannot tell them apart
will read a normal `one-story` ending as a failure, or a HALT as a normal
ending. A run still in progress MUST leave it null.

None of these fields is bookkeeping for its own sake. `ci_rounds` makes a
story's *second* trip through the cycle legible — a post-commit CI finding
returns it to `step-04-review-panel.md` and then to `step-05-commit-gate.md`
for a further code commit under the same key, whose resume check counts commits
against it — and absent MUST read as zero. `halted` keeps an escalated story
from being resumed as if nothing happened, which `phase` cannot, since the HALT
protocol records the phase it was already in. Without the recorded `family` a
run resuming at `phase: created` would validate in the creator's family half
the time; without `orca_run` a resumed run creates a second Orca Run and reads
an empty mailbox; without `terminal` and `last_state` a HALT's
record-and-leave-live rule has nothing to write; without `started` and
`strikes` `worker-waiting.md`'s two per-dispatch bounds reset on every
interruption, so a run resumed twice would never reach either.

