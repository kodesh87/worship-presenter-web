# Story 6.1: Persistent Announcement List

Status: done

## Story

As an operator,
I want a persistent Announcement List with add/replace/remove,
So that weekly flyers follow FR-3 (not only per-service `images_payload` arrays).

## Acceptance Criteria

1. **Given** an empty Announcement List, **When** a Service is generated, **Then** zero announcement slides are produced.
2. **Given** list items with image URLs, **When** PPTX is generated, **Then** slides appear in list order (image-only).
3. **Given** an operator replaces/removes an item, **When** the next regenerate runs, **Then** the Deck reflects the updated list.

## Amendment (2026-07-19)

Image refs may be remote http(s) **or** hub-local `/api/uploads/...` (Story 13.3). See Spec Change Log on `spec-6-1-persistent-announcement-list.md`.

## References

- PRD FR-3
- Epic 6 in `_bmad-output/planning-artifacts/epics.md`
- Spec: `_bmad-output/implementation-artifacts/spec-6-1-persistent-announcement-list.md`
- Related: `stories/13-3-local-announcement-uploads.md`
