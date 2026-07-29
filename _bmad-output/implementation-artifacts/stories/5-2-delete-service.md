# Story 5.2: Delete Service

Status: done

## Story

As an operator,
I want to delete a service and its parsed data,
So that I can clean up test data or canceled services (FR-10).

## Acceptance Criteria

**None were authored.** Recorded 2026-07-29 by Correct Course (`../../planning-artifacts/sprint-change-proposal-2026-07-29.md`), finding C5-4 of the implementation-readiness assessment: this story shipped `done` with a Tasks list and no Acceptance Criteria section at all — the only story in the repository in that state, on the operation that deletes a member's photos, prayer-request text, and uploaded images.

AC was **deliberately not backfilled.** Criteria written now, against code that shipped weeks ago, cannot fail and would misrepresent themselves as verification. Until this behavior is covered by a story that precedes it, the verification reference is **PRD FR-10 and its testable consequences** (§4.3), not this file.

Its "so that" clause also cited **FR-10a**, an identifier the PRD never defined — it has FR-10 (manual full delete) and FR-10b (retention auto-delete). Corrected to FR-10 above.

## Tasks / Subtasks

- [x] API Endpoint (`src/app/api/services/[id]/route.ts`)
  - [x] Implement DELETE method to remove a record from `services` table by id.
- [x] UI Update (`src/app/services/[id]/page.tsx`)
  - [x] Add a "Delete Service" button that calls the DELETE API endpoint and redirects to the dashboard.
