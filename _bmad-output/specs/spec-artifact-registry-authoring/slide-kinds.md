# Slide kinds (v1 after taxonomy collapse)

Companion to `SPEC-artifact-registry-authoring`. Replaces the Epic 16 seven-base-type authoring model for **this Correct Course**.

## Three kinds only

| Kind | In ordered registry | Canvas? | Runtime behavior |
| --- | --- | --- | --- |
| **General** | One row per slide | **Yes** — full authoring (background, text, text area, images, insert catalog placeholders, style) | Renders the saved canvas; catalog placeholders filled from worship-service weekly values |
| **SongSet** | One row per song slot (special) | **No** freeform canvas; **yes** background settings for expanded title/lyric presentation | Expands to song **title** + **lyric** pages (verse + refrain) from hymnal using the hymnal number bound on the worship service for that slot |
| **Announcement** | One row `[Announcement]` (special) | **No** canvas | Expands to **N full-screen images** from the Announcements list (upload/URL). Upload = fullscreen immediately; no extra elements |

## What operators do

### General
- Add/reorder/delete in the ordered list.
- Open canvas: layout freely; **Insert placeholder** from the central catalog; style instances.
- Examples: Welcome, sequence slides, sermon flyer/graphic (image placeholder), Family & Youth (family/youth photos + prayer text placeholders), verse reading (text placeholders), contact, offering chrome, etc.

### SongSet

- Four **predefined** slots ship in the ordered registry (stable identities):
  1. Bible Talk — opening song  
  2. Bible Talk — closing song  
  3. Divine Service — opening song  
  4. Divine Service — closing song  
- Admins **reorder** these rows among other registry entries and edit **label** + **background** settings for the expanded title/lyric look.
- Each slot is always expandable (title + lyrics); operators do not draw each lyric page.
- **Worship service settings** set the **hymnal number** for each of the four slots independently.
- No freeform Insert-placeholder canvas on SongSet rows.

### Announcement
- Insert one **Announcement** entry in the order.
- Content of *which* images appear is managed only in **Announcements** menu/list for that service (or global list per existing product rules) — not in a canvas.
- Each image presents full-bleed.

## Retired as distinct kinds

These Epic 16 types are **not** separate registry kinds anymore; their jobs move onto **General + catalog placeholders**:

- TextPlaceholder  
- ImagePlaceholder  
- MixPlaceholder  
- FullScreenImage  

## Badge display

Presenter / lists show `[General]`, `[SongSet]`, or `[Announcement]` plus the editable **label** on that registry row.
