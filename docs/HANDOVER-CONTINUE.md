# Handover — continue after reboot

Paste the prompt below into a new agent chat in this repo. Do not paste secrets,
real member data, payment details, or production hostnames into chat or commits.

---

## Prompt (copy from here)

```
You are continuing work on worship-presenter-web.

## Source of truth
- Working directory: D:\Developer\personal-project\worship-presenter-web
- Frozen legacy repo (do not develop there): D:\Developer\bic\bic-pptx-workflow
- Cursor / agents should treat WPW as the only active project root.

## Already done
1. App + public docs exported to WPW; package name is `worship-presenter-web`.
2. Agent tooling synced: `.claude/`, `.agents/`, `.cursor/`, `.Codex/`, `.agent/`, `_bmad/`, `_bmad-output/`, `.github/`, inter-agent chain under `.work/inter-agent/` (force-tracked), plus root `AGENTS.md` / `.cursorrules` / `CLAUDE.md` (public-repo preamble kept).
3. Operator bootstrap (gitignored, local only):
   - `data/local/default-registry.json` — private registry override preferred by seeder
   - `data.db` — copied for continuity
   - `data/uploads/` — local uploads for continuity
   - `.env` may still be missing → run `npm run setup` if needed
4. Planning/docs that failed `tests/public-repo-guard.test.mjs` were redacted (synthetic host `presenter.example.church`, fake account placeholders, invented example names). Guard must stay green.
5. Congregation branding like "BANDUNG INTERNATIONAL COMMUNITY" in shipped example data is intentional and allowed.

## Do not commit
Anything under `data/local/`, `data/uploads/`, `data.db*`, `.env*`, `*.pptx`, `slides*/`, or real people / payment / production host details. See `docs/PRIVATE-DATA.md` and `AGENTS.md`.

## Next steps (in order)
1. Run locally and verify operator path:
   - `npm install` (if needed)
   - `npm run setup` (if no `.env`)
   - `npm run dev`
   - Confirm seeder logs that it seeds from `data/local/default-registry.json`
   - Sign in with the admin password printed by setup / stored in `.env`
2. Re-run `npm test` (must include public-repo-guard green) and `npm run build`.
3. Only after a successful local run + green tests:
   - Commit is already done for sync/redact/handover if present; push if not yet pushed
   - BEFORE setting the GitHub repo public: rewrite history so the first commit no longer contains pre-redaction secrets (orphan single clean commit or equivalent). A later redaction commit is not enough — public repos publish full history.
   - Then: `gh repo edit --visibility public` (or GitHub UI)
4. Continue product work only in WPW under BMad / inter-agent rules.

## Out of scope for this handover
- Do not reopen feature work in bic-pptx-workflow.
- Do not weaken `tests/public-repo-guard.test.mjs`.
- Do not copy `.env` from the legacy repo into git.
```

---

## Operator notes (human)

| Item | Value |
|------|--------|
| Repo | `https://github.com/kodesh87/worship-presenter-web` |
| Visibility intent | Public, after successful run + history rewrite |
| Local private data | gitignored under `data/local/`, `data/uploads/`, `data.db`, `.env` |
| Enforcement | `npm test` → `tests/public-repo-guard.test.mjs` |

If the guard fails after reboot, fix content — never delete or soften the test.
