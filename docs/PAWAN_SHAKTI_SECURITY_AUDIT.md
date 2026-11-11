# PAWAN SHAKTI — Security, Safety & Privacy Audit (`Phase 0`)

## 1. Security Threat Model & Controls

| Threat Vector | Mitigation Design | Verification Requirement |
| :--- | :--- | :--- |
| **Unauthorized Access to Admin / CRM / Financials** | Supabase Auth JWT validation on `/api/admin`, `/api/inquiries` (GET/PATCH), and `/api/telemetry` (private read/upload) + least-privilege PostgreSQL RLS | Automated tests verifying `401 Unauthorized` & `403 Forbidden` for anonymous/wrong-role tokens |
| **Privilege Escalation Across Roles** | Explicit 6-role RBAC: `founder_super_admin`, `engineering_admin`, `crm_admin`, `team_member`, `external_reviewer`, `public_visitor`. `team_member` cannot view CRM PII or restricted financial models | RBAC permission matrix unit test covering every role x table operation |
| **Exposed Secrets in Frontend Bundle** | Strict separation: ONLY `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` allowed in `src/`; `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and device secrets strictly server-side | Regex secret hygiene test scanning built `dist/` and `src/` |
| **Telemetry Spoofing / Replay Attacks** | Device ingestion (`/api/telemetry`) requires `X-Device-Id`, `X-Device-Timestamp` (<=300s skew), unique `(device_id, timestamp, sequence_no)`, and `HMAC-SHA256` verification against server-side hashed device keys | Unit/API test checking tampered HMAC, stale timestamp, malformed units, and duplicate replay rejection |
| **Public Form Spam & XSS/Injection** | Zod schema validation on client + server, honeypot hidden field, payload size caps, rate limiting headers/tracking, React safe rendering (no `dangerouslySetInnerHTML`) | Negative input & injection fuzz tests on `/api/inquiries` |
| **Sensitive Legal / PII Document Exposure** | Asset sync script `sync-repo-assets.mjs` excludes `.docx` and any agreement files matching `*Pre - Incubation*`; Private Data Room items require `visibility = 'private'` + role check | Automated check verifying zero PII docs in `public/repo-assets/` |
| **Fake Connected / Success States** | Missing cloud credentials yield honest HTTP `503` diagnostic states and explicit UI setup banners — never simulated `200 OK` form or email receipts | Integration tests running against unconfigured env verifying `503` & non-simulated notifications |

---

## 2. Physical Hardware Safety Boundary (Non-Negotiable)

- **Zero Remote Control Surfaces:** Neither the public website nor the authenticated engineering dashboard implements remote turbine start, brake release, yaw actuation, or pitch override commands.
- **Monitoring Only:** `brake_state`, `fault_code`, `temperature`, and overspeed indicators are strictly **read-only telemetry observability fields** until an independently reviewed safety controller architecture is approved.
- **No Unverified Safety Certifications:** Website never claims IEC 61400-2 certification, IP65 storm certification, or utility grid-tie compliance.

---

## 3. Dated Security Hardening Verification Update (11 November 2026)

| Security Control / Remediation | Classification | Concrete Verification |
| :--- | :---: | :--- |
| **Dependency Audit (`zod` upgraded to `>= 4.6.7`)** | **Implemented & Locally Tested** | Fixed `GHSA-mrhx-c7xc-m3w5` (`zod < 4.6.6` high memory exhaustion). `npm audit` reports **`0` vulnerabilities**. |
| **Fail-Closed Default Profile Role (`public_visitor`)** | **Implemented & Locally Tested** | Fixed `api/_lib/db.ts` & `src/pages/AdminPortalPage.tsx` so missing `public.profiles` rows fail closed to `'public_visitor'` instead of `'team_member'`. |
| **Full 36-Table RLS & Escalation Triggers (`002`)** | **Implemented & SQL-Checked** | Closed RLS policy gaps on all 36 tables; added `prevent_profile_role_escalation()` and `handle_new_auth_user()`. Live Postgres RLS = **NOT VERIFIED** pending Supabase setup. |
| **Rate Limiting, Safe JSON Parsing & HTML Escaping** | **Implemented & Locally Tested** | Added `parseJsonBody()` (`400` on bad JSON), `escapeHtml()` in inquiry emails, duplicate active pilot rejection (`409`), sliding-window rate limits (`429`), zero-PII enforcement on `/api/analytics`, and telemetry error persistence (`device_errors`). |

