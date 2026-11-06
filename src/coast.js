// Hafnvik's coast (the fifth city's four fields, docs/fifth-city.md), its monsters painted pixel by pixel in code.
// Every one a kind of its own, none Aria had before (the owner's call), and the Neutral ones land creatures, people and
// things with no sea about them (the owner's call: the coast is not a water region): Quill Porcupines, Tusk Boars and
// the Cliff Bandits, with crossbows (Tide Cliffs); Blade Mantises, Chest Mimics and the Glass Jellies, with the
// Merrows, fish-folk with harpoons (Water) (Coral Shallows); suits of Living Armor that walk on their own, Moss Trolls
// and the Gale Moths (Wind) (Storm Isles); Owlbears, the Moor Witches (Shadow) and the Fire Salamanders (Fire) (Beacon
// Moor). A Neutral one looks plain, with no glow; only the elemental ones glow: the Merrows' sea-blue harpoons, the
// Moths' wind streaming off their wings, the Witches' violet eyes and staff, the Salamanders' flames. The Merrows and
// Glass Jellies are also Poseidon's summons.
// Frames: 4 directions (down, up, right; left is right mirrored) x idle (1), walk (4) and attack (4).
import { Frame, ellipse, rect, poly, line, dark, light } from './painted.js';

const flat = { outline: false, flat: true };
// size: the frame; body: the standing figure in pixels (def.w is its width in the world)
export const COAST = {
  // Tide Cliffs (65-70)
  quillPorcupine: { kind: 'porcupine', size: [52, 44], body: [34, 26], fur: '#6a5040', quill: '#e8dcc0', tip: '#3a2a20', face: '#8a6a50', nose: '#2a1a12', eye: '#1a120c' },
  tuskBoar: { kind: 'boar', size: [58, 44], body: [38, 28], hide: '#5a4636', bristle: '#3a2c22', snout: '#c89a88', tusk: '#f0e8d4', hoof: '#2a201a', eye: '#1a1008' },
  cliffBandit: { kind: 'wrecker', size: [48, 64], body: [22, 56], skin: '#d8a888', coat: '#6a5a44', hood: '#4a3e30', scarf: '#8a3a2a', boot: '#3a2a20', belt: '#3a2a1a', wood: '#6a4a2a', steel: '#b8c0c8', eye: '#1a1410' },
  // Coral Shallows (70-76)
  bladeMantis: { kind: 'mantis', size: [52, 60], body: [30, 50], body1: '#7a9a4a', belly: '#b8c87a', blade: '#e8e4d0', eye: '#d8d060', pupil: '#2a2a10', leg: '#5a7a34' },
  chestMimic: { kind: 'mimic', size: [52, 46], body: [36, 32], wood: '#8a5a33', band: '#9aa0a8', lid: '#7a4a28', tongue: '#c8506a', tooth: '#f2ead8', eye: '#f0d040', gold: '#e3b341' },
  glassJelly: { kind: 'jelly', size: [48, 56], body: [28, 46], bell: '#c8d4dc', rim: '#eef2f4', glow: '#b8c6d0', tent: '#b8a8c0', heart: '#d8c8d0' },
  merrow: { kind: 'merrow', size: [48, 64], body: [24, 56], scale: '#2e7a9a', belly: '#c0e4f0', fin: '#5ad0f0', hair: '#1e4a7a', eye: '#9af0ff', spear: '#c8b898', tip: '#8ae8ff', shell: '#a8e0f8' },
  // Storm Isles (76-82)
  livingArmor: { kind: 'armor', size: [52, 70], body: [28, 62], plate: '#8a8e96', trim: '#6a6e76', dark: '#2a2a30', cloak: '#5a3a3a', blade: '#c8ccd4', shield: '#6a6e76' },
  mossTroll: { kind: 'troll', size: [64, 74], body: [38, 66], skin: '#7a8a5e', shade: '#5a6a44', hair: '#4a6a2e', nose: '#8a9a6a', cloth: '#6a5a40', club: '#6a4a2a', eye: '#2a2010', tooth: '#e8e0c8' },
  galeMoth: { kind: 'moth', size: [60, 52], body: [44, 30], wing: '#8aa8c8', wing2: '#c8dcec', body1: '#4a5a6a', eye: '#1a2430', wind: '#c8f0ff', gust: '#8ad8ff' },
  // Beacon Moor (82-88)
  owlbear: { kind: 'owlbear', size: [60, 64], body: [38, 54], fur: '#6a5040', feather: '#a88a64', face: '#e0d0b0', beak: '#d8b040', claw: '#efe6cc', eye: '#e8a030', pupil: '#1a1008' },
  moorWitch: { kind: 'hag', size: [48, 64], body: [24, 58], skin: '#9aa088', robe: '#3a3448', rag: '#2a2636', kelp: '#7a7468', staff: '#5a4a3a', glow: '#b890ff', eye: '#c8a0ff', shell: '#d8d0e0', hat: '#2a2636' },
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
  ({ porcupine, boar, wrecker, mantis, mimic, jelly, merrow, armor, troll, moth, owlbear, hag, salamander })[P.kind](F, P, dir, a);
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

// ---------- Cliff Bandits: robbers of the cliff road; a hooded coat, a red scarf over the face, a crossbow ----------
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

// ---------- Moor Witches: hunched in rags under a tall hat, grey hair, a staff with a glowing stone (Shadow) ----------
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
  if (P.hat) { // a tall crooked hat, its brim wide
    F.part(ellipse(cx + (side ? 1 : 0), hy - 4, 8, 2), P.hat);
    F.part(poly([[cx - 4 + (side ? 1 : 0), hy - 5], [cx + 4 + (side ? 1 : 0), hy - 5], [cx + (side ? -3 : 3), hy - 16]]), P.hat);
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

// ---------- Quill Porcupines: a round back of long pale quills, a blunt face; they turn, bristle and loose their quills ----------
function porcupine(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, shuffle = walk ? [0, -1, 0, -1][f] : 0, bristle = atk >= 0 ? [0, 2, 4, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const by = G - 9 + shuffle;
  for (const s of side ? [-6, 6] : [-8, 8]) F.part(rect(cx + s - 1, G - 4, cx + s + 1, G), dark(P.fur));
  F.part(ellipse(cx + (side ? -2 : 0), by, 14, 9), P.fur);
  for (let i = 0; i < 13; i++) { // the quills, fanned up over the back, longer as it bristles
    const a = Math.PI * (0.08 + (i / 12) * 0.84), len = 9 + (i % 3) * 2 + bristle;
    const x0 = cx + (side ? -2 : 0) + Math.cos(a) * 9, y0 = by - Math.sin(a) * 5;
    const x1 = x0 + Math.cos(a) * len * (side ? 1.1 : 1), y1 = y0 - Math.sin(a) * len;
    F.part(line(x0, y0, x1, y1, 1), P.quill, flat); F.dot(x1, y1, P.tip);
  }
  if (back) return;
  const hx = side ? cx + 11 : cx, hy = side ? by + 2 : by + 4;
  F.part(ellipse(hx, hy, side ? 5 : 6, 4.5), P.face);
  if (side) { F.dot(hx + 4, hy + 1, P.nose); F.dot(hx + 1, hy - 1, P.eye); }
  else { F.dot(hx - 2.5, hy - 1, P.eye); F.dot(hx + 2.5, hy - 1, P.eye); F.part(ellipse(hx, hy + 2, 1.5, 1), P.nose, flat); }
}

// ---------- Blade Mantises: tall green insects, two scythe arms folded and struck down, a triangular head ----------
function mantis(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, sway = walk ? [0, 1, 0, -1][f] : 0, strike = atk >= 0 ? [0, -0.6, 1, 0.3][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  for (const s of [-1, 1]) for (const k of [0, 1]) F.part(line(cx + s * 3, G - 14, cx + s * (7 + k * 4) + (walk ? step * s : 0), G, 1), P.leg); // four thin legs
  F.part(ellipse(cx - (side ? 4 : 0), G - 15, side ? 9 : 5, 5), P.body1); // the long abdomen
  F.part(line(cx + (side ? 1 : 0), G - 18, cx + (side ? 4 : 0) + sway, G - 34, 3), P.body1); // the thorax, upright
  if (!back) F.part(line(cx + (side ? 1 : 0), G - 20, cx + (side ? 3 : 0) + sway, G - 30, 1), P.belly, flat);
  // the scythes: folded up before it, swung down on the strike
  for (const s of side ? [1] : [-1, 1]) {
    const sx = cx + (side ? 6 : s * 4) + sway, sy = G - 30, ang = -1.2 + strike * 1.6;
    const ex = sx + Math.cos(ang) * 7 * (side ? 1 : s), ey = sy - Math.sin(ang) * 7;
    F.part(line(sx, sy, ex, ey, 2), P.body1);
    F.part(line(ex, ey, ex + Math.cos(ang + 2.4) * 8 * (side ? 1 : s), ey - Math.sin(ang + 2.4) * 8, 1), P.blade);
  }
  // the head: a triangle with great round eyes at its corners
  const hx = cx + (side ? 5 : 0) + sway, hy = G - 37;
  F.part(poly([[hx - 5, hy - 2], [hx + 5, hy - 2], [hx + (side ? 3 : 0), hy + 4]]), P.body1);
  if (!back) for (const s of side ? [1] : [-1, 1]) { F.part(ellipse(hx + s * 4, hy - 2, 2, 2), P.eye); F.dot(hx + s * 4, hy - 2, P.pupil); }
  for (const s of [-1, 1]) F.part(line(hx + s * 2, hy - 3, hx + s * 6, hy - 9, 1), P.leg, flat); // feelers
}

// ---------- Chest Mimics: a banded treasure chest that is a mouth; it hops after you and its lid snaps open ----------
function mimic(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, hop = walk ? [0, -3, -1, 0][f] : 0, gape = atk >= 0 ? [1, 5, 8, 3][atk] : walk ? 1 : 0;
  const side = dir === 'right', back = dir === 'up';
  const w = side ? 13 : 15, top = G - 15 + hop;
  F.part(rect(cx - w, top, cx + w, G - 1 + hop * 0.3), P.wood); // the box
  for (const bx of [-w + 3, w - 3]) F.part(rect(cx + bx - 1, top, cx + bx + 1, G - 1), P.band, flat);
  F.part(rect(cx - w, G - 4, cx + w, G - 3), P.band, flat);
  if (!back && gape > 0) { // the open mouth: teeth along both jaws, a long tongue
    F.part(rect(cx - w + 2, top - gape, cx + w - 2, top + 1), P.tongue, flat);
    for (let x = -w + 3; x <= w - 3; x += 3) { F.part(poly([[cx + x - 1, top], [cx + x + 1, top], [cx + x, top - 2]]), P.tooth, flat); F.part(poly([[cx + x - 1, top - gape], [cx + x + 1, top - gape], [cx + x, top - gape + 2]]), P.tooth, flat); }
    if (gape > 4) F.part(line(cx, top - 1, cx + (side ? 9 : 0), top + (side ? -2 : 6), 2), P.tongue);
  }
  // the lid, lifted by the gape
  F.part(poly([[cx - w - 1, top - gape], [cx + w + 1, top - gape], [cx + w - 1, top - gape - 6], [cx - w + 1, top - gape - 6]]), P.lid);
  F.part(rect(cx - 2, top - gape - 3, cx + 2, top - gape), P.gold, flat); // the lock
  if (!back && gape > 2) for (const s of side ? [1] : [-1, 1]) F.dot(cx + s * (w - 5), top - gape - 4, P.eye);
}

// ---------- Living Armor: a knight's empty armour walking on its own, darkness inside the helm, sword and shield ----------
function armor(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, clank = walk ? [0, -1, 0, -1][f] : 0, cut = atk >= 0 ? [0, -1, 1, 0.3][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  const hip = G - 22 + clank, sh = G - 40 + clank, hy = G - 47 + clank;
  for (const s of [-1, 1]) { const lx = cx + s * 4 + (side ? s * step * 2 : 0); F.part(rect(lx - 2.5, hip, lx + 2.5, G - 3), P.plate); F.part(rect(lx - 3, G - 4, lx + 3, G), P.trim); }
  if (back) F.part(poly([[cx - 8, sh], [cx + 8, sh], [cx + 10, hip + 8], [cx - 10, hip + 8]]), P.cloak);
  F.part(rect(cx - 8, sh, cx + 8, hip + 2), P.plate); // the breastplate
  F.part(rect(cx - 8, hip - 1, cx + 8, hip + 1), P.trim, flat);
  if (!back) F.part(line(cx, sh + 2, cx, hip - 2, 1), P.trim, flat);
  for (const s of [-1, 1]) F.part(ellipse(cx + s * 9, sh + 1, 4, 3), P.trim); // the pauldrons
  if (!back) { // the shield on the left arm, the sword in the right, swung on the attack
    F.part(poly([[cx - 14, sh + 4], [cx - 6, sh + 4], [cx - 6, sh + 13], [cx - 10, sh + 17], [cx - 14, sh + 13]]), P.shield);
    const ang = 0.9 - cut * 1.4, sx = cx + (side ? 6 : 10), sy = sh + 6;
    F.part(line(sx, sy, sx + Math.cos(ang) * 16, sy - Math.sin(ang) * 16, 2), P.blade);
    F.part(rect(sx - 2, sy - 1, sx + 2, sy + 1), P.trim);
  }
  F.part(rect(cx - 5 + (side ? 1 : 0), hy - 6, cx + 5 + (side ? 1 : 0), hy + 4), P.plate); // the helm
  F.part(rect(cx - 5 + (side ? 1 : 0), hy - 7, cx + 5 + (side ? 1 : 0), hy - 6), P.trim, flat);
  if (!back) F.part(rect(cx - 3 + (side ? 3 : 0), hy - 2, cx + 3 + (side ? 3 : 0), hy - 1), P.dark, flat); // the eye-slit: nothing inside
}

// ---------- Owlbears: a bear's bulk under owl feathers, a round owl face, a hooked beak, great claws ----------
function owlbear(F, P, dir, { G, W, step, walk, f, atk }) {
  const cx = W / 2, lumber = walk ? [0, -2, 0, -1][f] : 0, maul = atk >= 0 ? [0, -3, 3, 1][atk] : 0;
  const side = dir === 'right', back = dir === 'up';
  for (const s of [-1, 1]) { const lx = cx + s * 7 + (side ? s * step * 2 : 0); F.part(rect(lx - 4, G - 12, lx + 4, G - 2), P.fur); for (const k of [-2, 0, 2]) F.dot(lx + k, G - 1, P.claw); }
  F.part(ellipse(cx, G - 22 + lumber, 15, 14), P.fur);
  if (!back) F.part(ellipse(cx + (side ? 4 : 0), G - 20 + lumber, 9, 10), P.feather); // the feathered chest
  for (let k = 0; k < 4; k++) F.part(poly([[cx - 10 + k * 6, G - 30 + lumber], [cx - 7 + k * 6, G - 24 + lumber], [cx - 4 + k * 6, G - 30 + lumber]]), dark(P.feather), flat);
  for (const s of side ? [1] : [-1, 1]) { // the arms, raised to maul
    const ax = cx + s * (side ? 10 : 13), ay = G - 26 + lumber;
    F.part(line(ax, ay, ax + s * 3 + (side ? maul : 0), ay + 10 - maul * 2, 4), P.fur);
    for (const k of [-1.5, 0, 1.5]) F.part(line(ax + s * 3 + (side ? maul : 0) + k, ay + 12 - maul * 2, ax + s * 4 + (side ? maul : 0) + k, ay + 15 - maul * 2, 1), P.claw, flat);
  }
  const hx = cx + (side ? 7 : 0), hy = G - 38 + lumber + (maul > 0 ? 1 : 0);
  F.part(ellipse(hx, hy, 9, 8), P.feather);
  for (const s of [-1, 1]) F.part(poly([[hx + s * 5, hy - 6], [hx + s * 8, hy - 12], [hx + s * 9, hy - 5]]), P.feather); // the ear tufts
  if (back) return;
  F.part(ellipse(hx + (side ? 2 : 0), hy + 1, side ? 5 : 7, 6), P.face); // the owl's face disc
  for (const s of side ? [1] : [-1, 1]) { F.part(ellipse(hx + (side ? 3 : s * 3), hy - 1, 2.2, 2.2), P.eye); F.dot(hx + (side ? 3 : s * 3), hy - 1, P.pupil); }
  F.part(poly([[hx + (side ? 5 : -1.5), hy + 2], [hx + (side ? 9 : 1.5), hy + 2], [hx + (side ? 6 : 0), hy + 6]]), P.beak);
}

// ---------- Gale Moths: great grey-blue moths riding the wind, their wings beating up gusts that stream away (Wind) ----------
function moth(F, P, dir, { G, W, walk, f, atk }) {
  const cx = W / 2, beat = [0, 2, 4, 2][(walk || atk < 0 ? f : atk) % 4], dive = atk >= 0 ? [0, 3, 6, 2][atk] : 0;
  const by = G - 22 + dive, side = dir === 'right';
  if (side) {
    F.part(ellipse(cx, by, 7, 3), P.body1);
    F.part(poly([[cx - 4, by - 1], [cx + 2, by - 14 + beat], [cx + 8, by - 10 + beat], [cx + 4, by]]), P.wing);
    F.part(poly([[cx - 2, by + 1], [cx + 2, by + 7], [cx - 6, by + 6]]), P.wing2);
    F.part(line(cx + 6, by - 1, cx + 11, by - 6, 1), P.body1, flat); // a feather-feeler
    F.dot(cx + 5, by - 1, P.eye);
  } else {
    for (const s of [-1, 1]) {
      F.part(poly([[cx + s * 2, by - 2], [cx + s * 20, by - 12 + beat], [cx + s * 22, by - 2 + beat * 0.5], [cx + s * 4, by + 2]]), P.wing);
      F.part(poly([[cx + s * 2, by + 1], [cx + s * 14, by + 6], [cx + s * 9, by + 11], [cx + s * 2, by + 6]]), P.wing2);
      F.part(ellipse(cx + s * 12, by - 5 + beat * 0.5, 2.5, 2.5), P.wing2, flat); // the eye-spot on each wing
      F.part(line(cx + s * 1, by - 6, cx + s * 5, by - 12, 1), P.body1, flat);
    }
    F.part(ellipse(cx, by, 3, 7), P.body1);
    if (dir === 'down') { F.dot(cx - 1.5, by - 5, P.eye); F.dot(cx + 1.5, by - 5, P.eye); }
  }
  // the wind streaming off its wings (Wind)
  for (const s of [-1, 1]) {
    const wx = cx + s * (side ? 8 : 22), wy = by - 6 + beat;
    F.part(line(wx, wy, wx + s * 6, wy + 4 + (f % 2), 1), P.wind, flat);
    F.part(line(wx - s * 2, wy + 5, wx + s * 4, wy + 10, 1), P.gust, flat);
  }
}
