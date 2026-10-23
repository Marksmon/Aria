// Ragnarok-style windows: Items, Equipment, Skills and Status, plus the campfire, the camp chest
// and villager dialogue. Each is a small window you drag by its title bar; several can be open
// at once and the game keeps running behind them. Positions are remembered per device.
// Pickup toasts and messages live here too. Plain DOM over the canvas.
import { ITEMS, RECIPES, SLOTS, equipLine, iconURL } from './items.js';
import { BAG_SLOTS, CHEST_SLOTS } from './inventory.js';
import { STATS, STAT_KEYS, JOBS } from './progress.js';
import { NPCS } from './quests.js';
import { SKILLS, skillList, skillLv, learnBlock, spCost } from './skills.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = '') => `<img class="ico ${cls}" src="${iconURL(id)}" alt="">`;

// window id -> title, default spot (fraction of the screen: centre x, top y) and width
const WINDOWS = {
  items:  { title: 'Items',      at: [0.80, 0.30], w: 236 },
  equip:  { title: 'Equipment',  at: [0.50, 0.16], w: 260 },
  skills: { title: 'Skills',     at: [0.80, 0.18], w: 290 },
  status: { title: 'Status',     at: [0.19, 0.30], w: 300 },
  craft:  { title: 'Campfire',   at: [0.50, 0.14], w: 300 },
  chest:  { title: 'Camp Chest', at: [0.50, 0.16], w: 320 },
  talk:   { title: '',           at: [0.50, 0.22], w: 320 },
};
const POS_KEY = 'aria.windows';

export class Menus {
  constructor(inv, prog, player, hooks) {
    this.inv = inv;
    this.prog = prog;
    this.player = player;
    this.hooks = hooks; // { useItem(id), learn(id), jobChange(), crafted(recipe), equipped(), raised(stat), accept(id), handIn(id), ui(), closed() }
    this.quests = null;     // set by the game, for villager dialogue
    this.portrait = null;   // villager id (or 'player') -> image URL
    this.hotbar = null;     // set by the game: skills and usable items drag onto it
    this.npc = null;
    this.selected = null;   // item picked in the Items window
    this.tab = 'use';       // Items window tab: use, equip or misc
    this.wins = {};         // id -> element, while open
    this.layer = document.getElementById('windows');
    this.toasts = document.getElementById('toasts');
    this.top = 30;
    try { this.pos = JSON.parse(localStorage.getItem(POS_KEY)) || {}; } catch { this.pos = {}; }
    inv.onChange(() => this.render());
  }

  // any window open (the game keeps running behind them)
  get open() { return Object.keys(this.wins).length > 0; }
  isOpen(id) { return !!this.wins[id]; }

  show(id) {
    if (!WINDOWS[id]) return;
    if (!this.wins[id]) this.build(id);
    this.raise(this.wins[id]);
    this.render(id);
    this.hooks.ui?.();
  }

  toggle(id) { this.wins[id] ? this.close(id) : this.show(id); }

  // close one window, or all of them
  close(id) {
    for (const k of id ? [id] : Object.keys(this.wins)) {
      this.wins[k]?.remove();
      delete this.wins[k];
    }
    this.hooks.closed?.();
  }

  talkTo(npc) {
    this.npc = npc;
    this.show('talk');
  }

  build(id) {
    const def = WINDOWS[id];
    const el = document.createElement('div');
    el.className = `rw rw-${id} ui-click`;
    el.style.width = `min(${def.w}px, calc(100vw - 16px))`;
    el.innerHTML = `<div class="rw-bar"><span class="rw-title">${esc(def.title)}</span><button class="rw-x" data-act="close" aria-label="Close">×</button></div><div class="rw-body"></div>`;
    this.layer.appendChild(el);
    this.wins[id] = el;
    el.addEventListener('pointerdown', (e) => {
      this.raise(el);
      const d = e.target.closest('[data-drag]'), b = e.target.closest('button');
      if (d && this.hotbar && (!b || b === d)) { // not from a button inside it (a skill's ▲)
        e.preventDefault(); // no native image drag: it would cancel the pointer
        const [kind, iid] = d.dataset.drag.split(':');
        this.hotbar.drag({ kind, id: iid }, e);
      }
    });
    el.addEventListener('click', (e) => this.click(e, id));
    this.dragBar(el, id);
    // where it was left, else its default spot; always kept on screen
    requestAnimationFrame(() => {
      const saved = this.pos[id];
      const W = window.innerWidth, H = window.innerHeight;
      if (saved) this.place(el, saved[0] * W, saved[1] * H);
      else this.place(el, def.at[0] * W - el.offsetWidth / 2, def.at[1] * H);
    });
  }

  place(el, x, y) {
    const W = window.innerWidth, H = window.innerHeight;
    el.style.left = Math.max(0, Math.min(W - el.offsetWidth, x)) + 'px';
    el.style.top = Math.max(0, Math.min(H - 28, y)) + 'px';
    el.style.maxHeight = (H - el.offsetTop - 6) + 'px'; // long windows scroll instead of running off screen
  }

  raise(el) { el.style.zIndex = ++this.top; }

  // drag a window by its title bar
  dragBar(el, id) {
    el.querySelector('.rw-bar').addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      const ox = e.clientX - el.offsetLeft, oy = e.clientY - el.offsetTop;
      const move = (ev) => this.place(el, ev.clientX - ox, ev.clientY - oy);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        this.pos[id] = [el.offsetLeft / window.innerWidth, el.offsetTop / window.innerHeight];
        try { localStorage.setItem(POS_KEY, JSON.stringify(this.pos)); } catch { /* storage unavailable */ }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

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
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  }

  // ---------- window contents ----------
  // a grid of item slots; padded with empty cells to whole rows
  grid(slots, side, min = 12) {
    let h = `<div class="rgrid" data-side="${side}">`;
    const cells = Math.max(min, Math.ceil(slots.length / 6) * 6);
    for (let i = 0; i < cells; i++) {
      const s = slots[i], it = s && ITEMS[s.id];
      h += s
        ? `<button class="rslot${this.selected === s.id && side === 'bag' ? ' sel' : ''}" data-act="slot" data-side="${side}" data-id="${s.id}"${side === 'bag' && it.usable ? ` data-drag="item:${s.id}"` : ''} title="${esc(it.name)}">${icon(s.id)}${it.type === 'equip' ? '' : `<b>${s.n}</b>`}</button>`
        : '<div class="rslot empty"></div>';
    }
    return h + '</div>';
  }

  // Ragnarok's item window: Usables, Equips and Miscs tabs
  items() {
    const inv = this.inv, tabs = { use: 'Usables', equip: 'Equips', misc: 'Miscs' };
    const sel = this.selected && inv.bag.count(this.selected) ? ITEMS[this.selected] : null;
    let act = '';
    if (sel?.usable) act = '<button class="rbtn" data-act="use">Use</button>';
    if (sel?.type === 'equip') act = '<button class="rbtn" data-act="equip">Equip</button>';
    const line = sel?.type === 'equip' ? `<span class="rstat">${esc(SLOTS[sel.slot])}${equipLine(sel) ? ' · ' + equipLine(sel) : ''}</span>` : '';
    return `<div class="rtabs">${Object.entries(tabs).map(([k, n]) => `<button class="rtab${this.tab === k ? ' on' : ''}" data-act="tab" data-id="${k}">${n}</button>`).join('')}</div>
      ${this.grid(inv.bag.ofType(this.tab), 'bag')}
      <div class="rdetail">${sel
        ? `<b>${esc(sel.name)}</b>${line}<span>${esc(sel.desc)}${sel.from ? ' Dropped by ' + esc(sel.from) + '.' : ''}${sel.usable ? ' Drag it onto the hotbar to use it quickly.' : ''}</span>${act}`
        : '<span>Tap an item to see what it is.</span>'}</div>
      <div class="rfoot"><span>${inv.bag.slots.length} / ${BAG_SLOTS} slots</span></div>`;
  }

  // Ragnarok's equipment window: worn pieces down both sides of the character, names facing in.
  // Tap a piece to take it off; equip from the Equips tab of the Items window.
  equip() {
    const g = this.inv.gear;
    const slot = (label, key, side) => {
      const id = key && g[key], it = id && ITEMS[id];
      if (!it) return `<div class="eq ${side} off"><i></i><span>${label}</span></div>`;
      return `<button class="eq ${side}" data-act="unequip" data-id="${key}" title="${esc(it.name)}${equipLine(it) ? ' · ' + equipLine(it) : ''} (tap to take off)">${icon(id, 'eqi')}<span>${esc(it.name)}</span></button>`;
    };
    const left = [slot('head', 'head', 'l'), slot('mid head', null, 'l'), slot('armor', 'armor', 'l'), slot('weapon', 'weapon', 'l'), slot('accessory', 'acc', 'l')];
    const right = [slot('low head', null, 'r'), slot('garment', null, 'r'), slot('shield', null, 'r'), slot('shoes', 'shoes', 'r'), slot('light', 'light', 'r')];
    return `<div class="equipwrap"><div class="ecol">${left.join('')}</div><div class="eme"><img src="${this.portrait?.('player') || ''}" alt=""></div><div class="ecol">${right.join('')}</div></div>
      <div class="rfoot"><span>Tap a piece to take it off</span></div>`;
  }

  // Ragnarok's skill window: the job's tree with levels, SP costs and a raise button
  skills() {
    const p = this.prog;
    let h = '', group = null;
    for (const id of skillList(p.job)) {
      const sk = SKILLS[id], lv = skillLv(p, id), block = learnBlock(p, id);
      if (sk.job !== group) { group = sk.job; h += `<div class="rsub">${esc(JOBS[group].name)}</div>`; }
      const active = sk.kind === 'active';
      let tag = '';
      if (sk.free && !lv) tag = `Job Lv ${sk.free.jobLv}`;
      else if (sk.granted && !lv) tag = Object.entries(sk.needs).map(([k, n]) => `${SKILLS[k].name} ${n}`).join(', ');
      else if (active && lv) tag = this.hotbar?.has('skill', id) ? 'On hotbar' : 'Drag to hotbar';
      else if (block && block !== 'points' && block !== 'max' && block !== 'job' && block !== 'free') tag = block;
      const cost = active && spCost(id, Math.max(1, lv)) ? ` · SP ${spCost(id, Math.max(1, lv))}` : '';
      const lvTxt = sk.max > 1 ? `Lv ${lv} / ${sk.max}` : lv ? 'Learnt' : '';
      h += `<div class="ritem skill ${lv ? '' : 'off'}"${active && lv ? ` data-drag="skill:${id}"` : ''}>${icon(sk.icon, 'sm')}
        <div><b>${esc(sk.name)} <span class="lvl">${lvTxt}</span></b><small>${esc(sk.desc(Math.max(1, lv)))}${sk.kind === 'passive' ? ' (passive)' : ''}${cost}</small>${tag ? `<span class="rtag">${esc(tag)}</span>` : ''}</div>
        ${!block ? `<button class="splus big" data-act="learn" data-id="${id}" aria-label="Raise ${esc(sk.name)}">▲</button>` : ''}</div>`;
    }
    return `<div class="rlist">${h}</div><div class="rfoot"><span>${esc(JOBS[p.job].name)} · Job Lv ${p.jobLv}</span><span>Skill Points <b>${p.skillPoints}</b></span></div>`;
  }

  // Ragnarok's status window: stats (value + job bonus, raise button, cost) beside the battle numbers
  status() {
    const p = this.prog, ps = this.player.ps, pts = p.statPoints, knl = p.total('knl');
    const stat = (k) => {
      const st = STATS[k], cost = p.costOf(k), bonus = p.bonus(k), can = cost <= pts && p.stats[k] < 99;
      return `<th title="${esc(st.full)}: ${esc(st.desc)}">${st.name[0] + st.name.slice(1).toLowerCase()}</th><td class="sv">${p.stats[k]}${bonus ? `+${bonus}` : ''}</td>
        <td class="sc"><button class="splus" data-act="raise" data-stat="${k}" ${can ? '' : 'disabled'} aria-label="Raise ${st.full}">▲</button>${cost}</td>`;
    };
    const d = (label, v) => `<th>${label}</th><td>${v}</td>`;
    const rows = [
      [d('Atk', `${ps.batk} + ${ps.watk}`), d('Def', `${ps.def} + ${ps.end}`)],
      [d('Matk', `${knl + Math.floor(knl / 7) ** 2} ~ ${knl + Math.floor(knl / 5) ** 2}`), d('Mdef', `0 + ${ps.mdef}`)],
      [d('Hit', ps.hit), d('Flee', `${ps.flee} + ${Math.floor(ps.dodge)}`)],
      [d('Critical', Math.floor(ps.crit)), d('Aspd', ps.aspd)],
      [`<th colspan="2" class="pts">Status Point <b>${pts}</b></th>`, d('Job', esc(JOBS[p.job].name))],
      [d('Base Lv', p.baseLv), d('Job Lv', p.jobLv)],
    ];
    return `<table class="stt"><tbody>${STAT_KEYS.map((k, i) => `<tr>${stat(k)}<td class="gap"></td>${rows[i][0]}${rows[i][1]}</tr>`).join('')}</tbody></table>`;
  }

  craft() {
    const inv = this.inv;
    let h = '<div class="rnote">Uses items from your bag and the chest. What you craft goes in your bag.</div><div class="rlist recipes">';
    for (const r of RECIPES) {
      const st = inv.recipeState(r), it = ITEMS[r.item];
      const cost = Object.entries(r.cost).map(([id, n]) => {
        const have = inv.have(id);
        return `<span class="cost ${have >= n ? 'ok' : ''}" title="${esc(ITEMS[id].name)}">${icon(id, 'xs')}${Math.min(have, 99)}/${n}</span>`;
      }).join('');
      const btn = st === 'level' ? `<span class="rtag">Base Lv ${r.lv}</span>`
        : `<button class="rbtn" data-act="craft" data-id="${r.item}" ${st === 'ready' ? '' : 'disabled'}>Craft</button>`;
      const what = it.type === 'equip' ? [SLOTS[it.slot], equipLine(it), it.fx ? it.desc : ''].filter(Boolean).join(' · ') : it.desc;
      h += `<div class="ritem recipe ${st}">${icon(r.item, 'sm')}<div><b>${esc(it.name)}</b><small>${esc(what)}</small><div class="costs">${cost}</div></div>${btn}</div>`;
    }
    return h + '</div>';
  }

  chest() {
    const inv = this.inv;
    return `<div class="rnote">Tap an item to move the whole stack.</div><div class="chestwrap2">
      <div><div class="rsub">Bag ${inv.bag.slots.length}/${BAG_SLOTS}</div>${this.grid(inv.bag.slots, 'bag', 18)}</div>
      <div><div class="rsub">Chest ${inv.chest.slots.length}/${CHEST_SLOTS}</div>${this.grid(inv.chest.slots, 'chest', 18)}</div></div>`;
  }

  reward(r) {
    const items = Object.entries(r.items || {}).map(([id, n]) => `<span class="cost ok">${icon(id, 'xs')}${n} ${esc(ITEMS[id].name)}</span>`).join('');
    return `<div class="costs"><span class="cost ok">${r.xp} Base EXP · ${r.job ?? Math.round(r.xp * 0.7)} Job EXP</span>${items}</div>`;
  }

  talk() {
    const n = NPCS[this.npc], st = this.quests.status(this.npc, this.prog.baseLv, this.inv), p = this.prog;
    let text, box = '', btns = '<button class="rbtn soft" data-act="close">Bye</button>';
    // the Elder makes Swordsmen: Novice Job Lv 10 with Wayfarer's Lore 9
    if (this.npc === 'bram' && p.job === 'novice' && p.jobLv >= 10) {
      const ready = skillLv(p, 'lore') >= 9;
      text = ready ? 'You have learnt all a Novice can. The way of the sword is open to you: will you take it?'
        : "You are nearly ready for the way of the sword. Learn all of the Wayfarer's Lore (Lv 9) first, then come back to me.";
      box = `<b>Job change: Swordsman</b><small>Sturdy fighters with more HP: Cleave, Rending Strike, War Cry, Stand Firm and Earthsplitter. Job Level starts again at 1.</small>`;
      if (ready) btns = `<button class="rbtn soft" data-act="close">Not yet</button><button class="rbtn" data-act="jobchange">Become a Swordsman</button>`;
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>${esc(text)}</p><div class="qbox">${box}</div><div class="btnrow">${btns}</div></div></div>`;
    }
    if (st.state === 'offer') {
      const first = st.id === n.quests[0];
      text = (first ? n.hello + ' ' : '') + st.q.intro;
      box = `<b>${esc(st.q.title)}</b><small>${esc(this.quests.goal(st.q))}</small>${this.reward(st.q.reward)}`;
      btns = `<button class="rbtn soft" data-act="close">Not now</button><button class="rbtn" data-act="accept" data-id="${st.id}">Accept</button>`;
    } else if (st.state === 'active') {
      text = `Any luck? ${this.quests.goal(st.q)}.`;
      box = `<b>${esc(st.q.title)}</b><small>${esc(this.quests.progress(st.id, this.inv))}</small>${this.reward(st.q.reward)}`;
    } else if (st.state === 'ready') {
      text = st.q.thanks;
      box = `<b>${esc(st.q.title)} ✓</b>${this.reward(st.q.reward)}`;
      btns = `<button class="rbtn" data-act="handin" data-id="${st.id}">Hand in</button>`;
    } else if (st.state === 'locked') text = n.later(st.q.lv);
    else text = n.bye;
    this.wins.talk.querySelector('.rw-title').textContent = n.name;
    return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
      <div class="say"><p>${esc(text)}</p>${box ? `<div class="qbox">${box}</div>` : ''}<div class="btnrow">${btns}</div></div></div>`;
  }

  // redraw one window, or every open one
  render(id) {
    for (const k of id ? [id] : Object.keys(this.wins)) {
      const el = this.wins[k];
      if (el) el.querySelector('.rw-body').innerHTML = this[k]();
    }
  }

  click(e, id) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act, inv = this.inv;
    if (act === 'close') this.close(id);
    if (act === 'raise' && this.prog.raise(t.dataset.stat)) { this.hooks.raised?.(t.dataset.stat); this.render(); }
    if (act === 'learn') this.hooks.learn?.(t.dataset.id);
    if (act === 'jobchange') this.hooks.jobChange?.();
    if (act === 'accept') this.hooks.accept?.(t.dataset.id);
    if (act === 'handin') this.hooks.handIn?.(t.dataset.id);
    if (act === 'tab') { this.tab = t.dataset.id; this.selected = null; this.render(id); }
    if (act === 'equip' && inv.equip(this.selected)) { this.selected = null; this.hooks.equipped?.(); }
    if (act === 'unequip') {
      if (inv.unequip(t.dataset.id)) this.hooks.equipped?.();
      else this.message('Bag is full');
    }
    if (act === 'slot') {
      if (id === 'chest') {
        const from = t.dataset.side === 'bag' ? inv.bag : inv.chest;
        const to = t.dataset.side === 'bag' ? inv.chest : inv.bag;
        if (!inv.moveStack(from, to, t.dataset.id)) this.message(to === inv.bag ? 'Bag is full' : 'Chest is full');
      } else {
        this.selected = t.dataset.id;
        this.render(id);
      }
    }
    if (act === 'use' && this.selected) this.hooks.useItem?.(this.selected);
    if (act === 'craft') {
      const r = RECIPES.find((x) => x.item === t.dataset.id);
      if (inv.craft(r)) { this.hooks.crafted?.(r); this.message(`Crafted ${ITEMS[r.item].name}. It's in your bag.`); }
      else this.message('Bag is full');
    }
  }
}
