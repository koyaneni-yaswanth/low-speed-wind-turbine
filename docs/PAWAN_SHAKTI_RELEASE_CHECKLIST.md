# PAWAN SHAKTI — Staging & Production Release Checklist (`Phase 10`)

**Repository:** `koyaneni-yaswanth/low-speed-wind-turbine`  
**Branch:** `feature/pawan-shakti-platform`  
**Execution Audit Date:** 11 November 2026

---

## Pre-Deployment Verification Gates

| Gate | Status | Evidence / Action Needed |
| :--- | :---: | :--- |
| Dependency Security (`npm audit`) | **PASS (Locally Tested)** | `0` vulnerabilities after upgrading `zod` to `4.6.7`. |
| TypeScript & Oxlint (`tsc -b`, `oxlint`) | **PASS (Locally Tested)** | Zero compiler errors across `src/` & `api/`, zero lint issues. |
| Unit, Physics, CSV, Security & SQL Suite | **PASS (Locally Tested)** | `16 / 16` tests pass with zero skipped assertions. |
| Production Bundle (`vite build`) | **PASS (Locally Tested)** | Non-destructive asset sync excludes `.docx`/agreement PII; Vite bundles cleanly. |
| Headless Chrome E2E & Responsive Views | **PASS (Locally Tested)** | All 10 routes verified across `1440x900`, `768x1024`, `375x812` with WebGL CAD viewer, S1223 SVG, CSV check, form errors, and RBAC visibility. |
| Git Remote Push (`feature/pawan-shakti-platform`) | **BLOCKED** | Requires interactive GitHub authentication (`git push -u origin feature/pawan-shakti-platform`). |
| Supabase Migrations (`001` then `002`) | **BLOCKED** | Apply both SQL migrations cleanly inside dedicated Supabase SQL Editor. |
| Founder `profiles` Role Assignment | **BLOCKED** | Create founder Auth user & set `role = 'founder_super_admin'` in SQL Editor. |
| Vercel Environment Secrets | **BLOCKED** | Populate `.env.example` vars (`SUPABASE_*`, `VITE_SUPABASE_*`, `DEVICE_HMAC_MASTER_SALT`, optional `RESEND_API_KEY`) in Vercel Project Settings. |
| Staging Preview Health & Auth Smoke Test | **NOT VERIFIED** | Deploy Vercel Preview on `feature/pawan-shakti-platform`, confirm `GET /api/health` returns HTTP `200`, verify login + pilot submit + `team_member` RLS rejection. |
| Physical Hardware 1 Hz ESP32 Run | **BLOCKED** | Register `ESP32-PS-01` via `/admin`, flash one-time HMAC key, stream calibrated readings, verify monitoring-only dashboard. |
| Founder Explicit Production Sign-Off | **BLOCKED** | Mandatory founder approval before promoting Preview to `main` / Production URL. |
