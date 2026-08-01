---
date: '2026-08-01'
skill: bmad-correct-course
mode: incremental
scope_classification: Moderate
triggered_by: 'Owner request — the seeder gap (bible + song book + demo data), raised after Epic 12 was already closed'
artifacts_modified:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md
  - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/addendum.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/deferred-work.md
  - _bmad-output/project-context.md
routed_out:
  - 'bmad-architecture Update — no AD governs a shipped reference corpus (BLOCKS Story 22.2)'
  - 'bmad-ux Update — EXPERIENCE.md:143 State Patterns row'
epics_opened: [21, 22, 23]
frs_added: [FR-22, FR-23]
frs_backfilled: [FR-21]
---

# Sprint Change Proposal — 2026-08-01

Epics **21–23** for the shipped-corpus gap. Approved incrementally by the owner,
edit by edit, in one session.

---

## 1. Issue Summary

**A "done" epic whose requirement cannot run.** FR-19 (on-demand Scripture
Display) was delivered by Epic 12 and Story 12.1, both `done`. It does not work
on any fresh clone, and it never has.

The gap was not hidden. It has been recorded since 2026-07-19 in three places at
once — a `Partial` on the FR Coverage Map, an entry in `deferred-work.md`, and
two `Deferred` bullets in the architecture spine (`:364`, `:367`). What none of
those said is how far it went, because each described it as an *ops
inconvenience*. Measured on 2026-08-01, it is not one.

**What the measurement found:**

| Claim | Measured 2026-08-01 |
|---|---|
| *"KJV import remains an ops step"* | `bible_books` / `bible_verses` are created by the startup DDL (`src/lib/db/index.ts:156-171`) and have **no writer at all** outside `scripts/import-kjv.mjs`, which reads the git-ignored `.work/tp_bible_*.json`. A fresh clone ships FR-19's UI, its API route and its empty-corpus message, and no corpus |
| Corpus size, used to argue against committing it | 31,102 KJV verses over 66 books — the canonical count — normalising to **≈4.3 MB**, not the 14.5 MB of the raw export |
| *"Committing the SDAH corpus needs a licence review"* | True, and **incomplete**. `.work/lirik-lagu.json`, the only source `scripts/import-hymnal.mjs` can read, **does not exist anywhere under the project root**. The committed `data/hymns.json` is the last surviving copy, and `npm run import:hymnal` cannot run at all |
| Hymn titles | First lyric lines, **by design** — the source dump had no title column, so `deriveTitle()` takes the first line after a `Verse` header, exactly as `spec-phase1-hymnal-fr4-parser.md:115` instructs. SDAH #522 is stored as *"My hope is built on nothing less"*, whose title is *"The Solid Rock"*. 40 of 695 titles exceed 45 characters. PRD `:120` makes the resolved-title readback the **only** defence against a valid-but-wrong SDAH number, and a readback echoing a lyric line is not a check a human can fail |
| *"multiple song books is a configuration question"* | It is a **schema** question. `hymns.number` is `NOT NULL UNIQUE` (`:106`), globally unique, and every hymnal has a #1 — so a second book cannot be stored. Seven read sites query `hymns` with no book qualifier and all become ambiguous the moment one exists |

Two further things the owner asked for during the session had no requirement, no
epic and no owner: **several Bible translations** and **several Song Books**, each
with a configurable default, and an **opt-in demo seed** so a fresh clone can
show a finished deck.

---

## 2. Impact Analysis

### Epic impact

**Epic 12 cannot host this.** It is `done`. Reopening a closed epic is the exact
contradiction Correct Course closed on Epic 14 on 2026-07-29 — where
`in-progress` disagreed with the tracker's own definition — and the same reason
Story 19.1 was refused a place in the closed Epic 15 on 2026-07-30.

**Epic 20 is affected, favourably.** Spine `:388` records that Story 20.1's seed
work duplicates `data/hymns.json` lyric text and *"touches the open SDAH licence
item"*. Closing that item removes the entanglement, which is why the new epics
are sequenced **ahead** of Epic 20 rather than behind it.

No epic is invalidated. No rollback is in scope — nothing was built wrong; a
corpus was never shipped.

### Artifact conflicts

| Artifact | Conflict | Disposition |
|---|---|---|
| **PRD** | §4.9 and the glossary locked *"developer-provided **KJV-only**"*; FR-2 was *"by SDAH Number"*; two §5 non-goals named KJV and the Hymnal Database; §11 called corpus absence *survivable* as the normal state | Amended at **8 sites** + new §4.11. §6's own practice — *"any future phase or major capability writes its go/no-go here **when the decision is taken**"* — obliged a decision-record entry, and it has one |
| **Architecture spine** | **No AD governs a shipped reference corpus at all.** AD-11/AD-17 cover the registry seed only, while the hymnal is upserted on **every boot** (`db/index.ts:262`), overwriting `title` and `lyrics` — the boot-time value-change channel AD-17 removed for the registry and AD-21 routes through a declared transition *n*→*n+1*. Correcting 695 persisted titles is exactly AD-21's case, and spine `:374` records that **AD-21's counter does not exist and no story owns it**. Also stale: the Structural Seed tree (`:319`, `:326`) | **Routed out**, not decided here. `bmad-architecture` Update, tracked as an action item, **blocking Story 22.2** |
| **UX (`EXPERIENCE.md`)** | `:143` states *"Lookup is unavailable when the corpus was never imported (an ops step)"* as a shipped state. Once the corpus ships, the default flips | **Routed out.** `bmad-ux` Update — one State Patterns row. No route changes, so the IA table is untouched |
| **`project-context.md`** | `:87` **forbade** committing the KJV corpus under `data/` — precisely what Story 21.1 must do. An implementer obeying it would refuse the story | Amended: the rule is reversed and restated as *committed default seed data is a rule, not a permission*, with the public-repo rule it was confused with left intact |
| **Docs** | 13 sites name the old paths or the `.work/` ops step | Assigned to Story 23.2 rather than swept blind now |

### Technical impact

`data/bible/kjv.json` (≈4.3 MB) and `data/song-book/sdah.json` enter the
repository as committed default seed data. `hymns` gains a per-book key. Six
scripture read sites lose a hard-coded `'KJV'`. Two settings surfaces follow the
shipped per-concern pattern. No production deployment exists (confirmed
2026-07-29 and unchanged), which is what makes the schema change cheap.

---

## 3. Recommended Approach

**Hybrid — Direct Adjustment is not available (Epic 12 is closed), Rollback is
vacuous, and the PRD MVP needs amendment rather than reduction.** Three new
epics, a scoped PRD amendment, and two routed artifact obligations.

**The cut is per data family, at the owner's direction, so parallel worktrees
merge cleanly** — each epic owns its feature *and* its data, and no table or
corpus file is touched by two epics.

| Epic | Owns (data) | Owns (code) | Gate |
|---|---|---|---|
| **21** Scripture is on hand, in the translation being read | `data/bible/<code>.json`, `bible_books`, `bible_verses` | `scripture.ts`, `/api/scripture`, Presenter panel | **none** |
| **22** The song book is a choice, and its titles are real | `data/song-book/<code>.json`, `hymns` | `lyrics.ts`, `parser.ts`, `/api/hymns`, hymn seed | 22.2 → `bmad-architecture` Update · 22.3 → Story 20.7 |
| **23** A fresh clone runs | — | `scripts/`, `tests/`, `docs/` | after 21.1 + 22.1 |

**Rationale, including what the first cut got wrong.** The initial proposal put
bible and hymnal in one epic. That made the **whole** epic depend on AD-21's
counter, which does not exist and which nobody owns. Splitting per corpus family
takes that blocker off the critical path: Epic 21 seeds empty tables from zero,
so no persisted value changes and AD-21 does not reach it — **Epic 21 can start
today**. Only Story 22.2's 695 already-persisted titles need the counter.

The four worktree contact points are all **append-shaped**: the `db/index.ts` DDL
block (different regions), `setup.mjs`'s corpus report, `settings.ts` +
`admin/page.tsx` (one component each, following `RetentionSettings` /
`TransitionSettings`), and the three tracking artifacts. Nothing rewrites a line
another epic owns.

**Effort:** Medium. **Risk:** Low for Epic 21 and Stories 22.1/23.x; Medium for
22.2 (needs the architecture decision *and* the owner's title list) and 22.3
(gated on another epic's story).

---

## 4. Detailed Change Proposals

All nine were approved individually. Applied:

**`epics.md`** — three new epic sections with story breakdowns (21.1–21.3,
22.1–22.3, 23.1–23.2); Requirements Inventory gains FR-21 *(backfilled — it has
been in the PRD since 2026-07-30 and absent here since)*, FR-22 and FR-23;
FR Coverage Map updates FR-2 and FR-19 and adds rows for FR-21/22/23; frontmatter
takes `step-07-correct-course-2026-08-01`.

**`prd.md`** — new **§4.11** (FR-22, FR-23, each with testable consequences and a
*what this changes in the earlier FR, recorded once* clause following §4.10's
pattern); §4.9 supersession pointer; two §5 non-goals amended; a §6 decision
record entry; **`Hymnal Database` renamed to `Song Book` throughout**, glossary
entries for Song Book / SDAH Number / Verse Database rewritten, both §11
dependency lines rewritten. **`addendum.md`** — one citation swept.

**`sprint-status.yaml`** — a `last_updated` entry; `epic-21`/`22`/`23` plus eight
story keys, all `backlog`, each carrying its gate as a comment; four action items.

**`deferred-work.md`** — both long-standing entries gain an `owner:` and have
their evidence restated against the 2026-08-01 measurement.

**`project-context.md`** — `:87`'s prohibition reversed.

### Two decisions taken inside the pass, stated so they can be reversed

1. **Point-in-time records were not rewritten by the rename.** `.memlog.md`
   (which the PRD itself calls the canonical audit trail),
   `pressure-test-findings.md` and three readiness reports keep *Hymnal
   Database*. Rewriting a record makes it lie about what was said; the glossary
   carries the rename note so an old citation still resolves. This is the
   disposition the 2026-07-31 `bmad-spec` pass used for stale line citations in
   review records.
2. **`SDAH Number` was kept as a term.** FR-23 generalises it to *number within a
   named Song Book*, recorded once in §4.11, and the glossary says so — but SDAH
   numbering is what every rundown this product reads actually cites.

---

## 5. Implementation Handoff

**Scope: Moderate** — backlog reorganisation plus two artifact-owner runs. No
code was written or proposed for immediate implementation.

| Recipient | Deliverable |
|---|---|
| **Owner (`kodesh87`)** | The **number→title list for 695 SDAH hymns** — Story 22.2 cannot start without it, and nothing in the repository can derive a real title. Plus: authorise the two routed runs below |
| **`bmad-architecture` Update** | The next `AD-n` governing a shipped reference corpus — never renumber. Settles whether the corpora ride the boot upsert or AD-21's counter arrives here. Same run amends the Structural Seed tree (`:319`, `:326`) and clears `Deferred` `:364` + `:367`. **Blocks Story 22.2** |
| **`bmad-ux` Update** | `EXPERIENCE.md:143` State Patterns row. One row; IA table untouched |
| **`bmad-create-story`** | Story files, in this order: **21.1** (unblocked, highest value), then 21.2, 22.1, 21.3, 23.1, 23.2. **22.2** after the architecture run and the title list. **22.3** after Story 20.7 |
| **`bmad-dev-story` → `bmad-code-review`** | Per story. Epic 21 and Epic 22.1 are safe to run in parallel worktrees; the four contact points above are the merge surface |

**Success criteria for the epics this proposal opens:** a clone of this
repository, with no file handed to it and no network access at boot, resolves a
scripture reference, resolves a hymn number to that hymn's real title, and
generates a deck. Story 23.2 asserts exactly that, and it is the story that would
have caught this gap on 2026-07-19.

**Sequencing that must not be reordered:** the `.work/tp_bible_*.json` export is
deleted **after** Story 21.1's completeness assertion is green — 66 books, 1,189
chapters, 31,102 verses — and not before. It is the only copy of the source, and
the song-book corpus is already in exactly the state that ordering exists to
prevent.
