# Authoring Boundaries

Companion to `SPEC-artifact-registry-authoring`. Defines **where** each kind of change is made so Presenter labels and deck order are no longer mysterious.

## Two surfaces (after Correct Course)

| Surface | Owns | Does not own |
| --- | --- | --- |
| **Ordered Artifact Registry** (admin authoring) | Entry set, **order**, **label**, General canvas + placeholders, the SongSet **bounded configuration surface** (`AD-22`, extent below), Announcement row presence | Weekly hymnal numbers per SongSet slot, sermon title, photos, announcement image URLs, **and the kind / slot identity of any row** (`AD-19`) |
| **Worship service intake + Announcements menu** | Weekly values including **hymnal number per SongSet slot** (BT open/close, DS open/close), media, announcement list | Permanent deck structure and General chrome |

Presenter / slideshow / PPTX are **playback** surfaces.

## What the administrator may not edit at all

`AD-19` makes every cross-boundary key a **server-owned value**: the row's **kind**, its **SongSet slot identity**, and every **Placeholder Catalog key**. These are set when the row is created and no authoring surface exposes them for editing. The recognized entry set is **closed** — `general`, the four `songset-*` slot identities, `announcement`: six keys over three kinds, and no write path admits a seventh.

Why it is a hard boundary and not a UI preference: the slot identity **is** the handle the worship-service settings form binds a hymnal number to. A retype control lets one row become `songset-ds-open` while another already holds it, and the binding that the whole four-slot scheme depends on stops having one answer. Adding a SongSet row therefore means **claiming one of the four slot identities not currently in the order** — a fifth slot is a code-plus-tests change, never administrator configuration.

**The predefined set is not the order, and only the order is the administrator's** (owner, 2026-08-07). The special kinds the system offers — the four `songset-*` identities and `announcement` — are **permanently available**; nothing an administrator does removes anything from that set, and `delete` on a row means **removal from the order**, nothing more. What differs per kind is only the membership cap: a `songset-*` identity sits in the order **at most once** and may be **absent** (a valid configuration, not an error); `announcement` may appear **more than once** and has no cap. A removed row is re-addable by the administrator — never a developer ticket.

**Not editable is not the same as not shown.** `AD-19` bars *editing*, never display, and the two decisions taken on it point opposite ways on purpose: the row's **kind** appears as its list chip, and the row's **slot** is stated read-only on the bounded configuration surface, both phrased in worship vocabulary (`EXPERIENCE.md` → *Row display*, 2026-07-31). The raw `songset-*` key reaches no human surface. The slot statement is required precisely *because* the label is renameable and the four SongSet rows share one chip — without it a rename leaves no screen saying which song the row feeds.

Removing a slot row is allowed and is not an error: the slot simply does not appear, because the administrator took that song out of the order, and the entered hymnal number survives in the service's own data (`AD-19`, `AD-16`).

## Answer: where do I change "Bible Talk Sequence"?

1. Open the Ordered Artifact Registry.
2. Select the slide row whose label is currently `Bible Talk Sequence`.
3. Edit **Label** in the slide inspector. **Only the label** — kind and slot identity are server-owned and not editable here (`AD-19`).
4. Save.
5. New Presenter runs show e.g. `[General] <your label>`.

Fixed chrome text that is **not** a placeholder (baked General copy on the canvas) is edited on the canvas text element itself, then Saved — same registry surface.

## The SongSet bounded surface, in full

`AD-22` fixes the extent exactly, and no surface may widen it:

- **Two background images** — one for the row's **title** layout, one for its **lyric** layout, which verse and refrain **share**. There is no third layout and no third background.
- **Font style** and **font size**.

Nothing else is **configurable** — and that is a rule about the surface's **controls**, not its content. One thing the surface must nonetheless **display**: the row's slot, read-only, in worship vocabulary (`EXPERIENCE.md` → *Row display*). A read-only statement widens no authoring authority; read as a content rule, "nothing else" would ship Story 20.7 without it — the same trap that once left this surface with no font controls.

Layout composition itself is developer-owned seed data and is not exposed here; it stays registry data hydrated into the plan (`AD-11`, `AD-12`). The row's placeholder set and its slot binding are server-defined — nothing may be added, removed, or rebound, and the validator refuses it on every write path (`AD-15`).

**Where those values live matters to anyone building this surface.** Administrator-configured values persist as an **override record keyed by row and field, outside the layout JSON**, re-applied over the developer layout at hydration. The layout stays developer-owned in full and a migration may replace it wholesale; the override record stays administrator-owned in full and no migration, Reset, or re-seed writes it. A bounded surface that writes *into* the layout is refused on every write path — and would silently lose every background and font size the administrator chose the first time a layout migration ran.

**Reset restores the shipped *layout* and leaves the override record untouched.** That is the point of keeping the two apart.

## Order

Drag-reorder (or explicit move up/down) in the ordered registry list is the only supported way to change default live sequence. There is no parallel "instance order" table for normal operation. Reordering changes the presented sequence and touches no hymnal binding (`AD-19`).

## Historical freeze (per service)

| Action | Effect |
| --- | --- |
| **Create worship service** | Clones the full live ordered Artifact Registry — order, labels, layouts, placeholder bindings, **and the `AD-22` administrator override records** — into a **service-bound snapshot**. Creation is the only freeze event (`AD-16`). |
| **Live Artifact Registry** | Mutable global authoring SSOT. Edits do **not** affect existing services' snapshots. |
| **Sync Artifact** (on a service) | Explicit re-clone from the live registry; **replaces** that service's snapshot (destructive to prior clone). Permitted on any service, carries the service's `updated_at` precondition (`AD-6`), and is **admin-only** — a structural write. An operator may see that their snapshot is stale and *request* a sync; they may not perform one (`AD-16`). Weekly worship field values are not merged: structure/layout come from the new clone, weekly values still come from intake. |

**Announcement membership is not cloned.** The Announcements master list stays live and reaches an existing service at render time (`AD-16`, CAP-7). It is still scoped per service — "not cloned" means this week's flyers may change after the structure is frozen, never that one list is shared across services.

A service's deck is built from that service's snapshot — but the snapshot is the **sequence input to `buildSlidePlan`**, which remains the single source of order and layout. **No renderer reads a snapshot directly**, any more than it read the live registry (`AD-12`, `AD-16`). Presenter, slideshow, and PPTX all read the plan.

## Migration note

Epic 16 shipped an alphabetical template catalog + planner-owned order. This course **replaces** that split for authoring UX: order lives in the registry. Adopted Epic 16 companions describe the prior model and remaining technical primitives (hydration, base types, Fabric patterns) useful for implementation, not the authoring product boundary.
