---
baseline_commit: 0cfb77f2e7e7c71c10d49a9c1459ca68f2fccccb
---

# Story 14.5: Sermon Section Split & KJV Resolve

Status: done

## Story

As an operator,
I want Sermon as its own form Card after Divine Worship (create and edit lockstep), and Resolve KJV to return scripture text when the corpus is imported,
so that section grouping matches the intended overlays and CAP-6 scripture lookup works during worship planning.

## Acceptance Criteria

1. **Given** create (`/services/new`) and edit (`/services/[id]`) forms, **When** compared side-by-side, **Then** overlay Cards appear in order: Bible Talk → Divine Worship (songs + Special Song only) → **Sermon** (own Card: speaker, closing prayer, sermon graphic) → Family of the Week → Youth of the Week → Announcement Flyers. Sermon is not nested inside Divine Worship.
2. **Given** a valid scripture reference (e.g. `Acts 18:9,10` or `John 3:16`) and an imported KJV corpus, **When** the operator clicks Resolve KJV, **Then** `GET /api/scripture?ref=` returns the passage and the Verse Reading Text field is filled.
3. **Given** an empty KJV corpus (`bible_verses` count 0), **When** Resolve KJV is called, **Then** the API returns an actionable error mentioning `npm run import:kjv` (HTTP 503), not a misleading generic “not found” alone.
4. **Given** refs with placeholder prefix `e.g.` or alias `Psalm` (for `Psalms`), **When** parsed/looked up against an imported corpus, **Then** resolution succeeds (parser strips `e.g.`; book alias maps Psalm→Psalms).
5. **Given** CAP-7 lockstep, **When** this story ships, **Then** create and edit remain in sync; no change to PUT/POST payload shapes, `buildSlidePlan`, or announcement/`clearMaster` semantics.

## Tasks / Subtasks

- [x] Update Spec companions: CAP-7 success + form-fields section order; CAP-6 empty-corpus note (memlog append)
- [x] Split Sermon into own Card after Divine Worship in `CreateForm.tsx` and `EditForm.tsx`
- [x] Harden `src/lib/scripture.ts` (e.g. strip, Psalm alias) + empty-corpus check; API 503 message
- [x] Import local KJV via `npm run import:kjv` for operator testing (ops; not committed)
- [x] Extend `tests/scripture.test.mjs`; run package test suite
- [x] Add epic + sprint entry `14-5-sermon-section-kjv-resolve`

## Dev Notes

- Spec: `_bmad-output/specs/spec-worship-web-input/` — CAP-6, CAP-7; `form-fields.md` grouping rule #4
- Root cause of Resolve failure in local testing: empty `bible_books`/`bible_verses` (corpus not imported). Parser already accepted `Acts 18:9,10`.
- LiveServer/production also needs `npm run import:kjv` once `.work/tp_bible_*.json` is available — do not bake corpus into Docker image build.
- Special Song stays in Divine Worship.

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Completion Notes List

- Spec updated (CAP-6/7 + form-fields); memlog decisions appended.
- CreateForm + EditForm: Sermon Card after Divine Worship; Special Song remains in Divine Worship.
- Scripture: strip `e.g.` prefix; Psalm→Psalms alias; `isKjvCorpusEmpty` → API 503 with import hint.
- Ran `npm run import:kjv` locally (66 books / 31102 verses) — data.db change is local ops, not source.
- Tests: scripture suite extended; full `npm test` green.

### File List

- `src/app/services/new/CreateForm.tsx`
- `src/app/services/[id]/EditForm.tsx`
- `src/lib/scripture.ts`
- `src/app/api/scripture/route.ts`
- `tests/scripture.test.mjs`
- `_bmad-output/specs/spec-worship-web-input/SPEC.md`
- `_bmad-output/specs/spec-worship-web-input/form-fields.md`
- `_bmad-output/specs/spec-worship-web-input/.memlog.md`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/stories/14-5-sermon-section-kjv-resolve.md`

### Change Log

- 2026-07-20: Story 14.5 implemented — Sermon section split + KJV resolve harden/import; status → review
