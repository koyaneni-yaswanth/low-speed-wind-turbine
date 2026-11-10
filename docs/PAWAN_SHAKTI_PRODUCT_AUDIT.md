# PAWAN SHAKTI — Product, Repository & Feature Audit (`Phase 0`)

**Repository:** `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine`  
**Active Branch:** `feature/pawan-shakti-platform` (branched from `main`)  
**Baseline Commits:** `main` (`a19c216`), `feature/pawan-shakti-platform` (`66e3e4e`, `372481f`)  
**Audit Date:** 10 November 2026  
**Audited Stage:** **TRL 4** (Laboratory / Benchtop Prototype Validation)

---

## 1. Repository & Technical Stack Audit Findings

Inspecting all **69 original repository files** (`README.md`, `CHANGELOG.md`, `LICENSE`, `.gitignore`, 13 files in `docs/`, 35 files in `engineering/`, `intellectual-property/README.md`, 4 files in `media/`, 5 files in `reports/`, `team/contributors.md`, and 4 files in `testing/`) plus commit history confirms:

1. **Application Code & Dependencies:** Currently **0% implemented**. No `package.json`, React/Next/Vite frontend, backend server, serverless functions, database migrations, authentication, or automated test suite exist in `low-speed-wind-turbine`.
2. **Hosting & Environment Configuration:** No `vercel.json`, `.env.example`, Supabase linkage, or CI/CD workflows exist in this repository.
3. **Database & Telemetry:** No PostgreSQL schema, RLS policies, device ingestion APIs, or real calibrated >= 1 Hz time-series CSV datasets exist (`testing/raw-data/sample-sensor-log-template.csv` contains 13 illustrative/template rows only).
4. **Engineering & Media Assets Ready to Preserve:** Rich physical assets exist and are preserved unmodified:
   - Real hardware photographs of **Mark-3**, **Mark-4**, and **Mark-5 (KECS)** plus official Pawan Shakti logo ([`media/`](../media/)).
   - Parametric Autodesk Fusion 360 models (`.f3d`), STEP (`back-plate.step`), `25` 3D printable meshes (`.stl`/`.3mf`), `S1223.dat` coordinates, and orthographic drawings (`drawings1.pdf`, `drawings-2.pdf`).
   - Protocol docs (`ESP32-Sensor-Logging-Protocol.md`), V3F Pre-Incubation Summary (`21–23 Sept 2026`), Briefing Note, and Published Patent record (*"Compact Wind Turbine with Planetary Gears"*, 2025 — published & under examination, not granted).
5. **Material/Math/Marketing Conflicts Found:**
   - **TRL Divergence:** Repo `README.md` L398 claims `TRL 4–5`, whereas authoritative founder baseline locks status at **TRL 4**.
   - **Two Architecture Tracks Unresolved:** Authoritative development profile tracks both **Option A (Coaxial magnetic gear + HAWT airfoil, 1:5.5 / 1:10 target ratios, N52, ~1.5 mm air gap)** and **Option B (Archimedes spiral rotor + planetary transmission)** alongside Mark-3/4/5 multi-rotor planetary work (`4-setup` / `3-setup` wooden-frame planetary prototypes).
   - **Unvalidated 1 m² Working Estimates vs Early 100 W / 24 V Rigs vs 1 kW Marketing Echo:** Older docs conflate 300 mm multi-rotor rigs ($A = 0.283\text{ m}^2$), `1 m²` target working assumptions (`~20–25 W @ 5 m/s`, `~95–110 W @ 8 m/s`, `~250–300 W @ 11 m/s`, `300–500 W` coreless PMA class), utility DFIG calculations (`Clear-Calculation-Steps.pdf`), and `main` README marketing text.
   - **Betz-Limit Check:** Claimed Mark-4 output `36.25 W` at `4.5 m/s` exceeds total kinetic power ($14.84\text{ W}$ for $0.283\text{ m}^2$) and Betz max ($8.80\text{ W}$), confirming historical wattage figures must be quarantined as `Historical Prototype Observation — Unverified / Requires Closed-Loop Calibration`.
   - **CAD Duplication & Third-Party Licensing:** `Configuration 2.stl` == `a1a2.stl`; `Model-23.3mf` == `Untitled.3mf`; `frame_cad.3mf` == `frame_cad_1.3mf`; `Archimedes Turbine - 939532.zip` is Thingiverse `CC BY` licensed (separate attribution required).

---

## 2. Mandatory Feature Audit Matrix

| Feature | Existing Status | Evidence | Gap | Priority | Implementation Plan |
|---|---|---|---|---|---|
| **Homepage** | `NOT IMPLEMENTED` (Markdown README only) | `README.md` (429 lines) & `media/` images | No web app, B2B conversion hero, TRL 4 truth badge, architecture overview, FAQ, or working CTAs | **P0** | Phase 1: React+Vite responsive showcase with authentic Mark-3/4/5 photos & verified copy |
| **Product pages** | `NOT IMPLEMENTED` | `engineering/specifications/system-specifications.md`, Section 2.3/2.4 specs | No structured variant specs, Option A vs Option B 16-criterion matrix, or evidence-tier tags | **P0** | Phase 1 & 2: Product overview, architecture comparison workspace, zero invented SKUs |
| **Technical specifications** | `PARTIAL` (Markdown tables & PDFs with conflicts) | `docs/system-architecture.md`, `S1223.dat`, `drawings1.pdf`, `stl-and-3mf/` | Conflicts between ABS/PLA, 24V/110V, DFIG vs PMDC, TRL 4–5 vs TRL 4; no interactive CAD/airfoil tool | **P0** | Phase 1 & 2: Evidence Register locking TRL 4, Three.js 3D STL/3MF viewer, S1223 plotter |
| **Pilot inquiry** | `NOT IMPLEMENTED` | Requirements Section 5.4 & 6; no forms exist | No public site-assessment form, validation, ref ID generation, DB persistence, or 17-stage workflow | **P0** | Phase 2: Full validated Pilot Application & Site Suitability form + `/api/inquiries` + audit trail |
| **ROI calculator** | `NOT IMPLEMENTED` | Only static math notes in `docs/results.md` | No interactive Wind Physics calculator, custom-tariff ROI payback, or Solar-Wind Hybrid estimator | **P0** | Phase 1 & 2: Pure tested `src/lib/physics.ts` powering Wind, ROI, and Hybrid calculators with strict disclosures |
| **Engineering dashboard** | `NOT IMPLEMENTED` | Protocol docs only (`ESP32-Sensor-Logging-Protocol.md`, template CSV) | No turbine registry, live telemetry endpoint, empty-state honesty, power curve binning, Betz checker, or test runs | **P0** | Phase 3: Authenticated `/api/telemetry`, DB schema, honest "No live telemetry connected" state, test-run workflow & charts |
| **Admin dashboard** | `NOT IMPLEMENTED` | None | No auth, RBAC, CMS editor, CAD tagging UI, document visibility toggle, notification queue, or audit viewer | **P1** | Phase 4 & 5: Role-gated Admin Console (`/admin`) with Supabase Auth & immutable audit logs |
| **Customer CRM** | `NOT IMPLEMENTED` | Zero customer/interview/LOI records in repo | Need 17-stage pipeline, organizations, contacts, discovery notes, follow-ups with honest `0` baseline until real entries added | **P0** | Phase 2 & 4: Authenticated CRM module inside `/admin` backed by normalized Supabase CRM tables |
| **SEO** | `NOT IMPLEMENTED` | None | Missing semantic HTML, route metadata, canonical tags, `sitemap.xml`, `robots.txt`, OpenGraph, and JSON-LD | **P1** | Phase 1 & 6: Route meta controller + static SEO artifacts (`sitemap.xml`, `robots.txt`) |
| **Analytics** | `NOT IMPLEMENTED` | None | Need privacy-preserving page/calculator/funnel event tracking with consent & zero PII leakage | **P1** | Phase 2 & 5: `/api/analytics` + consent-aware event logger + funnel conversion view |
| **Mobile** | `NOT IMPLEMENTED` | None | No responsive breakpoints, touch targets, accessible mobile nav, or viewport verification | **P0** | Phases 1–6: Tailwind responsive-first UI verified via headless Chromium at `375px`, `768px`, and `1440px` |
