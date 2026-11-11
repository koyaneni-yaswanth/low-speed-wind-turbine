# PAWAN SHAKTI — Final Execution Baseline (`Phase 0 Discovery`)

**Date:** 11 November 2026  
**Repository Root:** `C:\Users\recvn\Desktop\yashwanth-hub\low-speed-wind-turbine`  
**GitHub Origin:** `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine.git`  
**Active Branch:** `feature/pawan-shakti-platform` (hardening branch `chore/deployment-hardening` fast-forwarded and merged cleanly)

---

## 1. Repository & Toolchain Verification

- **Git State:** `feature/pawan-shakti-platform` contains `0cf849a7889c4bb035f2f46fb3e722be28cb762c` on both local `HEAD` and remote `origin/feature/pawan-shakti-platform` (`git ls-remote origin`), plus local hardening commit `01bf761f8f823546851f98fbde97d91ca7be4e43` (`Content-Type: 415`, `ALLOWED_ORIGINS`, `/api/health` diagnostic breakdown) and additive migration `004_schema_advisor_hardening.sql`. `main` remains untouched at `66e3e4e`.
- **Node & Package Scripts:** Node `v22.23.4`, npm `10.9.9`; `package.json` defines `sync-assets`, `predev`, `dev`, `prebuild`, `build` (`tsc -b && vite build`), `preview`, `lint` (`oxlint`), `test` (`node --experimental-strip-types --test tests/*.test.mjs tests/*.test.ts`).
- **Protected Assets Integrity (`70` files from `66e3e4e`):** Zero original engineering, CAD (`.f3d`, `.step`, `.stl`, `.3mf`), S1223 airfoil coordinates, prototype media, IP, or test records lost. Zero `.env` secrets committed. Zero Yashwanth Hub code inside this repository.
- **Database Config & Migrations (`supabase/`):** No `supabase/config.toml`; `supabase/migrations/` contains 4 ordered SQL files:
  1. `001_pawan_shakti_platform.sql` (`23,641` B, 35 tables)
  2. `002_pawan_shakti_hardening_and_completeness.sql` (`19,118` B, 36th table `device_errors`, complete RLS, triggers)
  3. `003_storage_buckets_and_policies.sql` (`4,542` B, 3 buckets + `storage.objects` RLS policies)
  4. `004_schema_advisor_hardening.sql` (Search path fix on `set_updated_at()`, FK on `pilot_projects.turbine_uuid`, 20 FK indexes, storage delete policy)

---

## 2. Cloud Resource Inventory (`Verified via MCP`)

- **Vercel Team (`team_myMRm7riJMuO0Io96f19pH1p`):**
  - Existing untouched projects: `yashwanth-hub` (`prj_0At1YSsFsDiRAfIqyEtj81hyCFTg`), `ros2_robotics_course-1`, `ros2_robotics_course`, `villagemart`.
  - Newly created isolated target project: **`pawan-shakti-platform`** (`prj_qAixqXLvh7Czpj2fj48hkfGXLQ9f`, Vite, Node `22.x`).
- **Supabase Org (`uqxgagrkueaczfaauwpl`, Free Tier):**
  - Existing untouched project: `xjhkxnfahkkgwbbtmhtk` (`ap-northeast-1`, `ACTIVE_HEALTHY`, `yashwanth-hub`).
  - Target `pawan-shakti-platform` (`ap-south-1`, Free Tier): **Awaiting Gate B Approval**.

---

## 3. Environment Variable Inventory (Names Only from `.env.example` & Code)

- Client-safe (`VITE_*`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
- Server-only: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEVICE_HMAC_MASTER_SALT`, `ALLOWED_ORIGINS` (optional comma-separated origins), `VERCEL_URL` (auto-provided by Vercel), `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`, `ADMIN_ALERT_EMAIL`

---

## 4. Outstanding Blockers & Next Safe Actions

1. **Gate B (`PENDING USER APPROVAL`):** Explicit confirmation to create Free-tier Supabase project `pawan-shakti-platform` in `ap-south-1` (Mumbai) inside `koyaneni-yaswanth's Org`.
2. **GitHub Integration / Preview Push (`BLOCKED`):** Install Vercel GitHub App for `koyaneni-yaswanth/low-speed-wind-turbine` in Vercel Dashboard **OR** run interactive `git push origin feature/pawan-shakti-platform` & `npx vercel deploy` locally (large multi-MB CAD/PNG files cannot be base64-inlined inside single-turn MCP payloads).
3. **Production Gate D (`HOLD`):** Only promote to Production after Preview & live Supabase checks pass.
