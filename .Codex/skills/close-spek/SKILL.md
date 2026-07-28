---
name: close-spek
description: Finalize documentation, specification, and traceability in Codex after an accepted review-to-spek handover, then create the immutable terminal record and mark the inter-agent workflow CLOSED. Use when the latest handover is an accepted review-to-spek, the state is AWAITING_FINAL_DOCS, the user asks to close a reviewed specification workflow, or invokes $close-spek. Do not use before review acceptance or when implementation changes are still required.
---

# Close Spek

## Establish context

1. Run only in Codex ChatGPT.
2. Read `.work/inter-agent-cooperation.md`, workflow `state.md`, and the latest immutable handover completely.
3. Require the latest handover to be a `READY` `review-to-spek` from Antigravity for the same workflow, with an accepted exact review target and no unresolved blocking findings.
4. Require the workflow state to be `AWAITING_FINAL_DOCS`. Verify workflow ID, sequence, parent chain, SSOT fingerprints, baseline/head, diff identity, and actual workspace state before editing.
5. Stop with `CHAIN_INTEGRITY_BLOCKED` when the chain is stale, has a gap, or cannot identify the reviewed target. Do not guess or create a close record.
6. Announce use of this skill and the workflow ID.

Codex owns only documentation, design/specification corpus, and operational Markdown under `.work/inter-agent/**`. Read code as evidence when needed, but do not edit production code, tests, configuration, or scripts, and do not perform code review.

## Finalize the corpus

1. Reconcile accepted implementation and review facts into the required documentation, design corpus, and specifications.
2. Preserve stable acceptance-criteria IDs. Complete every traceability row through specification, implementation, test/gate, review, and final documentation evidence.
3. Recompute Git blob fingerprints for every ordered SSOT document and record the repository object format.
4. Confirm the exact reviewed code/diff target remains reconstructable and has not changed after acceptance.
5. Record open questions, deviations, deferred work, external dependencies, and residual risks with explicit owner/status. Do not erase them merely to pass the close gate.
6. Do not trigger BMAD skills unless the user explicitly requests or approves them.

If finalization reveals a required code change, do not close. Revise the specification and return through `spek-to-coding` using the same workflow ID.

## Enforce the close gate

Close only when all conditions pass:

- the latest exact review target is accepted and still current;
- no unresolved high/medium actionable finding or decision-needed item remains;
- every acceptance criterion has complete evidence and final documentation traceability;
- all required documents are synchronized and their final fingerprints are recorded;
- every open or deferred item has an explicit disposition and does not invalidate the definition of done;
- residual risks are stated honestly; and
- no code change is required.

## Create the terminal record

1. Set `PARENT_HANDOVER_ID` to the current `LATEST_HANDOVER_ID`, increment `HANDOVER_SEQ` exactly once, and assign the new terminal ID.
2. Create immutable `handovers/<seq>-close.md` before changing `LATEST_HANDOVER_ID`. Never edit, replace, or delete an earlier handover.
3. Use this terminal envelope:

```text
WORKFLOW_ID: <stable-id>
HANDOVER_ID: <workflow-id>-H<sequence>
HANDOVER_SEQ: <integer>
PARENT_HANDOVER_ID: <latest-review-to-spek-id>
SKILL: close-spek
HOST_FROM: Codex
HOST_TO: none
STATUS: CLOSED
CHAIN_STATE: .work/inter-agent/<workflow-id>/state.md
HANDOVER_FILE: .work/inter-agent/<workflow-id>/handovers/<seq>-close.md

WORKFLOW OUTCOME
- <measurable closed outcome>

FINAL REVIEW
- Verdict and exact target: <...>

DOCUMENTATION SYNCHRONIZED
1. <path>#<heading> — <final fingerprint>

TRACEABILITY
- <AC range/status and evidence completeness>

DEFERRED / EXTERNAL / RESIDUAL RISKS
- <explicit disposition; write none only when truly empty>

BOUNDARIES
- Codex changed documentation and operational chain artifacts only.
```

4. After the terminal file is complete, update `state.md` to `STATUS: CLOSED`, `OWNER: none`, the incremented sequence, and the new `LATEST_HANDOVER_ID`. Preserve the final review/diff identity, fingerprints, traceability, deferred work, and residual risks.
5. Keep the final response concise by default. Report `CLOSED`, the workflow ID, links to `state.md` and the terminal record, the final review/traceability result, and only material deferred or residual items.
6. Do not reproduce the terminal record, complete fingerprint list, full traceability matrix, or long evidence block in chat. The immutable files are the detailed SSOT. Output their full content only when the user explicitly requests the full record or printout.
7. There is no required next handover.

## Git finalization

After the terminal record and state close gate both pass, automatically commit and push the closed workflow on the current branch unless the user explicitly opts out.

1. Build a path manifest from the accepted implementation handover, the ordered SSOT, and `.work/inter-agent/<workflow-id>/`. Do not stage unrelated dirty paths.
2. Re-check that the accepted scoped diff still matches its recorded fingerprint, and that the terminal record exists before staging.
3. Stage only the manifest, including reviewed implementation/test files where they belong to the accepted target and the final documentation/chain artifacts. Never use `git add -A` or a broad workspace path.
4. Review the staged name list and diff check. If a required path is missing, the branch is not pushable, the target remote is ambiguous, or a staged path is outside the workflow manifest, stop and report the blocker; do not make a partial or speculative commit.
5. Create one descriptive commit containing the workflow ID and closed outcome, then push the current branch to its configured upstream. If no upstream exists, push the current branch to the repository's designated collaborative remote only when that remote is unambiguous; otherwise stop and request direction.
6. Report the commit SHA and pushed branch. Preserve unrelated working-tree changes unstaged and mention them only when they affect the finalization decision.
