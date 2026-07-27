---
title: '6.3 Deck Blueprint Fidelity (FR-4/6/11)'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: '5fdb3f2'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/stories/6-3-deck-blueprint-fidelity.md'
warnings:
  - multiple-goals
---

<intent-contract>

## Intent

**Problem:** PPTX skeleton ignores theme/verse/family fields and standing liturgy lyrics; edit UI is raw-text only (FR-4/6/11 gaps).

**Approach:** Extend parser + `ParsedRundown` for theme verse, verse reading, family/youth; map them into Part A/B slides; resolve “We Have This Hope” from hymnal; add structured EditForm fields alongside raw payload. Keep section-aware hymn split for Story 6.4.

## Boundaries & Constraints

**Always:**
- Absent optional fields use standing defaults (or omit slide) per blueprint — never invent false sermon data.
- Special Song divider omitted when empty/`-`.
- Standing liturgy song lyrics come from hymnal DB when number known.
- Structured edit updates `parsed_data` and regenerates consistent `raw_payload` or stores fields without requiring full Telegram rewrite.
- No KJV/bible import.

**Block If:**
- None (defaults OK when blueprint ambiguous).

**Never:**
- Implement section-aware hymn mapping (Story 6.4).
- Full Part C bank/QR/midweek fidelity beyond existing announcements.
- OAuth / auth changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Theme present | Theme line in rundown | Theme verse slide uses it | — |
| Theme absent | No theme | Standing default theme verse | — |
| Verse reading | Present | Part A verse-reading slide | Omit if absent |
| Family/youth | Present | Slide with names | Omit if absent |
| We Have This Hope | Generation | Lyrics from hymnal | Title-only if missing |
| No special song | `-` or empty | No Special Song divider | — |
| Structured edit | Form fields saved | PPTX reflects fields | 400 on bad body |

</intent-contract>

## Code Map

- `src/lib/parser.ts` -- parse theme / verse reading / family youth
- `src/lib/pptx.ts` -- map fields + liturgy lyrics
- `src/lib/lyrics.ts` -- resolve hymn by number/title helper if needed
- `src/app/services/[id]/EditForm.tsx` -- structured fields + raw
- `src/app/api/services/[id]/route.ts` -- accept structured patch
- sprint + story 6.3 → done

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/parser.ts` -- extend ParsedRundown + parse new fields -- FR-4 payload
- [x] `src/lib/pptx.ts` -- slide mapping + We Have This Hope lyrics -- FR-4/6
- [x] `EditForm` + service PUT -- structured field edit -- FR-11
- [x] sprint + story status -- tracking
- [x] `npm run build` + smoke for new fields / special song omit / liturgy -- verify

**Acceptance Criteria:**
- Given theme/verse/sermon/family in payload, when PPTX generated, then each maps to its slide type (or standing default/omit when absent).
- Given We Have This Hope, when generated, then lyrics resolve from hymnal when known.
- Given no Special Song, when generated, then no Special Song divider.
- Given structured form edit, when saved, then fields update without requiring full raw Telegram rewrite.
- Given this change, no bible/kjv imports.

## Spec Change Log

## Review Triage Log

## Design Notes

Keep positional hymn slice until 6.4. Prefer additive parser labels matching Indonesian/English rundown conventions already used. Standing default theme may remain John 4:23 if payload omits theme.

## Verification

**Commands:**
- `npm run build` -- success
- `node scripts/smoke-deck-fidelity.mjs` -- field mapping / liturgy / special omit
