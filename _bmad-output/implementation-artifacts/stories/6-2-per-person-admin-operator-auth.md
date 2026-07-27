# Story 6.2: Per-person Admin / Operator Auth

Status: done

## Story

As a church admin,
I want individual accounts with Admin and Operator roles,
So that FR-18 is met beyond a shared Basic Auth password.

## Acceptance Criteria

1. **Given** an unauthenticated user, **When** they visit the hub, **Then** they cannot see Services.
2. **Given** an Operator account, **When** authenticated, **Then** they can review/edit/regenerate/download/delete Services.
3. **Given** an Admin account, **When** authenticated, **Then** they can manage accounts/roles (retention later via FR-10b).

## Tasks / Subtasks

- [x] Accounts schema + bootstrap seed (`AUTH_BOOTSTRAP_USER` / `AUTH_BOOTSTRAP_PASSWORD`)
- [x] Password scrypt + Edge-verifiable HMAC session cookie
- [x] Middleware cookie gate (replace Basic Auth); webhook matcher excluded
- [x] Login / logout UI + APIs
- [x] Admin account CRUD UI + APIs; last-admin delete blocked
- [x] Hub chrome: Log out + Admin link (admins only)
- [x] `.env.example` AUTH_SECRET + bootstrap; AUTH_PASSWORD deprecated
- [x] `npm run build` + `node scripts/smoke-auth.mjs`

## References

- PRD FR-18
- Spec: `_bmad-output/implementation-artifacts/spec-6-2-per-person-admin-operator-auth.md`

## Dev Agent Record

### Completion Notes

Replaced shared Basic Auth with per-person admin/operator accounts, form login, and signed HttpOnly session cookies verified in middleware via Web Crypto HMAC (no SQLite in middleware). Webhook remains `WEBHOOK_SECRET` only. No bible/KJV imports.

### File List

- `src/lib/db/index.ts`
- `src/lib/auth/password.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/accounts.ts`
- `src/middleware.ts`
- `src/app/login/page.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/admin/page.tsx`
- `src/app/admin/AccountsManager.tsx`
- `src/app/api/admin/accounts/route.ts`
- `src/app/api/admin/accounts/[id]/route.ts`
- `src/app/page.tsx`
- `src/components/LogoutButton.tsx`
- `.env.example`
- `scripts/smoke-auth.mjs`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/spec-6-2-per-person-admin-operator-auth.md`
- `_bmad-output/implementation-artifacts/stories/6-2-per-person-admin-operator-auth.md`

### Change Log

- 2026-07-18: Implemented Story 6.2 per-person Admin/Operator auth; build + smoke passed.
