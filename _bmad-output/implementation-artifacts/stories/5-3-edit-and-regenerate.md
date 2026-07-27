# Story 5.3: Edit & Regenerate Service

Status: done

## Story

As an operator,
I want to edit the raw rundown text of a service via the web UI,
So that I can fix typos or make late song swaps and regenerate the PPTX (FR-11, FR-13).

## Tasks / Subtasks

- [x] API Endpoint (`src/app/api/services/[id]/route.ts`)
  - [x] Implement PUT method to accept updated `raw_payload`.
  - [x] Re-run the `parseRundown` logic on the updated payload.
  - [x] Update `services` table with the new `raw_payload` and `parsed_data`.
- [x] UI Update (`src/app/services/[id]/page.tsx`)
  - [x] Add an "Edit Raw Payload" button that opens a simple `<textarea>` editor for the raw payload.
  - [x] On save, call the PUT API endpoint, which updates both raw and parsed data, then refresh the page.
