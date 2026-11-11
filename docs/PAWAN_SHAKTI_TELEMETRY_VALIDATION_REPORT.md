# PAWAN SHAKTI — Telemetry Validation & Safety Report (`Phase 7 / 14`)

**Date:** 11 November 2026  
**Live Physical Hardware:** **DISCONNECTED (`NO LIVE TELEMETRY CONNECTED`)**  
**Scientific Maturity:** **TRL 4** (Indian Patent Published / Under Examination — **NOT GRANTED**; Option A vs Option B Freeze **OPEN**)

---

## 1. Audited Telemetry Capabilities (`WORKING` Locally | `BLOCKED` Live Cloud/Hardware)

| Capability | Status | Inspected Implementation & Test Proof |
|---|:---:|---|
| **Device Auth (`HMAC-SHA256`)** | `WORKING` | `api/telemetry.ts` verifies `X-Device-Id`, `X-Device-Timestamp` (`+/-300s`), `timingSafeEqual` HMAC digest (`secret` stripped from `GET` responses), and revoked device `403` lockout. |
| **Replay & Schema Guard** | `WORKING` | `public.telemetry` enforces unique `(device_id, device_timestamp, sequence_no)` returning HTTP `200 { deduplicated: true }`; Zod validates physical SI ranges (`wind_speed_ms`, `rotor_rpm`, `dc_voltage_v`, `dc_current_a`, etc.); invalid/oversized (`>32 KB`) packets return `400`/`413` and log into `public.device_errors`. |
| **Betz Limit Sanity Tagging** | `WORKING` | Computes $P_{\text{elec}} = V \times I$ and flags `data_quality_status = 'betz_anomaly'` automatically when power exceeds theoretical aerodynamic ceiling without deleting raw observations. |
| **CSV Inspection & Power Curve Binning** | `WORKING` | Verified against 5,000-row datasets and missing-column edge cases (`tests/physics.test.mjs`), preserving anomalies rather than silent filtering. |
| **Supabase Realtime Hydration** | `WORKING` (Local) | `EngineeringWorkbenchTab.tsx` hydrates DB snake_case telemetry/turbines via `mapDbTelemetryRow()` & `mapDbTurbineRow()` and listens to `postgres_changes` `INSERT` on `public.telemetry`. |
| **Hardware Safety Boundary** | `WORKING` | Monitoring-only strictly: zero endpoints for turbine start, mechanical brake release, yaw, pitch, or overspeed actuation. |

---

## 2. Historical Mark-4 `36.25 W @ 4.5 m/s` Reconciliation & Labels

For swept area $A = 0.283\text{ m}^2$ at $V = 4.5\text{ m/s}$ ($\rho = 1.225\text{ kg/m}^3$), total wind kinetic stream power is $\frac{1}{2}\rho A V^3 \approx 15.80\text{ W}$, and theoretical Betz limit ($\frac{16}{27} \approx 59.3\%$) is $\approx 9.36\text{ W}$. Consequently `36.25 W` violates physical bounds and stays strictly quarantined under `HISTORICAL / UNVERIFIED` until re-tested with calibrated synchronous 1 Hz sensors. All UI badges distinguish `MEASURED`, `CALCULATED`, `SIMULATED`, `DESIGN TARGET`, and `HISTORICAL / UNVERIFIED`.
