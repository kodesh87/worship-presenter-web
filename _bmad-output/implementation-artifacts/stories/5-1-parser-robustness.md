# Story 5.1: Parser Robustness

Status: done

## Story

As the system,
I want a robust parser that maintains chronological order, uses strict regex, extracts dates, and normalizes line endings,
So that the generated PPTX accurately reflects the Telegram payload.

## Tasks / Subtasks

- [x] Fix Parser Logic (`src/lib/parser.ts`)
  - [x] Unify `roles` and `hymns` arrays into a single chronological `items` array.
  - [x] Tighten `roleRegex` to avoid matching random dates/words as roles.
  - [x] Try to extract date from payload text (e.g., YYYY-MM-DD), fallback to current date.
- [x] Fix Lyrics Splitter (`src/lib/lyrics.ts`)
  - [x] Normalize Windows newlines (`\r\n`) to Unix newlines (`\n`) before splitting.
- [x] Update Webhook (`src/app/api/webhook/route.ts`)
  - [x] Use the extracted date from `parseRundown` instead of hardcoding `new Date()`.
- [x] Update PPTX Generator (`src/lib/pptx.ts`)
  - [x] Loop over the new chronologically unified `items` array to generate slides in order instead of all roles then all hymns.
