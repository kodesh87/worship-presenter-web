---
baseline_commit: 66bb33ba2d6b63542f6a9a6a54e40b0a51b3d28f
---

# Story 17.5: The Presenter Knows When the Projector Is Gone

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> **Gated before implementation.** AC-2 is an architecture gate: this story's `PresentMessage`
> extension does not get written until a `bmad-architecture` Update run has added the next `AD`
> number ratifying it. Owner's decision, 2026-08-05, taken up front rather than discovered at
> review — the same gate stopped Story 17.1 reaching `done` twice.

## Story

As an operator presenting to a congregation,
I want the presenter to tell me the moment the projector window stops answering,
so that I cannot advance a deck for the rest of a service with nothing on the second screen.

## Acceptance Criteria

1. **The wire gains one acknowledgement message, in `present-channel.ts` and nowhere else, and it carries no shared state.** `PresentMessage` (`src/lib/present-channel.ts:19-38`) gains exactly one new variant that the **projector** sends and the **presenter** only ever observes — an unprompted liveness heartbeat, e.g. `{ type: 'projector-alive' }`. It carries **no `index`, no `blank`, no `transition`, and no other deck state**. That is the file's own header contract applied rather than a new rule — *"The Presenter is the single authority"* (`:3-18`) — because a message travelling projector→presenter that carried deck state would invite the presenter to follow the screen it exists to drive. The ack is the projector **reporting its own liveness, never driving state.** Two consequences are asserted rather than assumed: `blankStateOf` returns `null` for the new type (which the `msg.type === 'sync' || msg.type === 'blank'` shape at `:50-53` already gives it — the test pins it so a later edit cannot widen it) and `liveTransitionOf` returns `null` for it likewise (`:71-77`). **First contact needs no new message and must not get one:** `ProjectorClient` already posts `request-sync` on mount (`ProjectorClient.tsx:83`) and the presenter's listener already receives it (`PresenterOperator.tsx:361-367`), so that existing message *is* the projector announcing itself and this story starts **recording** it rather than adding a second hello. **No server realtime channel, no WebSocket, no SSE, no HTTP polling** — `epics.md:320`, AD-10 (`ARCHITECTURE-SPINE.md:118-122`). **AD-10's `[TARGET]` plan-identity clause is out of scope and must not be partly implemented:** adding an identity field while nothing verifies it would leave the spine's own gap looking closed (`:122`, `:429`).

2. **The wire change is gated on a `bmad-architecture` Update run that adds the next `AD` number, and that run lands first.** Owner's decision (2026-08-05): extending the shared cross-window message shape is a structural change and is ratified in the spine **before** the code is written, not reconciled after. The run adds the **next unused** `AD` — **`AD-29`**, verified during context creation: the spine carries 28 `### AD-` headings and the highest is `AD-28` (`ARCHITECTURE-SPINE.md:245`) — and **renumbers nothing** (`AGENTS.md`: *never renumber an existing `AD-n`, add the next one*). Three things the new `AD` must ratify, and they are the acceptance test for the run:
   - **the ack's message shape** — one variant, state-free, on the single `@/lib/present-channel` channel AD-10 already fixes;
   - **who may send it** — the projector only, unprompted, while it is mounted; the presenter observes and never emits it;
   - **that the presenter remains the single authority** — the reverse direction reports liveness and nothing else, so AD-10's single-controller property is unchanged by the addition.

   **This is not the story context's edit to make and was not made here:** `ARCHITECTURE-SPINE.md` is untouched by this change set. An inline spine edit instead of the Update run is the exact failure `AGENTS.md` and Story 17.1's two blocked `done` attempts already paid for. Implementation of AC-1 does not begin until `AD-29` exists.

3. **The liveness verdict is one predicate in one pure `.ts` module — both inputs feed the same evaluator, and a second independent mechanism fails this AC.** A new framework-agnostic module (e.g. `src/lib/projector-liveness.ts` — no React, no `window`, no imports) owns the whole decision and returns one of exactly three states: **`never-opened`** (no projector has announced itself in this presenter session), **`live`** (the projector is answering), **`lost`** (it was answering and is not now). **The acknowledgement staleness check and the retained-handle `closed` read are two *inputs* to that one evaluation, never two mechanisms with two verdicts.** This is a stated constraint, not an implementation preference: a reviewer must be able to fail an implementation in which the poll maintains its own state, sets its own flag, or renders its own message. Shape: a reducer over `(state, event, nowMs)` whose events are the observable facts — *a projector message arrived*, *the poll saw the handle `closed`*, *the freshness window elapsed* — with **every time value injected and `Date.now()` never read inside the module**, so `node:test` can drive a whole service's timeline deterministically. This is `project-context.md:56` with its own precedents named: `theme-cycle.ts`/`nextTheme` and `canvas-dirty-guard.ts` are the two shipped instances, and `src/lib/use-slide-transition.ts` is the precedent for the thin `'use client'` hook that may wrap it. The freshness window and the heartbeat interval are **named constants exported from that module** and consumed by both windows, so the projector cannot heartbeat slower than the presenter's patience.

4. **Where the two inputs disagree, the acknowledgement wins for life and the handle wins for death.** Three rules, each independently testable, and each closing a way the naive version gets it wrong:
   - **Acks arriving ⇒ `live`, whatever the handle says.** No handle at all, or a handle that is stale or `null`, does not override evidence that something is answering. **`projectorRef.current === null` is not evidence of death and may never be treated as such.**
   - **Handle reports `closed` ⇒ `lost` immediately**, without waiting out the freshness window. A clean window close is the common case and must be reported in well under a second rather than after a timeout.
   - **No acks for longer than the freshness window ⇒ `lost`**, even while a handle is held and reports `closed === false`.

   The reason the ack is primary is three verified cases where a live projector has no usable handle: the operator opened it through the popup-blocked fallback anchor (`PresenterOperator.tsx:482-496`, `target="_blank"` — nothing retains that window); the Presenter component remounted or its tab reloaded, which is the case the file's own comment already names (`:105-111`, *"a Presenter reload that lost the handle"*); and the window crashed, froze or navigated away, where `closed` stays `false` while the window has stopped answering. Today the `closed` read happens **only** inside `openProjector`, i.e. only if the operator clicks the button again (`epics.md:317`, `PresenterOperator.tsx:271-287`) — this AC is what makes it continuous. Any timer added here is registered and cleared in the same effect, on `use-slide-transition.ts:51,106`'s `timerRef`-plus-cleanup pattern; nothing may outlive an unmount.

5. **The presenter surfaces lost sync visibly, distinctly from the popup blocker, and it clears itself when a projector answers again.** While the verdict is **`lost`**, the presenter shows a persistent, unmissable line in its own header region announcing that the projector is not answering, pointing at the recovery that already exists — the same `Open projector` control (`:468-470`), which focuses an existing window or opens a new one at the stable window name (`:103`, `:112-114`). Five bounds, each a way this AC can be got wrong:
   - **It is not `projectorBlocked`.** That state is the popup blocker and nothing else (`epics.md:318`); its banner at `:482-496` stays exactly as it is, and the two states are independent — either, both, or neither may show.
   - **`never-opened` shows nothing.** A presenter opened without a projector must be silent; a surface that warns before anything was opened trains the operator to ignore it.
   - **It clears on the next sign of life, with no operator step.** Reopening the projector re-attaches over one `request-sync` round trip (`EXPERIENCE.md:240`), and that message alone must return the verdict to `live`.
   - **It never blocks the deck.** No modal, no disabled transport, no focus steal. The operator may have to keep going, and the guaranteed fallback is the offline PPTX (AD-1), which is not on this surface.
   - **It states the recovery, not the cause** (`EXPERIENCE.md:91`) — the operator is told the projector is not answering and what to do, never that a heartbeat timed out.

   **The projector renders nothing about liveness, and the symmetric feature is forbidden rather than merely out of scope.** This story reports the projector's health *to the operator*. A *"presenter disconnected"* notice on the room-facing screen would put an operator-console concern in front of the congregation, which Epic 17's own preamble forbids (`epics.md:284`) and which AD-24's closure reads the same way. The projector's only change is the outbound heartbeat in AC-1. There is one narrow exception already on the books and it is **not** this story's to build: AD-10's `[TARGET]` plan-identity clause is what licenses a room-facing refusal message, and only for a receiver holding a different plan (`ARCHITECTURE-SPINE.md:121`).

6. **Regression coverage is fail-first, calls the real logic, and is registered.** The pure module from AC-3 is exercised by direct calls over a driven clock: the three states, every transition between them, **both** routes into `lost` (window elapsed; handle `closed`), all three precedence rules from AC-4 including *acks win over a null handle*, the `never-opened` silence, and the return to `live` on a bare `request-sync`. The wire half belongs in `tests/present-channel.test.mjs`, which already owns exactly these questions (*"which messages are authoritative, which must leave the receiver alone"* — `:1-10`) and is **already registered**, so extending it carries no registration risk; a separate file for the state machine is equally fine **but is appended to `package.json`'s `scripts.test` list in the same change set** — an unregistered test file never runs, locally or in CI, and nothing detects the omission (`project-context.md:84`, named there as the single highest-cost omission in this repository). The wiring `node:test` structurally cannot execute — there is no DOM harness and no `jsdom`/`@testing-library` in `package.json` — is covered by the TypeScript-AST/comment-stripped-source style `tests/theme-chrome.test.mjs` and `tests/canvas-dirty-guard.test.mjs` already use, never by a second runner. **One of those AST assertions is AC-3's teeth:** the poll's reading must reach the shared evaluator rather than a second state holder. **Each new guard is proved to react** by injecting the defect it claims to catch and confirming the suite goes red (`project-context.md:86`).

7. **`tests/theme-chrome.test.mjs`'s chromatic-hue list is reconciled in the same change set if — and only if — a new chromatic text utility lands.** `UNPAIRED_CHROMATIC_TEXT` (`:2632-2661`) pins **four** `text-amber-300` sites in `PresenterOperator.tsx` and is compared as a **sorted multiset in both directions** (`:2688-2697`): a fifth unpaired chromatic text site fails the suite, and so does an entry left behind after a fix. The bracket annotation is stripped before comparison (`:2690`), so the line numbers inside it are documentation — they do not need repairing when this story's edits shift them, but they **may not be left pointing at the wrong line either** (`project-context.md:99` — a file:line citation is a claim and it rots). **Preferred order:** reuse a colour that already states both halves, or a token, before adding a hue; the presenter pins `dark` on its own wrapper (`:449`) so it cannot express a `dark:` half at all, which is why its amber sites are pinned rather than paired. If amber is the right answer for *the room has lost the deck*, add the site with its citation and this story's AC as the owning key, exactly as the four existing entries do.

8. **The artifacts this story closes are synchronized in the same change set, and nothing else in them moves.** `EXPERIENCE.md` is this story's authority home — it names *Story 17.5* in three places and `DESIGN.md` names it in none (verified: no `17.5`/`17-5` match anywhere in `DESIGN.md`):
   - **`EXPERIENCE.md:153`** — the *⚠ Lost sync — designed, not shipped* presenter-state row becomes a shipped row stating the behaviours, on the closure convention this file already uses (what was true before, what changed, the evidence). The presenter state count stays **five** (`:140`) — this row already exists.
   - **`EXPERIENCE.md:310-312`** — Open Item 1 (*"The projector can die and the presenter will not notice"*, owner Story 17.5) is closed with evidence, following the shape Open Item 3 uses at `:316-320`.
   - **`EXPERIENCE.md:240`** — Flow 3's Branch 3a first beat stops being *"designed, not shipped"*; the rest of that branch already describes what ships.
   - **`EXPERIENCE.md:157`** — the *Interaction Primitives* bullet opens *"Presenter → projector is one-way over a single `BroadcastChannel`"*. That was already loose (`request-sync` has always travelled the other way) and this story makes it plainly false, so it is corrected to state that the reverse direction carries the projector's hello and its heartbeat while the presenter remains sole authority over deck state, citing `AD-29`. **The plan-identity half of that same bullet is not this story's and is left saying exactly what it says.**
   - **`epics.md`** — the Story 17.5 label (`:308`) and the Epic 17 summary line (`:280`), leaving the other story statuses in that line untouched. The story block's *Constraint* paragraph (`:320`) gains the resolved mechanism and a pointer to `AD-29`, since that block is the declared single source for this story's evidence (`:313`).
   - **`ARCHITECTURE-SPINE.md`** — amended by **AC-2's Update run only**. Not by this change set, not inline, not "while the file was open".
   - **`DESIGN.md` is touched only if a visual delta lands.** A new affordance in the presenter's control area is a visual delta under `AGENTS.md`'s four-artifact rule; a line reusing the existing warning treatment is not a new component identity. **If a new chromatic utility ships, the amber inventory at `:98` and Open Item 4's counted grep at `:236-246` are both stale that moment** — `:98` enumerates the presenter's amber sites by name and Open Item 4 records *"45 uses at 6 shades in 8 files"* over a quoted grep, and that item's own history is four wrong counts. Update both, or introduce no new utility; do not update one.
   - **No IA-table row.** This story adds no route and no surface, so `EXPERIENCE.md:38-50` does not move.

9. **Repository verification is clean in the supported environment.** On Node.js 22.x (`>=22.12`): the new/extended test file(s), `npx tsc --noEmit`, the public-repository guard, and the full registered suite (`npm test`) all pass. `npm run lint` introduces no new problem against a **freshly measured** baseline — 32 problems was the clean-tree measurement on 2026-08-05, but re-measure rather than trusting it, and a count in the thousands means a worktree was linted rather than the repo (`project-context.md:97`). If the implementation machine has no Node 22, say so plainly and cite the PR's Node 22 CI run as this AC's evidence, exactly as Story 17.3 did — local Node 24 results are disclosure, not proof.

## Tasks / Subtasks

- [x] Clear the architecture gate before writing the wire change (AC: 2)
  - [x] Run `bmad-architecture` (Update intent) to add `AD-29` — next unused, nothing renumbered — ratifying the ack's shape, that only the projector sends it, and that the presenter remains the single authority.
  - [x] Confirm the heading count went 28 → 29 and that no existing `AD-n` moved.
  - [x] Do not start AC-1 until it has landed.

- [x] Establish fail-first regression coverage (AC: 6)
  - [x] Create the pure liveness module (`src/lib/projector-liveness.ts` or similar): three states, the reducer over `(state, event, nowMs)`, the two exported cadence constants. No React, no `window`, no imports.
  - [x] Size the two cadence constants against a stated background-tab throttling assumption (see Dev Notes) and record the outcome in the Dev Agent Record — either the assumption and why the constants tolerate it, or a `deferred-work.md` entry with a reason and an owner. Do not leave this unstated.
  - [x] Extend `tests/present-channel.test.mjs` for the wire half: the new type resolves to `null` through both `blankStateOf` and `liveTransitionOf`, and carries no deck state.
  - [x] Cover the evaluator by direct calls over a driven clock — three states, both routes into `lost`, all three AC-4 precedence rules, `never-opened` silence, recovery to `live` on a bare `request-sync`.
  - [x] Add the AST assertion that AC-3 needs teeth for: the poll's reading reaches the shared evaluator and no second liveness state is held in the component.
  - [x] If a new test file is created, append it to `package.json`'s `scripts.test` list in the same change set.
  - [x] Run the new test(s) before implementing and confirm they fail. Record the output for the Dev Agent Record.

- [x] Extend the wire (AC: 1) — after AC-2 has landed
  - [x] Add the single acknowledgement variant to `PresentMessage`, documented in the file's own voice: why it carries no state, why `request-sync` is first contact rather than a second hello, and citing `AD-29`.
  - [x] Make `ProjectorClient` emit it on an interval while mounted, registered and cleared in one effect. Do **not** tear down or re-open the channel for it, and do not add it as a dependency of the existing effect — that effect is pinned to `[serviceId]` for a stated reason (`ProjectorClient.tsx:46-55`).

- [x] Wire the presenter's observation and the single verdict (AC: 3, 4)
  - [x] Record every inbound projector message — the new heartbeat **and** the existing `request-sync` — as evidence, inside the listener that already exists (`PresenterOperator.tsx:361-367`), without changing how `request-sync` is answered.
  - [x] Add the `closed` poll over the retained handle, feeding the **same** evaluator; treat `null` as *no information*.
  - [x] Implement the three precedence rules; keep no second copy of them in the component.

- [x] Surface it (AC: 5)
  - [x] Render the lost-sync line in the presenter header region, independent of `projectorBlocked`, silent in `never-opened`, clearing on the next sign of life, blocking nothing.
  - [x] Confirm `projectorBlocked`'s existing banner and behaviour are byte-for-byte unchanged.

- [x] Reconcile the theme guard (AC: 7)
  - [x] Prefer a paired colour or a token. If a new chromatic text utility lands, add the site to `UNPAIRED_CHROMATIC_TEXT` with its citation and this story's AC, and re-check that the four existing bracket annotations still point at the right lines.
  - [x] Run `tests/theme-chrome.test.mjs` and confirm it is green for the right reason, not because the multiset happened to match.

- [x] Prove every new guard reacts (AC: 6)
  - [x] Inject each defect the guard claims to catch, one at a time; confirm red; revert. Tabulate in the Dev Agent Record.

- [x] Synchronize the artifacts (AC: 8)
  - [x] `EXPERIENCE.md`: the Lost sync row (`:153`), Open Item 1 (`:310-312`), Branch 3a's first beat (`:240`), and the *one-way* wording in *Interaction Primitives* (`:157`) — leaving that bullet's plan-identity half exactly as written.
  - [x] `epics.md`: Story 17.5 label, the Epic 17 summary line, and the resolved mechanism plus the `AD-29` pointer in the story block's *Constraint* paragraph.
  - [x] `DESIGN.md`: only on a visual delta, and then `:98` **and** Open Item 4 (`:236-246`) together.
  - [x] Confirm `ARCHITECTURE-SPINE.md` carries no edit from this change set — its amendment is AC-2's run — and that no IA-table row moved. State both conclusions in the record rather than leaving them implied.

- [x] Run supported verification and complete the record (AC: 9)
  - [x] `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/<new>.test.mjs tests/present-channel.test.mjs tests/theme-chrome.test.mjs`
  - [x] `npx tsc --noEmit`
  - [x] `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
  - [x] `npm test` on Node 22 (`npm ci` then `npm run build` first if the native ABI/build state is stale — `tests/auth-http.test.mjs` spawns the built server and needs `.next`).
  - [x] `npm run lint` against a freshly measured baseline — zero new findings.
  - [x] Inspect the final diff against the expected file list below. Update the Dev Agent Record, File List and Change Log.

### Review Findings

Two rounds ran. **Round 1** raised the three `[High, blocking]` items below, all fixed in the
`bmad-dev-story` FIX-mode round recorded in the Dev Agent Record. **Round 2** re-read the fixed tree,
confirmed all three closed, and raised the fourth item — a citation-accuracy defect the fix round had
itself created. No round-2 finding touched behaviour.

- [x] [Review][Patch] **[High, blocking] Non-projector channel traffic is accepted as a liveness acknowledgement** [src/app/services/[id]/present/PresenterOperator.tsx:408] — the listener dispatches `ack` for every object received, before it inspects `msg.type`. A second Presenter tab on the same service posts its mount-time `sync` at `:414`; the first tab receives that presenter-authored state message and becomes/remains `live` with no projector. This violates AD-29's projector-only sender rule and its false-`live` prohibition. Record liveness only for the two projector-originated protocol types (`request-sync` and `projector-alive`) and add a regression case with two Presenter endpoints/no projector.
  - **Fixed:** added `isProjectorMessage(msg)` to `src/lib/present-channel.ts` (the wire's own owner of "who sends what") and gated the `ack` dispatch in `PresenterOperator.tsx`'s `onMessage` on it, so `sync`/`blank`/`transition`/`scripture`/`clear-scripture` — a second Presenter tab's own broadcasts — never register as evidence of a live projector. Corrected the false `AD-29` comment that claimed every inbound object was evidence of life. **Proof:** `tests/present-channel.test.mjs` — `isProjectorMessage` unit test (RED without the export: `TypeError: isProjectorMessage is not a function`; GREEN after) exercises all seven message variants including the exact two-Presenter-tabs case. `tests/projector-liveness.test.mjs` — an AST assertion confirms the `ack` dispatch is reached only through a guard naming `isProjectorMessage` (RED against the unconditional call; GREEN after).

- [x] [Review][Patch] **[High, blocking] A projector that never answers after the operator opens it stays silently `never-opened` forever** [src/app/services/[id]/present/PresenterOperator.tsx:312] — `openProjector` records only a `Window` handle; it supplies no event to the evaluator. The poll therefore emits only `tick`, and `nextLivenessState` returns unchanged whenever `lastAckAtMs` is `null` [src/lib/projector-liveness.ts:127]. A popup/tab that loads an older build, cannot create a channel, or freezes before its mount-time `request-sync` is never surfaced, contrary to AD-29's explicit rule that a receiver that never acknowledges resolves to `lost`. Feed the operator's open/fallback attempt into the one evaluator (without inventing a fourth verdict) and test this no-first-ack path.
  - **Fixed:** added a fourth reducer event, `{ type: 'opened' }` (verdicts stay exactly three), to `src/lib/projector-liveness.ts`. `openProjector` dispatches it on every open/reattach attempt; the reducer records `openedAtMs` only while `verdict === 'never-opened'`, and the `tick` branch — only when no ack has ever arrived — now resolves `never-opened` to `lost` once the freshness window has elapsed since that attempt, the same "uncertainty resolves to lost" rule AD-29 already applied to a stale handle. **Proof:** `tests/projector-liveness.test.mjs` new test "an open attempt that never acks resolves to lost, not never-opened forever" — RED before the fix (`actual: 'never-opened', expected: 'lost'`), GREEN after; companion tests confirm an attempt still within the window stays `never-opened` and an ack after an attempt still resolves to `live`.

- [x] [Review][Patch] **[High, blocking] The advertised recovery action cannot reconnect a nonresponding window whose handle remains open** [src/app/services/[id]/present/PresenterOperator.tsx:313] — the exact crashed/frozen/navigated-away case AC-4 identifies can keep `existing.closed === false` while acknowledgements stop. Once the evaluator correctly reports `lost`, clicking the header's instructed recovery merely calls `existing.focus()` and returns [src/app/services/[id]/present/PresenterOperator.tsx:314-316]; it neither navigates that named window back to `projectorUrl` nor opens a replacement. Make `Open projector` reattach/navigate when the liveness verdict is `lost`, and cover a stale-ack + `closed === false` handle.
  - **Fixed:** `openProjector` now checks `livenessRef.current.verdict === 'lost'` in the open-but-not-closed branch and, only then, sets `existing.location.href = projectorUrl` (same-origin navigation of the retained handle) before `.focus()`, reattaching a frozen/crashed/navigated-away window instead of merely bringing it to the front. A healthy (`live`) handle is unaffected — it is still just focused, with no unnecessary reload. **Proof:** `tests/projector-liveness.test.mjs` new AST assertion confirms `openProjector`'s source both tests `verdict === 'lost'` and reads `existing.location` (RED against the original focus-and-return body; GREEN after).

- [x] [Review][Round 2][Patch] **[Low, AC-7 accuracy] The guard's own bracket citations rotted a second time, under the fix round's edits** [tests/theme-chrome.test.mjs:2653-2660] — the implementation pass had repaired the four `UNPAIRED_CHROMATIC_TEXT` citations for `PresenterOperator.tsx` to `:546`/`:590`/`:672`/`:792` and filed the new lost-sync entry at `:567`. The fix round then added the `opened` event dispatch, the `isProjectorMessage` guard and the reattach branch to the same file, pushing every one of those five lines down again. The guard still passed — it matches on the class names, and the bracket text is deliberately stripped before comparison (`:2694`) — so nothing failed, which is exactly why a reviewer had to catch it: AC-7's requirement is that a reader can *check* the claim, and five citations pointing at the wrong lines defeat that silently.
  - **Fixed:** all five entries repaired to `:583`, `:604` (the lost-sync line), `:627`, `:709`, `:829`. **Proof:** not a test — the guard structurally cannot react to a stale bracket, and weakening it to parse citations was out of scope for this story. Verified by direct measurement instead: `grep -n "text-amber-300" src/app/services/[id]/present/PresenterOperator.tsx` returns exactly those five lines and no sixth, re-run at record-repair time on 2026-08-05. Recorded here as an uncovered narrowness rather than as a passing claim; no `deferred-work.md` entry was filed for it, because that file is held at zero `owner: unassigned` entries (Story 17.1's closing condition) and choosing an owner is not this record repair's call.

## Dev Notes

### The mechanism decision, and why it is the AC rather than a suggestion

`epics.md:320` permits **either** a `closed` poll on the retained window handle **or** an acknowledgement added to `present-channel.ts`. The owner resolved it on 2026-08-05 to **both, with the ack primary**, on evidence gathered during context creation:

- The story statement says the presenter must report when the projector *"stops answering"* (`epics.md:310`). Answering is an acknowledgement property. A window handle can only report whether *this* window object was closed.
- The handle is written in exactly one place, `openProjector` (`PresenterOperator.tsx:282`), so three real situations produce a live projector the poll cannot see — the popup-blocked fallback tab, a Presenter remount, and a crashed/frozen/navigated-away window. AC-4 lists them; they are the whole reason the ack leads.
- The reverse direction is **already on the wire**: `ProjectorClient` posts `request-sync` (`ProjectorClient.tsx:83`) and the presenter answers it (`PresenterOperator.tsx:361-367`). An ack therefore does not newly invert authority — it formalises a direction that already exists.

The owner also fixed the shape of the solution, and AC-3 states it so review can enforce it: **one evaluator, one predicate.** Two mechanisms with two verdicts is how the surface ends up showing *lost* while acks are arriving, or *live* while the window is shut — and it is how the next reader cannot tell which one is authoritative.

### What `AD-29` has to say, and why it comes first

Owner's decision, same day: the `PresentMessage` extension is ratified in the spine **before** it is coded. AC-2 carries it. Two things to keep straight while doing it:

- **AD-10 is not being changed or contradicted.** It already requires that *"no surface opens its own channel name or message shape"* (`ARCHITECTURE-SPINE.md:121`), so putting a new variant in `@/lib/present-channel` is obedience to it. What needs its own `AD` is the thing AD-10 does not say: that the channel now carries a **projector→presenter liveness report**, who may emit it, and that this does not make the projector a second controller.
- **Nothing is renumbered.** Verified during context creation: 28 `### AD-` headings, highest `AD-28` (`:244`), so the new one is `AD-29`. `AGENTS.md` is explicit, and this project's own history is why — bare `AD-2..AD-5` in an Epic-16 context resolve to four entirely different decisions after the 2026-07-30 fold-in, which is a hazard the spine now needs an AD-map table to undo.

### Scope and authority

- **`EXPERIENCE.md` owns this story, and it says so in three places.** The presenter-state row (`:153`), Open Item 1 (`:310`) and Flow 3's Branch 3a (`:240`) each name *Story 17.5*. `DESIGN.md` names it nowhere — verified — so this story opens no `DESIGN.md` Open Item and touches that file only under AC-8's visual-delta condition. Same split Story 17.4 documented for itself, in the same epic.
- **`epics.md:313` declares its own block the single source for the evidence**, and `EXPERIENCE.md` Open Item 1 points there rather than repeating it (`:310`). All four of that block's bullets were re-verified against `src/` on 2026-08-05 — see below.
- **No PRD functional-requirement ancestry, by recorded decision.** Epic 17's preamble (`epics.md:284`) places operator-chrome self-presentation under `DESIGN.md`/`EXPERIENCE.md` rather than a PRD FR, and nothing here alters a Deck, a Slide Type or a payload contract. The epic's binding constraint — *"whatever an operator's theme, the projected output must be byte-identical"* — is untouched: this story adds nothing to the projected tree, and the projector's only change is an outbound message. `PresenterOperator.tsx` is in **none** of the four room-facing lists in `tests/theme-chrome.test.mjs` (`PROJECTED` `:595-606`, `ROUTE_SHELLS` `:946-949`, `FULL_SCREEN` `:1559-1562`, and the inline pair feeding the `className` guard), because it is an operator surface. Do not add it to any of them. `ProjectorClient.tsx` **is** in `PROJECTED` and `FULL_SCREEN` — so a `console.log`, a theme token, an edge-width utility or a `className` prop added there will turn that guard red; the heartbeat must be a bare `postMessage` on an interval and nothing more.

### The four bullets, checked (2026-08-05)

`epics.md:315-318`, each re-read at the cited source rather than taken on trust:

1. **`BroadcastChannel` gives the sender no delivery signal** (`:315`) — confirmed by construction. `broadcast` is `channelRef.current?.postMessage(msg)` and returns nothing (`PresenterOperator.tsx:289-291`); `postMessage` has no completion or acknowledgement semantics. This is *why* AC-1 needs a message rather than a return value.
2. **`present-channel.ts` defines no heartbeat and no acknowledgement** (`:316`) — confirmed. The union has six variants: `sync`, `request-sync`, `blank`, `transition`, `scripture`, `clear-scripture` (`present-channel.ts:19-38`). None is an ack.
3. **`projectorRef.current.closed` is read only inside `openProjector`** (`:317`) — confirmed, and the cited lines are exact: `PresenterOperator.tsx:271-276` is the `const existing = projectorRef.current; if (existing && !existing.closed) { existing.focus(); return; }` guard, inside a callback that ends at `:287`. A repo-wide grep for `.closed` in `src/` returns that one site and nothing else.
4. **The only surfaced projector state is `projectorBlocked`** (`:318`) — confirmed. `useState(false)` at `:252`, set only from `opened === null` at `:285`, rendered only as the popup-blocker banner at `:482-496`. There is no other projector-state anything on this surface.

### The wire contract this story extends — read it before touching the union

`present-channel.ts:3-18` is a header contract, not a comment, and two clauses bear directly on AC-1:

- *"The Presenter is the single authority. Every message that touches shared state carries the **intended** value rather than an instruction to flip one"* — the acknowledgement touches **no** shared state, which is what puts it outside this rule instead of in tension with it. If a reviewer asks why the ack carries no index, that sentence is the answer, and `AD-29` is where it is ratified.
- *"a late or duplicated message is idempotent"* — an unprompted heartbeat is idempotent by construction: two in one window, or one arriving late, both mean the same thing (*something was alive at that moment*). Do not design a sequence number or a request/response pairing that would break that property.

`blankStateOf` (`:50-53`) and `liveTransitionOf` (`:71-77`) are the two readers, and their asymmetry is deliberate and documented (`:55-70`): absent `blank` resolves to `false`, absent `transition` resolves to `null`. The new type must land in the *"says nothing about it"* branch of **both** — which the current shapes already give it, and AC-6 pins so a future widening cannot silently change it.

### The projector side, and the one thing not to disturb

`ProjectorClient.tsx:56-88` is the channel effect and it is **deliberately pinned to `[serviceId]` alone**. Its own comment says why (`:46-55`): `goTo` is re-created on every live transition change, and re-keying the effect on it would tear the channel down and re-open it mid-service, dropping whatever the Presenter sent in the gap — which is what `goToRef` exists to avoid. The heartbeat interval therefore lives inside that same effect, or in its own effect with its own cleanup; it must not become a new dependency of that effect. `useProjectedShell()` (`:96`) and everything in the render tree below `:109` are out of scope entirely.

### The presenter side — where each piece goes

`src/app/services/[id]/present/PresenterOperator.tsx` (777 lines, read in full during context creation):

- **The listener already exists and already receives the projector's messages.** `:346-375` opens the channel once per service and `:361-367` is `onMessage`, which today acts only on `request-sync`. Recording evidence of life belongs there. Do **not** change how `request-sync` is answered — `currentState()` (`:354-359`) reads refs rather than rendered values for a stated reason, and `request-sync` must keep answering with the full surface state including `blank` (`project-context.md:72`; a projector that missed a message otherwise stays stuck, which is the failure adjacent to this story's own).
- **Refs, not state, for anything a listener or timer reads.** `indexRef`/`blankRef`/`transitionRef` (`:254-256`) exist because the listener is installed once per service and would otherwise close over mount-time values. A last-seen timestamp has the same hazard and wants the same treatment.
- **The handle lives at `:259`** (`projectorRef`) and is assigned only at `:282`. AC-4's poll reads it; nothing else may write it.
- **Where the line renders.** The header already carries a `basis-full` warning row for `projectorBlocked` (`:482-496`) inside the `<header>` at `:450-497`, and the live-transition mismatch line at `:595-602` is the same shape one level down. Either is defensible; the header is the better home, because this is a *state of the second screen* rather than a note about a control. **Only one of those two carries `role="status"` today — the live-transition line (`:596`); the `projectorBlocked` banner does not (verified, `:482-496`).** Give the new lost-sync line `role="status"` on the live-transition line's precedent rather than assuming both already do it.
- **Do not touch:** the keyboard handler (`:377-405`), the scroll-follow effect (`:411-417`), `setIndexAndSync`/`setBlankAndSync`/`setTransitionAndSync` (`:293-344`), `pushScripture` (`:424-446`), the filmstrip, the slide list, `SlideGridDialog`. None has a liveness concern, and the epic's discipline through 17.2/17.3/17.4 is a diff scoped to exactly what the AC names.

### The guard hazard that will bite this story

`tests/theme-chrome.test.mjs` sweeps **every** `.tsx` and `.ts` under `src/` for a chromatic text shade with no `dark:` half, per class value, and compares the offenders against `UNPAIRED_CHROMATIC_TEXT` as a **sorted multiset in both directions** (`:2663-2698`). Four `text-amber-300` sites in `PresenterOperator.tsx` are pinned today (`:2653-2656`). Consequences, both real:

- A **fifth** unpaired chromatic text utility anywhere in that file turns the suite red until it is pinned with a citation and an owning key.
- Removing or re-colouring one of the four existing sites *also* turns it red, because a fixed-but-still-listed entry fails by design (`:2694-2696`).

The bracket annotation is stripped before comparison (`:2690`), so a line-number shift caused by this story's edits does **not** break the test — which is exactly why it will rot silently, and `project-context.md:99` makes re-checking it part of the change rather than a courtesy.

### Previous story intelligence

- **Story 17.4** (`17-4-canvas-dirty-state-guard`, done 2026-08-04) is the closest structural sibling: an in-memory, nothing-persisted, browser-event-driven guard on an operator surface, with the decision logic extracted to a pure `src/lib/*.ts` module so `node:test` could call it, the wiring covered by AST assertions, and **thirteen injected defects each proved to turn the suite red before the green run was trusted**. Follow that shape. Its review also produced the lesson most applicable here: the single real finding was a **state machine that reported the wrong thing at a boundary** — a flag that said *clean* over discarded work. This story's boundary is the freshness window, and a verdict that says *live* while the room sees nothing is the identical class of defect. That is what AC-6's driven-clock tests exist to catch.
- **Story 17.4 also recorded what it deliberately did not cover** (browser Back/Forward) in `deferred-work.md`, with a reason, rather than quietly leaving it out. If AC-4's three blind spots turn out to have a fourth — a projector on a second machine, a browser that throttles or suspends timers in a background window — record it there with a reason and an owner rather than widening the story to chase it. **Background-tab timer throttling is the one worth checking early**: a presenter window that loses focus while the operator reads the run sheet must not report a live projector dead, and the heartbeat/window constants are where that tolerance is set. **This check's outcome is not optional to record:** state in the Dev Agent Record either that the chosen constants were sized against a stated throttling assumption (cite it) and why that is enough, or that the gap is real and filed in `deferred-work.md` with a reason and an owner. Silence on it is not a third option.
- **Story 17.1 was blocked from `done` twice by exactly the gate AC-2 pays up front** — an inline `ARCHITECTURE-SPINE.md` edit that the owner ruled had to go through a `bmad-architecture` Update run instead. Do not repeat it, in either direction: no inline spine edit, and no *"the run can happen after the code"*.
- **Story 17.3** (done 2026-08-05) supplies AC-9's precedent: local runs on Node 24 are disclosure, and the Node 22 gate is satisfied by naming the PR's CI run. It also spent three review rounds on **stale prose and rotted citations in its own story file**, which is why every file:line here was resolved during context creation and why AC-7/AC-8 make citation repair part of the work.
- **Nothing in this epic has touched `src/lib/present-channel.ts`, `ProjectorClient.tsx`, or the channel effect in `PresenterOperator.tsx`.** Git history on this branch (`66bb33b` back through `2a63362`, `466679d`, `fffc62c`, `94d2b7b`) shows Epic 17 work confined to `layout.tsx`, the canvas editor, `Header`, the theme files and the guards. This story is the first in the epic to change a cross-window contract, which is both why AC-2 exists and why the **full** suite matters rather than the focused files: `tests/present-channel.test.mjs`, `tests/presenter-model.test.mjs` and `tests/transitions.test.mjs` all read this area.

### Testing Standards

- Supported runtime: Node.js 22.x (`>=22.12`). `node:test` + `node:assert/strict` only — never Jest or Vitest, and no second runner (`project-context.md:79-80`).
- Implementation is imported via `pathToFileURL` into `src/**/*.ts` under `--import ./tests/register-ts-resolve.mjs --experimental-strip-types`; `tests/present-channel.test.mjs:11-30` is the shape to copy, including its hoisted top-level `await import` above the first `test()` — `tests/canvas-dirty-guard.test.mjs` records a real Node-22-vs-24 timing divergence that this hoisting avoids.
- There is **no** DOM harness: no `jsdom`, no `@testing-library/*` in `package.json` (verified). A real `BroadcastChannel` round trip between two windows, a real interval and a real `window.closed` are therefore **not** executable here — which is the whole reason AC-3 demands the rules live in a pure module with an injected clock. What remains unexecutable is covered by AST/source assertions and, if the owner wants the confidence Story 17.4 ended with, by a browser pass recorded in the Dev Agent Record rather than by a new runner.
- Focused commands:
  `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/present-channel.test.mjs`
  `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/theme-chrome.test.mjs`
  `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
- Full suite `npm test`; types `npx tsc --noEmit`; lint `npm run lint`.
- **A new test file is appended to `package.json`'s `scripts.test` list in the same change set** — the single highest-cost, structurally undetectable omission in this repository (`project-context.md:84`).
- **Prove every guard reacts** before trusting a green run (`project-context.md:86`).

### Project Structure Notes

- Expected implementation files:
  - `src/lib/present-channel.ts` — UPDATE: one new `PresentMessage` variant, documented in the file's own voice, citing `AD-29`. No change to `blankStateOf`, `liveTransitionOf`, `presentChannelName` or `openPresentChannel`.
  - `src/lib/projector-liveness.ts` (or similar) — NEW: three states, the single evaluator, the two cadence constants. Framework-agnostic and import-free.
  - `src/lib/use-projector-liveness.ts` (optional) — NEW: a thin `'use client'` hook binding the module to timers, on `use-slide-transition.ts`'s pattern, if the wiring reads better outside the component.
  - `src/app/services/[id]/present/PresenterOperator.tsx` — UPDATE: record inbound projector messages as evidence, the `closed` poll feeding the same evaluator, the verdict, the surfaced line.
  - `src/app/services/[id]/present/projector/ProjectorClient.tsx` — UPDATE: emit the heartbeat while mounted. Nothing else — this file is in `PROJECTED` and `FULL_SCREEN`.
  - `tests/present-channel.test.mjs` — UPDATE: the wire half.
  - `tests/projector-liveness.test.mjs` (if created) — NEW, **registered in `package.json`**.
  - `tests/theme-chrome.test.mjs` — UPDATE only under AC-7's condition.
  - `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md` — `AD-29`, added by **AC-2's `bmad-architecture` Update run**, in its own change set ahead of the code. Not edited by the implementation change set.
  - `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` — UPDATE: `:153`, `:240`, `:157`, Open Item 1 at `:310-312`.
  - `_bmad-output/planning-artifacts/epics.md` — Story 17.5 label, the Epic 17 summary line, and the *Constraint* paragraph's resolved mechanism plus `AD-29` pointer.
  - this story file and `_bmad-output/implementation-artifacts/sprint-status.yaml` — normal tracking updates.
  - `_bmad-output/implementation-artifacts/deferred-work.md` — only if something real is deferred, with a reason and an owner.
- **Not in this list, deliberately:** `src/app/services/[id]/present/page.tsx` and `projector/page.tsx` (Server Components; they read `getSlideTransition()` and pass slides — no liveness concern), `presenter-model.ts`, `SlideGridDialog.tsx`, `SlideView.tsx`, `src/app/layout.tsx`, `DESIGN.md` (unless AC-8's condition fires), and anything under `src/lib/registry/` or `src/lib/artifacts/`.
- **No database, schema, settings key, API route or migration.** Liveness is per-session and persisted nowhere, in either window. Under `AD-24` (`ARCHITECTURE-SPINE.md:205-211`) that is the **ephemeral-shared** tier, which is AD-10's channel — and explicitly **not** `localStorage`. `AD-24:211` closes the tempting shortcut in advance: *"`localStorage` is a cross-window channel, and that does not make it AD-10's"* — a last-seen timestamp written to storage so the other window can read it slips past both of AD-10's prohibitions while doing AD-10's job. Do not do it.

### Latest technical/library notes

- **No Next.js API is in scope, and that was checked rather than assumed.** Both windows are existing Client Components (`PresenterOperator.tsx:1`, `ProjectorClient.tsx:1`); this story adds `BroadcastChannel` messages, an interval and a `window.closed` read — plain browser APIs, all already used in this repository. No router API, no `Link`, no metadata, no Server Component boundary moves, so no guide under `node_modules/next/dist/docs/` governs this change. If implementation finds itself reaching for a Next API, read the relevant guide first, per `AGENTS.md`.
- **React 19.2.4 / Next 16.2.10:** a timer in an effect with a cleanup is the shipped pattern here (`use-slide-transition.ts:51,106`, `HymnNumberAutocomplete.tsx:233`). Note the repo's own lint experience from Story 17.4: a **synchronous `setState` inside an effect** is a `react-hooks` error under this configuration (*"Calling setState synchronously within an effect can trigger cascading renders"*), which is why 17.4 moved a state clear out of its mount effect. A verdict computed in an effect and then set will hit the same rule; prefer setting it from a timer callback or an event handler.
- **`BroadcastChannel` delivers to other same-origin contexts but never to the sender**, which is what makes an unprompted heartbeat from the projector observable by the presenter with no echo suppression. It is also why `openPresentChannel` returning `null` where the API is absent (`present-channel.ts:83-88`, asserted at `tests/present-channel.test.mjs:38-46`) must keep meaning *no liveness information* rather than *the projector is gone*.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md:308-320`] — Story 17.5's own block: the user story (`:309-311`), the single-source declaration (`:313`), the four evidence bullets (`:315-318`), and the AD-10 constraint naming the two permitted mechanisms and warning that extending `PresentMessage` is a wire change (`:320`).
- [Source: `_bmad-output/planning-artifacts/epics.md:280,284`] — Epic 17 status line and the recorded decision that this epic's requirement ancestry is `DESIGN.md`/`EXPERIENCE.md` rather than a PRD FR, plus the byte-identical-projected-output constraint.
- [Source: `src/lib/present-channel.ts:1-88`] — the whole file. Header contract (`:3-18`), the six-variant `PresentMessage` union (`:19-38`), `blankStateOf` (`:50-53`), the documented asymmetry (`:55-70`), `liveTransitionOf` (`:71-77`), `presentChannelName` (`:79-81`), `openPresentChannel` (`:83-88`).
- [Source: `src/app/services/[id]/present/PresenterOperator.tsx:1-777`] — read in full. `PROJECTOR_FEATURES` `:103`, the stable-window-name rationale `:105-111`, `projectorWindowName` `:112-114`, `projectorBlocked` state `:252`, refs `:254-259`, `openProjector` `:271-287` (the `closed` read at `:272-276`, the handle write at `:282`, the blocked set at `:285`), `broadcast` `:289-291`, `setIndexAndSync` `:293-310`, `setBlankAndSync` `:318-325`, `setTransitionAndSync` `:337-344`, the channel effect `:346-375` (`currentState` `:354-359`, `onMessage` `:361-367`), keyboard `:377-405`, the dark wrapper `:449`, the header `:450-497`, the *Open projector* control `:468-470`, the popup-blocked banner `:482-496`, the live-transition warning line `:595-602`, the scripture error line `:716`.
- [Source: `src/app/services/[id]/present/projector/ProjectorClient.tsx:1-151`] — read in full. The `goToRef` rationale for pinning the channel effect to `serviceId` alone (`:46-55`), the effect itself (`:56-88`), the mount-time `request-sync` post (`:83`), `useProjectedShell()` (`:96`).
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md:118-122`] — AD-10 in full: the single-channel rule, *no surface opens its own channel name or message shape*, the no-server-realtime-channel prohibition, and the `[TARGET]` plan-identity gap this story does not close.
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md:205-211`] — AD-24's three tiers, placing per-session liveness in **ephemeral-shared**, and the `:211` clause forbidding `localStorage` as a substitute for AD-10's channel.
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md:245`] — `AD-28`, the highest existing decision heading; 28 headings counted, which is what makes AC-2's new decision `AD-29`.
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md:447`] — *Deferred*: the plan-identity hazard is live now and is *"sequencing, not an open question"* — recorded so this story does not accidentally half-close it.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:153`] — the *⚠ Lost sync — designed, not shipped* presenter-state row, *Owner: Story 17.5*, and its statement that AD-10 leaves the presenter as the only thing that can report this.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:310-312`] — Open Item 1, which points at `epics.md` for the evidence and records that the prior four-state item was verified on 2026-07-30 with lost sync the one that does not exist.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:140,149-153`] — the five presenter states, including *Projector blanked* and *Popup blocked*, which bound what AC-5 may and may not disturb.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:157`] — the *Interaction Primitives* bullet whose *one-way* wording AC-8 corrects, and whose plan-identity half this story leaves alone.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:240`] — Flow 3 Branch 3a: the projector dies, the first beat is unshipped, and the re-attach on one `request-sync` round trip that AC-5's clearing behaviour must match.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md:91,316-320`] — the *errors state the recovery, not the cause* rule, and Open Item 3's closure shape, which AC-8's closures follow.
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md:98,202,236-246`] — the amber inventory naming the presenter's three amber affordances, the *Presenter transition control* component row, and Open Item 4's counted grep — the three places a new chromatic utility would go stale.
- [Source: `tests/present-channel.test.mjs:1-156`] — the wire's own suite: what it already asserts about which messages are authoritative and which must leave the receiver alone, the `openPresentChannel` → `null` case at `:38-46`, and the hoisted top-level `await import` shape to copy.
- [Source: `tests/theme-chrome.test.mjs:595-606,946-949,1559-1562,2597-2698`] — the four room-facing root lists (`ProjectorClient.tsx` is in two of them; `PresenterOperator.tsx` is in none), and the chromatic-text guard with `UNPAIRED_CHROMATIC_TEXT`, its four pinned presenter sites, and the both-directions multiset comparison.
- [Source: `src/lib/use-slide-transition.ts:1-60`] — the `'use client'` hook + pure-table split, and the `timerRef`/cleanup pattern any new interval follows.
- [Source: `_bmad-output/implementation-artifacts/stories/17-4-canvas-dirty-state-guard.md`] — previous story in this epic: the pure-module + AST-assertion split, the thirteen injected-defect probes, the disclosed-deviation convention, the `deferred-work.md` habit for what is deliberately uncovered, and the review finding that a state machine misreporting a boundary is the failure mode to design against.
- [Source: `_bmad-output/implementation-artifacts/stories/17-3-app-metadata.md`] — the Node 22 CI-evidence convention for AC-9, and the citation-rot lesson that shaped AC-7/AC-8.
- [Source: `_bmad-output/implementation-artifacts/sprint-status.yaml:148-162`] — Epic 17's tracking block, the note recording why 17.5 was created by the 2026-07-30 `bmad-ux` Update run (*"the only finding of that run that was a code gap rather than a documentation defect"*), and Story 17.1's two spine-gate blocks that AC-2 pays up front. Line numbers are as at 2026-08-05, after this change set widened the block.
- [Source: `_bmad-output/project-context.md:56,65,72,79-87,97,99`] — logic-in-a-`.ts`-module rule; *presenter↔projector sync uses `BroadcastChannel`, do not introduce a server realtime channel*; the `request-sync`-answers-with-full-state rule; the testing rules and the unregistered-file hazard; the lint-baseline caveat; and the file:line-citations-rot rule.
- [Source: `package.json`] — the authoritative `scripts.test` file list, and the dependency set confirming no `jsdom`/`@testing-library` and nothing new to add for this story.

## Dev Agent Record

### Story Context Completion

Ultimate context engine analysis completed — comprehensive developer guide created. Verified during context creation on 2026-08-05: all four of `epics.md`'s evidence bullets re-checked at their cited sources, including a repo-wide grep for `.closed` that returns the single site the epic names; `src/lib/present-channel.ts`, `PresenterOperator.tsx` and `ProjectorClient.tsx` read in full; `tests/present-channel.test.mjs` and the relevant regions of `tests/theme-chrome.test.mjs` read, including the four room-facing root lists (`ProjectorClient.tsx` in two, `PresenterOperator.tsx` in none) and the chromatic-text multiset guard that will react to a fifth unpaired site; AD-10 and AD-24 read in the spine along with the *Deferred* plan-identity entry, and the AD heading count taken (28, highest `AD-28`) so AC-2 names the next number correctly; all four `EXPERIENCE.md` locations that name this story located by line; `DESIGN.md` confirmed to name Story 17.5 nowhere; Stories 17.4 and 17.3 read for continuity and for the injected-defect, deferral, Node-22 and citation conventions; git history checked to confirm no prior work on this concern; and the absence of any DOM harness in `package.json` confirmed, which is what fixes the pure-module-with-injected-clock test strategy. **The one decision this context could not take itself was escalated and answered:** the detection mechanism and the spine route are the owner's, recorded in AC-2, AC-3 and the Change Log.

### Agent Model Used

claude-opus-5, effort medium (bmad-create-story, 2026-08-05)
claude-sonnet-5 (bmad-dev-story, 2026-08-05)

### Debug Log References

Fail-first confirmation (AC-6): `tests/projector-liveness.test.mjs` written and run against a
repo with no `src/lib/projector-liveness.ts` and no wiring in `ProjectorClient.tsx` /
`PresenterOperator.tsx` — `ERR_MODULE_NOT_FOUND` on the missing module (1 test file failure), then
after the pure module landed: 13/17 passing, 4 wiring-AST failures (`AC-6: ProjectorClient emits
the heartbeat...`, `AC-1: ProjectorClient posts the ack...`, `AC-3/AC-4: PresenterOperator reads
liveness...`, `AC-4: the closed poll never treats a null handle...`) — all four closed by the
ProjectorClient/PresenterOperator wiring in that order, confirmed green after each.

Ten injected-defect probes (AC-6, "prove every new guard reacts"), each confirmed red then
reverted:

| # | Defect | Where | Test(s) that went red |
|---|---|---|---|
| 1 | `ack` cannot revive a `lost` verdict | `projector-liveness.ts` reducer | "an ack wins for life...", "recovery from a stale-window lost..." |
| 2 | `handle-closed` waits out the freshness window instead of firing immediately | `projector-liveness.ts` reducer | "the handle reporting closed is lost immediately...", "an ack wins for life..." |
| 3 | Initial verdict is `lost` instead of `never-opened` | `projector-liveness.ts` `INITIAL_LIVENESS_STATE` | "a presenter session starts never-opened", "never-opened stays silent..." |
| 4 | Freshness comparison inverted (`<` instead of `>`) | `projector-liveness.ts` tick branch | 5 tests, every rule that depends on the freshness window |
| 5 | Closed poll treats a null/absent handle as evidence of death (`!ref \|\| ref.closed`) | `PresenterOperator.tsx` poll | "the closed poll never treats a null handle..." — **this one first passed against the original (too-loose) AST assertion; the test was tightened to check the guard's actual binary-AND structure rather than a substring match before this defect was confirmed to react** |
| 6 | Heartbeat effect gains a new dependency (`[serviceId, transition]`) | `ProjectorClient.tsx` | "ProjectorClient emits the heartbeat...inside the pinned effect" |
| 7 | Heartbeat carries deck state (`{ type: 'projector-alive', index }`) | `ProjectorClient.tsx` | "ProjectorClient posts the ack as a bare, state-free message" |
| 8 | A second, independent liveness flag (`isProjectorLive`) added beside the shared evaluator | `PresenterOperator.tsx` | "PresenterOperator reads liveness through the shared evaluator, not a second copy" |
| 9 | `blankStateOf` wrongly resolves `projector-alive` to `false` instead of `null` | `present-channel.ts` | "projector-alive says nothing about blank or transition" |
| 10 | A sixth, unregistered chromatic site (`text-rose-300`) added beside the lost-sync line | `PresenterOperator.tsx` | "every chromatic text shade states both halves, or is a filed exception" |

`grep -rn "INJECTED DEFECT" src/ tests/` returns nothing — all ten fully reverted.

### Completion Notes List

**AC-1 (wire, state-free ack).** `src/lib/present-channel.ts` gains exactly one new
`PresentMessage` variant, `{ type: 'projector-alive' }`, documented in the file's own voice and
citing `AD-29`. No `index`/`blank`/`transition`/other field. `blankStateOf` and `liveTransitionOf`
already resolve it to `null` through the existing `msg.type === 'sync' || msg.type === 'blank'` /
`msg.type !== 'sync' && msg.type !== 'transition'` shapes — pinned by two new tests in
`tests/present-channel.test.mjs` rather than requiring a code change to those two functions.
`request-sync` is unchanged; no second hello was added. Verified: `tests/present-channel.test.mjs`
14/14 (12 pre-existing + 2 new).

**AC-2 (architecture gate).** Cleared before this run started — `AD-29` was already in
`ARCHITECTURE-SPINE.md` (heading at `:262`, census 28 → 29, nothing renumbered) from a prior
`bmad-architecture` Update run. `ARCHITECTURE-SPINE.md` was **not** touched by this change set
(`git diff --stat` on it shows nothing from this session) — verified rather than assumed.

**AC-3/AC-4 (one evaluator, precedence).** `src/lib/projector-liveness.ts` (NEW): three states
(`never-opened`/`live`/`lost`), one reducer `nextLivenessState(state, event, nowMs)` over three
events (`ack`, `handle-closed`, `tick`), two exported cadence constants
(`PROJECTOR_HEARTBEAT_INTERVAL_MS = 2000`, `LIVENESS_FRESHNESS_WINDOW_MS = 6000`). No React, no
`window`, no imports (asserted by AST). The three AC-4 rules are single `if` branches in one
function, not two mechanisms: an `ack` always sets `live` regardless of any prior `handle-closed`
(asymmetric precedence — the ack is authoritative for life, the handle for death, neither for the
other); a `handle-closed` event sets `lost` immediately without consulting the freshness window;
a `tick` with no fresh ack past the window sets `lost`, and never revives a `lost` verdict on its
own (only a fresh `ack` does that). Wired in `PresenterOperator.tsx`: every inbound message (the
new heartbeat and the existing `request-sync`) is recorded as an `ack` inside the listener that
already existed, without changing how `request-sync` is answered; a 200ms poll
(`LIVENESS_POLL_INTERVAL_MS`, local to the component — not part of the shared cadence pair, since
only the heartbeat interval and freshness window need to be agreed by both windows) raises
`handle-closed` only when `projectorRef.current && projectorRef.current.closed`, else `tick`. No
second liveness state anywhere in the component (asserted by AST — a defect injection of exactly
that shape turned the suite red, see Debug Log).

**Cadence sizing / mandatory throttling statement (task requirement, non-negotiable).** Stated
rather than left silent: the two cadence constants are sized against the browser-throttling facts
already web-verified and recorded in `ARCHITECTURE-SPINE.md:448` (AD-29's own Deferred entry,
restated here rather than re-derived) — ordinary background-tab timer throttling groups timers to
roughly once per second and only escalates to once-per-minute "intensive" throttling after five
minutes hidden; the projector is a popup window on a second screen (`PROJECTOR_FEATURES`,
`PresenterOperator.tsx:103`) and is therefore ordinarily visible, so standard throttling does not
reach it. The narrow, real cases that do — the operator minimises or fully obscures the projector,
or the presenter's own tab is backgrounded while they read the run sheet — produce a **false
`lost`**, which AD-29 and this story's AC-4 already name as the direction to fail in (self-clearing
on the next ack, versus an unrecoverable false `live`). `LIVENESS_FRESHNESS_WINDOW_MS` is 3×
`PROJECTOR_HEARTBEAT_INTERVAL_MS` (6000ms / 2000ms), which tolerates two consecutively missed
heartbeats from ordinary jitter without flapping, while still reporting a real death within
single-digit seconds — "well under a second" for a clean close is met separately by the
`handle-closed` fast path, which does not wait out this window at all. **No `deferred-work.md`
entry was filed**, because the gap this task asks to either bound-with-an-assumption or defer is
already the exact gap AD-29's Deferred entry names and accepts as a known, cited trade-off — filing
a second entry for the same accepted gap would duplicate rather than newly disclose.

**AC-5 (surface).** The lost-sync line renders in the presenter `<header>`, `role="status"`, only
while `liveness.verdict === 'lost'`; a separate conditional from `projectorBlocked`'s banner so
either, both or neither may show; nothing renders in `never-opened`; it clears the render the next
`ack` arrives (no operator step). It states the recovery ("Use Open projector above to reconnect
it"), never the cause. No modal, no disabled control. `projectorBlocked`'s own banner block is
unchanged (verified: the only edit adjacent to it is the new sibling block below it).

**AC-6 (regression coverage, fail-first, registered, proven).** `tests/projector-liveness.test.mjs`
(NEW, 17 assertions) written before the module existed; confirmed to fail
(`ERR_MODULE_NOT_FOUND`), then implemented until green. Registered in `package.json`
`scripts.test`. Covers: all three states, both routes into `lost` (window elapsed; handle closed),
all three AC-4 precedence rules including the asymmetric ack-beats-a-stale-closed-reading case,
`never-opened` silence, recovery to `live` on a bare ack (standing in for `request-sync`, which
this evaluator treats identically to the heartbeat — both are "a projector message arrived"). AST
assertions cover what this repo's `node:test` cannot reach directly (no DOM harness): the
heartbeat's interval and cleanup live inside `ProjectorClient`'s effect pinned to `[serviceId]`
alone; the heartbeat posts no deck state; `PresenterOperator` imports and calls the shared
`nextLivenessState` rather than holding a second flag; the `handle-closed` dispatch is reached
only through an `if` whose left-hand side is a bare, non-negated truthy check of `projectorRef.current`
(this last assertion was tightened mid-session — see Debug Log entry 5 — after a first version
passed against a real defect it should have caught). Ten defects injected and reverted; see Debug
Log table.

**AC-7 (theme guard).** No new hue was added — the lost-sync line reuses the exact
`text-amber-300` treatment already pinned four times in this file (the file is pinned `dark` and
cannot express a `dark:` half at all, per its own precedent). This is the fifth site sharing one
already-filed exception, not a new one, but it **is** a new occurrence of the pattern the guard
counts per-site, so `UNPAIRED_CHROMATIC_TEXT` needed a fifth entry regardless. The four existing
bracket citations had rotted (this story's edits shifted every line below the header) and were
repaired — **twice**: first to this pass's lines (`:546`, `:590`, `:672`, `:792`, new entry `:567`),
and again in review round 2, which found the fix round had shifted every one of them a second time.
The five entries now read `:583`, `:604` (the new lost-sync line, cited
`pinned dark, AC-3/Story 17.5 AC-5`), `:627`, `:709` and `:829`, each re-verified against
`PresenterOperator.tsx` on 2026-08-05 rather than recomputed on paper. Confirmed green for the right
reason: `tests/theme-chrome.test.mjs` 58/58 (57 pre-existing scope + 1 unchanged assertion count —
no new site slipped past unpinned; a probe of a sixth, unregistered site turned it red before
being reverted, see Debug Log #10).

**AC-8 (artifact sync).** `EXPERIENCE.md`: the Lost sync presenter-state row (`:153`) rewritten
from "designed, not shipped" to a shipped-behaviour statement; Open Item 1 (`:310-312`) closed with
evidence on Open Item 3's closure shape (struck headline, Before/Now, evidence line); Flow 3 Branch
3a's first beat (`:240`) rewritten from "designed, not shipped" to shipped; the *Interaction
Primitives* bullet (`:157`) corrected from "one-way" (already loose — `request-sync` has always
travelled the other way) to state what the reverse direction now carries, citing `AD-29`, leaving
the plan-identity half of that same bullet untouched. `epics.md`: the Epic 17 summary line (`:280`)
and the Story 17.5 label (`:308`) both read `review`, leaving every other story status in that line
untouched; the *Constraint* paragraph (`:320` originally) gains the resolved mechanism (both
signals, ack primary) and a pointer to `AD-29`; a one-line implementation summary was added after
the So-that clause, matching the style Stories 17.1-17.4 already use. `DESIGN.md`: **no new
component identity** (the line reuses an existing warning treatment, per the story's own test for
what counts as a visual delta) — but the amber inventory at `:98` and Open Item 4's counted grep at
`:236-246` were re-measured (`45 → 46` amber uses, `90 → 91` utilities total; file counts unchanged)
because the reused treatment is still one new **site**, which is what those two figures count, and
the story is explicit that stale-one-without-the-other is the failure mode to avoid. `:98`'s named
list gained "lost-sync notice" alongside the three PresenterOperator.tsx affordances already named
there. `ARCHITECTURE-SPINE.md` carries no edit from this change set (confirmed via `git diff
--stat`, unchanged since session start); no `EXPERIENCE.md` IA-table row moved (this story adds no
route or surface).

**AC-9 (verification).** All commands run and numbers recorded rather than assumed:
- `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types
  tests/projector-liveness.test.mjs tests/present-channel.test.mjs tests/theme-chrome.test.mjs` —
  17 + 14 + 58 = **89/89 pass**.
- `npx tsc --noEmit` — **clean, 0 errors**.
- `tests/public-repo-guard.test.mjs` — **5/5 pass**.
- `npm run build` — succeeded (needed for `tests/auth-http.test.mjs`, which spawns the built
  server; no stale-ABI issues).
- `npm test` (full registered suite) — **489 tests / 488 pass / 0 fail / 1 skipped** (the skip is
  pre-existing, in `tests/registry-assets.test.mjs`, unrelated to this change; confirmed by
  `grep -rn "\.skip(" tests/*.mjs`). 19 of the 489 tests are new to this story (17 in
  `tests/projector-liveness.test.mjs`, 2 in `tests/present-channel.test.mjs`); the remaining 470
  are pre-existing and all still pass.
- `npm run lint` — **32 problems**, and this was compared against a **freshly re-measured**
  baseline rather than trusted: this change set's tracked-file edits (and the two new untracked
  files) were stashed/moved aside, `npm run lint` re-run on the bare pre-change tree (**32
  problems, identical**), then everything restored and re-verified (`tsc`/tests still green after
  restore). **Zero new lint problems introduced** — none of the changed or new files
  (`present-channel.ts`, `projector-liveness.ts`, `ProjectorClient.tsx`, `PresenterOperator.tsx`)
  appear anywhere in the 32-problem list, on either side of the stash.
- **Node version:** this machine has only Node 24.18.0 available (no version manager, no Node 22
  install found). Per Story 17.3's precedent, this is **disclosure, not proof** — the PR's Node 22
  CI run is this AC's actual evidence, and that should be confirmed once the PR is opened. **It has
  been — see the round-2 section below: PR #33's run `31011350874` on `node: v22.23.1`, 495/496 pass.
  This bullet is left as written because it was accurate when written; the closure lives there.** Not run
  here: a real-browser pass (no DOM harness in this repo per Testing Standards; the wiring gap that
  would otherwise need one is covered by the AST assertions in `tests/projector-liveness.test.mjs`).

### Review fix round (2026-08-05, `bmad-dev-story` FIX mode)

Four independent reviewers ran on this tree (`claude:sonnet@high`, `agy:gemini-3.1-pro-low`,
`agy:gemini-3.6-flash-high`, `codex:gpt-5.6-terra@high`); their union is the three checked
[Review][Patch] items above. Each was fixed with a fail-first regression proof (RED confirmed
against the pre-fix code, GREEN after) — see each item's own **Fixed:**/**Proof:** line for detail.
Summary of the mechanism, since all three land in the same two files:

- `src/lib/present-channel.ts` gained `isProjectorMessage(msg)`, the one place "does this message
  come from the projector" is decided, so `PresenterOperator.tsx` cannot drift from
  `present-channel.ts`'s own account of who sends what (blocking finding 1).
- `src/lib/projector-liveness.ts` gained a fourth reducer *event*, `{ type: 'opened' }` — the
  verdict vocabulary stays exactly three (`never-opened`/`live`/`lost`), and this is still one
  evaluator: `openProjector` reports the fact, only the existing `tick` branch turns it into a
  verdict, on the same "uncertainty resolves to lost" rule already governing a stale handle
  (blocking finding 2).
- `PresenterOperator.tsx`'s `openProjector` now reattaches (`existing.location.href = projectorUrl`)
  a handle that is open but not answering, rather than only focusing it, gated on
  `livenessRef.current.verdict === 'lost'` so a genuinely live handle is never redundantly reloaded
  (blocking finding 3).
- Non-blocking, fixed: `dispatchLiveness` now calls `setLiveness` only when `next.verdict` actually
  differs from the current verdict, rather than on every `ack` — the pure reducer still returns a
  fresh object each ack (needed to refresh `lastAckAtMs`), but the render only ever reads
  `liveness.verdict`, so gating the re-render on that field costs nothing observable and removes a
  render every heartbeat (2s) for the whole session. No dedicated regression test: this is a
  render-count optimization with no user-observable behavior change, and the repo has no DOM harness
  to assert render counts against (Testing Standards) — verified by code reading instead.
- Investigated, not fixed: the claimed stale-liveness-across-a-`serviceId`-change gap. Confirmed
  **not reachable** in this codebase rather than assumed: `PresenterOperator` is rendered from
  exactly one call site, `src/app/services/[id]/present/page.tsx` (an async Server Component
  re-fetched fresh per navigation), there is no `layout.tsx` anywhere under
  `src/app/services/[id]` (only the root `src/app/layout.tsx`) to preserve component identity
  across a route change, and the only in-app link that ever targets a `/present` route is
  `src/app/services/[id]/page.tsx:181` — a different page/component entirely, one hop away in the
  run-sheet, never `PresenterOperator` itself. Every real path to a different service's presenter
  page therefore detours through at least one non-`PresenterOperator` page first, which guarantees
  a full unmount before any new `PresenterOperator` (for any `serviceId`) mounts — `serviceId`
  changing while the same instance stays mounted is not a reachable React/Next.js transition here,
  so `liveness` state never needs an explicit reset for it. (The same is already true, and for the
  same reason, of `indexRef`/`blankRef`/`transitionRef`/`projectorRef` — none of them resets on a
  `serviceId` prop change either, so a fix scoped only to `liveness` would have been inconsistent
  with the rest of the component's own, pre-existing assumption.)

Verification after all four items: `tests/projector-liveness.test.mjs` (23/23, up from 17 — 4 new
reducer tests for blocking 2, 2 new AST wiring tests for blocking 1 and blocking 3, and the 17
pre-existing tests still green with no changes needed) + `tests/present-channel.test.mjs` (15/15, up
from 14 — 1 new test for `isProjectorMessage`) + `tests/theme-chrome.test.mjs` (58/58, unchanged) =
**96/96**; `npx tsc --noEmit` clean; `tests/public-repo-guard.test.mjs` 5/5; full `npm test`
**495/496 pass, 1 pre-existing skip** (496 = 489 recorded at the prior implementation pass + 7 new
this round); `npm run lint` **32 problems, identical** to the pre-fix-round baseline measured on
this same tree before any of this round's edits — none of the five touched files
(`present-channel.ts`, `projector-liveness.ts`, `PresenterOperator.tsx`, `present-channel.test.mjs`,
`projector-liveness.test.mjs`) appear anywhere in either lint run. **Node version:** this machine
has only Node 24.18.0 (no Node 22 install found) — per Story 17.3's precedent and this story's own
AC-9, this is disclosure, not proof; the PR's Node 22 CI run is the AC-9 evidence of record for this
fix round too. `npm run build` was re-run before the full suite because `tests/auth-http.test.mjs`
refuses to run against a build older than the source (correctly: it caught this round's edits as
staleness) — the rebuild succeeded with no new warnings beyond the one pre-existing, unrelated
`turbopackIgnore` note in `pptx-cache.ts`.

### Review round 2, and this record's own repair (2026-08-05)

**Round 2 ran and closed; this section was written afterwards, which is the defect it starts by
admitting.** The fix round above left the Change Log ending on *"Status stays `review`, pending
re-review of this fix round"*, and round 2 then ran without amending it. For a day the only place
round 2 existed was the body of commit `5d8100d` — not the story file, not
`sprint-status.yaml` — so every artifact a reader would consult said a re-review was still owed.
Story 17.3 spent three of its own review rounds on exactly this class of defect (stale prose in the
story file), which is why this is recorded as a finding about the record rather than quietly fixed.

- **What round 2 found.** All three `[High, blocking]` round-1 items confirmed closed against the
  fixed tree. One new item, `[Low, AC-7 accuracy]` — the five rotted guard citations, now the fourth
  entry under *Review Findings* — fixed before the commit.
- **Reviewer provenance.** `5d8100d` records four independent reviewers across four model families
  (`claude:sonnet@high`, `agy:gemini-3.1-pro-low`, `agy:gemini-3.6-flash-high`,
  `codex:gpt-5.6-terra@high`) across **two** rounds. The per-round split — which of the four re-read
  the fixed tree in round 2 — was not preserved anywhere at the time, and this repair does **not**
  invent one. The round-1 union of three blocking findings is attributable to that set; round 2's
  single finding is attributable only to "round 2".
- **Numbers corrected, not re-asserted.** The fix round's verification paragraph claimed
  `projector-liveness.test.mjs` at **30/30** and the focused trio at **103/103**. Both were wrong:
  the round's 7 new tests were added to the file's own total *and* counted in the breakdown. Measured
  on this tree today: `projector-liveness.test.mjs` **23** (`grep -c "^test("` agrees at 23, so no
  subtests are hiding), `present-channel.test.mjs` **15**, `theme-chrome.test.mjs` **58** — focused
  **96/96 pass, 0 fail**. `17 + 4 + 2 = 23` is the arithmetic the record should have carried.
- **The full-suite figure was checked, not trusted.** `npm run build` (clean, exit 0, needed because
  `tests/auth-http.test.mjs` refuses a stale build) then `npm test`: **496 tests, 495 pass, 0 fail, 1
  skipped** — the recorded `495/496 pass, 1 pre-existing skip` is correct as written, so it stands
  unchanged. `theme-chrome.test.mjs` was also measured at 58 tests *before* this story
  (`66bb33b`'s copy of the file, run against the current source in a reverted probe: 58 tests,
  57 pass, 1 fail — the chromatic guard correctly reacting to the then-unpinned lost-sync site),
  confirming the "58/58, count unchanged" claim in AC-7.
- **AC-9's Node 22 evidence — observed, so this AC is now closed on evidence rather than on a
  promise.** This machine still has Node 24.18.0 only, and that half stands as disclosure per Story
  17.3's precedent. The proof AC-9 actually asks for exists and was read: **PR #33** (merged
  2026-08-05T13:47:48Z), workflow *Node.js CI*, run
  [31011350874](https://github.com/wiradigitalid/worship-presenter-web/actions/runs/31011350874) —
  step *Use Node.js 22* reports `node: v22.23.1`, and `npm test` there returns **496 tests / 495 pass
  / 0 fail / 1 skipped**, the same four numbers measured locally on Node 24. Both supported versions
  therefore agree, which is more than AC-9 required. The `test` check and the Greptile review both
  passed.
- **The story's code is already on `main`.** PR #33 merged before this repair was written, so
  `git diff HEAD main` over the whole tree is empty — this branch's tip is content-identical to
  `main`. The repair below is documentation-only and travels as its own change set, following Story
  17.3's precedent of recording a CI result in a separate `docs:` commit.
- **Status.** Stays `review`. Two rounds are complete, every finding is closed, and AC-9's last
  outstanding piece of evidence is now in hand — but `done` is the owner's call in this project
  (Story 17.1's row states the precedent) and this repair does not make it.

### File List

- `src/lib/present-channel.ts` — UPDATE: one new `PresentMessage` variant (`projector-alive`); fix
  round adds `isProjectorMessage(msg)`.
- `src/lib/projector-liveness.ts` — NEW: the pure liveness evaluator; fix round adds the `opened`
  event and `openedAtMs` state field (verdict vocabulary unchanged at three).
- `src/app/services/[id]/present/PresenterOperator.tsx` — UPDATE: liveness state, dispatch,
  listener evidence recording, closed poll, lost-sync line; fix round gates the `ack` dispatch on
  `isProjectorMessage`, dispatches `opened` from `openProjector`, reattaches a frozen handle when
  `verdict === 'lost'`, and gates `setLiveness` on a verdict change rather than every `ack`.
- `src/app/services/[id]/present/projector/ProjectorClient.tsx` — UPDATE: heartbeat emission.
- `tests/present-channel.test.mjs` — UPDATE: two new tests for `projector-alive`; fix round adds one
  test for `isProjectorMessage` covering all seven message variants.
- `tests/projector-liveness.test.mjs` — NEW: 17 assertions, registered in `package.json`; fix round
  adds four reducer tests (blocking finding 2) and two AST wiring tests (blocking findings 1 and 3),
  30 total.
- `tests/theme-chrome.test.mjs` — UPDATE: `UNPAIRED_CHROMATIC_TEXT` citations repaired, one entry
  added; repaired a second time in review round 2 after the fix round shifted all five lines again.
- `package.json` — UPDATE: `scripts.test` gains `tests/projector-liveness.test.mjs`.
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md` —
  UPDATE: `:153`, `:157`, `:240`, `:310-312`.
- `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md` — UPDATE:
  `:98` and Open Item 4's counted grep (`:236-246`), re-measured together.
- `_bmad-output/planning-artifacts/epics.md` — UPDATE: Epic 17 summary line, Story 17.5 label and
  body, Constraint paragraph.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — UPDATE: `17-5-projector-liveness` →
  `review`, implementation record appended; the record repair adds the two review rounds, which the
  row had never carried.
- `_bmad-output/implementation-artifacts/stories/17-5-projector-liveness.md` — UPDATE: this file
  (frontmatter citation repairs, tasks checked, Dev Agent Record, Change Log, Status); the record
  repair adds the round-2 finding and section and corrects two test-count figures and AC-7's
  citations.

## Change Log

- 2026-08-05: Story context created (`bmad-create-story`, CREATE mode). Nine AC written against `epics.md:308-320` as the declared single source. **Two owner decisions, escalated during context creation and answered the same day.** (1) *Mechanism:* an acknowledgement on `present-channel.ts` is the **primary** liveness signal and the retained-handle `closed` read is a **corroborating fast path inside the same evaluator** — one predicate, not a second state machine — with the ack authoritative for `live` and the handle authoritative for immediate `lost`. Taken because the poll alone is structurally blind to a projector opened through the popup fallback, one that survived a Presenter remount, and one that crashed or froze, and because the story's own words are *"stops answering"*. (2) *Wire path:* the `PresentMessage` extension is gated on a `bmad-architecture` Update run adding `AD-29` (next unused; 28 headings verified, nothing renumbered) that ratifies the ack's shape, who may send it, and that the presenter remains the single authority — paid up front rather than at review, since the same gate blocked Story 17.1 twice. `ARCHITECTURE-SPINE.md` is deliberately untouched by this change set. AD-10's `[TARGET]` plan-identity clause remains out of scope. Status → `ready-for-dev`.
- 2026-08-05: Implemented (`bmad-dev-story`). All nine AC met; see Completion Notes List for the
  per-AC detail. Repaired four stale spine citations the AD-29 Update run's own change set left
  behind (`AD-24` `:204-210`/`:210` → `:205-211`/`:211`, `AD-28` `:244` → `:245`, the plan-identity
  Deferred entry `:429` → `:447`; `AD-10`'s `:118-122` re-verified unchanged). Verification: tsc
  clean; lint 32 problems, identical to a freshly re-measured pre-change baseline (0 introduced);
  full suite 489/488 pass/0 fail/1 pre-existing skip (19 new tests); theme-chrome 58/58;
  public-repo-guard 5/5; ten injected defects, all confirmed to react before being reverted. Node
  24.18.0 in-worktree — no Node 22 available; disclosure per Story 17.3's precedent, PR CI is the
  AC-9 evidence of record. Status → `review`.
- 2026-08-05: Review fix round (`bmad-dev-story`, FIX mode), addressing the union of four
  independent reviewers' findings. Three [High, blocking] items fixed, each with a fail-first
  regression proof: (1) the presenter's message listener was recording *every* inbound channel
  object as liveness evidence, so a second Presenter tab's own state broadcasts could make the
  verdict `live` with no projector present — fixed by adding `isProjectorMessage` to
  `present-channel.ts` and gating the `ack` dispatch on it, and the false `AD-29` comment claiming
  otherwise was corrected. (2) `openProjector` told the evaluator nothing when it opened a window,
  so a projector that opened and never sent a first ack stayed `never-opened` forever instead of
  resolving to `lost`, contrary to AD-29's uncertainty-resolves-to-lost clause — fixed by adding a
  fourth reducer *event* (`opened`; the verdict vocabulary stays three) that the `tick` branch
  expires into `lost` past the freshness window. (3) `Open projector`'s recovery action only called
  `.focus()` on a handle that was open but not answering, so it could never reattach the exact
  frozen/crashed/navigated-away projector AC-4 names as a motivating scenario — fixed by navigating
  that handle back to the projector route when the liveness verdict is `lost`, before focusing.
  Non-blocking finding (a fresh reducer object on every `ack` re-rendering the component every
  heartbeat though only `.verdict` is read) fixed by gating `setLiveness` on a verdict change.
  Investigated and confirmed not reachable, rather than fixed: a claimed stale-liveness-across-
  `serviceId`-change gap — no code path in this app remounts `PresenterOperator` with a changed
  `serviceId` while keeping the same instance; see the Dev Agent Record's fix-round entry for the
  full trace. One predicate preserved throughout: ack-staleness remains primary, the retained-
  handle `closed` read remains a corroborating fast path in the same evaluator, and no second
  liveness mechanism was introduced. Verification: `tsc` clean; full suite 495/496 pass/0 fail/1
  pre-existing skip (496 total, 7 new this round: 1 in `present-channel.test.mjs`, 6 in
  `projector-liveness.test.mjs`); focused suite (`projector-liveness` + `present-channel` +
  `theme-chrome`) 96/96 (corrected from an arithmetic error in the original entry — see the Dev Agent
  Record's round-2 section); public-repo-guard 5/5; lint 32 problems, identical to this round's own
  freshly re-measured pre-fix baseline (0 introduced). Node 24.18.0 in-worktree, no Node 22
  available — disclosure per Story 17.3's precedent, PR CI remains the AC-9 evidence of record.
  Status stays `review`, pending re-review of this fix round.
- 2026-08-05: **Review round 2 — closed.** All three round-1 blocking items confirmed closed against
  the fixed tree; one new `[Low, AC-7 accuracy]` finding raised and fixed — the five
  `UNPAIRED_CHROMATIC_TEXT` citations for `PresenterOperator.tsx` had rotted a *second* time under the
  fix round's own edits (`:546`/`:567`/`:590`/`:672`/`:792` → `:583`/`:604`/`:627`/`:709`/`:829`). The
  guard could not react — it strips bracket text before comparing — so this was a reviewer catch, and
  the resulting blind spot is now named in the Review Findings entry rather than left implicit. No
  behavioural change in this round. Status stays `review`.
- 2026-08-05: **Record repair.** Round 2 had been recorded only in commit `5d8100d`'s body, so the
  story file and `sprint-status.yaml` both still read as though a re-review were owed, and the fix
  round's verification paragraph carried two wrong figures. Repaired here, with every number
  re-measured on this tree rather than recomputed: the round-2 Review Findings entry and Dev Agent
  Record section added; `projector-liveness.test.mjs` **30/30 → 23/23** and the focused trio
  **103/103 → 96/96** (the round's 7 new tests had been double-counted); AC-7's completion note
  corrected to the citations the guard actually carries; `sprint-status.yaml`'s `17-5` row given its
  first review entry. Verified rather than asserted: `npm run build` clean, `npm test` **496 tests /
  495 pass / 0 fail / 1 pre-existing skip** (confirming the recorded full-suite figure was right),
  focused trio **96/96**, the five amber citations measured against the file. No source file was
  touched — this change set is documentation only. **AC-9 closed on evidence in the same pass:** the
  Node 22 CI run this story had been deferring to already existed and was read rather than assumed —
  PR #33's *Node.js CI* run `31011350874` on `node: v22.23.1`, `npm test` **496 / 495 pass / 0 fail /
  1 skipped**, identical to the local Node 24 figures. PR #33 is also already **merged**, so the
  story's code is on `main` and this repair is a separate `docs:` change set, per Story 17.3's
  precedent. Status stays `review`: every finding is closed and every AC now has its evidence, but
  `done` is the owner's call.
