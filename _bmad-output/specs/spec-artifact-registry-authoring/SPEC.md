---
id: SPEC-artifact-registry-authoring
companions:
  - authoring-boundaries.md
  - placeholder-catalog.md
  - slide-kinds.md
  - ../spec-slide-artifact-model/SPEC.md
  - ../spec-slide-artifact-model/artifact-catalog.md
  - ../spec-slide-artifact-model/registry-contract.md
  - ../../planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md
  - ../../project-context.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.
>
> **Correct Course.** This contract supersedes Story 16.1 non-goals that forbade create/delete/reorder and treated the registry as an unordered template catalog only. Where adopted Epic 16 companions conflict with this SPEC (including the seven-base-type authoring model), **this SPEC wins**.
>
> **Delivery status — added 2026-07-30.** Adopted whole by owner decision and now tracked as **Epic 20** in `../../planning-artifacts/epics.md`, one story per capability (`20-1`…`20-8` in `sprint-status.yaml`), all `backlog`. Until that date this SPEC had a supersession claim over shipped code and **no epic, story or sprint key at all** — the claim above was therefore unenforceable and unscheduled, which is how it sat for weeks while `artifact_templates` still had no ordering column and the admin API no create/delete/reorder verb. **One adoption consequence is recorded in the epic, not here:** the `base_type` migration implied by *Constraints* (seven types to three kinds). The other — CAP-6 **reversing** architecture decision `AD-14`'s "global across services" clause — is no longer open: the spine now carries **AD-16 (Service-Bound Registry Snapshot)**, added the same day, which records that reversal directly. Story 20.8 is unblocked **at spine altitude**; two items still stand there. Where the snapshot lives physically is its own design call (`ARCHITECTURE-SPINE.md`), and `EXPERIENCE.md` → *Venue & Projection Constraints* still states the global-and-immediate rule with Flow 5's climax turning on it — `epics.md:374` records that as what remains of Story 20.8's block.

# Ordered Artifact Registry Authoring

## Why

**Pain + vision.** Operators already have a live Presenter deck and an Artifact Registry, but the registry is an alphabetical template catalog with no boundary to manage **order**, **names**, or rich layout the way the Presenter list implies. Separating “template catalog” from “instance order” without an authoring surface for the ordered deck makes the registry feel useless for day-to-day control. The product direction is an **ordered Artifact Registry** as the central place to author deck structure and General-slide visuals, with **SongSet** and **Announcement** as special system expanders, while weekly values still flow from worship intake. Creating a service clones that registry; **Sync Artifact** can refresh the clone.

## Capabilities

- **CAP-1**
  - **intent:** The system maintains one ordered Artifact Registry that defines which slides exist and in what sequence for live presentation generation.
  - **success:** Reordering two registry entries and creating a new service yields Presenter/PPTX in that sequence without editing TypeScript plan constants.

- **CAP-2**
  - **intent:** An administrator can add, delete, rename, and reorder registry entries, including inserting special **SongSet** and **Announcement** entries.
  - **success:** After Save, the ordered list persists; a new service clone and Presenter list reflect the same order, kinds, and labels. Adding a SongSet entry means claiming one of the four slot identities no row currently holds — a second row claiming an identity already taken, or a fifth slot invented in the UI, is refused (`AD-19`).

- **CAP-3**
  - **intent:** For **General** slides only, an administrator can fully author the canvas: background; insert images, text, and text areas; drag, resize; font color, size, and style (bold, italic, underline); Save required.
  - **success:** A round-trip General-slide edit survives reload and appears equivalently in web Presenter and PPTX for a service using that snapshot.

- **CAP-4**
  - **intent:** A central predefined Placeholder Catalog can be inserted onto **General** slides and styled locally; weekly worship fields fill those bindings.
  - **success:** Sermon graphic works as General + image placeholder; Family/Youth as General + family/youth photo and prayer placeholders; the same catalog key can appear on multiple Generals with different styling; UI cannot invent new catalog keys.

- **CAP-5**
  - **intent:** Each registry entry has a kind of **General**, **SongSet**, or **Announcement**, plus an editable label; lists show `[kind] label`.
  - **success:** Renaming a General sequence slide’s label updates Presenter badges for services that clone/sync afterward; Announcement and SongSet rows never open a freeform canvas. The **label is the only** part of a row an administrator edits: no surface exposes the row’s kind or its SongSet slot identity (`AD-19`).

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
- Every **cross-boundary key** is a server-owned value no authoring surface may edit: a row’s kind, its SongSet slot identity, and every Placeholder Catalog key. `AD-19` fixes the recognized entry set as **closed at six keys over three kinds** — `general`, the four `songset-*` slot identities, `announcement` — with at most one row per slot identity, and bare `song-set` naming the kind but never an entry. Extending the vocabulary is code + tests.
- Placeholder Catalog extensions require code + tests.
- Public-repository rules unchanged.
- Explicit Save for registry/canvas mutations; no autosave.
- SongSet entries expose a **bounded configuration surface** (label, order, background) but not freeform multi-element canvas authoring of every lyric page. `AD-22` fixes the exact extent of that surface — two background images, one for the title layout and one for the lyric layout, plus font style and font size — and no surface may widen it.
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
- Worship services that already exist when this model ships (no clone yet) continue to render from their stored `parsed_data` plus the then-current live registry until an operator freezes/clones or syncs one for them.
- **Needs owner ratification.** That CAP-2’s “add a SongSet entry” means *claiming one of the four slot identities no row currently holds* is **derived**, not stated in `AD-19`. The spine fixes three things — the recognized set is closed, at most one row carries each slot identity, and a deleted slot leaves an inert binding — and this is the only reading under which CAP-2 keeps its add verb and `AD-19` keeps its closed set. If the intent was instead that SongSet rows can never be added at all once seeded, CAP-2 needs the narrower wording.

## Open Questions

<!-- none — SongSet background + four-slot hymnal binding resolved -->
