export type PlanetaryConstraintMode = 'ring_fixed' | 'carrier_fixed' | 'sun_fixed';

export interface PlanetaryGearSpec {
  sunTeeth: number; // Ns
  ringTeeth: number; // Nr
  planetTeeth: number; // Np = (Nr - Ns) / 2
  planetCount: number;
}

export interface PlanetaryKinematicsResult {
  valid: boolean;
  constraint: PlanetaryConstraintMode;
  omegaSunRadS: number;
  omegaCarrierRadS: number;
  omegaRingRadS: number;
  omegaPlanetSpinRadS: number;
  effectiveRatio: number;
  willisResidual: number; // Ns*ws + Nr*wr - (Ns+Nr)*wc (must be ~0)
}

/**
 * Default conceptual Pawan Shakti 1:10 planetary step-up ratio:
 * Ns = 12, Nr = 108 -> (Ns + Nr) / Ns = 120 / 12 = 10.0x carrier-to-sun speed multiplication.
 * Geometric assembly constraint: Nr = Ns + 2 * Np -> Np = (108 - 12) / 2 = 48.
 */
export const DEFAULT_PLANETARY_SPEC: PlanetaryGearSpec = {
  sunTeeth: 12,
  ringTeeth: 108,
  planetTeeth: 48,
  planetCount: 3,
};

/**
 * Exact Willis Planetary Equation:
 * Ns * omega_s + Nr * omega_r = (Ns + Nr) * omega_c
 */
export function solvePlanetaryKinematics(params: {
  inputRpm: number;
  constraint: PlanetaryConstraintMode;
  spec?: PlanetaryGearSpec;
}): PlanetaryKinematicsResult {
  const spec = params.spec ?? DEFAULT_PLANETARY_SPEC;
  const { sunTeeth: ns, ringTeeth: nr, planetTeeth: np } = spec;

  if (ns <= 0 || nr <= ns || np <= 0) {
    return {
      valid: false,
      constraint: params.constraint,
      omegaSunRadS: 0,
      omegaCarrierRadS: 0,
      omegaRingRadS: 0,
      omegaPlanetSpinRadS: 0,
      effectiveRatio: 0,
      willisResidual: 0,
    };
  }

  const inputRadS = (params.inputRpm * 2 * Math.PI) / 60;
  let ws = 0;
  let wc = 0;
  let wr = 0;
  let effectiveRatio = 1;

  if (params.constraint === 'ring_fixed') {
    // Carrier driven by wind rotor; stationary ring; sun drives generator high-speed shaft
    wc = inputRadS;
    wr = 0;
    ws = ((ns + nr) / ns) * wc;
    effectiveRatio = (ns + nr) / ns;
  } else if (params.constraint === 'carrier_fixed') {
    // Star arrangement: carrier locked, ring & sun counter-rotate by -Nr/Ns
    wc = 0;
    wr = inputRadS;
    ws = -(nr / ns) * wr;
    effectiveRatio = -(nr / ns);
  } else {
    // sun_fixed: Ring input drives carrier torque reduction
    ws = 0;
    wr = inputRadS;
    wc = (nr / (ns + nr)) * wr;
    effectiveRatio = nr / (ns + nr);
  }

  // Relative planet gear spin around its pin axis to maintain zero pitch-circle slip against sun/ring
  const omegaPlanetSpinRadS = ((wr - wc) * nr) / np;
  const willisResidual = Math.abs(ns * ws + nr * wr - (ns + nr) * wc);

  return {
    valid: true,
    constraint: params.constraint,
    omegaSunRadS: ws,
    omegaCarrierRadS: wc,
    omegaRingRadS: wr,
    omegaPlanetSpinRadS,
    effectiveRatio: Number(effectiveRatio.toFixed(3)),
    willisResidual: Number(willisResidual.toFixed(6)),
  };
}
