# Reviewer Gate — Amendment Verification (ad-hoc lens)

**Run:** 2026-08-05 Update, AD-29
**Lens:** every claim and every `file:line` in **the amending run's own text**, plus every claim
inherited from the driving input and preserved rather than re-derived.
**Why this lens was added:** earned by this file's history rather than invented. Its gate has opened
new findings on four consecutive runs, **twice against the amending run's own text**, and at least two
runs wrote fresh falsehoods by following a scope note literally after the cited reality had moved. The
gate reference licenses ad-hoc lenses the spine's criticality warrants; this is the warranted one.
**Mode:** sequential inline (Agent tool unauthorized on this host).

**Verdict: PASS after one finding against this run's own text — an overclaimed authority, fixed — and
one residual reported rather than acted on.**

---

## 1. Finding A1 — HIGH, against this run's own text, fixed

The draft's room-facing bullet said a *"presenter disconnected"* notice on the congregation's screen is
"what AD-24's *Prevents* and Epic 17's own constraint both refuse". **AD-24's *Prevents* does not
reach it.** Read at `:206`: it is about *"a client-persisted value that **paints** becoming a third
structural channel to the congregation's screen, alongside `buildSlidePlan` (AD-7) and the
BroadcastChannel (AD-10)"*. A liveness notice is not a client-persisted value, and it would travel over
AD-10's channel — one of the two channels that clause names as **legitimate**. So the citation
supported the conclusion by resemblance, not by content.

The conclusion survives on a different leg, exactly as AD-28 records for `shortName`: Epic 17's own
preamble states *"The congregation never sees operator chrome"* (`epics.md:284`, read at this run), and
that is the authority. AD-24's room-facing closure is the analogy. The bullet now says which is which,
and says why the distinction is not pedantic. This is the same refutable-reason failure the AD-5
precedent names and the file records twice more; catching it against this run's own draft is the whole
point of running this lens.

Notably the driving story got this right and the draft got it wrong: Story 17.5 AC-5 cites
`epics.md:284` as the prohibition and says AD-24's closure *"reads the same way"*. The inherited
framing was more careful than the amendment's, which is worth recording as its own lesson.

## 2. Every `file:line` written into the spine by this run, resolved by reading

| Written | Resolves to | Verdict |
| --- | --- | --- |
| `present-channel.ts:3-18` (header contract) | the contract block; *single authority* / *intended value* / *idempotent* clauses | exact |
| `:50-53` (`blankStateOf`) | the function, whose `sync`/`blank` test already yields `null` for a new type | exact |
| `:71-77` (`liveTransitionOf`) | the function, early-returning `null` for anything but `sync`/`transition` | exact |
| `ProjectorClient.tsx:83` (mount-time `request-sync`) | `ch.postMessage({ type: 'request-sync' })` | exact |
| `ProjectorClient.tsx:57` (channel call site) | `const ch = openPresentChannel(serviceId)` | exact |
| `PresenterOperator.tsx:347` (channel call site) | same, presenter side | exact |
| `PresenterOperator.tsx:361-367` (the listener) | `onMessage`, acting only on `request-sync` | exact |
| `PresenterOperator.tsx:273` (the only `.closed` read) | `if (existing && !existing.closed) {` | exact, and it is inside `openProjector` `:271-287` |
| `PresenterOperator.tsx:486-493` + `target="_blank"` at `:489` | the popup-fallback anchor | exact |
| `PresenterOperator.tsx:105-111` ("a Presenter reload that lost the handle") | the stable-window-name rationale, phrase on `:106` | exact |
| `PresenterOperator.tsx:103` (`PROJECTOR_FEATURES`, the popup) | the constant | exact |
| `epics.md:284` (the congregation never sees operator chrome) | Epic 17's preamble constraint | exact |
| `EXPERIENCE.md:153` (*⚠ Lost sync*, *Owner: Story 17.5*) | the presenter-state row | exact |
| `EXPERIENCE.md:310` (Open Item 1, same owner) | the open item | exact |

Quotations were transcribed from the read text, not recalled: AD-10's *"no surface opens its own
channel name or message shape"* (`:121`), its *Prevents* (`:120`), and AD-24's *"`localStorage` is a
cross-window channel, and that does not make it AD-10's"* (`:211`) all match their sources verbatim.

## 3. Inherited claims — verified before being preserved

Every load-bearing claim taken from Story 17.5's context was re-measured rather than trusted, per the
coordinating instruction. All held: the six-variant union with no acknowledgement; the two readers'
already-`null` shapes; that the reverse direction is already on the wire; the single `.closed` read and
single handle write; the three no-usable-handle situations; the `role="status"` asymmetry (present on
the live-transition line `:596`, absent on the popup banner `:483`); and the AD heading census (28
before, highest AD-28). **Nothing inherited had gone stale, so nothing had to be retracted** — which is
itself worth stating, because the instruction anticipated the opposite and a silent pass would look
like the check was skipped.

One inherited citation is *imprecise* rather than wrong and was left alone: the story's Dev Notes call
`PresenterOperator.tsx:271-276` "the `const existing = …; if (existing && !existing.closed) …` guard",
which actually occupies `:272-276` (`:271` is the `useCallback` opening). The range contains the code
it describes and the claim it supports is true.

## 4. What this run's edits did to *other* documents' line citations — reported, not acted on

The amendment moves spine content, and four locations in Story 17.5 cite spine line numbers. Measured
after every fix:

| Cited as | Now at | Note |
| --- | --- | --- |
| AD-10 `:118-122`, `:121`, `:122` | **unchanged** | preserved deliberately: the AD-29 note was appended *after* AD-10's gap bullet, and the census sentence was re-wrapped to two lines instead of three, precisely so this range did not move |
| AD-24 `:204-210`, and `:210` (the `localStorage` clause) | `:205-211`, `:211` | +1 |
| AD-28 `:244` | `:245` | +1 |
| *Deferred* plan-identity entry `:429` | `:447` | +18 |
| AD-29 | `:262` | new |

**Not repaired here, deliberately.** Story 17.5 is another workflow's artifact, uncommitted and
mid-flight, and two of its references to these lines are **dated verification records** rather than
reading pointers — AC-2 states that the spine "carries 28 `### AD-` headings and the highest is
`AD-28` (`:244`)", *verified during context creation*, which was true when written and which rewriting
would falsify. The mechanical shifts above are reported to the coordinator instead, so whoever owns
that file applies them in one pass alongside the AC-2 confirmation task it already carries.

## 5. Did the amendment leave any part of the spine self-contradictory?

Walked AD-10, AD-24, AD-9, AD-7, AD-23, the *Client state* and *Boundaries* conventions, the two
mermaid graphs and the structural seed tree. No contradiction found. Two things checked and
deliberately not changed: the structural seed tree's `src/lib/` listing gained no liveness module,
because that module does not exist yet and the tree describes what ships; and no
*Capability → Architecture Map* row was added, because Epic 17 has no PRD FR ancestry by recorded
decision and AD-24 sets that precedent.
