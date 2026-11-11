# PAWAN SHAKTI — Hardware Telemetry Integration Specification (`Phase 6`)

**Date:** 11 November 2026  
**Status:** Software & API Ingestion Ready (`VERIFIED` in unit tests); **Physical Hardware Connection = `NOT STARTED / UNAVAILABLE`** (Zero live ESP32/STM32 sensors physically connected).

---

## 1. End-to-End Ingestion & Dashboard Architecture

```text
ESP32 / STM32 Bench Logger (1 Hz synchronous sampling)
   ├── Sensors: Cup Anemometer (GPIO 14), Optical Tachometer (GPIO 13),
   │            DC Bus Divider / INA226 (0-30 V, Shunt Current), ADXL345 (I2C)
   ├── Offline Ring Buffer: LittleFS / SD Card CSV queue on Wi-Fi dropout
   ▼
HTTPS POST /api/telemetry
   ├── Headers: X-Device-Id, X-Device-Timestamp (+/-300s), X-Device-Nonce,
   │            X-Device-Signature (HMAC-SHA256 over "<ts>.<nonce>.<rawBody>")
   ▼
Vercel Serverless Validation (api/telemetry.ts)
   ├── Sliding-window rate limit (180 req/min/device -> HTTP 429)
   ├── Device lookup + revocation guard (HTTP 401/403)
   ├── timingSafeEqual HMAC verify + replay guard (+/-300s)
   ├── Zod physical bounds check + P = V * I + Betz Cp check
   ├── Persist failed packets into `public.device_errors`
   ▼
Supabase PostgreSQL (`public.telemetry` & `public.devices`)
   ├── Deduplicate unique `(device_id, device_timestamp, sequence_no)` -> HTTP 200
   ├── Update `devices.last_heartbeat_at` & `device_health`
   ▼
Authenticated UI (`src/components/admin/EngineeringWorkbenchTab.tsx`)
   ├── `mapDbTelemetryRow()` snake_case -> camelCase hydration
   ├── Supabase Realtime subscription (`postgres_changes` INSERT on `public.telemetry`)
   └── Strict Data Provenance Badges: MEASURED / SIMULATED / ESTIMATED / UNAVAILABLE
```

---

## 2. Telemetry Channels & Validation Schema (`api/telemetry.ts`)

| Field | Range / Type | Description | Provenance When Hardware Offline |
|---|---|---|---|
| `site_id`, `turbine_id` | `string` (1–64 chars) | Site identifier & optional turbine FK | Unassigned |
| `sequence_no` | `int >= 0` | Monotonic packet counter for replay/dedupe | `0` |
| `device_timestamp` | ISO 8601 UTC | Synchronized RTC packet timestamp | Unavailable |
| `wind_speed_ms` | `0 .. 80` m/s | Calibrated centerline anemometer speed | Simulation Mode only |
| `wind_direction` | `string <= 16` | Cardinal or degrees | Unavailable |
| `rotor_rpm`, `generator_rpm` | `0 .. 20000` / `0 .. 50000` | Optical/Hall shaft RPM | Simulation Mode only |
| `dc_voltage_v`, `dc_current_a` | `0 .. 1000` V / `0 .. 500` A | Load bus voltage & current | Simulation Mode only |
| `power_w` | Computed server-side `V * I` | Checked against theoretical Betz limit; flags `betz_anomaly` automatically | Simulation Mode only |
| `cumulative_energy_wh` | `>= 0` Wh | Integrated net energy counter | `0.0 Wh Logged` |
| `battery_soc_pct`, `temperature_c` | `0 .. 100` % / `-40 .. 200` °C | Storage SoC & thermal sensor | Unavailable |
| `brake_state` | `'released' \| 'engaged' \| 'fault' \| 'unknown'` | **Strictly read-only monitoring status** | `'unknown'` |
| `device_health`, `sensor_health`, `fault_code` | `string <= 64` | Sensor dropout / diagnostic status | `'offline'` |

---

## 3. Physical Hardware Safety & Truthfulness Guarantees

- **Zero Remote Actuation:** No endpoint in `api/` emits brake release, start, yaw, or overspeed override commands.
- **Explicit Offline State:** Whenever live database telemetry is absent (`telemetrySource !== 'live_hardware'`), UI surfaces `"Simulation Mode — No live hardware data connected."` and marks sensor fields `UNAVAILABLE` or `SIMULATED`.
- **Offline Buffering Guidance:** ESP32/STM32 firmware must retain unacknowledged packets in flash/SD ring buffer and flush monotonically preserving original `device_timestamp` and `sequence_no` upon Wi-Fi reconnect (`+/-300s` replay guard requires fresh NTP sync before re-signing or batch CSV upload for historical backlog via `telemetry-csvs` storage + CSV parser).
