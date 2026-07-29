---
id: SPEC-artifact-registry-authoring
companions:
  - authoring-boundaries.md
  - placeholder-catalog.md
  - slide-kinds.md
  - ../spec-slide-artifact-model/SPEC.md
  - ../spec-slide-artifact-model/artifact-catalog.md
  - ../spec-slide-artifact-model/registry-contract.md
  - ../../project-context.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.
>
> **Correct Course.** This contract supersedes Story 16.1 non-goals that forbade create/delete/reorder and treated the registry as an unordered template catalog only. Where adopted Epic 16 companions conflict with this SPEC (including the seven-base-type authoring model), **this SPEC wins**.

# Ordered Artifact Registry Authoring

## Why

**Pain + vision.** Operators already have a live Presenter deck and an Artifact Registry, but the registry is an alphabetical template catalog with no boundary to manage **order**, **names**, or rich layout the way the Presenter list implies. Separating “template catalog” from “instance order” without an authoring surface for the ordered deck makes the registry feel useless for day-to-day control. The product direction is an **ordered Artifact Registry** as the central place to author deck structure and General-slide visuals, with **SongSet** and **Announcement** as special system expanders, while weekly values still flow from worship intake. Creating a service clones that registry; **Sync Artifact** can refresh the clone.

## Capabilities

- **CAP-1**
  - **intent:** The system maintains one ordered Artifact Registry that defines which slides exist and in what sequence for live presentation generation.
  - **success:** Reordering two registry entries and creating a new service yields Presenter/PPTX in that sequence without editing TypeScript plan constants.

- **CAP-2**
  - **intent:** An administrator can add, delete, rename, and reorder registry entries, including inserting special **SongSet** and **Announcement** entries.
  - **success:** After Save, the ordered list persists; a new service clone and Presenter list reflect the same order, kinds, and labels.

- **CAP-3**
  - **intent:** For **General** slides only, an administrator can fully author the canvas: background; insert images, text, and text areas; drag, resize; font color, size, and style (bold, italic, underline); Save required.
  - **success:** A round-trip General-slide edit survives reload and appears equivalently in web Presenter and PPTX for a service using that snapshot.

- **CAP-4**
  - **intent:** A central predefined Placeholder Catalog can be inserted onto **General** slides and styled locally; weekly worship fields fill those bindings.
  - **success:** Sermon graphic works as General + image placeholder; Family/Youth as General + family/youth photo and prayer placeholders; the same catalog key can appear on multiple Generals with different styling; UI cannot invent new catalog keys.

- **CAP-5**
  - **intent:** Each registry entry has a kind of **General**, **SongSet**, or **Announcement**, plus an editable label; lists show `[kind] label`.
  - **success:** Renaming a General sequence slide’s label updates Presenter badges for services that clone/sync afterward; Announcement and SongSet rows never open a freeform canvas.

- **CAP-6**
  - **intent:** Creating a worship service clones the full ordered Artifact Registry into a service-bound snapshot; **Sync Artifact** replaces that snapshot from the live registry.
  - **success:** Live registry edits do not affect an existing service until Sync; after Sync, structure/layout/order/labels match the live registry.

- **CAP-7**
  - **intent:** **Announcement** is a single registry entry that expands to full-screen images from the Announcements list; upload means fullscreen with no extra elements.
  - **success:** Presenter/PPTX show one full-bleed slide per announcement image; there is no canvas editor for the Announcement entry.

- **CAP-8**
  - **intent:** **SongSet** entries are expandable title+lyric blocks with configurable backgrounds; four predefined slots (Bible Talk opening/closing, Divine Service opening/closing) ship in the registry and receive per-slot hymnal numbers from worship-service settings.
  - **success:** Reordering the four SongSet rows changes Presenter sequence; setting distinct hymn numbers on a service fills each slot’s title/lyrics; changing a SongSet background in the registry appears on that slot’s expanded pages after create/sync without opening a freeform canvas of arbitrary elements.

## Constraints

- Weekly placeholder **values** and announcement image membership continue to come from worship-service intake and the Announcements menu — not from inventing content inside the registry canvas.
- `buildSlidePlan` (or successor) consumes the **ordered registry snapshot** (per service) as the sequence source.
- Slide kinds are exactly three: General, SongSet, Announcement (`slide-kinds.md`). Epic 16’s TextPlaceholder / ImagePlaceholder / MixPlaceholder / FullScreenImage are retired as distinct kinds.
- Placeholder Catalog extensions require code + tests.
- Public-repository rules unchanged.
- Explicit Save for registry/canvas mutations; no autosave.
- SongSet entries expose **background configuration** (and label/order) but not freeform multi-element canvas authoring of every lyric page.
- The four predefined SongSet slots have **stable identities** so worship-service settings can bind hymnal numbers per slot even if display labels or order change.

## Non-goals

- Canvas editing for Announcement or per-lyric SongSet pages.
- Editing layout on the Presenter playback UI during the service.
- Operator-defined arbitrary placeholder keys without code.
- Video elements or full Canva-suite parity beyond General CAP-3.
- Work in the frozen `bic-pptx-workflow` repository.

## Success signal

Admin builds an ordered registry with Generals, the four predefined SongSets (with backgrounds), and Announcement; Saves; creates a service (clone); sets hymnal numbers for BT open/close and DS open/close on the service. Presenter expands each SongSet to title+lyrics with the configured backgrounds; Sync Artifact refreshes structure from the live registry.

## Assumptions

- Migrated seed ordered registry mirrors today’s plan sequence, mapping today’s four song positions to the four predefined SongSet slots plus Generals/Announcement as appropriate.
- Multiple SongSet rows beyond the four defaults may be added later only if new stable slot identities and form bindings are introduced in code; v1 ships the four named slots.

## Open Questions

<!-- none — SongSet background + four-slot hymnal binding resolved -->
