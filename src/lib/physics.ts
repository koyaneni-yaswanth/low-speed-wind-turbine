export const BETZ_LIMIT = 16 / 27; // 0.59259259...
export const DEFAULT_AIR_DENSITY = 1.225; // kg/m^3 at sea level, 15C

export interface WindCalculatorInput {
  windSpeedMs: number;
  sweptAreaM2: number;
  airDensityKgM3: number;
  powerCoefficientCp: number;
  transmissionEfficiency: number; // 0-1
  generatorEfficiency: number; // 0-1
  electronicsEfficiency: number; // 0-1
  operatingHoursPerDay: number;
}

export interface WindCalculatorResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  windPowerW: number;
  betzMaxPowerW: number;
  shaftPowerW: number;
  electricalPowerW: number;
  overallSystemCp: number;
  dailyEstimatedWh: number;
  annualEstimatedKwh: number;
  sensitivityCurve: { windSpeedMs: number; windPowerW: number; betzMaxW: number; electricalPowerW: number }[];
}

export function calculateWindPerformance(input: WindCalculatorInput): WindCalculatorResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(input.windSpeedMs) || input.windSpeedMs < 0 || input.windSpeedMs > 50) {
    errors.push('Wind speed must be between 0 and 50 m/s.');
  }
  if (!Number.isFinite(input.sweptAreaM2) || input.sweptAreaM2 <= 0 || input.sweptAreaM2 > 100) {
    errors.push('Swept area must be greater than 0 and <= 100 m^2.');
  }
  if (!Number.isFinite(input.airDensityKgM3) || input.airDensityKgM3 < 0.5 || input.airDensityKgM3 > 1.6) {
    errors.push('Air density must be between 0.5 and 1.6 kg/m^3.');
  }
  if (!Number.isFinite(input.powerCoefficientCp) || input.powerCoefficientCp <= 0 || input.powerCoefficientCp > BETZ_LIMIT) {
    errors.push(`Rotor Cp must be > 0 and cannot exceed the physical Betz limit (${BETZ_LIMIT.toFixed(3)}).`);
  }
  for (const [label, val] of [
    ['Mechanical transmission efficiency', input.transmissionEfficiency],
    ['Generator efficiency', input.generatorEfficiency],
    ['Power electronics efficiency', input.electronicsEfficiency],
  ] as const) {
    if (!Number.isFinite(val) || val <= 0 || val > 1) {
      errors.push(`${label} must be between 0.01 and 1.00.`);
    }
  }
  if (!Number.isFinite(input.operatingHoursPerDay) || input.operatingHoursPerDay < 0 || input.operatingHoursPerDay > 24) {
    errors.push('Operating hours per day must be between 0 and 24.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      windPowerW: 0,
      betzMaxPowerW: 0,
      shaftPowerW: 0,
      electricalPowerW: 0,
      overallSystemCp: 0,
      dailyEstimatedWh: 0,
      annualEstimatedKwh: 0,
      sensitivityCurve: [],
    };
  }

  if (input.windSpeedMs > 0 && input.windSpeedMs < 2.2) {
    warnings.push('Below 2.2 m/s development cut-in target: aerodynamic torque may not overcome transmission/generator stiction.');
  }
  if (input.powerCoefficientCp > 0.45) {
    warnings.push('High Cp (> 0.45) is typical only of large optimized rotors; micro-scale low-Re turbines typically realize lower Cp.');
  }

  const windPowerW = 0.5 * input.airDensityKgM3 * input.sweptAreaM2 * Math.pow(input.windSpeedMs, 3);
  const betzMaxPowerW = windPowerW * BETZ_LIMIT;
  const shaftPowerW = windPowerW * input.powerCoefficientCp * input.transmissionEfficiency;
  const electricalPowerW = shaftPowerW * input.generatorEfficiency * input.electronicsEfficiency;
  const overallSystemCp = windPowerW > 0 ? electricalPowerW / windPowerW : 0;
  const dailyEstimatedWh = electricalPowerW * input.operatingHoursPerDay;
  const annualEstimatedKwh = (dailyEstimatedWh * 365) / 1000;

  if (overallSystemCp > 0.35) {
    warnings.push('Combined system efficiency exceeds 35%: verify conservative mechanical and converter loss assumptions.');
  }

  const sensitivityCurve = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((v) => {
    const pw = 0.5 * input.airDensityKgM3 * input.sweptAreaM2 * Math.pow(v, 3);
    const pe = pw * input.powerCoefficientCp * input.transmissionEfficiency * input.generatorEfficiency * input.electronicsEfficiency;
    return {
      windSpeedMs: v,
      windPowerW: Number(pw.toFixed(2)),
      betzMaxW: Number((pw * BETZ_LIMIT).toFixed(2)),
      electricalPowerW: Number(pe.toFixed(2)),
    };
  });

  return {
    valid: true,
    errors,
    warnings,
    windPowerW,
    betzMaxPowerW,
    shaftPowerW,
    electricalPowerW,
    overallSystemCp,
    dailyEstimatedWh,
    annualEstimatedKwh,
    sensitivityCurve,
  };
}

export interface RoiInput {
  systemPriceInr: number;
  installationCostInr: number;
  batteryInverterCostInr: number;
  estimatedAnnualKwh: number;
  electricityTariffInrKwh: number;
  selfConsumptionPct: number; // 0-100
  annualMaintenanceInr: number;
  systemLifeYears: number;
  annualFinancingCostInr: number;
}

export interface RoiResult {
  valid: boolean;
  errors: string[];
  totalCapexInr: number;
  usableAnnualKwh: number;
  grossAnnualBillOffsetInr: number;
  netAnnualSavingsInr: number;
  simplePaybackYears: number | null;
  lifetimeNetSavingsInr: number;
}

export function calculateRoiPayback(input: RoiInput): RoiResult {
  const errors: string[] = [];
  if (
    !Number.isFinite(input.systemPriceInr) ||
    !Number.isFinite(input.installationCostInr) ||
    !Number.isFinite(input.batteryInverterCostInr) ||
    input.systemPriceInr < 0 ||
    input.installationCostInr < 0 ||
    input.batteryInverterCostInr < 0
  ) {
    errors.push('Capital costs must be valid non-negative numbers.');
  }
  if (!Number.isFinite(input.estimatedAnnualKwh) || input.estimatedAnnualKwh < 0) {
    errors.push('Estimated annual energy cannot be negative.');
  }
  if (!Number.isFinite(input.electricityTariffInrKwh) || input.electricityTariffInrKwh <= 0 || input.electricityTariffInrKwh > 100) {
    errors.push('Electricity tariff must be > 0 and <= 100 INR/kWh.');
  }
  if (!Number.isFinite(input.selfConsumptionPct) || input.selfConsumptionPct < 0 || input.selfConsumptionPct > 100) {
    errors.push('Self-consumption percentage must be between 0% and 100%.');
  }
  if (!Number.isFinite(input.systemLifeYears) || input.systemLifeYears < 1 || input.systemLifeYears > 35) {
    errors.push('System life assumption must be between 1 and 35 years.');
  }
  if (!Number.isFinite(input.annualMaintenanceInr) || input.annualMaintenanceInr < 0 || !Number.isFinite(input.annualFinancingCostInr) || input.annualFinancingCostInr < 0) {
    errors.push('Maintenance and financing costs cannot be negative.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      totalCapexInr: 0,
      usableAnnualKwh: 0,
      grossAnnualBillOffsetInr: 0,
      netAnnualSavingsInr: 0,
      simplePaybackYears: null,
      lifetimeNetSavingsInr: 0,
    };
  }

  const totalCapexInr = input.systemPriceInr + input.installationCostInr + input.batteryInverterCostInr;
  const usableAnnualKwh = input.estimatedAnnualKwh * (input.selfConsumptionPct / 100);
  const grossAnnualBillOffsetInr = usableAnnualKwh * input.electricityTariffInrKwh;
  const netAnnualSavingsInr = grossAnnualBillOffsetInr - input.annualMaintenanceInr - input.annualFinancingCostInr;
  const simplePaybackYears = netAnnualSavingsInr > 0 ? totalCapexInr / netAnnualSavingsInr : null;
  const lifetimeNetSavingsInr = netAnnualSavingsInr * input.systemLifeYears - totalCapexInr;

  return {
    valid: true,
    errors,
    totalCapexInr,
    usableAnnualKwh,
    grossAnnualBillOffsetInr,
    netAnnualSavingsInr,
    simplePaybackYears,
    lifetimeNetSavingsInr,
  };
}

export interface HybridScenarioInput {
  solarKw: number;
  solarPeakSunHours: number;
  windRatedOutputAtSiteW: number;
  windEffectiveHoursDay: number;
  dailyLoadKwh: number;
  batteryUsableKwh: number;
}

export interface HybridScenarioResult {
  solarDailyKwh: number;
  windDailyKwh: number;
  hybridDailyKwh: number;
  solarCoveragePct: number;
  windCoveragePct: number;
  hybridCoveragePct: number;
  batteryAutonomyHours: number;
  hourlyProfile: { hour: string; solarW: number; windW: number; combinedW: number }[];
}

export function calculateHybridProfile(input: HybridScenarioInput): HybridScenarioResult {
  const solarDailyKwh = Math.max(0, input.solarKw) * Math.max(0, input.solarPeakSunHours);
  const windDailyKwh = (Math.max(0, input.windRatedOutputAtSiteW) * Math.max(0, input.windEffectiveHoursDay)) / 1000;
  const hybridDailyKwh = solarDailyKwh + windDailyKwh;
  const load = Math.max(0.01, input.dailyLoadKwh);
  const avgHourlyLoadW = (load * 1000) / 24;

  const hourlyProfile = Array.from({ length: 24 }, (_, h) => {
    const label = `${String(h).padStart(2, '0')}:00`;
    // Solar bell curve centered 07:00-17:00 (normalized estimate for visualization)
    const solarWeight = h >= 7 && h <= 17 ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
    const avgSolarPerWeight = solarWeight > 0 ? (solarDailyKwh * 1000) / 7.595 : 0;
    const solarW = Number((solarWeight * avgSolarPerWeight).toFixed(1));
    // Illustrative diurnal wind profile assuming evening/night trade breeze weighting (must be replaced by local anemometer data)
    const windWeight = h >= 16 || h <= 6 ? 1.25 : 0.75;
    const windW = Number((((windDailyKwh * 1000) / 24) * windWeight).toFixed(1));
    return {
      hour: label,
      solarW,
      windW,
      combinedW: Number((solarW + windW).toFixed(1)),
    };
  });

  return {
    solarDailyKwh: Number(solarDailyKwh.toFixed(2)),
    windDailyKwh: Number(windDailyKwh.toFixed(2)),
    hybridDailyKwh: Number(hybridDailyKwh.toFixed(2)),
    solarCoveragePct: Number(Math.min(100, (solarDailyKwh / load) * 100).toFixed(1)),
    windCoveragePct: Number(Math.min(100, (windDailyKwh / load) * 100).toFixed(1)),
    hybridCoveragePct: Number(Math.min(100, (hybridDailyKwh / load) * 100).toFixed(1)),
    batteryAutonomyHours: Number(((Math.max(0, input.batteryUsableKwh) * 1000) / avgHourlyLoadW).toFixed(1)),
    hourlyProfile,
  };
}

export interface LcoeDcfInput {
  installedCapexInr: number;
  annualOmInr: number;
  replacementCostInr: number;
  replacementYear: number;
  projectLifeYears: number;
  discountRatePct: number;
  yearOneNetEnergyKwh: number;
  annualDegradationPct: number;
  availabilityPct: number;
  residualValueInr: number;
}

export interface LcoeDcfResult {
  valid: boolean;
  lcoeInrPerKwh: number | null;
  discountedTotalCostInr: number;
  discountedTotalEnergyKwh: number;
}

export function calculateLcoeDcf(input: LcoeDcfInput): LcoeDcfResult {
  if (
    !Number.isFinite(input.installedCapexInr) ||
    !Number.isFinite(input.annualOmInr) ||
    !Number.isFinite(input.projectLifeYears) ||
    !Number.isFinite(input.yearOneNetEnergyKwh) ||
    !Number.isFinite(input.availabilityPct) ||
    input.installedCapexInr < 0 ||
    input.annualOmInr < 0 ||
    input.projectLifeYears < 1 ||
    input.yearOneNetEnergyKwh <= 0 ||
    input.availabilityPct <= 0
  ) {
    return { valid: false, lcoeInrPerKwh: null, discountedTotalCostInr: 0, discountedTotalEnergyKwh: 0 };
  }
  const r = Math.max(0, input.discountRatePct) / 100;
  const deg = Math.max(0, Math.min(20, input.annualDegradationPct)) / 100;
  const avail = Math.max(0, Math.min(100, input.availabilityPct)) / 100;

  let totalCost = input.installedCapexInr;
  let totalEnergy = 0;

  for (let yr = 1; yr <= input.projectLifeYears; yr++) {
    const df = Math.pow(1 + r, yr);
    const repl = yr === input.replacementYear ? input.replacementCostInr : 0;
    const residual = yr === input.projectLifeYears ? -input.residualValueInr : 0;
    totalCost += (input.annualOmInr + repl + residual) / df;
    const energyYr = input.yearOneNetEnergyKwh * Math.pow(1 - deg, yr - 1) * avail;
    totalEnergy += energyYr / df;
  }

  return {
    valid: true,
    lcoeInrPerKwh: totalEnergy > 0 ? Number((totalCost / totalEnergy).toFixed(2)) : null,
    discountedTotalCostInr: Number(totalCost.toFixed(0)),
    discountedTotalEnergyKwh: Number(totalEnergy.toFixed(1)),
  };
}

export function kmhToMs(kmh: number): number {
  return Number.isFinite(kmh) && kmh >= 0 ? Number((kmh / 3.6).toFixed(4)) : 0;
}

export function rpmToRadPerSec(rpm: number): number {
  return Number.isFinite(rpm) && rpm >= 0 ? Number(((rpm * 2 * Math.PI) / 60).toFixed(4)) : 0;
}

export function evaluateBetzPhysics(params: {
  windSpeedMs: number;
  sweptAreaM2: number;
  voltageV: number;
  currentA: number;
  airDensityKgM3?: number;
}): {
  measuredPowerW: number;
  availableWindPowerW: number;
  cpRatio: number;
  exceedsBetzLimit: boolean;
  exceedsPracticalSmallWindCap: boolean;
} {
  const rho = params.airDensityKgM3 ?? DEFAULT_AIR_DENSITY;
  const safeRho = Number.isFinite(rho) && rho > 0 ? rho : DEFAULT_AIR_DENSITY;
  const safeArea = Number.isFinite(params.sweptAreaM2) && params.sweptAreaM2 > 0 ? params.sweptAreaM2 : 0;
  const safeWind = Number.isFinite(params.windSpeedMs) ? Math.max(0, params.windSpeedMs) : 0;
  const safeV = Number.isFinite(params.voltageV) ? Math.max(0, params.voltageV) : 0;
  const safeI = Number.isFinite(params.currentA) ? Math.max(0, params.currentA) : 0;
  const measuredPowerW = safeV * safeI;
  const availableWindPowerW = 0.5 * safeRho * safeArea * Math.pow(safeWind, 3);
  const cpRatio = availableWindPowerW > 0 ? measuredPowerW / availableWindPowerW : 0;
  return {
    measuredPowerW: Number(measuredPowerW.toFixed(2)),
    availableWindPowerW: Number(availableWindPowerW.toFixed(2)),
    cpRatio: Number(cpRatio.toFixed(4)),
    exceedsBetzLimit: availableWindPowerW > 0 ? cpRatio > BETZ_LIMIT : measuredPowerW > 0.1,
    exceedsPracticalSmallWindCap: availableWindPowerW > 0 ? cpRatio > 0.35 : measuredPowerW > 0.1,
  };
}
