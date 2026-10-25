// Sprite designs for the Blader and the BladeMaster, male and female, painted in code (like the
// butler, butler.js) on the bald bodies' frame, so the shared head and hair go on top like anyone's
// (docs/character-standard.md). After the owner's two uniform sheets:
// - Blader: a navy capelet with gold trim (the hood bunched at the neck on him, a stand-up collar on
//   her), a shield crest, a white shirt, brown belts, a shoulder strap and pouches, a navy tabard,
//   fingerless brown gloves, black trousers (black tights and a short skirt on her), tall brown boots
//   and a navy sheathed sword at the hip; a steel pauldron on his right shoulder.
// - BladeMaster, grander than the Blader: black armour worked with gold filigree and blue gems, a
//   tall flared collar standing behind the head, great layered pauldrons with gold points, a gem
//   medallion on the chest, armoured hip plates, gold-cuffed gauntlets with elbow points, a long
//   navy cape lined in white, gold-tipped and edged in filigree, with the winged crest in a gold ring
//   on its back, white and navy coat tails, black greaves with gold knee guards and toe caps
//   (thigh-high boots on her), an ornate sword with a winged gold guard, a navy scarf on him and a
//   white breastplate on her.
// Standing, walking (8 frames) and attacking (7: the sword drawn and swung), 8 directions: the left
// ones are the right ones mirrored.
// Not used in the game yet. Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SWING, SLASH, behind, swordArm, slashArc, animFrames } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json), so heads fit as on theirs
const LEGS = 63;                 // chin to ground, in pixels, in every direction

const BLADER = {
  cape: '#2f4a8e', trim: '#d2aa4e', shirt: '#ece6d8', leather: '#7c4b2b', strap: '#5a3520',
  pants: '#2c2833', boot: '#6c3f25', steel: '#b9bec8', skin: '#f2c8a2', crest: '#e9edf5', gem: '#4a86e8',
  sheath: '#2a3c78', fold: '#223769',
};
const MASTER = {
  cape: '#283e98', lining: '#eceaf3', trim: '#d8ac4c', shirt: '#f0ede6', armor: '#27232f', leather: '#6a4128',
  strap: '#4a2e1e', pants: '#211e27', boot: '#24212b', skin: '#f2c8a2', crest: '#e9edf5', gem: '#4a8cf0',
  sheath: '#24367e', scarf: '#2c45a6', fold: '#1d2d72', liningDk: '#c4c2d2',
};
export const BLADERS = {
  bladerM: { name: 'Blader', sex: 'm', master: false, C: BLADER },
  bladerF: { name: 'Blader', sex: 'f', master: false, C: BLADER },
  masterM: { name: 'BladeMaster', sex: 'm', master: true, C: MASTER },
  masterF: { name: 'BladeMaster', sex: 'f', master: true, C: MASTER },
};

const flat = { outline: false, flat: true }; // a trim's line: no outline or shading
let P = REST; // the pose being painted (design-anim.js): its step, bob and attack frame
const soft = { outline: false };             // shaded, but no outline (a panel inside a part)

// the crest: a small shield with a white sword between two wings
function crest(F, x, y, C, big = false) {
  const k = big ? 2 : 1;
  F.part(poly([[x - 3 * k, y - 3 * k], [x + 3 * k, y - 3 * k], [x + 3 * k, y + k], [x, y + 4 * k], [x - 3 * k, y + k]]), C.cape);
  F.part(line(x - 3 * k, y - 3 * k, x + 3 * k, y - 3 * k, 1), C.trim, flat);
  F.part(line(x, y - 2 * k, x, y + 2 * k + (big ? 1 : 0), 1), C.crest, flat);
  F.part(line(x - k, y - k, x + k, y - k, 1), C.crest, flat);
  if (big) { F.part(line(x - 5, y - 1, x - 2, y + 1, 1), C.crest, flat); F.part(line(x + 5, y - 1, x + 2, y + 1, 1), C.crest, flat); }
}

// a thin ring of dots (the BladeMaster's back crest)
function ring(F, x, y, rx, ry, col) {
  for (let a = 0; a < 64; a++) F.dot(x + Math.cos((a / 64) * 2 * Math.PI) * rx, y + Math.sin((a / 64) * 2 * Math.PI) * ry, col);
}
const edge = (F, pts, col) => { for (let i = 0; i < pts.length - 1; i++) F.part(line(...pts[i], ...pts[i + 1], 1), col, flat); };

// one side of the BladeMaster's tall collar: black armour standing up behind the head and flaring
// out beside it, navy inside, edged in gold. X(u): a point u pixels out from the middle on this side
function collar(F, X, cy, C) {
  const pts = [[X(4), cy + 3], [X(6), cy - 4], [X(14), cy - 10], [X(14), cy - 2], [X(10), cy + 4]];
  F.part(poly(pts), C.armor);
  F.part(poly([[X(7), cy + 1], [X(7), cy - 3], [X(12), cy - 7], [X(12), cy - 2], [X(9), cy + 2]]), C.cape, soft);
  edge(F, pts.slice(1, 4), C.trim);
  F.dot(X(14), cy - 11, C.trim);
}

// one great pauldron: three gold-edged plates, a gold point flaring up and out, a gem. x: its
// middle; side: -1 on the viewer's left, 1 on the right
function pauldron(F, x, cy, side, f, C) {
  const w = f ? 5 : 6.5;
  F.part(poly([[x - side * 2, cy + 2], [x + side * (w + 1), cy - 3], [x + side * (w - 1), cy + 3]]), C.trim); // the point
  for (const [dy, rw, rh] of [[11, w - 1, 2.5], [8, w, 3], [5, w + 0.5, 4]]) {
    F.part(ellipse(x, cy + dy, rw, rh), C.armor);
    F.part(line(x - rw * 0.6, cy + dy + rh - 0.5, x + rw * 0.6, cy + dy + rh - 0.5, 1), C.trim, flat); // a gold edge along its curve
    F.dot(x - rw * 0.85, cy + dy + rh - 1.5, C.trim); F.dot(x + rw * 0.85, cy + dy + rh - 1.5, C.trim);
  }
  F.part(ellipse(x, cy + 5, 1.6, 1.6), C.trim);
  F.dot(x, cy + 5, C.gem);
}

// the BladeMaster's sword hilt: a winged gold guard, a dark grip, a gem pommel; (x, y) the guard's middle
function hilt(F, x, y, C, dir = 1) {
  F.part(poly([[x - 4, y - 2], [x - 1, y], [x + 1, y], [x + 4, y - 2], [x + 3, y + 1], [x - 3, y + 1]]), C.trim);
  F.dot(x, y, C.gem);
  F.part(line(x - dir, y - 2, x - 2 * dir, y - 5, 1), C.armor, flat);
  F.part(ellipse(x - 2 * dir, y - 6, 1.5, 1.5), C.trim);
  F.dot(x - 2 * dir, y - 6, C.gem);
}

// the tabard's emblem: a little sword, point down, its guard and pommel in gold
function emblem(F, x, y, C) {
  F.part(line(x, y, x, y + 7, 1), C.crest, flat);
  F.part(line(x - 2, y + 1, x + 2, y + 1, 1), C.trim, flat);
  F.dot(x, y - 1, C.trim);
  F.dot(x - 1, y + 3, C.trim); F.dot(x + 1, y + 3, C.trim);
}

// the sword in the swing: the Blader's plain steel, the BladeMaster's with a blue glow and a gem
const blade = (o) => o.master
  ? { sleeve: o.C.armor, glove: o.C.armor, blade: '#c8d4f0', edge: '#8ab8ff', guard: o.C.trim, gem: o.C.gem, arc: '#cfe2ff', arc2: '#7fb0ff' }
  : { sleeve: o.C.shirt, glove: o.C.leather, blade: '#d6dae2', edge: '#ffffff', guard: o.C.trim, arc: '#ffffff', arc2: '#c8d0dc' };
// the sword arm swinging from the shoulder (x, y); mirror: the back view (the arm on the viewer's right)
function swing(F, o, x, y, view, mirror = false) {
  let [a, b] = SWING[view][P.atk];
  if (mirror) { a = 180 - a; b = 180 - b; }
  const c = blade(o);
  swordArm(F, x, y, a, b, c);
  if (P.atk === SLASH) slashArc(F, x, y, 30, mirror ? 140 : view === 'side' ? -40 : -60, mirror ? 30 : view === 'side' ? 50 : 40, c.arc, c.arc2);
}

// one direction's standing frame. cx, cy: the head's chin in the frame (the trainee's, so the
// shared head lands on the collar). view: front | front3 | side | back3 | back
function paint(o, view, cx, cy) {
  const F = new Frame(BW, BH);
  if (view === 'side') return side(F, o, cx, cy);
  const back = view === 'back' || view === 'back3';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0; // the front (or the seam) turns this way
  const r = view === 'front3' || view === 'back3' ? 3 : 0;     // the far side narrows
  return back ? backView(F, o, cx, cy, s, r) : frontView(F, o, cx, cy, s, r);
}

// the build: shoulders, waist and hips (half widths), and the legs
function build(o) {
  const f = o.sex === 'f';
  return {
    f, W: f ? 11 : 13, waist: f ? 7 : 10, hip: f ? 10 : 10,
    legs: f ? [[-7, -2], [2, 7]] : [[-8, -2], [2, 8]],
  };
}

function legs(F, o, cx, cy, r, toe) {
  cy -= P.bob; // the feet stay on the ground while the body sinks
  const { f, legs: L } = build(o), C = o.C, m = o.master;
  const knee = m && f ? cy + 34 : m ? cy + 41 : cy + 44; // where the boots start
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * 2); // the stepping leg lifts
    const kn = knee - cy + cyl;
    F.part(rect(cx + a + sh, cy + 30, cx + b + sh, cyl + 58), C.pants);
    F.part(rect(cx + a - (f ? 0 : 1) + sh, kn, cx + b + (f ? 0 : 1) + sh, cyl + 58), C.boot);
    F.part(ellipse(cx + (a + b) / 2 + toe + sh + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    const mid = cx + (a + b) / 2 + sh;
    if (m) {
      // gold-edged greaves with a pointed knee guard and a gem
      F.part(line(cx + a - (f ? 0 : 1) + sh, kn, cx + b + (f ? 0 : 1) + sh, kn, 1), C.trim, flat);
      const ky = f ? cyl + 44 : cyl + 45;
      F.part(poly([[mid, ky - 6], [mid + 3, ky - 2], [mid + 3, ky + 2], [mid, ky + 6], [mid - 3, ky + 2], [mid - 3, ky - 2]]), C.trim);
      F.part(poly([[mid, ky - 3], [mid + 1, ky], [mid, ky + 3], [mid - 1, ky]]), C.armor, flat);
      F.dot(mid, ky, C.gem);
      F.part(line(mid - 3, cyl + 52, mid + 3, cyl + 52, 1), C.trim, flat); // a gold band and toe cap
      F.part(ellipse(cx + (a + b) / 2 + toe + sh + (i ? 0.5 : -0.5), cyl + 61, 2, 1.2), C.trim, flat);
    } else {
      // a folded cuff with a steel knee cap
      F.part(rect(cx + a - (f ? 0 : 1) + sh, kn, cx + b + (f ? 0 : 1) + sh, kn + 1), C.leather, soft);
      F.part(poly([[mid - 2, kn + 1], [mid + 2, kn + 1], [mid, kn + 5]]), f ? C.trim : C.steel);
    }
  });
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip } = build(o), C = o.C, m = o.master;
  const R = (v) => v - r; // a point on the far (viewer's right) side

  // the long cape behind (BladeMaster): its white lining shows behind the legs, navy at the edges
  if (m) {
    const hem = [[cx - W - 9, cy + 58], [cx - W - 5, cy + 54], [cx - 8, cy + 61], [cx - 3, cy + 57], [cx + 3, cy + 61], [R(cx + 8), cy + 57], [R(cx + W + 6), cy + 61], [R(cx + W + 9), cy + 55]];
    F.part(poly([[cx - W - 1, cy + 3], [R(cx + W + 1), cy + 3], ...hem.slice().reverse()]), C.cape);
    F.part(poly([[cx - W + 1, cy + 8], [R(cx + W - 1), cy + 8], [R(cx + W + 5), cy + 56], [cx + 3, cy + 59], [cx - 3, cy + 56], [cx - W - 5, cy + 55]]), C.lining, soft);
    F.part(line(cx - W - 2, cy + 20, cx - W - 4, cy + 52, 1), C.liningDk, flat);
    F.part(line(R(cx + W + 2), cy + 20, R(cx + W + 4), cy + 52, 1), C.liningDk, flat);
    F.part(line(cx - W - 9, cy + 58, cx - W - 5, cy + 54, 1), C.trim, flat);
    F.part(line(R(cx + W + 6), cy + 61, R(cx + W + 9), cy + 55, 1), C.trim, flat);
    for (const [x, y] of [hem[0], hem[2], hem[4], hem[6]]) F.part(poly([[x - 1.5, y - 2], [x + 1.5, y - 2], [x, y + 1]]), C.trim);
  }
  legs(F, o, cx, cy, r, s);

  // the body
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), m ? C.armor : C.shirt);

  // below the belt: shirt tails or a skirt, with the tabard down the middle
  if (m) {
    // white coat tails at the sides, the navy panel in front
    F.part(poly([[cx - hip, cy + 27], [cx - 3 + s, cy + 27], [cx - 5 + s, cy + (f ? 44 : 50)], [cx - hip - (f ? 3 : 2), cy + (f ? 47 : 53)]]), C.lining);
    F.part(poly([[R(cx + hip), cy + 27], [cx + 3 + s, cy + 27], [cx + 5 + s, cy + (f ? 44 : 50)], [R(cx + hip + (f ? 3 : 2)), cy + (f ? 47 : 53)]]), C.lining);
    if (f) F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + 1), cy + 34], [cx - hip - 1, cy + 34]]), C.armor); // the short black skirt
    F.part(poly([[cx - 4 + s, cy + 27], [cx + 4 + s, cy + 27], [cx + 4 + s, cy + (f ? 46 : 52)], [cx + s, cy + (f ? 49 : 55)], [cx - 4 + s, cy + (f ? 46 : 52)]]), C.cape);
    F.part(line(cx - 4 + s, cy + 28, cx - 4 + s, cy + (f ? 46 : 52), 1), C.trim, flat);
    F.part(line(cx + 4 + s, cy + 28, cx + 4 + s, cy + (f ? 46 : 52), 1), C.trim, flat);
    emblem(F, cx + s, cy + 34, C);
    F.dot(cx + s, cy + 31, C.gem);
    // armoured hip plates over the tails
    for (const side of [-1, 1]) {
      const o0 = side < 0 ? cx - hip - 2 : R(cx + hip + 2), i0 = cx + side * 4 + s;
      const pts = [[i0, cy + 27], [o0, cy + 27], [o0 - side, cy + 34], [i0 + side, cy + 33]];
      F.part(poly(pts), C.armor);
      edge(F, pts.slice(1).concat([pts[0]]), C.trim);
      F.dot((o0 + i0) / 2, cy + 30, C.gem);
    }
  } else {
    if (f) F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + 2), cy + 35], [cx - hip - 2, cy + 35]]), C.shirt); // the white skirt
    else F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + 1), cy + 38], [cx - hip - 1, cy + 38]]), C.shirt); // the shirt's tails
    F.part(poly([[cx - 4 + s, cy + 27], [cx + 4 + s, cy + 27], [cx + 4 + s, cy + (f ? 39 : 43)], [cx - 4 + s, cy + (f ? 39 : 43)]]), C.cape);
    F.part(line(cx - 4 + s, cy + 28, cx - 4 + s, cy + (f ? 39 : 43), 1), C.trim, flat);
    F.part(line(cx + 4 + s, cy + 28, cx + 4 + s, cy + (f ? 39 : 43), 1), C.trim, flat);
    emblem(F, cx + s, cy + 30, C);
  }

  // the chest
  if (m && f) {
    F.part(poly([[cx - 7 + s, cy + 5], [cx + 7 + s, cy + 5], [cx + 7 + s, cy + 14], [cx + s, cy + 16], [cx - 7 + s, cy + 14]]), C.shirt); // the white breastplate
    F.part(line(cx - 7 + s, cy + 14, cx + s, cy + 16, 1), C.trim, flat);
    F.part(line(cx + s, cy + 16, cx + 7 + s, cy + 14, 1), C.trim, flat);
    F.part(line(cx + s, cy + 17, cx + s, cy + 23, 1), C.trim, flat); // the corset's lacing
    for (const y of [18, 21]) F.part(line(cx - waist + 1, cy + y, R(cx + waist - 1), cy + y, 1), C.trim, flat); // its gold ribs
    edge(F, [[cx - 5 + s, cy + 6], [cx + s, cy + 10], [cx + 5 + s, cy + 6]], C.trim); // filigree on the breastplate
    F.part(ellipse(cx + s, cy + 6, 2, 2), C.trim);
    F.dot(cx + s, cy + 6, C.gem);
  } else if (m) {
    F.part(poly([[cx - 4 + s, cy + 3], [cx + 4 + s, cy + 3], [cx + s, cy + 10]]), C.shirt); // the shirt in the open collar
    F.part(line(cx - 5 + s, cy + 3, cx - 1 + s, cy + 21, 1), C.trim, flat); // the coat's gold edges
    F.part(line(cx + 5 + s, cy + 3, cx + 1 + s, cy + 21, 1), C.trim, flat);
    edge(F, [[cx - W + 2, cy + 9], [cx - 6 + s, cy + 14], [cx - 3 + s, cy + 14]], C.trim); // filigree across the chest
    edge(F, [[R(cx + W - 2), cy + 9], [cx + 6 + s, cy + 14], [cx + 3 + s, cy + 14]], C.trim);
    F.part(line(cx - W + 1, cy + 19, R(cx + W - 1), cy + 19, 1), C.trim, flat);
    F.part(ellipse(cx + s, cy + 14, 2.5, 2.5), C.trim); // the gem medallion
    F.dot(cx + s, cy + 14, C.gem); F.dot(cx + s, cy + 13, '#a8ccff');
  } else if (f) {
    F.part(line(cx - W + 2, cy + 15, R(cx + W - 2), cy + 15, 1), C.strap, flat); // the harness under the chest
    F.part(line(cx - 6 + s, cy + 4, cx + 6 + s, cy + 21, 2), C.strap, flat);
  } else {
    F.part(line(cx - 9 + s, cy + 4, cx + 7 + s, cy + 23, 2), C.strap, flat); // the shoulder strap
    F.dot(cx - 2 + s, cy + 13, C.trim);
  }

  // the belt, its buckle and pouches (the BladeMaster's doubled, with a gold buckle and a gem)
  F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.leather);
  if (m) {
    F.part(line(cx - hip, cy + 27, R(cx + hip), cy + 26, 1), C.strap, flat);
    F.part(rect(cx - 2 + s, cy + 23, cx + 2 + s, cy + 27), C.trim);
    F.dot(cx + s, cy + 25, C.gem);
  } else F.part(rect(cx - 1 + s, cy + 24, cx + 1 + s, cy + 26), C.trim, soft);
  F.part(rect(cx - hip + 1, cy + 26, cx - hip + 4, cy + 30), C.leather);
  if (!m) F.part(rect(R(cx + hip - 4), cy + 26, R(cx + hip - 1), cy + 30), C.leather);
  F.dot(cx - hip + 2, cy + 27, C.trim);

  // the sword at the far hip, in its navy sheath
  F.part(line(R(cx + 9), cy + 26, R(cx + 16), cy + 54, 2), C.sheath);
  F.part(line(R(cx + 15), cy + 50, R(cx + 16), cy + 54, 2), C.trim, flat);
  if (m) {
    for (const y of [34, 44]) F.dot(R(cx + 9 + Math.round((y - 26) / 4)), cy + y, C.trim), F.dot(R(cx + 10 + Math.round((y - 26) / 4)), cy + y, C.trim);
    if (P.atk < 0) hilt(F, R(cx + 9), cy + 23, C, -1); // drawn while attacking
  } else if (P.atk < 0) {
    F.part(line(R(cx + 6), cy + 24, R(cx + 12), cy + 22, 1), C.trim, flat); // the cross-guard
    F.part(line(R(cx + 8), cy + 21, R(cx + 7), cy + 18, 1), C.strap, flat);
  }

  // the shoulders: a capelet with the collar (Blader), armour and the collar (BladeMaster)
  if (m) {
    for (const side of [-1, 1]) collar(F, (u) => (side < 0 ? cx - u : R(cx + u)) + s, cy, C);
    F.part(poly([[cx - 6 + s, cy - 2], [cx + 6 + s, cy - 2], [cx + 8 + s, cy + 4], [cx - 8 + s, cy + 4]]), C.armor); // the high collar
    F.part(line(cx - 6 + s, cy - 2, cx + 6 + s, cy - 2, 1), C.trim, flat);
    if (!f) { // the navy scarf, one end trailing down his chest
      F.part(ellipse(cx + s, cy + 3, 6, 2), C.scarf);
      F.part(poly([[cx + 2 + s, cy + 4], [cx + 5 + s, cy + 4], [cx + 6 + s, cy + 11], [cx + 3 + s, cy + 12]]), C.scarf);
    }
    for (const side of [-1, 1]) pauldron(F, side < 0 ? cx - W - 1 : R(cx + W + 1), cy, side, f, C);
  } else {
    for (const side of [-1, 1]) {
      const sx = side < 0 ? cx - W : R(cx + W), ix = cx + side * 5 + s;
      const edge = [[sx + side * 4, cy + 22], [sx - side * 2, cy + 23], [ix + side * 2, cy + 18], [ix, cy + 1]];
      F.part(poly([[ix, cy + 1], [sx + side * 1, cy + 3], [sx + side * 4, cy + 12], ...edge]), C.cape);
      for (let i = 0; i < edge.length - 1; i++) F.part(line(...edge[i], ...edge[i + 1], 1), C.trim, flat);
      F.part(line(sx + side * 2, cy + 9, sx + side * 2, cy + 20, 1), C.fold, flat);
    }
    if (f) {
      F.part(poly([[cx - 6 + s, cy - 2], [cx + 6 + s, cy - 2], [cx + 8 + s, cy + 3], [cx - 8 + s, cy + 3]]), C.cape); // the stand-up collar
      F.part(line(cx - 6 + s, cy - 2, cx + 6 + s, cy - 2, 1), C.trim, flat);
      crest(F, cx - 5 + s, cy + 9, C);
    } else {
      F.part(ellipse(cx + s, cy + 2, 8, 3), C.cape); // the hood, bunched at the neck
      F.part(line(cx - 6 + s, cy + 4, cx + 6 + s, cy + 4, 1), C.trim, flat);
      F.part(ellipse(cx - W - 1, cy + 6, 5, 4), C.steel); // the pauldron on his right shoulder
      F.part(ellipse(cx - W - 1, cy + 9, 4.5, 2.5), C.steel);
      F.part(line(cx - W - 5, cy + 9, cx - W + 3, cy + 9, 1), C.trim, flat);
      crest(F, R(cx + 8) + s, cy + 10, C);
    }
  }

  // the arms hang at the sides: sleeves, then fingerless gloves (gauntlets on the BladeMaster); the
  // sword arm swings instead while attacking
  for (const side of [-1, 1]) {
    if (P.atk >= 0 && side < 0) continue;
    const x0 = side < 0 ? cx - W - 4 : R(cx + W + 0), x1 = side < 0 ? cx - W + 0 : R(cx + W + 4);
    if (m) F.part(rect(x0, cy + 10, x1, cy + 17), C.armor);
    else F.part(rect(x0, cy + 18, x1, cy + 20), C.shirt);
    F.part(rect(x0, m ? cy + 16 : cy + 20, x1, cy + 26), m ? C.armor : C.leather);
    F.part(line(x0, m ? cy + 16 : cy + 20, x1, m ? cy + 16 : cy + 20, 1), C.trim, flat);
    const hx = (x0 + x1) / 2;
    if (m) { // a gold cuff, an elbow point
      F.part(rect(x0, cy + 21, x1, cy + 23), C.trim, soft);
      F.dot(hx, cy + 22, C.gem);
      const ex = side < 0 ? x0 : x1;
      F.part(poly([[ex, cy + 14], [ex + side * 3, cy + 17], [ex, cy + 19]]), C.trim);
    }
    F.part(ellipse(hx, cy + 28, 2.8, 2.6), m ? C.armor : C.strap);
    if (m) F.part(line(hx - 2, cy + 27, hx + 2, cy + 27, 1), C.trim, flat); // gold knuckles
    F.dot(hx, cy + 30, C.skin); F.dot(hx + side, cy + 30, C.skin);
  }
  if (P.atk >= 0) swing(F, o, cx - W - 2, cy + 6, 'front');
  return F;
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip } = build(o), C = o.C, m = o.master;
  const R = (v) => v - r; // the far side (the viewer's right, turning away)
  if (P.atk >= 0 && behind(P.atk)) swing(F, o, R(cx + W + 2), cy + 6, 'front', true); // the blade in front of him, hidden
  // the sword at the hip, on the viewer's left from behind
  F.part(line(cx - 9, cy + 26, cx - 16, cy + 54, 2), C.sheath);
  F.part(line(cx - 15, cy + 50, cx - 16, cy + 54, 2), C.trim, flat);
  legs(F, o, cx, cy, r, 0);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), m ? C.armor : C.shirt);
  // below the belt
  if (m) {
    F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + 2), cy + (f ? 47 : 53)], [cx - hip - 2, cy + (f ? 47 : 53)]]), C.lining);
  } else {
    F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + (f ? 2 : 1)), cy + (f ? 35 : 38)], [cx - hip - (f ? 2 : 1), cy + (f ? 35 : 38)]]), C.shirt);
    F.part(poly([[cx - 4 + s, cy + 27], [cx + 4 + s, cy + 27], [cx + 4 + s, cy + (f ? 39 : 42)], [cx - 4 + s, cy + (f ? 39 : 42)]]), C.cape);
    F.part(line(cx - 4 + s, cy + (f ? 39 : 42), cx + 4 + s, cy + (f ? 39 : 42), 1), C.trim, flat);
  }
  F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.leather);
  // the arms at the sides (the sword arm swings while attacking)
  for (const side of [-1, 1]) {
    if (P.atk >= 0 && side > 0) continue;
    const x0 = side < 0 ? cx - W - 4 : R(cx + W + 0), x1 = side < 0 ? cx - W + 0 : R(cx + W + 4);
    F.part(rect(x0, cy + 10, x1, cy + 26), m ? C.armor : C.leather);
    F.part(ellipse((x0 + x1) / 2, cy + 28, 2.8, 2.6), m ? C.armor : C.strap);
  }
  if (m) {
    // the long cape to the ankles, pointed ends, gold trim and the big crest; a white edge where it folds
    const hem = [[R(cx + W + 8), cy + 56], [R(cx + W + 4), cy + 60], [R(cx + 7), cy + 56], [cx + 2 + s, cy + 61], [cx - 4 + s, cy + 56], [cx - W - 4, cy + 60], [cx - W - 8, cy + 56]];
    F.part(poly([[cx - W + 2, cy + 2], [R(cx + W - 2), cy + 2], [R(cx + W + 3), cy + 12], ...hem, [cx - W - 3, cy + 12]]), C.cape);
    for (const [x0, x1] of [[-5, -8], [5 - r, 7 - r], [-W + 1, -W - 3], [W - 1 - r, W + 3 - r]]) F.part(line(cx + x0 + s, cy + 30, cx + x1 + s, cy + 55, 1), C.fold, flat);
    F.part(line(cx - W - 7, cy + 55, cx - W - 4, cy + 18, 1), C.lining, flat);
    F.part(line(R(cx + W + 7), cy + 55, R(cx + W + 4), cy + 18, 1), C.lining, flat);
    for (let i = 0; i < hem.length - 1; i++) F.part(line(hem[i][0], hem[i][1] - 1, hem[i + 1][0], hem[i + 1][1] - 1, 1), C.trim, flat);
    for (const [x, y] of [hem[1], hem[3], hem[5]]) F.part(poly([[x - 1.5, y - 2], [x + 1.5, y - 2], [x, y + 1]]), C.trim); // gold tips
    edge(F, [[cx - W + 1 + s, cy + 10], [cx - W - 3 + s, cy + 50], [cx - 4 + s, cy + 53], [cx + s, cy + 56], [R(cx + 5) + s, cy + 53], [R(cx + W + 3) + s, cy + 50], [R(cx + W - 1) + s, cy + 10]], C.trim); // the filigree
    F.part(rect(cx - W - 1 + s, cy + 1, R(cx + W + 1) + s, cy + 4), C.armor); // the collar and shoulders over it
    F.part(line(cx - W - 1 + s, cy + 1, R(cx + W + 1) + s, cy + 1, 1), C.trim, flat);
    ring(F, cx + s, cy + 25, 9, 9, C.trim); // the winged crest in a gold ring
    for (const side of [-1, 1]) edge(F, [[cx + side * 4 + s, cy + 22], [cx + side * 12 + s, cy + 17], [cx + side * 10 + s, cy + 22], [cx + side * 13 + s, cy + 21], [cx + side * 9 + s, cy + 26]], C.crest);
    crest(F, cx + s, cy + 24, C, true);
    for (const side of [-1, 1]) collar(F, (u) => (side < 0 ? cx - u : R(cx + u)) + s, cy, C);
    for (const side of [-1, 1]) pauldron(F, side < 0 ? cx - W - 1 : R(cx + W + 1), cy, side, f, C);
    F.part(poly([[cx - 7 + s, cy - 3], [cx + 7 + s, cy - 3], [cx + 8 + s, cy + 3], [cx - 8 + s, cy + 3]]), C.armor); // the collar's back
    F.part(line(cx - 7 + s, cy - 3, cx + 7 + s, cy - 3, 1), C.trim, flat);
  } else {
    // the capelet over the back, gold-edged, with the crest
    F.part(poly([[cx - W - 1, cy + 2], [R(cx + W + 1), cy + 2], [R(cx + W + 4), cy + 12], [R(cx + W + 4), cy + 24], [cx - W - 4, cy + 24], [cx - W - 4, cy + 12]]), C.cape);
    F.part(line(cx - W - 4, cy + 24, R(cx + W + 4), cy + 24, 1), C.trim, flat);
    for (const x of [-W + 1, W - 1 - r]) F.part(line(cx + x + s, cy + 10, cx + x + s, cy + 22, 1), C.fold, flat);
    crest(F, cx + s, cy + 14, C, true);
    if (f) F.part(poly([[cx - 7 + s, cy - 3], [cx + 7 + s, cy - 3], [cx + 8 + s, cy + 3], [cx - 8 + s, cy + 3]]), C.cape); // the stand-up collar
    else F.part(ellipse(cx + s, cy + 2, 9, 3.5), C.cape); // the hood, bunched at the neck
    F.part(line(cx - 7 + s, cy + (f ? 3 : 5), cx + 7 + s, cy + (f ? 3 : 5), 1), C.trim, flat);
    if (!f) F.part(ellipse(cx - W - 1, cy + 6, 5, 4), C.steel);
  }
  if (P.atk >= 0 && !behind(P.atk)) swing(F, o, R(cx + W + 2), cy + 6, 'front', true);
  return F;
}

// facing right: the near (right) arm hangs at the front of the body, the cape flows behind
function side(F, o, cx, cy) {
  const { f } = build(o), C = o.C, m = o.master;
  const cy0 = cy - P.bob, knee = (m && f ? 34 : m ? 41 : 44) + cy0; // the legs stay on the ground
  const leg = (x, col) => {
    F.part(rect(x - 3, cy0 + 30, x + 2, cy0 + 58), C.pants);
    F.part(rect(x - 3, knee, x + 2, cy0 + 58), C.boot);
    F.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
    if (m) {
      F.part(line(x - 3, knee, x + 2, knee, 1), C.trim, flat);
      F.part(poly([[x + 1, cy0 + 39], [x + 5, cy0 + 44], [x + 2, cy0 + 50], [x, cy0 + 44]]), C.trim);
      F.dot(x + 2, cy0 + 44, C.gem);
      F.part(line(x - 3, cy0 + 52, x + 2, cy0 + 52, 1), C.trim, flat);
      F.part(ellipse(x + 4, cy0 + 61, 1.5, 1), C.trim, flat);
    }
    else F.part(poly([[x + 1, knee + 1], [x + 4, knee + 2], [x + 2, knee + 6]]), col);
  };
  // the cape behind
  if (m) {
    F.part(poly([[cx - 4, cy0 + 2], [cx - 8, cy0 + 6], [cx - 16, cy0 + 30], [cx - 21, cy0 + 56], [cx - 16, cy0 + 53], [cx - 13, cy0 + 59], [cx - 8, cy0 + 54], [cx - 4, cy0 + 30]]), C.cape);
    F.part(line(cx - 6, cy0 + 10, cx - 12, cy0 + 52, 1), C.lining, flat);
    F.part(line(cx - 21, cy0 + 55, cx - 16, cy0 + 52, 1), C.trim, flat);
    F.part(line(cx - 16, cy0 + 52, cx - 13, cy0 + 58, 1), C.trim, flat);
    F.part(line(cx - 9, cy0 + 10, cx - 18, cy0 + 52, 1), C.trim, flat);
    for (const [x, y] of [[cx - 21, cy0 + 56], [cx - 13, cy0 + 59]]) F.part(poly([[x - 1.5, y - 2], [x + 1.5, y - 2], [x, y + 1]]), C.trim);
    // the tall collar behind the head
    const pts = [[cx - 3, cy0 + 3], [cx - 6, cy - 5], [cx - 16, cy - 10], [cx - 14, cy - 2], [cx - 8, cy0 + 4]];
    F.part(poly(pts), C.armor);
    F.part(poly([[cx - 7, cy0 + 1], [cx - 8, cy - 3], [cx - 13, cy - 7], [cx - 12, cy - 2], [cx - 9, cy0 + 2]]), C.cape, soft);
    edge(F, pts.slice(1, 4), C.trim);
  }
  // the sword at the far hip, behind
  F.part(line(cx + 3, cy0 + 24, cx - 13, cy0 + 48, 2), C.sheath);
  F.part(line(cx - 11, cy0 + 45, cx - 13, cy0 + 48, 2), C.trim, flat);
  leg(cx - 2 - Math.round(3 * P.step), f ? C.trim : C.steel); // the far leg, then the near one, striding
  leg(cx + 2 + Math.round(3 * P.step), f ? C.trim : C.steel);
  // tails or skirt
  if (m) F.part(poly([[cx - 6, cy + 27], [cx + 6, cy + 27], [cx + 5, cy + (f ? 46 : 52)], [cx - 9, cy + (f ? 47 : 53)]]), C.lining);
  else F.part(poly([[cx - 6, cy + 27], [cx + 6, cy + 27], [cx + 7, cy + (f ? 35 : 38)], [cx - 7, cy + (f ? 35 : 38)]]), C.shirt);
  F.part(poly([[cx + 2, cy + 27], [cx + 6, cy + 27], [cx + 7, cy + (f ? 39 : 43)], [cx + 3, cy + (f ? 39 : 43)]]), C.cape); // the front panel
  F.part(line(cx + 3, cy + 28, cx + 3, cy + (f ? 39 : 43), 1), C.trim, flat);
  // the body
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), m ? C.armor : C.shirt);
  if (m && f) F.part(poly([[cx + 1, cy + 5], [cx + 7, cy + 9], [cx + 6, cy + 15], [cx + 1, cy + 15]]), C.shirt, soft);
  F.part(rect(cx - 6, cy + 24, cx + 6, cy + 26), C.leather);
  F.part(rect(cx + 5, cy + 24, cx + 6, cy + 26), C.trim, soft);
  if (m) {
    F.part(poly([[cx - 7, cy + 26], [cx - 3, cy + 26], [cx - 3, cy + 30], [cx - 7, cy + 30]]), C.leather);
    const pts = [[cx - 6, cy + 27], [cx + 7, cy + 27], [cx + 8, cy + 34], [cx - 5, cy + 33]]; // the hip plate
    F.part(poly(pts), C.armor);
    edge(F, pts.slice(1).concat([pts[0]]), C.trim);
    F.dot(cx + 2, cy + 30, C.gem);
    F.part(rect(cx - 1, cy + 23, cx + 3, cy + 27), C.trim);
    F.part(line(cx - 6, cy + 10, cx + 5, cy + 10, 1), C.trim, flat); // filigree on the armour
    F.part(line(cx - 6, cy + 19, cx + 6, cy + 19, 1), C.trim, flat);
    if (P.atk < 0) hilt(F, cx + 4, cy + 23, C, -1);
  }
  // shoulders and collar
  if (m) {
    F.part(poly([[cx - 4, cy - 3], [cx + 2, cy - 2], [cx + 3, cy + 4], [cx - 6, cy + 4]]), C.armor);
    F.part(line(cx - 4, cy - 3, cx + 2, cy - 2, 1), C.trim, flat);
    if (!f) F.part(ellipse(cx + 2, cy + 3, 3, 2), C.scarf);
  } else {
    F.part(poly([[cx - 7, cy + 1], [cx + 3, cy + 1], [cx + 6, cy + 10], [cx + 3, cy + 20], [cx - 11, cy + 25], [cx - 12, cy + 10]]), C.cape);
    F.part(line(cx + 3, cy + 20, cx - 11, cy + 25, 1), C.trim, flat);
    F.part(line(cx - 8, cy + 8, cx - 9, cy + 22, 1), C.fold, flat);
    F.part(line(cx + 6, cy + 10, cx + 3, cy + 20, 1), C.trim, flat);
    if (f) { F.part(poly([[cx - 4, cy - 3], [cx + 2, cy - 2], [cx + 3, cy + 3], [cx - 6, cy + 3]]), C.cape); F.part(line(cx - 4, cy - 3, cx + 2, cy - 2, 1), C.trim, flat); }
    else F.part(ellipse(cx - 1, cy + 2, 6, 3), C.cape);
  }
  // the near arm, hanging
  if (m) pauldron(F, cx - 1, cy, -1, f, C);
  else if (!f) F.part(ellipse(cx - 1, cy + 6, 4.5, 3.5), C.steel);
  if (P.atk >= 0) { swing(F, o, cx - 1, cy + 6, 'side'); return F; }
  F.part(rect(cx - 3, cy + (m ? 11 : 20), cx + 1, cy + 26), m ? C.armor : C.leather);
  if (!m) F.part(rect(cx - 3, cy + 18, cx + 1, cy + 19), C.shirt);
  F.part(line(cx - 3, cy + (m ? 16 : 20), cx + 1, cy + (m ? 16 : 20), 1), C.trim, flat);
  if (m) { F.part(rect(cx - 3, cy + 21, cx + 1, cy + 23), C.trim, soft); F.part(poly([[cx - 3, cy + 14], [cx - 6, cy + 17], [cx - 3, cy + 19]]), C.trim); }
  F.part(ellipse(cx, cy + 28, 2.6, 2.6), m ? C.armor : C.strap);
  F.dot(cx + 2, cy + 29, C.skin);
  return F;
}

// dir -> [view, mirrored]; heads: the trainee's head data, { dir: [x, crown, neck, ...] }
const VIEWS = {
  down: ['front', false], downright: ['front3', false], right: ['side', false], upright: ['back3', false], up: ['back', false],
  downleft: ['front3', true], left: ['side', true], upleft: ['back3', true],
};
// one design's frames: { dir: { canvas, foot } } (foot: rows from the frame's bottom to the ground)
export function paintBlader(id, heads) {
  const o = BLADERS[id], out = {};
  for (const [dir, [view, flip]] of Object.entries(VIEWS)) {
    const [x, , neck] = heads[dir];
    const cx = flip ? BW - 1 - x : x; // a mirrored view is painted unmirrored, then flipped
    const F = paint(o, view, Math.round(cx), neck);
    out[dir] = { canvas: (flip ? F.mirror() : F).toCanvas(), foot: BH - (neck + LEGS) };
  }
  return out;
}
// one design's moves: { dir: { idle, walk, attack, bob } } (design-anim.js animFrames)
export function animBlader(id, heads) {
  const o = BLADERS[id];
  return animFrames(VIEWS, heads, BW, (view, cx, cy, pose) => { P = pose; try { return paint(o, view, cx, cy); } finally { P = REST; } });
}
