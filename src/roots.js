// Yggdrasil's monsters (the World Tree's hollows, dungeon.js), painted pixel by pixel in code like the
// Sphinx's Halls' (halls.js), after the World Tree's old songs: Root Squirrels, quarrelsome kin of the one
// that runs up and down the trunk; Brambles, thorn bushes that walk and throw their thorns; the Dark Elves,
// grey-skinned archers with white hair; Ratatoskr, the messenger squirrel (the third floor's mini-boss); Moss Golems of stone and moss;
// the Great Stags that graze on the tree's leaves, antlers glowing at the tips; Dryads, spirits of the
// wood with leaves for hair; the Root Wardens, knights of living wood with shield and greatsword; the
// Thorn Drakes, Nidhogg's brood; and Nidhogg itself, the black dragon that gnaws the World Tree's roots
// (k: its size). The Root Serpents and Rot Beetles are Veidheim's snakes and the beetles in new colours.
// Frames: 4 directions (down, up, right; left is right mirrored) x idle (1), walk (4) and attack (4).
import { Frame, ellipse, rect, poly, line, both, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
// size: the frame; body: the standing figure in pixels (def.w is its width in the world)
export const ROOTS = {
  // the Root Squirrels: Ratatoskr's kin (the owner's call: like it), up on their hind legs in bark-leather
  // jerkins and leaf-green scarves, their tails fiery with a few faint runes; no helm, no cloak (those are
  // Ratatoskr's). They and Ratatoskr are a Bloop's size (the owner's call)
  rootSquirrel: { kind: 'ratatoskr', kin: true, size: [72, 72], body: [36, 58], fur: '#c06a32', face: '#ecb478', tail: '#c8702c', tailHi: '#f0a040', rune: '#ffc870', armor: '#6a4a2e', trim: '#a8804a', cloak: '#4f8a3c', eye: '#1a0c08', claw: '#efe2cc' },
  bramble: { kind: 'bramble', size: [52, 48], body: [30, 34], leaf: '#2f5a26', vine: '#4a6a2a', thorn: '#e8dab0', berry: '#c8283a', glow: '#ff9a7a', eye: '#ffd23a', root: '#5e4028' },
  darkElf: { kind: 'elf', size: [48, 64], body: [22, 58], skin: '#8a96b8', hair: '#e6e4f2', armor: '#1e1a28', cloak: '#3a2458', sash: '#5a2a7a', trim: '#c8ccd8', rune: '#c89aff', bow: '#1a141c', string: '#a88ad8', eye: '#f4d4ff' },
  // Ratatoskr, the third floor's mini-boss, after the owner's sheet: the messenger squirrel of the World
  // Tree, small for a boss, in dark plate traced with glowing gold runes, a red scarf and a torn red cloak
  // with the World Tree on its back, a runed helm with its tufted ears through it, and a great fiery tail
  // glowing with runes
  ratatoskr: { kind: 'ratatoskr', size: [72, 72], body: [36, 58], fur: '#c8642a', face: '#e8a868', tail: '#d8742a', tailHi: '#ffb048', rune: '#ffd27a', armor: '#2a2428', trim: '#d8a048', cloak: '#8a1a24', eye: '#1a0c08', claw: '#efe2cc' },
  mossGolem: { kind: 'golem', size: [64, 64], body: [44, 56], stone: '#82827a', moss: '#5a8a3a', fern: '#7ab84a', cap: '#c87a4a', rune: '#9affa0', eye: '#c8ff9a', crack: '#4a4a44' },
  greatStag: { kind: 'stag', size: [68, 68], body: [44, 56], coat: '#a87a4a', belly: '#ecdcbc', antler: '#e8dcc0', glow: '#9affc0', eye: '#1a1008', hoof: '#3a2a1e' },
  dryad: { kind: 'dryad', size: [48, 66], body: [24, 60], skin: '#86c06a', leaf: '#3a8a3a', flower: '#ff9ac8', bark: '#6a4a2e', eye: '#ffe96a', dress: '#4f9a44' },
  rootWarden: { kind: 'warden', size: [68, 80], body: [34, 72], bark: '#5e4028', plate: '#8a6440', moss: '#4f7a3c', leafy: '#8ac85a', eye: '#ffe08a', blade: '#b89a6a', rune: '#9affc0' },
  thornDrake: { kind: 'dragon', k: 1, size: [66, 58], body: [44, 44], scale: '#3a6a3a', belly: '#b8c88a', wing: '#2a4a2a', horn: '#e8dcc0', eye: '#ffd23a', spine: '#c8e070', mouth: '#7a1a1a' },
  // Nidhogg after the owner's picture: near-black scales cracked with glowing red, torn crimson wings eaten
  // through with holes, a crest of black spikes, burning red eyes, a maw glowing red inside
  nidhogg: { kind: 'dragon', k: 2.4, mvp: true, size: [158, 132], body: [106, 104], scale: '#221c22', belly: '#3a1c22', wing: '#7a0e1a', horn: '#3a3036', eye: '#ff3a2a', spine: '#3a3036', mouth: '#d8201e', venom: '#ff6a3a', vein: '#e8282a' },
};

const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function rootsSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => rootsFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}
export function rootsFrame(id, dir, anim, f) {
  if (dir === 'left') return rootsFrame(id, 'right', anim, f).mirror();
  const P = ROOTS[id], [W, H] = P.size;
  const F = new Frame(W, H);
  const a = { G: H - 3, W, H, walk: anim === 'walk', f, step: anim === 'walk' ? [1, 0, -1, 0][f] : 0, atk: anim === 'attack' ? f : -1 };
  ({ squirrel, bramble, elf, golem, stag, dryad, warden, dragon, ratatoskr })[P.kind](F, P, dir, a);
  return F;
}
const W1 = (k) => Math.max(1, Math.round(k)); // a line width that grows with the size
// a hole eaten through what is drawn: a red-rimmed ragged gap (Nidhogg's torn wings)
function hole(F, x, y, rx, ry, rim) {
  F.part(ellipse(x, y, rx + 1, ry + 1), rim, flat);
  for (let j = Math.floor(y - ry); j <= Math.ceil(y + ry); j++) for (let i = Math.floor(x - rx); i <= Math.ceil(x + rx); i++) {
    if (((i - x) / (rx + 0.3)) ** 2 + ((j - y) / (ry + 0.3)) ** 2 <= 1 && i >= 0 && j >= 0 && i < F.w && j < F.h) F.px[j * F.w + i] = null;
  }
}

// ---------- Root Squirrels: a big bushy tail curled over the back, tufted ears; they dart in and bite ----------
function squirrel(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, hop = walk ? [0, -3, -1, 0][f] : 0, lunge = atk >= 0 ? [0, 3, 5, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const by = G - 8 + hop;
  const tail = (x, flip) => { // the tail: a fluffy S curling up behind
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([x + flip * (Math.sin(t * 3.2) * 7), by - 2 - t * 22]); }
    for (let i = 0; i < pts.length; i++) F.part(ellipse(pts[i][0], pts[i][1], 4.5 + Math.sin(i / 10 * 3.1) * 2.5, 4), i % 3 ? P.tail : light(P.tail));
  };
  if (side) {
    tail(cx - 8 - lunge * 0.3, -1);
    F.part(ellipse(cx - 1 + lunge * 0.5, by - 2, 8, 6), P.fur);
    F.part(ellipse(cx + 1 + lunge * 0.5, by, 5, 3.5), P.belly, flat);
    for (const s of [-1, 1]) F.part(line(cx - 2 + s * 4 + lunge * 0.5, by + 3, cx - 2 + s * 5 + lunge * 0.5 + (walk ? s * f % 2 : 0), G, 2), dark(P.fur));
    const hx = cx + 7 + lunge, hy = by - 6;
    F.part(ellipse(hx, hy, 5, 4.5), P.fur);
    F.part(poly([[hx - 2, hy - 3], [hx, hy - 9], [hx + 1.5, hy - 3]]), P.ear);
    F.part(ellipse(hx + 4, hy + 1, 2, 1.6), P.belly, flat);
    F.dot(hx + 2, hy - 1, P.eye);
    if (atk >= 0) F.part(rect(hx + 4, hy + 2, hx + 5, hy + 3), '#f6f0e0', flat);
    return;
  }
  if (back) tail(cx, 1);
  F.part(ellipse(cx, by - 3, 7.5, 7), P.fur);
  if (!back) F.part(ellipse(cx, by - 1, 4.5, 5), P.belly, flat);
  for (const s of [-1, 1]) F.part(rect(cx + s * 4 - 1, by + 2, cx + s * 4 + 1, G), dark(P.fur));
  const hy = by - 12 + (back ? 0 : lunge * 0.6);
  F.part(ellipse(cx, hy, 6, 5), P.fur);
  for (const s of [-1, 1]) F.part(poly([[cx + s * 2, hy - 4], [cx + s * 5, hy - 10], [cx + s * 6, hy - 3]]), P.ear);
  if (!back) {
    F.part(ellipse(cx, hy + 2, 3, 2), P.belly, flat);
    F.dot(cx - 2.5, hy - 1, P.eye); F.dot(cx + 2.5, hy - 1, P.eye);
    if (atk >= 0) F.part(rect(cx - 1, hy + 3, cx, hy + 4), '#f6f0e0', flat);
    tail(cx + 8, 1);
  }
}

// ---------- Brambles: a walking thicket of thorned vines wound round a glowing rose for a heart, two
// thorn-whip vines for arms that lash out, a mouth of thorns and yellow eyes in the tangle, roots for legs ----------
function bramble(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, hop = walk ? [0, -2, -3, -1][f] : 0, lash = atk >= 0 ? [0.2, 1, 1.3, 0.5][atk] : walk ? 0.15 * (f % 2) : 0;
  const side = dir === 'right', back = dir === 'up';
  const by = G - 15 + hop;
  // root legs, splayed
  for (const s of [-1, 0, 1]) { F.part(line(cx + s * 4, by + 7, cx + s * 8 + (walk ? s * (f % 2) : 0), G - 1, 2), P.root); F.part(line(cx + s * 8 + (walk ? s * (f % 2) : 0), G - 1, cx + s * 10, G, 1), P.root, flat); }
  // the whips: thorned vines curling out, lashing on the attack
  const whip = (sd) => {
    const pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, a = -0.9 - lash * 1.2 + t * (1.9 + lash); pts.push([cx + sd * (8 + Math.cos(a) * t * 12), by - 1 + Math.sin(a) * t * 9 - t * 5]); }
    for (let i = 0; i < 8; i++) F.part(line(...pts[i], ...pts[i + 1], i < 4 ? 2 : 1), P.vine);
    for (let i = 1; i < 8; i += 2) F.part(line(pts[i][0], pts[i][1], pts[i][0] + sd * 1.5, pts[i][1] - 2, 1), P.thorn, flat);
  };
  // the thicket: a tangle of dark leaves and vines, thorns all over it
  const bush = [];
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, r = i % 2 ? 1 : 1.18; bush.push([cx + Math.cos(a) * 12 * r, by + Math.sin(a) * 10.5 * r]); }
  F.part(poly(bush), P.leaf);
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + f * 0.1; F.part(line(cx + Math.cos(a) * 11, by + Math.sin(a) * 9, cx + Math.cos(a + 2.2) * 8, by + Math.sin(a + 2.2) * 7, 1), P.vine, flat); } // vines wound through it
  for (let i = 0; i < 8; i++) F.part(ellipse(cx - 8 + ((i * 7) % 16), by - 6 + ((i * 5) % 12), 2.6, 2), dark(P.leaf), flat);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.2, x0 = cx + Math.cos(a) * 11.5, y0 = by + Math.sin(a) * 9.5; F.part(line(x0, y0, x0 + Math.cos(a) * (3 + lash * 2), y0 + Math.sin(a) * (3 + lash * 2), 1), P.thorn, flat); }
  if (side) whip(1); else { whip(-1); whip(1); } // (the whips out of its sides, over the tangle)
  if (back) return;
  // the heart: a rose, glowing in the tangle; berries; the eyes and the thorny mouth
  const hx = cx + (side ? 3 : 0);
  F.part(ellipse(hx, by + 2, 3.4, 3), P.berry);
  F.part(ellipse(hx, by + 2, 1.8, 1.6), P.glow, flat);
  F.part(line(hx - 2, by + 1, hx + 1.5, by + 3, 1), dark(P.berry), flat);
  for (const [x, y] of [[-8, 5], [8, -4], [6, 6]]) F.part(ellipse(cx + x, by + y, 1.4, 1.4), P.berry);
  for (const s of side ? [1] : [-1, 1]) { F.part(ellipse(hx + s * 3.6 + (side ? 1 : 0), by - 4, 1.8, 1.3), P.eye, flat); F.dot(hx + s * 3.6 + (side ? 1 : 0), by - 4, '#1a1008'); }
  const open = atk >= 0 ? 2 : 0.8;
  F.part(poly([[hx - 4, by - 1], [hx + 4, by - 1], [hx + 3, by - 1 + open], [hx - 3, by - 1 + open]]), '#1a1008');
  for (let i = 0; i < 4; i++) F.part(poly([[hx - 3.5 + i * 2.2, by - 1], [hx - 2.5 + i * 2.2, by - 1], [hx - 3 + i * 2.2, by + 0.6]]), P.thorn, flat);
}

// ---------- Dark Elves: hooded archers of the World Tree's dark roots. A deep violet cloak flaring to a
// torn hem, fitted black leathers traced with glowing violet runes, a silver belt and a rune sash, a
// hood with long pointed ears through it and silver hair spilling out over the shoulders, violet eyes
// burning in a grey-blue face; a tall black recurve bow with a glowing string, a quiver of violet-
// fletched arrows. It draws, a violet arrow on the string ----------
function elf(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, draw = atk >= 0 ? [2, 5, 6, 1][atk] : 0, sway = walk ? [0, 1, 0, -1][f] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 21 + bob, sh = G - 36 + bob;
  // the quiver on its back (behind, facing us; over the cloak, from behind)
  const quiver = () => {
    const qx = cx + (back ? 3 : side ? -5 : -4);
    F.part(poly([[qx - 1.5, sh - 3], [qx + 2.5, sh - 4], [qx + 4, sh + 10], [qx, sh + 11]]), P.bow);
    for (let i = 0; i < 3; i++) { F.part(line(qx + i * 1.1, sh - 3.5, qx + i * 1.1 - 1, sh - 8, 1), P.string, flat); F.dot(qx + i * 1.1 - 1, sh - 8, P.trim); }
  };
  if (!back) quiver();
  // the cloak: a deep violet, flaring to a torn hem
  const hem = [];
  for (let i = 0; i <= 6; i++) hem.push([cx - 10 + i * 3.4 + sway + (side ? -3 : 0), G - 2 + (i % 2 ? -3 : 0)]);
  F.part(poly([[cx - 6 + (side ? -2 : 0), sh - 1], [cx + 6 + (side ? -4 : 0), sh - 1], ...hem.reverse()]), P.cloak);
  if (back) { // a crescent moon in silver on its back, the quiver over it
    F.part(rows(ellipse(cx, sh + 9, 3.5, 3.5), sh + 5, sh + 13), P.trim, flat);
    F.part(ellipse(cx + 1.5, sh + 8.5, 3, 3), P.cloak, flat);
    quiver();
  }
  // legs: slim, black leathers, tall boots trimmed with silver
  if (side) { F.part(rect(cx - 2 + step * 2, hip, cx + 0.5 + step * 2, G), P.armor); F.part(rect(cx - 1 - step * 2, hip, cx + 1.5 - step * 2, G), dark(P.armor)); F.part(line(cx - 2 + step * 2, G - 5, cx + 0.5 + step * 2, G - 5, 1), P.trim, flat); }
  else for (const s of [-1, 1]) { const lx = cx + s * 2.6 + s * step; F.part(rect(lx - 1.4, hip, lx + 1.4, G), P.armor); F.part(line(lx - 1.4, G - 5, lx + 1.4, G - 5, 1), P.trim, flat); }
  // the body: fitted black leathers, violet runes glowing down them, a silver belt, a rune sash
  F.part(poly([[cx - 5, sh], [cx + 5, sh], [cx + 4.5, hip + 2], [cx - 4.5, hip + 2]]), P.armor);
  F.part(line(cx - 4.5, hip, cx + 4.5, hip, 1), P.trim, flat);
  if (!back) {
    F.part(poly([[cx - 1.5 + (side ? 2 : 0), hip], [cx + 1.5 + (side ? 2 : 0), hip], [cx + 1 + (side ? 2 : 0), hip + 7], [cx - 1 + (side ? 2 : 0), hip + 7]]), P.sash); // the sash
    F.part(both(line(cx - 3, sh + 2, cx - 1, sh + 8, 1), line(cx + 3, sh + 2, cx + 1, sh + 8, 1), line(cx - 1, sh + 8, cx + 1, sh + 8, 1)), P.rune, flat); // runes on the chest
    F.dot(cx + (side ? 2 : 0), hip + 3, P.rune);
  }
  F.part(ellipse(cx + (side ? 2 : 4), sh + 1.5, 3, 2.4), P.armor); // a pauldron on the bow arm
  F.part(line(cx + (side ? 0 : 2), sh + 0.5, cx + (side ? 4.5 : 6.5), sh + 0.5, 1), P.trim, flat);
  // the bow: a tall black recurve, its string glowing; drawn on the attack, a violet arrow on it
  const glowStr = atk >= 0 ? P.rune : P.string;
  if (side) {
    const bx = cx + 8, by = sh + 6;
    F.part(both(line(bx - 1, by - 11, bx + 2, by - 7, 1), line(bx + 2, by - 7, bx + 3, by, 1), line(bx + 3, by, bx + 2, by + 7, 1), line(bx + 2, by + 7, bx - 1, by + 11, 1)), P.bow, flat);
    F.part(both(line(bx - 1, by - 11, bx - draw, by, 1), line(bx - draw, by, bx - 1, by + 11, 1)), glowStr, flat);
    F.part(line(cx + 2, sh + 3, bx + 2, by, 2), P.skin); // the arm, out to the bow
    if (draw) { F.part(line(bx - draw, by, bx + 9, by, 1), P.rune, flat); F.dot(bx + 9, by, '#ffffff'); }
  } else if (!back) {
    const bx = cx + 9, by = sh + 7;
    F.part(both(line(bx + 2, by - 12, bx, by - 8, 1), line(bx, by - 8, bx - 0.5, by, 1), line(bx - 0.5, by, bx, by + 8, 1), line(bx, by + 8, bx + 2, by + 12, 1)), P.bow, flat);
    F.part(line(bx + 2, by - 12, bx + 2, by + 12, 1), glowStr, flat);
    F.part(line(cx + 5, sh + 2, bx, by - draw * 0.3, 2), P.skin);
    F.part(line(cx - 5, sh + 2, cx - 6 + (draw ? 3 : 0), hip - 1 - draw, 2), P.skin);
    if (draw) F.part(line(bx - 1, by - 3, bx - 1, by + 4, 1), P.rune, flat);
  }
  // the head: a hood, long ears through it, silver hair spilling out, violet eyes in a grey-blue face
  const hx = cx + (side ? 1.5 : 0), hy = sh - 6;
  if (!back) for (const s of side ? [1] : [-1, 1]) F.part(poly([[hx + s * 3 - (side ? 3 : 0), hy + 2], [hx + s * 5 - (side ? 3 : 0), hy + 2], [hx + s * 6 - (side ? 3 : 0), sh + 9], [hx + s * 3.5 - (side ? 3 : 0), sh + 8]]), P.hair); // hair down over the shoulders
  F.part(ellipse(hx, hy - 0.5, 5.6, 5.6), P.cloak); // the hood
  F.part(poly([[hx - 2.5, hy - 5.5], [hx + 1, hy - 8.5], [hx + 2.5, hy - 5]]), P.cloak);
  for (const s of side ? [-1] : [-1, 1]) F.part(poly([[hx + s * 4.6, hy - 1], [hx + s * 11, hy - 5.5], [hx + s * 5, hy + 1.2]]), P.skin); // the long ears, out through slits in the hood
  if (back) return;
  F.part(ellipse(hx + (side ? 1.6 : 0), hy + 0.8, side ? 2.6 : 3.4, 3.8), P.skin); // the face in the hood
  F.part(line(hx - 3 + (side ? 1.5 : 0), hy - 1.6, hx + 3 + (side ? 1 : 0), hy - 1.6, 1), P.hair, flat); // a lock of silver over the brow
  if (side) { F.part(rect(hx + 2.4, hy, hx + 3.4, hy + 0.6), P.eye, flat); F.dot(hx + 3.6, hy + 2.6, dark(P.skin)); }
  else { for (const s of [-1, 1]) F.part(rect(hx + s * 1.6 - 0.5, hy, hx + s * 1.6 + 0.5, hy + 0.6), P.eye, flat); F.part(line(hx - 0.8, hy + 3, hx + 0.8, hy + 3, 1), dark(P.skin), flat); }
}

// ---------- Moss Golems: a hunched giant of stacked boulders under a thick mantle of moss, moss hanging
// from it in strands, ferns and mushrooms growing on its shoulders, green runes glowing in the cracks of
// its stone, eyes burning under a heavy brow, great fists of mossy stone that come down like rockfalls ----------
function golem(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, raise = atk >= 0 ? [6, 12, -2, 2][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const by = G - 30 + bob;
  for (const s of [-1, 1]) { const lx = cx + (side ? s * 4 : s * 7) + s * step; F.part(both(rect(lx - 4, G - 12, lx + 4, G - 2), ellipse(lx, G - 2, 5, 2.2)), dark(P.stone)); F.part(line(lx - 3, G - 8, lx + 2, G - 7, 1), P.crack, flat); } // legs, pillars of stone
  // the body: three boulders stacked, cracks glowing with runes
  F.part(ellipse(cx, by + 10, 12, 8), dark(P.stone));
  F.part(ellipse(cx + (side ? 2 : 0), by + 3, 14, 10), P.stone);
  F.part(ellipse(cx - 3, by - 1, 7, 4.5), light(P.stone), flat);
  if (!back) { F.part(both(line(cx - 7, by + 4, cx - 2, by + 9, 1), line(cx - 2, by + 9, cx + 3, by + 6, 1), line(cx + 5, by - 1, cx + 9, by + 5, 1)), P.rune, flat); F.part(ellipse(cx, by + 3, 2, 2), P.rune, flat); }
  const arm = (s) => { // great stone arms, raised to slam; mossy fists
    const ex = cx + s * (side ? 0 : 18) + (side ? 15 : 0), ey = by + 10 - raise;
    F.part(ellipse(cx + s * (side ? 4 : 12) + (side ? 2 : 0), by - 1, 5, 4.5), P.stone); // the shoulder boulder
    F.part(line(cx + s * (side ? 4 : 13) + (side ? 2 : 0), by + 1, ex, ey, 6), P.stone);
    F.part(ellipse(ex, ey + 3, 6, 5.5), dark(P.stone));
    F.part(rows(ellipse(ex, ey + 3, 6, 5.5), ey - 3, ey + 1), P.moss, flat);
  };
  if (side) arm(1); else { arm(-1); arm(1); }
  // the moss mantle over its shoulders, hanging in strands; ferns and a mushroom growing out of it
  F.part(poly([[cx - 15, by - 1], [cx - 9, by - 7], [cx + 9, by - 7], [cx + 15, by - 1], [cx + 11, by + 2], [cx - 11, by + 2]]), P.moss);
  for (let i = 0; i < 7; i++) { const x = cx - 12 + i * 4, l = 3 + ((i * 5) % 4); F.part(line(x, by + 1, x + (i % 2 ? 0.5 : -0.5), by + 1 + l, 1), dark(P.moss), flat); }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) F.part(line(cx + s * (9 + k), by - 6, cx + s * (11 + k * 2), by - 12 + k, 1), P.fern, flat); // ferns
  F.part(both(rect(cx + 7, by - 9, cx + 7.6, by - 6), ellipse(cx + 7.3, by - 10, 2.2, 1.3)), P.cap);
  // the head: a small boulder sunk between the shoulders, a heavy mossy brow, eyes burning under it
  const hx = cx + (side ? 6 : 0), hy = by - 9;
  F.part(ellipse(hx, hy, 6.5, 5.5), P.stone);
  F.part(rows(ellipse(hx, hy, 6.8, 5.8), hy - 6, hy - 1.5), P.moss);
  if (back) return;
  F.part(line(hx - 5 + (side ? 1 : 0), hy - 1, hx + 5, hy - 1, 1), dark(P.stone), flat); // the brow's shadow
  if (side) F.part(rect(hx + 3, hy, hx + 5, hy + 0.8), P.eye, flat);
  else for (const s of [-1, 1]) F.part(rect(hx + s * 2.6 - 1, hy, hx + s * 2.6 + 1, hy + 0.8), P.eye, flat);
  F.part(line(hx - 2 + (side ? 3 : 0), hy + 3, hx + 2 + (side ? 2 : 0), hy + 3, 1), P.crack, flat); // a crack for a mouth
}

// ---------- Great Stags: a big deer, its antlers spreading like branches, their tips glowing ----------
function stag(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, lower = atk >= 0 ? [2, 6, 8, 3][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const antler = (x, y, s, size = 1) => { // a branching antler from (x, y), s: which way it spreads
    const pts = [[x, y], [x + s * 3 * size, y - 7 * size], [x + s * 7 * size, y - 12 * size], [x + s * 9 * size, y - 18 * size]];
    for (let i = 0; i < 3; i++) F.part(line(...pts[i], ...pts[i + 1], 2), P.antler);
    for (const [i, dx, dy] of [[1, 5, -3], [2, 4, -2], [2, -1, -6]]) { const [px, py] = pts[i]; F.part(line(px, py, px + s * dx * size, py + dy * size, 1), P.antler, flat); F.dot(px + s * dx * size, py + dy * size, P.glow); }
    F.dot(...pts[3], P.glow);
  };
  if (side) {
    const by = G - 22 + bob;
    for (const [x, ph] of [[cx - 10, -step], [cx + 8, step]]) F.part(line(x, by + 4, x + ph * 2, G, 2), dark(P.coat));
    F.part(ellipse(cx - 1, by, 14, 7), P.coat);
    F.part(ellipse(cx, by + 3, 10, 3), P.belly, flat);
    F.part(ellipse(cx - 14, by - 3, 2.5, 2), P.belly); // the tail
    for (const [x, ph] of [[cx - 8, step], [cx + 10, -step]]) { F.part(line(x, by + 4, x + ph * 2, G - 1, 2), P.coat); F.dot(x + ph * 2, G, P.hoof); }
    const nx = cx + 13, ny = by - 12 + lower; // the neck up to the head, lowered to charge
    F.part(line(cx + 8, by - 3, nx, ny + 3, 5), P.coat);
    F.part(both(ellipse(nx + 1, ny, 4, 3.5), ellipse(nx + 5, ny + 2, 3, 2)), P.coat);
    F.dot(nx + 1, ny - 1, P.eye);
    antler(nx - 1, ny - 3, -1, 0.9); antler(nx + 1, ny - 3, 1, 0.8);
    return;
  }
  const by = G - 22 + bob;
  for (const s of [-1, 1]) F.part(line(cx + s * 5, by + 3, cx + s * 6 + s * step, G, 2), P.coat);
  F.part(ellipse(cx, by - 2, 9, 8), P.coat);
  if (!back) F.part(ellipse(cx, by + 1, 5, 5), P.belly, flat);
  else F.part(ellipse(cx, by + 4, 2.5, 2), P.belly);
  const hy = by - 14 + (back ? 0 : lower);
  F.part(line(cx, by - 6, cx, hy + 3, 5), P.coat);
  F.part(ellipse(cx, hy, 4.5, 4), P.coat);
  if (!back) { F.part(ellipse(cx, hy + 3, 2.5, 2), P.belly); F.dot(cx - 2, hy - 1, P.eye); F.dot(cx + 2, hy - 1, P.eye); }
  for (const s of [-1, 1]) { F.part(poly([[cx + s * 3, hy - 2], [cx + s * 7, hy - 4], [cx + s * 4, hy]]), P.coat); antler(cx + s * 2, hy - 3, s); }
}

// ---------- Dryads: a spirit of the wood, green skin, leaves for hair with flowers in it, her legs bark
// running into roots, a dress of leaves; she lifts glowing leaves to throw ----------
function dryad(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0, raise = atk >= 0 ? [4, 10, 12, 5][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 24, sh = G - 38;
  for (const s of [-1, 1]) { F.part(line(cx + s * 2, hip, cx + s * 4 + sway, G - 2, 2), P.bark); F.part(line(cx + s * 4 + sway, G - 2, cx + s * 8 + sway, G, 1), P.bark, flat); } // roots for feet
  F.part(poly([[cx - 5, sh + 4], [cx + 5, sh + 4], [cx + 9 + sway, hip + 8], [cx - 9 + sway, hip + 8]]), P.dress); // the leaf dress
  for (let i = 0; i < 6; i++) F.part(ellipse(cx - 7 + i * 2.8 + sway, hip + 7, 2, 2.6), dark(P.dress));
  F.part(poly([[cx - 4.5, sh], [cx + 4.5, sh], [cx + 4, sh + 6], [cx - 4, sh + 6]]), P.skin);
  // arms: raised with a glowing leaf to throw
  if (side) { F.part(line(cx + 2, sh + 1, cx + 8, sh + 8 - raise, 2), P.skin); if (atk >= 0) F.part(ellipse(cx + 9, sh + 7 - raise, 2, 1.4), '#c8ff9a', flat); }
  else for (const s of [-1, 1]) { const up = s > 0 ? raise : raise * 0.5; F.part(line(cx + s * 4.5, sh + 1, cx + s * 9, sh + 9 - up, 2), P.skin); if (atk >= 0 && !back) F.part(ellipse(cx + s * 9, sh + 8 - up, 1.8, 1.3), '#c8ff9a', flat); }
  // the head: leaves for hair, falling to her shoulders, flowers in it
  const hx = cx + (side ? 1 : 0), hy = sh - 6;
  const hair = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 1 : 1.25; hair.push([hx + Math.cos(a) * 7 * r, hy + 1 + Math.sin(a) * 7.5 * r]); }
  F.part(poly(hair), P.leaf);
  F.part(ellipse(hx + (side ? 1.5 : 0), hy + 1, 3.8, 4.5), back ? P.leaf : P.skin);
  for (const [x, y] of [[-5, -4], [4, -5], [6, 2]]) F.part(ellipse(hx + x, hy + y, 1.5, 1.5), P.flower);
  if (back) return;
  if (side) F.dot(hx + 3, hy, P.eye); else { F.dot(hx - 1.5, hy, P.eye); F.dot(hx + 1.5, hy, P.eye); }
}

// ---------- Root Wardens: the World Tree's guardians, knights of living wood. A crown of branches in leaf,
// bark plate with runes glowing in its seams, a mantle of moss, a face of light under a wooden helm, a
// great round shield carved with the World Tree, and a greatsword of living wood with leaves at its hilt ----------
function warden(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, swing = atk >= 0 ? [-1.0, -0.2, 0.9, 0.4][atk] : -0.9;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 26 + bob, sh = G - 46 + bob;
  // legs: rooted trunks, bark-plated, roots spreading at the feet
  const leg = (lx, col) => { F.part(rect(lx - 2.8, hip, lx + 2.8, G - 1), col); F.part(line(lx - 2.8, hip + 9, lx + 2.8, hip + 9, 1), P.rune, flat); for (const t of [-1, 1]) F.part(line(lx + t * 2, G - 1, lx + t * 4.5, G, 1), P.bark, flat); };
  if (side) { leg(cx - 1 + step * 2, P.bark); leg(cx + 1 - step * 2, dark(P.bark)); }
  else for (const s of [-1, 1]) leg(cx + s * 5 + s * step, P.bark);
  // the body: bark plate, the grain running down it, runes glowing in the seams; a mossy mantle over it
  F.part(poly([[cx - 9, sh], [cx + 9, sh], [cx + 8, hip + 4], [cx - 8, hip + 4]]), P.plate);
  for (let x = -6; x <= 6; x += 3) F.part(line(cx + x, sh + 3, cx + x * 0.9, hip + 2, 1), dark(P.plate), flat);
  if (!back) { F.part(both(line(cx, sh + 4, cx, hip - 1, 1), line(cx - 4, sh + 8, cx, sh + 11, 1), line(cx + 4, sh + 8, cx, sh + 11, 1)), P.rune, flat); F.part(ellipse(cx, sh + 11, 1.6, 1.6), P.rune, flat); }
  F.part(line(cx - 8, hip + 1, cx + 8, hip + 1, 2), P.moss, flat);
  F.part(poly([[cx - 11, sh + 3], [cx - 8, sh - 2], [cx + 8, sh - 2], [cx + 11, sh + 3], [cx + 9, sh + 6], [cx - 9, sh + 6]]), P.moss); // the mantle
  for (let i = 0; i < 6; i++) F.part(line(cx - 8 + i * 3.2, sh + 5, cx - 8 + i * 3.2, sh + 7 + (i % 3), 1), dark(P.moss), flat);
  // the greatsword of living wood, leaves at its hilt; the shield carved with the World Tree
  const sword = (x0, y0) => {
    const ex = x0 + Math.cos(swing) * 24, ey = y0 - Math.sin(swing) * 24;
    F.part(line(x0, y0, ex, ey, 3), P.blade);
    F.part(line(x0 + Math.cos(swing) * 5, y0 - Math.sin(swing) * 5, ex, ey, 1), P.rune, flat);
    F.part(line(x0 - Math.sin(swing) * 3.5, y0 - Math.cos(swing) * 3.5, x0 + Math.sin(swing) * 3.5, y0 + Math.cos(swing) * 3.5, 2), P.bark);
    for (const t of [-1, 1]) F.part(ellipse(x0 - Math.sin(swing) * 3.5 * t, y0 - Math.cos(swing) * 3.5 * t - 1, 1.6, 1), P.leafy, flat); // leaves at the crossguard
  };
  const shield = (x, y) => {
    F.part(ellipse(x, y, 7.5, 8.5), P.plate); F.part(ellipse(x, y, 5.5, 6.5), P.bark);
    F.part(both(line(x, y - 4, x, y + 4, 1), line(x - 3, y - 2, x, y - 4, 1), line(x + 3, y - 2, x, y - 4, 1), line(x - 3, y + 4, x, y + 2, 1), line(x + 3, y + 4, x, y + 2, 1)), P.rune, flat); // the World Tree on it
  };
  if (side) { F.part(line(cx + 2, sh + 3, cx + 8, sh + 10, 4), P.bark); sword(cx + 8, sh + 10); }
  else if (!back) { F.part(line(cx + 8, sh + 3, cx + 12, sh + 12, 4), P.bark); sword(cx + 12, sh + 12); shield(cx - 11, sh + 12); }
  else shield(cx + 1, sh + 10);
  // the head: a wooden helm with a slit of light, a crown of branches in leaf rising from it
  const hy = sh - 7, hx = cx + (side ? 2 : 0);
  for (const s of side ? [-1, 1] : [-1, 1]) { // the branching crown
    const bx = hx + s * 3, b1 = [bx + s * 3, hy - 10], b2 = [bx + s * 7, hy - 14];
    F.part(both(line(bx, hy - 4, ...b1, 2), line(...b1, ...b2, 1), line(...b1, b1[0] - s * 1, hy - 15, 1)), P.bark);
    for (const [x, y] of [b2, [b1[0] - s * 1, hy - 15], [b1[0] + s * 2, hy - 9]]) F.part(ellipse(x, y, 2, 1.5), P.leafy);
  }
  F.part(ellipse(hx, hy, 6, 6.5), P.plate);
  F.part(rows(ellipse(hx, hy, 6.2, 6.7), hy - 7, hy - 3), P.moss, flat);
  if (back) return;
  F.part(rect(hx - 4 + (side ? 2 : 0), hy - 1, hx + 4, hy + 0.5), '#1a1008', flat);
  if (side) F.part(rect(hx + 2, hy - 1, hx + 4, hy), P.eye, flat);
  else for (const s of [-1, 1]) F.part(rect(hx + s * 2 - 0.8, hy - 1, hx + s * 2 + 0.8, hy), P.eye, flat);
  F.part(line(hx + (side ? 2 : 0), hy + 2, hx + (side ? 2 : 0), hy + 5, 1), P.rune, flat); // a rune down the faceplate
}

// ---------- dragons: a horned head on a long neck, bat wings, a spined back and tail. The Thorn Drakes are
// small and green; Nidhogg (mvp, k: its size) is black, purple-spined, venom dripping from its jaws ----------
function dragon(F, P, dir, { G, W, step, walk, f, atk }) {
  const k = P.k, cx = W / 2, bob = walk && f % 2 ? -1 * k : 0;
  const gape = atk >= 0 ? [1, 3, 4, 2][atk] * k : 0.6 * k, spread = atk >= 0 ? [0.3, 0.9, 1, 0.6][atk] : walk ? 0.2 : 0.1;
  const side = dir === 'right', back = dir === 'up';
  const w = W1(k);
  const wing = (s, ox, oy) => { // a bat wing: arm bones out, membrane between the fingers
    const L = (15 + spread * 7) * k, a = -Math.PI / 2 + s * (0.55 + spread * 0.8);
    const tip = [ox + Math.cos(a) * L, oy + Math.sin(a) * L];
    const fingers = [0.25, 0.6, 0.95].map((t) => [ox + Math.cos(a + s * t) * L * (0.9 - t * 0.2), oy + Math.sin(a + s * t) * L * (0.9 - t * 0.2) + t * 10 * k]);
    F.part(poly([[ox, oy], tip, ...fingers.map(([x, y]) => [x, y + 3 * k]), [ox + s * 3 * k, oy + 8 * k]]), P.wing);
    F.part(line(ox, oy, ...tip, W1(1.4 * k)), dark(P.wing));
    for (const [x, y] of fingers) F.part(line(...tip, x, y, w), P.vein ? '#141014' : dark(P.wing), flat);
    F.part(ellipse(...tip, 0.8 * k, 0.8 * k), P.horn);
    if (P.vein) { // red veins glowing in the membrane, holes eaten through it, spikes along the arm
      for (const [x, y] of fingers) F.part(line(ox + s * 2 * k, oy + 4 * k, (x + tip[0]) / 2, (y + tip[1]) / 2 + 2 * k, 1), P.vein, flat);
      fingers.forEach(([x, y], i) => { const hx = ox + (x - ox) * 0.62 + s * 1.5 * k, hy = oy + (y - oy) * 0.62 + 2.5 * k; hole(F, hx, hy, (1.2 + (i % 2) * 0.6) * k, (0.9 + ((i + 1) % 2) * 0.5) * k, P.vein); });
      for (let i = 1; i <= 4; i++) { const px = ox + (tip[0] - ox) * i / 5, py = oy + (tip[1] - oy) * i / 5; F.part(poly([[px - 0.8 * k, py], [px + 0.8 * k, py], [px - s * 0.6 * k, py - 3 * k]]), P.spine); }
    }
  };
  const spines = (pts) => { for (const [x, y, s] of pts) F.part(poly([[x - 1.5 * k, y], [x + 1.5 * k, y], [x + s * k, y - 4 * k]]), P.spine); };
  if (side) {
    const by = G - 12 * k + bob, bx = cx - 4 * k;
    // the far legs, the tail, the body, the near legs, the wing, the neck and head
    for (const [x, ph] of [[bx - 7 * k, -step], [bx + 7 * k, step]]) F.part(line(x, by + 2 * k, x + ph * 2 * k, G - 1, W1(3 * k)), dark(P.scale));
    const tail = [[bx - 9 * k, by], [bx - 16 * k, by - 2 * k], [bx - 22 * k, by + 3 * k], [bx - 26 * k, by + 1 * k]];
    for (let i = 0; i < 3; i++) F.part(line(...tail[i], ...tail[i + 1], W1((4 - i) * k)), P.scale);
    F.part(poly([[bx - 26 * k, by + 1 * k], [bx - 30 * k, by - 2 * k], [bx - 28 * k, by + 4 * k]]), P.spine); // the tail's barb
    F.part(ellipse(bx, by - 1 * k, 11 * k, 6 * k), P.scale);
    F.part(ellipse(bx + 1 * k, by + 2 * k, 8 * k, 2.6 * k), P.belly, flat);
    spines([[bx - 6 * k, by - 6 * k, -1], [bx - 1 * k, by - 7 * k, -1], [bx + 4 * k, by - 6.5 * k, -1]]);
    for (const [x, ph] of [[bx - 6 * k, step], [bx + 8 * k, -step]]) { F.part(line(x, by + 2 * k, x + ph * 2 * k, G - 1, W1(3 * k)), P.scale); F.part(line(x + ph * 2 * k, G - 1, x + ph * 2 * k + 2 * k, G - 1, w), P.horn, flat); }
    wing(-1, bx + 2 * k, by - 5 * k);
    const nx = bx + 13 * k, ny = by - 11 * k;
    F.part(both(line(bx + 7 * k, by - 3 * k, bx + 11 * k, by - 8 * k, W1(4 * k)), line(bx + 11 * k, by - 8 * k, nx, ny + 2 * k, W1(3.5 * k))), P.scale);
    if (P.vein) { // red cracks along it, a crest of black spikes down its neck
      F.part(both(line(bx - 7 * k, by - 2 * k, bx - 2 * k, by + 1 * k, 1), line(bx - 2 * k, by + 1 * k, bx + 4 * k, by - 2 * k, 1), line(bx + 4 * k, by - 2 * k, bx + 9 * k, by - 6 * k, 1)), P.vein, flat);
      for (let i = 0; i < 4; i++) { const x = bx + 8 * k + i * 1.4 * k, y = by - 6 * k - i * 1.6 * k; F.part(poly([[x - 0.9 * k, y], [x + 0.9 * k, y], [x - 2 * k, y - 4 * k]]), P.spine); }
    }
    F.part(ellipse(nx + 1 * k, ny, 4.5 * k, 3.6 * k), P.scale); // the head
    if (P.vein) for (let i = 0; i < 4; i++) F.part(poly([[nx - 2 * k + i * 1.3 * k, ny - 2.5 * k], [nx - 0.6 * k + i * 1.3 * k, ny - 2.8 * k], [nx - 3 * k + i * 1.1 * k, ny - 6.5 * k + i * 0.4 * k]]), P.spine);
    F.part(poly([[nx + 3 * k, ny - 2 * k], [nx + 10 * k, ny - 0.5 * k], [nx + 10 * k, ny + 1 * k], [nx + 3 * k, ny + 1 * k]]), P.scale); // the upper jaw
    F.part(poly([[nx + 3 * k, ny + 1.5 * k], [nx + 9 * k, ny + 1.5 * k + gape], [nx + 8 * k, ny + 3 * k + gape], [nx + 3 * k, ny + 3 * k]]), P.belly); // the lower
    F.part(poly([[nx + 4 * k, ny + 1 * k], [nx + 9.5 * k, ny + 1 * k], [nx + 8.5 * k, ny + 1.5 * k + gape], [nx + 4 * k, ny + 2 * k]]), P.mouth);
    if (P.venom && atk >= 0) F.part(line(nx + 8 * k, ny + 2 * k + gape, nx + 8.5 * k, ny + 6 * k + gape, w), P.venom, flat);
    for (const s of [0, 1]) F.part(poly([[nx - 1 * k + s * 2 * k, ny - 2.5 * k], [nx - 5 * k + s * 2 * k, ny - 8 * k], [nx + 0.5 * k + s * 2 * k, ny - 3 * k]]), P.horn); // horns, swept back
    F.part(ellipse(nx + 2 * k, ny - 1 * k, 0.9 * k, 0.7 * k), P.eye, flat);
    return;
  }
  const by = G - 10 * k + bob;
  if (!back) { // the tail, curling round behind it
    const tail = [[cx + 6 * k, by + 2 * k], [cx + 13 * k, by + 5 * k], [cx + 18 * k, by + 2 * k], [cx + 20 * k, by - 3 * k]];
    for (let i = 0; i < 3; i++) F.part(line(...tail[i], ...tail[i + 1], W1((3.5 - i) * k)), P.scale);
  }
  for (const s of [-1, 1]) wing(s, cx + s * 5 * k, by - 9 * k);
  F.part(ellipse(cx, by - 3 * k, 10 * k, 7.5 * k), P.scale);
  if (!back) F.part(ellipse(cx, by - 1 * k, 5.5 * k, 5 * k), P.belly, flat);
  if (!back) for (let i = 0; i < 4; i++) F.part(line(cx - 4.5 * k + i * 0.4 * k, by - 4 * k + i * 2 * k, cx + 4.5 * k - i * 0.4 * k, by - 4 * k + i * 2 * k, w), dark(P.belly), flat); // belly plates
  if (P.mvp) for (const s of [-1, 1]) spines([[cx + s * 7 * k, by - 8 * k, s], [cx + s * 9.5 * k, by - 5 * k, s], [cx + s * 4 * k, by - 10 * k, s]]); // spines down its shoulders
  if (P.vein) for (const s of [-1, 1]) F.part(both(line(cx + s * 2 * k, by - 9 * k, cx + s * 5 * k, by - 5 * k, 1), line(cx + s * 5 * k, by - 5 * k, cx + s * 4 * k, by - 1 * k, 1), line(cx + s * 4 * k, by - 1 * k, cx + s * 7 * k, by + 2 * k, 1)), P.vein, flat); // red cracks in its scales
  for (const s of [-1, 1]) { const lx = cx + s * 6 * k + s * step * k * 0.5; F.part(rect(lx - 2 * k, by, lx + 2 * k, G - 1), P.scale); F.part(line(lx - 2 * k, G - 1, lx + 2 * k, G - 1, w), P.horn, flat); }
  if (back) {
    spines([[cx, by - 9 * k, 0], [cx, by - 5 * k, 0], [cx, by - 1 * k, 0]]);
    const tail = [[cx, by + 3 * k], [cx + 2 * k, by + 7 * k], [cx - 1 * k, by + 9 * k]];
    for (let i = 0; i < 2; i++) F.part(line(...tail[i], ...tail[i + 1], W1((3 - i) * k)), P.scale);
  }
  // the neck rising to the head, facing you: horns, eyes, jaws open on fangs
  const hy = by - 16 * k;
  F.part(line(cx, by - 8 * k, cx, hy + 3 * k, W1(5 * k)), P.scale);
  for (const s of [-1, 1]) F.part(poly([[cx + s * 2.5 * k, hy - 2 * k], [cx + s * 7 * k, hy - 8 * k], [cx + s * 4 * k, hy - 1 * k]]), P.horn);
  F.part(ellipse(cx, hy, 5 * k, 4.2 * k), P.scale);
  if (P.vein) { // the crest of black spikes over its head, red cracks down its brow
    for (let i = -3; i <= 3; i++) F.part(poly([[cx + i * 1.4 * k - 0.9 * k, hy - 3 * k], [cx + i * 1.4 * k + 0.9 * k, hy - 3 * k], [cx + i * 1.9 * k, hy - (7.5 - Math.abs(i)) * k]]), P.spine);
    if (!back) for (const s of [-1, 1]) F.part(line(cx + s * 1 * k, hy - 3.5 * k, cx + s * 2.5 * k, hy - 0.5 * k, 1), P.vein, flat);
  }
  if (back) return;
  F.part(poly([[cx - 3.5 * k, hy + 1 * k], [cx + 3.5 * k, hy + 1 * k], [cx + 2.8 * k, hy + 5 * k + gape], [cx - 2.8 * k, hy + 5 * k + gape]]), P.mouth);
  F.part(poly([[cx - 4 * k, hy + 4 * k + gape], [cx + 4 * k, hy + 4 * k + gape], [cx + 3 * k, hy + 6.5 * k + gape], [cx - 3 * k, hy + 6.5 * k + gape]]), P.belly); // the lower jaw
  for (const s of [-1, 1]) { F.part(poly([[cx + s * 2.6 * k, hy + 1 * k], [cx + s * 1.8 * k, hy + 1 * k], [cx + s * 2.2 * k, hy + 3 * k]]), '#f6f0e0', flat); F.part(ellipse(cx + s * 2 * k, hy - 1.2 * k, 1.1 * k, 0.8 * k), P.eye, flat); F.dot(cx + s * 2 * k, hy - 1.2 * k, '#1a0808'); }
  if (P.venom && atk >= 0) for (const s of [-1, 1]) F.part(line(cx + s * 1.5 * k, hy + 6.5 * k + gape, cx + s * 1.6 * k, hy + 9 * k + gape, w), P.venom, flat);
}

// ---------- Ratatoskr (the owner's sheet): an armoured messenger squirrel standing on its hind legs, dark
// plate traced with gold runes, a red scarf, a torn red cloak (the World Tree in gold on its back), a
// runed helm with its tufted ears through it, and a huge fiery tail covered in glowing runes; it springs
// in with its claws, its tail flaring ----------
function ratatoskr(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -2 : 0, lunge = atk >= 0 ? [1, 4, 6, 2][atk] : 0, flare = atk >= 0 ? [1, 2, 3, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 18 + bob, sh = G - 34 + bob;
  // the tail: a great S of fire-orange fur rising behind, runes glowing in it (in front of the body from behind)
  const tail = () => {
    const sx = side ? -1 : 1, base = [cx + sx * (side ? 6 : 5), hip + 2];
    const mid = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; mid.push([base[0] + sx * (Math.sin(t * 3.4) * 11 + t * 6), base[1] - t * 40 - flare * t * 2, 3 + Math.sin(t * Math.PI * 0.9 + 0.2) * 6 + flare * 0.4]); }
    const edge = (k, jag) => mid.map(([x, y, r], i) => { // one side of the tail, its fur in tufts
      const [x0, y0] = mid[Math.max(0, i - 1)], [x1, y1] = mid[Math.min(16, i + 1)], dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
      const rr = r * (1 + (jag && i % 2 ? 0.28 : 0));
      return [x + (-dy / d) * rr * k, y + (dx / d) * rr * k];
    });
    const out = [...edge(1, true), [mid[16][0], mid[16][1] - mid[16][2] - 3], ...edge(-1, true).reverse()];
    F.part(poly(out), P.tail);
    F.part(poly([...edge(0.55, false), ...edge(-0.2, false).reverse()]), P.tailHi, flat); // the light down it
    for (let i = P.kin ? 6 : 3; i < 16; i += P.kin ? 5 : 3) { const [x, y] = mid[i]; F.part(both(line(x - 2, y - 2, x + 2, y + 2, 1), line(x - 2, y + 2, x + 2, y - 2, 1), line(x, y - 3, x, y + 3, 1)), P.rune, flat); } // runes glowing in the fur
    if (!P.kin) for (let i = 0; i < 7; i++) { const [x, y, r] = mid[2 + i * 2]; F.dot(x + sx * (r + 2 + (i % 2) * 2), y - 1, P.rune); } // sparks off its edge
  };
  if (!back) tail();
  if (!P.kin) {
  // the cloak behind, torn at the hem
  const hem = [];
  for (let i = 0; i <= 6; i++) hem.push([cx - 11 + i * 3.7 + (side ? -4 : 0), G - 4 + (i % 2 ? -4 : 0) + bob]);
  F.part(poly([[cx - 7 + (side ? -3 : 0), sh + 1], [cx + 7 + (side ? -5 : 0), sh + 1], ...hem.reverse()]), P.cloak);
  if (back) { // the World Tree in gold on the cloak, then the tail over it
    F.part(line(cx, sh + 8, cx, hip + 6, 1), P.trim, flat);
    for (const s of [-1, 1]) { F.part(line(cx, sh + 9, cx + s * 4, sh + 5, 1), P.trim, flat); F.part(line(cx, hip + 5, cx + s * 4, hip + 9, 1), P.trim, flat); }
    tail();
  }
  } else if (back) tail();
  // legs: armoured, digitigrade, clawed feet
  for (const s of side ? [-1, 1] : [-1, 1]) {
    const lx = cx + (side ? s * 2 : s * 4) + s * step * (side ? 2 : 1);
    F.part(both(ellipse(lx, hip + 3, 3.2, 4), line(lx, hip + 5, lx + (side ? 1 : 0), G - 2, 3)), side && s < 0 ? dark(P.armor) : P.armor);
    F.part(line(lx - 2, hip + 1, lx + 2, hip + 1, 1), P.trim, flat);
    for (const t of [-1.5, 0, 1.5]) F.part(line(lx + t, G - 1, lx + t * 1.4 + (side ? 1 : 0), G, 1), P.claw, flat);
  }
  // the body: dark plate, gold rune trim, a glowing rune circle on the chest; a red scarf at the neck
  F.part(poly([[cx - 7, sh], [cx + 7, sh], [cx + 6, hip + 2], [cx - 6, hip + 2]]), P.armor);
  F.part(line(cx - 6, hip, cx + 6, hip, 1), P.trim, flat);
  if (!back && !P.kin) {
    F.part(ellipse(cx + (side ? 2 : 0), sh + 7, 3, 3), P.trim);
    F.part(ellipse(cx + (side ? 2 : 0), sh + 7, 1.6, 1.6), P.rune, flat);
    F.part(both(line(cx - 5, sh + 2, cx - 1, sh + 12, 1), line(cx + 5, sh + 2, cx + 1, sh + 12, 1)), P.trim, flat);
  }
  if (!back && P.kin) { F.part(ellipse(cx + (side ? 2 : 0), sh + 9, 3.5, 3.5), P.face, flat); F.part(line(cx - 6, sh + 5, cx + 6, sh + 5, 1), P.trim, flat); } // the pale belly under the jerkin's laces
  if (!P.kin) for (const s of side ? [1] : [-1, 1]) F.part(ellipse(cx + s * 7 - (side ? 4 : 0), sh + 2, 3.6, 3), P.armor); // pauldrons
  if (!P.kin) for (const s of side ? [1] : [-1, 1]) F.part(line(cx + s * 9 - (side ? 6 : 0), sh, cx + s * 9 - (side ? 6 : 0), sh + 3, 1), P.trim, flat);
  // arms, the claws reaching in on the attack
  const arm = (s, x0) => {
    const ex = x0 + s * 4 + (side ? 6 + lunge : 0), ey = sh + 12 - (atk >= 0 ? lunge : 0);
    F.part(line(x0, sh + 3, ex, ey, 3), P.armor);
    F.part(ellipse(ex, ey + 1, 2.2, 2), P.fur);
    for (const t of [-1.2, 0, 1.2]) F.part(line(ex + t, ey + 2, ex + t + s * 0.8 + (side ? 1.5 : 0), ey + 4.5, 1), P.claw, flat);
  };
  if (side) arm(1, cx + 1); else if (!back) { arm(-1, cx - 6); arm(1, cx + 6); }
  F.part(ellipse(cx + (side ? 2 : 0), sh, 6, 2.6), P.cloak); // the scarf
  // the head: a squirrel's face under a runed helm, the ears up through it, tufted
  const hx = cx + (side ? 4 + lunge * 0.5 : 0), hy = sh - 7;
  for (const s of side ? [-1] : [-1, 1]) {
    const ex = hx + s * 3.5 - (side ? 2 : 0);
    F.part(poly([[ex - 2, hy - 4], [ex + s * 1 + (side ? -1 : 0), hy - 15], [ex + 2, hy - 4]]), P.fur);
    F.part(line(ex + s * 1, hy - 14, ex + s * 2, hy - 18, 1), P.tail, flat); // the tuft
  }
  F.part(ellipse(hx, hy, 6.4, 6), back ? P.armor : P.fur);
  if (side) F.part(ellipse(hx + 5, hy + 2, 3.4, 2.6), P.face); // the snout
  else if (!back) { F.part(ellipse(hx, hy + 2.5, 4.4, 3.4), P.face); for (const s of [-1, 1]) F.part(line(hx + s * 2, hy + 3, hx + s * 7, hy + 2, 1), '#f6eedc', flat); } // the muzzle, whiskers
  if (P.kin) { // no helm: a tuft of fur on the crown
    if (back) return;
    F.part(poly([[hx - 2, hy - 5], [hx, hy - 8], [hx + 2, hy - 5]]), P.tail);
  } else {
  // the helm: dark, gold trim, a leaf crest down the middle, over the brow only
  F.part(rows(ellipse(hx - (side ? 1 : 0), hy - 1, 6.8, 6.4), hy - 8, hy - 3), P.armor);
  F.part(line(hx - 6 + (side ? -1 : 0), hy - 3, hx + 6 - (side ? 1 : 0), hy - 3, 1), P.trim, flat);
  F.part(poly([[hx - 1.2, hy - 7], [hx, hy - 11], [hx + 1.2, hy - 7]]), P.trim);
  if (back) return;
  }
  if (side) { F.part(ellipse(hx + 1.5, hy, 1.1, 1.3), P.eye, flat); F.dot(hx + 1.2, hy - 0.6, '#ffffff'); F.dot(hx + 8, hy + 1.5, '#2a1a10'); }
  else for (const s of [-1, 1]) { F.part(ellipse(hx + s * 2.6, hy, 1.1, 1.3), P.eye, flat); F.dot(hx + s * 2.6 - 0.4, hy - 0.6, '#ffffff'); }
  if (!side) F.dot(hx, hy + 2, '#2a1a10'); // the nose
}
const rows = (shape, y0, y1) => (set) => shape((x, y) => { if (y >= y0 && y < y1) set(x, y); });
