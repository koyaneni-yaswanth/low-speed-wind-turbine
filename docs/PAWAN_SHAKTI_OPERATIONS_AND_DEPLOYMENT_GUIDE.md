# PAWAN SHAKTI — Dedicated Cloud Operations & Deployment Guide

**Repository:** `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine.git`  
**Deployment Branch:** `feature/pawan-shakti-platform`  
**Isolated Targets:** Vercel Project `pawan-shakti-platform` (`https://pawan-shakti.vercel.app/`) + Dedicated Supabase `pawan-shakti-platform` (`ap-south-1` Mumbai, org `uqxgagrkueaczfaauwpl`).  
**Infrastructure Rule:** **NEVER** deploy to `yashwanth-hub` (`prj_0At1YSsFsDiRAfIqyEtj81hyCFTg` / `https://yashwanth-hub.vercel.app/`) or reuse Supabase project `xjhkxnfahkkgwbbtmhtk`.

---

## 1. Dedicated Supabase Provisioning & Ordered Migrations

1. Provision dedicated project **`pawan-shakti-platform`** in **`koyaneni-yaswanth's Org`** (`uqxgagrkueaczfaauwpl`), region **`ap-south-1`** (`Free Tier`), confirming `status === ACTIVE_HEALTHY`.
2. Apply all three non-destructive idempotent SQL migrations strictly in order:
   - [`supabase/migrations/001_pawan_shakti_platform.sql`](../supabase/migrations/001_pawan_shakti_platform.sql) (35 tables + RLS enablement + core policies)
   - [`supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql`](../supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql) (36th table `device_errors`, complete RLS, triggers, baseline structural seeds)
   - [`supabase/migrations/003_storage_buckets_and_policies.sql`](../supabase/migrations/003_storage_buckets_and_policies.sql) (`public-docs`, `dataroom-private`, `telemetry-csvs` + least-privilege `storage.objects` policies)
3. Configure Auth URLs in Supabase (`Authentication -> URL Configuration`):
   - **Site URL:** Deployed Staging / `https://pawan-shakti.vercel.app`
   - **Redirect URLs:** `http://localhost:5174/admin`, `https://*-pawan-shakti*.vercel.app/admin`, `https://pawan-shakti.vercel.app/admin`
4. Sign up as Founder at `/admin` (which creates a fail-closed `'public_visitor'` row via `handle_new_auth_user()`), then run one-time administrative elevation as `service_role` in Supabase SQL Editor:
   ```sql
   update public.profiles
   set role = 'founder_super_admin'
   where email = 'koyaneniyaswanth@gmail.com';
   ```

---

## 2. Dedicated Vercel Project & Environment Separation

1. Connect `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine.git` as **NEW** project **`pawan-shakti-platform`** (`Framework: vite`, `Install: npm ci`, `Build: npm run build`, `Output: dist`, `Production branch: feature/pawan-shakti-platform`).
2. Configure **Preview** & **Production** environment variables independently from `yashwanth-hub`:
   - Client-safe (`VITE_*` only): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
   - Server-only (Encrypted Secrets, NEVER `VITE_*`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (pasted securely by user from Supabase Dashboard -> Settings -> API), `DEVICE_HMAC_MASTER_SALT` (`32`-byte random hex), optional `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`, `ADMIN_ALERT_EMAIL`.
3. Deploy **Preview** first -> confirm `GET /api/health` (`200 OK`, `dbReachable: true`) -> verify all 10 routes, Auth roles, RLS denials, CRM writes, and mobile layout BEFORE promoting Preview to Production (`https://pawan-shakti.vercel.app/`).

---

## 3. ESP32 / STM32 Hardware Telemetry Ingestion Contract

Devices authenticate via `POST /api/telemetry` using headers `X-Device-Id`, `X-Device-Timestamp` (`+/-300s`), `X-Device-Nonce`, and `X-Device-Signature` (`HMAC-SHA256` over `<ts>.<nonce>.<rawBody>`), persisting validated metrics into `public.telemetry` and surfacing live updates over Supabase Realtime (`postgres_changes` `INSERT`). Zero remote hardware actuation exists.
