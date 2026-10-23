// Bag, campfire crafting and chest windows, plus pickup toasts. Plain DOM over the canvas.
import { ITEMS, WEAPONS, ARMORS, RECIPES, recipeName, recipeIcon, iconURL } from './items.js';
import { BAG_SLOTS, CHEST_SLOTS } from './inventory.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = '') => `<img class="ico ${cls}" src="${iconURL(id)}" alt="">`;

export class Menus {
  constructor(inv, hooks) {
    this.inv = inv;
    this.hooks = hooks; // { usePotion(), crafted(recipe), opened(), closed() }
    this.root = document.getElementById('panel');
    this.toasts = document.getElementById('toasts');
    this.mode = null;
    this.selected = null;
    this.root.addEventListener('click', (e) => this.click(e));
    inv.onChange(() => { if (this.mode) this.render(); });
  }

  get open() { return this.mode !== null; }

  show(mode) {
    this.mode = mode;
    this.selected = null;
    this.render();
    this.root.classList.add('show');
    this.openedAt = performance.now();
    this.hooks.opened?.(mode);
  }

  close() {
    if (!this.mode) return;
    this.mode = null;
    this.root.classList.remove('show');
    this.hooks.closed?.();
  }

  toggle(mode) { this.mode === mode ? this.close() : this.show(mode); }

  toast(id, n) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${icon(id)}<span>+${n} ${esc(ITEMS[id]?.name || id)}</span>`;
    this.toasts.appendChild(el);
    while (this.toasts.children.length > 4) this.toasts.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 1800);
    setTimeout(() => el.remove(), 2300);
  }

  message(text) {
    const el = document.createElement('div');
    el.className = 'toast note';
    el.textContent = text;
    this.toasts.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2200);
    setTimeout(() => el.remove(), 2700);
  }

  grid(store, size, side) {
    let h = `<div class="grid" data-side="${side}">`;
    for (let i = 0; i < size; i++) {
      const s = store.slots[i];
      h += s
        ? `<button class="slot${this.selected === s.id && side === 'bag' ? ' sel' : ''}" data-act="slot" data-side="${side}" data-id="${s.id}">${icon(s.id)}<b>${s.n}</b></button>`
        : '<div class="slot empty"></div>';
    }
    return h + '</div>';
  }

  render() {
    const inv = this.inv, g = inv.gear;
    let body = '';
    if (this.mode === 'bag') {
      const sel = this.selected && ITEMS[this.selected];
      body = `
        <header><h2>Bag</h2><span class="sub">${inv.bag.slots.length}/${BAG_SLOTS} slots</span><button class="x" data-act="close" aria-label="Close">✕</button></header>
        <div class="bagwrap">
          <div class="gear">
            <div class="g">${icon('weapon' + g.weapon)}<div><small>Weapon</small>${WEAPONS[g.weapon].name}<em>${WEAPONS[g.weapon].dmg} dmg · ${WEAPONS[g.weapon].spd}/s</em></div></div>
            <div class="g">${icon('armor' + g.armor)}<div><small>Armor</small>${ARMORS[g.armor].name}<em>+${ARMORS[g.armor].hearts} hearts</em></div></div>
            <div class="g ${g.torch ? '' : 'off'}">${icon('torch')}<div><small>Tool</small>${g.torch ? 'Torch' : 'No torch'}</div></div>
            <div class="g ${g.boots ? '' : 'off'}">${icon('boots')}<div><small>Feet</small>${g.boots ? 'Swift Boots' : 'Old boots'}</div></div>
          </div>
          <div class="bagright">
            ${this.grid(inv.bag, BAG_SLOTS, 'bag')}
            <div class="detail">${sel
              ? `<b>${esc(sel.name)}</b> <span>${esc(sel.desc)}${sel.from ? ' Dropped by ' + esc(sel.from) + '.' : ''}</span>${sel.usable ? '<button class="go" data-act="use">Use</button>' : ''}`
              : '<span>Tap an item to see what it is. Craft at the campfire.</span>'}</div>
          </div>
        </div>`;
    } else if (this.mode === 'craft') {
      body = `<header><h2>Campfire</h2><span class="sub">Uses items from your bag and the chest</span><button class="x" data-act="close" aria-label="Close">✕</button></header><div class="recipes">`;
      for (const r of RECIPES) {
        const st = inv.recipeState(r);
        const cost = Object.entries(r.cost).map(([id, n]) => {
          const have = inv.have(id);
          return `<span class="cost ${have >= n ? 'ok' : ''}" title="${esc(ITEMS[id].name)}">${icon(id, 'sm')}${Math.min(have, 99)}/${n}</span>`;
        }).join('');
        const btn = st === 'owned' ? '<span class="tag">Owned</span>'
          : st === 'locked' ? '<span class="tag">Needs previous tier</span>'
          : `<button class="go" data-act="craft" data-id="${r.id}" ${st === 'ready' ? '' : 'disabled'}>Craft</button>`;
        body += `<div class="recipe ${st}">${icon(recipeIcon(r))}<div class="rtext"><b>${esc(recipeName(r))}</b><small>${esc(r.desc)}</small><div class="costs">${cost}</div></div>${btn}</div>`;
      }
      body += '</div>';
    } else if (this.mode === 'chest') {
      body = `
        <header><h2>Camp Chest</h2><span class="sub">Tap an item to move the whole stack</span><button class="x" data-act="close" aria-label="Close">✕</button></header>
        <div class="chestwrap">
          <div><h3>Bag ${inv.bag.slots.length}/${BAG_SLOTS}</h3>${this.grid(inv.bag, BAG_SLOTS, 'bag')}</div>
          <div><h3>Chest ${inv.chest.slots.length}/${CHEST_SLOTS}</h3>${this.grid(inv.chest, CHEST_SLOTS, 'chest')}</div>
        </div>`;
    }
    this.root.innerHTML = `<div class="win">${body}</div>`;
  }

  click(e) {
    const t = e.target.closest('[data-act]');
    // the tap that opened a window also produces a click on it; ignore that one
    if (performance.now() - (this.openedAt || 0) < 400) return;
    if (!t) { if (e.target === this.root) this.close(); return; }
    const act = t.dataset.act, inv = this.inv;
    if (act === 'close') this.close();
    if (act === 'slot') {
      if (this.mode === 'chest') {
        const from = t.dataset.side === 'bag' ? inv.bag : inv.chest;
        const to = t.dataset.side === 'bag' ? inv.chest : inv.bag;
        if (!inv.moveStack(from, to, t.dataset.id)) this.message(to === inv.bag ? 'Bag is full' : 'Chest is full');
      } else {
        this.selected = t.dataset.id;
        this.render();
      }
    }
    if (act === 'use' && this.selected === 'potion') this.hooks.usePotion?.();
    if (act === 'craft') {
      const r = RECIPES.find((x) => x.id === t.dataset.id);
      if (inv.craft(r)) { this.hooks.crafted?.(r); this.message(`Crafted ${recipeName(r)}`); }
      else this.message('Bag is full');
    }
  }
}
