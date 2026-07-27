# Form Fields — Worship Web Input

This companion defines the structured and raw form fields for worship service creation and editing, their types, validation rules, and mapping to the database and `ParsedRundown` shape.

**Parity rule:** Create (`/services/new`) and `/services/[id]` must expose the same field set, section grouping, labels, and controls from this companion. `/services/[id]` requires a working edit form (not show-only). Service-only chrome (Preview, Present, Delete, Download PPTX, Manage list, announcement strip) is defined in `edit-page-chrome.md`, not here.

## Form Field Mapping

The form operates with a single unified text input: the **Raw Rundown Text**. This acts as the raw rundown and the raw participant list. The operator clicks the **[Parse]** button to extract the Date, Hymns, Sections, and Roles, which then populate the **Structured Overlays**.

| Form Field | HTML Control | DB / Payload Target | Required | Description |
|---|---|---|---|---|
| **Raw Rundown Text** (`payload`) | Textarea | `services.raw_payload` | Yes | Raw plaintext rundown. Click [Parse] to extract Date, Hymns, Sections, and Roles into structured overlays. |
| **Song 1 Number** (`song1Number`) | Autocomplete | Overlay → first Bible Talk hymn in `ParsedRundown.items` | No | Bible Talk Opening Song (SDAH number overlay). |
| **Song 2 Number** (`song2Number`) | Autocomplete | Overlay → second Bible Talk hymn | No | Bible Talk Closing Song. |
| **Song 3 Number** (`song3Number`) | Autocomplete | Overlay → first Divine Service hymn | No | Divine Worship Opening Song. |
| **Song 4 Number** (`song4Number`) | Autocomplete | Overlay → second Divine Service hymn | No | Divine Worship Closing Song. |
| **Verse Reading Reference** (`verseReference`) | Input (text) | `ParsedRundown.verseReading.reference` | No | Scripture reading reference (e.g., `Acts 18:9,10`). |
| **Verse Reading Text** (`verseText`) | Textarea | `ParsedRundown.verseReading.text` | No | Text of the scripture reading. |
| **Sermon Speaker Name** (`sermonSpeaker`) | Input (text) | `ParsedRundown.sermon.speaker` | No | Name of the sermon speaker (Slide 40). Sermon title is not collected on the web form. |
| **Sermon Graphic URL** (`sermonGraphicUrl`) | Input (text) | `services.images_payload.sermonGraphicUrl` | No | Image URL or local upload path for the sermon graphic (Slide 41). |
| **Closing Prayer Person** (`closingPrayerPerson`) | Input (text) | `ParsedRundown.closingPrayerPerson` | No | Auto-filled from Sermon Speaker when empty / previously synced. |
| **Family Photo URL** (`familyPhotoUrl`) | Input (text) | `services.images_payload.familyPhotoUrl` | No | Family photo for Slide 56. |
| **Family Prayer Request** (`familyPrayerRequest`) | Textarea | `ParsedRundown.familyPrayerRequest` | No | Prayer request text for the family of the week (Slide 56). |
| **Youth Photo URL** (`youthPhotoUrl`) | Input (text) | `services.images_payload.youthPhotoUrl` | No | Youth photo for Slide 56. |
| **Youth Prayer Request** (`youthPrayerRequest`) | Textarea | `ParsedRundown.youthPrayerRequest` | No | Prayer request text for the youth of the week (Slide 56). |
| **Announcements List** (`announcements`) | List component | `announcement_items` | No | Ordered flyers. Each row: `image_url`, `is_recurring` (true = master/`service_id IS NULL`; false = one-off for this service). Default inherit master; master rewritten only when recurring URLs/order change; one-offs always replaced for the service. Interleave one-offs among master in the form. |
| **Special Song** (`specialSong`) | Input (text) | `ParsedRundown.specialSong` | No | Performer/name for Special Song; `-` or empty resolves to null. |

## Raw Rundown Ingestion & Parsing

- **Extraction:** Clicking the **[Parse]** button triggers an extraction routine that parses the **Raw Rundown Text**.
- **Date:** Service date is parsed automatically from the first match of `dateRegex`.
- **Hymns:** Hymns are extracted and their numbers populate the structured fields. The UI must display the hymn title alongside the hymn number inside the text field/autocomplete to provide better context.
- **Roles & Participants:** Roles (like Sermon Speaker, Prayer Partners, etc.) are extracted using regex and populate the structured fields.
- **Sections:** Section titles are parsed as `items[]` of type `section`.

## Structured Fields Overlays

When saving changes:
1. The **Raw Rundown Text** is saved exactly as entered in `raw_payload`.
2. Any **Structured Fields** are applied via `applyStructuredFields()` (including song number overlays and roles).
3. Operators can freely modify the Structured Fields after clicking [Parse]; their manual edits take precedence.
4. The Structured Overlays are grouped visually into separate Cards, in order: **Bible Talk** → **Divine Worship** (opening/closing songs + Special Song) → **Sermon** (speaker, closing prayer person, sermon graphic — not nested inside Divine Worship) → **Family of the Week** → **Youth of the Week** → **Announcement Flyers**.

## Announcements (worship form)

- Baseline: load current master list (`service_id IS NULL`).
- If the operator does not change recurring rows, master stays unchanged.
- Operator may edit master in-place from create/edit (no menu hop) — that updates global master.
- Operator may insert one-time flyers among the list (`is_recurring: false` → `service_id = <service>`).
- Persist via `syncWorshipAnnouncements` — never wipe master on every save.
- Empty desired master (no recurring rows) does **not** clear the global master unless the request sets `clearMaster: true` (explicit operator intent).
- **UX:** Provide a clear explanation/usage instruction in the UI about how this section works (e.g., distinguishing master list from one-offs). Place this helper text clearly, perhaps at the bottom of the section, to improve operator comprehension.
