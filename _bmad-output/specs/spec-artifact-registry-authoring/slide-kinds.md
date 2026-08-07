# Slide kinds (v1 after taxonomy collapse)

Companion to `SPEC-artifact-registry-authoring`. Replaces the Epic 16 seven-base-type authoring model for **this Correct Course**.

## Three kinds only

| Kind | In ordered registry | Canvas? | Runtime behavior |
| --- | --- | --- | --- |
| **General** | One row per slide | **Yes** — full authoring (background, text, text area, images, insert catalog placeholders, style) | Renders the saved canvas; catalog placeholders filled from worship-service weekly values |
| **SongSet** | One row per **slot identity** (special) — see below | **No** freeform canvas; a **bounded configuration surface** only (`AD-22`) | Expands to song **title** + **lyric** pages (verse + refrain) from the hymnal, using the hymnal number bound to **that slot identity** on the worship service |
| **Announcement** | Any number of rows (special) — usually one, no cap | **No** canvas | Expands to **N full-screen images** from the Announcements list (upload/URL). Upload = fullscreen immediately; no extra elements |

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
- **Removing** a slot row is allowed and is not an error: the slot does not appear, because the administrator took that song out of the order, and the entered hymnal number survives in the service's own data (`AD-16`).

The identity is **never administrator-editable**, and **at most one row may carry each identity**. Adding a SongSet row therefore means claiming one of the four identities not currently in the order. A fifth slot is a code-plus-tests change, never administrator configuration.

**Available is not the same as present — ratified by the owner 2026-08-07.** All four identities are **permanently available**; what an administrator changes is whether each is *in the order*. So: each may be added once and not twice; each may be **absent**, which is a valid configuration rather than a mistake; and removing one is **reversible by the administrator**, because the identity returns to the available set. `delete` on a SongSet row means removal from the order — nothing removes an identity from the predefined set, which is why the earlier wording "deleting a slot" was replaced. The same two-level rule governs Announcement, with the opposite membership cap: see above.

What an admin *does* configure on a SongSet row: **label**, **order**, and the `AD-22` bounded surface — two background images (one title layout, one lyric layout shared by verse and refrain) plus font style and font size. Nothing else; operators do not draw each lyric page. Full extent in `authoring-boundaries.md`.

**Seed consequence (Story 20.1).** The shipped `data/default-registry.json` holds **one** `song-set` row. Four slot identities need four rows, so the seed grows from one to four as part of Story 20.1's seed authoring.

### Announcement
- Insert an **Announcement** entry in the order. One is the usual configuration; the order admits more than one and imposes no cap, and none at all is valid too (owner, 2026-08-07). Each row expands the **whole** live list — no row selects a subset, so several rows show the same images several times, **and that is the point**: the same announcement block at the start, middle, and end of one service. It is never a split of the list across positions, so no subset mechanism is wanted, and nothing deduplicates, collapses, or warns about the repetition.
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

**Decided 2026-07-31 in `EXPERIENCE.md` → *Inside `/admin/artifacts`* → *Row display*, which owns it.** The chip names the **kind** — `[general]`, `[song-set]`, `[announcement]` — **never the entry key**. A `songset-bt-open` row therefore shows `[song-set]`. Three standing grounds, no new one: `AD-19` makes slot keys server-owned binding vocabulary, CAP-5 makes the label the only administrator-editable part, and `EXPERIENCE.md`'s voice rule bars system vocabulary from human surfaces — a raw hyphenated key in a chip is exactly that. *Owner: Story 20.3.*

**The consequence is load-bearing, not commentary.** The four SongSet rows share one chip and are told apart **only by their labels** — and labels are renameable. So the `AD-22` bounded configuration surface must **state the row's slot read-only**, phrased in worship vocabulary (which slot of which service part), never as the raw key. Without it a rename orphans the row's liturgical identity and nothing on any screen says which song the row feeds. *Owner: Story 20.7.* Extent consequences in `authoring-boundaries.md`.
