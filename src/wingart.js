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
// angel (folded, gold-trimmed feathers: its own box, below), devil (a bat's, bones and a scalloped membrane).
// Angel Wings are folded instead (the owner's concept), tall on the back: their own box (WING_BOX).
export function paintWings(g, art, frame = 0) {
  const [, , bx, by] = wingBox(art);
  for (const s of [-1, 1]) {
    g.save(); g.translate(bx, by); g.scale(s, 1);
    (WING_ART[art] || WING_ART.fairy)(g, frame, s);
    g.restore();
  }
  if (WING_MIDDLE[art] && !WING_TAILS[art]) { g.save(); g.translate(bx, by); WING_MIDDLE[art](g); g.restore(); }
  if (WING_TAILS[art]) { g.save(); g.translate(bx, by); paintTail(g, TAIL.front(1)); g.restore(); } // (seen from the front: the tail curls out)
}
// Wings drawn for each of the hero's 8 directions (the Angel Wings): each wing a panel swept back
// from the spine (SWEEP), turned with the hero (yaw: how far the face has turned toward screen right),
// so it narrows and slides as they turn; the nearer wing over the farther, the crest down the spine
// only when the back is toward us, and a wing's inner face (toward the hero's front) a little darker.
export const WING_VIEWS = { angel: true, leaf: true, fairy: true, ember: true, devil: true }; // (every pair: they turn with the hero)
export const WING_DIRS = ['down', 'downright', 'right', 'upright', 'up', 'upleft', 'left', 'downleft'];
const SWEEP = 0.55, BACK = 10; // the wings' sweep back from the spine plane; the back, this far behind the hero's middle (px)
const FLARE = 8; // facing us, the wings stand this far out from the body (px), so they show past it
export function paintWingsView(g, art, dir, frame = 0) {
  const [, , bx, by] = wingBox(art), t = (WING_DIRS.indexOf(dir) * Math.PI) / 4;
  const cs = Math.cos(SWEEP), sn = Math.sin(SWEEP), ct = Math.cos(t), st = Math.sin(t);
  const parts = [-1, 1].map((side) => {
    const a = side * cs * ct - sn * st; // how a wing's painted x (out from the spine) lands across the screen
    const d = 18, depth = -side * d * cs * st + (-BACK - d * sn) * ct;
    const front = -side * sn * st - cs * ct < 0; // its inner face toward us
    return { depth, draw: () => {
      g.save(); g.translate(bx - BACK * st + side * FLARE * Math.max(0, ct), by); g.transform(a, 0, 0, 1, 0, 0);
      if (front) g.filter = 'brightness(0.93)';
      (WING_ART[art] || WING_ART.fairy)(g, frame, side);
      g.restore();
    } };
  });
  // (the crest: over the wings' roots, seen only with the back toward us)
  if (WING_MIDDLE[art] && ct < -0.3) parts.push({ depth: 99, draw: () => {
    g.save(); g.translate(bx - BACK * st, by); g.scale(Math.max(0.25, Math.abs(ct)), 1); WING_MIDDLE[art](g); g.restore();
  } });
  // a tail (the Devil Wings'): down the spine from behind, curled out past the legs from the front,
  // out behind seen from the side (c: the side it curls to, behind's side when the hero is turned)
  if (WING_TAILS[art]) {
    const c = Math.abs(st) > 0.1 ? -Math.sign(st) : 1, view = ct > 0.35 ? 'front' : ct < -0.35 ? 'back' : 'side';
    parts.push({ depth: view === 'side' ? -99 : 98, draw: () => { g.save(); g.translate(bx - BACK * st, by); paintTail(g, TAIL[view](c)); g.restore(); } });
  }
  for (const p of parts.sort((x, y) => x.depth - y.depth)) p.draw();
}
// a box other than 96 x 56 with the back at (48, 30): [w, h, back x, back y]
const WING_BOX = { angel: [78, 114, 39, 35], devil: [124, 104, 62, 38] }; // (the Devil Wings: tall for the tail)
export const wingBox = (art) => WING_BOX[art] || [96, 56, 48, 30];
// a pale crystal: a diamond, lit at its upper left
function crystal(g, x, y, w, h) {
  g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y); g.lineTo(x, y + h); g.lineTo(x - w, y); g.closePath();
  const c = g.createLinearGradient(x - w, y - h, x + w, y + h);
  c.addColorStop(0, '#ffffff'); c.addColorStop(0.45, '#cfe4ff'); c.addColorStop(1, '#7a9ad8');
  g.fillStyle = c; g.fill(); g.lineWidth = 0.7; g.strokeStyle = '#6e4a18'; g.stroke();
}
// what is drawn once, between the two wings: the Angel Wings' gold crest down the spine, a big
// crystal at its heart and two small ones below
const WING_MIDDLE = {
  // the Devil Wings: a spine of dark spiked plates down the back, a red stone and a spike on top
  devil(g) {
    for (let i = 0; i < 6; i++) {
      const y = -8 + i * 4.4, w = 3.4 - i * 0.3;
      g.beginPath(); g.moveTo(-w, y); g.lineTo(0, y - 3); g.lineTo(w, y); g.lineTo(0, y + 3.6); g.closePath();
      g.fillStyle = '#3a1a1e'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#140608'; g.stroke();
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * w, y); g.lineTo(sd * (w + 3), y - 2.5); g.lineTo(sd * (w - 0.5), y + 1.4); g.closePath(); g.fillStyle = '#d8c4b8'; g.fill(); g.lineWidth = 0.5; g.strokeStyle = '#2a1210'; g.stroke(); }
    }
    g.beginPath(); g.moveTo(-2.4, -9); g.lineTo(0, -20); g.lineTo(2.4, -9); g.closePath(); g.fillStyle = '#e8d4c8'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#2a1210'; g.stroke();
    g.beginPath(); g.moveTo(0, -9); g.lineTo(2.6, -5); g.lineTo(0, -1); g.lineTo(-2.6, -5); g.closePath(); g.fillStyle = '#e02a34'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#140608'; g.stroke();
  },
  angel(g) {
    path(g, [[0, -32], [1.5, -20, 2, -14, 4, -8], [5, -5, 4, -1, 2, 3], [1.5, 20, 1.2, 36, 0, 46], [-1.2, 36, -1.5, 20, -2, 3], [-4, -1, -5, -5, -4, -8], [-2, -14, -1.5, -20, 0, -32]]);
    const gold = g.createLinearGradient(-5, 0, 5, 0);
    gold.addColorStop(0, '#a8762a'); gold.addColorStop(0.45, '#fff0b0'); gold.addColorStop(1, '#c08c34');
    g.fillStyle = gold; g.fill(); g.lineWidth = 0.9; g.strokeStyle = '#6e4a18'; g.stroke();
    // little gold horns curling out from the crest
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 3, -10); g.quadraticCurveTo(s * 8, -13, s * 7, -20); g.lineWidth = 1.3; g.strokeStyle = '#d9a845'; g.stroke(); }
    crystal(g, 0, -3, 2.6, 5);
    crystal(g, 0, 16, 1.4, 2.8);
    crystal(g, 0, 30, 1.2, 2.4);
    g.beginPath(); g.moveTo(-2.5, 46); g.lineTo(2.5, 46); g.moveTo(0, 43); g.lineTo(0, 50); g.lineWidth = 1; g.strokeStyle = '#d9a845'; g.stroke();
  },
};
// how many frames each art has (one each, for now)
export const WING_FRAMES = {};
const path = (g, pts) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) p.length === 4 ? g.quadraticCurveTo(...p) : g.bezierCurveTo(...p); g.closePath(); };
const WING_ART = {
  // a big leaf up and out, a smaller one down; midribs and veins
  leaf(g) {
    for (const [len, wid, ang, fill] of [[42, 15, -0.55, '#6fbf4a'], [28, 11, 0.45, '#5aa83a']]) {
      g.save(); g.rotate(ang);
      g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(len * 0.45, -wid, len, 0); g.quadraticCurveTo(len * 0.45, wid, 2, 0); g.closePath();
      g.fillStyle = fill; g.fill(); g.lineWidth = 1.8; g.strokeStyle = '#2f5a22'; g.stroke();
      g.beginPath(); g.moveTo(3, 0); g.lineTo(len - 3, 0);
      for (let x = 10; x < len - 6; x += 7) { g.moveTo(x, 0); g.lineTo(x + 5, -wid * 0.55); g.moveTo(x, 0); g.lineTo(x + 5, wid * 0.55); }
      g.lineWidth = 1; g.strokeStyle = '#3f7a2a'; g.stroke();
      g.beginPath(); g.moveTo(8, -3); g.quadraticCurveTo(len * 0.45, -wid * 0.8, len - 6, -2); g.lineWidth = 1.4; g.strokeStyle = '#9cdc76'; g.stroke();
      g.restore();
    }
  },
  // a butterfly's: a broad upper wing and a rounder lower one, see-through
  fairy(g) {
    path(g, [[2, -2], [10, -26, 34, -30, 44, -20], [46, -10, 34, -2, 24, 0], [30, 8, 30, 20, 18, 24], [8, 22, 4, 10, 2, 2]]);
    g.fillStyle = 'rgba(170, 235, 255, .62)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#5aa8d8'; g.stroke();
    g.beginPath(); g.moveTo(4, -2); g.quadraticCurveTo(20, -18, 40, -19); g.moveTo(4, 0); g.quadraticCurveTo(18, -6, 30, -6); g.moveTo(4, 3); g.quadraticCurveTo(14, 12, 18, 20);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(255, 255, 255, .8)'; g.stroke();
    for (const [x, y, r] of [[30, -18, 3], [20, 12, 2.2]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = 'rgba(255, 255, 255, .55)'; g.fill(); }
  },
  // flames licking out and up from the back, red at the tips
  ember(g) {
    const fire = g.createLinearGradient(0, 0, 46, 0);
    fire.addColorStop(0, '#ffe27a'); fire.addColorStop(0.45, '#ff9a2a'); fire.addColorStop(1, '#d8321e');
    for (const [len, ang, w] of [[44, -0.75, 9], [40, -0.3, 8], [32, 0.15, 7], [24, 0.6, 6]]) {
      g.save(); g.rotate(ang);
      g.beginPath(); g.moveTo(2, -w * 0.5); g.bezierCurveTo(len * 0.4, -w * 1.2, len * 0.7, w * 0.2, len, -w * 0.9);
      g.bezierCurveTo(len * 0.75, w * 0.9, len * 0.4, w * 1.1, 2, w * 0.5); g.closePath();
      g.fillStyle = fire; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#8a2414'; g.stroke();
      g.beginPath(); g.moveTo(4, 0); g.quadraticCurveTo(len * 0.5, -w * 0.3, len * 0.8, -w * 0.5); g.lineWidth = 1.4; g.strokeStyle = '#fff2b0'; g.stroke();
      g.restore();
    }
  },
  // folded: two tall wings, each rising to a peak at the top and hanging to a point, covered in
  // rows of white feathers overlapping downward (the long primaries at the bottom), with a gold
  // leading edge, spikes at the peak, gold on the outer feathers, and a crystal hanging at the side
  angel(g) {
    const lerp = (pts, y) => { // a piecewise-linear edge: x at height y
      for (let i = 1; i < pts.length; i++) if (y <= pts[i][1]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return x0 + (x1 - x0) * (y - y0) / (y1 - y0); }
      return pts[pts.length - 1][0];
    };
    const OUTER = [[17, -27], [27, -17], [31, -4], [30, 16], [26, 36], [19, 56], [12, 70]];
    const INNER = [[6, -12], [4, 0], [5, 30], [8, 56], [11, 66]];
    const feather = (x, y, len, ang, wid, gold) => {
      g.save(); g.translate(x, y); g.rotate(ang);
      g.beginPath(); g.moveTo(0, -wid * 0.5); g.quadraticCurveTo(len * 0.55, -wid * 0.7, len, 0); g.quadraticCurveTo(len * 0.55, wid * 0.7, 0, wid * 0.5); g.closePath();
      const f = g.createLinearGradient(0, 0, len, 0);
      f.addColorStop(0, '#ffffff'); f.addColorStop(0.6, '#f1f2f9'); f.addColorStop(1, '#d4d8ec');
      g.fillStyle = f; g.fill();
      g.lineWidth = gold ? 1 : 0.55; g.strokeStyle = gold ? '#c99a3e' : '#a9b0cb'; g.stroke();
      g.beginPath(); g.moveTo(len * 0.15, 0); g.lineTo(len * 0.85, 0); g.lineWidth = 0.45; g.strokeStyle = 'rgba(150, 160, 195, .75)'; g.stroke();
      g.restore();
    };
    // the rows, bottom first so each row lies over the one below
    for (let y = 52; y >= -18; y -= 7) {
      const x1 = lerp(OUTER, y), x0 = y < -12 ? lerp(OUTER, -27) - 4 : lerp(INNER, y), n = Math.max(1, Math.round((x1 - x0) / 4.5));
      const len = y > 40 ? 24 : 11 + (y + 18) * 0.16;
      for (let i = 0; i <= n; i++) {
        const k = n ? i / n : 1, x = x0 + (x1 - x0) * k;
        feather(x, y, len, Math.PI / 2 + 0.05 + 0.22 * k - (y > 30 ? 0.08 : 0), 5.5, i === n);
      }
    }
    // the leading edge: gold, from the spine up to the peak and down the outer edge, with spikes
    g.beginPath(); g.moveTo(4, -8); g.quadraticCurveTo(8, -24, 17, -27); g.quadraticCurveTo(26, -22, 30, -10);
    g.lineCap = 'round'; g.lineWidth = 4.2; g.strokeStyle = '#6e4a18'; g.stroke();
    g.lineWidth = 2.8; g.strokeStyle = '#e2b450'; g.stroke();
    g.beginPath(); g.moveTo(6, -14); g.quadraticCurveTo(10, -24, 17, -26); g.lineWidth = 0.9; g.strokeStyle = '#fff0b8'; g.stroke();
    for (const [x, y, dx, dy] of [[15, -27, 3, -6], [22, -25, 5, -4], [28, -15, 5, -2]]) {
      g.beginPath(); g.moveTo(x - 1.6, y + 0.5); g.lineTo(x + dx, y + dy); g.lineTo(x + 1.6, y + 0.5); g.closePath();
      g.fillStyle = '#e2b450'; g.fill(); g.lineWidth = 0.7; g.strokeStyle = '#6e4a18'; g.stroke();
    }
    crystal(g, 13, -18, 1.8, 3.2);
    // a crystal hanging on a fine chain from the outer edge
    g.beginPath(); g.moveTo(30, -8); g.lineTo(32, 10); g.lineWidth = 0.6; g.strokeStyle = '#c99a3e'; g.stroke();
    crystal(g, 32, 13, 1.5, 3);
  },
  // a bat's: the arm up to a clawed wrist, fingers fanning down, the membrane scalloped between them
  // the owner's concept (Majestic Devil Wings): a bat's wing of dark spiked bone and torn crimson
  // membrane. The arm bone climbs to the wrist (a big pale claw on top, thorns along it), four fingers
  // fan out and down from there, and the membrane between them hangs in torn scallops
  devil(g) {
    const sh = [2, -4], el = [20, -28], wr = [44, -38], tips = [[66, -16], [62, 12], [48, 34], [26, 40]], root = [4, 20];
    // the membrane: shoulder, wrist, each finger's tip, back to the body, every edge torn
    const torn = (from, to, sag, notches) => { // a scallop from one tip to the next, with ragged nicks
      const [x0, y0] = from, [x1, y1] = to, nx = -(y1 - y0), ny = x1 - x0, len = Math.hypot(nx, ny) || 1;
      for (let i = 1; i <= notches; i++) {
        const k = i / notches, bow = Math.sin(k * Math.PI) * sag, jag = i % 2 ? 1.6 : -1.2;
        g.lineTo(x0 + (x1 - x0) * k + (nx / len) * (bow + jag), y0 + (y1 - y0) * k + (ny / len) * (bow + jag));
      }
    };
    g.beginPath(); g.moveTo(...sh); g.lineTo(...el); g.lineTo(...wr);
    let prev = wr;
    for (const t of tips) { torn(prev, t, 7, 5); prev = t; } // (each scallop cut in toward the wrist: the fingertips stand out as points)
    torn(prev, root, 5, 4); g.closePath();
    const skin = g.createLinearGradient(44, -30, 10, 30);
    skin.addColorStop(0, '#e2353c'); skin.addColorStop(0.5, '#a8182a'); skin.addColorStop(1, '#4a0812');
    g.fillStyle = skin; g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#1a070a'; g.stroke();
    // veins in the membrane, and a darker shade toward the body
    g.save(); g.clip();
    const shade = g.createRadialGradient(4, 4, 2, 4, 4, 34); shade.addColorStop(0, 'rgba(30, 4, 8, .55)'); shade.addColorStop(1, 'rgba(30, 4, 8, 0)');
    g.fillStyle = shade; g.fillRect(-10, -40, 80, 80);
    g.beginPath(); for (const t of tips) { g.moveTo(...wr); g.quadraticCurveTo((wr[0] + t[0]) / 2 + 3, (wr[1] + t[1]) / 2 + 3, t[0], t[1]); }
    g.lineWidth = 0.6; g.strokeStyle = 'rgba(255, 120, 110, .35)'; g.stroke();
    g.restore();
    // the bones: dark, with a pale edge; the arm, then each finger
    const bone = (pts, w) => {
      g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) g.lineTo(...q);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.lineWidth = w + 1.6; g.strokeStyle = '#140608'; g.stroke();
      g.lineWidth = w; g.strokeStyle = '#3a1c1e'; g.stroke();
      g.lineWidth = w * 0.35; g.strokeStyle = '#b89a90'; g.stroke();
    };
    for (const t of tips) bone([wr, [(wr[0] + t[0]) / 2 + 2, (wr[1] + t[1]) / 2 + 1], t], 1.7);
    bone([sh, el, wr], 3);
    // thorns along the arm, a claw at each fingertip, and the great claw over the wrist
    const thorn = (x, y, dx, dy, w = 1.6) => {
      g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + dx, y + dy); g.lineTo(x + w, y); g.closePath();
      g.fillStyle = '#e8d4c8'; g.fill(); g.lineWidth = 0.7; g.strokeStyle = '#2a1210'; g.stroke();
    };
    thorn(9, -14, -3, -6); thorn(16, -23, -2, -6); thorn(30, -33, -1, -6, 1.4);
    for (const t of tips) thorn(t[0], t[1], (t[0] - wr[0]) * 0.18, (t[1] - wr[1]) * 0.18, 1.2);
    thorn(wr[0], wr[1], 6, -13, 2.6);
    g.beginPath(); g.arc(wr[0], wr[1], 2.2, 0, Math.PI * 2); g.fillStyle = '#c0202c'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#140608'; g.stroke(); // the red knuckle
  },
};
// the Devil Wings' tail: dark spiked segments with crimson edges, down to a barbed spear tip. It hangs
// from the small of the back; turned to us it curls out past the legs, so it shows even facing front.
// pts: the curve, from the back down to the tip (the painter's units, the back at 0, 0)
function paintTail(g, pts) {
  const N = 14, at = (k) => { // a point along the curve (a chain of quadratic arcs through pts' midpoints)
    const n = pts.length - 1, f = Math.min(n - 1e-6, k * n), i = Math.floor(f), u = f - i;
    const p0 = pts[i], p1 = pts[i + 1];
    return [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u];
  };
  const smooth = []; // (a softer curve: each point the mean of its neighbours)
  for (let i = 0; i <= N; i++) { const a = at(Math.max(0, (i - 0.6) / N)), b = at(i / N), c = at(Math.min(1, (i + 0.6) / N)); smooth.push([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]); }
  for (let i = 0; i < N; i++) {
    const [x0, y0] = smooth[i], [x1, y1] = smooth[i + 1], w = 3.2 - i * 0.12, dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    g.beginPath(); g.moveTo(x0 + nx * w, y0 + ny * w); g.lineTo(x1 + nx * w * 0.8, y1 + ny * w * 0.8); g.lineTo(x1 - nx * w * 0.8, y1 - ny * w * 0.8); g.lineTo(x0 - nx * w, y0 - ny * w); g.closePath();
    g.fillStyle = i % 2 ? '#3a1a1e' : '#4a2026'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#140608'; g.stroke();
    g.beginPath(); g.moveTo(x0 + nx * w * 0.9, y0 + ny * w * 0.9); g.lineTo(x1 + nx * w * 0.7, y1 + ny * w * 0.7); g.lineWidth = 0.7; g.strokeStyle = '#b8222e'; g.stroke(); // a crimson edge
    if (i % 2 === 0 && i < N - 2) { // a thorn on every other plate
      g.beginPath(); g.moveTo(x0 + nx * w, y0 + ny * w); g.lineTo(x0 + nx * (w + 3.2) + dx * 0.2, y0 + ny * (w + 3.2) + dy * 0.2); g.lineTo(x1 + nx * w * 0.8, y1 + ny * w * 0.8); g.closePath();
      g.fillStyle = '#d8c4b8'; g.fill(); g.lineWidth = 0.6; g.strokeStyle = '#2a1210'; g.stroke();
    }
  }
  // the barbed spear tip, along the tail's last stretch
  const [ex, ey] = smooth[N], [px, py] = smooth[N - 2], d = Math.hypot(ex - px, ey - py) || 1, ux = (ex - px) / d, uy = (ey - py) / d, vx = -uy, vy = ux;
  const P = (a, b) => [ex + ux * a + vx * b, ey + uy * a + vy * b];
  g.beginPath(); g.moveTo(...P(-1, 0)); g.lineTo(...P(2, 4.5)); g.lineTo(...P(0, 5.5)); g.lineTo(...P(9, 1.2)); g.lineTo(...P(13, 0));
  g.lineTo(...P(9, -1.2)); g.lineTo(...P(0, -5.5)); g.lineTo(...P(2, -4.5)); g.closePath();
  const red = g.createLinearGradient(...P(0, 0), ...P(13, 0)); red.addColorStop(0, '#6a0c16'); red.addColorStop(0.6, '#d42a34'); red.addColorStop(1, '#ff7a6a');
  g.fillStyle = red; g.fill(); g.lineWidth = 0.9; g.strokeStyle = '#140608'; g.stroke();
  g.beginPath(); g.moveTo(...P(0, 0)); g.lineTo(...P(12, 0)); g.lineWidth = 0.6; g.strokeStyle = 'rgba(255, 200, 190, .7)'; g.stroke();
}
// where the tail runs, seen from the front (ct > 0: it curls out past the legs on side c), from the
// back (down the spine, its end curling to side c), or from the side (out behind, b: behind's side)
const TAIL = {
  front: (c) => [[0, 10], [c * 2, 28], [c * 8, 42], [c * 20, 52], [c * 32, 56], [c * 42, 54]],
  back: (c) => [[0, 6], [0, 24], [c * 2, 40], [c * 10, 52], [c * 18, 58], [c * 22, 64]],
  side: (b) => [[0, 6], [b * 6, 22], [b * 14, 36], [b * 24, 46], [b * 34, 50], [b * 42, 46]],
};
export const WING_TAILS = { devil: true };
