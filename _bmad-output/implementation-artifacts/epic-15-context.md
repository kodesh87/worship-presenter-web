# Epic 15 Context: Parser & Rendering Refinements (Phase 2)

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Improve generated PPTX Song Blocks and Part B prayer-flow pacing from operator feedback: lyrics read as continuous text, chorus/refrain appears after every verse, and unnecessary song-title slides are omitted during intercessory/prayer segments so Sabbath advance feels seamless without sacrificing pew readability.

## Stories

- Story 15.1: Lyric Formatting and Service Flow Skips

## Requirements & Constraints

- Each Hymn still renders as a Song Block (song-title + lyric slides). When a refrain/chorus exists it must follow every verse; songs without a refrain render verses only.
- Epic refinement vs baseline: lyric body should be continuous prose per verse (not line-broken verse layout), while still splitting to extra slides when a verse or refrain is too long to read comfortably — never over-full or cramped lyric slides.
- During intercessory/prayer flow (and related standing response / closing-response songs), omit unnecessary transitional song-title slides; lyric content for those songs still appears as usual.
- Intercessory response songs are fixed Template Skeleton standing pairs, not weekly payload Song Blocks.
- Lyrics resolve only from the Hymnal Database (structured verse/refrain by SDAH number) — never free-text or web search.
- Generation correctness and readability remain load-bearing: wrong/garbled lyrics or unreadable slides are worse than a slower correct deck.
- Offline PPTX remains the primary Sabbath presentation path; in-browser slideshow/preview must reflect the same assembled slide sequence.

## Technical Decisions

- Deck assembly = fixed Template Skeleton + Weekly Data Payload (Part A Bible Talk, Part B Divine Service including intercessory prayer block, Part C announcements/closing).
- Presentation stack generates PPTX via pptxgenjs; lyric expansion and slide-plan ordering live in the shared lib layer that feeds both PPTX and web slideshow.
- Hymnal-backed Song Blocks remain the source of verse/refrain structure; this epic changes formatting, chorus injection order, and which song-title slides the slide plan emits — not ingestion APIs or worship form UX.

## Cross-Story Dependencies

- Depends on shipped Song Block / readable lyric rendering (prior FR-5 work); this epic refines that behavior rather than reintroducing hymn resolution.
- Single story in-epic (15.1); no multi-story sequencing inside Epic 15.
- Orthogonal to Epic 14 worship web-input work: do not change ParsedRundown shape or create/edit form UX as part of this epic.
