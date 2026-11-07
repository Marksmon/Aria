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
export function fader() {
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

// ---------- the Sunken Galleon (the owner's picture: no land, a broken galleon alone in the middle of the sea) ----------
// at: { x, z, len, beam }: its deck is the ground you walk on, plank by plank, the bow to the west and the stern to the
// east, where the captain's quarters rise. Holes are stove through the deck (the sea shows through, nobody walks them),
// two masts are snapped (one lies across the deck), the third stands with rags of sail; a compass rose inlaid mid-deck
// glows a drowned blue, ghost lanterns burn along the rails, and the Kraken's arms rise out of the sea round it.
// The hatch down into it is a portal (MAPS.wreck). deck(x, z): is this spot the deck (world.js walks it)
const GAL_HOLES = [[-9, 3.2, 1.6], [6, -3.6, 1.8], [-16, -1.6, 1.2]]; // [along, across, r] from the middle
export function galleonDeck(at) {
  const { x: X, z: Z, len, beam } = at;
  const half = (u) => (u < -1 || u > 1 ? -1 : u > 0 ? Math.sqrt(1 - u ** 6) : Math.sqrt(1 - u * u)) * beam / 2; // (a blunt stern east, a pointed bow west)
  return (x, z) => {
    const u = (x - X) / (len / 2);
    if (Math.abs(z - Z) > half(u) - 0.6) return false;
    return !GAL_HOLES.some(([a, c, r]) => Math.hypot(x - X - a, z - Z - c) < r);
  };
}
export function buildGalleon({ group, heightAt, addBox }, at) {
  const rng = mulberry32(919);
  const { x: X, z: Z, len, beam } = at, D = 0.06; // (the deck's height)
  const onDeck = galleonDeck(at);
  const F = fader();
  const planks = (base, n) => canvasTex(64, 64, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 8) { g.fillStyle = rng() < 0.5 ? 'rgba(0,0,0,.1)' : 'rgba(255,230,190,.07)'; g.fillRect(0, y, 64, 8); g.fillStyle = 'rgba(30,18,8,.6)'; g.fillRect(0, y, 64, 1); g.fillRect(Math.floor(rng() * 56), y, 1, 8); }
    for (let i = 0; i < n; i++) { g.fillStyle = 'rgba(30,18,8,.25)'; g.fillRect(rng() * 64, rng() * 64, 6 + rng() * 10, 1); }
    g.fillStyle = 'rgba(90,150,150,.18)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(rng() * 64, rng() * 64, 5, 2.5, 0, 0, 7); g.fill(); } // seawater on it
  });
  const deckTex = planks('#7a5432', 30); deckTex.repeat.set(1, 1);
  const deckMat = lam({ map: deckTex }), hullMat = lam({ map: planks('#5a3a22', 20) }), dark = lam({ color: '#3a2616' }), trim = lam({ color: '#a8843a' });
  // the deck: a tile of planks for every half pace of it (none over the holes)
  const P = [], N = [], UV = [], I = [];
  for (let z = Z - beam / 2; z < Z + beam / 2; z += 0.5) for (let x = X - len / 2; x < X + len / 2; x += 0.5) {
    if (!onDeck(x + 0.25, z + 0.25)) continue;
    const o = P.length / 3;
    P.push(x, D, z, x + 0.5, D, z, x + 0.5, D, z + 0.5, x, D, z + 0.5);
    for (let k = 0; k < 4; k++) N.push(0, 1, 0);
    UV.push(x / 4, z / 4, (x + 0.5) / 4, z / 4, (x + 0.5) / 4, (z + 0.5) / 4, x / 4, (z + 0.5) / 4);
    I.push(o, o + 2, o + 1, o, o + 3, o + 2);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); dg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); dg.setIndex(I);
  const deck = new THREE.Mesh(dg, deckMat);
  group.add(deck);
  // the hull's sides, from the rail down into the sea, and the rail along them
  const outline = [];
  for (let i = 0; i <= 40; i++) { const u = -1 + 2 * i / 40, hw = (u > 0 ? Math.sqrt(Math.max(0, 1 - u ** 6)) : Math.sqrt(Math.max(0, 1 - u * u))) * beam / 2; outline.push([X + u * len / 2, Z - hw]); }
  for (let i = 40; i >= 0; i--) { const u = -1 + 2 * i / 40, hw = (u > 0 ? Math.sqrt(Math.max(0, 1 - u ** 6)) : Math.sqrt(Math.max(0, 1 - u * u))) * beam / 2; outline.push([X + u * len / 2, Z + hw]); }
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: false }).rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, [new THREE.MeshBasicMaterial({ visible: false }), hullMat]);
  hull.position.y = D + 0.62; // (its top edge a bulwark above the deck)
  group.add(hull);
  const railGeo = new THREE.BoxGeometry(1, 0.12, 0.16);
  for (let i = 0; i < outline.length - 1; i++) {
    const [ax, az] = outline[i], [bx, bz] = outline[i + 1], L = Math.hypot(bx - ax, bz - az);
    if (L < 0.05) continue;
    const r = new THREE.Mesh(railGeo, trim); r.scale.x = L; r.position.set((ax + bx) / 2, D + 0.68, (az + bz) / 2); r.rotation.y = -Math.atan2(bz - az, bx - ax); group.add(r);
  }
  // the hatches stove in: the sea seen through each hole, ragged boards round it
  for (const [a, c, r] of GAL_HOLES) for (let k = 0; k < 7; k++) {
    const t = k / 7 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.22), dark);
    b.position.set(X + a + Math.cos(t) * (r + 0.2), D + 0.03, Z + c + Math.sin(t) * (r + 0.2)); b.rotation.y = -t + 1.2; group.add(b);
  }
  // the compass rose mid-deck, glowing a drowned blue
  const rose = canvasTex(256, 256, (g) => {
    g.translate(128, 128);
    g.strokeStyle = '#d8b25a'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 118, 0, 7); g.stroke();
    g.strokeStyle = '#5ad8ff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 104, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 70, 0, 7); g.stroke();
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = k % 4 === 0 ? 112 : k % 2 ? 56 : 86; g.fillStyle = k % 2 ? '#d8b25a' : '#e8f4ff'; g.beginPath(); g.moveTo(Math.cos(a - 0.13) * 14, Math.sin(a - 0.13) * 14); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(Math.cos(a + 0.13) * 14, Math.sin(a + 0.13) * 14); g.fill(); }
    g.fillStyle = '#9af0ff'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill();
  });
  rose.wrapS = rose.wrapT = THREE.ClampToEdgeWrapping;
  const roseMesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: rose, transparent: true, depthWrite: false, emissive: '#1a4a5a', polygonOffset: true, polygonOffsetFactor: -2 }));
  roseMesh.position.set(X - 1, D + 0.01, Z); roseMesh.renderOrder = 0.5; group.add(roseMesh);
  // the masts: the foremast standing with rags of sail, the mainmast snapped and lying across the deck, the mizzen a stump
  const sailTex = canvasTex(64, 64, (g) => { g.fillStyle = '#4a4a56'; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 0); g.lineTo(56, 26); g.lineTo(64, 64); g.lineTo(44, 50); g.lineTo(30, 64); g.lineTo(14, 44); g.lineTo(0, 62); g.closePath(); g.fill(); g.fillStyle = 'rgba(90,200,230,.25)'; for (let i = 0; i < 10; i++) g.fillRect(rng() * 60, rng() * 60, 5, 3); });
  const sail = lam({ map: sailTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.4 });
  const mast = (x, z, h, lean = 0) => {
    const m = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, h, 8), dark); pole.position.y = h / 2; m.add(pole);
    m.position.set(x, D, z); m.rotation.z = lean; group.add(m);
    addBox(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
    return m;
  };
  const fore = mast(X - len * 0.3, Z, 11, 0.08);
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), dark); yard.rotation.x = Math.PI / 2; yard.position.y = 8.5; fore.add(yard);
  const rag = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.4), sail); rag.rotation.y = Math.PI / 2; rag.position.y = 6.1; fore.add(rag);
  mast(X + 2, Z - 1, 2.2); // the mainmast's stump
  const fallen = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 13, 8), dark); // and the mainmast, lying across the deck and out over the rail
  fallen.rotation.set(0, 0.7, Math.PI / 2 - 0.05); fallen.position.set(X + 4.5, D + 0.3, Z + 3.4); group.add(fallen);
  for (let k = -2; k <= 1; k++) addBox(X + 4.5 + k * 1.3 * Math.cos(0.7) - 0.35, Z + 3.4 - k * 1.3 * Math.sin(0.7) - 0.35, X + 4.5 + k * 1.3 * Math.cos(0.7) + 0.35, Z + 3.4 - k * 1.3 * Math.sin(0.7) + 0.35);
  mast(X + len * 0.27, Z, 3.4, -0.1); // the mizzen
  // the captain's quarters at the stern: a raised castle, gold-trimmed, lit windows, a door (solid; the hold is below)
  const cx0 = X + len / 2 - 8.5, cx1 = X + len / 2 - 0.4, cw = beam / 2 - 1.2;
  const castle = new THREE.Mesh(new THREE.BoxGeometry(cx1 - cx0, 2.6, cw * 2), hullMat); castle.position.set((cx0 + cx1) / 2, D + 1.3, Z); group.add(castle);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(cx1 - cx0 + 0.4, 0.2, cw * 2 + 0.4), trim); roof.position.set((cx0 + cx1) / 2, D + 2.7, Z); group.add(roof);
  const win = lam({ color: '#9af0e8', emissive: '#3aa8a8' });
  for (const wz of [-cw + 1.2, -1.4, 1.4, cw - 1.2]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), win); w.position.set(cx0 - 0.01, D + 1.6, Z + wz); w.rotation.y = -Math.PI / 2; group.add(w); }
  for (let k = 0; k < 5; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), win); w.position.set(cx0 + 1 + k * 1.5, D + 1.6, Z + cw + 0.01); group.add(w); }
  addBox(cx0, Z - cw, cx1, Z + cw);
  F.add([castle, roof], (cx0 + cx1) / 2, Z, 3, 2.6);
  // ghost lanterns along the rails
  const glow = lam({ color: '#9af0e8', emissive: '#4ac8c0' });
  for (let k = 0; k < 8; k++) {
    const u = -0.8 + k * 0.22, x = X + u * len / 2, side = k % 2 ? 1 : -1, hw = (u > 0 ? Math.sqrt(Math.max(0, 1 - u ** 6)) : Math.sqrt(Math.max(0, 1 - u * u))) * beam / 2;
    if (x > cx0 - 0.5) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 5), dark); post.position.set(x, D + 0.65, Z + side * (hw - 0.4)); group.add(post);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), glow); l.position.set(x, D + 1.35, Z + side * (hw - 0.4)); group.add(l);
  }
  // the bowsprit, out over the sea
  const sprit = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 7, 6), dark); sprit.rotation.z = Math.PI / 2 - 0.3; sprit.position.set(X - len / 2 - 2.4, D + 1.6, Z); group.add(sprit);
  // the Kraken's arms rising out of the sea round it, curling over
  const arm = lam({ color: '#22306a' }), sucker = lam({ color: '#c8b8e8' });
  for (const [ax, az, dir, h] of [[X - 18, Z - 13, 1, 7], [X + 14, Z + 12, -1, 8], [X + 26, Z - 11, -1, 6], [X - 24, Z + 10, 1, 6]]) {
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = t * 3.2; pts.push(new THREE.Vector3(ax + dir * Math.sin(a) * h * 0.4, -0.8 + Math.sin(Math.min(1, t * 1.3) * Math.PI / 2) * h - (t > 0.75 ? (t - 0.75) * 10 : 0), az + Math.cos(a) * 1.2)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.55, 8), arm); group.add(tube);
    for (let i = 1; i < 7; i++) { const p = curve.getPoint(i / 8); const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), sucker); s.position.set(p.x - dir * 0.45, p.y, p.z + 0.3); group.add(s); }
  }
  return { occlude: F.occlude, minimap(mg) {
    mg.fillStyle = '#7a5432';
    for (let z = Z - beam / 2; z < Z + beam / 2; z += 1) for (let x = X - len / 2; x < X + len / 2; x += 1) if (onDeck(x + 0.5, z + 0.5)) mg.fillRect(x * 2, z * 2, 2, 2);
    mg.fillStyle = '#4a3020'; mg.fillRect(cx0 * 2, (Z - cw) * 2, (cx1 - cx0) * 2, cw * 4);
    mg.fillStyle = '#9af0e8'; mg.fillRect((X - 2) * 2, (Z - 1) * 2, 4, 4);
  } };
}

// ---------- the old beacon on Beacon Moor ----------
// A weathered stone tower on a round plinth in the moor's clearing, an iron fire-basket on top, ringed by low
// standing stones open to the south. Its fire is a dim ember until the story relights it (The Moor Beacon, story.js beaconfire);
// then it burns blue and white like Hafnvik's lighthouses. at: { x, z }; lit(): is it burning now?
export function buildBeacon({ group, heightAt, addSolid }, at, lit = () => true) {
  const rng = mulberry32(577);
  const { x, z } = at, y = heightAt(x, z) - 0.15;
  const F = fader();
  const stone = lam({ map: canvasTex(64, 64, (g) => {
    g.fillStyle = '#7d786c'; g.fillRect(0, 0, 64, 64);
    for (let yy = 0; yy < 64; yy += 10) { g.fillStyle = 'rgba(40,36,30,.45)'; g.fillRect(0, yy, 64, 2); for (let xx = (yy / 10) % 2 ? 0 : 8; xx < 64; xx += 16) g.fillRect(xx, yy, 2, 10); }
    for (let i = 0; i < 90; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(60,80,50,.35)' : 'rgba(210,205,190,.18)'; g.fillRect(rng() * 64, rng() * 64, 2 + rng() * 4, 1 + rng() * 3); }
  }) });
  const iron = lam({ color: '#2e2a28' });
  const parts = [];
  const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); group.add(m); parts.push(m); return m; };
  add(new THREE.CylinderGeometry(2.3, 2.6, 0.7, 16), stone, x, y + 0.35, z);          // the plinth
  add(new THREE.CylinderGeometry(1.1, 1.5, 4.6, 8), stone, x, y + 3.0, z);            // the tower
  add(new THREE.CylinderGeometry(1.45, 1.3, 0.35, 10), stone, x, y + 5.4, z);         // its cap
  add(new THREE.CylinderGeometry(1.05, 0.55, 0.7, 10, 1, true), iron, x, y + 5.9, z); // the fire-basket
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(new THREE.BoxGeometry(0.08, 0.9, 0.08), iron, x + Math.cos(a) * 0.95, y + 6.05, z + Math.sin(a) * 0.95); }
  F.add(parts.slice(), x, z, 1.6, 6.5);
  // the low standing stones round it, leaning a little, moss on their feet
  for (let i = 0; i < 8; i++) {
    if (i === 2) continue; // (a gap on the south side, where the story's singers stand: story.js beaconfire)
    const a = (i / 8) * Math.PI * 2, r = 4.2 + rng() * 0.6, sx = x + Math.cos(a) * r, sz = z + Math.sin(a) * r, h = 1.0 + rng() * 0.8;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.4), stone);
    s.position.set(sx, heightAt(sx, sz) + h / 2 - 0.1, sz); s.rotation.set((rng() - 0.5) * 0.2, -a, (rng() - 0.5) * 0.2);
    group.add(s); addSolid(sx, sz, 0.35);
  }
  addSolid(x, z, 2.2);
  // the fire: a cone of flame and a halo, ember-red and low while it sleeps, tall blue and white once relit
  const flameMat = new THREE.MeshBasicMaterial({ color: '#c8401a', transparent: true, opacity: 0.85, depthWrite: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 10), flameMat);
  const haloMat = new THREE.MeshBasicMaterial({ color: '#ff6a2a', transparent: true, opacity: 0.2, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 10), haloMat);
  const light = new THREE.PointLight('#ff6a2a', 3, 12, 1.4);
  for (const o of [flame, halo, light]) { o.position.set(x, y + 6.6, z); group.add(o); }
  let t = 0, was = null;
  return { occlude: F.occlude, update(dt) {
    t += dt;
    const on = lit();
    if (on !== was) {
      was = on;
      flameMat.color.set(on ? '#bfefff' : '#c8401a'); haloMat.color.set(on ? '#7ad8ff' : '#ff6a2a'); light.color.set(on ? '#7ad8ff' : '#ff6a2a');
    }
    const k = 1 + Math.sin(t * 7) * 0.08 + Math.sin(t * 17) * 0.05;
    flame.scale.set(on ? k : 0.55 * k, on ? 1.4 * k : 0.4 * k, on ? k : 0.55 * k);
    flame.position.y = y + 6.1 + flame.scale.y * 0.7;
    halo.scale.setScalar(on ? 1.2 * k : 0.6 * k);
    light.intensity = (on ? 7 : 2) * k;
  }, minimap(mg) {
    mg.fillStyle = '#8a857a'; mg.beginPath(); mg.arc(x * 2, z * 2, 4.6, 0, Math.PI * 2); mg.fill();
    mg.fillStyle = was ? '#7ad8ff' : '#c8401a'; mg.beginPath(); mg.arc(x * 2, z * 2, 2, 0, Math.PI * 2); mg.fill();
  } };
}
