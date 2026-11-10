# PAWAN SHAKTI — Repository Audit Report

**Repository:** `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine`  
**Audit Date:** 10 November 2026  
**Audited Branch:** `feature/pawan-shakti-platform` (Commit `66e3e4e`, compared against `origin/main` Commit `a19c216`)  
**Founder-Confirmed Authority Reference:** `yashwanth-hub/docs/CURRENT_PROJECT_BASELINE.md` (04 Nov 2026) & `yashwanth-hub/docs/V3F_STARTUP_READINESS_AND_GAP_ASSESSMENT.md` (05 Nov 2026)  
**Scope:** Complete inspection of all 69 tracked files across root, `docs/`, `engineering/`, `intellectual-property/`, `media/`, `reports/`, `team/`, and `testing/`.

---

## 1. Executive Audit Summary

The `low-speed-wind-turbine` repository currently contains **engineering documentation, CAD assemblies/meshes, 2D technical drawings, presentation/calculation archives, IP summary, contributor notes, prototype photos, and a sample CSV logging template**, totaling **69 tracked files** on branch `feature/pawan-shakti-platform` (`0` software application source files exist).

Commit `66e3e4e` (`feat: transform repository into evidence-first engineering research portfolio`) made major improvements over the earlier `origin/main` README (`a19c216`), adding structured markdown docs, qualifying overstated solar comparison/24-hour operation claims, documenting Mark-3/Mark-4/Mark-5 evolution, and preserving raw CAD/test templates. However, **deep inspection uncovered 7 critical factual/physics conflicts, broken internal file references, uncatalogued/duplicated CAD files, zero calibrated >= 1 Hz time-series datasets, and zero software/backend infrastructure**.

Under strict evidentiary audit against the latest founder-confirmed development status (November 2026):
- **Current Technology Readiness Level:** **TRL 4** (Laboratory / Benchtop Prototype Validation) — *NOT TRL 4–5*.
- **Patent Legal Status:** Indian Patent Application (*"Compact Wind Turbine with Planetary Gears"*, Published 2025) is **published and under examination — NOT granted**.
- **Commercial / Financial Claims:** No commercial customers, verified unit sales, or audited LCOE payback data exist yet; economic figures (₹35,000 unit target, 7–8 yr payback, ₹2,000–₹5,000 O&M) are **preliminary estimates / targets only**.

---

## 2. Complete Directory & Asset Inventory

| Directory / File Group | File Count | Observed Assets & State | Preservation Policy |
| :--- | :---: | :--- | :--- |
| **Root** | 4 | `.gitignore` (522 B), `CHANGELOG.md` (2,574 B), `LICENSE` (MIT, 2025 koyaneni yaswanth, 1,095 B), `README.md` (429 lines, 32,621 B) | Preserve `LICENSE` & `.gitignore`; non-destructively extend `.gitignore` for app build/env artifacts when platform code is added |
| **`docs/`** | 13 | `project-overview.md`, `problem-and-motivation.md`, `system-architecture.md`, `engineering-design.md`, `planetary-gear-system.md`, `simulation-and-analysis.md`, `testing-and-validation.md`, `results.md`, `challenges-and-lessons.md`, `development-roadmap.md`, `project-timeline.md`, `references.md`, `sdg-impact.md` | **Preserve all 13 original files untouched**; append V2 audit & roadmap as new docs |
| **`engineering/airfoil/`** | 1 | `S1223.dat` (82 lines, Selig S1223 normalized `(x/c, y/c)` coordinate table) | Preserve intact; parse directly into live interactive Airfoil & Aerodynamics Lab |
| **`engineering/cad/`** (native & STEP) | 5 | `Model-2.f3d` (204,271 B), `Model-23.f3d` (418,789 B), `fan-gear.f3d` (4,365,843 B), `ringforferritemagnetsv2.f3d` (416,367 B), `back-plate.step` (10,407 B, STEP AP214 generated `2026-09-16T12:45:24+05:30`) | Preserve all original binaries & STEP untouched |
| **`engineering/cad/stl-and-3mf/`** | 26 | 5 `.stl` binary meshes, 20 `.3mf` 3D manufacturing archives, 1 third-party zip (`Archimedes Turbine - 939532.zip`, Thingiverse CC-Attribution) | Preserve all originals; catalog triangles/vertices/duplicates & license attribution in platform CAD Registry |
| **`engineering/calculations/`** | 1 | `Clear-Calculation-Steps.pdf` (30 pages, ChatGPT printout `3/23/26` scaling a 4.81 kW DFIG standalone paper to 100 W at 4.5 m/s) | Preserve intact; clearly tag as *DFIG scaling educational study*, separate from 24V PMDC/PMA sizing |
| **`engineering/drawings/`** | 2 | `drawings1.pdf` (`DWG No. 1`, issued `18/05/2025` by `koyaneni yaswanth`), `drawings-2.pdf` (`18/05/2025`, variant sheet omitting base pedestal & DWG No.) | Preserve intact |
| **`engineering/specifications/`** | 1 | `system-specifications.md` (35 lines, 100 W 4-rotor Config B baseline table) | Preserve intact |
| **`intellectual-property/`** | 1 | `README.md` (35 lines, IPO published application summary + 2026 magnetic gear R&D note) | Preserve intact; track missing Application/Publication Number in audit gaps |
| **`media/`** | 4 | `hero/pawan-shakti-logo.jpeg` (149 KB), `prototype/mark-3-three-rotor-prototype.png` (1.74 MB), `prototype/mark-4-four-rotor-prototype.png` (2.64 MB), `prototype/mark-5-five-rotor-kecs-prototype.jpg` (188 KB) | Preserve & serve directly in platform asset pipeline |
| **`reports/`** | 5 | `README.md`, `VNIT-Pre-Incubation-Agreement-Summary.md`, `Pawan_Shakti_Briefing_Note.docx` (4.59 MB), `presentations/Presentation.pdf` (78 slides, Dr. J. Bhukya DFIG SSR/ML deck), `presentations/Betz-limit.pptx` (28 image slides, 39 media objects) | Preserve intact |
| **`team/`** | 1 | `contributors.md` (57 lines: Koyaneni Yaswanth, Dr. Jawahar Bhukya, V3F, unnamed intern collaborators) | Preserve intact |
| **`testing/`** | 4 | `raw-data/sample-sensor-log-template.csv` (14 lines / 13 sample rows), `results/prototype-comparison-table.md`, `test-protocols/ESP32-Sensor-Logging-Protocol.md`, `test-protocols/Intern_Task_Brief_Wind_Turbine.docx` | Preserve intact; treat `.csv` strictly as template/historical sample, not calibrated dynamometer proof |
| **Application Code (`src/`, DB, API)** | 0 | **Completely absent.** No `package.json`, web frontend, API, auth, DB schema, telemetry ingestion, or tests exist | To be built in Phases 1–5 |

---

## 3. Critical Conflicts, Physics Anomalies, Outdated & Unverified Information

### A. Conflicts with Latest Founder-Confirmed Status (Nov 2026 Authoritative Baseline)
1. **TRL Overstatement (`README.md` L398 vs Founder Baseline):**
   - `README.md` states `TRL 4–5 (Component and subsystem validation in laboratory and relevant outdoor environment)`.
   - Founder-confirmed status (`CURRENT_PROJECT_BASELINE.md` & `V3F_STARTUP_READINESS_AND_GAP_ASSESSMENT.md`) confirms the startup is strictly at **TRL 4** because no closed-loop loaded system test, zero automated $\ge 1\text{ Hz}$ time-series datasets, and no outdoor relevant-environment run have been completed yet.
2. **Prototype Frame & Blade Material Mismatch (`system-specifications.md` / `README.md` vs Physical Rigs):**
   - `README.md` & `system-specifications.md` describe FDM **ABS** blades with UV acrylic coating and **6063-T6 aluminum** frames + CNC **5052/6061 backplate**.
   - Physical inspection (`mark-3-three-rotor-prototype.png`) and Nov 2026 baseline show early Mark-3 used a **wooden timber mast/frame** and **PLA** prints ($T_g \approx 55^\circ\text{C}$), while Mark-4/Mark-5 introduced extruded aluminum frames (`3030`/modular slots). ABS/ASA/PETG-CF and Delrin (POM) remain planned upgrades unless verified per component.
3. **Generator & DC Battery Architecture Conflict Across Docs:**
   - `Pawan_Shakti_Briefing_Note.docx`: cites **110 V DC, 3500 RPM, 100 W** generator feeding a **12 V, 100 Ah** battery + 230 V AC inverter.
   - `README.md` & `system-specifications.md`: cite **24 V DC, 4.16 A, 100 W** PM DC generator + **24 V, 40 Ah** battery (while noting 110 V unit also tested).
   - `origin/main` (`a19c216`): cites **1 kW battery pack** (unit confusion with `1 kWh` = $100\text{ W} \times 10\text{ h}$) and **100 W** PM DC motor.
   - Nov 2026 Baseline: identifies cogging torque (`> 0.3 N·m`) on brushed/radial PM motors as a cut-in blocker, targeting a **3-phase axial-flux coreless PMA** with **24 V / 48 V MPPT TCCB** and **INA226/shunt** instrumentation.
4. **DFIG Calculation Contamination (`Clear-Calculation-Steps.pdf`, `docs/results.md`, `docs/system-architecture.md`):**
   - `Clear-Calculation-Steps.pdf` is a ChatGPT transcript applying utility-scale **DFIG** (`4.81 kW`, slip $s=-0.3$, stator/rotor power split, `1.8 m` radius) equations scaled down to `100 W` at `4.5 m/s` (yielding $r \approx 1.13\text{ m}$, $\lambda_{\text{opt}}=8.1$, gear ratio `3.77`, `240 V` DC link).
   - `docs/results.md` L32–33 and `system-architecture.md` L32 inherited `"3.77:1 intermediate ratio"` and `"77W stator / 23W rotor"` directly into Pawan Shakti's 300 mm multi-rotor PM DC docs—even though a DC PM generator has **no wound-rotor slip rings or DFIG slip split**.
5. **Swept Area & Betz-Limit Physics Conflict in Reported Power (`docs/results.md`, `testing/`):**
   - **Calculation Check:** Using $P_{\text{wind}} = \frac{1}{2} \rho A V^3$ ($\rho = 1.151\text{ kg/m}^3$, $V = 4.5\text{ m/s}$):
     - For four `300 mm` rotors (`system-specifications.md` L12: $A = 4 \times \pi \times 0.15^2 = 0.283\text{ m}^2$), total unobstructed wind stream power is **$14.84\text{ W}$** (Betz maximum at $C_p = 0.593$ is **$8.80\text{ W}$**).
     - `testing/results/prototype-comparison-table.md` and `docs/testing-and-validation.md` list **`36.25 W` at `4.5 m/s`** for Config B (`2.44x` total wind stream power across `0.283 m²`, or `69.3%` even against the mismatched `52.3 W` / `D = 1.0 m` calculation in `docs/results.md` L28, where true $0.5 \times 1.151 \times 0.7854 \times 4.5^3 = 41.18\text{ W}$, making `36.25 W / 41.18 W = 0.88 > 0.593`!).
   - **Audit Verdict:** Either blower jet concentration, open-circuit/uncalibrated $V \times I$ scaling, unverified caliper rotor radius, or template numbers (`sample-sensor-log-template.csv`) caused this discrepancy. Consistent with founder baseline #1 (*"Power outputs were previously inferred or measured open-circuit ($V_{oc}$)... Zero continuous calibrated datasets"*), **ALL Mark-3/4/5 wattage figures must be tagged as `Historical Bench Log — Requires Calibrated Closed-Loop Re-Verification`** rather than presented as certified $P\text{-}v$ curve proof.
6. **CSV Template vs Test Log Date Contradiction:**
   - `docs/testing-and-validation.md` dates Mark-3 on **29 July 2026**, Mark-4 on **18 August 2026** (flow channel), and Mark-5 on **12 September 2026** (workshop).
   - `testing/raw-data/sample-sensor-log-template.csv` puts Config A, Config B, and Config C all on a single day (**`2026-07-29 09:00` to `14:15`**), confirming it is an illustrative template (`sample-sensor-log-template.csv`) matching the 2-day rotation protocol example in `Intern_Task_Brief_Wind_Turbine.docx`.
7. **Legacy `origin/main` README & Docs Divergence:**
   - `origin/main` still carries unqualified marketing claims (`35% vs 18% solar efficiency`, `24 hours continuous`, `2,500 weather systems`, `1 kW battery`, `aluminum-coated gearbox`). Never merge `main` claims back over `feature/pawan-shakti-platform`.

### B. Broken Links, Missing Metadata & Undocumented CAD Assets
- **Broken Document Paths:**
  - `CHANGELOG.md` L57 cites `drawings 2.pdf` instead of `engineering/drawings/drawings-2.pdf`.
  - `reports/README.md` cites `Presentation.pdf` / `Presentation.pptx` and `Betz limit.pptx` as `"Archived in project root"`, whereas `Presentation.pdf` and `Betz-limit.pptx` live under `reports/presentations/` and `Presentation.pptx` does not exist.
- **Technical Drawings (`drawings1.pdf`, `drawings-2.pdf`):** Contain orthographic 3-rotor views dated `18/05/2025` but **no dimensional callouts, tolerances, fastener schedules, or material BOM blocks** (`drawings-2.pdf` omits DWG No. `1` and base pedestal).
- **Duplicate / Cryptic CAD Exports in `engineering/cad/stl-and-3mf/`:**
  - `Configuration 2.stl` & `a1a2.stl` are byte-identical (`184,684 B`, `3,692` triangles).
  - `Model-23.3mf` & `Untitled.3mf` share identical geometry (`18,493` vertices / `36,970` triangles).
  - `frame_cad.3mf` & `frame_cad_1.3mf` share identical geometry (`114` vertices / `248` triangles).
  - `back plate.stl` (`684 B`, `12` triangles) is a basic 6-face rectangular prism lacking bore/mounting features shown in `back-plate.step`.
  - `Archimedes Turbine - 939532.zip` is a third-party **Creative Commons Attribution (`CC BY`)** Thingiverse model by `dreyfusduke`, distinct from Pawan Shakti's S1223 multi-rotor patent geometry—must retain explicit third-party CC-BY attribution.
  - Undocumented filenames (`t.3mf`, `r.3mf`, `rt.3mf`, `ngi.3mf`, `bkg305.941.3mf`, `manet 150cm gear acl.3mf`, `manet 25cm gear.3mf`, `stoper for grear.3mf`, `silver strips.3mf`, `silver strips2.3mf`, `new gear desing_30cm_aniclockwise.3mf`) need human description tagging in the platform CAD Registry.
- **Missing Institutional / Team / IP Specifics:**
  - `intellectual-property/README.md`: Missing exact Indian Patent Application Number, Publication Number, filing date, and current First Examination Report (FER) deadline.
  - `reports/` & `team/contributors.md`: ANRF / CBDE grant names are stated without grant sanction ID, sanctioned amount verification, or utilization records; intern/engineering pod members are unnamed beyond Koyaneni Yaswanth, Dr. Jawahar Bhukya, and V3F COO Anil Kumar Singh.
  - `testing/`: Zero real ESP32 `.ino`/`.cpp` firmware code or Python ML scripts (`.py`, `.pkl`, `.joblib`) exist despite detailed protocol documentation.

---

## 4. Preservation & Evidentiary Tagging Standard

All platform views, databases, and public pages generated in subsequent phases will enforce a strict **5-Tag Evidentiary Taxonomy** alongside original file immutability:

1. **`MEASURED`**: Directly measured with calibrated hardware load ($P = V \times I$), caliper, or digital tachometer/anemometer and raw timestamped CSV attached.
2. **`HISTORICAL_UNVERIFIED`**: Preserved from V1/Mark-3/4/5 logs (e.g., `26.04 W`, `36.25 W`) with explicit warning noting pre-calibration/Betz-check requirement.
3. **`CALCULATED`**: Derived via physics equations ($P_{\text{wind}} = \frac{1}{2}\rho A V^3$, $i = 1 + Z_{\text{ring}}/Z_{\text{sun}}$, $I = P/V$).
4. **`SPECIFICATION`**: Component geometry, Fusion/ANSYS FEA values, or manufacturer COTS datasheet ratings.
5. **`TARGET` / `EXPERIMENTAL`**: Unvalidated future targets ($\le 2.0\text{ m/s}$ cut-in, $100\text{ W}$ sustained at $5.5\text{ m/s}$, Delrin POM / CNC 6061, magnetic gearing Pod A, ₹35,000 unit target).

---

*End of Repository Audit Report. See [`FEATURE_IMPLEMENTATION_ROADMAP.md`](./FEATURE_IMPLEMENTATION_ROADMAP.md) for the proposed platform architecture and phased execution plan.*
