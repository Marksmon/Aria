// Sprite designs for the Assassin's crosses, male and female, painted in code on the bald bodies' frame
// like the other second jobs (bladers.js, rangers.js, mages.js), so the shared head and hair go on top
// (docs/character-standard.md). Each after the owner's sheet, and each its own cut, not a recolour:
// - Shadowblade (Blader + Assassin): black leathers under a long black coat whose torn tails burn with
//   violet shadow-flame, a high collar, layered black plate pauldrons edged in silver, crossed chains
//   at the hip, plated knee boots, and a long violet-glowing sword (held point down, swung like a
//   Blader's). She is sleeveless in long black gloves, a strap round one thigh, the coat a torn
//   half-skirt behind, tall heeled boots.
// - Hunter (Archer + Assassin): black and blood red. A long black coat lined in red, its tails torn
//   into red points, a red-gem rose at the throat, silver chains crossed over the chest, red-trimmed
//   spiked pauldrons, a quiver of red arrows on the back, and a black and red bow with hooked tips.
//   She has bare shoulders, long gloves, a thigh strap and heeled boots.
// - Voodoo (Sorcerer + Assassin): black over toxic green. A long ragged black coat whose torn edges
//   glow green, chains hanging from the belt with a skull lantern, skull charms, bone-white trim, and
//   a staff topped by a skull in a spiked ring, green fire in its eyes (raised to cast). She wears a
//   black bodice, chains and a torn skirt.
// Standing, walking (8 frames) and attacking (7: a sword cut, a shot, a cast), 8 directions: the left
// ones are the right ones mirrored. The game paints the hero's body from these (sprites.js designSet).
// Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SHOOT, LOOSE, SWING, SLASH, CAST, behind, recurve, swordArm, slashArc, burst, animFrames, VIEWS, turn, STRIDE, ARM_SWING, ARM_SWAY, LIFT } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const SHADOW = {
  weapon: 'sword', coat: '#2e2840', coatDk: '#1a1624', accent: '#7c34ee', accentDk: '#4c1e9a', glow: '#b46aff', glow2: '#e2c8ff',
  shirt: '#221e2e', pants: '#24202e', boot: '#1e1a28', plate: '#4c4464', plateLt: '#7e749c', trim: '#d8d4e8', chain: '#b0acc0',
  gem: '#c46aff', gemHi: '#f4e8ff', skin: '#f2c8a2', glove: '#1a1622', strap: '#3a3048',
  blade: { sleeve: '#2e2840', glove: '#1a1622', blade: '#a070f0', edge: '#f4ecff', guard: '#d0cce0', gem: '#c46aff', arc: '#d8b8ff', arc2: '#8a3aff' },
};
const HUNTER = {
  weapon: 'bow', coat: '#30202a', coatDk: '#1a1014', accent: '#c81a26', accentDk: '#7a0c16', glow: null,
  shirt: '#261a1e', pants: '#281c20', boot: '#22161a', plate: '#46323a', plateLt: '#745860', trim: '#e8525a', chain: '#d0d4dc',
  gem: '#ff2a3a', gemHi: '#ffd0d4', skin: '#f2c8a2', glove: '#1e1216', strap: '#4a2026', quiver: '#6a2a30', feathers: ['#ff3a44', '#ffffff', '#ff3a44'],
  bow: { wood: '#5a1c24', light: '#ff6a6a', grip: '#c81a26', string: '#ffe8e8', arrow: '#2a1a1c', tip: '#ff5a5a', fletch: '#ff3a44' },
};
const VOODOO = {
  weapon: 'staff', coat: '#262a26', coatDk: '#141614', accent: '#38a832', accentDk: '#1e5e1c', glow: '#7aff4a', glow2: '#d8ffc8',
  shirt: '#1e221e', pants: '#202420', boot: '#1a1e1a', plate: '#3c423c', plateLt: '#66706a', trim: '#e0dccc', chain: '#a8b0a8',
  gem: '#7aff4a', gemHi: '#e8ffd8', skin: '#f2c8a2', glove: '#181a18', strap: '#3a3a30', bone: '#ece6d2', shaft: '#4a4a42',
};
export const CROSSES = {
  shadowbladeM: { name: 'Shadowblade', sex: 'm', C: SHADOW },
  shadowbladeF: { name: 'Shadowblade', sex: 'f', C: SHADOW },
  hunterM: { name: 'Hunter', sex: 'm', C: HUNTER },
  hunterF: { name: 'Hunter', sex: 'f', C: HUNTER },
  voodooM: { name: 'Voodoo', sex: 'm', C: VOODOO },
  voodooF: { name: 'Voodoo', sex: 'f', C: VOODOO },
};

const flat = { outline: false, flat: true };
const soft = { outline: false };
let P = REST;
const lerp = (a, b, k) => a + (b - a) * k;
const atk = () => P.atk >= 0;
const raised = () => (atk() ? SHOOT.raise[P.atk] : 0);
const drawn = () => (atk() ? SHOOT.draw[P.atk] : 0);
const lift = () => (atk() ? CAST.lift[P.atk] : 0);

function build(o) {
  const f = o.sex === 'f';
  return f ? { f, W: 10, waist: 6, hip: 9, legs: [[-6, -2], [2, 6]], knee: 36, hem: 50 }
    : { f, W: 12, waist: 9, hip: 9, legs: [[-7, -2], [2, 7]], knee: 40, hem: 54 };
}

function paint(o, view, cx, cy) {
  const F = new Frame(BW, BH);
  if (view === 'side') return side(F, o, cx, cy);
  const back = view === 'back' || view === 'back3';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0;
  const r = view === 'front3' || view === 'back3' ? 3 : 0;
  return back ? backView(F, o, cx, cy, s, r) : frontView(F, o, cx, cy, s, r);
}

// a torn hem: zigzag points from x1 back to x0 along y, n tears, each `deep` pixels
const jag = (x0, x1, y, n, deep) => Array.from({ length: n * 2 + 1 }, (_, i) => [x1 + ((x0 - x1) * i) / (n * 2), y - (i % 2 ? deep : 0) + (i % 4 === 2 ? 2 : 0)]);
// a piece of the coat with a torn, accent-coloured edge (and, for the Shadowblade and the Voodoo,
// flames rising off its tips): top corners, hem
function tornPanel(F, top, hemY, n, deep, C, band = 7) {
  const [[x0, y0], [x1, y1]] = top, tips = jag(x0, x1, hemY, n, deep);
  F.part(poly([[x0, y0], [x1, y1], ...tips]), C.accent);
  F.part(poly([[x0, y0], [x1, y1], ...jag(x0, x1, hemY - band, n, deep)]), C.coat);
  if (!C.glow) return;
  tips.forEach(([x, y], i) => { if (i % 2) return; F.dot(x, y + 1, C.glow); if (i % 4 === 0) { F.dot(x + 1, y - 2, C.glow2); F.dot(x, y + 3, C.glow); } });
}
// shadow-flame or toxic wisps curling up beside the body
function wisps(F, cx, cy, C, k = 1) {
  if (!C.glow) return;
  for (const [dx, dy, len] of [[-17, 34, 6], [16, 38, 5], [-14, 46, 4], [18, 26, 4]]) for (let i = 0; i < len; i++) F.dot(cx + dx * k + Math.sin(i * 1.3) * 1.2, cy + dy - i * 1.6, i % 2 ? C.glow : C.glow2);
}

function legs(F, o, cx, cy, r, toe, front = true) {
  cy -= P.bob;
  const { f, legs: L, knee } = build(o), C = o.C;
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0, mid = cx + (a + b) / 2 + sh;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * LIFT);
    F.part(rect(cx + a + sh, cy + 28, cx + b + sh, cyl + 58), f ? C.skin : C.pants);
    if (f && i === 0) F.part(rect(cx + a + sh, cy + 33, cx + b + sh, cy + 34), C.strap, soft); // the thigh strap
    F.part(rect(cx + a - (f ? 0 : 1) + sh, cyl + knee, cx + b + (f ? 0 : 1) + sh, cyl + 58), C.boot);
    F.part(line(cx + a - 1 + sh, cyl + knee, cx + b + 1 + sh, cyl + knee, 1), C.accent, flat); // the boot's top, in the job's colour
    if (front) { // the plated knee (her heeled boots plated down the shin)
      F.part(poly([[mid - 2.5, cyl + knee + 1], [mid + 2.5, cyl + knee + 1], [mid + 2, cyl + knee + 6], [mid, cyl + knee + 8], [mid - 2, cyl + knee + 6]]), C.plate);
      F.dot(mid, cyl + knee + 3, C.gem);
      for (let y = cyl + knee + 10; y < cyl + 56; y += 4) F.part(line(mid - 2, y, mid + 2, y, 1), C.plateLt, flat);
    }
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    if (f) F.part(rect(mid + (i ? 1 : -2), cyl + 59, mid + (i ? 2 : -1), cyl + 62), C.boot, soft); // the heel
  });
}

// a pauldron: layered plates (the Hunter's spiked, the Voodoo's set with a small skull); side -1 the
// viewer's left
function pauldron(F, x, cy, side, C, o) {
  const k = o.sex === 'f' ? 0.85 : 1;
  F.part(ellipse(x, cy + 5, 5.5 * k, 4 * k), C.plate);
  F.part(ellipse(x + side * 1.5, cy + 8, 4.5 * k, 3 * k), C.plate);
  F.part(line(x - 5 * k, cy + 7, x + 5 * k, cy + 7, 1), C.trim, flat);
  if (C.weapon === 'bow') { F.part(poly([[x + side * 2, cy + 3], [x + side * 7, cy + 1], [x + side * 4, cy + 5]]), C.plateLt); F.part(line(x - 4 * k, cy + 9, x + 4 * k, cy + 9, 1), C.accent, flat); }
  else if (C.weapon === 'staff') { F.part(ellipse(x, cy + 4, 2.2, 2), C.bone); F.dot(x - 1, cy + 4, C.glow); F.dot(x + 1, cy + 4, C.glow); }
  else { F.part(poly([[x + side * 3, cy + 1], [x + side * 8, cy], [x + side * 5, cy + 5]]), C.plateLt); F.dot(x, cy + 4, C.gem); }
}
// the high collar, standing up behind the head, its lining in the job's colour
function collar(F, cx, cy, s, C, back = false) {
  for (const side of [-1, 1]) {
    const X = (u) => cx + side * u + s;
    F.part(poly([[X(3), cy + 3], [X(5), cy - 3], [X(10), cy - 4], [X(10), cy + 2], [X(7), cy + 4]]), C.coat);
    if (!back) F.part(poly([[X(5), cy + 1], [X(6), cy - 2], [X(9), cy - 3], [X(9), cy + 1]]), C.accent, soft);
    F.part(line(X(5), cy - 3, X(10), cy - 4, 1), C.trim, flat);
  }
}
// the job's mark at the throat: a violet gem in silver, a red-gem rose, a little green-eyed skull
function brooch(F, x, y, C) {
  if (C.weapon === 'bow') { F.part(ellipse(x, y, 2.6, 2.4), C.accent); F.dot(x, y, C.gem); F.dot(x - 1, y - 1, C.gemHi); F.dot(x + 2, y + 2, C.accentDk); return; }
  if (C.weapon === 'staff') { F.part(ellipse(x, y, 2.4, 2.2), C.bone); F.dot(x - 1, y, C.glow); F.dot(x + 1, y, C.glow); F.dot(x, y + 2, C.coatDk); return; }
  F.part(poly([[x, y - 3], [x + 2, y], [x, y + 3], [x - 2, y]]), C.trim);
  F.dot(x, y, C.gem); F.dot(x, y - 1, C.gemHi);
}

// the weapons. A Shadowblade's long sword, hanging point down from the hand at (x, y)
function swordDown(G, x, y, C, dir = 1) {
  const b = C.blade;
  G.part(line(x, y + 2, x - dir, y + 26, 3), b.arc2, flat); // its violet glow
  G.part(line(x, y + 2, x - dir, y + 25, 2), b.blade);
  G.part(line(x, y + 5, x - dir, y + 24, 1), b.edge, flat);
  G.part(line(x - 4, y + 2, x + 4, y + 2, 1), b.guard, flat);
  G.dot(x - 4, y + 1, b.guard); G.dot(x + 4, y + 1, b.guard); G.dot(x, y + 1, b.gem);
}
// ...swung from the shoulder (x, y)
function swordSwing(F, o, x, y, view, mirror = false) {
  let [a, b] = SWING[view][P.atk];
  if (mirror) { a = 180 - a; b = 180 - b; }
  const c = { ...o.C.blade, sleeve: o.sex === 'f' ? o.C.skin : o.C.blade.sleeve };
  const [, , tx, ty] = swordArm(F, x, y, a, b, c, 16, 25);
  F.dot(tx, ty, c.edge);
  if (P.atk === SLASH) slashArc(F, x, y, 34, mirror ? 140 : view === 'side' ? -40 : -60, mirror ? 30 : view === 'side' ? 50 : 40, c.arc, c.arc2);
}
// the Voodoo's staff: a dark shaft, a skull in a spiked ring at its head, green fire in its eyes
function staff(F, x, top, bottom, C) {
  F.part(line(x, top + 5, x, bottom, 2), C.shaft);
  for (const y of [top + 12, top + 20]) F.part(line(x - 1, y, x + 1, y, 1), C.chain, flat); // iron bands
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r1 = 6.5, r2 = 9; F.part(line(x + Math.cos(a) * r1, top + Math.sin(a) * r1, x + Math.cos(a) * r2, top + Math.sin(a) * r2, 1), C.chain, flat); }
  for (let a = 0; a < 40; a++) F.dot(x + Math.cos((a / 40) * Math.PI * 2) * 6, top + Math.sin((a / 40) * Math.PI * 2) * 6, C.chain);
  F.part(ellipse(x, top - 0.5, 3.6, 3.4), C.bone);
  F.part(rect(x - 2, top + 2, x + 2, top + 4), C.bone);
  F.dot(x - 1.4, top - 0.5, C.glow); F.dot(x + 1.4, top - 0.5, C.glow); F.dot(x, top + 1.5, C.coatDk);
  F.part(line(x - 1, top + 4, x + 1, top + 4, 1), C.coatDk, flat);
  for (const [dx, dy] of [[-8, -9], [7, -10], [-10, 4], [9, 6]]) F.dot(x + dx, top + dy, C.glow);
}
const castAt = (F, x, y, C) => { if (atk()) burst(F, x, y, CAST.burst[P.atk], { core: '#ffffff', glow: C.glow, spark: C.glow2 }); };
// the Hunter's quiver on the back, red-fletched arrows showing over the shoulder
function quiverTop(F, x, y, C) {
  F.part(poly([[x, y + 2], [x + 4, y], [x + 6, y + 9], [x + 2, y + 10]]), C.quiver);
  C.feathers.forEach((c, i) => { const xx = x + 1 + i * 1.5, yy = y - (i % 2); F.part(line(xx, yy, xx + 1, yy - 4, 1), c, flat); });
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C, R = (v) => v - r;
  const sx = cx - W - 8; // the Voodoo's staff, in the hand on the viewer's left
  if (C.weapon === 'staff') staff(F, sx, cy - 10 - lift(), cy + 60 - P.bob - lift(), C);
  if (C.weapon === 'bow') quiverTop(F, cx - W - 2, cy - 6, C);
  wisps(F, cx, cy, C);
  // the coat's back half, behind the legs, torn at the hem
  tornPanel(F, [[cx - W - 3, cy + 8], [R(cx + W + 3), cy + 8]], cy + hem, 4, 5, C);
  legs(F, o, cx, cy, r, s);
  // the body: black leathers; on her a bodice, the shoulders bare
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), f ? C.skin : C.shirt);
  if (f) {
    F.part(poly([[cx - W + 2, cy + 7], [cx + s, cy + 9], [R(cx + W - 2), cy + 7], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22]]), C.shirt);
    F.part(line(cx - W + 2, cy + 7, R(cx + W - 2), cy + 7, 1), C.accent, flat);
    for (let y = 12; y <= 20; y += 3) F.part(line(cx - 2 + s, y + cy, cx + 2 + s, y + cy + 1, 1), C.trim, flat); // the lacing
    F.part(poly([[cx - hip, cy + 25], [R(cx + hip), cy + 25], [R(cx + hip + 2), cy + 31], [cx - hip - 2, cy + 31]]), C.coatDk); // her short skirt
  } else {
    F.part(poly([[cx - 3 + s, cy + 5], [cx + 3 + s, cy + 5], [cx + 5 + s, cy + 24], [cx - 5 + s, cy + 24]]), C.coatDk, soft); // the inner panel
    for (let y = 8; y <= 20; y += 4) F.part(line(cx - 2 + s, cy + y, cx + 2 + s, cy + y, 1), C.plateLt, flat); // straps
  }
  // the coat's front panels, open down the middle, long and torn at the hem (hers fall away at the sides)
  for (const side of [-1, 1]) {
    const ox = side < 0 ? cx - W - 2 : R(cx + W + 2), ix = cx + side * (f ? 8 : 5) + s, bx = side < 0 ? cx - W - 6 : R(cx + W + 6);
    if (f) tornPanel(F, [[ox, cy + 18], [bx + side * -6, cy + 26]], cy + hem - 2, 2, 5, C);
    else {
      const pts = [[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx, cy + hem - 3], [bx - side * 3, cy + hem + 1], [ix + side * 2, cy + hem - 4], [ix + side, cy + 24]];
      F.part(poly(pts), C.accent);
      F.part(poly([[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx + side * -1, cy + hem - 7], [bx - side * 3, cy + hem - 4], [ix + side * 2, cy + hem - 8], [ix + side, cy + 24]]), C.coat);
      F.part(line(ix + side, cy + 4, ix + side * 2, cy + hem - 9, 1), C.accent, flat); // the lining at the opening
      F.part(line(ox - side, cy + 16, bx + side * -1, cy + hem - 7, 1), C.coatDk, flat); // a fold
      if (C.glow) for (const y of [hem - 3, hem - 1]) F.dot(bx - side * 2, cy + y + 2, C.glow);
    }
  }
  // the belt: the Shadowblade's chains, the Hunter's buckled strap with a red gem, the Voodoo's chains with a
  // skull lantern hanging green
  F.part(rect(cx - hip, cy + 22, R(cx + hip), cy + 25), C.strap);
  F.part(rect(cx - 2 + s, cy + 22, cx + 2 + s, cy + 25), C.trim, soft);
  if (C.weapon === 'bow') F.dot(cx + s, cy + 23.5, C.gem);
  if (C.weapon !== 'bow') { F.part(line(cx - hip, cy + 26, cx - 2 + s, cy + 30, 1), C.chain, flat); F.part(line(cx + 2 + s, cy + 30, R(cx + hip), cy + 26, 1), C.chain, flat); }
  if (C.weapon === 'staff') { // the skull lantern at the hip
    const lx = R(cx + hip + 1), ly = cy + 27;
    F.part(line(lx, cy + 24, lx, ly, 1), C.chain, flat);
    F.part(rect(lx - 2, ly, lx + 2, ly + 6), C.plate);
    F.part(rect(lx - 1, ly + 1, lx + 1, ly + 5), C.glow, flat);
    F.dot(lx, ly + 3, C.glow2);
  }
  // crossed chains over his chest (the Hunter's)
  if (C.weapon === 'bow' && !f) { F.part(line(cx - W + 1, cy + 5, R(cx + waist), cy + 21, 1), C.chain, flat); F.part(line(R(cx + W - 1), cy + 5, cx - waist, cy + 21, 1), C.chain, flat); }
  collar(F, cx, cy, s, C);
  brooch(F, cx + s, cy + 5, C);
  pauldron(F, cx - W - 1, cy, -1, C, o);
  pauldron(F, R(cx + W + 1), cy, 1, C, o);
  arms(F, o, cx, cy, W, R, s, false, sx);
  return F;
}

// the arms, by weapon; mirror: the back view. Hanging: his sleeves, her bare arms in long gloves
function arms(F, o, cx, cy, W, R, s, mirror, sx = 0) {
  const C = o.C, f = o.sex === 'f', dir = mirror ? -1 : 1;
  const right = mirror ? R(cx + W + 2) : cx - W - 2, left = mirror ? cx - W - 2 : R(cx + W + 2); // the hands: right (weapon), left
  const sway = (mirror ? 1 : -1) * ARM_SWAY * P.step;
  const hang = (x, G, y = cy + 28) => {
    G.part(rect(x - 2, cy + 8, x + 2, y - 11), f ? C.skin : C.coat);
    G.part(rect(x - 2, y - 11, x + 2, y - 3), f ? C.glove : C.coat);
    G.part(line(x - 2, y - 4, x + 2, y - 4, 1), C.accent, flat); // the cuff
    G.part(ellipse(x, y, 2.6, 2.4), C.glove);
  };
  if (C.weapon === 'sword') {
    const A1 = turn(F, left, cy + 8, sway), A2 = turn(F, right, cy + 8, sway);
    hang(left, A1);
    if (atk()) { if (!mirror) swordSwing(F, o, right, cy + 6, 'front'); return; }
    hang(right, A2); swordDown(A2, right, cy + 28, C, dir);
    return;
  }
  if (C.weapon === 'staff') {
    const A = turn(F, left, cy + 8, sway);
    hang(left, A);
    // the staff hand: out to the shaft, raised with it to cast
    const hx = mirror ? R(cx + W + 8) : sx, hy = cy + 26 - lift();
    F.part(line(right, cy + 8, (right + hx) / 2, cy + 18 - lift() / 2, 4), f ? C.skin : C.coat);
    F.part(line((right + hx) / 2, cy + 18 - lift() / 2, hx, hy, 4), f ? C.glove : C.coat);
    F.part(ellipse(hx, hy, 2.6, 2.4), C.glove);
    return;
  }
  // the bow: in the left hand, raised and drawn to shoot (the archers' shot, design-anim.js SHOOT)
  const shooting = atk(), k = raised(), d = drawn(), A1 = turn(F, left, cy + 8, sway), A2 = turn(F, right, cy + 8, sway);
  const bx = lerp(left, cx + dir * 6 + s, k), by = lerp(cy + 28, cy + 13, k);
  const ang = mirror ? lerp(-90, 30, k) : lerp(90, 150, k);
  const cheek = [lerp(bx - dir * 4, cx - dir * 5 + s, d), lerp(by - 5, cy + 3, d)];
  const pull = P.atk === LOOSE ? 0 : 2 + 6 * d;
  const hold = recurve(shooting ? F : A1, bx, by, ang, 20, C.bow, shooting ? pull : 0, shooting && d > 0, P.atk === LOOSE && !mirror, shooting && P.atk !== LOOSE ? cheek : null);
  const ux = Math.cos((ang * Math.PI) / 180), uy = Math.sin((ang * Math.PI) / 180);
  for (const sd of [-1, 1]) { // the hooked tips
    const tx = bx + ux * sd * 19, ty = by + uy * sd * 19;
    F.part(line(tx, ty, tx + ux * sd * 3 - uy * 3, ty + uy * sd * 3 + ux * 3, 1), C.bow.light, flat);
    F.dot(tx - uy * 2, ty + ux * 2, C.bow.light);
  }
  if (!shooting) { hang(left, A1); hang(right, A2); return; }
  const sleeve = f ? C.skin : C.coat;
  const reach = (x0, y0, x1, y1) => { const mx = lerp(x0, x1, 0.55), my = lerp(y0, y1, 0.55); F.part(line(x0, y0, mx, my, 4), sleeve); F.part(line(mx, my, x1, y1, 4), f ? C.glove : C.coat); F.part(ellipse(x1, y1, 2.4, 2.2), C.glove); };
  reach(mirror ? cx - W : R(cx + W), cy + 7, bx, by);
  const [hx, hy] = hold, ex = right - dir * 2, ey = cy + 3;
  F.part(line(mirror ? R(cx + W) : cx - W, cy + 7, ex, ey, 4), sleeve);
  F.part(line(ex, ey, hx, hy, 4), f ? C.glove : C.coat);
  F.part(ellipse(hx, hy, 2.4, 2.2), C.glove);
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C, R = (v) => v - r;
  const sx = R(cx + W + 8);
  if (C.weapon === 'staff') staff(F, sx, cy - 10 - lift(), cy + 60 - P.bob - lift(), C);
  if (C.weapon === 'bow' && atk()) arms(F, o, cx, cy, W, R, s, true);
  if (C.weapon === 'sword' && atk() && behind(P.atk)) swordSwing(F, o, R(cx + W + 2), cy + 6, 'front', true);
  wisps(F, cx, cy, C, -1);
  legs(F, o, cx, cy, r, 0, false);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), f ? C.skin : C.coat);
  if (f) F.part(poly([[cx - W + 2, cy + 8], [R(cx + W - 2), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22]]), C.shirt);
  // the coat's back: from the shoulders (her waist) to the calf, torn into points, split up the middle
  tornPanel(F, [[cx - W - 3, cy + (f ? 20 : 4)], [R(cx + W + 3), cy + (f ? 20 : 4)]], cy + hem + 1, 5, 6, C, 6);
  F.part(line(cx + s, cy + 30, cx + s, cy + hem - 5, 1), C.accentDk, flat);
  F.part(rect(cx - hip, cy + 22, R(cx + hip), cy + 25), C.strap);
  // the mark on the back: the Shadowblade's violet eye in a silver crescent, the Hunter's quiver and
  // a red crescent, the Voodoo's green-eyed skull
  const my = cy + (f ? 32 : 14);
  if (C.weapon === 'sword') {
    F.part(ellipse(cx + s, my, 5, 4), C.plate);
    F.part(ellipse(cx + s, my - 1, 4, 3), C.coatDk, soft);
    F.part(ellipse(cx + s, my, 3, 1.5), C.glow, flat); F.dot(cx + s, my, C.gemHi);
  } else if (C.weapon === 'staff') {
    F.part(ellipse(cx + s, my, 3.6, 3.2), C.bone); F.part(rect(cx - 2 + s, my + 2, cx + 2 + s, my + 4), C.bone);
    F.dot(cx - 1.4 + s, my, C.glow); F.dot(cx + 1.4 + s, my, C.glow);
  } else {
    for (let a = -1.2; a <= 1.2; a += 0.1) F.dot(cx + s + Math.cos(a + Math.PI / 2) * 5, cy + 36 + Math.sin(a + Math.PI / 2) * -5, C.accent);
    F.part(poly([[R(cx + W - 2), cy - 2], [R(cx + W + 3), cy], [cx - 3 + s, cy + 24], [cx - 7 + s, cy + 22]]), C.quiver);
    F.part(line(cx - 2 + s, cy + 10, cx + 3 + s, cy + 12, 1), C.chain, flat);
    C.feathers.forEach((c, i) => { const x = R(cx + W - 2) + i * 2, y = cy - 3 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  }
  collar(F, cx, cy, s, C, true);
  pauldron(F, cx - W - 1, cy, -1, C, o);
  pauldron(F, R(cx + W + 1), cy, 1, C, o);
  if (C.weapon === 'bow' && atk()) {
    const ex = R(cx + W + 5), ey = cy + 4;
    F.part(line(R(cx + W), cy + 7, ex, ey, 4), f ? C.skin : C.coat);
    F.part(line(ex, ey, cx + 4 + s, cy + 6, 4), f ? C.glove : C.coat);
  } else if (C.weapon === 'sword' && atk()) {
    const x = cx - W - 2; F.part(rect(x - 2, cy + 8, x + 2, cy + 25), f ? C.skin : C.coat); F.part(ellipse(x, cy + 28, 2.6, 2.4), C.glove);
    if (!behind(P.atk)) swordSwing(F, o, R(cx + W + 2), cy + 6, 'front', true);
  } else arms(F, o, cx, cy, W, R, s, true);
  if (C.weapon === 'staff') castAt(F, sx, cy - 10 - lift(), C);
  return F;
}

// facing right: the coat's tails streaming behind, the weapon in the near hand
function side(F, o, cx, cy) {
  const { f, knee, hem } = build(o), C = o.C, cy0 = cy - P.bob, shooting = atk();
  if (C.weapon === 'staff') staff(F, cx + 9, cy - 10 - lift(), cy + 60 - P.bob - lift(), C);
  if (C.weapon === 'bow') { F.part(poly([[cx - 7, cy - 3], [cx - 3, cy - 5], [cx - 6, cy + 20], [cx - 10, cy + 19]]), C.quiver); C.feathers.forEach((c, i) => { const x = cx - 6 + i * 2, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); }); }
  // the tails, swept back
  const tail = [[cx - 4, cy + 4], [cx - 9, cy0 + 14], [cx - 15, cy0 + 34], [cx - 20, cy0 + hem]];
  const tips = [[cx - 20, cy0 + hem], [cx - 16, cy0 + hem - 5], [cx - 13, cy0 + hem + 1], [cx - 9, cy0 + hem - 4], [cx - 6, cy0 + hem]];
  F.part(poly([...tail, ...tips.slice(1), [cx - 3, cy0 + 28]]), C.accent);
  F.part(poly([[cx - 4, cy + 4], [cx - 9, cy0 + 14], [cx - 14, cy0 + 32], [cx - 18, cy0 + hem - 5], [cx - 14, cy0 + hem - 9], [cx - 9, cy0 + hem - 6], [cx - 4, cy0 + 28]]), C.coat);
  if (C.glow) tips.forEach(([x, y], i) => { if (i % 2 === 0) { F.dot(x, y + 1, C.glow); F.dot(x - 1, y - 3, C.glow2); } });
  const leg = (x, G) => {
    G.part(rect(x - 3, cy0 + 28, x + 2, cy0 + 58), f ? C.skin : C.pants);
    G.part(rect(x - 4, cy0 + knee, x + 3, cy0 + 58), C.boot);
    G.part(line(x - 4, cy0 + knee, x + 3, cy0 + knee, 1), C.accent, flat);
    G.part(poly([[x + 1, cy0 + knee + 1], [x + 4, cy0 + knee + 2], [x + 3, cy0 + knee + 7], [x + 1, cy0 + knee + 6]]), C.plate);
    G.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
    if (f) G.part(rect(x - 3, cy0 + 59, x - 2, cy0 + 62), C.boot, soft);
  };
  leg(cx - 2, turn(F, cx - 2, cy0 + 30, -STRIDE * P.step));
  leg(cx + 2, turn(F, cx + 2, cy0 + 30, STRIDE * P.step));
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), f ? C.shirt : C.coat);
  if (f) F.part(poly([[cx - 6, cy + 2], [cx + 4, cy + 2], [cx + 6, cy + 7], [cx - 6, cy + 7]]), C.skin); // her bare shoulders
  else F.part(line(cx + 5, cy + 4, cx + 4, cy + 26, 1), C.accentDk, flat); // the coat's edge, lined
  F.part(rect(cx - 6, cy + 22, cx + 6, cy + 25), C.strap);
  if (C.weapon === 'bow' && !f) F.part(line(cx - 6, cy + 4, cx + 5, cy + 21, 1), C.chain, flat);
  if (C.weapon === 'staff') { F.part(line(cx + 3, cy + 25, cx + 3, cy + 28, 1), C.chain, flat); F.part(rect(cx + 1, cy + 28, cx + 5, cy + 33), C.plate); F.part(rect(cx + 2, cy + 29, cx + 4, cy + 32), C.glow, flat); }
  // the collar, standing behind the head
  F.part(poly([[cx - 6, cy + 4], [cx - 9, cy - 3], [cx - 6, cy - 4], [cx - 2, cy + 3]]), C.coat);
  F.part(poly([[cx - 6, cy + 2], [cx - 8, cy - 2], [cx - 6, cy - 3], [cx - 3, cy + 2]]), C.accent, soft);
  brooch(F, cx + 4, cy + 4, C);
  pauldron(F, cx - 1, cy, 1, C, o);
  const sleeve = f ? C.skin : C.coat, glove = C.glove;
  const A = turn(F, cx - 1, cy + 6, -ARM_SWING * P.step);
  const arm = (G) => { G.part(rect(cx - 3, cy + 8, cx + 1, cy + 17), sleeve); G.part(rect(cx - 3, cy + 17, cx + 1, cy + 25), f ? glove : C.coat); G.part(line(cx - 3, cy + 24, cx + 1, cy + 24, 1), C.accent, flat); G.part(ellipse(cx - 1, cy + 28, 2.6, 2.6), glove); };
  if (C.weapon === 'sword') {
    if (shooting) { swordSwing(F, o, cx - 1, cy + 6, 'side'); return F; }
    arm(A); swordDown(A, cx, cy + 27, C, -1);
    return F;
  }
  if (C.weapon === 'staff') { // the staff in the near hand, reaching forward
    const hy = cy + 22 - lift();
    F.part(line(cx - 1, cy + 7, cx + 4, cy + 15 - lift() / 2, 4), sleeve);
    F.part(line(cx + 4, cy + 15 - lift() / 2, cx + 9, hy, 4), f ? glove : C.coat);
    F.part(ellipse(cx + 9, hy, 2.6, 2.4), glove);
    castAt(F, cx + 9, cy - 10 - lift(), C);
    return F;
  }
  const k = raised(), d = drawn(), bx = lerp(cx + 8, cx + 17, k), by = lerp(cy + 27, cy + 8, k);
  if (!shooting) { recurve(F, bx, by, 95, 20, C.bow); arm(A); return F; }
  const pull = P.atk === LOOSE ? 0 : 2 + 9 * d;
  F.part(line(cx + 1, cy + 7, bx - 1, by, 4), sleeve);
  F.part(line(lerp(cx + 1, bx, 0.55), lerp(cy + 7, by, 0.55), bx - 1, by, 4), f ? glove : C.coat);
  const [hx, hy] = recurve(F, bx, by, 95, 20, C.bow, pull, d > 0 && P.atk !== LOOSE, P.atk === LOOSE);
  F.part(ellipse(bx, by, 2.2, 2.2), glove);
  const ex = lerp(cx, cx - 5, d), ey = cy + 6;
  F.part(line(cx - 1, cy + 6, ex, ey, 4), sleeve);
  F.part(line(ex, ey, hx, hy, 4), f ? glove : C.coat);
  F.part(ellipse(hx, hy, 2.4, 2.2), glove);
  return F;
}

export const drawCross = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(CROSSES[id], view, cx, cy); } finally { P = REST; } };
export const animCross = (id, heads) => animFrames(VIEWS, heads, BW, drawCross(id));
