# Reviewer Gate — RUBRIC WALKER lens

**Target:** `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md`
**Run:** `bmad-architecture` Update, 2026-08-03 — synchronize AD-24's closure-gate account with completed Story 17.8
**Primary passage:** `ARCHITECTURE-SPINE.md:446-449`
**Date:** 2026-08-03

---

## Verdict

**PASS — no critical, high, medium, or low finding.** The amendment closes exactly the Story 17.8 ceilings named in the handoff, preserves the five ceilings that remain live, and makes every new factual statement checkable against the shipped guard. It neither changes AD-24's invariant nor silently promotes the partial shell closure to adopted: Story 17.7 remains the owner of the route-level gap.

---

## Evidence reviewed

| Artefact / check | Result |
| --- | --- |
| `ARCHITECTURE-SPINE.md` | Full spine and the amended AD-24 / Deferred passages reviewed against the good-spine checklist. |
| `stories/17-8-guard-criteria-encoding.md:151-177` | Confirms seven reacting probes, the four resolved deferred records, and the required architecture handoff. |
| `deferred-work.md:239-265` | Confirms the three Story 17.8 closure subjects and preserves the two Story 17.7 records adjacent to them. |
| `tests/theme-chrome.test.mjs` | All cited implementation regions inspected directly. |
| Deterministic spine lint | `ok: true`, zero findings. |
| Focused guard suite | **54 tests, 54 pass, 0 fail**. |
| Registry/package currency check | Current npm metadata agrees with the spine's currency/deferred account: Next 16.2.12, React 19.2.8, TypeScript 7.0.2, better-sqlite3 13.0.2, fabric 7.4.0, ESLint 10.8.0, and next-themes 0.4.6; the spine accurately distinguishes pinned project versions from current upstream versions. |

---

## Tiered findings

### Critical

None.

### High

None.

### Medium

None.

### Low

None.

The five remaining AD-24 guard ceilings are not findings against this update. They are explicitly retained as live, bounded gaps with revisit conditions and, where actionable now, Story 17.7 ownership: runtime-composed classes, CSS imports, downward-only traversal, the unasserted duplicate-shell prohibition, and the four hardcoded root lists.

---

## Story 17.8 handoff reconciliation

The required handoff at `stories/17-8-guard-criteria-encoding.md:164` and its detailed form at `deferred-work.md:256` asked for four things. All four landed without consuming unrelated ceilings.

### 1. Remove the closed transitive edge-sweep ceiling

**Satisfied.** The old ceiling is absent from the live-five enumeration at `ARCHITECTURE-SPINE.md:448`. In its place, `:446` records the shipped property: the edge-width guard now sweeps every non-root module from `projectedTree()` and excludes erased type declarations through `edgeUtilities`.

This ratifies the guard rather than overstates it:

- `tests/theme-chrome.test.mjs:1050-1062` performs the transitive non-root sweep.
- `:678-700` removes TypeScript type-only ranges before applying `EDGE_UTILITY`.
- The focused suite passes.

No other ceiling was deleted to make the account read clean.

### 2. Update the props rule for index signatures, rest destructuring, and `.ts` callers

**Satisfied.** `ARCHITECTURE-SPINE.md:446-447` now states the criterion at the right level:

- top-level index and mapped signatures are rejected;
- top-level destructured rest props are rejected;
- nested metadata index signatures, arrays, tuples, and object spreads remain legal;
- JSX callers are scanned in `.tsx`;
- direct `React.createElement` callers are scanned in both `.tsx` and `.ts`, including opaque props expressions.

The implementation matches each clause at `tests/theme-chrome.test.mjs:1185-1245`, `:1367-1436`, and `:1510-1549`. The text also preserves the stronger component contract — the projected components accept no `className` — instead of treating the call-site belt as the sole defence.

### 3. Replace the outline subtraction list with a positive classifier

**Satisfied.** `ARCHITECTURE-SPINE.md:449` no longer describes a growing exception/subtraction list. It records one positive `localColour` classifier shared by bare and bracketed outline spellings, including the deliberate `current` rule.

The cited code supports the account:

- CSS named-colour vocabulary: `tests/theme-chrome.test.mjs:770-788`.
- positive classifier: `:828-869`;
- application to outline values: `:895-902`;
- negative and positive controls, including the seven recorded bypasses: `:1064-1096`.

The statement “No subtraction list remains” is accurate.

### 4. Re-resolve citations while retaining all other live ceilings

**Satisfied.** Every citation introduced or moved in `ARCHITECTURE-SPINE.md:446-449` resolves to the stated code:

| Spine citation | Verified subject |
| --- | --- |
| `:1031` | `projectedTree` definition |
| `:1157-1162` | 27-module reach floor |
| `:990` | `moduleImports` |
| `:1468` | `exportedPropsShape` |
| `:1367-1436` | closed top-level props AST guard |
| `:1222-1245` | JSX plus `.tsx` / `.ts` direct-call belt |
| `:1050-1062` | transitive edge sweep |
| `:678-700` | type-erasure filtering |
| `:803`, `:828-869`, `:895-902`, `:1064-1096` | positive outline-colour classifier and controls |

The live ceilings are still present at `ARCHITECTURE-SPINE.md:448`, and the root-list / route-segment encoding remains assigned to Story 17.7 at `:449-461` rather than being misreported as Story 17.8 work.

---

## Good-spine checklist walk

### Real divergence points at the level below

Pass. AD-24 fixes the choices independently implemented units could otherwise make incompatibly: state tier, client-boundary placement, and closure of room-facing output from browser-local chrome. The amendment does not introduce test mechanics as a new architecture decision; it updates the evidence and remaining enforcement ceiling for the existing invariant.

### Enforceable Rule / stated Prevention

Pass. The new claims are properties a guard can enforce, and the spine is explicit where the guard cannot enforce them. In particular, it does not claim parity with AD-5's structurally enumerable matcher. The distinction between a route-group segment (a derivable structural root) and another leaf added to a hardcoded list makes the standing “encode the criterion” instruction executable rather than rhetorical.

### Deferred cannot silently license incompatible implementations

Pass for this update. The five retained ceilings are named as limits, not permissions. The two items that can affect Story 17.7 — upward route ownership and root derivation — converge on the same route-group owner. The shell mechanism/release constraints at `:450-461` remain binding. No Story 17.8 closure is left in Deferred as though still open.

### Named technology is verified-current

Pass. The Stack mirrors project pins and separately records upstream drift. Current npm metadata corroborates the dated account, including the exact Next/React patch gap and the four named major-version gaps. `next-themes` remains at upstream head. This amendment adds no new technology binding.

### Brownfield ratification

Pass. The closure narrative matches the current source and the focused suite. The spine does not turn the seven probes into a universal coverage claim; it keeps the surviving blind spots explicit. `[ADOPTED, partial]` remains accurate because the Story 17.7 server-first-paint / route-shell closure is still unshipped.

### Spec / capability coverage and inherited invariants

Pass. The amendment changes no capability mapping and weakens no existing AD. AD-24 remains consistent with AD-1's offline-primary boundary, AD-7's plan ownership, AD-10's presenter/projector channel, AD-12's hydrated colours, and AD-15's write validation.

### Altitude breadth, including the operational/environmental envelope

Pass. The initiative spine continues to cover deployment and durable storage (AD-4), authorization (AD-5), data mutation and evolution, rendering consistency, registry boundaries, client state, testing, and release/currency limits. CI/release, observability, backup/recovery, secrets, performance, fonts, and dependency currency are explicitly named in Deferred rather than omitted. This narrow update neither opens nor hides a dimension.

---

## Disposition

**Accept the amendment as written.** No autofix, discussion item, new Deferred entry, or ignored finding is required from this lens. The next architecture-affecting owner remains Story 17.7 for the route-group shell and root derivation; Story 17.2 may be created after this gate completes.

---

## Process note

This review changed only this report. It did not edit the architecture spine or production/test code.
