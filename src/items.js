// Items (materials, usables and equipment) and recipes, plus the painted icons used both on the ground and in menus.
import * as THREE from 'three';

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
  potion: { type: 'use', name: 'Healing Draught', desc: 'Restores 45–65 HP.', usable: true },

  // one-handed swords (Ragnarok rules, see rules.js)
  twig_sword:   { type: 'equip', slot: 'weapon', name: 'Twig Sword',  atk: 15, wlv: 1, icon: 'weapon0', desc: 'A stick with ambitions.' },
  stone_blade:  { type: 'equip', slot: 'weapon', name: 'Stone Blade', atk: 25, wlv: 1, icon: 'weapon1', desc: 'Ridge stone, knapped sharp.' },
  ember_edge:   { type: 'equip', slot: 'weapon', name: 'Ember Edge',  atk: 44, wlv: 2, icon: 'weapon2', desc: 'Warm to the touch, glowing at the edge.' },
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
export const SLOTS = { weapon: 'Weapon', armor: 'Armor', shoes: 'Shoes', light: 'Light', acc: 'Accessory' };

// one line on what a piece of equipment does
export function equipLine(it) {
  const p = [];
  if (it.atk) p.push(`ATK ${it.atk}`, `Weapon Lv ${it.wlv}`);
  if (it.def) p.push(`DEF ${it.def}`);
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
  { item: 'torch', cost: { glow: 3, leaf: 2 } },
  { item: 'swift_boots', cost: { shell: 4, dew: 3, leaf: 3 } },
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
  potion: (g) => {
    shape(g, () => g.roundRect(26, 8, 12, 12, 3), '#b07a4c', 3);
    shape(g, () => { g.moveTo(24, 20); g.lineTo(40, 20); g.lineTo(40, 26); g.quadraticCurveTo(54, 32, 52, 44); g.quadraticCurveTo(50, 56, 32, 56); g.quadraticCurveTo(14, 56, 12, 44); g.quadraticCurveTo(10, 32, 24, 26); g.closePath(); }, '#e2554a');
    gloss(g, 22, 38, 4, 6);
  },
  weapon0: (g) => swordIcon(g, '#c49a63', '#8a5a33', '#a07848'),
  weapon1: (g) => swordIcon(g, '#cfd6de', '#7a7f8a', '#9aa4b2'),
  weapon2: (g) => swordIcon(g, '#ffb35a', '#c8463c', '#ffe27a'),
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
  if (!cache[id]) {
    const { c, g } = mk();
    (PAINT[ITEMS[id]?.icon || id] || PAINT.gel)(g);
    cache[id] = c;
  }
  return cache[id];
}

const urls = {};
export function iconURL(id) {
  return (urls[id] ||= iconCanvas(id).toDataURL());
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
