# Story 6.5: picoclaw Intake + Hymn Title Readback

Status: done

## Story

As Events Department,
I want picoclaw to call the webhook and receive resolved hymn titles / failed numbers,
So that the FR-1 Telegram round-trip is complete.

## Acceptance Criteria

1. **Given** a Telegram rundown, **When** picoclaw posts to `/api/webhook` with `WEBHOOK_SECRET`, **Then** a Service is created/updated by date.
2. **Given** resolved hymns, **When** the API responds, **Then** titles (and `failedHymnNumbers`) are available for chat readback.

## References

- PRD FR-1; architecture AD-3
- Webhook returns `resolvedHymns` / `failedHymnNumbers` for chat readback
- picoclaw skill package: `.claude/skills/picoclaw-webhook/SKILL.md` (present; earlier “skill missing” note was stale)
