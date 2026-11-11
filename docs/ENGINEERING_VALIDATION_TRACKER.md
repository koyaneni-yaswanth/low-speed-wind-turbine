# PAWAN SHAKTI — Engineering Validation & TRL Tracker (`Phase 7`)

**Date:** 11 November 2026  
**Authoritative Maturity:** **TRL 4** (Laboratory / Bench Subsystem Validation — **NOT** TRL 6/7 Field Pilot Validated)  
**Patent Status:** Indian Patent Application *"Compact Wind Turbine with Planetary Gears"* — **Published (2025) / Under Examination (NOT GRANTED)**  
**Architecture Freeze Status:** **OPEN** — Option A (Coaxial Magnetic Gear + HAWT) vs Option B (Archimedes Spiral + Planetary Gear) remain under comparative evaluation.

---

## 1. Evidence & Truth Baseline Across Prototypes

| Prototype | Physical Configuration | Observed Behavior & Historical Notes | Verification Status |
|---|---|---|---|
| **Mark-3 (Config A)** | `3 x 300 mm` multi-blade impellers, timber frame, coaxial `1:10` planetary gear (`A ~ 0.212 m²`) | Informal cut-in observed ~`2.3–2.5 m/s`; FDM tooth surface noise | `PROTOTYPE_OBSERVATION` — awaiting continuous 1 Hz calibrated DAQ rerun |
| **Mark-4 (Config B)** | `4 x 300 mm` planar square cluster, wooden/aluminum fixture, `1:10` planar + rear fan gear (`A ~ 0.283 m²`) | Historical uncalibrated spot reading of **`36.25 W @ 4.5 m/s` is FLAGGED / QUARANTINED** because it exceeds the theoretical Betz aerodynamic ceiling (`~9.3 W` max mechanical/aero on `0.283 m²` at standard `1.225 kg/m³`) | **FLAGGED FOR VERIFICATION** — NEVER marketed as validated power output |
| **Mark-5 (Config C / KECS)** | `5 x 300 mm` star array, extruded T-slot aluminum bench rig, 5 parallel spur pinions (`A ~ 0.353 m²`) | Cut-in degraded (`~2.8–3.2 m/s`) due to 5-mesh friction ceiling & tooth rattle | `PROTOTYPE_OBSERVATION` — documented mechanical friction bound |
| **Next-Gen `~1 m²` Candidate** | Option A (`ringforferritemagnetsv2.f3d`, `magnetic gear.3mf`, S1223 HAWT) vs Option B (Archimedes + CNC Delrin/Alloy Planetary) | `300–500 W` Coreless PMA design class assumption, `<= 2.2 m/s` cut-in target | `DESIGN_TARGET` — physical comparative dyno shootout NOT STARTED |

---

## 2. TRL 4 -> TRL 6/7 Physical Gate Tracker

| Gate Item | Required Physical Evidence | Current Status |
|---|---|---|
| **Measured Caliper Geometry Sheet** | Signed physical dimensions (swept diameter `D`, hub radius, blade pitch, air gap `mm`, gear module/teeth) | **NOT STARTED** |
| **Sensor Calibration Certificate / Bench Check** | Known-wind tunnel/flow-bench anemometer curve, INA226 shunt gain error, optical tachometer verification | **NOT STARTED** |
| **Synchronized 1 Hz Dyno Dataset (CSV + DB)** | Continuous `>= 15 min` sweeps for Option A vs Option B under matching regulated resistive loads (`P = V * I`, ambient temp/pressure) | **NOT STARTED** |
| **16-Criterion Scorecard Sign-Off** | Physical dyno scores (`1-5`) logged in `public.option_comparisons` backed by `reviewed` test runs (`Dr. Bhukya` + Founder) | **OPEN (0 / 16 scored)** |
| **Endurance & Storm Braking Verification** | Continuous `>= 500 hr` outdoor campus durability + verified failsafe overspeed brake test | **NOT STARTED** |
