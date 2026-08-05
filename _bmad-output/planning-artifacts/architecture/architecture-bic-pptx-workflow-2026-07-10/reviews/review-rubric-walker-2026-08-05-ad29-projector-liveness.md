# Reviewer Gate — Rubric Walker

**Run:** 2026-08-05 Update, AD-29 (projector→presenter liveness acknowledgement, Story 17.5 gate)
**Target:** `ARCHITECTURE-SPINE.md` as amended by this run
**Lens:** the skill's good-spine checklist
**Mode:** sequential inline. Subagents were not used — this host forbids the Agent tool unless the
user asks for it, the same posture the 2026-07-29, 2026-08-01 (×2) and 2026-08-03 runs recorded.
Noted because a reader comparing runs would otherwise read the absence as an oversight.

**Verdict: PASS with two findings to autofix, one recorded-and-declined, and one recorded-as-correct.**

---

## 1. Does it fix the real divergence points for the level below, and miss none?

The level below is Story 17.5 plus any later story that touches AD-10's channel. Dimensions walked,
each either fixed by AD-29 or deliberately not:

| Dimension | Fixed? | Where |
| --- | --- | --- |
| The message's shape | yes | Rule 1 — one variant, no shared state, enumerated exclusions |
| Who may send it | yes | Rule 1 (the projector, unprompted) **and** Rule 2 (exactly one *kind* of sender) |
| Direction semantics / who is authority | yes | Rule 4, stated as a rule about what the reverse direction may carry |
| Who owns the verdict | yes | Rule 5 — one evaluator, a new signal joins it as an input or does not exist |
| Precedence between disagreeing inputs | yes | Rule 6 — ack authoritative for life, handle for death |
| Cadence agreement between the two windows | yes | Rule 7 — one exported pair |
| Storage tier | yes | the ephemeral-shared bullet, with AD-24's `localStorage` shortcut named |
| Room-facing counterpart | yes | forbidden, not merely out of scope |
| Enforcement ceiling | yes | the guard bullet, in AD-5's class for the source-shape half |
| Cadence *magnitude* | no — *Deferred* | a runtime tolerance, not a divergence: the pair is shared, so two units cannot disagree, only be wrong together |
| The three verdict *names* | no — story-level | see finding R2 |
| The affordance (what the operator is shown) | no — `EXPERIENCE.md` | see finding R1 |

**Finding R1 — MEDIUM, autofix.** AD-29 hands the affordance to nobody in writing. This file has a
recorded habit of the opposite failure — the 2026-08-01 *Deferred* entry that claimed two affordance
questions "have not been received" by `EXPERIENCE.md` when `bmad-ux` had already made the edit, kept
in the file precisely because it wasted work in the direction a summary would lose. Here the
affordance **is** already owned: `EXPERIENCE.md:153` is the *⚠ Lost sync — designed, not shipped*
presenter-state row marked *Owner: Story 17.5*, and Open Item 1 at `:310` is the same owner
(verified at this run by reading both lines). AD-29 should say so in one clause, so nobody files a
duplicate *Deferred* item for something that has an owner.

**Finding R2 — LOW, recorded and declined.** AD-29 fixes that *no evidence yet* is a distinct verdict
from *evidence stopped*, but does not name the three states (`never-opened` / `live` / `lost` in the
story). Declined deliberately: the **distinction** is the divergence — a surface and an evaluator
that disagree about whether "nothing yet" is silence or an alarm is the defect — while the
identifiers are seed, owned by the code the moment it exists, and this spine's paradigm keeps seed
minimal. Recorded rather than left silent so a later reader does not read the omission as an
oversight.

**Finding R3 — LOW, recorded as correct.** AD-29 appears in no *Capability → Architecture Map* row.
Checked rather than assumed: that table exists "because two specs drove this spine", and Epic 17 has
no PRD FR ancestry by recorded decision (`epics.md:284` places operator-chrome self-presentation
under `DESIGN.md`/`EXPERIENCE.md`). AD-24 — Epic 17's other governing decision — is likewise absent
from every table for the same reason. No hole.

## 2. Is every Rule enforceable, and does it prevent its stated divergence?

*Prevents* has two halves and they are separable.

**Half 1 — the projector becoming a second controller.** Prevented by Rule 4's general form (a
projector→presenter message reports the sender's own condition and nothing else) plus its converse on
the observing side (an ack may move the verdict and nothing else). Enforceability is honest: the
outbound half is a review rule — no scan can tell what a message *means* — and the inbound half is
partly assertable. AD-29's own guard bullet says exactly this rather than implying parity with AD-5.
Accepted.

**Half 2 — two verdicts.** Prevented by Rule 5 and it is the assertable half: the forbidden thing is
a source shape (a second liveness state held in the component), which a scan finds or does not. This
is squarely AD-5's class, and the guard bullet places it there rather than in AD-24's
four-hand-maintained-lists class. Good.

**Tag check.** `[TARGET]` is right — nothing of the acknowledgement ships. The risk with `[TARGET]`
in this file is its present tense reading as a description of `src/`, and several of AD-29's clauses
*do* describe today (that `request-sync` already travels projector→presenter, that both readers
already resolve an unknown type to `null`, that `.closed` is read in exactly one place). Each of
those is marked inline — "already", "since presenter mode shipped", "the shipped shapes already give
it and which is therefore pinned rather than built", "Making that read continuous is part of this
decision's cost". No clause leaves a reader unable to tell which tense applies. Accepted.

## 3. Could anything under Deferred let two units diverge?

The new *Deferred* entry defers the cadence **numbers** only. Divergence is structurally impossible
there: Rule 7 makes the pair one exported constant set consumed by both windows, so two units cannot
pick different values — they can only be wrong together, which is a correctness question owned by
Story 17.5 with a stated assumption and a `deferred-work.md` fallback. This is the right shape for a
deferral. The amended AD-10 plan-identity entry adds no new latitude; it removes some, by naming the
half-close that opening `PresentMessage` makes cheap.

## 4. Named technology verified-current

No library, no version, no Stack row. Delegated to the version/reality lens.

## 5. Does it ratify rather than contradict the codebase?

Yes, and every citation in AD-29 was resolved by reading the range at this run rather than inherited
from the story context. See the citation lens for the register.

## 6. Spec coverage / parent spine

No spec drove Epic 17 (recorded decision). No parent spine — this is the project's one spine, so
there is no inherited `AD` to weaken. Checked against AD-10, AD-24, AD-9, AD-7 and AD-23: AD-29
extends AD-10 and contradicts none of them.

## 7. Every dimension the altitude owns

Unchanged by this amendment; the operational/environmental envelope remains where the 2026-07-30 and
later runs put it (named under *Deferred* rather than silent). No dimension went dark.
