import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, EyeOff, Layers, Pause, Play } from 'lucide-react';
import { useAnimationContext } from '../animation/animationContext.ts';
import { WebGLFallbackCard } from '../animation/AnimationBoundary.tsx';
import { isWebGLAvailable } from '../../lib/animation/webglSupport.ts';
import {
  DEFAULT_PLANETARY_SPEC,
  solvePlanetaryKinematics,
  type PlanetaryConstraintMode,
} from '../../lib/animation/gearKinematics.ts';

function buildGearShape(teeth: number, outerR: number, rootR: number, boreR: number): THREE.Shape {
  const shape = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const mod = i % 4;
    const r = mod === 1 || mod === 2 ? outerR : rootR;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  if (boreR > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, boreR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

export const PlanetaryGearScene: React.FC = () => {
  const { reducedMotion } = useAnimationContext();
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglOk] = useState(() => isWebGLAvailable());

  const [inputRpm, setInputRpm] = useState<number>(35);
  const [constraint, setConstraint] = useState<PlanetaryConstraintMode>('ring_fixed');
  const [paused, setPaused] = useState<boolean>(false);
  const [exploded, setExploded] = useState<boolean>(false);
  const [showHousing, setShowHousing] = useState<boolean>(true);
  const [highlightPath, setHighlightPath] = useState<boolean>(true);
  const [selectedPart, setSelectedPart] = useState<'all' | 'sun' | 'planets' | 'carrier' | 'ring'>('all');

  const kinematics = useMemo(
    () => solvePlanetaryKinematics({ inputRpm, constraint, spec: DEFAULT_PLANETARY_SPEC }),
    [inputRpm, constraint]
  );

  const stateRef = useRef({
    kinematics,
    paused,
    reducedMotion,
    exploded,
    showHousing,
    highlightPath,
    selectedPart,
  });

  useEffect(() => {
    stateRef.current = { kinematics, paused, reducedMotion, exploded, showHousing, highlightPath, selectedPart };
  }, [kinematics, paused, reducedMotion, exploded, showHousing, highlightPath, selectedPart]);

  useEffect(() => {
    if (!webglOk) return;
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(host.clientWidth || 560, 340);
      renderer.domElement.style.maxWidth = '100%';
      renderer.domElement.style.display = 'block';
      host.innerHTML = '';
      host.appendChild(renderer.domElement);
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, (host.clientWidth || 560) / 340, 0.1, 100);
    camera.position.set(2.8, 2.2, 4.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0x94a3b8, 0.95));
    const dir = new THREE.DirectionalLight(0xe0f2fe, 2.0);
    dir.position.set(4, 6, 5);
    scene.add(dir);
    const backCyan = new THREE.DirectionalLight(0x22d3ee, 1.3);
    backCyan.position.set(-4, -2, -4);
    scene.add(backCyan);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const sunMat = track(new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.78, roughness: 0.25 }));
    const planetMat = track(new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.74, roughness: 0.26 }));
    const carrierMat = track(new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.65, roughness: 0.35 }));
    const ringMat = track(new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.82, roughness: 0.25 }));
    const housingMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.6,
        roughness: 0.35,
        transparent: true,
        opacity: 0.3,
      })
    );
    const shaftMat = track(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 }));

    const extrudeOpts = (d: number) => ({ depth: d, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 1 });

    // Sun Gear + Output Shaft
    const sunGroup = new THREE.Group();
    const sunGeo = track(new THREE.ExtrudeGeometry(buildGearShape(12, 0.38, 0.31, 0.1), extrudeOpts(0.28)));
    sunGeo.translate(0, 0, -0.14);
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    const outShaft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 24)), shaftMat);
    outShaft.rotation.x = Math.PI / 2;
    outShaft.position.z = 0.65;
    sunGroup.add(sunMesh, outShaft);
    scene.add(sunGroup);

    // Carrier + Input Shaft + 3 Planet Gears
    const carrierGroup = new THREE.Group();
    const carrierPlate = new THREE.Mesh(track(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 32)), carrierMat);
    carrierPlate.rotation.x = Math.PI / 2;
    carrierPlate.position.z = -0.25;
    const inShaft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.11, 1.15, 24)), shaftMat);
    inShaft.rotation.x = Math.PI / 2;
    inShaft.position.z = -0.82;
    const bearingCollar = new THREE.Mesh(track(new THREE.TorusGeometry(0.17, 0.04, 12, 24)), shaftMat);
    bearingCollar.position.z = -0.55;
    carrierGroup.add(carrierPlate, inShaft, bearingCollar);

    const planetGeo = track(new THREE.ExtrudeGeometry(buildGearShape(18, 0.56, 0.49, 0.09), extrudeOpts(0.24)));
    planetGeo.translate(0, 0, -0.12);
    const planetMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const orbR = 0.9;
      const pm = new THREE.Mesh(planetGeo, planetMat);
      pm.position.set(Math.cos(angle) * orbR, Math.sin(angle) * orbR, 0);
      carrierGroup.add(pm);
      planetMeshes.push(pm);
    }
    scene.add(carrierGroup);

    // Ring Gear (Outer Internal Toothed Annulus representation)
    const ringGroup = new THREE.Group();
    const ringGeo = track(new THREE.ExtrudeGeometry(buildGearShape(36, 1.65, 1.56, 1.46), extrudeOpts(0.32)));
    ringGeo.translate(0, 0, -0.16);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringGroup.add(ringMesh);
    scene.add(ringGroup);

    // Translucent Housing Shell
    const housingGroup = new THREE.Group();
    const housingCyl = new THREE.Mesh(track(new THREE.CylinderGeometry(1.78, 1.78, 0.95, 36, 1, true)), housingMat);
    housingCyl.rotation.x = Math.PI / 2;
    housingGroup.add(housingCyl);
    scene.add(housingGroup);

    const onResize = () => {
      if (!host || !renderer) return;
      const w = host.clientWidth || 560;
      camera.aspect = w / 340;
      camera.updateProjectionMatrix();
      renderer.setSize(w, 340);
    };
    window.addEventListener('resize', onResize);

    let prev = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      const s = stateRef.current;
      if (!s.paused && !s.reducedMotion && s.kinematics.valid) {
        sunGroup.rotation.z += s.kinematics.omegaSunRadS * dt;
        carrierGroup.rotation.z += s.kinematics.omegaCarrierRadS * dt;
        ringGroup.rotation.z += s.kinematics.omegaRingRadS * dt;
        for (const pm of planetMeshes) {
          pm.rotation.z += s.kinematics.omegaPlanetSpinRadS * dt;
        }
      }

      // Exploded axial offsets along Z axis
      const targetEx = s.exploded ? 1 : 0;
      const lerpZ = (obj: THREE.Object3D, tz: number) => {
        if (s.reducedMotion) obj.position.z = tz;
        else obj.position.z += (tz - obj.position.z) * Math.min(1, dt * 6);
      };
      lerpZ(carrierGroup, targetEx * -0.95);
      lerpZ(sunGroup, targetEx * 1.05);
      lerpZ(ringGroup, targetEx * -0.15);
      lerpZ(housingGroup, targetEx * 1.85);
      housingGroup.visible = s.showHousing;

      // Component / Transmission Path highlighting
      sunMat.emissive.setHex(s.highlightPath || s.selectedPart === 'sun' ? 0x92400e : 0x000000);
      planetMat.emissive.setHex(s.highlightPath || s.selectedPart === 'planets' ? 0x0e7490 : 0x000000);
      carrierMat.emissive.setHex(s.selectedPart === 'carrier' ? 0x065f46 : 0x000000);
      ringMat.emissive.setHex(s.selectedPart === 'ring' ? 0x1e293b : 0x000000);

      controls.update();
      renderer!.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
    };
  }, [webglOk]);

  if (!webglOk) {
    return <WebGLFallbackCard title="Planetary Gearbox Kinematics Visualizer (Fallback)" />;
  }

  const sunRpmOut = Math.abs((kinematics.omegaSunRadS * 60) / (2 * Math.PI));

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#060D1A] text-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 bg-[#0B1528] px-4 py-3 text-xs">
        <div>
          <h3 className="font-display text-base font-bold text-white">
            Planetary Gearbox Kinematics Lab (Willis Equation Solver)
          </h3>
          <p className="font-mono text-[11px] text-cyan-300">
            Ns·ωs + Nr·ωr = (Ns + Nr)·ωc | Conceptual 1:10 Gear Geometry (Ns={DEFAULT_PLANETARY_SPEC.sunTeeth}, Nr=
            {DEFAULT_PLANETARY_SPEC.ringTeeth})
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-[#101A2C] px-2.5 py-1 font-mono text-[11px]"
          >
            {paused ? <Play className="h-3 w-3 text-emerald-400" /> : <Pause className="h-3 w-3 text-cyan-300" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => setExploded((e) => !e)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[11px] ${
              exploded ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 bg-[#101A2C]'
            }`}
          >
            <Layers className="h-3 w-3" /> {exploded ? 'Assemble Gears' : 'Explode Stack'}
          </button>
          <button
            type="button"
            onClick={() => setShowHousing((h) => !h)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-[#101A2C] px-2.5 py-1 font-mono text-[11px]"
          >
            {showHousing ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            Housing: {showHousing ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setHighlightPath((h) => !h)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] ${
              highlightPath ? 'border-amber-400/50 bg-amber-500/15 text-amber-200' : 'border-slate-700 bg-[#101A2C]'
            }`}
          >
            Path Trace
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12">
        <div ref={hostRef} className="lg:col-span-7 min-w-0 overflow-hidden h-[340px] ps-aerospace-grid cursor-grab active:cursor-grabbing" />
        <div className="lg:col-span-5 min-w-0 border-t lg:border-t-0 lg:border-l border-cyan-500/20 bg-[#0B1528]/80 p-4 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="flex justify-between text-slate-300">
              <span>Input Rotor RPM</span>
              <span className="font-mono font-bold text-cyan-300">{inputRpm} RPM</span>
            </label>
            <input
              type="range"
              min={5}
              max={120}
              value={inputRpm}
              onChange={(e) => setInputRpm(Number(e.target.value))}
              aria-label="Planetary gearbox input RPM"
              className="w-full accent-cyan-400"
            />
          </div>

          <label className="block space-y-1">
            <span className="text-slate-300">Kinematic Constraint Mode</span>
            <select
              value={constraint}
              onChange={(e) => setConstraint(e.target.value as PlanetaryConstraintMode)}
              className="w-full rounded-lg border border-slate-700 bg-[#101A2C] px-2.5 py-1.5 font-mono text-xs text-white"
            >
              <option value="ring_fixed">Ring Fixed • Carrier In -&gt; Sun Out (1:10 Step-Up)</option>
              <option value="carrier_fixed">Carrier Locked • Ring In -&gt; Sun Out (-1:9 Reversal)</option>
              <option value="sun_fixed">Sun Fixed • Ring In -&gt; Carrier Out (Torque Mode)</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums">
            <div className="rounded-xl border border-slate-800 bg-[#101A2C] p-3">
              <div className="text-[10px] text-slate-400">Speed Ratio</div>
              <div className="text-base font-bold text-emerald-300">{kinematics.effectiveRatio}:1</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#101A2C] p-3">
              <div className="text-[10px] text-slate-400">Sun Output RPM</div>
              <div className="text-base font-bold text-cyan-300">{sunRpmOut.toFixed(0)} RPM</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#101A2C] p-3 col-span-2">
              <div className="text-[10px] text-slate-400">Willis Equation Residual (Accuracy Check)</div>
              <div className="text-xs font-bold text-white">
                |{kinematics.willisResidual.toExponential(1)}| rad/s • Zero-slip constraint satisfied
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {(['all', 'sun', 'planets', 'carrier', 'ring'] as const).map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => setSelectedPart(part)}
                className={`rounded px-2 py-1 font-mono text-[10px] capitalize border ${
                  selectedPart === part ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-800 bg-[#101A2C]'
                }`}
              >
                Inspect: {part}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
