# Reviewer Gate — Rubric Walker lens (Validate intent)

- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
- **Date:** 2026-07-30
- **Lens:** rubric walker — walks the good-spine checklist point by point, re-derived from the spine + repo only.
- **Independence:** no prior review under `reviews/` was read; no `.memlog.md` in either architecture run folder was read.
- **Verdict:** **CHANGES REQUESTED.** The spine is unusually strong on shared-data ownership and supersession hygiene, and two of its `[ADOPTED]` rules are contradicted by the code they claim to ratify. Both are load-bearing.

Counts: **2 CRITICAL · 4 HIGH · 5 MEDIUM · 2 LOW**

---

## CRITICAL

### C-1 — AD-6's "no write path may bypass the precondition" is false in shipped code, and the exact hazard it names is still open

**Spine, line 88 (Rule):**
> "every service mutation carries the client's `updated_at` as a precondition; a stale value is rejected with HTTP 409 and the client re-reads before retrying. **No write path may bypass the precondition.**"

**Spine, line 86 (Binds):** "service mutation APIs, hub edit UI, **agent/webhook corrections**, registry template writes, Sync Artifact"
**Spine, line 87 (Prevents):** "an operator's edit silently erased by a late correction (last-write-wins)"
**Spine, line 183 (Conventions → State):** "Concurrent overwrite is arbitrated by AD-6's `updated_at` precondition, never last-write-wins."
**Spine, line 291 (Deferred → Shipped):** "Telegram corrections + concurrency (FR-12/13b)"

The operator path honours this rigorously — `src/lib/services/update-service.ts:77-78` returns `{ ok: false, kind: 'conflict' }` on mismatch, `src/app/api/services/[id]/route.ts:67-69` maps it to 409, and `tests/services-http.test.mjs:321,353` pin both the missing-token 400 and the stale 409.

The webhook path does not carry a precondition at all. `handleCorrection` reads the row and then writes blind:

`src/app/api/webhook/route.ts:122-127`
```
  db.prepare(
    `UPDATE services
     SET date = ?, raw_payload = ?, parsed_data = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(newDate, rawPayload, parsedJson, existing.id);
```

The ingest path is the same shape (`src/app/api/webhook/route.ts:227-232`). No `updated_at` / `expectedUpdatedAt` token is read anywhere in the file (`src/app/api/webhook/route.ts:1-285`), and `tests/webhook-auth.test.mjs` asserts nothing about staleness. So a Telegram correction landing after an operator's form edit silently erases it — verbatim AD-6's *Prevents*.

The PRD agrees with the code, not the spine. `prd.md:113`: a re-send "overwrites the current payload, including any prior web-form edits", and `prd.md:268-273` (FR-13b) is precisely the *web-vs-Telegram* guard. The spine's Deferred list marking FR-12/13b **shipped** therefore also mis-states delivery.

Compounding, `_bmad-output/implementation-artifacts/deferred-work.md:116` records that even where the precondition *is* enforced, `updated_at` is second-granularity, so two edits inside one second both pass. Neither weakness appears in the spine.

**Why CRITICAL:** an `[ADOPTED]` invariant that reads as already-true when it is not. A builder implementing Sync Artifact (AD-16) will assume the pattern is uniform and will not notice the one path that skips it — and the unguarded path is the *agent* path, i.e. the one that fires unattended.

**Fix:** either add the precondition to `/api/webhook` (accept an `updated_at` token on `action: 'correct'`, 409 on mismatch) and keep the rule, or amend AD-6 to scope it — "every *cookie-authenticated* service mutation" — and move the webhook gap into Deferred with the second-granularity note beside it. Do not leave the rule claiming coverage it lacks.

---

### C-2 — AD-17's Rule is narrower than its Prevents: the *read* path still resurrects a deleted registry row from the shipped seed on every plan build

**Spine, line 146 (Prevents):**
> "an administrator's delete, rename or reorder being silently undone by an unrelated restart. A deleted row leaves no evidence behind, so a seeder that inserts \"missing\" IDs cannot tell *deleted on purpose* from *never existed here* — it resurrects the row on every boot, forever."

**Spine, line 147 (Rule):** "after it has run, **boot** never inserts, re-seeds, relabels or reorders a registry row… **AD-11's two-layer seed is therefore read only at first boot**"

The Rule closes the *boot* path only. The *plan-build* path is untouched and does exactly what the Prevents forbids:

`src/lib/artifacts/registry-snapshot.ts:85-90`
```
  for (const seed of loadSeedTemplates()) {
    if (!snapshot.has(seed.id)) {
      snapshot.set(seed.id, { ...seed, updatedAt: SEED_FALLBACK_UPDATED_AT });
    }
    rejected.delete(seed.id);
  }
```

with the doc comment at `src/lib/artifacts/registry-snapshot.ts:66-70` stating the intent outright: "valid persisted rows win, **shipped seed fills the gaps**". `loadRegistrySnapshot` runs per plan build (`src/lib/artifacts/registry-snapshot.ts:1-6`). Under AD-17 + CAP-2, deleting a registry row is a normal administrator action — and the very next Presenter/PPTX build re-materialises that slide from the seed. Not into the table, into the **deck**. That is a worse instance of the resurrection AD-17 exists to forbid, because it leaves no row to inspect.

Two further consequences:

1. **"read only at first boot" is factually false today.** `loadSeedTemplates()` is read on every plan build, and also as a per-row corruption fallback (`src/lib/artifacts/registry-snapshot.ts:56-63`).
2. **The spine's own blast-radius enumeration misses it.** Line 306 carefully lists what AD-17 orphans — "the automatic branch of `reseedArtifactTemplateIfUntouched`, most of `npm run registry:doctor`, and the assertion at `tests/registry-reseed.test.mjs`" (real: `tests/registry-reseed.test.mjs:337`, `'a missing row is inserted with its seed hash recorded'`) — and does not name `registry-snapshot.ts`. Diagram 2 (line 232) shows the seed reaching only `Registry`, never `Plan`, so the diagram agrees with the AD text and both disagree with the code.

**Why CRITICAL:** rework now. Story 20.1/20.3 will retire the boot-side reseed per this spine, ship, and the deleted slide will still appear on Sabbath.

**Fix:** extend AD-17's Rule from "boot" to "no path" — the seed is read only by first-boot bootstrap and by explicit per-template Reset; a template id absent from the registry is absent from the deck, and `loadRegistrySnapshot`'s gap-fill is removed (keep the corrupt-row fallback, which is a different concern). Add `src/lib/artifacts/registry-snapshot.ts:85-90` to the line-306 retirement list with the same "invert, don't delete" note the reseed test carries.

---

## HIGH

### H-1 — Testing strategy is a wholly silent dimension, and three ADs delegate their enforcement to it

AD-5 (line 83): "a new exclusion ships together with its assertion in `tests/proxy-matcher.test.mjs` in the same change set". AD-15 (line 135) and AD-19 (line 159) require validation "on **every** write path". Line 306 requires a test be "**inverted, not deleted**". Every one of those is enforced by a test suite the spine never describes.

The real mechanism is non-obvious and fragile: `node --test --experimental-strip-types` with a custom loader (`tests/register-ts-resolve.mjs`) over a **hand-maintained explicit file list** of 34 paths in `package.json` `scripts.test`; CI runs only `npm test` (`.github/workflows/test.yml:23` — no lint, no typecheck, no build). A test file added without being registered in that list never runs, in CI or locally, and nothing detects it. Verified in sync today (34 on disk, 34 listed), so the hazard is latent rather than live.

The Stack table (lines 188-202) lists ESLint but no test runner, so two epics have no anchor and could reasonably reach for vitest/jest.

**Fix:** add a `Testing` row to Consistency Conventions — `node:test` + `--experimental-strip-types` via `tests/register-ts-resolve.mjs`, no second runner without a recorded decision, and a new suite is registered in `package.json` `scripts.test` in the same change set — and add the runner to the Stack table.

### H-2 — AD-21 claims one version key for persisted data while a second one already ships and is hard-validated

**Spine, line 169 (Prevents):** "two builders keying the same change incompatibly — one adding a per-change boolean, another bumping a counter"
**Spine, line 170 (Rule):** "All persisted data shares **one monotonic version number** in `settings` — one counter for the whole database, never one per table or per domain"

AD-21 supersedes the per-change boolean it names (`artifact_seed_hash_backfilled`, real at `src/lib/db/index.ts:13`), but says nothing about the version key that is *inside every persisted registry row*:

`src/lib/registry/types.ts:83` — `schemaVersion: 1;`
`src/lib/registry/validate.ts:449-450` — `if (obj.schemaVersion !== 1) throw new RegistryValidationError('schemaVersion must be 1')`
`src/lib/registry/validate.ts:505` — every validated template is re-stamped `schemaVersion: 1`.

So AD-18's Epic 20 collapse (line 153) hits a fork the spine does not close: bump `schemaVersion` to 2 in the payload, bump the `settings` counter, or both. That is exactly AD-21's stated *Prevents*, one level down from where it looked.

**Fix:** one sentence in AD-21 subordinating the payload marker — e.g. `schemaVersion` is a payload-shape discriminator the validator pins and a transition may raise, but it is never the answer to "which version is production on"; the `settings` counter is — or state that it is folded into the counter and frozen at 1.

### H-3 — AD-16's "creation is the only freeze event" is contradicted by the governing SPEC's own assumption for pre-existing services, leaving an unclosed fork

**Spine, line 141:** "creation is the only freeze event. A service's plan, Presenter, slideshow and PPTX read that snapshot"

`_bmad-output/specs/spec-artifact-registry-authoring/SPEC.md:88` (Assumptions):
> "Worship services that already exist when this model ships (no clone yet) continue to render from their stored `parsed_data` plus the then-current **live registry** until an operator freezes/clones or syncs one for them."

That is a second freeze path and a legitimate no-snapshot state in which the plan reads the **live** registry — which AD-16's Rule and the line-242 diagram edge (`Plan -.->|"never reads the live registry (AD-16)"| Registry`) both forbid. Two compliant builders diverge: one implements a null-snapshot fallback to live (per the SPEC), one lazily clones on first read, one throws. Every service in the existing database is in that state on day one.

**Fix:** decide it in AD-16 in one clause — a service without a snapshot renders from the live registry until its first Sync, which is a clone-in-place (or: the Epic 20 data transition per AD-21 clones a snapshot for every existing service, and no-snapshot is not a runtime state).

### H-4 — Nothing binds an admitted Placeholder Catalog key to a weekly value that can fill it; the resolver is per-call-site today and CAP-4 needs it key-addressed

**Spine, line 159:** "the admitted key set is server-side vocabulary enforced on **every** write path… so *\"the UI cannot invent a catalog key\"* (CAP-4) is a property of the registry rather than of one client."

AD-19 fixes the write side and is silent on the fill side. The validator today admits any key the *template itself* declares — `src/lib/registry/validate.ts:344` rejects only an element key absent from that template's own `placeholders[]`; there is no central catalog. Values are built inline, one hardcoded literal per call site in the planner: `src/lib/slide-plan.ts:158,180,257,305,473,488,503,529,626,649` — `{ hymnNumber, songTitle }`, `{ date }`, `{ performer }`, `{ title, speaker }`, `{ imageUrl }`, `{ person }`. Those spellings do not match the catalog intent in `_bmad-output/specs/spec-artifact-registry-authoring/placeholder-catalog.md:17-28` (`serviceDate`, `sermon.speaker`, `sermonGraphic`, `closingPrayerPerson`, `familyPhoto`…).

CAP-4's success criterion — "the same catalog key can appear on multiple Generals with different styling" — requires a **key-addressed** resolver, not a call-site-addressed one. Two units diverge cleanly: the validator/catalog unit admits key `X`; the planner has no resolver for `X`; `hydrate.ts:129-136` fails closed for a required binding, on a Sabbath. AD-20 tightens the screw ("`buildSlidePlan` **applies** rules; it does not **hold** them", line 164) without saying that the key→weekly-field resolver is the one map the planner still legitimately owns.

**Fix:** add to AD-19's catalog clause that the catalog is one server-side module holding both the admitted key and its resolver from `ParsedRundown`/`SlidePlanMedia`, so a key cannot be admitted without a filler; and state in AD-20 that this resolver map is not the "second source of deck content" it prohibits.

---

## MEDIUM

### M-1 — AD-17 leaves the seed meaning two things: "read only at first boot" and "read on demand by Reset"

Line 147 says "AD-11's two-layer seed is therefore read only at first boot", then two sentences later "Restoring shipped content stays possible as an **explicit administrator action** — Reset-from-seed per template, per AD-11". Reset must read the seed file *after* first boot. Under the literal reading, a builder can load the seed once and discard it; Reset then restores whatever was on disk at install. That interacts with AD-11's surviving two-layer precedence clause (line 113) — whether a `data/local/default-registry.json` added after first boot is honoured by Reset is undecided, and AD-11 calls that layering "the mechanism that keeps congregation data out of a public repository".

**Fix:** rephrase to "the seed is read at first boot and by explicit per-template Reset, and by nothing else" and say whether Reset re-reads the two-layer path at reset time (it should).

### M-2 — AD-18's "until first deploy" licence is unfalsifiable from inside the repo

Line 153: "**Until first deploy** no production rows exist, so Epic 20's seven-`base_type`-to-three-kind collapse ships as a **total replacement**… at first deploy that licence ends". Nothing in the repo records whether that event has occurred; `docs/liveserver-handover-prompt.md`, `docs/deployment-guide.md` and a documented prod compose profile (`docker-compose.yml:3`) all suggest it may have. A rule whose activation depends on an undated, unowned, unrecorded event cannot be checked by the builder it binds.

**Fix:** tie the licence to something observable — "valid while the persisted data version (AD-21) is unset" — or record the first-deploy date in the spine when it happens and name who does.

### M-3 — The Capability map and file tree point the canvas editor at the wrong directory, blurring AD-13's boundary

Line 271 (CAP-3): "Lives in `src/components/artifacts/`, canvas editor". Line 284: "Canvas editor boundary | `src/components/artifacts/`". Line 250 (file tree): "`src/components/` # Header (shared nav/profile) + artifacts/ + ui/ shadcn".

Reality: the editor is `src/components/admin/ArtifactEditor.tsx` (the spine's own line 305 cites it correctly, as `ArtifactEditor.tsx:104` — verified exact). `src/components/artifacts/` contains only `ArtifactSlide.tsx`, the **renderer** — i.e. the AD-12 consumer. The map therefore files the Fabric-owning editor and the dumb renderer in one directory, which is the one boundary AD-13 exists to keep apart, and the file tree omits `admin/` entirely.

**Fix:** point CAP-3 and "Canvas editor boundary" at `src/components/admin/ArtifactEditor.tsx`, and add `admin/` to the line-250 tree, noting `artifacts/` is renderer-side.

### M-4 — `RegistrySnapshot` already means something else in this codebase

AD-16 introduces "**service-bound snapshot**" as a durable per-service clone. `src/lib/artifacts/registry-snapshot.ts:15` already exports `export type RegistrySnapshot = ReadonlyMap<string, StoredArtifactTemplate>` — a transient in-memory read of the **live** registry per plan build, with `loadRegistrySnapshot`, `SEED_FALLBACK_UPDATED_AT`, and `requireTemplate` around it. The spine never mentions it. A builder implementing AD-16 will find the name taken and either overload it (silently changing what every existing caller means) or shadow it. This is the same class of hazard AD-19 exists to prevent — two units agreeing to disagree about a handle — one level below where AD-19 looked.

**Fix:** one line in AD-16 naming the collision and fixing the terms, e.g. the durable per-service clone is `ServiceSnapshot`; the existing `RegistrySnapshot` is the plan-build read and keeps its name (or is renamed in the same change set).

### M-5 — Performance envelope is silent while AD-20 and AD-22 hand deck size to the administrator

Frontmatter (line 11) binds "NFR offline-Sabbath reliability", and AD-1 (line 63) makes the downloaded PPTX the hard offline guarantee. The actual budgets live only in a test: `tests/pptx-ceiling.test.mjs:1-21` — "NFR-2 budgets a full assemble/regenerate at ≤ 5 minutes including PPTX export… Measured 2026-07-29: 53 slides, ~4.2 s, ~30.0 MB. The 30 MB is dominated by full-bleed background images, not by slide count."

AD-20 lets an administrator add unbounded registry rows, and AD-22 gives every General a free canvas background plus two background images per SongSet row — precisely the cost driver that test names. No AD, and no Deferred item, states an envelope. An operator on church wifi is the consumer.

**Fix:** either add a short AD ("the generated deck stays inside the NFR-1/NFR-2 envelope; the ceiling test is the floor under it, and a registry change that trips it is a product decision, not a test edit") or add a Deferred item naming the envelope as unowned — but do not leave it silent while AD-20/AD-22 hand out the knob.

---

## LOW

### L-1 — Run-record narrative sits in the spine where the memlog owns it

Lines 40 and 56 carry process history: "`AGENTS.md`'s standing rule… was waived once, by the owner, for this merge only" and "**Where AD-11..AD-19 were decided:** in `../architecture-epic-16/.memlog.md`… A resume that reads only this memlog will not find them." The *table* at 42-53 is load-bearing (citations resolve through it); the surrounding paragraphs are provenance, and the spine's own standard is that rationale lives elsewhere. Trim to the table plus one pointer line.

### L-2 — Two cosmetic inconsistencies in the supersession blocks and the Stack table

AD-18 places its "Superseded in part by" banner *above* Binds (line 150) while AD-11 (114) and AD-14 (130) place theirs last — a scanning hazard in the one structure a reader must trust. And the Stack table's "Node.js | v20+" (line 190) is looser than the pinned CI runtime (`.github/workflows/test.yml:19`, Node 22); `package.json` declares no `engines`, so nothing reconciles them. Both are polish, not risk.

---

## Checklist walk

| # | Point | Result |
| --- | --- | --- |
| 1 | Fixes the real divergence points one level down, misses none | **Partial** — strong on ownership; misses catalog↔intake coupling (H-4), the no-snapshot state (H-3), the payload version key (H-2), testing (H-1) |
| 2 | Every Rule enforceable and matches its Prevents | **Fail** — AD-6 unenforced on the webhook (C-1); AD-17 narrower than its Prevents (C-2); AD-18's "until first deploy" unfalsifiable (M-2) |
| 3 | Nothing Deferred hides a fork | **Pass** — 15 Deferred items, each a genuine downstream call with the invariant retained above it. AD-22's "override record beside the layout or a marked field inside it is a schema call" (line 175) is correctly shaped: the requirement (values stay distinguishable) is fixed, only the encoding defers |
| 4 | Named tech verified-current (light check) | **Pass** — Stack rows match `package.json` exactly: `next` 16.2.10, `react`/`react-dom` 19.2.4, `better-sqlite3` ^12.11.1, `pptxgenjs` ^4.0.1, `fabric` ^6.6.1, `jszip` ^3.10.1, `@base-ui/react` ^1.6.0, `eslint-config-next` 16.2.10. Gap is an omission, not staleness: no test-runner row (H-1) |
| 5 | Ratifies rather than contradicts the brownfield | **Fail** — C-1, C-2, M-3, M-4. AD-5 by contrast is exemplary: `src/proxy.ts:101-123` matches the rule line for line, including the no-`runtime`-export and no-`middleware.ts` clauses; AD-9 matches the try/catch `ALTER TABLE` pattern at `src/lib/db/index.ts:188-239` |
| 6 | Covers the driving specs' capabilities | **Partial** — CAP-1..CAP-8 each carry a governing AD and the map's "hole shows here" framing works. But CAP-4 lacks the fill-side invariant (H-4), CAP-6 lacks the pre-existing-service case its own SPEC assumes (H-3) |
| 7 | No AD weakens another; supersession chains coherent | **Mostly pass** — all three chains are bidirectionally linked and clause-scoped (AD-11↔AD-17, AD-14↔AD-16, AD-18↔AD-21); AD-14's "not to be confused with AD-4" note is a good catch. One clause left meaning two things (M-1) |
| 8 | Every initiative-altitude dimension decided / deferred / silent | **See table below** — 4 silent, 1 partial |
| 9 | Structure in diagrams; valid mermaid agreeing with AD text | **Pass with one note** — both graphs parse, edge labels cite the governing AD, and the dotted "no registry or snapshot access" / "never reads the live registry" edges carry AD-12 and AD-16 better than prose would. Diagram 2's seed edge (line 232) agrees with AD-17's text but neither matches the code (C-2) |
| 10 | Right-sized, no placeholder residue | **Pass** — no template comments, no `TODO`, no empty section. AD-19's Rule is one ~400-word paragraph and is the density ceiling; L-1 is the only trimmable prose |

### Point 8 — dimension coverage

| Dimension | Status | Where / gap |
| --- | --- | --- |
| Paradigm, boundary & dependency rules | **Decided** | Design Paradigm (33-36); AD-2, AD-3; Conventions → Boundaries (184) |
| Authentication / authorization | **Decided** | AD-5 (83), AD-14 (129) — the strongest pair in the spine |
| State mutation & concurrency | **Decided but wrong** | AD-6 (88), Conventions → State (183) — see C-1 |
| Shared-data ownership & authoring authority | **Decided** | AD-11, AD-16, AD-17, AD-19, AD-20, AD-22 |
| Schema & data evolution | **Decided** | AD-9 (103), AD-18 (153), AD-21 (170) — schema/value split is clean; second version key unaddressed (H-2) |
| Sync / realtime topology | **Decided** | AD-10 (108) |
| Deployment & environments | **Decided (thin)** | AD-4 (78) fixes one prod target; prod/dev compose profiles exist (`docker-compose.yml:3,29`) but the spine names no environment model. AD-21's "developer databases are **reset**" is the only dev-vs-prod lifecycle rule |
| Infra / provider strategy | **Decided** | AD-4 — home-PC LiveServer, Docker/standalone, Cloudflare Tunnel; AD-5 ties the edge-cache headers to it |
| Operations (runbook, restart, health) | **Partial** | AD-4 delegates to `README-deployment.md` / `docs/deploy.md`; AD-17 makes restart-safety structural. No health/readiness or startup-failure semantics |
| Data durability & recovery | **SILENT** | AD-4 fixes durable *paths* only. No backup/restore invariant; the procedure exists solely as a manual step at `docs/deploy.md:79`. AD-17 removes the seed as a recovery channel and Reset is per-template, so losing `DB_PATH` loses the whole authored ordered registry — AD-17's own words, "the ordered registry is authored data rather than shipped data" |
| Observability | **DEFERRED, explicitly** | Line 299, with the current floor named (`console.error`) and a revisit trigger. Model deferral |
| Secrets management | **SILENT (except one)** | AD-5 fixes `WEBHOOK_SECRET` semantics (503 unset / 401 wrong). Unmentioned: `AUTH_SECRET` — the session HMAC key, fail-closed at ≥16 chars in `src/lib/auth/session.ts:32-38` — plus `IMAGE_URL_ALLOWLIST`, `PPTX_CACHE_DIR`, `PPTX_RETENTION_DAYS`, `AUTH_BOOTSTRAP_*`. No rule that a new secret fails closed when unset, which is the generalisation AD-5 already proved out |
| Testing strategy | **SILENT** | See H-1 — and three ADs delegate enforcement to it |
| Performance envelope | **SILENT** | See M-5 — budgets live only in `tests/pptx-ceiling.test.mjs` |
| Error / failure semantics | **Decided** | Conventions → Data & formats (182) JSON envelope; AD-5 and AD-8 both fail closed |
| Multi-tenancy | **DEFERRED** | Line 297 |
| Public-repo / privacy constraint | **Decided** | AD-11's two-layer seed (113); AD-4's host is sanitized to `presenter.example.church`; nothing in the spine licenses what `AGENTS.md` forbids. AD-20's liturgical-lyrics deferral (307) correctly links the open SDAH licence item |
| Visual identity, IA, affordances | **Owned elsewhere, correctly** | Routed to `DESIGN.md` / `EXPERIENCE.md` at lines 300, 303, 304 — matches the `AGENTS.md` authority map |
| i18n / localization | **SILENT (low impact)** | Single congregation; no divergence risk identified |
