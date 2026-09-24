# ESP32 Sensor Logging & Rotation Protocol

## 1. Objective

Standardize the empirical data collection pipeline across all physical turbine configurations (Configuration A: 3-Rotor, Configuration B: 4-Rotor, Configuration C: 5-Rotor) to ensure rigorous, time-synchronized, and unbiased comparative analysis.

---

## 2. Hardware Instrumentation Setup

```
   [ Cup Anemometer ]  ---------> GPIO 14 (Interrupt Pin / Falling Edge)
   [ Optical Tachometer ] ------> GPIO 13 (Pulse Counter)
   [ DC Bus Voltage (0–30V) ] --> Resistor Divider (100k / 10k) --> ADC GPIO 34 (12-bit)
   [ DC Bus Current (0–10A) ] --> ACS712-20A Hall Sensor ------> ADC GPIO 35 (12-bit)
   [ ADXL345 Vibration ] -------> I2C (SDA: GPIO 21, SCL: GPIO 22)
```

### Critical Rules:
1. **Synchronous Sampling**: Wind speed MUST be logged in the exact same timestamp row as voltage, current, RPM, and vibration. Asynchronous weather station logs are prohibited.
2. **Rotation Protocol**: To prevent atmospheric bias (e.g., testing one configuration during a morning gust and another during midday calm), configurations MUST be rotated sequentially every 2 to 3 hours across the test day:
   $$\text{Config A} \longrightarrow \text{Config B} \longrightarrow \text{Config C} \longrightarrow \text{Config A}$$
3. **Data Integrity**: Raw sensor values must never be manually altered or retroactively smoothed. Outliers, cable disconnects, or manual configuration shifts must be annotated in the `Notes` field.

---

## 3. Data Schema & Logging Format

All test logs are output in comma-separated values (CSV) with the following schema:

| Column Header | Data Type | Engineering Units | Description |
| :--- | :--- | :--- | :--- |
| `Timestamp` | ISO 8601 String | `YYYY-MM-DD HH:MM:SS` | Real-time clock (RTC) synchronized timestamp. |
| `Config_ID` | Categorical String | `A`, `B`, or `C` | Configuration designation (`A`=3-rotor, `B`=4-rotor, `C`=5-rotor). |
| `Voltage_V` | Floating Point | Volts ($\text{V}$) | DC generator terminal voltage. |
| `Current_A` | Floating Point | Amperes ($\text{A}$) | Load circuit current. |
| `Power_W` | Floating Point | Watts ($\text{W}$) | Calculated electrical power ($P = V \times I$). |
| `Rotor_RPM` | Floating Point | Revolutions per minute | Measured rotational speed of primary aerodynamic rotor. |
| `Wind_Speed_ms` | Floating Point | Meters per second ($\text{m/s}$) | Freestream velocity from cup anemometer at rotor centerline height. |
| `Wind_Direction` | String | Compass Cardinal / Degrees | Ambient wind direction (e.g., `NE`, `SW`). |
| `Vib_XYZ_g` | String | $g$-force ($\text{m/s}^2$) | Triaxial vibration vector (`X/Y/Z`). |
| `Notes` | Text String | Free text | Annotations: gusts, load step changes, calibration events. |

---

## 4. Machine Learning Baseline Model Architecture

The sensor stream feeds directly into an automated Python preprocessing and regression pipeline:
1. **Data Cleaning**: Discard startup transient rows ($V < 0.1\text{ V}$, $RPM = 0$) and detect sensor dropout anomalies.
2. **Feature Matrix**: $[V_{\text{wind}}, \text{RPM}, \text{Config\_ID (one-hot)}, \text{Vib\_Magnitude}]$.
3. **Target**: Electrical Power ($P_{\text{elec}}$).
4. **Model Comparison**:
   - Baseline: Ordinary Least Squares (OLS) Linear Regression ($R^2$ baseline).
   - Non-linear: Random Forest Regressor and Gradient Boosted Trees (XGBoost).
   - Split: $80\%$ Training / $20\%$ Validation.
