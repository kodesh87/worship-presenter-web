# Story 13.2: Hub shell — Header, search, profile

Status: done

## Story

As an authenticated operator,
I want a shared hub chrome (nav, active route, dashboard search, profile actions),
So that I can move between Dashboard / Announcements / Settings and manage my session without per-page header drift.

## Acceptance Criteria

1. **Given** a logged-in session, **When** opening hub pages, **Then** `Header` shows Dashboard / Announcements / Settings (admin) with pathname-based active styling.
2. **Given** the profile dropdown, **When** changing password (min 8 chars), **Then** `POST /api/auth/change-password` updates the account; logout remains available.
3. **Given** the dashboard service list, **When** typing in the search box, **Then** rows filter client-side by date / speaker / title.
4. **Given** the login page, **When** viewing on narrow/wide viewports, **Then** the polished adaptive layout still posts to existing `/api/auth/login`.

## References

- Spec: `spec-13-hub-ux-and-liveserver-gap.md`
- Code: `src/components/Header.tsx`, `src/app/ServicesList.tsx`, `src/app/api/auth/change-password/route.ts`
- Range: `acad206..458aa01` (UI commits)
