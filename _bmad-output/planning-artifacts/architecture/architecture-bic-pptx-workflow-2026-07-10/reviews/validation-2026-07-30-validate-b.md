# Reviewer Gate — Validate intent (2026-07-30, run B: five lenses, wider aperture)

Target: `ARCHITECTURE-SPINE.md`, AD-1..AD-22, unchanged since `c04fea0`.
Repo HEAD at review time: `7aea0d6`.

**Standalone Validate run — the spine is not modified by it.** Lenses run: deterministic
`lint_spine.py`, the good-spine rubric walker, both configured `finalize_reviewers`
(version/reality-check, adversarial two-units), plus two ad-hoc lenses this altitude and these
stakes earn: **brownfield ratification** (does the spine describe the code it governs) and
**cross-document coverage** (does the corpus citing the spine agree with it). Each ran as an
independent subagent with no access to `reviews/` or `.memlog.md`, so none could confirm a prior
verdict — every finding was re-derived.

---

## Verdict

**Not a clean pass, and the gap is wider than the last round measured.** The spine's *shipped*
half (AD-1..AD-15) is genuinely strong — AD-5 is ratified against `src/proxy.ts` line for line, and
AD-7/AD-8/AD-9/AD-10/AD-15 are all obeyed by real code. Two problems sit above that:

1. **Two `[ADOPTED]` invariants are false about the code they claim to ratify** (AD-6's precondition,
   AD-11/AD-17's seed boundary). An `[ADOPTED]` tag is the strongest claim this document makes, and
   in both cases the failure it names is live in shipped code today.
2. **The Epic-20 half (AD-16..AD-22) is written in the indicative present with no status vocabulary,**
   so a reader cannot tell decided-but-unbuilt from already-true. That single omission is the
   mechanism behind five separate findings.

Consolidated after dedup across five lenses: **9 CRITICAL · 22 HIGH · ~30 MEDIUM/LOW.**
`lint_spine.py`: **0 findings** (AD ids ascending and unique, every block carries Binds/Prevents/Rule,
every Stack row pinned, no placeholders).

### The prior round's findings are still open — the spine has not been edited since

`ARCHITECTURE-SPINE.md` was last modified in `c04fea0`. The two commits since (`ad20887`, `7aea0d6`)
added the previous validation report and repaired a spec; neither touched the spine. **All 13 findings
from the 2026-07-30 morning Validate run therefore persist verbatim.**

This round independently re-derived **7 of those 9 substantive findings** without seeing them — and
sharpened three of them:

| Prior finding | This round | Change |
| --- | --- | --- |
| C1 `EXPERIENCE.md:153` contradiction | **C7** (cross-doc F-2) | Confirmed, plus `:216` and `:47` |
| H1 seed vocabulary / boot order | **H10** (adversarial P5) | Sharpened — the reverse order destroys all four slot bindings |
| H2 canvas editor directory | **C5** | Re-derived by **four** lenses independently |
| M1 AD-22 "distinguishable, shape TBD" | **H11** (adversarial P6) | **Sharpened materially** — the shipped validator *forecloses* one of the two options AD-22 offers |
| M2 AD-19 present tense | **H5** | Generalized — it is a whole-spine status-vocabulary gap, not one AD |
| M3 backup / DR silent | **H21** | Confirmed as one of four silent dimensions |
| M5 unrenderable failure mode | tail (adversarial P14) | Confirmed |

Prior H3 (where a slot identity is persisted) was **not** re-flagged as a hole: the rubric walker
judged the Deferred section clean, while the adversary attacked the same column from a different
angle and found **C3** instead. Read those two together — the fork is real, it just bites through
the payload/column split rather than through the naming choice.

---

## CRITICAL

### C1 — AD-6's "No write path may bypass the precondition" is false, and the unguarded path is the unattended one
*Found independently by the rubric walker and the brownfield lens. Verified directly by the parent.*

AD-6 is `[ADOPTED]`, its **Binds** names *"agent/webhook corrections"*, and its **Prevents** is
*"an operator's edit silently erased by a late correction (last-write-wins)."* The operator path
honours it rigorously (`update-service.ts:77-78` → 409 at `services/[id]/route.ts:67-69`, pinned by
`tests/services-http.test.mjs:321,353`). The webhook path carries no precondition at all:

```
src/app/api/webhook/route.ts:123-127
  UPDATE services SET date = ?, raw_payload = ?, parsed_data = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
```

Confirmed by direct grep: the only `updated_at` references in that file are the three
`CURRENT_TIMESTAMP` writes — no token is ever read, and `tests/webhook-auth.test.mjs` asserts nothing
about staleness. The intake path is the same shape (`:228-232`). Three more paths bypass it:
`DELETE /api/services/[id]`, and `PATCH`/`DELETE /api/announcements/[id]` (whose table has no
`updated_at` column at all).

Two documents agree with the code and against the spine: `prd.md:113` states a re-send *"overwrites
the current payload, including any prior web-form edits"*, and `deferred-work.md:116` records that
even where the precondition *is* enforced, `updated_at` is second-granularity so two edits inside one
second both pass. The spine's Deferred list additionally marks FR-12/13b **shipped**.

**Why critical:** a builder implementing Sync Artifact (AD-16) will assume the pattern is uniform.
The one path that skips it is the agent path — the one that fires unattended, on a Friday.

**Fix (spine-owned):** either scope the rule — *"every cookie-authenticated service mutation"* — and
move all four paths into Deferred with the second-granularity note beside them, or keep it absolute
and file the code gap as a story. Correct the "Shipped" line either way. Do not leave the rule
claiming coverage it lacks.

### C2 — The seed resurrects a deleted registry row at *plan-build* time, which is exactly what AD-17 exists to forbid
*Found independently by three lenses (rubric C-2, adversarial P2, brownfield BR-7).*

AD-17's **Prevents** is a gap-filling seeder that *"resurrects the row on every boot, forever."* Its
**Rule** closes the *boot* path only — and the read path does the forbidden thing:

```
src/lib/artifacts/registry-snapshot.ts:85-90
  for (const seed of loadSeedTemplates()) {
    if (!snapshot.has(seed.id)) {
      snapshot.set(seed.id, { ...seed, updatedAt: SEED_FALLBACK_UPDATED_AT });
    }
    rejected.delete(seed.id);   // <- also suppresses the only log line
  }
```

`loadRegistrySnapshot` runs **per plan build**. Under CAP-2 a delete is a normal administrator
action, so: the row is gone from `/admin/artifacts` (which reads the DB), and the slide is still in
the PPTX, the slideshow, the presenter and on the projector — every week, forever, with **no log
line**, because `rejected.delete(seed.id)` suppresses it. CAP-1's *"one ordered registry defines
which slides exist"* is false in both directions simultaneously. Under AD-16 the clone-on-create then
writes the resurrected row into every new service's snapshot, so Sync cannot clear it either.

Two further consequences: AD-17's *"AD-11's two-layer seed is therefore read only at first boot"* is
**factually false today**, and the spine's own line-306 retirement list — careful about
`reseedArtifactTemplateIfUntouched`, `registry:doctor` and `tests/registry-reseed.test.mjs` — never
names `registry-snapshot.ts`. Diagram 2 draws the seed reaching only `Registry`, never `Plan`, so the
diagram agrees with the AD text and both disagree with the code. AD-11's supersession note names only
the *"startup inserts missing template IDs"* clause, so the read-time fallback is not covered by the
supersession at all.

**Fix (spine-owned):** extend AD-17 from "boot" to **"no path"** — the seed is read at exactly two
moments, first-boot bootstrap and explicit per-template Reset; a template id absent from the database
is absent from the deck. Add `registry-snapshot.ts:85-90` to the line-306 retirement list with the
same *invert-don't-delete* note the reseed test carries. Keep the corrupt-row fallback
(`:56-63`) — that is a different concern.

### C3 — `base_type` and `label` are persisted twice, and the two readers read different copies
*Adversarial P1. Nothing in the spine names either copy.*

Every registry row carries `base_type`/`label` in **both** a column (`db/index.ts:178-185`) and inside
the `payload` JSON (`store.ts:238-269` writes both from one validated object — they agree only by
convention). The readers are split:

- `listArtifactSummaries` (`store.ts:74-92`) reads the **column**, and derives `editable` from it.
- `rowToStored`/`getArtifactTemplate` (`store.ts:35-38, 94-106`) and `parseRow`
  (`registry-snapshot.ts:41-64`) read the **payload**; the column is never consulted.

AD-18 **Binds** *"the `base_type` value set"* and AD-21 says *"a counter and a convention, not a
framework"* — so the plainest compliant migration is one `UPDATE ... SET base_type = ...` on the
column. After that deploy: `/admin/artifacts` lists a row as `[general] Welcome` and editable
(column) while `buildSlidePlan` hydrates it as `text-placeholder` (payload) and renders the
pre-collapse layout; opening it throws `RegistryValidationError('Template base type is read-only')`
from `store.ts:226`; and `assertStableAgainstSeed` (`store.ts:127`) refuses every save with
`baseType cannot be changed`. Nothing logs, nothing 409s. **The admin's screen and the congregation's
screen disagree about what kind every row is, undetectably from either one.**

**Fix (spine-owned, tighten AD-18):** name the authoritative copy — the row's `payload` is
authoritative for every template field; any column duplicating a payload field is a derived index
maintained by the same write; a value migration rewrites the payload and re-derives columns in the
same statement, asserted by a test that column and payload agree for every row.

### C4 — The hymn number gets two owners, spelled ordinally in one and semantically in the other
*Adversarial P3.*

AD-19 fixes that the slot identity *"**is** the key the worship-service settings form binds a hymnal
number to"* and that it must be *"a semantic name, never an ordinal."* But four **ordinal** form
fields already ship and already persist: `song1Number..song4Number`
(`worship-form-fields.ts:6-9`, `parsed-fields.ts:20-23`), mapped positionally at
`parsed-fields.ts:418-421` into `parsed_data.items`. AD-19 bans the ordinal spelling for the
*registry identity* and is silent about them; AD-3 forbids the webhook knowing registry slot keys.
So the value gets two writable homes and no AD says which one `buildSlidePlan` reads.

Symptom: Wednesday the operator sets DS opening hymn 245 in both homes. Friday an authorized FR-12
correction makes it 312 — `updateService` rewrites `parsed_data` (Home A); Home B is untouched.
Sabbath: **the deck renders 245 while the run sheet and the edit form both show 312.** Reopening the
form and saving rewrites Home A to 312 again and the deck still shows 245. No 409, no log, and no
surface where both values are visible together.

**Fix (spine-owned, AD-19):** a weekly value a slot binding names has exactly one persisted home —
the service's own entered data; the binding is a *key into* it, never a second copy. The four
`songset-*` identities **replace** `song1Number..song4Number` in the same change set that introduces
them — deleted, not aliased.

### C5 — The canvas editor's directory is wrong in three places, and the wrong directory is the render path
*Found independently by **four** lenses. Also finding H2 of the morning round — unfixed.*

The editor is `src/components/admin/ArtifactEditor.tsx`. `src/components/artifacts/` contains **only**
`ArtifactSlide.tsx` — the web **renderer** that `SlideView` renders through. The spine points at the
renderer directory three times: CAP-3's *Lives in*, the Epic-16 map's *Canvas editor boundary*, and
the Structural Seed tree (which omits `admin/` entirely).

This is not cosmetic: a builder acting on CAP-3 pulls Fabric into the render path — precisely the
separation AD-12/AD-13 exist to keep. Note the failure mode: the Deferred section's
`ArtifactEditor.tsx:104` and `registry/store.ts:226` line numbers are both **exactly right**. The
line numbers were checked; the directory was asserted.

**Fix (spine-owned, mechanical):** `src/components/admin/ArtifactEditor.tsx` in all three places; add
`admin/` to the tree; keep `artifacts/` where the reference is to `ArtifactSlide.tsx`.

### C6 — `epics.md` and `sprint-status.yaml` order the migration AD-18 forbids, and Story 20.2 is pointed at it
*Cross-doc F-1. Companion-owned.*

`epics.md:369` and `sprint-status.yaml:205` both say the `base_type` collapse *"needs a backfill over
live `artifact_templates` rows **plus every service snapshot**."* AD-18 says the opposite in terms:
a migration *"does **not** rewrite service snapshots — structure reaches an existing service only
through Sync Artifact (AD-16), so a migration that rewrote snapshots would be a second structural
channel."* `epics.md:381` points Story 20.2's implementer at exactly that paragraph.

**Fix (companion-owned):** replace both clauses with AD-18's rule and cite it. The spine can only
report this.

### C7 — `EXPERIENCE.md` still states the rule AD-16 reversed, and cites the wrong AD
*Cross-doc F-2. Also finding C1 of the morning round — unfixed, and confirmed live by the parent.*

`EXPERIENCE.md:153` reads: *"Registry edits are global and immediate… There is no per-service
override, by design (AD-14). **Scheduled to reverse:** Epic 20 CAP-6 clones the registry per service…
**which supersedes AD-4**."* AD-16 was recorded 2026-07-30 — the reversal is **decided, not
scheduled** — and the superseded decision is **AD-14**, not AD-4 (LiveServer durable paths). The
spine's AD-14 literally anticipates this error: *"Not to be confused with AD-4… which is a different
decision and is not affected."*

Flow 5's climax at `:216` then states as fact that a Save makes *"every service — including ones
already reviewed — render the new geometry."* `:47` calls `/admin/artifacts` a canvas editor for
*"**global** slide templates."* The IA table has no surface for AD-19's per-slot hymnal binding.

`AGENTS.md`'s own BMad gate requires a structural-invariant change to travel with its companion docs
in the same change set. AD-16 is exactly such a change; `EXPERIENCE.md` was not amended with it.

**Fix (companion-owned, `bmad-ux` Update):** restate `:153` under AD-16 with the correct number,
rewrite Flow 5 step 4, add a Sync Artifact beat and a stale-snapshot state, fix `:47`, add the four
slot fields to the `/services/*` rows. Closes the open item at `epics.md:374`.

### C8 — `authoring-boundaries.md:18` offers an admin-editable `baseType`; AD-19 forbids exactly that
*Cross-doc F-3. Companion-owned; `sprint-status.yaml:310` already tracks it as Gap 4, open.*

*"Edit **Label** (and optionally **baseType**) in the slide inspector."* AD-19 requires the slot
identity be *"never administrator-editable"* and that *"at most one registry row may carry each slot
identity."* An admin `baseType` control lets one row be retyped into `songset-ds-open` while another
already holds it — breaking the uniqueness the hymnal binding depends on.

### C9 — `spec-slide-artifact-model/SPEC.md:64-65` presents two reversed clauses as live constraints
*Cross-doc F-4. Companion-owned.*

`:64` *"a startup seed that **inserts missing template IDs only**"* — reversed by AD-17, whose entire
Prevents is that this resurrects rows forever. `:65` *"Artifact templates are **global across
services**"* — reversed by AD-16. The file's supersession note at `:16` enumerates only *two*
reversals, which affirmatively implies the rest still binds. Stories 20.1/20.3 read this file.

---

## HIGH — grouped by what fixes them

### The single highest-leverage fix

**H1 — There is no status vocabulary, and its absence is the mechanism behind five findings.**
`[ADOPTED]` sits on 6 of 14 shipped decisions and on **none** of the 7 unbuilt ones, so its absence
means both "not yet verified against code" and "not yet built." Every AD-16..AD-22 rule reads as
accomplished fact. One sentence under *Invariants & Rules* — or tagging every AD — collapses H2, H3,
H4, H5 and the AD-19 present-tense finding below it.

Consequences currently reading as fact:
- **H2** — AD-16's service-bound snapshot **does not exist** (no clone-on-create, no Sync, no
  per-service store); `slide-plan.ts:692` calls `loadRegistrySnapshot()` against the *live* registry
  per plan build. Diagram 2 nonetheless draws `Snap --> Plan` and crosses out `Plan --> Registry` as
  present-tense system fact. Compounded by a **name collision**: shipped `RegistrySnapshot` means
  "live-registry map for one plan build"; AD-16's "snapshot" means "per-service durable freeze."
- **H3** — AD-20 states the `skipTitle` mechanism *"is removed… there is nothing left to suppress."*
  **Parent-verified: it ships at five sites** — `slide-plan.ts:140, 148, 438, 460, 550`. No Deferred
  bullet mentions it. *(Two lenses disagreed here; see Lens disagreements below.)*
- **H4** — AD-19's Placeholder Catalog *"admitted key set… enforced on every write path"* **does not
  exist.** `validate.ts:24`'s `ALLOWED_PLACEHOLDER_KEYS` is an object-key whitelist
  (`key`/`type`/`required`/`defaultValue`); the only `placeholderKey` check (`:344`) is against the
  template's own declarations. CAP-4 points at this file for "catalog vocabulary" — **the name
  similarity makes a grep look like confirmation.**
- **H5** — *"Ordered Artifact Registry"* describes nothing in the DB: `artifact_templates` has no
  ordering column, `store.ts:81` orders by `label COLLATE NOCASE`, and `/api/admin/artifacts` is
  **GET only** — no create, delete, or reorder. AD-17 *Binds* "the registry's ordering column."
- Also: AD-19's *"gone rather than renamed"* is indicative while `ARTIFACT_BASE_TYPES` still holds
  seven; the "today it is seven" flag exists **only in AD-18**.

### Stack and mechanism claims

**H6 — The Node.js row fails four ways at once, and Node 20 is end-of-life.** Node 20 reached EOL
**2026-04-30** — three months ago. `package.json` has **no `engines` field**, so *"package.json is the
version authority"* is vacuous for this row. `v20+` is imprecise even for 20: Next 16.2.10 requires
`>=20.9.0`. And reality already moved — `Dockerfile:1` is `node:22-bookworm-slim` and
`.github/workflows/test.yml:19` is `node-version: '22'`. For a system whose entire reliability story
is Sabbath uptime (AD-1), published to the internet through a tunnel (AD-4), an unpatched runtime
floor is a posture claim, not pedantry. Five docs repeat "Node 20."
*Fix:* `Node.js | 22.x LTS (>=22.12); Next requires >=20.9.0 — Node 20 EOL 2026-04-30`, add
`"engines"` to `package.json`, correct the five docs in the same change set.

**H7 — AD-5's stated reason for banning `middleware.ts` is false as written.** Node-runtime
middleware has been stable since Next **15.5.0** (`node_modules/next/dist/docs/.../proxy.md:776`), so
*"it compiles for the Edge runtime"* is a default, not a property. The repo's own `src/proxy.ts:5-11`
states it **correctly**; the spine dropped the qualifier. A rule defended by a refutable reason is a
rule that gets reverted. *(The rest of AD-5 is build-verified: Proxy is real in Next 16, exporting
`runtime` really throws, matcher semantics hold, and `.next/standalone/.../functions-config-manifest.json`
proves the gate ships as `"/_middleware": {"runtime": "nodejs"}`.)*

**H8 — Next's own docs advise against what AD-5 relies on, and the spine records no deviation.**
`proxy.md:217-219`: *"Always verify authentication and authorization inside each Server Function
rather than relying on Proxy alone"*; `getting-started/16-proxy.md:29`: it *"should not be used as a
full session management or authorization solution."* The spine's Deferred item on the nine unguarded
routes reads as **scheduling**; upstream reads it as a **hazard**. Also unstated: a Server Function
POST inherits its route's matcher outcome, so a future exclusion silently removes coverage from
Server Functions on that path.

**H9 — AD-13's `canvas.toJSON()` is not the mechanism that ships.** Save is `serializeCanvas`
(`ArtifactEditor.tsx:257`) over `canvas.getObjects()` (`:271`), projecting into the registry's
`CanvasElement[]` shape. `toJSON` appears nowhere in `src/`. This matters concretely: Fabric's
`toJSON()` format is **not** `ArtifactLayout.elements`, so a new editor surface built from AD-13's
literal text — AD-22's SongSet config being the immediate candidate — would fail AD-15's validator.
Repeated in Diagram 2's edge label.

### Unclosed forks two current stories will hit

**H10 — AD-21's counter has no defined value on a database that never carried it, and no fixed order
against AD-17's seeder.** AD-21 goes out of its way to say the seeding marker and the counter are
*distinct and neither substitutes for the other* — which **guarantees** a first-boot database carries
the marker and no version key. Two compliant readings: absent ⇒ version 0 ⇒ run every transition, or
seed-current-shape-and-set-marker. Today `seedArtifactRegistry(db)` is called **last**
(`db/index.ts:263`, after the backfill at `:253`). The mirror case is worse and nothing forbids it:
move the seed **before** the migrations and the seven→three collapse runs over freshly-seeded
`songset-*` rows, whose mapping table is keyed on the seven **old** types — so either boot throws
(the hub does not start, 08:40 on a Sabbath) or the default branch rewrites all four slots to
`general`, **destroying AD-19's uniqueness by migration and dropping three songs from the deck**.
*Fix:* stamp the version in the bootstrap's own transaction; fix the `getDb` order (DDL → migrations
→ bootstrap) and assert it in a test.

**H11 — AD-22's "it's a schema call" offers two options, and the shipped validator forecloses one of
them.** *(This is the morning round's M1, materially sharpened.)* AD-22 requires administrator values
stay distinguishable from developer layout but hands the *how* back out. The *in-layout* option — "a
marked field inside it" — **cannot be built**: `validate.ts` runs `rejectUnknownKeys` against
`ALLOWED_LAYOUT_KEYS` (`aspectRatio`, `backgroundColor`, `backgroundImage`, `elements`), so any marker
field is rejected on **every** write path, and the spine's own Deferred says adding vocabulary *"is a
registry-contract change, not a seed edit."* So the only shape Story 20.7 can ship without a further
decision is to write the background straight into `layouts.*.backgroundImage` and the font into
element `style` — **unmarked, indistinguishable** — which is exactly the property AD-22 says must
hold. Then AD-22's own last sentence tells a later migration to replace those layouts: **every
background and font size the administrator chose reverts to the shipped default, on all four slots,
silently, before anyone opens the hub.** AD-11 keeps no second copy; Reset would discard them too.
*Fix:* promote the deferred call — administrator values persist **outside** the layout as an override
record keyed by row and field, re-applied at hydration; a bounded surface that writes into the layout
is refused by the validator.

**H12 — AD-19's closed six-key set cannot represent a third Divine Service hymn.** The shipped planner
renders an **unbounded** number: `dsMiddle = divineServiceHymns.slice(1, -1)` (`slide-plan.ts:399`)
→ `pushSongGroup(..., 'ds-middle-'+idx)` (`:464-466`). There are exactly four slots and no fifth.
A normal week with a congregational response either **silently drops** the third hymn — every
invariant reports healthy, and the congregation is asked to sing a hymn that is not on the screen —
**or** throws the whole plan build and the projector shows *Slides unavailable*, for a rundown that
works today. Which one happens is decided by whichever developer types first. Sharper edge in the same
pair: `song4Number` maps to `divineServiceHymns[1]` (`parsed-fields.ts:421`) while the planner's
closing song is `divineServiceHymns[length-1]` (`slide-plan.ts:394-397`) — **with three hymns those
are different songs**, and either reading is defensible from AD-19's text.

**H13 — Nobody owns who may press Sync Artifact.** AD-14's admin-only clause survived AD-16 untouched,
but its **Binds** names only `/admin/artifacts` and `/api/admin/artifacts/**`. Sync lives on a service
route, which `proxy.ts:88-95` gates for **any** signed-in account (`isAdminPath` is true only for
`/admin`, `/admin/*`, `/api/admin*`). So Sync may legally ship as an operator action while AD-14
legally assumes structure is admin-only. Symptom: an admin is mid-way through re-authoring the
Offering layout; an operator clicks Sync on Sabbath's service; AD-6 passes, AD-15 passes, and the
half-finished layout is frozen into the service presenting in fourteen hours — **AD-16's own
Prevents, verbatim.** The opposite choice fails the other way (AD-16's second Prevents: a service with
no way to be brought up to date).

**H14 — Presenter and projector build plans independently, and the sync message carries a bare index.**
The wire is `{ type: 'sync'; index: number; blank; transition }` (`present-channel.ts:19-38`).
Presenter and projector are two separate `force-dynamic` server renders, each calling
`buildSlidePlan` at its own moment; nothing ties the two arrays to one version of the structure.
**Live today without Epic 20 at all** — an admin saves a template, or another service's edit rewrites
the announcement master, changing the flyer count. From then on presenter `index: 34` renders the
projector's slide 34, now a different slide: **the operator's screen shows *Sermon* while the room
sees *Special Song*,** and it is invisible to them. AD-10 forbids inventing a private mismatch signal.
*Fix:* every message carries a plan-identity fingerprint; a receiver whose identity differs refuses to
follow and says so on the room-facing screen.

**H15 — An administrator-created row has no seed, so Save 404s and Reset has no referent.** The
shipped save path validates against the **seed**: `updateArtifactTemplate` →
`assertStableAgainstSeed` → `getSeedTemplateById`, which throws `RegistryNotFoundError` for any id the
seed lacks (`store.ts:122-201`, `seed.ts:162-169`) → **HTTP 404**. The administrator adds
`communion-call`, composes it for twenty minutes, presses Save → `404 Unknown template` on a row
plainly listed in front of them. Story 20.4's AC (*"a rejected Save keeps the operator's work and
names the property"*) is unmeetable — no property is named, because the failure is not about a
property. And Reset, rendered uniformly, throws the same 404 on a created row while silently
reverting a rename on a seeded one: **two rows in one list, two meanings for one button.**

**H16 — AD-21 claims one version key while a second one already ships, hard-validated.**
`types.ts:83` `schemaVersion: 1`; `validate.ts:449-450` throws unless it is exactly 1; `:505`
re-stamps every validated template. AD-18's collapse therefore hits a fork AD-21 does not close —
bump `schemaVersion`, bump the `settings` counter, or both. **That is AD-21's own stated Prevents,
one level down from where it looked.**

**H17 — AD-16's "creation is the only freeze event" is contradicted by its governing SPEC.**
`spec-artifact-registry-authoring/SPEC.md:88`: services existing when this ships *"continue to render
from their stored `parsed_data` plus the then-current **live registry** until an operator freezes/
clones or syncs one."* That is a second freeze path and a legitimate no-snapshot state in which the
plan reads the **live** registry — which AD-16's Rule and Diagram 2's `Plan -.-> Registry` edge both
forbid. **Every service in the existing database is in that state on day one**, and three compliant
implementations exist (fall back to live, lazily clone, throw).

### Coverage and corpus integrity

**H18 — FR-7's cross-surface transition contract is governed by nothing and is not deferred.**
`prd.md:305` fixes that PPTX and browser transitions *"are chosen once and never diverge"* — a
single-source invariant across two renderers, structurally identical to what AD-7 does for order.
`src/lib/transitions.ts` and `use-slide-transition.ts` implement it and are absent from the spine's
`src/lib/` enumeration. `docs/architecture.md:61`, a declared spine **source**, already contradicts it
by hardcoding *"a smooth crossfade."* **Silence is the only unacceptable option here, because the
corpus already contains one divergence.**

**H19 — AD-4 asserts production is running; the PRD says nothing is deployed, and two licences hinge
on it.** AD-4: *"Production **runs** as one Docker/standalone unit…"* `prd.md:540`: *"target, not yet
deployed — corrected 2026-07-29 by the owner… **nothing is running**… Read every 'production'
reference in the artifact set against this."* This is load-bearing: AD-18 grants Epic 20 a
total-replacement licence *"**until first deploy** no production rows exist"* and AD-21 freezes *"a
released version."* Read against AD-4's present tense, **the licence Epic 20's cheapest path depends
on has already expired.**

**H20 — The "every live citation repaired in the same change set" claim is false.** 20 retired-form
citations, 2 silently-retargeted bare citations, and 4 dangling paths to the deleted epic-16 spine.
The two that matter: `implementation-readiness-report-2026-07-29.md:56-57` still tabulates **two live
architecture spines** (and `epics.md` cites that report as current evidence for NFR-3/NFR-7); and
`sprint-change-proposal-2026-07-29.md:85` cites **bare** `AD-2…AD-5` in an epic-16 context, which now
resolve to four completely different decisions — the exact silent-retargeting the fold-in's own audit
identified, surviving in a live Correct Course record, and **invisible to a dangling-citation check
because it is bare.** The same claim appears in `AGENTS.md:100`.

**H21 — Four operational dimensions are silent, one of them newly load-bearing.**
- **Data durability & recovery — SILENT.** AD-4 fixes durable *paths* only. AD-17 removes the seed as
  a recovery channel and Reset is per-template, so **losing `DB_PATH` loses the whole authored ordered
  registry** — in AD-17's own words, *"authored data rather than shipped data."* The backup procedure
  exists solely as a manual step at `docs/deploy.md:79`. *(Morning round's M3, unfixed.)*
- **Testing strategy — SILENT**, while AD-5, AD-15 and line 306 all delegate their enforcement to it.
  The mechanism is non-obvious and fragile: `node --test --experimental-strip-types` with a custom
  loader over a **hand-maintained 34-path list** in `package.json scripts.test`; CI runs only
  `npm test` (no lint, no typecheck, no build). A test file not registered in that list never runs and
  nothing detects it. In sync today — latent, not live. The Stack table names ESLint but no runner.
- **Secrets management — SILENT except `WEBHOOK_SECRET`.** Unmentioned: `AUTH_SECRET` (the session
  HMAC key, fail-closed at ≥16 chars, `auth/session.ts:32-38`), `IMAGE_URL_ALLOWLIST`,
  `PPTX_CACHE_DIR`, `PPTX_RETENTION_DAYS`, `AUTH_BOOTSTRAP_*`. No rule that a new secret fails closed
  when unset — the generalization AD-5 already proved out.
- **Performance envelope — SILENT**, while AD-20 and AD-22 hand deck size to the administrator.
  Budgets live only in `tests/pptx-ceiling.test.mjs`.

**H22 — `README-deployment.md`, cited by AD-4 for operator details, does not exist anywhere in the
repo.** `docs/deploy.md` (also cited) does; `docs/deployment-guide.md` is the nearest match.

---

## The tail

Roughly 30 MEDIUM/LOW findings across the five files. The ones most worth a glance:

**Version currency** (`review-version-reality-check-…-validate-b.md`) — four Stack rows are behind
current stable and the pins mean none will resolve itself: TypeScript `^5` is **two majors** behind
(7.0.2 current); better-sqlite3 12 → 13, whose `engines` requires `node >=22`, so the row is in latent
conflict with the spine's own Node floor and resolves the same way (H6 first); fabric 6 → 7, a real
migration with known contact points (`ArtifactEditor.tsx:160, :293` carry explicit v6 workarounds);
ESLint `^9` resolved to `9.39.5`, which is the **maintenance** dist-tag. Next/React/eslint-config-next
are 2-4 patches behind and move as a set. `fast-xml-parser ^5.10.1` is **missing from the table** while
sitting on the path of `AGENTS.md`'s enforced privacy filter. `@types/node ^20` types an EOL runtime
the deployment does not run.

**Spine ↔ tree drift** (`review-brownfield-ratification-…-validate-b.md`) — the tree omits
`src/lib/artifacts/` (where AD-12's Fat Payload and AD-15's runtime contract actually live) and
`src/lib/services/` (the only home of AD-6's precondition), so the *Boundaries* convention's *"registry
logic lives in `src/lib/registry/*`"* is half true. Also missing: `public/` (AD-8's `/assets/...`
root), `docs/`, `src/components/admin/`, `data/asset-map.json` (the sole subject of a gate the spine
names). The `scripts/` comment names a "liveserver helper" that does not exist and omits the two
scripts the spine cites elsewhere.

**More unclosed forks** (`review-adversarial-two-units-…-validate-b.md`, P10–P14) — the ordered
sequence is an entity with no version, so two concurrent reorders both pass AD-6; one service's form
edit rewrites the global announcement master under *that* service's precondition; AD-19's cross-row
slot uniqueness has no named enforcement point; and one unrenderable-element condition has four
defensible failure behaviours, with the primary Sabbath surface the least informative *(morning round's
M5, confirmed)*.

**More corpus contradictions** (`review-cross-document-coverage-…-validate-b.md`, F-7 to F-13) —
`placeholder-catalog.md:8` admits catalog placeholders on **any** slide (AD-22 makes free canvas
General's alone) and contradicts **itself** at `:34`; `stories/3-1-…:36` inverts AD-1's direction
outright (*"Web-First… with PPTX Export Fallback"*); `spec-slide-artifact-model` CAP-8 still requires
a `TextPlaceholder` AD-19 abolished; the spine routes two affordance questions to `EXPERIENCE.md`
whose *Open Items* carries neither — *"a handoff no receiver acknowledges is how the four artifact
families drifted in the first place"*; AD-20 makes the unowned NFR-3 measurably weaker for three
specific slides and no document owns the consequence; and `binds:` cites an NFR by prose where the PRD
has `NFR-1`, precisely because prose NFRs could not be cited.

---

## What is genuinely strong — not re-litigated

- **`lint_spine.py`: 0 findings.**
- **AD-5 is ratified in full** against `src/proxy.ts` — matcher regex, every exclusion and its
  anchoring, the deliberate `/api/uploads/*` inclusion, fail-closed on a DB throw, `no-store` /
  `Vary: Cookie` on every gated response *including refusals*, no `runtime` export, no
  `middleware.ts`, and a test pinning both halves. Prose and code agree line for line. Two lenses
  called it the strongest thing in the document.
- **AD-7, AD-8, AD-9/AD-18's schema-vs-value division, AD-10, AD-14's authorization clause, AD-15**
  are all obeyed by shipped code.
- **Zero drift between the ten package Stack rows and `package.json`**, re-derived independently; no
  named dependency is hallucinated and all ten tarballs resolve from `registry.npmjs.org`. Tailwind,
  pptxgenjs and jszip are current to the day. `@base-ui/react@1.6.0` and the shadcn `base-nova` style
  are both real and current.
- **Two `file:line` citations land exactly** — `store.ts:226` and `ArtifactEditor.tsx:104`, in files
  that have changed since. That is rare.
- **All three supersession chains are bidirectionally linked and clause-scoped**, and AD-14's
  *"not to be confused with AD-4"* note is a good catch — one that a companion document then made
  anyway (C7).
- **Both mermaid diagrams parse**, and their dotted *"no registry or snapshot access"* /
  *"never reads the live registry"* edges carry AD-12 and AD-16 better than prose would.
- **The adversary constructed eight attacks and then defeated them** with shipped code — AD-12's
  single registry read site, the always-regenerate PPTX path, `parseRow` re-validation. Recorded in
  its file as signal about where the spine holds.
- **Observability is the model deferral**: named, with its current floor (`console.error`) and a
  revisit trigger. The three other silent dimensions in H21 should look like that entry.

---

## Lens disagreements — resolved by the parent

1. **`skipTitle`.** The brownfield lens reported it still ships (5 sites); the adversarial lens filed
   it under *"attacks that failed"* as cleanly removed. **Parent-verified by direct grep: it ships at
   `slide-plan.ts:140, 148, 438, 460, 550`.** The brownfield lens is right; H3 stands.
2. **AD-22's deferred schema call.** The rubric walker judged the Deferred section clean, calling this
   item *"correctly shaped — the requirement is fixed, only the encoding defers."* The adversary showed
   the encoding **cannot** be freely chosen because `rejectUnknownKeys` forecloses one option. The
   adversary is right; H11 stands, and this is the clearest case in the run for why the gate runs both
   lenses.
3. **AD-6's shipped shape.** The version lens confirmed AD-6's registry-side shape
   (`expectedUpdatedAt` / `RegistryStaleError`) as accurate — which it is. Two other lenses found the
   *service*-side webhook gap. Both true; C1 is about the absolute quantifier, not the mechanism.

---

## Ownership split — what a follow-up Update can and cannot touch

| | Findings |
| --- | --- |
| **Spine-owned** (a `bmad-architecture` Update closes these) | C1, C2, C3, C4, C5, H1–H5, H6, H7, H8, H9, H10, H11, H12, H13, H14, H15, H16, H17, H18, H19, H20 *(partly)*, H21, H22 |
| **Companion-owned** (spine can only report) | C6 (`epics.md`, `sprint-status.yaml`), C7 (`EXPERIENCE.md` → `bmad-ux`), C8 (`authoring-boundaries.md` → `bmad-spec`), C9 (`spec-slide-artifact-model` → `bmad-spec`), F-7, F-9, F-10, F-11 |
| **Code-owned** (needs a story, not a doc edit) | the webhook precondition behind C1, the `registry-snapshot.ts` gap-fill behind C2, `package.json engines` behind H6 |

Three of the four CRITICAL companion findings are **already tracked and open** —
`epics.md:374` (C7), `sprint-status.yaml:310` Gap 4 (C8). They are not new discoveries; they are
overdue.

---

## Full reviews

| Lens | File |
| --- | --- |
| Rubric walker (good-spine checklist + dimension walk) | `review-rubric-walker-2026-07-30-validate-b.md` |
| Version / reality check *(configured)* | `review-version-reality-check-2026-07-30-validate-b.md` |
| Adversarial two-units *(configured)* | `review-adversarial-two-units-2026-07-30-validate-b.md` |
| Brownfield ratification *(ad-hoc)* | `review-brownfield-ratification-2026-07-30-validate-b.md` |
| Cross-document coverage *(ad-hoc)* | `review-cross-document-coverage-2026-07-30-validate-b.md` |
