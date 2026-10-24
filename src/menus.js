// Ragnarok-style windows: Items, Equipment, Skills and Status, plus crafting (Gunnar's forge and
// Ragna's herbs), the chest (camp and Steinborg storage), shops and dialogue. Each is a small window you drag by its title bar; several can be open
// at once and the game keeps running behind them. Positions are remembered per device.
// Pickup toasts and messages live here too. Plain DOM over the canvas.
import { ITEMS, RECIPES, SLOTS, SHOPS, PRICES, sellPrice, equipLine, iconURL, canWear, jobLine } from './items.js';
import { BAG_SLOTS, CHEST_SLOTS } from './inventory.js';
import { STATS, STAT_KEYS, JOBS } from './progress.js';
import { statCost } from './ro-tables.js';
import { HAIRSTYLES, DYES, hairstyles, lookPortrait } from './hair.js';
import { NPCS } from './quests.js';
import { ZONE_NAMES } from './world.js';
import { SKILLS, skillList, skillLv, learnBlock, spCost } from './skills.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = '') => `<img class="ico ${cls}" src="${iconURL(id)}" alt="">`;

// window id -> title, default spot (fraction of the screen: centre x, top y) and width
const WINDOWS = {
  items:  { title: 'Items',      at: [0.80, 0.30], w: 236 },
  equip:  { title: 'Equipment',  at: [0.50, 0.16], w: 260 },
  skills: { title: 'Skills',     at: [0.80, 0.18], w: 290 },
  status: { title: 'Status',     at: [0.19, 0.30], w: 300 },
  craft:  { title: 'Crafting',   at: [0.50, 0.14], w: 300 },
  chest:  { title: 'Storage',    at: [0.50, 0.16], w: 320 },
  shop:   { title: 'Shop',       at: [0.50, 0.14], w: 300 },
  talk:   { title: '',           at: [0.50, 0.22], w: 320 },
  story:  { title: '',           at: [0.50, 0.20], w: 340 },
  look:   { title: 'Your Look',  at: [0.50, 0.16], w: 260 },
};
const POS_KEY = 'aria.windows';

export class Menus {
  constructor(inv, prog, player, hooks) {
    this.inv = inv;
    this.prog = prog;
    this.player = player;
    this.hooks = hooks; // { useItem(id), learn(id), jobChange(job), crafted(recipe), traded(), equipped(), raised(stat), accept(id), handIn(id), ui(), closed() }
    this.quests = null;     // set by the game, for villager dialogue
    this.portrait = null;   // villager id (or 'player') -> image URL
    this.hotbar = null;     // set by the game: skills and usable items drag onto it
    this.npc = null;
    this.selected = null;   // item picked in the Items window
    this.tab = 'use';       // Items window tab: use, equip or misc
    this.craftKind = 'gear'; // crafting window: Gunnar's gear or Ragna's usables
    this.shopId = null;     // the shop open in the Shop window
    this.shopTab = 'buy';
    this.sellSel = null;
    this.pend = {};         // stat points placed with ▲ but not yet confirmed: stat -> how many
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

  finishStory() {
    const done = this.storyDone;
    this.storyDone = null;
    done?.();
  }

  toggle(id) { this.wins[id] ? this.close(id) : this.show(id); }

  // close one window, or all of them
  close(id) {
    let story = false;
    for (const k of id ? [id] : Object.keys(this.wins)) {
      if (k === 'story' && this.wins[k]) story = true;
      if (k === 'status') this.pend = {}; // points not confirmed are taken back
      if (k === 'look' && this.wins[k]) this.hooks.look?.(this.lookFrom); // trying on: the old look back
      this.wins[k]?.remove();
      delete this.wins[k];
    }
    this.hooks.closed?.();
    if (story) this.finishStory(); // however the story window closes, the story moves on
  }

  talkTo(npc) {
    this.npc = npc;
    this.ferrying = false; // the Ferryman's list of lands, once asked for
    this.show('talk');
  }

  // story pages: [[speaker id or null (the narrator), line], ...], one at a time; done() after the last
  story(pages, title, done) {
    this.storyPages = pages.length ? pages : [[null, '…']];
    this.storyAt = 0;
    this.storyDone = done;
    this.close('talk');
    this.show('story');
    this.wins.story.querySelector('.rw-title').textContent = title;
  }

  // the hair picker: a new character's look, or the Stylist's chair (mode 'new' | 'stylist')
  openLook(mode, look) {
    this.lookMode = mode;
    this.lookFrom = { ...look };
    this.lookDraft = { ...look };
    this.close('talk');
    this.show('look');
    this.wins.look.querySelector('.rw-title').textContent = mode === 'new' ? 'Your Look' : "Embla's Chair";
  }

  look() {
    const d = this.lookDraft, styles = hairstyles(), changed = d.hair !== this.lookFrom.hair || d.dye !== this.lookFrom.dye;
    const price = this.lookMode === 'stylist' ? 1000 : 0;
    return `<div class="lookwrap"><img class="lookpic" src="${lookPortrait(d, 96)}" alt="">
      <div class="lookrow"><button class="rbtn soft" data-act="lookhair" data-id="-1">◀</button><b>${esc(HAIRSTYLES[d.hair] || d.hair)}</b><button class="rbtn soft" data-act="lookhair" data-id="1">▶</button></div>
      <div class="swatches">${Object.entries(DYES).map(([k, v]) => `<button class="swatch${d.dye === k ? ' on' : ''}" data-act="lookdye" data-id="${k}" title="${esc(v.name)}" style="background:${v.swatch}"></button>`).join('')}</div>
      <small>${esc(DYES[d.dye].name)} · ${styles.length} hairstyles</small>
      <div class="btnrow">${this.lookMode === 'new' ? '' : '<button class="rbtn soft" data-act="close">Cancel</button>'}
        <button class="rbtn" data-act="lookok" ${this.lookMode === 'stylist' && (!changed || this.inv.perz < price) ? 'disabled' : ''}>${this.lookMode === 'new' ? 'Begin' : `Change · ${price.toLocaleString()} perz`}</button></div></div>`;
  }

  openShop(id) {
    this.shopId = id;
    this.shopTab = 'buy';
    this.sellSel = null;
    this.show('shop');
    this.wins.shop.querySelector('.rw-title').textContent = `${NPCS[id].name.split(' ')[0]}'s Shop`;
  }

  openCraft(kind) {
    this.craftKind = kind;
    this.show('craft');
    this.wins.craft.querySelector('.rw-title').textContent = kind === 'gear' ? "Gunnar's Forge" : "Ragna's Herbs";
    this.render('craft');
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
        ? `<button class="rslot${this.selected === s.id && side === 'bag' ? ' sel' : ''}${it.rare ? ' rare' : ''}" data-act="slot" data-side="${side}" data-id="${s.id}"${side === 'bag' && it.usable ? ` data-drag="item:${s.id}"` : ''} title="${esc(it.name)}">${icon(s.id)}${it.type === 'equip' ? '' : `<b>${s.n}</b>`}</button>`
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
    if (sel?.type === 'equip') act = canWear(this.selected, this.prog.job) ? '<button class="rbtn" data-act="equip">Equip</button>' : `<span class="rtag">${esc(jobLine(sel))}</span>`;
    const line = sel?.type === 'equip' ? `<span class="rstat">${esc(SLOTS[sel.slot])}${equipLine(sel) ? ' · ' + equipLine(sel) : ''} · ${esc(jobLine(sel))}</span>` : '';
    return `<div class="rtabs">${Object.entries(tabs).map(([k, n]) => `<button class="rtab${this.tab === k ? ' on' : ''}" data-act="tab" data-id="${k}">${n}</button>`).join('')}</div>
      ${this.grid(inv.bag.ofType(this.tab), 'bag')}
      <div class="rdetail">${sel
        ? `<b class="${sel.rare ? 'rare' : ''}">${esc(sel.name)}${sel.rare ? ' ✦' : ''}</b>${line}<span>${esc(sel.desc)}${sel.from ? ' Dropped by ' + esc(sel.from) + '.' : ''}${sel.usable ? ' Drag it onto the hotbar to use it quickly.' : ''}</span>${act}`
        : '<span>Tap an item to see what it is.</span>'}</div>
      <div class="rfoot"><span>${inv.bag.slots.length} / ${BAG_SLOTS} slots</span><span class="perz">${inv.perz.toLocaleString()} perz</span></div>`;
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
    const left = [slot('head', 'head', 'l'), slot('face', 'face', 'l'), slot('armor', 'armor', 'l'), slot('weapon', 'weapon', 'l'), slot('accessory', 'acc', 'l')];
    const right = [slot('garment', 'garment', 'r'), slot('shield', 'shield', 'r'), slot('shoes', 'shoes', 'r'), slot('accessory', 'acc2', 'r'), slot('light', 'light', 'r')];
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

  // The status window, top to bottom: who you are (job and levels), the six stats with their
  // job bonus, ▲ and cost under the points left to spend, then the battle numbers in pairs.
  // stat points placed but not locked in yet, and what they cost
  pendCost() {
    let c = 0;
    for (const [k, n] of Object.entries(this.pend)) for (let i = 0; i < n; i++) c += statCost(this.prog.stats[k] + i);
    return c;
  }
  pendCount() { return Object.values(this.pend).reduce((a, b) => a + b, 0); }

  status() {
    const p = this.prog, ps = this.player.ps, pts = p.statPoints - this.pendCost(), knl = p.total('knl');
    const stat = (k) => {
      const st = STATS[k], add = this.pend[k] || 0, v = p.stats[k] + add, cost = statCost(v), bonus = p.bonus(k), can = cost <= pts && v < 99;
      return `<tr class="${add ? 'pending' : ''}"><th title="${esc(st.full)}: ${esc(st.desc)}">${st.name}<small>${esc(st.full)}</small></th><td class="sv">${v}${bonus ? `<em>+${bonus}</em>` : ''}${add ? `<i>(+${add})</i>` : ''}</td>
        <td class="sc"><button class="splus" data-act="raise" data-stat="${k}" ${can ? '' : 'disabled'} aria-label="Raise ${st.full}">▲</button>${cost}</td></tr>`;
    };
    const d = (label, v) => `<th>${label}</th><td>${v}</td>`;
    const battle = [
      [d('Atk', `${ps.batk} + ${ps.watk}`), d('Matk', `${knl + Math.floor(knl / 7) ** 2} ~ ${knl + Math.floor(knl / 5) ** 2}`)],
      [d('Def', `${ps.def} + ${ps.end}`), d('Mdef', `0 + ${ps.mdef}`)],
      [d('Hit', ps.hit), d('Flee', `${ps.flee} + ${Math.floor(ps.dodge)}`)],
      [d('Critical', Math.floor(ps.crit)), d('Aspd', ps.aspd)],
    ];
    const n = this.pendCount();
    return `<div class="sthead"><b>${esc(JOBS[p.job].name)}</b><span>Base Lv <b>${p.baseLv}</b></span><span>Job Lv <b>${p.jobLv}</b></span></div>
      <div class="rsub stsub"><span>Stats</span><span>Status Point <b>${pts}</b></span></div>
      <table class="stt stats"><tbody>${STAT_KEYS.map(stat).join('')}</tbody></table>
      <div class="strow"><span class="rtag">${n ? `${n} point${n === 1 ? '' : 's'} placed, not locked in yet` : 'Tap ▲ to place points, then Confirm'}</span>
        <button class="rbtn soft" data-act="statreset" ${n ? '' : 'disabled'}>Reset</button><button class="rbtn" data-act="statconfirm" ${n ? '' : 'disabled'}>Confirm</button></div>
      <div class="rsub stsub"><span>Battle</span></div>
      <table class="stt battle"><tbody>${battle.map((r) => `<tr>${r[0]}<td class="gap"></td>${r[1]}</tr>`).join('')}</tbody></table>`;
  }

  craft() {
    const inv = this.inv, gear = this.craftKind === 'gear';
    let h = `<div class="rnote">${gear ? 'Gunnar forges weapons, armor and charms.' : 'Ragna brews potions and feathers.'} Uses items from your bag and storage; what is made goes in your bag.</div><div class="rlist recipes">`;
    for (const r of RECIPES) {
      if ((ITEMS[r.item].type === 'equip') !== gear) continue;
      const st = inv.recipeState(r), it = ITEMS[r.item];
      const cost = Object.entries(r.cost).map(([id, n]) => {
        const have = inv.have(id);
        return `<span class="cost ${have >= n ? 'ok' : ''}" title="${esc(ITEMS[id].name)}">${icon(id, 'xs')}${Math.min(have, 99)}/${n}</span>`;
      }).join('');
      const btn = st === 'level' ? `<span class="rtag">Base Lv ${r.lv}</span>`
        : `<button class="rbtn" data-act="craft" data-id="${r.item}" ${st === 'ready' ? '' : 'disabled'}>Craft</button>`;
      const what = it.type === 'equip' ? [SLOTS[it.slot], equipLine(it), it.fx ? it.desc : '', it.jobs ? jobLine(it) : ''].filter(Boolean).join(' · ') : it.desc;
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
    return `<div class="costs"><span class="cost ok">${r.xp} Base EXP · ${r.job ?? Math.round(r.xp * 0.7)} Job EXP</span>${r.perz ? `<span class="cost ok">${r.perz.toLocaleString()} perz</span>` : ''}${items}</div>`;
  }

  // a Steinborg shop: buy at the shop's price, sell anything for half
  shop() {
    const inv = this.inv, tabs = { buy: 'Buy', sell: 'Sell' };
    let h = `<div class="rtabs">${Object.entries(tabs).map(([k, n]) => `<button class="rtab${this.shopTab === k ? ' on' : ''}" data-act="shoptab" data-id="${k}">${n}</button>`).join('')}</div>`;
    if (this.shopTab === 'buy') {
      h += '<div class="rlist">';
      for (const id of SHOPS[this.shopId] || []) {
        const it = ITEMS[id], p = PRICES[id], stack = it.type !== 'equip';
        const what = it.type === 'equip' ? [SLOTS[it.slot], equipLine(it), jobLine(it)].filter(Boolean).join(' · ') : it.desc;
        h += `<div class="ritem">${icon(id, 'sm')}<div><b>${esc(it.name)}</b><small>${esc(what)}</small><span class="rtag price">${p.toLocaleString()} perz</span></div>
          <div class="btncol"><button class="rbtn" data-act="buy" data-id="${id}" data-n="1" ${inv.perz >= p ? '' : 'disabled'}>Buy</button>${stack ? `<button class="rbtn soft" data-act="buy" data-id="${id}" data-n="10" ${inv.perz >= p * 10 ? '' : 'disabled'}>×10</button>` : ''}</div></div>`;
      }
      h += '</div>';
    } else {
      const sel = this.sellSel && inv.bag.count(this.sellSel) ? this.sellSel : null, it = sel && ITEMS[sel];
      h += this.grid(inv.bag.slots, 'sell', 18);
      h += `<div class="rdetail">${it
        ? `<b class="${it.rare ? 'rare' : ''}">${esc(it.name)}</b><span>${sellPrice(sel) ? `Sells for ${sellPrice(sel).toLocaleString()} perz each · you have ${inv.bag.count(sel)}` : "The shop won't buy this."}</span>
          ${sellPrice(sel) ? `<div class="btnrow"><button class="rbtn" data-act="sell" data-n="1">Sell 1</button>${inv.bag.count(sel) > 1 ? `<button class="rbtn soft" data-act="sell" data-n="all">Sell all</button>` : ''}</div>` : ''}`
        : '<span>Tap an item in your bag to sell it. Worn gear is not for sale.</span>'}</div>`;
    }
    return h + `<div class="rfoot"><span>Bag ${inv.bag.slots.length}/${BAG_SLOTS}</span><span class="perz">${inv.perz.toLocaleString()} perz</span></div>`;
  }

  talk() {
    const n = NPCS[this.npc], st = this.quests.status(this.npc, this.prog, this.inv), p = this.prog;
    let text, box = '', btns = '<button class="rbtn soft" data-act="close">Bye</button>';
    // what else they do: trade and craft
    const extra = (n.stylist ? '<button class="rbtn" data-act="stylist">Change my look</button>' : '')
      + (n.shop ? '<button class="rbtn" data-act="shop">Buy / Sell</button>' : '')
      + (n.craft ? `<button class="rbtn" data-act="craftwin" data-id="${n.craft}">${n.craft === 'gear' ? 'Forge gear' : 'Brew usables'}</button>` : '')
      + (n.heal ? '<button class="rbtn" data-act="heal">Heal me</button>' : '')
      + (n.warp ? '<button class="rbtn" data-act="ferrylist">Travel</button>' : '');
    if (n.warp && this.ferrying) { // the lands you have walked, and the fare to each
      const list = this.hooks.ferryList?.() || [];
      const rows = list.map(([m, fare]) => `<button class="rbtn" data-act="ferry" data-id="${m}" ${this.inv.perz < fare ? 'disabled' : ''}>${esc(ZONE_NAMES[m])} · ${fare.toLocaleString()} perz</button>`).join('');
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>Where to? You have ${this.inv.perz.toLocaleString()} perz.</p><div class="btnrow wrap">${rows || '<span>You have not walked any other land yet.</span>'}</div>
        <div class="btnrow"><button class="rbtn soft" data-act="close">Bye</button></div></div></div>`;
    }
    if (st.state === 'job') { // the trial is done: the job change
      text = `You passed. Will you walk the path of the ${JOBS[n.job].name}?`;
      box = n.job === 'mage'
        ? '<b>Job change: Sorcerer</b><small>Casters who strike from afar with KNL: Ember Bolt, Frost Shard, Arc Lightning, Flame Ring, Rune Ward and Blink. Low HP, lots of SP. Job Level starts again at 1.</small>'
        : '<b>Job change: Blader</b><small>Sturdy sword fighters with more HP: Cleave, Heavy Strike, War Cry, Stand Firm and Ground Slash. Job Level starts again at 1.</small>';
      btns = `<button class="rbtn soft" data-act="close">Not yet</button><button class="rbtn" data-act="jobchange" data-id="${n.job}">Become a ${JOBS[n.job].name}</button>`;
    } else if (st.state === 'offer') {
      const first = st.id === n.quests[0] || st.id === n.trial;
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
    else text = n.quests.length || n.trial ? n.bye : n.hello; // people with no quests just say hello
    // a Trainee not yet ready for a trial hears what it takes; the Elder points ready Trainees to the city
    if (p.job === 'novice' && n.trialHint && (st.state === 'finished' || st.state === 'locked')) text = n.trialHint;
    if (p.job === 'novice' && n.ready && p.jobLv >= 10 && skillLv(p, 'basics') >= 9 && ['finished', 'locked', 'active'].includes(st.state)) text = n.ready;
    if (extra && st.state !== 'job' && st.state !== 'offer' && st.state !== 'ready') btns = extra + btns;
    this.wins.talk.querySelector('.rw-title').textContent = n.name;
    return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
      <div class="say"><p>${esc(text)}</p>${box ? `<div class="qbox">${box}</div>` : ''}<div class="btnrow">${btns}</div></div></div>`;
  }

  storyPage() {
    const [who, line] = this.storyPages[this.storyAt], last = this.storyAt >= this.storyPages.length - 1;
    const pic = who ? `<img class="portrait" src="${this.portrait(who)}" alt="">` : '<div class="portrait narr">✦</div>';
    return `<div class="talkwrap story">${pic}<div class="say">${who ? `<b class="who">${esc(NPCS[who].name)}</b>` : ''}<p class="${who ? '' : 'narr'}">${esc(line)}</p>
      <div class="btnrow"><span class="rtag">${this.storyAt + 1} / ${this.storyPages.length}</span><button class="rbtn" data-act="storynext">${last ? 'Continue' : 'Next ▸'}</button></div></div></div>`;
  }

  // redraw one window, or every open one
  render(id) {
    for (const k of id ? [id] : Object.keys(this.wins)) {
      const el = this.wins[k];
      if (el) el.querySelector('.rw-body').innerHTML = k === 'story' ? this.storyPage() : this[k]();
    }
  }

  click(e, id) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act, inv = this.inv;
    if (act === 'close') this.close(id);
    if (act === 'lookhair') {
      const st = hairstyles(), i = st.indexOf(this.lookDraft.hair);
      this.lookDraft.hair = st[(i + +t.dataset.id + st.length) % st.length];
      this.hooks.look?.(this.lookDraft); this.hooks.ui?.(); this.render(id);
    }
    if (act === 'lookdye') { this.lookDraft.dye = t.dataset.id; this.hooks.look?.(this.lookDraft); this.hooks.ui?.(); this.render(id); }
    if (act === 'lookok') {
      const mode = this.lookMode;
      this.lookFrom = { ...this.lookDraft }; // kept: closing won't put the old look back
      this.close('look');
      this.hooks.lookDone?.(this.lookDraft, mode);
    }
    if (act === 'stylist') this.openLook('stylist', this.hooks.currentLook());
    if (act === 'storynext') {
      if (this.storyAt < this.storyPages.length - 1) { this.storyAt++; this.render('story'); this.hooks.ui?.(); } else this.close('story');
    }
    // ▲ only places a point; Confirm locks them all in, Reset takes back what isn't locked in
    if (act === 'raise') {
      const k = t.dataset.stat, v = this.prog.stats[k] + (this.pend[k] || 0);
      if (v < 99 && statCost(v) <= this.prog.statPoints - this.pendCost()) { this.pend[k] = (this.pend[k] || 0) + 1; this.hooks.ui?.(); this.render(id); }
    }
    if (act === 'statreset') { this.pend = {}; this.hooks.ui?.(); this.render(id); }
    if (act === 'statconfirm') {
      for (const [k, n] of Object.entries(this.pend)) for (let i = 0; i < n; i++) this.prog.raise(k);
      this.pend = {};
      this.hooks.raised?.();
      this.render();
    }
    if (act === 'learn') this.hooks.learn?.(t.dataset.id);
    if (act === 'jobchange') { this.hooks.jobChange?.(t.dataset.id); this.close('talk'); }
    if (act === 'shop') { this.close('talk'); this.openShop(this.npc); }
    if (act === 'craftwin') { this.close('talk'); this.openCraft(t.dataset.id); }
    if (act === 'heal') { this.hooks.heal?.(); this.close('talk'); }
    if (act === 'ferrylist') { this.ferrying = true; this.render('talk'); }
    if (act === 'ferry') this.hooks.ferry?.(t.dataset.id);
    if (act === 'shoptab') { this.shopTab = t.dataset.id; this.sellSel = null; this.render(id); }
    if (act === 'buy') {
      const n = +t.dataset.n;
      if (inv.buy(t.dataset.id, n)) { this.hooks.traded?.('buy'); this.message(`Bought ${n > 1 ? n + ' ' : ''}${ITEMS[t.dataset.id].name} for ${(PRICES[t.dataset.id] * n).toLocaleString()} perz`); }
      else this.message(inv.perz < PRICES[t.dataset.id] * n ? 'Not enough perz' : 'Bag is full');
    }
    if (act === 'sell' && this.sellSel) {
      const n = t.dataset.n === 'all' ? inv.bag.count(this.sellSel) : 1, got = sellPrice(this.sellSel) * n;
      if (inv.sell(this.sellSel, n)) { this.hooks.traded?.('sell'); this.message(`Sold for ${got.toLocaleString()} perz`); }
    }
    if (act === 'accept') this.hooks.accept?.(t.dataset.id);
    if (act === 'handin') this.hooks.handIn?.(t.dataset.id);
    if (act === 'tab') { this.tab = t.dataset.id; this.selected = null; this.render(id); }
    if (act === 'equip' && inv.equip(this.selected)) { this.selected = null; this.hooks.equipped?.(); }
    if (act === 'unequip') {
      if (inv.unequip(t.dataset.id)) this.hooks.equipped?.();
      else this.message('Bag is full');
    }
    if (act === 'slot') {
      if (id === 'shop') { this.sellSel = t.dataset.id; this.render(id); } else if (id === 'chest') {
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
