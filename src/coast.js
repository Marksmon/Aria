// Hafnvik's coast (the fifth city's four fields, docs/fifth-city.md), its monsters painted pixel by pixel in code.
// Every one a kind of its own, none Aria had before (the owner's call): Tusk Walruses, Sea Otters and the Wreckers,
// coast bandits with crossbows (Tide Cliffs); Shell Turtles, Reef Octopuses that throw ink, Glass Jellies and the
// Merrows, fish-folk with harpoons (Coral Shallows); Sky Mantas riding the wind, Moss Trolls and Isle Boars (Storm
// Isles); Bog Toads, the Sea Hags, kelp-haired sea witches, and Fire Salamanders (Beacon Moor). Mostly Neutral, a few
// elemental for variety (the owner's call), and a Neutral one looks plain, a creature of shore and moor with no glow;
// only the elemental ones glow: the Merrows' sea-blue harpoons (Water), the Mantas' wind streaks (Wind), the Hags'
// violet eyes and staff (Shadow), the Salamanders' flames (Fire).
// Frames: 4 directions (down, up, right; left is right mirrored) x idle (1), walk (4) and attack (4).
import { Frame, ellipse, rect, poly, line, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
// size: the frame; body: the standing figure in pixels (def.w is its width in the world)
export const COAST = {
  // Tide Cliffs (65-70)
  seaOtter: { kind: 'otter', size: [52, 40], body: [34, 20], fur: '#6a4a32', belly: '#c8a882', nose: '#2a1a12', eye: '#1a120c', whisker: '#e8dcc8' },
  tuskWalrus: { kind: 'walrus', size: [68, 56], body: [50, 36], hide: '#8a6a58', belly: '#b8987e', flipper: '#6a4e40', tusk: '#f2ead8', whisker: '#e8dcc8', eye: '#1a1210' },
  wrecker: { kind: 'wrecker', size: [48, 64], body: [22, 56], skin: '#d8a888', coat: '#4a5a68', hood: '#3a4652', scarf: '#8a3a2a', boot: '#3a2a20', belt: '#6a4a2a', wood: '#6a4a2a', steel: '#b8c0c8', eye: '#1a1410' },
  // Coral Shallows (70-76)
  shellTurtle: { kind: 'turtle', size: [64, 50], body: [46, 32], shell: '#5a6a3e', plate: '#7a8a52', rim: '#d0c090', skin: '#8a8a64', belly: '#c8c09a', eye: '#1a1a10' },
  reefOctopus: { kind: 'octopus', size: [56, 54], body: [36, 42], skin: '#b0606a', spot: '#8a4450', sucker: '#f0c8c0', eye: '#f0e0a0', pupil: '#1a1010', ink: '#2a2030' },
  glassJelly: { kind: 'jelly', size: [48, 56], body: [28, 46], bell: '#c8d4dc', rim: '#eef2f4', glow: '#b8c6d0', tent: '#b8a8c0', heart: '#d8c8d0' },
  merrow: { kind: 'merrow', size: [48, 64], body: [24, 56], scale: '#2e7a9a', belly: '#c0e4f0', fin: '#5ad0f0', hair: '#1e4a7a', eye: '#9af0ff', spear: '#c8b898', tip: '#8ae8ff', shell: '#a8e0f8' },
  // Storm Isles (76-82)
  skyManta: { kind: 'manta', size: [68, 52], body: [50, 26], back: '#3e5a7a', belly: '#e0eaf4', edge: '#26405a', eye: '#1a2430', wind: '#c8f0ff', gust: '#8ad8ff' },
  mossTroll: { kind: 'troll', size: [64, 74], body: [38, 66], skin: '#7a8a5e', shade: '#5a6a44', hair: '#4a6a2e', nose: '#8a9a6a', cloth: '#6a5a40', club: '#6a4a2a', eye: '#2a2010', tooth: '#e8e0c8' },
  isleBoar: { kind: 'boar', size: [58, 44], body: [38, 28], hide: '#5a4636', bristle: '#3a2c22', snout: '#c89a88', tusk: '#f0e8d4', hoof: '#2a201a', eye: '#1a1008' },
  // Beacon Moor (82-88)
  bogToad: { kind: 'toad', size: [56, 46], body: [40, 30], skin: '#6a7a3a', wart: '#4e5a2a', belly: '#d8d0a0', eye: '#e8c040', pupil: '#1a1408', mouth: '#8a4a3a', tongue: '#d86a7a' },
  seaHag: { kind: 'hag', size: [48, 64], body: [24, 58], skin: '#8a9a8a', robe: '#3a3448', rag: '#2a2636', kelp: '#3a5a3a', staff: '#5a4a3a', glow: '#b890ff', eye: '#c8a0ff', shell: '#d8d0e0' },
  fireSalamander: { kind: 'salamander', size: [64, 42], body: [46, 22], body1: '#c8401a', belly: '#f0a040', spot: '#8a2410', flame: '#ffd060', flame2: '#ff7a20', eye: '#ffe890' },
};

const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function coastSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => coastFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}
function coastFrame(id, dir, anim, f) {
  if (dir === 'left') return coastFrame(id, 'right', anim, f).mirror();
  const P = COAST[id], [W, H] = P.size;
  const F = new Frame(W, H);
  const a = { G: H - 3, W, H, walk: anim === 'walk', f, step: anim === 'walk' ? [1, 0, -1, 0][f] : 0, atk: anim === 'attack' ? f : -1 };
  ({ otter, walrus, wrecker, turtle, octopus, jelly, merrow, manta, troll, boar, toad, hag, salamander })[P.kind](F, P, dir, a);
  return F;
}

// ---------- Merrows: fish-folk of the shallows, a fin for a crest, a shell at the belt, a harpoon thrown ----------
function merrow(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk ? [0, -1, 0, -1][f] : 0, thrust = atk >= 0 ? [0, -3, 4, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 16 + bob, sh = G - 34 + bob, hy = G - 42 + bob;
  // legs, webbed feet
  for (const s of [-1, 1]) {
    const lx = cx + s * 3 + (side ? s * step * 2 : 0);
    F.part(rect(lx - 2, hip, lx + 2, G - 2), P.scale);
    F.part(poly([[lx - 3, G - 2], [lx + 4, G - 2], [lx + 1, G]]), P.fin);
  }
  // body: scaled, a pale belly, a shell at the belt
  F.part(ellipse(cx, (hip + sh) / 2 + 1, 7, 10), P.scale);
  if (!back) F.part(ellipse(cx, (hip + sh) / 2 + 2, 4, 7), P.belly, flat);
  if (!back) F.part(ellipse(cx + 2, hip - 1, 2.5, 2), P.shell);
  if (back) F.part(poly([[cx, sh - 2], [cx + 3, hip], [cx - 3, hip]]), P.fin); // a fin down the back
  // the harpoon: up in the throwing hand, thrust forward on the attack
  const hx = side ? cx + 6 + thrust : cx + 8, top = sh - 10 - (side ? 0 : thrust);
  if (side) { F.part(line(hx - 10, sh + 2, hx + 12, sh - 2, 1), P.spear); F.part(poly([[hx + 12, sh - 4], [hx + 17, sh - 2.5], [hx + 12, sh]]), P.tip); }
  else { F.part(line(hx, top, hx, G - 4, 1), P.spear); F.part(poly([[hx - 2, top], [hx, top - 5], [hx + 2, top]]), P.tip); }
  // arms
  for (const s of [-1, 1]) F.part(line(cx + s * 6, sh + 2, cx + s * 8, sh + 11, 2), P.scale);
  // head: a broad fish face, round eyes, a fin crest and hair like kelp
  F.part(ellipse(cx + (side ? 2 : 0), hy, 6, 6), P.scale);
  F.part(poly([[cx - 2, hy - 5], [cx, hy - 12], [cx + 3, hy - 5]]), P.fin);
  for (const s of [-1, 1]) F.part(poly([[cx + s * 5, hy - 1], [cx + s * 10, hy - 4], [cx + s * 8, hy + 3]]), P.fin); // gill fins
  if (!back) {
    if (side) F.dot(cx + 5, hy - 1, P.eye);
    else { F.part(ellipse(cx - 2.5, hy - 1, 1.6, 1.6), P.eye, flat); F.part(ellipse(cx + 2.5, hy - 1, 1.6, 1.6), P.eye, flat); }
    F.part(rect(cx - 2 + (side ? 3 : 0), hy + 3, cx + 2 + (side ? 3 : 0), hy + 3), dark(P.scale), flat);
  } else F.part(line(cx - 4, hy + 2, cx - 5, hy + 9, 2), P.hair);
}

// ---------- Glass Jellies: a glassy bell glowing from within, tentacles trailing; they drift, and sting down ----------
function jelly(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, pulse = [0, 1, 2, 1][(walk || atk < 0 ? f : atk) % 4], sting = atk >= 0 ? [0, 2, 4, 1][atk] : 0;
  const by = G - 26 - pulse + sting;
  for (let i = -3; i <= 3; i++) { // the tentacles, swaying
    const x0 = cx + i * 2.6, sway = Math.sin(f * 1.6 + i) * 2;
    F.part(line(x0, by + 4, x0 + sway, by + 14 + Math.abs(i) * 0 + sting, 1), P.tent, flat);
    F.part(line(x0 + sway, by + 14 + sting, x0 - sway * 0.5, by + 20 + sting, 1), P.tent, flat);
  }
  F.part(ellipse(cx, by, 11 - pulse * 0.6, 8 + pulse * 0.4), P.bell);
  F.part(rect(cx - 10, by + 4, cx + 10, by + 5), P.rim, flat);
  F.part(ellipse(cx, by - 1, 5, 4), P.glow, flat);
  F.part(ellipse(cx, by - 1, 2.2, 2), P.heart, flat);
  F.part(ellipse(cx - 4, by - 4, 2.5, 1.5), P.rim, flat); // a glint on the glass
  if (dir !== 'up') { F.dot(cx - 3, by + 1, dark(P.bell)); F.dot(cx + 3, by + 1, dark(P.bell)); }
}

// ---------- Sea Otters: long and sleek, low to the ground, a thick tail; they dart in and bite twice ----------
function otter(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, rip = walk ? [0, -1, 0, 1][f] : 0, lunge = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  if (side) {
    F.part(poly([[cx - 10, G - 6], [cx - 22, G - 3 + rip], [cx - 20, G - 1], [cx - 8, G - 3]]), dark(P.fur)); // the tail
    F.part(ellipse(cx - 1 + lunge * 0.4, G - 6 + rip * 0.5, 12, 5), P.fur);
    F.part(ellipse(cx + lunge * 0.4, G - 4, 8, 2.5), P.belly, flat);
    for (const k of [-7, 5]) F.part(rect(cx + k + lunge * 0.4 + (walk ? rip : 0), G - 3, cx + k + 2 + lunge * 0.4 + (walk ? rip : 0), G), dark(P.fur));
    const hx = cx + 12 + lunge, hy = G - 9 + rip * 0.5;
    F.part(ellipse(hx, hy, 5.5, 4.5), P.fur);
    F.part(ellipse(hx + 3, hy + 1.5, 3, 2.4), P.belly);
    F.dot(hx + 5.5, hy + 0.5, P.nose); F.dot(hx + 1.5, hy - 1.5, P.eye);
    F.part(ellipse(hx - 2.5, hy - 4, 1.5, 1.5), dark(P.fur));
    F.part(line(hx + 4, hy + 2, hx + 9, hy + 1, 1), P.whisker, flat);
    if (atk >= 1 && atk <= 2) F.part(rect(hx + 4, hy + 3, hx + 6, hy + 4), '#f6f0e0', flat);
    return;
  }
  const by = G - 8 + rip * 0.5;
  if (back) F.part(poly([[cx - 2, by + 4], [cx + 2, by + 4], [cx + rip, G + 0]]), dark(P.fur));
  F.part(ellipse(cx, by, 7, 7), P.fur);
  if (!back) F.part(ellipse(cx, by + 1, 4, 5), P.belly, flat);
  for (const s of [-1, 1]) F.part(rect(cx + s * 5 - 1, G - 3, cx + s * 5 + 1, G), dark(P.fur));
  const hy = by - 7 - (back ? 0 : lunge * 0.4);
  F.part(ellipse(cx, hy, 5.5, 4.5), P.fur);
  for (const s of [-1, 1]) F.part(ellipse(cx + s * 4.5, hy - 3.5, 1.5, 1.5), dark(P.fur));
  if (!back) {
    F.part(ellipse(cx, hy + 1.5, 3, 2.2), P.belly);
    F.dot(cx - 2, hy - 1, P.eye); F.dot(cx + 2, hy - 1, P.eye); F.dot(cx, hy + 1, P.nose);
    for (const s of [-1, 1]) F.part(line(cx + s * 2, hy + 2, cx + s * 7, hy + 1, 1), P.whisker, flat);
  }
}

// ---------- Tusk Walruses: a great blubbery bulk on flippers, whiskered, two long tusks; they heave and gore ----------
function walrus(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, heave = walk ? [0, -2, 0, -1][f] : 0, gore = atk >= 0 ? [0, -3, 4, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  if (side) {
    F.part(poly([[cx - 18, G - 4], [cx - 26, G - 1], [cx - 24, G + 1], [cx - 14, G - 1]]), P.flipper); // the tail flippers
    F.part(ellipse(cx - 3, G - 12 + heave, 19, 11), P.hide);
    F.part(ellipse(cx - 1, G - 7 + heave, 14, 5), P.belly, flat);
    F.part(poly([[cx + 4, G - 6], [cx + 10, G], [cx + 2, G]]), P.flipper);
    const hx = cx + 15, hy = G - 16 + heave + gore * 0.6;
    F.part(ellipse(hx, hy, 8, 7.5), P.hide);
    F.part(ellipse(hx + 4, hy + 3, 5, 3.5), P.belly);
    for (const t of [-1, 1]) F.part(line(hx + 3 + t, hy + 5, hx + 5 + t, hy + 15 + Math.max(0, gore), 2), P.tusk);
    F.dot(hx + 2, hy - 3, P.eye);
    for (let k = 0; k < 3; k++) F.dot(hx + 6, hy + 2 + k, P.whisker);
    return;
  }
  F.part(ellipse(cx, G - 14 + heave, 17, 13), P.hide);
  if (!back) F.part(ellipse(cx, G - 9 + heave, 11, 7), P.belly, flat);
  for (const s of [-1, 1]) F.part(poly([[cx + s * 12, G - 8], [cx + s * 20, G], [cx + s * 10, G]]), P.flipper);
  if (back) { F.part(poly([[cx - 4, G - 3], [cx + 4, G - 3], [cx + 8, G + 1], [cx - 8, G + 1]]), P.flipper); return; }
  const hy = G - 26 + heave + gore * 0.5;
  F.part(ellipse(cx, hy, 9, 8), P.hide);
  F.part(ellipse(cx, hy + 4, 7, 4), P.belly);
  for (const s of [-1, 1]) F.part(line(cx + s * 3, hy + 6, cx + s * 4, hy + 18 + Math.max(0, gore), 2), P.tusk);
  F.dot(cx - 4, hy - 2, P.eye); F.dot(cx + 4, hy - 2, P.eye);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) F.dot(cx + s * (6 + k), hy + 4, P.whisker);
}

// ---------- Wreckers: coast bandits who lure ships onto the rocks; a hooded coat, a red scarf, a crossbow ----------
function wrecker(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk ? [0, -1, 0, -1][f] : 0, kick = atk >= 0 ? [0, 0, -2, -1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 18 + bob, sh = G - 36 + bob, hy = G - 43 + bob;
  for (const s of [-1, 1]) { const lx = cx + s * 3 + (side ? s * step * 2 : 0); F.part(rect(lx - 2, hip, lx + 2, G - 3), dark(P.coat)); F.part(rect(lx - 2.5, G - 4, lx + 2.5, G), P.boot); }
  F.part(poly([[cx - 8, sh], [cx + 8, sh], [cx + 9, hip + 4], [cx - 9, hip + 4]]), P.coat); // the long coat
  F.part(rect(cx - 8, hip - 1, cx + 8, hip), P.belt);
  if (!back) F.part(poly([[cx - 5, sh], [cx + 5, sh], [cx + 3, sh + 5], [cx - 3, sh + 5]]), P.scarf);
  // the crossbow: held out in front (to the side), its string snapping on the attack
  if (side) {
    const bx = cx + 9 + kick, by = sh + 5;
    F.part(rect(bx - 6, by - 1, bx + 5, by + 1), P.wood);
    F.part(line(bx + 4, by - 6, bx + 4, by + 6, 1), P.wood);
    F.part(line(bx + 4, by - 6, bx + (atk === 1 ? 0 : -2), by, 1), P.steel, flat); F.part(line(bx + 4, by + 6, bx + (atk === 1 ? 0 : -2), by, 1), P.steel, flat);
    F.part(line(cx + 2, sh + 3, bx - 4, by, 2), P.coat);
  } else {
    F.part(rect(cx - 6, sh + 6, cx + 6, sh + 8), P.wood);
    if (!back) F.part(line(cx, sh + 4, cx, sh + 12, 1), P.steel, flat);
    for (const s of [-1, 1]) F.part(line(cx + s * 7, sh + 2, cx + s * 5, sh + 7, 2), P.coat);
  }
  // the head in its hood
  F.part(ellipse(cx + (side ? 1 : 0), hy, 5.5, 6), P.hood);
  if (!back) {
    F.part(ellipse(cx + (side ? 2.5 : 0), hy + 1, 3.5, 4), P.skin);
    if (side) F.dot(cx + 4, hy, P.eye); else { F.dot(cx - 1.5, hy, P.eye); F.dot(cx + 1.5, hy, P.eye); }
    F.part(rect(cx - 3 + (side ? 2 : 0), hy + 3, cx + 3 + (side ? 2 : 0), hy + 4), P.scarf, flat); // the scarf over the mouth
  }
}

// ---------- Shell Turtles: a high plated shell, a beaked head that snaps out, heavy feet ----------
function turtle(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, plod = walk ? [0, -1, 0, 0][f] : 0, snap = atk >= 0 ? [0, -2, 5, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const legs = side ? [cx - 10, cx + 8] : [cx - 13, cx + 13];
  for (const lx of legs) F.part(ellipse(lx + (walk ? (f % 2 ? 1 : -1) : 0), G - 3, 4, 3.5), P.skin);
  if (side) {
    const hx = cx + 17 + snap, hy = G - 10 + plod;
    F.part(ellipse(hx - 3, hy + 1, 5, 3), P.skin); // the neck
    F.part(ellipse(hx + 1, hy, 4.5, 3.8), P.skin);
    F.part(poly([[hx + 4, hy], [hx + 7, hy + 1], [hx + 4, hy + 2]]), dark(P.skin)); F.dot(hx + 1, hy - 1, P.eye);
  }
  F.part(ellipse(cx, G - 12 + plod, side ? 17 : 16, 11), P.shell);
  F.part(rect(cx - (side ? 17 : 16), G - 6 + plod, cx + (side ? 17 : 16), G - 5 + plod), P.rim);
  for (const [px, py] of [[0, -6], [-8, -2], [8, -2], [0, 2], [-12, 3], [12, 3]]) F.part(ellipse(cx + px, G - 12 + plod + py, 4, 3), P.plate);
  if (!side && !back) {
    const hy = G - 6 + plod + snap * 0.6;
    F.part(ellipse(cx, hy, 5, 4.5), P.skin);
    F.part(poly([[cx - 2, hy + 2], [cx + 2, hy + 2], [cx, hy + 5]]), dark(P.skin)); F.dot(cx - 2, hy - 1, P.eye); F.dot(cx + 2, hy - 1, P.eye);
  }
}

// ---------- Reef Octopuses: a great soft head, wide eyes, eight arms curling on the sand; they throw ink ----------
function octopus(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0, puff = atk >= 0 ? [0, 2, 3, 0][atk] : 0;
  const by = G - 22 - puff;
  for (let i = 0; i < 8; i++) { // the arms
    const a = -0.3 + (i / 7) * (Math.PI + 0.6), x0 = cx + Math.cos(a) * 7, x1 = cx + Math.cos(a) * (14 + (i % 2) * 3) + sway * (i % 2 ? 1 : -1), y1 = G - 1 - (i % 3);
    F.part(line(x0, by + 8, x1, y1, 3), i % 2 ? P.skin : dark(P.skin));
    F.part(ellipse(x1, y1, 2, 1.5), P.skin);
  }
  F.part(ellipse(cx, by, 11 + puff * 0.4, 12 + puff * 0.5), P.skin);
  for (const [sx, sy] of [[-5, -6], [4, -8], [6, -2], [-6, 2]]) F.part(ellipse(cx + sx, by + sy, 1.6, 1.4), P.spot, flat);
  if (dir !== 'up') {
    for (const s of [-1, 1]) { F.part(ellipse(cx + s * 4.5 + (dir === 'right' ? 2 : 0), by + 5, 2.6, 2.4), P.eye); F.dot(cx + s * 4.5 + (dir === 'right' ? 3 : 0), by + 5, P.pupil); }
    if (atk >= 1) F.part(ellipse(cx + (dir === 'right' ? 6 : 0), by + 10, 2, 1.5), P.ink, flat);
  }
}

// ---------- Sky Mantas: great rays that ride the wind over the isles, wings rippling, gusts streaming off them ----------
function manta(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, ripple = [0, 2, 0, -2][(walk || atk < 0 ? f : atk) % 4], swoop = atk >= 0 ? [0, 4, 8, 2][atk] : 0;
  const by = G - 22 + swoop;
  const side = dir === 'right';
  if (side) {
    F.part(ellipse(cx - 1, by, 13, 3.5), P.belly); // the body, seen edge-on
    F.part(poly([[cx - 18, by], [cx + 8, by - 4 - ripple], [cx + 16, by], [cx + 8, by + 3]]), P.back);
    F.part(poly([[cx - 6, by - 2], [cx + 2, by - 11 - ripple * 1.5], [cx + 7, by - 2]]), P.back); // the near wing, raised
    F.part(line(cx + 2, by - 11 - ripple * 1.5, cx + 7, by - 2, 1), P.edge, flat);
    F.part(line(cx - 18, by, cx - 30, by + 2, 1), P.edge);
    F.part(poly([[cx + 12, by - 1], [cx + 18, by - 3], [cx + 17, by + 1]]), dark(P.back)); // the head fins
    F.dot(cx + 12, by - 1, P.eye);
  } else {
    F.part(poly([[cx, by - 9], [cx + 25, by - 2 - ripple], [cx + 6, by + 6], [cx, by + 8], [cx - 6, by + 6], [cx - 25, by - 2 - ripple]]), dir === 'up' ? P.back : P.belly);
    F.part(poly([[cx, by - 9], [cx + 25, by - 2 - ripple], [cx + 22, by - 1 - ripple], [cx, by - 6], [cx - 22, by - 1 - ripple], [cx - 25, by - 2 - ripple]]), P.edge, flat);
    F.part(line(cx, by + 8, cx, by + 20, 1), P.edge); // the tail
    if (dir === 'down') { for (const s of [-1, 1]) { F.part(poly([[cx + s * 3, by - 8], [cx + s * 6, by - 12], [cx + s * 5, by - 7]]), dark(P.back)); F.dot(cx + s * 4, by - 5, P.eye); } }
  }
  // the wind: streaks of air streaming off its wingtips (Wind)
  for (const s of [-1, 1]) {
    const wx = cx + s * (side ? 14 : 24), wy = by - 2 - ripple;
    F.part(line(wx, wy + 3, wx + s * 6, wy + 7 + (f % 2), 1), P.wind, flat);
    F.part(line(wx - s * 3, wy + 6, wx + s * 3, wy + 11, 1), P.gust, flat);
  }
}

// ---------- Moss Trolls: hulking, stooped, long-armed, moss for hair, a big nose and a club; slow and crushing ----------
function troll(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk ? [0, -2, 0, -1][f] : 0, swing = atk >= 0 ? [0, -1, 1, 0.4][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 20 + bob, sh = G - 44 + bob, hy = G - 50 + bob;
  for (const s of [-1, 1]) { const lx = cx + s * 6 + (side ? s * step * 3 : 0); F.part(rect(lx - 4, hip, lx + 4, G - 3), P.skin); F.part(ellipse(lx + (side ? 2 : 0), G - 2, 5, 2.5), P.shade); }
  F.part(ellipse(cx, (hip + sh) / 2 + 2, 15, 15), P.skin); // the great hunched body
  F.part(rect(cx - 13, hip - 2, cx + 13, hip + 4), P.cloth);
  if (!back) F.part(ellipse(cx, (hip + sh) / 2 + 3, 9, 9), light(P.skin), flat);
  F.part(ellipse(cx - (side ? 3 : 0), sh, 12, 6), P.hair); // moss over the shoulders
  // the club arm: raised and brought down on the attack; the other arm hangs to the knee
  const ax = cx + (side ? 6 : 13), ay = sh + 2;
  const cxE = ax + (side ? 12 : 4) * Math.cos(swing * 1.2 - 0.6), cyE = ay - 14 * Math.sin(1 - swing * 1.4);
  F.part(line(ax, ay, cxE, cyE + 10, 4), P.skin);
  F.part(line(cxE, cyE + 10, cxE + (side ? 6 : 2), cyE - 4, 4), P.club);
  F.part(ellipse(cxE + (side ? 7 : 2), cyE - 6, 4, 4), P.club);
  if (!side) F.part(line(cx - 13, sh + 2, cx - 15, hip + 10, 4), P.skin);
  // the head, low between the shoulders
  F.part(ellipse(cx + (side ? 6 : 0), hy, 7, 6.5), P.skin);
  F.part(ellipse(cx + (side ? 6 : 0), hy - 5, 6.5, 3), P.hair);
  if (!back) {
    F.part(ellipse(cx + (side ? 12 : 0), hy + 1, side ? 3 : 2.5, 3), P.nose);
    if (side) F.dot(cx + 9, hy - 1, P.eye); else { F.dot(cx - 3, hy - 1, P.eye); F.dot(cx + 3, hy - 1, P.eye); }
    for (const s of side ? [1] : [-1, 1]) F.part(rect(cx + (side ? 9 : s * 3), hy + 4, cx + (side ? 9 : s * 3), hy + 6), P.tooth, flat);
  }
}

// ---------- Isle Boars: bristle-backed, tusked, low-headed; they paw the ground and charge ----------
function boar(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, trot = walk ? [0, -1, 0, -1][f] : 0, charge = atk >= 0 ? [0, -2, 6, 2][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  if (side) {
    for (const [k, ph] of [[-10, 0], [-6, 1], [6, 1], [10, 0]]) F.part(rect(cx + k + (walk ? ((f + ph) % 2 ? 1 : -1) : 0) + charge * 0.3, G - 8, cx + k + 2 + charge * 0.3, G), P.hoof);
    F.part(ellipse(cx + charge * 0.3, G - 13 + trot, 15, 8), P.hide);
    for (let x = -12; x <= 8; x += 3) F.part(poly([[cx + x + charge * 0.3, G - 20 + trot], [cx + x + 2 + charge * 0.3, G - 25 + trot], [cx + x + 4 + charge * 0.3, G - 20 + trot]]), P.bristle);
    const hx = cx + 16 + charge, hy = G - 11 + trot;
    F.part(ellipse(hx - 2, hy, 7, 6), P.hide);
    F.part(ellipse(hx + 5, hy + 2, 3, 3), P.snout);
    F.part(poly([[hx + 3, hy + 3], [hx + 7, hy - 3], [hx + 5, hy + 4]]), P.tusk);
    F.dot(hx, hy - 2, P.eye);
    F.part(poly([[hx - 5, hy - 5], [hx - 3, hy - 10], [hx - 1, hy - 5]]), dark(P.hide)); // the ear
    return;
  }
  for (const s of [-1, 1]) for (const z of [0, 1]) F.part(rect(cx + s * (6 + z * 3) - 1, G - 7, cx + s * (6 + z * 3) + 1, G), P.hoof);
  F.part(ellipse(cx, G - 14 + trot, 12, 9), P.hide);
  F.part(poly([[cx - 3, G - 23 + trot], [cx, G - 28 + trot], [cx + 3, G - 23 + trot]]), P.bristle);
  if (back) return;
  const hy = G - 12 + trot + charge * 0.4;
  F.part(ellipse(cx, hy, 7, 6), P.hide);
  F.part(ellipse(cx, hy + 3, 3.5, 2.5), P.snout);
  for (const s of [-1, 1]) { F.part(poly([[cx + s * 3, hy + 3], [cx + s * 7, hy - 3], [cx + s * 5, hy + 4]]), P.tusk); F.dot(cx + s * 3, hy - 2, P.eye); F.part(poly([[cx + s * 5, hy - 4], [cx + s * 8, hy - 9], [cx + s * 8, hy - 3]]), dark(P.hide)); }
}

// ---------- Bog Toads: squat and warty, eyes on top, a wide mouth; they hop, and their spit sticks you to the moss ----------
function toad(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, hop = walk ? [0, -4, -2, 0][f] : 0, gape = atk >= 0 ? [0, 1, 2, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const by = G - 10 + hop;
  for (const s of [-1, 1]) F.part(ellipse(cx + s * (side ? 6 : 13), G - 3, 6, 3), P.skin); // the haunches
  F.part(ellipse(cx, by, side ? 15 : 16, 10), P.skin);
  if (!back) F.part(ellipse(cx + (side ? 3 : 0), by + 4, 10, 5), P.belly, flat);
  for (const [wx, wy] of [[-8, -4], [5, -6], [9, -1], [-3, -7], [-11, 1]]) F.part(ellipse(cx + wx, by + wy, 1.5, 1.2), P.wart, flat);
  for (const s of side ? [1] : [-1, 1]) { // the eyes, up on top
    const ex = cx + (side ? 7 : s * 6), ey = by - 8;
    F.part(ellipse(ex, ey, 3, 3), P.skin); if (!back) { F.part(ellipse(ex, ey, 2, 2), P.eye, flat); F.dot(ex, ey, P.pupil); }
  }
  if (back) return;
  F.part(rect(cx - (side ? -2 : 9), by + 1, cx + (side ? 14 : 9), by + 1 + gape), P.mouth, flat);
  if (atk >= 1 && atk <= 2) F.part(line(cx + (side ? 14 : 0), by + 2, cx + (side ? 24 : 0), by + (side ? 1 : 12), 2), P.tongue, flat); // the tongue lashes out
}

// ---------- Sea Hags: hunched sea witches in rags, kelp for hair, a driftwood staff with a glowing shell (Shadow) ----------
function hag(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, bob = walk ? [0, -1, 0, -1][f] : 0, cast = atk >= 0 ? [0, 1, 2, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const sh = G - 34 + bob, hy = G - 40 + bob;
  F.part(poly([[cx - 6, sh], [cx + 6, sh], [cx + 11, G], [cx - 11, G]]), P.robe); // the robe, ragged at the hem
  for (let x = -10; x <= 8; x += 4) F.part(poly([[cx + x, G - 2], [cx + x + 2, G + 1], [cx + x + 4, G - 2]]), P.rag);
  // the staff, the shell at its top glowing violet
  const sx = cx + (side ? 9 : 10), top = sh - 10 - cast * 2;
  F.part(line(sx, top, sx + (side ? 1 : 0), G - 1, 1), P.staff);
  F.part(ellipse(sx, top - 1, 2.5, 2.5), P.shell);
  F.part(ellipse(sx, top - 1, 1.4 + cast * 0.5, 1.4 + cast * 0.5), P.glow, flat);
  if (cast) { F.part(ellipse(sx, top - 1, 3.5 + cast, 3.5 + cast), P.glow, flat); F.part(ellipse(sx, top - 1, 1.5, 1.5), P.shell, flat); } // (casting: the shell blazes)
  F.part(line(cx + 4, sh + 3, sx, sh + 5, 2), P.skin);
  // the head, hunched forward, kelp hair hanging
  F.part(ellipse(cx + (side ? 2 : 0), hy, 5, 5.5), P.skin);
  for (const k of side ? [-4, -2, 0] : back ? [-4, -2, 0, 2, 4] : [-5, -4, 4, 5]) F.part(line(cx + k + (side ? -1 : 0), hy - 4, cx + k * 1.3 + (side ? -2 : 0), hy + 9 + Math.abs(k), 1), P.kelp); // (from the front, at the sides of the face)
  if (!back && !side) F.part(rect(cx - 4, hy - 5, cx + 4, hy - 4), P.kelp); // a fringe of kelp over the brow
  if (!back) {
    if (side) F.dot(cx + 5, hy, P.eye); else { F.dot(cx - 2, hy, P.eye); F.dot(cx + 2, hy, P.eye); }
    F.part(poly([[cx + (side ? 6 : 0), hy + 1], [cx + (side ? 9 : 1.5), hy + 4], [cx + (side ? 5 : -1.5), hy + 3]]), dark(P.skin)); // the long nose
  }
}

// ---------- Fire Salamanders: long burning lizards, a crest of flame down the back flickering, quick to bite (Fire) ----------
function salamander(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, wig = walk ? [0, 1, 0, -1][f] : 0, lunge = atk >= 0 ? [0, 2, 6, 2][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const flick = (x, y, h) => { F.part(poly([[x - 2, y], [x, y - h - (f % 2)], [x + 2, y]]), P.flame2); F.part(poly([[x - 1, y], [x, y - h * 0.6], [x + 1, y]]), P.flame, flat); };
  if (side) {
    F.part(poly([[cx - 10, G - 6], [cx - 26, G - 4 + wig], [cx - 27, G - 2 + wig], [cx - 10, G - 3]]), P.body1); // the tail
    for (const k of [-8, 6]) F.part(rect(cx + k + lunge * 0.4 + (walk ? wig : 0), G - 4, cx + k + 2 + lunge * 0.4, G), dark(P.body1));
    F.part(ellipse(cx + lunge * 0.4, G - 6, 13, 4.5), P.body1);
    F.part(ellipse(cx + lunge * 0.4, G - 4, 9, 2), P.belly, flat);
    for (const sx of [-7, 0, 6]) F.dot(cx + sx + lunge * 0.4, G - 7, P.spot);
    for (const x of [-9, -4, 1, 6]) flick(cx + x + lunge * 0.4, G - 10, 4);
    const hx = cx + 15 + lunge, hy = G - 7;
    F.part(ellipse(hx, hy, 6, 3.6), P.body1);
    F.dot(hx + 1, hy - 1.5, P.eye);
    if (atk >= 1 && atk <= 2) F.part(poly([[hx + 5, hy], [hx + 11, hy - 2], [hx + 11, hy + 2]]), P.flame, flat); // a lick of flame from its jaws
    return;
  }
  // seen from the front (or behind): the tail curling away, four legs splayed, the flame crest along the spine
  const by = G - 9;
  F.part(line(cx, by - 4, cx + wig * 3, by - 16, 3), P.body1); // the tail, behind
  for (const s of [-1, 1]) for (const z of [-3, 3]) {
    F.part(line(cx + s * 5, by + z, cx + s * 11, by + z + 3 + (walk ? (f % 2 ? s : -s) : 0), 2), P.body1);
    F.part(rect(cx + s * 11 - 1, by + z + 3, cx + s * 11 + 1, by + z + 4), dark(P.body1));
  }
  F.part(ellipse(cx, by, 6, 8), P.body1);
  for (const sy of [-4, 0, 4]) F.dot(cx + (sy % 8 ? 2 : -2), by + sy, P.spot);
  for (const y of [-6, -2, 2]) flick(cx, by + y, 3);
  if (back) return;
  const hy = by + 8 + lunge * 0.5;
  F.part(ellipse(cx, hy, 5.5, 4), P.body1);
  F.part(ellipse(cx, hy + 2, 3.5, 1.6), P.belly, flat);
  F.dot(cx - 3, hy - 1, P.eye); F.dot(cx + 3, hy - 1, P.eye);
  if (atk >= 1 && atk <= 2) F.part(poly([[cx - 2, hy + 3], [cx + 2, hy + 3], [cx, hy + 9]]), P.flame, flat);
}
