# Reviewer Gate — Adversarial Two-Units Lens (Update B)

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Date:** 2026-07-30 · **Intent:** Update (report only; no spine edit made)
**Lens:** Construct two story-sized units one level down that each obey **every** AD to the letter and still cannot interoperate.
**Independence:** the run folder's `reviews/` and `.memlog.md` were not read. Every attack below was constructed from the spine text plus `src/`.

**Verdict:** the spine holds against most classical two-unit attacks — one order source, one channel, one image-resolver family, one transition table are all genuinely closed. It does **not** hold at the seams the 2026-07-30 pass created: three decisions now describe the same entity (the per-service snapshot, the override record, the announcement master set) without naming who owns it, and one newly added absolute clause (AD-17's read-door) has a loophole wide enough to drive the exact resurrection it forbids through.

**Counts:** 3 CRITICAL · 7 HIGH · 2 MEDIUM

**Units used** (Epic 20 stories, `epics.md:378-405`): 20.1 ordered registry · 20.2 three kinds + collapse migration · 20.3 add/delete/rename/reorder + Reset · 20.4 canvas authoring · 20.5 Placeholder Catalog · 20.6 announcements expansion · 20.7 SongSet slots + bounded config · 20.8 clone + Sync Artifact. Shipped surfaces are used where a live unit is one half of the pair.

---

## P1 — CRITICAL — The Announcements master set has two owners, and neither AD names one

**Units.** *20.6* (Announcement is one entry that expands to N full-bleed images from the master list) and the **shipped service create/edit path** (FR-11 `EditForm` → `updateService` → `syncWorshipAnnouncements`).

**Exact AD text each unit reads.**
- 20.6 reads AD-16: *"**Announcement membership is not cloned:** the Announcements master list stays live and reaches an existing service at render time (CAP-7)."* And CAP-7's row: *"AD-16 (membership deliberately not frozen)"*.
- The service edit path reads the *State* convention: *"A service's **entered data is historical**: only that service's own mutation path changes it — an operator form edit (FR-11)… No registry edit, no **Sync Artifact**, and no value migration may alter a service's stored form input."*

**The incompatible legal choice.** 20.6 treats the master set as a single live global list, correctly, because AD-16 says so. The service edit path treats the announcement rows it renders as *this service's entered data*, correctly, because the *State* convention gives FR-11 that authority — and the announcements are edited on the service form. Neither is wrong. But the master set is **not** a service's entered data and **not** registry-authored, so it falls between the two rules and no AD claims it. The shipped code already resolves the ambiguity in the worst direction: `announcements.ts:334-343` — when the recurring URLs differ from the current master, `syncWorshipAnnouncements` runs `DELETE FROM announcement_items WHERE service_id IS NULL` and re-inserts from **one service's form**. And `PUT /api/announcements` (`announcements.ts:432`) runs `DELETE FROM announcement_items` with no WHERE clause at all, wiping every *other* service's one-offs, with no `updated_at` precondition anywhere on the table (AD-6's own gap paragraph names this table as having no `updated_at` to check).

**Concrete symptom.** Saturday 07:50. The operator opens next month's service to add one recurring flyer, saves. `masterChanged` is true, so every master row is deleted and re-inserted from that form's list. **Today's** service — already prepared, its PPTX already downloaded — now resolves a different flyer set at `resolveAnnouncementUrls`, because that query is `WHERE service_id IS NULL OR service_id = ?` and reads live. The projector's slideshow render picks up the new set; the downloaded deck does not. Who: every service simultaneously. Silent: completely — no 409 (no precondition exists), no log, and no screen on which both flyer sets appear. Live now, not a future risk.

**Sentence to add** (new AD, or a clause on AD-16):
> The Announcements master set (`service_id IS NULL`) is owned by the Announcements surface alone: no service mutation path may insert, delete, reorder or replace a master row, and no surface may delete an announcement row belonging to another service — a write scoped to service *S* touches only rows whose `service_id` is *S*.

---

## P2 — CRITICAL — Is the override record inside the snapshot? Both answers break something the spine forbids

**Units.** *20.7* (SongSet bounded configuration surface: two backgrounds, font style, font size) and *20.8* (service clone + Sync Artifact).

**Exact AD text each unit reads.**
- 20.7 reads AD-22: *"**Administrator-configured values persist outside the layout**, as an **override record keyed by row and field**, re-applied over the developer layout **at hydration**: … the override record stays administrator-owned in full and no migration, Reset, or re-seed writes it."*
- 20.8 reads AD-16: *"Creating a worship service **clones** the ordered live registry — order, kinds, labels, layouts, placeholder bindings — into a **service-bound snapshot**"* and *"a live registry edit reaches an existing service **only** through the explicit **Sync Artifact** action"*, plus AD-12: *"a renderer never **reads data from** the registry itself"* and the *Boundaries* convention putting hydration in `src/lib/artifacts/*`.

**The incompatible legal choice.** AD-16's clone list is an enumeration — *order, kinds, labels, layouts, placeholder bindings*. The override record is none of those five (AD-22 defines it as living *outside* the layout precisely so a migration can replace layouts wholesale). So:
- **Horn A (20.7's reading):** the override is not snapshot state; it is applied at hydration from the live table, exactly as AD-22 says. Legal.
- **Horn B (20.8's reading):** the plan reads the snapshot and only the snapshot; anything the deck renders must therefore be in it. Legal, and required by AD-12/AD-16.

**Concrete symptom, both horns.**
- Horn A: an admin swaps the Divine Service lyric background on Thursday. Every existing service — including tomorrow's, already reviewed and signed off — renders the new background on the projector without any Sync. That is AD-16's own *Prevents* verbatim: *"a live registry edit shifting the structure under a service an operator is preparing right now."* It is also the second structural channel AD-18 explicitly outlaws (*"a migration that rewrote snapshots would be a second structural channel"*). Silent — nothing marks the service stale, because the snapshot did not change.
- Horn B: the override is cloned into the snapshot at create time. But AD-22 also says *"no migration, Reset, or re-seed writes it"* and AD-16 says nothing clones it, so for **every service already in the database** (all of them, per AD-16's no-snapshot migration path) and for any service created before 20.7 lands, the admin's chosen background and font size never reach the deck at all. The admin sets 40pt lyrics for readability; the projector shows the shipped 28pt. Silent — the bounded surface shows the saved value back.

Neither horn is a bug in one unit. The spine does not contain the sentence that picks one.

**Sentence to add** (AD-22, and mirrored into AD-16's clone enumeration):
> The override record is **snapshot state**: the clone and every Sync copy it alongside `layouts`, hydration reads it only from the service's snapshot, and an administrator's later change to it reaches an existing service through Sync Artifact and through no other path.

---

## P3 — CRITICAL — AD-17's read-door closes on *absent* rows and leaves *corrupt* rows wide open

**Units.** *20.1* (ordered registry becomes the sequence source; closes the read-time gap-fill at `registry-snapshot.ts:85-90`) and *20.8* (clone on create, which AD-16 says *"validate[s] under AD-15 like every other"* write).

**Exact AD text each unit reads.**
- Both read AD-17: *"**no read path may substitute a seed template for a row the database does not hold**: an ordered registry of N rows produces a deck built from those N rows and no others, and a template id the database does not hold does not exist."*
- 20.1 also reads *Deferred*: *"**Keep** the per-row corrupt-payload fallback at `:56-63`: a row that fails validation is a different condition from a row that does not exist."*
- 20.8 also reads AD-15: *"**Every** write into the registry is untrusted and must pass the same structural and image-reference validation before persistence."*

**The incompatible legal choice.** AD-17's prohibition is scoped by the words *"a row the database does not hold."* A **corrupt** row *is* held. `parseRow` (`registry-snapshot.ts:41-63`) returns `null` for it, and the very next loop substitutes the shipped seed. The *Deferred* item instructs keeping that fallback. So 20.1 legally keeps substituting shipped content for corrupt authored rows — the one case AD-17's absolute-sounding sentence does not cover. Meanwhile 20.8 must validate the clone, and a row that fails validation cannot be cloned, so the snapshot omits it (or the clone refuses).

**Concrete symptom.** An authored General row's payload is corrupted — a partial write, a botched hand-edit of `data/local/`, a `schemaVersion` bump under AD-21 that a transition half-applied (AD-21 explicitly permits a transition to raise `schemaVersion`). Now:
- Service created **before** Sync (no snapshot): the deck renders the **shipped seed** version of that slide — the placeholder-contact, placeholder-payment example content this repository ships deliberately as synthetic data. On the projector. On a Sabbath. Silently, and `rejected.delete(seed.id)` suppresses even the log line today.
- Service created **after** the clone: that slide is simply gone from the deck, or service creation itself fails validation on a template the operator never touched.

Two services, same registry, same day: one shows shipped example content, the other shows nothing. Both units compliant. This is the resurrection AD-17 was written to end, reachable through the clause added to end it.

**Sentence to add** (AD-17):
> A row the database holds but cannot validate is **not** a candidate for seed substitution either: no read path may render, clone or hydrate shipped content in place of a persisted row, whatever its state — the row is reported as unrenderable, by id and reason, on the surface that tried to use it, and the seed is read at exactly the two moments named above and at no other.

---

## P4 — HIGH — "Exactly one persisted home … the service's own entered data" names a category, not a location

**Units.** *20.7* (four `songset-*` slots, each binding a hymnal number from worship-service settings) and the **shipped webhook correction path** (FR-12, `applyStructuredFields` → `services.parsed_data`), which AD-3 forbids from knowing slot keys.

**Exact AD text each unit reads.**
- 20.7 reads AD-19: *"a weekly value a slot binding names has exactly **one persisted home**, and it is the service's own entered data; the slot identity is a *key into* that data… The four `songset-*` identities therefore **replace** the shipped ordinal field names `song1Number..song4Number` … deleted, not aliased."*
- The webhook path reads AD-3: *"The API must expose a standard JSON interface for service generation that is agnostic to the input mechanism… webhook/service intake JSON stays agnostic of layout templates."*

**The incompatible legal choice.** "The service's own entered data" is one category with two live locations: `services.parsed_data` (the rundown's `items[]`, where `applySongOverlay` writes today) and any new per-service slot-binding store keyed by `songset-*`. 20.7 may legally pick either — a slot-keyed table is the most natural reading of *"the slot identity is a key into that data"*, and AD-19's *Deferred* leaves persistence a *"Story 20.2 / 20.7 schema call."* The webhook must keep writing hymns into the rundown, because AD-3 forbids it from knowing slot keys. If 20.7 picks a slot-keyed store, the two locations both exist and both hold hymn numbers.

**Concrete symptom.** Friday evening a Telegram correction changes the Divine Service closing hymn from 312 to 245. The webhook writes the rundown. The slot binding still says 312. AD-19's own paragraph describes the result: *"the deck renders 245 while the run sheet and the edit form both show 312, with no 409, no log, and no screen on which both values appear."* The rule forbids a second **copy**; it does not forbid a second **location**, and it never says which location is the one home. Silent. Story 20.7 and the shipped webhook are both compliant.

**Sentence to add** (AD-19, second rule):
> That one home is `services.parsed_data`: a slot binding persists no hymn number of its own, it resolves one by applying its slot identity through the single mapping table to the stored rundown, so an agnostic webhook correction and the settings form write the same bytes and there is nothing to diverge.

---

## P5 — HIGH — AD-22 contradicts itself about whether Reset destroys the administrator's backgrounds

**Units.** *20.7* (bounded config writes the override record) and *20.3* (the Reset verb, per AD-11 *"Reset restores one selected template from that seed"*).

**Exact AD text each unit reads.** Both read AD-22, two sentences apart:
- *"…the override record stays administrator-owned in full and **no migration, Reset, or re-seed writes it**…"*
- *"…a developer's later change to a SongSet layout reaches a deployed database only as a versioned data migration (AD-21) — never by restart, and **not by Reset, which would also discard the administrator's background and font size choices** (AD-11)."*

**The incompatible legal choice.** 20.7 implements Reset as override-preserving (clause 1 is explicit and absolute). 20.3 implements Reset as override-discarding, or at minimum ships the warning copy the second clause states as fact — because the second clause is the only place the spine tells the Reset verb what Reset costs. The second sentence is residue from the draft AD-22 itself narrates and rejects, where the values lived *inside* the layout; it was not updated when the override record replaced that encoding.

**Concrete symptom.** Either the confirmation dialog on Reset tells the administrator "this discards your backgrounds and font sizes" when it does not — training them to fear a safe action and to avoid Resets that would fix a real problem — or Reset deletes override rows that AD-22 declared untouchable, and the administrator loses four slots' worth of background and font choices with no second copy anywhere (AD-11 keeps none). Which one ships depends on which sentence the story author read last. Not silent — but it is a coin flip on a destructive verb.

**Sentence to add** (AD-22, replacing the trailing parenthetical):
> Reset restores the shipped layout and leaves the override record untouched; the administrator's backgrounds and font sizes survive Reset, re-seed and migration alike, because they were never in the layout being replaced.

---

## P6 — HIGH — The slot identity's column home is a schema call two stories share, and AD-18's derived-index clause cannot be satisfied for it

**Units.** *20.2* (three slide kinds + the seven-to-three collapse migration) and *20.7* (SongSet slots).

**Exact AD text each unit reads.**
- Both read *Deferred*: *"**Where a SongSet slot identity is persisted** — in the `base_type` column itself, or in a discriminator beside it — is a **Story 20.2 / 20.7 schema call.** AD-19 fixes only that the identity exists, is unique, is server-owned, and is a semantic name."*
- Both read AD-18: *"the row's `payload` JSON is authoritative for every template field, and any column duplicating a payload field — `label`, `base_type`, and **any slot discriminator** — is a **derived index** maintained by the same write… a migration that writes a column alone is refused by a test asserting column and payload agree for every row."*
- 20.7 reads AD-19: *"**at most one registry row may carry each slot identity**."*

**The incompatible legal choice.** The *Deferred* item hands one schema decision to two stories without saying which one decides, so both may decide. 20.2's collapse migration naturally widens `base_type` to the six recognized keys (AD-19 says *"six keys over three kinds"*, which licenses it). 20.7 naturally adds a `slot` discriminator beside it (the other branch the *Deferred* offers). If both land, the identity has two column homes and the uniqueness constraint can only be declared on one.

Worse, AD-18's clause is **unimplementable** for the discriminator branch as written. It requires any slot-discriminator column to be a *derived index of a payload field* — but the payload is validated against a closed `ALLOWED_TEMPLATE_KEYS` (`validate.ts:15-22, 447`), which has no slot field, and AD-18 does not authorise the registry-contract change that would add one. This is precisely the argument AD-22 makes against the in-layout marker (*"the shipped validator rejects unknown keys against a closed `ALLOWED_LAYOUT_KEYS`, so the in-layout marker cannot ship without a registry-contract change this decision does not authorise"*) — applied to AD-18's own clause, it invalidates the discriminator branch that AD-19's *Deferred* still offers as equally available.

**Concrete symptom.** Two rows both claim `songset-ds-close` — unique on the discriminator, not on `base_type`, or the reverse. The ordered list UI reads `listArtifactSummaries`, which reads `base_type` (`store.ts:74-92`); the planner reads the payload. AD-18's column-vs-payload test passes, because it never compares column to column. The Divine Service closing song renders twice and the opening slot renders the closing hymn; the admin screen shows one clean row per slot. Silent, and it survives the one test AD-18 mandates.

**Sentence to add** (AD-19's *Deferred* item, promoted into AD-19):
> The slot identity is persisted in `base_type` and nowhere else — it is one of the six recognized keys, the kind is derived from it, and a UNIQUE index on that column is what enforces one row per slot; no second discriminator column exists, so AD-18's derived-index rule has exactly one column to police.

---

## P7 — HIGH — AD-10's plan identity has no defined input for the state every service is in

**Units.** *20.8* (clone + Sync, which creates the no-snapshot state) and *20.1* (reorder/ordered registry) plus the presenter/projector surfaces.

**Exact AD text each unit reads.**
- AD-10 `[ADOPTED]`: *"**Every message carries a plan identity** — a fingerprint of **the snapshot and resolved announcement set** that produced the deck — and a receiver whose own identity differs **refuses to follow the index**… Presenter and projector are two independent `force-dynamic` renders, each calling `buildSlidePlan` at its own moment."*
- AD-16: *"**A service that has no snapshot renders from the live registry until its first Sync**… every service in the database on the day this ships is in that state."*

**The incompatible legal choice.** The fingerprint's input set is named as *"the snapshot and resolved announcement set."* For a no-snapshot service there is no snapshot. The presenter unit may legally fingerprint `(null, announcementSet)` — a stable value, identical across renders even when the live registry changes underneath — or it may legally fingerprint `(liveRegistryDigest, announcementSet)`, since that is what actually produced the deck. Two compliant readings, opposite behaviours.

**Concrete symptom.** Both surfaces are `force-dynamic` (confirmed: `present/page.tsx`, `present/projector/page.tsx`). An admin reorders the live registry at 08:35 while a no-snapshot service is being presented. Reading A: identities match, projector follows index 41 to a different slide than the presenter's index 41 — the failure AD-10 exists to catch, undetected. Reading B: identities differ on every render because the live registry is not frozen, so the projector refuses to follow and puts a warning on the room-facing screen — permanently, for every legacy service, from the moment 20.8 ships.

**Also a status-tag defect worth naming on its own:** AD-10 is tagged `[ADOPTED]`, which the spine defines as *"the Rule describes `src/` as it is."* No plan identity, fingerprint or refuse-to-follow behaviour exists anywhere in `src/` — `PresentMessage` (`src/lib/present-channel.ts:19-38`) has no such field, and a grep for `fingerprint|planIdentity|planId` returns nothing. AD-10's clause is `[TARGET]` content under an `[ADOPTED]` tag, which is exactly the ambiguity the tag table was introduced to remove, and it means no story owns building it.

**Sentence to add** (AD-10):
> A service with no snapshot fingerprints the live registry's ordered row set and versions in place of the snapshot, so the identity always describes what actually produced the deck; and this clause is `[TARGET]` — no shipped message carries it yet, and the story that adds the field is named in *Deferred*.

---

## P8 — HIGH — Whether an operator may Sync has two authoritative answers, and the enforcement point is undefined

**Units.** *20.8-as-specified* (built from the SPEC, which `epics.md:352` declares *"the final reference for development"* and which wins over conflicting companions) and *20.8-as-invarianted* (built from AD-16).

**Exact text each unit reads.**
- AD-16: *"**Sync is a structural write and is therefore admin-only**, re-checking the role from SQLite exactly as AD-14 requires… An operator may see that their snapshot is stale and *request* a sync; **they may not perform one**."*
- `spec-artifact-registry-authoring/SPEC.md:88`: *"Worship services that already exist when this model ships (no clone yet) continue to render from their stored `parsed_data` plus the then-current live registry **until an operator freezes/clones or syncs one for them**."* AD-16 cites this exact line approvingly as the source of its migration path — while contradicting its actor.

**The incompatible legal choice.** `AGENTS.md`'s authority map gives the SPEC *"What to build (contract)"* and the spine *"Structural invariants."* Authorization is plausibly either. A story author following the SPEC ships an operator-triggered Sync; one following AD-16 ships admin-only. Both cite their governing artifact.

**A second, independent enforcement hole in the same pair.** AD-16 says Sync *"is reached on a service route that `src/proxy.ts` gates for any signed-in account; its route ships with the `tests/proxy-matcher.test.mjs` assertion AD-5 demands and an in-route `requireAdminSession`."* But `proxy.ts:88-95` grants admin-only enforcement solely to paths matching `/admin`, `/admin/`, or `/api/admin` — a Sync at `/api/services/[id]/sync` gets **no** admin check from the gate, and `proxy-matcher.test.mjs` pins matcher inclusion/exclusion, not role. So the in-route call is the only enforcement, and AD-5 itself notes *"A Server Function POST inherits its route's matcher outcome"* — a Sync implemented as a Server Function on the service page has no route file to hold `requireAdminSession` and no test that would notice.

**Concrete symptom.** An operator, seeing a "snapshot is stale" badge at 08:20 on Sabbath, presses Sync and destructively re-clones a registry an admin left half-authored on Thursday. AD-16 spends a paragraph on this exact scenario (*"licence for an operator to freeze a half-authored layout into the service that presents in fourteen hours"*) and then leaves both the actor and the enforcement point recoverable in two directions. Silent: the operator sees a success toast.

**Sentence to add** (AD-16, plus a same-change-set correction to `SPEC.md:88`):
> Sync Artifact is served from a path the AD-5 gate treats as admin — `/api/admin/**` — and never from a service-scoped route or Server Function, so the role check is the gate's and not one call an author can forget; `SPEC.md:88`'s "until an operator … syncs one" is superseded by this clause and is corrected in the same change set.

---

## P9 — HIGH — Where the snapshot lives decides whether AD-6's precondition protects Sync at all

**Units.** *20.8* (Sync, with the snapshot in a side table) and the **service edit path** (AD-6's `updated_at` precondition on `services`).

**Exact AD text each unit reads.**
- AD-16: *"Sync… carries the service's `updated_at` precondition (AD-6)… 'destructive' means it replaces the snapshot, never that it may overwrite a service someone else has moved underneath it."*
- *Deferred*: *"**Where the snapshot lives physically** — a table keyed by service, or a payload column on `services` — is a Story 20.8 design call."*
- AD-6: *"every service mutation carries the client's `updated_at` as a precondition; a stale value is rejected with HTTP 409… No write path may bypass the precondition."*

**The incompatible legal choice.** The two branches of the deferred design call are not equivalent for concurrency, and the spine treats them as free.
- Snapshot as a `services` column: Sync is a `services` UPDATE, so it bumps `updated_at`, so it invalidates every open operator edit form → 409s the operator out of an unrelated form edit whenever an admin syncs.
- Snapshot in a side table: Sync reads `services.updated_at` as a precondition and never writes it. Two concurrent Syncs both satisfy the same precondition and both succeed; an operator's concurrent form edit also succeeds and never learns the structure moved. The precondition is **vacuous** for the write it is supposed to arbitrate. Reinforced by two shipped facts: `services.updated_at` is second-granularity (spine's *Deferred* cites `deferred-work.md:116`), and `update-service.ts:139` guards on `COALESCE(updated_at, created_at)`.

**Concrete symptom.** Two admins on the artifacts page both press Sync on tomorrow's service within the same second, one before and one after a reorder. Both get 200. The service's snapshot is whichever transaction committed second — not necessarily the one either admin was looking at. AD-6's *Prevents* ("an operator's edit silently erased by a late correction (last-write-wins)") applies verbatim. Silent.

**Sentence to add** (AD-16, or the *Deferred* item promoted):
> The snapshot carries its own `updated_at` and Sync's precondition is that value, not the service's: a Sync that races another Sync is refused with 409, and Sync never advances `services.updated_at`, so an operator's unrelated form edit is neither invalidated by a Sync nor able to mask one.

---

## P10 — HIGH — A catalog placeholder on a General: declared or not, and who owns its value type

**Units.** *20.5* (Placeholder Catalog) and *20.4* (canvas authoring for General slides, including the validator work AD-15 binds).

**Exact AD text each unit reads.**
- 20.5 reads AD-19: *"a placeholder stops being a kind and becomes an **element** inserted onto a General from the Placeholder Catalog"* and *"**The catalog is one server-side module holding both the admitted key and its resolver** from the parsed rundown — so a key cannot be admitted without a filler."*
- 20.4 reads AD-22: *"**`general` is free canvas:** the administrator composes it from anything, including Placeholder Catalog keys (AD-19)"* and AD-15: *"**Every** write into the registry is untrusted and must pass the same structural and image-reference validation."*

**The incompatible legal choice.** Neither AD says whether a catalog-keyed element also requires a `PlaceholderDefinition` row in `template.placeholders`. The catalog module is server-side and holds the key *and* its resolver, so 20.5 may reasonably store only `element.placeholderKey` and let the module supply everything. 20.4's validator and `hydrate.ts` require the declaration: `resolveLayout` throws `ArtifactHydrationError('Element references an undeclared placeholder')` when `element.placeholderKey` has no matching `template.placeholders` entry (`hydrate.ts:129-138`) — and the shipped General rule is stricter still: `enforceBaseTypeRules` refuses *"General templates cannot have placeholders"* (`validate.ts:366-368`).

**Two symptoms, one loud and one silent.**
- If 20.5 stores no declaration: every plan build throws at the first catalog element. No deck at all, on any surface, for any service. Loud and total.
- If 20.5 stores a declaration: the **type** now has two owners. `placeholder-catalog.md` declares value types in the catalog (*"allowed placeholder keys (and value types: text, text[], image, image[])"*) while `PlaceholderDefinition.type` lives per template and decides resolution — `text[]` newline-joins, `text` passes through, `image[]` takes the first URL (`hydrate.ts:60-80`). A catalog `text[]` key stored as a template-local `text` renders a multi-line family prayer request as one unwrapped run, or an image list as a literal comma-joined string. Silent.
- And `required` is a third unassigned owner: `hydrate.ts:141-156` makes the **element's** `required` decide between hard-fail and silent drop, while AD-19 warns *"`hydrate.ts` fails closed on a required binding — on a Sabbath"* without saying who sets it. Catalog default `true` → an absent optional field kills the whole plan; canvas default `false` → the slide renders with a hole nobody sees until the projector.

**Sentence to add** (AD-19, *Rule — Placeholder Catalog*):
> The catalog module owns each key's value type and its required-ness, and both are projected into `template.placeholders` by the write path rather than authored: a General may declare only placeholders whose key, type and `required` come from the catalog verbatim, the validator refuses any other combination, and an element may not override the `required` its catalog key declares.

---

## P11 — MEDIUM — Reset restores from whichever seed layer resolves *today*, not the one the row was bootstrapped from

**Units.** *20.3* (Reset verb) and *20.1* (bootstrap plus AD-17's per-row origin record).

**Exact AD text each unit reads.**
- AD-11: *"Reset restores one selected template from that seed. The seed is two-layered — `data/local/default-registry.json` is git-ignored and **takes precedence over the shipped `data/default-registry.json` example whenever present**… The two-layer precedence has one shipped override: `WPW_USE_SHIPPED_REGISTRY=1` inverts it (`seed.ts:39`) for tests and fidelity smokes."*
- AD-17: *"the registry records, per row, **whether** it originated from the bootstrap or from an administrator, because three verbs (save validation, Reset, and any future re-seed) all need that answer and none can infer it."*

**The incompatible legal choice.** AD-17 records a **boolean** origin; AD-11 makes the seed a **two-layer, environment-invertible resolution**. 20.1 implements the boolean, faithfully. 20.3 implements Reset against `resolveSeedPath()`, faithfully. Neither records *which file* a bootstrap row came from, because AD-17 only asks whether.

**Concrete symptom.** The hub is bootstrapped from the church's private `data/local/default-registry.json`. Months later the volume is re-provisioned, a container is rebuilt without the git-ignored file, or a smoke run sets `WPW_USE_SHIPPED_REGISTRY=1` in an environment that shares `DB_PATH`. An admin presses Reset on the Contact slide to undo a bad edit. `resolveSeedPath()` now returns the **shipped public example**, and Reset writes its placeholder contact and placeholder payment details over the row — content this repository ships as deliberately synthetic (`AGENTS.md`, `.constitution/public-repository.md`). AD-17 forbids the automatic repair (no re-seed of a live database), so the only path back is another Reset from a file that is no longer there. Silent until Sabbath, when a placeholder phone number is on the projector. Same mechanism inverted, per AD-17's bootstrap-once marker: a first boot that resolves the shipped example permanently installs it, and the private registry can never seed at all.

**Sentence to add** (AD-11, or AD-17's origin clause):
> The origin record names the seed **file** the row was bootstrapped from, not merely that it was bootstrapped; Reset restores from that recorded file only, and refuses — naming the file — when it is absent or when `WPW_USE_SHIPPED_REGISTRY` would change the answer.

---

## P12 — MEDIUM — AD-23 forbids the one mechanism that would close its own *Prevents*

**Units.** *20.8* (the snapshot freeze) and the **admin settings surface** (`slide_transition`, shipped).

**Exact AD text each unit reads.**
- AD-23 `[ADOPTED]`: *"transition style is **one app-wide value** in `settings` (`slide_transition`)… **There is no per-surface and no per-service override.**"* *Prevents:* *"a deck that fades in PowerPoint and cuts on the projector."*
- AD-16: *"A service's plan, Presenter, slideshow and PPTX read that snapshot"* — structure is frozen at creation; AD-1 makes the downloadable PPTX the primary Sabbath path.

**The incompatible legal choice.** 20.8 freezes structure per service. The settings surface holds a mutable global that the freeze may not cover, because AD-23 forbids a per-service value. AD-10's plan identity does not cover it either (its inputs are the snapshot and the announcement set). So a deck generated at style *S1* and a live render at *S2* is not a violation of anything — it is the mandated design.

**Concrete symptom.** The operator downloads Saturday's deck on Friday with `fade` configured. An admin switches to `push` on Friday night. Saturday the offline PPTX cross-fades while the browser slideshow and presenter push — AD-23's *Prevents* sentence, produced by AD-23's own no-override clause. Silent: no surface compares a generated deck's transition to the current setting, and `pptxCachePath` is keyed by service id alone (`pptx-cache.ts:13`) with no style component, so nothing about the cache would notice either. Needs an admin change inside the download-to-service window, which is why this is MEDIUM rather than HIGH.

**Sentence to add** (AD-23):
> Changing `slide_transition` invalidates every generated deck: the value is stamped into each PPTX and into every plan build, and a service whose downloaded deck carries a different style than the current setting is reported as stale on the service surface — the setting stays app-wide, but a deck and a live render are never allowed to disagree unnoticed.

---

## Attacks I constructed and then defeated

Real signal about where the spine holds. Each of these was a serious attempt.

1. **Two units inventing a second sync channel or message shape.** AD-10 plus `presentChannelName`/`openPresentChannel` (`present-channel.ts:79-88`) close it completely — the channel name is derived, not chosen, and the message union is exhaustive.
2. **Presenter and projector disagreeing about transition style.** I expected a two-owner defect and found the opposite: `PresentMessage` puts the *asserted* value on the wire rather than an instruction, and `liveTransitionOf` (`:71-77`) deliberately distinguishes *absent* (leave the projector's server-rendered value alone) from *present-but-junk* (coerce to default) — with the asymmetry against `blankStateOf` reasoned in place. AD-23 plus that code forecloses the attack.
3. **A renderer reading the registry directly to fetch something the plan dropped.** AD-12's carve-out is unusually precise — *"Importing a shared helper that happens to live under `src/lib/registry/` is not such a read"*, with `pptx.ts` importing `isBundledAssetRef` named as the licit case. No room left.
4. **The seeder writing an unvalidated template.** AD-15's *"the startup seeder, and any import or asset-extraction script alike"* is matched by `loadSeedTemplates` → `validateArtifactTemplateList` (`seed.ts:69`), which caches only after a clean validation.
5. **A fresh install re-running history it was never part of.** AD-21's *"The counter's absence is not version 0"* plus the bootstrap stamping the version in the same transaction as the marker, plus the *"holding registry rows and no version key"* discriminator, closes the fresh-vs-pre-counter fork cleanly — including under AD-21's own fixed DDL → migrations → bootstrap order, where migrations legitimately run before the version key exists.
6. **Two builders each declaring "the transition to version 1".** AD-21's compaction clause plus *"developer databases are **reset** to the compacted version rather than migrated"* answers it. Weaker than it reads — "reset" is a convention with no code path and no test — but it is stated, so it is not a fork.
7. **A second image resolver reaching a renderer.** AD-8 plus the shipped chain (`isRegistryImageRef`, `isSafeImageUrl`, `isAnnouncementImageUrl` double-filtering flyers at both `resolveAnnouncementUrls` and `buildRequestPlan`) holds. AD-22's bounded surface is pre-emptively bound to it too.
8. **A new test suite that never runs.** The *Testing* convention names this exactly, including that *"nothing detects the omission"*.
9. **AD-6's four bypass paths as a finding.** They are bypasses, but AD-6's own gap paragraph names all four and *Deferred* asks for the closing story. Recorded, not a hole — and a pair built on them would be attacking a unit that is already declared non-compliant.
10. **`updateService` losing a race.** The guarded UPDATE re-asserts the precondition inside `WHERE` and the `StaleWriteError` sentinel forces a ROLLBACK rather than a COMMIT (`update-service.ts:34-39, 143-152`). This path is stronger than AD-6 requires.
11. **A middle Divine Service hymn silently vanishing under the closed six-key set.** AD-19's third rule decides it explicitly (*"surfaced, never silently dropped and never fatal"*) and fixes the slot→rundown mapping in one table in one module, defusing the `slide-plan.ts:399` / `worship-form-fields.ts:64` split reading (`song4Number` = second DS hymn vs the planner's last) that I expected to be live. What remains is only *which* surface reports it — a UX question, not a data-shape fork.
