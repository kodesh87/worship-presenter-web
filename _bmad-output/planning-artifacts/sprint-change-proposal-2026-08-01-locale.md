---
date: '2026-08-01'
skill: bmad-correct-course
mode: batch
scope_classification: Moderate
triggered_by: 'Owner request — make locale a first-class dimension for corpora, and add UI internationalisation. Raised immediately after PR #13 shipped the shipped-corpus work'
supersedes_nothing: 'This is the SECOND Correct Course of 2026-08-01. It does not re-litigate sprint-change-proposal-2026-08-01.md — that pass settled several translations / several song books with a default. It said nothing about language as a browsable axis or about UI language, and neither had an FR'
artifacts_modified:
  - _bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/stories/21-1-verse-database-ships.md
  - _bmad-output/implementation-artifacts/stories/22-1-song-book-ships-with-book-code.md
  - _bmad-output/project-context.md
routed_out:
  - 'bmad-architecture Update — scope WIDENED; extends the still-open epic-22 item, settle both in one run'
  - 'bmad-ux Update — EXPERIENCE.md:143 now stale in two ways, plus two new UX surfaces'
epics_opened: [24]
epics_amended: [21, 22, 23]
frs_added: [FR-24, FR-25]
frs_amended: [FR-22, FR-23]
stories_added: ['21.4', '24.1', '24.2']
stories_superseded_in_writing: ['21.1', '22.1']
---

# Sprint Change Proposal — 2026-08-01 (locale)

Language becomes two explicit axes. **FR-24** (Data Locale) and **FR-25** (UI
Locale), one new epic, three amended.

The second Correct Course in one day. That is unusual enough to state plainly:
the first pass closed the shipped-corpus gap and committed FR-22 / FR-23 that
morning; PR #13 shipped it; and the owner then asked for something the morning's
pass had not covered and could not have — **language**.

---

## 1. Issue Summary

**A requirement that was settled at half its size.** FR-22 and FR-23 made the two
reference corpora *one of several*. Committed at 09:xx, shipped by PR #13, and
correct as far as it went.

What it did not say is that the corpora anyone would actually install alongside
KJV and SDAH are **in another language**. A list of translations with no language
attribute is a list an Operator has to already know their way around — and the
concrete case the owner named, *an Indonesian service that sings one English
hymn*, is not expressible in what shipped.

Separately and at a different layer: the operator interface is monolingual, and
nothing anywhere records that as a gap.

**Neither had a requirement, an epic, or an owner.** That is the trigger.

### What already shipped, and is assumed on `main`

Stories 21.1, 22.1, 22.2 `done`, plus Story 23.2's documentation criterion. The
corpus at `data/bible/kjv.json` (66 books / 1,189 chapters / 31,102 verses,
seeded from zero on first boot, never overwriting a populated translation);
`data/song-book/sdah.json` (695 hymns, all titles replaced from the owner's
index); `hymns` rebuilt as `UNIQUE(book_code, number)`; `import:kjv` /
`import:hymnal` retired in favour of `npm run corpus:verify`; 398 tests green.

The owner intends to merge PR #13 as-is and treat this pass as follow-on work.

### Owner decisions carried in as settled

Ten, listed here so a future reader can see they were decided rather than
inferred, and so no later pass re-opens them: the `song-book` /
`bible-translation` terminology; the `data/<locale>/…` paths; **exactly two
locales**, with `projection_locale` **rejected**; the default filtering the view
and never the query; reference display following the chosen translation; book
names shipping inside the translation; UI i18n as a separate epic; the four
settings keys; keeping the `hymns` table, `/api/hymns` and the `resolvedHymns` /
`failedHymnNumbers` webhook fields; and the four contradictory SDAH titles
(#81, #231, #234, #356) **explicitly dropped**.

---

## 2. Impact Analysis

### Epic impact — and the one place this pass departed from its own brief

The handoff brief specified **two new epics**: one for the corpora locale axis,
one for UI locale. Working the checklist surfaced a problem with the first half.

**The corpora epic would have collided with three open backlog stories.** Stories
21.2 (*Translation Is a Parameter*), 21.3 (*A Default Translation…*) and 22.3
(*A Default Song Book, and a Per-Song Override*) already own precisely the
"parameterise, default, override" surface the new epic was scoped to take. Worse,
a single corpora epic must touch **`bible_verses` and `hymns` both** — which is
exactly what the per-family cut of that morning exists to prevent, and the brief
itself asked to preserve (*"keep epics in separate worktrees, contact points
append-shaped, per the 2026-08-01 cut"*).

**Raised with the owner, who chose to amend rather than open.** FR-24 is
therefore delivered by **amending Epics 21 and 22** — each corpus family already
owns its own table, file and read paths, so the axis rides the epic that owns the
data. Only **Epic 24** (UI Locale) is new.

| | Brief's shape | Delivered shape |
|---|---|---|
| FR-24 (data locale) | new Epic 24 | **Epics 21 + 22, amended** |
| FR-25 (ui locale) | new Epic 25 | **Epic 24** (next free number; nothing is skipped) |
| Tables owned per epic | Epic 24 → both families | 21 → `bible_*`, 22 → `hymns`, 24 → none |
| Worktree collision | Epic 24 vs 21 and 22 | **none** |

One consequence worth stating: the option's preview numbered the UI epic **25**,
with 24 reserved for the corpora epic. That epic was not opened, so the UI epic
takes **24** and no number is left as an unexplained hole.

**Epic 23 is affected, mildly.** Story 23.2's documentation criterion greps for
`data/hymns.json`; the rule now also has to cover `data/bible/` and
`data/song-book/`. The criterion form survived the amendment — which is the
argument for writing criteria instead of line lists, demonstrated on itself
within a day.

No epic is invalidated. **No rollback is in scope**: nothing was built wrong, and
the two `done` stories shipped correctly against the requirement as it stood.

### Artifact conflicts

| Artifact | Conflict | Disposition |
|---|---|---|
| **PRD** | §4.11 settled *several* without a language attribute; FR-22/FR-23 had no locale clause; the glossary and §13 locked the old corpus paths; no non-goal covered locale-driven rendering | New **§4.12** (FR-24, FR-25); FR-22 and FR-23 **amended, not rewritten**; two glossary paths amended with their supersession noted inline; two new §13 nouns (Data Locale, UI Locale); two new non-goals; a §6 decision-record entry, written on the day per that section's own practice |
| **`epics.md`** | No FR-24/FR-25 in the inventory or coverage map; Epics 21/22 silent on locale; **"Seven read sites"** followed by a list of eight | Inventory and coverage map extended; Epics 21, 22, 23 amended; Story 21.4 added; **Epic 24** added; the count corrected — see §4 |
| **Stories 21.1 / 22.1** *(both `done`)* | Their ACs name `data/bible/kjv.json`, `data/song-book/sdah.json` and `book_code` | **Superseded in writing**, in the story files themselves, with the original criteria left standing unedited as the record of what shipped. Not rewritten |
| **Architecture spine** | The six-table target shape, per-translation book names, a canonical book identity and three renames have no AD | **Routed out**, not decided here. `bmad-architecture` Update — **scope widened**, extends the already-open epic-22 item; settle both in one run |
| **UX (`EXPERIENCE.md`)** | `:143` was already stale from the morning's pass; FR-24's locale-browse control and FR-25's switcher are UX surfaces no artifact describes | **Routed out.** `bmad-ux` Update — now two things, one run |
| **`project-context.md`** | Records the corpus paths as a runtime rule agents must follow | Amended: new paths, `corpus.ts` named as their single owner, plus a new bullet stating the two-axis rule and the never-filter rule |

### Technical impact

Measured in this worktree on 2026-08-01, not inherited:

- **No i18n infrastructure exists.** `lang="en"` at `src/app/layout.tsx:31` is the
  entirety of it.
- **The UI surface is small:** 39 `.tsx` files, **26** client components, ~55
  user-facing JSX/attribute literals, ~158 `src/lib` and `src/app/api` messages
  (many developer-facing). **Estimate 100–150 real strings.**
- **The path move is two functions.** `src/lib/corpus.ts` is the single owner of
  both corpus paths (`bibleCorpusPath`, `songBookCorpusPath`), documented in its
  own header. This was not in the brief and it materially shrinks Stories 21.2 and
  22.3.
- **The `'KJV'` literal survives at four sites** in `src/lib/scripture.ts` (`:6`,
  `:106`, `:128`, `:144`) plus two importers in `src/app/api/scripture/route.ts`.
- `DEFAULT_TRANSLATION` and `DEFAULT_SONG_BOOK` already exist as constants in
  `corpus.ts`; the four settings keys follow the two shipped precedents in
  `src/lib/settings.ts` (`RETENTION_KEY`, `SLIDE_TRANSITION_KEY`).
- **Projected slide text is already data**, not code — 28 templates in
  `data/default-registry.json`, Admin-editable via FR-20 / Epic 16. This is what
  makes rejecting `projection_locale` coherent rather than a limitation.

---

## 3. Recommended Approach

**Hybrid, weighted to Direct Adjustment.** Amend two epics that already own the
data, open one epic for the layer that has no owner, amend the PRD, and supersede
two `done` stories' criteria in writing.

**Why not one epic for all of language.** FR-24 and FR-25 share a word and nothing
else — no table, no module, no test, no file. Bundling a UI-wide string refactor
into a data-layer epic is the drift pattern `AGENTS.md` names after Epic 14.

**Why not a third epic for FR-24.** Because the data axis is not a thing apart
from the data. Epics 21 and 22 already own their corpus file, their table and
their read paths; a locale epic would have had to reach into both.

| Epic | Owns (data) | Owns (code) | Gate |
|---|---|---|---|
| **21** *(amended)* | `data/<locale>/bible-translation/`, `bible_books`, `bible_verses`, book names | `scripture.ts`, `/api/scripture`, Presenter panel | none |
| **22** *(amended)* | `data/<locale>/song-book/`, `hymns`, `song_books` | `lyrics.ts`, `parser.ts`, `/api/hymns`, hymn seed | 22.3 → Story 20.7 |
| **24** *(new)* | — | string catalogue, 39 `.tsx`, `slide-plan.ts` labels | none |

**Contact points remain append-shaped.** `src/lib/settings.ts` takes one `const`
plus getter/setter per key across three epics, and `admin/page.tsx` one component
each — the same merge surface the morning's cut already accepted. **Nothing
rewrites a line another epic owns.**

**Effort:** Medium. **Risk:** Low for Epic 24 (mechanical, test-only boundaries)
and for the path move; Medium for Stories 21.4 and 22.3, which wait on the
architecture run and on Story 20.7 respectively.

---

## 4. Detailed Change Proposals

Applied in batch, presented here as the record.

**`prd.md`** — new **§4.12** *Language Is Two Axes, Not One*, carrying FR-24 and
FR-25 with testable consequences, the `projection_locale` rejection stated as a
decision, and the one-global-template-set consequence recorded as an **accepted
trade rather than an open item**. §4.11 gains an amendment paragraph. FR-22 gains
two consequences (never-filter; book names follow the translation), FR-23 one
(never-filter, with the Indonesian-service case named). Glossary *Song Book* and
§13 *Verse Database* take the new paths with their supersession noted inline; two
new §13 nouns. Two new §5 non-goals. A §6 decision-record entry.

**`epics.md`** — inventory gains FR-24 / FR-25; coverage map gains both, with
FR-24 recorded against *Epic 21 + Epic 22* and the reasoning for that unusual
shape stated in the row itself. Epics 21, 22, 23 amended; **Story 21.4** (book
names) added; **Epic 24** added with Stories 24.1 and 24.2. Frontmatter takes
`step-08-correct-course-2026-08-01-locale`.

**`sprint-status.yaml`** — `epic-24` plus two story keys; `21-4`; supersession
comments on `21-1` and `22-1`; amendment comments on `21-2`, `21-3`, `22-3`; the
four-SDAH-titles item closed as **`dropped`**; two routed-out action items.

**Story files `21-1` and `22-1`** — a supersession box at the top of each, naming
what moved, what is unaffected, and which story performs the move. Original
criteria untouched.

**`project-context.md`** — new corpus paths with `corpus.ts` named as their single
owner, plus a new rule bullet for the two axes and the never-filter rule.

### Three corrections made against measurement, not inherited

1. **`epics.md` said "Seven read sites" and then listed eight.** Re-counted: the
   *list* was right and only the word was wrong. There are now **nine**
   `FROM hymns` in `src/`, and the ninth is deliberately excluded — `db/index.ts:47`
   is the one-time `INSERT…SELECT` boot migration Story 22.1 introduced, not a read
   path a second book makes ambiguous. Corrected to **Eight**, with that reasoning
   recorded so the next counter does not "fix" it back.
2. **`BOOK_ALIASES` is at `scripture.ts:65`, not `:64`.** The brief's citation had
   already rotted by one line, within hours of being written — which is the brief's
   own warning proving itself.
3. **The `slide-plan.ts` label range was understated.** The brief scoped it to
   `:260-360`; the literals actually run from `:260` to at least `:662` (36
   `title:` / `subtitle:` literals in the file). Story 24.2 must not inherit the
   narrower range.

### Two decisions taken inside the pass, stated so they can be reversed

1. **FR-24 delivered by amendment, not by a new epic** (§2). The owner chose this
   over the brief's two-epic shape once the collision was surfaced.
2. **A stale contradiction in `epics.md` was repaired rather than left.** The FR
   Coverage Map's FR-2 row read `Done` while the note directly beneath it said
   FR-2 had moved to `Partial` — true when written that morning, contradicted by
   Stories 22.1/22.2 landing the same day. Rewritten to record the full
   `Done → Partial → Done` arc. Out of this pass's stated scope, in a table this
   pass was editing anyway; called out here rather than slipped in.

---

## 5. Implementation Handoff

**Scope: Moderate** — backlog reorganisation plus two artifact-owner runs. **No
code was written or proposed for immediate implementation.**

| Recipient | Deliverable |
|---|---|
| **`bmad-architecture` Update** | **One run, two mandates.** The pre-existing one: does a shipped reference corpus keep an every-boot overwrite, or does AD-21's counter arrive here? Plus the stale Structural Seed tree. **New:** two corpus registries carrying `locale`, per-translation book names, a canonical book identity, and the renames `translation`→`translation_code`, `book_code`→`song_book_code`, `isKjvCorpusEmpty()`→`isBibleTranslationEmpty(code)`. **Never renumber an existing `AD-n`.** Still blocks nothing that has started |
| **`bmad-ux` Update** | **One run, two mandates.** `EXPERIENCE.md:143`'s stale State Patterns row, *plus* the locale-browse control and the UI-locale switcher. The never-filter rule is what the picker must make **visible** — an Operator has to be able to see other locales are reachable, or a view-filter reads to them as a data-filter |
| **`bmad-create-story`** | **24.1** and **24.2** (unblocked, no gate). **21.2** then **22.3** — both carry a path move that supersedes a `done` story, so they should not be written casually. **21.4** after the architecture run settles the canonical book identity |
| **`bmad-dev-story` → `bmad-code-review`** | Per story. **Epic 24 and Epic 21 are safe to run in parallel worktrees**; `settings.ts` is the only shared surface and it is append-shaped |

**Success criterion for what this proposal opens:** an Operator preparing an
Indonesian service can pick one English hymn without changing a setting, and read
the hub in Indonesian while doing it — and nothing either of those choices does
reaches the projector.

**Sequencing that must not be reordered:** `bmad-architecture` before Story 21.4.
The canonical book identity is a schema property, and Story 21.4's two
behaviours — generous input, exact output — hang off it.

---

## 6. What This Pass Did Not Do

Recorded because a reader a week from now will otherwise assume it did.

- **It did not decide the schema.** The six tables named in the handoff brief
  appear nowhere in the amended artifacts as DDL. They are routed to
  `bmad-architecture`. Stories say what must be true, not what the table looks
  like.
- **It did not re-open the ten settled decisions**, including the four SDAH
  titles — which are now closed as `dropped` with a *do not re-raise* note, since
  a later pass would otherwise rediscover them as a fresh finding.
- **It did not touch the four SDAH titles, `README-deployment.md`, or the church
  name in `slide-plan.ts:261`.** The last is noted inside Epic 24 precisely
  because Story 24.2 will pass over that line and be tempted.
- **It did not verify PR #13 is merged.** Every amendment describing the shipped
  corpus assumes it, on the owner's instruction.
