import React, { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { SELECTABLE_WIND_SPEEDS, computeSimulatedTurbineOutput } from '../../lib/animation/turbinePhysics.ts';

const STAGES = [
  { id: 'wind', title: '1. Wind Inflow', detail: 'Ambient air stream P_wind = ½ρAV³ approaching 1 m² working swept target.' },
  { id: 'rotor', title: '2. Rotor Torque', detail: 'Multi-blade / S1223 rotor cluster converts wind pressure into low-RPM mechanical torque.' },
  { id: 'gearbox', title: '3. Transmission', detail: 'Option A Magnetic vs Option B Planetary gearbox multiplies shaft angular speed (~1:10 target).' },
  { id: 'generator', title: '4. Coreless PMA', detail: 'Rotating rotor magnets induce 3-phase EMF across air-core copper stator coils (reduced cogging).' },
  { id: 'rectifier', title: '5. Rectification', detail: 'Low-drop 3-phase Schottky bridge converts AC waveforms to pulsating DC.' },
  { id: 'electronics', title: '6. TCCB & Shunt', detail: 'MPPT/DC-DC stage tracks bus voltage while INA226 monitors V & I (no actuation override).' },
  { id: 'load', title: '7. Battery / Load', detail: 'Feeds isolated 24 V/48 V LFP storage bank or resistive test bench load.' },
];

export const GeneratorEnergyFlow: React.FC = () => {
  const [windSpeedMs, setWindSpeedMs] = useState<number>(6);
  const [activeStage, setActiveStage] = useState<string>('generator');
  const [running, setRunning] = useState<boolean>(true);

  const sim = useMemo(
    () => computeSimulatedTurbineOutput({ windSpeedMs, sweptAreaM2: 1.0, gearRatio: 10 }),
    [windSpeedMs]
  );

  const stageObj = STAGES.find((s) => s.id === activeStage) || STAGES[3];
  const flowDurationSec = Math.max(0.5, 3.2 - windSpeedMs * 0.22).toFixed(2);

  // Build authentic 3-phase simulated electrical sine curves derived strictly from simulated voltage & frequency
  const waveformPoints = useMemo(() => {
    const vPeak = sim.aboveCutInTarget ? Math.min(28, sim.simulatedVoltageV) : 0;
    const freqScale = Math.max(1, sim.generatorRpm / 120);
    return Array.from({ length: 65 }, (_, i) => {
      const x = (i / 64) * 320;
      const theta = (i / 64) * Math.PI * 2 * Math.min(4, freqScale * 0.6);
      const yA = 50 - Math.sin(theta) * (vPeak * 1.3);
      const yB = 50 - Math.sin(theta + (2 * Math.PI) / 3) * (vPeak * 1.3);
      return { x, yA, yB };
    });
  }, [sim]);

  const toPath = (key: 'yA' | 'yB') =>
    waveformPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt[key].toFixed(1)}`).join(' ');

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#060D1A] text-white p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            Electromechanical Generation &amp; Energy Flow Simulator
          </h3>
          <p className="font-mono text-[11px] text-amber-300">
            Simulation Mode — No live hardware data connected (Illustrative 1 m² working model, not field test output)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex flex-wrap gap-1">
            {SELECTABLE_WIND_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setWindSpeedMs(s)}
                className={`rounded px-2 py-1 font-mono text-[11px] ${
                  windSpeedMs === s ? 'bg-emerald-400 text-[#060D1A] font-bold' : 'border border-slate-700 bg-[#101A2C]'
                }`}
              >
                {s}m/s
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg border border-cyan-500/40 bg-[#101A2C] px-2.5 py-1 font-mono text-[11px]"
          >
            {running ? 'Pause Flow' : 'Resume Flow'}
          </button>
        </div>
      </div>

      {/* Pipeline Stages + Pulse Particles */}
      <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7 text-xs">
        {STAGES.map((st, idx) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setActiveStage(st.id)}
            className={`relative rounded-xl border p-3 text-left transition ${
              activeStage === st.id
                ? 'border-cyan-400 bg-cyan-500/15'
                : 'border-slate-800 bg-[#0B1528] hover:border-cyan-500/40'
            }`}
          >
            <div className="font-mono text-[10px] text-cyan-300">{st.title}</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              {running && sim.aboveCutInTarget && (
                <div
                  className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                  style={{
                    animation: `psLightSweep ${flowDurationSec}s linear infinite`,
                    animationDelay: `${idx * 0.15}s`,
                  }}
                />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Coreless Rotor/Stator Visual + Waveform + Honest Metrics */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5 min-w-0 rounded-xl border border-slate-800 bg-[#0B1528] p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-cyan-300">{stageObj.title}</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">Simulated</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{stageObj.detail}</p>

          <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
            <svg viewBox="0 0 96 96" className="h-20 w-20 shrink-0" aria-label="Coreless PMA rotor stator graphic">
              <circle cx="48" cy="48" r="42" fill="none" stroke="#1E293B" strokeWidth="8" />
              <circle cx="48" cy="48" r="34" fill="none" stroke="#D97706" strokeWidth="4" strokeDasharray="8 6" />
              <g
                style={{
                  transformOrigin: '48px 48px',
                  animation:
                    running && sim.aboveCutInTarget ? `spin ${Math.max(0.3, 4 - windSpeedMs * 0.3)}s linear infinite` : 'none',
                }}
              >
                <circle cx="48" cy="48" r="18" fill="#0F172A" stroke="#22D3EE" strokeWidth="2.5" />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <line
                    key={deg}
                    x1="48"
                    y1="48"
                    x2={48 + 16 * Math.cos((deg * Math.PI) / 180)}
                    y2={48 + 16 * Math.sin((deg * Math.PI) / 180)}
                    stroke="#34D399"
                    strokeWidth="2.5"
                  />
                ))}
              </g>
            </svg>
            <div className="text-[11px] text-slate-300 space-y-1 font-mono">
              <div>Stator: Air-core copper coils</div>
              <div>Rotor: N52 magnet poles</div>
              <div>Status: {sim.aboveCutInTarget ? 'Active Excitation (Sim)' : 'Below 2.2 m/s Target'}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 min-w-0 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0B1528] p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-mono text-cyan-300">Simulator Back-EMF Phase Preview (V_A, V_B)</span>
              <span className="font-mono text-amber-300">Simulated Waveform — Not Measured Scope Trace</span>
            </div>
            <svg viewBox="0 0 320 100" className="h-24 w-full rounded bg-[#060D1A]" role="img" aria-label="Simulated generator waveform">
              <line x1="0" y1="50" x2="320" y2="50" stroke="#1E293B" strokeDasharray="4 4" />
              <path d={toPath('yA')} fill="none" stroke="#22D3EE" strokeWidth="2" />
              <path d={toPath('yB')} fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 2" />
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono tabular-nums">
            {[
              ['Wind Input', `${sim.windSpeedMs} m/s`, 'Simulated'],
              ['Rotor RPM', `${sim.rotorRpm}`, 'Estimated'],
              ['Gen RPM (1:10)', `${sim.generatorRpm}`, 'Estimated'],
              ['DC Bus Voltage', `${sim.simulatedVoltageV} V`, 'Simulated'],
              ['Current Est.', `${sim.simulatedCurrentA} A`, 'Simulated'],
              ['Electrical Power', `${sim.simulatedElectricalPowerW} W`, 'Estimated (~1m²)'],
              ['1h Sim Energy', `${sim.simulatedElectricalPowerW.toFixed(1)} Wh`, 'Simulated'],
              ['Live ESP32 Feed', 'Offline', 'Unavailable'],
            ].map(([label, value, tag]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-[#0B1528] p-2.5">
                <div className="text-[10px] text-slate-400">{label}</div>
                <div className="mt-0.5 text-sm font-bold text-white">{value}</div>
                <div className="mt-0.5 text-[9px] uppercase text-cyan-300">{tag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
