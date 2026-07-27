---
title: '6.6 Automated Tests (parser / middleware / webhook)'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: '60ba9e6'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/stories/6-6-automated-tests-parser-auth-webhook.md'
---

<intent-contract>

## Intent

**Problem:** Zero automated regression coverage for parser robustness, auth, and webhook secret gates.

**Approach:** Minimal `node --test` suite (no new heavy deps) covering sample rundown parse, webhook secret 401/503, and unauthenticated API 401.

## Boundaries & Constraints

**Always:** Use Node built-in test runner; no KJV import.
**Never:** Add Playwright/Jest/Vitest unless required later.

</intent-contract>

## Code Map

- `tests/parser.test.mjs`, `tests/webhook-auth.test.mjs`, `tests/auth-http.test.mjs`
- `tests/register-ts-resolve.mjs` + hook for strip-types imports
- `src/lib/webhook-auth.ts` — extractable secret gate
- `package.json` `"test"` script

## Tasks & Acceptance

**Execution:**
- [x] parser sample rundown tests
- [x] auth 401 + webhook 401/503
- [x] `npm test` + `npm run build`
- [x] sprint/story/spec done

## Verification

**Commands:**
- `npm test` -- success
- `npm run build` -- success

## Auto Run Result

Status: done

**Summary:** Added `node --test` suite (12 tests) for sample rundown parser, webhook secret gate (401/503), and unauthenticated API 401 via `next start`. No new test-framework deps. No KJV/bible import.

**Files changed:**
- `tests/*` — parser, webhook-auth, auth-http + fixture + TS resolve hook
- `src/lib/webhook-auth.ts` + webhook route wiring
- `src/lib/db/index.ts` — relative password import (node-loadable)
- `src/lib/parser.ts` — `./db/index` import
- `package.json` — `npm test`
- tracking: sprint-status, story 6-6, this spec
