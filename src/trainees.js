// Sprite designs for the Trainee, male and female, painted in code like the job designs (bladers.js)
// on the bald bodies' frame, so the shared head and hair go on top (docs/character-standard.md).
// After the owner's Trainee sheet, in brown where the sheet has blue: a brown vest with a small steel chestplate over a white shirt with
// rolled sleeves and a pointed collar, black leather shoulder straps, belts and a satchel at the hip,
// fingerless gloves with bracers; on him baggy dark trousers tucked into tall cuffed boots and a brown
// front panel with the compass star; on her the shirt knotted above a bare midriff under a cropped
// vest, a short brown skirt over white, a thigh strap and boots over the knee. The sheet has no weapon, so the owner gave the Trainee a dagger.
// Standing, walking (8 frames) and attacking (7: a dagger slash), 8 directions: the left ones are the
// right ones mirrored. The game paints the hero's body from these (sprites.js designSet). Plain
// canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SWING, SLASH, behind, swordArm, slashArc, animFrames, VIEWS } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const C = {
  vest: '#8a5a34', vestLt: '#a8744a', shirt: '#efe9de', shirtDk: '#cfc6b6', steel: '#b9bec8', leather: '#2c272d',
  strap: '#17141a', pants: '#2b2730', boot: '#4a2e1f', trim: '#c9a24a', skin: '#f2c8a2', glove: '#3a2a22',
  blade: '#d8dce4', edge: '#ffffff', emblem: '#f1e3c4',
};
export const TRAINEES = { traineeM: { name: 'Trainee', sex: 'm' }, traineeF: { name: 'Trainee', sex: 'f' } };

const flat = { outline: false, flat: true }; // a trim's line: no outline or shading
const soft = { outline: false };             // shaded, but no outline (a panel inside a part)
let P = REST; // the pose being painted (design-anim.js): its step, bob and attack frame

function build(o) {
  const f = o.sex === 'f';
  return { f, W: f ? 10 : 11, waist: f ? 6 : 9, hip: f ? 10 : 9, knee: f ? 39 : 43, crop: 15 };
}

// the compass star, small, in cream on the brown
function star(F, x, y) {
  F.part(poly([[x, y - 3], [x + 1, y - 1], [x + 3, y], [x + 1, y + 1], [x, y + 3], [x - 1, y + 1], [x - 3, y], [x - 1, y - 1]]), C.emblem, flat);
}

// the dagger held low in the hand at (x, y), pointing down and out
function dagger(F, x, y, dir) {
  F.part(line(x, y + 2, x + dir * 3, y + 10, 2), C.blade);
  F.part(line(x + dir, y + 4, x + dir * 3, y + 10, 1), C.edge, flat);
  F.part(line(x - 3, y + 1, x + 3, y + 2, 1), C.trim, flat); // the guard
}

// the arm swinging the dagger from the shoulder (x, y); mirror: the back view
function slash(F, x, y, view, mirror = false) {
  let [a, b] = SWING[view][P.atk];
  if (mirror) { a = 180 - a; b = 180 - b; }
  swordArm(F, x, y, a, b, { sleeve: C.skin, glove: C.glove, blade: C.blade, edge: C.edge, guard: C.trim }, 14, 9);
  F.part(ellipse(x, y + 1, 3.2, 3), C.shirt); // the rolled sleeve at the shoulder
  if (P.atk === SLASH) slashArc(F, x, y, 21, mirror ? 140 : view === 'side' ? -40 : -60, mirror ? 30 : view === 'side' ? 50 : 40, '#ffffff', '#c8d0dc');
}

function legs(F, o, cx, cy, r, toe) {
  cy -= P.bob; // the feet stay on the ground while the body sinks
  const { f, knee } = build(o);
  [[-7, -2], [2, 7]].forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0, mid = cx + (a + b) / 2 + sh;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * 2); // the stepping leg lifts
    if (f) F.part(rect(cx + a + sh, cy + 30, cx + b + sh, cyl + 58), C.skin); // bare legs to the boots
    else F.part(rect(cx + a - 1 + sh, cy + 30, cx + b + 1 + sh, cyl + knee + 2), C.pants); // baggy trousers
    F.part(rect(cx + a - (f ? 0 : 1) + sh, cyl + knee, cx + b + (f ? 0 : 1) + sh, cyl + 58), C.boot);
    F.part(rect(cx + a - (f ? 1 : 2) + sh, cyl + knee, cx + b + (f ? 1 : 2) + sh, cyl + knee + 2), C.boot); // the folded cuff
    F.part(line(cx + a - (f ? 1 : 2) + sh, cyl + knee, cx + b + (f ? 1 : 2) + sh, cyl + knee, 1), C.trim, flat);
    F.part(line(cx + a + sh, cyl + 51, cx + b + sh, cyl + 51, 1), C.strap, flat); // a buckled strap
    F.dot(mid, cyl + 51, C.trim);
    F.part(ellipse(mid + toe + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    if (f && i === 0) F.part(line(cx + a + sh, cy + 35, cx + b + sh, cy + 35, 1), C.strap, flat); // the thigh strap
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

// one arm hanging: a rolled white sleeve to the elbow, the bare forearm, a bracer and a fingerless
// glove. x0..x1: its columns; side: -1 on the viewer's left. Returns the hand
function arm(F, x0, x1, cy, side) {
  F.part((set) => { ellipse((x0 + x1) / 2, cy + 7, 3.4, 3.5)(set); rect(x0 - (side < 0 ? 1 : 0), cy + 7, x1 + (side > 0 ? 1 : 0), cy + 14)(set); }, C.shirt);
  F.part(line(x0 - (side < 0 ? 1 : 0), cy + 13, x1 + (side > 0 ? 1 : 0), cy + 13, 1), C.shirtDk, flat); // the roll
  F.part(rect(x0, cy + 15, x1, cy + 20), C.skin);
  F.part(rect(x0, cy + 21, x1, cy + 25), C.leather); // the bracer
  F.part(line(x0, cy + 23, x1, cy + 23, 1), C.strap, flat);
  const hx = (x0 + x1) / 2;
  F.part(ellipse(hx, cy + 27.5, 2.7, 2.5), C.glove);
  F.dot(hx + side, cy + 29, C.skin);
  return [hx, cy + 27];
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, crop } = build(o);
  const R = (v) => v - r;
  legs(F, o, cx, cy, r, s);

  // the shirt under the vest; below the belt the shirt's tail (him), or her bare midriff over the
  // white underskirt
  if (f) {
    F.part(poly([[cx - hip, cy + 24], [R(cx + hip), cy + 24], [R(cx + hip + 3), cy + 33], [cx - hip - 3, cy + 33]]), C.shirt); // the white underskirt
    F.part(poly([[cx - hip, cy + 24], [R(cx + hip), cy + 24], [R(cx + hip + 2), cy + 31], [cx - hip - 2, cy + 31]]), C.vest); // the brown skirt
    F.part(line(cx - hip - 2, cy + 31, R(cx + hip + 2), cy + 31, 1), C.trim, flat);
    F.part(poly([[cx - waist, cy + crop - 1], [R(cx + waist), cy + crop - 1], [R(cx + hip - 1), cy + 24], [cx - hip + 1, cy + 24]]), C.skin);
    F.dot(cx + s, cy + 19, '#c89a78'); // the navel
    F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist + 1), cy + crop], [cx - waist - 1, cy + crop], [cx - W - 1, cy + 8]]), C.shirt);
    F.part(poly([[cx - 1 + s, cy + crop - 1], [cx + 3 + s, cy + crop], [cx + 2 + s, cy + crop + 3], [cx + s, cy + crop + 1]]), C.shirt); // the knot
  } else F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 28], [cx - hip, cy + 28], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), C.shirt);
  // the brown front panel, hanging from the belt on his right (the viewer's left), white-edged, the star on it
  const pl = f ? 36 : 47;
  F.part(poly([[cx - 6 + s, cy + 26], [cx + s, cy + 26], [cx + s, cy + pl - 2], [cx - 3 + s, cy + pl], [cx - 6 + s, cy + pl - 2]]), C.vest);
  F.part(line(cx - 6 + s, cy + pl - 2, cx - 3 + s, cy + pl, 1), C.shirt, flat);
  F.part(line(cx - 3 + s, cy + pl, cx + s, cy + pl - 2, 1), C.shirt, flat);
  star(F, cx - 3 + s, cy + pl - 7);

  // the brown vest, open at the top over the shirt and its collar (hers cropped above the midriff);
  // the steel chestplate
  const vb = f ? crop - 1 : 23;
  F.part(poly([[cx - W, cy + 3], [cx - 3 + s, cy + 3], [cx - 1 + s, cy + 12], [cx - 2 + s, cy + vb], [cx - waist - (f ? 1 : 0), cy + vb], [cx - W - 1, cy + 8]]), C.vest);
  F.part(poly([[R(cx + W), cy + 3], [cx + 3 + s, cy + 3], [cx + 1 + s, cy + 12], [cx + 2 + s, cy + vb], [R(cx + waist + (f ? 1 : 0)), cy + vb], [R(cx + W + 1), cy + 8]]), C.vest);
  F.part(poly([[cx - 5 + s, cy + 6], [cx + 5 + s, cy + 6], [cx + 5 + s, cy + 11], [cx + s, cy + 15], [cx - 5 + s, cy + 11]]), C.steel);
  F.part(poly([[cx - 4 + s, cy - 1], [cx - 1 + s, cy + 2], [cx - 5 + s, cy + 4]]), C.shirt); // the collar's points
  F.part(poly([[cx + 4 + s, cy - 1], [cx + 1 + s, cy + 2], [cx + 5 + s, cy + 4]]), C.shirt);
  F.part(rect(cx - 2 + s, cy - 1, cx + 2 + s, cy + 1), C.shirt, soft);
  // the leather straps over the shoulders, one crossing to his left hip (hers end at the vest)
  F.part(line(cx - 7, cy + 3, cx - 6, cy + (f ? crop - 1 : 22), 2), C.strap, flat);
  F.part(line(R(cx + 7), cy + 3, R(cx + 6), cy + (f ? crop - 1 : 22), 2), C.strap, flat);
  if (!f) F.part(line(cx - 7, cy + 4, R(cx + 8), cy + 24, 1), C.strap, flat);
  F.dot(cx - 7, cy + 8, C.trim); F.dot(R(cx + 7), cy + 8, C.trim);

  // two belts, buckles, and the satchel at his left hip (the viewer's right)
  F.part(rect(cx - hip, cy + 23, R(cx + hip), cy + 25), C.leather);
  F.part(line(cx - hip, cy + 28, R(cx + hip), cy + 26, 1), C.strap, flat);
  F.part(rect(cx - 1 + s, cy + 23, cx + 1 + s, cy + 25), C.trim, soft);
  F.part(rect(R(cx + hip - 2), cy + 25, R(cx + hip + 5), cy + 33), C.leather);
  F.part(rect(R(cx + hip - 2), cy + 25, R(cx + hip + 5), cy + 28), C.strap, soft); // its flap
  F.dot(R(cx + hip + 1), cy + 29, C.trim);

  // the arms; the near hand holds the dagger (swinging it while attacking)
  const atk = P.atk >= 0;
  const [hx, hy] = atk ? [0, 0] : arm(F, cx - W - 4, cx - W, cy, -1);
  arm(F, R(cx + W), R(cx + W + 4), cy, 1);
  if (atk) slash(F, cx - W - 2, cy + 6, 'front');
  else { dagger(F, hx, hy, -1); F.part(ellipse(hx, hy, 2.7, 2.5), C.glove); }
  return F;
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, crop } = build(o);
  const R = (v) => v - r;
  if (P.atk >= 0 && behind(P.atk)) slash(F, R(cx + W + 2), cy + 6, 'front', true); // the dagger in front, hidden
  legs(F, o, cx, cy, r, 0);
  if (f) {
    F.part(poly([[cx - hip, cy + 24], [R(cx + hip), cy + 24], [R(cx + hip + 3), cy + 33], [cx - hip - 3, cy + 33]]), C.shirt);
    F.part(poly([[cx - hip, cy + 24], [R(cx + hip), cy + 24], [R(cx + hip + 2), cy + 31], [cx - hip - 2, cy + 31]]), C.vest);
    F.part(line(cx - hip - 2, cy + 31, R(cx + hip + 2), cy + 31, 1), C.trim, flat);
    F.part(poly([[cx - waist, cy + crop - 1], [R(cx + waist), cy + crop - 1], [R(cx + hip - 1), cy + 24], [cx - hip + 1, cy + 24]]), C.skin); // the bare back above the belt
  }
  // the vest's back, the star between the shoulder blades, the back panel, the crossing straps
  const vb = f ? crop : 24;
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist + (f ? 1 : 0)), cy + vb], [cx - waist - (f ? 1 : 0), cy + vb], [cx - W - 1, cy + 8]]), C.vest);
  F.part(line(cx - 7 + s, cy + 3, R(cx + 6) + s, cy + (f ? crop : 22), 1), C.strap, flat);
  F.part(line(R(cx + 7) + s, cy + 3, cx - 6 + s, cy + (f ? crop : 22), 1), C.strap, flat);
  F.part(ellipse(cx + s, cy + 12, 3.5, 3.5), C.vest, soft); // the star, on a patch of the vest over the straps' crossing
  star(F, cx + s, cy + 12);
  const pl = f ? 35 : 46;
  F.part(poly([[cx - 4 + s, cy + 25], [cx + 4 + s, cy + 25], [cx + 4 + s, cy + pl - 3], [cx + s, cy + pl], [cx - 4 + s, cy + pl - 3]]), C.vest);
  F.part(line(cx - 4 + s, cy + pl - 3, cx + s, cy + pl, 1), C.shirt, flat);
  F.part(line(cx + s, cy + pl, cx + 4 + s, cy + pl - 3, 1), C.shirt, flat);
  star(F, cx + s, cy + pl - 7);
  F.part(rect(cx - hip, cy + 23, R(cx + hip), cy + 25), C.leather);
  F.part(rect(cx - hip - 5, cy + 25, cx - hip + 2, cy + 33), C.leather); // the satchel, on the viewer's left from behind
  F.part(rect(cx - hip - 5, cy + 25, cx - hip + 2, cy + 28), C.strap, soft);
  F.part(rect(cx - 3 + s, cy - 1, cx + 3 + s, cy + 2), C.shirt); // the collar
  arm(F, cx - W - 4, cx - W, cy, -1);
  if (P.atk < 0) { const [hx, hy] = arm(F, R(cx + W), R(cx + W + 4), cy, 1); dagger(F, hx, hy, 1); F.part(ellipse(hx, hy, 2.7, 2.5), C.glove); }
  else if (!behind(P.atk)) slash(F, R(cx + W + 2), cy + 6, 'front', true);
  return F;
}

// facing right: the near hand holds the dagger low and forward
function side(F, o, cx, cy) {
  const { f, knee, crop } = build(o);
  const cy0 = cy - P.bob; // the legs stay on the ground
  const leg = (x) => {
    if (f) F.part(rect(x - 2, cy0 + 30, x + 2, cy0 + 58), C.skin);
    else F.part(rect(x - 4, cy0 + 30, x + 3, cy0 + knee + 2), C.pants);
    F.part(rect(x - 3, cy0 + knee, x + 2, cy0 + 58), C.boot);
    F.part(rect(x - 4, cy0 + knee, x + 3, cy0 + knee + 2), C.boot);
    F.part(line(x - 4, cy0 + knee, x + 3, cy0 + knee, 1), C.trim, flat);
    F.part(line(x - 3, cy0 + 51, x + 2, cy0 + 51, 1), C.strap, flat);
    F.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
  };
  leg(cx - 2 - Math.round(3 * P.step)); // the far leg, then the near one, striding
  leg(cx + 2 + Math.round(3 * P.step));
  if (f) {
    F.part(poly([[cx - 7, cy + 24], [cx + 7, cy + 24], [cx + 9, cy + 33], [cx - 9, cy + 33]]), C.shirt);
    F.part(poly([[cx - 7, cy + 24], [cx + 7, cy + 24], [cx + 8, cy + 31], [cx - 8, cy + 31]]), C.vest);
  } else {
    F.part(poly([[cx + 1, cy + 26], [cx + 6, cy + 26], [cx + 6, cy + 45], [cx + 2, cy + 47]]), C.vest); // the front panel
    F.part(line(cx + 6, cy + 27, cx + 6, cy + 45, 1), C.shirt, flat);
  }
  // the body: the shirt, the vest over it, the chestplate's edge, the straps, belts and the satchel behind
  if (f) { // her bare midriff, the shirt knotted above it, the cropped vest
    F.part(rect(cx - 5, cy + crop - 1, cx + 5, cy + 24), C.skin);
    F.part(poly([[cx - 6, cy + 2], [cx + 4, cy + 2], [cx + 8, cy + 10], [cx + 6, cy + crop], [cx - 6, cy + crop], [cx - 7, cy + 8]]), C.shirt);
    F.part(poly([[cx + 4, cy + crop - 1], [cx + 8, cy + crop + 1], [cx + 6, cy + crop + 3]]), C.shirt); // the knot
    F.part(poly([[cx - 6, cy + 3], [cx + 3, cy + 3], [cx + 7, cy + 10], [cx + 5, cy + crop - 1], [cx - 6, cy + crop - 1], [cx - 7, cy + 8]]), C.vest);
  } else {
    F.part(poly([[cx - 6, cy + 2], [cx + 4, cy + 2], [cx + 7, cy + 8], [cx + 6, cy + 22], [cx + 6, cy + 28], [cx - 6, cy + 28], [cx - 6, cy + 22], [cx - 7, cy + 8]]), C.shirt);
    F.part(poly([[cx - 6, cy + 3], [cx + 3, cy + 3], [cx + 6, cy + 10], [cx + 5, cy + 23], [cx - 6, cy + 23], [cx - 7, cy + 8]]), C.vest);
  }
  F.part(poly([[cx + 2, cy + 5], [cx + (f ? 8 : 7), cy + 9], [cx + 6, cy + 14], [cx + 2, cy + 14]]), C.steel);
  F.part(line(cx - 2, cy + 3, cx - 1, cy + (f ? crop - 1 : 22), 2), C.strap, flat);
  F.part(rect(cx - 6, cy + 23, cx + 6, cy + 25), C.leather);
  F.part(rect(cx + 4, cy + 23, cx + 5, cy + 25), C.trim, soft);
  F.part(rect(cx - 10, cy + 24, cx - 4, cy + 32), C.leather); // the satchel
  F.part(rect(cx - 10, cy + 24, cx - 4, cy + 27), C.strap, soft);
  F.part(poly([[cx + 1, cy - 1], [cx + 5, cy + 2], [cx + 1, cy + 3]]), C.shirt); // the collar's point
  // the near arm, the hand forward holding the dagger
  F.part((set) => { ellipse(cx - 1, cy + 7, 3.5, 3.5)(set); rect(cx - 4, cy + 7, cx + 2, cy + 13)(set); }, C.shirt);
  F.part(line(cx - 4, cy + 13, cx + 2, cy + 13, 1), C.shirtDk, flat);
  if (P.atk >= 0) { slash(F, cx - 1, cy + 6, 'side'); return F; }
  F.part(poly([[cx - 3, cy + 14], [cx + 2, cy + 14], [cx + 7, cy + 21], [cx + 4, cy + 24]]), C.skin);
  F.part(poly([[cx + 2, cy + 18], [cx + 5, cy + 18], [cx + 8, cy + 22], [cx + 5, cy + 24]]), C.leather); // the bracer
  const hx = cx + 8, hy = cy + 24;
  F.part(line(hx, hy, hx + 7, hy + 6, 2), C.blade);
  F.part(line(hx + 2, hy + 1, hx + 7, hy + 6, 1), C.edge, flat);
  F.part(line(hx - 1, hy + 3, hx + 2, hy - 1, 1), C.trim, flat);
  F.part(ellipse(hx, hy, 2.6, 2.5), C.glove);
  F.dot(hx + 1, hy + 2, C.skin);
  return F;
}

// one design's painter for a pose (design-anim.js): (view, cx, cy, pose) -> Frame
export const drawTrainee = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(TRAINEES[id], view, cx, cy); } finally { P = REST; } };
// one design's moves: { dir: { idle, walk, attack, bob } }; heads: the trainee's head data, { dir: [x, crown, neck, ...] }
export const animTrainee = (id, heads) => animFrames(VIEWS, heads, BW, drawTrainee(id));
