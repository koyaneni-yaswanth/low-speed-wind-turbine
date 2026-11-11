import type { TelemetryReading, TurbineDevice } from '../types/index.ts';

/** Maps a raw PostgreSQL snake_case row (or camelCase object) into a strongly-typed TelemetryReading. */
export function mapDbTelemetryRow(row: Record<string, any>): TelemetryReading {
  const windSpeedMs = Number(row.wind_speed_ms ?? row.windSpeedMs ?? 0);
  const dcVoltageV = Number(row.dc_voltage_v ?? row.dcVoltageV ?? 0);
  const dcCurrentA = Number(row.dc_current_a ?? row.dcCurrentA ?? 0);
  const powerW = Number(row.power_w ?? row.powerW ?? Number((dcVoltageV * dcCurrentA).toFixed(3)));
  const rawQuality = String(row.data_quality_status ?? row.dataQualityStatus ?? 'valid');
  const dataQualityStatus: TelemetryReading['dataQualityStatus'] =
    rawQuality === 'betz_anomaly' ||
    rawQuality === 'missing_fields' ||
    rawQuality === 'uncalibrated_template' ||
    rawQuality === 'out_of_range'
      ? rawQuality
      : 'valid';

  return {
    id: String(row.id ?? `tel-${Date.now()}`),
    timestamp: String(row.device_timestamp ?? row.timestamp ?? new Date().toISOString()),
    ingestedAt: row.ingested_at ? String(row.ingested_at) : row.ingestedAt ? String(row.ingestedAt) : undefined,
    siteId: String(row.site_id ?? row.siteId ?? 'UNASSIGNED'),
    turbineId: String(row.turbine_id ?? row.turbineId ?? 'PS-TRL4'),
    windSpeedMs,
    windDirection: row.wind_direction ?? row.windDirection ?? undefined,
    rotorRpm: Number(row.rotor_rpm ?? row.rotorRpm ?? 0),
    generatorRpm: row.generator_rpm != null ? Number(row.generator_rpm) : row.generatorRpm,
    dcVoltageV,
    dcCurrentA,
    powerW,
    cumulativeEnergyWh: row.cumulative_energy_wh != null ? Number(row.cumulative_energy_wh) : row.cumulativeEnergyWh,
    temperatureC: row.temperature_c != null ? Number(row.temperature_c) : row.temperatureC,
    vibrationG: row.vibration_g ?? row.vibrationG ?? undefined,
    brakeState: (row.brake_state ?? row.brakeState ?? 'unknown') as TelemetryReading['brakeState'],
    batterySocPct: row.battery_soc_pct != null ? Number(row.battery_soc_pct) : row.batterySocPct,
    deviceHealth: row.device_health ?? row.deviceHealth ?? 'online',
    sensorHealth: row.sensor_health ?? row.sensorHealth ?? 'nominal',
    dataQualityStatus,
    faultCode: row.fault_code ?? row.faultCode ?? undefined,
  };
}

/** Maps a raw PostgreSQL snake_case turbines row into a TurbineDevice view model. */
export function mapDbTurbineRow(row: Record<string, any>): TurbineDevice {
  return {
    id: String(row.id ?? row.turbine_code ?? `t-${Date.now()}`),
    turbineId: String(row.turbine_code ?? row.turbineId ?? 'UNKNOWN'),
    configurationName: String(row.prototype_version ?? row.configurationName ?? 'TRL 4 Unit'),
    prototypeVersion: String(row.prototype_version ?? row.prototypeVersion ?? 'TRL 4'),
    rotorArchitecture: String(row.blade_geometry ?? row.gear_architecture ?? row.rotorArchitecture ?? 'Under configuration'),
    transmissionType: String(row.gear_architecture ?? row.transmissionType ?? 'Planetary / Magnetic Candidate'),
    gearRatio: String(row.gear_ratio ?? row.gearRatio ?? 'Under test'),
    generatorDetails: String(row.generator_details ?? row.generator_rating ?? row.generatorDetails ?? 'Coreless PMA candidate'),
    controllerDetails: String(row.controller_details ?? row.controllerDetails ?? 'ESP32 / STM32 DAQ'),
    siteName: String(row.installation_site ?? row.siteName ?? 'VNIT Nagpur'),
    commissioningDate: String(row.commissioning_date ?? row.build_date ?? row.commissioningDate ?? 'Pending'),
    firmwareVersion: String(row.firmware_version ?? row.firmwareVersion ?? 'v1.0-pending'),
    sensorConfig: String(row.sensor_configuration ?? row.sensorConfig ?? 'Monitoring Only'),
    safetyStatus: (row.safety_status ?? row.safetyStatus ?? 'monitoring_only_no_remote_actuation') as TurbineDevice['safetyStatus'],
    operationalState: (row.operational_state ?? row.operationalState ?? 'bench_idle') as TurbineDevice['operationalState'],
    lastTelemetryAt: row.last_telemetry_at ?? row.lastTelemetryAt ?? null,
  };
}

/** Filters telemetry points by dashboard time window while retaining CSV uploads regardless of historical timestamps when Live/Custom is selected. */
export function filterTelemetryByRange(
  rows: TelemetryReading[],
  range: 'Live' | '1h' | '24h' | '7d' | '30d' | 'Custom',
  nowMs = Date.now()
): TelemetryReading[] {
  if (range === 'Live' || range === 'Custom' || rows.length === 0) {
    return rows;
  }
  const windowMsMap: Record<'1h' | '24h' | '7d' | '30d', number> = {
    '1h': 3_600_000,
    '24h': 86_400_000,
    '7d': 7 * 86_400_000,
    '30d': 30 * 86_400_000,
  };
  const cutoff = nowMs - windowMsMap[range];
  const filtered = rows.filter((r) => {
    const t = Date.parse(r.timestamp);
    return Number.isFinite(t) && t >= cutoff;
  });
  return filtered;
}
