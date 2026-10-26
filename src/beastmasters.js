// Sprite designs for the Beastmaster, male and female, painted in code like the archers
// (archers.js) on the bald bodies' frame, so the shared head and hair go on top
// (docs/character-standard.md). After the owner's sheet, savage and dark: beast-skull pauldrons on
// fur mantles, crossed leather straps with an iron ring and a fang necklace, spiked leather
// bracers, a belt with a skull buckle and hanging claws, a leather and fur kilt, fur-wrapped greaves
// with steel knee plates and spikes, a quiver on the back. He is bare-chested under the straps; she
// wears dark scale armour, with feathers at her collar. The Beastmaster fights with a sword or a
// bow, so each has two designs: with the dark horned recurve bow (beastM/F: the archers' shot) and
// with the heavy cleaver (beastswM/F: the blade swing).
// The game paints the hero's body from these (sprites.js designSet). Plain canvas, no three.js.
import { Frame, ellipse, rect, poly, line } from './painted.js';
import { REST, SHOOT, LOOSE, SWING, SLASH, behind, recurve, swordArm, slashArc, animFrames, VIEWS } from './design-anim.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json)

const BEAST = {
  skin: '#e2aa80', skinDk: '#b8805a', scale: '#3c3c46', scaleLt: '#5c5c6a', strap: '#4a2e1c', ring: '#b8bcc4',
  fur: '#6a5844', furLt: '#9a8668', leather: '#3e2a1e', bone: '#e6dcc4', socket: '#2a1e16', steel: '#a8acb4',
  pants: '#33261c', boot: '#2a1e16', quiver: '#3a2a20', feathers: ['#2a2a2a', '#a8302a', '#2a2a2a'], plume: ['#3a8a8a', '#f0ece0'],
  bow: { wood: '#3a2a22', light: '#9a8a76', grip: '#6a4a2a', string: '#e8e0d0', arrow: '#c8b89a', tip: '#a8acb4', fletch: '#a8302a' },
  blade: { sleeve: '#e2aa80', glove: '#3e2a1e', blade: '#b8bcc4', edge: '#eef0f4', guard: '#5a4030', arc: '#ffffff', arc2: '#c8b0a0' },
};
export const BEASTMASTERS = {
  beastM: { name: 'Beastmaster', sex: 'm', C: BEAST },
  beastF: { name: 'Beastmaster', sex: 'f', C: BEAST },
  beastswM: { name: 'Beastmaster', sex: 'm', sword: true, C: BEAST },
  beastswF: { name: 'Beastmaster', sex: 'f', sword: true, C: BEAST },
};

const flat = { outline: false, flat: true };
let P = REST;
const lerp = (a, b, k) => a + (b - a) * k;
const raised = () => (P.atk >= 0 ? SHOOT.raise[P.atk] : 0);
const drawn = () => (P.atk >= 0 ? SHOOT.draw[P.atk] : 0);
function build(o) {
  const f = o.sex === 'f';
  return { f, W: f ? 11 : 13, waist: f ? 7 : 10, hip: f ? 10 : 10, legs: f ? [[-7, -2], [2, 7]] : [[-8, -2], [2, 8]], knee: 40, hem: 38 };
}
// the torso's colour: his bare skin, her scale armour
const torso = (o) => (o.sex === 'f' ? o.C.scale : o.C.skin);

function paint(o, view, cx, cy) {
  const F = new Frame(BW, BH);
  if (view === 'side') return side(F, o, cx, cy);
  const back = view === 'back' || view === 'back3';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0;
  const r = view === 'front3' || view === 'back3' ? 3 : 0;
  return back ? backView(F, o, cx, cy, s, r) : frontView(F, o, cx, cy, s, r);
}

// a beast skull over a fur mantle on one shoulder: the fur, the skull's brow and snout, two dark
// sockets, short horns curling out (side: -1 the viewer's left, 1 the right)
function pauldron(F, x, cy, side, C) {
  F.part(ellipse(x, cy + 7, 6, 4), C.fur);
  for (let i = -2; i <= 2; i++) F.dot(x + i * 2, cy + 10 + (i % 2 ? 1 : 0), C.furLt);
  F.part(ellipse(x, cy + 4, 4, 3.2), C.bone);
  F.part(rect(x - 2, cy + 6, x + 2, cy + 8), C.bone);
  F.dot(x - 1.5, cy + 4, C.socket); F.dot(x + 1.5, cy + 4, C.socket); F.dot(x, cy + 7, C.socket);
  F.part(line(x + side * 3, cy + 2, x + side * 6, cy - 1, 1), C.bone, flat);
  F.dot(x + side * 6, cy - 2, C.bone); F.dot(x + side * 5, cy - 2, C.bone);
}
// the scale armour's pattern: rows of little scales, offset row to row
function scales(F, x0, x1, y0, y1, C) {
  for (let y = y0; y <= y1; y += 2) for (let x = x0 + ((y - y0) % 4 ? 1 : 0); x <= x1; x += 2) F.dot(x, y, C.scaleLt);
}

function legs(F, o, cx, cy, r, toe, front = true) {
  cy -= P.bob;
  const { f, legs: L, knee } = build(o), C = o.C;
  L.forEach(([a, b], i) => {
    const sh = i ? -Math.round(r / 2) : 0;
    const cyl = cy - Math.round(Math.max(0, i ? -P.step : P.step) * 2);
    F.part(rect(cx + a + sh, cy + 30, cx + b + sh, cyl + 58), C.pants);
    F.part(rect(cx + a - 1 + sh, cyl + knee, cx + b + 1 + sh, cyl + 56), C.fur); // fur-wrapped greaves
    for (let y = cyl + knee + 3; y < cyl + 55; y += 4) F.part(line(cx + a - 1 + sh, y, cx + b + 1 + sh, y + 1, 1), C.strap, flat); // the bindings
    F.part(rect(cx + a + sh, cyl + 56, cx + b + sh, cyl + 58), C.boot);
    F.part(ellipse(cx + (a + b) / 2 + toe + sh + (i ? 0.5 : -0.5), cyl + 60.5, f ? 4 : 4.5, 2.5), C.boot);
    const mid = cx + (a + b) / 2 + sh;
    if (!front) return;
    F.part(rect(mid - 2, cyl + knee - 2, mid + 2, cyl + knee + 2), C.steel); // the steel knee plate and its spike
    F.part(poly([[mid - 1, cyl + knee - 2], [mid + 1, cyl + knee - 2], [mid, cyl + knee - 5]]), C.steel);
  });
}

function frontView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C;
  const R = (v) => v - r;
  // the quiver's top over the right shoulder
  F.part(poly([[cx - W - 1, cy - 3], [cx - W + 3, cy - 5], [cx - W + 5, cy + 4], [cx - W + 1, cy + 5]]), C.quiver);
  C.feathers.forEach((c, i) => { const x = cx - W - 1 + i * 1.5, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 3, 1), c, flat); });
  legs(F, o, cx, cy, r, s);
  // the torso
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), torso(o));
  if (f) scales(F, cx - W + 2, R(cx + W - 2), cy + 5, cy + 23, C);
  else { // a bare chest: the pecs and the belly's lines
    F.part(line(cx - 7 + s, cy + 11, cx - 1 + s, cy + 12, 1), C.skinDk, flat);
    F.part(line(cx + 1 + s, cy + 12, R(cx + 7) + s, cy + 11, 1), C.skinDk, flat);
    F.part(line(cx + s, cy + 13, cx + s, cy + 23, 1), C.skinDk, flat);
    for (const y of [16, 19]) { F.dot(cx - 3 + s, cy + y, C.skinDk); F.dot(cx + 3 + s, cy + y, C.skinDk); }
  }
  // the kilt: a leather flap in front, fur at the sides with a ragged hem
  F.part(poly([[cx - hip - 1, cy + 26], [R(cx + hip + 1), cy + 26], [R(cx + hip + 2), cy + hem - 2], [R(cx + hip - 1), cy + hem], [cx + 3 + s, cy + hem - 3], [cx - 3 + s, cy + hem - 1], [cx - hip + 1, cy + hem], [cx - hip - 2, cy + hem - 3]]), C.fur);
  F.part(poly([[cx - 4 + s, cy + 26], [cx + 4 + s, cy + 26], [cx + 4 + s, cy + hem + 2], [cx + s, cy + hem + 4], [cx - 4 + s, cy + hem + 2]]), C.leather);
  // the crossed straps and their iron ring
  F.part(line(cx - W + 2, cy + 4, R(cx + waist - 1), cy + 23, 2), C.strap, flat);
  F.part(line(R(cx + W - 2), cy + 4, cx - waist + 1, cy + 23, 2), C.strap, flat);
  F.part(ellipse(cx + s - r / 2, cy + 13, 1.6, 1.6), C.ring);
  // the fang necklace
  for (let i = -3; i <= 3; i++) { const x = cx + s + i * 1.6, y = cy + 4 + Math.round(Math.cos(i / 3) * 0) + Math.abs(i) * -0.4 + 2; F.dot(x, y, C.strap); F.dot(x, y + 1, C.bone); if (!(i % 2)) F.dot(x, y + 2, C.bone); }
  if (f) for (const side of [-1, 1]) C.plume.forEach((c, i) => F.part(line(cx + side * (5 + i * 2) + s, cy + 3, cx + side * (7 + i * 2) + s, cy - 2 + i, 1), c, flat)); // feathers at her collar
  // the belt: a skull buckle, claws hanging
  F.part(rect(cx - hip, cy + 23, R(cx + hip), cy + 26), C.leather);
  F.part(ellipse(cx + s, cy + 24.5, 2.4, 2), C.bone);
  F.dot(cx - 1 + s, cy + 24, C.socket); F.dot(cx + 1 + s, cy + 24, C.socket);
  for (const x of [-hip + 2, -hip + 5, hip - 5, hip - 2]) F.part(poly([[cx + x - 1 - (x > 0 ? r : 0), cy + 27], [cx + x + 1 - (x > 0 ? r : 0), cy + 27], [cx + x - (x > 0 ? r : 0), cy + 31]]), C.bone);
  pauldron(F, cx - W - 1, cy, -1, C);
  pauldron(F, R(cx + W + 1), cy, 1, C);
  arms(F, o, cx, cy, W, R, s, false);
  return F;
}

// the arms: spiked bracers; the bow in the left hand (raised and drawn to shoot), or the cleaver in
// the right (swung). mirror: the back view
function arms(F, o, cx, cy, W, R, s, mirror) {
  const C = o.C, f = o.sex === 'f', upper = f ? C.scale : C.skin;
  const bowX = mirror ? cx - W - 2 : R(cx + W + 2), drawX = mirror ? R(cx + W + 2) : cx - W - 2;
  const dir = mirror ? -1 : 1;
  const hang = (x0, x1) => {
    F.part(rect(x0, cy + 8, x1, cy + 17), upper);
    F.part(rect(x0, cy + 17, x1, cy + 25), C.leather);
    for (const y of [18, 21, 24]) F.dot(x0 - 1, cy + y, C.ring), F.dot(x1 + 1, cy + y, C.ring); // the spikes
    F.part(ellipse((x0 + x1) / 2, cy + 28, 2.6, 2.4), C.skin);
  };
  const shooting = P.atk >= 0;
  if (o.sword) {
    // the cleaver in the right hand (the viewer's left from the front), hanging, or swung
    if (!shooting) {
      hang(drawX - 2, drawX + 2);
      const hx = drawX, hy = cy + 28;
      F.part(poly([[hx - 1, hy + 2], [hx + 3 * dir, hy + 2], [hx + 4 * dir, hy + 20], [hx - 2 * dir, hy + 22], [hx - 2 * dir, hy + 4]]), C.blade.blade);
      F.part(line(hx - 2 * dir, hy + 4, hx - 2 * dir, hy + 21, 1), C.blade.edge, flat);
      F.part(line(hx - 2, hy + 2, hx + 2, hy + 2, 1), C.blade.guard, flat);
    }
    hang(bowX - 2, bowX + 2);
    if (shooting && !mirror) swing(F, o, cx - W - 2, cy + 6, 'front');
    return;
  }
  const k = raised(), d = drawn();
  const bx = lerp(bowX, cx + dir * 6 + s, k), by = lerp(cy + 28, cy + 13, k);
  const ang = mirror ? lerp(-90, 30, k) : lerp(90, 150, k);
  const cheek = [lerp(bx - dir * 4, cx - dir * 5 + s, d), lerp(by - 5, cy + 3, d)];
  const pull = P.atk === LOOSE ? 0 : 2 + 6 * d;
  const hold = recurve(F, bx, by, ang, 19, C.bow, shooting ? pull : 0, shooting && d > 0, P.atk === LOOSE && !mirror, shooting && P.atk !== LOOSE ? cheek : null);
  F.part(line(bx + Math.cos((ang * Math.PI) / 180) * 18, by + Math.sin((ang * Math.PI) / 180) * 18, bx + Math.cos((ang * Math.PI) / 180) * 21 + 2, by + Math.sin((ang * Math.PI) / 180) * 21 - 1, 1), C.bow.light, flat); // a horn tip
  if (!shooting) { hang(bowX - 2, bowX + 2); hang(drawX - 2, drawX + 2); return; }
  const reach = (x0, y0, x1, y1) => { const mx = lerp(x0, x1, 0.55), my = lerp(y0, y1, 0.55); F.part(line(x0, y0, mx, my, 4), upper); F.part(line(mx, my, x1, y1, 4), C.leather); F.part(ellipse(x1, y1, 2.4, 2.2), C.skin); };
  reach(mirror ? cx - W : R(cx + W), cy + 7, bx, by);
  const [hx, hy] = hold, ex = drawX - dir * 2, ey = cy + 3;
  F.part(line(mirror ? R(cx + W) : cx - W, cy + 7, ex, ey, 4), upper);
  F.part(line(ex, ey, hx, hy, 4), C.leather);
  F.part(ellipse(hx, hy, 2.4, 2.2), C.skin);
}
// the cleaver swung from the shoulder (x, y), a heavy blade with a wide edge
function swing(F, o, x, y, view, mirror = false) {
  let [a, b] = SWING[view][P.atk];
  if (mirror) { a = 180 - a; b = 180 - b; }
  const c = { ...o.C.blade, sleeve: o.sex === 'f' ? o.C.scale : o.C.skin };
  const [hx, hy, tx, ty] = swordArm(F, x, y, a, b, c, 16, 19);
  const ux = (tx - hx) / 19, uy = (ty - hy) / 19;
  F.part(line(hx + ux * 4 - uy * 2, hy + uy * 4 + ux * 2, tx - uy * 2, ty + ux * 2, 2), c.blade); // the cleaver's broad back
  if (P.atk === SLASH) slashArc(F, x, y, 30, mirror ? 140 : view === 'side' ? -40 : -60, mirror ? 30 : view === 'side' ? 50 : 40, c.arc, c.arc2);
}

function backView(F, o, cx, cy, s, r) {
  const { f, W, waist, hip, hem } = build(o), C = o.C;
  const R = (v) => v - r;
  if (P.atk >= 0 && !o.sword) arms(F, o, cx, cy, W, R, s, true);
  if (P.atk >= 0 && o.sword && behind(P.atk)) swing(F, o, R(cx + W + 2), cy + 6, 'front', true);
  legs(F, o, cx, cy, r, 0, false);
  F.part(poly([[cx - W, cy + 3], [R(cx + W), cy + 3], [R(cx + W + 1), cy + 8], [R(cx + waist), cy + 22], [R(cx + hip), cy + 30], [cx - hip, cy + 30], [cx - waist, cy + 22], [cx - W - 1, cy + 8]]), torso(o));
  if (f) scales(F, cx - W + 2, R(cx + W - 2), cy + 5, cy + 23, C);
  else F.part(line(cx + s, cy + 6, cx + s, cy + 22, 1), C.skinDk, flat); // the spine
  F.part(poly([[cx - hip - 1, cy + 26], [R(cx + hip + 1), cy + 26], [R(cx + hip + 2), cy + hem], [cx + s, cy + hem - 3], [cx - hip - 2, cy + hem]]), C.fur);
  F.part(line(cx - W + 2, cy + 4, R(cx + waist - 1), cy + 23, 2), C.strap, flat);
  F.part(line(R(cx + W - 2), cy + 4, cx - waist + 1, cy + 23, 2), C.strap, flat);
  F.part(rect(cx - hip, cy + 23, R(cx + hip), cy + 26), C.leather);
  // the quiver from the right shoulder down to the left hip
  F.part(poly([[R(cx + W - 1), cy - 3], [R(cx + W + 4), cy - 1], [cx - 4 + s, cy + 24], [cx - 8 + s, cy + 22]]), C.quiver);
  F.part(line(cx - 1 + s, cy + 10, cx + 3 + s, cy + 12, 1), C.strap, flat);
  C.feathers.forEach((c, i) => { const x = R(cx + W - 1) + i * 2, y = cy - 4 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  // the fur mantle across the shoulders, a skull on each
  F.part(poly([[cx - W - 3, cy + 2], [R(cx + W + 3), cy + 2], [R(cx + W + 2), cy + 9], [cx - W - 2, cy + 9]]), C.fur);
  for (let x = -W; x <= W - r; x += 3) F.dot(cx + x, cy + 9 + (x % 2 ? 1 : 0), C.furLt);
  if (f) C.plume.forEach((c, i) => F.part(line(cx - 3 + i * 3 + s, cy + 2, cx - 4 + i * 4 + s, cy - 3, 1), c, flat));
  pauldron(F, cx - W - 1, cy, -1, C);
  pauldron(F, R(cx + W + 1), cy, 1, C);
  if (P.atk < 0) arms(F, o, cx, cy, W, R, s, true);
  else if (o.sword) {
    const ux = cx - W - 2; // the bow hand hangs; the sword arm swings
    F.part(rect(ux - 2, cy + 8, ux + 2, cy + 17), torso(o)); F.part(rect(ux - 2, cy + 17, ux + 2, cy + 25), C.leather);
    if (!behind(P.atk)) swing(F, o, R(cx + W + 2), cy + 6, 'front', true);
  } else {
    const ex = R(cx + W + 5), ey = cy + 4;
    F.part(line(R(cx + W), cy + 7, ex, ey, 4), torso(o));
    F.part(line(ex, ey, cx + 4 + s, cy + 6, 4), C.leather);
  }
  return F;
}

// facing right
function side(F, o, cx, cy) {
  const { f, knee, hem } = build(o), C = o.C, k = raised(), d = drawn(), shooting = P.atk >= 0;
  const cy0 = cy - P.bob, upper = f ? C.scale : C.skin;
  const leg = (x) => {
    F.part(rect(x - 3, cy0 + 30, x + 2, cy0 + 58), C.pants);
    F.part(rect(x - 4, cy0 + knee, x + 3, cy0 + 56), C.fur);
    for (let y = cy0 + knee + 3; y < cy0 + 55; y += 4) F.part(line(x - 4, y, x + 3, y + 1, 1), C.strap, flat);
    F.part(ellipse(x + 1, cy0 + 60.5, 4.5, 2.5), C.boot);
    F.part(rect(x + 1, cy0 + knee - 2, x + 4, cy0 + knee + 2), C.steel);
    F.part(poly([[x + 4, cy0 + knee - 1], [x + 7, cy0 + knee], [x + 4, cy0 + knee + 1]]), C.steel);
  };
  // the quiver on the back
  F.part(poly([[cx - 7, cy - 3], [cx - 3, cy - 5], [cx - 6, cy + 20], [cx - 10, cy + 19]]), C.quiver);
  C.feathers.forEach((c, i) => { const x = cx - 6 + i * 2, y = cy - 5 - (i % 2); F.part(line(x, y, x + 1, y - 4, 1), c, flat); });
  const bx = lerp(cx + 8, cx + 17, k), by = lerp(cy + 27, cy + 8, k);
  if (!o.sword && !shooting) recurve(F, bx, by, 95, 19, C.bow);
  leg(cx - 2 - Math.round(3 * P.step));
  leg(cx + 2 + Math.round(3 * P.step));
  F.part(poly([[cx - 7, cy + 26], [cx + 7, cy + 26], [cx + 9, cy + hem], [cx + 3, cy + hem - 2], [cx - 3, cy + hem], [cx - 9, cy + hem - 2]]), C.fur);
  F.part(poly([[cx + 3, cy + 26], [cx + 7, cy + 26], [cx + 8, cy + hem + 3], [cx + 4, cy + hem + 3]]), C.leather);
  F.part(poly([[cx - 7, cy + 2], [cx + 4, cy + 2], [cx + (f ? 8 : 7), cy + (f ? 10 : 8)], [cx + 6, cy + 22], [cx + 7, cy + 30], [cx - 7, cy + 30], [cx - 6, cy + 22], [cx - 8, cy + 8]]), upper);
  if (f) scales(F, cx - 6, cx + 5, cy + 5, cy + 22, C);
  else F.part(line(cx + 5, cy + 10, cx + 4, cy + 22, 1), C.skinDk, flat);
  F.part(line(cx - 6, cy + 4, cx + 5, cy + 22, 2), C.strap, flat);
  for (let i = 0; i < 3; i++) F.dot(cx + 4 + i, cy + 4 + i, C.bone); // the necklace's fangs
  F.part(rect(cx - 6, cy + 23, cx + 6, cy + 26), C.leather);
  F.part(ellipse(cx + 5, cy + 24.5, 1.6, 1.6), C.bone);
  for (const x of [cx - 4, cx + 1]) F.part(poly([[x - 1, cy + 27], [x + 1, cy + 27], [x, cy + 31]]), C.bone);
  if (f) C.plume.forEach((c, i) => F.part(line(cx + 2 + i * 2, cy + 3, cx + 4 + i * 2, cy - 2 + i, 1), c, flat));
  pauldron(F, cx - 1, cy, 1, C);
  if (o.sword) {
    if (shooting) { swing(F, o, cx - 1, cy + 6, 'side'); return F; }
    F.part(rect(cx - 3, cy + 9, cx + 1, cy + 17), upper);
    F.part(rect(cx - 3, cy + 17, cx + 1, cy + 25), C.leather);
    F.part(ellipse(cx, cy + 28, 2.6, 2.6), C.skin);
    F.part(poly([[cx + 1, cy + 29], [cx + 4, cy + 30], [cx + 5, cy + 47], [cx + 1, cy + 49], [cx - 1, cy + 31]]), C.blade.blade); // the cleaver, point down
    F.part(line(cx + 5, cy + 31, cx + 5, cy + 47, 1), C.blade.edge, flat);
    return F;
  }
  if (shooting) {
    const pull = P.atk === LOOSE ? 0 : 2 + 9 * d;
    F.part(line(cx + 1, cy + 7, bx - 1, by, 4), upper);
    F.part(line(lerp(cx + 1, bx, 0.55), lerp(cy + 7, by, 0.55), bx - 1, by, 4), C.leather);
    const [hx, hy] = recurve(F, bx, by, 95, 19, C.bow, pull, d > 0 && P.atk !== LOOSE, P.atk === LOOSE);
    F.part(ellipse(bx, by, 2.2, 2.2), C.skin);
    const ex = lerp(cx, cx - 5, d), ey = cy + 6;
    F.part(line(cx - 1, cy + 6, ex, ey, 4), upper);
    F.part(line(ex, ey, hx, hy, 4), C.leather);
    F.part(ellipse(hx, hy, 2.4, 2.2), C.skin);
    return F;
  }
  F.part(rect(cx - 3, cy + 9, cx + 1, cy + 17), upper);
  F.part(rect(cx - 3, cy + 17, cx + 1, cy + 25), C.leather);
  for (const y of [18, 21, 24]) F.dot(cx - 4, cy + y, C.ring);
  F.part(ellipse(cx, cy + 28, 2.6, 2.6), C.skin);
  return F;
}

export const drawBeastmaster = (id) => (view, cx, cy, pose) => { P = pose; try { return paint(BEASTMASTERS[id], view, cx, cy); } finally { P = REST; } };
export const animBeastmaster = (id, heads) => animFrames(VIEWS, heads, BW, drawBeastmaster(id));
