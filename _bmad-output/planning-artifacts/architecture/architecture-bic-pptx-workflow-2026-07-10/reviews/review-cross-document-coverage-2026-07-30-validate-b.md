# Review — Cross-document / capability-coverage lens

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Intent:** Validate (report only — no spine or project file edited)
**Lens:** ad-hoc cross-document contradiction + downward capability coverage
**Date:** 2026-07-30
**Independence:** derived without reading `reviews/**` or either `.memlog.md`. Where a finding cites a memlog it is because a *live* document quotes it, not because the memlog was read as evidence.

**Verdict:** CHANGES REQUESTED. The spine is internally coherent and its 22 decisions are well-formed, but it sits in a corpus that has not caught up with it. Four live contradictions would mislead a builder starting Epic 20 today, and the spine's own claim that "every live citation in the repo was repaired in the same change set" is false.

| Severity | Count |
| --- | --- |
| CRITICAL | 4 |
| HIGH | 8 |
| MEDIUM | 12 |
| LOW | 4 |
| **Total** | **28** |

Ownership summary: **7 findings the spine owns**, **21 the spine can only report against a companion**. That ratio is itself the story — the spine has run ahead of the corpus that cites it.

---

## 1. Downward coverage — specs

### 1a. `spec-artifact-registry-authoring` — CAP-1..CAP-8 coverage audit

The spine's *Capability → Architecture Map* claims every CAP has a governing AD. Verified row by row: does the cited AD **genuinely govern** the capability, or is it merely adjacent?

| CAP | Spine cites | Genuine? | Finding |
| --- | --- | --- | --- |
| CAP-1 — one ordered registry defines which slides exist and in what sequence | AD-7, AD-16, **AD-20** | **真** | AD-20 is the load-bearing one and the spine correctly bolds it. AD-7 fixes one order source, AD-16 fixes that the source is the snapshot, AD-20 fixes that the planner holds no rule of its own. Complete. |
| CAP-2 — add, delete, rename, reorder | AD-14, AD-17, AD-6 | **真** | AD-17 explicitly Binds "the delete verb, and the registry's ordering column" and forbids boot from re-inserting/relabelling/reordering. AD-6 Binds "registry template writes". Genuinely governing, not adjacent. |
| CAP-3 — full canvas authoring, General only | **AD-22**, AD-13, AD-15 | **真** (wrong path) | The AD citations are exact — AD-22 is what makes "General only" an invariant rather than a capability sentence. But *Lives in* says `src/components/artifacts/`, which holds only `ArtifactSlide.tsx` (the renderer). The canvas editor is `src/components/admin/ArtifactEditor.tsx`. → **F-14** |
| CAP-4 — Placeholder Catalog inserted and styled locally | AD-19, **AD-22**, AD-15 | **真** | AD-19's second Rule clause makes the key set server-enforced on every write path; AD-22 supplies "locally = on a General". Complete. |
| CAP-5 — three kinds plus editable label, **shown as `[kind] label`** | AD-19 | **partial** | AD-19 fixes the vocabulary (six keys over three kinds) and that a label cannot touch a binding. It does **not** fix the display form. For a `songset-bt-open` row the chip reads `[song-set]` or `[songset-bt-open]` — nothing in the corpus decides it. `EXPERIENCE.md` does not carry it either. → **F-19** |
| CAP-6 — service clones the registry; Sync re-clones | AD-16, AD-6, AD-15 | **真** | The strongest row. AD-16 fixes the freeze event, the destructive re-clone, the precondition, the non-cloning of announcement membership. Complete. |
| CAP-7 — Announcement is one entry expanding to N full-bleed images | AD-16, AD-8 | **partial** | Covers membership (AD-16) and image safety (AD-8). CAP-7's other half — *"there is no canvas editor for the Announcement entry"* — is fixed by **AD-22** ("an `announcement` row is bound to the Announcements master set… Only those two kinds expand"), which this row does not cite. Given the table's stated purpose, the omission reads as an uncovered half. → **F-20** |
| CAP-8 — four SongSet slots with backgrounds and per-slot hymn numbers | AD-19, **AD-22**, AD-12 | **真** | AD-19 makes the slot identity the binding key; AD-22 fixes the surface's exact extent; AD-12 makes expansion a hydration concern. Complete. |

**Spec constraints appearing in no row at all.** Two of the SPEC's *Constraints* have no representation in the map:

- *"Explicit Save for registry/canvas mutations; no autosave."* — AD-13 implies it (React reads state only on Save) but no row surfaces it, and it is a contract a builder can violate without touching AD-13.
- *"Placeholder Catalog extensions require code + tests."* — AD-19 states "Extending the vocabulary… is a code-plus-tests change" for the SongSet clause; the Placeholder Catalog clause says the key set is "server-side vocabulary" but does not restate code+tests. Minor.

Neither rises above LOW; recorded for completeness rather than as findings.

### 1b. `spec-slide-artifact-model` — CAP-1..CAP-9 coverage audit

The spine maps this spec by **Area**, not by CAP, so CAP-level holes do not show. Re-derived per CAP:

| CAP | Governed by | Finding |
| --- | --- | --- |
| CAP-1 — declarative registry of named templates | AD-11, AD-15 | ✓ |
| CAP-2 — **seven** base types | AD-19 (collapses to three) | Deliberate reversal, correctly recorded in the spec's own supersession note. ✓ |
| CAP-3 — visually edit a canvas-editable template | AD-13, AD-22, AD-15 | ✓ |
| CAP-4 — hydrated `ArtifactInstance[]`, SongSet expands | AD-12, AD-22 | ✓ |
| CAP-5 — Preview groups slides by operator-recognizable labels | **nothing** | No AD, no *Deferred* entry. Epic 20 CAP-5 replaces the label scheme with `[kind] label`; the spine governs neither the old badges nor the new display. Folds into **F-19**. |
| CAP-6 — renderers consume positioned elements, no per-kind branches | AD-12, AD-7 | ✓ |
| CAP-7 — registry owns standing content now embedded in `slide-plan.ts` | **AD-20** | Genuinely governed — but the Epic 16 *Area* table has no row for it, so the strongest downward coverage the spine has for this spec is invisible in the map. MEDIUM, folded into **F-17**. |
| CAP-8 — typed placeholder slots; *"`BibleVerseContemplation` remains a TextPlaceholder"* | AD-19 contradicts it | → **F-10** |
| CAP-9 — reject unauthorized, unsafe, invalid, **or stale** mutations | AD-14, AD-15, AD-8 — **AD-6 missing from the map** | AD-6 does bind "registry template writes", so coverage exists; the Epic 16 *Area* table cites AD-6 nowhere, so the stale-write quarter of CAP-9 shows as uncovered. Folds into **F-17**. |

### 1c. An AD that contradicts a spec constraint — the reverse check

Four found. Two are recorded reversals; two are not.

| AD | Spec text it contradicts | Recorded? |
| --- | --- | --- |
| AD-19 | `spec-slide-artifact-model` CAP-2 seven base types | Yes — spec's supersession note names it |
| AD-16 | `spec-slide-artifact-model` *Constraints*: *"Artifact templates are global across services."* (`SPEC.md:65`) | **No** → **F-4** |
| AD-17 | `spec-slide-artifact-model` *Constraints*: *"`data/default-registry.json` is a startup seed that inserts missing template IDs only"* (`SPEC.md:64`) | **No** → **F-4** |
| AD-22 | `placeholder-catalog.md:8`: *"**Any** ordered-registry slide may insert zero or more catalog placeholders as canvas elements."* | **No** → **F-7** |

---

## 2. Downward coverage — PRD & epics

The spine's frontmatter claims `binds: ['FR-1..FR-20', 'NFR offline-Sabbath reliability', 'epic-1..epic-20', 'spec-artifact-registry-authoring CAP-1..CAP-8']`. Audited against `prds/prd-bic-pptx-workflow-2026-07-10/prd.md` and `epics.md`.

### 2a. FR coverage

| FR | Governing AD | Deferred entry | Verdict |
| --- | --- | --- | --- |
| FR-1 Ingest rundown | AD-3 | — | ✓ |
| FR-2 Resolve hymns by SDAH number | AD-20 (negatively: liturgical content "never computed from the hymnal") | — | ✓ indirect |
| FR-3 Persistent Announcement list | AD-8, AD-16 | — | ✓ |
| FR-4 Assemble deck from skeleton | AD-7, AD-20 | — | ✓ |
| FR-5 Song blocks / verse-Reff splitter | AD-7 | Yes — AD-20 shrinks its scope, recorded | ✓ |
| FR-6 Variable non-song slide types | AD-12, AD-19 | — | ✓ |
| **FR-7 One selectable slide transition** | **none** | **none** | **HOLE → F-5** |
| FR-8 List services by date | — (no invariant needed) | — | ✓ |
| FR-9 / FR-15 Slideshow | AD-1, AD-7 | — | ✓ |
| FR-10 Manual delete | — | — | ✓ |
| FR-10b PPTX retention | AD-4 (PPTX cache on durable path) | — | ✓ |
| FR-11 Edit service inputs | AD-6 + *State* convention | — | ✓ |
| FR-11b Create via web form | AD-6, AD-16 (creation is the freeze event) | — | ✓ |
| FR-12 Telegram correction | AD-3, AD-6 | — | ✓ |
| FR-13 Regenerate in place ≤5 min | — (NFR-2 territory) | — | see NFR table |
| FR-13b First-save-wins concurrency | AD-6 | — | ✓ |
| FR-14 Offline PPTX | AD-1 | — | ✓ |
| FR-16 Presenter mode | AD-10, AD-1 | — | ✓ |
| FR-17 Run sheet | — | — | ✓ |
| FR-18 Per-person accounts + roles | AD-5, AD-14 | — | ✓ |
| FR-19 KJV scripture | — | Yes — "FR-19 corpus ops" | ✓ |
| FR-20 Runtime-editable registry | AD-11..AD-15 | Listed as shipped | ✓ |

**One hole: FR-7.** PRD `prd.md:305` promises *"The browser transition matches the Deck's configured transition style (FR-7); the two are chosen once and never diverge."* That is a cross-surface single-source promise of exactly the species AD-7 and AD-12 exist to protect, it is implemented by a real shipped module (`src/lib/transitions.ts` + `src/lib/use-slide-transition.ts`, consumed by both `pptx.ts` and the web path), and no AD governs it. It is also absent from the spine's `src/lib/` enumeration at `ARCHITECTURE-SPINE.md:249`. `docs/architecture.md:61` — a declared spine `source` — independently hardcodes the projector to "a smooth crossfade transition", i.e. the divergence FR-7 forbids is already written down somewhere.

### 2b. NFR coverage — the `binds:` claim is under-specified

| NFR (PRD §10) | Governing AD | Deferred | Verdict |
| --- | --- | --- | --- |
| NFR-1 Offline reliability | AD-1 | — | ✓ but bound by prose, not id → **F-13** |
| NFR-2 Generation performance ≤5 min | **none** | **none** | HOLE (EXPERIENCE.md carries only the progress *state*) → **F-13** |
| NFR-3 Readability | **none** | **none** — and AD-20 actively weakens it | **HIGH → F-12** |
| NFR-4 Headless-safe rendering | AD-1 partially (no interactive PowerPoint) | — | thin |
| NFR-5 Robust parsing / fail visibly | — (EXPERIENCE.md owns the surface) | — | acceptable |
| NFR-6 Access control | AD-5 | — | ✓ |
| NFR-7 Font licensing/availability | **none** | **none** — the Stack table names no font | HOLE → **F-13** |

The spine binds *"NFR offline-Sabbath reliability"* — an unnumbered prose name. `prd.md:546` records that stable ids `NFR-1…NFR-7` were introduced on 2026-07-29 **precisely because** unnumbered prose meant "no story or test could cite one" and "story 6.6 cited an `NFR-4` that resolved to nothing". The spine was updated 2026-07-30 and still cites by prose.

### 2c. Epic coverage

| Epic | Status (`sprint-status.yaml`) | Governing AD / Deferred | Verdict |
| --- | --- | --- | --- |
| 1–16 | done | AD-1..AD-15 | ✓ |
| **17** — readable/honest operator surface | in-progress | **no AD, no Deferred entry** | `binds: epic-1..epic-20` over-claims; DESIGN.md owns it → **F-23** |
| 18 — member data stays gated | backlog | *Deferred* → "Defence-in-depth on non-admin APIs… nine routes" | ✓ verified against `deferred-work.md:158` |
| 19 — liturgical rules in data | **retired** | AD-20 | ✓ consistent with `epics.md:325` and `sprint-status.yaml:308` |
| 20 — registry becomes where the deck is authored | backlog | AD-16..AD-22 | ✓, but AD-21/AD-22 unrepresented in the epic → **F-17**, **F-18** |

### 2d. Deferred list vs sprint-status vs `deferred-work.md`

Every spine *Deferred* claim was checked against its named tracker. **All verified true** except where noted:

| Spine Deferred item | Tracker claim | Verified |
| --- | --- | --- |
| FR-19 corpus not committed under `data/` | `epics.md:93` Partial; `deferred-work.md:35-37` | ✓ (note `sprint-status.yaml:103` has `12-1-kjv-scripture-display: done` — consistent, because the story shipped the UI and the corpus is an ops step, but the two records read oppositely at a glance) |
| Nine routes rely on the AD-5 gate alone | `deferred-work.md:158-159`, Epic 18 backlog | ✓ exact |
| SDAH lyric license | `deferred-work.md:45-47` | ✓ |
| Rotation / background-opacity / image-opacity vocabulary | `deferred-work.md:183`, `:187` | ✓ exact, with source evidence |
| AD-21's counter does not exist yet; mechanism is still `artifact_seed_hash_backfilled` | `src/lib/db/index.ts:13` | ✓ exact |
| `READ_ONLY_BASE_TYPES` refuses every admin edit at `ArtifactEditor.tsx:104` and `store.ts:226` | verified in source | ✓ exact (path is `src/components/admin/`, see F-14) |
| `tests/registry-reseed.test.mjs` asserts a missing row *is* re-inserted | `tests/registry-reseed.test.mjs:337` — *"a missing row is inserted with its seed hash recorded"* | ✓ exact; the spine's instruction to **invert not delete** it is correct |
| Multi-Church Configuration deferred | **appears nowhere else in the corpus** | orphan → **F-27** |
| Observability | not in `deferred-work.md` (spine does not claim it is) | ✓ |

No spine *Deferred* item claims shipped what sprint-status says is open, and no item marks open what sprint-status says is done. **Section 4's tracking check is clean in that direction** — the drift is all in the seeding narrative (**F-21**).

---

## 3. Sideways contradictions — the UX spine

`AGENTS.md:98-99` makes `EXPERIENCE.md` the owner of IA/surfaces/flows and `DESIGN.md` the owner of tokens/components, and requires a structural-invariant change to travel with its companions **in the same change set**. AD-16 landed 2026-07-30; `EXPERIENCE.md` is dated 2026-07-30. The same-change-set requirement was half met.

### 3a. Every `AD-n` citation in `EXPERIENCE.md` (24 sites) and `DESIGN.md` (2 sites), verified

| File:line | Cites | Exists | Says what the citer implies? |
| --- | --- | --- | --- |
| `EXPERIENCE.md:29` | AD-1 | ✓ | ✓ PPTX primary, web additive — exact |
| `EXPERIENCE.md:30` | AD-5 | ✓ | ✓ one gate, matcher is the boundary |
| `EXPERIENCE.md:38` | AD-5 | ✓ | ✓ `safeNextPath` |
| `EXPERIENCE.md:44` | AD-10 | ✓ | ✓ |
| `EXPERIENCE.md:60` | AD-6 | ✓ | ✓ stale write |
| `EXPERIENCE.md:71` | AD-8 | ✓ | ✓ shared helpers |
| `EXPERIENCE.md:72` | AD-7 | ✓ | ✓ never re-derive order |
| `EXPERIENCE.md:73` | AD-12 | ✓ | ✓ same hydrated AST |
| `EXPERIENCE.md:74` | AD-15 | ✓ | ✓ clipping preserved deliberately |
| `EXPERIENCE.md:75` | AD-13 | ✓ | ✓ Fabric owns state |
| `EXPERIENCE.md:78` | AD-5 | ✓ | ✓ server-side revocation |
| `EXPERIENCE.md:88` | AD-5 | ✓ | ✓ demotion/deletion invalidate |
| `EXPERIENCE.md:89` | AD-6 | ✓ | ✓ |
| `EXPERIENCE.md:103` | AD-8 | ✓ | ✓ |
| `EXPERIENCE.md:105` | AD-15 | ✓ | ✓ validation makes rejection designed |
| `EXPERIENCE.md:114` | AD-10 | ✓ | ✓ forbids server fallback |
| `EXPERIENCE.md:118` | AD-10 | ✓ | ✓ |
| `EXPERIENCE.md:152` | AD-15 | ✓ | ✓ |
| **`EXPERIENCE.md:153`** | **AD-14** | ✓ | **stale as current fact** → F-2 |
| **`EXPERIENCE.md:153`** | **AD-4** | ✓ | **WRONG — AD-4 is LiveServer durable paths** → F-2 |
| `EXPERIENCE.md:227` | AD-8 | ✓ | ✓ |
| `EXPERIENCE.md:241` | AD-10 | ✓ | ✓ |
| `EXPERIENCE.md:247` | AD-13 | ✓ | ✓ |
| `DESIGN.md:79` | AD-15 | ✓ | ✓ registry geometry validated |
| `DESIGN.md:80` | AD-7 | ✓ | incomplete — AD-20/AD-16 now co-own "which slides exist and in what order" → **F-28** |

23 of 25 exact. One wrong number, on the one statement the spine flags as most confusable.

### 3b. The two `EXPERIENCE.md` items the spine assigns and `EXPERIENCE.md` does not carry

The spine's *Deferred* routes two affordance questions to `EXPERIENCE.md` by name:

- *"**Whether a stale snapshot is surfaced to the operator, and how**, is a UX concern owned by `EXPERIENCE.md`."*
- *"**Reset now reverts a rename.** … it is an affordance question for `EXPERIENCE.md`, not an invariant."*

`EXPERIENCE.md` *Open Items* contains exactly four items — lost sync, accessibility, unsaved canvas, session revocation. Neither routed item appears anywhere in the file. The spine hands off; nothing catches. → **F-11**

### 3c. `EXPERIENCE.md` IA table has no surface for two Epic 20 capabilities

- `EXPERIENCE.md:47` describes `/admin/artifacts` as *"Canvas editor for global slide templates"* — both "canvas editor" (it becomes an ordered list **plus** a General-only canvas **plus** AD-22's bounded SongSet configuration surface) and "global" (AD-16) are now wrong. The spine's own Structural Seed at `:230` already writes it as *"ordered list + canvas editor"*.
- CAP-8 / AD-19 put a **per-slot hymnal-number binding on the worship-service settings form**. The IA table routes `/services/new` and `/services/[id]` to `spec-worship-web-input (form-fields.md)` and no state or flow mentions four SongSet slots. AD-19's binding key has one end in a surface `EXPERIENCE.md` does not know changed.

Folded into **F-2** (same owner, same change set).

---

## 4. Sideways contradictions — governance & tracking

### 4a. `AGENTS.md` authority table vs the spine's own *AD map*

| `AGENTS.md:113` claim | Spine says | Verdict |
| --- | --- | --- |
| Path `…/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md` | file exists at that path | ✓ |
| "**one spine per project** (the BMad default)" | `:29` "This is the project's only architecture spine." | ✓ |
| "Decisions are `AD-n` in that one file and the `INIT AD-n` citation form is retired" | `:54` "…drop the prefix." | ✓ |
| "The Epic 16 child spine was folded in on 2026-07-30" | `:29`, `:38-54` AD map | ✓ |
| "its folder **keeps only the run record**" | `:56` that folder is the **sole** record of *why* AD-11..AD-19 were decided — "A resume that reads only this memlog will not find them" | **mismatch → F-22** |
| `AGENTS.md:100` "…with an AD map published in the spine and **every live citation repaired in the same change set**" | `:40` same claim | **false → F-6** |

`.constitution/**` holds only `public-repository.md` and `README.md` — it makes no architecture claim, so there is nothing to contradict. ✓

`_bmad-output/project-context.md` is the cleanest companion in the corpus: `:55` (AD-5), `:85` (AD-9), `:86` (AD-18 + AD-21 + AD-17) are all exact, including the supersession of the boolean marker by the version counter. No finding.

### 4b. `sprint-status.yaml`

- `:196-199` still instructs *"Story 20.8 must not ship before the **epic-16 architecture spine** carries a new AD-n superseding AD-14"*. That spine no longer exists and AD-16 landed. The action item at `:302` is annotated `partially-done` and knows this; the comment block above the story keys does not. → **F-16**
- `:205` (Epic 20 comment block) *"after deploy the same change needs a backfill over live artifact_templates rows **and every service snapshot**"* — AD-18 forbids exactly this. → **F-1**
- `:302` action item is a model of honest tracking: it names the AD-4/AD-14 confusion explicitly, records the mid-day supersession of AD-18's mechanism by AD-21, and adds AD-22. Its 40 AD citations are all post-merge and all correct. No finding.

### 4c. `deferred-work.md`

`:83` states *"Startup seeding is missing-only by design (Story 16.1 AC-16.1-001), so a corrected seed never overwrites a persisted row."* The corpus now carries **three incompatible accounts of the same mechanism**:

1. `deferred-work.md:83` — missing-only, by design
2. `sprint-status.yaml` epic-16 action item — *"the 'missing-only seeding' premise is obsolete — `src/lib/registry/seed.ts` now self-heals at startup via `reseedArtifactTemplateIfUntouched`"*
3. spine AD-17 — bootstrap from zero only, marker-gated, boot never inserts

The spine's *Deferred* correctly anticipates (2) becoming "work without a job". It does not know (1) exists. → **F-21**

---

## 5. Citation integrity across the corpus

Repo-wide sweep for `AD-n`, `INIT AD-n`, `epic-16 AD-n`. Skill fixtures (`.agents/skills/**`, `.claude/skills/**`) excluded as template data. **No `AD-n` citation exists anywhere in `src/`, `tests/`, `scripts/`, `docs/`, `.work/`, or the three agent-rule files** — the entire citation surface is `_bmad-output/**`. No dangling citation above AD-22 exists.

| Citing file | Sites | Retired form? | Wrong target? | Verdict |
| --- | --- | --- | --- | --- |
| `ARCHITECTURE-SPINE.md` | 187 | none (10 in the AD map, by design) | none | ✓ clean |
| `sprint-status.yaml` | 40 | none | none | ✓ clean, all post-merge |
| `epics.md` | 25 | none | none numerically; **AD-18 misstated at `:369`** | → F-1 |
| `EXPERIENCE.md` | 24 | none | **1 (`:153` AD-4)** | → F-2 |
| **`implementation-readiness-report-2026-07-29.md`** | **19** | **11 retired** (`:57` `INIT AD-n`; `:348` `INIT AD-1/5/6/7/8/10` + `epic-16 AD-2/3/4/5`; `:352-357` `INIT AD-1/10/5/6/8`, `epic-16 AD-5`) | `:56-57` asserts **two live spines** | → **F-6** |
| `project-context.md` | 5 | none | none | ✓ clean |
| **`ux-designs/…/review-rubric.md`** | **5** | **5 retired** (`:50`, `:51`, `:67` `INIT AD-8/10`, `INIT AD-1/5/6/7/8/10`, `epic-16 AD-3/5`) | no | → **F-6** |
| **`ux-designs/…/validation-report.md`** | **4** | **4 retired** (`:47`, `:63` `epic-16 AD-5`; `:66` `INIT AD-10`; `:69` `INIT AD-8`) | no | → **F-6** |
| `stories/16-1-…md` | 4 | none — `:26` explicitly notes the renumber | no | ✓ exemplary |
| `DESIGN.md` | 2 | none | incomplete at `:80` | → F-28 |
| **`sprint-change-proposal-2026-07-29.md`** | **2** | **bare `AD-2…AD-5` in an epic-16 context** → silently retargeted to Single-Repo-Monolith / Decoupled-Ingestion / LiveServer / proxy-gate instead of AD-12..AD-15 | **yes** | → **F-6** |
| `prd.md` | 2 | none — `:364` correctly says "folded into … as `AD-11`..`AD-15`" | no | ✓ |
| `stories/1-1-…md` | 2 (AD-2) | no | no | ✓ |
| `stories/1-2-…md` | 1 (AD-5) | no | no | ✓ |
| **`stories/3-1-…md:36`** | 1 (AD-1) | no | **yes — calls AD-1 "Web-First Presentation with PPTX Export Fallback"** | → **F-9** |
| `stories/6-5-…md` | 1 (AD-3) | no | no | ✓ |
| `architecture-epic-16/SUPERSEDED.md` | 39 | retired forms **by design** (it is the reverse map) | no | ✓ correct |
| `specs/spec-artifact-registry-authoring/SPEC.md` | 3 | none — AD-14/AD-16/AD-22 all exact | no | ✓ current |

**Dangling *path* references to the deleted `architecture-epic-16/ARCHITECTURE-SPINE.md`** (4 sites, 3 files) — separate from the AD-number sweep and missed by it:

- `epics-parallel-delivery-analysis.md:11` (input-document list)
- `implementation-readiness-report-2026-07-29.md:22` (input-document list)
- `sprint-change-proposal-2026-07-29.md:85` and `:199`

**Conclusion on the spine's exhaustiveness claim.** `ARCHITECTURE-SPINE.md:40` and `AGENTS.md:100` both assert *"every live citation in the repo was repaired in the same change set."* The sweep finds **20 retired-form AD citations plus 2 silently-retargeted bare citations across 4 live-cited documents, and 4 dangling path references across 3 more**. The claim is false as written. Whether those four documents count as "live" is arguable for the two UX run records — but `implementation-readiness-report-2026-07-29.md` is cited as current evidence by `epics.md:52` (NFR-3 → "readiness report F4-6"), `epics.md:56` (NFR-7 → "M5-4"), and `EXPERIENCE.md:17`/`:243`, and `sprint-change-proposal-2026-07-29.md` is the Correct Course record `epics.md` frontmatter names as its own realignment authority. Those two are live by any reading.

---

## Findings

### CRITICAL

**F-1 — `epics.md:369` and `sprint-status.yaml:205` order a migration that AD-18 forbids.**
Both say the post-deploy `base_type` collapse *"needs a backfill over live `artifact_templates` rows **plus every service snapshot**"*. AD-18 says the opposite in terms: *"A migration operates on the **live registry** and does **not** rewrite service snapshots — structure reaches an existing service only through Sync Artifact (AD-16), so a migration that rewrote snapshots would be a second structural channel."* Story 20.2 is the migration story and `epics.md:381` points its implementer at exactly this paragraph. A builder following it would open the second structural channel AD-16 and AD-18 jointly exist to prevent.
*Fix — companion-owned (`epics.md`, `sprint-status.yaml`):* replace both clauses with AD-18's rule and cite it — a migration rewrites live registry rows only; existing snapshots are refreshed by Sync Artifact or left stale, and AD-16 accepts that an older snapshot may stop being renderable. The spine can only report this.

**F-2 — `EXPERIENCE.md:153` and `:216` still state registry edits are global and immediate, and `:153` cites the wrong AD.**
`:153`: *"Registry edits are global and immediate… There is no per-service override, by design (AD-14). **Scheduled to reverse:** Epic 20 CAP-6 clones the registry per service and refreshes it only on Sync, **which supersedes AD-4**."* AD-16 was recorded 2026-07-30 — the reversal is decided, not scheduled — and the superseded decision is **AD-14**, not AD-4 (LiveServer durable paths). The spine's AD-14 anticipates this exact error: *"Not to be confused with AD-4 (LiveServer durable paths), which is a different decision and is not affected."* Flow 5's climax at `:216` then states as fact that a Save makes *"every service — including ones already reviewed — render the new geometry"*, which is what AD-16 reverses. `epics.md:374` and `sprint-status.yaml:302` both record this as the last open half of Story 20.8's block, so the corpus knows — but the file a UX implementer reads still says the old rule.
Also in scope for the same edit: `:47` calls `/admin/artifacts` a *"Canvas editor for **global** slide templates"*, and the IA table has no surface for AD-19's per-slot hymnal binding on worship-service settings.
*Fix — companion-owned (`EXPERIENCE.md`), via `bmad-ux` Update:* restate `:153` as decided under AD-16 with the correct AD number; rewrite Flow 5 step 4 so the Save reaches the live registry and existing services only on Sync; add a Sync Artifact beat and a stale-snapshot state; update `:47` to "ordered registry list, General canvas, and SongSet configuration"; add the four SongSet slot fields to the `/services/*` surface rows. Closes `epics.md:374`.

**F-3 — `authoring-boundaries.md:18` offers an editable `baseType`; AD-19 forbids it.**
*"Edit **Label** (and optionally **baseType**) in the slide inspector."* AD-19 requires the slot identity be *"**never administrator-editable**"*, that *"**at most one registry row may carry each slot identity**"*, and that the recognized set is *"closed and complete… six keys over three kinds, and no write path admits a seventh."* An admin `baseType` control lets one row be retyped into `songset-ds-open` while another already holds it, breaking the uniqueness AD-19 makes the hymnal binding depend on. `sprint-status.yaml:310` (Gap 4) has this routed and `open`.
*Fix — companion-owned (`authoring-boundaries.md`), via `bmad-spec` Update:* drop `baseType` from step 3, state that kind and slot identity are server-owned and set at creation only, and cite AD-19. Execute the already-open Gap 4 item rather than opening a new one.

**F-4 — `spec-slide-artifact-model/SPEC.md:64-65` still presents two reversed clauses as live constraints.**
`:64` *"`data/default-registry.json` is a startup seed that **inserts missing template IDs only**"* — reversed by AD-17, whose entire *Prevents* is that a gap-filler *"resurrects the row on every boot, forever."* `:65` *"Artifact templates are **global across services**"* — reversed by AD-16. Neither is Story-16.1-scoped, so the file header's "delivered scope record" caveat does not cover them, and the supersession note at `:16` enumerates only two reversals ("Two reversals matter to anyone reading this file directly") — the seven base types and the create/delete/reorder boundary — which affirmatively implies the rest still binds. This is the companion contract `spec-artifact-registry-authoring` names in its own `companions:` list, and Stories 20.1/20.3 are the ones that read it.
*Fix — companion-owned (`spec-slide-artifact-model/SPEC.md`), via `bmad-spec` Update:* extend `:16` from two reversals to four, naming AD-17 against `:64` and AD-16 against `:65`, and mark both constraint bullets superseded in place. The spine can only report.

### HIGH

**F-5 — FR-7's cross-surface transition contract is governed by no decision and is not deferred.**
`prd.md:305` fixes that the PPTX and browser transitions *"are chosen once and never diverge"* — a single-source-of-truth invariant across two renderers, structurally identical to what AD-7 does for order and AD-12 for layout. `src/lib/transitions.ts` and `src/lib/use-slide-transition.ts` implement it and are absent from the spine's `src/lib/` enumeration (`:249`). `docs/architecture.md:61`, a declared spine `source`, already contradicts it by hardcoding "a smooth crossfade".
*Fix — spine-owned:* either add the next AD (`AD-23`) fixing that transition style is one service-level value consumed identically by both renderers with no per-surface default, or add an explicit *Deferred* entry saying the spine deliberately does not govern it. Silence is the only unacceptable option, because the corpus already contains one divergence.

**F-6 — the "every live citation repaired" claim is false; 4 live-cited documents still carry retired or retargeted citations, and 3 carry dangling paths.**
Detail in §5. The two that matter most:
- `implementation-readiness-report-2026-07-29.md:56-57` still tabulates **two live architecture spines** — *"Initiative altitude, authoritative parent. AD-1 … AD-10"* and *"`architecture/architecture-epic-16/` | Epic altitude, child of the above. Inherits parent decisions read-only as `INIT AD-n`"* — plus 11 retired-form citations. `epics.md` cites this report as current evidence for NFR-3 and NFR-7.
- `sprint-change-proposal-2026-07-29.md:85` cites *bare* `AD-2…AD-5` in an epic-16 context. Those now resolve to Single-Repo-Monolith, Decoupled-Ingestion, LiveServer-durable-paths and the proxy gate instead of AD-12..AD-15. This is precisely the silent-retargeting failure mode the fold-in's own audit identified, surviving in a live Correct Course record — and being bare, it is invisible to a dangling-citation check.
*Fix — split ownership.* **Spine-owned:** soften `:40` to state what was actually repaired (the tracked planning/spec/UX/story set) and name the dated run records that deliberately keep their contemporaneous form. **Companion-owned:** add a one-line post-fold-in banner to `implementation-readiness-report-2026-07-29.md`, `review-rubric.md`, `validation-report.md` and `sprint-change-proposal-2026-07-29.md` pointing at the AD map, and repair the four dangling `architecture-epic-16/ARCHITECTURE-SPINE.md` paths in `epics-parallel-delivery-analysis.md:11`, `implementation-readiness-report-2026-07-29.md:22`, `sprint-change-proposal-2026-07-29.md:85`/`:199`. `AGENTS.md:100` needs the same softening as the spine.

**F-7 — `placeholder-catalog.md:8` admits catalog placeholders on any slide; AD-22 makes free canvas General's alone.**
*"**Any** ordered-registry slide may insert zero or more catalog placeholders as canvas elements."* AD-22: *"**`general` is free canvas**… The row's placeholder set and its SDAH slot binding are server-defined: nothing may be added, removed or rebound, and the validator refuses it on every write path (AD-15)."* AD-19 likewise: a placeholder *"becomes an element inserted onto a General"*. The companion also contradicts **itself** — `:34` says *"SongSet / Announcement have no placeholder insert"* — so a builder reading `:8` builds the insert affordance and a builder reading `:34` builds the refusal. Not covered by the open Gap 4 item, which addresses only `:15` key spelling.
*Fix — companion-owned (`placeholder-catalog.md`), via `bmad-spec` Update:* change `:8` to "Any **General** row may insert…" and cite AD-22. Fold into the Gap 4 pass.

**F-8 — AD-4 asserts production is running; the PRD says nothing is, and AD-18/AD-21's licences hinge on that.**
AD-4: *"Production **runs** as one Docker/standalone unit on the home-PC LiveServer (`presenter.example.church` via Cloudflare Tunnel)."* `prd.md:540`: *"Production topology (**target, not yet deployed** — corrected 2026-07-29 by the owner; the deployment tooling exists and is configured, **nothing is running**)… **Read every "production" reference in the artifact set against this**: there is no live database, no live projector, and no Sabbath currently depending on this system."* This is not cosmetic: AD-18 grants Epic 20 a total-replacement licence *"**Until first deploy** no production rows exist"* and AD-21 freezes *"a released version"*. Read against AD-4's present tense, the licence Epic 20's cheapest path depends on has already expired.
*Fix — spine-owned:* restate AD-4 in the target voice the PRD requires ("Production is deployed as…"), and add one clause recording that no deployment exists as of 2026-07-30, so AD-18's waiver and AD-21's freeze have a dated anchor instead of an inferred one.

**F-9 — `stories/3-1-core-presentation-generation-pptx.md:36` inverts the decision it cites.**
*"Web-First Presentation with PPTX Export Fallback (AD-1) is satisfied by producing this offline artifact."* AD-1 says the opposite: *"**PPTX download remains primary** for venue reliability"* and in-browser surfaces are *"**not** the hard offline Sabbath guarantee."* NFR-1 calls the PPTX *"the guarantee that protects the Sabbath."* The story is `done`, so nothing ships from it today — but it is the only story file for the PPTX generator and it teaches the inversion to anyone who opens it.
*Fix — companion-owned (story file):* one-line correction to AD-1's actual name and direction. Mechanical.

**F-10 — `spec-slide-artifact-model` CAP-8 requires a base type AD-19 abolished.**
CAP-8 success: *"…and `BibleVerseContemplation` remains a **TextPlaceholder** whether it uses its standing default or a weekly override."* AD-19: *"`text-placeholder`, `image-placeholder`, `mix-placeholder` and `fullscreen-image` are **gone rather than renamed**."* The spec's supersession note names CAP-2 as the seven-base-type casualty and not CAP-8, so CAP-8 reads as surviving. `deferred-work.md:83` compounds it by recording that `welcome` *"changed `baseType` `general` → `text-placeholder`"* as current state.
*Fix — companion-owned (`spec-slide-artifact-model/SPEC.md`), same `bmad-spec` pass as F-4:* extend the supersession note to CAP-8 and state the successor — a General carrying a Placeholder Catalog text element.

**F-11 — the spine routes two affordance questions to `EXPERIENCE.md`, which carries neither.**
The stale-snapshot affordance (*"AD-16 makes staleness possible by design and therefore makes the state real; it does not decide the affordance"*) and Reset-reverts-a-rename. `EXPERIENCE.md` *Open Items* has four items and neither is among them. A handoff no receiver acknowledges is how the four artifact families the `AGENTS.md` gate names drifted in the first place.
*Fix — companion-owned (`EXPERIENCE.md`), same `bmad-ux` pass as F-2:* add both as Open Items with owning story keys (20.8 and 20.3 are the natural homes). The spine's job here is only to report that the handoff was not received.

**F-12 — AD-20 removes the three liturgical songs from the mechanism that enforces NFR-3, and no document owns the consequence.**
`prd.md:550` makes NFR-3 *"Binding on FR-20 registry edits too — moving layout into data does not relax this"*, and NFR-3 names FR-5's splitting rules as the mechanism. AD-20 turns `#671`, `#684` and *We Have This Hope* into hand-authored General entries; the spine's *Deferred* records honestly that *"their lyrics become canvas text, so they stop passing through the FR-5 verse/Reff splitter"* — and then names only the corrections-tracking and licence consequences, not the readability one. `epics.md:52` already records NFR-3 as owned by nobody ("**None.** No epic and no UX artifact owns…"). AD-20 makes an unowned NFR measurably weaker for three specific slides.
*Fix — spine-owned:* extend the AD-20 *Deferred* bullet to name NFR-3 explicitly and state who checks lyric readability on a hand-authored General (Story 20.1's seed review is the only candidate). One sentence; the point is that the cost is recorded where AD-20 is read.

### MEDIUM

**F-13 — the `binds:` frontmatter under-specifies NFRs and cites one by prose.**
`binds:` carries *"NFR offline-Sabbath reliability"* where PRD §10 has `NFR-1`. `prd.md:546` records that the ids exist precisely because prose NFRs could not be cited. NFR-2 (generation ≤5 min), NFR-3 (readability) and NFR-7 (font licensing/availability) have no AD and no *Deferred* entry; the Stack table names no font at all, while `epics.md:56` flags Story 7-4's Arial as not freely licensed.
*Fix — spine-owned:* change the binding to `NFR-1`; add `NFR-6` (AD-5 governs it today); add one *Deferred* line for NFR-2/NFR-3/NFR-7 stating the spine fixes no performance, readability or font invariant at this altitude.

**F-14 — the canvas editor's path is wrong in two places, including the row where AD-13 is the governing decision.**
CAP-3's *Lives in* and the Epic 16 row *"Canvas editor boundary | `src/components/artifacts/` | AD-13"* both point at a directory containing only `ArtifactSlide.tsx`. The editor is `src/components/admin/ArtifactEditor.tsx` — which the spine's own *Deferred* cites correctly as `ArtifactEditor.tsx:104`. The Structural Seed at `:250` omits `admin/` entirely.
*Fix — spine-owned:* `src/components/admin/` in both rows; add `admin/` to the Structural Seed alongside `artifacts/` and `ui/`.

**F-15 — `docs/architecture.md`, a declared spine `source`, contradicts AD-4 and AD-5 and predates AD-11..AD-22.**
`:79` asserts *"middleware restrictions"* and the file never names `src/proxy.ts`, which AD-5 makes THE gate and explicitly forbids reverting to `middleware.ts`. `:32` hardcodes *"Connects to `data.db`"* against AD-4's `DB_PATH`. `:3` and `:9` name the project `bic-pptx-workflow` — the repository `AGENTS.md` declares **frozen**. `:61` hardcodes a crossfade (see F-5). Nothing about the registry, snapshots, or the request gate appears. It is reachable from `docs/index.md`.
*Fix — split.* **Spine-owned:** drop it from `sources:` or mark it superseded there. **Companion-owned:** either refresh `docs/architecture.md` against AD-4/AD-5/AD-11..AD-22 or add a header pointing at the spine as the authority.

**F-16 — `sprint-status.yaml:196-199` still blocks Story 20.8 on a spine that no longer exists.**
The comment tells a reader Story 20.8 must wait for *"the epic-16 architecture spine"* to carry a superseding AD. AD-16 landed; the folder holds no spine. The action item at `:302` knows; the comment block a sprint reader hits first does not.
*Fix — companion-owned (`sprint-status.yaml`):* replace with the current state — AD-16 recorded, only the `EXPERIENCE.md` reconciliation outstanding — and cite the one spine's path.

**F-17 — `epics.md:373` records four of the seven decisions that landed on 2026-07-30.**
It names AD-16, AD-17, AD-18, AD-19. AD-20, AD-21 and AD-22 also landed that day. Consequences: Story 20.4 (CAP-3) cites only AD-15 where **AD-22** is what makes "General only" an invariant; Story 20.7 (CAP-8) cites only AD-19 where AD-22 fixes the bounded surface's exact extent; no story anywhere cites AD-21 before writing a migration, which AD-21 requires.
*Fix — companion-owned (`epics.md`):* extend `:373` to seven decisions; add AD-22 to Stories 20.4 and 20.7 and AD-21 to Story 20.2.

**F-18 — AD-21 has no owning story and no epic or sprint entry.**
The spine admits this (*"AD-21's counter does not exist yet, and no story owns introducing it… Deferred as sequencing, not as an open question"*) and says it arrives with Epic 20's first release. Neither `epics.md` Epic 20 nor `sprint-status.yaml` mentions the counter, the compaction into production data version 1, or the retirement of `artifact_seed_hash_backfilled`. An invariant every future migration must obey, with no landing site, is how AD-14-vs-CAP-6 sat unrecorded for weeks.
*Fix — companion-owned (`epics.md`, `sprint-status.yaml`):* add the counter to Story 20.2's scope or open Story 20.9, and record it as an action item so the sequencing claim has a tracker.

**F-19 — CAP-5's `[kind] label` display form is governed by neither the spine nor `EXPERIENCE.md`.**
For a `songset-bt-open` row, does the chip read `[song-set]` or `[songset-bt-open]`? AD-19 implies the kind but does not say it; `EXPERIENCE.md` owns display and does not mention badges for registry rows at all. `sprint-status.yaml:314` has this routed and `open`. Also absorbs `spec-slide-artifact-model` CAP-5, which has no AD anywhere.
*Fix — companion-owned (`EXPERIENCE.md`), same `bmad-ux` pass as F-2:* decide the chip text. Optionally one clarifying clause in AD-19 that the kind, never the slot identity, is the operator-facing token.

**F-20 — CAP-7's "no canvas editor for the Announcement entry" cites no AD in the map.**
AD-22's third clause fixes it. The table states *"a capability with no governing decision is a hole, and this table is where it shows"*, so a half-cited row reads as a half-covered capability.
*Fix — spine-owned:* add AD-22 to the CAP-7 row.

**F-21 — three incompatible accounts of the seeding mechanism are live simultaneously.**
`deferred-work.md:83` "missing-only by design"; `sprint-status.yaml` epic-16 item "now self-heals at startup"; AD-17 "bootstrap from zero only". The spine anticipates retiring (2) but not that (1) exists.
*Fix — companion-owned (`deferred-work.md`):* mark `:83` superseded by AD-17 and state the surviving path (explicit Reset per template, per AD-11).

**F-22 — `AGENTS.md:113` calls the folded folder "only the run record"; the spine makes it load-bearing.**
Spine `:56`: AD-11..AD-19's reasoning and declined alternatives exist **only** in `../architecture-epic-16/.memlog.md`, and *"A resume that reads only this memlog will not find them."* "Only the run record" reads as archival, and a future tidy-up licensed by that phrasing would destroy the rationale for nine of 22 live decisions.
*Fix — companion-owned (`AGENTS.md` + its two mirrors `.agents/AGENTS.md`, `.cursorrules`, which the file's own sync rule requires stay identical):* say the folder keeps the run record **and is the record of record for why AD-11..AD-19 were decided**.

**F-23 — `binds: epic-1..epic-20` over-claims: Epic 17 has no AD and no *Deferred* entry.**
Epic 17 (dark mode, `muted-foreground` contrast, app metadata, canvas dirty-state guard) is entirely `DESIGN.md`/`EXPERIENCE.md` territory. That is the right owner; the problem is the spine claiming to bind it.
*Fix — spine-owned:* one *Deferred* line stating that operator-chrome visual identity (Epic 17) is `DESIGN.md`-governed and the spine fixes no invariant over it — the same move the spine already makes for canvas UI layout.

**F-24 — `authoring-boundaries.md` understates AD-22 and overstates who reads the snapshot.**
`:9` gives the registry *"SongSet **backgrounds**"* without AD-22's exact extent (two images — one title, one lyric shared by verse and refrain — plus font style and font size). `:36` says *"Presenter / PPTX for a service always read that service's snapshot"*, where AD-12 and AD-16 both require that only `buildSlidePlan` reads it and *"no renderer reads a snapshot directly."*
*Fix — companion-owned (`authoring-boundaries.md`), same Gap 4 pass:* state the two-background + font-style/size extent and cite AD-22; reword `:36` to route through the plan.

**F-25 — `slide-kinds.md:34` leaves announcement membership per-service; AD-16 keeps it live and global.**
*"managed only in **Announcements** menu/list **for that service** (or global list per existing product rules)"*. AD-16: *"**Announcement membership is not cloned:** the Announcements master list stays live and reaches an existing service at render time (CAP-7)."*
*Fix — companion-owned (`slide-kinds.md`), same Gap 4 pass:* drop "for that service" and cite AD-16.

**F-26 — the Structural Seed's `src/lib/` enumeration omits shipped modules the spine reasons about.**
Missing: `transitions.ts` (F-5), `announcements.ts` (cited by CAP-7), `services/`, `artifacts/`, `remote-image.ts`, `settings.ts` (where AD-17's marker and AD-21's counter live), `pptx-cache.ts` (AD-4's PPTX cache). A seed need not be exhaustive, but four of these are the physical home of a named decision.
*Fix — spine-owned:* add `transitions`, `announcements`, `services/`, `settings` at minimum.

### LOW

**F-27 — "Multi-Church Configuration" is deferred in the spine and appears nowhere else in the corpus.** No PRD out-of-scope entry, no epic, no `deferred-work.md` line. Harmless, but it is a deferral of something no requirement asked for.
*Fix — spine-owned:* keep it and note it originates from the brief, or drop it.

**F-28 — `DESIGN.md:80` attributes slide existence and order to AD-7 + `slide-kinds.md`.** AD-20 (every slide originates from an ordered registry entry) and AD-16 (the plan reads the snapshot) now co-own it.
*Fix — companion-owned (`DESIGN.md`), same `bmad-ux` pass:* add AD-20 and AD-16.

**F-29 — `companions:` omits `architecture-epic-16/SUPERSEDED.md`.** That tombstone carries the reverse AD map (`SUPERSEDED.md:38-46`) and is how an old citation resolves from the child end — which the spine's `:40` explicitly relies on ("AD map published in this spine AND in the epic-16 tombstone").
*Fix — spine-owned:* add it beside the memlog and case study.

**F-30 — `epics.md:58-62` lists three of 22 decisions under "Architecture Decisions".** AD-1, AD-2, AD-3 with paraphrases; AD-1's paraphrase ("web slideshow is Phase 2") also predates FR-15 shipping, which the same file's coverage map marks Done at `:89`.
*Fix — companion-owned (`epics.md`):* replace the three-item list with a pointer to the spine, or complete it.

---

## What is genuinely strong

Stated because a review that reports only defects misrepresents the artifact.

- **The AD map does its job.** All ten mappings are internally consistent, every renumbered heading carries its former identity inline, and the spine names the specific hazard the merge removed (`AD-6` and `AD-9` each meaning two things depending on which document you read). No citation anywhere in the corpus resolves above AD-22.
- **Every code anchor in *Deferred* is exact.** `artifact_seed_hash_backfilled` at `src/lib/db/index.ts:13`; `READ_ONLY_BASE_TYPES` at `ArtifactEditor.tsx:104` and `store.ts:226`; `RegistryStaleError`/`expectedUpdatedAt` in `store.ts`; and `tests/registry-reseed.test.mjs:337` — *"a missing row is inserted with its seed hash recorded"* — is precisely the assertion the spine instructs be **inverted, not deleted**. That instruction is the single most valuable sentence in the *Deferred* list.
- **The supersession discipline is unusually precise.** AD-16 supersedes one clause of AD-14 and says which; AD-17 one clause of AD-11; AD-21 the mechanism clause of AD-18 and nothing else. Each superseded AD carries the reciprocal note at its own heading, so a reader arriving at either end learns the same thing.
- **`project-context.md` and `stories/16-1` are the corpus's best-behaved citers** — five and four sites respectively, all exact, with `16-1:26` volunteering the renumber note unprompted. They are the model the four files in F-6 should be brought up to.
- **The AD-9 / AD-18 / AD-21 boundary** — schema shape vs. persisted value vs. version accounting, with each decision explicitly refusing to license the others' mechanism — is the clearest three-way division in the document.
