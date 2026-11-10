import React, { useMemo, useState } from 'react';
import {
  BETZ_LIMIT,
  DEFAULT_AIR_DENSITY,
  calculateHybridProfile,
  calculateRoiPayback,
  calculateWindPerformance,
} from '../../lib/physics.ts';
import { trackAnalyticsEvent } from '../../lib/analytics.ts';
import { EvidenceBadge } from './EvidenceBadge.tsx';

type CalcTab = 'wind' | 'roi' | 'hybrid';

export const CalculatorSuite: React.FC<{ initialTab?: CalcTab }> = ({ initialTab = 'wind' }) => {
  const [tab, setTab] = useState<CalcTab>(initialTab);

  // Wind physics state (defaults anchored to 1 m2 working assumptions)
  const [windSpeedMs, setWindSpeedMs] = useState(5.0);
  const [sweptAreaM2, setSweptAreaM2] = useState(1.0);
  const [airDensityKgM3, setAirDensityKgM3] = useState(DEFAULT_AIR_DENSITY);
  const [cp, setCp] = useState(0.38);
  const [etaMech, setEtaMech] = useState(0.85);
  const [etaGen, setEtaGen] = useState(0.82);
  const [etaElec, setEtaElec] = useState(0.9);
  const [hoursDay, setHoursDay] = useState(6);

  // ROI state (user supplies their own tariff — NO assumed INR 9-13)
  const [systemPriceInr, setSystemPriceInr] = useState(65000);
  const [installCostInr, setInstallCostInr] = useState(8000);
  const [batteryCostInr, setBatteryCostInr] = useState(12000);
  const [annualKwh, setAnnualKwh] = useState(320);
  const [tariffInrKwh, setTariffInrKwh] = useState(8.5);
  const [selfConsumptionPct, setSelfConsumptionPct] = useState(90);
  const [annualMaintInr, setAnnualMaintInr] = useState(2500);
  const [systemLifeYrs, setSystemLifeYrs] = useState(12);
  const [annualFinInr, setAnnualFinInr] = useState(0);

  // Hybrid state
  const [solarKw, setSolarKw] = useState(1.0);
  const [peakSunHrs, setPeakSunHrs] = useState(4.5);
  const [windSiteAvgW, setWindSiteAvgW] = useState(65);
  const [windHoursDay, setWindHoursDay] = useState(8);
  const [dailyLoadKwh, setDailyLoadKwh] = useState(5.0);
  const [batteryKwh, setBatteryKwh] = useState(2.4);

  const windRes = useMemo(
    () =>
      calculateWindPerformance({
        windSpeedMs,
        sweptAreaM2,
        airDensityKgM3,
        powerCoefficientCp: cp,
        transmissionEfficiency: etaMech,
        generatorEfficiency: etaGen,
        electronicsEfficiency: etaElec,
        operatingHoursPerDay: hoursDay,
      }),
    [windSpeedMs, sweptAreaM2, airDensityKgM3, cp, etaMech, etaGen, etaElec, hoursDay]
  );

  const roiRes = useMemo(
    () =>
      calculateRoiPayback({
        systemPriceInr,
        installationCostInr: installCostInr,
        batteryInverterCostInr: batteryCostInr,
        estimatedAnnualKwh: annualKwh,
        electricityTariffInrKwh: tariffInrKwh,
        selfConsumptionPct,
        annualMaintenanceInr: annualMaintInr,
        systemLifeYears: systemLifeYrs,
        annualFinancingCostInr: annualFinInr,
      }),
    [systemPriceInr, installCostInr, batteryCostInr, annualKwh, tariffInrKwh, selfConsumptionPct, annualMaintInr, systemLifeYrs, annualFinInr]
  );

  const hybridRes = useMemo(
    () =>
      calculateHybridProfile({
        solarKw,
        solarPeakSunHours: peakSunHrs,
        windRatedOutputAtSiteW: windSiteAvgW,
        windEffectiveHoursDay: windHoursDay,
        dailyLoadKwh,
        batteryUsableKwh: batteryKwh,
      }),
    [solarKw, peakSunHrs, windSiteAvgW, windHoursDay, dailyLoadKwh, batteryKwh]
  );

  const handleTabSwitch = (next: CalcTab) => {
    setTab(next);
    trackAnalyticsEvent('calculator_used', window.location.pathname, { calculator: next });
  };

  const applyWorking1m2Preset = (speed: number) => {
    setWindSpeedMs(speed);
    setSweptAreaM2(1.0);
    setAirDensityKgM3(1.225);
    trackAnalyticsEvent('calculator_used', window.location.pathname, { preset: `1m2_${speed}ms` });
  };

  return (
    <div className="rounded-2xl border border-[#DDE2DC] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE2DC] bg-[#F6F7F4] px-5 py-4 rounded-t-2xl">
        <div>
          <h3 className="text-lg font-bold text-[#141A18]">Engineering & Commercial Feasibility Calculators</h3>
          <p className="text-xs text-[#434E4A]">
            Theoretical models with explicit boundaries — never presented as measured turbine output.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Calculator modes">
          {[
            { id: 'wind' as const, label: 'Wind Physics' },
            { id: 'roi' as const, label: 'ROI & Payback' },
            { id: 'hybrid' as const, label: 'Solar-Wind Hybrid' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => handleTabSwitch(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === item.id
                  ? 'bg-[#0B2B22] text-white'
                  : 'border border-[#DDE2DC] bg-white text-[#141A18] hover:bg-[#EDF0EB]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'wind' && (
        <div className="grid gap-6 p-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <EvidenceBadge tier="ENGINEERING_ESTIMATE" />
              <div className="flex gap-1.5">
                {[5, 8, 11].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applyWorking1m2Preset(s)}
                    className="rounded border border-[#DDE2DC] px-2 py-0.5 font-mono text-[11px] text-[#0B2B22] hover:bg-[#F6F7F4]"
                  >
                    1m² @ {s}m/s
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Wind Speed (m/s)</span>
                <input
                  type="number"
                  step="0.1"
                  value={windSpeedMs}
                  onChange={(e) => setWindSpeedMs(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Swept Area A (m²)</span>
                <input
                  type="number"
                  step="0.05"
                  value={sweptAreaM2}
                  onChange={(e) => setSweptAreaM2(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Air Density ρ (kg/m³)</span>
                <input
                  type="number"
                  step="0.01"
                  value={airDensityKgM3}
                  onChange={(e) => setAirDensityKgM3(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Rotor Cp (≤ {BETZ_LIMIT.toFixed(3)})</span>
                <input
                  type="number"
                  step="0.01"
                  value={cp}
                  onChange={(e) => setCp(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Mech. Eff. (0–1)</span>
                <input
                  type="number"
                  step="0.01"
                  value={etaMech}
                  onChange={(e) => setEtaMech(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Gen. Eff. (0–1)</span>
                <input
                  type="number"
                  step="0.01"
                  value={etaGen}
                  onChange={(e) => setEtaGen(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Elec. Eff. (0–1)</span>
                <input
                  type="number"
                  step="0.01"
                  value={etaElec}
                  onChange={(e) => setEtaElec(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Hrs / Day at Speed</span>
                <input
                  type="number"
                  step="0.5"
                  value={hoursDay}
                  onChange={(e) => setHoursDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-3 py-2 font-mono text-sm"
                />
              </label>
            </div>

            {windRes.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
                {windRes.errors.map((err) => (
                  <p key={err}>• {err}</p>
                ))}
              </div>
            )}

            {windRes.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {windRes.warnings.map((w) => (
                  <p key={w}>• {w}</p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Available Wind P_wind</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#141A18]">
                  {windRes.windPowerW.toFixed(1)} W
                </div>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Betz Physical Ceiling</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#434E4A]">
                  {windRes.betzMaxPowerW.toFixed(1)} W
                </div>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Est. Shaft Power</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#141A18]">
                  {windRes.shaftPowerW.toFixed(1)} W
                </div>
              </div>
              <div className="rounded-xl border border-[#0B2B22] bg-[#0B2B22] p-3 text-white">
                <div className="text-[11px] text-emerald-200">Est. Electrical Output</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums">
                  {windRes.electricalPowerW.toFixed(1)} W
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-[#DDE2DC] p-4 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-[#434E4A]">System Combined Efficiency:</span>
                <div className="font-mono text-sm font-semibold text-[#141A18]">
                  {(windRes.overallSystemCp * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-[#434E4A]">Estimated Daily Energy:</span>
                <div className="font-mono text-sm font-semibold text-[#141A18]">
                  {windRes.dailyEstimatedWh.toFixed(1)} Wh / day
                </div>
              </div>
              <div>
                <span className="text-[#434E4A]">Estimated Annual Energy:</span>
                <div className="font-mono text-sm font-semibold text-[#141A18]">
                  {windRes.annualEstimatedKwh.toFixed(1)} kWh / yr
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-[#434E4A]">
                <span>Cubic Wind Speed Sensitivity (1–12 m/s, Betz Cap vs Estimated Electrical Output)</span>
                <span className="font-mono">P ∝ V³</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#DDE2DC]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F7F4] text-[#434E4A]">
                    <tr>
                      <th className="px-2.5 py-2">Wind (m/s)</th>
                      <th className="px-2.5 py-2">P_wind (W)</th>
                      <th className="px-2.5 py-2">Betz 59.3% Max</th>
                      <th className="px-2.5 py-2">Est. Elec (W)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE2DC] font-mono tabular-nums">
                    {windRes.sensitivityCurve
                      .filter((r) => [2, 3, 5, 8, 10, 11].includes(r.windSpeedMs))
                      .map((row) => (
                        <tr key={row.windSpeedMs} className={row.windSpeedMs === Math.round(windSpeedMs) ? 'bg-emerald-50/70 font-semibold' : ''}>
                          <td className="px-2.5 py-1.5">{row.windSpeedMs} m/s</td>
                          <td className="px-2.5 py-1.5">{row.windPowerW} W</td>
                          <td className="px-2.5 py-1.5">{row.betzMaxW} W</td>
                          <td className="px-2.5 py-1.5 text-[#0B2B22]">{row.electricalPowerW} W</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-[#434E4A]">
              <strong>Model Limitations:</strong> Steady-state calculation assumes uniform laminar freestream flow across{' '}
              <code>A = {sweptAreaM2} m²</code>, constant Cp across operating speeds, and ignores atmospheric turbulence,
              cut-in hysteresis, gearbox thermal transients, and site-specific Weibull wind distributions. Not a measured output guarantee.
            </p>
          </div>
        </div>
      )}

      {tab === 'roi' && (
        <div className="grid gap-6 p-5 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-6">
            <div className="flex items-center justify-between">
              <EvidenceBadge tier="COMMERCIAL_ASSUMPTION" />
              <span className="text-xs text-[#434E4A]">Enter your exact local tariff & costs</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">System Price (₹)</span>
                <input
                  type="number"
                  value={systemPriceInr}
                  onChange={(e) => setSystemPriceInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Install Cost (₹)</span>
                <input
                  type="number"
                  value={installCostInr}
                  onChange={(e) => setInstallCostInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Battery/Inv (₹)</span>
                <input
                  type="number"
                  value={batteryCostInr}
                  onChange={(e) => setBatteryCostInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Est. kWh / Year</span>
                <input
                  type="number"
                  value={annualKwh}
                  onChange={(e) => setAnnualKwh(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Your Tariff (₹/kWh)</span>
                <input
                  type="number"
                  step="0.5"
                  value={tariffInrKwh}
                  onChange={(e) => setTariffInrKwh(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Self-Use (%)</span>
                <input
                  type="number"
                  value={selfConsumptionPct}
                  onChange={(e) => setSelfConsumptionPct(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Annual O&amp;M (₹)</span>
                <input
                  type="number"
                  value={annualMaintInr}
                  onChange={(e) => setAnnualMaintInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Life (Years)</span>
                <input
                  type="number"
                  value={systemLifeYrs}
                  onChange={(e) => setSystemLifeYrs(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Financing/yr (₹)</span>
                <input
                  type="number"
                  value={annualFinInr}
                  onChange={(e) => setAnnualFinInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
            </div>
            {roiRes.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
                {roiRes.errors.map((e) => (
                  <p key={e}>• {e}</p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Total Installed CapEx (Est.)</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums">
                  ₹{roiRes.totalCapexInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Simple Payback (Est.)</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#B45309]">
                  {roiRes.simplePaybackYears !== null ? `${roiRes.simplePaybackYears.toFixed(1)} yrs` : 'Not recovered'}
                </div>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Net Annual Bill Offset (Est.)</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums">
                  ₹{Math.round(roiRes.netAnnualSavingsInr).toLocaleString('en-IN')}/yr
                </div>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Undiscounted Lifetime Net</div>
                <div
                  className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                    roiRes.lifetimeNetSavingsInr >= 0 ? 'text-emerald-800' : 'text-red-700'
                  }`}
                >
                  ₹{Math.round(roiRes.lifetimeNetSavingsInr).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#434E4A]">
              <strong>Important Disclosure:</strong> All figures above are illustrative user-entered estimates. Payback
              depends heavily on actual measured annual kWh, displaced diesel/utility tariff, battery replacement, and
              site wind resource—none of which can be guaranteed before site validation.
            </p>
          </div>
        </div>
      )}

      {tab === 'hybrid' && (
        <div className="grid gap-6 p-5 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <EvidenceBadge tier="ENGINEERING_ESTIMATE" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Solar Array (kW)</span>
                <input
                  type="number"
                  step="0.25"
                  value={solarKw}
                  onChange={(e) => setSolarKw(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Peak Sun Hours/d</span>
                <input
                  type="number"
                  step="0.5"
                  value={peakSunHrs}
                  onChange={(e) => setPeakSunHrs(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Est. Wind Avg Output (W)</span>
                <input
                  type="number"
                  step="5"
                  value={windSiteAvgW}
                  onChange={(e) => setWindSiteAvgW(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Effective Wind Hrs/d</span>
                <input
                  type="number"
                  step="1"
                  value={windHoursDay}
                  onChange={(e) => setWindHoursDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Daily Site Load (kWh)</span>
                <input
                  type="number"
                  step="0.5"
                  value={dailyLoadKwh}
                  onChange={(e) => setDailyLoadKwh(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-[#434E4A]">Usable Battery (kWh)</span>
                <input
                  type="number"
                  step="0.5"
                  value={batteryKwh}
                  onChange={(e) => setBatteryKwh(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 font-mono"
                />
              </label>
            </div>
            <p className="text-xs text-[#434E4A]">
              Solar-wind complementarity depends strictly on location, monsoon cloudiness, and local diurnal wind logs.
            </p>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Solar-Only Est.</div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums">{hybridRes.solarDailyKwh} kWh/d</div>
                <div className="text-[11px] text-[#434E4A]">{hybridRes.solarCoveragePct}% load</div>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Wind-Only Est.</div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums">{hybridRes.windDailyKwh} kWh/d</div>
                <div className="text-[11px] text-[#434E4A]">{hybridRes.windCoveragePct}% load</div>
              </div>
              <div className="rounded-xl border border-[#0B2B22] bg-[#0B2B22] p-3 text-white">
                <div className="text-[11px] text-emerald-200">Solar + Wind Est.</div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums">{hybridRes.hybridDailyKwh} kWh/d</div>
                <div className="text-[11px] text-emerald-200">{hybridRes.hybridCoveragePct}% load</div>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="text-[11px] text-[#434E4A]">Battery Buffer Only</div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums">{hybridRes.batteryAutonomyHours} h</div>
                <div className="text-[11px] text-[#434E4A]">Without generation</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#DDE2DC] p-3">
              <div className="mb-2 text-xs font-semibold text-[#141A18]">
                Illustrative 24-Hour Generation Profile Estimate (Solar Bell vs Diurnal Wind Input)
              </div>
              <div className="flex h-28 items-end gap-1" aria-label="24 hour hybrid comparison bar profile">
                {hybridRes.hourlyProfile.map((pt) => {
                  const maxVal = Math.max(...hybridRes.hourlyProfile.map((h) => h.combinedW), 10);
                  const solarH = (pt.solarW / maxVal) * 100;
                  const windH = (pt.windW / maxVal) * 100;
                  return (
                    <div key={pt.hour} className="flex flex-1 flex-col items-center justify-end h-full" title={`${pt.hour}: Solar ${pt.solarW}W + Wind ${pt.windW}W`}>
                      <div className="w-full flex flex-col justify-end h-full gap-[1px]">
                        <div className="w-full rounded-t-sm bg-emerald-700" style={{ height: `${windH}%` }} />
                        <div className="w-full rounded-b-sm bg-amber-400" style={{ height: `${solarH}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-[#434E4A]">
                <span>00:00 (Night)</span>
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-amber-400" /> Solar PV Est.</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-emerald-700" /> Wind Est.</span>
                </span>
                <span>23:00</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
