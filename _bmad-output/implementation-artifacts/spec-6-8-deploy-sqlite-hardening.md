---
title: '6.8 Deploy + SQLite Production Hardening'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: '60ba9e6'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/stories/6-8-deploy-sqlite-hardening.md'
---

<intent-contract>

## Intent

**Problem:** SQLite opened with cwd-default path and no WAL/busy settings; operators lacked single-node deploy notes.

**Approach:** On `getDb()`, honor `DB_PATH` (mkdir parent), enable WAL + busy_timeout; document single-node + durable volume in `docs/deploy.md`.

## Boundaries & Constraints

**Always:** Single writer process; `DB_PATH` respected.
**Never:** Multi-instance shared SQLite; KJV import.

</intent-contract>

## Tasks & Acceptance

**Execution:**
- [x] WAL + busy_timeout + DB_PATH dir ensure
- [x] `docs/deploy.md`
- [x] sprint/story/spec done
- [x] `npm run build`

## Verification

**Commands:**
- `npm run build` -- success

## Auto Run Result

Status: done

**Summary:** `getDb()` enables WAL, `busy_timeout=5000`, creates `DB_PATH` parent dirs, and `docs/deploy.md` describes single-node Node + durable volume. No KJV/bible import.

**Files changed:**
- `src/lib/db/index.ts`
- `docs/deploy.md`
- tracking: sprint-status, story 6-8, this spec, epic-6 → done
