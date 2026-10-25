import * as THREE from 'three';
import './style.css';
import { createSprites } from './sprites.js';
import { buildWorld, ZONE_NAMES, MAPS } from './world.js';
import { CITY, MAGIC } from './city.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { FX } from './fx.js';
import { MobManager, MOB_DEFS, MOVES } from './mobs.js';
import { loadSave, writeSave } from './save.js';
import { Inventory } from './inventory.js';
import { Progress, JOBS, RATES } from './progress.js';
import { Quests, QUESTS, NPCS, FARES, NEXT, SERIES, giverOf } from './quests.js';
import { Story, INTRO, route } from './story.js';
import { Villagers } from './villagers.js';
import { Tiles } from './tiles.js';
import { Hotbar } from './hotbar.js';
import { derive, playerAttack, mobAttack, magicAttack, elementMod } from './rules.js';
import { SKILLS, EDGE_FX, skillLv, spCost, castTime, learn, skillList, weaponOk, WEAPON_NAMES } from './skills.js';
import { Menus } from './menus.js';
import { iconTexture, iconURL, ITEMS, baseOf } from './items.js';
import { DayNight } from './daynight.js';
import { Audio } from './audio.js';
import { clearSave, saveCode, loadCode } from './save.js';
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
// monsters per map: [type, count, nightOnly]. Wisps drift about by day too; night brings more of them and ~20% more of the rest
const SPAWNS = {
  camp: [],
  grove: [['slime', 12], ['sprout', 9], ['wisp', 3], ['wisp', 3, true], ['slime', 3, true], ['sprout', 2, true]],
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
  serpent: [['goblinAssassin', 7], ['goblinWarrior', 5], ['goblinArcher', 5], ['goblinKing', 1], ['goblinAssassin', 2, true]],
};

// which build this is, on the title screen (matches the APK's version, 1.0.<build>)
const verEl = document.querySelector('#title .ver');
if (verEl) verEl.textContent = `v1.0.${__BUILD__} · Explore, fight, craft, survive the night`;

const save = loadSave();
let lookBefore = null; // the look kept, while one is being tried on
mobs.mvpAt = typeof save?.mvpAt === 'number' ? { jarl: save.mvpAt } : save?.mvpAt || {}; // older saves timed the Fire Giant alone
mobs.bossHp = save?.bossHp || {};
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
// people without a sprite of their own yet borrow someone's (NPCS look)
for (const [id, n] of Object.entries(NPCS)) lib.villagers[id] ||= lib.villagers[n.look] || lib.villagers.bram;
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
inv.job = () => prog.wearJobs; // every job earned: a Blader who passed the Sorcerer's trial may hold a staff
// the player's look follows the job: the Trainee's clothes, then the Blader's or the Sorcerer's
const jobArt = () => ({ novice: lib.novice, swordman: lib.player, mage: lib.sorcerer || lib.novice, blademaster: lib.blademaster, wizard: lib.wizard, magicknight: lib.magicknight }[prog.job] || lib.player);
player.setArt(jobArt());
inv.load(save?.inv);
inv.dropUnwearable(); // gear rules can change between versions
// stats + gear -> the player's battle numbers (Ragnarok rules); HP/SP stay put, capped by the new max
// timed buffs, in seconds left: aspd (Quickening Draught), warcry (War Cry's ATK bonus)
const buffs = { aspd: 0, warcry: 0, ward: 0, aegis: 0, momentum: 0 };
let warcryLv = 0, wardLv = 0, endureGuard = 0, aegisLv = 0;
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
const weaponKind = () => (ITEMS[inv.gear.weapon]?.kind === 'staff' ? 'staff' : 'sword');
function applyStats() {
  const gear = inv.gearStats();
  const hide = skillLv(prog, 'ironhide');
  const sword = ITEMS[inv.gear.weapon]?.kind !== 'staff';
  gear.mastery = skillLv(prog, 'basics') + (sword ? 2 * skillLv(prog, 'discipline') + 3 * skillLv(prog, 'blademastery') : 0);
  gear.hit += sword ? skillLv(prog, 'blademastery') : 0;
  gear.flee += skillLv(prog, 'footwork') ? 3 : 0;
  gear.def += hide + (buffs.aegis > 0 && player.barrier > 0 ? aegisLv : 0);
  if (buffs.aspd > 0) gear.aspdRate *= 0.9;
  if (buffs.imbue > 0 && imbueEl && sword) gear.el = imbueEl; // Elemental Blade
  const ps = derive(prog, gear);
  ps.maxHp = Math.floor(ps.maxHp * (1 + hide / 100));
  ps.maxSp = Math.floor(ps.maxSp * (1 + skillLv(prog, 'manawell') / 50));
  player.ps = ps;
  player.maxHp = ps.maxHp;
  player.maxSp = ps.maxSp;
  player.hp = Math.min(player.hp, ps.maxHp);
  player.sp = Math.min(player.sp, ps.maxSp);
  player.haste = 0; // nothing hastes the walk for now: walking speed is a big buff in Aria
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
  const home = savePoint ? ZONE_NAMES[savePoint.map] : 'camp';
  ui.faint(true, lost.base || lost.job ? `Returning to ${home} · lost ${lost.base} Base EXP, ${lost.job} Job EXP` : `Returning to ${home}`);
  setTimeout(() => {
    enterMap(savePoint ? savePoint.map : 'camp', null);
    if (savePoint) player.revive(savePoint.x, savePoint.z);
    else player.revive(world.spawn.x, world.spawn.z);
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
  fx.bolt(m.x, y, m.z, playerMark, '#efe2c0', () => {
    if (!m.alive && !mobs.list.includes(m)) return;
    if (!player.canBeHit() || player.state === 'down') return;
    const res = mobAttack(m.def, player.ps);
    if (res.miss) fx.number(player.x, overHead(player, 1.3), player.z, res.dodge ? 'Lucky!' : 'Miss', 'miss');
    else player.takeDamage(res.dmg, m.x, m.z);
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
  gainExp(d.mvpExp, 0);
  const mins = Math.round(d.respawn / 60);
  setTimeout(() => menus.message(`The ${d.name} will return in about ${mins} minutes.`), 2500);
  persist();
});

// ---------- experience: Base and Job EXP, like Ragnarok ----------
const knownSkills = () => new Set(skillList(prog).filter((id) => skillLv(prog, id)));
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
const questGiver = giverOf;
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
  if (r.xp) gainExp(r.xp, r.job ?? Math.round(r.xp * 0.7)); // (a job trial's steps on the way pay nothing)
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
    return map ? { map, npc: s.kind === 'talk' ? s.npc : null, why: s.title } : null;
  }
  const q = QUESTS[id], giver = questGiver(id);
  if (!(id in quests.active) || quests.ready(id, inv)) return { map: NPCS[giver].map || 'camp', npc: giver, why: NPCS[giver].name };
  if (q.kind === 'kill') { const map = nearestMap(mapsOf(q.mob)); return map ? { map, why: `${MOB_DEFS[q.mob].name}s` } : null; }
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
    const k = nav.npc, spot = k && SPOTS.find((sp) => sp.npc === k);
    nav = null;
    if (spot) player.command({ x: spot.x, z: spot.z, reach: 1.7, arrive: spot.run });
    else menus.message(`You have arrived in ${ZONE_NAMES[world.id]}.`);
    refreshQuests();
    return;
  }
  const p = route(world.id, nav.map);
  if (!p) { nav = null; refreshQuests(); return; }
  player.command({ x: p.x, z: p.z, reach: 0.05 });
}
const stopNav = () => { if (nav) { nav = null; refreshQuests(); } };

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
    if (off.length) menus.message(`Put away what a ${JOBS[job].name} can't use: ${off.map((i) => ITEMS[i].name).join(', ')}`);
    player.setArt(jobArt());
    applyStats();
    player.heal(player.maxHp);
    player.healSp(player.maxSp);
    audio.play('levelup');
    const y = world.heightAt(player.x, player.z);
    fx.sparkle(player.x, y + 0.6, player.z, '#ffe37a', 24);
    fx.number(player.x, y + 1.9, player.z, `${JOBS[job].name}!`, 'level');
    menus.message(switching ? `You are a ${JOBS[job].name} again. Your Job Level and skills come with you.`
      : JOBS[job].tier === 2 ? `You are now a ${JOBS[job].name}! Job Level starts again; new skills wait in the Skills window.`
        : prog.unlocked.length > 1 ? `You are now a ${JOBS[job].name} too! Both paths share your Job Level and skill points.`
          : `You are now a ${JOBS[job].name}! Earn Job Levels for skill points.`);
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
  { map: 'magic', ...MAGIC.chest, h: 0.8, run: () => menus.show('chest') }, // and Galdrheim's
  ...villagers.list.map((v) => ({ npc: v.id, map: v.map, x: v.x, z: v.z, h: v.top, run: () => { if (menus.isOpen('story')) return; if (story.talkStep(v.id) && storyLive()) storyDone(); else menus.talkTo(v.id); } })),
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
    if (player.state === 'normal' && pay()) { player.endureT = 4; endureGuard = 0.15; say('Guard'); audio.play('block'); }
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
  }
  if (buffs.aegis > 0 && player.barrier <= 0) { buffs.aegis = 0; applyStats(); menus.message('Stone Aegis breaks'); }
  if (player.endureT <= 0) endureGuard = 0;
  player.guard = Math.max(endureGuard, buffs.ward > 0 ? wardLv * 0.02 : 0);
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
  writeSave({ story: story.toJSON(), look: player.look, visited: [...visited], keepers: [...keepers], savePoint, map: world.id, mvpAt: mobs.mvpAt, bossHp: mobs.bossSnapshot(), x: player.x, z: player.z, yaw: cam.yaw, dist: cam.dist, hp: player.hp, sp: player.sp, inv: inv.toJSON(), prog: prog.toJSON(), quests: quests.toJSON(), hotbar: hotbar.toJSON(), time: dayNight.t });
}

// second jobs glow: a soft aura behind the hero and a ring at their feet, in the job's colour
const AURA = { blademaster: '#ff7a4a', wizard: '#b48aff', magicknight: '#6ad8ff' };
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
  if (live) holdWalk(dt);

  player.update(live ? dt : 0, b, mobs);
  if (live && player.moving && player.state === 'normal') {
    stepT -= dt;
    if (stepT <= 0) { stepT = 1.4 / player.walkSpeed(); audio.play('step'); } // a footstep every 1.4 tiles
  }
  audio.update(dt, dayNight.night);
  if (!started) cam.yaw += dt * 0.05; // slow orbit behind the title screen
  mobs.cam = b;
  if (live) mobs.update(dt, player);
  if (live) dayNight.update(dt, t); else if (!started) dayNight.update(0, t);
  world.update(dt, t);
  villagers.update(dt, player, b);
  if (live) fx.update(dt);
  if (live) { naturalRegen(dt); tickSkills(dt); checkPortals(); tickNav(); }
  tickAura(dt, t, b);
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

  if (live) mobLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
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
if (save) { tContinue.textContent = 'Continue'; tNew.hidden = false; }
const soundLabel = () => { tSound.textContent = `Sound: ${audio.enabled ? 'On' : 'Off'}`; };
soundLabel();
tSound.addEventListener('click', () => { audio.start(); audio.setEnabled(!audio.enabled); soundLabel(); audio.play('ui'); });
// back up the save as a line of text (to keep in notes or a chat), or paste one back in
const tBackup = document.getElementById('t-backup'), tRestore = document.getElementById('t-restore');
const codeBox = document.getElementById('t-code'), codeMsg = document.getElementById('t-code-msg');
const codeText = document.getElementById('t-code-text'), codeGo = document.getElementById('t-code-go');
let codeMode = null;
if (save) tBackup.hidden = false;
const openCode = (mode) => {
  codeMode = mode;
  codeBox.hidden = false;
  audio.play('ui');
  if (mode === 'backup') {
    codeText.value = saveCode();
    codeText.readOnly = true;
    codeMsg.textContent = 'Your save as a code. Copy it and keep it somewhere safe (notes, a chat). Restore save puts it back, on this phone or another.';
    codeGo.textContent = 'Copy';
  } else {
    codeText.value = '';
    codeText.readOnly = false;
    codeMsg.textContent = 'Paste a save code here. It replaces the save in this game.';
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
  if (!loadCode(codeText.value)) { codeMsg.textContent = 'That is not a save code. Check it was copied whole.'; return; }
  codeMsg.textContent = 'Save restored. Starting…';
  resetting = true; // don't let the running game write over it
  setTimeout(() => location.reload(), 600);
});
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
