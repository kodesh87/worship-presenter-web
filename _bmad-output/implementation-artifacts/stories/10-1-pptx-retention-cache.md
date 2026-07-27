# Story 10.1: PPTX retention cache (FR-10b)

Status: done

## Story

As an admin,
I want generated PPTX cache files expired by retention policy,
So that storage stays bounded while Service data persists.

## Acceptance Criteria

1. **Given** PPTX generation, **When** complete, **Then** a cache file may be written under `.cache/pptx/`.
2. **Given** retention days (env or Admin settings, default 60), **When** cleanup runs, **Then** only old cache files are deleted.
3. **Given** cleanup, **When** it finishes, **Then** Service rows and announcements remain.
