# Changelog: PAWAN SHAKTI Development History

All notable technical updates, hardware revisions, and architectural milestones of the PAWAN SHAKTI project are recorded in this document.

---

## [Platform V1.2 — Cinematic 3D Wind Lab, Planetary Gearbox Kinematics & Interactive Visualization Suite] - 2026-11-11 (Branch `feature/pawan-shakti-platform`)

### Added
- Built modular 3D animation architecture across [`src/components/three/`](src/components/three/), [`src/components/animation/`](src/components/animation/), [`src/hooks/`](src/hooks/), and [`src/lib/animation/`](src/lib/animation/) with `AnimationBoundary` WebGL fallback, adaptive High/Balanced/Low-Power presets, `prefers-reduced-motion` support, Dark Aerospace / Light Lab theme switcher, and keyboard shortcuts (`Space`, `R`, `E`, `B`, `F`, `Escape`).
- Implemented [`TurbineScene.tsx`](src/components/three/TurbineScene.tsx) featuring interactive wind-speed control (`2–11 m/s`), yaw wind-direction rotation, instanced conceptual airflow particles & streamlines (`Conceptual airflow visualization — not CFD simulation`), 10-part exploded assembly with guide lines, X-Ray nacelle, Blueprint wireframe mode, Presentation tour, and optional browser `MediaRecorder` WebM clip export.
- Implemented [`PlanetaryGearScene.tsx`](src/components/three/PlanetaryGearScene.tsx) driven by the Willis planetary equation solver [`gearKinematics.ts`](src/lib/animation/gearKinematics.ts) ($N_s\omega_s + N_r\omega_r = (N_s+N_r)\omega_c$), plus [`GeneratorEnergyFlow.tsx`](src/components/three/GeneratorEnergyFlow.tsx), [`TwoPathComparisonScene.tsx`](src/components/three/TwoPathComparisonScene.tsx), [`EngineeringTimeline.tsx`](src/components/animation/EngineeringTimeline.tsx), and [`AnimatedTelemetryChart.tsx`](src/components/charts/AnimatedTelemetryChart.tsx).
- Expanded automated tests to `19 / 19` passing Node tests (including `animation_kinematics.test.mjs`), `0` Oxlint errors/warnings, and full headless Chrome E2E + responsive screenshot verification (`1440x900`, `768x1024`, `375x812`).

---

## [Platform V1.1 — Hardening, Full RLS, API Persistence & Edge-Case Verification] - 2026-11-11 (Branch `feature/pawan-shakti-platform`)

### Added & Fixed
- Resolved high-severity dependency advisory (`zod < 4.6.6`, `GHSA-mrhx-c7xc-m3w5`) by upgrading to `zod@^4.6.7` (`npm audit`: `0` vulnerabilities).
- Added idempotent migration [`supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql`](supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql) establishing explicit RLS policies across all 36 tables, `device_errors` diagnostics, role-escalation prevention triggers, fail-closed `public_visitor` default signup trigger, and structural baseline seeds.
- Hardened `api/_lib/db.ts`, `inquiries.ts`, `telemetry.ts`, `admin.ts`, `analytics.ts`, and `notifications.ts` with fail-closed `public_visitor` fallback, safe `parseJsonBody()`, `escapeHtml()` email escaping, sliding-window rate limiting (`429`), rapid duplicate pilot rejection (`409`), PII-free analytics enforcement, ESP32 device registration/revocation (`oneTimeDeviceKey`), and `draft -> running -> completed -> reviewed -> rejected` review gating.
- Wired all 4 `/admin` tabs to live API endpoints when authenticated while preserving honest Offline Inspector mode, and added explicit Zoom In/Zoom Out/Reset controls plus binary mesh fetch validation to [`src/components/cad/ModelViewer3D.tsx`](src/components/cad/ModelViewer3D.tsx).
- Expanded test coverage to `16 / 16` Node unit/physics/CSV/security/SQL assertions plus Playwright headless Chrome E2E verification (`1440x900`, `768x1024`, `375x812`).

---

## [Platform V1 — Digital Platform & Engineering OS] - 2026-11-10 (Branch `feature/pawan-shakti-platform`)

### Added
- Completed forensic audit & created `PAWAN_SHAKTI_PRODUCT_AUDIT.md`, `PAWAN_SHAKTI_TECHNICAL_ARCHITECTURE.md`, `PAWAN_SHAKTI_CONTENT_AND_EVIDENCE_REGISTER.md`, `PAWAN_SHAKTI_SECURITY_AUDIT.md`, `PAWAN_SHAKTI_FEATURE_ROADMAP.md`, `PAWAN_SHAKTI_OPERATIONS_AND_DEPLOYMENT_GUIDE.md`, and `PAWAN_SHAKTI_TEST_AND_RELEASE_REPORT.md` while preserving all 69 original engineering, CAD, media, report, IP, and test template files.
- Implemented React + TypeScript + Vite + Tailwind + Three.js frontend across 9 public routes and protected `/admin` workbench enforcing strict TRL 4 evidence tags (`VERIFIED_MEASURED`, `PROTOTYPE_OBSERVATION`, `ENGINEERING_ESTIMATE`, `DESIGN_TARGET`, `COMMERCIAL_ASSUMPTION`, `FUTURE_ROADMAP`), published non-granted patent wording, and authentic Mark-3/4/5 photography.
- Implemented unit-validated Wind Physics (Betz ceiling & audit detector), user-tariff ROI payback, DCF LCOE, and Solar-Wind Hybrid calculators, live S1223 airfoil plotter, and Three.js `.stl`/`.3mf` 3D CAD viewer via non-destructive `scripts/sync-repo-assets.mjs`.
- Built 34-table Supabase PostgreSQL + strict RBAC RLS migration (`001_pawan_shakti_platform.sql`) and 6 Vercel serverless endpoints (`health`, `inquiries`, `telemetry`, `admin`, `analytics`, `notifications`) including HMAC-SHA256 replay-guarded ESP32 ingestion and monitoring-only safety boundary.

---

## [Unreleased] - 2026-Q4 / 2027

### Planned Work
- Wind tunnel dynamometer calibration of Mark-4 with calibrated torque cell.
- Transition of planetary gear train from 3D-printed ABS to CNC-machined POM (Delrin).
- Fabrication of full-scale contactless magnetic gear coupling test rig.
- Implementation of dedicated 24V synchronous buck-boost MPPT microcontroller firmware.

---

## [Mark-5 / Project KECS] - September 2026

### Added
- 5-rotor star/central planar matrix test fixture mounted on modular 6063 aluminum extrusion chassis.
- Pre-incubation agreement executed with VNIT Ventures Vault Foundation (V3F) on 21–23 September 2026.
- Exploratory CAD models for permanent magnet gear rings ([`engineering/cad/ringforferritemagnetsv2.f3d`](engineering/cad/ringforferritemagnetsv2.f3d)).

### Findings
- The 5-rotor mechanical arrangement demonstrated that compounding tooth mesh friction across 5 simultaneous pinions elevates cut-in threshold ($> 3.0\text{ m/s}$), establishing the practical physical limit of multi-rotor spur gearing.

---

## [Mark-4] - August 2026

### Added
- 4-rotor square planar matrix prototype tested in VNIT flow channel.
- ESP32 automated multi-sensor acquisition gateway for synchronized wind speed, RPM, voltage, and current logging.

### Results
- Measured $36.25\text{ W}$ at $4.5\text{ m/s}$ wind velocity.
- Demonstrated superior torque solidity and lowest cut-in wind speed ($2.4\text{ m/s}$) among multi-rotor configurations.

---

## [Mark-3] - Early 2025 – Mid 2026

### Added
- First physical working prototype featuring 3 clustered rotors with integrated module 2.5 spur gear teeth.
- Integrated 1:10 coaxial planetary gearbox coupled to a 100 W DC generator.
- Outdoor test mast characterization with digital multimeter instrumentation.

### Intellectual Property
- Indian Patent application published: *"Compact Wind Turbine with Planetary Gears"* (2025).

---

## [Initial Architecture & Modeling] - 2023 – 2024

### Added
- Aerodynamic selection of the Selig S1223 high-camber profile for low Reynolds number flow ($Re < 100,000$).
- Autodesk Fusion 360 parametric 3D models and 2D engineering drawings (`drawings1.pdf`, `drawings 2.pdf`).
- FEA structural stress and modal analysis in ANSYS.
- Electrical bus scaling calculations comparing 24V vs. 240V DC links.
