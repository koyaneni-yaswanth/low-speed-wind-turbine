import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Radio, Upload } from 'lucide-react';
import { computePowerCurveBins, exportTelemetryToCsv, parseEsp32Csv } from '../lib/csvTelemetry.ts';
import type { TelemetryReading } from '../types/index.ts';
import { ASSET_MANIFEST } from '../data/pawanShaktiData.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';
import { CalculatorSuite } from '../components/common/CalculatorSuite.tsx';

export const PerformancePage: React.FC = () => {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [dataLabel, setDataLabel] = useState<string>('');
  const [sweptAreaForAudit, setSweptAreaForAudit] = useState<number>(0.283);
  const [filterConfig, setFilterConfig] = useState<string>('ALL');
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Performance, Calculators & Telemetry — PAWAN SHAKTI',
        description:
          'Interactive wind physics, ROI, and solar-wind hybrid calculators alongside Betz-checked CSV telemetry inspection.',
      },
      '/performance'
    );
  }, []);

  const handleLoadTemplateCsv = async () => {
    const url = ASSET_MANIFEST.templateCsv?.publicUrl;
    if (!url) return;
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      const parsed = parseEsp32Csv(text, {
        siteId: 'VNIT-HIST',
        turbineId: 'TEMPLATE-CSV',
        sweptAreaM2: sweptAreaForAudit,
        markAsTemplate: true,
      });
      setReadings(parsed.rows);
      setParseErrors(parsed.errors);
      setDataLabel('Archived Template Log (testing/raw-data/sample-sensor-log-template.csv — NOT certified field proof)');
    } catch {
      setParseErrors(['Unable to load repository template CSV.']);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseEsp32Csv(text, {
      siteId: 'USER-UPLOAD',
      turbineId: file.name,
      sweptAreaM2: sweptAreaForAudit,
      markAsTemplate: false,
    });
    setReadings(parsed.rows);
    setParseErrors(parsed.errors);
    setDataLabel(`Local CSV Inspection: ${file.name}`);
  };

  const visibleReadings = useMemo(
    () => (filterConfig === 'ALL' ? readings : readings.filter((r) => r.configId === filterConfig)),
    [readings, filterConfig]
  );

  const bins = useMemo(() => computePowerCurveBins(visibleReadings, 1.0), [visibleReadings]);

  const handleDownloadExport = () => {
    if (visibleReadings.length === 0) return;
    const csv = exportTelemetryToCsv(visibleReadings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pawan-shakti-audited-telemetry.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#DDE2DC] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceBadge tier="PROTOTYPE_OBSERVATION" />
          <EvidenceBadge tier="ENGINEERING_ESTIMATE" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">
          Performance Evidence, Calculators &amp; Telemetry Validation
        </h1>
        <p className="max-w-3xl text-sm text-[#434E4A]">
          Theoretical wind calculators are cleanly separated from real telemetry measurements. Uncalibrated prototype observations
          are flagged explicitly rather than presented as certified turbine curves.
        </p>
      </header>

      {/* Live Telemetry Honest Empty State & CSV Audit Inspector */}
      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE2DC] pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-800">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#141A18]">
                Live Cloud Telemetry Status: No Live Telemetry Connected
              </h2>
              <p className="text-xs text-[#434E4A]">
                Zero ESP32/STM32 field units are streaming to this endpoint right now. Placeholder synthetic wattage graphs
                are intentionally omitted. You can inspect historical CSV logs or test your own sensor CSV below.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleLoadTemplateCsv}
              className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] px-3.5 py-2 text-xs font-semibold text-[#141A18] hover:bg-[#EDF0EB]"
            >
              Inspect Repo Sample CSV
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0B2B22] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#144537]">
              <Upload className="h-3.5 w-3.5" /> Inspect Local CSV
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="sr-only" />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2">
            <span className="font-medium text-[#434E4A]">Assumed Rotor Swept Area for Betz Audit (m²):</span>
            <input
              type="number"
              step="0.01"
              value={sweptAreaForAudit}
              onChange={(e) => setSweptAreaForAudit(Number(e.target.value) || 0.283)}
              className="w-24 rounded-lg border border-[#DDE2DC] px-2 py-1 font-mono"
            />
          </label>
          {readings.length > 0 && (
            <>
              <select
                value={filterConfig}
                onChange={(e) => setFilterConfig(e.target.value)}
                aria-label="Filter telemetry rows by configuration"
                className="rounded-lg border border-[#DDE2DC] px-2.5 py-1 text-xs"
              >
                <option value="ALL">All Configs ({readings.length})</option>
                {Array.from(new Set(readings.map((r) => r.configId).filter(Boolean))).map((cfg) => (
                  <option key={cfg} value={cfg}>
                    Config {cfg}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleDownloadExport}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DDE2DC] px-2.5 py-1 text-xs font-medium text-[#0B2B22] hover:bg-[#F6F7F4]"
              >
                <Download className="h-3.5 w-3.5" /> Export Audited CSV
              </button>
            </>
          )}
        </div>

        {parseErrors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {parseErrors.map((err) => (
              <p key={err}>• {err}</p>
            ))}
          </div>
        )}

        {visibleReadings.length > 0 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>{dataLabel}</span>
              </div>
              <span className="font-mono">
                Betz Anomalies Flagged: {visibleReadings.filter((r) => r.dataQualityStatus === 'betz_anomaly').length} /{' '}
                {visibleReadings.length} rows
              </span>
            </div>

            {bins.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#434E4A]">
                  Wind-Speed Bin Summary (Uncalibrated / Audit View)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#DDE2DC]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F6F7F4] text-[#434E4A]">
                      <tr>
                        <th className="px-3 py-2">Wind Bin</th>
                        <th className="px-3 py-2">Samples (n)</th>
                        <th className="px-3 py-2">Mean Power</th>
                        <th className="px-3 py-2">Median Power</th>
                        <th className="px-3 py-2">Std Dev</th>
                        <th className="px-3 py-2">Flagged Outliers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE2DC] font-mono tabular-nums">
                      {bins.map((b) => (
                        <tr key={b.binLabel}>
                          <td className="px-3 py-2">{b.binLabel}</td>
                          <td className="px-3 py-2">{b.sampleCount}</td>
                          <td className="px-3 py-2">{b.meanPowerW} W</td>
                          <td className="px-3 py-2">{b.medianPowerW} W</td>
                          <td className="px-3 py-2">{b.stdDevPowerW} W</td>
                          <td className={`px-3 py-2 ${b.outlierCount > 0 ? 'font-bold text-amber-800' : ''}`}>
                            {b.outlierCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="max-h-72 overflow-auto rounded-xl border border-[#DDE2DC]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#F6F7F4] text-[#434E4A]">
                  <tr>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Cfg</th>
                    <th className="px-3 py-2">Wind</th>
                    <th className="px-3 py-2">RPM</th>
                    <th className="px-3 py-2">V / I</th>
                    <th className="px-3 py-2">P = V·I</th>
                    <th className="px-3 py-2">Quality Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2DC] font-mono text-[11px] tabular-nums">
                  {visibleReadings.map((r) => (
                    <tr key={r.id} className={r.dataQualityStatus === 'betz_anomaly' ? 'bg-amber-50/60' : ''}>
                      <td className="px-3 py-1.5 whitespace-nowrap">{r.timestamp}</td>
                      <td className="px-3 py-1.5">{r.configId || '-'}</td>
                      <td className="px-3 py-1.5">{r.windSpeedMs} m/s</td>
                      <td className="px-3 py-1.5">{r.rotorRpm}</td>
                      <td className="px-3 py-1.5">
                        {r.dcVoltageV}V / {r.dcCurrentA}A
                      </td>
                      <td className="px-3 py-1.5 font-semibold">{r.powerW} W</td>
                      <td className="px-3 py-1.5">{r.dataQualityStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Interactive Calculator Suite */}
      <section>
        <CalculatorSuite />
      </section>
    </div>
  );
};
