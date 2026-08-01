# Reviewer Gate — Cross-Document Coverage *(ad-hoc lens)*

**Run:** 2026-08-01 architecture Update, AD-28 (scripture input model)
**Why this lens was added:** the gate reference invites ad-hoc lenses as the spine's criticality warrants. This change exists **because** a decision and its source documents diverged — an owner direction reversed a PRD consequence hours after an `AD` was written against it — and `AGENTS.md` names these four artifact families as the ones that drift *"precisely because nothing named them here."* A coverage lens is the one that catches the failure this run is a response to.
**Verdict:** the PRD, `epics.md` and `sprint-status.yaml` all agree with AD-28. **One HIGH finding: two authority documents point at each other for the same open question**, and this run is the one being pointed at.

---

## C1 — HIGH — `epics.md` hands the canonical identity's *shape* to this run; the spine hands it back to the story

`epics.md:518` (Story 21.4), after the acceptance criteria:

> The canonical book identity is what makes *"same passage, another translation"* a single query, so it is a schema property rather than a display convenience. **Its shape is the `bmad-architecture` Update run's to settle, not this story's.**

The spine, in *Deferred*, says the opposite in as many words:

> **Where the two corpus registries and the per-translation book names physically live is a Story 21.2 / 21.4 / 22.3 schema call**, deliberately […] whether the canonical book list is a seeded table or a module constant, are shapes the stories choose.

So Story 21.4 waits for an architecture run to fix the shape; the architecture spine has already declined to, on the stated AD-19 precedent. **A developer opening Story 21.4 after AD-28 lands goes looking in the spine for a shape that is deliberately not there**, and the honest reading of `epics.md` is that the story is still blocked — which it is not.

The spine's position is the correct one at this altitude: a spine fixes invariants, not shapes, and AD-19 set that precedent for exactly this class of question. The defect is in `epics.md`'s sentence, which was written while Story 21.4 was blocked on AD-27 and was **satisfied by AD-27 landing** — the identity's *properties* (canonical, translation-independent, carrying no display text) are settled, and only the physical shape was ever the story's.

**Fix applied:** the sentence in `epics.md` is corrected in this change set, per `AGENTS.md` rule 4 (*never leave docs lying*), to say that the identity's **properties** are AD-27's and AD-28's and its **shape** is this story's — which is what both documents actually mean.

## Coverage matrix — the five points the action item required

| # | Action-item requirement | Landed in |
|---|---|---|
| 1 | AD-27's tolerance clause survives; *"one matcher shared by every translation"* does not — scope is a parameter | AD-28 ¶4 (`one implementation, two scopes`) + the struck clause in AD-27 |
| 2 | Tolerance enumeration splits — three rules are language-free, abbreviation is not; aliases belong to a translation | AD-28 ¶6 |
| 3 | A tolerance collision in rundown scope is unmapped input (NFR-5), never guessed | AD-28 ¶7, generalised past rundown-only per adversarial A3 |
| 4 | `shortName` leaves AD-27's Rule and the `bible_books` column | AD-28 ¶8, with the route corrected (see the version lens, V1) |
| 5 | The *Boundaries* violation is live on shipped code, and one matcher closes it — 21.4 legitimately reaches Epic 2/5 | AD-28 ¶9, all three sites re-measured |
| — | *What survives of AD-27 and must not be re-litigated* | AD-28 ¶1, enumerated explicitly |

## Consistency checks that pass

- **PRD FR-22 consequence** (`prd.md:433`) — *"Input is scoped to that same translation — see FR-24."* Agrees with AD-28; the reversed *input is generous* wording is gone from the PRD, so the spine is no longer standing ahead of its source. ✅
- **PRD §4.12 / FR-24** — the never-filter rule and the two-axis framing are untouched by AD-28, and AD-28's scope-by-corpus-code is compatible with them because a code carries no locale (AD-26). ✅
- **`epics.md` Story 21.4 AC** — all seven criteria are represented in AD-28 or explicitly left to the story; the `Kej`-under-KJV counter-example and the `Ps`-through-autocomplete case both appear in both documents with the same meaning. ✅
- **`epics.md` Story 21.5** — the `HymnNumberAutocomplete` mechanics, the append-shaped contact point and the no-`proxy.ts`-change finding all agree with AD-28. ✅
- **`sprint-status.yaml`** — the epic-21 action item's five points are all discharged; it can be closed by the run that lands this. ✅
- **`EXPERIENCE.md`** — AD-28 adds no route and no surface of its own; the component-inventory row is clause (3) of the still-open `bmad-ux` item, which this run deliberately does not touch. ✅ *(Not blocked by AD-28, and AD-28 is not blocked by it.)*

## One thing this lens could not check

`DESIGN.md` was not consulted. AD-28 introduces no token, no component and no visual delta — the input surface is Story 21.5's and reuses a shipped component — so there is nothing for it to receive. Named because a silent artifact family is the failure mode this lens exists for, and *"nothing to send"* should be visible as a conclusion rather than an omission.
