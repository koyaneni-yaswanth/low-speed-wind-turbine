# Development Roadmap & Next Engineering Steps

This roadmap outlines the technical milestones required to transition PAWAN SHAKTI from an academic laboratory prototype into a robust, field-hardened distributed wind power system.

---

```
  Phase 1 (Months 1–3)        Phase 2 (Months 4–9)          Phase 3 (Months 10–18)
  Bench Calibration &         Extended Outdoor Field        Magnetic Gearing &
  Custom MPPT PCB Design      Trials & Durability Study     Pilot Demonstrations
         |                           |                             |
         v                           v                             v
  - Wind tunnel dynamometry   - 6-month rooftop deployment  - Contactless transmission
  - Coreless generator tests  - Cellular/LoRa telemetry     - Injection molding tooling
  - Machined Delrin gears     - Dynamic storm braking       - Off-grid pilot sites
```

---

## Phase 1: Near-Term Engineering Refinements (Months 1 – 3)

### 1. Precision Wind Tunnel Dynamometer Calibration
- **Objective**: Establish certified aerodynamic and electromechanical efficiency curves ($C_p\text{--}\lambda$ and $P\text{--}V_w$) across continuous flow velocities from $1.5\text{ to }10.0\text{ m/s}$.
- **Methodology**: Mount Mark-4 rotor cluster in the VNIT wind tunnel with an active torque transducer and calibrated optical encoder to measure mechanical torque before the generator.

### 2. Dedicated 24V Synchronous MPPT Charge Controller
- **Objective**: Replace passive diode rectification with an active synchronous buck-boost Maximum Power Point Tracking (MPPT) power electronic stage.
- **Specification**: Microcontroller-driven perturb-and-observe (P&O) algorithm tuned for rapid tracking during low-wind velocity ramps.

### 3. Precision Subtractive / Molded Gear Fabrication
- **Objective**: Eliminate FDM 3D-printing surface roughness and layer-cleavage failure modes in the transmission.
- **Specification**: CNC machine the sun and planet gears from Polyoxymethylene (POM / Delrin) and aerospace-grade 7075 Aluminum to minimize friction and tooth wear.

---

## Phase 2: Medium-Term Field Validation & Durability (Months 4 – 9)

### 1. Six-Month Continuous Rooftop Deployment
- **Objective**: Measure real-world energy harvest, weatherability, and reliability under natural diurnal wind variations on the VNIT Campus.
- **Monitoring**: Autonomous ESP32/LoRa logging platform recording wind speed, direction, ambient temperature, vibration, voltage, current, and accumulated watt-hours.

### 2. High-Wind Storm Survivability & Furling
- **Objective**: Validate overspeed protection mechanisms when wind velocity exceeds $15.0\text{ m/s}$.
- **Mechanism**: Implement passive aerodynamic furling (tail hinge deflection) combined with an active solid-state electronic dump load.

### 3. Environmental Degradation Analysis
- **Objective**: Evaluate polymer embrittlement, UV discoloration, bearing seal efficacy, and moisture ingress following seasonal monsoon exposure.

---

## Phase 3: Advanced Transmission & Pilot Scaling (Months 10 – 18)

### 1. Full Integration of Contactless Magnetic Gearing
- **Objective**: Build and benchmark a fully functional magnetic gear transmission based on [`engineering/cad/ringforferritemagnetsv2.f3d`](../engineering/cad/ringforferritemagnetsv2.f3d).
- **Goal**: Achieve zero-wear, zero-friction speed step-up to push cut-in velocity below $2.0\text{ m/s}$.

### 2. Off-Grid Pilot Demonstrations
- **Objective**: Deploy 3 to 5 pilot units at real-world inland field sites:
  - Rural medical clinic emergency lighting backup.
  - Remote weather / agricultural telemetry station.
  - Solar-wind hybrid microgrid installation.

### 3. Design for Manufacturing (DFM) & Cost Rationalization
- **Objective**: Transition from low-volume prototyping to mass-production tooling (injection-molded rotor blades and die-cast aluminum frame brackets), establishing verified bills of materials to achieve the ₹35,000 target unit cost.
