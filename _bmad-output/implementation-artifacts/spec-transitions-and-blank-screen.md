---
title: 'Selectable slide transitions and a blank-screen control'
type: 'feature'
created: '2026-07-27'
status: 'done'
baseline_revision: 'dbd93126dd1cdac6e416f576c2fad5ca3599d7e9'
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/project-context.md'
warnings: ['multiple-goals']
---

<intent-contract>

## Intent

**Problem:** The deck's transition is hardcoded to a single fade, chosen for the operator with no way to change it. Separately, there is no way to black out the projector — during an unplanned pause, a technical problem, or a moment that should not be on the screen, the operator's only options are to leave the current slide up or to close the projector window and lose the session.

**Approach:** Make the transition a small, explicit choice that applies uniformly to a deck and identically in the browser and the generated PPTX, and give the operator a blank-screen toggle that blacks the projector out and restores it without disturbing the deck position.

## Boundaries & Constraints

**Always:**
- The offered transitions are **none, cut, fade, dissolve and push**. Each must behave equivalently in the generated PPTX and in the browser — a deck that fades in PowerPoint fades on the projector.
- One transition style applies throughout a deck. Mixing styles within a service is out of scope, and the existing per-slide opt-out (`SlidePlanItem.fade === false`, used for flyer images) keeps working: those slides get no transition regardless of the chosen style.
- Fade remains the default, so an operator who changes nothing sees exactly today's behaviour.
- Blank screen blacks the projector only. The Presenter keeps showing the current and next slide so the operator can still see where they are, and the deck position must not move while blanked.
- Blanking and unblanking are reversible at any time, survive a projector that is opened or reloaded while blanked, and never require the operator to close the projector window.
- A projector that misses a message must not end up stuck: the existing `request-sync` answer has to carry the blank state too.
- Transition and blank state changes travel over the existing `BroadcastChannel` (`@/lib/present-channel`); no server realtime channel.
- PPTX transition XML stays inside the existing single JSZip post-processing pass, keeps its own `try/catch`, and a failure degrades to a deck with no transitions rather than no deck.
- Registry, slide order, hymn splitting and placeholder resolution are untouched.
- Admin settings stay admin-only through `requireAdminSession`, validated server-side, and rejected values leave the stored setting unchanged.
- New tests use `node:test` and are appended to the explicit `package.json` test list.
- Read the relevant guide under `node_modules/next/dist/docs/` before changing Next.js APIs.

**Block If:**
- A chosen transition cannot be expressed in PowerPoint without the `p14` extension namespace and an `mc:AlternateContent` fallback. Do not ship a transition that silently degrades to nothing in the deck — drop it from the offered set and report it.

**Never:**
- No transition that needs the `p14` extension namespace (morph, ripple, glitter, vortex and the rest). The five above are all plain `p:transition` children.
- Do not make the projector depend on the Presenter staying open to remain unblanked.
- Do not let blanking clear the scripture overlay state or move the slide index.
- No new dependency, no animation library.
- Do not change the PPTX response shape, the download route, or the slide plan contract.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default | nothing configured | Fade, exactly as today | — |
| Choose none | transition = none | No `<p:transition>` in any slide; browser cuts instantly | — |
| Choose cut | transition = cut | `<p:cut/>` in the deck; browser swaps with no animation | — |
| Choose fade | transition = fade | `<p:fade/>`; browser crossfades | — |
| Choose dissolve | transition = dissolve | `<p:dissolve/>`; browser uses its nearest equivalent, documented | — |
| Choose push | transition = push | `<p:push dir="l"/>`; browser slides the incoming slide in | — |
| Per-slide opt-out | slide with `fade: false` | No transition on that slide in either output, whatever the style | — |
| Invalid stored value | settings row holds junk | Falls back to fade; logged, not thrown | Never breaks deck generation |
| Invalid submitted value | admin PUTs an unknown style | 400, stored setting unchanged | `{ error }` |
| Transition XML fails | JSZip step throws | Deck still downloads, without transitions | Logged, buffer returned |
| Blank on | operator presses the control | Projector goes black; Presenter still shows current/next and marks the blanked state | — |
| Blank off | operator presses again | Projector returns to the same slide it was on | — |
| Advance while blanked | operator moves slides | Deck position moves; projector stays black until unblanked | — |
| Projector opened while blanked | new projector window | Comes up black, not showing the slide | — |
| Projector reloaded while blanked | reload | Same — blank state survives via `request-sync` | — |
| Blank with scripture showing | overlay active, then blank | Projector goes black; unblanking restores the overlay | — |
| Presenter closed while blanked | operator closes the Presenter | Projector stays as it is; no crash, no stuck spinner | — |
| Keyboard | operator presses the blank key | Toggles blank; ignored while typing in an input or while the grid dialog is open | — |

</intent-contract>

## Code Map

- `src/lib/pptx.ts` -- `injectFadeTransitions` splices the literal `<p:transition spd="slow"><p:fade/></p:transition>` after `</p:cSld>` (falling back to before `</p:sld>`), skipping a slide that already has one. `SlideCtx.fadeIndexes` is a 1-based set filled by `addSlide(ctx, fade)`; `renderArtifactSlide(ctx, item.artifact, item.fade !== false)` decides. `postProcessArchive(buffer, indexes)` loads one JSZip, runs `collapseDuplicateMedia` then the injection, each in its own `try/catch`, and emits once with DEFLATE level 6.
- OOXML: `none` (omit the element), `<p:cut/>`, `<p:fade/>`, `<p:dissolve/>`, `<p:push dir="u|d|l|r"/>`, `<p:wipe dir="…"/>` are all plain `p:` children. `spd="slow|med|fast"` sits on `p:transition`. Anything fancier needs `p14` + `mc:AlternateContent`.
- `pptxgenjs` 4.0.1 exposes **no** transition API — raw XML injection is the only route.
- `src/app/services/[id]/present/projector/ProjectorClient.tsx` -- `fade` state plus a two-frame `requestAnimationFrame` dance on `sync`; one wrapper with `transition-opacity duration-500`. Only one slide is mounted, and the index swaps on the next frame rather than after the fade, so today's "fade" is really a cut into a fade-in. The scripture overlay is a ternary *inside* that wrapper, not a stacked layer. A `useEffect` already claims `html`/`body` overflow, scrollbar-gutter and background for the projector's lifetime.
- `src/app/services/[id]/slideshow/SlideshowClient.tsx` -- the same pattern in `go(delta)`; `Home`/`End` bypass it entirely.
- `src/lib/present-channel.ts` (20 lines) -- `PresentMessage` = `sync` | `request-sync` | `scripture` | `clear-scripture`; `presentChannelName`, `openPresentChannel` (null on SSR). Only `PresenterOperator.tsx` and `ProjectorClient.tsx` import it. `PresenterOperator` answers `request-sync` with the current index.
- `src/lib/settings.ts` -- `getSetting(key)`, `setSetting(key, value)`, plus the typed `getPptxRetentionDays` / `setPptxRetentionDays` pair to copy. Table is `settings(key TEXT PRIMARY KEY, value TEXT NOT NULL)`.
- `src/app/api/admin/settings/route.ts` -- `GET`/`PUT`, `requireAdminSession` → 403, non-object body → 400, value validation → 400, returns the stored value.
- `src/app/admin/RetentionSettings.tsx` + `src/app/admin/page.tsx` -- the admin card pattern: server page reads the setting, passes it as `initialDays`, client card PUTs.
- `_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md:180-184` -- **FR-7 "Apply a single elegant fade transition"**, consequence "a single transition style is used throughout (no mixed or elaborate transitions)". Line ~297 **FR-15** says the slideshow uses "the single fade transition" and "matches the Deck's single transition style".
- `_bmad-output/planning-artifacts/epics.md:26,69` -- the FR-7 inventory row and its coverage row.
- `tests/pptx-media-dedup.test.mjs:105` -- the only fade assertion: counts slides containing `<p:transition>` and asserts more than zero. Style-agnostic, so it will not catch a wrong style.
- No test renders `ProjectorClient`, `SlideshowClient` or `PresenterOperator`; there is no DOM harness in the repo.

## Tasks & Acceptance

**Execution:**

- [x] `src/lib/transitions.ts` -- new: the `SlideTransition` union (`none | cut | fade | dissolve | push`), a default of `fade`, a parser that coerces an unknown stored value back to the default, and the single table mapping each style to its PowerPoint XML and to the browser's animation parameters -- one place so the two surfaces cannot drift.
- [x] `src/lib/settings.ts` -- add `getSlideTransition()` / `setSlideTransition(value)` following the retention pair, defaulting to fade and coercing an invalid stored value rather than throwing.
- [x] `src/lib/pptx.ts` -- generalise the injector from the hardcoded fade string to the transition table, keep the per-slide opt-out and the "already has a transition" skip, emit nothing at all for `none`, and keep the whole step inside its existing `try/catch` in the single post-processing pass.
- [x] `src/app/api/admin/settings/route.ts` -- expose the transition in `GET` and accept it in `PUT`, validating against the union and leaving the stored value untouched on rejection.
- [x] `src/app/admin/TransitionSettings.tsx` + `src/app/admin/page.tsx` -- an admin card to choose the transition, matching `RetentionSettings`.
- [x] `src/lib/present-channel.ts` -- extend `PresentMessage` with a blank-state message, and carry both the index and the blank state in the `request-sync` answer so a projector opened or reloaded while blanked comes up black.
- [x] `src/app/services/[id]/present/projector/ProjectorClient.tsx` -- mount the outgoing slide alongside the incoming one for the duration of the transition and drive it from the table, so a crossfade actually crossfades and push can slide; render the blank state as a layer that covers the slide and the scripture overlay without discarding either.
- [x] `src/app/services/[id]/slideshow/SlideshowClient.tsx` -- use the same transition mechanism, including on the `Home`/`End` jumps that currently bypass it.
- [x] `src/app/services/[id]/present/PresenterOperator.tsx` -- a blank-screen toggle with a keyboard shortcut, inert while typing in an input or while the grid dialog is open, showing clearly when the projector is blanked; the deck position must stay put while blanked.
- [x] `src/app/services/[id]/{present,slideshow}/page.tsx` -- read the configured transition server-side and pass it down.
- [x] `tests/transitions.test.mjs` -- new: the table's PowerPoint XML per style, the `none` case emitting nothing, the invalid-value coercion, and the per-slide opt-out.
- [x] `tests/pptx-media-dedup.test.mjs` -- tighten the fade assertion to check the *configured* style is what lands in the slide XML, not merely that some transition exists.
- [x] `package.json` -- append the new test file to the explicit `test` list.
- [x] `_bmad-output/planning-artifacts/prds/prd-bic-pptx-workflow-2026-07-10/prd.md` -- amend **FR-7** and **FR-15**: the deck carries one configurable transition applied uniformly, still never mixed within a deck, with fade the default. Add the blank-screen capability to the Presenter requirement (FR-16), which does not mention it today.
- [x] `_bmad-output/planning-artifacts/epics.md` -- update the FR-7 inventory and coverage rows to match the amended wording.

**Acceptance Criteria:**
- Given no configuration, when a deck is generated and presented, then both carry a fade, exactly as before this change.
- Given each of the five styles in turn, when a deck is generated, then every eligible slide carries that style's PowerPoint element and no other, and `none` produces no `<p:transition>` at all.
- Given a slide marked `fade: false`, when any style is configured, then that slide carries no transition in either output.
- Given an invalid stored setting, when a deck is generated, then it falls back to fade and still downloads.
- Given the operator blanks the screen, when the projector is observed, then it is black; when they unblank, then it shows the same slide it was on.
- Given the projector is opened or reloaded while blanked, when it connects, then it comes up black.
- Given the operator advances slides while blanked, when they unblank, then the projector shows the slide they advanced to.
- Given `npm test`, `npm run build` and `npx tsc --noEmit`, when they run, then all pass and no new lint error appears in this diff.

## Spec Change Log

## Review Triage Log

## Design Notes

Both halves already exist in weaker form, and the honest move is to fix them rather than layer on top.

Today's browser "fade" is not a crossfade: the index swaps on the frame after the opacity starts dropping, so it reads as a cut into a fade-in. Only one slide is mounted, which is also why a push is impossible without change. Keeping the outgoing slide mounted for the transition's duration fixes the existing fade and is the prerequisite for push — the same change serves both.

The scripture overlay is a ternary inside the fading wrapper rather than a layer. Blank must not reuse that shape: blanking has to preserve whatever is underneath, overlay included, so it belongs as a cover outside the transition wrapper.

`dissolve` has no faithful CSS equivalent. It maps to PowerPoint's `<p:dissolve/>` and to a fade in the browser; that is a documented approximation, not a claim of parity, and it is stated in the transition table where a reader will see it.

**This contradicts the PRD as written and the PRD is being amended, not reinterpreted.** FR-7 is titled "Apply a single elegant fade transition" and FR-15 says the slideshow uses "the single fade transition". A configurable-but-uniform transition preserves the "no mixed transitions within a deck" intent but plainly contradicts the word *fade*, so both requirements are amended in the same change set rather than left contradicting the code.

## Verification

**Commands:**
- `npm test` -- expected: all suites pass, including the new transition tests
- `npx tsc --noEmit` -- expected: no type errors
- `npm run build` -- expected: succeeds
- `npm run lint` -- expected: no new error attributable to this diff
- `node scripts/smoke-deck-fidelity.mjs` -- expected: no regression against the baseline of 28 pass / 2 known-stale fail

**Manual checks (if no CLI):**
- Generate a deck under each style, open it in PowerPoint, and confirm the transition matches the choice.
- Open the projector, step through slides, and confirm the browser transition matches the deck's.
- Blank and unblank from the Presenter; blank, advance, then unblank; and open a second projector while blanked.

## Auto Run Result

Status: done
Blocking condition: none

### Summary

Five transition styles - none, cut, fade, dissolve, push - selected once by an administrator and applied uniformly to a deck, identically in the generated PPTX and in the browser, from one shared table. Fade stays the default and its PowerPoint XML is byte-identical to what shipped before. A blank-screen control blacks the projector from the Presenter and restores it without moving the deck or discarding a scripture overlay.

### Two defects the work uncovered and fixed

The browser fade was not a crossfade: one slide was mounted and the index swapped on the frame after the opacity started dropping, so it read as a cut into a fade-in. Keeping the outgoing slide mounted fixes it and is what makes push possible. `Home`/`End` in the slideshow bypassed the transition entirely; they no longer do.

A projector window the OS considers occluded receives no `requestAnimationFrame`, which would have left an incoming slide stuck at zero opacity. The run now also settles on a timer, which is throttled rather than stopped.

### Artefacts amended, not bypassed

PRD FR-7 was titled "Apply a single elegant fade transition" and FR-15 required "the single fade transition". Both are amended to a single *configurable* transition, preserving the no-mixing-within-a-deck intent, and FR-16 gains the blank screen it never documented. The FR-7 rows in `epics.md` follow.

### Verification

- `npm test` - 301 pass, 0 fail
- `npx tsc --noEmit` - clean; `npm run build` - succeeds; eslint clean on the changed files
- Deck evidence: four decks generated through the running app and the slide XML grepped. fade, dissolve and push each land their own element on 54 of 56 slides; none lands zero; the two skipped are the `fade: false` flyer opt-outs.
- Blank verified over a real `BroadcastChannel`: on/off by button and by both keys, advancing while blanked, a projector connecting while already blanked coming up black off its own handshake, and a scripture overlay surviving underneath.

### Residual risks

- No pixels were confirmed. The browser pane does not composite, so every browser check was DOM state and computed style. Nobody has watched a push actually push, and the double-mount cost of `SlideView` during a transition is unmeasured - worth one pass on a real screen before a service.
- `dissolve` maps to PowerPoint's own dissolve but to a fade in the browser; that approximation is documented in the transition table rather than claimed as parity.
