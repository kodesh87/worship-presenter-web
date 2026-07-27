# Attributions and third-party content

The MIT licence in [LICENSE](LICENSE) covers the code in this repository. It does
not cover the content below, which belongs to others.

## Seventh-day Adventist Hymnal

`data/hymns.json` contains the hymn texts of *The Seventh-day Adventist Hymnal*
(1985), indexed by its hymn numbering.

**Copyright holder:** the General Conference of Seventh-day Adventists, and
Review and Herald Publishing Association. Individual hymn texts and tunes carry
their own authors, translators and copyright holders; many are in the public
domain, others are not.

**Why it is here.** This tool projects hymn lyrics during worship for
Seventh-day Adventist congregations. The corpus is included so that a
congregation can install the tool and use it, without each one having to
assemble the same texts by hand.

**How it is used.** Non-commercially, for worship and study within
congregations. Nothing in this project is sold, licensed for a fee, or
monetised in any form. The corpus is not offered as a hymnal, a substitute for
purchasing one, or a general-purpose lyrics database.

**No claim of ownership.** Including this corpus is not a claim of any right in
it. It remains the property of its copyright holders, and this notice is not a
licence — neither ours to give nor granted to us.

### Removal requests

If you hold rights in this material and want it removed or changed, please open
an issue at <https://github.com/kodesh87/worship-presenter-web/issues> or
contact the maintainer through the profile at <https://github.com/kodesh87>.
Requests will be honoured promptly and without argument.

Anyone adapting this project for another tradition should replace
`data/hymns.json` with their own corpus.

## King James Version

Scripture lookup uses the King James Version, which is in the public domain in
most jurisdictions. In the United Kingdom it remains under perpetual Crown
copyright, administered by the Crown's patentee. The KJV corpus is **not**
committed to this repository; it is imported at runtime from a corpus the
operator supplies (`npm run import:kjv`).

## Slide background images

The images under `public/assets/` were produced by the project's own team and
are covered by the repository's MIT licence.

## Dependencies

Every npm dependency carries its own licence. `npm ls --all` lists them, and
each package's licence text ships inside `node_modules`.
