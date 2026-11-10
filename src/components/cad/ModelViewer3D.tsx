import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import type { CadAssetItem } from '../../types/index.ts';

interface Props {
  asset: CadAssetItem;
}

export const ModelViewer3D: React.FC<Props> = ({ asset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'unsupported'>(() =>
    asset.viewerSupported && asset.publicUrl ? 'loading' : 'unsupported'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [dimensionsMm, setDimensionsMm] = useState<string>('');
  const materialRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const wireframeRef = useRef(wireframe);

  useEffect(() => {
    wireframeRef.current = wireframe;
    materialRefs.current.forEach((mat) => {
      mat.wireframe = wireframe;
      mat.needsUpdate = true;
    });
  }, [wireframe]);

  useEffect(() => {
    if (!asset.viewerSupported || !asset.publicUrl) {
      queueMicrotask(() => setStatus('unsupported'));
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    queueMicrotask(() => {
      setStatus('loading');
      setErrorMsg('');
      setDimensionsMm('');
    });

    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let mounted = true;
    const width = container.clientWidth || 560;
    const height = 340;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch {
      queueMicrotask(() => {
        setStatus('error');
        setErrorMsg('WebGL context unavailable in this browser environment. You can still download the CAD file directly.');
      });
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F0F3EE');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(140, 110, 140);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x3b4a44, 1.3);
    scene.add(hemi);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir1.position.set(120, 200, 150);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xd1fae5, 0.5);
    dir2.position.set(-140, -80, -120);
    scene.add(dir2);

    const grid = new THREE.GridHelper(300, 15, 0x0b2b22, 0xcfd6cf);
    scene.add(grid);

    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b2b22,
      metalness: 0.25,
      roughness: 0.45,
      wireframe: wireframeRef.current,
    });
    materialRefs.current = [defaultMaterial];

    const centerObject = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z, 1);
      const scale = 120 / maxDim;
      obj.scale.multiplyScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(obj);
      const scaledCenter = new THREE.Vector3();
      scaledBox.getCenter(scaledCenter);
      obj.position.sub(scaledCenter);

      setDimensionsMm(`${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} model units`);
      camera.position.set(135, 95, 135);
      controls.target.set(0, 0, 0);
      controls.update();
    };

    const loadModel = async () => {
      try {
        if (asset.format === 'stl') {
          const loader = new STLLoader();
          const geometry = await loader.loadAsync(asset.publicUrl!);
          if (!mounted) return;
          geometry.computeVertexNormals();
          const mesh = new THREE.Mesh(geometry, defaultMaterial);
          scene.add(mesh);
          centerObject(mesh);
          setStatus('ready');
        } else if (asset.format === '3mf') {
          const loader = new ThreeMFLoader();
          const group = await loader.loadAsync(asset.publicUrl!);
          if (!mounted) return;
          const mats: THREE.MeshStandardMaterial[] = [];
          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const m = defaultMaterial.clone();
              mats.push(m);
              mesh.material = m;
            }
          });
          if (mats.length > 0) materialRefs.current = mats;
          scene.add(group);
          centerObject(group);
          setStatus('ready');
        }
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Unable to parse 3D mesh in browser.');
      }
    };

    loadModel();

    const animate = () => {
      if (!mounted || !renderer) return;
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 560;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      mounted = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer?.dispose();
    };
  }, [asset.id, asset.format, asset.publicUrl, asset.viewerSupported]);

  return (
    <div className="rounded-xl border border-[#DDE2DC] bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE2DC] bg-[#F6F7F4] px-4 py-2.5 text-xs">
        <div>
          <span className="font-mono font-semibold text-[#141A18]">{asset.name}</span>
          {dimensionsMm && <span className="ml-2 font-mono text-[11px] text-[#434E4A]">({dimensionsMm})</span>}
        </div>
        <div className="flex items-center gap-2">
          {asset.viewerSupported && (
            <button
              type="button"
              onClick={() => setWireframe(!wireframe)}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                wireframe ? 'border-[#0B2B22] bg-[#0B2B22] text-white' : 'border-[#DDE2DC] bg-white text-[#141A18]'
              }`}
            >
              {wireframe ? 'Solid Mesh' : 'Wireframe'}
            </button>
          )}
          {asset.publicUrl && (
            <a
              href={asset.publicUrl}
              download={asset.name}
              className="rounded-md border border-[#DDE2DC] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0B2B22] hover:bg-[#EDF0EB]"
            >
              Download .{asset.format}
            </a>
          )}
        </div>
      </div>

      {asset.viewerSupported ? (
        <div className="relative">
          <div ref={containerRef} className="h-[340px] w-full cursor-grab active:cursor-grabbing" />
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F0F3EE]/85 text-xs font-medium text-[#141A18]">
              Loading 3D mesh geometry ({(asset.bytes / 1024).toFixed(1)} KB)...
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F0F3EE] p-4 text-center text-xs text-[#9A3412]">
              {errorMsg}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[240px] flex-col items-center justify-center bg-[#F0F3EE] p-6 text-center">
          <p className="text-sm font-semibold text-[#141A18]">Native CAD / Archive Entry (.{asset.format})</p>
          <p className="mt-1 max-w-md text-xs text-[#434E4A]">
            Fusion 360 `.f3d`, `.step`, and compressed archives require desktop CAD software (Autodesk Fusion / STEP viewer)
            and remain preserved intact at <code>{asset.sourcePath}</code>. Select any <code>.stl</code> or <code>.3mf</code> export
            to inspect it interactively in 3D.
          </p>
        </div>
      )}
    </div>
  );
};
