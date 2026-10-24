import * as THREE from 'three';
import './style.css';
import { createSprites } from './sprites.js';
import { buildWorld, ZONE_NAMES } from './world.js';
import { CITY } from './city.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { FX } from './fx.js';
import { MobManager } from './mobs.js';
import { loadSave, writeSave } from './save.js';
import { Inventory } from './inventory.js';
import { Progress, JOBS } from './progress.js';
import { Quests, QUESTS, NPCS } from './quests.js';
import { Story, INTRO, route } from './story.js';
import { Villagers } from './villagers.js';
import { Tiles } from './tiles.js';
import { Hotbar } from './hotbar.js';
import { derive, playerAttack, mobAttack, magicAttack } from './rules.js';
import { SKILLS, skillLv, spCost, castTime, learn, skillList } from './skills.js';
import { Menus } from './menus.js';
import { iconTexture, iconURL, ITEMS } from './items.js';
import { DayNight } from './daynight.js';
import { Audio } from './audio.js';
import { clearSave } from './save.js';
import { clamp, lerp } from './noise.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

const scene = new THREE.Scene();
const SKY = new THREE.Color('#a3c9d8');
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 24, 50);

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 120);
const hemi = new THREE.HemisphereLight('#fff6e2', '#6b5a40', 1.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d0', 1.6);
sun.position.set(-20, 30, -12);
scene.add(sun);

const lib = createSprites();
const world = buildWorld(scene, lib);
const fx = new FX(scene, world, lib);
const mobs = new MobManager(scene, world, lib, fx);
// monsters per map: [type, count, nightOnly]. Night brings Firefly Wisps and ~20% more of the rest
const SPAWNS = {
  camp: [],
  grove: [['slime', 12], ['sprout', 9], ['wisp', 5, true], ['slime', 3, true], ['sprout', 2, true]],
  fen: [['blueSlime', 9], ['crab', 7], ['wisp', 5, true], ['blueSlime', 2, true], ['crab', 1, true]],
  hollow: [['mushling', 12], ['wisp', 5, true], ['mushling', 2, true]],
  ridge: [['beetle', 10], ['jarl', 1], ['wisp', 5, true], ['beetle', 2, true]],
  city: [],
  birch: [['russet', 10], ['sprout', 5], ['slime', 4], ['matron', 1], ['wisp', 4, true], ['russet', 2, true]],
  coast: [['brine', 9], ['tidecrab', 8], ['crab', 3], ['tideKing', 1], ['wisp', 4, true], ['brine', 2, true]],
  deep: [['gloomcap', 10], ['mushling', 4], ['shadeWisp', 6], ['gloomMother', 1], ['gloomcap', 2, true]],
  heath: [['cinderBeetle', 9], ['emberWisp', 6], ['beetle', 3], ['cinderLord', 1], ['cinderBeetle', 2, true]],
};

const save = loadSave();
let lookBefore = null; // the look kept, while one is being tried on
mobs.mvpAt = save?.mvpAt || 0;
const player = new Player(scene, world, lib.player, lib.shadow, fx);
player.setPos(save?.x ?? world.spawn.x, save?.z ?? world.spawn.z);
if (save?.look) player.setLook(save.look.hair === 'long' ? { ...save.look, hair: 'mane' } : save.look); // the straight long hair waits for a female look
lookBefore = { ...player.look };
const prog = new Progress();
prog.load(save?.prog);
const quests = new Quests();
quests.load(save?.quests);
const story = new Story();
if (!story.load(save?.story) && save) story.catchUp(prog); // a save from before the story
const villagers = new Villagers(scene, world, lib);
player.tiles = new Tiles(world); // after the villagers: they block their tiles
const inv = new Inventory();
inv.level = () => prog.baseLv;
inv.job = () => prog.job;
// the player's look follows the job: the Trainee's clothes, then the Blader's or the Sorcerer's
const jobArt = () => ({ novice: lib.novice, swordman: lib.player, mage: lib.sorcerer || lib.novice }[prog.job] || lib.player);
player.setArt(jobArt());
inv.load(save?.inv);
inv.dropUnwearable(); // gear rules can change between versions
// stats + gear -> the player's battle numbers (Ragnarok rules); HP/SP stay put, capped by the new max
// timed buffs, in seconds left: aspd (Quickening Draught), warcry (War Cry's ATK bonus)
const buffs = { aspd: 0, warcry: 0, ward: 0 };
let warcryLv = 0, wardLv = 0, endureGuard = 0;
function applyStats() {
  const gear = inv.gearStats();
  const hide = skillLv(prog, 'ironhide');
  const sword = ITEMS[inv.gear.weapon]?.kind !== 'staff';
  gear.mastery = skillLv(prog, 'basics') + (sword ? 2 * skillLv(prog, 'discipline') : 0);
  gear.flee += skillLv(prog, 'footwork') ? 3 : 0;
  gear.def += hide;
  if (buffs.aspd > 0) gear.aspdRate *= 0.9;
  const ps = derive(prog, gear);
  ps.maxHp = Math.floor(ps.maxHp * (1 + hide / 100));
  ps.maxSp = Math.floor(ps.maxSp * (1 + skillLv(prog, 'manawell') / 50));
  player.ps = ps;
  player.maxHp = ps.maxHp;
  player.maxSp = ps.maxSp;
  player.hp = Math.min(player.hp, ps.maxHp);
  player.sp = Math.min(player.sp, ps.maxSp);
  player.speedMul = inv.wearing('speed') ? 1.2 : 1;
  player.setHeadgear(inv.gear.head, inv.gear.face);
  player.blockChance = inv.wearing('block') ? 0.2 : 0;
}
applyStats();
player.hp = typeof save?.hp === 'number' && save.prog?.v === 2 ? clamp(save.hp, 1, player.maxHp) : player.maxHp;
player.sp = typeof save?.sp === 'number' ? clamp(save.sp, 0, player.maxSp) : player.maxSp;
inv.onChange(applyStats);

const input = new Input();
const ui = new UI(world);
ui.mobs = mobs;
ui.prog = prog;
ui.jobName = () => JOBS[prog.job].name;

const cam = { yaw: save?.yaw ?? 0, dist: save?.dist ?? 12, target: new THREE.Vector3(), shake: 0 };

// ---------- maps and warp portals ----------
// go to a map: its monsters, tiles and ground; at = where to stand (else beside the portal back)
function enterMap(id, from, at) {
  const arrive = world.go(id, from);
  const pos = at || arrive;
  mobs.setMap(SPAWNS[world.id], 11 + world.id.length);
  villagers.show(world.id);
  player.tiles.rebuild();
  fx.clearPickups();
  player.stop();
  player.setPos(pos.x, pos.z);
  cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);
}
// saves from before the maps were split only know the camp
enterMap(save?.map && ZONE_NAMES[save.map] ? save.map : 'camp', null, save?.map ? { x: save.x, z: save.z } : null);

let warping = false;
function warp(id, from, at) {
  if (warping) return;
  warping = true;
  player.stop();
  audio.play('dodge');
  const veil = document.getElementById('warp');
  veil.classList.add('show');
  setTimeout(() => {
    enterMap(id, from, at);
    ui.showZone(world.id);
    persist();
    veil.classList.remove('show');
    setTimeout(() => { warping = false; }, 300);
  }, 260);
}
const warpTo = (id) => warp(id, null);
// Wander Feather: a random open spot on this map
function warpRandom() {
  for (let i = 0; i < 200; i++) {
    const x = 4 + Math.random() * 56, z = 4 + Math.random() * 56;
    const t = player.tiles.tileAt(x, z);
    if (player.tiles.blocked[t[1] * 64 + t[0]] || world.portals.some((p) => Math.hypot(p.x - x, p.z - z) < 3)) continue;
    warp(world.id, null, { x: t[0] + 0.5, z: t[1] + 0.5 });
    return;
  }
}
// stepping onto a portal takes you through it
function checkPortals() {
  if (warping || player.state !== 'normal') return;
  for (const p of world.portals) {
    if (Math.hypot(p.x - player.x, p.z - player.z) < 0.75) { warp(p.to, world.id); return; }
  }
}

const audio = new Audio();

// ---------- combat wiring ----------
// damage numbers float up from whoever was hit, Ragnarok style
const overHead = (o, h) => world.heightAt(o.x, o.z) + h;
player.on('swing', () => audio.play('swing'));
player.on('strike', (m, res) => {
  const y = overHead(m, m.sprite.scale.y * 0.8);
  if (res.miss) fx.number(m.x, y, m.z, 'Miss', 'miss');
  else {
    fx.number(m.x, y, m.z, res.dmg, res.crit || res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
    audio.play('hit');
    // Battle Rhythm: every fifth hit that lands gives back 1 SP
    if (skillLv(prog, 'rhythm') && ++rhythm % 5 === 0) player.healSp(1);
  }
});
player.on('hurt', (n) => {
  ui.hurt(); cam.shake = 0.2; audio.play('hurt');
  fx.number(player.x, overHead(player, 1.3), player.z, n, 'taken');
});
mobs.on('miss', (m, res) => fx.number(player.x, overHead(player, 1.3), player.z, res.dodge ? 'Lucky!' : 'Miss', 'miss'));
player.on('block', () => {
  audio.play('block');
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#e8eef5', 5);
  fx.number(player.x, overHead(player, 1.3), player.z, 'Block', 'miss');
});
player.on('faint', () => {
  audio.play('faint');
  const lost = prog.deathPenalty();
  ui.faint(true, lost.base || lost.job ? `Returning to camp · lost ${lost.base} Base EXP, ${lost.job} Job EXP` : 'Returning to camp');
  setTimeout(() => {
    enterMap('camp', null);
    player.revive(world.spawn.x, world.spawn.z);
    cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);
    ui.faint(false);
  }, 2200);
});
mobs.on('death', (m, drops) => {
  audio.play('kill');
  gainExp(...m.def.exp);
  for (const id of quests.onKill(m.type)) questComplete(id);
  story.onKill(m.type);
  for (const [item, count] of drops) {
    fx.drop(m.x, m.z, item, count, iconTexture(item));
    if (ITEMS[item].rare) { // a rare find: a golden burst and a word, like Ragnarok's drop glow
      fx.sparkle(m.x, world.heightAt(m.x, m.z) + 0.5, m.z, '#ffd23a', 20);
      audio.play('heart');
      menus.message(`Rare drop! The ${m.def.name} dropped ${ITEMS[item].name}.`);
    }
  }
});

mobs.on('spore', (m) => {
  audio.play('spore');
  const y = world.heightAt(m.x, m.z) + 0.4;
  fx.cloud(m.x, y, m.z);
  if (Math.hypot(player.x - m.x, player.z - m.z) < 2.6) {
    if (player.slowT <= 0) menus.message('Spores! You feel sluggish');
    player.slowT = 2.2;
  }
});

// ---------- the MVP ----------
mobs.on('windup', (m) => {
  audio.play('swing');
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff8a3a', 10);
});
mobs.on('stomp', (m) => { // the ground bursts around the boss
  const y = world.heightAt(m.x, m.z);
  fx.puff(m.x, y + 0.2, m.z, 2.4);
  fx.sparkle(m.x, y + 0.3, m.z, '#ff6a1a', 24);
  audio.play('hit');
  if (Math.hypot(player.x - m.x, player.z - m.z) > 3.2) return;
  cam.shake = 0.35;
  if (!player.canBeHit()) return;
  const res = mobAttack(m.def, player.ps, 1.5);
  if (res.miss) fx.number(player.x, overHead(player, 1.3), player.z, 'Miss', 'miss');
  else player.takeDamage(res.dmg, m.x, m.z);
});
mobs.on('mvpSpawn', () => {
  menus.message('The ground trembles… the Ember Jarl has woken in Glodberg!');
  audio.play('night');
});
// Ragnarok's MVP: the announcement over the slayer's head, MVP EXP and items straight to the bag
mobs.on('mvp', (m) => {
  const d = m.def;
  fx.number(player.x, overHead(player, 1.7), player.z, 'MVP', 'mvp', player);
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 30);
  audio.play('levelup');
  menus.message(`You defeated the ${d.name}! MVP! +${d.mvpExp * RATES.base} Base EXP`);
  for (const [id, n] of d.mvpDrops) {
    const got = inv.add(id, n);
    if (got < n) inv.chest.add(id, n - got);
    menus.toast(id, n);
  }
  gainExp(d.mvpExp, 0);
  const mins = Math.round(d.respawn / 60);
  setTimeout(() => menus.message(`The ${d.name} will return in about ${mins} minutes.`), 2500);
  persist();
});

// ---------- experience: Base and Job EXP, like Ragnarok ----------
// server rates, like a Ragnarok server's "x8 / x12": every Base and Job EXP gain is multiplied.
// Set high for now so the Ember Jarl is in reach after about half an hour of play.
const RATES = { base: 8, job: 12 };
const knownSkills = () => new Set(skillList(prog.job).filter((id) => skillLv(prog, id)));
function announceSkills(before) {
  for (const id of knownSkills()) if (!before.has(id) && (SKILLS[id].free || SKILLS[id].granted)) menus.message(`New skill: ${SKILLS[id].name}! See the Skills window.`);
}
function gainExp(base, job) {
  const k = inv.wearing('exp') ? 1.25 : 1;
  const known = knownSkills();
  const ups = prog.gain(Math.round(base * k * RATES.base), Math.round(job * k * RATES.job));
  if (!ups.base && !ups.job) return;
  applyStats();
  const y = world.heightAt(player.x, player.z);
  if (ups.base) {
    player.heal(player.maxHp); // a base level up restores HP and SP
    player.healSp(player.maxSp);
    audio.play('levelup');
    fx.sparkle(player.x, y + 0.6, player.z, '#ffe37a', 14);
    fx.number(player.x, y + 1.9, player.z, 'Level Up', 'level');
    menus.message(`Base Level ${prog.baseLv}! ${prog.statPoints} stat point${prog.statPoints === 1 ? '' : 's'} to spend in the Status window.`);
  }
  if (ups.job) {
    if (!ups.base) audio.play('levelup');
    fx.sparkle(player.x, y + 0.6, player.z, '#9fd4ff', 10);
    fx.number(player.x, y + (ups.base ? 2.3 : 1.9), player.z, 'Job Level Up', 'job');
    menus.message(`Job Level ${prog.jobLv}!${prog.skillPoints ? ` ${prog.skillPoints} skill point${prog.skillPoints === 1 ? '' : 's'} to spend in the Skills window.` : ''}`);
    announceSkills(known);
  }
  if (menus.open) menus.render();
  persist();
}

// ---------- quests ----------
const questGiver = (id) => Object.keys(NPCS).find((n) => NPCS[n].quests.includes(id) || NPCS[n].trial === id);
function questComplete(id) {
  audio.play('heart');
  menus.message(`${QUESTS[id].title} complete! Return to ${NPCS[questGiver(id)].name}.`);
  refreshQuests();
}
function giveReward(r) {
  if (r.perz) { inv.addPerz(r.perz); menus.message(`+${r.perz.toLocaleString()} perz`); }
  for (const [id, n] of Object.entries(r.items || {})) {
    const got = inv.add(id, n);
    if (got < n) inv.chest.add(id, n - got); // bag full: it goes to the chest
    menus.toast(id, n);
  }
  gainExp(r.xp, r.job ?? Math.round(r.xp * 0.7));
}
// '!' / '?' bubbles over villagers, and the quest list under the clock: the story step first,
// then the active quests. It collapses to its title bar and scrolls when it gets long.
const tracker = document.getElementById('quests');
tracker.innerHTML = '<button class="qhead" aria-expanded="true"><span>Quests</span><i>▾</i></button><div class="qlist"></div>';
const trackerList = tracker.querySelector('.qlist'), trackerHead = tracker.querySelector('.qhead span');
const MIN_KEY = 'aria.questsMin';
let trackerMin = false;
try { trackerMin = localStorage.getItem(MIN_KEY) === '1'; } catch { /* storage unavailable */ }
const setMin = (v) => {
  trackerMin = v;
  tracker.classList.toggle('min', v);
  tracker.querySelector('.qhead').setAttribute('aria-expanded', String(!v));
  try { localStorage.setItem(MIN_KEY, v ? '1' : '0'); } catch { /* storage unavailable */ }
};
setMin(trackerMin);
tracker.querySelector('.qhead').addEventListener('click', () => { setMin(!trackerMin); audio.play('ui'); });
let trackerHTML = '';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function refreshQuests() {
  villagers.setMarks((npc) => {
    if (story.talkStep(npc) && storyLive()) return 'story';
    const st = quests.status(npc, prog, inv).state;
    return st === 'offer' || st === 'job' ? 'offer' : st === 'ready' ? 'ready' : null;
  });
  let h = '';
  const s = story.step;
  if (s && storyLive()) {
    const where = story.directions(world.id);
    h += `<div class="story"><small>${esc(s.ch)}</small><b>★ ${esc(s.title)}</b><span>${esc(s.goal)}${story.progress()}</span>${where ? `<em>➜ ${esc(where)}</em>` : ''}</div>`;
  }
  for (const id of Object.keys(quests.active)) {
    const done = quests.ready(id, inv);
    h += `<div class="${done ? 'done' : ''}"><b>${QUESTS[id].title}</b><span>${done ? `Return to ${NPCS[questGiver(id)].name}` : quests.progress(id, inv)}</span></div>`;
  }
  const n = Object.keys(quests.active).length + (s && storyLive() ? 1 : 0);
  trackerHead.textContent = `Quests${n ? ` (${n})` : ''}`;
  tracker.hidden = !n;
  if (h !== trackerHTML) { trackerHTML = h; trackerList.innerHTML = h; }
  // the minimap rings where to go: the person to talk to, or the portal on the way
  ui.goal = null;
  const map = s && storyLive() ? story.map() : null;
  if (map === world.id && s.kind === 'talk') ui.goal = { x: NPCS[s.npc].x, z: NPCS[s.npc].z };
  else if (map && map !== world.id) { const p = route(world.id, map); if (p) ui.goal = { x: p.x, z: p.z }; }
}

// ---------- the story ----------
const storyLive = () => !!story.flags.intro && !story.done; // after the opening pages
// a step is done: its lines play, then the reward, then the next step is announced
function storyDone() {
  const s = story.advance();
  menus.story(s.say || [], `${s.ch} · ${s.title}`, () => {
    if (s.reward) giveReward(s.reward);
    audio.play('heart');
    const next = story.step;
    if (next) menus.message(`Story: ${next.title}. ${next.goal}`);
    refreshQuests();
    persist();
  });
}
function checkStory() {
  if (!storyLive() || menus.isOpen('story')) return;
  if (story.met({ prog, hotbar, skillLv })) storyDone();
}
function startStory() {
  if (story.flags.intro) return;
  menus.story(INTRO, 'Prologue · The Last Fire-Ring', () => {
    story.flag('intro');
    refreshQuests();
    persist();
  });
}

let bagFullNote = 0;
function collect(p) {
  const got = inv.add(p.item, p.count);
  if (got) { menus.toast(p.item, got); audio.play('pickup'); }
  if (got < p.count) {
    p.count -= got;
    if (performance.now() - bagFullNote > 4000) { bagFullNote = performance.now(); menus.message('Bag is full. Store items in the camp chest.'); }
    return false;
  }
  return true;
}

// ---------- menus + camp interactions ----------
const menus = new Menus(inv, prog, player, {
  useItem: (id) => useItem(id),
  learn(id) {
    const known = knownSkills();
    if (!learn(prog, id)) return;
    applyStats();
    audio.play('craft');
    announceSkills(known);
    menus.render();
    persist();
  },
  jobChange(job) {
    const known = knownSkills();
    prog.job = job;
    prog.jobLv = 1;
    prog.jobExp = 0;
    // a new Sorcerer is handed a staff
    if (job === 'mage' && !inv.bag.count('oak_staff') && inv.gear.weapon !== 'oak_staff') { inv.add('oak_staff', 1); menus.toast('oak_staff', 1); }
    const off = inv.dropUnwearable();
    if (job === 'mage' && !inv.gear.weapon) inv.equip('oak_staff'); // straight into the new Sorcerer's hand
    if (off.length) menus.message(`Put away what a ${JOBS[job].name} can't use: ${off.map((i) => ITEMS[i].name).join(', ')}`);
    player.setArt(jobArt());
    applyStats();
    player.heal(player.maxHp);
    player.healSp(player.maxSp);
    audio.play('levelup');
    const y = world.heightAt(player.x, player.z);
    fx.sparkle(player.x, y + 0.6, player.z, '#ffe37a', 24);
    fx.number(player.x, y + 1.9, player.z, `${JOBS[job].name}!`, 'level');
    menus.message(`You are now a ${JOBS[job].name}! Earn Job Levels for skill points.`);
    announceSkills(known);
    menus.render();
    persist();
  },
  crafted() { audio.play('craft'); persist(); },
  traded(kind) { audio.play('pickup'); if (kind === 'sell') story.flag('sold'); persist(); },
  equipped() { audio.play('ui'); persist(); },
  raised() { applyStats(); audio.play('craft'); persist(); },
  accept(id) {
    quests.accept(id);
    for (const done of quests.onZone(world.zoneAt(player.x, player.z))) questComplete(done);
    audio.play('ui');
    menus.message(`New quest: ${QUESTS[id].title}`);
    menus.close('talk');
    refreshQuests();
  },
  handIn(id) {
    const r = quests.turnIn(id, inv);
    if (!r) return;
    audio.play('craft');
    giveReward(r);
    refreshQuests();
    menus.render();
    persist();
  },
  ui() { audio.play('ui'); },
  soundOn: () => audio.enabled,
  toggleSound() { audio.setEnabled(!audio.enabled); },
  closed() { persist(); },
  // the hair picker tries looks on as you choose; lookDone keeps one (the stylist charges for it)
  look(l) { player.setLook(l); },
  currentLook: () => ({ ...player.look }),
  lookDone(l, mode) {
    if (mode === 'stylist') {
      if (inv.perz < 1000) { player.setLook(lookBefore); menus.message('Not enough perz'); return; }
      inv.perz -= 1000;
      inv.changed();
      menus.message('Embla steps back, pleased: "Like a hero of the songs!"');
    }
    player.setLook(l);
    lookBefore = { ...player.look };
    audio.play('craft');
    persist();
    if (mode === 'new') startStory();
  },
});
menus.quests = quests;
const portraits = {};
menus.portrait = (id) => (id === 'player' ? (portraits[`${prog.job}|${jobArt().dressed}`] ||= jobArt().anims.down.idle[0].image.toDataURL())
  : (portraits[id] ||= lib.villagers[id].anims.down.idle[0].image.toDataURL()));
// things in camp and town you tap to use: the player walks over, then it opens. h = height on screen
const SPOTS = [
  { map: 'camp', ...world.camp.fire, h: 0.9, run: () => menus.message('A warm fire. Crafting is done in Steinborg now: Gunnar forges gear, Ragna brews usables.') },
  { map: 'camp', ...world.camp.chest, h: 0.8, run: () => menus.show('chest') },
  { map: 'camp', ...world.camp.tent, h: 2.2, run: () => rest() },
  { map: 'city', ...CITY.chest, h: 0.8, run: () => menus.show('chest') }, // Steinborg's storehouse: the same chest
  ...villagers.list.map((v) => ({ map: v.map, x: v.x, z: v.z, h: v.top, run: () => { if (menus.isOpen('story')) return; if (story.talkStep(v.id) && storyLive()) storyDone(); else menus.talkTo(v.id); } })),
];

// ---------- hotbar: skills and items ----------
const hotbar = new Hotbar(document.getElementById('hotbar'), inv, {
  use(s) { if (s.kind === 'skill') useSkill(s.id); else useItem(s.id); },
  cooldown(s) {
    if (s.kind !== 'skill') return 0;
    return SKILLS[s.id].cd ? Math.max(0, (skillCd[s.id] || 0) / SKILLS[s.id].cd) : 0;
  },
  changed() { if (menus.open) menus.render(); persist(); },
});
hotbar.load(save?.hotbar);
menus.hotbar = hotbar;

// ---------- items and skills in use ----------
const roll = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
function useItem(id) {
  const u = ITEMS[id]?.use;
  if (!u || !inv.bag.count(id) || player.state === 'down') return;
  if (u.hp && !u.cure && player.hp >= player.maxHp) { menus.message('Your HP is already full'); return; }
  if (u.sp && player.sp >= player.maxSp) { menus.message('Your SP is already full'); return; }
  inv.bag.remove(id, 1);
  const y = overHead(player, 1.3);
  if (u.hp) {
    const n = player.heal(roll(u.hp));
    fx.number(player.x, y, player.z, n, 'heal');
  }
  if (u.sp) fx.number(player.x, y, player.z, player.healSp(roll(u.sp)), 'sp');
  if (u.cure) player.slowT = 0;
  if (u.buff) { buffs[u.buff] = u.t; applyStats(); menus.message(`${ITEMS[id].name}: ${ITEMS[id].desc}`); }
  if (u.warp === 'random') warpRandom();
  if (u.warp === 'camp') warpTo('camp');
  audio.play('pickup');
  inv.changed();
}

const skillCd = {}; // skill id -> seconds left
function useSkill(id) {
  const sk = SKILLS[id], lv = skillLv(prog, id);
  if (!lv || sk.kind !== 'active' || player.state === 'down' || (skillCd[id] || 0) > 0) return;
  const sp = spCost(id, lv);
  const pay = () => {
    if (player.sp < sp) { menus.message('Not enough SP'); return false; }
    player.sp -= sp;
    if (sk.cd) skillCd[id] = sk.cd;
    return true;
  };
  const say = (text) => fx.number(player.x, overHead(player, 1.6), player.z, text, 'skill');
  const y = world.heightAt(player.x, player.z);
  if (id === 'rest') { if (player.state === 'sit') player.standUp(); else player.sit('sit'); return; }
  if (id === 'guard') {
    if (player.state === 'normal' && pay()) { player.endureT = 4; endureGuard = 0.15; say('Guard'); audio.play('block'); }
    return;
  }
  if (sk.magic) { castSpell(id, lv, pay, sp); return; }
  if (id === 'ward') {
    if (pay()) { buffs.ward = 30; wardLv = lv; say('Rune Ward'); audio.play('craft'); fx.sparkle(player.x, y + 0.8, player.z, '#8fd8ff', 18); }
    return;
  }
  if (id === 'blink') {
    if (player.state !== 'normal' || player.cast || !pay()) return;
    // as far as 4 paces ahead, stopping short of anything in the way
    let bx = player.x, bz = player.z;
    for (let k = 0.5; k <= 4; k += 0.5) {
      const x = player.x + player.face.x * k, z = player.z + player.face.z * k, t = player.tiles.tileAt(x, z);
      if (!player.tiles.free(t[0], t[1])) break;
      bx = x; bz = z;
    }
    fx.sparkle(player.x, y + 0.7, player.z, '#b8a6f4', 12);
    player.stop();
    player.setPos(bx, bz);
    fx.sparkle(bx, world.heightAt(bx, bz) + 0.7, bz, '#b8a6f4', 12);
    audio.play('dodge');
    return;
  }
  if (id === 'mend') {
    if (player.hp >= player.maxHp) { menus.message('Your HP is already full'); return; }
    if (pay()) { say('Mend'); fx.number(player.x, overHead(player, 1.3), player.z, player.heal(5 + Math.floor(player.maxHp * 0.03)), 'heal'); }
    return;
  }
  if (player.state !== 'normal') return;
  if (id === 'standfirm') {
    if (pay()) { player.endureT = 6 + Math.floor(lv / 2); endureGuard = lv / 100; say('Stand Firm'); audio.play('block'); }
    return;
  }
  if (id === 'warcry') {
    if (!pay()) return;
    say('War Cry');
    audio.play('night');
    cam.shake = 0.15;
    fx.sparkle(player.x, y + 1, player.z, '#ff9a6a', 16);
    for (const m of mobs.list) if (m.alive && Math.hypot(m.x - player.x, m.z - player.z) < 6) m.provoke(0);
    buffs.warcry = 20;
    warcryLv = lv;
    return;
  }
  if (id === 'earthsplit') {
    if (!pay()) return;
    say('Ground Slash');
    fx.sparkle(player.x, y + 0.3, player.z, '#c8a06a', 26);
    fx.puff(player.x, y + 0.2, player.z, 1.8);
    cam.shake = 0.3;
    audio.play('hit');
    player.atkAnim = player.atkDur = 0.4;
    for (const m of [...mobs.list]) {
      if (!m.alive) continue;
      const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz);
      if (d > 2.8 + m.def.r) continue;
      const res = playerAttack(player.ps, m.effDef(), (100 + 10 * lv) / 100 * player.atkMul, 1, true);
      const yy = overHead(m, m.sprite.scale.y * 0.8);
      if (res.miss) { fx.number(m.x, yy, m.z, 'Miss', 'miss'); continue; }
      fx.number(m.x, yy, m.z, res.dmg, 'dealt');
      m.hit(res.dmg, d ? dx / d : 0, d ? dz / d : 1);
      m.knock.x *= 2; m.knock.z *= 2; // pushed back a little
    }
    return;
  }
  // the rest aim at your current target, or the nearest monster
  const target = (player.goal?.mob?.alive && player.goal.mob) || mobs.nearest(player.x, player.z, 8);
  if (!target) { menus.message('No monster nearby'); return; }
  // Thrust, Cleave and Heavy Strike: walk up and hit with the next swing
  const strike = (mult, hitMult, done) => player.command({ mob: target, skill: { mult, hitMult, pay, done } });
  if (id === 'thrust') strike(1.25, 1, () => say('Thrust'));
  if (id === 'cleave') {
    strike((100 + 10 * lv) / 100, 1, (t) => {
      say('Cleave');
      // the sweep catches monsters beside the target
      for (const m of [...mobs.list]) {
        if (!m.alive || m === t || Math.hypot(m.x - t.x, m.z - t.z) > 1.7 + m.def.r) continue;
        const r = playerAttack(player.ps, m.effDef(), (100 + 10 * lv) / 200 * player.atkMul, 1, true);
        const yy = overHead(m, m.sprite.scale.y * 0.8);
        if (r.miss) { fx.number(m.x, yy, m.z, 'Miss', 'miss'); continue; }
        fx.number(m.x, yy, m.z, r.dmg, 'dealt');
        const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
        m.hit(r.dmg, dx / d, dz / d);
      }
    });
  }
  if (id === 'heavy') strike((130 + 15 * lv) / 100, 1 + (3 * lv) / 100, () => say('Heavy Strike'));
}

// ---------- spells: stand still, chant (the cast bar), then the magic flies ----------
const SPELL_COL = { spark: '#ff7a2a', frost: '#9fe0ff', arc: '#fff27a', flamering: '#ff6a1a' };
function spellHit(m, mult, element) {
  if (!m.alive) return null;
  const staff = ITEMS[inv.gear.weapon];
  if (staff?.kind === 'staff' && staff.el && staff.el === element) mult *= 1.15; // an elemental staff feeds its own spells
  const res = magicAttack(player.ps, m.effDef(), mult, element);
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  // the right element hits hard (gold), the wrong one barely scratches (grey)
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, res.dmg, res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
  audio.play('hit');
  m.hit(res.dmg, dx / d * 0.5, dz / d * 0.5);
  return res;
}
function castSpell(id, lv, pay, sp) {
  const sk = SKILLS[id];
  if (player.state !== 'normal') return;
  if (player.sp < sp) { menus.message('Not enough SP'); return; }
  const time = castTime(id, lv) * player.ps.castRate * (skillLv(prog, 'swiftchant') ? 0.85 : 1);
  const y = () => world.heightAt(player.x, player.z);
  const say = () => fx.number(player.x, overHead(player, 1.6), player.z, sk.name, 'skill');
  if (id === 'flamering') { // around you: no target needed
    player.startCast(time, () => {
      if (!pay()) return;
      say();
      cam.shake = 0.25;
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        fx.sparkle(player.x + Math.cos(a) * 2.2, y() + 0.3, player.z + Math.sin(a) * 2.2, SPELL_COL.flamering, 2);
      }
      fx.puff(player.x, y() + 0.2, player.z, 1.6);
      for (const m of [...mobs.list]) if (m.alive && Math.hypot(m.x - player.x, m.z - player.z) < 2.8 + m.def.r) spellHit(m, (100 + 12 * lv) / 100, sk.magic);
    }, null, sk.name);
    return;
  }
  const target = (player.goal?.mob?.alive && player.goal.mob) || (player.cast?.target?.alive && player.cast.target) || mobs.nearest(player.x, player.z, 9);
  if (!target) { menus.message('No monster nearby'); return; }
  const run = (t) => {
    if (!t.alive || !pay()) return;
    say();
    const from = { x: player.x + player.face.x * 0.4, y: y() + 1.0, z: player.z + player.face.z * 0.4 };
    if (id === 'arc') { // strikes at once, then leaps to two more
      const at = (m) => ({ x: m.x, y: world.heightAt(m.x, m.z) + 0.5, z: m.z });
      fx.zap(from, at(t), SPELL_COL.arc);
      spellHit(t, (80 + 10 * lv) / 100, sk.magic);
      const near = mobs.list.filter((m) => m.alive && m !== t && Math.hypot(m.x - t.x, m.z - t.z) < 3.2)
        .sort((a, b) => Math.hypot(a.x - t.x, a.z - t.z) - Math.hypot(b.x - t.x, b.z - t.z)).slice(0, 2);
      for (const m of near) { fx.zap(at(t), at(m), SPELL_COL.arc); spellHit(m, (80 + 10 * lv) / 200, sk.magic); }
      return;
    }
    fx.bolt(from.x, from.y, from.z, t, SPELL_COL[id], () => {
      const res = spellHit(t, id === 'spark' ? (100 + 20 * lv) / 100 : (90 + 10 * lv) / 100, sk.magic);
      const ty = world.heightAt(t.x, t.z) + 0.5;
      fx.sparkle(t.x, ty, t.z, SPELL_COL[id], 8);
      if (res && id === 'frost' && t.alive && !t.def.mvp && Math.random() < 0.04 * lv) {
        t.stunT = 2.5;
        fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8 + 0.3), t.z, 'Frozen', 'miss');
      }
    });
  };
  player.command({ mob: target, spell: { range: sk.range, time, run, name: sk.name } });
}
const castBar = document.createElement('div');
castBar.id = 'castbar';
castBar.innerHTML = '<span></span><i><b></b></i>';
document.getElementById('hud').appendChild(castBar);
const castName = castBar.querySelector('span'), castFill = castBar.querySelector('b');
function updateCastBar() {
  const c = player.cast;
  castBar.classList.toggle('show', !!c);
  if (!c) return;
  if (castName.textContent !== c.name) castName.textContent = c.name;
  castFill.style.width = `${Math.min(100, (c.t / c.total) * 100)}%`;
}
player.on('interrupt', () => menus.message('Your spell was interrupted!'));

// skill cooldowns, buffs and the damage bonuses that depend on HP, every frame
let rhythm = 0;
function tickSkills(dt) {
  for (const k in skillCd) skillCd[k] -= dt;
  for (const k in buffs) {
    if (buffs[k] <= 0) continue;
    buffs[k] -= dt;
    if (buffs[k] <= 0 && k === 'aspd') { applyStats(); menus.message('The Quickening Draught wears off'); }
  }
  if (player.endureT <= 0) endureGuard = 0;
  player.guard = Math.max(endureGuard, buffs.ward > 0 ? wardLv * 0.02 : 0);
  player.steady = buffs.ward > 0;
  const low = player.hp < player.maxHp * 0.25 && skillLv(prog, 'laststand');
  player.atkMul = (buffs.warcry > 0 ? 1 + warcryLv / 100 : 1) * (low ? 1.15 : 1);
}

// ---------- tap to walk, attack, pick up, talk ----------
const PICK_PX = 44; // how far from a thing (in CSS pixels) a tap still picks it
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), projV = new THREE.Vector3();
function screenDist(cx, cy, x, y, z) {
  projV.set(x, y, z).project(camera);
  if (projV.z > 1) return Infinity;
  return Math.hypot((projV.x + 1) / 2 * window.innerWidth - cx, (1 - projV.y) / 2 * window.innerHeight - cy);
}
// the thing drawn nearest the tap: checked at its feet and its middle, monsters favoured
function pick(cx, cy) {
  let best = null, bd = PICK_PX;
  const consider = (hit, x, y, h, z, bias = 1) => {
    for (const f of [0.15, 0.55]) {
      const d = screenDist(cx, cy, x, y + h * f, z) * bias;
      if (d < bd) { bd = d; best = hit; }
    }
  };
  for (const m of mobs.list) if (m.alive) consider({ mob: m }, m.x, m.sprite.position.y, m.sprite.scale.y * 0.8, m.z, 0.8);
  for (const p of fx.pickups) consider({ item: p }, p.x, p.s.position.y, 0.5, p.z);
  for (const sp of SPOTS) if (sp.map === world.id) consider({ spot: sp }, sp.x, world.heightAt(sp.x, sp.z), sp.h, sp.z);
  return best;
}
function tap(cx, cy) {
  if (player.state === 'down') return;
  const hit = pick(cx, cy);
  if (hit?.mob) player.command({ mob: hit.mob });
  else if (hit?.item) {
    const p = hit.item;
    player.command({ x: p.x, z: p.z, reach: 0.7, arrive: () => { if (fx.pickups.includes(p) && collect(p)) fx.take(p); } });
  } else if (hit?.spot) {
    const sp = hit.spot;
    player.command({ x: sp.x, z: sp.z, reach: 1.7, arrive: sp.run });
  } else {
    ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const at = ray.intersectObject(world.terrain)[0]?.point;
    if (!at) return;
    const [i, j] = player.tiles.nearestFree(...player.tiles.tileAt(at.x, at.z)) || [];
    if (i === undefined) return;
    fx.tileMark(i, j);
    player.command({ x: i + 0.5, z: j + 0.5, reach: 0.05 });
  }
}
function rest() {
  player.heal(player.maxHp);
  if (dayNight.night > 0.3) {
    const veil = document.getElementById('faint');
    veil.querySelector('div').textContent = 'You sleep until morning…';
    veil.querySelector('small').textContent = 'Hearts restored · Game saved';
    veil.classList.add('show');
    setTimeout(() => { dayNight.skipToMorning(); persist(); }, 700);
    setTimeout(() => {
      veil.classList.remove('show');
      setTimeout(() => { veil.querySelector('div').textContent = 'You fainted…'; veil.querySelector('small').textContent = 'Returning to camp'; }, 700);
    }, 1900);
  } else {
    persist();
    menus.message('Rested. Hearts restored and game saved.');
  }
}

const dayNight = new DayNight({
  scene, hemi, sun, world, mobs, player, inv,
  onPhase(night) {
    audio.play(night ? 'night' : 'morning');
    menus.message(night ? 'Night falls over Aria. Wisps are stirring.' : 'Morning has come.');
  },
});
if (typeof save?.time === 'number') dayNight.t = save.time;

// HP doesn't recover while walking, like Ragnarok. Resting (the skill, or at camp) doubles it.
let hpT = 0, spT = 0;
function naturalRegen(dt) {
  if (player.state === 'down') return;
  const resting = world.isSafe(player.x, player.z) || player.state === 'sit';
  const fast = resting ? 2 : 1;
  const walking = player.moving;
  const low = player.hp < player.maxHp * 0.25 && skillLv(prog, 'secondwind') ? 3 : 1;
  if (!walking) hpT += dt * fast * low * (inv.wearing('regen') ? 2 : 1);
  spT += dt * fast;
  if (hpT >= 6) { hpT -= 6; player.heal(player.ps.hpRegen); }
  if (spT >= 8) { spT -= 8; player.healSp(player.ps.spRegen + skillLv(prog, 'manawell')); }
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 55 : 40;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function camBasis() {
  return { fx: -Math.sin(cam.yaw), fz: -Math.cos(cam.yaw), rx: Math.cos(cam.yaw), rz: -Math.sin(cam.yaw) };
}

let saveT = 0;
let questZone = null, questT = 0;
let resetting = false;
function persist() {
  if (!started || resetting) return;
  writeSave({ story: story.toJSON(), look: player.look, map: world.id, mvpAt: mobs.mvpAt, x: player.x, z: player.z, yaw: cam.yaw, dist: cam.dist, hp: player.hp, sp: player.sp, inv: inv.toJSON(), prog: prog.toJSON(), quests: quests.toJSON(), hotbar: hotbar.toJSON(), time: dayNight.t });
}

const clock = new THREE.Clock();
let started = false;
let stepT = 0;
const tmpV = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const c = input.consumeCamera(dt);
  cam.yaw += c.yaw;
  cam.dist = clamp(cam.dist + c.zoom, 7, 20);

  const b = camBasis();
  // windows never pause the game, like Ragnarok
  for (const w of ['items', 'equip', 'skills', 'status']) if (input.tapped(w) && started) menus.toggle(w);
  if (input.tapped('close')) menus.close();
  const live = started;
  const clicks = input.takeClicks();
  if (live) for (const c of clicks) tap(c.x, c.y);

  player.update(live ? dt : 0, b, mobs);
  if (live && player.moving && player.state === 'normal') {
    stepT -= dt;
    if (stepT <= 0) { stepT = 0.33 / player.speedMul; audio.play('step'); }
  }
  audio.update(dt, dayNight.night);
  if (!started) cam.yaw += dt * 0.05; // slow orbit behind the title screen
  mobs.cam = b;
  if (live) mobs.update(dt, player);
  if (live) dayNight.update(dt, t); else if (!started) dayNight.update(0, t);
  world.update(dt, t);
  villagers.update(dt, player, b);
  if (live) fx.update(dt);
  if (live) { naturalRegen(dt); tickSkills(dt); checkPortals(); }
  updateCastBar();
  hotbar.update();
  world.updateOcclusion(player.x, player.z, b);

  const py = world.heightAt(player.x, player.z);
  cam.target.lerp(tmpV.set(player.x, py, player.z), 1 - Math.exp(-8 * dt));
  const pitch = lerp(0.72, 0.98, (cam.dist - 7) / 13);
  const horiz = Math.cos(pitch) * cam.dist;
  cam.shake = Math.max(0, cam.shake - dt);
  const sh = cam.shake * 0.5;
  camera.position.set(
    cam.target.x + Math.sin(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
    cam.target.y + 0.7 + Math.sin(pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
  );
  camera.lookAt(cam.target.x, cam.target.y + 0.7, cam.target.z);

  ui.update(dt, player, cam.yaw);
  if (live && ui.zone !== questZone) {
    questZone = ui.zone;
    for (const id of quests.onZone(questZone)) questComplete(id);
    story.onZone(questZone);
  }
  questT -= dt;
  if (questT <= 0) { questT = 0.5; refreshQuests(); if (live) checkStory(); }

  saveT += dt;
  if (saveT > 3) { saveT = 0; persist(); }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

const title = document.getElementById('title');
const tContinue = document.getElementById('t-continue');
const tNew = document.getElementById('t-new');
const tSound = document.getElementById('t-sound');
if (save) { tContinue.textContent = 'Continue'; tNew.hidden = false; }
const soundLabel = () => { tSound.textContent = `Sound: ${audio.enabled ? 'On' : 'Off'}`; };
soundLabel();
tSound.addEventListener('click', () => { audio.start(); audio.setEnabled(!audio.enabled); soundLabel(); audio.play('ui'); });
let confirmNew = false;
tNew.addEventListener('click', () => {
  if (!confirmNew) {
    confirmNew = true;
    tNew.textContent = 'Tap again to start over';
    tNew.classList.add('warn');
    setTimeout(() => { confirmNew = false; tNew.textContent = 'New Game'; tNew.classList.remove('warn'); }, 3000);
    return;
  }
  resetting = true;
  clearSave();
  location.reload();
});
tContinue.addEventListener('click', () => {
  audio.start();
  audio.play('ui');
  title.classList.add('hide');
  document.getElementById('hud').classList.remove('pre');
  started = true;
  input.enabled = true;
  cam.yaw = save?.yaw ?? 0;
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* not supported */ }
  setTimeout(() => {
    title.remove();
    ui.showZone(world.id);
    if (!save) menus.openLook('new', player.look); // a new character: choose your hair first
    else startStory();
    const hint = document.getElementById('hint');
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 6000);
  }, 450);
});

window.__aria = { lib, warp, enterMap, useSkill, useItem, story, SPOTS, player, world, cam, camera, mobs, fx, inv, prog, quests, villagers, menus, hotbar, dayNight, audio, stats: world.stats };
