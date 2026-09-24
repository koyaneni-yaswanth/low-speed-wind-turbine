# Project Overview: PAWAN SHAKTI

## Executive Summary

**PAWAN SHAKTI** is an engineering research and prototype-development initiative investigating compact, distributed wind-energy harvesting tailored for inland, low-wind-speed regimes ($1.5 \text{ to } 5.0\text{ m/s}$). Initiated by **Koyaneni Yaswanth** at the **Visvesvaraya National Institute of Technology (VNIT), Nagpur** under the academic mentorship of **Dr. Jawahar Bhukya** (Department of Electrical and Electronics Engineering), the project explores whether multi-rotor aerodynamic layouts coupled to compact mechanical step-up transmissions (planetary and magnetic gearing) can lower the effective cut-in threshold and improve spatial efficiency for decentralized rural and off-grid electrification.

```
+-----------------------------------------------------------------------------------+
|                               PAWAN SHAKTI SYSTEM                                 |
|                                                                                   |
|   [ Atmospheric Flow ]                                                            |
|          | (1.5 - 5.0 m/s low-speed wind regime)                                  |
|          v                                                                        |
|   [ Aerodynamic Rotor Array ]                                                     |
|          | (Selig S1223 high-lift low-Re airfoils, 3 to 5 cluster rotors)         |
|          v  Low RPM, High Aerodynamic Torque                                      |
|   [ Step-Up Transmission ]                                                        |
|          | (1:10 Coaxial Planetary Gearbox / Magnetic Coupling Experiments)       |
|          v  High RPM, Reduced Torque (minus mechanical losses)                    |
|   [ Electromechanical Generator ]                                                 |
|          | (100 W DC Generator / 24V bus architecture)                            |
|          v  DC Electrical Power                                                   |
|   [ Power Conditioning & Storage ]                                                |
|             (BMS, 24V Storage, Inverter for Auxiliary AC Loads)                   |
+-----------------------------------------------------------------------------------+
```

---

## Technical Classification Matrix

To maintain rigorous scientific and engineering transparency, all quantitative statements within this repository are explicitly categorized according to evidentiary status:

| Parameter / Claim | Classification | Status & Basis |
| :--- | :--- | :--- |
| **Operational Target Range** | Design Specification | $1.5\text{ to } 5.0\text{ m/s}$ inland operational window; cut-off target $20\text{--}25\text{ m/s}$. |
| **Cut-In Wind Speed** | Target / Partial Bench Data | Target: $2.0\text{--}2.5\text{ m/s}$; observed rotation on low-friction bench; full dynamometer cut-in validation ongoing. |
| **Rotor Airfoil Selection** | Engineering Specification | Selig S1223 high-camber profile designed for high $C_L$ at low Reynolds numbers ($Re < 100,000$). |
| **Rotor Diameters** | Measured Geometry | $30\text{ cm}$ ($0.3\text{ m}$) single rotor units; modular cluster diameter $1.0\text{--}1.2\text{ m}$. |
| **Gearbox Configuration** | Design Specification / CAD | Coaxial Planetary Gearbox, 1:10 speed step-up ratio; $20^\circ$ pressure angle; module 2.5 spur gearing. |
| **Generator Rating** | Manufacturer Specification | $100\text{ W}$ DC generator, nominal $24\text{ V}$, rated current $4.16\text{ A}$ (also tested $110\text{ V}$, $3500\text{ RPM}$ unit). |
| **Generator Conversion Efficiency**| Manufacturer Specification | $80\text{--}85\%$ electromechanical conversion efficiency at rated speed. |
| **Theoretical Aerodynamic Efficiency** | Engineering Calculation | $C_p \approx 0.40\text{--}0.48$ aerodynamic target from airfoil lift/drag polar calculations (Betz limit: $0.593$). |
| **System End-to-End Efficiency** | To Be Experimentally Validated| Aerodynamic power $\times$ transmission efficiency $\times$ generator efficiency. Needs full field-tunnel dynamometry. |
| **Continuous 24-Hour Operation** | Operational Assumption | Wind provides complementary diurnal profiles to solar, but electrical output depends on instantaneous wind speed. |
| **Annual Maintenance & Payback** | Preliminary Estimate | Maintenance ₹2,000–₹5,000/yr; payback estimate 7–8 years based on standard rural tariff models (requires long-term field validation). |
| **Application Sizing (BTS/Sensors)**| Conceptual Feasibility | Power consumption matching for 50–100W off-grid monitoring equipment; not yet deployed at commercial fleet scale. |

---

## Institutional Affiliation & Support

- **Academic Institution**: Visvesvaraya National Institute of Technology (VNIT), Nagpur, Maharashtra, India.
- **Academic Mentor**: Dr. Jawahar Bhukya, Assistant Professor, Department of Electrical and Electronics Engineering, VNIT Nagpur.
- **Incubation Facility**: VNIT Ventures Vault Foundation (V3F), New Library Building, VNIT Campus, Nagpur (Pre-incubation Agreement executed September 2026).
- **R&D Grant Schemes**: Supported by Anusandhan National Research Foundation (ANRF) accelerated research grants and the CBDE R&D scheme.
- **Intellectual Property**: Indian Patent Published (2025): *"Compact Wind Turbine with Planetary Gears"*; active R&D on magnetic gear contactless transmission.
