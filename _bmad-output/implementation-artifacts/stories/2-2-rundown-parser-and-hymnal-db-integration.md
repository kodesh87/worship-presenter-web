# Story 2.2: Rundown Parser & Hymnal DB Integration

Status: done

## Story

As the system,
I want to parse the semi-structured rundown text and match hymns,
So that structured data is ready for presentation assembly.

## Acceptance Criteria

1. **Given** a raw rundown text payload, **When** the parser processes the text, **Then** it extracts roles, names, and identifies hymn numbers, **And** fetches the corresponding lyrics from the Hymnal DB mock/seed data.

## Tasks / Subtasks

- [x] Update DB Schema for Hymns (AC: 1)
  - [x] Add `hymns` table and seed data logic to `src/lib/db/index.ts`.
- [x] Implement Parsing Logic (AC: 1)
  - [x] Create `src/lib/parser.ts`.
  - [x] Implement `parseRundown(rawText: string)` to extract basic roles, names, and song numbers based on the expected PRD rundown formats (e.g., regex extraction).
- [x] Integrate Parser with Webhook (AC: 1)
  - [x] Update `src/app/api/webhook/route.ts` to call `parseRundown()` after inserting `raw_payload`.
  - [x] Update the `services` record with `parsed_data`.

## Dev Notes

### Developer Context Section
This story covers the second half of Epic 2. It introduces the `parseRundown` utility which interprets the raw text provided by the Telegram webhook. To fully realize AC1, the database must also be seeded with some basic Hymnal DB mock data so the parser can resolve hymnal numbers to actual lyrics.

### Technical Requirements
- The parser should be robust enough to handle slightly varied text inputs (as noted in PRD section 7, tolerating real semi-structured format like honorifics, markers).
- If a hymn number is found, query the `hymns` table for its lyrics.
- Store the final aggregated structured object (roles, songs, etc.) as JSON stringified in `services.parsed_data`.

### Architecture Compliance
- Logic should be kept in `src/lib/` (e.g., `src/lib/parser.ts`) separate from the Next.js API route to maintain testability.

### File Structure Requirements
- `src/lib/db/index.ts` (update)
- `src/lib/parser.ts` (create)
- `src/app/api/webhook/route.ts` (update)

### References
- Epic 2 / Story 2.2 definition: `_bmad-output/planning-artifacts/epics.md`
- PRD requirements: `_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md`

## Dev Agent Record

### Agent Model Used
Claude-3.5-Sonnet (via Jules)

### File List
- `src/lib/db/index.ts` (to update)
- `src/lib/parser.ts` (to create)
- `src/app/api/webhook/route.ts` (to update)
