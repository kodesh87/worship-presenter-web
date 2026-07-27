# Epic 7 Context: Phase 1 Residuals + Phases 2–6

## Goal

Close remaining Phase 1 PRD gaps, then deliver nice-to-have Phases 2–6 in order.

## Stories (planned)

### Epic 7 — Phase 1 residuals
- 7.1 FR-8 services list/search API (`GET /api/services?q=`)
- 7.2 FR-17 timings on Run-Sheet (stop discarding in parser)
- 7.3 FR-4/6 Part C standing slides + optional sermon/family image slots
- 7.4 FR-14 font note in deploy docs

### Epic 8 — Phase 2 (FR-9, FR-15)
- Shared slide plan from service data
- Full-screen web slideshow + browser preview (same order as PPTX)
- Keyboard next/prev + fade; best-effort offline after load

### Epic 9 — Phase 3 (FR-12, FR-13b)
- Telegram correction via webhook targeting
- First-save-wins concurrency on Service edit

### Epic 10 — Phase 4 (FR-10b)
- Retention policy for any cached generated PPTX (data rows persist)

### Epic 11 — Phase 5 (FR-16)
- Dual-screen Presenter Mode (projector + operator)

### Epic 12 — Phase 6 (FR-19)
- Import KJV from `.work/tp_bible_*` into SQLite
- On-demand scripture display inside Presenter Mode

## Constraints

- PPTX remains hard offline guarantee.
- KJV never used for deck theme/verse slides.
- No video/MP4 announcement support.
