---
lens: 'finalize_reviewers[1] — construct two units one level down that obey every AD to the letter yet still build incompatibly'
target: ARCHITECTURE-SPINE.md (AD-1..AD-22, post-trim)
run: 2026-07-30, Reviewer Gate under the Update intent
mode: sequential (subagents unauthorized this session)
---

# Adversarial two-units — post-trim spine

Four pairs found. Two are HIGH: in both, the spine's own words *permit* the divergence rather than
merely failing to mention it, which is the worse failure — an implementer who reads carefully still
gets it wrong. Two earlier pairs from the pre-trim runs are re-checked and now closed.

## Pair A — HIGH · The administrator's font size and the developer's layout are the same bytes

- **Unit 1** implements the SongSet configuration surface by writing the administrator's chosen
  `fontSize` and `backgroundImage` straight into the layout JSON's element `style`, where the
  renderer already reads them. Simple, and `AD-22` says the surface sets font style and size.
- **Unit 2** stores them as administrator overrides beside the layout and merges at hydration,
  because `AD-22` also says layout composition is developer-owned.

Both obey `AD-22`. The divergence bites later, not now: `AD-21` says a developer's layout change
reaches a deployed database as a data migration, and `AD-22` says that migration must not discard the
administrator's background and font choices. Against Unit 2 the migration is straightforward. Against
Unit 1 it is **impossible in general** — the administrator's `fontSize: 52` and the developer's
`fontSize: 46.67` are the same field, with nothing recording which one a human chose. `AD-11`'s Reset
restores the whole shipped template, so there is no second copy to recover from either.

**Close it with:** a clause requiring administrator-configured values to remain distinguishable from
developer-authored layout. The storage shape can stay a story-level call — what cannot stay open is
whether the distinction exists at all.

## Pair B — HIGH · Does a value migration rewrite service snapshots? Both answers are legal

- **Unit 1** migrates `artifact_templates` only. Old service snapshots keep the retired `base_type`
  values and some become unrenderable — which `AD-18` explicitly tolerates and `AD-16` designed for.
- **Unit 2** migrates the snapshots too, so no past service breaks. It reads `AD-18`'s *"not obliged
  to keep existing service snapshots renderable"* as the permission it literally is, and considers
  keeping them renderable a courtesy.

`AD-16` should decide this — structure reaches an existing service **only** through Sync Artifact, so
a migration that rewrites snapshots is a second structural channel — but `AD-18` never draws the
inference, and a reader who starts at `AD-18` has no reason to.

**Close it with:** replace the licence with a prohibition. A migration operates on the live registry
and does not rewrite service snapshots.

## Pair C — MEDIUM · Two background images, two different notions of a valid image reference

- **Unit 1** lets the SongSet configuration surface take an `/api/uploads/<32-hex>` ref, resolved
  through the shared helper.
- **Unit 2** lets it take any `https://` URL, because `AD-8` enumerates announcements, hub uploads,
  registry `/assets/` refs and PPTX embedding, and names *"the canvas editor"* as the surface that
  must not add a second resolver — and this surface is, by `AD-22`'s own insistence, **not** the
  canvas editor.

`AD-15` catches the shape of a write but `AD-8` is the decision about reference vocabulary, and
`AD-22` created a surface outside its enumeration on the same day.

**Close it with:** cite `AD-8` in `AD-22`'s rule for the two background images.

## Pair D — MEDIUM · One `settings` table, two markers, no stated relationship

- **Unit 1** gates the seeder on a dedicated `artifact_seed_done` marker (`AD-17`) and keeps the data
  version counter (`AD-21`) independent.
- **Unit 2** notices that a seeded database is by definition at data version 1 and gates seeding on
  `data_version >= 1`, deleting the separate marker as redundant.

Unit 2 is not careless — it is a reasonable reading of two rules that both put a control value in
`settings` and never mention each other. It breaks the first time a data migration bumps the counter
on a database that was never seeded, or the first time someone needs to know whether bootstrap ran
independently of which version the data is at. `AD-9` names this bootstrap path as shared ground, so
ambiguity there is expensive.

**Close it with:** one clause stating the two are distinct and neither substitutes for the other.

## Re-checked and now closed

- **Pre-trim Pair A (= the old H2).** One unit moves `skipTitle` into registry data; another adds a
  fourth literal in `slide-plan.ts`. **Closed by `AD-20`** — every slide originates from an ordered
  registry entry, and `skipTitle` is removed rather than relocated, so there is no flag for a fourth
  literal to be.
- **Canvas editor opens for a SongSet row or does not.** **Closed by `AD-22`** — free canvas is
  General's alone, and a `songset-*` row's placeholder set and slot binding are server-defined.

## Checked and found sound

- **Where the data-version transition code lives** (a switch on the startup path versus a versioned
  migration directory) cannot diverge: `AD-9` prohibits the directory and `AD-21` restates the
  prohibition.
- **Whether a renderer may read a snapshot** cannot diverge: `AD-12`, `AD-16` and both structural
  diagrams state it three times, and the second diagram draws the forbidden edges explicitly.
- **Slot identity after a reorder or rename** cannot diverge: `AD-19` fixes the identity as the
  binding key and forbids administrator editing, and states the deleted-row case as inert rather than
  leaving it to be discovered.
