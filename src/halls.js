// The Sphinx's Halls' monsters (dungeon.js), painted pixel by pixel in code like the desert's
// (desert.js), after the owner's pictures: cobras rearing on their coils; lamias, snake-women with
// gold on their arms; the Pharaoh's Servants, skeletal priests in striped headdresses with a blue
// crystal staff and a canopic jar; the jackal-headed Guardians with their cursed spears and the
// falcon-headed Sentinels with glaive and wings; Ammit the Devourer (a crocodile's head, a lion's
// mane and claws, a crocodile's tail, gold on its brow); the winged Sphinx Cubs; walking
// Sarcophagi whose lids swing open; Sand Elementals, whirlwinds of sand with fists of stone; and
// the Eternal Sphinx itself, a winged lion in a striped headdress. (The Scarabs and Mummies are the
// tomb's own, desert.js.) Frames: 4 directions (down, up, right; left is right mirrored) x idle (1),
// walk (4) and attack (4). Plain canvas: sprites.js makes the sprite sets.
import { Frame, ellipse, rect, poly, line, both, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
// size: the frame; body: the standing figure in pixels (def.w is its width in the world)
export const HALLS = {
  cobra: { kind: 'cobra', size: [44, 44], body: [24, 34], scale: '#7a8a3a', band: '#4a5424', belly: '#e2d49a', eye: '#ffd23a', tongue: '#d8344a' },
  lamia: { kind: 'lamia', size: [52, 64], body: [30, 58], tail: '#3a8a6a', belly: '#d8d0a0', skin: '#d8a070', hair: '#1e1a28', gold: '#e8c050', cloth: '#a83a4a', eye: '#9aff6a' },
  servant: { kind: 'servant', size: [48, 66], body: [24, 58], robe: '#22345a', wrap: '#d8ccaa', bone: '#e6dcc2', gold: '#d8b050', lapis: '#2e4f9a', eye: '#5ac8ff', crystal: '#7ac8ff', jar: '#d8b070' },
  jackal: { kind: 'guardian', head: 'jackal', size: [56, 70], body: [26, 62], fur: '#463e58', hair: '#1e1a26', skin: '#5a4034', armor: '#c8a050', trim: '#2e4f9a', kilt: '#e8e0cc', gem: '#a050d8', eye: '#c878ff', metal: '#c8ccd8', shaft: '#5a3a22' },
  falcon: { kind: 'guardian', head: 'falcon', size: [64, 70], body: [28, 62], fur: '#8a5a32', face: '#efe2c4', beak: '#e8b83a', skin: '#7a5034', armor: '#c8a050', trim: '#2e7a8a', kilt: '#e8e0cc', gem: '#3ac8b0', eye: '#ffd23a', metal: '#c8ccd8', shaft: '#4a3a5a', wing: '#6a4a2a' },
  ammit: { kind: 'ammit', size: [88, 84], body: [56, 74], croc: '#4a8a3a', scute: '#2e5a26', belly: '#e8d890', mane: '#a8582a', fur: '#d8a050', gold: '#e8c050', lapis: '#2e4f9a', teeth: '#f6f0e0', mouth: '#c83a3a', claw: '#efe6d4', eye: '#ffd23a' },
  sphinxCub: { kind: 'sphinx', k: 1, size: [60, 52], body: [36, 40], fur: '#d8a858', shade: '#b8863a', face: '#e0b070', gold: '#e8c050', lapis: '#2e4f9a', wing: '#9a6a34', tip: '#e8c050', eye: '#2a1a10' },
  eternalSphinx: { kind: 'sphinx', k: 2.4, mvp: true, size: [148, 128], body: [96, 100], fur: '#d8a450', shade: '#a87a34', face: '#e2b474', gold: '#f0c040', lapis: '#2e4f9a', wing: '#8a5a2a', tip: '#f0c040', eye: '#ffd23a', teal: '#3a9a8a' },
  sarcophagus: { kind: 'coffin', size: [44, 64], body: [24, 58], gold: '#e8b840', lapis: '#2e4f9a', teal: '#3a9a8a', wood: '#7a5032', inside: '#1a100a', eye: '#ff5a3a', wrap: '#d8ccaa' },
  sandElemental: { kind: 'elemental', size: [56, 64], body: [32, 58], sand: '#d8b070', dark: '#a8804a', rock: '#8a6a48', eye: '#ffb030', core: '#ffe6a8' },
};

const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function hallsSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => hallsFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}
export function hallsFrame(id, dir, anim, f) {
  if (dir === 'left') return hallsFrame(id, 'right', anim, f).mirror();
  const P = HALLS[id], [W, H] = P.size;
  const F = new Frame(W, H);
  const a = { G: H - 3, W, H, walk: anim === 'walk', f, step: anim === 'walk' ? [1, 0, -1, 0][f] : 0, atk: anim === 'attack' ? f : -1 };
  ({ cobra, lamia, servant, guardian, ammit, sphinx, coffin, elemental })[P.kind](F, P, dir, a);
  return F;
}
const rows = (shape, y0, y1) => (set) => shape((x, y) => { if (y >= y0 && y < y1) set(x, y); });
// a nemes: the striped headdress, its stripes in bands across it
const stripes = (F, shape, y0, y1, a, b, every = 3) => { for (let y = y0; y < y1; y += every) F.part(rows(shape, y, y + Math.ceil(every / 2)), b, flat); void a; };

// ---------- cobras: coils on the ground, a neck rising to the spread hood; it strikes forward ----------
function cobra(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0, strike = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const coils = (x) => { F.part(ellipse(x, G - 3, 12, 4), P.scale); F.part(ellipse(x - 1, G - 6, 8, 3), P.scale); F.part(line(x - 9, G - 3, x + 8, G - 2, 1), P.band, flat); };
  if (dir === 'right') {
    coils(cx - 4);
    const hx = cx + 4 + strike + sway, hy = G - 26 + strike * 0.6;
    F.part(both(line(cx - 3, G - 7, cx + 1 + sway, G - 16, 5), line(cx + 1 + sway, G - 16, hx - 2, hy + 4, 4)), P.scale);
    F.part(ellipse(hx - 3, hy + 3, 2.5, 7), P.band); // the hood, edge on
    F.part(line(hx - 1, hy - 1, hx - 1, hy + 9, 1), P.belly, flat);
    F.part(both(ellipse(hx + 1, hy, 4.5, 3), ellipse(hx + 4, hy + 0.5, 3, 2)), P.scale); // the head, the snout
    F.dot(hx + 2, hy - 1, P.eye);
    if (atk >= 0) F.part(both(line(hx + 6, hy + 1, hx + 9, hy + 1, 1), line(hx + 9, hy + 1, hx + 10, hy, 1)), P.tongue, flat);
    return;
  }
  coils(cx);
  const front = dir === 'down', hy = G - 26 + (front ? strike * 0.8 : 0) + Math.abs(sway) * 0.5, hx = cx + sway;
  F.part(line(cx, G - 7, hx, hy + 6, 5), P.scale); // the neck
  const hood = poly([[hx - 10, hy + 3], [hx - 8, hy - 5], [hx, hy - 8], [hx + 8, hy - 5], [hx + 10, hy + 3], [hx + 5, hy + 10], [hx - 5, hy + 10]]);
  F.part(hood, front ? P.scale : P.band);
  if (front) {
    F.part(ellipse(hx, hy + 2, 4, 7), P.belly, flat); // the pale throat
    for (let y = hy - 2; y < hy + 8; y += 3) F.part(line(hx - 3, y, hx + 3, y, 1), P.band, flat);
    F.part(ellipse(hx, hy - 7, 4.5, 3.5), P.scale); // the head over the hood
    F.dot(hx - 2, hy - 8, P.eye); F.dot(hx + 2, hy - 8, P.eye);
    if (atk >= 0) F.part(line(hx, hy - 4, hx, hy - 1, 1), P.tongue, flat);
  } else {
    for (const s of [-1, 1]) F.part(ellipse(hx + s * 4, hy, 2, 2.5), P.belly, flat); // the spectacle mark on the back of its hood
    F.part(ellipse(hx, hy - 7, 4, 3), P.scale);
  }
}

// ---------- lamias: a serpent's coils below, a woman above in gold and red, long dark hair ----------
function lamia(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0, raise = atk >= 0 ? [4, 10, 12, 6][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  // the tail: a coil on the ground, its tip curling out, rising to the waist
  F.part(line(cx + (side ? -14 : 13), G - 3, cx + (side ? -20 : 19), G - 9 - sway, 3), P.tail);
  F.part(ellipse(cx, G - 4, 16, 5), P.tail);
  F.part(ellipse(cx - 2, G - 8, 11, 4), P.tail);
  if (!back) F.part(ellipse(cx + (side ? 4 : 0), G - 6, 6, 2.5), P.belly, flat);
  const wy = G - 22, sy = wy - 13, bx = cx + sway;
  F.part(poly([[cx - 7, G - 8], [cx + 7, G - 8], [bx + 5, wy], [bx - 5, wy]]), P.tail);
  if (!back) for (let y = wy + 3; y < G - 9; y += 3) F.part(line(bx - 3, y, bx + 3, y, 1), P.belly, flat);
  // hair behind
  F.part(poly([[bx - 6, sy - 9], [bx + 6, sy - 9], [bx + 8, sy + (back ? 12 : 7)], [bx - 8, sy + (back ? 12 : 7)]]), P.hair);
  // the body: bare, a red wrap at the hips, a gold breastplate and belt
  F.part(poly([[bx - 5, wy + 1], [bx + 5, wy + 1], [bx + 7, sy], [bx - 7, sy]]), P.skin);
  F.part(rect(bx - 6, wy - 2, bx + 6, wy + 1), P.cloth);
  F.part(line(bx - 6, wy - 3, bx + 6, wy - 3, 1), P.gold, flat);
  if (!back) { F.part(rect(bx - 6, sy + 3, bx + 6, sy + 6), P.gold); F.part(line(bx, sy + 3, bx, sy + 6, 1), P.cloth, flat); }
  // arms: one hanging, ringed in gold; the other raised to throw her venom
  if (side) {
    F.part(line(bx + 3, sy + 1, bx + 9, sy + 8 - raise, 3), P.skin);
    F.part(line(bx + 6, sy + 5 - raise * 0.5, bx + 7, sy + 6 - raise * 0.5, 1), P.gold, flat);
    if (atk >= 0) F.part(ellipse(bx + 10, sy + 6 - raise, 1.6, 1.6), P.eye, flat);
  } else {
    F.part(line(bx - 7, sy + 1, bx - 9, sy + 11, 3), P.skin);
    F.part(line(bx - 9, sy + 8, bx - 8, sy + 8, 1), P.gold, flat);
    F.part(line(bx + 7, sy + 1, bx + 10, sy + 11 - raise, 3), P.skin);
    if (atk >= 0 && !back) F.part(ellipse(bx + 10, sy + 11 - raise, 1.6, 1.6), P.eye, flat);
  }
  // the head: a gold band with a little cobra; dark eyes lined in kohl, green when she casts
  const hx = bx + (side ? 2 : 0), hy = sy - 6;
  F.part(ellipse(hx, hy, 5, 5.5), back ? P.hair : P.skin);
  F.part(ellipse(hx - (side ? 2 : 0), hy - 4, 5.5, 2.5), P.hair); // the fringe
  F.part(line(hx - 5, hy - 2, hx + 5, hy - 2, 1), P.gold, flat);
  if (back) return;
  F.dot(hx, hy - 3, P.cloth);
  const eye = atk >= 0 ? P.eye : '#2a1a10';
  if (side) F.dot(hx + 3, hy, eye); else { F.dot(hx - 2, hy, eye); F.dot(hx + 2, hy, eye); }
  F.part(line(hx - 1 + (side ? 3 : 0), hy + 3, hx + 1 + (side ? 3 : 0), hy + 3, 1), '#8a3a3a', flat);
}

// ---------- the Pharaoh's Servants: a robed skeleton priest, striped headdress, crystal staff, canopic jar ----------
function servant(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, lift = atk >= 0 ? [2, 6, 7, 3][atk] : 0, glow = atk >= 0 ? [1, 2, 3, 1.5][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 22 + bob, sh = G - 38 + bob;
  // the robe to the ground, gold-hemmed, a lapis panel down the front
  F.part(poly([[cx - 6, sh + 2], [cx + 6, sh + 2], [cx + 9 + step, G], [cx - 9 + step, G]]), P.robe);
  F.part(line(cx - 9 + step, G - 1, cx + 9 + step, G - 1, 1), P.gold, flat);
  if (!back && !side) { F.part(poly([[cx - 2, hip], [cx + 2, hip], [cx + 3, G - 2], [cx - 3, G - 2]]), P.lapis); for (let y = hip + 2; y < G - 2; y += 4) F.part(line(cx - 2, y, cx + 2, y, 1), P.gold, flat); }
  // the wrapped chest and a broad collar
  F.part(poly([[cx - 6, sh], [cx + 6, sh], [cx + 5, hip], [cx - 5, hip]]), P.wrap);
  for (let y = sh + 3; y < hip; y += 3) F.part(line(cx - 5, y, cx + 5, y + 1, 1), dark(P.wrap), flat);
  if (!back) { F.part(ellipse(cx, sh + 2, 8, 3.5), P.gold); F.part(ellipse(cx, sh + 2, 6, 2), P.lapis, flat); }
  // the staff (in its right hand) with the blue crystal, raised as it casts; the jar in the other
  const sx = side ? cx + 7 : cx + 9, top = G - 54 - lift;
  F.part(line(sx, top + 6, sx, G - 2 - lift, 1), P.gold, flat);
  F.part(line(cx + (side ? 2 : 5), sh + 3, sx, sh + 9 - lift, 2), P.bone); // the arm
  F.part(poly([[sx, top - 4], [sx + 3, top + 1], [sx, top + 6], [sx - 3, top + 1]]), P.crystal);
  F.dot(sx - 1, top, '#ffffff');
  if (glow) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + f; F.dot(sx + Math.cos(a) * (4 + glow), top + 1 + Math.sin(a) * (4 + glow), P.crystal); }
  if (!side) {
    F.part(line(cx - 5, sh + 3, cx - 9, sh + 12, 2), P.bone);
    F.part(both(rect(cx - 12, sh + 11, cx - 7, sh + 17), ellipse(cx - 9.5, sh + 10, 2.5, 2)), P.jar); // the jar, a jackal's head for its lid
    F.part(line(cx - 12, sh + 14, cx - 7, sh + 14, 1), P.lapis, flat);
  }
  // the head: a skull under a striped headdress, blue fire in its eyes
  const hx = cx + (side ? 2 : 0), hy = sh - 6;
  const nemes = poly([[hx - 8, hy + 7], [hx - 6, hy - 5], [hx, hy - 8], [hx + 6, hy - 5], [hx + 8, hy + 7]]);
  F.part(nemes, P.gold);
  stripes(F, nemes, hy - 6, hy + 7, P.gold, P.lapis);
  if (back) return;
  F.part(ellipse(hx + (side ? 2 : 0), hy + 1, 4.2, 5), P.bone);
  F.part(rect(hx - 5, hy - 4, hx + 5, hy - 3), P.gold, flat);
  if (side) F.part(ellipse(hx + 4, hy, 1.3, 1.3), P.eye, flat);
  else for (const s of [-1, 1]) F.part(ellipse(hx + s * 2, hy, 1.4, 1.4), '#0a1424', flat), F.dot(hx + s * 2, hy, P.eye);
  F.part(line(hx - 2 + (side ? 3 : 0), hy + 4, hx + 2 + (side ? 2 : 0), hy + 4, 1), '#3a3024', flat); // the teeth's line
}

// ---------- the Guardians: a jackal's or a falcon's head on a warrior in gold armour and a linen kilt;
// the Jackal Guardian thrusts its cursed spear, the Falcon Sentinel sweeps its glaive and beats its wings ----------
function guardian(F, P, dir, { G, W, step, walk, f, atk }) {
  const J = P.head === 'jackal', cx = W / 2, bob = walk && f % 2 ? -1 : 0;
  const side = dir === 'right', back = dir === 'up';
  const thrust = atk >= 0 ? [0, 4, 9, 3][atk] : 0, swing = atk >= 0 ? [-0.6, 0.4, 1.3, 0.6][atk] : -0.4;
  const hip = G - 24 + bob, sh = G - 42 + bob;
  // the Falcon's wings, folded at its back, spread as it strikes (the wind they make: mobs.js shot)
  if (!J) {
    const open = atk >= 0 ? [4, 10, 14, 8][atk] : walk ? 2 : 0;
    for (const s of side ? [-1] : [-1, 1]) {
      const wx = cx + s * 4 - (side ? 2 : 0);
      F.part(poly([[wx, sh + 2], [wx + s * (10 + open), sh - 8 - open * 0.6], [wx + s * (14 + open), sh + 6], [wx + s * (8 + open * 0.5), G - 16], [wx, hip]]), P.wing);
      for (let k = 0; k < 4; k++) F.part(line(wx + s * (4 + k * 2), sh + 2 + k * 3, wx + s * (10 + open + k), sh + 8 + k * 4, 1), light(P.wing), flat);
    }
  }
  // legs, sandalled
  if (side) { F.part(rect(cx - 3 + step * 2, hip, cx, G), P.skin); F.part(rect(cx - 1 - step * 2, hip, cx + 2 - step * 2, G), dark(P.skin)); }
  else for (const s of [-1, 1]) { F.part(rect(cx + s * 4 - 2 + s * step, hip, cx + s * 4 + 1 + s * step, G), P.skin); F.part(line(cx + s * 4 - 2 + s * step, G - 1, cx + s * 4 + 1 + s * step, G - 1, 1), P.armor, flat); }
  // the kilt: white linen, a gold belt, a striped front panel
  F.part(poly([[cx - 7, hip - 4], [cx + 7, hip - 4], [cx + 9, hip + 7], [cx - 9, hip + 7]]), P.kilt);
  F.part(rect(cx - 7, hip - 5, cx + 7, hip - 3), P.armor);
  if (!back && !side) { F.part(poly([[cx - 2, hip - 3], [cx + 2, hip - 3], [cx + 3, hip + 7], [cx - 3, hip + 7]]), P.trim); for (let y = hip - 1; y < hip + 7; y += 3) F.part(line(cx - 2, y, cx + 2, y, 1), P.armor, flat); }
  // the body in gold scale, the gem on its chest; shoulder plates
  F.part(poly([[cx - 8, sh], [cx + 8, sh], [cx + 6, hip - 4], [cx - 6, hip - 4]]), P.armor);
  for (let y = sh + 4; y < hip - 5; y += 3) F.part(line(cx - 6, y, cx + 6, y, 1), dark(P.armor), flat);
  if (!back && !side) { F.part(ellipse(cx, sh + 4, 7, 3), P.trim); F.part(ellipse(cx, sh + 7, 2.5, 2.5), P.gem); }
  for (const s of side ? [1] : [-1, 1]) F.part(ellipse(cx + s * 8 - (side ? 6 : 0), sh + 2, 4, 3), P.armor);
  // the weapon: a long spear (the Jackal's, a dark blade) or a glaive (the Falcon's, a great curved blade)
  if (side) {
    const y = sh + 8, x0 = cx - 12 + thrust, x1 = cx + 16 + thrust;
    F.part(line(cx + 2, sh + 3, cx + 8 + thrust * 0.6, y, 3), P.skin); // the arm
    if (J) { F.part(line(x0, y, x1, y, 1), P.shaft, flat); F.part(poly([[x1, y - 2], [x1 + 7, y], [x1, y + 2]]), P.metal); F.part(line(x1 - 2, y - 2, x1 - 2, y + 2, 1), P.gem, flat); }
    else {
      const a = swing, ex = cx + 8 + Math.cos(a) * 18, ey = y - Math.sin(a) * 18;
      F.part(line(cx + 2 - Math.cos(a) * 8, y + Math.sin(a) * 8, ex, ey, 1), P.shaft, flat);
      F.part(poly([[ex, ey], [ex + Math.cos(a + 1.2) * 8, ey - Math.sin(a + 1.2) * 8], [ex + Math.cos(a) * 9, ey - Math.sin(a) * 9]]), P.metal);
    }
  } else {
    const hx = cx + (back ? -11 : 11), top = G - 64 + (back ? 0 : thrust * 0.6);
    F.part(line(cx + (back ? -7 : 7), sh + 3, hx, sh + 12, 3), P.skin);
    F.part(line(hx, top + 8, hx, G - 3 + (back ? 0 : thrust * 0.5), 1), P.shaft, flat);
    if (J) { F.part(poly([[hx - 2, top + 8], [hx, top], [hx + 2, top + 8]]), P.metal); F.part(line(hx - 2, top + 9, hx + 2, top + 9, 1), P.gem, flat); }
    else F.part(poly([[hx, top + 10], [hx + 1, top], [hx + 7, top + 3], [hx + 4, top + 10]]), P.metal);
    F.part(line(cx + (back ? 7 : -7), sh + 3, cx + (back ? 9 : -9), hip - 2, 3), P.skin);
  }
  // the head
  const hx = cx + (side ? 2 : 0), hy = sh - 7;
  if (J) {
    // its hair falling to the shoulders (after the owner's picture), behind the head
    for (const s of side ? [-1] : [-1, 1]) F.part(poly([[hx + s * 3 - (side ? 1 : 0), hy], [hx + s * 6, hy], [hx + s * 8, hy + 10], [hx + s * 4, hy + 10]]), P.hair || dark(P.fur));
    // tall ears, a long dark muzzle, purple eyes; a gold and lapis band on the brow
    for (const s of side ? [-1] : [-1, 1]) F.part(poly([[hx + s * 2 - (side ? 1 : 0), hy - 3], [hx + s * 6 - (side ? 2 : 0), hy - 15], [hx + s * 7 - (side ? 1 : 0), hy - 2]]), P.fur);
    F.part(ellipse(hx, hy, 5.5, 5), P.fur);
    if (side) F.part(poly([[hx + 2, hy - 1], [hx + 11, hy + 2], [hx + 10, hy + 4], [hx + 2, hy + 4]]), P.fur);
    else if (!back) { F.part(ellipse(hx, hy + 4, 3, 3.5), light(P.fur)); F.dot(hx, hy + 6, '#0a080c'); }
    F.part(line(hx - 5, hy - 3, hx + 5, hy - 3, 1), P.armor, flat);
    if (!back) { if (side) F.dot(hx + 3, hy - 1, P.eye); else { F.dot(hx - 2, hy - 1, P.eye); F.dot(hx + 2, hy - 1, P.eye); } F.dot(hx, hy - 3, P.trim); }
  } else {
    // a falcon's round head, the pale face with the dark eye-stripe, the hooked gold beak, a small gold crown
    F.part(ellipse(hx, hy, 5.5, 5.5), P.fur);
    if (!back) F.part(ellipse(hx + (side ? 2 : 0), hy + 1, 3.5, 3.5), P.face, flat);
    if (side) { F.part(poly([[hx + 4, hy - 1], [hx + 9, hy], [hx + 8, hy + 3], [hx + 5, hy + 2]]), P.beak); F.dot(hx + 3, hy - 1, P.eye); F.part(line(hx + 3, hy, hx + 2, hy + 4, 1), '#2a1a10', flat); }
    else if (!back) {
      F.part(poly([[hx - 1.5, hy + 1], [hx + 1.5, hy + 1], [hx, hy + 5]]), P.beak);
      for (const s of [-1, 1]) { F.dot(hx + s * 2, hy - 1, P.eye); F.part(line(hx + s * 2, hy, hx + s * 3, hy + 3, 1), '#2a1a10', flat); }
    }
    F.part(ellipse(hx, hy - 7, 3, 1.5), P.armor); F.dot(hx, hy - 9, P.gem);
  }
}

// ---------- Ammit the Devourer: a crocodile's head under a gold headdress, a lion's mane and clawed arms,
// a crocodile's tail; it rears and snaps ----------
function ammit(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -2 : 0, claw = atk >= 0 ? [6, 14, 4, 0][atk] : 0, gape = atk >= 0 ? [2, 5, 7, 3][atk] : 1.5;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 26 + bob, sh = G - 52 + bob;
  // the tail: a crocodile's, ridged, sweeping round behind
  const tail = side ? [[cx - 8, hip + 4], [cx - 20, hip + 10], [cx - 32, G - 6], [cx - 40, G - 10]] : [[cx + 6, hip + 6], [cx + 20, G - 6], [cx + 32, G - 4], [cx + 38, G - 10]];
  for (let i = 0; i < tail.length - 1; i++) F.part(line(...tail[i], ...tail[i + 1], 7 - i * 2), P.croc);
  for (let i = 0; i < 5; i++) { const t = i / 5, [x0, y0] = tail[Math.floor(t * 3)], [x1, y1] = tail[Math.floor(t * 3) + 1]; F.part(poly([[x0 + (x1 - x0) * 0.5 - 2, y0 + (y1 - y0) * 0.5 - 3], [x0 + (x1 - x0) * 0.5 + 2, y0 + (y1 - y0) * 0.5 - 3], [x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5 - 7]]), P.scute); }
  // the legs: a lion's hind legs, thick, three dark claws
  for (const s of side ? [-1, 1] : [-1, 1]) {
    const lx = cx + (side ? s * 4 - 2 : s * 9) + (side ? s * step * 3 : s * step);
    F.part(both(ellipse(lx, hip + 6, 6, 8), rect(lx - 4, hip + 8, lx + 3, G - 2)), side && s < 0 ? dark(P.fur) : P.fur);
    for (const t of [-3, 0, 3]) F.part(line(lx + t, G - 2, lx + t + 1, G, 1), P.claw, flat);
  }
  // the body: a lion's, the mane a great jagged ruff round the shoulders
  F.part(ellipse(cx, hip - 8, 14, 14), P.fur);
  if (!back) F.part(ellipse(cx + (side ? 4 : 0), hip - 6, 7, 9), light(P.fur), flat);
  const mane = [];
  const mx = cx + (side ? 4 : 0), my = sh + 6;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 1 : 1.25; mane.push([mx + Math.cos(a) * 18 * r, my + Math.sin(a) * 14 * r]); }
  F.part(poly(mane), P.mane);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; F.part(line(mx + Math.cos(a) * 8, my + Math.sin(a) * 6, mx + Math.cos(a) * 17, my + Math.sin(a) * 13, 1), dark(P.mane), flat); }
  // the arms: a lion's, raking down (raised on the attack), great pale claws
  const arm = (s, x0, y0) => {
    const ex = x0 + s * 6 + (side ? 8 : 0), ey = y0 + 18 - claw;
    F.part(line(x0, y0, ex, ey, 6), P.fur);
    F.part(ellipse(ex, ey + 2, 4.5, 4), P.fur);
    for (const t of [-3, 0, 3]) F.part(line(ex + t, ey + 4, ex + t + s, ey + 9, 1), P.claw, flat);
  };
  if (side) arm(1, cx + 8, sh + 12); else if (!back) { arm(-1, cx - 12, sh + 12); arm(1, cx + 12, sh + 12); }
  // the head: a crocodile's, under a gold-and-lapis headdress with gold discs at the sides
  const hx = cx + (side ? 10 : 0), hy = sh - 2;
  const crown = poly([[hx - 12, hy + 4], [hx - 10, hy - 8], [hx, hy - 13], [hx + 10, hy - 8], [hx + 12, hy + 4]]);
  if (back) {
    F.part(crown, P.gold);
    for (let y = hy - 10; y < hy + 4; y += 4) F.part(rows(crown, y, y + 2), P.lapis, flat);
    return;
  }
  if (side) {
    F.part(ellipse(hx - 2, hy, 9, 8), P.croc);
    F.part(poly([[hx + 2, hy - 4], [hx + 22, hy - 2 - gape * 0.4], [hx + 22, hy + 1], [hx + 2, hy + 2]]), P.croc); // the upper jaw
    F.part(poly([[hx + 2, hy + 3], [hx + 20, hy + 3 + gape], [hx + 20, hy + 6 + gape], [hx + 2, hy + 8]]), P.croc); // the lower
    F.part(poly([[hx + 4, hy + 2], [hx + 20, hy + 1], [hx + 20, hy + 3 + gape], [hx + 4, hy + 3]]), P.mouth);
    for (let i = 0; i < 6; i++) { F.part(poly([[hx + 6 + i * 2.6, hy + 1], [hx + 7.4 + i * 2.6, hy + 1], [hx + 6.7 + i * 2.6, hy + 3]]), P.teeth, flat); F.part(poly([[hx + 6 + i * 2.6, hy + 3 + gape], [hx + 7.4 + i * 2.6, hy + 3 + gape], [hx + 6.7 + i * 2.6, hy + 1.5 + gape]]), P.teeth, flat); }
    F.part(rows(crown, hy - 13, hy - 2), P.gold);
    for (let y = hy - 10; y < hy - 2; y += 4) F.part(rows(crown, y, y + 2), P.lapis, flat);
    F.part(ellipse(hx - 4, hy + 2, 3.5, 3.5), P.gold); // the disc at its ear
    F.dot(hx + 2, hy - 3, P.eye); F.dot(hx + 3, hy - 3, '#1a1008');
    return;
  }
  // facing you: the long snout toward you, the lower jaw dropping open under it, teeth along both
  F.part(ellipse(hx, hy - 3, 10, 7), P.croc);
  for (const s of [-1, 1]) { F.part(ellipse(hx + s * 5, hy - 6, 3, 2.5), P.croc); F.part(ellipse(hx + s * 5, hy - 6, 1.6, 1.3), P.eye, flat); F.dot(hx + s * 5, hy - 6, '#1a1008'); }
  F.part(poly([[hx - 6, hy + 9 + gape], [hx + 6, hy + 9 + gape], [hx + 5, hy + 18 + gape], [hx - 5, hy + 18 + gape]]), P.croc); // the lower jaw
  F.part(ellipse(hx, hy + 14 + gape, 3, 3), P.belly, flat);
  F.part(poly([[hx - 5.5, hy + 8], [hx + 5.5, hy + 8], [hx + 5, hy + 11 + gape], [hx - 5, hy + 11 + gape]]), P.mouth);
  for (let i = 0; i < 4; i++) F.part(poly([[hx - 4.5 + i * 3, hy + 10 + gape], [hx - 2.5 + i * 3, hy + 10 + gape], [hx - 3.5 + i * 3, hy + 7.5 + gape]]), P.teeth, flat); // the lower teeth, up
  F.part(poly([[hx - 7, hy - 1], [hx + 7, hy - 1], [hx + 6, hy + 11], [hx - 6, hy + 11]]), P.croc); // the snout
  for (let y = hy + 1; y < hy + 10; y += 3) F.part(line(hx - 3, y, hx + 3, y, 1), P.scute, flat);
  for (const s of [-1, 1]) F.dot(hx + s * 2, hy + 9, '#1a1008'); // its nostrils
  for (let i = 0; i < 5; i++) F.part(poly([[hx - 5.5 + i * 2.6, hy + 11], [hx - 3.7 + i * 2.6, hy + 11], [hx - 4.6 + i * 2.6, hy + 13.5]]), P.teeth, flat); // the upper teeth, down
  const top = poly([[hx - 11, hy - 6], [hx - 8, hy - 14], [hx, hy - 18], [hx + 8, hy - 14], [hx + 11, hy - 6]]);
  F.part(top, P.gold);
  for (let y = hy - 15; y < hy - 6; y += 4) F.part(rows(top, y, y + 2), P.lapis, flat);
  for (const s of [-1, 1]) F.part(ellipse(hx + s * 12, hy - 2, 3.5, 3.5), P.gold); // the gold discs at its ears
}

// ---------- sphinxes: a winged lion in a striped headdress, a calm face. The cubs are small and quick;
// the Eternal Sphinx (k: its size) wears a jewelled collar and spreads its wings when it strikes ----------
function sphinx(F, P, dir, { G, W, step, walk, f, atk }) {
  const k = P.k, cx = W / 2, bob = walk && f % 2 ? -1 * k : 0;
  const spread = atk >= 0 ? [0.3, 0.9, 1, 0.6][atk] : walk ? 0.15 : 0, paw = atk >= 0 ? [2, 7, 3, 0][atk] * k : 0;
  const side = dir === 'right', back = dir === 'up';
  const wing = (s, ox, oy) => { // a feathered wing from (ox, oy): folded up and back, or spread wide
    const sp = Math.max(spread, P.mvp ? 0.3 : 0.1); // (the Eternal Sphinx holds its wings half raised)
    const L = (14 + sp * 6) * k, a = -Math.PI / 2 + s * (0.35 + sp * 0.9);
    const tx = ox + Math.cos(a) * L, ty = oy + Math.sin(a) * L * 0.95;
    const pts = [[ox, oy], [tx, ty], [tx + s * 4 * k, ty + 5 * k], [ox + s * (6 + sp * 8) * k, oy + 8 * k], [ox + s * 2 * k, oy + 6 * k]];
    F.part(poly(pts), P.wing);
    for (let i = 1; i <= 4; i++) { // the long feathers, gold-tipped
      const t = i / 5, px = ox + (tx - ox) * t, py = oy + (ty - oy) * t;
      F.part(line(px, py, px + s * (4 + sp * 6) * k, py + 7 * k, Math.max(1, Math.round(k))), dark(P.wing), flat);
      F.part(ellipse(px + s * (4 + sp * 6) * k, py + 7 * k, 0.5 * k, 0.5 * k), P.tip, flat);
    }
    F.part(line(ox, oy, tx, ty, Math.max(1, Math.round(k * 0.8))), P.tip, flat);
  };
  const nemesFront = (hx, hy) => { // the headdress round the face and its lappets to the chest
    const shape = poly([[hx - 7 * k, hy + 9 * k], [hx - 7.5 * k, hy - 3 * k], [hx - 4 * k, hy - 7 * k], [hx + 4 * k, hy - 7 * k], [hx + 7.5 * k, hy - 3 * k], [hx + 7 * k, hy + 9 * k]]);
    F.part(shape, P.gold);
    stripes(F, shape, hy - 6 * k, hy + 9 * k, P.gold, P.lapis, Math.max(2, Math.round(2.4 * k)));
    F.part(ellipse(hx, hy + 1 * k, 4.2 * k, 4.6 * k), P.face);
    F.part(line(hx - 4 * k, hy - 3 * k, hx + 4 * k, hy - 3 * k, Math.max(1, Math.round(k * 0.7))), P.gold, flat);
    F.dot(hx, hy - 5 * k, '#c83a2a'); // the cobra on the brow
    if (P.mvp) for (const s of [-1, 1]) { // a calm, kohl-lined face, golden eyes
      F.part(line(hx + s * 0.8 * k, hy - 1.2 * k, hx + s * 3 * k, hy - 1.0 * k, Math.round(k * 0.5)), '#4a3420', flat); // the brow
      F.part(ellipse(hx + s * 1.9 * k, hy + 0.2 * k, 1.1 * k, 0.55 * k), '#f6eedc', flat);
      F.part(ellipse(hx + s * 1.9 * k, hy + 0.2 * k, 0.5 * k, 0.5 * k), P.eye, flat);
      F.dot(hx + s * 1.9 * k, hy + 0.2 * k, '#1a1008');
      F.part(line(hx + s * 0.8 * k, hy + 0.8 * k, hx + s * 3.3 * k, hy + 0.4 * k, 1), '#1a1008', flat); // the kohl
    } else for (const s of [-1, 1]) F.part(rect(hx + s * 1.8 * k - k * 0.5, hy, hx + s * 1.8 * k + k * 0.5, hy + k * 0.6), P.eye, flat);
    F.part(line(hx, hy + 0.6 * k, hx, hy + 2.2 * k, Math.max(1, Math.round(k * 0.4))), dark(P.face), flat); // the nose
    F.part(line(hx - 1 * k, hy + 3.3 * k, hx + 1 * k, hy + 3.3 * k, Math.max(1, Math.round(k * 0.4))), '#8a5a3a', flat);
    if (P.mvp) F.part(rect(hx - 0.6 * k, hy + 5 * k, hx + 0.6 * k, hy + 7.5 * k), P.gold); // the braided beard
  };
  if (side) {
    // the far legs, the body, the tail, the near legs; the wing over the back; the head raised at the front
    const by = G - 12 * k + bob, bx = cx - 4 * k;
    const leg = (x, ph, col) => { F.part(line(x, by, x + ph * 2 * k, G - 1, Math.max(2, Math.round(2.6 * k))), col); F.part(ellipse(x + ph * 2 * k + 0.8 * k, G - 1, 2.2 * k, 1.2 * k), col); };
    leg(bx - 7 * k, -step, P.shade); leg(bx + 7 * k, step, P.shade);
    F.part(both(line(bx - 11 * k, by - 1 * k, bx - 17 * k, by - 7 * k, Math.max(1, Math.round(k))), line(bx - 17 * k, by - 7 * k, bx - 15 * k, by - 11 * k, Math.max(1, Math.round(k)))), P.shade, flat); // the tail
    F.part(ellipse(bx - 15 * k, by - 12 * k, 1.8 * k, 1.8 * k), P.shade);
    F.part(ellipse(bx, by - 2 * k, 12 * k, 6.5 * k), P.fur);
    F.part(ellipse(bx + 2 * k, by + 1 * k, 9 * k, 3 * k), light(P.fur), flat);
    leg(bx - 6 * k, step, P.fur); leg(bx + 8 * k + paw * 0.4, -step - paw / (4 * k), P.fur);
    wing(-1, bx + 2 * k, by - 6 * k);
    const hx = bx + 12 * k + paw * 0.2, hy = by - 11 * k;
    if (P.mvp) { F.part(ellipse(bx + 9 * k, by - 4 * k, 4 * k, 5 * k), P.gold); F.part(ellipse(bx + 9 * k, by - 4 * k, 2.6 * k, 3.6 * k), P.lapis, flat); }
    const shape = poly([[hx - 6 * k, hy + 8 * k], [hx - 6.5 * k, hy - 3 * k], [hx - 2 * k, hy - 7 * k], [hx + 4 * k, hy - 6 * k], [hx + 5 * k, hy - 2 * k], [hx + 2 * k, hy + 6 * k]]);
    F.part(shape, P.gold);
    stripes(F, shape, hy - 6 * k, hy + 8 * k, P.gold, P.lapis, Math.max(2, Math.round(2.4 * k)));
    F.part(ellipse(hx + 2.4 * k, hy + 0.5 * k, 3 * k, 4.2 * k), P.face);
    F.part(rect(hx + 3 * k, hy - 0.5 * k, hx + 4 * k, hy), P.eye, flat);
    F.dot(hx + 4.5 * k, hy - 5 * k, '#c83a2a');
    return;
  }
  // facing you, or from behind: the body behind, the wings out to each side, the forelegs, the head
  const by = G - 10 * k + bob;
  if (!back) for (const s of [-1, 1]) wing(s, cx + s * 6 * k, by - 10 * k);
  F.part(ellipse(cx, by - 4 * k, 11 * k, 8 * k), P.shade); // the haunches
  if (back) {
    F.part(both(line(cx + 6 * k, by + 2 * k, cx + 13 * k, by - 2 * k, Math.max(1, Math.round(k))), line(cx + 13 * k, by - 2 * k, cx + 12 * k, by - 7 * k, Math.max(1, Math.round(k)))), P.shade, flat);
    F.part(ellipse(cx + 12 * k, by - 8 * k, 1.8 * k, 1.8 * k), P.shade);
  }
  F.part(ellipse(cx, by - 8 * k, 9 * k, 8 * k), P.fur); // the chest
  if (!back) F.part(ellipse(cx, by - 6 * k, 5 * k, 5 * k), light(P.fur), flat);
  for (const s of [-1, 1]) { // the forelegs, a paw raised to strike
    const up = s > 0 ? paw : 0, lx = cx + s * 5 * k + (s * step * k * 0.5);
    F.part(rect(lx - 2.2 * k, by - 4 * k - up, lx + 2.2 * k, G - 2 - up), P.fur);
    F.part(ellipse(lx, G - 1.5 - up, 3 * k, 1.8 * k), P.fur);
    for (const t of [-1, 0, 1]) F.dot(lx + t * 1.4 * k, G - 0.5 - up, P.mvp ? '#f6eedc' : dark(P.fur));
    if (P.mvp) F.part(rect(lx - 2.2 * k, by - 2 * k - up, lx + 2.2 * k, by - 1 * k - up), P.gold, flat); // gold bands on its legs
  }
  if (back) for (const s of [-1, 1]) wing(s, cx + s * 5 * k, by - 10 * k);
  const hx = cx, hy = by - 17 * k;
  if (P.mvp && !back) { // the jewelled collar
    F.part(ellipse(cx, by - 11 * k, 8 * k, 3.2 * k), P.gold);
    F.part(ellipse(cx, by - 11 * k, 6.2 * k, 2 * k), P.lapis, flat);
    F.part(ellipse(cx, by - 11 * k, 4.2 * k, 1 * k), P.teal, flat);
    F.part(ellipse(cx, by - 8 * k, 1.4 * k, 1.8 * k), P.gold); // the scarab pendant
  }
  if (back) {
    const shape = poly([[hx - 7 * k, hy + 8 * k], [hx - 7.5 * k, hy - 3 * k], [hx - 4 * k, hy - 7 * k], [hx + 4 * k, hy - 7 * k], [hx + 7.5 * k, hy - 3 * k], [hx + 7 * k, hy + 8 * k]]);
    F.part(shape, P.gold);
    stripes(F, shape, hy - 6 * k, hy + 8 * k, P.gold, P.lapis, Math.max(2, Math.round(2.4 * k)));
    F.part(rect(hx - 1.5 * k, hy + 8 * k, hx + 1.5 * k, hy + 11 * k), P.gold); // the tail of the cloth
    return;
  }
  nemesFront(hx, hy);
}

// ---------- the walking Sarcophagi: a gold-masked coffin in lapis and gold, arms crossed; it hops, and
// its lid swings open on the dark inside, wrapped hands reaching out ----------
function coffin(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, hop = walk ? [0, -3, -1, 0][f] : 0, open = atk >= 0 ? [0.3, 0.8, 1, 0.5][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const y0 = G - 54 + hop, y1 = G + hop;
  const body = (dx = 0, wide = 1) => poly([[cx + dx - 7 * wide, y0 + 10], [cx + dx - 8 * wide, y0 + 4], [cx + dx - 4 * wide, y0], [cx + dx + 4 * wide, y0], [cx + dx + 8 * wide, y0 + 4], [cx + dx + 7 * wide, y0 + 10], [cx + dx + 9 * wide, y0 + 22], [cx + dx + 6 * wide, y1 - 2], [cx + dx - 6 * wide, y1 - 2], [cx + dx - 9 * wide, y0 + 22]]);
  if (side) {
    F.part(poly([[cx - 5, y0 + 2], [cx + 3, y0], [cx + 7, y0 + 10], [cx + 6, y1 - 2], [cx - 5, y1 - 2]]), P.wood);
    F.part(poly([[cx + 1, y0 + 1], [cx + 5, y0], [cx + 8 + open * 6, y0 + 10], [cx + 7 + open * 8, y1 - 3], [cx + 2, y1 - 3]]), P.lapis); // the lid's edge, swinging out
    for (let y = y0 + 14; y < y1 - 4; y += 8) F.part(line(cx - 4, y, cx + 6 + open * 6, y, 1), P.gold, flat);
    F.part(ellipse(cx + 5 + open * 4, y0 + 7, 3, 4), P.gold);
    if (open > 0.4) F.part(line(cx + 6, y0 + 22, cx + 14, y0 + 20 - open * 4, 2), P.wrap); // a hand reaching out
    return;
  }
  if (back) {
    F.part(body(), P.wood);
    for (let y = y0 + 14; y < y1 - 4; y += 8) F.part(rows(body(), y, y + 2), P.gold, flat);
    F.part(line(cx, y0 + 4, cx, y1 - 4, 1), dark(P.wood), flat);
    return;
  }
  if (open > 0) { // the dark inside, a mummy's glowing eyes and hands; the lid swung aside
    F.part(body(), P.inside);
    F.dot(cx - 2, y0 + 8, P.eye); F.dot(cx + 2, y0 + 8, P.eye);
    for (const s of [-1, 1]) F.part(line(cx + s * 3, y0 + 22, cx + s * (6 + open * 8), y0 + 26 + open * 4, 2), P.wrap);
    const dx = 6 + open * 9;
    F.part(body(dx, 0.85), P.lapis);
    F.part(ellipse(cx + dx, y0 + 7, 4, 5), P.gold);
    for (let y = y0 + 14; y < y1 - 4; y += 7) F.part(rows(body(dx, 0.85), y, y + 2), P.gold, flat);
    return;
  }
  // shut: the lapis case, gold bands, the striped headdress and gold mask, arms crossed with crook and flail
  const b = body();
  F.part(b, P.lapis);
  for (let y = y0 + 26; y < y1 - 4; y += 6) F.part(rows(b, y, y + 2), y % 12 < 6 ? P.gold : P.teal, flat);
  const nem = poly([[cx - 8, y0 + 14], [cx - 8, y0 + 4], [cx - 4, y0], [cx + 4, y0], [cx + 8, y0 + 4], [cx + 8, y0 + 14]]);
  F.part(nem, P.gold);
  stripes(F, nem, y0 + 1, y0 + 14, P.gold, P.lapis);
  F.part(ellipse(cx, y0 + 7, 4, 5), P.gold);
  F.dot(cx - 2, y0 + 6, P.eye); F.dot(cx + 2, y0 + 6, P.eye);
  F.part(rect(cx - 1, y0 + 12, cx + 1, y0 + 15), P.gold); // the beard
  F.part(ellipse(cx, y0 + 18, 8, 3), P.teal); // the collar
  for (const s of [-1, 1]) F.part(line(cx + s * 6, y0 + 20, cx - s * 4, y0 + 25, 2), P.gold); // the arms crossed
  F.part(line(cx - 5, y0 + 23, cx - 7, y0 + 17, 1), P.gold, flat); F.part(line(cx + 5, y0 + 23, cx + 7, y0 + 17, 1), P.lapis, flat);
}

// ---------- Sand Elementals: a whirlwind of sand, a head of packed sand with two burning eyes, fists of
// stone, pebbles circling it ----------
function elemental(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, spin = f * 0.8 + (walk ? 0.4 : 0), slam = atk >= 0 ? [8, 14, -2, 2][atk] : 0;
  const back = dir === 'up', side = dir === 'right';
  // the funnel: narrow at the ground, widening up into the body
  for (let i = 0; i < 7; i++) {
    const t = i / 6, y = G - 2 - t * 30, r = 4 + t * 9, wob = Math.sin(spin + i * 1.3) * 2;
    F.part(ellipse(cx + wob, y, r, 3 + t * 2), i % 2 ? P.sand : P.dark);
  }
  for (let i = 0; i < 6; i++) { const t = i / 6, y = G - 4 - t * 28, r = 4 + t * 9; F.part(line(cx - r + Math.sin(spin + i) * 2, y, cx + r * 0.4 + Math.sin(spin + i) * 2, y - 2, 1), light(P.sand), flat); }
  // the body and head of packed sand
  const hy = G - 44;
  F.part(ellipse(cx, G - 34, 11, 8), P.sand);
  F.part(ellipse(cx, hy, 8, 7), P.sand);
  F.part(ellipse(cx - 2, hy - 2, 5, 3), light(P.sand), flat);
  if (!back) {
    const ex = side ? 3 : 0;
    if (side) F.part(ellipse(cx + 4, hy, 1.6, 1.4), P.eye, flat);
    else for (const s of [-1, 1]) { F.part(ellipse(cx + s * 3 + ex, hy, 1.6, 1.4), P.eye, flat); F.dot(cx + s * 3 + ex, hy, P.core); }
  }
  // the fists of stone, raised then brought down
  for (const s of side ? [1] : [-1, 1]) {
    const fx = cx + s * 14 + (side ? 2 : 0), fy = G - 30 - slam;
    F.part(line(cx + s * 8, G - 36, fx, fy, 3), P.dark);
    F.part(ellipse(fx, fy, 4.5, 4), P.rock);
    F.part(line(fx - 2, fy - 1, fx + 1, fy - 2, 1), light(P.rock), flat);
  }
  // pebbles circling
  for (let i = 0; i < 5; i++) { const a = spin * 1.4 + (i / 5) * Math.PI * 2; F.dot(cx + Math.cos(a) * 16, G - 20 + Math.sin(a) * 5, i % 2 ? P.rock : P.dark); }
}
