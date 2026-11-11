import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BETZ_LIMIT,
  calculateHybridProfile,
  calculateLcoeDcf,
  calculateRoiPayback,
  calculateWindPerformance,
  evaluateBetzPhysics,
  kmhToMs,
  rpmToRadPerSec,
} from '../src/lib/physics.ts';
import { parseEsp32Csv, computePowerCurveBins, exportTelemetryToCsv } from '../src/lib/csvTelemetry.ts';

test('Wind Physics Calculator: computes exact P_wind, Betz limit & electrical conversion chain', () => {
  const res = calculateWindPerformance({
    windSpeedMs: 5,
    sweptAreaM2: 1.0,
    airDensityKgM3: 1.225,
    powerCoefficientCp: 0.4,
    transmissionEfficiency: 0.85,
    generatorEfficiency: 0.85,
    electronicsEfficiency: 0.9,
    operatingHoursPerDay: 6,
  });

  assert.equal(res.valid, true);
  // 0.5 * 1.225 * 1.0 * 125 = 76.5625
  assert.ok(Math.abs(res.windPowerW - 76.5625) < 0.01);
  assert.ok(Math.abs(res.betzMaxPowerW - 76.5625 * BETZ_LIMIT) < 0.05);
  assert.ok(res.electricalPowerW < res.shaftPowerW);
  assert.ok(res.electricalPowerW > 18 && res.electricalPowerW < 25, '1 m2 @ 5 m/s aligns reasonably near 20-25W estimate');
});

test('Wind Physics Calculator: rejects Cp exceeding Betz limit and negative inputs cleanly', () => {
  const badCp = calculateWindPerformance({
    windSpeedMs: 5,
    sweptAreaM2: 1.0,
    airDensityKgM3: 1.225,
    powerCoefficientCp: 0.65,
    transmissionEfficiency: 0.85,
    generatorEfficiency: 0.85,
    electronicsEfficiency: 0.9,
    operatingHoursPerDay: 6,
  });
  assert.equal(badCp.valid, false);
  assert.match(badCp.errors[0], /Betz limit/);

  const zeroWind = calculateWindPerformance({
    windSpeedMs: 0,
    sweptAreaM2: 1.0,
    airDensityKgM3: 1.225,
    powerCoefficientCp: 0.35,
    transmissionEfficiency: 0.85,
    generatorEfficiency: 0.85,
    electronicsEfficiency: 0.9,
    operatingHoursPerDay: 6,
  });
  assert.equal(zeroWind.valid, true);
  assert.equal(zeroWind.windPowerW, 0);
  assert.equal(zeroWind.electricalPowerW, 0);
});

test('Betz Audit Detector: flags historical 36.25W claim on A=0.283 m2 @ 4.5 m/s as physical anomaly', () => {
  const check = evaluateBetzPhysics({
    windSpeedMs: 4.5,
    sweptAreaM2: 0.283,
    voltageV: 14.5,
    currentA: 2.5,
    airDensityKgM3: 1.151,
  });
  assert.equal(check.measuredPowerW, 36.25);
  assert.equal(check.exceedsBetzLimit, true);
  assert.ok(check.cpRatio > 2.0);
});

test('ROI & LCOE Calculators: compute user-customizable tariff payback and DCF LCOE accurately', () => {
  const roi = calculateRoiPayback({
    systemPriceInr: 65000,
    installationCostInr: 5000,
    batteryInverterCostInr: 10000,
    estimatedAnnualKwh: 500,
    electricityTariffInrKwh: 10,
    selfConsumptionPct: 100,
    annualMaintenanceInr: 2000,
    systemLifeYears: 15,
    annualFinancingCostInr: 0,
  });
  assert.equal(roi.valid, true);
  assert.equal(roi.totalCapexInr, 80000);
  assert.equal(roi.netAnnualSavingsInr, 3000);
  assert.ok(Math.abs((roi.simplePaybackYears || 0) - 26.67) < 0.1);

  const lcoe = calculateLcoeDcf({
    installedCapexInr: 80000,
    annualOmInr: 2000,
    replacementCostInr: 10000,
    replacementYear: 7,
    projectLifeYears: 15,
    discountRatePct: 8,
    yearOneNetEnergyKwh: 600,
    annualDegradationPct: 1,
    availabilityPct: 95,
    residualValueInr: 0,
  });
  assert.equal(lcoe.valid, true);
  assert.ok((lcoe.lcoeInrPerKwh || 0) > 15);
});

test('Hybrid Profile & ESP32 CSV Parser: parses valid CSV, computes P=V*I, bins power curve & preserves outliers', () => {
  const hybrid = calculateHybridProfile({
    solarKw: 1.0,
    solarPeakSunHours: 5,
    windRatedOutputAtSiteW: 50,
    windEffectiveHoursDay: 10,
    dailyLoadKwh: 5,
    batteryUsableKwh: 2.5,
  });
  assert.equal(hybrid.solarDailyKwh, 5.0);
  assert.equal(hybrid.windDailyKwh, 0.5);
  assert.equal(hybrid.hourlyProfile.length, 24);

  const sampleCsv = [
    'Timestamp,Config_ID,Voltage_V,Current_A,Power_W,Rotor_RPM,Wind_Speed_ms,Wind_Direction,Vib_XYZ_g,Notes',
    '2026-11-10 09:00:00,B,12.0,1.0,12.0,220,4.5,NE,0.02/0.01/0.02,Valid test',
    '2026-11-10 09:01:00,B,12.0,0.5,6.0,190,4.2,NE,0.02/0.01/0.02,Valid test 2',
  ].join('\n');

  const parsed = parseEsp32Csv(sampleCsv, { sweptAreaM2: 1.0 });
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.betzAnomalyCount, 0);
  const bins = computePowerCurveBins(parsed.rows, 1.0);
  assert.equal(bins.length, 1);
  assert.equal(bins[0].sampleCount, 2);
  assert.equal(bins[0].meanPowerW, 9.0);
});

test('Physics Edge Cases: rejects negative inputs, invalid density, zero area, impossible efficiency & verifies units', () => {
  const negWind = calculateWindPerformance({
    windSpeedMs: -2,
    sweptAreaM2: 1.0,
    airDensityKgM3: 1.225,
    powerCoefficientCp: 0.35,
    transmissionEfficiency: 0.9,
    generatorEfficiency: 0.9,
    electronicsEfficiency: 0.9,
    operatingHoursPerDay: 5,
  });
  assert.equal(negWind.valid, false);

  const zeroArea = calculateWindPerformance({
    windSpeedMs: 5,
    sweptAreaM2: 0,
    airDensityKgM3: 1.225,
    powerCoefficientCp: 0.35,
    transmissionEfficiency: 0.9,
    generatorEfficiency: 0.9,
    electronicsEfficiency: 0.9,
    operatingHoursPerDay: 5,
  });
  assert.equal(zeroArea.valid, false);

  const badDensity = calculateWindPerformance({
    windSpeedMs: 5,
    sweptAreaM2: 1.0,
    airDensityKgM3: 3.5,
    powerCoefficientCp: 0.35,
    transmissionEfficiency: 0.9,
    generatorEfficiency: 0.9,
    electronicsEfficiency: 0.9,
    operatingHoursPerDay: 5,
  });
  assert.equal(badDensity.valid, false);

  const badEff = calculateWindPerformance({
    windSpeedMs: 5,
    sweptAreaM2: 1.0,
    airDensityKgM3: 1.225,
    powerCoefficientCp: 0.35,
    transmissionEfficiency: 1.2,
    generatorEfficiency: 0.9,
    electronicsEfficiency: 0.9,
    operatingHoursPerDay: 5,
  });
  assert.equal(badEff.valid, false);

  const zeroWindPositivePower = evaluateBetzPhysics({
    windSpeedMs: 0,
    sweptAreaM2: 1.0,
    voltageV: 12,
    currentA: 1,
  });
  assert.equal(zeroWindPositivePower.exceedsBetzLimit, true);

  assert.ok(Math.abs(kmhToMs(18) - 5.0) < 0.001);
  assert.ok(Math.abs(rpmToRadPerSec(60) - 2 * Math.PI) < 0.001);
});

test('CSV Parser Edge Cases & Large Dataset: handles missing columns, invalid timestamps, outliers & 5000-row series', () => {
  const missingCols = parseEsp32Csv('Timestamp,Voltage_V\n2026-11-10T10:00:00Z,12');
  assert.equal(missingCols.rows.length, 0);
  assert.match(missingCols.errors[0], /Missing required columns/);

  const badTimestamp = parseEsp32Csv(
    'Timestamp,Voltage_V,Current_A,Wind_Speed_ms,Rotor_RPM\nnot-a-timestamp,12,1,4.5,100\n2026-11-10T10:01:00Z,12,-1,4.5,100\n2026-11-10T10:02:00Z,12,5,4.5,200',
    { sweptAreaM2: 0.283 }
  );
  assert.equal(badTimestamp.errors.length, 1);
  assert.equal(badTimestamp.rows[0].dataQualityStatus, 'out_of_range');
  assert.equal(badTimestamp.rows[1].dataQualityStatus, 'betz_anomaly');

  const largeRows = ['Timestamp,Config_ID,Voltage_V,Current_A,Power_W,Rotor_RPM,Wind_Speed_ms'];
  const baseTs = Date.parse('2026-11-10T00:00:00Z');
  for (let i = 0; i < 5000; i++) {
    const ts = new Date(baseTs + i * 1000).toISOString();
    const vWind = 3 + (i % 5);
    largeRows.push(`${ts},OPT-A,24.0,0.5,12.0,${150 + (i % 60)},${vWind}`);
  }
  const largeParsed = parseEsp32Csv(largeRows.join('\n'), { sweptAreaM2: 1.0 });
  assert.equal(largeParsed.rows.length, 5000);
  assert.equal(largeParsed.errors.length, 0);
  const largeBins = computePowerCurveBins(largeParsed.rows, 1.0);
  assert.equal(largeBins.length, 5);
  const csvOut = exportTelemetryToCsv(largeParsed.rows.slice(0, 10));
  assert.ok(csvOut.split('\n').length === 11);
});
