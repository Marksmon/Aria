// Hafnvik's coast (the fifth city's four fields, docs/fifth-city.md), its monsters painted pixel by pixel in code
// like Yggdrasil's (roots.js): mostly Neutral, a few elemental for variety (the owner's call). A Neutral one looks
// plain, a creature of shore and moor (the owner's call: no glowing runes, eyes or tips); only the elemental ones
// glow: the Merrows' sea-blue harpoons (Water), the Storm Petrels' sparks (Wind), the Draugr's violet eyes and runes
// (Shadow), the Beacon Wraiths' flame (Fire). New painters for the
// Cliff Gulls and Storm Petrels (gull), the Merrows, fish-folk who throw harpoons (merrow), and the Glass Jellies
// that drift over the shallows (jelly); Yggdrasil's golem, serpent, beetle, stag and warden painters in sea
// colours for the Tide Golems and Isle Trolls, the Reef Eels, the Coral Beetles, the Isle Elks and the drowned
// Draugr (paintRootsKind). The Barnacle Crabs, Moor Hounds and Beacon Wraiths are sprites.js's crab, beasts.js's
// wolf and the wisp in new colours.
// Frames: 4 directions (down, up, right; left is right mirrored) x idle (1), walk (4) and attack (4).
import { Frame, ellipse, rect, poly, line, dark, light } from './painted.js';
import { paintRootsKind } from './roots.js';

const flat = { outline: false, flat: true };
// size: the frame; body: the standing figure in pixels (def.w is its width in the world)
export const COAST = {
  // Tide Cliffs
  cliffGull: { kind: 'gull', size: [56, 52], body: [34, 30], feather: '#f4f2ec', wing: '#a8acb4', tip: '#3a3c44', beak: '#f0b030', leg: '#e88a3a', eye: '#1a1a1a' },
  tideGolem: { kind: 'golem', size: [64, 64], body: [44, 56], stone: '#8c908e', moss: '#3e5a4a', fern: '#56786a', cap: '#ecebe4', rune: '#626664', eye: '#222624', crack: '#5a5e5c' }, // grey, barnacles and seaweed
  // Coral Shallows
  reefEel: { kind: 'serpent', size: [52, 50], body: [28, 38], bark: '#4a6a5e', ridge: '#2e4a40', belly: '#e0d4a8', moss: '#c87a6a', leaf: '#e0a890', horn: '#e0d4c0', eye: '#e8c860', fang: '#f6f0e0', venom: '#e8e0c8' },
  coralBeetle: { kind: 'rotbeetle', size: [60, 50], body: [40, 32], shell: '#a8584e', crack: '#6a2a24', rot: '#d0806a', cap: '#e89aa0', capHi: '#f4c8c8', gill: '#f6ece8', leg: '#3a2420', eye: '#2a1a14', jaw: '#4a2a24', venom: '#f0e4d8', spore: '#f4e8e0' },
  merrow: { kind: 'merrow', size: [48, 64], body: [24, 56], scale: '#2e7a9a', belly: '#c0e4f0', fin: '#5ad0f0', hair: '#1e4a7a', eye: '#9af0ff', spear: '#c8b898', tip: '#8ae8ff', shell: '#a8e0f8' },
  glassJelly: { kind: 'jelly', size: [48, 56], body: [28, 46], bell: '#c8d4dc', rim: '#eef2f4', glow: '#b8c6d0', tent: '#b8a8c0', heart: '#d8c8d0' },
  // Storm Isles
  stormPetrel: { kind: 'gull', storm: true, size: [56, 52], body: [34, 30], feather: '#6a7080', wing: '#3a3e4a', tip: '#1e2028', beak: '#2a2a30', leg: '#2a2a30', eye: '#9ad8ff', spark: '#e8f4ff' },
  isleElk: { kind: 'stag', size: [68, 68], body: [44, 56], coat: '#9a8a72', belly: '#e8dcc8', antler: '#d8ccb0', glow: '#d8ccb0', eye: '#1a1408', hoof: '#3a2e22' },
  isleTroll: { kind: 'golem', size: [64, 64], body: [44, 56], stone: '#7a6450', moss: '#5a8a34', fern: '#8ab850', cap: '#9a7a52', rune: '#4e3e30', eye: '#3a2618', crack: '#4a3a2c' }, // brown, mossy green
  // Beacon Moor
  draugr: { kind: 'warden', size: [68, 80], body: [34, 72], bark: '#5a5e6a', plate: '#4a4e5e', moss: '#3a4a4a', leafy: '#5a6a6a', eye: '#c8a0ff', blade: '#8a8ea8', rune: '#b890ff' },
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
  const own = { gull, merrow, jelly }[P.kind];
  if (own) own(F, P, dir, a); else paintRootsKind(F, P, dir, a);
  return F;
}

// ---------- gulls (and the storm's petrels): long wings beating, hanging over the ground; they stoop to strike ----------
function gull(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, flap = [0, 1, 0, -1][(walk || atk < 0 ? f : atk) % 4], dive = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const by = G - 22 + dive + Math.round(flap * 0.6);
  const side = dir === 'right', back = dir === 'up';
  const wingY = by - 2 - flap * 5;
  if (side) {
    F.part(poly([[cx - 2, by - 2], [cx - 12, wingY - 4], [cx - 18, wingY], [cx - 4, by + 2]]), P.wing);
    F.part(poly([[cx - 12, wingY - 4], [cx - 18, wingY], [cx - 15, wingY + 1]]), P.tip, flat);
    F.part(ellipse(cx, by, 9, 4.5), P.feather);
    F.part(poly([[cx - 8, by - 1], [cx - 14, by - 3], [cx - 13, by + 2]]), P.feather); // the tail
    F.part(ellipse(cx + 8, by - 3, 4, 3.5), P.feather);
    F.part(poly([[cx + 11, by - 3], [cx + 16 + (atk >= 0 ? 1 : 0), by - 2], [cx + 11, by - 1]]), P.beak);
    F.dot(cx + 9, by - 4, P.eye);
    F.part(poly([[cx + 1, by - 2], [cx + 10, wingY - 6], [cx + 15, wingY - 3], [cx + 3, by + 1]]), light(P.wing));
    if (P.storm && f % 2) F.part(line(cx + 14, wingY - 3, cx + 17, wingY + 2, 1), P.spark, flat);
    return;
  }
  for (const s of [-1, 1]) {
    F.part(poly([[cx + s * 4, by - 1], [cx + s * 15, wingY - 3], [cx + s * 22, wingY + 1], [cx + s * 6, by + 3]]), P.wing);
    F.part(poly([[cx + s * 15, wingY - 3], [cx + s * 22, wingY + 1], [cx + s * 18, wingY + 2]]), P.tip, flat);
  }
  F.part(ellipse(cx, by, 5.5, 6), P.feather);
  if (back) { F.part(poly([[cx - 3, by + 4], [cx + 3, by + 4], [cx, by + 10]]), P.feather); return; }
  F.part(ellipse(cx, by - 6, 4, 3.6), P.feather);
  F.part(poly([[cx - 1.5, by - 5], [cx + 1.5, by - 5], [cx, by - 1 + (atk >= 0 ? 1 : 0)]]), P.beak);
  F.dot(cx - 2, by - 7, P.eye); F.dot(cx + 2, by - 7, P.eye);
  for (const s of [-1, 1]) F.part(line(cx + s * 2, by + 5, cx + s * 2, by + 8, 1), P.leg, flat);
  if (P.storm && f % 2) for (const s of [-1, 1]) F.part(line(cx + s * 20, wingY, cx + s * 23, wingY + 5, 1), P.spark, flat);
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
