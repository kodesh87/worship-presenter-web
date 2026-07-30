# System Architecture

This document describes the technical architecture, design patterns, data flow, and testing strategy of the `bic-pptx-workflow` project.

---

## 1. Executive Summary

`bic-pptx-workflow` is a presentation automation and synchronization hub. Its primary purpose is to receive unstructured liturgy text inputs (rundown sheets) from external chat bots, parse them into structured JSON, resolve song lyrics from a hymnal database, and generate downloadable PowerPoint presentations.

Additionally, it provides a web-based presenter control panel that synchronizes slides in real time with a projector display tab on the client machine using native browser technologies.

---

## 2. Technology Stack

- **Core Framework:** Next.js 16.2.10 (App Router layout/page structure)
- **UI & Layout:** React 19.2.4 with Tailwind CSS v4 and Shadcn UI components
- **Database Engine:** SQLite (better-sqlite3) running in WAL (Write-Ahead Logging) mode
- **Slide Generator:** PptxGenJS 4.0.1
- **File Manipulation:** JSZip 3.10.1
- **Authentication:** Custom cryptographically signed cookie session tracking (`auth_session`)
- **Testing:** Node.js native test runner (`node --test`)

---

## 3. Architecture Patterns

The application is structured as a **Monolithic Layered Architecture** containing:
1. **Routing and Interface Layer (Next.js App Router Pages):** Layouts, Pages, and API endpoints. Handles sessions and outputs HTML/JSON responses.
2. **Business Logic Layer (Parser & PPTX Compiler):** Parses raw rundown text strings, builds presentation slide plans, and invokes the slide generator.
3. **Data Access Layer (SQLite database):** Connects to `data.db`, exposes raw SQL execution prepared statements, and manages schema updates during boot.
4. **Real-time Synch Layer (BroadcastChannel):** Synchronizes operator actions to the public church projector viewport locally on the client's browser.

---

## 4. Operational & Data Flows

### A. Webhook Intake and Parsing Flow
1. A Telegram chat bot sends a POST request with the rundown text sheet to `/api/webhook` along with the `x-webhook-secret` header.
2. The Webhook API calls `parseRundown(...)` (`src/lib/parser.ts`) which extracts the service date, roles, scripture references, and SDAH hymn numbers.
3. Hymn numbers are checked against the SQLite database `hymns` table to resolve lyrics.
4. The service entry is saved or updated in the `services` table in SQLite.

```
┌──────────────┐      ┌─────────────┐      ┌───────────────┐      ┌───────────┐
│ Telegram Bot │ ───> │ Webhook API │ ───> │ Rundown Parser│ ───> │ SQLite DB │
└──────────────┘      └─────────────┘      └───────────────┘      └───────────┘
```

### B. PowerPoint Generation Flow
1. The user requests `/api/services/[id]/pptx`.
2. The endpoint reads the parsed rundown JSON from the database.
3. `buildSlidePlan(...)` (`src/lib/slide-plan.ts`) plans the slides, inserting announcement flyers, resolved hymn slides, and standing slides (Intercessory Prayer, Sermon slide, closing elements).
4. `generatePptx(...)` (`src/lib/pptx.ts`) creates the OpenXML PowerPoint archive and returns a binary download stream.

### C. Live Projection Sync Flow
1. The AV operator loads `/services/[id]/present` (PresenterOperator).
2. The projection screen loads `/services/[id]/present/projector` (ProjectorClient) on a second monitor.
3. Slide changes triggered by the operator broadcast `{ type: 'sync', index }` messages through the browser-native `BroadcastChannel`.
4. The projector client receives the message and updates its view using the **configured** transition style — whatever `settings.slide_transition` currently holds, resolved through the single table in `src/lib/transitions.ts` (AD-23). It is not fixed to a crossfade; `fade` is only the default an operator gets when nothing has been configured, and the presenter may override the style for the live session.

---

## 5. Security & SSRF Hardening

Since PPTX generation can download remote announcement images or custom assets, the application implements SSRF (Server-Side Request Forgery) protection:
- It checks hostnames against a configurable `IMAGE_URL_ALLOWLIST` environment variable.
- By default, it blocks all localhost, private class network IPs (e.g., `10.0.0.0/8`, `192.168.0.0/16`), and AWS metadata IP endpoints (`169.254.169.254`).

---

## 6. Testing Strategy

The test suite consists of modular test files (`tests/*.test.mjs`) executing under the Node.js native test runner:
- **Parser tests:** Asserts rundown text pattern accuracy and correct role extraction.
- **Scripture tests:** Validates KJV database lookup and markup stripping.
- **SSRF hardening tests:** Ensures localhost and private IPs are blocked, and allows only verified domains.
- **API and Auth tests:** Asserts middleware restrictions and webhook token validations.
