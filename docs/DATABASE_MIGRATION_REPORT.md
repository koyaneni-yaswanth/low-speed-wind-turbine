# PAWAN SHAKTI — Database Migration Report (`Phase 2`)

**Date:** 11 November 2026  
**Live Remote Application Status:** **PENDING USER CONFIRMATION** (`pawan-shakti-platform` free-tier project creation awaiting user approval in org `uqxgagrkueaczfaauwpl`; existing project `xjhkxnfahkkgwbbtmhtk` is `yashwanth-hub` and untouched).

---

## 1. Migration Inventory (Ordered, Non-Destructive, Idempotent)

| Migration File | Tables / Objects Defined | Verified Local SQL & Unit Checks | Live Postgres Status |
|---|---|---|---|
| `supabase/migrations/001_pawan_shakti_platform.sql` (623 lines) | `pgcrypto`, `evidence_tier`, `user_role_type` enums, `current_user_role()`, **35 relational tables**, initial RLS enable (`ENABLE ROW LEVEL SECURITY`) on all 35 tables, core CRM/Financial/Telemetry/Public policies. | Audited line-by-line; `tests/api_and_security.test.mjs` asserts all tables exist & enable RLS. | **PENDING** |
| `supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql` (313 lines) | Extends domain columns (`turbines`, `devices`, `test_runs`, `leads`, `tasks`, `grants`, `grant_applications`), adds 36th table `public.device_errors`, operational indexes, `set_updated_at()` triggers, `prevent_profile_role_escalation()`, `handle_new_auth_user()` defaulting strictly to `'public_visitor'`, complete RLS policies across all 36 tables, idempotent structural seeds (`MARK-3/4/5/WORKING-1M2`, 16 `option_comparisons` criteria, 2025 Published Patent). | Audited line-by-line; `tests/api_and_security.test.mjs` verifies triggers, policies & fail-closed default role. | **PENDING** |
| `supabase/migrations/003_storage_buckets_and_policies.sql` (**Added in Phase 2 Prep**) | Provisions Storage buckets `public-docs` (`public = true`), `dataroom-private` (`public = false`), `telemetry-csvs` (`public = false`), plus least-privilege `storage.objects` policies scoped to `authenticated` + `public.current_user_role()` (omits broad public `SELECT` policy per Supabase Advisor `0025`). | Verified cleanly in `tests/api_and_security.test.mjs`. | **PENDING** |

---

## 2. Schema Integrity Verification Summary

- **Primary Keys & Foreign Keys:** All 36 tables use `uuid primary key default gen_random_uuid()` (or natural text PK on `roles` and `auth.users(id)` FK on `profiles`) with explicit `on delete cascade` / `on delete set null` referential constraints.
- **Unique Replay Constraint:** `public.telemetry` enforces `unique (device_id, device_timestamp, sequence_no)` to prevent duplicate ESP32 packet persistence.
- **Role Escalation Prevention:** `trg_profiles_no_escalation` blocks any authenticated non-`founder_super_admin` and non-`service_role` session from modifying `profiles.role`.
- **Execution Gate:** Migrations will be applied sequentially (`001` -> `002` -> `003`) to the newly approved `pawan-shakti-platform` database via `supabase_mcp -> apply_migration`, followed immediately by `list_tables` (`36` tables, `rls_enabled: true`) and `get_advisors(type: "security")`.
