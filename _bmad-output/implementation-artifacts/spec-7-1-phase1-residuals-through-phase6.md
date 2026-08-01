---
title: '7.x Phase 1 residuals + Phases 2–6 delivery'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: 'c05c2d3'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
warnings:
  - multiple-goals
  - oversized
---

<intent-contract>

## Intent

**Problem:** Phase 1 still misses FR-8 search API, FR-17 timings, and Part C standing slides; Phases 2–6 (web slideshow through KJV scripture) are not started.

**Approach:** Close Phase 1 residuals first, then ship Phase 2 slide plan + slideshow, Phase 3 corrections + concurrency, Phase 4 retention, Phase 5 presenter mode, Phase 6 KJV import + scripture UI — in that order.

## Boundaries & Constraints

**Always:**
- Shared slide plan drives PPTX order and Web Slideshow order (same sequence).
- KJV used only for FR-19 scripture lookup, never for deck theme/verse text.
- PPTX download remains the hard offline path.
- Auth roles from 6.2 remain enforced.
- Webhook stays `WEBHOOK_SECRET`-gated.

**Block If:**
- None — use standing placeholder text for bank/QR/contact when assets absent.

**Never:**
- Video/MP4 announcements.
- Multi-church config.
- Skipping Phase order (2→3→4→5→6).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Search services | `GET /api/services?q=2026` | Matching services JSON | 401 if no session |
| Timings | Rundown has `(5m)` | Run-Sheet shows timing | — |
| Slideshow | Open `/services/:id/slideshow` | Full-screen slides match PPTX order | 404 unknown id |
| Correction | Webhook correction payload | Targeted service updated | 404 if not found |
| Concurrent edit | Stale `updated_at` | 409 first-save-wins | Client refresh |
| Retention | Cached PPTX older than policy | Cache file deleted; row kept | — |
| Scripture | `John 4:23` in presenter | KJV text on projector pane | 404 unknown ref |

</intent-contract>

## Code Map

- `src/app/api/services/route.ts` -- list/search
- `src/lib/parser.ts` -- preserve timings
- `src/lib/pptx.ts` + `src/lib/slide-plan.ts` -- Part C + shared plan
- `src/app/services/[id]/slideshow/` -- FR-9/15
- `src/app/api/webhook/route.ts` -- FR-12 corrections
- `src/lib/db/index.ts` -- concurrency + retention + KJV tables
- `scripts/import-kjv.mjs` -- Phase 6 import from `.work/`
- `docs/deploy.md` -- fonts + retention
- sprint-status epic-7…12

## Tasks & Acceptance

**Execution:**
- [x] Phase 1 residuals (FR-8, FR-17, Part C standing, font note)
- [x] Phase 2 slide plan + slideshow/preview
- [x] Phase 3 correction + first-save-wins
- [x] Phase 4 retention
- [x] Phase 5 presenter mode
- [x] Phase 6 KJV import + scripture display
- [x] Update sprint/stories/epics tracking
- [x] `npm test` + `npm run build`

**Acceptance Criteria:**
- Given Phase 1 residuals, when audited, then FR-8/17 and Part C standing slides are present.
- Given a Service, when slideshow opens, then slide order matches PPTX plan.
- Given Telegram correction, when webhook posts, then targeted Service updates.
- Given stale edit, when PUT with old token, then 409.
- Given retention window, when cleanup runs, then only cached PPTX removed.
- Given Presenter Mode, when dual windows open, then advance stays in lockstep.
- Given KJV imported, when operator looks up a reference in Presenter Mode, then KJV text displays.

## Spec Change Log

- 2026-07-18: Implemented Phases 1 residuals through Phase 6; tracking stories 7.1–12.1 marked done.

## Review Triage Log

## Design Notes

Prefer extracting `buildSlidePlan(parsed, images)` used by `generatePptx` and the web slideshow. KJV import from `.work/tp_bible_*.json` into `bible_books` / `bible_verses` tables via `npm run import:kjv`.

## Verification

**Commands:**
- `npm test` -- success
- `npm run build` -- success
- smoke scripts for slideshow / kjv / services API as added
