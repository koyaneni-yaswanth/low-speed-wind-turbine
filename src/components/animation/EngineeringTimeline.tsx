import React, { useState } from 'react';
import { CheckCircle2, Clock, Compass, Cpu, Radio, Target } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal.tsx';

const NARRATIVE_SCENES = [
  {
    num: '01',
    title: 'The Challenge — Low-Speed Energy Access',
    summary:
      'Inland rural sites, telecom towers, and monitoring stations often experience 2–5 m/s winds where cubic wind scaling (P = ½ρAV³) leaves conventional high-cut-in turbines idle.',
    icon: Compass,
  },
  {
    num: '02',
    title: 'Aerodynamic Capture — High-Camber Low-Re Rotors',
    summary:
      'Exploring clustered S1223 airfoils and Archimedes spiral geometry to increase starting breakaway torque under low-Reynolds inflows.',
    icon: Target,
  },
  {
    num: '03',
    title: 'Mechanical Speed Step-Up — Planetary & Magnetic Tracks',
    summary:
      'Transforming slow rotor motion via a 1:10 planetary gear train (Mark-3/4/5) while testing a contactless coaxial N52 magnetic gear alternative (Option A).',
    icon: Cpu,
  },
  {
    num: '04',
    title: 'Electrical Conversion — Coreless PMA & Hybrid Bus',
    summary:
      'Pairing multiplied RPM with a 300–500 W coreless alternator class, 3-phase rectification, MPPT, and nighttime/monsoon solar-hybrid storage buffering.',
    icon: Radio,
  },
];

const MILESTONES = [
  {
    id: 'm3',
    phase: 'Mark-3 Three-Rotor Setup',
    badge: 'Completed (Bench Assembly)',
    statusTone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    image: '/repo-assets/media/prototype/mark-3-three-rotor-prototype.png',
    objective: 'Prove 3-rotor clustered torque summation into a central 1:10 spur/planetary gear shaft.',
    config: '3 × 300 mm 3D-printed rotors, timber mast frame, 1:10 gearbox, bench multimeter.',
    challenge: 'FDM polymer tooth surface stairstepping created gear mesh rattle and friction above ~250 RPM.',
    learned: 'Coaxial multi-rotor drive is viable (~2.3–2.5 m/s informal spin) but requires rigid frames & smoother gear machining.',
    validation: 'Informal manual spot log (`26.04 W @ 4.2 m/s`); awaits calibrated closed-loop 1 Hz DAQ.',
  },
  {
    id: 'm4',
    phase: 'Mark-4 Four-Rotor Planar Planetary',
    badge: 'Completed (Reference Bench)',
    statusTone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    image: '/repo-assets/media/prototype/mark-4-four-rotor-prototype.png',
    objective: 'Balance static starting torque symmetry using 4 planar rotors & rear fan-gear coupling.',
    config: '4-setup planetary gearbox on wood/aluminum frame, 300 mm impellers.',
    challenge: 'Historical `36.25 W @ 4.5 m/s` figure exceeds theoretical Betz ceiling for A=0.283 m² and is quarantined as unverified.',
    learned: 'Confirmed higher rotor solidity aids breakaway torque while highlighting strict need for calibrated shunt measurement.',
    validation: 'Quarantined unverified historical log; scheduled for calibrated flow-channel re-test.',
  },
  {
    id: 'm5',
    phase: 'Mark-5 / Project KECS Aluminum Rig',
    badge: 'Completed (Friction Limit Finding)',
    statusTone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    image: '/repo-assets/media/prototype/mark-5-five-rotor-kecs-prototype.jpg',
    objective: 'Test modular aluminum extrusion chassis and 5-rotor mechanical pinion scaling.',
    config: '5 parallel spur pinions meshing into central gear on extruded T-slot aluminum rig.',
    challenge: 'Five simultaneous gear meshes compounded static tooth drag, pushing cut-in higher (~2.8–3.2 m/s).',
    learned: 'Empirical ceiling on multi-mesh spur clusters directly motivated contactless magnetic gearing research (Option A).',
    validation: 'Qualitative mechanical lesson confirmed; no certified outdoor curve.',
  },
  {
    id: 'm6',
    phase: '~1 m² Dyno Shootout (Option A vs Option B)',
    badge: 'Under Development (TRL 4)',
    statusTone: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    image: null,
    objective: 'Compare N52 Coaxial Magnetic Gear + HAWT vs Archimedes + CNC Planetary on identical test rig.',
    config: '~1.0 m² working target, 300–500 W Coreless PMA, ESP32/INA226 1 Hz DAQ.',
    challenge: 'Maintaining 1.5 mm air-gap alignment on magnetic modulator vs gear tooth lubrication/noise.',
    learned: 'Ongoing — no winner declared prior to full 16-criterion comparative dyno matrix.',
    validation: 'Active R&D workstream (Tasks T-1 through T-5 in Workbench).',
  },
  {
    id: 'm7',
    phase: 'TRL 6/7 Off-Grid Pilot Validation',
    badge: 'Planned / Proposed Milestone',
    statusTone: 'bg-slate-700/60 text-slate-300 border-slate-600',
    image: null,
    objective: 'Operate instrumented system continuously for >= 30 days on institutional/telecom pilot mast.',
    config: 'Weather-sealed enclosure, independent overspeed brake, verified HMAC 1 Hz telemetry.',
    challenge: 'Monsoon environmental durability, lightning surge protection & site turbulence.',
    learned: 'Future milestone dependent on passing closed-loop TRL 4/5 safety & dyno gates.',
    validation: 'Not yet started (0 commercial deployments today).',
  },
];

export const EngineeringTimeline: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('m4');
  const active = MILESTONES.find((m) => m.id === selectedId) || MILESTONES[1];

  return (
    <div className="space-y-12">
      {/* Scroll Storytelling Scenes 1–4 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {NARRATIVE_SCENES.map((sc, idx) => {
          const Icon = sc.icon;
          return (
            <ScrollReveal key={sc.num} delayMs={idx * 70}>
              <div className="h-full rounded-2xl border border-cyan-500/20 bg-[#0B1528] p-5 text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-300">SCENE {sc.num}</span>
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="font-display text-sm font-bold">{sc.title}</h3>
                <p className="text-xs leading-relaxed text-slate-300">{sc.summary}</p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Interactive Prototype Evolution Timeline */}
      <div className="rounded-2xl border border-cyan-500/25 bg-[#060D1A] text-white p-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold">Prototype Evolution &amp; Validation Timeline</h3>
            <p className="text-xs text-slate-300">
              Authentic hardware lineage distinguishing completed prototypes from active development and planned pilot stages.
            </p>
          </div>
          <span className="font-mono text-[11px] text-emerald-300">TRL 4 Active -&gt; TRL 6/7 Target</span>
        </div>

        {/* Horizontal Timeline Step Selector */}
        <div className="grid gap-2 sm:grid-cols-5">
          {MILESTONES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`rounded-xl border p-3 text-left transition text-xs ${
                selectedId === m.id
                  ? 'border-cyan-400 bg-cyan-500/15'
                  : 'border-slate-800 bg-[#0B1528] hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] uppercase text-cyan-300">{m.id.toUpperCase()}</span>
                {m.badge.startsWith('Completed') ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-300" />
                )}
              </div>
              <div className="mt-1 font-display font-bold text-white leading-snug">{m.phase}</div>
            </button>
          ))}
        </div>

        {/* Selected Milestone Detail Card */}
        <div className="grid gap-6 lg:grid-cols-12 rounded-xl border border-slate-800 bg-[#0B1528] p-5">
          <div className="lg:col-span-5 min-w-0">
            {active.image ? (
              <img
                src={active.image}
                alt={active.phase}
                className="aspect-[4/3] w-full rounded-xl object-cover border border-slate-700"
              />
            ) : (
              <div className="aspect-[4/3] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-[#060D1A] p-4 text-center text-xs text-slate-400">
                <span className="font-mono text-cyan-300 mb-1">CONCEPT / DEVELOPMENT PHASE</span>
                No field hardware photograph exists yet for this active/planned milestone.
              </div>
            )}
          </div>
          <div className="lg:col-span-7 min-w-0 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-lg font-bold text-white">{active.phase}</h4>
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${active.statusTone}`}>
                {active.badge}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-[#060D1A] p-3">
                <div className="font-mono text-[10px] text-cyan-300 uppercase">Objective</div>
                <p className="mt-1 text-slate-300">{active.objective}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#060D1A] p-3">
                <div className="font-mono text-[10px] text-cyan-300 uppercase">Mechanical Config</div>
                <p className="mt-1 text-slate-300">{active.config}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#060D1A] p-3">
                <div className="font-mono text-[10px] text-amber-300 uppercase">Engineering Challenge</div>
                <p className="mt-1 text-slate-300">{active.challenge}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#060D1A] p-3">
                <div className="font-mono text-[10px] text-emerald-300 uppercase">What Was Learned</div>
                <p className="mt-1 text-slate-300">{active.learned}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#101A2C] p-3 font-mono text-[11px] text-slate-200">
              Validation Status: {active.validation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
