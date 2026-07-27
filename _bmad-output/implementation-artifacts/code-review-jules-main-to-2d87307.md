# Code Review: Jules branch `main...2d87307`

Date: 2026-07-18
Branch: `review/jules-epic5` (`origin/feature/story-1-2-basic-auth-6062146774480230932`)
Diff: `main...2d87307` (24 files, +1204/−69)
Layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor

## Verdict

Jules landed a working vertical slice (webhook → parse → SQLite → hub → PPTX → delete/edit). Tip commit message overclaims relative to tip diff alone; branch as a whole implements most story *tasks*, but several PRD FRs and ACs are unmet while sprint marks epic 1–5 `done`.

### Review Findings

### Party decisions (2026-07-18 — Code Review Crew)

- [x] [Review][Decision] D1 → `WEBHOOK_SECRET` required (fail-closed)
- [x] [Review][Decision] D2 → per-service `images_payload` MVP; full FR-3 list deferred
- [x] [Review][Decision] D3 → keep hymnal seed stubs; still patch FR-2 incomplete hymns
- [x] [Review][Decision] D4 → free-form roles (no allowlist)

### patch (applied 2026-07-18)

- [x] [Review][Patch] Missing `.env.example` / AUTH docs [`.env.example`]
- [x] [Review][Patch] Basic Auth password truncated on `:` [`src/middleware.ts`]
- [x] [Review][Patch] Reject non-`Basic` Authorization schemes [`src/middleware.ts`]
- [x] [Review][Patch] PUT returns 404 when `changes===0` [`src/app/api/services/[id]/route.ts`]
- [x] [Review][Patch] Unknown SDAH → incomplete hymn + `failedHymnNumbers` (FR-2) [`src/lib/parser.ts`]
- [x] [Review][Patch] Upsert Service by date on re-ingest (FR-1) [`src/app/api/webhook/route.ts`]
- [x] [Review][Patch] Only http(s) image URLs for `addImage` [`src/lib/images.ts`] [`src/lib/pptx.ts`]
- [x] [Review][Patch] try/catch per image in PPTX [`src/lib/pptx.ts`]
- [x] [Review][Patch] Timezone-safe local date [`src/lib/images.ts`] [`src/lib/parser.ts`]
- [x] [Review][Patch] Normalize bare `\r` [`src/lib/parser.ts`] [`src/lib/lyrics.ts`]
- [x] [Review][Patch] Skip empty lyric slides [`src/lib/lyrics.ts`]
- [x] [Review][Patch] Validate JSON bodies [`src/app/api/webhook/route.ts`] [`src/app/api/services/[id]/route.ts`]
- [x] [Review][Patch] Coerce images to safe URL strings [`src/lib/images.ts`]
- [x] [Review][Patch] Guard `JSON.parse(parsed_data)` + `items` [`src/app/services/[id]/page.tsx`]
- [x] [Review][Patch] Strict service id [`src/lib/service-id.ts`]
- [x] [Review][Patch] Shadcn Button/Card on hub + run-sheet [`src/app/page.tsx`] [`src/app/services/[id]/page.tsx`]
- [x] [Review][Patch] Dashboard `ORDER BY date DESC, created_at DESC` [`src/app/page.tsx`]
- [x] [Review][Patch] ALTER only swallows duplicate-column [`src/lib/db/index.ts`]
- [x] [Review][Patch] Story 5.4 in `epics.md`
- [x] [Review][Patch] Edit form can update/clear image URLs [`src/app/services/[id]/EditForm.tsx`]
- [x] [Review][Patch] `WEBHOOK_SECRET` on webhook route [`src/app/api/webhook/route.ts`]

### defer

- [x] [Review][Defer] `better-sqlite3` + cwd `data.db` + empty Next config not production/serverless-hardened [`src/lib/db/index.ts`] — deferred, architectural
- [x] [Review][Defer] Zero automated tests despite story testing notes — deferred, tech debt
- [x] [Review][Defer] FR-4 master template / BIC slide skeleton not implemented; Story 3.1 AC only covers basic pptxgenjs deck [`src/lib/pptx.ts`] — deferred, pre-existing vs full PRD
- [x] [Review][Defer] Concurrent first-boot hymn seed UNIQUE race [`src/lib/db/index.ts:35-38`] — deferred, rare

## Story satisfaction (auditor)

| Story | Marked | Reality |
|-------|--------|---------|
| 1.2 Auth | done | Mostly (AC1); `.env.example` missing |
| 2.1 Webhook | done | Satisfied |
| 2.2 Parser+hymnal | done | Partial — FR-2 incomplete hymn missing |
| 3.1 PPTX | done | Story AC ok; FR-4 template missing |
| 4.1 Hub | done | List/detail ok; Shadcn AC unmet |
| 5.1 Parser harden | done | Mostly |
| 5.2 Delete | done | Satisfied |
| 5.3 Edit/regen | done | Satisfied (raw text only) |
| 5.4 Images | done | Tasks mostly; FR-3 list not |
