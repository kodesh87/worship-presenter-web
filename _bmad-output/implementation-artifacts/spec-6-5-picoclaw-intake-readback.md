---
title: '6.5 picoclaw Intake + Hymn Title Readback'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: '60ba9e6'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/stories/6-5-picoclaw-intake-readback.md'
---

<intent-contract>

## Intent

**Problem:** Webhook creates/updates services and returns `failedHymnNumbers`, but picoclaw lacks a clear title readback surface and operator docs/skill for FR-1.

**Approach:** Return `resolvedHymns: [{number,title}]` on webhook success; document secret + payload + readback for picoclaw agents.

## Boundaries & Constraints

**Always:**
- Keep create/update-by-date and `failedHymnNumbers`.
- Titles come from hymnal resolution already in `parsedData.items` (hymn entries).
- No KJV import.

**Never:** Change auth middleware; invent titles outside the hymnal DB.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid secret + rundown | POST text | 201/200 + resolvedHymns + failedHymnNumbers | — |
| Bad secret | Wrong header | 401 | — |
| Missing WEBHOOK_SECRET | Env unset | 503 | — |

</intent-contract>

## Code Map

- `src/app/api/webhook/route.ts` — `resolvedHymns`
- `docs/picoclaw-webhook.md` — operator/agent docs
- `.claude/skills/picoclaw-webhook/SKILL.md` — agent skill

## Tasks & Acceptance

**Execution:**
- [x] Webhook returns `resolvedHymns`
- [x] docs + skill package
- [x] sprint/story/spec done
- [x] `npm run build`

**Acceptance Criteria:**
- Given resolved hymns, when API responds, then titles are available via `resolvedHymns` for chat readback.
- Given picoclaw docs, when an agent follows them, then it posts `WEBHOOK_SECRET` and reads titles back.

## Verification

**Commands:**
- `npm run build` -- success

## Auto Run Result

Status: done

**Summary:** Webhook JSON now includes `resolvedHymns: [{number,title}]` alongside `failedHymnNumbers`. Added `docs/picoclaw-webhook.md` and `.claude/skills/picoclaw-webhook` for picoclaw FR-1 round-trip. No KJV/bible import.

**Files changed:**
- `src/app/api/webhook/route.ts`
- `docs/picoclaw-webhook.md`
- `.claude/skills/picoclaw-webhook/SKILL.md`
- tracking: sprint-status, story 6-5, this spec
