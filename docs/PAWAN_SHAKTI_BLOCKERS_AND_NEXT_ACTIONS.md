# PAWAN SHAKTI — Outstanding Blockers & Priority Action Plan (`Phase 11`)

**Date:** 11 November 2026  
**Branch:** `feature/pawan-shakti-platform`

---

## 1. Confirmed Blockers (Never Disguised)

1. **GitHub Authentication on Remote Push (`BLOCKED`):** Local terminal runs non-interactively and `gh` CLI is not installed, blocking automated push to `origin/feature/pawan-shakti-platform`.
2. **Dedicated Supabase Project & Keys (`BLOCKED`):** No `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, or `VITE_SUPABASE_ANON_KEY` configured locally. All DB write routes honestly return HTTP `503`.
3. **Vercel Hosting & Preview Deployment (`BLOCKED`):** `vercel` CLI is absent and project is not linked to Vercel yet; cannot verify staging HTTP `200` routes or live deployment URL.
4. **Resend Provider Secret (`BLOCKED`):** `RESEND_API_KEY` is unset; inquiry confirmations log `"queued_provider_unconfigured"` rather than faking emails.
5. **Physical Calibrated Sensors & ESP32 Controller (`BLOCKED`):** No live `INA226` + anemometer + tachometer test bench is currently streaming signed HMAC packets to `/api/telemetry`.

---

## 2. Next Five Highest-Priority Actions

| Priority | Action | Owner | Deliverable | Target Window | Dependency |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **P0** | Push `feature/pawan-shakti-platform` cleanly to GitHub | Founder (`Koyaneni Yaswanth`) | Upstream branch pushed on GitHub with reviewable PR against `main` | Immediate (Day 1) | Authenticated interactive Git push |
| **P0** | Provision Supabase & execute SQL migrations `001` + `002` + create `founder_super_admin` | Founder / DevOps | Live Postgres DB with all 36 RLS tables & working Supabase Auth login | Day 1–2 | Dedicated Supabase project |
| **P0** | Configure Vercel env vars & verify Staging Preview deployment | Founder / DevOps | Preview URL returning HTTP `200` on `/api/health`, persisting pilot/CRM & rejecting `team_member` financials | Day 2–3 | Pushed GitHub branch + Supabase keys |
| **P0** | Complete physical caliper geometry sheet & 1 Hz ESP32 closed-loop bench rig | Engineering Lead / Embedded Team | Registered `ESP32-PS-01` streaming calibrated $P = V \times I$ & $v$ packets to `POST /api/telemetry` | Week 1–2 | Calibrated bench sensors + staging URL |
| **P1** | Execute Option A vs Option B dyno shootout & log first verified discovery calls + IPO Patent No. | Founder + Mentor (`Dr. Bhukya`) | Reviewed test runs scoring all 16 criteria, updated patent dossier, initial CRM discovery entries | Week 2–4 | Working calibrated test rig |
