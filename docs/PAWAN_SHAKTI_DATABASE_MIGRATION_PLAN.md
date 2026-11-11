# PAWAN SHAKTI — Database Migration & Hardening Plan (`Phase 4`)

**Date:** 11 November 2026  
**Target Database:** `pawan-shakti-platform` (`ap-south-1`, org `uqxgagrkueaczfaauwpl`) — currently `PENDING USER APPROVAL` (Gate B).  
**Existing Protected DB:** `xjhkxnfahkkgwbbtmhtk` (`yashwanth-hub`, untouched).

---

## 1. Audited Migration Execution Order

| Order | File | Purpose & Objects | Destructive Ops | Reversibility | Execution Status |
|---:|---|---|---:|---|---|
| `1` | `001_pawan_shakti_platform.sql` | `pgcrypto`, `evidence_tier` & `user_role_type` enums, `current_user_role()` (`SECURITY DEFINER`, `search_path = public`), **35 tables**, `ENABLE ROW LEVEL SECURITY` on all 35 tables, initial policies. | None (`CREATE IF NOT EXISTS`) | Additive | `PENDING` (Awaiting Gate B) |
| `2` | `002_pawan_shakti_hardening_and_completeness.sql` | Extends domain columns, adds 36th table `public.device_errors`, operational indexes, `set_updated_at()`, `prevent_profile_role_escalation()`, `handle_new_auth_user()` defaulting strictly to `'public_visitor'`, completes RLS policies across all 36 tables, idempotent structural baseline seeds (`MARK-3/4/5/WORKING-1M2`, 16 criteria, Published Patent). | None (idempotent `DROP TRIGGER/POLICY IF EXISTS` recreates) | Additive | `PENDING` |
| `3` | `003_storage_buckets_and_policies.sql` | Creates buckets `public-docs` (`public=true`), `dataroom-private` (`public=false`), `telemetry-csvs` (`public=false`) and least-privilege `storage.objects` policies (avoids Advisor `0025` broad public `SELECT` listing). | None (`on conflict (id) do nothing`) | Additive | `PENDING` |
| `4` | `004_schema_advisor_hardening.sql` | Pins `SET search_path = public` on `set_updated_at()` (fixes Advisor `0011`), adds `fk_pilot_projects_turbine` foreign key on `pilot_projects.turbine_uuid -> turbines(id)`, adds 20 B-tree indexes across all relational FKs (fixes Advisor `0001`), adds `founder_super_admin` delete policy on `telemetry-csvs`. | None (additive FK/indexes) | Safe `DROP INDEX` / `DROP CONSTRAINT` | `PENDING` |

---

## 2. Phase 4 Security Audit Checklist Results

- **Destructive SQL Statements:** Zero `DROP TABLE`, `TRUNCATE`, or data `DELETE` statements across `001`–`004`.
- **SECURITY DEFINER & Search Path Check:** `current_user_role()`, `prevent_profile_role_escalation()`, `handle_new_auth_user()`, and now `set_updated_at()` (`004`) ALL pin `set search_path = public`.
- **Table & RLS Coverage:** Confirmed `36` relational tables (`35` in `001` + `device_errors` in `002`), all `36` explicitly enable RLS and define role-scoped policies, plus role-scoped policies across 3 Storage buckets (`003` + `004`).
- **Missing FK / Index Audit Remediation:** Identified unindexed FKs and missing FK on `pilot_projects.turbine_uuid`; remediated additively in `004_schema_advisor_hardening.sql`.
