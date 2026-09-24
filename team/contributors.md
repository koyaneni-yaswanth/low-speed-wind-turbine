# Project Contributors & Contribution Matrix

Transparent attribution is critical in scientific and engineering research. This document delineates individual responsibilities, academic mentorship, and institutional support for the PAWAN SHAKTI initiative.

---

## 1. Core Contributor: Koyaneni Yaswanth

**Founder & Engineering Lead**  
*B.Tech. Metallurgical and Materials Engineering*  
*Visvesvaraya National Institute of Technology (VNIT), Nagpur*  
- **Email**: [koyaneniyaswanth@gmail.com](mailto:koyaneniyaswanth@gmail.com)  
- **GitHub**: [@koyaneni-yaswanth](https://github.com/koyaneni-yaswanth)  
- **LinkedIn**: [Koyaneni Yaswanth](https://www.linkedin.com/in/koyaneni-yaswanth/)

### Detailed Individual Contributions:
- **Project Conceptualization**: Formulated the initial research hypothesis investigating whether multi-rotor clustering and compact planetary step-up gearing could unlock practical wind energy generation in low-wind inland India ($1.5\text{--}5.0\text{ m/s}$).
- **Mechanical & Transmission Design**: Designed the coaxial planetary gearbox step-up mechanisms, spur gear tooth profiles (module 2.5, $20^\circ$ pressure angle), and bearing support backplates.
- **CAD Modeling**: Built all 3D assemblies, exploded views, and 2D engineering drawings in Autodesk Fusion 360 ([`drawings1.pdf`](../engineering/drawings/drawings1.pdf), [`fan-gear.f3d`](../engineering/cad/fan-gear.f3d), [`Model-23.f3d`](../engineering/cad/Model-23.f3d)).
- **Airfoil Integration & Aerodynamics**: Evaluated Selig S1223 airfoil coordinates ([`S1223.dat`](../engineering/airfoil/S1223.dat)) for low Reynolds number operation; designed high-solidity multi-blade impellers.
- **Finite Element Analysis (FEA)**: Executed structural stress and deformation analyses in ANSYS and Fusion 360 Simulation on 3D-printed ABS blades and gear tooth roots.
- **Hands-On Prototype Fabrication**: 3D printed, post-processed, bench-aligned, and assembled Mark-3, Mark-4, and Mark-5 physical prototypes.
- **Sensor Telemetry & Testing**: Architected the ESP32 multi-sensor data acquisition system; conducted outdoor and flow bench test runs; collected voltage, current, and RPM logs.
- **Intellectual Property & Project Leadership**: Authored and filed the Indian Patent *"Compact Wind Turbine with Planetary Gears"* (Published 2025); negotiated and secured pre-incubation with the VNIT Ventures Vault Foundation (V3F).

---

## 2. Academic Mentorship: Dr. Jawahar Bhukya

**Academic Mentor & Research Advisor**  
*Assistant Professor, Department of Electrical and Electronics Engineering*  
*Visvesvaraya National Institute of Technology (VNIT), Nagpur*  
- **Institutional Profile**: [VNIT Faculty Directory](https://eee.vnit.ac.in)
- **Role & Contributions**:
  - Provided strategic research direction and academic oversight on wind energy conversion systems (WECS).
  - Guided electrical generator selection, power system integration, and grid/battery interfacing calculations.
  - Facilitated access to VNIT departmental laboratory infrastructure, instrumentation, and testing equipment.
  - Co-author on academic research papers on low-wind rooftop systems and space-efficient multi-rotor power generation.

---

## 3. Institutional & Incubator Backing

### VNIT Ventures Vault Foundation (V3F)
- **Status**: Pre-Incubator (Pre-incubation Agreement executed September 2026).
- **Facilities**: 3rd Floor, New Library Building, VNIT Campus, South Ambazari Road, Nagpur.
- **Role**: Provides entrepreneurship mentorship, intellectual property advisory, prototyping workspace, and access to national grant schemes.

### Research Grants & Schemes
- Supported under the **Anusandhan National Research Foundation (ANRF)** accelerated research framework and the **CBDE R&D Scheme**.

---

## 4. Student & Intern Collaborators

- **Testing & Data Logging Assistants**: Supported rotational test runs, anemometer pulse counter wiring on ESP32, and data logging tasks as structured in [`testing/test-protocols/ESP32-Sensor-Logging-Protocol.md`](../testing/test-protocols/ESP32-Sensor-Logging-Protocol.md).
