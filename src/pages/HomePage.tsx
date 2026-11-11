import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Cpu, FileText, Gauge, Layers, Wind } from 'lucide-react';
import { APPLICATION_SEGMENTS, PROTOTYPE_RECORDS } from '../data/pawanShaktiData.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';
import { AnimationBoundary } from '../components/animation/AnimationBoundary.tsx';
import { EngineeringTimeline } from '../components/animation/EngineeringTimeline.tsx';
import { ScrollReveal } from '../components/animation/ScrollReveal.tsx';
import { useScrollProgress } from '../hooks/useScrollProgress.ts';

const TurbineScene = lazy(() =>
  import('../components/three/TurbineScene.tsx').then((m) => ({ default: m.TurbineScene }))
);
const PlanetaryGearScene = lazy(() =>
  import('../components/three/PlanetaryGearScene.tsx').then((m) => ({ default: m.PlanetaryGearScene }))
);
const GeneratorEnergyFlow = lazy(() =>
  import('../components/three/GeneratorEnergyFlow.tsx').then((m) => ({ default: m.GeneratorEnergyFlow }))
);
const TwoPathComparisonScene = lazy(() =>
  import('../components/three/TwoPathComparisonScene.tsx').then((m) => ({ default: m.TwoPathComparisonScene }))
);

const SceneLoadingPlaceholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-72 items-center justify-center rounded-2xl border border-cyan-500/20 bg-[#0B1528] text-xs font-mono text-cyan-300">
    Loading {label}...
  </div>
);

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
    a: 'No. Repository history documents 300 mm multi-rotor rigs targeted around a 100 W bench class and current ~1 m² engineering assumptions in a 300–500 W coreless alternator design class. There is zero validated 1 kW unit today.',
  },
];

export const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'PAWAN SHAKTI — Powering the Future at the Speed of the Wind',
        description:
          'Interactive TRL 4 low-speed wind energy engineering laboratory: 3D wind turbine simulation, planetary gearbox kinematics, CAD explorer, calculators, and B2B pilot validation.',
      },
      '/'
    );
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* SECTION 3: Cinematic Aerospace 3D Hero */}
      <section className="relative overflow-hidden border-b border-cyan-500/20 bg-[#060D1A] text-white ps-aerospace-grid">
        {/* Subtle initial light sweep */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent ps-light-sweep"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-14">
          <div className="space-y-6 lg:col-span-5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-200">
                <Wind className="h-3.5 w-3.5" /> LOW-SPEED WIND ENERGY R&amp;D
              </span>
              <EvidenceBadge tier="PROTOTYPE_OBSERVATION" compact />
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-[1.08]">
              Powering the Future at the Speed of the Wind.
            </h1>

            <p className="text-base leading-relaxed text-slate-300">
              Engineering low-speed wind energy systems designed to explore decentralized power generation for rural,
              off-grid, and remote applications.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/technology"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#060D1A] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
              >
                Explore the Technology <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#engineering-lab"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-[#0B1528]/90 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:bg-[#101A2C]"
              >
                View Engineering Lab
              </a>
            </div>

            {/* Required Technical Status Panel */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 rounded-2xl border border-cyan-500/25 bg-[#0B1528]/85 p-4 backdrop-blur-md text-xs">
              <div>
                <div className="font-mono text-[10px] uppercase text-cyan-300">Technology</div>
                <div className="mt-0.5 font-semibold text-white">Low-speed wind energy</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase text-cyan-300">Current Development Stage</div>
                <div className="mt-0.5 font-semibold text-emerald-300">TRL 4 (Bench Prototype)</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase text-cyan-300">Research Focus</div>
                <div className="mt-0.5 font-semibold text-slate-200">Mechanical efficiency &amp; low-speed generation</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase text-cyan-300">Next Milestone</div>
                <div className="mt-0.5 font-semibold text-amber-200">Evidence-backed field validation</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 min-w-0">
            <AnimationBoundary fallbackTitle="Pawan Shakti Hero 3D Wind Turbine">
              <Suspense fallback={<SceneLoadingPlaceholder label="3D Hero Wind Turbine" />}>
                <TurbineScene mode="hero" scrollProgress={scrollProgress} />
              </Suspense>
            </AnimationBoundary>
          </div>
        </div>
      </section>

      {/* SECTION 4–8 & 10–12: Scroll Narrative, Planetary Gearbox, Generator Energy Flow & Shootout */}
      <section id="engineering-lab" className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="space-y-2 border-b border-cyan-500/20 pb-4">
            <div className="font-mono text-xs uppercase tracking-wider text-cyan-400">
              Interactive Engineering Laboratories (Scenes 01–07)
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              From Low-Speed Wind Inflow to Verified Electromechanical Validation
            </h2>
            <p className="max-w-3xl text-sm text-slate-400">
              Every visual simulator explicitly separates interactive physics models (`Simulated` / `Estimated`) from
              calibrated field measurements (`Measured` — currently awaiting 1 Hz closed-loop dyno runs).
            </p>
          </div>
        </ScrollReveal>

        <EngineeringTimeline />

        <ScrollReveal>
          <AnimationBoundary fallbackTitle="Planetary Gearbox Kinematics Visualizer">
            <Suspense fallback={<SceneLoadingPlaceholder label="Planetary Gearbox 3D Assembly" />}>
              <PlanetaryGearScene />
            </Suspense>
          </AnimationBoundary>
        </ScrollReveal>

        <ScrollReveal>
          <AnimationBoundary fallbackTitle="Generator Energy Conversion Simulator">
            <Suspense fallback={<SceneLoadingPlaceholder label="Generator Energy Flow" />}>
              <GeneratorEnergyFlow />
            </Suspense>
          </AnimationBoundary>
        </ScrollReveal>

        <ScrollReveal>
          <AnimationBoundary fallbackTitle="Option A vs Option B Architecture Comparison">
            <Suspense fallback={<SceneLoadingPlaceholder label="Option A vs Option B Comparison" />}>
              <TwoPathComparisonScene />
            </Suspense>
          </AnimationBoundary>
        </ScrollReveal>
      </section>

      {/* Authentic Hardware Prototype Photography Gallery (Original Assets Preserved) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Hardware Prototype Evolution</h2>
            <p className="text-sm text-slate-400">
              Every image shows actual physical Pawan Shakti bench hardware (zero stock turbine photos).
            </p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-cyan-400 hover:underline">
            Compare Option A &amp; Option B Architectures →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PROTOTYPE_RECORDS.filter((p) => p.photoUrl).map((proto) => (
            <article key={proto.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#DDE2DC] bg-white text-[#141A18]">
              <img
                src={proto.photoUrl!}
                alt={proto.name}
                className="aspect-[4/3] w-full object-cover bg-[#F6F7F4]"
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
          <Link to="/technology" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 text-[#141A18] transition hover:border-cyan-400">
            <Layers className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">CAD Vault &amp; S1223</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Inspect interactive 3D STL/3MF meshes, Fusion assemblies &amp; formal 2D drawings.</p>
          </Link>
          <Link to="/performance" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 text-[#141A18] transition hover:border-cyan-400">
            <Gauge className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">Calculators &amp; DAQ</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Betz-bounded Wind, ROI, and Solar-Wind Hybrid calculators + ESP32 telemetry.</p>
          </Link>
          <Link to="/applications" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 text-[#141A18] transition hover:border-cyan-400">
            <Cpu className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">7 Target Applications</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Telecom, campuses, industrial roofs, remote IoT &amp; agriculture pilot hypotheses.</p>
          </Link>
          <Link to="/resources" className="rounded-2xl border border-[#DDE2DC] bg-white p-5 text-[#141A18] transition hover:border-cyan-400">
            <FileText className="h-5 w-5 text-[#0B2B22]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#141A18]">IP &amp; Evidence Library</h3>
            <p className="mt-1 text-xs text-[#434E4A]">Published 2025 Indian Patent record, VNIT V3F summary &amp; test protocols.</p>
          </Link>
        </div>
      </section>

      {/* Applications & Team Preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 text-[#141A18] lg:col-span-7 space-y-4">
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

        <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 text-[#141A18] lg:col-span-5 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#141A18]">Leadership, Mentorship &amp; IP</h2>
          <div className="space-y-3 text-xs text-[#434E4A]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold text-[#141A18]">Founder &amp; Lead:</span> Koyaneni Yaswanth (B.Tech Metallurgical &amp; Materials Engineering, VNIT Nagpur)
              </span>
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
        <h2 className="font-display text-2xl font-bold">Technical &amp; Verification FAQs</h2>
        <div className="divide-y divide-[#DDE2DC] rounded-2xl border border-[#DDE2DC] bg-white text-[#141A18]">
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
