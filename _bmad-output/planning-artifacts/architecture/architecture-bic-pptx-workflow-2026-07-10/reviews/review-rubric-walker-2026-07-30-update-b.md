# Reviewer Gate — rubric walker lens

- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
- **Intent:** Update (post-amendment). Report only; no spine or project file was edited.
- **Date:** 2026-07-30
- **Lens:** rubric walker — the good-spine checklist, point by point, plus the dimension walk.
- **Independence:** `reviews/` and `.memlog.md` were not read. Every claim below is grounded in the
  spine as it stands, in `src/`, `tests/`, `package.json`, and in the tracked artifacts named in the
  spine's own authority map.
- **Verdict:** **Conditional pass.** The spine is a genuine invariant contract, not a stack document,
  and its `[TARGET]`/`[ADOPTED]` tagging is a real improvement. But one `[ADOPTED]` tag is on a rule
  the code does not implement at all, and seven holes will be hit by Epic 20's stories as written.

**Counts:** 1 CRITICAL · 7 HIGH · 8 MEDIUM · 5 LOW (21 findings)

---

## Checklist walk

| # | Checkpoint | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Fixes the real divergence points for Epic 20's stories, misses none | **partial** | Order/kind/authoring/migration/authorization forks are all closed. Three are not: registry **order totality** (H3), the **font binding** (H4), and where the **slot identity** persists across 20.2↔20.7 (H5). |
| 2 | Every Rule enforceable and no narrower than its Prevents | **partial** | AD-5, AD-15, AD-17, AD-19, AD-21 all name their asserting test — exemplary. AD-23's Rule is narrower than its Prevents and the shipped live override defeats it (H1). AD-10's identity clause is unfalsifiable today because nothing it names exists (C1). |
| 3 | Nothing under Deferred can let two units diverge silently | **fail** | Fonts (H4) is an unclosed cross-surface binding the spine itself calls "the shape of an invariant" — and two `DEFAULT_FONT_FAMILY = 'Arial'` literals already exist in two units. AD-6's webhook remedy is left as a two-way choice (M7). |
| 4 | Named tech verified-current (light check) | **pass** | Verified against the registry: next 16.2.12 vs 16.2.10 (2 patches); fabric 7.4.0 vs `^6.6.1`; better-sqlite3 13.0.2 vs `^12.11.1`; eslint 10.8.0 vs `^9`; typescript 7.0.2 vs `^5`; pptxgenjs 4.0.1 = current. The Deferred *"four rows sit a major behind"* bullet is accurate, and the *"zero drift ≠ current"* caveat at `ARCHITECTURE-SPINE.md:234` is the right disclosure. |
| 5 | Ratifies rather than contradicts the codebase; every status tag correct | **fail** | 20 of 23 tags check out against `src/` (see *Tag audit*). AD-10 `[ADOPTED]` carries an entirely unbuilt clause (C1); AD-23 `[ADOPTED]` omits a shipped override that produces its own *Prevents* (H1); the *Boundaries* convention contradicts AD-6's own Rule about where the precondition lives (H2). |
| 6 | Covers its driving specs' capabilities | **partial** | Epic 20 CAP-1..CAP-8 each have a governing AD and the map's stated hole-test runs over them. `spec-slide-artifact-model` CAP-1..CAP-9 are traced by *Area*, not capability, and `binds:` omits them (L3). |
| 7 | No AD weakens or contradicts another; supersession seams clean | **pass** | All six named seams verified clean — see *Supersession seam audit*. Intra-AD clause conflicts: none found in AD-16..AD-22. |
| 8 | Every initiative-altitude dimension decided, deferred, or an open question | **partial** | 12 decided or deferred; **i18n/locale is SILENT** (M4); operations has no invariant and is deferred only by reference (M8); error/failure semantics is decided in three mutually inconsistent postures with no unifying rule (M5). See *Dimension coverage*. |
| 9 | Structure carried in diagrams; both mermaid graphs valid and agreeing with AD text | **partial** | Both graphs parse; node/edge/shape syntax is valid. Graph 2 disagrees with AD-16 by omitting the live Announcements path (M2), and `-.->` carries opposite meanings in the two graphs (M3). |
| 10 | Right-sized; no bloat, no placeholders, no rule too long to read | **partial** | No placeholder or template comment anywhere; the file tree and Stack table are load-bearing. But AD-16's Rule is a **432-word single paragraph** and AD-22's a **440-word single paragraph**, each holding ~12 separate obligations (M1). |

---

## Dimension coverage

| Dimension | Status | Where |
| --- | --- | --- |
| Deployment & environments | **decided** | AD-4 `[ADOPTED]` — one Docker/standalone unit, home-PC LiveServer, Cloudflare Tunnel; the *"as of 2026-07-30 no deployment exists"* anchor is load-bearing for AD-18 and AD-21 and correctly stated here rather than inferred. |
| Infra / provider strategy | **decided** | AD-2 (single repo, cohesive deployable), AD-4 (no PaaS, native `better-sqlite3`). |
| Operations | **deferred by reference only** | AD-4 points at `docs/deployment-guide.md` / `docs/deploy.md`; no invariant, and *operations* is never named as a dimension the way observability and durability are. See M8. |
| Data durability & recovery | **deferred, explicitly, with stakes** | Deferred bullet at `:350`. Best-written deferral in the file: it names *why* the stakes rose (AD-17 removes the seed as a recovery channel, so losing `DB_PATH` loses the ordered deck), the current floor (`docs/deploy.md:79`), and the revisit milestone (first deploy). |
| Observability | **deferred** | `:341` — `console.error` named as the floor. |
| Secrets | **deferred (partially decided)** | `:351` — AD-5 fixes `WEBHOOK_SECRET`; `AUTH_SECRET` fails closed; `IMAGE_URL_ALLOWLIST`, `PPTX_CACHE_DIR`, `PPTX_RETENTION_DAYS`, `AUTH_BOOTSTRAP_*` unnamed. Honest. |
| Testing | **decided** | *Consistency Conventions* → Testing. `node:test` + explicit file list; verified — all 34 suites named in `package.json` `scripts.test`, including every suite AD-5/AD-15/AD-17 delegate to. |
| Performance | **deferred** | `:352` — NFR-2 routed here, floor is `tests/pptx-ceiling.test.mjs`. |
| Error / failure semantics | **decided inconsistently** | Three postures, no unifying rule: fail-closed (AD-5 gate, `hydrate.ts` on a required binding), non-fatal-and-surfaced (AD-19 unclaimed hymns), log-and-fall-back (`registry-snapshot.ts:41-64` corrupt payload). Envelope shape is fixed (`{ error: string }`). See M5. |
| Auth | **decided** | AD-5 `[ADOPTED]` + AD-14; AD-16 extends it to Sync. |
| State mutation | **decided** | AD-6 + *State* convention. The entered-data-is-historical / structure-adopts-a-clone split is the sharpest thing in the document. |
| Schema evolution | **decided** | AD-9 (shape) / AD-18 (value) / AD-21 (one counter, ordered `getDb` path). The AD-9↔AD-18 division-of-labour sentence is exactly the right size. |
| Multi-tenancy | **deferred** | `:339` — BIC-only until v1. |
| **i18n / locale** | **SILENT** | No mention of i18n, locale, language or timezone anywhere in the spine. See M4. |

---

## Tag audit (checklist 5, in detail)

Verified against `src/` at HEAD. 20 correct, 3 findings.

| AD | Tag | Verified | Note |
| --- | --- | --- | --- |
| AD-1 | ADOPTED | ✓ | Slideshow + presenter ship; PPTX primary. |
| AD-2 | ADOPTED | ✓ | Single repo, one deployable. |
| AD-3 | ADOPTED | ✓ | `/api/webhook` layout-agnostic. |
| AD-4 | ADOPTED | ✓ | Docker/compose ship; `prd.md:540` confirms nothing deployed. |
| AD-5 | ADOPTED | ✓ | `src/proxy.ts:5-11` states the runtime reason correctly; matcher at `:122`; `noStore` sets both headers at `:32-36`. |
| AD-6 | ADOPTED, partial | ✓ tag | `expectedUpdatedAt`/`RegistryStaleError` at `store.ts:207,224`; all four named bypasses confirmed. **But see H2.** |
| AD-7 | ADOPTED | ✓ | |
| AD-8 | ADOPTED | ✓ | `registry/asset-safety` is the shared helper; `pptx.ts:21,141`. |
| AD-9 | ADOPTED | ✓ | No migration framework in `package.json`. |
| **AD-10** | **ADOPTED** | **✗** | **C1 — the plan-identity clause is not in the code.** |
| AD-11 | ADOPTED, partial | ✓ | Gap confirmed at `registry-snapshot.ts:85-90`; `WPW_USE_SHIPPED_REGISTRY` at `seed.ts:39`. Cited lines exact. |
| AD-12 | ADOPTED | ✓ | `resolveFontFamily`/`render-model.ts` shared by `pptx.ts:259` and `ArtifactSlide.tsx:127` — the Fat Payload's font *is* honoured; `pptx.ts:221`'s literal is only the "Image unavailable" fallback. |
| AD-13 | ADOPTED | ✓ | `serializeCanvas` at `ArtifactEditor.tsx:257`, called at `:695`; no `canvas.toJSON()` on the save path. |
| AD-14 | ADOPTED | ✓ | All six `api/admin/**` routes carry `requireSession`/`requireAdminSession`. |
| AD-15 | ADOPTED | ✓ | `validate.ts` closed key sets at `:24,:31`; seeder validates via `seed.ts` cache. |
| AD-16..AD-22 | TARGET | ✓ | Correctly *not* shipped: `artifact_templates` has no ordering column (`store.ts:79-81` orders by `label COLLATE NOCASE`), `/api/admin/artifacts` is GET-only, `ARTIFACT_BASE_TYPES` still carries all seven values (`types.ts:1-9`), no `songset-*` string anywhere in `src/`. The Deferred bullet at `:356` describes this accurately. |
| **AD-23** | **ADOPTED** | **partial ✗** | **H1 — a shipped live override the Rule does not admit.** |

**Spot-check of cited line numbers — all accurate:** `slide-plan.ts` `skipTitle` at 140/148/438/460/550 (exactly five, exactly those lines); `worship-form-fields.ts:6-9`; `parsed-fields.ts:418-421`; `slide-plan.ts:399`, `:464-466`; `store.ts:35-38`, `:74-92`, `:226`; `registry-snapshot.ts:41-64`, `:85-90`; `types.ts:83`; `validate.ts:449-450`, `:505`; `ArtifactEditor.tsx:104`; `docs/architecture.md:61` (the crossfade AD-23 says contradicts it); `prd.md:305`, `:540`, `:550`; `epics.md:52`, `:56`, `:374`. This is unusually well-grounded and should be said plainly.

## Supersession seam audit (checklist 7)

| Seam | Result |
| --- | --- |
| AD-11 ↔ AD-17 | **clean.** AD-17 supersedes two named clauses; AD-11 names both from its side and marks the second `[TARGET]`. Neither over-claims. |
| AD-14 ↔ AD-16 | **clean.** One clause reversed, two explicitly untouched, and AD-14 pre-empts the AD-4 confusion by name — which turns out to be exactly the confusion still live in `EXPERIENCE.md:153` (H7). |
| AD-18 ↔ AD-21 | **clean.** Mechanism clause only; AD-18's absolutes and AD-9's framework prohibition both restated as surviving. |
| AD-9 ↔ AD-18 | **clean, and the sharpest of the six.** *"this rule owns schema … AD-18 owns value … Neither licenses the other's mechanism."* This closes the escalation it was raised for. |
| AD-7 ↔ AD-12 ↔ AD-16 | **clean.** AD-12 specializes; AD-16 moves only *where the plan reads templates from*; both restate that one order source survives. |
| AD-19 ↔ AD-22 | **clean.** AD-19 owns the key vocabulary, AD-22 owns authoring authority per kind; AD-22's override-record clause explicitly resolves the encoding an earlier draft left open, and gives the falsifying reason (`ALLOWED_LAYOUT_KEYS`, verified at `validate.ts:31`). |
| Intra-AD | No contradiction found inside AD-16..AD-22. AD-16's *"permitted on any service"* + *"admin-only"* + *"no snapshot renders live until first Sync"* are mutually consistent and each reasoned. |

---

# Findings

## CRITICAL

### C1 — AD-10 is tagged `[ADOPTED]`, but its plan-identity clause does not exist in the code at all

**Spine, `ARCHITECTURE-SPINE.md:121,124`:**

> `### AD-10 — One presenter sync channel, client-side only [ADOPTED]`
> … **Every message carries a plan identity** — a fingerprint of the snapshot and resolved
> announcement set that produced the deck — and a receiver whose own identity differs **refuses to
> follow the index** and says so on the room-facing screen rather than rendering a slide it cannot
> vouch for. … since this rule forbids a surface inventing its own message shape, the identity has to
> live in the shared shape.

**Evidence.** `src/lib/present-channel.ts` is the shared shape, and `PresentMessage` has no identity
field on any of its six variants (`sync`, `request-sync`, `blank`, `transition`, `scripture`,
`clear-scripture`). `grep -rni 'planIdentity|plan_identity|fingerprint|planFingerprint' src/ tests/`
returns **zero hits in `src/`** — the only matches are the unrelated privacy hashers in
`tests/public-repo-guard.test.mjs:174` and a comment in `tests/asset-map-evidence.test.mjs:9`. No
receiver refuses an index, and nothing renders a room-facing refusal: `EXPERIENCE.md:241` (Open Item
1) records that lost-sync detection is *"designed, not shipped"* and owned by an unwritten Story 17.5.

The clause is also **unbuildable as written today**: it fingerprints *"the snapshot"*, and AD-16
`[TARGET]` is what creates the per-service snapshot. So the tag is wrong in both directions — the
rule is not adopted, and it cannot be adopted before AD-16 lands.

**Failure scenario.** A builder trusts the tag table's own definition — `[ADOPTED]` means *"The Rule
describes `src/` as it is"* — and takes the identity mechanism as existing infrastructure. Story 20.8
clones a snapshot; the presenter and projector are two independent `force-dynamic` renders (as AD-10
itself notes) that each call `buildSlidePlan` at their own moment. A Sync lands between the two
renders. Both screens hold a bare `index`, no identity is compared because none is on the wire, and
the projector shows a different slide from the presenter's notes mid-service — the precise failure
AD-10's own paragraph reasons its way to. Nobody writes the mechanism, because the spine says it is
already there.

**Severity:** CRITICAL. The tag table exists to make exactly this question answerable, and this is the
one AD where it answers wrongly. It is also the highest-consequence AD in the file — it fires during a
service.

**Fix.** Split AD-10. Keep `[ADOPTED]` on the single-channel / no-server-realtime / intended-state
clauses, all of which `present-channel.ts` genuinely obeys. Move the plan-identity clause into a new
`AD-24 [TARGET]`, sequenced after AD-16 (it needs the snapshot to fingerprint), binding whichever Epic
20 story ships Sync, and route the room-facing message to `EXPERIENCE.md` rather than deciding the
affordance here — the spine routes two smaller affordances that way already. Do not renumber AD-10.

---

## HIGH

### H1 — AD-23 is `[ADOPTED]`, but a shipped operator control produces exactly its *Prevents*

**Spine, `:201-204`:**

> `### AD-23 — Transition Style Is One Value, Described Once, Consumed Identically [ADOPTED]`
> **Prevents:** a deck that fades in PowerPoint and cuts on the projector …
> **Rule:** transition style is **one app-wide value** in `settings` (`slide_transition`) … **There is
> no per-surface and no per-service override.**

**Evidence.** There is a third kind of override the Rule never names, and it ships:
`src/lib/present-channel.ts` declares `{ type: 'transition'; transition: SlideTransition }`,
documented in-file as *"A live-only override of the deck's configured transition"*;
`PresenterOperator.tsx:563,575` renders a `live-transition` `SELECT`; `:341` broadcasts the change;
`ProjectorClient.tsx:12` applies it through `transitionLayerStyle`. The PPTX was written earlier from
`settings.slide_transition` (`settings.ts:13`) and cannot follow.

So an operator can, mid-service, set the projector to `cut` while the downloaded deck fades — *"a deck
that fades in PowerPoint and cuts on the projector"*, verbatim, reachable from a shipped control.

**Failure scenario.** Elen switches the live transition on the presenter to steady a slow projector.
The venue falls back to the PPTX (AD-1's primary Sabbath path) and the transition changes under the
congregation mid-service. Separately, a builder reading *"no per-surface and no per-service override"*
as complete deletes or refuses to extend the `transition` message shape, breaking a shipped feature —
or adds a *second* live-override channel because AD-10 forbids inventing a message shape but AD-23
says no override exists.

**Severity:** HIGH. An `[ADOPTED]` Rule narrower than both the code and its own *Prevents*.

**Fix.** Add one sentence to AD-23's Rule: *"One exception, and it is bounded: the Presenter may
assert a live, unstored transition for the length of one session through the AD-10 message shape
(`present-channel.ts`, `{ type: 'transition' }`). It is never persisted, never reaches the PPTX, and
is not a per-surface or per-service override — the deck's configured value is unchanged and the next
projector render returns to it."* That keeps the invariant and stops the code reading as a violation.

### H2 — The *Boundaries* convention says `src/lib/services/*` is the **only** home of AD-6's precondition; AD-6's own Rule names a second, and Story 20.8 has to pick one

**Spine, `:213` (Consistency Conventions → Boundaries):**

> … AD-6's precondition lives in `src/lib/services/*`. None of the three belongs in a route handler.

**Spine, `:288` (file tree):**

> `src/lib/services/  # service mutation paths -- the only home of AD-6's updated_at precondition`

**Spine, `:103` (AD-6's Rule) says the opposite:**

> This covers registry writes and the **Sync Artifact** action of AD-16 — the shipped shape is
> `expectedUpdatedAt` / `RegistryStaleError` in `src/lib/registry/store.ts`.

**Evidence.** Two independent implementations ship, with different shapes and different error
contracts:

- `src/lib/services/update-service.ts:34,77-78,147` — `class StaleWriteError`, compared as
  `input.updatedAt !== currentUpdatedAt`, re-asserted in the `UPDATE … WHERE … COALESCE(updated_at,
  created_at) = ?`, and **returned as a result** (`{ ok: false, kind: 'conflict', updatedAt }`) — the
  in-file comment says it *"never escapes this module"*.
- `src/lib/registry/store.ts:20,207,223-224` — `class RegistryStaleError`, parameter
  `expectedUpdatedAt`, **thrown** and caught in the route
  (`api/admin/artifacts/[id]/route.ts`, `…/reset/route.ts`).

`grep -rl 'expectedUpdatedAt|RegistryStaleError'` over `src/lib` returns `src/lib/registry/store.ts`
and no file under `src/lib/services/`. "The only home" is false, and the two shapes are not
interchangeable — one returns, one throws.

**Failure scenario.** Story 20.8 builds Sync Artifact. AD-16 says it *"carries the service's
`updated_at` precondition (AD-6)"*; the write target is a registry-shaped snapshot. The builder
consults the *Boundaries* row, puts it in `src/lib/services/*`, and copies the `StaleWriteError`
return-a-conflict shape. A second builder consults AD-6's Rule sentence, uses
`expectedUpdatedAt`/`RegistryStaleError`, and throws. The Sync route now needs both a `kind:
'conflict'` branch and a `catch (RegistryStaleError)` branch to be safe against either; whichever it
omits returns **200 on a stale Sync** and silently replaces a snapshot someone else moved — which
AD-16's own *"destructive means it replaces the snapshot, never that it may overwrite a service
someone else has moved underneath it"* exists to forbid.

**Severity:** HIGH. A direct spine-internal contradiction on a decision the epic's last story must
make, with two live and incompatible answers in the repo.

**Fix.** Delete *"the only home of"* from `:288` and rewrite the `:213` clause to state the actual,
and defensible, split: *"AD-6's precondition has two homes because it has two subjects —
`src/lib/services/*` for a service's own entered data (`StaleWriteError`, returned as a conflict
result) and `src/lib/registry/store.ts` for registry rows (`RegistryStaleError`, thrown). A new write
path adopts the shape of the thing it is guarding, and Sync Artifact — a service mutation whose target
is a snapshot — uses the service shape."* Pick one for Sync explicitly; do not leave it inferable.

### H3 — Nothing requires the ordered registry's order to be **total and deterministic**, which is CAP-1's entire success criterion

**Evidence of the gap.** AD-17's *Binds* names *"the registry's ordering column"* (`:162`); AD-16
clones *"order, kinds, labels, layouts, placeholder bindings"* (`:158`); CAP-1 is mapped to AD-7,
AD-16, AD-20 (`:311`). Not one of them says the order relation is total, tie-free, or deterministic.
The Deferred bullet at `:356` observes that *"`artifact_templates` has **no ordering column**
(`store.ts` orders by `label COLLATE NOCASE`)"* — an observation, with no owner and no constraint on
what replaces it. Confirmed: `store.ts:79-81` is `ORDER BY label COLLATE NOCASE`, and no `sort_order`
/ `position` / `rank` column exists.

Contrast this with AD-19, which *does* fix the analogous property for the sibling concern — *"at most
one registry row may carry each slot identity"* — and even rules out ordinals as identities. The
uniqueness rule exists for slot keys and is missing for order itself.

**Failure scenario.** Story 20.1 adds `sort_order INTEGER` with no uniqueness constraint. Story 20.3's
reorder verb writes a gap-based sequence (`10, 20, 30`) and an insert reuses a value, or two admin
tabs each renumber and land two rows on `20`. `ORDER BY sort_order` is now non-deterministic between
statements. The `/admin/artifacts` list, the clone in Story 20.8, and `buildSlidePlan` each observe a
different tie-break — SQLite is free to return either row first, and the clone persists whichever it
saw. AD-7 guarantees every *surface* agrees with the plan, and it still holds; what breaks is that the
plan and the snapshot no longer agree with the list the administrator authored. CAP-1's success
criterion — *"Reordering two registry entries and creating a new service yields Presenter/PPTX in that
sequence"* — fails intermittently, and AD-7's *Prevents* (*"divergent slide order … between what the
operator controls and what the congregation sees"*) is realised through a route AD-7 does not cover,
because AD-7 governs *who computes* order, not whether the source of order is well-defined.

**Severity:** HIGH. Two units (the reorder verb and the clone) can each be compliant and still
disagree, on the epic's headline capability.

**Fix.** Add to AD-7 or AD-16 (AD-7 is the better home — it already owns order):
*"The ordered registry's order is a **total order with no ties**: exactly one row per position,
enforced by a unique constraint, and every consumer — the admin list, the clone, and
`buildSlidePlan` — reads that one column with no secondary sort. A reorder rewrites positions
atomically. `label COLLATE NOCASE` is the pre-Epic-20 fallback and is removed with the column's
arrival, not kept as a tie-break."* Whether positions are dense or gapped stays a Story 20.1 schema
call and can be added to Deferred alongside the snapshot-location item.

### H4 — Fonts are Deferred, but the fork is already open in two units and AD-22 widens it

**Spine, `:353`:**

> **Fonts (NFR-7) are governed by nothing here.** … **A font is a cross-surface binding — PPTX embeds
> one, the browser resolves another — so it has the shape of an invariant**; it is deferred rather
> than decided because the licence question has to be answered before the binding is worth fixing.

This is the checklist-3 case exactly: the spine naming it does not make it safe, and by its own words
it has the shape of an invariant.

**Evidence that it is already diverging.** Two independent defaults for the same binding:

- `src/lib/artifacts/render-model.ts:94` — `export const DEFAULT_FONT_FAMILY = 'Arial';`, the shared
  resolver both renderers use (`pptx.ts:259`, `ArtifactSlide.tsx:127`). Correct, and AD-12-compliant.
- `src/components/admin/ArtifactEditor.tsx:36` — `const DEFAULT_FONT_FAMILY = 'Arial';`, a **second,
  unexported literal** used at `:159` and `:232` to decide what the editor writes back into the
  registry.

And the validator admits anything: `validate.ts:135-139` accepts any non-empty `fontFamily` string
with no vocabulary check — the one element property in that file with no closed set, while
`ALLOWED_LAYOUT_KEYS` and `ALLOWED_PLACEHOLDER_KEYS` are closed at `:31` and `:24`.

**Why Epic 20 makes it bite.** AD-22 (`:199`) grants the administrator *"font style and font size"* on
every `songset-*` row and free canvas on Generals, and AD-22's own migration clause says a developer
layout replacement is how a font change reaches a deployed database. So Stories 20.4 (General canvas)
and 20.7 (SongSet bounded surface) each need a font vocabulary, from two different surfaces, with
nothing to check them against and NFR-7 unanswered (`epics.md:56` records Story 7-4's Arial as not
freely licensed; `epics.md` gives NFR-7 a standing tension).

**Failure scenario.** 20.4 ships the canvas font dropdown from `ArtifactEditor.tsx`'s own list; 20.7
ships the SongSet font control from a fresh list; the two diverge by one entry. An administrator picks
that entry on a SongSet. `resolveFontFamily` passes the string straight to `fontFace` in `pptx.ts:259`
and to CSS in `ArtifactSlide.tsx:127`. PowerPoint substitutes silently on the venue machine, the
browser substitutes differently, and the lyric slide reflows — NFR-4's headless-safe guarantee and
NFR-3's readability both fail on the projected surface, with no error and no test, because no
allowlist ever existed to fail.

**Severity:** HIGH. Two units, both compliant, already holding two literals, and the epic adds two
more surfaces.

**Fix.** Deferring the *licence* choice is right; deferring the *mechanism* is not — they are
separable. Add a short AD (or a clause on AD-8, which already owns "one shared helper per cross-surface
reference vocabulary"): *"A font family is a cross-surface binding and resolves through exactly one
shared module with one default and one closed admitted set — the same treatment AD-8 and AD-15 give
image references. No surface, editor or renderer, keeps a font default or a font list of its own. Which
families are in the set is NFR-7's open licence question; that the set exists and is enforced on every
write path is not."* Then rewrite the Deferred bullet to defer only the membership question, and note
`ArtifactEditor.tsx:36` as the existing violation to retire.

### H5 — Where the slot identity persists is deferred to **two** stories, while AD-18 and AD-19 constrain the authoritative field's value domain in ways that do not obviously agree

**Spine, `:344` (Deferred):**

> **Where a SongSet slot identity is persisted** — in the `base_type` column itself, or in a
> discriminator beside it — is a Story 20.2 / 20.7 schema call. AD-19 fixes only that the identity
> exists, is unique, is server-owned, and is a semantic name.

**Spine, `:177` (AD-19):** *"the kind vocabulary is exactly the three the SPEC fixes"* … *"`song-set`
names the kind, never an entry: an entry carries one of the four slot identities"* … *"**The recognized
set is therefore closed and complete** — `general`, the four `songset-*` slots, `announcement`: six
keys over three kinds, and no write path admits a seventh."*

**Spine, `:172` (AD-18):** *"the row's `payload` JSON is authoritative for every template field, and
any column duplicating a payload field — `label`, `base_type`, and **any slot discriminator** — is a
**derived index** maintained by the same write."*

**The unresolved question.** AD-18 makes the *payload* authoritative. The payload's field is
`baseType` (`types.ts:82-86`, verified). AD-19 says the closed recognized set is six keys — so does
`payload.baseType` hold the **six-key value** (`songset-bt-open`) or the **three-kind value**
(`song-set`) with the identity in a sibling payload field? Both readings satisfy every sentence quoted
above. The mapping is derivable one way only (key → kind), so the choice is not cosmetic, and the
Deferred bullet's *"in the `base_type` column itself, or in a discriminator beside it"* addresses only
the **column**, leaving the authoritative payload field's domain unstated.

**Failure scenario.** Story 20.2 ("three slide kinds") is the story that rewrites
`ARTIFACT_BASE_TYPES` (today all seven, `types.ts:1-9`) and ships the seven-to-three collapse as
AD-21's data version 1. Reading *"kinds are exactly three"*, it lands `payload.baseType ∈ {general,
song-set, announcement}` and a `CHECK` on the derived column. Story 20.7 then needs four slot
identities with AD-19's at-most-one-per-slot uniqueness, finds nowhere to put them, and must either
widen `baseType` — a **second value migration over the same field**, and AD-21's compaction rule only
rescues this while the transitions are unreleased — or add a discriminator column, at which point
AD-18's derived-index rule requires a payload field to derive it *from* that 20.2 never created.
Meanwhile CAP-5's `[kind] label` chip and CAP-8's per-slot hymn binding read that field from two
surfaces. The spine's *Prevents* for AD-19 — *"two independently-built units agreeing to disagree
about a key"* — lands on the storage of the key rather than its spelling.

**Severity:** HIGH. A deferral spanning two stories, interacting with a versioned migration on the
same field, where the constraining ADs admit two incompatible readings.

**Fix.** Add one sentence to AD-19: *"The persisted authoritative value is the **entry key** — one of
the six — carried in `payload.baseType`; the kind is **derived** from it (`songset-*` → `song-set`)
and is never persisted separately."* Then narrow the Deferred bullet to what is genuinely a schema
call: which *column* indexes it. That leaves 20.2/20.7 free on storage and closed on domain, and makes
AD-18's derived-index rule computable.

### H6 — No AD binds a registry write path to the public-repository privacy filter, while AD-20 requires deck-derived lyric text in a **tracked** seed file

`AGENTS.md` is named as this project's hard gate, and per the review brief a spine licensing something
that map forbids is a finding.

**`AGENTS.md:15-22` / `.constitution/public-repository.md:19` — Never commit:**

> Text extracted from a source deck for a **payload-bearing** slide — family/youth, sermon speaker,
> special song, verse reading, **song lyrics**. …
> **Prefer not producing the value to blocking it afterwards.** … Where a generator reads real
> material, filter at the generator: `evidenceFor` in `scripts/extract-pptx-assets.mjs`, asserted by
> `tests/asset-map-evidence.test.mjs`.

**Spine, `:185` (AD-20):** *"Fixed liturgical content — the standing responses `#671` and `#684`, the
closing *We Have This Hope* — is authored as **General** entries and edited by hand"* — i.e. their
lyrics become canvas text in the registry seed.

**Spine, `:357` (Deferred)** sees the duplication (*"they also duplicate corpus text that already
lives in `data/hymns.json`"*) and the licence link, but not the enforcement gap.

**Evidence of the gap.** `git ls-files data/` returns `data/asset-map.json`,
`data/default-registry.json`, `data/hymns.json` — the seed **is tracked**. Neither enforcement suite
inspects it for payload text: `tests/public-repo-guard.test.mjs` checks tracked congregation
directories, images outside `public/`, committed decks, and a fingerprint list of known literals;
`tests/asset-map-evidence.test.mjs` is scoped to `data/asset-map.json`'s `evidence`/`note` shape
(`:169`). Meanwhile the spine's *own* Deferred list at `:360` opens a second, script-driven writer:
*"Asset extraction for deck elements that have no registry element yet … when it lands it is a
**second** writer into the registry and is bound by AD-15."* AD-15 is structural and image-safety
validation only — it says nothing about privacy filtering. So the spine binds every registry write
path to AD-15 and **no** registry write path to the filter-at-the-generator rule, while creating two
new deck→tracked-file routes.

I do not think AD-20 violates the letter of the ban: standing responses are template copy, and
`AGENTS.md` itself distinguishes *"that week's data, not template copy."* The finding is that the
spine ratifies a new deck→committed-registry path with the guard aimed elsewhere, in a repository whose
stated history is *"each file arrived as a reasonable working artifact and nobody remembered it
later."*

**Failure scenario.** Story 20.1's seed author works from the source deck to reproduce the standing
responses. The same pass picks up an adjacent payload-bearing run — the special-song performer on the
neighbouring slide, a family surname in a shared text frame — into `data/default-registry.json`. The
public-repo guard passes: no new image, no deck, no directory, and the name is not on the fingerprint
list because, as `AGENTS.md` says, *"a fingerprint list only knows names someone already registered —
never the next family."* The asset-map evidence test passes: wrong file. It ships to a public
repository, and the shape of the leak is the one the repository was recreated to prevent.

**Severity:** HIGH.

**Fix.** Extend AD-15's *"every write into the registry is untrusted"* rule by one clause: *"and every
write path that derives content from a source deck — the seed author's hand-authoring under AD-20 and
any extraction script — passes the same filter-at-the-generator rule `AGENTS.md` fixes for
`scripts/extract-pptx-assets.mjs`, asserted over `data/default-registry.json` by an extension of
`tests/asset-map-evidence.test.mjs`. `data/default-registry.json` is tracked; `data/local/` is where a
payload-bearing value belongs (AD-11)."* This is one sentence and it puts the guard where AD-20 moved
the hazard.

### H7 — The AD map claims the tracked **UX** set was repaired; `EXPERIENCE.md:153` still carries a bare `AD-4` that now resolves to a different decision

**Spine, `:42`:**

> **What was repaired, stated precisely (corrected 2026-07-30):** the tracked planning, spec, **UX**
> and story set. Dated **run records** … deliberately keep their contemporaneous citation form and
> were *not* rewritten … Treat any `AD-n` citation in a document dated before 2026-07-30 as requiring
> this table before it can be read.

**`EXPERIENCE.md:153` — a tracked UX artifact, not a dated run record:**

> Registry edits are global and immediate. … There is no per-service override, by design (AD-14).
> **Scheduled to reverse:** Epic 20 CAP-6 clones the registry per service and refreshes it only on
> Sync, **which supersedes AD-4**; this bullet and Flow 5's climax change with that amendment.

**Evidence.** The `(AD-14)` in that same sentence was repaired; the bare `AD-4` was not. Under the new
numbering, AD-4 is *LiveServer durable paths* — and the spine anticipated this exact confusion at
`:147`: *"Not to be confused with AD-4 (LiveServer durable paths), which is a different decision and
is not affected."* A full sweep of `AD-[0-9]+` across `_bmad-output/planning-artifacts/ux-designs/`,
`_bmad-output/specs/` and `_bmad-output/project-context.md` found this as the **one** live
mis-resolution outside the run records; everything else resolves correctly (DESIGN.md `AD-15`/`AD-7`;
EXPERIENCE.md `AD-1/5/6/7/8/10/12/13/15`; project-context.md `AD-5/9/17/18/21`, and its lines 85-86 are
correctly synced to AD-9/AD-17/AD-18/AD-21). The repair work was clearly thorough — which is why the
residual scope claim is the problem, not the volume.

**Failure scenario.** A Story 20.8 builder reads the AD map, sees UX declared repaired, opens
`EXPERIENCE.md` for the flows it owns per `AGENTS.md`'s authority map, and reads that CAP-6 supersedes
*durable paths*. Best case, ten confused minutes. Worse, the reverse: someone repairing AD-4's Deferred
durability bullet greps for `AD-4` citations, finds this one, and "fixes" a UX flow bullet to talk
about `DB_PATH`. The map's whole value is that it tells you when it is needed — a false scope claim is
worse than no claim, because the reader stops checking.

**Severity:** HIGH — the AD map is the one paragraph in the file whose accuracy the entire renumbering
rests on, and it was already corrected once for over-claiming.

**Fix.** Two words plus a pointer: change *"the tracked planning, spec, UX and story set"* to
*"the tracked planning, spec, UX and story set, with one known residue: `EXPERIENCE.md:153` cites bare
`AD-4` where it means AD-14/AD-16 — the same bare-citation class as the
`sprint-change-proposal-2026-07-29.md:85` case below, and it is a tracked artifact rather than a run
record."* The `EXPERIENCE.md` edit itself belongs to `bmad-ux`, not to this file.

---

## MEDIUM

### M1 — AD-16 (432 words) and AD-22 (440 words) are single unbroken paragraphs holding ~12 obligations each

Measured word counts of the `- **Rule:**` lines: AD-16 **432**, AD-22 **440**, AD-5 **307**, AD-19 270
+ 138 + 122 + 207 = **737** across four paragraphs, AD-17 242 + 135. For contrast, the ADs that read
cleanly sit at 42-101 words (AD-3 42, AD-2 47, AD-6 54, AD-1 60, AD-7 62, AD-8 67, AD-14 70, AD-13 71,
AD-12 73, AD-15 77, AD-11 80, AD-9 101).

The prose is not padding — nearly every clause carries a falsifying reason, which is what makes this
spine defensible rather than assertive, and AD-19's **four labelled sub-rules** show the pattern that
works. The problem is the two that did not get that treatment. AD-16's single paragraph contains: the
clone-on-create rule, creation-is-the-only-freeze-event, which surfaces read the snapshot, the
Sync-only channel, Sync-permitted-on-any-service, the AD-6 precondition, the may-not-alter-entered-data
rule, the definition of "destructive", admin-only + role re-check + matcher test + `requireAdminSession`,
operator-may-request-not-perform, clone validates under AD-15, announcement membership not cloned, no
obligation to keep old snapshots renderable, snapshot-is-the-sequence-input, the no-snapshot runtime
state and its migration meaning, and a naming caution about the shipped `RegistrySnapshot` type. A
builder cannot enumerate their obligations from that without re-parsing the paragraph, and Stories 20.7
and 20.8 are the two stories that must.

**Fix.** No content change. Split AD-16's and AD-22's Rules into labelled sub-rules on the AD-19
model — for AD-16, something like *Rule — the clone and the freeze event*, *Rule — Sync is the only
channel, and it is admin-only*, *Rule — what is not cloned*, *Rule — the no-snapshot state*, *Naming
caution*. Same word count, checkable structure.

### M2 — Neither mermaid graph shows the live Announcements path, which is AD-16's one deliberate exception

AD-16 (`:158`) makes it explicit: *"**Announcement membership is not cloned:** the Announcements
master list stays live and reaches an existing service at render time (CAP-7)."* The Capability map
(`:317`) routes CAP-7 through `src/lib/announcements.ts` → plan.

Graph 2 (`:263-279`) shows `Snap --> Plan` and then asserts `Plan -.->|"never reads the live registry
(AD-16)"| Registry`. There is no Announcements node in either graph, and no live edge into `Plan`
other than the snapshot. Graph 1 (`:240-257`) likewise routes everything through `Snap`.

**Failure scenario.** Story 20.6 (Announcement expands) or 20.8 (clone/sync) reads the diagram —
which the spine says is where structure lives — sees exactly one input to the plan and a prohibition
on live reads, and freezes announcement membership into the snapshot for consistency. CAP-7's success
criterion (adding an announcement image reaches an existing service) then fails, and the fix is a
schema change to the snapshot.

**Fix.** Add to graph 2: `Ann[(Announcements master list)] -->|"membership NOT cloned, live at render (AD-16, CAP-7)"| Plan`.
One line, and it makes the exception structural rather than buried at word 300 of AD-16's paragraph.

### M3 — `-.->` means "real optional channel" in graph 1 and "forbidden edge" in graph 2

Graph 1, `:256`: `WebShow -.->|"AD-10 BroadcastChannel + plan identity"| Projector` — a **real**
channel, dotted because it is client-side.

Graph 2, `:276-278`: `Web -.->|no registry or snapshot access| Snap`, `Pptx -.->|no registry or
snapshot access| Snap`, `Plan -.->|"never reads the live registry (AD-16)"| Registry` — three
**prohibited** edges, drawn in the same notation.

Both graphs parse, and I confirmed the shape/label/edge syntax is valid throughout (`[(...)]`
cylinders, quoted labels containing `/` and `(`, forward-declared `Registry`). The problem is
semantic: a reader who learns `-.->` from graph 1 reads graph 2's three dotted edges as real
dependencies with cautionary labels — and an arrow drawn between two nodes to assert that no arrow
exists is a notation that inverts under skim. That matters more here than usually, because AD-12's
whole point is that renderers have no registry access, and graph 2 is where a builder would look to
confirm it.

**Fix.** Either use `linkStyle` / a distinct class for the prohibition edges and say so in a legend
line under the graph, or drop the three forbidden edges and state the prohibition in the caption that
already sits at `:259-261` (*"read **through** the plan, never by a renderer"* — which already says
it in prose).

### M4 — i18n / locale is a fully silent dimension

No occurrence of i18n, internationalization, locale, language, or timezone anywhere in the spine.

This is not academic for this system. `src/lib/lyrics.ts` emits both `Reff` and `Chorus` as verse
labels (per the Story 20.1 seed note recorded in `sprint-status.yaml`), the hymnal is SDAH, the deck is
projected to one congregation, and AD-20 moves fixed liturgical text out of code and into
administrator-authored registry rows — which makes **the seed a locale artifact**. AD-19 then fixes a
closed key vocabulary in English (`songset-bt-open`) that CAP-5 requires be *displayed* as `[kind]
label`. Two units can diverge: the admin UI's chip text, the Placeholder Catalog's admin-facing key
labels, and the seed's authored text can each pick a language independently, and AD-19's key spelling
becomes a persisted binding under AD-18/AD-21 the moment it is chosen.

The right answer here is almost certainly *"single-locale, no i18n layer, keys are English identifiers
and never displayed raw"* — which is cheap to state and closes it. The finding is the silence, per the
rubric.

**Fix.** One Deferred bullet: *"**i18n: single-locale by decision, not by omission.** The hub is one
congregation's internal tool; there is no locale layer and no translation surface. Registry keys
(AD-19) are English machine identifiers and are never rendered raw to an administrator — CAP-5's chip
shows the label. Authored seed text and lyric labels (`Reff`/`Chorus`) are congregation-language data,
not code. Revisit only if a second congregation adopts the hub, which `Multi-Church Configuration`
already defers."*

### M5 — Error/failure semantics is decided three different ways with no rule saying which applies where

Three distinct postures, all in the spine, none reconciled:

1. **Fail closed.** AD-5: *"**fails closed** if that lookup throws"*; `WEBHOOK_SECRET` 503/401. AD-19
   notes `hydrate.ts` *"fails closed on a required binding — **on a Sabbath**"* — cited as a hazard,
   not decided as policy.
2. **Non-fatal and surfaced.** AD-19: an unclaimed hymn is *"**surfaced, never silently dropped and
   never fatal**"*.
3. **Log and fall back.** `registry-snapshot.ts:41-64` (which the spine ratifies at `:348`: *"Keep the
   per-row corrupt-payload fallback at `:56-63`"*) logs and substitutes.

Nothing says which posture a *new* failure gets. AD-20 and AD-22 hand deck composition to the
administrator, so Epic 20 multiplies the render-time failure modes: a General referencing a
Placeholder Catalog key with no weekly value, a `songset-*` row whose slot has no hymn number, a
snapshot whose layout no longer validates. AD-19 already names the collision (a catalog key admitted
with no filler → `hydrate.ts` fails closed at 08:40) and fixes the *catalog*, not the *posture*.

**Failure scenario.** Story 20.5 builds the catalog and treats a missing weekly value as
fail-closed-on-required, matching `hydrate.ts`. Story 20.7 builds the SongSet slots and treats a
missing hymn number as inert-and-surfaced, matching AD-19's unclaimed-hymn rule. An operator who fills
neither gets, for the same class of omission, a blank slide with a warning on one row and no deck at
all on another. Both builders cited the spine.

**Fix.** One clause, probably on AD-7 (it owns the plan) or as a new Consistency Conventions row:
*"Render-time failure has one posture: **a missing or unresolvable weekly value degrades the slide and
is surfaced on the service surface; it never fails the deck.** A structurally invalid template or
snapshot logs and falls back per row. Only an authorization or secret failure fails closed. `AD-1` is
why: a deck that will not build cannot be retried during a service."* Note that this may contradict
`hydrate.ts`'s current required-binding behaviour, which is exactly the thing worth deciding at spine
altitude rather than per story.

### M6 — The "unacknowledged handoff" Deferred bullet omits the largest unacknowledged handoff

**Spine, `:358`:**

> **Two affordance questions this spine hands to `EXPERIENCE.md` have not been received there.** The
> stale-snapshot affordance and Reset-reverts-a-rename (both below) are routed to that document, whose
> *Open Items* carries neither. Recorded here because **an unacknowledged handoff is exactly how these
> four artifact families drifted apart in the first place**.

Verified accurate: `EXPERIENCE.md:237-249` lists four Open Items (projector death / no accessibility
verification / unsaved canvas changes / session revocation mid-edit) and neither routed question.

But the same document **actively asserts the rule AD-16 reverses**, as present-tense fact:
`EXPERIENCE.md:153` — *"Registry edits are global and immediate. An administrator changing a template
on Friday changes every service … There is no per-service override, by design"* — hedged only by
*"Scheduled to reverse."* And `grep -i 'sync artifact|snapshot'` over `EXPERIENCE.md` returns **nothing**:
the Sync Artifact action AD-16 creates, which `AGENTS.md` requires appear in the IA table as a new
surface, is absent. `epics.md:374` tracks this (*"**Still outstanding** — this is what remains of Story
20.8's block"*), so it is not unknown — it is simply not in the bullet that exists to catch precisely
this.

**Severity:** MEDIUM — tracked elsewhere, so not a hole; but the bullet's own stated rationale makes
the omission self-undermining.

**Fix.** Extend the bullet to three items, and name the direction: *"and one larger one:
`EXPERIENCE.md` → *Venue & Projection Constraints* still states the global-and-immediate rule AD-16
reverses, and no IA entry exists for the Sync Artifact surface. Tracked as Story 20.8's remaining block
(`epics.md:374`); the receiving edit belongs to `bmad-ux`."*

### M7 — AD-6's webhook remedy is left as a two-way choice with no criterion

**Spine, `:349`:** *"The decision is not in question — only which story lands it, **and whether the
webhook gets a token or an explicit trusted-single-writer carve-out with the cost written down**."*

Those two are not interchangeable. A token means the agent participates in optimistic concurrency and
a late correction 409s. A trusted-single-writer carve-out means the agent's write always wins. AD-6's
*Prevents* is *"an operator's edit silently erased by a late correction"*, and its gap clause is
emphatic that the unguarded path *is* the agent path — *"scoping the rule would abandon the hazard
rather than record it."* So the two options are opposite answers to the *Prevents*, and the spine
declines to say which, while asserting *"the decision is not in question."*

**Fix.** State the criterion even if the mechanism waits: *"The remedy must preserve the Prevents: if
the webhook cannot carry a precondition, the carve-out is bounded to intake (creating a service that
does not yet exist) and never to correction of a service an operator may have edited."* That is a
decision; which story lands it is sequencing.

### M8 — Operations has no invariant and is deferred only by reference

AD-4 (`:93`) points at `docs/deployment-guide.md` / `docs/deploy.md` for *"Operator details"*, and the
Deferred list explicitly names observability, durability, secrets and performance as unfixed. What is
never named as a dimension at all is operations proper — restart/upgrade procedure, the rebuild the
seed marker interacts with, who runs `npm run registry:doctor` and when.

This is load-bearing under Epic 20 specifically: AD-17 makes bootstrap a one-time marker-gated event,
AD-21 fixes the `getDb` order (DDL → migrations → bootstrap) and requires developer databases be
**reset** rather than migrated, and the Deferred list at `:347` notes AD-21's counter has no owning
story. Together those mean the *deploy and rebuild procedure* becomes part of the correctness argument
— AD-21's own worst-case scenario is a boot at 08:40 on a Sabbath. Nothing says the procedure is
documented, versioned, or tested.

**Fix.** Add a Deferred bullet naming it, on the model of the observability one: *"**Operations: no
invariant.** Restart, rebuild and upgrade procedure lives in `docs/deploy.md`; nothing at this altitude
fixes it, though AD-17's bootstrap marker, AD-21's ordered `getDb` path and its developer-database
reset rule all assume a procedure exists. Current floor: `docs/deploy.md` plus `npm run
registry:doctor`. Revisit at first deploy, with data durability (above) — same milestone."*

---

## LOW

### L1 — "nine routes" is eleven

AD-5 (`:98`) and the Deferred bullet (`:338`) both say *"the nine non-admin routes that carry no
in-route `requireSession`"*. Enumerating matcher-covered API routes with no `requireSession` /
`requireAdminSession` gives **eleven**: `announcements/route.ts`, `announcements/[id]/route.ts`,
`hymns/route.ts`, `scripture/route.ts`, `services/route.ts`, `services/[id]/route.ts`,
`services/[id]/pptx/route.ts`, `services/preview/route.ts`, `upload/route.ts`,
`upload/from-url/route.ts`, `uploads/[filename]/route.ts`. (`auth/login`, `auth/logout` and
`api/webhook` are excluded by the matcher by design.) `deferred-work.md:158` carries the same "nine"
and its evidence line lists six *glob patterns*, which is likely where the count came from before
`services/preview` and `upload/from-url` were added.

**Fix.** Say *"eleven"* in both places, or better, *"every non-admin API route"* — a count is a thing
that goes stale, and AD-5 does not need the number.

### L2 — AD-11 uses a clause-level `[TARGET]` that the tag table does not define

The tag table (`:66-73`) defines three tags at AD level. AD-11's gap clause (`:131`) then says *"until
that lands, read this clause as `[TARGET]`"* — a fourth, per-clause mechanism, introduced by prose.
It is clear in context and arguably the most honest thing to write, but the table claims to be the
vocabulary.

**Fix.** Add a row or a sentence to the table: *"An `[ADOPTED, partial]` AD may mark an individual
clause `[TARGET]` inline where the gap is one clause rather than the whole rule."*

### L3 — `spec-slide-artifact-model`'s nine capabilities are traced by *Area*, not capability, and `binds:` omits them

The Capability map's stated test (`:305`) is *"a capability with no governing decision is a hole, and
this table is where it shows."* The Epic 20 table runs that test CAP by CAP. The Epic 16 table
(`:320-329`) has an **Area** column instead, so the test does not run over CAP-1..CAP-9 of a spec that
is a declared `source` of this spine. `binds:` (`:11`) lists `spec-artifact-registry-authoring CAP-1..CAP-8`
and no equivalent for the other spec.

Spot-checking, coverage is actually fine (CAP-9 → AD-5/AD-14/AD-15/AD-6; CAP-4/CAP-6 → AD-12; CAP-3 →
AD-13; CAP-5's preview badges are correctly *not* an invariant). One is worth noting: CAP-7's success
criterion is *"`buildSlidePlan` no longer owns those literals"*, and AD-20 `[TARGET]` says the planner
still injects the standing responses — so a delivered spec's criterion and a `[TARGET]` AD describe the
same code differently. That is the spec's problem to state, not the spine's.

**Fix.** Either add `spec-slide-artifact-model CAP-1..CAP-9` to `binds:` and convert the second table
to CAP rows, or say in one line why Area granularity is right for a delivered spec.

### L4 — Production host differs from the PRD

AD-4 (`:93`) says `presenter.example.org`; `prd.md:540` says `presenter.example.church`. Both are
sanitized placeholders, so nothing leaks — but the Stack table's neighbouring discipline about
`package.json` being the authority makes an unexplained mismatch read as drift.

**Fix.** Match the PRD, or drop the hostname from AD-4 — the invariant is *"one host-durable path set
behind a tunnel"*, not the name.

### L5 — `@types/node` is `^20` while the Stack table's Node row is 22.x

`package.json` devDependencies pins `"@types/node": "^20"`. Not a Stack row, so *"zero drift"* is
literally true, but the Deferred `engines` bullet (`:354`) already owns the Node-floor cleanup and
would naturally include this. `Dockerfile:1` (`node:22-bookworm-slim`) and
`.github/workflows/test.yml:19` (`node-version: '22'`) both confirm the spine's claim that CI and the
image already run 22.

**Fix.** Add `@types/node` to the `engines` bullet's list of things to correct alongside the five docs
that still say Node 20.

---

## What is working, said plainly

Worth recording so a later pass does not "fix" it:

- **The status-tag mechanism and its rationale** (`:62-73`). *"A rule written in the indicative present
  says two different things"* is the correct diagnosis, and the *"a `[TARGET]` rule is no less binding"*
  sentence pre-empts the obvious misreading. 20 of 23 tags are right.
- **Falsifying reasons attached to prohibitions.** AD-5's *"the flat claim that `middleware.ts` is Edge
  is false, and a rule defended by a refutable reason is a rule that gets reverted"*, and AD-22's
  demonstration that the in-layout marker cannot ship against `ALLOWED_LAYOUT_KEYS` (verified,
  `validate.ts:31`). Both convert assertions into arguments.
- **Citation accuracy.** Every one of the ~25 `file:line` references I checked resolved to what the
  spine says is there, including five-site `skipTitle` and four-line payload-vs-column reads. That is
  rare and it is what let this review be about substance.
- **The AD-9 ↔ AD-18 division of labour** and **AD-21's fixed `getDb` order**, both of which state the
  worse-but-compliant alternative and why it is worse.
- **AD-16's no-snapshot runtime state** (`:158`), which converts what would be a three-story fork into
  one defined behaviour and names the SPEC assumption it satisfies (`SPEC.md:88` — verified).
- **The Deferred list's discipline.** Most bullets carry a current floor, a revisit trigger, and an
  owner or an explicit statement that there is none. The durability bullet (`:350`) is the model.
