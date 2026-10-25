// The Keepers' look: a butler in black, painted in code (like painted.js's monsters) on the bald
// bodies' frame, so the shared head and hair are painted on top like anyone's (docs/character-
// standard.md). Black tailcoat lined in crimson (the tails' insides, the lapels, the hem and cuffs), grey waistcoat with silver buttons and a watch chain,
// white shirt and black tie, white gloves, polished shoes; facing you, one hand rests on the chest
// in a butler's bow. Standing only (people don't walk), 8 directions: the left ones are the right
// ones mirrored. Plain canvas, no three.js: sprites.js makes the sprite set.
import { Frame, ellipse, rect, poly, line } from './painted.js';

export const BW = 106, BH = 108; // the bald bodies' frame (src/art/trainee.json), so heads fit as on theirs
const LEGS = 63;                 // chin to ground, in pixels, in every direction

const C = {
  coat: '#26262f', lapel: '#3c3c4a', vest: '#4c4c5a', shirt: '#f1efe8', tie: '#15151b',
  trousers: '#2b2b35', shoe: '#17171c', shine: '#6a6a78', glove: '#f6f6f2', silver: '#ccd0da',
  lining: '#b3182c', liningHi: '#e0384a',
};
const red = { outline: false, flat: true }; // a lining's line: no outline or shading

// one direction's standing frame. cx, cy: the head's chin in the frame (the trainee's, so the
// shared head lands on the collar). view: front | front3 | side | back3 | back
function paint(view, cx, cy) {
  const F = new Frame(BW, BH);
  const G = cy + LEGS;
  const back = view === 'back' || view === 'back3';
  const side = view === 'side';
  const s = view === 'front3' ? 3 : view === 'back3' ? -2 : 0; // the front (or the seam) turns this way
  const r = view === 'front3' || view === 'back3' ? 3 : 0;     // the far side narrows

  if (side) {
    F.part(poly([[cx - 7, cy + 22], [cx - 1, cy + 26], [cx - 7, cy + 49], [cx - 14, cy + 46]]), C.coat); // the tail behind
    F.part(line(cx - 6, cy + 31, cx - 8, cy + 46, 2), C.lining, red); // its lining, behind the legs
    F.part(line(cx - 13, cy + 45, cx - 7, cy + 48, 1), C.lining, red);
    F.part(rect(cx - 5, cy + 30, cx, cy + 58), C.trousers);
    F.part(ellipse(cx - 2, cy + 60.5, 4.5, 2.5), C.shoe);
    F.part(rect(cx - 2, cy + 30, cx + 3, cy + 58), C.trousers);
    F.part(ellipse(cx + 2, cy + 60.5, 5.5, 2.5), C.shoe);
    F.dot(cx + 4, cy + 59, C.shine);
    F.part(poly([[cx - 8, cy + 2], [cx + 5, cy + 1], [cx + 8, cy + 8], [cx + 7, cy + 30], [cx - 8, cy + 30], [cx - 9, cy + 8]]), C.coat);
    F.part(poly([[cx + 5, cy + 8], [cx + 8, cy + 8], [cx + 8, cy + 25], [cx + 5, cy + 25]]), C.vest, { outline: false });
    F.part(poly([[cx + 3, cy - 1], [cx + 6, cy], [cx + 7, cy + 8], [cx + 4, cy + 8]]), C.shirt);
    F.part(line(cx + 7, cy + 2, cx + 7, cy + 8, 1), C.tie, red);
    F.part(line(cx + 4, cy + 1, cx + 4, cy + 26, 1), C.lining, red);
    F.part(line(cx - 7, cy + 30, cx + 6, cy + 30, 1), C.lining, red); // the hem
    // the near arm, its hand at the chest
    F.part(poly([[cx - 4, cy + 4], [cx + 1, cy + 4], [cx + 1, cy + 18], [cx - 4, cy + 19]]), C.coat);
    F.part(poly([[cx - 3, cy + 15], [cx + 5, cy + 12], [cx + 6, cy + 17], [cx - 2, cy + 20]]), C.coat);
    F.part(line(cx + 5, cy + 12, cx + 6, cy + 17, 1), C.lining, red); // the cuff
    F.part(ellipse(cx + 7, cy + 14, 2.6, 2.6), C.glove);
    return F;
  }

  // the tails: behind the legs from the front, over them from the back
  const tails = () => {
    if (back) {
      F.part(poly([[cx - 13, cy + 27], [cx + 13 - r, cy + 27], [cx + 11 - r, cy + 49], [cx + 1 + s, cy + 45], [cx - 1 + s, cy + 45], [cx - 12, cy + 49]]), C.coat);
      F.part(line(cx + s, cy + 29, cx + s, cy + 45, 2), C.lining, red); // the slit shows the lining
      F.part(line(cx - 11, cy + 48, cx - 1 + s, cy + 44, 1), C.lining, red);
      F.part(line(cx + 1 + s, cy + 44, cx + 10 - r, cy + 48, 1), C.lining, red);
      F.dot(cx - 3 + s, cy + 28, C.silver); F.dot(cx + 3 + s, cy + 28, C.silver);
    } else {
      F.part(poly([[cx - 13 - r, cy + 24], [cx - 5, cy + 27], [cx - 7, cy + 48], [cx - 13 - r, cy + 44]]), C.coat);
      F.part(poly([[cx + 13 - r, cy + 24], [cx + 5, cy + 27], [cx + 7 - r, cy + 48], [cx + 12 - r, cy + 44]]), C.coat);
      // the lining shows beside the legs and along the tips
      F.part(line(cx - 10, cy + 31, cx - 10, cy + 45, 1), C.lining, red);
      F.part(line(cx + 10 - r, cy + 31, cx + 10 - r, cy + 45, 1), C.lining, red);
      F.part(line(cx - 12 - r, cy + 44, cx - 8, cy + 47, 1), C.lining, red);
      F.part(line(cx + 11 - r, cy + 44, cx + 8 - r, cy + 47, 1), C.lining, red);
    }
  };
  if (!back) tails();
  // legs and shoes (toes turn with the front)
  const toe = back ? 0 : s;
  F.part(rect(cx - 8, cy + 30, cx - 2, cy + 58), C.trousers);
  F.part(rect(cx + 2 - Math.round(r / 2), cy + 30, cx + 8 - Math.round(r / 2), cy + 58), C.trousers);
  F.part(ellipse(cx - 5 + toe, cy + 60.5, 4.5, 2.5), C.shoe);
  F.part(ellipse(cx + 5 + toe - r / 2, cy + 60.5, 4.5, 2.5), C.shoe);
  if (!back) { F.dot(cx - 6 + toe, cy + 59, C.shine); F.dot(cx + 4 + toe - r / 2, cy + 59, C.shine); }
  // the coat
  F.part(poly([[cx - 13, cy + 2], [cx + 13 - r, cy + 2], [cx + 15 - r, cy + 6], [cx + 13 - r, cy + 31], [cx - 13, cy + 31], [cx - 15, cy + 6]]), C.coat);
  if (back) {
    F.part(rect(cx - 4 + s, cy - 1, cx + 4 + s, cy + 1), C.shirt); // the collar above the coat's
    F.part(line(cx + s, cy + 3, cx + s, cy + 27, 1), C.lapel, red);
    tails();
    // arms at the sides; the near one bends forward to the chest, so its hand is hidden
    F.part(poly([[cx - 17, cy + 4], [cx - 12, cy + 4], [cx - 12, cy + 25], [cx - 17, cy + 25]]), C.coat);
    F.part(rect(cx - 17, cy + 23, cx - 12, cy + 24), C.lining, red);
    F.part(rect(cx - 17, cy + 25, cx - 12, cy + 26), C.shirt, { outline: false });
    F.part(ellipse(cx - 14.5, cy + 29, 3.2, 3.2), C.glove);
    F.part(poly([[cx + 12 - r, cy + 4], [cx + 17 - r, cy + 4], [cx + 17 - r, cy + 19], [cx + 12 - r, cy + 20]]), C.coat);
    return F;
  }
  // the front: waistcoat, shirt, tie, lapels, buttons and the watch chain
  F.part(poly([[cx - 5 + s, cy + 2], [cx + 5 + s, cy + 2], [cx + 5 + s, cy + 24], [cx + s, cy + 28], [cx - 5 + s, cy + 24]]), C.vest);
  F.part(poly([[cx - 4 + s, cy], [cx + 4 + s, cy], [cx + 2 + s, cy + 10], [cx + s, cy + 12], [cx - 2 + s, cy + 10]]), C.shirt);
  F.part(poly([[cx - 5 + s, cy - 1], [cx - 1 + s, cy + 1], [cx - 4 + s, cy + 3]]), C.shirt); // collar wings
  F.part(poly([[cx + 5 + s, cy - 1], [cx + 1 + s, cy + 1], [cx + 4 + s, cy + 3]]), C.shirt);
  F.part(line(cx + s, cy + 2, cx + s, cy + 10, 2), C.tie, red);
  F.part(line(cx - 6 + s, cy + 2, cx - 5 + s, cy + 23, 2), C.lining, red);
  F.part(line(cx + 6 + s, cy + 2, cx + 5 + s, cy + 23, 2), C.lining, red);
  F.part(line(cx - 7 + s, cy + 3, cx - 6 + s, cy + 21, 1), C.liningHi, red);
  F.part(line(cx - 12, cy + 30, cx - 5 + s, cy + 25, 1), C.lining, red); // the hem, up to the waistcoat
  F.part(line(cx + 5 + s, cy + 25, cx + 12 - r, cy + 30, 1), C.lining, red);
  for (const y of [15, 19, 23]) F.dot(cx + s, cy + y, C.silver);
  for (const [x, y] of [[1, 18], [2, 19], [3, 20], [4, 20], [5, 19]]) F.dot(cx + x + s, cy + y, C.silver);
  // the far arm hangs; the near one rests its hand on the chest
  F.part(poly([[cx + 12 - r, cy + 4], [cx + 17 - r, cy + 4], [cx + 17 - r, cy + 25], [cx + 11 - r, cy + 25]]), C.coat);
  F.part(rect(cx + 11 - r, cy + 23, cx + 17 - r, cy + 24), C.lining, red);
  F.part(rect(cx + 11 - r, cy + 25, cx + 17 - r, cy + 26), C.shirt, { outline: false });
  F.part(ellipse(cx + 14 - r, cy + 29, 3.2, 3.2), C.glove);
  F.part(poly([[cx - 17, cy + 4], [cx - 11, cy + 4], [cx - 11, cy + 17], [cx - 17, cy + 19]]), C.coat);
  F.part(poly([[cx - 17, cy + 15], [cx - 5 + s, cy + 12], [cx - 4 + s, cy + 18], [cx - 15, cy + 21]]), C.coat);
  F.part(rect(cx - 7 + s, cy + 12, cx - 6 + s, cy + 18), C.lining, red); // the cuff
  F.part(rect(cx - 5 + s, cy + 12, cx - 4 + s, cy + 18), C.shirt, { outline: false });
  F.part(ellipse(cx - 1 + s, cy + 15, 3.2, 3), C.glove);
  return F;
}

// dir -> [view, mirrored]; heads: the trainee's head data, { dir: [x, crown, neck, ...] }
const VIEWS = {
  down: ['front', false], downright: ['front3', false], right: ['side', false], upright: ['back3', false], up: ['back', false],
  downleft: ['front3', true], left: ['side', true], upleft: ['back3', true],
};
// every direction's frame as a canvas, with where it stands: { dir: { canvas, foot } } (foot: rows
// from the frame's bottom to the ground)
export function paintButler(heads) {
  const out = {};
  for (const [dir, [view, flip]] of Object.entries(VIEWS)) {
    const [x, , neck] = heads[dir];
    const cx = flip ? BW - 1 - x : x; // a mirrored view is painted unmirrored, then flipped
    const F = paint(view, Math.round(cx), neck);
    out[dir] = { canvas: (flip ? F.mirror() : F).toCanvas(), foot: BH - (neck + LEGS) };
  }
  return out;
}
