import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PLANETARY_SPEC,
  solvePlanetaryKinematics,
} from '../src/lib/animation/gearKinematics.ts';
import {
  computeSimulatedTurbineOutput,
  SELECTABLE_WIND_SPEEDS,
  stepSmoothVelocity,
} from '../src/lib/animation/turbinePhysics.ts';
import { PERFORMANCE_PRESETS } from '../src/lib/animation/performancePresets.ts';

test('Planetary Gear Kinematics: satisfies Willis equation Ns*ws + Nr*wr = (Ns+Nr)*wc across all constraints', () => {
  for (const mode of ['ring_fixed', 'carrier_fixed', 'sun_fixed']) {
    const res = solvePlanetaryKinematics({
      inputRpm: 45,
      constraint: mode,
      spec: DEFAULT_PLANETARY_SPEC,
    });
    assert.equal(res.valid, true);
    assert.ok(res.willisResidual < 1e-6, `Willis equation violated in mode ${mode}: residual=${res.willisResidual}`);
  }

  // Default 1:10 step-up check when ring is fixed (Ns=12, Nr=108 -> (12+108)/12 = 10.0)
  const stepUp = solvePlanetaryKinematics({ inputRpm: 30, constraint: 'ring_fixed' });
  assert.equal(stepUp.effectiveRatio, 10);
  assert.ok(Math.abs(stepUp.omegaSunRadS - 10 * stepUp.omegaCarrierRadS) < 1e-6);
});

test('Wind Simulation Physics: covers all selectable speeds smoothly and enforces 2.2 m/s cut-in target', () => {
  assert.deepEqual([...SELECTABLE_WIND_SPEEDS], [2, 3, 4, 5, 6, 8, 10, 11]);
  const belowCutIn = computeSimulatedTurbineOutput({ windSpeedMs: 2 });
  assert.equal(belowCutIn.aboveCutInTarget, false);
  assert.equal(belowCutIn.simulatedElectricalPowerW, 0);

  const atFive = computeSimulatedTurbineOutput({ windSpeedMs: 5 });
  const atEight = computeSimulatedTurbineOutput({ windSpeedMs: 8 });
  assert.equal(atFive.aboveCutInTarget, true);
  assert.ok(atEight.simulatedElectricalPowerW > atFive.simulatedElectricalPowerW);
  assert.ok(atEight.rotorRpm > atFive.rotorRpm);

  const ramped = stepSmoothVelocity(0, 10, 0.5, 0.5);
  assert.ok(ramped > 6 && ramped < 7);
});

test('Performance Presets: exposes Valid High, Balanced & Low Power particle budgets', () => {
  assert.ok(PERFORMANCE_PRESETS.high.particleCount > PERFORMANCE_PRESETS.balanced.particleCount);
  assert.ok(PERFORMANCE_PRESETS.balanced.particleCount > PERFORMANCE_PRESETS.low.particleCount);
  assert.equal(PERFORMANCE_PRESETS.low.shadowsEnabled, false);
});
