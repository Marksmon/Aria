// Sprite designs for the Magic Knight, male and female, painted in code like the Blader and mage
// designs (bladers.js, mages.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md). After the owner's Magic Knight sheet, recoloured to the owner's
// orange, white and yellow: an open orange coat edged in yellow over long white layers, white
// over-sleeves hanging from the elbows over black gauntlets, a black shirt with a high collar and a
// yellow compass star at the chest, crossed black belts with yellow buckles, black trousers and
// boots with yellow knee guards (a white blouse, black corset, short white skirt and thigh-high
// boots on her), a drawn sword held low whose blade glows orange along the edge, and a great
// compass star on the coat's back.
// Standing only for now (the design), 8 directions: the left ones are the right ones mirrored.
// Not used in the game yet. Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)
const LEGS = 63;                 // chin to ground, in pixels, in every direction

const C = {
  coat: '#e27a24', fold: '#b45816', lining: '#f3efe7', liningDk: '#cfc7b8', trim: '#f4c838', shirt: '#2a2329',
  blouse: '#f3efe7', belt: '#2c2227', pants: '#25202a', boot: '#2a2329', skin: '#f2c8a2', gem: '#fff2a6',
  core: '#ff9a2e', glove: '#2a2329', blade: '#dde1ea', glow: '#ffb04a',
};
export const MKNIGHTS = { mknightM: { name: 'Magic Knight', sex: 'm' }, mknightF: { name: 'Magic Knight', sex: 'f' } };

const flat = { outline: false, flat: true }; // a trim's line: no outline or shading
const soft = { outline: false };             // shaded, but no outline (a panel inside a part)
const edge = (F, pts, col) => { for (let i = 0; i < pts.length - 1; i++) F.part(line(...pts[i], ...pts[i + 1], 1), col, flat); };

function build(o) {
  const f = o.sex === 'f';
  return { f, W: f ? 11 : 12, waist: f ? 7 : 9, hip: f ? 10 : 9, legs: [[-7, -2], [2, 7]], knee: f ? 34 : 42, hem: f ? 50 : 54 };
}

// the compass star: four long points, four short ones, a glowing middle
function compass(F, x, y, big = false) {
  const k = big ? 2 : 1;
  F.part(poly([[x, y - 4 * k], [x + k, y - k], [x + 4 * k, y], [x + k, y + k], [x, y + 4 * k], [x - k, y + k], [x - 4 * k, y], [x - k, y - k]]), C.trim, big ? {} : flat);
  if (big) for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) F.dot(x + dx, y + dy, C.trim);
  F.dot(x, y, C.core);
  if (big) { F.dot(x - 1, y, C.gem); F.dot(x + 1, y, C.gem); F.dot(x, y - 1, C.gem); F.dot(x, y + 1, C.gem); }
}

// the drawn sword, held low: the hilt in the hand at (x, y), the blade running to (tx, ty)
function sword(F, x, y, tx, ty) {
  F.part(line(x, y, tx, ty, 2), C.blade);
  F.part(line(x + (tx - x) * 0.15, y + (ty - y) * 0.15 + 1, tx, ty, 1), C.glow, flat); // the glowing edge
  const nx = (ty - y), ny = -(tx - x), n = Math.hypot(nx, ny) || 1; // across the blade, for the guard
  F.part(line(x - (nx / n) * 4, y - (ny / n) * 4, x + (nx / n) * 4, y + (ny / n) * 4, 2), C.trim);
  F.dot(x, y, C.core);
  F.part(line(x, y, x - (tx - x) * 0.12, y - (ty - y) * 0.12, 2), C.shirt); // the grip above the hand
}

function legs(F, o, cx, cy, r, toe) {
  const { f, legs: L, knee } = build(o);
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0, mid = cx + (a + b) / 2 + sh;
    F.part(rect(cx + a + sh, cy + 30, cx + b + sh, cy + 58), C.pants);
    F.part(rect(cx + a - (f ? 0 : 1) + sh, cy + knee, cx + b + (f ? 0 : 1) + sh, cy + 58), C.boot);
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cy + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    F.part(line(cx + a - (f ? 0 : 1) + sh, cy + knee, cx + b + (f ? 0 : 1) + sh, cy + knee, 1), C.trim, flat);
    const ky = cy + 45;
    F.part(poly([[mid, ky - 4], [mid + 2.5, ky], [mid, ky + 4], [mid - 2.5, ky]]), C.trim);
    F.dot(mid, ky, C.core);
    F.part(line(mid - 3, cy + 56, mid + 3, cy + 56, 1), C.trim, flat);
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
  F.part(poly([[out, cy + 13], [inn, cy + 13], [inn - side * 1, cy + 27], [out + side * 4, cy + 33], [out + side * 5, cy + 18]]), C.lining); // the over-sleeve
  F.part(line(out + side * 5, cy + 19, out + side * 4, cy + 32, 1), C.liningDk, flat);
  F.part(line(inn - side, cy + 28, out + side * 4, cy + 34, 1), C.trim, flat);
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
  legs(F, o, cx, cy, r, s);

  // the body: a black shirt; on her, a white blouse over a black corset
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.shirt);
  if (f) {
    F.part(poly([[cx - 7 + s, cy + 3], [cx + 7 + s, cy + 3], [cx + 7 + s, cy + 14], [cx + s, cy + 16], [cx - 7 + s, cy + 14]]), C.blouse);
    for (const y of [17, 20]) F.part(line(cx - waist + 1, cy + y, R(cx + waist - 1), cy + y, 1), C.trim, flat); // the corset's straps
  }
  // below the belt: long white panels (a short white skirt on her)
  if (f) F.part(poly([[cx - hip, cy + 27], [R(cx + hip), cy + 27], [R(cx + hip + 2), cy + 35], [cx - hip - 2, cy + 35]]), C.lining);
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
    const pts = f
      ? [[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx, cy + hem - 2], [bx - side * 3, cy + hem + 1], [mx + side * 2, cy + 32], [ix + side * 2, cy + 22]] // hers opens wide over the skirt
      : [[ix, cy + 3], [ox, cy + 3], [ox - side, cy + 16], [bx, cy + hem - 2], [bx - side * 3, cy + hem + 1], [mx, cy + hem - 4], [mx, cy + 30], [ix + side, cy + 22]];
    F.part(poly(pts), C.coat);
    edge(F, pts.slice(3).concat([[ix, cy + 3]]), C.trim);
    F.part(line(ox - side * 2, cy + 20, bx - side * 2, cy + hem - 6, 1), C.fold, flat);
    // the lapel folded back, white inside
    F.part(poly([[ix, cy + 3], [ix + side * 4, cy + 4], [ix + side * 2, cy + 12]]), C.lining, soft);
    compass(F, (bx + mx) / 2 + side, cy + hem - 9);
  }

  // crossed black belts with yellow buckles; a pouch on her hip
  F.part(rect(cx - hip, cy + 23, R(cx + hip), cy + 25), C.belt);
  F.part(line(cx - hip, cy + 29, R(cx + hip), cy + 26, 2), C.belt, flat);
  F.part(rect(cx - 2 + s, cy + 23, cx + 2 + s, cy + 25), C.trim, soft);
  F.dot(cx + s, cy + 24, C.core);
  F.part(rect(R(cx + hip - 4), cy + 26, R(cx + hip - 2), cy + 28), C.trim, soft);
  if (f) { F.part(rect(cx - hip + 1, cy + 26, cx - hip + 5, cy + 31), C.belt); F.dot(cx - hip + 3, cy + 28, C.trim); }

  // the collar and the compass star at the chest
  F.part(poly([[cx - 4 + s, cy - 3], [cx + 4 + s, cy - 3], [cx + 5 + s, cy + 3], [cx - 5 + s, cy + 3]]), C.shirt);
  F.part(line(cx - 4 + s, cy - 3, cx + 4 + s, cy - 3, 1), C.trim, flat);
  if (!f) F.part(line(cx + s, cy + 3, cx + s, cy + 21, 1), C.trim, flat); // the shirt's yellow placket
  compass(F, cx + s, f ? cy + 7 : cy + 11);

  // the arms; the near hand holds the sword low, its blade angled out to the ground
  const [hx, hy] = arm(F, cx - W - 4, cx - W, cy, -1);
  arm(F, R(cx + W), R(cx + W + 4), cy, 1);
  sword(F, hx, hy, hx - 10, cy + 58);
  F.part(ellipse(hx, hy, 2.8, 2.6), C.glove); // the hand over the grip
  F.dot(hx - 1, hy + 2, C.skin);
  return F;
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o);
  const R = (v) => v - r;
  legs(F, o, cx, cy, r, 0);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.coat);
  // the coat's back over a white layer, split up the middle in pointed tails, the great compass star
  const tails = [[R(cx + W + 6), cy + hem - 3], [R(cx + W + 3), cy + hem], [R(cx + 6), cy + hem - 3], [cx + 1 + s, cy + hem + 1], [cx - 5 + s, cy + hem - 3], [cx - W - 3, cy + hem], [cx - W - 6, cy + hem - 3]];
  for (const [x, y] of tails.filter((_, i) => i % 2 === 1)) F.part(poly([[x - 3, y - 3], [x + 3, y - 3], [x, y + 3]]), C.lining);
  F.part(poly([[cx - W, cy + 4], [R(cx + W), cy + 4], [R(cx + W + 2), cy + 16], ...tails, [cx - W - 2, cy + 16]]), C.coat);
  edge(F, tails.map(([x, y]) => [x, y - 1]), C.trim);
  for (const [a, b] of [[-W + 2, -W - 2], [W - 2 - r, W + 2 - r]]) F.part(line(cx + a + s, cy + 30, cx + b + s, cy + hem - 4, 1), C.fold, flat);
  F.part(line(cx + s, cy + 34, cx + s, cy + hem - 2, 1), C.lining, flat); // the white layer in the split
  for (const side of [-1, 1]) F.part(line(cx + side * 5 + s - (side > 0 ? r : 0), cy + 32, cx + side * 7 + s - (side > 0 ? r : 0), cy + hem - 4, 1), C.trim, flat);
  F.part(rect(cx - hip, cy + 23, R(cx + hip), cy + 25), C.belt);
  compass(F, cx + s, cy + 14, true);
  F.part(line(cx + s, cy + 21, cx + s, cy + 30, 1), C.trim, flat);
  // the arms; the sword in the far hand, on the viewer's right from behind
  arm(F, cx - W - 4, cx - W, cy, -1);
  const [hx, hy] = arm(F, R(cx + W), R(cx + W + 4), cy, 1);
  sword(F, hx, hy, hx + 10, cy + 58);
  F.part(ellipse(hx, hy, 2.8, 2.6), C.glove);
  // the collar's back
  F.part(poly([[cx - 6 + s, cy - 3], [cx + 6 + s, cy - 3], [cx + 8 + s, cy + 4], [cx - 8 + s, cy + 4]]), C.coat);
  F.part(line(cx - 6 + s, cy - 3, cx + 6 + s, cy - 3, 1), C.trim, flat);
  return F;
}

// facing right: the coat flows behind, the near hand holds the sword low and forward
function side(F, o, cx, cy) {
  const { f, knee, hem } = build(o);
  const tails = [[cx - 18, cy + hem - 1], [cx - 13, cy + hem - 4], [cx - 9, cy + hem + 1], [cx - 4, cy + hem - 3]];
  for (const [x, y] of [tails[0], tails[2]]) F.part(poly([[x - 2, y - 3], [x + 3, y - 3], [x, y + 3]]), C.lining);
  F.part(poly([[cx - 5, cy + 2], [cx - 9, cy + 8], [cx - 15, cy + 30], ...tails, [cx - 2, cy + 30]]), C.coat);
  F.part(line(cx - 7, cy + 12, cx - 12, cy + hem - 6, 1), C.fold, flat);
  F.part(line(cx - 9, cy + 14, cx - 15, cy + hem - 6, 1), C.trim, flat);
  edge(F, tails.map(([x, y]) => [x, y - 1]), C.trim);
  const leg = (x) => {
    F.part(rect(x - 3, cy + 30, x + 2, cy + 58), C.pants);
    F.part(rect(x - 3, cy + knee, x + 2, cy + 58), C.boot);
    F.part(ellipse(x + 1, cy + 60.5, 4.5, 2.5), C.boot);
    F.part(line(x - 3, cy + knee, x + 2, cy + knee, 1), C.trim, flat);
    F.part(poly([[x + 1, cy + 41], [x + 4, cy + 45], [x + 2, cy + 49]]), C.trim);
  };
  leg(cx - 2);
  leg(cx + 2);
  // the white layer, the coat's front edge
  F.part(poly([[cx - 4, cy + 27], [cx + 6, cy + 27], [cx + 6, cy + (f ? 35 : 48)], [cx - 6, cy + (f ? 36 : 50)]]), C.lining);
  if (!f) {
    const pts = [[cx + 3, cy + 26], [cx + 7, cy + 26], [cx + 6, cy + hem - 2], [cx + 2, cy + hem + 1]];
    F.part(poly(pts), C.coat);
    F.part(line(cx + 6, cy + 27, cx + 6, cy + hem - 3, 1), C.trim, flat);
  }
  // the body
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), C.coat);
  F.part(poly([[cx + 2, cy + 3], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 2, cy + 22]]), f ? C.blouse : C.shirt, soft);
  F.part(line(cx + 2, cy + 3, cx + 2, cy + 22, 1), C.trim, flat);
  F.part(rect(cx - 7, cy + 23, cx + 7, cy + 25), C.belt);
  F.part(line(cx - 7, cy + 28, cx + 7, cy + 26, 2), C.belt, flat);
  F.part(rect(cx + 4, cy + 23, cx + 6, cy + 25), C.trim, soft);
  // the collar
  F.part(poly([[cx - 4, cy - 3], [cx + 2, cy - 2], [cx + 3, cy + 4], [cx - 6, cy + 4]]), C.shirt);
  F.part(line(cx - 4, cy - 3, cx + 2, cy - 2, 1), C.trim, flat);
  // the near arm, its white over-sleeve hanging behind, the hand forward on the sword
  F.part(poly([[cx - 4, cy + 12], [cx + 3, cy + 14], [cx + 1, cy + 30], [cx - 7, cy + 26]]), C.lining);
  F.part(line(cx + 1, cy + 30, cx - 7, cy + 26, 1), C.trim, flat);
  F.part(poly([[cx - 4, cy + 4], [cx + 1, cy + 4], [cx + 3, cy + 14], [cx - 3, cy + 14]]), C.coat);
  F.part(line(cx - 3, cy + 14, cx + 3, cy + 14, 1), C.trim, flat);
  F.part(poly([[cx - 2, cy + 15], [cx + 3, cy + 15], [cx + 9, cy + 22], [cx + 6, cy + 25]]), C.glove);
  F.part(line(cx + 1, cy + 18, cx + 5, cy + 21, 1), C.trim, flat);
  const hx = cx + 9, hy = cy + 24;
  sword(F, hx, hy, hx + 13, cy + 54);
  F.part(ellipse(hx, hy, 2.6, 2.6), C.glove);
  F.dot(hx + 1, hy + 2, C.skin);
  return F;
}

// dir -> [view, mirrored]; heads: the trainee's head data, { dir: [x, crown, neck, ...] }
const VIEWS = {
  down: ['front', false], downright: ['front3', false], right: ['side', false], upright: ['back3', false], up: ['back', false],
  downleft: ['front3', true], left: ['side', true], upleft: ['back3', true],
};
// one design's frames: { dir: { canvas, foot } } (foot: rows from the frame's bottom to the ground)
export function paintMKnight(id, heads) {
  const o = MKNIGHTS[id], out = {};
  for (const [dir, [view, flip]] of Object.entries(VIEWS)) {
    const [x, , neck] = heads[dir];
    const cx = flip ? BW - 1 - x : x; // a mirrored view is painted unmirrored, then flipped
    const F = paint(o, view, Math.round(cx), neck);
    out[dir] = { canvas: (flip ? F.mirror() : F).toCanvas(), foot: BH - (neck + LEGS) };
  }
  return out;
}
