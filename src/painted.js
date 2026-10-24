// Hand-drawn monsters: kobolds and goblins painted pixel by pixel in code (until they get PixelLab
// art). Each frame is built from body parts back to front; every part is filled, shaded (light on
// its top-left edge, dark on its bottom-right) and outlined on its own, so parts read clearly over
// each other, like Ragnarok's sprites. Frames: 4 directions (down, up, right; left is right
// mirrored) x idle (1), walk (4) and attack (4). Plain canvas, no three.js: sprites.js turns the
// frames into a sprite set the monsters use like any PixelLab sheet.

export const FW = 44, FH = 48;  // frame size in pixels
const GROUND = 45;              // the row the feet stand on
const OUT = '#23170f';

// ---------- colours ----------
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (c, to, k) => { const a = hex(c), b = hex(to); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; };
const light = (c) => mix(c, '#ffffff', 0.28);
const dark = (c) => mix(c, '#000000', 0.32);

// ---------- a frame: a grid of colours ----------
class Frame {
  constructor(w = FW, h = FH) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); }
  // draw one part: shape(set) marks its pixels; it is shaded and outlined, then laid over what's there
  part(shape, col, { outline = true, flat = false } = {}) {
    const FW = this.w, FH = this.h;
    const m = new Uint8Array(FW * FH);
    const set = (x, y) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < FW && y < FH) m[y * FW + x] = 1; };
    shape(set);
    const at = (x, y) => x >= 0 && y >= 0 && x < FW && y < FH && m[y * FW + x];
    const lt = light(col), dk = dark(col);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      if (!m[y * FW + x]) continue;
      let c = col;
      if (!flat) {
        if (!at(x + 1, y) || !at(x, y + 1)) c = dk;
        else if (!at(x - 1, y) || !at(x, y - 1)) c = lt;
      }
      this.px[y * FW + x] = c;
    }
    if (outline) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      if (m[y * FW + x]) continue;
      if (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1)) this.px[y * FW + x] = OUT;
    }
  }
  dot(x, y, c) { const FW = this.w; x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < FW && y < this.h) this.px[y * FW + x] = c; }
  mirror() { const FW = this.w, FH = this.h, f = new Frame(FW, FH); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) f.px[y * FW + x] = this.px[y * FW + (FW - 1 - x)]; return f; }
  toCanvas() {
    const FW = this.w, FH = this.h;
    const c = document.createElement('canvas');
    c.width = FW; c.height = FH;
    const g = c.getContext('2d');
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const v = this.px[y * FW + x];
      if (v) { g.fillStyle = v; g.fillRect(x, y, 1, 1); }
    }
    return c;
  }
}

// ---------- shapes ----------
const ellipse = (cx, cy, rx, ry) => (set) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    if (((x - cx) / (rx + 0.35)) ** 2 + ((y - cy) / (ry + 0.35)) ** 2 <= 1) set(x, y);
  }
};
const rect = (x0, y0, x1, y1) => (set) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y); };
const poly = (pts) => (set) => {
  const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) set(x, y);
  }
};
const line = (x0, y0, x1, y1, w = 1) => (set) => {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
    for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) set(x - (w - 1) / 2 + a, y - (w - 1) / 2 + b);
  }
};
const both = (...shapes) => (set) => shapes.forEach((s) => s(set));

// ---------- the monsters ----------
// race: kobold (dog-headed, furry, a tail) or goblin (green, long ears, big nose)
// kind: warrior (melee weapon), archer (bow), assassin (twin daggers, crouched, quick)
export const PAINTED = {
  koboldWarrior: { race: 'kobold', kind: 'warrior', fur: '#9a6a3c', muzzle: '#e6cfa2', cloth: '#7a4a2a', strap: '#5a3a22', metal: '#b8bcc4', wood: '#8a5a32', shield: '#a0703c', eye: '#f2c040' },
  koboldArcher: { race: 'kobold', kind: 'archer', fur: '#b88a52', muzzle: '#f0dcb4', cloth: '#4f6e3a', strap: '#6b4a2a', hood: '#5f7f44', wood: '#7a4a24', metal: '#c8ccd2', eye: '#f2c040' },
  koboldAssassin: { race: 'kobold', kind: 'assassin', fur: '#6e6878', muzzle: '#b8b0c0', cloth: '#3a2f4a', strap: '#2a2234', hood: '#2e2640', scarf: '#7a2a3a', metal: '#d8dce4', wood: '#3a2a22', eye: '#ff5a4a' },
  goblinWarrior: { race: 'goblin', kind: 'warrior', skin: '#6aa84f', cloth: '#7a5232', strap: '#4e3420', mask: '#b48a5a', wood: '#7a5232', metal: '#a8acb4', eye: '#ffd23a' },
  goblinArcher: { race: 'goblin', kind: 'archer', skin: '#7cb85a', cloth: '#4a6a8a', strap: '#5a3a22', cap: '#8a3a2a', feather: '#e8e0c8', wood: '#7a4a24', metal: '#c8ccd2', eye: '#ffd23a' },
  goblinAssassin: { race: 'goblin', kind: 'assassin', skin: '#5a9446', cloth: '#2a2a32', strap: '#1e1e26', mask: '#1c1c22', sash: '#a8323a', metal: '#dcdfe6', wood: '#3a2a22', eye: '#ff6a3a' },
  // the MVPs: bigger frames (KW x KH), a crown, a cape and a two-handed weapon
  koboldKing: { race: 'kobold', king: true, fur: '#8a5a32', muzzle: '#e6cfa2', collar: '#f2ece0', cape: '#b02a2a', metal: '#9aa0aa', gold: '#f2c040', wood: '#4a2e1a', boot: '#4a3020', strap: '#4a3020', eye: '#ffd23a' },
  goblinKing: { race: 'goblin', king: true, skin: '#5f9a45', collar: '#4a3a30', cape: '#6a3a8a', cloth: '#6a4a2a', bone: '#efe6cc', metal: '#b4b8c0', wood: '#5a3a22', boot: '#3a2a1e', strap: '#3a2a1e', eye: '#ff5a2a' },
};
export const KW = 64, KH = 68;  // a king's frame
export const frameSize = (id) => (PAINTED[id].king ? [KW, KH] : [FW, FH]);

// one frame. dir: down | up | right | left; anim: idle | walk | attack; f: frame index
export function paintFrame(id, dir, anim, f) {
  if (dir === 'left') return paintFrame(id, 'right', anim, f).mirror();
  if (PAINTED[id].king) return paintKing(id, dir, anim, f);
  const P = PAINTED[id], gob = P.race === 'goblin', kind = P.kind;
  const F = new Frame();
  const skin = gob ? P.skin : P.fur;
  const crouch = kind === 'assassin' ? 2 : 0;
  // walk: legs swing, the body bobs on the passing frames
  const step = anim === 'walk' ? [1, 0, -1, 0][f] : 0;
  const bob = (anim === 'walk' && (f === 1 || f === 3) ? -1 : 0) + crouch;
  // attack: 0 wind-up, 1 strike, 2 follow-through, 3 recover
  const atk = anim === 'attack' ? f : -1;
  const lunge = kind === 'assassin' && (atk === 1 || atk === 2) ? 2 : 0;
  const top = GROUND - 30 + bob; // head top

  const side = dir === 'right', back = dir === 'up';
  const cx = 22 + (side ? lunge : 0);
  const hy = top + 8;          // head centre: the head overlaps the top of the body (no neck, chibi)
  const by = top + 14;         // body top
  const legTop = top + 24;

  // ---- tail (kobolds), behind everything but in front in the back view ----
  const tail = () => {
    if (gob) return;
    if (side) F.part(poly([[cx - 5, by + 6], [cx - 11, by + 2 + step], [cx - 12, by + 6 + step], [cx - 6, by + 9]]), P.fur);
    else if (back) F.part(poly([[cx - 2, by + 6], [cx + 2, by + 6], [cx + 3, by + 13], [cx, by + 15], [cx - 3, by + 13]]), P.fur);
  };
  if (!back) tail();

  // ---- legs ----
  if (side) {
    const fx = 2 * step, bx = -2 * step;
    F.part(both(rect(cx - 3 + bx, legTop, cx - 1 + bx, GROUND - 1), rect(cx - 3 + bx, GROUND - 1, cx + bx, GROUND)), dark(skin));
    F.part(both(rect(cx + fx, legTop, cx + 2 + fx, GROUND - 1), rect(cx + fx, GROUND - 1, cx + 3 + fx, GROUND)), skin);
  } else {
    const lu = step > 0 ? 2 : 0, ru = step < 0 ? 2 : 0;
    F.part(both(rect(cx - 5, legTop, cx - 3, GROUND - 1 - lu), rect(cx - 6, GROUND - 1 - lu, cx - 3, GROUND - lu)), skin);
    F.part(both(rect(cx + 3, legTop, cx + 5, GROUND - 1 - ru), rect(cx + 3, GROUND - 1 - ru, cx + 6, GROUND - ru)), skin);
  }

  // ---- far arm and what it holds (behind the body) ----
  const handY = by + 9;
  const weapon = (hx, hy, ang, near) => drawWeapon(F, P, kind, hx, hy, ang, near, atk, dir);
  if (side) {
    // the far arm: the shield (warrior) or the second dagger (assassin), the bow hand (archer)
    const fax = cx + 1 + (atk >= 0 && kind !== 'warrior' ? 3 : 0);
    F.part(line(cx - 1, by + 2, fax + 2, handY - 1, 2), dark(skin));
    if (kind === 'warrior' && !gob) F.part(ellipse(cx + 1, by + 6, 3, 5), P.shield);
    if (kind === 'assassin') weapon(fax + 2, handY - 1, atk === 1 || atk === 2 ? 0.1 : -0.6, false);
  }

  // ---- body ----
  const bw = side ? 5 : 7;
  F.part(poly([[cx - bw, by + 1], [cx + bw, by + 1], [cx + bw + 1, legTop + 1], [cx - bw - 1, legTop + 1]]), P.cloth);
  // belt and straps
  F.part(rect(cx - bw - 1, legTop - 2, cx + bw + 1, legTop - 1), P.strap, { flat: true, outline: false });
  if (!side) F.part(line(cx - bw + 1, by + 1, cx + bw - 1, legTop - 3, 1), P.strap, { flat: true, outline: false });
  if (kind === 'archer') { // the quiver on the back
    const qx = back ? cx + 3 : side ? cx - 6 : cx + 6;
    if (back || side) F.part(both(rect(qx - 1, by - 3, qx + 1, by + 7)), P.strap);
    if (back || side) for (let i = -1; i <= 1; i++) F.dot(qx + i, by - 4, P.feather || '#e8e0c8');
  }
  if (gob && kind === 'assassin') F.part(rect(cx - bw, legTop - 4, cx + bw, legTop - 3), P.sash, { flat: true, outline: false });
  if (back) tail();

  // ---- head ----
  if (gob) paintGoblinHead(F, P, kind, cx, hy, dir, atk);
  else paintKoboldHead(F, P, kind, cx, hy, dir, atk);

  // ---- near arm and weapon ----
  if (side) {
    // weapon hand: swings with the attack
    const swing = { warrior: [-2.2, 0.6, 1.1, -0.4], assassin: [-0.9, 0.15, 0.3, -0.4], archer: [0, 0, 0, 0] }[kind];
    const ang = atk >= 0 ? swing[atk] : kind === 'warrior' ? -0.5 : kind === 'assassin' ? -0.4 : 0;
    const hx = cx + 3 + (kind === 'archer' && atk >= 0 ? (atk === 1 ? -3 : atk === 2 ? -2 : 1) : 0) + (atk === 1 && kind === 'warrior' ? 2 : 0);
    const hy2 = handY - (atk === 0 && kind === 'warrior' ? 6 : 0);
    if (kind === 'archer') weapon(cx + 7, handY - 2, 0, true); // the bow, held out in front
    F.part(line(cx, by + 2, hx, hy2, 2), skin);
    if (kind !== 'archer') weapon(hx, hy2, ang, true);
    else if (atk === 1 || atk === 2) F.part(line(hx, hy2 - 1, cx + 13, handY - 2, 1), '#d8c8a0', { outline: false, flat: true }); // the arrow, nocked
  } else {
    // front and back: arms at the sides; the weapon in the right hand (screen left from the front)
    const wx = back ? cx + bw + 2 : cx - bw - 2, ox = back ? cx - bw - 2 : cx + bw + 2;
    const raise = atk === 0 ? -7 : atk === 1 ? 2 : 0;
    F.part(line(back ? cx + bw - 1 : cx - bw + 1, by + 2, wx, handY + raise, 2), skin);
    F.part(line(back ? cx - bw + 1 : cx + bw - 1, by + 2, ox, handY, 2), skin);
    if (kind === 'warrior') {
      const ang = atk === 0 ? -2.4 : atk === 1 ? 0.9 : atk === 2 ? 1.4 : -0.6;
      if (!gob && !back) F.part(ellipse(ox + 1, handY - 1, 3.5, 4.5), P.shield); // the shield on the off arm
      weapon(wx, handY + raise, back ? Math.PI - ang : ang, !back);
      if (!gob && back) F.part(ellipse(ox - 1, handY - 1, 3.5, 4.5), dark(P.shield));
    } else if (kind === 'assassin') {
      const a = atk === 1 || atk === 2 ? 0.6 : -0.3;
      weapon(wx, handY + raise, back ? Math.PI - a : a, !back);
      weapon(ox, handY + (atk === 1 ? 2 : 0), back ? -a : Math.PI - a, !back);
    } else { // archer: the bow at the side, raised in front to shoot
      if (atk === 1 || atk === 2) { F.part(line(cx - 6, by + 4, cx + 6, by + 4, 1), P.wood); F.dot(cx, by + 6, '#d8c8a0'); }
      else weapon(back ? ox : wx, handY, 0, !back);
    }
  }
  return F;
}

// a weapon in the hand at (hx, hy), pointing at angle ang (0 = forward/right, negative = up)
function drawWeapon(F, P, kind, hx, hy, ang, near, atk, dir) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const at = (d) => [hx + c * d, hy + s * d];
  const col = (x) => (near ? x : dark(x));
  if (kind === 'warrior') {
    const [x1, y1] = at(-3), [x2, y2] = at(11);
    if (P.race === 'kobold') { // an axe: wooden haft, iron head
      F.part(line(x1, y1, x2, y2, 1), col(P.wood));
      const [ax, ay] = at(9);
      F.part(poly([[ax - s * 1, ay + c * 1], [ax + c * 3 - s * 5, ay + s * 3 + c * 5], [ax + c * -2 - s * 5, ay + s * -2 + c * 5]]), col(P.metal));
    } else { // a club: thick, studded
      F.part(line(x1, y1, x2, y2, 2), col(P.wood));
      const [ax, ay] = at(10);
      F.part(ellipse(ax, ay, 2.6, 2.6), col(P.wood));
      F.dot(ax - 2, ay - 2, P.metal); F.dot(ax + 2, ay - 1, P.metal); F.dot(ax, ay + 2, P.metal);
    }
  } else if (kind === 'assassin') {
    const [x1, y1] = at(-1), [x2, y2] = at(7);
    F.part(line(x1, y1, hx, hy, 1), col(P.wood));
    F.part(line(hx + c, hy + s, x2, y2, 1), col(P.metal));
    if (P.race === 'goblin') { const [x3, y3] = at(8); F.dot(x3 - s, y3 + c, col(P.metal)); } // curved tip
  } else { // archer: a short bow, held upright
    const bh = 8;
    F.part(both(line(hx, hy - bh, hx + 2, hy - bh / 2, 1), line(hx + 2, hy - bh / 2, hx + 2, hy + bh / 2, 1), line(hx + 2, hy + bh / 2, hx, hy + bh, 1)), col(P.wood));
    F.part(line(hx, hy - bh, hx - (atk === 1 ? 3 : 0), hy, 1), '#e8e0d0', { outline: false, flat: true });
    F.part(line(hx - (atk === 1 ? 3 : 0), hy, hx, hy + bh, 1), '#e8e0d0', { outline: false, flat: true });
  }
}

function paintKoboldHead(F, P, kind, cx, hy, dir, atk) {
  const side = dir === 'right', back = dir === 'up';
  const hooded = kind === 'archer' || kind === 'assassin';
  // ears (behind the head from the front, on top from the side)
  const earCol = P.fur;
  if (!hooded) {
    if (side) F.part(poly([[cx - 3, hy - 5], [cx - 1, hy - 12], [cx + 2, hy - 5]]), earCol);
    else { F.part(poly([[cx - 7, hy - 3], [cx - 7, hy - 12], [cx - 2, hy - 6]]), earCol); F.part(poly([[cx + 7, hy - 3], [cx + 7, hy - 12], [cx + 2, hy - 6]]), earCol); }
  }
  F.part(ellipse(cx + (side ? -1 : 0), hy, side ? 6.5 : 7.5, 7), P.fur);
  if (hooded) { // a hood with the ears poking through
    const hc = P.hood;
    if (side) { F.part(poly([[cx - 8, hy + 4], [cx - 7, hy - 7], [cx - 1, hy - 9], [cx + 4, hy - 6], [cx + 2, hy - 2], [cx - 3, hy + 1], [cx - 5, hy + 6]]), hc); F.part(poly([[cx - 2, hy - 7], [cx, hy - 13], [cx + 2, hy - 7]]), P.fur); }
    else if (back) F.part(ellipse(cx, hy - 1, 8, 7.5), hc);
    else { F.part(poly([[cx - 8, hy + 3], [cx - 8, hy - 4], [cx - 4, hy - 8], [cx + 4, hy - 8], [cx + 8, hy - 4], [cx + 8, hy + 3], [cx + 5, hy - 2], [cx - 5, hy - 2]]), hc); F.part(poly([[cx - 6, hy - 6], [cx - 6, hy - 13], [cx - 3, hy - 8]]), P.fur); F.part(poly([[cx + 6, hy - 6], [cx + 6, hy - 13], [cx + 3, hy - 8]]), P.fur); }
  }
  if (back) return;
  // the muzzle and nose; eyes
  if (side) {
    F.part(poly([[cx + 2, hy - 1], [cx + 9, hy], [cx + 9, hy + 4], [cx + 2, hy + 5]]), P.muzzle);
    F.part(rect(cx + 8, hy - 1, cx + 9, hy + 1), '#1e1410', { outline: false, flat: true });
    F.dot(cx + 6, hy + 3, '#5a2a22');
    F.dot(cx + 1, hy - 3, P.eye); F.dot(cx + 2, hy - 3, '#140c08');
  } else {
    F.part(ellipse(cx, hy + 3, 3.5, 2.6), P.muzzle);
    F.part(rect(cx - 1, hy + 1, cx + 1, hy + 2), '#1e1410', { outline: false, flat: true });
    for (const s of [-1, 1]) { F.dot(cx + s * 3, hy - 2, P.eye); F.dot(cx + s * 3 + (s < 0 ? 1 : -1), hy - 2, '#140c08'); }
  }
  if (kind === 'assassin') { // a red scarf over the muzzle
    if (side) F.part(poly([[cx - 4, hy + 2], [cx + 9, hy + 1], [cx + 9, hy + 5], [cx - 4, hy + 6]]), P.scarf);
    else F.part(rect(cx - 5, hy + 2, cx + 5, hy + 5), P.scarf);
  }
  void atk;
}

function paintGoblinHead(F, P, kind, cx, hy, dir, atk) {
  const side = dir === 'right', back = dir === 'up';
  // long ears, pointing out and up
  if (side) F.part(poly([[cx - 4, hy - 2], [cx - 12, hy - 6], [cx - 4, hy + 2]]), P.skin);
  else { F.part(poly([[cx - 6, hy - 2], [cx - 15, hy - 6], [cx - 6, hy + 2]]), P.skin); F.part(poly([[cx + 6, hy - 2], [cx + 15, hy - 6], [cx + 6, hy + 2]]), P.skin); }
  F.part(ellipse(cx + (side ? 0 : 0), hy, side ? 6 : 7, 6.5), P.skin);
  if (kind === 'archer') { // a pointed cap with a feather
    if (side) { F.part(poly([[cx - 7, hy - 2], [cx - 5, hy - 8], [cx + 1, hy - 10], [cx + 6, hy - 4]]), P.cap); F.part(line(cx - 6, hy - 6, cx - 10, hy - 12, 1), P.feather); }
    else { F.part(poly([[cx - 7, hy - 2], [cx - 4, hy - 8], [cx + 1, hy - 11], [cx + 7, hy - 2]]), P.cap); F.part(line(cx + 4, hy - 6, cx + 8, hy - 13, 1), P.feather); }
  }
  if (back) {
    if (kind === 'assassin') F.part(both(rect(cx - 6, hy - 1, cx + 6, hy + 1)), P.mask, { flat: true }); // the mask's ties
    return;
  }
  // a big nose, small eyes, a toothy grin
  if (side) {
    F.part(poly([[cx + 4, hy - 1], [cx + 9, hy + 2], [cx + 4, hy + 3]]), P.skin);
    F.dot(cx + 2, hy - 2, P.eye); F.dot(cx + 3, hy - 2, '#140c08');
    F.part(rect(cx + 1, hy + 4, cx + 4, hy + 4), '#2a1610', { outline: false, flat: true }); F.dot(cx + 3, hy + 4, '#f0e8d0');
  } else {
    F.part(ellipse(cx, hy + 1, 2, 2.5), P.skin);
    for (const s of [-1, 1]) { F.dot(cx + s * 3, hy - 2, P.eye); F.dot(cx + s * 3 + (s < 0 ? 1 : -1), hy - 2, '#140c08'); }
    F.part(rect(cx - 3, hy + 4, cx + 3, hy + 4), '#2a1610', { outline: false, flat: true });
    F.dot(cx - 2, hy + 4, '#f0e8d0'); F.dot(cx + 2, hy + 4, '#f0e8d0');
  }
  // masks: a cracked wooden one (warrior), a black cloth one over the face (assassin)
  if (kind === 'warrior') { // a carved wooden mask over the face: eye holes, a crack, painted fangs
    if (side) F.part(ellipse(cx + 3, hy - 1, 3.5, 4), P.mask);
    else F.part(ellipse(cx, hy - 1, 5.5, 4.5), P.mask);
    if (side) { F.dot(cx + 4, hy - 2, '#140c08'); F.dot(cx + 5, hy - 2, '#140c08'); F.dot(cx + 4, hy + 2, '#f0e8d0'); }
    else {
      for (const s of [-1, 1]) { F.dot(cx + s * 2, hy - 2, '#140c08'); F.dot(cx + s * 3, hy - 2, '#140c08'); F.dot(cx + s * 2, hy + 2, '#f0e8d0'); }
      F.dot(cx + 1, hy - 5, '#5a3a22'); F.dot(cx, hy - 4, '#5a3a22'); F.dot(cx + 1, hy - 3, '#5a3a22');
    }
  }
  if (kind === 'assassin') { // a black cloth over nose and mouth, and a black headband: only the eyes show
    if (side) { F.part(poly([[cx - 4, hy], [cx + 9, hy], [cx + 7, hy + 6], [cx - 4, hy + 6]]), P.mask); F.part(rect(cx - 6, hy - 5, cx + 5, hy - 4), P.mask); }
    else { F.part(poly([[cx - 7, hy], [cx + 7, hy], [cx + 6, hy + 6], [cx - 6, hy + 6]]), P.mask); F.part(rect(cx - 7, hy - 5, cx + 7, hy - 4), P.mask); }
    if (side) { F.dot(cx + 2, hy - 2, P.eye); F.dot(cx + 3, hy - 2, '#140c08'); }
    else for (const s of [-1, 1]) { F.dot(cx + s * 3, hy - 2, P.eye); F.dot(cx + s * 3 + (s < 0 ? 1 : -1), hy - 2, '#140c08'); }
  }
  void atk;
}

// ---------- the kings (MVPs) ----------
// Built like the others but half again as big: a heavy body, a fur collar and shoulder plates, a cape
// (behind them from the front and side, over the back from behind), a crown, and a two-handed
// weapon (the Kobold King's great hammer, the Goblin King's cleaver) that comes down in a slam.
const KG = 65; // the ground row in a king's frame
// a box along a direction: u from u0 to u1 along (c, s), v from v0 to v1 across it
const obox = (ax, ay, c, s, u0, u1, v0, v1) => poly([[ax + c * u0 - s * v0, ay + s * u0 + c * v0], [ax + c * u1 - s * v0, ay + s * u1 + c * v0], [ax + c * u1 - s * v1, ay + s * u1 + c * v1], [ax + c * u0 - s * v1, ay + s * u0 + c * v1]]);

function paintKing(id, dir, anim, f) {
  const P = PAINTED[id], gob = P.race === 'goblin', skin = gob ? P.skin : P.fur;
  const F = new Frame(KW, KH);
  const step = anim === 'walk' ? [1, 0, -1, 0][f] : 0;
  const bob = anim === 'walk' && (f === 1 || f === 3) ? -1 : 0;
  const atk = anim === 'attack' ? f : -1;
  const sink = atk === 2 ? 2 : atk === 1 ? 1 : 0; // he drops his weight into the slam
  const top = KG - 46 + bob + sink;
  const side = dir === 'right', back = dir === 'up';
  const cx = side ? 28 : 32;
  const hy = top + 11, by = top + 19, legTop = top + 36;
  const shoulderY = by + 3, handY = by + 13;
  const weapon = (hx, hy2, ang, near) => kingWeapon(F, P, hx, hy2, ang, near);

  if (side) {
    // the cape trails behind and flaps as he walks
    const flap = anim === 'walk' ? [1, 2, 1, 0][f] : atk >= 0 ? 2 : 0;
    F.part(poly([[cx - 2, by], [cx - 8, by + 2], [cx - 14 - flap, KG - 3 + Math.min(0, -sink)], [cx - 9 - flap, KG - 1], [cx - 2, legTop]]), P.cape);
    // legs: the far one darker
    const fx = 3 * step, bx = -3 * step;
    F.part(both(rect(cx - 4 + bx, legTop, cx - 1 + bx, KG - 2), rect(cx - 5 + bx, KG - 2, cx + 1 + bx, KG)), dark(skin));
    F.part(rect(cx - 5 + bx, KG - 3, cx + 1 + bx, KG), dark(P.boot));
    F.part(rect(cx + 1 + fx, legTop, cx + 4 + fx, KG - 2), skin);
    F.part(rect(cx + fx, KG - 3, cx + 6 + fx, KG), P.boot);
    // the far arm reaches for the haft
    const swing = [-2.3, 0.4, 1.15, -0.6][atk] ?? -1.35;
    const hx = cx + 6 + (atk === 1 ? 3 : atk === 2 ? 4 : 0), hy2 = atk === 0 ? by - 2 : atk === 1 ? by + 6 : handY;
    F.part(line(cx - 1, shoulderY, hx - 1, hy2 + 1, 3), dark(skin));
    // body
    F.part(poly([[cx - 7, by + 1], [cx + 6, by + 1], [cx + 8, legTop + 1], [cx - 8, legTop + 1]]), gob ? P.cloth : P.metal);
    if (gob) F.part(ellipse(cx + 4, by + 10, 5, 7.5), skin); // the belly
    else { F.part(rect(cx - 7, by + 6, cx + 7, by + 7), P.gold, { flat: true, outline: false }); F.part(poly([[cx + 1, legTop], [cx + 6, legTop], [cx + 5, legTop + 8], [cx + 1, legTop + 8]]), P.cape); }
    F.part(rect(cx - 8, legTop - 3, cx + 8, legTop - 1), P.strap, { flat: true });
    F.part(rect(cx + 4, legTop - 3, cx + 6, legTop - 1), gob ? P.bone : P.gold, { flat: true, outline: false });
    // collar and the near shoulder plate
    F.part(ellipse(cx - 1, by + 1, 8, 3), P.collar);
    paintKingHead(F, P, cx, hy, dir);
    F.part(ellipse(cx, shoulderY + 1, 4.5, 4), gob ? P.bone : P.metal);
    if (gob) F.part(poly([[cx - 1, shoulderY - 2], [cx + 1, shoulderY - 8], [cx + 2, shoulderY - 2]]), P.bone);
    else F.part(rect(cx - 4, shoulderY + 3, cx + 4, shoulderY + 3), P.gold, { flat: true, outline: false });
    // the weapon, then the near arm over its haft
    weapon(hx, hy2, swing, true);
    F.part(line(cx + 1, shoulderY + 1, hx, hy2, 3), skin);
    return F;
  }

  // ---- front and back ----
  const lu = step > 0 ? 2 : 0, ru = step < 0 ? 2 : 0;
  const sway = anim === 'walk' ? step : 0;
  // the weapon: held in both hands at screen left (front) or right (back), raised overhead to slam
  const ang = [-2.0, 0.55, 1.25, -1.5][atk] ?? -1.85;
  const wx = back ? cx + 13 : cx - 13;
  const wy = atk === 0 ? by - 4 : atk === 1 ? by + 7 : atk === 2 ? handY + 2 : handY;
  const wang = back ? Math.PI - ang : ang;
  if (!back) F.part(poly([[cx - 10, by + 1], [cx + 10, by + 1], [cx + 15 + sway, KG - 2], [cx - 15 + sway, KG - 2]]), dark(P.cape)); // the cape's lining
  // legs and boots
  F.part(rect(cx - 8, legTop, cx - 4, KG - 2 - lu), skin);
  F.part(rect(cx - 9, KG - 3 - lu, cx - 3, KG - lu), P.boot);
  F.part(rect(cx + 4, legTop, cx + 8, KG - 2 - ru), skin);
  F.part(rect(cx + 3, KG - 3 - ru, cx + 9, KG - ru), P.boot);
  // body
  F.part(poly([[cx - 10, by + 1], [cx + 10, by + 1], [cx + 12, legTop + 1], [cx - 12, legTop + 1]]), gob ? P.cloth : P.metal);
  if (!back) {
    if (gob) F.part(ellipse(cx, by + 11, 7, 8), skin); // the belly between the vest's edges
    else { // a breastplate: gold trim down the middle and across
      F.part(rect(cx - 1, by + 3, cx + 1, legTop - 4), P.gold, { flat: true, outline: false });
      F.part(rect(cx - 9, by + 8, cx + 9, by + 8), P.gold, { flat: true, outline: false });
      F.part(poly([[cx - 4, legTop], [cx + 4, legTop], [cx + 3, legTop + 8], [cx - 3, legTop + 8]]), P.cape); // the tabard
    }
  }
  F.part(rect(cx - 12, legTop - 3, cx + 12, legTop - 1), P.strap, { flat: true });
  if (!back) F.part(rect(cx - 2, legTop - 3, cx + 2, legTop - 1), gob ? P.bone : P.gold, { flat: true });
  if (gob && !back) for (let i = -3; i <= 3; i += 2) F.dot(cx + i * 2, by + 3 + Math.abs(i), P.bone); // a necklace of teeth
  // arms: the weapon in one hand, the other at his side; both on the haft to attack
  const armL = back ? cx + 10 : cx - 10, armR = back ? cx - 10 : cx + 10;
  const freeHand = atk >= 0 ? [wx + (back ? -4 : 4), wy + 2] : [back ? cx - 14 : cx + 14, handY];
  if (back) { // the cape covers the back, flaring to the ankles
    F.part(line(armL, shoulderY, wx, wy, 3), skin);
    F.part(line(armR, shoulderY, ...freeHand, 3), skin);
    F.part(poly([[cx - 11, by], [cx + 11, by], [cx + 15 + sway, KG - 3], [cx - 15 + sway, KG - 3]]), P.cape);
    for (const x of [-6, 0, 6]) F.part(line(cx + x * 0.7, by + 4, cx + x * 1.3 + sway, KG - 5, 1), dark(P.cape), { flat: true, outline: false }); // its folds
    weapon(wx, wy, wang, false); // held at his side, beside the cape
  }
  // collar and shoulder plates
  F.part(ellipse(cx, by + 1, 12, 3.5), P.collar);
  if (!gob) for (let i = -10; i <= 10; i += 5) F.dot(cx + i, by + 1, '#2a2226'); // ermine spots
  for (const sx of [-1, 1]) {
    F.part(ellipse(cx + sx * 12, shoulderY, 4, 3.5), gob ? P.bone : P.metal);
    if (gob) F.part(poly([[cx + sx * 11, shoulderY - 2], [cx + sx * 14, shoulderY - 9], [cx + sx * 14, shoulderY - 2]]), P.bone);
    else F.part(rect(cx + sx * 12 - 3, shoulderY + 3, cx + sx * 12 + 3, shoulderY + 3), P.gold, { flat: true, outline: false });
  }
  paintKingHead(F, P, cx, hy, dir);
  if (!back) {
    F.part(line(armR, shoulderY + 1, ...freeHand, 3), skin); // the other hand: at his side, or across to the haft
    weapon(wx, wy, wang, true);
    F.part(line(armL, shoulderY + 1, wx, wy, 3), skin);
  }
  return F;
}

// the great hammer (kobold) or cleaver (goblin), its grip at (hx, hy), pointing at ang
function kingWeapon(F, P, hx, hy, ang, near) {
  const c = Math.cos(ang), s = Math.sin(ang), col = (x) => (near ? x : dark(x));
  if (P.race === 'kobold') {
    F.part(line(hx - c * 5, hy - s * 5, hx + c * 17, hy + s * 17, 2), col(P.wood));
    F.part(obox(hx, hy, c, s, 15, 22, -5, 5), col(P.metal));      // the head
    F.part(obox(hx, hy, c, s, 17.5, 19.5, -5, 5), col(P.gold), { outline: false, flat: true }); // a gold band
  } else {
    F.part(line(hx - c * 4, hy - s * 4, hx + c * 6, hy + s * 6, 2), col(P.wood));
    F.part(obox(hx, hy, c, s, 6, 21, -1, 7), col(P.metal));       // the blade, wide on one side
    F.part(obox(hx, hy, c, s, 6, 21, -1, 0), col(dark(P.metal)), { outline: false, flat: true }); // its spine
    F.dot(hx + c * 18 - s * 2, hy + s * 18 + c * 2, '#23170f');   // a hole near the tip
  }
}

function paintKingHead(F, P, cx, hy, dir) {
  const side = dir === 'right', back = dir === 'up', gob = P.race === 'goblin';
  const skin = gob ? P.skin : P.fur, crown = gob ? P.bone : P.gold;
  // ears: tall and pointed (kobold), long and out to the sides (goblin)
  if (gob) {
    if (side) F.part(poly([[cx - 5, hy - 2], [cx - 17, hy - 8], [cx - 5, hy + 3]]), skin);
    else for (const sx of [-1, 1]) F.part(poly([[cx + sx * 8, hy - 2], [cx + sx * 21, hy - 8], [cx + sx * 8, hy + 3]]), skin);
  } else {
    if (side) F.part(poly([[cx - 8, hy - 4], [cx - 10, hy - 16], [cx - 3, hy - 8]]), skin);
    else for (const sx of [-1, 1]) F.part(poly([[cx + sx * 10, hy - 2], [cx + sx * 15, hy - 15], [cx + sx * 6, hy - 8]]), skin);
  }
  F.part(ellipse(cx + (side ? -1 : 0), hy, side ? 8.5 : 10, 9.5), skin);
  // the crown: a band and points; gems on gold, a little skull on bone
  const crownY = hy - 9;
  if (side) {
    F.part(rect(cx - 9, crownY - 1, cx + 5, crownY + 2), crown);
    for (const x of [-7, -3, 1, 4]) F.part(poly([[x + cx - 1.5, crownY - 1], [x + cx, crownY - (gob ? 7 : 5)], [x + cx + 1.5, crownY - 1]]), crown);
    if (!gob) F.dot(cx, crownY, '#d02a3a');
  } else {
    F.part(rect(cx - 9, crownY - 1, cx + 9, crownY + 2), crown);
    for (const x of [-8, -4, 0, 4, 8]) {
      const h = gob ? (x === 0 ? 0 : Math.abs(x) === 4 ? 8 : 6) : x === 0 ? 7 : 5;
      if (h) F.part(poly([[cx + x - 1.5, crownY - 1], [cx + x, crownY - 1 - h], [cx + x + 1.5, crownY - 1]]), crown);
    }
    if (!back) {
      if (gob) { F.part(ellipse(cx, crownY - 2, 2.5, 2.5), P.bone); F.dot(cx - 1, crownY - 2, '#23170f'); F.dot(cx + 1, crownY - 2, '#23170f'); }
      else { F.dot(cx, crownY, '#d02a3a'); F.dot(cx, crownY + 1, '#d02a3a'); F.dot(cx - 5, crownY + 1, '#3a7ad0'); F.dot(cx + 5, crownY + 1, '#3a7ad0'); }
    }
  }
  if (back) return;
  const eye = (x, y) => { F.dot(x, y, P.eye); F.dot(x + 1, y, P.eye); F.dot(x + (side ? 1 : x < cx ? 1 : 0), y, '#140c08'); };
  if (gob) {
    if (side) {
      F.part(poly([[cx + 5, hy - 1], [cx + 12, hy + 3], [cx + 5, hy + 4]]), skin); // the nose
      eye(cx + 2, hy - 3); F.dot(cx + 1, hy - 5, '#23170f'); F.dot(cx + 3, hy - 4, '#23170f');
      F.part(rect(cx + 1, hy + 6, cx + 6, hy + 6), '#2a1610', { outline: false, flat: true });
      F.dot(cx + 5, hy + 5, P.bone); F.dot(cx + 5, hy + 4, P.bone); // a tusk
    } else {
      F.part(ellipse(cx, hy + 2, 3, 3.5), skin);
      eye(cx - 5, hy - 2); eye(cx + 4, hy - 2);
      for (const sx of [-1, 1]) { F.dot(cx + sx * 6, hy - 4, '#23170f'); F.dot(cx + sx * 5, hy - 4, '#23170f'); F.dot(cx + sx * 4, hy - 3, '#23170f'); } // angry brows
      F.part(rect(cx - 6, hy + 6, cx + 6, hy + 6), '#2a1610', { outline: false, flat: true });
      for (const sx of [-1, 1]) { F.dot(cx + sx * 4, hy + 5, P.bone); F.dot(cx + sx * 4, hy + 4, P.bone); } // tusks
      F.dot(cx + 6, hy + 2, dark(skin)); F.dot(cx - 7, hy - 6 + 6, dark(skin)); // warts
    }
  } else {
    if (side) {
      F.part(poly([[cx + 3, hy - 1], [cx + 13, hy + 1], [cx + 13, hy + 6], [cx + 3, hy + 7]]), P.muzzle);
      F.part(rect(cx + 12, hy, cx + 13, hy + 2), '#1e1410', { outline: false, flat: true });
      F.part(rect(cx + 6, hy + 5, cx + 12, hy + 5), '#5a2a22', { outline: false, flat: true });
      F.dot(cx + 9, hy + 6, '#f0e8d0');
      eye(cx + 1, hy - 3); F.dot(cx, hy - 5, '#23170f'); F.dot(cx + 2, hy - 4, '#23170f');
    } else {
      F.part(ellipse(cx, hy + 4, 5.5, 3.5), P.muzzle);
      F.part(rect(cx - 2, hy + 1, cx + 2, hy + 2), '#1e1410', { outline: false, flat: true });
      F.part(rect(cx - 3, hy + 6, cx + 3, hy + 6), '#5a2a22', { outline: false, flat: true });
      F.dot(cx - 2, hy + 7, '#f0e8d0'); F.dot(cx + 2, hy + 7, '#f0e8d0'); // fangs
      eye(cx - 5, hy - 2); eye(cx + 4, hy - 2);
      for (const sx of [-1, 1]) { F.dot(cx + sx * 6, hy - 4, '#23170f'); F.dot(cx + sx * 5, hy - 4, '#23170f'); F.dot(cx + sx * 4, hy - 3, '#23170f'); }
    }
  }
}

// every frame of a monster: { down: { idle: [canvas], walk: [4], attack: [4] }, up, right, left }
export const ANIMS = { idle: 1, walk: 4, attack: 4 };
export function paintSet(id) {
  const out = {};
  for (const dir of ['down', 'up', 'right', 'left']) {
    out[dir] = {};
    for (const [anim, n] of Object.entries(ANIMS)) out[dir][anim] = Array.from({ length: n }, (_, f) => paintFrame(id, dir, anim, f).toCanvas());
  }
  return out;
}
