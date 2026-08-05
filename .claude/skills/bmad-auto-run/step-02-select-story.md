# Step 2: Story selection

Decides which story the run works on next. This step MUST NOT run until the
journal records `preflight: passed` for this run. It MUST run once each time
the loop needs a story: the first time right after pre-flight, and again
every time the previous story reaches `phase: committed` or the loop has
just skipped a story and needs the next candidate.

## Selection rule (mirrors `bmad-create-story`)

This is the same auto-discover rule `bmad-create-story` applies on its own
activation. Stating it here — instead of merely resembling it — is what
guarantees this skill never selects a story different from the one
`bmad-create-story` would then discover for itself.

- MUST read the complete `_bmad-output/implementation-artifacts/sprint-status.yaml`
  file, top to bottom, before selecting anything.
- MUST take the first key matching the pattern `<n>-<n>-<name>` (e.g.
  `17-7-projected-shell-route-group`) whose status value is exactly `backlog`.
- MUST NOT treat an `epic-<n>` key or an `epic-<n>-retrospective` key as a
  candidate — only a two-number story key counts.
- MUST NOT require that any preceding story be `done` first, and MUST NOT
  treat a preceding story's `review` status as blocking. Neither condition is
  part of the rule `bmad-create-story` applies, so neither is part of this
  rule either.

## Dependency check

`sprint-status.yaml` carries no machine-readable dependency field. This
check MUST read prose from the sources below. It MUST NOT invent a
dependency schema the file does not have.

- For the candidate story, MUST read: the YAML comment block immediately
  above that epic's own `epic-<n>:` row, any YAML comment immediately above
  the candidate story's own row, and the candidate story's heading and prose
  in `_bmad-output/planning-artifacts/epics.md`.
- MUST treat the dependency as unmet only when one of those sources names a
  specific prerequisite story or artifact and that prerequisite is not yet
  `done` (or, for an artifact, does not yet exist). Silence on dependencies
  in all three sources MUST be read as no dependency, not as an unmet one.
- If the dependency is unmet, MUST append a journal entry for that key with
  `phase: skipped` and a `note` naming the unmet prerequisite, then MUST
  return to the selection rule and take the next matching key, continuing top
  to bottom from where the candidate was found.
- Before evaluating any candidate, MUST check whether the journal already
  holds an entry for that key. If it is already `phase: skipped`, MUST NOT
  re-evaluate its dependency or write a duplicate entry — MUST move directly
  to the next matching key instead.
- A skip MUST NOT be reported or logged as an error. It is the loop
  continuing to the next backlog story, not a failure of any kind.

## No candidate at all

If no key matches the pattern with status `backlog` anywhere in the file —
none skipped, none selectable — the run has no more stories left to do. This
MUST NOT escalate under condition 4, which is for backlog stories that exist
but are all blocked. MUST instead stop selecting and hand control back to the
run without a further dispatch.

## Recording a selection

Once a candidate clears the dependency check:

- MUST append a journal entry with `key: <that story's sprint-status key>`
  and `phase: selected`. `fix_rounds`, `panel`, `commit`, and `note` MAY be
  left for the steps that populate them later in the cycle.
- MUST set the journal's top-level `epic: <n>` field to that story's epic
  number, taken from the leading digits of its key, so a later step can
  detect when the next selection crosses into a different epic.

## Escalation

MUST escalate under condition 4 only after every key matching the pattern
with status `backlog` in the file has been evaluated in this pass and every
one of them is recorded `phase: skipped` — none left to select. On that
escalation, MUST follow the HALT protocol defined in `SKILL.md`.
