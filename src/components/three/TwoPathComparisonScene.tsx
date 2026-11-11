import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, Pause, Play } from 'lucide-react';
import { useAnimationContext } from '../animation/animationContext.ts';
import { WebGLFallbackCard } from '../animation/AnimationBoundary.tsx';
import { isWebGLAvailable } from '../../lib/animation/webglSupport.ts';

const RESEARCH_COMPARISON_ROWS = [
  ['Mechanical Complexity', 'Zero sliding teeth; requires precision N52 pole-carrier & 1.5 mm radial air-gap concentricity', 'Involute multi-stage tooth carrier; radial loads balanced across planet pins', 'Pending Build'],
  ['Starting Behavior', 'Low cogging potential; no static tooth mesh friction', 'Subject to gear mesh breakaway & synthetic grease viscosity at low RPM', 'Pending Dyno'],
  ['Torque Characteristics', 'Smooth magnetic shear with intrinsic overload slip decoupling', 'Rigid mechanical torque path; overload risks polymer/Delrin tooth shear', 'Pending Dyno'],
  ['Transmission Efficiency', 'No sliding tooth friction; eddy/hysteresis core losses in modulator must be measured', 'Gear tooth rolling/sliding loss + carrier bearing drag under load', 'Unmeasured'],
  ['Manufacturing Complexity', 'N52 rare-earth magnet bonding, steel flux modulator rings, tight runout', 'Gear hobbing / CNC Delrin (POM) or close-tolerance FDM', 'Evaluated in Bench Costing'],
  ['Maintenance', 'Zero gear lubrication required; periodic corrosion/air-gap dust inspection', 'Periodic tooth backlash inspection and PTFE/synthetic relubrication', 'Field Protocol'],
  ['Cost Structure', 'Driven by N52 magnet grade & EDM/laser modulator steel', 'Driven by precision CNC machined polymer/alloy gears', 'Commercial Assumption'],
  ['Test Status', 'CAD rings (`ringforferritemagnetsv2.f3d`, `magnetic gear.3mf`); bench dyno planned', 'Mark-3/4/5 planetary prototypes built; closed-loop calibration pending', 'Open — No Winner Declared'],
];

export const TwoPathComparisonScene: React.FC = () => {
  const { reducedMotion } = useAnimationContext();
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglOk] = useState(() => isWebGLAvailable());
  const [paused, setPaused] = useState(false);
  const [exploded, setExploded] = useState(false);
  const stateRef = useRef({ paused, exploded, reducedMotion });
  useEffect(() => {
    stateRef.current = { paused, exploded, reducedMotion };
  }, [paused, exploded, reducedMotion]);

  useEffect(() => {
    if (!webglOk) return;
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(host.clientWidth || 720, 290);
      renderer.domElement.style.maxWidth = '100%';
      renderer.domElement.style.display = 'block';
      host.innerHTML = '';
      host.appendChild(renderer.domElement);
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, (host.clientWidth || 720) / 290, 0.1, 100);
    camera.position.set(0, 1.5, 6.2);

    scene.add(new THREE.AmbientLight(0x94a3b8, 1.0));
    const l1 = new THREE.DirectionalLight(0x22d3ee, 1.8);
    l1.position.set(5, 5, 5);
    scene.add(l1);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(i: T): T => {
      disposables.push(i);
      return i;
    };

    // Left: Option A — Coaxial Magnetic Gear + HAWT Concept
    const optAGroup = new THREE.Group();
    optAGroup.position.x = -2.1;
    const cyanMat = track(new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.7, roughness: 0.25 }));
    const emeraldMat = track(new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7, roughness: 0.3 }));
    const slateMat = track(new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.3 }));

    const hawtHub = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 1.25, 0.04)), slateMat);
      b.position.set(Math.cos((i * 2 * Math.PI) / 3) * 0.65, Math.sin((i * 2 * Math.PI) / 3) * 0.65, 0);
      b.rotation.z = (i * 2 * Math.PI) / 3 + Math.PI / 2;
      hawtHub.add(b);
    }
    const outerMagRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.82, 0.09, 14, 32)), cyanMat);
    const innerMagCore = new THREE.Mesh(track(new THREE.CylinderGeometry(0.32, 0.32, 0.28, 24)), emeraldMat);
    innerMagCore.rotation.x = Math.PI / 2;
    optAGroup.add(hawtHub, outerMagRing, innerMagCore);
    scene.add(optAGroup);

    // Right: Option B — Archimedes Spiral + Planetary Gear Concept
    const optBGroup = new THREE.Group();
    optBGroup.position.x = 2.1;
    const amberMat = track(new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.28 }));
    const spiralCone = new THREE.Mesh(track(new THREE.ConeGeometry(0.95, 1.1, 24, 1, true)), slateMat);
    spiralCone.rotation.x = Math.PI / 2;
    const planetaryCarrier = new THREE.Mesh(track(new THREE.TorusGeometry(0.55, 0.09, 12, 24)), amberMat);
    const planetaryCore = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 16)), cyanMat);
    planetaryCore.rotation.x = Math.PI / 2;
    optBGroup.add(spiralCone, planetaryCarrier, planetaryCore);
    scene.add(optBGroup);

    let prev = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const s = stateRef.current;

      if (!s.paused && !s.reducedMotion) {
        hawtHub.rotation.z += dt * 1.4;
        innerMagCore.rotation.y += dt * 7.5;
        spiralCone.rotation.y += dt * 1.1;
        planetaryCarrier.rotation.z += dt * 1.1;
        planetaryCore.rotation.y += dt * 9.0;
      }

      const ez = s.exploded ? 1 : 0;
      hawtHub.position.z += (ez * 0.9 - hawtHub.position.z) * Math.min(1, dt * 6);
      innerMagCore.position.z += (-ez * 0.8 - innerMagCore.position.z) * Math.min(1, dt * 6);
      spiralCone.position.z += (ez * 0.9 - spiralCone.position.z) * Math.min(1, dt * 6);
      planetaryCore.position.z += (-ez * 0.8 - planetaryCore.position.z) * Math.min(1, dt * 6);

      renderer!.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    const onResize = () => {
      if (!host || !renderer) return;
      const w = host.clientWidth || 720;
      camera.aspect = w / 290;
      camera.updateProjectionMatrix();
      renderer.setSize(w, 290);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
    };
  }, [webglOk]);

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#060D1A] text-white overflow-hidden space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-white">
            Two-Path Drivetrain Comparison — Option A vs Option B (Conceptual 3D Side-by-Side)
          </h3>
          <p className="text-xs text-amber-200 font-mono">
            Research options remain under evaluation until validated test evidence supports a design freeze.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-[#101A2C] px-2.5 py-1 font-mono"
          >
            {paused ? <Play className="h-3 w-3 text-emerald-400" /> : <Pause className="h-3 w-3 text-cyan-300" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => setExploded((e) => !e)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono ${
              exploded ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 bg-[#101A2C]'
            }`}
          >
            <Layers className="h-3 w-3" /> {exploded ? 'Assemble' : 'Explode Both'}
          </button>
        </div>
      </div>

      {webglOk ? (
        <div className="rounded-xl border border-slate-800 bg-[#0B1528] ps-aerospace-grid overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 border-b border-slate-800 px-4 py-2 font-mono text-[11px] text-center">
            <div className="text-cyan-300 font-bold">OPTION A: Coaxial Magnetic Gear + HAWT Airfoil</div>
            <div className="text-amber-300 font-bold">OPTION B: Archimedes Spiral + Planetary Gearbox</div>
          </div>
          <div ref={hostRef} className="h-[290px] w-full overflow-hidden" />
        </div>
      ) : (
        <WebGLFallbackCard title="Option A vs Option B Dual Architecture Comparison" />
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0B1528]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-[#101A2C] text-slate-200">
            <tr>
              <th className="px-3 py-2.5">Criterion</th>
              <th className="px-3 py-2.5 text-cyan-300">Option A (Magnetic + HAWT)</th>
              <th className="px-3 py-2.5 text-amber-300">Option B (Spiral + Planetary)</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {RESEARCH_COMPARISON_ROWS.map(([crit, optA, optB, st]) => (
              <tr key={crit}>
                <td className="px-3 py-2 font-semibold text-white">{crit}</td>
                <td className="px-3 py-2">{optA}</td>
                <td className="px-3 py-2">{optB}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-amber-200">{st}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
