---
title: 'Phase 1 finish: hymnal import, FR-4 BIC skeleton, parser harden, PR'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: 'ce24f71'
final_revision: 'cc4a094'
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/planning-artifacts/briefs/brief-bic-pptx-workflow-2026-07-10/addendum.md'
  - '{project-root}/_bmad-output/planning-artifacts/briefs/brief-bic-pptx-workflow-2026-07-10/source-pptx-structure.md'
warnings:
  - multiple-goals
  - oversized
---

<intent-contract>

## Intent

**Problem:** Jules marked Phase 1 done, but hymnal DB still has 2 stubs, PPTX is a flat black deck (not BIC Part A/B/C), and the parser does not match the real rundown sample. Corpus already exists at `.work/lirik-lagu.json` (695 hymns).

**Approach:** Import hymnal into `data/` + SQLite `hymns`; rewrite generator to emit BIC macro-sections with fade; tighten parser to the addendum sample; open a PR to `main`. Hold KJV until Phase 6.

## Boundaries & Constraints

**Always:**
- Source hymnal from `.work/lirik-lagu.json` (gitignored); commit a normalized `data/hymns.json` for runtime/CI.
- Hymn lookup remains by SDAH number; unknown numbers stay incomplete Song Blocks with `failedHymnNumbers`.
- PPTX prints only blueprint slide types (welcome/agenda/dividers/songs/scripture/sermon/closing-prayer/announcements/fixed liturgy) — not every run-sheet role.
- Run-sheet continues to show full chronological `items`.
- KJV dumps under `.work/tp_bible_*` are untouched.

**Block If:**
- `.work/lirik-lagu.json` missing or unreadable when generating `data/hymns.json`.
- `gh` / push cannot create PR to `main`.

**Never:**
- Import KJV / bible tables in this pass.
- Pixel-perfect clone of the 68-slide master (no Cooper BT; no embedded flyer videos).
- Persistent Announcement List (FR-3 full) — keep per-service `images_payload`.
- Rewrite auth to Admin/Operator accounts (FR-18) in this pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hymnal import | `.work/lirik-lagu.json` with 695 rows | `data/hymns.json` written; SQLite `hymns` count ≥ 695 | Fail import script with clear error if source missing |
| Known SDAH | Rundown `SDAH #1` | Hymn item with lyrics from DB | No error |
| Unknown SDAH | `SDAH #9999` | Incomplete hymn + number in `failedHymnNumbers` | Service still created |
| Special Song empty | `Special Song : -` | No Special Song divider in PPTX | No error |
| Closing Prayer alias | `Closing Prayer: The Speaker` after sermon | Resolves to sermon speaker name | If no sermon, keep literal / unmapped |
| Re-import hymnal | `hymns` already populated | Upsert by number; titles/lyrics refreshed | No duplicate rows |

</intent-contract>

## Code Map

- `.work/lirik-lagu.json` -- source dump (`nomor_lagu`, `full_lirik`; no title)
- `data/hymns.json` -- normalized committed corpus `{number,title,lyrics}[]`
- `scripts/import-hymnal.mjs` -- build `data/hymns.json` from `.work`
- `src/lib/db/index.ts` -- load/upsert hymnal from `data/hymns.json` on init
- `src/lib/parser.ts` -- Weekly Data Payload + sample rundown shapes
- `src/lib/lyrics.ts` -- verse/Chorus/Reff aware splits + labels
- `src/lib/pptx.ts` -- BIC Part A/B/C skeleton + fade
- `src/app/services/[id]/page.tsx` -- display new payload fields if present
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- mark 2.2 done after import

## Tasks & Acceptance

**Execution:**
- [x] `scripts/import-hymnal.mjs` -- read `.work/lirik-lagu.json`, derive title from first verse line (fallback `SDAH {n}`), write `data/hymns.json` -- rationale: commit-safe corpus without committing `.work`
- [x] `package.json` -- add `import:hymnal` script -- rationale: repeatable import
- [x] `src/lib/db/index.ts` -- on init, upsert all rows from `data/hymns.json` into `hymns` -- rationale: FR-2 real corpus
- [x] `src/lib/parser.ts` -- parse addendum markers (`》`, `[ ]`, timings), sermon, special song `-`, `The Speaker`, section headers; keep chronological `items` + structured fields -- rationale: real Events Dept input
- [x] `src/lib/lyrics.ts` -- split on Verse/Chorus/Reff; repeat Reff after each verse when present; label slides -- rationale: FR-5 readability
- [x] `src/lib/pptx.ts` -- emit Part A/B/C skeleton with fixed dividers, song blocks from ordered hymns, sermon/closing-prayer slides, announcement images in Part C, fade transitions -- rationale: FR-4/6/7 MVP skeleton
- [x] `src/app/services/[id]/page.tsx` -- show sermon / specialSong / failed hymns if present -- rationale: operator visibility
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` + story `2-2` -- set done when hymnal import verified -- rationale: honest tracking
- [x] unit smoke via `node` import + `npm run build` -- rationale: verify I/O matrix edges and compile
- [x] open PR `review/jules-epic5` → `main` via `gh pr create` -- rationale: goal 5

**Acceptance Criteria:**
- Given `.work/lirik-lagu.json` present, when `npm run import:hymnal` runs, then `data/hymns.json` exists with ~695 entries and SQLite hymn count matches after app init.
- Given rundown containing `SDAH #159`, when parsed with full corpus, then lyrics resolve (or incomplete only if number absent from corpus).
- Given parsed service with ≥1 hymn, when PPTX generated, then deck contains Part A/B/C section markers (welcome + Bible Talk Sequence + Divine Service Sequence + Announcements section) and fade on text slides.
- Given `Special Song : -`, when PPTX generated, then no Special Song divider appears.
- Given `Closing Prayer: The Speaker` and a sermon speaker, when parsed, then closing prayer name equals sermon speaker.
- Given branch pushed, when PR created, then PR targets `main` with summary of hymnal + FR-4 + parser work.
- Given KJV files in `.work`, when this change lands, then no bible tables or KJV import code are added.

## Spec Change Log

## Review Triage Log

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 0, medium 6, low 2)
- defer: 4: (high 0, medium 3, low 1)
- reject: 4
- addressed_findings:
  - `[medium]` `[patch]` Clean hymn titles (strip trailing punctuation) in `scripts/import-hymnal.mjs`
  - `[medium]` `[patch]` Import refuses empty corpus; skips null rows; reports skip count
  - `[medium]` `[patch]` `getDb` throws if `data/hymns.json` missing/invalid; require integer hymn numbers
  - `[medium]` `[patch]` Restore `[Role] Name` parsing; strip `(5 min)` timings; blank DB lyrics → incomplete
  - `[medium]` `[patch]` Closing-prayer PPTX slide only when `closingPrayerPerson` set (no invent from sermon)
  - `[medium]` `[patch]` Fade injection try/catch returns original buffer on failure
  - `[low]` `[patch]` Service Highlights card shows when only `specialSong` is set
  - `[low]` `[patch]` Fade XML path skips slides without known close tags

## Design Notes

Hymn titles are missing from the SQL dump. Derive title as the first non-empty lyric line after a `Verse 1`/`Verse` header; if that fails, use `SDAH {number}`. Prefer DB title over rundown trailing text when both exist.

Song-block mapping: ordered hymns from the rundown fill Song Blocks in sequence inside the skeleton (Bible Talk opening/closing, Divine Service opening/closing, extras appended before Part C). Short prayer-response numbers (`#671`, `#684`) are normal hymns in that order.

## Verification

**Commands:**
- `npm run import:hymnal` -- expected: writes `data/hymns.json`, exit 0
- `node -e "..."` smoke (count hymns in DB / parse sample) -- expected: count ≥ 695; sample sermon + The Speaker resolve
- `npm run build` -- expected: Next.js compile success
- `gh pr create ...` -- expected: PR URL returned

## Auto Run Result

**Status:** done

**Summary:** Imported 695-hymn corpus into `data/hymns.json` + SQLite; hardened parser for addendum rundown; BIC Part A/B/C PPTX skeleton with fade; PR #7 to `main`. KJV held.

**Files changed:**
- `scripts/import-hymnal.mjs` — corpus import from `.work`
- `data/hymns.json` — normalized 695 hymns
- `src/lib/db/index.ts` — upsert corpus on init
- `src/lib/parser.ts` — sermon / Special Song / The Speaker / markers
- `src/lib/lyrics.ts` — Verse/Chorus/Reff slides
- `src/lib/pptx.ts` — Part A/B/C + fade
- `src/app/services/[id]/page.tsx` — highlights UI
- sprint/story tracking for 2.2 done

**Review:** 8 patches applied; 4 deferred (license, SSRF, section-aware hymn map, We Have This Hope lyrics); 4 rejected (role-on-slides by design, etc.). Follow-up review recommended: true.

**Verification:**
- `npm run import:hymnal` → 695 hymns (skipped 0)
- `npm run build` → success
- PR: https://github.com/kodesh87/bic-pptx-workflow/pull/7

**Residual risks:** positional hymn→part mapping; standing liturgy lyrics; hymnal copyright attribution.
