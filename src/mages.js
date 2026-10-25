// Sprite designs for the Sorcerer and the Wizard, male and female, painted in code like the Blader
// designs (bladers.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md). After the owner's two sheets:
// - Sorcerer: an open purple coat to the knee with gold-edged pointed hems and wide bell sleeves, a
//   high collar, a black shirt with a gold and blue gem pendant, white inner panels, a brown belt
//   with pouches, fingerless gloves, black trousers (black tights on her, with a white blouse and a
//   black corset) and black boots edged in gold; a bronze staff holding a blue crystal in a ring.
// - Wizard: a deep navy robe to the ankles, lined in white, its hem pointed and hung with blue
//   crystals, a gold-edged mantle over the shoulders, a gold star gem on the chest, a book at the
//   hip, black boots (thigh-high on her, the robe open over them); a gold staff with a ring around a
//   blue star.
// Standing only for now (the design), 8 directions: the left ones are the right ones mirrored.
// Not used in the game yet. Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)
const LEGS = 63;                 // chin to ground, in pixels, in every direction

const SORC = {
  coat: '#4c3888', fold: '#3a2a6c', lining: '#ebe5d8', liningDk: '#cbc3b2', trim: '#cfa64c', shirt: '#25212d',
  blouse: '#ede7da', leather: '#6e4529', strap: '#4c2f1e', pants: '#24202b', boot: '#26212c', skin: '#f2c8a2',
  gem: '#5a86f0', shaft: '#7a5530', glove: '#2c2630',
};
const WIZ = {
  coat: '#25317a', fold: '#1b245e', lining: '#eeebf2', liningDk: '#c9c6d6', trim: '#d8ae4e', shirt: '#211d2c',
  blouse: '#f0ede6', leather: '#5e3c26', strap: '#40281a', pants: '#1f1c27', boot: '#221f2a', skin: '#f2c8a2',
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
    hem: o.wiz ? 58 : f ? 52 : 50, // where the coat ends
  };
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
    F.part(ellipse(x, top, 5.5, 5.5), C.trim);
    F.part(ellipse(x, top, 3.5, 3.5), C.coat, soft);
    F.part(poly([[x, top - 4], [x + 1, top - 1], [x + 3, top], [x + 1, top + 1], [x, top + 4], [x - 1, top + 1], [x - 3, top], [x - 1, top - 1]]), C.gem, flat);
    F.dot(x, top, '#cfe2ff');
    F.part(line(x, top - 6, x, top - 9, 1), C.trim, flat);
    F.part(line(x + 4, top + 6, x + 4, top + 9, 1), C.trim, flat);
    F.dot(x + 4, top + 10, C.gem); F.dot(x + 4, top + 11, C.gem);
  } else {
    F.part(poly([[x - 1, top + 5], [x - 5, top + 1], [x - 4, top - 5], [x, top - 8], [x + 1, top - 6], [x - 2, top - 4], [x - 2, top], [x + 1, top + 4]]), C.shaft);
    F.part(poly([[x + 1, top - 5], [x + 4, top - 1], [x + 1, top + 4], [x - 2, top - 1]]), C.gem);
    F.dot(x, top - 2, '#cfe2ff');
    F.part(line(x + 3, top + 4, x + 3, top + 8, 1), C.shaft, flat);
    F.dot(x + 3, top + 9, C.gem);
  }
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
  // the coat's back half behind the legs: its white lining, its colour at the edges, pointed hem
  const back = [[cx - W - 6, cy + hem - 2], [cx - W - 3, cy + hem - 5], [cx - 4, cy + hem + 1], [R(cx + 4), cy + hem - 2], [R(cx + W + 4), cy + hem + 1], [R(cx + W + 7), cy + hem - 4]];
  F.part(poly([[cx - W, cy + 6], [R(cx + W), cy + 6], ...back.slice().reverse()]), C.coat);
  F.part(poly([[cx - W + 2, cy + 10], [R(cx + W - 2), cy + 10], [R(cx + W + 4), cy + hem - 3], [cx - 4, cy + hem - 1], [cx - W - 3, cy + hem - 6]]), C.fold, soft);
  F.part(line(cx - W - 1, cy + 20, cx - W - 4, cy + hem - 6, 2), C.lining, flat);
  F.part(line(R(cx + W + 1), cy + 20, R(cx + W + 4), cy + hem - 5, 2), C.lining, flat);
  edge(F, back.map(([x, y]) => [x, y - 1]), C.trim);
  legs(F, o, cx, cy, r, s);

  // the body: a black shirt; on her, a white blouse over a black corset
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.shirt);
  if (f) {
    F.part(poly([[cx - 7 + s, cy + 4], [cx + 7 + s, cy + 4], [cx + 7 + s, cy + 14], [cx + s, cy + 16], [cx - 7 + s, cy + 14]]), C.blouse);
    F.part(line(cx + s, cy + 17, cx + s, cy + 23, 1), C.trim, flat);
  } else {
    F.part(poly([[cx - 3 + s, cy + 6], [cx + 3 + s, cy + 6], [cx + 6 + s, cy + 24], [cx - 6 + s, cy + 24]]), C.lining, soft); // the white inner panel
    F.part(line(cx + s, cy + 3, cx + s, cy + 10, 1), C.trim, flat); // the pendant's chain
  }
  // below the belt: white panels down the front (a skirt on her), open over the legs
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
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(3).concat([[ix, cy + 3]]), C.trim);
    F.part(line(ox - side * 2, cy + 20, bx - side * 2, cy + hem - 6, 1), C.fold, flat);
    mark(F, (bx + mx) / 2 + side, cy + hem - 9, C, w);
  }
  // the belt, its buckle, and a pouch (Sorcerer) or the book (Wizard) at the hip
  F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.leather);
  F.part(rect(cx - 1 + s, cy + 24, cx + 1 + s, cy + 26), C.trim, soft);
  F.part(line(cx - hip + 1, cy + 27, R(cx + hip - 1), cy + 28, 1), C.strap, flat);
  if (w) {
    F.part(rect(R(cx + hip - 3), cy + 26, R(cx + hip + 3), cy + 34), C.book);
    F.part(rect(R(cx + hip - 2), cy + 26, R(cx + hip - 2), cy + 34), C.lining, flat);
    F.dot(R(cx + hip), cy + 30, C.trim);
    // crystals hanging from the belt
    for (const dx of [-5, 5]) { F.part(line(cx + dx + s, cy + 27, cx + dx + s, cy + 33, 1), C.trim, flat); F.dot(cx + dx + s, cy + 34, C.gem); F.dot(cx + dx + s, cy + 35, C.gem); }
  } else {
    F.part(rect(R(cx + hip - 3), cy + 26, R(cx + hip + 1), cy + 31), C.leather);
    F.dot(R(cx + hip - 1), cy + 28, C.trim);
    F.part(line(cx + 3 + s, cy + 27, cx + 3 + s, cy + 32, 1), C.trim, flat);
    F.dot(cx + 3 + s, cy + 33, C.gem); F.dot(cx + 3 + s, cy + 34, C.gem);
  }

  // the collar and chest gem; the Wizard's mantle over the shoulders
  if (w) {
    for (const side of [-1, 1]) {
      const ox = side < 0 ? cx - W - 3 : R(cx + W + 3), ix = cx + side * 4 + s;
      const pts = [[ix, cy + 1], [ox, cy + 4], [ox + side, cy + 13], [ox - side * 4, cy + 16], [ix + side * 3, cy + 10]];
      F.part(poly(pts), C.coat);
      edge(F, pts.slice(1).concat([[ix, cy + 1]]), C.trim);
    }
  }
  F.part(poly([[cx - 6 + s, cy - 3], [cx - 3 + s, cy + 1], [cx - 5 + s, cy + 5], [cx - 9 + s, cy + 3]]), C.coat);
  F.part(poly([[cx + 6 + s, cy - 3], [cx + 3 + s, cy + 1], [cx + 5 + s, cy + 5], [cx + 9 + s, cy + 3]]), C.coat);
  F.part(line(cx - 6 + s, cy - 3, cx - 9 + s, cy + 3, 1), C.trim, flat);
  F.part(line(cx + 6 + s, cy - 3, cx + 9 + s, cy + 3, 1), C.trim, flat);
  F.part(rect(cx - 3 + s, cy - 1, cx + 3 + s, cy + 2), C.shirt); // the shirt's own high collar
  mark(F, cx + s, f ? cy + 6 : cy + 12, C, w);

  // bell sleeves flaring wide, the white lining showing in the slanted opening, the gloved hands
  // under them; the near hand holds the staff
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? cx - W - 3 : R(cx + W - 1), x1 = side < 0 ? cx - W + 1 : R(cx + W + 3);
    const out = side < 0 ? x0 - 6 : x1 + 6, inn = side < 0 ? x1 + 1 : x0 - 1;
    F.part(poly([[x0, cy + 4], [x1, cy + 4], [inn, cy + 21], [out, cy + 27]]), C.coat);
    F.part(poly([[inn, cy + 19], [out, cy + 25], [out, cy + 27], [inn, cy + 21]]), C.lining, soft);
    F.part(line(inn, cy + 22, out, cy + 28, 1), C.trim, flat);
    F.part(line((x0 + x1) / 2, cy + 8, (inn + out) / 2 - side, cy + 21, 1), C.fold, flat);
    const hx = side < 0 ? sx + 1 : (x0 + x1) / 2 + 2;
    F.part(ellipse(hx, cy + 28.5, 2.8, 2.6), C.glove);
    F.dot(hx + side, cy + 30, C.skin);
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
  F.part(line(cx + s, cy + 32, cx + s, cy + hem - 2, 1), C.lining, flat); // the white layer shows in the split
  F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.leather);
  if (w) for (const dx of [-6, 0, 6]) { F.part(line(cx + dx + s, cy + 27, cx + dx + s, cy + 32, 1), C.trim, flat); F.dot(cx + dx + s, cy + 33, C.gem); }
  mark(F, cx + s, cy + 14, C, w, true);
  // the sleeves
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? cx - W - 3 : R(cx + W - 1), x1 = side < 0 ? cx - W + 1 : R(cx + W + 3);
    const out = side < 0 ? x0 - 6 : x1 + 6, inn = side < 0 ? x1 + 1 : x0 - 1;
    F.part(poly([[x0, cy + 4], [x1, cy + 4], [inn, cy + 21], [out, cy + 27]]), C.coat);
    F.part(line(inn, cy + 22, out, cy + 28, 1), C.trim, flat);
    F.part(line((x0 + x1) / 2, cy + 8, (inn + out) / 2 - side, cy + 21, 1), C.fold, flat);
    F.part(ellipse(side < 0 ? (x0 + x1) / 2 - 2 : R(cx + W + 8) - 1, cy + 28.5, 2.8, 2.6), C.glove);
  }
  // the collar, or the Wizard's mantle with its hood
  if (w) {
    const pts = [[cx - W - 3, cy + 3], [R(cx + W + 3), cy + 3], [R(cx + W + 4), cy + 12], [cx + s, cy + 20], [cx - W - 4, cy + 12]];
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(2), C.trim);
    F.part(ellipse(cx + s, cy + 3, 8, 3.5), C.coat); // the hood, down
    F.part(line(cx - 6 + s, cy + 5, cx + 6 + s, cy + 5, 1), C.trim, flat);
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
  // the white layer and the coat's front edge
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
  F.part(rect(cx - 7, cy + 24, cx + 7, cy + 26), C.leather);
  if (w) { F.part(rect(cx - 7, cy + 26, cx - 2, cy + 33), C.book); F.dot(cx - 4, cy + 29, C.trim); }
  else { F.part(rect(cx - 7, cy + 26, cx - 3, cy + 31), C.leather); F.dot(cx - 5, cy + 28, C.trim); }
  // the collar, the mantle
  F.part(poly([[cx - 5, cy - 3], [cx + 1, cy - 2], [cx + 3, cy + 4], [cx - 7, cy + 4]]), C.coat);
  F.part(line(cx - 5, cy - 3, cx + 1, cy - 2, 1), C.trim, flat);
  if (w) {
    const pts = [[cx - 9, cy + 2], [cx + 4, cy + 2], [cx + 7, cy + 12], [cx - 2, cy + 17], [cx - 11, cy + 13]];
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(1), C.trim);
  }
  // the near sleeve, the staff, the hand on it
  const sx = cx + 14;
  staff(F, sx, cy - 12, cy + 60, C, w);
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
