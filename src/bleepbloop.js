// BleepBloop, the raid boss of Bloop Island (raid.js), painted pixel by pixel in code like the
// kobolds (painted.js): a giant old war bloop, orange and scarred, with a scowl, an eyepatch over
// his right eye, a bushy grey beard hiding his mouth and his dented iron helm with a red crest. Frames: 4 directions
// (down, up, right; left is right mirrored) x idle (1), walk (4: he hops, squashing and stretching)
// and attack (4: a squashed wind-up, then a slam). Plain canvas: sprites.js makes the sprite set.
import { Frame, ellipse, rect, poly, line } from './painted.js';

export const BW = 64, BH = 64;   // frame size
export const BODY = [54, 52];    // the standing figure, helm included, for sizing in the world
const GROUND = 61;               // the row the blob sits on

const C = {
  body: '#e8782a', belly: '#f6a24a', shine: '#ffe0b0', scar: '#8a3a1a',
  beard: '#cfc6b4', beardDk: '#9a917e', patch: '#1e1a1a', strap: '#3a2a22',
  eye: '#fff4dc', pupil: '#7a1a10', brow: '#3a1a10',
  iron: '#7e808a', ironLt: '#aeb0ba', ironDk: '#4e505a', brass: '#d8b04a', crest: '#c23a22',
};
const flat = { outline: false, flat: true };

// squash: > 0 wider and lower (landing, wind-up), < 0 taller and narrower (leaping, slamming)
function paint(view, squash = 0, lift = 0, lean = 0) {
  const F = new Frame(BW, BH);
  const rx = 26 * (1 + squash), ry = 19 * (1 - squash), cx = 32 + lean, cy = GROUND - 1.02 * ry - lift;
  const top = cy - 1.1 * ry, back = view === 'back', side = view === 'side';
  // the blob: a dome on a wide, sagging base, like any bloop (only much bigger), and its shine
  F.part((set) => { ellipse(cx, cy - ry * 0.1, rx * 0.86, ry)(set); ellipse(cx, cy + ry * 0.4, rx, ry * 0.62)(set); }, C.body);
  if (!back) F.part(ellipse(cx + (side ? 4 : 0), cy + ry * 0.35, rx * 0.55, ry * 0.42), C.belly, { outline: false });
  F.part(ellipse(cx - rx * 0.5, cy - ry * 0.45, 4, 2.5), C.shine, flat);
  // old scars across the hide
  F.part(line(cx - rx * 0.75, cy - 2, cx - rx * 0.45, cy + 6, 1), C.scar, flat);
  F.part(line(cx + rx * 0.55, cy + 8, cx + rx * 0.8, cy + 3, 1), C.scar, flat);

  if (back) {
    // the beard shows at his sides, the patch's strap across the back of his head
    for (const s of [-1, 1]) F.part(poly([[cx + s * (rx * 0.62), cy + 1], [cx + s * (rx * 0.86), cy + 4], [cx + s * (rx * 0.66), cy + 10]]), C.beard);
    F.part(line(cx - rx * 0.8, top + 9, cx + rx * 0.8, top + 7, 2), C.strap, flat);
  } else if (side) {
    // facing right: the patched eye toward us, the beard jutting forward
    const ex = cx + rx * 0.5, ey = cy - 7;
    F.part(line(ex - 14, top + 8, ex + 2, ey - 1, 2), C.strap, flat);
    F.part(ellipse(ex, ey, 4, 3.5), C.patch);
    F.part(line(ex - 4, ey - 6, ex + 6, ey - 3, 2), C.brow, flat);
    F.part(poly([[cx + rx * 0.4, cy], [cx + rx + 4, cy + 2], [cx + rx + 1, cy + 10], [cx + rx - 3, cy + 15], [cx + rx * 0.45, cy + 9]]), C.beard);
    for (const k of [0.55, 0.72, 0.88]) F.part(line(cx + rx * k, cy + 3, cx + rx * k + 1, cy + 9, 1), C.beardDk, flat);
  } else {
    // the face: a scowling eye, the eyepatch and a bushy beard (it hides his mouth)
    const ey = cy - 6;
    F.part(line(cx - rx * 0.8, top + 9, cx + rx * 0.45, ey - 7, 2), C.strap, flat); // the strap, over the brow
    F.part(ellipse(cx - 9, ey, 5, 4.5), C.patch);
    F.part(ellipse(cx + 9, ey, 4.5, 4), C.eye);
    F.part(ellipse(cx + 8, ey + 1, 2, 2.2), C.pupil, flat);
    F.dot(cx + 7, ey, C.eye);
    F.part(line(cx + 3, ey - 6, cx + 15, ey - 3, 2), C.brow, flat); // a scowl: the brow slants down to the middle
    F.part(line(cx + 11, ey - 9, cx + 14, ey + 6, 1), C.scar, flat); // an old cut through the brow
    F.part(poly([[cx - 15, cy + 1], [cx + 15, cy + 1], [cx + 14, cy + 8], [cx + 9, cy + 14], [cx + 5, cy + 11], [cx + 1, cy + 17], [cx - 3, cy + 12], [cx - 8, cy + 15], [cx - 12, cy + 10], [cx - 15, cy + 7]]), C.beard);
    for (const x of [-9, -4, 1, 6, 10]) F.part(line(cx + x, cy + 5, cx + x + 1, cy + 11, 1), C.beardDk, flat);
  }

  // the helm: an iron dome on the crown of the blob, brass-studded, dented, with a red crest
  const hx = cx + (side ? -3 : 0), hr = rx * 0.44, hy = top + 6;
  F.part(poly([[hx - 2, hy - 7], [hx + 2, hy - 12], [hx + (side ? -8 : 5), hy - 11], [hx + 3, hy - 6]]), C.crest);
  F.part((set) => { for (let y = Math.floor(hy - 7); y <= hy; y++) for (let x = Math.floor(hx - hr); x <= hx + hr; x++) if (((x - hx) / (hr + 0.3)) ** 2 + ((y - hy) / 7.3) ** 2 <= 1) set(x, y); }, C.iron);
  F.part(ellipse(hx - hr * 0.4, hy - 4, 2.5, 1.2), C.ironLt, flat);
  F.part(ellipse(hx + hr * 0.45, hy - 3, 1.5, 1.2), C.ironDk, flat); // the dent
  F.part(rect(Math.round(hx - hr - 1), Math.round(hy), Math.round(hx + hr + 1), Math.round(hy + 2)), C.ironDk);
  for (const k of [-0.7, -0.25, 0.25, 0.7]) F.dot(hx + k * hr, hy + 1, C.brass);
  return F;
}

// { down: { idle: [canvas], walk: [4], attack: [4] }, up, right, left }
export function paintBleepBloop() {
  const VIEW = { down: 'front', up: 'back', right: 'side' };
  const WALK = [[0, 0], [-0.08, 3], [0, 1], [0.1, 0]];       // [squash, lift]: a heavy hop
  const ATTACK = [[0.14, 0, 0], [-0.12, 2, 3], [0.06, 0, 2], [0, 0, 0]]; // wind-up, slam, land, settle
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    const view = VIEW[dir === 'left' ? 'right' : dir], flip = dir === 'left';
    const make = (sq, lift, lean = 0) => { const F = paint(view, sq, lift, view === 'side' ? lean : 0); return (flip ? F.mirror() : F).toCanvas(); };
    out[dir] = { idle: [make(0, 0)], walk: WALK.map(([s, l]) => make(s, l)), attack: ATTACK.map(([s, l, n]) => make(s, l, n)) };
  }
  return out;
}
