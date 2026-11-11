# PAWAN SHAKTI — Security, Safety & Privacy Audit (`Phase 5`)

**Date:** 11 November 2026  
**Verified Commit Baseline:** `2eaa4062b283c3f503e60ef4f4e8f455fd0a4ef7`  
**Status Key:** `WORKING` | `PARTIAL` | `BLOCKED` | `NOT IMPLEMENTED` | `VERIFIED IN PRODUCTION`

---

## 1. Security Controls & Verification Matrix

| Security Control | Status | Verification Evidence & Technical Notes |
|---|:---:|---|
| **Client/Server Secret Isolation** | `WORKING` | `tests/api_and_security.test.mjs` verifies zero references to `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `DEVICE_HMAC_MASTER_SALT` in `src/`. Only `.env.example` tracked in Git (`0` `.env` secrets committed). |
| **PostgreSQL Row-Level Security (36 Tables + 3 Buckets)** | `PARTIAL` | `001` (35 tables) + `002` (`device_errors` = 36 tables, `prevent_profile_role_escalation()`, `handle_new_auth_user()` -> `'public_visitor'`) + `003` (`storage.objects` role-scoped policies omitting Advisor `0025` broad public `SELECT`). Live Postgres JWT enforcement = `BLOCKED` pending DB creation. |
| **Fail-Closed Auth & Unauthorized Route Gating** | `WORKING` (Local) / `BLOCKED` (Cloud) | `AdminPortalPage.tsx` uses `canAccessAdminRoute(authenticatedRole)`, blocks signed-in `'public_visitor'` users, supports `signUp`, `signInWithPassword`, `resetPasswordForEmail`, `PASSWORD_RECOVERY`, and expiry warnings. Server routes enforce `401`/`403` via Supabase JWT. |
| **Telemetry HMAC-SHA256 & Anti-Control Boundary** | `WORKING` | `api/telemetry.ts` enforces `X-Device-Id`, `X-Device-Timestamp` (`+/-300s`), `timingSafeEqual` HMAC-SHA256, unique `(device_id, device_timestamp, sequence_no)` replay dedupe, `device_errors` logging, `180 req/min` rate limit, revoked device blocking (`403`), and zero actuation endpoints. |
| **Safe Server Error Sanitization (`safeServerError`)** | `WORKING` | Verified in `api/_lib/db.ts` and `tests/api_and_security.test.mjs` (`500` returns `'Internal server database operation failed.'`, logging detail internally). |
| **Public Asset & PII Protection** | `WORKING` | `scripts/sync-repo-assets.mjs` strips `.docx`, `z-lib`, and `*Pre - Incubation*` agreements; `/api/analytics` rejects PII keys (`400`); `/api/inquiries` uses honeypot, Zod schema, `escapeHtml()`, duplicate `409` guard, and `20 req/min` IP rate limit. |
| **Dependency Vulnerability Hygiene** | `WORKING` | `npm audit` reports `0` vulnerabilities (`zod` pinned at `^4.6.7`). |
| **Phase 6 API Hardening (CORS, Payload Limits, Rate Limits, Request IDs)** | `WORKING` (Local) | Added `applyCors()` (`403` blocked foreign origin, `OPTIONS` `204`), `parseJsonBody()` byte caps (`413` above `32 KB` telemetry / `64–128 KB`), rate limiting across `/api/inquiries`, `/api/telemetry`, `/api/admin`, `/api/analytics`, `/api/notifications`, and `X-Request-Id` tracing (`21/21` unit tests pass). |

---

## 2. Physical Hardware Safety Boundary (Non-Negotiable)

- Zero endpoints exist to engage/release mechanical brakes, start/stop rotors, actuate yaw, or alter generator load relays remotely.
- `turbines.safety_status` remains `'monitoring_only_no_remote_actuation'` and `brake_state` is strictly an observational telemetry field.
