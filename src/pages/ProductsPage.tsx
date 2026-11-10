import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OPTION_COMPARISON_CRITERIA, PROTOTYPE_RECORDS } from '../data/pawanShaktiData.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';

export const ProductsPage: React.FC = () => {
  const [filterCriterion, setFilterCriterion] = useState('');

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Products & Architecture Shootout — PAWAN SHAKTI',
        description:
          'Pawan Shakti TRL 4 prototype hardware status, 1 m2 working design inputs, and Option A vs Option B comparative engineering workspace.',
      },
      '/products'
    );
  }, []);

  const filteredCriteria = OPTION_COMPARISON_CRITERIA.filter(
    (c) =>
      c.criterion.toLowerCase().includes(filterCriterion.toLowerCase()) ||
      c.optionANotes.toLowerCase().includes(filterCriterion.toLowerCase()) ||
      c.optionBNotes.toLowerCase().includes(filterCriterion.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#DDE2DC] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#0B2B22] px-3 py-1 font-mono text-xs font-semibold text-white">
            ENGINEERING STAGE: TRL 4 — PRE-COMMERCIAL
          </span>
          <EvidenceBadge tier="DESIGN_TARGET" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">
          Product Concept, Prototype Configurations &amp; Architecture Shootout
        </h1>
        <p className="max-w-3xl text-sm text-[#434E4A]">
          No unverified SKU, commercial warranty, utility grid certification, or validated 1 kW unit is claimed. All figures
          explicitly distinguish physical TRL 4 prototype work from working ~1 m² target assumptions.
        </p>
      </header>

      {/* Current Working 1m2 Target Parameters */}
      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-[#141A18]">Working ~1 m² Design Class Assumptions</h2>
          <EvidenceBadge tier="ENGINEERING_ESTIMATE" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-4">
            <div className="font-mono text-[#434E4A]">Swept Geometry Target</div>
            <div className="mt-1 font-display text-lg font-bold text-[#141A18]">~1.0 m² (r ≈ 0.564 m)</div>
            <p className="mt-1 text-[#434E4A]">Calibrated physical caliper dimensions required prior to dyno curve release.</p>
          </div>
          <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-4">
            <div className="font-mono text-[#434E4A]">Preliminary Speed Estimates</div>
            <div className="mt-1 font-mono text-xs font-bold text-[#141A18]">5 m/s: ~20–25 W</div>
            <div className="font-mono text-xs font-bold text-[#141A18]">8 m/s: ~95–110 W</div>
            <div className="font-mono text-xs font-bold text-[#141A18]">11 m/s: ~250–300 W</div>
          </div>
          <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-4">
            <div className="font-mono text-[#434E4A]">Alternator Design Class</div>
            <div className="mt-1 font-display text-base font-bold text-[#141A18]">300–500 W Coreless PMA</div>
            <p className="mt-1 text-[#434E4A]">Target ~300–600 RPM range; zero cogging matching under evaluation (separate from 1 kW).</p>
          </div>
          <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-4">
            <div className="font-mono text-[#434E4A]">Environmental &amp; Structural</div>
            <div className="mt-1 font-display text-base font-bold text-[#141A18]">2–8 m/s Target Regime</div>
            <p className="mt-1 text-[#434E4A]">Extruded aluminum / machined plates &amp; storm furling safety are design requirements, not yet certified.</p>
          </div>
        </div>
      </section>

      {/* Physical Prototype Registry */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#141A18]">Prototype Configurations Matrix</h2>
        <div className="overflow-x-auto rounded-2xl border border-[#DDE2DC] bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DDE2DC] bg-[#F6F7F4] text-[#141A18]">
              <tr>
                <th className="px-4 py-3">Prototype</th>
                <th className="px-4 py-3">Frame &amp; Blades</th>
                <th className="px-4 py-3">Transmission</th>
                <th className="px-4 py-3">Cut-In / Power Basis</th>
                <th className="px-4 py-3">Evidence Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE2DC]">
              {PROTOTYPE_RECORDS.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[#141A18]">{p.name}</div>
                    <div className="font-mono text-[11px] text-[#0B2B22]">{p.configCode}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-[#434E4A]">
                    <div><strong>Frame:</strong> {p.frameMaterial}</div>
                    <div><strong>Blades:</strong> {p.bladeMaterial}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-[#434E4A]">{p.transmission}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-[#141A18]">{p.observedCutInMs}</div>
                    <div className="mt-1 text-[11px] text-[#434E4A]">{p.historicalPowerNote}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <EvidenceBadge tier={p.evidenceTier} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Option A vs Option B 16-Criterion Comparison Workspace */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#141A18]">
              Architecture Evaluation: Option A vs Option B (16 Criteria)
            </h2>
            <p className="text-xs text-[#434E4A]">
              Neither architecture is declared winner before comparative dynamometer evidence is recorded in Engineering Workbench.
            </p>
          </div>
          <input
            type="search"
            value={filterCriterion}
            onChange={(e) => setFilterCriterion(e.target.value)}
            placeholder="Filter criteria (torque, N52, BOM...)"
            aria-label="Filter Option A vs Option B comparison criteria"
            className="w-full max-w-xs rounded-xl border border-[#DDE2DC] bg-white px-3 py-2 text-xs"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#DDE2DC] bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DDE2DC] bg-[#F6F7F4] text-[#141A18]">
              <tr>
                <th className="px-4 py-3">Criterion</th>
                <th className="px-4 py-3">Option A: Coaxial Magnetic Gear + HAWT</th>
                <th className="px-4 py-3">Option B: Archimedes Spiral + Planetary</th>
                <th className="px-4 py-3">Required Verification</th>
                <th className="px-4 py-3">Score Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE2DC]">
              {filteredCriteria.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold text-[#141A18] align-top">{row.criterion}</td>
                  <td className="px-4 py-3 text-[#434E4A] align-top">{row.optionANotes}</td>
                  <td className="px-4 py-3 text-[#434E4A] align-top">{row.optionBNotes}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#434E4A] align-top">{row.measurementBasis}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] text-amber-900">
                      Pending Dyno Test
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#0B2B22]/20 bg-white p-5">
          <div className="text-xs text-[#434E4A]">
            <strong className="text-[#141A18]">Evaluating a site or technical partnership?</strong> Request engineering
            specifications, 2D drawings, or discuss pilot testbed scope directly.
          </div>
          <Link
            to="/contact"
            className="rounded-xl bg-[#0B2B22] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#144537]"
          >
            Request Technical Discussion
          </Link>
        </div>
      </section>
    </div>
  );
};
