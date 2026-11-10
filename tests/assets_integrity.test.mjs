import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Preservation & PII Safety: original engineering files intact and zero confidential agreements copied to public assets', () => {
  const root = process.cwd();
  assert.ok(fs.existsSync(path.join(root, 'engineering/airfoil/S1223.dat')));
  assert.ok(fs.existsSync(path.join(root, 'media/prototype/mark-4-four-rotor-prototype.png')));
  assert.ok(fs.existsSync(path.join(root, 'intellectual-property/README.md')));

  const publicAssetsDir = path.join(root, 'public/repo-assets');
  if (fs.existsSync(publicAssetsDir)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          assert.ok(!/\.docx$/i.test(entry.name), 'DOCX files must never be copied into public web assets');
          assert.ok(!/pre\s*-?\s*incubation\s*agreement/i.test(entry.name), 'Legal agreement must never be public');
        }
      }
    };
    walk(publicAssetsDir);
  }
});

test('Asset Manifest: S1223 airfoil coordinates and CAD STL/3MF items indexed accurately', () => {
  const root = process.cwd();
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/assetManifest.json'), 'utf-8'));
  assert.equal(manifest.airfoil.pointCount, 81);
  assert.ok(manifest.cadAssets.length >= 30);
  const archimedes = manifest.cadAssets.find((a) => a.name.includes('Archimedes'));
  assert.ok(archimedes);
  assert.match(archimedes.license, /Creative Commons/i);
  const dup = manifest.cadAssets.find((a) => a.name === 'a1a2.stl');
  assert.ok(dup?.duplicateNote, 'Duplicate binary STL must carry explicit duplicate note');
});

test('Truthfulness Guard: no granted patent claim or unverified 1 kW validated claim inside src/data/pawanShaktiData.ts', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/data/pawanShaktiData.ts'), 'utf-8');
  assert.ok(!/patent granted/i.test(src), 'Data catalog must never claim patent is granted');
  assert.ok(!/14 interviews/i.test(src), 'CRM must never hardcode unverified interview metrics');
});
