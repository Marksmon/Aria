// The player's settings (the ⚙ window), kept on this phone for every hero: the target's health bar
// and the graphics. Sound keeps its own key (audio.js).
const KEY = 'aria.settings';
export const DEFAULTS = {
  targetBar: true,  // a thin health bar under the name of the monster you fight or picked
  graphics: 'sharp', // 'sharp': the screen's own sharpness (up to 1.5x); 'fast': 1x, for a quicker frame on a weak phone
};
export const GRAPHICS = { sharp: { name: 'Sharp', ratio: 1.5 }, fast: { name: 'Fast', ratio: 1 } };

function read() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    return d && typeof d === 'object' ? d : {};
  } catch {
    return {};
  }
}
const values = { ...DEFAULTS, ...read() };
if (!GRAPHICS[values.graphics]) values.graphics = DEFAULTS.graphics;
const listeners = [];

export const settings = {
  get: (k) => values[k],
  set(k, v) {
    values[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(values)); } catch { /* storage unavailable */ }
    for (const f of listeners) f(k, v);
  },
  onChange(f) { listeners.push(f); },
};

// the renderer's pixel ratio for the graphics setting, never over the screen's own
export const pixelRatio = (dpr = 1, graphics = values.graphics) => Math.min(dpr || 1, (GRAPHICS[graphics] || GRAPHICS.sharp).ratio);
