---
name: coding-to-spek
description: Create a traceable Cursor-to-Codex handover when coding exposes an upstream documentation, design, specification, or product-decision blocker. Use only after implementation has started and cannot safely continue without Codex discussion, when a locked decision conflicts with code reality, or when the user invokes $coding-to-spek. Preserve partial implementation evidence and the complete workflow knowledge chain.
---

# Coding to Spek

## Validate the blocker

1. Run only in Cursor.
2. Read `.work/inter-agent-cooperation.md`, workflow `state.md`, and the latest incoming handover completely.
3. Verify workflow ID, sequence, parent handover, SSOT fingerprints, and current code baseline.
4. Continue safe coding work first. Use this skill only when an upstream documentation/specification decision blocks correct implementation.
5. Do not use it for ordinary coding difficulty or an in-scope test failure.
6. Do not edit planning, design, specification, or final corpus.
7. Do not perform code review. This skill only packages an upstream documentation/specification blocker.

Use Composer 2.5 Non Fast when selected by the user. Never claim to select or verify the model.

## Preserve knowledge

Record in `state.md`:

- the exact question or contradiction;
- code paths and runtime evidence exposing it;
- options and their implementation impact without choosing for Codex;
- partial changed files and current diff baseline;
- build/test commands already run and their actual results;
- affected AC IDs and traceability rows;
- work that remains safe versus blocked.

## Create the handover

1. Set state to `AWAITING_SPEC_DECISION`.
2. Set the new parent to the current `LATEST_HANDOVER_ID`, increment the sequence, assign the new ID, and create immutable `handovers/<seq>-coding-to-spek.md`.
3. Update `LATEST_HANDOVER_ID` only after the immutable file is complete.
4. Require Codex to resolve the documentation/specification issue and return through `spek-to-coding` with the same workflow ID.
5. Output the handover in one fenced `text` block.

Never discard partial implementation context. Never claim the coding goal is complete, and never route directly to review from this skill.
