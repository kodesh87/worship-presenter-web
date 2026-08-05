# Reviewer Gate — Version / Reality Check

**Run:** 2026-08-05 Update, AD-29
**Lens (configured `finalize_reviewers[0]`):** was every committed decision web-researched or
reality-checked rather than asserted from training data?
**Mode:** sequential inline (Agent tool unauthorized on this host).

**Verdict: PASS with one finding to autofix — the one empirical claim this run introduced was correct
but too vague to be useful, and web verification sharpened it into the case that actually bites.**

---

## What this run committed, and what of it is version-bearing

Nothing. AD-29 names no library, adds no dependency, and touches no Stack row. The APIs it rests on
are `BroadcastChannel`, `postMessage`, `window.closed`, `setInterval`, and (named only as examples of
signals that would have to join the one evaluator) `pagehide` and `visibilitychange`. All are platform
APIs, and the first three are already in use in this repository — verified by reading, not recalled:
`openPresentChannel` at `present-channel.ts:83-88`, `broadcast` at `PresenterOperator.tsx:289-291`,
the single `.closed` read at `:273`. Nothing here can drift against `package.json`, so the Stack
table needed no change and got none.

## Reality checks on the shipped code, all read at this run

| Claim in AD-29 | Verified at | Result |
| --- | --- | --- |
| header contract governs "every message that touches shared state" | `present-channel.ts:3-18` | exact, quoted verbatim |
| the union has six variants and no acknowledgement | `:19-38` | exact |
| an unknown type already resolves to `null` through both readers | `:50-53`, `:71-77` | exact — `blankStateOf` tests only `sync`/`blank`, `liveTransitionOf` returns early for anything but `sync`/`transition` |
| `request-sync` already travels projector→presenter | `ProjectorClient.tsx:83` | exact |
| the presenter's listener already receives it | `PresenterOperator.tsx:361-367` | exact |
| exactly two channel call sites (no slideshow) | repo-wide grep for `openPresentChannel` | exact — `PresenterOperator.tsx:347`, `ProjectorClient.tsx:57`, plus the module |
| `.closed` is read in exactly one place | `PresenterOperator.tsx:273` | exact, and it is inside `openProjector` (`:271-287`) |
| the handle is written in exactly one place | `:282` | exact |
| the popup fallback anchor retains no window | `:486-493`, `target="_blank"` at `:489` | exact |
| "a Presenter reload that lost the handle" | `:105-111` | exact, phrase on `:106` |

`window.closed` staying `false` for a crashed, frozen or navigated-away window: reality-checked by
construction rather than by memory. `closed` reports whether the window object was *closed*; a window
that has navigated elsewhere, whose renderer crashed, or whose main thread is blocked still exists, so
the flag is false while nothing answers. This is precisely why AD-29 makes the acknowledgement — not
the handle — authoritative for life.

## The one empirical claim this run introduced

The new *Deferred* entry asserted that "browsers throttle timers in windows they consider hidden or
backgrounded". True but too coarse to act on, and this lens exists to catch a claim asserted from
training data. Web-verified 2026-08-05:

- **hidden** means another tab is active **or the window is minimized** — not merely unfocused;
- background timers are grouped to roughly **once per second**;
- Chrome 88 added **intensive throttling** — once per **minute** after the page has been hidden for
  five minutes.

**Finding V1 — MEDIUM, autofix.** The distinction the vague wording lost is the one that decides
whether this hazard is real for *this* product: the projector is a **popup window on a second screen**
(`PROJECTOR_FEATURES` at `PresenterOperator.tsx:103`), so it is ordinarily *visible* and standard
background throttling does not reach it. The cases that do bite are narrow and nameable — the operator
minimises or fully obscures the projector window, or the presenter's own tab is switched away while
the operator reads the run sheet. The entry should say which case it means and carry the
once-per-minute-after-five-minutes figure, because that is the number that would make a wrongly-sized
freshness window report a live projector dead. Sizing stays Story 17.5's call; the *shape* of the
hazard is now stated rather than gestured at.

## What this lens did not have to touch

The Stack table's four-majors-behind rows, the pinned `next@16.2.10` security bullet, the Node row's
maintenance-LTS note and the `next-themes` cadence entry are all unchanged by this run and were not
re-litigated here. No row was mirrored, so nothing can have drifted.

Sources: [Chrome for Developers — heavy throttling of chained JS timers in Chrome
88](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)
