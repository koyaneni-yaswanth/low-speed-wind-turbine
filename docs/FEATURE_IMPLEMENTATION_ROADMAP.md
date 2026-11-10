# PAWAN SHAKTI — Proposed Platform Architecture & Feature Implementation Roadmap

**Repository:** `https://github.com/koyaneni-yaswanth/low-speed-wind-turbine`  
**Branch:** `feature/pawan-shakti-platform`  
**Audit Companion:** [`REPOSITORY_AUDIT_REPORT.md`](./REPOSITORY_AUDIT_REPORT.md)  
**Target:** Production-ready PAWAN SHAKTI public engineering showcase + private R&D / V3F incubation workbench backed by persistent database, authenticated admin controls, real CAD/Airfoil/Telemetry inspection, and strict evidentiary truthfulness.

---

## 1. Proposed System Architecture

### 1.1 Preservation-First Repository Layout
Original directories (`docs/`, `engineering/`, `intellectual-property/`, `media/`, `reports/`, `team/`, `testing/`, `LICENSE`, `CHANGELOG.md`, `README.md`) remain **intact and unmodified**. Application code integrates alongside them cleanly for standard Vercel + Vite full-stack deployment:

```text
low-speed-wind-turbine/
├── docs/                                # UNTOUCHED original 13 docs + V2 Audit & Roadmap docs
├── engineering/                         # UNTOUCHED CAD (.f3d, .step, .stl, .3mf), S1223.dat, PDFs, specs
├── intellectual-property/               # UNTOUCHED IP records
├── media/                               # UNTOUCHED logo & Mark-3/4/5 photos
├── reports/                             # UNTOUCHED briefing note, V3F summary, presentations
├── team/                                # UNTOUCHED contributor matrix
├── testing/                             # UNTOUCHED protocols, comparison table & sample CSV
├── scripts/
│   └── sync-repo-assets.mjs             # Non-destructive bundler indexing engineering/media into public/ & JSON manifest
├── src/
│   ├── data/verifiedBaseline.ts         # Strictly typed Pawan Shakti seed data tagged by EvidentiaryTier
│   ├── lib/physics.ts                   # Exact Wind/Betz/Gear/Electrical physics & anomaly validator
│   ├── lib/supabase.ts                  # Auth/DB client (safe env guard + offline demo-read fallback)
│   ├── components/
│   │   ├── cad/ModelViewer3D.tsx        # Real browser 3D STL/3MF viewer + wireframe/measure/metadata
│   │   ├── charts/PowerCurveCharts.tsx  # Measured vs Betz ceiling vs Calculated S1223 plots
│   │   └── common/EvidenceBadge.tsx     # Mandatory [MEASURED] / [HISTORICAL] / [CALCULATED] / [SPEC] / [TARGET] badge
│   └── pages/
│       ├── ShowcasePage.tsx             # Public Overview, TRL 4 status, Mark-3/4/5 evolution, V3F & Published Patent
│       ├── EngineeringLabPage.tsx       # S1223 Airfoil plotter, Gearbox vs Magnetic Gear explorer, Physics Sandbox
│       ├── CadVaultPage.tsx             # Interactive 3D STL/3MF inspector, STEP/F3D/PDF drawing archive + duplicate tags
│       ├── TelemetryHubPage.tsx         # CSV upload/validation (ESP32 schema), Betz violation checker, Mark-3/4/5 runs
│       ├── ShootoutPage.tsx             # Pod A (Magnetic Gear) vs Pod B (Planetary) workbench & TRL Gate tracker
│       ├── PilotInquiryPage.tsx         # Real persistent Pilot Site Qualification / Research Contact form
│       └── AdminConsolePage.tsx         # Supabase-authenticated Founder/Mentor portal for managing records & inquiries
├── api/                                 # Vercel Serverless endpoints (strict <= 12 Hobby budget)
│   ├── health.ts                        # DB & asset manifest readiness probe
│   ├── telemetry/ingest.ts              # Authenticated CSV/ESP32 ingestion + server-side P=V*I & Betz check
│   ├── inquiries/submit.ts              # Validated public pilot/partnership form + rate/honeypot spam guard
│   └── admin/records.ts                 # Protected CRUD for prototypes, CAD metadata, IP & milestones
├── supabase/
│   └── migrations/001_pawan_shakti.sql  # Relational schema + strict RLS (public read curated, auth admin write)
└── tests/                               # Node unit + physics + CSV parser + security/RLS integration tests
```

### 1.2 Stack Rationale
- **Frontend:** **React 19 + TypeScript + Vite + Tailwind CSS** with **Three.js (`STLLoader`, `3MFLoader`)** for genuine interactive 3D rendering of the repository's `.stl` and `.3mf` files directly in the browser (plus inline SVG/Canvas S1223 airfoil visualizer and PDF/image previews). Matches your existing stack in `yashwanth-hub` for seamless maintenance.
- **Backend & Persistence:** **Vercel Serverless Functions (`api/`) + Supabase PostgreSQL + Supabase Auth** with **strict Row-Level Security (RLS)** and schema-validated REST APIs. When cloud credentials are absent locally, read-only public views operate seamlessly from the verified build manifest (`verifiedBaseline.ts`) while writes honestly report unconfigured DB status cleanly without faking success messages.
- **Truthfulness & Physics Guardrails (Code-Enforced):**
  - Every metric carries a required `evidenceTier`: `'MEASURED' | 'HISTORICAL_UNVERIFIED' | 'CALCULATED' | 'SPECIFICATION' | 'TARGET'`.
  - Automated CSV ingestion computes $P_{\text{wind}} = \frac{1}{2}\rho A V^3$, $P_{\text{elec}} = V \times I$, and instantaneous $C_p = P_{\text{elec}} / P_{\text{wind}}$, **automatically flagging any row exceeding the Betz limit ($C_p > 0.593$) or realistic small-scale cap ($C_p > 0.35$) as unphysical / jet-concentrated / calibration-required**.
  - TRL badge is locked to **TRL 4**; Patent status explicitly reads **Published Indian Patent Application (2025) — Under Examination (Not Granted)**.

### 1.3 Database & Security Model (`supabase/migrations/001_pawan_shakti.sql`)
- `prototypes` (`mark_3`, `mark_4`, `mark_5`, future `mark_6`): configuration, frame/blade materials, swept area, evidentiary status, photo URI, notes.
- `cad_assets`: filename, path, format (`.f3d`, `.step`, `.stl`, `.3mf`, `.pdf`), vertex/triangle counts, duplicate cluster ID, license tag (e.g., `MIT - Pawan Shakti` vs `CC-BY 3.0 - Third-Party Thingiverse 939532`), revision notes.
- `test_campaigns` & `telemetry_readings`: timestamp, `config_id`, calibrated `wind_speed_ms`, `rotor_rpm`, `voltage_v`, `current_a`, computed `power_w`, `triaxial_vib`, computed `cp_ratio`, `betz_flag`, `is_calibrated_load`.
- `drivetrain_shootout_runs`: Pod A (Coaxial Magnetic Gear) vs Pod B (1:10 Coaxial Planetary) benchtop dynamometer scorecards (cut-in torque, efficiency, thermal rise, unit BOM estimate).
- `ip_and_milestones`: IP filings, V3F pre-incubation milestones (`21–23 Sept 2026`), verified audit action items.
- `pilot_inquiries`: public form submissions (site wind estimate, load wattage, contact email, consent) with write-once insert policy (`anon` can `INSERT` validated rows ONLY via `/api/inquiries/submit`, never `SELECT` others' submissions).
- **RLS Policy:** Public anonymous users can `SELECT` curated published records (`prototypes`, `cad_assets`, `test_campaigns`, non-sensitive `ip_and_milestones`); authenticated admins (`admin_users` allowlist / JWT claim) can `INSERT/UPDATE/DELETE` and read `pilot_inquiries` & unredacted raw logs.

---

## 2. Prioritized Feature Implementation Roadmap

### Phase 1 — Foundation, Verified Data Layer, Navigation & Public Showcase (Priority: **P0**)
**Dependencies:** Audit Report complete; asset sync script for `media/`, `engineering/`, `reports/`.  
**Scope:**
- Initialize TypeScript + Vite + React + Tailwind app shell inside `low-speed-wind-turbine` preserving all original engineering files.
- Create non-destructive asset sync script copying servable assets (`media/*`, `engineering/airfoil/S1223.dat`, `engineering/cad/stl-and-3mf/*.{stl,3mf}`, `engineering/drawings/*.pdf`) into `public/repo-assets/` during build without altering originals.
- Build `verifiedBaseline.ts` and `lib/physics.ts` strictly grounded in the audit (Mark-3, Mark-4, Mark-5 photos/specs, TRL 4 badge, Published Patent disclaimer, zero invented customers/grants/revenue).
- Implement responsive Public Showcase (`ShowcasePage`), Team/V3F/Academic attribution (`Contributors` + `VNIT V3F` 21–23 Sept 2026 record), and IP disclosure tracker.
**Acceptance Criteria:**
- Zero original files overwritten or deleted (`git diff` shows only additive platform files + audit docs).
- Desktop (1440px) & mobile (375px) responsive navigation renders cleanly with zero console errors.
- `npm run build` and `lib/physics.ts` unit tests pass (`P = V * I`, Betz limit check catches `36.25W / 14.84W` discrepancy).

### Phase 2 — Interactive Engineering Lab, Airfoil Analyzer & 3D CAD Vault (Priority: **P0**)
**Dependencies:** Phase 1 app shell & asset sync script.  
**Scope:**
- Build **S1223 Airfoil & Aerodynamic Workbench**: parses real `engineering/airfoil/S1223.dat`, renders interactive camber/thickness chord profile, and computes interactive $P_{\text{wind}}(V, D, \rho)$ and planetary step-up ($\omega_{\text{gen}} = i \cdot \omega_{\text{rotor}}$, torque $T_{\text{gen}}$) curves with `[CALCULATED]` tags.
- Build **CAD & Drawings Vault (`CadVaultPage`)**: catalogs all `31` CAD files + `2` PDF technical drawings, highlights the duplicate STL/3MF pairs (`Configuration 2.stl` = `a1a2.stl`, `Model-23.3mf` = `Untitled.3mf`), displays Thingiverse `CC-BY` attribution on `Archimedes Turbine - 939532.zip`, and renders **real interactive 3D previews** (rotate/zoom/wireframe/bounding box) of `.stl` and `.3mf` models via Three.js!
- Embed interactive viewer/links for `drawings1.pdf` & `drawings-2.pdf`.
**Acceptance Criteria:**
- Every `.stl` and `.3mf` file metadata entry matches actual file byte size and triangle/vertex counts.
- Three.js canvas renders `fan gear.3mf`, `ringforferritemagnetsv2.stl`, and `magnetic gear.3mf` cleanly in browser with interactive orbit controls and mobile responsiveness.

### Phase 3 — Database Schema, RLS Security & Real Telemetry / Shootout Engine (Priority: **P0**)
**Dependencies:** Phase 1 & Phase 2.  
**Scope:**
- Create `supabase/migrations/001_pawan_shakti.sql` with tables, foreign keys, evidence enums, and strict RLS policies.
- Implement `api/health.ts` and `api/telemetry/ingest.ts` with authenticated ESP32 CSV upload/parsing matching `testing/test-protocols/ESP32-Sensor-Logging-Protocol.md` columns (`Timestamp, Config_ID, Voltage_V, Current_A, Power_W, Rotor_RPM, Wind_Speed_ms, Wind_Direction, Vib_XYZ_g, Notes`).
- Enforce automatic **Betz-Limit & Physics Sanity Audit** on uploaded rows + side-by-side Mark-3/4/5 historical visualization clearly warning about `sample-sensor-log-template.csv` status.
- Implement **Pod A (Magnetic Gear) vs Pod B (Planetary Gearbox) Dyno Shootout & TRL Gate Tracker** allowing calibrated logging of dyno shootout criteria without unverified placeholder scores.
**Acceptance Criteria:**
- Unauthenticated write attempts to `/api/telemetry/ingest` and `/api/admin/records` return `401 Unauthorized`.
- Uploading `sample-sensor-log-template.csv` parses all 13 rows accurately, recomputes `V * I`, flags Betz anomalies accurately, and handles missing cloud DB env vars gracefully (`503` diagnostic message, zero fake success).

### Phase 4 — Working Forms, Pilot Qualification Portal & Secure Admin Console (Priority: **P1**)
**Dependencies:** Phase 3 DB schema & API layer.  
**Scope:**
- Implement `api/inquiries/submit.ts` + `PilotInquiryPage.tsx` for research collaboration, VNIT pilot site qualification, or technical inquiries with strict client+server Zod/TypeScript validation, honeypot spam guard, and persistent storage (or honest offline configuration error if Supabase env vars are absent).
- Implement `api/admin/records.ts` + `AdminConsolePage.tsx` with Supabase Email/OAuth authentication allowing authorized admins to add new calibrated test campaigns, update CAD asset descriptions (for `t.3mf`, `rt.3mf`, etc.), log patent examination updates (`Application No.`, `Status`), and review/triage pilot inquiries.
**Acceptance Criteria:**
- Anonymous users cannot access `/admin` write endpoints or read other users' inquiries.
- Validated pilot inquiry round-trips through API handler unit/integration tests cleanly.

### Phase 5 — Final Hardening, Automated Verification, Audit Alignment & Deployment Docs (Priority: **P1**)
**Dependencies:** Phases 1–4.  
**Scope:**
- Full `tsc -b`, ESLint, `npm test` (unit + physics + CSV + API security + asset integrity), Playwright/headless or runtime dev render verification across desktop (`1440px`) and mobile (`375px`), and `vite build`.
- Write `docs/DEPLOYMENT_AND_OPERATIONS.md` detailing Supabase migration execution, Vercel env vars, ESP32 POST webhook integration example, and founder manual checklist (filling missing patent number, physical rotor dimensions, and real CSV uploads).
**Acceptance Criteria:**
- Zero TypeScript errors, zero lint errors, 100% passing test suite after final edit, clean production build, and honest implementation report separating locally verified features from live-cloud env dependencies.
