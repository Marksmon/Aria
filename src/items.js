// Items (materials, usables and equipment) and recipes, plus the painted icons used both on the ground and in menus.
import * as THREE from 'three';
import { headgearIcon, headgearReady } from './headgear.js';

// type: use (Usables tab), equip (Equips tab, one per slot, never stacks) or misc (Miscs tab).
// Equipment: slot (weapon, armor, shoes, light, acc), atk + wlv for weapons, def, and fx for a
// special effect. icon names the painted icon when it isn't the item's own id.
export const ITEMS = {
  gel:    { type: 'misc', name: 'Slime Gel',  desc: 'Wobbly and a little sticky.', from: 'Slimes' },
  dew:    { type: 'misc', name: 'Dew Drop',   desc: 'Cool water that never spills.', from: 'Blue Slimes' },
  seed:   { type: 'misc', name: 'Sprout Seed', desc: 'It wiggles when you hold it.', from: 'Sproutlings' },
  leaf:   { type: 'misc', name: 'Fresh Leaf', desc: 'Soft, green and tough.', from: 'Sproutlings' },
  shell:  { type: 'misc', name: 'Shell Bit',  desc: 'A hard pink fragment.', from: 'Mudcrabs' },
  spore:  { type: 'misc', name: 'Spore Cap',  desc: 'Smells like rain in the woods.', from: 'Mushlings' },
  stone:  { type: 'misc', name: 'Stone Chip', desc: 'Sharp ridge stone.', from: 'Pebble Beetles' },
  glow:   { type: 'misc', name: 'Glow Dust',  desc: 'Faintly warm, glows at night.', from: 'Firefly Wisps' },
  ember_heart: { type: 'misc', name: 'Ember Heart', desc: "The Ember Jarl's smouldering heart: proof of an MVP.", from: 'the Ember Jarl (MVP reward)' },

  // usables, like Ragnarok's potions and wings. use: hp/sp [min, max], warp (random | camp),
  // buff + t (seconds), cure (ends the Mushling spores' slow)
  potion:  { type: 'use', usable: true, name: 'Healing Draught', use: { hp: [45, 65] }, desc: 'Restores 45–65 HP.' },
  potion2: { type: 'use', usable: true, name: 'Strong Draught',  use: { hp: [105, 145] }, desc: 'Restores 105–145 HP.' },
  potion3: { type: 'use', usable: true, name: 'Greater Draught', use: { hp: [175, 235] }, desc: 'Restores 175–235 HP.' },
  tonic:   { type: 'use', usable: true, name: 'Mana Tonic', use: { sp: [40, 60] }, desc: 'Restores 40–60 SP.' },
  berry:   { type: 'use', usable: true, name: 'Wild Berry', use: { hp: [16, 22] }, desc: 'Sweet and juicy. Restores 16–22 HP.', from: 'Slimes and Sproutlings' },
  crableg: { type: 'use', usable: true, name: 'Crab Leg', use: { hp: [70, 100] }, desc: 'Roasted in its shell. Restores 70–100 HP.', from: 'Mudcrabs' },
  herb:    { type: 'use', usable: true, name: 'Green Herb', use: { hp: [5, 8], cure: true }, desc: 'Clears the head: cures spore sickness and restores a little HP.', from: 'Sproutlings and Mushlings' },
  quick:   { type: 'use', usable: true, name: 'Quickening Draught', use: { buff: 'aspd', t: 180 }, desc: '+10% attack speed for 3 minutes.' },
  wander:  { type: 'use', usable: true, name: 'Wander Feather', use: { warp: 'random' }, desc: 'Whisks you to a random spot on this map.', from: 'Firefly Wisps' },
  homeward: { type: 'use', usable: true, name: 'Homeward Feather', use: { warp: 'camp' }, desc: 'Carries you back to camp.' },

  // one-handed swords (Ragnarok rules, see rules.js)
  twig_sword:   { type: 'equip', slot: 'weapon', name: 'Twig Sword',  atk: 15, wlv: 1, icon: 'weapon0', desc: 'A stick with ambitions.' },
  stone_blade:  { type: 'equip', slot: 'weapon', name: 'Stone Blade', atk: 25, wlv: 1, icon: 'weapon1', desc: 'Ridge stone, knapped sharp.' },
  ember_edge:   { type: 'equip', slot: 'weapon', name: 'Ember Edge',  atk: 44, wlv: 2, icon: 'weapon2', desc: 'Warm to the touch, glowing at the edge.' },
  emberbrand:   { type: 'equip', slot: 'weapon', rare: true, name: 'Emberbrand', atk: 110, wlv: 3, icon: 'weapon3', desc: "The Ember Jarl's own blade, still burning.", from: 'the Ember Jarl' },
  // rare drops, Ragnarok style: each from one kind of monster at a fraction of a percent.
  // stats: bonus points to POW, QKN, END, KNL, FNS, FTN; mhp / msp: extra Max HP / SP
  gooey_ring:   { type: 'equip', slot: 'acc', rare: true, name: 'Gooey Ring', stats: { ftn: 2 }, mhp: 20, icon: 'r_gooey', desc: 'A ring of hardened slime that never quite dries. FTN +2, Max HP +20.', from: 'Green Slimes (0.5%)' },
  tide_pendant: { type: 'equip', slot: 'acc', rare: true, name: 'Tidewater Pendant', stats: { knl: 2 }, msp: 15, icon: 'r_tide', desc: 'Cool to the touch, like deep water. KNL +2, Max SP +15.', from: 'Blue Slimes (0.3%)' },
  seedling_band: { type: 'equip', slot: 'acc', rare: true, name: 'Seedling Band', stats: { end: 1, qkn: 1 }, fx: 'regen', icon: 'r_seed', desc: 'A living green bracelet. END +1, QKN +1, HP recovers twice as fast.', from: 'Sproutlings (0.4%)' },
  mud_buckler:  { type: 'equip', slot: 'shield', rare: true, name: 'Mudshell Buckler', def: 3, mhp: 40, icon: 'r_buckler', desc: 'A small round shield from a giant crab shell. DEF 3, Max HP +40.', from: 'Mudcrabs (0.3%)' },
  spore_cloak:  { type: 'equip', slot: 'garment', rare: true, name: 'Sporeweave Cloak', def: 1, flee: 4, icon: 'r_cloak', desc: 'Woven from mushroom threads, light as mist. DEF 1, FLEE +4.', from: 'Mushlings (0.25%)' },
  horn_blade:   { type: 'equip', slot: 'weapon', rare: true, name: 'Beetlehorn Blade', atk: 68, wlv: 3, stats: { pow: 1 }, icon: 'weapon_horn', desc: 'A sword ground from a beetle horn, harder than iron. POW +1.', from: 'Pebble Beetles (0.15%)' },
  pebble_ring:  { type: 'equip', slot: 'acc', rare: true, name: 'Pebble Ring', stats: { end: 2 }, def: 1, icon: 'r_pebble', desc: 'A plain stone band. END +2, DEF 1.', from: 'Pebble Beetles (0.3%)' },
  wisp_lantern: { type: 'equip', slot: 'light', rare: true, name: 'Wisp Lantern', fx: 'light', stats: { knl: 1, fns: 1 }, icon: 'r_lantern', desc: 'A Firefly Wisp sleeps inside. Lights the night. KNL +1, FNS +1.', from: 'Firefly Wisps (0.4%)' },
  shiny_gel:    { type: 'misc', rare: true, name: 'Shimmering Gel', desc: 'Slime gel that glows with every colour. Prized by collectors.', from: 'any slime (1%)' },

  // headgear: worn on the head (head) or face, and seen on your character (see headgear.js)
  ember_crown:  { type: 'equip', slot: 'head', rare: true, name: "Jarl's Ember Crown", def: 4, stats: { pow: 2, end: 1 }, desc: 'A horned iron crown, still warm.', from: 'the Ember Jarl' },
  flame_circlet: { type: 'equip', slot: 'head', rare: true, name: 'Flame Circlet', def: 2, stats: { pow: 1, ftn: 1 }, desc: 'An iron circlet crowned with living flame, forged around an Ember Heart. POW +1, FTN +1.' },
  woven_cap:    { type: 'equip', slot: 'head', name: 'Woven Cap', def: 1, desc: 'Leaves woven tight, with a sturdy band.' },
  flower_wreath: { type: 'equip', slot: 'head', name: 'Flower Wreath', def: 0, flee: 1, desc: 'Meadow flowers on a green ring. +1 FLEE.' },
  horned_helm:  { type: 'equip', slot: 'head', name: 'Horned Helm', def: 3, desc: 'Iron, brass and two proud horns.' },
  round_glasses: { type: 'equip', slot: 'face', name: 'Round Glasses', hit: 3, desc: 'Polished dew-glass lenses. +3 HIT.' },
  raven_mask:   { type: 'equip', slot: 'face', name: 'Raven Mask', flee: 2, desc: 'Black feathers and a short beak: you look like trouble. +2 FLEE.' },
  // body armor: hard DEF
  clothes:      { type: 'equip', slot: 'armor', name: 'Traveler Clothes', def: 1, icon: 'armor0', desc: 'Patched and comfortable.' },
  leaf_tunic:   { type: 'equip', slot: 'armor', name: 'Leaf Tunic',  def: 2, icon: 'armor1', desc: 'Woven leaves, surprisingly tough.' },
  shell_mail:   { type: 'equip', slot: 'armor', name: 'Shell Mail',  def: 4, icon: 'armor2', desc: 'Overlapping shell plates.' },
  beetle_plate: { type: 'equip', slot: 'armor', name: 'Beetle Plate', def: 6, icon: 'armor3', desc: 'Heavy, dark and very hard.' },
  swift_boots:  { type: 'equip', slot: 'shoes', name: 'Swift Boots', def: 1, fx: 'speed', icon: 'boots', desc: '+20% move speed.' },
  torch:        { type: 'equip', slot: 'light', name: 'Torch', fx: 'light', desc: 'Lights your way at night.' },
  // accessories: one can be worn at a time
  sprout_charm: { type: 'equip', slot: 'acc', name: 'Sprout Charm', fx: 'regen', icon: 'charm_sprout', desc: 'HP recovers twice as fast.' },
  spore_charm:  { type: 'equip', slot: 'acc', name: 'Spore Charm',  fx: 'aspd',  icon: 'charm_spore', desc: '+10% attack speed.' },
  shell_charm:  { type: 'equip', slot: 'acc', name: 'Shell Charm',  fx: 'block', icon: 'charm_shell', desc: '1 in 5 hits is blocked.' },
  glow_charm:   { type: 'equip', slot: 'acc', name: 'Glow Charm',   fx: 'exp',   icon: 'charm_glow', desc: '+25% experience.' },
};

// equipment slots, in the Equipment window's order
export const SLOTS = { head: 'Head', face: 'Face', weapon: 'Weapon', shield: 'Shield', garment: 'Garment', armor: 'Armor', shoes: 'Shoes', light: 'Light', acc: 'Accessory', acc2: 'Accessory' };

// one line on what a piece of equipment does
export function equipLine(it) {
  const p = [];
  if (it.atk) p.push(`ATK ${it.atk}`, `Weapon Lv ${it.wlv}`);
  if (it.def) p.push(`DEF ${it.def}`);
  if (it.hit) p.push(`HIT +${it.hit}`);
  for (const [k, v] of Object.entries(it.stats || {})) p.push(`${k.toUpperCase()} +${v}`);
  if (it.mhp) p.push(`Max HP +${it.mhp}`);
  if (it.msp) p.push(`Max SP +${it.msp}`);
  if (it.flee) p.push(`FLEE +${it.flee}`);
  return p.join(' · ');
}

// Everything crafts into an item in the bag; lv = Base Level needed to craft it
export const RECIPES = [
  { item: 'stone_blade', lv: 3, cost: { stone: 4, shell: 3 } },
  { item: 'ember_edge',  lv: 6, cost: { stone: 6, glow: 4, spore: 3 } },
  { item: 'leaf_tunic',  lv: 2, cost: { leaf: 6, seed: 4 } },
  { item: 'shell_mail',  lv: 4, cost: { shell: 6, gel: 4 } },
  { item: 'beetle_plate', lv: 7, cost: { stone: 8, dew: 4, spore: 2 } },
  { item: 'potion', cost: { gel: 2, dew: 1, leaf: 1 } },
  { item: 'potion2', lv: 5, cost: { potion: 2, spore: 1 } },
  { item: 'potion3', lv: 10, cost: { potion2: 2, glow: 2 } },
  { item: 'tonic', lv: 3, cost: { dew: 3, glow: 1 } },
  { item: 'quick', lv: 6, cost: { spore: 2, dew: 2, stone: 1 } },
  { item: 'wander', lv: 2, cost: { glow: 1, leaf: 1 } },
  { item: 'homeward', lv: 2, cost: { glow: 2, seed: 1 } },
  { item: 'torch', cost: { glow: 3, leaf: 2 } },
  { item: 'swift_boots', cost: { shell: 4, dew: 3, leaf: 3 } },
  { item: 'flower_wreath', cost: { leaf: 3, seed: 2 } },
  { item: 'woven_cap', lv: 2, cost: { leaf: 5, seed: 2 } },
  { item: 'raven_mask', lv: 3, cost: { wander: 2, gel: 2 } },
  { item: 'round_glasses', lv: 5, cost: { dew: 3, stone: 2 } },
  { item: 'flame_circlet', lv: 12, cost: { ember_heart: 1, glow: 6, stone: 6 } },
  { item: 'horned_helm', lv: 8, cost: { stone: 6, shell: 4, glow: 1 } },
  { item: 'sprout_charm', lv: 2, cost: { seed: 5, leaf: 3 } },
  { item: 'spore_charm',  lv: 4, cost: { spore: 5, gel: 3 } },
  { item: 'shell_charm',  lv: 4, cost: { shell: 5, stone: 2 } },
  { item: 'glow_charm',   lv: 5, cost: { glow: 4, dew: 2 } },
];

// ---------- icons ----------
const OUT = '#2e2118';
function mk() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.lineJoin = g.lineCap = 'round';
  return { c, g };
}
function shape(g, draw, fill, lw = 3.5) {
  g.beginPath(); draw(); g.fillStyle = fill; g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke();
}
function gloss(g, x, y, rx = 5, ry = 3.5) {
  g.beginPath(); g.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill();
}

function swordIcon(g, blade, guard, edge) {
  g.save(); g.translate(32, 32); g.rotate(Math.PI / 4);
  shape(g, () => { g.moveTo(-4.5, 6); g.lineTo(4.5, 6); g.lineTo(4.5, -18); g.lineTo(0, -26); g.lineTo(-4.5, -18); g.closePath(); }, blade);
  if (edge) { g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -22); g.strokeStyle = edge; g.lineWidth = 2; g.stroke(); }
  shape(g, () => g.roundRect(-11, 5, 22, 6, 2), guard, 2.5);
  shape(g, () => g.roundRect(-3, 10, 6, 12, 2), '#6b4426', 2.5);
  shape(g, () => g.arc(0, 24, 4, 0, Math.PI * 2), guard, 2.5);
  g.restore();
}

function armorIcon(g, main, trim) {
  shape(g, () => {
    g.moveTo(16, 16); g.lineTo(26, 11); g.quadraticCurveTo(32, 17, 38, 11); g.lineTo(48, 16);
    g.lineTo(52, 30); g.lineTo(45, 32); g.lineTo(45, 54); g.lineTo(19, 54); g.lineTo(19, 32); g.lineTo(12, 30); g.closePath();
  }, main);
  g.beginPath(); g.moveTo(19, 44); g.lineTo(45, 44); g.strokeStyle = trim; g.lineWidth = 4; g.stroke();
  gloss(g, 26, 24);
}

// a pendant on a cord; gem colour per charm
function charmIcon(g, gem, rim) {
  g.beginPath(); g.moveTo(14, 8); g.quadraticCurveTo(32, 30, 50, 8); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke();
  g.strokeStyle = '#b07a4c'; g.lineWidth = 2.5; g.stroke();
  shape(g, () => g.arc(32, 38, 17, 0, Math.PI * 2), rim);
  shape(g, () => { g.moveTo(32, 26); g.lineTo(43, 38); g.lineTo(32, 50); g.lineTo(21, 38); g.closePath(); }, gem, 2.5);
  gloss(g, 28, 34, 3, 2.5);
}

function potionIcon(g, col) {
  shape(g, () => g.roundRect(26, 8, 12, 12, 3), '#b07a4c', 3);
  shape(g, () => { g.moveTo(24, 20); g.lineTo(40, 20); g.lineTo(40, 26); g.quadraticCurveTo(54, 32, 52, 44); g.quadraticCurveTo(50, 56, 32, 56); g.quadraticCurveTo(14, 56, 12, 44); g.quadraticCurveTo(10, 32, 24, 26); g.closePath(); }, col);
  gloss(g, 22, 38, 4, 6);
}

function featherIcon(g, vane, rib) {
  shape(g, () => { g.moveTo(14, 54); g.quadraticCurveTo(12, 22, 48, 8); g.quadraticCurveTo(52, 34, 20, 52); g.closePath(); }, vane);
  g.beginPath(); g.moveTo(10, 58); g.quadraticCurveTo(26, 34, 46, 12); g.strokeStyle = rib; g.lineWidth = 3; g.stroke();
  for (const t of [0.35, 0.55, 0.75]) { g.beginPath(); g.moveTo(14 + t * 30, 50 - t * 38); g.lineTo(22 + t * 30, 44 - t * 34); g.strokeStyle = rib; g.lineWidth = 1.5; g.stroke(); }
}

// skill icons: a coloured disc with a white symbol
function skillIcon(g, col, draw) {
  shape(g, () => g.arc(32, 32, 26, 0, Math.PI * 2), col);
  g.strokeStyle = g.fillStyle = '#fff4dc';
  g.lineWidth = 5;
  draw();
}

const PAINT = {
  gel: (g) => {
    shape(g, () => { g.moveTo(10, 50); g.bezierCurveTo(6, 26, 22, 14, 32, 14); g.bezierCurveTo(42, 14, 58, 26, 54, 50); g.quadraticCurveTo(32, 56, 10, 50); }, '#7fd05a');
    gloss(g, 24, 26, 7, 4.5);
  },
  dew: (g) => {
    shape(g, () => { g.moveTo(32, 8); g.bezierCurveTo(40, 22, 50, 30, 50, 40); g.arc(32, 40, 18, 0, Math.PI); g.bezierCurveTo(14, 30, 24, 22, 32, 8); }, '#6cc4ef');
    gloss(g, 25, 38, 4, 6);
  },
  seed: (g) => {
    shape(g, () => g.ellipse(32, 40, 15, 12, 0, 0, Math.PI * 2), '#b9874f');
    g.beginPath(); g.moveTo(32, 28); g.quadraticCurveTo(30, 18, 34, 12); g.strokeStyle = OUT; g.lineWidth = 6; g.stroke();
    g.strokeStyle = '#5fae45'; g.lineWidth = 3; g.stroke();
    shape(g, () => g.ellipse(42, 14, 8, 4, -0.4, 0, Math.PI * 2), '#7cc455', 2.5);
    gloss(g, 26, 36);
  },
  leaf: (g) => {
    shape(g, () => { g.moveTo(12, 52); g.quadraticCurveTo(10, 16, 52, 10); g.quadraticCurveTo(50, 50, 12, 52); }, '#6bbd4a');
    g.beginPath(); g.moveTo(14, 50); g.quadraticCurveTo(30, 34, 46, 16); g.strokeStyle = '#3f7a35'; g.lineWidth = 2.5; g.stroke();
  },
  shell: (g) => {
    shape(g, () => { g.moveTo(32, 52); g.lineTo(10, 26); g.quadraticCurveTo(32, 2, 54, 26); g.closePath(); }, '#f2a8a0');
    for (const a of [-0.6, -0.2, 0.2, 0.6]) {
      g.beginPath(); g.moveTo(32, 50); g.lineTo(32 + Math.sin(a) * 26, 50 - Math.cos(a) * 32); g.strokeStyle = '#c9726a'; g.lineWidth = 2; g.stroke();
    }
  },
  spore: (g) => {
    shape(g, () => g.roundRect(26, 32, 12, 22, 4), '#efe2c4', 3);
    shape(g, () => { g.moveTo(8, 36); g.quadraticCurveTo(32, -4, 56, 36); g.closePath(); }, '#8a64b8');
    for (const [x, y] of [[22, 26], [34, 20], [44, 28]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fillStyle = '#e0d2f5'; g.fill(); }
  },
  stone: (g) => {
    shape(g, () => { g.moveTo(12, 46); g.lineTo(20, 18); g.lineTo(40, 12); g.lineTo(54, 30); g.lineTo(46, 52); g.lineTo(22, 54); g.closePath(); }, '#a09a8e');
    g.beginPath(); g.moveTo(20, 20); g.lineTo(40, 14); g.lineTo(34, 34); g.closePath(); g.fillStyle = '#c4beb2'; g.fill();
  },
  glow: (g) => {
    const star = (x, y, r, col) => shape(g, () => {
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath();
    }, col, 2.5);
    star(28, 34, 18, '#ffe37a'); star(46, 18, 9, '#fff3b0'); star(48, 46, 7, '#ffd34a');
  },
  potion: (g) => potionIcon(g, '#e2554a'),
  potion2: (g) => potionIcon(g, '#f08a32'),
  potion3: (g) => potionIcon(g, '#f2cf3a'),
  tonic: (g) => potionIcon(g, '#4a8ce8'),
  quick: (g) => { potionIcon(g, '#a36ad8'); g.beginPath(); g.moveTo(34, 30); g.lineTo(27, 42); g.lineTo(33, 42); g.lineTo(29, 52); g.strokeStyle = '#fff4dc'; g.lineWidth = 3; g.stroke(); },
  berry: (g) => {
    for (const [x, y] of [[24, 40], [40, 40], [32, 28]]) { shape(g, () => g.arc(x, y, 11, 0, Math.PI * 2), '#d23a5a', 3); gloss(g, x - 4, y - 4, 3, 2.5); }
    shape(g, () => g.ellipse(40, 14, 9, 4.5, -0.5, 0, Math.PI * 2), '#6bbd4a', 2.5);
  },
  crableg: (g) => {
    shape(g, () => { g.moveTo(10, 50); g.lineTo(30, 30); g.lineTo(36, 36); g.lineTo(16, 56); g.closePath(); }, '#e86a4a');
    shape(g, () => { g.moveTo(30, 30); g.quadraticCurveTo(36, 8, 54, 10); g.quadraticCurveTo(50, 22, 40, 26); g.quadraticCurveTo(52, 26, 56, 34); g.quadraticCurveTo(40, 40, 36, 36); g.closePath(); }, '#f08a6a');
    gloss(g, 40, 18, 4, 2.5);
  },
  herb: (g) => {
    for (const a of [-0.9, 0, 0.9]) {
      g.save(); g.translate(32, 50); g.rotate(a);
      shape(g, () => { g.moveTo(0, 0); g.quadraticCurveTo(-12, -20, 0, -40); g.quadraticCurveTo(12, -20, 0, 0); }, '#5fae45', 3);
      g.restore();
    }
  },
  wander: (g) => featherIcon(g, '#9fd4ff', '#4a8ce8'),
  homeward: (g) => featherIcon(g, '#ffd27a', '#e08a3a'),
  weapon0: (g) => swordIcon(g, '#c49a63', '#8a5a33', '#a07848'),
  weapon1: (g) => swordIcon(g, '#cfd6de', '#7a7f8a', '#9aa4b2'),
  weapon2: (g) => swordIcon(g, '#ffb35a', '#c8463c', '#ffe27a'),
  weapon3: (g) => swordIcon(g, '#3a2a2a', '#e05a1a', '#ff9a3a'),
  weapon_horn: (g) => swordIcon(g, '#e8dcc0', '#6a6a72', '#fff4dc'),
  r_gooey: (g) => charmIcon(g, '#7fd05a', '#c8f0a8'),
  r_tide: (g) => charmIcon(g, '#3a8ce8', '#9fd4ff'),
  r_seed: (g) => {
    g.beginPath(); g.ellipse(32, 36, 20, 14, 0, 0, Math.PI * 2); g.strokeStyle = OUT; g.lineWidth = 9; g.stroke();
    g.strokeStyle = '#5fae45'; g.lineWidth = 5; g.stroke();
    for (const [x, y] of [[14, 30], [32, 22], [50, 30]]) shape(g, () => g.ellipse(x, y, 6, 3.5, -0.4, 0, Math.PI * 2), '#8fd060', 2);
  },
  r_buckler: (g) => {
    shape(g, () => g.arc(32, 32, 24, 0, Math.PI * 2), '#c9726a');
    shape(g, () => g.arc(32, 32, 16, 0, Math.PI * 2), '#f2a8a0', 2.5);
    shape(g, () => g.arc(32, 32, 6, 0, Math.PI * 2), '#8c8478', 2.5);
    gloss(g, 24, 22, 5, 3);
  },
  r_cloak: (g) => {
    shape(g, () => { g.moveTo(22, 10); g.lineTo(42, 10); g.quadraticCurveTo(54, 34, 52, 56); g.lineTo(12, 56); g.quadraticCurveTo(10, 34, 22, 10); g.closePath(); }, '#8a64b8');
    for (const [x, y] of [[24, 30], [38, 38], [28, 46]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fillStyle = '#e0d2f5'; g.fill(); }
    shape(g, () => g.rect(20, 8, 24, 6), '#efe2c4', 2.5);
  },
  r_pebble: (g) => {
    g.beginPath(); g.arc(32, 38, 16, 0, Math.PI * 2); g.strokeStyle = OUT; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#a09a8e'; g.lineWidth = 6; g.stroke();
    shape(g, () => { g.moveTo(24, 22); g.lineTo(32, 10); g.lineTo(40, 22); g.closePath(); }, '#c4beb2', 2.5);
  },
  r_lantern: (g) => {
    shape(g, () => g.roundRect(18, 16, 28, 36, 6), '#3a3a42');
    shape(g, () => g.roundRect(23, 21, 18, 26, 4), '#ffe37a', 2);
    g.beginPath(); g.arc(32, 34, 5, 0, 7); g.fillStyle = '#fff8d0'; g.fill();
    g.beginPath(); g.moveTo(26, 16); g.quadraticCurveTo(32, 4, 38, 16); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
  },
  shiny_gel: (g) => {
    const grd = g.createLinearGradient(10, 14, 54, 52);
    grd.addColorStop(0, '#ff9ab8'); grd.addColorStop(0.5, '#9fd4ff'); grd.addColorStop(1, '#b6ec8e');
    shape(g, () => { g.moveTo(10, 50); g.bezierCurveTo(6, 26, 22, 14, 32, 14); g.bezierCurveTo(42, 14, 58, 26, 54, 50); g.quadraticCurveTo(32, 56, 10, 50); }, grd);
    gloss(g, 24, 26, 7, 4.5);
  },
  crown: (g) => {
    shape(g, () => { g.moveTo(12, 46); g.lineTo(12, 24); g.lineTo(22, 34); g.lineTo(32, 16); g.lineTo(42, 34); g.lineTo(52, 24); g.lineTo(52, 46); g.closePath(); }, '#6a6a72');
    for (const x of [22, 32, 42]) { shape(g, () => g.arc(x, 40, 3.5, 0, Math.PI * 2), '#ff8a3a', 2); }
    shape(g, () => { g.moveTo(12, 26); g.quadraticCurveTo(2, 16, 6, 6); g.quadraticCurveTo(14, 14, 16, 28); }, '#e8e0cc', 2.5);
    shape(g, () => { g.moveTo(52, 26); g.quadraticCurveTo(62, 16, 58, 6); g.quadraticCurveTo(50, 14, 48, 28); }, '#e8e0cc', 2.5);
  },
  ember_heart: (g) => {
    shape(g, () => { g.moveTo(32, 54); g.bezierCurveTo(4, 34, 14, 8, 32, 22); g.bezierCurveTo(50, 8, 60, 34, 32, 54); }, '#d8401a');
    g.beginPath(); g.moveTo(26, 30); g.lineTo(32, 38); g.lineTo(28, 46); g.strokeStyle = '#ffd23a'; g.lineWidth = 2.5; g.stroke();
    gloss(g, 22, 28, 4, 3);
  },
  armor0: (g) => armorIcon(g, '#4a78b5', '#6b4426'),
  armor1: (g) => armorIcon(g, '#6bbd4a', '#3f7a35'),
  armor2: (g) => armorIcon(g, '#f2a8a0', '#c9726a'),
  armor3: (g) => armorIcon(g, '#8c8478', '#e3b341'),
  torch: (g) => {
    shape(g, () => { g.moveTo(26, 30); g.lineTo(38, 30); g.lineTo(35, 58); g.lineTo(29, 58); g.closePath(); }, '#8a5a33');
    shape(g, () => { g.moveTo(22, 30); g.quadraticCurveTo(20, 16, 32, 4); g.quadraticCurveTo(44, 16, 42, 30); g.closePath(); }, '#f59a2b');
    g.beginPath(); g.moveTo(27, 28); g.quadraticCurveTo(27, 18, 32, 12); g.quadraticCurveTo(37, 18, 37, 28); g.fillStyle = '#ffe27a'; g.fill();
  },
  // Dodge Roll: a curved dash arrow with speed lines
  skill_dodge: (g) => {
    shape(g, () => g.arc(32, 32, 26, 0, Math.PI * 2), '#4a78b5');
    g.beginPath(); g.arc(30, 36, 14, Math.PI * 0.95, Math.PI * 2.1); g.strokeStyle = '#fff4dc'; g.lineWidth = 6; g.stroke();
    shape(g, () => { g.moveTo(44, 28); g.lineTo(52, 42); g.lineTo(37, 41); g.closePath(); }, '#fff4dc', 2.5);
    for (const [y, w] of [[22, 10], [30, 14], [38, 8]]) { g.beginPath(); g.moveTo(10, y); g.lineTo(10 + w, y); g.strokeStyle = 'rgba(255,244,220,.7)'; g.lineWidth = 3; g.stroke(); }
  },
  skill_lore: (g) => skillIcon(g, '#7a8a9a', () => { g.beginPath(); g.moveTo(32, 14); g.lineTo(40, 32); g.lineTo(32, 50); g.lineTo(24, 32); g.closePath(); g.stroke(); g.beginPath(); g.arc(32, 32, 3, 0, 7); g.fill(); }),
  skill_rest: (g) => skillIcon(g, '#6b8a5a', () => { g.beginPath(); g.arc(28, 20, 6, 0, 7); g.fill(); g.beginPath(); g.moveTo(28, 27); g.lineTo(30, 40); g.lineTo(44, 40); g.lineTo(44, 50); g.stroke(); }),
  skill_mend: (g) => skillIcon(g, '#c8463c', () => { g.save(); g.translate(32, 32); g.rotate(-0.6); g.fillRect(-14, -6, 28, 12); g.restore(); g.fillStyle = '#c8463c'; g.beginPath(); g.arc(32, 32, 3, 0, 7); g.fill(); }),
  skill_secondwind: (g) => skillIcon(g, '#4aa88a', () => { for (const y of [22, 32, 42]) { g.beginPath(); g.moveTo(14, y); g.quadraticCurveTo(32, y - 8, 50, y); g.stroke(); } }),
  skill_stone: (g) => skillIcon(g, '#8a7a6a', () => { g.beginPath(); g.ellipse(38, 36, 9, 7, 0.3, 0, 7); g.fill(); for (const [y, w] of [[26, 12], [34, 16], [42, 10]]) { g.beginPath(); g.moveTo(10, y); g.lineTo(10 + w, y); g.lineWidth = 3; g.stroke(); } }),
  skill_hush: (g) => skillIcon(g, '#5a5a7a', () => { g.beginPath(); g.moveTo(22, 32); g.lineTo(42, 32); g.stroke(); g.beginPath(); g.moveTo(32, 18); g.lineTo(32, 46); g.lineWidth = 3; g.stroke(); }),
  skill_quickfeet: (g) => skillIcon(g, '#4a90d8', () => { g.beginPath(); g.moveTo(20, 46); g.lineTo(30, 18); g.lineTo(36, 32); g.lineTo(46, 22); g.stroke(); }),
  skill_thrust: (g) => skillIcon(g, '#6a7a9a', () => { g.beginPath(); g.moveTo(14, 32); g.lineTo(50, 32); g.lineWidth = 5; g.stroke(); g.beginPath(); g.moveTo(42, 24); g.lineTo(52, 32); g.lineTo(42, 40); g.stroke(); }),
  skill_guard: (g) => skillIcon(g, '#7a6a4a', () => { g.beginPath(); g.moveTo(16, 46); g.lineTo(46, 16); g.lineWidth = 5; g.stroke(); g.beginPath(); g.moveTo(22, 22); g.lineTo(30, 30); g.stroke(); }),
  skill_discipline: (g) => skillIcon(g, '#5a6a8a', () => { g.beginPath(); g.moveTo(18, 46); g.lineTo(46, 18); g.stroke(); g.beginPath(); g.moveTo(16, 34); g.lineTo(30, 48); g.stroke(); }),
  skill_ironhide: (g) => skillIcon(g, '#6a7480', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(50, 20); g.quadraticCurveTo(48, 42, 32, 52); g.quadraticCurveTo(16, 42, 14, 20); g.closePath(); g.fill(); }),
  skill_cleave: (g) => skillIcon(g, '#c86a2a', () => { g.beginPath(); g.arc(32, 40, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.moveTo(46, 22); g.lineTo(52, 30); g.lineTo(42, 30); g.closePath(); g.fill(); }),
  skill_rend: (g) => skillIcon(g, '#a83a2a', () => { for (const dx of [-8, 0, 8]) { g.beginPath(); g.moveTo(26 + dx, 16); g.lineTo(38 + dx, 48); g.lineWidth = 4; g.stroke(); } }),
  skill_warcry: (g) => skillIcon(g, '#b03a4a', () => { for (const r of [8, 14, 20]) { g.beginPath(); g.arc(22, 32, r, -0.7, 0.7); g.lineWidth = 3.5; g.stroke(); } }),
  skill_standfirm: (g) => skillIcon(g, '#8a7a3a', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(50, 20); g.quadraticCurveTo(48, 42, 32, 52); g.quadraticCurveTo(16, 42, 14, 20); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(32, 22); g.lineTo(32, 42); g.stroke(); }),
  skill_earthsplit: (g) => skillIcon(g, '#8a5a2a', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(28, 26); g.lineTo(36, 34); g.lineTo(26, 52); g.lineWidth = 4; g.stroke(); g.beginPath(); g.moveTo(14, 46); g.lineTo(50, 46); g.stroke(); }),
  skill_rhythm: (g) => skillIcon(g, '#3a7aa0', () => { g.beginPath(); g.moveTo(10, 34); g.lineTo(20, 34); g.lineTo(26, 18); g.lineTo(34, 48); g.lineTo(40, 30); g.lineTo(54, 30); g.lineWidth = 4; g.stroke(); }),
  skill_laststand: (g) => skillIcon(g, '#a01a1a', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(32, 40); g.lineWidth = 6; g.stroke(); g.beginPath(); g.arc(32, 48, 3.5, 0, 7); g.fill(); }),
  talk: (g) => {
    shape(g, () => { g.roundRect(6, 8, 52, 36, 12); g.moveTo(18, 42); g.lineTo(14, 56); g.lineTo(30, 43); }, '#fff4dc');
    for (const x of [20, 32, 44]) { g.beginPath(); g.arc(x, 26, 3.5, 0, Math.PI * 2); g.fillStyle = OUT; g.fill(); }
  },
  charm_sprout: (g) => charmIcon(g, '#7cc455', '#e3b341'),
  charm_spore: (g) => charmIcon(g, '#a383d6', '#e3b341'),
  charm_shell: (g) => charmIcon(g, '#f2a8a0', '#cfd6de'),
  charm_glow: (g) => charmIcon(g, '#ffe37a', '#cfd6de'),
  boots: (g) => {
    shape(g, () => { g.moveTo(18, 10); g.lineTo(34, 10); g.lineTo(34, 40); g.lineTo(52, 44); g.quadraticCurveTo(56, 54, 48, 56); g.lineTo(14, 56); g.lineTo(18, 34); g.closePath(); }, '#8a5a33');
    g.beginPath(); g.moveTo(18, 20); g.lineTo(34, 20); g.strokeStyle = '#6cc4ef'; g.lineWidth = 4; g.stroke();
    shape(g, () => { g.moveTo(12, 24); g.lineTo(4, 18); g.lineTo(6, 30); g.closePath(); }, '#ffffff', 2);
  },
};

const cache = {};
export function iconCanvas(id) {
  if (!cache[id] || cache[id].pending) {
    const { c, g } = mk();
    if (ITEMS[id]?.slot === 'head' || ITEMS[id]?.slot === 'face') { headgearIcon(g, id); c.pending = !headgearReady(id); }
    else (PAINT[ITEMS[id]?.icon || id] || PAINT.gel)(g);
    cache[id] = c;
  }
  return cache[id];
}

const urls = {};
export function iconURL(id) {
  if (urls[id]) return urls[id];
  const c = iconCanvas(id), u = c.toDataURL();
  if (!c.pending) urls[id] = u; // headgear art still loading: draw it again next time
  return u;
}

const texes = {};
export function iconTexture(id) {
  if (!texes[id]) {
    const t = new THREE.CanvasTexture(iconCanvas(id));
    t.colorSpace = THREE.SRGBColorSpace;
    texes[id] = t;
  }
  return texes[id];
}
