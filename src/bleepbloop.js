// BleepBloop, the raid boss of Bloop Island (raid.js), painted pixel by pixel in code like the
// kobolds (painted.js), after the owner's "General Bloop" sheet: a giant orange bloop, an old
// general, with stern white brows, a great white mustache and beard, a tall black, red and gold
// general's hat with a gold sun badge and a red plume, gold epaulettes with tassels, and a black and
// red mantle; from behind, a red banner with a bloop on it hangs down the mantle.
// Frames: 4 directions (down, up, right; left is right mirrored) x idle (1), walk (4: he hops,
// squashing and stretching) and attack (4: a squashed wind-up, then a slam). Plain canvas:
// sprites.js makes the sprite set.
import { Frame, ellipse, rect, poly, line } from './painted.js';

export const BW = 88, BH = 96;   // frame size
export const BODY = [66, 80];    // the standing figure, hat and plume included, for sizing in the world
const GROUND = 93;               // the row the blob sits on

const C = {
  body: '#f08a2a', belly: '#ffad55', shine: '#ffe2b8', blush: '#f26a4a',
  beard: '#f4ede2', beardDk: '#cfc4b0', brow: '#f4ede2', eye: '#2a1e1e', glint: '#ffffff',
  hat: '#2e2630', hatRed: '#b8322a', gold: '#d8a43e', goldLt: '#f2cf74', goldDk: '#9a6e24',
  plume: '#c8301e', plumeLt: '#ee5a3a', mantle: '#33262c', mantleRed: '#a8302a',
};
const flat = { outline: false, flat: true };

// squash: > 0 wider and lower (landing, wind-up), < 0 taller and narrower (leaping, slamming)
function paint(view, squash = 0, lift = 0, lean = 0) {
  const F = new Frame(BW, BH);
  const rx = 30 * (1 + squash), ry = 22 * (1 - squash), cx = 44 + lean, cy = GROUND - 1.02 * ry - lift;
  const X = (u) => cx + u * rx, Y = (v) => cy + v * ry; // body units: everything squashes with him
  const back = view === 'back', side = view === 'side';
  const hatY = Y(-1.02), hatTop = hatY - 16; // the hat's brim and its top

  // the plume, behind the hat: a red feather sweeping up and back
  const pr = side ? -1 : 1, px = side ? X(-0.15) : X(0.12);
  F.part(poly([[px - 2, hatTop + 2], [px + pr * 6, hatTop - 12], [px + pr * 18, hatTop - 13], [px + pr * 27, hatTop - 4], [px + pr * 29, hatTop + 10], [px + pr * 22, hatTop + 2], [px + pr * 12, hatTop - 3], [px + pr * 4, hatTop + 5]]), C.plume);
  F.part(line(px + pr * 5, hatTop - 6, px + pr * 22, hatTop - 6, 1), C.plumeLt, flat);
  F.part(line(px + pr * 18, hatTop - 9, px + pr * 26, hatTop + 4, 1), C.plumeLt, flat);

  // the mantle behind him (front and side views), the blob, its shine and blush
  if (!back) {
    if (!side) F.part(poly([[X(-0.86), Y(-0.45)], [X(0.86), Y(-0.45)], [X(1.1), Y(1.02)], [X(-1.1), Y(1.02)]]), C.mantle);
  }
  F.part((set) => { ellipse(cx, Y(-0.15), rx * 0.8, ry)(set); ellipse(cx, Y(0.4), rx * 0.98, ry * 0.62)(set); }, C.body);
  if (!back) {
    F.part(ellipse(X(-0.42), Y(-0.6), 4, 2.5), C.shine, flat);
    if (!side) for (const s of [-1, 1]) F.part(ellipse(X(s * 0.5), Y(-0.2), 3.5, 2), C.blush, flat);
    else F.part(ellipse(X(0.62), Y(-0.2), 3, 2), C.blush, flat);
  }

  if (back) {
    // the mantle over his back, gold-edged, with the bloop banner down the middle
    F.part(poly([[X(-0.82), Y(-0.5)], [X(0.82), Y(-0.5)], [X(1.1), Y(1.02)], [X(-1.1), Y(1.02)]]), C.mantle);
    for (const s of [-1, 1]) F.part(line(X(s * 0.82), Y(-0.48), X(s * 1.08), Y(1.0), 1), C.gold, flat);
    F.part(line(X(-1.08), Y(1.0), X(1.08), Y(1.0), 1), C.gold, flat);
    F.part(poly([[X(-0.32), Y(-0.38)], [X(0.32), Y(-0.38)], [X(0.32), Y(0.7)], [cx, Y(0.92)], [X(-0.32), Y(0.7)]]), C.mantleRed);
    F.part(line(X(-0.32), Y(-0.38), X(0.32), Y(-0.38), 1), C.gold, flat);
    F.part(ellipse(cx, Y(0.25), 5.5, 4.5), C.body); // the bloop on the banner, crowned
    for (const dx of [-3, 0, 3]) F.dot(cx + dx, Y(0.25) - 6, C.gold);
    F.dot(cx - 2, Y(0.22), C.eye); F.dot(cx + 2, Y(0.22), C.eye);
  } else if (side) {
    // facing right: the mantle over his back, an eye under a white brow, the beard flowing down his front
    F.part(poly([[X(-0.3), Y(-0.62)], [X(0.12), Y(-0.48)], [X(0.0), Y(0.2)], [X(0.12), Y(1.02)], [X(-1.12), Y(1.02)], [X(-1.0), Y(0.2)], [X(-0.72), Y(-0.4)]]), C.mantle);
    F.part(poly([[X(-0.62), Y(0.1)], [X(-0.3), Y(0.1)], [X(-0.3), Y(0.95)], [X(-0.85), Y(0.95)]]), C.mantleRed, { outline: false });
    F.part(line(X(0.12), Y(-0.48), X(0.0), Y(0.2), 1), C.gold, flat);
    F.part(line(X(0.0), Y(0.2), X(0.12), Y(1.0), 1), C.gold, flat);
    F.part(ellipse(X(0.48), Y(-0.45), 2, 2.6), C.eye);
    F.dot(X(0.48) - 1, Y(-0.45) - 1, C.glint);
    F.part(poly([[X(0.3), Y(-0.75)], [X(0.72), Y(-0.66)], [X(0.68), Y(-0.55)], [X(0.32), Y(-0.6)]]), C.brow);
    F.part(poly([[X(0.55), Y(-0.3)], [X(0.95), Y(-0.28)], [X(1.18), Y(-0.1)], [X(1.12), Y(0.4)], [X(0.95), Y(0.85)], [X(0.82), Y(1.0)], [X(0.7), Y(0.5)], [X(0.52), Y(0.0)]]), C.beard);
    for (const [u0, u1] of [[0.75, 0.85], [0.92, 0.98], [1.05, 1.0]]) F.part(line(X(u0), Y(0.0), X(u1), Y(0.7), 1), C.beardDk, flat);
    F.part(poly([[X(0.7), Y(-0.32)], [X(1.0), Y(-0.36)], [X(1.2), Y(-0.24)], [X(0.95), Y(-0.15)]]), C.beard); // the mustache
  } else {
    // the face: stern white brows over small dark eyes, a great curled mustache and a long beard
    for (const s of [-1, 1]) {
      F.part(ellipse(X(s * 0.26), Y(-0.46), 2.6, 3.4), C.eye);
      F.dot(X(s * 0.26) - 1, Y(-0.46) - 1.5, C.glint);
      F.part(poly([[X(s * 0.08), Y(-0.6)], [X(s * 0.5), Y(-0.82)], [X(s * 0.62), Y(-0.7)], [X(s * 0.4), Y(-0.62)], [X(s * 0.14), Y(-0.54)]]), C.brow);
    }
    // mantle edges, gold-trimmed, falling either side of the beard
    for (const s of [-1, 1]) {
      F.part(poly([[X(s * 0.8), Y(-0.38)], [X(s * 0.7), Y(0.15)], [X(s * 0.68), Y(1.02)], [X(s * 1.1), Y(1.02)], [X(s * 1.0), Y(0.0)]]), C.mantle);
      F.part(poly([[X(s * 0.9), Y(0.2)], [X(s * 0.78), Y(0.25)], [X(s * 0.77), Y(0.95)], [X(s * 0.97), Y(0.95)]]), C.mantleRed, { outline: false });
      F.part(line(X(s * 0.7), Y(0.15), X(s * 0.68), Y(1.0), 1), C.gold, flat);
    }
    F.part(poly([[X(-0.42), Y(-0.18)], [X(0.42), Y(-0.18)], [X(0.46), Y(0.25)], [X(0.34), Y(0.62)], [X(0.14), Y(0.9)], [X(0.02), Y(1.06)], [X(-0.12), Y(0.86)], [X(-0.32), Y(0.6)], [X(-0.46), Y(0.25)]]), C.beard);
    for (const u of [-0.3, -0.15, 0, 0.15, 0.3]) F.part(line(X(u), Y(0.0), X(u * 0.6), Y(0.7), 1), C.beardDk, flat);
    for (const s of [-1, 1]) F.part(poly([[cx, Y(-0.3)], [X(s * 0.3), Y(-0.36)], [X(s * 0.52), Y(-0.3)], [X(s * 0.66), Y(-0.44)], [X(s * 0.72), Y(-0.3)], [X(s * 0.6), Y(-0.14)], [X(s * 0.36), Y(-0.08)], [cx, Y(-0.14)]]), C.beard); // the mustache, curled up at the ends
  }

  // gold epaulettes on his shoulders, with tassels
  for (const s of side ? [0.05] : [-0.78, 0.78]) {
    for (let k = -2; k <= 2; k++) F.part(line(X(s) + k * 1.6, Y(-0.3), X(s) + k * 1.6, Y(-0.05), 1), C.goldDk, flat);
    F.part(ellipse(X(s), Y(-0.38), 5, 3.5), C.gold);
    F.part(ellipse(X(s), Y(-0.38), 2.2, 1.6), C.goldLt, flat);
  }

  // the hat: tall, black, a red band slanting across, gold-edged, a gold sun badge on the front
  const hw = rx * 0.48, tw = rx * 0.54, hx = side ? X(-0.1) : cx;
  F.part(poly([[hx - hw, hatY], [hx + hw, hatY], [hx + tw, hatTop + 1], [hx - tw, hatTop - 1]]), C.hat);
  F.part(poly([[hx - hw * 0.96, hatY - 6], [hx + tw * 1.05, hatTop + 6], [hx + tw * 1.02, hatTop + 11], [hx - hw * 0.98, hatY - 1]]), C.hatRed, { outline: false });
  F.part(rect(Math.round(hx - hw - 1), Math.round(hatY - 1), Math.round(hx + hw + 1), Math.round(hatY + 2)), C.gold);
  F.part(line(hx - tw, hatTop - 1, hx + tw, hatTop + 1, 1), C.gold, flat);
  if (!back && !side) {
    F.part(ellipse(hx, hatY - 9, 5, 5), C.gold);
    F.part(ellipse(hx, hatY - 9, 3, 3), C.goldLt, flat);
    F.dot(hx - 1, hatY - 10, C.goldDk); F.dot(hx + 1, hatY - 10, C.goldDk);
    for (const [dx, dy] of [[0, -7], [6, -2], [-6, -2], [4, 4], [-4, 4]]) F.dot(hx + dx, hatY - 9 + dy, C.gold); // its rays
  }
  return F;
}

// { down: { idle: [canvas], walk: [4], attack: [4] }, up, right, left }
export function paintBleepBloop() {
  const VIEW = { down: 'front', up: 'back', right: 'side' };
  const WALK = [[0, 0], [-0.08, 3], [0, 1], [0.1, 0]];                   // [squash, lift]: a heavy hop
  const ATTACK = [[0.14, 0, 0], [-0.12, 2, 3], [0.06, 0, 2], [0, 0, 0]]; // wind-up, slam, land, settle
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    const view = VIEW[dir === 'left' ? 'right' : dir], flip = dir === 'left';
    const make = (sq, lift, lean = 0) => { const F = paint(view, sq, lift, view === 'side' ? lean : 0); return (flip ? F.mirror() : F).toCanvas(); };
    out[dir] = { idle: [make(0, 0)], walk: WALK.map(([s, l]) => make(s, l)), attack: ATTACK.map(([s, l, n]) => make(s, l, n)) };
  }
  return out;
}
