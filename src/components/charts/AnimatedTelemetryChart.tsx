import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { TelemetryReading } from '../../types/index.ts';
import { useAnimationContext } from '../animation/animationContext.ts';

type MetricMode = 'powerW' | 'windSpeedMs' | 'rotorRpm' | 'dcVoltageV';

const METRIC_LABELS: Record<MetricMode, { label: string; unit: string; color: string }> = {
  powerW: { label: 'Electrical Power (P = V · I)', unit: 'W', color: '#10B981' },
  windSpeedMs: { label: 'Wind Velocity', unit: 'm/s', color: '#22D3EE' },
  rotorRpm: { label: 'Rotor Angular Speed', unit: 'RPM', color: '#38BDF8' },
  dcVoltageV: { label: 'DC Bus Voltage', unit: 'V', color: '#F59E0B' },
};

export const AnimatedTelemetryChart: React.FC<{
  readings: TelemetryReading[];
  isSampleTemplate?: boolean;
}> = ({ readings, isSampleTemplate = false }) => {
  const { reducedMotion } = useAnimationContext();
  const [metric, setMetric] = useState<MetricMode>('powerW');
  const [windowStartPct, setWindowStartPct] = useState(0);
  const [zoomSpanPct, setZoomSpanPct] = useState(100);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const visibleSlice = useMemo(() => {
    if (readings.length === 0) return [];
    const startIdx = Math.floor((windowStartPct / 100) * Math.max(0, readings.length - 2));
    const count = Math.max(2, Math.ceil((zoomSpanPct / 100) * readings.length));
    return readings.slice(startIdx, Math.min(readings.length, startIdx + count));
  }, [readings, windowStartPct, zoomSpanPct]);

  const width = 680;
  const height = 220;
  const padX = 44;
  const padY = 26;

  const { pathD, points, maxVal } = useMemo(() => {
    if (visibleSlice.length === 0) return { pathD: '', points: [], maxVal: 1 };
    const vals = visibleSlice.map((r) => Number(r[metric] || 0));
    const mx = Math.max(1, ...vals) * 1.12;
    const pts = visibleSlice.map((r, i) => {
      const x =
        visibleSlice.length === 1
          ? padX
          : padX + (i / (visibleSlice.length - 1)) * (width - padX * 2);
      const y = height - padY - (Number(r[metric] || 0) / mx) * (height - padY * 2);
      return { x, y, val: Number(r[metric] || 0), reading: r };
    });
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return { pathD: d, points: pts, maxVal: mx };
  }, [visibleSlice, metric]);

  const meta = METRIC_LABELS[metric];
  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  const handleExportSvg = () => {
    const svg = document.getElementById('ps-telemetry-svg-chart');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pawan-shakti-${metric}-chart.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (readings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#DDE2DC] bg-[#F6F7F4] p-6 text-center text-xs text-[#434E4A]">
        <strong>No Time-Series Dataset Loaded:</strong> Click &ldquo;Inspect Repo Sample CSV&rdquo; or upload a logged
        CSV file to plot Wind, RPM, Voltage, Current, and Power curves interactively.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#060D1A] text-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <div className="font-display text-sm font-bold text-white">{meta.label}</div>
          <div className="font-mono text-[10px] text-amber-300">
            {isSampleTemplate
              ? 'Illustrative sample dataset — not experimental results'
              : 'Uploaded CSV Telemetry Series (Requires Calibrated Verification)'}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(METRIC_LABELS) as MetricMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] border ${
                metric === m ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 bg-[#101A2C] text-slate-300'
              }`}
            >
              {m === 'powerW' ? 'Power (W)' : m === 'windSpeedMs' ? 'Wind (m/s)' : m === 'rotorRpm' ? 'RPM' : 'Voltage (V)'}
            </button>
          ))}
          <button
            type="button"
            onClick={handleExportSvg}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-[#101A2C] px-2.5 py-1 font-mono text-[11px] text-slate-200 hover:border-cyan-400"
          >
            <Download className="h-3 w-3" /> Export SVG
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border border-slate-800 bg-[#0B1528] p-2">
        <svg
          id="ps-telemetry-svg-chart"
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56"
          role="img"
          aria-label={`Animated ${meta.label} telemetry graph`}
        >
          {[0, 0.5, 1].map((frac) => {
            const y = height - padY - frac * (height - padY * 2);
            const valLabel = (maxVal * frac).toFixed(1);
            return (
              <g key={frac}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#1E293B" strokeDasharray="4 4" />
                <text x={4} y={y + 4} fill="#94A3B8" fontSize="10" className="font-mono">
                  {valLabel}
                </text>
              </g>
            );
          })}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={meta.color}
              strokeWidth={2.5}
              strokeDasharray={reducedMotion ? undefined : '2000'}
              strokeDashoffset={reducedMotion ? undefined : '0'}
              style={reducedMotion ? undefined : { transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          )}

          {points.map((p, idx) => (
            <circle
              key={`${p.reading.id}-${idx}`}
              cx={p.x}
              cy={p.y}
              r={hoverIdx === idx ? 5.5 : 3.2}
              fill={p.reading.dataQualityStatus === 'betz_anomaly' ? '#F59E0B' : meta.color}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
        </svg>

        {hovered && (
          <div className="mt-2 flex flex-wrap justify-between gap-2 rounded-lg border border-cyan-500/30 bg-[#060D1A] px-3 py-1.5 font-mono text-[11px] text-slate-200">
            <span>TS: {hovered.reading.timestamp}</span>
            <span className="text-cyan-300 font-bold">
              {hovered.val} {meta.unit}
            </span>
            <span>Wind: {hovered.reading.windSpeedMs} m/s</span>
            <span className={hovered.reading.dataQualityStatus === 'betz_anomaly' ? 'text-amber-300' : 'text-emerald-300'}>
              Quality: {hovered.reading.dataQualityStatus}
            </span>
          </div>
        )}
      </div>

      {/* Zoom & Pan Controls */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
        <label className="flex items-center gap-2">
          <span>Zoom Span:</span>
          <input
            type="range"
            min={25}
            max={100}
            step={25}
            value={zoomSpanPct}
            onChange={(e) => setZoomSpanPct(Number(e.target.value))}
            aria-label="Chart zoom span percentage"
            className="w-24 accent-cyan-400"
          />
          <span className="font-mono">{zoomSpanPct}%</span>
        </label>
        <label className="flex items-center gap-2">
          <span>Pan Window:</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, 100 - zoomSpanPct)}
            value={windowStartPct}
            onChange={(e) => setWindowStartPct(Number(e.target.value))}
            aria-label="Chart pan window offset"
            className="w-24 accent-cyan-400"
          />
          <span className="font-mono">{windowStartPct}%</span>
        </label>
      </div>
    </div>
  );
};
