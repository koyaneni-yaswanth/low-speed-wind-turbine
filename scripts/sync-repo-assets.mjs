import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_ASSETS_DIR = path.join(ROOT, 'public', 'repo-assets');
const MANIFEST_OUT = path.join(ROOT, 'src', 'generated', 'assetManifest.json');

const PRIVATE_BLOCK_PATTERNS = [
  /pre\s*-?\s*incubation\s*agreement/i,
  /\.docx$/i,
  /z-lib/i,
];

function isSafePublicPath(relPath) {
  return !PRIVATE_BLOCK_PATTERNS.some((rx) => rx.test(relPath));
}

function copyPublicAsset(relSrc) {
  if (!isSafePublicPath(relSrc)) return null;
  const srcAbs = path.join(ROOT, relSrc);
  if (!fs.existsSync(srcAbs)) return null;

  const normalizedRel = relSrc.replace(/\\/g, '/');
  const dstAbs = path.join(PUBLIC_ASSETS_DIR, normalizedRel);
  fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
  fs.copyFileSync(srcAbs, dstAbs);
  const stat = fs.statSync(srcAbs);
  return {
    sourcePath: normalizedRel,
    publicUrl: `/repo-assets/${normalizedRel.split('/').map(encodeURIComponent).join('/')}`,
    bytes: stat.size,
  };
}

function parseBinaryStlInfo(absPath) {
  const buf = fs.readFileSync(absPath);
  const header = buf.subarray(0, 80).toString('ascii').replace(/\0/g, '').trim();
  const isAscii = buf.subarray(0, 5).toString('ascii').toLowerCase() === 'solid' && header.toLowerCase().includes('facet');
  if (!isAscii && buf.length >= 84) {
    const triangles = buf.readUInt32LE(80);
    return { triangles, vertices: triangles * 3, format: 'stl' };
  }
  return { triangles: null, vertices: null, format: 'stl' };
}

function parseS1223Airfoil() {
  const datPath = path.join(ROOT, 'engineering', 'airfoil', 'S1223.dat');
  if (!fs.existsSync(datPath)) return { name: 'S1223', points: [] };
  const lines = fs.readFileSync(datPath, 'utf-8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/).map(Number);
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      points.push({ x: parts[0], y: parts[1] });
    }
  }
  return { name: lines[0] || 'S1223', points };
}

const KNOWN_DUPLICATES = {
  'a1a2.stl': 'Duplicate geometry of Configuration 2.stl (3,692 triangles, 184,684 B)',
  'Untitled.3mf': 'Duplicate geometry of Model-23.3mf (18,493 vertices / 36,970 triangles)',
  'frame_cad_1.3mf': 'Duplicate geometry of frame_cad.3mf (114 vertices / 248 triangles)',
};

const CAD_METADATA = {
  'fan gear.3mf': { architecture: 'Planetary / Multi-Rotor', role: '300 mm rotor impeller with integrated Module 2.5 outer spur teeth', license: 'MIT (Pawan Shakti)' },
  'fan-gear.f3d': { architecture: 'Planetary / Multi-Rotor', role: 'Fusion 360 parametric rotor & integrated spur ring assembly', license: 'MIT (Pawan Shakti)' },
  '30cm_2.5mod_s1223prof_gear.3mf': { architecture: 'Planetary / Multi-Rotor', role: '300 mm Selig S1223 multi-blade rotor with 2.5 module outer gear', license: 'MIT (Pawan Shakti)' },
  '30cm_2.5mod_s1223prof_gear1.3mf': { architecture: 'Planetary / Multi-Rotor', role: 'Partial segment / single rotor print profile export', license: 'MIT (Pawan Shakti)' },
  'ringforferritemagnetsv2.f3d': { architecture: 'Option A (Magnetic Gear)', role: 'Fusion 360 coaxial ferrite magnetic coupling ring v2', license: 'MIT (Pawan Shakti)' },
  'ringforferritemagnetsv2.stl': { architecture: 'Option A (Magnetic Gear)', role: '3D printable coaxial magnetic gear carrier ring', license: 'MIT (Pawan Shakti)' },
  'magnetic gear.3mf': { architecture: 'Option A (Magnetic Gear)', role: 'High-resolution magnetic gear concentric stator/modulator mesh (364,550 triangles computed during audit)', license: 'MIT (Pawan Shakti)' },
  'manet 25cm gear.3mf': { architecture: 'Option A (Magnetic Gear)', role: '25 cm magnetic rotor gear assembly (typo in original filename preserved)', license: 'MIT (Pawan Shakti)' },
  'manet 150cm gear acl.3mf': { architecture: 'Option A (Magnetic Gear)', role: 'Anti-clockwise magnetic gear ring variant (filename preserved)', license: 'MIT (Pawan Shakti)' },
  'Model-2.f3d': { architecture: 'Planetary / Multi-Rotor', role: 'Early chassis and planetary hub Fusion 360 assembly', license: 'MIT (Pawan Shakti)' },
  'Model-2.3mf': { architecture: 'Planetary / Multi-Rotor', role: '3MF export of Model-2 hub housing', license: 'MIT (Pawan Shakti)' },
  'Model-23.f3d': { architecture: 'Planetary / Multi-Rotor', role: 'Updated Fusion 360 multi-rotor housing assembly', license: 'MIT (Pawan Shakti)' },
  'Model-23.3mf': { architecture: 'Planetary / Multi-Rotor', role: '3MF export of Model-23 multi-rotor housing', license: 'MIT (Pawan Shakti)' },
  'back-plate.step': { architecture: 'Structural Chassis', role: 'STEP AP214 neutral exchange mounting backplate', license: 'MIT (Pawan Shakti)' },
  'back plate_1.3mf': { architecture: 'Structural Chassis', role: 'Backplate 3MF printable mock/alignment fixture', license: 'MIT (Pawan Shakti)' },
  'back plate.stl': { architecture: 'Structural Chassis', role: 'Simplified rectangular blank prism (12 triangles)', license: 'MIT (Pawan Shakti)' },
  'frame_cad.stl': { architecture: 'Structural Chassis', role: 'Extrusion / rectangular mounting frame geometry', license: 'MIT (Pawan Shakti)' },
  'frame_cad.3mf': { architecture: 'Structural Chassis', role: '3MF frame geometry export', license: 'MIT (Pawan Shakti)' },
  'generator gear.3mf': { architecture: 'Transmission', role: 'Generator pinion gear interface', license: 'MIT (Pawan Shakti)' },
  'Archimedes Turbine - 939532.zip': { architecture: 'Option B Reference', role: 'Third-party Thingiverse Archimedes spiral reference assembly (by dreyfusduke)', license: 'Creative Commons - Attribution (Third-Party)' },
};

function runSync() {
  fs.mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });

  // Sync media
  const mediaFiles = [];
  const mediaRoot = path.join(ROOT, 'media');
  if (fs.existsSync(mediaRoot)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const rel = path.relative(ROOT, full).replace(/\\/g, '/');
          const synced = copyPublicAsset(rel);
          if (synced) mediaFiles.push(synced);
        }
      }
    };
    walk(mediaRoot);
  }

  // Sync drawings & airfoil & template CSV
  const drawings = [
    copyPublicAsset('engineering/drawings/drawings1.pdf'),
    copyPublicAsset('engineering/drawings/drawings-2.pdf'),
  ].filter(Boolean);

  const airfoilAsset = copyPublicAsset('engineering/airfoil/S1223.dat');
  const airfoilParsed = parseS1223Airfoil();

  const templateCsv = copyPublicAsset('testing/raw-data/sample-sensor-log-template.csv');

  // Sync CAD STL & 3MF for interactive 3D viewer, and catalog .f3d/.step/.zip metadata without exposing executables
  const cadItems = [];
  const cadStlDir = path.join(ROOT, 'engineering', 'cad', 'stl-and-3mf');
  if (fs.existsSync(cadStlDir)) {
    for (const name of fs.readdirSync(cadStlDir).sort()) {
      const abs = path.join(cadStlDir, name);
      if (!fs.statSync(abs).isFile()) continue;
      const ext = path.extname(name).toLowerCase();
      const rel = `engineering/cad/stl-and-3mf/${name}`;
      const stat = fs.statSync(abs);
      const meta = CAD_METADATA[name] || {
        architecture: 'Experimental / Unlabeled Mesh',
        role: 'Original CAD export preserved from repository; awaits human label tagging in Admin Console.',
        license: 'MIT (Pawan Shakti)',
      };
      const viewerSupported = ext === '.stl' || ext === '.3mf';
      const synced = viewerSupported ? copyPublicAsset(rel) : null;
      const stlInfo = ext === '.stl' ? parseBinaryStlInfo(abs) : null;

      cadItems.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        sourcePath: rel,
        publicUrl: synced?.publicUrl || null,
        format: ext.replace('.', ''),
        bytes: stat.size,
        viewerSupported,
        triangles: stlInfo?.triangles ?? null,
        architecture: meta.architecture,
        role: meta.role,
        license: meta.license,
        duplicateNote: KNOWN_DUPLICATES[name] || null,
      });
    }
  }

  // Catalog native .f3d & .step files (metadata only in web app, source preserved in repo)
  const nativeCadDir = path.join(ROOT, 'engineering', 'cad');
  if (fs.existsSync(nativeCadDir)) {
    for (const name of fs.readdirSync(nativeCadDir).sort()) {
      const abs = path.join(nativeCadDir, name);
      if (!fs.statSync(abs).isFile()) continue;
      const ext = path.extname(name).toLowerCase();
      const rel = `engineering/cad/${name}`;
      const stat = fs.statSync(abs);
      const synced = ext === '.step' ? copyPublicAsset(rel) : null;
      const meta = CAD_METADATA[name] || {
        architecture: 'Source Assembly',
        role: 'Native CAD source model preserved in repository.',
        license: 'MIT (Pawan Shakti)',
      };
      cadItems.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        sourcePath: rel,
        publicUrl: synced?.publicUrl || null,
        format: ext.replace('.', ''),
        bytes: stat.size,
        viewerSupported: false,
        triangles: null,
        architecture: meta.architecture,
        role: meta.role,
        license: meta.license,
        duplicateNote: null,
      });
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    media: mediaFiles,
    drawings,
    airfoil: {
      file: airfoilAsset,
      profileName: airfoilParsed.name,
      pointCount: airfoilParsed.points.length,
      points: airfoilParsed.points,
    },
    templateCsv,
    cadAssets: cadItems,
  };

  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(
    `[sync-repo-assets] Synced ${mediaFiles.length} media, ${drawings.length} drawings, ${airfoilParsed.points.length} airfoil pts, ${cadItems.length} CAD entries.`
  );
}

runSync();
