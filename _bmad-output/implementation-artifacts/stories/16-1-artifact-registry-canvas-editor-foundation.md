---
story: "16.1"
epic: "16"
title: "Artifact Registry & Canvas Editor Foundation"
status: done
updated: 2026-07-23
---

# Story 16.1: Artifact Registry & Canvas Editor Foundation

## User Story

As an administrator,
I want a SQLite-backed Artifact Registry seeded from validated JSON and a constrained canvas editor for existing templates,
so that global slide layouts can be safely edited, persisted, and restored without deploying code changes.

## Goal

Deliver the persistence, validation, authorization, API, seed, and minimal editing foundation required by later Epic 16 stories without changing current slide-plan or rendering behavior.

## Ordered SSOT

1. `_bmad-output/specs/spec-slide-artifact-model/SPEC.md`
2. `_bmad-output/specs/spec-slide-artifact-model/registry-contract.md`
3. `_bmad-output/specs/spec-slide-artifact-model/artifact-catalog.md`
4. `_bmad-output/planning-artifacts/architecture-epic-16/ARCHITECTURE-SPINE.md`
5. `_bmad-output/project-context.md`
6. `package.json`

When prose conflicts, the SPEC and its companions govern product behavior, the architecture governs structural invariants, and `package.json` governs installed versions.

## Locked Decisions

- SQLite is the live registry SSOT.
- `data/default-registry.json` is validated startup seed data. Startup inserts missing IDs only and never overwrites saved templates.
- Templates are global. `/admin/artifacts` and `/api/admin/artifacts/**` are admin-only.
- Fabric.js owns an uncontrolled fixed-16:9 canvas; persisted coordinates use normalized percentage values and preserve intentional off-canvas clipping.
- The editor modifies existing seeded templates/elements only and saves explicitly.
- General, TextPlaceholder, ImagePlaceholder, and MixPlaceholder are editable. FullScreenImage, SongSet, and Announcement are registry-defined but read-only.
- `BibleVerseContemplation` is TextPlaceholder with standing defaults.
- Reset restores one selected template from seed after confirmation.
- Unsafe image references and structurally invalid or stale writes are rejected server-side.
- Story 16.1 does not migrate the planner, renderers, or preview.

## Acceptance Criteria

### AC-16.1-001 — Durable missing-only seed

Given a new temporary database, when registry initialization runs, then every shipped template from `data/default-registry.json` is stored in SQLite. Given an existing edited template, subsequent initialization preserves it while inserting any newly introduced seed IDs. Seed initialization does not require either local source PPTX at runtime.

### AC-16.1-002 — Complete valid registry contract

The shipped v1 seed validates against `registry-contract.md`, covers every Artifact named by `artifact-catalog.md`, enforces all seven base-type rules, and includes stable layout, element, and placeholder IDs. SongSet includes distinct title and lyric layouts. The current v0 extraction is transformed without silently discarding source geometry or standing content, and every bundled asset reference resolves to a committed runtime file.

### AC-16.1-003 — Admin-only management boundary

`/admin/artifacts` and all `/api/admin/artifacts/**` routes are usable by a DB-revalidated admin. Anonymous and operator access is forbidden. The APIs expose list, read-one, update-one, and reset-one behavior using the exact routes in `registry-contract.md`.

### AC-16.1-004 — Strict mutation validation

Save/reset cannot persist an unknown-field payload, malformed coordinate/style value, invalid base-type/layout combination, missing required layout/placeholder/element, inconsistent placeholder reference, unsafe image reference, or unknown template ID. Rejection leaves the prior row unchanged and uses the required 400/404 response.

### AC-16.1-005 — Optimistic concurrency

Read responses include `updatedAt`. Update and reset require the matching value, create a new value on success, and return 409 without mutation when stale.

### AC-16.1-006 — Minimal editable canvas

At `/admin/artifacts`, an admin can select an editable seeded template, move and resize existing elements, change fixed text and supported font/color fields, and receive clear load, busy, validation, conflict, and success states. The canvas uses an uncontrolled Fabric.js boundary and explicit Save.

### AC-16.1-007 — Persistence and targeted reset

After save and page reload, the editor reproduces the stored template. After confirmed reset, only the selected template equals its shipped seed; other templates retain their persisted state.

### AC-16.1-008 — Read-only base types and stable required elements

FullScreenImage, SongSet, and Announcement templates are visible but cannot be edited. Story 16.1 provides no create/delete template or element action, and required IDs cannot be removed or renamed through a save payload.

### AC-16.1-009 — No slide behavior drift

`SlideKind`, `SlidePlanItem`, `buildSlidePlan`, slide ordering/content, `pptx.ts`, `SlideView.tsx`, and preview badges retain their pre-story observable behavior. Existing `tests/slide-plan.test.mjs` passes unchanged.

### AC-16.1-010 — Repository gates

Registry and API tests cover temporary-DB seeding, preservation, reset, validation, image safety, authorization, and stale conflicts. New tests use `node:test` and are included in the explicit `package.json` test list. `npm test`, `npm run lint`, and `npm run build` pass. Cursor reads the relevant installed Next.js guide before changing Next.js route or page code.

## Implementation Scope

- Registry types, validator, seed loader, and server-side SQLite access under `src/lib/*`.
- Startup DDL consistent with the existing `getDb` pattern.
- `data/default-registry.json`.
- Transformation of the existing v0 seed using `data/raw-slides.json`, `slides-new/*.jpg`, `scripts/build-registry.mjs`, and the locally available source deck as evidence.
- Committed reusable runtime assets referenced by the v1 seed; the source PPTX itself remains an external extraction input.
- Admin list/read/update/reset route handlers.
- `/admin/artifacts` and its client-only Fabric.js wrapper/editor components.
- Focused Node tests and the explicit test-script update.
- Fabric.js dependency addition using a version compatible with the current React/TypeScript/Next.js stack.

## Explicit Non-goals

- No `ArtifactInstance[]` migration.
- No standing-content removal from `slide-plan.ts`.
- No PPTX or web renderer refactor.
- No semantic preview badge/grouping change.
- No template/element creation or deletion.
- No autosave, per-service templates, slide reordering, video, or full design-tool surface.

## Closure Notes

- Exact accepted target: `cca3b556b61f1e6446617f15fb381e5f8d6ce1b1 + working tree`.
- Fixed review findings: `1`, `6`, `7`, `9`, `10`, and `11`.
- Deferred follow-up findings: `2`, `3`, `4`, `5`, and `8`, recorded as non-blocking future work.
- Accepted verification evidence carries passing `npm test` and `npm run build`; inherited repo-wide `npm run lint` failures remain outside the Story 16.1 diff and are documented in the workflow close record.

## Verification Commands

```text
npm test
npm run lint
npm run build
```

Additionally demonstrate editable-template save/reload/reset and read-only behavior for FullScreenImage, SongSet, and Announcement.
