# Reviewer Gate — Version / Reality Check

**Run:** 2026-08-03 architecture Update, AD-24 closure-gate synchronization after Story 17.8
**Target:** `ARCHITECTURE-SPINE.md`, changed lines only (`updated` plus the four replacement paragraphs at lines 446–449)
**Lens:** every changed claim reality-checked against the current guard, relevant source, Story 17.8, and its deferred-work handoff.
**Verdict:** **CHANGES REQUIRED — one HIGH reality finding.** The edge-sweep, closed-props, `.ts` caller, remaining-ceiling, ownership, and line-citation claims all resolve correctly. The outline paragraph, however, calls the implementation a positive colour classifier and says it rejects invalid values; the current function-name check still accepts syntactically invalid colour functions, which can leave the inherited theme outline in effect.

---

## V1 — HIGH — the outline paragraph overstates a recognizer as a positive CSS-colour classifier

The updated spine says `localColour` “positively recognises locally resolved named, Tailwind, hex and colour-function values while rejecting unresolved, invalid and zero-alpha values” and concludes that the outline exception list is closed by encoding the criterion.

That is not yet true for colour functions. `localColour` at `tests/theme-chrome.test.mjs:856-869` checks that the function name is one of seven names, the body is non-empty, no unresolved variable-like form appears, any words are from a small allow-list, and an alpha—when detected—is visible. It does **not** validate the function grammar or channel arity. Executing the current function directly against controls produced:

| Value | Current result | Reality |
|---|---:|---|
| `rgb(1_2)` | accepted | invalid `rgb()` arity; the declaration is ignored rather than locally resolving a visible colour |
| `rgb(1)` | accepted | invalid `rgb()` arity |
| `rgba(255_255_255/1)` | rejected | valid CSS legacy alias with visible alpha |
| `hsla(0_100%_50%/1)` | rejected | valid CSS legacy alias with visible alpha |
| `rgb(255_255_255/0)` | rejected | correct zero-alpha rejection |
| `#fff0` | rejected | correct zero-alpha rejection |

The first two cases matter to AD-24’s guarantee: an invalid `focus-visible:outline-[rgb(1_2)]` can satisfy `hasVisibleLocalOutlineColour`, while the browser ignores that colour and the universal theme-dependent outline remains the effective paint. The focused controls at `:1064-1096` do not cover malformed function arity, so 54/54 green does not close this shape.

This does **not** invalidate Story 17.8’s recorded seven injection results; its own record correctly says those results are evidence for those injections, not a coverage claim (`17-8-guard-criteria-encoding.md:151-157`). It does invalidate the architecture’s broader unqualified wording.

**Required correction before Finalize:** either repair the guard and add matching invalid/valid function controls through a separately authorized implementation path, or keep the architecture synchronized with reality by recording this function-grammar hole as a live ceiling and narrowing “rejecting invalid values” / “No subtraction list remains” to what the current classifier actually proves. An architecture-only Update must not silently claim the former fix.

## Changed claims and citations that pass

| Updated claim | Reality check | Result |
|---|---|---|
| `projectedTree` has no extension enqueue filter and the closure test pins a floor of 27 descendants | `tests/theme-chrome.test.mjs:1031-1048`, `:1152-1162` | PASS; the citations `:1031` and `:1157-1162` are exact. |
| `moduleImports` follows re-exports and bare side-effect imports | `:990-1011`, specifically `:994-1000` | PASS; `:990` correctly points to the function. |
| composed props resolve locally and fail loudly on unreadable external composition | `:1468-1507` | PASS; `:1468` is exact. |
| top-level index signatures, mapped types, and rest destructuring are rejected while nested index/property shapes, arrays, tuples, and a default initializer containing object spread remain allowed | `:1367-1436`, controls `:1510-1537` | PASS. The phrase “nested metadata types … and object spreads” is loose grammar, but the cited controls accurately pin the intended boundaries. |
| JSX caller belt covers `.tsx`; direct `React.createElement` belt covers `.tsx` and `.ts`, including opaque props | helper `:1185-1219`; loops `:1222-1245` | PASS; both ranges are exact. |
| edge utilities sweep every non-root reached module, with erased type declarations excluded | `:678-700`, `:1050-1062` | PASS; this correctly removes the old transitive-edge ceiling requested at `deferred-work.md:256`. |
| five older ceilings remain live | runtime-composed theme regexes `:585-590`; CSS resolution candidates `:1003-1011`; downward-only comment `:1120-1133`; shell spelling assertion `:1564-1577`; four root lists `:595-606`, `:946-949`, `:1546`, `:1559-1562` | PASS; all citations resolve precisely and the set matches the preservation list in `deferred-work.md:256`. |
| four-list derivation remains owned by Story 17.7 | `deferred-work.md:259-261` | PASS; citation and owner are exact. |
| `globals.css` applies themed body paint and stable scrollbar gutter | `src/app/globals.css:124-129` | PASS; exact citation. |
| current projected component signatures expose no `className` | `src/components/SlideView.tsx:18`; `src/components/artifacts/ArtifactSlide.tsx:229-233`; guard `:1539-1555` | PASS. |
| Story 17.8 is done and handed this amendment to architecture | story `:7`, `:151-177`; deferred work `:245-256` | PASS. |

## Version / web-verification disposition

**No changed claim adds or changes a library, framework, starter, dependency, or version, so no web verification is required for this update.** The changed material is entirely a repository-local account of one static test and its source boundaries. The spine’s existing stack/version rows were not changed and are outside this review’s scope.

## Evidence run

- `node --test tests/theme-chrome.test.mjs` — **54/54 pass** on the current working tree.
- Direct execution of the current `localColour` definition produced the function cases recorded in V1.
- No spine file was edited by this reviewer.
