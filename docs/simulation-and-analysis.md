# Simulation & Numerical Analysis

## Engineering Principle: Simulation $\neq$ Physical Test

> [!IMPORTANT]
> Numerical simulations (FEA and computational modeling) provide critical design guidance, stress identification, and qualitative behavioral trends. However, **simulations are not physical validations**. Real-world performance includes fluid turbulence, boundary-layer transitions, manufacturing surface roughness, backlash, and electromechanical losses that idealized numerical models cannot fully capture.

---

## 1. Simulation Objectives

Finite Element Analysis (FEA) and aerodynamic modeling were conducted in ANSYS and Fusion 360 Simulation with three primary objectives:
1. **Structural Integrity Evaluation**: Verify that additive-manufactured ABS rotor blades and gear teeth withstand maximum operating aerodynamic thrust and centrifugal loads without exceeding material yield limits.
2. **Deflection & Clearance Verification**: Assess blade tip deflection under aerodynamic drag forces to ensure blades do not deflect into the frame or adjacent rotors.
3. **Stress Concentration Identification**: Locate peak von Mises stress zones at the blade root fillets, gear tooth roots, and shaft hub junctions to optimize fillet radii and print infill density.

---

## 2. Computational Setup & Boundary Conditions

### A. Material Assumptions
Simulations modeled isotropic and orthotropic properties corresponding to 3D-printed Acrylonitrile Butadiene Styrene (ABS) and structural 6061-T6 Aluminum:

| Property | 3D-Printed ABS (As-Built FDM) | 6061-T6 Aluminum (Frame / Backplate) |
| :--- | :--- | :--- |
| **Density ($\rho$)** | $1,040\text{ kg/m}^3$ | $2,700\text{ kg/m}^3$ |
| **Young's Modulus ($E$)** | $1.8\text{--}2.2\text{ GPa}$ (directionally dependent) | $68.9\text{ GPa}$ |
| **Poisson's Ratio ($\nu$)** | $0.35$ | $0.33$ |
| **Tensile Yield Strength ($\sigma_y$)** | $28\text{--}35\text{ MPa}$ (inter-layer limit: $\approx 20\text{ MPa}$) | $276\text{ MPa}$ |
| **Ultimate Tensile Strength ($\sigma_u$)**| $35\text{--}42\text{ MPa}$ | $310\text{ MPa}$ |

### B. Geometry & Meshing
- **Blade Geometry**: Selig S1223 airfoil section extruded with variable chord and twist distribution along the span ($R = 150\text{ mm}$).
- **Mesh Type**: Unstructured tetrahedral elements with localized prism boundary layer refinement along blade root fillets and gear tooth roots.
- **Mesh Sensitivity**: Verified by comparing peak stress between coarse ($1.5\text{ mm}$ element size) and refined ($0.4\text{ mm}$ fillet refinement) meshes until stress convergence within $5\%$ was achieved.

### C. Boundary Conditions & Applied Loads
1. **Fixed Constraints**: The central shaft bore and mounting hub faces were fully constrained in all degrees of freedom ($u_x = u_y = u_z = 0$).
2. **Centrifugal Load**: Rotational velocity applied about the central axis up to extreme overspeed conditions ($\omega_{\max} = 1,200\text{ RPM} \approx 125.7\text{ rad/s}$).
3. **Aerodynamic Thrust & Torque**: Pressure distribution mapped over the blade surface representing extreme aerodynamic load at $V = 15\text{ m/s}$ ($P_{\text{dyn}} \approx 130\text{ Pa}$).

---

## 3. Results vs. Interpretation

```
+-----------------------------------------------------------------------------------------+
| NUMERICAL SIMULATION RESULT (FEA)       | ENGINEERING INTERPRETATION                    |
+-----------------------------------------+-----------------------------------------------+
| - Peak von Mises stress: 8.2 MPa        | - Factor of safety (FoS) > 2.4 relative to    |
|   located at the root trailing-edge     |   layer bonding limit (~20 MPa).              |
|   fillet during maximum overspeed.      | - Root fillet radius was enlarged from 1.5mm  |
|                                         |   to 3.0mm to mitigate stress concentration.  |
|                                         |                                               |
| - Maximum blade tip displacement:       | - Deflection is well within the 25 mm axial   |
|   1.8 mm in the axial downstream        |   clearance between the rotor plane and the   |
|   direction at 12 m/s equivalent drag.  |   support extrusion frame. No collision risk. |
|                                         |                                               |
| - Gear tooth bending stress at root:    | - Module 2.5 spur tooth geometry is adequate  |
|   11.4 MPa under rated torque transfer. |   for steady loads, but cyclic fatigue and    |
|                                         |   impact shock require metal or nylon pinion. |
+-----------------------------------------+-----------------------------------------------+
```

---

## 4. Modeling Limitations & Boundary-to-Reality Gaps

1. **Anisotropy of Additive Manufacturing**: Standard FEA treats the material as isotropic. FDM 3D-printed parts exhibit lower tensile strength along the Z-axis (inter-layer cleavage) than along the X-Y print plane. Print orientation was specifically oriented along the blade span to ensure continuous filament lines carry tensile bending loads.
2. **Unsteady Aerodynamics**: Static pressure mapping does not account for turbulent wind gusts, wake shedding, dynamic stall, or cross-rotor aerodynamic interference between adjacent propellers in the multi-rotor array.
3. **Thermal & Creep Effects**: Polymer gear teeth experience frictional heating at high rotational speeds, which can cause localized thermal softening not accounted for in linear elastic simulations.
