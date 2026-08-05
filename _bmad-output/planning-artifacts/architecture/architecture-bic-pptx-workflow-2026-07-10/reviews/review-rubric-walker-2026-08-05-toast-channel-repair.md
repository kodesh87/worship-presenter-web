# Reviewer Gate — rubric walker

**Run:** `bmad-architecture` Update, 2026-08-05 (second of the day) — Story 17.6 AC-9, the toast-channel *Deferred* repair.
**Target:** `ARCHITECTURE-SPINE.md`, the *Deferred* entry at `:464`.
**Posture:** run **sequentially inline**, not as a subagent. This host forbids the Agent tool unless the user asks for it — the same posture recorded for the 2026-07-29, both 2026-08-01, the 2026-08-03 and the earlier 2026-08-05 runs. Six runs now share it; noted so a reader does not take it for an oversight.
**Verdict:** PASS with three findings, all applied to the entry before close.

## Good-spine checklist

| Criterion | Judgement |
| --- | --- |
| Fixes the real divergence points one level down | The entry is a *Deferred* item, so the question is what it leaves open. The wiring has an owner (`17-9-toast-channel-wiring`) and a named precondition; the segment-creation seam is stated rather than silent. No divergence is left unnamed. **PASS** |
| Every `AD` Rule enforceable and prevents its stated divergence | No `AD` changed. Census 29 → 29, AD-1..AD-29, 13 `[ADOPTED]` / 5 `[ADOPTED, partial]` / 11 `[TARGET]` — identical to the AD-29 run's closing census. **PASS** |
| Nothing under *Deferred* could let two units diverge | See the adversarial lens. The one seam found (who creates the operator segment) is sequencing/ownership, not two units choosing incompatibly, and it is now named with a precondition. **PASS** |
| Named tech verified-current | The entry introduces no currency claim. See the version lens. **PASS** |
| Ratifies rather than contradicts the codebase | Every factual claim in the entry was measured in this worktree at this run — one layout, no route group, ten `page.tsx`, `Toaster` confined to one file, zero `toast(` call sites, `sonner.tsx:33-36`'s token painting, `tests/theme-chrome.test.mjs:1940-1944`'s assertion. **PASS** |
| A whole dimension left silent | n/a for a single-entry repair; the dimension this entry owns (the client-boundary mount for a second provider) is now decided rather than open. **PASS** |

## Findings

**1. HIGH — the entry carried a rotting count instead of the property.** The draft read *"the failure this file has now been bitten by four times."* The count is supported by the memlog's 2026-08-05 AD-29 correction, but `:456` — the only place in the spine that counts it — says *"the third time"*, so a reader of the spine alone would find the entry contradicting its own file. **Applied:** replaced with the property — *"support by resemblance rather than by content — the failure the AD-5 precedent names and the one this file keeps being bitten by."* No number to rot.

**2. MEDIUM — the `sonner` Stack-row question was left re-derivable, and the previous answer was conditional on this very story.** The memlog's 2026-07-31 entry left `sonner` out of the Stack table on the stated ground that *"story 17-6 decides whether it gets one"*. 17.6 has now decided, so a reader following that thread lands on an unanswered question. **Applied:** the entry now states that the decision does not earn a Stack row and why — `sonner` gained a decided *behavioural* role and still owns no contract any `AD` cites, whereas `next-themes` earns its row precisely by owning two that AD-24 cites (`:305`).

**3. MEDIUM — *"there is no second root-level provider"* was a claim about the future.** The draft's opening asserted a general fact where the verified one is narrower. **Applied:** narrowed to *"this candidate is not a root-level provider at all."*

## Not findings, checked and dismissed

- **Should the three-clause rule be in the spine?** No. It is a reporting contract; `AGENTS.md`'s authority map gives `EXPERIENCE.md` behavioural channel rules, and AD-24's `Binds` (`:206`) names the client boundary, browser-persisted preferences, the storage-target choice and room-facing surfaces — not reporting channels. The entry must also **not** restate the clauses, because Story 17.6 AC-1 asserts a stated-once property over the tracked tree; it cites instead.
- **Should `AD-24` gain a clause?** No. `:212` already decides the mount by a decidable procedure and `:213` already forbids the outcome a root mount would produce. Nothing in either is narrowed, weakened or carved out.
