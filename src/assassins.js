// Sprite designs for the Assassin and its upgrade, the Phantom, male and female, painted in code like
// the Archer designs (archers.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md).
// The Assassin, Rytingborg's: dark leathers under a sand-coloured wrap over the shoulders, a dark
// scarf at the throat, a red sash, forearms wrapped in pale cloth, wrapped boots, and a dagger in
// each hand (held point down at rest, cutting on the attack). She wears leggings to the knee and
// the same wrap, her upper arms bare.
// The Phantom, after the owner's sheet: black leathers and a long black coat lined in violet, its
// tails torn into points, steel plates on the shoulders, a black scarf, brown belts crossed over the
// chest with pouches at the hip, black gloves, tall black boots plated in steel, and two violet-edged
// daggers. She is sleeveless with long black gloves, short leathers with a strap round one thigh, the
// coat open into a torn half-skirt behind, and tall plated boots.
// Standing, walking (8 frames) and attacking (7: a cut with the right hand, then the left), 8
// directions: the left ones are the right ones mirrored. The game paints the hero's body from these
// (sprites.js designSet). Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SWING, SLASH, slashArc, animFrames, VIEWS, turn, STRIDE, ARM_SWING, ARM_SWAY, LIFT } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const ASSASSIN = {
  coat: '#3a3036', coatDk: '#26202a', lining: '#3a3036', wrap: '#d8c08a', wrapDk: '#b89a62', scarf: '#2a2228', sash: '#a8323a',
  pants: '#3a3430', boot: '#4a3a2e', bootTrim: '#d8c08a', band: '#e8dcc0', glove: '#3a2a22', skin: '#f2c8a2', strap: '#6a4226', buckle: '#d4ac54',
  plate: null,
  blade: { steel: '#d8dce4', edge: '#ffffff', guard: '#c8a050', glow: null },
};
const PHANTOM = {
  coat: '#22202a', coatDk: '#16141c', lining: '#5a3a8a', wrap: '#22202a', wrapDk: '#16141c', scarf: '#18161e', sash: '#4a3a6a',
  pants: '#26222c', boot: '#1e1c24', bootTrim: '#9aa0ae', band: '#2e2a36', glove: '#16141c', skin: '#f2c8a2', strap: '#6a4226', buckle: '#c8ccd8',
  plate: '#9aa0ae',
  blade: { steel: '#c8b8ff', edge: '#f0e8ff', guard: '#3a3046', glow: '#9a6aff' },
};
export const ASSASSINS = {
  assassinM: { name: 'Assassin', sex: 'm', C: ASSASSIN },
  assassinF: { name: 'Assassin', sex: 'f', C: ASSASSIN },
  phantomM: { name: 'Phantom', sex: 'm', C: PHANTOM, phantom: true },
  phantomF: { name: 'Phantom', sex: 'f', C: PHANTOM, phantom: true },
};

const flat = { outline: false, flat: true };
const soft = { outline: false };
let P = REST;
const rad = (d) => (d * Math.PI) / 180;

function build(o) {
  return o.sex === 'f' ? { f: true, W: 10, waist: 6, hip: 9, legs: [[-6, -2], [2, 6]], knee: 36 } : { f: false, W: 11, waist: 8, hip: 8, legs: [[-6, -2], [2, 6]], knee: 39 };
}
// the attack: the right hand cuts on frames 0-3, the left on 4-6 (an Assassin's quick double cut)
const rightCut = () => P.atk >= 0 && P.atk <= 3;
const leftCut = () => P.atk >= 4;

// a dagger in a hand at (x, y), the blade along angle a (degrees), short, with a little guard
function dagger(F, x, y, a, C, len = 9) {
  const ux = Math.cos(rad(a)), uy = Math.sin(rad(a)), b = C.blade;
  if (b.glow) F.part(line(x + ux * 2, y + uy * 2, x + ux * (len + 1), y + uy * (len + 1), 3), b.glow, flat);
  F.part(line(x + ux * 2, y + uy * 2, x + ux * len, y + uy * len, 2), b.steel);
  F.part(line(x + ux * 3, y + uy * 3, x + ux * (len - 1), y + uy * (len - 1), 1), b.edge, flat);
  F.part(line(x + ux * 1.5 - uy * 2.5, y + uy * 1.5 + ux * 2.5, x + ux * 1.5 + uy * 2.5, y + uy * 1.5 - ux * 2.5, 1), b.guard, flat);
}
// an arm from the shoulder (x, y) out along armA, the forearm wrapped (gloved), a dagger along bladeA
function armDagger(F, x, y, armA, bladeA, C, f, len = 15) {
  const hx = x + Math.cos(rad(armA)) * len, hy = y + Math.sin(rad(armA)) * len;
  dagger(F, hx, hy, bladeA, C);
  F.part(line(x, y, hx, hy, 4), f ? C.skin : C.coat);
  F.part(line(x + (hx - x) * 0.55, y + (hy - y) * 0.55, hx, hy, 4), C.band);
  F.part(ellipse(hx, hy, 2.4, 2.4), C.glove);
  return [hx, hy];
}

function legs(F, o, cx, cy, r) {
  cy -= P.bob;
  const { legs: L, knee } = build(o), C = o.C, f = o.sex === 'f';
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * LIFT);
    F.part(rect(cx + a + sh, cy + 28, cx + b + sh, cyl + 58), f && o.phantom ? C.skin : C.pants);
    F.part(rect(cx + a - 1 + sh, cyl + knee - 1, cx + b + 1 + sh, cyl + 58), C.boot);
    if (C.plate) F.part(poly([[cx + a - 1 + sh, cyl + knee - 1], [cx + b + 1 + sh, cyl + knee - 1], [cx + (a + b) / 2 + sh, cyl + knee + 4]]), C.plate); // the knee plate
    else for (let y = cyl + knee + 2; y < cyl + 56; y += 4) F.part(line(cx + a - 1 + sh, y, cx + b + 1 + sh, y + 1, 1), C.bootTrim, flat); // the wrappings
    F.part(ellipse(cx + (a + b) / 2 + sh + (i ? 0.5 : -0.5), cyl + 60.5, 4.2, 2.5), C.boot);
    if (f && o.phantom && i === 0) F.part(rect(cx + a + sh, cy + 33, cx + b + sh, cy + 34), C.strap, soft); // the thigh strap
  });
}

// the coat's tails: long, torn into points, lined in violet (the Phantom's); the Assassin's wrap is short
function tails(F, o, cx, cy, x0, x1, top, len, lining) {
  const C = o.C, pts = [[x0, top], [x1, top]], n = 5;
  for (let i = 0; i <= n; i++) pts.push([x1 - ((x1 - x0) * i) / n, top + len - (i % 2 ? 5 : 0) - (P.step ? Math.abs(P.step) : 0)]);
  F.part(poly(pts), lining ? C.lining : C.coat);
}

function paint(o, view, cx, cy) {
  const F = new Frame(BW, BH);
  if (view === 'side') return side(F, o, cx, cy);
  const back = view === 'back' || view === 'back3';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0;
  const r = view === 'front3' || view === 'back3' ? 3 : 0;
  return back ? backView(F, o, cx, cy, s, r) : frontView(F, o, cx, cy, s, r);
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip } = build(o), C = o.C, R = (v) => v - r;
  // the Phantom's long coat behind the legs: its violet lining shows between the tails
  if (o.phantom) tails(F, o, cx, cy, cx - hip - 3, R(cx + hip + 3), cy + 22, f ? 26 : 30, true);
  legs(F, o, cx, cy, r);
  // the torso: leathers, the belt and sash, the hips
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.coat);
  if (f) F.part(line(cx - 4 + s, cy + 11, cx + 4 + s, cy + 11, 1), C.coatDk, flat); // the bust's shading
  if (o.phantom) { // the coat's front falls open at the sides
    for (const side of [-1, 1]) {
      const x = side < 0 ? cx - hip - 1 : R(cx + hip + 1);
      F.part(poly([[x, cy + 22], [x + side * 2, cy + 22], [x + side * 3, cy + 46], [x + side * 1, cy + 50], [x, cy + 44]]), C.coat);
    }
    // belts crossed over the chest, a buckle where they meet
    F.part(line(cx - W + 2, cy + 5, R(cx + waist), cy + 20, 2), C.strap, flat);
    F.part(line(R(cx + W - 2), cy + 5, cx - waist, cy + 20, 2), C.strap, flat);
    F.dot(cx + s, cy + 13, C.buckle);
  } else {
    // the sand wrap over the shoulders, draped to a point on the chest
    F.part(poly([[cx - W - 2, cy + 2], [R(cx + W + 2), cy + 2], [R(cx + W + 2), cy + 8], [cx + s, cy + 14], [cx - W - 2, cy + 8]]), C.wrap);
    F.part(line(cx - W, cy + 7, cx + s, cy + 12, 1), C.wrapDk, flat);
  }
  // the sash and belt, pouches at the hip
  F.part(rect(cx - hip, cy + 21, R(cx + hip), cy + 24), C.sash);
  F.part(rect(cx - 1 + s, cy + 21, cx + 1 + s, cy + 24), C.buckle, soft);
  F.part(rect(cx - hip - 1, cy + 24, cx - hip + 3, cy + 28), C.strap);
  F.part(rect(R(cx + hip - 3), cy + 24, R(cx + hip + 1), cy + 28), C.strap);
  // the scarf at the throat
  F.part(ellipse(cx + s, cy + 2, 6.5, 3), C.scarf);
  if (o.phantom) F.part(poly([[cx - 3 + s, cy + 3], [cx + 1 + s, cy + 3], [cx - 2 + s, cy + 11]]), C.scarf); // its loose end
  // shoulder plates (the Phantom's)
  if (C.plate) for (const x of [cx - W - 1, R(cx + W + 1)]) { F.part(ellipse(x, cy + 5, 4.5, 3.5), C.plate); F.part(line(x - 3, cy + 7, x + 3, cy + 7, 1), C.coatDk, flat); }
  arms(F, o, cx, cy, W, R, f, false);
  return F;
}

// the arms with a dagger in each hand: at rest held point down at the sides; on the attack the right
// hand cuts (frames 0-3), then the left (4-6). mirror: the back view
function arms(F, o, cx, cy, W, R, f, mirror) {
  const C = o.C, sR = mirror ? R(cx + W) : cx - W, sL = mirror ? cx - W : R(cx + W); // the shoulders: right hand, left hand
  const swing = SWING.front, dirR = mirror ? -1 : 1;
  const one = (sx, cut, i, side) => {
    if (cut) {
      const [a, b] = swing[i];
      const ang = side > 0 ? 180 - a : a, bang = side > 0 ? 180 - b : b; // (the left hand mirrors the right's cut)
      const [hx, hy] = armDagger(F, sx, cy + 7, mirror ? 180 - ang : ang, mirror ? 180 - bang : bang, C, f);
      if (i === SLASH || i === 5) slashArc(F, hx, hy, 12, -60 * side, 40 * side, C.blade.glow || '#ffffff', '#d8d8f0');
      return;
    }
    // hanging, the dagger held point down, swaying with the walk
    const sway = -dirR * ARM_SWAY * P.step * side, A = turn(F, sx, cy + 8, sway);
    A.part(rect(sx - 2, cy + 6, sx + 2, cy + 17), f ? C.skin : C.coat);
    if (f && o.phantom) A.part(rect(sx - 2, cy + 12, sx + 2, cy + 17), C.glove); // her long gloves, the shoulders bare
    A.part(rect(sx - 2, cy + 16, sx + 2, cy + 25), C.band);
    A.part(ellipse(sx, cy + 27, 2.5, 2.4), C.glove);
    dagger(A, sx + side * -1, cy + 26, 90 + side * 14, C, 12); // (held point down, a little out from the leg)
  };
  one(sR, rightCut(), P.atk, -1);
  one(sL, leftCut(), P.atk - 4 + 2, 1);
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip } = build(o), C = o.C, R = (v) => v - r;
  legs(F, o, cx, cy, r);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.coat);
  if (o.phantom) { // the coat's back, its tails torn into points over the legs, a violet seam
    tails(F, o, cx, cy, cx - hip - 3, R(cx + hip + 3), cy + 6, f ? 42 : 46, false);
    F.part(line(cx + s, cy + 8, cx + s, cy + 46, 1), C.lining, flat);
    F.part(poly([[cx - 3 + s, cy + 12], [cx + 3 + s, cy + 12], [cx + s, cy + 18]]), C.lining); // the sign on its back
  } else {
    F.part(poly([[cx - W - 2, cy + 2], [R(cx + W + 2), cy + 2], [R(cx + W + 1), cy + 12], [cx + s, cy + 20], [cx - W - 1, cy + 12]]), C.wrap); // the wrap, to a point at the back
    F.part(line(cx + s, cy + 4, cx + s, cy + 19, 1), C.wrapDk, flat);
  }
  F.part(rect(cx - hip, cy + 21, R(cx + hip), cy + 24), C.sash);
  F.part(ellipse(cx + s, cy + 2, 6.5, 3), C.scarf);
  if (C.plate) for (const x of [cx - W - 1, R(cx + W + 1)]) F.part(ellipse(x, cy + 5, 4.5, 3.5), C.plate);
  arms(F, o, cx, cy, W, R, f, true);
  return F;
}

// facing right: the near (right) hand cuts first, the far one behind it
function side(F, o, cx, cy) {
  const { f, knee } = build(o), C = o.C, cy0 = cy - P.bob;
  const leg = (x, G) => {
    G.part(rect(x - 3, cy0 + 28, x + 2, cy0 + 58), f && o.phantom ? C.skin : C.pants);
    G.part(rect(x - 4, cy0 + knee - 1, x + 3, cy0 + 58), C.boot);
    if (C.plate) G.part(poly([[x - 4, cy0 + knee - 1], [x + 3, cy0 + knee - 1], [x + 3, cy0 + knee + 4]]), C.plate);
    else for (let y = cy0 + knee + 2; y < cy0 + 56; y += 4) G.part(line(x - 4, y, x + 3, y + 1, 1), C.bootTrim, flat);
    G.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
  };
  // the far arm: its dagger behind the body (it cuts on 4-6)
  if (leftCut()) { const [a, b] = SWING.side[P.atk - 2]; armDagger(F, cx + 2, cy + 7, a, b, C, f); }
  else { const A = turn(F, cx + 2, cy + 7, ARM_SWING * P.step * 0.6); A.part(rect(cx, cy + 7, cx + 4, cy + 24), C.band); dagger(A, cx + 2, cy + 25, 80, C, 12); }
  if (o.phantom) tails(F, o, cx, cy, cx - 9, cx + 4, cy + 18, f ? 30 : 34, true); // the coat's tails, streaming back
  leg(cx - 2, turn(F, cx - 2, cy0 + 30, -STRIDE * P.step));
  leg(cx + 2, turn(F, cx + 2, cy0 + 30, STRIDE * P.step));
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + 7, cy + 8], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), C.coat);
  if (o.phantom) F.part(line(cx - 7, cy + 4, cx + 5, cy + 19, 2), C.strap, flat);
  else F.part(poly([[cx - 9, cy + 2], [cx + 5, cy + 2], [cx + 6, cy + 9], [cx - 9, cy + 14]]), C.wrap);
  F.part(rect(cx - 6, cy + 21, cx + 6, cy + 24), C.sash);
  F.part(rect(cx + 2, cy + 24, cx + 5, cy + 28), C.strap);
  F.part(ellipse(cx + 1, cy + 2, 5.5, 3), C.scarf);
  if (o.phantom) F.part(poly([[cx - 4, cy + 2], [cx - 12, cy + 6], [cx - 10, cy + 9], [cx - 3, cy + 5]]), C.scarf); // its end, streaming back
  if (C.plate) F.part(ellipse(cx, cy + 5, 4.5, 3.5), C.plate);
  // the near arm: hanging and swinging, or cutting
  if (rightCut()) { const [a, b] = SWING.side[P.atk]; const [hx, hy] = armDagger(F, cx - 1, cy + 7, a, b, C, f); if (P.atk === SLASH) slashArc(F, hx, hy, 12, -50, 50, C.blade.glow || '#ffffff', '#d8d8f0'); }
  else {
    const A = turn(F, cx - 1, cy + 6, -ARM_SWING * P.step);
    A.part(rect(cx - 3, cy + 6, cx + 1, cy + 17), f ? C.skin : C.coat);
    if (f && o.phantom) A.part(rect(cx - 3, cy + 12, cx + 1, cy + 17), C.glove);
    A.part(rect(cx - 3, cy + 16, cx + 1, cy + 25), C.band);
    A.part(ellipse(cx - 1, cy + 27, 2.5, 2.5), C.glove);
    dagger(A, cx - 1, cy + 26, 75, C, 12);
  }
  return F;
}

// one design's painter for a pose (design-anim.js): (view, cx, cy, pose) -> Frame
export const drawAssassin = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(ASSASSINS[id], view, cx, cy); } finally { P = REST; } };
export const animAssassin = (id, heads) => animFrames(VIEWS, heads, BW, drawAssassin(id));
