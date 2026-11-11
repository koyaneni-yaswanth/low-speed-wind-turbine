# PAWAN SHAKTI — Supabase Setup Report (`Phase 2`)

**Date:** 11 November 2026  
**Overall Phase Status:** **BLOCKED (Awaiting User Approval Gate)**

---

## 1. Observed Account Inspection (via `supabase_mcp`)

- **Organization:** `koyaneni-yaswanth's Org` (`id: uqxgagrkueaczfaauwpl`, `plan: free`, `tier: tier_free`)
- **Existing Project (`xjhkxnfahkkgwbbtmhtk`, region `ap-northeast-1`):**
  - Inspected `public` schema via `list_tables`: contains `conversations`, `conversation_members`, `messages`, `message_summaries`.
  - Confirmed this project belongs to the separate **`yashwanth-hub`** application and MUST NOT be altered or reused for Pawan Shakti.
- **Free-Tier Capacity:** 1 of 2 free project slots is in use; 1 unused free-tier (`$0`) project slot is available in `uqxgagrkueaczfaauwpl`.

---

## 2. Exact Action Required to Unblock Live Provisioning

Per Supabase project creation rules and release gate policy:
1. User confirms creating a dedicated Free-Tier project named **`pawan-shakti-platform`** in organization **`koyaneni-yaswanth's Org`** (`uqxgagrkueaczfaauwpl`), region **`ap-south-1`** (Mumbai).
2. Immediately upon confirmation, the agent will create the project via `supabase_mcp -> create_project`, wait until `ACTIVE_HEALTHY`, apply migrations `001`, `002`, and `003`, run `get_advisors`, retrieve `SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`, and instruct the user where to enter the private `SUPABASE_SERVICE_ROLE_KEY` in Vercel Project Settings (since MCP does not expose `service_role` keys).
