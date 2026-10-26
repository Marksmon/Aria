// Skill and item hotbar, like Ragnarok's F-key bar: six slots along the bottom of the screen, on
// three pages (the button at its end, or Tab, flips to the next). Tap a slot (or press 1-6) to use
// it. Skills show their cooldown; items show how many you have. It starts empty: drag active skills
// (Skills window) and usable items (Items window) onto a slot; drag slots to swap them, or off the
// bar to clear them.
import { ITEMS, iconURL } from './items.js';
import { SKILLS } from './skills.js';
import { OLD_EDGES } from './progress.js';

export const SLOTS = 6;
export const PAGES = 3;

export class Hotbar {
  constructor(el, inv, hooks) {
    this.el = el;
    this.inv = inv;
    this.hooks = hooks; // { use(entry), cooldown(entry) -> 0..1 left, changed() }
    el.classList.add('ui-click');
    this.pages = Array.from({ length: PAGES }, () => Array(SLOTS).fill(null));
    this.page = 0;
    this.cells = [];
    for (let i = 0; i < SLOTS; i++) {
      const b = document.createElement('button');
      b.className = 'hb';
      b.innerHTML = `<img alt=""><b></b><i></i><small>${i + 1}</small>`;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.slots[i]) this.drag(this.slots[i], e, i);
      });
      el.appendChild(b);
      this.cells.push(b);
    }
    // the page button: flips to the next page of slots
    this.flip = document.createElement('button');
    this.flip.className = 'hb-page';
    this.flip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.turn(); });
    el.appendChild(this.flip);
    window.addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, textarea')) return; // typing (a name): not a key for the game
      const n = +e.key;
      if (!e.repeat && n >= 1 && n <= SLOTS) this.use(n - 1);
      if (!e.repeat && e.key === 'Tab') { e.preventDefault(); this.turn(); }
    });
    inv.onChange(() => this.render());
    this.render();
  }

  // the slots of the page showing
  get slots() { return this.pages[this.page]; }
  set slots(v) { this.pages[this.page] = v; }

  turn() {
    this.page = (this.page + 1) % PAGES;
    this.render();
    this.hooks.changed?.();
  }

  use(i) {
    const s = this.slots[i];
    if (!s || (s.kind === 'item' && !this.inv.bag.count(s.id))) return;
    this.cells[i].classList.add('pressed');
    setTimeout(() => this.cells[i].classList.remove('pressed'), 120);
    this.hooks.use(s);
  }

  has(kind, id) { return this.pages.some((pg) => pg.some((s) => s?.kind === kind && s.id === id)); }

  cellAt(x, y) {
    const hit = document.elementFromPoint(x, y)?.closest?.('.hb');
    return this.cells.indexOf(hit);
  }

  // Start dragging entry ({ kind, id }) from a pointerdown. from = the slot it came from, or -1
  // for the Items / Skills window. A press that never moves is a tap: it uses the slot it came from.
  drag(entry, e, from = -1) {
    const sx = e.clientX, sy = e.clientY;
    let ghost = null, over = -1;
    const move = (ev) => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        ghost = document.createElement('img');
        ghost.className = 'hb-ghost';
        ghost.src = iconURL(entry.kind === 'skill' ? SKILLS[entry.id].icon : entry.id);
        document.body.appendChild(ghost);
        this.el.classList.add('dropping');
      }
      ev.preventDefault();
      ghost.style.transform = `translate(${ev.clientX - 24}px, ${ev.clientY - 24}px)`;
      const at = this.cellAt(ev.clientX, ev.clientY);
      if (at !== over) {
        this.cells[over]?.classList.remove('over');
        this.cells[at]?.classList.add('over');
        over = at;
      }
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!ghost) { if (from >= 0 && ev.type === 'pointerup') this.use(from); return; }
      ghost.remove();
      this.el.classList.remove('dropping');
      this.cells[over]?.classList.remove('over');
      const at = this.cellAt(ev.clientX, ev.clientY);
      if (at >= 0 && from >= 0) [this.slots[at], this.slots[from]] = [this.slots[from], this.slots[at]];
      else if (at >= 0) {
        this.slots = this.slots.map((s) => (s?.kind === entry.kind && s.id === entry.id ? null : s)); // one slot each
        this.slots[at] = { kind: entry.kind, id: entry.id };
      } else if (from >= 0) this.slots[from] = null; // dragged off the bar
      this.render();
      this.hooks.changed?.();
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  render() {
    this.slots.forEach((s, i) => {
      const c = this.cells[i];
      c.classList.toggle('empty', !s);
      const img = c.querySelector('img');
      img.hidden = !s;
      if (s) img.src = iconURL(s.kind === 'skill' ? SKILLS[s.id].icon : s.id);
      const n = s?.kind === 'item' ? this.inv.bag.count(s.id) : null;
      c.querySelector('b').textContent = n === null ? '' : n;
      c.classList.toggle('out', n === 0);
      c.title = s ? (s.kind === 'skill' ? SKILLS[s.id].name : ITEMS[s.id].name) : 'Empty slot';
    });
    this.flip.innerHTML = `<b>${this.page + 1}</b><small>/${PAGES}</small>`;
    this.flip.title = `Hotbar page ${this.page + 1} of ${PAGES} (Tab: next)`;
  }

  // cooldown sweep over skill slots, every frame
  update() {
    this.slots.forEach((s, i) => {
      const left = s ? this.hooks.cooldown(s) : 0;
      const sweep = this.cells[i].querySelector('i');
      sweep.style.display = left > 0 ? 'block' : 'none';
      if (left > 0) sweep.style.background = `conic-gradient(rgba(20,14,10,.62) ${left * 360}deg, transparent 0)`;
    });
  }

  toJSON() { return { pages: this.pages, page: this.page }; }
  load(d) {
    // older saves kept one row of slots
    const pages = Array.isArray(d) ? [d] : Array.isArray(d?.pages) ? d.pages : null;
    if (!pages) return;
    const ok = (s) => s && ((s.kind === 'skill' && SKILLS[s.id]?.kind === 'active') || (s.kind === 'item' && ITEMS[s.id]?.usable));
    for (const row of pages) for (const s of row || []) if (s?.kind === 'skill' && OLD_EDGES.includes(s.id)) s.id = 'elemedge'; // the merged Edges
    this.pages = Array.from({ length: PAGES }, (_, p) => Array.from({ length: SLOTS }, (_, i) => (ok(pages[p]?.[i]) ? { kind: pages[p][i].kind, id: pages[p][i].id } : null)));
    this.page = Math.min(PAGES - 1, Math.max(0, d?.page | 0));
    this.render();
  }
}
