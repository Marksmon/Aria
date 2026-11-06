// The monsters that were once another's sprite in new colours (a tint or a recoloured sheet), each painted in code
// now with a design of its own (the owner's call, November 2026: no recoloured monsters; the bloops alone may share a body in new colours). Names, stats, cards and
// quests stay; only the look is new (the mini-bosses keep theirs: the owner's call):
// - the Mudskipper (it was the Sea Bloop): a fish that hops on the mud on its fins, eyes on top of its head, a sail
//   of a fin along its back spotted bright blue
// - the Red Sprout a red radish brawler with root fists
// - the Blue Crab a broad swimming crab, spined, one great claw
// - the Dark Mushroom a drooping ink cap dripping ink, eyes glowing under it
// - the Fire Beetle a black beetle cracked with magma, stag jaws
// - the Lantern Wisp a paper lantern with a flame for a heart; the Dark Wisp a wisp of violet smoke with hollow eyes;
//   the Fire Wisp a living flame with horns of fire
// Frames: 4 directions (down, up, right; left is right mirrored) x idle (1), walk (4) and attack (4). Every
// measure is in pixels at k = 1, counted up from the ground (y) and out from the middle (x).
import { Frame, ellipse, rect, poly, line, both, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
export const VARIANTS = {
  // the shore: the Mudskipper (once the Sea Bloop: the owner's call, a new name and no bloop)
  brine: { kind: 'skipper', size: [56, 40], body: [44, 24], skin: '#7a8456', belly: '#ddd4a8', spot: '#62ccff', fin: '#4a78a8', finSpot: '#9ae4ff', eye: '#f2ead0', pupil: '#1a1410', mouth: '#3a2a1e' },
  // the sprouts
  russet: { kind: 'radish', k: 1, size: [44, 50], body: [28, 44], bulb: '#c8283a', rib: '#8a1428', root: '#f0c8c8', leaf: '#2f7a32', vein: '#c83a4a', eye: '#1a0a0a' },
  // the crabs
  tidecrab: { kind: 'swimcrab', k: 1, size: [56, 40], body: [46, 26], shell: '#3a6ac8', top: '#6a9ae8', spot: '#24448a', claw: '#5a8ad8', tip: '#f0f0f8', leg: '#2e58a8', eye: '#101018' },
  // the mushrooms
  gloomcap: { kind: 'inkcap', k: 1, size: [44, 56], body: [30, 48], cap: '#3a2a4a', flake: '#6a5a80', ink: '#140e1c', gill: '#8a7a98', stalk: '#c8c0d4', eye: '#e8b8ff', spore: '#b88aff' },
  // the beetles
  cinderBeetle: { kind: 'lavabeetle', k: 1, size: [56, 46], body: [42, 30], shell: '#2a2226', rim: '#46383c', crack: '#ff7a1a', hot: '#ffd060', jaw: '#5a1a12', leg: '#1e181a', eye: '#ffe060' },
  // the wisps
  lanternWisp: { kind: 'lantern', size: [40, 50], body: [26, 42], paper: '#ffe8a0', rib: '#d8a050', gold: '#e8b040', flame: '#ff9a2a', tassel: '#c83a2a', wing: '#fff4dc', face: '#6a3a10' },
  shadeWisp: { kind: 'shade', size: [40, 48], body: [24, 40], smoke: '#4a2a6a', core: '#22122e', tail: '#3a2050', eye: '#f0dcff', mote: '#7a4aa8' },
  emberWisp: { kind: 'ember', size: [42, 52], body: [26, 44], outer: '#d8301a', mid: '#ff7a1a', inner: '#ffd040', white: '#fff6d0', face: '#3a0a04' },
};

const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function variantSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => variantFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}
function variantFrame(id, dir, anim, f) {
  if (dir === 'left') return variantFrame(id, 'right', anim, f).mirror();
  const P = VARIANTS[id], [W, H] = P.size;
  const F = new Frame(W, H), k = P.k || 1, cx = W / 2, G = H - 3;
  // drawing in k-scaled measures: x out from the middle, y up from the ground
  const X = (x) => cx + x * k, Y = (y) => G - y * k, w = (n) => Math.max(1, Math.round(n * k));
  const D = {
    el: (x, y, rx, ry) => ellipse(X(x), Y(y), rx * k, ry * k),
    ln: (x0, y0, x1, y1, n = 1) => line(X(x0), Y(y0), X(x1), Y(y1), w(n)),
    pg: (pts) => poly(pts.map(([x, y]) => [X(x), Y(y)])),
    dot: (x, y, c) => F.dot(X(x), Y(y), c),
    rc: (x0, y0, x1, y1) => rect(Math.round(X(x0)), Math.round(Y(y1)), Math.round(X(x1)), Math.round(Y(y0))),
  };
  const a = { walk: anim === 'walk', f, step: anim === 'walk' ? [1, 0, -1, 0][f] : 0, atk: anim === 'attack' ? f : -1, side: dir === 'right', back: dir === 'up' };
  ({ skipper, radish, swimcrab, inkcap, lavabeetle, lantern, shade, ember })[P.kind](F, P, D, a);
  return F;
}

// ---------- the Mudskipper: a fish that hops on the mud, propped on its fins ----------
function skipper(F, P, D, { walk, f, atk, side, back }) {
  const flick = walk ? [0, 2, 3, 1][f] : atk >= 0 ? [0, 1, 2, 1][atk] : 0, gape = atk >= 1 && atk <= 2 ? 1.6 : 0.4, lunge = atk >= 0 ? [0, 1, 3, 1][atk] : 0;
  const sail = (x0, x1, y0, h) => { // the fin along its back, spiny, spotted bright blue
    const n = 5, pts = [[x0, y0]];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y0 + h * Math.sin(Math.PI * (0.15 + t * 0.7)) + (i % 2 ? 0 : 1.2)]); }
    pts.push([x1, y0]);
    F.part(D.pg(pts), P.fin);
    for (let i = 1; i < n; i++) { const t = i / n; F.part(D.ln(x0 + (x1 - x0) * t, y0, x0 + (x1 - x0) * t, y0 + h * 0.8, 1), dark(P.fin), flat); D.dot(x0 + (x1 - x0) * t + 1, y0 + h * 0.45, P.finSpot); }
  };
  if (side) {
    const tx = -14 - flick * 0.3, ty = 4 + flick; // the tail, flicking up as it hops
    F.part(D.pg([[-6, 4], [tx, ty + 1], [tx - 5, ty + 5], [tx - 4, ty - 2], [tx, ty - 1], [-6, 1]]), P.skin);
    F.part(D.pg([[tx, ty + 1], [tx - 5, ty + 5], [tx - 4, ty - 2]]), P.fin);
    sail(-6, 6, 9, 6);
    F.part(D.el(1 + lunge, 5, 12, 5), P.skin);
    F.part(D.el(2 + lunge, 3, 9, 2), P.belly, flat);
    for (const [x, y] of [[-6, 7], [-2, 8], [3, 7], [-4, 5], [6, 6]]) D.dot(x + lunge, y, P.spot);
    F.part(D.pg([[2 + lunge, 3], [7 + lunge, 0], [-1 + lunge, 0]]), P.fin); // a fin it walks on
    F.part(D.el(10 + lunge, 9.5, 2.6, 2.6), P.skin); // an eye bulging on top of its head
    F.part(D.el(10.5 + lunge, 10, 1.6, 1.6), P.eye, flat); D.dot(11 + lunge, 10, P.pupil);
    F.part(D.pg([[12 + lunge, 4 + gape], [14 + lunge, 4], [12 + lunge, 3 - gape]]), P.mouth, flat); // its wide mouth
    return;
  }
  // from in front or behind: a broad blunt head, the fins propping it up, the sail standing behind
  sail(-7, 7, 8, 7 + flick * 0.5);
  for (const s of [-1, 1]) F.part(D.pg([[s * 6, 4], [s * 13, 0], [s * 12, 4], [s * 8, 7]]), P.fin); // the fins it walks on
  F.part(D.el(0, 6, 11, 6), P.skin);
  for (const [x, y] of [[-7, 8], [-3, 10], [4, 9], [8, 7], [0, 8]]) D.dot(x, y, P.spot);
  if (back) { F.part(D.pg([[-3, 2], [3, 2], [5 + flick, -1], [-5 - flick, -1]]), P.fin); return; } // its tail, behind
  F.part(D.el(0, 3.5, 8, 2.6), P.belly, flat);
  F.part(D.el(0, 4 - gape * 0.5, 6, 0.8 + gape), P.mouth, flat); // a wide, wide mouth
  for (const s of [-1, 1]) { F.part(D.el(s * 4, 11.5, 3, 3), P.skin); F.part(D.el(s * 4, 12, 2, 2), P.eye, flat); D.dot(s * 4 + s * 0.5, 12, P.pupil); } // eyes on top, bulging
}

// ---------- the Red Sprout: a red radish brawler ----------
function radish(F, P, D, { step, walk, f, atk, side, back }) {
  const bob = walk && f % 2 ? 1 : 0, punch = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const by = 13 + bob;
  // stubby root legs
  for (const s of side ? [-1, 1] : [-1, 1]) { const lx = s * 4 + (side ? s * step * 2 : 0); F.part(D.pg([[lx - 2, by - 6], [lx + 2, by - 6], [lx + 1.5, 0], [lx - 1.5, 0]]), s < 0 && side ? dark(P.root) : P.root); }
  // the leaves, out of its top: one up, two out
  const leaf = (x0, y0, ang, len, wid) => {
    const c = Math.cos(ang), s = Math.sin(ang), tip = [x0 + c * len, y0 + s * len];
    const m = (t, o) => [x0 + c * len * t - s * o, y0 + s * len * t + c * o];
    F.part(D.pg([[x0, y0], m(0.3, wid * 0.8), m(0.55, wid), m(0.8, wid * 0.6), tip, m(0.8, -wid * 0.6), m(0.55, -wid), m(0.3, -wid * 0.8)]), P.leaf);
    F.part(D.ln(x0, y0, x0 + c * len * 0.85, y0 + s * len * 0.85, 1), P.vein, flat);
  };
  const ly = by + 9;
  if (side) { leaf(-1, ly, 1.95, 13, 3.2); leaf(0, ly, 1.45, 15, 3.4); }
  else { leaf(-1, ly, 2.25, 12, 3.2); leaf(1, ly, 0.9, 12, 3.2); leaf(0, ly, 1.57, 15, 3.4); }
  // the arms behind (side: the far one)
  const fist = (s, near) => {
    const sx = s * 9, hx = side ? 6 + punch : s * (11 + (atk >= 0 ? 1 : 0)), hy = by - 1 + (side ? 0 : punch);
    F.part(D.ln(sx * (side ? 0.3 : 1), by + 2, hx, hy, 1.4), near ? P.root : dark(P.root));
    F.part(D.el(hx, hy, 2.2, 2.2), near ? P.root : dark(P.root));
  };
  if (side) fist(-1, false);
  // the bulb: deep red, ribbed, a root tail under it
  F.part(D.el(side ? 1 : 0, by, 10, 9.5), P.bulb);
  for (const x of side ? [-3, 2] : [-5, 0, 5]) F.part(D.ln(x * 0.9, by + 7, x * 1.1, by - 6, 1), P.rib, flat);
  F.part(D.el(-4, by + 4, 3, 2), light(P.bulb), flat);
  if (back) { fist(-1, true); fist(1, true); return; }
  // its face: furious
  const fx = side ? 5 : 0;
  for (const s of side ? [1] : [-1, 1]) {
    const ex = fx + s * (side ? 0 : 3.5);
    F.part(D.el(ex, by + 1.5, 1.8, 1.8), '#ffffff', flat); F.part(D.el(ex + (side ? 0.6 : -s * 0.3), by + 1.2, 0.8, 0.9), P.eye, flat);
    F.part(D.ln(ex + (side ? -2 : s * 2.2), by + 5.5, ex + (side ? 1.5 : -s * 0.6), by + 4, 1), P.eye, flat); // a scowl, brows down to the middle
  }
  F.part(D.rc(fx - 2.5, by - 3.5, fx + 2.5, by - 2.5), P.eye, flat); // gritted teeth
  F.part(D.ln(fx - 1.5, by - 3, fx + 1.5, by - 3, 1), '#f0e8e0', flat);
  if (side) fist(1, true); else { fist(-1, true); fist(1, true); }
}

// ---------- the Blue Crab: a broad swimming crab, spined, one great claw ----------
function swimcrab(F, P, D, { step, walk, f, atk, side, back }) {
  const snap = atk >= 0 ? [0, 3, 5, 1][atk] : 0, open = atk === 1 || atk === 2 ? 1.6 : walk ? (f % 2) * 0.6 : 0.4;
  const cy = 9 + (walk && f % 2 ? 0.5 : 0);
  const legs = (s, n0) => { for (let i = 0; i < 3; i++) { const lx = s * (5 + i * 3.5), ph = (i + (walk ? f : 0)) % 2 ? 1 : 0; F.part(both(D.ln(lx, cy - 1, lx + s * 4, cy + 1 + ph, 1.2), D.ln(lx + s * 4, cy + 1 + ph, lx + s * 6, 0, 1)), n0 ? P.leg : dark(P.leg)); } };
  const claw = (x, y, big, s) => { // an arm, then the pincer, its tips pale
    const r = big ? 4.2 : 2.6;
    F.part(D.ln(x - s * (big ? 5 : 4), y - 3, x, y, big ? 2.2 : 1.4), P.claw);
    F.part(D.el(x, y, r, r * 0.8), P.claw);
    F.part(D.pg([[x - r * 0.5, y + r * 0.4], [x + s * r * 1.8, y + r * 0.6 + open], [x + s * r * 0.6, y]]), P.claw);
    F.part(D.pg([[x - r * 0.5, y - r * 0.2], [x + s * r * 1.7, y - r * 0.4 - open], [x + s * r * 0.6, y]]), P.claw);
    F.part(both(D.ln(x + s * r * 1.3, y + r * 0.5 + open, x + s * r * 1.8, y + r * 0.6 + open, 1), D.ln(x + s * r * 1.2, y - r * 0.3 - open, x + s * r * 1.7, y - r * 0.4 - open, 1)), P.tip, flat);
  };
  if (side) {
    legs(-1, false); legs(1, true);
    F.part(D.el(0, cy + 1, 10, 5.5), P.shell);
    F.part(D.el(-1, cy + 3, 7, 2.2), P.top, flat);
    F.part(D.pg([[-9, cy + 2], [-14, cy + 3], [-9, cy]]), P.shell); // its spine
    for (const x of [6, 8]) { F.part(D.ln(x, cy + 3, x + 1, cy + 7, 1), P.shell); F.part(D.el(x + 1, cy + 7.5, 1, 1), P.eye, flat); }
    claw(11 + snap, cy + 2 + snap * 0.3, true, 1);
    return;
  }
  legs(-1, true); legs(1, true);
  if (back) { // the paddles at its back, flat as oars
    for (const s of [-1, 1]) { F.part(D.ln(s * 6, cy - 2, s * 9, cy - 6, 1.2), P.leg); F.part(D.el(s * 10, cy - 6.5, 2.4, 1.4), P.leg); }
  }
  // the shell: broad, a long spine out to each side, darker spots
  // (seen from above and in front, its broad top shows)
  F.part(D.pg([[-17, cy + 4], [-12, cy + 10], [0, cy + 12.5], [12, cy + 10], [17, cy + 4], [11, cy - 2], [0, cy - 3.5], [-11, cy - 2]]), P.shell);
  F.part(D.el(0, cy + 6, 9.5, 4.2), P.top, flat);
  F.part(both(D.ln(-6, cy + 2, -2, cy + 6, 1), D.ln(6, cy + 2, 2, cy + 6, 1)), P.spot, flat); // the grooves on its back
  for (const x of [-9, -4, 4, 9]) D.dot(x, cy + 7 + (x % 3), P.spot);
  if (back) return;
  for (const s of [-1, 1]) { F.part(D.ln(s * 3, cy + 1, s * 3.5, cy + 4, 1), P.shell); F.part(D.el(s * 3.5, cy + 4.5, 1.2, 1.2), P.eye, flat); D.dot(s * 3.5 - 0.4, cy + 5, '#ffffff'); } // eyes on stalks at its front
  // the great claw on one side, the little one on the other, raised to snap
  claw(-12, cy + 4 + snap * 0.6, true, -1);
  claw(11, cy + 3 + snap * 0.3, false, 1);
}

// ---------- the Dark Mushroom: a drooping ink cap, dripping, eyes glowing beneath ----------
function inkcap(F, P, D, { step, walk, f, atk, side, back }) {
  const sway = walk ? [0, 1, 0, -1][f] : 0, puff = atk >= 0 ? [0, 2, 3, 1][atk] : 0;
  // the stalk on little root-feet, a ragged ring round it
  for (const s of [-1, 1]) F.part(D.el(s * 3 + (side ? s * step : 0), 1, 2.6, 1.4), dark(P.stalk));
  F.part(D.pg([[-4, 1], [4, 1], [3, 17], [-3, 17]]), P.stalk);
  F.part(D.pg([[-5, 13], [5, 13], [6, 10], [4, 11], [2, 9.5], [0, 11], [-2, 9.5], [-4, 11], [-6, 10]]), light(P.stalk));
  if (!back) { // eyes glowing in the stalk's shadow, a thin frown
    const fx = side ? 2 : 0;
    for (const s of side ? [1] : [-1, 1]) { F.part(D.el(fx + s * (side ? 0 : 2), 11 - puff * 0.3, 1.1, 1.5), P.eye, flat); }
    F.part(D.ln(fx - 1.5, 7, fx + 1.5, 7.5, 1), dark(P.stalk), flat);
  }
  // the cap: a tall drooping bell, ink dripping from its ragged edge, flakes on it
  const top = 37 - puff, lean = sway + (side ? 1 : 0);
  F.part(D.pg([[-13 + lean * 0.3, 15], [-11, 22], [-8 + lean * 0.6, 31], [-3 + lean, top], [3 + lean, top], [8 + lean * 0.6, 31], [11, 22], [13 + lean * 0.3, 15]]), P.cap);
  if (!back) for (let x = -11; x <= 11; x += 2.5) F.part(D.ln(x * 0.8, 16, x * 0.85, 13.5, 1), P.gill, flat); // the gills under its rim
  for (let i = 0; i < 8; i++) { const x = -12 + i * 3.4, len = 2 + ((i * 7 + f) % 4); F.part(D.ln(x, 15, x + 0.3, 15 - len, 1), P.ink, flat); D.dot(x + 0.3, 14 - len - 1, P.ink); } // ink drips
  for (const [x, y] of [[-6, 22], [2, 26], [6, 20], [-2, 31], [-8, 18], [4, 32]]) F.part(D.el(x + lean * 0.5, y, 1.2, 0.8), P.flake, flat);
  if (atk >= 1) for (let i = 0; i < 6; i++) { const a2 = i * 1.05 + f; D.dot(Math.cos(a2) * (8 + puff * 2), top - 2 + Math.sin(a2) * 4 + puff, P.spore); } // a puff of spores
}

// ---------- the Fire Beetle: black, cracked with magma, stag jaws ----------
function lavabeetle(F, P, D, { step, walk, f, atk, side, back }) {
  const bite = atk >= 0 ? [0, 2, -1, 1][atk] : 0, cy = 10 + (walk && f % 2 ? 0.5 : 0);
  const cracks = (pts) => { for (let i = 0; i < pts.length - 1; i++) F.part(D.ln(...pts[i], ...pts[i + 1], 1), P.crack, flat); for (const [x, y] of pts.slice(1, -1)) D.dot(x, y, P.hot); };
  const embers = () => { for (let i = 0; i < 3; i++) D.dot(-6 + i * 6 + (f % 2), cy + 12 + ((i * 4 + f * 3) % 9), i === 1 ? P.hot : P.crack); };
  if (side) {
    for (const [x, s] of [[-6, -1], [-1, 1], [4, -1]]) F.part(both(D.ln(x, cy - 2, x + s * step * 1.5 - 2, cy - 5, 1.2), D.ln(x + s * step * 1.5 - 2, cy - 5, x + s * step * 1.5 - 1, 0, 1)), dark(P.leg));
    F.part(D.el(-1, cy + 2, 13, 8.5), P.shell);
    F.part(D.ln(-13, cy + 1, 11, cy + 1, 1), P.rim, flat);
    cracks([[-11, cy + 5], [-6, cy + 7], [-2, cy + 4], [3, cy + 8], [8, cy + 5]]);
    F.part(D.el(12, cy, 4.5, 4), P.shell); // the head
    D.dot(13, cy + 1.5, P.eye); D.dot(14, cy + 1.5, P.eye);
    F.part(both(D.ln(15, cy, 20 + bite, cy + 2, 1.4), D.ln(20 + bite, cy + 2, 22 + bite, cy - 1, 1)), P.jaw); // a jaw, curving
    for (const [x, s] of [[-5, 1], [0, -1], [5, 1]]) F.part(both(D.ln(x, cy - 3, x + s * step * 1.5 + 2, cy - 5, 1.2), D.ln(x + s * step * 1.5 + 2, cy - 5, x + s * step * 1.5 + 3, 0, 1)), P.leg);
    embers();
    return;
  }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const lx = s * (7 + i * 2), ph = (i + (walk ? f : 0)) % 2; F.part(both(D.ln(lx, cy, lx + s * 5, cy - 3 + ph, 1.2), D.ln(lx + s * 5, cy - 3 + ph, lx + s * 6, 0, 1)), P.leg); }
  F.part(D.el(0, cy + 3, 13, 9), P.shell);
  F.part(D.ln(0, cy + 12, 0, cy - 5, 1), P.crack, flat); // the seam down its back, glowing
  for (const s of [-1, 1]) cracks([[s * 2, cy + 9], [s * 6, cy + 6], [s * 4, cy + 2], [s * 9, cy - 1], [s * 11, cy + 2]]);
  if (!back) {
    F.part(D.el(0, cy - 3, 6, 3.6), P.shell); // the head, in front
    for (const s of [-1, 1]) { D.dot(s * 2.5, cy - 2, P.eye); D.dot(s * 3, cy - 2, P.eye); }
    for (const s of [-1, 1]) F.part(both(D.ln(s * 4, cy - 4, s * (8 - bite), cy - 7, 1.4), D.ln(s * (8 - bite), cy - 7, s * (4 - bite), cy - 9, 1)), P.jaw); // stag jaws, closing on a bite
  }
  embers();
}

// ---------- the Lantern Wisp: a paper lantern, a flame for a heart, little moth wings ----------
function lantern(F, P, D, { walk, f, atk }) {
  const bob = [0, 1, 2, 1][f % 4] * (walk || atk >= 0 ? 1 : 0.5), y = 24 + bob, flick = f % 2;
  for (const s of [-1, 1]) F.part(D.pg([[s * 8, y + 3], [s * 15, y + 9 - flick * 2], [s * 16, y + 3], [s * 12, y - 1]]), P.wing); // the wings
  F.part(D.ln(0, y + 12, 0, y + 14, 1), P.gold); // the handle, a loop
  F.part(both(D.ln(-3, y + 14, 0, y + 17, 1), D.ln(0, y + 17, 3, y + 14, 1)), P.gold, flat);
  F.part(D.el(0, y, 9, 11), P.paper);
  F.part(D.el(0, y - 1, 5 + flick, 6 + flick), light(P.paper), flat); // the flame's light through the paper
  F.part(D.el(0, y - 3, 2.2, 3.2), P.flame, flat);
  for (const x of [-6, -2.5, 2.5, 6]) F.part(D.ln(x, y + 10, x * 1.05, y - 10, 1), P.rib, flat);
  F.part(D.rc(-5, y + 10, 5, y + 12), P.gold);
  F.part(D.rc(-4, y - 12, 4, y - 10), P.gold);
  F.part(both(D.ln(0, y - 12, 0, y - 15, 1), D.ln(-1, y - 15, 1, y - 15, 1)), P.tassel, flat); // the tassel
  F.part(both(D.ln(-1, y - 15, -1.5, y - 19, 1), D.ln(1, y - 15, 1.5, y - 19, 1)), P.tassel, flat);
  // a happy face painted on the paper
  F.part(both(D.ln(-4.5, y + 3, -3, y + 4, 1), D.ln(-3, y + 4, -1.5, y + 3, 1), D.ln(1.5, y + 3, 3, y + 4, 1), D.ln(3, y + 4, 4.5, y + 3, 1)), P.face, flat);
  F.part(both(D.ln(-2, y, 0, y - 1.5, 1), D.ln(0, y - 1.5, 2, y, 1)), P.face, flat);
}

// ---------- the Dark Wisp: a wisp of violet smoke, hollow glowing eyes, a ragged tail ----------
function shade(F, P, D, { walk, f, atk }) {
  const bob = [0, 1, 2, 1][f % 4], y = 22 + bob, lunge = atk >= 0 ? [0, 1, 3, 1][atk] : 0;
  for (let i = 0; i < 6; i++) { const t = i / 5; F.part(D.el(Math.sin(t * 3 + f) * 3 + t * 4, y - 6 - t * 12, 5 - t * 4, 3.5 - t * 2.5), P.tail, { outline: i < 3 }); } // the tail, curling away
  F.part(D.pg([[-9, y + 1], [-7, y + 9], [-4, y + 14 + (f % 2)], [-2, y + 10], [0, y + 16 - (f % 2)], [2, y + 10], [5, y + 14], [7, y + 8], [9, y + 1], [6, y - 7], [0, y - 9], [-6, y - 7]]), P.smoke);
  F.part(D.el(0, y, 5.5, 6), P.core, flat);
  for (const s of [-1, 1]) F.part(D.pg([[s * 1.5, y + 3 + lunge * 0.3], [s * 5, y + 5], [s * 5, y + 2], [s * 2, y + 1]]), P.eye, flat); // hollow eyes, slanted
  F.part(D.el(0, y - 3, 1.5 + lunge * 0.4, 1 + lunge * 0.5), P.eye, flat); // a mouth that opens to strike
  for (let i = 0; i < 3; i++) { const a2 = f * 0.9 + i * 2.1; F.part(D.el(Math.cos(a2) * 12, y + Math.sin(a2) * 7, 1.2, 1.2), P.mote, { outline: false }); }
}

// ---------- the Fire Wisp: a living flame, horns of fire, a grin of light ----------
function ember(F, P, D, { f, atk }) {
  const fl = [0, 1, -1, 2][f % 4], y = 12, rage = atk >= 0 ? [0, 2, 4, 1][atk] : 0;
  const flame = (sc, col) => F.part(D.pg([[-10 * sc, y + 4], [-11 * sc, y + 12], [-8 * sc, y + 22 + fl], [-6 * sc, y + 17], [-4 * sc, y + 28 + rage - fl], [-1 * sc, y + 22], [0, y + 25 - fl], [1 * sc, y + 22], [4 * sc, y + 28 + rage + fl], [6 * sc, y + 17], [8 * sc, y + 22 - fl], [11 * sc, y + 12], [10 * sc, y + 4], [5 * sc, y - 1], [0, y - 7 + fl], [-5 * sc, y - 1]]), col);
  flame(1, P.outer);
  flame(0.72, P.mid);
  F.part(D.el(0, y + 8, 5, 7), P.inner, flat);
  F.part(D.el(0, y + 6, 2.4, 3.4), P.white, flat);
  for (const s of [-1, 1]) F.part(D.pg([[s * 2, y + 12], [s * 6, y + 14 + rage * 0.3], [s * 5, y + 11]]), P.face, flat); // fierce slit eyes
  F.part(D.pg([[-4, y + 6], [4, y + 6], [2.5, y + 3], [0, y + 4.5], [-2.5, y + 3]]), P.face, flat); // a jagged grin
  for (let i = 0; i < 4; i++) D.dot(-9 + i * 6, y + 30 + ((i * 5 + f * 3) % 8), i % 2 ? P.inner : P.mid);
}
