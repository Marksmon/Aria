// Sprite designs for the Archer, male and female, painted in code like the Blader designs
// (bladers.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md). After the owner's sheet: a brown leather vest with straps and
// buckles over a green tunic, a leather guard on the bow shoulder, laced leather bracers, a belt with
// pouches and a bedroll at the back, a quiver of red- and white-feathered arrows on the back, and a
// recurve bow in the left hand. He wears dark trousers and tall laced boots; she wears a blue crop
// top under a laced leather corset, her midriff bare, short leather shorts and laced boots over the
// knee. Standing, walking (8 frames) and shooting (7: the bow raised, the string drawn to the chin,
// the arrow loosed, the bow lowered), 8 directions: the left ones are the right ones mirrored.
// (The second jobs, Windrunner and Moon Ranger, are rangers.js.)
// The game paints the hero's body from these (sprites.js designSet). Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SHOOT, LOOSE, recurve, animFrames, VIEWS } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const ARCHER = {
  tunic: '#4f7a3a', tunicDk: '#3a5c2a', vest: '#7a4a2a', vestDk: '#5c3620', strap: '#4a2e1c', buckle: '#d4ac54',
  pants: '#3a3430', shorts: '#5c3a22', boot: '#5e3b22', lace: '#c8a878', bracer: '#6a4024', skin: '#f2c8a2', roll: '#a8946a',
  quiver: '#6b4424', feathers: ['#f4ecd8', '#c8463c', '#f4ecd8'],
  bow: { wood: '#8a5a2a', light: '#c89a5a', grip: '#4a2e1c', string: '#efe8d8', arrow: '#d8c8a0', tip: '#b8bec8', fletch: '#c8463c' },
};
export const ARCHERS = {
  archerM: { name: 'Archer', sex: 'm', C: ARCHER },
  archerF: { name: 'Archer', sex: 'f', C: { ...ARCHER, tunic: '#3f6aa8', tunicDk: '#2f4f86' } },
};

const flat = { outline: false, flat: true }; // a trim's line: no outline or shading
const soft = { outline: false };             // shaded, but no outline (a panel inside a part)
let P = REST; // the pose being painted (design-anim.js): its step, bob and attack frame
const lerp = (a, b, k) => a + (b - a) * k;
// how far into the shot: the bow raised (0 at rest .. 1 aimed) and the string drawn (0 .. 1)
const raised = () => (P.atk >= 0 ? SHOOT.raise[P.atk] : 0);
const drawn = () => (P.atk >= 0 ? SHOOT.draw[P.atk] : 0);

// the build: shoulders, waist and hips (half widths), the legs; knee: where the boots start, hem:
// where his tunic ends, shorts: where hers end, crop: where her crop top ends (below the chin)
function build(o) {
  const f = o.sex === 'f';
  return f ? { f, W: 10, waist: 6, hip: 10, legs: [[-6, -2], [2, 6]], knee: 37, hem: 30, crop: 15 }
    : { f, W: 12, waist: 9, hip: 9, legs: [[-7, -2], [2, 7]], knee: 41, hem: 37 };
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
    F.part(rect(cx + a + sh, cy + 28, cx + b + sh, cyl + 58), f ? C.skin : C.pants); // her bare thighs
    F.part(rect(cx + a - 1 + sh, cyl + knee - 1, cx + b + 1 + sh, cyl + 58), C.boot);
    F.part(rect(cx + a - 1 + sh, cyl + knee - 1, cx + b + 1 + sh, cyl + knee), C.vestDk, soft); // the folded cuff
    F.part(ellipse(cx + (a + b) / 2 + toe + sh + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    const mid = cx + (a + b) / 2 + sh;
    for (let y = cyl + knee + 3; y < cyl + 56; y += 3) { F.dot(mid - 1, y, C.lace); F.dot(mid + 1, y + 1, C.lace); } // the laces
  });
}

// the quiver's feathers over the right shoulder (front views)
function quiverFront(F, cx, cy, W, C) {
  F.part(poly([[cx - W - 1, cy - 3], [cx - W + 3, cy - 5], [cx - W + 5, cy + 4], [cx - W + 1, cy + 5]]), C.quiver);
  C.feathers.forEach((c, i) => { const x = cx - W - 1 + i * 1.5, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 3, 1), c, flat); });
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem, crop } = build(o), C = o.C;
  const R = (v) => v - r; // a point on the far (viewer's right) side
  quiverFront(F, cx, cy, W, C);
  legs(F, o, cx, cy, r, s);
  if (f) {
    // her short leather shorts, the bare midriff, the crop top and the laced corset over it
    F.part(poly([[cx - hip, cy + 23], [R(cx + hip), cy + 23], [R(cx + hip + 1), cy + hem], [cx + 1 + s, cy + hem], [cx + s, cy + hem - 3], [cx - 1 + s, cy + hem], [cx - hip - 1, cy + hem]]), C.shorts);
    F.part(poly([[cx - waist, cy + crop - 1], [R(cx + waist), cy + crop - 1], [R(cx + hip - 1), cy + 24], [cx - hip + 1, cy + 24]]), C.skin);
    F.dot(cx + s, cy + 19, '#c89a78'); // the navel
    F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist + 1), cy + crop], [cx - waist - 1, cy + crop], [cx - W - 1, cy + 8]]), C.tunic);
    F.part(poly([[cx - 4 + s, cy + 2], [cx + 4 + s, cy + 2], [cx + s, cy + 8]]), C.skin); // the neckline
    for (const side of [-1, 1]) { // the corset's two panels, laced up the middle
      const o0 = side < 0 ? cx - waist - 1 : R(cx + waist + 1);
      F.part(poly([[cx + side * 3 + s, cy + 8], [cx + side * 7 + s, cy + 7], [o0, cy + crop + 1], [cx + side * 1 + s, cy + crop + 1]]), C.vest);
    }
    for (let y = 9; y <= crop; y += 2) { F.dot(cx - 1 + s, y + cy, C.lace); F.dot(cx + 1 + s, y + cy + 1, C.lace); }
    F.part(line(cx - 5 + s, cy + 10, cx - 1 + s, cy + 11, 1), C.tunicDk, flat); // the bust's shading
    F.part(line(cx + 1 + s, cy + 11, cx + 5 + s, cy + 10, 1), C.tunicDk, flat);
  } else {
    // his tunic: body, and its skirt split at the front; the leather vest open in a V, buckled straps across
    F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.tunic);
    F.part(poly([[cx - hip, cy + 26], [R(cx + hip), cy + 26], [R(cx + hip + 2), cy + hem], [cx + 1 + s, cy + hem], [cx + s, cy + hem - 4], [cx - 1 + s, cy + hem], [cx - hip - 2, cy + hem]]), C.tunic);
    F.part(line(cx - hip - 1, cy + hem, cx - 1 + s, cy + hem, 1), C.tunicDk, flat);
    F.part(line(cx + 1 + s, cy + hem, R(cx + hip + 1), cy + hem, 1), C.tunicDk, flat);
    for (const side of [-1, 1]) {
      const o0 = side < 0 ? cx - W : R(cx + W), w0 = side < 0 ? cx - waist : R(cx + waist);
      F.part(poly([[o0, cy + 3], [cx + side * 3 + s, cy + 3], [cx + side * 1 + s, cy + 14], [cx + side * 2 + s, cy + 24], [w0 - side, cy + 24], [w0, cy + 20], [o0 + side, cy + 8]]), C.vest);
      F.part(line(cx + side * 3 + s, cy + 3, cx + side * 1 + s, cy + 14, 1), C.vestDk, flat);
    }
    for (const y of [16, 20]) { F.part(line(cx - 3 + s, cy + y, cx + 3 + s, cy + y, 1), C.strap, flat); F.dot(cx + s, cy + y, C.buckle); F.dot(cx + 1 + s, cy + y, C.buckle); }
    F.part(ellipse(cx + s, cy + 2, 6, 2.5), C.tunic); // the collar
    F.part(line(cx - 4 + s, cy + 4, cx + 4 + s, cy + 4, 1), C.tunicDk, flat);
  }
  // the quiver strap, from the right shoulder to the left hip
  F.part(line(cx - W + 3, cy + 3, R(cx + hip - 2), cy + 23, 2), C.strap, flat);
  F.dot(cx - 2 + s, cy + 13, C.buckle);
  // the belt, its buckle and pouches
  F.part(rect(cx - hip, cy + 22, R(cx + hip), cy + 24), C.strap);
  F.part(rect(cx - 1 + s, cy + 22, cx + 1 + s, cy + 24), C.buckle, soft);
  F.part(rect(cx - hip - 1, cy + 24, cx - hip + 3, cy + 29), C.vest);
  if (!f) F.part(rect(R(cx + hip - 3), cy + 24, R(cx + hip + 1), cy + 28), C.vest);
  F.dot(cx - hip + 1, cy + 25, C.buckle);
  // the leather guard on the bow (left) shoulder
  F.part(ellipse(R(cx + W + 1), cy + 6, 4.5, 3.5), C.vest);
  F.part(line(R(cx + W - 2), cy + 8, R(cx + W + 4), cy + 8, 1), C.vestDk, flat);
  F.dot(R(cx + W + 1), cy + 5, C.buckle);
  arms(F, o, cx, cy, W, R, s, false);
  return F;
}

// the arms, and the bow in the left hand: hanging at rest, raised and drawn while shooting.
// mirror: the back view (the bow hand on the viewer's left, mostly behind the body)
function arms(F, o, cx, cy, W, R, s, mirror) {
  const C = o.C, f = o.sex === 'f', k = raised(), d = drawn();
  const bowX = mirror ? cx - W - 2 : R(cx + W + 2), drawX = mirror ? R(cx + W + 2) : cx - W - 2;
  const dir = mirror ? -1 : 1; // the bow hand's side
  // the bow: from hanging in the hand to held across the front, the belly towards you
  const bx = lerp(bowX, cx + dir * 6 + s, k), by = lerp(cy + 28, cy + 13, k);
  const ang = mirror ? lerp(-90, 30, k) : lerp(90, 150, k);
  // the drawing hand comes back to the right cheek (the viewer's left, from the front)
  const cheek = [lerp(bx - dir * 4, cx - dir * 5 + s, d), lerp(by - 5, cy + 3, d)];
  const pull = P.atk === LOOSE ? 0 : 2 + 6 * d;
  const hang = (x0, x1, top) => { // an arm hanging at the side: her short sleeves leave the arm bare
    F.part(rect(x0, top, x1, cy + 17), f ? C.skin : C.tunic);
    if (f) F.part(rect(x0, top, x1, cy + 11), C.tunic);
    F.part(rect(x0, cy + 17, x1, cy + 25), C.bracer); F.dot((x0 + x1) / 2, cy + 20, C.lace); F.dot((x0 + x1) / 2, cy + 23, C.lace);
    F.part(ellipse((x0 + x1) / 2, cy + 28, 2.6, 2.4), C.skin);
  };
  const upper = f ? C.skin : C.tunic;
  const reach = (x0, y0, x1, y1) => { // an arm reaching from the shoulder (x0, y0) to the hand (x1, y1)
    const mx = lerp(x0, x1, 0.55), my = lerp(y0, y1, 0.55);
    F.part(line(x0, y0, mx, my, 4), upper);
    F.part(line(mx, my, x1, y1, 4), C.bracer);
    F.part(ellipse(x1, y1, 2.4, 2.2), C.skin);
  };
  const shooting = P.atk >= 0;
  const hold = recurve(F, bx, by, ang, 18, C.bow, shooting ? pull : 0, shooting && d > 0, P.atk === LOOSE && !mirror, shooting && P.atk !== LOOSE ? cheek : null);
  if (!shooting) { hang(bowX - 2, bowX + 2, cy + 8); hang(drawX - 2, drawX + 2, cy + 8); return; }
  reach(mirror ? cx - W : R(cx + W), cy + 7, bx, by); // the bow arm
  // the drawing arm: the elbow lifts and the hand pulls the string to the chin
  const [hx, hy] = hold, ex = drawX - dir * 2, ey = cy + 3;
  F.part(line(mirror ? R(cx + W) : cx - W, cy + 7, ex, ey, 4), upper);
  F.part(line(ex, ey, hx, hy, 4), C.bracer);
  F.part(ellipse(hx, hy, 2.4, 2.2), C.skin);
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem, crop } = build(o), C = o.C;
  const R = (v) => v - r;
  // shooting, the bow is in front of the body: drawn first, only its tips show past the shoulders
  if (P.atk >= 0) arms(F, o, cx, cy, W, R, s, true);
  legs(F, o, cx, cy, r, 0);
  if (f) {
    F.part(poly([[cx - hip, cy + 23], [R(cx + hip), cy + 23], [R(cx + hip + 1), cy + hem], [cx - hip - 1, cy + hem]]), C.shorts);
    F.part(poly([[cx - waist, cy + crop - 1], [R(cx + waist), cy + crop - 1], [R(cx + hip - 1), cy + 24], [cx - hip + 1, cy + 24]]), C.skin);
    F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist + 1), cy + crop], [cx - waist - 1, cy + crop], [cx - W - 1, cy + 8]]), C.tunic);
    F.part(poly([[cx - W + 1, cy + 6], [R(cx + W - 1), cy + 6], [R(cx + waist + 1), cy + crop + 1], [cx - waist - 1, cy + crop + 1]]), C.vest); // the corset's back
    for (let y = 8; y <= crop; y += 2) F.part(line(cx - 2 + s, cy + y, cx + 2 + s, cy + y + 1, 1), C.lace, flat);
  } else {
    F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.tunic);
    F.part(poly([[cx - hip, cy + 26], [R(cx + hip), cy + 26], [R(cx + hip + 2), cy + hem], [cx - hip - 2, cy + hem]]), C.tunic);
    F.part(line(cx - hip - 1, cy + hem, R(cx + hip + 1), cy + hem, 1), C.tunicDk, flat);
    F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W), cy + 8], [R(cx + waist), cy + 24], [cx - waist, cy + 24], [cx - W, cy + 8]]), C.vest); // the vest's back
    F.part(line(cx + s, cy + 6, cx + s, cy + 23, 1), C.vestDk, flat);
  }
  // the belt and the bedroll strapped across the back of it
  F.part(rect(cx - hip, cy + 22, R(cx + hip), cy + 24), C.strap);
  F.part(rect(cx - hip - 1, cy + 24, R(cx + hip + 1), cy + 28), C.roll);
  F.part(ellipse(cx - hip - 1, cy + 26, 1.5, 2.2), C.roll);
  for (const x of [cx - 4 + s, cx + 4 + s]) F.part(line(x, cy + 23, x, cy + 28, 1), C.strap, flat);
  // the quiver, from the right shoulder down to the left hip, its arrows' feathers out of the top
  F.part(poly([[R(cx + W - 1), cy - 3], [R(cx + W + 4), cy - 1], [cx - 4 + s, cy + 22], [cx - 8 + s, cy + 20]]), C.quiver);
  F.part(line(R(cx + W - 1), cy - 3, R(cx + W + 4), cy - 1, 1), C.strap, flat);
  F.part(line(cx - 1 + s, cy + 10, cx + 3 + s, cy + 12, 1), C.strap, flat);
  F.part(line(cx - 5 + s, cy + 17, cx - 1 + s, cy + 19, 1), C.strap, flat);
  C.feathers.forEach((c, i) => { const x = R(cx + W - 1) + i * 2, y = cy - 4 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  // the shoulder guard (the left shoulder, on this side from behind)
  F.part(ellipse(cx - W - 1, cy + 6, 4.5, 3.5), C.vest);
  F.dot(cx - W - 1, cy + 5, C.buckle);
  if (P.atk < 0) arms(F, o, cx, cy, W, R, s, true);
  else { // the drawing arm, elbow out to the right, over the body
    const ex = R(cx + W + 5), ey = cy + 4;
    F.part(line(R(cx + W), cy + 7, ex, ey, 4), f ? C.skin : C.tunic);
    F.part(line(ex, ey, cx + 4 + s, cy + 6, 4), C.bracer);
  }
  return F;
}

// facing right: the bow in the far (left) hand, raised in front to shoot
function side(F, o, cx, cy) {
  const { f, knee, hem, crop } = build(o), C = o.C, k = raised(), d = drawn(), shooting = P.atk >= 0;
  const cy0 = cy - P.bob;
  const leg = (x) => {
    F.part(rect(x - 3, cy0 + 28, x + 2, cy0 + 58), f ? C.skin : C.pants);
    F.part(rect(x - 4, cy0 + knee - 1, x + 3, cy0 + 58), C.boot);
    F.part(rect(x - 4, cy0 + knee - 1, x + 3, cy0 + knee), C.vestDk, soft);
    F.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
    for (let y = cy0 + knee + 3; y < cy0 + 56; y += 3) F.dot(x + 2, y, C.lace);
  };
  // the quiver on the back, tilted, feathers over the shoulder
  F.part(poly([[cx - 7, cy - 3], [cx - 3, cy - 5], [cx - 6, cy + 20], [cx - 10, cy + 19]]), C.quiver);
  C.feathers.forEach((c, i) => { const x = cx - 6 + i * 2, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  // the far arm and the bow, at rest hanging in front of the body
  const bx = lerp(cx + 8, cx + 17, k), by = lerp(cy + 27, cy + 8, k);
  if (!shooting) recurve(F, bx, by, 95, 18, C.bow);
  leg(cx - 2 - Math.round(3 * P.step)); // the far leg, then the near one, striding
  leg(cx + 2 + Math.round(3 * P.step));
  if (f) {
    F.part(poly([[cx - 7, cy + 23], [cx + 6, cy + 23], [cx + 7, cy + hem], [cx - 7, cy + hem]]), C.shorts);
    F.part(rect(cx - 5, cy + crop - 1, cx + 5, cy + 23), C.skin);
    F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + 8, cy + 10], [cx + 6, cy + crop], [cx - 6, cy + crop], [cx - 8, cy + 8]]), C.tunic);
    F.part(poly([[cx - 6, cy + 7], [cx + 6, cy + 9], [cx + 6, cy + crop + 1], [cx - 6, cy + crop + 1]]), C.vest);
    for (let y = 9; y <= crop; y += 2) F.dot(cx + 6, cy + y, C.lace);
  } else {
    F.part(poly([[cx - 6, cy + 26], [cx + 6, cy + 26], [cx + 8, cy + hem], [cx - 8, cy + hem]]), C.tunic);
    F.part(line(cx - 8, cy + hem, cx + 8, cy + hem, 1), C.tunicDk, flat);
    F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + 7, cy + 8], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), C.tunic);
    F.part(poly([[cx - 7, cy + 3], [cx + 3, cy + 3], [cx + 5, cy + 10], [cx + 4, cy + 24], [cx - 6, cy + 24], [cx - 8, cy + 8]]), C.vest);
    F.part(line(cx + 3, cy + 3, cx + 4, cy + 23, 1), C.vestDk, flat);
    F.part(line(cx + 4, cy + 16, cx + 6, cy + 16, 1), C.strap, flat); F.dot(cx + 5, cy + 16, C.buckle);
    F.part(ellipse(cx + 1, cy + 2, 5, 2.5), C.tunic); // the collar
  }
  // the belt, a pouch and the bedroll's end at the back
  F.part(rect(cx - 6, cy + 22, cx + 6, cy + 24), C.strap);
  F.part(rect(cx + 2, cy + 24, cx + 5, cy + 28), C.vest);
  F.part(ellipse(cx - 7, cy + 26, 3, 3), C.roll);
  F.part(ellipse(cx - 7, cy + 26, 1.2, 1.2), C.vestDk, flat);
  const upper = f ? C.skin : C.tunic;
  // shooting: the bow held out in front at the shoulder, the near hand drawing the string back
  if (shooting) {
    const pull = P.atk === LOOSE ? 0 : 2 + 9 * d;
    F.part(line(cx + 1, cy + 7, bx - 1, by, 4), upper); // the bow arm, reaching forward
    F.part(line(lerp(cx + 1, bx, 0.55), lerp(cy + 7, by, 0.55), bx - 1, by, 4), C.bracer);
    const [hx, hy] = recurve(F, bx, by, 95, 18, C.bow, pull, d > 0 && P.atk !== LOOSE, P.atk === LOOSE);
    F.part(ellipse(bx, by, 2.2, 2.2), C.skin);
    const ex = lerp(cx, cx - 5, d), ey = cy + 6;
    F.part(line(cx - 1, cy + 6, ex, ey, 4), upper);
    F.part(line(ex, ey, hx, hy, 4), C.bracer);
    F.part(ellipse(hx, hy, 2.4, 2.2), C.skin);
    return F;
  }
  // the near arm hanging, a bracer on the forearm
  F.part(rect(cx - 3, cy + 6, cx + 1, cy + 17), upper);
  if (f) F.part(rect(cx - 3, cy + 6, cx + 1, cy + 11), C.tunic);
  F.part(rect(cx - 3, cy + 17, cx + 1, cy + 25), C.bracer);
  F.dot(cx - 1, cy + 20, C.lace); F.dot(cx - 1, cy + 23, C.lace);
  F.part(ellipse(cx, cy + 28, 2.6, 2.6), C.skin);
  return F;
}

// one design's painter for a pose (design-anim.js): (view, cx, cy, pose) -> Frame
export const drawArcher = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(ARCHERS[id], view, cx, cy); } finally { P = REST; } };
export const animArcher = (id, heads) => animFrames(VIEWS, heads, BW, drawArcher(id));
