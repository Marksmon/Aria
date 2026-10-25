// Sprite designs for the Sorcerer and the Wizard, male and female, painted in code like the Blader
// designs (bladers.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md). After the owner's two sheets:
// - Sorcerer: an open purple coat to the knee with gold-edged pointed hems and wide bell sleeves
//   lined in red, a high collar, a black shirt with a gold and blue gem pendant, red inner panels, a
//   brown belt with pouches, fingerless gloves, black trousers (black tights on her, with a red blouse and a
//   black corset) and black boots edged in gold; a bronze staff holding a blue crystal in a ring.
// - Wizard, grander than the Sorcerer: a deep navy robe to the ankles over a longer red layer,
//   every point of its hem hung with a blue crystal, gold filigree down its panels, a tall flared
//   collar (red inside) standing behind the head, a broad gold-edged mantle with gems at the shoulders, long
//   sleeves with crystal tassels, a wide black sash with a gold medallion, a chained book at the
//   hip, black boots (thigh-high on her, the robe open over them); a tall gold staff with crossed
//   rings around a blue star, sparkling.
// Standing only for now (the design), 8 directions: the left ones are the right ones mirrored.
// Not used in the game yet. Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)
const LEGS = 63;                 // chin to ground, in pixels, in every direction

const SORC = {
  coat: '#4c3888', fold: '#3a2a6c', lining: '#b8262e', liningDk: '#861a22', trim: '#cfa64c', shirt: '#25212d',
  blouse: '#c8343a', leather: '#6e4529', strap: '#4c2f1e', pants: '#24202b', boot: '#26212c', skin: '#f2c8a2',
  gem: '#5a86f0', shaft: '#7a5530', glove: '#2c2630',
};
const WIZ = {
  coat: '#25317a', fold: '#1b245e', lining: '#b8262e', liningDk: '#861a22', trim: '#d8ae4e', shirt: '#211d2c',
  blouse: '#c8343a', leather: '#5e3c26', strap: '#40281a', pants: '#1f1c27', boot: '#221f2a', skin: '#f2c8a2',
  gem: '#4c90ff', shaft: '#d8ae4e', glove: '#252030', book: '#2a3478',
};
export const MAGES = {
  sorcM: { name: 'Sorcerer', sex: 'm', wiz: false, C: SORC },
  sorcF: { name: 'Sorcerer', sex: 'f', wiz: false, C: SORC },
  wizM: { name: 'Wizard', sex: 'm', wiz: true, C: WIZ },
  wizF: { name: 'Wizard', sex: 'f', wiz: true, C: WIZ },
};

const flat = { outline: false, flat: true }; // a trim's line: no outline or shading
const soft = { outline: false };             // shaded, but no outline (a panel inside a part)
const edge = (F, pts, col) => { for (let i = 0; i < pts.length - 1; i++) F.part(line(...pts[i], ...pts[i + 1], 1), col, flat); };

function build(o) {
  const f = o.sex === 'f';
  return {
    f, W: f ? 11 : 12, waist: f ? 7 : 9, hip: f ? 10 : 9,
    legs: f ? [[-7, -2], [2, 7]] : [[-7, -2], [2, 7]],
    knee: o.wiz && f ? 34 : 42, // where the boots start, below the chin
    hem: o.wiz ? 55 : f ? 52 : 50, // where the coat ends (the Wizard's red layer falls 3 lower)
  };
}

// a thin ring of dots (the Wizard's staff and back emblem)
function ring(F, x, y, rx, ry, col) {
  for (let a = 0; a < 64; a++) F.dot(x + Math.cos((a / 64) * 2 * Math.PI) * rx, y + Math.sin((a / 64) * 2 * Math.PI) * ry, col);
}
// a blue crystal hanging on a short gold chain
function crystal(F, x, y, C, len = 2) {
  F.part(line(x, y, x, y + len, 1), C.trim, flat);
  F.dot(x, y + len + 1, C.gem); F.dot(x, y + len + 2, C.gem); F.dot(x, y + len + 3, '#2c5cc0');
}

// the star: the Wizard's mark (a four-point star), the Sorcerer's a diamond
function mark(F, x, y, C, wiz, big = false) {
  if (wiz) {
    const k = big ? 2 : 1;
    F.part(poly([[x, y - 3 * k], [x + k, y - k], [x + 3 * k, y], [x + k, y + k], [x, y + 3 * k], [x - k, y + k], [x - 3 * k, y], [x - k, y - k]]), C.trim, big ? {} : flat);
    F.dot(x, y, C.gem);
  } else {
    const k = big ? 3 : 2;
    F.part(poly([[x, y - k - 1], [x + k, y], [x, y + k + 1], [x - k, y]]), C.trim, big ? {} : flat);
    F.dot(x, y, C.gem);
    if (big) { F.dot(x, y - 1, C.gem); F.dot(x, y + 1, C.gem); }
  }
}

// the staff, upright, the hand at hy: a bronze crook holding a crystal (Sorcerer), a gold ring around
// a star with a crystal hanging under it (Wizard)
function staff(F, x, top, bottom, C, wiz) {
  F.part(line(x, top + 4, x, bottom, 2), C.shaft);
  if (wiz) {
    top -= 3;
    F.part(poly([[x - 2, top + 7], [x + 2, top + 7], [x + 1, top + 11], [x - 1, top + 11]]), C.trim); // the collar under the head
    F.part(ellipse(x, top, 6.5, 6.5), C.trim);
    F.part(ellipse(x, top, 4.5, 4.5), C.coat, soft);
    ring(F, x, top, 9, 2.6, C.trim); // the crossed ring
    F.part(poly([[x, top - 5], [x + 1, top - 1], [x + 4, top], [x + 1, top + 1], [x, top + 5], [x - 1, top + 1], [x - 4, top], [x - 1, top - 1]]), C.gem, flat);
    F.dot(x, top, '#e2eeff'); F.dot(x, top - 1, '#cfe2ff');
    F.part(line(x, top - 7, x, top - 11, 1), C.trim, flat); // the spike, a small star on its tip
    F.dot(x - 1, top - 12, C.trim); F.dot(x + 1, top - 12, C.trim); F.dot(x, top - 13, C.trim); F.dot(x, top - 12, '#e2eeff');
    crystal(F, x - 6, top + 5, C, 3); crystal(F, x + 6, top + 5, C, 3);
    for (const [dx, dy] of [[-9, -6], [8, -8], [-11, 3], [10, 5], [-4, -12], [5, 10]]) F.dot(x + dx, top + dy, '#a8ccff'); // sparkles
  } else {
    F.part(poly([[x - 1, top + 5], [x - 5, top + 1], [x - 4, top - 5], [x, top - 8], [x + 1, top - 6], [x - 2, top - 4], [x - 2, top], [x + 1, top + 4]]), C.shaft);
    F.part(poly([[x + 1, top - 5], [x + 4, top - 1], [x + 1, top + 4], [x - 2, top - 1]]), C.gem);
    F.dot(x, top - 2, '#cfe2ff');
    F.part(line(x + 3, top + 4, x + 3, top + 8, 1), C.shaft, flat);
    F.dot(x + 3, top + 9, C.gem);
  }
}

// one side of the Wizard's tall collar, standing up behind the head and flaring out beside it,
// its lining inside and edged in gold. X(u): a point u pixels out from the middle on this side
function collar(F, X, cy, C) {
  const pts = [[X(4), cy + 3], [X(7), cy - 4], [X(16), cy - 11], [X(15), cy - 3], [X(11), cy + 4]];
  F.part(poly(pts), C.coat);
  F.part(poly([[X(7), cy + 1], [X(8), cy - 3], [X(14), cy - 8], [X(13), cy - 3], [X(10), cy + 2]]), C.lining, soft);
  edge(F, pts.slice(1, 4), C.trim);
  F.dot(X(16), cy - 12, C.gem);
}

function legs(F, o, cx, cy, r, toe) {
  const { f, legs: L, knee } = build(o), C = o.C;
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0, mid = cx + (a + b) / 2 + sh;
    F.part(rect(cx + a + sh, cy + 30, cx + b + sh, cy + 58), C.pants);
    F.part(rect(cx + a - (f ? 0 : 1) + sh, cy + knee, cx + b + (f ? 0 : 1) + sh, cy + 58), C.boot);
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cy + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    F.part(line(cx + a - (f ? 0 : 1) + sh, cy + knee, cx + b + (f ? 0 : 1) + sh, cy + knee, 1), C.trim, flat);
    const ky = cy + (o.wiz && f ? 44 : knee + 2);
    F.part(poly([[mid - 2, ky], [mid + 2, ky], [mid, ky + 4]]), C.trim);
    F.dot(mid, ky + 1, C.gem);
    F.part(line(mid - 3, cy + 57, mid + 3, cy + 57, 1), C.trim, flat);
  });
}

function paint(o, view, cx, cy) {
  const F = new Frame(BW, BH);
  if (view === 'side') return side(F, o, cx, cy);
  const back = view === 'back' || view === 'back3';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0; // the front (or the seam) turns this way
  const r = view === 'front3' || view === 'back3' ? 3 : 0;     // the far side narrows
  return back ? backView(F, o, cx, cy, s, r) : frontView(F, o, cx, cy, s, r);
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C, w = o.wiz;
  const R = (v) => v - r;
  const sx = cx - W - 8; // the staff, in the hand on the viewer's left, clear of long hair

  staff(F, sx, cy - 10, cy + 60, C, w);
  // the coat's back half behind the legs: its red lining, its colour at the edges, pointed hem
  const back = [[cx - W - 6, cy + hem - 2], [cx - W - 3, cy + hem - 5], [cx - 4, cy + hem + 1], [R(cx + 4), cy + hem - 2], [R(cx + W + 4), cy + hem + 1], [R(cx + W + 7), cy + hem - 4]];
  F.part(poly([[cx - W, cy + 6], [R(cx + W), cy + 6], ...back.slice().reverse()]), C.coat);
  F.part(poly([[cx - W + 2, cy + 10], [R(cx + W - 2), cy + 10], [R(cx + W + 4), cy + hem - 3], [cx - 4, cy + hem - 1], [cx - W - 3, cy + hem - 6]]), C.fold, soft);
  F.part(line(cx - W - 1, cy + 20, cx - W - 4, cy + hem - 6, 2), C.lining, flat);
  F.part(line(R(cx + W + 1), cy + 20, R(cx + W + 4), cy + hem - 5, 2), C.lining, flat);
  edge(F, back.map(([x, y]) => [x, y - 1]), C.trim);
  if (w) { // the red layer's points below the hem, each with a crystal
    for (const [x, y] of [[cx - W - 3, cy + hem - 2], [cx - 4, cy + hem + 4], [R(cx + W + 4), cy + hem + 4]]) {
      F.part(poly([[x - 3, y - 4], [x + 3, y - 4], [x, y]]), C.lining);
      crystal(F, x, y + 1, C, 0);
    }
  }
  legs(F, o, cx, cy, r, s);

  // the body: a black shirt; on her, a red blouse over a black corset
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.shirt);
  if (f) {
    F.part(poly([[cx - 7 + s, cy + 4], [cx + 7 + s, cy + 4], [cx + 7 + s, cy + 14], [cx + s, cy + 16], [cx - 7 + s, cy + 14]]), C.blouse);
    F.part(line(cx + s, cy + 17, cx + s, cy + 23, 1), C.trim, flat);
  } else {
    F.part(poly([[cx - 3 + s, cy + 6], [cx + 3 + s, cy + 6], [cx + 6 + s, cy + 24], [cx - 6 + s, cy + 24]]), C.lining, soft); // the red inner panel
    F.part(line(cx + s, cy + 3, cx + s, cy + 10, 1), C.trim, flat); // the pendant's chain
  }
  // below the belt: red panels down the front (a skirt on her), open over the legs
  const pl = f ? (w ? 46 : 44) : (w ? 56 : 48);
  if (f) F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + 1), cy + 33], [cx - hip - 1, cy + 33]]), C.shirt); // her short black skirt
  F.part(poly([[cx - hip, cy + 27], [cx - 3 + s, cy + 27], [cx - 4 + s, cy + pl - 3], [cx - hip + 1, cy + pl + 1], [cx - hip - 2, cy + pl - 2]]), C.lining);
  F.part(poly([[R(cx + hip), cy + 27], [cx + 3 + s, cy + 27], [cx + 4 + s, cy + pl - 3], [R(cx + hip - 1), cy + pl + 1], [R(cx + hip + 2), cy + pl - 2]]), C.lining);
  if (f && w) F.part(poly([[cx - 1 + s, cy + 27], [cx + 3 + s, cy + 27], [cx + 3 + s, cy + 33], [cx - 1 + s, cy + 33]]), C.lining, soft); // the slit's top

  // the coat's front panels, open down the middle, gold-edged with pointed hems
  for (const side of [-1, 1]) {
    const ox = side < 0 ? cx - W - 1 : R(cx + W + 1), ix = cx + side * (f ? 7 : 5) + s;
    const bx = side < 0 ? cx - W - 5 : R(cx + W + 5), mx = cx + side * (f ? 9 : 7) + s;
    const pts = f && !w
      ? [[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx, cy + hem - 3], [bx + side * -3, cy + hem], [mx + side * 2, cy + 30], [ix + side * 2, cy + 24]] // her jacket: short in front, tails to the sides
      : [[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx, cy + hem - 2], [bx - side * 3, cy + hem + 1], [mx, cy + hem - 4], [mx, cy + 30], [ix + side, cy + 22]];
    if (w) { // the red layer under it, longer, pointed, with crystals
      const lp = [[mx, cy + 30], [mx, cy + hem], [(bx + mx) / 2, cy + hem + 4], [bx - side * 3, cy + hem + 4], [bx, cy + hem]];
      F.part(poly(lp), C.lining);
      edge(F, lp.slice(1, 4), C.liningDk);
      crystal(F, (bx + mx) / 2, cy + hem + 5, C, 0);
      crystal(F, bx - side * 3, cy + hem + 5, C, 0);
    }
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(3).concat([[ix, cy + 3]]), C.trim);
    F.part(line(ox - side * 2, cy + 20, bx - side * 2, cy + hem - 6, 1), C.fold, flat);
    if (w) { // gold filigree down the panel, stars along it
      F.part(line(ix + side * 3, cy + 8, mx + side * 2, cy + hem - 6, 1), C.trim, flat);
      for (const y of [36, 44]) F.dot(mx + side * 4, cy + y, C.trim);
      mark(F, (bx + mx) / 2 + side, cy + hem - 8, C, w, true);
    } else mark(F, (bx + mx) / 2 + side, cy + hem - 9, C, w);
  }
  // the belt and a pouch (Sorcerer); the Wizard's wide sash with a gold medallion, chains and crystals,
  // and his book chained at the hip
  if (w) {
    F.part(rect(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 27), C.shirt);
    F.part(line(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 21, 1), C.trim, flat);
    F.part(line(cx - hip - 1, cy + 27, R(cx + hip + 1), cy + 27, 1), C.trim, flat);
    F.part(line(cx - hip, cy + 28, cx - 2 + s, cy + 31, 1), C.trim, flat); // a hanging chain
    F.part(line(cx + 2 + s, cy + 31, R(cx + hip), cy + 28, 1), C.trim, flat);
    F.part(ellipse(cx + s, cy + 24, 3, 3), C.trim);
    F.dot(cx + s, cy + 24, C.gem); F.dot(cx + s, cy + 23, '#a8ccff');
    for (const dx of [-6, 6]) crystal(F, cx + dx + s, cy + 28, C, 4);
    F.part(rect(R(cx + hip - 2), cy + 27, R(cx + hip + 4), cy + 36), C.book);
    F.part(rect(R(cx + hip - 1), cy + 27, R(cx + hip - 1), cy + 36), C.lining, flat);
    for (const [dx, dy] of [[-2, 27], [4, 27], [-2, 36], [4, 36]]) F.dot(R(cx + hip + dx), cy + dy, C.trim);
    mark(F, R(cx + hip + 2), cy + 31, C, w);
  } else {
    F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.leather);
    F.part(rect(cx - 1 + s, cy + 24, cx + 1 + s, cy + 26), C.trim, soft);
    F.part(line(cx - hip + 1, cy + 27, R(cx + hip - 1), cy + 28, 1), C.strap, flat);
    F.part(rect(R(cx + hip - 3), cy + 26, R(cx + hip + 1), cy + 31), C.leather);
    F.dot(R(cx + hip - 1), cy + 28, C.trim);
    F.part(line(cx + 3 + s, cy + 27, cx + 3 + s, cy + 32, 1), C.trim, flat);
    F.dot(cx + 3 + s, cy + 33, C.gem); F.dot(cx + 3 + s, cy + 34, C.gem);
  }

  // the collar and chest gem; the Wizard's tall flared collar and broad mantle over the shoulders
  if (w) {
    for (const side of [-1, 1]) {
      const X = (u) => (side < 0 ? cx - u : R(cx + u)) + s;
      collar(F, X, cy, C);
      const ox = side < 0 ? cx - W - 5 : R(cx + W + 5), ix = cx + side * 4 + s;
      const pts = [[ix, cy + 1], [ox, cy + 4], [ox + side, cy + 14], [ox - side * 3, cy + 19], [ix + side * 4, cy + 13]];
      F.part(poly(pts), C.coat);
      edge(F, pts.slice(1).concat([[ix, cy + 1]]), C.trim);
      edge(F, [[ix + side * 2, cy + 4], [ox - side * 2, cy + 6], [ox - side, cy + 13], [ox - side * 3, cy + 16]], C.trim); // the filigree
      F.part(ellipse(ox - side * 3, cy + 8, 1.6, 1.6), C.trim);
      F.dot(ox - side * 3, cy + 8, C.gem);
      crystal(F, ox - side * 3, cy + 20, C, 1);
    }
  }
  F.part(poly([[cx - 6 + s, cy - 3], [cx - 3 + s, cy + 1], [cx - 5 + s, cy + 5], [cx - 9 + s, cy + 3]]), C.coat);
  F.part(poly([[cx + 6 + s, cy - 3], [cx + 3 + s, cy + 1], [cx + 5 + s, cy + 5], [cx + 9 + s, cy + 3]]), C.coat);
  F.part(line(cx - 6 + s, cy - 3, cx - 9 + s, cy + 3, 1), C.trim, flat);
  F.part(line(cx + 6 + s, cy - 3, cx + 9 + s, cy + 3, 1), C.trim, flat);
  F.part(rect(cx - 3 + s, cy - 1, cx + 3 + s, cy + 2), C.shirt); // the shirt's own high collar
  mark(F, cx + s, f ? cy + 6 : cy + 12, C, w);

  // bell sleeves flaring wide, the red lining showing in the slanted opening, the gloved hands
  // under them; the near hand holds the staff. The Wizard's are longer, with a crystal tassel
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? cx - W - 3 : R(cx + W - 1), x1 = side < 0 ? cx - W + 1 : R(cx + W + 3);
    const out = side < 0 ? x0 - (w ? 8 : 6) : x1 + (w ? 8 : 6), inn = side < 0 ? x1 + 1 : x0 - 1;
    const yi = w ? 24 : 21, yo = w ? 33 : 27; // the opening, from the inner to the outer corner
    F.part(poly([[x0, cy + 4], [x1, cy + 4], [inn, cy + yi], [out, cy + yo]]), C.coat);
    F.part(poly([[inn, cy + yi - 2], [out, cy + yo - 2], [out, cy + yo], [inn, cy + yi]]), C.lining, soft);
    F.part(line(inn, cy + yi + 1, out, cy + yo + 1, 1), C.trim, flat);
    F.part(line((x0 + x1) / 2, cy + 8, (inn + out) / 2 - side, cy + yi, 1), C.fold, flat);
    if (w) { F.part(line((x0 + x1) / 2 + side, cy + 6, out + side * -1, cy + yo - 3, 1), C.trim, flat); crystal(F, out, cy + yo + 1, C, 2); }
    const hx = side < 0 ? sx + 1 : (x0 + x1) / 2 + 2;
    const hy = cy + yi + ((yo - yi) * (inn - hx)) / (inn - out) + 2; // under the opening
    F.part(ellipse(hx, hy, 2.8, 2.6), C.glove);
    F.dot(hx + side, hy + 1.5, C.skin);
  }
  return F;
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C, w = o.wiz;
  const R = (v) => v - r;
  // the staff in the far hand, on the viewer's right from behind
  staff(F, R(cx + W + 8), cy - 10, cy + 60, C, w);
  legs(F, o, cx, cy, r, 0);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.coat);
  // the coat's back: to the knee (to the ankle on the Wizard), split up the middle in pointed tails
  const tails = [[R(cx + W + 6), cy + hem - 3], [R(cx + W + 3), cy + hem], [R(cx + 6), cy + hem - 3], [cx + 1 + s, cy + hem + 1], [cx - 5 + s, cy + hem - 3], [cx - W - 3, cy + hem], [cx - W - 6, cy + hem - 3]];
  F.part(poly([[cx - W, cy + 4], [R(cx + W), cy + 4], [R(cx + W + 2), cy + 16], ...tails, [cx - W - 2, cy + 16]]), C.coat);
  edge(F, tails.map(([x, y]) => [x, y - 1]), C.trim);
  for (const [a, b] of [[-W + 2, -W - 2], [W - 2 - r, W + 2 - r], [-3, -4], [3 - r, 4 - r]]) F.part(line(cx + a + s, cy + 30, cx + b + s, cy + hem - 4, 1), C.fold, flat);
  F.part(line(cx + s, cy + 32, cx + s, cy + hem - 2, 1), C.lining, flat); // the red layer shows in the split
  if (w) {
    // the red layer's points below every tail, each with a crystal; gold filigree up the robe
    for (const [x, y] of tails.filter((_, i) => i % 2 === 1)) {
      F.part(poly([[x - 3, y - 3], [x + 3, y - 3], [x, y + 3]]), C.lining);
      crystal(F, x, y + 4, C, 0);
    }
    for (const side of [-1, 1]) F.part(line(cx + side * 6 + s - (side > 0 ? r : 0), cy + 30, cx + side * 8 + s - (side > 0 ? r : 0), cy + hem - 4, 1), C.trim, flat);
    F.part(rect(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 27), C.shirt); // the sash
    F.part(line(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 21, 1), C.trim, flat);
    F.part(line(cx - hip - 1, cy + 27, R(cx + hip + 1), cy + 27, 1), C.trim, flat);
    for (const dx of [-6, 0, 6]) crystal(F, cx + dx + s, cy + 28, C, 3);
    ring(F, cx + s, cy + 40, 6, 6, C.trim); // the great star on the back
    mark(F, cx + s, cy + 40, C, w, true);
    for (const [dx, dy] of [[0, -9], [0, 9], [-9, 0], [9, 0]]) F.dot(cx + dx + s, cy + 40 + dy, C.trim);
  } else {
    F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.leather);
    mark(F, cx + s, cy + 14, C, w, true);
  }
  // the sleeves (the Wizard's longer, with crystal tassels)
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? cx - W - 3 : R(cx + W - 1), x1 = side < 0 ? cx - W + 1 : R(cx + W + 3);
    const out = side < 0 ? x0 - (w ? 8 : 6) : x1 + (w ? 8 : 6), inn = side < 0 ? x1 + 1 : x0 - 1;
    const yi = w ? 24 : 21, yo = w ? 33 : 27;
    F.part(poly([[x0, cy + 4], [x1, cy + 4], [inn, cy + yi], [out, cy + yo]]), C.coat);
    F.part(line(inn, cy + yi + 1, out, cy + yo + 1, 1), C.trim, flat);
    F.part(line((x0 + x1) / 2, cy + 8, (inn + out) / 2 - side, cy + yi, 1), C.fold, flat);
    if (w) crystal(F, out, cy + yo + 1, C, 2);
    const hx = side < 0 ? (x0 + x1) / 2 - 2 : R(cx + W + 8) - 1;
    F.part(ellipse(hx, cy + yi + ((yo - yi) * (inn - hx)) / (inn - out) + 2, 2.8, 2.6), C.glove);
  }
  // the collar, or the Wizard's mantle with its hood
  if (w) {
    const pts = [[cx - W - 5, cy + 3], [R(cx + W + 5), cy + 3], [R(cx + W + 6), cy + 14], [cx + s, cy + 23], [cx - W - 6, cy + 14]];
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(2), C.trim);
    edge(F, [[R(cx + W + 3), cy + 13], [cx + s, cy + 20], [cx - W - 3, cy + 13]], C.trim); // the filigree
    crystal(F, cx + s, cy + 24, C, 1);
    for (const side of [-1, 1]) { const x = side < 0 ? cx - W - 2 : R(cx + W + 2); F.part(ellipse(x, cy + 8, 1.6, 1.6), C.trim); F.dot(x, cy + 8, C.gem); }
    for (const side of [-1, 1]) collar(F, (u) => (side < 0 ? cx - u : R(cx + u)) + s, cy, C);
    F.part(rect(cx - 7 + s, cy - 4, cx + 7 + s, cy + 3), C.coat); // the collar's back, behind the neck
    F.part(line(cx - 7 + s, cy - 4, cx + 7 + s, cy - 4, 1), C.trim, flat);
  } else {
    F.part(poly([[cx - 7 + s, cy - 3], [cx + 7 + s, cy - 3], [cx + 9 + s, cy + 4], [cx - 9 + s, cy + 4]]), C.coat);
    F.part(line(cx - 7 + s, cy - 3, cx + 7 + s, cy - 3, 1), C.trim, flat);
  }
  return F;
}

// facing right: the coat flows behind, the near hand holds the staff in front
function side(F, o, cx, cy) {
  const { f, knee, hem } = build(o), C = o.C, w = o.wiz;
  // the coat behind, its tails pointed
  const tails = [[cx - 18, cy + hem - 1], [cx - 13, cy + hem - 4], [cx - 9, cy + hem + 1], [cx - 4, cy + hem - 3]];
  F.part(poly([[cx - 5, cy + 2], [cx - 9, cy + 8], [cx - 15, cy + 30], ...tails, [cx - 2, cy + 30]]), C.coat);
  F.part(line(cx - 7, cy + 12, cx - 12, cy + hem - 6, 1), C.fold, flat);
  edge(F, tails.map(([x, y]) => [x, y - 1]), C.trim);
  if (w) {
    for (const [x, y] of [tails[0], tails[2]]) { F.part(poly([[x - 2, y - 3], [x + 3, y - 3], [x, y + 3]]), C.lining); crystal(F, x, y + 4, C, 0); }
    F.part(line(cx - 9, cy + 14, cx - 15, cy + hem - 6, 1), C.trim, flat);
    // the tall collar, standing behind the head
    const pts = [[cx - 3, cy + 3], [cx - 7, cy - 5], [cx - 17, cy - 11], [cx - 15, cy - 2], [cx - 9, cy + 4]];
    F.part(poly(pts), C.coat);
    F.part(poly([[cx - 8, cy + 1], [cx - 9, cy - 3], [cx - 15, cy - 8], [cx - 13, cy - 2], [cx - 10, cy + 2]]), C.lining, soft);
    edge(F, pts.slice(1, 4), C.trim);
    F.dot(cx - 17, cy - 12, C.gem);
  }
  const leg = (x) => {
    F.part(rect(x - 3, cy + 30, x + 2, cy + 58), C.pants);
    F.part(rect(x - 3, cy + knee, x + 2, cy + 58), C.boot);
    F.part(ellipse(x + 1, cy + 60.5, 4.5, 2.5), C.boot);
    F.part(line(x - 3, cy + knee, x + 2, cy + knee, 1), C.trim, flat);
    const ky = cy + (w && f ? 44 : knee + 2);
    F.part(poly([[x + 1, ky], [x + 4, ky + 1], [x + 2, ky + 5]]), C.trim);
  };
  leg(cx - 2);
  leg(cx + 2);
  // the red layer and the coat's front edge
  F.part(poly([[cx - 4, cy + 27], [cx + 6, cy + 27], [cx + 5, cy + (f ? 44 : 48)], [cx - 6, cy + (f ? 46 : 50)]]), C.lining);
  if (!(f && !w)) {
    const pts = [[cx + 3, cy + 26], [cx + 7, cy + 26], [cx + 6, cy + hem - 2], [cx + 2, cy + hem + 1]];
    F.part(poly(pts), C.coat);
    F.part(line(cx + 6, cy + 27, cx + 6, cy + hem - 3, 1), C.trim, flat);
  }
  // the body
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), C.coat);
  F.part(poly([[cx + 2, cy + 3], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 2, cy + 22]]), f ? C.blouse : C.shirt, soft);
  F.part(line(cx + 2, cy + 3, cx + 2, cy + 22, 1), C.trim, flat);
  if (w) {
    F.part(rect(cx - 7, cy + 21, cx + 7, cy + 27), C.shirt);
    F.part(line(cx - 7, cy + 21, cx + 7, cy + 21, 1), C.trim, flat);
    F.part(line(cx - 7, cy + 27, cx + 7, cy + 27, 1), C.trim, flat);
    F.part(ellipse(cx + 6, cy + 24, 1.6, 2.5), C.trim); F.dot(cx + 6, cy + 24, C.gem);
    crystal(F, cx + 4, cy + 28, C, 3);
    F.part(rect(cx - 8, cy + 27, cx - 2, cy + 36), C.book);
    for (const [x, y] of [[-8, 27], [-2, 27], [-8, 36], [-2, 36]]) F.dot(cx + x, cy + y, C.trim);
    mark(F, cx - 5, cy + 31, C, w);
  } else F.part(rect(cx - 7, cy + 24, cx + 7, cy + 26), C.leather);
  if (!w) { F.part(rect(cx - 7, cy + 26, cx - 3, cy + 31), C.leather); F.dot(cx - 5, cy + 28, C.trim); }
  // the collar, the mantle
  F.part(poly([[cx - 5, cy - 3], [cx + 1, cy - 2], [cx + 3, cy + 4], [cx - 7, cy + 4]]), C.coat);
  F.part(line(cx - 5, cy - 3, cx + 1, cy - 2, 1), C.trim, flat);
  if (w) {
    const pts = [[cx - 11, cy + 2], [cx + 4, cy + 2], [cx + 8, cy + 13], [cx - 2, cy + 19], [cx - 13, cy + 14]];
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(1), C.trim);
    edge(F, [[cx + 5, cy + 11], [cx - 2, cy + 16], [cx - 10, cy + 12]], C.trim);
    F.part(ellipse(cx - 1, cy + 8, 1.6, 1.6), C.trim); F.dot(cx - 1, cy + 8, C.gem);
    crystal(F, cx - 2, cy + 20, C, 1);
  }
  // the near sleeve, the staff, the hand on it
  const sx = cx + 14;
  staff(F, sx, cy - 12, cy + 60, C, w);
  if (w) { // the long sleeve hangs below the forearm
    F.part(poly([[cx - 4, cy + 4], [cx + 1, cy + 4], [cx + 6, cy + 14], [cx + 12, cy + 20], [cx + 6, cy + 32], [cx - 2, cy + 24]]), C.coat);
    F.part(line(cx + 12, cy + 20, cx + 6, cy + 32, 1), C.trim, flat);
    F.part(line(cx + 6, cy + 32, cx - 2, cy + 24, 1), C.lining, flat);
    crystal(F, cx + 6, cy + 33, C, 2);
  }
  F.part(poly([[cx - 4, cy + 4], [cx + 1, cy + 4], [cx + 6, cy + 14], [cx + 12, cy + 20], [cx + 8, cy + 25], [cx - 2, cy + 19]]), C.coat);
  F.part(line(cx + 12, cy + 20, cx + 8, cy + 25, 1), C.trim, flat);
  F.part(line(cx - 1, cy + 8, cx + 4, cy + 17, 1), C.fold, flat);
  F.part(ellipse(sx - 1, cy + 22, 2.6, 2.6), C.glove);
  F.dot(sx - 1, cy + 24, C.skin);
  return F;
}

// dir -> [view, mirrored]; heads: the trainee's head data, { dir: [x, crown, neck, ...] }
const VIEWS = {
  down: ['front', false], downright: ['front3', false], right: ['side', false], upright: ['back3', false], up: ['back', false],
  downleft: ['front3', true], left: ['side', true], upleft: ['back3', true],
};
// one design's frames: { dir: { canvas, foot } } (foot: rows from the frame's bottom to the ground)
export function paintMage(id, heads) {
  const o = MAGES[id], out = {};
  for (const [dir, [view, flip]] of Object.entries(VIEWS)) {
    const [x, , neck] = heads[dir];
    const cx = flip ? BW - 1 - x : x; // a mirrored view is painted unmirrored, then flipped
    const F = paint(o, view, Math.round(cx), neck);
    out[dir] = { canvas: (flip ? F.mirror() : F).toCanvas(), foot: BH - (neck + LEGS) };
  }
  return out;
}
