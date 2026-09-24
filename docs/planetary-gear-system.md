# Planetary Gear Transmission & Speed Step-Up System

## 1. Why a Mechanical Step-Up Transmission Was Considered

Small-scale wind rotors operating in low-speed airflows ($2.0\text{--}4.5\text{ m/s}$) naturally rotate at relatively low angular velocities ($150\text{--}350\text{ RPM}$) due to aerodynamic Tip Speed Ratio ($\lambda$) limits:

$$\omega_{\text{rotor}} = \frac{\lambda \cdot V_{\text{wind}}}{R}$$

For a rotor radius $R = 0.15\text{ m}$ at $V = 3.5\text{ m/s}$ and $\lambda = 2.5$:

$$\omega_{\text{rotor}} = \frac{2.5 \times 3.5}{0.15} \approx 58.3\text{ rad/s} \approx 557\text{ RPM}$$

However, standard low-cost direct-current (DC) generators require shaft speeds of **$1,500\text{ to }3,500\text{ RPM}$** to induce sufficient back-electromotive force ($E_b = k_e \cdot \omega$) to exceed typical battery charging thresholds ($12\text{ V}$ or $24\text{ V}$). 

Without speed multiplication, a direct-drive generator either produces negligible open-circuit voltage or requires an impractically large permanent-magnet machine with an excessive pole count, adding mass, cost, and high cogging torque.

---

## 2. Why Coaxial Planetary Gearing Was Selected

When stepping up speed between a wind rotor and a generator, several transmission architectures exist:

| Transmission Type | Alignment | Radial Load on Bearings | Power Density | Noise / Vibration | Suitability for PAWAN SHAKTI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Single-Stage Parallel Spur** | Offset input/output | High cantilevered load | Low | Moderate | Asymmetric frame loading; awkward generator packaging. |
| **Timing Belt / Pulley** | Offset input/output | Constant radial belt tension | Medium | Low | Belt creep, environmental degradation (UV, rain), high pre-tension friction. |
| **Coaxial Planetary Gearbox** | **Fully in-line / coaxial** | **Self-centering; zero net radial load** | **Very High** | Low-Moderate | **Ideal for compact nacelle packaging, balanced bearing wear, and coaxial generator coupling.** |

### Advantages of Planetary (Epicyclic) Gearing:
1. **Coaxial Input and Output**: The rotor input shaft and generator output shaft share the exact same centerline axis, eliminating bending moments on the main chassis and reducing nacelle packaging volume.
2. **Radial Load Cancellation**: Planetary gears distribute tooth contact forces symmetrically across multiple planet gears (typically 3 or 4) around a central sun gear. The radial tooth separation forces cancel out, leaving nearly pure torsional loading on the central shaft bearings.
3. **High Torque Density**: Dividing torque across multiple meshing teeth reduces individual tooth root stresses, permitting compact additive-manufactured or molded gears.

---

## 3. Kinematic & Dynamic Relationships

```
              PLANETARY GEAR SPEED STEP-UP MECHANISM
                     
                        [ Ring Gear (Fixed or Input) ]
                                /        \
                        [Planet 1]      [Planet 2]
                                \        /
                            [ Sun Gear (Output) ]
                                    |
                            [ Planet Carrier ]
```

### Speed Ratio ($i$)
In the PAWAN SHAKTI step-up configuration, the rotor carrier drives the planet gears, which revolve inside a ring gear and drive the central sun gear at multiplied speed:

$$i = \frac{\omega_{\text{out}}}{\omega_{\text{in}}} = \frac{\omega_{\text{sun}}}{\omega_{\text{carrier}}} = 1 + \frac{Z_{\text{ring}}}{Z_{\text{sun}}}$$

Where:
- $Z_{\text{ring}}$ is the number of internal teeth on the ring gear.
- $Z_{\text{sun}}$ is the number of external teeth on the sun gear.
- Target Speed Step-Up Ratio: **$1:10$** (with an intermediate calculation baseline of **$3.77:1$** evaluated during preliminary electrical matching).

For an input rotor angular velocity $\omega_{\text{in}}$, the generator shaft speed is:

$$\omega_{\text{gen}} = i \cdot \omega_{\text{rotor}} = 10 \cdot \omega_{\text{rotor}}$$

---

## 4. Fundamental Torque-Speed Trade-Off & Mechanical Losses

A mechanical gearbox **does not create energy**. By the principle of conservation of energy:

$$P_{\text{mech, out}} = P_{\text{mech, in}} \cdot \eta_{\text{gearbox}}$$

Where $\eta_{\text{gearbox}} < 1.0$ is the mechanical transmission efficiency.

The output torque ($T_{\text{out}}$) delivered to the generator shaft is therefore reduced inversely with speed, diminished further by mechanical friction:

$$T_{\text{gen}} = \frac{T_{\text{rotor}}}{i} \cdot \eta_{\text{gearbox}} = \frac{T_{\text{rotor}}}{10} \cdot \eta_{\text{gearbox}}$$

### Sources of Mechanical Losses in the Prototype:
1. **Sliding & Rolling Tooth Friction**: Meshing between gear teeth involves micro-sliding along the involute flank ($20^\circ$ pressure angle). In FDM-printed ABS gears, surface roughness ($R_a \approx 10\text{--}25\text{ }\mu\text{m}$) increases tooth friction compared to precision ground metal gears.
2. **Bearing Drag**: Rolling resistance from deep-groove ball bearings and contact seal drag.
3. **Windage & Churning**: Fluid drag of rotating gear components in air or lubricant.

```
       Input Aerodynamic Power (Rotor)
       P_in = T_rotor * omega_rotor
                |
                v  [ Frictional Dissipation: ~10 - 20% in polymer prototype ]
                |
       Output Mechanical Power (Generator Shaft)
       P_out = T_gen * omega_gen = eta_gearbox * P_in
```

Under low-wind conditions, transmission frictional torque directly opposes starting torque. Reducing gearbox tare friction is therefore paramount to ensuring low cut-in operation.

---

## 5. Experimental Magnetic Gear Coupling Exploration

To eliminate contact friction, tooth wear, and lubrication maintenance altogether, preliminary research was conducted into **contactless magnetic gear couplings**:
- **Design Asset**: [`engineering/cad/ringforferritemagnetsv2.f3d`](../engineering/cad/ringforferritemagnetsv2.f3d) and [`ringforferritemagnetsv2.stl`](../engineering/cad/stl-and-3mf/ringforferritemagnetsv2.stl).
- **Concept**: Ferrite / Neodymium permanent magnets arranged with alternating polarity on concentric rings, modulated by intermediate ferromagnetic pole pieces.
- **Benefits**: Zero contact friction, natural overload slip protection without tooth stripping, zero acoustic meshing noise.
- **Current Status**: Exploratory research and initial 3D-printed fixture design; full dynamometer characterization remains future work.
