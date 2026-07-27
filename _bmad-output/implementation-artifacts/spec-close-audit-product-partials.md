---
title: 'Close audit product Partials (FR-3/4 + announcement URL)'
type: 'feature'
created: '2026-07-19'
status: 'done'
baseline_revision: '2bc666406b93fbe38da4c6828e827a6235e571fa'
review_loop_iteration: 0
final_revision: '9b2083bffb09c351847b007943a8521553ce886f'
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/audit-code-doc-epic-bmad-flow-2026-07-19.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/addendum.md'
warnings:
  - multiple-goals
---

<intent-contract>

## Intent

**Problem:** The 2026-07-19 audit left actionable product Partials open: Intercessory standing hymns `#671`/`#684` missing from the slide plan, Part C always emitting an Announcements title when the flyer list is empty, and announcement URLs accepting extensionless / video paths.

**Approach:** Emit the fixed Intercessory standing pair in blueprint order, gate the Announcements title on non-empty safe flyers, require image pathname extensions for announcement URLs, extend tests, and move those deferred items to Resolved while refreshing FR honesty in tracking docs.

## Boundaries & Constraints

**Always:**
- Treat `#671`/`#684` as fixed Template Skeleton (not payload Song Blocks); exclude them from payload middle hymns if present in rundown.
- Reuse existing hymn lookup / `pushSong` patterns (`lookupHymnByNumber`, `resolveWeHaveThisHope` style).
- Keep standing Part C slides (welcome-repeat, offering, etc.) even when flyers are empty.
- Update `deferred-work.md` and `epics.md` FR rows for closed gaps.

**Block If:**
- Hymns 671 or 684 are missing from the hymnal corpus (cannot invent lyric text).
- Blueprint order for Intercessory cannot be reconciled with a single code path without product decision.

**Never:**
- Rewrite FR-11 EditForm / dual-path images.
- Commit a full KJV corpus or change auth rate-limit / session revoke.
- Touch `_bmad/` installer packages.
- Live MIME HTTP probing for announcement URLs (pathname extension rules only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Intercessory plan | Any Service | Divider → song #671 → divider → song #684 in Part B | If hymn lookup fails, HALT/spec blocked — corpus must have both |
| Payload also lists 671/684 | Rundown contains those numbers | Standing pair only; not duplicated as middle Song Blocks | Filter from middle hymn list |
| Empty flyers | `flyers=[]` after resolve | No slide `id: 'announcements'`; other Part C standing slides remain | No error |
| Non-empty flyers | ≥1 safe image URL | `announcements` title then flyer image slides | Invalid URLs already filtered/rejected upstream |
| Extensionless URL | `https://cdn.example/clip` | `assertAnnouncementImageUrl` rejects | Throw clear error |
| Video ext | `https://cdn.example/a.mp4` | Reject | Throw |
| Image with query | `https://cdn.example/f.jpg?v=1.mp4` | Accept (pathname has image ext) | No error |

</intent-contract>

## Code Map

- `src/lib/slide-plan.ts` -- Intercessory divider (~232); Part C announcements (~303); `pushSong` / We Have This Hope pattern
- `src/lib/lyrics.ts` -- `lookupHymnByNumber`, `resolveWeHaveThisHope`
- `data/hymns.json` -- #671 / #684 entries present
- `src/lib/announcements.ts` -- `VIDEO_EXT`, `assertAnnouncementImageUrl`, flyer resolve
- `src/lib/images.ts` -- `isSafeImageUrl` (SSRF only; do not overload for image-ext)
- `tests/slide-plan.test.mjs` -- expects announcements with empty images today; update
- `_bmad-output/planning-artifacts/prds/.../addendum.md` -- slides 35–38 order
- `_bmad-output/implementation-artifacts/deferred-work.md` -- Still open items to close
- `_bmad-output/planning-artifacts/epics.md` -- FR-3 / FR-4 Partial rows

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/lyrics.ts` -- add resolver(s) for standing Intercessory hymns 671/684 (reuse `lookupHymnByNumber`) -- fixed skeleton lyrics
- [x] `src/lib/slide-plan.ts` -- emit Intercessory block: divider → pushSong 671 → divider → pushSong 684; exclude 671/684 from payload middle hymns -- FR-4 blueprint
- [x] `src/lib/slide-plan.ts` -- push `announcements` title only when `flyers.length > 0` -- FR-3 empty-list AC
- [x] `src/lib/announcements.ts` -- require image pathname extension (jpeg/png/gif/webp); keep video-ext reject; do not MIME-fetch -- URL hardening
- [x] `tests/slide-plan.test.mjs` -- assert Intercessory order + no announcements id when flyers empty + announcements when flyers present -- regression
- [x] `tests/announcements-url.test.mjs` (new) -- extensionless, `.mp4`, good `.jpg` with query -- unit coverage
- [x] `package.json` -- add new test file to `test` script -- CI runs it
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- move closed items to Resolved -- tracking
- [x] `_bmad-output/planning-artifacts/epics.md` -- set FR-3/FR-4 to Done (or Partial only if residual remains) -- honesty
- [x] `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` -- remove closed leftovers from Deferred -- honesty

**Acceptance Criteria:**
- Given any Service slide plan, when Part B is built, then slides include Intercessory divider, then hymn #671 song block, then Intercessory divider, then hymn #684 song block, in that order.
- Given a rundown that also lists #671 or #684 as payload hymns, when the plan is built, then those numbers appear only in the standing Intercessory pair, not as duplicate middle Song Blocks.
- Given resolved flyers are empty, when `buildSlidePlan` runs, then no slide has `id: 'announcements'`, and other Part C standing slides still exist.
- Given at least one safe flyer image URL, when `buildSlidePlan` runs, then an `announcements` title slide appears before flyer image slides.
- Given an announcement URL with no image pathname extension or a video pathname extension, when `assertAnnouncementImageUrl` runs, then it rejects; given `…/file.jpg?v=x.mp4`, when validated, then it accepts.
- Given `npm test` (or `package.json` test script), when run, then slide-plan and announcement URL tests pass.
- Given deferred-work and epics FR map, when read after this change, then the three closed gaps are not listed as open Partials without residual.

## Spec Change Log

## Review Triage Log

### 2026-07-19 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 2, medium 4, low 2)
- defer: 1: (medium 1)
- reject: 4: (medium 2, low 2)
- addressed_findings:
  - `[high]` `[patch]` Removed invented Intercessory lyric fallbacks; throw if corpus missing #671/#684
  - `[high]` `[patch]` Flyer resolve uses `isAnnouncementImageUrl` (image ext + not video), not SSRF-only
  - `[medium]` `[patch]` Filter standing numbers from Bible Talk + Divine Service buckets
  - `[medium]` `[patch]` Intercessory divider subtitles (podium / while praying)
  - `[medium]` `[patch]` Smoke script + audit FR table aligned; extensionless flyer test
  - `[medium]` `[patch]` Trailing-slash + percent-encoded image pathname acceptance
  - `[low]` `[patch]` decodeURIComponent pathname normalization in announcement URL checks
  - `[medium]` `[defer]` Part C Announcements title not contiguous with flyer slides (pre-existing order)

## Auto Run Result

**Summary:** Closed audit product Partials — Intercessory `#671`/`#684` standing pair, empty-list Announcements title gate, announcement image-extension URL hardening — with tests and tracking updates.

**Files changed:** `src/lib/{lyrics,slide-plan,announcements}.ts`, `tests/slide-plan.test.mjs`, `tests/announcements-url.test.mjs`, `package.json`, `scripts/smoke-announcements.mjs`, `deferred-work.md`, `epics.md`, `ARCHITECTURE-SPINE.md`, `audit-code-doc-epic-bmad-flow-2026-07-19.md`, this spec.

**Review:** 8 patches applied; 1 deferred (Part C flyer adjacency); 4 rejected (open/close reshuffle-as-correct, `.mp4.jpg` disguise, relative-import nit, in-review status noise).

**Follow-up review recommendation:** false

**Verification:** `npm test` — 32/32 passed.

**Residual risks:** FR-11 dual-path edit and FR-19 KJV corpus commit remain open by design; Intercessory throws if hymnal not seeded.

## Verification

**Commands:**
- `npm test` -- expected: all listed tests pass
- `rg -n "intercessory|671|684|announcements" src/lib/slide-plan.ts` -- expected: standing pair + gated announcements
- `rg -n "FR-3|FR-4|#671" _bmad-output/planning-artifacts/epics.md` -- expected: no false Partial for closed gaps
