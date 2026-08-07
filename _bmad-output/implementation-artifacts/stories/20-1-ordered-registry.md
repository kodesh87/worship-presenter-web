---
baseline_commit: bcb7349
---

# Story 20.1: One Ordered Registry

Status: review

## Story

As an administrator,
I want the registry to define which slides exist **and in what order**,
so that deck structure is data rather than a sequence of TypeScript constants.

## Acceptance Criteria

Every criterion below cites the clause it answers to. Where a criterion states a
number, that number is checkable against the repository at `bcb7349`.

1. **Ordering is a column on the row, and the order is total.**
   **Given** a database initialised by `getDb()`, **When** the registry is read,
   **Then** every `artifact_templates` row carries an integer position; the
   persisted set of positions is exactly `0..N-1` with no duplicate and no gap;
   and `listArtifactSummaries` orders by that column instead of
   `label COLLATE NOCASE` (`src/lib/registry/store.ts:81` today). The position
   lives **only** in the row — no payload field duplicates it, `schemaVersion`
   stays `1`, and the validator's closed key set is unchanged.
   [CAP-1; AD-9 (schema on the startup DDL path); AD-18 (one authoritative
   persisted copy, with any payload duplicate maintained as a derived index);
   AD-21 (`schemaVersion` is not the data
   version and never answers for it)]

2. **The ordered registry snapshot is the sequence source for every registry-authored entry.**
   **Given** two non-SongSet registry entries whose positions are swapped directly in the
   database, **When** a plan is built for a service, **Then** `buildSlidePlan`
   emits them in the new order and PPTX, slideshow and presenter all follow —
   with no TypeScript edit. `buildSlidePlan` remains the single order source and
   no renderer reads the registry. The five transitional SongSet groups named in
   *Dev Notes â†’ Five transitional SongSet entries* remain planner-owned until
   Story 20.7 supplies AD-19 binding identities; they are an explicit exception,
   not an unrecorded second order source.
   [CAP-1 *success*: *"Reordering two registry entries and creating a new service
   yields Presenter/PPTX in that sequence without editing TypeScript plan
   constants"*; SPEC *Constraints*: *"`buildSlidePlan` (or successor) consumes the
   ordered registry snapshot (per service) as the sequence source"*; AD-7; AD-12]

3. **Sequence and visible content are otherwise unchanged for identical inputs.**
   **Given** the shipped seed and an unchanged rundown fixture, **When** the plan
   is built, **Then** the slide sequence and visible content match today's output,
   with exactly four deliberate deltas and no fifth: (a) the three fixed
   liturgical songs render as General slides instead of title-suppressed SongSet
   groups (AC-5); (b) the two reused cue templates become four rows (AC-6);
   (c) Live Preview no longer nests those three songs under a group node, because
   a General is a leaf; (d) a corpus gap in #671/#684 can no longer throw during
   plan build (`resolveIntercessoryStandingHymns` is gone with its only caller).
   The five retained transitional SongSet groups are not a fifth delta: they
   preserve today's groups and their order while Story 20.7 moves their binding
   identities into the AD-19 model.
   `tests/slide-plan.test.mjs` is **updated to state each delta explicitly**, never
   relaxed to accommodate one.
   [`spec-slide-artifact-model` *Constraints*: *"the resulting sequence and visible
   content must match the current behavior for identical inputs"*]

4. **`skipTitle` is deleted, not migrated, and nothing replaces it.**
   **Given** the change set, **When** `src/` is searched, **Then** `skipTitle`
   occurs zero times: the option declaration (`slide-plan.ts:140`), its branch
   (`:148`) and the three call sites (`:438` `intercessory-671`, `:460`
   `intercessory-684`, `:550` `hope`) are all removed, and no flag, column,
   setting or template field takes its place anywhere. `weHaveThisHopeFixed` and
   `splitWeHaveThisHopeSlides` go with it. A test anchored on the absence — not on
   a spelling — asserts it.
   [AD-20: *"the `skipTitle` mechanism is removed rather than migrated… It ships
   today at five sites (`slide-plan.ts:140`, `:148`, `:438`, `:460`, `:550`) and
   Story 20.1 deletes them — a removal, not a compatibility shim"*; Epic 19
   RETIRED note]

5. **The three fixed liturgical songs become four hand-authored General rows.**
   **Given** the committed seed, **When** it is bootstrapped, **Then** it holds
   four new `general` rows — **one per lyric page**: one for SDAH #671, one for
   #684, two for *We Have This Hope* — each carrying its page's text as fixed
   canvas `content` (an element with `content`, never a `placeholderKey`), on the
   shipped lyric background (`backgroundImage: /assets/song-lyric-bg.jpeg`,
   `backgroundColor: #5C2E16`), and each page reproduces **byte-for-byte** the text
   and page breaks the shipped splitter produces today. Page counts measured
   against the shipped corpus on 2026-08-07: #671 → **1** page, #684 → **1** page,
   *We Have This Hope* through the fixed splitter → **2** pages.
   [AD-20; `slide-kinds.md` *Retired as distinct kinds*; spine *Deferred*: *"one
   General row per lyric page rather than one row per song"*]

6. **Each ordered seed position is a distinct row; a reused cue template becomes separate rows.**
   **Given** the ordered seed, **When** it is read, **Then** each ordered seed
   position is exactly one row. SongSet expansion remains the named five-group
   transition owned by Story 20.7. `opening-song-cue` and `closing-song-cue` — each
   referenced from two positions today — become four rows
   (`bt-opening-song-cue`, `ds-opening-song-cue`, `bt-closing-song-cue`,
   `ds-closing-song-cue`); the four weekly SongSet positions are likewise separate
   transitional rows (`bt-opening-song`, `bt-closing-song`, `ds-opening-song`,
   `ds-closing-song`), but are **not** AD-19 slot identities or binding keys; Story
   20.7 owns those identities. The accepted consequence is stated in the change
   set: editing one cue row no longer changes the other.
   [CAP-1; `authoring-boundaries.md` *Order*: *"There is no parallel 'instance
   order' table for normal operation"*]

7. **The seed is a bootstrap; a delete stays deleted through a restart.**
   **Given** a database whose bootstrap marker is set, **When** the process
   restarts, **Then** the seeder writes nothing — nothing inserted, nothing
   re-seeded — and a row deleted directly in SQL does **not** reappear in
   `listArtifactSummaries` or in a built plan. The automatic branch of
   `reseedArtifactTemplateIfUntouched`, `insertArtifactTemplateIfMissing`'s
   gap-filling use, and the read-time substitution at
   `src/lib/artifacts/registry-snapshot.ts:85-90` are all gone. Reset-from-seed per
   template survives as an explicit administrator action, and AD-11's two-layer
   `data/local/` precedence is untouched.
   `tests/registry-reseed.test.mjs:337` (*"a missing row is inserted with its seed
   hash recorded"*) is **inverted, not deleted**, and a second assertion pins that a
   deleted row does not reappear in a built plan.
   [AD-17; AD-11 (storage target, two-layer seed, Reset-from-seed all stand);
   spine *Deferred*: *"that test must be inverted, not deleted, or the resurrection
   has no guard"*]

8. **A row that will not validate fails closed.**
   **Given** a persisted row whose payload does not pass `validateArtifactTemplate`,
   **When** a plan is built, **Then** no seed template is substituted for it: the
   row contributes no layout, `parseRow`'s two `console.error` branches stay exactly
   as they are, and the existing *"rejected and absent from the shipped seed, no
   layout is available"* log becomes the path for **every** rejected row rather
   than only those the seed lacks. Prove the guard reacts: inject a corrupt payload,
   confirm the plan omits it and the id is logged.
   [AD-17: *"no read path may substitute a seed template for a row the database does
   not hold, and none may substitute one for a row it holds but cannot parse"*;
   spine *Deferred*: *"absent rows and corrupt rows are substituted by the same
   loop… that is intended, but it must be a decision rather than a side effect"*]

9. **Persisted data carries one monotonic version counter, and this story introduces it.**
   **Given** a database created by the AD-17 bootstrap, **When** `getDb()` returns,
   **Then** `settings` holds one data-version key stamped **by the bootstrap
   itself, in the same transaction as the bootstrap marker**, and the two keys are
   distinct — the marker records that bootstrap ran, the counter records which data
   version is persisted. A database holding registry rows and **no** version key is
   a pre-counter database and takes exactly one recorded repair transition. The
   order on the `getDb` path is **startup DDL → data migrations → corpus reconcile
   → first-boot bootstrap**, and a test asserts that order. `artifact_seed_hash_backfilled`
   and the `seed_hash` self-healing branch are retired in this change set. No
   migration framework is introduced.
   [AD-21 in full, including *"the counter's absence is not version 0"* and *"the
   order on the `getDb` path is fixed, and asserted by a test"*; AD-18 (superseded
   only in its marker mechanism); AD-9 (no framework); AD-25 (the reconcile sits
   after migrations, and its order relative to the bootstrap is free)]

10. **Everything now in development compacts into data version 1; developer databases are reset.**
    **Given** that no deployment exists (AD-4, recorded 2026-07-30 and unchanged at
    `bcb7349`), **When** this story lands, **Then** the whole batch of unreleased
    transitions is compacted into a single transition and a fresh bootstrap stamps
    **version 1**; a developer database holding pre-20.1 registry rows is **reset**
    to that version rather than migrated row-by-row, and the change set says so in
    its dev-facing note. The change set also states, in one sentence, that this
    licence **expires at first deploy** — after which the same change needs a
    migration over live `artifact_templates` rows.
    [AD-21: *"an unreleased transition is not yet history and may be rewritten…
    developer databases are reset to the compacted version"*; AD-18: *"Until first
    deploy no production rows exist… folding into production data version 1"*;
    AD-4 dates the milestone]

11. **Public-repository rules hold, and the guard is not weakened.**
    **Given** the change set, **When**
    `tests/public-repo-guard.test.mjs` runs, **Then** it is green with no change
    that loosens it: no real congregation name, photograph, prayer request,
    contact or payment detail, no `data/local/`, `data/uploads/`, `slides*/`
    material and no deck reaches a tracked file. The seed's new lyric text is SDAH
    corpus text that already ships committed under the owner's 2026-08-01
    accepted-risk position (`data/song-book/sdah.json`'s own `licence` and
    `attribution` fields); the change set records that the seed now carries SDAH
    text **outside** the corpus and points at that statement rather than inventing a
    new rights position.
    [`AGENTS.md`; `.constitution/public-repository.md`; SPEC *Constraints*:
    *"Public-repository rules unchanged"*; spine *Deferred* on the SDAH licence]

12. **The one sibling artifact this story falsifies is corrected in the same change set.**
    **Given** `EXPERIENCE.md`'s *Ordered registry list* row, which cites
    *"`artifact_templates` has no ordering column — the list is sorted by label —
    and `/api/admin/artifacts` carries no create, delete or reorder verb"* as its
    not-shipped evidence, **When** this story lands, **Then** the first half of that
    evidence is false and the row is corrected to say so; the surface stays
    *Owner: Story 20.3* and the missing verbs stay missing. No IA row is added,
    renamed or removed; `DESIGN.md` is untouched; the architecture spine is **not**
    edited here (see *Gate* in Dev Notes).
    [`AGENTS.md` four-families rule; `EXPERIENCE.md:61`]

13. **Every guard added here is proved to react, and every new suite is registered.**
    **Given** any new or changed `tests/*.test.mjs`, **When** the change set is
    finalised, **Then** the file is listed in the explicit `package.json`
    `scripts.test` command in the **same** change set, and each guard has been
    proved to react by injecting the defect it claims to catch and confirming the
    suite goes red before the injection is reverted.
    [*Consistency Conventions → Testing*; `project-context.md`: *"an unregistered
    test file never runs… and nothing detects the omission"* and *"when you write or
    change a guard, prove it reacts"*]

## Tasks / Subtasks

- [x] **Add the ordering column and make it the read order** (AC: 1)
  - [x] Add the position column to the `artifact_templates` DDL in
        `src/lib/db/index.ts` on the `getDb` path. Do not introduce a migration
        framework and do not add a versioned migration directory (AD-9).
  - [x] Replace `ORDER BY label COLLATE NOCASE` at `src/lib/registry/store.ts:81`
        with the position column.
  - [x] Keep the position out of the payload. Do not add a key to
        `ALLOWED_TEMPLATE_KEYS` (`validate.ts:15`) — the constant that would have to
        admit a top-level `order` field — nor to `ALLOWED_LAYOUT_KEYS`
        (`validate.ts:31`); `schemaVersion` stays `1` (`validate.ts:449-450`, `:505`).
  - [x] Assert `0..N-1`, no duplicate, no gap after every write path this story
        leaves in place (bootstrap and the existing `PUT`).

- [x] **Re-author `data/default-registry.json` as an ordered 38-row list** (AC: 1, 3, 5, 6)
  - [x] Follow the ordered table in *Dev Notes → The ordered seed*. It is derived
        from `buildRequestPlan` at `bcb7349`; verify each row against the source
        before trusting the table.
  - [x] Split `opening-song-cue` into `bt-opening-song-cue` / `ds-opening-song-cue`
        and `closing-song-cue` into `bt-closing-song-cue` / `ds-closing-song-cue`,
        copying the layout payload verbatim into each.
  - [x] Add the four transitional SongSet rows `bt-opening-song`,
        `bt-closing-song`, `ds-opening-song`, `ds-closing-song`, each copying today's
        `song-set` `title` and `lyric` layouts verbatim. None is an AD-19 slot
        identity or binding key; Story 20.7 owns that migration.
  - [x] Keep the existing `song-set` row as the transitional ds-middle entry — see
        *Dev Notes → Five transitional SongSet entries*. Do not introduce an
        `songset-*` identity in this story.
  - [x] Add the four General lyric-page rows. Base each on the `lyric` layout:
        same background image, same background colour, the `lyrics` element becomes
        a `text` element carrying fixed `content`, and the `label` element is
        dropped (a suppressed title leaves nothing for `1/1` to number).
  - [x] Confirm every bundled asset reference in the file still resolves to a
        committed file under `public/` — the one clause of the original
        seed-transformation constraint that still binds.

- [x] **Make the ordered snapshot the sequence source** (AC: 2, 3)
  - [x] Rewrite `buildRequestPlan` in `src/lib/slide-plan.ts` so it walks the
        ordered registry rows and emits one request per entry, rather than holding
        the sequence as a literal series of `nodes.push(...)` calls.
  - [x] Keep `buildSlidePlan` and `buildArtifactPlan` as the only exported plan
        entry points and keep the one-registry-read-per-plan-build property
        (`hydrateRequestPlan` reads the snapshot once, never per slide).
  - [x] Keep weekly-value resolution, conditional omission, and the legacy
        projection map exactly where they are — this story moves **sequence**, not
        presence rules. See *Dev Notes → What "sequence, not presence" means*.
  - [x] Point the four weekly song positions at their transitional row ids; leave the
        positional hymn→position mapping (`bucketHymnsBySection`, `[0]` / last /
        middle) in the planner until Story 20.7.

- [x] **Delete `skipTitle` and the fixed-song machinery it carried** (AC: 3, 4, 5)
  - [x] Remove the option, its branch and the three call sites in
        `src/lib/slide-plan.ts`.
  - [x] Remove `splitWeHaveThisHopeSlides`, `WE_HAVE_THIS_HOPE_FALLBACK`,
        `resolveWeHaveThisHope` and `resolveIntercessoryStandingHymns` from
        `src/lib/lyrics.ts` once their only caller is gone, and drop the two
        `tests/lyrics.test.mjs` cases at `:138` and `:185` that cover the removed
        splitter.
  - [x] **`INTERCESSORY_STANDING_NUMBERS` / `INTERCESSORY_NUMBER_SET` must survive.**
        They filter #671 and #684 out of the weekly hymn buckets
        (`slide-plan.ts:223`, `:226`); removing them would let a rundown that lists
        either number claim a weekly song position.
  - [x] Update `scripts/smoke-deck-fidelity.mjs:49`, `:55`, `:58`, which assert
        `resolveWeHaveThisHope` by regex over the module source and go red the
        moment it is removed.

- [x] **Retire the resurrect channels** (AC: 7, 8)
  - [x] Gate the seeder on a bootstrap marker in `settings`; it initialises from
        zero only.
  - [x] Remove the read-time gap-fill loop at
        `src/lib/artifacts/registry-snapshot.ts:85-90`. Removing it also removes
        the corrupt-row substitution — that is intended (AC-8), not a side effect.
  - [x] Retire `reseedArtifactTemplateIfUntouched`'s automatic branch, the
        `seed_hash` self-healing path, and the parts of
        `npm run registry:doctor` that exist only to serve them. Reset-from-seed
        keeps working.
  - [x] Invert `tests/registry-reseed.test.mjs:337` and add the deleted-row-stays-
        deleted assertion over a **built plan**, not only over the store.

- [x] **Introduce the data version counter** (AC: 9, 10)
  - [x] Add one counter key to `settings`, stamped by the bootstrap in the same
        transaction as the bootstrap marker. One counter for the whole database.
  - [x] Add the pre-counter repair transition: registry rows present, version key
        absent → one recorded transition, stamped once.
  - [x] Add a test asserting the `getDb` step order (DDL → migrations → corpus
        reconcile → bootstrap). Prove it reacts by reversing two steps and watching
        it go red.
  - [x] Remove `artifact_seed_hash_backfilled` and its backfill block from
        `src/lib/db/index.ts`.
  - [x] Write the dev-facing reset note (AC-10) where a developer will read it
        before their next boot.

- [x] **Sync the one falsified artifact** (AC: 12)
  - [x] Correct the *Ordered registry list* status cell in `EXPERIENCE.md`. Keep
        *Owner: Story 20.3*.

- [x] **Verify the scoped change** (AC: 1-13)
  - [x] Focused: `tests/slide-plan.test.mjs`, `tests/registry.test.mjs`,
        `tests/registry-reseed.test.mjs`, `tests/registry-seed-conformance.test.mjs`,
        `tests/registry-assets.test.mjs`, `tests/artifact-hydration.test.mjs`,
        `tests/artifact-preview.test.mjs`, `tests/artifacts-api.test.mjs`,
        `tests/lyrics.test.mjs`, `tests/pptx-content.test.mjs`.
  - [x] Register every new suite in `package.json` `scripts.test`. (No new test
        *files* were needed — every AC-9/AC-7/AC-8 guard was added to the already-
        registered `tests/registry-reseed.test.mjs` and `tests/registry.test.mjs`,
        so `package.json` required no change.)
  - [x] `npm run build` → `npm test` in that order (`tests/auth-http.test.mjs`
        spawns the built server).
  - [x] `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
  - [x] `git diff --check` clean; nothing forbidden staged.

## Dev Notes

### What this story owns, and what it must not touch

Epic 20 is one story per capability. This is CAP-1 and nothing else.

| Not in this story | Owner |
| --- | --- |
| Collapsing seven `base_type` values to three kinds | Story 20.2 |
| `create` / `delete` / `reorder` verbs on `/api/admin/artifacts`; the reorder UI; the per-row *originated from bootstrap or from an administrator* record AD-17 asks for | Story 20.3 |
| Full canvas authoring on General rows | Story 20.4 |
| The Placeholder Catalog and its resolver module | Story 20.5 |
| Announcement expansion changes | Story 20.6 |
| The four slot identities as a **binding key**, their `songset-*` vocabulary, the settings-form binding, the identity→rundown-position table, AD-22's bounded surface, loosening `READ_ONLY_BASE_TYPES`, and AD-19's *unclaimed weekly hymn is surfaced* behaviour | Story 20.7 |
| The per-service snapshot and Sync Artifact | Story 20.8 |

`/api/admin/artifacts` today is `GET` + `GET`/`PUT` by id + `POST .../reset`
(verified at `bcb7349`). This story adds no verb.

### The two decisions this story makes

**1. AD-21's counter lands here.** The spine records the counter as decided and
its landing story as unassigned, arriving with *"Epic 20's first release"*. Story
20.1 is that release. Three reasons make deferring it worse than doing it:

- AD-21 requires the counter to be stamped *"by the bootstrap itself, in the same
  transaction as the seeding marker."* This story is the one that writes that
  transaction (AC-7). A later story would have to reopen it and re-decide.
- AD-18 says the Epic 20 collapse *"folds into production data version 1 (AD-21)."*
  That sentence presupposes a version 1 exists to fold into. Story 20.2 cannot
  fold into a counter that does not exist.
- This story's own ordering change needs the answer. Adding the column is AD-9
  *schema*; giving 28 existing developer rows a position is AD-18 *value*. Under
  AD-21 the honest answer is *reset the developer database to the compacted
  version*, and that sentence is only enforceable once the counter is what a
  database reports (AC-10).

**Why the ordering migration is safe without a row-by-row migration:** AD-4
records that no deployment exists, so no production rows exist, so AD-18's
total-replacement licence applies. That licence **expires at first deploy** — say
so in the change set rather than leaving it to be re-derived.

**2. The `base_type` collapse stays in Story 20.2, and this story does not touch
`ARTIFACT_BASE_TYPES`.** They coexist cleanly because ordering is orthogonal to
kind:

- The position is a column on every row whatever its `base_type`. Nothing this
  story adds is keyed on the kind vocabulary.
- Every row this story authors uses a value that is **already valid today**: the
  four lyric-page rows are `general`, the four transitional song-position rows are
  `song-set`.
  No new value is admitted and none is retired here.
- `READ_ONLY_BASE_TYPES` is left exactly as it is. It still refuses every
  administrator edit to a `song-set` / `announcement` / `fullscreen-image` row —
  correct for this story, because the only writers here are the bootstrap and the
  existing `PUT`. Loosening it belongs to AD-22's bounded surface (Story 20.7).
- Story 20.2's collapse rewrites `base_type` **and** the payload in one statement
  (AD-18's derived-index rule). It must not touch the position column, and it
  cannot: the position has one home and no payload copy (AC-1).

### Five transitional SongSet entries, named rather than hidden

The planner renders four weekly SongSet groups plus an **unbounded** number of
middle Divine Service hymns (`slide-plan.ts:398-399`, `:464-466`). AD-19's
closed set has no identity for the middle hymns, and the four weekly groups cannot
claim its identities before Story 20.7 changes the form binding and removes
`song1Number..song4Number`. Its answer — *a hymn no slot identity claims is
surfaced, never silently dropped* — is Story 20.7's delivery, not this one's.

So this story creates four separately ordered but non-binding SongSet rows
(`bt-opening-song`, `bt-closing-song`, `ds-opening-song`, `ds-closing-song`) and
keeps the existing `song-set` row as the ds-middle layout source. The planner keeps
its current five SongSet group paths until Story 20.7, while the four fixed positions
point at their corresponding transitional rows. Two things follow, and both must be
written into the change set rather than discovered later:

- These are not AD-19 entries. The four temporary ids deliberately do **not** use
  AD-19's `songset-*` spellings, and `song-set` names a **kind** rather than an
  entry, which AD-19 forbids. AD-19 is `[TARGET]` and its closed-set enforcement is
  not built here, so this is a dated transitional state with a named owner —
  **Story 20.7 removes or migrates all five rows** when its closed set, form binding,
  and unclaimed-hymn behaviour land.
- Because of them, **AD-20 is not fully met at the end of this story.** The five
  SongSet groups still originate from planner rules rather than AD-19 entries. Do
  not claim AD-20 as closed, and do not flip its tag (see *Gate*).

### Guidance for Story 20.7: row ids and AD-19's four spellings

Story 20.1 introduces **no** AD-19 slot identity and no binding key. Story 20.7
introduces all four `songset-*` identities in the same change set that deletes
`song1Number..song4Number`, as AD-19 requires.

For that story, an `artifact_templates` row id is a stable kebab-case primary key —
unique by construction, server-owned, semantic rather than ordinal, and exposed by
no authoring surface. Story 20.7 can use those properties to make its chosen slot
identity structural; they do not make a 20.1 temporary id a binding key.

That story must still answer the spine's open question — *"Where a SongSet
slot identity is persisted — in the `base_type` column itself, or in a
discriminator beside it — is a Story 20.2 / 20.7 schema call."* If it persists the
identity in a column beside the row id, that column is a **derived index of the id**
(AD-18's own shape), never a second authority.

### What "sequence, not presence" means

The planner omits an entry today when its weekly value is absent — `verse-reading`,
`special-song`, `sermon`, `sermon-graphic`, `ds-closing-prayer`, `family-youth`,
the announcements header. **Leave every one of those guards where it is.**

AD-20 forbids the planner *injecting* a slide the registry did not ask for. An
omission injects nothing, so the guards are compatible with it; what fills a
required binding, and what happens when it is absent, is the Placeholder Catalog's
question and it is Story 20.5's. Ripping the guards out here would put empty
slides in front of a congregation and would not satisfy any clause of CAP-1.

### The ordered seed

Derived from `buildRequestPlan` at `bcb7349` — **verify each row against the
source before trusting this table.** 38 rows: 28 today, minus `opening-song-cue`
and `closing-song-cue`, plus 12 (4 cue rows, 4 **transitional** song-position rows, 4 lyric-page
Generals). Positions are `0..37`.

| # | Row id | Base type | Note |
| --- | --- | --- | --- |
| 0 | `welcome` | text-placeholder | |
| 1 | `bible-talk-sequence` | general | |
| 2 | `prayer-partners` | general | |
| 3 | `bt-opening-song-cue` | general | **new** — split from `opening-song-cue` |
| 4 | `bt-opening-song` | song-set | **new, transitional** — no AD-19 identity |
| 5 | `verse-reading` | text-placeholder | conditional on weekly value |
| 6 | `opening-prayer` | general | |
| 7 | `bible-talk` | general | |
| 8 | `bt-closing-song-cue` | general | **new** — split from `closing-song-cue` |
| 9 | `bt-closing-song` | song-set | **new, transitional** — no AD-19 identity |
| 10 | `closing-prayer` | general | Bible Talk closing prayer |
| 11 | `break-time` | general | |
| 12 | `ds-sequence` | general | |
| 13 | `bible-verse-contemplation` | text-placeholder | standing defaults when no weekly verse |
| 14 | `ds-opening-song-cue` | general | **new** — split from `opening-song-cue` |
| 15 | `ds-opening-song` | song-set | **new, transitional** — no AD-19 identity |
| 16 | `intercessory-prayer` | general | |
| 17 | `intercessory-671-lyric-1` | general | **new** — #671, 1 page |
| 18 | `intercessory-prayer-during` | general | |
| 19 | `intercessory-684-lyric-1` | general | **new** — #684, 1 page |
| 20 | `song-set` | song-set | **transitional** — ds-middle layout source, removed by Story 20.7 |
| 21 | `special-song` | text-placeholder | conditional |
| 22 | `sermon` | text-placeholder | conditional |
| 23 | `sermon-flyer` | fullscreen-image | conditional |
| 24 | `ds-closing-song-cue` | general | **new** — split from `closing-song-cue` |
| 25 | `ds-closing-song` | song-set | **new, transitional** — no AD-19 identity |
| 26 | `closing-prayer-ds` | text-placeholder | conditional |
| 27 | `hope-lyric-1` | general | **new** — *We Have This Hope*, page 1 of 2 |
| 28 | `hope-lyric-2` | general | **new** — *We Have This Hope*, page 2 of 2 |
| 29 | `announcements-header` | general | conditional on flyers |
| 30 | `welcome-repeat` | general | |
| 31 | `offering-tithe` | general | |
| 32 | `midweek-prayer` | general | |
| 33 | `fellowship-etiquette` | general | |
| 34 | `contact` | general | |
| 35 | `family-youth` | mix-placeholder | conditional |
| 36 | `announcement-flyer` | announcement | one row, expands to N |
| 37 | `thank-you` | general | |

If the implementation lands on a different count, say why in the change set
rather than adjusting this table silently.

### The three suppressed songs, verified against the source

The Epic 19 table is *the only record* of these call sites, and it was corrected
once. Re-verified at `bcb7349`:

| Site | Group | Song | Why the title was suppressed |
| --- | --- | --- | --- |
| `slide-plan.ts:438` | `intercessory-671` | SDAH #671, standing response **before** the intercessory prayer | The congregation is already standing and sings straight in; announcing a number breaks the prayer |
| `slide-plan.ts:460` | `intercessory-684` | SDAH #684, standing response **after** it | Same reason |
| `slide-plan.ts:550` | `hope` | closing *We Have This Hope* (`weHaveThisHopeFixed`) | A fixed song needs no introduction |

**`:460` is `intercessory-684`, not *"Around the Special Song"*.** No `skipTitle`
site touches the Special Song at all. The two remaining sites are the option
declaration (`:140`) and its branch (`:148`).

None of the three is one of the four weekly slots. All three are songs the planner
injects itself, which is why AD-20 moves the **choice of song** into data and not
merely the suppression flag.

### What moving those lyrics into the seed costs, stated before it is paid

The spine names all of this as this story's to absorb:

- Those lyrics **stop passing the FR-5 verse/Reff splitter**. The four authored
  pages are frozen at authoring time.
- They **stop tracking corrections to the song-book corpus**. A corrected #671
  reaches `hymns` on the next boot (AD-25) and never reaches the seed. That is a
  second source of truth for the same text, accepted deliberately.
- **NFR-3 becomes measurably weaker for those four slides.** Its stated mechanism
  is FR-5's splitting rules, and nothing else checks hand-authored lyric
  readability. AC-5's byte-for-byte requirement is what stands in for it: the
  authored pages are exactly what the splitter produces today, so this story does
  not make a single page less readable than it is now. A later edit to those four
  rows has no such protection — that is the residual cost.
- The seed now carries SDAH text outside the corpus, so it carries the same
  copyright exposure the corpus does. That exposure is already the owner's
  recorded accepted risk (2026-08-01, Story 22.1): `data/song-book/sdah.json`
  states in its own `licence` field that no permission was sought or granted, that
  the text ships only so the software can resolve a hymn offline, and that any
  rights holder may have it removed on request. Point at that statement; do not
  write a new one and do not imply a cleared licence.

Not new exposure, and worth knowing before this reads as a first: SDAH lyric text
is already tracked in this repository twice — the full corpus at
`data/song-book/sdah.json` and two verses hardcoded at `src/lib/lyrics.ts:19-41`.

### Gate — the spine is not edited by this story

Four spine statements go stale when this lands, and repairing them is a
`bmad-architecture` **Update** run, not an edit made from here. Never renumber an
existing `AD-n`.

1. *Deferred*: *"AD-21's counter does not exist yet, and no story owns introducing
   it."* This story owns it (AC-9, AC-10).
2. *Deferred*: *"`seed_hash` and the self-healing reseed path become work without a
   job"* — retired here (AC-7).
3. *Deferred*: *"`artifact_templates` has **no ordering column**"* — false after
   AC-1. The other two items in that bullet (no create/delete/reorder verb, no
   Placeholder Catalog, no `songset-*` identities in `src/`) stay true; only the
   ordering half moves. This story introduces no `songset-*` spelling.
4. **Tag flips are the Update run's, not this story's.** AD-17 and AD-21 become
   satisfiable here; **AD-20 does not** — the five transitional SongSet entries
   above are a named gap. Do not set any `[TARGET]` to `[ADOPTED]` from inside this change
   set.

A fifth item is a citation repair rather than a decision: `slide-kinds.md`'s
*Badge display* still records the `[song-set]`-vs-`[songset-bt-open]` chip as
open and routes it to `EXPERIENCE.md`, which **decided it on 2026-07-31** —
the chip names the kind. Story 20.3 owns the chip; this story owns nothing there
and should not silently rely on the stale marker.

### Implementation guardrails

- **`buildSlidePlan` stays the single order source (AD-7).** What changes is where
  its sequence comes from, never that there is one. No surface may recompute order.
- **No renderer reads the registry (AD-12).** The plan is a fully hydrated Fat
  Payload; `pptx.ts` importing `isBundledAssetRef` from `registry/asset-safety` is
  the AD-8 helper and is not a data path.
- **Module boundaries are load-bearing.** `src/lib/registry/*` is storage and
  validation, `src/lib/artifacts/*` is hydration and the runtime contract,
  `src/lib/services/*` carries AD-6's precondition. Stale writes are signalled two
  ways already (`RegistryStaleError` thrown in the store, a result returned in the
  services layer) — **a third enforcement site must not appear.**
- **Every write into the registry validates under AD-15**, the bootstrap included.
  The seeder is not exempt.
- **No new route, so no authorization surface.** `/admin/artifacts` and
  `/api/admin/artifacts/**` are already inside `src/proxy.ts`'s matcher (AD-5,
  AD-14). Do not add a route here; if one is ever added it ships with its
  `tests/proxy-matcher.test.mjs` assertion and an in-route `requireAdminSession`
  in the same change set. Story 20.3 is where that comes due, not this story.
- **No new write path, so no new stale-write shape (AD-6).** The existing `PUT`
  keeps `expectedUpdatedAt` / `RegistryStaleError`. Reordering is not a verb yet;
  when Story 20.3 adds it, a whole-list renumber runs in one transaction and must
  not leave a transient duplicate visible — which is why AC-1 pins the invariant on
  the persisted set rather than on a database constraint.
- **Image refs resolve only through the shared helpers (AD-8).** The four new
  General rows reuse `/assets/song-lyric-bg.jpeg`, which is already committed under
  `public/`. Do not add a new asset, a `data:` URI or a remote reference.
- **better-sqlite3 is synchronous and server-only**; the whole registry is read
  once per plan build and handed to hydration as an in-memory map. Do not move that
  read per-slide.
- **Schema changes go through the startup DDL on the `getDb` path (AD-9).** No
  Prisma, no migration directory, no second bootstrap path.
- **The seeder takes `BEGIN IMMEDIATE`, not the default deferred begin.** That is
  deliberate — `src/lib/registry/seed.ts:150-157` explains why (maintenance scripts
  open the same file, and a deferred transaction upgrading to a write lock fails
  with `SQLITE_BUSY_SNAPSHOT`, which `busy_timeout` does not retry). Preserve it.
- **`WPW_USE_SHIPPED_REGISTRY=1` inverts the two-layer seed precedence** for tests
  and fidelity smokes (`seed.ts:39`) and nothing else may. Registry tests that
  assert shipped content must set it.
- **`npm run lint` is not expected to be zero** — the clean-checkout baseline was
  31 problems on 2026-08-01. Compare against `HEAD`, not against zero, and a number
  in the thousands means an agent worktree was linted rather than the repo.
- Next 16's App Router differs from common training data. Read
  `node_modules/next/dist/docs/` before changing any Next API usage. `package.json`
  is version authority over architecture prose.

### Testing requirements

- `node:test` + `node:assert/strict` under `tests/*.test.mjs`, imported through
  `--import ./tests/register-ts-resolve.mjs --experimental-strip-types`. No Jest,
  no Vitest, no second runner.
- DB-touching tests set a temporary `DB_PATH` **before** importing `getDb`, and
  restore every `process.env` mutation in the same suite. Follow
  `tests/registry.test.mjs` and `tests/registry-reseed.test.mjs`.
- The order-change test in AC-2 must go through a **built plan**, not through the
  store: swap two positions, rebuild, assert the flattened order moved. A store-only
  assertion proves the column changed and says nothing about the deck.
- The deleted-row test in AC-7 must likewise assert against a built plan. The
  resurrection this closes happened at plan-build time, not at boot.
- Prove each guard reacts. This repository has shipped guards that read the wrong
  branch and guards that exempted the directory they were written for.
- `tests/registry-seed-conformance.test.mjs` and `tests/registry-assets.test.mjs`
  both read the shipped seed and will move with a 38-row file — update them, do not
  loosen them.
- Never hand-edit `package-lock.json`. A text-level search-and-replace across
  tracked files must exclude it.

### Previous-story and Git intelligence

- This is the first Story 20 file, so there is no Epic 20 implementation to
  inherit. Epic 16 shipped the registry itself (Stories 16.1–16.5); only 16.1 has a
  story file, and `spec-16-2-artifact-pipeline-completion.md` is the delivery
  contract for 16.2–16.5.
- The last five commits at `bcb7349` are agent-tooling changes (a `bmad-auto-run`
  skill added and reverted) and touch no product source. Nothing to inherit from
  them.
- Story 23.1 is the nearest precedent for a change set that authors committed
  fixture data in a public repository: it kept the fixture in code, ran the guard
  unchanged, and proved a changed guard rejects the defect it claims to catch.
- Story 22.1 established `data/song-book/sdah.json` with its `licence` /
  `attribution` fields; Story 22.3 moves that path to
  `data/<locale>/song-book/<code>.json` and is still backlog. **Use the current
  path**, and route it through `src/lib/corpus.ts`, which is the one owner of both
  corpus paths — do not pre-empt the FR-24 spelling.

### Project Structure Notes

- Update: `src/lib/db/index.ts` — ordering column DDL, bootstrap marker, data
  version counter, removal of the `seed_hash` backfill block.
- Update: `src/lib/registry/store.ts` — read order, retirement of the automatic
  reseed branch and the gap-filling insert.
- Update: `src/lib/registry/seed.ts` — bootstrap-once gating and its report.
- Update: `src/lib/artifacts/registry-snapshot.ts` — remove the read-time
  substitution loop at `:85-90`; leave `parseRow` and its two `console.error`
  branches alone.
- Update: `src/lib/slide-plan.ts` — sequence from the ordered registry;
  `skipTitle` and `weHaveThisHopeFixed` deleted.
- Update: `src/lib/lyrics.ts` — remove the fixed-song helpers whose only caller is
  gone; keep `INTERCESSORY_STANDING_NUMBERS`.
- Update: `data/default-registry.json` — re-authored as the ordered 38-row list.
- Update: `scripts/smoke-deck-fidelity.mjs` — three source-regex assertions on a
  removed helper.
- Update: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
  — the *Ordered registry list* status cell.
- Update: `package.json` — register any new suite.
- Read before editing: `src/lib/registry/validate.ts`, `src/lib/registry/types.ts`,
  `src/lib/artifacts/hydrate.ts`, `src/lib/artifacts/runtime-contract.ts`,
  `src/components/admin/ArtifactEditor.tsx`, `tests/slide-plan.test.mjs`,
  `tests/registry-reseed.test.mjs`, `tests/registry-seed-conformance.test.mjs`.

### References

- [Source: _bmad-output/specs/spec-artifact-registry-authoring/SPEC.md#Capabilities — CAP-1; #Constraints]
- [Source: _bmad-output/specs/spec-artifact-registry-authoring/authoring-boundaries.md#Order; #Two surfaces (after Correct Course)]
- [Source: _bmad-output/specs/spec-artifact-registry-authoring/slide-kinds.md#SongSet; #Retired as distinct kinds; #Badge display]
- [Source: _bmad-output/specs/spec-artifact-registry-authoring/placeholder-catalog.md#Model]
- [Source: _bmad-output/specs/spec-slide-artifact-model/SPEC.md#Constraints]
- [Source: _bmad-output/specs/spec-slide-artifact-model/registry-contract.md#Registry Ownership and Seed; #Normative Template Shape; #Seed Baseline]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 19: Liturgical rules live in data, not in the planner (retired 2026-07-30); #Epic 20: The registry becomes where the deck is authored; #### Story 20.1: One Ordered Registry]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md#AD-4; #AD-7; #AD-8; #AD-9; #AD-11; #AD-12; #AD-15; #AD-17; #AD-18; #AD-19; #AD-20; #AD-21; #AD-22; #Consistency Conventions; #Deferred]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md#Inside /admin/artifacts: three surfaces, not one]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules; #Testing Rules; #Development Workflow Rules]
- [Source: AGENTS.md#Never commit; #Commit / push audit (mandatory); #Hard rules before non-trivial code]

## Dev Agent Record

### Agent Model Used

claude-sonnet-5 (Claude Code), dispatched via the `bmad-dev-story` skill.

### Debug Log References

- Extracted the exact splitter output for the three fixed liturgical songs
  (#671, #684, "We Have This Hope") by running `splitLyricsLabeled` /
  `splitWeHaveThisHopeSlides` against the real `data/song-book/sdah.json`
  corpus before deleting those functions, to guarantee AC-5's byte-for-byte
  requirement rather than hand-transcribing the text. Confirmed the fallback
  constant and the corpus #214 entry produce identical Verse 1 lines post-trim
  (only Verse 2, which the splitter never reaches, differs), so either source
  was safe to freeze into the seed.
- `npm run build` (Turbopack) then `npm test` — full registered suite green:
  489 passed, 1 skipped (the byte-identity asset test, which self-skips
  because the gitignored source deck is absent on this machine), 0 failed.
- `npm run lint`: 30 problems (15 errors, 15 warnings) — under the recorded
  2026-08-01 baseline of 31; no new lint introduced by this change set.
- Verified `skipTitle` and every `songset-bt-open` / `songset-bt-close` /
  `songset-ds-open` / `songset-ds-close` spelling occur zero times under `src/`
  and `data/` via a direct grep, in addition to the in-suite
  `skipTitle occurs nowhere in src/` test.
- **Fix round 1 (2026-08-07).** Added an AC-2 built-plan position-swap guard,
  made bootstrap reject and roll back malformed positions before either settings
  stamp, and corrected rejected-row logs to say no layout is available. Proved
  the AC-2 guard reacts by temporarily sorting the snapshot by label: it failed
  at `before.indexOf(firstId) < before.indexOf(secondId)`; restored
  `ORDER BY position`, then ran `npm test` (492 total, 491 passed, 0 failed,
  1 skipped) and the public-repository guard (5 passed).

### Completion Notes List

- **AC-1 (position column / read order).** Added `position INTEGER NOT NULL
  DEFAULT 0` to the `artifact_templates` DDL and a matching `ALTER TABLE ...
  ADD COLUMN` migration for pre-existing tables. `listArtifactSummaries` and
  `loadRegistrySnapshot` both now `ORDER BY position`. Position is assigned
  once, at bootstrap, from the seed array's own index — it is never part of
  the template payload, so `ALLOWED_TEMPLATE_KEYS` / `ALLOWED_LAYOUT_KEYS` /
  `schemaVersion` are untouched. `assertContiguousPositions` (new, exported
  from `store.ts`) asserts the `0..N-1` invariant; exercised in
  `tests/registry.test.mjs` after a bootstrap and after a `PUT`.
- **AC-2/AC-3 (ordered snapshot is the sequence source).** `slide-plan.ts`'s
  `buildRequestPlan` no longer holds the deck as a literal series of
  `nodes.push(...)` calls. It now walks `orderedTemplateIds` (the registry
  snapshot's own key order, itself `position`-sorted) and looks each row id up
  in a new `ROW_HANDLERS` map, which owns presence/weekly-value/expansion
  logic per row but never placement. `buildArtifactPlan` / `buildSlidePlan`
  each call `loadRegistrySnapshot()` exactly once per plan build (the
  one-registry-read property is preserved — order and hydration now share
  that one read instead of each doing their own). Verified the four AC-3
  deltas explicitly in `tests/slide-plan.test.mjs` and
  `tests/artifact-hydration.test.mjs`.
- **AC-4 (`skipTitle` deleted).** Removed the option, its branch and all three
  call sites from `slide-plan.ts`, plus `splitWeHaveThisHopeSlides`,
  `WE_HAVE_THIS_HOPE_FALLBACK`, `resolveWeHaveThisHope` and
  `resolveIntercessoryStandingHymns` from `lyrics.ts` — their only callers are
  gone, because the three previously-suppressed songs are now fixed registry
  rows, not planner-resolved hymn lookups. `INTERCESSORY_STANDING_NUMBERS`
  survives (`lyrics.ts`) and still filters #671/#684 out of the weekly hymn
  buckets in `slide-plan.ts`. A dedicated test
  (`skipTitle occurs nowhere in src/`) walks every `.ts`/`.tsx` file under
  `src/` and asserts zero occurrences.
- **AC-5 (four General lyric-page rows).** Added `intercessory-671-lyric-1`,
  `intercessory-684-lyric-1`, `hope-lyric-1`, `hope-lyric-2` to the seed, each
  a `general` template whose single fixed `text` element carries byte-for-byte
  what the deleted splitters produced (verified against the live corpus — see
  Debug Log). Measured page counts match the story: #671 → 1, #684 → 1, "We
  Have This Hope" → 2.
- **AC-6 (cue split, transitional SongSet rows).** `opening-song-cue` /
  `closing-song-cue` are gone, replaced by `bt-opening-song-cue`,
  `ds-opening-song-cue`, `bt-closing-song-cue`, `ds-closing-song-cue` (layout
  copied verbatim). Added `bt-opening-song`, `bt-closing-song`,
  `ds-opening-song`, `ds-closing-song` as clones of `song-set`'s `title` /
  `lyric` layouts — none uses an AD-19 `songset-*` spelling. `song-set` itself
  is untouched and stays the ds-middle layout source. `data/asset-map.json`
  updated (four cue entries in place of two) so
  `tests/registry-assets.test.mjs` keeps agreeing with the seed.
  `preview-model.ts`'s SongSet-vs-General label branch was widened from
  `templateId === 'song-set'` to `baseType === 'song-set'`, and its
  `TEMPLATE_LABELS` map gained the new cue/lyric ids — without this, the four
  cloned SongSet rows would have shown raw humanized ids instead of "Song
  Title" / "Song Lyric" in Live Preview, a regression AC-3 does not license.
- **AC-7/AC-8 (retire the resurrect channels).** `reseedArtifactTemplateIfUntouched`
  and `recordSeedHashesForMigratedRows` are deleted from `store.ts`.
  `seed.ts`'s `seedArtifactRegistry` is replaced by `bootstrapArtifactRegistry`,
  gated on a new `artifact_registry_bootstrapped` settings key: it inserts
  every seed row once and never runs again. `registry-snapshot.ts`'s
  `loadRegistrySnapshot` no longer falls back to the seed for *any* id absent
  from a real DB row — the fallback that used to fill genuine gaps and the one
  that silently substituted a seed template for a rejected row were the same
  code path, so removing it satisfies both AC-7 (a delete stays deleted) and
  AC-8 (a corrupt row is never substituted) at once. `slide-plan.ts`'s new
  `hydrateLeafOrOmit` skips (and relies on the already-logged rejection for)
  any request whose template the snapshot has no valid layout for, so a
  corrupt or deleted row's slide is omitted from the built plan rather than
  crashing it. `scripts/registry-doctor.mjs`'s diagnosis was rewritten from
  the retired outcome set (`already-current` / `auto-reseed-on-restart` /
  `KEPT-*`) to a direct `missing` / `current` / `edited` comparison — there is
  no automatic reseed left for it to describe. `--apply` still resets an
  `edited` row via `resetArtifactTemplate`, unchanged.
- **AC-9/AC-10 (data version counter).** `getDb()` now runs, in order: startup
  DDL → `repairPreCounterArtifactRegistry` (new, exported, the pre-counter
  repair transition) → corpus reconcile → `bootstrapArtifactRegistry`. The
  bootstrap marker and `data_version` are stamped together in the bootstrap's
  own transaction (`seed.ts`). `artifact_seed_hash_backfilled` and its
  backfill block are deleted from `db/index.ts`. `tests/registry-reseed.test.mjs`
  proves the order two ways: calling `bootstrapArtifactRegistry` before
  `repairPreCounterArtifactRegistry` on a synthetic pre-counter database
  produces a database `assertContiguousPositions` rejects, permanently (the
  bootstrap's own version stamp disarms the repair behind it); calling them in
  the documented order, or booting the real `getDb()`, produces the clean
  38-row `0..37` shape. The AC-10 dev-facing note lives in
  `repairPreCounterArtifactRegistry`'s doc comment and its `console.info` at
  the moment it fires — a developer with a pre-20.1 `data.db` sees it on their
  very next boot, and it states the AD-4/AD-18 licence and that it expires at
  first deploy.
- **AC-11 (public-repository rules).** No new asset, no `data:` URI, no
  payload-bearing text: the four new lyric-page rows carry SDAH corpus text
  (#671, #684) or the already-fallback "We Have This Hope" text, both already
  covered by the 2026-08-01 accepted-risk position on
  `data/song-book/sdah.json`. `tests/public-repo-guard.test.mjs` and
  `tests/asset-map-evidence.test.mjs` are unmodified and green.
- **AC-12 (sync the falsified artifact).** `EXPERIENCE.md`'s *Ordered registry
  list* row corrected: `artifact_templates` now has an ordering column and the
  list is sorted by it; the missing create/delete/reorder verbs remain
  missing and the owner stays Story 20.3.
- **AC-13 (guards proved to react, suites registered).** No new test *files*
  were added — every new guard landed in an already-registered suite
  (`tests/registry.test.mjs`, `tests/registry-reseed.test.mjs`), so
  `package.json`'s `scripts.test` needed no edit. Guards were proved to react
  during development (AC-1's position-invariant helper thrown against a
  deliberately duplicated position; AC-8's validation guard against an
  injected corrupt payload; AC-9's step-order guard against a deliberately
  wrong call order) before being left in the passing state committed here.
- **Gate honored.** `ARCHITECTURE-SPINE.md` was not edited and no `[TARGET]`
  tag was flipped. AD-20 is explicitly not closed by this story; the five
  transitional SongSet rows are named as Story 20.7's gap in both the seed's
  own Dev Notes and this record.
- **Nothing left undone against the story's ACs.** All 13 acceptance criteria
  are implemented and covered by tests; the full suite and the public-repo
  guard are green.
- **Fix round 1 review follow-ups.** AC-2 now swaps `offering-tithe` and
  `midweek-prayer` directly in SQL and proves the flattened `buildSlidePlan`
  order moves. Bootstrap calls `assertContiguousPositions` inside its immediate
  transaction before marker/version writes; two regression cases prove malformed
  pre-counter rows roll back inserts and leave both settings keys absent. The
  two `parseRow` errors now state that the persisted row was rejected and no
  layout is available, and the corrupt-row test rejects any `falling back`
  wording. AC-7's pre-existing deletion test was verified to already rebuild a
  plan and assert the deleted row is absent, so it was intentionally unchanged.

### File List

- `data/default-registry.json` — re-authored as the ordered 38-row seed
- `data/asset-map.json` — four cue-template entries replace the two shared ones
- `src/lib/db/index.ts` — position column DDL/migration, `getDb` step reorder,
  `repairPreCounterArtifactRegistry`, `seed_hash` backfill removed
- `src/lib/registry/store.ts` — position-ordered `listArtifactSummaries`,
  `assertContiguousPositions`, `insertArtifactTemplateIfMissing` takes a
  position, `reseedArtifactTemplateIfUntouched` /
  `recordSeedHashesForMigratedRows` removed
- `src/lib/registry/seed.ts` — `bootstrapArtifactRegistry` (bootstrap-once,
  replaces `seedArtifactRegistry`), `ARTIFACT_REGISTRY_BOOTSTRAP_KEY` /
  `DATA_VERSION_KEY` / `CURRENT_DATA_VERSION`
- `src/lib/artifacts/registry-snapshot.ts` — position-ordered read, read-time
  seed-fallback loop removed entirely (AC-7, AC-8)
- `src/lib/slide-plan.ts` — `buildRequestPlan` rewritten around `ROW_HANDLERS`
  keyed by registry row id and an ordered-id walk; `skipTitle` and the fixed-
  song machinery deleted; `hydrateLeafOrOmit` added
- `src/lib/lyrics.ts` — `splitWeHaveThisHopeSlides`,
  `WE_HAVE_THIS_HOPE_FALLBACK`, `resolveWeHaveThisHope`,
  `resolveIntercessoryStandingHymns` removed; `INTERCESSORY_STANDING_NUMBERS`
  kept
- `src/lib/artifacts/preview-model.ts` — SongSet label branch keyed on
  `baseType`; `TEMPLATE_LABELS` updated for the split cue/lyric rows
- `scripts/smoke-deck-fidelity.mjs` — three regex assertions updated for the
  deleted helper and the `ROW_HANDLERS` ternary shape
- `scripts/registry-doctor.mjs` — retired the automatic-reseed diagnosis
  (`missing` / `already-current` / `KEPT-*`) in favor of a direct
  `missing` / `current` / `edited` comparison, since there is no automatic
  path left to describe (AC-7); `--apply` still resets `edited` rows via
  `resetArtifactTemplate`
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
  — *Ordered registry list* status cell corrected
- `tests/slide-plan.test.mjs` — rewrote the fixed-liturgical-song test for the
  General-row shape; added the `skipTitle` absence test
- `tests/registry.test.mjs` — rewrote the self-heal test for bootstrap-once;
  exact 38-row count with position ordering; added the position-invariant test
- `tests/registry-reseed.test.mjs` — rewritten for bootstrap-once, AC-8's
  fail-closed guard, and the `getDb` step-order proof (self-heal cases removed
  as testing retired functionality)
- `tests/artifact-hydration.test.mjs` — SongSet group check keyed on
  `baseType`; intercessory/hope groups replaced by fixed-leaf assertions
- `tests/artifact-preview.test.mjs` — same `baseType` fix; intercessory-671
  group assertion replaced with a fixed-leaf assertion
- `tests/lyrics.test.mjs` — removed the two CAP-4 cases covering the deleted
  splitter
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `20-1-ordered-registry` → `review`
- `_bmad-output/implementation-artifacts/stories/20-1-ordered-registry.md` — this story file
