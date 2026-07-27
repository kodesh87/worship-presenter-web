# Story 6.4: Section-aware Hymn Mapping

Status: done

## Story

As the system,
I want hymns assigned to Bible Talk vs Divine Service by section markers,
So that atypical song counts do not mis-slot Song Blocks.

## Acceptance Criteria

1. **Given** a rundown with BIBLE TALK and DIVINE SERVICE sections, **When** parsed/generated, **Then** hymns under each section land in the matching Part.
2. **Given** more or fewer than two Bible Talk hymns, **When** generated, **Then** Part A/B song order still follows section membership (not a hard `slice(0,2)`).

## References

- Deferred finding in `deferred-work.md`
- Current: positional slice in `src/lib/pptx.ts`
