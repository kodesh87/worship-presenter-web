# Placeholder Catalog (central, predefined)

Companion to `SPEC-artifact-registry-authoring`.

## Model

- There is one **Placeholder Catalog**: a code-defined, versioned list of allowed placeholder keys (and value types: text, text[], image, image[]).
- Any **General** row may **insert** zero or more catalog placeholders as canvas elements. Only General — free canvas is General's alone, and a placeholder is *an element inserted onto a General*, never a kind of its own (`AD-22`, `AD-19`). A SongSet or Announcement row has no insert affordance; its placeholder set is server-defined and the validator refuses any change to it on every write path (`AD-15`).
- Each inserted instance has local style (position, size, font color/size/style). Binding is by catalog key, so the same key may appear on several Generals with different styling.
- The catalog is **one server-side module holding both the admitted key and its resolver** from the parsed rundown — so a key cannot be admitted without something able to fill it, and the admitted set is a property of the registry rather than of one client (`AD-19`).
- Weekly **values** are supplied at plan/hydration time from worship-service fields that map to those keys.
- Operators cannot type a free-form new key in the UI. Extending the catalog is a development task (accepted).

## Key spelling is chosen once

The spelling below is **intent-level**, and the deferral it used to carry ("exact key names follow implementation naming") is retired. Under `AD-19` the admitted key set is server-side vocabulary enforced on every write path, and the spelling is **persisted into saved layouts**. So:

- The spelling is decided **once**, in **Story 20.5**, for both the admitted key and its resolver in the same module.
- After that it is a persisted binding key. Changing it is a **versioned data migration** under `AD-18` / `AD-21`, not a rename.
- The table below is therefore the **coverage floor** for that one-time choice — what the catalog must be able to fill — not licence for each surface to name keys its own way.

One trap worth naming, because a grep looks like confirmation: nothing named `ALLOWED_PLACEHOLDER_KEYS` exists for this purpose today. The shipped constant of that name is an unrelated object-key whitelist.

## Initial catalog (v1 intent)

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

**Not catalog keys.** SongSet expansion values (hymn number, song title, lyric pages) and Announcement image slots are **system expansion**, not insertable placeholders — a SongSet row expands from its slot's hymnal binding and an Announcement row from the master list. They were listed here while the catalog was a UI list of everything the planner filled; under `AD-19` the admitted set is enforced, and admitting a key that only a General may insert while no General can meaningfully carry it is the "key nothing can fill" hazard from the other direction.

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
- Inserting a catalog placeholder onto a SongSet or Announcement row.
