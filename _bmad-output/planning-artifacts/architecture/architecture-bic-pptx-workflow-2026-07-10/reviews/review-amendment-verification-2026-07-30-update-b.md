# Reviewer Gate — Amendment verification (2026-07-30, run B → update B)

**Lens:** amendment verification. Unlike the other lenses in this gate, this one *requires* the prior
findings: its whole job is to decide whether the amendments closed them, and to hunt the new defects a
27-finding sweep introduces.

- **Target:** `ARCHITECTURE-SPINE.md` as amended 2026-07-30 (now AD-1..AD-**23**, all status-tagged).
- **Findings under verification:** `reviews/validation-2026-07-30-validate-b.md` — C1..C5 and H1..H22
  spine-owned; C6..C9 companion-owned; three code-owned.
- **Method:** every new `file:line`, symbol, directory and path citation was resolved by **opening the
  file**, not by grep inference. `lint_spine.py` re-run on the amended file.
- `lint_spine.py --workspace …/architecture-bic-pptx-workflow-2026-07-10` → **`ok: true`, 0 findings.**
  All 23 AD ids ascending and unique, every block carries Binds/Prevents/Rule, every Stack row pinned.

---

## Verdict

**The sweep is substantially successful and unusually well-grounded — and it introduced three defects
of exactly the kind this lens exists to catch.** 21 of 27 findings are genuinely closed, and closed
*with verified evidence*: I resolved 56 citations and **every single code citation the amendment added
lands on the right lines**, several of them exactly (`skipTitle` at five sites, `slide-plan.ts:399`
and `:464-466`, `store.ts:35-38` / `:74-92`, `parsed-fields.ts:418-421`, `validate.ts:449-450` /
`:505`, `types.ts:83`, `seed.ts:39`). The status-tag table (H1) is the single best thing in the
amendment: it is the mechanism that let five findings collapse at once, and it is applied to all 23
decisions.

The three failures share one shape: **the amendment wrote a new rule and did not carry it to the
artifact that already said the opposite.**

1. **AD-10 is tagged `[ADOPTED]` and its new plan-identity clause ships nowhere.** Under the spine's
   own tag table `[ADOPTED]` means "the Rule describes `src/` as it is." `PresentMessage` carries no
   identity field, `fingerprint`/`planIdentity` appear nowhere in `src/`, and **no Deferred entry names
   the gap** — so the one AD whose failure mode H14 called "invisible to them" is now the one AD whose
   gap is invisible in this document. This is the most serious finding in the review.
2. **Diagram 1's new `settings.slide_transition → Plan` edge is false about the code**, and it
   contradicts AD-23's own Rule one screen above it. `src/lib/slide-plan.ts` contains **zero**
   references to transitions.
3. **AD-16's new no-snapshot clause contradicts Diagram 2's unamended `Plan -.-> Registry` edge** and
   its own "creation is the only freeze event," and the spine papers over it with an assertion
   ("this is not an exception … but the migration path into it") rather than the `[ADOPTED, partial]`
   -style honesty it applied correctly to AD-6.

Contrast is instructive: **AD-6 handled the identical absolute-quantifier problem correctly** — kept
the rule, named the four violations inline, tagged itself `[ADOPTED, partial]`, and filed the closing
story. AD-16 and AD-10 faced the same problem and did not.

**Tally: 21 CLOSED · 3 PARTIAL · 0 NOT CLOSED · 3 CLOSED WRONGLY.**
**New defects: 2 CRITICAL · 4 HIGH · 6 MEDIUM · 2 LOW.**

---

## 1. Per-finding verdict

| # | Verdict | New spine text judged | Why |
| --- | --- | --- | --- |
| **C1** AD-6 absolute rule false | **PARTIAL** | AD-6 `[ADOPTED, partial]`; *"four shipped paths bypass it — the webhook correction and intake writes (`src/app/api/webhook/route.ts`), `DELETE /api/services/[id]`, and `PATCH`/`DELETE /api/announcements/[id]`, whose table has no `updated_at` at all"*; *"The rule is deliberately **not** narrowed … scoping the rule would abandon the hazard rather than record it."* | The construction is **excellent** and every claim in it verifies (`route.ts:123-127`, `:228-232`; `services/[id]/route.ts:9`; `announcements/[id]/route.ts:22,:58`; `announcement_items` DDL at `db/index.ts:111-118` has `created_at` only). **The gap:** C1's fix said *"Correct the 'Shipped' line either way."* Deferred line 333 still reads *"Telegram corrections + concurrency (**FR-12/13b**)"* as shipped, which AD-6's own new paragraph and `prd.md:113` (*"Phase 1 has no web-vs-Telegram concurrency guard — that is FR-13b, Phase 3"*) both contradict. See N-6. |
| **C2** seed resurrects at plan-build | **CLOSED** (one new HIGH inside it → N-3) | AD-17: *"**The filesystem seed is read at exactly two moments — the first-boot bootstrap, and an explicit per-template Reset — and at no other.** … **no read path may substitute a seed template for a row the database does not hold** … closing only the first is what let `registry-snapshot.ts` re-materialise a deleted slide … with `rejected.delete(seed.id)` suppressing even the log line."* Plus AD-11's new gap note and the Deferred addition of `registry-snapshot.ts:85-90` with *"inverted, not deleted."* | Fully closed, correctly, at both doors. `registry-snapshot.ts:85-90` verified **exact** — the loop, the `!snapshot.has(seed.id)` gap-fill, `rejected.delete(seed.id)` on `:89`. `loadRegistrySnapshot` runs per plan build (`slide-plan.ts:692`) ✓. AD-11's supersession now covers *"exclusively a startup seed"* too ✓. But the accompanying *"Keep the per-row corrupt-payload fallback at `:56-63`"* is mechanically impossible as written — N-3. |
| **C3** `base_type`/`label` persisted twice | **CLOSED** | AD-18: *"the row's `payload` JSON is authoritative for every template field, and any column duplicating a payload field … is a **derived index** maintained by the same write. A value migration therefore rewrites the payload and re-derives the columns **in the same statement**, and a migration that writes a column alone is refused by a test asserting column and payload agree for every row."* | Names the authoritative copy, binds the migration shape, and names the enforcement point. All three citations resolve **exactly**: `store.ts:74-92` = `listArtifactSummaries`, reading `row.base_type` and deriving `editable: !READ_ONLY_BASE_TYPES.has(...)`; `store.ts:35-38` = `rowToStored`, `JSON.parse(row.payload)`; `registry-snapshot.ts:41-64` = `parseRow`, payload only. |
| **C4** hymn number has two owners | **CLOSED** | AD-19 *Rule — one home*: *"a weekly value a slot binding names has exactly **one persisted home** … The four `songset-*` identities therefore **replace** the shipped ordinal field names `song1Number..song4Number` (`worship-form-fields.ts:6-9`, mapped positionally at `parsed-fields.ts:418-421`) … **deleted, not aliased** — and no code path may hold a hymn number `buildSlidePlan` does not read."* | Both citations **exact**. `worship-form-fields.ts:6-9` is precisely `song1Number`..`song4Number`; `parsed-fields.ts:418-421` is precisely the four `{ key, slot }` pairs. Sharpest part: AD-19's third Rule states *"reads the closing song as the last element while the shipped form maps `song4Number` to the second"* — I traced it: slot `3` → `applySongOverlay` (`parsed-fields.ts:270-288`) → `divineServiceHymns[3 % 2] = [1]`, against `slide-plan.ts:394-397`'s `divineServiceHymns[length-1]`. **True and precise.** |
| **C5** canvas editor directory wrong ×3 | **CLOSED** | AD-13 *Binds*: `src/components/admin/ArtifactEditor.tsx`; CAP-3 *Lives in*: same; Epic-16 map: *"`src/components/admin/ArtifactEditor.tsx` (not `components/artifacts/`, which is the AD-12 renderer)"*; tree: *"Header, SlideView + admin/ArtifactEditor.tsx (the AD-13 canvas editor) + artifacts/ArtifactSlide.tsx (the AD-12 renderer -- NOT the editor) + ui/ shadcn."* | All **four** places fixed (three named in the finding plus the tree). Directory listings confirm `src/components/admin/` holds only `ArtifactEditor.tsx` and `src/components/artifacts/` only `ArtifactSlide.tsx`. |
| **H1** no status vocabulary | **CLOSED — the amendment's best work** | *"**Every `AD` carries a status tag, and the tag is part of the decision.**"* + the three-row tag table + *"A `[TARGET]` rule is no less binding than an `[ADOPTED]` one — the difference is only whether you can verify it by reading the code today."* | All 23 ADs tagged, no untagged block, and the definitions are operative rather than decorative. This is the fix that closed H2–H5 as a side effect. Its own value is what makes N-1 (a wrong tag) critical rather than cosmetic. |
| **H2** AD-16 snapshot does not exist / name collision | **CLOSED** | `[TARGET]` + *"**Naming caution:** the shipped `RegistrySnapshot` type (`src/lib/artifacts/registry-snapshot.ts`) means *'the live-registry map assembled for one plan build'* — a different thing from this decision's per-service durable freeze."* + the note under Diagram 2. | Both halves addressed; the shipped type is exactly as described (`registry-snapshot.ts:15`, doc comment `:1-7`). Residual: Diagram 1 also carries unbuilt snapshot edges without a marker — N-8, filed separately, not against H2. |
| **H3** `skipTitle` still ships | **CLOSED** | AD-20: *"the `skipTitle` mechanism is **removed rather than migrated** … It ships today at five sites (`slide-plan.ts:140`, `:148`, `:438`, `:460`, `:550`) and Story 20.1 deletes them — a removal, not a compatibility shim."* | All five line numbers **exact** (`grep -n skipTitle` returns 140, 148, 438, 460, 550 and nothing else). The lens disagreement is resolved in the document itself. |
| **H4** Placeholder Catalog does not exist | **CLOSED** | AD-19: *"Nothing named `ALLOWED_PLACEHOLDER_KEYS` exists for this purpose: the shipped constant of that name is an unrelated object-key whitelist, and the resemblance makes a grep look like confirmation."* + Deferred: *"the **Placeholder Catalog** does not exist in any form."* | Verified: `validate.ts:24` `ALLOWED_PLACEHOLDER_KEYS`, consumed at `:297` by `rejectUnknownKeys` against a placeholder *object's* keys. The trap is now disarmed in prose. Bonus: the new *"one server-side module holding both the admitted key and its resolver"* clause is a real improvement, and its supporting claim — *"the planner supplies values as hardcoded literals at ten separate call sites"* — checks out (10 `values:` sites in `slide-plan.ts`), as does *"`hydrate.ts` fails closed on a required binding"* (`hydrate.ts:146-153` throws `ArtifactHydrationError('Missing required placeholder value')`). |
| **H5** "Ordered Registry" describes nothing in the DB | **CLOSED** | Deferred: *"`artifact_templates` has **no ordering column** (`store.ts` orders by `label COLLATE NOCASE`) and `/api/admin/artifacts` is **GET only** — no create, delete, or reorder verb exists."* | Verified: DDL at `db/index.ts:178-185` is `id, label, base_type, payload, updated_at, seed_hash` — no order column; `store.ts:81` is `ORDER BY label COLLATE NOCASE`; the collection route exports `GET` only (`[id]` has GET+PUT, `[id]/reset` POST — updates, not creation/reorder). Accurate. |
| **H6** Node row fails four ways | **PARTIAL** | Stack: *"**22.x LTS (`>=22.12`)** — Next 16.2.10 requires `>=20.9.0`; Node 20 reached **EOL 2026-04-30**. `Dockerfile` and CI already run 22"* + Deferred `engines` bullet naming *"the five docs that still say 'Node 20' (`README.md`, `docs/QUICKSTART.md`, `docs/deploy.md`, `docs/development-guide-monolith.md`, and `README.md`'s prerequisites)"*. | Row itself is now right and verified (`next/package.json` engines `{"node":">=20.9.0"}`; `Dockerfile:1` `node:22-bookworm-slim`; `test.yml:19` `'22'`). **The gap is the five-docs list** — see N-7: it names four distinct files (README.md twice), omits `_bmad-output/project-context.md:30`, and omits `package.json:40` `"@types/node": "^20"`, for which the Stack table still has no row at all. |
| **H7** AD-5's middleware reason false | **CLOSED** | *"(Node-runtime middleware has been stable since Next 15.5.0; the flat claim that `middleware.ts` *is* Edge is false, and a rule defended by a refutable reason is a rule that gets reverted. `src/proxy.ts:5-11` states it correctly.)"* plus the corrected main clause *"**unless it exports `runtime = 'nodejs'`**."* | Both verified: the version-history row exists (`…/03-file-conventions/proxy.md:775` — *"Middleware can now use the Node.js runtime (stable)"*), and `src/proxy.ts:5-12` states it correctly. The rule survives with a defensible reason. |
| **H8** upstream advises against Proxy-only auth | **CLOSED** | AD-5: *"**Recorded deviation:** Next's own docs advise never relying on Proxy alone for authorization (`proxy.md:217-219`) … a standing deviation from upstream guidance, not merely unfinished work"* + *"A Server Function POST inherits its route's matcher outcome, so a new matcher exclusion removes coverage from Server Functions on that path too."* + the reworded Deferred bullet. | Both grounded. `proxy.md:217` is the Server-Function-inherits-matcher note, `:219` is *"Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone."* Path is ambiguous (two `proxy.md` files) — N-11, MEDIUM. |
| **H9** `canvas.toJSON()` is not the mechanism | **CLOSED** | AD-13: *"React reads it **only on save**, through `serializeCanvas` over `canvas.getObjects()`, projecting into the registry's own element schema. Not `canvas.toJSON()`: Fabric's serialization format is **not** `ArtifactLayout.elements`…"* + Diagram 2's edge relabelled *"serializeCanvas on save (AD-13)."* | Verified: `ArtifactEditor.tsx:257` `function serializeCanvas(`, `:271` `canvas.getObjects().flatMap(...)`, and `toJSON(` appears **nowhere** in `src/`. Both the prose and the diagram edge were repaired. |
| **H10** counter value on a fresh DB + boot order | **CLOSED** | AD-21: *"**The counter's absence is not version 0.** A database created by the AD-17 bootstrap is stamped … **by the bootstrap itself, in the same transaction as the seeding marker**"* and *"**The order on the `getDb` path is fixed, and asserted by a test:** startup DDL (AD-9) → data migrations (AD-18) → first-boot bootstrap (AD-17)."* | Both forks closed, and the fixed order matches shipped reality (`db/index.ts`: DDL `:93-185` → backfill `:253` → `seedArtifactRegistry(db)` `:263`), so the invariant ratifies rather than fights the code. The Sabbath-failure reasoning is reproduced verbatim from the finding — appropriate here. |
| **H11** AD-22's foreclosed option | **CLOSED** | AD-22: *"**Administrator-configured values persist outside the layout**, as an **override record keyed by row and field**, re-applied over the developer layout at hydration … a bounded surface that writes *into* the layout is refused by the validator on every write path (AD-15). An earlier draft left the encoding as 'a schema call, not an invariant' … the shipped validator rejects unknown keys against a closed `ALLOWED_LAYOUT_KEYS`, so the in-layout marker cannot ship."* | The strongest closure after H1: it promotes the deferred call in exactly the direction the adversary showed was the only survivable one, and it removed the stale Deferred bullet so the two no longer disagree. `ALLOWED_LAYOUT_KEYS` verified at `validate.ts:31`, enforced at `:261`. |
| **H12** closed six-key set vs unbounded DS hymns | **CLOSED** | AD-19 *Rule — the closed set is a statement about the registry, not about the rundown*: *"a hymn in the service's entered data that no slot identity claims is **surfaced, never silently dropped and never fatal**. `buildSlidePlan` emits no slide for it and the service surface reports it as unclaimed weekly data. The mapping … is fixed in **one table in one module**."* | Picks one of the four defensible behaviours and names the surface — which is the whole point. Both citations exact (`slide-plan.ts:399` `dsMiddle` slice, `:464-466` the `forEach` → `pushSongGroup(..., 'ds-middle-'+idx)`), and the `song4Number`-vs-closing-song trap is stated correctly (traced above under C4). |
| **H13** who may press Sync | **CLOSED** | AD-16: *"**Sync is a structural write and is therefore admin-only** … even though it is reached on a service route that `src/proxy.ts` gates for any signed-in account; its route ships with the `tests/proxy-matcher.test.mjs` assertion AD-5 demands and an in-route `requireAdminSession`. An operator may see that their snapshot is stale and *request* a sync; they may not perform one."* | Decided, with the enforcement point and the test named. `proxy.ts:88-95`'s `isAdminPath` verified — `/admin`, `/admin/`, `/api/admin` only — so the stated reason is true. Minor over-reach noted in §3 (it mandates an affordance the Deferred still calls undecided). |
| **H14** presenter/projector plan identity | **CLOSED WRONGLY — CRITICAL** | AD-10 **`[ADOPTED]`**: *"**Every message carries a plan identity** — a fingerprint of the snapshot and resolved announcement set that produced the deck — and a receiver whose own identity differs **refuses to follow the index** and says so on the room-facing screen."* | The rule is right; **the tag is false and there is no Deferred entry.** `PresentMessage` (`present-channel.ts:19-38`) is `sync{index,blank,transition} | request-sync | blank | transition | scripture | clear-scripture` — no identity field. `fingerprint`/`planIdentity`/`plan_identity` appear **nowhere** in `src/`. Under the spine's own table, `[ADOPTED]` asserts the Rule describes `src/` as it is. **See N-1.** |
| **H15** authored row has no seed | **CLOSED** | AD-17: *"**An authored row has no seed, and is validated against itself.** … A row with no seed origin therefore **exposes no Reset** … the registry records, per row, whether it originated from the bootstrap or from an administrator … Without this, the shipped `assertStableAgainstSeed` path answers a brand-new General with `404 Unknown template` … and Story 20.4's *'a rejected Save names the property'* cannot be met."* | Closes both the Save 404 and the Reset-has-no-referent halves, and names why the origin flag has to be persisted. Shipped path verified (`store.ts:122-127` `assertStableAgainstSeed` → `getSeedTemplateById`). One new loose end: the origin flag is a schema addition not routed through AD-9 — N-10, MEDIUM. |
| **H16** second version key already ships | **CLOSED** | AD-21: *"**`schemaVersion` is not this counter and never answers for it.** The per-row payload discriminator (`types.ts:83`, pinned at `validate.ts:449-450`, re-stamped at `:505`) describes the *shape* of one template and a transition may raise it; *'which version is production on'* has exactly one answer and it is the `settings` counter."* | All three citations **exact**: `types.ts:83` `schemaVersion: 1;`, `validate.ts:449-450` the `!== 1` throw, `validate.ts:505` the re-stamp in the rebuilt object. The fork is closed in the right direction. |
| **H17** AD-16 vs its governing SPEC:88 | **CLOSED WRONGLY — HIGH** | AD-16: *"**A service that has no snapshot renders from the live registry until its first Sync, which is a clone-in-place** … This is not an exception to the rule above but the migration path into it: every service in the database on the day this ships is in that state, which `spec-artifact-registry-authoring/SPEC.md:88` assumed and an earlier draft of this rule forbade."* | The SPEC citation is **exact** and the substance is right. But the clause contradicts (a) Diagram 2's edge `Plan -.->|"never reads the live registry (AD-16)"| Registry`, which the amendment did not touch, and (b) its own earlier *"creation is the only freeze event."* Asserting *"this is not an exception"* does not make the quantifier true. **See N-4.** |
| **H18** FR-7 transition contract governed by nothing | **CLOSED WRONGLY — CRITICAL** | New **AD-23 `[ADOPTED]`**: *"transition style is **one app-wide value** in `settings` (`slide_transition`), and each style is described **exactly once**, in `src/lib/transitions.ts` … `pptx.ts` and the three browser surfaces all import that table, and no surface keeps a default of its own. There is no per-surface and no per-service override."* + Diagram 1 edge `Settings[(settings.slide_transition)] -->\|"AD-23: one table, both surfaces"\| Plan`. | Creating the AD was right, and most of it verifies (see the citation table). **Two things are wrong:** the diagram edge is false — `slide-plan.ts` has **zero** transition references, the value goes `settings.ts:60` → `pptx.ts:519` and → each page's server render, never through the plan (**N-2, CRITICAL**); and *"no per-surface override"* omits a shipped one, `PresenterOperator.tsx:341`'s `broadcast({ type: 'transition', … })`, documented in `present-channel.ts:28-32` as *"A live-only override of the deck's configured transition"* (**N-5, HIGH**). |
| **H19** AD-4 asserts production is running | **CLOSED** | AD-4: *"**As of 2026-07-30 no deployment exists** — the tooling ships and is configured, and nothing is running (`prd.md:540`, owner-corrected 2026-07-29). That date is load-bearing rather than trivia: AD-18's total-replacement licence and AD-21's released-version freeze both hinge on *until first deploy*, so they need an anchor stated here."* | `prd.md:540` verified verbatim, and the amendment did the more valuable thing the finding asked for — it explained *why* the date matters to two other ADs. LOW residue only (N-13). |
| **H20** "every live citation repaired" is false | **PARTIAL** | AD map: *"An earlier version of this paragraph claimed every live citation in the repo was repaired; that was too strong … the residue includes a case a dangling-reference check cannot catch: `sprint-change-proposal-2026-07-29.md:85` cites **bare** `AD-2..AD-5` in an epic-16 context."* + *"Treat any `AD-n` citation in a document dated before 2026-07-30 as requiring this table."* | The self-retraction is exemplary, and `sprint-change-proposal-2026-07-29.md:85` verified (*"already captured in `architecture-epic-16/ARCHITECTURE-SPINE.md` (AD-2…AD-5) and every citation resolves"*). **The gap:** the finding said *"The same claim appears in `AGENTS.md:100`"* — it still does, verbatim, in **three** synced copies (`AGENTS.md:100`, `.agents/AGENTS.md:100`, `.cursorrules:100`): *"…with an AD map published in the spine and every live citation repaired in the same change set."* The spine's own dated-run-records carve-out does not cover `AGENTS.md`, which is a live standing rule, and the spine does not report it. |
| **H21** four silent operational dimensions | **CLOSED** | Four Deferred bullets, each shaped like the model Observability entry (stakes → current floor → revisit trigger), plus a whole new *Testing* row in Consistency Conventions: *"over an **explicit file list** in `package.json` `scripts.test`. A new suite is registered in that list **in the same change set** — an unregistered test file never runs, locally or in CI, and nothing detects the omission."* | All four dimensions now named with a floor and a trigger. Verified: `docs/deploy.md:79` is a one-line manual `.backup` step; `AUTH_SECRET` fails closed below 16 chars in `auth/session.ts`; `tests/pptx-ceiling.test.mjs` exists; `scripts.test` is one invocation over **34** explicit paths, no glob. Making Testing an invariant rather than a deferral goes slightly beyond the finding — see §3, but it is the right call. |
| **H22** `README-deployment.md` does not exist | **CLOSED** | AD-4: *"Operator details: `docs/deployment-guide.md` / `docs/deploy.md`."* | Both files exist. `README-deployment.md` exists nowhere in the tree. One LOW residue: `prd.md:540` — the very line AD-4 now cites as its anchor — still points at `README-deployment.md`, and the spine does not report it (N-14). |

### Companion-owned findings (C6–C9) — scope check only, per instruction

The spine **does not silently claim any of these fixed** — the correct baseline. But it also does not
*report* them, and one deserves a line.

| # | Owner | Does the spine state the correct rule? | Does it report the live contradiction? |
| --- | --- | --- | --- |
| **C6** `epics.md:369` / `sprint-status.yaml:203-204` order the snapshot backfill AD-18 forbids | `bmad-correct-course` | **Yes** — AD-18: *"A migration operates on the **live registry** and does **not** rewrite service snapshots."* | **No.** Worth one line: `epics.md:382` inherits *"The breaking migration described above"* into Story 20.2, so the implementer is still pointed at the contradicted paragraph. Both citations still live (`:369` verbatim; `sprint-status.yaml:203-204`, not `:205`). |
| **C7** `EXPERIENCE.md:153` states the reversed rule and cites AD-4 | `bmad-ux` | **Yes** — AD-14's *"Not to be confused with AD-4 … which is a different decision and is not affected."* | **Partly.** The Deferred bullet *"Two affordance questions this spine hands to `EXPERIENCE.md` have not been received there"* is a narrower report. `:153` still reads *"There is no per-service override, by design (AD-14). **Scheduled to reverse:** … **which supersedes AD-4**"*; `:216` still states the global-immediate climax as fact; `:47` still says *"global slide templates."* All three verified unfixed. |
| **C8** `authoring-boundaries.md:18` offers admin-editable `baseType` | `bmad-spec` | **Yes** — AD-19: identity *"never administrator-editable."* | **No.** `:18` still reads *"Edit **Label** (and optionally **baseType**) in the slide inspector"*; `sprint-status.yaml:312` still `status: open`. |
| **C9** `spec-slide-artifact-model/SPEC.md` presents reversed clauses | `bmad-spec` | **Yes** — AD-16/AD-17 supersessions are explicit and bidirectional. | **No.** `:16` still says *"**Two reversals matter**"* and enumerates exactly two. Note the finding's own line numbers were slightly off: the reversed clauses are at `:31` (seven base types) and `:71`/`:82` (no create/delete/reorder); `:64`/`:65` are *additional* unlisted reversals (`:64` startup seed inserts missing IDs — reversed by AD-17; `:65` global across services — reversed by AD-16). So the companion gap is **larger** than C9 measured. |

Code-owned findings (webhook precondition, `registry-snapshot.ts` gap-fill, `package.json engines`) are
correctly reported in Deferred rather than claimed fixed.

---

## 2. New-defect hunt

### 2.1 Citation-resolution table

Every new or retained `file:line`, symbol, directory and path claim in the amended spine, resolved by
opening the file.

| New spine claim | Real location | Verdict |
| --- | --- | --- |
| AD-13 *Binds* `src/components/admin/ArtifactEditor.tsx` | exists, 36,471 B; `src/components/admin/` holds only this file | ✅ |
| AD-13 `serializeCanvas` over `canvas.getObjects()` | `ArtifactEditor.tsx:257` `function serializeCanvas(`; `:271` `canvas.getObjects().flatMap(` | ✅ exact |
| AD-13 *"Not `canvas.toJSON()`"* | `toJSON(` appears **nowhere** in `src/` | ✅ |
| CAP-3 *Lives in* `src/components/admin/ArtifactEditor.tsx` | same | ✅ |
| Epic-16 map *"not `components/artifacts/`, which is the AD-12 renderer"* | `src/components/artifacts/` = `ArtifactSlide.tsx` only | ✅ |
| AD-11 gap: `registry-snapshot.ts:85-90` reads the seed at plan-build time | `:85-90` = the `for (const seed of loadSeedTemplates())` gap-fill loop; `:89` `rejected.delete(seed.id)` | ✅ exact |
| Deferred *"Keep the per-row corrupt-payload fallback at `:56-63`"* | `:52-63` = `parseRow`'s catch, which only `return null`s. The **fallback** is performed by `:85-90` — the lines the same entry orders removed. `:34-36` comment says so explicitly | ❌ **misleading — N-3** |
| AD-18 `registry-snapshot.ts:41-64` reads the payload | `:41` `function parseRow(row: Row)` … `:64` `}`; `JSON.parse(row.payload)` at `:44` | ✅ exact |
| AD-18 `store.ts:74-92` reads the column and derives `editable` | `:74` `export function listArtifactSummaries(`; `:88` `baseType: row.base_type`; `:90` `editable: !READ_ONLY_BASE_TYPES.has(row.base_type …)` ; `:92` `}` | ✅ exact |
| AD-18 `store.ts:35-38` reads the payload | `:35` `function rowToStored(row: Row)`; `:36` `JSON.parse(row.payload)`; `:38` `}` | ✅ exact |
| Deferred `registry/store.ts:226` refuses read-only edits | `:226` is the guard `if (!options?.allowReadOnly && READ_ONLY_BASE_TYPES.has(existing.baseType)) {`; throw on `:227` | ✅ ±1 |
| Deferred `ArtifactEditor.tsx:104` | `:104` `if (READ_ONLY_BASE_TYPES.has(template.baseType)) return null;` | ✅ exact |
| Deferred *"`ArtifactEditor.tsx` carries two explicit v6 workarounds"* | `:160` (`Cache.getFontCache` / `fontStyle.toLowerCase`) and `:293` (`Text.initDimensions()` overwrites width/height) | ✅ |
| H5/Deferred *"`store.ts` orders by `label COLLATE NOCASE`"* | `store.ts:81` `ORDER BY label COLLATE NOCASE` | ✅ |
| Deferred *"`artifact_templates` has no ordering column"* | `db/index.ts:178-185`: `id, label, base_type, payload, updated_at, seed_hash` | ✅ |
| Deferred *"`/api/admin/artifacts` is GET only"* | collection route exports `GET` only; `[id]` GET+PUT; `[id]/reset` POST | ✅ |
| AD-20 `skipTitle` at `slide-plan.ts:140, :148, :438, :460, :550` | all five exact; `grep -n skipTitle` returns exactly those | ✅ exact |
| AD-19 `slide-plan.ts:399` unbounded DS middle songs | `:399` `divineServiceHymns.length > 2 ? divineServiceHymns.slice(1, -1) : [];` | ✅ exact |
| AD-19 `slide-plan.ts:464-466` | `:464-466` `dsMiddle.forEach((hymn, idx) => { pushSongGroup(nodes, hymn, \`ds-middle-${idx}\`); });` | ✅ exact |
| AD-19 *"reads the closing song as the last element while the shipped form maps `song4Number` to the second"* | `slide-plan.ts:394-397` `divineServiceHymns[length-1]`; `parsed-fields.ts:421` slot 3 → `applySongOverlay` `:287` `slot % 2` = `divineServiceHymns[1]` | ✅ **traced, true** |
| AD-19 `worship-form-fields.ts:6-9` | `:6-9` = `song1Number`..`song4Number` | ✅ exact |
| AD-19 `parsed-fields.ts:418-421` positional map | `:418-421` = the four `{ key: 'songNNumber', slot: N }` | ✅ exact |
| AD-19 *"ten separate call sites in `slide-plan.ts`"* hardcoded values | 10 `values:` sites: `:158, :180, :257, :305, :473, :488, :503, :529, :626, :649` | ✅ |
| AD-19 *"`hydrate.ts` fails closed on a required binding"* | `hydrate.ts:146-153` throws `ArtifactHydrationError('Missing required placeholder value')` | ✅ |
| AD-19/AD-22 `ALLOWED_PLACEHOLDER_KEYS` is an unrelated object-key whitelist | `validate.ts:24`, consumed `:297` | ✅ |
| AD-22 closed `ALLOWED_LAYOUT_KEYS` rejects unknown keys | `validate.ts:31`, enforced `:261` via `rejectUnknownKeys` | ✅ |
| AD-21 `types.ts:83` | `:83` `schemaVersion: 1;` | ✅ exact |
| AD-21 `validate.ts:449-450` | `:449` `if (obj.schemaVersion !== 1) {` / `:450` throw | ✅ exact |
| AD-21 `validate.ts:505` re-stamp | `:505` `schemaVersion: 1,` inside the rebuilt `template` | ✅ exact |
| AD-21/Deferred `artifact_seed_hash_backfilled` *"stores a count as a string, presence-checked"* | `db/index.ts:13` key; `:250` `.run(SEED_HASH_BACKFILL_KEY, String(recorded))` | ✅ |
| AD-21 fixed order DDL → migrations → bootstrap | shipped order matches: DDL `:93-185` → backfill `:253` → `seedArtifactRegistry(db)` `:263` | ✅ (ratifies) |
| AD-11 `WPW_USE_SHIPPED_REGISTRY=1` inverts precedence (`seed.ts:39`) | `:39` `if (process.env.WPW_USE_SHIPPED_REGISTRY === '1') return SEED_PATH;` | ✅ exact |
| Deferred `tests/registry-reseed.test.mjs` asserts a missing row *is* re-inserted | `:337` `test('a missing row is inserted with its seed hash recorded', …)` | ✅ |
| AD-5 `src/proxy.ts:5-11` states the rename reason correctly | `:5-12` — the correct *"unless it exports `runtime = 'nodejs'`"* form | ✅ ±1 |
| AD-5 / Deferred `proxy.md:217-219` | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:217` (Server Functions inherit the matcher) and `:219` (*"…rather than relying on Proxy alone"*) | ✅ content — ⚠️ **path ambiguous, N-11** |
| AD-5 *"stable since Next 15.5.0"* | same file `:775` version-history row | ✅ |
| AD-16 *"a service route that `src/proxy.ts` gates for any signed-in account"* | `proxy.ts:88-95` `isAdminPath` = `/admin`, `/admin/`, `/api/admin` only | ✅ exact |
| AD-6 gap: `src/app/api/webhook/route.ts` writes with no precondition | `:123-127` and `:228-232`, both `updated_at = CURRENT_TIMESTAMP`, no token read | ✅ |
| AD-6 gap: `DELETE /api/services/[id]`, `PATCH`/`DELETE /api/announcements/[id]` | `services/[id]/route.ts:9`; `announcements/[id]/route.ts:22`, `:58` | ✅ |
| AD-6 gap: announcements table *"has no `updated_at` at all"* | `db/index.ts:111-118` — `created_at` only | ✅ |
| AD-6 shipped shape `expectedUpdatedAt` / `RegistryStaleError` in `store.ts` | `store.ts:223-224` | ✅ |
| AD-23 *"described exactly once, in `src/lib/transitions.ts`, carrying both its PowerPoint element and its browser animation parameters"* | `transitions.ts:55-77` `SlideTransitionSpec` = `pptx: string \| null` + `browser: {durationMs, property, easing, incoming, outgoing}`; header `:1-21` states the same rule | ✅ |
| AD-23 *"one app-wide value in `settings` (`slide_transition`)"* | `settings.ts:13` `SLIDE_TRANSITION_KEY = 'slide_transition'`; `:60` `getSlideTransition()`; single-key `settings` table, no `service_id` | ✅ **no per-service override** |
| AD-23 *"`pptx.ts` and the three browser surfaces all import that table"* | `pptx.ts:15-20`; `PresenterOperator.tsx:43`; `ProjectorClient.tsx:12`; `SlideshowClient.tsx:7` (+ `TransitionSettings.tsx:17`, `settings.ts:8`, `present-channel.ts:1`, `use-slide-transition.ts:21`) | ✅ |
| AD-23 *"no surface keeps a default of its own"* | `pptx.ts:517-522` falls back to the imported `DEFAULT_SLIDE_TRANSITION`, not a literal | ✅ |
| AD-23 *"only styles that survive a plain `<p:transition>` child without the `p14` extension namespace"* | `transitions.ts:10-15` states exactly this | ✅ |
| AD-23 *"There is no per-surface … override"* | `PresenterOperator.tsx:341` `broadcast({ type: 'transition', transition: next })`; `present-channel.ts:28-32` documents it as a live override | ❌ **N-5** |
| Diagram 1 `Settings[(settings.slide_transition)] --> Plan` | `slide-plan.ts` has **no** transition reference. Flow is `settings.ts:60` → `pptx.ts:519`, and → `present/page.tsx:132`, `projector/page.tsx:92`, `slideshow/page.tsx:122` | ❌ **FALSE — N-2** |
| AD-10 *"Every message carries a plan identity"* `[ADOPTED]` | `present-channel.ts:19-38` has no identity field; `fingerprint`/`planIdentity` absent from all of `src/` | ❌ **FALSE — N-1** |
| Deferred `AUTH_SECRET` fails closed below 16 chars in `src/lib/auth/session.ts` | `getAuthSecret()` throws on empty and on `length < 16` | ✅ |
| AD-4 `docs/deployment-guide.md` / `docs/deploy.md` | both exist (7,359 B guide) | ✅ |
| Deferred `docs/deploy.md:79` manual backup floor | `:77` `## Backup`, `:79` the one-line `.backup` procedure | ✅ exact |
| AD-4 `prd.md:540` *"nothing is running"* | verbatim, incl. *"no live database, no live projector, and no Sabbath currently depending on this system"* | ✅ exact |
| Deferred `prd.md:550` binds NFR-3 on FR-20 | *"(Binding on FR-20 registry edits too — moving layout into data does not relax this.)"* | ✅ exact |
| AD-23 `prd.md:305` makes it a requirement | exact text — but it is a bullet under **FR-15**, referencing FR-7, not FR-7's own line | ✅ content, ⚠️ mild mislabel |
| Deferred `epics.md:52` NFR-3 owned by nobody | *"**None.** No epic and no UX artifact owns 'is this readable from the pews?'"* | ✅ exact |
| Deferred `epics.md:56` Arial not freely licensed | *"7-4 documents Arial, which is not freely licensed"* | ✅ exact |
| Deferred `deferred-work.md:116` second-granularity `updated_at` | verbatim | ✅ exact |
| AD-23 `docs/architecture.md:61` hardcodes a crossfade | *"updates its view with a smooth crossfade transition"* | ✅ exact |
| AD-map `sprint-change-proposal-2026-07-29.md:85` bare `AD-2..AD-5` | *"(AD-2…AD-5) and every citation resolves"* — bare, epic-16 context | ✅ exact |
| Deferred *"the five docs that still say 'Node 20'"* | 4 distinct files (README.md double-counted: `:36` and `:67`), + `docs/QUICKSTART.md:7`, `docs/deploy.md:9`, `docs/development-guide-monolith.md:8`. **Omits** `_bmad-output/project-context.md:30` and `package.json:40` `@types/node ^20` | ❌ **N-7** |
| Stack `Node 22.x (>=22.12)`; *"Next 16.2.10 requires >=20.9.0"*; *"`Dockerfile` and CI already run 22"* | `next/package.json` engines `{"node":">=20.9.0"}`; `Dockerfile:1` `node:22-bookworm-slim`; `test.yml:19` `'22'` | ✅ |
| Stack `fast-xml-parser ^5.10.1 (dev — the parser inside the enforced privacy filter, scripts/extract-pptx-assets.mjs)` | `package.json` devDep `^5.10.1`; `extract-pptx-assets.mjs:39` `import { XMLParser } from 'fast-xml-parser'`; `evidenceFor` at `:503` | ✅ |
| Deferred *"better-sqlite3 13 … requires `node >=22`"* | not verifiable offline; installed v12 declares `20.x \|\| 22.x \|\| …` | ⚠️ unverified |
| Testing convention *"explicit file list in `package.json` `scripts.test`"* | one invocation, **34** paths, no glob | ✅ |
| AD-16 `spec-artifact-registry-authoring/SPEC.md:88` | verbatim (*"continue to render from their stored `parsed_data` plus the then-current live registry until an operator freezes/clones or syncs one"*) | ✅ exact |
| Deferred *"the four `songset-*` slot identities appear nowhere in `src/`, `tests/`, `data/` or `scripts/`"* | `grep -rn songset` over all four → **empty** | ✅ |
| Deferred *"`ARTIFACT_BASE_TYPES` still carries all seven"* | `types.ts:1-9` = 7 values; `READ_ONLY_BASE_TYPES` `:13`, `EDITABLE_BASE_TYPES` `:19` | ✅ |
| Deferred `tests/pptx-ceiling.test.mjs`; tree `proxy-matcher, public-repo-guard, asset-map-evidence` | all four files exist | ✅ |
| `.claude/skills/picoclaw-webhook/` | exists, with `SKILL.md` | ✅ |
| Structural Seed tree — every named directory and file | see §2.2 | ✅ all resolve; omissions in N-9 |

**Score: 56 claims resolved; 3 false, 1 misleading, 1 unverifiable, 2 path/label imprecise, 49 correct
(many exact to the line).** For an amendment of this size that is a strong result — the failures are
concentrated in the diagrams and in one status tag, not in the code citations.

### 2.2 Structural Seed tree — full existence check

Every directory and file the rewritten tree names **exists**: `src/proxy.ts`; `src/app/`
(admin, announcements, api, login, services, `page.tsx`, and `src/app/admin/artifacts/page.tsx`);
`src/lib/` (`parser.ts`, `pptx.ts`, `slide-plan.ts`, `lyrics.ts`, `db/`, `images.ts`, `uploads.ts`,
`scripture.ts`, `transitions.ts`, `auth/`, `present-channel.ts` — all 11 named modules resolve);
`src/lib/registry/` (with `asset-safety.ts`); `src/lib/artifacts/` (`hydrate.ts`,
`registry-snapshot.ts`, `render-model.ts`, `preview-model.ts`, `runtime-contract.ts`);
**`src/lib/services/`** (new, correct — `update-service.ts` holds the AD-6 precondition at `:76-78`);
`src/components/` (Header, SlideView, `admin/ArtifactEditor.tsx`, `artifacts/ArtifactSlide.tsx`,
`ui/`); **`public/`** with `public/assets/`; `data/` (`hymns.json`, `default-registry.json`,
`asset-map.json`); `data/local/`; `data/uploads/`; `tests/`; **`docs/`** (deployment-guide, deploy,
cloudflare-tunnel, PRIVATE-DATA all present); **`.constitution/public-repository.md`**;
`Dockerfile` + `docker-compose.yml`; `scripts/` (import-hymnal, import-kjv, registry-doctor,
extract-pptx-assets, auth-*, smoke-* — all present, and the phantom *"liveserver helper"* is gone).

Six additions the finding asked for all landed. Remaining omissions are in N-9.

### 2.3 Status tags — all 23 audited

| Tag | ADs | Verdict |
| --- | --- | --- |
| `[ADOPTED]` | 1, 2, 3, 4, 5, 7, 8, 9, **10**, 12, 13, 14, 15, **23** | 12 correct. **AD-10 false (N-1).** AD-23 correct on the table/consumers/app-wide-value, wrong on the diagram edge (N-2) and incomplete on overrides (N-5). |
| `[ADOPTED, partial]` | 6, 11 | Both correct, and both are the model: gap named inline, gap repeated in *Deferred*, closing story flagged. |
| `[TARGET]` | 16, 17, 18, 19, 20, 21, 22 | All seven correct — none of the seven is built (`songset-*` absent everywhere, no ordering column, no snapshot table, no Placeholder Catalog, no `settings` counter, `skipTitle` still live, `ARTIFACT_BASE_TYPES` still seven). No `[TARGET]` sits on something already shipped. |

### 2.4 New defects

**N-1 — CRITICAL — AD-10 is `[ADOPTED]` and its plan-identity rule ships nowhere, with no Deferred entry.**
AD-10's Rule now reads *"**Every message carries a plan identity** — a fingerprint of the snapshot and
resolved announcement set that produced the deck — and a receiver whose own identity differs
**refuses to follow the index** and says so on the room-facing screen."* The shipped wire
(`src/lib/present-channel.ts:19-38`) is:
`sync{index, blank, transition} | request-sync | blank{blank} | transition{transition} | scripture{reference,text} | clear-scripture`.
No identity field. `grep -rn "fingerprint\|planIdentity\|plan_identity"` over `src/` returns nothing.
The spine's own tag table says `[ADOPTED]` means *"Decided **and** ratified against shipped code. The
Rule describes `src/` as it is."* So this is the exact defect H1's fix was built to prevent, committed
in the same amendment. Worse than a mislabel: because there is no `[ADOPTED, partial]` tag and **no
Deferred bullet**, H14's hazard — presenter showing *Sermon* while the room sees *Special Song*, live
today with no Epic 20 — is now recorded nowhere as open. It reads as solved.
*Fix:* `[ADOPTED, partial]`, move the identity clause into a named gap paragraph the way AD-6 does,
and add a Deferred bullet with the closing story.

**N-2 — CRITICAL — Diagram 1's new `settings.slide_transition → Plan` edge is false, and contradicts AD-23.**
`Settings[(settings.slide_transition)] -->|"AD-23: one table, both surfaces"| Plan`, with `Plan --> PPTX`
and `Plan --> WebShow` downstream, draws the transition value flowing through `buildSlidePlan`.
`src/lib/slide-plan.ts` contains **no** occurrence of "transition." The real flow is
`settings.ts:60 getSlideTransition()` → **`pptx.ts:519`** for the deck, and → each surface's own server
render (`present/page.tsx:132`, `present/projector/page.tsx:92`, `slideshow/page.tsx:122`) for the
browser. AD-23's own Rule says exactly that — *"`pptx.ts` and the three browser surfaces all import
that table"* — so the diagram contradicts the decision it annotates, one screen below it. A builder
reading the diagram would look for the transition on the Fat Payload and not find it, or would put it
there and break AD-12's shape.
*Fix:* `Settings -->|AD-23| PPTX` and `Settings -->|AD-23| WebShow`, or drop the node.

**N-3 — HIGH — AD-17/Deferred order the removal of `registry-snapshot.ts:85-90` while telling the builder to keep a fallback that *is* those lines.**
Deferred: *"the read-time gap-fill at `src/lib/artifacts/registry-snapshot.ts:85-90` … Keep the per-row
corrupt-payload fallback at `:56-63`: a row that fails validation is a different condition from a row
that does not exist."* The **conditions** are different; the **code** is not. `:41-64` (`parseRow`) only
`return null`s — a rejected row is never `set` into the map. The substitution for a corrupt row is
performed by `if (!snapshot.has(seed.id))` at `:86`, i.e. the same six lines the entry orders deleted.
The file says so itself at `:34-36`: *"Returning `null` here makes `loadRegistrySnapshot` fall back to
the shipped seed for that id."* Follow the instruction literally and the corrupt-payload fallback goes
with the gap-fill; `requireTemplate` (`:101-114`) then throws `ArtifactHydrationError('Unknown artifact
template')` and the plan build fails — the Sabbath failure mode the entry was trying to preserve
against.
*Fix:* state the discrimination the new code must make, not two line ranges: the seed may be
substituted **only** for an id that *is present in the database and failed validation*, never for an
absent id — which means `:85-90` is rewritten to iterate `rejected`, not `loadSeedTemplates()`.

**N-4 — HIGH — AD-16's no-snapshot clause contradicts an unamended diagram edge and its own "creation is the only freeze event."**
The new clause: *"**A service that has no snapshot renders from the live registry until its first Sync,
which is a clone-in-place** … This is not an exception to the rule above but the migration path into
it."* Diagram 2, untouched, still draws `Plan -.->|"never reads the live registry (AD-16)"| Registry`.
The validation report singled that edge out as carrying AD-16 *"better than prose would"* — which is
now the problem: it carries the pre-amendment rule. And within AD-16 itself, *"creation is the only
freeze event"* is now false for every service already in the database, which the clause concedes
(*"every service in the database on the day this ships is in that state"*) while denying it is an
exception. Compare AD-6, which met the identical problem two decisions earlier and handled it by
keeping the rule, naming the violations, and tagging itself `[ADOPTED, partial]`. AD-16 asserts its
way out instead.
*Fix:* amend the diagram edge to `"reads the live registry only until first Sync (AD-16)"`, and
reword to *"there are exactly two freeze events: service creation, and — for a service that predates
this decision — its first Sync."*

**N-5 — HIGH — AD-23's "There is no per-surface and no per-service override" omits a shipped override that produces AD-23's own *Prevents*.**
`PresenterOperator.tsx:341` broadcasts `{ type: 'transition', transition: next }`, and
`present-channel.ts:28-32` documents it: *"A live-only override of the deck's configured transition.
Nothing stores it: it exists for the length of a Presenter session and no longer."* The projector
adopts it. So during a service the browser can be running `cut` while the PPTX already downloaded from
the same `settings` row fades — *"a deck that fades in PowerPoint and cuts on the projector,"* AD-23's
*Prevents*, verbatim. The override is defensible (transient, presenter-authoritative, both browser
surfaces converge) but an `[ADOPTED]` rule with an absolute "no override" clause must name it.
*Fix:* *"one persisted app-wide value; the Presenter may hold a transient session-scoped override that
is broadcast to the projector and never persisted, so the two browser surfaces always agree with each
other even when they differ from an already-generated deck."*

**N-6 — HIGH — the Deferred "Shipped" line still claims FR-12/13b shipped, which AD-6's own new paragraph refutes.**
Line 333 lists *"Telegram corrections + concurrency (FR-12/13b)"* under **Shipped (no longer
deferred)**. AD-6's new gap paragraph says the webhook correction path carries no precondition at all,
and `prd.md:113` says *"Phase 1 has no web-vs-Telegram concurrency guard — that is FR-13b, Phase 3."*
C1's fix asked for this line explicitly (*"Correct the 'Shipped' line either way"*) and it is the one
part of C1 that was not done.
*Fix:* `FR-12 shipped; FR-13b shipped on the cookie-authenticated paths only — see the AD-6 bypass entry below.`

**N-7 — MEDIUM — the "five docs that still say Node 20" list is wrong three ways.**
It names `README.md` twice (once plainly, once as *"`README.md`'s prerequisites"* — both are the same
file, `:36` and `:67`), so it lists **four** distinct files while claiming five. It omits
`_bmad-output/project-context.md:30` (*"Node.js 20+, Next.js 16.2.10"*) — per the spine's own authority
map the runtime-rules document every agent host loads, arguably the most load-bearing of the set. And
it omits `package.json:40` `"@types/node": "^20"`, which types an EOL runtime the deployment does not
run; the Stack table has **no `@types/node` row at all**, so the mirroring claim cannot catch it.

**N-8 — MEDIUM — the "Epic 20 target" caption is ambiguous, and Diagram 1 mixes shipped with unbuilt.**
*"Registry detail — read through the plan… / **This graph is the Epic 20 target** (AD-16..AD-22): today
there is no per-service snapshot"* sits **between** the two diagrams and reads as belonging to either.
It is clearly meant for Diagram 2 (*"Registry detail"* is its caption). But Diagram 1 also contains
target-only elements with no marker: `Snap[(Service-bound snapshot)]`,
`Registry -->|"clone on create / Sync Artifact (AD-16)"| Snap`, `Snap --> Plan`, and the
`AD-10 BroadcastChannel + plan identity` edge label (see N-1). A reader who takes Diagram 1 as
present-tense system fact gets four false beliefs.

**N-9 — MEDIUM — Structural Seed omissions that the amendment itself made load-bearing.**
The `src/lib/` line now reads *"parser, pptx, slide-plan, lyrics, db, images, uploads, scripture,
transitions (AD-23), auth/, present-channel."* Missing, and now cited by decisions:
`src/lib/settings.ts` — the `settings.slide_transition` accessor AD-23 binds and the only reader of the
key; `src/lib/use-slide-transition.ts` — AD-23's browser half, named in the finding H18 as absent and
still absent; `src/lib/announcements.ts` — CAP-7's own *Lives in* column; and
`src/lib/worship-form-fields.ts` / `src/lib/parsed-fields.ts` — the two modules AD-19 orders *deleted
from*. `scripts/` omits `setup.mjs`. LOW: the tree implies the SQLite file lives under `data/`; the
working copy has `data.db*` at the repo root.

**N-10 — MEDIUM — AD-17 introduces a new persisted column without routing it through AD-9.**
*"the registry records, per row, whether it originated from the bootstrap or from an administrator,
because three verbs … all need that answer and none can infer it."* That is a schema addition. AD-9
owns schema evolution and AD-9's own new text insists *"the division is fixed."* Two comparable schema
calls (where the snapshot lives, where the slot identity is persisted) are correctly parked in
*Deferred* with an owning story; this third one is not, and no story owns it.

**N-11 — MEDIUM — `proxy.md:217-219` has no path, and two `proxy.md` files ship.**
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (the one that
matches) and `node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/proxy.md`.
Cited twice (AD-5 and *Deferred*). Same for the un-lined 15.5.0 claim (`…/03-file-conventions/proxy.md:775`).

**N-12 — MEDIUM — three ADs are now too long to function as invariants a builder can hold.**
AD-16 is a single ~470-word bullet stating **five** separable rules (clone on create; the snapshot is
what the plan reads; Sync is admin-only; announcement membership is not cloned; the no-snapshot
fallback) plus two justification passages and a naming caution — with no internal structure at all.
AD-22 is one ~450-word paragraph. AD-19 is four sub-rules totalling ~700 words. AD-19's split into
named sub-rules (*"Rule — the kind vocabulary…"*, *"Rule — one home…"*) is the pattern that works and
AD-16 should adopt it; as written, AD-16's binding sentences are buried among the reasons for them, and
the *"this is not an exception"* hand-wave (N-4) is exactly the kind of thing that survives in a
paragraph that long.

**N-13 — LOW — AD-4 opens by asserting what it retracts two sentences later, and the hostname disagrees with its source.**
*"Production **is deployed** as one Docker/standalone unit on the home-PC LiveServer
(`presenter.example.org` …)"* then *"**As of 2026-07-30 no deployment exists**."* Self-correcting, so no
reader is misled, but *"is deployed as"* would read better as *"is deployed as one … unit"* → *"deploys
as."* Separately, the spine says `presenter.example.org` where `prd.md:540` says
`presenter.example.church` — both synthetic, but they disagree.

**N-14 — LOW — the anchor citation's own file still points at the file H22 removed.**
AD-4 now correctly cites `docs/deployment-guide.md` / `docs/deploy.md`. But `prd.md:540` — the line
AD-4 cites as its authority for *"nothing is running"* — still says *"see `README-deployment.md`,"*
which exists nowhere. Companion-owned, and the spine does not report it.

---

## 3. Asked for and missed / went beyond

### Missed entirely

1. **C1's "Correct the 'Shipped' line"** — N-6. The only sub-item of a CRITICAL fix that was skipped.
2. **H20's `AGENTS.md:100`** — the identical false *"every live citation repaired in the same change
   set"* claim survives in three synced copies (`AGENTS.md`, `.agents/AGENTS.md`, `.cursorrules`). The
   spine's dated-run-records carve-out does not cover a live standing rule, and the spine does not
   report the residue. Fixing it is a `bmad-architecture`-adjacent doc edit, not a spine edit — but the
   spine should say so.
3. **`@types/node ^20`** — the version tail flagged it (*"types an EOL runtime the deployment does not
   run"*). Four other tail items landed (TypeScript, better-sqlite3, fabric, ESLint) and
   `fast-xml-parser` was added to the Stack; this one has no row and no Deferred mention.
4. **C6's live contradiction is not reported anywhere**, and `epics.md:382` still routes Story 20.2's
   implementer into it. One sentence in AD-18 would close the loop the report asked for.
5. **F-7** (`placeholder-catalog.md:8` admits catalog placeholders on *any* slide, which AD-22 makes
   General's alone, and which contradicts `:34` in its own file) — AD-19 cites
   `placeholder-catalog.md` only for key-spelling drift, not for this.

### Went beyond what was asked — flag, don't necessarily revert

6. **AD-23 is a whole new decision.** H18 said *"Silence is the only unacceptable option here,"* so
   creating it is within scope — but it landed as `[ADOPTED]` with a false diagram edge (N-2) and an
   unnamed override (N-5), i.e. asserting more than the evidence supports. Downgrade the claims, not
   the decision.
7. **AD-16 mandates an operator affordance the Deferred still calls undecided.** *"An operator may see
   that their snapshot is stale and *request* a sync"* is a UI requirement; the Deferred bullet two
   pages later says *"Whether a stale snapshot is surfaced to the operator, and how, is a UX concern
   owned by `EXPERIENCE.md`. AD-16 … does not decide the affordance."* Pick one.
8. **AD-22 adds a validator requirement nobody asked for:** *"a bounded surface that writes *into* the
   layout is refused by the validator on every write path."* H11 asked for the override record; this
   extra clause is a new enforcement obligation with no story named. Probably right, but it should be
   in *Deferred* alongside the other Epic-20 landing gaps.
9. **The new *Testing* convention row makes a deferral into an invariant.** H21 asked for it to stop
   being silent; the amendment made *"a new suite is registered in that list in the same change set"*
   binding. Good call — but it commits the project to the hand-maintained 34-path list rather than to a
   glob, and nothing in the spine says that list is the *chosen* mechanism rather than the current one.

---

## What is genuinely strong in this amendment — not re-litigated

- **The status-tag table (H1).** Operative, applied to all 23, and correctly defined
  (*"a `[TARGET]` rule is no less binding"*). It is the reason five findings closed at once — and the
  reason N-1 is a critical defect rather than a nit.
- **AD-6's construction.** Keeping an absolute rule *and* naming its four live violations, with the
  reason for not narrowing it stated (*"scoping the rule would abandon the hazard rather than record
  it"*). This is the template AD-10 and AD-16 should have followed.
- **Citation discipline on code.** Every code `file:line` the amendment added resolves, most exactly.
  `skipTitle` at five sites, `store.ts:35-38`/`:74-92`, `parsed-fields.ts:418-421`,
  `validate.ts:449-450`/`:505`, `types.ts:83`, `seed.ts:39`, `slide-plan.ts:399`/`:464-466`,
  `registry-snapshot.ts:85-90`/`:41-64` — all exact. For a 27-finding sweep this is rare.
- **AD-19's `song4Number` trap.** *"reads the closing song as the last element while the shipped form
  maps `song4Number` to the second"* required tracing `slot % 2` through `applySongOverlay` into
  `bucketHymnsBySection`. It is true, and it is the kind of claim that is usually wrong.
- **The AD-map self-retraction.** *"An earlier version of this paragraph claimed every live citation in
  the repo was repaired; that was too strong"* — and then it names the one case a tooling check cannot
  catch. A document that corrects its own overclaim is a document you can trust the rest of.
- **AD-11's `WPW_USE_SHIPPED_REGISTRY` note.** Not asked for by any finding, exactly right, and it
  protects the privacy mechanism `AGENTS.md` enforces.
- **`lint_spine.py`: still 0 findings** after +1 AD, +23 tags, and roughly a 40% growth in prose.
- **Six of six Structural Seed additions landed** (`src/lib/artifacts/`, `src/lib/services/`,
  `public/`, `docs/`, `src/components/admin/`, `data/asset-map.json`), and the phantom
  *"liveserver helper"* is gone.

---

## Recommended fix order

1. **N-1** — AD-10 to `[ADOPTED, partial]` + gap paragraph + Deferred bullet. *(one edit, closes a CRITICAL)*
2. **N-2** — repoint the `Settings` edge to PPTX and WebShow. *(one line)*
3. **N-4** — amend Diagram 2's `Plan -.-> Registry` edge label and AD-16's "only freeze event". *(two lines)*
4. **N-3** — restate the corrupt-row discrimination instead of two line ranges. *(one sentence)*
5. **N-5, N-6** — name the Presenter transition override; correct the FR-12/13b Shipped line. *(two lines)*
6. **N-7, N-9, N-10, N-11** — list corrections, tree additions, route the origin column through AD-9.
7. **N-12** — split AD-16 into named sub-rules the way AD-19 already is.
8. Items 1–5 of §3 *Missed* — one report line each in AD-18, the AD map, and *Deferred*.
