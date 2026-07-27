# Story 2.1: Telegram Webhook Endpoint

Status: done

## Story

As an events department member,
I want to send a rundown message to a Telegram bot,
So that the system receives the weekly schedule.

## Acceptance Criteria

1. **Given** the Next.js API, **When** a Telegram message payload is sent to the webhook endpoint, **Then** the text payload is captured and stored in the database as a raw service entry.

## Tasks / Subtasks

- [x] Create API route for Telegram webhook (AC: 1)
  - [x] Implement `src/app/api/webhook/route.ts` to handle POST requests.
- [x] Connect and save to SQLite DB (AC: 1)
  - [x] Extract text payload from request.
  - [x] Use `src/lib/db/index.ts` to insert the raw text into the `services` table.

## Dev Notes

### Developer Context Section
This story covers the first half of Epic 2: Data Ingestion & Processing. It focuses strictly on receiving the raw webhook payload (presumably from picoclaw parsing a Telegram message) and persisting it into the `services` table. The parsing logic will be handled in Story 2.2.

### Technical Requirements
- Webhook endpoint should accept standard POST requests.
- Endpoint should gracefully handle missing or malformed text payloads by returning an appropriate HTTP error (e.g., 400 Bad Request) rather than crashing.

### Architecture Compliance
- Use Next.js API Routes (App Router `route.ts`).
- Continue using `better-sqlite3` as established in `src/lib/db/index.ts`.

### Library/Framework Requirements
- Next.js (App Router) API handling (`NextRequest`, `NextResponse`).

### File Structure Requirements
- Endpoint: `src/app/api/webhook/route.ts`
- Ensure this API route is NOT blocked by the basic auth middleware created in Story 1.2 (verify `src/middleware.ts` excludes `/api`).

### Testing Requirements
- Provide a simple `curl` command or instructions to test the webhook manually.

### References
- Epic 2 / Story 2.1 definition: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used
Claude-3.5-Sonnet (via Jules)

### File List
- `src/app/api/webhook/route.ts` (to create)
