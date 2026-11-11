# PAWAN SHAKTI — Production Release Checklist (`Phase 15 / 16`)

**Date:** 11 November 2026  
**Target:** `pawan-shakti-platform` (`prj_qAixqXLvh7Czpj2fj48hkfGXLQ9f`) -> Proposed Production Domain: `https://pawan-shakti.vercel.app/`  
**Overall Release Readiness:** **BLOCKED AT GATES B & PREVIEW**

---

## Mandatory Staging & Release Gate Sign-Off

- [x] GitHub repository `koyaneni-yaswanth/low-speed-wind-turbine` verified (`WORKING`)
- [x] Hardening fixes, API security (`413`/`415`/`403` CORS/`429`/`500` sanitized), and Vite route/WebP optimization consolidated on `feature/pawan-shakti-platform` (`WORKING`)
- [x] Separate Vercel project `pawan-shakti-platform` (`prj_qAixqXLvh7Czpj2fj48hkfGXLQ9f`, `Node 22.x`) created cleanly (`COMPLETED`)
- [x] Yashwanth Hub (`prj_0At1YSsFsDiRAfIqyEtj81hyCFTg` / `https://yashwanth-hub.vercel.app/` / Supabase `xjhkxnfahkkgwbbtmhtk`) verified completely isolated & untouched (`VERIFIED`)
- [ ] **Gate B:** User approval & provisioning of dedicated Supabase `pawan-shakti-platform` (`ap-south-1`, Free) (`PENDING USER APPROVAL`)
- [ ] Migrations `001`–`004` applied & catalog/advisors verified (`BLOCKED`)
- [ ] Live JWT RLS tests executed across all 6 roles + anon + device HMAC (`BLOCKED`)
- [ ] Vercel GitHub App linked OR Preview deployed via `npx vercel deploy` (`BLOCKED`)
- [ ] Preview Env Vars configured including user-entered `SUPABASE_SERVICE_ROLE_KEY` (`BLOCKED`)
- [ ] Live Staging `GET /api/health` returning HTTP `200`, Playwright desktop/tablet/mobile & CAD checks (`BLOCKED`)
- [ ] **Gate D:** Explicit Founder Approval after Preview QA (`HOLD`)
- [ ] **Gate E:** Explicit Domain verification & DNS approval for `https://pawan-shakti.vercel.app/` (`HOLD`)
