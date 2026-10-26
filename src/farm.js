// Farmland for Veidheim and its fields: plots of crops in rows on ploughed soil, with wooden rail
// fences round them (a gap for the gate). The fences are real meshes (posts and two rails), all of a
// map's merged into one, and solid: each side is a thin box the hero walks round.
// A plot: { x0, z0, x1, z1, crop: 'wheat' | 'cabbage' | 'pumpkin', gate: 'n' | 's' | 'e' | 'w' }
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const SOIL = ['#7a5a3a', '#94704a']; // a furrow, and the ridge between two
const POST = 1.6;  // paces between posts
const GAP = 1.6;   // half the gate's width

// is (x, z) on a plot's soil, and on which: 0 = furrow, 1 = ridge (rows run east-west, one a pace)
export function soilAt(plots, x, z) {
  for (const p of plots) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) return (z - p.z0) % 1 < 0.5 ? 0 : 1;
  return -1;
}

// the crops of a plot: where each plant stands, a row each pace, a plant every `step` along it
export function cropSpots(p, rng) {
  const step = p.crop === 'pumpkin' ? 1.3 : 0.8, out = [];
  for (let z = p.z0 + 0.75; z < p.z1 - 0.3; z += 1) for (let x = p.x0 + 0.6; x < p.x1 - 0.4; x += step) out.push([x + (rng() - 0.5) * 0.15, z + (rng() - 0.5) * 0.1]);
  return out;
}

// one merged mesh of every plot's fence; addBox(x0, z0, x1, z1) for each solid side
export function fences(plots, heightAt, addBox, wood = '#8a5a33') {
  const geos = [];
  const box = (w, h, d, x, y, z, rotY = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rotY) g.rotateY(rotY);
    g.translate(x, y, z);
    geos.push(g);
  };
  // a run of fence from a to b, straight along x or z
  const run = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.3) return;
    const n = Math.max(1, Math.round(len / POST)), along = bx !== ax;
    for (let i = 0; i <= n; i++) {
      const x = ax + ((bx - ax) * i) / n, z = az + ((bz - az) * i) / n;
      box(0.13, 0.95, 0.13, x, heightAt(x, z) + 0.45, z);
    }
    for (let i = 0; i < n; i++) {
      const xa = ax + ((bx - ax) * i) / n, za = az + ((bz - az) * i) / n, xb = ax + ((bx - ax) * (i + 1)) / n, zb = az + ((bz - az) * (i + 1)) / n;
      const y = (heightAt(xa, za) + heightAt(xb, zb)) / 2, l = len / n;
      for (const h of [0.4, 0.75]) box(l, 0.08, 0.06, (xa + xb) / 2, y + h, (za + zb) / 2, along ? 0 : Math.PI / 2);
    }
    const t = 0.08;
    addBox(Math.min(ax, bx) - t, Math.min(az, bz) - t, Math.max(ax, bx) + t, Math.max(az, bz) + t);
  };
  for (const p of plots) {
    const { x0, z0, x1, z1, gate = 's' } = p, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    const side = (s, ax, az, bx, bz) => {
      if (s !== gate) return run(ax, az, bx, bz);
      if (ax === bx) { run(ax, az, ax, mz - GAP); run(ax, mz + GAP, bx, bz); } else { run(ax, az, mx - GAP, az); run(mx + GAP, az, bx, bz); }
    };
    side('n', x0, z0, x1, z0); side('s', x0, z1, x1, z1); side('w', x0, z0, x0, z1); side('e', x1, z0, x1, z1);
  }
  if (!geos.length) return null;
  const geo = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: wood }));
}
