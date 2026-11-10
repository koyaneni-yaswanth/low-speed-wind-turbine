import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APPLICATION_SEGMENTS } from '../data/pawanShaktiData.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';

export const ApplicationsPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('all');

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Applications & Pilot Fit Hypotheses — PAWAN SHAKTI',
        description:
          'Explore distributed, telecom, campus, agricultural, off-grid monitoring, IoT, and hybrid solar-wind application evaluations for Pawan Shakti.',
      },
      '/applications'
    );
  }, []);

  const visible = selectedId === 'all' ? APPLICATION_SEGMENTS : APPLICATION_SEGMENTS.filter((s) => s.id === selectedId);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#DDE2DC] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceBadge tier="DESIGN_TARGET" />
          <EvidenceBadge tier="COMMERCIAL_ASSUMPTION" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">Target Distributed Energy Applications</h1>
        <p className="max-w-3xl text-sm text-[#434E4A]">
          Seven exploratory deployment segments evaluated for pilot trials. None are claimed as commercially validated fleets—each
          segment lists concrete site prerequisites, integration constraints, and risks that pilot telemetry must verify.
        </p>

        <div className="flex flex-wrap gap-1.5 pt-2">
          <button
            type="button"
            onClick={() => setSelectedId('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              selectedId === 'all' ? 'bg-[#0B2B22] text-white' : 'border border-[#DDE2DC] bg-white text-[#141A18]'
            }`}
          >
            All 7 Segments
          </button>
          {APPLICATION_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => setSelectedId(seg.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                selectedId === seg.id ? 'bg-[#0B2B22] text-white' : 'border border-[#DDE2DC] bg-white text-[#141A18]'
              }`}
            >
              {seg.title}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {visible.map((seg) => (
          <article key={seg.id} className="flex flex-col justify-between rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-[#141A18]">{seg.title}</h2>
                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] text-amber-900">
                  {seg.status}
                </span>
              </div>

              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="font-semibold text-[#141A18]">Customer Problem</dt>
                  <dd className="text-[#434E4A]">{seg.problem}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#141A18]">Potential Use Case</dt>
                  <dd className="text-[#434E4A]">{seg.useCase}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#141A18]">Required Site Conditions</dt>
                  <dd className="text-[#434E4A]">{seg.siteConditions}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#141A18]">Electrical &amp; Installation Considerations</dt>
                  <dd className="text-[#434E4A]">{seg.electricalIntegration} — {seg.installation}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#141A18]">Benefits to Test</dt>
                  <dd className="text-[#434E4A]">{seg.benefitsToTest}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#9A3412]">Limitations &amp; Risks</dt>
                  <dd className="text-[#9A3412]">{seg.limitations}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#141A18]">Pilot Evaluation Metrics</dt>
                  <dd className="font-mono text-[11px] text-[#0B2B22]">{seg.pilotMetrics}</dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-[#DDE2DC] pt-3">
              <Link
                to={`/pilot?segment=${encodeURIComponent(seg.title)}`}
                className="inline-flex items-center rounded-xl border border-[#0B2B22] px-3.5 py-2 text-xs font-semibold text-[#0B2B22] hover:bg-[#0B2B22] hover:text-white transition"
              >
                Apply for Pilot Assessment in this Segment →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
