# PAWAN SHAKTI — Row-Level Security & Permission Matrix Report (`Phase 2 / Phase 5`)

**Date:** 11 November 2026  
**Local Verification:** `VERIFIED` (Unit & SQL policy coverage tests pass in `tests/api_and_security.test.mjs`).  
**Live Postgres Verification:** **PENDING** (awaiting dedicated Supabase project creation & live JWT queries).

---

## 1. Verified RBAC & RLS Permission Matrix (All 6 Roles)

Source of truth: [`src/lib/authAndRbac.ts`](../src/lib/authAndRbac.ts), [`api/_lib/db.ts`](../api/_lib/db.ts), and `supabase/migrations/001`–`003`.

| Data Surface / Scope | `founder_super_admin` | `engineering_admin` | `crm_admin` | `team_member` | `external_reviewer` | `public_visitor` / `anon` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Public Marketing & Curated Resources (`is_public = true` / `visibility = 'public'`) | Read / Write | Read / Write | Read | Read | Read | Read Only |
| Engineering Workbench (`turbines`, `test_runs`, `telemetry`, `devices`, `option_comparisons`) | Read / Write | Read / Write | **Denied** | Read Only (`devices` secret excluded) | Read Only (`devices` denied) | Public rows only (`telemetry` denied) |
| ESP32 HMAC Key Minting & Revocation (`POST /api/telemetry`, `public.devices`) | Allowed | Allowed | **Denied (403)** | **Denied (403)** | **Denied (403)** | **Denied (401)** |
| CRM & Customer PII (`organizations`, `contacts`, `leads`, `site_assessments`, `pilot_applications`, `lead_activities`, `website_inquiries`) | Read / Write | **Denied (403)** | Read / Write | **Denied (403)** | **Denied (403)** | Write Public Intake (`POST /api/inquiries`) Only; **Read Denied (401)** |
| Financials, BOM, Quotations (`financial_scenarios`, `bom_items`, `quotations`) | Read / Write | BOM Read/Edit; **Scenarios/Quotes Denied** | **Denied (403)** | **Denied (403)** | **Denied (403)** | **Denied (401)** |
| Private Data Room (`visibility = 'private'` & Storage bucket `dataroom-private`) | Read / Write / Delete | Read / Write | **Denied (403)** | **Denied (403)** | Read Only | **Denied (401/403)** |
| Grants Tracker (`grants`, `grant_applications`) & Monthly Executive Reports | Read / Write | Read Only | Grants Read; Reports **Denied** | **Denied (403)** | Read Only | **Denied (401/403)** |
| Immutable Audit Logs (`public.audit_logs`) | Read Only | **Denied (403)** | **Denied (403)** | **Denied (403)** | **Denied (403)** | **Denied (401)** |
| Profile Role Assignment (`public.profiles.role`) | Founder / `service_role` Only | Blocked by Trigger | Blocked by Trigger | Blocked by Trigger | Blocked by Trigger | Blocked by Trigger |

---

## 2. Fail-Closed Guarantees Inspected

- Missing `public.profiles` row defaults to `'public_visitor'` in BOTH [`api/_lib/db.ts`](../api/_lib/db.ts) and [`src/pages/AdminPortalPage.tsx`](../src/pages/AdminPortalPage.tsx).
- `handle_new_auth_user()` assigns `'public_visitor'` on signup so uninvited registrations receive zero internal visibility.
- `AdminPortalPage.tsx` blocks authenticated `'public_visitor'` accounts with an explicit Unauthorized banner via `canAccessAdminRoute()`.
