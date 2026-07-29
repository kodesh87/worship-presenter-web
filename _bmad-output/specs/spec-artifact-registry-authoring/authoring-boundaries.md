# Authoring Boundaries

Companion to `SPEC-artifact-registry-authoring`. Defines **where** each kind of change is made so Presenter labels and deck order are no longer mysterious.

## Two surfaces (after Correct Course)

| Surface | Owns | Does not own |
| --- | --- | --- |
| **Ordered Artifact Registry** (admin authoring) | Entry set, **order**, **kind**, **label**, General canvas + placeholders, SongSet **backgrounds**, Announcement row presence | Weekly hymnal numbers per SongSet slot, sermon title, photos, announcement image URLs |
| **Worship service intake + Announcements menu** | Weekly values including **hymnal number per SongSet slot** (BT open/close, DS open/close), media, announcement list | Permanent deck structure and General chrome |

Presenter / slideshow / PPTX are **playback** surfaces.

## Answer: where do I change “Bible Talk Sequence”?

1. Open the Ordered Artifact Registry.
2. Select the slide row whose label is currently `Bible Talk Sequence`.
3. Edit **Label** (and optionally **baseType**) in the slide inspector.
4. Save.
5. New Presenter runs show e.g. `[General] <your label>`.

Fixed chrome text that is **not** a placeholder (baked General copy on the canvas) is edited on the canvas text element itself, then Saved — same registry surface.

## Order

Drag-reorder (or explicit move up/down) in the ordered registry list is the only supported way to change default live sequence. There is no parallel “instance order” table for normal operation.

## Historical freeze (per service)

| Action | Effect |
| --- | --- |
| **Create worship service** | Clones the full live ordered Artifact Registry (order, labels, layouts, placeholder bindings) into a **service-bound snapshot**. That snapshot is the freeze for this service. |
| **Live Artifact Registry** | Mutable global authoring SSOT. Edits do **not** affect existing services’ snapshots. |
| **Sync Artifact** (on a service) | Explicit re-clone from the live registry; **replaces** that service’s snapshot (destructive to prior clone). Weekly worship field values are not inventively merged — structure/layout come from the new clone; weekly values still come from intake. |

Presenter / PPTX for a service always read that service’s snapshot, not the live registry, unless Sync has just refreshed it.

## Migration note

Epic 16 shipped an alphabetical template catalog + planner-owned order. This course **replaces** that split for authoring UX: order lives in the registry. Adopted Epic 16 companions describe the prior model and remaining technical primitives (hydration, base types, Fabric patterns) useful for implementation, not the authoring product boundary.
