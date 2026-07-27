# Story 1.2: Basic Authentication and Roles

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a church operator,
I want to log into the web hub using a shared password or basic auth,
So that member PII and service details are protected from public access.

## Acceptance Criteria

1. **Given** I am an unauthenticated user, **When** I visit the web hub root, **Then** I am prompted to enter a password or authenticate, **And** I cannot see any service details until authenticated.

## Tasks / Subtasks

- [x] Implement middleware to check for authentication token or basic auth credentials (AC: 1)
  - [x] Set up Next.js middleware for the Web Hub paths (e.g. `src/app/`, or `/`)
- [x] Create a simple login page or Basic Auth prompt (AC: 1)
  - [x] If using Basic Auth, return `401 Unauthorized` with `WWW-Authenticate: Basic` header in middleware
- [x] Store shared password securely using environment variables
  - [x] Update `.env.example` and documentation

## Dev Notes

### Developer Context Section

This story establishes the basic security perimeter for the web hub. It is meant to be a simple, shared password or basic authentication mechanism. Complex RBAC (Role-Based Access Control) is deferred, as noted in the Architecture Spine. The primary goal is to prevent public access to PII and service details.

### Technical Requirements

- Use Next.js (App Router) for the implementation, as per the established Next.js monorepo foundation.
- Authentication state can be managed via an encrypted cookie or basic auth headers.
- The shared password should be read from an environment variable (e.g., `AUTH_PASSWORD`).

### Architecture Compliance

- **Paradigm:** The application is a monolithic Next.js app (App Router).
- **Deferred Decisions:** "Given the internal nature of the tool, complex RBAC is deferred. A simple shared password or basic auth will be used for v1 to protect the web hub." (from `ARCHITECTURE-SPINE.md`).

### Library/Framework Requirements

- Next.js (App Router v14+)
- No complex auth libraries (like NextAuth/Auth.js) are strictly required if a simple Basic Auth or password cookie suffices for V1, but can be used if it simplifies implementation without adding unnecessary overhead. Given the simplicity requirement, native Next.js middleware is preferred.

### File Structure Requirements

- **Middleware:** `src/middleware.ts`
- **Login (if form-based):** `src/app/login/page.tsx`
- **Protected routes:** Ensure all routes under `src/app/` (except login) are protected.

### Testing Requirements

- Unit test for middleware logic (if applicable/extractable).
- End-to-end test (or manual testing instructions) to verify unauthenticated users are redirected/blocked, and authenticated users can access the protected routes.

### Previous Story Intelligence

- `1-1-next-js-foundation-and-monorepo-setup` established the Next.js foundation with Tailwind/Shadcn UI and a basic SQLite connection. We should build upon this existing Next.js structure.

### References

- Epic 1 / Story 1.2 definition: `_bmad-output/planning-artifacts/epics.md`
- Architecture Guidelines: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`

## Dev Agent Record

### Agent Model Used

Claude-3.5-Sonnet (via Jules)

### Debug Log References

N/A

### Completion Notes List

- Comprehensive story created with specific instructions for a simple auth implementation using Next.js middleware.

### File List
- `src/middleware.ts` (to create/update)
- `src/app/login/page.tsx` (to create, if form approach is chosen)
- `.env.example` (to update)