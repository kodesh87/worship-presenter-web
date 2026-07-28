---
name: coding-to-review
description: Validate completed Cursor implementation and create a traceable handover to Antigravity for /bmad-code-review. Use when coding and required tests/builds are review-ready, after fixing review findings, or when the user invokes $coding-to-review. Carry exact diff identity, specification fingerprints, AC-to-code-test evidence, deviations, and residual risks so review cannot target the wrong change.
---

# Coding to Review

## Validate review readiness

1. Run only in Cursor.
2. Read `.work/inter-agent-cooperation.md`, workflow `state.md`, and the latest incoming handover completely.
3. Verify workflow ID, handover sequence/parent, and that current SSOT fingerprints match those accepted for coding.
4. Finish all safe in-scope coding and required tests/builds.
5. If an upstream decision is missing or fingerprints changed materially, use `coding-to-spek` instead.
6. Do not edit planning, design, specification, or final corpus.
7. Do not perform the review yourself. This skill only freezes evidence and hands the target to Antigravity.

Use Composer 2.5 Non Fast when selected by the user. Never claim to select or verify the model.

## Freeze review evidence

1. Identify an exact review source: commit range, branch/base, staged diff, or explicitly recorded working-tree diff.
2. Record baseline and head commits, dirty/untracked files, changed-file list, and diff statistics.
3. Record every verification command and actual `pass`, `fail`, or `not run` result.
4. Complete AC → code → test mappings in `state.md`.
5. Record deviations, known issues, and residual risks.
6. Refuse review handover when the diff target cannot be reconstructed or a required critical gate failed without explicit user acceptance.

## Create the handover

1. Set state to `AWAITING_REVIEW`.
2. Set the new parent to the current `LATEST_HANDOVER_ID`, increment the sequence, assign the new ID, and create immutable `handovers/<seq>-coding-to-review.md`.
3. Update `LATEST_HANDOVER_ID` only after the immutable file is complete.
4. Instruct Antigravity to review the exact target with `/bmad-code-review` and the recorded spec context.
5. Require either `review-to-coding` or `review-to-spek` as the next handover.
6. Output the handover in one fenced `text` block.

Do not create the handover merely because the turn ends. If explicitly requested early, mark it `INCOMPLETE` and make missing evidence unmistakable.
