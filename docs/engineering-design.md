# Engineering Design & Mechanical Subsystems

## 1. Rotor & Blade Aerodynamic Design

### Selig S1223 Airfoil Profile
Small-scale wind turbines operating in light wind regimes ($1.5\text{ to }4.0\text{ m/s}$) operate at Reynolds numbers between $20,000$ and $80,000$, where conventional symmetric or low-camber airfoils (e.g., NACA 0012, NACA 4412) experience extensive boundary-layer separation and severe loss of aerodynamic lift.

To overcome this, the **Selig S1223** high-lift airfoil was selected as the blade cross-section.

```
       Selig S1223 High-Lift Airfoil Profile
       
   1.0 +                                       ......
       |                               ...'''''      '''''...
   0.5 |                         ..''''                      ''...
       |                    ..'''                                 '..
   0.0 +-------------------'-----------------------------------------+--
       0.0                0.2           0.4           0.6           0.8  1.0
                                      x/c (Chord)
       [Maximum Camber: ~8.1% at x/c ~ 0.50 | Maximum Thickness: ~12.1% at x/c ~ 0.20]
```

- **Coordinates File**: Documented in [`engineering/airfoil/S1223.dat`](../engineering/airfoil/S1223.dat).
- **Key Characteristics**:
  - High positive camber generating substantial suction-side circulation even at low angles of attack.
  - Delay of laminar bubble detachment along the upper surface.
  - Capability to achieve maximum sectional lift coefficients $C_{L,\max} > 1.8\text{--}2.0$ at low Reynolds numbers.
  - High static starting torque coefficient, enabling spontaneous rotor rotation in modest breeze conditions.

### Rotor Dimensions & Layout
- **Single Rotor Diameter ($D$)**: $300\text{ mm}$ ($0.3\text{ m}$)
- **Rotor Radius ($R$)**: $150\text{ mm}$ ($0.15\text{ m}$)
- **Number of Blades per Rotor**: 8 to 12 curved high-solidity blades (tested in multi-blade impellers for maximum starting torque).
- **Tip Speed Ratio ($\lambda$) Target**: $\lambda_{\text{opt}} \approx 2.0\text{--}3.5$ (optimized for high torque density rather than high rotational velocity).
- **Blade Manufacturing**: Fused Deposition Modeling (FDM) in high-impact ABS (Acrylonitrile Butadiene Styrene) with 100% infill around the hub root and 4 perimeters for torsional rigidity.

---

## 2. Multi-Rotor Clustering Rationale

Rather than fabricating a single large rotor (e.g., $1.2\text{--}1.5\text{ m}$ diameter), PAWAN SHAKTI investigates a **clustered multi-rotor architecture** (evaluated in 3-rotor, 4-rotor, and 5-rotor configurations):

```
     Configuration A (3-Rotor)             Configuration B (4-Rotor)
              (O)                               (O)         (O)
             /   \                                \         /
           (O)---(O)                               (O)---(O)
```

### Engineering Advantages:
1. **Rapid Acceleration & Low Rotational Inertia**:
   Rotational moment of inertia scales with radius to the fifth power ($I \propto m R^2 \propto R^5$ for geometrically similar blades). Three or four $300\text{ mm}$ rotors possess an order-of-magnitude lower rotational inertia than a single equivalent swept-area rotor ($R = 600\text{ mm}$), enabling faster dynamic response to fluctuating wind gusts.
2. **Standard Additive Manufacturing Compliance**:
   Each $300\text{ mm}$ blade/gear assembly can be fabricated on accessible, low-cost desktop 3D printers ($300 \times 300\text{ mm}$ build volume), eliminating costly multi-part composite tooling.
3. **Spatial Packing & Modularity**:
   Planar clusters can be mounted along existing building parapets, communication towers, or boundary frames with minimal structural protrusion compared to a tall central tower.

---

## 3. Structural & Mechanical Integration

The mechanical structure combines additive manufacturing polymers with structural metal hardware:

| Component | Material | Manufacturing Method | Function / Design Rationale |
| :--- | :--- | :--- | :--- |
| **Rotor Blades** | ABS Plastic | FDM 3D Printing | Low density ($1.04\text{ g/cm}^3$), adequate impact resistance, customizable airfoil twist. |
| **Integrated Rotor Spur Ring** | ABS / Coated | Integrated FDM Print | Module 2.5 gear teeth printed directly onto the outer circumference of the rotor. |
| **Main Transmission Frame** | 6063 Aluminum Extrusions | Modular cut & bracketed | Rigid, corrosion-resistant chassis supporting multi-axis bearing mounts. |
| **Back Plate & Brackets** | Structural Aluminum / Steel | CNC Laser / Waterjet | Provides rigid alignment for coaxial gearbox and generator mounting. |
| **Shafts & Spindles** | Precision Ground Steel | Lathe machining | High torsional strength; minimizes deflection under radial tooth engagement forces. |
| **Bearings** | Chrome Steel (608-2RS / 6000-2RS) | COTS Deep-groove ball bearings | Low rotational friction with dual rubber seals to prevent dust and moisture ingress. |

---

## 4. Engineering Drawings & CAD Repository Assets

Technical drawings and 3D assembly models created in Autodesk Fusion 360 are preserved within the repository:

- **2D Technical Drawings**:
  - [`engineering/drawings/drawings1.pdf`](../engineering/drawings/drawings1.pdf): Complete setup orthographic projection and dimensioning (DWG No. 1, Rev 1, issued 18/05/2025).
  - [`engineering/drawings/drawings-2.pdf`](../engineering/drawings/drawings-2.pdf): Assembly and mounting details.
- **Autodesk Fusion 360 Source Models (`.f3d`)**:
  - [`engineering/cad/fan-gear.f3d`](../engineering/cad/fan-gear.f3d): Rotor-to-gear transmission interface model.
  - [`engineering/cad/Model-2.f3d`](../engineering/cad/Model-2.f3d) and [`Model-23.f3d`](../engineering/cad/Model-23.f3d): Multi-rotor housing and frame integration assemblies.
  - [`engineering/cad/ringforferritemagnetsv2.f3d`](../engineering/cad/ringforferritemagnetsv2.f3d): Magnetic gear coupling rotor ring.
  - [`engineering/cad/back-plate.step`](../engineering/cad/back-plate.step): Standard STEP exchange model of mounting backplate.
- **Additive Manufacturing Files (`.stl` & `.3mf`)**:
  - Located in [`engineering/cad/stl-and-3mf/`](../engineering/cad/stl-and-3mf/).
