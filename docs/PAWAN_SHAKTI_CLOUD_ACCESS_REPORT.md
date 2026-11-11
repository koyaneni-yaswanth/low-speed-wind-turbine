# PAWAN SHAKTI — Cloud Access & Infrastructure Authorization Report

**Date:** 11 November 2026  
**Status Categories:** `COMPLETED` | `VERIFIED` | `BLOCKED` | `PENDING USER APPROVAL` | `FAILED` | `NOT APPLICABLE`

---

## 1. Vercel Integration Status

| Property | Verified State | Status |
|---|---|---:|
| **Team Access Consent (`team_myMRm7riJMuO0Io96f19pH1p`)** | Approved in browser (`koyaneniyaswanth-9270s-projects`). `list_projects` succeeds and returns 4 existing projects + newly created project. | `VERIFIED` |
| **Protected Yashwanth Hub Isolation** | `yashwanth-hub` (`prj_0At1YSsFsDiRAfIqyEtj81hyCFTg` / `https://yashwanth-hub.vercel.app/`) confirmed untouched. | `VERIFIED` |
| **Dedicated Project Created (`pawan-shakti-platform`)** | Created via Vercel MCP (`id: prj_qAixqXLvh7Czpj2fj48hkfGXLQ9f`, framework `vite`, `nodeVersion: 22.x`, `buildCommand: npm run build`, `installCommand: npm install`, `outputDirectory: dist`). | `COMPLETED` |
| **GitHub Auto-Deploy Link (`koyaneni-yaswanth/low-speed-wind-turbine`)** | `create_git_project` returned HTTP `400`: `"To link a GitHub repository, you need to install the GitHub integration first."` `git_namespaces` returned `[]`. | `BLOCKED` |

---

## 2. Supabase Organization & Provisioning Status

| Property | Verified State | Status |
|---|---|---:|
| **Supabase Organization** | `koyaneni-yaswanth's Org` (`id: uqxgagrkueaczfaauwpl`, `plan: free`, `tier: tier_free`). | `VERIFIED` |
| **Protected Yashwanth Hub Project** | `xjhkxnfahkkgwbbtmhtk` (`ap-northeast-1`, `ACTIVE_HEALTHY`) verified untouched. | `VERIFIED` |
| **Target Dedicated Supabase Project (`pawan-shakti-platform`)** | Confirmed not yet created (`0` matching project). Target: `ap-south-1` (Mumbai), `Free` tier. | `PENDING USER APPROVAL` *(Gate B)* |
