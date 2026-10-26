// Sprite designs for the Magic Knight, male and female, painted in code like the Blader and mage
// designs (bladers.js, mages.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md). After the owner's Magic Knight sheet, recoloured to the owner's
// orange, white and yellow, and made as grand as the BladeMaster and the Wizard (steel and spell):
// an open orange coat worked with yellow filigree over long white layers whose points hang with
// glowing crystals, a tall flared collar standing behind the head, layered orange pauldrons with
// yellow points, long white over-sleeves with crystal tassels over black gauntlets, a black shirt
// with a compass medallion, a wide black sash with crossed belts, black boots with great yellow knee
// guards and toe caps (a white blouse, black corset, short white skirt and thigh-high boots on her),
// a drawn sword with a winged yellow guard and glowing runes held low, a glowing compass sigil
// floating by the other hand, and a great compass star in a ring on the coat's back.
// Standing, walking (8 frames) and attacking (7: the sword swung, the sigil flaring on the cut), 8
// directions: the left ones are the right ones mirrored.
// The game paints the hero's body from these (sprites.js designSet). Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SWING, SLASH, CAST, behind, swordArm, slashArc, burst, animFrames, VIEWS } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const C = {
  coat: '#e27a24', fold: '#b45816', lining: '#f3efe7', liningDk: '#cfc7b8', trim: '#f4c838', shirt: '#2a2329',
  blouse: '#f3efe7', belt: '#2c2227', pants: '#25202a', boot: '#2a2329', skin: '#f2c8a2', gem: '#fff2a6',
  core: '#ff9a2e', glove: '#2a2329', blade: '#dde1ea', glow: '#ffb04a', spark: '#ffd98a',
};
export const MKNIGHTS = { mknightM: { name: 'Magic Knight', sex: 'm' }, mknightF: { name: 'Magic Knight', sex: 'f' } };

const flat = { outline: false, flat: true }; // a trim's line: no outline or shading
let P = REST; // the pose being painted (design-anim.js): its step, bob and attack frame
// the sword arm swinging from the shoulder (x, y); mirror: the back view (the arm on the viewer's right)
function swing(F, x, y, view, mirror = false) {
  let [a, b] = SWING[view][P.atk];
  if (mirror) { a = 180 - a; b = 180 - b; }
  swordArm(F, x, y, a, b, { sleeve: C.coat, glove: C.glove, blade: C.blade, edge: C.glow, guard: C.trim, gem: C.core });
  if (P.atk === SLASH) slashArc(F, x, y, 30, mirror ? 140 : view === 'side' ? -40 : -60, mirror ? 30 : view === 'side' ? 50 : 40, '#fff1c4', C.glow);
}
const soft = { outline: false };             // shaded, but no outline (a panel inside a part)
const edge = (F, pts, col) => { for (let i = 0; i < pts.length - 1; i++) F.part(line(...pts[i], ...pts[i + 1], 1), col, flat); };

function build(o) {
  const f = o.sex === 'f';
  return { f, W: f ? 11 : 12, waist: f ? 6 : 9, hip: f ? 10 : 9, legs: [[-7, -2], [2, 7]], knee: f ? 40 : 42, hem: f ? 50 : 54 }; // (her thighs bare above her boots)
}

// the compass star: four long points, four short ones, a glowing middle
function compass(F, x, y, big = false) {
  const k = big ? 2 : 1;
  F.part(poly([[x, y - 4 * k], [x + k, y - k], [x + 4 * k, y], [x + k, y + k], [x, y + 4 * k], [x - k, y + k], [x - 4 * k, y], [x - k, y - k]]), C.trim, big ? {} : flat);
  if (big) for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) F.dot(x + dx, y + dy, C.trim);
  F.dot(x, y, C.core);
  if (big) { F.dot(x - 1, y, C.gem); F.dot(x + 1, y, C.gem); F.dot(x, y - 1, C.gem); F.dot(x, y + 1, C.gem); }
}

// a thin ring of dots
function ring(F, x, y, rx, ry, col) {
  for (let a = 0; a < 64; a++) F.dot(x + Math.cos((a / 64) * 2 * Math.PI) * rx, y + Math.sin((a / 64) * 2 * Math.PI) * ry, col);
}
// a glowing crystal hanging on a short yellow chain
function crystal(F, x, y, len = 2) {
  F.part(line(x, y, x, y + len, 1), C.trim, flat);
  F.dot(x, y + len + 1, C.gem); F.dot(x, y + len + 2, C.core); F.dot(x, y + len + 3, C.glow);
}
// one side of the tall collar: orange standing up behind the head and flaring out beside it, white
// inside, edged in yellow. X(u): a point u pixels out from the middle on this side
function collar(F, X, cy) {
  const pts = [[X(4), cy + 3], [X(6), cy - 4], [X(15), cy - 10], [X(14), cy - 2], [X(10), cy + 4]];
  F.part(poly(pts), C.coat);
  F.part(poly([[X(7), cy + 1], [X(7), cy - 3], [X(13), cy - 7], [X(12), cy - 2], [X(9), cy + 2]]), C.lining, soft);
  edge(F, pts.slice(1, 4), C.trim);
  F.dot(X(15), cy - 11, C.core);
}
// a layered pauldron: two orange plates edged in yellow, a yellow point flaring up and out, a gem.
// x: its middle; side: -1 on the viewer's left, 1 on the right
function pauldron(F, x, cy, side, f) {
  const w = f ? 4.5 : 5.5;
  F.part(poly([[x - side * 2, cy + 2], [x + side * (w + 1), cy - 3], [x + side * (w - 1), cy + 3]]), C.trim);
  for (const [dy, rw, rh] of [[9, w - 0.5, 2.5], [6, w + 0.5, 3.5]]) {
    F.part(ellipse(x, cy + dy, rw, rh), C.coat);
    F.part(line(x - rw * 0.6, cy + dy + rh - 0.5, x + rw * 0.6, cy + dy + rh - 0.5, 1), C.trim, flat);
    F.dot(x - rw * 0.85, cy + dy + rh - 1.5, C.trim); F.dot(x + rw * 0.85, cy + dy + rh - 1.5, C.trim);
  }
  F.part(ellipse(x, cy + 5, 1.6, 1.6), C.trim);
  F.dot(x, cy + 5, C.core);
}
// the glowing compass sigil floating by the free hand: a ring around a star, sparks about it
function sigil(F, x, y) {
  ring(F, x, y, 5, 5, C.glow);
  ring(F, x, y, 7, 2.2, C.spark);
  F.part(poly([[x, y - 4], [x + 1, y - 1], [x + 4, y], [x + 1, y + 1], [x, y + 4], [x - 1, y + 1], [x - 4, y], [x - 1, y - 1]]), C.gem, flat);
  F.dot(x, y, '#ffffff');
  for (const [dx, dy] of [[-7, -5], [6, -7], [8, 4], [-6, 7], [0, -9]]) F.dot(x + dx, y + dy, C.spark);
}

// the drawn sword, held low: the hilt in the hand at (x, y), the blade running to (tx, ty)
function sword(F, x, y, tx, ty) {
  F.part(line(x, y, tx, ty, 2), C.blade);
  F.part(line(x + (tx - x) * 0.15, y + (ty - y) * 0.15 + 1, tx, ty, 1), C.glow, flat); // the glowing edge
  const nx = (ty - y), ny = -(tx - x), n = Math.hypot(nx, ny) || 1; // across the blade, for the guard
  for (const k of [0.35, 0.55, 0.75]) F.dot(x + (tx - x) * k, y + (ty - y) * k, C.core); // glowing runes
  const ux = (tx - x) / Math.hypot(tx - x, ty - y), uy = (ty - y) / Math.hypot(tx - x, ty - y);
  F.part(poly([[x - (nx / n) * 5 - ux * 2, y - (ny / n) * 5 - uy * 2], [x - (nx / n) * 2, y - (ny / n) * 2], [x + (nx / n) * 2, y + (ny / n) * 2],
    [x + (nx / n) * 5 - ux * 2, y + (ny / n) * 5 - uy * 2], [x + (nx / n) * 3 + ux, y + (ny / n) * 3 + uy], [x - (nx / n) * 3 + ux, y - (ny / n) * 3 + uy]]), C.trim); // the winged guard
  F.dot(x, y, C.core);
  F.part(line(x, y, x - ux * 4, y - uy * 4, 2), C.shirt); // the grip above the hand
  F.part(ellipse(x - ux * 5, y - uy * 5, 1.5, 1.5), C.trim); // the pommel
  F.dot(x - ux * 5, y - uy * 5, C.core);
}

function legs(F, o, cx, cy, r, toe) {
  cy -= P.bob; // the feet stay on the ground while the body sinks
  const { f, legs: L, knee } = build(o);
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0, mid = cx + (a + b) / 2 + sh;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * 2); // the stepping leg lifts
    F.part(rect(cx + a + sh, cy + 30, cx + b + sh, cyl + 58), f ? C.skin : C.pants);
    F.part(rect(cx + a - (f ? 0 : 1) + sh, cyl + knee, cx + b + (f ? 0 : 1) + sh, cyl + 58), C.boot);
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    F.part(line(cx + a - (f ? 0 : 1) + sh, cyl + knee, cx + b + (f ? 0 : 1) + sh, cyl + knee, 1), C.trim, flat);
    const ky = cyl + 45;
    F.part(poly([[mid, ky - 6], [mid + 3, ky - 2], [mid + 3, ky + 2], [mid, ky + 6], [mid - 3, ky + 2], [mid - 3, ky - 2]]), C.trim);
    F.part(poly([[mid, ky - 3], [mid + 1, ky], [mid, ky + 3], [mid - 1, ky]]), C.boot, flat);
    F.dot(mid, ky, C.core);
    F.part(line(mid - 3, cyl + 53, mid + 3, cyl + 53, 1), C.trim, flat);
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cyl + 61, 2, 1.2), C.trim, flat); // the toe cap
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

// one arm, hanging: an orange upper sleeve, a white over-sleeve hanging from the elbow behind a black
// gauntlet with a yellow cuff. x0..x1: the arm's columns; side: -1 on the viewer's left. Returns the hand
function arm(F, x0, x1, cy, side) {
  const out = side < 0 ? x0 : x1, inn = side < 0 ? x1 : x0;
  F.part(poly([[out, cy + 13], [inn, cy + 13], [inn - side * 1, cy + 29], [out + side * 5, cy + 37], [out + side * 6, cy + 18]]), C.lining); // the over-sleeve
  F.part(line(out + side * 6, cy + 19, out + side * 5, cy + 36, 1), C.trim, flat);
  F.part(line(out + side * 3, cy + 18, out + side * 2, cy + 33, 1), C.liningDk, flat);
  F.part(line(inn - side, cy + 30, out + side * 5, cy + 38, 1), C.trim, flat);
  crystal(F, out + side * 5, cy + 38, 1);
  F.part((set) => { ellipse((x0 + x1) / 2, cy + 7, 3.2, 3.5)(set); rect(x0, cy + 7, x1, cy + 14)(set); }, C.coat); // a rounded shoulder
  F.part(line(x0, cy + 14, x1, cy + 14, 1), C.trim, flat);
  F.part(rect(x0, cy + 15, x1, cy + 26), C.glove);
  F.part(rect(x0, cy + 22, x1, cy + 23), C.trim, soft);
  const hx = (x0 + x1) / 2;
  F.part(ellipse(hx, cy + 28, 2.8, 2.6), C.glove);
  F.dot(hx + side, cy + 30, C.skin);
  return [hx, cy + 28];
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o);
  const R = (v) => v - r;

  // the coat's back half behind the legs: shadowed orange inside, white layer at the edges, pointed hem
  const back = [[cx - W - 6, cy + hem - 2], [cx - W - 3, cy + hem - 5], [cx - 4, cy + hem + 1], [R(cx + 4), cy + hem - 2], [R(cx + W + 4), cy + hem + 1], [R(cx + W + 7), cy + hem - 4]];
  F.part(poly([[cx - W, cy + 6], [R(cx + W), cy + 6], ...back.slice().reverse()]), C.coat);
  F.part(poly([[cx - W + 2, cy + 10], [R(cx + W - 2), cy + 10], [R(cx + W + 4), cy + hem - 3], [cx - 4, cy + hem - 1], [cx - W - 3, cy + hem - 6]]), C.fold, soft);
  F.part(line(cx - W - 1, cy + 20, cx - W - 4, cy + hem - 6, 2), C.lining, flat);
  F.part(line(R(cx + W + 1), cy + 20, R(cx + W + 4), cy + hem - 5, 2), C.lining, flat);
  edge(F, back.map(([x, y]) => [x, y - 1]), C.trim);
  for (const [x, y] of [[cx - W - 3, cy + hem - 2], [cx - 4, cy + hem + 4], [R(cx + W + 4), cy + hem + 4]]) { // the white layer's points behind
    F.part(poly([[x - 3, y - 4], [x + 3, y - 4], [x, y]]), C.lining);
    crystal(F, x, y + 1, 0);
  }
  legs(F, o, cx, cy, r, s);

  // the body: a black shirt; on her, a white blouse over a black corset
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.shirt);
  if (f) {
    F.part(poly([[cx - 7 + s, cy + 3], [cx + 7 + s, cy + 3], [cx + 7 + s, cy + 14], [cx + s, cy + 16], [cx - 7 + s, cy + 14]]), C.blouse);
    F.part(poly([[cx - 3 + s, cy + 3], [cx + 3 + s, cy + 3], [cx + s, cy + 8]]), C.skin); // a low neckline
    for (const y of [17, 20]) F.part(line(cx - waist + 1, cy + y, R(cx + waist - 1), cy + y, 1), C.trim, flat); // the corset's straps
  }
  // below the belt: long white panels (a short white skirt on her)
  if (f) F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + 2), cy + 31], [cx - hip - 2, cy + 31]]), C.lining);
  else {
    F.part(poly([[cx - hip, cy + 27], [cx - 3 + s, cy + 27], [cx - 4 + s, cy + 46], [cx - hip + 1, cy + 50], [cx - hip - 2, cy + 47]]), C.lining);
    F.part(poly([[R(cx + hip), cy + 27], [cx + 3 + s, cy + 27], [cx + 4 + s, cy + 46], [R(cx + hip - 1), cy + 50], [R(cx + hip + 2), cy + 47]]), C.lining);
  }

  // the coat's front panels, open down the middle, yellow-edged, a white layer under the pointed hem
  for (const side of [-1, 1]) {
    const ox = side < 0 ? cx - W - 1 : R(cx + W + 1), ix = cx + side * (f ? 7 : 5) + s;
    const bx = side < 0 ? cx - W - 5 : R(cx + W + 5), mx = cx + side * (f ? 9 : 7) + s;
    const lp = [[mx, cy + 30], [mx, cy + hem], [(bx + mx) / 2, cy + hem + 3], [bx - side * 3, cy + hem + 3], [bx, cy + hem]];
    F.part(poly(lp), C.lining);
    edge(F, lp.slice(1, 4), C.liningDk);
    crystal(F, (bx + mx) / 2, cy + hem + 4, 0);
    crystal(F, bx - side * 3, cy + hem + 4, 0);
    const pts = f
      ? [[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx, cy + hem - 2], [bx - side * 3, cy + hem + 1], [mx + side * 2, cy + 32], [ix + side * 2, cy + 22]] // hers opens wide over the skirt
      : [[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx, cy + hem - 2], [bx - side * 3, cy + hem + 1], [mx, cy + hem - 4], [mx, cy + 30], [ix + side, cy + 22]];
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(3).concat([[ix, cy + 3]]), C.trim);
    F.part(line(ox - side * 2, cy + 20, bx - side * 2, cy + hem - 6, 1), C.fold, flat);
    // the lapel folded back, white inside
    F.part(poly([[ix, cy + 3], [ix + side * 4, cy + 4], [ix + side * 2, cy + 12]]), C.lining, soft);
    F.part(line(ix + side * 3, cy + 13, mx + side * 2, cy + hem - 6, 1), C.trim, flat); // filigree down the panel
    for (const y of [36, 44]) F.dot(mx + side * 4, cy + y, C.trim);
    compass(F, (bx + mx) / 2 + side, cy + hem - 9, true);
  }

  // a wide black sash edged in yellow, crossed belts with yellow buckles, a pouch on her hip
  F.part(rect(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 26), C.belt);
  F.part(line(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 21, 1), C.trim, flat);
  F.part(line(cx - hip - 1, cy + 26, R(cx + hip + 1), cy + 26, 1), C.trim, flat);
  F.part(line(cx - hip, cy + 30, R(cx + hip), cy + 27, 2), C.belt, flat);
  F.part(ellipse(cx + s, cy + 23.5, 2.8, 2.8), C.trim);
  F.dot(cx + s, cy + 23.5, C.core); F.dot(cx + s, cy + 22.5, C.gem);
  for (const dx of [-5, 5]) crystal(F, cx + dx + s, cy + 27, 3);
  F.part(rect(R(cx + hip - 4), cy + 26, R(cx + hip - 2), cy + 28), C.trim, soft);
  if (f) { F.part(rect(cx - hip + 1, cy + 26, cx - hip + 5, cy + 31), C.belt); F.dot(cx - hip + 3, cy + 28, C.trim); }

  // the tall collar, the shirt's own collar, and the compass medallion at the chest with filigree
  for (const side of [-1, 1]) collar(F, (u) => (side < 0 ? cx - u : R(cx + u)) + s, cy);
  F.part(poly([[cx - 4 + s, cy - 3], [cx + 4 + s, cy - 3], [cx + 5 + s, cy + 3], [cx - 5 + s, cy + 3]]), C.shirt);
  F.part(line(cx - 4 + s, cy - 3, cx + 4 + s, cy - 3, 1), C.trim, flat);
  if (!f) {
    F.part(line(cx + s, cy + 3, cx + s, cy + 20, 1), C.trim, flat); // the shirt's yellow placket
    edge(F, [[cx - 6 + s, cy + 6], [cx - 3 + s, cy + 11], [cx + s, cy + 11]], C.trim);
    edge(F, [[cx + 6 + s, cy + 6], [cx + 3 + s, cy + 11], [cx + s, cy + 11]], C.trim);
  }
  ring(F, cx + s, f ? cy + 7 : cy + 11, 4, 4, C.trim);
  compass(F, cx + s, f ? cy + 7 : cy + 11);

  // the arms and pauldrons; the near hand holds the sword low, its blade angled out to the ground,
  // the sigil floats by the other
  const atk = P.atk >= 0;
  const [hx, hy] = atk ? [0, 0] : arm(F, cx - W - 4, cx - W, cy, -1); // while attacking the sword arm swings instead
  const [fx, fy] = arm(F, R(cx + W), R(cx + W + 4), cy, 1);
  pauldron(F, cx - W - 2, cy, -1, f);
  pauldron(F, R(cx + W + 2), cy, 1, f);
  if (atk) swing(F, cx - W - 2, cy + 6, 'front');
  else {
    sword(F, hx, hy, hx - 10, cy + 58);
    F.part(ellipse(hx, hy, 2.8, 2.6), C.glove); // the hand over the grip
    F.dot(hx - 1, hy + 2, C.skin);
  }
  sigil(F, fx + 8, fy - 2);
  if (atk) burst(F, fx + 8, fy - 2, CAST.burst[P.atk], { core: '#ffffff', glow: C.glow, spark: C.spark }); // the sigil flares with the cut
  return F;
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o);
  const R = (v) => v - r;
  if (P.atk >= 0 && behind(P.atk)) swing(F, R(cx + W + 2), cy + 6, 'front', true); // the blade in front of him, hidden
  legs(F, o, cx, cy, r, 0);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.coat);
  // the coat's back over a white layer, split up the middle in pointed tails, the great compass star
  const tails = [[R(cx + W + 6), cy + hem - 3], [R(cx + W + 3), cy + hem], [R(cx + 6), cy + hem - 3], [cx + 1 + s, cy + hem + 1], [cx - 5 + s, cy + hem - 3], [cx - W - 3, cy + hem], [cx - W - 6, cy + hem - 3]];
  for (const [x, y] of tails.filter((_, i) => i % 2 === 1)) { F.part(poly([[x - 3, y - 3], [x + 3, y - 3], [x, y + 3]]), C.lining); crystal(F, x, y + 4, 0); }
  F.part(poly([[cx - W, cy + 4], [R(cx + W), cy + 4], [R(cx + W + 2), cy + 16], ...tails, [cx - W - 2, cy + 16]]), C.coat);
  edge(F, tails.map(([x, y]) => [x, y - 1]), C.trim);
  for (const [a, b] of [[-W + 2, -W - 2], [W - 2 - r, W + 2 - r]]) F.part(line(cx + a + s, cy + 30, cx + b + s, cy + hem - 4, 1), C.fold, flat);
  F.part(line(cx + s, cy + 34, cx + s, cy + hem - 2, 1), C.lining, flat); // the white layer in the split
  for (const side of [-1, 1]) F.part(line(cx + side * 5 + s - (side > 0 ? r : 0), cy + 32, cx + side * 7 + s - (side > 0 ? r : 0), cy + hem - 4, 1), C.trim, flat);
  F.part(rect(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 26), C.belt); // the sash
  F.part(line(cx - hip - 1, cy + 21, R(cx + hip + 1), cy + 21, 1), C.trim, flat);
  F.part(line(cx - hip - 1, cy + 26, R(cx + hip + 1), cy + 26, 1), C.trim, flat);
  for (const dx of [-6, 0, 6]) crystal(F, cx + dx + s, cy + 27, 3);
  ring(F, cx + s, cy + 40, 6, 6, C.trim); // the great compass star in a ring, low on the coat
  compass(F, cx + s, cy + 40, true);
  for (const [dx, dy] of [[0, -9], [0, 9], [-9, 0], [9, 0]]) F.dot(cx + dx + s, cy + 40 + dy, C.trim);
  compass(F, cx + s, cy + 13); // and a small one between the shoulders
  edge(F, [[cx - W + 1 + s, cy + 16], [cx + s, cy + 19], [R(cx + W - 1) + s, cy + 16]], C.trim);
  // the arms; the sword in the far hand, on the viewer's right from behind
  arm(F, cx - W - 4, cx - W, cy, -1);
  if (P.atk < 0) { // the sword arm swings instead while attacking
    const [hx, hy] = arm(F, R(cx + W), R(cx + W + 4), cy, 1);
    sword(F, hx, hy, hx + 10, cy + 58);
    F.part(ellipse(hx, hy, 2.8, 2.6), C.glove);
  }
  pauldron(F, cx - W - 2, cy, -1, f);
  pauldron(F, R(cx + W + 2), cy, 1, f);
  // the tall collar and its back
  for (const side of [-1, 1]) collar(F, (u) => (side < 0 ? cx - u : R(cx + u)) + s, cy);
  F.part(poly([[cx - 6 + s, cy - 3], [cx + 6 + s, cy - 3], [cx + 8 + s, cy + 4], [cx - 8 + s, cy + 4]]), C.coat);
  F.part(line(cx - 6 + s, cy - 3, cx + 6 + s, cy - 3, 1), C.trim, flat);
  if (P.atk >= 0 && !behind(P.atk)) swing(F, R(cx + W + 2), cy + 6, 'front', true);
  return F;
}

// facing right: the coat flows behind, the near hand holds the sword low and forward
function side(F, o, cx, cy) {
  const { f, knee, hem } = build(o);
  const tails = [[cx - 18, cy + hem - 1], [cx - 13, cy + hem - 4], [cx - 9, cy + hem + 1], [cx - 4, cy + hem - 3]];
  for (const [x, y] of [tails[0], tails[2]]) { F.part(poly([[x - 2, y - 3], [x + 3, y - 3], [x, y + 3]]), C.lining); crystal(F, x, y + 4, 0); }
  // the tall collar, standing behind the head
  const cp = [[cx - 3, cy + 3], [cx - 6, cy - 5], [cx - 16, cy - 10], [cx - 14, cy - 2], [cx - 8, cy + 4]];
  F.part(poly(cp), C.coat);
  F.part(poly([[cx - 7, cy + 1], [cx - 8, cy - 3], [cx - 13, cy - 7], [cx - 12, cy - 2], [cx - 9, cy + 2]]), C.lining, soft);
  edge(F, cp.slice(1, 4), C.trim);
  F.dot(cx - 16, cy - 11, C.core);
  F.part(poly([[cx - 5, cy + 2], [cx - 9, cy + 8], [cx - 15, cy + 30], ...tails, [cx - 2, cy + 30]]), C.coat);
  F.part(line(cx - 7, cy + 12, cx - 12, cy + hem - 6, 1), C.fold, flat);
  F.part(line(cx - 9, cy + 14, cx - 15, cy + hem - 6, 1), C.trim, flat);
  edge(F, tails.map(([x, y]) => [x, y - 1]), C.trim);
  const cy0 = cy - P.bob; // the legs stay on the ground
  const leg = (x) => {
    F.part(rect(x - 3, cy0 + 30, x + 2, cy0 + 58), f ? C.skin : C.pants);
    F.part(rect(x - 3, cy0 + knee, x + 2, cy0 + 58), C.boot);
    F.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
    F.part(line(x - 3, cy0 + knee, x + 2, cy0 + knee, 1), C.trim, flat);
    F.part(poly([[x + 1, cy0 + 39], [x + 5, cy0 + 44], [x + 2, cy0 + 50], [x, cy0 + 44]]), C.trim);
    F.dot(x + 2, cy0 + 44, C.core);
    F.part(line(x - 3, cy0 + 53, x + 2, cy0 + 53, 1), C.trim, flat);
    F.part(ellipse(x + 4, cy0 + 61, 1.5, 1), C.trim, flat);
  };
  leg(cx - 2 - Math.round(3 * P.step)); // the far leg, then the near one, striding
  leg(cx + 2 + Math.round(3 * P.step));
  // the white layer, the coat's front edge
  F.part(poly([[cx - 4, cy + 27], [cx + 6, cy + 27], [cx + 6, cy + (f ? 31 : 48)], [cx - 6, cy + (f ? 31 : 50)]]), C.lining);
  if (!f) {
    const pts = [[cx + 3, cy + 26], [cx + 7, cy + 26], [cx + 6, cy + hem - 2], [cx + 2, cy + hem + 1]];
    F.part(poly(pts), C.coat);
    F.part(line(cx + 6, cy + 27, cx + 6, cy + hem - 3, 1), C.trim, flat);
  }
  // the body
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), C.coat);
  F.part(poly([[cx + 2, cy + 3], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 2, cy + 22]]), f ? C.blouse : C.shirt, soft);
  F.part(line(cx + 2, cy + 3, cx + 2, cy + 22, 1), C.trim, flat);
  F.part(rect(cx - 7, cy + 21, cx + 7, cy + 26), C.belt);
  F.part(line(cx - 7, cy + 21, cx + 7, cy + 21, 1), C.trim, flat);
  F.part(line(cx - 7, cy + 26, cx + 7, cy + 26, 1), C.trim, flat);
  F.part(line(cx - 7, cy + 29, cx + 7, cy + 27, 2), C.belt, flat);
  F.part(ellipse(cx + 6, cy + 23.5, 1.6, 2.5), C.trim); F.dot(cx + 6, cy + 23.5, C.core);
  crystal(F, cx + 3, cy + 27, 3);
  F.part(line(cx - 6, cy + 10, cx + 2, cy + 10, 1), C.trim, flat); // filigree on the coat
  // the collar
  F.part(poly([[cx - 4, cy - 3], [cx + 2, cy - 2], [cx + 3, cy + 4], [cx - 6, cy + 4]]), C.shirt);
  F.part(line(cx - 4, cy - 3, cx + 2, cy - 2, 1), C.trim, flat);
  // the near arm, its white over-sleeve hanging behind, the hand forward on the sword
  F.part(poly([[cx - 4, cy + 12], [cx + 3, cy + 14], [cx + 1, cy + 30], [cx - 7, cy + 26]]), C.lining);
  F.part(line(cx + 1, cy + 30, cx - 7, cy + 26, 1), C.trim, flat);
  F.part(poly([[cx - 4, cy + 4], [cx + 1, cy + 4], [cx + 3, cy + 14], [cx - 3, cy + 14]]), C.coat);
  F.part(line(cx - 3, cy + 14, cx + 3, cy + 14, 1), C.trim, flat);
  crystal(F, cx - 7, cy + 27, 1);
  pauldron(F, cx - 1, cy, -1, f);
  if (P.atk >= 0) { swing(F, cx - 1, cy + 6, 'side'); return F; }
  F.part(poly([[cx - 2, cy + 15], [cx + 3, cy + 15], [cx + 9, cy + 22], [cx + 6, cy + 25]]), C.glove);
  F.part(line(cx + 1, cy + 18, cx + 5, cy + 21, 1), C.trim, flat);
  const hx = cx + 9, hy = cy + 24;
  sword(F, hx, hy, hx + 13, cy + 54);
  F.part(ellipse(hx, hy, 2.6, 2.6), C.glove);
  F.dot(hx + 1, hy + 2, C.skin);
  return F;
}

// one design's painter for a pose (design-anim.js): (view, cx, cy, pose) -> Frame
export const drawMKnight = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(MKNIGHTS[id], view, cx, cy); } finally { P = REST; } };
// one design's moves: { dir: { idle, walk, attack, bob } }; heads: the trainee's head data, { dir: [x, crown, neck, ...] }
export const animMKnight = (id, heads) => animFrames(VIEWS, heads, BW, drawMKnight(id));
