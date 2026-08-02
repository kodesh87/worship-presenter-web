# Development Guide - Monolith

This document provides a guide for setting up and working with the codebase of the `bic-pptx-workflow` project locally.

## Prerequisites

To build and run the project, ensure you have the following installed on your development machine:
- **Node.js:** Version 20.x or higher (Tested up to version 24)
- **Git:** For source control management
- **Docker Desktop:** (Optional) If you plan to test containerized execution parity locally using the `dev` profile.

---

## Local Environment Setup

Follow these steps to set up the development environment from scratch:

1. **Clone the repository:**
   ```powershell
   git clone <repository-url> D:\Developer\bic\bic-pptx-workflow
   cd D:\Developer\bic\bic-pptx-workflow
   ```

2. **Install Node.js dependencies:**
   ```powershell
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and edit it to include appropriate values.
   ```powershell
   copy .env.example .env
   ```
   *Required variables for development:*
   - `AUTH_SECRET`: A secure random string (minimum 16 characters) for session HMAC signatures.
   - `WEBHOOK_SECRET`: Secret token utilized for webhook authentication checks.
   - `AUTH_BOOTSTRAP_USER` & `AUTH_BOOTSTRAP_PASSWORD`: Initial credentials used to seed the first admin account when the database boots.

4. **Corpora (nothing to import):**
   The Seventh-day Adventist Hymnal (SDAH) lyrics and the King James Version (KJV)
   scripture text are committed to the repository and seed themselves the first
   time the app starts. There is no import step.
   ```powershell
   # Optional: assert both shipped corpora are whole
   npm run corpus:verify
   ```
   *Note: the first boot creates the SQLite database `data.db` in the root of the project and fills it from `data/song-book/sdah.json` and `data/en/bible-translation/kjv.json`.*

---

## Running the Application

### Option 1: Native Local Development (Recommended / Fastest)
Run the Next.js development server directly on your host machine:
```powershell
npm run dev
```
The application will be accessible at [http://localhost:3000](http://localhost:3000). Hot reloading is fully active.

### Option 2: Docker-Based Local Development
Run the containerized stack using the dev profile:
```powershell
docker compose --profile dev up -d --build
```
This builds the dependencies container stage, mounts the active directory source code into `/app` inside the container for hot reloading, and binds a separate development database `data.dev.db`.
The development server inside the container exposes port `3001` to the host: [http://localhost:3001](http://localhost:3001).

---

## Running and Writing Tests

The test suite uses the **native Node.js test runner** (`node --test`).
To run the full test suite, execute:
```powershell
npm test
```

### Test Files Breakdown

The project contains the following test suites located under the `/tests/` directory:
- `tests/parser.test.mjs`: Validates the rundown parser (`src/lib/parser.ts`) parsing roles, dates, timings, sermon details, and hymns.
- `tests/scripture.test.mjs`: Tests scripture reference lookup, markup stripping, and formatting.
- `tests/slide-plan.test.mjs`: Validates slide deck structure planning logic, such as announcement flyer additions and intercessory slides mapping.
- `tests/webhook-auth.test.mjs`: Asserts security validations for the `WEBHOOK_SECRET` headers.
- `tests/auth-http.test.mjs`: Validates middleware session restrictions.
- `tests/images-ssrf.test.mjs`: Tests URL allowlist enforcement and SSRF protection blockers on remote image schemas.
- `tests/announcements-url.test.mjs`: Verifies image extension parsing for announcements.

---

## Database Schemas & Migrations

The project does **not** use complex ORMs like Prisma for database migrations. Instead, database schema changes are managed programmatically:
1. **Startup DDL Checks:** Schema creation and alterations (e.g. `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE`) are executed programmatically in `src/lib/db/index.ts` during connection boot.
2. **Schema updates:** To add columns or update tables, add appropriate SQL scripts to the startup `db.exec(...)` flow or wrap them in safe `try/catch` migration blocks inside `src/lib/db/index.ts`.
