// A guided lesson: one step at a time, a glowing ring round what to tap (a button, a window's row, an
// item) and a bubble beside it saying what it is and what to do; a drag is shown by a hand carrying a
// ghost of the thing from where it is to where it goes. The ring and the hand never take a tap: the
// hero taps the real thing under them.
//
// steps: [{ at: () => element | null, text, done?: () => bool, need?: () => bool, back?: index, drag?: [() => el, () => el, icon url] }]
//   at    - what to ring (none, or not on screen: the bubble waits at the bottom of the screen)
//   done  - the step is over once this holds; without it the bubble has a Next button
//   need  - while this fails (the window it points into was closed), the lesson goes back to step back (0)
// start(steps, { onEnd(finished) }): skip ends it at once (onEnd(false)).
export class Guide {
  constructor() {
    const el = document.createElement('div');
    el.id = 'guide';
    el.hidden = true;
    el.innerHTML = `<div class="g-ring"></div><img class="g-ghost" alt=""><div class="g-hand">👆</div>
      <div class="g-tip ui-click"><p></p><div class="g-row"><span class="g-n"></span><button class="g-skip" type="button">Skip guide</button><button class="g-next" type="button">Next ▸</button></div></div>`;
    document.body.appendChild(el);
    this.el = el;
    this.ring = el.querySelector('.g-ring');
    this.tip = el.querySelector('.g-tip');
    this.hand = el.querySelector('.g-hand');
    this.ghost = el.querySelector('.g-ghost');
    this.steps = null;
    el.querySelector('.g-next').addEventListener('click', () => this.go(this.i + 1));
    el.querySelector('.g-skip').addEventListener('click', () => this.stop(false));
  }

  get running() { return !!this.steps; }

  start(steps, { onEnd = null } = {}) {
    this.steps = steps;
    this.onEnd = onEnd;
    this.el.hidden = false;
    this.go(0);
  }

  stop(finished = false) {
    if (!this.steps) return;
    this.steps = null;
    this.el.hidden = true;
    const end = this.onEnd;
    this.onEnd = null;
    end?.(finished);
  }

  go(i) {
    if (!this.steps) return;
    // a step already done is passed over (the window already open, the tab already picked)
    while (i < this.steps.length && this.steps[i].done?.()) i++;
    if (i >= this.steps.length) { this.stop(true); return; }
    this.i = i;
    this.t = 0;
    const s = this.steps[i];
    this.tip.querySelector('p').innerHTML = s.text;
    this.tip.querySelector('.g-next').hidden = !!s.done;
    this.tip.querySelector('.g-n').textContent = `${i + 1} / ${this.steps.length}`;
    this.ghost.src = s.drag?.[2] || '';
    this.place();
  }

  // every frame: follow what is ringed (windows move), and move on when the step is done
  update(dt) {
    if (!this.steps) return;
    const s = this.steps[this.i];
    if (s.need && !s.need()) { this.go(s.back ?? 0); return; }
    if (s.done?.()) { this.go(this.i + 1); return; }
    this.t += dt;
    this.place();
  }

  place() {
    const s = this.steps[this.i], W = innerWidth, H = innerHeight;
    const target = s.at?.(), r = target?.getBoundingClientRect?.();
    const shown = r && r.width > 0 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
    this.ring.hidden = !shown;
    const tw = Math.min(290, W - 24);
    this.tip.style.width = `${tw}px`;
    const th = this.tip.offsetHeight;
    let x = (W - tw) / 2, y = H - th - 96; // nothing to point at: above the hotbar
    if (shown) {
      const pad = 5;
      Object.assign(this.ring.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
      // the bubble beside it: right, left, below or above, whichever fits
      const gap = 14, fits = [
        [r.right + gap, r.top + r.height / 2 - th / 2, r.right + gap + tw <= W - 8],
        [r.left - gap - tw, r.top + r.height / 2 - th / 2, r.left - gap - tw >= 8],
        [r.left + r.width / 2 - tw / 2, r.bottom + gap, r.bottom + gap + th <= H - 8],
        [r.left + r.width / 2 - tw / 2, r.top - gap - th, r.top - gap - th >= 8],
      ].find((f) => f[2]);
      if (fits) [x, y] = fits;
      else [x, y] = [(W - tw) / 2, 8];
    }
    this.tip.style.left = `${Math.max(8, Math.min(W - tw - 8, x))}px`;
    this.tip.style.top = `${Math.max(8, Math.min(H - th - 8, y))}px`;
    // a drag: the hand carries a ghost of the thing from it to where it goes, over and over
    const from = s.drag?.[0]?.()?.getBoundingClientRect?.(), to = s.drag?.[1]?.()?.getBoundingClientRect?.();
    const dragging = !!(from && to && from.width && to.width);
    this.hand.hidden = !dragging;
    this.ghost.hidden = !dragging || !s.drag[2];
    if (dragging) {
      const k = Math.min(1, Math.max(0, ((this.t % 2.4) - 0.5) / 1.3)), e = k * k * (3 - 2 * k); // a rest, then the carry
      const hx = from.left + from.width / 2 + (to.left + to.width / 2 - from.left - from.width / 2) * e;
      const hy = from.top + from.height / 2 + (to.top + to.height / 2 - from.top - from.height / 2) * e;
      this.hand.style.transform = `translate(${hx - 6}px, ${hy - 2}px)`;
      this.ghost.style.transform = `translate(${hx - 20}px, ${hy - 34}px)`;
      this.ghost.style.opacity = this.t % 2.4 > 2.1 ? 0 : 0.85;
    }
  }
}
