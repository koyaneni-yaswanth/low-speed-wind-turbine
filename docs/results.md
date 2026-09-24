# Results & Performance Synthesis

This document provides a strictly transparent breakdown of PAWAN SHAKTI performance metrics, separating empirical observations from theoretical calculations, component specifications, design targets, and unvalidated parameters.

---

## 1. Experimentally Measured Data

*Results physically recorded during prototype bench and outdoor evaluations at VNIT Nagpur:*

| Metric | Measured Value | Conditions / Setup |
| :--- | :--- | :--- |
| **Physical Cut-In Wind Speed** | $2.3\text{ to }2.5\text{ m/s}$ | Observed spontaneous rotation and voltage generation on Mark-3 and Mark-4 prototypes. |
| **Mark-3 Output at $4.2\text{ m/s}$** | $26.04\text{ W}$ ($12.4\text{ V}$, $2.1\text{ A}$) | Outdoor ground mast run into $5.9\ \Omega$ load bank. |
| **Mark-4 Output at $4.5\text{ m/s}$** | $36.25\text{ W}$ ($14.5\text{ V}$, $2.5\text{ A}$) | Flow channel testing, 4-rotor synchronized configuration. |
| **No-Load Cut-Off Wind Speed** | $> 8.0\text{ m/s}$ sustained | Evaluated without structural deformation; full high-speed storm survival testing remains to be done. |
| **Operating Rotor RPM** | $180\text{--}400\text{ RPM}$ | Optical tachometer measurement under $2.5\text{--}5.5\text{ m/s}$ airflow. |
| **Generator RPM (Stepped-Up)** | $1,800\text{--}3,600\text{ RPM}$ | Verified across 1:10 transmission ratio. |

---

## 2. Calculated Engineering Values

*Values derived from analytical equations, aerodynamic theory, and computational sizing:*

| Parameter | Calculated Value | Governing Equation & Assumptions |
| :--- | :--- | :--- |
| **Available Wind Power at $4.5\text{ m/s}$** | $52.3\text{ W}$ ($D = 1.0\text{ m}$ cluster) | $P_{\text{wind}} = \frac{1}{2} \rho A V^3$ ($\rho = 1.151\text{ kg/m}^3, A = 0.785\text{ m}^2$). |
| **Theoretical Aerodynamic Limit** | $C_{p,\text{Betz}} = 0.593$ | Albert Betz 1D momentum conservation limit. |
| **Estimated Rotor Aerodynamic Yield** | $C_p \approx 0.40\text{--}0.48$ | Calculated from Selig S1223 2D airfoil polar integration at optimal Tip Speed Ratio ($\lambda \approx 2.5$). |
| **Theoretical Blade Radius for 100W at $4.5\text{ m/s}$**| $r \approx 1.13\text{ m}$ ($D \approx 2.26\text{ m}$) | Direct equation solving: $100\text{ W} = 0.5 \times 0.48 \times 1.151 \times \pi r^2 \times (4.5)^3$. |
| **Scaled Single-Rotor Equivalent Area**| $A \approx 4.0\text{ m}^2$ | Required single rotor area to produce continuous 100W at $4.5\text{ m/s}$ without multi-rotor aggregation. |
| **DFIG Stator / Rotor Split (Scaled)** | $77\text{ W}$ stator / $23\text{ W}$ rotor | DFIG slip power partitioning at $s = -0.3$ slip condition. |

---

## 3. Design Specifications

*Hardware specifications determined from design modeling and manufacturer datasheets:*

| Specification | Parameter | Details |
| :--- | :--- | :--- |
| **Rotor Unit Diameter** | $300\text{ mm}$ ($0.3\text{ m}$) | Dimension of individual modular Selig S1223 turbine unit. |
| **Transmission Architecture** | Coaxial Planetary Gearbox | 1:10 speed step-up ratio; $20^\circ$ pressure angle; module 2.5 spur gear teeth. |
| **Generator Rating** | $100\text{ W}$ continuous DC | Nominal $24\text{ V DC}$, rated current $4.16\text{ A}$ (tested alongside $110\text{ V}$, $3500\text{ RPM}$ unit). |
| **Generator Conversion Efficiency** | $80\text{--}85\%$ | Manufacturer rated electromechanical conversion efficiency at nominal speed. |
| **Frame Material** | 6063-T6 Aluminum / Steel | Modular slotted extrusion frame with waterjet aluminum backing plates. |
| **Blade Material** | FDM 3D-Printed ABS | $1.04\text{ g/cm}^3$ density, high infill at root hub, UV protective coating. |

---

## 4. Engineering Targets

*Performance objectives that the project actively aims to achieve through ongoing refinement:*

- **Target Cut-In Wind Speed**: $\le 2.0\text{ m/s}$ through low-friction ceramic bearings and magnetic gearing.
- **Rated Power Threshold**: $100\text{ W}$ electrical output sustained at $5.5\text{ m/s}$.
- **Unit Manufacturing Cost Target**: $\approx ₹35,000$ for mass-production modular package.
- **Operational Wind Range**: $2.0\text{ to }20.0\text{ m/s}$ with passive mechanical furling or electrical dump-load braking.

---

## 5. Parameters Not Yet Validated / Open Research Gaps

> [!WARNING]
> The following parameters require further empirical research before definitive claims can be made:

1. **Overall End-to-End System Efficiency**: While generator electrical efficiency is rated at $80\text{--}85\%$ and aerodynamic $C_p$ is modeled at $0.40\text{--}0.48$, true end-to-end efficiency across the combined aerodynamic-mechanical-electrical chain across full wind curves requires formal dynamometer wind tunnel calibration.
2. **Long-Term Outdoor Durability (FDM Polymers)**: Degradation of 3D-printed ABS gear teeth under continuous atmospheric exposure (solar UV radiation, thermal expansion, dust abrasion) requires 6-month continuous field testing.
3. **Multi-Rotor Aerodynamic Interference**: Wake interaction and mutual boundary-layer interference between closely clustered rotors in the 4-rotor and 5-rotor configurations require formal Particle Image Velocimetry (PIV) or high-fidelity 3D CFD analysis.
4. **Economic Payback & O&M Cost**: The projected 7–8 year payback period and ₹2,000–₹5,000/year maintenance figures represent preliminary economic modeling and must be confirmed through multi-site pilot trial data.
