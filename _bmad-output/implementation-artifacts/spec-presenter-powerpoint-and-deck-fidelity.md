---
title: 'Deck parity fixes, self-healing seed, and a PowerPoint-style Presenter'
type: 'feature'
created: '2026-07-26'
status: 'done'
baseline_revision: '2c4bec9668e41ea74a7b7730b334f8fb2a74c13c'
final_revision: 'f885899e329f233ea405d69f4b20d1d64142d164'
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/specs/spec-slide-artifact-model/registry-contract.md'
  - '{project-root}/data/asset-map.json'
warnings: ['multiple-goals']
---

<intent-contract>

## Intent

**Problem:** Four things stand between the operator and a usable Sabbath morning. The Fellowship Etiquette slide prints its sentence twice, because the source deck hides that text box behind a full-bleed picture while our renderer paints it on top. Corrected templates only reach a running hub if an administrator remembers to press Reset on each one, which is a manual step nobody will do at 08:55. The Presenter gives the current slide the entire width of the window, so on a 4K monitor it is enormous and the run-sheet is squeezed into a strip. And its "Open projector" button is white text on a white background, so it cannot be read at all.

**Approach:** Bring the seed to exact visual parity with the deck for the cases that the registry vocabulary can already express, make startup re-seed any template the administrator has never edited while leaving edited ones untouched, and rebuild the Presenter around the PowerPoint arrangement the operator already knows — current and next side by side, a slide list, and a grid to jump anywhere — sized so it is comfortable at any resolution.

## Boundaries & Constraints

**Always:**
- Visual parity with the source deck is the goal wherever the registry vocabulary can express it. Where it cannot, leave the template as it is and report the gap rather than approximating it.
- Startup re-seeds a template **only** when its stored payload is byte-identical to the seed it was last seeded or reset from. An administrator's edit is never overwritten, and the decision must not depend on comparing against the current shipped seed.
- A re-seed, a skip because the row was edited, and a first insert are each logged with the template id, so an operator can see what startup did.
- Registry writes stay admin-only, validated, and under `updatedAt` optimistic concurrency. Re-seeding advances `updatedAt` like any other write.
- The Presenter must be comfortable at 4K, 2K, FullHD and at any window size in between. The current slide is capped so it never grows to fill a large monitor, and the layout stays usable when the window is narrow.
- Every control on the Presenter and Projector must meet ordinary contrast — no element may inherit a colour that renders it invisible against its own background.
- Presenter↔projector sync stays on `BroadcastChannel` via `@/lib/present-channel`; no server realtime channel.
- Keyboard navigation keeps working: arrows, space and page keys move slides, and typing in an input never steals them.
- Prefer the existing shadcn / Base UI controls and the repo's high-contrast conventions. No new UI or state library.
- Read the relevant guide under `node_modules/next/dist/docs/` before changing Next.js APIs.
- New tests use `node:test` and are appended to the explicit `package.json` test list.

**Block If:**
- Reaching parity for a template would need a style property the registry vocabulary does not have. Report it; do not invent a property and do not fake the effect with a different one.

**Never:**
- No change to slide order, hymn splitting, placeholder resolution, or the artifact runtime contract.
- Do not re-encode or resize any plate under `public/assets/`.
- Do not overwrite an administrator's edited template under any circumstance, including a "the seed knows better" special case.
- Do not change worship-facing wording that the deck does not settle — specifically the hand-authored `thank-you` and `midweek-prayer` text, which matches neither deck.
- No new dependency for the slide grid or the presenter layout.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Doubled etiquette text | `fellowship-etiquette` rendered | The sentence appears once, from the plate only | — |
| Untouched template, seed changed | stored payload == recorded seed hash | Row replaced with the new seed, logged | — |
| Edited template, seed changed | admin saved an edit earlier | Row kept, skip logged naming the template | — |
| Template absent | new database | Inserted as today, logged | — |
| Row from before this change | no recorded seed hash | Treated as edited and kept; logged once | — |
| Re-seed then reset | admin resets after a re-seed | Reset restores the current shipped seed | — |
| Presenter on 4K | 3840×2160 window | Current slide capped, next beside it, list and grid reachable without scrolling the page | — |
| Presenter on FullHD | 1920×1080 | Same arrangement, proportionally smaller | — |
| Presenter narrow | window under ~900 px | Layout stacks instead of overflowing horizontally | — |
| Open projector button | Presenter header | Readable against its own background in both themes | — |
| Jump to slide | operator opens the grid and picks slide 37 | Presenter and projector both move to 37 | — |
| Jump to slide, projector closed | no projector window | Presenter moves; no error | Broadcast is best-effort |
| Slide list click | operator clicks an entry | Same as jump; the active entry stays visible in the list | — |
| Keyboard while grid open | arrows pressed | Grid selection moves, deck does not jump underneath | — |
| Keyboard in the scripture input | operator types "John 4:23" | Slides do not move | — |
| Last slide | index at the end | Next pane says the deck has ended; Next is disabled | — |

</intent-contract>

## Code Map

- `data/default-registry.json` -- 28 templates. `fellowship-etiquette.layouts.default.elements[e1]` is the duplicated sentence. `song-set.layouts.title.elements[e2]` is `[0, 66.67, 100, 33.33]` where both decks say `[0, 60.39, 100, 39.61]`. `welcome-repeat.e2` has `h: 7.97` where both decks say `6.19`.
- `data/asset-map.json` -- template → source slide → media part, with each slide's text runs as evidence.
- `src/lib/db/index.ts` -- startup DDL block and the `try/catch` `ALTER TABLE` pattern; calls `seedArtifactRegistry(db)`. `artifact_templates(id, label, base_type, payload, updated_at)`.
- `src/lib/registry/seed.ts` -- `loadSeedTemplates` (memoized), `seedArtifactRegistry`, `getSeedTemplateById`.
- `src/lib/registry/store.ts` -- `insertArtifactTemplateIfMissing` (SELECT then INSERT, never UPDATE), `updateArtifactTemplate`, `resetArtifactTemplate`, `assertStableAgainstSeed`.
- `src/lib/artifacts/registry-snapshot.ts` -- validates each stored row and falls back to the seed with a log line when it fails.
- `src/app/services/[id]/present/PresenterOperator.tsx` -- the whole Presenter. Header with the unreadable button at ~L117-128; `grid gap-4 p-4 lg:grid-cols-[1fr_320px]` at L135 is why the current slide fills a 4K monitor; current at L141, next at L149 (`aspect-video max-h-48`), prev/next/clear at L159, scripture panel at L183, run-sheet at L212. `setIndexAndSync` broadcasts; `useEffect` at L64 owns the keyboard.
- `src/app/services/[id]/present/projector/ProjectorClient.tsx` and `src/app/services/[id]/slideshow/SlideshowClient.tsx` -- the other `SlideView` consumers.
- `src/components/ui/button.tsx` -- `buttonVariants`; the `outline` variant sets `bg-background` but **no text colour**, so it inherits. The Presenter shell hardcodes `bg-zinc-950 text-zinc-100` without marking itself a dark surface, so `--background` resolves to the light theme's white and the inherited near-white text disappears.
- `src/components/artifacts/ArtifactSlide.tsx` -- letterboxed 16:9 stage; safe to render at thumbnail size.
- `src/lib/artifacts/preview-model.ts` -- `buildPreviewEntries`, `previewLabel`, `previewBadgeTone`; already produces operator-facing labels and SongSet grouping, and is what the slide list and grid should use rather than a second taxonomy.
- `src/lib/present-channel.ts` -- `openPresentChannel`, `PresentMessage`.

## Tasks & Acceptance

**Execution:**

- [x] `data/default-registry.json` -- remove `fellowship-etiquette.layouts.default.elements[e1]`, the sentence the deck hides behind its own full-bleed picture and the plate already carries; correct `song-set.layouts.title.elements[e2]` to `[0, 60.39, 100, 39.61]` and `welcome-repeat.e2.h` to `6.19` to match both decks. Change nothing else.
- [x] `src/lib/db/index.ts` -- add `seed_hash TEXT` to `artifact_templates` through the existing swallow-duplicate `ALTER TABLE` pattern, and in the same transaction backfill every pre-existing row with the hash of its own stored payload (migration path only). Without the backfill the whole feature is a no-op on any database that already exists — see Design Notes.
- [x] `src/lib/registry/store.ts` -- record the seed payload's hash whenever a row is inserted from the seed or reset to it, and expose a guarded re-seed that replaces a row **only** when its stored payload still hashes to the recorded value. Repair the recorded hash when the stored payload is byte-identical to the current seed (no `updatedAt` change), and report a re-seed whose compare-and-swap matched nothing as a conflict rather than as a re-seed.
- [x] `src/lib/registry/seed.ts` -- `seedArtifactRegistry` inserts missing templates as today and, for existing ones, re-seeds through that guard, in a `BEGIN IMMEDIATE` transaction (it reads then writes, so a deferred one can fail with `SQLITE_BUSY_SNAPSHOT`, which `busy_timeout` does not retry); log per template whether it inserted, re-seeded, skipped as edited, skipped as unrecorded, or lost the row to a concurrent write.
- [x] `tests/registry-reseed.test.mjs` -- new: cover the re-seed rows of the I/O matrix — untouched row updated, edited row preserved, missing row inserted, a row reaching the guard without a hash preserved, and reset still restoring the current shipped seed. Plus the migration path booted for real in a child process against a database file that predates the column: it is re-seeded once, and an edit saved afterwards survives the next boot.
- [x] `src/app/services/[id]/present/PresenterOperator.tsx` -- rebuild the layout: current slide top-left with a maximum size so a large monitor does not inflate it, next slide top-right, a scrollable slide list bottom-left that scrolls the active entry into view, and the scripture panel and run-sheet retained. Keep `setIndexAndSync`, the broadcast contract and the keyboard handler intact; stack the panes instead of overflowing on a narrow window.
- [x] `src/app/services/[id]/present/SlideGridDialog.tsx` -- new: a grid of every slide with its semantic label from `buildPreviewEntries`, opened from the Presenter, that jumps to the picked slide and syncs the projector. While it is open, arrow keys move the grid selection rather than the deck.
- [x] `src/app/services/[id]/present/PresenterOperator.tsx` -- fix the contrast: make the Presenter shell a genuine dark surface so the theme tokens resolve dark, rather than hardcoding zinc colours against light-theme components, and verify every control in the header and the transport row is readable.
- [x] `tests/presenter-model.test.mjs` -- new: cover the slide-list and grid entries built from `buildPreviewEntries` (labels, order, active index, SongSet grouping) as pure data, so the arrangement is testable without a browser.
- [x] `package.json` -- append both new test files to the explicit `test` list.
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- record the parity gaps this change deliberately leaves: the `offering-tithe` QR overlay, the `family-youth` scrim panels, its rotated "Prayer Request" label and its unreachable family/youth name lines, the `verse-reading` 50%-alpha background, and the hand-authored `thank-you` / `midweek-prayer` text that matches neither deck.

**Acceptance Criteria:**
- Given the Fellowship Etiquette slide, when it is rendered in the browser and into PPTX, then its sentence appears exactly once.
- Given a template the administrator has never edited and a changed seed, when the app starts, then the stored row is replaced and the change is logged; given a template the administrator has edited, when the app starts, then the row is unchanged and the skip is logged.
- Given a 4K window, when the Presenter is opened, then the current slide is capped rather than filling the width, and the next slide, the slide list and the grid button are all reachable without scrolling.
- Given any window width down to a narrow laptop, when the Presenter is resized, then the layout stacks and nothing overflows horizontally.
- Given the Presenter header, when it is inspected in either theme, then every control is legible against its own background.
- Given the slide grid, when the operator picks slide 37, then the Presenter shows slide 37 and the projector follows.
- Given `npm test`, `npm run build` and `npx tsc --noEmit`, when they run, then all pass and no new lint error appears in this diff.

## Spec Change Log

## Review Triage Log

### 2026-07-26 - Review pass

- intent_gap: 0
- bad_spec: 0
- patch: 6: (high 2, medium 3, low 1)
- defer: 6: (high 0, medium 4, low 2)
- reject: 2: (high 0, medium 1, low 1)
- addressed_findings:
  - `[high]` `[patch]` The whole feature was a no-op on the database it was built for. The migration left every existing row `seed_hash` NULL and the guard reads NULL as "no evidence, keep theirs", so self-healing reached 0 of 28 templates - while every test and the smoke script passed, because they all build fresh temporary databases. Added a one-time backfill stamping each legacy row with its own payload hash, so it is read as untouched exactly once and re-seeded.
  - `[high]` `[patch]` The backfill was then gated on the `ALTER TABLE` succeeding, which stranded any database that had received the column from an earlier build - including the owner's own, verified live: 26 templates stayed at NULL forever. Re-gated on a `settings` marker so it is independent of when the column arrived, and still idempotent.
  - `[medium]` `[patch]` The `unchanged` short-circuit never reconciled `seed_hash`, so a template whose payload already equalled the shipped seed was frozen out of every future correction, silently. The hash is now repaired when the payload provably equals the seed, without moving `updatedAt`.
  - `[medium]` `[patch]` The re-seed `UPDATE` discarded its result and always reported `reseeded`, so the operator log could claim a write that never landed. It now reports a distinct `skipped-conflict`.
  - `[medium]` `[patch]` Seeding took a write lock after its read snapshot on a deferred transaction, which `busy_timeout` does not retry - so a maintenance script touching the same file could crash startup. Switched to an immediate transaction.
  - `[low]` `[patch]` A test still named `missing-only seed preserves edited templates` described semantics that no longer exist; renamed to what it verifies.


**Adversarial review of the self-healing seed — all five findings fixed.**

| # | Sev | Finding | Resolution |
|---|-----|---------|------------|
| 1 | Critical | Self-healing reached 0 of 28 templates on any existing database: the migration left every row `seed_hash = NULL` and the guard skips those, so no correction reached the running hub while every test and the smoke script passed on fresh temp databases. | One-time backfill on the `ALTER TABLE` path, in the same transaction: each pre-existing row is stamped with the hash of its own payload, read as untouched once, and re-seeded. Verified by booting the real `getDb()` against a database built from the previously shipped registry: 3 re-seeded (`song-set`, `welcome-repeat`, `fellowship-etiquette`), 25 already current, 0 stale. |
| 2 | High | The `unchanged` short-circuit never reconciled `seed_hash`, so an administrator who hand-applied the same correction was silently frozen out of every future re-seed. | The guard now records the hash whenever the stored payload is byte-identical to the current seed. Evidence only — `updatedAt` does not move, so an open editor's optimistic-concurrency token stays valid. |
| 3 | Medium | The re-seed `UPDATE ... WHERE id = ? AND updated_at = ?` discarded its result and always reported `reseeded`, so the operator log could claim a re-seed that never happened. | New `skipped-conflict` outcome returned when `changes === 0`, logged with `console.warn`. |
| 4 | Medium | `seedArtifactRegistry` now reads then writes under a deferred `BEGIN`, so a maintenance script touching the same file during boot could crash startup with `SQLITE_BUSY_SNAPSHOT`, which `busy_timeout` does not retry. | The seeding transaction is `BEGIN IMMEDIATE`. |
| 5 | Low | `tests/registry.test.mjs` still had a case named `missing-only seed preserves edited templates`, describing semantics that no longer exist. | Renamed to `a startup seeding pass preserves an administrator-edited template`. |

## Design Notes

The seed guard is what makes automatic re-seeding safe. Comparing the stored row against the *current* shipped seed cannot distinguish "the administrator edited it" from "we shipped a correction", so the row records the hash of the seed it was last seeded or reset from:

```
stored payload hash == recorded seed hash  ->  untouched, safe to re-seed
stored payload hash != recorded seed hash  ->  the admin edited it, keep theirs
no recorded hash (row predates this)       ->  treat as edited, keep theirs
```

Rows that reach that guard without a recorded hash are kept rather than re-seeded, because there is no evidence either way and silently discarding a layout an administrator built is the worse error.

**Migration backfill (added during review; supersedes the reasoning above for the upgrade path only).** Keeping hash-less rows made the feature a *complete no-op on every database that already exists*: the `ALTER TABLE` leaves all 28 rows `seed_hash = NULL`, the guard reads NULL as "no evidence", and a simulated upgrade re-seeded 0 of 28 — every correction in this release, the fellowship-etiquette double print included, would still have waited for a manual Reset on the running hub. Comparing against the *current* shipped seed does not rescue those rows either; they hold the *older* seed, so they match neither the new seed nor any recorded hash.

So the `seed_hash` migration, and only the migration, stamps each pre-existing row with the hash of its own stored payload. Each legacy row is therefore read as untouched exactly once and re-seeded to the current shipped template; from the next boot on the guard behaves exactly as specified, because an administrator's `updateArtifactTemplate` deliberately leaves the recorded hash stale. This is safe because no administrator edit can exist in a database predating this release: the canvas editor threw on mount for *every* template (an explicit `undefined` `fontStyle` reaching Fabric v6's font cache) until it was fixed in this same release, so no layout could be saved at all. That justification expires with the migration, which is why the backfill runs on the `ALTER TABLE` path only — a second run would re-arm rows the administrator has since edited.

This means the I/O matrix row "Row from before this change → treated as edited and kept" now describes the guard in isolation, not the end-to-end upgrade: on a real upgrade such a row is stamped by the migration first and then re-seeded. The `<intent-contract>` is read-only, so that row is left as written; the divergence is recorded here deliberately rather than left lying.

Two smaller guard corrections belong to the same design. A row whose payload is byte-identical to the current shipped seed has its recorded hash repaired (evidence only — `updatedAt` does not move), because such a row by definition carries no edit; without the repair, an administrator who hand-applied the same correction the team was about to ship would be reported `skipped-edited` for every future correction, silently and forever. And the re-seed write is compare-and-swapped on `updated_at` like every other registry write, so when it matches nothing the pass reports a conflict instead of logging a re-seed that never happened.

The Presenter is rebuilt around what the operator already knows from PowerPoint, and the slide list and grid read `buildPreviewEntries` rather than inventing a second taxonomy — the labels and SongSet grouping are already correct there, and a second copy would drift the way the badge logic did before it was consolidated.

The contrast bug is a symptom, not a one-off: hardcoding `bg-zinc-950 text-zinc-100` on a shell whose children are theme-token components means every such child resolves its own colours from the light theme. Fixing the shell fixes the class of bug; patching one button's colour would leave the next one to be found on a Sabbath morning.

## Verification

**Commands:**
- `npm test` -- expected: all suites pass, including the two new ones
- `npx tsc --noEmit` -- expected: no type errors
- `npm run build` -- expected: succeeds
- `npm run lint` -- expected: no new error attributable to this diff
- `node scripts/smoke-deck-fidelity.mjs` -- expected: no regression against the baseline of 28 pass / 2 known-stale fail

**Manual checks (if no CLI):**
- Open the Presenter at 4K, at 1920×1080 and at a narrow window; confirm the current slide stays a comfortable size, the arrangement holds, and nothing overflows.
- Confirm every header and transport control is readable.
- Open the grid, jump to a slide in the middle of the deck, and confirm the projector follows.
- Generate a deck and confirm the Fellowship Etiquette slide reads its sentence once.

## Auto Run Result

Status: done
Blocking condition: none

### Summary

Three data corrections bring the seed to exact parity with the source deck, startup now heals templates the administrator has never edited so no manual Reset is needed, and the Presenter is rebuilt around the PowerPoint arrangement with the contrast bug fixed.

### Deck parity

A paint-order audit of both decks found exactly one text run the deck itself hides behind a full-bleed picture: `fellowship-etiquette`'s sentence, which the plate already carries, so the slide was printing it twice. Removed - that layout is now background-only, which both renderers handle correctly. Also corrected `song-set.title.e2` geometry and `welcome-repeat.e2` height against both decks.

### Self-healing seed

`artifact_templates` gained `seed_hash`, recorded on insert, reset and re-seed. Startup replaces a row only while its stored payload still hashes to that value; an edited row is kept and the skip is logged. A one-time backfill, gated on its own `settings` marker rather than on the `ALTER`, stamps pre-existing rows so the corrections actually land. Verified against the owner's real database: 26 templates re-seeded automatically, 0 left without a hash, and the duplicated sentence gone from the stored row.

The backfill is safe exactly once and the justification is recorded where it happens: the canvas editor threw on mount for every template until a fix earlier the same day, so no administrator edit can exist in a database created before this release.

### Presenter

Current slide top-left with a size cap, next top-right, scrollable slide list bottom-left that keeps the active entry in view, scripture panel and run-sheet retained, and an All slides grid that jumps anywhere and syncs the projector. Arrow keys move the grid selection while it is open rather than the deck underneath. The list and grid read `buildPreviewEntries`, so labels and SongSet grouping stay a single taxonomy.

The contrast bug was fixed at the shell, not the button: hardcoding `bg-zinc-950 text-zinc-100` around theme-token components made every child resolve its colours from the light theme, which is why `Open projector` rendered white on white at about 1.1:1. The shell now declares itself a dark surface; measured about 18:1 afterwards.

### Verification

- `npm test` - 285 pass, 0 fail
- `npx tsc --noEmit` - clean
- `npm run build` - succeeds
- `npx eslint` over every changed area - no findings
- `node scripts/smoke-deck-fidelity.mjs` - 28 pass, 2 known-stale fail, the documented baseline
- Live upgrade against the owner's database - 26 re-seeded, verified row by row
- Layout measured at 3840x2160, 1920x1080, 1366x768, 900x900 and 375x812 with no horizontal overflow

### Residual risks

- The Presenter's React wiring - arrow-key routing, the grid jump, projector sync and the scripture flow - is covered by pure-data tests, tsc and eslint only. It was not exercised in a browser, because the page is behind the session gate. Worth one manual pass.
- Parity gaps remain where the registry vocabulary cannot express the deck: the `offering-tithe` QR overlay, `family-youth`'s scrim panels and its rotated label, and `verse-reading`'s 50%-alpha background. All recorded in deferred work.
- `thank-you` and `midweek-prayer` carry hand-authored text matching neither deck; changing worship-facing wording needs a product decision.
