import React, { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { INITIAL_BOM_ITEMS, INITIAL_PROJECT_TASKS } from '../../data/pawanShaktiData.ts';
import { calculateLcoeDcf } from '../../lib/physics.ts';
import type { BomItem, ProjectTaskItem } from '../../types/index.ts';
import { EvidenceBadge } from '../common/EvidenceBadge.tsx';

export const FounderOperatingTab: React.FC<{
  canViewFinancials: boolean;
  canEditFinancials?: boolean;
  canManageReports?: boolean;
  accessToken?: string | null;
}> = ({
  canViewFinancials,
  canEditFinancials = false,
  canManageReports = false,
  accessToken,
}) => {
  // Editable DCF LCOE inputs
  const [lcoeInput, setLcoeInput] = useState({
    installedCapexInr: 72000,
    annualOmInr: 2500,
    replacementCostInr: 8000,
    replacementYear: 7,
    projectLifeYears: 15,
    discountRatePct: 9,
    yearOneNetEnergyKwh: 500,
    annualDegradationPct: 1,
    availabilityPct: 92,
    residualValueInr: 0,
  });

  const lcoeResult = useMemo(() => calculateLcoeDcf(lcoeInput), [lcoeInput]);

  // BOM & Batch Scenarios
  const [bomItems, setBomItems] = useState<BomItem[]>(INITIAL_BOM_ITEMS);
  const [savedScenariosCount, setSavedScenariosCount] = useState<number | null>(null);
  const [liveTelemetrySummary, setLiveTelemetrySummary] = useState<{ devices: number; online: number; readings: number } | null>(null);
  const [batchPreset, setBatchPreset] = useState<'prototype' | '1-unit' | '3-unit' | '10-unit' | '50-unit'>('prototype');
  const [proposedSalePriceInr, setProposedSalePriceInr] = useState(72000);
  const [commentary, setCommentary] = useState(
    'TRL 4 focus: completing calibrated 1 Hz logging and preparing Option A (Magnetic) vs Option B (Planetary) dyno shootout before architecture freeze.'
  );

  // Recalculable 30/60/90 Roadmap Start Date (preserving historical Nov 2026-Feb 2027 plan separately)
  const [sprintStartDate, setSprintStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tasks, setTasks] = useState<ProjectTaskItem[]>(INITIAL_PROJECT_TASKS);
  const [trackFilter, setTrackFilter] = useState('ALL');
  const [taskSyncNotice, setTaskSyncNotice] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    (async () => {
      try {
        const requests: Promise<Response>[] = [
          fetch('/api/admin', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/telemetry', { headers: { Authorization: `Bearer ${accessToken}` } }),
        ];
        if (canViewFinancials) {
          requests.push(fetch('/api/admin?action=financials', { headers: { Authorization: `Bearer ${accessToken}` } }));
        }
        const [admResp, telResp, finResp] = await Promise.all(requests);
        if (!active) return;

        if (admResp?.ok) {
          const data = await admResp.json();
          if (Array.isArray(data.tasks) && data.tasks.length > 0) {
            setTasks(
              data.tasks.map((t: any, idx: number) => ({
                id: t.id,
                taskCode: t.task_code || `T-${idx + 1}`,
                workstream: t.workstream || t.track,
                title: t.title,
                description: t.description || '',
                track: t.track,
                owner: t.owner,
                supportingMembers: Array.isArray(t.supporting_members) ? t.supporting_members : [],
                priority: t.priority || 'P1',
                offsetStartDay: idx * 3 + 1,
                durationDays: 10,
                status: t.status || 'todo',
                dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
                acceptanceCriteria: t.acceptance_criteria || '',
                evidenceAttachment: t.evidence_attachment || '',
                reviewer: t.reviewer || 'Founder',
              }))
            );
            setTaskSyncNotice('Synced live tasks from Supabase.');
          }
        }
        if (telResp?.ok) {
          const tData = await telResp.json();
          const devs = Array.isArray(tData.devices) ? tData.devices : [];
          setLiveTelemetrySummary({
            devices: devs.length,
            online: devs.filter((d: any) => !d.revoked && d.device_health === 'online').length,
            readings: Array.isArray(tData.telemetry) ? tData.telemetry.length : 0,
          });
        }
        if (finResp?.ok) {
          const fData = await finResp.json();
          if (Array.isArray(fData.bomItems) && fData.bomItems.length > 0) {
            setBomItems(
              fData.bomItems.map((b: any) => ({
                id: b.id,
                component: b.component,
                subsystem: b.subsystem,
                prototypeCostInr: Number(b.prototype_cost_inr || 0),
                targetCostInr: Number(b.target_cost_inr || 0),
                basis: b.basis || 'COMMERCIAL_ASSUMPTION',
                vendorQuoteCount: 0,
                notes: b.notes || '',
              }))
            );
          }
          if (Array.isArray(fData.financialScenarios)) {
            setSavedScenariosCount(fData.financialScenarios.length);
          }
        }
      } catch {
        if (active) setTaskSyncNotice('Cloud task fetch unavailable offline.');
      }
    })();
    return () => {
      active = false;
    };
  }, [accessToken, canViewFinancials]);

  const handleTaskStatusChange = async (task: ProjectTaskItem, nextStatus: ProjectTaskItem['status']) => {
    setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: nextStatus } : x)));
    if (accessToken) {
      const resp = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          action: 'update_task',
          id: task.id,
          title: task.title,
          track: task.track,
          owner: task.owner,
          status: nextStatus,
        }),
      });
      if (resp.ok) setTaskSyncNotice(`Updated task status to ${nextStatus} in DB.`);
    }
  };

  const protoTotalBom = bomItems.reduce((s, i) => s + i.prototypeCostInr, 0);
  const targetTotalBom = bomItems.reduce((s, i) => s + i.targetCostInr, 0);

  const batchFactor: Record<typeof batchPreset, number> = {
    prototype: 1.0,
    '1-unit': 0.96,
    '3-unit': 0.88,
    '10-unit': 0.78,
    '50-unit': 0.67,
  };
  const estimatedBatchBom = Math.round(protoTotalBom * batchFactor[batchPreset]);
  const estimatedGrossMarginPct =
    proposedSalePriceInr > 0
      ? (((proposedSalePriceInr - estimatedBatchBom) / proposedSalePriceInr) * 100).toFixed(1)
      : '0.0';

  const computeDueDate = (offsetDays: number) => {
    const dt = new Date(`${sprintStartDate}T00:00:00Z`);
    if (Number.isNaN(dt.getTime())) return 'Invalid Date';
    dt.setUTCDate(dt.getUTCDate() + offsetDays);
    return dt.toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-8">
      {/* North Star Separation + 5 Core KPIs */}
      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-[#141A18]">
            North Star Separation &amp; Core Operating KPIs
          </h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1.5 rounded-xl bg-[#0B2B22] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#144537]"
          >
            <Printer className="h-3.5 w-3.5" /> Export Monthly Executive PDF
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1">
            <div className="font-mono text-[10px] uppercase text-emerald-900">1. Prototype Validation North Star (Immediate)</div>
            <div className="font-display text-lg font-bold text-[#141A18]">
              Verified Net Low-Wind Energy: 0.0 Wh Logged
            </div>
            <p className="text-xs text-[#434E4A]">
              Requires calibrated continuous 1 Hz ESP32/INA226 CSV measurements into controlled load.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1">
            <div className="font-mono text-[10px] uppercase text-amber-900">2. Commercial North Star (DCF Modeled LCOE)</div>
            <div className="font-display text-lg font-bold text-[#141A18]">
              Est. LCOE: {lcoeResult.lcoeInrPerKwh !== null ? `₹${lcoeResult.lcoeInrPerKwh}/kWh` : '--'}
            </div>
            <p className="text-xs text-[#434E4A]">
              {(lcoeResult.lcoeInrPerKwh ?? 99) < 5.2
                ? 'Audit Warning: LCOE below ₹5.20/kWh requires independently validated field kWh & vendor BOM proof.'
                : 'Editable commercial planning assumption; never claimed as guaranteed retail tariff savings.'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          {[
            ['KPI 1: Cut-In Speed', '<= 2.2 m/s Target', 'Informal bench 2.3–2.5 m/s only; formal curve pending'],
            ['KPI 2: Net Yield / CF', '0 Wh Verified', 'Never claims 4.2-5 kWh/day without measured data'],
            ['KPI 3: Prototype BOM', `~₹${protoTotalBom.toLocaleString('en-IN')} Est.`, `DFM Target: ~₹${targetTotalBom.toLocaleString('en-IN')}`],
            ['KPI 4: Endurance', '0 / 500 hrs Logged', 'Milestone target; continuous log not yet started'],
            ['KPI 5: Commercial Funnel', '0 LOIs / ₹0 Rev', 'Strict verified database counts only'],
          ].map(([t, v, sub]) => (
            <div key={t} className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
              <div className="text-[#434E4A]">{t}</div>
              <div className="mt-1 font-mono text-sm font-bold text-[#141A18]">{v}</div>
              <div className="mt-1 text-[10px] text-[#434E4A]">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* One-Page Monthly Executive Dashboard (4 Pillars) */}
      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4 print-break-inside-avoid">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE2DC] pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-[#141A18]">
              Monthly Executive Snapshot ({sprintStartDate.slice(0, 7)}) — V3F &amp; Mentor Review Ready
            </h3>
            <p className="text-[11px] text-[#434E4A]">Source: Verified Repo Registry + Live Counts (Zero synthetic metrics)</p>
          </div>
          <span className="rounded border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-[11px] text-amber-900">
            RAG STATUS: AMBER (TRL 4 BENCH STAGE)
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-[#DDE2DC] p-3.5 space-y-1">
            <div className="font-bold text-[#0B2B22]">A. Engineering &amp; Telemetry</div>
            <div>Stage: TRL 4 (Mark-3/4/5)</div>
            <div>
              Live Telemetry:{' '}
              {liveTelemetrySummary === null
                ? 'Unavailable (Offline)'
                : `${liveTelemetrySummary.online} online / ${liveTelemetrySummary.readings} logged`}
            </div>
            <div>Dyno Shootout: Pending</div>
          </div>
          <div className="rounded-xl border border-[#DDE2DC] p-3.5 space-y-1">
            <div className="font-bold text-[#0B2B22]">B. Manufacturing &amp; BOM</div>
            <div>Est. Prototype BOM: ₹{protoTotalBom.toLocaleString('en-IN')}</div>
            <div>Saved Scenarios: {savedScenariosCount === null ? 'Unavailable' : savedScenariosCount}</div>
            <div>Target Unit BOM: ₹{targetTotalBom.toLocaleString('en-IN')}</div>
          </div>
          <div className="rounded-xl border border-[#DDE2DC] p-3.5 space-y-1">
            <div className="font-bold text-[#0B2B22]">C. Commercial Pipeline</div>
            <div>Signed LOIs / Pilots: Unavailable until CRM sync (0 verified)</div>
            <div>Site Surveys Logged: Unavailable until CRM sync</div>
            <div>Recognized Revenue: ₹0</div>
          </div>
          <div className="rounded-xl border border-[#DDE2DC] p-3.5 space-y-1">
            <div className="font-bold text-[#0B2B22]">D. Team, Grants &amp; Execution</div>
            <div>Tasks Open: {tasks.filter((t) => t.status !== 'done').length} / {tasks.length}</div>
            <div>Confirmed Grant Cash: ₹0</div>
            <div>V3F Agreement: Signed Sept 2026</div>
          </div>
        </div>

        <label className="block space-y-1 text-xs">
          <span className="font-semibold text-[#141A18]">Founder Monthly Commentary &amp; Next 30-Day Priority</span>
          <textarea
            rows={2}
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            className="w-full rounded-xl border border-[#DDE2DC] p-2.5 text-xs"
          />
        </label>
        {canManageReports && accessToken && (
          <div className="no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                const resp = await fetch('/api/admin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                  body: JSON.stringify({
                    action: 'save_monthly_report',
                    reportMonth: sprintStartDate.slice(0, 7),
                    commentary,
                    pillars: { liveTelemetrySummary, openTasks: tasks.filter((t) => t.status !== 'done').length },
                  }),
                });
                setTaskSyncNotice(resp.ok ? 'Saved monthly snapshot to Supabase.' : `Monthly snapshot save failed (${resp.status}).`);
              }}
              className="rounded-xl border border-[#0B2B22] px-3 py-1.5 text-xs font-semibold text-[#0B2B22]"
            >
              Persist Monthly Snapshot to DB
            </button>
            {canEditFinancials && (
              <button
                type="button"
                onClick={async () => {
                  const batchCount = batchPreset === 'prototype' ? 1 : Number(batchPreset.split('-')[0]) || 1;
                  const resp = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                    body: JSON.stringify({
                      action: 'save_bom_scenario',
                      name: `${batchPreset} Commercial Scenario`,
                      batchSize: batchCount,
                      unitBomInr: estimatedBatchBom,
                      proposedSalePriceInr,
                      assumptionsNote: `LCOE est. ₹${lcoeResult.lcoeInrPerKwh ?? 'N/A'}/kWh (Assumption)`,
                    }),
                  });
                  if (resp.ok) {
                    setSavedScenariosCount((c) => (c ?? 0) + 1);
                    setTaskSyncNotice(`Saved ${batchPreset} BOM scenario to Supabase.`);
                  } else {
                    setTaskSyncNotice(`Scenario save failed (${resp.status}).`);
                  }
                }}
                className="rounded-xl border border-[#DDE2DC] px-3 py-1.5 text-xs font-semibold text-[#141A18]"
              >
                Save BOM Scenario
              </button>
            )}
          </div>
        )}
      </section>

      {/* Financial Scenario & DCF LCOE Simulator (Restricted for team_member) */}
      {canViewFinancials ? (
        <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-5 no-print">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-[#141A18]">BOM Batch Economics &amp; DCF LCOE Model</h3>
              <p className="text-xs text-[#434E4A]">Strictly restricted from team_member &amp; public_visitor roles.</p>
            </div>
            <EvidenceBadge tier="COMMERCIAL_ASSUMPTION" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(['prototype', '1-unit', '3-unit', '10-unit', '50-unit'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBatchPreset(b)}
                className={`rounded-lg px-3 py-1.5 font-mono ${
                  batchPreset === b ? 'bg-[#0B2B22] text-white' : 'border border-[#DDE2DC]'
                }`}
              >
                {b}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2">
              <span className="text-[#434E4A]">Proposed Price Assumption (₹):</span>
              <input
                type="number"
                value={proposedSalePriceInr}
                onChange={(e) => setProposedSalePriceInr(Number(e.target.value))}
                className="w-28 rounded-lg border border-[#DDE2DC] px-2 py-1 font-mono"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
              <div className="text-[#434E4A]">Estimated Unit BOM ({batchPreset})</div>
              <div className="font-mono text-lg font-bold">₹{estimatedBatchBom.toLocaleString('en-IN')}</div>
            </div>
            <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
              <div className="text-[#434E4A]">Est. Gross Margin (Assumption)</div>
              <div className="font-mono text-lg font-bold">{estimatedGrossMarginPct}%</div>
            </div>
            <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
              <div className="text-[#434E4A]">DCF LCOE Inputs (Year-1 kWh / Rate)</div>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  value={lcoeInput.yearOneNetEnergyKwh}
                  onChange={(e) => setLcoeInput({ ...lcoeInput, yearOneNetEnergyKwh: Number(e.target.value) })}
                  className="w-20 rounded border border-[#DDE2DC] bg-white px-2 py-0.5 font-mono"
                  aria-label="Year one net kWh"
                />
                <span className="self-center text-[11px]">kWh/yr</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          Financial Scenarios &amp; Unit BOM Economics are hidden for your current role under RBAC policy.
        </div>
      )}

      {/* Editable 30/60/90 Project Management Roadmap */}
      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-[#141A18]">
              Internal Project Roadmap (Recalculated from Selected Start Date)
            </h3>
            <p className="text-xs text-[#434E4A]">
              Historical Nov 2026–Feb 2027 plan is preserved separately in V3F audit records; active schedule shifts live from Sprint Start Date.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#141A18]">Active Sprint Start:</span>
            <input
              type="date"
              value={sprintStartDate}
              onChange={(e) => setSprintStartDate(e.target.value)}
              className="rounded-lg border border-[#DDE2DC] px-2.5 py-1 font-mono"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 text-xs items-center">
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            aria-label="Filter roadmap tasks by track"
            className="rounded-lg border border-[#DDE2DC] px-2.5 py-1.5 bg-white"
          >
            <option value="ALL">All Work Tracks ({tasks.length})</option>
            {Array.from(new Set(tasks.map((t) => t.track))).map((tr) => (
              <option key={tr} value={tr}>
                {tr}
              </option>
            ))}
          </select>
          <span className="font-mono text-[11px] text-[#434E4A]">
            Accepted Deliverables: {tasks.filter((t) => t.status === 'done').length} / {tasks.length} • Blocked:{' '}
            {tasks.filter((t) => t.status === 'blocked').length}
          </span>
          {taskSyncNotice && <span className="font-mono text-[11px] text-[#0B2B22]">{taskSyncNotice}</span>}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#DDE2DC]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F7F4]">
              <tr>
                <th className="px-3 py-2">ID / Pri</th>
                <th className="px-3 py-2">Deliverable &amp; Acceptance Criteria</th>
                <th className="px-3 py-2">Workstream / Owner / Reviewer</th>
                <th className="px-3 py-2">Active Start -&gt; Due</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE2DC]">
              {tasks
                .filter((t) => trackFilter === 'ALL' || t.track === trackFilter)
                .map((task) => (
                  <tr key={task.id}>
                    <td className="px-3 py-2 font-mono font-bold whitespace-nowrap">
                      {task.taskCode || task.id} • {task.priority}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-[#141A18]">{task.title}</div>
                      <div className="text-[11px] text-[#434E4A]">Criteria: {task.acceptanceCriteria}</div>
                    </td>
                    <td className="px-3 py-2 text-[#434E4A]">
                      <div>{task.track}</div>
                      <div className="font-mono text-[10px]">
                        Owner: {task.owner} • Rev: {task.reviewer}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                      {computeDueDate(task.offsetStartDay)} → {computeDueDate(task.offsetStartDay + task.durationDays)}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task, e.target.value as ProjectTaskItem['status'])}
                        aria-label={`Status for ${task.title}`}
                        className="rounded border border-[#DDE2DC] px-2 py-1 text-xs bg-white"
                      >
                        <option value="todo">todo</option>
                        <option value="in_progress">in_progress</option>
                        <option value="blocked">blocked</option>
                        <option value="done">done</option>
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
