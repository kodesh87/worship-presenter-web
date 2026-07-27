---
title: 'Epic 16 completion — Artifact hydration, unified rendering, semantic preview, canvas element authoring'
type: 'refactor'
created: '2026-07-26'
status: 'done'
baseline_revision: '338c1a23a0686f9e73d35191953f107a66cc1a6e'
final_revision: '8cfcffb9a5e0c95e25c8e017e29252ffd43e6e4c'
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-16-context.md'
  - '{project-root}/_bmad-output/specs/spec-slide-artifact-model/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-slide-artifact-model/registry-contract.md'
  - '{project-root}/_bmad-output/project-context.md'
warnings: ['multiple-goals', 'oversized']
---

<intent-contract>

## Intent

**Problem:** Story 16.1 shipped the Artifact Registry, its admin APIs and a canvas editor, but nothing consumes it: `buildSlidePlan` still hardcodes standing content, `pptx.ts` and `SlideView.tsx` still branch per `SlideKind`, preview badges still show raw kinds, and the editor can only move/resize seeded elements — an administrator cannot add a shape or text box, and a saved layout changes nothing in any output.

**Approach:** Close Epic 16 (stories 16.2, 16.3, 16.4) plus the operator-reported canvas authoring gap: introduce a versioned runtime Artifact contract, make `buildSlidePlan` hydrate every slide from the registry, make both renderers dumb consumers of positioned elements, project semantic labels and SongSet grouping into Live Preview, and allow adding/deleting non-seed elements in the editor with server-side validation still enforcing seed and required-element stability.

## Boundaries & Constraints

**Always:**
- `buildSlidePlan` stays the single slide-order authority. For identical inputs the emitted slide sequence, `id`s, `kind`s and visible text/image content must equal current behavior, and `tests/slide-plan.test.mjs` must pass **unchanged**.
- Every emitted slide carries exactly one hydrated `ArtifactInstance`; renderers and preview perform no registry lookup, placeholder resolution or content reshaping.
- Coordinates are percentages of a fixed 16:9 canvas whose reference pixel size is 960×540; renderers convert to native units **without clamping** (negative and >100 values are intentional clipping).
- Registry reads happen server-side only (better-sqlite3 is sync); hydrated instances must stay JSON-serializable because server pages pass them to client components.
- Standing content (offering, midweek, etiquette, contact, default theme verse) comes from registry templates. No second hardcoded copy may remain in `slide-plan.ts`.
- Hydration failures are visible and attributable (`ArtifactHydrationError` naming the instance, template and placeholder); never return a partially hydrated plan as success.
- Admin surfaces stay admin-only via `requireAdminSession`; image references keep passing `isRegistryImageRef`; saves keep `updatedAt` optimistic concurrency (409 on stale).
- Seeded element IDs, required elements, placeholder keys, layout keys and `baseType` remain immutable through the save API.
- New tests use `node:test` and are appended to the explicit `package.json` `test` file list.
- Read the relevant guide under `node_modules/next/dist/docs/` before changing any Next.js route/page API usage.

**Block If:**
- The seed registry cannot express a slide that `buildSlidePlan` currently emits (no template covers it) — do not invent a template shape; HALT.
- Making `tests/slide-plan.test.mjs` pass would require editing that test file.

**Never:**
- No parser, `ParsedRundown`, Part A/B/C structure, hymn-splitting or slide-order change.
- No per-service templates, autosave, drag-reorder of worship artifacts, video elements, rotation/stroke/shadow style vocabulary, or arbitrary-path design-tool features.
- No new element `type` beyond `text | image | image-placeholder | shape`.
- No ORM/migration framework; no Jest/Vitest; no new global state library.
- No deletion of seeded or required elements; no template create/delete.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hydrate general template | `welcome`, no values | Instance with 2 text elements carrying seed `content`, background image `/assets/welcome-bg.jpg` | No error expected |
| Hydrate placeholder | `sermon` with `{title, speaker}` | Placeholder elements carry resolved text; non-placeholder elements keep fixed content | No error expected |
| Missing required placeholder, no default | `sermon` without `title` | — | Throw `ArtifactHydrationError` naming instance + key |
| Missing optional placeholder | `special-song` without `performer` | Element omitted from `layout.elements`; slide still renders | No error expected |
| Required placeholder with default | `bible-verse-contemplation`, no weekly verse | Uses seed `defaultValue` for `reference` + `text` | No error expected |
| Array placeholder, single element | `announcement-flyer` with `imageUrl: [url]` | Element resolves to first entry | Empty array + required → throw |
| SongSet expansion | hymn with N lyric slides | One group node, ordered `title` child (unless skipped) + N `lyric` children, each a renderable instance | No error expected |
| Off-canvas geometry | element `x: -14.44` | PPTX inches and CSS percent stay negative | No error expected |
| Unknown template id | request for absent id | — | Throw `ArtifactHydrationError` (unknown template) |
| Unsupported element type reaches renderer | `type` outside the four primitives | — | Throw, do not silently skip |
| Save with a new element added | editable template + new element id | 200, persisted, `updatedAt` advanced | Unknown field / bad geometry → 400 |
| Save deleting a seeded element | payload omits a seed element id | — | 400, row unchanged |
| Save deleting a user-added element | payload omits a non-seed, non-required id | 200, persisted | — |
| Save adding element to read-only type | `song-set` / `announcement` / `fullscreen-image` | — | 400, row unchanged |
| Stale save | wrong `updatedAt` | — | 409, row unchanged |

</intent-contract>

## Code Map

- `src/lib/registry/types.ts` -- template/layout/element/placeholder types + base-type sets; source vocabulary the runtime contract narrows.
- `src/lib/registry/validate.ts` (537 L) -- strict allowlist validator + `enforceBaseTypeRules`; must gain add/delete-aware stability rules.
- `src/lib/registry/store.ts` (206 L) -- SQLite CRUD, optimistic lock, `assertStableAgainstSeed` (currently forbids add **and** remove).
- `src/lib/registry/seed.ts` -- `loadSeedTemplates`, `seedArtifactRegistry`, `getSeedTemplateById`.
- `src/lib/registry/asset-safety.ts` -- `isRegistryImageRef` (bundled `/assets/*`, local upload, SSRF-checked URL).
- `data/default-registry.json` -- 28 seed templates; IDs already map 1:1 onto every slide `buildSlidePlan` emits.
- `src/lib/db/index.ts:142,176` -- `artifact_templates` DDL + startup `seedArtifactRegistry(db)`.
- `src/lib/slide-plan.ts` (456 L) -- `SlideKind`, `SlidePlanItem`, `buildSlidePlan(serviceDate, parsed, images|media)`, `STANDING_*_LINES`, `DEFAULT_THEME_VERSE`, local `pushSong`.
- `src/lib/lyrics.ts` -- `splitLyricsLabeled`, `resolveWeHaveThisHope`, `resolveIntercessoryStandingHymns` (unchanged).
- `src/lib/pptx.ts` (464 L) -- `generatePptx`, `renderPlanSlide` kind-switch, `resolveImagePathForPptx`, `injectFadeTransitions` (JSZip).
- `src/components/SlideView.tsx` (167 L) -- client if-chain per kind; consumed by slideshow, presenter, projector.
- `src/app/api/services/preview/route.ts` -- builds the plan for Live Preview.
- `src/app/services/new/CreateForm.tsx` (~L1054-1090) / `src/app/services/[id]/EditForm.tsx` (~L1086-1115) -- duplicated badge-color if-chains, raw `slide.kind` as badge text.
- `src/app/services/[id]/{slideshow/page.tsx,present/page.tsx,present/projector/page.tsx}` -- server pages calling `buildSlidePlan` and passing items to client components.
- `src/components/admin/ArtifactEditor.tsx` (530 L) -- Fabric v6 wrapper, 960×540, move/resize/font-size/font-color/save/reset only.
- `src/app/api/admin/artifacts/**` -- list / read / PUT update / POST reset.
- `tests/slide-plan.test.mjs` -- sets a temp `DB_PATH` before import (registry is reachable from tests); asserts Part C ids, `Bank Mandiri` in `offering-tithe.lines`, theme default `John 4:23`.
- `tests/registry.test.mjs`, `tests/artifacts-api.test.mjs` -- existing registry coverage.

## Tasks & Acceptance

**Execution:**

- [x] `src/lib/artifacts/runtime-contract.ts` -- new: `ARTIFACT_RUNTIME_VERSION = 1`, `REFERENCE_CANVAS = { width: 960, height: 540 }`, `ResolvedStyle`, `ResolvedElement` (`id, type, x, y, w, h, zIndex, text?, imageUrl?, style`), `ResolvedLayout` (`aspectRatio, backgroundColor, backgroundImage?, elements` pre-sorted by `zIndex` then source order), `ArtifactInstance` (`runtimeVersion, instanceId, templateId, label, baseType, layoutKey, layout, group?`), `ArtifactGroupRef` (`id, label, role: 'title' | 'lyric'`), `ArtifactNode` (`kind: 'artifact' | 'group'`, group nodes hold ordered `children`), `flattenArtifactPlan`, `assertRuntimeVersion`, `ArtifactHydrationError` -- one renderer-neutral contract both renderers and preview consume.
- [x] `src/lib/artifacts/registry-snapshot.ts` -- new: `loadRegistrySnapshot(db?)` returning `Map<templateId, StoredArtifactTemplate>` read once per plan build, falling back to the validated seed template when a row is absent -- keeps hydration a single read and avoids per-slide DB hits.
- [x] `src/lib/artifacts/hydrate.ts` -- new: `hydrateArtifact(template, { instanceId, layoutKey, values })` resolving placeholder-bound elements (`text` → string, `text[]` → newline join, `image`/`image[]` → first URL), applying `defaultValue`, omitting optional-and-absent elements, throwing `ArtifactHydrationError` for required-and-absent, unknown layout key or unknown template -- the single placeholder resolution point.
- [x] `data/default-registry.json` -- set `bible-verse-contemplation` placeholder `defaultValue`s to the app's standing default (`John 4:23` + its verse text) -- registry becomes the SSOT for the default theme verse without changing the current output.
- [x] `src/lib/slide-plan.ts` -- refactor: emit an ordered internal artifact-request list, hydrate it against the snapshot, export `buildArtifactPlan(serviceDate, parsed, media): ArtifactNode[]`, and reimplement `buildSlidePlan` as `flattenArtifactPlan(buildArtifactPlan(...))` returning `SlidePlanItem[]` where each item keeps its current fields **and** gains a required `artifact: ArtifactInstance`; delete `STANDING_*_LINES` and `DEFAULT_THEME_VERSE`, deriving legacy `lines`/`body`/`subtitle` from the hydrated instance -- CAP-4, CAP-7, CAP-8 with legacy consumers untouched.
- [x] `src/lib/artifacts/render-model.ts` -- new: `toPptxGeometry(el)` (x/100×10in, y/100×5.625in, fontSize px×0.75 → pt), `toCssGeometry(el)` (percent box, `cqh` font sizing against the slide container), `resolveElementText/Image` -- one conversion table so PPTX and web cannot drift.
- [x] `src/lib/pptx.ts` -- replace `renderPlanSlide`'s kind-switch with `renderArtifactSlide(pres, instance)`: background color, optional background image, then elements in `zIndex` order (`text` → `addText`, `image`/`image-placeholder` → `addImage` with `contain`/`cover`, `shape` → `addShape` rect with `fillColor`/`opacity`); keep `resolveImagePathForPptx`, the unavailable-image fallback and `injectFadeTransitions` -- CAP-6 offline path.
- [x] `src/components/artifacts/ArtifactSlide.tsx` -- new client component rendering a `container-type: size` 16:9 stage with absolutely positioned elements from the same model -- CAP-6 browser path.
- [x] `src/components/SlideView.tsx` -- reduce to a thin wrapper delegating to `ArtifactSlide`, dropping the per-kind if-chain and hardcoded hex/magic-string styling.
- [x] `src/lib/artifacts/preview-model.ts` -- new: `buildPreviewEntries(plan)` returning `{ index, instanceId, id, label, baseType, groupId?, groupLabel?, role? }` with SongSet children nested under one parent and stable linear indexes -- CAP-5.
- [x] `src/app/api/services/preview/route.ts` -- include the preview entries (labels + grouping) alongside the existing `plan`, exposing no unresolved placeholders or raw registry rows.
- [x] `src/app/services/new/CreateForm.tsx` + `src/app/services/[id]/EditForm.tsx` -- replace both duplicated badge if-chains with the shared preview entries: semantic label text, base-type/role-derived badge color, SongSet children visually nested under their parent, presentation order preserved.
- [x] `src/lib/registry/store.ts` -- rewrite `assertStableAgainstSeed` to allow **added** elements (fresh unique ids) and **removed** non-seed, non-required elements while still rejecting removal/rename of any seeded or required element id, and still rejecting `baseType`, layout-key and placeholder-key changes; keep read-only base types unmodifiable except via reset.
- [x] `src/components/admin/ArtifactEditor.tsx` -- add "Add text", "Add rectangle" and "Delete selected" controls for editable templates (new ids generated client-side, unique within the layout), wire the existing text/font controls to newly added objects, disable delete for seeded/required elements, and keep the save/reset/409 flow intact.
- [x] `tests/artifact-hydration.test.mjs` -- new: cover the hydration rows of the I/O matrix (defaults, optional omission, required failure, array placeholders, off-canvas preservation, unknown template/layout) plus order/content parity between `buildArtifactPlan` and the legacy flat plan.
- [x] `tests/artifact-render-model.test.mjs` -- new: deterministic geometry/style assertions for both conversions, including negative and >100 coordinates and each element primitive.
- [x] `tests/artifact-preview.test.mjs` -- new: labels, SongSet grouping, linear indexes, omitted-content cases.
- [x] `tests/registry.test.mjs` -- extend for the new stability rules: add element OK, delete user-added OK, delete seeded rejected, delete required rejected, read-only add rejected, stale 409 unchanged.
- [x] `package.json` -- append the three new test files to the explicit `test` list.
- [x] `_bmad-output/planning-artifacts/epics.md` + `_bmad-output/implementation-artifacts/sprint-status.yaml` -- record 16.2/16.3/16.4 as delivered and add Story 16.5 (canvas element authoring) so artifacts match the shipped behavior.

- [x] `tests/ts-resolve-hook.mjs` -- test-infra: added the tsconfig `@/*` → `src/*` alias branch so `src/lib` modules importing via `@/...` resolve under `node --test` (no product behavior).
- [x] `scripts/smoke-deck-fidelity.mjs` -- replaced the grep for the deleted `STANDING_CONTACT` constant with an assertion on the four Part C standing slide ids in the built plan.
- [x] `src/lib/pptx.ts` -- added `deduplicateMedia(buffer)` to the existing JSZip post-processing: hash `ppt/media/*`, keep one canonical file per distinct hash, rewrite `.rels` targets, leave `[Content_Types].xml` intact, fall back to the original buffer on any error -- registry backgrounds made every slide embed its own copy (38.9 MB / 52 media files for the sample rundown); this restores NFR-1/NFR-2 headroom (10.1 MB / 13 media files, same 53 slides and 53 fades).
- [x] `src/components/SlidePreviewList.tsx` -- new shared preview list component so `CreateForm` and `EditForm` render one implementation instead of two copies that can drift.

**Acceptance Criteria:**
- Given identical service inputs, when `buildSlidePlan` runs before and after the refactor, then slide count, `id` order, `kind`, and visible text/image content are identical and `tests/slide-plan.test.mjs` passes without edits.
- Given an administrator saves a non-default layout for an editable template, when a service is regenerated, then the downloaded PPTX and the web slideshow/presenter both reflect that layout, and neither `pptx.ts` nor `SlideView.tsx` contains a per-`SlideKind` layout branch.
- Given a service with hymns, when Live Preview renders, then each entry shows an operator-recognizable Artifact label and SongSet title/lyric entries appear nested under a single parent group in presentation order.
- Given an administrator adds a rectangle and a text box to an editable template and saves, when the page reloads, then both persist; when reset is confirmed, then only that template returns to its shipped seed.
- Given a payload that removes a seeded or required element, when it is submitted, then the API responds 400 and the stored row is unchanged.
- Given `npm test`, `npm run build` and `npx tsc --noEmit`, when they run, then all pass and no new lint error is introduced inside this change's diff.

## Spec Change Log

## Review Triage Log

### 2026-07-26 — Review pass

- intent_gap: 0
- bad_spec: 0
- patch: 24: (high 7, medium 15, low 2)
- defer: 7: (high 0, medium 4, low 3)
- reject: 2: (high 0, medium 1, low 1)
- addressed_findings:
  - `[high]` `[patch]` `verse-reading` declared a required `reference` placeholder that no element bound, while element `e3` carried the fixed literal `1 Corinthians 1:10, ESV` — every service printed the wrong citation. Bound `e3` to `reference`.
  - `[high]` `[patch]` `special-song` declared a required `performer` placeholder with no bound element, so the performer name was silently dropped. Added a bound subtitle element.
  - `[high]` `[patch]` The service date disappeared from the Welcome slide. Added an optional `date` placeholder + element (moving `welcome` to `text-placeholder`) and passed `serviceDate` into the instance.
  - `[high]` `[patch]` `family-youth` bound `familyText`, `youthText` and `youthPhoto` to two elements each, printing both prayer texts twice and covering the family photo with the youth photo. Removed the duplicate elements `e2`, `e6`, `e12`.
  - `[high]` `[patch]` The canvas editor could not mount at all: an explicit `undefined` `fontStyle` reached Fabric v6's font cache and threw for every shipped text element.
  - `[high]` `[patch]` Saving an untouched template silently rewrote the geometry of every text element, because Fabric's `initDimensions()` discards the authored box. Saved sizes now derive from authored values × scale; all 28 templates round-trip byte-identically.
  - `[high]` `[patch]` A single unreadable or plain-`http` image could reject `pres.write()` and fail the whole deck. Images are embedded as bytes before drawing, with a guarded remote fetch and a per-image fallback.
  - `[medium]` `[patch]` A newly added text box's words could never be changed. Added a text-content control that round-trips through Save.
  - `[medium]` `[patch]` New elements persisted a different size than the insert announced (same Fabric remeasure root cause).
  - `[medium]` `[patch]` An empty font-size input wrote `fontSize: 0` and the server rejected the whole save with an opaque message. Clamped client-side.
  - `[medium]` `[patch]` Degenerate drag geometry serialized `w`/`h` of `0` and lost every unsaved edit to a 400. Added a positive floor.
  - `[medium]` `[patch]` The editor painted elements in array order while the renderers paint in `zIndex` order, so overlaps looked different from the real output.
  - `[medium]` `[patch]` A seeded element's `required` flag could be flipped to `true`, hard-failing hydration for that slide on every later build. Now rejected.
  - `[medium]` `[patch]` A corrupt or structurally invalid persisted row silently reverted to the seed (or crashed hydration with an unattributed `TypeError`). Rows are validated, with the id and reason logged.
  - `[medium]` `[patch]` A hydration failure crashed the slideshow, presenter and projector pages with a bare 500. All three now degrade to an intelligible operator message with server-side logging.
  - `[medium]` `[patch]` `/api/services/preview` built the whole plan twice and re-read plus re-validated the seed file on every keystroke. Now one build, with the validated seed memoized.
  - `[medium]` `[patch]` `derivedLines` read text elements in `zIndex` order rather than visual order and repeated the slide title in the body lines.
  - `[medium]` `[patch]` Dedup and fade injection each re-emitted the archive with STORE across two full zip round-trips. Merged into one pass emitting DEFLATE.
  - `[medium]` `[patch]` `ArtifactSlide` set `h-full w-full` alongside `aspect-ratio`, so the stage stretched to a 16:10 viewport while `cqh` font sizes kept scaling to height — browser and PPTX drifted apart. The stage is now letterboxed.
  - `[medium]` `[patch]` The `smoke-deck-fidelity` Part C guard had become a tautology grepping `slide-plan.ts` for slide ids; it now asserts the rendered registry copy in the generated deck.
  - `[medium]` `[patch]` The same script's "no Special Song divider" check failed because the Divine Service sequence template legitimately prints `Special Song` as a line of the printed order of service; narrowed to detect the standalone slide.
  - `[medium]` `[patch]` A doc comment mentioning `bible_verses` tripped the script's KJV-import guard. Reworded.
  - `[low]` `[patch]` `handleSave` discarded the active selection without resyncing state, leaving Delete enabled against a selection that no longer existed.
  - `[low]` `[patch]` A new registry test asserted state produced by its predecessor; it now seeds its own precondition.

## Design Notes

Unit conversion is the one place drift can hide, so it lives in `render-model.ts` alone:

```ts
// reference canvas 960x540 px; PPTX LAYOUT_16x9 is 10in x 5.625in (=405pt)
const PPTX_W_IN = 10, PPTX_H_IN = 5.625, PX_TO_PT = 405 / 540; // 0.75
toPptxGeometry(el) => ({ x: el.x/100*PPTX_W_IN, y: el.y/100*PPTX_H_IN,
                         w: el.w/100*PPTX_W_IN, h: el.h/100*PPTX_H_IN,
                         fontSize: (el.style.fontSize ?? 32) * PX_TO_PT });
toCssGeometry(el) => ({ left:`${el.x}%`, top:`${el.y}%`, width:`${el.w}%`, height:`${el.h}%`,
                        fontSize:`${(el.style.fontSize ?? 32) / 540 * 100}cqh` });
```

`SlidePlanItem` stays a superset rather than being replaced: the hierarchy lives in `buildArtifactPlan`'s `ArtifactNode[]`, and `flattenArtifactPlan` produces the flat renderable list that existing consumers and tests already expect. That satisfies "planner emits hydrated artifacts" without a breaking rewrite of six consumer files.

Legacy fields are derived from the hydrated instance, not kept in parallel: e.g. `offering-tithe.lines` becomes the template's text-element contents split on `\n` (which is why `Bank Mandiri` still appears), and `theme-verse.subtitle`/`body` come from the `bible-verse-contemplation` placeholder values.

Element-add stability rule: `seedIds ⊆ payloadIds` and every `required` element id survives; ids beyond the seed set are the administrator's own and may be added or deleted.

## Verification

**Commands:**
- `npm test` -- expected: all suites pass, including unchanged `tests/slide-plan.test.mjs` and the three new artifact suites
- `npx tsc --noEmit` -- expected: no type errors
- `npm run build` -- expected: succeeds
- `npm run lint` -- expected: no new error attributable to this diff (repo-wide pre-existing failures are known and out of scope)

**Manual checks (if no CLI):**
- `/admin/artifacts`: select an editable template, add a rectangle + text box, move/resize a seeded element, Save, reload — all changes persist; Reset restores the seed; read-only templates expose no add/delete controls.
- Generated PPTX for a representative service: Welcome, Song Lyric and Family & Youth slides show registry geometry (including intentional off-canvas clipping) and embedded backgrounds; fade transitions still present.

## Auto Run Result

Status: done
Blocking condition: none

### Summary

Closed Epic 16 (Stories 16.2, 16.3, 16.4) plus the operator-reported canvas authoring gap, now tracked as Story 16.5. `buildSlidePlan` hydrates every slide from the SQLite Artifact Registry and emits an ordered `ArtifactNode[]` hierarchy; the PPTX exporter and the web slide renderer draw the hydrated positioned elements instead of branching per `SlideKind`; Live Preview shows operator-facing Artifact labels with SongSet children nested under their parent; and an administrator can add and delete their own text boxes and shapes on an editable template while seeded and required elements stay immutable.

### Files changed

**New — runtime pipeline**
- `src/lib/artifacts/runtime-contract.ts` — versioned, renderer-neutral artifact contract + `ArtifactHydrationError`
- `src/lib/artifacts/registry-snapshot.ts` — one-shot validated registry read with seed fallback and logging
- `src/lib/artifacts/hydrate.ts` — the single placeholder-resolution point
- `src/lib/artifacts/render-model.ts` — the only unit-conversion table (percent → inches/points, percent → CSS/`cqh`)
- `src/lib/artifacts/preview-model.ts` — semantic labels, SongSet grouping, linear indexes
- `src/components/artifacts/ArtifactSlide.tsx` — letterboxed 16:9 browser stage
- `src/components/SlidePreviewList.tsx` — one preview list shared by both forms

**Changed**
- `src/lib/slide-plan.ts` — request plan → hydrate → `buildArtifactPlan` / `buildSlidePlan`; standing literals and the default theme verse removed in favour of registry content
- `src/lib/pptx.ts` — element-driven `renderArtifactSlide`, eager image embedding, single DEFLATE post-pass with media dedup
- `src/components/SlideView.tsx` — reduced to a thin wrapper over `ArtifactSlide`
- `src/app/api/services/preview/route.ts` — adds `previewEntries`, builds the plan once
- `src/app/services/new/CreateForm.tsx`, `src/app/services/[id]/EditForm.tsx` — shared semantic preview list
- `src/app/services/[id]/{slideshow,present,present/projector}/page.tsx` — hydration failures degrade instead of 500ing
- `src/lib/registry/store.ts` — element authoring allowed; seeded ids, seeded `required` flags and required elements frozen
- `src/lib/registry/seed.ts` — validated seed memoized at module scope
- `src/components/admin/ArtifactEditor.tsx` — Add text / Add rectangle / Delete selected, text-content editing, geometry round-trip fix, font-size clamping, zIndex paint order
- `data/default-registry.json` — placeholder binding fixes (`verse-reading`, `special-song`, `welcome`, `family-youth`) and the standing theme-verse default
- `scripts/smoke-deck-fidelity.mjs` — Part C guard now asserts rendered registry copy
- `tests/ts-resolve-hook.mjs`, `package.json` — `@/*` resolution for the node runner; five new suites registered

**New tests** — `artifact-hydration`, `artifact-render-model`, `artifact-preview`, `pptx-media-dedup`, `pptx-content`

### Review findings

24 patches applied (7 high, 15 medium, 2 low), 7 items deferred, 2 rejected. Full breakdown in the Review Triage Log; deferred items are recorded in [deferred-work.md](./deferred-work.md).

### Verification

- `npm test` — 139 pass, 0 fail; `tests/slide-plan.test.mjs` unedited and green
- `npx tsc --noEmit` — clean
- `npm run build` — succeeds
- `npx eslint` over every new and refactored module — exit 0 (the repo's pre-existing `react-hooks/set-state-in-effect` errors in the forms and admin editor are untouched and outside this diff)
- `scripts/smoke-deck-fidelity.mjs` — all deck-content checks pass, including the four new Part C registry-copy assertions; two pre-existing stale checks predating this change are left failing and deferred rather than masked
- Generated deck from the sample rundown: 53 slides, 53 fades, 13 unique media entries, 10.1 MB (down from 38.9 MB before dedup + DEFLATE), every `.rels` media target resolving
- Editor round-trip proven against real Fabric 6.6.1: all 28 templates / 29 layouts / 63 elements load → save byte-identically

### Residual risks

- **Existing databases keep the old rows.** Seeding is missing-only, so the four content fixes and the standing theme verse reach an existing deployment only via a fresh database or an admin reset of `welcome`, `verse-reading`, `special-song`, `family-youth` and `bible-verse-contemplation`. `welcome` also changed base type, so it needs a reset rather than a merge.
- **Visual fidelity is now the registry's.** Slide order, ids and content are verified equal to the previous behaviour, but placement, fonts and colours now come from the source-deck extraction rather than the old hardcoded layout. A human should look at a generated deck and the projector before the next service.
- Preview still renders legacy `title`/`subtitle` strings, so a canvas text edit is not reflected there (deferred).
- No automated ceiling guards deck size, generation time or peak memory (deferred).
