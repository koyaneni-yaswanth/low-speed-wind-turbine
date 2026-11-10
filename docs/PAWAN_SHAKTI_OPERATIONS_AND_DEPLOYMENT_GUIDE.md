# PAWAN SHAKTI — Deployment, Admin Setup & ESP32 Device Integration Guide

**Repository:** `koyaneni-yaswanth/low-speed-wind-turbine`  
**Branch:** `feature/pawan-shakti-platform`

---

## 1. Vercel & Supabase Deployment Instructions

### Step 1: Supabase Database Setup
1. Create or select a dedicated Supabase project (PostgreSQL + Auth).
2. Run migration [`supabase/migrations/001_pawan_shakti_platform.sql`](../supabase/migrations/001_pawan_shakti_platform.sql) in the **Supabase SQL Editor** (or via `npx supabase link --project-ref <ref> && npx supabase db push`).
3. Verify **Authentication -> Providers**: enable Email/Password login and restrict public signup if using an invite-only admin portal.

### Step 2: Assign Founder Super-Admin Role
After creating your first admin account in Supabase Auth, assign the `founder_super_admin` profile record in SQL Editor:
```sql
insert into public.profiles (id, email, full_name, role, affiliation)
values (
  '<auth-users-uuid>',
  'koyaneniyaswanth@gmail.com',
  'Koyaneni Yaswanth',
  'founder_super_admin',
  'VNIT Nagpur / V3F'
)
on conflict (id) do update set role = 'founder_super_admin';
```

### Step 3: Environment Variables
Configure these in **Vercel Project Settings -> Environment Variables** (and `.env.local` for local development):
- Client-safe (`VITE_` prefix only):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_URL`
- Server-only (NEVER prefix with `VITE_`):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DEVICE_HMAC_MASTER_SALT` (32+ byte random hex string)
  - `RESEND_API_KEY` *(optional; left blank queues notifications cleanly without simulating email sends)*
  - `NOTIFICATION_FROM_EMAIL` *(verified domain sender if Resend enabled)*
  - `ADMIN_ALERT_EMAIL`

### Step 4: Staging Verification Before Production
Deploy a Vercel Preview build from `feature/pawan-shakti-platform` first:
1. Verify `GET /api/health` returns `200 OK` with `supabaseConfigured: true`, `dbReachable: true`.
2. Submit a test Pilot Assessment on `/pilot` -> verify `PS-PILOT-...` ref created in `leads` & `pilot_applications`.
3. Sign into `/admin` -> confirm `team_member` cannot read Financials/CRM, while `founder_super_admin` can inspect leads, audit logs, and test runs.

---

## 2. Admin Operations Guide

- **Portal URL:** `/admin` (linked discreetly in footer under *Internal Workbench*, omitted from top public nav).
- **CRM Triage:** Review new Pilot Inquiries under *CRM & Pilot Pipeline*, log customer discovery notes, advance stages across the 17 pipeline states, and track LOIs honestly (`0` synthetic metrics).
- **Option A vs Option B Architecture Freeze:** Only enter scores (1–5) in the 16-criterion *Shootout Scorecard* after attaching physical dyno test runs.
- **Monthly V3F Executive PDF:** Complete commentary on the *KPIs, Monthly PDF, BOM & Roadmap* tab and click **Export Monthly Executive PDF**.

---

## 3. ESP32 / STM32 Device Telemetry Ingestion Contract

### Authentication & Replay Protection
Hardware controllers push JSON readings to `POST /api/telemetry` with HMAC-SHA256 headers (no static secret in frontend code):

- **Required Headers:**
  - `Content-Type: application/json`
  - `X-Device-Id`: Registered `device_uid` from `public.devices` (e.g., `ESP32-PS-01`)
  - `X-Device-Timestamp`: Current UTC Unix epoch seconds (accepted window: $\pm 300\text{ s}$)
  - `X-Device-Nonce`: Monotonic integer `sequence_no` (unique per timestamp/device)
  - `X-Device-Signature`: Hex HMAC-SHA256 of `"<X-Device-Timestamp>.<X-Device-Nonce>.<RAW_JSON_BODY>"` signed with the device secret stored on the server.

### JSON Payload Example
```json
{
  "site_id": "VNIT-ROOF-01",
  "sequence_no": 1024,
  "device_timestamp": "2026-11-10T12:00:00Z",
  "wind_speed_ms": 4.2,
  "wind_direction": "NE",
  "rotor_rpm": 295,
  "generator_rpm": 2950,
  "dc_voltage_v": 23.4,
  "dc_current_a": 1.15,
  "cumulative_energy_wh": 42.8,
  "temperature_c": 34.2,
  "vibration_g": "0.02/0.01/0.03",
  "brake_state": "released",
  "battery_soc_pct": 74.5,
  "device_health": "online",
  "sensor_health": "calibrated_ok",
  "swept_area_m2": 1.0
}
```

### Physical Safety & Audit Behavior
- Server separates `device_timestamp` from server `ingested_at`.
- Server automatically calculates $P_{\text{elec}} = V \times I$ and compares against Betz limit $0.593 \cdot (\frac{1}{2}\rho A V^3)$; impossible values are tagged `data_quality_status = 'betz_anomaly'` rather than silently deleted.
- Zero remote start, brake release, or pitch override control commands exist in web APIs.
