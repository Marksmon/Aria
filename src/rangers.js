// Sprite designs for the Archer's second jobs, the Windrunner and the Moon Ranger, male and female,
// painted in code on the bald bodies' frame like the BladeMaster and the Wizard (bladers.js,
// mages.js) and as grand: a tall flared collar standing behind the head, great layered pauldrons, a
// medallion, a long cape to the ankles with a pattern, an emblem on its back and pointed tips at its
// hem, filigree down the coat, ornate vambraces and greaves, and an ornate bow that flares with
// light as the arrow leaves it. He wears a long coat split into tails; she wears a fitted bodice,
// a short skirt, long tails behind and thigh-high boots.
// - Windrunner, after the owner's sheet: green and gold. Feathered collar, silver pauldrons with
//   gold feather points, a teal cape with gold wind swirls and feather tips, an emerald medallion,
//   a gold and white bow with a green gem; her midriff bare between bodice and skirt; ribbons of
//   wind curling round.
// - Moon Ranger, after the owner's sheet: silver over navy. Silver pauldrons with crescent horns and
//   blue gems, a navy cape scattered with stars, a constellation and crescent tips, a crescent
//   medallion, a pale coat (his long, hers a short skirt over navy), a silver bow with crescent
//   tips; stars drifting round.
// Standing, walking (8 frames) and shooting (7, design-anim.js SHOOT), 8 directions.
// The game paints the hero's body from these (sprites.js designSet). Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SHOOT, LOOSE, recurve, burst, animFrames, VIEWS } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const WIND = {
  coat: '#2a7a4a', coatDk: '#1d5a35', body: '#2a7a4a', shirt: '#f0ecd8', trim: '#e6be50', trimDk: '#a8822e',
  silver: '#d4dae4', cape: '#22a09a', capeDk: '#167470', lining: '#f0ecd8', gem: '#4ae0a0', gemLt: '#c8ffe8',
  pants: '#26303a', boot: '#1e4a30', skin: '#f2c8a2', glove: '#5a3a24', quiver: '#22706a', feathers: ['#ffffff', '#5ad8c8', '#ffffff'],
  mote: '#c8fff0', mote2: '#7ae8d0',
  bow: { wood: '#e6be50', light: '#fff6d8', grip: '#1d5a35', string: '#ffffff', arrow: '#f6eed8', tip: '#d8e0ea', fletch: '#5ad8c8' },
  flash: { core: '#ffffff', glow: '#7af0c8', spark: '#e6ffd0' },
};
const MOON = {
  coat: '#d8dcea', coatDk: '#a6aec6', body: '#24346a', shirt: '#24346a', trim: '#f0f4ff', trimDk: '#a8b6d8',
  silver: '#dfe4ee', cape: '#1a2658', capeDk: '#0f1840', lining: '#33489a', gem: '#6aa8ff', gemLt: '#d0e4ff',
  pants: '#1a1a26', boot: '#1c2450', skin: '#f2c8a2', glove: '#2a3058', quiver: '#2a3468', feathers: ['#ffffff', '#cfe0ff', '#ffffff'],
  mote: '#fff6c8', mote2: '#c8d8ff',
  bow: { wood: '#e4e8f2', light: '#ffffff', grip: '#24346a', string: '#ffffff', arrow: '#ffffff', tip: '#cfe0ff', fletch: '#cfe0ff' },
  flash: { core: '#ffffff', glow: '#9ac0ff', spark: '#fff6c8' },
};
export const RANGERS = {
  windM: { name: 'Windrunner', sex: 'm', wind: true, C: WIND },
  windF: { name: 'Windrunner', sex: 'f', wind: true, C: WIND },
  moonM: { name: 'Moon Ranger', sex: 'm', moon: true, C: MOON },
  moonF: { name: 'Moon Ranger', sex: 'f', moon: true, C: MOON },
};

const flat = { outline: false, flat: true };
const soft = { outline: false };
let P = REST;
const lerp = (a, b, k) => a + (b - a) * k;
const raised = () => (P.atk >= 0 ? SHOOT.raise[P.atk] : 0);
const drawn = () => (P.atk >= 0 ? SHOOT.draw[P.atk] : 0);
const edge = (F, pts, col) => { for (let i = 0; i < pts.length - 1; i++) F.part(line(...pts[i], ...pts[i + 1], 1), col, flat); };
function ring(F, x, y, rx, ry, col) { for (let a = 0; a < 64; a++) F.dot(x + Math.cos((a / 64) * 2 * Math.PI) * rx, y + Math.sin((a / 64) * 2 * Math.PI) * ry, col); }
function crescent(F, x, y, col, dir = 1, r = 2.5) { for (let a = -Math.PI * 0.75; a <= Math.PI * 0.75; a += 0.2) F.dot(x - dir * Math.cos(a) * r, y + Math.sin(a) * r, col); }
const star = (F, x, y, col, big = false) => { F.dot(x, y, col); if (big) { F.dot(x - 1, y, col); F.dot(x + 1, y, col); F.dot(x, y - 1, col); F.dot(x, y + 1, col); } };

// the build: shoulders, waist and hips (half widths), the legs, where her skirt ends and her boots start
function build(o) {
  const f = o.sex === 'f';
  return f ? { f, W: 10, waist: 6, hip: 10, legs: [[-6, -2], [2, 6]], skirt: 31, boot: 40 }
    : { f, W: 13, waist: 10, hip: 10, legs: [[-8, -2], [2, 8]], skirt: 50, boot: 41 };
}

function paint(o, view, cx, cy) {
  const F = new Frame(BW, BH);
  if (view === 'side') return side(F, o, cx, cy);
  const back = view === 'back' || view === 'back3';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0;
  const r = view === 'front3' || view === 'back3' ? 3 : 0;
  return back ? backView(F, o, cx, cy, s, r) : frontView(F, o, cx, cy, s, r);
}

// one side of the tall collar behind the head. X(u): a point u pixels out on this side
function collar(F, X, cy, o) {
  const C = o.C;
  if (o.wind) { // three gold-edged green feathers fanning up and out
    for (const [u0, u1, top] of [[4, 9, -9], [6, 13, -6], [8, 16, -1]]) {
      const pts = [[X(u0), cy + 3], [X(u0 + 1), cy - 2], [X(u1), cy + top], [X(u1 - 1), cy + top + 5], [X(u0 + 3), cy + 4]];
      F.part(poly(pts), C.coat);
      F.part(line(X(u0 + 2), cy + 2, X(u1 - 1), cy + top + 1, 1), C.trim, flat); // the quill
    }
  } else { // a tall navy collar edged in silver, a star at its tip
    const pts = [[X(4), cy + 3], [X(6), cy - 5], [X(13), cy - 11], [X(13), cy - 3], [X(9), cy + 4]];
    F.part(poly(pts), C.body);
    F.part(poly([[X(7), cy + 1], [X(7), cy - 3], [X(11), cy - 7], [X(11), cy - 3], [X(9), cy + 2]]), C.lining, soft);
    edge(F, pts.slice(1, 4), C.trim);
    star(F, X(13), cy - 12, C.mote, true);
  }
}

// a great pauldron: three plates with a trim edge, a point flaring up and out (a gold feather, or a
// silver crescent horn), a gem. side: -1 the viewer's left, 1 the right
function pauldron(F, x, cy, side, o, f) {
  const C = o.C, w = f ? 5 : 6.5;
  if (o.wind) F.part(poly([[x - side * 1, cy + 3], [x + side * (w + 3), cy - 6], [x + side * (w + 2), cy - 3], [x + side * (w - 1), cy + 4]]), C.trim); // the feather
  else { crescent(F, x + side * (w - 1), cy - 1, C.silver, -side, 3); crescent(F, x + side * (w - 1), cy - 1, C.trim, -side, 2); }
  for (const [dy, rw, rh] of [[11, w - 1, 2.5], [8, w, 3], [5, w + 0.5, 4]]) {
    F.part(ellipse(x, cy + dy, rw, rh), C.silver);
    F.part(line(x - rw * 0.6, cy + dy + rh - 0.5, x + rw * 0.6, cy + dy + rh - 0.5, 1), C.trim, flat);
  }
  F.part(ellipse(x, cy + 5, 1.7, 1.7), C.trim);
  F.dot(x, cy + 5, C.gem);
}

// the medallion: an emerald in gold (Windrunner), a crescent and a gem in silver (Moon Ranger)
function medallion(F, x, y, o) {
  const C = o.C;
  F.part(ellipse(x, y, 2.6, 2.6), C.trim);
  if (o.wind) { F.dot(x, y, C.gem); F.dot(x, y - 1, C.gemLt); }
  else { crescent(F, x, y, C.body, 1, 1.6); F.dot(x + 1, y, C.gem); }
}

// what drifts round them: ribbons of wind, or stars
function motes(F, cx, cy, W, o) {
  const C = o.C, ph = P.atk >= 0 ? P.atk * 0.9 : P.step * 1.2 + 1;
  if (o.wind) {
    for (const side of [-1, 1]) {
      let last = null;
      for (let i = 0; i <= 26; i++) {
        const t = i / 26, y = cy + 56 - t * 56, x = cx + side * (W + 7 + Math.sin(t * 7 + ph + (side > 0 ? 2 : 0)) * 3 + t * 2);
        if (last) F.part(line(last[0], last[1], x, y, 1), i % 6 < 4 ? C.mote : C.mote2, flat);
        last = [x, y];
      }
    }
    return;
  }
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1, t = (i * 0.37 + ph * 0.11) % 1, x = cx + side * (W + 6 + ((i * 5) % 4)), y = cy + 52 - t * 58;
    star(F, x, y, (i + Math.round(ph)) % 3 ? C.mote2 : C.mote, (i + Math.round(ph)) % 3 === 0);
  }
}

// the long cape's pattern, between x0..x1 and y0..y1: gold wind swirls, or stars and a constellation
function capeArt(F, x0, x1, y0, y1, o) {
  const C = o.C, at = (u, v) => [Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * v)];
  if (o.wind) {
    for (const [u, v] of [[0.25, 0.55], [0.75, 0.62], [0.5, 0.85]]) {
      const [x, y] = at(u, v);
      for (let a = 0; a < 5.5; a += 0.35) F.dot(x + Math.cos(a) * (1 + a * 0.55), y + Math.sin(a) * (1 + a * 0.45), C.trim);
    }
    return;
  }
  const pts = [[0.15, 0.2], [0.35, 0.3], [0.5, 0.18], [0.7, 0.32], [0.85, 0.22], [0.25, 0.6], [0.45, 0.7], [0.7, 0.62], [0.82, 0.8], [0.18, 0.85], [0.55, 0.88]];
  edge(F, pts.slice(0, 5).map(([u, v]) => at(u, v)), C.lining);
  edge(F, [at(0.25, 0.6), at(0.45, 0.7), at(0.7, 0.62)], C.lining);
  pts.forEach(([u, v], i) => { const [x, y] = at(u, v); star(F, x, y, i % 3 ? C.mote2 : C.mote, i % 4 === 0); });
}
// the emblem on the cape's back: a gold ring with a winged arrow, or a great crescent with a star
function emblem(F, x, y, o) {
  const C = o.C;
  ring(F, x, y, 8, 8, C.trim);
  if (o.wind) {
    F.part(line(x - 5, y + 4, x + 5, y - 4, 1), C.trim, flat);
    F.part(poly([[x + 5, y - 4], [x + 2, y - 4], [x + 5, y - 1]]), C.trim);
    for (const sd of [-1, 1]) edge(F, [[x - 4, y + 3], [x - 4 + sd * 4, y + 3 - 4], [x - 2 + sd * 2, y + 2]], C.lining);
  } else { crescent(F, x - 1, y, C.trim, 1, 5); crescent(F, x - 1, y, C.silver, 1, 4); star(F, x + 3, y - 2, C.mote, true); }
}
// the cape's hem tips: gold feathers, or silver crescents
function tip(F, x, y, o) {
  if (o.wind) F.part(poly([[x - 1.5, y - 3], [x + 1.5, y - 3], [x, y + 2]]), o.C.trim);
  else crescent(F, x, y - 1, o.C.trim, 1, 1.8);
}

function legs(F, o, cx, cy, r, toe, front = true) {
  cy -= P.bob;
  const { f, legs: L, boot } = build(o), C = o.C;
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * 2);
    const top = cyl + boot, mid = cx + (a + b) / 2 + sh;
    if (f) F.part(rect(cx + a + sh, cy + 28, cx + b + sh, top), C.skin); // bare thighs above the boots
    else F.part(rect(cx + a + sh, cy + 30, cx + b + sh, top), C.pants);
    F.part(rect(cx + a - (f ? 0 : 1) + sh, top, cx + b + (f ? 0 : 1) + sh, cyl + 58), f ? C.boot : C.silver); // her thigh-high boots, his greaves
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), f ? C.boot : C.silver);
    F.part(line(cx + a - (f ? 0 : 1) + sh, top, cx + b + (f ? 0 : 1) + sh, top, 1), C.trim, flat); // the band at the top
    if (!front) return;
    const ky = cyl + (f ? 45 : 46);
    F.part(poly([[mid, ky - 5], [mid + 2.5, ky - 1], [mid + 2.5, ky + 2], [mid, ky + 5], [mid - 2.5, ky + 2], [mid - 2.5, ky - 1]]), f ? C.silver : C.trim); // the knee guard
    F.dot(mid, ky, C.gem);
    F.part(line(mid - 2, cyl + 54, mid + 2, cyl + 54, 1), C.trim, flat);
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cyl + 61, 2, 1.2), C.trim, flat); // the toe cap
  });
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, skirt } = build(o), C = o.C;
  const R = (v) => v - r;
  // the long cape behind, its lining showing past the legs, tips along its hem
  const hem = [[cx - W - 8, cy + 57], [cx - W - 4, cy + 53], [cx - 7, cy + 59], [cx - 2, cy + 55], [cx + 3, cy + 59], [R(cx + 8), cy + 55], [R(cx + W + 5), cy + 59], [R(cx + W + 8), cy + 54]];
  F.part(poly([[cx - W - 1, cy + 3], [R(cx + W + 1), cy + 3], ...hem.slice().reverse()]), C.cape);
  F.part(poly([[cx - W + 1, cy + 9], [R(cx + W - 1), cy + 9], [R(cx + W + 4), cy + 55], [cx + 3, cy + 58], [cx - 3, cy + 55], [cx - W - 4, cy + 54]]), C.lining, soft);
  edge(F, hem.slice(0, 2), C.trim); edge(F, hem.slice(-2), C.trim);
  for (const p of [hem[0], hem[2], hem[4], hem[6]]) tip(F, p[0], p[1], o);
  for (const sd of [-1, 1]) collar(F, (u) => (sd < 0 ? cx - u : R(cx + u)) + s, cy, o);
  // the quiver's feathers over the right shoulder
  C.feathers.forEach((c, i) => { const x = cx - W - 1 + i * 1.5, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 3, 1), c, flat); });
  legs(F, o, cx, cy, r, s);
  // below the waist. Him: coat tails split over the trousers. Her: long tails at the sides, a short
  // pleated skirt in front
  if (f) {
    for (const sd of [-1, 1]) {
      const ox = sd < 0 ? cx - hip : R(cx + hip);
      const pts = [[ox - sd * 3, cy + 23], [ox + sd * 2, cy + 25], [ox + sd * 4, cy + 46], [ox + sd * 1, cy + 49], [ox - sd * 1, cy + 30]];
      F.part(poly(pts), C.coat);
      edge(F, pts.slice(1, 4), C.trim);
    }
    F.part(poly([[cx - hip, cy + 23], [R(cx + hip), cy + 23], [R(cx + hip + 3), cy + skirt], [cx - hip - 3, cy + skirt]]), o.moon ? C.coat : C.coatDk);
    for (const x of [-6, -2, 2, 6]) F.part(line(cx + x + s, cy + 25, cx + x * 1.3 + s, cy + skirt - 1, 1), o.moon ? C.coatDk : C.coat, flat); // the pleats
    F.part(line(cx - hip - 3, cy + skirt, R(cx + hip + 3), cy + skirt, 1), C.trim, flat);
    if (o.moon) F.part(line(cx - hip - 2, cy + skirt + 1, R(cx + hip + 2), cy + skirt + 1, 1), C.body, flat); // the navy underskirt's edge
  } else {
    for (const sd of [-1, 1]) {
      const ox = sd < 0 ? cx - hip : R(cx + hip), ix = cx + sd * 3 + s;
      const pts = [[ix, cy + 25], [ox, cy + 25], [ox + sd * 2, cy + skirt], [ix + sd * 1, cy + skirt - 3]];
      F.part(poly(pts), C.coat);
      edge(F, [[ix, cy + 26], [ix + sd, cy + skirt - 3], [ox + sd * 2, cy + skirt]], C.trim);
      for (const y of [32, 40]) { F.dot(lerp(ix, ox + sd * 2, 0.5), cy + y, C.trimDk); F.dot(lerp(ix, ox + sd * 2, 0.5) + sd, cy + y + 2, C.trim); } // filigree on the tails
    }
  }
  // the body: his coat over a shirt; her fitted bodice (the Windrunner's leaves her midriff bare)
  const top = f && o.wind ? 16 : 24;
  if (f && o.wind) F.part(poly([[cx - waist, cy + 15], [R(cx + waist), cy + 15], [R(cx + hip - 1), cy + 25], [cx - hip + 1, cy + 25]]), C.skin);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist + (f ? 1 : 0)), cy + top], [cx - waist - (f ? 1 : 0), cy + top], [cx - W - 1, cy + 8]]), f ? C.body : C.coat);
  if (f) {
    F.part(poly([[cx - 4 + s, cy + 2], [cx + 4 + s, cy + 2], [cx + s, cy + 9]]), C.skin); // the neckline
    F.part(line(cx - 5 + s, cy + 10, cx - 1 + s, cy + 11, 1), C.coatDk, flat); // the bust's shading
    F.part(line(cx + 1 + s, cy + 11, cx + 5 + s, cy + 10, 1), C.coatDk, flat);
    for (let y = 12; y < top - 1; y += 2) { F.dot(cx - 1 + s, cy + y, C.trim); F.dot(cx + 1 + s, cy + y + 1, C.trim); } // the lacing
    edge(F, [[cx - waist - 1, cy + top], [cx + s, cy + top - 2], [R(cx + waist + 1), cy + top]], C.trim);
    if (o.wind) F.dot(cx + s, cy + 19, C.coatDk); // the navel
  } else {
    F.part(poly([[cx - 4 + s, cy + 3], [cx + 4 + s, cy + 3], [cx + s, cy + 10]]), C.shirt);
    F.part(line(cx - 5 + s, cy + 3, cx - 1 + s, cy + 22, 1), C.trim, flat);
    F.part(line(cx + 5 + s, cy + 3, cx + 1 + s, cy + 22, 1), C.trim, flat);
    edge(F, [[cx - W + 2, cy + 9], [cx - 6 + s, cy + 14], [cx - 3 + s, cy + 14]], C.trim);
    edge(F, [[R(cx + W - 2), cy + 9], [cx + 6 + s, cy + 14], [cx + 3 + s, cy + 14]], C.trim);
  }
  if (f) { F.part(line(cx - 4 + s, cy + 2, cx + 4 + s, cy + 2, 1), C.trim, flat); F.part(ellipse(cx + s, cy + 4, 1.6, 1.6), C.trim); F.dot(cx + s, cy + 4, C.gem); } // a choker and its gem
  else medallion(F, cx + s, cy + 14, o);
  // the belt and its buckle
  F.part(rect(cx - hip, cy + 22, R(cx + hip), cy + 24), C.coatDk);
  F.part(line(cx - hip, cy + 22, R(cx + hip), cy + 22, 1), C.trim, flat);
  F.part(rect(cx - 2 + s, cy + 21, cx + 2 + s, cy + 25), C.trim);
  F.dot(cx + s, cy + 23, C.gem);
  // his high collar's front (her neckline stays open), the pauldrons
  if (!f) {
    F.part(poly([[cx - 6 + s, cy - 1], [cx + 6 + s, cy - 1], [cx + 7 + s, cy + 3], [cx - 7 + s, cy + 3]]), C.coat);
    F.part(line(cx - 6 + s, cy - 1, cx + 6 + s, cy - 1, 1), C.trim, flat);
  }
  pauldron(F, cx - W - 1, cy, -1, o, f);
  pauldron(F, R(cx + W + 1), cy, 1, o, f);
  arms(F, o, cx, cy, W, R, s, false);
  motes(F, cx, cy, W, o);
  return F;
}

// the arms, and the bow: hanging in the left hand at rest, raised and drawn to the cheek to shoot.
// mirror: the back view
function arms(F, o, cx, cy, W, R, s, mirror) {
  const C = o.C, f = o.sex === 'f', k = raised(), d = drawn();
  const bowX = mirror ? cx - W - 2 : R(cx + W + 2), drawX = mirror ? R(cx + W + 2) : cx - W - 2, dir = mirror ? -1 : 1;
  const sleeve = f ? C.body : C.coat;
  const hang = (x0, x1, side) => {
    F.part(rect(x0, cy + 10, x1, cy + 17), sleeve);
    F.part(rect(x0, cy + 16, x1, cy + 25), C.silver); // the vambrace
    F.part(rect(x0, cy + 22, x1, cy + 24), C.trim, soft);
    F.dot((x0 + x1) / 2, cy + 19, C.gem);
    const ex = side < 0 ? x0 : x1;
    F.part(poly([[ex, cy + 15], [ex + side * 3, cy + 18], [ex, cy + 20]]), C.trim); // the elbow fin
    F.part(ellipse((x0 + x1) / 2, cy + 28, 2.7, 2.5), C.glove);
  };
  const shooting = P.atk >= 0;
  const bx = lerp(bowX, cx + dir * 6 + s, k), by = lerp(cy + 28, cy + 13, k);
  const ang = mirror ? lerp(-90, 30, k) : lerp(90, 150, k);
  const cheek = [lerp(bx - dir * 4, cx - dir * 5 + s, d), lerp(by - 5, cy + 3, d)];
  const pull = P.atk === LOOSE ? 0 : 2 + 6 * d;
  const hold = bow(F, o, bx, by, ang, shooting ? pull : 0, shooting && d > 0, P.atk === LOOSE && !mirror, shooting && P.atk !== LOOSE ? cheek : null);
  if (!shooting) { hang(bowX - 2, bowX + 2, mirror ? -1 : 1); hang(drawX - 2, drawX + 2, mirror ? 1 : -1); return; }
  const reach = (x0, y0, x1, y1) => { const mx = lerp(x0, x1, 0.5), my = lerp(y0, y1, 0.5); F.part(line(x0, y0, mx, my, 4), sleeve); F.part(line(mx, my, x1, y1, 4), C.silver); F.part(ellipse(x1, y1, 2.4, 2.2), C.glove); };
  reach(mirror ? cx - W : R(cx + W), cy + 7, bx, by);
  const [hx, hy] = hold, ex = drawX - dir * 2, ey = cy + 3;
  F.part(line(mirror ? R(cx + W) : cx - W, cy + 7, ex, ey, 4), sleeve);
  F.part(line(ex, ey, hx, hy, 4), C.silver);
  F.part(ellipse(hx, hy, 2.4, 2.2), C.glove);
}
// the ornate bow: a recurve with a gem at the grip, ornaments at its tips, and light flaring from it
// as the arrow leaves (on LOOSE and the frame after)
function bow(F, o, x, y, ang, pull, arrow, loose, handAt) {
  const C = o.C, hand = recurve(F, x, y, ang, 21, C.bow, pull, arrow, loose, handAt);
  const ux = Math.cos((ang * Math.PI) / 180), uy = Math.sin((ang * Math.PI) / 180), nx = uy, ny = -ux;
  F.part(ellipse(x + nx * 2.5, y + ny * 2.5, 1.4, 1.4), C.trim);
  F.dot(x + nx * 2.5, y + ny * 2.5, C.gem);
  for (const sd of [-1, 1]) { // the tips: a feather fin, or a crescent
    const tx = x + ux * sd * 20 + nx * 2, ty = y + uy * sd * 20 + ny * 2;
    if (o.wind) F.part(poly([[tx, ty], [tx + nx * 3 + ux * sd * 2, ty + ny * 3 + uy * sd * 2], [tx + ux * sd * 3, ty + uy * sd * 3]]), C.trim);
    else crescent(F, tx, ty, C.trim, sd, 1.6);
  }
  const fl = P.atk === LOOSE ? 4 : P.atk === LOOSE + 1 ? 2 : 0;
  if (fl) burst(F, x + nx * 9, y + ny * 9, fl, C.flash);
  return hand;
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, skirt } = build(o), C = o.C;
  const R = (v) => v - r;
  if (P.atk >= 0) arms(F, o, cx, cy, W, R, s, true); // the bow is in front of the body: only its tips show
  legs(F, o, cx, cy, r, 0, false);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), f ? C.body : C.coat);
  if (f) F.part(poly([[cx - hip, cy + 23], [R(cx + hip), cy + 23], [R(cx + hip + 3), cy + skirt], [cx - hip - 3, cy + skirt]]), o.moon ? C.coat : C.coatDk);
  // the long cape over the back: the pattern, the emblem, tips along the hem, the lining at its folds
  const hem = [[R(cx + W + 8), cy + 56], [R(cx + W + 4), cy + 60], [R(cx + 7), cy + 56], [cx + 2 + s, cy + 61], [cx - 4 + s, cy + 56], [cx - W - 4, cy + 60], [cx - W - 8, cy + 56]];
  F.part(poly([[cx - W + 1, cy + 2], [R(cx + W - 1), cy + 2], [R(cx + W + 3), cy + 12], ...hem, [cx - W - 3, cy + 12]]), C.cape);
  for (const [x0, x1] of [[-5, -8], [5 - r, 7 - r]]) F.part(line(cx + x0 + s, cy + 34, cx + x1 + s, cy + 55, 1), C.capeDk, flat);
  F.part(line(cx - W - 7, cy + 55, cx - W - 4, cy + 18, 1), C.lining, flat);
  F.part(line(R(cx + W + 7), cy + 55, R(cx + W + 4), cy + 18, 1), C.lining, flat);
  for (let i = 0; i < hem.length - 1; i++) F.part(line(hem[i][0], hem[i][1] - 1, hem[i + 1][0], hem[i + 1][1] - 1, 1), C.trim, flat);
  for (const p of [hem[1], hem[3], hem[5]]) tip(F, p[0], p[1], o);
  capeArt(F, cx - W, R(cx + W), cy + 30, cy + 54, o);
  emblem(F, cx + s, cy + 22, o);
  // the quiver over the cape, from the right shoulder down
  F.part(poly([[R(cx + W - 1), cy - 3], [R(cx + W + 4), cy - 1], [cx + 4 + s, cy + 14], [cx + s, cy + 12]]), C.quiver);
  F.part(line(R(cx + W - 1), cy - 3, R(cx + W + 4), cy - 1, 1), C.trim, flat);
  C.feathers.forEach((c, i) => { const x = R(cx + W - 1) + i * 2, y = cy - 4 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  for (const sd of [-1, 1]) collar(F, (u) => (sd < 0 ? cx - u : R(cx + u)) + s, cy, o);
  F.part(poly([[cx - 7 + s, cy - 3], [cx + 7 + s, cy - 3], [cx + 8 + s, cy + 3], [cx - 8 + s, cy + 3]]), f ? C.body : C.coat); // the collar's back
  F.part(line(cx - 7 + s, cy - 3, cx + 7 + s, cy - 3, 1), C.trim, flat);
  pauldron(F, cx - W - 1, cy, -1, o, f);
  pauldron(F, R(cx + W + 1), cy, 1, o, f);
  if (P.atk < 0) arms(F, o, cx, cy, W, R, s, true);
  else { // the drawing arm, elbow out to the right, over the cape
    const ex = R(cx + W + 5), ey = cy + 4;
    F.part(line(R(cx + W), cy + 7, ex, ey, 4), f ? C.body : C.coat);
    F.part(line(ex, ey, cx + 4 + s, cy + 6, 4), C.silver);
  }
  motes(F, cx, cy, W, o);
  return F;
}

// facing right: the cape streaming behind, the bow in the far hand
function side(F, o, cx, cy) {
  const { f, skirt, boot } = build(o), C = o.C, k = raised(), d = drawn(), shooting = P.atk >= 0;
  const cy0 = cy - P.bob;
  // the cape behind, then the collar
  const cp = [[cx - 4, cy + 2], [cx - 9, cy0 + 8], [cx - 17, cy0 + 32], [cx - 22, cy0 + 57], [cx - 16, cy0 + 54], [cx - 12, cy0 + 59], [cx - 7, cy0 + 54], [cx - 4, cy0 + 30]];
  F.part(poly(cp), C.cape);
  F.part(line(cx - 6, cy0 + 10, cx - 11, cy0 + 52, 1), C.lining, flat);
  edge(F, cp.slice(2, 7), C.trim);
  tip(F, cx - 22, cy0 + 57, o); tip(F, cx - 12, cy0 + 59, o);
  if (o.wind) for (const [x, y] of [[-14, 40], [-11, 26]]) for (let a = 0; a < 5; a += 0.4) F.dot(cx + x + Math.cos(a) * (1 + a * 0.4), cy0 + y + Math.sin(a) * (1 + a * 0.35), C.trim);
  else for (const [x, y] of [[-9, 18], [-12, 30], [-15, 42], [-11, 48], [-8, 26], [-17, 52]]) star(F, cx + x, cy0 + y, C.mote, y === 30);
  collar(F, (u) => cx - 2 - u * 0.8, cy, o);
  // the quiver on the back
  F.part(poly([[cx - 7, cy - 3], [cx - 3, cy - 5], [cx - 6, cy + 20], [cx - 10, cy + 19]]), C.quiver);
  C.feathers.forEach((c, i) => { const x = cx - 6 + i * 2, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  const bx = lerp(cx + 8, cx + 17, k), by = lerp(cy + 27, cy + 8, k);
  if (!shooting) bow(F, o, bx, by, 95, 0, false, false, null);
  const leg = (x) => {
    const top = cy0 + boot;
    F.part(rect(x - 3, cy0 + 28, x + 2, top), f ? C.skin : C.pants);
    F.part(rect(x - (f ? 3 : 4), top, x + (f ? 2 : 3), cy0 + 58), f ? C.boot : C.silver);
    F.part(line(x - (f ? 3 : 4), top, x + (f ? 2 : 3), top, 1), C.trim, flat);
    F.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), f ? C.boot : C.silver);
    F.part(poly([[x + 2, cy0 + 41], [x + 5, cy0 + 45], [x + 2, cy0 + 50], [x, cy0 + 45]]), f ? C.silver : C.trim);
  };
  leg(cx - 2 - Math.round(3 * P.step));
  leg(cx + 2 + Math.round(3 * P.step));
  // below the waist: his long tails; her short skirt and a long tail behind
  if (f) {
    F.part(poly([[cx - 6, cy + 23], [cx - 2, cy + 23], [cx - 10, cy + 47], [cx - 12, cy + 44]]), C.coat);
    edge(F, [[cx - 2, cy + 24], [cx - 10, cy + 47]], C.trim);
    F.part(poly([[cx - 7, cy + 23], [cx + 6, cy + 23], [cx + 9, cy + skirt], [cx - 9, cy + skirt]]), o.moon ? C.coat : C.coatDk);
    F.part(line(cx - 9, cy + skirt, cx + 9, cy + skirt, 1), C.trim, flat);
  } else {
    F.part(poly([[cx - 6, cy + 25], [cx + 6, cy + 25], [cx + 6, cy + skirt - 2], [cx - 10, cy + skirt]]), C.coat);
    edge(F, [[cx + 6, cy + 26], [cx + 6, cy + skirt - 2], [cx - 10, cy + skirt]], C.trim);
  }
  // the body
  if (f && o.wind) F.part(rect(cx - 5, cy + 15, cx + 6, cy + 23), C.skin);
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + (f && o.wind ? 16 : 22)], [cx - 6, cy + (f && o.wind ? 16 : 22)], [cx - 8, cy + 8]]), f ? C.body : C.coat);
  if (!f) F.part(line(cx + 4, cy + 3, cx + 5, cy + 22, 1), C.trim, flat);
  else edge(F, [[cx - 6, cy + (o.wind ? 16 : 22)], [cx + 6, cy + (o.wind ? 16 : 22)]], C.trim);
  F.part(rect(cx - 6, cy + 22, cx + 6, cy + 24), C.coatDk);
  F.part(line(cx - 6, cy + 22, cx + 6, cy + 22, 1), C.trim, flat);
  F.part(rect(cx + 4, cy + 21, cx + 7, cy + 25), C.trim);
  if (!f) { F.part(poly([[cx - 4, cy - 3], [cx + 2, cy - 2], [cx + 3, cy + 3], [cx - 6, cy + 3]]), C.coat); F.part(line(cx - 4, cy - 3, cx + 2, cy - 2, 1), C.trim, flat); }
  pauldron(F, cx - 1, cy, -1, o, f);
  if (shooting) {
    const pull = P.atk === LOOSE ? 0 : 2 + 9 * d, sleeve = f ? C.body : C.coat;
    F.part(line(cx + 1, cy + 7, bx - 1, by, 4), sleeve);
    F.part(line(lerp(cx + 1, bx, 0.5), lerp(cy + 7, by, 0.5), bx - 1, by, 4), C.silver);
    const [hx, hy] = bow(F, o, bx, by, 95, pull, d > 0 && P.atk !== LOOSE, P.atk === LOOSE, null);
    F.part(ellipse(bx, by, 2.2, 2.2), C.glove);
    const ex = lerp(cx, cx - 5, d), ey = cy + 6;
    F.part(line(cx - 1, cy + 6, ex, ey, 4), sleeve);
    F.part(line(ex, ey, hx, hy, 4), C.silver);
    F.part(ellipse(hx, hy, 2.4, 2.2), C.glove);
  } else {
    F.part(rect(cx - 3, cy + 10, cx + 1, cy + 16), f ? C.body : C.coat);
    F.part(rect(cx - 3, cy + 16, cx + 1, cy + 25), C.silver);
    F.part(rect(cx - 3, cy + 22, cx + 1, cy + 24), C.trim, soft);
    F.part(poly([[cx - 3, cy + 15], [cx - 6, cy + 18], [cx - 3, cy + 20]]), C.trim);
    F.part(ellipse(cx, cy + 28, 2.6, 2.6), C.glove);
  }
  motes(F, cx - 2, cy, 8, o);
  return F;
}

export const drawRanger = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(RANGERS[id], view, cx, cy); } finally { P = REST; } };
export const animRanger = (id, heads) => animFrames(VIEWS, heads, BW, drawRanger(id));
