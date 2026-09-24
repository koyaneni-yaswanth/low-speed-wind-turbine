# Changelog: PAWAN SHAKTI Development History

All notable technical updates, hardware revisions, and architectural milestones of the PAWAN SHAKTI project are recorded in this document.

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
