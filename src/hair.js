// The player's head, Ragnarok style: a bald head with the standard face (eyes only, no mouth) and a
// hairstyle on top, each its own layer, drawn over the headless job body at its neck anchor
// (see pack-sprites.py "strip" and pack-heads.py). The hairstyle stays the same whatever the job;
// hair colour is a dye: the hair's shading mapped onto the dye's colours, like a palette swap.
import * as THREE from 'three';
import { Frame, ellipse, poly, line, rect } from './painted.js';

const URL = import.meta.glob('./art/heads.png', { eager: true, import: 'default' })['./art/heads.png'];
// layout: { cw, ch, rows: { bald, messy, ... }, dirs: { down: { col, chin: [x, y], crown, w, eyes }, ... } }
export const HEADS = import.meta.glob('./art/heads.json', { eager: true, import: 'default' })['./art/heads.json'] || null;

// the picker's hairstyles: the packed rows of heads.png, and the ones made in code from them (MADE)
export const HAIRSTYLES = { messy: 'Tousled', mane: 'Long', long: 'Straight', pony: 'Ponytail' };
// each hairstyle is for one body only (the owner's call): the male styles for a male hero, the female ones for a female
export const HAIR_BODY = { messy: 'm', mane: 'm', long: 'f', pony: 'f' };
export const hairstyles = (body = null) => Object.keys(HAIRSTYLES).filter((k) => HEADS?.rows?.[MADE[k]?.from ?? k] !== undefined && (!body || HAIR_BODY[k] === body));

// dyes: shadow → highlight. 'brown' keeps the hair as drawn
export const DYES = {
  brown: { name: 'Chestnut', ramp: null, swatch: '#8a5a33' },
  black: { name: 'Raven', ramp: ['#141018', '#28222c', '#3e3644', '#625868'], swatch: '#2e2834' },
  blonde: { name: 'Golden', ramp: ['#5a3e18', '#9c7028', '#d8ac48', '#fbe89a'], swatch: '#d8ac48' },
  red: { name: 'Ember', ramp: ['#40100e', '#86221a', '#c8462a', '#f6885a'], swatch: '#c8462a' },
  blue: { name: 'Fjord', ramp: ['#0e1840', '#203c86', '#3a6ccc', '#8cbcf8'], swatch: '#3a6ccc' },
  green: { name: 'Moss', ramp: ['#0e2a16', '#22542a', '#46923a', '#9cdc76'], swatch: '#46923a' },
  purple: { name: 'Heather', ramp: ['#260e3a', '#4e2876', '#844cb8', '#cc9cf8'], swatch: '#844cb8' },
  silver: { name: 'Frost', ramp: ['#363a44', '#747a88', '#b4bcc8', '#f0f2f6'], swatch: '#b4bcc8' },
};

let img = null, ready = false;
if (URL && HEADS) {
  img = new Image();
  img.onload = () => { ready = true; };
  img.src = URL;
}
export const headsReady = () => ready;

const lerp = (a, b, k) => a + (b - a) * k;
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// a dyed copy of hair pixels: each pixel's brightness, stretched over the hair's own range, picks a
// colour along the dye's ramp; the darkest pixels (the outline) stay dark
function dye(data, ramp) {
  const cols = ramp.map(rgb), d = data.data;
  let lo = 255, hi = 0;
  const lum = (i) => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { const l = lum(i); if (l > 40) { lo = Math.min(lo, l); hi = Math.max(hi, l); } }
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] <= 128) continue;
    const l = lum(i);
    if (l <= 40) { d[i] = d[i] * 0.6 + cols[0][0] * 0.4; d[i + 1] = d[i + 1] * 0.6 + cols[0][1] * 0.4; d[i + 2] = d[i + 2] * 0.6 + cols[0][2] * 0.4; continue; }
    const t = Math.max(0, Math.min(1, (l - lo) / Math.max(1, hi - lo))) * (cols.length - 1);
    const a = cols[Math.floor(t)], b = cols[Math.min(cols.length - 1, Math.floor(t) + 1)], k = t - Math.floor(t);
    d[i] = lerp(a[0], b[0], k); d[i + 1] = lerp(a[1], b[1], k); d[i + 2] = lerp(a[2], b[2], k);
  }
  return data;
}

// ---------- the Ponytail, made in code from the Straight hair ----------
// The Straight hair's bangs and face-framing locks, cut at the chin (front) or the nape (side and
// back), and a ponytail tied high at the back of the crown. The tail hangs below the head's cell
// (TAIL more rows), down the back; from the front only the tied hair peeking over the crown shows.
// It is painted in the Straight hair's own browns (and outline), so the dyes colour it like the rest.
const TAIL = 20;
const HAIR = '#8e5a36', HAIR_DK = '#5a3420', HAIR_LT = '#c08a56', TIE = '#1c120e';
const VIEW = { down: 'front', downright: 'front', downleft: 'front', right: 'side', left: 'side', up: 'back', upright: 'back', upleft: 'back' };
function ponytail(base, dir) {
  const { cw, ch } = HEADS, h = ch + TAIL, view = VIEW[dir];
  const cx = HEADS.dirs[dir].chin[0];
  // the Straight hair, cut: below the cut row nothing, the cut row closed with the outline
  const cutAt = view === 'front' ? 35 : view === 'side' ? 30 : 31;
  const bg = base.getContext('2d'), d = bg.getImageData(0, 0, cw, ch);
  for (let y = cutAt - 1; y < ch; y++) for (let x = 0; x < cw; x++) {
    const i = (y * cw + x) * 4;
    if (y >= cutAt) d.data[i + 3] = 0;
    else if (d.data[i + 3] > 128) { d.data[i] = 2; d.data[i + 1] = 1; d.data[i + 2] = 1; }
  }
  bg.putImageData(d, 0, 0);
  const F = new Frame(cw, h), end = h - 2;
  if (view === 'front') {
    // the tied hair, peeking over the crown from behind (toward the back of the head on a turn)
    const bx = cx + (dir === 'downright' ? -3 : dir === 'downleft' ? 3 : 0);
    F.part(ellipse(bx, 6, 4.5, 3), HAIR);
    F.part(line(bx - 2, 7, bx + 2, 7, 1), HAIR_DK, { outline: false, flat: true });
  } else if (view === 'side') {
    // tied at the back of the crown, swinging down behind the neck; the left view is the right one turned
    const X = (dx) => (dir === 'left' ? cx - dx : cx + dx);
    F.part(poly([[X(-13), 7], [X(-8), 9], [X(-9), 14], [X(-12), 22], [X(-13), 34], [X(-14), 46], [X(-16), end - 2], [X(-18), end], [X(-19), 50], [X(-20), 38], [X(-19), 26], [X(-17), 15]]), HAIR);
    F.part(line(X(-14), 16, X(-17), end - 4, 1), HAIR_DK, { outline: false, flat: true });
    F.part(line(X(-12), 18, X(-14), 40, 1), HAIR_LT, { outline: false, flat: true });
    F.part(line(X(-13), 9, X(-9), 12, 2), TIE);
  } else {
    // down the middle of the back, a little to the far side on a turn
    const tx = cx + (dir === 'upright' ? -1 : dir === 'upleft' ? 1 : 0);
    F.part(poly([[tx - 3, 11], [tx + 3, 11], [tx + 5, 20], [tx + 5, 34], [tx + 3, 48], [tx, end], [tx - 3, 48], [tx - 5, 34], [tx - 5, 20]]), HAIR);
    F.part(line(tx - 1, 15, tx - 1, end - 6, 1), HAIR_DK, { outline: false, flat: true });
    F.part(line(tx + 2, 18, tx + 2, 44, 1), HAIR_LT, { outline: false, flat: true });
    F.part(rect(tx - 3, 10, tx + 3, 12), TIE);
  }
  const c = document.createElement('canvas');
  c.width = cw; c.height = h;
  const g = c.getContext('2d');
  if (view === 'front') { g.drawImage(F.toCanvas(), 0, 0); g.drawImage(base, 0, 0); } // the tuft behind the hair
  else { g.drawImage(base, 0, 0); g.drawImage(F.toCanvas(), 0, 0); c.keep = F.toCanvas(); } // the tail, kept under a hat
  return c;
}
// hairstyles made in code: { from: the packed row they start from, make(base, dir) -> canvas, whose
// keep (if any) marks the pixels a hat doesn't cut: a tail that comes out from under its brim }
const MADE = { pony: { from: 'long', make: ponytail } };

// one cell of the heads sheet as a texture: row (bald or a hairstyle), direction, dye. A hairstyle
// made in code (MADE) may be taller than the cell, hanging below it
const cache = {};
export function headTexture(row, dir, dyeId = 'brown') {
  const made = MADE[row], src = made?.from ?? row;
  if (!ready || HEADS.rows[src] === undefined || !HEADS.dirs[dir]) return null;
  const key = `${row}|${dir}|${dyeId}`;
  if (cache[key]) return cache[key];
  const { cw, ch } = HEADS;
  let c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  c.getContext('2d').drawImage(img, HEADS.dirs[dir].col * cw, HEADS.rows[src] * ch, cw, ch, 0, 0, cw, ch);
  if (made) c = made.make(c, dir);
  const g = c.getContext('2d');
  const ramp = row !== 'bald' && DYES[dyeId]?.ramp;
  if (ramp) g.putImageData(dye(g.getImageData(0, 0, c.width, c.height), ramp), 0, 0);
  let keep = null;
  if (c.keep) { // the kept pixels, cut from the dyed hair so their colours match
    keep = document.createElement('canvas');
    keep.width = c.width; keep.height = c.height;
    const k = keep.getContext('2d');
    k.drawImage(c, 0, 0);
    k.globalCompositeOperation = 'destination-in';
    k.drawImage(c.keep, 0, 0);
  }
  const t = new THREE.CanvasTexture(c);
  t.userData.keep = keep;
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return (cache[key] = t);
}

// paint a look's head and hair into a body frame (ctx), the head cell's top-left corner at at = [x, y]:
// one head pixel is one body pixel, so it sits on the body's pixel grid. A hat hides the hair it
// covers: cut gives, per column of the cell, the row above which the hair is left out (cutBy names
// the hat, for the cache)
const trimmed = {};
export function paintHead(g, at, dir, look, cut = null, cutBy = '') {
  const head = headTexture('bald', dir), hair = headTexture(look.hair, dir, look.dye);
  if (!head || !at) return;
  g.drawImage(head.image, at[0], at[1]);
  if (!hair) return;
  let img = hair.image;
  if (cut) {
    const key = `${look.hair}|${dir}|${look.dye}|${cutBy}`;
    if (!trimmed[key]) {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height; // a made hairstyle can hang below the cell
      const t = c.getContext('2d');
      t.drawImage(img, 0, 0);
      cut.forEach((row, x) => { if (row > 0) t.clearRect(x, 0, 1, row); });
      if (hair.userData.keep) t.drawImage(hair.userData.keep, 0, 0); // a ponytail comes out from under the brim
      trimmed[key] = c;
    }
    img = trimmed[key];
  }
  g.drawImage(img, at[0], at[1]);
}

// a small portrait of a look (for the character creator and the stylist): front view, scaled up
export function lookPortrait(look, size = 96) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const head = headTexture('bald', 'down'), hair = headTexture(look.hair, 'down', look.dye);
  if (!head) return c.toDataURL();
  const k = Math.floor(size / Math.max(HEADS.cw, HEADS.ch));
  const ox = (size - HEADS.cw * k) / 2, oy = (size - HEADS.ch * k) / 2;
  g.drawImage(head.image, ox, oy, HEADS.cw * k, HEADS.ch * k);
  if (hair) g.drawImage(hair.image, ox, oy, hair.image.width * k, hair.image.height * k); // a ponytail runs off the bottom
  return c.toDataURL();
}
