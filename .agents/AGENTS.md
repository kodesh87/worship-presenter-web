# Public repository — congregation data never enters it

**This repository is public.** Before any commit, know what may not be in it.

This project began as a private repository. By the time it was audited it held
real member names, photographs of identifiable people including children,
screenshots of a private conversation, and a scannable payment code. Nothing was
added maliciously; each file arrived as a reasonable working artifact and nobody
remembered it later. That history could not be cleaned, which is why this
repository starts fresh.

## Never commit

- Real people's names, photographs, prayer requests, phone numbers, addresses
- Bank account numbers, payment QR codes, any live payment detail
- Uploaded flyers or member images (`data/uploads/`)
- Exported or rendered slide images (`slides/`, `slides-all/`, `slides-new/`)
- Source presentation decks (`*.pptx`, `*.potx`)
- Local databases, `.env`, anything under `data/local/`

Example content uses a **synthetic congregation**. Keep it synthetic. If you need
a realistic name, invent one — do not reach for a real member's.

## Where real data goes

`data/local/default-registry.json` — git-ignored, preferred by the seeder over
the shipped example whenever present. See `docs/PRIVATE-DATA.md`.

## Enforcement

`tests/public-repo-guard.test.mjs` fails the build when a congregation directory
is tracked, an image is committed outside `public/`, a deck is committed, or a
known private literal or real name reaches a tracked file. If it fails, the
finding is the point — do not weaken the test to make it pass.

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:bmad-process-gate -->
# BMad process gate (mandatory)

**Coding must stay on-course with BMad artifacts.** Do not invent or ship a large feature/boundary that drifts from planning and implementation tracking.

## Model / tool bias (read this)

Google AI Pro / Antigravity (and similar “jump-to-code” agents) tend to skip planning and implement large surfaces after a Spec or PRD tweak. That path caused Epic 14 drift (Correct Course + deep code review debt). **Assume you have that bias. Compensate by stopping for process, not by coding harder.**

## Hard rules before non-trivial code

1. **Do not** implement a new capability, API surface, or multi-file UI/boundary unless one of these exists and you are following it:
   - A story under `_bmad-output/implementation-artifacts/stories/` with clear AC, **or**
   - A SPEC under `_bmad-output/specs/` that you are implementing via the story/dev skills, **or**
   - An explicit user-invoked Correct Course / Spec / Create Story / Dev Story / Quick Dev skill run.
2. **Required sequence for new product work:** Epic → Story → Spec (when needed) → implement (`bmad-dev-story` / approved Quick Dev) → `bmad-code-review`. Do not jump from PRD/Spec edit straight to thousands of lines of app code.
3. **If code already diverged from artifacts:** stop feature coding; run `bmad-correct-course` (or ask the user to) and reconcile docs/sprint status before more implementation.
4. **While coding an approved story/spec:** keep `parsed` contracts, form fields, APIs, and slide behavior aligned with the SPEC/companions and story AC. If you must change behavior, update the artifact in the same change set — never leave docs lying.

## Authority map

| Concern | Source of truth |
|--------|------------------|
| What to build (contract) | `_bmad-output/specs/**/SPEC.md` + companions |
| Delivery unit / AC | `_bmad-output/implementation-artifacts/stories/*.md` |
| Sprint tracking | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Product requirements | `_bmad-output/planning-artifacts/prds/**` |
| Epics | `_bmad-output/planning-artifacts/epics.md` |
| Runtime rules for this repo | `_bmad-output/project-context.md` |
| Package versions | `package.json` (over architecture prose) |

## Allowed without a new story

- Bugfix tightly scoped to existing behavior already described by artifacts
- Test-only additions for existing code
- Docs/typo sync that does not invent new product behavior
- User-explicit one-line / mechanical edits

When unsure whether work is “large”: treat it as large and use the BMad path.

## Sync rule for this file

`CLAUDE.md` must remain `@AGENTS.md`. Keep `.agents/AGENTS.md` and `.cursorrules` **identical** to this file’s BMad gate + Next.js blocks + Inter-Agent Workflow section so Antigravity / Cursor / Codex ChatGPT load the same rules.
<!-- END:bmad-process-gate -->
---

## Inter-Agent Workflow

The complete inter-agent workflow is defined by `.work/inter-agent-cooperation.md` and is mandatory for cross-host work.

- Codex ChatGPT owns documentation, specification/design corpus, and finalization; it does not code or review.
- Cursor owns production code, tests, and implementation configuration; it does not edit product documentation or perform review.
- Antigravity owns `/bmad-code-review`, triage, verdict, and review handovers; it does not patch production code or rewrite product documentation.
- All hosts may write only the operational chain artifacts under `.work/inter-agent/**` as allowed by the active skill.
- Every work item starts with `spek-to-coding`; every transition must satisfy the SSOT chain-integrity gate, handover envelope, eligibility rules, and skill-specific exit gate.
- Transition skills:
  - Codex ChatGPT: `.Codex/skills/spek-to-coding/SKILL.md`, `.Codex/skills/close-spek/SKILL.md`
  - Cursor: `.cursor/skills/coding-to-spek/SKILL.md`, `.cursor/skills/coding-to-review/SKILL.md`
  - Antigravity: `.agent/skills/review-to-coding/SKILL.md`, `.agent/skills/review-to-spek/SKILL.md`
- `close-spek` is the terminal transition and has no receiver.
