# PAWAN SHAKTI — Cloud Infrastructure Access & Approval Report (`Phase 0 / Phase 18`)

**Date:** 11 November 2026  
**Status Key:** `WORKING` | `PARTIAL` | `BLOCKED` | `NOT IMPLEMENTED` | `VERIFIED IN PREVIEW` | `VERIFIED IN PRODUCTION`

---

## 1. Vercel Integration Status

| Property | Verified State | Status |
|---|---|---:|
| **Authenticated Vercel Account** | `koyaneniyaswanth@gmail.com` (`id: dyeIYVbHnH4yGCMgQJVCmZrJ`, `username: koyaneniyaswanth-9270`) | `WORKING` |
| **Target Vercel Team ID** | `team_myMRm7riJMuO0Io96f19pH1p` (`koyaneniyaswanth-9270s-projects`, Hobby) | `WORKING` |
| **Project Listing & Deploy Scope** | Returns `HTTP 403 forbidden` until team consent request (`authorize_team_access`) is approved in browser. | `BLOCKED` |
| **Existing Yashwanth Hub Project (Protected)** | `yashwanth-hub` (`prj_0At1YSsFsDiRAfIqyEtj81hyCFTg` at `https://yashwanth-hub.vercel.app/`) — confirmed isolated & untouched. | `VERIFIED IN PRODUCTION` *(Separate App)* |
| **Target Dedicated Pawan Shakti Project** | `pawan-shakti-platform` (`koyaneni-yaswanth/low-speed-wind-turbine` branch `feature/pawan-shakti-platform`) | `BLOCKED` |

---

## 2. Supabase Organization & Project Inventory

| Property | Verified State | Status |
|---|---|---:|
| **Supabase Organization** | `koyaneni-yaswanth's Org` (`id: uqxgagrkueaczfaauwpl`, `plan: free`, `tier: tier_free`, release channels `["ga","preview"]`) | `WORKING` |
| **Existing Project Inventory** | `1` active project: `xjhkxnfahkkgwbbtmhtk` (`"koyaneni-yaswanth's Project"`, region `ap-northeast-1`, `ACTIVE_HEALTHY`, Postgres `17.6.1.121`) — houses `yashwanth-hub` (`conversations`, `messages`, etc.). Untouched. | `WORKING` |
| **Target Dedicated Project (`pawan-shakti-platform`)** | Not yet created (`list_projects` confirms 0 matching project; `1` free project slot unused on `uqxgagrkueaczfaauwpl`). | `BLOCKED` |
| **Preferred Region & Plan** | `ap-south-1` (Mumbai), `Free Tier` (`$0`, zero paid add-ons) | `BLOCKED` *(User Approval Required)* |

---

## 3. Exact User Actions Required to Unblock Provisioning

1. **Approve Vercel Team Access Consent** via the active single-use link (10-minute window) provided in this response.
2. **Explicitly Confirm Creating Supabase Project `pawan-shakti-platform`** (`ap-south-1`, Free Tier) inside `koyaneni-yaswanth's Org` (`uqxgagrkueaczfaauwpl`), preserving `xjhkxnfahkkgwbbtmhtk` untouched.
3. **Post-Provisioning Secret Entry:** Once created, paste `SUPABASE_SERVICE_ROLE_KEY` directly in Vercel Project Settings -> `pawan-shakti-platform` Environment Variables (Supabase MCP intentionally omits `service_role` keys).
