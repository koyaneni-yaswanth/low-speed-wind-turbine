# PAWAN SHAKTI — Execution Baseline & Forensic Verification (`Stage A`)

**Repository:** `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine`  
**Local Path:** `C:\Users\recvn\Desktop\yashwanth-hub\low-speed-wind-turbine`  
**Branch:** `feature/pawan-shakti-platform`  
**Audited Baseline Commit:** `56379ae786ea0452f399d434a3426cbfd669c56f` (`56379ae`)  
**Verification Timestamp:** 11 November 2026 (`2026-11-11T15:00+05:30`)  
**Node / Toolchain:** Node `v22.23.4`, React `19.1.0`, TypeScript `~5.8.0`, Vite `6.3.0`, Three.js `0.175.0`, Playwright Core `1.65.0`, Oxlint `1.0.0`, Tailwind CSS `4.1.0`

---

## 1. Baseline Command & Check Reproduction Results

| Check | Command | Exit Code | Result | Observed Evidence |
| :--- | :--- | :---: | :---: | :--- |
| **TypeScript Compile** | `npx.cmd tsc -b --force` | `0` | **PASS** | Frontend (`tsconfig.app.json`) + API (`tsconfig.node.json`) clean (`0` errors). *(Note: emits untracked `tsconfig.*.tsbuildinfo` because `*.tsbuildinfo` was missing from `.gitignore`.)* |
| **Linter (`oxlint`)** | `npm.cmd run lint` | `0` | **PASS** | `0` errors, `0` warnings. |
| **Unit / API / SQL Tests** | `npm.cmd test` | `0` | **PASS** | `13 / 13` subtests passed (`0` failed, `0` skipped, `854.98 ms`) against local unit logic and in-memory API mocks. Live Supabase integration = **NOT VERIFIED** (no `.env` / cloud DB). |
| **Production Build** | `npm.cmd run build` | `0` | **PASS** | `sync-repo-assets.mjs` synced `4 media, 2 drawings, 81 airfoil pts, 33 CAD entries`; Vite transformed `2188` modules cleanly in `6.93s`. |
| **Headless Chrome E2E** | `node scripts/e2e-verify.mjs` | `0` | **PASS** | Verified all 10 routes (`/`, `/technology`, `/products`, `/applications`, `/performance`, `/pilot`, `/about`, `/resources`, `/contact`, `/admin`), `S1223` SVG, `fan gear.3mf`, sample CSV Betz check, Pilot form alert, `/admin` RBAC toggle, `1440x900`, `768x1024`, `375x812`. *(No screenshot archival or `/contact` form E2E test yet.)* |
| **Dependency Security Audit** | `npm.cmd audit` | `1` | **FAIL** | **1 High vulnerability:** `zod < 4.6.6` (`GHSA-mrhx-c7xc-m3w5`: memory exhaustion on constrained collections). |
| **Original Asset Integrity** | `git diff --name-only 66e3e4e -- <orig dirs>` | `0` | **PASS** | Empty diff: all 69 original engineering, CAD, media, IP, report, team, and test files preserved completely unmodified. |

---

## 2. Environment, Cloud & Hardware Baseline State

| Component | Baseline Status | Exact Finding |
| :--- | :---: | :--- |
| **`.env` / `.env.local`** | **BLOCKED (Missing)** | Only `.env.example` exists (`955 B`). Zero `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `DEVICE_HMAC_MASTER_SALT`, or `RESEND_API_KEY` values configured locally. |
| **CLI Tools (`vercel`, `supabase`, `gh`)** | **BLOCKED (Missing)** | None of `vercel`, `supabase`, or `gh` CLI binaries exist on system PATH. |
| **Supabase Database & Auth** | **PARTIAL / NOT VERIFIED** | Schema (`001_pawan_shakti_platform.sql`, 35 tables) exists cleanly, **BUT** live connection has never run, and forensic SQL audit found **missing RLS policies on 20+ tables** (including `profiles`, `tasks`, `grants`, `test_runs`) + **privilege fallback bug** (`'team_member'` default when profile row missing). |
| **Vercel Serverless & Hosting** | **BLOCKED** | `vercel.json` and 6 API functions exist cleanly; repository is not yet linked to Vercel and no production/preview URL exists. |
| **GitHub Remote Sync** | **BLOCKED** | Branch `feature/pawan-shakti-platform` (`56379ae`) is local only; non-interactive push requires interactive GitHub credentials. |
| **Physical Hardware Telemetry** | **BLOCKED** | Zero ESP32/STM32 bench controllers streaming live readings; monitoring-only `/api/telemetry` awaits registered hardware keys, rate limiting, and calibrated 1 Hz runs. |

---

## 4. Post-Hardening Verification Snapshot (`Stage F — 11 November 2026`)

| Check | Command | Exit Code | Result | Observed Evidence |
| :--- | :--- | :---: | :---: | :--- |
| **Dependency Audit** | `npm.cmd audit` | `0` | **PASS** | `0` vulnerabilities (`zod` upgraded cleanly to `4.6.7`). |
| **TypeScript Compile** | `npx.cmd tsc -b --force` | `0` | **PASS** | `0` errors across `src/` and `api/`. |
| **Static Linter** | `npm.cmd run lint` | `0` | **PASS** | `0` errors, `0` warnings via `oxlint`. |
| **Automated Test Suite** | `npm.cmd test` | `0` | **PASS** | `16 / 16` subtests pass (`0` failed, `0` skipped, including 5,000-row CSV stress check, 36-table SQL/RLS check, and API/security hardening assertions). |
| **Production Bundle** | `npm.cmd run build` | `0` | **PASS** | Synced `4 media, 2 drawings, 81 airfoil pts, 33 CAD entries`; Vite transformed `2273` modules in `3.73s`. |
| **Chrome E2E + Screenshots** | `node scripts/e2e-verify.mjs` | `0` | **PASS** | Zero console/page errors, zero broken images, `<= 2px` overflow, 3D Zoom/Reset/Wireframe verified, desktop/tablet/mobile screenshots captured. |

