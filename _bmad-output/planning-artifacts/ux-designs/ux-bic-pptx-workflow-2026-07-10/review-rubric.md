# Spine Pair Review — worship-presenter-web

**Run:** 2026-07-29 · Reviewer Gate at Update/Finalize · sequential (subagents unauthorized)
**Lenses:** rubric walker only. `finalize_reviewers` is empty for `bmad-ux`, so there is no configured floor beyond this. An accessibility lens is the named ad-hoc add for *consumer / regulated* work; this is an internal tool for one congregation, and the accessibility gap is already an explicit Open Item, so it was judged not to earn a separate lens.

## Overall verdict

The pair is structurally sound and unusually well grounded — every token, route, and behavioral rule traces to code read on 2026-07-29 rather than to assertion. The weakness is **coverage, not accuracy**: three of ten IA surfaces have no journey landing on them, per-surface state coverage is thin where it matters most (form validation, save rejection, lost sync), and a required-when-triggered section is missing outright. Two mechanical defects would break a downstream extractor.

## 1. Flow coverage — thin

Checked: `sources` frontmatter resolves (4/4). Three Key Flows present, each with numbered steps and an explicit climax beat.

> **CORRECTION (2026-07-29, during the readiness assessment's Step 4).** This section originally read: *"PRD defines no named personas — only role descriptions — so the invented protagonists introduce no conflict with source naming"*, and passed the check. **That was wrong.** PRD §2.1 and §2.3 name three protagonists — **Sari** (events department, UJ-1), **Bimo** (current builder, UJ-2 and UJ-5), and **Elen** (new to the rotation, UJ-4). The error came from a grep whose pattern could not match names embedded in journey prose. Under the contract's "mirror source-spec names verbatim when defined" rule, this check **fails**: the spines use invented names (Yohana, Yosef) instead. Recorded as finding F4-1 in `implementation-readiness-report-2026-07-29.md`. A separate open question — whether those PRD names belong to real people, which would make them PII in a public repository — is finding F4-2 and awaits the user.

### Findings
- **high** Three IA surfaces have no journey that lands on them: `/services/new`, `/announcements`, `/admin` (§ Key Flows). The skill's own closure test is "every surface has a journey that lands there". `/services/new` is the worst of the three — it is the *manual alternative* to agent intake, an entire input path, and Flow 1 bypasses it by starting from an already-arrived Telegram rundown. *Fix:* extend Flow 1 to branch through manual creation, and add a short announcements flow.
- **medium** No failure path in Flow 2 or Flow 3 (§ Key Flows). Flow 1 has a partial one (failed hymn number). The two failure modes an operator will actually hit — a stale-write 409, and session revocation mid-edit — appear in *State Patterns* but no journey walks them. *Fix:* add a failure branch to Flow 1 and Flow 3.
- **low** `/services/[id]/slideshow` is mentioned inside Flow 1 step 6 but never as a destination in its own right.

## 2. Token completeness — adequate

Extracted every frontmatter token and every `{...}` reference in prose. All `{colors.*}` and `{rounded.*}` references in DESIGN.md resolve to defined tokens.

### Findings
- **medium** No contrast targets stated for load-bearing combinations (§ DESIGN.md Colors). The rubric asks for them explicitly. `foreground` on `background` and `primary-foreground` on `primary` are the two that matter. *Fix:* state computed ratios; both are near-maximal, so this is cheap and strengthens the accessibility claim.
- **low** Colors are given as `oklch()` rather than hex. Judged **acceptable, not a miss**: `oklch()` is the literal source of truth in `globals.css`, and converting to hex would be lossy and immediately stale. Noted so a future reviewer does not "fix" it.
- **low** `chart-1..5` and `sidebar-*` exist in `globals.css` but are deliberately excluded from the spine as dead tokens. Documented in prose; correct call.

## 3. Component coverage — thin

Extracted every component name used anywhere in either spine and cross-checked both required homes.

### Findings
- **high** Three components appear in one spine only (§ DESIGN.md Components / EXPERIENCE.md Component Patterns):
  - `artifacts/ArtifactSlide` — visual spec present, **behavioral spec missing**
  - Service card list — behavioral spec present, **visual spec missing**
  - `sonner` toasts — behavioral spec present, **visual spec missing**
  *Fix:* add the missing row in each case.
- **medium** `slide-surface` is declared in DESIGN.md frontmatter `components` with no counterpart anywhere in EXPERIENCE.md.
- **low** `LogoutButton` exists in `src/components` and in neither spine. `dialog` and `popover` are installed and named in DESIGN.md prose but have no behavioral rules.

## 4. State coverage — thin

Walked all ten IA surfaces against the state checklist (empty, cold-load, focus, error, offline, permission-denied).

### Findings
- **high** `/services/new` has **no validation-error state** (§ State Patterns). It is the product's main form surface; a form without a documented invalid state is the single largest gap in the pair. *Fix:* add validation-error and in-flight-submit states, referencing `form-fields.md` for per-field rules.
- **high** `/admin/artifacts` has no **save-rejected** state. Epic-16 AD-5 requires every registry write to pass strict validation, so rejection is a designed-for outcome with no described experience. *Fix:* state what the operator sees when validation refuses a canvas payload.
- **medium** No **lost-sync** state for presenter/projector. `BroadcastChannel` is same-origin and local, but a closed or crashed projector window is ordinary, and INIT AD-10 forbids a server fallback — so the operator must be able to tell. *Fix:* add it to State Patterns and Flow 2's failure branch.
- **medium** `/announcements` has no empty state and no upload-failure state, though rejected image references are a designed outcome under INIT AD-8.
- **low** Cold-load / skeleton states are unstated across all surfaces. Defensible for a Server-Component-first app; worth one sentence saying so rather than silence.

## 5. Visual reference coverage — n/a (clean)

`mockups/`, `wireframes/`, `imports/`, `.working/` do not exist in this workspace. No orphans and no unspecific references. Spines-win-on-conflict is stated once (EXPERIENCE.md honesty note). Correct for an as-built ratification where the running application is itself the visual reference.

## 6. Bloat & overspecification — adequate

No pixel specs where tokens cover it. No persona or FR restatement beyond traceability citations. Tables used where tables work.

### Findings
- **low** EXPERIENCE.md carries editorial voice in a few places, which the rubric reserves for DESIGN.md: "Sabbath is unrecoverable", "Anything that requires attention on a third surface is a design failure". Journey narration is exempt; these are outside a journey. *Fix:* flatten to declarative constraints.

## 7. Inheritance discipline — adequate

All four `sources` paths resolve. No source-defined UJ names to mirror. Architecture citations (`INIT AD-1/5/6/7/8/10`, `epic-16 AD-3/5`) match the spines as amended today.

### Findings
- **high** `{DESIGN.md}` is used in EXPERIENCE.md as a cross-reference, but the contract's syntax is `{path.to.token}` for *tokens*. `{DESIGN.md}` resolves to no token and would break a mechanical extractor. *Fix:* use a plain relative link for file references and reserve brace syntax for real token paths.
- **low** Glossary drift within the pair: "Run-sheet detail", "run-sheet", and "Run sheet" all appear. *Fix:* pick one — the UI label is the tiebreaker.

## 8. Shape fit — adequate

DESIGN.md sections are in canonical order (Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts), with `Open Items` appended after the locked run — an invented section that earns its place. EXPERIENCE.md carries all eight required defaults.

### Findings
- **medium** **Responsive & Platform is required-when-triggered and absent.** The trigger is "multi-surface or breakpoints", and this product is explicitly multi-surface: an operator laptop plus a projected second display. The pair currently addresses it only as Open Item 6 ("responsive behavior is undefined"). *Fix:* add a Responsive & Platform section stating desktop-plus-projector as the committed platform set, with the mobile question named as out of scope rather than undecided.
- **low** `Inspiration & Anti-patterns` correctly omitted — the memlog records no reference products or rejects.

## Mechanical notes

- Frontmatter: both files complete and parseable. `2xl: 18px` is a valid unquoted YAML string key.
- Cross-references: all four `sources` paths verified against the filesystem. `design_reference: ./DESIGN.md` resolves but is not a contract-defined field — harmless.
- Mermaid: none in either spine (correct; neither carries a diagram).
- Name inconsistencies: the run-sheet variants above; otherwise component names match their code paths exactly.
- **Severity counts:** high 5 · medium 6 · low 8.
