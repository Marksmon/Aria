// Veidheim's archers: a longbow and a quiver slung on the back, painted into a dressed person's
// frames (main.js dressPeople, for a dress spec with bow: true) on the body's pixel grid. From behind
// they are worn over the body; from the front and the side they hang behind it ('destination-over'
// paints under what is already there), so only the bow's ends, the feathers and the strap show.
const OUT = '#2e2118', WOOD = '#9a6230', WOOD_LT = '#d0a060', STRING = '#e8e0d0', QUIVER = '#6b4a2a', STRAP = '#4a3220';
const FEATHERS = ['#f4ecd8', '#c8463c', '#f4ecd8'];

// pixels along a curve from a to b, bulging out by `bow` (perpendicular, to the right of a->b)
function arc([ax, ay], [bx, by], bow) {
  const out = new Map(), len = Math.hypot(bx - ax, by - ay), nx = (by - ay) / len, ny = -(bx - ax) / len;
  for (let i = 0; i <= len * 3; i++) {
    const t = i / (len * 3), k = Math.sin(t * Math.PI) * bow;
    const x = Math.round(ax + (bx - ax) * t + nx * k), y = Math.round(ay + (by - ay) * t + ny * k);
    out.set(`${x},${y}`, [x, y]);
  }
  return [...out.values()];
}
const outlineOf = (px) => {
  const has = new Set(px.map(([x, y]) => `${x},${y}`)), out = new Map();
  for (const [x, y] of px) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = `${x + dx},${y + dy}`;
    if (!has.has(k)) out.set(k, [x + dx, y + dy]);
  }
  return [...out.values()];
};

// head: the frame's head spot ({ x, neck } in frame pixels); dir: the frame's direction
export function paintBow(g, head, dir) {
  if (!head) return;
  const { x, neck } = head;
  const back = dir.startsWith('up'), side = dir === 'left' || dir === 'right';
  const s = dir.includes('left') ? -1 : 1; // which way the frame faces
  const layers = []; // [pixels, colour], painted in order (behind: the order is reversed)
  const plot = (px, col) => layers.push([px, col]);
  // the quiver: a leather tube, feathers out of its top over the shoulder
  const quiver = () => {
    const qx = side ? x - s * 8 : back ? x - 7 : x + 8, top = neck - 3, px = [];
    for (let y = top; y <= top + 18; y++) for (let i = 0; i < 5; i++) px.push([qx + i - 2 + Math.round((y - top) * (side ? s * 0.15 : back ? 0.25 : -0.25)), y]);
    plot(outlineOf(px), OUT); plot(px, QUIVER);
    const f = [];
    for (let i = 0; i < 3; i++) for (let k = 1; k <= 3; k++) f.push([qx - 2 + i * 1.5 | 0, top - k, FEATHERS[i]]);
    for (const [fx, fy, c] of f) plot([[fx, fy]], c);
  };
  // the bow: from over one shoulder down past the other hip
  const bow = () => {
    const a = side ? [x - s * 11, neck - 12] : back ? [x + 12, neck - 11] : [x - 14, neck - 11];
    const b = side ? [x - s * 11, neck + 38] : back ? [x - 13, neck + 36] : [x + 13, neck + 36];
    const bend = side ? -s * 6 : back ? 6 : -6;
    const wood = [...arc(a, b, bend), ...arc([a[0] + 1, a[1]], [b[0] + 1, b[1]], bend)]; // two pixels thick
    plot(outlineOf(wood), OUT); plot(wood, WOOD);
    plot(wood.filter((p, i) => i % 3 === 0), WOOD_LT);
    if (back || side) plot(arc(a, b, 0), STRING);
  };
  if (back) { quiver(); bow(); } else { bow(); quiver(); }
  const paint = (px, col) => { g.fillStyle = col; for (const [px2, py] of px) g.fillRect(px2, py, 1, 1); };
  g.save();
  if (back) for (const [px, col] of layers) paint(px, col);
  else {
    g.globalCompositeOperation = 'destination-over';
    for (let i = layers.length - 1; i >= 0; i--) paint(...layers[i]);
    g.globalCompositeOperation = 'source-over';
    if (!side) { // the strap across the chest
      g.fillStyle = STRAP;
      for (let i = 0; i <= 16; i++) g.fillRect(Math.round(x + 7 - i), Math.round(neck + 5 + i * 1.1), 2, 1);
    }
  }
  g.restore();
}
