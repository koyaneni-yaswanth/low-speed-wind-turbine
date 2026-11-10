import React from 'react';
import type { EvidenceTier } from '../../types/index.ts';

const TIER_STYLES: Record<EvidenceTier, { label: string; classes: string; title: string }> = {
  VERIFIED_MEASURED: {
    label: 'VERIFIED / MEASURED',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    title: 'Backed by directly measured repository record, calibrated test, or verified file.',
  },
  PROTOTYPE_OBSERVATION: {
    label: 'PROTOTYPE OBSERVATION',
    classes: 'bg-sky-50 text-sky-800 border-sky-200',
    title: 'Informal bench observation across Mark-3/4/5; requires calibrated closed-loop re-verification.',
  },
  ENGINEERING_ESTIMATE: {
    label: 'ENGINEERING ESTIMATE',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    title: 'Derived mathematically from aerodynamics/physics models; not a field measurement.',
  },
  DESIGN_TARGET: {
    label: 'DESIGN TARGET',
    classes: 'bg-orange-50 text-orange-800 border-orange-200',
    title: 'Engineering development objective; unvalidated until hardware test completion.',
  },
  COMMERCIAL_ASSUMPTION: {
    label: 'COMMERCIAL ASSUMPTION',
    classes: 'bg-stone-100 text-stone-700 border-stone-300',
    title: 'Preliminary editable financial, BOM, or pricing model input.',
  },
  FUTURE_ROADMAP: {
    label: 'FUTURE ROADMAP',
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
    title: 'Planned milestone or future integration item not yet executed.',
  },
};

export const EvidenceBadge: React.FC<{ tier: EvidenceTier; compact?: boolean }> = ({ tier, compact = false }) => {
  const cfg = TIER_STYLES[tier];
  return (
    <span
      title={cfg.title}
      className={`inline-flex items-center gap-1 rounded border font-mono uppercase tracking-wider ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } ${cfg.classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {cfg.label}
    </span>
  );
};
