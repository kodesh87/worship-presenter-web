# Reviewer Gate — Adversarial Two-Units

**Run:** 2026-08-05 Update, AD-29
**Lens (configured `finalize_reviewers[1]`):** construct two units one level down that each obey every
`AD` to the letter and still build incompatibly.
**Mode:** sequential inline (Agent tool unauthorized on this host — same posture as prior runs).

**Verdict: PASS after one hole closed during drafting and one finding to autofix. Two constructed
pairs turned out to be closed already and are recorded so the next run does not re-derive them.**

---

## Pair A — the projector's emitting half vs the presenter's evaluating half, on cadence — CLOSED

Each picks an honest number. Projector heartbeats every 5 s; presenter's patience is 3 s. Both obey
every other clause, and the operator is told a healthy second screen is dead for the rest of the
service. Closed by Rule 7: one exported pair, consumed by both windows. Divergence is structurally
impossible, not merely discouraged.

## Pair B — Story 17.5 vs a later story adding a second liveness signal — CLOSED

Take Story 17.5's evaluator and a later story that wants `pagehide`, `visibilitychange`, or a second
retained handle. A rule that named only *ack staleness* and *the handle's `closed` read* would let the
later story stand its signal up beside them with its own flag and its own message — two verdicts, and
the older half is not even wrong, it just no longer decides. Closed by Rule 5 stating the general form:
**a new signal joins the one evaluator as an input or it does not exist**, and a second holder of
liveness state is a defect however it is spelled. This was the coordinating instruction's explicit
ask (encode the rule, not the list) and the lens confirms the list alone would have failed here.

## Pair C — the projector vs the web slideshow, both on AD-10's channel — CLOSED DURING DRAFTING

The strongest pair, and it was found while drafting rather than after. AD-10's `Binds` reads
"presenter, projector, web slideshow". Measured at this run: `openPresentChannel` has exactly two call
sites — `PresenterOperator.tsx:347` and `ProjectorClient.tsx:57` — so the slideshow entry in AD-10 is
an **invitation rather than a description**. A later slideshow story that emits the same state-free
acknowledgement satisfies every word about shape, statelessness, idempotence and "reports its own
condition", and makes the presenter report a live projector when what answered was a slideshow tab on
the same machine: the operator is reassured while the second screen is dark. Closed by Rule 2 — one
*kind* of sender, and a second is a new decision. Deliberately **not** closed with a sender-identity
field, which is AD-10's unbuilt plan identity arriving through a side door.

## Pair D — a projector on an older build vs a presenter on the new one — PLAUSIBLE, autofix

Two deployed builds are two units. A projector window open across a redeploy posts `request-sync` on
its mount (evidence of life) and then never acknowledges, because its build has no such message. The
presenter therefore reports `lost` for a projector that is showing the deck perfectly — and the stated
recovery does not clear it, because `Open projector` focuses the *existing* window
(`PresenterOperator.tsx:273-275`) rather than reloading it onto the new build.

Severity is genuinely low: AD-4 records that **no deployment exists**, and a redeploy mid-service is
the event AD-1 organises the whole product against. But the file's header contract already worries
about exactly this shape — "a payload from a window still running the build that had no such field" —
so it should not be discovered later as a surprise.

**The finding is not the case, it is that AD-29 does not say which direction the predicate must fail
in.** That question recurs across every uncertain input — the older build, a throttled timer, an
`openPresentChannel` that returned `null` — and answering it once settles all of them. The answer is
asymmetric and both halves are load-bearing:

- a false `live` is **unrecoverable within the service** — the operator presents to a dark room,
  reassured, which is the harm the whole decision exists to prevent;
- a false `lost` is **self-clearing on the next acknowledgement**, and its cost is credibility: a line
  that cries wolf is a line the operator learns to ignore, which converts back into the first harm.

So: where the predicate cannot be certain it resolves to `lost`, **and** the cadence is sized so that
being wrong that way is rare rather than tolerated. That also gives Pair D its correct reading rather
than a mechanism: a receiver that has never acknowledged is indistinguishable from one that has
stopped, and that is intended — the presenter may only vouch for what answers it.

## Pair E — two presenter windows on one service — CLOSED, and by the state-free rule

Nothing stops a second `/services/:id/present` tab; both open the channel at `:347` and both would
observe the projector's acks. No incompatibility, and the reason is Rule 1 rather than luck: because
the acknowledgement carries no shared state, a second observer changes nothing. (Two presenters
answering `request-sync` is a pre-existing AD-10 condition, untouched by this decision and not made
worse by it.) Recorded so a later run does not construct this pair again.

## Pair F — the pure evaluator vs whoever owns the timer — CLOSED

AD-29 fixes no timer ownership, which looks like a hole. It is not: the evaluator holds no state of
its own and takes time as an argument, so a second consumer that drives it from its own timer cannot
diverge from the first. Story 17.5 owns registering and clearing the timer in one effect. No `AD`
needed.

## Pair G — a presenter with no `BroadcastChannel` at all — CLOSED

`openPresentChannel` returns `null` where the API is absent (`present-channel.ts:83-88`). No ack can
ever arrive, so a staleness-only predicate would report `lost` on a surface where nothing was ever
opened. Closed by Rule 5's *no evidence yet is a distinct verdict from evidence stopped* — the surface
stays silent. No text change needed; recorded because the story cites the same line for the same
reason and a reader should find the two agreeing.
