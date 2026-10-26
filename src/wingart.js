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

// Wings, spread from the hero's back, in a 96 x 56 box (the back at 48, 30). Each art its own shape:
// leaf (two great leaves a side), fairy (a butterfly's, thin as glass), ember (tongues of flame),
// angel (white feathers in rows), devil (a bat's, bones and a scalloped membrane).
export function paintWings(g, art, frame = 0) {
  for (const s of [-1, 1]) {
    g.save(); g.translate(48, 30); g.scale(s, 1);
    (WING_ART[art] || WING_ART.fairy)(g, frame, s);
    g.restore();
  }
}
// how many frames each art has (the ember's flames flicker)
export const WING_FRAMES = { ember: 4 };
const path = (g, pts) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) p.length === 4 ? g.quadraticCurveTo(...p) : g.bezierCurveTo(...p); g.closePath(); };
const WING_ART = {
  // a vine: a curling stem arcing up and out from the back, leaves hanging along it, a flower at the curl
  leaf(g) {
    const vine = (k) => [3 + 40 * k, -2 - 30 * Math.sin(k * Math.PI * 0.55) + 6 * k * k];
    g.beginPath(); g.moveTo(...vine(0));
    for (let k = 0.05; k <= 1.001; k += 0.05) g.lineTo(...vine(k));
    const [ex, ey] = vine(1);
    g.quadraticCurveTo(ex + 6, ey - 2, ex + 3, ey - 7); g.quadraticCurveTo(ex - 1, ey - 8, ex, ey - 4); // the curl
    g.lineWidth = 3.2; g.strokeStyle = '#4a3220'; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = '#7a5a34'; g.stroke();
    const leaf = ([x, y], len, ang, fill) => {
      g.save(); g.translate(x, y); g.rotate(ang);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.42, len, 0); g.quadraticCurveTo(len * 0.5, len * 0.42, 0, 0); g.closePath();
      g.fillStyle = fill; g.fill(); g.lineWidth = 1.3; g.strokeStyle = '#2f5a22'; g.stroke();
      g.beginPath(); g.moveTo(1, 0); g.lineTo(len - 2, 0); g.lineWidth = 0.8; g.strokeStyle = '#9cdc76'; g.stroke();
      g.restore();
    };
    // leaves hang under the vine and stand above it by turns, bigger towards the tip
    [[0.16, 15, 1.9], [0.3, 18, -0.9], [0.44, 20, 1.7], [0.58, 21, -1.1], [0.72, 22, 1.4], [0.88, 18, -0.4]]
      .forEach(([k, len, ang], i) => leaf(vine(k), len, ang, i % 2 ? '#7ccf52' : '#5aa83a'));
    // a little flower where the vine curls
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.beginPath(); g.arc(ex + 3 + Math.cos(a) * 2.6, ey - 4 + Math.sin(a) * 2.6, 2, 0, Math.PI * 2); g.fillStyle = '#ffb8d0'; g.fill(); }
    g.beginPath(); g.arc(ex + 3, ey - 4, 1.6, 0, Math.PI * 2); g.fillStyle = '#ffe27a'; g.fill();
  },
  // a dragonfly's: two long slim wings a side, clear as glass, finely veined, a dark spot near each tip
  fairy(g) {
    for (const [len, wid, ang] of [[42, 9, -0.62], [34, 8, -0.08]]) {
      g.save(); g.translate(3, -2); g.rotate(ang);
      g.beginPath(); g.moveTo(0, -1); g.bezierCurveTo(len * 0.3, -wid, len * 0.85, -wid * 0.9, len, -wid * 0.2); g.bezierCurveTo(len * 0.9, wid * 0.6, len * 0.35, wid * 0.7, 0, 1); g.closePath();
      g.fillStyle = 'rgba(190, 240, 255, .42)'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#4aa8c8'; g.stroke();
      // the veins: three along, many small ones across
      g.beginPath();
      for (const y of [-wid * 0.45, 0, wid * 0.35]) { g.moveTo(2, y * 0.3); g.quadraticCurveTo(len * 0.5, y, len * 0.92, y * 0.4); }
      for (let x = 6; x < len - 4; x += 3.2) { g.moveTo(x, -wid * 0.55); g.lineTo(x + 1, wid * 0.45); }
      g.lineWidth = 0.45; g.strokeStyle = 'rgba(70, 150, 190, .7)'; g.stroke();
      g.beginPath(); g.ellipse(len * 0.86, -wid * 0.25, 3, 1.6, 0, 0, Math.PI * 2); g.fillStyle = '#2a6a8a'; g.fill(); // the tip spot
      g.restore();
    }
    for (const [x, y] of [[20, -30], [38, -18], [30, 6]]) { g.beginPath(); g.arc(x, y, 1, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); }
  },
  // flames rising from the shoulders, tall tongues leaning out, red at the tips; frame moves the tips
  ember(g, frame) {
    const fire = g.createLinearGradient(0, 8, 0, -30);
    fire.addColorStop(0, '#ffe27a'); fire.addColorStop(0.4, '#ff9a2a'); fire.addColorStop(0.85, '#e8421e'); fire.addColorStop(1, '#a8200e');
    const wob = (i) => Math.sin(frame * 1.6 + i * 2.1) * 3;
    for (const [x, h, lean, w, i] of [[24, 18, 10, 7, 0], [17, 26, 8, 8, 1], [9, 32, 6, 8, 2], [3, 24, 3, 6, 3]]) {
      const tx = x + lean + wob(i), ty = 4 - h - Math.abs(wob(i + 1)) * 0.6;
      g.beginPath(); g.moveTo(x - w, 6);
      g.bezierCurveTo(x - w - 2, -h * 0.3, tx - 6, ty + h * 0.35, tx, ty);
      g.bezierCurveTo(tx - 1, ty + h * 0.4, x + w + 3, -h * 0.2, x + w, 6); g.closePath();
      g.fillStyle = fire; g.fill(); g.lineWidth = 1.3; g.strokeStyle = '#8a2414'; g.stroke();
      g.beginPath(); g.moveTo(x, 5); g.quadraticCurveTo(x + lean * 0.3, -h * 0.4, tx - 2, ty + 6); g.lineWidth = 1.6; g.strokeStyle = '#fff2b0'; g.stroke(); // the hot core
    }
    // sparks flying up
    for (let i = 0; i < 4; i++) { const y = -24 - ((frame * 5 + i * 9) % 14), x = 8 + i * 9 + Math.sin(frame + i) * 2; g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fillStyle = i % 2 ? '#ffe27a' : '#ff8a3a'; g.fill(); }
  },
  // white feathers: the arm curves up and out from the back; long flight feathers hang from it,
  // longest at the tip, with a row of short coverts over their roots and a golden leading edge
  angel(g) {
    const arm = (k) => [2 + 44 * k, -4 - 26 * Math.sin(k * Math.PI * 0.62)]; // along the arm, k 0..1
    const feather = ([x, y], len, ang, wid, fill) => {
      g.save(); g.translate(x, y); g.rotate(ang);
      g.beginPath(); g.moveTo(0, -wid * 0.5); g.quadraticCurveTo(len * 0.55, -wid, len, 0); g.quadraticCurveTo(len * 0.55, wid * 0.9, 0, wid * 0.5); g.closePath();
      g.fillStyle = fill; g.fill(); g.lineWidth = 1; g.strokeStyle = '#9aa4c0'; g.stroke();
      g.beginPath(); g.moveTo(1, 0); g.lineTo(len - 3, 0); g.lineWidth = 0.6; g.strokeStyle = '#c8d0e4'; g.stroke();
      g.restore();
    };
    for (let i = 7; i >= 0; i--) { const k = i / 7; feather(arm(k), 18 + 16 * k, 1.55 - 0.75 * k, 7, '#ffffff'); } // flight feathers, hanging down and out
    for (let i = 6; i >= 0; i--) { const k = i / 6; feather(arm(k * 0.92), 10 + 5 * k, 1.35 - 0.6 * k, 6, '#f0f2fa'); } // the coverts
    g.beginPath(); g.moveTo(...arm(0));
    for (let k = 0.1; k <= 1.001; k += 0.1) g.lineTo(...arm(k));
    g.lineWidth = 3; g.strokeStyle = '#e8c86a'; g.stroke(); g.lineWidth = 1; g.strokeStyle = '#a8862e'; g.stroke();
  },
  // a bat's: the arm up to a clawed wrist, fingers fanning down, the membrane scalloped between them
  devil(g) {
    const wrist = [26, -22], tips = [[46, -14], [44, 4], [32, 16], [12, 18]];
    g.beginPath(); g.moveTo(2, -4); g.lineTo(...wrist);
    let prev = wrist;
    for (const t of tips) { const mx = (prev[0] + t[0]) / 2, my = (prev[1] + t[1]) / 2; g.quadraticCurveTo(mx - (t[1] - prev[1]) * 0.22 - 4, my + 2, ...t); prev = t; }
    g.quadraticCurveTo(6, 12, 2, 4); g.closePath();
    const skin = g.createLinearGradient(0, -20, 0, 18);
    skin.addColorStop(0, '#5a1e3a'); skin.addColorStop(1, '#2a0e1e');
    g.fillStyle = skin; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#140810'; g.stroke();
    g.beginPath(); g.moveTo(2, -4); g.lineTo(...wrist); for (const t of tips) { g.moveTo(...wrist); g.lineTo(...t); }
    g.lineWidth = 2; g.strokeStyle = '#1a0e16'; g.stroke();
    g.beginPath(); g.moveTo(...wrist); g.lineTo(wrist[0] + 3, wrist[1] - 5); g.lineWidth = 2; g.strokeStyle = '#d8d0c0'; g.stroke(); // the claw
    g.beginPath(); g.moveTo(8, -2); g.lineTo(22, -16); g.lineWidth = 1; g.strokeStyle = 'rgba(200, 60, 80, .7)'; g.stroke();
  },
};
