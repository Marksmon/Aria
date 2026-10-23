// Bag, hero (stats + charms), campfire crafting and chest windows, plus pickup toasts.
// Plain DOM over the canvas.
import { ITEMS, WEAPONS, ARMORS, RECIPES, CHARMS, recipeName, recipeIcon, iconURL } from './items.js';
import { BAG_SLOTS, CHEST_SLOTS } from './inventory.js';
import { STATS } from './progress.js';
import { NPCS } from './quests.js';
import { SKILLS } from './hotbar.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = '') => `<img class="ico ${cls}" src="${iconURL(id)}" alt="">`;

export class Menus {
  constructor(inv, prog, player, hooks) {
    this.inv = inv;
    this.prog = prog;
    this.player = player;
    this.hooks = hooks; // { usePotion(), crafted(recipe), raised(stat), accept(id), handIn(id), opened(), closed() }
    this.quests = null;     // set by the game, for villager dialogue
    this.portrait = null;   // villager id -> image URL
    this.npc = null;
    this.root = document.getElementById('panel');
    this.toasts = document.getElementById('toasts');
    this.mode = null;
    this.selected = null;
    this.hotbar = null;     // set by the game: skills and usable items drag onto it
    this.root.addEventListener('click', (e) => this.click(e));
    this.root.addEventListener('pointerdown', (e) => {
      const d = e.target.closest('[data-drag]');
      if (!d || !this.hotbar) return;
      e.preventDefault(); // no native image drag: it would cancel the pointer
      const [kind, id] = d.dataset.drag.split(':');
      this.hotbar.drag({ kind, id }, e);
    });
    inv.onChange(() => { if (this.mode) this.render(); });
  }

  get open() { return this.mode !== null; }

  show(mode) {
    this.mode = mode;
    this.selected = null;
    this.render();
    this.root.classList.add('show');
    this.hooks.ui?.();
    this.openedAt = performance.now();
    this.hooks.opened?.(mode);
  }

  close() {
    if (!this.mode) return;
    this.mode = null;
    this.root.classList.remove('show');
    this.hooks.closed?.();
  }

  // the bag button closes the window from either of its tabs
  talkTo(npc) {
    this.npc = npc;
    this.show('talk');
  }

  toggle(mode) { this.mode === mode || (mode === 'bag' && this.mode === 'hero') ? this.close() : this.show(mode); }

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
        ? `<button class="slot${this.selected === s.id && side === 'bag' ? ' sel' : ''}" data-act="slot" data-side="${side}" data-id="${s.id}"${side === 'bag' && ITEMS[s.id].usable ? ` data-drag="item:${s.id}"` : ''}>${icon(s.id)}<b>${s.n}</b></button>`
        : '<div class="slot empty"></div>';
    }
    return h + '</div>';
  }

  // Bag and Hero share one window with two tabs
  tabs() {
    const tab = (mode, label, dot) => `<button data-act="tab" data-mode="${mode}" class="${this.mode === mode ? 'on' : ''}">${label}${dot ? '<i></i>' : ''}</button>`;
    return `<header><nav class="tabs">${tab('bag', 'Bag')}${tab('hero', 'Hero', this.prog.points > 0)}</nav>`
      + `<button class="x snd" data-act="sound" aria-label="Toggle sound">${this.hooks.soundOn?.() ? '♪' : '♪̸'}</button><button class="x" data-act="close" aria-label="Close">✕</button></header>`;
  }

  hero() {
    const p = this.prog, pl = this.player, g = this.inv.gear;
    const pct = p.maxed ? 100 : Math.floor((p.xp / p.need) * 100);
    let h = `<div class="herowrap"><div class="hero">
      <div class="lvbox"><b>Level ${p.level}</b><span>${p.maxed ? 'Max level' : `${Math.floor(p.xp)} / ${p.need} XP`}</span><div class="xpbar"><i style="width:${pct}%"></i></div></div>
      <div class="pts ${p.points ? 'has' : ''}">${p.points ? `${p.points} stat point${p.points > 1 ? 's' : ''} to spend` : 'Level up to earn stat points'}</div>`;
    for (const [k, st] of Object.entries(STATS)) {
      h += `<div class="stat"><b>${st.name}</b><span class="v">${p.stats[k]}</span><small>${esc(st.desc)}</small><button class="plus" data-act="raise" data-stat="${k}" ${p.points ? '' : 'disabled'} aria-label="Raise ${st.name}">+</button></div>`;
    }
    h += `<div class="sum">Damage ${+pl.damage.toFixed(2)} · ${+pl.attackSpeed.toFixed(2)} swings/s · ${pl.maxHp / 2} hearts · speed ${Math.round(pl.speedMul * 100)}%</div></div>`;
    h += '<div class="charms"><h3>Skills</h3>';
    for (const [id, sk] of Object.entries(SKILLS)) {
      const on = this.hotbar?.has('skill', id);
      h += `<div class="charm skill" data-drag="skill:${id}">${icon(sk.icon)}<div class="rtext"><b>${esc(sk.name)}</b><small>${esc(sk.desc)}</small></div><span class="tag">${on ? 'On hotbar' : 'Drag to hotbar'}</span></div>`;
    }
    h += '<h3>Charm</h3>';
    for (const [id, c] of Object.entries(CHARMS)) {
      const own = g.charms.includes(id), on = g.charm === id;
      const r = RECIPES.find((x) => x.charm === id);
      const btn = !own ? '' : on ? '<button class="go" data-act="wear" data-id="">Take off</button>' : `<button class="go" data-act="wear" data-id="${id}">Wear</button>`;
      h += `<div class="charm ${own ? '' : 'off'} ${on ? 'on' : ''}">${icon('charm_' + id)}<div class="rtext"><b>${esc(c.name)}</b><small>${own ? esc(c.desc) : `Craft at the campfire · Lv ${r.lv}`}</small></div>${btn}</div>`;
    }
    return h + '</div></div>';
  }

  reward(r) {
    const items = Object.entries(r.items || {}).map(([id, n]) => `<span class="cost ok">${icon(id, 'sm')}${n} ${esc(ITEMS[id].name)}</span>`).join('');
    return `<div class="costs"><span class="cost ok">★ ${r.xp} XP</span>${items}</div>`;
  }

  talk() {
    const n = NPCS[this.npc], st = this.quests.status(this.npc, this.prog.level, this.inv);
    let text, box = '', btns = '<button class="go soft" data-act="close">Bye</button>';
    if (st.state === 'offer') {
      const first = st.id === n.quests[0];
      text = (first ? n.hello + ' ' : '') + st.q.intro;
      box = `<b>${esc(st.q.title)}</b><small>${esc(this.quests.goal(st.q))}</small>${this.reward(st.q.reward)}`;
      btns = `<button class="go soft" data-act="close">Not now</button><button class="go" data-act="accept" data-id="${st.id}">Accept</button>`;
    } else if (st.state === 'active') {
      text = `Any luck? ${this.quests.goal(st.q)}.`;
      box = `<b>${esc(st.q.title)}</b><small>${esc(this.quests.progress(st.id, this.inv))}</small>${this.reward(st.q.reward)}`;
    } else if (st.state === 'ready') {
      text = st.q.thanks;
      box = `<b>${esc(st.q.title)} ✓</b>${this.reward(st.q.reward)}`;
      btns = `<button class="go" data-act="handin" data-id="${st.id}">Hand in</button>`;
    } else if (st.state === 'locked') text = n.later(st.q.lv);
    else text = n.bye;
    return `<header><h2>${esc(n.name)}</h2><span class="sub"></span><button class="x" data-act="close" aria-label="Close">✕</button></header>
      <div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>${esc(text)}</p>${box ? `<div class="qbox">${box}</div>` : ''}<div class="btnrow">${btns}</div></div></div>`;
  }

  render() {
    const inv = this.inv, g = inv.gear;
    let body = '';
    if (this.mode === 'talk') body = this.talk();
    else if (this.mode === 'hero') body = this.tabs() + this.hero();
    else if (this.mode === 'bag') {
      const sel = this.selected && ITEMS[this.selected];
      body = `
        ${this.tabs()}
        <div class="bagwrap">
          <div class="gear">
            <div class="g">${icon('weapon' + g.weapon)}<div><small>Weapon</small>${WEAPONS[g.weapon].name}<em>${WEAPONS[g.weapon].dmg} dmg · ${WEAPONS[g.weapon].spd}/s</em></div></div>
            <div class="g">${icon('armor' + g.armor)}<div><small>Armor</small>${ARMORS[g.armor].name}<em>+${ARMORS[g.armor].hearts} hearts</em></div></div>
            <div class="g ${g.torch ? '' : 'off'}">${icon('torch')}<div><small>Tool</small>${g.torch ? 'Torch' : 'No torch'}</div></div>
            <div class="g ${g.boots ? '' : 'off'}">${icon('boots')}<div><small>Feet</small>${g.boots ? 'Swift Boots' : 'Old boots'}</div></div>
            <div class="g ${g.charm ? '' : 'off'}">${icon('charm_' + (g.charm || 'sprout'))}<div><small>Charm</small>${g.charm ? CHARMS[g.charm].name : 'None'}</div></div>
          </div>
          <div class="bagright">
            ${this.grid(inv.bag, BAG_SLOTS, 'bag')}
            <div class="detail">${sel
              ? `<b>${esc(sel.name)}</b> <span>${esc(sel.desc)}${sel.from ? ' Dropped by ' + esc(sel.from) + '.' : ''}</span>${sel.usable ? ' Drag it onto the hotbar to use it quickly.<button class="go" data-act="use">Use</button>' : ''}`
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
          : st === 'level' ? `<span class="tag">Needs Lv ${r.lv}</span>`
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
    if (act === 'sound') { this.hooks.toggleSound?.(); this.render(); }
    if (act === 'tab') { this.mode = t.dataset.mode; this.selected = null; this.hooks.ui?.(); this.render(); }
    if (act === 'raise' && this.prog.raise(t.dataset.stat)) { this.hooks.raised?.(t.dataset.stat); this.render(); }
    if (act === 'accept') this.hooks.accept?.(t.dataset.id);
    if (act === 'handin') this.hooks.handIn?.(t.dataset.id);
    if (act === 'wear') { inv.wear(t.dataset.id || null); this.hooks.ui?.(); }
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
