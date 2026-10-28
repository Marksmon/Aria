// Ragnarok-style windows: Items, Equipment, Skills and Status, plus crafting (Gunnar's forge and
// Ragna's herbs), the chest (camp and Steinborg storage), shops and dialogue. Each is a small window you drag by its title bar; several can be open
// at once and the game keeps running behind them. Positions are remembered per device.
// Pickup toasts and messages live here too. Plain DOM over the canvas.
import { ITEMS, RECIPES, SLOTS, SHOPS, PRICES, sellPrice, equipLine, iconURL, canWear, jobLine, recipeKind, upgradeLine, refineInfo, canEnchant, canInsert, ENCHANT, MAX_REFINE, enchantStep, cardOn, cardLine, UNCARD_FEE, parseKey, makeKey } from './items.js';
import { BAG_SLOTS, CHEST_SLOTS } from './inventory.js';
import { STATS, STAT_KEYS, JOBS, TREES, QUEST_RATE } from './progress.js';
import { statCost } from './ro-tables.js';
import { HAIRSTYLES, DYES, hairstyles, lookPortrait } from './hair.js';
import { NPCS, QUESTS, giverOf, rewardOf, SERIES } from './quests.js';
import { ZONE_NAMES } from './world.js';
import { RAIDS, waitText } from './raid.js';
import { raidDef, MOB_DEFS } from './mobs.js';
import { SKILLS, skillList, skillLv, learnBlock, trainTrees, spCost, castTime, pointsIn, WEAPON_NAMES, RETRAIN_COST, MK_POINTS } from './skills.js';

// the Skills window's trees: every tree the hero has earned, the current job's first, then the jobs it
// stands on, then the rest
const TREES_OF = (job) => TREES[job] || [job];
function skillTrees(p) {
  const own = TREES_OF(p.job), all = [...p.trees];
  return [...own, ...all.filter((t) => !own.includes(t))].filter((t) => Object.values(SKILLS).some((s) => s.job === t));
}
// where each skill of a tree sits: rows by prerequisite depth (in this tree), a skill under its
// need where there is room, otherwise in the next free column. { at: { id: { x, y } }, w, h }
const NODE = 40, COL = 56, ROW = 62, PAD = 10;
const layouts = {};
function treeLayout(job) {
  if (layouts[job]) return layouts[job];
  const ids = Object.keys(SKILLS).filter((id) => SKILLS[id].job === job), depth = {};
  const deep = (id) => (depth[id] ??= Math.max(0, ...Object.keys(SKILLS[id].needs || {}).filter((k) => SKILLS[k]?.job === job).map((k) => deep(k) + 1)));
  ids.forEach(deep);
  const col = {}, taken = new Set();
  for (const id of [...ids].sort((a, b) => depth[a] - depth[b])) {
    const parent = Object.keys(SKILLS[id].needs || {}).find((k) => SKILLS[k]?.job === job);
    let c = parent !== undefined ? col[parent] : 0;
    while (taken.has(`${depth[id]}:${c}`)) c++;
    col[id] = c;
    taken.add(`${depth[id]}:${c}`);
  }
  const at = {};
  for (const id of ids) at[id] = { x: PAD + col[id] * COL, y: PAD + depth[id] * ROW };
  const w = PAD * 2 + Math.max(...ids.map((id) => col[id])) * COL + NODE, h = PAD * 2 + Math.max(...ids.map((id) => depth[id])) * ROW + NODE + 8;
  return (layouts[job] = { at, w, h });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = '') => `<img class="ico ${cls}" src="${iconURL(id)}" alt="">`;

// window id -> title, default spot (fraction of the screen: centre x, top y) and width
const WINDOWS = {
  items:  { title: 'Items',      at: [0.80, 0.30], w: 271 },
  equip:  { title: 'Equipment',  at: [0.50, 0.16], w: 299 },
  skills: { title: 'Skills',     at: [0.70, 0.12], w: 560 },
  status: { title: 'Status',     at: [0.19, 0.30], w: 345 },
  craft:  { title: 'Crafting',   at: [0.50, 0.14], w: 345 },
  chest:  { title: 'Storage',    at: [0.50, 0.16], w: 368 },
  shop:   { title: 'Shop',       at: [0.50, 0.14], w: 345 },
  talk:   { title: '',           at: [0.50, 0.22], w: 368 },
  story:  { title: '',           at: [0.50, 0.20], w: 391 },
  look:   { title: 'Your Look',  at: [0.50, 0.16], w: 299 },
  smith:  { title: '',           at: [0.50, 0.12], w: 368 },
  quest:  { title: 'Quest',      at: [0.50, 0.16], w: 368 },
  settings: { title: 'Settings', at: [0.50, 0.22], w: 253 },
};
// the smith window's three jobs: Holger's refining, Seyla's slots, pressing in a card
const SMITHS = {
  refine: { title: "Holger's Anvil", button: 'Refine gear' },
  enchant: { title: "Seyla's Circle", button: 'Add a card slot' },
  insert: { title: 'Insert Card' },
  uncard: { title: "Seyla's Circle", button: 'Remove a card' },
};
const POS_KEY = 'aria.windows';

// what each job is about, for the job change
const JOB_PITCH = {
  swordman: 'Sturdy sword fighters with more HP: Cleave, Heavy Strike, War Cry, Stand Firm and Ground Slash.',
  mage: 'Casters who strike from afar with KNL: Ember Bolt, Frost Shard, Arc Lightning, Flame Ring, Rune Ward and Blink. Low HP, lots of SP.',
  archer: 'Bow hunters who shoot from 5 paces with FNS: Double Shot, Arrow Rain, Focus, Hunter\'s Mark and Leap Back. Arrows in the Arrows slot set the shot\'s element.',
  blademaster: 'One target, cut down fast: Twin Fang, Piercing Edge, Final Blade, and Blade Dance to dash through a crowd. Blade skills may Combo, and Combos build Momentum.',
  wizard: 'The elements over an area: Stone Spike, Earthquake, Meteor Storm, Storm Gust and Thunderstorm. Changing element builds Resonance.',
  magicknight: 'Sword and spell as one: imbue your blade with an element, cut with Elemental Edge, sweep the field with Elemental Nova; Stone Aegis is a barrier of both.',
  moonranger: 'Bow and spell under the moon: arrows that hit with ATK and MATK together. Lunar Multishot fans arrows over a pack, Starfall rains stars, Crescent Arrow pierces a line; Moonveil guards you. Stronger at night.',
  beastmaster: 'Sword or bow, and three beasts at your side: Summon Bear (it grows with END), Summon Wolves (FNS) and Summon Hawk (QKN), all out together, and Pack Frenzy to drive them on. Your own tree is beasts only; your Blader and Archer skills stay.',
  windrunner: 'The quickest bow in Aria: Windborne and Gale Rhythm speed every shot, Tailwind and Gale Step give short bursts of speed to reposition, Hurricane Volley and Cyclone Arrow finish the work.',
};

// the crafters: Gunnar's forge (gear), Ragna's herbs (usables), Orm's workshop (sorcerers' gear),
// Leif's leatherworks (Veidheim's hunting gear)
const CRAFTERS = {
  gear: { title: "Gunnar's Forge", note: 'Gunnar forges weapons, armor and charms.', button: 'Forge gear' },
  use: { title: "Ragna's Herbs", note: 'Ragna brews potions and feathers.', button: 'Brew usables' },
  magic: { title: "Orm's Workshop", note: 'Orm carves staves and stitches robes for sorcerers.', button: 'Craft sorcerer gear' },
  hunt: { title: "Leif's Leatherworks", note: 'Leif tans pelts and skins into hunters\' gear.', button: 'Make hunting gear' },
  bow: { title: "Asa's Workbench", note: 'Asa makes bows from wood, vine, shell and whatever the hunt brings back.', button: 'Make bows' },
  // the raids' guides: each raid's rare finds, made from its cores
  bloop: { title: "The Boatman's Trades", note: 'The Boatman makes Bloop Island\'s rare finds from Bloop Cores (a clear pays 3, 9, 27 or 81 by difficulty).', button: 'Trade Bloop Cores' },
  kobold: { title: "Brokk's Forge", note: 'Brokk makes the Kobold Camp\'s rare finds from Kobold Cores (a clear pays 3, 9, 27 or 81 by difficulty).', button: 'Trade Kobold Cores' },
  goblin: { title: "Ylva's Trades", note: 'Ylva makes the Goblin Lair\'s rare finds from Goblin Cores (a clear pays 3, 9, 27 or 81 by difficulty).', button: 'Trade Goblin Cores' },
};

// the storage's sections: cards apart from the other miscs
const CHEST_TABS = { all: 'All', use: 'Usables', equip: 'Equips', misc: 'Miscs', card: 'Cards' };
const chestKind = (id) => (ITEMS[id].card ? 'card' : ITEMS[id].type === 'equip' ? 'equip' : ITEMS[id].type === 'use' ? 'use' : 'misc');

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
    this.skTab = null;      // Skills window: the tree shown (a job id), and the skill picked in it
    this.skSel = null;
    this.skFirst = null;    // the first job the first-jobs tab shows, and whether its list is open
    this.skMenu = false;
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
    this.raidPick = null;  // the raid difficulty looked at (the Boatman)
    this.loreAt = 0;       // how far into their tales (NPCS lore) they are
    this.quizNote = null;  // what a trainer said about the last answer
    this.retraining = false; // Liv's retraining choices are open
    this.show('talk');
  }

  // the Boatman's crossings: the difficulties down the left (each needs its Base Level), and the one
  // picked on the right: its boss and what it does, the waves, what a clear pays and the rare finds
  raidPanel(n) {
    const p = this.prog, R = RAIDS[n.raid], info = this.hooks.raidInfo?.(n.raid) || { wait: 0 };
    // the Tutorial run only while the story waits on the raid; it never waits on the tide
    const list = Object.entries(R.difficulties).filter(([, d]) => !d.tutorial || info.story);
    const low = (d) => !d.tutorial && p.baseLv < d.lv; // (each difficulty needs its Base Level; the Tutorial doesn't)
    const shut = (d) => low(d) || (info.wait && !d.tutorial);
    if (!R.difficulties[this.raidPick] || !list.some(([k]) => k === this.raidPick)) { // the hardest open to them, else the first
      this.raidPick = ([...list].reverse().find(([, d]) => !low(d)) || list[0])[0];
    }
    const k = this.raidPick, D = R.difficulties[k];
    const [btype, boff] = R.boss, B = raidDef(btype, D.lv + boff, D.boss, D.wave), base = MOB_DEFS[btype];
    const pic = this.hooks.mobPortrait?.(base.art); // the boss as it stands (the card's picture if it can't be drawn)
    const lvs = R.waves.flat().map(([, , off]) => D.lv + off);
    const wavesOf = [...new Set(R.waves.flat().map(([t]) => MOB_DEFS[t].name))];
    const MOVE = { charge: 'Charge', leap: 'Leap', throw: 'Throw', meteors: 'Meteor Rain', mirror: 'Mirror Image', burrow: 'Burrow', roots: 'Roots', bark: 'Bark Armor', frenzy: 'Frenzy' };
    const skills = [...(B.moves || []).map((m) => m.name || MOVE[m.kind]), 'Stomp', B.summon && `calls ${B.summon.length} ${MOB_DEFS[B.summon[0]].name}s`, B.burns && (B.burns.text || 'burning ground'), B.fierce && 'enraged below half HP'].filter(Boolean);
    const num = (v) => Math.round(v).toLocaleString();
    const rows = list.map(([id, d]) => `<button class="rbtn raidpick ${id === k ? 'on' : ''} ${shut(d) ? 'locked' : ''}" data-act="raidpick" data-id="${id}">
      <b>${esc(d.name)}</b><small>${d.tutorial ? 'the story run' : `Base ${d.lv}${d.plus ? '+' : ''}${low(d) ? ' 🔒' : ''}`}</small></button>`).join('');
    const loot = R.reward.items.map(([id, cnt, chance]) => `<span class="loot" title="${esc(ITEMS[id].name)}">${icon(id, 'xs')}${esc(ITEMS[id].name)} ×${cnt * D.mult}${chance < 1 ? ` <i>${Math.round(chance * 100)}%</i>` : ''}</span>`).join('');
    const rares = R.rares.map((id) => `<span class="loot rare" title="${esc(ITEMS[id].name)}">${icon(id, 'xs')}${esc(ITEMS[id].name)}</span>`).join('');
    const card = R.card ? `<span class="loot rare">${icon(R.card[0], 'xs')}${esc(ITEMS[R.card[0]].name)} <i>${Math.round(R.card[1] * 100)}%</i></span>` : '';
    const why = low(D) ? `Needs Base ${D.lv}: you are Base ${p.baseLv}.` : info.wait && !D.tutorial ? `${R.words.wait}: back in ${waitText(info.wait)}.` : '';
    const note = info.story && D.tutorial ? 'First time out? The Tutorial crossing costs no tide, and I pay you whether you beat him or not.'
      : `${R.words.pitch} ${R.words.cooldown}`;
    const tw = this.wins.talk;
    tw.classList.add('raidwin');
    tw.querySelector('.rw-title').textContent = `${n.name} · ${R.name}`;
    requestAnimationFrame(() => this.place(tw, (window.innerWidth - tw.offsetWidth) / 2, tw.offsetTop)); // (wider now: centred, kept on screen)
    return `<div class="raidui">
      <div class="raidlist">${rows}</div>
      <div class="raidinfo">
        <div class="raidboss">${pic ? `<img class="bosspic" src="${pic}" alt="">` : icon(R.card?.[0] || btype)}<div><b>${esc(base.name)}</b> <span class="rtag">Lv ${B.lv}</span>${B.fierce ? ' <span class="rtag hot">as hard as an MVP</span>' : ''}
          <small>HP ${num(B.hp)} · ATK ${num(B.atk[0])}–${num(B.atk[1])} · ${esc(B.el[0].toUpperCase() + B.el.slice(1))}</small>
          <small>${esc(skills.join(' · '))}</small>
          ${B.takesText ? `<small class="match">${esc(B.takesText[0].toUpperCase() + B.takesText.slice(1))}.</small>` : ''}</div></div>
        <p class="raidline"><b>Waves</b> ${R.waves.length} · ${esc(wavesOf.join(', '))} (Lv ${Math.min(...lvs)}–${Math.max(...lvs)})</p>
        <p class="raidline"><b>Made for</b> ${D.tutorial ? 'a hero on the story: no tide, and paid win or lose' : `Base ${D.lv}${D.plus ? '+' : ''}: ${esc(D.advice)}`}</p>
        <div class="lootrow"><b>Clear reward</b>${D.tutorial ? '' : ` <span class="rtag">x${D.mult}</span>`}<span class="loot perz">${(R.reward.perz * D.mult).toLocaleString()} perz</span>${loot}</div>
        ${R.reward.cores ? `<div class="lootrow"><b>Cores</b>${D.cores > 1 ? ` <span class="rtag">x${D.cores}</span>` : ''}<span class="loot rare">${icon(R.reward.cores[0], 'xs')}${esc(ITEMS[R.reward.cores[0]].name)} ×${R.reward.cores[1] * (D.cores || 1)}</span><i class="corenote">trade them to ${esc(n.name)} for the rare finds below</i></div>` : ''}
        <div class="lootrow"><b>Rare find</b> <span class="rtag">${Math.round(D.rare * 100)}%</span>${rares}</div>
        ${R.ultra ? `<div class="lootrow"><b>Ultra rare</b> <span class="rtag">${Math.round(R.ultra[1] * 100)}%</span><span class="loot ultra">${icon(R.ultra[0], 'xs')}${esc(ITEMS[R.ultra[0]].name)}</span><i class="corenote">${esc(equipLine(ITEMS[R.ultra[0]]))}</i></div>` : ''}
        <div class="lootrow"><b>Boss card</b>${card}</div>
        <p class="raidline">${esc(note)}</p>
        <div class="btnrow">${why ? `<small class="why">${esc(why)}</small>` : ''}<button class="rbtn" data-act="raidgo" data-id="${k}" ${why ? 'disabled' : ''}>Set out: ${esc(D.name)}</button><button class="rbtn soft" data-act="close">Bye</button></div>
      </div></div>`;
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
    const d = this.lookDraft, styles = hairstyles();
    const price = this.lookMode === 'stylist' ? 1000 : 0;
    const body = (b, name) => `<button class="rbtn${(d.body || 'm') === b ? '' : ' soft'}" data-act="lookbody" data-id="${b}" aria-pressed="${(d.body || 'm') === b}">${name}</button>`;
    return `<div class="lookwrap"><img class="lookpic" src="${lookPortrait(d, 96)}" alt="">
      <label class="lookname">Name <input id="lookname" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Your hero's name" value="${esc(d.name || '')}"></label>
      <div class="lookrow">${body('m', 'Male')}${body('f', 'Female')}</div>
      <div class="lookrow"><button class="rbtn soft" data-act="lookhair" data-id="-1">◀</button><b>${esc(HAIRSTYLES[d.hair] || d.hair)}</b><button class="rbtn soft" data-act="lookhair" data-id="1">▶</button></div>
      <div class="swatches">${Object.entries(DYES).map(([k, v]) => `<button class="swatch${d.dye === k ? ' on' : ''}" data-act="lookdye" data-id="${k}" title="${esc(v.name)}" style="background:${v.swatch}"></button>`).join('')}</div>
      <small>${esc(DYES[d.dye].name)} · ${styles.length} hairstyles</small>
      <div class="btnrow">${this.lookMode === 'new' ? '' : '<button class="rbtn soft" data-act="close">Cancel</button>'}
        <button class="rbtn" data-act="lookok" ${this.lookBlocked() ? 'disabled' : ''}>${this.lookMode === 'new' ? 'Begin' : `Change · ${price.toLocaleString()} perz`}</button></div></div>`;
  }

  // the look can't be kept without a name, and the Stylist's needs a change and the perz for it
  lookBlocked() {
    const d = this.lookDraft, f = this.lookFrom;
    if (!d.name?.trim()) return true;
    const changed = ['hair', 'dye', 'name'].some((k) => d[k] !== f[k]) || (d.body || 'm') !== (f.body || 'm');
    return this.lookMode === 'stylist' && (!changed || this.inv.perz < 1000);
  }

  // typing a name: kept as it's typed (letters, digits, spaces, ' and -), without drawing the window
  // again so the box keeps its focus
  input(e) {
    if (e.target.id !== 'lookname' || !this.lookDraft) return;
    const clean = e.target.value.replace(/[^\p{L}\p{N} '-]/gu, '').replace(/\s+/g, ' ').slice(0, 16);
    if (clean !== e.target.value) e.target.value = clean;
    this.lookDraft.name = clean;
    const ok = this.wins.look?.querySelector('[data-act="lookok"]');
    if (ok) ok.disabled = this.lookBlocked();
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
      <div class="qbox"><b>${ready ? 'Done: return to ' + esc(giver.name) : 'Goal'}</b><small>${esc(st.goal(q))}${q.repeat ? ' · a bounty: take it again whenever you like' : ''}</small>${active ? `<small>Progress: ${esc(st.progress(id, inv))}</small>` : ''}${this.questReward(id)}</div>
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
    el.addEventListener('input', (e) => this.input(e));
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

  // the cards in a piece, each with its picture and what it does (and the empty slots left)
  cardsBlock(it) {
    if (!it?.slots) return '';
    const rows = (it.cards || []).map((c) => `<div class="cardrow">${icon(c, 'xs')}<b>${esc(ITEMS[c].name)}</b><small>${esc(cardLine(ITEMS[c].card))}</small></div>`);
    for (let i = rows.length; i < it.slots; i++) rows.push('<div class="cardrow empty"><i></i><small>An empty slot</small></div>');
    return `<div class="cardlist">${rows.join('')}</div>`;
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
    const line = sel?.type === 'equip' ? `<span class="rstat">${esc(SLOTS[sel.slot])}${equipLine(sel) ? ' · ' + equipLine(sel) : ''} · ${esc(jobLine(sel))}${up ? ' · ' + esc(up) : ''}</span>${this.cardsBlock(sel)}` : sel?.card ? `<span class="rstat">Card · goes in ${esc(cardOn(sel.card).map((s) => SLOTS[s]).join(' or '))} · ${esc(cardLine(sel.card))}${sel.adj ? ` · names it "${esc(sel.adj)}"` : ''}</span>` : '';
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
      ? `<b class="${sel.rare ? 'rare' : ''}">${esc(sel.name)}${sel.rare ? ' ✦' : ''}</b><span class="rstat">${esc(SLOTS[sel.slot])}${equipLine(sel) ? ' · ' + equipLine(sel) : ''} · ${esc(jobLine(sel))}${up ? ' · ' + esc(up) : ''}</span>${this.cardsBlock(sel)}<span>${esc(sel.desc)}</span>`
      : '<span>Tap a piece to see what it is. Double-tap it to take it off.</span>';
    const left = [slot('head', 'head', 'l'), slot('face', 'face', 'l'), slot('armor', 'armor', 'l'), slot('weapon', 'weapon', 'l'), slot('accessory', 'acc', 'l'), slot('arrows', 'ammo', 'l')];
    const right = [slot('garment', 'garment', 'r'), slot('shield', 'shield', 'r'), slot('shoes', 'shoes', 'r'), slot('accessory', 'acc2', 'r'), slot('wings', 'wings', 'r')];
    return `<div class="equipwrap"><div class="ecol">${left.join('')}</div><div class="eme"><img src="${this.portrait?.('player') || ''}" alt=""></div><div class="ecol">${right.join('')}</div></div>
      <div class="rdetail">${detail}</div>
      <div class="rfoot"><span>Double-tap a piece to take it off</span></div>`;
  }

  // The skill window: a tab for each tree the hero has earned (the current job's first), the tree
  // itself (each skill a node, rows by prerequisite, lines from each need to what it opens),
  // scrollable, and on the side the picked skill: what it does now and at the next level, what it
  // costs and needs, and the Raise button (or why it can't be raised). Actives drag to the hotbar.
  skills() {
    const p = this.prog, trees = skillTrees(p);
    if (!trees.includes(this.skTab)) this.skTab = trees[0]; // the job worn's tree, to begin with
    const tree = this.skTab, ids = Object.keys(SKILLS).filter((id) => SKILLS[id].job === tree);
    if (!ids.includes(this.skSel)) this.skSel = ids[0];
    const lay = treeLayout(tree);
    // the tabs: the Trainee first, then the first jobs (one tab, the others in its ▾ list), then the
    // second job, marked as one
    const firsts = trees.filter((j) => JOBS[j].tier === 1), seconds = trees.filter((j) => JOBS[j].tier === 2);
    if (firsts.includes(tree)) this.skFirst = tree;
    if (!firsts.includes(this.skFirst)) this.skFirst = firsts.find((j) => (JOBS[p.job].from || [p.job]).includes(j)) || firsts[0];
    const pts = (j) => (pointsIn(p, j) ? ` <small>${pointsIn(p, j)}</small>` : '');
    const tab = (j, extra = '') => `<button class="rtab${j === tree ? ' on' : ''}" data-act="sktab" data-id="${j}">${esc(JOBS[j].name)}${pts(j)}${extra}</button>`;
    const many = firsts.length > 1, open = many && this.skMenu;
    const tabs = (trees.includes('novice') ? tab('novice') : '')
      + (firsts.length ? `<button class="rtab skfirst${firsts.includes(tree) ? ' on' : ''}" data-act="skfirst" aria-expanded="${open}">${esc(JOBS[this.skFirst].name)}${pts(this.skFirst)}${many ? ` <i>${open ? '▴' : '▾'}</i>` : ''}</button>` : '')
      + seconds.map((j) => tab(j, ' <i class="sk2nd">2nd Job</i>')).join('');
    const menu = open ? `<div class="skmenu"><span>First jobs:</span>${firsts.map((j) => tab(j)).join('')}</div>` : '';
    // the connectors: from the bottom of each need to the top of what it opens, lit once met
    const lines = [];
    for (const id of ids) for (const [k, n] of Object.entries(SKILLS[id].needs || {})) {
      const a = lay.at[k], b = lay.at[id];
      if (!a) continue;
      const met = skillLv(p, k) >= n, x1 = a.x + NODE / 2, y1 = a.y + NODE, x2 = b.x + NODE / 2, y2 = b.y, my = (y1 + y2) / 2;
      lines.push(`<path class="${met ? 'met' : ''}" d="M${x1} ${y1} V${my} H${x2} V${y2}"/>`);
    }
    const nodes = ids.map((id) => {
      const sk = SKILLS[id], lv = skillLv(p, id), block = learnBlock(p, id), at = lay.at[id], active = sk.kind === 'active';
      const badge = sk.max > 1 ? `${lv}/${sk.max}` : lv ? '✓' : sk.free || sk.granted ? '🔒' : '0/1';
      const cls = ['sknode', lv ? '' : 'off', id === this.skSel ? 'sel' : '', !block ? 'can' : '', active ? 'act' : 'pas'].filter(Boolean).join(' ');
      return `<button class="${cls}" style="left:${at.x}px;top:${at.y}px" data-act="sksel" data-id="${id}"${active && lv ? ` data-drag="skill:${id}"` : ''} title="${esc(sk.name)}">${icon(sk.icon)}<b>${badge}</b></button>`;
    }).join('');
    const train = trainTrees(p).includes(tree) ? '' : `<div class="sknote">Switch to ${esc(JOBS[tree].name)} at a Keeper to train this tree.</div>`;
    return `<div class="rtabs sktabs">${tabs}</div>${menu}${train}
      <div class="skwrap"><div class="sktree"><div class="skcanvas" style="width:${lay.w}px;height:${lay.h}px"><svg width="${lay.w}" height="${lay.h}">${lines.join('')}</svg>${nodes}</div></div>
      <div class="skdetail">${this.skillDetail(this.skSel)}</div></div>
      <div class="rfoot"><span>${esc(JOBS[p.job].name)} · Job Lv ${p.jobLv}</span><span>Skill Points <b>${p.skillPoints}</b></span></div>`;
  }

  // the picked skill, in full
  skillDetail(id) {
    const p = this.prog, sk = SKILLS[id];
    if (!sk) return '';
    const lv = skillLv(p, id), block = learnBlock(p, id), active = sk.kind === 'active', next = Math.min(sk.max, lv + 1);
    const facts = [];
    if (active && spCost(id, Math.max(1, lv))) facts.push(`SP ${spCost(id, Math.max(1, lv))}`);
    if (castTime(id, Math.max(1, lv))) facts.push(`Cast ${castTime(id, Math.max(1, lv)).toFixed(1)} s`);
    if (sk.cd) facts.push(`Cooldown ${sk.cd} s`);
    if (sk.weapon) facts.push(`Needs ${WEAPON_NAMES[sk.weapon]}`);
    const needs = Object.entries(sk.needs || {}).map(([k, n]) => {
      const ok = skillLv(p, k) >= n, other = SKILLS[k].job !== sk.job ? ` (${JOBS[SKILLS[k].job].name})` : '';
      return `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '✗'} ${esc(SKILLS[k].name)} ${n}${esc(other)}</li>`;
    }).join('');
    let how = '';
    if (sk.free) how = lv ? 'Learnt by itself at Job Lv ' + sk.free.jobLv + '.' : `Learnt by itself at ${JOBS[sk.job].name} Job Lv ${sk.free.jobLv}.`;
    else if (sk.granted) how = lv ? 'Learnt by itself.' : 'Learnt by itself once its needs are met.';
    else if (block === 'job') how = `Switch to ${JOBS[sk.job].name} at a Keeper to raise it.`;
    else if (block === 'max') how = 'Mastered.';
    else if (block === 'points') how = 'No skill points left: they come with Job Levels.';
    else if (block && block.startsWith('Needs')) how = block + '.'; // a skill it builds on, or a second job's first-job rule (skills.js secondJobBlock)
    const hot = active && lv ? (this.hotbar?.has('skill', id) ? 'On the hotbar.' : 'Drag it onto the hotbar to use it.') : '';
    const text = (l) => esc(sk.desc(l)) + (sk.kind === 'passive' ? ' <i>(passive)</i>' : '');
    return `<div class="skhead">${icon(sk.icon)}<div><b>${esc(sk.name)}</b><small>${active ? 'Active' : 'Passive'} · ${esc(JOBS[sk.job].name)}${JOBS[sk.job].tier === 2 ? ' (2nd Job)' : ''} · ${sk.max > 1 ? `Lv ${lv} / ${sk.max}` : lv ? 'Learnt' : 'Not learnt'}</small></div></div>
      ${facts.length ? `<div class="skfacts">${esc(facts.join(' · '))}</div>` : ''}
      ${needs ? `<ul class="skneeds">${needs}</ul>` : ''}
      ${lv ? `<div class="sklv"><b>Now (Lv ${lv})</b><p>${text(lv)}</p></div>` : ''}
      ${lv < sk.max ? `<div class="sklv next"><b>${lv ? `Next (Lv ${next})` : 'At Lv 1'}</b><p>${text(next)}</p></div>` : ''}
      ${how || hot ? `<div class="sknote">${esc([how, hot].filter(Boolean).join(' '))}</div>` : ''}
      ${!block ? `<button class="rbtn skraise" data-act="learn" data-id="${id}">Raise ▲</button>` : ''}`;
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
      const st = STATS[k], add = this.pend[k] || 0, v = p.stats[k] + add, cost = statCost(v), bonus = p.bonus(k) + (this.player.statBonus?.[k] || 0), can = cost <= pts && v < 99;
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
    const name = this.hooks.currentLook?.().name;
    return `<div class="sthead"><b>${esc(name ? `${name} · ${JOBS[p.job].name}` : JOBS[p.job].name)}</b><span>Base Lv <b>${p.baseLv}</b></span><span>Job Lv <b>${p.jobLv}</b></span></div>
      <div class="rsub stsub"><span>Stats</span><span>Status Point <b>${pts}</b></span></div>
      <table class="stt stats"><tbody>${STAT_KEYS.map(stat).join('')}</tbody></table>
      <div class="strow"><span class="rtag">${n ? `${n} point${n === 1 ? '' : 's'} placed, not locked in yet` : 'Tap ▲ to place points, then Confirm'}</span>
        <button class="rbtn soft" data-act="statreset" ${n ? '' : 'disabled'}>Reset</button><button class="rbtn" data-act="statconfirm" ${n ? '' : 'disabled'}>Confirm</button></div>
      <div class="rsub stsub"><span>Battle</span></div>
      <table class="stt battle"><tbody>${battle.map((r) => `<tr>${r[0]}<td class="gap"></td>${r[1]}</tr>`).join('')}</tbody></table>`;
  }

  // what a second job's own skills wait on, in words (skills.js secondJobBlock)
  secondRule(job) {
    const from = JOBS[job].from || [];
    return from.length > 1 ? from.map((j) => `${MK_POINTS} points in ${JOBS[j].name}`).join(' and ') : `the most points in ${JOBS[from[0]]?.name}`;
  }

  // the ⚙ window: sound, and back to the title screen (the game saves first) to play another hero
  settings() {
    const on = this.hooks.soundOn?.();
    return `<div class="setrow"><span>Sound</span><button class="rbtn${on ? '' : ' soft'}" data-act="sound" aria-pressed="${!!on}">${on ? 'On' : 'Off'}</button></div>
      <div class="setrow"><span>Main menu<small>Your game is saved first. Pick another hero there.</small></span><button class="rbtn" data-act="totitle">Back to main menu</button></div>`;
  }

  // Holger's refining, Seyla's slots and card inserting: pick a piece (worn or in the bag), see the
  // odds and the cost, and try. A try that can break the piece asks twice.
  smith() {
    const inv = this.inv, mode = this.smithMode, card = this.smithCard;
    const test = mode === 'refine' ? (k) => refineInfo(k) && !refineInfo(k).max : mode === 'enchant' ? canEnchant : mode === 'uncard' ? (k) => ITEMS[k]?.cards?.length > 0 : (k) => canInsert(card, k);
    const list = inv.pieces(test);
    if (this.smithSel && !list.some((p) => p.where === this.smithSel.where && p.key === this.smithSel.key)) this.smithSel = null;
    const note = mode === 'refine'
      ? 'Holger refines weapons, armor, shields, capes, boots and head gear, one level at a time up to +10. Safe up to a point; past it, a failed try breaks the piece.'
      : mode === 'enchant'
        ? `Seyla opens card slots in Lv 4 weapons, up to two. The first works ${ENCHANT.chance[0]}% of the time; the second ${ENCHANT.chance[1]}%, for twice the materials. A failure breaks the weapon (its card comes back).`
        : mode === 'uncard'
          ? `Seyla coaxes every card out of a piece, whole, and the slots stay open for others. ${UNCARD_FEE.toLocaleString()} perz a card.`
          : `Press the ${ITEMS[card].name} into a free slot of ${cardOn(ITEMS[card].card).map((s) => SLOTS[s].toLowerCase()).join(' or ')} gear. It stays until Seyla in Galdrheim draws it out.`;
    let h = `<div class="rnote">${esc(note)}</div><div class="rlist">`;
    for (const p of list) {
      const it = ITEMS[p.key], on = this.smithSel?.where === p.where && this.smithSel?.key === p.key;
      h += `<div class="ritem smithrow${on ? ' sel' : ''}">${icon(p.key, 'sm')}<div><b>${esc(it.name)}</b><small>${esc(SLOTS[it.slot])} · ${p.where === 'bag' ? 'in your bag' : 'worn'}${upgradeLine(it) ? ' · ' + esc(upgradeLine(it)) : ''}</small></div>
        <button class="rbtn soft" data-act="smithpick" data-where="${p.where}" data-id="${esc(p.key)}">${on ? 'Picked' : 'Pick'}</button></div>`;
    }
    if (!list.length) h += `<div class="rnote">${mode === 'insert' ? 'Nothing you have has a free slot of the right kind. Seyla in Galdrheim can open one.' : mode === 'uncard' ? 'Nothing you have holds a card.' : 'Nothing you have can be worked on here.'}</div>`;
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
      } else if (mode === 'uncard') {
        const n = it.cards.length, fee = UNCARD_FEE * n, after = ITEMS[makeKey(parseKey(sel.key).base, { ...parseKey(sel.key), cards: [] })];
        what = `${esc(it.name)} → ${esc(after.name)}${this.cardsBlock(it)}<small class="calm">The card${n > 1 ? 's come' : ' comes'} back to your bag, whole.</small>`;
        costs = perzRow(fee); can = inv.perz >= fee; label = n > 1 ? 'Remove the cards' : 'Remove the card';
      } else {
        // the preview: what the piece becomes with the card in it
        const u = parseKey(sel.key), after = ITEMS[makeKey(u.base, { ...u, cards: [...u.cards, card] })];
        what = `${esc(ITEMS[card].name)} → <b>${esc(after.name)}</b><small class="calm">The card: ${esc(cardLine(ITEMS[card].card))}</small><small class="calm">Becomes: ${esc(equipLine(after))}</small>`;
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
        return `<span class="cost ${have >= n ? 'ok' : ''}" title="${esc(ITEMS[id].name)}">${icon(id, 'xs')}${esc(ITEMS[id].name)} ${Math.min(have, 999)}/${n}</span>`;
      }).join('');
      const btn = st === 'level' ? `<span class="rtag">Base Lv ${r.lv}</span>`
        : `<button class="rbtn" data-act="craft" data-id="${r.item}" ${st === 'ready' ? '' : 'disabled'}>Craft</button>`;
      const what = it.type === 'equip' ? [SLOTS[it.slot], equipLine(it), it.fx ? it.desc : '', it.jobs ? jobLine(it) : ''].filter(Boolean).join(' · ') : it.desc;
      h += `<div class="ritem recipe ${st}">${icon(r.item, 'sm')}<div><b>${esc(it.name)}</b><small>${esc(what)}</small><div class="costs">${cost}</div></div>${btn}</div>`;
    }
    return h + '</div>';
  }

  // the Keepers' storage beside the bag, in sections (each shows the bag's and the storage's of its kind)
  chest() {
    const inv = this.inv, tab = this.chestTab || 'all', of = (store) => store.slots.filter((s) => tab === 'all' || chestKind(s.id) === tab);
    const n = (k) => inv.chest.slots.filter((s) => chestKind(s.id) === k).length;
    const tabs = Object.entries(CHEST_TABS).map(([k, name]) => `<button class="rtab${tab === k ? ' on' : ''}" data-act="chesttab" data-id="${k}">${name}${k === 'all' ? '' : ` <small>${n(k)}</small>`}</button>`).join('');
    return `<div class="rtabs">${tabs}</div><div class="rnote">Tap an item to move it; for a stack, choose how many. Storage is shared by all your heroes.</div><div class="chestwrap2">
      <div><div class="rsub">Bag ${inv.bag.slots.length}/${BAG_SLOTS}</div>${this.grid(of(inv.bag), 'bag', 18)}</div>
      <div><div class="rsub">Storage ${inv.chest.slots.length}/${CHEST_SLOTS}</div>${this.grid(of(inv.chest), 'chest', 18)}</div></div>${this.chestCount()}`;
  }
  // how many of a stack to move: the bar under the bag and storage, once a stack of more than one is picked
  chestCount() {
    const c = this.chestSel, inv = this.inv;
    const have = c ? (c.side === 'bag' ? inv.bag : inv.chest).count(c.id) : 0;
    if (!c || have < 2) { this.chestSel = null; return ''; }
    c.n = Math.max(1, Math.min(c.n, have, 999));
    const step = (d, label) => `<button class="rbtn soft cnt" data-act="chestn" data-id="${d}">${label}</button>`;
    return `<div class="rdetail chestcount">${icon(c.id, 'xs')}<b>${esc(ITEMS[c.id].name)}</b><small>${have} in your ${c.side === 'bag' ? 'bag' : 'storage'}</small>
      <div class="btnrow">${step(-10, '−10')}${step(-1, '−1')}<span class="cntn">${c.n}</span>${step(1, '+1')}${step(10, '+10')}${step('all', 'All')}
      <button class="rbtn" data-act="chestmove">${c.side === 'bag' ? 'Store' : 'Take'} ${c.n}</button></div></div>`;
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
    return `<div class="costs"><span class="cost ok">${(r.xp * QUEST_RATE.base).toLocaleString()} Base EXP · ${(Math.round((r.job ?? r.xp * 0.7)) * QUEST_RATE.job).toLocaleString()} Job EXP</span>${r.perz ? `<span class="cost ok">${r.perz.toLocaleString()} perz</span>` : ''}${items}</div>`;
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
    this.wins.talk.classList.remove('raidwin'); // (wide only for the raid's crossings)
    let text, box = '', btns = '<button class="rbtn soft" data-act="close">Bye</button>', quizzing = false;
    // what they say on seeing this hero: their own line for the hero's job and chapter, if they have one
    const step = this.hooks.storyStep?.(), ch = step ? +(/Chapter (\d+)/.exec(step.ch)?.[1] || 0) : 99;
    const greet = n.greet?.({ job: JOBS[p.job].name, jobId: p.job, tier: p.tier, baseLv: p.baseLv, ch });
    // what else they do: trade and craft
    const extra = (n.retrain ? '<button class="rbtn" data-act="retrainwin">Reset stats / skills</button>' : '')
      + (n.stylist ? '<button class="rbtn" data-act="stylist">Change my look</button>' : '')
      + (n.shop ? '<button class="rbtn" data-act="shop">Buy / Sell</button>' : '')
      + (n.craft ? `<button class="rbtn" data-act="craftwin" data-id="${n.craft}">${CRAFTERS[n.craft].button}</button>` : '')
      + [n.smith || []].flat().map((k) => `<button class="rbtn" data-act="smithwin" data-id="${k}">${SMITHS[k].button}</button>`).join('')
      + (n.heal ? '<button class="rbtn" data-act="heal">Heal me</button>' : '')
      + (n.warp ? '<button class="rbtn" data-act="ferrylist">Travel</button>' : '')
      + (n.raid ? `<button class="rbtn" data-act="ferrylist">${esc(RAIDS[n.raid].name)}</button>` : '')
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
    if (n.raid && this.ferrying) return this.raidPanel(n);
    if (n.warp && this.ferrying) { // the lands you have walked, and the fare to each
      const list = this.hooks.ferryList?.() || [];
      const rows = list.map(([m, fare]) => `<button class="rbtn" data-act="ferry" data-id="${m}" ${this.inv.perz < fare ? 'disabled' : ''}>${esc(ZONE_NAMES[m])} · ${fare.toLocaleString()} perz</button>`).join('');
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>Where to? You have ${this.inv.perz.toLocaleString()} perz.</p><div class="btnrow wrap">${rows || '<span>You have not walked any other land yet.</span>'}</div>
        <div class="btnrow"><button class="rbtn soft" data-act="close">Bye</button></div></div></div>`;
    }
    if (n.retrain && this.retraining) { // the trainers: stats, and a job's skills, back to be placed again
      const p = this.prog, cost = (k) => (p.resets[k] ? RETRAIN_COST : 0), sure = this.retrainSure;
      const inTrial = Object.values(NPCS).some((o) => o.trial2?.some((k) => k in this.quests.active));
      const skillsOk = p.tier === 2 || (p.tier === 1 && !inTrial), second = p.tier === 2 ? JOBS[p.job].name : null;
      const row = (k, label, ok, why) => `<button class="rbtn ${sure === k ? 'danger' : ''}" data-act="retrain" data-id="${k}" ${ok && this.inv.perz >= cost(k) ? '' : 'disabled'}>${sure === k ? 'Yes, start over' : label} · ${cost(k) ? cost(k).toLocaleString() + ' perz' : 'free'}</button>${ok ? '' : `<small>${why}</small>`}`;
      this.wins.talk.querySelector('.rw-title').textContent = n.name;
      return `<div class="talkwrap"><img class="portrait" src="${this.portrait(this.npc)}" alt="">
        <div class="say"><p>Not happy with how you trained? The first time is on me. After that, the masters charge ${RETRAIN_COST.toLocaleString()} perz.</p>
        <div class="qbox"><small>Stats: every stat back to 1, and all your points to place again.</small><small>${second ? `Skills: every ${esc(trainTrees(p).filter((j) => JOBS[j].tier >= 1).reverse().map((j) => JOBS[j].name).join(', ').replace(/, ([^,]*)$/, ' and $1'))} skill unlearnt, and the points back. Your Trainee skills stay. ${esc(second)} skills can be raised again once the first jobs are rebuilt: ${esc(this.secondRule(p.job))}, and every first-job point spent.` : 'Skills: every Blader, Sorcerer and Archer skill unlearnt, and the points back. Your Trainee skills stay.'}</small></div>
        <div class="btnrow wrap retrain">${row('stats', 'Reset my stats', true, '')}${row('skills', second ? 'Reset my job skills' : 'Reset my first-job skills', skillsOk, p.tier === 1 ? 'Not during a second-job trial.' : 'Choose a first job first.')}</div>
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
        : keep ? 'You keep your Job Level and skill points: every first job shares them. You can switch back here any time.' : 'Job Level starts again at 1.'}</small>`;
      btns = `<button class="rbtn soft" data-act="close">Not yet</button><button class="rbtn" data-act="jobchange" data-id="${st.job}">Become ${/^[AEIOU]/.test(JOBS[st.job].name) ? 'an' : 'a'} ${JOBS[st.job].name}</button>`;
    } else if (st.state === 'offer') {
      const first = st.id === n.quests[0] || st.id === n.trial?.[0] || st.id === n.trial2?.[0];
      text = (first ? (greet || n.hello) + ' ' : '') + st.q.intro;
      box = `<b class="${st.q.job ? 'jobq' : ''}">${esc(st.q.title)}</b><small>${esc(this.quests.goal(st.q))}${st.q.repeat ? ' · a bounty: take it again whenever you like' : ''}</small>${this.questReward(st.id)}`;
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
    // several first jobs walked: a Keeper switches you between them
    if (n.keeper && this.hooks.keeperKnown?.(this.npc) && p.tier === 1) {
      for (const j of p.unlocked) if (JOBS[j].tier === 1 && j !== p.job) btns = `<button class="rbtn" data-act="jobchange" data-id="${j}">Switch to ${JOBS[j].name}</button>` + btns;
    }
    if (n.job2 && p.tier === 1 && !p.unlocked.includes(n.job2) && st.state === 'finished') text = n.trial2Hint || n.trialHint;
    // a quest on offer never hides the shop or the workbench (turning the quest down must not lock them away)
    if (extra && !quizzing && st.state !== 'job' && st.state !== 'ready') btns = extra + btns;
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
      if (el && k === 'talk') this.place(el, el.offsetLeft, el.offsetTop); // a talk that grows (a trainer's choices, a Keeper's towns) moves up to fit
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
    if (act === 'lookbody') { // the other body; a new hero's hair follows it the first time (it can be changed back)
      const b = t.dataset.id, d = this.lookDraft;
      if ((d.body || 'm') !== b && this.lookMode === 'new') d.hair = b === 'f' ? (d.hair === 'messy' ? 'pony' : d.hair) : (d.hair === 'pony' || d.hair === 'long' ? 'messy' : d.hair);
      d.body = b;
      this.hooks.look?.(d); this.hooks.ui?.(); this.render(id);
    }
    if (act === 'lookdye') { this.lookDraft.dye = t.dataset.id; this.hooks.look?.(this.lookDraft); this.hooks.ui?.(); this.render(id); }
    if (act === 'lookok') {
      if (this.lookBlocked()) return;
      const mode = this.lookMode;
      this.lookDraft.name = this.lookDraft.name.trim();
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
    if (act === 'totitle') this.hooks.toTitle?.(); // back to the title screen, to play another hero
    if (act === 'sound') { this.hooks.toggleSound?.(); this.render(id); }
    if (act === 'statreset') { this.pend = {}; this.hooks.ui?.(); this.render(id); }
    if (act === 'statconfirm') {
      for (const [k, n] of Object.entries(this.pend)) for (let i = 0; i < n; i++) this.prog.raise(k);
      this.pend = {};
      this.hooks.raised?.();
      this.render();
    }
    if (act === 'learn') this.hooks.learn?.(t.dataset.id);
    if (act === 'sktab') { this.skTab = t.dataset.id; this.skSel = null; this.skMenu = false; this.render(id); }
    // the first-jobs tab: shows the first job picked; tapped again, it opens the list of the others
    if (act === 'skfirst') {
      if (this.skTab === this.skFirst) this.skMenu = !this.skMenu;
      else { this.skTab = this.skFirst; this.skSel = null; }
      this.render(id);
    }
    if (act === 'sksel') { this.skSel = t.dataset.id; this.render(id); }
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
      const res = mode === 'refine' ? inv.refine(where, key) : mode === 'enchant' ? inv.enchant(where, key) : mode === 'uncard' ? inv.uncard(where, key) : inv.insert(this.smithCard, where, key);
      if (res.error) { this.message(res.error); return; }
      this.smithSel = res.key ? { where, key: res.key } : null;
      if (mode === 'insert') { this.message(`The card sinks into it: ${ITEMS[res.key].name}.`); this.close('smith'); this.selected = null; }
      else if (mode === 'uncard') { this.smithSel = null; this.message(`Seyla draws out the ${res.cards.map((c) => ITEMS[c].name).join(' and the ')}. It's in your bag.`); }
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
    if (act === 'raidgo') this.hooks.raidGo?.(NPCS[this.npc].raid, t.dataset.id);
    if (act === 'raidpick') { this.raidPick = t.dataset.id; this.render('talk'); }
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
    if (act === 'chesttab') { this.chestTab = t.dataset.id; this.render(id); }
    if (act === 'chestn' && this.chestSel) { const d = t.dataset.id; this.chestSel.n = d === 'all' ? 999 : this.chestSel.n + +d; this.render(id); }
    if (act === 'chestmove' && this.chestSel) {
      const c = this.chestSel, from = c.side === 'bag' ? inv.bag : inv.chest, to = c.side === 'bag' ? inv.chest : inv.bag;
      if (!inv.moveStack(from, to, c.id, c.n)) this.message(to === inv.bag ? 'Bag is full' : 'Chest is full');
      this.chestSel = null; this.render(id);
    }
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
        if (from.count(t.dataset.id) > 1 && ITEMS[t.dataset.id].type !== 'equip') { // a stack: how many? (all of it to start with)
          this.chestSel = { side: t.dataset.side, id: t.dataset.id, n: Math.min(999, from.count(t.dataset.id)) };
          this.render(id);
        } else if (!inv.moveStack(from, to, t.dataset.id)) this.message(to === inv.bag ? 'Bag is full' : 'Chest is full');
      } else {
        this.selected = t.dataset.id;
        this.render(id);
      }
    }
    if (act === 'use' && this.selected) this.hooks.useItem?.(this.selected);
    if (act === 'craft') {
      const r = RECIPES.find((x) => x.item === t.dataset.id);
      const made = inv.craft(r);
      if (made) { this.hooks.crafted?.(r); this.message(made !== r.item ? `Crafted ${ITEMS[made].name}: it came out with a card slot! It's in your bag.` : `Crafted ${ITEMS[r.item].name}. It's in your bag.`); }
      else this.message('Bag is full');
    }
  }
}
