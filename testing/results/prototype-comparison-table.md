# Prototype Comparative Benchmarks (Configurations A, B, C)

This benchmark compiles the experimental observations across the three developed prototype configurations of PAWAN SHAKTI.

---

## Configuration Matrix Summary

| Parameter | Configuration A (Mark-3) | Configuration B (Mark-4) | Configuration C (Mark-5 / KECS) |
| :--- | :--- | :--- | :--- |
| **Aero Architecture** | 3-Rotor Clustered Array | 4-Rotor Planar Matrix | 5-Rotor Star/Central Array |
| **Rotor Diameter (Each)** | $300\text{ mm}$ ($0.3\text{ m}$) | $300\text{ mm}$ ($0.3\text{ m}$) | $300\text{ mm}$ ($0.3\text{ m}$) |
| **Total Effective Swept Area**| $\approx 0.21\text{ m}^2$ | $\approx 0.28\text{ m}^2$ | $\approx 0.35\text{ m}^2$ |
| **Airfoil Profile** | Selig S1223 high-lift | Selig S1223 high-lift | Selig S1223 high-lift |
| **Transmission Arrangement** | Coaxial Planetary Gearbox | Coaxial Planetary / Spur | Multi-pinion spur cluster |
| **Step-Up Ratio** | 1:10 | 1:10 | 1:10 |
| **Observed Cut-In Velocity** | **$2.3\text{--}2.5\text{ m/s}$** | **$2.4\text{--}2.6\text{ m/s}$** | **$2.8\text{--}3.2\text{ m/s}$** (Higher starting friction) |
| **Measured Power at $3.5\text{ m/s}$** | $17.49\text{ W}$ | $21.09\text{ W}$ ($+20.5\%$) | $9.79\text{ W}$ (Degraded by gear drag) |
| **Measured Power at $4.5\text{ m/s}$** | $31.2\text{ W}$ (interpolated) | $36.25\text{ W}$ | $24.8\text{ W}$ |
| **Mechanical Complexity** | Low-Medium (single carrier) | Medium (dual-stage linkage)| High (5 meshing interfaces) |
| **Acoustic Noise / Vibration** | Minimal ($< 45\text{ dB}$) | Moderate ($< 52\text{ dB}$) | Noticeable tooth rattling ($> 60\text{ dB}$) |
| **Overall Assessment** | **Clean baseline prototype** | **Highest empirical efficiency**| **Excessive mechanical loss**; proves limit of mechanical gearing |

---

## Key Experimental Findings

1. **Torque Solidity vs. Swept Area**:
   Transitioning from 3 rotors (Config A) to 4 rotors (Config B) provided a $33\%$ increase in physical swept area and yielded a proportional $+20\text{--}21\%$ gain in electrical power output while maintaining an early cut-in speed ($2.4\text{ m/s}$).
2. **The Frictional Drag Ceiling in Config C**:
   Expanding to 5 rotors in Config C increased frontal area, but the accumulation of tooth contact friction across 5 separate meshing pinions raised the cut-in wind speed to $\approx 3.0\text{ m/s}$ and dissipated substantial kinetic energy as friction and heat.
3. **Engineering Decision**:
   Configuration B represents the optimal physical layout for multi-rotor harvesting. Future iterations will replace the physical spur teeth in Config B with **contactless magnetic gears** to decouple rotor clustering from mechanical friction penalties.
