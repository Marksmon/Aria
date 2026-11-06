// The Sunken Galleon (the third dungeon, Base 85-99, the owner's call): its monsters painted pixel by pixel in code, each
// a kind of its own. Floor 1: Conches, great spiral shells on a slug's foot, eyes on stalks; Puffer Fish, round and
// spined, swelling to strike; Zombies, drowned sailors, bloated and weed-hung. Floor 2: Pirate Skeletons with cutlasses
// and bandanas; Blowgun Pirates, gaunt dead men shooting poison darts; Octopuses, red, eight arms curling. Floor 3:
// Ghosts, drowned sailors' spirits, pale and see-through (Ghost: no Neutral blow touches them); Skeleton Assassins,
// hooded, two curved knives; and the Kraken, the mini-boss (the owner's sheet: dark blue, a crown of bronze coral
// spikes, glowing eyes, bioluminescent markings, a crystal core on its head, tentacles pale-suckered). The captain's
// hold: Hydras, three-headed sea serpents, and Davy Jones, the Forsaken Captain (the owner's sheet: a tricorn, a beard
// of tentacles, glowing blue eyes, a long dark coat hung with chains, a red sash, a great anchor in his hand, the
// drowned sea swirling round him; Ghost).
// Frames: 4 directions (down, up, right; left is right mirrored) x idle (1), walk (4) and attack (4).
import { Frame, ellipse, rect, poly, line, both, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
export const GALLEON = {
  // floor 1 (85-88)
  conch: { kind: 'conch', size: [52, 46], body: [40, 34], shell: '#e8c8a0', band: '#c87a4a', lip: '#f0a0a8', foot: '#8a9a8a', eye: '#1a1a14', spike: '#f6e6cc' },
  pufferFish: { kind: 'puffer', size: [48, 46], body: [32, 32], skin: '#c8b060', belly: '#f0e8c0', spot: '#5a4a2a', spine: '#f6f0d8', fin: '#e89a40', eye: '#1a1408', lip: '#d87a5a' },
  zombie: { kind: 'zombie', size: [48, 64], body: [24, 58], skin: '#8a9a7a', shade: '#6a7a5c', shirt: '#d8d0c0', stripe: '#3a4a6a', pants: '#4a3a2e', weed: '#3a6a4a', eye: '#e8f070', mouth: '#2a1a14' },
  // floor 2 (89-92)
  pirateSkeleton: { kind: 'skeleton', size: [48, 64], body: [24, 58], bone: '#e6e0cc', dark: '#2a2420', coat: '#4a2e2a', trim: '#c8a04a', cloth: '#a82a2a', blade: '#c8ccd4', eye: '#ffb04a' },
  blowgunPirate: { kind: 'blower', size: [52, 62], body: [24, 56], skin: '#9a8a6a', shade: '#7a6a4e', wrap: '#5a4a3a', vest: '#3a4a3a', sash: '#6a2a3a', pipe: '#8a6a3a', dart: '#9aff6a', eye: '#d8ff9a' },
  octopus: { kind: 'octopus', size: [56, 48], body: [42, 36], skin: '#c8483a', spot: '#8a2a24', sucker: '#f2c8b0', eye: '#f2d84a', pupil: '#1a1008' },
  // floor 3 (93-96)
  ghost: { kind: 'ghost', size: [44, 60], body: [26, 50], mist: '#8adcd4', pale: '#c8f4ee', dark: '#3a7a7a', eye: '#f2fffe', mouth: '#1e4a4a' },
  skeletonAssassin: { kind: 'skeleton', assassin: true, size: [52, 58], body: [26, 50], bone: '#d8d2be', dark: '#1e1a20', coat: '#24202e', trim: '#5a4a6a', cloth: '#3a2a4a', blade: '#d8dce4', eye: '#ff3a4a' },
  // the captain's hold (97-99)
  hydra: { kind: 'hydra', size: [72, 66], body: [52, 56], scale: '#2e7a7a', belly: '#c8e0b0', fin: '#5ac8c0', eye: '#ffe060', mouth: '#7a2a2a', spine: '#1e5a5a' },
  // the mini-boss and the MVP
  kraken: { kind: 'kraken', size: [150, 124], body: [84, 84], skin: '#22306a', deep: '#141c44', sucker: '#c8b8e8', glow: '#5ad8ff', coral: '#c89a5a', coral2: '#8a6a3a', eye: '#9af0ff', core: '#7ae8ff' },
  davyJones: { kind: 'davy', size: [104, 132], body: [66, 120], coat: '#1e2436', coat2: '#2e3650', sash: '#7a1e22', hat: '#14161e', trim: '#a8843a', skin: '#5a7a7a', tent: '#b8ccc4', tent2: '#7a948c', chain: '#8a8e96', anchor: '#3a3a40', rust: '#7a4a2a', eye: '#7af0ff', water: '#3aa8d8', foam: '#c8f4ff' },
  // his third phase, the Abyssal King (the owner's sheet: he becomes a colossal sea horror)
  davyAbyss: { kind: 'abyss', size: [180, 170], body: [120, 150], deep: '#1a2a4a', coat: '#1e2436', coat2: '#2e3650', sash: '#7a1e22', hat: '#14161e', trim: '#a8843a', skin: '#5a7a7a', tent: '#b8ccc4', tent2: '#7a948c', chain: '#8a8e96', anchor: '#3a3a40', rust: '#7a4a2a', eye: '#7af0ff', water: '#3aa8d8', foam: '#c8f4ff' },
};

const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function galleonSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => galleonFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}
function galleonFrame(id, dir, anim, f) {
  if (dir === 'left') return galleonFrame(id, 'right', anim, f).mirror();
  const P = GALLEON[id], [W, H] = P.size;
  const F = new Frame(W, H);
  const a = { G: H - 3, W, walk: anim === 'walk', f, step: anim === 'walk' ? [1, 0, -1, 0][f] : 0, atk: anim === 'attack' ? f : -1, side: dir === 'right', back: dir === 'up' };
  ({ conch, puffer, zombie, skeleton, blower, octopus, ghost, hydra, kraken, davy, abyss })[P.kind](F, P, a);
  return F;
}

// ---------- Conches: a great spiral shell, spiked, on a slug's foot, eyes on stalks ----------
function conch(F, P, { G, W, walk, f, atk, side, back }) {
  const cx = W / 2, creep = walk ? [0, 1, 0, -1][f] : 0, lunge = atk >= 0 ? [0, 2, 4, 1][atk] : 0;
  F.part(ellipse(cx + (side ? 4 + lunge : 0), G - 3, side ? 16 : 13, 3.5), P.foot); // the foot
  const sx = cx + (side ? -3 : 0) + creep * 0.5, sy = G - 14;
  // the shell: a cone of whorls, spiked along each, the pink lip open towards you
  const whorls = [[0, 0, 15, 10], [side ? -3 : 0, -8, 12, 7], [side ? -6 : 0, -14, 8, 5], [side ? -8 : 0, -19, 5, 3.5]];
  for (const [dx, dy, rx, ry] of whorls) {
    F.part(ellipse(sx + dx, sy + dy, rx, ry), P.shell);
    F.part(line(sx + dx - rx + 2, sy + dy + 1, sx + dx + rx - 2, sy + dy - 1, 1), P.band, flat);
    for (let k = -1; k <= 1; k += 2) F.part(poly([[sx + dx + k * rx * 0.6 - 1.5, sy + dy - ry + 1], [sx + dx + k * rx * 0.6 + 1.5, sy + dy - ry + 1], [sx + dx + k * rx * 0.7, sy + dy - ry - 3]]), P.spike);
  }
  F.part(poly([[sx + dx(side) - 2, sy - 22], [sx + dx(side) + 2, sy - 22], [sx + dx(side), sy - 28]]), P.spike); // the tip
  if (!back) {
    F.part(ellipse(sx + (side ? 9 : 0), sy + 4, side ? 4 : 8, 5), P.lip); // the open lip
    F.part(ellipse(sx + (side ? 10 : 0), sy + 5, side ? 2 : 5, 3), dark(P.lip), flat);
    for (const s of side ? [1] : [-1, 1]) { // eyes on stalks, peering out of the shell
      const ex = cx + (side ? 12 + lunge : s * 5), ey = G - 10 - lunge * 0.5;
      F.part(line(ex - (side ? 3 : 0), G - 5, ex, ey, 1), P.foot);
      F.part(ellipse(ex, ey - 1, 1.6, 1.6), '#f0f0e0'); F.dot(ex + (side ? 0.5 : 0), ey - 1, P.eye);
    }
  }
}
const dx = (side) => (side ? -9 : 0);

// ---------- Puffer Fish: round and spined, swelling up to strike, fins whirring ----------
function puffer(F, P, { G, W, walk, f, atk, side, back }) {
  const cx = W / 2, puff = atk >= 0 ? [0, 2, 4, 1][atk] : 0, bob = [0, 1, 2, 1][f % 4] * (walk ? 1 : 0.5);
  const r = 10 + puff, cy = G - 18 - bob;
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92; F.part(poly([[x - 1.2, y], [x + 1.2, y], [cx + Math.cos(a) * (r + 4 + puff * 0.5), cy + Math.sin(a) * (r + 4 + puff * 0.5) * 0.92]]), P.spine); } // spines
  F.part(ellipse(cx, cy, r, r * 0.92), P.skin);
  if (!back) F.part(ellipse(cx + (side ? 2 : 0), cy + 4, r * 0.75, r * 0.5), P.belly, flat);
  for (const [x, y] of [[-5, -6], [3, -7], [-1, -3], [6, -3], [-7, -1]]) F.dot(cx + x, cy + y, P.spot);
  if (side) {
    F.part(poly([[cx - r, cy], [cx - r - 7, cy - 4 - (f % 2)], [cx - r - 7, cy + 4 + (f % 2)]]), P.fin); // the tail
    F.part(ellipse(cx + 4, cy - 2, 2.4, 2.4), '#f6f0e0'); F.part(ellipse(cx + 5, cy - 2, 1.2, 1.4), P.eye, flat);
    F.part(ellipse(cx + r, cy + 1, 2, 1.6), P.lip);
    F.part(poly([[cx - 2, cy + 2], [cx + 2, cy + 7 + (f % 2)], [cx - 4, cy + 5]]), P.fin); // a fin whirring
    return;
  }
  for (const s of [-1, 1]) F.part(poly([[cx + s * r, cy], [cx + s * (r + 5), cy - 3 + (f % 2) * 2], [cx + s * (r + 4), cy + 3]]), P.fin);
  if (back) { F.part(poly([[cx - 3, cy - r], [cx + 3, cy - r], [cx, cy - r - 4]]), P.fin); return; }
  for (const s of [-1, 1]) { F.part(ellipse(cx + s * 4, cy - 2, 2.6, 2.6), '#f6f0e0'); F.part(ellipse(cx + s * 4, cy - 1.5, 1.3, 1.5), P.eye, flat); }
  F.part(ellipse(cx, cy + 4, 2.2 + puff * 0.3, 1.6 + puff * 0.3), P.lip); // a pout
  F.part(ellipse(cx, cy + 4, 1, 0.6 + puff * 0.2), dark(P.lip), flat);
}

// ---------- Zombies: drowned sailors, bloated, a striped shirt in tatters, weed hanging off them ----------
function zombie(F, P, { G, W, step, walk, f, atk, side, back }) {
  const cx = W / 2, lurch = walk ? [0, 1, 0, -1][f] : 0, grab = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const hip = G - 20, sh = G - 38, hy = G - 46 + Math.abs(lurch);
  for (const s of [-1, 1]) { const lx = cx + s * 4 + (side ? s * step * 2 : 0); F.part(rect(lx - 2.5, hip, lx + 2.5, G - 4), P.pants); F.part(rect(lx - 3, G - 4, lx + 2, G), P.shade); }
  F.part(poly([[cx - 8, sh], [cx + 8, sh], [cx + 9, hip + 2], [cx - 9, hip + 2]]), P.shirt);
  for (let y = sh + 3; y < hip; y += 4) F.part(line(cx - 8, y, cx + 8, y, 1), P.stripe, flat);
  for (const [x0, y0] of [[-6, hip + 2], [2, hip + 1], [7, sh + 6]]) F.part(poly([[cx + x0 - 1, y0], [cx + x0 + 2, y0], [cx + x0 + 1, y0 + 4], [cx + x0 - 1, y0 + 3]]), P.skin); // torn through
  for (const x of [-7, 1, 6]) F.part(line(cx + x, sh + 1, cx + x + 1, sh + 9 + (x % 3), 1), P.weed, flat); // weed hanging
  // arms reaching out, the near one grabbing
  for (const s of side ? [1] : [-1, 1]) {
    const ax = cx + s * (side ? 2 : 9), ay = sh + 3;
    const hx = side ? cx + 13 + grab : cx + s * 11, hy2 = side ? sh + 7 - grab * 0.3 : sh + 13 - grab;
    F.part(line(ax, ay, hx, hy2, 3), s < 0 ? P.shade : P.skin);
    for (let k = -1; k <= 1; k++) F.part(line(hx, hy2 + k, hx + (side ? 3 : 0), hy2 + k + (side ? 0 : 3), 1), P.skin, flat); // fingers
  }
  // the head, sagging to one side, a jaw hanging
  const hx = cx + (side ? 2 : 0) + lurch;
  F.part(ellipse(hx, hy, 6, 6.5), P.skin);
  F.part(ellipse(hx - 2, hy - 4, 4, 2.5), P.weed); // weed over the scalp
  if (back) return;
  for (const s of side ? [1] : [-1, 1]) F.part(ellipse(hx + (side ? 3 : s * 2.5), hy - 0.5, 1.3, 1.3), P.eye, flat);
  F.part(rect(hx + (side ? 2 : -2), hy + 3, hx + (side ? 5 : 2), hy + 5 + (atk >= 1 ? 1 : 0)), P.mouth, flat);
}

// ---------- skeletons: the Pirate Skeleton (a bandana, a red sash, a cutlass) and the Skeleton Assassin (hooded,
// crouched, a curved knife in each hand, red eyes in the dark of the hood) ----------
function skeleton(F, P, { G, W, step, walk, f, atk, side, back }) {
  const cx = W / 2, A = !!P.assassin, crouch = A ? 4 : 0, rattle = walk ? [0, -1, 0, -1][f] : 0;
  const hip = G - 20 + crouch + rattle, sh = G - 38 + crouch + rattle, hy = sh - 7;
  for (const s of [-1, 1]) { // leg bones
    const lx = cx + s * 4 + (side ? s * step * 2 : 0);
    F.part(both(line(lx, hip, lx + (A ? s * 2 : 0), hip + 9 - crouch / 2, 2), line(lx + (A ? s * 2 : 0), hip + 9 - crouch / 2, lx, G - 1, 2)), P.bone);
    F.part(rect(lx - 2, G - 2, lx + 3, G), P.dark);
  }
  F.part(rect(cx - 5, hip - 1, cx + 5, hip + 2), P.bone); // the pelvis
  if (A) F.part(poly([[cx - 9, sh], [cx + 9, sh], [cx + 11, hip + 8], [cx - 11, hip + 8]]), P.coat); // a dark wrap
  else { F.part(poly([[cx - 8, sh], [cx + 8, sh], [cx + 10, hip + 10], [cx + 4, hip + 2], [cx - 4, hip + 2], [cx - 10, hip + 10]]), P.coat); F.part(line(cx - 8, sh + 1, cx - 9, hip + 9, 1), P.trim, flat); F.part(line(cx + 8, sh + 1, cx + 9, hip + 9, 1), P.trim, flat); }
  if (!back) { // ribs between the coat's edges
    for (let y = sh + 3; y < hip - 3; y += 3) F.part(line(cx - 3, y, cx + 3, y, 1), P.bone, flat);
    F.part(line(cx, sh + 2, cx, hip - 1, 1), P.bone, flat);
    if (!A) F.part(rect(cx - 7, hip - 4, cx + 7, hip - 2), P.cloth); // the sash
  }
  const blade = (hx, hy2, ang, len, curve) => { // a cutlass, or a curved knife
    const c = Math.cos(ang), s = Math.sin(ang), tip = [hx + c * len, hy2 - s * len], mid = [hx + c * len * 0.6 + s * curve, hy2 - s * len * 0.6 + c * curve];
    F.part(both(line(hx, hy2, ...mid, 2), line(...mid, ...tip, 1)), P.blade);
    F.part(line(hx - s * 2, hy2 - c * 2, hx + s * 2, hy2 + c * 2, 1), P.trim, flat);
  };
  const cut = atk >= 0 ? [0.9, 2.1, -0.4, 0.4][atk] : 0.6;
  for (const s of side ? [1] : A ? [-1, 1] : [1]) {
    const ax = cx + s * (side ? 2 : 8), hx = side ? cx + 8 : cx + s * 12, hy2 = sh + 11;
    F.part(line(ax, sh + 2, hx, hy2, 2), P.bone);
    if (!back) blade(hx, hy2, s > 0 || side ? cut : Math.PI - cut, A ? 9 : 14, A ? 3 : 1.5);
  }
  if (!side && !A) F.part(line(cx - 8, sh + 2, cx - 10, sh + 12, 2), P.bone); // (the free arm)
  // the skull: a bandana knotted at the back, or the hood
  const sx = cx + (side ? 2 : 0);
  if (A) F.part(poly([[sx - 7, hy + 5], [sx - 7, hy - 4], [sx - 2, hy - 9], [sx + 4, hy - 9], [sx + 8, hy - 3], [sx + 8, hy + 5]]), P.coat);
  F.part(ellipse(sx, hy, 5.5, 5.5), A ? dark(P.coat) : P.bone);
  if (!A) { F.part(poly([[sx - 6, hy - 1], [sx + 6, hy - 1], [sx + 5, hy - 5], [sx - 5, hy - 5]]), P.cloth); F.part(line(sx - 5, hy - 2, sx - 9, hy + 2 + (f % 2), 1), P.cloth, flat); }
  if (back) return;
  for (const s of side ? [1] : [-1, 1]) { const ex = sx + (side ? 2 : s * 2.2); F.part(rect(ex - 1, hy, ex + 1, hy + 1.5), P.dark, flat); F.dot(ex, hy + 0.5, P.eye); }
  if (!A) { F.part(rect(sx + (side ? 1 : -2), hy + 3, sx + (side ? 4 : 2), hy + 4), P.dark, flat); for (let x = -2; x <= 2; x += 2) F.dot(sx + x + (side ? 2 : 0), hy + 3.5, P.bone); }
}

// ---------- Blowgun Pirates: gaunt dead men, a scarf wound round the head, a long blowgun, poison darts ----------
function blower(F, P, { G, W, step, walk, f, atk, side, back }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0, blow = atk >= 0 ? [0, 1, 2, 0][atk] : -1;
  const hip = G - 20, sh = G - 38, hy = G - 46;
  for (const s of [-1, 1]) { const lx = cx + s * 4 + (side ? s * step * 2 : 0); F.part(rect(lx - 2, hip, lx + 2, G - 4), P.shade); F.part(rect(lx - 2.5, G - 4, lx + 2.5, G), P.wrap); }
  F.part(poly([[cx - 7, sh], [cx + 7, sh], [cx + 8, hip + 2], [cx - 8, hip + 2]]), P.vest);
  if (!back) F.part(poly([[cx - 2, sh], [cx + 2, sh], [cx + 1, hip - 4], [cx - 1, hip - 4]]), P.skin); // the bare chest, ribs showing
  if (!back) for (let y = sh + 3; y < hip - 5; y += 3) F.part(line(cx - 1, y, cx + 1, y, 1), P.shade, flat);
  F.part(rect(cx - 8, hip - 2, cx + 8, hip + 1), P.sash);
  F.part(line(cx + 6, hip, cx + 9, hip + 8 + sway, 1), P.sash, flat);
  // the blowgun: held to the mouth, a dart puffing out of it on the attack
  const hx = cx + (side ? 3 : 0), mouthY = hy + 3;
  if (side) {
    F.part(line(hx + 2, mouthY, hx + 22, mouthY - 2, 2), P.pipe);
    F.part(line(cx + 1, sh + 3, hx + 8, mouthY + 1, 2), P.skin);
    if (blow >= 1) { F.part(line(hx + 24 + blow * 3, mouthY - 2, hx + 28 + blow * 3, mouthY - 3, 1), P.dart, flat); F.dot(hx + 23, mouthY - 3, P.dart); }
  } else if (!back) {
    F.part(line(hx, mouthY + 1, hx, mouthY + 15, 2), P.pipe); // (aimed at you: seen end-on, held in both hands)
    F.part(ellipse(hx, mouthY + 1, 1.6, 1.6), dark(P.pipe), flat);
    for (const s of [-1, 1]) F.part(line(cx + s * 7, sh + 2, hx + s * 1.5, mouthY + 8, 2), P.skin);
    if (blow >= 1) F.part(ellipse(hx, mouthY + 1, 1 + blow, 1 + blow), P.dart, { outline: false });
  } else for (const s of [-1, 1]) F.part(line(cx + s * 7, sh + 2, cx + s * 9, sh + 12, 2), P.skin);
  F.part(ellipse(hx, hy, 5, 5.5), P.skin);
  F.part(poly([[hx - 6, hy - 1], [hx + 6, hy - 1], [hx + 5, hy - 6], [hx - 5, hy - 6]]), P.wrap); // the scarf
  F.part(line(hx - (side ? 5 : 6), hy - 2, hx - (side ? 9 : 8), hy + 4 + (f % 2), 1), P.wrap, flat);
  if (back) return;
  for (const s of side ? [1] : [-1, 1]) F.part(rect(hx + (side ? 1.5 : s * 2.5) - 0.5, hy - 0.5, hx + (side ? 1.5 : s * 2.5) + 0.5, hy + 0.5), P.eye, flat); // sunken, glinting
  F.part(line(hx - (side ? 0 : 2), hy - 2, hx + 2, hy - 2.5, 1), dark(P.skin), flat);
}

// ---------- Octopuses: red, eight arms curling, pale suckers, a big golden eye ----------
function octopus(F, P, { G, W, walk, f, atk, side, back }) {
  const cx = W / 2, sway = walk ? f : 0, lash = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const by = G - 24;
  for (let k = 0; k < 8; k++) { // the arms, curling out along the ground
    const s = k % 2 ? 1 : -1, n = Math.floor(k / 2), base = [cx + s * (2 + n * 2.5), by + 7];
    const len = 12 + n * 2 + (k === 1 ? lash : 0), ang = (side ? 0.4 : 0.9) + n * 0.25 + Math.sin(sway * 1.6 + k) * 0.15;
    const pts = Array.from({ length: 5 }, (_, i) => { const t = i / 4; return [base[0] + s * Math.sin(ang * t) * len * 1.1, base[1] + t * (G - 1 - base[1]) - Math.sin(t * Math.PI) * 2 + (t > 0.8 ? -2 * (t - 0.8) * 10 : 0)]; });
    for (let i = 0; i < 4; i++) F.part(line(...pts[i], ...pts[i + 1], Math.max(1, 3 - i * 0.6)), n % 2 ? dark(P.skin) : P.skin);
    F.dot(pts[2][0], pts[2][1] + 1, P.sucker); F.dot(pts[3][0], pts[3][1] + 1, P.sucker);
    F.part(ellipse(pts[4][0] + s, pts[4][1] - 1, 1.2, 1.2), P.skin); // the curl at its tip
  }
  F.part(ellipse(cx + (side ? -3 : 0), by - 4, side ? 10 : 11, 11), P.skin); // the mantle
  for (const [x, y] of [[-5, -10], [3, -12], [-1, -6], [5, -5], [-6, -2]]) F.part(ellipse(cx + x + (side ? -3 : 0), by + y, 1.2, 1), P.spot, flat);
  F.part(ellipse(cx + (side ? 1 : 0), by + 5, side ? 7 : 9, 4), P.skin);
  if (back) return;
  for (const s of side ? [1] : [-1, 1]) { const ex = cx + (side ? 6 : s * 6); F.part(ellipse(ex, by + 1, 2.2, 2), P.eye); F.part(line(ex - 1.2, by + 1, ex + 1.2, by + 1, 1), P.pupil, flat); F.part(line(ex - 2, by - 1.5, ex + 2, by - 2 + (side ? 0 : s * 0.5), 1), dark(P.skin), flat); }
}

// ---------- Ghosts: drowned sailors' spirits, pale and see-through, a tail of mist, hollow eyes, arms out ----------
function ghost(F, P, { G, W, walk, f, atk, side, back }) {
  const cx = W / 2, bob = [0, 1, 2, 1][f % 4], reach = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const y0 = G - 12 - bob;
  for (let i = 0; i < 5; i++) { const t = i / 4; F.part(ellipse(cx + Math.sin(t * 4 + f) * 3 - (side ? t * 5 : 0), y0 + t * 9, 6 - t * 4.5, 2.5), P.mist, { outline: false }); } // the tail
  F.part(poly([[cx - 9, y0 - 22], [cx + 9, y0 - 22], [cx + 8, y0 - 6], [cx + 5, y0 + 1], [cx + 2, y0 - 3], [cx - 1, y0 + 2], [cx - 4, y0 - 3], [cx - 7, y0 + 1], [cx - 9, y0 - 6]]), P.mist); // the body, a torn shirt of mist
  F.part(poly([[cx - 5, y0 - 21], [cx + 5, y0 - 21], [cx + 3, y0 - 10], [cx - 3, y0 - 10]]), P.pale, flat);
  for (const s of side ? [1] : [-1, 1]) { // arms reaching out, ragged sleeves
    const ax = cx + s * (side ? 2 : 8), hx = side ? cx + 12 + reach : cx + s * (12 + reach * 0.4), hy = y0 - 18 + (side ? 2 : reach * 0.5);
    F.part(line(ax, y0 - 20, hx, hy, 3), P.mist);
    F.part(line(hx - (side ? 0 : s), hy + 2, hx - (side ? 2 : s * 3), hy + 5, 1), P.pale, flat);
  }
  const hx = cx + (side ? 3 : 0), hy = y0 - 28;
  F.part(ellipse(hx, hy, 6.5, 7), P.mist);
  F.part(poly([[hx - 7, hy - 2], [hx - 8, hy + 5], [hx - 5, hy + 1]]), P.pale); // wisps of hair, drifting
  F.part(poly([[hx + 7, hy - 2], [hx + 8, hy + 5], [hx + 5, hy + 1]]), P.pale);
  if (back) return;
  for (const s of side ? [1] : [-1, 1]) { const ex = hx + (side ? 2 : s * 2.5); F.part(ellipse(ex, hy - 0.5, 1.6, 2.2), P.dark, flat); F.dot(ex, hy - 1, P.eye); }
  F.part(ellipse(hx + (side ? 2.5 : 0), hy + 4, 1.4, 1.6 + (atk >= 1 ? 1 : 0)), P.mouth, flat); // a moan
}

// ---------- Hydras: a sea serpent's coiled body, three necks, three fanged heads, fins down them ----------
function hydra(F, P, { G, W, walk, f, atk, side, back }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0, strike = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  F.part(ellipse(cx, G - 8, 20, 7), dark(P.scale)); // its coils on the ground
  F.part(ellipse(cx + (side ? -3 : 0), G - 12, 16, 9), P.scale);
  if (!back) F.part(ellipse(cx + (side ? 2 : 0), G - 10, 10, 5), P.belly, flat);
  const heads = side ? [[-0.2, 1], [0.2, 0.85], [0.55, 1.05]] : [[-0.6, 0.9], [0, 1.1], [0.6, 0.9]];
  heads.forEach(([lean, h], i) => {
    const bx = cx + (side ? -2 + i * 4 : (i - 1) * 7), by = G - 18;
    const mid = i === 1 ? strike : strike * 0.5;
    const tx = bx + lean * 18 + (side ? 6 + mid : 0) + sway * (i - 1), ty = by - 22 * h - (side ? 0 : mid * 0.3) + (i % 2 ? sway : 0);
    const cxn = (bx + tx) / 2 - lean * 4, cyn = (by + ty) / 2;
    F.part(both(line(bx, by, cxn, cyn, 4), line(cxn, cyn, tx, ty + 3, 3)), i === 1 ? P.scale : dark(P.scale));
    for (let k = 1; k <= 3; k++) { const px = bx + (tx - bx) * k / 4, py = by + (ty - by) * k / 4; F.part(poly([[px - 1, py], [px + 1, py], [px - 2 - lean * 2, py - 2]]), P.fin); }
    F.part(ellipse(tx, ty, 4, 3), P.scale); // the head
    F.part(poly([[tx + (side ? 2 : -2), ty + 1], [tx + (side ? 7 : 2), ty + 2 + (atk >= 1 ? 1 : 0)], [tx + (side ? 2 : -1), ty + 3]]), P.belly);
    if (!back) { F.dot(tx + (side ? 1 : -1.5), ty - 1, P.eye); if (!side) F.dot(tx + 1.5, ty - 1, P.eye); }
    if (atk >= 1 && !back) F.part(rect(tx - 1, ty + 2, tx + 1, ty + 3), P.mouth, flat);
    F.part(poly([[tx - 2, ty - 2], [tx + 2, ty - 2], [tx - lean * 2, ty - 6]]), P.fin); // a crest
  });
}

// ---------- the Kraken (the mini-boss, the owner's sheet): dark blue, a crown of bronze coral spikes, glowing eyes and
// markings, a crystal core on its head, great tentacles curling up round it, pale-suckered underneath ----------
function kraken(F, P, { G, W, walk, f, atk, side, back }) {
  const cx = W / 2, slam = atk >= 0 ? [0, -6, 8, 2][atk] : 0;
  // each arm writhes on its own (the owner's call): its own beat and its own way, some curling in as others open out,
  // some rising as others sink (def.writhe: the frames play even while it stands)
  const ph = (walk ? f : atk >= 0 ? atk : 0) / 4 * Math.PI * 2;
  const wave = (k) => Math.sin(ph * (k % 3 === 0 ? 1 : k % 3 === 1 ? -1 : 2) + k * 1.9);
  const tentacle = (x0, y0, dir, h, curl, near, raised = 0) => { // a great arm rising and curling over at its tip
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, a = t * curl; pts.push([x0 + dir * (Math.sin(a) * h * 0.55 + t * 8), y0 - Math.sin(Math.min(1, t * 1.2) * Math.PI / 2) * (h + raised) + (t > 0.7 ? (t - 0.7) * 30 : 0)]); }
    for (let i = 0; i < 10; i++) { const w = Math.max(2, 7 - i * 0.6); F.part(line(...pts[i], ...pts[i + 1], w), near ? P.skin : P.deep); }
    for (let i = 2; i < 10; i += 2) F.part(ellipse(pts[i][0] - dir * 2, pts[i][1] + 1, 1.6, 1.2), P.sucker, flat); // suckers
    if (near) for (let i = 1; i < 9; i += 3) F.dot(pts[i][0] + dir, pts[i][1] - 2, P.glow);
  };
  // the arms behind it
  [[-1, 80, 2.4], [1, 76, 2.6], [-1, 58, 3.0], [1, 62, 2.9]].forEach(([s, h, c], k) => tentacle(cx + s * (14 + wave(k + 5) * 3), G - 10, s, h + wave(k) * 7, c + wave(k + 2) * 0.45, false, atk >= 0 && h > 70 ? -slam : 0));
  // arms reaching out from it, low and long, tapering to a point (the owner's call: some point outward)
  const reach = (x0, y0, dir, len, rise, k) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([x0 + dir * t * len, y0 - t * rise - Math.sin(t * Math.PI * 1.5 + ph + k) * 3 * t]); }
    for (let i = 0; i < 10; i++) F.part(line(...pts[i], ...pts[i + 1], Math.max(1, 6 - i * 0.55)), P.skin);
    for (let i = 2; i < 9; i += 2) F.part(ellipse(pts[i][0], pts[i][1] + 2, 1.4, 1), P.sucker, flat);
    for (let i = 1; i < 9; i += 3) F.dot(pts[i][0], pts[i][1] - 2, P.glow);
  };
  reach(cx - 20, G - 14, -1, 44 + wave(11) * 5, 6 + wave(12) * 6, 1);
  reach(cx + 20, G - 14, 1, 42 + wave(13) * 5, 10 + wave(14) * 6, 3);
  reach(cx - 18, G - 26, -1, 38 + wave(15) * 4, 18 + wave(16) * 5, 5);
  reach(cx + 18, G - 24, 1, 40 + wave(17) * 4, 20 + wave(18) * 5, 2);
  // its body rising out of the water
  F.part(ellipse(cx, G - 6, 34, 6), P.deep);
  F.part(ellipse(cx + (side ? 4 : 0), G - 30, side ? 18 : 22, 24), P.skin);
  F.part(ellipse(cx + (side ? 4 : 0), G - 22, side ? 14 : 18, 12), P.deep, flat);
  for (const [x, y] of [[-12, -34], [10, -36], [-6, -24], [8, -22], [0, -40], [-14, -18], [14, -18]]) F.part(ellipse(cx + x * (side ? 0.6 : 1) + (side ? 4 : 0), G + y, 1.4, 1), P.glow, flat); // markings
  // the crown of coral spikes
  const hy = G - 50;
  for (let k = -3; k <= 3; k++) {
    if (side && k < -1) continue;
    const x = cx + (side ? 4 + k * 3 : k * 5), h = 12 - Math.abs(k) * 1.5;
    F.part(poly([[x - 2.5, hy + 4], [x + 2.5, hy + 4], [x + k * 1.2 + 1, hy - h], [x + k * 1.2, hy - h - 3]]), k % 2 ? P.coral2 : P.coral);
    F.part(line(x + k * 0.8, hy - h * 0.5, x + k * 0.8 + (k >= 0 ? 3 : -3), hy - h * 0.5 - 3, 1), P.coral, flat); // a branch
  }
  F.part(ellipse(cx + (side ? 4 : 0), hy + 6, side ? 12 : 16, 10), P.skin); // the head
  if (!back) {
    F.part(poly([[cx + (side ? 4 : 0) - 3, hy + 2], [cx + (side ? 4 : 0) + 3, hy + 2], [cx + (side ? 4 : 0), hy - 4]]), P.core); // the crystal core
    F.dot(cx + (side ? 4 : 0) - 1, hy, '#ffffff');
    for (const s of side ? [1] : [-1, 1]) { const ex = cx + (side ? 10 : s * 7); F.part(poly([[ex - 4 * s, hy + 4], [ex + 4 * s, hy + 2], [ex + 3 * s, hy + 7], [ex - 2 * s, hy + 7]]), P.eye); F.part(line(ex - 4 * s, hy + 2, ex + 4 * s, hy, 1), P.coral, flat); F.dot(ex, hy + 5, '#ffffff'); }
    for (let i = 0; i < 5; i++) F.part(line(cx + (side ? 6 : -6) + i * (side ? 1.5 : 3), hy + 13, cx + (side ? 8 : -7) + i * (side ? 1.5 : 3.5), hy + 20 + (i % 2) * 3, 2), P.deep); // the beard of small arms
  }
  // the arms in front, one raised to slam
  tentacle(cx - 18 + wave(4) * 2, G - 6, -1, 44 + wave(6) * 5, 3.2 + wave(7) * 0.4, true);
  tentacle(cx + 18 + wave(8) * 2, G - 6, 1, 46 + (atk >= 0 ? -slam * 2 : wave(9) * 5), 3.0 + wave(10) * 0.4, true);
}

// ---------- Davy Jones, the Forsaken Captain (the MVP, the owner's sheet): a tricorn, a beard of tentacles, glowing
// eyes, a long dark coat hung with chains, a red sash, a great anchor, the drowned sea swirling round him (Ghost) ----------
function davy(F, P, { G, W, step, walk, f, atk, side, back }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0;
  const hip = G - 44, sh = G - 82, hy = sh - 12;
  // the drowned sea swirling round his feet
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + f * 0.5, r = 28 + (i % 3) * 4; F.part(line(cx + Math.cos(a) * r, G - 4 + Math.sin(a) * 4, cx + Math.cos(a + 0.35) * r, G - 4 + Math.sin(a + 0.35) * 4 - (i % 4 === 0 ? 6 : 0), 2), i % 3 ? P.water : P.foam, flat); }
  for (let i = 0; i < 6; i++) { const x = cx - 22 + i * 9, h = 6 + ((i * 5 + f * 3) % 9); F.part(line(x, G - 4, x + (i % 2 ? 2 : -2), G - 4 - h, 2), P.water, flat); } // the sea rising off him
  // a crimson cape, torn, hanging behind him to the sea
  if (!side) F.part(poly([[cx - 18, sh - 2], [cx + 18, sh - 2], [cx + 24, G - 10], [cx + 14, G - 4], [cx + 6, G - 9], [cx - 4, G - 3], [cx - 14, G - 8], [cx - 24, G - 6]]), P.sash);
  else F.part(poly([[cx - 2, sh - 2], [cx - 10, sh + 2], [cx - 22 - sway, G - 8], [cx - 12, G - 4], [cx - 4, hip]]), P.sash);
  // the coat's long skirts, torn, behind and round the legs
  const hem = []; for (let i = 0; i <= 8; i++) hem.push([cx - 20 + i * 5, G - 6 + (i % 2 ? -4 : 0) + ((i + f) % 3 === 0 ? 2 : 0)]);
  if (!side) F.part(poly([[cx - 15, hip - 4], [cx + 15, hip - 4], ...hem.slice().reverse().map(([x, y]) => [x, y])]), back ? P.coat : dark(P.coat));
  else F.part(poly([[cx - 6, hip - 6], [cx + 4, hip - 6], [cx - 4, G - 8], [cx - 18 - sway, G - 4], [cx - 12, G - 12]]), P.coat);
  // legs and boots
  for (const s of [-1, 1]) { const lx = cx + s * 6 + (side ? s * step * 3 : 0); F.part(rect(lx - 4, hip, lx + 4, G - 8), P.coat2); F.part(rect(lx - 5, G - 9, lx + (side ? 7 : 5), G - 1), P.hat); F.part(line(lx - 5, G - 9, lx + 5, G - 9, 1), P.trim, flat); }
  // the anchor: in his right hand, raised and brought crashing down
  const ang = atk >= 0 ? [-1.9, -2.5, 0.2, -0.6][atk] : -1.3;
  const ax = side ? cx + 10 : back ? cx - 24 : cx + 24, ay = sh + 24 + (atk === 2 ? 6 : 0);
  const anchor = () => {
    const c = Math.cos(ang), s = Math.sin(ang), d = back ? -1 : 1, pt = (u, v) => [ax + d * (c * u - s * v), ay + s * u + c * v];
    F.part(line(...pt(-6, 0), ...pt(46, 0), 4), P.anchor); // the shank
    F.part(both(line(...pt(-2, -6), ...pt(-2, 6), 2)), P.anchor); // the stock
    F.part(ellipse(...pt(-8, 0), 2.6, 2.6), P.anchor); // the ring, a chain off it
    for (let k = 0; k < 5; k++) F.part(ellipse(...pt(-10 - k * 2.5, k * 1.8), 1.2, 1.2), P.chain);
    for (const v of [-1, 1]) { // the arms and their flukes
      F.part(both(line(...pt(46, 0), ...pt(42, v * 13), 4), line(...pt(42, v * 13), ...pt(33, v * 17), 3)), P.anchor);
      F.part(poly([pt(30, v * 17), pt(37, v * 22), pt(39, v * 14)]), P.anchor);
    }
    F.part(both(line(...pt(-2, -9), ...pt(-2, 9), 3)), P.anchor); // (the stock, heavier)
    F.part(line(...pt(6, 1), ...pt(38, 1), 1), P.rust, flat);
    for (const v of [-1, 1]) F.part(line(...pt(40, v * 12), ...pt(34, v * 16), 1), P.water, flat); // the drowned light on its flukes
  };
  if (back) anchor();
  // the coat: dark, gold-trimmed, a red sash, chains hung across it
  F.part(poly([[cx - 16, sh], [cx + 16, sh], [cx + 15, hip + 2], [cx - 15, hip + 2]].map(([x, y]) => [x + (side ? (x - cx) * -0.35 : 0), y])), P.coat);
  if (!back) {
    F.part(poly([[cx - 6, sh + 1], [cx + 6, sh + 1], [cx + 4, hip], [cx - 4, hip]].map(([x, y]) => [x + (side ? 4 : 0), y])), P.coat2); // the waistcoat
    for (const y of [sh + 6, sh + 13, sh + 20, sh + 27]) F.dot(cx + (side ? 5 : 0), y, P.trim);
    F.part(rect(cx - 15 + (side ? 6 : 0), hip - 6, cx + 15 - (side ? 6 : 0), hip - 2), P.sash);
    for (const [y0, y1] of [[sh + 3, hip - 8], [sh + 10, hip - 2]]) { // chains slung across him
      for (let k = 0; k <= 8; k++) { const t = k / 8, x = cx - 14 + t * 28, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 3; F.part(ellipse(x * (side ? 0.6 : 1) + (side ? cx * 0.4 : 0), y, 1.4, 1), P.chain); }
    }
    F.part(line(cx - 15, sh + 1, cx - 15, hip, 1), P.trim, flat); F.part(line(cx + 15, sh + 1, cx + 15, hip, 1), P.trim, flat);
  } else for (let k = 0; k < 4; k++) F.part(line(cx - 12 + k * 8, sh + 4, cx - 10 + k * 8, hip, 1), P.coat2, flat);
  // shoulders: great cuffed sleeves, a claw of a hand on the anchor
  for (const s of side ? [1] : [-1, 1]) {
    const px = cx + s * (side ? 2 : 17), holds = side || (back ? s < 0 : s > 0);
    F.part(ellipse(px, sh + 2, 7, 5), P.coat2);
    F.part(line(px - 6, sh + 5, px + 6, sh + 5, 1), P.trim, flat);
    const [hx, hy2] = holds ? [ax, ay] : [cx + s * 22, hip - 6];
    F.part(line(px, sh + 4, hx, hy2, 6), P.coat);
    F.part(rect(hx - 3, hy2 - 3, hx + 3, hy2 + 1), P.trim, { outline: false }); // the cuff
    F.part(ellipse(hx, hy2 + 2, 3, 3), P.skin);
    if (!holds) for (let k = -1; k <= 1; k++) F.part(line(hx + k * 1.5, hy2 + 4, hx + k * 2.5, hy2 + 9, 1), P.tent2, flat); // fingers of tentacle
  }
  if (!back) anchor();
  // the head: a dark face, glowing eyes, a beard of tentacles hanging to his chest, the tricorn
  const fx = cx + (side ? 5 : 0);
  F.part(ellipse(fx, hy, side ? 8 : 9, 9), P.skin);
  if (!back) {
    for (let k = 0; k < 9; k++) { // the beard of tentacles, curling
      const x0 = fx - 7 + k * 1.75 + (side ? 2 : 0), len = 18 + (k % 3) * 6 - Math.abs(k - 4), curl = (k % 2 ? 1 : -1) * (2 + (f + k) % 3);
      if (side && k < 3) continue;
      F.part(both(line(x0, hy + 3, x0 + curl * 0.5, hy + 3 + len * 0.6, 2), line(x0 + curl * 0.5, hy + 3 + len * 0.6, x0 + curl, hy + 3 + len, 1)), k % 2 ? P.tent : P.tent2);
      F.part(ellipse(x0 + curl, hy + 3 + len, 1, 1), P.tent);
    }
    for (const s of side ? [1] : [-1, 1]) { const ex = fx + (side ? 3 : s * 3.5); F.part(rect(ex - 2, hy - 3, ex + 2, hy - 1), P.eye, flat); F.dot(ex, hy - 4, '#ffffff'); F.dot(ex + s * 3, hy - 2, P.eye); }
    F.part(line(fx - (side ? 0 : 6), hy - 4, fx + 6, hy - 4.5, 1), dark(P.skin), flat); // a heavy brow
  }
  // the tricorn: a wide dark hat, gold-edged, its three corners
  const ty = hy - 8;
  F.part(poly(side ? [[fx - 14, ty + 2], [fx + 11, ty + 1], [fx + 8, ty - 4], [fx - 2, ty - 10], [fx - 9, ty - 5]] : [[fx - 17, ty + 1], [fx - 8, ty + 4], [fx, ty + 2], [fx + 8, ty + 4], [fx + 17, ty + 1], [fx + 10, ty - 6], [fx, ty - 11], [fx - 10, ty - 6]]), P.hat);
  F.part(line(fx - (side ? 14 : 17), ty + 1, fx + (side ? 11 : 17), ty + 1, 1), P.trim, flat);
  if (!back && !side) F.part(ellipse(fx, ty - 3, 2, 2), P.trim); // a gold skull-pin
}

// ---------- the Abyssal King (Davy Jones's third phase, the owner's sheet): a colossal sea horror rising from a
// maelstrom: a body of rotted coat and barnacled flesh, a crown of coral and bone, three glowing eyes, a great beard of
// tentacles, the anchor grown huge in one fist, a mass of arms for the other, and great arms of the deep writhing up
// behind him (writhe: they never rest, each its own way) ----------
function abyss(F, P, { G, W, walk, f, atk, side, back }) {
  const cx = W / 2, ph = (walk ? f : atk >= 0 ? atk : 0) / 4 * Math.PI * 2, slam = atk >= 0 ? [0, -8, 10, 3][atk] : 0;
  const wave = (k) => Math.sin(ph * (k % 3 === 0 ? 1 : k % 3 === 1 ? -1 : 2) + k * 1.7);
  const arm = (x0, y0, dir, h, curl, col, k) => { // an arm of the deep, rising and curling over
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, a = t * (curl + wave(k) * 0.4); pts.push([x0 + dir * (Math.sin(a) * h * 0.5 + t * 10), y0 - Math.sin(Math.min(1, t * 1.2) * Math.PI / 2) * (h + wave(k + 3) * 8) + (t > 0.7 ? (t - 0.7) * 34 : 0)]); }
    for (let i = 0; i < 10; i++) F.part(line(...pts[i], ...pts[i + 1], Math.max(2, 9 - i * 0.75)), col);
    for (let i = 2; i < 10; i += 2) F.part(ellipse(pts[i][0] - dir * 2.5, pts[i][1] + 1, 1.8, 1.3), P.tent, flat);
    for (let i = 1; i < 9; i += 3) F.dot(pts[i][0] + dir, pts[i][1] - 3, P.eye);
  };
  // the arms of the deep behind him
  [[-1, 96, 2.5], [1, 92, 2.7], [-1, 70, 3.1], [1, 74, 3.0]].forEach(([s, h, c], k) => arm(cx + s * 24, G - 12, s, h, c, P.deep, k));
  // the maelstrom he rises out of
  for (let r = 44; r > 10; r -= 7) F.part(ellipse(cx, G - 8, r, r * 0.18), r % 2 ? P.water : P.deep);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + f * 0.6, r = 18 + (i % 4) * 7; F.part(line(cx + Math.cos(a) * r, G - 8 + Math.sin(a) * r * 0.18, cx + Math.cos(a + 0.5) * r, G - 8 + Math.sin(a + 0.5) * r * 0.18 - (i % 3 === 0 ? 7 : 0), 2), i % 3 ? P.water : P.foam, flat); }
  // the body: rotted coat over barnacled flesh, chains across it
  const sh = G - 92, waist = G - 28;
  F.part(poly([[cx - 30, sh], [cx + 30, sh], [cx + 26, waist], [cx + 34, G - 12], [cx - 34, G - 12], [cx - 26, waist]]), P.coat);
  if (!back) {
    F.part(poly([[cx - 12, sh + 2], [cx + 12, sh + 2], [cx + 10, waist], [cx - 10, waist]]), P.skin);
    for (const [x, y] of [[-6, 14], [4, 20], [-3, 30], [7, 36], [-8, 44], [2, 50]]) F.part(ellipse(cx + x, sh + y, 1.8, 1.4), P.foam); // barnacles
    for (let k = 0; k < 3; k++) for (let i = 0; i <= 10; i++) { const t = i / 10; F.part(ellipse(cx - 28 + t * 56, sh + 10 + k * 16 + Math.sin(t * Math.PI) * 6, 1.6, 1.1), P.chain); }
    F.part(rect(cx - 28, waist - 8, cx + 28, waist - 3), P.sash);
  }
  // the shoulders and arms: the anchor grown huge in one fist, a mass of tentacles for the other
  for (const s of [-1, 1]) F.part(ellipse(cx + s * 30, sh + 4, 12, 9), P.coat2);
  const anchorArm = back ? -1 : 1;
  const hx = cx + anchorArm * 44, hy = sh + 30 + slam;
  F.part(both(line(cx + anchorArm * 30, sh + 6, cx + anchorArm * 42, sh + 20, 8), line(cx + anchorArm * 42, sh + 20, hx, hy, 7)), P.coat);
  F.part(ellipse(hx, hy, 5, 5), P.skin);
  F.part(line(hx, hy - 34, hx, hy + 30, 5), P.anchor); // the anchor's shank, held upright, and its great flukes
  for (const v of [-1, 1]) { F.part(both(line(hx, hy + 30, hx + v * 16, hy + 22, 5), line(hx + v * 16, hy + 22, hx + v * 22, hy + 10, 3)), P.anchor); F.part(poly([[hx + v * 20, hy + 8], [hx + v * 27, hy + 10], [hx + v * 22, hy + 16]]), P.anchor); }
  F.part(ellipse(hx, hy - 36, 4, 4), P.anchor);
  F.part(line(hx - 1, hy - 20, hx - 1, hy + 24, 1), P.water, flat);
  for (let k = 0; k < 4; k++) arm(cx - anchorArm * 34, sh + 14, -anchorArm, 26 + k * 4, 2.4 + k * 0.3, P.tent2, k + 7); // the other arm: tentacles
  // the head: a crown of coral and bone, three glowing eyes, a great beard of tentacles
  const hy2 = sh - 16;
  F.part(ellipse(cx, hy2, 17, 15), P.skin);
  for (let k = -3; k <= 3; k++) { const x = cx + k * 5, h = 16 - Math.abs(k) * 2.5; F.part(poly([[x - 2.5, hy2 - 10], [x + 2.5, hy2 - 10], [x + k * 1.2, hy2 - 10 - h]]), k % 2 ? P.trim : P.foam); }
  if (!back) {
    for (let k = 0; k < 11; k++) { // the beard
      const x0 = cx - 13 + k * 2.6, len = 26 + (k % 3) * 8 - Math.abs(k - 5) * 1.5, curl = (k % 2 ? 1 : -1) * (3 + wave(k + 20) * 2);
      F.part(both(line(x0, hy2 + 6, x0 + curl * 0.5, hy2 + 6 + len * 0.6, 3), line(x0 + curl * 0.5, hy2 + 6 + len * 0.6, x0 + curl, hy2 + 6 + len, 2)), k % 2 ? P.tent : P.tent2);
      F.part(ellipse(x0 + curl, hy2 + 6 + len, 1.4, 1.4), P.tent);
    }
    for (const [x, y, r] of [[-7, -2, 2.6], [7, -2, 2.6], [0, -8, 2]]) { F.part(ellipse(cx + x, hy2 + y, r + 0.6, r * 0.7), P.eye, flat); F.dot(cx + x, hy2 + y, '#ffffff'); }
  }
}
