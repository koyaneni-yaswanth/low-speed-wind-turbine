# PAWAN SHAKTI — Content & Evidence Register

Every factual statement, engineering parameter, image, CAD asset, patent reference, test metric, BOM cost, and projection displayed in the platform MUST be registered below with an explicit Evidentiary Tier.

**Allowed Tags:**
- `VERIFIED_MEASURED` — Physical calibration, measured geometry/file hash, or executed legal record.
- `PROTOTYPE_OBSERVATION` — Recorded on bench/flow runs (requires calibrated closed-loop re-verification before product claims).
- `ENGINEERING_ESTIMATE` — Derived from physics/sizing calculations or preliminary simulation.
- `DESIGN_TARGET` — Future engineering performance goal (not yet proven).
- `COMMERCIAL_ASSUMPTION` — Preliminary business/cost/financial modeling input (editable in app).
- `FUTURE_ROADMAP` — Planned milestone / capability not yet built or validated.

---

## 1. Master Fact & Conflict Resolution Table

| Topic / Metric | Authoritative Platform Statement | Classification | Source Evidence | Conflicts Rejected / Quarantined |
| :--- | :--- | :--- | :--- | :--- |
| **Startup Stage / TRL** | **TRL 4 Prototype** (benchtop subsystem experimentation toward TRL 6/7 pilot goal) | `VERIFIED_MEASURED` (Founder Baseline) | Founder brief + `CURRENT_PROJECT_BASELINE.md` | Rejected `TRL 4–5` from Sept 2026 `README.md` L398 |
| **Physical Prototype History** | Mark-3 (3-rotor planetary setup), Mark-4 (4-rotor planar planetary setup + rear fan gear + wooden outer frame / test rig), Mark-5 (5-rotor KECS aluminum rig showing friction limit) | `VERIFIED_MEASURED` (Photos + Repo Logs) | `media/prototype/mark-3*`, `mark-4*`, `mark-5*`, `drawings1.pdf` | Never replaced with stock wind turbine imagery; no `1 kW` unit exists |
| **Option A Architecture** | Coaxial magnetic gear (`~1:5.5` or `1:10` under evaluation), N52 magnet concept, `~1.5 mm` air gap + HAWT-style airfoil direction | `DESIGN_TARGET` / Under Evaluation | Prompt Sec 2.3 + `ringforferritemagnetsv2.f3d`, `magnetic gear.3mf`, `S1223.dat` | Cannot be declared winner prior to comparative bench dyno test |
| **Option B Architecture** | Archimedes spiral & planetary transmission (geometry, pitch, ratios & losses to be measured) | `DESIGN_TARGET` / Under Evaluation | Prompt Sec 2.3 + `Archimedes Turbine - 939532.zip` (`CC BY`) + planetary CAD | Third-party Archimedes STL stays attributed (`dreyfusduke` CC BY) |
| **Working 1 m² Iteration Inputs** | Target swept area `~1 m²` ($r \approx 0.564\text{ m}$); wind regime `~2–8 m/s`; preliminary estimates: `20–25 W @ 5 m/s`, `95–110 W @ 8 m/s`, `250–300 W @ 11 m/s`; `300–500 W` coreless PMA concept @ `300–600 RPM` | `ENGINEERING_ESTIMATE` / `DESIGN_TARGET` | Authoritative Prompt Section 2.4 | Explicitly separated from historical `100 W / 24 V` 300 mm rigs and never combined with `1 kW` claims |
| **Cut-In Target** | `<= 2.2 m/s` is a development target (early bench rotation `2.3–2.5 m/s` noted informally without calibrated curve) | `DESIGN_TARGET` / `PROTOTYPE_OBSERVATION` | Prompt Sec 8 KPI 1 + `README.md` | Never published as a certified product cut-in spec |
| **Mark-3/4/5 Historical Power Logs** | `26.04 W @ 4.2 m/s` (Mark-3), `36.25 W @ 4.5 m/s` (Mark-4), `sample-sensor-log-template.csv` (13 template rows) | `PROTOTYPE_OBSERVATION` *(Audit Flag: `36.25 W` violates Betz for $0.283\text{ m}^2$)* | `docs/testing-and-validation.md`, `sample-sensor-log-template.csv` | Quarantined with automatic Betz anomaly badge; requires calibrated $P = V \times I$ closed-loop test |
| **DFIG Calculations (`Clear-Calculation-Steps.pdf`)** | Educational DFIG scaling calculation (`4.81 kW` -> `100 W`, `r = 1.13 m`, `3.77:1`, `77W/23W`) | `ENGINEERING_ESTIMATE` (Non-baseline Reference) | `Clear-Calculation-Steps.pdf` | Do NOT apply DFIG slip-ring formulas to PMDC / coreless PMA product specs |
| **Patent Legal Status** | Title: *"Compact Wind Turbine with Planetary Gears"*; Inventor: Koyaneni Yaswanth; Published `2025` at Indian Patent Office (**Under examination / NOT granted**) | `VERIFIED_MEASURED` | `intellectual-property/README.md` | Never state "Patented / Granted"; Application No. tracked as pending founder verification |
| **VNIT V3F Pre-Incubation** | Pre-Incubation Agreement executed `21–23 Sept 2026` with VNIT Ventures Vault Foundation (`V3F`); Mentor: Dr. Jawahar Bhukya | `VERIFIED_MEASURED` | `reports/VNIT-Pre-Incubation-Agreement-Summary.md` | Draft contract with PAN/bank PII strictly excluded from public repo/web |
| **Grants & Schemes** | ANRF / CBDE mentioned in repo brief; NIDHI-PRAYAS, SISFS, MeitY TIDE 2.0 tracked as candidate pipeline schemes | `FUTURE_ROADMAP` / Verification Pending | `reports/README.md`, Prompt Sec 12 | Zero grant approval or disbursed INR amount claimed without uploaded sanction letter |
| **BOM & Pricing Modeling** | Prototype BOM est. `~₹48,000`; Future target BOM `~₹32,000`; Proposed sale price `₹65,000–₹80,000`; SOM/payback (`3.5 yr`, `<₹5.20/kWh`, `₹19.75 Cr`) blocked unless scenario inputs prove | `COMMERCIAL_ASSUMPTION` | Prompt Sec 8 & Sec 10 | Never published as validated financial facts or guaranteed payback |
| **CRM / Pipeline Counters** | Starts at **`0`** across interviews, surveys, LOIs, revenue | `VERIFIED_MEASURED` | Prompt Sec 6 | Never hardcode `14 interviews`, `4 surveys`, or `3 LOIs` |

---

## 2. Asset Verification Log
- `media/hero/pawan-shakti-logo.jpeg` (`149,661 B`) — Official brand mark.
- `media/prototype/mark-3-three-rotor-prototype.png` (`1,736,062 B`) — Real Mark-3 3-rotor wood-mast rig w/ Fluke meter.
- `media/prototype/mark-4-four-rotor-prototype.png` (`2,642,327 B`) — Real Mark-4 4-rotor planetary rig.
- `media/prototype/mark-5-five-rotor-kecs-prototype.jpg` (`188,531 B`) — Real Mark-5 5-rotor KECS aluminum rig.
- `engineering/cad/stl-and-3mf/` (`26` items) — Duplicate pairs (`Configuration 2.stl` == `a1a2.stl`; `Model-23.3mf` == `Untitled.3mf`; `frame_cad.3mf` == `frame_cad_1.3mf`) documented explicitly so CAD catalog never inflates unique part counts.
