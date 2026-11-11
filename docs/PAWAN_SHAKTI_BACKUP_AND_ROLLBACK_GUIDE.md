# PAWAN SHAKTI — Backup, Disaster Recovery & Rollback Guide (`Phase 13 / 16`)

**Date:** 11 November 2026  
**Protected Sibling Infrastructure:** `yashwanth-hub` (`prj_0At1YSsFsDiRAfIqyEtj81hyCFTg` / `xjhkxnfahkkgwbbtmhtk`) must NEVER be included in any Pawan Shakti rollback or backup runbook.

---

## 1. Deployment Identification & Rollback (`pawan-shakti-platform` — `prj_qAixqXLvh7Czpj2fj48hkfGXLQ9f`)

- **Vercel Deployment Rollback (Frontend & API):**
  1. Open Vercel Dashboard -> Project `pawan-shakti-platform` -> **Deployments**.
  2. Identify the last verified `READY` deployment ID and commit SHA.
  3. Click **Promote / Instant Rollback** to restore the previous immutable build and serverless functions in seconds without touching `feature/pawan-shakti-platform` Git history.
- **Environment Variable Rollback:** Maintain non-secret env manifest timestamps in `PAWAN_SHAKTI_ENVIRONMENT_CONFIGURATION_GUIDE.md`; if an env key change breaks Preview/Production, restore prior key values in Vercel Project Settings and redeploy the previous verified deployment ID.

---

## 2. Database Backup, Migration Limitations & Recovery

- **Migration Rollback Limitations:** Additive DDL migrations (`001`–`004`) (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE POLICY`) are designed NOT to drop or truncate live rows. Note that automatic "down migrations" dropping columns/tables WILL destroy production rows; therefore **never run destructive rollback SQL (`DROP TABLE`/`TRUNCATE`) without an explicit backup and Gate C approval**.
- **Pre-Change Backup Procedure:** Before applying any future schema change after `004`:
  - Export schema + critical rows cleanly (or enable Supabase Point-in-Time / scheduled logical dumps via `pg_dump` against `pawan-shakti-platform`).
- **Telemetry Ingestion Rollback / Containment:** If an ESP32 unit emits corrupted readings or leaks its key, immediately invoke `POST /api/telemetry { action: 'revoke_device', deviceUid }` (`founder_super_admin` or `engineering_admin`) to lock out HTTP `403` packets within `< 1s`, without dropping existing verified test run data.

---

## 3. Post-Rollback Verification Checklist

1. `GET <url>/api/health` -> Confirm `ok: true`, `dbReachable: true`, `authConfigured: true`.
2. Verify `/`, `/technology`, `/pilot`, and `/admin` routes render clean HTTP `200`.
3. Verify unauthenticated requests to `/api/admin` and `/api/inquiries` (GET) return HTTP `401`.
4. Confirm `https://yashwanth-hub.vercel.app/` remains HTTP `200` (`Yashwanth Hub — Command Center`).
