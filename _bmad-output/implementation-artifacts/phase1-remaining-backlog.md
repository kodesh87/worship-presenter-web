> **SUPERSEDED (2026-07-19) — do not use as the active backlog.**  
> Epic 6–12 story keys are **done** on `main`. Canonical tracking: [`sprint-status.yaml`](./sprint-status.yaml).  
> Current honesty audit (installer vs tracking vs product gaps): [`audit-code-doc-epic-bmad-flow-2026-07-19.md`](./audit-code-doc-epic-bmad-flow-2026-07-19.md).  
> Everything below is a **historical archive** of the 2026-07-18 operator board only.

# ARCHIVE — Phase 1 Remaining Backlog (as of 2026-07-18; superseded)

**Branch:** `main` @ merge PR #7  
**Shipped:** Epics 1–5 story ACs (webhook → hymnal → BIC skeleton PPTX → hub → edit/delete)  
**Not PRD-complete:** see Epic 6 below

## Do next (Epic 6 — ready-for-dev)

| Story | FR / concern | Story file |
|-------|----------------|------------|
| 6.1 Persistent Announcement List | FR-3 | `stories/6-1-persistent-announcement-list.md` |
| 6.2 Per-person Admin/Operator auth | FR-18 | `stories/6-2-per-person-admin-operator-auth.md` |
| 6.3 Deck blueprint fidelity (+ structured FR-11 edit) | FR-4 / FR-6 / FR-11 | `stories/6-3-deck-blueprint-fidelity.md` |
| 6.4 Section-aware hymn mapping | FR-4 | `stories/6-4-section-aware-hymn-mapping.md` |
| 6.5 picoclaw intake + title readback | FR-1 | `stories/6-5-picoclaw-intake-readback.md` |
| 6.6 Automated tests | NFR-4 / debt | `stories/6-6-automated-tests-parser-auth-webhook.md` |
| 6.7 Image URL allowlist | Security | `stories/6-7-image-url-allowlist-ssrf.md` |
| 6.8 Deploy + SQLite harden | Ops | `stories/6-8-deploy-sqlite-hardening.md` |

## Intentionally later (Phases 2–6)

- FR-9, FR-15 — Web slideshow / preview  
- FR-12, FR-13b — Telegram corrections  
- FR-10b — Retention  
- FR-16 — Presenter Mode  
- FR-19 — Scripture (KJV files already in `.work/`; do not import until Phase 6)

## Tracking notes

- `epics.md` FR inventory was realigned to PRD IDs (old map had wrong FR-6/7/8 meanings).  
- Epic 4 “done” means Story 4.1 hub/run-sheet — **not** Phase 2–6 presenter features.  
- Shared Basic Auth remains v1; full FR-18 is Story 6.2.  
- Story **1.1** is marked done in sprint but has no `stories/1-1-*.md` file (historical gap; foundation is in repo).  
- FR-8 list/detail **API** for picoclaw still open — fold into Story **6.5** when implementing intake.
