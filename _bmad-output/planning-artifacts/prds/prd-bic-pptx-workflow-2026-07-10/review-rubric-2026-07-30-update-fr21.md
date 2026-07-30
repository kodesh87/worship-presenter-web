# PRD Quality Review — BIC Worship Presentation Automation

**Run:** `bmad-prd` Update, 2026-07-30 · **Scope of change reviewed:** §3 Glossary additions, §4.2
Blueprint standing, §4.10 (FR-20 supersession notes + new FR-21), §6 committed-outside-the-plan
block, §8 new blocking category, §10 NFR-8/NFR-9, §12 index entry.
**Reviewer:** rubric walker, run sequentially in-parent (subagents unavailable this session).
**Stakes calibration:** internal tool, real weekly use, **chain-top** — this PRD feeds UX,
architecture, epics and stories, so *Done-ness clarity* and *Downstream usability* carry the most
weight and are scrutinized hardest.

## Overall verdict

The update holds. FR-21 is written at the right altitude — capability, not mechanism — and its twelve
consequences are mostly testable, with four explicit boundary clauses that stop the new capability
from quietly swallowing three of §5's non-goals. What was at risk, and what this review caught, is
that adding *authored structure* to a PRD whose §4.2 declared a fixed 68-slide Blueprint
"authoritative" created two places that now claim to own the same thing; both were fixed in this run
rather than left as findings. The residual weakness is that the two largest engineering investments in
the document, FR-20 and FR-21, are validated by no Success Metric at all.

## Decision-readiness — strong

Decisions read as decisions. The two owner waivers state what was given up — fidelity is unvalidated
by the people who will see it, the parser stays fit to one sample — rather than framing the waiver as
a neutral trade. The new §6 block is the strongest example: it records Epic 20's commitment *and*
three things the commitment does not cover, including that it does not close the font gate. §8's new
category is genuinely open — three non-equivalent answers named, plus the observation that inaction
picks the third silently.

### Findings

- **low** Five places now carry "what is committed" (§6 spike decision, §6 phase-gate decision, §6
  delivered-outside, §6 committed-outside, and the per-phase lists) (§6) — a reader assembling the
  current commitment set has to read all five. *Fix:* leave as is for now; if a sixth arrives, §6
  wants a single status table at its head.

## Substance over theater — strong

No persona section, no differentiation section, no boilerplate NFR. Every NFR carries a product
bound: zero network access, ≤ 5 minutes, verification on a clean machine, "never over-full."
NFR-9's "survives a restart, a redeploy, and any later change to shipped defaults" is testable three
ways. NFR-8 is the rarer kind of NFR — a conformance property of data, checkable without producing
the artifact.

### Findings

- **high — FIXED IN THIS RUN** NFR-8 as first drafted forbade the capability FR-21 grants (§10) —
  it required that "every slide the Deck Blueprint requires must have an entry that produces it,"
  while FR-21 lets an Administrator delete an entry and keeps it deleted. The first exercise of
  FR-21's delete verb would have violated an NFR. *Fixed:* NFR-8 now splits into a property that
  holds at any authored state (placeholder binding) and one that holds of what the product ships
  (Blueprint coverage of the starting Registry), with the read-it-as-a-prohibition failure named
  explicitly.

## Strategic coherence — strong

The thesis is stated and bet on: turn a weekly manual rebuild into a generated artifact, and make the
offline file — not the browser — the Sabbath guarantee. FR-21 follows from it rather than sitting
beside it; moving structure into data serves the one-maintainer constraint §9 names. Counter-metrics
exist and the phase-gate waiver explicitly preserves them.

### Findings

- **medium** FR-20 and FR-21 are validated by no Success Metric (§7) — §7's own convention is
  "Each SM cross-references the FR(s) it validates," and the two largest engineering investments in
  this document appear in none of SM-1…SM-7. Both are labelled as realizing a maintainability need,
  which is real, but §9's maintainability guardrail has no metric either, so nothing in the document
  can tell whether either paid off. *Fix:* one operational SM — e.g. a liturgical or layout change
  reaches next Sabbath's deck with no code change and no deploy — would cover both and matches the
  claim they actually make.

## Done-ness clarity — adequate

FR-21's consequences are largely verifiable: an explicit-Save assertion, a delete that survives a
restart, one full-bleed slide per announcement image, a hymn no Slot claims being surfaced rather
than dropped, a pre-existing Service rendering without a Snapshot. The parenthetical enumeration of
General authoring (background, images, text areas, drag/resize, font colour/size/style) rescues
"compose freely" from being the vague phrase it would otherwise be.

Two consequences are not yet testable, and both are known-open rather than sloppy.

### Findings

- **medium** *"An Operator can see that their Service is behind and ask for a sync"* (§4.10, FR-21)
  — "ask for a sync" names no mechanism, and `EXPERIENCE.md` Open Item 5 records that the affordance
  is deliberately undecided, including whether the answer is *nothing*. As written a tester cannot
  fail it. *Fix:* keep the requirement (the Operator must be able to tell) and let the surface remain
  the UX document's call, but say so inline so the untestability is visibly owned rather than looking
  like an omission.
- **medium** NFR-3 binds hand-authored lyric pages with no mechanism behind it (§8, §10, FR-21
  `[ASSUMPTION]`) — correctly recorded as blocking, and it is the one item that must be resolved
  before Story 20.1's acceptance criteria can be written. Not a defect in the PRD's drafting; a
  decision the PRD is now honest about needing.

## Scope honesty — strong

Four boundary clauses inside FR-21 (not per-church, not live presentation control, the Registry holds
no weekly content, a fifth Slot is a development change), plus §6's "what this decision does not
cover," plus a dated statement that the cheap-migration window closes at first deploy. The
`[ASSUMPTION]` tag roundtrips to §12.

Open-items density: one blocking item and three deferred-by-choice in §8, five entries in §12. For a
chain-top PRD at green-light, one blocker is acceptable **because it is scoped to a named story**
rather than left floating.

## Downstream usability — adequate *(was thin before this run)*

The Glossary now carries the registry vocabulary that §4.10 had been using since 2026-07-29 without
defining, and Slide Type vs Slide Kind is disambiguated on the axis that actually distinguishes them
— semantic meaning versus authoring authority — which is what §3's own no-synonym rule required once
both existed. FR ids are contiguous (FR-1…FR-21 plus FR-10b/11b/13b); NFR ids are contiguous 1–9.

### Findings

- **high — FIXED IN THIS RUN** Two authorities for deck structure (§3, §4.2 vs §4.10 FR-21) —
  §4.2 said downstream workflows treat the 68-slide Blueprint as authoritative and the Glossary
  called it "the authoritative mapping of every slide position," while FR-21 makes the ordered
  Registry the source of which slides exist. A downstream reader had two documents to obey and no
  rule for which wins. *Fixed:* both now state that the Blueprint is authoritative for what the deck
  was, for what the Registry ships as its starting point, and for what FR-4/FR-6 are tested against —
  and that a deliberate Administrator departure is permitted rather than defective.
- **medium** FR-20 read alone is a requirement with five caveats (§4.10) — the supersession
  warning sits in the section description, above FR-20's own heading, so a story-creation run that
  jumps to the `#### FR-20` anchor can miss it. Stories 16.1–16.5 cite FR-20. *Fix:* one line
  directly under FR-20's heading pointing at FR-21.

## Shape fit — strong

Internal-tool capability-spec shape with UJs that earn their place: there genuinely are three
distinct actors (a contributor who never opens the app, a reviewer, a presenter), so the five UJs are
load-bearing rather than formalism. FR-20 and FR-21 correctly have no UJ and say why. Brownfield
references are accurate — this run verified the FR-20 consequences against the shipped code path
rather than against the previous report's summary of it, which is how the five supersessions surfaced
instead of the one the readiness report had named.

## Mechanical notes

- **Glossary drift (low).** The PRD's domain term is **Run-Sheet**; `EXPERIENCE.md` declares the
  operator-facing UI term is **run sheet**, two words, and that "Order of Service" never appears in
  the UI. Defensible as a domain-vs-UI split, but nothing states it, so it reads as drift.
- **ID continuity — clean.** FR-1…FR-21 + FR-10b/11b/13b, no gaps or duplicates. NFR-1…NFR-9
  contiguous. Every cross-reference introduced this run (§5, §8, §9, FR-1, FR-3, FR-11, NFR-3, NFR-5,
  §4.2) resolves.
- **Assumptions Index roundtrip — clean.** FR-21's inline `[ASSUMPTION]` is indexed in §12; all five
  §12 entries appear inline.
- **UJ protagonists — unchanged and named** (Sari, Bimo, Elen). FR-21 adds no UJ, deliberately.
- **Frontmatter.** `status: active` → `final` and `updated` → 2026-07-30. The value changed because
  the Create-intent resume scan treats any status other than `final` as an in-progress draft; "final"
  here means the document is complete as of its `updated` date, not that the product is done.
