# Placeholder Catalog (central, predefined)

Companion to `SPEC-artifact-registry-authoring`.

## Model

- There is one **Placeholder Catalog**: a code-defined, versioned list of allowed placeholder keys (and value types: text, text[], image, image[]).
- Any ordered-registry slide may **insert** zero or more catalog placeholders as canvas elements.
- Each inserted instance has local style (position, size, font color/size/style). Binding is by catalog key.
- Weekly **values** are supplied at plan/hydration time from worship-service fields that map to those keys.
- Operators cannot type a free-form new key in the UI. Extending the catalog is a development task (accepted).

## Initial catalog (v1 intent)

Keys align with fields already resolved by the worship planner / form today. Exact key names follow implementation naming, but the set must cover at least:

| Catalog key (intent) | Typical weekly source |
| --- | --- |
| `serviceDate` | Service date |
| `themeVerse.reference` / `themeVerse.text` | Theme verse |
| `verseReading.reference` / `verseReading.text` | Verse reading |
| `sermon.speaker` / `sermon.title` | Sermon |
| `specialSong` | Special song |
| `closingPrayerPerson` | Closing prayer person |
| `familyPrayerRequest` / `youthPrayerRequest` | Family & youth prayer text |
| `familyPhoto` / `youthPhoto` / `sermonGraphic` | Media uploads |
| `hymnNumber` / `songTitle` / lyric slots | SongSet expansion (system) |
| Announcement image slots | Announcement list (system) |

Standing General slides may use **no** placeholders (fixed canvas text only).

## Insert UX

1. Edit a **General** slide canvas (SongSet / Announcement have no placeholder insert).
2. Choose **Insert placeholder** → pick from catalog.
3. Position/resize/style the instance.
4. Save template.

### Worked examples

| Slide intent | Kind | Placeholders inserted |
| --- | --- | --- |
| Sermon flyer / graphic | General | `sermonGraphic` (image), optionally sized full-bleed on canvas |
| Family & Youth of the Week | General | `familyPhoto`, `youthPhoto`, `familyPrayerRequest`, `youthPrayerRequest` |
| Verse reading | General | `verseReading.reference`, `verseReading.text` |
| Welcome / sequence / cues | General | none, or `serviceDate` as needed |

Hydration fails closed for required bindings according to catalog + slide rules.

## Explicitly out of catalog UI

- Creating a new key that code does not know how to fill from worship intake.
- Binding to arbitrary JSON paths invented at runtime.
