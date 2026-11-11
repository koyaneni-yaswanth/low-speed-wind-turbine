# PAWAN SHAKTI — Database & RLS Security Audit Report (`Phase 3 / Phase 5 / Phase 18`)

**Date:** 11 November 2026  
**Dedicated Target Supabase Project:** `pawan-shakti-platform` (`ap-south-1`, org `uqxgagrkueaczfaauwpl`)  
**Existing Protected Project:** `xjhkxnfahkkgwbbtmhtk` (`yashwanth-hub`, untouched)  
**Status Key:** `WORKING` | `PARTIAL` | `BLOCKED` | `NOT IMPLEMENTED` | `VERIFIED IN PREVIEW` | `VERIFIED IN PRODUCTION`

---

## 1. Migration Execution Plan & Inventory (`supabase/migrations/`)

| Version | Filename | Purpose & Objects Created | Reversibility | Remote Status |
|---|---|---|---|---|
| `001` | `001_pawan_shakti_platform.sql` (`23,641` B) | Core enums (`evidence_tier`, `user_role_type`), `current_user_role()`, **35 tables** across Profiles/Roles/CRM/Turbines/Telemetry/Test Runs/BOM/Grants/Audit, initial `ENABLE ROW LEVEL SECURITY` on 35 tables, core CRM/Financial/Telemetry policies. | Additive `CREATE IF NOT EXISTS` (safe) | `BLOCKED` *(Awaiting project creation)* |
| `002` | `002_pawan_shakti_hardening_and_completeness.sql` (`19,118` B) | Adds domain columns, creates **36th table** `device_errors`, operational indexes, `set_updated_at()`, `prevent_profile_role_escalation()`, `handle_new_auth_user()` defaulting strictly to `'public_visitor'`, completes RLS policies across all 36 tables, adds idempotent structural seeds (`MARK-3/4/5/WORKING-1M2`, 16 Option A/B rows, Published Patent). | Additive `ALTER ADD IF NOT EXISTS` / `CREATE OR REPLACE` (safe) | `BLOCKED` |
| `003` | `003_storage_buckets_and_policies.sql` (`4,542` B) | Creates Storage buckets `public-docs` (`public=true`), `dataroom-private` (`public=false`), `telemetry-csvs` (`public=false`) and role-scoped `storage.objects` policies (no broad `SELECT` on public bucket per Advisor `0025`). | Idempotent `on conflict (id) do nothing` (safe) | `BLOCKED` |

---

## 2. Role Mapping Across Required Functional Roles (`Phase 4 & 5`)

| Prompt Role Nomenclature | Schema Enum (`public.user_role_type`) | Table & Endpoint Access Summary |
|---|---|---|
| **Founder / Super Admin** | `founder_super_admin` | Full read/write governance, audit logs, financials, grant writes, role updates. |
| **Administrator (Domain)** | `engineering_admin` / `crm_admin` | Scoped exclusively to Engineering/Telemetry (`engineering_admin`) OR CRM/Leads (`crm_admin`). |
| **Engineering** | `engineering_admin` / `team_member` | Engineering tables & telemetry read; write restricted to `engineering_admin`; Financials & CRM PII **denied**. |
| **Business Development** | `crm_admin` | CRM orgs/contacts/leads/assessments/activities; denied Financials & Audit Logs. |
| **Research / External Reviewer** | `team_member` / `external_reviewer` | Read curated test runs, Option A/B, and public/data-room docs (`external_reviewer`); denied edits & CRM PII. |
| **Viewer / Public** | `public_visitor` (`anon`) | Public pages, public specs, and `POST /api/inquiries` / `POST /api/analytics` intake only; denied `/admin` & private tables. |

---

## 3. Live Postgres & JWT RLS Verification Checklist (`BLOCKED` until Provisioning)

1. Apply `001` -> `002` -> `003` cleanly via `supabase_mcp -> apply_migration`.
2. Verify catalog via `list_tables` (`36` tables in `public`, `rls_enabled = true` on all `36`) + `get_advisors(type: "security")`.
3. Run live HTTP/JWT tests across `anon`, `public_visitor`, `team_member`, `crm_admin`, `engineering_admin`, `external_reviewer`, `founder_super_admin`, and `X-Device-Id` device identity confirming zero unauthorized reads/writes or profile role self-escalation.
