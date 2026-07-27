# Story 7.3: Part C standing slides + optional graphics (FR-4/6)

Status: done

## Story

As a presenter,
I want Part C standing slides (offering/bank, midweek, etiquette, contact) plus optional sermon/family images,
So that the deck matches the BIC blueprint without missing fixed slides.

## Acceptance Criteria

1. **Given** any Service, **When** the slide plan builds, **Then** standing Part C slides are present.
2. **Given** flyer images, **When** planned, **Then** they appear after family content.
3. **Given** `sermonGraphicUrl` / `familyPhotoUrl` in images payload, **When** present, **Then** those slides are included; otherwise skipped.
