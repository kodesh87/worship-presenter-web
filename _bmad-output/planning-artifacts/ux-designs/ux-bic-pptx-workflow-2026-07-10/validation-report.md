# Validation Report — worship-presenter-web

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-bic-pptx-workflow-2026-07-10/EXPERIENCE.md`
- **Run at:** 2026-07-29
- **Context:** Reviewer Gate at Update/Finalize (not the standalone Validate intent). Per the gate's own rule, findings were **applied** rather than handed over, so each entry below carries a resolution.
- **Lenses run:** rubric walker (`review-rubric.md`). `finalize_reviewers` is empty for `bmad-ux`; the accessibility ad-hoc lens is reserved for consumer/regulated work and was judged unearned for an internal single-congregation tool whose accessibility gap is already an explicit Open Item.

## Overall verdict

The pair was structurally sound and unusually well grounded before the gate — every token, route, and behavioral rule traced to code read the same day rather than to assertion. The gate's value was in **coverage, not accuracy**: three of ten IA surfaces had no journey landing on them, per-surface state coverage was absent exactly where it mattered most, and one required-when-triggered section was missing. All five high findings and all six medium findings are resolved. The eight low findings are resolved or explicitly dispositioned.

The single most useful thing the gate produced was not a structural fix: computing the contrast ratios it demands surfaced that `muted-foreground` on `muted` is approximately **4.4:1 — below WCAG AA for normal text**, on shadcn's own default token, carrying secondary text throughout the app. That would not have been found by reading the code.

## Category verdicts

| Category | Before gate | After fixes |
| --- | --- | --- |
| Flow coverage | thin | strong |
| Token completeness | adequate | strong |
| Component coverage | thin | strong |
| State coverage | thin | strong |
| Visual reference coverage | n/a (clean) | n/a (clean) |
| Bloat & overspecification | adequate | adequate |
| Inheritance discipline | adequate | strong |
| Shape fit | adequate | strong |

## Findings by severity

### High (5) — all resolved

**Flow coverage** — Three IA surfaces had no journey (§ Key Flows)
`/services/new`, `/announcements`, `/admin` were never landed on; `/services/new` is an entire input path that Flow 1 bypassed.
*Resolved:* added Branch 1a (manual creation), Flow 4 (announcements), Flow 5 (account onboarding). All ten surfaces now have a journey.

> **CORRECTION (2026-07-29).** The Flow coverage verdict in this report — and the "strong" rating in the table above — rested partly on a claim that the PRD defines no named personas. It does: **Sari**, **Bimo**, and **Elen** (PRD §2.1, §2.3). The spines use invented names instead, which violates the contract's verbatim-name rule, and the gate should have flagged it. See `review-rubric.md` § 1 and finding F4-1 in `implementation-readiness-report-2026-07-29.md`. Two further gaps found in the readiness assessment that this gate also missed: PRD **UJ-3** (Telegram correction) has no flow at all, and **UJ-5** is represented only as a sub-branch of Flow 1 rather than as its own journey. Flow coverage should be read as **adequate, not strong**.

**Component coverage** — Three components specified in one spine only
`artifacts/ArtifactSlide` had no behavioral spec; service card list and `sonner` toasts had no visual spec.
*Resolved:* both tables now cover the same set; `slide-surface`, `dialog`/`popover`, and `LogoutButton` added on both sides.

**State coverage** — `/services/new` had no validation-error state
The product's main form surface with no documented invalid state.
*Resolved:* validation-error, in-flight-submit, and unresolved-hymn states added, deferring per-field rules to `form-fields.md`.

**State coverage** — `/admin/artifacts` had no save-rejected state
epic-16 AD-5 validates every registry write, making rejection a designed outcome with no described experience.
*Resolved:* save-rejected and reset-confirmation states added; Branch 3a walks the rejection.

**Inheritance discipline** — `{DESIGN.md}` is not valid token syntax
The contract reserves `{path.to.token}` for tokens; `{DESIGN.md}` resolves to nothing and would break a mechanical extractor.
*Resolved:* replaced with plain relative markdown links throughout.

### Medium (6) — all resolved

**Token completeness** — No contrast targets on load-bearing combinations.
*Resolved:* table added to DESIGN.md → *Colors*, with an explicit caveat that the values are Oklab-derived estimates rather than tool measurements. Surfaced the `muted-foreground` problem above.

**Flow coverage** — No failure path in Flow 2 or Flow 3.
*Resolved:* Branch 1b (stale write), 2a (lost projector), 3a (validation refusal).

**Component coverage** — `slide-surface` declared with no behavioral counterpart.
*Resolved:* clipping behavior stated and tied to epic-16 AD-5.

**State coverage** — No lost-sync state for presenter/projector.
*Resolved:* added, with the reasoning that INIT AD-10 forbids a server fallback so silence is the dangerous default.

**State coverage** — `/announcements` had no empty or upload-failure state.
*Resolved:* both added; rejection must name the INIT AD-8 rule it failed.

**Shape fit** — Responsive & Platform required-when-triggered and absent.
*Resolved:* section added. Tablet and phone are recorded as **out of scope** rather than undecided, which is the honest state and a firmer contract.

### Low (8) — resolved or dispositioned

- Glossary drift ("Run-sheet" / "run-sheet" / "Run sheet") — **resolved**, standardised on *run sheet* with a glossary line in the honesty note. *Correction: this entry originally claimed the fix was complete when only EXPERIENCE.md had been corrected; `DESIGN.md:107` still carried "run-sheet". The `bmad-editorial-review-prose` pass caught it. Both files are now consistent.*
- `oklch()` instead of hex — **dispositioned, no change.** `oklch()` is the literal source of truth in `globals.css`; hex would be lossy and immediately stale. Recorded so a future reviewer does not "correct" it.
- Cold-load states unstated — **resolved**, one line stating that Server-Component rendering makes skeletons unnecessary.
- Editorial voice in EXPERIENCE.md outside journeys — **resolved**, flattened to declarative constraints.
- `LogoutButton`, `dialog`, `popover` absent from both spines — **resolved**, added.
- `chart-*` / `sidebar-*` dead tokens — **dispositioned**, documented as dead rather than imported.
- `/services/[id]/slideshow` only mentioned inside another flow — **resolved**, now has an empty-plan state and appears in Branch 2a.
- `design_reference` is not a contract-defined frontmatter field — **dispositioned**, harmless and useful.

## New Open Items created by the gate

1. `muted-foreground` contrast is borderline and unverified (~4.4:1 on `muted`). Needs a real contrast checker; a single token darkening would fix it globally.
2. Several per-surface states are now **specified** but unverified against shipped code — lost sync, save rejected, last-admin refusal, empty plan. Whether the code implements each belongs to the implementation-readiness assessment, not to this file. Recorded as EXPERIENCE.md Open Item 6 rather than asserted as working.

## Reviewer files

- `review-rubric.md`

## Deviation from the standard, stated

`references/validate.md` also prescribes an HTML twin rendered from `validation-report-template.html` and opened in a browser. That pipeline is written for the **Validate intent**, where findings are *delivered* for the user to act on. At the Update gate the findings were applied, so an HTML report to open and review has no decision left in it — and opening a browser window is an outward-facing side effect not worth taking unprompted. The markdown twin is written; the HTML render is available on request.
