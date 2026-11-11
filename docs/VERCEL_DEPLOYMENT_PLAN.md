# PAWAN SHAKTI — Vercel Deployment Plan (`Phase 0 / Phase 4`)

**Date:** 11 November 2026  
**Vercel Configuration Inspected:** [`vercel.json`](../vercel.json), [`package.json`](../package.json), [`scripts/sync-repo-assets.mjs`](../scripts/sync-repo-assets.mjs)  
**Verified Account State (Vercel MCP):** User `koyaneniyaswanth@gmail.com` (`id: dyeIYVbHnH4yGCMgQJVCmZrJ`), team scope `team_myMRm7riJMuO0Io96f19pH1p` (`koyaneniyaswanth-9270s-projects`, Hobby tier). Currently awaiting browser consent approval via `authorize_team_access`.

---

## 1. Project & Build Configuration

| Setting | Verified Value | Source |
|---|---|---|
| **Framework Preset** | `vite` | `vercel.json` |
| **Install Command** | `npm ci` (or `npm install`) | `package.json` |
| **Build Command** | `npm run build` (`prebuild` automatically runs `node scripts/sync-repo-assets.mjs`, followed by `tsc -b && vite build`) | `package.json` & `vercel.json` |
| **Output Directory** | `dist` | `vercel.json` |
| **Serverless Functions (`api/*.ts`)** | `6` functions (`health.ts`, `inquiries.ts`, `telemetry.ts`, `admin.ts`, `analytics.ts`, `notifications.ts`) using shared `_lib/db.ts` — within Hobby plan `<= 12` function limit. | `api/` |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `/api/*` `Cache-Control: no-store, max-age=0`. | `vercel.json` |
| **SPA & Asset Rewrites** | `/api/(.*)` -> `/api/$1`; all other non-asset routes excluding `/api`, `/repo-assets`, `robots.txt`, `sitemap.xml` -> `/index.html`. | `vercel.json` |

---

## 2. Environment Variable Matrix (Strict Client/Server Boundary)

| Variable Name | Scope | Exposure Policy | Target Environments |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Client + Build | Browser-safe (`VITE_*`) | Preview, Production |
| `VITE_SUPABASE_ANON_KEY` | Client + Build | Browser-safe publishable/anon key ONLY (`VITE_*`) | Preview, Production |
| `VITE_APP_URL` | Client + Server | Deployed Preview / Production HTTPS URL | Preview, Production |
| `SUPABASE_URL` | Server Functions Only | Server-side API routes | Preview, Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Functions Only (**Encrypted Secret**) | **NEVER** prefixed with `VITE_*`; enters Vercel Server Env only | Preview, Production |
| `DEVICE_HMAC_MASTER_SALT` | Server Functions Only (**Encrypted Secret**) | Random 32-byte hex; never exposed to browser | Preview, Production |
| `RESEND_API_KEY` | Optional Server Secret | Leave blank until verified sender domain is ready | Preview, Production |
| `NOTIFICATION_FROM_EMAIL` | Optional Server Config | Verified sender email | Preview, Production |
| `ADMIN_ALERT_EMAIL` | Optional Server Config | `koyaneniyaswanth@gmail.com` | Preview, Production |

---

## 3. Staging-First Deployment & Verification Gate

1. **Team Access Authorization:** User approves `authorize_team_access` consent link for `team_myMRm7riJMuO0Io96f19pH1p`.
2. **Project Setup:** Inspect existing Vercel projects via `list_projects` (confirming `yashwanth-hub` or unrelated projects are untouched) and create/link dedicated `pawan-shakti-platform` project connected to `koyaneni-yaswanth/low-speed-wind-turbine` branch `feature/pawan-shakti-platform`.
3. **Preview Deployment First (Never Straight to Production):**
   - Deploy Preview target (`target` omitted / `preview`), monitor build logs via `list_deployment_events` until `READY`.
   - Exclude private files (`*Draft Pre - Incubation Agreement*`, `*.docx`, `.env*`, `node_modules/`, `dist/`) and verify `public/repo-assets/` never includes confidential agreements.
4. **Live Staging Verification Checklist:**
   - Check `GET <staging-url>/api/health` -> verify HTTP `200`, `ok: true`, `dbReachable: true` (after `SUPABASE_SERVICE_ROLE_KEY` is entered).
   - Run Playwright suite against `<staging-url>` testing all 9 public routes, 3D CAD assets, WebGL hero, calculators, Pilot submission, Contact form, `/admin` auth flows, RBAC denials, and mobile `375px` / tablet `768px` / desktop `1440px` layouts.
   - Confirm explicit founder approval before promoting Staging Preview to Production.
