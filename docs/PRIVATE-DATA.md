# Private data — read this before your first commit

This repository is public. A congregation's own data does not belong in it.

That is not a hypothetical. This project began as a private repository, and by
the time anyone audited it, it contained real member names, photographs of
identifiable people including children, screenshots of a private conversation,
and a scannable payment code. None of it was put there maliciously — each piece
arrived as a reasonable working file, and nobody remembered it later. The public
repository starts from a clean tree precisely because that history could not be
cleaned up after the fact.

## The rule

**Anything that identifies a real person, or that moves real money, stays out of
git.** Names, photographs, prayer requests, phone numbers, addresses, bank
account numbers, payment QR codes, uploaded flyers, exported decks.

The example content in this repository uses a synthetic congregation. Keep it
that way.

## Where your own data goes instead

### Slide registry

Put your congregation's registry at:

```
data/local/default-registry.json
```

The seeder prefers it over the shipped `data/default-registry.json` whenever it
exists, and logs which one it used at startup. `data/local/` is git-ignored in
full. Your install behaves exactly as it would with a committed registry — it is
simply not committed.

Same shape, same validation. The simplest way to produce one is to edit the
templates in `/admin/artifacts` and export the result, or to copy
`data/default-registry.json` and change the standing slides.

### Uploaded images

Flyers and member photographs land in `data/uploads/` at runtime. That directory
is git-ignored. Do not move anything out of it into `public/`.

### Source presentation decks

`*.pptx` files are extraction inputs for `scripts/extract-pptx-assets.mjs`. Keep
them outside the repository or at its root, where the ignore rules catch them.
They are often large and usually contain photographs.

### Secrets

`.env` only, never committed. `npm run setup` generates it. `.env.example`
carries placeholders and nothing else.

## What enforces this

Three layers, and only the last one is reliable.

1. **`AGENTS.md`** states the rule for anyone — human or AI assistant — working
   in the repository. Instructions are the weakest layer; people and models both
   forget.
2. **`.gitignore`** refuses whole categories: `data/local/`, `data/uploads/`,
   `slides*/`, `*.pptx`, local databases.
3. **`tests/public-repo-guard.test.mjs`** fails the build if a congregation
   directory is tracked, an image is committed outside `public/`, a source deck
   is committed, or a known private literal or real name reaches a tracked file.

Run it any time with `npm test`. If it fails, do not work around it — the
finding is the point.

## If something private has already been committed

Do not simply delete it in a new commit. It stays reachable in history, and a
public repository publishes history.

1. Stop. Do not push, and do not make the repository public.
2. If it was never pushed, rewrite the history that contains it.
3. If it was pushed, assume it is already copied and indexed. Rotate anything
   rotatable — payment codes, secrets — and take advice before deciding whether
   a history rewrite is worth it. For personal data, the honest answer is often
   a fresh repository, which is exactly how this one came to exist.
