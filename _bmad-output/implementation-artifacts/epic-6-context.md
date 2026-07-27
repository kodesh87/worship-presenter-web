# Epic 6 Context: Phase 1 Gap Closure

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Close remaining PRD Phase 1 gaps after Epics 1–5 shipped a vertical slice: persistent announcements, real Admin/Operator auth, deck fidelity, section-aware hymns, picoclaw intake, tests, image SSRF hardening, and deploy/SQLite ops — without pretending Phase 2–6 features are in scope.

## Stories

- Story 6.1: Persistent Announcement List
- Story 6.2: Per-person Admin / Operator Auth
- Story 6.3: Deck Blueprint Fidelity
- Story 6.4: Section-aware Hymn Mapping
- Story 6.5: picoclaw Intake + Hymn Title Readback
- Story 6.6: Automated Tests (parser / middleware / webhook)
- Story 6.7: Image URL Allowlist (SSRF Harden)
- Story 6.8: Deploy + SQLite Production Hardening

## Requirements & Constraints

- Announcement List is persistent and ordered across weeks; recurring items survive; one-offs attach to a single Service; empty list ⇒ zero announcement slides; images only (no video).
- Deck Part C consumes the Announcement List order for flyer slides.
- Shared Basic Auth remains temporary until Story 6.2; do not expand RBAC in 6.1.
- Scripture / KJV corpus stays out of the app DB until Phase 6 (FR-19); dumps may live only under `.work/`.
- Prefer additive schema/API changes compatible with existing `services.images_payload` until operators migrate.

## Technical Decisions

- Monolithic Next.js App Router: SQLite via `better-sqlite3`, PPTX via `pptxgenjs`, hub UI with Shadcn.
- Untrusted image URLs must stay http(s)-only; Story 6.7 will tighten allowlisting — 6.1 should reuse `coerceImageUrls` / `isSafeImageUrl`.
- Webhook remains secured by `WEBHOOK_SECRET`; hub by Basic Auth.

## UX & Interaction Patterns

- Operators manage announcements from the Web Hub (list + add/replace/remove/reorder) without installing clients.
- Run-sheet/detail pages should surface current announcement slides used for a Service.

## Cross-Story Dependencies

- 6.1 feeds PPTX Part C; 6.7 hardens the same image path.
- 6.5 may later send announcement instructions via webhook — keep API usable by both hub and agents.
- 6.3 fidelity work assumes announcement slides already come from the list.
