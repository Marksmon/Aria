// The desert's monsters, painted pixel by pixel in code like Veidheim's beasts (beasts.js): giant
// ants, cacti that throw their needles, dune worms rising out of the sand, sand scorpions, the big
// flightless runner birds, and their bosses: the Cactus Lord (a tall dark cactus with a spiked crown,
// yellow diamond eyes, a jagged grin and spiked fists, after the owner's reference), the Rainbow
// Runner (the runner in rainbow plumage) and the MVP, the Sand Wyrm (after the owner's picture: a
// ringed, ridged worm whose head opens like a flower into armoured flaps round a maw of hooked teeth,
// ring after ring, down to a dark throat). Pharaoh's Tomb (raid.js) brings scarabs, mummies and the
// Pharaoh himself, a mummy king in a striped gold-and-lapis headdress with a gold mask, crook and flail.
// Each part is filled, shaded and outlined on its own (Frame.part). Frames: 4 directions (down, up,
// right; left is right mirrored) x idle (1), walk (4) and attack (4). Plain canvas: sprites.js makes
// the sprite sets.
import { Frame, ellipse, rect, poly, line, both, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
const RAINBOW = ['#ff5a5a', '#ffa03a', '#ffe04a', '#6ad85a', '#4aa8ff', '#a86aff'];
// size: the frame; body: the standing figure in pixels (for sizing in the world: def.w is its width)
export const DESERT = {
  giantAnt: { kind: 'ant', size: [56, 40], body: [30, 20], shell: '#b8542a', leg: '#7a3018', eye: '#1e1410', jaw: '#e8c890' },
  soldierAnt: { kind: 'ant', soldier: true, size: [56, 40], body: [30, 22], shell: '#3a3036', leg: '#221c22', eye: '#ff6a3a', jaw: '#d8c8a8' },
  cactus: { kind: 'cactus', size: [40, 52], body: [22, 44], skin: '#4f8a3a', rib: '#3e6e2e', spine: '#f2ead0', eye: '#1e1410', flower: '#ff7aa0' },
  cactusLord: { kind: 'cactusLord', size: [64, 84], body: [34, 78], skin: '#2f6a3a', light: '#7cb85a', crown: '#24542e', band: '#e8c84a', eye: '#ffd23a', mouth: '#1a1410', fist: '#3e7a3a', spine: '#efe6cc' },
  duneWorm: { kind: 'worm', size: [52, 52], body: [26, 40], hide: '#a88a6a', ridge: '#7a5e44', belly: '#d0b48e', flesh: '#9a3a3a', teeth: '#f2ead0', sand: '#d8b878' },
  sandWyrm: { kind: 'worm', mvp: true, size: [120, 124], body: [80, 108], hide: '#9a8064', ridge: '#6a5240', belly: '#c4a882', flesh: '#a83a3a', teeth: '#f6eedc', sand: '#d8b070', spine: '#e2d2b0' },
  scorpion: { kind: 'scorpion', size: [56, 44], body: [32, 26], shell: '#c0803e', dark: '#7a4a22', sting: '#2a1a10', eye: '#1e1410' },
  tombScorpion: { kind: 'scorpion', size: [56, 44], body: [32, 26], shell: '#5a3a6a', dark: '#2e1e3a', sting: '#c8ff6a', eye: '#c8ff6a' },
  runner: { kind: 'runner', size: [56, 66], body: [30, 58], feather: '#f2c43a', dark: '#c8922a', crest: '#ffd84a', beak: '#f29a3a', eye: '#2a1a10', wrap: '#6a4226', buckle: '#d8b050', talon: '#2a2228', saddle: '#7a4a2a', cloth: '#2e3f7a' },
  rainbowRunner: { kind: 'runner', boss: true, size: [56, 66], body: [30, 58], feather: '#fbf4ec', dark: '#d8c8c8', crest: '#ff5a8a', beak: '#f2b04a', eye: '#2a9a9a', wrap: '#6a4226', buckle: '#d8b050', talon: '#2a2228', saddle: '#7a4a2a', cloth: '#2e3f7a', rainbow: RAINBOW },
  scarab: { kind: 'scarab', size: [40, 32], body: [22, 14], shell: '#2a7a7a', gold: '#e8c050', leg: '#1e3a3a' },
  mummy: { kind: 'mummy', size: [44, 56], body: [20, 46], wrap: '#d8ccaa', shade: '#a89a78', eye: '#8affc8', skin: '#4a3a2a' },
  canopicJar: { kind: 'jar', size: [28, 34], body: [16, 28], clay: '#d8b070', band: '#2e4f9a', gold: '#f0c040', lid: '#3a3a3a', eye: '#ffd23a' },
  pharaoh: { kind: 'mummy', king: true, size: [72, 88], body: [36, 80], wrap: '#d8ccaa', shade: '#a89a78', eye: '#ff5a3a', skin: '#4a3a2a', gold: '#f0c040', lapis: '#2e4f9a', mask: '#e8b840' },
};
// the Sand Wyrm under the sand: a mound with its spines breaking the surface (sprites.js: wyrmMound)
export const MOUND = { size: [96, 40], body: [80, 24] };

const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function desertSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => desertFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}
export function desertFrame(id, dir, anim, f) {
  if (dir === 'left') return desertFrame(id, 'right', anim, f).mirror();
  const P = DESERT[id], [W, H] = P.size;
  const F = new Frame(W, H);
  const a = { G: H - 3, W, H, walk: anim === 'walk', f, step: anim === 'walk' ? [1, 0, -1, 0][f] : 0, atk: anim === 'attack' ? f : -1 };
  ({ ant, cactus, cactusLord, worm, scorpion, runner, scarab, mummy, jar })[P.kind](F, P, dir, a);
  return F;
}
// a shape cut to rows y0..y1 (for bands of colour across a part)
const rows = (shape, y0, y1) => (set) => shape((x, y) => { if (y >= y0 && y < y1) set(x, y); });

// ---------- ants: three segments, six legs, mandibles that snap ----------
function ant(F, P, dir, { G, W, step, walk, f, atk }) {
  const S = P.soldier ? 1.25 : 1, bob = walk && f % 2 ? -1 : 0, cx = W / 2;
  const snap = atk >= 0 ? [2, 4, 0, 1][atk] : 1; // how far the jaws open
  const legs = (pts, col) => { for (const [x0, y0, kx, ky, x1] of pts) { F.part(line(x0, y0, kx, ky, 1), col, flat); F.part(line(kx, ky, x1, G, 1), col, flat); } };
  if (dir === 'right') {
    const lunge = atk >= 0 ? [0, 2, 3, 1][atk] : 0, by = G - 9 + bob, hx = cx + 10 + lunge;
    // the far legs, the gaster, the thorax, the near legs, the head
    legs([[cx - 1, by, cx - 6 + step, by - 5, cx - 9 + step], [cx + 2, by, cx + 3 - step, by - 5, cx + 1 - step], [cx + 4, by, cx + 10 + step, by - 4, cx + 12 + step]], P.leg);
    F.part(ellipse(cx - 12, by - 2, 9 * (P.soldier ? 1 : 1.05), 6.5), P.shell);
    F.part(line(cx - 17, by - 5, cx - 9, by - 7, 1), light(P.shell), flat);
    F.part(ellipse(cx - 3, by, 1.8, 1.8), P.shell);
    F.part(ellipse(cx + 2, by - 1, 5, 3.4), P.shell);
    legs([[cx, by + 1, cx - 4 - step, by - 3, cx - 7 - step], [cx + 3, by + 1, cx + 5 + step, by - 3, cx + 4 + step], [cx + 5, by + 1, cx + 12 - step, by - 2, cx + 14 - step]], dark(P.leg));
    F.part(ellipse(hx, by - 3, 5.5 * S, 4.8 * S), P.shell);
    F.dot(hx + 2, by - 5, P.eye); F.dot(hx + 3, by - 5, P.eye);
    for (const s of [-1, 1]) F.part(line(hx + 4 * S, by - 1, hx + 9 * S, by - 1 + s * snap, 2), P.jaw, flat);
    F.part(line(hx, by - 7 * S, hx + 4, by - 13, 1), P.leg, flat); F.part(line(hx + 4, by - 13, hx + 9, by - 14, 1), P.leg, flat); // an antenna
    return;
  }
  const front = dir === 'down', by = G - 8 + bob;
  // legs splayed both sides
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { // short, bent legs (an ant, not a spider)
    const ky = by - 2 - i * 2, sw = (i % 2 ? step : -step) * s, kx = cx + s * (7 + i * 2);
    F.part(line(cx + s * 3, by - 1 - i * 2, kx, ky - 2, 2), P.leg);
    F.part(line(kx, ky - 2, kx + s * 2 + sw, G - (i === 1 ? 1 : 0), 1), P.leg, flat);
  }
  if (front) {
    F.part(ellipse(cx, by - 9, 8, 6), P.shell); // the gaster behind
    F.part(ellipse(cx, by - 3, 5, 3), P.shell);
    F.part(ellipse(cx, by, 6 * S, 5 * S), P.shell); // the head in front
    F.dot(cx - 3, by - 1, P.eye); F.dot(cx + 3, by - 1, P.eye);
    for (const s of [-1, 1]) F.part(line(cx + s * 2, by + 4 * S, cx + s * (1 + snap), by + 7 * S, 2), P.jaw, flat);
    for (const s of [-1, 1]) { F.part(line(cx + s * 2, by - 4 * S, cx + s * 4, by - 10, 1), P.leg, flat); F.part(line(cx + s * 4, by - 10, cx + s * 9, by - 12, 1), P.leg, flat); } // elbowed antennae
  } else {
    for (const s of [-1, 1]) F.part(line(cx + s * 2, by - 12, cx + s * 7, by - 18, 1), P.leg, flat);
    F.part(ellipse(cx, by - 10, 5 * S, 4.5 * S), P.shell); // the head behind
    F.part(ellipse(cx, by - 5, 5, 3), P.shell);
    F.part(ellipse(cx, by, 9, 6.5), P.shell); // the gaster in front
    F.part(line(cx - 5, by - 3, cx + 2, by - 4, 1), light(P.shell), flat);
  }
}

// ---------- a cactus: a ribbed trunk with arms, an angry face, a flower on top; it hops and throws needles ----------
function cactus(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, hop = walk ? [0, -2, -3, -1][f] : 0, top = G - 40 + hop;
  const arms = atk >= 0 ? [8, 12, 4, 6][atk] : 6; // raised to fling
  if (dir === 'right') {
    F.part(both(rect(cx - 5, top + 4, cx + 5, G - 1 + hop), ellipse(cx, top + 5, 5, 5)), P.skin);
    F.part(line(cx - 1, top + 6, cx - 1, G - 3 + hop, 1), P.rib, flat);
    F.part(both(line(cx + 4, top + 24, cx + 10, top + 24, 4), line(cx + 10, top + 24, cx + 11, top + 24 - arms, 4)), P.skin);
    F.dot(cx + 3, top + 12, P.eye); F.part(line(cx + 1, top + 10, cx + 4, top + 11, 1), P.eye, flat);
    F.part(line(cx + 2, top + 17, cx + 4, top + 17, 1), P.eye, flat);
  } else {
    for (const s of [-1, 1]) F.part(both(line(cx + s * 5, top + 24 - s * 4, cx + s * 11, top + 24 - s * 4, 4), line(cx + s * 11, top + 24 - s * 4, cx + s * 11, top + 22 - s * 4 - arms, 4)), P.skin);
    F.part(both(rect(cx - 7, top + 5, cx + 7, G - 1 + hop), ellipse(cx, top + 6, 7, 6)), P.skin);
    for (const x of [-3, 0, 3]) F.part(line(cx + x, top + 4, cx + x, G - 3 + hop, 1), x ? P.rib : light(P.skin), flat);
    if (dir === 'down') {
      for (const s of [-1, 1]) { F.part(rect(cx + s * 3 - 1, top + 11, cx + s * 3, top + 13), P.eye, flat); F.part(line(cx + s * 1, top + 9, cx + s * 5, top + 10, 1), P.eye, flat); }
      F.part(poly([[cx - 3, top + 18], [cx + 3, top + 18], [cx + 2, top + 21], [cx - 2, top + 21]]), atk >= 0 ? '#7a2a2a' : P.eye);
    }
  }
  for (let i = 0; i < 10; i++) F.dot(cx - 5 + ((i * 7) % 11), top + 8 + ((i * 13) % 28), P.spine);
  for (let i = 0; i < 5; i++) F.dot(cx - 2 + (i % 3) * 2, top - 1 + (i > 2 ? 1 : 0), P.flower); // the flower
}

// ---------- the Cactus Lord: a tall dark cactus, a spiked crown, diamond eyes, a jagged grin, spiked fists ----------
function cactusLord(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, sh = G - 44 + bob; // the shoulders
  const raise = atk >= 0 ? [10, 18, 4, 0][atk] : 0; // the fists come up, then down
  const fist = (x, y) => { F.part(ellipse(x, y, 4.5, 4.5), P.fist); for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; F.dot(x + Math.cos(ang) * 6, y + Math.sin(ang) * 6, P.spine); } };
  const crown = (y) => { // a wide brim, a tall cone with a jagged edge, a gold band
    F.part(ellipse(cx, y, 15, 3), P.crown);
    F.part(poly([[cx - 10, y - 1], [cx - 7, y - 10], [cx - 9, y - 12], [cx - 4, y - 14], [cx, y - 26], [cx + 4, y - 14], [cx + 9, y - 12], [cx + 7, y - 10], [cx + 10, y - 1]]), P.crown);
    F.part(rect(cx - 9, y - 4, cx + 9, y - 2), P.band, flat);
    for (const s of [-1, 1]) F.part(line(cx + s * 12, y - 1, cx + s * 18, y - 7, 1), P.spine, flat); // spikes off the brim
  };
  // legs and the cloak-like lower body, its edge in points
  for (const s of [-1, 1]) F.part(rect(cx + s * 5 - 2 + (s * step), G - 8 + bob, cx + s * 5 + 2 + (s * step), G), dark(P.skin));
  const hem = [];
  for (let i = 0; i <= 6; i++) hem.push([cx - 15 + i * 5, G - 6 + (i % 2 ? -5 : 0) + bob]);
  F.part(poly([[cx - 10, sh], [cx + 10, sh], ...hem.reverse()]), P.skin);
  if (dir !== 'up') {
    F.part(poly([[cx, sh + 6], [cx + 7, sh + 16], [cx, sh + 28], [cx - 7, sh + 16]]), P.light); // the pale diamond on its chest
    F.part(poly([[cx, sh + 11], [cx + 3, sh + 16], [cx, sh + 22], [cx - 3, sh + 16]]), P.band, flat);
  }
  for (let i = 0; i < 14; i++) F.dot(cx - 11 + ((i * 7) % 22), sh + 4 + ((i * 11) % 30), P.spine);
  // arms out and down to the spiked fists (raised to slam on the attack)
  if (dir === 'right') {
    F.part(line(cx + 4, sh + 3, cx + 16, sh + 14 - raise, 4), P.skin);
    fist(cx + 18, sh + 16 - raise);
  } else for (const s of [-1, 1]) {
    F.part(line(cx + s * 9, sh + 2, cx + s * 20, sh + 16 - raise, 4), P.skin);
    fist(cx + s * 21, sh + 19 - raise);
  }
  // the head: a round cactus head under the crown
  const hy = sh - 8;
  F.part(ellipse(cx + (dir === 'right' ? 2 : 0), hy, 11, 9), P.skin);
  if (dir === 'down') {
    for (const s of [-1, 1]) {
      F.part(poly([[cx + s * 5, hy - 4], [cx + s * 9, hy - 1], [cx + s * 5, hy + 2], [cx + s * 1.5, hy - 1]]), P.eye); // yellow diamond eyes
      F.part(rect(cx + s * 5 - 0.5, hy - 2, cx + s * 5 + 0.5, hy), '#1a1410', flat);
    }
    const open = atk >= 0 ? 2 : 0, grin = [];
    for (let i = 0; i <= 8; i++) grin.push([cx - 8 + i * 2, hy + 4 + (i % 2 ? 2 : 0)]);
    for (let i = 8; i >= 0; i--) grin.push([cx - 8 + i * 2, hy + 6 + open + (i % 2 ? 0 : 1)]);
    F.part(poly(grin), P.mouth); // the jagged grin
  } else if (dir === 'right') {
    F.part(poly([[cx + 8, hy - 4], [cx + 12, hy - 1], [cx + 8, hy + 1], [cx + 6, hy - 1]]), P.eye);
    F.dot(cx + 9, hy - 1, '#1a1410');
    F.part(poly([[cx + 6, hy + 4], [cx + 12, hy + 3], [cx + 11, hy + 6], [cx + 7, hy + 7]]), P.mouth);
  }
  crown(hy - 6);
}

// ---------- worms: a ringed body rising out of the sand, a maw that opens like a flower ----------
function worm(F, P, dir, { G, W, H, walk, f, atk }) {
  const big = !!P.mvp, k = big ? 2.3 : 1, cx = W / 2;
  const sway = walk ? [0, 1.5, 0, -1.5][f] * k : 0;
  const open = atk >= 0 ? [0.5, 1, 1, 0.6][atk] : big ? 0.55 : 0.15; // how wide the maw is
  const lean = atk >= 0 ? [0, 3, 5, 2][atk] * k : 0; // lunging at you
  const up = dir === 'up', side = dir === 'right';
  // the sand burst round where it comes up
  F.part(ellipse(cx, G - 2, 15 * k, 4 * k), P.sand);
  if (big) for (let i = 0; i < 18; i++) F.dot(cx - 30 + ((i * 17) % 60), G - 6 - ((i * 7) % 14) - (atk >= 0 ? 4 : 0), i % 2 ? P.sand : light(P.sand));
  // the body: rings from the sand up to the head, curving
  const n = big ? 7 : 5, segs = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = cx + Math.sin(t * 2.2 + 0.4) * 4 * k * (side ? 1.4 : 0.5) + sway * t + (side ? lean * t : 0);
    const y = G - 4 * k - t * (H - 30 * k - 6) + (side ? 0 : lean * t * 0.6);
    segs.push([x, y, (8.5 - t * 1.5) * k]);
  }
  for (const [x, y, r] of segs) {
    F.part(ellipse(x, y, r, r * 0.8), P.hide);
    F.part(line(x - r * 0.8, y + r * 0.45, x + r * 0.8, y + r * 0.45, big ? 2 : 1), P.ridge, flat); // the ring's groove
    if (!up && !side) F.part(ellipse(x, y + r * 0.1, r * 0.45, r * 0.4), P.belly, flat);
    if (P.spine) for (const s of [-1, 1]) F.part(line(x + s * r * 0.7, y - r * 0.55, x + s * r * 0.95, y - r * 0.95, 1), P.spine, flat);
  }
  const [hx0, hy, hr0] = segs[n - 1], hx = hx0 + (side ? 3 * k : 0), hr = hr0 * 1.15;
  if (up) { // the back of the head: ridged hide, spines down its crown
    F.part(ellipse(hx, hy, hr, hr * 0.9), P.hide);
    for (let i = -2; i <= 2; i++) F.part(line(hx + i * hr * 0.3, hy - hr * 0.8, hx + i * hr * 0.35, hy + hr * 0.6, 1), P.ridge, flat);
    return;
  }
  if (side) { // seen from the side: the flaps open above and below, rows of teeth between
    const gap = hr * 0.9 * open;
    F.part(poly([[hx - hr, hy - hr * 0.5], [hx + hr * 0.8, hy - hr * 0.7 - gap], [hx + hr * 1.3, hy - hr * 0.35 - gap * 1.2], [hx + hr * 0.4, hy - hr * 0.1]]), P.hide); // the upper flap
    F.part(poly([[hx - hr, hy + hr * 0.4], [hx + hr * 0.8, hy + hr * 0.6 + gap], [hx + hr * 1.3, hy + hr * 0.3 + gap * 1.2], [hx + hr * 0.4, hy + hr * 0.1]]), P.hide); // the lower flap
    F.part(poly([[hx - hr * 0.6, hy - hr * 0.2], [hx + hr * 1.1, hy - hr * 0.3 - gap], [hx + hr * 1.1, hy + hr * 0.3 + gap], [hx - hr * 0.6, hy + hr * 0.2]]), P.flesh);
    const teeth = big ? 7 : 4;
    for (let i = 0; i < teeth; i++) {
      const tx = hx - hr * 0.3 + (i / teeth) * hr * 1.4;
      F.part(poly([[tx, hy - hr * 0.25 - gap * (i / teeth)], [tx + 1.5 * k, hy - hr * 0.25 - gap * (i / teeth)], [tx + 0.7 * k, hy - gap * (i / teeth) * 0.4 + 1]]), P.teeth, flat);
      F.part(poly([[tx, hy + hr * 0.25 + gap * (i / teeth)], [tx + 1.5 * k, hy + hr * 0.25 + gap * (i / teeth)], [tx + 0.7 * k, hy + gap * (i / teeth) * 0.4 - 1]]), P.teeth, flat);
    }
    return;
  }
  // facing you: the maw, round, ringed with teeth pointing in, armoured flaps peeled back round it
  const mr = hr * (0.55 + open * 0.35);
  const flaps = big ? 4 : 3;
  for (let i = 0; i < flaps; i++) {
    const ang = -Math.PI / 2 + (i / flaps) * Math.PI * 2 + (big ? Math.PI / 4 : 0);
    const reach = hr * (1.05 + open * 0.45), wide = 0.62;
    const tip = [hx + Math.cos(ang) * reach * 1.15, hy + Math.sin(ang) * reach * 1.0];
    F.part(poly([[hx + Math.cos(ang - wide) * hr * 0.75, hy + Math.sin(ang - wide) * hr * 0.75], tip, [hx + Math.cos(ang + wide) * hr * 0.75, hy + Math.sin(ang + wide) * hr * 0.75]]), P.hide);
    F.part(line(hx + Math.cos(ang) * hr * 0.6, hy + Math.sin(ang) * hr * 0.6, tip[0], tip[1], 1), light(P.hide), flat);
  }
  F.part(ellipse(hx, hy, hr, hr * 0.92), P.hide);
  F.part(ellipse(hx, hy, mr, mr * 0.95), P.flesh);
  const rings = big ? 3 : 1;
  for (let r = 0; r < rings; r++) { // ring after ring of hooked teeth, pointing in
    const rr = mr * (1 - r * 0.24), cnt = big ? 14 - r * 2 : 8;
    for (let i = 0; i < cnt; i++) {
      const ang = (i / cnt) * Math.PI * 2 + r * 0.3, a1 = ang - 0.12, a2 = ang + 0.12;
      F.part(poly([[hx + Math.cos(a1) * rr, hy + Math.sin(a1) * rr * 0.95], [hx + Math.cos(a2) * rr, hy + Math.sin(a2) * rr * 0.95], [hx + Math.cos(ang) * rr * 0.72, hy + Math.sin(ang) * rr * 0.7]]), P.teeth, flat);
    }
  }
  F.part(ellipse(hx, hy, mr * 0.3, mr * 0.28), '#1a0c0a', flat); // the throat
}

// ---------- scorpions: pincers, eight legs, the tail curled over the back ----------
function scorpion(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, by = G - 7 + bob;
  const strike = atk >= 0 ? [0, 4, 7, 2][atk] : 0, pinch = atk >= 0 ? [2, 0, 1, 2][atk] : 2;
  if (dir === 'right') {
    for (let i = 0; i < 4; i++) { // legs
      const lx = cx - 6 + i * 4, sw = (i % 2 ? step : -step);
      F.part(both(line(lx, by, lx - 3 + sw, by - 4, 1), line(lx - 3 + sw, by - 4, lx - 4 + sw, G, 1)), P.dark, flat);
    }
    F.part(ellipse(cx, by - 2, 10, 4.5), P.shell);
    F.part(line(cx - 8, by - 5, cx + 4, by - 6, 1), light(P.shell), flat);
    // the tail: segments arching up and over, the sting forward
    const seg = [[cx - 10, by - 4], [cx - 15, by - 9], [cx - 16, by - 16], [cx - 12, by - 22], [cx - 5, by - 24], [cx + 1, by - 21]]
      .map(([x, y], i) => [x + strike * 1.7 * (i / 5) ** 2, y + strike * 1.3 * (i / 5) ** 2]); // (the strike swings the tail's tip forward, the rest following)
    seg.forEach(([x, y], i) => F.part(ellipse(x, y, 3 - i * 0.25, 2.6 - i * 0.2), P.shell));
    const [tx, ty] = seg[5];
    F.part(poly([[tx + 1, ty - 1], [tx + 5, ty + 2], [tx + 1, ty + 2]]), P.sting);
    // a pincer forward
    F.part(both(line(cx + 8, by - 1, cx + 14, by - 3, 2)), P.shell);
    F.part(poly([[cx + 14, by - 6], [cx + 20, by - 5 - pinch], [cx + 17, by - 3], [cx + 20, by - 1 + pinch], [cx + 14, by]]), P.shell);
    F.dot(cx + 8, by - 4, P.eye);
    return;
  }
  const front = dir === 'down';
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const sw = (i % 2 ? step : -step) * s;
    F.part(both(line(cx + s * 4, by - 3 + i, cx + s * (11 + i), by - 6 + i * 1.5, 1), line(cx + s * (11 + i), by - 6 + i * 1.5, cx + s * (13 + i) + sw, G, 1)), P.dark, flat);
  }
  const tail = (y0) => {
    const seg = [[cx, y0], [cx, y0 - 5], [cx, y0 - 10], [cx, y0 - 15 + strike * 0.5]];
    seg.forEach(([x, y], i) => F.part(ellipse(x, y, 3 - i * 0.3, 2.6), P.shell));
    const [tx, ty] = seg[3];
    F.part(poly([[tx - 2, ty - 1], [tx + 2, ty - 1], [tx, ty + 4 + strike]]), P.sting);
  };
  if (!front) tail(by - 4);
  F.part(ellipse(cx, by - 3, 8, 5.5), P.shell);
  for (const s of [-1, 1]) { // the pincers to each side, out front
    const py = front ? by + 1 : by - 7;
    F.part(line(cx + s * 6, by - 2, cx + s * 11, py, 2), P.shell);
    F.part(poly([[cx + s * 9, py - 3], [cx + s * 15, py - 2 - pinch], [cx + s * 12, py], [cx + s * 15, py + 2 + pinch], [cx + s * 9, py + 3]]), P.shell);
  }
  if (front) { F.dot(cx - 2, by - 4, P.eye); F.dot(cx + 2, by - 4, P.eye); tail(by - 8); }
}

// ---------- runners (after the owner's sheet): a big flightless bird with a spiky crest, a big curved
// beak, a bridle, a saddle with a blue cloth, leather-wrapped legs and dark talons; the Rainbow Runner
// white, its crest, wings and tail in every colour ----------
function runner(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -2 : 0, kick = atk >= 0 ? [0, 5, 8, 2][atk] : 0;
  const R = P.rainbow, peck = atk >= 0 ? [0, 2, 3, 1][atk] : 0;
  const plume = (shape, i = 0) => F.part(shape, R ? R[i % R.length] : i % 2 ? P.feather : P.dark); // a feather: the Rainbow Runner's each in its own colour
  const fluff = (x, y, rx, ry, n, col) => { // a round mass with a jagged, feathery edge
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? 1 : 1.18; pts.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]); }
    F.part(poly(pts), col);
  };
  const legY = G - 20 + bob;
  const leg = (x0, x1, lift, col) => { // a feathered thigh, a leather-wrapped shank, three dark talons
    F.part(line(x0, legY, x1, G - 9 - lift, 3), col);
    F.part(line(x1, G - 10 - lift, x1, G - 2 - lift, 3), P.wrap);
    F.part(line(x1 - 1, G - 7 - lift, x1 + 1, G - 7 - lift, 1), P.buckle, flat);
    for (const t of [-2, 0, 2]) F.part(line(x1, G - 2 - lift, x1 + t + 1.5, G - lift, 1), P.talon, flat);
  };
  const saddle = (x, y, w) => { // the saddle on its back, its blue cloth with a gold sign hanging down
    F.part(poly([[x - w, y], [x + w, y], [x + w - 1, y + 9], [x - w + 1, y + 9]]), P.cloth);
    F.part(rect(x - 1, y + 3, x + 1, y + 6), P.buckle, flat);
    F.part(ellipse(x, y - 1, w + 1, 2.5), P.saddle);
  };
  if (dir === 'right') {
    leg(cx - 3, cx - 5 - step * 3, 0, R ? '#e8dcd0' : P.dark);
    // the tail: a big spiky fan behind
    for (let i = 0; i < 5; i++) plume(poly([[cx - 10, legY - 10 + i], [cx - 22 - i * 1.5, legY - 26 + i * 5], [cx - 14, legY - 6 + i]]), i);
    fluff(cx - 1, legY - 9, 12, 10, 8, R ? P.feather : P.feather);
    if (!R) F.part(ellipse(cx + 3, legY - 7, 6, 6), light(P.feather), flat); // a pale breast
    for (let i = 0; i < 4; i++) plume(poly([[cx - 4, legY - 14 + i * 2], [cx + 4, legY - 12 + i * 2], [cx - 12 + i, legY - 2 + i * 2]]), i + 1); // the wing
    saddle(cx - 3, legY - 19, 5);
    const nx = cx + 8 + peck, ny = legY - 31 + peck;
    F.part(line(cx + 6, legY - 15, nx, ny + 5, 6), P.feather); // the neck
    fluff(nx + 1, ny, 6, 5.5, 6, P.feather); // the head
    for (let i = 0; i < 5; i++) F.part(poly([[nx - 3, ny - 3 + i], [nx - 10 - i * 1.5, ny - 9 + i * 3], [nx - 1, ny - 1 + i]]), R ? R[i] : P.crest); // the crest, swept back
    F.part(poly([[nx + 4, ny - 2], [nx + 13, ny], [nx + 12, ny + 5], [nx + 4, ny + 3]]), P.beak); // the big curved beak
    F.part(line(nx + 5, ny + 1.5, nx + 12, ny + 2.5, 1), dark(P.beak), flat);
    F.dot(nx + 2, ny - 2, P.eye); F.dot(nx + 2, ny - 3, '#ffffff');
    F.part(line(nx + 1, ny + 3, nx + 6, ny + 3, 1), P.saddle, flat); F.part(line(nx + 1, ny + 3, cx - 2, legY - 18, 1), P.saddle, flat); // the bridle and its rein
    leg(cx + 3, cx + 4 + step * 3 + kick, kick * 0.6, R ? '#f4ece4' : P.feather);
    return;
  }
  const front = dir === 'down';
  for (const s of [-1, 1]) leg(cx + s * 4, cx + s * 5 + s * step * 2, s > 0 ? kick * 0.6 : 0, R ? '#f4ece4' : P.feather);
  if (!front) for (let i = 0; i < 7; i++) plume(poly([[cx - 4 + (i - 3) * 1.5, legY - 10], [cx + (i - 3) * 5.5 - 2, legY - 32 + Math.abs(i - 3) * 3], [cx + (i - 3) * 5.5 + 2, legY - 31 + Math.abs(i - 3) * 3], [cx + 4 + (i - 3) * 1.5, legY - 10]]), i); // the tail fan
  const ny = legY - 32 + peck;
  F.part(both(line(cx - 2, legY - 14, cx - 2, ny + 4, 4), line(cx + 2, legY - 14, cx + 2, ny + 4, 4)), P.feather); // the neck, behind the body
  fluff(cx, legY - 8, 12, 11, 9, P.feather);
  if (front && !R) F.part(ellipse(cx, legY - 9, 6, 7), light(P.feather), flat); // a pale breast
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) plume(poly([[cx + s * 8, legY - 17 + i * 3], [cx + s * (17 + i), legY - 12 + i * 4], [cx + s * 9, legY - 5 + i * 2]]), (s > 0 ? 3 : 0) + i); // the wings
  if (front) for (const s of [-1, 1]) F.part(line(cx + s * 7, legY - 18, cx + s * 2, legY - 3, 1), P.saddle, flat); // the harness straps
  else saddle(cx, legY - 20, 6);
  fluff(cx, ny, 7.5, 6.5, 7, P.feather); // a big round head
  for (let i = 0; i < 7; i++) F.part(poly([[cx - 4.5 + i * 1.5, ny - 4], [cx + (i - 3) * 3, ny - 15 + Math.abs(i - 3) * 1.8], [cx - 2.5 + i * 1.5, ny - 4]]), R ? R[i % R.length] : i % 2 ? P.crest : P.feather); // the crest, spiking up
  if (front) {
    for (const s of [-1, 1]) { F.part(rect(cx + s * 4 - 1, ny - 2, cx + s * 4, ny), P.eye, flat); F.dot(cx + s * 4 - (s > 0 ? 1 : 0), ny - 2, '#ffffff'); }
    F.part(poly([[cx - 4, ny + 1], [cx + 4, ny + 1], [cx + 3, ny + 6], [cx, ny + 9], [cx - 3, ny + 6]]), P.beak); // the big beak, pointing at you
    F.part(line(cx - 6, ny + 2, cx + 6, ny + 2, 1), P.saddle, flat); // the bridle
  }
}

// ---------- scarabs: a domed, shining beetle with a gold band ----------
function scarab(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk && f % 2 ? -1 : 0, by = G - 5 + bob, nip = atk >= 0 ? [1, 3, 0, 1][atk] : 1;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) F.part(line(cx + s * 3, by - 2 + i * 2, cx + s * (9 + i) + (i % 2 ? step : -step), G, 1), P.leg, flat);
  if (dir === 'right') {
    F.part(ellipse(cx - 1, by - 3, 9, 5), P.shell);
    F.part(line(cx - 8, by - 6, cx + 3, by - 7, 1), light(P.shell), flat);
    F.part(line(cx - 1, by - 8, cx - 1, by + 1, 1), P.gold, flat);
    F.part(ellipse(cx + 8, by - 2, 3, 2.5), P.shell);
    F.part(line(cx + 10, by - 2, cx + 13, by - 2 - nip, 1), P.gold, flat);
    return;
  }
  F.part(ellipse(cx, by - 3, 8, 6), P.shell);
  F.part(line(cx, by - 9, cx, by + 2, 1), P.gold, flat);
  F.part(line(cx - 5, by - 6, cx - 2, by - 8, 1), light(P.shell), flat);
  if (dir === 'down') { F.part(ellipse(cx, by + 3, 3, 2), P.shell); for (const s of [-1, 1]) F.part(line(cx + s, by + 4, cx + s * (2 + nip), by + 6, 1), P.gold, flat); }
}

// ---------- mummies: wrapped from head to foot, arms out; the Pharaoh in his headdress and gold mask ----------
function mummy(F, P, dir, { G, W, step, walk, f, atk }) {
  const K = !!P.king, k = K ? 1.6 : 1, cx = W / 2, bob = walk && f % 2 ? -1 : 0;
  const reach = atk >= 0 ? [2, 6, 8, 3][atk] : 0;
  const hip = G - 16 * k + bob, sh = G - 32 * k + bob, side = dir === 'right';
  const bands = (x0, y0, x1, y1) => { for (let y = y0 + 2; y < y1; y += 3) F.part(line(x0, y, x1, y + 1, 1), P.shade, flat); };
  // legs
  if (side) {
    F.part(rect(cx - 3 + step * 2, hip, cx + 1 + step * 2, G), P.wrap); F.part(rect(cx - 2 - step * 2, hip, cx + 2 - step * 2, G), dark(P.wrap));
  } else for (const s of [-1, 1]) { F.part(rect(cx + s * 3 * k - 2 * k + s * step, hip, cx + s * 3 * k + 2 * k + s * step, G), P.wrap); bands(cx + s * 3 * k - 2 * k, hip, cx + s * 3 * k + 2 * k, G); }
  // the body; the Pharaoh's broad collar and a kilt of gold and lapis
  F.part(poly([[cx - 6 * k, sh], [cx + 6 * k, sh], [cx + 5 * k, hip + 2], [cx - 5 * k, hip + 2]]), P.wrap);
  bands(cx - 5 * k, sh, cx + 5 * k, hip);
  if (K) {
    F.part(poly([[cx - 6 * k, hip - 3], [cx + 6 * k, hip - 3], [cx + 7 * k, hip + 6], [cx - 7 * k, hip + 6]]), P.gold);
    for (let i = -2; i <= 2; i++) F.part(line(cx + i * 3, hip - 2, cx + i * 3.6, hip + 5, 1), P.lapis, flat);
    if (dir !== 'up') { F.part(ellipse(cx, sh + 2, 8 * k * 0.9, 4), P.gold); F.part(ellipse(cx, sh + 2, 6 * k * 0.9, 2.5), P.lapis); F.part(ellipse(cx, sh + 1, 4 * k * 0.9, 1.4), P.gold, flat); }
  }
  // arms reaching out for you (the Pharaoh holds his crook and flail crossed, then swings them)
  const arm = (s, col) => {
    const ex = cx + s * (side ? 2 : 8 * k) + (side ? 10 * k + reach : 0), ey = sh + (side ? 6 : 12) * k - (K ? 0 : 4) - reach * 0.5;
    F.part(line(cx + s * (side ? 0 : 5 * k), sh + 3, ex, ey, 3 * (K ? 1.3 : 1)), col);
    return [ex, ey];
  };
  const [ax, ay] = arm(side ? 1 : -1, P.wrap), [bx, by] = side ? [ax, ay] : arm(1, P.wrap);
  if (K) { // the crook (gold and blue, a hook) and the flail (a rod and three strands)
    F.part(both(line(ax, ay, ax - 1, ay - 12, 1), line(ax - 1, ay - 12, ax + 2, ay - 14, 1)), P.gold, flat);
    F.part(line(bx, by, bx + 2, by - 10, 1), P.gold, flat);
    for (let i = -1; i <= 1; i++) F.part(line(bx + 2, by - 10, bx + 4 + i * 2, by - 6 + reach * 0.3, 1), P.lapis, flat);
  }
  // the head: wrapped, two glowing eyes; the Pharaoh's striped headdress and gold mask
  const hy = sh - 6 * k;
  if (K) {
    F.part(poly([[cx - 9 * k * 0.9, hy + 8], [cx - 7 * k * 0.9, hy - 6], [cx, hy - 10], [cx + 7 * k * 0.9, hy - 6], [cx + 9 * k * 0.9, hy + 8]]), P.gold);
    for (let i = 0; i < 6; i++) F.part(rows(poly([[cx - 9 * k * 0.9, hy + 8], [cx - 7 * k * 0.9, hy - 6], [cx, hy - 10], [cx + 7 * k * 0.9, hy - 6], [cx + 9 * k * 0.9, hy + 8]]), hy - 8 + i * 3, hy - 7 + i * 3), P.lapis, flat);
    if (dir !== 'up') {
      F.part(ellipse(cx + (side ? 3 : 0), hy, 5, 6), P.mask);
      F.dot(cx - 2 + (side ? 4 : 0), hy - 1, P.eye); if (!side) F.dot(cx + 2, hy - 1, P.eye);
      F.part(line(cx - 3 + (side ? 3 : 0), hy - 2, cx - 1 + (side ? 3 : 0), hy - 2, 1), P.lapis, flat);
      F.part(rect(cx - 1 + (side ? 3 : 0), hy + 5, cx + 1 + (side ? 3 : 0), hy + 9), P.gold); // the beard
    }
    F.part(line(cx, hy - 10, cx, hy - 14, 1), P.gold, flat); F.dot(cx, hy - 15, '#c83a2a'); // the cobra
    return;
  }
  F.part(ellipse(cx + (side ? 1 : 0), hy, 5, 5.5), P.wrap);
  bands(cx - 4, hy - 4, cx + 4, hy + 4);
  if (dir !== 'up') { F.dot(cx - 2 + (side ? 3 : 0), hy - 1, P.eye); if (!side) F.dot(cx + 2, hy - 1, P.eye); }
  F.part(line(cx - 4, hy + 5, cx - 7 - step, hy + 12, 1), P.shade, flat); // a loose strip trailing
}

// ---------- a canopic jar (the Pharaoh's Sarcophagus, Hell): a banded clay jar, a jackal-headed lid ----------
function jar(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, rock = (walk ? [0, 1, 0, -1][f] : 0) + (atk >= 0 ? [1, -1, 1, 0][atk] : 0);
  F.part(poly([[cx - 4 + rock, G - 22], [cx + 4 + rock, G - 22], [cx + 7, G - 14], [cx + 5, G], [cx - 5, G], [cx - 7, G - 14]]), P.clay);
  for (const y of [G - 17, G - 8]) F.part(line(cx - 6, y, cx + 6, y, 2), P.band, flat);
  F.part(line(cx - 6, G - 12, cx + 6, G - 12, 1), P.gold, flat);
  F.part(ellipse(cx + rock, G - 25, 4.5, 3.5), P.lid);
  if (dir !== 'up') { F.part(poly([[cx - 3 + rock, G - 28], [cx - 2 + rock, G - 33], [cx + rock, G - 28]]), P.lid); F.part(poly([[cx + rock, G - 28], [cx + 2 + rock, G - 33], [cx + 3 + rock, G - 28]]), P.lid); F.dot(cx - 1.5 + rock, G - 25, P.eye); F.dot(cx + 1.5 + rock, G - 25, P.eye); }
}

// ---------- the Sand Wyrm's mound: sand heaped over it as it swims, spines breaking through ----------
export function moundSet() {
  const [W, H] = MOUND.size, frames = [];
  for (let f = 0; f < 4; f++) {
    const F = new Frame(W, H), G = H - 3, cx = W / 2;
    F.part(ellipse(cx, G - 6, 38, 8 + (f % 2)), '#d8b070');
    F.part(ellipse(cx - 6, G - 9, 24, 5), '#e6c486', flat);
    for (let i = 0; i < 6; i++) { // spines, rising and sinking
      const x = cx - 25 + i * 10, h = 5 + ((i + f) % 3) * 3;
      F.part(poly([[x - 2, G - 10], [x + 2, G - 10], [x + 0.5, G - 10 - h]]), '#e2d2b0');
    }
    for (let i = 0; i < 12; i++) F.dot(cx - 36 + ((i * 13 + f * 7) % 72), G - 1 - ((i * 5 + f * 3) % 8), i % 2 ? '#c8a060' : '#f0d8a0'); // sand trickling
    frames.push(F.toCanvas());
  }
  return frames;
}
