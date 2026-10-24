// The player's head, Ragnarok style: a bald head with the standard face (eyes only, no mouth) and a
// hairstyle on top, each its own layer, drawn over the headless job body at its neck anchor
// (see pack-sprites.py "strip" and pack-heads.py). The hairstyle stays the same whatever the job;
// hair colour is a dye: the hair's shading mapped onto the dye's colours, like a palette swap.
import * as THREE from 'three';

const URL = import.meta.glob('./art/heads.png', { eager: true, import: 'default' })['./art/heads.png'];
// layout: { cw, ch, rows: { bald, messy, ... }, dirs: { down: { col, chin: [x, y], crown, w, eyes }, ... } }
export const HEADS = import.meta.glob('./art/heads.json', { eager: true, import: 'default' })['./art/heads.json'] || null;

// the picker's hairstyles (the straight 'long' row is packed too, kept for a female look later)
export const HAIRSTYLES = { messy: 'Tousled', mane: 'Long' };
export const hairstyles = () => Object.keys(HAIRSTYLES).filter((k) => HEADS?.rows?.[k] !== undefined);

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

// one cell of the heads sheet as a texture: row (bald or a hairstyle), direction, dye
const cache = {};
export function headTexture(row, dir, dyeId = 'brown') {
  if (!ready || HEADS.rows[row] === undefined || !HEADS.dirs[dir]) return null;
  const key = `${row}|${dir}|${dyeId}`;
  if (cache[key]) return cache[key];
  const { cw, ch } = HEADS, c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  g.drawImage(img, HEADS.dirs[dir].col * cw, HEADS.rows[row] * ch, cw, ch, 0, 0, cw, ch);
  const ramp = row !== 'bald' && DYES[dyeId]?.ramp;
  if (ramp) g.putImageData(dye(g.getImageData(0, 0, cw, ch), ramp), 0, 0);
  const t = new THREE.CanvasTexture(c);
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
      c.width = HEADS.cw; c.height = HEADS.ch;
      const t = c.getContext('2d');
      t.drawImage(img, 0, 0);
      cut.forEach((row, x) => { if (row > 0) t.clearRect(x, 0, 1, row); });
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
  if (hair) g.drawImage(hair.image, ox, oy, HEADS.cw * k, HEADS.ch * k);
  return c.toDataURL();
}
