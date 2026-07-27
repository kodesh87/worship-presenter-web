---
status: as-built-stub
updated: '2026-07-19'
---

# Experience — As-Built Stub

> **Honesty note:** This file was an empty draft. It is **not** a complete UX experience design. Flows below are descriptive of shipped behavior only; no full redesign.

## Operator Friday path (as-built)

1. Authenticate (admin or operator session).
2. Open Worship Hub (`/`) → pick Service by date (card list). Dashboard client search filters the loaded list by date / speaker / title; API `GET /api/services?q=` remains for picoclaw / automation (FR-8/FR-12).
3. Review Run-Sheet (`/services/[id]`); edit inputs / regenerate; manage Announcement List (`/announcements`).
4. Download PPTX for offline Sabbath, and/or open Web Slideshow for in-browser review.

## Sabbath presentation paths (as-built)

| Path | Surface | Role |
|------|---------|------|
| Offline | Downloaded PPTX | Primary venue guarantee (AD-1) |
| Web | Slideshow | Full-screen follow-along (FR-15) |
| Dual-screen | Presenter + projector | Notes/control vs audience (FR-16) |
| Scripture | Presenter KJV lookup | On-demand; never injected into deck (FR-19) |

## Deferred experience work

- Detailed journey maps, edge-case error UX, and visual polish beyond Shadcn defaults
- Documented KJV corpus onboarding for operators (import from `.work/` / `import:kjv`)
