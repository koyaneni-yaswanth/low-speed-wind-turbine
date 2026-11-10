import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Cpu, FileText, Gauge, Layers, ShieldAlert, Wind } from 'lucide-react';
import { APPLICATION_SEGMENTS, PROTOTYPE_RECORDS } from '../data/pawanShaktiData.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';

const FAQS = [
  {
    q: 'What stage is Pawan Shakti currently in?',
    a: 'Pawan Shakti is at TRL 4 (laboratory and benchtop subsystem prototyping). Physical Mark-3, Mark-4, and Mark-5 prototypes have been built and spun, and the venture is currently conducting comparative drivetrain testing (Option A Magnetic Gear vs Option B Planetary) and 1 Hz instrumentation toward TRL 6/7 validation.',
  },
  {
    q: 'Does Pawan Shakti generate electricity continuously 24 hours a day?',
    a: 'No. Like all wind systems, electrical output depends strictly on ambient wind velocity and storage capacity. Low-speed wind capability aims to expand operating hours during evening breezes and monsoon months to complement daytime rooftop solar, rather than guaranteeing constant output at zero wind.',
  },
  {
    q: 'Is the Indian Patent granted or certified for commercial grid export?',
    a: 'The Indian Patent Application ("Compact Wind Turbine with Planetary Gears") was published in 2025 and is currently under active examination (not yet granted). Pawan Shakti is also not an IEC 61400-2 certified commercial grid-tie product; grid export and field weatherproofing are future engineering milestones.',
  },
  {
    q: 'Is the 1 kW turbine validated or shipping today?',
    a: 'No. Repository history documents 300 mm multi-rotor rigs targeted around a 100 W bench class and current ~1 m2 engineering assumptions in a 300–500 W coreless alternator design class. There is zero validated 1 kW unit today.',
  },
];

export const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'PAWAN SHAKTI — Engineering Practical Wind Energy for Low-Speed Environments',
        description:
          'TRL 4 low-speed wind energy R&D platform developing compact planetary and coaxial magnetic gear turbines for distributed off-grid and hybrid applications.',
      },
      '/'
    );
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="border-b border-[#DDE2DC] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0B2B22]/20 bg-[#F6F7F4] px-3 py-1 font-mono text-xs font-semibold text-[#0B2B22]">
                TRL 4 HARDWARE R&amp;D PROTOTYPE
              </span>
              <EvidenceBadge tier="VERIFIED_MEASURED" />
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#141A18] sm:text-5xl leading-[1.1]">
              Engineering practical wind energy for low-speed environments.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-[#434E4A] sm:text-lg">
              Small-scale wind technology designed to make more of the wind that conventional small systems may not
              effectively use — advancing from laboratory planetary prototypes toward validated distributed and solar-hybrid pilots.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/pilot"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B2B22] px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#144537]"
              >
                Discuss a Pilot <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/technology"
                className="inline-flex items-center gap-2 rounded-xl border border-[#DDE2DC] bg-white px-5 py-3 text-sm font-semibold text-[#141A18] transition hover:bg-[#F6F7F4]"
              >
                Explore the Technology
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4 border-t border-[#DDE2DC]">
              <div>
                <div className="font-mono text-xs text-[#434E4A]">Development Stage</div>
                <div className="font-display text-sm font-bold text-[#141A18]">TRL 4 Prototype</div>
              </div>
              <div>
                <div className="font-mono text-xs text-[#434E4A]">Target Swept Area</div>
                <div className="font-display text-sm font-bold text-[#141A18]">~1.0 m² (Est.)</div>
              </div>
              <div>
                <div className="font-mono text-xs text-[#434E4A]">Hardware Line</div>
                <div className="font-display text-sm font-bold text-[#141A18]">Mark-3 / 4 / 5</div>
              </div>
              <div>
                <div className="font-mono text-xs text-[#434E4A]">Patent Application</div>
                <div className="font-display text-sm font-bold text-[#141A18]">Published 2025</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-[#DDE2DC] bg-[#F6F7F4]">
              <img
                src="/repo-assets/media/prototype/mark-4-four-rotor-prototype.png"
                alt="Pawan Shakti Mark-4 physical four-rotor planetary prototype rig"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DDE2DC] bg-white px-4 py-3 text-xs">
                <span className="font-medium text-[#141A18]">Mark-4 Physical Prototype Rig (VNIT Nagpur Lab)</span>
                <EvidenceBadge tier="PROTOTYPE_OBSERVATION" compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Explanation & Current Status Boundary */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#0B2B22]">
              <Wind className="h-4 w-4" /> Why Low-Speed Wind Fails Conventionally
            </div>
            <h2 className="font-display text-2xl font-bold text-[#141A18]">
              Cubic Wind Power Scaling, Cogging Stiction &amp; Diurnal Solar Gaps
            </h2>
            <p className="text-sm leading-relaxed text-[#434E4A]">
              Kinetic stream power scales with the cube of wind velocity (<code className="font-mono">P = ½ρAV³</code>).
              Drop wind speed from coastal 10 m/s to an inland 3 m/s breeze and power density falls by <strong>97.3%</strong>.
              At sub-critical chord Reynolds numbers (<code className="font-mono">Re &lt; 100,000</code>), thick conventional blades lose
              lift while generator cogging torque and gear stiction keep rotors stalled below ~5 m/s.
            </p>
            <div className="grid gap-3 sm:grid-cols-3 pt-2 text-xs">
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="font-semibold text-[#141A18]">Low-Re Aerodynamics</div>
                <p className="mt-1 text-[#434E4A]">High-camber Selig S1223 airfoils &amp; multi-blade solidity studied for static breakaway torque.</p>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="font-semibold text-[#141A18]">Step-Up Shootout</div>
                <p className="mt-1 text-[#434E4A]">Evaluating coaxial magnetic gearing (Option A) vs planetary gearboxes (Option B) head-to-head.</p>
              </div>
              <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
                <div className="font-semibold text-[#141A18]">Complementary Hybrid Role</div>
                <p className="mt-1 text-[#434E4A]">Targeted at night/monsoon battery replenishment alongside solar PV—never claimed as 24/7 output.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#141A18]">Prototype Evidence vs Future Targets</h3>
              <EvidenceBadge tier="ENGINEERING_ESTIMATE" compact />
            </div>
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Current Prototype Reality (TRL 4)
                </div>
                <p className="mt-1 text-emerald-900/90">
                  4-setup &amp; 3-setup planetary gear arrangements built with blade support structures, rear fan gear &amp; wood/aluminum test frames. Calibrated 1 Hz closed-loop power curves are actively being built.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-700" /> Working 1 m² Iteration Inputs (Unvalidated)
                </div>
                <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-amber-900">
                  <li>• Target Swept Area: ~1.0 m² (r ≈ 0.564 m)</li>
                  <li>• Wind Regime: 2–8 m/s (Cut-in ≤ 2.2 m/s target)</li>
                  <li>• Preliminary Estimates: 20–25W @ 5 m/s | 95–110W @ 8 m/s | 250–300W @ 11 m/s</li>
                  <li>• Coreless PMA Concept: 300–500 W class @ 300–600 RPM</li>
                </ul>
              </div>
              <Link
                to="/performance"
                className="inline-flex items-center gap-1 font-semibold text-[#0B2B22] hover:underline"
              >
                Open Interactive Calculators &amp; Telemetry Hub <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Authentic Prototype Evolution Gallery */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#141A18]">Hardware Prototype Evolution</h2>
            <p className="text-sm text-[#434E4A]">
              Every image shows actual physical Pawan Shakti bench hardware (zero stock turbine photos).
            </p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-[#0B2B22] hover:underline">
            Compare Option A &amp; Option B Architectures →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PROTOTYPE_RECORDS.filter((p) => p.photoUrl).map((proto) => (
            <article key={proto.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#DDE2DC] bg-white">
              <img
                src={proto.photoUrl!}
                alt={proto.name}
                className="aspect-[4/3] w-full object-cover bg-[#F6F7F4]"
                loading="lazy"
              />
              <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#0B2B22]">{proto.configCode}</span>
                    <EvidenceBadge tier={proto.evidenceTier} compact />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#141A18]">{proto.name}</h3>
                  <p className="text-xs text-[#434E4A]">{proto.keyFinding}</p>
                </div>
                <div className="border-t border-[#DDE2DC] pt-2.5 text-[11px] font-mono text-[#434E4A]">
                  {proto.historicalPowerNote}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works & Quick Capability Links */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/technology" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 transition hover:border-[#0B2B22]">
            <Layers className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">CAD Vault &amp; S1223</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Inspect interactive 3D STL/3MF meshes, Fusion assemblies &amp; formal 2D drawings.</p>
          </Link>
          <Link to="/performance" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 transition hover:border-[#0B2B22]">
            <Gauge className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">Calculators &amp; DAQ</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Betz-bounded Wind, ROI, and Solar-Wind Hybrid calculators + ESP32 telemetry.</p>
          </Link>
          <Link to="/applications" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 transition hover:border-[#0B2B22]">
            <Cpu className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">7 Target Applications</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Telecom, campuses, industrial roofs, remote IoT &amp; agriculture pilot hypotheses.</p>
          </Link>
          <Link to="/resources" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 transition hover:border-[#0B2B22]">
            <FileText className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">IP &amp; Evidence Library</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Published 2025 Indian Patent record, VNIT V3F summary &amp; test protocols.</p>
          </Link>
        </div>
      </section>

      {/* Applications & Team Preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#141A18]">Target Distributed Applications (Pre-Commercial)</h2>
            <Link to="/applications" className="text-xs font-semibold text-[#0B2B22] hover:underline">View all 7 →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {APPLICATION_SEGMENTS.slice(0, 4).map((seg) => (
              <div key={seg.id} className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3.5 text-xs">
                <div className="font-semibold text-[#141A18]">{seg.title}</div>
                <p className="mt-1 text-[#434E4A]">{seg.useCase}</p>
                <div className="mt-2 font-mono text-[10px] text-[#B45309]">{seg.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 lg:col-span-5 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#141A18]">Leadership, Mentorship &amp; IP</h2>
          <div className="space-y-3 text-xs text-[#434E4A]">
            <div>
              <span className="font-semibold text-[#141A18]">Founder &amp; Lead:</span> Koyaneni Yaswanth (B.Tech Metallurgical &amp; Materials Engineering, VNIT Nagpur)
            </div>
            <div>
              <span className="font-semibold text-[#141A18]">Academic Mentor:</span> Dr. Jawahar Bhukya (Asst. Professor, EEE Dept., VNIT Nagpur)
            </div>
            <div>
              <span className="font-semibold text-[#141A18]">Incubation:</span> VNIT Ventures Vault Foundation (V3F) Pre-Incubation (Effective 21 Sept 2026)
            </div>
            <div>
              <span className="font-semibold text-[#141A18]">IP Filing:</span> Indian Patent Application Published 2025 — <em>Compact Wind Turbine with Planetary Gears</em> (Under examination; not yet granted)
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <Link to="/about" className="rounded-lg border border-[#DDE2DC] px-3 py-1.5 text-xs font-semibold text-[#141A18] hover:bg-[#F6F7F4]">
              About &amp; Ecosystem
            </Link>
            <Link to="/pilot" className="rounded-lg bg-[#0B2B22] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#144537]">
              Apply for Pilot Assessment
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#141A18]">Technical &amp; Verification FAQs</h2>
        <div className="divide-y divide-[#DDE2DC] rounded-2xl border border-[#DDE2DC] bg-white">
          {FAQS.map((item, idx) => (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                aria-expanded={openFaq === idx}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#141A18] hover:bg-[#F6F7F4]"
              >
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openFaq === idx && <p className="px-5 pb-4 text-xs leading-relaxed text-[#434E4A]">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
