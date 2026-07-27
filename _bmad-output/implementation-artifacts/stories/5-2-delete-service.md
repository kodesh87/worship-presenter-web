# Story 5.2: Delete Service

Status: done

## Story

As an operator,
I want to delete a service and its parsed data,
So that I can clean up test data or canceled services (FR-10a).

## Tasks / Subtasks

- [x] API Endpoint (`src/app/api/services/[id]/route.ts`)
  - [x] Implement DELETE method to remove a record from `services` table by id.
- [x] UI Update (`src/app/services/[id]/page.tsx`)
  - [x] Add a "Delete Service" button that calls the DELETE API endpoint and redirects to the dashboard.
