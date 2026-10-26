import * as THREE from 'three';
import './style.css';
import { createSprites } from './sprites.js';
import { buildWorld, ZONE_NAMES, MAPS, WATER_Y } from './world.js';
import { CITY, MAGIC, HUNT } from './city.js';
import { paintBow } from './bow.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { FX } from './fx.js';
import { MobManager, MOB_DEFS, MOVES, guardDef, raidDef } from './mobs.js';
import { Allies } from './allies.js';
import { RAIDS, rollReward } from './raid.js';
import { loadSave, writeSave, loadStorage, writeStorage, clearSave, saveCode, loadCode, SLOTS, activeSlot, setActiveSlot } from './save.js';
import { Inventory } from './inventory.js';
import { Progress, JOBS, RATES, QUEST_RATE } from './progress.js';
import { Quests, QUESTS, NPCS, FARES, NEXT, SERIES, giverOf } from './quests.js';
import { Story, INTRO, route } from './story.js';
import { Villagers } from './villagers.js';
import { Tiles } from './tiles.js';
import { Hotbar } from './hotbar.js';
import { BigMap } from './bigmap.js';
import { headsReady, paintHead, lookPortrait } from './hair.js';
import { headgearReady, gearCut, paintGear } from './headgear.js';
import { derive, playerAttack, mobAttack, magicAttack, elementMod, ELEMENTS } from './rules.js';
import { SKILLS, EDGE_FX, skillLv, spCost, castTime, learn, skillList, weaponOk, WEAPON_NAMES, BOW_RANGE, unlearnFirstJob, unlearnSecondJob, RETRAIN_COST } from './skills.js';
import { Menus } from './menus.js';
import { iconTexture, iconURL, ITEMS, baseOf, canWear } from './items.js';
import { DayNight } from './daynight.js';
import { Audio } from './audio.js';
import { Wings } from './wings.js';
import { clamp, lerp } from './noise.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.localClippingEnabled = true; // wading: sprites are cut at the waterline

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
const allies = new Allies(scene, world, lib, mobs.shadowGeo, mobs.shadowMat); // the Beastmaster's beasts
// monsters per map: [type, count, nightOnly]. Wisps drift about by day too; night brings more of them and ~20% more of the rest
const SPAWNS = {
  camp: [],
  grove: [['slime', 12], ['sprout', 9], ['wisp', 2, true], ['slime', 3, true], ['sprout', 2, true]], // the first field: Wisps only at night
  fen: [['blueSlime', 9], ['crab', 7], ['wisp', 3], ['wisp', 3, true], ['blueSlime', 2, true], ['crab', 1, true]],
  hollow: [['mushling', 12], ['wisp', 3], ['wisp', 3, true], ['mushling', 2, true]],
  ridge: [['beetle', 10], ['jarl', 1], ['wisp', 3], ['wisp', 3, true], ['beetle', 2, true]],
  city: [],
  birch: [['russet', 10], ['sprout', 5], ['slime', 4], ['matron', 1], ['wisp', 2], ['wisp', 3, true], ['russet', 2, true]],
  magic: [],
  coast: [['brine', 9], ['tidecrab', 8], ['crab', 3], ['tideKing', 1], ['wisp', 2], ['wisp', 3, true], ['brine', 2, true]],
  deep: [['gloomcap', 10], ['mushling', 4], ['shadeWisp', 6], ['gloomMother', 1], ['gloomcap', 2, true]],
  heath: [['cinderBeetle', 9], ['emberWisp', 6], ['beetle', 3], ['cinderLord', 1], ['cinderBeetle', 2, true]],
  // the kobold and goblin lands: they attack on sight; each race's king holds the second map
  stones: [['koboldWarrior', 10], ['koboldArcher', 6], ['koboldAssassin', 2], ['koboldWarrior', 2, true]],
  coalpit: [['koboldAssassin', 7], ['koboldWarrior', 5], ['koboldArcher', 5], ['koboldKing', 1], ['koboldAssassin', 2, true]],
  burnt: [['goblinWarrior', 10], ['goblinArcher', 6], ['goblinAssassin', 2], ['goblinWarrior', 2, true]],
  bloop: [], // the raid spawns its own (tickRaid)
  serpent: [['goblinAssassin', 7], ['goblinWarrior', 5], ['goblinArcher', 5], ['goblinKing', 1], ['goblinAssassin', 2, true]],
  // Veidheim's lands: the gentle willows and treants round the village (and Yellow Bloops in the marsh),
  // the predators far off past Black Wood and Ash Heath, more of them at night
  hunt: [],
  marsh: [['willow', 9], ['yellowSlime', 8], ['elderWillow', 1], ['willow', 2, true], ['wisp', 3, true]],
  oldwood: [['treant', 9], ['willow', 4], ['treant', 2, true], ['wisp', 2, true]],
  farm: [['snake', 10], ['wolf', 6], ['alphaWolf', 1], ['snake', 2, true], ['wolf', 3, true]],
  wolfhill: [['wolf', 10], ['bear', 5], ['snake', 2], ['greatBear', 1], ['ancientTreant', 1], ['wolf', 3, true]],
};

// which build this is, on the title screen (matches the APK's version, 1.0.<build>)
const verEl = document.querySelector('#title .ver');
if (verEl) verEl.textContent = `v1.0.${__BUILD__} · Explore, fight, craft, survive the night`;

const save = loadSave();
let lookBefore = null; // the look kept, while one is being tried on
mobs.mvpAt = typeof save?.mvpAt === 'number' ? { jarl: save.mvpAt } : save?.mvpAt || {}; // older saves timed the Fire Giant alone
mobs.bossHp = save?.bossHp || {};
const prog = new Progress();
prog.load(save?.prog);
// the hero's body follows the job and the look's body (male or female), painted in code (sprites.js designSet)
const JOB_BODY = { novice: 'trainee', swordman: 'blader', mage: 'sorc', archer: 'archer', blademaster: 'master', wizard: 'wiz', magicknight: 'mknight', windrunner: 'wind', moonranger: 'moon', beastmaster: 'beast' };
// (the Beastmaster's follows the weapon in hand: the cleaver, or the bow; held() is set once the
// inventory is loaded)
let held = () => save?.inv?.gear?.weapon;
const bodyArt = (look) => lib.design(`${JOB_BODY[prog.job] || 'blader'}${prog.job === 'beastmaster' && ITEMS[held()]?.kind !== 'bow' ? 'sw' : ''}${look.body === 'f' ? 'F' : 'M'}`);
const player = new Player(scene, world, bodyArt({ ...save?.look }), lib.shadow, fx);
const wings = new Wings(scene);
player.setPos(save?.x ?? world.spawn.x, save?.z ?? world.spawn.z);
if (save?.look) player.setLook(save.look);
lookBefore = { ...player.look };
const quests = new Quests();
quests.load(save?.quests);
const story = new Story();
if (!story.load(save?.story) && save) story.catchUp(prog); // a save from before the story
// people without a sprite of their own are dressed from a bald body (NPCS dress: one sheet for each
// look, so a role's people share theirs); a shop or crafter may borrow another town's (NPCS look)
const dressed = new Map(); // dress spec -> its sheet
for (const [id, n] of Object.entries(NPCS)) {
  if (n.dress && !dressed.has(n.dress)) dressed.set(n.dress, lib.person(n.dress));
  lib.villagers[id] ||= (n.dress && dressed.get(n.dress)) || lib.villagers[n.look] || lib.villagers.bram;
}
// their head, hair and headgear are painted on once those images have loaded (like the hero's)
let undressed = [...dressed.values()];
function dressPeople() {
  if (!undressed.length || !headsReady()) return;
  undressed = undressed.filter((art) => {
    const { hair = 'messy', dye = 'brown', top = null, face = null } = art.person;
    if (!art.dress || !headgearReady(top) || !headgearReady(face)) return true;
    art.dress((g, ud, dir) => {
      const at = ud.head?.at;
      if (!at) return;
      paintHead(g, at, dir, { hair, dye }, gearCut(top, dir), top);
      paintGear(g, at, dir, face, 0);
      paintGear(g, at, dir, top, 0);
      if (art.person.bow) paintBow(g, ud.head, dir); // Veidheim's archers (bow.js)
    });
    for (const [id, n] of Object.entries(NPCS)) if (n.dress === art.person) delete portraits[id]; // drawn again, dressed
    return false;
  });
}
const villagers = new Villagers(scene, world, lib);
player.tiles = new Tiles(world); // after the villagers: they block their tiles
// a drop lands on open ground: one that would fall on a blocked tile (a tree, a rock, a tent) goes to
// the nearest tile you can walk to
fx.landAt = (x, z) => {
  const t = player.tiles, [i, j] = t.tileAt(x, z);
  const [rx, rz] = world.resolve(x, z, 0.3); // a spot the hero could stand on
  if (t.free(i, j) && world.walkable(x, z) && Math.hypot(rx - x, rz - z) < 0.05) return [x, z];
  const f = t.nearestFree(i, j, 4);
  if (!f) return [x, z];
  const c = t.center(...f);
  return [c.x, c.z];
};
const inv = new Inventory();
inv.level = () => prog.baseLv;
inv.job = () => prog.wearJobs; // the job worn and the first jobs it stands on: switching jobs puts away the rest
// the player's look follows the job: the Trainee's clothes, then the first and second jobs'
const jobArt = () => bodyArt(player.look);
held = () => inv.gear.weapon;
player.setArt(jobArt());
inv.load(save?.inv);
inv.chest.load(loadStorage()); // the Keepers' storage: every hero's, saved apart from them
inv.dropUnwearable(); // gear rules can change between versions
// stats + gear -> the player's battle numbers (Ragnarok rules); HP/SP stay put, capped by the new max
// timed buffs, in seconds left: aspd (Quickening Draught), warcry (War Cry's ATK bonus)
const buffs = { aspd: 0, warcry: 0, ward: 0, aegis: 0, momentum: 0, focus: 0, tailwind: 0, rush: 0, gust: 0, rhythm: 0, veil: 0, frenzy: 0 };
let warcryLv = 0, wardLv = 0, endureGuard = 0, aegisLv = 0, focusLv = 0, tailLv = 0, gustHaste = 0;
let endureFrom = null, endureLv = 0; // what set player.endureT (Guard or Stand Firm), for the buff bar
// the Windrunner: Gale Rhythm's stacks (each arrow that lands), Skirmisher's empowered arrows left
let galeStacks = 0, skirmish = 0;
// the Moon Ranger: whether the moon is up (dayNight's night, kept here so applyStats can run before
// dayNight exists), Moonveil's level
let nightUp = false, veilLv = 0, frenzyLv = 0;
// the Beastmaster's beasts: which summon calls each, and their numbers from the hero's. A beast takes a
// share of the hero's stats, 40% at a summon's Lv 1 to 80% at Lv 5, plus Beast Bond: the Bear
// grows with END and Max HP, the Wolves with FNS, the Hawk with QKN
const SUMMONS = { bear: 'summonbear', wolf: 'summonwolves', hawk: 'summonhawk' };
function beastStats(kind) {
  const g = inv.gearStats().stats, st = (k) => prog.total(k) + (g[k] || 0), base = prog.baseLv;
  const s = 0.3 + 0.1 * skillLv(prog, SUMMONS[kind]) + 0.02 * skillLv(prog, 'beastbond');
  const quick = buffs.frenzy > 0 ? 1 - 0.03 * frenzyLv : 1, R = Math.round;
  const common = { crit: 5, dodge: 3, mastery: 0, el: 'neutral', wlv: 2 };
  if (kind === 'bear') {
    const hide = skillLv(prog, 'thickhide');
    return { ...common, maxHp: R(player.maxHp * 0.9 * s + st('end') * 15 * s), def: Math.min(60, R(10 + st('end') * 0.6 * s)), end: R(st('end') * s), flee: R(base * 0.6),
      batk: R((st('pow') + st('end')) * 1.3 * s + base * 1.2), watk: R(30 + base * 1.2), fns: R(base * 0.8), hit: base + 25, interval: 1.6 * quick, taunt: 3 + 0.5 * hide, guard: 0.04 * hide };
  }
  if (kind === 'wolf') return { ...common, maxHp: R(player.maxHp * 0.35 * s + base * 5), def: 8, end: R(base * 0.3), flee: R(base + st('fns') * 0.5 * s),
    batk: R(st('fns') * 1.4 * s + base * 0.5), watk: R(20 + base), fns: st('fns'), hit: R(base + st('fns') * s * 2), interval: 1.0 * quick, double: 0.25 };
  return { ...common, maxHp: R(player.maxHp * 0.3 * s + base * 4), def: 4, end: 0, flee: R(base + st('qkn') * 2 * s),
    batk: R(st('qkn') * 2.2 * s + base * 0.6), watk: R(15 + base * 0.8), fns: R(base * 0.8), hit: R(base + st('qkn') * s + 30),
    interval: Math.max(0.45, 1.3 - st('qkn') * 0.008 * s) * quick * (1 - 0.03 * skillLv(prog, 'windtalons')) };
}
// a beast's damage rate on a monster: Pack Frenzy, and Pack Tactics when both wolves bite the same one
allies.mult = (b, m) => (buffs.frenzy > 0 ? 1 + 0.03 * frenzyLv : 1)
  * (b.kind === 'wolf' && allies.of('wolf').filter((w) => w.foe === m).length > 1 ? 1 + 0.06 * skillLv(prog, 'packtactics') : 1);
const moonSkill = () => (nightUp ? 1 + 0.02 * skillLv(prog, 'moonlit') : 1); // Moonlit Hunter, on every skill
let nav = null; // auto-navigation: { quest, map, npc, why } while walking to a quest by itself
// second-job synergies: the BladeMaster's Momentum stacks, the last spell's element (Resonance),
// the last Edge's element (Elemental Chain)
let momentum = 0;
const lastSpell = { el: null, t: -99 }, lastEdge = { el: null, t: -99 };
// hits that come one after another (Storm Gust's gusts, Final Blade's cuts): run on the game clock,
// and dropped if you leave the map first
const timers = [];
const later = (s, fn) => timers.push({ at: skillClock + s, fn, map: world.id });
// each hit of a multi-hit skill: fn(i) for i = 0 .. hits-1, every sk.every seconds
const repeat = (sk, lv, fn) => { for (let i = 0; i < sk.hits(lv); i++) later(i * sk.every, () => fn(i)); };
// a status from a skill (skills.js status): freeze, paralyze and stun leave a monster helpless; a burn
// hurts it each second for a fifth of the hit that lit it. Bosses resist: a third of the chance, for
// half as long, and nothing takes hold while a boss is in the middle of a move.
const STATUS_TEXT = { freeze: 'Frozen', paralyze: 'Paralyzed', stun: 'Stunned', burn: 'Burning' };
function inflict(m, st, lv, hitDmg = 0) {
  if (!st || !m.alive || m.act) return;
  const boss = m.def.boss || m.def.mvp;
  if (Math.random() * 100 >= st.chance(lv) * (boss ? 1 / 3 : 1)) return;
  const dur = st.dur * (boss ? 0.5 : 1);
  if (st.kind === 'burn') {
    if (!hitDmg) return;
    if (!(m.burnT > 0)) m.burnTick = 1;
    m.burnT = dur;
    m.burnDmg = Math.max(1, Math.round(hitDmg * 0.2));
  } else {
    m.stunT = Math.max(m.stunT, dur);
    m.status = st.kind;
  }
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.35), m.z, STATUS_TEXT[st.kind], 'miss');
}
let skillClock = 0; // seconds since the game started, for those windows
// what is in hand: 'sword', 'staff', 'bow', or 'none' (bare hands: no blade skills, no sword mastery)
const weaponKind = () => { const it = ITEMS[inv.gear.weapon]; return !it ? 'none' : it.kind === 'staff' || it.kind === 'bow' ? it.kind : 'sword'; };
// an Archer's bonuses on one monster: Hunter's Mark on it, Steady Aim from 4 paces
function bowMul(m) {
  let k = 1;
  if (m.markT > skillClock) k *= 1 + 0.04 * m.markLv;
  if (weaponKind() === 'bow' && skillLv(prog, 'steadyaim') && Math.hypot(m.x - player.x, m.z - player.z) - m.def.r >= 4) k *= 1.1;
  if (skirmish > 0 && weaponKind() === 'bow') { skirmish--; k *= 1 + 0.08 * skillLv(prog, 'skirmisher'); }
  return k;
}
// an arrow landed: Gale Rhythm adds a stack (up to 5, for 6 s)
function arrowLanded() {
  const lv = skillLv(prog, 'galerhythm');
  if (!lv) return;
  buffs.rhythm = 6;
  if (galeStacks < 5) { galeStacks++; applyStats(); }
}
// a burst of speed (Gale Step, Tailwind's rush): Skirmisher readies the next 3 arrows
const burstOfSpeed = () => { if (skillLv(prog, 'skirmisher')) skirmish = 3; };
function applyStats() {
  const gear = inv.gearStats();
  const hide = skillLv(prog, 'ironhide');
  const sword = weaponKind() === 'sword', bow = weaponKind() === 'bow';
  const st = gear.stats;
  st.fns = (st.fns || 0) + skillLv(prog, 'keeneye') + (buffs.focus > 0 ? focusLv : 0);
  if (buffs.focus > 0) st.qkn = (st.qkn || 0) + focusLv;
  gear.hit += bow ? skillLv(prog, 'longsight') : 0;
  gear.mastery = skillLv(prog, 'basics') + (sword ? 2 * skillLv(prog, 'discipline') + 3 * skillLv(prog, 'blademastery') : 0);
  gear.hit += sword ? skillLv(prog, 'blademastery') : 0;
  gear.flee += (skillLv(prog, 'footwork') ? 3 : 0) + (nightUp ? skillLv(prog, 'moonlit') : 0);
  gear.def += hide + (buffs.aegis > 0 && player.barrier > 0 ? aegisLv : 0) + skillLv(prog, 'beastbond') * allies.list.length; // Beast Bond
  if (buffs.aspd > 0) gear.aspdRate *= 0.9;
  if (bow) gear.aspdRate *= (1 - 0.02 * skillLv(prog, 'windborne')) * (buffs.tailwind > 0 ? 1 - 0.02 * tailLv : 1) * (1 - skillLv(prog, 'galerhythm') * galeStacks / 100);
  if (buffs.imbue > 0 && imbueEl && sword) gear.el = imbueEl; // Elemental Blade
  const ps = derive(prog, gear);
  ps.maxHp = Math.floor(ps.maxHp * (1 + hide / 100));
  ps.maxSp = Math.floor(ps.maxSp * (1 + skillLv(prog, 'manawell') / 50));
  player.ps = ps;
  player.maxHp = ps.maxHp;
  player.maxSp = ps.maxSp;
  player.hp = Math.min(player.hp, ps.maxHp);
  player.sp = Math.min(player.sp, ps.maxSp);
  // walking speed is a big buff in Aria: only the Windrunner's short bursts haste the walk, and only
  // the strongest of them counts (Ragnarok's rule)
  player.haste = Math.max(buffs.rush > 0 ? 30 : 0, buffs.gust > 0 ? gustHaste : 0);
  // a bow shoots from afar, with arrows (their element colours the shot)
  player.bow = bow;
  player.noAmmo = bow && !inv.gear.ammo;
  player.reach = bow ? BOW_RANGE + 0.2 * skillLv(prog, 'longsight') : 1.35;
  player.arrowCol = bow && gear.el ? ELEMENTS[gear.el].color : '#efe2c0';
  player.dmgMod = bowMul;
  for (const kind of Object.keys(SUMMONS)) if (allies.of(kind).length) allies.restat(kind, beastStats(kind)); // the beasts follow the hero's stats
  if (prog.job === 'beastmaster') { const art = jobArt(); if (player.art !== art) player.setArt(art); } // sword or bow in hand
  player.setHeadgear(inv.gear.head && baseOf(inv.gear.head), inv.gear.face && baseOf(inv.gear.face)); // refined headgear looks like the plain piece
  player.blockChance = inv.wearing('block') ? 0.2 : 0;
  // Spellblade: normal sword hits carry some of the MATK
  const sb = sword ? skillLv(prog, 'spellblade') : 0;
  player.bonusDmg = sb ? () => Math.floor((player.ps.matk[0] + player.ps.matk[1]) / 2 * 0.03 * sb) : null;
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
ui.heroName = () => player.look.name || '';

const cam = { yaw: save?.yaw ?? 0, dist: save?.dist ?? 12, target: new THREE.Vector3(), shake: 0 };

// ---------- maps and warp portals ----------
// go to a map: its monsters, tiles and ground; at = where to stand (else beside the portal back)
const visited = new Set(save?.visited || ['camp']); // lands walked, for the Ferryman
// Keepers whose ledger you have signed (the camp's is signed from the start), and where you saved
const keepers = new Set(save?.keepers || ['keeper_camp']);
let savePoint = save?.savePoint || null; // { keeper, map, x, z }; none = the camp fire
function enterMap(id, from, at) {
  const arrive = world.go(id, from);
  visited.add(id);
  const pos = at || arrive;
  mobs.setMap(SPAWNS[world.id], 11 + world.id.length);
  villagers.show(world.id);
  player.tiles.rebuild();
  fx.clearPickups();
  player.stop();
  player.setPos(pos.x, pos.z);
  allies.carry(player); // the beasts come along
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
player.on('noammo', () => menus.message('Equip arrows to shoot (the Arrows slot)'));
// the first weak elemental hit ever explains the grey number, once
function weakTip(m, el) {
  if (story.flags.elementTip) return;
  story.flag('elementTip');
  const E = (e) => e[0].toUpperCase() + e.slice(1);
  menus.message(`A weak hit! ${E(el)} barely hurts the ${m.def.name}, which is ${E(m.def.el)}. Grey numbers mean the wrong element: try another weapon or spell.`);
}
player.on('strike', (m, res) => {
  const y = overHead(m, m.sprite.scale.y * 0.8);
  if (res.miss) fx.number(m.x, y, m.z, 'Miss', 'miss');
  else {
    fx.number(m.x, y, m.z, res.dmg, res.crit || res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
    if (res.el < 1) weakTip(m, player.ps.el);
    audio.play('hit');
    if (player.bow) arrowLanded();
    // Battle Rhythm: every third hit that lands gives back 3 SP, so a Blader keeps swinging skills
    if (skillLv(prog, 'rhythm') && ++rhythm % 3 === 0) player.healSp(3);
  }
});
player.on('hurt', (n) => {
  ui.hurt(); cam.shake = 0.2; audio.play('hurt');
  fx.number(player.x, overHead(player, 1.3), player.z, n, 'taken');
});
mobs.on('miss', (m, res) => { const t = m.foe || player; fx.number(t.x, overHead(t, 1.3), t.z, res.dodge ? 'Lucky!' : 'Miss', 'miss'); });
// the beasts: their bites and dives, the blows they take, the Bear's roar, a beast that falls
allies.on('strike', (b, m, res) => {
  if (!m.alive) return;
  const y = overHead(m, m.sprite.scale.y * 0.8);
  if (res.miss) { fx.number(m.x, y, m.z, 'Miss', 'miss'); return; }
  fx.number(m.x, y, m.z, res.dmg, res.crit ? 'crit' : 'dealt');
  const dx = m.x - b.x, dz = m.z - b.z, d = Math.hypot(dx, dz) || 1;
  m.hit(res.dmg, dx / d * 0.3, dz / d * 0.3);
  audio.play('hit');
  if (b.kind === 'hawk') { const wt = skillLv(prog, 'windtalons'); if (wt) inflict(m, { kind: 'stun', chance: () => 2 * wt, dur: 1 }, wt, res.dmg); }
  if (m.alive && m.foe?.kind !== 'bear' && Math.random() < 0.35) m.foe = b; // it may turn on the beast that bit it
});
allies.on('hurt', (b, n) => fx.number(b.x, overHead(b, b.sprite.scale.y * 0.7), b.z, n, 'taken'));
allies.on('taunt', (b) => { fx.number(b.x, overHead(b, b.sprite.scale.y * 0.9), b.z, 'Roar!', 'skill'); audio.play('night'); });
allies.on('fall', (b) => {
  fx.puff(b.x, world.heightAt(b.x, b.z) + 0.4, b.z, b.K.w);
  const id = SUMMONS[b.kind];
  skillCd[id] = Math.max(skillCd[id] || 0, 20); // a fallen beast can be called back after a rest
  menus.message(`Your ${b.K.name} falls back to the wild to lick its wounds. Call it again in 20 s.`);
  applyStats();
});
player.on('block', () => {
  audio.play('block');
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#e8eef5', 5);
  fx.number(player.x, overHead(player, 1.3), player.z, 'Block', 'miss');
});
// Stone Aegis takes the blow: the barrier's own number, in its stone colour
player.on('soak', (n) => {
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#c8a06a', 4);
  fx.number(player.x, overHead(player, 1.3), player.z, `-${n}`, 'miss');
});
player.on('faint', () => {
  audio.play('faint');
  const lost = prog.deathPenalty();
  const home = savePoint ? ZONE_NAMES[savePoint.map] : 'camp';
  ui.faint(true, lost.base || lost.job ? `Returning to ${home} · lost ${lost.base} Base EXP, ${lost.job} Job EXP` : `Returning to ${home}`);
  setTimeout(() => {
    allies.clear(); // the beasts go home when the hero faints
    applyStats();
    enterMap(savePoint ? savePoint.map : 'camp', null);
    if (savePoint) player.revive(savePoint.x, savePoint.z);
    else player.revive(world.spawn.x, world.spawn.z);
    // waking up is not a free heal: half HP and SP (a Keeper or Gyda mends the rest)
    player.hp = Math.ceil(player.maxHp * 0.5);
    player.sp = Math.max(Math.min(player.sp, player.maxSp), Math.ceil(player.maxSp * 0.5));
    cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);
    ui.faint(false);
  }, 2200);
});
mobs.on('death', (m, drops) => {
  audio.play('kill');
  if (raid && m.def.raidLv) { raid.exp[0] += m.def.exp[0] * RATES.base; raid.exp[1] += m.def.exp[1] * RATES.job; } // a raid holds its EXP until the run ends
  else gainExp(...m.def.exp, RATES);
  for (const id of quests.onKill(m.type)) questComplete(id);
  story.onKill(m.type);
  for (const [item, count] of drops) {
    fx.drop(m.x, m.z, item, count, iconTexture(item), !!ITEMS[item]?.rare);
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
    if (player.slowT <= 0) menus.message(m.def.puff || 'Spores! You feel sluggish');
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
  const res = mobAttack(m.def, player.ps, m.def.stomp || 1.5);
  if (res.miss) fx.number(player.x, overHead(player, 1.3), player.z, 'Miss', 'miss');
  else player.takeDamage(res.dmg, m.x, m.z);
});
// ---------- boss moves (mobs.js MOVES): a red circle shows where each lands ----------
const MOVE_COL = { fire: '#ff6a1a', earth: '#c8a06a', wind: '#dff7c8', water: '#9fe0ff', shadow: '#a89cff' };
// a boss move lands: mult x the boss's ATK if you stand within r of (x, z)
function bossBlow(m, mult, x, z, r) {
  if (Math.hypot(player.x - x, player.z - z) > r + 0.3 || !player.canBeHit() || player.state === 'down') return;
  cam.shake = 0.3;
  const res = mobAttack(m.def, player.ps, mult);
  if (res.miss) fx.number(player.x, overHead(player, 1.3), player.z, 'Miss', 'miss');
  else player.takeDamage(res.dmg, x, z);
}
const MOVE_NAMES = { charge: 'Charge', throw: { fire: 'Fireball', shadow: 'Spore Pod', earth: 'Boulder', wind: 'Hurled Axe' }, leap: 'Leap' }; // (or the move's own name)
mobs.on('move', (m, a) => {
  const name = MOVE_NAMES[a.kind], label = a.mv.name || (typeof name === 'string' ? name : name[m.def.el] || 'Throw');
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, label, 'skill');
  audio.play('swing');
  if (a.kind === 'charge') { // the line it will run: a warning where you stand now
    const ahead = Math.min(a.left, Math.hypot(player.x - m.x, player.z - m.z));
    fx.warn(m.x + m.heading.x * ahead, m.z + m.heading.z * ahead, 1.2, MOVES.charge.wind + 0.15);
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1, m.z, '#ff8a3a', 10);
  }
  if (a.kind === 'throw') fx.warn(a.spot.x, a.spot.z, a.mv.r, MOVES.throw.wind + MOVES.throw.land);
  if (a.kind === 'leap') fx.warn(a.spot.x, a.spot.z, a.mv.r, MOVES.leap.wind + MOVES.leap.air);
});
mobs.on('rush', (m) => { audio.play('dodge'); fx.puff(m.x, world.heightAt(m.x, m.z) + 0.15, m.z, 1.2); });
mobs.on('rammed', (m, mult) => bossBlow(m, mult, m.x, m.z, m.def.reach + 0.6));
mobs.on('throw', (m, spot, mv, land) => {
  const map = world.id, y = world.heightAt(m.x, m.z) + m.sprite.scale.y * 0.6;
  const travel = Math.hypot(spot.x - m.x, spot.z - m.z) / 13; // fx.bolt flies 13 paces a second
  const at = { x: spot.x, z: spot.z, alive: true };
  setTimeout(() => {
    if (world.id !== map) return;
    fx.bolt(m.x, y, m.z, at, MOVE_COL[m.def.el] || '#ffffff', () => {
      const gy = world.heightAt(spot.x, spot.z);
      fx.puff(spot.x, gy + 0.2, spot.z, mv.r * 1.2);
      fx.sparkle(spot.x, gy + 0.3, spot.z, MOVE_COL[m.def.el] || '#ffffff', 16);
      audio.play('hit');
      bossBlow(m, mv.mult, spot.x, spot.z, mv.r);
    }, 0.9);
  }, Math.max(0, land - travel) * 1000);
});
mobs.on('slam', (m, mv) => {
  const y = world.heightAt(m.x, m.z);
  fx.puff(m.x, y + 0.2, m.z, mv.r * 1.3);
  fx.sparkle(m.x, y + 0.3, m.z, MOVE_COL[m.def.el] || '#ffffff', 20);
  audio.play('hit');
  bossBlow(m, mv.mult, m.x, m.z, mv.r);
});
mobs.on('frenzy', (m) => {
  menus.message(`The ${m.def.name} flies into a frenzy!`);
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Frenzy!', 'skill');
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff4a3a', 18);
  audio.play('night');
});
// archers: an arrow flies at you, and the hit is rolled when it lands (FLEE and DEF apply)
const playerMark = { get x() { return player.x; }, get z() { return player.z; }, alive: true };
mobs.on('shoot', (m) => {
  audio.play('swing');
  const y = world.heightAt(m.x, m.z) + m.sprite.scale.y * 0.45;
  const foe = m.foe || player; // a beast it turned on, or the hero
  fx.bolt(m.x, y, m.z, foe === player ? playerMark : foe, '#efe2c0', () => {
    if (!m.alive && !mobs.list.includes(m)) return;
    if (!foe.canBeHit() || foe.state === 'down') return;
    const res = mobAttack(m.def, foe.ps);
    if (res.miss) fx.number(foe.x, overHead(foe, 1.3), foe.z, res.dodge ? 'Lucky!' : 'Miss', 'miss');
    else foe.takeDamage(res.dmg, m.x, m.z);
  }, 0.2);
});
mobs.on('dash', (m) => { audio.play('dodge'); fx.puff(m.x, world.heightAt(m.x, m.z) + 0.15, m.z, 0.5); });
mobs.on('double', () => fx.number(player.x, overHead(player, 1.6), player.z, 'Double!', 'miss'));
mobs.on('summon', (m) => {
  menus.message(m.def.summonText || `The ${m.def.name} calls his guards!`);
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.5, m.z, '#ffd23a', 14);
  audio.play('night');
});
mobs.on('mvpSpawn', (m) => { // an MVP announces itself; a mini-boss just turns up
  if (!m.def.mvp) return;
  menus.message(m.def.wake || `The ${m.def.name} has appeared!`);
  audio.play('night');
});
mobs.on('bossDown', (m) => {
  const mins = Math.round(m.def.respawn / 60);
  setTimeout(() => menus.message(`The ${m.def.name} will return in about ${mins} minutes.`), 2500);
  persist();
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
  gainExp(d.mvpExp, 0, RATES);
  const mins = Math.round(d.respawn / 60);
  setTimeout(() => menus.message(`The ${d.name} will return in about ${mins} minutes.`), 2500);
  persist();
});

// ---------- experience: Base and Job EXP, like Ragnarok ----------
const knownSkills = () => new Set(skillList(prog).filter((id) => skillLv(prog, id)));
function announceSkills(before) {
  for (const id of knownSkills()) if (!before.has(id) && (SKILLS[id].free || SKILLS[id].granted)) menus.message(`New skill: ${SKILLS[id].name}! See the Skills window.`);
}
// rate: RATES for battles, QUEST_RATE for quest rewards; none for EXP already counted at its rate
function gainExp(base, job, rate = { base: 1, job: 1 }) {
  const k = inv.wearing('exp') ? 1.25 : 1;
  const known = knownSkills();
  const ups = prog.gain(Math.round(base * k * rate.base), Math.round(job * k * rate.job));
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
const questGiver = giverOf;
function questComplete(id) {
  audio.play('heart');
  // a second-job trial's hunt on the way hands itself in where you stand and starts the next
  // step; only the last step goes back to the trainer (the whole trial still pays at the end)
  if (NEXT[id] && Object.values(NPCS).some((n) => n.trial2?.includes(id)) && quests.turnIn(id, inv)) {
    quests.accept(NEXT[id]);
    menus.message(`${QUESTS[id].title} done! Next: ${QUESTS[NEXT[id]].title}`);
    refreshQuests();
    persist();
    return;
  }
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
  if (r.xp) gainExp(r.xp, r.job ?? Math.round(r.xp * 0.7), QUEST_RATE); // (a job trial's steps on the way pay nothing)
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
  // a rare hunt's monster leaves once its quest is done or given up
  for (const m of [...mobs.list]) if (m.temp && m.alive && MOB_DEFS[m.type].noRespawn && !Object.keys(quests.active).some((k) => QUESTS[k].mob === m.type && !quests.ready(k, inv))) mobs.remove(m);
  // monsters an active kill quest still wants come back twice as fast
  mobs.hunted = new Set(Object.keys(quests.active).flatMap((k) => {
    const q = QUESTS[k];
    return q.kind !== 'kill' || quests.ready(k, inv) ? [] : q.mobs ? Object.keys(q.mobs) : [q.mob];
  }));
  villagers.setMarks((npc) => {
    if (story.talkStep(npc) && storyLive()) return 'story';
    const st = quests.status(npc, prog, inv).state;
    return st === 'offer' || st === 'job' ? 'offer' : st === 'ready' ? 'ready' : null;
  });
  let h = '';
  const s = story.step;
  if (s && storyLive()) {
    const where = story.directions(world.id, prog);
    h += `<div class="story" data-q="story"><small>${esc(s.ch)}</small><b>★ ${esc(s.title)}</b><span>${esc(s.goal)}${story.progress()}</span>${where ? `<em>➜ ${esc(where)}</em>` : ''}</div>`;
  }
  for (const id of Object.keys(quests.active)) {
    const done = quests.ready(id, inv);
    h += `<div class="${done ? 'done' : ''}${QUESTS[id].job ? ' job' : ''}" data-q="${id}"><b>${QUESTS[id].title}</b><span>${done ? `Return to ${NPCS[questGiver(id)].name}` : quests.progress(id, inv)}</span>${nav?.quest === id ? '<em>➜ on the way</em>' : ''}</div>`;
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

// tap a quest in the list: its Quest View, with a Go button
trackerList.addEventListener('click', (e) => {
  const el = e.target.closest('[data-q]');
  if (!el) return;
  audio.play('ui');
  menus.openQuest(el.dataset.q);
});

// ---------- auto-navigation: walk portal by portal to where a quest happens ----------
// portals between two maps (fewest first)
function hops(from, to) {
  if (from === to) return 0;
  const seen = { [from]: 0 }, queue = [from];
  while (queue.length) {
    const m = queue.shift();
    for (const p of MAPS[m].portals) {
      if (p.to in seen) continue;
      seen[p.to] = seen[m] + 1;
      if (p.to === to) return seen[p.to];
      queue.push(p.to);
    }
  }
  return Infinity;
}
const mapsOf = (mob) => Object.keys(SPAWNS).filter((m) => SPAWNS[m].some(([t]) => t === mob));
const nearestMap = (maps) => [...maps].sort((a, b) => hops(world.id, a) - hops(world.id, b))[0];
// where a quest sends you next: { map, npc (talk to them there), why }, or null
function questTarget(id) {
  if (id === 'story') {
    const s = story.step, map = s && story.map();
    return map ? { map, npc: s.npc || null, at: s.at, why: s.title } : null; // a talk step's person, the Keeper to sign with, or a place
  }
  const q = QUESTS[id], giver = questGiver(id);
  if (!(id in quests.active) || quests.ready(id, inv)) return { map: NPCS[giver].map || 'camp', npc: giver, why: NPCS[giver].name };
  if (q.rare) return { map: q.rare.map, at: q.rare, why: `the ${MOB_DEFS[q.mob].name}${q.rare.night ? ', out only at night' : ''}` };
  if (q.kind === 'search') return { map: q.map, why: `${q.thing}s` };
  if (q.kind === 'defend') return { map: q.map, at: q.at, why: q.place };
  if (q.kind === 'deliver') return { map: NPCS[q.to].map || 'camp', npc: q.to, why: NPCS[q.to].name };
  if (q.kind === 'kill') { // for a hunt of several kinds, the first kind still wanted
    const mob = q.mobs ? Object.keys(q.mobs).find((m) => (quests.active[id][m] || 0) < q.mobs[m]) : q.mob;
    const map = nearestMap(mapsOf(mob));
    return map ? { map, why: `${MOB_DEFS[mob].name}s` } : null;
  }
  // a quiz is answered to whoever gave it, once anything it needs is in the bag
  if (q.kind === 'quiz' && quests.hasItems(id, inv)) return { map: NPCS[giver].map || 'camp', npc: giver, why: NPCS[giver].name };
  if (q.kind === 'visit') { const left = q.zones.filter((z) => !quests.active[id].includes(z)); return left.length ? { map: nearestMap(left), why: 'a land to visit' } : null; }
  // a gathering quest: the nearest map where an item still missing drops
  let best = null;
  for (const [item, n] of Object.entries(q.items)) {
    if (inv.have(item) >= n) continue;
    for (const t of Object.keys(MOB_DEFS)) {
      if (!MOB_DEFS[t].drops.some(([d]) => d === item)) continue;
      for (const map of mapsOf(t)) {
        const h = hops(world.id, map);
        if (!best || h < best.h) best = { h, map, why: `${ITEMS[item].name} from ${MOB_DEFS[t].name}s` };
      }
    }
  }
  return best;
}
function startNav(id) {
  const t = questTarget(id);
  if (!t) { menus.message("You'll have to find that one yourself."); return; }
  nav = { quest: id, ...t };
  menus.close('quest');
  menus.message(world.id === t.map && !t.npc ? `${t.why}: right here in ${ZONE_NAMES[t.map]}.` : `On the way to ${ZONE_NAMES[t.map]}: ${t.why}. Tap the ground to stop.`);
  if (world.id === t.map && !t.npc) nav = null;
  refreshQuests();
}
// each frame: when idle, head for the next portal (or the person) on the way
function tickNav() {
  if (!nav || warping || player.state !== 'normal' || player.goal || player.cast || menus.isOpen('story')) return;
  if (world.id === nav.map) {
    const k = nav.npc, spot = k && SPOTS.find((sp) => sp.npc === k), at = nav.at;
    nav = null;
    if (spot) player.command({ x: spot.x, z: spot.z, reach: 1.7, arrive: spot.run });
    else if (at) player.command({ x: at.x, z: at.z, reach: 1.5 }); // a place: the waystone, the pond
    else menus.message(`You have arrived in ${ZONE_NAMES[world.id]}.`);
    refreshQuests();
    return;
  }
  const p = route(world.id, nav.map);
  if (!p) { nav = null; refreshQuests(); return; }
  player.command({ x: p.x, z: p.z, reach: 0.05 });
}
const stopNav = () => { if (nav) { nav = null; refreshQuests(); } };

// ---------- wading: in a lake's shallows the water hides the feet, and rings spread round them ----------
// A sprite faces the camera, so the water cannot hide its feet by depth: like Ragnarok, the sprite is
// cut at the waterline instead (a clipping plane on its material while it stands in the water)
const waterLine = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y); // keeps what is above the surface
function wet(mat, on) {
  if (!!mat.userData.wet === on) return;
  mat.userData.wet = on;
  mat.clippingPlanes = on ? [waterLine] : null;
  mat.needsUpdate = true;
}
let wadeT = 0;
function tickWading(dt) {
  const inWater = world.wading(player.x, player.z) > 0;
  for (const mat of [player.mat, player.headSpr.material, player.hairSpr.material]) wet(mat, inWater);
  for (const m of mobs.list) wet(m.mat, m.alive && !m.def.fly && world.wading(m.x, m.z) > 0);
  wadeT -= dt;
  if (wadeT > 0) return;
  wadeT = 0.32;
  const ring = (o, moving, size) => {
    if (world.wading(o.x, o.z) > 0 && (moving || Math.random() < 0.25)) fx.ripple(o.x, WATER_Y + 0.015, o.z, size);
  };
  ring(player, player.moving, 1);
  for (const m of mobs.list) {
    if (!m.alive || m.def.fly || Math.hypot(m.x - player.x, m.z - player.z) > 16) continue;
    ring(m, m.walked !== m.wadeW, m.def.w); // walked: how far it has gone in all, so a change means it moved
    m.wadeW = m.walked;
  }
}

// ---------- the vigil on Ember Hill: hold the heralds off while Vigdis sings (a survive step) ----------
let vigil = null, giantWarnT = -99; // vigil: { t, next, list }
const VIGIL_WAVE = 15; // seconds between waves of heralds (lesser ones, like a boss's guards)
const giantOf = () => mobs.list.find((m) => m.alive && m.def.mvp && m.type === 'jarl');
function endVigil(why) {
  const g = giantOf();
  if (g) g.lulled = false;
  for (const m of vigil.list) if (mobs.list.includes(m)) { fx.puff(m.x, world.heightAt(m.x, m.z) + 0.3, m.z, m.def.w); mobs.remove(m); }
  vigil = null;
  story.count = 0;
  if (why) menus.message(why);
  refreshQuests();
}
function tickVigil(dt) {
  const s = story.step;
  if (!storyLive() || s?.kind !== 'survive') { if (vigil) endVigil(); return; }
  const y = world.heightAt(s.at.x, s.at.z);
  if (!vigil) {
    if (world.id !== s.map) return;
    if (Math.random() < dt * 3) fx.sparkle(s.at.x, y + 0.4, s.at.z, '#b48aff', 4); // where to stand
    if (Math.hypot(s.at.x - player.x, s.at.z - player.z) > 3 || player.state !== 'normal') return;
    // the Fire Giant roams the hill: the song would only wake him if he stood close, and once it
    // begins it lulls him while it lasts
    const g = giantOf();
    if (g && Math.hypot(g.x - s.at.x, g.z - s.at.z) < 14) {
      if (skillClock - giantWarnT > 8) { giantWarnT = skillClock; menus.message('The Fire Giant prowls too close to the circle: the song would wake him. Wait for him to wander off.'); }
      return;
    }
    if (g) { g.lulled = true; g.state = 'wander'; }
    vigil = { t: 0, next: 2, list: [], giant: g };
    menus.message('The runes in the circle light up, and Vigdis\'s song rises out of them. The hill trembles: the heralds are coming!');
    audio.play('night');
    return;
  }
  if (world.id !== s.map || player.state === 'down') { endVigil('The song breaks off. Go back to the hill road and begin again.'); return; }
  if (Math.hypot(s.at.x - player.x, s.at.z - player.z) > 12) { endVigil('You strayed too far, and the song breaks off. Stand by the rune circle and begin again.'); return; }
  if (vigil.giant?.alive && !vigil.giant.lulled) { endVigil('You struck the Fire Giant: he wakes, and the song breaks off. Let him wander off, then begin again.'); return; }
  vigil.t += dt;
  story.count = Math.floor(vigil.t);
  if (Math.random() < dt * 6) fx.sparkle(s.at.x + (Math.random() - 0.5) * 3, y + 0.3, s.at.z + (Math.random() - 0.5) * 3, '#b48aff', 3); // the song in the air
  const up = vigil.list.filter((m) => m.alive).length;
  if (vigil.t >= vigil.next && vigil.t < s.secs - 4 && up < 4) { // a wave of heralds from all round the hill (held back while four still stand)
    vigil.next += VIGIL_WAVE;
    const kinds = vigil.t > 30 ? ['beetle', 'beetle', 'wisp'] : ['beetle', 'wisp'], a0 = Math.random() * Math.PI * 2; // the hill grows angrier
    kinds.forEach((type, i) => {
      const a = a0 + (i / kinds.length) * Math.PI * 2;
      let x = s.at.x + Math.cos(a) * 8, z = s.at.z + Math.sin(a) * 8;
      if (!world.walkable(x, z)) { x = s.at.x + Math.cos(a) * 4; z = s.at.z + Math.sin(a) * 4; }
      const m = mobs.add(type, x, z);
      m.def = guardDef(type);
      m.hp = m.def.hp;
      m.temp = true;
      m.provoke();
      vigil.list.push(m);
    });
    fx.puff(s.at.x, y + 0.2, s.at.z, 2);
    cam.shake = 0.3;
  }
  if (vigil.t >= s.secs) { story.flag(s.id); endVigil(); }
}

// ---------- raids (raid.js): three waves and a boss against the clock ----------
// The Boatman rows you out; the waves come in from the shore all round and never give up; after each
// wave a breather (and before the boss a full heal). EXP is held while you fight and paid when the
// run ends: x1.5 on a clear, the kills alone otherwise. Leaving, fainting or the tide (the timer)
// ends it. One cooldown for every difficulty, from going in. The story's Tutorial run (only while the
// story waits on the raid) starts no cooldown, and pays the clear reward and moves the story on, win
// or lose.
let raidAt = save?.raidAt || 0; // when the tide lets the Boatman row again (ms since 1970)
let raid = null; // { id, diff, left, wave, phase: land | fight | rest, restT, list, boss, exp: [base, job], arrived, shown }
const raidBar = document.getElementById('raidbar'), bossBar = document.getElementById('bossbar');
raidBar.querySelector('.rb-leave').addEventListener('click', () => { if (raid) endRaid(false, 'You leave the island, and the Boatman rows you back to Salt Bay.'); });
const raidOf = (map) => Object.entries(RAIDS).find(([, R]) => R.map === map)?.[1] || null;
const storyRaid = (id) => storyLive() && story.step?.kind === 'raid' && story.step.raid === id;
const boatSpot = (R) => ({ x: NPCS[R.npc].x, z: NPCS[R.npc].z + 1.4 });
function raidInfo(id) {
  return { wait: Math.max(0, raidAt - Date.now()), story: storyRaid(id) };
}
function raidGo(id, diff) {
  const R = RAIDS[id], D = R.difficulties[diff], info = raidInfo(id);
  if (raid || warping || !D || (D.tutorial ? !info.story : info.wait)) return;
  if (!D.tutorial) raidAt = Date.now() + R.cooldown; // the tide, from going in
  raid = { id, diff, left: R.secs, wave: -1, phase: 'land', restT: 2.5, list: [], boss: null, exp: [0, 0], arrived: false, shown: 1 };
  menus.close('talk');
  warp(R.map, null, R.landing);
}
// one of the raid's monsters, from the shore, away from the hero
function raidSpawn(R, type, lv, s, guard = null) {
  const r = MAPS[R.map].arena.r - 2;
  let x = 32, z = 32;
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    x = 32 + Math.cos(a) * r; z = 32 + Math.sin(a) * r;
    if (world.walkable(x, z) && Math.hypot(x - player.x, z - player.z) > 7) break;
  }
  const m = mobs.add(type, x, z);
  m.def = raidDef(type, lv, s, guard);
  m.hp = m.def.hp;
  m.temp = true;
  fx.puff(x, world.heightAt(x, z) + 0.3, z, m.def.w);
  raid.list.push(m);
  return m;
}
function raidNext(R, D) {
  raid.wave++;
  raid.phase = 'fight';
  if (raid.wave < R.waves.length) {
    for (const [type, n, off] of R.waves[raid.wave]) for (let i = 0; i < n; i++) raidSpawn(R, type, D.lv + off, D.wave);
    menus.message(`Wave ${raid.wave + 1} of ${R.waves.length}! The bloops come bouncing in from the shore.`);
    audio.play('night');
    cam.shake = 0.25;
  } else {
    const [type, off] = R.boss;
    raid.boss = raidSpawn(R, type, D.lv + off, D.boss, D.wave);
    menus.message(`${raid.boss.def.name} rises out of the surf: the old bloop general, beard, plume and all!`);
    audio.play('night');
    cam.shake = 0.6;
  }
}
function tickRaid(dt) {
  if (!raid) return;
  const R = RAIDS[raid.id], D = R.difficulties[raid.diff];
  if (!raid.arrived) {
    if (world.id !== R.map || warping) return;
    raid.arrived = true;
    menus.message(`${R.name}, ${D.name}: three waves of bloops, then their boss. ${R.secs / 60} minutes before the tide turns!`);
  }
  if (world.id !== R.map) { endRaid(false, 'You left the island, and the raid is lost.', true); return; }
  if (player.state === 'down') { endRaid(false, 'You fainted, and the raid is lost.', true); return; }
  raid.left -= dt;
  if (raid.left <= 0) { endRaid(false, 'The tide turns! The Boatman rows you back before the raid is done.'); return; }
  if (raid.phase === 'fight' && !raid.list.some((m) => m.alive && mobs.list.includes(m))) {
    if (raid.boss) { winRaid(R, D); return; }
    const last = raid.wave === R.waves.length - 1, k = last && R.bossHeal ? 1 : R.breather;
    player.heal(Math.ceil(player.maxHp * k));
    player.healSp(Math.ceil(player.maxSp * k));
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.6, player.z, '#9fe8a8', 14);
    menus.message(last ? 'The last wave falls, and the island shakes... Your HP and SP are restored. Get ready!' : `Wave ${raid.wave + 1} cleared! Catch your breath (HP and SP partly restored).`);
    raid.phase = 'rest';
    raid.restT = R.rest;
    raid.list = [];
  }
  if (raid.phase !== 'fight' && (raid.restT -= dt) <= 0) raidNext(R, D);
  raidHud(R, D);
}
function raidHud(R, D) {
  raidBar.hidden = false;
  const s = Math.max(0, Math.ceil(raid.left));
  raidBar.querySelector('.rb-name').textContent = `${R.name} · ${D.name}`;
  const time = raidBar.querySelector('.rb-time');
  time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  time.classList.toggle('low', s < 60);
  raidBar.querySelector('.rb-stage').textContent = raid.boss ? 'Boss' : raid.wave < 0 ? 'Landing' : `Wave ${raid.wave + 1}/${R.waves.length}`;
  raidBar.querySelector('.rb-exp').textContent = `EXP held ${Math.round(raid.exp[0]).toLocaleString()}`;
  // the boss's big health bar
  const b = raid.boss;
  bossBar.hidden = !(b && b.alive);
  if (bossBar.hidden) return;
  const f = Math.max(0, b.hp / b.def.hp);
  bossBar.querySelector('.bb-name').textContent = `${b.def.name} · Lv ${b.def.lv}`;
  bossBar.querySelector('.bb-bar i').style.width = `${(f * 100).toFixed(1)}%`;
  bossBar.classList.toggle('low', f < 0.3);
  if (f < raid.shown - 0.001) { bossBar.classList.remove('hit'); void bossBar.offsetWidth; bossBar.classList.add('hit'); } // a blow lands: the bar flashes
  raid.shown = f;
}
function winRaid(R, D) {
  audio.play('levelup');
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 30);
  menus.message(`${R.name} cleared on ${D.name} with ${Math.floor(raid.left / 60)}:${String(Math.floor(raid.left % 60)).padStart(2, '0')} to spare!`);
  endRaid(true, null);
}
// the clear reward: perz, items, and the rare roll
function raidReward(id, diff) {
  const r = rollReward(id, diff);
  if (r.perz) { inv.addPerz(r.perz); menus.message(`+${r.perz.toLocaleString()} perz`); }
  const give = (item, n) => { const got = inv.add(item, n); if (got < n) inv.chest.add(item, n - got); menus.toast(item, n); };
  for (const [item, n] of Object.entries(r.items)) give(item, n);
  if (r.rare) { give(r.rare, 1); audio.play('heart'); menus.message(`Rare find! ${ITEMS[r.rare].name}!`); }
}
// the run is over: its monsters go, the EXP held is paid, and (unless the hero went elsewhere) the
// Boatman rows them back
function endRaid(win, why, stay = false) {
  const R = RAIDS[raid.id], D = R.difficulties[raid.diff], [b, j] = raid.exp, k = win ? 1.5 : 1, run = raid;
  for (const m of [...mobs.list]) if (m.def.raidLv) mobs.remove(m);
  raid = null;
  // a clear pays the reward; so does the story's Tutorial run, win or lose. Either moves the story on
  if (win || D.tutorial) raidReward(run.id, run.diff);
  if ((win || D.tutorial) && storyRaid(run.id)) {
    if (!win) story.flags[`${story.step.id}_lost`] = true; // the Boatman finishes a lost Tutorial for you (story.js says so)
    story.flag(story.step.id);
  }
  raidBar.hidden = bossBar.hidden = true;
  if (why) menus.message(why);
  if (b || j) {
    menus.message(`Raid EXP: +${Math.round(b * k).toLocaleString()} Base, +${Math.round(j * k).toLocaleString()} Job${win ? ' (x1.5 for the clear)' : ''}`);
    gainExp(Math.round(b * k), Math.round(j * k)); // already at the battle rate
  }
  if (!stay) setTimeout(() => warp(R.from, null, boatSpot(R)), win ? 2500 : 700);
  refreshQuests();
  persist();
}

// ---------- quests out in the world: searches, defences and rare hunts ----------
let searchT = 0, defense = null, waveRest = 0; // waveRest: a breather between a defence's waves
function tickQuestWorld(dt) {
  searchT -= dt;
  waveRest -= dt;
  const y = (x, z) => world.heightAt(x, z);
  for (const [id, a] of Object.entries(quests.active)) {
    const q = QUESTS[id];
    // a search: what is still to be found glints, and is picked up by walking over it
    if (q.kind === 'search' && q.map === world.id) {
      if (searchT <= 0) q.spots.forEach(([x, z], i) => { if (!a.includes(i) && Math.hypot(x - player.x, z - player.z) < 26) fx.sparkle(x, y(x, z) + 0.4, z, '#ffe37a', 4); });
    }
    // a rare hunt: it shows itself on its map (at night, if it keeps to the night) until it falls
    if (q.rare && q.rare.map === world.id) {
      const out = mobs.list.find((m) => m.type === q.mob && m.alive);
      const time = !q.rare.night || dayNight.night > 0.6;
      if (!out && time && !quests.ready(id, inv)) {
        const m = mobs.add(q.mob, q.rare.x, q.rare.z);
        m.temp = true;
        menus.message(`Something golden rises over ${ZONE_NAMES[world.id]}... the ${MOB_DEFS[q.mob].name}!`);
        audio.play('night');
      } else if (out && !time) { mobs.remove(out); menus.message(`Dawn: the ${MOB_DEFS[q.mob].name} fades away. It will be back tonight.`); }
    }
    // a defence: stand by the place and the waves come
    if (q.kind === 'defend' && q.map === world.id && !quests.ready(id, inv) && !defense) {
      if (searchT <= 0) fx.sparkle(q.at.x, y(q.at.x, q.at.z) + 0.6, q.at.z, '#8fd4ff', 6);
      if (waveRest <= 0 && Math.hypot(q.at.x - player.x, q.at.z - player.z) < 3.5 && player.state === 'normal') startWave(id);
    }
  }
  if (searchT <= 0) searchT = 0.6;
  for (const { id, n } of quests.onSearch(world.id, player.x, player.z)) {
    const q = QUESTS[id];
    audio.play('pickup');
    fx.sparkle(player.x, y(player.x, player.z) + 0.8, player.z, '#ffe37a', 18);
    menus.message(`${q.verb || 'Found'}: ${q.thing} ${n}/${q.spots.length}`);
    if (quests.ready(id, inv)) questComplete(id); else refreshQuests();
  }
  tickDefense(dt);
}
function startWave(id) {
  const q = QUESTS[id], [type, count] = q.waves[quests.active[id]];
  const list = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random(), r = 6 + Math.random() * 2;
    let x = q.at.x + Math.cos(a) * r, z = q.at.z + Math.sin(a) * r;
    if (!world.walkable(x, z)) { x = q.at.x + Math.cos(a) * 3; z = q.at.z + Math.sin(a) * 3; }
    const m = mobs.add(type, x, z);
    m.temp = true;
    m.provoke();
    list.push(m);
  }
  defense = { id, list, next: 0 };
  audio.play('night');
  menus.message(`Wave ${quests.active[id] + 1} of ${q.waves.length}: ${count} ${MOB_DEFS[type].name}s come for ${q.place}!`);
}
function tickDefense(dt) {
  if (!defense) return;
  const q = QUESTS[defense.id];
  // walked away, fainted, or left the map: the wave scatters (waves already held still count)
  if (!(defense.id in quests.active) || world.id !== q.map || player.state === 'down' || Math.hypot(q.at.x - player.x, q.at.z - player.z) > 16) {
    for (const m of defense.list) if (mobs.list.includes(m)) mobs.remove(m);
    defense = null;
    if (q.map === world.id) menus.message(`You left ${q.place}, and the wave scatters. Come back to try again.`);
    return;
  }
  if (defense.list.some((m) => m.alive)) return;
  quests.waveHeld(defense.id);
  const id = defense.id;
  defense = null;
  audio.play('levelup');
  if (quests.ready(id, inv)) questComplete(id);
  else { waveRest = 6; menus.message(`Wave held! Catch your breath: the next one comes in a few seconds.`); refreshQuests(); }
}

// ---------- the story ----------
const storyLive = () => !!story.flags.intro && !story.done; // after the opening pages
// a step is done: its lines play, then the reward, then the next step is announced
function storyDone() {
  const s = story.advance();
  const say = typeof s.say === 'function' ? s.say(story.flags) : s.say; // (a step's lines may depend on how it went)
  menus.story(say || [], `${s.ch} · ${s.title}`, () => {
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
  if (story.met({ prog, hotbar, skillLv, keepers })) storyDone();
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
  // Gyda the Healer: HP and SP back to full, for nothing
  heal() {
    player.heal(player.maxHp);
    player.healSp(player.maxSp);
    audio.play('craft');
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#9fffb0', 18);
    menus.message('Gyda mends your wounds. HP and SP are full.');
  },
  // the Quest View: where a quest is, and walking there
  questTarget: (id) => questTarget(id),
  questGo: (id) => startNav(id),
  questQuit(id) {
    if (id === 'story' || !quests.quit(id)) return; // the main story can never be given up
    if (nav?.quest === id) nav = null;
    audio.play('ui');
    menus.message(SERIES[id] ? `${QUESTS[id].title.split(':')[0]} given up. Its trainer will start you over, or you may pick another trial.` : `${QUESTS[id].title} given up.`);
    refreshQuests();
    persist();
  },
  storyStep: () => (storyLive() ? story.step : null),
  storyProgress: () => story.progress(),
  // the Keepers: sign their ledger, save there, and teleport between the ones you have signed
  keeperKnown: (k) => keepers.has(k),
  savedAt: () => savePoint?.keeper || 'keeper_camp',
  keeperRegister(k) {
    keepers.add(k);
    audio.play('craft');
    menus.message(`You sign ${NPCS[k].name}'s ledger. ${ZONE_NAMES[NPCS[k].map || 'camp']} remembers you.`);
    persist();
  },
  keeperSave(k) {
    const n = NPCS[k];
    savePoint = { keeper: k, map: n.map || 'camp', x: n.x, z: n.z + 1.4 };
    audio.play('craft');
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffe37a', 14);
    menus.message(`Saved at ${ZONE_NAMES[savePoint.map]}. You will wake here after a fall, and Return Feathers bring you here.`);
    persist();
  },
  keeperList: (here) => [...keepers].filter((k) => k !== here && NPCS[k]).map((k) => [k, FARES[NPCS[k].map || 'camp']]),
  keeperGo(k) {
    const n = NPCS[k], fare = FARES[n.map || 'camp'];
    if (!keepers.has(k) || inv.perz < fare) return;
    inv.perz -= fare;
    menus.close('talk');
    warp(n.map || 'camp', null, { x: n.x, z: n.z + 1.4 });
  },
  // Ivar the Ferryman: the lands you have walked, and his fares
  ferryList: () => Object.entries(FARES).filter(([m]) => visited.has(m) && m !== world.id),
  // the Boatman: the raid's difficulties and the tide
  raidInfo: (id) => raidInfo(id),
  raidGo: (id, diff) => raidGo(id, diff),
  ferry(map) {
    const fare = FARES[map];
    if (!visited.has(map) || inv.perz < fare) return;
    inv.perz -= fare;
    menus.close('talk');
    warpTo(map);
  },
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
    const known = knownSkills(), switching = JOBS[job].tier === 1 && prog.unlocked.includes(job), first = !prog.unlocked.includes(job);
    if (JOBS[job].tier === 1) prog.takeFirst(job); else prog.takeSecond(job);
    // a new Sorcerer is handed a staff
    if (job === 'mage' && first && !inv.bag.count('oak_staff') && inv.gear.weapon !== 'oak_staff') { inv.add('oak_staff', 1); menus.toast('oak_staff', 1); }
    const off = inv.dropUnwearable();
    if (job === 'mage' && !inv.gear.weapon) inv.equip('oak_staff'); // straight into the new Sorcerer's hand
    // a new Archer is handed a bow and a quiver of arrows, put on at once
    if (job === 'archer' && first) {
      for (const id of ['hunting_bow', 'wooden_arrow']) if (!inv.bag.count(id) && !Object.values(inv.gear).includes(id)) { inv.add(id, 1); menus.toast(id, 1); }
      if (ITEMS[inv.gear.weapon]?.kind !== 'bow' && inv.bag.count('hunting_bow')) inv.equip('hunting_bow');
      if (!inv.gear.ammo && inv.bag.count('wooden_arrow')) inv.equip('wooden_arrow');
    }
    // empty hands after the switch: the best weapon in the bag the new job can hold, and arrows for a bow
    if (!inv.gear.weapon) {
      const best = inv.bag.slots.map((s) => s.id).filter((id) => ITEMS[id].slot === 'weapon' && canWear(id, prog.wearJobs))
        .sort((a, b) => (ITEMS[b].atk || 0) + (ITEMS[b].matk || 0) - (ITEMS[a].atk || 0) - (ITEMS[a].matk || 0))[0];
      if (best) inv.equip(best);
    }
    if (ITEMS[inv.gear.weapon]?.kind === 'bow' && !inv.gear.ammo) {
      const arrows = inv.bag.slots.map((s) => s.id).filter((id) => ITEMS[id].slot === 'ammo').sort((a, b) => (ITEMS[b].atk || 0) - (ITEMS[a].atk || 0))[0];
      if (arrows) inv.equip(arrows);
    }
    const aJob = `${/^[AEIOU]/.test(JOBS[job].name) ? 'an' : 'a'} ${JOBS[job].name}`; // an Archer
    if (off.length) menus.message(`Put away what ${aJob} can't use: ${off.map((i) => ITEMS[i].name).join(', ')}`);
    player.setArt(jobArt());
    applyStats();
    player.heal(player.maxHp);
    player.healSp(player.maxSp);
    audio.play('levelup');
    const y = world.heightAt(player.x, player.z);
    fx.sparkle(player.x, y + 0.6, player.z, '#ffe37a', 24);
    fx.number(player.x, y + 1.9, player.z, `${JOBS[job].name}!`, 'level');
    menus.message(switching ? `You are ${aJob} again. Your Job Level and skills come with you.`
      : JOBS[job].tier === 2 ? `You are now ${aJob}! Job Level starts again; new skills wait in the Skills window.`
        : prog.unlocked.length > 1 ? `You are now ${aJob} too! Your paths share one Job Level and one pool of skill points.`
          : `You are now ${aJob}! Earn Job Levels for skill points.`);
    announceSkills(known);
    menus.render();
    persist();
  },
  crafted() { audio.play('craft'); persist(); },
  traded(kind) { audio.play('pickup'); if (kind === 'sell') story.flag('sold'); persist(); },
  equipped() { audio.play('ui'); persist(); },
  // Holger, Seyla or a card: a bright chime when it works, a crash when the piece breaks
  upgraded(mode, res) {
    if (res.ok) { audio.play('levelup'); fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 18); }
    else { audio.play('hit'); fx.puff(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, 0.8); }
    persist();
  },
  raised() { applyStats(); audio.play('craft'); persist(); },
  accept(id) {
    quests.accept(id);
    for (const done of quests.onZone(world.zoneAt(player.x, player.z))) questComplete(done);
    audio.play('ui');
    menus.message(`New quest: ${QUESTS[id].title}`);
    menus.close('talk');
    refreshQuests();
  },
  // the trainers' retraining (Liv, Ingrid, Sven): the first of each kind is free. Skills: a first
  // job's trees, or a second job's and its first jobs' (its beasts go home with their summons)
  retrain(kind) {
    const cost = prog.resets[kind] ? RETRAIN_COST : 0;
    if (inv.perz < cost) { menus.message('Not enough perz'); return; }
    if (kind === 'stats') prog.resetStats();
    else if (!(prog.tier === 2 ? unlearnSecondJob(prog) : unlearnFirstJob(prog))) return;
    if (kind === 'skills') allies.clear();
    inv.perz -= cost;
    applyStats();
    hotbar.render?.();
    audio.play('craft');
    menus.message(kind === 'stats' ? 'Your stats are back to 1: place your points again in the Status window.' : prog.tier === 2 ? `Your job skills are unlearnt. Rebuild your first jobs in the Skills window: ${JOBS[prog.job].name} skills open again once every first-job point is spent.` : 'Your first-job skills are unlearnt: spend the points again in the Skills window.');
    persist();
  },
  // a delivery handed over: back to whoever sent it
  delivered(id) {
    quests.deliver(id);
    audio.play('pickup');
    questComplete(id);
    persist();
  },
  // a trainer's question: a chime when right, a thud when not (no penalty, just try again)
  answered(id, ok) {
    audio.play(ok ? 'heart' : 'block');
    refreshQuests();
    persist();
  },
  handIn(id) {
    const r = quests.turnIn(id, inv);
    if (!r) return;
    audio.play('craft');
    giveReward(r);
    // a series (the job trials) carries straight on to its next step
    if (NEXT[id]) { quests.accept(NEXT[id]); menus.message(`Step done. Next: ${QUESTS[NEXT[id]].title}`); }
    refreshQuests();
    menus.render();
    persist();
  },
  ui() { audio.play('ui'); },
  soundOn: () => audio.enabled,
  toggleSound() { audio.setEnabled(!audio.enabled); },
  closed() { persist(); },
  // Settings' Back to main menu: save, and back to the title to pick a hero (not in a raid)
  toTitle() {
    if (raidOf(world.id)) { menus.message('Finish the raid first.'); return; }
    persist();
    resetting = true;
    location.reload();
  },
  // the hair picker tries looks on as you choose; lookDone keeps one (the stylist charges for it)
  look(l) { player.setLook(l); player.setArt(jobArt()); }, // a new body when trying the other one on
  currentLook: () => ({ ...player.look }),
  lookDone(l, mode) {
    if (mode === 'stylist') {
      if (inv.perz < 1000) { player.setLook(lookBefore); player.setArt(jobArt()); menus.message('Not enough perz'); return; }
      inv.perz -= 1000;
      inv.changed();
      menus.message('Embla steps back, pleased: "Like a hero of the songs!"');
    }
    player.setLook(l);
    player.setArt(jobArt());
    lookBefore = { ...player.look };
    audio.play('craft');
    persist();
    if (mode === 'new') startStory();
  },
});
menus.quests = quests;
const portraits = {};
menus.portrait = (id) => (id === 'player' ? (portraits[`${prog.job}|${player.look.body}|${jobArt().dressed}`] ||= jobArt().anims.down.idle[0].image.toDataURL())
  : (portraits[id] ||= lib.villagers[id].anims.down.idle[0].image.toDataURL()));
// things in camp and town you tap to use: the player walks over, then it opens. h = height on screen
const SPOTS = [
  { map: 'camp', ...world.camp.fire, label: 'Campfire', h: 0.9, run: () => menus.message('A warm fire. Crafting is done in Steinborg now: Gunnar forges gear, Ragna brews usables.') },
  { map: 'camp', ...world.camp.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') },
  { map: 'camp', ...world.camp.tent, label: 'Tent', h: 2.2, run: () => rest() },
  { map: 'city', ...CITY.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') }, // Steinborg's storehouse: the same chest
  { map: 'magic', ...MAGIC.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') }, // and Galdrheim's
  { map: 'hunt', ...HUNT.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') }, // and Veidheim's
  ...villagers.list.map((v) => ({ npc: v.id, map: v.map, x: v.x, z: v.z, h: v.top, run: () => { if (menus.isOpen('story')) return; if (story.talkStep(v.id) && storyLive()) storyDone(); else menus.talkTo(v.id); } })),
];

// ---------- the big map: tap the minimap ----------
const bigmap = new BigMap({
  world, player, mobs, spots: SPOTS,
  goal: () => ui.goal,
  go(target) { stopNav(); player.command(target); },
});
document.getElementById('minimap').addEventListener('click', () => { if (started) bigmap.toggle(); });

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
  if (u.warp === 'camp') { if (savePoint) warp(savePoint.map, null, { x: savePoint.x, z: savePoint.z }); else warpTo('camp'); } // to your save point
  audio.play('pickup');
  inv.changed();
}

const skillCd = {}; // skill id -> seconds left
function useSkill(id) {
  const sk = SKILLS[id], lv = skillLv(prog, id);
  if (!lv || sk.kind !== 'active' || player.state === 'down' || (skillCd[id] || 0) > 0) return;
  // skills of every job earned can be used, with the right weapon in hand
  if (!weaponOk(id, weaponKind())) { menus.message(`${sk.name} needs ${WEAPON_NAMES[sk.weapon]} in hand`); return; }
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
    if (player.state === 'normal' && pay()) { player.endureT = 4; endureGuard = 0.15; endureFrom = 'guard'; endureLv = 1; say('Guard'); audio.play('block'); }
    return;
  }
  if (sk.magic && !sk.edge) { castSpell(id, lv, pay, sp); return; }
  if (id === 'aegis') { // a barrier of ATK and MATK together
    if (!pay()) return;
    const ps = player.ps, k = (50 + 10 * lv) / 100;
    player.barrier = Math.round((ps.batk + ps.watk) * k + (ps.matk[0] + ps.matk[1]) / 2 * k);
    buffs.aegis = 20; aegisLv = lv;
    applyStats();
    say('Stone Aegis'); audio.play('block');
    fx.sparkle(player.x, y + 0.8, player.z, '#c8a06a', 20);
    return;
  }
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
  // ---- Archer ----
  if (id === 'focus') {
    if (!pay()) return;
    buffs.focus = 60; focusLv = lv;
    applyStats();
    say('Focus'); audio.play('craft');
    fx.sparkle(player.x, y + 0.9, player.z, '#bfe8a0', 14);
    return;
  }
  if (id === 'leapback') { // 3 paces back, away from the nearest monster (or from where you face)
    const near = mobs.nearest(player.x, player.z, 8);
    let ax = near ? player.x - near.x : -player.face.x, az = near ? player.z - near.z : -player.face.z;
    const d = Math.hypot(ax, az) || 1;
    ax /= d; az /= d;
    let bx = player.x, bz = player.z;
    for (let k = 0.5; k <= 3; k += 0.5) {
      const x = player.x + ax * k, z = player.z + az * k, t = player.tiles.tileAt(x, z);
      if (!player.tiles.free(t[0], t[1]) || !world.walkable(x, z)) break;
      bx = x; bz = z;
    }
    if (bx === player.x && bz === player.z) { menus.message('No room to leap back'); return; }
    if (!pay()) return;
    fx.puff(player.x, y + 0.2, player.z, 0.8);
    const keep = player.goal?.mob?.alive ? player.goal.mob : null;
    player.stop();
    player.setPos(bx, bz);
    player.iframes = Math.max(player.iframes, 0.3);
    if (near) player.face = { x: -ax, z: -az };
    fx.puff(bx, world.heightAt(bx, bz) + 0.2, bz, 0.8);
    audio.play('dodge');
    if (keep) player.command({ mob: keep }); // keep shooting from the new spot
    return;
  }
  // ---- Windrunner ----
  if (id === 'tailwind') {
    if (!pay()) return;
    buffs.tailwind = sk.dur(lv); buffs.rush = 4; tailLv = lv;
    burstOfSpeed();
    applyStats();
    say('Tailwind'); audio.play('dodge');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; fx.sparkle(player.x + Math.cos(a) * 0.9, y + 0.3 + i * 0.08, player.z + Math.sin(a) * 0.9, '#bff4dc', 1); }
    return;
  }
  if (id === 'galestep') { // a dash away from the nearest monster (or ahead), untouchable, then a short burst
    const near = mobs.nearest(player.x, player.z, 8);
    let ax = near ? player.x - near.x : player.face.x, az = near ? player.z - near.z : player.face.z;
    const d = Math.hypot(ax, az) || 1;
    ax /= d; az /= d;
    let bx = player.x, bz = player.z;
    for (let k = 0.5; k <= 4; k += 0.5) {
      const x = player.x + ax * k, z = player.z + az * k, t = player.tiles.tileAt(x, z);
      if (!player.tiles.free(t[0], t[1]) || !world.walkable(x, z)) break;
      bx = x; bz = z;
    }
    if (bx === player.x && bz === player.z) { menus.message('No room to dash'); return; }
    if (!pay()) return;
    const keep = player.goal?.mob?.alive ? player.goal.mob : null;
    fx.zap({ x: player.x, y: y + 0.6, z: player.z }, { x: bx, y: world.heightAt(bx, bz) + 0.6, z: bz }, '#bff4dc');
    player.stop();
    player.setPos(bx, bz);
    player.iframes = Math.max(player.iframes, 0.5);
    buffs.gust = 2; gustHaste = sk.haste(lv);
    burstOfSpeed();
    applyStats();
    fx.puff(bx, world.heightAt(bx, bz) + 0.2, bz, 0.9);
    audio.play('dodge');
    if (keep) player.command({ mob: keep });
    return;
  }
  // ---- Beastmaster: the summons, and Pack Frenzy ----
  if (sk.beast) {
    if (!pay()) return;
    allies.summon(sk.beast, sk.beast === 'wolf' ? 2 : 1, beastStats(sk.beast), player);
    applyStats();
    say(sk.name); audio.play('night');
    for (const b of allies.of(sk.beast)) fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.6, b.z, b.K.aura, 14);
    return;
  }
  if (id === 'packfrenzy') {
    if (!allies.list.length) { menus.message('Call your beasts first'); return; }
    if (!pay()) return;
    buffs.frenzy = 15; frenzyLv = lv;
    applyStats();
    say('Pack Frenzy'); audio.play('night');
    for (const b of allies.list) fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.6, b.z, '#ff7a4a', 10);
    return;
  }
  // ---- Moon Ranger ----
  if (id === 'moonveil') {
    if (!pay()) return;
    buffs.veil = 15; veilLv = lv;
    say('Moonveil'); audio.play('craft');
    fx.sparkle(player.x, y + 0.9, player.z, '#c8d4ff', 18);
    return;
  }
  if (id === 'standfirm') {
    if (pay()) { player.endureT = 6 + Math.floor(lv / 2); endureGuard = lv / 100; endureFrom = 'standfirm'; endureLv = lv; say('Stand Firm'); audio.play('block'); }
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
      const res = playerAttack(player.ps, m.effDef(), sk.power(lv) / 100 * player.atkMul, 1, true);
      const yy = overHead(m, m.sprite.scale.y * 0.8);
      if (res.miss) { fx.number(m.x, yy, m.z, 'Miss', 'miss'); continue; }
      fx.number(m.x, yy, m.z, res.dmg, 'dealt');
      m.hit(res.dmg, d ? dx / d : 0, d ? dz / d : 1);
      m.knock.x *= 2; m.knock.z *= 2; // pushed back a little
      inflict(m, sk.status, lv);
    }
    return;
  }
  // ---- Magic Knight: Elemental Blade imbues the sword; again switches element (free while it lasts) ----
  if (id === 'elemblade') {
    const on = buffs.imbue > 0;
    if (!on && !pay()) return;
    if (on) skillCd[id] = sk.cd;
    imbueEl = on ? IMBUE[(IMBUE.indexOf(imbueEl) + 1) % IMBUE.length] : IMBUE[0];
    if (!on) buffs.imbue = sk.dur(lv);
    applyStats();
    say(`Blade: ${imbueEl[0].toUpperCase()}${imbueEl.slice(1)}`);
    fx.sparkle(player.x, y + 0.9, player.z, IMBUE_COL[imbueEl], 14);
    audio.play('craft');
    return;
  }
  // ---- Magic Knight: Elemental Nova, three waves of the blade's element rolling out around you ----
  if (id === 'nova') {
    if (!pay()) return;
    const el = bladeEl(), fxk = EDGE_FX[el], col = IMBUE_COL[el] || '#e8e0ff', st = fxk && { ...fxk, chance: sk.status.chance };
    const cx = player.x, cz = player.z;
    say('Elemental Nova');
    player.atkAnim = player.atkDur = 0.4;
    fx.puff(cx, y + 0.2, cz, 2.2);
    repeat(sk, lv, (i) => {
      const r = sk.areas[i], n = 10 + Math.round(r * 6), gy = world.heightAt(cx, cz);
      for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2; fx.sparkle(cx + Math.cos(a) * r, gy + 0.3, cz + Math.sin(a) * r, col, 1); }
      cam.shake = 0.2 + i * 0.08;
      audio.play('hit');
      for (const m of [...mobs.list]) {
        if (!m.alive || Math.hypot(m.x - cx, m.z - cz) > r + m.def.r) continue;
        inflict(m, st, lv, edgeHit(m, sk.power(lv) / 100, sk.mpower(lv) / 100, el));
      }
    });
    return;
  }
  // the rest aim at your current target, or the nearest monster
  const target = (player.goal?.mob?.alive && player.goal.mob) || mobs.nearest(player.x, player.z, 8);
  if (!target) { menus.message('No monster nearby'); return; }
  // ---- BladeMaster: Blade Dance, dashing from monster to monster, untouchable ----
  if (id === 'bladedance') {
    const run = (t) => {
      if (!t.alive || !pay()) return;
      say('Blade Dance');
      const cx = t.x, cz = t.z, n = sk.hits(lv), mult = sk.power(lv) / 100;
      player.iframes = Math.max(player.iframes, n * sk.every + 0.4);
      player.goal = null;
      let last = null;
      repeat(sk, lv, () => {
        const near = mobs.list.filter((m) => m.alive && Math.hypot(m.x - cx, m.z - cz) < sk.area + m.def.r);
        if (!near.length) return;
        const pool = near.length > 1 ? near.filter((m) => m !== last) : near;
        const m = pool[Math.floor(Math.random() * pool.length)];
        // appear at its side, coming from where you were
        const fx0 = { x: player.x, y: world.heightAt(player.x, player.z) + 0.8, z: player.z };
        let dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
        dx /= d; dz /= d;
        const gap = m.def.r + 0.5, px = m.x - dx * gap, pz = m.z - dz * gap;
        if (world.walkable(px, pz)) { player.x = px; player.z = pz; player.sync(); }
        player.face = { x: dx, z: dz };
        player.atkAnim = player.atkDur = 0.2;
        fx.zap(fx0, { x: player.x, y: world.heightAt(player.x, player.z) + 0.8, z: player.z }, '#ffffff');
        fx.slash(m.x, overHead(m, m.sprite.scale.y * 0.5), m.z, player.face, cam);
        bladeHit(m, mult);
        combo(m);
        last = m;
      });
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0.05, run, name: sk.name } });
    return;
  }
  // Thrust, Cleave and Heavy Strike: walk up and hit with the next swing. opts: el, defMul
  const strike = (mult, hitMult, done, opts = {}) => player.command({ mob: target, skill: { mult, hitMult, pay, done, ...opts } });
  // ---- Archer: Hunter's Mark (from bow range), Double Shot and Arrow Rain (with the next shot) ----
  if (id === 'huntmark') {
    const run = (t) => {
      if (!t.alive || !pay()) return;
      t.markT = skillClock + 10; t.markLv = lv;
      say("Hunter's Mark");
      fx.sparkle(t.x, overHead(t, t.sprite.scale.y * 0.9), t.z, '#ff5a4a', 12);
      fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8 + 0.3), t.z, 'Marked', 'miss');
      audio.play('craft');
      player.command({ mob: t });
    };
    player.command({ mob: target, spell: { range: Math.max(player.reach, BOW_RANGE), time: 0.05, run, name: sk.name } }); // from bow range, bow or not
    return;
  }
  if (id === 'doubleshot') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => { say('Double Shot'); later(sk.every, () => arrowHit(t, m)); });
  }
  // ---- Moon Ranger: from bow range (Star Sight reaches further), each arrow ATK and MATK together ----
  if (id === 'multishot' || id === 'starfall' || id === 'crescent') {
    // Starfall needs no bow: it always calls the stars down from bow range
    const far = (id === 'starfall' ? Math.max(player.reach, BOW_RANGE) : player.reach) + (id === 'crescent' ? 0 : 0.5 * skillLv(prog, 'starsight'));
    const cost = id === 'starfall' && nightUp ? Math.ceil(sp * (1 - 0.04 * skillLv(prog, 'lunartide'))) : sp;
    const paid = () => {
      if (player.sp < cost) { menus.message('Not enough SP'); return false; }
      player.sp -= cost;
      if (sk.cd) skillCd[id] = sk.cd;
      return true;
    };
    const run = (t) => {
      if (!t.alive || !paid()) return;
      say(sk.name);
      const k = moonSkill(), atk = sk.power(lv) / 100 * k, matk = sk.mpower(lv) / 100 * k;
      const from = () => ({ x: player.x + player.face.x * 0.4, y: world.heightAt(player.x, player.z) + 0.85, z: player.z + player.face.z * 0.4 });
      if (id === 'multishot') {
        const n = sk.arrows(lv) + (buffs.veil > 0 && nightUp ? 2 : 0);
        const near = mobs.list.filter((m) => m.alive && m !== t && Math.hypot(m.x - t.x, m.z - t.z) < 4).sort((a, b) => Math.hypot(a.x - t.x, a.z - t.z) - Math.hypot(b.x - t.x, b.z - t.z));
        const aims = [t, ...near].slice(0, n);
        for (let i = aims.length; i < n; i++) aims.push(t); // alone: the rest at the target too
        aims.forEach((m, i) => later(i * 0.05, () => { const f = from(); fx.bolt(f.x, f.y, f.z, m, '#dfe6ff', () => moonHit(m, atk, matk), 0.22); }));
        audio.play('swing');
      } else if (id === 'starfall') {
        const cx = t.x, cz = t.z;
        repeat(sk, lv, (i) => {
          const gy = world.heightAt(cx, cz);
          for (let j = 0; j < 5; j++) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * 2.4, spot = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, alive: true };
            fx.bolt(spot.x + 0.8, gy + 6, spot.z - 0.8, spot, j % 2 ? '#fff6c8' : '#c8d8ff', () => fx.sparkle(spot.x, gy + 0.3, spot.z, '#fff6c8', 4), 0.35);
          }
          later(0.42, () => {
            cam.shake = 0.12 + i * 0.02;
            audio.play('hit');
            for (const m of [...mobs.list]) if (m.alive && Math.hypot(m.x - cx, m.z - cz) < sk.area + m.def.r) inflict(m, sk.status, lv, moonHit(m, atk, matk));
          });
        });
      } else { // Crescent Arrow: through the target, 8 paces in a line
        const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
        const f = from(), end = { x: player.x + ux * 8, y: f.y, z: player.z + uz * 8 };
        fx.zap(f, end, '#e8eeff');
        for (let j = 1; j <= 8; j++) fx.sparkle(player.x + ux * j, f.y, player.z + uz * j, j % 2 ? '#c8d8ff' : '#ffffff', 2);
        cam.shake = 0.15;
        audio.play('hit');
        for (const m of [...mobs.list]) {
          if (!m.alive) continue;
          const px = m.x - player.x, pz = m.z - player.z, along = px * ux + pz * uz, off = Math.abs(px * uz - pz * ux);
          if (along > -0.3 && along < 8 + m.def.r && off < 0.7 + m.def.r) moonHit(m, atk, matk);
        }
      }
      player.command({ mob: t }); // and keep shooting
    };
    player.command({ mob: target, spell: { range: far, time: 0, run, name: sk.name } });
    return;
  }
  // ---- Windrunner: Hurricane Volley (a stream of arrows), Cyclone Arrow (a whirlwind where it lands) ----
  if (id === 'volley') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => { say('Hurricane Volley'); repeat(sk, lv, (i) => { if (i && t.alive) arrowHit(t, m, null, 0.15); }); });
  }
  if (id === 'cyclone') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Cyclone Arrow');
      const cx = t.x, cz = t.z;
      repeat(sk, lv, (i) => {
        const gy = world.heightAt(cx, cz), n = 14;
        for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + i * 0.7, r = 0.6 + ((j * 7) % 5) * 0.4; fx.sparkle(cx + Math.cos(a) * r, gy + 0.2 + (j % 4) * 0.35, cz + Math.sin(a) * r, j % 3 ? '#bff4dc' : '#ffffff', 1); }
        if (i === 0) fx.puff(cx, gy + 0.2, cz, 1.6);
        audio.play('swing');
        for (const o of [...mobs.list]) {
          if (!o.alive) continue;
          const dx = cx - o.x, dz = cz - o.z, d = Math.hypot(dx, dz);
          if (d > sk.area + o.def.r) continue;
          const res = playerAttack(player.ps, o.effDef(), m * player.atkMul * bowMul(o), 1, true);
          const yy = overHead(o, o.sprite.scale.y * 0.8);
          if (res.miss) { fx.number(o.x, yy, o.z, 'Miss', 'miss'); continue; }
          fx.number(o.x, yy, o.z, res.dmg, res.el > 1 ? 'crit' : 'dealt');
          o.hit(res.dmg, 0, 0);
          if (!o.def.boss && !o.def.mvp && d > 0.5) { // pulled into the eye of the wind
            const k = Math.min(0.35, d - 0.4), nx = o.x + (dx / d) * k, nz = o.z + (dz / d) * k;
            if (world.walkable(nx, nz)) { o.x = nx; o.z = nz; }
          }
          inflict(o, sk.status, lv, res.dmg);
        }
      });
    });
  }
  if (id === 'arrowrain') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Arrow Rain');
      const cx = t.x, cz = t.z, gy = world.heightAt(cx, cz);
      for (let i = 0; i < 10; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 2.3; fx.sparkle(cx + Math.cos(a) * r, gy + 0.2, cz + Math.sin(a) * r, '#efe2c0', 1); }
      for (const o of [...mobs.list]) {
        if (!o.alive || o === t || Math.hypot(o.x - cx, o.z - cz) > 2.5 + o.def.r) continue;
        arrowHit(o, m, { x: o.x + (Math.random() - 0.5) * 0.4, y: overHead(o, 4), z: o.z + (Math.random() - 0.5) * 0.4 }, 0.6);
      }
      if (t.alive) { t.knock.x *= 1.5; t.knock.z *= 1.5; }
    });
  }
  if (id === 'thrust') strike(1.25, 1, (t) => { say('Thrust'); combo(t); });
  if (id === 'cleave') {
    strike(sk.power(lv) / 100, 1, (t) => {
      say('Cleave');
      combo(t);
      // the sweep catches monsters beside the target
      for (const m of [...mobs.list]) {
        if (!m.alive || m === t || Math.hypot(m.x - t.x, m.z - t.z) > 1.7 + m.def.r) continue;
        const r = playerAttack(player.ps, m.effDef(), sk.power(lv) / 200 * player.atkMul, 1, true);
        const yy = overHead(m, m.sprite.scale.y * 0.8);
        if (r.miss) { fx.number(m.x, yy, m.z, 'Miss', 'miss'); continue; }
        fx.number(m.x, yy, m.z, r.dmg, 'dealt');
        const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
        m.hit(r.dmg, dx / d, dz / d);
      }
    });
  }
  if (id === 'heavy') strike(sk.power(lv) / 100, 1 + (3 * lv) / 100, (t) => { say('Heavy Strike'); combo(t); });
  // ---- BladeMaster ----
  if (id === 'twinfang') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Twin Fang');
      combo(t);
      setTimeout(() => { if (t.alive) { bladeHit(t, m); combo(t); } }, 160); // the second cut
    });
  }
  if (id === 'pierce') { // three thrusts: the first lands with the swing, the others right behind it
    strike(sk.power(lv) / 100, 1, (t) => {
      say('Piercing Edge');
      combo(t);
      repeat(sk, lv, (i) => { if (i && t.alive) bladeHit(t, sk.power(lv) / 100, { defMul: 0.5 }); });
    }, { defMul: 0.5 });
  }
  if (id === 'finalblade') {
    const stacks = momentum;
    const cut = sk.power(lv, stacks) / 100;
    strike(cut, 1, (t) => { // a flurry of cuts: the first with the swing, the rest a blur behind it
      say(stacks ? `Final Blade ×${stacks}` : 'Final Blade');
      momentum = 0; buffs.momentum = 0;
      cam.shake = 0.25;
      repeat(sk, lv, (i) => {
        if (!i || !t.alive) return;
        bladeHit(t, cut);
        fx.slash(t.x, overHead(t, t.sprite.scale.y * 0.5), t.z, { x: Math.cos(i * 2.1), z: Math.sin(i * 2.1) }, cam);
        if (i === sk.hits(lv) - 1) cam.shake = 0.3;
      });
    });
  }
  // ---- Magic Knight: Elemental Edge, two cuts of ATK and MATK together in the blade's element ----
  if (sk.edge) {
    const el = bladeEl(), fxk = EDGE_FX[el], col = IMBUE_COL[el] || '#e8e0ff';
    const chain = skillLv(prog, 'elemchain'), chained = chain && el && lastEdge.el && lastEdge.el !== el && skillClock - lastEdge.t < 6;
    const k = chained ? 1 + 0.06 * chain : 1, st = fxk && { ...fxk, chance: sk.status.chance };
    strike(sk.power(lv) / 100 * k, 1, (t) => {
      say(chained ? `${sk.name} · Chain` : sk.name);
      lastEdge.el = el; lastEdge.t = skillClock;
      if (chained) player.healSp(3);
      const magic = (m, share) => { // the MATK half of a cut
        if (!m.alive) return 0;
        const r = magicAttack(player.ps, m.effDef(), sk.mpower(lv) / 100 * k * share, el || 'neutral');
        fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.25), m.z, r.dmg, r.el > 1 ? 'crit' : 'dealt');
        m.hit(r.dmg, 0, 0);
        return r.dmg;
      };
      repeat(sk, lv, (i) => { // the first cut lands with the swing, the second right behind it
        if (!t.alive) return;
        const d = (i ? (bladeHit(t, sk.power(lv) / 100 * k, { el }).dmg || 0) : 0) + magic(t, 1);
        fx.sparkle(t.x, world.heightAt(t.x, t.z) + 0.6, t.z, col, 8);
        inflict(t, st, lv, d);
        if (el !== 'wind') return;
        fx.zap({ x: t.x, y: overHead(t, 2.4), z: t.z }, { x: t.x, y: overHead(t, 0.4), z: t.z }, col);
        for (const m of [...mobs.list]) { // Wind: it crackles into the monsters beside the target for half
          if (!m.alive || m === t || Math.hypot(m.x - t.x, m.z - t.z) > 1.7 + m.def.r) continue;
          const r = playerAttack({ ...player.ps, el }, m.effDef(), sk.power(lv) / 200 * k * player.atkMul, 1, true);
          if (!r.miss) { fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, r.dmg, 'dealt'); m.hit(r.dmg, 0, 0); }
          magic(m, 0.5);
          inflict(m, st, lv, r.dmg || 0);
        }
      });
    }, { el: el || undefined });
  }
}

// Elemental Blade: the element the sword is imbued with, while buffs.imbue lasts. Normal attacks,
// Elemental Edge and Elemental Nova all take it (none without it)
const IMBUE = ['fire', 'water', 'wind', 'earth'];
let imbueEl = null;
const bladeEl = () => (buffs.imbue > 0 && imbueEl) || null;
// a Magic Knight blow: ATK and MATK together, in an element; the total shows as one number
function edgeHit(m, atkMult, matkMult, el) {
  if (!m.alive) return 0;
  const md = m.effDef();
  const r = playerAttack(el ? { ...player.ps, el } : player.ps, md, atkMult * player.atkMul, 1, true);
  const g = magicAttack(player.ps, md, matkMult, el || 'neutral');
  const dmg = (r.miss ? 0 : r.dmg) + g.dmg;
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, dmg, g.el > 1 ? 'crit' : 'dealt');
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  m.hit(dmg, dx / d * 0.5, dz / d * 0.5);
  return dmg;
}
// one more arrow at a monster (Double Shot's second, Arrow Rain's): it flies from `from` (else the
// hero's bow) and the hit is rolled when it lands; push = how hard it pushes the monster back
function arrowHit(t, mult, from, push = 0.4, then = null) {
  if (!t.alive) return;
  const f = from || { x: player.x + player.face.x * 0.4, y: world.heightAt(player.x, player.z) + 0.85, z: player.z + player.face.z * 0.4 };
  audio.play('swing');
  fx.bolt(f.x, f.y, f.z, t, player.arrowCol, () => {
    if (!t.alive) return;
    const res = playerAttack(player.ps, t.effDef(), mult * player.atkMul * bowMul(t), 1, true);
    const yy = overHead(t, t.sprite.scale.y * 0.8);
    if (res.miss) { fx.number(t.x, yy, t.z, 'Miss', 'miss'); return; }
    fx.number(t.x, yy, t.z, res.dmg, res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
    const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1;
    t.hit(res.dmg, dx / d * push, dz / d * push);
    audio.play('hit');
    arrowLanded();
    then?.(res);
  }, 0.2);
}
// a Moon Ranger's arrow: ATK and MATK together, in the arrows' element, shown as one number;
// returns the damage done
function moonHit(m, atkMult, matkMult) {
  if (!m.alive) return 0;
  const md = m.effDef(), el = player.ps.el;
  const r = playerAttack(player.ps, md, atkMult * player.atkMul * bowMul(m), 1, true);
  const g = magicAttack(player.ps, md, matkMult, el || 'neutral');
  const dmg = (r.miss ? 0 : r.dmg) + g.dmg;
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, dmg, g.el > 1 ? 'crit' : g.el < 1 ? 'miss' : 'dealt');
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  m.hit(dmg, dx / d * 0.3, dz / d * 0.3);
  arrowLanded();
  return dmg;
}
// one more blade hit on a monster (Twin Fang's second cut, a Combo): a skill hit, so no crit
function bladeHit(t, mult, opts = {}) {
  if (!t.alive) return { miss: true, dmg: 0 };
  const md = opts.defMul !== undefined ? { ...t.effDef(), def: t.effDef().def * opts.defMul } : t.effDef();
  const res = playerAttack(opts.el ? { ...player.ps, el: opts.el } : player.ps, md, mult * player.atkMul, 1, true);
  const yy = overHead(t, t.sprite.scale.y * 0.8);
  if (res.miss) { fx.number(t.x, yy, t.z, 'Miss', 'miss'); return res; }
  fx.number(t.x, yy, t.z, res.dmg, 'dealt');
  const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1;
  t.hit(res.dmg, dx / d, dz / d);
  audio.play('hit');
  return res;
}
// Combo Edge: a blade skill may chain a free extra strike, and each Combo stacks Momentum
function combo(t) {
  const lv = skillLv(prog, 'comboedge');
  if (!lv || weaponKind() !== 'sword' || Math.random() >= 0.04 * lv) return;
  setTimeout(() => {
    if (!t.alive) return;
    fx.number(player.x, overHead(player, 1.9), player.z, 'Combo!', 'skill');
    bladeHit(t, 1);
    if (skillLv(prog, 'momentum')) { momentum = Math.min(5, momentum + 1); buffs.momentum = 8; }
  }, 260);
}

// ---------- spells: stand still, chant (the cast bar), then the magic flies ----------
const IMBUE_COL = { fire: '#ff7a2a', water: '#9fe0ff', wind: '#fff27a', earth: '#c8a06a' };
const SPELL_COL = { spark: '#ff7a2a', frost: '#9fe0ff', arc: '#fff27a', flamering: '#ff6a1a', stonespike: '#c8a06a', quake: '#b9874f',
  meteor: '#ff5a1a', stormgust: '#bfefff', thunder: '#fff27a' };
// the Wizard's passives for one cast: Attunement always, Resonance when the element changed
function castMul(element) {
  let k = 1 + 0.03 * skillLv(prog, 'attune');
  const res = skillLv(prog, 'resonance');
  if (res && lastSpell.el && lastSpell.el !== element && skillClock - lastSpell.t < 8) k *= 1 + 0.06 * res;
  lastSpell.el = element; lastSpell.t = skillClock;
  return k;
}
function spellHit(m, mult, element) {
  if (!m.alive) return null;
  const staff = ITEMS[inv.gear.weapon];
  if (staff?.kind === 'staff' && staff.el && staff.el === element) mult *= 1.15; // an elemental staff feeds its own spells
  if (m.shatterT > skillClock && element !== 'earth') { mult *= 1.3; m.shatterT = 0; } // Stone Spike's Shatter
  const md = m.effDef(), attune = skillLv(prog, 'attune');
  if (attune && elementMod(element, md.el) > 1) mult *= 1 + 0.03 * attune; // Attunement: harder still on a weakness
  const res = magicAttack(player.ps, md, mult, element);
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  // the right element hits hard (gold), the wrong one barely scratches (grey)
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, res.dmg, res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
  if (res.el < 1) weakTip(m, element);
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
      const k = castMul(sk.magic);
      cam.shake = 0.25;
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        fx.sparkle(player.x + Math.cos(a) * 2.2, y() + 0.3, player.z + Math.sin(a) * 2.2, SPELL_COL.flamering, 2);
      }
      fx.puff(player.x, y() + 0.2, player.z, 1.6);
      for (const m of [...mobs.list]) if (m.alive && Math.hypot(m.x - player.x, m.z - player.z) < 2.8 + m.def.r) { const r = spellHit(m, sk.power(lv) / 100 * k, sk.magic); if (r) inflict(m, sk.status, lv, r.dmg); }
    }, null, sk.name);
    return;
  }
  const target = (player.goal?.mob?.alive && player.goal.mob) || (player.cast?.target?.alive && player.cast.target) || mobs.nearest(player.x, player.z, 9);
  if (!target) { menus.message('No monster nearby'); return; }
  const run = (t) => {
    if (!t.alive || !pay()) return;
    say();
    const k = castMul(sk.magic);
    const from = { x: player.x + player.face.x * 0.4, y: y() + 1.0, z: player.z + player.face.z * 0.4 };
    // the Wizard's area spells: everything within r paces of (cx, cz); then(m, res) for each one hit
    const around = (cx, cz, mult, then, r = 3) => {
      for (const m of [...mobs.list]) if (m.alive && Math.hypot(m.x - cx, m.z - cz) < r + m.def.r) { const res = spellHit(m, mult * k, sk.magic); if (res) then?.(m, res); }
    };
    const burst = (cx, cz, n = 18) => {
      const gy = world.heightAt(cx, cz);
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = 1 + Math.random() * 2; fx.sparkle(cx + Math.cos(a) * r, gy + 0.3, cz + Math.sin(a) * r, SPELL_COL[id], 2); }
      fx.puff(cx, gy + 0.2, cz, 1.4);
    };
    // area spells strike again and again where the target stood; the ground shows the area while it lasts
    if (sk.hits && sk.target === 'mob' && id !== 'frost') {
      const cx = t.x, cz = t.z, mult = sk.power(lv) / 100;
      fx.warn(cx, cz, 3, sk.hits(lv) * sk.every + 0.3, SPELL_COL[id]);
      const caught = new Map(); // Storm Gust: gusts each monster has taken
      repeat(sk, lv, (i) => {
        const gy = world.heightAt(cx, cz);
        if (id === 'quake') { // a shock: the ground jumps
          cam.shake = 0.3;
          burst(cx, cz, 20);
          around(cx, cz, mult, (m) => inflict(m, sk.status, lv));
        }
        if (id === 'stormgust') { // a gust of the blizzard swirls round the area
          for (let j = 0; j < 10; j++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 3; fx.sparkle(cx + Math.cos(a) * r, gy + 0.3 + Math.random() * 1.5, cz + Math.sin(a) * r, SPELL_COL.stormgust, 1); }
          if (i % 3 === 0) fx.puff(cx, gy + 0.4, cz, 1.6);
          around(cx, cz, mult, (m) => { const n = (caught.get(m) || 0) + 1; caught.set(m, n); if (n >= 3) inflict(m, sk.status, lv); });
        }
        if (id === 'thunder') { // a wave of lightning: on every monster in the area, and a few strays
          const at = (x, z) => ({ x, y: world.heightAt(x, z) + 0.4, z });
          for (const m of mobs.list) if (m.alive && Math.hypot(m.x - cx, m.z - cz) < 3 + m.def.r) fx.zap({ x: m.x, y: world.heightAt(m.x, m.z) + 5, z: m.z }, at(m.x, m.z), SPELL_COL.thunder);
          for (let j = 0; j < 2; j++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 3, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; fx.zap({ x, y: world.heightAt(x, z) + 5, z }, at(x, z), SPELL_COL.thunder); }
          around(cx, cz, mult, (m) => inflict(m, sk.status, lv));
        }
        if (id === 'meteor') { // a meteor falls from the sky on a random spot in the area
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 2.5, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
          const spot = { x, z, alive: true };
          fx.bolt(x + 1.5, world.heightAt(x, z) + 7, z - 1.5, spot, SPELL_COL.meteor, () => {
            burst(x, z, 14);
            cam.shake = 0.25;
            around(x, z, mult, (m, res) => inflict(m, sk.status, lv, res.dmg), 1.7);
          }, 0.9);
        }
      });
      return;
    }
    if (id === 'arc') { // strikes at once, then leaps to two more
      const at = (m) => ({ x: m.x, y: world.heightAt(m.x, m.z) + 0.5, z: m.z });
      fx.zap(from, at(t), SPELL_COL.arc);
      spellHit(t, sk.power(lv) / 100 * k, sk.magic);
      const near = mobs.list.filter((m) => m.alive && m !== t && Math.hypot(m.x - t.x, m.z - t.z) < 3.2)
        .sort((a, b) => Math.hypot(a.x - t.x, a.z - t.z) - Math.hypot(b.x - t.x, b.z - t.z)).slice(0, 2);
      for (const m of near) { fx.zap(at(t), at(m), SPELL_COL.arc); if (spellHit(m, sk.power(lv) / 200 * k, sk.magic)) inflict(m, sk.status, lv); }
      if (t.alive) inflict(t, sk.status, lv);
      return;
    }
    if (id === 'frost') { // shards of ice rain on the monster one after another
      repeat(sk, lv, () => {
        if (!t.alive) return;
        const ty = world.heightAt(t.x, t.z);
        fx.bolt(t.x + (Math.random() - 0.5) * 0.6, ty + 4.5, t.z + (Math.random() - 0.5) * 0.6, t, SPELL_COL.frost, () => {
          spellHit(t, sk.power(lv) / 100 * k, sk.magic);
          fx.sparkle(t.x, world.heightAt(t.x, t.z) + 0.5, t.z, SPELL_COL.frost, 4);
        }, 0.45);
      });
      return;
    }
    fx.bolt(from.x, from.y, from.z, t, SPELL_COL[id], () => {
      const base = sk.power(lv) / 100;
      const res = spellHit(t, base * k, sk.magic);
      if (res && id === 'stonespike' && t.alive) { t.shatterT = skillClock + 6; fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8 + 0.3), t.z, 'Shattered', 'miss'); }
      const ty = world.heightAt(t.x, t.z) + 0.5;
      fx.sparkle(t.x, ty, t.z, SPELL_COL[id], 8);
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
  skillClock += dt;
  for (let i = timers.length - 1; i >= 0; i--) {
    if (timers[i].at > skillClock) continue;
    const t = timers.splice(i, 1)[0];
    if (t.map === world.id) t.fn();
  }
  for (const m of mobs.list) { // burning monsters
    if (!m.alive || !(m.burnT > 0)) continue;
    m.burnT -= dt;
    m.burnTick -= dt;
    if (m.burnTick > 0) continue;
    m.burnTick = 1;
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, m.burnDmg, 'dealt');
    fx.sparkle(m.x, overHead(m, m.sprite.scale.y * 0.4), m.z, '#ff7a2a', 4);
    m.hit(m.burnDmg, 0, 0);
  }
  for (const k in skillCd) skillCd[k] -= dt;
  for (const k in buffs) {
    if (buffs[k] <= 0) continue;
    buffs[k] -= dt;
    if (buffs[k] <= 0 && k === 'aspd') { applyStats(); menus.message('The Speed Potion wears off'); }
    if (buffs[k] <= 0 && k === 'momentum') momentum = 0;
    if (buffs[k] <= 0 && k === 'imbue') { imbueEl = null; applyStats(); menus.message('Your blade loses its element'); }
    if (buffs[k] <= 0 && k === 'aegis') { player.barrier = 0; applyStats(); }
    if (buffs[k] <= 0 && ['focus', 'tailwind', 'rush', 'gust', 'frenzy'].includes(k)) applyStats();
    if (buffs[k] <= 0 && k === 'rhythm') { galeStacks = 0; applyStats(); }
  }
  if (buffs.aegis > 0 && player.barrier <= 0) { buffs.aegis = 0; applyStats(); menus.message('Stone Aegis breaks'); }
  if (player.endureT <= 0) endureGuard = 0;
  player.guard = Math.max(endureGuard, buffs.ward > 0 ? wardLv * 0.02 : 0, buffs.veil > 0 ? veilLv * 0.04 : 0);
  // the moon rises and sets: the Moon Ranger's night passives follow it
  if (!!dayNight.isNight !== nightUp) {
    nightUp = !!dayNight.isNight;
    applyStats();
    if (skillLv(prog, 'moonlit')) menus.message(nightUp ? 'The moon is up: Moonlit Hunter wakes.' : 'The moon sets: Moonlit Hunter sleeps.');
  }
  moonMark.classList.toggle('on', nightUp && skillLv(prog, 'moonlit') > 0 && player.state !== 'down');
  player.steady = buffs.ward > 0;
  const low = player.hp < player.maxHp * 0.25 && skillLv(prog, 'laststand');
  player.atkMul = (buffs.warcry > 0 ? 1 + warcryLv / 100 : 1) * (low ? 1.15 : 1) * (1 + momentum * skillLv(prog, 'momentum') / 100);
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
  const consider = (hit, x, y, h, z, bias = 1, fs = [0.15, 0.55]) => {
    for (const f of fs) {
      const d = screenDist(cx, cy, x, y + h * f, z) * bias;
      if (d < bd) { bd = d; best = hit; }
    }
  };
  for (const m of mobs.list) if (m.alive) consider({ mob: m }, m.x, m.sprite.position.y, m.sprite.scale.y * 0.8, m.z, 0.8);
  for (const p of fx.pickups) consider({ item: p }, p.x, p.s.position.y, 0.5, p.z);
  // people are picked at their feet, middle and the ! or ? bubble over their head
  for (const sp of SPOTS) if (sp.map === world.id) consider({ spot: sp }, sp.x, world.heightAt(sp.x, sp.z), sp.h, sp.z, 1, sp.npc ? [0.15, 0.55, 1.12] : undefined);
  return best;
}
function tap(cx, cy) {
  if (player.state === 'down') return;
  stopNav(); // taking the reins again
  const hit = pick(cx, cy);
  if (hit?.mob) player.command({ mob: hit.mob });
  else if (hit?.item) {
    const p = hit.item;
    player.command({ x: p.tx, z: p.tz, reach: 0.7, arrive: () => { if (fx.pickups.includes(p) && collect(p)) fx.take(p); } }); // where it lands
  } else if (hit?.spot) {
    const sp = hit.spot;
    player.command({ x: sp.x, z: sp.z, reach: 1.7, arrive: sp.run });
  } else walkTo(cx, cy, true);
}
// walk to the ground under a screen point (mark: show the tile marker)
function walkTo(cx, cy, mark) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const at = ray.intersectObject(world.terrain)[0]?.point;
  if (!at) return;
  const [i, j] = player.tiles.nearestFree(...player.tiles.tileAt(at.x, at.z)) || [];
  if (i === undefined) return;
  if (mark) fx.tileMark(i, j);
  if (player.goal && !player.goal.mob && Math.hypot(player.goal.x - (i + 0.5), player.goal.z - (j + 0.5)) < 0.01) return; // already going there
  player.command({ x: i + 0.5, z: j + 0.5, reach: 0.05 });
}
// holding a finger (or the mouse button) on the ground: keep walking towards it
let holdT = 0;
function holdWalk(dt) {
  const h = input.held();
  if (!h || player.state === 'down') { holdT = 0; return; }
  stopNav();
  holdT -= dt;
  if (holdT > 0) return;
  holdT = 0.16;
  walkTo(h.x, h.y, false);
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
  spT += dt * fast * (nightUp ? 1 + 0.1 * skillLv(prog, 'lunartide') : 1); // Lunar Tide
  // resting (sitting, or in a town) also gives back a share of the whole bar, so a full rest takes
  // about a minute at any level instead of minutes early on
  if (hpT >= 6) { hpT -= 6; player.heal(player.ps.hpRegen + (resting ? Math.ceil(player.maxHp * 0.05) : 0)); }
  if (spT >= 8) { spT -= 8; player.healSp(player.ps.spRegen + skillLv(prog, 'manawell') + (resting ? Math.ceil(player.maxSp * 0.06) : 0)); }
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
  const isle = raidOf(world.id), at = isle ? boatSpot(isle) : player; // a run is never saved: back on the shore
  writeSave({ story: story.toJSON(), look: player.look, visited: [...visited], keepers: [...keepers], savePoint, raidAt, map: isle ? isle.from : world.id, mvpAt: mobs.mvpAt, bossHp: mobs.bossSnapshot(), x: at.x, z: at.z, yaw: cam.yaw, dist: cam.dist, hp: player.hp, sp: player.sp, inv: inv.toJSON(), prog: prog.toJSON(), quests: quests.toJSON(), hotbar: hotbar.toJSON(), time: dayNight.t });
  writeStorage(inv.chest.toJSON());
}

// second jobs glow: a soft aura behind the hero and a ring at their feet, in the job's colour
const AURA = { blademaster: '#ff7a4a', wizard: '#b48aff', magicknight: '#6ad8ff', windrunner: '#8af0c8', moonranger: '#b8c8ff', beastmaster: '#ff9a5a' };
// a small moon by the hotbar while the Moon Ranger's night passives work
// ---------- the buff bar: what is on the hero, with the time left; hold an icon for what it does ----------
const buffBar = document.createElement('div');
buffBar.id = 'buffbar';
buffBar.className = 'ui-click';
document.getElementById('hud').appendChild(buffBar);
const buffTip = document.createElement('div');
buffTip.id = 'bufftip';
buffTip.hidden = true;
document.getElementById('hud').appendChild(buffTip);
// every buff showing now: { key, icon, name, left (s), stacks, fx: its effect in a few words }
function buffList() {
  const out = [];
  const sk = (key, id, left, fx) => SKILLS[id] && out.push({ key, icon: SKILLS[id].icon, name: SKILLS[id].name, left, fx });
  const lvOf = (id) => skillLv(prog, id);
  if (buffs.warcry > 0) sk('warcry', 'warcry', buffs.warcry, `ATK +${warcryLv}%`);
  if (player.endureT > 0 && endureFrom) sk('endure', endureFrom, player.endureT, `Damage taken −${Math.round(endureGuard * 100)}% · no flinching`);
  if (buffs.ward > 0) sk('ward', 'ward', buffs.ward, `Damage taken −${2 * wardLv}% · casting can't be broken`);
  if (buffs.aegis > 0) sk('aegis', 'aegis', buffs.aegis, `Barrier ${Math.ceil(player.barrier)} · DEF +${aegisLv}`);
  if (buffs.focus > 0) sk('focus', 'focus', buffs.focus, `FNS +${focusLv} · QKN +${focusLv}`);
  if (buffs.tailwind > 0) sk('tailwind', 'tailwind', buffs.tailwind, `Bow attack speed +${2 * tailLv}%`);
  if (buffs.rush > 0) out.push({ key: 'rush', icon: SKILLS.tailwind.icon, name: 'Tailwind Rush', left: buffs.rush, fx: 'Walk speed +30%' });
  if (buffs.gust > 0) sk('gust', 'galestep', buffs.gust, `Walk speed +${gustHaste}%`);
  if (buffs.rhythm > 0 && galeStacks) { sk('rhythm', 'galerhythm', buffs.rhythm, `Bow attack speed +${lvOf('galerhythm') * galeStacks}%`); out.at(-1).stacks = galeStacks; }
  if (buffs.veil > 0) sk('veil', 'moonveil', buffs.veil, `Damage taken −${4 * veilLv}%${nightUp ? ' · Multishot +2 arrows' : ''}`);
  if (buffs.frenzy > 0) sk('frenzy', 'packfrenzy', buffs.frenzy, `Beasts: attack speed +${3 * frenzyLv}% · damage +${3 * frenzyLv}%`);
  if (buffs.imbue > 0 && imbueEl) sk('imbue', 'elemblade', buffs.imbue, `Element: ${imbueEl[0].toUpperCase()}${imbueEl.slice(1)}`);
  if (buffs.momentum > 0 && momentum) { sk('momentum', 'momentum', buffs.momentum, `ATK +${momentum * lvOf('momentum')}%`); out.at(-1).stacks = momentum; }
  if (buffs.aspd > 0) out.push({ key: 'aspd', icon: 'quick', name: ITEMS.quick.name, left: buffs.aspd, fx: 'Attack speed +10%' });
  return out;
}
const buffTime = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${Math.ceil(s)}s`);
let buffHeld = null, buffHoldT = 0, buffShown = '';
function drawBuffs() {
  const list = started ? buffList() : [];
  const sig = list.map((b) => `${b.key}:${b.stacks || ''}`).join(',');
  if (sig !== buffShown) { // the icons change only when a buff comes or goes; the timers every tick
    buffShown = sig;
    buffBar.innerHTML = list.map((b) => `<div class="buff" data-buff="${b.key}"><img src="${iconURL(b.icon)}" alt="">${b.stacks ? `<b>${b.stacks}</b>` : ''}<span></span></div>`).join('');
  }
  for (const b of list) {
    const el = buffBar.querySelector(`[data-buff="${b.key}"]`);
    if (el) { el.lastChild.textContent = buffTime(b.left); el.classList.toggle('ending', b.left < 5); }
  }
  const held = buffHeld && list.find((b) => b.key === buffHeld);
  if (!held) { buffTip.hidden = true; return; }
  buffTip.hidden = false;
  buffTip.innerHTML = `<b>${esc(held.name)}${held.stacks ? ` ×${held.stacks}` : ''}</b><span>${esc(held.fx)}</span>`;
  const r = buffBar.querySelector(`[data-buff="${held.key}"]`)?.getBoundingClientRect();
  if (r) { buffTip.style.top = `${r.bottom + 6}px`; buffTip.style.left = `${Math.max(8, Math.min(window.innerWidth - buffTip.offsetWidth - 8, r.left + r.width / 2 - buffTip.offsetWidth / 2))}px`; }
}
setInterval(drawBuffs, 200);
// hold an icon (or point at it with a mouse) for what it does
const buffAt = (e) => e.target.closest?.('.buff')?.dataset.buff || null;
buffBar.addEventListener('pointerdown', (e) => {
  const k = buffAt(e);
  if (!k) return;
  clearTimeout(buffHoldT);
  if (e.pointerType === 'mouse') { buffHeld = k; drawBuffs(); return; }
  buffHoldT = setTimeout(() => { buffHeld = k; drawBuffs(); }, 300);
});
buffBar.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse' && buffAt(e)) { buffHeld = buffAt(e); drawBuffs(); } });
buffBar.addEventListener('pointerout', (e) => { if (e.pointerType === 'mouse') { buffHeld = null; drawBuffs(); } });
for (const ev of ['pointerup', 'pointercancel']) window.addEventListener(ev, (e) => { if (e.pointerType !== 'mouse') { clearTimeout(buffHoldT); buffHeld = null; drawBuffs(); } });
buffBar.addEventListener('contextmenu', (e) => e.preventDefault());

const moonMark = document.createElement('div');
moonMark.id = 'moonmark';
moonMark.title = 'Moonlit Hunter: the moon is up';
document.body.appendChild(moonMark);
const aura = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.45, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.renderOrder = 1;
  s.visible = false;
  scene.add(s);
  // and a glowing ring on the ground at the hero's feet
  const r = document.createElement('canvas');
  r.width = r.height = 64;
  const rg = r.getContext('2d'), ring = rg.createRadialGradient(32, 32, 10, 32, 32, 31);
  ring.addColorStop(0, 'rgba(255,255,255,0)'); ring.addColorStop(0.55, 'rgba(255,255,255,.18)'); ring.addColorStop(0.8, 'rgba(255,255,255,.75)'); ring.addColorStop(1, 'rgba(255,255,255,0)');
  rg.fillStyle = ring; rg.fillRect(0, 0, 64, 64);
  const geo = new THREE.PlaneGeometry(1.5, 1.5);
  geo.rotateX(-Math.PI / 2);
  s.userData.ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(r), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  s.userData.ring.visible = false;
  scene.add(s.userData.ring);
  return s;
})();
function tickAura(dt, t, b) {
  const col = AURA[prog.job];
  const ring = aura.userData.ring;
  aura.visible = ring.visible = !!col && player.state !== 'down' && started;
  if (!aura.visible) return;
  aura.material.color.set(col);
  ring.material.color.set(col);
  const y = world.heightAt(player.x, player.z);
  aura.position.set(player.x - b.fx * 0.35, y + 0.62, player.z - b.fz * 0.35); // just behind the hero
  const k = 1.45 + Math.sin(t * 2.6) * 0.07;
  aura.scale.set(k, k * 1.25, 1);
  aura.material.opacity = 0.55 + Math.sin(t * 2.6) * 0.12;
  ring.position.set(player.x, y + 0.04, player.z);
  ring.scale.setScalar(1 + Math.sin(t * 2.6) * 0.05);
  ring.material.opacity = 0.7 + Math.sin(t * 2.6) * 0.15;
  ring.rotation.y = t * 0.6;
}

const clock = new THREE.Clock();
let started = false;
let stepT = 0;
const tmpV = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame); // first: an error in one frame must never stop the game
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const c = input.consumeCamera(dt);
  cam.yaw += c.yaw;
  cam.dist = clamp(cam.dist + c.zoom, 7, 20);

  const b = camBasis();
  // windows never pause the game, like Ragnarok
  for (const w of ['items', 'equip', 'skills', 'status', 'settings']) if (input.tapped(w) && started) menus.toggle(w);
  if (input.tapped('close')) { if (bigmap.open) bigmap.close(); else menus.close(); }
  bigmap.update(dt);
  const live = started;
  const clicks = input.takeClicks();
  if (live) for (const c of clicks) tap(c.x, c.y);
  if (live) holdWalk(dt);

  player.update(live ? dt : 0, b, mobs);
  if (live && player.moving && player.state === 'normal') {
    stepT -= dt;
    if (stepT <= 0) { stepT = 1.4 / player.walkSpeed(); audio.play('step'); } // a footstep every 1.4 tiles
  }
  audio.update(dt, dayNight.night);
  if (!started) cam.yaw += dt * 0.05; // slow orbit behind the title screen
  mobs.cam = b;
  allies.cam = b;
  if (live) mobs.update(dt, player);
  if (live) allies.update(dt, player, mobs, player.goal?.mob || player.cast?.target);
  if (live) dayNight.update(dt, t); else if (!started) dayNight.update(0, t);
  world.update(dt, t);
  villagers.update(dt, player, b);
  if (live) fx.update(dt);
  if (live) { naturalRegen(dt); tickSkills(dt); checkPortals(); tickNav(); tickQuestWorld(dt); }
  if (live) tickWading(dt);
  if (live) tickVigil(dt);
  if (live) tickRaid(dt);
  dressPeople();
  tickAura(dt, t, b);
  updateCastBar();
  hotbar.update();
  world.updateOcclusion(player.x, player.z, b, player.goal?.mob?.alive ? player.goal.mob : null);

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

  if (live) mobLabels();
  wings.set(inv.gear.wings); // the Wings slot: wings on the back, or a light at the shoulder
  wings.update(dt, player, camera, t, world.heightAt(player.x, player.z));
  renderer.render(scene, camera);
}

// monster names, like Ragnarok: over the one the mouse is on, and over the one you are fighting
const labelEls = { hover: document.querySelector('#moblabels .hover'), target: document.querySelector('#moblabels .target') };
function mobLabels() {
  const target = player.goal?.mob?.alive ? player.goal.mob : null;
  const over = input.hover ? pick(input.hover.x, input.hover.y)?.mob : null;
  for (const [k, m] of [['target', target], ['hover', over !== target ? over : null]]) {
    const el = labelEls[k];
    if (!m || !m.alive || !m.sprite.visible) { el.style.display = 'none'; continue; }
    const s = m.sprite, top = s.position.y + s.scale.y * (1 - s.center.y) * 0.92;
    projV.set(m.x, top, m.z).project(camera);
    if (projV.z > 1) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    el.textContent = m.def.name + (m.def.mvp ? ' ✦ MVP' : m.def.boss ? ' ✦' : '');
    el.style.transform = `translate(${(projV.x + 1) / 2 * window.innerWidth}px, ${(1 - projV.y) / 2 * window.innerHeight}px) translate(-50%, -100%)`;
  }
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

const title = document.getElementById('title');
const tContinue = document.getElementById('t-continue');
const tNew = document.getElementById('t-new');
const tSound = document.getElementById('t-sound');
// character slots: the game loads the hero played last; picking another and pressing Play loads
// that one (the page starts again with it) and goes straight in. An empty slot makes a new hero.
const slotHere = activeSlot(), slotsEl = document.getElementById('t-slots');
const heroes = Array.from({ length: SLOTS }, (_, i) => (i === slotHere ? save : loadSave(i)));
let picked = slotHere;
const heroName = (d) => d.look?.name || 'Hero';
function drawSlots() {
  slotsEl.innerHTML = heroes.map((d, i) => {
    const on = i === picked ? ' on' : '';
    if (!d) return `<button class="tslot empty${on}" data-i="${i}"><span class="tpic">+</span><span><b>Empty</b><small>A new hero</small></span></button>`;
    const p = d.prog || {}, lv = p.v === 2 ? `Lv ${p.baseLv}/${p.jobLv}` : `Lv ${p.level | 0 || 1}`;
    const pic = headsReady() ? `<img class="tpic" src="${lookPortrait({ hair: 'messy', dye: 'brown', ...d.look }, 48)}" alt="">` : '<span class="tpic"></span>';
    return `<button class="tslot${on}" data-i="${i}">${pic}<span><b>${esc(heroName(d))}</b><small>${esc(JOBS[p.job]?.name || JOBS.novice.name)} · ${lv}</small><small>${esc(ZONE_NAMES[d.map] || ZONE_NAMES.camp)}</small></span></button>`;
  }).join('');
  tContinue.textContent = !heroes[picked] ? 'New Hero' : picked === slotHere ? 'Continue' : 'Play';
  tNew.hidden = !heroes[picked];
  tBackup.hidden = !heroes.some(Boolean);
  if (!headsReady() && heroes.some(Boolean) && !started) setTimeout(drawSlots, 300); // the portraits, once the heads have loaded
}
slotsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.tslot');
  if (!b || +b.dataset.i === picked) return;
  picked = +b.dataset.i;
  confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn');
  audio.play('ui');
  drawSlots();
});
const soundLabel = () => { tSound.textContent = `Sound: ${audio.enabled ? 'On' : 'Off'}`; };
soundLabel();
tSound.addEventListener('click', () => { audio.start(); audio.setEnabled(!audio.enabled); soundLabel(); audio.play('ui'); });
// back up the save as a line of text (to keep in notes or a chat), or paste one back in
const tBackup = document.getElementById('t-backup'), tRestore = document.getElementById('t-restore');
const codeBox = document.getElementById('t-code'), codeMsg = document.getElementById('t-code-msg');
const codeText = document.getElementById('t-code-text'), codeGo = document.getElementById('t-code-go');
let codeMode = null;
const openCode = (mode) => {
  codeMode = mode;
  codeBox.hidden = false;
  audio.play('ui');
  if (mode === 'backup') {
    codeText.value = saveCode();
    codeText.readOnly = true;
    codeMsg.textContent = 'All your heroes and the shared storage as a code. Copy it and keep it somewhere safe (notes, a chat). Restore save puts it back, on this phone or another.';
    codeGo.textContent = 'Copy';
  } else {
    codeText.value = '';
    codeText.readOnly = false;
    codeMsg.textContent = 'Paste a save code here. It replaces all your heroes and the storage (a code from before the slots replaces only the chosen slot).';
    codeGo.textContent = 'Load';
  }
};
tBackup.addEventListener('click', () => openCode('backup'));
tRestore.addEventListener('click', () => openCode('restore'));
document.getElementById('t-code-close').addEventListener('click', () => { codeBox.hidden = true; audio.play('ui'); });
codeGo.addEventListener('click', async () => {
  if (codeMode === 'backup') {
    codeText.select();
    let ok = false;
    try { await navigator.clipboard.writeText(codeText.value); ok = true; } catch { try { ok = document.execCommand('copy'); } catch { /* select it by hand */ } }
    codeMsg.textContent = ok ? 'Copied! Paste it somewhere safe.' : 'Select the code and copy it by hand.';
    return;
  }
  const got = loadCode(codeText.value, picked);
  if (!got) { codeMsg.textContent = 'That is not a save code. Check it was copied whole.'; return; }
  if (got === 'slot') setActiveSlot(picked);
  codeMsg.textContent = 'Save restored. Starting…';
  resetting = true; // don't let the running game write over it
  setTimeout(() => location.reload(), 600);
});
// Delete: the picked hero is gone for good (the shared storage stays), so it asks twice
let confirmNew = false, confirmT = 0;
tNew.addEventListener('click', () => {
  if (!confirmNew) {
    confirmNew = true;
    tNew.textContent = `Tap again to delete ${heroName(heroes[picked])}`;
    tNew.classList.add('warn');
    clearTimeout(confirmT);
    confirmT = setTimeout(() => { confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn'); }, 3000);
    return;
  }
  clearTimeout(confirmT);
  confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn');
  clearSave(picked);
  heroes[picked] = null;
  if (picked === slotHere) { resetting = true; location.reload(); return; } // the hero in the game: start the page over without it
  audio.play('ui');
  drawSlots();
});
tContinue.addEventListener('click', () => {
  if (picked !== slotHere) { // another slot: load it and come straight back in
    setActiveSlot(picked);
    try { sessionStorage.setItem(GO_KEY, '1'); } catch { /* it waits on the title screen instead */ }
    resetting = true;
    location.reload();
    return;
  }
  begin();
});
function begin() {
  setActiveSlot(slotHere);
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
}
const GO_KEY = 'aria.go';
drawSlots();
let go = false;
try { go = sessionStorage.getItem(GO_KEY) === '1'; sessionStorage.removeItem(GO_KEY); } catch { /* storage unavailable */ }
if (go) { // picked on the title screen before the page started over: the sound waits for a tap
  window.addEventListener('pointerdown', () => audio.start(), { once: true });
  begin();
}

window.__aria = { lib, warp, enterMap, useSkill, useItem, story, SPOTS, player, world, cam, camera, mobs, allies, fx, inv, prog, quests, villagers, menus, hotbar, dayNight, audio, stats: world.stats, raid: () => raid, raidAt: () => raidAt, gainExp };
