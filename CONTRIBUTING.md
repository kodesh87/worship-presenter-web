# Contributing

Contributions are welcome, particularly from other congregations adapting this
to a different order of service.

## Before your first commit

Read [docs/PRIVATE-DATA.md](docs/PRIVATE-DATA.md). This repository is public and
a congregation's own data must not enter it. There is a test that enforces this;
if it fails, the finding is the point.

## Getting set up

```bash
npm install
npm run setup
npm run dev
```

## Before opening a pull request

```bash
npm test          # includes the public-repo guard
npx tsc --noEmit
npm run lint
npm run build
```

Tests use Node's built-in runner (`node:test`) — there is no Jest or Vitest.
A new test file must be added to the explicit list in the `test` script, or it
will not run.

## Conventions

- TypeScript strict; prefer `unknown` and narrow at boundaries over `any`
- Domain logic in `src/lib/*`, route handlers thin
- kebab-case filenames, PascalCase components, camelCase functions
- Existing shadcn / Base UI components rather than new UI dependencies

## Changing slide templates

Slide layouts are data, not code. Edit them at `/admin/artifacts` rather than by
hand where possible. A change to the shipped example registry affects every
installation that has not customised that template, so keep example content
generic and synthetic.
