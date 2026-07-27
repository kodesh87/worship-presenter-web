---
title: '6.2 Per-person Admin / Operator Auth (FR-18)'
type: 'feature'
created: '2026-07-18'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: '046df7f'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/stories/6-2-per-person-admin-operator-auth.md'
warnings:
  - multiple-goals
---

<intent-contract>

## Intent

**Problem:** Hub uses one shared `AUTH_PASSWORD` Basic Auth; FR-18 needs per-person Admin and Operator accounts.

**Approach:** Replace shared Basic Auth with form login + signed session cookie, SQLite `accounts` (admin|operator), Admin UI/API to manage accounts. Webhook stays on `WEBHOOK_SECRET`.

## Boundaries & Constraints

**Always:**
- Unauthenticated users cannot see Services or hub APIs (except `/login`, `/api/auth/*`, `/api/webhook`).
- Operator: review/edit/regenerate/download/delete Services + announcements.
- Admin: Operator powers + manage accounts (create/list/update role/reset password/delete; cannot delete last admin).
- Passwords stored hashed (scrypt); session cookie HttpOnly + signed with `AUTH_SECRET`.
- Bootstrap first admin from `AUTH_BOOTSTRAP_USER` + `AUTH_BOOTSTRAP_PASSWORD` when accounts table empty.

**Block If:**
- None for MVP (no SSO/OAuth decision needed).

**Never:**
- Keep shared `AUTH_PASSWORD` as the primary hub gate after this story.
- Add a third role beyond admin/operator.
- Import KJV/bible data.
- Implement FR-10b retention policies.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No cookie | GET `/` | Redirect to `/login` | No Services leaked |
| Bad login | Wrong password | 401, stay logged out | Generic error |
| Operator | Valid operator session | Hub + service CRUD OK; `/admin` → 403 | 403 |
| Admin | Valid admin session | Hub + `/admin` account CRUD | — |
| Last admin | DELETE last admin | Rejected | 400 |
| Webhook | No session, valid secret | Still works | 401 if bad secret |

</intent-contract>

## Code Map

- `src/middleware.ts` -- session cookie gate; public login/auth/webhook; admin path requires role=admin
- `src/lib/db/index.ts` -- `accounts` table + bootstrap seed
- `src/lib/auth/password.ts` -- scrypt hash/verify
- `src/lib/auth/session.ts` -- sign/verify cookie payload (Edge-safe)
- `src/lib/auth/accounts.ts` -- CRUD helpers + last-admin guard
- `src/app/login/page.tsx` -- login form
- `src/app/api/auth/login/route.ts` + `logout/route.ts` -- set/clear cookie
- `src/app/admin/page.tsx` -- Admin account manager UI
- `src/app/api/admin/accounts/route.ts` + `[id]/route.ts` -- Admin APIs
- `src/app/page.tsx` -- logout link; Admin link if admin
- `.env.example` -- `AUTH_SECRET`, bootstrap vars; deprecate `AUTH_PASSWORD`
- sprint-status + story 6-2 → done

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/db/index.ts` -- accounts schema + bootstrap -- FR-18 persistence
- [x] `src/lib/auth/*` -- password + session + accounts helpers -- single auth core
- [x] `src/middleware.ts` -- cookie session replaces Basic Auth -- hub gate
- [x] `src/app/login/page.tsx` + `api/auth/login|logout` -- form login
- [x] `src/app/admin/*` + `api/admin/accounts/*` -- Admin account CRUD
- [x] Hub chrome (logout / Admin link) -- discoverability
- [x] `.env.example` -- document AUTH_SECRET + bootstrap
- [x] sprint + story 6.2 status -- tracking
- [x] `npm run build` -- compile
- [x] smoke: unauth redirect / operator 403 on admin / last-admin delete blocked -- I/O matrix

**Acceptance Criteria:**
- Given no session, when visiting hub, then redirected to login and Services are not shown.
- Given Operator session, when using hub, then service CRUD works and `/admin` is forbidden.
- Given Admin session, when managing accounts, then create/list/role/password/delete work; last admin cannot be deleted.
- Given webhook secret, when posting webhook without session, then still succeeds.
- Given this change, when inspecting code, then no bible/kjv imports.

## Spec Change Log

## Review Triage Log

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 2, medium 4, low 2)
- defer: 2: (high 0, medium 2, low 0)
- reject: 4
- addressed_findings:
  - `[high]` `[patch]` Open redirect via `//evil` next → `safeNextPath`
  - `[high]` `[patch]` Admin APIs trust middleware only → `requireAdminSession` DB re-check
  - `[medium]` `[patch]` Matcher prefix bypass for webhook → boundary `(?:/|$)`
  - `[medium]` `[patch]` Last-admin race → transactional update/delete
  - `[medium]` `[patch]` Weak/whitespace AUTH_SECRET → min 16 chars + trim
  - `[medium]` `[patch]` Password length / timing / bootstrap validation tightened
  - `[low]` `[patch]` Login password max length before scrypt
  - `[low]` `[patch]` Bootstrap UNIQUE race swallowed

## Design Notes

Session cookie payload: `{ uid, role, exp }` HMAC-SHA256 with `AUTH_SECRET` (Web Crypto in middleware). Login verifies password via Node scrypt in Route Handler. Admin APIs re-load account from SQLite so demotion invalidates privileged API use even if cookie role is stale. Remove Basic Auth WWW-Authenticate flow.

## Verification

**Commands:**
- `npm run build` -- success
- `node scripts/smoke-auth.mjs` -- unauth / roles / last-admin / no bible

## Auto Run Result

Status: done

**Summary:** Per-person Admin/Operator auth (FR-18) replaces shared Basic Auth with form login, scrypt passwords, HMAC session cookies, Admin account UI/API, and webhook still secret-only.

**Review:** 8 patches applied; 2 deferred (rate limit, session revoke). Follow-up review recommended: false.
