# Reviewer Gate — amendment-verification lens (ad-hoc)

**Why this lens is earned rather than invented.** This file's gate has opened new findings on four consecutive runs, and for two of them the headline finding was against **the amending run's own text** — one run replaced a refutable reason with a new refutable absolute, another wrote a standing instruction that was literally unsatisfiable, a third had its own headline claim refuted. Three separate times a refutable *reason* has survived next to a correct *conclusion*. The lens reads only what this run wrote.

**Run:** `bmad-architecture` Update, 2026-08-05 (second of the day) — Story 17.6 AC-9.
**Posture:** sequential inline (see the rubric-walker note).
**Verdict:** PASS after three applied fixes. Every surviving claim in the new text is either measured at this run or a reading of a line quoted from the shipped file.

## Claim-by-claim audit of the new text

| New claim | Stronger than verified? |
| --- | --- |
| *the answer being that this candidate is not a root-level provider at all* | No, after narrowing. The draft said *"there is no second root-level provider"*, a claim about the future. **Fixed.** |
| *the rule … is a reporting contract rather than a structural invariant* | No. It fixes which channel reports an outcome; it fixes no shared shape, owner or mutation path. |
| *AD-24's `Binds` does not reach them* — where *them* = behavioural channel rules | No. `Binds` (`:206`) names the root layout's client boundary, browser-persisted operator preferences, the `settings`-vs-`localStorage` choice, and full-screen room-facing surfaces. A reporting channel is in none of them. Note the precision that matters: `Binds` **does** reach the *mount*; it does not reach the *rule*. |
| *`:212`'s test is decidable, and running it disqualifies the root* | No. Quoted from `:212` and applied to a consumer set the entry now says 17-9 must enumerate. |
| *the closure clause is what forbids the outcome* | No — and this is the one place the draft could have repeated this file's recurring failure. The mount rule is about **where a provider goes**; the hazard (a themed toast painting on the congregation's screen) is forbidden by `:213`'s *"in any form, under any setting"*. Citing `:212` for that hazard would have been support by resemblance. The entry now says which clause carries which. |
| *the failure … bitten four times* | **YES — removed.** Only the memlog carries the count; `:456`, the sole place in the spine that counts it, says *"the third time"*. Replaced with the property, which cannot rot. |
| *no route group at all* | No. Measured (`find src/app -type d -name "(*)"` → empty). Load-bearing: it is what makes *the root is the narrowest layout today* a measurement rather than an inference from "one layout". |
| *eight page-level mounts … are not a layout* | No. A reading of `:212`'s own word, **layout**. |
| *the ceiling entry below … is the analogy; `:212` is the authority* | No — deliberately labelled. `:468` refuses adding another **leaf file to any of the four guard lists**; extending that to eight per-page mounts is an analogy. The authority that refuses them is `:212`. The draft nearly asserted the analogy as the rule, which is the AD-28 `shortName` failure shape. |
| *asserted by nothing* (the narrowest-layout half) | No. `tests/theme-chrome.test.mjs:1940-1944` read in full; it asserts the absence of `'use client'` on the root layout and nothing else about the mount. |
| *invisible to the suite, and visible to the congregation* | No. The first from the two facts above; the second because both room-facing pages inherit the single root layout. |
| *`sonner` owns none, wired or not* | No. Grep of the spine for `sonner` returns exactly one hit — this entry. No `AD` names it. |
| *both read before being cited here* (the two tracking files) | No. `sprint-status.yaml:378` and the `epics.md` Story 17.9 block were both opened. |

## The one place this run declined to smooth something

`tests/theme-chrome.test.mjs:2022-2024` carries a comment reading *"filed as EXPERIENCE.md Open Item 4 under Story 17.6, which owns the decision."* After this change set, Open Item 4's owner is `17-9-toast-channel-wiring` and 17.6 **owned** the decision in the past tense. The comment is in `tests/`, which this run must not touch, and Story 17.6 dispositioned it deliberately. Left alone, recorded rather than smoothed.

## Did this run change any `AD`?

No. Census 29 → 29; ids AD-1..AD-29 contiguous; tag distribution 13 `[ADOPTED]` / 5 `[ADOPTED, partial]` / 11 `[TARGET]`, identical before and after. Nothing renumbered, retired, reused or retagged. The `AGENTS.md` never-renumber rule held with no waiver. `lint_spine.py`: 0 findings, before and after the semantic lenses.

## Line-offset discipline

The repair is **one line replacing one line**, so the file stays 495 lines and every downstream citation keeps its address — `:465` (the AD-24 closure-gate entry, cited by Story 17.6) and `:468` (the leaf-file refusal, cited by Story 17.6 and by `EXPERIENCE.md` Open Item 4) were re-read at their old line numbers after the edit and are unmoved. This was a constraint on the drafting, not a lucky outcome: Story 17.6's AC-10 asserts that every citation it wrote resolves, and that story is mid-review.
