import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  Video,
  Wind,
} from 'lucide-react';
import { useAnimationContext } from '../animation/animationContext.ts';
import { WebGLFallbackCard } from '../animation/AnimationBoundary.tsx';
import { isWebGLAvailable } from '../../lib/animation/webglSupport.ts';
import { TURBINE_COMPONENTS, type ComponentId } from '../../lib/animation/turbineComponents.ts';
import {
  SELECTABLE_WIND_SPEEDS,
  computeSimulatedTurbineOutput,
  stepSmoothVelocity,
  type AirflowMode,
} from '../../lib/animation/turbinePhysics.ts';
import { handleSimulationKeydown } from '../../lib/animation/accessibility.ts';

interface TurbineSceneProps {
  mode: 'hero' | 'lab';
  scrollProgress?: number;
}

export const TurbineScene: React.FC<TurbineSceneProps> = ({ mode, scrollProgress = 0 }) => {
  const { qualityConfig, reducedMotion, preset, setPreset } = useAnimationContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  const [webglSupported] = useState(() => isWebGLAvailable());
  const [windSpeedMs, setWindSpeedMs] = useState<number>(5);
  const [windDirectionDeg, setWindDirectionDeg] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const [exploded, setExploded] = useState<boolean>(false);
  const [blueprintMode, setBlueprintMode] = useState<boolean>(false);
  const [xrayNacelle, setXrayNacelle] = useState<boolean>(false);
  const [showBlades, setShowBlades] = useState<boolean>(true);
  const [showAirflow, setShowAirflow] = useState<boolean>(true);
  const [showGenerator, setShowGenerator] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [airflowMode, setAirflowMode] = useState<AirflowMode>('particles');
  const [selectedId, setSelectedId] = useState<ComponentId | null>(null);
  const [pulledOutIds, setPulledOutIds] = useState<Record<string, boolean>>({});
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [recordingStatus, setRecordingStatus] = useState<string>('');

  const simOutput = useMemo(
    () => computeSimulatedTurbineOutput({ windSpeedMs, sweptAreaM2: 1.0, gearRatio: 10 }),
    [windSpeedMs]
  );

  // Mutable animation refs read cleanly by rAF without React re-renders
  const stateRef = useRef({
    windSpeedMs,
    windDirectionDeg,
    paused,
    reducedMotion,
    exploded,
    blueprintMode,
    xrayNacelle,
    showBlades,
    showAirflow,
    showGenerator,
    airflowMode,
    selectedId,
    pulledOutIds,
    hiddenIds,
    scrollProgress,
    targetRotorOmega: 0,
    currentRotorOmega: 0,
    rotorAngle: 0,
    pointerX: 0,
    pointerY: 0,
    entranceTimer: 0,
  });

  useEffect(() => {
    stateRef.current.windSpeedMs = windSpeedMs;
    stateRef.current.windDirectionDeg = windDirectionDeg;
    stateRef.current.paused = paused;
    stateRef.current.reducedMotion = reducedMotion;
    stateRef.current.exploded = exploded;
    stateRef.current.blueprintMode = blueprintMode;
    stateRef.current.xrayNacelle = xrayNacelle;
    stateRef.current.showBlades = showBlades;
    stateRef.current.showAirflow = showAirflow;
    stateRef.current.showGenerator = showGenerator;
    stateRef.current.airflowMode = airflowMode;
    stateRef.current.selectedId = selectedId;
    stateRef.current.pulledOutIds = pulledOutIds;
    stateRef.current.hiddenIds = hiddenIds;
    stateRef.current.scrollProgress = scrollProgress;
    stateRef.current.targetRotorOmega = (simOutput.rotorRpm * 2 * Math.PI) / 60;
  }, [
    windSpeedMs,
    windDirectionDeg,
    paused,
    reducedMotion,
    exploded,
    blueprintMode,
    xrayNacelle,
    showBlades,
    showAirflow,
    showGenerator,
    airflowMode,
    selectedId,
    pulledOutIds,
    hiddenIds,
    scrollProgress,
    simOutput.rotorRpm,
  ]);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const resetCamera = useCallback(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    cam.position.set(mode === 'hero' ? 4.4 : 4.9, 3.0, 5.2);
    ctrl.target.set(0, 1.85, 0);
    ctrl.update();
  }, [mode]);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Presentation mode automatic sequence
  useEffect(() => {
    if (!presentationMode || reducedMotion) return;
    let step = 0;
    const id = window.setInterval(() => {
      step = (step + 1) % 4;
      if (step === 0) {
        setExploded(false);
        setXrayNacelle(false);
        setSelectedId(null);
        setWindSpeedMs(5);
      } else if (step === 1) {
        setWindSpeedMs(8);
        setAirflowMode('streamlines');
      } else if (step === 2) {
        setExploded(true);
        setXrayNacelle(true);
        setSelectedId('gearbox');
      } else {
        setExploded(false);
        setSelectedId('generator');
        setAirflowMode('particles');
      }
    }, 3600);
    return () => window.clearInterval(id);
  }, [presentationMode, reducedMotion]);

  // Accessible Keyboard Controls (Space, R, E, B, F, Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) =>
      handleSimulationKeydown(e, {
        onTogglePause: () => setPaused((p) => !p),
        onResetCamera: resetCamera,
        onToggleExploded: () => setExploded((v) => !v),
        onToggleBlueprint: () => setBlueprintMode((b) => !b),
        onToggleFullscreen: toggleFullscreen,
        onEscape: () => {
          setPresentationMode(false);
          setSelectedId(null);
        },
      });
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resetCamera, toggleFullscreen]);

  // Optional 5-second WebM Canvas Recording (explicitly disabled if unsupported)
  const canRecordVideo =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function';

  const handleRecordClip = () => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas || !canRecordVideo) {
      setRecordingStatus('Canvas recording unavailable in this browser environment.');
      return;
    }
    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pawan-shakti-simulation-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecordingStatus('Saved 4s WebM simulation recording.');
      };
      recorder.start();
      setRecordingStatus('Recording 4s simulation clip...');
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 4000);
    } catch {
      setRecordingStatus('Browser denied WebM recording codec.');
    }
  };

  useEffect(() => {
    if (!webglSupported) return;
    const host = canvasHostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityConfig.maxPixelRatio));
      renderer.setSize(host.clientWidth || 720, host.clientHeight || 460);
      renderer.domElement.style.maxWidth = '100%';
      renderer.domElement.style.display = 'block';
      renderer.shadowMap.enabled = qualityConfig.shadowsEnabled;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.innerHTML = '';
      host.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060d1a, 0.055);

    const w = host.clientWidth || 720;
    const h = host.clientHeight || 460;
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(mode === 'hero' ? 6.2 : 5.1, 3.3, 6.4);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.4;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.target.set(0, 1.85, 0);
    controlsRef.current = controls;

    // Cinematic Midnight Lighting + Light Sweep Spot
    const ambient = new THREE.AmbientLight(0x94a3b8, 0.85);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = qualityConfig.shadowsEnabled;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const rimCyan = new THREE.DirectionalLight(0x22d3ee, 1.6);
    rimCyan.position.set(-5, 4, -4);
    scene.add(rimCyan);

    const sweepLight = new THREE.SpotLight(0x34d399, 18, 22, Math.PI / 5, 0.6);
    sweepLight.position.set(-5, 5, 3);
    scene.add(sweepLight);

    // Subtle Engineering Reference Grid + Base Pedestal
    const grid = new THREE.GridHelper(18, 24, 0x22d3ee, 0x1e293b);
    grid.position.y = -0.02;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    scene.add(grid);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const metalDark = track(
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.78, roughness: 0.28 })
    );
    const metalBright = track(
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.86, roughness: 0.22 })
    );
    const bladeMat = track(
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.3, roughness: 0.35 })
    );
    const copperCoilMat = track(
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
    );
    const gearCyanMat = track(
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.72, roughness: 0.28 })
    );
    const nacelleMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.68,
        roughness: 0.32,
        transparent: true,
        opacity: 0.96,
      })
    );
    const electricEmeraldMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        metalness: 0.4,
        roughness: 0.3,
      })
    );
    const guideLineMat = track(
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 })
    );

    const interactiveMeshes: THREE.Object3D[] = [];
    const componentGroups: Record<ComponentId, THREE.Group> = {
      blades: new THREE.Group(),
      hub: new THREE.Group(),
      mount: new THREE.Group(),
      shaft: new THREE.Group(),
      bearings: new THREE.Group(),
      gearbox: new THREE.Group(),
      generator: new THREE.Group(),
      nacelle: new THREE.Group(),
      tower: new THREE.Group(),
      electrical: new THREE.Group(),
    };

    // Yaw Root Group rotated by windDirectionDeg
    const yawGroup = new THREE.Group();
    scene.add(yawGroup);

    const segs = qualityConfig.geometrySegments;

    // 1. Tower
    const towerMesh = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.17, 2.1, segs)), metalDark);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    towerMesh.userData.componentId = 'tower';
    componentGroups.tower.add(towerMesh);
    const baseFlange = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.46, 0.1, segs)), metalBright);
    baseFlange.position.y = -0.95;
    baseFlange.userData.componentId = 'tower';
    componentGroups.tower.add(baseFlange);

    // Rotating rotor spin sub-group
    const rotorSpinGroup = new THREE.Group();
    componentGroups.blades.add(rotorSpinGroup);

    // Build 3 cambered tapered S1223 conceptual airfoil blades
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, -0.02);
    bladeShape.quadraticCurveTo(0.08, 0.08, 0.22, 0.015);
    bladeShape.quadraticCurveTo(0.09, -0.025, 0, -0.02);
    const bladeGeo = track(
      new THREE.ExtrudeGeometry(bladeShape, {
        depth: 1.48,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.01,
        bevelSegments: 2,
      })
    );

    for (let i = 0; i < 3; i++) {
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (i * 2 * Math.PI) / 3;
      const bMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bMesh.rotation.x = -Math.PI / 2;
      bMesh.rotation.y = 0.22; // pitch angle
      bMesh.position.y = 0.16;
      bMesh.castShadow = true;
      bMesh.userData.componentId = 'blades';
      bladePivot.add(bMesh);
      rotorSpinGroup.add(bladePivot);
    }

    // 2. Hub & Nose Cone
    const hubCone = new THREE.Mesh(track(new THREE.ConeGeometry(0.22, 0.46, segs)), metalBright);
    hubCone.rotation.x = Math.PI / 2;
    hubCone.castShadow = true;
    hubCone.userData.componentId = 'hub';
    componentGroups.hub.add(hubCone);

    // 3. Blade Mounting Spider
    const mountRing = new THREE.Mesh(track(new THREE.CylinderGeometry(0.24, 0.24, 0.12, segs)), gearCyanMat);
    mountRing.rotation.x = Math.PI / 2;
    mountRing.userData.componentId = 'mount';
    componentGroups.mount.add(mountRing);

    // 4. Main Shaft
    const mainShaft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 24)), metalBright);
    mainShaft.rotation.x = Math.PI / 2;
    mainShaft.userData.componentId = 'shaft';
    componentGroups.shaft.add(mainShaft);

    // 5. Bearing Assembly
    for (const zOff of [-0.14, 0.14]) {
      const bearing = new THREE.Mesh(track(new THREE.TorusGeometry(0.11, 0.032, 14, 28)), copperCoilMat);
      bearing.position.z = zOff;
      bearing.userData.componentId = 'bearings';
      componentGroups.bearings.add(bearing);
    }

    // 6. Planetary / Coaxial Gearbox Concept
    const ringGear = new THREE.Mesh(track(new THREE.TorusGeometry(0.24, 0.045, 16, 32)), gearCyanMat);
    ringGear.userData.componentId = 'gearbox';
    componentGroups.gearbox.add(ringGear);
    const sunGear = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16)), copperCoilMat);
    sunGear.rotation.x = Math.PI / 2;
    sunGear.userData.componentId = 'gearbox';
    componentGroups.gearbox.add(sunGear);

    // 7. Generator (Stator + Coreless Rotor)
    const genHousing = new THREE.Mesh(track(new THREE.CylinderGeometry(0.27, 0.27, 0.44, segs)), copperCoilMat);
    genHousing.rotation.x = Math.PI / 2;
    genHousing.userData.componentId = 'generator';
    componentGroups.generator.add(genHousing);

    // 8. Nacelle Shroud
    const nacelleBox = new THREE.Mesh(track(new THREE.BoxGeometry(0.68, 0.64, 1.55)), nacelleMat);
    nacelleBox.castShadow = true;
    nacelleBox.userData.componentId = 'nacelle';
    componentGroups.nacelle.add(nacelleBox);

    // 10. Electrical Bus & Shunt Box
    const busBox = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 0.34, 0.18)), electricEmeraldMat);
    busBox.userData.componentId = 'electrical';
    componentGroups.electrical.add(busBox);

    // Energy Pulse Spheres traveling generator -> electrical load
    const energyPulses: THREE.Mesh[] = [];
    const pulseGeo = track(new THREE.SphereGeometry(0.045, 12, 12));
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(pulseGeo, electricEmeraldMat);
      p.position.set(0.14, 2.0 - i * 0.35, -0.35);
      yawGroup.add(p);
      energyPulses.push(p);
    }

    // Add components & assembly guide lines
    const guideLines: Record<ComponentId, THREE.Line> = {} as Record<ComponentId, THREE.Line>;
    for (const meta of TURBINE_COMPONENTS) {
      const grp = componentGroups[meta.id];
      grp.position.set(...meta.restOrigin);
      yawGroup.add(grp);
      interactiveMeshes.push(grp);

      const lineGeo = track(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...meta.restOrigin),
          new THREE.Vector3(...meta.restOrigin),
        ])
      );
      const guide = new THREE.Line(lineGeo, guideLineMat);
      guide.visible = false;
      yawGroup.add(guide);
      guideLines[meta.id] = guide;
    }

    // 5. Conceptual Airflow Instanced Particles & Streamlines
    const particleCount = qualityConfig.particleCount;
    const pGeo = track(new THREE.BoxGeometry(0.025, 0.025, 0.24));
    const pMat = track(
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 })
    );
    const particleMesh = new THREE.InstancedMesh(pGeo, pMat, particleCount);
    const airflowGroup = new THREE.Group();
    airflowGroup.add(particleMesh);
    scene.add(airflowGroup);

    const pStates = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 6.5,
      y: 0.4 + Math.random() * 3.8,
      z: (Math.random() - 0.5) * 10,
    }));
    const dummy = new THREE.Object3D();

    // Streamlines
    const streamlinesGroup = new THREE.Group();
    for (let s = 0; s < qualityConfig.streamlineCount; s++) {
      const angle = (s / qualityConfig.streamlineCount) * Math.PI * 2;
      const rad = 0.55 + (s % 3) * 0.48;
      const pts: THREE.Vector3[] = [];
      for (let z = 4.5; z >= -4.5; z -= 0.45) {
        const wakeExpand = z < 1.2 ? 1 + (1.2 - z) * 0.05 : 1;
        const swirl = z < 1.2 ? 0.12 * Math.sin(z * 0.8 + s) : 0;
        pts.push(
          new THREE.Vector3(
            Math.cos(angle + swirl) * rad * wakeExpand,
            2.2 + Math.sin(angle + swirl) * rad * wakeExpand,
            z
          )
        );
      }
      const sGeo = track(new THREE.BufferGeometry().setFromPoints(pts));
      const sMat = track(new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.42 }));
      streamlinesGroup.add(new THREE.Line(sGeo, sMat));
    }
    airflowGroup.add(streamlinesGroup);

    // Raycaster & Mouse Parallax
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerMove = (ev: PointerEvent) => {
      const rect = renderer!.domElement.getBoundingClientRect();
      stateRef.current.pointerX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      stateRef.current.pointerY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onCanvasClick = (ev: MouseEvent) => {
      const rect = renderer!.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData.componentId) obj = obj.parent;
        if (obj?.userData.componentId) {
          setSelectedId(obj.userData.componentId as ComponentId);
        }
      }
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onCanvasClick);

    const onResize = () => {
      if (!host || !renderer) return;
      const nw = host.clientWidth || 720;
      const nh = host.clientHeight || 460;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // Animation Frame Loop (Zero React setState inside rAF!)
    let prevTime = performance.now();
    let frameId = 0;

    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - prevTime) / 1000);
      prevTime = now;

      const s = stateRef.current;

      // Smooth camera entrance on hero load
      if (!s.reducedMotion && s.entranceTimer < 1) {
        s.entranceTimer = Math.min(1, s.entranceTimer + dt * 0.45);
        sweepLight.position.x = -5 + s.entranceTimer * 10;
        if (mode === 'hero' && s.entranceTimer < 0.99) {
          camera.position.lerp(new THREE.Vector3(4.4, 3.0, 5.2), dt * 2.1);
        }
      }

      // Smooth yaw tracking of incoming wind azimuth
      const targetYaw = THREE.MathUtils.degToRad(s.windDirectionDeg);
      yawGroup.rotation.y += (targetYaw - yawGroup.rotation.y) * Math.min(1, dt * 4);
      airflowGroup.rotation.y = yawGroup.rotation.y;

      // Rotor & Shaft Angular Integration
      if (!s.paused && !s.reducedMotion) {
        s.currentRotorOmega = stepSmoothVelocity(s.currentRotorOmega, s.targetRotorOmega, dt, 0.75);
        s.rotorAngle = (s.rotorAngle + s.currentRotorOmega * dt) % (Math.PI * 2);
      } else if (s.reducedMotion) {
        s.currentRotorOmega = 0;
      }

      rotorSpinGroup.rotation.z = -s.rotorAngle;
      mainShaft.rotation.y = s.rotorAngle;
      ringGear.rotation.z = s.rotorAngle * 1.4;
      sunGear.rotation.y = s.rotorAngle * 10;

      // Blueprint, X-Ray, Visibility
      const allMats = [metalDark, metalBright, bladeMat, copperCoilMat, gearCyanMat, nacelleMat, electricEmeraldMat];
      for (const m of allMats) {
        m.wireframe = s.blueprintMode;
      }
      nacelleMat.opacity = s.xrayNacelle ? 0.24 : 0.96;

      componentGroups.blades.visible = s.showBlades && !s.hiddenIds.blades;
      componentGroups.generator.visible = s.showGenerator && !s.hiddenIds.generator;
      for (const meta of TURBINE_COMPONENTS) {
        if (meta.id !== 'blades' && meta.id !== 'generator') {
          componentGroups[meta.id].visible = !s.hiddenIds[meta.id];
        }
      }

      // Exploded View & Individual Component Outward Animation
      for (const meta of TURBINE_COMPONENTS) {
        const isOut = s.exploded || Boolean(s.pulledOutIds[meta.id]);
        const targetPos = new THREE.Vector3(
          meta.restOrigin[0] + (isOut ? meta.explodeOffset[0] : 0),
          meta.restOrigin[1] + (isOut ? meta.explodeOffset[1] : 0),
          meta.restOrigin[2] + (isOut ? meta.explodeOffset[2] : 0)
        );
        const grp = componentGroups[meta.id];
        if (s.reducedMotion) {
          grp.position.copy(targetPos);
        } else {
          grp.position.lerp(targetPos, Math.min(1, dt * 6));
        }

        const guide = guideLines[meta.id];
        guide.visible = grp.position.distanceTo(new THREE.Vector3(...meta.restOrigin)) > 0.05;
        if (guide.visible) {
          const posAttr = guide.geometry.getAttribute('position') as THREE.BufferAttribute;
          posAttr.setXYZ(0, meta.restOrigin[0], meta.restOrigin[1], meta.restOrigin[2]);
          posAttr.setXYZ(1, grp.position.x, grp.position.y, grp.position.z);
          posAttr.needsUpdate = true;
        }
      }

      // Airflow Particles & Streamlines
      airflowGroup.visible = s.showAirflow;
      particleMesh.visible = s.showAirflow && (s.airflowMode === 'particles' || s.airflowMode === 'technical');
      streamlinesGroup.visible =
        s.showAirflow &&
        (s.airflowMode === 'streamlines' || s.airflowMode === 'technical' || s.airflowMode === 'simplified');

      if (particleMesh.visible && !s.paused && !s.reducedMotion) {
        const speedScale = 0.7 + s.windSpeedMs * 0.55;
        for (let i = 0; i < particleCount; i++) {
          const ps = pStates[i];
          ps.z -= speedScale * dt;
          if (ps.z < -5) ps.z = 5;
          // Radial slight wake scatter near rotor disk (z around 1.2)
          const nearRotor = Math.abs(ps.z - 1.2) < 1.1;
          const radialDist = Math.hypot(ps.x, ps.y - 2.2);
          const deflect = nearRotor && radialDist < 1.6 ? 0.16 : 0;
          dummy.position.set(ps.x * (1 + deflect), ps.y + (ps.y - 2.2) * deflect * 0.4, ps.z);
          dummy.scale.set(1, 1, 0.6 + s.windSpeedMs * 0.12);
          dummy.updateMatrix();
          particleMesh.setMatrixAt(i, dummy.matrix);
        }
        particleMesh.instanceMatrix.needsUpdate = true;
      }

      // Electrical Energy Pulse Stream traveling generator -> load box
      const activeFlow = s.windSpeedMs >= 2.2 && !s.paused && !s.reducedMotion;
      energyPulses.forEach((p, idx) => {
        p.visible = s.windSpeedMs >= 2.2;
        if (activeFlow) {
          const phase = ((now * 0.0012 * (0.4 + s.windSpeedMs * 0.15) + idx / 6) % 1);
          p.position.y = 2.05 - phase * 1.45;
          p.position.x = 0.15;
          p.position.z = -0.35;
        }
      });

      // Subtle mouse parallax & scroll offset without hijacking orbit controls
      if (mode === 'hero' && !s.reducedMotion) {
        controls.target.y = 1.85 - s.scrollProgress * 0.25 + s.pointerY * 0.08;
        controls.target.x = s.pointerX * 0.12;
      }

      controls.update();
      renderer!.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer?.domElement.removeEventListener('pointermove', onPointerMove);
      renderer?.domElement.removeEventListener('click', onCanvasClick);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
    };
  }, [webglSupported, mode, qualityConfig]);

  if (!webglSupported) {
    return (
      <WebGLFallbackCard
        title="Pawan Shakti 3D Wind Engineering Lab (Fallback Mode)"
        reason="Hardware WebGL is unavailable in this browser. Showing authentic Mark-4 prototype rig."
      />
    );
  }

  const selectedMeta = TURBINE_COMPONENTS.find((c) => c.id === selectedId) || null;

  return (
    <div
      ref={wrapperRef}
      className={`relative rounded-2xl border border-cyan-500/25 bg-[#060D1A] text-white overflow-hidden shadow-2xl ${
        isFullscreen ? 'p-4' : ''
      }`}
    >
      {/* Engineering Viewport Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 bg-[#0B1528]/90 px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-cyan-300">
            <Wind className="h-3.5 w-3.5" /> Interactive 3D Turbine Concept
          </span>
          <span className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-200">
            Conceptual airflow visualization — not CFD simulation
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Resume simulation' : 'Pause simulation'}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-[#101A2C] px-2.5 py-1 font-mono text-[11px] hover:border-cyan-400"
          >
            {paused ? <Play className="h-3 w-3 text-emerald-400" /> : <Pause className="h-3 w-3 text-cyan-300" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => {
              resetCamera();
              setWindSpeedMs(5);
              setWindDirectionDeg(0);
              setExploded(false);
              setPulledOutIds({});
              setHiddenIds({});
              setBlueprintMode(false);
              setXrayNacelle(false);
              setShowBlades(true);
              setShowAirflow(true);
              setShowGenerator(true);
            }}
            aria-label="Reset turbine simulation"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-[#101A2C] px-2.5 py-1 font-mono text-[11px] hover:border-cyan-400"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            type="button"
            onClick={() => setExploded((e) => !e)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] ${
              exploded ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 bg-[#101A2C]'
            }`}
          >
            {exploded ? 'Assemble All' : 'Explode All'}
          </button>
          <button
            type="button"
            onClick={() => setXrayNacelle((x) => !x)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] ${
              xrayNacelle ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-slate-700 bg-[#101A2C]'
            }`}
          >
            X-Ray Nacelle
          </button>
          <button
            type="button"
            onClick={() => setBlueprintMode((b) => !b)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] ${
              blueprintMode ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 bg-[#101A2C]'
            }`}
          >
            Blueprint
          </button>
          <button
            type="button"
            onClick={() => setPresentationMode((m) => !m)}
            title="Presentation Mode"
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[11px] ${
              presentationMode ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-slate-700 bg-[#101A2C]'
            }`}
          >
            <Presentation className="h-3 w-3" /> Tour
          </button>
          {canRecordVideo && (
            <button
              type="button"
              onClick={handleRecordClip}
              title="Record 4s WebM clip"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-[#101A2C] px-2 py-1 font-mono text-[11px] hover:border-cyan-400"
            >
              <Video className="h-3 w-3" /> Rec
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen 3D viewer' : 'Enter fullscreen 3D viewer'}
            className="rounded-lg border border-slate-700 bg-[#101A2C] p-1 hover:border-cyan-400"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Stage */}
      <div className="relative overflow-hidden ps-aerospace-grid">
        <div
          ref={canvasHostRef}
          className={`w-full overflow-hidden cursor-grab active:cursor-grabbing ${
            isFullscreen ? 'h-[64vh]' : mode === 'hero' ? 'h-[370px] sm:h-[430px]' : 'h-[400px] sm:h-[460px]'
          }`}
        />

        {/* HUD Top-Left Live Simulation Metrics Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 sm:right-auto flex flex-col gap-1.5 rounded-xl border border-cyan-500/25 bg-[#060D1A]/85 p-3 backdrop-blur-md text-[11px]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
            Simulation Mode — No live hardware data connected
          </div>
          <div className="grid grid-cols-3 gap-3 font-mono tabular-nums">
            <div>
              <div className="text-slate-400">Wind</div>
              <div className="font-bold text-cyan-300">{windSpeedMs} m/s</div>
            </div>
            <div>
              <div className="text-slate-400">Rotor Est.</div>
              <div className="font-bold text-white">{simOutput.rotorRpm} RPM</div>
            </div>
            <div>
              <div className="text-slate-400">Elec Est. (~1m²)</div>
              <div className="font-bold text-emerald-300">{simOutput.simulatedElectricalPowerW} W</div>
            </div>
          </div>
          {recordingStatus && <div className="font-mono text-[10px] text-cyan-300">{recordingStatus}</div>}
        </div>

        {/* Component Hotspots Legend / Selected Inspector */}
        {showLabels && selectedMeta && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:w-80 rounded-xl border border-cyan-400/40 bg-[#0B1528]/95 p-3.5 backdrop-blur-md text-xs space-y-2 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-[10px] uppercase text-cyan-300">Selected Assembly Part</div>
                <div className="font-display font-bold text-white">{selectedMeta.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                Close
              </button>
            </div>
            <p className="text-[11px] text-slate-300">{selectedMeta.purpose}</p>
            <p className="font-mono text-[10px] text-amber-200">{selectedMeta.specStatus}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  setPulledOutIds((prev) => ({ ...prev, [selectedMeta.id]: !prev[selectedMeta.id] }))
                }
                className="rounded bg-cyan-500/20 border border-cyan-400/40 px-2 py-1 font-mono text-[10px] text-cyan-200"
              >
                {pulledOutIds[selectedMeta.id] ? 'Return to Assembly' : 'Animate Part Outward'}
              </button>
              <button
                type="button"
                onClick={() => setHiddenIds((prev) => ({ ...prev, [selectedMeta.id]: !prev[selectedMeta.id] }))}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#101A2C] px-2 py-1 font-mono text-[10px]"
              >
                {hiddenIds[selectedMeta.id] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {hiddenIds[selectedMeta.id] ? 'Show' : 'Hide'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Wind Speed, Airflow, Component Selector & Quality Strip */}
      <div className="border-t border-cyan-500/20 bg-[#0B1528] p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Wind speed selector">
            <span className="font-mono text-[11px] text-slate-400 mr-1">Wind Speed:</span>
            {SELECTABLE_WIND_SPEEDS.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setWindSpeedMs(spd)}
                className={`rounded-md px-2 py-1 font-mono text-[11px] transition ${
                  windSpeedMs === spd
                    ? 'bg-cyan-400 text-[#060D1A] font-bold'
                    : 'border border-slate-700 bg-[#101A2C] text-slate-200 hover:border-cyan-400/60'
                }`}
              >
                {spd} m/s
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span>Yaw Dir:</span>
              <input
                type="range"
                min={0}
                max={315}
                step={45}
                value={windDirectionDeg}
                onChange={(e) => setWindDirectionDeg(Number(e.target.value))}
                aria-label="Wind direction degrees"
                className="w-20 accent-cyan-400"
              />
              <span className="font-mono w-8">{windDirectionDeg}°</span>
            </label>
            <select
              value={airflowMode}
              onChange={(e) => setAirflowMode(e.target.value as AirflowMode)}
              aria-label="Airflow visualization mode"
              className="rounded-lg border border-slate-700 bg-[#101A2C] px-2 py-1 font-mono text-[11px] text-slate-200"
            >
              <option value="particles">Flow: Particles</option>
              <option value="streamlines">Flow: Streamlines</option>
              <option value="technical">Flow: Technical Dual</option>
              <option value="simplified">Flow: Simplified</option>
            </select>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as typeof preset)}
              aria-label="3D animation quality preset"
              className="rounded-lg border border-slate-700 bg-[#101A2C] px-2 py-1 font-mono text-[11px] text-slate-200"
            >
              <option value="high">Quality: High</option>
              <option value="balanced">Quality: Balanced</option>
              <option value="low">Quality: Low Power</option>
            </select>
          </div>
        </div>

        {/* Toggle Visibility & Selectable 10 Exploded Parts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
          {[
            { label: 'Blades', active: showBlades, toggle: () => setShowBlades((v) => !v) },
            { label: 'Airflow', active: showAirflow, toggle: () => setShowAirflow((v) => !v) },
            { label: 'Generator', active: showGenerator, toggle: () => setShowGenerator((v) => !v) },
            { label: 'Labels', active: showLabels, toggle: () => setShowLabels((v) => !v) },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={t.toggle}
              className={`rounded-md px-2 py-0.5 font-mono text-[10px] border ${
                t.active ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200' : 'border-slate-700 text-slate-400'
              }`}
            >
              {t.label}: {t.active ? 'ON' : 'OFF'}
            </button>
          ))}
          <span className="mx-1 text-slate-600">|</span>
          {TURBINE_COMPONENTS.map((comp) => (
            <button
              key={comp.id}
              type="button"
              onClick={() => setSelectedId(comp.id)}
              className={`rounded-md px-2 py-0.5 font-mono text-[10px] border transition ${
                selectedId === comp.id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-800 bg-[#101A2C] text-slate-300 hover:border-cyan-500/40'
              }`}
            >
              {comp.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
