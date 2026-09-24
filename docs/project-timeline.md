# Project Development Timeline

This factual timeline chronicles the documented engineering development, intellectual property, testing milestones, and institutional backing of the PAWAN SHAKTI initiative.

---

```
  2023 - 2024          Early 2025            May 2025          July - Aug 2026      Sept 2026+
  Conceptual &       Mark-3 Prototype       Fusion 360 CAD     ESP32 Sensor Test   VNIT Pre-Incubation
  Aerodynamic R&D    & Planetary Gear      Formal Drawings     Runs (Configs A,B)  & Magnetic Gear R&D
       o-------------------o--------------------o----------------------o-------------------o
```

---

## Chronological Milestones

### 2023 – 2024: Problem Identification & Preliminary Modeling
- **Milestone**: Identification of low-wind-speed limitations for inland Indian micro-power applications.
- **Engineering Activity**: Initial aerodynamic study on low-Reynolds-number airfoils; identification of the Selig S1223 high-camber profile.
- **Evidence / Output**: Selig airfoil coordinate database integration ([`engineering/airfoil/S1223.dat`](../engineering/airfoil/S1223.dat)) and preliminary Betz limit scaling derivations.

### Early 2025: Mark-3 Prototype & Patent Publication
- **Milestone**: Fabrication of the first integrated multi-rotor prototype (Mark-3, 3-rotor layout).
- **Engineering Activity**: 3D printing of ABS rotor impellers with integrated module 2.5 gear teeth; coaxial planetary gearbox integration with DC generator.
- **Intellectual Property**: Publication of Indian Patent: *"Compact Wind Turbine with Planetary Gears"* (2025).
- **Evidence / Output**: Physical prototype photographs ([`media/prototype/mark-3-three-rotor-prototype.png`](../media/prototype/mark-3-three-rotor-prototype.png)).

### May 2025: Formal CAD Assemblies & Engineering Drawings
- **Milestone**: Comprehensive CAD mechanical modeling in Autodesk Fusion 360.
- **Engineering Activity**: Full assembly modeling, backplate machining drawings, structural extrusion framing, and gear tooth profile verification.
- **Evidence / Output**: Formal 2D Engineering Drawings issued on **18 May 2025** ([`engineering/drawings/drawings1.pdf`](../engineering/drawings/drawings1.pdf) and [`engineering/drawings/drawings-2.pdf`](../engineering/drawings/drawings-2.pdf)).

### Late 2025 – Early 2026: Multi-Rotor Matrix Evaluation (Mark-4 & Mark-5)
- **Milestone**: Development and bench evaluation of 4-rotor (Mark-4) and 5-rotor (Mark-5 / Project KECS) prototypes.
- **Engineering Activity**: Investigation of power combining from multiple rotors; flow channel evaluations in VNIT aerodynamics facilities.
- **Evidence / Output**: Physical test rig photographs ([`media/prototype/mark-4-four-rotor-prototype.png`](../media/prototype/mark-4-four-rotor-prototype.png) and [`media/prototype/mark-5-five-rotor-kecs-prototype.jpg`](../media/prototype/mark-5-five-rotor-kecs-prototype.jpg)).

### July – August 2026: Sensor Instrumentation & Testing Protocols
- **Milestone**: Implementation of ESP32 automated multi-sensor datalogging architecture.
- **Engineering Activity**: Integration of cup anemometer, optical tachometers, voltage/current ADCs, and vibration sensors; establishment of comparative rotation test protocols across Configurations A, B, and C.
- **Evidence / Output**: Intern Task Brief documented on **29 July 2026** ([`testing/test-protocols/ESP32-Sensor-Logging-Protocol.md`](../testing/test-protocols/ESP32-Sensor-Logging-Protocol.md)).

### September 2026: Pre-Incubation Agreement & Institutional Expansion
- **Milestone**: Formal institutional backing and incubation approval.
- **Institutional Milestone**: Execution of Pre-Incubation Agreement with **VNIT Ventures Vault Foundation (V3F)**, VNIT Nagpur (Effective Date: **21 September 2026**; signed **23 September 2026**).
- **Research Expansion**: Support acknowledged under ANRF accelerated research grant schemes; exploratory development of magnetic contactless gearing.
- **Evidence / Output**: Pre-incubation records ([`reports/VNIT-Pre-Incubation-Agreement-Summary.md`](../reports/VNIT-Pre-Incubation-Agreement-Summary.md)) and magnetic gear CAD models ([`engineering/cad/ringforferritemagnetsv2.f3d`](../engineering/cad/ringforferritemagnetsv2.f3d)).
