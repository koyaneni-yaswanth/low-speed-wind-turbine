import React from 'react';
import { ASSET_MANIFEST } from '../../data/pawanShaktiData.ts';

export const AirfoilPlot: React.FC = () => {
  const pts = ASSET_MANIFEST.airfoil.points;
  const width = 640;
  const height = 220;
  const padX = 36;
  const padY = 40;

  const toSvg = (x: number, y: number) => {
    const sx = padX + x * (width - padX * 2);
    // Airfoil y ranges roughly from -0.02 to +0.14; scale cleanly around baseline
    const sy = height - padY - ((y + 0.04) / 0.22) * (height - padY * 1.4);
    return { sx, sy };
  };

  const pathD = pts
    .map((p, i) => {
      const { sx, sy } = toSvg(p.x, p.y);
      return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    })
    .join(' ');

  const baselineY = toSvg(0, 0).sy;

  return (
    <div className="rounded-xl border border-[#DDE2DC] bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[#141A18]">
            Selig S1223 High-Camber Profile ({ASSET_MANIFEST.airfoil.pointCount} coordinate pairs)
          </h4>
          <p className="text-xs text-[#434E4A]">
            Parsed live from{' '}
            <code className="font-mono text-[#0B2B22]">engineering/airfoil/S1223.dat</code>
          </p>
        </div>
        {ASSET_MANIFEST.airfoil.file?.publicUrl && (
          <a
            href={ASSET_MANIFEST.airfoil.file.publicUrl}
            download="S1223.dat"
            className="rounded-lg border border-[#DDE2DC] px-2.5 py-1 text-xs font-medium text-[#0B2B22] hover:bg-[#F6F7F4]"
          >
            Download S1223.dat
          </a>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded-lg bg-[#F6F7F4]"
        role="img"
        aria-label="Selig S1223 airfoil cross-section plot"
      >
        <line x1={padX} y1={baselineY} x2={width - padX} y2={baselineY} stroke="#CBD5E1" strokeDasharray="4 4" />
        {[0, 0.25, 0.5, 0.75, 1.0].map((tick) => {
          const { sx } = toSvg(tick, 0);
          return (
            <g key={tick}>
              <line x1={sx} y1={16} x2={sx} y2={height - 20} stroke="#E2E8F0" strokeWidth={1} />
              <text x={sx} y={height - 6} textAnchor="middle" fontSize="10" fill="#64748B" className="font-mono">
                x/c={tick.toFixed(2)}
              </text>
            </g>
          );
        })}
        {pathD && <path d={`${pathD} Z`} fill="rgba(11, 43, 34, 0.14)" stroke="#0B2B22" strokeWidth={2.5} />}
      </svg>
    </div>
  );
};
