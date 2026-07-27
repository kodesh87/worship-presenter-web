---
title: '6.4 Section-aware Hymn Mapping'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: '60ba9e6'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
warnings:
  - multiple-goals
---

<intent-contract>

## Intent

**Problem:** Hymns are split with `slice(0,2)` / `slice(2)`, so atypical counts mis-slot Bible Talk vs Divine Service songs.

**Approach:** Walk `parsedData.items` section markers (BIBLE TALK / DIVINE SERVICE) and bucket hymns by section membership for Part A/B generation.

## Boundaries & Constraints

**Always:**
- Hymns under BIBLE TALK → Part A; under DIVINE SERVICE → Part B.
- If section markers missing, fall back to previous positional split.
- Preserve Part B opening/middle/closing song ordering within the Divine Service bucket.
- No KJV import.

**Block If:** None

**Never:** Redesign full blueprint layout (6.3); change auth.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Normal sections | 2 BT + 3 DS hymns | Part A gets BT; Part B gets DS | — |
| Extra BT hymns | 3+ under Bible Talk | All stay in Part A | — |
| Missing sections | No section markers | Positional fallback | — |

</intent-contract>

## Code Map

- `src/lib/pptx.ts` -- replace slice with section buckets
- Optional helper in `src/lib/hymn-sections.ts`
- smoke + sprint/story 6.4 done

## Tasks & Acceptance

**Execution:**
- [x] Section-aware hymn bucketing in pptx (fallback positional)
- [x] smoke atypical counts
- [x] sprint/story done
- [x] `npm run build`

**Acceptance Criteria:**
- Given BIBLE TALK and DIVINE SERVICE sections, when generated, then hymns land in matching Parts.
- Given atypical hymn counts, when generated, then order follows section membership not hard slice(0,2).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm run build` -- success
- `node scripts/smoke-hymn-sections.mjs` -- section vs fallback

## Auto Run Result

Status: done

**Summary:** Hymns bucketed by BIBLE TALK / DIVINE SERVICE section markers via `bucketHymnsBySection`; positional `slice(0,2)`/`slice(2)` retained only as fallback when markers are absent. No KJV/bible import.

**Files changed:**
- `src/lib/hymn-sections.ts` — section walk + fallback
- `src/lib/pptx.ts` — uses buckets
- `scripts/smoke-hymn-sections.mjs` — atypical + fallback smoke
- `scripts/smoke-deck-fidelity.mjs` — assert section-aware
- tracking: sprint-status, story 6-4, this spec

**Verify:** `node scripts/smoke-hymn-sections.mjs` PASS; `npm run build` PASS.
