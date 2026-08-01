---
title: Sprint Change Proposal — Scripture Input Is Scoped, Not Generous
date: 2026-08-01
run: third Correct Course of 2026-08-01 (after `-2026-08-01.md` and `-2026-08-01-locale.md`)
trigger: owner direction, raised after the architecture Update shipped and before PR #16 merged
scope_classification: Moderate
status: approved
approved_by: kodesh87
approved_date: 2026-08-01
---

# Sprint Change Proposal — Scripture Input Is Scoped, Not Generous

## 1. Issue Summary

**What triggered this.** Not a story that failed in implementation. An **owner direction that
reverses a testable consequence of FR-24**, which had been committed hours earlier the same day
and had already been built into an architecture decision.

The direction, as given: **KJV is an English corpus and TB an Indonesian one.** An operator
searching inside KJV types English (`1 Kings`); inside TB they type Indonesian (`1 Raja-raja`).
Book names are used **exactly as the corpus spells them** — no cross-language search on an
operator surface, no special handling for three-word names, no alias dictionary. Input becomes
autocomplete over the chosen translation's names.

**Why it was routed rather than absorbed.** The preceding `bmad-architecture` Update run
recorded this direction in its memlog and marked it `ROUTED` instead of amending the spine with
it. That was correct and is worth restating, because it is the discipline that made this run
cheap: the direction reverses a **PRD** consequence, and putting an architecture decision ahead
of its own source is the failure the architecture memlog repeatedly records. The spine stayed
consistent with the PRD as it stood; this proposal changes the PRD first.

**What it contradicts, precisely.** FR-24 shipped this consequence:

> **Input is generous, output is exact.** Typing `Kejadian` or `Genesis` searches book names
> across **all** installed translations and resolves to one canonical book identity […]

and AD-27 `[TARGET]` was written against it hours later, carrying an *input tolerance* clause
that assumes one matcher shared uniformly by every translation.

**Evidence, measured against shipped code rather than read from documents (2026-08-01):**

| Claim | Site | Verified |
|---|---|---|
| Reference regex caps a book name at two words, ASCII only, no hyphen | `src/lib/scripture.ts:42` | `[A-Za-z]+(?:\s+[A-Za-z]+)?` |
| The **same rule has a second implementation** | `src/lib/parser.ts:152` and `:162` | identical pattern, twice |
| The alias map it must replace | `src/lib/scripture.ts:65` | `BOOK_ALIASES`, 6 entries |
| `shortName` reaches six sites incl. a schema column | `corpus.ts:27/108/134`, `db/index.ts:227` (written `:100-117`), `scripture.ts:87-88`, `verify-corpora.mjs:71`, `tests/scripture.test.mjs:40` | all present |
| The autocomplete precedent the owner named exists | `src/components/HymnNumberAutocomplete.tsx` | 4 mounts in `CreateForm.tsx`, 4 in `EditForm.tsx` |
| No proxy change needed for a suggestion endpoint | `src/proxy.ts:101` | exclusions are `api/webhook`, `api/auth/login`, `api/auth/logout`, `login`, `_next/*`, `favicon.ico`, `assets` — `/api/scripture` and `/api/hymns` are gated by default |

**Four owner answers that collapse into one mechanism** — which is why the owner's choice on
input beat the recommendation. A single field with inline autocomplete still has to find where
the book name ends, but it does so by **longest-prefix match against corpus-supplied names**
rather than by a regex guessing shape. So `Kisah Para Rasul 1:8` and `1 Raja-raja 3:5` both
work, **the two-word cap and the hyphen stop being concepts**, and paste survives. The rundown
split is fixed the same way. Both surfaces are **one matcher differing only in scope**. The
recommended book-picker would have needed a second, different mechanism for the rundown; the
single field needs none.

## 2. Impact Analysis

### Epic impact

| Epic | Impact |
|---|---|
| **Epic 21** | Affected, not invalidated. Story 21.4 changes shape and narrows to the server half; **Story 21.5 is new**. Story 21.1 (`done`) is untouched; 21.2 and 21.3 are untouched. |
| **Epics 22, 24** | `N/A`. The song-book locale half and UI Locale do not touch reference input. |
| **Epics 2 / 5** | **Affected and previously unnamed.** "One matcher" reaches `src/lib/parser.ts`, which belongs to the rundown parser epics, not to Epic 21. |

No epic is obsolete, no new epic is needed, and epic order is unchanged.

### Story impact

- **21.4 — rewritten.** Acceptance criteria replaced; scope narrowed to data, schema and matcher.
- **21.5 — added.** The operator input surface, client-side only.
- The cut is deliberate: 21.4 is entirely server, 21.5 entirely client, and the contact point is
  the matcher's suggestion endpoint — **append-shaped**, the same discipline `default_data_locale`
  already uses between Stories 21.3 and 22.3, so the two can run in separate worktrees.

### Artifact conflicts

| Artifact | Conflict | Handled |
|---|---|---|
| `prd.md` §4.12 FR-24 | *Input is generous* consequence reversed | **This proposal** — superseded in writing |
| `prd.md` FR-22 cross-reference | pointed at the reversed clause | **This proposal** |
| `epics.md` Story 21.4 | AC written against the reversed clause | **This proposal** |
| `sprint-status.yaml` | story notes, new story, new action items | **This proposal** |
| `ARCHITECTURE-SPINE.md` AD-27 | *input is generous* clause; tolerance list; `shortName` | **Routed** — `bmad-architecture` Update, new **AD-28**, never renumber |
| `EXPERIENCE.md:97` | new component in the inventory | **Routed** — folded into the open `bmad-ux` item as clause (3) |

### Technical impact

- **One rule currently has two implementations** (`scripture.ts:42`, `parser.ts:152`/`:162`),
  which the spine's *Boundaries* convention forbids. The one-matcher rule closes it.
- **`shortName` is a schema change** (`bible_books.short_name`). Under AD-25 a corpus table is a
  projection of its committed file, so this is a **rebuild, not a migration** — and AD-4 records
  that no deployment exists, so it is free today and stops being free at first deploy.
- **No `src/proxy.ts` change**, verified above. Stated explicitly because AD-5 makes that regex
  the authorization boundary and a new endpoint is exactly when someone reaches for it.

### The finding this run added

The owner's answer on rundown abbreviations (*the matcher may hold a small alias list*) is
**consistent** with the direction's "no alias dictionary" — that prohibition was about
*corpus-owned, cross-language* naming — but it forces a clause of AD-27 apart.

AD-27 enumerates tolerance as *"case, punctuation, abbreviation, singular against plural"* and
calls it **one matcher shared by every translation**. Three of those four are language-free.
**Abbreviation is not.** `Jn` is English tolerance. An unscoped alias list therefore reintroduces
cross-language input **through the matcher instead of through the corpus** — the door AD-27 was
watching, entered from the other side.

So: **an alias belongs to a translation; a comparison rule does not.** And where two
translations' tolerance collides in rundown scope, the reference is **refused as unmapped input
(NFR-5), never guessed** — the fail-closed posture AD-5, AD-8 and AD-17 already take.

## 3. Recommended Approach

**Option 1 — Direct Adjustment.** Effort **Low**, risk **Low**.

**Rationale.** What shipped on 2026-08-01 for FR-24 was **documents**. Story 21.4 is `backlog`
and **no application code was written against the reversed clause** — so there is nothing to
roll back, and the reversal costs one PRD consequence, one story rewrite and one new story.

- **Option 2 (Rollback)** — *not viable, and not needed.* Rolling back PR #16 would also discard
  AD-25, AD-26, the `locale` spelling decision, the `Song of Solomon` corpus finding and the
  parser measurements, **all of which survive this reversal intact**. The direction invalidates
  one clause, not the run.
- **Option 3 (MVP Review)** — *not viable.* MVP is unaffected. FR-24 still ships; its input half
  gets simpler, not larger. Scoped matching is **less** work than cross-translation resolution.

**Timeline impact: none, and arguably negative.** The single field removes the two-word cap, the
hyphen case and the picker's separate rundown mechanism from the work, replacing three problems
with one matcher.

## 4. Detailed Change Proposals

### PRD — `prd-bic-pptx-workflow-2026-07-10/prd.md`

**§4.12 FR-24 consequences.** The *"Input is generous, output is exact"* bullet is replaced by
three: **input is scoped** (with the supersession stated in writing, because it was a testable
consequence something may already have been built against); **the rundown is the one surface
matching every installed translation**, same matcher, different scope; and **tolerance belongs
to the matcher and carries a language**, with the collision rule.

**FR-22 cross-reference.** *"Input is separately generous — see FR-24."* → *"Input is scoped to
that same translation — see FR-24."*

### Epics — `epics.md`

**Story 21.4** — AC replaced with seven criteria: input scoped; output exact (unchanged); one
matcher two scopes; longest-prefix match replacing the regex; translation-owned non-prefix
aliases with the `Kej`-under-KJV counter-example; `shortName` dropped across six named sites;
and the retirement stated as a **replacement that crosses an epic boundary**.

The *"Settled 2026-08-01"* block is **kept intact** and given an amendment note — the corpus
correction, the two parser limits and the *"a matcher, not a widened regex"* sizing all survive,
and the owner's own answer independently confirms the last of them.

**Story 21.5 — new.** One field with inline autocomplete, every operator surface, on the
`HymnNumberAutocomplete` precedent including its debounce / cache / in-flight-dedup mechanics.

**Epic 21 heading** and **frontmatter `stepsCompleted`** updated.

### Sprint status — `sprint-status.yaml`

Story 21.4 note carries the supersession; `21-5-one-field-inline-autocomplete: backlog` added;
one new `bmad-architecture` action item (AD-28, with all five points it must settle); clause (3)
appended to the open `bmad-ux` EXPERIENCE.md item.

### Routed, not made here

- **`bmad-architecture` Update → AD-28.** `AGENTS.md` assigns structural invariants to the spine
  and forbids renumbering, and Correct Course does not amend the spine.
- **`bmad-ux` Update → `EXPERIENCE.md`.** Component inventory row; no route change, so the IA
  table is untouched by this item alone.

## 5. Implementation Handoff

**Scope classification: Moderate** — backlog reorganization plus two routed artifact runs. Not
Minor (a story was added and an AD is owed); not Major (no replan, no MVP change, no epic
resequencing).

| Recipient | Responsibility |
|---|---|
| **Architect** (`bmad-architecture` Update) | Add **AD-28**. Settle the five points in the action item. Do not renumber; do not re-litigate what survives of AD-27. **Blocks Story 21.4.** |
| **UX** (`bmad-ux` Update) | `EXPERIENCE.md` — three clauses now queued against that one file; take them in one run. **Does not block 21.4.** |
| **Developer** (`bmad-create-story` → `bmad-dev-story`) | Story 21.4 after AD-28 lands, then Story 21.5. Separate worktrees. |

**Sequencing.** AD-28 → Story 21.4 (server: corpus, schema, matcher, both call sites) → Story
21.5 (client: the field). The UX run is parallel and blocks nothing.

**Success criteria.**

1. An operator under KJV types `1 Kings` and it resolves; types `1 Raja-raja` and it does not.
2. `Kisah Para Rasul 1:8` and `1 Raja-raja 3:5` parse — the cap and the hyphen are gone.
3. `Kej` does not resolve while KJV is chosen.
4. A rundown reference is matched against every installed translation, and an ambiguous one is
   surfaced as unmapped rather than guessed.
5. **One matcher.** No regex survives at `scripture.ts:42` or `parser.ts:152`/`:162`.
6. `shortName` is absent from all six sites, and `Ps` still reaches Psalms through autocomplete.

**Open, and deliberately not decided here:** how large the per-translation alias list should be
for English. Prefix matching covers most of it; the residue is `Jn`, `Mt` and their kind. Sizing
belongs to Story 21.4, which is where the list gets written and tested.
