---
name: review-to-spek
description: Create a traceable Antigravity-to-Codex handover after /bmad-code-review accepts the implementation, so Codex can update and close documentation, design corpus, and specifications. Use only when the exact review target is accepted, no unresolved blocking findings remain, review evidence is complete, or when the user invokes /review-to-spek. Carry implementation facts, verdict, finding dispositions, AC traceability, and documentation obligations.
---

# Review to Spek

## Validate acceptance

1. Run only in Antigravity after `/bmad-code-review` completes.
2. Read `.work/inter-agent-cooperation.md`, workflow `state.md`, and the latest `coding-to-review` handover completely.
3. Verify workflow ID, sequence/parent, spec fingerprints, and exact reviewed diff identity.
4. Confirm no unresolved high/medium actionable findings or decision-needed items remain.
5. Record failed review layers; do not claim clean acceptance unless their residual risk was explicitly accepted.
6. If code changed after the reviewed target was captured, stop and require another `coding-to-review` cycle.
7. Do not change production code or substantively rewrite the design/specification corpus in Antigravity.

Antigravity is review-only: do not modify any product documentation, planning/design/specification corpus, or story/spec file. Persist only operational findings and handover/chain artifacts under `.work/inter-agent/**`; Codex owns all documentation updates.

## Preserve closing knowledge

Complete the review columns of the traceability matrix and record:

- BMAD verdict and reviewed diff identity;
- findings by ID and final disposition;
- verified behavior per AC;
- implementation deviations accepted or rejected;
- deferred work and residual risks;
- exact documents/headings requiring synchronization.

## Create the handover

1. Set state to `AWAITING_FINAL_DOCS`.
2. Set the new parent to the current `LATEST_HANDOVER_ID`, increment the sequence, assign the new ID, and create immutable `handovers/<seq>-review-to-spek.md`.
3. Update `LATEST_HANDOVER_ID` only after the immutable file is complete.
4. Require Codex to inspect evidence, update documentation/corpus/specification, complete documentation traceability, and close only after the SSOT close gate passes.
5. If finalization discovers that code must change, require Codex to revise the spec and re-enter through `spek-to-coding` with the same workflow ID.
6. Output the handover in one fenced `text` block.

Never route accepted evidence to Codex when the review target is stale or findings remain unresolved.
