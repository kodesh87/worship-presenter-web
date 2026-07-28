---
name: review-to-coding
description: Create a traceable Antigravity-to-Cursor corrective-coding handover from actionable /bmad-code-review findings. Use after BMAD review identifies patch work, unresolved decision-needed items, review-layer failures requiring code changes, or when the user invokes /review-to-coding. Preserve exact reviewed diff identity, normalized finding evidence, AC impact, and the complete knowledge chain without applying production-code patches in Antigravity.
---

# Review to Coding

## Validate review findings

1. Run only in Antigravity after `/bmad-code-review` has reached a triaged outcome.
2. Read `.work/inter-agent-cooperation.md`, workflow `state.md`, and the latest `coding-to-review` handover completely.
3. Verify workflow ID, sequence/parent, spec fingerprints, and that the BMAD-reviewed target exactly matches the handed-over diff.
4. Do not apply production-code patches in Antigravity. Preserve review artifacts/status writes required by BMAD, but do not rewrite design/specification corpus.
5. Do not use this skill for a clean or accepted review; use `review-to-spek` instead.

Antigravity is review-only: MUST NOT modify production code, tests, configuration, product documentation, planning/design/specification corpus, or story/spec files. Only operational findings and handover/chain artifacts under `.work/inter-agent/**` may be written.

## Preserve review knowledge

For every actionable finding, record:

- stable finding ID and BMAD source layer;
- severity and triage bucket;
- affected AC IDs;
- file/line and concrete evidence;
- trigger/consequence when relevant;
- required outcome, not an unverified implementation guess;
- failed review layers or parsing limitations.

Update the traceability matrix and mark review status as requiring code changes.

## Create the handover

1. Set state to `AWAITING_CODE_FIX`.
2. Set the new parent to the current `LATEST_HANDOVER_ID`, increment the sequence, assign the new ID, and create immutable `handovers/<seq>-review-to-coding.md`.
3. Update `LATEST_HANDOVER_ID` only after the immutable file is complete.
4. Require Cursor to correct findings, rerun affected gates, update evidence, and return via `coding-to-review`.
5. If a finding ultimately needs a specification decision, require Cursor to route it through `coding-to-spek`.
6. Output the handover in one fenced `text` block.

Never describe an incomplete review as accepted and never allow the reviewed diff identity to be replaced silently.
