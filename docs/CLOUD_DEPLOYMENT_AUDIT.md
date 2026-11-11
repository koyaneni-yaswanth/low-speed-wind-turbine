# PAWAN SHAKTI — Cloud Deployment & Repository Audit (`Phase 0`)

**Date:** 11 November 2026  
**Repository:** `C:\Users\recvn\Desktop\yashwanth-hub\low-speed-wind-turbine`  
**Remote:** `origin -> https://github.com/koyaneni-yaswanth/low-speed-wind-turbine.git`  
**Branch:** `feature/pawan-shakti-platform`  
**Audited Commit:** `6ac76ee1454c43ef68a312fb5e0c6dffc163521c` (tracks `origin/feature/pawan-shakti-platform`, ahead of `main` @ `66e3e4ed9773739891270951dac42cf68d589015`)

---

## 1. Executive Reality Check

Every component, script, migration, serverless route, test suite, and deployment asset in the repository was independently inspected on disk rather than relying on prior documentation.

| Area | Verified Observed State | Gap / Action Required |
|---|---|---|
| **Original Repository Assets** | Baseline `main` (`66e3e4e`) contains 70 tracked files (2 initial files + 68 added files across docs, CAD `.stl`/`.3mf`/`.f3d`/`.step`/`.dat`, photos, IP disclosures, reports, team records, test protocols). Only `.gitignore` and `CHANGELOG.md` changed since `66e3e4e`; zero original hardware, CAD, media, testing, IP, or team files were deleted or overwritten. | Keep `0` edits to original engineering files; exclude confidential `.docx` and `*Pre-Incubation*` assets during build sync (`scripts/sync-repo-assets.mjs`). |
| **GitHub & Remote State** | `git ls-remote origin` confirms `refs/heads/feature/pawan-shakti-platform` already exists on GitHub at `6ac76ee1454c43ef68a312fb5e0c6dffc163521c`, matching local `HEAD`. Working tree is clean. | Re-push cleanly after completing Phase 0 audit reports and local hardening fixes. |
| **Baseline Checks (`6ac76ee`)** | `tsc -b --force` (`0`), `npm run lint` (`0` warnings/errors), `npm test` (`19/19` passed, `234.80 ms`), `npm audit` (`0` vulnerabilities). | Maintain 100% pass rate and add unit tests covering DB snake_case telemetry hydration, sanitized HTTP 500 responses, and storage bucket SQL policies. |
| **Frontend Architecture** | 10 React Router routes (9 public pages + `/admin` internal workbench), Three.js hero/planetary gearbox/energy flow/Option A-B comparison/CAD viewer, S1223 SVG plot, Betz/ROI/LCOE/hybrid calculators, ESP32 CSV inspector. | Fix `EngineeringWorkbenchTab.tsx` snake_case -> camelCase telemetry & turbine mapping bug, wire Supabase Realtime subscription, and expand `AdminPortalPage.tsx` with Sign Up, Password Reset, Unauthorized (`public_visitor`), and expired-session UX. |
| **Supabase Schema & Cloud** | Migrations `001` (35 tables) + `002` (`device_errors` = 36 tables) define strict RLS across all 36 tables, `prevent_profile_role_escalation()`, and `handle_new_auth_user()` defaulting to `'public_visitor'`. Supabase MCP connected to org `"koyaneni-yaswanth's Org"` (`uqxgagrkueaczfaauwpl`, Free Tier). Existing project `xjhkxnfahkkgwbbtmhtk` holds unrelated `yashwanth-hub` tables (`conversations`, `messages`, etc.). | **MUST NOT** touch `xjhkxnfahkkgwbbtmhtk`. Add migration `003` for Supabase Storage buckets & policies (`dataroom-private`, `telemetry-csvs`, `public-docs`). Await explicit user confirmation to create dedicated free-tier project `pawan-shakti-platform` (`ap-south-1`). |
| **API Endpoints (`api/*.ts`)** | Six Vercel serverless handlers (`health.ts`, `inquiries.ts`, `telemetry.ts`, `admin.ts`, `analytics.ts`, `notifications.ts`) + `_lib/db.ts` (`<= 12` Hobby limit). All DB-dependent handlers fail closed (`503`) when env vars are unset. | Sanitize raw Postgres error messages before returning HTTP `500` responses, fix `upsert_turbine` conflict handling, and check update errors in `api/admin.ts` & `api/inquiries.ts`. |
| **Vercel Deployment** | `vercel.json` specifies `vite`, `npm run build`, `dist`, security headers, `/api/*` `no-store`, and SPA rewrites. Vercel MCP user authenticated (`koyaneniyaswanth@gmail.com`), scope `team_myMRm7riJMuO0Io96f19pH1p`. | **Blocked on User Consent Gate:** Vercel team scope `koyaneniyaswanth-9270s-projects` requires approving `authorize_team_access` link before listing/creating projects and deploying Staging Preview. |
| **Physical Hardware Telemetry** | ESP32 HMAC-SHA256 ingestion backend + CSV template exist; `0` physical field devices connected or streaming. | Keep explicit `"Simulation Mode — No live hardware data connected"` labeling everywhere; maintain TRL 4 truth baseline. |

---

## 2. Specific Technical Defects Identified During Code Audit

1. **Live Telemetry Field Mismatch (`src/components/admin/EngineeringWorkbenchTab.tsx`):** `GET /api/telemetry` returns raw PostgreSQL column names (`wind_speed_ms`, `dc_voltage_v`, `dc_current_a`, `power_w`, `device_timestamp`, `data_quality_status`, etc.), whereas `EngineeringWorkbenchTab.tsx` passed `telData.telemetry` straight into React state typed as `TelemetryReading` (`windSpeedMs`, `powerW`, `timestamp`, `dataQualityStatus`). `telData.turbines`, `telData.devices`, and `telData.deviceErrors` were similarly unhydrated on mount. Furthermore, no Supabase Realtime `postgres_changes` channel subscription existed yet.
2. **Incomplete Auth Lifecycle (`src/pages/AdminPortalPage.tsx`):** Implemented Sign In and Sign Out only; lacked Sign Up (`auth.signUp`), Password Reset (`resetPasswordForEmail` + `PASSWORD_RECOVERY` handler via `updateUser`), explicit Unauthorized view for authenticated `public_visitor` users (`!canAccessAdminRoute`), and session-expiration notice.
3. **Missing Storage Buckets & Policies (`supabase/migrations/`):** Migrations `001` and `002` created 36 relational tables and RLS policies, including `product_documents.storage_path`, but never created Supabase Storage buckets or `storage.objects` RLS policies for confidential Data Room artifacts vs public files.
4. **Raw Error Propagation & Non-Idempotent Turbine Insert (`api/*.ts`):** Several `500` error handlers returned raw Supabase error strings directly in HTTP JSON responses, `upsert_turbine` performed plain `INSERT` (causing unique key failures on update), and `updateRows` errors were ignored in several write paths.
5. **CrmPipelineTab Optimistic Update (`src/components/admin/CrmPipelineTab.tsx`):** `updateStage` updated React UI state without awaiting/checking `PATCH /api/inquiries` response status; `FounderOperatingTab.tsx` did not yet hydrate live DB KPIs from `/api/admin?action=financials` / telemetry counts.

---

## 3. Large Assets & Git/Vercel Payload Boundaries

- Assets >5 MB in workspace (excluding `node_modules/.git/dist`):
  - `engineering/cad/stl-and-3mf/magnetic gear.3mf` (`5,459,120` bytes)
  - `reports/presentations/Betz-limit.pptx` (`8,285,902` bytes — excluded from public runtime assets by design; not copied to `public/repo-assets/`)
- Tracked `.env` files in Git: **`0`** (`git ls-files` shows only `.env.example`).
- Tracked secret scan across 114 text files: **`0` exposed JWTs, service-role keys, Resend keys, PANs, or Aadhaar strings**.
