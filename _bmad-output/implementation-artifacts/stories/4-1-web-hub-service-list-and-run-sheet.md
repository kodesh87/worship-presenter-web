# Story 4.1: Web Hub Service List & Run-Sheet

Status: done

## Story

As an operator,
I want to view a list of upcoming services and see the full run-sheet,
So that I can verify the service details and use it during the service.

## Acceptance Criteria

1. **Given** I am an authenticated operator, **When** I navigate to the dashboard, **Then** I see a list of services, **And** clicking a service shows the detailed run-sheet UI built with Shadcn.

## Tasks / Subtasks

- [x] Implement Service List Dashboard (AC: 1)
  - [x] Read `services` from SQLite DB in `src/app/page.tsx`.
  - [x] Render a list of services (date and basic info) with links to detail page.
- [x] Implement Run-Sheet Detail Page (AC: 1)
  - [x] Create `src/app/services/[id]/page.tsx`.
  - [x] Read `parsed_data` and display roles, hymns, and unmapped lines nicely using Tailwind CSS and basic Shadcn concepts.
  - [x] Include a link to download the PPTX artifact.

## Dev Notes

### Developer Context Section
This is the beginning of Epic 4, building the Web UI. We need a basic dashboard to list the entries from Epic 2, and a detail view that will act as the "run-sheet" for the service, showing all parsed data.

### Technical Requirements
- Next.js Server Components should be used to fetch data directly from `src/lib/db`.
- Design should be clean and use Tailwind CSS utility classes.

### Architecture Compliance
- Fits the SPA (App Router) monolithic structure.
- Follows the Shadcn/Tailwind default UI requirement.

### References
- Epic 4 / Story 4.1 definition: `_bmad-output/planning-artifacts/epics.md`
- UX Requirements (Shadcn/Tailwind): `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` (Not fully fleshed out, follow standard Next.js+Tailwind patterns).

## Dev Agent Record

### Agent Model Used
Claude-3.5-Sonnet (via Jules)

### File List
- `src/app/page.tsx` (to update)
- `src/app/services/[id]/page.tsx` (to create)
