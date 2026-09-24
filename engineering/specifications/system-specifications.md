# Engineering Specifications: PAWAN SHAKTI

## Baseline System Parameters (100 W Modular Architecture)

| Subsystem | Parameter | Specification / Nominal Value | Verification Basis |
| :--- | :--- | :--- | :--- |
| **System Envelope** | Height $\times$ Width $\times$ Depth | $1100\text{ mm} \times 950\text{ mm} \times 320\text{ mm}$ | Measured CAD assembly envelope |
| | Total System Dry Mass | $8.5\text{ kg}$ (chassis, rotors, gearbox, generator) | Measured scale weight |
| **Aerodynamics** | Rotor Configuration | Modular 4-Rotor Planar Matrix (Config B) | Prototyped & tested |
| | Single Rotor Diameter ($D$) | $300\text{ mm}$ ($0.3\text{ m}$) | CAD / Manufacturing spec |
| | Rotor Unit Radius ($R$) | $150\text{ mm}$ ($0.15\text{ m}$) | CAD specification |
| | Effective Total Swept Area | $0.283\text{ m}^2$ ($4 \times \pi \times 0.15^2$) | Mathematical calculation |
| | Blade Airfoil Profile | Selig S1223 high-lift low-Re profile | Profile coordinates (`S1223.dat`) |
| | Blade Count | 8 to 12 blades per rotor unit | Prototyped geometry |
| | Optimal Tip Speed Ratio ($\lambda_{\text{opt}}$)| $2.2\text{--}2.8$ | Aerodynamic calculation |
| **Transmission** | Gearbox Architecture | Coaxial Epicyclic / Planetary Gearbox | Prototyped & CAD modeled |
| | Speed Step-Up Ratio ($i$) | $1:10$ | Kinematic gear tooth count ratio |
| | Gear Tooth Module | Module 2.5 spur involute | CAD / 3D-print specification |
| | Pressure Angle | $20^\circ$ | Standard involute gear standard |
| | Transmission Efficiency ($\eta_{\text{gear}}$)| Estimated $80\text{--}88\%$ (polymer) | Analytical estimate (bench torque) |
| **Generator** | Generator Topology | Permanent Magnet DC Generator | COTS component datasheet |
| | Rated Continuous Power | $100\text{ W}$ | Manufacturer specification |
| | Nominal DC Bus Voltage | $24\text{ V DC}$ | Standard system architecture |
| | Rated Armature Current | $4.16\text{ A}$ | Calculated: $100\text{ W} / 24\text{ V}$ |
| | Rated Generator Shaft Speed | $3,000\text{--}3,500\text{ RPM}$ | Datasheet nominal rating |
| | Conversion Efficiency ($\eta_{\text{gen}}$)| $80\text{--}85\%$ at rated speed | Manufacturer specification |
| **Operational Limits**| Target Cut-In Wind Speed | $2.0\text{--}2.5\text{ m/s}$ | Observed empirical cut-in on bench |
| | Rated Wind Speed | $5.5\text{--}6.0\text{ m/s}$ | Aerodynamic target |
| | Survival / Cut-Off Wind Speed | $20.0\text{--}25.0\text{ m/s}$ (with furling) | Design target (requires storm test)|
| **Structural / Materials**| Rotor Blade Material | High-Impact ABS (FDM 3D printed) | Material specification |
| | Frame Chassis | 6063-T6 Extruded Aluminum Profiles | Fabrication specification |
| | Backplate & Flanges | 5052/6061 Aluminum Plate ($4\text{ mm}$) | CAD drawing specification |
| | Main Drive Shafts | C45 Precision Turned Ground Steel | Hardware specification |
| | Bearings | 608-2RS & 6000-2RS Deep Groove Ball | COTS specification |
