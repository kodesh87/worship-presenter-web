---
status: as-built
updated: '2026-07-19'
---

# UX Design — As-Built

> **Honesty note (2026-07-19):** Full visual design exploration was never completed. This file documents **what shipped**, not a redesign brief. See also [`EXPERIENCE.md`](./EXPERIENCE.md) and the hygiene audit [`audit-code-doc-epic-bmad-flow-2026-07-19.md`](../../../implementation-artifacts/audit-code-doc-epic-bmad-flow-2026-07-19.md).

Phase 1+ ships a pragmatic **Shadcn + Tailwind** operator surface aligned with UX-DR1 (clean, high-contrast defaults).

## Surfaces (as-built)

| Surface | Route | Notes |
|---------|-------|-------|
| Worship Hub (service list) | `/` | Service cards + client search; shared Header chrome |
| Announcement List manager | `/announcements` | Persistent flyer list (FR-3); hub file upload → `/api/uploads/...` |
| Run-Sheet detail | `/services/[id]` | Order of service, timings, edit/delete, PPTX download |
| Web Slideshow | `/services/[id]/slideshow` | Full-screen slide-plan player (FR-9/15) |
| Presenter Mode | `/services/[id]/present` (+ projector) | Dual-screen via BroadcastChannel (FR-16) |
| Settings (admin) | `/admin` | Per-person Admin/Operator (FR-18); nav label Settings |
| Profile (Header) | (dropdown) | Username indicator; change password; logout |
| Auth | Login + session cookie | Replaces shared Basic Auth–only era |

## Components in use

- `src/components/Header` — shared nav (Dashboard / Announcements / Settings), profile dropdown
- `src/components/ui/button`, `card` (and existing dialog/popover/sonner as needed)
- Dark/light via existing theme tokens

## Out of scope for this note

- Full UX redesign, wireframes, or experience mapping beyond as-built honesty
- Closed product gaps (Intercessory `#671`/`#684`, empty Announcements title) — already resolved; not open UX work
