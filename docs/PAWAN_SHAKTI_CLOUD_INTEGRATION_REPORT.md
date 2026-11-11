# PAWAN SHAKTI — Cloud & Database Integration Report (`Phase 2 & 10`)

**Date:** 11 November 2026  
**Repository:** `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine`  
**Branch:** `feature/pawan-shakti-platform`  
**Verdict Scope:** Implemented + Locally Tested + Schema/RLS Audited; **Cloud Verified = BLOCKED** (awaiting dedicated Supabase & Vercel environment credentials).

---

## 1. Classification Across Cloud & Database Boundaries

| Dimension | Classification | Verification Detail |
| :--- | :---: | :--- |
| **PostgreSQL Schema (`001` + `002`)** | **Implemented & SQL-Checked** | 36 relational tables (`001` 35 tables + `002` `device_errors`), extended columns for Prototype Registry, Devices, Test Runs, CRM Leads, Tasks, and Grants, FK indexes, `set_updated_at()` triggers, `prevent_profile_role_escalation()`, and `handle_new_auth_user()` defaulting strictly to `'public_visitor'`. |
| **Row Level Security (RLS)** | **Implemented & Policy-Checked** | Every single one of the **36 tables** enables RLS and holds explicit least-privilege policies separating `founder_super_admin`, `engineering_admin`, `crm_admin`, `team_member`, `external_reviewer`, and `public_visitor`. |
| **Serverless Endpoints (`api/*.ts`)** | **Implemented & Unit-Tested** | 6 Vercel functions (`<= 12` Hobby limit): `/api/health`, `/api/inquiries`, `/api/telemetry`, `/api/admin`, `/api/analytics`, `/api/notifications`. Tested via in-memory DB adapter and unconfigured-env `503` assertions. |
| **Frontend Supabase Session Wiring** | **Implemented & Built** | `src/lib/supabase.ts` uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` only; `AdminPortalPage.tsx` binds Supabase `getSession()`/`onAuthStateChange()` and passes `accessToken` to all 4 internal workbench tabs (`/api/telemetry`, `/api/inquiries`, `/api/admin`). |
| **Live Supabase Connection & Auth** | **BLOCKED / NOT VERIFIED** | Zero live `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or `VITE_SUPABASE_ANON_KEY` credentials exist locally. Live PostgreSQL queries and JWT RLS checks have NOT been executed against a remote Supabase instance yet. |
| **Email Notification Delivery (Resend)** | **BLOCKED / NOT VERIFIED** | Integrated via real Resend HTTP endpoint (`api/notifications.ts`); leaves `RESEND_API_KEY` unset and logs `"queued_provider_unconfigured"` rather than faking delivery. |
| **Vercel Preview / Production Deploy** | **BLOCKED / NOT VERIFIED** | `vercel.json`, `robots.txt`, and `sitemap.xml` are configured cleanly; CLI not installed and repository not yet linked to Vercel. |

---

## 2. Schema Hardening Applied in Migration `002`

During Stage A forensic verification, we discovered that while `001_pawan_shakti_platform.sql` enabled RLS on all 35 tables, **20+ tables lacked explicit RLS policies** and lacked fail-closed profile triggers. [`supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql`](../supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql) resolves all gaps idempotently:
- Adds explicit RLS policies on `roles`, `profiles`, `site_assessments`, `lead_activities`, `pilot_projects`, `turbines`, `option_comparisons`, `sensors`, `test_runs`, `test_measurements`, `maintenance_events`, `faults`, `device_errors`, `tasks`, `milestones`, `vendors`, `grants`, `grant_applications`, `product_documents`, `patents`, `monthly_reports`, `notifications`, and `analytics_events`.
- Adds `prevent_profile_role_escalation()` so authenticated non-founders cannot alter `profiles.role` through client queries.
- Adds `handle_new_auth_user()` defaulting new Auth signups strictly to `'public_visitor'` (fail-closed, never `'team_member'`).
- Adds structural reference seeds for Mark-3/4/5/working-1m², all 16 Option A/B comparison criteria, and the 2025 Published IPO Patent record with **zero synthetic customers, telemetry, or grant approvals**.
