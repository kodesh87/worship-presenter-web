# Reviewer Gate — Brownfield Ratification lens (Validate B)

- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
- **Date:** 2026-07-30
- **Lens:** ad-hoc *brownfield ratification* — a spine over an existing codebase must ratify the conventions the code already shows, and every concrete thing it points at must actually be there.
- **Method:** re-derived entirely from the spine plus live `src/`, `tests/`, `data/`, `scripts/`, `public/`, `docs/` and the deployment files. No `reviews/` file and no `.memlog.md` in either architecture run folder was read.
- **Verdict:** **CHANGES REQUESTED.** The spine's *shipped* half (AD-1..AD-10, AD-14's auth clause, AD-15, AD-17-as-flagged) ratifies the code accurately and in unusual detail. The *Epic 20* half (AD-16..AD-22 and the whole Epic-20 CAP table) is written in the indicative present with no status vocabulary, so four unbuilt mechanisms read as accomplished fact. Two claims are simply wrong about the code.

**Counts:** CRITICAL 2 · HIGH 8 · MEDIUM 5 · LOW 6 (21 findings)

---

## Section A — Citation resolution

Every file path, directory, symbol, test name and `file:line` in the spine, resolved against the live tree.

| # | Spine claim | Real location | Verdict |
| --- | --- | --- | --- |
| A1 | `src/proxy.ts` is the one request gate (AD-5, tree, both diagrams) | `src/proxy.ts` — `export async function proxy` :60, `export const config` :100 | RESOLVES |
| A2 | `tests/proxy-matcher.test.mjs` pins the matcher | exists; pins all 7 exclusions (:92-102), the `/api/uploads/*` non-exclusion (:84-85), and 9 prefix-widening cases (:135-143) | RESOLVES |
| A3 | `expectedUpdatedAt` in `src/lib/registry/store.ts` | store.ts:207, 223, 254, 268, 286, 291 | RESOLVES |
| A4 | `RegistryStaleError` in the same file | class at store.ts:20; thrown :224, :272 | RESOLVES |
| A5 | `registry/store.ts:226` refuses every admin edit to a `song-set`/`announcement` row | store.ts:226 = `if (!options?.allowReadOnly && READ_ONLY_BASE_TYPES.has(existing.baseType))` | RESOLVES **exactly** |
| A6 | `src/lib/registry/validate.ts` holds the catalog vocabulary (CAP-4) | file exists; **no catalog vocabulary in it** — see BR-9 | PARTLY WRONG |
| A7 | `src/lib/registry/seed.ts` | exists — `resolveSeedPath` :38, `loadSeedTemplates` :55, `seedArtifactRegistry` :137 | RESOLVES |
| A8 | `READ_ONLY_BASE_TYPES` / `EDITABLE_BASE_TYPES` / `ARTIFACT_BASE_TYPES` in `src/lib/registry/types.ts` | types.ts:13 / :19 / :1 | RESOLVES |
| A9 | `buildSlidePlan` | `src/lib/slide-plan.ts:746` — `(serviceDate: string, parsedData: ParsedRundown, images: string[] \| SlidePlanMedia = []) => SlidePlanItem[]` | RESOLVES |
| A10 | `@/lib/present-channel` single `BroadcastChannel` module (AD-10) | `src/lib/present-channel.ts`; the repo's **only** `new BroadcastChannel` at :87; two importers only (`PresenterOperator.tsx`, `ProjectorClient.tsx`) | RESOLVES |
| A11 | `src/lib/announcements.ts` → plan (CAP-7) | file exists; `slide-plan.ts:9` imports `isAnnouncementImageUrl` from it; expansion built at slide-plan.ts:558-559 | RESOLVES (arrow is thinner than drawn — informational) |
| A12 | `getDb` in `src/lib/db/index.ts` | :77 | RESOLVES |
| A13 | boolean `artifact_seed_hash_backfilled` (`src/lib/db/index.ts`) | `SEED_HASH_BACKFILL_KEY` db/index.ts:13; stores `String(recorded)` — a **count**, presence-checked | RESOLVES / imprecise (BR-18) |
| A14 | Registry tables created on the startup DDL path, order (AD-9) | `settings` :151 → `artifact_templates` :178-185 → ALTERs :189-236 → backfill txn :238-252 → `upsertHymns` → `seedArtifactRegistry(db)` → `bootstrapAdminIfEmpty` | RESOLVES |
| A15 | `ArtifactEditor.tsx:104` refuses read-only base types | `src/components/admin/ArtifactEditor.tsx:104` = `if (READ_ONLY_BASE_TYPES.has(template.baseType)) return null;` | RESOLVES **exactly** (path qualified — see A16) |
| A16 | CAP-3 and Epic-16 "Canvas editor boundary" live in `src/components/artifacts/` | canvas editor is `src/components/admin/ArtifactEditor.tsx` (971 lines, sole `fabric` consumer). `src/components/artifacts/` contains **only `ArtifactSlide.tsx` — the web renderer** | **WRONG — inverted (BR-2)** |
| A17 | `reseedArtifactTemplateIfUntouched` | store.ts:391 | RESOLVES |
| A18 | `npm run registry:doctor` | package.json:14 → `scripts/registry-doctor.mjs` (exists, mirrors the reseed logic read-only at :117) | RESOLVES |
| A19 | `tests/registry-reseed.test.mjs` asserts a missing row **is** re-inserted | :337 `'a missing row is inserted with its seed hash recorded'`; :339 deletes the row, :343 `assert.deepEqual(report.inserted, [TEMPLATE_ID])` | RESOLVES **exactly** |
| A20 | `data/default-registry.json` | exists (28 templates) | RESOLVES |
| A21 | `data/local/` git-ignored seed, preferred when present | `data/local/default-registry.json` present on disk, untracked; preferred at seed.ts:40 | RESOLVES (with an unnamed env override — BR-16) |
| A22 | `tests/public-repo-guard.test.mjs` | exists; hashed fingerprints, tracked-files-only | RESOLVES |
| A23 | `tests/asset-map-evidence.test.mjs` | exists, 4 tests (:60, :71, :93, :115); pairs with `evidenceFor` at `scripts/extract-pptx-assets.mjs:503` | RESOLVES |
| A24 | `Dockerfile` / `docker-compose.yml`, prod+dev profiles, bind mounts for `DB_PATH` / PPTX cache / `UPLOADS_DIR` | both exist; profiles `prod` :3 / `dev` :29; `DB_PATH=/data/data.db` :11/:37; mounts :15-20, :41-49 | RESOLVES |
| A25 | `README-deployment.md` (AD-4, "Operator details") | **does not exist anywhere in the repo.** Nearest are `docs/deploy.md` and `docs/deployment-guide.md` | **BROKEN (BR-10)** |
| A26 | `docs/deploy.md` | exists; documents `DB_PATH` :17, `UPLOADS_DIR` :22, the `/api/uploads/<32-hex>` shape :32 | RESOLVES |
| A27 | `deferred-work.md` (cited twice, bare) | `_bmad-output/implementation-artifacts/deferred-work.md` | RESOLVES / path imprecise (BR-15) |
| A28 | `.constitution/public-repository.md` | exists | RESOLVES |
| A29 | `.claude/skills/picoclaw-webhook/` | exists (`SKILL.md`) | RESOLVES |
| A30 | `docs/architecture.md` (front-matter `sources`) | exists | RESOLVES |
| A31 | Stack table, 11 rows | all 11 match `package.json` exactly (`next 16.2.10`, `react/react-dom 19.2.4`, `better-sqlite3 ^12.11.1`, `pptxgenjs ^4.0.1`, `jszip ^3.10.1`, `fabric ^6.6.1`, `@base-ui/react ^1.6.0`, `eslint ^9` / `eslint-config-next 16.2.10`, `typescript ^5`, `tailwindcss ^4`, `@types/node ^20`) and `next.config.ts` has `output: "standalone"` | RESOLVES — **no drift** |
| A32 | `presenter.example.church` (AD-4) | `docker-compose.yml` defaults use `presenter.example.org` | MISMATCH, cosmetic (BR-19) |
| A33 | "Registry logic lives in `src/lib/registry/*`" (Boundaries convention) | also `src/lib/artifacts/*` — `hydrate.ts`, `render-model.ts`, `runtime-contract.ts`, `registry-snapshot.ts`, `preview-model.ts` | INCOMPLETE (BR-11) |
| A34 | `canvas.toJSON()` on save (AD-13 + diagram edge label) | **`toJSON` appears nowhere** in `ArtifactEditor.tsx` or `src/lib/registry/*`. Save uses `serializeCanvas` (:257) over `canvas.getObjects()` (:271), invoked from `handleSave` (:677, :695) | **WRONG API (BR-6)** |

**A-section score:** 30 of 34 resolve, 2 resolve exactly to the cited line number (A5, A15 — unusually good), 2 are wrong (A16, A34), 1 is broken (A25), 3 are imprecise (A13, A27, A33).

---

## Section B — Structural Seed tree vs the real tree

The tree block claims 13 entries. **No entry is a phantom directory** — every path it names exists. One entry names files that do not exist (B7). The omissions are the problem.

| # | Tree line | Reality | Verdict |
| --- | --- | --- | --- |
| B0 | `src/proxy.ts`, `src/app/`, `src/lib/`, `src/components/`, `data/`, `data/local/`, `data/uploads/`, `tests/`, `.constitution/`, `Dockerfile`/`docker-compose.yml`, `scripts/`, `.claude/skills/picoclaw-webhook/` | all present | OK |
| B1 | `src/lib/` comment enumerates *"parser, pptx, slide-plan, lyrics, db, images, uploads, scripture, auth/, registry/, present-channel"* | **omits `src/lib/artifacts/`** (5 modules) — where AD-12's Fat Payload, AD-15's runtime contract and the registry read actually live. Also omits `src/lib/services/`, `hymn-sections.ts`, `parsed-fields.ts`, `pptx-cache.ts`, `remote-image.ts`, `settings.ts`, `transitions.ts`, `webhook-auth.ts`, `worship-form-fields.ts` | OMISSION, load-bearing (BR-11) |
| B2 | `src/components/    # Header (shared nav/profile) + artifacts/ + ui/ shadcn` | **omits `src/components/admin/`**, which is the canvas editor. Also omits 5 shared components (`SlideView.tsx`, `SlidePreviewList.tsx`, `HymnNumberAutocomplete.tsx`, `ImageFieldPreview.tsx`, `ImageUploadField.tsx`, `LogoutButton.tsx`) | OMISSION + compounds BR-2 |
| B3 | — | `src/lib/services/` (`update-service.ts` is the **only** implementation of AD-6's precondition) absent from the tree | OMISSION (BR-11) |
| B4 | — | `public/` absent. `public/assets/` is named by AD-5's matcher exclusion *with a documented cost reason*, and is the resolution root of AD-8's `/assets/...` refs (`asset-safety.ts:6` joins `process.cwd()/public/assets`). Omitting it makes AD-8 unresolvable from the tree | OMISSION (BR-12) |
| B5 | — | `docs/` absent, though AD-4 cites `docs/deploy.md` and the AD-11 seed mechanism documents itself to `docs/PRIVATE-DATA.md` (`seed.ts:22`) | OMISSION (BR-12) |
| B6 | `data/  # Normalized hymnal corpus (hymns.json); default-registry.json seed; SQLite path via DB_PATH` | omits `data/asset-map.json`, the sole subject of `tests/asset-map-evidence.test.mjs` — a gate the spine names two lines later | OMISSION (BR-12) |
| B7 | `scripts/  # import-hymnal, import:kjv, liveserver helpers` | 11 scripts exist. **No "liveserver helper" script exists** — claimed, absent. `import:kjv` is an npm script name; the file is `import-kjv.mjs`. The two scripts the spine cites elsewhere — `registry-doctor.mjs` (Deferred) and `extract-pptx-assets.mjs` (the `evidenceFor` filter that `asset-map-evidence` asserts) — are missing from the comment, as are `auth-set-password`, `auth-unlock`, `setup`, and 4 `smoke-*` scripts | STALE + one claimed-but-absent entry (BR-13) |
| B8 | `src/app/  # ... (hub, webhook, services, slideshow, presenter, admin/artifacts)` | omits `/announcements` and `/login` (both real routes) | OMISSION, minor (BR-21) |
| B9 | `Dockerfile / docker-compose.yml` | `docker-compose.override.example.yml` also present | OMISSION, cosmetic (BR-21) |

---

## Section C — Contradiction vs the code's actual conventions

Each invariant labelled **OBEYS** / **CONTRADICTS** / **SILENT**, and for every contradiction: *legitimate target state (visibly flagged)* vs *wrong about the code*.

### C1 — AD-5, `config.matcher` and fail-closed: **OBEYS, in full**

The real matcher (`proxy.ts:122`) excludes exactly `api/webhook`, `api/auth/login`, `api/auth/logout`, `login`, `assets`, `_next/static`, `_next/image`, `favicon.ico` — each anchored `(?:/|$)` or `$`, exactly as AD-5's rationale describes; `/api/uploads/*` is deliberately **not** excluded. `tests/proxy-matcher.test.mjs` pins both halves plus prefix-widening. Fail-closed on a DB throw is real: `proxy.ts:76-86` catches, logs, sets `current = null`, and falls into `unauthorized`. `noStore()` (:33-37) stamps `Cache-Control: private, no-store` + `Vary: Cookie` on **every** gated response including 401/403/redirect. No `runtime` export; no `middleware.ts`. AD-14's authorization clause also holds: nothing under `/admin` or `/api/admin` is excluded, `proxy.ts:88-95` forbids non-admins, and both artifact routes additionally call `requireAdminSession`. **Nothing to fix — this is the model the rest of the spine should be measured against.**

### C2 — AD-6, `updated_at` precondition on every service mutation: **CONTRADICTS — wrong about the code** → **BR-1 (CRITICAL)**

AD-6 states: *"every service mutation carries the client's `updated_at` as a precondition… **No write path may bypass the precondition.**"* Four shipped write paths bypass it:

1. **`POST /api/webhook` with `action: 'correct'`** — the exact path AD-6 binds (*"agent/webhook corrections"*) and the exact FR the *State* convention names (*"an authorized webhook correction (FR-12)"*). `handleCorrection` runs an unconditional `UPDATE services SET date = ?, raw_payload = ?, parsed_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?` (`src/app/api/webhook/route.ts`). No precondition read, no 409 path, no conflict result. This is textbook last-write-wins — the precise failure AD-6 says it prevents ("an operator's edit silently erased by a late correction").
2. **`POST /api/webhook` intake path** — for an existing service on the same date, the same unconditional `UPDATE services SET raw_payload, parsed_data, images_payload, updated_at`.
3. **`DELETE /api/services/[id]`** — `deleteService(getDb(), serviceId)`, no precondition.
4. **`PATCH` / `DELETE /api/announcements/[id]`** — `updateAnnouncementItem` / `deleteAnnouncementItem` mutate `announcement_items`, which is service-scoped (`service_id` FK, `ON DELETE CASCADE`, db/index.ts:111-118) and has **no `updated_at` column at all**, so no precondition is even expressible.

The one path that does obey is the operator form: `updateService` (`src/lib/services/update-service.ts:77-78`, plus a second in-transaction guard at :147/:167) → 409 at `src/app/api/services/[id]/route.ts:58-69`.

**Not target state, and not flagged.** AD-6 carries `[ADOPTED]`, and the Deferred section lists *"Telegram corrections + concurrency (FR-12/13b)"* under **Shipped (no longer deferred)** — an affirmative claim that this exact gap is closed. The Deferred section's only concurrency-adjacent item is about AD-5 defence-in-depth, not this.

**Fix (choose one, in the spine, this change set):**
- (a) Narrow the rule: *"the precondition governs browser-client mutations. `/api/webhook` is a trusted single-writer and its corrections are last-write-wins by design"* — and state the accepted cost explicitly, because it is AD-6's own stated failure mode. Then correct the Deferred "Shipped" line to say what shipped (operator-side concurrency) and what did not.
- (b) Keep AD-6 absolute and add a Deferred bullet naming all four paths with a story to own them.
Either way, delete *"No write path may bypass the precondition"* or make it true. A reviewer using AD-6 as a gate would pass a PR touching any of the four.

### C3 — AD-12 / AD-16, renderers never read the registry: **OBEYS in substance** → **BR-17 (LOW)**

`SlideView.tsx` imports only `ArtifactSlide` + `SlidePlanItem`; `ArtifactSlide.tsx` imports only `@/lib/artifacts/runtime-contract` and `@/lib/artifacts/render-model`. Neither touches `src/lib/registry/*`, `getDb`, or the DB. `src/lib/artifacts/hydrate.ts` and `render-model.ts` likewise never call `getDb`.

One import will look like a violation to the next reader: `src/lib/pptx.ts:21` imports `isBundledAssetRef` from `@/lib/registry/asset-safety`. That is the *shared image-safety helper AD-8 mandates*, not a registry data read — but AD-12's absolute phrasing ("a renderer never reaches the registry itself") plus a `src/lib/registry/` import path invites a false positive. **Fix:** one clause in AD-12 — *"reaching `src/lib/registry/asset-safety` for the AD-8 helper is not a registry read; reaching the registry's data is."*

### C4 — AD-16, service-bound snapshot: **CONTRADICTS — unflagged target state, plus a name collision** → **BR-4 (HIGH)**

There is no per-service snapshot in the code. No clone-on-create (`src/lib/services/create-service.ts`), no Sync Artifact action, no per-service registry table or payload column. `buildSlidePlan` reads the **live** registry directly: `src/lib/slide-plan.ts:13` imports `loadRegistrySnapshot`, and `:692` calls it inside the plan build — once per plan, i.e. per debounced keystroke in Live Preview, per that module's own comment.

Two distinct problems:

1. **The Structural Seed diagram states the reverse as present-tense system fact.** The registry-detail graph draws `Registry -->|"clone on service create (AD-16…)"| Snap`, `Snap --> Plan`, and `Plan -.->|"never reads the live registry (AD-16)"| Registry`, under a heading that reads *"System-level dependency direction"* with no target-state marker. The shipped dependency is exactly the edge the diagram crosses out. The Deferred section flags only *where the snapshot lives physically* — which presupposes it exists.
2. **Terminology collision.** `src/lib/artifacts/registry-snapshot.ts` already exports `RegistrySnapshot` / `loadRegistrySnapshot` / `SEED_FALLBACK_UPDATED_AT`, meaning *"in-memory map of the live registry for one plan build"*. AD-16's "snapshot" means *"per-service durable freeze"*. One word, two meanings, in a spine whose *AD map* section explicitly celebrates removing precisely this hazard ("`AD-6` and `AD-9` each used to mean two different decisions depending on which document you were reading").

**Fix:** (i) split the registry diagram into a *shipped* graph and an *Epic 20 target* graph, or label the Epic-20 edges; (ii) add one line to AD-16: *"the shipped `loadRegistrySnapshot` (`src/lib/artifacts/registry-snapshot.ts`) is a per-plan read of the live registry, not this snapshot; Story 20.8 renames it."*

### C5 — AD-7, `buildSlidePlan` is the only order source: **OBEYS**

All five surfaces call it and none sorts or recomputes: `slideshow/page.tsx:71`, `present/page.tsx:72`, `present/projector/page.tsx:62`, `api/services/preview/route.ts`, `lib/pptx.ts`. `src/lib/artifacts/preview-model.ts` derives from the plan. **Nothing to fix.**

### C6 — AD-20, `skipTitle` "removed rather than migrated": **CONTRADICTS — unflagged** → **BR-5 (HIGH)**

`skipTitle` ships today: option type at `src/lib/slide-plan.ts:140`, the suppression branch at `:148`, and passed `true` at `:438`, `:460`, `:550`. AD-20's sentence is indicative — *"the `skipTitle` mechanism **is removed** rather than migrated: there is nothing left to suppress"* — and no Deferred bullet mentions it. A reader of AD-20 alone concludes the mechanism is gone; a builder "cleaning up" on that basis would strip three live call sites.

By contrast, AD-20's *other* half is **correctly flagged**: the planner does today hold the liturgical rules AD-20 forbids — `INTERCESSORY_STANDING_NUMBERS` (`slide-plan.ts:3`, `:29`), `intercessory-671` (`:437`), `intercessory-684` (`:459`), and a `weHaveThisHopeFixed` two-slide rule (`:141-142`, `:165`, `:550`) — and the Deferred bullet *"What AD-20 costs the three liturgical songs, deferred to Story 20.1's seed work"* names that gap honestly. **Do the same for `skipTitle`.**

**Fix:** *"`skipTitle` (`src/lib/slide-plan.ts:140`, three call sites) ships today and is removed by Story 20.1 — not migrated, because a General generates no title slide."*

### C7 — AD-19 vocabulary vs `data/default-registry.json`: **CONTRADICTS — flagged, but in the wrong AD** → **BR-14 (MEDIUM)**

`ARTIFACT_BASE_TYPES` (`types.ts:1-9`) is the **seven**-value set: `general`, `text-placeholder`, `fullscreen-image`, `image-placeholder`, `mix-placeholder`, `song-set`, `announcement`. The committed seed uses six of them — `general` ×18, `text-placeholder` ×6, and one each of `announcement`, `fullscreen-image`, `mix-placeholder`, `song-set` (`image-placeholder` is declared but unused). `data/local/default-registry.json` has an **identical** distribution. AD-19 demands `general` + four `songset-*` + `announcement` = six keys over exactly three kinds.

**The gap is named** — AD-18 says *"Epic 20's **seven**-`base_type`-to-three-kind collapse ships as a total replacement"*, which is an explicit statement that seven is today's reality. So this is legitimate target state. But AD-19's own prose is flatly indicative (*"`text-placeholder`, `image-placeholder`, `mix-placeholder` and `fullscreen-image` **are gone** rather than renamed"*), and the flag lives in a different decision that a reader of AD-19 has no reason to consult. **Fix:** mirror one clause into AD-19 — *"today `ARTIFACT_BASE_TYPES` still holds seven; the collapse is AD-18's total replacement at Epic 20."*

### C8 — the four `songset-*` slot identities: **absent from code, adequately flagged** → **BR-20 (LOW)**

`grep -rn "songset-"` over `src/ tests/ data/ scripts/` returns **nothing**. Neither the identities nor any discriminator column exist. This *is* flagged: the Deferred bullet *"Where a SongSet slot identity is persisted — in the `base_type` column itself, or in a discriminator beside it — is a Story 20.2 / 20.7 schema call"* presupposes it is unbuilt. Informational only; consider adding "none of the four exists in code yet" to remove all doubt.

### C9 — AD-19 Placeholder Catalog, "server-side vocabulary enforced on **every** write path": **CONTRADICTS — unflagged** → **BR-9 (HIGH)**

`src/lib/registry/validate.ts:24` does define `ALLOWED_PLACEHOLDER_KEYS` — but it is a whitelist of a placeholder *definition's own object keys* (`key`, `type`, `required`, `defaultValue`), consumed by `rejectUnknownKeys(obj, ALLOWED_PLACEHOLDER_KEYS, label)` at `:297`. It is not a catalog of admissible placeholder **names**. The only check on `element.placeholderKey` is `:344` — that it appears among the template's own declared `placeholders[]`. A template may therefore declare any key it likes and every write path admits it. CAP-4's *"Lives in: `src/lib/registry/validate.ts`, catalog vocabulary"* points at a file with no such vocabulary, and AD-19 asserts an enforcement property that does not exist. The name similarity makes this actively misleading: a builder greps `ALLOWED_PLACEHOLDER_KEYS`, finds it, and concludes CAP-4 is done.

**Fix:** in AD-19's Placeholder Catalog rule — *"the catalog does not exist yet. Today `validate.ts` only checks a `placeholderKey` against the template's own `placeholders[]`; `ALLOWED_PLACEHOLDER_KEYS` is an unrelated object-key whitelist. Story 20.x adds the vocabulary."*

### C10 — "Ordered Artifact Registry", CAP-1, CAP-2, AD-17's binding: **CONTRADICTS — unflagged** → **BR-8 (HIGH)**

- `artifact_templates` (db/index.ts:178-185) is `id, label, base_type, payload, updated_at, seed_hash`. **There is no ordering column.** AD-17's *Binds* list names *"the registry's ordering column"* — it binds a column that does not exist.
- Ordering today is alphabetical: `store.ts:81` `ORDER BY label COLLATE NOCASE`.
- `src/app/api/admin/artifacts/route.ts` exposes **`GET` only**. `[id]/route.ts` is `GET` + `PUT`; `[id]/reset/route.ts` is `POST`. There is **no create, no delete, no reorder verb**. CAP-2 ("add, delete, rename, reorder entries") has no shipped surface at all beyond rename-via-PUT.
- The Structural Seed's second diagram labels the node `Registry[(Ordered Artifact Registry -- SQLite)]` and the first diagram `Registry[(Ordered Artifact Registry)]`, both as present-tense system nodes.

So the word "ordered" — which CAP-1, CAP-8's reordering clause, AD-16's "clones the **ordered** live registry", AD-17's "the ordered registry is authored data" and both diagrams all lean on — describes nothing in the database. Unflagged in the spine (the SPEC's own delivery-status note mentions it, but the spine is the artifact under review).

**Fix:** add a Deferred bullet — *"the registry has no ordering column and the admin API has no create/delete/reorder verb; today `store.ts:81` orders by `label`. 'Ordered' throughout AD-16/AD-17/AD-20 and both diagrams is Epic 20 target state (Stories 20.1-20.3)."*

### C11 — AD-17, marker-gated first-boot-only seeder: **CONTRADICTS — correctly and precisely flagged. Credit.**

`getDb()` calls `seedArtifactRegistry(db)` on **every** boot, after the DDL and the `seed_hash` backfill; `seedArtifactRegistry` → `reseedArtifactTemplateIfUntouched` (store.ts:391) is exactly the self-healing gap-filler AD-17 forbids, and `tests/registry-reseed.test.mjs:337` asserts a missing row *is* re-inserted. The spine flags this with unusual precision — *"become work without a job **once AD-17 lands**"*, naming `reseedArtifactTemplateIfUntouched`, `npm run registry:doctor`, and the exact test, and insisting the test be **inverted, not deleted**. **This is what the other Epic-20 gaps should look like. No finding.**

### C12 — AD-11, "Filesystem JSON serves **exclusively** as a startup seed": **CONTRADICTS — wrong about the code** → **BR-7 (HIGH)**

`loadRegistrySnapshot` (`src/lib/artifacts/registry-snapshot.ts:85-90`) calls `loadSeedTemplates()` at **plan-build time** and substitutes shipped-seed content, stamped `SEED_FALLBACK_UPDATED_AT`, for any id absent from the DB or rejected by `parseRow`. Its own comment says so: *"a row can be absent when the seed gained a template after first startup, or be rejected… as corrupt."*

Consequences the spine does not acknowledge:
- The seed file is a **render-time content channel**, not exclusively a startup seed. AD-11's word is "exclusively".
- A template row the administrator **deletes still renders**, from the shipped file. That is the resurrection AD-17 exists to forbid, relocated from boot to render — and it survives AD-17 completely untouched, because AD-17 binds only *the seeder* and *boot*. Once AD-17 lands and CAP-2's delete verb ships, delete will appear to work in `/admin/artifacts` and silently not work in the deck.
- Under AD-16 this fallback is also a second read path into the seed that bypasses any snapshot.

**Fix (pick one):** (a) extend AD-11's rule to name the read-time fallback as a second deliberate role of the seed file, stating the deleted-row consequence; **or** (b) extend AD-17 from *"boot never inserts"* to *"and no read path substitutes seed content for an absent row"*, and add `loadRegistrySnapshot`'s fallback branch to the Deferred list of things Story 20.1/20.3 retires alongside `seed_hash`.

### C13 — AD-11 two-layer seed precedence: **OBEYS, with an unnamed escape hatch** → **BR-16 (LOW)**

`resolveSeedPath()` (`seed.ts:38-41`) prefers `data/local/default-registry.json` when present — **except** when `WPW_USE_SHIPPED_REGISTRY=1`, which the automated tests and fidelity smokes set so a developer's private override cannot change expected PPTX copy or fail the public-repo placeholder assertions. AD-11 states the precedence as unconditional. The override is a good design; the spine's silence invites someone to "fix" it. **Fix:** one parenthetical in AD-11 naming `WPW_USE_SHIPPED_REGISTRY=1` as the test-only inversion.

### C14 — status vocabulary: **the mechanism behind C4/C6/C9/C10** → **BR-3 (HIGH)**

`[ADOPTED]` appears on AD-5..AD-10 and nowhere else. But:
- AD-1..AD-4 carry no marker and are **shipped**.
- AD-11..AD-15 carry no marker and are **shipped** — the Deferred section says so outright (*"Shipped (no longer deferred): … Artifact Registry + canvas editor (Epic 16 — AD-11..AD-15)"*).
- AD-16..AD-22 carry no marker and are **entirely unbuilt** (Epic 20, all eight stories `backlog`).

So the absence of `[ADOPTED]` means both "shipped" and "not built", the marker is applied to 6 of 14 shipped decisions, and the spine never says what it means. Every AD-16..AD-22 rule is then written in the indicative present ("is removed", "are gone", "is enforced on every write path", "clones the ordered live registry"), and the Epic-20 CAP table's *"Lives in"* column names files as though the capability lived there. The Deferred section carries the truth for some items (AD-17, AD-21, the liturgical lyrics, snapshot physical location) and not others (`skipTitle`, the catalog, the ordering column, the snapshot's existence). A reader of AD text alone cannot tell decided-for from already-true — which the brief names as a finding in its own right.

**Fix (one edit, highest leverage in this review):** tag every decision — `[ADOPTED]`, `[DECIDED — Epic 20 target, not built]`, `[SUPERSEDED IN PART]` — **or** add one sentence under *Invariants & Rules*: *"AD-1..AD-15 describe shipped code. AD-16..AD-22 are decided but unbuilt; Epic 20 is entirely backlog, and every present-tense rule in them is target state. The Epic 20 CAP table's 'Lives in' column names intended homes, not current ones."* That single sentence downgrades BR-4/5/8/9 from defects to flagged scope.

### C15 — CAP-*n* namespace collision: **SILENT** → **BR-... (MEDIUM)**

Both `spec-artifact-registry-authoring` and `spec-slide-artifact-model` number capabilities from `CAP-1`. `src/lib/slide-plan.ts:141` carries a bare `/** CAP-4: fixed 2-slide poetic layout for standing We Have This Hope. */` — the *slide-artifact-model* CAP-4 — while the spine's CAP table's `CAP-4` is *"Placeholder Catalog inserted and styled locally"* from the other spec. Same hazard class as the `AD-6`/`AD-9` double meaning the *AD map* section congratulates itself on removing, one altitude down, and unnamed. The spine partly dodges it by labelling the Epic-16 table's left column "Area" instead of "CAP", but shipped code comments still carry bare `CAP-n`.

**Fix:** qualify as `E20-CAP-n` / `E16-CAP-n` in the two table headers, and add a sentence to the *AD map* section: *"the CAP namespace is still shared between the two specs; cite CAPs with their epic."*

### C16 — AD-4, AD-8, AD-9, AD-15, AD-2, AD-3, AD-1: **OBEY. Credit.**

- **AD-4:** compose bind-mounts `DB_PATH=/data/data.db`, `PPTX_CACHE_DIR`, and host→`/app/data/uploads`, across `prod`/`dev` profiles; `docs/deploy.md` documents the same, plus the WAL-sidecar-same-volume rule and the `/api/uploads/<32-hex>` shape. Only the hostname differs (BR-19).
- **AD-8:** `asset-safety.ts:6-12` resolves `/assets/<filename>` against committed `public/assets/`; `pptx.ts:125` comments that its accepted set is exactly the registry/announcement gates'; one shared helper, no inline resolver found.
- **AD-9 / AD-18 division:** schema evolves by `CREATE TABLE IF NOT EXISTS` + guarded `ALTER TABLE` on the `getDb` path; no framework, no migrations directory. The `seed_hash` backfill is a *value* migration on the startup path, marker-gated — exactly AD-18's pre-AD-21 mechanism, with the marker's rationale documented in-code.
- **AD-15:** every write validates — canvas save → `validateArtifactTemplate` (store.ts:230), seeder → `validateArtifactTemplateList` (seed.ts:69), and `loadRegistrySnapshot` re-validates persisted rows on read (`parseRow`), logging every rejection with id and reason.
- **AD-2 / AD-3 / AD-1:** single deployable repo; webhook JSON is layout-agnostic (`parseRundown` only); PPTX route, slideshow, presenter and projector all exist.

---

## Findings, ranked

| # | Sev | Finding | Fix |
| --- | --- | --- | --- |
| BR-1 | **CRITICAL** | AD-6 asserts *"No write path may bypass the precondition"*, and the Deferred section lists webhook-correction concurrency as **shipped**. Four shipped paths bypass it: `handleCorrection` and the intake `UPDATE` in `src/app/api/webhook/route.ts`, `DELETE /api/services/[id]`, `PATCH`/`DELETE /api/announcements/[id]` (whose table has no `updated_at` at all). The webhook correction path is the exact last-write-wins failure AD-6 claims to prevent. | Narrow AD-6 to browser-client mutations + declare the webhook a trusted single-writer with the cost stated, **or** keep it absolute and file all four under Deferred with a story. Correct the "Shipped" line either way. |
| BR-2 | **CRITICAL** | CAP-3, the Epic-16 *"Canvas editor boundary"* row, and the tree all place the canvas editor in `src/components/artifacts/`. It is in `src/components/admin/ArtifactEditor.tsx`; `src/components/artifacts/` holds only `ArtifactSlide.tsx`, **the web renderer** that `SlideView` renders through. A builder acting on CAP-3 pulls Fabric into the render path — exactly the separation AD-12/AD-13 exist to keep. | Repoint CAP-3 and the Epic-16 row to `src/components/admin/ArtifactEditor.tsx`; add `src/components/admin/` to the tree and say `artifacts/` is the renderer. |
| BR-3 | HIGH | No status vocabulary. `[ADOPTED]` sits on 6 of 14 shipped decisions and on none of the 7 unbuilt ones, so its absence means both. Every AD-16..AD-22 rule reads as accomplished fact; the Deferred section flags some gaps and not others. This is the mechanism behind BR-4/5/8/9. | Tag every AD, or add the one-sentence scope statement under *Invariants & Rules* (drafted in C14). |
| BR-4 | HIGH | AD-16's service-bound snapshot does not exist (no clone-on-create, no Sync, no per-service store), yet the Structural Seed diagram draws `Snap --> Plan` and crosses out `Plan --> Registry` as present-tense system fact. Shipped: `slide-plan.ts:692` calls `loadRegistrySnapshot()` against the live registry per plan build. Compounded by a name collision — shipped `RegistrySnapshot` means "live-registry map for one plan", AD-16's "snapshot" means "per-service durable freeze". | Split or label the registry diagram as Epic-20 target; add one line to AD-16 disambiguating the shipped `loadRegistrySnapshot`. |
| BR-5 | HIGH | AD-20: *"the `skipTitle` mechanism **is removed**… there is nothing left to suppress."* It ships at `src/lib/slide-plan.ts:140`, `:148`, `:438`, `:460`, `:550`, and no Deferred bullet mentions it (the AD-20 bullet covers the liturgical lyrics only). | *"`skipTitle` ships today at three call sites; Story 20.1 removes it rather than migrating it."* |
| BR-6 | HIGH | AD-13 and the diagram edge both name `canvas.toJSON()`. **`toJSON` is never called.** Save uses `serializeCanvas` (`ArtifactEditor.tsx:257`) over `canvas.getObjects()` (`:271`) from `handleSave` (`:677`, `:695`), projecting into the registry's `CanvasElement[]` shape. This matters: Fabric's `toJSON()` format is not `ArtifactLayout.elements`, so a new editor surface built from AD-13's literal text (e.g. AD-22's SongSet config) would fail AD-15's validator. | Reword AD-13 and the edge label to *"React reads the canvas only on save, via `serializeCanvas` → `canvas.getObjects()`, projecting into the registry element schema."* |
| BR-7 | HIGH | AD-11: filesystem JSON *"serves **exclusively** as a startup seed."* `registry-snapshot.ts:85-90` reads the seed at **plan-build** time and substitutes shipped content for absent or rejected rows — so a deleted template still renders, which is AD-17's forbidden resurrection relocated from boot to render, and AD-17 does not reach it. | Name the read-time fallback in AD-11, or extend AD-17 to read paths and add the fallback branch to the Story 20.1/20.3 retirement list. |
| BR-8 | HIGH | "Ordered Artifact Registry" describes nothing in the DB: `artifact_templates` has no ordering column (db/index.ts:178-185), `store.ts:81` orders by `label COLLATE NOCASE`, and `/api/admin/artifacts` exposes **GET only** — no create, delete, or reorder. AD-17 *Binds* "the registry's ordering column"; CAP-1/CAP-2 and both diagrams present it as real. | Deferred bullet naming the missing column and the missing verbs, and marking "ordered" as Epic-20 target throughout. |
| BR-9 | HIGH | AD-19's Placeholder Catalog *"admitted key set is server-side vocabulary enforced on **every** write path"* — it does not exist. `validate.ts:24` `ALLOWED_PLACEHOLDER_KEYS` is an object-key whitelist (`key`/`type`/`required`/`defaultValue`); the only `placeholderKey` check (`:344`) is against the template's own declarations. CAP-4 points at this file for "catalog vocabulary". The name similarity makes a grep look like confirmation. | State that the catalog is unbuilt and that `ALLOWED_PLACEHOLDER_KEYS` is unrelated. |
| BR-10 | HIGH | AD-4 cites `README-deployment.md` for operator details. **It does not exist anywhere in the repo.** `docs/deploy.md` (also cited) does; `docs/deployment-guide.md` is the nearest match. | Drop it or repoint to `docs/deployment-guide.md`. |
| BR-11 | MEDIUM | The tree's `src/lib/` comment omits `src/lib/artifacts/` — the five modules where AD-12's Fat Payload, AD-15's runtime contract and the registry read actually live — and `src/lib/services/`, the only home of AD-6's precondition. The *Boundaries* convention says registry logic lives in `src/lib/registry/*`; half of it lives in `src/lib/artifacts/*`. | Add both directories to the tree; widen the Boundaries row to name `src/lib/artifacts/*` as the hydration/runtime-contract layer. |
| BR-12 | MEDIUM | Tree omits `public/` (AD-5's `assets` exclusion and AD-8's `/assets/...` resolution root, `asset-safety.ts:6`), `docs/` (AD-4, `docs/PRIVATE-DATA.md`), `src/components/admin/`, and `data/asset-map.json` (the sole subject of a gate the spine names). | Add four lines. |
| BR-13 | MEDIUM | `scripts/  # import-hymnal, import:kjv, liveserver helpers` — **no "liveserver helper" script exists**; `import:kjv` is an npm script (file is `import-kjv.mjs`); and the two scripts the spine cites elsewhere, `registry-doctor.mjs` and `extract-pptx-assets.mjs`, are absent from the comment. 11 scripts exist. | Rewrite as `import-hymnal, import-kjv, registry-doctor, extract-pptx-assets, auth helpers, smoke-*`. |
| BR-14 | MEDIUM | AD-19 says the four placeholder kinds *"are gone rather than renamed"* in the indicative. `ARTIFACT_BASE_TYPES` still holds seven and both seed files use six of them. The "today it is seven" flag exists **only in AD-18**. | Mirror one clause into AD-19. |
| BR-15 | MEDIUM | `deferred-work.md` cited twice with no path; it is `_bmad-output/implementation-artifacts/deferred-work.md`. | Qualify both citations. |
| BR-16 | LOW | AD-11 states the `data/local/` precedence unconditionally; `seed.ts:39` inverts it under `WPW_USE_SHIPPED_REGISTRY=1` for tests and fidelity smokes. | Name the override in AD-11. |
| BR-17 | LOW | AD-12's absolute *"a renderer never reaches the registry itself"* will read as violated by `pptx.ts:21` importing `isBundledAssetRef` from `@/lib/registry/asset-safety` — which is the AD-8 helper, not a data read. | One clarifying clause in AD-12. |
| BR-18 | LOW | AD-21 and the Deferred bullet call `artifact_seed_hash_backfilled` a **boolean**; it stores `String(recorded)`, a count, presence-checked (db/index.ts:238-252). | Say "presence marker". |
| BR-19 | LOW | AD-4 says `presenter.example.church`; `docker-compose.yml` defaults use `presenter.example.org`. | Align on one placeholder domain. |
| BR-20 | LOW | The four `songset-*` identities appear nowhere in `src/`, `tests/`, `data/`, `scripts/`. Adequately flagged via the Story 20.2/20.7 persistence bullet; state it outright. | Add "none exists in code yet". |
| BR-21 | LOW | Tree's `src/app/` comment omits `/announcements` and `/login`; `docker-compose.override.example.yml` unmentioned. | Add to the comments. |

---

## What this lens found working

Worth recording, because a ratification review that only lists defects misrepresents the artifact:

- **AD-5 is ratified in full** — matcher regex, every exclusion and its anchoring, the deliberate `/api/uploads/*` inclusion, fail-closed on a DB throw, `no-store`/`Vary: Cookie` on every gated response including refusals, no `runtime` export, no `middleware.ts`, and a test that pins both halves. The spine's prose and the code agree line for line.
- **Two `file:line` citations land exactly** — `registry/store.ts:226` and `ArtifactEditor.tsx:104` are both the precise line described, in a file that has changed since. That is rare.
- **The Stack table has zero drift** across all 11 rows plus `output: "standalone"`.
- **AD-7, AD-8, AD-9/AD-18's division, AD-10, AD-14's authorization clause, AD-15** are all obeyed by shipped code.
- **AD-17's gap is flagged better than any other**: it names `reseedArtifactTemplateIfUntouched`, `npm run registry:doctor` and `tests/registry-reseed.test.mjs`, all three of which resolve, and it insists the test be *inverted, not deleted*. Every other Epic-20 decision should be flagged the way AD-17 is. Doing that (BR-3) resolves four HIGH findings at once.
