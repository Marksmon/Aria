// The moves shared by the job designs (bladers.js, mages.js, mknights.js): the walk cycle, the sword
// swing and the staff cast, and the light they leave. Each design paints its own body; these give
// the pose for a frame and draw the swinging arm and the effects. Plain canvas, no three.js.
import { ellipse, line } from './painted.js';

const flat = { outline: false, flat: true };
const rad = (d) => (d * Math.PI) / 180;

// the walk: 8 frames, the step (+1: the right leg ahead), and the body sinking a pixel on the long strides
export const WALK = [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7];
export const bobOf = (step) => (Math.abs(step) > 0.9 ? 1 : 0);
export const ATTACK = 7; // frames in an attack or cast, like the game's bodies

// the sword swing, frame by frame: [arm angle, blade angle] in degrees (0 = right, 90 = down). front:
// facing you, the sword arm on the viewer's left (mirrored for the back); side: facing right
export const SWING = {
  front: [[-150, -110], [-125, -85], [-40, -15], [25, 35], [55, 75], [80, 95], [90, 100]],
  side: [[-125, -150], [-105, -125], [-30, -15], [10, 25], [40, 65], [70, 95], [85, 100]],
};
export const SLASH = 3; // the frame the blade cuts, drawn with its arc
export const behind = (f) => f >= 2 && f <= 4; // seen from the back, the blade is in front of the body (hidden) on these
// the cast: the staff lifts, leans forward (side view) and the crystal bursts
export const CAST = { lift: [3, 7, 10, 5, 2, 1, 0], lean: [0, -1, -2, 3, 3, 1, 0], burst: [0, 0, 1, 3, 4, 2, 0] };

// an arm swinging a sword from the shoulder (x, y): the sleeve, the gloved hand, the blade with its
// guard and pommel. c: { sleeve, glove, blade, edge, guard, gem }
export function swordArm(F, x, y, armA, bladeA, c, len = 16, blade = 21) {
  const hx = x + Math.cos(rad(armA)) * len, hy = y + Math.sin(rad(armA)) * len;
  const ux = Math.cos(rad(bladeA)), uy = Math.sin(rad(bladeA)), tx = hx + ux * blade, ty = hy + uy * blade;
  F.part(line(hx + ux * 2, hy + uy * 2, tx, ty, 2), c.blade);
  F.part(line(hx + ux * 5, hy + uy * 5, tx, ty, 1), c.edge, flat);
  F.part(line(x, y, hx, hy, 4), c.sleeve);
  F.part(line(x + (hx - x) * 0.6, y + (hy - y) * 0.6, hx, hy, 4), c.glove);
  F.part(line(hx + ux * 2 - uy * 4, hy + uy * 2 + ux * 4, hx + ux * 2 + uy * 4, hy + uy * 2 - ux * 4, 2), c.guard); // the guard
  F.part(ellipse(hx - ux * 3, hy - uy * 3, 1.4, 1.4), c.guard); // the pommel
  if (c.gem) F.dot(hx + ux * 2, hy + uy * 2, c.gem);
  F.part(ellipse(hx, hy, 2.6, 2.6), c.glove);
  return [hx, hy, tx, ty];
}

// the arc a cut leaves: a crescent of light around (x, y) from angle a0 to a1
export function slashArc(F, x, y, r, a0, a1, col, col2) {
  const n = Math.ceil(Math.abs(a1 - a0) / 3);
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), w = Math.sin((Math.PI * i) / n) * 2.5; // thickest in the middle
    for (let k = 0; k <= w; k++) F.dot(x + Math.cos(a) * (r - k), y + Math.sin(a) * (r - k), k < 1 ? col : col2);
  }
}

// magic bursting from a crystal at (x, y): k = 0 (nothing) to 4 (full); c: { core, glow, spark }
export function burst(F, x, y, k, c) {
  if (!k) return;
  const ring = (r, col) => { for (let a = 0; a < 48; a++) F.dot(x + Math.cos((a / 48) * 2 * Math.PI) * r, y + Math.sin((a / 48) * 2 * Math.PI) * r, col); };
  F.part(ellipse(x, y, 1 + k * 0.8, 1 + k * 0.8), c.glow, flat);
  F.part(ellipse(x, y, 0.5 + k * 0.4, 0.5 + k * 0.4), c.core, flat);
  ring(3 + k * 2, c.glow);
  if (k > 2) ring(5 + k * 2, c.spark);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 2 * Math.PI + k * 0.4, r0 = 3 + k * 2.5;
    F.dot(x + Math.cos(a) * r0, y + Math.sin(a) * r0, c.spark);
    if (k > 1) F.dot(x + Math.cos(a) * (r0 + 2), y + Math.sin(a) * (r0 + 2), c.spark);
  }
}

// every direction's frames for one design: { dir: { idle: [canvas], walk: [8], attack: [7], bob: { anim: [rows] } } }.
// draw(view, cx, cy, pose) paints one frame (pose: { step, bob, atk }); cy is the chin, already sunk by
// the bob, so the head goes down with the body (bob gives how far, frame by frame)
export const REST = { step: 0, bob: 0, atk: -1 };
export function animFrames(views, heads, bw, draw) {
  const out = {};
  for (const [dir, [view, flip]] of Object.entries(views)) {
    const [x, , neck] = heads[dir];
    const cx = Math.round(flip ? bw - 1 - x : x); // a mirrored view is painted unmirrored, then flipped
    const one = (pose) => { const F = draw(view, cx, neck + pose.bob, pose); return (flip ? F.mirror() : F).toCanvas(); };
    const walk = WALK.map((step) => ({ step, bob: bobOf(step), atk: -1 }));
    const attack = [...Array(ATTACK)].map((_, atk) => ({ step: 0, bob: 0, atk }));
    out[dir] = { idle: [one(REST)], walk: walk.map(one), attack: attack.map(one), bob: { idle: [0], walk: walk.map((p) => p.bob), attack: attack.map(() => 0) } };
  }
  return out;
}
