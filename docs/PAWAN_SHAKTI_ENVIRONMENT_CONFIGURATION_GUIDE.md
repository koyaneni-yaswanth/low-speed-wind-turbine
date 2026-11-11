# PAWAN SHAKTI — Environment & Secret Management Guide (`Phase 5`)

**Date:** 11 November 2026  
**Authoritative Template:** [`.env.example`](../.env.example)  
**Isolation Mandate:** Never copy, reuse, or inspect secrets from `yashwanth-hub` (`xjhkxnfahkkgwbbtmhtk`). Use dedicated credentials for `pawan-shakti-platform` (`prj_qAixqXLvh7Czpj2fj48hkfGXLQ9f`) only.

---

## 1. Environment Variable Matrix (Names & Exposure Rules Only)

| Variable Name | Used By | Scope | Storage Rule | Preview vs Production |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (`src/lib/supabase.ts`), `/api/health` | Client + Build + Server | Browser-safe HTTPS URL (`https://<ref>.supabase.co`) | Dedicated `pawan-shakti-platform` Staging vs Production DB |
| `VITE_SUPABASE_ANON_KEY` | Frontend (`src/lib/supabase.ts`), `/api/health` | Client + Build + Server | Public publishable/anon key ONLY (`VITE_*` safe) | Matches corresponding Supabase project |
| `VITE_APP_URL` | `api/_lib/db.ts` (`getAllowedOrigins()`) | Client + Server CORS | Exact Preview or Production origin (`https://...`) | Separate Preview URL vs `https://pawan-shakti.vercel.app` |
| `SUPABASE_URL` | Server Functions (`api/_lib/db.ts`) | Server-Only | Project API URL (NEVER `VITE_*` if kept separate) | Dedicated Pawan Shakti URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Functions (`api/_lib/db.ts`) | **Server Secret Only** | **NEVER** `VITE_*`; pasted directly by user in Vercel Dashboard Project Settings | Non-production / Staging only in Preview |
| `DEVICE_HMAC_MASTER_SALT` | Server Config | **Server Secret Only** | 32-byte random hex (`crypto.randomBytes(32).toString('hex')`); never browser-bundled | Independent per environment |
| `ALLOWED_ORIGINS` *(Optional)* | `api/_lib/db.ts` (`getAllowedOrigins()`) | Server-Only | Comma-separated additional allowed HTTPS origins | Strict origin allowlist |
| `RESEND_API_KEY` *(Optional)* | `api/notifications.ts`, `api/health.ts` | **Server Secret Only** | Blank = `"queued_provider_unconfigured"` cleanly | Optional email delivery |
| `NOTIFICATION_FROM_EMAIL` *(Optional)* | `api/notifications.ts`, `api/health.ts` | Server Config | Verified Resend sender domain address | Optional email delivery |
| `ADMIN_ALERT_EMAIL` | `api/inquiries.ts` | Server Config | Internal admin owner email | `koyaneniyaswanth@gmail.com` |
| Per-Device `oneTimeDeviceKey` (`ps_dev_*`) | ESP32/STM32 Firmware Only | Hardware Flash | Minted once via `POST /api/telemetry { action: 'register_device' }` | Unique per physical unit; instant revoke |

---

## 2. Fail-Closed Missing Variable Behavior

When `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are absent, `GET /api/health` returns `HTTP 503` (`configStatus: "configuration_incomplete"`, `dbReachable: false`), all persistence endpoints return `HTTP 503` without faking `201 OK`, and Admin UI displays offline warning banners instead of authenticating locally.
