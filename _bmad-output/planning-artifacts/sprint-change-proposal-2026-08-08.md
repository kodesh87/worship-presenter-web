# Sprint Change Proposal — 2026-08-08

**Trigger:** Story 20.1's authored seed (PR #37, closed 2026-08-07)
**Scope classification:** **Moderate** — backlog reorganization, no replan
**Path forward:** Option 1 — Direct Adjustment
**Mode:** Incremental (eight proposals, each approved individually by the owner)
**MVP impact:** None
**Owner decisions taken during this run:** two (see §3)

---

## 1. Issue Summary

Story 20.1 authored the artifact registry seed and shipped four liturgical lyric
pages as committed canvas text in `data/default-registry.json` —
`intercessory-671-lyric-1`, `intercessory-684-lyric-1`, `hope-lyric-1`,
`hope-lyric-2`.

`ARCHITECTURE-SPINE.md` recorded the consequence as *"NFR-3 is measurably weaker
… at a hardcoded `fontSize` each, now ship with nobody checking their readability
at projection distance"*, called it an **unowned consequence**, and nominated
`bmad-correct-course` as the next step. This run began by testing that claim
rather than accepting it.

**Two of its three parts did not survive.**

| Spine claim | Finding |
|---|---|
| NFR-3 is owned by nobody | **False.** The PRD gave it a mechanism on 2026-07-30 (`prd.md:413`, `:630`, `:652`): *the Admin's own eye, at authoring time, on the surface that will project them* |
| Pages ship at a hardcoded `fontSize` with nothing checking them | **False.** `render-model.ts` runs a shared shrink-to-fit policy whose floor, `MIN_TEXT_FIT_SCALE = 0.35`, is justified explicitly by legibility from the back of the hall |
| Citations `prd.md:563` and `epics.md:52` | **Both dead** — each points at a blank line |

**What survived, and is narrower and more serious than what was recorded:**

1. **The named mechanism never ran for the shipped seed.** The decision reads
   *"the pages they just authored"*. No Admin authored these four rows; the seed
   work did, and they ship committed. The mechanism covers the **edit** path,
   not the **shipped seed** path. No AC ever required anyone to look at them.

2. **The surface the decision names cannot reveal the failure.** This is the
   headline finding and it is a code defect, not a process gap.

---

## 2. Evidence

### 2.1 The PPTX blind spot

There is one shrink-to-fit policy and two renderers, and only one can measure.

- **Web** has a layout engine. `largestFittingTextScale` bisects over measured,
  post-wrap glyph heights.
- **PPTX** is generated server-side with no layout engine, so
  `estimateTextFitScale` (`render-model.ts:253`) estimates — and pins
  `contentWidth: 0`, counting only author-typed `\n`.

`contentWidth: 0` means **the width axis can never force a shrink**. Wrapping is
structurally invisible to the PPTX path. Measured on the shipped seed, through
the hydrated element shape (`hydrate.ts:121` maps `content` → `text`):

| Row | Authored lines | Box | PPTX scale | Web scale |
|---|---|---|---|---|
| `intercessory-671-lyric-1` | 1 — 305 chars, **zero** newlines | 920×283 | **1.0** | ≈0.77 |
| `hope-lyric-1` | 4 | 920×283 | **1.0** | ≈0.87 |
| `hope-lyric-2` | 6 | 920×283 | 0.84 | ≈0.83 |
| `intercessory-684-lyric-1` | 1 — 104 chars | 920×283 | 1.0 | ≈1.0 |

`hope-lyric-2` agrees. **The estimator is correct whenever the author typed the
breaks** — that is exactly the boundary of the bug.

Web figures use a 0.5em average-advance approximation and are indicative. The
direction is not in doubt: `contentWidth: 0` is structural, and 305 characters
at 46.67 px cannot occupy one line in a 920 px box.

### 2.2 The code contradicts itself about who covers the remainder

- `render-model.ts:250` — *"PowerPoint's own 'shrink text on overflow' (enabled
  alongside it) covers the remainder."*
- `pptx.ts:236` — *"PowerPoint only computes a font scale for it when the shape
  is next edited or resized — a freshly generated deck would still open with the
  text spilling."* — which is the stated reason the scale is baked at all.

Both cannot be true. If `pptx.ts` is right, nothing covers wrap-driven overflow
in the PPTX — the artifact AD-1 / NFR-1 make load-bearing.

### 2.3 The sting

Live Preview **is** the web renderer. An Admin doing exactly what the 2026-07-30
decision asks sees a slide that fits, while the PPTX handed to the operator does
not. The mechanism is structurally incapable of catching this class of violation.

### 2.4 Wrapping is invariant — so the guarantee is computable

Raised by the owner during this run. `aspectRatio` is a literal `'16:9'` and
`validate.ts:263` throws on anything else; the web stage is letterboxed, not
stretched (`ArtifactSlide.tsx:215`), precisely to keep percentage geometry and
`cqh` font sizes in agreement with the PPTX.

Because box width is a percentage of width and font size a percentage of height
under a fixed ratio, scaling the stage multiplies both by the same factor.
**Characters-per-line is invariant; line count is invariant; wrapping does not
depend on the viewer's resolution.**

The code's justification — *"Wrapping is unknowable without glyph metrics"* — is
therefore about **font metrics**, not resolution or aspect. Under a locked 16:9
stage and a known font, wrapping is computable server-side, and can be asserted
**once at build time** rather than measured at runtime.

### 2.5 The font axis is enforced only by an absent UI control

| Axis | Type | Validator |
|---|---|---|
| `aspectRatio` | literal `'16:9'` | **throws** (`validate.ts:263`) |
| `fontFamily` | bare `string` (`runtime-contract.ts:34`) | any non-empty string passes (`validate.ts:135-140`) |

The owner's model — an Admin cannot add a font — holds today only because
`ArtifactEditor` exposes **no font control**, hardcoding `'Arial'` at `:604`.
Any other write path passes. All 110 registry text elements resolve to Arial;
zero carry an override. `DEFAULT_FONT_FAMILY` is defined twice
(`render-model.ts:94`, `ArtifactEditor.tsx:45`).

The PPTX embeds images but **no fonts** — `pptxgenjs` offers no mechanism — so
NFR-7's *"embed when feasible"* conditional had an answer and never got one
recorded.

---

## 3. Owner decisions taken during this run

1. **Fonts are guaranteed present on target machines, via a documented list**
   (2026-08-08). This closes NFR-7's dangling branch and is the precondition
   that makes the readability guarantee computable.
2. **The font set is closed and defined in code.** Several fonts eventually,
   from a fixed list; adding one is a coding change; an Admin cannot add a font
   type. Same predefined-set-versus-selection split already ratified for the
   `add` verb, and the AD-19 / AD-22 bounded-configuration pattern.

**Not reopened:** the 2026-07-30 manual-authoring decision. Manual authoring, no
FR-5 splitter, no automated canvas readability check, and both accepted
consequences all stand. What changed is that the *mechanism* is now split by
path.

---

## 4. Impact Analysis

**Epic impact.** Epic 20 absorbs two new stories. No epic modified, removed or
resequenced. **20.2 remains the next unit to build.**

**Story impact.** Two added, both `backlog`. No existing story changed.

**Artifact conflicts resolved.** PRD (4 sites), `epics.md` (2 NFR rows + 2 story
entries + 1 true-ing clause), `ARCHITECTURE-SPINE.md` (1 bullet, 2 clauses),
`sprint-status.yaml` (3 sites).

**Not touched, deliberately:** `EXPERIENCE.md` and `DESIGN.md` — the mechanism
names an existing surface, so no UX artifact owes anything. `src/` is untouched;
this change set is docs-only.

---

## 5. Recommended Approach — Option 1, Direct Adjustment

| Option | Verdict | Reason |
|---|---|---|
| **1 — Direct Adjustment** | **Selected** · Effort Medium · Risk Low | Two stories inside the existing epic; the leaking half ships without waiting on the other |
| 2 — Rollback | Not viable | The 20.1 seed is correct; reverting it simplifies nothing |
| 3 — MVP Review | Not viable | MVP is not threatened; NFR-3 binds scope, it does not define it |

**Dependency ordering.** Story 20.9 AC-1 (build-time assertion over the shipped
seed) is **not** gated on Story 20.10 — the seed is all-Arial with zero
overrides, so it can ship now and close the live leak. AC-2 (renderer agreement)
**is** gated, or must be scoped in writing to the closed set as it then stands.

---

## 6. Detailed Change Proposals

All eight were presented individually and approved. Applied in this change set:

| # | Artifact | Change |
|---|---|---|
| 1 | `ARCHITECTURE-SPINE.md` Deferred bullet | Clause (3) rewritten; *"none of it has an owner"* true'd; two dead citations repaired |
| 2 | `prd.md:413`, `:630`, `:652` | NFR-3 mechanism split by path; renderer agreement added as an obligation |
| 3 | `prd.md` §10 NFR-7 | Embedding branch closed; closed code-defined set; precondition of NFR-3 |
| 4 | `epics.md:59` | NFR-3 row: `None` → Epic 20 / Story 20.9 |
| 5 | `epics.md:63` | NFR-7 row mirrored to the amended PRD; M5-4 stated rather than dangling |
| 6 | `epics.md` | Story 20.9 registered |
| 7 | `epics.md` | Story 20.10 registered + AD-30 handoff drafted |
| 8 | `sprint-status.yaml` | Two story rows, `epic-20` comment, `last_updated` header |

**One unplanned edit, reported rather than absorbed.** Story 20.8 read *"It is
last for a reason"*, which this change set falsified by appending 20.9 and 20.10.
A parenthetical now scopes it to the **capability** stories (CAP-1..CAP-8). It
was not among the eight approved; it is the exact defect class this run exists to
remove, so leaving it would have been incoherent.

---

## 7. Implementation Handoff

**Scope: Moderate → Product Owner / Developer.**

| Recipient | Deliverable |
|---|---|
| `bmad-create-story` | Story 20.9 context, then Story 20.10 |
| `bmad-dev-story` | Implementation, per each story's AC |
| **`bmad-architecture` Update** | **AD-30.** Story 20.10 carries a gate: it must **not** edit `ARCHITECTURE-SPINE.md` from inside its own change set. Same shape as Story 20.1's gate |
| Owner | Commit, push, PR |

**Success criteria.** Story 20.9 AC-1 green over the shipped seed; AC-2 stating
its tolerance; AC-3 leaving exactly one true comment where two contradictory ones
stand. Story 20.10: the validator rejecting an out-of-set face the way
`aspectRatio` is rejected, and the deploy list bound to the code by a test.

---

## 8. What this run did not verify

Recorded rather than hidden, in this file's own convention.

- **No PPTX was generated and opened in PowerPoint.** The finding rests on the
  source — `contentWidth: 0` is structural — and on the code's own contradictory
  comments. Story 20.9 AC-3 settles which is true.
- **Web fit scales are approximations** (0.5em average advance). Indicative, not
  measured in a browser. The direction is robust; the exact figures are not.
- **The first probe of this run was wrong** and was discarded:
  `resolveElementText` reads `element.text` while the registry stores `content`,
  so every scale read `1` until the probe was re-run through the hydrated shape.
  Recorded because the wrong numbers were self-consistent and would have passed
  a reader who did not check `hope-lyric-2` against its own newline count.
