# Reviewer Gate — rubric walker lens (AD-24 amendment)

- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
- **Intent:** Update run. Change set under review is AD-24 + 6 satellite edits. Report only; no file
  outside `reviews/` was edited.
- **Date:** 2026-07-31
- **Lens:** rubric walker — the good-spine checklist, point by point, then the clause-by-clause
  enforceability walk the brief weights hardest, then the dimension walk.
- **Grounding:** the spine as it stands; `src/app/layout.tsx`, `src/components/ThemeProvider.tsx`,
  `src/components/ThemeToggle.tsx`, `src/lib/use-projected-shell.ts`,
  `src/components/artifacts/ArtifactSlide.tsx`, `src/app/globals.css`, the two full-screen clients,
  `src/lib/auth/*`, `tests/theme-chrome.test.mjs`, `package.json`, and
  `stories/17-1-reachable-dark-mode.md`. Word counts are measured, not estimated.
- **Verdict:** **Conditional pass.** AD-24 is a real decision about a real new dimension, it is
  correctly numbered, and two of its three clauses are enforced by a suite that was itself
  adversarially probed. But the tier clause makes an absolute claim that `src/` already falsifies and
  leaves the one alternative home a future builder will actually reach for unnamed; the enforcement
  clause names one test list where the mechanism has two, so a new room-facing surface can obey AD-24
  to the letter and still ship the exact leak that falsified AC-4; and `[ADOPTED]` is one notch too
  strong for what is literally true.

**Counts:** 0 CRITICAL · 2 HIGH · 6 MEDIUM · 5 LOW (13 findings)

---

## Process-gate preliminaries (all pass)

| Check | Result |
| --- | --- |
| Numbered as the next `AD-n`; nothing renumbered | **pass** — AD-24 follows AD-23; AD-1..AD-23 untouched. `AGENTS.md`'s standing rule honoured. |
| Amendment is the one `AGENTS.md` required | **pass** — story `:89` records the owner's call verbatim: *"add the decision to the spine as the next number, AD-24"*, routed through a `bmad-architecture` Update run rather than an inline edit. That is what happened. |
| `updated:` frontmatter moved | **pass** — `2026-07-30` → `2026-07-31`. |
| `binds:` needs no change | **pass** — Story 17.1 has no PRD FR (story `:124`), Epic 17 is inside `epic-1..epic-20`. |
| New suite registered in `scripts.test` | **pass** — `package.json:10` carries `tests/theme-chrome.test.mjs`, as the *Testing* convention demands. |
| Satellite edits factually accurate | **pass** — `use-projected-shell.ts`, `ThemeProvider.tsx`, `ThemeToggle.tsx` all exist at the paths the Structural Seed tree claims; `next-themes` resolves to exactly `0.4.6`; the *Client state* row and the *Design Paradigm* clause both describe shipped behaviour. |

---

## Checklist walk

| # | Checkpoint | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Fixes the real divergence points the amendment opens, misses none | **partial** | Storage-target, root-boundary and room-facing-closure forks are named. Two are not: the **server-readable cookie** as a fourth persisted home (H1), and **cross-window propagation of a persisted-local value that changes behaviour rather than paint** (M3). |
| 2 | Every Rule enforceable, and no narrower than its *Prevents* | **partial** | Clause 2 and clause 3 both name an asserting suite — good, and the suite was negative-tested spelling by spelling. But clause 3 names `PROJECTED` where the mechanism has `PROJECTED` **and** `FULL_SCREEN` (H2), and clause 1 names no enforcement site at all despite one being a two-line grep (M1). |
| 3 | Nothing under *Deferred* can let two units diverge silently | **partial** | The Story 17.6 provider item is a legitimate declined decision. The scan-ceiling item understates the ceiling it exists to state (H2). The `next-themes` dormancy item contradicts AD-24's own text on whether the decision rests on the library (M4). |
| 4 | Named tech verified-current (light check — the version lens owns this) | **pass** | `next-themes ^0.4.6` resolves to `0.4.6`; the Stack row's own currency claim is disclosed rather than implied, matching the treatment the Node and four-majors-behind rows already get. |
| 5 | Ratifies rather than contradicts the codebase; status tag correct | **fail** | Clause 2 and the three enforcement mechanisms of clause 3 check out line by line against `src/`. Clause 1's *"exactly one of three homes"* is falsified by the shipped session cookie (H1), and clause 3's *"never read … in any form"* is falsified by `globals.css`'s universal rules (M2). By the file's own tag table those make the tag `[ADOPTED, partial]`. |
| 6 | Covers its driving story's acceptance surface | **pass** | AC-1/2/3/4/5 of Story 17.1 all map onto an AD-24 clause or an explicitly-stated non-clause. AC-6/AC-7 are `DESIGN.md`'s, correctly not claimed here. |
| 7 | No AD weakens or contradicts another; overlap carries a stated relationship | **partial** | No contradiction found with AD-1, AD-4, AD-7, AD-10, AD-23. But clause 3's first mechanism restates **AD-12** without naming it, and cites AD-1 — a venue-connectivity decision — as the authority instead (M5). |
| 8 | Every dimension the amendment opens is decided, deferred, or named as open | **partial** | Storage tiering, root boundary, room-facing closure: decided. Cookie tier: **silent** (H1). Cross-window propagation semantics: **silent** (M3). Invalid/unknown persisted-local value: named as noise in the story, silent here (L4). |
| 9 | Structure carried in diagrams; the graphs agree with the AD text | **partial** | Both new edges parse and their labels are accurate. But `-.->` now carries a **third** meaning inside graph 1 (M6) — the previous gate already flagged this arrow's ambiguity across graphs. |
| 10 | Right-sized; no rule too long to read | **partial** | AD-24 **does** follow the restructuring the previous gate prescribed — five labelled sub-bullets on the AD-19 model, not one paragraph. It is nonetheless now the **longest AD body in the file** at 848 words, and obligation density inside each bullet is higher than in the paragraph that was flagged (L1). |

---

## Clause-by-clause enforceability walk

The brief asks each of the three clauses to be judged independently on whether it constrains a
future builder, and against each divergence its *Prevents* claims. Measured that way:

### Clause 1 — three tiers, and the question that picks one

**What it constrains, genuinely:** *"who must agree on it decides which"* is a decision procedure, not
a fact. It gives a builder facing a new persisted value a question with an answer, and it worked
prospectively on the two cases already in the file — `slide_transition` in `settings` because both
renderers must agree, `theme` in `localStorage` because nothing but one operator's eyes depends on it.
The *"not interchangeable in either direction"* sentence is the load-bearing one and it earns its
place: it forbids both failure modes rather than the one that happened.

**Where it stops constraining:**

1. It has **no enforcement site**. Compare AD-5 (`tests/proxy-matcher.test.mjs`), AD-15 (the
   validator), AD-17 (`tests/registry-reseed.test.mjs`), and AD-24's own clause 3
   (`tests/theme-chrome.test.mjs`). The spine's *Testing* convention exists precisely because
   *"AD-5, AD-15 and AD-17 each delegate their enforcement to a suite the spine otherwise never
   described"* — and clause 1 delegates to nothing. This matters more than usual because the
   **finding that produced AD-24 was itself a grep**: story `:89` records
   `grep -rn "localStorage\|sessionStorage" src/` returning zero as the evidence. That grep is the
   gate. It is two lines in a suite that already reads every `.tsx` under `src/`, and it is not
   wired up. → **M1**
2. The Rule's subject is wider than the *Binds* line's. *Binds* says *"every browser-persisted
   operator **preference**"*; the Rule's first sentence says *"**Persisted state** reaches exactly
   one of three homes"*. The gap between those two nouns is where the shipped signed session cookie
   sits — a fourth persisted browser home, governed by AD-5, admitted by neither the Rule nor an
   exclusion. → **H1**
3. It names the library it says elsewhere it does not depend on. → **M4**

### Clause 2 — one root client boundary, and it does not spread upward

**What it constrains, genuinely:** the *upward* half is fully gated. `theme-chrome.test.mjs:375-379`
asserts `layout.tsx` carries no `'use client'`, with a failure message stating the reason. The
pedagogical sentence — *"passing `children` through a client provider does not make them client
components"* — is not padding: it pre-empts two wrong readings that cost different things, and the
paragraph says what each costs. That is the good version of a long rule.

**Where it stops constraining:** the *"exactly one child"* half is **not** gated.
`theme-chrome.test.mjs:364-368` asserts `<ThemeProvider>[\s\S]*{children}[\s\S]*</ThemeProvider>`
matches — a second provider nested inside that pair satisfies the regex unchanged. And the
admissibility bar for a second one, *"only if it genuinely must wrap **every** route"*, is a
judgement with no decision procedure: a `<Toaster />` is conventionally mounted once at the root and
could equally be argued into a shared authenticated layout, and two builders can answer honestly and
differently. AD-24 prevents the boundary moving *up*; it does not prevent it **widening sideways**
into a stack of root providers, which is the same end state by a different route. → **M7**

### Clause 3 — the room-facing surface is closed, and a test is what keeps it closed

**What it constrains, genuinely:** this is the strongest clause in the amendment. Three mechanisms,
each with a stated share the others cannot carry, and the separation is argued from a defect that
actually occurred rather than from symmetry. All three verify:

- literal colours — `ArtifactSlide.tsx:128` `toCssColor(style.fontColor) ?? '#FFFFFF'`, `:181`
  `?? 'transparent'`, `:251` `?? '#000000'`. Every fallback is a literal. Confirmed.
- one shared shell hook — `use-projected-shell.ts` is the only definition, called at
  `ProjectorClient.tsx:96` and `SlideshowClient.tsx:33`, nowhere else. Confirmed.
- the suite as gate — 28 assertions, comment-stripped, every widened guard negative-tested.
  Confirmed, and this is the most credible enforcement delegation in the file.

**Where it stops constraining:**

1. **The rule names one list; the mechanism has two.** *"a new room-facing surface joins its
   `PROJECTED` set in the same change set"* (spine `:212`). But the token guard and edge guard key on
   `PROJECTED` (`theme-chrome.test.mjs:127-138`), while the shell-reset guard keys on a **separate**
   `FULL_SCREEN` array (`:284-287`). A new room-facing surface that obeys AD-24 exactly as written
   joins `PROJECTED`, passes the token and edge guards, is **never asserted to call
   `useProjectedShell()`**, and reintroduces the `html`/`body` strip that falsified AC-4 the first
   time. → **H2**
2. **Neither list is self-closing.** The suite asserts that files *in* `FULL_SCREEN` contain
   `fixed inset-0`; it never asserts the converse. Nothing detects a room-facing surface that joins
   **no** list — and that is not hypothetical, it is what happened: `SlideshowClient` shipped without
   a reset for as long as it existed, and the AD-5 analogy AD-24 leans on is imperfect here in a way
   that matters. A matcher exclusion is a one-line diff in one file a reviewer reads; a new route
   under `src/app/**` announcing itself as room-facing has no chokepoint at all. → folded into **H2**
3. **"never read … in any form, under any setting" is not true.** `globals.css:118-124` applies
   `border-border` through a universal selector and `text-foreground` on `body`, so the projected tree
   *does* receive theme-dependent computed values — 14/14 nodes with a theme-dependent `border-color`
   on the slideshow, 5/11 with a theme-dependent `color` on the projector (test comment `:143-179`,
   story Debug Log `:166-174`). None **paints**. The true invariant is *never paints*, and the text
   half of it is **deliberately unguarded** — the suite says so in as many words: *"No guard is added
   for it here: the invariant lives in that expression."* AD-24 asserts *"a test is what keeps it
   closed"* one sentence after naming a mechanism the test does not cover. → **M2**

---

## Tag audit — is `[ADOPTED]` right?

The file's own table (`:68-70`): `[ADOPTED]` = *"ratified against shipped code. The Rule describes
`src/` as it is."* `[ADOPTED, partial]` = *"the mechanism ships, but a named gap remains. The gap is
recorded in Deferred."* The brief's instruction: if **any** clause is not true of `src/` today, the
tag is wrong.

| Clause | True of `src/` today? |
| --- | --- |
| persisted-shared → SQLite `settings` | **yes** — `slide_transition`, AD-23. |
| persisted-local → `localStorage`, not backed up | **yes** — `theme`, next-themes default key; nothing else. `grep localStorage src/` finds one prose mention and no second writer. |
| ephemeral-shared → AD-10's channel | **yes** — the presenter's live transition override. |
| *"Persisted state reaches **exactly one of three** homes"* | **NO** — `src/lib/auth/session.ts` mints a signed session cookie; `src/app/page.tsx:9` and five sibling pages read it through `cookies()`; AD-5 governs its claims, `Vary: Cookie` its caching. A fourth persisted browser home, shipped, unexcluded. |
| root layout stays a Server Component, one client child | **yes** — `layout.tsx` has no `'use client'`, one `<ThemeProvider>`. |
| `<html>` `suppressHydrationWarning` | **yes** — `layout.tsx:32`. |
| projected tree paints literal colours | **yes** — three literal fallbacks verified. |
| one shared shell hook, no second copy | **yes**. |
| the suite is the gate | **yes, with the `FULL_SCREEN` seam (H2)**. |
| PPTX closed structurally, cannot read browser state | **yes today** — and only while no chrome preference lives in a cookie, which clause 1 does not forbid. |
| *"never read operator chrome state, in any form, under any setting"* | **NO** — see M2. Never *paints*; does *read*, inertly, on every node. |
| the two `.dark` opt-outs are operator surfaces | **yes** — `PresenterOperator.tsx`, `SlideGridDialog.tsx`, guarded by AC-3 assertions. |

**Two clauses fail.** Both are fixable by wording (`paints` for `reads`; name the auth cookie as
excluded and say whether a cookie is an admissible carrier), which is the better repair. Absent that
wording, the file's own taxonomy points at `[ADOPTED, partial]` — and AD-24 already satisfies that
tag's second half, because a gap **is** recorded in *Deferred* at `:384`. AD-6, AD-10 and AD-11 each
carry `[ADOPTED, partial]` plus a `- **The gap …**` bullet for materially the same situation. AD-24
having a Deferred gap and no gap bullet and the unqualified tag is the one place the amendment
departs from the file's established idiom without saying why. → **M2**, **L2**

---

## Overlap and supersession audit

| Seam | Result |
| --- | --- |
| AD-24 ↔ **AD-23** | **clean.** AD-24 cites `slide_transition` as its persisted-shared exemplar and the live presenter override as its ephemeral-shared exemplar. It generalizes AD-23 without altering a word of it, and says so inline. No `Supersedes:` line needed — nothing in AD-23 becomes false. |
| AD-24 ↔ **AD-10** | **clean on the text, thin on one edge.** AD-24's *Prevents* names the BroadcastChannel as one of two existing structural channels and positions itself as closing a third. It does not weaken AD-10. But the mechanism AD-24 documents at `:213` — next-themes syncing across same-origin windows on the `storage` event — **is** cross-window state delivery into a projector window, and AD-10's *"no surface opens its own channel"* does not reach it because it is not a channel. AD-24 closes it for paint only. → **M3** |
| AD-24 ↔ **AD-1** | **weak citation.** AD-24 claims *"the constraint AD-1 and FR-20 already imply."* AD-1's subject is venue connectivity and the offline PPTX guarantee; it implies nothing about visual provenance. FR-20 is the right authority (`prd.md:369` — layout authored in the registry), and the story itself cites FR-20 and the Deck Blueprint, not AD-1. → **M5** |
| AD-24 ↔ **AD-12** | **overlap without a stated relationship.** AD-12 already guarantees the plan carries *"exact rendering coordinates, **fonts, colors**, and resolved text content"* and that a renderer never reads data itself. Clause 3's first mechanism — *"`ArtifactSlide` resolves every colour from the registry through inline `style`"* — is that guarantee restated. AD-24 never names AD-12 or AD-15. The file's idiom for this (AD-12 → *"Specializes AD-7"*, AD-18 → *"AD-9 … is silent on value migration; this decision fills that silence"*) is one clause. → **M5** |
| AD-24 ↔ **AD-4** | **clean.** *"not backed up"* is consistent with, and sharpens, the *Deferred* durability item. |
| AD-24 ↔ **AD-7** | **clean.** Named in *Prevents* as one of the two sanctioned structural channels; nothing in AD-7 is touched. |
| AD-24 ↔ **AD-5** | **the one unstated collision.** AD-5 owns the session cookie's semantics; AD-24 claims all persisted state lands in one of three homes that do not include a cookie. Neither references the other. → **H1** |

---

## Deferred audit — can any of the three new items let two units diverge?

**1. `next-themes` is at head and dormant (`:377`).** Legitimate as a note; the *Deferred* section
already carries the Node row and the four-majors-behind row in the same register. **But it contains a
claim AD-24 contradicts:** *"the AD-24 mechanism survives a replacement, since the decision names the
tiers and the closure rather than the library."* AD-24's clause 1 ends *"`next-themes` **owns** the
`theme` key and the `attribute="class"` contract"*, and the suite pins the library by name three ways
— `attribute="class"`, `defaultTheme="system"`, `enableSystem` (`:386-388`) and an import allowlist
containing the literal `'next-themes'` (`:448`). A replacement is a code change across the provider,
the toggle, four assertions and a Stack row. One of the two statements is wrong; the Deferred one is.
→ **M4**

**2. The second root-level client provider / Story 17.6 (`:383`).** This is the *good* kind of
deferral: the decision (the bar) is made in AD-24, only the instance is open, the instance has an
owning story key, and that key resolves to a registered backlog entry. It also correctly refuses to
pre-answer a product question. No divergence risk **between units** — but note that nothing confines
a second provider to Story 17.6, because clause 2's *"exactly one child"* is ungated (**M7**).

**3. AD-24's closure gate is a static source scan (`:384`).** Right instinct, understated ceiling.
It names two blind spots — a class composed at runtime, and a token arriving via a CSS file — and
misses the larger one: a **new room-facing surface in neither `PROJECTED` nor `FULL_SCREEN` is not
scanned at all**, which is exactly the failure the slideshow already shipped. An item whose stated
purpose is *"named because 'guarded by a test' otherwise reads as airtight"* has to name the hole
that has actually occurred. → folded into **H2**

---

## Dimension walk — what browser-side state opens, and what stays silent

| Sub-dimension | Status |
| --- | --- |
| Where a persisted value lives, and who picks | **decided** — clause 1's three tiers plus the who-must-agree question. |
| Client/server component boundary at the root | **decided** — clause 2, gated on the half that matters most. |
| Room-facing isolation from chrome | **decided and enforced** — clause 3, with the `FULL_SCREEN` seam. |
| **A cookie as a persisted home** | **SILENT** — and it is the natural next reach. The obvious follow-on request after "dark mode" is "no wrong-theme flash on first paint", whose standard fix is a cookie the server reads to stamp the class into the initial HTML. AD-24 neither admits nor forbids it, and it would quietly convert clause 3's *"PPTX … cannot read browser state at all"* from a structural fact into an enforcement obligation. → **H1** |
| **Cross-window propagation of a persisted-local value** | **SILENT for behaviour.** `localStorage` + the `storage` event is simultaneously persisted *and* live-shared across same-origin windows — a hybrid the three tiers do not name. Clause 3 closes what *paints* ("chrome state"); a future persisted-local value that changes room-facing **behaviour** (a blank-screen flag, an auto-advance interval, a remembered slide index) propagates into the projector window live, outside AD-10's channel and without AD-10's plan identity. → **M3** |
| An invalid or unknown persisted-local value | **silent.** The story dismissed it as noise with reasons (upstream next-themes, hand-edited storage, negligible) — defensible for `theme`; unstated as a general posture, where AD-5/AD-8/AD-17 all take an explicit fail-closed stance. → **L4** |
| Storage quota / eviction | not at this altitude. Correctly silent. |
| SSR-vs-client initial paint | out of scope; `suppressHydrationWarning` is named, the flash question is AC-2's and is met. |

---

## Readability — did AD-24 follow the previous gate's prescription?

The previous gate's M1 asked for **restructuring into labelled sub-rules on the AD-19 model, not
cutting** (`review-rubric-walker-2026-07-30-update-b.md:483-486`). Measured against that:

| AD | Body words | Longest single bullet | Structure |
| --- | --- | --- | --- |
| AD-19 | 804 | 270 | 4 labelled `Rule — …` bullets |
| AD-16 | 774 | **681** | one paragraph (the flagged case) |
| AD-21 | 571 | 191 | 4 labelled bullets |
| AD-22 | 568 | **494** | one paragraph (the flagged case) |
| **AD-24** | **848** | **189** | **5 labelled bullets** |

**The prescription was followed.** AD-24 has no 400-word paragraph; its longest bullet is 189 words,
in the same band as AD-19's and AD-21's sub-rules, and every bullet carries a `Rule — …` or
`Why …` label that says what it decides. This is not AD-16's problem in a new number.

Two qualifications. First, AD-24 is now the **longest AD body in the file**, past AD-19 (804) and
AD-16 (774) — so the structural fix arrived without any restraint on total volume, in a decision
whose subject is one browser preference. Second, obligation density *inside* each bullet is higher
than in the paragraph that was flagged: the 189-word tier bullet holds eight separable obligations
(one per ~24 words) against AD-16's flagged ~12 in 432 (one per ~36). The bullets are readable; they
are not individually checkable line by line. → **L1**

**A premise in the brief does not hold, recorded so the number is not carried forward:** there is no
`AD-25` in this file — the highest is AD-24, which this change set added. The two longest bodies
before the amendment were AD-19 (804) and AD-16 (774); the previous gate's own measurement was of
`- **Rule:**` lines only (AD-16 432, AD-22 440) and AD-16's Rule has grown to 681 since.

---

## Diagram check

Both new edges parse and both labels are accurate:

```
Operator -->|"AD-24: chrome preference, this browser only, not backed up"| Theme[("localStorage.theme")]
Theme -.->|"AD-24: closed -- literal colours + one shared shell reset"| Projector
```

`[( )]` is a valid cylinder shape and matches the `DB`/`Settings` idiom already used for stores —
good, `localStorage` reads as a store at a glance.

The problem is the arrow. In graph 1, `-.->` already means *a real channel carrying real messages*:
`WebShow -.->|"AD-10 BroadcastChannel + plan identity"| Projector`. The new edge uses the same arrow
to mean *a path that must not exist*. Graph 2 uses `-.->` for prohibition (`Web -.->|no registry or
snapshot access| Snap`), which is why the previous gate flagged the arrow as carrying opposite
meanings **across** the two graphs (its M3). This amendment reproduces that ambiguity **inside graph
1**, where a reader now cannot tell a live alternate transport from a forbidden one — and the
forbidden edge is drawn pointing *at* the projector, which reads as flow. → **M6**

---

## Findings

### H1 — Clause 1's *"exactly one of three homes"* is falsified by the shipped session cookie, and the cookie tier a future builder will reach for is unnamed

`ARCHITECTURE-SPINE.md:210`. The Rule opens *"Persisted state reaches exactly one of three homes"* and
enumerates SQLite `settings`, `localStorage`, and AD-10's channel. A fourth persisted browser home
ships: the signed session cookie minted in `src/lib/auth/session.ts`, read through `cookies()` at
`src/app/page.tsx:9` and five sibling pages, carrying `role`/`sid`/`tv` claims whose semantics AD-5
owns and whose caching AD-5 pins with `Vary: Cookie`. Neither AD references the other.

The wording gap is visible inside AD-24 itself: *Binds* scopes to *"every browser-persisted operator
**preference**"* while the Rule quantifies over *"**persisted state**"*. Two costs:

- **Factual.** The clause is not true of `src/` today, which is what the `[ADOPTED]` tag asserts.
- **Prospective, and concrete.** The natural follow-on to Story 17.1 is eliminating the first-paint
  flash for a returning operator, and the standard fix is a cookie the server reads to stamp `.dark`
  into the initial HTML. That value would be persisted-local in intent and server-readable in
  mechanism. Clause 1 does not admit it, forbid it, or route it — and it would silently downgrade
  clause 3's *"The PPTX is closed **structurally** … it is generated on the server and cannot read
  browser state at all"* from a structural fact to an enforcement obligation, because a cookie can be
  read on the server by `pptx.ts`'s route as easily as by a page.

**Fix.** Two sentences. Exclude the auth cookie by name (it is not a preference and AD-5 owns it),
and state whether a cookie is an admissible persisted-local carrier. If it is, say that clause 3's
PPTX closure becomes enforced rather than structural, and give it a guard.

### H2 — The closure clause names `PROJECTED` where the mechanism has `PROJECTED` and `FULL_SCREEN`, so a compliant new surface can ship the leak that falsified AC-4

`ARCHITECTURE-SPINE.md:212`: *"a new room-facing surface joins its `PROJECTED` set **in the same
change set**, exactly as AD-5 requires of a new matcher exclusion."* The suite has two lists:

- `PROJECTED` (`tests/theme-chrome.test.mjs:127-138`) → token guard, edge guard, import-closure guard,
  `className` guard.
- `FULL_SCREEN` (`:284-287`) → the `useProjectedShell()` assertion, i.e. the **shell** guard.

A new room-facing surface added to `PROJECTED` only — which is precisely what AD-24 instructs — gets
every guard except the one whose absence produced the defect. `SlideshowClient` was in that exact
state until 2026-07-31: literal `bg-black` inside, no shell reset, and `body` showing as a strip down
the edge of the projected screen that followed the operator's theme live, mid-service.

Compounding it, **neither list is self-closing.** The suite asserts files *in* `FULL_SCREEN` contain
`fixed inset-0`; it never asserts the converse, so a surface in *no* list is unscanned. The *Deferred*
item at `:384` that exists to state this gate's ceiling names only a runtime-composed class name and a
token arriving through a CSS file — it does not name the unregistered-surface hole, which is larger,
mechanically closable in part (a route-scoped converse check), and has already happened once.

**Fix.** Name both sets in the clause — *"joins `PROJECTED` **and, if it is full-screen,
`FULL_SCREEN`**"* — and add the unregistered-surface ceiling to the Deferred item so *"guarded by a
test"* is bounded honestly.

### M1 — Clause 1 delegates enforcement to nothing, in a spine whose Testing convention exists because ADs delegate to suites

The one-line grep that discovered this whole amendment (`grep -rn "localStorage\|sessionStorage" src/`
→ zero, story `:89`) is the natural gate for *"a second browser-persisted preference extends that
mechanism rather than standing one up beside it."* It is not wired up, in a suite that already walks
every `.tsx` under `src/` for the `className` guard. As written, a component that calls
`localStorage.setItem` directly tomorrow violates AD-24 and nothing notices — and the *Testing*
convention's own rationale sentence (`:225`) enumerates AD-5, AD-15 and AD-17 as the delegating ADs
and was not updated to include AD-24, the most test-dependent of the four.

### M2 — *"never read … in any form, under any setting"* overstates, and the sentence it overstates hides the one unguarded mechanism

`ARCHITECTURE-SPINE.md:212`. `globals.css:118-124` applies `border-border` through `* { }` and
`text-foreground` on `body`, so every node in the projected tree computes a theme-dependent
`border-color` and text nodes compute a theme-dependent `color` — 14/14 and 5/11 respectively, measured
in the browser (test comment `:143-179`, story `:166-174`). Nothing paints: preflight leaves
`border-width: 0`, and every text node inherits an inline colour from `ArtifactSlide.tsx:128`'s
`?? '#FFFFFF'`. So the invariant is *never **paints***, and the text half of it is guarded by **no
test at all** by explicit decision — *"No guard is added for it here: the invariant lives in that
expression"*. AD-24 states the strong absolute and then says *"a test is what keeps it closed"*,
which is true of the edge half and false of the text half. Repair the verb (`paints`), and name the
text invariant as resting on that expression rather than on the suite. Same repair is needed in the
*Client state* convention row (`:223`), which propagates the overclaim as *"Room-facing surfaces read
none of it."*

### M3 — Persisted-local's cross-window propagation is a sync channel the tiers do not name, and the closure is scoped to *paint*

AD-24 documents the mechanism itself at `:213`: next-themes *"syncs across same-origin windows on the
`storage` event and a projector window is same-origin."* That makes persisted-local simultaneously
*persisted* and *live-shared across windows* — a hybrid the three tiers do not admit, since the tiers
are keyed on *who must agree* and this one changes what a second window sees without anybody agreeing
to anything. Clause 3 closes it for **chrome that paints**. It does not reach a persisted-local value
that changes room-facing **behaviour**: a blank-screen flag, an auto-advance interval, a remembered
index. Any of those would reach the projector window live, outside AD-10's channel and therefore
without AD-10's plan identity — the second-channel hazard AD-10 exists to forbid, arriving from a
direction AD-10's text does not cover because a `storage` event is not a channel anyone opened.
One sentence closes it: persisted-local is for values **no other window reads**, and anything a second
window must observe is ephemeral-shared and travels over AD-10's channel.

### M4 — The `next-themes` Deferred item contradicts AD-24 on whether the decision rests on the library

`:377` — *"the AD-24 mechanism survives a replacement, since the decision names the tiers and the
closure rather than the library."* Against `:210` — *"`next-themes` **owns** the `theme` key and the
`attribute="class"` contract that `globals.css:5`'s `@custom-variant dark` is keyed on"* — and against
the suite, which pins `attribute="class"`, `defaultTheme="system"`, `enableSystem`
(`theme-chrome.test.mjs:386-388`) and an import allowlist containing the literal `'next-themes'`
(`:448`). Both statements cannot stand. The accurate one is AD-24's: a replacement touches the
provider, the toggle, four assertions, a Stack row and a `globals.css` contract. The Deferred item
should say *the tiers and the closure survive a replacement; the mechanism is a code change with a
named blast radius*.

### M5 — Clause 3's first mechanism restates AD-12 without naming it, while citing AD-1, which does not imply it

*"the constraint AD-1 and FR-20 already imply"* (`:212`). AD-1's subject is venue connectivity and the
offline PPTX guarantee; it implies nothing about where a slide's colours come from. The decision that
does is **AD-12**, which already promises the plan carries *"exact rendering coordinates, **fonts,
colors**, and resolved text content"* and that no renderer reads data itself — which is clause 3's
first mechanism verbatim in substance. AD-15 backs it on validation. Neither is cited anywhere in
AD-24. The file's idiom is one clause (*"Specializes AD-7"*, *"AD-9 … is silent on value migration;
this decision fills that silence"*), and its absence leaves a reader unable to tell whether AD-24 is
adding a guarantee or enforcing one AD-12 already made. It is the latter, and saying so makes the
clause shorter, not longer.

### M6 — The new dashed edge gives `-.->` a third meaning inside the graph that already had two

`:272`. `Theme -.->|"AD-24: closed …"| Projector` means *this path must not exist*; two lines above,
`WebShow -.->|"AD-10 BroadcastChannel + plan identity"| Projector` means *this path exists and carries
messages*. The previous gate flagged this arrow's ambiguity **across** the two graphs (its M3); the
amendment now reproduces it **within** graph 1, and draws the forbidden edge pointing at the
projector, which reads as flow. Either use a distinct notation for prohibition consistently, or drop
the edge and keep the prohibition where it is enforceable — in AD-24's text and the suite.

### M7 — Clause 2 gates *"does not spread upward"* but not *"exactly one child"*

`theme-chrome.test.mjs:361-380` asserts no `'use client'` in `layout.tsx` and children inside
`<ThemeProvider>`; a second provider nested in that pair passes unchanged. The admissibility bar
(*"genuinely must wrap **every** route"*) has no decision procedure — a toast root is conventionally
mounted once at the root and could equally be argued into a shared authenticated layout. So the clause
prevents the boundary moving *up* and does not prevent a stack of providers accumulating *at* the root,
which is the same end state. The Deferred item routes the question to Story 17.6, but nothing confines
a second provider to that story.

### L1 — AD-24 follows the prescribed restructuring and is nonetheless the longest AD in the file

848 body words against AD-19's 804 and AD-16's 774. Five labelled sub-bullets, longest 189 words — so
the previous gate's fix was genuinely applied and this is not AD-16's defect renumbered. But total
volume was not restrained, and the tier bullet packs eight separable obligations into 189 words (one
per ~24) against AD-16's flagged one-per-~36. The *"Why the shell clause is separate"* bullet (144
words) is the most compressible: its argument is already made in `use-projected-shell.ts`'s own header
comment, which the spine could cite.

### L2 — A gap is recorded in *Deferred* and the tag carries no `partial`, breaking the file's own idiom without saying why

The tag table defines `[ADOPTED, partial]` as *"the mechanism ships, but a named gap remains. The gap
is recorded in Deferred."* AD-24 has a gap recorded in *Deferred* (`:384`, the scan ceiling) and no
`- **The gap …**` bullet. AD-6, AD-10 and AD-11 all take the partial tag plus a gap bullet for
materially the same shape. The distinction AD-24 is implicitly drawing — an *enforcement ceiling* is
not a *mechanism gap* — is defensible and is nowhere stated. One clause in the tag table or in AD-24
resolves it for every future AD.

### L3 — `[ADOPTED]` is claimed against an uncommitted working tree while the same change set's `DESIGN.md` was required to state its closure as contingent

`git status` shows `ThemeProvider.tsx`, `use-projected-shell.ts` and `theme-chrome.test.mjs` as
untracked and `layout.tsx` as modified; Story 17.1 is at status `review`. The spine's own usage of
`[ADOPTED]` means *in `src/`* rather than *deployed* (AD-4 records that no deployment exists), so this
is consistent with house practice — but the same change set forced `DESIGN.md` Open Item 2 to state
that *"its closure is contingent on this change set landing"* (story `:101`). The asymmetry is worth
one clause, not a re-tag.

### L4 — No posture for an invalid persisted-local value

The story dismissed the hand-edited `localStorage.theme` case as noise with reasons, correctly for
`theme`. AD-24 states nothing general, in a spine where AD-5 (503/401), AD-8 (fail-closed resolver)
and AD-17 (a corrupt row fails closed, logged with id and reason) all take an explicit posture on
unparseable input. Persisted-local is the one storage tier with no such statement, and it is the tier
whose contents an operator can edit by hand.

### L5 — The *Testing* convention's rationale sentence was not updated

`:225` ends *"This convention is here because AD-5, AD-15 and AD-17 each delegate their enforcement to
a suite the spine otherwise never described."* AD-24 now delegates more of itself to a suite than any
of those three. Mechanical, same-change-set omission.

---

## What the amendment gets right, recorded because a findings list reads as a verdict

- **The three-tier taxonomy is the right shape of decision.** It answers a question (*who must agree*)
  rather than listing a fact, it forbids both directions of misplacement rather than the one that
  happened, and it retro-fits the two values already in the file without straining.
- **Clause 2's pedagogy is load-bearing, not padding.** It names both wrong readings and what each
  costs. That is the difference between a rule and a reminder.
- **Clause 3's three-mechanism split is argued from a defect, not from symmetry**, and the *"Why the
  shell clause is separate"* bullet explains why a token scan structurally could not see the leak — a
  width utility carrying no token name, painting on `html`/`body`, outside every client tree a
  component-level check can enumerate. That paragraph is the most useful prose added to this file in
  this change set.
- **The suite it delegates to is the most credible in the repo.** 28 assertions, comments stripped
  before matching, twelve edge spellings and four token spellings negative-tested one at a time. AD-24
  leaning on it is justified — the seam is which *list* the rule names, not whether the suite works.
- **The satellite edits are all accurate.** Every path in the Structural Seed tree exists, the Stack
  row's resolved version is exact, and the *Design Paradigm* clause states the non-contagion fact
  correctly rather than hand-waving it.

---

## Recommended repair set (smallest change that clears the gate)

1. **H1** — exclude the auth cookie by name in clause 1; state whether a cookie is an admissible
   persisted-local carrier, and if so that the PPTX closure becomes enforced rather than structural.
2. **H2** — name `FULL_SCREEN` alongside `PROJECTED` in clause 3; add the unregistered-surface hole to
   the Deferred ceiling item.
3. **M2** — `paints` for `reads`; name the text half as resting on `ArtifactSlide.tsx:128` rather than
   on the suite. Mirror both into the *Client state* convention row.
4. **M3** — one sentence: persisted-local is for values no other window reads; anything a second
   window must observe is ephemeral-shared.
5. **M4** — correct the `next-themes` Deferred item to say the tiers and the closure survive a
   replacement while the mechanism is a code change with a named blast radius.
6. **M5** — cite AD-12 (and AD-15) as the decisions clause 3 enforces; drop AD-1.
7. **M6, M7, L1–L5** — one line each; none blocks.

None of these is a re-decision. Every one is a wording or citation repair on a decision that is
substantively right.
