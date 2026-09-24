# Testing & Experimental Validation

## 1. Experimental Methodology & Test Architecture

To validate the PAWAN SHAKTI system under real physical operating conditions, a structured multi-parameter sensor acquisition setup was developed based on an **ESP32 microcontroller gateway**.

```
+-----------------------------------------------------------------------------------+
|                        EXPERIMENTAL SENSOR INTEGRATION PIPELINE                   |
|                                                                                   |
|  [ Physical Parameter ]          [ Transducer / Sensor ]        [ ESP32 Logger ]  |
|  - Wind Velocity (m/s)  -------> Cup Anemometer (Pulse / Int)  --> GPIO Interrupt |
|  - Rotor / Gen Speed    -------> Optical Tachometer (Pulse)    --> GPIO Counter   |
|  - System Voltage (V)   -------> Calibrated Resistor Divider   --> ADC Pin (12-bit|
|  - Load Current (A)     -------> Hall-Effect Sensor (ACS712)   --> ADC Pin        |
|  - Structural Vibration -------> 3-Axis Accelerometer (ADXL345)--> I2C Bus        |
|                                                                        |          |
|                                                                        v          |
|                                                                 [ Time-Stamped    |
|                                                                   CSV Data Log ]  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Documented Test Logs & Empirical Benchmarks

The following test records document prototype characterization across outdoor bench runs and wind tunnel evaluations at VNIT Nagpur:

### Test Log 01: Mark-3 (3-Rotor Clustered Prototype - Config A)
- **Test ID**: `EXP-M3-001`
- **Date**: 29 July 2026
- **Location**: VNIT Campus outdoor testing site, Nagpur
- **Objective**: Measure electromechanical output and cut-in behavior across natural wind fluctuations.
- **Instrumentation**: Fluke Digital Multimeter, ESP32 datalogger, optical tachometer, cup anemometer.
- **Connected Load**: $5.9\ \Omega$ resistive power resistor load bank.

| Timestamp | Config | Wind Speed ($V_w$) | Rotor RPM | Gen Voltage ($V$) | Load Current ($I$) | Electrical Power ($P$) | Observations / Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `09:00:01` | Config A (3-Rotor) | $4.2\text{ m/s}$ | $310\text{ RPM}$ | $12.4\text{ V}$ | $2.10\text{ A}$ | $26.04\text{ W}$ | Stable rotation; steady meshing. |
| `09:15:22` | Config A (3-Rotor) | $2.4\text{ m/s}$ | $185\text{ RPM}$ | $7.2\text{ V}$ | $0.85\text{ A}$ | $6.12\text{ W}$ | Approaching cut-in boundary. |
| `09:30:10` | Config A (3-Rotor) | $1.9\text{ m/s}$ | $0\text{ RPM}$ | $0.0\text{ V}$ | $0.00\text{ A}$ | $0.00\text{ W}$ | Stalled below static cut-in threshold. |
| `10:05:44` | Config A (3-Rotor) | $3.5\text{ m/s}$ | $265\text{ RPM}$ | $10.6\text{ V}$ | $1.65\text{ A}$ | $17.49\text{ W}$ | Smooth re-acceleration after gust. |
| `10:45:18` | Config A (3-Rotor) | $5.1\text{ m/s}$ | $390\text{ RPM}$ | $15.8\text{ V}$ | $2.80\text{ A}$ | $44.24\text{ W}$ | Strong output; minor high-frequency gear mesh vibration. |

- **Empirical Cut-in Observed**: $2.3\text{--}2.5\text{ m/s}$
- **Key Learning**: Clustered 3-rotor layout starts reliably once wind exceeds $2.3\text{ m/s}$, but gear mesh friction prevents rotation below $2.0\text{ m/s}$.

---

### Test Log 02: Mark-4 (4-Rotor Planar Matrix - Config B)
- **Test ID**: `EXP-M4-002`
- **Date**: 18 August 2026
- **Location**: Aerodynamics Lab / Subsonic Flow Channel, VNIT Nagpur
- **Objective**: Comparative starting torque and multi-rotor speed synchronization under controlled flow.
- **Instrumentation**: Bench flow anemometer, digital optical tachometer, regulated electronic DC load.

| Flow Speed ($V_w$) | Cluster RPM | Gen Output Voltage | Current ($I$) | Power Output | Relative Performance vs. Config A |
| :---: | :---: | :---: | :---: | :---: | :--- |
| $2.5\text{ m/s}$ | $195\text{ RPM}$ | $7.8\text{ V}$ | $0.95\text{ A}$ | $7.41\text{ W}$ | $+21\%$ power at low speed due to higher torque solidity. |
| $3.5\text{ m/s}$ | $285\text{ RPM}$ | $11.4\text{ V}$ | $1.85\text{ A}$ | $21.09\text{ W}$ | $+20.5\%$ power over 3-rotor cluster. |
| $4.5\text{ m/s}$ | $360\text{ RPM}$ | $14.5\text{ V}$ | $2.50\text{ A}$ | $36.25\text{ W}$ | Higher total swept area increases captured kinetic energy. |

- **Observations**: 4-rotor configuration provides higher starting torque and earlier cut-in reliability, but mechanical alignment between 4 meshing pinions requires stricter shaft tolerance.

---

### Test Log 03: Mark-5 (5-Rotor KECS Prototype - Config C)
- **Test ID**: `EXP-M5-003`
- **Date**: 12 September 2026
- **Location**: Workshop Test Rig, VNIT Nagpur
- **Objective**: Full electromechanical transmission test of 5-rotor array coupled to central spur transmission on aluminum extrusion chassis.
- **Observations**: The large swept area provided substantial aerodynamic torque, but accumulated backlash and friction across 5 simultaneous meshing interfaces created excessive drag.
- **Result**: Proved that simply increasing the number of mechanically geared rotors has diminishing returns due to compounding gear friction. Directly motivated the shift toward **contactless magnetic gear couplings** to eliminate multi-gear tooth friction.

---

## 3. Machine Learning Baseline Model Scope

As outlined in [`testing/test-protocols/ESP32-Sensor-Logging-Protocol.md`](../testing/test-protocols/ESP32-Sensor-Logging-Protocol.md), an end-to-end data processing and regression model pipeline was created:
- **Inputs**: $V_w$ (Wind Speed), Rotor RPM, Generator Voltage ($V$), Current ($I$), Vibration ($X, Y, Z$), Config ID.
- **Target Variable**: Electrical Power ($P = V \times I$).
- **Baseline Models**: Multi-variable Linear Regression, followed by Random Forest regressor (80/20 train/test split).
- **Objective**: Establish baseline power curve estimation and predictive anomaly detection for field deployment.
