import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Plus, Radio, ShieldCheck, Upload } from 'lucide-react';
import { OPTION_COMPARISON_CRITERIA } from '../../data/pawanShaktiData.ts';
import type {
  OptionComparisonCriterion,
  TelemetryReading,
  TestRunRecord,
  TestRunState,
  TurbineDevice,
} from '../../types/index.ts';
import { computePowerCurveBins, exportTelemetryToCsv, parseEsp32Csv } from '../../lib/csvTelemetry.ts';
import { EvidenceBadge } from '../common/EvidenceBadge.tsx';

export const EngineeringWorkbenchTab: React.FC<{ canEdit: boolean; accessToken?: string | null }> = ({
  canEdit,
  accessToken,
}) => {
  const [turbines, setTurbines] = useState<TurbineDevice[]>([
    {
      id: 't-m4',
      turbineId: 'PS-TRL4-MARK4-RIG',
      configurationName: 'Mark-4 4-Rotor Planar Planetary',
      prototypeVersion: 'Mark-4 (TRL 4)',
      rotorArchitecture: '4 × 300 mm multi-blade impellers (S1223 derived)',
      transmissionType: '4-setup planetary + rear fan gear',
      gearRatio: '1:10 nominal',
      generatorDetails: 'Bench 24 V / 100 W PM DC (cogging under review)',
      controllerDetails: 'ESP32 dev logger prototype (not continuously mounted)',
      siteName: 'VNIT Nagpur Lab Bench',
      commissioningDate: 'Pending calibrated run',
      firmwareVersion: 'v0.1-protocol',
      sensorConfig: 'Anemometer, opto-tachometer, divider, ACS712/INA226',
      safetyStatus: 'monitoring_only_no_remote_actuation',
      operationalState: 'offline',
      lastTelemetryAt: null,
    },
  ]);

  const [newTurbineId, setNewTurbineId] = useState('');
  const [newTurbineArch, setNewTurbineArch] = useState('Option A — Coaxial Magnetic Gear (~1 m²)');
  const [deviceUidInput, setDeviceUidInput] = useState('ESP32-PS-01');
  const [samplingHzInput, setSamplingHzInput] = useState(1);
  const [oneTimeKeyNotice, setOneTimeKeyNotice] = useState('');
  const [timeRange, setTimeRange] = useState<'Live' | '1h' | '24h' | '7d' | '30d' | 'Custom'>('Live');
  const [telemetry, setTelemetry] = useState<TelemetryReading[]>([]);
  const [telemetrySource, setTelemetrySource] = useState<'none' | 'csv_upload' | 'live_hardware'>('none');
  const [csvNotice, setCsvNotice] = useState('');
  const [syncNotice, setSyncNotice] = useState('');

  const [testRuns, setTestRuns] = useState<TestRunRecord[]>([
    {
      id: 'run-hist-1',
      testId: 'EXP-M3-001 (Historical)',
      turbineId: 'PS-TRL4-MARK3',
      objective: 'Early outdoor campus cut-in & resistive load check',
      configuration: 'Config A (3-Rotor)',
      location: 'VNIT Campus',
      startTime: '2026-07-29 09:00',
      endTime: '2026-07-29 10:45',
      sensorsUsed: 'Fluke DMM + optical tachometer + cup anemometer',
      calibrationStatus: 'Uncalibrated / manual spot readings',
      operator: 'Koyaneni Yaswanth',
      weatherConditions: 'Variable morning breeze',
      safetyChecklistCompleted: true,
      resultSummary: 'Observed rotation above 2.3–2.5 m/s; requires continuous 1 Hz closed-loop repeat.',
      failureNotes: 'FDM gear mesh rattle',
      reviewedBy: 'Pending Dr. Bhukya formal DAQ review',
      state: 'completed',
      evidenceTier: 'PROTOTYPE_OBSERVATION',
    },
  ]);

  const [newRunObjective, setNewRunObjective] = useState('');
  const [comparisons, setComparisons] = useState<OptionComparisonCriterion[]>(OPTION_COMPARISON_CRITERIA);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    (async () => {
      try {
        const [telResp, admResp] = await Promise.all([
          fetch('/api/telemetry', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/admin', { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);
        if (!active) return;
        if (telResp.ok) {
          const telData = await telResp.json();
          if (Array.isArray(telData.telemetry) && telData.telemetry.length > 0) {
            setTelemetry(telData.telemetry);
            setTelemetrySource('live_hardware');
          }
          if (Array.isArray(telData.testRuns) && telData.testRuns.length > 0) {
            setTestRuns(
              telData.testRuns.map((r: any) => ({
                id: r.id,
                testId: r.test_code,
                turbineId: r.turbine_id || 'PS-TRL4',
                objective: r.objective,
                configuration: r.configuration,
                location: r.location,
                startTime: r.start_time || '',
                endTime: r.end_time || '',
                sensorsUsed: r.sensors_used || '',
                calibrationStatus: r.calibration_status || r.calibration_details || 'Uncalibrated',
                operator: r.operator_name || 'Team',
                weatherConditions: r.weather_conditions || '',
                safetyChecklistCompleted: Boolean(r.safety_checklist_passed),
                resultSummary: r.result_summary || '',
                failureNotes: r.failure_notes || '',
                reviewedBy: r.reviewed_by || 'Pending formal review',
                state: r.state || 'draft',
                evidenceTier: r.evidence_tier || 'PROTOTYPE_OBSERVATION',
              }))
            );
          }
          setSyncNotice('Synced with live Supabase engineering records.');
        }
        if (admResp.ok) {
          const admData = await admResp.json();
          if (Array.isArray(admData.optionComparisons) && admData.optionComparisons.length > 0) {
            setComparisons(
              admData.optionComparisons.map((c: any) => ({
                id: c.id,
                criterion: c.criterion,
                optionANotes: c.option_a_notes,
                optionBNotes: c.option_b_notes,
                optionAScore: c.option_a_score,
                optionBScore: c.option_b_score,
                measurementBasis: c.measurement_basis,
                evidenceTier: c.evidence_tier,
              }))
            );
          }
        }
      } catch {
        if (active) setSyncNotice('Cloud sync check unavailable offline.');
      }
    })();
    return () => {
      active = false;
    };
  }, [accessToken]);

  const handleRegisterTurbine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newTurbineId.trim()) return;
    const code = newTurbineId.trim();
    if (accessToken) {
      const resp = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          action: 'upsert_turbine',
          turbineCode: code,
          prototypeVersion: 'TRL 4 Test Unit',
          sweptAreaM2: 1.0,
          gearArchitecture: newTurbineArch.includes('Option A') ? 'Coaxial Magnetic' : 'Planetary',
          generatorRating: '300-500 W Coreless PMA candidate',
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setSyncNotice(`Save failed: ${err.error || resp.status}`);
        return;
      }
      setSyncNotice(`Saved prototype ${code} to Supabase.`);
    }
    setTurbines((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        turbineId: code,
        configurationName: newTurbineArch,
        prototypeVersion: 'TRL 4 Test Unit',
        rotorArchitecture: newTurbineArch,
        transmissionType: newTurbineArch.includes('Option A') ? 'Coaxial Magnetic' : 'Planetary',
        gearRatio: 'Under test',
        generatorDetails: '300-500 W Coreless PMA candidate',
        controllerDetails: 'ESP32 / STM32 DAQ',
        siteName: 'VNIT Nagpur',
        commissioningDate: new Date().toISOString().slice(0, 10),
        firmwareVersion: 'v1.0-pending',
        sensorConfig: 'Calibrated Anemometer + Hall RPM + INA226',
        safetyStatus: 'monitoring_only_no_remote_actuation',
        operationalState: 'bench_idle',
        lastTelemetryAt: null,
      },
    ]);
    setNewTurbineId('');
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !deviceUidInput.trim()) return;
    if (!accessToken) {
      setOneTimeKeyNotice('Live Supabase Admin session required to mint persistent HMAC device credentials.');
      return;
    }
    const resp = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        action: 'register_device',
        deviceUid: deviceUidInput.trim(),
        samplingIntervalSec: Math.max(1, Math.round(1 / Math.max(0.01, samplingHzInput))),
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 201 && data.oneTimeDeviceKey) {
      setOneTimeKeyNotice(
        `Registered ${data.device.deviceUid} (save HMAC key now — shown once): ${data.oneTimeDeviceKey}`
      );
    } else {
      setOneTimeKeyNotice(data.error || `Device registration returned HTTP ${resp.status}`);
    }
  };

  const handleCreateTestRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newRunObjective.trim()) return;
    const objective = newRunObjective.trim();
    const testId = `TR-${new Date().toISOString().slice(0, 10)}-${testRuns.length + 1}`;
    if (accessToken) {
      const resp = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          action: 'create_test_run',
          testId,
          objective,
          configuration: 'Option A vs Option B Dyno Protocol',
          location: 'VNIT Lab',
          sensorsUsed: 'Anemometer, Hall RPM, INA226 Shunt, Temp, ADXL345',
          calibrationStatus: 'Calibrated bench load required',
          safetyChecklistCompleted: true,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setSyncNotice(`Test run save failed: ${err.error || resp.status}`);
        return;
      }
      setSyncNotice(`Created persisted test run ${testId}.`);
    }
    setTestRuns((prev) => [
      {
        id: `run-${Date.now()}`,
        testId,
        turbineId: turbines[0]?.turbineId || 'PS-TRL4-MARK4-RIG',
        objective,
        configuration: 'Option A vs Option B Dyno Protocol',
        location: 'VNIT Lab',
        startTime: new Date().toISOString(),
        endTime: '',
        sensorsUsed: 'Anemometer, Hall RPM, INA226 Shunt, Temp, ADXL345',
        calibrationStatus: 'Calibrated bench load required',
        operator: 'Engineering Team',
        weatherConditions: 'Controlled Bench / Flow Channel',
        safetyChecklistCompleted: true,
        resultSummary: 'Awaiting telemetry upload',
        failureNotes: '',
        reviewedBy: 'Pending',
        state: 'draft',
        evidenceTier: 'PROTOTYPE_OBSERVATION',
      },
      ...prev,
    ]);
    setNewRunObjective('');
  };

  const transitionRunState = async (id: string, nextState: TestRunState) => {
    if (!canEdit) return;
    const current = testRuns.find((r) => r.id === id);
    if (nextState === 'reviewed' && current?.state !== 'completed') {
      setSyncNotice('Blocked: Test run must be in "completed" state before formal review approval.');
      return;
    }
    if (accessToken) {
      const resp = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action: 'transition_test_run', id, nextState }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setSyncNotice(`Transition rejected: ${err.error || resp.status}`);
        return;
      }
    }
    setTestRuns((prev) => prev.map((r) => (r.id === id ? { ...r, state: nextState } : r)));
  };

  const handleUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseEsp32Csv(text, { sweptAreaM2: 1.0, turbineId: turbines[0]?.turbineId });
    setTelemetry(parsed.rows);
    setTelemetrySource(parsed.rows.length > 0 ? 'csv_upload' : 'none');
    setCsvNotice(
      `Loaded ${parsed.rows.length} CSV rows locally (${parsed.betzAnomalyCount} Betz anomalies, ${parsed.errors.length} row errors).`
    );
  };

  const updateScore = async (id: string, side: 'A' | 'B', val: string) => {
    if (!canEdit) return;
    const num = val === '' ? null : Math.max(1, Math.min(5, Number(val)));
    const nextList = comparisons.map((c) =>
      c.id === id ? (side === 'A' ? { ...c, optionAScore: num } : { ...c, optionBScore: num }) : c
    );
    setComparisons(nextList);
    if (accessToken) {
      const row = nextList.find((x) => x.id === id);
      if (row) {
        await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            action: 'score_option_comparison',
            id,
            optionAScore: row.optionAScore,
            optionBScore: row.optionBScore,
          }),
        }).catch(() => {});
      }
    }
  };

  const bins = useMemo(() => computePowerCurveBins(telemetry, 1.0), [telemetry]);
  const onlineCount = turbines.filter((t) => t.operationalState === 'test_active').length;

  return (
    <div className="space-y-8">
      {/* Honest Empty-State Telemetry Summary */}
      <div className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE2DC] pb-4">
          <div className="flex items-start gap-3">
            <Radio className="h-5 w-5 text-amber-700 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#141A18]">
                Engineering Telemetry Overview —{' '}
                {telemetrySource === 'live_hardware'
                  ? 'Live Hardware Stream Active'
                  : telemetrySource === 'csv_upload'
                  ? 'Uploaded CSV Data (Not Live Hardware)'
                  : 'No live telemetry connected'}
              </h2>
              <p className="text-xs text-[#434E4A]">
                {telemetrySource === 'live_hardware'
                  ? 'Verified HMAC-SHA256 ESP32/STM32 feed persisted.'
                  : '0 live hardware devices streaming. Monitoring-only architecture: zero remote turbine actuation or brake override commands exist.'}
              </p>
              {syncNotice && <p className="mt-1 font-mono text-[11px] text-[#0B2B22]">{syncNotice}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['Live', '1h', '24h', '7d', '30d', 'Custom'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono ${
                  timeRange === r ? 'bg-[#0B2B22] text-white' : 'border border-[#DDE2DC] text-[#141A18]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 text-xs">
          {[
            ['Registered Turbines', String(turbines.length)],
            ['Online / Offline', `${onlineCount} / ${turbines.length - onlineCount}`],
            ['Current Wind', telemetry.length ? `${telemetry[telemetry.length - 1].windSpeedMs} m/s` : '--'],
            ['Current Power', telemetry.length ? `${telemetry[telemetry.length - 1].powerW} W` : '--'],
            ['Data Completeness', telemetry.length ? 'CSV Loaded' : '0.0% (No live link)'],
            ['Safety Control', 'Monitoring Only'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
              <div className="text-[#434E4A]">{k}</div>
              <div className="mt-1 font-mono text-sm font-bold text-[#141A18]">{v}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0B2B22] px-3.5 py-2 text-xs font-semibold text-white">
            <Upload className="h-3.5 w-3.5" /> Load Telemetry CSV
            <input type="file" accept=".csv" onChange={handleUploadCsv} className="sr-only" />
          </label>
          {telemetry.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const csv = exportTelemetryToCsv(telemetry);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'pawan-shakti-telemetry-export.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-xl border border-[#DDE2DC] px-3 py-2 text-xs font-semibold text-[#141A18]"
            >
              Export CSV
            </button>
          )}
          {csvNotice && <span className="text-xs text-[#434E4A]">{csvNotice}</span>}
        </div>

        {bins.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[#DDE2DC]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F4]">
                <tr>
                  <th className="px-3 py-2">Wind Bin</th>
                  <th className="px-3 py-2">Samples</th>
                  <th className="px-3 py-2">Mean W</th>
                  <th className="px-3 py-2">Median W</th>
                  <th className="px-3 py-2">Std Dev</th>
                  <th className="px-3 py-2">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE2DC] font-mono tabular-nums">
                {bins.map((b) => (
                  <tr key={b.binLabel}>
                    <td className="px-3 py-1.5">{b.binLabel}</td>
                    <td className="px-3 py-1.5">{b.sampleCount}</td>
                    <td className="px-3 py-1.5">{b.meanPowerW}</td>
                    <td className="px-3 py-1.5">{b.medianPowerW}</td>
                    <td className="px-3 py-1.5">{b.stdDevPowerW}</td>
                    <td className="px-3 py-1.5">{b.outlierCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Turbine Registry & Test Runs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#141A18] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0B2B22]" /> Turbine Registry
            </h3>
            <span className="font-mono text-[10px] text-[#434E4A]">ESP32 HMAC Ready</span>
          </div>
          {canEdit && (
            <form onSubmit={handleRegisterTurbine} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newTurbineId}
                onChange={(e) => setNewTurbineId(e.target.value)}
                placeholder="Turbine ID (e.g. PS-OPTA-01)"
                className="flex-1 rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 text-xs font-mono"
              />
              <select
                value={newTurbineArch}
                onChange={(e) => setNewTurbineArch(e.target.value)}
                className="rounded-lg border border-[#DDE2DC] px-2 py-1.5 text-xs bg-white"
              >
                <option>Option A — Coaxial Magnetic Gear (~1 m²)</option>
                <option>Option B — Archimedes + Planetary</option>
              </select>
              <button type="submit" className="rounded-lg bg-[#0B2B22] px-3 py-1.5 text-xs font-semibold text-white">
                <Plus className="inline h-3.5 w-3.5" /> Add
              </button>
            </form>
          )}
          {canEdit && (
            <form onSubmit={handleRegisterDevice} className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3 space-y-2 text-xs">
              <div className="font-semibold text-[#141A18]">Register ESP32 / STM32 Device (HMAC-SHA256)</div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={deviceUidInput}
                  onChange={(e) => setDeviceUidInput(e.target.value)}
                  placeholder="Device UID (e.g. ESP32-PS-01)"
                  aria-label="Hardware device UID"
                  className="flex-1 rounded-lg border border-[#DDE2DC] bg-white px-2.5 py-1 font-mono"
                />
                <input
                  type="number"
                  step="0.5"
                  min={0.1}
                  max={10}
                  value={samplingHzInput}
                  onChange={(e) => setSamplingHzInput(Number(e.target.value) || 1)}
                  aria-label="Sampling rate Hz"
                  className="w-20 rounded-lg border border-[#DDE2DC] bg-white px-2 py-1 font-mono"
                />
                <button type="submit" className="rounded-lg border border-[#0B2B22] bg-white px-3 py-1 font-semibold text-[#0B2B22]">
                  Mint Key
                </button>
              </div>
              {oneTimeKeyNotice && <div className="font-mono text-[11px] text-amber-900 break-all">{oneTimeKeyNotice}</div>}
            </form>
          )}
          <div className="space-y-2 text-xs">
            {turbines.map((t) => (
              <div key={t.id} className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="flex items-center justify-between font-mono font-bold text-[#141A18]">
                  <span>{t.turbineId}</span>
                  <span className="rounded bg-white px-2 py-0.5 text-[10px] border border-[#DDE2DC]">{t.operationalState}</span>
                </div>
                <div className="mt-1 text-[#434E4A]">{t.configurationName} • {t.transmissionType}</div>
                <div className="mt-0.5 font-mono text-[10px] text-[#434E4A]">Safety: {t.safetyStatus}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#141A18] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#0B2B22]" /> Test-Run Management
            </h3>
            <EvidenceBadge tier="PROTOTYPE_OBSERVATION" compact />
          </div>
          {canEdit && (
            <form onSubmit={handleCreateTestRun} className="flex gap-2">
              <input
                type="text"
                value={newRunObjective}
                onChange={(e) => setNewRunObjective(e.target.value)}
                placeholder="New test run objective..."
                className="flex-1 rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 text-xs"
              />
              <button type="submit" className="rounded-lg bg-[#0B2B22] px-3 py-1.5 text-xs font-semibold text-white">
                Create Run
              </button>
            </form>
          )}
          <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
            {testRuns.map((run) => (
              <div key={run.id} className="rounded-xl border border-[#DDE2DC] p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#141A18]">{run.testId}</span>
                  <span className="rounded bg-[#F6F7F4] px-2 py-0.5 font-mono text-[10px] uppercase">{run.state}</span>
                </div>
                <div className="text-[#141A18]">{run.objective}</div>
                <div className="text-[11px] text-[#434E4A]">{run.resultSummary}</div>
                {canEdit && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(['draft', 'running', 'completed', 'reviewed', 'rejected'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => transitionRunState(run.id, s)}
                        className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                          run.state === s ? 'bg-[#0B2B22] text-white' : 'border border-[#DDE2DC] text-[#434E4A]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 16-Criterion Option A vs Option B Bench Scoring */}
      <div className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-[#141A18]">
              Option A (Magnetic Gear) vs Option B (Archimedes + Planetary) Shootout Scorecard
            </h3>
            <p className="text-xs text-[#434E4A]">
              All 16 scores remain unassigned until physical dyno measurements are logged. Never auto-declares an unproven winner.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" /> Architecture Freeze Status: OPEN (TRL 4)
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#DDE2DC]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F7F4]">
              <tr>
                <th className="px-3 py-2">Criterion</th>
                <th className="px-3 py-2">Measurement Basis</th>
                <th className="px-3 py-2">Option A (1–5)</th>
                <th className="px-3 py-2">Option B (1–5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE2DC]">
              {comparisons.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-semibold text-[#141A18]">{c.criterion}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-[#434E4A]">{c.measurementBasis}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      disabled={!canEdit}
                      placeholder="--"
                      value={c.optionAScore ?? ''}
                      onChange={(e) => updateScore(c.id, 'A', e.target.value)}
                      aria-label={`Option A score for ${c.criterion}`}
                      className="w-16 rounded border border-[#DDE2DC] px-2 py-1 font-mono text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      disabled={!canEdit}
                      placeholder="--"
                      value={c.optionBScore ?? ''}
                      onChange={(e) => updateScore(c.id, 'B', e.target.value)}
                      aria-label={`Option B score for ${c.criterion}`}
                      className="w-16 rounded border border-[#DDE2DC] px-2 py-1 font-mono text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
