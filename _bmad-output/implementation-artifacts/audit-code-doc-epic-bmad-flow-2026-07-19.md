---
title: Audit — code ↔ docs, epic/story truth, BMAD flow hygiene
date: 2026-07-19
baseline_head: fc8804ef7c889e6cfab456bc94be2912489c1471
phase1_merge: 47a9442
pre_jules_bmad: fe759cf
spec: null # spec-audit-code-doc-epic-bmad-flow.md — a `type: chore` doc-hygiene spec, deleted 2026-08-01. This report is what it produced and is the surviving record.
---

# Audit: Code ↔ Docs, Epic/Story Truth, BMAD Flow

**Scope:** Documentation and tracking hygiene only. No product `src/` fixes in this run.  
**Three-layer model:** (A) BMAD installer health → (B) tracking truth → (C) product FR completeness. Do not conflate layer B repairs with layer C feature work.

## Verdict

| Claim | Verdict |
|-------|---------|
| BMAD installer `_bmad/` damaged by Jules/Cursor delivery? | **No.** Tree hash `HEAD:_bmad` == `fe759cf:_bmad` (`25f51b4666acabe9b2cb46aabfb3a79fdeb69af0`). |
| `.claude` skills intact? | **Yes.** Only additive delta vs pre-Jules: `.claude/skills/picoclaw-webhook/`. |
| `47a9442` “Phase 1 finish” merge trustworthy as PRD-complete? | **No as PRD-complete.** Trustworthy as Epics 1–5 story-AC vertical slice + hymnal/skeleton; Phase 1 FR residuals and later phases were closed afterward (Epic 6–12). |
| HEAD `sprint-status.yaml` “all epics done” trustworthy? | **Story keys: yes (with caveats).** Epic/story board matches shipped surfaces, but FR honesty still had Partials (#671/#684, empty Part C Announcements title, KJV corpus not in `data/`). Missing story file `1-1` was a tracking hole (stubbed this hygiene run). |

**Bottom line:** The “gak karuan” feeling was primarily **layer B tracking drift**, not a broken BMAD installer. Product gaps remain and must stay visible as Partial/open — not silently marked Done.

---

## Layer A — BMAD installer

| Check | Evidence | Result |
|-------|----------|--------|
| `_bmad/` tree hash | `git rev-parse HEAD:_bmad` vs `fe759cf:_bmad` → identical | Intact |
| Core skills rewritten? | No mass churn under `_bmad/` | Intact |
| `.claude` delta | Only `picoclaw-webhook` skill added | Healthy additive change |

**Conclusion:** Reinstall / rewrite of BMAD core is **not** indicated. Flow pain was downstream artifacts, not installer corruption.

---

## Layer B — Tracking truth (drift found)

| Item | Severity | Before | After this hygiene run |
|------|----------|--------|------------------------|
| Missing `stories/1-1-*.md` while sprint key `done` | CRITICAL | Hole | Historical stub created Status done |
| `epics.md` FR map: FR-1 “picoclaw skill missing”; FR-3 Open | MAJOR | False | Map refreshed; FR-1 not skill-missing; FR-3 Partial for empty-list title |
| `phase1-remaining-backlog.md` still “Do next Epic 6” | MAJOR | False active board | SUPERSEDED banner |
| `deferred-work.md` lists Epic 6 fixes as open | MAJOR | Ghost debt | Resolved vs Still open |
| Story `6-5` “agent skill package still missing” | MAJOR | Stale | Points at `.claude/skills/picoclaw-webhook/` |
| `ARCHITECTURE-SPINE.md` Deferred (Basic Auth / Phase 2–6) | MAJOR | Outdated | Deferred = current leftovers |
| `DESIGN.md` / `EXPERIENCE.md` as-built honesty | MAJOR / MINOR | Stale / empty stub | Honesty notes; no UX redesign |
| Sprint story statuses vs code | — | Align on done keys | Unchanged (meta comment only) |

---

## Layer C — Product FR completeness (document only)

### CRITICAL (product) — closed 2026-07-19 (`spec-close-audit-product-partials`)

1. **FR-4 Intercessory `#671` / `#684`** — standing pair emitted in blueprint order; payload duplicates excluded.  
2. **FR-3 empty Announcement List** — `announcements` title gated on non-empty image flyers.  
3. **Extensionless / video announcement URLs** — `assertAnnouncementImageUrl` + flyer filter require image pathname extensions.

### CRITICAL (tracking — resolved in hygiene run)

4. **Missing story file `1-1`** — historical stub added (non-binding).

### MAJOR (product / ops honesty) — still open

| Gap | Notes |
|-----|-------|
| KJV corpus not committed under `data/` | FR-19 UI/import path exists; corpus expected from `.work/` / `import:kjv` |
| FR-11 edit surface still dual-path | Legacy `images_payload` + Announcement List |
| Auth hardening | No login rate-limit/lockout; session revoke on logout deferred |
| SDAH lyric license/attribution | `data/hymns.json` present; copyright status not documented in-repo |

### MINOR

| Gap | Notes |
|-----|-------|
| Concurrent first-boot hymn seed UNIQUE race | Rare under single-process Next.js |
| UX experience design incomplete | As-built stub only; not a full experience design |
| Part C Announcements title vs flyer slide adjacency | Title gated; flyer images still after standing Part C slides (pre-existing order) |

---

## FR bucket table (HEAD evidence)

Vocabulary matches `epics.md`: **Done** / **Partial** (not a separate “Shipped” board).

| FR | Bucket | Evidence / remaining gap |
|----|--------|--------------------------|
| FR-1 | **Done** | Webhook upsert + `resolvedHymns` / `failedHymnNumbers`; skill docs at `.claude/skills/picoclaw-webhook/` (skill ≠ proof of live Telegram bot deployment) |
| FR-2 | **Done** | 695-hymn corpus `data/hymns.json` |
| FR-3 | **Done** | Persistent list + Announcements title gated on non-empty image flyers |
| FR-4 | **Done** | Part A/B/C + Intercessory standing `#671`/`#684` pair |
| FR-5 | **Done** | Verse/Reff lyric slides |
| FR-6 | **Done** | Theme, verse reading, sermon, family/graphic slots in slide plan |
| FR-7 | **Done** | Fade transition |
| FR-8 | **Done** | Hub + `GET /api/services?q=` (hub UI has no search box) |
| FR-9 | **Done** | Slideshow / slide-plan preview |
| FR-10 | **Done** | Manual delete Service |
| FR-10b | **Done** | `.cache/pptx/` retention |
| FR-11 | **Partial** | Edit/regenerate exists; not full structured PRD form |
| FR-12 | **Done** | Webhook `action: correct` |
| FR-13 | **Done** | Regenerate in place |
| FR-13b | **Done** | `updated_at` / 409 concurrency |
| FR-14 | **Done** | PPTX download + Arial deploy note |
| FR-15 | **Done** | Full-screen web slideshow |
| FR-16 | **Done** | Presenter + projector BroadcastChannel |
| FR-17 | **Done** | Run-sheet timings |
| FR-18 | **Done** | Per-person admin/operator accounts |
| FR-19 | **Partial** | Presenter KJV path + import; corpus not committed in `data/` (ops honesty; Story 12.1 AC is import path) |

---

## BMAD flow repairs (P0–P2)

| Priority | Repair | Applied this chore? |
|----------|--------|---------------------|
| **P0** | Stop treating `phase1-remaining-backlog.md` as active; point operators at `sprint-status.yaml` + this audit | **Yes** (supersede banner) |
| **P0** | Restore FR Coverage Map honesty in `epics.md` (FR-1/3 and known Partials) | **Yes** |
| **P0** | Close missing `1-1` story coverage hole | **Yes** (historical stub) |
| **P0** | Split `deferred-work.md` Resolved vs Still open | **Yes** |
| **P1** | Fix stale story `6-5` skill note; refresh ARCHITECTURE Deferred | **Yes** |
| **P1** | DESIGN / EXPERIENCE as-built honesty (no redesign) | **Yes** |
| **P1** | Sprint meta `last_updated` comment for audit hygiene | **Yes** (statuses not flipped) |
| **P2** | Product work: emit `#671`/`#684`; skip empty Announcements title; commit/document KJV import | **No** — out of scope (docs/tracking only) |
| **P2** | Structural Seed `agent/` → `.claude/skills/picoclaw-webhook/` | **Yes** (path corrected in ARCHITECTURE-SPINE) |
| **P2** | Full EXPERIENCE journey maps / visual polish | **No** — as-built stub only |

---

## Evidence commands (re-runnable)

```text
git rev-parse HEAD:_bmad
git rev-parse fe759cf:_bmad
# expect identical

Test-Path _bmad-output/implementation-artifacts/stories/1-1-next-js-foundation-and-monorepo-setup.md
# expect True after this run

rg -n "SUPERSEDED|superseded" _bmad-output/implementation-artifacts/phase1-remaining-backlog.md
rg -n "picoclaw skill missing" _bmad-output/planning-artifacts/epics.md
# expect no false “skill missing” claim

git diff --name-only
# expect no paths under _bmad/ or src/
```

## Related artifacts updated this run

- `phase1-remaining-backlog.md` — superseded  
- `epics.md` — FR map + narrative  
- `deferred-work.md` — Resolved / Still open  
- `stories/1-1-next-js-foundation-and-monorepo-setup.md` — created  
- `stories/6-5-picoclaw-intake-readback.md` — skill path  
- `architecture-…/ARCHITECTURE-SPINE.md` — Deferred  
- `ux-…/DESIGN.md`, `EXPERIENCE.md` — as-built notes  
- `sprint-status.yaml` — `last_updated` comment only  
