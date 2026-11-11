import type { TelemetryReading } from '../types/index.ts';
import { evaluateBetzPhysics } from './physics.ts';

export interface WindBinStat {
  binLabel: string;
  windMin: number;
  windMax: number;
  sampleCount: number;
  meanPowerW: number;
  medianPowerW: number;
  stdDevPowerW: number;
  outlierCount: number;
}

export function parseEsp32Csv(
  csvText: string,
  options: {
    siteId?: string;
    turbineId?: string;
    sweptAreaM2?: number;
    markAsTemplate?: boolean;
  } = {}
): { rows: TelemetryReading[]; errors: string[]; betzAnomalyCount: number } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must include a header row and at least one data row.'], betzAnomalyCount: 0 };
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const iTs = idx('Timestamp');
  const iCfg = idx('Config_ID');
  const iV = idx('Voltage_V');
  const iI = idx('Current_A');
  const iP = idx('Power_W');
  const iRpm = idx('Rotor_RPM');
  const iWind = idx('Wind_Speed_ms');
  const iDir = idx('Wind_Direction');
  const iVib = idx('Vib_XYZ_g');
  const iNotes = idx('Notes');

  if (iTs < 0 || iV < 0 || iI < 0 || iWind < 0) {
    return {
      rows: [],
      errors: ['Missing required columns: Timestamp, Voltage_V, Current_A, Wind_Speed_ms.'],
      betzAnomalyCount: 0,
    };
  }

  const sweptArea = options.sweptAreaM2 ?? 0.283;
  const rows: TelemetryReading[] = [];
  const errors: string[] = [];
  let betzAnomalyCount = 0;

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const cols = lines[lineIdx].split(',').map((c) => c.trim());
    const ts = cols[iTs];
    const tsMs = ts ? Date.parse(ts) : Number.NaN;
    const v = Number(cols[iV]);
    const curr = Number(cols[iI]);
    const wind = Number(cols[iWind]);
    const rpm = iRpm >= 0 ? Number(cols[iRpm]) : 0;

    if (!ts || Number.isNaN(tsMs) || !Number.isFinite(v) || !Number.isFinite(curr) || !Number.isFinite(wind)) {
      errors.push(`Row ${lineIdx + 1}: invalid timestamp or numeric value.`);
      continue;
    }

    const computedPower = Number((v * curr).toFixed(2));
    const reportedPower = iP >= 0 && Number.isFinite(Number(cols[iP])) ? Number(cols[iP]) : computedPower;
    const betzCheck = evaluateBetzPhysics({
      windSpeedMs: wind,
      sweptAreaM2: sweptArea,
      voltageV: v,
      currentA: curr,
    });

    let quality: TelemetryReading['dataQualityStatus'] = options.markAsTemplate ? 'uncalibrated_template' : 'valid';
    if (wind < 0 || v < 0 || curr < 0 || rpm < 0) {
      quality = 'out_of_range';
    } else if (wind > 0.5 && betzCheck.exceedsBetzLimit && reportedPower > 0.5) {
      quality = 'betz_anomaly';
      betzAnomalyCount++;
    }

    rows.push({
      id: `csv-row-${lineIdx}`,
      timestamp: ts,
      siteId: options.siteId || 'VNIT-BENCH',
      turbineId: options.turbineId || `HIST-${cols[iCfg] || 'UNKNOWN'}`,
      configId: iCfg >= 0 ? cols[iCfg] : undefined,
      windSpeedMs: wind,
      windDirection: iDir >= 0 ? cols[iDir] : undefined,
      rotorRpm: Number.isFinite(rpm) ? rpm : 0,
      dcVoltageV: v,
      dcCurrentA: curr,
      powerW: computedPower,
      vibrationG: iVib >= 0 ? cols[iVib] : undefined,
      dataQualityStatus: quality,
      notes:
        (iNotes >= 0 ? cols[iNotes] : '') +
        (betzCheck.exceedsBetzLimit && wind > 0.5
          ? ` [Betz Alert: Cp=${betzCheck.cpRatio.toFixed(2)} vs 0.593 max at A=${sweptArea}m2]`
          : ''),
    });
  }

  return { rows, errors, betzAnomalyCount };
}

export function computePowerCurveBins(readings: TelemetryReading[], binWidthMs = 1.0): WindBinStat[] {
  if (readings.length === 0) return [];
  const maxWind = Math.max(...readings.map((r) => r.windSpeedMs), 1);
  const binCount = Math.ceil((maxWind + 0.01) / binWidthMs);
  const bins: WindBinStat[] = [];

  for (let b = 0; b < binCount; b++) {
    const low = b * binWidthMs;
    const high = (b + 1) * binWidthMs;
    const matches = readings.filter((r) => r.windSpeedMs >= low && r.windSpeedMs < high);
    if (matches.length === 0) continue;

    const powers = matches.map((m) => m.powerW).sort((a, bVal) => a - bVal);
    const mean = powers.reduce((acc, p) => acc + p, 0) / powers.length;
    const mid = Math.floor(powers.length / 2);
    const median = powers.length % 2 !== 0 ? powers[mid] : (powers[mid - 1] + powers[mid]) / 2;
    const variance = powers.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / powers.length;
    const stdDev = Math.sqrt(variance);
    const outliers = matches.filter(
      (m) => m.dataQualityStatus === 'betz_anomaly' || (stdDev > 0 && Math.abs(m.powerW - mean) > 2 * stdDev)
    ).length;

    bins.push({
      binLabel: `${low.toFixed(1)}–${high.toFixed(1)} m/s`,
      windMin: Number(low.toFixed(1)),
      windMax: Number(high.toFixed(1)),
      sampleCount: matches.length,
      meanPowerW: Number(mean.toFixed(2)),
      medianPowerW: Number(median.toFixed(2)),
      stdDevPowerW: Number(stdDev.toFixed(2)),
      outlierCount: outliers,
    });
  }

  return bins;
}

export function exportTelemetryToCsv(readings: TelemetryReading[]): string {
  const header = 'Timestamp,Turbine_ID,Config_ID,Wind_Speed_ms,Rotor_RPM,Voltage_V,Current_A,Power_W,Data_Quality,Notes';
  const body = readings.map((r) =>
    [
      r.timestamp,
      r.turbineId,
      r.configId || '',
      r.windSpeedMs,
      r.rotorRpm,
      r.dcVoltageV,
      r.dcCurrentA,
      r.powerW,
      r.dataQualityStatus,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ].join(',')
  );
  return [header, ...body].join('\n');
}
