# Artifact Catalog

> Companion to `SPEC.md`. Maps every slide in the current `buildSlidePlan` output to its proposed Artifact type using the 7-type taxonomy, documenting the current implementation, content strategy, and placeholder schema.

The normative persisted shape, validation rules, API surface, and Story 16.1 editor boundary are defined in `registry-contract.md`. The data-shape sketch at the end of this file is historical context only when it differs from that contract.

> **The 7-type taxonomy below is superseded by `../spec-artifact-registry-authoring/SPEC.md` (Epic 20),** which collapses it to three kinds — General, SongSet, Announcement — under Story `20-2`. TextPlaceholder, ImagePlaceholder, MixPlaceholder and FullScreenImage retire as distinct kinds; their jobs move onto General plus the central placeholder catalog. This file remains accurate for what currently ships.

## The Seven Base Types

| #   | Base Type            | Canvas Editable? | Weekly Placeholders | Description                                                                                                                       |
| --- | -------------------- | :--------------: | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **General**          |        ✅         | None                | Fixed visual template. Layout editable via canvas, content baked in.                                                              |
| 2   | **TextPlaceholder**  |        ✅         | Text slots          | Canvas-editable layout + text fields that change each Sabbath.                                                                    |
| 3   | **FullScreenImage**  |        ❌         | 1 full-bleed image  | Single uploaded image fills the entire slide. No canvas needed.                                                                   |
| 4   | **ImagePlaceholder** |        ✅         | Image slots         | Canvas-editable layout + image placeholder areas that change each Sabbath.                                                        |
| 5   | **MixPlaceholder**   |        ✅         | Text + Image slots  | Canvas-editable layout + both text and image placeholders that change each Sabbath.                                               |
| 6   | **SongSet**          |        ❌         | Auto (hymn number)  | Auto-generated: song title slide + N lyric slides from hymnal DB. Not canvas-editable — content and layout are system-controlled. |
| 7   | **Announcement**     |        ❌         | List-driven images  | N full-screen images driven by the announcement flyer list.                                                                       |

### Why "Canvas Editable"?

Canvas-editable means a non-developer can open this Artifact's template in the canvas editor to reposition text boxes, resize elements, change fonts/colors, and save — without touching code. The saved layout is JSON that all renderers (PPTX, web slideshow, preview) read.

Types **not** canvas-editable have layouts that are either trivially simple (full-screen image = no layout to edit) or system-controlled (song lyrics = auto-split, positioning is algorithmic).

---

## Part A — Bible Talk

| #     | Current ID            | Current Kind | Artifact Name         | Base Type       | Weekly Placeholders | Notes                                                                                                                                                                                |
| ----- | --------------------- | ------------ | --------------------- | --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | `welcome`             | `text`       | **Welcome**           | General         | —                   | Canvas: "Welcome to", "BANDUNG INTERNATIONAL COMMUNITY". Background image full screen.                                                                                               |
| 2     | `bible-talk-sequence` | `text`       | **BibleTalkSequence** | General         | —                   | Canvas: "Bible Talk Sequence" + sequence list ("Prayer Partner", "Opening Song", etc). Background image full screen.                                                                 |
| 3     | `prayer-partners`     | `divider`    | **PrayerPartners**    | General         | —                   | Canvas: "Prayer Partners". Background image full screen.                                                                                                                             |
| 4     | `bt-opening-song-cue` | `divider`    | **OpeningSongCue**    | General         | —                   | Canvas: "Opening Song", "Congregation, please stand" (in a shape at bottom). Reused for Part B.                                                                                      |
| 5     | `bt-opening-title`    | `song-title` | *(SongSet child)*     | SongSet         | Hymn number         | Auto: `hymnNumber` + `songTitle`. Background is 2/3 solid color, 1/3 picture.                                                                                                        |
| 6–N   | `bt-opening-lyric-*`  | `song-lyric` | *(SongSet child)*     | SongSet         | Hymn number         | Auto: lyrics split into pages. `label` placeholder for verse/chorus. Background image on every slide.                                                                                |
| N+1   | `verse-reading`       | `scripture`  | **VerseReading**      | TextPlaceholder | `reference`, `text` | Canvas layout: `reference` (e.g., "1 Corinthians 1:10, ESV") + `text` slots. Filled from form (KJV).                                                                                 |
| N+2   | `bt-opening-prayer`   | `divider`    | **OpeningPrayer**     | General         | —                   | Canvas: "Opening Prayer". Fixed.                                                                                                                                                     |
| N+3   | `bible-talk`          | `divider`    | **BibleTalk**         | General         | —                   | Canvas: "Bible Talk", "Break up into classes". Fixed.                                                                                                                                |
| N+4   | `bt-closing-song-cue` | `divider`    | **ClosingSongCue**    | General         | —                   | Canvas: "Closing Song", "Congregation, please stand". Reused for Part B.                                                                                                             |
| N+5–M | `bt-closing-*`        | `song-*`     | *(SongSet child)*     | SongSet         | Hymn number         | Auto.                                                                                                                                                                                |
| M+1   | `bt-closing-prayer`   | `divider`    | **ClosingPrayer_BT**  | General         | —                   | Canvas: "Closing Prayer". Fixed.                                                                                                                                                     |
| M+2   | `break-time`          | `text`       | **BreakTime**         | General         | —                   | Canvas: "Break Time", "5 MINUTES", "Bank Mandiri 0000 0000 0000 0000 Gereja Masehi Advent Hari Ketujuh BIC". Fixed.                                                                     |

## Part B — Divine Service

| #     | Current ID                   | Current Kind     | Artifact Name               | Base Type       | Weekly Placeholders | Notes                                                                                                                                                       |
| ----- | ---------------------------- | ---------------- | --------------------------- | --------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `ds-sequence`                | `text`           | **DivineServiceSequence**   | General         | —                   | Canvas: "Divine Service Sequence" + sequence list ("Opening Song", "Intercessory Prayer", etc). Fixed.                                                      |
| 2     | `theme-verse`                | `scripture`      | **BibleVerseContemplation** | TextPlaceholder | `reference`, `text` | Always TextPlaceholder. Its standing reference/text are declared defaults used when the weekly form does not override them.                                |
| 3     | `ds-opening-song-cue`        | `divider`        | **OpeningSongCue**          | General         | —                   | Reuse of same Artifact template as Part A.                                                                                                                  |
| 4–N   | `ds-opening-*`               | `song-*`         | *(SongSet child)*           | SongSet         | Hymn number         | Auto.                                                                                                                                                       |
| N+1   | `intercessory-prayer`        | `divider`        | **IntercessoryPrayer**      | General         | —                   | Canvas: "Intercessory Prayer". Fixed.                                                                                                                       |
| N+2–M | `intercessory-671-*`         | `song-lyric`     | *(SongSet child)*           | SongSet         | — (system hymn)     | Standing hymn SDAH 671. Title skipped. System-controlled, not weekly.                                                                                       |
| M+1   | `intercessory-prayer-during` | `divider`        | **IntercessoryDuring**      | General         | —                   | Canvas: "Now, dear Lord, as we pray..." (hymn lyrics). Fixed.                                                                                               |
| M+2–P | `intercessory-684-*`         | `song-lyric`     | *(SongSet child)*           | SongSet         | — (system hymn)     | Standing hymn SDAH 684. Title skipped.                                                                                                                      |
| P+1–Q | `ds-middle-*`                | `song-*`         | *(SongSet child)*           | SongSet         | Hymn number         | Auto. Mid-service hymns.                                                                                                                                    |
| Q+1   | `special-song`               | `divider`        | **SpecialSong**             | TextPlaceholder | `performer`         | Canvas: "Special Song" + text placeholder for performer name. Changes weekly.                                                                               |
| Q+2   | `sermon`                     | `sermon`         | **Sermon**                  | TextPlaceholder | `title`, `speaker`  | Canvas: "Sermon" + text placeholders for sermon title and speaker name. Changes weekly.                                                                     |
| Q+3   | `sermon-graphic`             | `image`          | **SermonFlyer**             | FullScreenImage | `imageUrl`          | Single full-bleed uploaded image. Changes weekly.                                                                                                           |
| Q+4   | `ds-closing-song-cue`        | `divider`        | **ClosingSongCue**          | General         | —                   | Reuse.                                                                                                                                                      |
| Q+5–R | `ds-closing-*`               | `song-*`         | *(SongSet child)*           | SongSet         | Hymn number         | Auto.                                                                                                                                                       |
| R+1   | `ds-closing-prayer`          | `closing-prayer` | **ClosingPrayer_DS**        | TextPlaceholder | `person`            | Canvas: "Closing Prayer" + text placeholder for person name. Changes weekly.                                                                                |
| R+2–S | `hope-*`                     | `song-lyric`     | *(SongSet child)*           | SongSet         | — (system hymn)     | Standing: "We Have This Hope". CAP-4 fixed formatting.                                                                                                      |

## Part C — Announcements & Standing Slides

| #   | Current ID             | Current Kind | Artifact Name           | Base Type      | Weekly Placeholders                                    | Notes                                                                                                                               |
| --- | ---------------------- | ------------ | ----------------------- | -------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `announcements`        | `text`       | **AnnouncementsHeader** | General        | —                                                      | Canvas: "Announcements", "Part C" (Conditional, only when flyers exist).                                                            |
| 2   | `welcome-repeat`       | `text`       | **Welcome**             | General        | —                                                      | Reuse of Welcome template.                                                                                                          |
| 3   | `offering-tithe`       | `body`       | **OfferingTithe**       | General        | —                                                      | Canvas: "Offering & Tithe", "ACCT-000000 Gereja Masehi Advent Hari Ketujuh BIC", "Bank Mandiri".                                  |
| 4   | `midweek-prayer`       | `body`       | **MidweekPrayer**       | General        | —                                                      | Canvas: title "Midweek Prayer Meeting" + details. Fixed.                                                                            |
| 5   | `fellowship-etiquette` | `body`       | **FellowshipEtiquette** | General        | —                                                      | Canvas: "(Return used plates, throw away trash, and finish your water.)"                                                            |
| 6   | `contact`              | `body`       | **Contact**             | General        | —                                                      | Canvas: "For more information", "presenter.example.church/wa-contact". Fixed.                                                                               |
| 7   | `family-youth`         | `family`     | **FamilyYouth**         | MixPlaceholder | `familyText`, `youthText`, `familyPhoto`, `youthPhoto` | Canvas: "Family of the Week", "Prayer Request:", "Youth of the Week". 2 text + 2 image placeholders. Photos on left, text on right. |
| 8–N | `flyer-*`              | `image`      | **AnnouncementFlyer**   | Announcement   | `imageUrl[]`                                           | List-driven full-screen images from announcement flyer list. Changes weekly.                                                        |
| N+1 | `thank-you`            | `text`       | **ThankYou**            | General        | —                                                      | Canvas: title "Thank You", subtitle "Bandung International Community". Fixed.                                                       |

---

## Summary by Base Type

| Base Type            | Artifact Count | Slide Count (typical) | Canvas? | Weekly Input? |
| -------------------- | :------------: | :-------------------: | :-----: | :-----------: |
| **General**          |      ~18       |          ~18          |    ✅    |       ❌       |
| **TextPlaceholder**  |       4        |           4           |    ✅    |    ✅ text     |
| **FullScreenImage**  |       1        |          0–1          |    ❌    |    ✅ image    |
| **ImagePlaceholder** |       0        |           0           |    ✅    |    ✅ image    |
| **MixPlaceholder**   |       1        |          0–1          |    ✅    |    ✅ both     |
| **SongSet**          |   ~6 groups    |      ~36 slides       |    ❌    |   ✅ hymn #    |
| **Announcement**     |    1 group     |          0–N          |    ❌    | ✅ image list  |

**Key insight:** The majority of Artifacts (~18) are **General** type — canvas-editable, fixed content, no weekly input. These are the slides that benefit most from the canvas editor: a non-developer can redesign them without coding.

---

## Historical Data Shape Sketch (Non-Normative)

Use `registry-contract.md` for implementation. This earlier sketch is retained only to show the evolution of the model.

```typescript
/** The 7 base types */
type ArtifactBaseType =
  | 'general'
  | 'text-placeholder'
  | 'fullscreen-image'
  | 'image-placeholder'
  | 'mix-placeholder'
  | 'song-set'
  | 'announcement';

/** A positioned element on the canvas */
interface CanvasElement {
  id: string;
  type: 'text' | 'image-placeholder' | 'shape' | 'image';
  x: number;        // % of slide width (0–100)
  y: number;        // % of slide height (0–100)
  w: number;        // % width
  h: number;        // % height
  zIndex?: number;  // Layering order (0 is back)
  
  // Text properties (when type = 'text')
  content?: string;          // Fixed text, or empty for placeholder
  placeholderKey?: string;   // e.g. 'reference', 'speaker'
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  
  // Image placeholder properties (when type = 'image-placeholder')
  // placeholderKey?: string;   // reused from above
  objectFit?: 'contain' | 'cover';
  
  // Static image properties (when type = 'image')
  src?: string;              // Path to bundled asset (e.g. '/assets/bg-welcome.jpg')
  opacity?: number;          // 0-1
  
  // Shape properties (when type = 'shape')
  fillColor?: string;        // Hex color
  // opacity?: number;       // reused from above
}

/** The persisted Artifact template definition */
interface ArtifactTemplate {
  id: string;                    // e.g. 'welcome', 'verse-reading'
  label: string;                 // Human label: 'Welcome', 'Verse Reading'
  baseType: ArtifactBaseType;
  backgroundColor: string;       // Hex color for the slide background
  backgroundImage?: string;      // Optional full-bleed background image path
  elements: CanvasElement[];     // Positioned elements on the canvas
}

/** Runtime instance — template + resolved placeholders */
interface ArtifactInstance {
  templateId: string;
  label: string;
  resolvedValues: Record<string, string>;  // placeholderKey → value
  children?: ArtifactInstance[];            // SongSet: title + lyrics
}
```

This is a sketch; the exact shape will be refined during story implementation.
