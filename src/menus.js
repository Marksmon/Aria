// Ragnarok-style windows: Items, Equipment, Skills and Status, plus crafting (Gunnar's forge and
// Ragna's herbs), the chest (camp and Steinborg storage), shops and dialogue. Each is a small window you drag by its title bar; several can be open
// at once and the game keeps running behind them. Positions are remembered per device.
// Pickup toasts and messages live here too. Plain DOM over the canvas.
import { ITEMS, RECIPES, SLOTS, SHOPS, PRICES, sellPrice, equipLine, iconURL, canWear, jobLine, recipeKind, upgradeLine, refineInfo, canEnchant, canInsert, ENCHANT, MAX_REFINE, enchantStep } from './items.js';
import { BAG_SLOTS, CHEST_SLOTS } from './inventory.js';
import { STATS, STAT_KEYS, JOBS, RATES } from './progress.js';
import { statCost } from './ro-tables.js';
import { HAIRSTYLES, DYES, hairstyles, lookPortrait } from './hair.js';
import { NPCS, QUESTS, giverOf, rewardOf, SERIES } from './quests.js';
import { ZONE_NAMES } from './world.js';
import { SKILLS, skillList, skillLv, learnBlock, spCost, WEAPON_NAMES, RETRAIN_COST } from './skills.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = '') => `<img class="ico ${cls}" src="${iconURL(id)}" alt="">`;

// window id -> title, default spot (fraction of the screen: centre x, top y) and width
const WINDOWS = {
  items:  { title: 'Items',      at: [0.80, 0.30], w: 271 },
  equip:  { title: 'Equipment',  at: [0.50, 0.16], w: 299 },
  skills: { title: 'Skills',     at: [0.80, 0.18], w: 334 },
  status: { title: 'Status',     at: [0.19, 0.30], w: 345 },
  craft:  { title: 'Crafting',   at: [0.50, 0.14], w: 345 },
  chest:  { title: 'Storage',    at: [0.50, 0.16], w: 368 },
  shop:   { title: 'Shop',       at: [0.50, 0.14], w: 345 },
  talk:   { title: '',           at: [0.50, 0.22], w: 368 },
  story:  { title: '',           at: [0.50, 0.20], w: 391 },
  look:   { title: 'Your Look',  at: [0.50, 0.16], w: 299 },
  smith:  { title: '',           at: [0.50, 0.12], w: 368 },
  quest:  { title: 'Quest',      at: [0.50, 0.16], w: 368 },
};
// the smith window's three jobs: Holger's refining, Seyla's slots, pressing in a card
const SMITHS = {
  refine: { title: "Holger's Anvil", button: 'Refine gear' },
  enchant: { title: "Seyla's Circle", button: 'Add a card slot' },
  insert: { title: 'Insert Card' },
};
const POS_KEY = 'aria.windows';

// what each job is about, for the job change
const JOB_PITCH = {
  swordman: 'Sturdy sword fighters with more HP: Cleave, Heavy Strike, War Cry, Stand Firm and Ground Slash.',
  mage: 'Casters who strike from afar with KNL: Ember Bolt, Frost Shard, Arc Lightning, Flame Ring, Rune Ward and Blink. Low HP, lots of SP.',
  blademaster: 'One target, cut down fast: Twin Fang, Piercing Edge, Final Blade, and Blade Dance to dash through a crowd. Blade skills may Combo, and Combos build Momentum.',
  wizard: 'The elements over an area: Stone Spike, Earthquake, Meteor Storm, Storm Gust and Thunderstorm. Changing element builds Resonance.',
  magicknight: 'Sword and spell as one: imbue your blade with an element, cut with Elemental Edge, sweep the field with Elemental Nova; Stone Aegis is a barrier of both.',
};

// the crafters: Gunnar's forge (gear), Ragna's herbs (usables), Orm's workshop (sorcerers' gear)
const CRAFTERS = {
  gear: { title: "Gunnar's Forge", note: 'Gunnar forges weapons, armor and charms.', button: 'Forge gear' },
  use: { title: "Ragna's Herbs", note: 'Ragna brews potions and feathers.', button: 'Brew usables' },
  magic: { title: "Orm's Workshop", note: 'Orm carves staves and stitches robes for sorcerers.', button: 'Craft sorcerer gear' },
};

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
    if (id !== 'story' && this.wins.story) this.raise(this.wins.story); // the story is never hidden under another window
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
    this.loreAt = 0;       // how far into their tales (NPCS lore) they are
    this.quizNote = null;  // what a trainer said about the last answer
    this.retraining = false; // Liv's retraining choices are open
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

  // the Quest View: one quest (or 'story') in full, with a Go button that walks you there
  openQuest(id) {
    this.questId = id;
    this.quitSure = false;
    this.show('quest');
    this.render('quest');
  }

  quest() {
    const id = this.questId, inv = this.inv, t = this.hooks.questTarget?.(id);
    // Quit sits at the far left of the row, away from Close and Go there, and asks twice
    const go = (label, quit = '') => `<div class="btnrow qrow">${quit}<button class="rbtn soft" data-act="close">Close</button><button class="rbtn" data-act="qgo" ${t ? '' : 'disabled'}>${label}</button></div>`;
    const where = t ? `<div class="rnote">➜ ${esc(ZONE_NAMES[t.map])}: ${esc(t.why)}</div>` : '';
    if (id === 'story') {
      const s = this.hooks.storyStep?.();
      if (!s) return '<div class="rnote">The story is over, for now.</div>';
      this.wins.quest.querySelector('.rw-title').textContent = 'Story';
      const hint = typeof s.hint === 'function' ? s.hint(this.prog) : s.hint; // the advice, wherever you are
      return `<div class="qview story"><small>${esc(s.ch)}</small><b>★ ${esc(s.title)}</b><p>${esc(s.goal)}${esc(this.hooks.storyProgress?.() || '')}</p>${hint ? `<div class="rnote">${esc(hint)}</div>` : ''}${where}<div class="rnote">The main story can't be given up.</div>${go('Go there')}</div>`;
    }
    const q = QUESTS[id], st = this.quests, active = id in st.active, ready = active && st.ready(id, inv), giver = NPCS[giverOf(id)];
    this.wins.quest.querySelector('.rw-title').textContent = q.job ? 'Job Quest' : 'Quest';
    return `<div class="qview ${q.job ? 'job' : ''}"><b>${esc(q.title)}</b><small>From ${esc(giver.name)} · ${esc(ZONE_NAMES[giver.map || 'camp'])}</small>
      <p>${esc(q.intro)}</p>
      <div class="qbox"><b>${ready ? 'Done: return to ' + esc(giver.name) : 'Goal'}</b><small>${esc(st.goal(q))}</small>${active ? `<small>Progress: ${esc(st.progress(id, inv))}</small>` : ''}${this.questReward(id)}</div>
      ${where}${go(ready ? 'Go back' : 'Go there', active ? `<button class="rbtn ${this.quitSure ? 'danger' : 'soft'} qquit" data-act="qquit">${this.quitSure ? (SERIES[id] ? 'Yes: start the trial over' : 'Yes, give it up') : 'Quit quest'}</button>` : '')}</div>`;
  }

  // mode: refine | enchant | insert (card: the card being pressed in)
  openSmith(mode, card = null) {
    this.smithMode = mode;
    this.smithCard = card;
    this.smithSel = null;
    this.smithSure = false;
    this.show('smith');
    this.wins.smith.querySelector('.rw-title').textContent = SMITHS[mode].title;
    this.render('smith');
  }

  openCraft(kind) {
    this.craftKind = kind;
    this.show('craft');
    this.wins.craft.querySelector('.rw-title').textContent = CRAFTERS[kind].title;
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
    const left = Math.max(0, Math.min(W - el.offsetWidth, x));
    el.style.left = left + 'px';
    // the hotbar is drawn over the windows (so things can be dragged onto it): a window that would
    // reach under it stops above it, moving up to fit if it can, and scrolls if it is still too long
    const hb = document.getElementById('hotbar')?.getBoundingClientRect();
    const under = hb && hb.height && left < hb.right && left + el.offsetWidth > hb.left;
    const floor = under ? hb.top - 4 : H - 6;
    el.style.maxHeight = 'none';
    const tall = el.offsetHeight;
    const top = Math.max(0, Math.min(H - 28, y, floor - tall));
    el.style.top = top + 'px';
    el.style.maxHeight = Math.max(80, floor - top) + 'px'; // long windows scroll instead of running off screen
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
    // the same line again (five potions bought in a row) counts up on one toast instead of stacking
    const last = this.toasts.lastElementChild;
    if (last && last.dataset.text === text && !last.classList.contains('out')) {
      last.dataset.n = (+last.dataset.n || 1) + 1;
      last.textContent = `${text} ×${last.dataset.n}`;
      clearTimeout(last.outT); clearTimeout(last.goneT);
      last.outT = setTimeout(() => last.classList.add('out'), 2600);
      last.goneT = setTimeout(() => last.remove(), 3100);
      return;
    }
    const el = document.createElement('div');
    el.className = 'toast note';
    el.textContent = el.dataset.text = text;
    this.toasts.appendChild(el);
    el.outT = setTimeout(() => el.classList.add('out'), 2600);
    el.goneT = setTimeout(() => el.remove(), 3100);
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
    if (sel?.type === 'equip') act = canWear(this.selected, this.prog.wearJobs) ? '<button class="rbtn" data-act="equip">Equip</button>' : `<span class="rtag">${esc(jobLine(sel))}</span>`;
    if (sel?.card) act = '<button class="rbtn" data-act="insertcard">Insert</button>';
    const up = sel?.type === 'equip' ? upgradeLine(sel) : '';
    const line = sel?.type === 'equip' ? `<span class="rstat">${esc(SLOTS[sel.slot])}${equipLine(sel) ? ' · ' + equipLine(sel) : ''} · ${esc(jobLine(sel))}${up ? ' · ' + esc(up) : ''}</span>` : '';
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
      return `<button class="eq ${side}${this.eqSel === key ? ' on' : ''}" data-act="eqpick" data-id="${key}" title="${esc(it.name)}${equipLine(it) ? ' · ' + equipLine(it) : ''}">${icon(id, 'eqi')}<span>${esc(it.name)}</span></button>`;
    };
    // one tap shows what a worn piece is; a second tap on it straight after takes it off
    const selId = this.eqSel && g[this.eqSel], sel = selId && ITEMS[selId];
    if (this.eqSel && !sel) this.eqSel = null;
    const up = sel ? upgradeLine(sel) : '';
    const detail = sel
      ? `<b class="${sel.rare ? 'rare' : ''}">${esc(sel.name)}${sel.rare ? ' ✦' : ''}</b><span class="rstat">${esc(SLOTS[sel.slot])}${equipLine(sel) ? ' · ' + equipLine(sel) : ''} · ${esc(jobLine(sel))}${up ? ' · ' + esc(up) : ''}</span><span>${esc(sel.desc)}</span>`
      : '<span>Tap a piece to see what it is. Double-tap it to take it off.</span>';
    const left = [slot('head', 'head', 'l'), slot('face', 'face', 'l'), slot('armor', 'armor', 'l'), slot('weapon', 'weapon', 'l'), slot('accessory', 'acc', 'l')];
    const right = [slot('garment', 'garment', 'r'), slot('shield', 'shield', 'r'), slot('shoes', 'shoes', 'r'), slot('accessory', 'acc2', 'r'), slot('light', 'light', 'r')];
    return `<div class="equipwrap"><div class="ecol">${left.join('')}</div><div class="eme"><img src="${this.portrait?.('player') || ''}" alt=""></div><div class="ecol">${right.join('')}</div></div>
      <div class="rdetail">${detail}</div>
      <div class="rfoot"><span>Double-tap a piece to take it off</span></div>`;
  }

  // Ragnarok's skill window: the job's tree with levels, SP costs and a raise button
  skills() {
    const p = this.prog;
    let h = '', group = null;
    for (const id of skillList(p)) {
      const sk = SKILLS[id], lv = skillLv(p, id), block = learnBlock(p, id);
      if (sk.job !== group) { group = sk.job; h += `<div class="rsub">${esc(JOBS[group].name)}</div>`; }
      const active = sk.kind === 'active';
      let tag = '';
      if (sk.free && !lv) tag = `Job Lv ${sk.free.jobLv}`;
      else if (sk.granted && !lv) tag = Object.entries(sk.needs).map(([k, n]) => `${SKILLS[k].name} ${n}`).join(', ');
      else if (active && lv) tag = this.hotbar?.has('skill', id) ? 'On hotbar' : 'Drag to hotbar';
      else if (block === 'job' && !lv) tag = `Switch to ${JOBS[sk.job]?.name || 'that job'} at a Keeper to train`;
      else if (block === 'job') tag = `Train as a ${JOBS[sk.job]?.name || 'that job'} (switch at a Keeper)`;
      else if (block && block !== 'points' && block !== 'max' && block !== 'free') tag = block;
      const cost = (active && spCost(id, Math.max(1, lv)) ? ` · SP ${spCost(id, Math.max(1, lv))}` : '') + (sk.weapon ? ` · needs ${WEAPON_NAMES[sk.weapon]}` : '');
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

  // Holger's refining, Seyla's slots and card inserting: pick a piece (worn or in the bag), see the
  // odds and the cost, and try. A try that can break the piece asks twice.
  smith() {
    const inv = this.inv, mode = this.smithMode, card = this.smithCard;
    const test = mode === 'refine' ? (k) => refineInfo(k) && !refineInfo(k).max : mode === 'enchant' ? canEnchant : (k) => canInsert(card, k);
    const list = inv.pieces(test);
    if (this.smithSel && !list.some((p) => p.where === this.smithSel.where && p.key === this.smithSel.key)) this.smithSel = null;
    const note = mode === 'refine'
      ? 'Holger refines weapons, armor, shields, capes, boots and head gear, one level at a time up to +10. Safe up to a point; past it, a failed try breaks the piece.'
      : mode === 'enchant'
        ? `Seyla opens card slots in Lv 4 weapons, up to two. The first works ${ENCHANT.chance[0]}% of the time; the second ${ENCHANT.chance[1]}%, for twice the materials. A failure breaks the weapon (its card comes back).`
        : `Press the ${ITEMS[card].name} into a free slot of a ${SLOTS[ITEMS[card].card.on].toLowerCase()}. It stays there for good.`;
    let h = `<div class="rnote">${esc(note)}</div><div class="rlist">`;
    for (const p of list) {
      const it = ITEMS[p.key], on = this.smithSel?.where === p.where && this.smithSel?.key === p.key;
      h += `<div class="ritem smithrow${on ? ' sel' : ''}">${icon(p.key, 'sm')}<div><b>${esc(it.name)}</b><small>${esc(SLOTS[it.slot])} · ${p.where === 'bag' ? 'in your bag' : 'worn'}${upgradeLine(it) ? ' · ' + esc(upgradeLine(it)) : ''}</small></div>
        <button class="rbtn soft" data-act="smithpick" data-where="${p.where}" data-id="${esc(p.key)}">${on ? 'Picked' : 'Pick'}</button></div>`;
    }
    if (!list.length) h += `<div class="rnote">${mode === 'insert' ? 'Nothing you have has a free slot of the right kind. Seyla in Galdrheim can open one.' : 'Nothing you have can be worked on here.'}</div>`;
    h += '</div>';
    const sel = this.smithSel, it = sel && ITEMS[sel.key];
    if (it) {
      const costRow = (id, n) => `<span class="cost ${inv.have(id) >= n ? 'ok' : ''}" title="${esc(ITEMS[id].name)}">${icon(id, 'xs')}${esc(ITEMS[id].name)} ${Math.min(inv.have(id), 99)}/${n}</span>`;
      const perzRow = (n) => `<span class="cost ${inv.perz >= n ? 'ok' : ''}">${n.toLocaleString()} perz</span>`;
      let what = '', costs = '', risky = false, can = false, label = '';
      if (mode === 'refine') {
        const r = refineInfo(sel.key);
        what = `${esc(it.name)} → +${r.next} · <b class="${r.safe ? 'ok' : 'risk'}">${r.chance}% chance</b>${r.safe ? ' (safe)' : ''}`;
        costs = costRow(r.ore, 1) + perzRow(r.fee);
        risky = !r.safe; can = inv.have(r.ore) >= 1 && inv.perz >= r.fee; label = `Refine to +${r.next}`;
        if (!r.safe) what += `<small>Safe up to +${r.safeTo}. If this fails, the ${esc(it.name)} breaks and is gone${it.cards?.length ? ' (its card comes back to you)' : ''}.</small>`;
      } else if (mode === 'enchant') {
        const c = inv.enchantCost(sel.key), step = enchantStep(sel.key);
        what = `${esc(it.name)} → [${step.slots}] · <b class="risk">${step.chance}% chance</b><small>If it fails, the ${esc(it.name)} breaks and is gone${it.cards?.length ? ' (its card comes back to you)' : ''}.</small>`;
        const bossTip = 'Giant Root, Big Pearl, Mushroom Heart or Fire Core, in any mix';
        const bossName = [...new Set(c.boss)].map((b) => ITEMS[b].name).join(' + ') || 'Boss material (Giant Root, Big Pearl, Mushroom Heart or Fire Core)';
        const bossRow = `<span class="cost ${c.boss.length >= c.bossNeed ? 'ok' : ''}" title="${bossTip}">${c.boss.length ? icon(c.boss[0], 'xs') : ''}${esc(bossName)} ${c.boss.length}/${c.bossNeed}</span>`;
        costs = Object.entries(c.items).map(([id, n]) => costRow(id, n)).join('') + bossRow + perzRow(c.perz);
        risky = true; can = c.ok; label = 'Enchant';
      } else {
        what = `${esc(ITEMS[card].name)} → ${esc(it.name)}<small>${esc(ITEMS[card].desc)}</small>`;
        can = inv.bag.count(card) > 0; label = 'Insert';
      }
      const sure = risky && this.smithSure;
      h += `<div class="rdetail smithdetail"><span>${what}</span><div class="costs">${costs}</div>
        <div class="btnrow">${sure ? '<button class="rbtn soft" data-act="smithcancel">Cancel</button>' : ''}<button class="rbtn${sure ? ' danger' : ''}" data-act="smithgo" ${can ? '' : 'disabled'}>${sure ? 'Yes, risk it' : label}</button></div></div>`;
    } else if (list.length) h += '<div class="rdetail"><span>Pick a piece above.</span></div>';
    return h + `<div class="rfoot"><span>Bag ${inv.bag.slots.length}/${BAG_SLOTS}</span><span class="perz">${inv.perz.toLocaleString()} perz</span></div>`;
  }

  craft() {
    const inv = this.inv;
    let h = `<div class="rnote">${CRAFTERS[this.craftKind].note} Uses items from your bag and storage; what is made goes in your bag.</div><div class="rlist recipes">`;
    for (const r of RECIPES) {
      if (recipeKind(r) !== this.craftKind) continue;
      const st = inv.recipeState(r), it = ITEMS[r.item];
      const cost = Object.entries(r.cost).map(([id, n]) => {
        const have = inv.have(id);
        return `<span class="cost ${have >= n ? 'ok' : ''}" title="${esc(ITEMS[id].name)}">${icon(id, 'xs')}${esc(ITEMS[id].name)} ${Math.min(have, 99)}/${n}</span>`;
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

  // a quest's reward line; a job trial's steps on the way pay nothing, its last step the lot
  questReward(id) {
    const r = rewardOf(id);
    if (r) return (SERIES[id] ? '<small>For completing the whole trial:</small>' : '') + this.reward(r);
    const last = SERIES[id].at(-1);
    return `<small>Paid when the whole trial is done (after ${esc(QUESTS[last].title)}):</small>${this.reward(rewardOf(last))}`;
  }

  reward(r) {
    const items = Object.entries(r.items || {}).map(([id, n]) => `<span class="cost ok">${icon(id, 'xs')}${n} ${esc(ITEMS[id].name)}</span>`).join('');
    return `<div class="costs"><span class="cost ok">${(r.xp * RATES.base).toLocaleString()} Base EXP · ${(Math.round((r.job ?? r.xp * 0.7)) * RATES.job).toLocaleString()} Job EXP</span>${r.perz ? `<span class="cost ok">${r.perz.toLocaleString()} perz</span>` : ''}${items}</div>`;
  }

  // how many of an item the active quests still want (with who wants them), so a sale can keep them
  questNeed(item) {
    let n = 0, who = null;
    for (const id of Object.keys(this.quests.active)) {
      const want = QUESTS[id].items?.[item];
      if (want) { n += want; who = who || NPCS[giverOf(id)].name.split(' ')[0]; }
    }
    return { n, who };
  }

  // Sell 1, Sell 10, and Sell all, which keeps what a quest still needs
  sellButtons(sel) {
    const have = this.inv.bag.count(sel), need = this.questNeed(sel), keep = Math.min(have, need.n);
    let h = '<button class="rbtn" data-act="sell" data-n="1">Sell 1</button>';
    if (have - keep >= 10) h += '<button class="rbtn soft" data-act="sell" data-n="10">Sell 10</button>';
    if (have - keep > 1) h += `<button class="rbtn soft" data-act="sell" data-n="${have - keep}">${keep ? `Sell all but ${keep}` : 'Sell all'}</button>`;
    return (keep ? `<small class="keepnote">${esc(need.who)} needs ${need.n} for a quest</small>` : '') + `<div class="btnrow">${h}</div>`;
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
          ${sellPrice(sel) ? this.sellButtons(sel) : ''}`
        : '<span>Tap an item in your bag to sell it. Worn gear is not for sale.</span>'}</div>`;
    }
    return h + `<div class="rfoot"><span>Bag ${inv.bag.slots.length}/${BAG_SLOTS}</span><span class="perz">${inv.perz.toLocaleString()} perz</span></div>`;
  }

  talk() {
    const n = NPCS[this.npc], st = this.quests.status(this.npc, this.prog, this.inv), p = this.prog;
    let text, box = '', btns = '<button class="rbtn soft" data-act="close">Bye</button>', quizzing = false;
    // what they say on seeing this hero: their own line for the hero's job and chapter, if they have one
    const step = this.hooks.storyStep?.(), ch = step ? +(/Chapter (\d+)/.exec(step.ch)?.[1] || 0) : 99;
    const greet = n.greet?.({ job: JOBS[p.job].name, jobId: p.job, tier: p.tier, baseLv: p.baseLv, ch });
    // what else they do: trade and craft
    const extra = (n.retrain ? '<button class="rbtn" data-act="retrainwin">Rethink my training</button>' : '')
      + (n.stylist ? '<button class="rbtn" data-act="stylist">Change my look</button>' : '')
      + (n.shop ? '<button class="rbtn" data-act="shop">Buy / Sell</button>' : '')
      + (n.craft ? `<button class="rbtn" data-act="craftwin" data-id="${n.craft}">${CRAFTERS[n.craft].button}</button>` : '')
      + (n.smith ? `<button class="rbtn" data-act="smithwin" data-id="${n.smith}">${SMITHS[n.smith].button}</button>` : '')
      + (n.heal ? '<button class="rbtn" data-act="heal">Heal me</button>' : '')
      + (n.warp ? '<button class="rbtn" data-act="ferrylist">Travel</button>' : '')
      + (n.keeper && this.hooks.keeperKnown?.(this.npc) ? '<button class="rbtn" data-act="chestwin">Storage</button><button class="rbtn" data-act="heal">Heal me</button>'
        + `<button class="rbtn" data-act="keepsave" ${this.hooks.savedAt?.() === this.npc ? 'disabled' : ''}>Save here</button><button class="rbtn" data-act="keeplist">Teleport</button>` : '')
      + (n.keeper && !this.hooks.keeperKnown?.(this.npc) ? '<button class="rbtn" data-act="keepreg">Sign the ledger</button>' : '');
    if (n.keeper && this.ferrying) { // the Keepers' road: towns where you have signed, and the fare
      const list = this.hooks.keeperList?.(this.npc) || [];
      const rows = list.map(([k, fare]) => `<button class="rbtn" data-act="keepgo" data-id="${k}" ${this.inv.perz < fare ? 'disabled' : ''}>${esc(ZONE_NAMES[NPCS[k].map || 'camp'])} · ${fare.toLocaleString()} perz</button>`).join('');
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>Which town? You have ${this.inv.perz.toLocaleString()} perz.</p><div class="btnrow wrap">${rows || '<span>You have not signed any other Keeper\'s ledger yet.</span>'}</div>
        <div class="btnrow"><button class="rbtn soft" data-act="close">Bye</button></div></div></div>`;
    }
    if (n.warp && this.ferrying) { // the lands you have walked, and the fare to each
      const list = this.hooks.ferryList?.() || [];
      const rows = list.map(([m, fare]) => `<button class="rbtn" data-act="ferry" data-id="${m}" ${this.inv.perz < fare ? 'disabled' : ''}>${esc(ZONE_NAMES[m])} · ${fare.toLocaleString()} perz</button>`).join('');
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>Where to? You have ${this.inv.perz.toLocaleString()} perz.</p><div class="btnrow wrap">${rows || '<span>You have not walked any other land yet.</span>'}</div>
        <div class="btnrow"><button class="rbtn soft" data-act="close">Bye</button></div></div></div>`;
    }
    if (n.retrain && this.retraining) { // Liv: stats, and first-job skills, back to be placed again
      const p = this.prog, cost = (k) => (p.resets[k] ? RETRAIN_COST : 0), sure = this.retrainSure;
      const inTrial = Object.values(NPCS).some((o) => o.trial2?.some((k) => k in this.quests.active));
      const skillsOk = p.tier === 1 && !inTrial;
      const row = (k, label, ok, why) => `<button class="rbtn ${sure === k ? 'danger' : ''}" data-act="retrain" data-id="${k}" ${ok && this.inv.perz >= cost(k) ? '' : 'disabled'}>${sure === k ? 'Yes, start over' : label} · ${cost(k) ? cost(k).toLocaleString() + ' perz' : 'free'}</button>${ok ? '' : `<small>${why}</small>`}`;
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>Not happy with how you trained? The first time is on me. After that, the masters charge ${RETRAIN_COST.toLocaleString()} perz.</p>
        <div class="qbox"><small>Stats: every stat back to 1, and all your points to place again.</small><small>Skills: every Blader and Sorcerer skill unlearnt, and the points back. Your Trainee skills stay.</small></div>
        <div class="btnrow wrap retrain">${row('stats', 'Reset my stats', true, '')}${row('skills', 'Reset my first-job skills', skillsOk, p.tier === 1 ? 'Not during a second-job trial.' : p.tier === 0 ? 'Choose a first job first.' : 'Not once you have a second job.')}</div>
        <div class="btnrow"><button class="rbtn soft" data-act="close">Bye</button></div></div></div>`;
    }
    const parcel = this.quests.deliveryFor(this.npc);
    if (parcel) { // someone was sent to this person with a package
      const q = QUESTS[parcel];
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>${esc(n.hello)}</p><div class="qbox"><b>${esc(q.title)}</b><small>${esc(this.quests.goal(q))}</small></div>
        <div class="btnrow"><button class="rbtn soft" data-act="close">Not yet</button><button class="rbtn" data-act="deliver" data-id="${parcel}">Give the ${esc(q.thing)}</button></div></div></div>`;
    }
    if (this.delivered) { // what they said on taking it
      const line = this.delivered;
      this.delivered = null;
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt=""><div class="say"><p>${esc(line)}</p><div class="btnrow"><button class="rbtn soft" data-act="close">Bye</button></div></div></div>`;
    }
    if (st.state === 'job') { // the trial is done: the job change
      text = `You passed. Will you walk the path of the ${JOBS[st.job].name}?`;
      const second = JOBS[st.job].tier === 2, keep = p.tier === 1 && !second;
      box = `<b>Job change: ${esc(JOBS[st.job].name)}</b><small>${esc(JOB_PITCH[st.job])} ${second
        ? 'Job Level starts again at 1; your first-job skills and points stay with you.'
        : keep ? 'You keep your Job Level and skill points: both first jobs share them. You can switch back here any time.' : 'Job Level starts again at 1.'}</small>`;
      btns = `<button class="rbtn soft" data-act="close">Not yet</button><button class="rbtn" data-act="jobchange" data-id="${st.job}">Become a ${JOBS[st.job].name}</button>`;
    } else if (st.state === 'offer') {
      const first = st.id === n.quests[0] || st.id === n.trial?.[0] || st.id === n.trial2?.[0];
      text = (first ? (greet || n.hello) + ' ' : '') + st.q.intro;
      box = `<b class="${st.q.job ? 'jobq' : ''}">${esc(st.q.title)}</b><small>${esc(this.quests.goal(st.q))}</small>${this.questReward(st.id)}`;
      btns = `<button class="rbtn soft" data-act="close">Not now</button><button class="rbtn" data-act="accept" data-id="${st.id}">Accept</button>`;
    } else if (st.state === 'active' && st.q.kind === 'quiz' && this.quests.hasItems(st.id, this.inv)) {
      // a trainer's questions, one at a time: tap an answer
      const at = this.quests.active[st.id], Q = st.q.questions[at], note = this.quizNote;
      quizzing = true;
      text = (note ? '' : at === 0 ? st.q.intro + ' ' : '') + Q.q;
      box = `<b class="${st.q.job ? 'jobq' : ''}">${esc(st.q.title)}</b><small>Question ${at + 1} of ${st.q.questions.length}</small>`
        + (note ? `<small class="${note.ok ? 'qright' : 'qwrong'}">${note.ok ? '✓' : '✗'} ${esc(note.note)}</small>` : '');
      btns = `<div class="answers">${Q.options.map((o, i) => `<button class="rbtn soft" data-act="answer" data-id="${st.id}" data-n="${i}">${esc(o)}</button>`).join('')}</div>`
        + '<button class="rbtn soft" data-act="close">Not now</button>';
    } else if (st.state === 'active') {
      // a quiz still waiting for its ingredients: say again what to bring and why (the brewing recipe)
      text = st.q.kind === 'quiz' ? st.q.intro : `Any luck? ${this.quests.goal(st.q)}.`;
      box = `<b class="${st.q.job ? 'jobq' : ''}">${esc(st.q.title)}</b><small>${esc(this.quests.progress(st.id, this.inv))}</small>${this.questReward(st.id)}`;
    } else if (st.state === 'ready') {
      text = st.q.thanks;
      box = `<b class="${st.q.job ? 'jobq' : ''}">${esc(st.q.title)} ✓</b>${this.questReward(st.id)}`;
      btns = `<button class="rbtn" data-act="handin" data-id="${st.id}">Hand in</button>`;
    } else if (st.state === 'locked') text = (greet ? greet + ' ' : '') + n.later(st.q.lv);
    else text = greet || (n.quests.length || n.trial ? n.bye : n.hello); // people with no quests just say hello
    // a Trainee not yet ready for a trial hears what it takes; the Elder points ready Trainees to the city
    if (p.job === 'novice' && n.trialHint && (st.state === 'finished' || st.state === 'locked')) text = n.trialHint;
    if (p.job === 'novice' && n.ready && p.jobLv >= 10 && skillLv(p, 'basics') >= 9 && ['finished', 'locked', 'active'].includes(st.state)) text = n.ready;
    // both first jobs walked: a Keeper switches you between them
    if (n.keeper && this.hooks.keeperKnown?.(this.npc) && p.tier === 1) {
      for (const j of p.unlocked) if (JOBS[j].tier === 1 && j !== p.job) btns = `<button class="rbtn" data-act="jobchange" data-id="${j}">Switch to ${JOBS[j].name}</button>` + btns;
    }
    if (n.job2 && p.tier === 1 && !p.unlocked.includes(n.job2) && st.state === 'finished') text = n.trial2Hint || n.trialHint;
    if (extra && !quizzing && st.state !== 'job' && st.state !== 'offer' && st.state !== 'ready') btns = extra + btns;
    // people with tales to tell: each 'Tell me more' is the next one
    if (n.lore && !quizzing && st.state !== 'job' && st.state !== 'offer' && st.state !== 'ready') {
      if (this.loreAt > 0) text = n.lore[(this.loreAt - 1) % n.lore.length];
      btns = '<button class="rbtn soft" data-act="lore">Tell me more</button>' + btns;
    }
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
    if (act === 'smithwin') { this.close('talk'); this.openSmith(t.dataset.id); }
    if (act === 'insertcard' && this.selected) this.openSmith('insert', this.selected);
    if (act === 'smithpick') { this.smithSel = { where: t.dataset.where, key: t.dataset.id }; this.smithSure = false; this.render(id); }
    if (act === 'smithcancel') { this.smithSure = false; this.render(id); }
    if (act === 'smithgo' && this.smithSel) {
      const mode = this.smithMode, { where, key } = this.smithSel, name = ITEMS[key].name;
      const risky = mode === 'enchant' || (mode === 'refine' && !refineInfo(key).safe);
      if (risky && !this.smithSure) { this.smithSure = true; this.render(id); return; }
      this.smithSure = false;
      const res = mode === 'refine' ? inv.refine(where, key) : mode === 'enchant' ? inv.enchant(where, key) : inv.insert(this.smithCard, where, key);
      if (res.error) { this.message(res.error); return; }
      this.smithSel = res.key ? { where, key: res.key } : null;
      if (mode === 'insert') { this.message(`The card sinks into the ${name}.`); this.close('smith'); this.selected = null; }
      else if (res.ok) this.message(mode === 'refine' ? `Success! ${ITEMS[res.key].name}` : `The song holds! ${ITEMS[res.key].name}`);
      else this.message(`The ${name} breaks apart…${res.cards?.length ? ` You pick the ${res.cards.map((c) => ITEMS[c].name).join(' and the ')} out of the pieces.` : ''}`);
      this.hooks.upgraded?.(mode, res);
      this.render();
    }
    if (act === 'heal') { this.hooks.heal?.(); this.close('talk'); }
    if (act === 'ferrylist' || act === 'keeplist') { this.ferrying = true; this.render('talk'); }
    if (act === 'keepreg') { this.hooks.keeperRegister?.(this.npc); this.render('talk'); }
    if (act === 'keepsave') { this.hooks.keeperSave?.(this.npc); this.render('talk'); }
    if (act === 'keepgo') this.hooks.keeperGo?.(t.dataset.id);
    if (act === 'qgo') this.hooks.questGo?.(this.questId);
    if (act === 'qquit') {
      if (!this.quitSure) { this.quitSure = true; this.render(id); return; } // asks twice
      this.quitSure = false;
      this.hooks.questQuit?.(this.questId);
      this.close('quest');
    }
    if (act === 'chestwin') { this.close('talk'); this.show('chest'); }
    if (act === 'lore') { this.loreAt++; this.render('talk'); }
    if (act === 'ferry') this.hooks.ferry?.(t.dataset.id);
    if (act === 'shoptab') { this.shopTab = t.dataset.id; this.sellSel = null; this.render(id); }
    if (act === 'buy') {
      const n = +t.dataset.n;
      if (inv.buy(t.dataset.id, n)) { this.hooks.traded?.('buy'); this.message(`Bought ${n > 1 ? n + ' ' : ''}${ITEMS[t.dataset.id].name} for ${(PRICES[t.dataset.id] * n).toLocaleString()} perz`); }
      else this.message(inv.perz < PRICES[t.dataset.id] * n ? 'Not enough perz' : 'Bag is full');
    }
    if (act === 'sell' && this.sellSel) {
      const n = Math.min(inv.bag.count(this.sellSel), +t.dataset.n || 1), got = sellPrice(this.sellSel) * n;
      if (inv.sell(this.sellSel, n)) { this.hooks.traded?.('sell'); this.message(`Sold for ${got.toLocaleString()} perz`); }
    }
    if (act === 'accept') this.hooks.accept?.(t.dataset.id);
    if (act === 'handin') { this.quizNote = null; this.hooks.handIn?.(t.dataset.id); }
    if (act === 'retrainwin') { this.retraining = true; this.retrainSure = null; this.render('talk'); }
    if (act === 'retrain') {
      const k = t.dataset.id;
      if (this.retrainSure !== k) { this.retrainSure = k; this.render('talk'); return; } // asks twice
      this.retrainSure = null;
      this.hooks.retrain?.(k);
      this.render('talk');
    }
    if (act === 'deliver') { this.delivered = QUESTS[t.dataset.id].toLine; this.hooks.delivered?.(t.dataset.id); this.render('talk'); }
    if (act === 'answer') {
      const r = this.quests.answer(t.dataset.id, +t.dataset.n);
      if (r) { this.quizNote = r; this.hooks.answered?.(t.dataset.id, r.ok); this.render('talk'); }
    }
    if (act === 'tab') { this.tab = t.dataset.id; this.selected = null; this.render(id); }
    if (act === 'equip' && inv.equip(this.selected)) { this.selected = null; this.hooks.equipped?.(); }
    if (act === 'eqpick') {
      const key = t.dataset.id, now = performance.now();
      if (this.eqSel === key && now - (this.eqT || 0) < 450) { // a double tap: take it off
        this.eqSel = null;
        if (inv.unequip(key)) this.hooks.equipped?.();
        else this.message('Bag is full');
      } else { this.eqSel = key; this.eqT = now; }
      this.render(id);
    }
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
