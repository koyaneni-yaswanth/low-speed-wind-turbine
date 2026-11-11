export const SELECTABLE_WIND_SPEEDS = [2, 3, 4, 5, 6, 8, 10, 11] as const;

export const AIR_DENSITY_DEFAULT = 1.225;
export const BETZ_LIMIT = 16 / 27;

export type QualityPreset = 'high' | 'balanced' | 'low';
export type AirflowMode = 'particles' | 'streamlines' | 'technical' | 'simplified';
export type LabTheme = 'dark' | 'light';

export interface TurbineSimulationState {
  windSpeedMs: number;
  windDirectionDeg: number;
  sweptAreaM2: number;
  rotorRpm: number;
  generatorRpm: number;
  shaftPowerW: number;
  simulatedVoltageV: number;
  simulatedCurrentA: number;
  simulatedElectricalPowerW: number;
  cumulativeSimulatedWh: number;
  aboveCutInTarget: boolean;
}

/**
 * Pure illustrative simulation curve for 3D motion & conceptual energy flow.
 * Anchored to ~1.0 m2 working target estimates (never calibrated hardware proof):
 * ~20-25W @ 5 m/s, ~95-110W @ 8 m/s, ~250-300W @ 11 m/s; cut-in target <= 2.2 m/s.
 */
export function computeSimulatedTurbineOutput(params: {
  windSpeedMs: number;
  sweptAreaM2?: number;
  gearRatio?: number;
  targetCp?: number;
}): Omit<TurbineSimulationState, 'windDirectionDeg' | 'cumulativeSimulatedWh'> {
  const v = Math.max(0, Number.isFinite(params.windSpeedMs) ? params.windSpeedMs : 0);
  const area = Math.max(0.1, params.sweptAreaM2 ?? 1.0);
  const ratio = Math.max(1, params.gearRatio ?? 10);
  // Bounded Cp (~0.28-0.31 conceptual at low Re) and drive-train/generator eff (~0.76 combined)
  const cp = Math.min(BETZ_LIMIT * 0.65, params.targetCp ?? 0.31);
  const aboveCutInTarget = v >= 2.2;

  if (!aboveCutInTarget) {
    return {
      windSpeedMs: v,
      sweptAreaM2: area,
      rotorRpm: v >= 1.5 ? Number((v * 14).toFixed(1)) : 0,
      generatorRpm: v >= 1.5 ? Number((v * 14 * ratio).toFixed(0)) : 0,
      shaftPowerW: 0,
      simulatedVoltageV: 0,
      simulatedCurrentA: 0,
      simulatedElectricalPowerW: 0,
      aboveCutInTarget: false,
    };
  }

  const pWind = 0.5 * AIR_DENSITY_DEFAULT * area * Math.pow(v, 3);
  const shaftPowerW = pWind * cp;
  const electricalPowerW = shaftPowerW * 0.85 * 0.88 * 0.92;
  // Conceptual TSR ~ 2.4 on high-solidity low-Re cluster r ~ 0.564 m
  const radiusM = Math.sqrt(area / Math.PI);
  const tsr = 2.4;
  const omegaRotor = (tsr * v) / radiusM;
  const rotorRpm = (omegaRotor * 60) / (2 * Math.PI);
  const generatorRpm = rotorRpm * ratio;

  // Nominal 24 V bus regulation model in simulation
  const voltageV = Math.min(32, Math.max(12.2, 11.5 + v * 1.45));
  const currentA = voltageV > 0 ? electricalPowerW / voltageV : 0;

  return {
    windSpeedMs: v,
    sweptAreaM2: area,
    rotorRpm: Number(rotorRpm.toFixed(1)),
    generatorRpm: Number(generatorRpm.toFixed(0)),
    shaftPowerW: Number(shaftPowerW.toFixed(2)),
    simulatedVoltageV: Number(voltageV.toFixed(2)),
    simulatedCurrentA: Number(currentA.toFixed(2)),
    simulatedElectricalPowerW: Number(electricalPowerW.toFixed(2)),
    aboveCutInTarget: true,
  };
}

export function stepSmoothVelocity(current: number, target: number, dtSec: number, tauSec = 0.85): number {
  const alpha = 1 - Math.exp(-Math.max(0, dtSec) / Math.max(0.05, tauSec));
  return current + (target - current) * alpha;
}
