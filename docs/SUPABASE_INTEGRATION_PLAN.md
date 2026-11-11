# PAWAN SHAKTI — Supabase Integration Plan (`Phase 0 / Phase 2`)

**Date:** 11 November 2026  
**Verified Account State (Supabase MCP):**
- Organization: `koyaneni-yaswanth's Org` (`uqxgagrkueaczfaauwpl`, plan `free` / `tier_free`)
- Existing Project: `xjhkxnfahkkgwbbtmhtk` (`ap-northeast-1`) — contains unrelated `yashwanth-hub` tables (`public.conversations`, `public.conversation_members`, `public.messages`, `public.message_summaries`). **Strictly out of scope; must remain untouched.**
- Available Free Slot: 1 unused free-tier project slot in org `uqxgagrkueaczfaauwpl`.

---

## 1. Dedicated Project Provisioning Plan

1. **User Approval Gate:** Obtain founder confirmation to provision a new free-tier Supabase project:
   - Project Name: `pawan-shakti-platform`
   - Organization ID: `uqxgagrkueaczfaauwpl`
   - Region: `ap-south-1` (Mumbai, lowest latency for VNIT Nagpur / India pilot bench)
2. **Wait for Healthy Provisioning:** Poll `get_project` until `status === "ACTIVE_HEALTHY"`.
3. **Retrieve Credentials Safely:**
   - Retrieve `VITE_SUPABASE_URL` / `SUPABASE_URL` via `get_project_url`.
   - Retrieve `VITE_SUPABASE_ANON_KEY` (legacy anon JWT or active publishable key) via `get_publishable_keys`.
   - **`SUPABASE_SERVICE_ROLE_KEY` Protocol:** Because Supabase MCP intentionally omits `service_role` secret keys, instruct the user to copy `service_role` from Supabase Dashboard (`Settings -> API`) directly into Vercel Project Environment Variables and local `.env.local` (never pasted in chat or frontend code).

---

## 2. Controlled Migration Sequence (`001` -> `002` -> `003`)

All migrations are non-destructive and idempotent:

1. **`001_pawan_shakti_platform.sql`:** Extensions (`pgcrypto`), enums (`evidence_tier`, `user_role_type`), `current_user_role()` `SECURITY DEFINER`, 35 tables across Auth/CRM/Engineering/Telemetry/IP/Financials/Grants/Audit, initial `ENABLE ROW LEVEL SECURITY` on all 35 tables, core policies.
2. **`002_pawan_shakti_hardening_and_completeness.sql`:** Extends domain columns, creates `device_errors` (36th table) with RLS, adds indexes, `set_updated_at()`, `prevent_profile_role_escalation()`, `handle_new_auth_user()` (`'public_visitor'` default), completes RLS policies across all 36 tables, and seeds structural baseline (`MARK-3/4/5/WORKING-1M2`, 16 Option A/B rows, Published IPO Patent record — zero synthetic commercial or sensor rows).
3. **`003_storage_buckets_and_policies.sql` (Added in Phase 2 Prep):**
   - Creates `public-docs` bucket (`public = true`) for public technical briefs/drawings.
   - Creates `dataroom-private` bucket (`public = false`) for confidential agreements, grants, and unredacted filings (`founder_super_admin`, `engineering_admin`, `external_reviewer` SELECT; founder/engineering INSERT/UPDATE/DELETE).
   - Creates `telemetry-csvs` bucket (`public = false`) for raw bench CSV datasets (`founder_super_admin`, `engineering_admin`, `team_member` SELECT; founder/engineering INSERT).

---

## 3. Authentication & URL Redirect Configuration

Once live Supabase Auth URL is provisioned and Vercel Staging URL is known:
- **Site URL:** Deployed Staging/Production URL (`VITE_APP_URL`, e.g. `https://pawan-shakti-platform-*.vercel.app`).
- **Redirect URLs:**
  - `http://localhost:5174/admin`
  - `http://127.0.0.1:4174/admin`
  - `https://<staging-domain>/admin`
- **Auth Flows Verified in UI (`src/pages/AdminPortalPage.tsx`):**
  - Sign up (`auth.signUp`, assigns `public_visitor` role fail-closed)
  - Sign in (`auth.signInWithPassword`)
  - Password reset (`resetPasswordForEmail` + `PASSWORD_RECOVERY` state `updateUser({ password })`)
  - Session persistence (`getSession()` + `onAuthStateChange()`)
  - Explicit Unauthorized screen for authenticated `public_visitor` users + session expiration notice on unexpected sign-out.
- **Founder Elevation:** Manually promote `koyaneniyaswanth@gmail.com` after first Sign Up via controlled SQL (`UPDATE public.profiles SET role = 'founder_super_admin' WHERE email = ...`) as service role / SQL Editor.

---

## 4. Post-Migration Security Verification (`get_advisors` + Live RLS Matrix)

1. Run `supabase_mcp -> get_advisors(type: "security")` and `list_tables` (`36` tables, every table confirming `rls_enabled: true`).
2. Test actual HTTP/JWT requests across: Unauthenticated (`anon`), `public_visitor`, `team_member`, `crm_admin`, `engineering_admin`, `external_reviewer`, and `founder_super_admin` — verifying both expected `200/201` allows and `401/403` denials.
