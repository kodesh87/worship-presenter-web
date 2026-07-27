---
title: "Pressure-Test Findings — BIC Worship Presentation Automation PRD"
status: advisory
created: 2026-07-11
method: "Pre-mortem + Red-Team (with Assumption Audit and Second-Order Thinking)"
note: "Adversarial review of the DRAFT PRD before finalize. The PRD is NOT modified by this document. These are inputs to the finalize decision."
---

# Pressure-Test Findings

## How to read this

- **Verified against:** `prd.md`, this folder's `addendum.md`, the brief set (`brief.md` + brief `addendum.md` + `source-pptx-structure.md`), and the 67 rendered source slides in `slides/` (deck `260704`).
- **Severity = impact on the #1 goal (used every week for ≥1 quarter / SM-3) × likelihood.** A finding is only listed after it was traced to a specific FR/section/slide.
- Each finding: **what & where (verified)** → **how it fails (pre-mortem/red-team)** → **mitigation**.
- This is advisory. It changes nothing in the PRD. The three *Scope Challenges* at the end are the only places it argues to move a scope boundary, each with cause.

---

## 0. What the PRD already gets right (steelman first)

A credible red-team names the strengths it is trying not to break:

- **Phasing discipline is real.** Phase 1 is the only commitment; Phases 2–6 are specified but explicitly contingent on P1 proving valuable. This is the correct posture for a solo dev and directly answers the FreeWorship-abandonment history.
- **Offline PPTX is the hard guarantee; the web slideshow is deferred.** Making the file (not the browser) the day-of contract is the right risk call, and it keeps the highest-risk surface out of the MVP.
- **Lyrics come from a database, never typed or web-searched (FR-2).** This kills the single biggest historical error surface and copyright risk in one move.
- **Clean template rebuild over cloning last week's file (FR-4, §4.2).** Structurally correct; it is the only way to end the "stale May-31 metadata / leftover content" failure class.
- **Flag-and-continue on an invalid hymn number (FR-2).** A sound non-blocking choice.
- **The ownership/learning motive is named honestly (§2.1, brief).** Naming it lets us watch for the confirmation-bias it introduces (see M2).

The findings below are where the draft is thinner than it reads.

---

## CRITICAL — threatens "it sticks" directly, high likelihood

### C1. The Phase-1 review loop silently reintroduces the desktop/PowerPoint dependency the product exists to remove.

**Where (verified):** §4.3 states the Phase-1 Friday review "works from the Run-Sheet, the editable Service data, and a **downloaded PPTX spot-check**." Slide-level visual preview (FR-9) is assigned to **Phase 2** (§4.3, §6). SM-2 promises the operator pool widens beyond the one person who knows PowerPoint.

**How it fails (pre-mortem):** It is week 6. A new operator is on Friday review. To actually *trust* the deck she must open the downloaded 68-slide PPTX — which means she needs PowerPoint (or LibreOffice/Slides) installed and the skill to page through it. The brief's own differentiator against FreeWorship is the **access model**: "zero install, anyone opens a link." In Phase 1 that is only half-true — you can open the *link*, but you cannot *verify the deck* without desktop presentation software. The product's core anti-FreeWorship claim leaks in exactly the step it most needs to hold. Worse: the value props that require *looking at rendered slides* — SM-4 (errors → zero), SM-C1 (no cramped/garbled lyric slides), FR-5 readability — **cannot be validated from form data**. You can only confirm "no over-full lyric slide" by seeing the slide. So the visual preview is not a Phase-2 nicety; it is load-bearing for the MVP's headline error-reduction promise.

**Mitigation:** See **Scope Challenge S1** — pull a *minimal* render-to-image preview into Phase 1 (thumbnails/PDF of the generated deck shown in the hub), distinct from the full interactive Phase-2 slideshow. This closes the desktop dependency and makes SM-4/SM-C1 actually observable during the MVP.

### C2. The font strategy is internally contradictory, and the contradiction detonates on the presentation laptop — live.

**Where (verified):** FR-14 requires the downloaded PPTX to present offline "with all slides, images, **and fonts intact**." §4.2 NFR and §11 say fonts are "**bundled or substituted**," dropping commercial Cooper BT Light. Source slide 5 confirms Cooper BT Light is the branded font on every song-title `SDAH #nnn` line; Montserrat is everywhere else.

**How it fails (pre-mortem):** "Fonts intact, offline" has exactly two implementations and the PRD hasn't chosen: **(a) embed the fonts in the .pptx** — which re-creates the licensing exposure and file-size bloat the design is fleeing (the source deck embedded 18 `.fntdata` fonts), or **(b) rely on the fonts being installed on the presentation laptop** — which silently re-introduces a per-machine setup dependency, the *precise* FreeWorship failure. If the deck is generated with a substitute font that is *not* installed on the Sabbath laptop and *not* embedded, PowerPoint substitutes **again at present time** → lyric lines reflow and overflow → the SM-C1 failure happens *on the projector, in front of the congregation*, with no chance to catch it. "Offline-complete file" is necessary but not sufficient; font resolution is the hidden second condition.

**Mitigation:** Decide explicitly, and write it into FR-14/§11: use a **freely-licensed** typeface for both body and the song-title line (removing the licensing objection), **embed it in every generated PPTX**, AND verify the generated file renders correctly on a *clean* machine with the font *not* pre-installed (that is the real offline test). Treat "renders on a machine that has never seen these fonts" as an acceptance criterion, not an assumption.

### C3. The solo-dev 3-layer system relocates the bus factor from a learnable manual task to an unlearnable distributed system, against a hard weekly deadline.

**Where (verified):** §9 "Maintainability" and the brief addendum's change-management path: every change flows picoclaw skill → API → app, all owned by one person (kodesh87). SM-C3 guards against re-centralizing on one person — but scopes that guard to *operators*, not to the maintainer.

**How it fails (pre-mortem):** The old single point of failure was "only Bimo can build the deck" — a skill any motivated volunteer could learn in an afternoon. The new single point of failure is "only kodesh87 can maintain a three-layer agent+API+web system" — which *no one* at the church can pick up. When parsing drifts (it will — the format is semi-structured and evolving, §4.1 NOTE FOR PM), or a dependency rots, or Telegram changes an API, the fix requires the dev. If the dev is unavailable for two weeks and the church has *already let the manual skill atrophy* (the explicit goal), there is a Sabbath with **no deck and no fallback muscle**. The product can succeed at its stated goal and thereby manufacture a more brittle failure mode than the one it replaced.

**Mitigation:** (1) Keep the hand-editable master template as an **explicit, documented break-glass fallback** and state it as an operational guardrail in §9 — the clean rebuild makes this viable (open the last generated PPTX and edit by hand). (2) Add a *maintainability budget* to the finalize decision: challenge whether picoclaw must be a full third layer in Phase 1, or whether the "smart parse" can live in one place (see M-notes under H3). (3) Define a "dev unavailable" runbook: which weeks can be produced manually, by whom, from what.

---

## HIGH — likely to bite; undermines a headline metric

### H1. Image → role binding is entirely unspecified.

**Where (verified):** FR-6 needs three distinct image roles — **sermon graphic**, **family/youth photo**, and **0..N announcement flyers** in a specific order (FR-3). The brief-addendum sample rundown contains **zero image-reference syntax**. The PRD addendum §4 lists "Image upload — posters, sermon graphic, family/youth photo" but specifies **no mechanism** for picoclaw to know *which* uploaded image is *which*. Source slide 56 shows the family photo was a **broken-image placeholder** that week — i.e., a missing/mis-bound image already reaches the rendered deck.

**How it fails:** Events dept drops four images in the chat. Which is the sermon graphic? Which is the family photo? Which two are announcement flyers, and in what order? With no binding convention, picoclaw guesses, and a wrong guess puts the youth's photo where the sermon graphic belongs, or renders the placeholder box on the big screen. This is an entire input path that reads as designed but isn't.

**Mitigation:** Define an explicit image-binding convention *before finalize*: caption/keyword tagging in the Telegram message (`family:`, `sermon:`, `flyer1:`…), reply-to-image threading, or an ordered upload contract picoclaw enforces. Add a testable consequence to FR-3/FR-6. Add a "missing/unbound image" visible-failure (ties to H3).

### H2. A valid-but-wrong SDAH number is undetectable, because the one available checksum — the human-typed title — is discarded.

**Where (verified):** FR-2 catches only *invalid/unknown* numbers (flag-and-continue). The sample rundown writes songs as `SDAH #159 The Old Rugged Cross` — number **and** human title. FR-2 resolves the title from the DB and (by design) ignores the typed title. Source slide 5 shows a title-slide fully driven by the number.

**How it fails (pre-mortem):** The events dept types `#159` meaning "At the Cross" but fat-fingers a digit; `#159` is a *valid* hymn — a *different* one. FR-2 sees a valid number, resolves confident, correct-looking lyrics for the **wrong song**, and nothing flags it. The congregation sings the wrong hymn from a clean-looking slide. The typed title next to the number is exactly the redundancy that would catch this — and the design throws it away. This is more dangerous than an invalid number because it fails *silently and confidently*.

**Mitigation:** See **Scope Challenge S2** — keep the typed title and compare it (fuzzy match) to the DB-resolved title; on mismatch, flag the Song Block for review rather than trusting the number blindly. Cheap; directly serves SM-4.

### H3. The parser is designed from a single specimen; only hymn-invalidity fails visibly; there is no general "unparsed residue" surface.

**Where (verified):** Every FR-1 testable consequence is keyed to the **one** July-11 sample rundown. The robust-parsing NFR (§10) says parsing must "fail visibly," but the *only* visible-failure channel specified anywhere is the invalid-hymn path (FR-2). Concrete hazards visible in the single sample: compound fields (`Memory Text & Opening Prayer : Bagas`), empty-value roles (`Bible Talk :  (40m)`), heterogeneous timings (`(09.30-10.50 /80 min)`, `(5m)`, `(1m)`), a forward reference (`The Speaker` before the sermon line), curly-vs-straight quotes around the sermon title, and the bare lowercase `#671 now dear Lord as we pray`.

**How it fails:** Fit-to-n=1 means the *second* real rundown — different month, different events-dept author, phone autocorrect, reordered lines — parses partially, and the lines picoclaw doesn't understand vanish silently because there is no channel to surface "I could not map these 3 lines." The Reviewer sees a plausible Service and ships a deck with a dropped role or a missing timing.

**Mitigation:** (1) **Scope Challenge S3** — collect 5–10 historical rundowns and decks before locking parse rules, to measure real format variance. (2) Add a general **"unmapped input" surface**: picoclaw/the API must return everything it could *not* confidently map, shown to the Reviewer in the hub — generalize FR-2's flag beyond hymns. (3) Reconsider whether the heavy interpretation belongs in picoclaw (a fragile hand-tuned parser) or in an LLM-assisted extraction step with the raw text preserved for the Reviewer.

### H4. Foundational dependencies (Hymnal Database, picoclaw) are unvalidated and not yet in hand, but FR-5 presumes clean structured lyric data.

**Where (verified):** §11 lists the Hymnal Database as "provided by the developer"; the brief `.memlog.md` records it as an *assumption* — "belum di tangan saat brief ditulis" (not in hand when the brief was written). FR-5's readability splitting presumes lyrics arrive "split into verse/refrain blocks" (FR-2, Glossary). picoclaw is an "openclaw-type agent" requiring a customized skill (§11).

**How it fails:** If the Hymnal data the dev eventually obtains is flat text (not structured verse/refrain), or has inconsistent numbering, or is incomplete, FR-5's per-verse/per-Reff slide construction has nothing clean to split on, and the core lyric-slide value degrades. If picoclaw's runtime is itself experimental or hard to customize, Layer 1 wobbles. These are Phase-1 blockers hiding inside the word "provided."

**Mitigation:** Make "acquire and validate the Hymnal Database (structure, coverage, numbering)" and "confirm picoclaw is customizable to spec" **explicit Phase-1 pre-requisites / spikes** with go/no-go criteria, before any generator work. FR-5 acceptance should include a real hymn with a split verse.

### H5. Visual fidelity is treated as a technical NFR but is an *adoption* risk for a public worship artifact; the "font substitution acceptable to the church" assumption is unvalidated and load-bearing.

**Where (verified):** §4.2 NFR: result "closely resembles the current deck but need not be pixel-perfect"; §12 indexes "safe font substitution is acceptable to the church" as an **unconfirmed assumption**. Source slides 5/6/40/56 show a deliberate visual identity (custom backgrounds, Cooper BT Light song titles, specific layouts) seen weekly by the whole congregation on the big screen.

**How it fails (pre-mortem):** The deck goes live looking subtly *off* — different title font, lyric text sitting differently on the reused background art, slightly wrong spacing. On a back-office tool nobody cares; on the **worship screen** the leadership and congregation notice it looks "not our deck," and aesthetic rejection becomes an abandonment cause independent of whether the automation works. "Close resemblance" is doing a lot of unexamined work, and it rests on an assumption the church has never actually signed off.

**Mitigation:** Convert the assumption into a **validation task before finalize**: generate 3–4 real slides (song title, lyric, sermon, family/youth) with the chosen substitute fonts on the reused backgrounds and get explicit sign-off from Bimo/leadership. Pick the substitute for the song-title line deliberately (it is the most visible substitution). Only then lock §4.2.

---

## MEDIUM — real, but slower-acting or narrower

### M1. Member PII (names, photos, prayer requests — likely including minors) persists indefinitely; retention never deletes it; consent is assumed away.

**Where (verified):** Source slide 56 renders a family's five full names, a *Youth of the Week* photo of a real young person, and personal prayer requests. FR-10b / SM-C2 / the Retention Policy glossary entry state retention deletes **only generated PPTX** — "participant text, posters, and all other data persist and are manual-delete only." §9 assumes "no formal data-retention/consent regime is required." The auto-memory notes the repo holds real, unredacted member PII.

**How it fails:** Real people's photos and prayer requests accumulate forever in a hobby-hosted app behind two roles, by explicit design. "Youth of the Week" plausibly includes minors. This is a privacy/liability exposure that grows every week, and the PRD's posture toward it is a single unvalidated shrug.

**Mitigation:** Validate the church's actual consent/retention expectation (don't assume). Consider a retention window on *PII-bearing payload*, not just the PPTX; at minimum, make PII-bearing fields easy to purge and document who may see slide 56 data. Revisit §9 with this concretely in view.

### M2. There is no pre-registered early kill/continue gate for SM-3, and the dev's ownership motive biases the "is it valuable?" judgment.

**Where (verified):** SM-3 gates all of Phases 2–6 on Phase 1 "proving genuinely useful," measured at ~13 weeks. The build motive explicitly includes ownership/learning (§2.1, brief). No leading indicator or checkpoint is defined.

**How it fails:** You discover at week 13 that it didn't stick, having invested a quarter. And the person judging "valuable" is the person who *wants* it to succeed — classic confirmation bias, honestly flagged but unmitigated.

**Mitigation:** Pre-register a leading gate, e.g. "by week 4: Friday review ≤10 min *observed*, ≥2 distinct operators have each run a service unaided, and zero manual-fallback weeks — else stop and diagnose." Put the metric in place before week 1, not after.

### M3. The fixed intercessory response songs (#671/#684) are uneditable in Phase 1, though the rundown lists them every week.

**Where (verified):** FR-1 consequence routes `#671`/`#684` to the fixed Template Skeleton (a "standing pair"), and FR-11's editable fields do **not** include skeleton response songs. The brief-addendum sample lists them weekly as if variable; the PRD `.memlog.md` flags this as an assumption.

**How it fails:** The week the church *does* change an intercessory response song, the system renders the hard-coded old one and no one can fix it in the form (it isn't payload). It requires a code change — a silent-staleness path that contradicts the whole "no leftover content" value.

**Mitigation:** Confirm with the church whether these ever change. If yes, model them as payload with a standing default (the same pattern already used for the theme verse), rather than hard skeleton.

### M4. Duplicate or edited Telegram sends can create duplicate/overlapping Services in Phase 1.

**Where (verified):** picoclaw "creates a Service" on reading the rundown (FR-1). Telegram corrections (FR-12) and first-save-wins concurrency (FR-13b) are **Phase 3**. Phase 1 specifies no idempotency/dedup rule.

**How it fails:** In a live chat, the rundown gets sent, then edited, then re-sent corrected. Phase-1 picoclaw has no correction path, so a re-send plausibly creates a *second* Service for the same Sabbath, and the Reviewer edits the wrong one.

**Mitigation:** Define a Phase-1 dedup/identity rule (one Service per date; a re-send updates or is rejected, not duplicated), independent of the Phase-3 correction workflow.

### M5. No operational fallback if the app is down on the Friday of a *new* week.

**Where (verified):** §10 offline reliability protects the *presentation* via the downloaded PPTX, but *generation* requires the app to be up. Phase 1 has no stated fallback for "app unavailable before this week's deck exists."

**How it fails:** App down Thursday–Friday → no deck can be generated for the coming Sabbath, and (by design) the manual skill has atrophied. The offline guarantee protects a deck that was never built.

**Mitigation:** Pair with C3's break-glass template. State a minimum "produce this week manually" runbook as a guardrail.

---

## LOW / WATCH — track, cheap to handle

- **L1. Regeneration overwrites last-good with no versioning/undo (FR-13).** A bad regenerate (worse parse, changed DB) destroys the prior good deck. Consider keeping the last-good artifact until the new one is confirmed.
- **L2. Guest-deck seam.** Special Song performer and sermon speaker present their *own* PPTX (out of scope, Blueprint 39/41). On the day the operator must exit the generated deck, run a foreign file, and return — a live alt-tab hole. Consider a cue/placeholder divider slide so the operator has an explicit hand-off marker.
- **L3. Concrete parse edge cases** (feed into H3's test corpus): compound role fields, heterogeneous timings, curly quotes in the sermon title, the `The Speaker` forward reference, the date-header parse that drives Service identity/metadata, and the missing-image placeholder already visible on source slide 56.
- **L4. MVP auth build cost (FR-18).** Per-person accounts + two roles is defensible for PII, but hand-rolled auth is a time sink and a security risk for a solo dev. Use a managed/library auth solution; keep it out of the bespoke-code surface.

---

## Scope Challenges (the only places this argues to move a boundary — your call)

The scope is otherwise sound and should hold. These three are raised *with cause* because each directly de-risks a Critical/High finding at low cost:

- **S1 — Pull a *minimal* visual preview into Phase 1.** Not the interactive Phase-2 slideshow: a render-to-image/PDF of the generated deck shown as thumbnails in the hub. **Cause:** it is the single highest-leverage change — it closes C1 (desktop dependency), makes H2/H5 catchable, and turns SM-4/SM-C1 from unobservable into observable during the MVP. Without *some* in-browser way to see rendered slides, Phase 1's error-reduction promise cannot be validated by the people it is meant to empower.
- **S2 — Keep the typed song title as a validation checksum.** Compare typed vs DB-resolved title; flag on mismatch. **Cause:** closes H2 (silent wrong-song) for near-zero cost, using data already in the rundown.
- **S3 — Gather 5–10 historical rundowns + decks before locking parse rules.** **Cause:** the entire parser (H3) is currently fit to n=1; a handful of real specimens is the cheapest possible insurance against designing for a format that doesn't generalize. Do this *before* finalize, not after.

---

## Priority order for the finalize session

1. **C2 / H4 / H5 (pre-work spikes):** decide+prove the font strategy on a clean machine; acquire+validate the Hymnal DB and picoclaw customizability; get church sign-off on fidelity. These are go/no-go for Phase 1.
2. **S1 / C1:** decide whether a minimal render preview enters Phase 1.
3. **H1 / H3 / S2 / S3:** lock the image-binding convention and the unmapped-input surface; keep the title checksum; collect the rundown corpus.
4. **C3 / M5:** write the break-glass fallback and dev-unavailable runbook into §9.
5. **M1:** validate real consent/retention expectations for member PII.
6. **M2 / M3 / M4, then L-items:** early success gate, response-song modeling, Service dedup, then the watch-list.

---

## Resolution log (maintainer decisions, 2026-07-11)

All decisions below are folded into `prd.md` / `addendum.md` and logged in `.memlog.md`.

| Finding | Decision | Folded into |
|---|---|---|
| **C1** no Phase-1 preview | **Accepted.** Priority is de-manualizing; system reliability is the trade. Preview stays Phase 2. | §10 (safety-net note) |
| **C2** font contradiction | **Embed** fonts in the PPTX; else a **standardized, freely-licensed** font installed on the presentation machine. Verify on a clean machine. | §4.2, FR-14, §11, §6 spike |
| **C3 / M5** solo-dev bus factor | **Accepted** by owner (stable system → large net saving). Break-glass: keep the hand-editable master. | §9 |
| **H1** image→role binding | **Ordered images + sender's textual description**; picoclaw binds role/order from it; unresolvable/missing images are flagged. | FR-1, addendum §3/§4 |
| **H2** valid-but-wrong SDAH | **Readback:** the API/picoclaw report the saved result incl. **resolved Hymn titles** so the sender catches a wrong-but-valid number at submit time. | FR-1, FR-2 |
| **H3** parser robustness | General **"unmapped input" + missing-image** visible surface; **collect 5–10 historical Rundowns** before locking rules. | §10, §6 spike |
| **H4** unvalidated deps | **Go/no-go spikes** for Hymnal DB + picoclaw before build. | §6 spike |
| **H5** fidelity as adoption risk | **Church fidelity sign-off** on a sample rebuilt slide set is a Phase-1 pre-req. | §4.2, §6 spike |
| **M1** PII persistence | **Accepted as-is** (role-access + manual delete only; PII persists until manual delete). | §9, §12 |
| **M2** early gate | **Leading gate at ~week 4** added to SM-3. | SM-3 |
| **M3** response songs #671/#684 | **Kept fixed** (matches the slide map). | confirmed, no change |
| **M4** duplicate sends | **Re-send updates** the Service (keyed by date); no duplicate. P1 has no concurrency guard (P3), so a re-send overwrites payload incl. web edits. | FR-1, §6 |
| **L1–L4** | Watch-list; not actioned this round. | — |

**Still requiring follow-through (execution, not PRD text):** run the §6 spikes (Hymnal DB, picoclaw, font-on-clean-machine, fidelity sign-off) and gather the Rundown corpus **before** Phase-1 build begins.
