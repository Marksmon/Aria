// The beasts of Veidheim's lands, painted pixel by pixel in code like the kobolds (painted.js):
// wolves and bears (four legs), snakes (coils and a raised head), willows (weeping willow spirits)
// and treants (ancient oak giants); the last two after the owner's creature concept sheets. Each part is filled, shaded
// and outlined on its own (Frame.part). Frames: 4 directions (down, up, right; left is right
// mirrored) x idle (1), walk (4) and attack (4). Plain canvas: sprites.js makes the sprite sets.
import { Frame, ellipse, rect, poly, line, both, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
// size: the frame; body: the standing figure in pixels (for sizing in the world: def.w is its width)
export const BEASTS = {
  wolf: { kind: 'quad', size: [56, 44], body: [20, 26], fur: '#8a8e96', back: '#5e626c', belly: '#d8d8d4', muzzle: '#c8c8c4', eye: '#ffd23a', mouth: '#8a2a2a', tail: 'bush' },
  bear: { kind: 'quad', size: [64, 56], body: [28, 34], fur: '#7a5232', back: '#5a3a22', belly: '#a87a4e', muzzle: '#c89a6a', eye: '#1e1410', mouth: '#8a2a2a', claw: '#efe6cc', tail: 'stub', bear: true },
  snake: { kind: 'snake', size: [52, 40], body: [22, 22], skin: '#5f9440', belly: '#e0d07a', spot: '#2f5a2a', eye: '#ffd23a', tongue: '#d8303a' },
  willow: { kind: 'willow', size: [56, 80], body: [22, 68], bark: '#9aae94', horn: '#8a8070', leaf: '#6aa848', leafLt: '#a8d870', leafDk: '#3f7a3a', eye: '#e8f8ff' },
  treant: { kind: 'treant', size: [84, 96], body: [46, 86], bark: '#5e4430', moss: '#6a8a3a', leaf: '#3f7a35', leaf2: '#6aa848', eye: '#ffcf4a', mouth: '#24180e', cap: '#e8c890' },
  // the bosses, the same painters with more to them (boss: true): the Elder Willow, silvery and old,
  // wide antlers with fireflies on their tips and water-lilies in its teal hair; the Ancient Treant,
  // pale with age, glowing runes carved down its chest, a long beard, blossoms in its crown
  elderWillow: { kind: 'willow', boss: true, size: [56, 80], body: [22, 68], bark: '#c4c8bc', horn: '#a89878', leaf: '#3f8a72', leafLt: '#9ae0c0', leafDk: '#245a4a', eye: '#ffd23a', fly: '#fff6a0', lily: '#f4f0f8', lilyHeart: '#f2a8c8' },
  // the Alpha Wolf, black-furred with a silver ruff, red eyes and a scar across its face; the Great
  // Bear, a grizzly with a silver-tipped hump, amber eyes, scars and long pale claws
  alphaWolf: { kind: 'quad', boss: true, size: [56, 44], body: [20, 26], fur: '#4a4e5a', back: '#2e3038', belly: '#9aa0b0', muzzle: '#7a8090', eye: '#ff4a3a', mouth: '#8a2a2a', tail: 'bush', mane: '#c8ccd8', scar: '#e8b8b0' },
  greatBear: { kind: 'quad', boss: true, size: [64, 56], body: [28, 34], fur: '#5a3a24', back: '#3e2818', belly: '#8a6040', muzzle: '#a87a50', eye: '#ffb03a', mouth: '#8a2a2a', claw: '#fff6e0', tail: 'stub', bear: true, mane: '#c8b8a0', scar: '#d8a890' },
  ancientTreant: { kind: 'treant', boss: true, size: [84, 96], body: [46, 86], bark: '#8a7a66', moss: '#7aa04a', leaf: '#3f8040', leaf2: '#78b85a', eye: '#b8ff7a', mouth: '#24180e', cap: '#f0d8a0', rune: '#8affc0', blossom: '#f6b8d4' },
};
export const beastSize = (id) => BEASTS[id].size;

const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function beastSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => beastFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}

export function beastFrame(id, dir, anim, f) {
  if (dir === 'left') return beastFrame(id, 'right', anim, f).mirror();
  const P = BEASTS[id], [W, H] = P.size;
  const F = new Frame(W, H);
  const a = { G: H - 3, W, H, step: anim === 'walk' ? [1, 0, -1, 0][f] : 0, walk: anim === 'walk', f, atk: anim === 'attack' ? f : -1 };
  ({ quad, snake, willow, treant })[P.kind](F, P, dir, a);
  return F;
}

// ---------- wolves and bears ----------
function quad(F, P, dir, { G, W, step, walk, f, atk }) {
  const B = P.bear;
  const k = B ? 1.3 : 1;                         // a bear is bigger all over
  const bob = walk && (f === 1 || f === 3) ? -1 : 0;
  const side = dir === 'right', back = dir === 'up';
  if (side) {
    // the attack: a wolf crouches and lunges to bite; a bear rears and swipes a paw
    const lunge = B ? 0 : [-2, 4, 3, 0][atk] ?? 0;
    const rear = B ? [2, 5, 3, 1][atk] ?? 0 : 0;   // how high the bear's chest comes up
    const bx = W / 2 - 3 + lunge, by = G - Math.round(12 * k) + bob - (atk === 0 && !B ? -1 : 0);
    const rx = 13 * k, ry = 6.5 * k, legY = by + 2;
    const swing = 2 * step;
    const leg = (x, dx, col, up = 0) => F.part(both(line(x, legY, x + dx, G - 1 - up, B ? 4 : 3), rect(x + dx - 1, G - 1 - up, x + dx + (B ? 3 : 2), G - up)), col);
    // the far legs, darker
    leg(bx - rx + 4, -swing, dark(P.fur));
    if (!rear) leg(bx + rx - 4, swing, dark(P.fur));
    // the tail
    const wag = walk ? [0, 1, 0, -1][f] : 0;
    if (P.tail === 'bush') F.part(poly([[bx - rx + 2, by - 3], [bx - rx - 6, by - 7 + wag], [bx - rx - 10, by - 4 + wag], [bx - rx - 7, by + 1 + wag], [bx - rx + 1, by + 2]]), P.fur);
    else F.part(ellipse(bx - rx, by - 2, 2.5, 2), P.fur);
    // the neck (under the body and head, so no seam shows), then the body, tilted up when a bear rears
    const hx = bx + rx + (B ? 3 : 4), hy = by - (B ? 5 : 7) * k - rear + (atk === 0 && !B ? 2 : 0) + (atk === 1 && !B ? 2 : 0);
    F.part(poly([[bx + rx * 0.4, by - ry + 1 - rear], [hx - 2, hy - 4], [hx + 2, hy + 3], [bx + rx * 0.9, by + 2 - rear]]), P.fur);
    F.part(poly([[bx - rx, by - ry * 0.6], [bx - rx * 0.4, by - ry], [bx + rx * 0.5, by - ry - rear], [bx + rx, by - ry * 0.4 - rear], [bx + rx * 0.9, by + ry * 0.7 - rear * 0.6], [bx, by + ry], [bx - rx * 0.9, by + ry * 0.7]]), P.fur);
    F.part(ellipse(bx - 1, by + ry * 0.55, rx * 0.65, ry * 0.35), P.belly, flat);
    F.part(line(bx - rx + 2, by - ry * 0.75, bx + rx * 0.5, by - ry - rear + 1, 2), P.back, flat); // the darker back
    if (P.tail === 'bush') F.dot(bx - rx - 9, by - 4 + wag, light(P.fur));
    if (P.boss && B) { // a silver-tipped hump over the shoulders
      const hx2 = bx + rx * 0.4, hy2 = by - ry - rear * 0.7;
      F.part(ellipse(hx2, hy2, 4.5 * k, 2.4 * k), light(P.fur));
      for (let i = -3; i <= 3; i++) { F.dot(hx2 + i * 1.6, hy2 - 2 * k + Math.abs(i) * 0.5, P.mane); if (i % 2) F.dot(hx2 + i * 1.6, hy2 - 1, P.mane); }
    } else if (P.boss) { // a jagged silver ruff from the shoulders up the neck, one mass
      const ax = bx + rx * 0.25, ay = by - ry + 2, ex = hx - 1, ey = hy - 3, pts = [];
      for (let t = 0; t <= 8; t++) { const u = t / 8; pts.push([ax + (ex - ax) * u, ay + (ey - ay) * u - (t % 2 ? 5 : 1)]); }
      for (let t = 8; t >= 0; t--) { const u = t / 8; pts.push([ax + (ex - ax) * u + 1, ay + (ey - ay) * u + 4]); }
      F.part(poly(pts), P.mane);
    }
    // the near legs
    leg(bx - rx + 6, swing, P.fur);
    if (rear) { // the near front paw raised to swipe, claws out
      const pa = [-0.9, -1.6, 0.2, -0.4][atk];
      const sx = bx + rx - 4, sy = by - rear, ex = sx + Math.cos(pa) * 9 * k, ey = sy + Math.sin(pa) * 9 * k;
      F.part(line(sx, sy, ex, ey, 4), P.fur);
      for (let i = -1; i <= 1; i++) F.dot(ex + 2 + Math.abs(i) * -0.5, ey + i * 1.5, P.claw);
      leg(bx + rx - 6, 0, dark(P.fur), 0); // the far front leg holds the ground
    } else leg(bx + rx - 5, -swing, P.fur);
    // the head
    if (!B) F.part(poly([[hx - 3, hy - 3], [hx - 1, hy - 11], [hx + 2, hy - 3]]), P.fur);   // the tall ear
    else F.part(ellipse(hx - 2, hy - 5, 2.5, 2.5), P.fur);                                 // the round ear
    F.part(ellipse(hx, hy, 5 * k, 4.5 * k), P.fur);
    const open = atk === 1 || atk === 2 || (B && atk === 1);
    const sl = B ? 7 : 9;                          // snout length
    F.part(poly([[hx + 2, hy - 2], [hx + sl, hy - 1 - (open ? 2 : 0)], [hx + sl, hy + 1 - (open ? 2 : 0)], [hx + 2, hy + 2]]), P.muzzle);
    if (open) { // the jaw drops: red mouth, white fangs
      F.part(poly([[hx + 2, hy + 2], [hx + sl - 1, hy + 4], [hx + sl - 2, hy + 6], [hx + 2, hy + 4]]), P.muzzle);
      F.part(line(hx + 3, hy + 2, hx + sl - 2, hy + 3, 1), P.mouth, flat);
      F.dot(hx + sl - 2, hy + 1, '#f4ecd8'); F.dot(hx + sl - 3, hy + 4, '#f4ecd8');
    }
    F.dot(hx + sl, hy - 1 - (open ? 2 : 0), '#1e1410'); F.dot(hx + sl, hy - (open ? 2 : 0), '#1e1410'); // the nose
    F.dot(hx + 1, hy - 2, P.eye); F.dot(hx + 2, hy - 2, P.boss ? light(P.eye) : '#1e1410');
    if (!B) F.dot(hx + 2, hy - 3, '#1e1410'); // a wolf's brow
    if (P.boss) { F.part(line(hx - 1, hy - 5, hx + 3, hy + 1, 1), P.scar, flat); F.part(line(hx + 4, hy - 3, hx + 6, hy, 1), P.scar, flat); } // old scars
    return;
  }

  // ---- front (down) and back (up) ----
  const cx = W / 2, by = G - Math.round(10 * k) + bob;
  const lu = step > 0 ? 2 : 0, ru = step < 0 ? 2 : 0;
  const raise = B ? [6, 10, 2, 0][atk] ?? 0 : 0;    // the bear's paws come up
  const dip = !B ? [-1, 3, 2, 0][atk] ?? 0 : 0;     // the wolf's head darts down
  const leg = (x, y0, up, col, w = B ? 4 : 3) => F.part(both(rect(x - (w >> 1), y0, x - (w >> 1) + w - 1, G - 1 - up), rect(x - (w >> 1) - 1, G - 1 - up, x - (w >> 1) + w, G - up)), col);
  if (back) {
    // the head beyond the back, the body, the hind legs, the tail on top
    const hy = by - 9 * k + dip;
    if (!B) for (const s of [-1, 1]) F.part(poly([[cx + s * 2, hy - 3], [cx + s * 5, hy - 11], [cx + s * 7, hy - 2]]), P.fur);
    else for (const s of [-1, 1]) F.part(ellipse(cx + s * 6, hy - 5, 2.8, 2.8), P.fur);
    F.part(ellipse(cx, hy, 6.5 * k, 5.5 * k), P.fur);
    F.part(line(cx, hy - 4, cx, hy + 3, 2), P.back, flat);
    leg(cx - 7 * k, by - 2, ru, dark(P.fur));
    leg(cx + 7 * k, by - 2, lu, dark(P.fur));
    F.part(ellipse(cx, by, 9 * k, 7 * k), P.fur);
    F.part(line(cx, by - 6 * k, cx, by + 2, 2), P.back, flat);
    if (P.boss) { // the ruff or the hump, seen from behind
      F.part(ellipse(cx, by - 6 * k, 7 * k, 3 * k), B ? light(P.fur) : P.mane);
      for (let i = -2; i <= 2; i++) F.dot(cx + i * 2.5, by - 8 * k + Math.abs(i) * 0.6, B ? P.mane : light(P.mane));
    }
    leg(cx - 5 * k, by + 3, lu, P.fur);
    leg(cx + 5 * k, by + 3, ru, P.fur);
    if (raise) for (const s of [-1, 1]) F.part(line(cx + s * 8 * k, by - 4, cx + s * 11 * k, by - 4 - raise, 4), P.fur); // paws up beside the head
    const wag = walk ? step * 2 : 0;
    if (P.tail === 'bush') F.part(poly([[cx - 2, by - 3], [cx + 2, by - 3], [cx + 3 + wag, by - 12], [cx + wag, by - 15], [cx - 3 + wag, by - 12]]), P.fur);
    else F.part(ellipse(cx, by - 5, 2.5, 1.5), light(P.fur), flat);
    return;
  }
  // front: the hind legs half hidden behind, the chest, the front legs, the head
  leg(cx - 6.5 * k, by + 1, ru, dark(P.fur));
  leg(cx + 6.5 * k, by + 1, lu, dark(P.fur));
  F.part(ellipse(cx, by + 1, 8 * k, 7 * k), P.fur);
  F.part(ellipse(cx, by + 3, 4.5 * k, 4.5 * k), P.belly, flat);
  if (raise) { // a bear rears: both paws up, claws out
    for (const s of [-1, 1]) {
      const ex = cx + s * 12 * k, ey = by - 2 - raise;
      F.part(line(cx + s * 6 * k, by - 2, ex, ey, 4), P.fur);
      for (let i = -1; i <= 1; i++) F.dot(ex + i * 1.5, ey - 3, P.claw);
    }
    leg(cx - 4 * k, by + 4, 0, P.fur); leg(cx + 4 * k, by + 4, 0, P.fur);
  } else { leg(cx - 4 * k, by + 4, lu, P.fur); leg(cx + 4 * k, by + 4, ru, P.fur); }
  const hy = by - 8 * k + dip - raise * 0.4;
  if (P.boss && B) { // the hump behind the head, its fur tipped with silver
    F.part(ellipse(cx, by - 6 * k, 10 * k, 4 * k), light(P.fur));
    for (let i = -4; i <= 4; i++) F.dot(cx + i * 2.4, by - 9 * k + Math.abs(i) * 0.5, P.mane);
  }
  else if (P.boss) { // a spiky silver ruff round the throat
    const pts = [];
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = i % 2 ? 0.72 : 1; pts.push([cx + Math.cos(a) * 9.5 * r, hy + 5 + Math.sin(a) * 6.5 * r]); }
    F.part(poly(pts), P.mane);
  }
  if (!B) for (const s of [-1, 1]) F.part(poly([[cx + s * 2, hy - 3], [cx + s * 5, hy - 12], [cx + s * 7, hy - 2]]), P.fur);
  else for (const s of [-1, 1]) { F.part(ellipse(cx + s * 7, hy - 6, 3, 3), P.fur); F.dot(cx + s * 7, hy - 6, dark(P.fur)); }
  F.part(ellipse(cx, hy, 7 * k, 6 * k), P.fur);
  if (!B) for (const s of [-1, 1]) F.part(poly([[cx + s * 3, hy - 4], [cx + s * 4.5, hy - 9], [cx + s * 5.5, hy - 3]]), light(P.fur), flat); // the inner ear
  const open = atk === 1 || atk === 2;
  F.part(ellipse(cx, hy + 3 * k, 4 * k, 3 * k), P.muzzle);
  if (open) {
    F.part(ellipse(cx, hy + 6 * k, 3 * k, 2), P.mouth);
    F.dot(cx - 2, hy + 5 * k, '#f4ecd8'); F.dot(cx + 2, hy + 5 * k, '#f4ecd8');
  }
  F.part(rect(cx - 1, hy + 1 * k, cx + 1, hy + 2 * k), '#1e1410', flat); // the nose
  const ey = Math.round(hy - 2);
  for (const s of [-1, 1]) {
    const ex = Math.round(cx + s * 3.5 * k);
    F.dot(ex, ey, P.eye); F.dot(ex + (s < 0 ? 1 : -1), ey, P.eye); F.dot(ex, ey, P.boss ? light(P.eye) : '#1e1410');
    if (!B) F.dot(ex + (s < 0 ? -1 : 1), ey - 1, '#1e1410');
  }
  if (P.boss) { // a scar across the left eye
    const sx = Math.round(cx - 3.5 * k);
    F.part(line(sx - 2, ey - 3, sx + 2, ey + 3, 1), P.scar, flat);
  }
}

// ---------- snakes ----------
function snake(F, P, dir, { G, W, walk, f, atk }) {
  const side = dir === 'right', back = dir === 'up';
  const ph = walk ? f * (Math.PI / 2) : 0;
  const seg = (x, y, r, col = P.skin) => F.part(ellipse(x, y, r, r * 0.85), col);
  if (side) {
    // a body lying in a wave, thick near the neck, then the neck rising to the head
    const pull = [-4, 5, 4, 0][atk] ?? 0;       // the strike: back, then out
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, x = 6 + t * 26 + (walk ? Math.sin(ph) * 0.8 : 0);
      pts.push([x, G - 2.6 - Math.sin(t * 7 + ph) * 1.3 * (1 - t * 0.5), 1.2 + t * 2.4]);
    }
    const hx = 40 + pull, hy = G - 15 + (atk === 1 ? 4 : atk === 2 ? 3 : 0);
    for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push([32 + (hx - 4 - 32) * t, G - 3 - (G - 3 - hy - 1) * Math.sin(t * Math.PI / 2), 3.5 - t * 0.6]); }
    for (const [x, y, r] of pts) seg(x, y, r);
    for (const [x, y, r] of pts) F.dot(x, y + r * 0.7, P.belly);
    for (let i = 2; i < pts.length - 2; i += 3) { const [x, y, r] = pts[i]; F.dot(x, y - r * 0.4, P.spot); F.dot(x + 1, y - r * 0.4, P.spot); }
    const open = atk === 1 || atk === 2;
    F.part(poly([[hx - 4, hy - 2], [hx + 1, hy - 3], [hx + 6, hy - 1 - (open ? 1 : 0)], [hx + 6, hy + 1 - (open ? 1 : 0)], [hx - 3, hy + 3]]), P.skin);
    if (open) {
      F.part(poly([[hx - 2, hy + 2], [hx + 5, hy + 3], [hx - 2, hy + 4]]), P.skin);
      F.dot(hx + 4, hy + 1, '#f4ecd8'); F.dot(hx + 1, hy + 2, P.tongue); F.dot(hx + 2, hy + 2, P.tongue);
    } else if (!walk || f % 2 === 0) { F.dot(hx + 7, hy + 1, P.tongue); F.dot(hx + 8, hy + 1, P.tongue); F.dot(hx + 9, hy, P.tongue); F.dot(hx + 9, hy + 2, P.tongue); }
    F.dot(hx + 1, hy - 1, P.eye); F.dot(hx + 2, hy - 1, '#1e1410');
    return;
  }
  // front and back: three coils, the neck rising out of the top one, the head
  const cx = W / 2, sh = walk ? [1, 0, -1, 0][f] : 0;
  F.part(ellipse(cx + sh, G - 3, 12, 3.6), P.skin);
  F.part(ellipse(cx - sh, G - 7, 10, 3.2), P.skin);
  F.part(ellipse(cx + sh, G - 10.5, 7.5, 2.8), P.skin);
  for (const [y, w] of [[G - 2, 10], [G - 6, 8], [G - 9.5, 6]]) for (let x = -w; x <= w; x += 4) F.dot(cx + x, y - (back ? 1 : 0), back ? P.spot : P.belly);
  const lean = [-3, 4, 3, 0][atk] ?? 0;          // the strike comes at you: the head drops and grows
  const hx = cx, hy = G - 22 + lean;
  for (let i = 0; i <= 5; i++) { const t = i / 5; seg(cx + Math.sin(t * 3 + ph) * 1.2, G - 12 - (G - 12 - hy - 3) * t, 3.2 - t * 0.4, P.skin); }
  if (!back) F.part(rect(cx - 1, G - 18 + lean * 0.5, cx + 1, G - 12), P.belly, flat);
  const big = atk === 1 || atk === 2 ? 1 : 0;
  F.part(ellipse(hx, hy, 5 + big, 4 + big), P.skin);
  if (back) { F.dot(hx, hy - 1, P.spot); F.dot(hx - 2, hy + 1, P.spot); F.dot(hx + 2, hy + 1, P.spot); return; }
  for (const s of [-1, 1]) { F.dot(hx + s * 3, hy - 1, P.eye); F.dot(hx + s * 3, hy, '#1e1410'); }
  F.dot(hx - 1, hy + 2, '#1e1410'); F.dot(hx + 1, hy + 2, '#1e1410');
  if (big) { F.part(ellipse(hx, hy + 4, 2.5, 1.6), '#8a2a2a'); F.dot(hx - 2, hy + 4, '#f4ecd8'); F.dot(hx + 2, hy + 4, '#f4ecd8'); }
  else if (!walk || f % 2 === 0) { F.dot(hx, hy + 5, P.tongue); F.dot(hx, hy + 6, P.tongue); F.dot(hx - 1, hy + 7, P.tongue); F.dot(hx + 1, hy + 7, P.tongue); }
}

// ---------- willows: weeping willow spirits ----------
// A slender figure of pale green wood, after the owner's "Weeping Willow Spirit" sheet: long weeping
// strands for hair falling past the waist, two branch antlers, pale glowing eyes, long thin arms
// ending in twig claws with strands trailing from them, and legs like young roots.
function willow(F, P, dir, { G, W, step, walk, f, atk }) {
  const side = dir === 'right', back = dir === 'up';
  const cx = W / 2 + (side ? -1 : 0), bob = walk && (f === 1 || f === 3) ? -1 : 0;
  const hy = G - 53 + bob, sy = G - 46 + bob, wy = G - 35 + bob, hip = G - 29 + bob; // head, shoulders, waist, hips
  const sway = walk ? [1, 0, -1, 0][f] : 0;
  const lash = [-2, 5, 4, 1][atk] ?? 0;           // the arms reach and the strands whip forward
  const skin = P.bark, grain = dark(P.bark), flatOut = { flat: true };
  // strands of hair: each [x0, y0, y1, dx] falls from (x0, y0) to y1, curving out by dx. A layer is one
  // outlined mass of dark green with lighter strands laid over it, so it reads as hair, not bars
  const curve = (x0, y0, y1, dx, i) => {
    const pts = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([x0 + dx * t * t + Math.sin(t * 3 + i) * 0.8, y0 + (y1 - y0) * t]); }
    return pts;
  };
  const hair = (list) => {
    const cs = list.map(([x0, y0, y1, dx], i) => curve(x0, y0, y1, dx, i));
    const byX = [...cs].sort((a, b) => a[0][0] - b[0][0]);
    const webs = []; // fill between neighbouring strands down to the shorter one's middle, so the hair is one mass
    for (let i = 1; i < byX.length; i++) for (let k = 0; k < 3; k++) { const a = byX[i - 1], b = byX[i]; if (b[0][0] - a[0][0] < 4) webs.push(poly([a[k], a[k + 1], b[k + 1], b[k]])); } // (never across the face)
    F.part(both(...webs, ...cs.flatMap((c) => c.slice(1).map((q, k) => line(c[k][0], c[k][1], q[0], q[1], 2)))), P.leafDk, { flat: true });
    cs.forEach((c, i) => { for (let k = 1; k < c.length; k++) F.part(line(c[k - 1][0] + (i % 2 ? 0.5 : 0), c[k - 1][1], c[k][0], c[k][1], 1), i % 3 ? P.leaf : P.leafLt, flat); });
  };
  
  // the hair behind: a long veil spreading down to the knees
  const veil = side ? [[-9, 0], [-7, 2], [-5, 4], [-3, 5], [-11, 1], [-1, 3]] : [[-12, 0], [-9, 1], [-6, 3], [6, 3], [9, 1], [12, 0], [-3, 4], [3, 4]];
  hair(veil.map(([x, k], i) => [cx + x * 0.5, hy - 4, G - 12 - k * 2 + (i % 3) * 3, x * 0.6 + sway * 2 + (side ? -lash * 0.5 - 3 : 0)]));
  // the antlers: two forked branches out of the crown
  const antler = (s, near) => {
    const col = near ? P.horn : dark(P.horn), bx = cx + s * 2, by = hy - 4, k = P.boss ? 1.35 : 1; // the Elder Willow's spread wider
    const tips = [[bx + s * 9 * k, by - 11 * k], [bx + s * 5 * k, by - 13 * k], [bx + s * 1, by - 10 * k]];
    F.part(line(bx, by, bx + s * 6 * k, by - 9 * k, 1), col, flatOut);
    F.part(line(bx + s * 3, by - 4, ...tips[2], 1), col, flatOut);
    F.part(line(bx + s * 6 * k, by - 9 * k, ...tips[0], 1), col, flatOut);
    F.part(line(bx + s * 6 * k, by - 9 * k, ...tips[1], 1), col, flatOut);
    if (P.boss) {
      F.part(line(bx + s * 4 * k, by - 6 * k, bx + s * 8 * k, by - 5 * k, 1), col, flatOut); // a third tine
      for (const [tx, ty] of tips) { F.dot(tx, ty - 1, P.fly); F.dot(tx - 1, ty - 1, light(P.fly)); F.dot(tx + 1, ty - 1, light(P.fly)); F.dot(tx, ty - 2, light(P.fly)); } // fireflies
    }
  };
  if (side) antler(-1, false); else { antler(-1, true); antler(1, true); }
  // legs: slender, a little bent, feet like roots
  const legs = side ? [[-1, -step * 2, true], [1, step * 2, false]] : [[-3, 0, false], [3, 0, false]];
  for (const [x, dx, far] of legs) {
    const up = !side && walk ? (x < 0 ? (step > 0 ? 2 : 0) : (step < 0 ? 2 : 0)) : 0;
    const col = far ? dark(skin) : skin, kx = cx + x + dx * 0.5 + (side ? 1 : x * 0.2);
    F.part(both(line(cx + x, hip, kx, G - 14, 2), line(kx, G - 14, cx + x + dx, G - 1 - up, 2)), col);
    F.part(both(line(cx + x + dx, G - up, cx + x + dx + (side ? 3 : x), G - up, 1), line(cx + x + dx, G - up, cx + x + dx - 2, G + 1 - up, 1)), dark(col));
  }
  // the far arm (side view)
  const arm = (s, near) => {
    // shoulder, elbow, hand; at rest the arms hang out from the body, claws low; attacking they reach and rake
    const reach = side ? [[3, -2], [9, 6], [8, 4], [3, 2]][atk] : [[6, -10], [3, 10], [4, 7], [2, 2]][atk];
    const sx = cx + (side ? 0 : s * 5), ex = sx + (side ? 4 + (reach?.[0] ?? 0) * 0.5 : s * (5 + (reach ? 1 : 0))), ey = sy + 9 - (reach ? reach[1] * 0.3 : 0);
    const hx = side ? ex + 3 + (reach?.[0] ?? 0) : ex + s * (4 + (reach ? reach[0] * 0.4 : 0)), hyy = ey + 11 - (reach ? reach[1] : 0) + sway * (s > 0 ? 1 : -1) * 0.5;
    const col = near ? skin : dark(skin);
    F.part(both(line(sx, sy + 1, ex, ey, 1.5), line(ex, ey, hx, hyy, 1.5)), col);
    for (const a of [-0.5, 0, 0.5]) { // twig claws
      const d = side ? 1 : s, ang = Math.PI / 2 + a - (reach ? d * 0.6 : 0);
      F.part(line(hx, hyy, hx + Math.cos(ang) * 4 * d * (side ? 1 : 1), hyy + Math.sin(ang) * 4, 1), dark(col), flatOut);
    }
    hair([0, 1].map((i) => [ex + (side ? 1 : s) * i * 2, ey + 1, ey + 12 + i * 3, sway + (side ? lash * 0.6 : s * lash * 0.4)]));
  };
  if (side) arm(1, false);
  // the body: slim, wood-grained
  const bw = side ? 3 : 4.5;
  F.part(poly([[cx - bw, sy], [cx + bw, sy], [cx + bw * 0.8, sy + 4], [cx + bw * 0.5, wy], [cx + bw * 0.9, hip - 2], [cx + bw * 0.6, hip + 1], [cx - bw * 0.6, hip + 1], [cx - bw * 0.9, hip - 2], [cx - bw * 0.5, wy], [cx - bw * 0.8, sy + 4]]), skin);
  for (const x of side ? [0] : [-2, 2]) F.part(line(cx + x, sy + 2, cx + x * 0.6, hip, 1), grain, { outline: false, flat: true });
  // neck and head
  F.part(rect(cx - 1, hy + 4, cx + 1, sy), skin);
  F.part(ellipse(cx + (side ? 1 : 0), hy, side ? 4 : 4.5, 5.5), skin);
  if (!back) {
    const eye = (x) => { F.dot(x, hy, P.eye); F.dot(x, hy - 1, light(P.eye)); };
    if (side) { eye(cx + 3); F.dot(cx + 5, hy + 1, dark(skin)); }
    else { eye(cx - 2); eye(cx + 2); F.dot(cx, hy + 3, grain); }
  }
  // the hair in front: it frames the face and falls over the shoulders (from behind, it covers all)
  const front = back ? [[-5, 0], [-3, 2], [-1, 3], [1, 3], [3, 2], [5, 0], [-4, 1], [4, 1]] : side ? [[-2, 1], [-4, 0]] : [[-5, 1], [-4, 3], [4, 3], [5, 1]];
  hair(front.map(([x, k], i) => [cx + x, hy - 5, (back ? G - 16 : wy + 2) - k * 2 + (i % 2) * 3, x * 0.5 + sway + (side ? -2 : 0)]));
  F.part(ellipse(cx + (side ? 0 : 0), hy - 4, side ? 4 : 5, 2.2), P.leaf); // the crown of the head
  F.part(ellipse(cx - 1, hy - 5, 2, 1), P.leafLt, flatOut);
  if (P.boss) { // water-lilies tucked into the hair, one at the crown and down each side
    const lily = (x, y) => { F.part(both(rect(x - 1, y, x + 1, y), rect(x, y - 1, x, y + 1)), P.lily); F.dot(x, y, P.lilyHeart); };
    for (const [x, y] of back ? [[-3, -3], [3, -3], [0, 6], [-4, 14], [4, 14]] : side ? [[-3, -3], [-4, 4], [-6, 12]] : [[-4, -4], [4, -4], [-6, 4], [6, 4], [-6, 13], [6, 13]]) lily(cx + x, hy + y);
  }
  if (side) { antler(1, true); arm(1, true); }
  else { arm(-1, true); arm(1, true); }
}

// ---------- treants: ancient oak treants ----------
// After the owner's "Ancient Oak Treant" sheet: a hulking giant of dark oak, broad in the shoulder,
// arms hanging to the knees with root claws, legs like trunks on spreading roots, a stern bark face
// with a mossy beard, and an oak crown growing out of the head, acorns in it. Moss, little mushrooms
// and broken twigs on the shoulders and arms.
function treant(F, P, dir, { G, W, step, walk, f, atk }) {
  const side = dir === 'right', back = dir === 'up';
  const cx = W / 2 + (side ? -2 : 0), bob = walk && (f === 1 || f === 3) ? -1 : 0;
  const sink = atk === 1 || atk === 2 ? 2 : 0;
  const hip = G - 25 + bob + sink, waist = G - 33 + bob + sink, sh = G - 52 + bob + sink, hy = G - 58 + bob + sink;
  const bark = P.bark, grain = dark(P.bark), ridge = light(P.bark), flatOut = { outline: false, flat: true };
  // a little cluster of mushrooms: pale stems, domed caps
  const mushroom = (x, y) => {
    for (const [dx, dy, r] of [[0, 0, 1.6], [2.5, 1, 1.1]]) {
      F.part(rect(x + dx, y + dy - 1, x + dx, y + dy + 1), '#efe4c8', flatOut);
      F.part(poly([[x + dx - r - 0.5, y + dy - 1], [x + dx, y + dy - 1 - r * 1.4], [x + dx + r + 0.5, y + dy - 1]]), P.cap);
    }
  };
  // legs: trunks from the hips to the ground, flaring into roots
  const legs = side ? [[-4, -step * 3, true], [4, step * 3, false]] : [[-9, 0, false], [9, 0, false]];
  for (const [x, dx, far] of legs) {
    const up = !side && walk ? (x < 0 ? (step > 0 ? 2 : 0) : (step < 0 ? 2 : 0)) : 0;
    const lx = cx + x + dx, col = far ? dark(bark) : bark;
    F.part(poly([[cx + x - 6, hip - 2], [cx + x + 6, hip - 2], [lx + 5, G - 6 - up], [lx + 8, G - up], [lx - 8, G - up], [lx - 5, G - 6 - up]]), col);
    F.part(line(cx + x - 1, hip + 1, lx - 1, G - 5 - up, 1), dark(col), flatOut);
    for (const [rx, ry] of [[-9, 1], [9, 1], [-3, 1]]) F.part(line(lx + rx * 0.5, G - 2 - up, lx + rx, G + ry - up, 1), dark(col), { flat: true }); // root toes
  }
  // the arms: shoulder, elbow, a big clawed hand. Attacking, both come up overhead and slam down
  const pose = atk >= 0 ? [[-0.5, -22], [0.3, 8], [0.3, 6], [0, 0]][atk] : [0, 0];
  const arm = (s, near) => {
    const d = side ? 1 : s, col = near ? bark : dark(bark);
    const sx = cx + (side ? 2 : s * 16), sy2 = sh + 3;
    const swingX = side ? step * 2 : 0;
    const ex = sx + d * (side ? 3 : 6) + swingX * 0.5, ey = sy2 + 13 + pose[1] * 0.5;
    const hx = sx + d * (side ? 6 + pose[0] * 10 : 9 + pose[0] * 6) + swingX, hy2 = G - 18 + pose[1];
    // a gnarled upper arm, then a forearm that swells towards the hand
    F.part(both(line(sx, sy2, ex, ey, 6), line(ex, ey, (ex + hx) / 2, (ey + hy2) / 2, 8), line((ex + hx) / 2, (ey + hy2) / 2, hx, hy2, 7)), col);
    F.part(line(sx + d, sy2 + 2, ex + d, ey, 1), dark(col), flatOut);
    F.part(line(ex - d, ey + 2, hx - d * 2, hy2 - 3, 1), dark(col), flatOut);
    F.part(line(ex + d * 2, ey + 3, hx + d, hy2 - 4, 1), light(col), flatOut);
    // claws: curved root fingers, pointing down (up when raised)
    const dn = hy2 < sy2 ? -1 : 1;
    for (const k of [-2, 0, 2]) F.part(both(line(hx + k * 1.2, hy2 + dn * 2, hx + k * 1.6, hy2 + dn * 7, 2), line(hx + k * 1.6, hy2 + dn * 7, hx + k * 1.6 + d, hy2 + dn * 9, 1)), dark(col));
    F.part(ellipse(hx, hy2, 4, 3.5), col);
    // a broken twig at the elbow, moss on the forearm
    F.part(both(line(ex, ey - 2, ex + d * 4, ey - 7, 1), line(ex + d * 3, ey - 6, ex + d * 5, ey - 6, 1)), dark(col), { flat: true });
    if (near) F.part(poly([[ex - 2, ey + 1], [ex + d * 3, ey + 2], [ex + d * 2, ey + 6], [ex, ey + 4]]), P.moss, flatOut);
  };
  if (side) arm(1, false);
  // the body: barrel chest, narrower waist, a bark hide with ridges and grain
  const bw = side ? 10 : 17;
  F.part(poly([[cx - bw, sh], [cx + bw, sh], [cx + bw - 2, sh + 8], [cx + bw * 0.62, waist], [cx + bw * 0.72, hip + 2], [cx - bw * 0.72, hip + 2], [cx - bw * 0.62, waist], [cx - bw + 2, sh + 8]]), bark);
  for (const x of side ? [-6, -1, 4] : [-10, -5, 0, 5, 10]) {
    F.part(line(cx + x, sh + 3, cx + x * 0.6 + (x % 2 ? 1 : -1), hip, 1), grain, flatOut);
    F.part(line(cx + x + 1, sh + 4, cx + x * 0.6 + 2, waist, 1), ridge, flatOut);
  }
  if (!back && !side && !P.boss) for (const y of [waist - 6, waist - 2]) F.part(line(cx - 5, y, cx + 5, y, 1), grain, flatOut); // the ridges of a belly
  if (P.boss) { // glowing runes carved in two rows down the body (on the back too)
    const glyphs = [[[0, 0], [0, 1], [0, 2], [1, 0], [-1, 2]], [[0, 0], [1, 1], [0, 2], [-1, 1]], [[-1, 0], [0, 1], [1, 2], [0, 2], [-1, 2]], [[0, 0], [0, 1], [0, 2], [1, 1], [-1, 1]]];
    const cols = side ? [cx - 2] : [cx - 8, cx + 8];
    cols.forEach((x, c) => { for (let i = 0; i < 4; i++) for (const [dx, dy] of glyphs[(i + c) % 4]) F.dot(x + dx, sh + 4 + i * 5 + dy, P.rune); });
  }
  // moss and mushrooms on the shoulders and hips
  for (const s of side ? [1] : [-1, 1]) {
    F.part(ellipse(cx + s * (bw - 4), sh + 1, 5, 2.5), P.moss);
    mushroom(cx + s * (bw - 2), sh - 2); mushroom(cx + s * (bw - 6), sh - 1);
    if (P.boss) mushroom(cx + s * (bw - 4), hip - 3);
    F.part(both(line(cx + s * (bw - 3), sh, cx + s * (bw + 2), sh - 8, 1), line(cx + s * (bw + 1), sh - 6, cx + s * (bw + 4), sh - 7, 1)), grain, { flat: true }); // a broken bough
  }
  // the head, grown out of the shoulders, and the crown's boughs
  const hx = cx + (side ? 4 : 0);
  for (const [a, b] of side ? [[-8, -18], [-2, -22], [4, -17]] : [[-12, -16], [-5, -21], [3, -22], [11, -16]]) F.part(line(hx + a * 0.3, hy - 6, hx + a, hy + b, 2), grain);
  F.part(ellipse(hx, hy, side ? 8 : 9, 9.5), bark);
  if (!back) {
    // the mossy beard first, from the cheeks down over the chest; then the face over its top
    const bx = side ? hx + 3 : hx;
    const bl = P.boss ? 7 : 0; // the Ancient Treant's beard reaches its belly
    F.part(poly(side ? [[bx - 3, hy + 3], [bx + 6, hy + 3], [bx + 5, hy + 12 + bl], [bx + 1, hy + 19 + bl], [bx - 2, hy + 10]] : [[bx - 8, hy + 1], [bx - 4, hy + 4], [bx + 4, hy + 4], [bx + 8, hy + 1], [bx + 7, hy + 10 + bl * 0.5], [bx + 2, hy + 18 + bl], [bx, hy + 21 + bl], [bx - 2, hy + 18 + bl], [bx - 7, hy + 10 + bl * 0.5]]), P.moss);
    for (const x of side ? [0, 3] : [-5, -2, 1, 4]) F.part(line(bx + x, hy + 7, bx + x * 0.5, hy + 16, 1), dark(P.moss), flatOut);
    for (const x of side ? [1] : [-3, 3]) F.part(line(bx + x, hy + 6, bx + x * 0.6, hy + 12, 1), light(P.moss), flatOut);
    // a heavy, stern brow; deep sockets with glowing eyes under it; a long nose of bark
    const ex = side ? [hx + 4] : [hx - 4, hx + 3];
    for (const x of ex) { F.part(rect(x - 1, hy - 2, x + 2, hy - 2), P.mouth, flatOut); F.dot(x, hy - 2, P.eye); F.dot(x + 1, hy - 2, light(P.eye)); }
    F.part(poly(side ? [[hx - 1, hy - 6], [hx + 8, hy - 4], [hx + 8, hy - 3], [hx - 1, hy - 4]] : [[hx - 8, hy - 6], [hx - 1, hy - 3], [hx + 1, hy - 3], [hx + 8, hy - 6], [hx + 8, hy - 4], [hx + 1, hy - 1], [hx - 1, hy - 1], [hx - 8, hy - 4]]), grain, { flat: true });
    F.part(side ? poly([[hx + 6, hy - 2], [hx + 11, hy + 2], [hx + 6, hy + 2]]) : poly([[hx - 1, hy - 2], [hx + 1, hy - 2], [hx + 2, hy + 2], [hx - 2, hy + 2]]), ridge); // the nose
    F.part(rect(hx - (side ? -1 : 3), hy + 4, hx + (side ? 5 : 3), hy + 4 + (atk === 1 || atk === 2 ? 2 : 0)), P.mouth, flatOut); // the mouth in the beard
  } else F.part(line(hx, hy - 5, hx, hy + 6, 1), grain, flatOut);
  // the oak crown: clumps of leaves on the boughs, light on top, acorns hanging in it
  const cy = hy - 22;
  const clumps = side ? [[-8, 4, 10, 7], [6, 4, 10, 7], [-2, -3, 12, 8], [-12, -1, 7, 5], [10, -2, 7, 5]] : [[-16, 4, 10, 7], [16, 4, 10, 7], [-8, -2, 11, 8], [8, -2, 11, 8], [0, -6, 12, 8], [-20, -2, 6, 5], [20, -2, 6, 5]];
  for (const [x, y, rx, ry] of clumps) F.part(ellipse(hx + x, cy + y, rx, ry), P.leaf);
  for (const [x, y, rx, ry] of clumps) F.part(ellipse(hx + x - rx * 0.25, cy + y - ry * 0.35, rx * 0.5, ry * 0.38), P.leaf2, flatOut);
  for (const [x, y] of side ? [[-6, 8], [8, 6], [-12, 3]] : [[-12, 9], [6, 7], [18, 8], [-4, 2], [14, 0]]) { F.dot(hx + x, cy + y, '#8a5a2a'); F.dot(hx + x, cy + y + 1, '#b07a3a'); F.dot(hx + x, cy + y - 1, '#5a3a1a'); } // acorns
  if (P.boss) for (const [x, y] of side ? [[-10, -2], [-2, -8], [6, -4], [2, 2], [-8, 5], [11, 1]] : [[-18, -1], [-10, -6], [-2, -10], [7, -7], [15, -3], [21, 1], [-15, 5], [2, 1], [11, 4]]) { // blossoms
    F.part(both(rect(hx + x - 1, cy + y, hx + x + 1, cy + y), rect(hx + x, cy + y - 1, hx + x, cy + y + 1)), P.blossom);
    F.dot(hx + x, cy + y, '#fff0f6');
  }
  // the near arms last, over the body (raised over the crown when it slams)
  if (side) arm(1, true); else { arm(-1, true); arm(1, true); }
}
