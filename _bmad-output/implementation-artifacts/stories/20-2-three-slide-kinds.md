---
baseline_commit: 553a4c5
---

# Story 20.2: Three Slide Kinds

Status: review

## Story

As an administrator,
I want every registry entry to be **General**, **SongSet** or **Announcement** with an
editable label shown as `[kind] label`,
so that the ordered list reads as a deck instead of as seven internal type names.

## Acceptance Criteria

Every criterion cites the clause it answers to. Where a criterion states a number or a
file:line, that claim is checkable against the repository at `553a4c5`.

1. **The kind vocabulary is exactly three, and the retired four are gone rather than renamed.**
   **Given** the change set, **When** `src/` and `data/` are searched, **Then**
   `ARTIFACT_BASE_TYPES` (`src/lib/registry/types.ts:1-9`) holds exactly
   `['general', 'song-set', 'announcement']`, and the strings `text-placeholder`,
   `image-placeholder`, `mix-placeholder` and `fullscreen-image` occur **zero times as a
   template base type** anywhere in `src/`, `data/` or `tests/`. A test anchored on the
   absence — not on a spelling of the replacement — asserts it.
   **One near-identical name must survive and must not be swept up:** `CanvasElementType`
   (`types.ts:28-32`) includes the *element* type `'image-placeholder'`, which is a
   different vocabulary with its own consumers (`hydrate.ts:122`, `:161`, `pptx.ts:355`,
   `ArtifactSlide.tsx:193`). It is untouched by this story.
   [SPEC *Constraints*: *"Slide kinds are exactly three… Epic 16's TextPlaceholder /
   ImagePlaceholder / MixPlaceholder / FullScreenImage are retired as distinct kinds"*;
   AD-19 *Rule — the kind vocabulary*; `slide-kinds.md` *Retired as distinct kinds*]

2. **The seed is re-authored onto the three kinds, and `fullscreen-image` becomes `general` — not `announcement`.**
   **Given** the committed 38-row seed, **When** it is bootstrapped, **Then** every row
   carries one of the three kinds, distributed exactly as:
   **`general` 32** (24 today + 6 `text-placeholder` + 1 `mix-placeholder` + 1
   `fullscreen-image`), **`song-set` 5** (unchanged), **`announcement` 1** (unchanged).
   No row is added, removed, renamed, reordered or repositioned; the `position` column and
   `schemaVersion: 1` are untouched.
   `sermon-flyer` becomes **`general`**. **The mapping table under *Seven base types collapse
   to three kinds* (`epics.md:429-434`, the row itself at `:432`) says
   `fullscreen-image → Announcement` and is
   wrong** — the SPEC folder and the spine both
   retire all four types onto General, and the functional check settles it: `sermon-flyer`
   is filled from the service's own sermon graphic (`slide-plan.ts:551-560`), not from
   `ctx.flyers`, so making it an `announcement` would expand one slide into N announcement
   images and change the deck. See *Dev Notes → The one place the epic and the SPEC
   disagree*, and the *Gate* for who corrects `epics.md`.
   [AD-19: the four types are *"gone rather than renamed: a placeholder stops being a kind
   and becomes an element inserted onto a General"*; `slide-kinds.md` *Retired as distinct
   kinds*: *"their jobs move onto **General + catalog placeholders**"*;
   `placeholder-catalog.md` *Worked examples*: *"Sermon flyer / graphic | General |
   `sermonGraphic`"*; CAP-4 *success*; AD-22 (an `announcement` row is bound to the
   Announcements master set)]

3. **The validator enforces three kinds, and a General may now carry placeholders.**
   **Given** `enforceBaseTypeRules` (`src/lib/registry/validate.ts:352-443`), **When** the
   change set lands, **Then** its `switch` has exactly three cases plus the `default:`
   closed-set throw, and the `general` case **no longer refuses placeholders**
   (`validate.ts:366-368`, *"General templates cannot have placeholders"*, is deleted).
   The `song-set` and `announcement` cases keep their current requirements verbatim.
   Without this deletion the eight rows AC-2 moves onto `general` cannot validate, and
   AD-15 makes the bootstrap validate like every other write path — so the seeder itself
   would throw on first boot.
   **This story admits no catalog key and fixes no key spelling.** Each row keeps the
   per-row placeholder keys it has today (`date`, `reference`, `text`, `imageUrl`,
   `familyText`, `youthText`, `familyPhoto`, `youthPhoto`, …) byte-for-byte. Deciding the
   admitted set and its resolver is Story 20.5's, once, per `placeholder-catalog.md`
   *Key spelling is chosen once*.
   [CAP-4; AD-22 (*"`general` is free canvas: the administrator composes it from anything,
   including Placeholder Catalog keys"*); AD-15 (*"**Every** write into the registry… the
   startup seeder… alike"*)]

4. **The entry key lives in the existing `base_type` column, and no discriminator column is added.**
   **Given** the change set, **When** the schema is inspected, **Then**
   `artifact_templates` has gained **no** column — no `slot`, no `songset_slot`, no `kind`
   — and the row's kind is read from the value already persisted in `base_type` /
   `payload.baseType`. Any code that needs the *kind* derives it through **one** exported
   pure function over the entry key rather than comparing the raw string in more than one
   place. A test asserts the DDL at `src/lib/db/index.ts:438-446` grew no column.
   This is the schema call the spine defers to this story, and it is answered **for Story
   20.7 as well as for this one**: when 20.7 introduces AD-19's four `songset-*` slot
   identities they go in **this same column**, replacing `song-set` as an *entry* value.
   The story's own vocabulary is therefore the three **kind** values, which today are also
   the three entry keys; the entry set widens to AD-19's six in Story 20.7, and the
   function added here is what makes that a one-line table change.
   [Spine *Deferred*: *"Where a SongSet slot identity is persisted — in the `base_type`
   column itself, or in a discriminator beside it — is a Story 20.2 / 20.7 schema call"*;
   AD-19: *"six keys over three kinds"*, *"`song-set` names the kind, never an entry"*;
   AD-18: *"a value persisted in more than one place has exactly one authoritative copy"* —
   the payload is authoritative, the column is its derived index maintained by the same write;
   AD-9 (no schema change outside the startup DDL path, and none is needed here)]

5. **`READ_ONLY_BASE_TYPES` and `EDITABLE_BASE_TYPES` collapse into one per-kind canvas-authority predicate.**
   **Given** `src/lib/registry/types.ts`, **When** the change set lands, **Then**
   `EDITABLE_BASE_TYPES` (`types.ts:19-24`) is **deleted** — it has **zero call sites** in
   the tree today, and after the collapse it would be the one-element complement of its
   neighbour: two constants for one fact. `READ_ONLY_BASE_TYPES` is **replaced** by a
   single positive predicate stating AD-22's authority — *canvas-authorable is exactly
   `general`* — and its four consumers move to it verbatim in behaviour
   (`ArtifactEditor.tsx:113`, `:842`, `store.ts:71` (`editable` on the summary),
   `store.ts:233`).
   **Exactly one row changes behaviour and it is deliberate:** `sermon-flyer`, now a
   General, becomes canvas-editable, where `fullscreen-image` made it read-only. Every
   other row keeps the authority it has today — the six `text-placeholder` rows and
   `family-youth` were already editable, and `song-set` / `announcement` rows stay
   canvas-refused.
   **What this story does *not* do, recorded so the unchanged refusal is not read as an
   oversight:** it does not open a **label** write on a `song-set` or `announcement` row.
   The rename verb is CAP-2's and Story 20.3's; the AD-22 bounded configuration surface is
   Story 20.7's. This story delivers the label as a *model and display* fact (AC-6, AC-7),
   not as a new write path.
   [Epic 20: *"`READ_ONLY_BASE_TYPES` / `EDITABLE_BASE_TYPES` … collapse with them:
   *General* becomes the only canvas-authorable kind"*; AD-22 *Rule*; spine *Deferred* on
   `READ_ONLY_BASE_TYPES`; CAP-2 (rename is 20.3's)]

6. **The row's label reaches the Presenter badge, because today it cannot.**
   **Given** a registry row whose `label` is changed, **When** a plan is built and the
   Presenter or Live Preview renders it, **Then** the new label is what the operator reads.
   **This is false today and is the story's load-bearing repair:** `TEMPLATE_LABELS`
   (`src/lib/artifacts/preview-model.ts:48-82`) is a hardcoded template-id → display map
   consulted **before** the row's own label (`previewLabel`, `:119-130`), and it covers
   **33 of the 38 seeded ids** — so a rename changes nothing on any operator surface, and
   CAP-5's success clause is structurally unreachable. The five ids it does **not** cover
   are exactly the five `song-set` rows, which return earlier from the `baseType` branch and
   never reach the map at all.
   Therefore, in one change set: `TEMPLATE_LABELS` is **deleted**, `previewLabel` reads
   `instance.label`, and the **seed's `label` field is re-authored into the operator
   vocabulary that map holds today**, so no badge regresses. The mapping is
   `TEMPLATE_LABELS` itself — copy it into the seed, id for id.
   Two neighbours in the same module are **kept** and must not be swept up:
   `SONG_SET_LABELS` (`:85-89`), returned by the `baseType === 'song-set'` branch at
   `:124-126`, names the **page role** by layout key (*Song Title* / *Song Lyric*), not the
   row; and a SongSet group's own badge is the **song's** title (`slide-plan.ts:181`,
   `label: hymn.title`) — both are correct and neither is the registry label. The
   `humanize` fallback (`:104`) stays, and becomes the path a future administrator-authored
   row takes.
   **The write path this is demonstrated through, stated because no rename *UI* exists until
   Story 20.3:** a General row's `label` is already writable today through the admin
   `PUT /api/admin/artifacts/[id]` — `updateArtifactTemplate` writes the column
   (`store.ts:251`, `:266`), and the read-only refusal at `:233` tests
   `READ_ONLY_BASE_TYPES`, which **today holds three values** — `fullscreen-image`, `song-set`,
   `announcement` (`types.ts:13-17`). So every row that is `general` today already accepts a
   label write, and after AC-5 that set becomes exactly *not-`general`*: the one row whose
   label-writability changes is `sermon-flyer`, which gains it along with its canvas
   (AC-5's named single behaviour delta).
   So CAP-5's success clause is demonstrable in *this* story against the
   shipped API, and AC-8's test drives it that way. What Story 20.3 adds is the operator-facing
   verb and its UI, not the ability to change a label.
   [CAP-5 *success*: *"Renaming a General sequence slide's label updates Presenter
   badges"*; `slide-kinds.md` *Badge display*: *"Presenter / lists show the row's kind plus
   its editable **label**"*; `EXPERIENCE.md` *Voice and Tone* (system vocabulary reaches no
   human surface)]

7. **Lists show `[kind] label`, and the chip names the kind — never the entry key.**
   **Given** the shipped registry surface at `/admin/artifacts`, **When** an administrator
   reads the template list, **Then** each row renders its **label** as the primary text and
   its **kind** as a chip reading `[general]`, `[song-set]` or `[announcement]`. The same
   applies to the detail header (`ArtifactEditor.tsx:951`) and the read-only banner
   (`:996`), both of which print the raw base type today, and to the sidebar row
   (`:932-936`), which prints `text-placeholder` today.
   **No surface may print an entry key.** The chip vocabulary is the kind's, so when Story
   20.7 introduces `songset-bt-open` the chip still reads `[song-set]` and the raw
   `songset-*` spelling reaches no human surface — a rule this story ships in advance
   because the chip is built here.
   **Scope boundary:** this is the chip on the surface that exists. The *ordered registry
   list* with add / delete / rename / reorder is Story 20.3's and inherits this chip;
   `EXPERIENCE.md`'s *Row display* owner note is corrected accordingly (AC-13).
   [CAP-5: *"lists show `[kind] label`"*; `EXPERIENCE.md` *Row display* (2026-07-31): *"A
   row's chip names its **kind** … never the entry key"*; AD-19 (slot keys are server-owned
   binding vocabulary)]

8. **What "afterward" means today is stated in the story, not left to Story 20.8.**
   **Given** that no service-bound snapshot exists at `553a4c5`, **When** an administrator
   renames a row's label, **Then** the new label reaches **every** service — existing ones
   included — at that service's **next plan build** (Live Preview, Presenter, slideshow,
   PPTX generation), because every plan is built from the live registry
   (`loadRegistrySnapshot`, `src/lib/artifacts/registry-snapshot.ts`) and there is no clone
   and no freeze. That is AD-14's global-and-immediate behaviour, which still ships.
   The change set states this in one sentence where a reader will find it, together with
   what replaces it: once Story 20.8 lands, the same rename reaches only services created
   or **Sync Artifact**-ed afterward, and an already-created service keeps its snapshot's
   label until then.
   **This story builds no part of that**: no snapshot table, no clone, no Sync verb, no
   staleness signal. A test pins the transitional behaviour — rename a row, rebuild an
   existing service's plan, assert the new label — so the day 20.8 inverts it, the
   inversion is visible rather than silent.
   [`epics.md:449`: *"which is only meaningful once 20.8 exists, so until then the story's
   own AC must say what 'afterward' means"*; AD-16 (*"A service created before this model
   ships has no snapshot and renders from the live registry until its first Sync"*); AD-14
   (the surviving global clause until AD-16 lands)]

9. **The migration is a total replacement, and a developer database is reset rather than migrated.**
   **Given** AD-4's record that no deployment exists (unchanged at `553a4c5`), **When**
   this story lands, **Then** the collapse ships as a **total replacement** with no
   backward compatibility and no per-row mapping over live rows, and it **folds into data
   version 1** — `CURRENT_DATA_VERSION` stays `1` and no new transition number is minted,
   because version 1 has never been released and AD-21 compacts unreleased transitions
   rather than accumulating them.
   A developer database bootstrapped before this story holds 38 rows carrying retired base
   types that the new validator rejects; left alone, every row fails closed and the deck
   comes out empty. So the change set adds **one explicit, announced, one-time reset
   transition** on the `getDb` startup path, in the **migrations** slot (before the
   bootstrap, per AD-21's fixed order): it detects a registry row whose `base_type` is not
   one of the three, and in a single transaction clears `artifact_templates` **and** the
   AD-17 bootstrap marker, so the bootstrap in the same boot re-seeds from the re-authored
   seed. It logs what it did and why, at the moment it fires — the shape
   `repairPreCounterArtifactRegistry` already established (`db/index.ts:300-318`).
   Its trigger is that content predicate, **not** the version counter, because the counter
   does not move; it is therefore self-limiting and a permanent no-op once no such row can
   exist. The change set states, in one sentence, that this licence **expires at first
   deploy**, after which the same change needs a real migration over live
   `artifact_templates` rows plus every service snapshot.
   [AD-18: *"Until first deploy no production rows exist, so Epic 20's
   seven-`base_type`-to-three-kind collapse ships as a **total replacement** … folding into
   production data version 1"*; AD-21: *"an unreleased transition is not yet history and may
   be rewritten… developer databases are **reset** to the compacted version"* and *"the
   order on the `getDb` path is fixed"*; AD-4; AD-17 (the marker is what makes a re-bootstrap
   legal); AD-9 (no framework)]

10. **A row's kind is server-owned on every write path.**
    **Given** any write into the registry, **When** it would change a persisted row's
    `baseType`, **Then** it is refused with a named error, and the refusal does not depend
    on the shipped seed being consulted. `assertStableAgainstSeed`'s existing check
    (`store.ts:134-136`, *"baseType cannot be changed"*) is **kept**; the change set adds
    the same refusal against the row's **currently persisted** state, so a row the seed
    does not know is covered too. Prove the guard reacts: submit a PUT that flips a row's
    kind and confirm it is refused and the row is unchanged.
    **Not in scope and explicitly left open:** AD-17's per-row *originated from bootstrap or
    from an administrator* record, which `assertStableAgainstSeed` needs before a created
    row can exist. No create verb exists at `553a4c5`, so no such row can exist yet; the
    spine files that against the create verb, which is Story 20.3's.
    [AD-19: *"Every **cross-boundary key** is a server-owned value no authoring surface may
    edit: a row's kind, its SongSet slot identity, and every Placeholder Catalog key"*;
    `authoring-boundaries.md` *What the administrator may not edit at all*; AD-15; AD-17
    (the per-row origin gap and its owner)]

11. **Sequence and visible content are otherwise unchanged for identical inputs.**
    **Given** the shipped seed and an unchanged rundown fixture, **When** the plan is built,
    **Then** the slide sequence is byte-for-byte today's, and the rendered content of every
    slide is unchanged. Exactly **two** operator-visible deltas are permitted and both are
    named here; a third is a defect:
    (a) operator-facing **labels now come from the row** rather than from `TEMPLATE_LABELS`,
    and because the seed labels are re-authored to that same map the rendered strings are
    identical (AC-6);
    (b) `sermon-flyer` becomes canvas-editable (AC-5).
    **One regression to prevent rather than discover:** `IMAGE_BASE_TYPES`
    (`preview-model.ts:98-101`) gives `fullscreen-image` and `announcement` the `image`
    badge tone. With `fullscreen-image` gone, `sermon-flyer` would silently drop to the
    `default` tone. Preserve today's tone using the module's own precedent for
    *content-kind regardless of base type* — `SCRIPTURE_TEMPLATE_IDS` (`:91-95`) — and note
    in the code that Story 20.5 may replace both with a catalog-key check.
    [`spec-slide-artifact-model` *Constraints*: *"the resulting sequence and visible content
    must match the current behavior for identical inputs"*; Story 20.1 AC-3 (the precedent
    for enumerating deltas rather than relaxing the test)]

12. **Public-repository rules hold, and the guard is not weakened.**
    **Given** the change set, **When** `tests/public-repo-guard.test.mjs` and
    `tests/asset-map-evidence.test.mjs` run, **Then** both are green with no change that
    loosens either. The re-authored seed labels are chrome vocabulary that is **already
    committed** in `preview-model.ts` — no congregation name, prayer request, contact,
    photograph or payment detail enters a tracked file, no new asset is added, and no
    `data/local/`, `data/uploads/`, `slides*/` or deck material is staged.
    [`AGENTS.md` *Never commit*, *Commit / push audit*; `.constitution/public-repository.md`;
    SPEC *Constraints*: *"Public-repository rules unchanged"*]

13. **The sibling artifacts this story falsifies are corrected in the same change set.**
    **Given** the four-families rule, **When** this story lands, **Then**:
    - `EXPERIENCE.md` → *Inside `/admin/artifacts`*: the *Row display* paragraph's owner note
      (*"Owners: Story 20.3 (list chip)"*) is corrected to record that the chip ships on the
      shipped list here and that Story 20.3's ordered list inherits it. The *Free canvas* row's
      status cell names `READ_ONLY_BASE_TYPES`, a constant AC-5 replaces: its **behavioural**
      claim (a `song-set` or `announcement` row refuses every administrator edit) stays true, so
      repoint the name and leave the claim. Its *General only* half becomes structurally true and
      the cell says so; *Owners: Story 20.4, Story 20.5* stand for the canvas and the catalog.
      No IA row is added, renamed or removed.
    - `slide-kinds.md` → *Badge display* (`:67`) carries **the same owner annotation**
      (*"Owner: Story 20.3."*) for the chip, and leaving one of two duplicated notes stale is
      how they diverge. Correct it the same way, in the same change set. **Scope: the owner
      sentence only.** The decision it annotates — the chip names the kind, never the entry key —
      is contract and is not touched; this story implements it rather than revising it.
    - `DESIGN.md` is updated **only if** the chip introduces a reusable component or a visual
      delta. Prefer token-painted hub chrome (`bg-muted` / `text-muted-foreground` / `border`)
      over a new hue: that adds no token and needs no `DESIGN.md` edit. There is no
      `components/ui/badge.tsx` in the tree — if one is created, it is a component with a
      visual delta and `DESIGN.md` moves with it. Small text carries the **4.5:1** floor;
      `DESIGN.md` records three badge pairs that shipped below it.
    - `ARCHITECTURE-SPINE.md` is **not** edited here. See *Gate*.
    [`AGENTS.md` *four artifact families*; `project-context.md` *Development Workflow Rules*;
    `DESIGN.md` *The `dark:` overrides that went live with the theme control*]

14. **Every guard added here is proved to react, every moved guard is inverted rather than deleted, and every new suite is registered.**
    **Given** any new or changed `tests/*.test.mjs`, **When** the change set is finalised,
    **Then** the file is listed in the explicit `package.json` `scripts.test` command in the
    **same** change set, and each guard has been proved to react by injecting the defect it
    claims to catch and confirming the suite goes red before reverting the injection.
    **The proof must be auditable, not asserted.** For each guard, the story's *Dev Agent Record →
    Debug Log References* records the defect that was injected, the suite that went red, and the
    failing assertion's message — so a reviewer can re-run the injection rather than take the
    claim on trust. A guard whose proof is recorded only as *"verified"* has not met this AC.
    **One shipped guard inverts here and must not be deleted:**
    `tests/artifact-preview.test.mjs:56-78` asserts `seedLabels.size > 0` — literally
    *"seed registry should still use PascalCase labels"* — and that no such label leaks into
    a preview entry. AC-6 removes every PascalCase seed label, so the first half becomes
    false while the guard's **intent** (system vocabulary reaches no operator surface) gets
    stronger. Invert it: assert that **no** seed label matches the PascalCase/underscore
    pattern, and keep the leak assertion over preview entries unchanged.
    [*Consistency Conventions → Testing*; `project-context.md`: *"an unregistered test file
    never runs… and nothing detects the omission"*, *"when you write or change a guard, prove
    it reacts"*; Story 20.1 AC-7 (the invert-don't-delete precedent)]

## Tasks / Subtasks

- [x] **Collapse the type vocabulary and its authority sets** (AC: 1, 4, 5)
  - [x] `src/lib/registry/types.ts`: `ARTIFACT_BASE_TYPES` → three values. Delete
        `EDITABLE_BASE_TYPES` (zero call sites — confirm with a grep before deleting).
        Replace `READ_ONLY_BASE_TYPES` with the positive canvas-authority predicate and
        export the entry-key → kind function AC-4 requires.
  - [x] Do **not** touch `CanvasElementType`'s `'image-placeholder'` member.
  - [x] Move all four `READ_ONLY_BASE_TYPES` consumers (`ArtifactEditor.tsx:113`, `:842`,
        `store.ts:71`, `store.ts:233`) to the new predicate with identical behaviour.
  - [x] Add no column to `artifact_templates`; assert the DDL
        (`src/lib/db/index.ts:438-446`) is unchanged in shape.

- [x] **Collapse the validator** (AC: 3)
  - [x] `src/lib/registry/validate.ts`: `enforceBaseTypeRules` → three cases plus the
        `default:` throw. Delete the *"General templates cannot have placeholders"* branch
        (`:366-368`).
  - [x] Keep the `song-set` and `announcement` requirements verbatim.
  - [x] Change no placeholder key and add no catalog vocabulary (Story 20.5 owns that).

- [x] **Re-author the seed** (AC: 2, 6, 11, 12)
  - [x] `data/default-registry.json`: rewrite `baseType` on the 8 moving rows
        (6 `text-placeholder`, `family-youth`, `sermon-flyer`) to `general`. Leave the 5
        `song-set` rows and `announcement-flyer` alone.
  - [x] Rewrite every row's `label` to the operator vocabulary in `TEMPLATE_LABELS`
        (`preview-model.ts:48-82`), id for id. The map covers **33** of the 38 ids, and
        **six** pairs share a string — duplicate labels are legal and all six must survive
        the copy:
        `welcome` / `welcome-repeat` → *Welcome*;
        `bt-opening-song-cue` / `ds-opening-song-cue` → *Opening Song*;
        `bt-closing-song-cue` / `ds-closing-song-cue` → *Closing Song*;
        `closing-prayer` / `closing-prayer-ds` → *Closing Prayer*;
        `intercessory-prayer` / `intercessory-prayer-during` → *Intercessory Prayer*;
        `hope-lyric-1` / `hope-lyric-2` → *We Have This Hope*.
        A uniqueness assertion over seed labels would therefore be wrong: do not add one.
  - [x] The **5** ids the map does not cover are exactly the five `song-set` rows
        (`bt-opening-song`, `bt-closing-song`, `ds-opening-song`, `song-set`,
        `ds-closing-song`). They never take the map's path, so their labels do not affect the
        Presenter — but they are what the AC-7 chip shows and what tells the four rows apart
        (`slide-kinds.md` *Badge display*), so give each a worship-vocabulary label rather than
        leaving `SongSet_BTOpening`. Story 20.7 renames them again when the slot identities land.
  - [x] Do not add, remove, reorder or re-position any row; do not touch `position` or
        `schemaVersion`.
  - [x] Confirm every asset reference still resolves to a committed file under `public/`.

- [x] **Make the label reach the operator** (AC: 6, 11)
  - [x] `src/lib/artifacts/preview-model.ts`: delete `TEMPLATE_LABELS`; `previewLabel` reads
        `instance.label` with `humanize` as the fallback.
  - [x] Keep `SONG_SET_LABELS` and the `baseType === 'song-set'` branch (`:124-126`)
        untouched; keep `slide-plan.ts:181`'s `label: hymn.title` group label untouched.
  - [x] Preserve `sermon-flyer`'s `image` badge tone via the `SCRIPTURE_TEMPLATE_IDS`
        precedent (`:92-95`); note Story 20.5 as the future owner in the code.

- [x] **Ship the `[kind] label` chip** (AC: 7, 13)
  - [x] `src/components/admin/ArtifactEditor.tsx`: sidebar row (`:932-936`), detail header
        (`:951`), read-only banner (`:996`) — label as primary text, kind as the chip.
  - [x] Use existing tokens; do not introduce a new hue or a new `components/ui` component
        unless `DESIGN.md` moves in the same change set.
  - [x] Correct `EXPERIENCE.md`'s *Row display* owner note.

- [x] **Land the reset transition** (AC: 9)
  - [x] Add the one-time reset to `src/lib/db/index.ts` in the **migrations** slot, after the
        startup DDL and before the bootstrap. Do not reorder the four `getDb` steps — three
        tests assert that order in both directions: `tests/registry-reseed.test.mjs:319`
        (wrong order fails closed), `:363` (right order compacts correctly) and `:386` (the
        real `getDb()` wires the correct order). `:304` is a **different** guard — failed
        bootstrap rolls back both settings stamps — and must also stay green.
  - [x] Trigger on the content predicate (a row whose `base_type` is not one of the three),
        not on the version counter. `CURRENT_DATA_VERSION` stays `1`.
  - [x] Clear rows **and** the AD-17 bootstrap marker in one transaction; take
        `BEGIN IMMEDIATE`, not the default deferred begin, for the reason `seed.ts:121`
        states (maintenance scripts open the same file, and a deferred transaction upgrading
        to a write lock fails with `SQLITE_BUSY_SNAPSHOT`, which `busy_timeout` does not retry).
  - [x] Log at the moment it fires, stating what was reset, that AD-4/AD-18 is the licence,
        and that the licence expires at first deploy.
  - [x] Write the dev-facing note about a stale `data/local/default-registry.json` — see
        *Dev Notes → The private seed override is a second file this breaks*.

- [x] **Close the kind against writes** (AC: 10)
  - [x] Keep `store.ts:134-136`; add the same refusal against the currently persisted row.
  - [x] Prove it reacts with a PUT that flips a kind.

- [x] **Move the tests that this moves** (AC: 1, 6, 11, 14)
  - [x] Invert `tests/artifact-preview.test.mjs:56-78` (PascalCase seed labels) — invert, do
        not delete. Check `:84`, `:91`, `:101-111`, `:201-205` for label expectations that
        move with `TEMPLATE_LABELS`.
  - [x] `tests/artifact-hydration.test.mjs`: `'text-placeholder'` at `:63`, `:127`, `:187`,
        `:437` → `'general'`; the `song-set` group check at `:349-354` stays.
  - [x] `tests/presenter-model.test.mjs:110` expects `Welcome` / `Song Title` / `Song Lyric` /
        `Theme Verse` — all four must still hold after the seed relabel.
  - [x] `tests/registry-seed-conformance.test.mjs` and `tests/registry-assets.test.mjs` read
        the shipped seed — update them, do not loosen them.
  - [x] Add the AC-1 absence test, the AC-4 no-new-column test, the AC-8 rename-reaches-every-
        service test (over a **built plan**), and the AC-9 reset-transition test.
  - [x] Register every new suite in `package.json` `scripts.test` in this change set.

- [x] **Verify the scoped change** (AC: 1-14)
  - [x] Focused: `tests/registry.test.mjs`, `tests/registry-reseed.test.mjs`,
        `tests/registry-seed-conformance.test.mjs`, `tests/registry-assets.test.mjs`,
        `tests/artifact-hydration.test.mjs`, `tests/artifact-preview.test.mjs`,
        `tests/artifacts-api.test.mjs`, `tests/presenter-model.test.mjs`,
        `tests/slide-plan.test.mjs`, `tests/pptx-content.test.mjs`.
  - [x] `npm run build` → `npm test` in that order (`tests/auth-http.test.mjs` spawns the
        built server).
  - [x] `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
  - [x] `git diff --check` clean; nothing forbidden staged.

## Dev Notes

### What this story owns, and what it must not touch

Epic 20 is one story per capability. This is **CAP-5 plus the SPEC *Constraints* clause on
slide kinds**, and nothing else.

| Not in this story | Owner |
| --- | --- |
| `create` / `delete` / `reorder` verbs, the ordered-list surface, the **rename** verb and UI, AD-17's per-row seed-origin record | Story 20.3 |
| Full canvas authoring on General rows, and *"a rejected Save names the property"* | Story 20.4 |
| The Placeholder Catalog, its admitted key set, its resolver module, and the one-time key spelling | Story 20.5 |
| Announcement expansion changes | Story 20.6 |
| The four `songset-*` slot identities, the settings-form binding, deleting `song1Number..song4Number`, the identity→rundown-position table, AD-22's bounded configuration surface, the read-only slot statement | Story 20.7 |
| The per-service snapshot, Sync Artifact, and any freeze or staleness signal | Story 20.8 |
| Seed readability assertions and the two renderers agreeing on fit | Story 20.9 |
| Closing the font set (AD-30) | Story 20.10 |

`/api/admin/artifacts` at `553a4c5` is `GET` + `GET`/`PUT` by id + `POST .../reset`. **This
story adds no verb and no route**, so it adds no authorization surface: `/admin/artifacts`
and `/api/admin/artifacts/**` are already inside `src/proxy.ts`'s matcher (AD-5, AD-14).

### The two findings that decide this story

**1. `TEMPLATE_LABELS` makes CAP-5 unreachable, and nothing in the artifacts said so.**
`previewLabel` (`preview-model.ts:119-130`) consults a hardcoded template-id → display map
**before** the row's own label, and that map covers 33 of the 38 seeded ids. `presenter-model.ts`
builds the Presenter's entries through `buildPreviewEntries`, so the Presenter badge is that map's
output. Renaming a row's label therefore changes **nothing an operator sees** — which is exactly
what CAP-5's success clause promises. The map exists for a good reason (the seed labels are
`BibleTalkSequence`, `OpeningSongCue_BT`), so retiring it without re-authoring the labels would
regress every badge. Both halves ship together or neither does.

**2. The seed cannot validate after the collapse unless the General rule changes.** Eight rows move
onto `general` and **all eight declare placeholders** (1, 2, 2, 1, 2, 1, 1 and 4 respectively; the
24 rows that are `general` today declare none, which is why nobody has hit this).
`validate.ts:366-368` refuses a General with placeholders, and AD-15 makes the seeder validate like
every other write path. The
first boot after a naive collapse throws inside the bootstrap transaction. AC-3 is what prevents
it, and CAP-4 is why the rule was always wrong for the three-kind model.

### The one place the epic and the SPEC disagree

The mapping table under *Seven base types collapse to three kinds* (`epics.md:429-434`) maps
`fullscreen-image → Announcement` at `:432`. Every authoritative source says
otherwise, and they agree with each other:

- **AD-19:** *"`text-placeholder`, `image-placeholder`, `mix-placeholder` and `fullscreen-image`
  are **gone rather than renamed**: a placeholder stops being a kind and becomes an element
  inserted onto a General from the Placeholder Catalog."* All four, not three.
- **`slide-kinds.md` → *Retired as distinct kinds*:** lists FullScreenImage with the other three
  and says *"their jobs move onto **General + catalog placeholders**"*.
- **`placeholder-catalog.md` → *Worked examples*:** *"Sermon flyer / graphic | **General** |
  `sermonGraphic` (image), optionally sized full-bleed on canvas"*. CAP-4's success clause says
  the same in the SPEC itself.
- **AD-22:** *"An `announcement` row is bound to the Announcements master set, whose membership is
  not registry-authored at all."*

And the code settles it independently of the prose: the only `fullscreen-image` row is
`sermon-flyer`, whose handler fills it from `ctx.sermonGraphic` (`slide-plan.ts:551-560`), while
`announcement-flyer` maps over `ctx.flyers` (`:698-706`). Calling `sermon-flyer` an
`announcement` would say its content comes from the Announcements master list, which is a
different list, a different cardinality (one slide vs N), and a different owner.

Follow the SPEC. The epic row is a documentation defect — see *Gate*.

### What the schema call answers, and what it hands to Story 20.7

The spine defers *"where a SongSet slot identity is persisted — in the `base_type` column itself,
or in a discriminator beside it"* to Story 20.2 / 20.7. **Answered here: the same column, no
discriminator.** Three reasons, in the order that matters:

- AD-19 describes the persisted per-row value as an **entry key** — *"six keys over three
  kinds"*, *"`song-set` names the kind, never an entry"*. A discriminator beside the column would
  make the kind a second persisted fact, and AD-18 states plainly that *"a value persisted in more
  than one place has exactly one authoritative copy"*.
- The column is already the derived index of `payload.baseType`, maintained by the same write
  (`store.ts:251-256`, `:266-271`, `:323-328`). Adding a second column doubles that obligation for
  no gain.
- A new column is a schema change on the `getDb` DDL path (AD-9) that buys nothing this story or
  20.7 cannot do without.

What 20.7 inherits: the entry vocabulary widens from three to AD-19's six **in this same column**;
`song-set` stops being a legal entry value at that moment and survives only as the kind that
`kindOf('songset-bt-open')` returns. This story ships the function so that widening is a table
edit rather than a refactor. It ships **no** `songset-*` spelling — that constraint is inherited
verbatim from Story 20.1, which held the same line.

### Why the version counter does not move

AD-18 says the collapse *"folds into production data version 1 (AD-21)"*. Version 1 was stamped by
Story 20.1 and **has never been released** — AD-4 records that no deployment exists. AD-21 is
explicit that *"an unreleased transition is not yet history and may be rewritten"* and that the
batch compacts into one before it reaches production. So `CURRENT_DATA_VERSION` stays `1`, no
transition number is minted, and the reset in AC-9 triggers on a content predicate instead. A
released version 1 would have required version 2 and a real migration; that is the sentence the
change set must carry, because it is the thing that changes at first deploy.

**The order on the `getDb` path is why the reset is safe and why it must sit where AC-9 says.**
AD-21 spells out the exact failure of getting it backwards, and it names this migration by name:
running the collapse *over freshly seeded rows* would either refuse to boot *"at 08:40 on a
Sabbath"* or rewrite all four slots to `general`. Steps are DDL → migrations → corpus reconcile →
bootstrap, asserted three ways in `tests/registry-reseed.test.mjs` (`:319`, `:363`, `:386`), with
`:304` guarding the rollback rather than the order.

### The private seed override is a second file this breaks

AD-11's two-layer seed prefers `data/local/default-registry.json` over the shipped file whenever it
is present, and that file is git-ignored, developer-owned and **not** re-authored by this change
set. A developer who has one will hit a validation failure inside the bootstrap on their next boot,
because the local file still carries retired base types.

That failure is correct behaviour (AD-15: every write validates, the seeder included) and must
**not** be softened into a fallback. What the change set owes is a clear message and a dev-facing
note saying: re-author the local override onto the three kinds, or delete it to fall back to the
shipped seed. `WPW_USE_SHIPPED_REGISTRY=1` inverts the precedence for tests and fidelity smokes
(`seed.ts:48`, documented at `:43-47`) and is why the suite is unaffected either way.

Do not read, print, copy or commit the contents of `data/local/default-registry.json` — it is the
sanctioned home for real congregation data (`AGENTS.md` → *Where real data goes*).

### The label is administrator-owned; the rename verb is not this story's

CAP-5 says the label is *"the **only** part of a row an administrator edits"*. Two halves, two
owners:

- **This story** makes the label the thing an operator actually reads (AC-6) and the thing the
  admin list shows beside the kind chip (AC-7), and makes the kind refuse every write (AC-10). That
  is CAP-5's model and its display.
- **Story 20.3** adds the rename verb and its UI, alongside add / delete / reorder — CAP-2's own
  words. Until then, a `song-set` or `announcement` row still refuses the whole `PUT`
  (`store.ts:233`), which is today's behaviour preserved, not an oversight. The spine's *Deferred*
  entry routes *loosening* `READ_ONLY_BASE_TYPES` to AD-22's bounded surface (Story 20.7); this
  story removes only the value that ceases to exist and changes no row's authority except
  `sermon-flyer`'s, which follows from its kind rather than from a loosening.

There is **no label input in `ArtifactEditor` today** — the label is displayed at `:932` and
`:950` and never edited. Confirm that before assuming a rename path exists to test against.

### Gate — the spine is not edited by this story

Repairing the spine is a `bmad-architecture` **Update** run, never an edit from inside this change
set. Never renumber an existing `AD-n`.

**That Update run is owed, not optional.** AC-4 answers a schema question the spine's own *Deferred*
section delegates to this story by number, so the spine is left carrying a question this story has
already decided. Prohibiting the edit here is only half of it: the run must be scheduled and
recorded as a follow-up on this story's close, the same way Story 20.1's gate was discharged. A
close that ships the code and never books the run leaves the spine permanently stale on a decision
it asked for.

**Eight statements go stale or become newly answerable:**

1. *Deferred*: *"Where a SongSet slot identity is persisted — in the `base_type` column itself, or
   in a discriminator beside it — is a Story 20.2 / 20.7 schema call."* **Answered here** (AC-4);
   the entry becomes *decided by 20.2, implemented by 20.7*.
2. *Deferred*: *"`READ_ONLY_BASE_TYPES` (`types.ts:13-17`) still refuses every administrator edit to
   a `fullscreen-image`, `song-set` or `announcement` row (`ArtifactEditor.tsx:113` and `:842`,
   `registry/store.ts:233`)."* The `fullscreen-image` third is false after AC-5 and the constant is
   renamed; the two remaining kinds still refuse, and the line numbers move.
3. **AD-18 `[TARGET]`** — its total-replacement clause is satisfied here. Do not flip the tag.
4. **AD-19 `[TARGET]`** — its *kind vocabulary* clause becomes true; its `songset-*` slot clauses,
   its one-home clause and its Placeholder Catalog clause do **not**. Do not flip the tag.
5. **AD-22 `[TARGET]`** — *"free canvas is General's alone"* becomes structurally true for the
   canvas predicate; the bounded configuration surface does not exist. Do not flip the tag.
6. **AD-20's gap paragraph** cites five handlers by `slide-plan.ts` line number; those numbers may
   move. AD-20 stays `[ADOPTED, partial]` — this story closes none of its gap.
7. **AD-18's *Binds* line** (`ARCHITECTURE-SPINE.md:177`) names *"`READ_ONLY_BASE_TYPES` /
   `EDITABLE_BASE_TYPES`"* as bound constants. AC-5 deletes one and replaces the other, so the
   binding must be repointed at the canvas-authority predicate that succeeds them. The *Binds*
   claim itself stays true — the same fact is still bound, under a new name.
8. *Deferred*: *"`ARTIFACT_BASE_TYPES` still carries all seven retired values (`types.ts:1-10`),
   which is Story 20.2's collapse"* (`ARCHITECTURE-SPINE.md:473`). **False the moment AC-1 lands**,
   and it is the entry that names this story by number. The same bullet's `/api/admin/artifacts`
   and Placeholder Catalog clauses stay true; only the `ARTIFACT_BASE_TYPES` sentence moves.
   *(That citation reads `types.ts:1-10`; the constant ends at `:9`. The spine is not this story's
   to correct — flagged for the same Update run.)*

**A ninth item is a documentation defect outside this change set, not a decision:**
the `fullscreen-image → Announcement` row in `epics.md`'s mapping table (`:432`) contradicts the
SPEC, the two companions
and AD-19 (see above). `epics.md` currently carries **uncommitted Correct Course edits** and is not
this story's to touch. Raise it with the artifact's owner; implement the SPEC's mapping regardless,
and say in the change set that you did and why.

### Implementation guardrails

- **`buildSlidePlan` stays the single order source (AD-7)**, and this story changes neither order
  nor presence — only vocabulary, labels and display. `ROW_HANDLERS` is keyed on **row id**, not on
  base type, so the collapse reaches it in exactly one place: `'song-set'` at `slide-plan.ts:514`
  is a **row id**, not a base type, and must not be renamed.
- **No renderer reads the registry (AD-12).** The plan is a fully hydrated Fat Payload.
- **Module boundaries are load-bearing.** `registry/*` = storage + validation; `artifacts/*` =
  hydration + runtime contract; `services/*` = AD-6's precondition. Stale writes are already
  signalled two ways (`RegistryStaleError` thrown in the store, a result returned in the services
  layer) — **a third enforcement site must not appear**.
- **Every write into the registry validates under AD-15**, the bootstrap and the reset transition
  included.
- **Schema changes go through the startup DDL on the `getDb` path (AD-9).** This story adds no
  column, no Prisma, no migration directory, no second bootstrap path.
- **Image refs resolve only through the shared helpers (AD-8).** No new asset, no `data:` URI, no
  remote reference.
- **`assertContiguousPositions` still holds after the reset.** The reset clears and re-bootstraps,
  so positions come back as `0..37` from the seed's own index; assert it after the transition.
- **better-sqlite3 is synchronous and server-only.** The registry is read once per plan build; do
  not move that read per slide.
- **`npm run lint` is not expected to be zero** — the clean-checkout baseline was 31 problems on
  2026-08-01. Compare against `HEAD`, not zero. A number in the thousands means an agent worktree
  was linted, not the repo.
- **Never hand-edit `package-lock.json`.** A search-and-replace across tracked files — and this
  story is exactly that shape — must exclude it. `tests/lockfile-integrity.test.mjs` exists because
  a 2026-07-29 text-level replace broke `npm ci` repo-wide for two days.
- Next 16's App Router differs from common training data. Read `node_modules/next/dist/docs/`
  before changing any Next API usage; `package.json` is version authority over architecture prose.

### Testing requirements

- `node:test` + `node:assert/strict` under `tests/*.test.mjs`, imported through
  `--import ./tests/register-ts-resolve.mjs --experimental-strip-types`. No Jest, no Vitest, no
  second runner.
- DB-touching tests set a temporary `DB_PATH` **before** importing `getDb` and restore every
  `process.env` mutation in the same suite. Follow `tests/registry.test.mjs` and
  `tests/registry-reseed.test.mjs`.
- **AC-8's rename test goes through a built plan**, not through the store. A store assertion proves
  the column changed and says nothing about what an operator reads.
- **AC-9's reset test builds a synthetic pre-collapse database** — rows carrying `text-placeholder`
  with the bootstrap marker set — boots `getDb()`, and asserts the registry comes back as the
  re-authored 38 rows with contiguous positions. `createPreCounterDatabase`
  (`tests/registry-reseed.test.mjs:259-294`) already constructs a synthetic table this way;
  follow it.
- **Prove each guard reacts.** This repository has shipped guards that read the wrong branch and
  guards that exempted the directory they were written for.
- Suites that read the shipped seed move with it and must be updated rather than loosened:
  `tests/registry-seed-conformance.test.mjs`, `tests/registry-assets.test.mjs`.
- `tests/theme-chrome.test.mjs` carries four hardcoded lists. This story adds no room-facing
  surface, so none of them moves — confirm rather than assume.

### Previous-story and Git intelligence

- **Story 20.1 (`20-1-ordered-registry.md`, done, PR #37, merge `bc487b3`)** is the direct
  predecessor and left this story three things by name: the `base_type` collapse itself; the
  untouched `ARTIFACT_BASE_TYPES` / `READ_ONLY_BASE_TYPES`; and the note that *"Story 20.2's
  collapse rewrites `base_type` **and** the payload in one statement (AD-18's derived-index rule).
  It must not touch the position column, and it cannot: the position has one home and no payload
  copy."* Honour that: the reset in AC-9 re-seeds positions from the seed order rather than
  preserving them by hand.
- 20.1's five **transitional** SongSet rows (`bt-opening-song`, `bt-closing-song`, `ds-opening-song`,
  `ds-closing-song`, `song-set`) are **not** AD-19 identities and this story does not migrate them.
  They stay `song-set` rows through the collapse and Story 20.7 removes or migrates all five.
- 20.1's own close carries a stated gap worth knowing: its final post-fix state was verified only by
  the coordinator and never read by an independent reviewer. If something in `slide-plan.ts`,
  `registry-snapshot.ts` or `seed.ts` looks wrong here, check it against the source rather than
  assuming 20.1 settled it.
- Commits since `bcb7349`: `d9d23b9` (20.1 feature), `fb25caa` (20.1 fix round 2), `bc487b3` (merge),
  then four `docs(spec)` commits that closed SPEC gaps — the ratified add verb, the repeated
  Announcement rows, and the chip decision that `slide-kinds.md` still recorded as open. Those four
  are why the SPEC folder can be trusted over the epic on the points above.
- Story 23.1 is the nearest precedent for a change set that re-authors committed fixture data in a
  public repository: it kept the fixture in code, ran the guard unchanged, and proved a changed guard
  rejects the defect it claims to catch.

### Project Structure Notes

- Update: `src/lib/registry/types.ts` — three-value vocabulary, `EDITABLE_BASE_TYPES` deleted,
  `READ_ONLY_BASE_TYPES` replaced by the canvas-authority predicate, entry-key → kind function.
- Update: `src/lib/registry/validate.ts` — `enforceBaseTypeRules` to three cases; the General
  no-placeholders branch deleted.
- Update: `src/lib/registry/store.ts` — the four call sites of the retired set; the kind refusal
  against the persisted row (AC-10).
- Update: `src/lib/db/index.ts` — the one-time reset transition in the migrations slot.
- Update: `src/lib/artifacts/preview-model.ts` — `TEMPLATE_LABELS` deleted, `previewLabel` reads the
  row label, `sermon-flyer`'s image tone preserved.
- Update: `src/components/admin/ArtifactEditor.tsx` — the `[kind] label` chip at `:932-936`, `:951`,
  `:996`; the authority predicate at `:113`, `:842`.
- Update: `data/default-registry.json` — 8 rows change kind, every row's label re-authored.
- Update: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
  — the *Row display* owner note.
- Update: `_bmad-output/specs/spec-artifact-registry-authoring/slide-kinds.md` — the *Badge display*
  owner annotation at `:67` **only**; the decision itself is contract and is not edited.
- Update: `package.json` — register any new suite.
- Update: `tests/artifact-preview.test.mjs`, `tests/artifact-hydration.test.mjs`,
  `tests/registry-seed-conformance.test.mjs`, `tests/registry-assets.test.mjs`,
  `tests/presenter-model.test.mjs`, `tests/registry-reseed.test.mjs`.
- Read before editing: `src/lib/slide-plan.ts` (`ROW_HANDLERS`, and `'song-set'` at `:514` is a row
  id), `src/lib/artifacts/hydrate.ts:193-194`, `src/lib/artifacts/runtime-contract.ts`,
  `src/lib/registry/seed.ts`, `src/app/services/[id]/present/presenter-model.ts`,
  `src/components/SlidePreviewList.tsx`.
- Do **not** edit: `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md`,
  `_bmad-output/planning-artifacts/epics.md`, `data/local/default-registry.json`.

### References

- [Source: _bmad-output/specs/spec-artifact-registry-authoring/SPEC.md#Capabilities — CAP-5, CAP-4, CAP-2; #Constraints; #Non-goals]
- [Source: _bmad-output/specs/spec-artifact-registry-authoring/slide-kinds.md#Three kinds only; #Retired as distinct kinds; #Badge display; #SongSet]
- [Source: _bmad-output/specs/spec-artifact-registry-authoring/authoring-boundaries.md#What the administrator may not edit at all; #Two surfaces (after Correct Course); #Historical freeze (per service)]
- [Source: _bmad-output/specs/spec-artifact-registry-authoring/placeholder-catalog.md#Model; #Key spelling is chosen once; #Worked examples]
- [Source: _bmad-output/specs/spec-slide-artifact-model/SPEC.md#Constraints]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 20: The registry becomes where the deck is authored; #### Story 20.2: Three Slide Kinds]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md#AD-4; #AD-7; #AD-8; #AD-9; #AD-11; #AD-12; #AD-14; #AD-15; #AD-16; #AD-17; #AD-18; #AD-19; #AD-20; #AD-21; #AD-22; #Consistency Conventions; #Capability → Architecture Map; #Deferred]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md#Inside /admin/artifacts: three surfaces, not one; #Voice and Tone]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md#Open Item 4; #Component Patterns]
- [Source: _bmad-output/implementation-artifacts/stories/20-1-ordered-registry.md#The two decisions this story makes; #Five transitional SongSet entries, named rather than hidden; #Gate]
- [Source: _bmad-output/implementation-artifacts/sprint-status.yaml#epic-20; #20-1-ordered-registry]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules; #Testing Rules; #Development Workflow Rules; #Critical Don't-Miss Rules]
- [Source: AGENTS.md#Never commit; #Commit / push audit (mandatory); #Hard rules before non-trivial code]

## Dev Agent Record

### Agent Model Used

Composer (cursor:composer-2.5)

### Debug Log References

AC-14 guard proofs (defect injected → suite red → assertion message):

1. **Retired base-type absence — JSON quoted key** (`tests/artifact-kinds.test.mjs`): changed `welcome` row in `data/default-registry.json` to `"baseType": "text-placeholder"` → `retired template base types occur nowhere in src, data, or tests` failed with `retired template base type string still present: data\default-registry.json:"baseType": "text-placeholder"`.
2. **Retired base-type absence — switch case** (`tests/artifact-kinds.test.mjs`): added `case 'mix-placeholder':` before `case 'general':` in `validate.ts` → failed with `retired template base type string still present: src\lib\registry\validate.ts:case 'mix-placeholder':`.
3. **Retired base-type absence — bare array member** (`tests/artifact-kinds.test.mjs`): prepended `'text-placeholder'` to `ARTIFACT_BASE_TYPES` in `types.ts` → failed with `retired template base type string still present: src\lib\registry\types.ts:'text-placeholder'`.
4. **AC-4 no-new-column DDL** (`tests/artifact-kinds.test.mjs`): inserted `'slot'` into the `artifact_templates` DDL column list in `db/index.ts` → `artifact_templates DDL gained no column beyond the Story 20.1 shape` failed with `deepStrictEqual` on the column list (`'slot'` present, expected 7 columns).
5. **AC-8 rename reaches plan** (`tests/registry-kind-rename.test.mjs`): replaced `previewLabel`'s `return instance.label` with `return 'Hardcoded'` → failed with `Presenter/preview must read the live registry label on the next plan build`.
6. **AC-10 kind write refusal** (`tests/artifacts-api.test.mjs`): removed the persisted-row `baseType` pre-validation check in `store.ts` → `PUT refuses to change a row kind against its persisted state` failed with `RegistryValidationError: SongSet requires layouts.title and layouts.lyric` instead of `baseType cannot be changed`.
7. **AC-9 reset via real getDb** (`tests/registry-three-kind-reset.test.mjs`): commented out `repairPreThreeKindArtifactRegistry(db)` in `getDb()` → `the real getDb() resets a pre-collapse database to the re-authored 38-row seed` failed with `getDb must reset retired base types and re-bootstrap the shipped seed`.
8. **PascalCase seed-label invert** (`tests/artifact-preview.test.mjs:67-70`): renamed the `welcome` row's `label` in `data/default-registry.json` from `Welcome` to `WelcomeBack` → `every entry carries an operator-recognizable label` failed with `raw template label leaked: WelcomeBack`.
9. **sermon-flyer canvas-editable (AC-5)** (`tests/registry.test.mjs`): set `isCanvasAuthorable` to always return `false` → `sermon-flyer accepts canvas element authoring after fullscreen-image collapse (AC-5)` failed with `RegistryValidationError: Template base type is read-only`.
10. **Round-2 B1a — `image-placeholder` switch case** (`tests/artifact-kinds.test.mjs`): added `case 'image-placeholder':` before `case 'general':` in `enforceBaseTypeRules` → `retired template base types occur nowhere in src, data, or tests` failed with `src\lib\registry\validate.ts:case 'image-placeholder': in switch(baseType)`.
11. **Round-2 B1b — multi-line `ARTIFACT_BASE_TYPES`** (`tests/artifact-kinds.test.mjs`): reformatted `ARTIFACT_BASE_TYPES` across lines with `'image-placeholder'` appended → failed with `src\lib\registry\types.ts:ARTIFACT_BASE_TYPES contains 'image-placeholder'`.

### Completion Notes List

Fix round 2 (final adjudicated blockers + should-fixes):
- **B1**: Replaced regex carve-outs with context-aware scanner (`switch(baseType)` brace-balanced body, multi-line `ARTIFACT_ENTRY_KEYS` / `ARTIFACT_BASE_TYPES` arrays, `baseType`/`base_type` literals); proofs 10–11 above.
- **B2**: Routed `previewLabel` / `previewBadgeTone` kind checks through `kindOf`; introduced `ARTIFACT_ENTRY_KEYS` for reset predicate and validation allow-list (Story 20.7 extends entry keys, not kind vocabulary).
- **S1**: Gated persisted-row `baseType` write refusal on `!options?.allowReadOnly` so `resetArtifactTemplate` can repair drifted rows.
- **S2**: Rewrote Debug Log item 8 to record real `WelcomeBack` seed-label injection proof.
- **S3**: `previewLabel` returns trimmed `instance.label` when present.
- Completed seed `baseType` migration (8 retired rows → `general`) and operator label re-author from `TEMPLATE_LABELS`.
- `npm run build` green; `npm test`: **503 pass, 0 fail, 1 skip**; public-repo guard **5 pass**; `npm run lint`: **30** (baseline 31).

Fix round 1 (adjudicated review union):
- **B1**: Expanded `RETIRED_BASE_TYPE_PATTERNS` to match JSON quoted keys, switch-case forms, bare array members, and `ARTIFACT_BASE_TYPES` context for `image-placeholder`; excluded `data/local/` from scan.
- **B2**: Recorded auditable injection proofs for all nine guards above.
- **M1**: Added `the real getDb() resets a pre-collapse database…` test using subprocess `bootAgainst`.
- **S1**: Moved retired-row predicate and row count inside `tx.immediate()`; log only when reset runs.
- **S2**: Derived `NOT IN` list from `ARTIFACT_BASE_TYPES` with Story 20.7 comment.
- **S3**: Removed dead `hasImage` computation from `validate.ts`.
- **S4**: Collapsed to one reachable `baseType` pre-validation check (post-validation duplicate removed).
- **S5**: Removed duplicate `ARTIFACT_KINDS` array; `ArtifactKind` aliases `ArtifactBaseType`.
- **S6**: Added `kindChipLabel` helper; three chip call sites degrade to `[unknown]`.
- **S7**: Added positive `sermon-flyer` canvas authoring test.
- **S8**: Reset log and docstring now state administrator layout edits on valid rows are destroyed.
- `npm run build` green; `npm test`: **503 pass, 0 fail, 1 skip**; public-repo guard **5 pass**.

### File List

- `data/default-registry.json`
- `package.json`
- `src/components/admin/ArtifactEditor.tsx`
- `src/lib/artifacts/preview-model.ts`
- `src/lib/db/index.ts`
- `src/lib/registry/seed.ts`
- `src/lib/registry/store.ts`
- `src/lib/registry/types.ts`
- `src/lib/registry/validate.ts`
- `tests/artifact-hydration.test.mjs`
- `tests/artifact-kinds.test.mjs` (new)
- `tests/artifact-preview.test.mjs`
- `tests/artifacts-api.test.mjs`
- `tests/registry-kind-rename.test.mjs` (new)
- `tests/registry-three-kind-reset.test.mjs` (new)
- `tests/registry.test.mjs`
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
- `_bmad-output/specs/spec-artifact-registry-authoring/slide-kinds.md`
- `_bmad-output/implementation-artifacts/stories/20-2-three-slide-kinds.md`
