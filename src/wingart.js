// The floating lights of the Wings slot, painted in code: a Wisp (a little flame of light with eyes
// and two pairs of fluttering wings) and the Lantern (iron cap and ring, a glass body in a gilded
// frame, a flame inside, a footed base). Used for the item icons (items.js) and the sprites that
// float beside the hero (wings.js). Every painter draws in a 64 x 64 box; g is already scaled.

// a Wisp. flap: 0..1, the wings from raised to lowered; col: { core, glow }
export function paintWisp(g, col, flap = 0.5) {
  // the soft light around it
  const halo = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  halo.addColorStop(0, col.glow); halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.globalAlpha = 0.45; g.fillStyle = halo; g.fillRect(0, 0, 64, 64); g.globalAlpha = 1;
  // two pairs of wings behind the body, raised or lowered by flap
  const lift = (flap - 0.5) * 0.9;
  for (const s of [-1, 1]) {
    for (const [len, wid, base, alpha] of [[17, 8, -0.55, 0.7], [12, 6, 0.35, 0.55]]) {
      g.save(); g.translate(32 + s * 3, 31); g.scale(s, 1); g.rotate(base + lift * (base < 0 ? 1 : 0.6));
      g.beginPath(); g.ellipse(len * 0.55, 0, len * 0.55, wid / 2, 0, 0, Math.PI * 2);
      g.globalAlpha = alpha; g.fillStyle = 'rgba(235, 250, 255, .9)'; g.fill();
      g.globalAlpha = 1; g.lineWidth = 1.2; g.strokeStyle = col.glow; g.stroke();
      g.beginPath(); g.moveTo(1, 0); g.lineTo(len * 0.95, 0); g.lineWidth = 0.8; g.strokeStyle = 'rgba(255, 255, 255, .8)'; g.stroke();
      g.restore();
    }
  }
  // the body: a drop of light with a curling tail
  g.beginPath();
  g.moveTo(32, 18); g.bezierCurveTo(42, 22, 42, 38, 32, 40); g.bezierCurveTo(28, 44, 30, 50, 35, 52);
  g.bezierCurveTo(26, 52, 22, 44, 25, 38); g.bezierCurveTo(21, 32, 24, 22, 32, 18); g.closePath();
  const body = g.createRadialGradient(32, 30, 1, 32, 32, 13);
  body.addColorStop(0, '#ffffff'); body.addColorStop(0.45, col.core); body.addColorStop(1, col.glow);
  g.fillStyle = body; g.fill(); g.lineWidth = 1.2; g.strokeStyle = col.glow; g.stroke();
  // a face
  g.fillStyle = '#2e2118';
  for (const x of [28.5, 35.5]) { g.beginPath(); g.ellipse(x, 30, 1.6, 2.2, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#ffffff';
  for (const x of [29, 36]) { g.beginPath(); g.arc(x, 29.2, 0.6, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.arc(32, 33.5, 1.5, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 1; g.strokeStyle = '#2e2118'; g.stroke();
  // sparkles
  g.fillStyle = '#ffffff';
  for (const [x, y, r] of [[22, 16, 1.2], [44, 20, 1], [41, 46, 1.1]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
}

// the Lantern. flame: 0..1, how high the flame stands (it flickers)
export function paintLantern(g, flame = 0.5) {
  const IRON = '#2f2f38', IRON_HI = '#5a5a66', GOLD = '#d8a84a', OUT = '#1a1418';
  // the light it throws
  const halo = g.createRadialGradient(32, 36, 2, 32, 36, 30);
  halo.addColorStop(0, 'rgba(255, 220, 140, .55)'); halo.addColorStop(1, 'rgba(255, 220, 140, 0)');
  g.fillStyle = halo; g.fillRect(0, 0, 64, 64);
  const part = (draw, fill, lw = 1.6) => { g.beginPath(); draw(); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); };
  // the ring it hangs by, and the cap: a little roof with a finial
  g.beginPath(); g.arc(32, 7, 4, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = IRON; g.stroke();
  part(() => { g.moveTo(32, 10); g.lineTo(44, 18); g.lineTo(20, 18); g.closePath(); }, IRON);
  part(() => g.rect(19, 18, 26, 4), GOLD, 1.2);
  // the glass body, warm with the flame's light
  const glass = g.createLinearGradient(0, 22, 0, 48);
  glass.addColorStop(0, '#fff2b0'); glass.addColorStop(1, '#ffb44a');
  part(() => g.rect(21, 22, 22, 26), glass, 1.4);
  // the flame (a sleeping wisp's light)
  const top = 30 - flame * 4;
  g.beginPath(); g.moveTo(32, top); g.bezierCurveTo(37, 36, 36, 43, 32, 43); g.bezierCurveTo(28, 43, 27, 36, 32, top); g.closePath();
  const fl = g.createRadialGradient(32, 39, 1, 32, 38, 7);
  fl.addColorStop(0, '#ffffff'); fl.addColorStop(0.5, '#ffe27a'); fl.addColorStop(1, '#ff9a2a');
  g.fillStyle = fl; g.fill();
  // the frame: corner posts, a middle bar each side, gilded crossbands
  g.fillStyle = IRON;
  for (const x of [20, 42]) g.fillRect(x, 22, 2.5, 26);
  g.fillStyle = IRON_HI; g.fillRect(31.2, 22, 1.6, 26);
  g.fillStyle = GOLD;
  for (const y of [26, 43]) g.fillRect(21, y, 22, 1.5);
  // the glints on the glass
  g.fillStyle = 'rgba(255, 255, 255, .7)'; g.fillRect(24, 24, 2, 9); g.fillRect(35, 25, 1.5, 5);
  // the footed base
  part(() => g.rect(19, 48, 26, 4), GOLD, 1.2);
  part(() => { g.moveTo(21, 52); g.lineTo(43, 52); g.lineTo(39, 57); g.lineTo(25, 57); g.closePath(); }, IRON);
  g.fillStyle = IRON;
  for (const x of [24, 38]) g.fillRect(x, 57, 3, 3);
}
