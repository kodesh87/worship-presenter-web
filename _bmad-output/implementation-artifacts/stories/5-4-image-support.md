# Story 5.4: Image & Announcement Support

Status: done

## Story

As the system,
I want to receive, store, and process image URLs (for posters and announcements),
So that the generated PPTX includes visual announcements (FR-1, FR-3).

## Tasks / Subtasks

- [x] Update DB Schema (`src/lib/db/index.ts`)
  - [x] Add `images_payload` column to `services` table.
- [x] Update Webhook (`src/app/api/webhook/route.ts`)
  - [x] Extract `images` array from the incoming JSON body.
  - [x] Insert `images_payload` into the DB alongside `raw_payload`.
- [x] Update PPTX Generator (`src/lib/pptx.ts` & `src/app/api/services/[id]/pptx/route.ts`)
  - [x] Parse `images_payload` if it exists.
  - [x] Create an image slide for each URL in the array.
- [x] Update UI (`src/app/services/[id]/page.tsx`)
  - [x] Render thumbnail links for the stored images.
