# PAWAN SHAKTI — Security Verification Report (`Phase 0 / Phase 5`)

**Date:** 11 November 2026  
**Scope:** Source code (`src/`, `api/`), build scripts (`scripts/`), SQL migrations (`supabase/migrations/001..003`), HTTP headers (`vercel.json`), tracked Git artifacts (`git ls-files`), dependencies (`npm audit`).

---

## 1. Automated & Static Security Checks Executed

| Check | Outcome | Evidence |
|---|---|---|
| `npm audit` | **PASSED (`0` vulnerabilities)** | `zod` pinned at `^4.6.7`, zero advisories. |
| Tracked `.env` / secret scan | **PASSED (`0` leaks)** | `git ls-files` contains only `.env.example`; scan across 114 tracked text files found zero JWTs, `service_role` keys, `Resend` keys, PANs, or Aadhaar strings. |
| Frontend Bundle Secret Isolation | **PASSED** | `tests/api_and_security.test.mjs` confirms zero references to `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `DEVICE_HMAC_MASTER_SALT` inside `src/`. |
| Physical Hardware Safety Boundary | **PASSED** | Zero actuation endpoints exist (`safety_status = 'monitoring_only_no_remote_actuation'`). Telemetry ingestion accepts read-only metrics only. |
| Device HMAC Authentication & Replay Guard | **PASSED (Unit Verified)** | `api/telemetry.ts` validates `X-Device-Id`, `X-Device-Timestamp` (+/- 300s window), `timingSafeEqual` HMAC-SHA256, revoked devices (`403`), unique `(device_id, device_timestamp, sequence_no)` replay dedupe, sliding-window rate limits (`429`), and persists rejected attempts into `device_errors`. |

---

## 2. Security Findings & Applied Remediations

| ID | Severity | Finding Observed in Audit | Resolution Applied & Verified |
|---|---|---|---|
| **SEC-01** | **Medium** | Raw Postgres error strings returned directly on HTTP `500`/`503` in `api/*.ts` could expose table/constraint names. | **IMPLEMENTED & VERIFIED:** Added `safeServerError()` in `api/_lib/db.ts` across `admin.ts`, `telemetry.ts`, `inquiries.ts`, `analytics.ts`, `notifications.ts`, and sanitized `health.ts`. Verified via negative DB failure unit test (`20/20` passing). |
| **SEC-02** | **High** | Authenticated `public_visitor` accounts saw empty workbench tabs in `AdminPortalPage.tsx`, which also lacked Sign Up, Password Reset, and session-expiration messaging. | **IMPLEMENTED & VERIFIED:** Enforced explicit `canAccessAdminRoute()` Unauthorized gate + `signUp`, `resetPasswordForEmail`, `PASSWORD_RECOVERY` password update, and session-expiration notice in `src/pages/AdminPortalPage.tsx`. |
| **SEC-03** | **Medium** | Storage buckets and `storage.objects` RLS policies were missing from `001` & `002`. | **IMPLEMENTED & LOCALLY TESTED:** Added `supabase/migrations/003_storage_buckets_and_policies.sql` defining `public-docs` (omits broad `SELECT` policy to prevent Advisor `0025_public_bucket_allows_listing`), `dataroom-private` (`founder_super_admin`, `engineering_admin`, `external_reviewer`), and `telemetry-csvs`. Live DB apply awaits user gate approval. |
| **SEC-04** | **Low** | `api/admin.ts` `upsert_turbine` only ran `insertRow` (failed on duplicate `turbine_code`), and several `updateRows` calls ignored DB error returns. | **IMPLEMENTED & VERIFIED:** `upsert_turbine` checks existing `turbine_code` and updates idempotently (`200`), and error checking added across all admin/CRM writes. |
| **SEC-05** | **Medium (Public Repo Awareness)** | Historical `.docx` (`reports/Pawan_Shakti_Briefing_Note.docx`, `testing/test-protocols/Intern_Task_Brief_Wind_Turbine.docx`) and `reports/VNIT-Pre-Incubation-Agreement-Summary.md` exist in public Git history (`66e3e4e`), while `sync-repo-assets.mjs` blocks `.docx` and `*Pre - Incubation*` from runtime `public/repo-assets/`. | Kept confidential `*Draft Pre - Incubation Agreement*` strictly excluded via `.gitignore`; `dataroom-private` bucket prevents public access to sensitive uploaded agreements. |
| **SEC-06** | **Medium (Cloud Gate)** | Live hosted PostgreSQL RLS, live Supabase Auth JWT enforcement, and live Vercel Preview security headers cannot be verified until Supabase & Vercel approval gates are cleared. | **BLOCKED (User Approval Gate):** Live JWT + RLS verification queued immediately behind Phase 2 & 4 user approval. |
