# Reviewer Gate — Adversarial Two-Units lens

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Intent:** Validate (report only — no spine or project file was edited)
**Date:** 2026-07-30
**Lens:** adversarial two-units — construct pairs of story-sized units that each obey every AD to the letter and still build incompatibly.

**Independence:** the spine was read in full; `reviews/` in this run folder and both `.memlog.md` files were not opened. Every attack below was re-derived from the spine plus `src/`, `_bmad-output/planning-artifacts/epics.md` (Epic 20) and `sprint-status.yaml`.

**Units used as builders** (Epic 20 stories, all `backlog`, all independently buildable):

| Unit | Story |
| --- | --- |
| **U1** | 20.1 One Ordered Registry — ordering column + ordered sequence into `buildSlidePlan`; seed authoring |
| **U2** | 20.2 Three Slide Kinds — the seven→three collapse, `[kind] label` list |
| **U3** | 20.3 Add / Delete / Rename / Reorder — the new admin verbs |
| **U4** | 20.4 General canvas authoring |
| **U5** | 20.5 Placeholder Catalog |
| **U6** | 20.6 Announcement expands to N |
| **U7** | 20.7 SongSet slots + worship-service settings binding |
| **U8** | 20.8 Service clone + Sync Artifact |
| **U9** | the AD-21 data-version migration — *no story owns it* (spine, Deferred) |
| **U0** | shipped code that Epic 20 does not rewrite: `src/lib/parsed-fields.ts`, `src/lib/announcements.ts`, presenter/projector, PPTX route |

**Verdict:** REQUEST CHANGES — 3 CRITICAL, 6 HIGH, 3 MEDIUM, 2 LOW.

---

## Ranked pairs

### P1 — CRITICAL — `base_type` and `label` are persisted twice, and two units read different copies

**Units:** **U9** (the AD-21 data-version migration) × **U1/U2** (ordered-registry read path and the `[kind] label` list).

**Exact AD text each is reading.**
U9 reads AD-18: *"A shipped change that must reach rows already persisted travels as an **explicit, one-time migration** on the startup path, versioned per AD-21"*, with **Binds: the `base_type` value set**. It also reads AD-9: *"schema changes go through the app's startup DDL on the `getDb` path"* and AD-21: *"This is a counter and a convention, not a framework"*. The plainest compliant implementation of "a value migration, no framework" is one SQL statement on the `getDb` path: `UPDATE artifact_templates SET base_type = 'general' WHERE base_type IN ('text-placeholder','image-placeholder','mix-placeholder')`.
U1/U2 read AD-12: *"`buildSlidePlan` outputs a fully hydrated AST"* and AD-14-as-repointed: *"planners and renderers read the registry through server-side modules"* — i.e. through `loadRegistrySnapshot`.

**The incompatible legal choice.** `base_type` exists in **two places** in the shipped row and the spine names neither: the `base_type` **column** (`src/lib/db/index.ts:178-185`) and `baseType` **inside the `payload` JSON** (`store.ts:238-269` writes both from the same validated object, so they agree only by convention). The two readers are split:

- `listArtifactSummaries` (`store.ts:74-92`) reads the **column** — and derives `editable` from it.
- `rowToStored` / `getArtifactTemplate` (`store.ts:35-38`, `94-106`) and `parseRow` in `registry-snapshot.ts:41-64` read the **payload**. `parseRow` runs `validateArtifactTemplate(JSON.parse(row.payload))` and returns only the six `ALLOWED_TEMPLATE_KEYS`; the column is never consulted.

`label` has the same split (column in the list, payload in the editor and in `ArtifactInstance.label`).

**Concrete symptom.** U9 ships the seven→three collapse as column SQL. After deploy:
- `/admin/artifacts` lists a row as `[general] Welcome` (column) and shows it **editable**.
- `buildSlidePlan` hydrates the same row as `text-placeholder` (payload) — so `enforceBaseTypeRules` still demands text placeholders, and the deck renders the pre-collapse layout.
- Opening that row in the canvas editor throws `RegistryValidationError('Template base type is read-only')` from `store.ts:226` for any row whose *payload* still says `song-set`/`announcement`, while the list says editable.
- `assertStableAgainstSeed` (`store.ts:127`) compares `incoming.baseType` (payload) against the **new** seed's `baseType` and refuses every save with `baseType cannot be changed`.

Nothing logs, nothing 409s. The admin's screen and the congregation's screen disagree about what kind every row is, and the disagreement is undetectable from either one.

**Proposed AD clause** (tighten AD-18):
> A registry value that is persisted in more than one place has exactly one authoritative copy, named here: the row's `payload` JSON is authoritative for every template field, and any column duplicating a payload field (`label`, `base_type`, and any slot discriminator) is a derived index maintained by the same write. A value migration therefore rewrites the payload and re-derives the columns from it in the same statement; a migration that writes a column alone is refused by a test that asserts column and payload agree for every row.

---

### P2 — CRITICAL — the read path resurrects a deleted entry from the seed, which is the exact failure AD-17 exists to forbid

**Units:** **U3** (delete verb) × **U8** (clone-on-create) / **U1** (ordered read path).

**Exact AD text each is reading.**
U3 reads AD-17: *"after it has run, **boot** never inserts, re-seeds, relabels or reorders a registry row; the administrator owns every row that exists"*, and CAP-2. A delete is `DELETE FROM artifact_templates WHERE id = ?`. AD-17 is satisfied: **boot** inserts nothing.
U8/U1 read AD-16: *"Creating a worship service **clones** the ordered live registry"* and AD-11: *"Filesystem JSON serves exclusively as a startup seed"*. The one existing "read the whole registry once" helper is `loadRegistrySnapshot()` (`src/lib/artifacts/registry-snapshot.ts:71-99`), which both the clone and the plan will naturally reuse — AD-12 requires one read per plan build, and this is it.

**The incompatible legal choice.** `loadRegistrySnapshot` fills gaps from the seed at **read** time, not boot time:

```ts
for (const seed of loadSeedTemplates()) {
  if (!snapshot.has(seed.id)) {
    snapshot.set(seed.id, { ...seed, updatedAt: SEED_FALLBACK_UPDATED_AT });
  }
  rejected.delete(seed.id);   // <- also suppresses the only log line
}
```

AD-17's prohibition is scoped to *boot* and to the *seeder*. A reader who takes AD-11 literally ("the seed is where a layout comes from when no row holds one") keeps this fallback; a reader who takes AD-17's *intent* removes it. Both are textually compliant, and this is precisely the AD-11↔AD-17 supersession seam: AD-11's superseded-in-part note names **only** the *"startup inserts missing template IDs"* clause, so the read-time fallback is not covered by the supersession at all.

**Concrete symptom.** The administrator deletes the `break-time` entry from the ordered registry because the church stopped doing it. `DELETE` succeeds; the list shows it gone. On the next plan build `loadRegistrySnapshot` re-supplies `break-time` from `data/default-registry.json`, so:
- the slide is still in the PPTX, the slideshow, the presenter and on the projector — every single week, forever;
- `rejected.delete(seed.id)` means **no log line at all**;
- `listArtifactSummaries` reads only the DB, so the admin list shows N rows while the deck contains N+k. CAP-1's *"one ordered registry defines which slides exist"* is false in both directions, silently.
- Under U8, the clone-on-create writes the resurrected row into **every new service's snapshot**, so Sync cannot clear it either.

This is live today for any absent row, and it is the single most direct contradiction of AD-17's stated Prevents.

**Proposed AD clause** (tighten AD-17):
> The filesystem seed is read at exactly two moments — the first-boot bootstrap and an explicit per-template Reset — and at no other. No read path may substitute a seed template for a row that is absent from the database: an ordered registry with N rows produces a deck built from those N rows and no others, and a template id the database does not hold does not exist. `tests/registry-reseed.test.mjs`'s assertion that a missing row is re-inserted is inverted rather than deleted, and a second assertion pins that a deleted row does not reappear in a built plan.

---

### P3 — CRITICAL — the hymn number gets two owners, spelled ordinally in one and semantically in the other

**Units:** **U7** (SongSet slots + worship-service settings binding) × **U0** (`parsed-fields.ts` structured overlay + FR-12 webhook corrections).

**Exact AD text each is reading.**
U7 reads AD-19: *"that identity **is** the key the worship-service settings form binds a hymnal number to"*, and *"the identity is a **semantic name, never an ordinal** (`songset1` re-imports the positional reading this decision exists to remove)"*, and CAP-8 *"four SongSet slots with backgrounds and per-slot hymn numbers"*.
U0 reads the **State** convention: *"only that service's own mutation path changes it — an operator form edit (FR-11) or an authorized webhook correction (FR-12)"*, and AD-3: *"the API must expose a standard JSON interface … agnostic to the input mechanism"* — so intake JSON cannot carry registry slot keys, and hymn numbers must keep arriving as rundown text.

**The incompatible legal choice.** The value now has two writable homes and neither AD makes one authoritative:

- **Home A (shipped):** `parsed_data.items`. The form fields are literally ordinals — `song1Number … song4Number` (`src/lib/worship-form-fields.ts:6-9`, `src/lib/parsed-fields.ts:20-23`), mapped positionally at `parsed-fields.ts:418-421` (`{ key: 'song1Number', slot: 0 } …`) and inserted by `insertHymnInSection`. `readSongOverlayNumbers` hydrates the form back out of `bucketHymnsBySection`. The webhook correction path re-parses and rewrites `parsed_data` wholesale (`update-service.ts`).
- **Home B (U7):** a per-service binding keyed by `songset-bt-open | songset-bt-close | songset-ds-open | songset-ds-close`, which AD-19 says *is* the key.

AD-19 bans the ordinal spelling for the **registry identity** and says nothing about the four ordinal form fields that already exist and already persist. So U7 can add Home B in full compliance, and U0 keeps Home A in full compliance, and no AD says which one `buildSlidePlan` reads.

**Concrete symptom.** Wednesday: the operator sets the Divine Service opening hymn to 245 in the worship form (Home A) *and* U7's settings surface writes `songset-ds-open = 245` (Home B). Friday: the picoclaw agent posts an authorized FR-12 correction — the DS opening hymn is now 312. `updateService` re-parses and rewrites `parsed_data`, so Home A = 312. Home B is untouched: nothing in the webhook path knows the slot keys exist (AD-3 forbids it knowing).

Sabbath: the deck renders **245** (plan reads Home B per CAP-8); the run sheet and the edit form show **312** (both read `bucketHymnsBySection`). The operator reopens the form, sees 312, changes nothing, saves — `applyStructuredFields` rewrites Home A to 312 again and the deck still shows 245. There is no 409, no log, and no surface on which the two values are visible together.

**Proposed AD clause** (new AD, or a *Rule* addition to AD-19):
> A weekly value that a slot binding names has exactly one persisted home, and it is the service's own entered data — the slot binding is a *key into* that data, never a second copy of it. The four `songset-*` identities replace the ordinal field names `song1Number..song4Number` in the same change set that introduces them; the ordinal names are deleted, not aliased, and no code path may hold a hymn number that `buildSlidePlan` does not read. A webhook correction and a form edit therefore write the same field, and AD-6's precondition arbitrates between them as it already does.

---

### P4 — HIGH — the closed six-key set cannot represent a third Divine Service hymn, and the two units disagree about whether that is a drop or a crash

**Units:** **U7** (four slots, exactly) × **U1/U2** (ordered registry as the sequence source; kind dispatch).

**Exact AD text each is reading.**
U7 reads AD-19: *"**The recognized set is therefore closed and complete** — `general`, the four `songset-*` slots, `announcement`: six keys over three kinds, and no write path admits a seventh"* and *"Extending the vocabulary — a fifth slot, a fourth kind — is a code-plus-tests change"*.
U1 reads AD-20: *"**every slide in the deck originates from an ordered registry entry**"* and AD-7: *"`buildSlidePlan` is the single source of slide order and content for every surface"*.

**The incompatible legal choice.** The shipped planner renders an *unbounded* number of song groups: `dsMiddle = divineServiceHymns.slice(1, -1)` at `slide-plan.ts:399` and `dsMiddle.forEach(... pushSongGroup(nodes, hymn, 'ds-middle-'+idx))` at `464-466`, all against `templateId: 'song-set'`. There are exactly four registry slots and no fifth. So U1, obeying AD-20, can only emit slides for entries that exist — the middle songs vanish. U7, obeying AD-19, cannot add a slot for them. Neither unit violates anything; the *composition* silently loses input data.

A second, sharper edge in the same pair: the shipped form's `song4Number` maps to `divineServiceHymns[1]` (`parsed-fields.ts:421`, slot 3), while the shipped planner's closing song is `divineServiceHymns[divineServiceHymns.length - 1]` (`slide-plan.ts:394-397`). With three DS hymns those are **different songs**. Whichever of them U7 binds to `songset-ds-close`, the other reading is defensible from the same text.

**Concrete symptom.** A rundown lists three Divine Service hymns (a normal week with a congregational response). After Epic 20:
- the third hymn produces no slides at all — no title, no lyrics — and nothing tells anyone: the ordered registry has four song rows and it rendered four songs, so every invariant reports healthy. The congregation is asked to sing a hymn that is not on the screen;
- **or**, if U1 instead treats an unmatched rundown hymn as an error (equally compliant with AD-20's "every slide originates from an entry"), the whole plan build throws and the projector shows *Slides unavailable* — for a rundown that works today.

Which of those two happens is decided by whichever developer types first.

**Proposed AD clause** (extend AD-19):
> The recognized set being closed is a statement about the registry, not about the rundown: a hymn in the service's entered data that no slot identity claims is **surfaced, never dropped and never fatal**. `buildSlidePlan` emits no slide for it and the service surface reports it as unclaimed weekly data, in the same channel NFR-5 uses for unmapped input. The mapping from each `songset-*` identity to its position in the parsed rundown is fixed in one table in one module, and a rundown carrying more hymns than there are slots is a reported condition rather than an inference.

---

### P5 — HIGH — AD-21's counter has no defined value on a database that has never carried it, and no fixed order against AD-17's seeder

**Units:** **U1** (the first-boot seeder) × **U9** (the version counter and the v0→v1 transition).

**Exact AD text each is reading.**
U1 reads AD-17: *"The seeder initialises data **from zero only** — first install, first run — and is gated by a marker in `settings`"*.
U9 reads AD-21: *"All persisted data shares **one monotonic version number** in `settings`"*, *"A change that must reach data already persisted is declared **explicitly while it is being coded**, as the transition from version *n* to *n+1*"*, and AD-18: *"Epic 20's seven-`base_type`-to-three-kind collapse ships as a **total replacement** … folding into production data version 1"*.

**The incompatible legal choice.** AD-21 fixes that there is one counter and that released versions freeze. It never fixes (a) what the counter reads as when the key is absent, (b) who writes it on a fresh install, or (c) whether the seeder runs before or after the migrations in `getDb`. AD-21 even goes out of its way to say the seeding marker and the counter are *distinct and neither substitutes for the other* — which guarantees that a first-boot database written by U1 carries the marker and **no** version key at all, because writing the counter is not U1's job by AD-21's own words.

Two compliant choices:
- U9: absent key ⇒ version 0 ⇒ run every declared transition in order. (The obvious, safe-looking implementation.)
- U1: seed current-shape rows and set the marker. (AD-17 to the letter.)

And in `src/lib/db/index.ts` the seeder is called **last** (`seedArtifactRegistry(db)` at line 263, after the existing backfill at 253) — so on today's shipped ordering, migrations run *before* the seed.

**Concrete symptom (fresh production install, first boot).** `getDb` runs the v0→v1 transition — the seven→three collapse — over an `artifact_templates` table that is still **empty**, records version 1, then the seeder inserts four `songset-*` rows plus the Generals. Harmless. Now the second release adds transition 1→2, and a developer, following AD-21's *"unreleased transitions compact into one"*, compacts **the whole of Epic 20** into "version 1" on a machine that already recorded 1 — so 1→2 never runs there and does run in production. Version history stops meaning the same thing on two databases, which is the precise failure AD-21's *Prevents* names.

The mirror case is worse and just as reachable: if any implementer moves the seed **before** the migrations (nothing forbids it — AD-9's Binds and AD-18's Binds both say only "the startup path"), the v0→v1 collapse runs *over the freshly seeded rows*. Its mapping table is keyed on the seven **old** base types, so the four `songset-*` rows hit the default branch: either the boot throws (the hub does not start, at 08:40 on a Sabbath) or the default rewrites all four to `general`, destroying AD-19's *"at most one registry row may carry each slot identity"* by migration, collapsing four bindings onto one row and dropping three songs from the deck.

**Proposed AD clause** (extend AD-21):
> The counter's absence is not version 0. A database created by the AD-17 bootstrap is stamped with the current data version **by the bootstrap itself, in the same transaction as the seeding marker**, and declares itself already migrated; a database that holds registry rows and no version key is a pre-counter database and takes exactly one recorded repair transition. The order on the `getDb` path is fixed and asserted by a test: DDL (AD-9) → data migrations (AD-18) → first-boot bootstrap (AD-17), and a migration never observes rows the bootstrap wrote in the same boot.

---

### P6 — HIGH — AD-22 leaves "administrator config vs developer layout" a schema call, and the shipped validator forecloses one of the two options it offers

**Units:** **U7** (the bounded SongSet configuration surface) × **U9** (a later SongSet layout migration).

**Exact AD text each is reading.**
U7 reads AD-22: *"A `songset-*` row gets a bounded configuration surface … exactly two background images — one for its title layout, one for its lyric layout … plus font style and font size"* and *"**Administrator-configured values must stay distinguishable from developer-authored layout** … whether the distinction is an override record beside the layout or a marked field inside it is a schema call, not an invariant."*
U9 reads AD-22's own last sentence: *"a developer's later change to a SongSet layout reaches a deployed database only as a versioned data migration (AD-21) — never by restart, and not by Reset, which would also discard the administrator's background and font choices (AD-11)."*

**The incompatible legal choice.** AD-22 offers two schemas and lets the story pick. But the *in-layout* option — "a marked field inside it" — cannot be built without a registry-contract change that AD-22 does not authorise: `validate.ts` runs `rejectUnknownKeys` against `ALLOWED_LAYOUT_KEYS` (`aspectRatio`, `backgroundColor`, `backgroundImage`, `elements`) and `ALLOWED_ELEMENT_KEYS`, so any marker field is rejected on every write path, and the spine's own Deferred says adding vocabulary *"is a registry-contract change, not a seed edit."* The only shape U7 can ship without a further decision is therefore to write the administrator's background straight into `layouts.title.backgroundImage` / `layouts.lyric.backgroundImage` and the font into element `style` — **unmarked, indistinguishable from developer-authored layout**, which is exactly the property AD-22 says must hold and does not make anyone responsible for.

U9 then does what AD-22 tells it to: ships a corrected SongSet layout as a versioned migration, i.e. replaces `layouts.title` / `layouts.lyric` for the four slot rows.

**Concrete symptom.** Data version 3 ships a corrected lyric layout (larger verse marker, per the Story 20.1 seed note). On the first boot after deploy the migration rewrites `layouts.lyric` for all four `songset-*` rows. Every background the administrator chose and every font size they set reverts to the shipped default — on all four slots, silently, before anyone opens the hub. AD-11 keeps no second copy and Reset would discard them too, so the values are simply gone; the only record of them was the layout that was just overwritten. The next Sabbath's deck renders on the wrong backgrounds and the operator has no idea why.

**Proposed AD clause** (promote the deferred schema call into AD-22):
> Administrator-configured values on a bounded-surface row are persisted **outside** the layout, as an override record keyed by row and field, and are re-applied over the developer layout at hydration. The layout JSON is developer-owned in full and a migration may replace it wholesale; the override record is administrator-owned in full and no migration, Reset, or re-seed writes it. A bounded surface that writes into the layout is refused by the validator on every write path.

---

### P7 — HIGH — nobody owns who may press Sync Artifact

**Units:** **U8** (Sync Artifact) × **U3** (registry administration).

**Exact AD text each is reading.**
U8 reads AD-16: *"Sync is permitted on **any** service, carries the service's `updated_at` precondition (AD-6)"* — Sync is a *service* mutation, AD-6 governs service mutations, and the operator owns the service (FR-11).
U3 reads AD-14: *"Registry management UI and APIs are admin-only and re-check the current account role from SQLite"*, whose **Prevents** is *"Per-service template drift and **operator-level mutation of every service's visual contract**"*, and whose Binds is `/admin/artifacts`, `/api/admin/artifacts/**`.

**The incompatible legal choice.** AD-14's admin-only clause survived AD-16 untouched — but its Binds names only the two admin paths. Sync lives on a service route (`/api/services/[id]/…`), which `src/proxy.ts` gates for *any* signed-in account: `isAdminPath` is true only for `/admin`, `/admin/*`, `/api/admin*` (`proxy.ts:88-95`). So U8 may legally ship Sync as an operator action, and U3 may legally assume structure is admin-only. The AD-14↔AD-16 seam is exactly where this hides: the clause that was superseded is about *scope*, the clause that survived is about *authorization*, and Sync is the one action that is both.

**Concrete symptom.** Friday evening an admin is mid-way through re-authoring the Offering layout in `/admin/artifacts`. An operator, told their service "looks out of date", clicks **Sync Artifact** on Sabbath's service. AD-6's precondition passes (they hold the current `services.updated_at`), AD-15's validation passes (every template is individually valid), and the half-finished layout is now frozen into the service that presents in fourteen hours — the precise scenario AD-16's *Prevents* opens with. No authorization layer refused it, because Sync is not under `/api/admin/`.

The opposite choice fails the other way: if U8 makes Sync admin-only and the admin is unreachable on Friday, the operator cannot bring the service up to date and AD-16's second Prevents (*"a service with no way to be brought up to date"*) reappears.

**Proposed AD clause** (extend AD-16):
> Sync Artifact is a structural write and is **admin-only**, re-checking the role from SQLite exactly as AD-14 requires of every registry management surface, even though it is reached on a service route; its route ships with the `tests/proxy-matcher.test.mjs` assertion AD-5 demands and an in-route `requireAdminSession`. An operator may *request* a sync and see that their snapshot is stale, but may not perform one.

---

### P8 — HIGH — presenter and projector build the plan independently, and the sync message carries a slide index with no plan identity

**Units:** **U8** (Sync permitted on any service, including one being presented) × **U0** (presenter / projector, AD-10).

**Exact AD text each is reading.**
U8 reads AD-16: *"Sync is permitted on **any** service"*, and the epics note that it is *"permitted on any service including one already presented"*.
U0 reads AD-10: *"presenter↔projector sync goes through the single `@/lib/present-channel` `BroadcastChannel` module; **no surface opens its own channel name or message shape**"* — so the message shape is not the presenter's to extend unilaterally.

**The incompatible legal choice.** The wire carries a bare position: `{ type: 'sync'; index: number; blank; transition }` (`src/lib/present-channel.ts:19-38`). Presenter (`present/page.tsx`) and projector (`present/projector/page.tsx`) are **two separate `force-dynamic` server renders**, each calling `buildSlidePlan` at its own moment. Nothing ties the two arrays to one version of the structure. AD-10 fixes the channel and forbids a second one; AD-16 introduces a mid-service structural mutation; neither says the two windows must agree on which plan `index` indexes.

**Concrete symptom.** The projector window has been open since 08:30. At 09:05 someone syncs the service (or, live today with no Epic 20 at all: an admin saves a registry template, or an operator's edit to *another* service rewrites the announcement master — see P12 — changing the flyer count). The presenter window is reloaded once, so it rebuilds its plan; the projector's plan is the old one. From then on presenter `index: 34` renders the projector's slide 34, which is now a different slide — every slide after the inserted/removed entry is off by one. The operator's own screen shows *Sermon* while the room sees *Special Song*, and the drift is invisible to them because the presenter shows its own copy. There is no mismatch signal and AD-10 forbids inventing a private one.

**Proposed AD clause** (extend AD-10):
> Every `present-channel` message carries a **plan identity** — a fingerprint of the service-bound snapshot and the resolved announcement set that produced the deck — and a receiver whose own identity differs refuses to follow the index and says so on the room-facing screen rather than rendering a slide it cannot vouch for. A structural change to a service (Sync Artifact) or to its announcement membership changes that identity by construction.

---

### P9 — HIGH — an administrator-created row has no seed, so Save 404s and Reset has no meaning

**Units:** **U3** (the add verb) × **U4** (canvas authoring / Save, and Reset).

**Exact AD text each is reading.**
U3 reads CAP-2 and AD-17: *"the administrator owns every row that exists, and the ordered registry is **authored data** rather than shipped data kept in sync."*
U4 reads AD-15: *"**Every** write into the registry is untrusted and must pass the same structural and image-reference validation before persistence — the canvas save API, the startup seeder, and any import or asset-extraction script alike"*, and AD-11: *"Reset restores one selected template from that seed."*

**The incompatible legal choice.** The shipped save path validates against the **seed** as its stability baseline: `updateArtifactTemplate` → `assertStableAgainstSeed` → `getSeedTemplateById(incoming.id)`, which throws `RegistryNotFoundError` for any id the seed file does not contain (`store.ts:122-201`, `seed.ts:162-169`), and the route maps that to **HTTP 404** (`api/admin/artifacts/[id]/route.ts`). U4 reusing that path is fully compliant with AD-15 — it *is* "the same validation". U3 creating rows the seed never had is fully compliant with AD-17. Nothing in the spine says what an administrator-authored row is validated *against*, and the spine's Deferred discusses Reset only as far as *"Reset now reverts a rename"* — it never notices that Reset has no referent at all for a created row.

**Concrete symptom.** The administrator adds a General entry `communion-call`, spends twenty minutes composing it on the canvas, presses Save → `404 Unknown template: communion-call` on a row that is plainly listed in front of them. Story 20.4's own AC (*"a rejected Save keeps the operator's work and names the property"*) cannot be met: no property is named, because the failure is not about a property. And the Reset button, if U4 renders it uniformly, throws the same 404 — while a *seeded* row's Reset silently reverts the administrator's rename (the known deferred surprise). Two rows in one list, two different meanings for the same button, neither documented.

**Proposed AD clause** (extend AD-17):
> An authored row has no seed and is validated against **itself**: the stability baseline for a save is the row's currently persisted state, and the shipped seed is a baseline only for rows the bootstrap wrote. A row with no seed origin exposes no Reset — Reset is defined only where shipped content exists to restore — and the registry records, per row, whether it originated from the bootstrap or from an administrator, because three verbs (Save validation, Reset, and any future re-seed) all need that answer and none of them can infer it.

---

### P10 — MEDIUM — the Placeholder Catalog key set and the planner's value keys are two vocabularies with nothing binding them

**Units:** **U5** (Placeholder Catalog) × **U1/U4** (the planner's supplied values, General authoring).

**Exact AD text each is reading.**
U5 reads AD-19 — *Rule — Placeholder Catalog*: *"the admitted key set is server-side vocabulary enforced on **every** write path … so *'the UI cannot invent a catalog key'* (CAP-4) is a property of the registry rather than of one client"*, and *"Independent of the SongSet clause above."*
U1 reads AD-12: *"`buildSlidePlan` outputs a fully hydrated AST … and resolved text content"* and AD-20: *"`buildSlidePlan` **applies** rules; it does not **hold** them."*

**The incompatible legal choice.** AD-19 makes the catalog key set authoritative against the *canvas editor's insert list* and against *write paths*. It never binds it to the set of keys `buildSlidePlan` actually supplies. Those are, today, `date`, `reference`, `text`, `performer`, `person`, `speaker`, `title`, `familyText`, `youthText`, `familyPhoto`, `youthPhoto`, `hymnNumber`, `songTitle`, `label`, `lyrics`, `imageUrl` (`slide-plan.ts`). The SPEC companion `placeholder-catalog.md` reportedly lists `sermon.speaker`, `familyPrayerRequest`, `serviceDate` — three different casing conventions, none of which is any of the above. AD-19 says the spelling is chosen once (Story 20.5) and is a migration concern thereafter; it does not say *whose* spelling.

There is a second, structural half: `enforceBaseTypeRules` currently refuses placeholders on a General outright (`validate.ts:362-370`, *"General templates cannot have placeholders"*) while `validateLayoutElements` requires every element `placeholderKey` to be declared in `placeholders[]`. So U5 must either loosen the General rule (catalog key ⇒ a `placeholders[]` entry) or add a new element field (catalog key ⇒ element-level, unresolved by `hydrate.ts`). AD-19 and AD-22 are compatible with both.

**Concrete symptom.** The administrator inserts *Sermon Speaker* onto a General. U5 persisted it as `sermon.speaker`; the planner supplies `speaker`. `hydrate.ts:140` resolves nothing; the element is `required: false`, so line 155 **drops it silently** — no throw, no log. The slide renders with an empty space where the speaker's name belongs, identically on the projector and in the PPTX, and the only way to notice is to look at the projector. If U5 instead chose the element-level field, `resolveLayout` never enters the placeholder branch at all (`element.placeholderKey` is falsy at line 119) and renders the literal authoring-time `content` — so a stale name from whenever the layout was authored appears on screen every week.

**Proposed AD clause** (extend AD-19's Placeholder Catalog rule):
> The catalog key set and the set of keys `buildSlidePlan` supplies values for are **one list in one module**, and a test asserts they are identical in both directions: a catalog key the planner never fills, and a planner value no catalog key names, both fail the build. A catalog key resolves through the single hydration point (AD-12) as a declared placeholder; an unresolved catalog key on a rendered slide is a reported condition, never a silently dropped element.

---

### P11 — MEDIUM — the ordered sequence is an entity with no version, so two concurrent reorders both pass AD-6

**Units:** **U3** (reorder verb) × **U3'** (a second admin session, or U8's clone reading order).

**Exact AD text each is reading.** AD-6: *"every service mutation carries the client's `updated_at` as a precondition; a stale value is rejected with HTTP 409 … This covers registry writes"* — the precondition is per-row, because `updated_at` is a column on `artifact_templates` and `updateArtifactTemplate` uses it in the `WHERE` (`store.ts:240-273`). AD-17's Binds names *"the registry's ordering column"*.

**The incompatible legal choice.** The *order* is a property of the collection, and no row's `updated_at` represents it. A compliant reorder may (a) rewrite every row's ordering column, or (b) rewrite only the rows whose position changed — an obvious and legal optimisation, since AD-6 asks for a precondition per write, not per read.

**Concrete symptom.** Admin A moves *Offering* from position 12 to 3; admin B, in another tab, moves *Contact* from 20 to 18. Under choice (b) the two writes touch disjoint rows, so both preconditions are individually satisfied and neither gets a 409 — but A's renumbering assumed B's old positions. The result is an order neither of them chose, with two rows sharing an ordinal; the list then falls back to whatever the secondary sort is (today `ORDER BY label COLLATE NOCASE`, `store.ts:81`) and the **deck order** silently differs from both admins' screens. AD-6's stated Prevents — *"an operator's edit silently erased"* — happens with the mechanism intact.

**Proposed AD clause** (extend AD-6):
> The ordered registry is itself a versioned entity: a reorder carries the **sequence's** version, not the versions of the rows it moves, and is rejected with 409 if any other write has changed the sequence since it was read. Ordering values are dense and rewritten as a whole sequence in one transaction, so two rows can never share a position and no secondary sort key can decide deck order.

---

### P12 — MEDIUM — one service's form edit rewrites the global announcement master under that service's precondition

**Units:** **U6** (Announcement expands from the live master at render time) × **U0** (`syncWorshipAnnouncements`, shipped).

**Exact AD text each is reading.**
U6 reads AD-16: *"**Announcement membership is not cloned:** the Announcements master list stays live and reaches an existing service at render time (CAP-7)"*.
U0 reads the **State** convention: *"only that service's own mutation path changes it — an operator form edit (FR-11)"*, and AD-6's per-service precondition.

**The incompatible legal choice.** `syncWorshipAnnouncements` treats `service_id IS NULL` rows as the **global** master and, when the recurring list changes, executes `DELETE FROM announcement_items WHERE service_id IS NULL` and re-inserts (`announcements.ts:318-344`) — inside `updateService`'s transaction, guarded by **service A's** `updated_at`. AD-6 is satisfied for service A. There is no precondition on the master itself, and no AD names an owner for it: `/announcements` is one owner, every service's form is another.

**Concrete symptom.** Wednesday, an operator prepares next month's service and drops one recurring flyer from the list. That write deletes it from the global master. **This Sabbath's** service — already prepared, already reviewed, its PPTX already downloaded — now builds a deck with one fewer announcement slide. AD-6 cannot 409, because the precondition was on a different service. Combined with P8, if that happens between the projector's render and the presenter's, every index after the announcement block is off by one mid-service. AD-16 deliberately accepts that membership is live; it does not accept that *another service's* edit is a valid way to change it.

**Proposed AD clause** (extend AD-16 / the State convention):
> The Announcements master set is a single owned entity with its own `updated_at`, and every write to it — from the master surface or from any service form — carries that precondition. A service form edit may add or remove that service's own one-offs unconditionally; changing recurring membership is a write to the master and is rejected with 409 when the master has moved, so the operator sees that they are changing every service rather than theirs.

---

### P13 — LOW — AD-19's cross-row uniqueness has no named enforcement point

AD-19 requires *"at most one registry row may carry each slot identity"*; AD-15 routes every write through *"the same structural … validation"*, which is `validateArtifactTemplate` — a **per-template** function that cannot see other rows (`validate.ts:445-515`; `validateArtifactTemplateList` checks only duplicate ids). So U3's add verb, U9's migration, and the deferred asset-extraction importer (*"a second writer into the registry and is bound by AD-15"*) would each have to reimplement uniqueness independently. Symptom: two `songset-ds-open` rows survive an import; the single settings binding hydrates into both, the same hymn is sung twice in the deck, and `listArtifactSummaries` shows two rows whose chips read identically. **Clause:** *"A cross-row registry invariant is enforced by a database constraint, not by a validator: each slot identity carries a partial unique index, so every present and future writer inherits it without restating it."*

### P14 — LOW — one condition, four failure behaviours, and the primary Sabbath surface is the least informative

A plan-build failure renders an attributed message on the projector (`Slides unavailable` + `ArtifactHydrationError.message`), a card on the presenter, `notFound()`-adjacent handling on the slideshow, and a bare `Internal Server Error` text body on the **PPTX** route (`api/services/[id]/pptx/route.ts:67-70`) — which AD-1 designates *"the primary Sabbath path for venue reliability"*. Under Epic 20, plan builds start failing for **data** reasons (an empty slot binding, a deleted row) rather than code reasons, so this becomes an operator-facing path. With the spine's Deferred recording that *"`console.error` on the server is the current floor"*, the operator's only diagnostic at 08:55 is a shell on the home PC. **Clause:** *"A plan that cannot build fails identically on every surface: one attributable, stack-free reason naming the entry and the missing value, surfaced to the operator on the surface they are using — including the PPTX download, which AD-1 makes the surface that must degrade most legibly."*

A closely related gap belongs here rather than as its own pair: AD-19 fixes that a binding whose slot row was **deleted** is *"inert, not an error"*, and says nothing about the mirror case — a slot row that exists with **no hymn number entered**. `hydrate.ts:146` makes that fatal whenever the seed marks the element `required: true`, and the Story 20.1 seed note (an open action item) makes the seed author the person who decides. Symptom: the operator leaves `songset-ds-close` empty on Wednesday and the *entire* deck is unavailable on every surface on Sabbath. The clause above plus AD-19's inertness principle extended to absent values closes it: *"an absent weekly value for a present slot is inert on the same terms as an absent slot — the slide does not appear and the condition is reported; no missing weekly value may make a plan unbuildable."*

---

## Attacks that failed

These were constructed and then defeated by the shipped code or by the spine's own text. They are where the spine is strong.

1. **A renderer reaching the registry directly.** AD-12 says a renderer *"never reaches the registry itself"*. Grepping every `loadRegistrySnapshot` / `requireTemplate` / `hydrateArtifact` call site outside `src/lib/artifacts/` returns **only `src/lib/slide-plan.ts`**. `SlideView.tsx` and `pptx.ts` consume the hydrated AST. AD-12/AD-7 are structurally held, not merely asserted.

2. **A stale cached PPTX served after a Sync.** I expected `pptxCachePath(serviceId)` (`service-<id>.pptx`, no version) to be read on download, so a snapshot change would serve yesterday's deck. It isn't: `api/services/[id]/pptx/route.ts` always calls `generatePptx` and writes the cache afterwards — the cache exists only for FR-10b retention, never as a read path. No staleness is possible.

3. **A second image resolver in the canvas editor.** AD-8 forbids it. `validate.ts` routes both `element.imageRef` and `layout.backgroundImage` through `isRegistryImageRef` (`asset-safety.ts`), and announcements route through `isSafeImageUrl` / `isAnnouncementImageUrl`. Two vocabularies, but both fail-closed and both shared — exactly what AD-8 licenses. I could not construct a compliant pair that admits `data:` or an arbitrary remote URI.

4. **An unvalidated persisted row reaching hydration.** `parseRow` re-runs the full validator on every stored payload before it enters the snapshot and logs the id and reason on rejection. A hand-edited database row cannot reach `hydrate.ts` unvalidated. (Its *fallback* is P2's problem; its validation is sound.)

5. **A registry route escaping the AD-5 gate.** `isAdminPath` covers `/admin`, `/admin/*` and `/api/admin*` by prefix, so U3's new verbs under `/api/admin/artifacts/**` are gated the moment they exist, with no matcher change. AD-5 + AD-14 hold for everything U3 adds. (Sync escapes — but because it is deliberately *not* an admin path; that is P7, an ownership hole, not a gate hole.)

6. **Two units disagreeing about slide ordering within a hydrated layout.** I tried to make the web renderer and PPTX disagree about z-order. `sortElements` (`hydrate.ts:82-87`) sorts by `zIndex` then source index **once, in the plan**, and both renderers consume the resulting array order. `derivedLines` deliberately uses *visual* order for a different purpose and documents why. No divergence available.

7. **A deleted slot row breaking the entered hymn number.** AD-19 already answers this in both directions — the slot does not appear and *"the entered hymnal number survives in the service's own data, which AD-16 requires regardless."* Two compliant units land in the same place. (The mirror case — row present, value absent — is *not* answered; see P14.)

8. **`skipTitle` surviving in one unit and not the other.** I expected AD-20's *"removed rather than migrated"* to leave a window where U1 deletes the flag and some other unit still sets it. It cannot: the only three call sites are literals inside `buildRequestPlan` (`slide-plan.ts:438`, `460`, `550`), nothing persists the flag, and no other module references it. AD-20 is cleanly executable in one change set.

---

## Summary

| # | Severity | Units | Hole |
| --- | --- | --- | --- |
| P1 | CRITICAL | U9 × U1/U2 | `base_type`/`label` persisted twice; migration and read path use different copies |
| P2 | CRITICAL | U3 × U8/U1 | read-time seed fallback resurrects a deleted entry; admin list and deck disagree |
| P3 | CRITICAL | U7 × U0 | two owners of the hymn number, ordinal vs semantic spelling |
| P4 | HIGH | U7 × U1/U2 | closed six-key set cannot represent a third DS hymn |
| P5 | HIGH | U1 × U9 | version counter has no initial value; seed/migration boot order unfixed |
| P6 | HIGH | U7 × U9 | admin config written into the layout is destroyed by a layout migration |
| P7 | HIGH | U8 × U3 | Sync Artifact's authorization owner unassigned |
| P8 | HIGH | U8 × U0 | index-based sync across two independent plan builds |
| P9 | HIGH | U3 × U4 | authored row has no seed: Save 404s, Reset undefined |
| P10 | MEDIUM | U5 × U1/U4 | catalog key set vs planner value keys, unbound |
| P11 | MEDIUM | U3 × U3' | the ordered sequence has no version; two reorders both pass AD-6 |
| P12 | MEDIUM | U6 × U0 | announcement master rewritten under another service's precondition |
| P13 | LOW | U3 × U9 | cross-row slot uniqueness has no enforcement point |
| P14 | LOW | U0 × U1/U7 | one condition, four failure behaviours; PPTX least informative |
