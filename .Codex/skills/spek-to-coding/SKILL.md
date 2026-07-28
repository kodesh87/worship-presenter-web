---
name: spek-to-coding
description: Prepare or revise documentation, design corpus, and specifications in Codex ChatGPT, then create a traceable coding handover to Cursor. Use for every new work item, after a coding-to-spek return, when the user asks to prepare implementation documentation, or invokes $spek-to-coding. Carry the persistent workflow knowledge chain, stable acceptance-criteria IDs, locked decisions, and verification gates into coding.
---

# Spek to Coding

## Establish context

1. Run only in Codex ChatGPT.
2. Read `.work/inter-agent-cooperation.md` completely.
3. For a new work item, create `WORKFLOW_ID`, `.work/inter-agent/<workflow-id>/state.md`, and the `handovers/` directory described by the SSOT.
4. For a returned work item, read `state.md` and the latest immutable `coding-to-spek` handover; verify workflow ID, sequence, parent, and fingerprints before acting.
5. Announce this skill and whether the work item is new or returning from coding.
6. Do not trigger BMAD skills unless the user explicitly requests or approves them.

Codex is documentation/design/specification-only in this workflow: it may read code, but MUST NOT edit code, tests, configuration, or scripts, and MUST NOT perform code review. Any coding or code-review request must be routed to Cursor or Antigravity.

Use 5.6 Sol High for thinking and 5.6 Terra Medium for document editing when selected by the user. Never claim to select or verify the model.

## Complete specification work

1. Inspect relevant corpus and code to remove material ambiguity.
2. Create or revise documentation, design corpus, and specification.
3. Resolve every question returned by `coding-to-spek`.
4. Assign stable IDs to acceptance criteria; never renumber existing IDs during the workflow.
5. Lock scope, non-goals, decisions, constraints, and verification gates.
6. Record ordered SSOT paths and content fingerprints in `state.md`.
7. Populate the specification columns of the traceability matrix.
8. Do not write production code or tests.
9. Continue until Cursor can implement without guessing a material decision.

## Create the handover

After the completion gate passes:

1. Update `state.md` to `AWAITING_CODING`.
2. Set the new `PARENT_HANDOVER_ID` to the current `LATEST_HANDOVER_ID`, or `none` for the first handover.
3. Increment `HANDOVER_SEQ`, assign the new handover ID, and create immutable `handovers/<seq>-spek-to-coding.md` using the mandatory envelope.
4. Update `LATEST_HANDOVER_ID` only after the immutable file is complete.
5. Include ACs, spec fingerprints, implementation scope, verification gates, and any preserved partial-code state from a prior loop.
6. Output the same handover in one fenced `text` block for Cursor.

Do not create the handover while safe specification work remains. If the user explicitly requests a premature handover, mark it `INCOMPLETE` and list every unresolved decision and unverified gate.
