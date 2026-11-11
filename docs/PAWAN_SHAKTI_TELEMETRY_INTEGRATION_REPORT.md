# PAWAN SHAKTI — Telemetry & Hardware Safety Report (`Phase 9 / 10 / 13 / 18`)

**Date:** 11 November 2026  
**Physical Hardware Link Status:** **DISCONNECTED — `NO LIVE TELEMETRY CONNECTED`**  
**API Pipeline Status:** `WORKING` (Unit/Security Tested locally) | `BLOCKED` (Live Cloud DB & Physical Bench Rig pending)

---

## 1. Ingestion & Real-Time Pipeline (`api/telemetry.ts` & `EngineeringWorkbenchTab.tsx`)

- **Authentication & Replay Guard:** Hardware sends `POST /api/telemetry` with `X-Device-Id`, `X-Device-Timestamp` (`+/-300s`), `X-Device-Nonce`, and `X-Device-Signature` (`HMAC-SHA256`), bounded by `32,768` byte payload cap (`413` rejection), `180 req/min` sliding rate limit (`429`), device revocation check (`403`), unique `(device_id, device_timestamp, sequence_no)` dedupe (`200`), and `public.device_errors` audit logging.
- **Physical Safety Boundary:** Zero endpoints exist to actuate rotor start, mechanical brake release, yaw, pitch, or overspeed overrides.
- **Hydration & Realtime:** `mapDbTelemetryRow()` and `mapDbTurbineRow()` map Postgres rows into UI models cleanly; Supabase Realtime (`postgres_changes` `INSERT` on `public.telemetry`) streams live packets once connected.
- **Storage Capacity Estimate:** At `1 Hz` (`~250 B/row` net telemetry + index overhead `~400 B/row`), continuous logging generates `~34.5 MB/day` (`~1.03 GB/month`). Therefore, continuous high-frequency logging must record strictly during bounded bench test runs or add a scheduled retention/downsampling rollup before 24/7 field rollout so the Supabase Free Tier (`500 MB` DB limit) is never exhausted.

---

## 2. Scientific Data Discipline

- **TRL Maturity:** Remains **TRL 4** (Mark-3/4/5 laboratory prototypes).
- **Patent Status:** Published Indian Patent Application (*"Compact Wind Turbine with Planetary Gears"*, 2025) — **Under Examination (NOT GRANTED)**.
- **Mark-4 `36.25 W @ 4.5 m/s` Reconciliation Flag:** For swept area `0.283 m²` at `4.5 m/s` (`rho = 1.225`), total freestream wind power is `15.80 W` and theoretical Betz ceiling (`16/27`) is `~9.36 W`. Therefore `36.25 W` exceeds physical wind stream kinetic limit and remains quarantined under `HISTORICAL / UNVERIFIED` until re-tested with calibrated synchronous closed-loop 1 Hz instrumentation.
- **UI Classification:** Charts and KPI cards distinguish `MEASURED`, `CALCULATED`, `SIMULATED`, `DESIGN TARGET`, and `HISTORICAL / UNVERIFIED`.
