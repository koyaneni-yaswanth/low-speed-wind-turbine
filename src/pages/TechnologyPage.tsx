import React, { useEffect, useState } from 'react';
import { ASSET_MANIFEST } from '../data/pawanShaktiData.ts';
import type { CadAssetItem } from '../types/index.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { AirfoilPlot } from '../components/charts/AirfoilPlot.tsx';
import { ModelViewer3D } from '../components/cad/ModelViewer3D.tsx';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';

export const TechnologyPage: React.FC = () => {
  const cadAssets = ASSET_MANIFEST.cadAssets as CadAssetItem[];
  const viewable = cadAssets.filter((a) => a.viewerSupported);
  const [selectedCad, setSelectedCad] = useState<CadAssetItem>(
    () => viewable.find((c) => c.name === 'fan gear.3mf') || viewable[0] || cadAssets[0]
  );
  const [cadFilter, setCadFilter] = useState<'all' | '3d' | 'source'>('all');

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Technology & CAD Vault — PAWAN SHAKTI',
        description: 'Explore Pawan Shakti aerodynamics, Selig S1223 coordinates, planetary vs coaxial magnetic gearing, safety architecture, and interactive 3D CAD assets.',
      },
      '/technology'
    );
  }, []);

  const filteredAssets = cadAssets.filter((item) => {
    if (cadFilter === '3d') return item.viewerSupported;
    if (cadFilter === 'source') return !item.viewerSupported;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#DDE2DC] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceBadge tier="ENGINEERING_ESTIMATE" />
          <EvidenceBadge tier="DESIGN_TARGET" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">
          Technology Architecture &amp; Interactive CAD Vault
        </h1>
        <p className="max-w-3xl text-sm text-[#434E4A]">
          First-principles wind conversion chain, S1223 aerodynamic modeling, planetary and coaxial magnetic transmission tracks,
          safety protection roadmap, and real repository 3D CAD inspection.
        </p>
      </header>

      {/* Conceptual System Architecture Illustration */}
      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-[#141A18]">Electromechanical &amp; Telemetry Roadmap</h2>
          <span className="rounded bg-amber-50 px-2.5 py-1 font-mono text-[11px] text-amber-900 border border-amber-200">
            CONCEPTUAL SYSTEM ILLUSTRATION (12-STAGE TARGET ARCHITECTURE — NOT CERTIFIED BUILD)
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-xs">
          {[
            '1. Rotor Array (~1 m² Target / S1223 or Archimedes)',
            '2. Speed Step-Up (Magnetic Option A vs Planetary Option B)',
            '3. Coreless PMA Alternator (300–500 W Target @ 300–600 RPM)',
            '4. Three-Phase Schottky Rectification',
            '5. MPPT / DC-DC Conversion Stage',
            '6. Battery Bank or Calibrated Resistive Load',
            '7. Precision Voltage & Current Shunt Sensing',
            '8. Calibrated Wind Speed & Direction Logging',
            '9. Rotor & Generator RPM Sensing',
            '10. Temperature & Vibration Health Monitoring',
            '11. Overspeed Dump Load, E-Stop & Braking System',
            '12. ESP32/STM32 Datalogger -> Secure Cloud Telemetry',
          ].map((step) => (
            <div key={step} className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3 font-medium text-[#141A18]">
              {step}
            </div>
          ))}
        </div>
      </section>

      {/* Aerodynamics & Transmission Breakdown */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#141A18]">Aerodynamics &amp; Structural Considerations</h2>
            <ul className="space-y-2 text-xs leading-relaxed text-[#434E4A]">
              <li>
                <strong>Wind Fundamentals:</strong> Available wind power <code className="font-mono">P_wind = 0.5 · ρ · A · V³</code>; open-flow ideal Betz ceiling is <code className="font-mono">0.593</code>. Real micro-turbines encounter low-Re viscous losses (<code className="font-mono">Re &lt; 100,000</code>).
              </li>
              <li>
                <strong>Materials &amp; Chassis Validation:</strong> Current Mark-3/Mark-4 rigs used wooden outer frames &amp; FDM PLA/ABS prints; aluminum extrusion + CNC machined plates and UV-stabilized composite blades are evaluated alternatives to prevent warping &amp; heat softening.
              </li>
              <li>
                <strong>Safety &amp; Braking Boundary:</strong> Hardware overspeed furling/E-stop/dump-load braking are physical safety prerequisites currently under development. The web platform carries zero remote start/stop turbine control.
              </li>
            </ul>
          </div>
          <AirfoilPlot />
        </div>

        <div className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#141A18]">Transmission Tracks &amp; 2D Drawings</h2>
          <div className="space-y-3 text-xs text-[#434E4A]">
            <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3.5">
              <div className="font-semibold text-[#141A18]">Option A: Coaxial Magnetic Gear + HAWT Airfoil</div>
              <p className="mt-1">
                Target step-up ratios ~1:5.5 or 1:10 under evaluation with N52 permanent magnet poles across a nominal ~1.5 mm radial air gap. Aims to eliminate tooth sliding wear and permit slip overload isolation, pending eddy-loss and air-gap runout validation.
              </p>
            </div>
            <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3.5">
              <div className="font-semibold text-[#141A18]">Option B: Archimedes Spiral + Planetary Gearbox</div>
              <p className="mt-1">
                Couples spiral/high-solidity aerodynamic capture to 1:10 planetary gearing (Module 2.5, 20° pressure angle in existing bench assemblies). Requires calibrated dyno loss measurement to separate gear mesh friction from aerodynamic yield.
              </p>
            </div>
          </div>

          <div className="border-t border-[#DDE2DC] pt-4 space-y-2">
            <h3 className="text-sm font-bold text-[#141A18]">Formal Autodesk Fusion 360 2D Drawings (May 2025)</h3>
            <p className="text-xs text-[#434E4A]">Preserved authentic PDF engineering sheets (dimensional tolerance callouts tracked for CAD revision).</p>
            <div className="flex flex-wrap gap-2">
              {ASSET_MANIFEST.drawings.map((d) => (
                <a
                  key={d.sourcePath}
                  href={d.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[#DDE2DC] bg-[#F6F7F4] px-3 py-2 text-xs font-semibold text-[#0B2B22] hover:bg-[#EDF0EB]"
                >
                  Open {d.sourcePath.split('/').pop()} ({(d.bytes / 1024).toFixed(0)} KB PDF)
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 3D CAD Explorer */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#141A18]">
              Interactive Repository CAD Explorer ({cadAssets.length} Assets Cataloged)
            </h2>
            <p className="text-xs text-[#434E4A]">
              Inspect actual STL &amp; 3MF files from <code>engineering/cad/stl-and-3mf/</code>. Duplicate geometry exports and third-party licenses are explicitly noted.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[
              { id: 'all' as const, label: `All (${cadAssets.length})` },
              { id: '3d' as const, label: `3D Interactive (${viewable.length})` },
              { id: 'source' as const, label: `Native F3D/STEP (${cadAssets.length - viewable.length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCadFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  cadFilter === f.id ? 'bg-[#0B2B22] text-white' : 'border border-[#DDE2DC] bg-white text-[#141A18]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 max-h-[420px] overflow-y-auto rounded-xl border border-[#DDE2DC] bg-white divide-y divide-[#DDE2DC]">
            {filteredAssets.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedCad(item)}
                className={`w-full p-3 text-left transition ${
                  selectedCad?.id === item.id ? 'bg-[#0B2B22]/5 border-l-4 border-l-[#0B2B22]' : 'hover:bg-[#F6F7F4]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-[#141A18] truncate">{item.name}</span>
                  <span className="rounded bg-[#EDF0EB] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[#0B2B22]">
                    .{item.format}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[#434E4A]">{item.role}</div>
                <div className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] text-[#434E4A]">
                  <span>{(item.bytes / 1024).toFixed(1)} KB</span>
                  {item.triangles && <span>• {item.triangles.toLocaleString()} tris</span>}
                  <span>• {item.license}</span>
                </div>
                {item.duplicateNote && (
                  <div className="mt-1 text-[10px] font-medium text-amber-800">Duplicate Note: {item.duplicateNote}</div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3 lg:col-span-7">
            {selectedCad && <ModelViewer3D asset={selectedCad} />}
            <div className="rounded-xl border border-[#DDE2DC] bg-white p-4 text-xs space-y-1">
              <div className="font-semibold text-[#141A18]">Asset Audit Note</div>
              <p className="text-[#434E4A]">
                <strong>Architecture Tag:</strong> {selectedCad?.architecture} | <strong>License:</strong> {selectedCad?.license}
              </p>
              <p className="text-[#434E4A]">
                <strong>Source Repository Path:</strong> <code className="font-mono">{selectedCad?.sourcePath}</code>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IP Anchors */}
      <section id="ip" className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-[#141A18]">Intellectual Property Disclosure</h2>
          <EvidenceBadge tier="VERIFIED_MEASURED" />
        </div>
        <p className="text-sm text-[#434E4A]">
          <strong>Published Patent Application (2025):</strong> <em>“Compact Wind Turbine with Planetary Gears”</em> — Inventor:
          <strong> Koyaneni Yaswanth</strong>, Indian Patent Office (IPO). Legal Status: <strong>Published &amp; under examination (NOT granted)</strong>.
          Official application/publication number slot is tracked in the Admin Data Room for formal entry. Active R&amp;D continues on contactless magnetic gearing.
        </p>
      </section>
    </div>
  );
};
