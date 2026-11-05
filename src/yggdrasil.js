// Yggdrasil, the World Tree (MAPS.ygg in world.js), north of the Old Forest, open only to who planted
// its seed (The World Tree, quests.js). After the owner's plan: a tree so big that only its trunk can be
// seen, the top lost far above; great roots spread over the ground round it, and one of them, broad as
// a road, climbs to a glowing door in the trunk. The hero walks up that root (its rise is in the
// terrain itself, world.js rampAt; low roots along its sides keep them on it) and through the door into
// the World Tree's labyrinth (dungeon.js: three maze floors, then the great hall). No monsters here.
// Real meshes like the desert's monuments, lit by the same sun; what stands between the camera and the
// hero fades. Fireflies drift round the trunk and leaves fall from somewhere far above.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';
import { fader } from './monuments.js';

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
// bark: deep wavy furrows running up the trunk, lighter ridges, a knot or two, moss
function barkTex(rng, base = '#6a4a2e', mossy = 0.3) {
  return canvasTex(128, 256, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 128, 256);
    for (let k = 0; k < 14; k++) { // the furrows
      let x = k * 9.2 + rng() * 4;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= 256; y += 16) { x += (rng() - 0.5) * 5; g.lineTo(x, y); }
      g.strokeStyle = 'rgba(30,18,8,.75)'; g.lineWidth = 2 + rng() * 2; g.stroke();
      g.strokeStyle = 'rgba(160,120,80,.25)'; g.lineWidth = 1; g.translate(2.5, 0); g.stroke(); g.translate(-2.5, 0);
    }
    for (let i = 0; i < 4; i++) { // knots
      const x = rng() * 128, y = rng() * 256;
      g.fillStyle = 'rgba(40,24,12,.8)'; g.beginPath(); g.ellipse(x, y, 5, 8, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(140,100,60,.4)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 9, 13, 0, 0, 7); g.stroke();
    }
    for (let i = 0; i < 40 * mossy; i++) { // moss
      g.fillStyle = rng() < 0.5 ? 'rgba(80,130,50,.55)' : 'rgba(110,160,70,.45)';
      g.beginPath(); g.ellipse(rng() * 128, rng() * 256, 4 + rng() * 10, 3 + rng() * 6, 0, 0, 7); g.fill();
    }
  });
}
const lam = (o) => new THREE.MeshLambertMaterial(o);

// at: { x, z (the trunk's middle), r (its radius at the ground), ramp: { x, z0, z1, w, top } (the root
// that climbs to the door), roots: the angles the great roots spread at }. ctx: world.js's
export function buildYggdrasil({ group, heightAt, addBox, addSolid }, at) {
  const rng = mulberry32(777);
  const { x: cx, z: cz, r: R, ramp } = at;
  const F = fader();
  const bark = lam({ map: barkTex(rng) });
  bark.map.repeat.set(9, 5);
  const rootBark = lam({ map: barkTex(rng, '#5e4028', 0.6) });
  rootBark.map.repeat.set(1, 3);
  // the trunk: far taller than anything the camera can see, its top lost in the dark
  const H = 90;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(R - 1, R, H, 48, 1, true), bark);
  trunk.position.set(cx, H / 2 - 0.6, cz);
  group.add(trunk);
  // the door: an arched hollow in the trunk at the top of the ramp, glowing runes round it
  const doorTex = canvasTex(64, 96, (g) => {
    g.fillStyle = '#4a3220'; g.fillRect(0, 0, 64, 96);
    g.fillStyle = '#1a0e06'; g.beginPath(); g.moveTo(10, 96); g.lineTo(10, 34); g.quadraticCurveTo(32, 4, 54, 34); g.lineTo(54, 96); g.fill();
    const grd = g.createRadialGradient(32, 64, 2, 32, 64, 30); grd.addColorStop(0, 'rgba(160,255,190,.9)'); grd.addColorStop(1, 'rgba(60,160,90,0)');
    g.fillStyle = grd; g.beginPath(); g.moveTo(14, 96); g.lineTo(14, 36); g.quadraticCurveTo(32, 10, 50, 36); g.lineTo(50, 96); g.fill();
    g.fillStyle = '#9affc0'; // runes up both sides and over the arch
    for (let y = 40; y < 92; y += 9) { g.fillRect(4, y, 3, 5); g.fillRect(57, y + 3, 3, 5); g.fillRect(3, y + 2, 5, 1.5); g.fillRect(56, y + 5, 5, 1.5); }
    for (let k = 0; k < 7; k++) { const a = Math.PI * (0.15 + k * 0.7 / 6); g.fillRect(32 - Math.cos(a) * 26 - 1.5, 34 - Math.sin(a) * 26 - 1.5, 3, 3); }
  });
  doorTex.wrapS = doorTex.wrapT = THREE.ClampToEdgeWrapping;
  const dy = heightAt(ramp.x, ramp.z0) - 0.05;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5), lam({ map: doorTex, emissive: '#0c2a16', emissiveMap: doorTex }));
  door.position.set(ramp.x, dy + 2.5, cz + R - 0.05);
  group.add(door);
  F.add([trunk, door], cx, cz, R, 14);
  // solid: the trunk (an octagon of boxes)
  const k = R * 0.72;
  addBox(cx - k, cz - k, cx + k, cz + k);
  addBox(cx - R, cz - R * 0.38, cx + R, cz + R * 0.38);
  addBox(cx - R * 0.38, cz - R, cx + R * 0.38, cz + R - 0.05);
  // the great roots: thick at the trunk, sinking into the ground further out, a little crooked
  const rootMeshes = [];
  const tube = (pts, radius, mat = rootBark) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 10), mat);
    group.add(m);
    rootMeshes.push(m);
    for (let i = 0; i <= 24; i++) { // colliders along it, where it stands above the ground
      const p = curve.getPoint(i / 24);
      if (p.y + radius * 0.6 > heightAt(p.x, p.z) + 0.25) addSolid(p.x, p.z, radius * 0.8);
    }
    return curve;
  };
  const roots = [];
  for (const a of at.roots) {
    const bend = (rng() - 0.5) * 0.5, len = 15 + rng() * 6;
    const pt = (rr, da, y) => { const ang = a + da; const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr; return [x, heightAt(x, z) + y, z]; };
    const pts = [pt(R - 1.4, 0, 1.7), pt(R + 2.5, bend * 0.4, 0.8), pt(R + len * 0.55, bend, 0.25), pt(R + len, bend * 1.4, -0.7)];
    tube(pts.slice(0, 3), 1.2);
    tube(pts.slice(1), 0.85);
    roots.push(pts);
  }
  // the root that is the road up: low roots along both its sides, rising with it to the trunk
  for (const s of [-1, 1]) {
    const pts = [];
    for (let z = ramp.z1 + 0.5; z >= cz + R - 1.2; z -= 1.5) { const x = ramp.x + s * (ramp.w + 0.55); pts.push([x, heightAt(x - s * 0.6, z) + 0.15, z]); }
    tube(pts, 0.6);
  }
  // fireflies round the trunk, leaves falling from far above, two shafts of light
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const dot = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const flyMat = new THREE.SpriteMaterial({ map: dot, color: '#b8ffb0', ...add });
  const flies = Array.from({ length: 22 }, (_, i) => { const s = new THREE.Sprite(flyMat); s.scale.set(0.28, 0.28, 1); s.renderOrder = 3; group.add(s); return { s, a: rng() * 7, r: R + 1.5 + rng() * 9, h: 0.6 + rng() * 3, k: 0.2 + rng() * 0.4, ph: i }; });
  const leafTex = canvasTex(16, 16, (g) => { g.fillStyle = '#6aa84a'; g.beginPath(); g.ellipse(8, 8, 6, 3, 0.6, 0, 7); g.fill(); g.strokeStyle = '#3a6a2a'; g.lineWidth = 1; g.beginPath(); g.moveTo(3, 11); g.lineTo(13, 5); g.stroke(); });
  leafTex.magFilter = THREE.NearestFilter;
  const leafMat = new THREE.SpriteMaterial({ map: leafTex, transparent: true, alphaTest: 0.3 });
  const leaves = Array.from({ length: 16 }, () => { const s = new THREE.Sprite(leafMat); s.scale.set(0.35, 0.35, 1); group.add(s); return { s, x: cx + (rng() - 0.5) * 30, z: cz + (rng() - 0.3) * 30, y: rng() * 14, v: 0.6 + rng() * 0.6, w: rng() * 7 }; });
  const shaft = canvasTex(32, 128, (g) => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,250,210,0)'); gr.addColorStop(0.5, 'rgba(255,250,210,.32)'); gr.addColorStop(1, 'rgba(255,250,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 128); });
  for (const [sx, sz] of [[cx - R - 5, cz + 6], [cx + R + 6, cz + 9]]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: shaft, ...add })); s.scale.set(3, 14, 1); s.position.set(sx, heightAt(sx, sz) + 6, sz); group.add(s); }
  let t = 0;
  return {
    occlude: F.occlude,
    door: { x: ramp.x, z: cz + R + 1.6 },
    update(dt) {
      t += dt;
      door.material.emissiveIntensity = 0.8 + Math.sin(t * 1.6) * 0.3;
      for (const f of flies) {
        const a = f.a + t * f.k, x = cx + Math.cos(a) * f.r, z = cz + Math.sin(a) * f.r * 0.9;
        f.s.position.set(x, heightAt(x, z) + f.h + Math.sin(t * 2 + f.ph) * 0.4, z);
        f.s.material.opacity = 0.5 + Math.sin(t * 3 + f.ph) * 0.4;
      }
      for (const l of leaves) {
        l.y -= l.v * dt;
        if (l.y < 0) { l.y = 12 + rng() * 4; l.x = cx + (rng() - 0.5) * 30; l.z = cz + (rng() - 0.3) * 30; }
        l.s.position.set(l.x + Math.sin(t + l.w) * 0.8, heightAt(l.x, l.z) + l.y, l.z);
      }
    },
    minimap(mg) {
      mg.strokeStyle = '#5e4028'; mg.lineCap = 'round';
      for (const pts of roots) { mg.lineWidth = 3; mg.beginPath(); pts.forEach(([x, , z], i) => (i ? mg.lineTo(x * 2, z * 2) : mg.moveTo(x * 2, z * 2))); mg.stroke(); }
      mg.fillStyle = '#4a3220'; mg.beginPath(); mg.arc(cx * 2, cz * 2, R * 2, 0, Math.PI * 2); mg.fill();
      mg.fillStyle = '#3f6a34'; mg.beginPath(); mg.arc(cx * 2, cz * 2, R * 1.3, 0, Math.PI * 2); mg.fill(); // (its crown, seen from above)
      mg.fillStyle = '#8a6a44'; mg.fillRect((ramp.x - ramp.w) * 2, (cz + R) * 2, ramp.w * 4, (ramp.z1 - cz - R) * 2);
    },
  };
}
