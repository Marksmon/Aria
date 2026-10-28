// The desert's monuments, real meshes like the cities' buildings (lit by the same sun, so they
// darken at night), with painted canvas textures:
// - the Pyramid in Scorpion Sands: stepped sandstone courses, a gold capstone and a dark doorway
//   on its south face, where the Tomb Guide waits (the fourth raid, raid.js);
// - the Giant Sphinx of Sphinx Sands, about half the map long, after the owner's picture: a lion's
//   body of cracked, weathered sandstone lying down; a tall striped headdress (gold, lapis blue and
//   turquoise) with a cobra on the brow; a calm face looking south; a jewelled collar with a scarab
//   pendant; gold and blue bands round its forelegs; huge clawed paws sunk in the sand. Between its
//   paws, a great door in its chest, sealed for now (the Sphinx's halls are the first dungeon, to come).
// What stands between the camera and the hero fades, like the cities' buildings.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// weathered sandstone: warm blocks, darker cracks and pits, a few pale patches
function sandstoneTex(rng, base = '#d4b07a', blocks = false) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = rng() < 0.5 ? 'rgba(120,80,40,.16)' : 'rgba(255,240,200,.14)';
      g.fillRect(rng() * 128, rng() * 128, 2 + rng() * 6, 2 + rng() * 4);
    }
    g.strokeStyle = 'rgba(90,60,30,.55)'; g.lineWidth = 1.5;
    if (blocks) for (let y = 0; y < 128; y += 16) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke();
      for (let x = (y / 16) % 2 ? 0 : 20; x < 128; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); }
    }
    for (let i = 0; i < 9; i++) { // cracks
      let x = rng() * 128, y = rng() * 128;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (rng() - 0.5) * 22; y += rng() * 14; g.lineTo(x, y); }
      g.strokeStyle = 'rgba(80,50,25,.6)'; g.lineWidth = 1 + rng(); g.stroke();
    }
  });
}
// stripes: [colour, share]; the band runs round (horizontal) or down (vertical)
function bandTex(cols, vertical = false, trim = null) {
  return canvasTex(64, 64, (g) => {
    let at = 0;
    for (const [c, s] of cols) {
      g.fillStyle = c;
      if (vertical) g.fillRect(0, at * 64, 64, s * 64 + 1); else g.fillRect(at * 64, 0, s * 64 + 1, 64);
      at += s;
    }
    if (trim) { g.fillStyle = trim; for (let i = 0; i < 8; i++) vertical ? g.fillRect(i * 8 + 2, 0, 3, 64) : g.fillRect(0, i * 8 + 2, 64, 3); }
  });
}
const lam = (o) => new THREE.MeshLambertMaterial(o);

// a group of meshes that fade when they stand between the camera and the hero
function fader() {
  const fades = [], mats = new Map();
  const faded = (m) => {
    if (!mats.has(m)) { const f = m.clone(); f.transparent = true; f.opacity = 0.22; f.depthWrite = false; mats.set(m, f); }
    return mats.get(m);
  };
  return {
    add(meshes, x, z, r, h) { for (const m of meshes) m.userData.solid = m.material; fades.push({ meshes, x, z, r, h }); },
    occlude(px, pz, cam) {
      for (const f of fades) {
        const dx = f.x - px, dz = f.z - pz;
        const along = dx * cam.fx + dz * cam.fz, side = dx * cam.rx + dz * cam.rz;
        const fade = Math.abs(dx) < 10 + f.r && Math.abs(dz) < 10 + f.r && along < 0.4 + f.r * 0.6 && along > -f.h * 1.1 - f.r && Math.abs(side) < f.r + 0.8;
        for (const m of f.meshes) { const want = fade ? faded(m.userData.solid) : m.userData.solid; if (m.material !== want) m.material = want; }
      }
    },
  };
}

// ---------- the Pyramid ----------
// at: { x, z, half (half the base), h (height) }. Its door is on the south face (door: where to stand)
export function buildPyramid({ group, heightAt, addBox }, at) {
  const rng = mulberry32(331);
  const { x, z, half, h } = at, y = heightAt(x, z + half) - 0.2;
  const F = fader();
  const courses = canvasTex(64, 128, (g) => {
    g.fillStyle = '#d8b47a'; g.fillRect(0, 0, 64, 128);
    for (let yy = 0; yy < 128; yy += 8) {
      g.fillStyle = 'rgba(110,70,35,.5)'; g.fillRect(0, yy, 64, 2);         // the step's shadow
      g.fillStyle = 'rgba(255,240,205,.25)'; g.fillRect(0, yy + 2, 64, 1.5); // its lit edge
      for (let xx = (yy / 8) % 2 ? 0 : 6; xx < 64; xx += 12) { g.fillStyle = 'rgba(110,70,35,.3)'; g.fillRect(xx, yy, 1, 8); }
    }
    for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(120,80,40,.15)'; g.fillRect(rng() * 64, rng() * 128, 3, 2); }
  });
  courses.repeat.set(6, 3);
  const geo = new THREE.ConeGeometry(half * Math.SQRT2, h, 4, 1, true);
  geo.rotateY(Math.PI / 4);
  const body = new THREE.Mesh(geo, lam({ map: courses }));
  body.position.set(x, y + h / 2, z);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1 * Math.SQRT2 * 0.62, 1.4, 4).rotateY(Math.PI / 4), lam({ color: '#f2c84a', emissive: '#4a3208' }));
  cap.position.set(x, y + h - 0.7 + 0.05, z);
  // the doorway: a stone frame stepping out of the south face, a dark passage in it
  const fw = 3.2, fh = 3.4, fd = 1.8;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), lam({ map: sandstoneTex(rng, '#c8a468', true) }));
  frame.position.set(x, y + fh / 2, z + half - fd / 2 + 0.3);
  const doorTex = canvasTex(64, 80, (g) => {
    g.fillStyle = '#c8a468'; g.fillRect(0, 0, 64, 80);
    g.fillStyle = '#2a1a10'; g.fillRect(14, 22, 36, 58);
    g.fillStyle = '#100804'; g.fillRect(20, 30, 24, 50);
    g.fillStyle = '#f2c84a'; g.fillRect(8, 8, 48, 8); // a gold lintel with a sun disc and wings
    g.fillStyle = '#c83a2a'; g.beginPath(); g.arc(32, 12, 5, 0, 7); g.fill();
    g.fillStyle = '#2f5a9a'; g.fillRect(10, 10, 14, 3); g.fillRect(40, 10, 14, 3);
  });
  doorTex.wrapS = doorTex.wrapT = THREE.ClampToEdgeWrapping;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(fw - 0.1, fh - 0.1), lam({ map: doorTex }));
  door.position.set(x, y + fh / 2, z + half + 0.31);
  group.add(body, cap, frame, door);
  F.add([body, cap], x, z, half, h);
  F.add([frame, door], x, z + half, 1.6, fh);
  addBox(x - half + 0.6, z - half + 0.6, x + half - 0.6, z + half - 0.3);
  return { occlude: F.occlude, door: { x, z: z + half + 1.3 }, minimap(mg) {
    mg.fillStyle = '#c8a060'; mg.fillRect((x - half) * 2, (z - half) * 2, half * 4, half * 4);
    mg.strokeStyle = '#7a5a30'; mg.lineWidth = 1; mg.beginPath(); mg.moveTo((x - half) * 2, (z - half) * 2); mg.lineTo((x + half) * 2, (z + half) * 2); mg.moveTo((x + half) * 2, (z - half) * 2); mg.lineTo((x - half) * 2, (z + half) * 2); mg.stroke();
  } };
}

// ---------- the Giant Sphinx ----------
// at: { x, z } where its chest stands (it lies along z, its head to the south). About 34 paces from
// tail to claws and 16 across the haunches: half the map.
export function buildSphinx({ group, heightAt, addBox }, at) {
  const rng = mulberry32(919);
  const cx = at.x, cz = at.z, y0 = heightAt(cx, cz) - 0.25;
  const F = fader();
  const stone = lam({ map: sandstoneTex(rng) });
  stone.map.repeat.set(2, 2);
  const stoneDk = lam({ map: sandstoneTex(rng, '#b8925e') });
  const blocks = lam({ map: sandstoneTex(rng, '#c8a468', true) });
  const gold = lam({ color: '#e8b840', emissive: '#3a2604' });
  const lapis = '#2e4f9a', teal = '#3a9a8a', goldC = '#e2b440', sandC = '#cfa868';
  // the headdress's stripes: gold, lapis and sandstone, round the head; down the lappets
  const nemesRound = lam({ map: bandTex([[goldC, 0.18], [lapis, 0.16], [sandC, 0.16], [teal, 0.1], [goldC, 0.12], [lapis, 0.12], [sandC, 0.16]], true) });
  nemesRound.map.repeat.set(1, 3);
  const nemesDown = lam({ map: bandTex([[goldC, 0.2], [lapis, 0.2], [sandC, 0.2], [teal, 0.15], [goldC, 0.25]], true) });
  nemesDown.map.repeat.set(1, 4);
  const collar = lam({ map: bandTex([[goldC, 0.16], [lapis, 0.2], [goldC, 0.08], [teal, 0.2], [goldC, 0.08], [lapis, 0.16], [goldC, 0.12]], true, 'rgba(255,240,180,.35)') });
  const band = lam({ map: bandTex([[goldC, 0.25], [lapis, 0.5], [goldC, 0.25]], true, 'rgba(30,40,90,.35)') });
  band.map.repeat.set(4, 1);
  const ivory = lam({ color: '#efe2c0' });
  const parts = { body: [], front: [], head: [], legL: [], legR: [] };
  const add = (geo, mat, x, y, z, list, s = null) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(cx + x, y0 + y, cz + z);
    if (s) m.scale.set(...s);
    group.add(m); parts[list].push(m);
    return m;
  };
  // the lying body, its haunches and folded hind legs, the tail curled at its side
  add(new THREE.CapsuleGeometry(4.6, 11, 8, 16).rotateX(Math.PI / 2), stone, 0, 3.7, -11, 'body', [1.22, 0.86, 1]);
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(4.2, 18, 14), stone, s * 4.6, 3.0, -16.5, 'body', [0.9, 0.85, 1.15]);
    add(new THREE.CapsuleGeometry(1.5, 5, 6, 10).rotateX(Math.PI / 2), stoneDk, s * 7.4, 1.1, -12, 'body');
    add(new THREE.SphereGeometry(1.7, 12, 10), stoneDk, s * 7.6, 1.0, -8.6, 'body', [1, 0.7, 1.2]);
  }
  const tail = new THREE.CatmullRomCurve3([[-5, 1, -21], [-7.5, 0.9, -19], [-8.8, 0.8, -15], [-9.2, 0.8, -11], [-8.6, 1.1, -8]].map(([x, y, z]) => new THREE.Vector3(cx + x, y0 + y, cz + z)));
  const tm = new THREE.Mesh(new THREE.TubeGeometry(tail, 24, 0.55, 8), stoneDk); group.add(tm); parts.body.push(tm);
  // the chest and shoulders, rising to the neck
  add(new THREE.SphereGeometry(4.3, 20, 16), stone, 0, 5.0, -1.2, 'front', [1.45, 1.25, 0.92]);
  add(new THREE.CylinderGeometry(2.6, 3.3, 5, 16), stone, 0, 9.4, -0.6, 'head');
  // the forelegs, stretched out south, banded at the shoulder; the great paws, claws in the sand
  for (const s of [-1, 1]) {
    const L = s < 0 ? 'legL' : 'legR', lx = s * 4.7;
    add(new THREE.CapsuleGeometry(1.95, 12.5, 6, 14).rotateX(Math.PI / 2), stone, lx, 1.95, 7.6, L, [1.05, 1, 1]);
    for (const bz of [3.2, 5.6]) add(new THREE.CylinderGeometry(2.12, 2.12, bz === 3.2 ? 1.5 : 0.7, 18, 1, true).rotateX(Math.PI / 2), band, lx, 1.95, bz, L, [1.05, 1, 1]);
    add(new THREE.SphereGeometry(2.4, 16, 12), stone, lx, 1.5, 15.2, L, [1.15, 0.68, 1.15]);
    for (let k = -1.5; k <= 1.5; k++) {
      const toe = add(new THREE.SphereGeometry(0.62, 10, 8), stone, lx + k * 0.9, 0.85, 17.4, L, [1, 0.8, 1.2]);
      void toe;
      add(new THREE.ConeGeometry(0.28, 1.0, 8).rotateX(Math.PI / 2), ivory, lx + k * 0.9, 0.55, 18.4, L);
    }
  }
  // the collar: a broad jewelled fan round the base of the neck, open at the back; the scarab pendant
  add(new THREE.CylinderGeometry(3.0, 5.0, 2.2, 28, 1, true, -1.75, 3.5), collar, 0, 8.0, -0.4, 'front');
  add(new THREE.CylinderGeometry(3.0, 3.0, 0.35, 28, 1, false, -1.75, 3.5), gold, 0, 9.05, -0.4, 'front');
  add(new THREE.SphereGeometry(0.7, 12, 10), gold, 0, 6.6, 3.85, 'front', [1, 1.2, 0.6]);
  add(new THREE.SphereGeometry(0.42, 10, 8), lam({ color: lapis, emissive: '#0a1430' }), 0, 6.7, 4.2, 'front', [1, 1.15, 0.6]);
  add(new THREE.ConeGeometry(0.35, 1.2, 6).rotateX(Math.PI), gold, 0, 5.6, 3.8, 'front');
  // the head: the face (painted on a curved panel), the headdress over it, the lappets down the
  // chest, the cobra on the brow
  const hx = 0, hy = 13.4, hz = 0.8;
  add(new THREE.SphereGeometry(2.8, 20, 16), stone, hx, hy, hz, 'head', [1, 1.18, 1]);
  const faceTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#d6b27c'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 120; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(120,80,40,.12)' : 'rgba(255,240,205,.12)'; g.fillRect(rng() * 128, rng() * 128, 3, 2); }
    g.fillStyle = 'rgba(150,100,55,.35)'; g.fillRect(56, 48, 16, 34); // the nose's shadow
    for (const s of [-1, 1]) {
      const ex = 64 + s * 22;
      g.strokeStyle = '#4a3420'; g.lineWidth = 3; g.beginPath(); g.moveTo(ex - 13, 38); g.quadraticCurveTo(ex, 31, ex + 13, 37); g.stroke(); // the brow
      g.fillStyle = '#f2e6cc'; g.beginPath(); g.ellipse(ex, 47, 11, 5, 0, 0, 7); g.fill();
      g.fillStyle = '#6a5a3a'; g.beginPath(); g.arc(ex + s * -1, 47, 4, 0, 7); g.fill();
      g.fillStyle = '#1e140c'; g.beginPath(); g.arc(ex + s * -1, 47, 2, 0, 7); g.fill();
      g.strokeStyle = '#1e140c'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ex - 12, 46); g.quadraticCurveTo(ex, 40, ex + 12, 46); g.lineTo(ex + s * 18, 44); g.stroke(); // kohl, winged
      g.fillStyle = 'rgba(120,80,40,.4)'; g.fillRect(ex - 6, 56, 12, 3);
    }
    g.fillStyle = '#c49a64'; g.beginPath(); g.moveTo(64, 46); g.lineTo(58, 78); g.lineTo(70, 78); g.closePath(); g.fill(); // the nose
    g.fillStyle = '#9a6a46'; g.beginPath(); g.ellipse(64, 94, 13, 4, 0, 0, 7); g.fill(); // the lips
    g.fillStyle = '#7a4a30'; g.fillRect(52, 93, 24, 1.6);
    g.strokeStyle = 'rgba(80,50,25,.65)'; g.lineWidth = 1.2; // weathering cracks
    for (const [x, y, dx] of [[30, 20, 8], [96, 70, -10], [44, 104, 6], [88, 18, 4]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + 12); g.lineTo(x + dx * 0.4, y + 24); g.stroke(); }
  });
  faceTex.wrapS = faceTex.wrapT = THREE.ClampToEdgeWrapping;
  add(new THREE.CylinderGeometry(2.88, 2.6, 4.6, 24, 1, true, -0.95, 1.9), lam({ map: faceTex }), hx, hy - 0.5, hz, 'head', [1, 1, 1.02]);
  add(new THREE.SphereGeometry(3.35, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.4), nemesRound, hx, hy + 0.5, hz, 'head', [1.05, 1.3, 1.05]); // the crown of the headdress
  add(new THREE.SphereGeometry(3.3, 24, 16, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, Math.PI * 0.2, Math.PI * 0.55), nemesRound, hx, hy + 0.3, hz, 'head', [1.12, 1.25, 1.05]); // its sides and back
  add(new THREE.CylinderGeometry(3.38, 3.38, 0.5, 24, 1, true, -1.1, 2.2), gold, hx, hy + 1.85, hz, 'head', [1.05, 1, 1.05]); // the gold brow band
  for (const s of [-1, 1]) { // the lappets: striped panels falling to the chest, flaring out
    const lap = add(new THREE.BoxGeometry(1.9, 6.2, 0.55), nemesDown, s * 3.1, hy - 4.6, hz + 1.4, 'head');
    lap.rotation.z = s * 0.12;
  }
  add(new THREE.BoxGeometry(5.2, 5.5, 1.2), nemesRound, hx, hy - 3.2, hz - 2.6, 'head'); // the back flap
  add(new THREE.CylinderGeometry(0.28, 0.34, 1.4, 8), gold, hx, hy + 3.05, hz + 2.9, 'head'); // the cobra: its raised body and hood
  add(new THREE.SphereGeometry(0.42, 10, 8), gold, hx, hy + 3.8, hz + 3.0, 'head', [1.3, 1, 0.6]);
  add(new THREE.SphereGeometry(0.12, 6, 6), lam({ color: '#c83a2a' }), hx, hy + 3.85, hz + 3.25, 'head');
  // the sealed door in its chest, between the paws: a stone frame, carved doors, glowing runes
  const doorTex = canvasTex(64, 96, (g) => {
    g.fillStyle = '#b8925e'; g.fillRect(0, 0, 64, 96);
    g.fillStyle = '#8a6a40'; g.beginPath(); g.moveTo(8, 96); g.lineTo(8, 30); g.quadraticCurveTo(32, 4, 56, 30); g.lineTo(56, 96); g.fill();
    g.fillStyle = '#6a4e2e'; g.fillRect(31, 26, 2, 70);
    g.fillStyle = '#7ad8ff'; // the seal: a glowing eye and runes down each leaf
    g.beginPath(); g.ellipse(32, 44, 9, 5, 0, 0, 7); g.fill(); g.fillStyle = '#1e3a5a'; g.beginPath(); g.arc(32, 44, 3, 0, 7); g.fill();
    g.fillStyle = '#7ad8ff'; for (let y = 58; y < 92; y += 9) { g.fillRect(18, y, 6, 3); g.fillRect(40, y + 3, 6, 3); g.fillRect(20, y + 4, 2, 3); g.fillRect(43, y, 2, 3); }
  });
  doorTex.wrapS = doorTex.wrapT = THREE.ClampToEdgeWrapping;
  add(new THREE.BoxGeometry(4.2, 5.2, 1.6), blocks, 0, 2.6, 2.6, 'front');
  const door = add(new THREE.PlaneGeometry(3.4, 4.6), lam({ map: doorTex, emissive: '#0a2030', emissiveMap: doorTex }), 0, 2.4, 3.42, 'front');
  // what is solid: the body and haunches, the chest, the legs (the yard between the paws is open)
  addBox(cx - 7.4, cz - 22, cx + 7.4, cz - 4);
  addBox(cx - 5.8, cz - 4.5, cx + 5.8, cz + 2.4);
  addBox(cx - 2.3, cz + 1.6, cx + 2.3, cz + 3.4);
  for (const s of [-1, 1]) addBox(cx + s * 4.7 - 2.3, cz - 1, cx + s * 4.7 + 2.3, cz + 18.6);
  addBox(cx - 9.6, cz - 21, cx - 6.4, cz - 7); addBox(cx + 6.4, cz - 16, cx + 9.4, cz - 7);
  F.add(parts.body, cx, cz - 13, 8, 8);
  F.add(parts.front, cx, cz, 6, 9);
  F.add(parts.head, cx, cz + 0.8, 4, 17);
  F.add(parts.legL, cx - 4.7, cz + 9, 2.6, 3.5);
  F.add(parts.legR, cx + 4.7, cz + 9, 2.6, 3.5);
  let t = 0;
  return {
    occlude: F.occlude,
    door: { x: cx, z: cz + 5.0 },
    update(dt) { t += dt; door.material.emissiveIntensity = 0.7 + Math.sin(t * 1.8) * 0.3; },
    minimap(mg) {
      mg.fillStyle = '#b8925e';
      mg.beginPath(); mg.ellipse(cx * 2, (cz - 12) * 2, 15, 22, 0, 0, Math.PI * 2); mg.fill();
      mg.fillRect((cx - 7) * 2, (cz - 1) * 2, 5, 38); mg.fillRect((cx + 4.5) * 2, (cz - 1) * 2, 5, 38);
      mg.fillStyle = '#e2b440'; mg.beginPath(); mg.arc(cx * 2, (cz + 0.8) * 2, 6, 0, Math.PI * 2); mg.fill();
    },
  };
}
