# Reviewer Gate — version / reality-check lens

`finalize_reviewers[0]`: *verify every committed decision was web-researched or reality-checked rather than asserted from training data.*

**Run:** `bmad-architecture` Update, 2026-08-05 (second of the day) — Story 17.6 AC-9, the toast-channel *Deferred* repair.
**Posture:** sequential inline (see the rubric-walker note).
**Verdict:** PASS. One finding, applied.

## What this run committed, and how each claim was established

| Claim in the repaired entry | How established at this run |
| --- | --- |
| `sonner` is declared `^2.0.7` | `git grep -n sonner package.json` → `:33`. Read, not recalled. |
| `Toaster` is exported and mounted nowhere | `git grep -n Toaster src/` → four hits, all `src/components/ui/sonner.tsx` (`:4`, `:7`, `:12`, `:49`). |
| `toast(` is called nowhere | `git grep -n "toast(" src/` → no output. |
| `sonner.tsx` reads the theme and paints from tokens | File read in full: `:3` and `:8` `useTheme()`; `:33-36` `--normal-bg` / `--normal-text` / `--normal-border` / `--border-radius` from `var(--popover)` / `var(--popover-foreground)` / `var(--border)` / `var(--radius)`. |
| Exactly one layout; no other route shell | `find src/app -name layout.tsx` → one file. `find` for `template.tsx` / `error.tsx` / `not-found.tsx` / `loading.tsx` → empty. |
| **No route group exists** | `find src/app -type d -name "(*)"` → empty. Measured at this run rather than inferred from "one layout"; it is what makes *the narrowest layout containing the operator routes is the root* true today rather than merely likely. |
| Ten `page.tsx`, two room-facing | `find src/app -name page.tsx` → 10, listed; `services/[id]/present/projector` and `services/[id]/slideshow` are the room-facing pair. |
| AD-24 `:212` mount rule, `:213` closure clause, `:216` Story 17.7 shape | Each read at the cited line in the shipped file. |
| Forward key resolves in both tracking files | `sprint-status.yaml:378` `17-9-toast-channel-wiring: backlog`, between `17-8-guard-criteria-encoding` and `epic-17-retrospective`; `epics.md` carries `#### Story 17.9: The Toast Channel Gets Wired *(backlog — depends on Story 17.7)*` after Story 17.8. Both read before being cited. |
| Only the *upward* half of `:212` is asserted | `tests/theme-chrome.test.mjs:1940-1944` read in full: `assert.doesNotMatch(layout, /^\s*'use client'/m, …)`. No assertion anywhere reaches the narrowest-layout half. |

## Finding

**MEDIUM — a version question this run inherited and did not answer, now answered in the entry.** The memlog's 2026-07-31 `next-themes` entry left `sonner` out of the Stack table *conditionally*: *"story 17-6 decides whether it gets one."* This run had to settle it or leave a dangling condition. **Applied:** the entry states that a Stack row is not earned, on the criterion the `next-themes` row (`:305`) states for itself — owning a contract an `AD` cites. `sonner` owns none.

## No currency claim was introduced, so none was web-verified

This run committed **no** claim that any named technology is at head, still exists, or still fits — the only version it names is the declared `^2.0.7`, read from `package.json`. Recorded explicitly so the absence reads as a scope boundary rather than a skipped check: `sonner`'s upstream currency remains untracked by this spine, which follows from it having no Stack row, and that is now stated in the entry rather than left implicit.
