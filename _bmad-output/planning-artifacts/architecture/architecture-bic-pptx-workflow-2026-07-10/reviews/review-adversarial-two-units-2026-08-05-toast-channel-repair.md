# Reviewer Gate — adversarial two-units lens

`finalize_reviewers[1]`: *construct two units one level down that each obey every `AD` to the letter yet still build incompatibly.*

**Run:** `bmad-architecture` Update, 2026-08-05 (second of the day) — Story 17.6 AC-9, the toast-channel *Deferred* repair.
**Posture:** sequential inline (see the rubric-walker note).
**Verdict:** PASS on the question that decides this run — no pair of units can diverge on the **mount**, so no new or amended `AD` is owed. Two seams found; both applied to the entry. Neither is a divergence AD-24 fails to decide.

## The pairs constructed

**Pair 1 — two provider stories.** Story 17-9 and any later client provider. Both apply `:212`: enumerate consumers, mount at the narrowest layout containing all of them, root only when that enumeration is *every route*. The procedure is the same for both and its output is determined by the consumer set, so they cannot choose incompatibly. Two providers landing at *different* depths is permitted by the rule and is not a divergence. **No hole.**

**Pair 2 — Story 17.7 and Story 17-9. THIS IS THE SEAM.** 17.7's registered shape (`:216`, `epics.md`) is *one route-group layout owning every room-facing URL* — the room-facing half. If 17.7 ships that and leaves the operator routes directly under `src/app`, then after 17.7 the narrowest layout containing the operator routes is **still the root**, which `:212` forbids the provider from taking. 17-9 is then forced to *create* an operator segment itself — a route-surface change carrying the `EXPERIENCE.md` IA obligation — or to reach for the eight per-page mounts, which `:212` also refuses because it fixes the mount at a **layout**.
Both units still obey every `AD`; what fails is 17-9's **precondition**, not its choice. That makes it a sequencing/ownership gap rather than an invariant gap, so it belongs in this *Deferred* entry with a named precondition, not in a new `AD`. **Applied:** the entry now states that 17.7's registered scope is the room-facing half, that whether its split yields the operator-side layout is 17.7's own design call, and that 17-9's real precondition is *such a segment exists, whoever creates it*.
Worth recording separately: *"Story 17.7 is what creates that segment"* is written into `epics.md` (Story 17.9 block) and `EXPERIENCE.md` (Open Item 4, point 3) by Story 17.6. That is one step stronger than 17.7 has promised. Those are another story's deliverables with a code review pending, so this run **reports** it rather than editing them.

**Pair 3 — 17-9 and a later story that wants a toast on an ungated route. SECOND SEAM.** The entry's own premise is that the consumers *"enumerate to operator routes only"*, but `toast(` has **zero** call sites today, so that is the ceiling `:213` imposes rather than a measured list. `src/app/login/page.tsx` is ungated and not room-facing: a segment scoped to *gated* routes and one scoped to *every non-room-facing* route are different sets, and two stories could each pick a different segment while both obeying `:212` — because `:212` is decidable only **once the consumer set is fixed**. It does not fail; it hands the enumeration to the provider's own story, which is exactly what its text says. **Applied:** the entry now says the enumeration is 17-9's to perform, that performed today it returns nothing, and names `login` as the case that decides the segment's edge.

**Pair 4 — 17-9 and the closure gate.** A unit that mounts at the root passes the entire suite: `tests/theme-chrome.test.mjs:1940-1944` asserts only that the root layout carries no `'use client'`, and the closure gate's walk is downward-only from the projected roots while a root-mounted provider renders *above* them. So the wrong choice is not merely permitted by the tests, it is invisible to them. This is code-owned, so it is filed in `deferred-work.md` with `17-9-toast-channel-wiring` as owner rather than patched here — an architecture Update run does not touch production code.

## What was checked and found *not* to be a hole

- **A toast reaching a room-facing surface.** `:213` forbids it outright — *"in any form, under any setting"* — and a `<Toaster />` reading `useTheme()` is operator chrome by content, not by resemblance. Two units cannot legitimately disagree.
- **The behavioural rule.** One-event-one-channel governs *which* channel reports an outcome, never a shared data shape, an owner, or a mutation path. Two units obeying it cannot build incompatible structures.
