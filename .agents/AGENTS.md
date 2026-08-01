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
- Text extracted from a source deck for a **payload-bearing** slide — family/youth,
  sermon speaker, special song, verse reading, song lyrics. Those text runs are that
  week's data, not template copy. `data/asset-map.json` once committed a family's
  surname, three given names and their prayer request this way, and the sermon
  speaker's full name twice more

Example content uses a **synthetic congregation**. Keep it synthetic. If you need
a realistic name, invent one — do not reach for a real member's.

**Prefer not producing the value to blocking it afterwards.** A fingerprint list
only knows names someone already registered — never the next family. Where a
generator reads real material, filter at the generator: `evidenceFor` in
`scripts/extract-pptx-assets.mjs`, asserted by `tests/asset-map-evidence.test.mjs`.

## Where real data goes

`data/local/default-registry.json` — git-ignored, preferred by the seeder over
the shipped example whenever present. See `docs/PRIVATE-DATA.md`.

## Enforcement

`tests/public-repo-guard.test.mjs` fails the build when a congregation directory
is tracked, an image is committed outside `public/`, a deck is committed, or a
known private literal or real name reaches a tracked file. If it fails, the
finding is the point — do not weaken the test to make it pass.

`tests/asset-map-evidence.test.mjs` covers what that guard structurally cannot:
deck text recorded for a payload-bearing slide, whether or not anyone has ever
registered the name inside it. It fails on the shape of the leak, not the identity.

The same rule is restated in `.constitution/public-repository.md` so agent hosts
and humans share one hard gate.

## Commit / push audit (mandatory)

This repository is public. Before **every** `git commit` and **every** `git push`:

1. Refuse to stage `.env*`, `data/local/`, `data/uploads/`, `data.db*`, `slides*/`,
   `*.pptx` / `*.potx`, or any real congregation / payment / production-host data.
2. Run the guard (or full `npm test`):
   `node --import ./tests/register-ts-resolve.mjs --test --experimental-strip-types tests/public-repo-guard.test.mjs`
3. Fix content on failure — never weaken the guard. Do not push until it is green.

Cursor agents also load `.cursor/rules/public-repo-commit-audit.mdc`.

## Active vs frozen repository

- **Active:** this repository (`worship-presenter-web`) — all product work lives
  here.
- **Frozen:** the legacy private repository `bic-pptx-workflow` is retired. Do
  not implement features or continue development there.

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
4. **While coding an approved story/spec:** keep `parsed` contracts, form fields, APIs, and slide behavior aligned with the SPEC/companions and story AC. If you must change behavior, update the artifact in the same change set — never leave docs lying. This explicitly includes the architecture and UX spines:
   - Add, rename, or remove a **route or surface** → update the IA table in `EXPERIENCE.md` in the same change set.
   - Override a **design token** or add a UI component with a visual delta → update `DESIGN.md`.
   - Change a **structural invariant** (auth gate, storage target, slide-order source, sync channel, schema path) → amend the architecture spine via `bmad-architecture` Update. Never renumber an existing `AD-n`; add the next one. (One recorded exception, not a precedent: the 2026-07-30 fold-in of the Epic 16 child spine, waived by the owner, with an AD map published in the spine and every live citation repaired in the same change set.)

   These four artifact families drifted precisely because nothing named them here.

## Authority map

| Concern | Source of truth |
|--------|------------------|
| What to build (contract) | `_bmad-output/specs/**/SPEC.md` + companions |
| Delivery unit / AC | `_bmad-output/implementation-artifacts/stories/*.md` |
| Sprint tracking | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Product requirements | `_bmad-output/planning-artifacts/prds/**` |
| Epics | `_bmad-output/planning-artifacts/epics.md` |
| Structural invariants | `_bmad-output/planning-artifacts/architecture/architecture-bic-pptx-workflow-2026-07-10/ARCHITECTURE-SPINE.md` — **one spine per project** (the BMad default). Decisions are `AD-n` in that one file and the `INIT AD-n` citation form is retired. The Epic 16 child spine was folded in on 2026-07-30; its folder keeps only the run record |
| Visual identity (tokens, components) | `_bmad-output/planning-artifacts/ux-designs/**/DESIGN.md` |
| Experience, IA, surfaces, flows | `_bmad-output/planning-artifacts/ux-designs/**/EXPERIENCE.md` |
| Runtime rules for this repo | `_bmad-output/project-context.md` |
| Package versions | `package.json` (over architecture prose) |

## Allowed without a new story

- Bugfix tightly scoped to existing behavior already described by artifacts
- Test-only additions for existing code
- Docs/typo sync that does not invent new product behavior
- User-explicit one-line / mechanical edits

When unsure whether work is “large”: treat it as large and use the BMad path.

## Sync rule for this file

`CLAUDE.md` must remain `@AGENTS.md`. Keep `.agents/AGENTS.md` and `.cursorrules` **identical** to this file’s BMad gate + Next.js blocks so Antigravity / Cursor / Codex ChatGPT load the same rules.
<!-- END:bmad-process-gate -->
