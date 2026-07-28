# LiveServer + Docker Verification Notes

**Date:** 2026-07-19
**Implementer:** Antigravity Agent

## 1. Automated Tests (`npm test`)
- **Status:** **PASS** (32 tests passed, 0 failed, 859ms duration).
- All webhook, images, slide plan, and parser tests passing.

## 2. Docker Build (`docker build -t bic-pptx:local .`)
- **Status:** **PENDING HUMAN VERIFICATION**
- *Agent note:* Docker is not installed in the agent environment (`docker : The term 'docker' is not recognized`). 
- **Action Required:** Operator (`kodesh87`) must run this locally to confirm the build succeeds.

## 3. Compose Prod Verification
- **Status:** **PENDING HUMAN VERIFICATION**
- **Action Required:** Operator must run:
  ```powershell
  New-Item -ItemType Directory -Force -Path "D:\LiveServer\presenter.example.church\app"
  # Copy/clone code into app, copy .env to D:\LiveServer\presenter.example.church\.env
  cd D:\LiveServer\presenter.example.church\app
  .\scripts\liveserver-up.ps1
  ```
  Check that the container starts up and SQLite `data.db` is correctly created on the host at `D:\LiveServer\presenter.example.church\data.db`.

## 4. Webhook Smoke
- **Status:** **PENDING HUMAN VERIFICATION**
- **Action Required:** After standing up the container, send a `POST /api/webhook` with the `WEBHOOK_SECRET`. Expect 200/201.

## 5. Login
- **Status:** **PENDING HUMAN VERIFICATION**
- **Action Required:** Navigate to `http://127.0.0.1:3000/login` or via the Tunnel at `https://presenter.example.church` and log in.

## 6. PPTX Download
- **Status:** **PENDING HUMAN VERIFICATION**
- **Action Required:** Generate a PPTX to verify that `better-sqlite3` runs correctly in the container and the cache directory on the host (`D:\LiveServer\presenter.example.church\cache\pptx`) receives the generated files.

## 7. Persistence Check
- **Status:** **PENDING HUMAN VERIFICATION**
- **Action Required:** Run `docker compose --profile prod down` and then `up` again. Verify the session and services remain in the DB.

---
**Summary:** Implementation is complete. The Next.js standalone setup, Dockerfiles, Compose scripts, and Tunnel documentation have been successfully added to the repository. The user must finish running this checklist locally to confirm the container behaves as expected.
