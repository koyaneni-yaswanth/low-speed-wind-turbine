# PAWAN SHAKTI — Release Gate & Rollback Governance Report (`Phase 15 / 16 / 17 / 18`)

**Date:** 11 November 2026  
**Source Branch:** `feature/pawan-shakti-platform` (`2eaa406`) + Hardening Branch `chore/deployment-hardening`  
**Status Key:** `WORKING` | `PARTIAL` | `BLOCKED` | `NOT IMPLEMENTED` | `VERIFIED IN PREVIEW` | `VERIFIED IN PRODUCTION`

---

## 1. Staging Release Gate Status (`Phase 15`)

- [x] **Repository & Isolation Confirmed:** `koyaneni-yaswanth/low-speed-wind-turbine` isolated cleanly from `yashwanth-hub` (`WORKING`).
- [x] **Local Build, QA, E2E & Security Scans:** TypeScript, `oxlint`, `21/21` tests, Vite build, and Playwright local checks (`WORKING`).
- [ ] **Vercel Team Authorization (`team_myMRm7riJMuO0Io96f19pH1p`):** `BLOCKED` (awaiting consent click).
- [ ] **Dedicated Supabase Project (`pawan-shakti-platform`, `ap-south-1`):** `BLOCKED` (awaiting user creation approval).
- [ ] **Migrations `001`–`003` Applied & Live JWT RLS Verified:** `BLOCKED`.
- [ ] **Preview URL Live QA & Security Header Check:** `BLOCKED`.
- [ ] **Explicit Founder Production Release Approval (`https://pawan-shakti.vercel.app/`):** **HOLD** until all Preview gates are `VERIFIED IN PREVIEW`.

---

## 2. Backup, Credential Rotation & Rollback Procedure (`Phase 17`)

1. **Instant Deployment Rollback:** In Vercel Project `pawan-shakti-platform` -> Deployments -> select the prior verified Ready deployment -> **Instant Rollback**. Never modify `prj_0At1YSsFsDiRAfIqyEtj81hyCFTg` (`yashwanth-hub`).
2. **Database Safety & Recovery:** Apply strictly additive migrations (`001`, `002`, `003`); export periodic SQL snapshots via `pg_dump` / Supabase backups before future schema changes.
3. **Credential & Device Key Rotation:** Rotate `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY` in Supabase Dashboard -> Settings -> API and mirror immediately to Vercel `pawan-shakti-platform` Env Vars; revoke compromised ESP32 devices instantly via `POST /api/telemetry { action: "revoke_device", deviceUid }` (`403` immediate lock) and re-mint new one-time keys (`ps_dev_*`).
