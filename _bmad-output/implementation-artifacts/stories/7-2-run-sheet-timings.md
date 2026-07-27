# Story 7.2: Run-Sheet timings (FR-17)

Status: done

## Story

As an on-duty operator,
I want timings from the rundown preserved and shown on the Run-Sheet,
So that I can follow the order of service without WhatsApp.

## Acceptance Criteria

1. **Given** a rundown with `(5m)` / section ranges, **When** parsed, **Then** items keep `timing`.
2. **Given** the Run-Sheet, **When** viewed, **Then** timings display next to roles/sections/hymns.
3. **Given** role matching, **When** parsing, **Then** timings are still stripped for matching only.
