# Artifact Registry Contract

This companion defines the normative data, persistence, API, validation, and Story 16.1 editor boundaries for `SPEC-slide-artifact-model`. The Artifact inventory remains in `artifact-catalog.md`.

> **Superseded in part by `../spec-artifact-registry-authoring/SPEC.md` (Epic 20),** which adopts this file as a companion and wins on conflict. The **seven base types** below collapse to three kinds (General, SongSet, Announcement) under Story `20-2`, and the create/delete/reorder prohibitions become capabilities under Story `20-3`. The rules here are Epic 16's delivered contract and remain the description of what currently ships.

## Story Boundaries

| Story | Included outcome |
| --- | --- |
| 16.1 | SQLite registry, missing-only JSON seed, strict schema and image validation, admin management APIs, minimal Fabric.js editor, save/reload/reset |
| 16.2 | `buildSlidePlan` hydration into `ArtifactInstance[]`, placeholder resolution, standing-content migration |
| 16.3 | PPTX and web renderers consume hydrated positioned elements |
| 16.4 | Preview semantic labels and parent/child grouping |

Story 16.1 must leave all existing slide-planning and rendering behavior unchanged.

## Registry Ownership and Seed

- SQLite is the live source of truth.
- `data/default-registry.json` contains every shipped template and passes the same validator used by the save API.
- Startup inserts a seed template only when its ID is absent. Startup never updates or deletes an existing registry row.
- Reset replaces one selected template with its current shipped seed. It does not reset any other template.
- A missing or invalid seed is a startup/configuration failure with a server-side diagnostic; it must not silently create a partial registry.
- Templates are global, not scoped to a service or account.

## Normative Template Shape

The exact TypeScript decomposition may follow repository conventions, but persisted JSON must preserve these fields and semantics:

```text
ArtifactTemplate
  schemaVersion: 1
  id: stable kebab-case identifier
  label: operator-facing label
  baseType: one of the seven base types
  placeholders: PlaceholderDefinition[]
  layouts:
    default?: ArtifactLayout
    title?: ArtifactLayout
    lyric?: ArtifactLayout

PlaceholderDefinition
  key: stable identifier unique within the template
  type: text | text[] | image | image[]
  required: boolean
  defaultValue?: value matching type

ArtifactLayout
  aspectRatio: "16:9"
  backgroundColor: six-digit hex color
  backgroundImage?: safe image reference
  elements: CanvasElement[]

CanvasElement
  id: stable identifier unique within the layout
  type: text | image | image-placeholder | shape
  required: boolean
  x, y: finite normalized percentage positions
  w, h: finite positive normalized percentage sizes
  zIndex: non-negative integer
  content?: fixed text
  placeholderKey?: key declared by placeholders
  imageRef?: safe image reference
  style?: supported style fields for the element type
```

Supported text style fields in Story 16.1 are `fontFamily`, `fontSize`, `fontColor`, `fontWeight`, `fontStyle`, `textAlign`, and `verticalAlign`. Supported image behavior is `contain` or `cover`. Supported shape fields are fill color and opacity.

Unknown fields are rejected at the management boundary. IDs, placeholder keys, layout keys, and element references must be internally consistent.

Positions are not clamped to `0..100`: the extracted source deck intentionally places some elements partly outside the slide and relies on clipping. The editor and future renderers must preserve those values while keeping the 16:9 viewport fixed.

## Seed Baseline

The v0-to-v1 seed transformation is **complete**. `data/default-registry.json` holds 28 templates at `schemaVersion: 1` carrying the six live base types, and passes the same validator used by the save API.

The extraction inputs that governed that transformation — `data/raw-slides.json`, `slides-new/*.jpg`, `scripts/build-registry.mjs`, and the local source deck — **do not exist in this repository**. They belong to the frozen `bic-pptx-workflow` working tree, and `slides-new/` is on the never-commit list in `AGENTS.md`. Nothing in this contract may send an implementer to them.

One clause of that transformation still binds, because a future seed edit can break it:

**Every bundled path in the seed must resolve to a committed runtime asset.** A synthetic path such as `/assets/welcome-bg.jpg` is invalid when the corresponding file is absent. Verified 2026-07-30: 22 of 22 distinct references resolve under `public/`.

## Base-Type Rules

| Base type | Required layouts | Placeholder rule | Canvas behavior in 16.1 |
| --- | --- | --- | --- |
| General | `default` | No weekly placeholders | Editable |
| TextPlaceholder | `default` | One or more text/text[] placeholders; defaults allowed | Editable |
| FullScreenImage | `default` | One required image placeholder | Read-only |
| ImagePlaceholder | `default` | One or more image placeholders | Editable |
| MixPlaceholder | `default` | At least one text and one image placeholder | Editable |
| SongSet | `title`, `lyric` | Hymn selection plus resolved title/lyrics | Read-only |
| Announcement | `default` | One image[] placeholder | Read-only |

`BibleVerseContemplation` is always TextPlaceholder and declares default reference and text values. Using those defaults does not change its base type.

Required layouts, placeholders, and elements cannot be removed or have their stable IDs changed through Story 16.1.

## Image Safety

Every `backgroundImage` and `imageRef` is validated server-side:

- allow bundled public asset paths constrained to the project’s public asset namespace;
- allow well-formed local upload references already accepted by `isLocalUploadRef`;
- allow HTTP(S) references only when accepted by `isSafeImageUrl`;
- reject private, local, metadata, disallowed-host, non-image, traversal, and unsupported-scheme references.

Canvas serialization is untrusted input. Client-side checks do not replace server validation.

## Admin Routes and Responses

| Route | Method | Outcome |
| --- | --- | --- |
| `/admin/artifacts` | page | Admin-only template list and editor |
| `/api/admin/artifacts` | GET | List template summaries and current `updatedAt` values |
| `/api/admin/artifacts/[id]` | GET | Return one validated template and `updatedAt` |
| `/api/admin/artifacts/[id]` | PUT | Validate and persist one template when `updatedAt` matches |
| `/api/admin/artifacts/[id]/reset` | POST | Restore one template from seed when `updatedAt` matches |

All routes use the existing admin role boundary. HTTP APIs return 403 for unauthorized access, 400 for invalid payloads, 404 for unknown IDs, 409 for stale writes, and 500 only for unexpected server failures. Error bodies follow `{ error: string }`.

Successful write/reset responses return the validated template and its new `updatedAt`.

## Minimal Editor

The Story 16.1 editor:

- lists seeded templates and clearly marks read-only base types;
- loads one template at a time;
- renders a fixed 16:9 Fabric.js canvas through an uncontrolled React wrapper;
- lets an admin select, move, and resize existing editable elements;
- lets an admin change fixed text and supported font/color fields;
- offers explicit Save and Reset actions with busy, success, validation-error, and stale-conflict feedback;
- reloads persisted state after navigation or page refresh;
- blocks editing for SongSet, FullScreenImage, and Announcement templates;
- does not create/delete templates or elements.

Reset requires explicit confirmation in the UI because it discards the selected template’s persisted customization.

## Verification Gates

- Registry tests use a temporary `DB_PATH` and prove missing-only seed behavior, persistence across DB reopen, one-template reset, validation rejection, image safety, and optimistic concurrency.
- Seed tests prove complete catalog/base-type coverage and that every bundled asset reference resolves to a committed runtime file.
- API tests prove admin success plus operator/anonymous 403 behavior and 400/404/409 mappings.
- Editor-level verification demonstrates edit → save → reload and reset for an editable seed, plus read-only behavior for each non-editable base type.
- Existing `tests/slide-plan.test.mjs` remains unchanged and passes.
- `npm test`, `npm run lint`, and `npm run build` pass.
- Any new test file is added to the explicit `package.json` test list.
