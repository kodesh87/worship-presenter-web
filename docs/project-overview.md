# Project Overview - BIC PPTX Workflow

This document provides a high-level summary of the `bic-pptx-workflow` project, highlighting its core objectives, primary features, architectural patterns, and link indicators for deeper documentation.

## Executive Summary

`bic-pptx-workflow` is a church presentation automation hub. It simplifies the AV (Audio/Visual) operator’s weekly setup by automating rundown script parsing and PowerPoint slide generation.

The workflow begins when a rundown script is messaged via Telegram (routed through a bot to our webhook). The application automatically extracts the service date, liturgist roles, KJV Bible verses, and Seventh-day Adventist Hymnal (SDAH) numbers. It resolves the lyrics for each hymn, merges them with any attached announcement flyers, and renders a fully styled, ready-to-download `.pptx` presentation. In addition, it features an in-browser presentation system that synchronises slide changes in real time between an operator's dashboard and a projector output screen.

---

## Core Features

1. **Intelligent Rundown Parser:** Automatically extracts dates, liturgical roles (e.g., Elder, Closing Prayer), time stamps, special songs, sermon details, and scripture readings.
2. **Automated Hymnal Resolver:** Matches SDAH hymn numbers against an internal SQLite database and loads full song lyrics into the slides automatically.
3. **PowerPoint Slide Deck Generator:** Generates PPTX slide files using the `PptxGenJS` engine, applying background themes, custom formatting, and layout styles.
4. **Real-time Slide Sync (Presenter & Projector):** Features a web-based presenter view that syncs real-time slide transitions to a projector client tab using browser-native `BroadcastChannel` communication.
5. **On-demand Scripture Overlay:** Allows operators to search for KJV Bible verses on the fly and project them immediately on screen.
6. **Announcements Manager:** A drag-and-drop flyer manager that enables operators to upload, order, and embed graphic flyers into the slideshow.
7. **SSRF Hardened Webhook:** Restricts remote image downloads in webhook payloads through allowlists and local private address blocking, protecting local instances from SSRF exploits.

---

## Technical Stack Summary

| Layer | Component | Details |
|---|---|---|
| **Core Framework** | Next.js 16.2.10 | Standard web framework using React 19.2.4 App Router structure. |
| **Language** | TypeScript 5 | Typed programming layer. |
| **Database** | SQLite (better-sqlite3) | Lightweight database file `data.db` containing hymns, bible translations, settings, and services logs. |
| **Presentation Engine** | PptxGenJS 4.0.1 | Generates OpenXML `.pptx` presentation slides. |
| **Styling** | Tailwind CSS v4 | CSS utility library. |
| **Security / Auth** | Custom HMAC Web Crypto | Edge-safe session tracking cookie (`auth_session`) and SHA-256 Webhook checks. |
| **Testing** | Node.js Test Runner | Native unit and integration testing suite. |

---

## Project Documentation Index

To explore specific sections of the architecture, refer to the following documents:
- **[Master Index](./index.md):** The primary documentation entry point.
- **[Source Tree Analysis](./source-tree-analysis.md):** File layout structure and entry point locations.
- **[API Contracts](./api-contracts-monolith.md):** Detailed endpoint requests, query schemas, and session authentication requirements.
- **[Data Models](./data-models-monolith.md):** SQLite database tables, constraints, relationships, and seeding info.
- **[Component Inventory](./component-inventory-monolith.md):** Catalog of React views, primitives, and presentation scripts.
- **[Development Guide](./development-guide-monolith.md):** Guidelines for local build environment setups, database seeding, commands, and unit tests.
- **[Deployment Guide](./deployment-guide.md):** Production Docker configuration, Cloudflare tunneling, and host directories.
