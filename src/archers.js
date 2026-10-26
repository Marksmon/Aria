// Sprite designs for the Archer, male and female, painted in code like the Blader designs
// (bladers.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md). After the owner's sheet: a brown leather vest with straps and
// buckles over a green tunic (blue on her), a leather guard on the bow shoulder, laced leather
// bracers, a belt with pouches and a bedroll at the back, dark trousers, tall laced boots, a quiver
// of red- and white-feathered arrows on the back, and a recurve bow in the left hand.
// The Windrunner (wind), after the second sheet: a green coat to the knee worked with gold
// filigree, silver pauldrons on both shoulders, silver vambraces and greaves with gold knee points,
// a teal cape, a feathered teal quiver, an ornate gold and white bow, and ribbons of wind curling
// round the body.
// Standing, walking (8 frames) and shooting (7: the bow raised, the string drawn to the chin, the
// arrow loosed, the bow lowered), 8 directions: the left ones are the right ones mirrored.
// The game paints the hero's body from these (sprites.js designSet). Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SHOOT, LOOSE, recurve, animFrames, VIEWS } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const ARCHER = {
  tunic: '#4f7a3a', tunicDk: '#3a5c2a', vest: '#7a4a2a', vestDk: '#5c3620', strap: '#4a2e1c', buckle: '#d4ac54',
  pants: '#3a3430', boot: '#5e3b22', lace: '#c8a878', bracer: '#6a4024', skin: '#f2c8a2', roll: '#a8946a',
  quiver: '#6b4424', feathers: ['#f4ecd8', '#c8463c', '#f4ecd8'],
  bow: { wood: '#8a5a2a', light: '#c89a5a', grip: '#4a2e1c', string: '#efe8d8', arrow: '#d8c8a0', tip: '#b8bec8', fletch: '#c8463c' },
};
const ARCHER_F = { ...ARCHER, tunic: '#3f6aa8', tunicDk: '#2f4f86' };
const WIND = {
  tunic: '#2f7a4c', tunicDk: '#225a38', vest: '#25623e', vestDk: '#1a4a2e', strap: '#5a3a20', buckle: '#e0b84e',
  pants: '#2a2a32', boot: '#c4cad4', lace: '#e0b84e', bracer: '#c4cad4', skin: '#f2c8a2', roll: '#a8946a',
  quiver: '#2a7a7a', feathers: ['#ffffff', '#5ad8c8', '#ffffff'], trim: '#e0b84e', cape: '#2a9a96', capeDk: '#1e7470',
  silver: '#d0d6e0', ribbon: '#c8fff0', ribbon2: '#7ae8d0',
  bow: { wood: '#e0b84e', light: '#fff6d8', grip: '#2a7a7a', string: '#ffffff', arrow: '#f0e8d0', tip: '#d0d8e8', fletch: '#5ad8c8' },
};
const MOON = {
  tunic: '#2a3a6e', tunicDk: '#1c2850', coat: '#d4d9e6', vest: '#b4bccf', vestDk: '#7a84a0', strap: '#2a2a48', buckle: '#6aa8ff',
  pants: '#1e1e28', boot: '#c4cad8', lace: '#6aa8ff', bracer: '#c4cad8', skin: '#f2c8a2', roll: '#a8946a',
  quiver: '#2a3468', feathers: ['#ffffff', '#cfe0ff', '#ffffff'], trim: '#eef2ff', cape: '#1e2a5a', capeDk: '#141c40',
  silver: '#dfe4ee', ribbon: '#fff6c8', ribbon2: '#c8d8ff', navy: '#22305e', gem: '#5a9aff',
  bow: { wood: '#d8dce8', light: '#ffffff', grip: '#2a3468', string: '#ffffff', arrow: '#ffffff', tip: '#cfe0ff', fletch: '#cfe0ff' },
};
export const ARCHERS = {
  archerM: { name: 'Archer', sex: 'm', C: ARCHER },
  archerF: { name: 'Archer', sex: 'f', C: ARCHER_F },
  windM: { name: 'Windrunner', sex: 'm', two: true, wind: true, C: WIND },
  windF: { name: 'Windrunner', sex: 'f', two: true, wind: true, C: { ...WIND, tunic: '#367f56', vest: '#2a6844' } },
  moonM: { name: 'Moon Ranger', sex: 'm', two: true, moon: true, C: MOON },
  moonF: { name: 'Moon Ranger', sex: 'f', two: true, moon: true, C: { ...MOON, tunic: '#30427a' } },
};

const flat = { outline: false, flat: true }; // a trim's line: no outline or shading
const soft = { outline: false };             // shaded, but no outline (a panel inside a part)
let P = REST; // the pose being painted (design-anim.js): its step, bob and attack frame
const lerp = (a, b, k) => a + (b - a) * k;
// how far into the shot: the bow raised (0 at rest .. 1 aimed) and the string drawn (0 .. 1)
const raised = () => (P.atk >= 0 ? SHOOT.raise[P.atk] : 0);
const drawn = () => (P.atk >= 0 ? SHOOT.draw[P.atk] : 0);

function build(o) {
  const f = o.sex === 'f';
  return { f, W: f ? 11 : 12, waist: f ? 7 : 9, hip: f ? 10 : 9, legs: f ? [[-7, -2], [2, 7]] : [[-7, -2], [2, 7]], knee: f ? 40 : 41, hem: o.two ? 46 : f ? 40 : 37 };
}
const edge = (F, pts, col) => { for (let i = 0; i < pts.length - 1; i++) F.part(line(...pts[i], ...pts[i + 1], 1), col, flat); };
// a silver pauldron (the Windrunner's): two layered plates, a gold edge and rivet
function pauldron(F, x, cy, C) {
  F.part(ellipse(x, cy + 6, 5, 3.5), C.silver);
  F.part(ellipse(x, cy + 9, 4.5, 2.5), C.silver);
  F.part(line(x - 3, cy + 11, x + 3, cy + 11, 1), C.trim, flat);
  if (C.gem) { F.part(ellipse(x, cy + 6, 1.4, 1.4), C.trim); F.dot(x, cy + 6, C.gem); } // a blue gem roundel
  else F.dot(x, cy + 5, C.trim);
}
// what drifts round a second job: the Windrunner's ribbons of wind, the Moon Ranger's stars
function motes(F, cx, cy, W, o) {
  if (o.wind) return ribbons(F, cx, cy, W, o.C);
  const ph = P.atk >= 0 ? P.atk : P.step * 2 + 3, C = o.C;
  for (let i = 0; i < 7; i++) { // little stars, rising and twinkling as the frames go
    const side = i % 2 ? 1 : -1, t = ((i * 0.37 + ph * 0.11) % 1), x = cx + side * (W + 4 + ((i * 5) % 4)), y = cy + 50 - t * 56;
    const big = (i + Math.round(ph)) % 3 === 0;
    F.dot(x, y, big ? C.ribbon : C.ribbon2);
    if (big) { F.dot(x - 1, y, C.ribbon2); F.dot(x + 1, y, C.ribbon2); F.dot(x, y - 1, C.ribbon2); F.dot(x, y + 1, C.ribbon2); }
  }
}
// a small crescent moon, its horns to the right (dir 1) or left
function crescent(F, x, y, col, dir = 1, r = 2.5) {
  for (let a = -Math.PI * 0.75; a <= Math.PI * 0.75; a += 0.25) F.dot(x - dir * Math.cos(a) * r, y + Math.sin(a) * r, col);
}
// stars and a constellation on the Moon Ranger's cape, crescents along its hem
function starryCape(F, pts, x0, x1, y0, y1, C) {
  const stars = [[0.2, 0.15], [0.5, 0.22], [0.75, 0.12], [0.35, 0.45], [0.62, 0.5], [0.85, 0.4], [0.18, 0.7], [0.5, 0.75], [0.8, 0.72]];
  const at = ([u, v]) => [Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * v)];
  edge(F, [at(stars[0]), at(stars[1]), at(stars[2])], C.capeDk === C.cape ? C.ribbon2 : '#3a4a8a');
  edge(F, [at(stars[3]), at(stars[4]), at(stars[5])], '#3a4a8a');
  for (const st of stars) { const [x, y] = at(st); F.dot(x, y, C.ribbon); }
  for (let i = 1; i < pts.length - 1; i += 2) crescent(F, pts[i][0], pts[i][1] - 3, C.trim, 1, 1.6);
}
// ribbons of wind curling up round the body, on both sides; the phase moves with the walk and the shot
function ribbons(F, cx, cy, W, C) {
  const ph = P.atk >= 0 ? P.atk * 0.9 : P.step * 1.2;
  for (const side of [-1, 1]) {
    let last = null;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, y = cy + 52 - t * 50, x = cx + side * (W + 5 + Math.sin(t * 7 + ph + (side > 0 ? 2 : 0)) * 3 + t * 2);
      if (last) F.part(line(last[0], last[1], x, y, 1), i % 6 < 4 ? C.ribbon : C.ribbon2, flat);
      last = [x, y];
    }
  }
}

// one direction's frame. cx, cy: the head's chin in the frame. view: front | front3 | side | back3 | back
function paint(o, view, cx, cy) {
  const F = new Frame(BW, BH);
  if (view === 'side') return side(F, o, cx, cy);
  const back = view === 'back' || view === 'back3';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0; // the front (or the seam) turns this way
  const r = view === 'front3' || view === 'back3' ? 3 : 0;     // the far side narrows
  return back ? backView(F, o, cx, cy, s, r) : frontView(F, o, cx, cy, s, r);
}

function legs(F, o, cx, cy, r, toe) {
  cy -= P.bob; // the feet stay on the ground while the body sinks
  const { f, legs: L, knee } = build(o), C = o.C;
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * 2); // the stepping leg lifts
    F.part(rect(cx + a + sh, cy + 30, cx + b + sh, cyl + 58), C.pants);
    F.part(rect(cx + a - 1 + sh, cyl + knee - 1, cx + b + 1 + sh, cyl + 58), C.boot);
    F.part(ellipse(cx + (a + b) / 2 + toe + sh + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    const mid = cx + (a + b) / 2 + sh;
    if (o.two) { // silver greaves: a gold band, a pointed gold knee guard
      F.part(line(cx + a - 1 + sh, cyl + knee - 1, cx + b + 1 + sh, cyl + knee - 1, 1), C.trim, flat);
      F.part(poly([[mid, cyl + knee - 4], [mid + 2.5, cyl + knee], [mid, cyl + knee + 4], [mid - 2.5, cyl + knee]]), C.trim);
      F.part(line(mid - 2, cyl + 54, mid + 2, cyl + 54, 1), C.trim, flat);
      return;
    }
    F.part(rect(cx + a - 1 + sh, cyl + knee - 1, cx + b + 1 + sh, cyl + knee), C.vestDk, soft); // the folded cuff
    for (let y = cyl + knee + 3; y < cyl + 56; y += 3) { F.dot(mid - 1, y, C.lace); F.dot(mid + 1, y + 1, C.lace); } // the laces
  });
}

// the quiver's feathers over the right shoulder and its strap across the chest (front views)
function quiverFront(F, cx, cy, W, s, C) {
  F.part(poly([[cx - W - 1, cy - 3], [cx - W + 3, cy - 5], [cx - W + 5, cy + 4], [cx - W + 1, cy + 5]]), C.quiver);
  C.feathers.forEach((c, i) => { const x = cx - W - 1 + i * 1.5, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 3, 1), c, flat); });
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C;
  const R = (v) => v - r; // a point on the far (viewer's right) side
  quiverFront(F, cx, cy, W, s, C);
  if (o.two) { // the teal cape behind, its edges showing past the body
    const pts = [[cx - W - 1, cy + 4], [R(cx + W + 1), cy + 4], [R(cx + W + 6), cy + 54], [cx + 2, cy + 51], [cx - W - 6, cy + 55]];
    F.part(poly(pts), C.cape);
    edge(F, pts.slice(2), C.trim);
  }
  legs(F, o, cx, cy, r, s);
  // the tunic: body, and its skirt split at the front
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.tunic);
  F.part(poly([[cx - hip, cy + 26], [R(cx + hip), cy + 26], [R(cx + hip + 2), cy + hem], [cx + 1 + s, cy + hem], [cx + s, cy + hem - 4], [cx - 1 + s, cy + hem], [cx - hip - 2, cy + hem]]), C.coat || C.tunic);
  F.part(line(cx - hip - 1, cy + hem, cx - 1 + s, cy + hem, 1), o.two ? C.trim : C.tunicDk, flat);
  F.part(line(cx + 1 + s, cy + hem, R(cx + hip + 1), cy + hem, 1), o.two ? C.trim : C.tunicDk, flat);
  if (o.two) for (const side of [-1, 1]) F.part(line(cx + side * 2 + s, cy + 28, cx + side * 2 + s, cy + hem - 4, 1), C.trim, flat); // gold down the split
  // the leather vest: two front panels open in a V over the tunic, buckled straps across
  for (const side of [-1, 1]) {
    const o0 = side < 0 ? cx - W : R(cx + W), w0 = side < 0 ? cx - waist : R(cx + waist);
    const pts = [[o0, cy + 3], [cx + side * 3 + s, cy + 3], [cx + side * 1 + s, cy + (f ? 12 : 14)], [cx + side * 2 + s, cy + 24], [w0 - side, cy + 24], [w0, cy + 20], [o0 + side, cy + 8]];
    F.part(poly(pts), C.vest);
    F.part(line(cx + side * 3 + s, cy + 3, cx + side * 1 + s, cy + (f ? 12 : 14), 1), o.two ? C.trim : C.vestDk, flat);
    if (o.two) { // gold filigree: the panel's edge and a curl on it
      edge(F, [[cx + side * 1 + s, cy + (f ? 12 : 14)], [cx + side * 2 + s, cy + 24]], C.trim);
      const fx = side < 0 ? cx - 6 + s : R(cx + 6) + s;
      if (o.moon) { crescent(F, fx, cy + 11, C.navy, side); F.dot(fx, cy + 18, C.gem); } // crescents engraved, a blue gem
      else {
        edge(F, [[fx, cy + 9], [fx + side * 2, cy + 11], [fx, cy + 13], [fx - side, cy + 12]], C.trim);
        edge(F, [[fx, cy + 17], [fx + side * 2, cy + 19], [fx, cy + 21]], C.trim);
      }
    }
  }
  for (const y of f ? [14, 19] : [16, 20]) {
    F.part(line(cx - 3 + s, cy + y, cx + 3 + s, cy + y, 1), C.strap, flat);
    F.dot(cx + s, cy + y, C.buckle); F.dot(cx + 1 + s, cy + y, C.buckle);
  }
  // the quiver strap, from the right shoulder to the left hip
  F.part(line(cx - W + 3, cy + 3, R(cx + hip - 2), cy + 24, 2), C.strap, flat);
  F.dot(cx - 2 + s, cy + 13, C.buckle);
  // the tunic's collar
  F.part(ellipse(cx + s, cy + 2, 6, 2.5), C.tunic);
  F.part(line(cx - 4 + s, cy + 4, cx + 4 + s, cy + 4, 1), C.tunicDk, flat);
  // the belt, its buckle and pouches
  F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.strap);
  F.part(rect(cx - 1 + s, cy + 24, cx + 1 + s, cy + 26), C.buckle, soft);
  F.part(rect(cx - hip - 1, cy + 26, cx - hip + 3, cy + 31), C.vest);
  F.part(rect(R(cx + hip - 3), cy + 26, R(cx + hip + 1), cy + 30), C.vest);
  F.dot(cx - hip + 1, cy + 27, C.buckle);
  if (o.two) { pauldron(F, cx - W - 1, cy, C); pauldron(F, R(cx + W + 1), cy, C); } // silver on both shoulders
  else { // the leather guard on the bow (left) shoulder
    F.part(ellipse(R(cx + W + 1), cy + 6, 4.5, 3.5), C.vest);
    F.part(line(R(cx + W - 2), cy + 8, R(cx + W + 4), cy + 8, 1), C.vestDk, flat);
    F.dot(R(cx + W + 1), cy + 5, C.buckle);
  }
  arms(F, o, cx, cy, W, R, s, false);
  if (o.two) motes(F, cx, cy, W, o);
  return F;
}

// the arms, and the bow in the left hand: hanging at rest, raised and drawn while shooting.
// mirror: the back view (the bow hand on the viewer's left, mostly behind the body)
function arms(F, o, cx, cy, W, R, s, mirror) {
  const C = o.C, k = raised(), d = drawn();
  const bowX = mirror ? cx - W - 2 : R(cx + W + 2), drawX = mirror ? R(cx + W + 2) : cx - W - 2;
  const dir = mirror ? -1 : 1; // the bow hand's side
  // the bow: from hanging in the hand to held across the front, the belly towards you
  const bx = lerp(bowX, cx + dir * 6 + s, k), by = lerp(cy + 28, cy + 13, k);
  const ang = mirror ? lerp(-90, 30, k) : lerp(90, 150, k);
  // the drawing hand comes back to the right cheek (the viewer's left, from the front)
  const cheek = [lerp(bx - dir * 4, cx - dir * 5 + s, d), lerp(by - 5, cy + 3, d)];
  const pull = P.atk === LOOSE ? 0 : 2 + 6 * d;
  const hang = (x0, x1, top, bracer = true) => { // an arm hanging at the side
    F.part(rect(x0, top, x1, cy + 17), C.tunic);
    if (bracer) { F.part(rect(x0, cy + 17, x1, cy + 25), C.bracer); F.dot((x0 + x1) / 2, cy + 20, C.lace); F.dot((x0 + x1) / 2, cy + 23, C.lace); }
    F.part(ellipse((x0 + x1) / 2, cy + 28, 2.6, 2.4), C.skin);
  };
  const reach = (x0, y0, x1, y1) => { // an arm reaching from the shoulder (x0, y0) to the hand (x1, y1)
    const mx = lerp(x0, x1, 0.55), my = lerp(y0, y1, 0.55);
    F.part(line(x0, y0, mx, my, 4), C.tunic);
    F.part(line(mx, my, x1, y1, 4), C.bracer);
    F.part(ellipse(x1, y1, 2.4, 2.2), C.skin);
  };
  const shooting = P.atk >= 0;
  const hold = recurve(F, bx, by, ang, 18, C.bow, shooting ? pull : 0, shooting && d > 0, P.atk === LOOSE && !mirror, shooting && P.atk !== LOOSE ? cheek : null);
  // the bow arm
  if (!shooting) hang(bowX - 2, bowX + 2, cy + 8);
  else reach(mirror ? cx - W : R(cx + W), cy + 7, bx, by);
  // the drawing arm: at rest it hangs; shooting, the elbow lifts and the hand pulls the string to the chin
  if (!shooting) hang(drawX - 2, drawX + 2, cy + 8);
  else {
    const [hx, hy] = hold;
    const ex = drawX - dir * 2, ey = cy + 3;
    F.part(line(mirror ? R(cx + W) : cx - W, cy + 7, ex, ey, 4), C.tunic);
    F.part(line(ex, ey, hx, hy, 4), C.bracer);
    F.part(ellipse(hx, hy, 2.4, 2.2), C.skin);
  }
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C;
  const R = (v) => v - r;
  // shooting, the bow is in front of the body: drawn first, only its tips show past the shoulders
  if (P.atk >= 0) arms(F, o, cx, cy, W, R, s, true);
  legs(F, o, cx, cy, r, 0);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.tunic);
  F.part(poly([[cx - hip, cy + 26], [R(cx + hip), cy + 26], [R(cx + hip + 2), cy + hem], [cx - hip - 2, cy + hem]]), C.coat || C.tunic);
  F.part(line(cx - hip - 1, cy + hem, R(cx + hip + 1), cy + hem, 1), o.two ? C.trim : C.tunicDk, flat);
  // the vest's back
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W), cy + 8], [R(cx + waist), cy + 24], [cx - waist, cy + 24], [cx - W, cy + 8]]), C.vest);
  F.part(line(cx + s, cy + 6, cx + s, cy + 23, 1), C.vestDk, flat);
  // the belt and the bedroll strapped across the back of it (the Windrunner: the long teal cape)
  F.part(rect(cx - hip, cy + 24, R(cx + hip), cy + 26), C.strap);
  if (o.two) {
    const hemPts = [[R(cx + W + 6), cy + 54], [R(cx + 5), cy + 52], [cx + s, cy + 56], [cx - 5 + s, cy + 52], [cx - W - 6, cy + 54]];
    F.part(poly([[cx - W, cy + 2], [R(cx + W), cy + 2], [R(cx + W + 3), cy + 12], ...hemPts, [cx - W - 3, cy + 12]]), C.cape);
    edge(F, hemPts, C.trim);
    if (o.moon) starryCape(F, hemPts, cx - W + 1, R(cx + W - 1), cy + 8, cy + 50, C);
    else for (const x of [-6, 6 - r]) F.part(line(cx + x + s, cy + 16, cx + x * 1.4 + s, cy + 50, 1), C.capeDk, flat);
  } else {
    F.part(rect(cx - hip - 1, cy + 26, R(cx + hip + 1), cy + 31), C.roll);
    F.part(ellipse(cx - hip - 1, cy + 28.5, 1.5, 2.5), C.roll);
    for (const x of [cx - 4 + s, cx + 4 + s]) F.part(line(x, cy + 25, x, cy + 31, 1), C.strap, flat);
  }
  // the quiver, from the right shoulder down to the left hip, its arrows' feathers out of the top
  F.part(poly([[R(cx + W - 1), cy - 3], [R(cx + W + 4), cy - 1], [cx - 4 + s, cy + 24], [cx - 8 + s, cy + 22]]), C.quiver);
  F.part(line(R(cx + W - 1), cy - 3, R(cx + W + 4), cy - 1, 1), C.strap, flat);
  F.part(line(cx - 1 + s, cy + 10, cx + 3 + s, cy + 12, 1), C.strap, flat);
  F.part(line(cx - 5 + s, cy + 18, cx - 1 + s, cy + 20, 1), C.strap, flat);
  C.feathers.forEach((c, i) => { const x = R(cx + W - 1) + i * 2, y = cy - 4 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  // the shoulder guard (the left shoulder, on this side from behind); the Windrunner's silver pair
  if (o.two) { pauldron(F, cx - W - 1, cy, C); pauldron(F, R(cx + W + 1), cy, C); }
  else { F.part(ellipse(cx - W - 1, cy + 6, 4.5, 3.5), C.vest); F.dot(cx - W - 1, cy + 5, C.buckle); }
  if (P.atk < 0) arms(F, o, cx, cy, W, R, s, true);
  else { // the drawing arm, elbow out to the right, over the body
    const ex = R(cx + W + 5), ey = cy + 4;
    F.part(line(R(cx + W), cy + 7, ex, ey, 4), C.tunic);
    F.part(line(ex, ey, cx + 4 + s, cy + 6, 4), C.bracer);
  }
  if (o.two) motes(F, cx, cy, W, o);
  void f;
  return F;
}

// facing right: the bow in the far (left) hand, raised in front to shoot
function side(F, o, cx, cy) {
  const { f, knee, hem } = build(o), C = o.C, k = raised(), d = drawn(), shooting = P.atk >= 0;
  const cy0 = cy - P.bob;
  const leg = (x) => {
    F.part(rect(x - 3, cy0 + 30, x + 2, cy0 + 58), C.pants);
    F.part(rect(x - 4, cy0 + knee - 1, x + 3, cy0 + 58), C.boot);
    F.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
    if (o.two) {
      F.part(line(x - 4, cy0 + knee - 1, x + 3, cy0 + knee - 1, 1), C.trim, flat);
      F.part(poly([[x + 2, cy0 + knee - 3], [x + 5, cy0 + knee + 1], [x + 2, cy0 + knee + 5]]), C.trim);
      return;
    }
    F.part(rect(x - 4, cy0 + knee - 1, x + 3, cy0 + knee), C.vestDk, soft);
    for (let y = cy0 + knee + 3; y < cy0 + 56; y += 3) F.dot(x + 2, y, C.lace);
  };
  if (o.two) { // the cape streaming out behind
    const pts = [[cx - 4, cy + 2], [cx - 9, cy0 + 8], [cx - 17, cy0 + 38], [cx - 21, cy0 + 54], [cx - 12, cy0 + 51], [cx - 5, cy0 + 30]];
    F.part(poly(pts), C.cape);
    edge(F, pts.slice(2, 5), C.trim);
    if (o.moon) for (const [x, y] of [[-9, 18], [-12, 30], [-15, 42], [-11, 48], [-8, 26]]) F.dot(cx + x, cy0 + y, C.ribbon);
    else F.part(line(cx - 8, cy0 + 12, cx - 14, cy0 + 46, 1), C.capeDk, flat);
  }
  // the quiver on the back, tilted, feathers over the shoulder
  F.part(poly([[cx - 7, cy - 3], [cx - 3, cy - 5], [cx - 6, cy + 20], [cx - 10, cy + 19]]), C.quiver);
  C.feathers.forEach((c, i) => { const x = cx - 6 + i * 2, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  // the far arm and the bow, at rest hanging in front of the body
  const bx = lerp(cx + 8, cx + 17, k), by = lerp(cy + 27, cy + 8, k);
  if (!shooting) {
    recurve(F, bx, by, 95, 18, C.bow);
  }
  leg(cx - 2 - Math.round(3 * P.step)); // the far leg, then the near one, striding
  leg(cx + 2 + Math.round(3 * P.step));
  // the tunic's skirt and the body
  F.part(poly([[cx - 6, cy + 26], [cx + 6, cy + 26], [cx + 8, cy + hem], [cx - 8, cy + hem]]), C.coat || C.tunic);
  F.part(line(cx - 8, cy + hem, cx + 8, cy + hem, 1), o.two ? C.trim : C.tunicDk, flat);
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), C.tunic);
  // the vest over it, open at the front
  F.part(poly([[cx - 7, cy + 3], [cx + 3, cy + 3], [cx + 5, cy + (f ? 12 : 10)], [cx + 4, cy + 24], [cx - 6, cy + 24], [cx - 8, cy + 8]]), C.vest);
  F.part(line(cx + 3, cy + 3, cx + 4, cy + 23, 1), o.two ? C.trim : C.vestDk, flat);
  if (o.two) edge(F, [[cx - 3, cy + 9], [cx - 1, cy + 11], [cx - 3, cy + 13], [cx - 4, cy + 12]], C.trim);
  F.part(line(cx + 4, cy + 16, cx + 6, cy + 16, 1), C.strap, flat); F.dot(cx + 5, cy + 16, C.buckle);
  // the belt, a pouch and the bedroll's end at the back
  F.part(rect(cx - 6, cy + 24, cx + 6, cy + 26), C.strap);
  F.part(rect(cx + 2, cy + 26, cx + 5, cy + 30), C.vest);
  if (!o.two) {
    F.part(ellipse(cx - 7, cy + 28, 3, 3), C.roll);
    F.part(ellipse(cx - 7, cy + 28, 1.2, 1.2), C.vestDk, flat);
  }
  F.part(ellipse(cx + 1, cy + 2, 5, 2.5), C.tunic); // the collar
  if (o.two) pauldron(F, cx - 1, cy, C);
  // shooting: the bow held out in front at the shoulder, the near hand drawing the string back
  if (shooting) {
    const pull = P.atk === LOOSE ? 0 : 2 + 9 * d;
    F.part(line(cx + 1, cy + 7, bx - 1, by, 4), C.tunic); // the bow arm, reaching forward
    F.part(line(lerp(cx + 1, bx, 0.55), lerp(cy + 7, by, 0.55), bx - 1, by, 4), C.bracer);
    const [hx, hy] = recurve(F, bx, by, 95, 18, C.bow, pull, d > 0 && P.atk !== LOOSE, P.atk === LOOSE);
    F.part(ellipse(bx, by, 2.2, 2.2), C.skin);
    const ex = lerp(cx, cx - 5, d), ey = cy + 6;
    F.part(line(cx - 1, cy + 6, ex, ey, 4), C.tunic);
    F.part(line(ex, ey, hx, hy, 4), C.bracer);
    F.part(ellipse(hx, hy, 2.4, 2.2), C.skin);
    if (o.two) motes(F, cx - 2, cy, 8, o);
    return F;
  }
  // the near arm hanging, a bracer on the forearm
  F.part(rect(cx - 3, cy + 6, cx + 1, cy + 17), C.tunic);
  F.part(rect(cx - 3, cy + 17, cx + 1, cy + 25), C.bracer);
  F.dot(cx - 1, cy + 20, C.lace); F.dot(cx - 1, cy + 23, C.lace);
  F.part(ellipse(cx, cy + 28, 2.6, 2.6), C.skin);
  if (o.two) motes(F, cx - 2, cy, 8, o);
  void f;
  return F;
}

// one design's painter for a pose (design-anim.js): (view, cx, cy, pose) -> Frame
export const drawArcher = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(ARCHERS[id], view, cx, cy); } finally { P = REST; } };
export const animArcher = (id, heads) => animFrames(VIEWS, heads, BW, drawArcher(id));
