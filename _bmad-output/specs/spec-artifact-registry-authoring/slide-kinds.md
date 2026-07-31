# Slide kinds (v1 after taxonomy collapse)

Companion to `SPEC-artifact-registry-authoring`. Replaces the Epic 16 seven-base-type authoring model for **this Correct Course**.

## Three kinds only

| Kind | In ordered registry | Canvas? | Runtime behavior |
| --- | --- | --- | --- |
| **General** | One row per slide | **Yes** — full authoring (background, text, text area, images, insert catalog placeholders, style) | Renders the saved canvas; catalog placeholders filled from worship-service weekly values |
| **SongSet** | One row per **slot identity** (special) — see below | **No** freeform canvas; a **bounded configuration surface** only (`AD-22`) | Expands to song **title** + **lyric** pages (verse + refrain) from the hymnal, using the hymnal number bound to **that slot identity** on the worship service |
| **Announcement** | One row `[Announcement]` (special) | **No** canvas | Expands to **N full-screen images** from the Announcements list (upload/URL). Upload = fullscreen immediately; no extra elements |

The kinds are three, but the **recognized entry keys are six** and the set is closed: `general`, the four `songset-*` slot identities, `announcement`. Bare `song-set` names the *kind*; it is never an entry key (`AD-19`).

## What operators do

### General
- Add/reorder/delete in the ordered list.
- Open canvas: layout freely; **Insert placeholder** from the central catalog; style instances.
- Examples: Welcome, sequence slides, sermon flyer/graphic (image placeholder), Family & Youth (family/youth photos + prayer text placeholders), verse reading (text placeholders), contact, offering chrome, etc.

### SongSet

Four **predefined slot identities** exist, and the identity is the load-bearing part:

| Slot identity | Slot |
| --- | --- |
| `songset-bt-open` | Bible Talk — opening song |
| `songset-bt-close` | Bible Talk — closing song |
| `songset-ds-open` | Divine Service — opening song |
| `songset-ds-close` | Divine Service — closing song |

**The identity *is* the binding key.** Worship-service settings bind a hymnal number to each of the four independently, and they bind it to the identity — not to the row's label, and not to its position in the order (`AD-19`). Three consequences follow, and they are why the scheme works:

- **Reordering** rows changes the presented sequence and touches no binding.
- **Renaming** a label cannot touch one either.
- **Deleting** a slot row is allowed and is not an error: the slot does not appear, because the administrator removed that song from the order, and the entered hymnal number survives in the service's own data (`AD-16`).

The identity is **never administrator-editable**, and **at most one row may carry each identity**. Adding a SongSet row therefore means claiming one of the four identities that no row currently holds. A fifth slot is a code-plus-tests change, never administrator configuration.

What an admin *does* configure on a SongSet row: **label**, **order**, and the `AD-22` bounded surface — two background images (one title layout, one lyric layout shared by verse and refrain) plus font style and font size. Nothing else; operators do not draw each lyric page. Full extent in `authoring-boundaries.md`.

**Seed consequence (Story 20.1).** The shipped `data/default-registry.json` holds **one** `song-set` row. Four slot identities need four rows, so the seed grows from one to four as part of Story 20.1's seed authoring.

### Announcement
- Insert one **Announcement** entry in the order.
- Content of *which* images appear is managed only in the **Announcements** menu/list — not in a canvas. That master list stays **live** and reaches an existing service at render time rather than being cloned into its snapshot (`AD-16`, CAP-7). It is still scoped per service: this week's flyers may change after the structure is frozen, but one service's images never appear on another's deck.
- Each image presents full-bleed.

## Retired as distinct kinds

These Epic 16 types are **not** separate registry kinds anymore; their jobs move onto **General + catalog placeholders**:

- TextPlaceholder
- ImagePlaceholder
- MixPlaceholder
- FullScreenImage

They are **gone rather than renamed** (`AD-19`).

## Badge display

Presenter / lists show the row's kind plus its editable **label**.

**Open — owned by `EXPERIENCE.md`, not decided here.** For a `songset-bt-open` row, does the chip read `[song-set]` (the kind) or `[songset-bt-open]` (the identity)? `AD-19` implies the kind but does not say it, and display is `EXPERIENCE.md`'s to own. Tracked as Gap 3 in `sprint-status.yaml`. A builder should not pick one silently.
