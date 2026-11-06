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
import { MobManager, MOB_DEFS, MOVES, MVP_MOVE, RIDDLE, RIDDLES, fierce, guardDef, raidDef, pityChance } from './mobs.js';
import { Allies, ROAR } from './allies.js';
import { RAIDS, rollReward } from './raid.js';
import { loadSave, writeSave, loadStorage, writeStorage, clearSave, saveCode, loadCode, SLOTS, activeSlot, setActiveSlot, restoreMirror, backedUpAt } from './save.js';
// the APK's native copy of the saves: any the WebView lost come back, and the page starts again once to load them
restoreMirror().then((n) => { try { if (n && !sessionStorage.getItem('aria.mirrored')) { sessionStorage.setItem('aria.mirrored', '1'); location.reload(); } } catch { /* ignore */ } });
import { Inventory } from './inventory.js';
import { Progress, JOBS, RATES, QUEST_RATE, STAT_KEYS } from './progress.js';
import { Quests, QUESTS, NPCS, FARES, ALWAYS_FARES, NEXT, SERIES, giverOf } from './quests.js';
import { Story, INTRO, STORY, CALLINGS, CALL_HOME, route } from './story.js';
import { SPAWNS } from './spawns.js';
import { isDelve, prepareFloor, deepen, START as DELVE_START, DEPTH, checkpoint } from './delve.js';
import { INTRO_SHOTS, CHAPTER_SHOTS, STEP_SHOTS, SECRET_SHOTS } from './scenes.js';
import { installLessons } from './lessons.js';
import { installStands } from './stands.js';
import { installQuestWorld } from './questworld.js';
import { installRaids } from './raids.js';
import { installBossMoves } from './bossmoves.js';
import { playCutscene } from './cutscene.js';
import { Villagers } from './villagers.js';
import { Tiles } from './tiles.js';
import { Hotbar } from './hotbar.js';
import { Guide } from './guide.js';
import { BigMap } from './bigmap.js';
import { headsReady, paintHead, lookPortrait, hairstyles, HAIR_BODY } from './hair.js';
import { headgearReady, gearCut, paintGears } from './headgear.js';
import { derive, playerAttack, mobAttack, magicAttack, elementMod, ELEMENTS } from './rules.js';
import { SKILLS, EDGE_FX, AMBUSH, BLIND, BLIGHT, wardCut, skillLv, spCost, castTime, learn, skillList, weaponOk, WEAPON_NAMES, BOW_RANGE, unlearnFirstJob, unlearnSecondJob, RETRAIN_COST } from './skills.js';
import { Menus } from './menus.js';
import { iconTexture, iconURL, ENCHANT, ITEMS, baseOf, parseKey, canWear, maybeSlotted } from './items.js';
import { DayNight } from './daynight.js';
import { Audio } from './audio.js';
import { Wings, wingPicture } from './wings.js';
import { clamp, lerp } from './noise.js';
import { settings, pixelRatio } from './settings.js';
import { Album, albumRows, setProgress, setBonus, SETS } from './album.js';
import { Goals, ACHIEVEMENTS, WEEKLY, weeklyReward, weekEnds } from './goals.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(pixelRatio(window.devicePixelRatio)); // Settings' Graphics: Sharp (up to 1.5x) or Fast (1x)
// the HUD's size (settings uiScale): a CSS zoom on its controls (style.css --ui)
const applyScale = () => document.documentElement.style.setProperty('--ui', String(settings.get('uiScale')));
applyScale();
// the Window text size: every window zooms (menus.js place() keeps them on screen); open ones are placed again
const applyText = () => {
  document.documentElement.style.setProperty('--wz', String(settings.get('textSize')));
  for (const el of document.querySelectorAll('#windows .rw:not(.creator)')) if (el.offsetParent) { const r = el.getBoundingClientRect(); menus.place(el, r.left, r.top); }
};
document.documentElement.style.setProperty('--wz', String(settings.get('textSize')));
settings.onChange((k) => { if (k === 'graphics') { renderer.setPixelRatio(pixelRatio(window.devicePixelRatio)); resize(); } if (k === 'uiScale') { applyScale(); placeAtkBtn(); } if (k === 'textSize') applyText(); });
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

// which build this is, on the title screen (matches the APK's version, 1.0.<build>)
const verEl = document.querySelector('#title .ver');
if (verEl) verEl.textContent = `v1.0.${__BUILD__} · Explore, fight, craft, survive the night`;

const save = loadSave();
let lookBefore = null; // the look kept, while one is being tried on
mobs.mvpAt = typeof save?.mvpAt === 'number' ? { jarl: save.mvpAt } : save?.mvpAt || {}; // older saves timed the Fire Giant alone
mobs.pity = save?.mvpPity && typeof save.mvpPity === 'object' ? save.mvpPity : {}; // each MVP's kills since its card / ultra rare fell (PITY)
mobs.bossHp = save?.bossHp || {};
mobs.heroTier = () => JOBS[prog.job]?.tier || 0; // (mini-bosses come only for second jobs: mobs.js picksFight)
mobs.bossAt = save?.bossAt || {};
mobs.fieldAt = save?.fieldAt || {};
const prog = new Progress();
prog.load(save?.prog);
// the hero's body follows the job and the look's body (male or female), painted in code (sprites.js designSet)
const JOB_BODY = { novice: 'trainee', swordman: 'blader', mage: 'sorc', archer: 'archer', blademaster: 'master', wizard: 'wiz', magicknight: 'mknight', windrunner: 'wind', moonranger: 'moon', beastmaster: 'beast', assassin: 'assassin', phantom: 'phantom', shadowblade: 'shadowblade', hunter: 'hunter', voodoo: 'voodoo' };
// (the Beastmaster's follows the weapon in hand: the cleaver, or the bow; held() is set once the
// inventory is loaded)
let held = () => save?.inv?.gear?.weapon;
const bodyArt = (look) => lib.design(`${JOB_BODY[prog.job] || 'blader'}${prog.job === 'beastmaster' && ITEMS[held()]?.kind !== 'bow' ? 'sw' : ''}${look.body === 'f' ? 'F' : 'M'}`);
const player = new Player(scene, world, bodyArt({ ...save?.look }), lib.shadow, fx);
const wings = new Wings(scene);
player.setPos(save?.x ?? world.spawn.x, save?.z ?? world.spawn.z);
if (save?.look) { // (a hairstyle is for one body only: a hero saved with the other body's gets one of their own)
  const b = save.look.body || 'm';
  if (HAIR_BODY[save.look.hair] && HAIR_BODY[save.look.hair] !== b) save.look.hair = hairstyles(b)[0] || save.look.hair;
  player.setLook(save.look);
}
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
      paintGears(g, at, dir, top, face, 0);
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
inv.dual = () => prog.job === 'phantom'; // a Phantom's second dagger goes in the left hand (the Shield slot)
// the player's look follows the job: the Trainee's clothes, then the first and second jobs'
const jobArt = () => bodyArt(player.look);
// a picture cut down to what is drawn (a sprite's frame has room around it to move in)
function trimmed(src) {
  const w = src.width, h = src.height, d = src.getContext?.('2d')?.getImageData(0, 0, w, h).data;
  if (!d) return src;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return src;
  const c = document.createElement('canvas');
  c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
  c.getContext('2d').drawImage(src, -x0, -y0);
  return c;
}
// a job's look on this hero, front view (its body, with their own head and hair): the Elder's talk of
// the paths shows what each job looks like (story pages' pics)
const jobPics = {};
const jobPic = (job) => heroPic(job, player.look);
// any hero in any job, facing dir, with what they wear on the head, the face and the back (gear: item
// ids): the title's preview turns a hero round with these
const HERO_H = 1.38; // (player.js HEIGHT: a body's standing height in world units, for the wings' size)
function heroPic(job, look, dir = 'down', gear = {}) {
  look = { hair: 'messy', dye: 'brown', body: 'm', ...look };
  const { head: top = null, face = null, wings: wid = null } = gear;
  const key = `${job}|${look.body}|${look.hair}|${look.dye}|${dir}|${top}|${face}|${wid}`;
  if (jobPics[key]) return jobPics[key];
  const art = lib.design(`${JOB_BODY[job] || 'blader'}${look.body === 'f' ? 'F' : 'M'}`), tex = art?.anims?.[dir]?.idle?.[0];
  if (!tex?.image) return '';
  const W = tex.image.width, H = tex.image.height, r = W / art.fw, ppu = (art.body[1] / HERO_H) * r; // (pixels a world unit)
  const wing = wingPicture(wid, dir), away = dir.startsWith('up');
  // the wings, sized and placed as on the hero (wings.js): behind them, or over them seen from behind
  let ww = 0, wh = 0, wy = 0;
  if (wing) { ww = wing.M.w * ppu * (!wing.views && (dir === 'left' || dir === 'right') ? 0.7 : 1); wh = wing.M.h * ppu; wy = H * (1 - tex.userData.anchor) - wing.M.y * ppu; }
  const pad = Math.max(0, Math.ceil((ww - W) / 2)), c = document.createElement('canvas');
  c.width = W + pad * 2; c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const wings = () => wing && g.drawImage(wing.canvas, pad + W / 2 - ww / 2, wy - wh / 2, ww, wh);
  if (!away) wings();
  g.drawImage(tex.image, pad, 0);
  // the head as soon as the heads have loaded, and each piece of headgear once its own has (a
  // piece still loading is left off for now, never the head with it)
  const hasHead = headsReady() && tex.userData.head?.at, hat = headgearReady(top) ? top : null, mask = headgearReady(face) ? face : null;
  const ready = hasHead && hat === top && mask === face;
  if (hasHead) {
    const at = [tex.userData.head.at[0] + pad, tex.userData.head.at[1]];
    paintHead(g, at, dir, look, gearCut(hat, dir), hat);
    paintGears(g, at, dir, hat, mask, 0);
  }
  if (away) wings();
  if (!ready) return trimmed(c).toDataURL(); // (not kept: the head and its gear come once loaded)
  return (jobPics[key] = trimmed(c).toDataURL());
}
// what a saved hero wears on the head, the face and the back (refined pieces look like the plain one)
const savedGear = (d) => { const G = d?.inv?.gear || {}; return { head: G.head && baseOf(G.head), face: G.face && baseOf(G.face), wings: G.wings && baseOf(G.wings) }; };

held = () => inv.gear.weapon;
player.setArt(jobArt());
inv.load(save?.inv);
inv.chest.load(loadStorage()); // the Keepers' storage: every hero's, saved apart from them
inv.dropUnwearable(); // gear rules can change between versions
// the Monster Album: kills and the cards ever found. A save from before it starts with the cards the
// hero holds now (bag, storage, and those pressed into gear)
const album = new Album();
const CARD_OF = Object.fromEntries(Object.entries(ITEMS).filter(([, it]) => it.card).map(([id, it]) => [it.name.replace(/ Card$/, ''), id]));
if (!album.load(save?.album)) {
  for (const s of [...inv.bag.slots, ...inv.chest.slots]) { const u = parseKey(s.id); if (ITEMS[u.base]?.card) album.card(u.base); for (const c of u.cards) album.card(c); }
  for (const id of Object.values(inv.gear)) if (id) for (const c of parseKey(id).cards) album.card(c);
}
// Goals (goals.js): the weekly hunts (paid when done) and the achievements (a title each)
const goals = new Goals();
goals.load(save?.goals);
const PLURAL = { Wolf: 'Wolves', Cactus: 'Cacti', Mummy: 'Mummies', Sarcophagus: 'Sarcophagi', 'Dark Elf': 'Dark Elves' };
const plural = (n) => PLURAL[n] || n.replace(/y$/, 'ie') + 's';
// the monster kinds a weekly hunt may name: the field and dungeon kinds within 8 levels of the hero
const nearKinds = () => Object.fromEntries([...new Set(Object.values(SPAWNS).flat().map(([t]) => t))]
  .filter((t) => MOB_DEFS[t] && !MOB_DEFS[t].boss && !MOB_DEFS[t].mvp && !MOB_DEFS[t].noRespawn && Math.abs(MOB_DEFS[t].lv - prog.baseLv) <= 8)
  .map((t) => [t, plural(MOB_DEFS[t].name)]));
const heroSalt = () => [...(player.look.name || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
function payGoal(g) {
  const r = weeklyReward(g.kind, goals.weekly.lv);
  inv.perz += r.perz;
  for (const [id, n] of Object.entries(r.items)) inv.add(id, n);
  audio.play('heart');
  menus.message(`Weekly hunt done: ${WEEKLY[g.kind].text(g)}! +${r.perz.toLocaleString()} perz${Object.keys(r.items).length ? ` and ${Object.entries(r.items).map(([id, n]) => `${n} ${ITEMS[id].name}`).join(', ')}` : ''}`);
  persist();
}
const goalEvent = (ev) => { for (const g of goals.on(ev)) payGoal(g); };
// the achievements' view of the game (goals.js ACHIEVEMENTS)
function goalState() {
  const kills = (f) => Object.entries(album.kills).filter(([t]) => MOB_DEFS[t] && f(MOB_DEFS[t]));
  const lands = Object.keys(MAPS).filter((id) => !MAPS[id].arena && !MAPS[id].delve);
  const worn = Object.values(inv.gear).filter(Boolean).map((k) => parseKey(k).refine);
  const sets = albumSets();
  return {
    tier: prog.tier, firsts: prog.unlocked.filter((j) => JOBS[j]?.tier === 1).length, baseLv: prog.baseLv,
    minis: kills((d) => d.boss && !d.mvp && !d.raid && !d.raidLv).reduce((a, [, n]) => a + n, 0),
    mvps: kills((d) => d.mvp).reduce((a, [, n]) => a + n, 0), mvpKinds: kills((d) => d.mvp).length, mvpTotal: Object.values(MOB_DEFS).filter((d) => d.mvp).length,
    raidClears: raidLog.filter((e) => e.won && e.diff !== 'tutorial').length, hellClears: raidLog.filter((e) => e.won && e.diff === 'hell').length,
    landsWalked: lands.filter((id) => visited.has(id)).length, landsTotal: lands.length,
    met: Object.keys(album.kills).length, sets: sets.filter((p) => p.done).length, setsTotal: SETS.length,
    bestRefine: Math.max(goals.bestRefine, ...worn, 0), secrets: ['sphinx6', 'tree6'].filter((q) => quests.done.includes(q)).length,
    storyDone: !story.step,
  };
}
let goalT = 0;
function goalTick(dt) {
  if ((goalT -= dt) > 0 || !started) return;
  goalT = 3;
  if (goals.ensureWeek(Date.now(), prog.baseLv, prog.tier, nearKinds(), heroSalt())) persist();
  for (const a of goals.check(goalState())) { audio.play('levelup'); menus.message(`Achievement: ${a.text}! You may wear the title "${a.title}" (Goals, 🏆).`); persist(); }
}

// the album's sets (album.js SETS): a finished one gives its bonus for good (applyStats)
const RAID_BOSSES = Object.values(RAIDS).map((r) => r.boss[0]);
const albumSets = () => setProgress(MOB_DEFS, SPAWNS, CARD_OF, album, RAID_BOSSES);
inv.gained = (id) => {
  const base = baseOf(id);
  if (!ITEMS[base]?.card) return;
  const before = albumSets().filter((p) => p.done).length;
  if (!album.card(base)) return;
  menus.message(`A new card for your Monster Album: ${ITEMS[base].name}!`);
  const done = albumSets().filter((p) => p.done);
  if (done.length > before) { const s = done.find((p) => p.cards.includes(base)) || done.at(-1); menus.message(`Album set complete: ${s.set.name}! ${s.set.text} for good.`); audio.play('levelup'); applyStats(); }
};
// where each monster lives, for the album: its maps (SPAWNS), the raid it fights in, or the quest that calls it
const LIVES = {};
for (const [map, list] of Object.entries(SPAWNS)) for (const [type] of list) (LIVES[type] ||= new Set()).add(ZONE_NAMES[map] || map);
for (const r of Object.values(RAIDS)) for (const type of [...r.waves.flat().map((w) => w[0]), r.boss[0]]) (LIVES[type] ||= new Set()).add(`Raid: ${r.name}`);
const livesAt = (type) => (LIVES[type] ? [...LIVES[type]].join(', ') : MOB_DEFS[type]?.noRespawn ? 'a quest calls it' : '');
// stats + gear -> the player's battle numbers (Ragnarok rules); HP/SP stay put, capped by the new max
// timed buffs, in seconds left: aspd (Quickening Draught), warcry (War Cry's ATK bonus)
const buffs = { aspd: 0, oil: 0, food_pow: 0, food_end: 0, food_qkn: 0, food_fns: 0, food_knl: 0, food_ftn: 0, warcry: 0, ward: 0, aegis: 0, momentum: 0, focus: 0, tailwind: 0, rush: 0, gust: 0, rhythm: 0, veil: 0, frenzy: 0, sub: 0 };
// battle oils and stat foods (items.js use.oil / use.food)
let oilEl = null;
const OILS = { fire: 'fire_oil', water: 'frost_oil', wind: 'storm_oil', earth: 'stone_oil' };
const FOODS = Object.fromEntries(Object.entries(ITEMS).filter(([, it]) => it.use?.food).map(([id, it]) => [it.use.food, id]));
const FOOD_STATS = Object.keys(FOODS), FOOD_N = 3;
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
// a beast's numbers from the hero's (s: its share of them, from its Summon level and Beast Bond). Each
// beast stands for one stat, which counts a lot: END the Bear's HP and DEF, FNS the Wolves' HIT and ATK,
// QKN the Hawk's attack speed and reach. FTN gives every beast its crits and lucky dodges, POW adds to
// every beast's ATK, and the other stats still count a little (MINOR) for all of them
const MINOR = 0.25;
function beastStats(kind) {
  const g = inv.gearStats().stats, st = (k) => prog.total(k) + (g[k] || 0), base = prog.baseLv;
  const s = 0.3 + 0.1 * skillLv(prog, SUMMONS[kind]) + 0.02 * skillLv(prog, 'beastbond'), m = s * MINOR;
  const quick = buffs.frenzy > 0 ? 1 - 0.03 * frenzyLv : 1, R = Math.round;
  const pow = st('pow'), end = st('end'), fns = st('fns'), qkn = st('qkn'), knl = st('knl'), ftn = st('ftn');
  // KNL sharpens their instincts (allies.js INSTINCTS: Maul, Hamstring, Dive): harder, sooner, and a
  // stun or slow that lasts longer (KNL 80 at a full share: about 1.5x the blow, 0.75x the wait, 1.4x as long)
  const sharp = { mult: 1 + knl * 0.006 * s, cd: Math.max(0.6, 1 - knl * 0.003 * s), dur: 1 + knl * 0.005 * s };
  const common = { crit: R(3 + ftn / 3 * s), dodge: R(2 + ftn / 10 * s), mastery: 0, el: 'neutral', wlv: 2, beast: true, sharp };
  // a little of every stat, for all: END's toughness, FNS and KNL's aim, QKN's pace and footwork
  const hp = end * 4 * m, def = end * 0.15 * m, hit = (fns + knl) * 0.5 * m, flee = qkn * 0.5 * m, pace = 1 - qkn * 0.003 * m;
  if (kind === 'bear') {
    const hide = skillLv(prog, 'thickhide');
    return { ...common, maxHp: R(player.maxHp * 0.6 * s + end * 25 * s + base * 4 + hp), def: Math.min(70, R(10 + end * 0.9 * s)), end: R(end * s), flee: R(base * 0.6 + flee),
      batk: R(pow * s + end * 0.5 * s + base * 1.2), watk: R(30 + base * 1.2), fns: R(base * 0.8), hit: R(base + 25 + hit), interval: 1.6 * quick * pace, taunt: 3 + 0.5 * hide, guard: 0.04 * hide };
  }
  if (kind === 'wolf') return { ...common, maxHp: R(player.maxHp * 0.3 * s + base * 5 + hp), def: R(8 + def), end: R(base * 0.3), flee: R(base + fns * 0.3 * s + flee),
    batk: R(pow * 0.8 * s + fns * 1.8 * s + base * 0.5), watk: R(20 + base), fns, hit: R(base + fns * 2.5 * s + hit), interval: 1.0 * quick * pace, double: 0.25 };
  return { ...common, maxHp: R(player.maxHp * 0.28 * s + base * 4 + hp), def: R(4 + def), end: 0, flee: R(base + qkn * 1.5 * s),
    batk: R(pow * 0.9 * s + qkn * 0.7 * s + base * 0.6), watk: R(15 + base * 0.8), fns: R(base * 0.8), hit: R(base + 30 + qkn * 0.6 * s + hit),
    interval: Math.max(0.35, 1.3 - qkn * 0.012 * s) * quick * (1 - 0.03 * skillLv(prog, 'windtalons')),
    reach: 2.2 + qkn * 0.025 * s }; // (QKN: it strikes from further off)
}
// a beast's damage rate on a monster: Pack Frenzy, and Pack Tactics when both wolves bite the same one
allies.mult = (b, m) => (b.K.illusion ? 1 + 0.06 * skillLv(prog, 'lingeringshade') : 1) // (a Phantom's illusions: Lingering Shade)
  * (buffs.frenzy > 0 && !b.K.illusion ? 1 + 0.03 * frenzyLv : 1) * (allies.rallyT > 0 ? 1 + ROAR.atk : 1) // (the Bear's Roar)
  * (b.kind === 'wolf' && allies.of('wolf').filter((w) => w.foe === m).length > 1 ? 1 + 0.06 * skillLv(prog, 'packtactics') : 1);
const moonSkill = () => (nightUp ? 1 + 0.02 * skillLv(prog, 'moonlit') : 1); // Moonlit Hunter, on every skill
// a Phantom's illusion's numbers: a share of the hero's own (Phantom Double's level), the hero's
// weapon and pace; a shade fights hand to hand, the Mirage only stands there and draws the monsters
function illusionStats() {
  const ps = player.ps, s = 0.3 + 0.06 * skillLv(prog, 'phantomdouble'), R = Math.round;
  return { ...ps, left: null, batk: R(ps.batk * s), watk: R(ps.watk * s), mastery: R(ps.mastery * s), maxHp: R(player.maxHp * 0.35), interval: ps.interval * 1.1, double: 0, guard: 0 };
}
// Vanish: the hero melts into the shadows (monsters lose them, mobs.js); attacking ends it, and the
// first blow out of it strikes harder
let vanishBonus = 1;
// the Shadowblade's Ambush: its first blow out of any hiding (Vanish, Umbral Step, Night Stalker) lands
// harder (skills.js AMBUSH, more with Night Stalker)
const ambushMul = () => (prog.trees.has('shadowblade') ? AMBUSH * (1 + 0.1 * skillLv(prog, 'nightstalker')) : 1);
function hide(t) { // into the shadows, like Vanish (Umbral Step, Night Stalker's kill)
  if (!(player.hiddenT > 0)) vanishBonus = 1;
  player.hiddenT = Math.max(player.hiddenT || 0, t);
  player.mat.transparent = true; player.mat.opacity = 0.35;
}
function unhide(attack = false) {
  player.hiddenT = 0;
  player.mat.transparent = false; player.mat.opacity = 1;
  if (!attack) return;
  const amb = ambushMul();
  ambushAt = skillClock;
  player.nextBlow = Math.max(player.nextBlow || 1, vanishBonus, amb);
  if (amb > 1) fx.number(player.x, overHead(player, 1.9), player.z, 'Ambush!', 'skill');
}
// a monster that can't walk away (a Bear Trap's hold) or is helpless (stunned, frozen, paralyzed)
const heldFast = (m) => m.slowT > 0 && m.slowBy >= 1;
const helpless = (m) => m.stunT > 0 || heldFast(m);
// the Hunter's traps (useSkill, tickTraps): { kind, lv, x, z, armT, life, s (its sprite) }
const traps = [];
function clearTraps() { for (const t of traps) fx.release(t.s); traps.length = 0; }
// the Voodoo's Substitute (its level, for its poison haze; the doll's soak is player.barrier), and the Voodoo Doll: the monster bound to it, for how long
let auraLv = 0, auraTick = 0, doll = null, dollT = 0, dollLv = 0, subProp = null;
let sceneKeep = null; // (a story cutscene under way: the hero's traps and doll wait for them, hidden: playScene)
// the Voodoo's Blight (skills.js BLIGHT): stacks on a monster, each eating a share of the MATK a second,
// in Shadow, through MDEF (no hold, so bosses don't resist it)
const bound = (m) => doll && dollT > 0 && doll === m;
function blight(m, n = 1) {
  if (!m?.alive || !n || m.def.decoy) return;
  const was = m.blight > 0 && m.blightT > 0 ? m.blight : 0;
  m.blight = Math.min(bound(m) ? BLIGHT.dollMax : BLIGHT.max, was + n);
  m.blightT = BLIGHT.dur + 0.2 * skillLv(prog, 'hexcraft');
  if (!was) m.blightTick = 1;
  if (m.blight !== was) fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.35), m.z, `Blight ${m.blight}`, 'miss');
}
function blightDmg(m) {
  const md = m.effDef(), per = (BLIGHT.base + BLIGHT.per * skillLv(prog, 'hexcraft')) / 100 * (bound(m) ? 1 + 0.03 * dollLv : 1);
  const matk = (player.ps.matk[0] + player.ps.matk[1]) / 2;
  return Math.max(1, Math.floor(matk * per * m.blight * elementMod('shadow', md.el) * (md.takes?.magic ?? 1)));
}
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
const STATUS_TEXT = { freeze: 'Frozen', paralyze: 'Paralyzed', stun: 'Stunned', burn: 'Burning', poison: 'Poisoned', blind: 'Blinded' };
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
  } else if (st.kind === 'poison') { // (a fifth of the blow each second, like a burn: the Assassin's venom)
    if (!hitDmg) return;
    if (!(m.poisonT > 0)) m.poisonTick = 1;
    m.poisonT = dur;
    m.poisonDmg = Math.max(1, Math.round(hitDmg * 0.2));
  } else if (st.kind === 'blind') { // (the Shadowblade's Shadow Bloom: its blows miss now and then, mobs.js)
    m.blindT = dur; m.blindBy = BLIND;
  } else {
    m.stunT = Math.max(m.stunT, dur);
    m.status = st.kind;
  }
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.35), m.z, STATUS_TEXT[st.kind], 'miss');
}
// cards' own effects on each hit or spell that lands (items.js card.perk): the Fire Giant's Meteor
// Heart sets the monster burning, the Kobold Warlord's Earthshaker stuns it (a boss a third as often,
// for half as long, like any status), and the BleepBloop's Gulp heals you a share of the damage
function cardOnHit(m, dmg) {
  const ps = player.ps;
  if (ps.burn && m.alive) inflict(m, { kind: 'burn', chance: () => ps.burn, dur: 3 }, 1, dmg);
  if (ps.stun && m.alive) inflict(m, { kind: 'stun', chance: () => ps.stun, dur: 1.5 }, 1, dmg);
  if (ps.venom && m.alive) inflict(m, { kind: 'poison', chance: () => ps.venom, dur: 4 }, 1, dmg); // (the Cactus Lord Card, a Stinger)
  if (ps.rot && m.alive && dmg > 0) { m.curseT = Math.max(m.curseT || 0, 5); m.curseBy = Math.max(m.curseBy || 0, ps.rot / 100); } // (the Nidhogg Card's Root Rot)
  if (ps.soultax && dmg > 0) { const n = player.healSp(Math.max(1, Math.round(dmg * ps.soultax / 100))); if (n > 0 && skillClock - (procSaid.soultax ?? -99) >= 1) { procSaid.soultax = skillClock; fx.number(player.x, overHead(player, 1.5), player.z, n, 'sp'); } } // (the Pharaoh Card)
  if (ps.lifesteal && dmg > 0) {
    const n = player.heal(Math.max(1, Math.round(dmg * ps.lifesteal / 100)));
    if (n > 0) fx.number(player.x, overHead(player, 1.3), player.z, n, 'heal');
  }
}
let skillClock = 0; // seconds since the game started, for those windows
// a passive that just took hold says so: its name over the monster it worked on (or over you), at most
// once every 2 s each, so a build's quiet bonuses can be seen working
const procSaid = {};
function proc(id, m = null) {
  if (skillClock - (procSaid[id] ?? -99) < 2) return;
  procSaid[id] = skillClock;
  const o = m || player, h = m ? m.sprite.scale.y * 0.8 + 0.75 : 2.1;
  fx.number(o.x, overHead(o, h), o.z, SKILLS[id]?.name || id, 'skill');
}
// what is in hand: 'sword', 'staff', 'bow', 'dagger', or 'none' (bare hands: no blade skills, no sword mastery)
const weaponKind = () => { const it = ITEMS[inv.gear.weapon]; return !it ? 'none' : it.kind === 'staff' || it.kind === 'bow' || it.kind === 'dagger' ? it.kind : 'sword'; };
// an Archer's bonuses on one monster: Hunter's Mark on it, Steady Aim from 4 paces
// the Shadowblade's Cruel Edge: a sword harder on a monster below half its HP
const cruel = (m) => (weaponKind() === 'sword' && m.hp < m.def.hp / 2 && skillLv(prog, 'cruedge') ? (proc('cruedge', m), 1 + 0.04 * skillLv(prog, 'cruedge')) : 1) * backstab(m) * weighed(m);
// the Ammit Card's Weighing of the Heart: blows and spells land harder on a monster under 30% HP
// and the Ratatoskr Card's Keen Perception: harder from 4 paces or more
const weighed = (m) => (player.ps.execute && m.hp < m.def.hp * 0.3 ? 1 + player.ps.execute / 100 : 1)
  * (player.ps.farshot && Math.hypot(m.x - player.x, m.z - player.z) - m.def.r >= 4 ? 1 + player.ps.farshot / 100 : 1);
// what a skill costs: the Eternal Sphinx Card's Eternal Wisdom takes a share off
const spNeed = (id, lv) => { const n = spCost(id, lv); return n && player.ps?.sage ? Math.max(1, Math.round(n * (1 - player.ps.sage / 100))) : n; };
// the Shadowblade's Backstab: a sword or dagger blow from behind lands harder. Behind = the monster faces
// away, fights someone else (a beast, an illusion), has lost you (an Ambush), or you just teleported to its back
let ambushAt = -99, backSaid = -99;
function backstab(m) {
  const lv = skillLv(prog, 'backstab'), w = weaponKind();
  if (!lv || (w !== 'sword' && w !== 'dagger')) return 1;
  const h = m.heading, dx = player.x - m.x, dz = player.z - m.z, d = Math.hypot(dx, dz) || 1;
  const from = m.backT > skillClock || (m.foe && m.foe !== player) || skillClock - ambushAt < 0.3 || (h && (dx * h.x + dz * h.z) / d < -0.3);
  if (!from) return 1;
  if (skillClock - backSaid > 1) { backSaid = skillClock; fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.55), m.z, 'Backstab', 'skill'); }
  return 1 + 0.05 * lv;
}
function bowMul(m) {
  let k = cruel(m);
  if (weaponKind() === 'bow' && skillLv(prog, 'predator') && (m.slowT > 0 || m.stunT > 0 || m.poisonT > 0)) { k *= 1 + 0.05 * skillLv(prog, 'predator'); proc('predator', m); } // the Hunter's Predator
  if (m.markT > skillClock) k *= 1 + 0.04 * m.markLv;
  if (weaponKind() === 'bow' && skillLv(prog, 'steadyaim') && Math.hypot(m.x - player.x, m.z - player.z) - m.def.r >= 4) k *= 1.1;
  if (skirmish > 0 && weaponKind() === 'bow') { skirmish--; k *= 1 + 0.08 * skillLv(prog, 'skirmisher'); proc('skirmisher', m); }
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
  // the Monster Album's finished sets (album.js SETS)
  const set = setBonus(albumSets());
  for (const [k, v] of Object.entries(set.stats)) gear.stats[k] = (gear.stats[k] || 0) + v;
  gear.mhpRate = (gear.mhpRate || 0) + set.mhpRate; gear.mspRate = (gear.mspRate || 0) + set.mspRate;
  const hide = skillLv(prog, 'ironhide');
  const sword = weaponKind() === 'sword', bow = weaponKind() === 'bow';
  const st = gear.stats;
  st.fns = (st.fns || 0) + skillLv(prog, 'keeneye') + (buffs.focus > 0 ? focusLv : 0);
  if (buffs.focus > 0) st.qkn = (st.qkn || 0) + focusLv;
  for (const k of FOOD_STATS) if (buffs[`food_${k}`] > 0) st[k] = (st[k] || 0) + FOOD_N; // stat foods
  gear.hit += bow ? skillLv(prog, 'longsight') : 0;
  const dagger = weaponKind() === 'dagger';
  if (prog.trees.has('phantom')) st.qkn = (st.qkn || 0) + skillLv(prog, 'phantomgrace'); // Phantom Grace
  gear.mastery = skillLv(prog, 'basics') + (sword ? 2 * skillLv(prog, 'discipline') + 3 * skillLv(prog, 'blademastery') : 0) + (dagger ? 4 * skillLv(prog, 'daggermastery') : 0) + (sword ? 2 * skillLv(prog, 'umbraledge') : 0);
  gear.flee += 3 * skillLv(prog, 'improvedodge') + 2 * skillLv(prog, 'phantomgrace') * allies.illusions.length; // Improve Dodge; Phantom Grace, per illusion out
  if (buffs.swift > 0) gear.aspdRate *= 1 - (gear.perk.swift || 0) / 100; // the Rainbow Runner Card's Rainbow Rush, after a kill
  if (!(prog.job === 'phantom')) gear.left = null; // (only a Phantom fights with a dagger in each hand)
  gear.hit += sword ? skillLv(prog, 'blademastery') : 0;
  gear.flee += (skillLv(prog, 'footwork') ? 3 : 0) + (nightUp ? skillLv(prog, 'moonlit') : 0);
  gear.def += hide + (buffs.aegis > 0 && player.barrier > 0 ? aegisLv : 0) + skillLv(prog, 'beastbond') * allies.beasts.length; // Beast Bond
  if (buffs.aspd > 0) gear.aspdRate *= 0.9;
  if (bow) gear.aspdRate *= (1 - 0.02 * skillLv(prog, 'windborne')) * (buffs.tailwind > 0 ? 1 - 0.02 * tailLv : 1) * (1 - skillLv(prog, 'galerhythm') * galeStacks / 100);
  if (buffs.oil > 0 && oilEl && !bow) gear.el = oilEl; // a battle oil (a bow's arrows set their own)
  if (buffs.imbue > 0 && imbueEl && sword) gear.el = imbueEl; // Elemental Blade
  player.statBonus = { ...gear.stats }; // (what gear, cards and skills add to each stat: the Status window shows it)
  const ps = derive(prog, gear);
  ps.maxHp = Math.floor(ps.maxHp * (1 + hide / 100));
  if (dagger && skillLv(prog, 'lethaledge')) ps.crit += 5; // Lethal Edge
  if (sword) ps.crit += 0.5 * skillLv(prog, 'umbraledge'); // the Shadowblade's Umbral Edge
  player.leftShare = 0.5 + 0.05 * skillLv(prog, 'twinblades'); // a Phantom's left dagger: its share of a blow (Twin Blades)
  player.doubleAttack = dagger ? 5 * skillLv(prog, 'doubleattack') : 0; // Double Attack: % of normal attacks that strike twice
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
ui.heroName = () => (player.look.name || '') + (player.look.name && goals.title ? ` · ${goals.title}` : ''); // (an achievement's title, worn: goals.js)

const cam = { yaw: save?.yaw ?? 0, dist: save?.dist ?? 12, target: new THREE.Vector3(), shake: 0 };

// ---------- maps and warp portals ----------
// go to a map: its monsters, tiles and ground; at = where to stand (else beside the portal back)
const visited = new Set(save?.visited || ['camp']); // lands walked, for the Ferryman
quests.seen = visited; // (a secret series waits for every land it names: quests.js needZones)
// a hidden portal (world.js portal.need) opens once its quest is done, or its last task is: the Sphinx
// Eye set in the Great Desert's obelisk (The Sphinx's Riddle 6) opens the way to Sphinx Sands, the World
// Tree's seed planted in the Old Forest (The World Tree 6) the way to Yggdrasil
world.open = (need) => quests.done.includes(need) || (need in quests.active && quests.ready(need, inv));
// Keepers whose ledger you have signed (the camp's is signed from the start), and where you saved
const keepers = new Set(save?.keepers || ['keeper_camp']);
let savePoint = save?.savePoint || null; // { keeper, map, x, z }; none = the camp fire
const groundLeft = {}; // per map: the drops left lying there (fx.stashPickups); their time runs on
const MAP_BUDGET = 6; // built maps kept at once (world.evict): the current one and the five last walked
let recentMaps = [];
let cine = null; // a cutscene's shot, or the hero's making: the camera frames its own point (cineShot)
// the Deep Halls (delve.js): the floor the hero is on, the deepest reached (saved), and the floor they are sent to.
// Whoever has `delve` in NPCS sends them down (the fifth city's Ship Captain, once made: the owner's call), and the
// stairs up bring them home beside that person (none yet: Steinborg's gate)
const delve = { floor: 0, best: save?.delve?.best | 0, pending: 0 };
const delverOf = () => Object.values(NPCS).find((n) => n.delve);
const delverSpot = () => { const n = delverOf(); return n ? { map: n.map || 'camp', x: n.x, z: n.z + 1.4 } : { map: 'city', x: 36.4, z: 53 }; };
function enterMap(id, from, at) {
  // a floor of the Deep Halls: the next one down, or the one the hero is sent to, carved afresh before it is built
  if (isDelve(id)) {
    delve.floor = isDelve(from) ? delve.floor + 1 : delve.pending || 1;
    delve.pending = 0;
    if (world.built.has(id)) world.unbuild(id);
    prepareFloor(id, delve.floor);
    delete mobs.fieldAt[id];
    at = at || DELVE_START;
  } else if (isDelve(from) && !at) { const h = delverSpot(); id = h.map; at = h; } // (the stairs up: home beside the one who sent them)
  if (world.id) groundLeft[world.id] = fx.stashPickups();
  if (!sceneKeep) { clearTraps(); doll = null; } // (traps stay where they were set; a bound monster stays behind; a cutscene's shots keep both)
  const arrive = world.go(id, from);
  visited.add(id);
  // a phone's memory: only the maps last walked stay built (the rest are made again when entered; their monsters,
  // drops and bosses are kept as ever). Not during a cutscene, which passes through many maps for a moment
  recentMaps = [id, ...recentMaps.filter((m) => m !== id)].slice(0, MAP_BUDGET);
  if (!cine) world.evict(recentMaps);
  let pos = at || arrive;
  mobs.setMap(SPAWNS[world.id], 11 + world.id.length);
  if (isDelve(world.id)) delveArrive();
  villagers.show(world.id);
  player.tiles.rebuild();
  fx.restorePickups(groundLeft[world.id]);
  delete groundLeft[world.id];
  player.stop();
  // an arrival with no portal behind it (a carter, a feather) lands at the map's middle, which on some maps is a lake
  // (Fen Shore, Willow Marsh) or a fountain: the nearest open tile instead, so the hero is never stranded
  const free = (x, z) => world.walkable(x, z) && !player.tiles.blocked[Math.floor(z) * 64 + Math.floor(x)];
  if (!free(pos.x, pos.z)) {
    search: for (let r = 1; r < 24; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const x = Math.floor(pos.x) + dx + 0.5, z = Math.floor(pos.z) + dz + 0.5;
      if (x > 1 && z > 1 && x < 63 && z < 63 && free(x, z)) { pos = { x, z }; break search; }
    }
  }
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
player.on('swing', () => { audio.play('swing'); if (player.hiddenT > 0) unhide(true); }); // (attacking out of Vanish ends it)
player.on('noammo', () => menus.message('Equip arrows to shoot (the Arrows slot)'));
// the first weak elemental hit ever explains the grey number, once
function weakTip(m, el) {
  if (story.flags.elementTip) return;
  story.flag('elementTip');
  const E = (e) => e[0].toUpperCase() + e.slice(1);
  menus.message(`A weak hit! ${E(el)} barely hurts the ${m.def.name}, which is ${E(m.def.el)}. Grey numbers mean the wrong element: try another weapon or spell.`);
}
player.on('strike', (m, res) => {
  const y = overHead(m, m.sprite.scale.y * 0.8) + (res.left ? 0.3 : 0); // (a Phantom's left-hand blow, a little above the right's)
  if (res.miss) fx.number(m.x, y, m.z, 'Miss', 'miss');
  else {
    fx.number(m.x, y, m.z, res.dmg, res.crit || res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
    if (res.el < 1) weakTip(m, player.ps.el);
    audio.play('hit');
    cardOnHit(m, res.dmg);
    // Double Attack (an Assassin's dagger): a normal blow now and then strikes twice
    if (!res.skill && !res.left && player.doubleAttack && m.alive && Math.random() * 100 < player.doubleAttack) {
      m.hit(res.dmg, 0, 0);
      fx.number(m.x, y + 0.35, m.z, 'Double!', 'skill');
      fx.number(m.x, y, m.z, res.dmg, 'dealt');
    }
    // the Goblin Warlord Card's Frenzy: a blow struck up close now and then lands twice
    if (!player.bow && player.ps.double && m.alive && Math.random() * 100 < player.ps.double) {
      m.hit(res.dmg, 0, 0);
      fx.number(m.x, y + 0.35, m.z, 'Twice!', 'skill');
      fx.number(m.x, y, m.z, res.dmg, 'dealt');
    }
    if (player.bow) arrowLanded();
    // the Voodoo's Toxic Blade: a dagger's blow may add a stack of Blight
    if (!res.skill && weaponKind() === 'dagger' && skillLv(prog, 'toxicblade') && Math.random() < 0.1 * skillLv(prog, 'toxicblade')) { proc('toxicblade', m); blight(m, 1); }
    // Battle Rhythm: every third hit that lands gives back 3 SP, so a Blader keeps swinging skills
    if (skillLv(prog, 'rhythm') && ++rhythm % 3 === 0) { const n = player.healSp(3); if (n > 0) fx.number(player.x, overHead(player, 1.5), player.z, n, 'sp'); }
  }
});
player.on('hurt', (n) => {
  ui.hurt(); cam.shake = 0.2; audio.play('hurt');
  fx.number(player.x, overHead(player, 1.3), player.z, n, 'taken');
});
mobs.on('cornered', (m) => { if (m.story) fx.number(m.x, overHead(m, m.sprite.scale.y * 0.9), m.z, 'Cornered!', 'skill'); }); // (the Gel Thief turns to fight)
// support monsters (mobs.js supportTick): a Dryad mends a monster near it, a Pharaoh's Servant shields one
mobs.on('mend', (m, o, n) => { fx.number(o.x, overHead(o, o.sprite.scale.y * 0.9), o.z, `+${n}`, 'heal'); fx.sparkle(o.x, overHead(o, o.sprite.scale.y * 0.5), o.z, '#9aff7a', 10); });
mobs.on('shield', (m, o) => { fx.number(o.x, overHead(o, o.sprite.scale.y * 0.9), o.z, 'Shield', 'skill'); fx.sparkle(o.x, overHead(o, o.sprite.scale.y * 0.5), o.z, '#7ac8ff', 12); });
mobs.on('shieldbreak', (o) => fx.sparkle(o.x, overHead(o, o.sprite.scale.y * 0.5), o.z, '#bfe6ff', 8));
mobs.on('thorns', (m, n) => fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, n, 'dealt')); // Bark Armor's
mobs.on('miss', (m, res) => {
  const t = m.foe || player; fx.number(t.x, overHead(t, 1.3), t.z, res.dodge ? 'Lucky!' : 'Miss', 'miss');
});
// the beasts: their bites and dives, the blows they take, the Bear's roar, a beast that falls
allies.on('strike', (b, m, res) => {
  if (!m.alive) return;
  const y = overHead(m, m.sprite.scale.y * 0.8);
  if (res.miss) { fx.number(m.x, y, m.z, 'Miss', 'miss'); return; }
  fx.number(m.x, y, m.z, res.dmg, res.crit ? 'crit' : 'dealt');
  const dx = m.x - b.x, dz = m.z - b.z, d = Math.hypot(dx, dz) || 1;
  m.hit(res.dmg, dx / d * 0.3, dz / d * 0.3, b);
  audio.play('hit');
  if (b.kind === 'hawk') { const wt = skillLv(prog, 'windtalons'); if (wt) inflict(m, { kind: 'stun', chance: () => 2 * wt, dur: 1 }, wt, res.dmg); }
  // the beasts' instincts (allies.js INSTINCTS): the Bear's Maul stuns, a Wolf's Hamstring slows (bosses:
  // a third of the chance to be stunned, half as long either way)
  const longer = b.ps.sharp?.dur || 1; // (KNL: a sharper instinct holds it longer)
  if (res.instinct === 'bear') inflict(m, { kind: 'stun', chance: () => 100, dur: 1.5 * longer }, 1, res.dmg);
  if (res.instinct === 'wolf' && m.alive) {
    const boss = m.def.boss || m.def.mvp;
    m.slowT = (boss ? 2 : 4) * longer; m.slowBy = 0.4;
    fx.number(m.x, y + 0.35, m.z, 'Slowed', 'miss');
  }
  if (m.alive && m.foe?.kind !== 'bear' && (!b.K.fly || m.def.ai === 'archer') && Math.random() < 0.35) m.foe = b; // it may turn on the beast that bit it (only a shooter on the Hawk)
});
allies.on('instinct', (b, I) => { fx.number(b.x, overHead(b, b.sprite.scale.y * 0.9), b.z, `${I.name}!`, 'skill'); audio.play(b.kind === 'bear' ? 'night' : 'swing'); });
allies.on('hurt', (b, n) => fx.number(b.x, overHead(b, b.sprite.scale.y * 0.7), b.z, n, 'taken'));
allies.on('taunt', (b) => { fx.number(b.x, overHead(b, b.sprite.scale.y * 0.9), b.z, 'Roar!', 'skill'); audio.play('night'); for (const o of allies.list) if (o !== b) fx.sparkle(o.x, overHead(o, o.sprite.scale.y * 0.6), o.z, '#ffc04a', 4); });
allies.on('fade', (b) => { fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.8, b.z, b.K.aura, 10); applyStats(); }); // an illusion's time runs out
allies.on('fall', (b) => {
  fx.puff(b.x, world.heightAt(b.x, b.z) + 0.4, b.z, b.K.w || 0.7);
  if (b.K.illusion) { menus.message(`Your ${b.name.toLowerCase()} shatters.`); applyStats(); return; }
  const id = SUMMONS[b.kind];
  skillCd[id] = Math.max(skillCd[id] || 0, 20); // a fallen beast can be called back after a rest
  menus.message(`Your ${b.name} falls back to the wild to lick its wounds. Call it again in 20 s.`);
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
  const ps = player.ps; // the cards' kill effects: Rainbow Rush (attack speed), Devour (HP and SP back)
  if (ps.swift && !m.def.decoy) { buffs.swift = 5; applyStats(); }
  if (ps.devour && !m.def.decoy && player.state !== 'down') { player.heal(Math.round(player.maxHp * ps.devour / 100)); player.healSp(Math.round(player.maxSp * ps.devour / 100)); }
  // the Shadowblade's Night Stalker: a kill melts you into the shadows, the next blow an Ambush
  const ns = skillLv(prog, 'nightstalker');
  if (ns && !m.def.decoy && player.state !== 'down' && Math.hypot(m.x - player.x, m.z - player.z) < 6) hide(1 + 0.4 * ns);
  // the Voodoo's Soul Siphon: a Blighted monster's death gives SP back, and its Blight leaps on
  const sip = skillLv(prog, 'soulsiphon');
  if (sip && m.blight > 0 && m.blightT > 0 && !m.def.decoy) {
    player.healSp(Math.round(player.maxSp * sip / 100));
    const next = mobs.list.filter((o) => o.alive && o !== m && Math.hypot(o.x - m.x, o.z - m.z) < 3).sort((a, b) => Math.hypot(a.x - m.x, a.z - m.z) - Math.hypot(b.x - m.x, b.z - m.z))[0];
    if (next) { fx.zap({ x: m.x, y: overHead(m, 0.6), z: m.z }, { x: next.x, y: overHead(next, 0.6), z: next.z }, '#7aff4a'); blight(next, Math.ceil(m.blight / 2)); }
  }
  m.blight = 0;
  if (m === doll) doll = null;
  if (!m.def.decoy && MOB_DEFS[m.type]) { album.kill(m.type); goalEvent({ kind: 'kill', lv: m.def.lv, type: m.type, boss: !!m.def.boss, mvp: !!m.def.mvp, heroLv: prog.baseLv }); }
  if (raids.raid && m.def.raidLv) { raids.raid.exp[0] += m.def.exp[0] * RATES.base; raids.raid.exp[1] += m.def.exp[1] * RATES.job; } // a raid holds its EXP until the run ends
  else gainExp(m.def.exp[0], prog.job === 'novice' && m.def.tjob ? m.def.tjob : m.def.exp[1], RATES); // (a Trainee earns a bloop field's big Job EXP: tjob)
  for (const id of quests.onKill(m.type)) questComplete(id);
  story.onKill(m.type);
  for (const [base, count] of drops) {
    const item = maybeSlotted(base); // now and then a piece of gear drops with a card slot
    fx.drop(m.x, m.z, item, count, iconTexture(item), !!ITEMS[item]?.rare);
    if (ITEMS[item].rare || item !== base) { // a rare find: a golden burst and a word, like Ragnarok's drop glow
      fx.sparkle(m.x, world.heightAt(m.x, m.z) + 0.5, m.z, '#ffd23a', 20);
      audio.play('heart');
      menus.message(`${ITEMS[item].rare ? 'Rare drop' : 'A slotted find'}! The ${m.def.name} dropped ${ITEMS[item].name}.`);
    }
  }
});

// a Sand Scorpion's sting (def.poison): poisoned for 6 s
mobs.on('venom', (m) => {
  if (!(player.poisonT > 0)) { player.poisonTick = 1; menus.message(`The ${m.def.name}'s sting poisons you! Green Herbs cure it.`); }
  player.poisonT = 6;
  fx.number(player.x, overHead(player, 1.7), player.z, 'Poisoned', 'miss');
});
mobs.on('spore', (m) => {
  audio.play('spore');
  const y = world.heightAt(m.x, m.z) + 0.4;
  fx.cloud(m.x, y, m.z);
  if (Math.hypot(player.x - m.x, player.z - m.z) < 2.6 && !player.ps.sureFoot) { // (Sea Legs: spores can't slow you)
    if (player.slowT <= 0) menus.message(m.def.puff || 'Spores! You feel sluggish');
    player.slowT = 2.2;
  }
});

// ---------- the MVP ----------
mobs.on('windup', (m) => { // a boss raises its fists: the stomp lands round it (3.2 paces) when the red circle fills
  audio.play('swing');
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff8a3a', 10);
  fx.warn(m.x, m.z, 3.2, m.special);
});
mobs.on('stomp', (m) => { // the ground bursts around the boss
  const y = world.heightAt(m.x, m.z);
  fx.puff(m.x, y + 0.2, m.z, 2.4);
  fx.sparkle(m.x, y + 0.3, m.z, '#ff6a1a', 24);
  audio.play('hit');
  if (Math.hypot(player.x - m.x, player.z - m.z) > 3.2) return;
  cam.shake = 0.35;
  if (!player.canBeHit()) return;
  const res = mobAttack(m.def, player.ps, (m.def.stomp || 1.5) * m.fury, fierce(m.def) ? MVP_MOVE : undefined);
  if (res.miss) fx.number(player.x, overHead(player, 1.3), player.z, 'Miss', 'miss');
  else player.takeDamage(res.dmg, m.x, m.z);
});
// ---------- boss moves: src/bossmoves.js (red circles, each boss's mechanic, the MVP's rewards) ----------
const { burnTick, matchupHint } = installBossMoves({ allies, audio, cam, fx, gainExp, inv, mobs, overHead, persist, player, scene, world, get menus() { return menus; } });

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
  for (const m of [...mobs.list]) if (m.temp && m.alive && !m.story && MOB_DEFS[m.type].noRespawn && !Object.keys(quests.active).some((k) => QUESTS[k].mob === m.type && !quests.ready(k, inv))) mobs.remove(m);
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
  if (map === world.id && s.kind === 'talk') ui.goal = { x: NPCS[s.npc].x, z: NPCS[s.npc].z, label: NPCS[s.npc].name };
  else if (map === world.id && s.spawn) { // a story monster (the Gel Thief): the ring and the arrow follow it
    const m = mobs.list.find((o) => o.story && o.type === s.spawn.mob && o.alive);
    ui.goal = m ? { get x() { return m.x; }, get z() { return m.z; }, label: m.def.name, mob: true } : null;
  } else if (map === world.id && s.kind === 'search') { // the nearest thing still to be found here
    const sp = story.toFind().filter((p) => p.map === world.id).sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z))[0];
    if (sp) ui.goal = { x: sp.x, z: sp.z, label: s.thing };
  } else if (map === world.id && s.at) ui.goal = { x: s.at.x, z: s.at.z, label: s.kind === 'survive' ? 'Here' : '' };
  else if (map && map !== world.id) { const p = route(world.id, map); if (p) ui.goal = { x: p.x, z: p.z, label: ZONE_NAMES[p.to] }; }
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
      if (p.to in seen || (p.need && !world.open(p.need))) continue; // (a hidden portal still shut)
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
// a floor of the Deep Halls reached: its monsters made stronger past the deepest level, the record, and every fifth
// floor's cache the first time
function delveArrive() {
  const k = delve.floor;
  for (const m of mobs.list) deepen(m, k);
  menus.message(`The Deep Halls · Floor ${k}${DEPTH.mult(k) > 1 ? ` · the monsters are ${Math.round((DEPTH.mult(k) - 1) * 100)}% stronger` : ''}. The stairs down are at the far end.`);
  if (k > delve.best) {
    delve.best = k;
    if (k % DEPTH.every === 0) {
      const r = DEPTH.cache(k);
      giveReward(r);
      menus.message(`A delver's cache on Floor ${k}! You can be sent straight here from now on.`);
    }
  }
}
// the Keepers' road to a quest's place: { map, npc, keeper, fare } when the hero stands in a town with a Keeper
// and has signed the ledger of the town the place is in (fields have no Keeper: the road ends at a town)
function keeperRoad(id) {
  const t = questTarget(id);
  if (!t || t.map === world.id || warping || raids.raid) return null;
  const hereKeeper = Object.entries(NPCS).some(([k, n]) => k.startsWith('keeper_') && (n.map || 'camp') === world.id);
  const [k] = Object.entries(NPCS).find(([kk, n]) => kk.startsWith('keeper_') && (n.map || 'camp') === t.map && keepers.has(kk)) || [];
  return hereKeeper && k ? { map: t.map, npc: t.npc, keeper: k, fare: FARES[t.map] } : null;
}
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
  if (q.kind === 'escort') return questWorld.escort?.id === id ? { map: q.map, at: q.to, why: q.place } : { map: q.map, npc: q.who, why: `${NPCS[q.who].name}: stand beside them to set off` };
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

// ---------- the story's stands: src/stands.js (survive steps, story searches, a step's own monster) ----------
const stands = installStands({ audio, cam, fx, mobs, overHead, persist, player, refreshQuests, story, world, get menus() { return menus; }, get skillClock() { return skillClock; }, get storyLive() { return storyLive; }, get warping() { return warping; } });
const { tickVigil, tickStorySearch, tickStorySpawn } = stands;

const raids = installRaids({ audio, cam, fx, gainExp, goalEvent, inv, lib, mobs, persist, player, prog, refreshQuests, save, story, warp, world, get menus() { return menus; }, get warping() { return warping; }, get storyLive() { return storyLive; }, get questWorld() { return questWorld; } });
const { raidsDone, raidLog, raidOf, boatSpot, mobPortrait, raidInfo, raidGo, tickRaid } = raids;
// ---------- quests out in the world: src/questworld.js (searches, defences, rare hunts, the Sphinx's door) ----------
const questWorld = installQuestWorld({ audio, cam, fx, inv, mobs, player, questComplete, quests, refreshQuests, world, villagers, secretScene: (id) => queueScene(SECRET_SHOTS[id]), handIn: (id) => menus.hooks.handIn(id), get menus() { return menus; }, get dayNight() { return dayNight; } });
const { tickQuestWorld } = questWorld;

// ---------- the story ----------
const storyLive = () => !!story.flags.intro && !story.done; // after the opening pages
// a step is done: its lines play, then the reward, then the next step is announced
function storyDone() {
  const s = story.advance();
  const say = typeof s.say === 'function' ? s.say(story.flags, prog, quests) : s.say; // (a step's lines may depend on how it went)
  menus.story(say || [], `${s.ch} · ${s.title}`, () => {
    if (s.reward) giveReward(s.reward);
    audio.play('heart');
    const next = story.step;
    if (next) menus.message(`Story: ${next.title}. ${next.goal}`);
    storyScenes(s, next); // (its big moment, and the next chapter's opening: played once the hero is out of a fight)
    refreshQuests();
    persist();
    if (s.id === 'paths') toTrainer(); // (the Elder sends the hero on to the path they picked)
  });
}
// Elder Halvard's choice made: the hero is taken straight to the picked path's city, beside its trainer
function toTrainer() {
  const c = CALLINGS[story.flags.pick];
  if (!c || world.id === c.city) return;
  const [, n] = Object.entries(NPCS).find(([, v]) => v.map === c.city && v.job === c.job) || [];
  // and the town is saved as the hero's: its Keeper signs them in, and they wake there after a fall
  // (and Return Feathers bring them there), as a Save here at that Keeper would
  const [k, kn] = Object.entries(NPCS).find(([id, v]) => id.startsWith('keeper_') && v.map === c.city) || [];
  if (k) { keepers.add(k); savePoint = { keeper: k, map: kn.map, x: kn.x, z: kn.z + 1.4 }; }
  menus.message(`Elder Halvard sends you on to ${ZONE_NAMES[c.city]}: ${c.trainer} is waiting.${k ? ` Saved at ${ZONE_NAMES[c.city]}: you will wake here after a fall.` : ''}`);
  warp(c.city, null, n ? { x: n.x, z: n.z + 1.6 } : null); // (warp saves the game)
}
function checkStory() {
  if (!storyLive() || menus.isOpen('story')) return;
  // a Trainee grown to Job 9 on the way through Chapter 1 is called home to choose a path (not in the
  // middle of a stand)
  const was = story.step;
  if (!stands.vigil && story.callHome(prog)) {
    const next = story.step;
    storyScenes(was, next);
    menus.story(CALL_HOME, `${next.ch} · Called Home`, () => {
      audio.play('heart');
      menus.message(`Story: ${next.title}. ${next.goal}`);
      refreshQuests();
      persist();
    });
    return;
  }
  if (story.met({ prog, hotbar, skillLv, keepers, inv, quests })) storyDone();
}
// ---------- the guided lessons: src/lessons.js (the Prologue's, a job's skills, the crafters', the goal arrow) ----------
const { guide, win, GUIDES, tickGuide, tickGoalArrow, startStory, collect } = installLessons({ audio, camera, inv, persist, prog, refreshQuests, story, storyLive, ui, world, get menus() { return menus; }, get hotbar() { return hotbar; }, get cine() { return cine; } });

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
  // the story step's guided lesson, again (it shows once by itself)
  hasGuide: () => storyLive() && !!GUIDES[story.step?.id] && !guide.running,
  guideMe() { delete story.flags[`guide_${story.step?.id}`]; },
  // story pages that ask (the Seeress's rune-reading): each answer counts toward a calling
  storyFlags: () => story.flags,
  storyPic: (p) => (p.job ? jobPic(p.job) : p.mob ? mobPortrait(p.mob) : ''), // (a job on the hero, or a monster)
  storyChoice: (key) => {
    audio.play('ui');
    if (key.includes(':')) { const [k, v] = key.split(':'); story.flags[k] = v; return; } // a pick (pick:blade): kept as it is
    const c = (story.flags.calling ||= {}); c[key] = (c[key] || 0) + 1; story.flags.lastCall = key; // an answer: counted toward a calling
  },
  storyFx: (o) => { if (o?.shake) cam.shake = o.shake; if (o?.sound) audio.play(o.sound); },
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
  // the Quest View's Keepers' road: from a town with a Keeper, to the quest's or the story's place in another town
  // whose Keeper's ledger the hero has signed, for that Keeper's fare, arriving beside the person wanted (the
  // pacing pass: fewer walks back and forth for a talk)
  keeperRoad: (id) => keeperRoad(id),
  // the Deep Halls' guide (the fifth city's Ship Captain, once made): the deepest floor reached, the checkpoint they can
  // be sent to, and whether they may go
  delveInfo: () => ({ best: delve.best, cp: checkpoint(delve.best), open: prog.baseLv >= DEPTH.open, lv: DEPTH.open }),
  delveGo(k) {
    if (prog.baseLv < DEPTH.open || (k !== 1 && k !== checkpoint(delve.best))) return;
    delve.pending = k;
    menus.close('talk');
    warp('delveA', null);
  },
  keeperRoadGo(id) {
    const r = keeperRoad(id);
    if (!r || inv.perz < r.fare) return;
    inv.perz -= r.fare;
    menus.close();
    const n = r.npc && NPCS[r.npc], k = NPCS[r.keeper];
    warp(r.map, null, n ? { x: n.x, z: n.z + 1.4 } : { x: k.x, z: k.z + 1.4 });
  },
  keeperGo(k) {
    const n = NPCS[k], fare = FARES[n.map || 'camp'];
    if (!keepers.has(k) || inv.perz < fare) return;
    inv.perz -= fare;
    menus.close('talk');
    warp(n.map || 'camp', null, { x: n.x, z: n.z + 1.4 });
  },
  // Ivar the Ferryman: the lands you have walked, and his fares
  ferryList: () => Object.entries(FARES).filter(([m]) => (visited.has(m) || ALWAYS_FARES.includes(m)) && m !== world.id),
  // the Boatman: the raid's difficulties and the tide
  raidInfo: (id) => raidInfo(id),
  mobPortrait: (art) => mobPortrait(art),
  raidGo: (id, diff, anywhere) => raidGo(id, diff, anywhere),
  // the Raids window: every raid, its guide and land, open to them (done once) or not, and its tide
  raidLog: () => raidLog,
  // the Quests window: the story's step and chapters, and every quest by kind (job trials, series,
  // side quests): under way, ready to hand in, on offer (or waiting on a level), and done
  watchChapter(ch) { const shots = chapterShots(ch); if (!shots.length) return; menus.close(); queueScene(shots); if (!sceneSafe()) menus.message('The cutscene plays once you are out of the fight.'); },
  questBook: () => {
    const s = story.step, chapters = [];
    STORY.forEach((st, i) => { let c = chapters.at(-1); if (!c || c.ch !== st.ch) chapters.push(c = { ch: st.ch, n: 0, done: 0 }); c.n++; if (i < story.i) c.done++; });
    for (const c of chapters) c.watch = storyLive() || story.done ? chapterShots(c.ch).length > 0 && (c.done > 0 || c.ch === s?.ch) : false; // (a chapter reached: its cutscenes again)
    const main = storyLive() && s ? { ch: s.ch, title: s.title, goal: s.goal + story.progress(), where: story.directions(world.id, prog) } : null;
    const kind = (id) => (SERIES[id] || QUESTS[id].job ? 'job' : /\d+:/.test(QUESTS[id].title) ? 'series' : 'side');
    const rows = [], seen = new Set();
    const row = (id, state, npc = questGiver(id)) => {
      if (seen.has(id) || !QUESTS[id]) return;
      seen.add(id);
      const q = QUESTS[id], n = NPCS[npc];
      rows.push({ id, kind: kind(id), state, title: q.title, lv: q.lv || 0, progress: state === 'active' ? quests.progress(id, inv) : '', giver: n?.name || '', land: n ? ZONE_NAMES[n.map] : '' });
    };
    for (const id of Object.keys(quests.active)) row(id, quests.ready(id, inv) ? 'ready' : 'active');
    for (const npc of Object.keys(NPCS)) {
      const st = quests.status(npc, prog, inv);
      if (st.id && !st.secret && ['offer', 'locked', 'job'].includes(st.state)) row(st.id, st.state, npc); // (a secret series stays out of sight)
    }
    for (const id of quests.done) row(id, 'done');
    return { main, chapters, rows, storyDone: story.done };
  },
  raidList: () => Object.entries(RAIDS).map(([id, R]) => ({ id, R, guide: NPCS[R.npc].name, land: ZONE_NAMES[R.from], done: raidsDone.has(id), ...raidInfo(id) })),
  ferry(map) {
    const fare = FARES[map];
    if ((!visited.has(map) && !ALWAYS_FARES.includes(map)) || inv.perz < fare) return;
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
    // a new Assassin is handed a Rusty Dagger, put in hand at once
    if (job === 'assassin' && first) {
      if (!inv.bag.count('rusty_dagger') && !Object.values(inv.gear).includes('rusty_dagger')) { inv.add('rusty_dagger', 1); menus.toast('rusty_dagger', 1); }
      if (ITEMS[inv.gear.weapon]?.kind !== 'dagger' && inv.bag.count('rusty_dagger')) inv.equip('rusty_dagger');
    }
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
    if (mode === 'refine' && res.ok) { goals.bestRefine = Math.max(goals.bestRefine, parseKey(res.key).refine); goalEvent({ kind: 'refine' }); }
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
    goalEvent({ kind: 'quest' });
    // a series (the job trials) carries straight on to its next step
    if (NEXT[id]) { quests.accept(NEXT[id]); menus.message(`Step done. Next: ${QUESTS[NEXT[id]].title}`); }
    refreshQuests();
    menus.render();
    persist();
  },
  ui() { audio.play('ui'); },
  soundOn: () => audio.enabled,
  toggleSound() { audio.setEnabled(!audio.enabled); },
  setting: (k) => settings.get(k),
  albumSets: () => albumSets(),
  goals: () => ({ weekly: (goals.weekly?.goals || []).map((g) => ({ ...g, text: WEEKLY[g.kind].text(g), reward: weeklyReward(g.kind, goals.weekly.lv) })), ends: goals.weekly ? weekEnds(goals.weekly.week) : 0,
    ach: ACHIEVEMENTS.map((a) => ({ ...a, at: goals.ach[a.id] || 0 })), title: goals.title }),
  wearTitle(t) { goals.title = t && ACHIEVEMENTS.some((a) => a.title === t && goals.ach[a.id]) ? t : null; persist(); },
  album: () => albumRows(MOB_DEFS, album, CARD_OF, livesAt, (type, id) => { const base = MOB_DEFS[type].drops.find(([i]) => i === id)?.[3]; return base ? pityChance(base, mobs.pity[type]?.[id]) : null; }),
  setSetting(k, v) { settings.set(k, v); },
  closed() { persist(); },
  // Settings' Back to main menu: save, and back to the title to pick a hero (not in a raid)
  toTitle() {
    if (raidOf(world.id)) { menus.message('Finish the raid first.'); return; }
    persist();
    resetting = true;
    toSelectNext();
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
    if (mode === 'new') { cine = null; cam.dist = 12; cam.yaw = 0; villagers.show(world.id); startStory(); }
  },
});
menus.quests = quests;
const portraits = {};
menus.portrait = (id) => (id === 'player' ? (portraits[`${prog.job}|${player.look.body}|${jobArt().dressed}`] ||= jobArt().anims.down.idle[0].image.toDataURL())
  : (portraits[id] ||= lib.villagers[id].loaded ? lib.villagers[id].anims.down.idle[0].image.toDataURL() : ''));
// things in camp and town you tap to use: the player walks over, then it opens. h = height on screen
// someone the story has taken off the map (Torvald, once unmasked: story.js 'unmasked')
const AWAY = { torvald: 'unmasked' };
const awayNow = (npc) => AWAY[npc] && STORY.findIndex((st) => st.id === AWAY[npc]) < story.i;
villagers.away = awayNow;
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
    const own = SKILLS[s.id].cd ? Math.max(0, (skillCd[s.id] || 0) / SKILLS[s.id].cd) : 0;
    return Math.max(own, skillLock > 0 ? skillLock / SKILL_LOCK : 0); // (the half second after any skill)
  },
  skill(id) { const lv = skillLv(prog, id), sp = lv ? spNeed(id, lv) : 0; return { lv, sp, ok: player.sp >= sp }; },
  changed() { if (menus.open) menus.render(); persist(); },
});
hotbar.load(save?.hotbar);

// ---------- the attack button, beside the hotbar: a normal attack on the target, or the nearest monster ----------
let selMob = null; // the selected monster: the one last tapped, attacked or aimed at, kept after a cast or a walk
// the selected monster while it is still a fair target: alive, on this map and near enough
const selected = () => (selMob?.alive && selMob.sprite.visible && mobs.list.includes(selMob) && Math.hypot(selMob.x - player.x, selMob.z - player.z) < 20 ? selMob : null);
const atkBtn = document.createElement('button');
atkBtn.id = 'atkbtn';
atkBtn.dataset.btn = 'attack';
atkBtn.setAttribute('aria-label', 'Attack');
atkBtn.title = 'Attack the target, or the nearest monster';
document.getElementById('hud').appendChild(atkBtn);
// it shows the weapon in hand (a fist with none)
const atkFace = () => { const w = inv.gear.weapon; atkBtn.innerHTML = w ? `<img src="${iconURL(w)}" alt="">` : '<span>✊</span>'; };
inv.onChange(atkFace);
atkFace();
// it sits just left of the hotbar, whose width changes with its pages
function placeAtkBtn() {
  const hb = document.getElementById('hotbar').getBoundingClientRect();
  if (!hb.width) return;
  // always beside it, on the left (the hotbar's slots shrink on a narrow screen so both fit: style.css)
  // (in screen px, then into the button's own zoomed px: the Interface size)
  const z = settings.get('uiScale') || 1, ab = atkBtn.getBoundingClientRect();
  atkBtn.style.left = `${Math.max(4, hb.left - ab.width - 8) / z}px`;
  atkBtn.style.top = `${(hb.top + (hb.height - ab.height) / 2) / z}px`;
  // the quest list ends above the hotbar (on a short screen it scrolls rather than run under it)
  const ql = document.querySelector('#quests .qlist');
  // (held upright: never over about one quest's height, 165px, so it doesn't cover the field; it scrolls)
  const cap = innerHeight > innerWidth ? 165 : 230;
  if (ql?.offsetParent) ql.style.maxHeight = `${Math.max(56, Math.min(cap, innerHeight * 0.34, hb.top - ql.getBoundingClientRect().top - 8)) / (settings.get('uiScale') || 1)}px`; // (in its own zoomed px)
}
window.addEventListener('resize', placeAtkBtn);
setInterval(placeAtkBtn, 500);
// the nearest monster on screen (in sight), however far: a melee hero walks to it, a bow shoots from range
const sightV = new THREE.Vector3();
function nearestInSight() {
  let best = null, bd = Infinity;
  for (const m of mobs.list) {
    if (!m.alive || !m.sprite.visible) continue;
    sightV.set(m.x, world.heightAt(m.x, m.z) + 0.5, m.z).project(camera);
    if (sightV.z > 1 || Math.abs(sightV.x) > 1 || Math.abs(sightV.y) > 1) continue; // off screen
    const d = Math.hypot(m.x - player.x, m.z - player.z);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}
function attackNow() {
  if (player.state === 'down') return;
  const t = (player.goal?.mob?.alive && mobs.list.includes(player.goal.mob) && player.goal.mob) || selected() || nearestInSight();
  if (!t) { menus.message('No monster nearby'); return; }
  stopNav();
  selMob = t;
  player.command({ mob: t });
}
menus.hotbar = hotbar;

// ---------- items and skills in use ----------
const roll = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
function useItem(id) {
  const u = ITEMS[id]?.use;
  if (!u || !inv.bag.count(id) || player.state === 'down') return;
  if (u.full && player.hp >= player.maxHp && player.sp >= player.maxSp) { menus.message('Your HP and SP are already full'); return; }
  if (u.hp && !u.cure && player.hp >= player.maxHp) { menus.message('Your HP is already full'); return; }
  if (u.sp && player.sp >= player.maxSp) { menus.message('Your SP is already full'); return; }
  inv.bag.remove(id, 1);
  const y = overHead(player, 1.3);
  if (u.hp) {
    const n = player.heal(roll(u.hp));
    fx.number(player.x, y, player.z, n, 'heal');
  }
  if (u.sp) fx.number(player.x, y, player.z, player.healSp(roll(u.sp)), 'sp');
  if (u.cure) { player.slowT = 0; player.poisonT = 0; } // (spores' slow, and a scorpion's venom)
  if (u.full) { // (a World Tree Berry: everything back, and every ill gone)
    const n = player.heal(player.maxHp); if (n > 0) fx.number(player.x, y, player.z, n, 'heal');
    fx.number(player.x, y + 0.3, player.z, player.healSp(player.maxSp), 'sp');
    player.slowT = 0; player.poisonT = 0;
  }
  if (u.buff) { buffs[u.buff] = u.t; applyStats(); menus.message(`${ITEMS[id].name}: ${ITEMS[id].desc}`); }
  if (u.oil) { // a battle oil: the weapon's element for a while (a fresh oil replaces the last)
    oilEl = u.oil; buffs.oil = u.t; applyStats();
    fx.sparkle(player.x, y - 0.4, player.z, ELEMENTS[u.oil].color, 12);
    menus.message(weaponKind() === 'bow' ? `${ITEMS[id].name}: it won't take on a bow (the arrows set the shot), but it stays on for a blade` : `${ITEMS[id].name}: your blows are ${ELEMENTS[u.oil].name} for ${u.t / 60} minutes`);
  }
  if (u.food) { buffs[`food_${u.food}`] = u.t; applyStats(); menus.message(`${ITEMS[id].name}: ${u.food.toUpperCase()} +${u.n} for ${u.t / 60} minutes`); }
  if (u.warp === 'random') warpRandom();
  if (u.warp === 'camp') { if (savePoint) warp(savePoint.map, null, { x: savePoint.x, z: savePoint.z }); else warpTo('camp'); } // to your save point
  audio.play('pickup');
  inv.changed();
}

const skillCd = {}; // skill id -> seconds left
// after any skill, every skill waits a moment (no spamming): the hotbar sweeps it
const SKILL_LOCK = 0.5;
let skillLock = 0;
function useSkill(id) {
  const sk = SKILLS[id], lv = skillLv(prog, id);
  if (!lv || sk.kind !== 'active' || player.state === 'down' || (skillCd[id] || 0) > 0 || skillLock > 0) return;
  // skills of every job earned can be used, with the right weapon in hand
  if (!weaponOk(id, weaponKind())) { menus.message(`${sk.name} needs ${WEAPON_NAMES[sk.weapon]} in hand`); return; }
  const sp = spNeed(id, lv);
  const pay = () => {
    if (player.sp < sp) { menus.message('Not enough SP'); return false; }
    player.sp -= sp;
    if (sk.cd) skillCd[id] = sk.cd;
    skillLock = SKILL_LOCK;
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
    if (player.rootT > 0) { menus.message('Roots hold you fast!'); return; }
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
  if (['leapback', 'galestep'].includes(id) && player.rootT > 0) { menus.message('Roots hold you fast!'); return; }
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
    if (!allies.beasts.length) { menus.message('Call your beasts first'); return; }
    if (!pay()) return;
    buffs.frenzy = 15; frenzyLv = lv;
    applyStats();
    say('Pack Frenzy'); audio.play('night');
    for (const b of allies.beasts) fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.6, b.z, '#ff7a4a', 10);
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
  // ---- Assassin: Vanish ----
  if (id === 'vanish') {
    if (!pay()) return;
    player.hiddenT = 3 + lv; vanishBonus = 1 + 0.1 * lv;
    player.mat.transparent = true; player.mat.opacity = 0.35;
    player.stop();
    fx.puff(player.x, y + 0.3, player.z, 1.0);
    say('Vanish'); audio.play('dodge');
    return;
  }
  // ---- Phantom: Phantom Double, Mirage Step, Thousand Cuts ----
  if (id === 'phantomdouble') {
    if (!pay()) return;
    allies.summon('shade', 2, illusionStats(), player, { art: player.art, life: sk.dur(lv) + 2 * skillLv(prog, 'lingeringshade') });
    applyStats();
    say('Phantom Double'); audio.play('night');
    for (const b of allies.of('shade')) fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.8, b.z, '#a88aff', 14);
    return;
  }
  if (id === 'miragestep') { // a dash away, untouchable, leaving an illusion that draws the monsters
    if (player.rootT > 0) { menus.message('Roots hold you fast!'); return; }
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
    if (bx === player.x && bz === player.z) { menus.message('No room to step away'); return; }
    if (!pay()) return;
    const from = { x: player.x, z: player.z };
    allies.summon('mirage', 1, { ...illusionStats(), maxHp: Math.round(player.maxHp * 0.5) }, player, { art: player.art, life: 3 + lv + 2 * skillLv(prog, 'lingeringshade'), at: from });
    fx.zap({ x: player.x, y: y + 0.7, z: player.z }, { x: bx, y: world.heightAt(bx, bz) + 0.7, z: bz }, '#a88aff');
    player.stop();
    player.setPos(bx, bz);
    player.iframes = Math.max(player.iframes, 0.5);
    for (const m of mobs.list) if (m.alive && m.foe !== allies.of('mirage')[0] && Math.hypot(m.x - from.x, m.z - from.z) < 4 && !m.def.decoy) { m.foe = allies.of('mirage')[0]; m.provoke(); }
    applyStats();
    say('Mirage Step'); audio.play('dodge');
    return;
  }
  if (id === 'thousandcuts') { // five spins with both blades, everything close takes each
    if (!pay()) return;
    say('Thousand Cuts');
    player.atkAnim = player.atkDur = 0.35;
    const cx = player.x, cz = player.z, mult = sk.power(lv) / 100;
    repeat(sk, lv, (i) => {
      const gy = world.heightAt(player.x, player.z);
      for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 + i; fx.sparkle(player.x + Math.cos(a) * sk.area * 0.8, gy + 0.6, player.z + Math.sin(a) * sk.area * 0.8, j % 2 ? '#a88aff' : '#e8e0ff', 1); }
      audio.play('swing');
      void cx; void cz;
      for (const m of [...mobs.list]) {
        if (!m.alive || Math.hypot(m.x - player.x, m.z - player.z) > sk.area + m.def.r) continue;
        const r = dualHit(m, mult);
        inflict(m, sk.status, lv, r);
      }
    });
    return;
  }
  // ---- Shadowblade: Shadow Bloom, blades of shadow round you that blind ----
  if (id === 'shadowbloom') {
    if (!pay()) return;
    say('Shadow Bloom');
    player.atkAnim = player.atkDur = 0.35;
    const mult = sk.power(lv) / 100;
    repeat(sk, lv, (i) => {
      const gy = world.heightAt(player.x, player.z), n = 14;
      for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + i * 0.4, r = 0.6 + ((j * 5) % 4) * 0.55; fx.sparkle(player.x + Math.cos(a) * r, gy + 0.2, player.z + Math.sin(a) * r, j % 3 ? '#8a3aff' : '#e8d8ff', 1); }
      cam.shake = 0.15; audio.play('swing');
      for (const m of [...mobs.list]) {
        if (!m.alive || Math.hypot(m.x - player.x, m.z - player.z) > sk.area + m.def.r) continue;
        const r = bladeHit(m, mult, { el: 'shadow' });
        if (!r.miss) inflict(m, sk.status, lv, r.dmg);
      }
    });
    return;
  }
  // ---- Hunter: a trap set at your feet; it waits for a monster to walk in (tickTraps) ----
  if (sk.trap) {
    if (world.isSafe(player.x, player.z)) { menus.message('No traps on safe ground'); return; }
    if (traps.some((t) => Math.hypot(t.x - player.x, t.z - player.z) < 0.8)) { menus.message('A trap is set here already'); return; }
    if (!pay()) return;
    const most = 3 + Math.floor(skillLv(prog, 'trapmastery') / 5);
    while (traps.length >= most) fx.release(traps.shift().s); // the oldest is picked up again
    const s0 = fx.prop(player.x, player.z, sk.trap);
    traps.push({ kind: sk.trap, id, lv, x: player.x, z: player.z, armT: 0.6, life: 30 + 2 * skillLv(prog, 'trapmastery'), s: s0 });
    say(sk.name); audio.play('craft');
    player.atkAnim = player.atkDur = 0.25;
    fx.puff(player.x, y + 0.1, player.z, 0.6);
    return;
  }
  // ---- Voodoo: Substitute, a doll paid for in HP that takes the blows, its poison haze round it ----
  if (id === 'substitute') {
    if (player.hp <= player.maxHp * 0.25) { menus.message('Too weak to make a Substitute'); return; }
    if (!pay()) return;
    player.hp -= Math.round(player.maxHp * sk.hpCost);
    player.barrier = Math.round(player.maxHp * sk.soak(lv) + player.maxSp * 0.1);
    buffs.sub = sk.dur(lv); auraLv = lv; auraTick = 0;
    if (!subProp) subProp = fx.prop(player.x, player.z, 'doll');
    say('Substitute'); audio.play('spore');
    fx.number(player.x, overHead(player, 1.3), player.z, Math.round(player.maxHp * sk.hpCost), 'taken');
    fx.cloud(player.x, y + 0.4, player.z);
    return;
  }
  // the rest aim at your current target (the one fought, else the one selected), or the nearest monster
  const target = (player.goal?.mob?.alive && player.goal.mob) || selected() || mobs.nearest(player.x, player.z, 8);
  if (!target) { menus.message('No monster nearby'); return; }
  selMob = target;
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
  // ---- Shadowblade: Shadow Slash, Eclipse (the Ambush is the first blow out of hiding: unhide), Umbral Step ----
  if (id === 'shadowslash') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Shadow Slash');
      later(0.14, () => { if (!t.alive) return; bladeHit(t, m, { el: 'shadow' }); fx.slash(t.x, overHead(t, t.sprite.scale.y * 0.5), t.z, { x: -player.face.x, z: player.face.z }, cam); });
      fx.sparkle(target.x, world.heightAt(target.x, target.z) + 0.6, target.z, '#8a3aff', 6);
    }, { el: 'shadow' });
  }
  if (id === 'eclipse') { // harder the more the monster has lost: double at death's door
    const lost = clamp(1 - target.hp / target.def.hp, 0, 1);
    strike(sk.power(lv) / 100 * (1 + lost), 1, (t, res) => {
      say(lost > 0.5 ? 'Eclipse!' : 'Eclipse');
      cam.shake = 0.3;
      if (!res.miss) for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; fx.sparkle(t.x + Math.cos(a) * 0.8, world.heightAt(t.x, t.z) + 0.3, t.z + Math.sin(a) * 0.8, j % 2 ? '#2a1640' : '#a24aff', 1); }
    }, { el: 'shadow' });
  }
  if (id === 'umbralstep') { // a teleport to the target's back (behind where it faces), a cut at once, then hidden
    const run = (t) => {
      if (!t.alive || !pay()) return;
      const h = t.heading && Math.hypot(t.heading.x, t.heading.z) > 0.1 ? t.heading : { x: (t.x - player.x) || 1, z: t.z - player.z };
      const hd = Math.hypot(h.x, h.z) || 1, hx = h.x / hd, hz = h.z / hd, gap = t.def.r + 0.6;
      let bx = t.x - hx * gap, bz = t.z - hz * gap; // its back
      if (!world.walkable(bx, bz) || world.isSafe(bx, bz)) { const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1; bx = t.x + dx / d * gap; bz = t.z + dz / d * gap; } // (a wall behind it: its far side)
      const f0 = { x: player.x, y: y + 0.6, z: player.z };
      fx.puff(player.x, y + 0.3, player.z, 0.9);
      if (world.walkable(bx, bz) && !world.isSafe(bx, bz)) { player.x = bx; player.z = bz; player.sync(); }
      fx.zap(f0, { x: player.x, y: world.heightAt(player.x, player.z) + 0.6, z: player.z }, '#8a3aff');
      const fx0 = t.x - player.x, fz0 = t.z - player.z, fd = Math.hypot(fx0, fz0) || 1;
      player.face = { x: fx0 / fd, z: fz0 / fd };
      player.iframes = Math.max(player.iframes, 0.35);
      t.backT = skillClock + 2; // (Backstab: you stand at its back for a moment)
      const mult = sk.power(lv) / 100;
      player.atkAnim = player.atkDur = 0.3;
      fx.slash(t.x, overHead(t, t.sprite.scale.y * 0.5), t.z, player.face, cam);
      bladeHit(t, mult, { el: 'shadow' });
      for (const m of [...mobs.list]) if (m.alive && m !== t && Math.hypot(m.x - t.x, m.z - t.z) < 1.7 + m.def.r) bladeHit(m, mult / 2, { el: 'shadow' });
      hide(2);
      fx.puff(player.x, world.heightAt(player.x, player.z) + 0.3, player.z, 0.9);
      say('Umbral Step'); audio.play('dodge');
      player.command({ mob: t });
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0, run, name: sk.name } });
    return;
  }
  // ---- Hunter: Killing Shot, much harder on a monster caught ----
  if (id === 'killingshot') {
    const caught = helpless(target);
    strike(sk.power(lv) / 100 * (caught ? 1.6 : 1), 1, (t, res) => { say(caught ? 'Killing Shot!' : 'Killing Shot'); if (!res.miss && caught) cam.shake = 0.2; });
  }
  // ---- Voodoo: the Voodoo Doll, a monster bound to it ----
  if (id === 'voodoodoll') {
    const run = (t) => {
      if (!t.alive || !pay()) return;
      doll = t; dollT = sk.dur(lv); dollLv = lv;
      say('Voodoo Doll'); audio.play('night');
      fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8 + 0.3), t.z, 'Bound', 'miss');
      fx.zap({ x: player.x, y: y + 0.9, z: player.z }, { x: t.x, y: overHead(t, 0.6), z: t.z }, '#c87aff');
      if (!dollProp) dollProp = fx.prop(player.x, player.z, 'doll');
      if (fighting) player.command({ mob: t });
    };
    const fighting = player.goal?.mob === target && !player.goal.spell;
    player.command({ mob: target, spell: { range: sk.range, time: 0.2, run, name: sk.name } });
    return;
  }
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
  // ---- Assassin: Venom Strike, Venom Cloud, Shadow Step, Pilfer ----
  if (id === 'venomstrike') strike(sk.power(lv) / 100, 1 + 0.03 * lv, (t, res) => { say('Venom Strike'); if (!res.miss) inflict(t, sk.status, lv, res.dmg); });
  if (id === 'venomcloud') { // a vial of venom smashed at the target: the cloud hangs there, biting all in it, while you fight on
    const run = (t) => {
      if (!pay()) return;
      say('Venom Cloud');
      player.atkAnim = player.atkDur = 0.3;
      audio.play('swing');
      const cx = t.x, cz = t.z, gy = world.heightAt(cx, cz), m = sk.power(lv) / 100;
      fx.warn(cx, cz, sk.area, sk.hits(lv) * sk.every, '#7ac83a'); // (the cloud's ground, for as long as it lasts)
      fx.puff(cx, gy + 0.3, cz, 1.5);
      repeat(sk, lv, () => {
        fx.cloud(cx, gy + 0.35, cz);
        for (const o of [...mobs.list]) {
          if (!o.alive || Math.hypot(o.x - cx, o.z - cz) > sk.area + o.def.r) continue;
          const res = playerAttack(player.ps, { ...o.effDef(), def: 0, vit: 0 }, m * player.atkMul, 1.5, true); // (venom goes through armour: no DEF; a cloud is hard to step out of: +50% hit)
          const yy = overHead(o, o.sprite.scale.y * 0.8);
          if (res.miss) { fx.number(o.x, yy, o.z, 'Miss', 'miss'); continue; }
          fx.number(o.x, yy, o.z, res.dmg, 'dealt');
          o.hit(res.dmg, 0, 0);
          inflict(o, sk.status, lv, res.dmg * 2); // (its poison: two bites' worth, a fifth of that a second)
        }
      });
      player.command({ mob: t }); // and on with the fight
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0.15, run, name: sk.name } });
    return;
  }
  if (id === 'shadowstep') { // to the target's back, and the next blow strikes harder
    const run = (t) => {
      if (!t.alive || !pay()) return;
      const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1, gap = t.def.r + 0.6;
      const bx = t.x + (dx / d) * gap, bz = t.z + (dz / d) * gap;
      fx.puff(player.x, y + 0.3, player.z, 0.8);
      if (world.walkable(bx, bz) && !world.isSafe(bx, bz)) { player.x = bx; player.z = bz; player.sync(); }
      player.face = { x: -dx / d, z: -dz / d };
      player.iframes = Math.max(player.iframes, 0.3);
      player.nextBlow = 1 + 0.1 * lv;
      fx.puff(player.x, world.heightAt(player.x, player.z) + 0.3, player.z, 0.8);
      say('Shadow Step'); audio.play('dodge');
      player.command({ mob: t });
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0, run, name: sk.name } });
    return;
  }
  if (id === 'pilfer') { // a chance at one of its drops (never a card), once per monster
    const run = (t) => {
      if (!t.alive || !pay()) return;
      say('Pilfer'); audio.play('swing');
      player.atkAnim = player.atkDur = 0.25;
      const boss = t.def.boss || t.def.mvp, pool = (t.def.drops || []).filter(([it]) => !ITEMS[it]?.card && !t.def.decoy);
      if (t.pilfered || !pool.length) { fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8), t.z, t.pilfered ? 'Nothing left' : 'Nothing', 'miss'); player.command({ mob: t }); return; }
      const chance = (20 + player.ps.fns / 2) / 100 * (boss ? 1 / 3 : 1);
      if (Math.random() >= chance) { fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8), t.z, 'Missed', 'miss'); player.command({ mob: t }); return; }
      t.pilfered = true;
      const tot = pool.reduce((a, [, , , c]) => a + c, 0);
      let r = Math.random() * tot, got = pool[0][0];
      for (const [it, , , c] of pool) if ((r -= c) <= 0) { got = it; break; }
      if (inv.bag.add(got, 1)) { fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8), t.z, ITEMS[got].name, 'skill'); menus.message(`You lifted ${ITEMS[got].name} off the ${t.def.name}.`); inv.changed(); }
      else menus.message('Your bag is full');
      player.command({ mob: t });
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0.05, run, name: sk.name } });
    return;
  }
  // ---- Phantom: Dual Rend, right hand and left in turn ----
  if (id === 'dualrend') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Dual Rend');
      repeat(sk, lv, (i) => {
        if (!i || !t.alive) return;
        if (i % 2 && player.ps.left) leftHit(t, m); else bladeHit(t, m);
        fx.slash(t.x, overHead(t, t.sprite.scale.y * 0.5), t.z, { x: i % 2 ? 1 : -1, z: 0.3 }, cam);
      });
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
  const res = playerAttack(opts.el ? { ...player.ps, el: opts.el } : player.ps, md, mult * player.atkMul * cruel(t), 1, true);
  const yy = overHead(t, t.sprite.scale.y * 0.8);
  if (res.miss) { fx.number(t.x, yy, t.z, 'Miss', 'miss'); return res; }
  fx.number(t.x, yy, t.z, res.dmg, res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
  const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1;
  t.hit(res.dmg, dx / d, dz / d);
  audio.play('hit');
  return res;
}
// a Phantom's left-hand cut (Dual Rend): the left dagger's ATK and element, at Twin Blades' share
function leftHit(t, mult) {
  const L = player.ps.left;
  if (!L || !t.alive) return { miss: true, dmg: 0 };
  const res = playerAttack({ ...player.ps, watk: L.atk, wlv: L.wlv, el: L.el || 'neutral' }, t.effDef(), mult * player.atkMul * player.leftShare, 1, true);
  const yy = overHead(t, t.sprite.scale.y * 0.8) + 0.3;
  if (res.miss) { fx.number(t.x, yy, t.z, 'Miss', 'miss'); return res; }
  fx.number(t.x, yy, t.z, res.dmg, 'dealt');
  t.hit(res.dmg, 0, 0);
  audio.play('hit');
  return res;
}
// both blades on one monster (Thousand Cuts): the right, then the left if there is one; the damage done
const dualHit = (t, mult) => (bladeHit(t, mult).dmg || 0) + (player.ps.left ? leftHit(t, mult).dmg || 0 : 0);
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
  meteor: '#ff5a1a', stormgust: '#bfefff', thunder: '#fff27a', poisonthrow: '#7aff4a', cursecircle: '#9a5aff' };
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
  mult *= weighed(m); // (the Ammit Card)
  const res = magicAttack(player.ps, md, mult, element);
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  // the right element hits hard (gold), the wrong one barely scratches (grey)
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, res.dmg, res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
  if (res.el < 1) weakTip(m, element);
  audio.play('hit');
  m.hit(res.dmg, dx / d * 0.5, dz / d * 0.5);
  cardOnHit(m, res.dmg);
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
  const target = (player.goal?.mob?.alive && player.goal.mob) || (player.cast?.target?.alive && player.cast.target) || selected() || mobs.nearest(player.x, player.z, 9);
  if (!target) { menus.message('No monster nearby'); return; }
  selMob = target; // the spell's target stays selected after the cast
  const fighting = player.goal?.mob === target && !player.goal.spell; // hitting it when the chant began: go back to it after
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
        if (id === 'cursecircle') { // the curse bites everything in the circle, and holds it there
          for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2 + i, r = 1 + Math.random() * 1.8; fx.sparkle(cx + Math.cos(a) * r, gy + 0.2, cz + Math.sin(a) * r, j % 2 ? '#9a5aff' : '#7aff4a', 1); }
          if (i === 0) { const n = 20; for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2; fx.sparkle(cx + Math.cos(a) * 3, gy + 0.15, cz + Math.sin(a) * 3, '#9a5aff', 1); } }
          around(cx, cz, mult, (m) => {
            blight(m, 1);
            m.curseT = 1.3; m.curseBy = 0.02 * lv;
            if (!heldFast(m)) { m.slowT = Math.max(m.slowT || 0, 1.3); m.slowBy = Math.max(m.slowT > 1.3 ? m.slowBy || 0 : 0, 0.3); }
          });
        }
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
      if (res && id === 'poisonthrow') { blight(t, lv >= 5 ? 2 : 1); if (doll && dollT > 0 && doll !== t) blight(doll, 1); } // (a pin in the doll)
      const ty = world.heightAt(t.x, t.z) + 0.5;
      fx.sparkle(t.x, ty, t.z, SPELL_COL[id], 8);
    });
  };
  player.command({ mob: target, spell: { range: sk.range, time, run: (t) => { run(t); if (fighting && t.alive && !player.goal) player.command({ mob: t }); }, name: sk.name } });
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

// the Hunter's traps: armed after a moment, they wait for a monster to walk in (not a floating one);
// trap damage comes from FNS, KNL and the Base Level, never misses and goes through DEF
let dollProp = null;
const TRAP_FX = { bear: { el: 'neutral', col: '#d8dce4' }, shock: { el: 'wind', col: '#fff27a' }, mine: { el: 'fire', col: '#ff6a1a' } };
function trapDmg(m, power) {
  const st = (k) => prog.total(k) + (player.statBonus?.[k] || 0), md = m.effDef();
  const base = st('fns') * 1.5 + st('knl') + prog.baseLv * 2;
  const k = power / 100 * (1 + 0.05 * skillLv(prog, 'trapmastery')) * (0.9 + Math.random() * 0.2);
  return Math.max(1, Math.floor(base * k * (md.takes?.ranged ?? 1))); // (the element: springTrap)
}
function springTrap(t, hit) {
  const sk = SKILLS[t.id], T = TRAP_FX[t.kind], gy = world.heightAt(t.x, t.z);
  const barbs = skillLv(prog, 'barbedtraps'), venom = barbs && { kind: 'poison', chance: () => 12 * barbs, dur: 6 };
  const strike = (m) => {
    const dmg = Math.max(1, Math.floor(trapDmg(m, sk.power(t.lv)) * elementMod(T.el, m.effDef().el)));
    const dx = m.x - t.x, dz = m.z - t.z, d = Math.hypot(dx, dz) || 1, push = t.kind === 'mine' ? 2.5 : 0;
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, dmg, 'dealt');
    m.hit(dmg, dx / d * push, dz / d * push);
    if (venom) inflict(m, venom, 1, dmg);
    return dmg;
  };
  fx.release(t.s);
  if (t.kind === 'bear') {
    const dmg = strike(hit), boss = hit.def.boss || hit.def.mvp; // (the jaws: one monster)
    if (hit.alive) { hit.slowT = (sk.hold(t.lv) + 0.3 * barbs) * (boss ? 0.5 : 1); hit.slowBy = 1; fx.number(hit.x, overHead(hit, hit.sprite.scale.y * 0.8 + 0.35), hit.z, 'Held', 'miss'); }
    fx.sparkle(t.x, gy + 0.3, t.z, T.col, 10);
    audio.play('block');
    return dmg;
  }
  const n = 22;
  for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2, r = 0.5 + Math.random() * sk.area; fx.sparkle(t.x + Math.cos(a) * r, gy + 0.3, t.z + Math.sin(a) * r, T.col, 1); }
  if (t.kind === 'shock') for (let j = 0; j < 4; j++) { const a = Math.random() * Math.PI * 2, r = Math.random() * sk.area, x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r; fx.zap({ x, y: gy + 3, z }, { x, y: gy + 0.2, z }, T.col); }
  if (t.kind === 'mine') { // a huge blast: fire and smoke and a column of sparks
    for (let j = 0; j < 3; j++) later(j * 0.08, () => fx.puff(t.x, gy + 0.3 + j * 0.5, t.z, 2.6 - j * 0.5));
    fx.sparkle(t.x, gy + 0.5, t.z, '#ffd23a', 24);
    fx.warn(t.x, t.z, sk.area, 0.35, '#ff6a1a');
  } else fx.puff(t.x, gy + 0.3, t.z, 1.2);
  cam.shake = t.kind === 'mine' ? 0.6 : 0.15;
  audio.play('hit');
  for (const m of [...mobs.list]) {
    if (!m.alive || Math.hypot(m.x - t.x, m.z - t.z) > sk.area + m.def.r) continue;
    inflict(m, sk.status, t.lv, strike(m));
  }
}
function tickTraps(dt) {
  for (let i = traps.length - 1; i >= 0; i--) {
    const t = traps[i];
    t.armT -= dt;
    if ((t.life -= dt) <= 0) { fx.release(t.s); traps.splice(i, 1); continue; }
    if (t.armT > 0) continue;
    const hit = mobs.list.find((m) => m.alive && !m.def.fly && !m.def.decoy && m.sprite.visible && Math.hypot(m.x - t.x, m.z - t.z) < 0.6 + m.def.r);
    if (!hit) continue;
    traps.splice(i, 1);
    springTrap(t, hit);
  }
}
// skill cooldowns, buffs and the damage bonuses that depend on HP, every frame
let rhythm = 0;
function tickSkills(dt) {
  skillClock += dt;
  for (let i = timers.length - 1; i >= 0; i--) {
    if (timers[i].at > skillClock) continue;
    const t = timers.splice(i, 1)[0];
    if (t.map === world.id) t.fn();
  }
  for (const m of mobs.list) { // poisoned monsters
    if (!m.alive || !(m.poisonT > 0)) continue;
    m.poisonT -= dt;
    if ((m.poisonTick -= dt) > 0) continue;
    m.poisonTick = 1;
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, m.poisonDmg, 'dealt');
    fx.sparkle(m.x, overHead(m, m.sprite.scale.y * 0.4), m.z, '#8aff5a', 4);
    m.hit(m.poisonDmg, 0, 0);
  }
  // a scorpion's venom in the hero: 1.5% of Max HP a second, never the last of it
  if (player.poisonT > 0 && player.state !== 'down') {
    player.poisonT -= dt;
    if ((player.poisonTick -= dt) <= 0) {
      player.poisonTick = 1;
      const n = Math.min(player.hp - 1, Math.max(1, Math.round(player.maxHp * 0.015)));
      if (n > 0) { player.hp -= n; fx.number(player.x, overHead(player, 1.3), player.z, n, 'taken'); fx.sparkle(player.x, overHead(player, 0.8), player.z, '#8aff5a', 3); }
    }
  }
  for (const m of mobs.list) { // the Voodoo's Blight eats them, a tick a second
    if (!m.alive || !(m.blight > 0)) continue;
    if ((m.blightT -= dt) <= 0) { m.blight = 0; continue; }
    if ((m.blightTick -= dt) > 0) continue;
    m.blightTick = 1;
    const n = blightDmg(m);
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, n, 'dealt');
    fx.sparkle(m.x, overHead(m, m.sprite.scale.y * 0.4), m.z, m.blight > 3 ? '#9a5aff' : '#7aff4a', 3 + m.blight);
    m.hit(n, 0, 0);
  }
  if (buffs.sub > 0 && player.barrier <= 0) { buffs.sub = 0; menus.message('Your Substitute bursts'); fx.puff(player.x, world.heightAt(player.x, player.z) + 0.6, player.z, 1); }
  if (subProp && !(buffs.sub > 0)) { fx.release(subProp); subProp = null; if (!(buffs.aegis > 0)) player.barrier = 0; }
  if (subProp) subProp.position.set(player.x + 0.6, world.heightAt(player.x, player.z) + 0.05, player.z + 0.25); // (the doll stands at the hero's side)
  if (buffs.sub > 0 && (auraTick -= dt) <= 0) { // the Substitute's poison haze: a stack of Blight a second, and weakened
    auraTick = 1;
    const gy = world.heightAt(player.x, player.z);
    for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 + skillClock, r = 1.2 + (j % 3) * 0.6; fx.sparkle(player.x + Math.cos(a) * r, gy + 0.3, player.z + Math.sin(a) * r, j % 2 ? '#7aff4a' : '#b8ff8a', 1); }
    for (const m of mobs.list) if (m.alive && Math.hypot(m.x - player.x, m.z - player.z) < 2.5 + m.def.r) { blight(m, 1); m.weakT = 3; m.weakBy = (6 + 2 * auraLv) / 100; }
  }
  if (doll && (!doll.alive || (dollT -= dt) <= 0)) { doll = null; menus.message('The doll goes limp.'); }
  if (dollProp) { // the doll floats at the hero's side while a monster is bound to it
    if (!doll) { fx.release(dollProp); dollProp = null; }
    else dollProp.position.set(player.x - 0.55, world.heightAt(player.x, player.z) + 0.75 + Math.sin(skillClock * 3) * 0.08, player.z + 0.2);
  }
  tickTraps(dt);
  if (player.hiddenT > 0 && (player.hiddenT -= dt) <= 0) unhide(); // Vanish wears off
  for (const m of mobs.list) { // burning monsters (and a support's shield glinting round one)
    if (m.alive && m.shieldT > 0 && (m.shieldGlint = (m.shieldGlint || 0) - dt) <= 0) { m.shieldGlint = 0.5; fx.sparkle(m.x, overHead(m, m.sprite.scale.y * 0.5), m.z, '#7ac8ff', 3); }
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
  skillLock = Math.max(0, skillLock - dt);
  for (const k in buffs) {
    if (buffs[k] <= 0) continue;
    buffs[k] -= dt;
    if (buffs[k] <= 0 && k === 'aspd') { applyStats(); menus.message('The Speed Potion wears off'); }
    if (buffs[k] <= 0 && k === 'momentum') momentum = 0;
    if (buffs[k] <= 0 && k === 'oil') { oilEl = null; applyStats(); menus.message('The oil on your weapon wears off'); }
    if (buffs[k] <= 0 && k.startsWith('food_')) { applyStats(); menus.message(`${ITEMS[FOODS[k.slice(5)]].name} wears off`); }
    if (buffs[k] <= 0 && k === 'imbue') { imbueEl = null; applyStats(); menus.message('Your blade loses its element'); }
    if (buffs[k] <= 0 && k === 'aegis') { player.barrier = 0; applyStats(); }
    if (buffs[k] <= 0 && k === 'sub') menus.message('Your Substitute falls apart');
    if (buffs[k] <= 0 && ['focus', 'tailwind', 'rush', 'gust', 'frenzy', 'swift'].includes(k)) applyStats();
    if (buffs[k] <= 0 && k === 'rhythm') { galeStacks = 0; applyStats(); }
  }
  if (buffs.aegis > 0 && player.barrier <= 0) { buffs.aegis = 0; applyStats(); menus.message('Stone Aegis breaks'); }
  if (player.endureT <= 0) endureGuard = 0;
  player.guard = Math.max(endureGuard, buffs.ward > 0 ? wardCut(wardLv) : 0, buffs.veil > 0 ? veilLv * 0.04 : 0);
  // the moon rises and sets: the Moon Ranger's night passives follow it
  if (!!dayNight.isNight !== nightUp) {
    nightUp = !!dayNight.isNight;
    applyStats();
    if (skillLv(prog, 'moonlit')) menus.message(nightUp ? 'The moon is up: Moonlit Hunter wakes.' : 'The moon sets: Moonlit Hunter sleeps.');
  }
  moonMark.classList.toggle('on', nightUp && skillLv(prog, 'moonlit') > 0 && player.state !== 'down');
  player.steady = buffs.ward > 0;
  const low = player.hp < player.maxHp * 0.25 && skillLv(prog, 'laststand');
  const fury = player.ps.fury && player.hp < player.maxHp * 0.4 ? 1 + player.ps.fury / 100 : 1; // the Great Bear Card's Wounded Fury
  player.atkMul = (buffs.warcry > 0 ? 1 + warcryLv / 100 : 1) * (low ? 1.15 : 1) * (1 + momentum * skillLv(prog, 'momentum') / 100) * fury;
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
  for (const sp of SPOTS) if (sp.map === world.id && !(sp.npc && awayNow(sp.npc))) consider({ spot: sp }, sp.x, world.heightAt(sp.x, sp.z), sp.h, sp.z, 1, sp.npc ? [0.15, 0.55, 1.12] : undefined);
  return best;
}
function tap(cx, cy) {
  if (player.state === 'down') return;
  stopNav(); // taking the reins again
  const hit = pick(cx, cy);
  if (hit?.mob) { selMob = hit.mob; player.command({ mob: hit.mob }); }
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
let saveWarned = false;
function persist() {
  if (!started || resetting || cine) return; // (never mid-cutscene: the hero is not where the camera is)
  const isle = raidOf(world.id), deep = isDelve(world.id), back = isle ? raids.raid?.back : deep ? delverSpot() : null, at = back || (isle ? boatSpot(isle) : player); // a run is never saved: back on the shore (or where they set out from); the Deep Halls, back by the one who sent them down
  const ok = writeSave({ goals: goals.toJSON(), album: album.toJSON(), mvpPity: mobs.pity, story: story.toJSON(), look: player.look, visited: [...visited], keepers: [...keepers], savePoint, raidAt: raids.raidAt, raidsDone: [...raidsDone], raidLog, delve: { best: delve.best }, raidRun: raids.raid ? { id: raids.raid.id, diff: raids.raid.diff, at: raids.raid.start } : null, map: back ? back.map : isle ? isle.from : world.id, mvpAt: mobs.mvpAt, bossHp: mobs.bossSnapshot(), bossAt: mobs.bossAt, fieldAt: mobs.fieldSnapshot(), x: at.x, z: at.z, yaw: cam.yaw, dist: cam.dist, hp: player.hp, sp: player.sp, inv: inv.toJSON(), prog: prog.toJSON(), quests: quests.toJSON(), hotbar: hotbar.toJSON(), time: dayNight.t });
  writeStorage(inv.chest.toJSON());
  // the phone refused the save (storage full or blocked): say so once, so the player can back up
  if (!ok && !saveWarned) { saveWarned = true; menus.message('Could not save! Back up your save from the title screen (Account) soon.'); }
  if (ok) saveWarned = false;
}

// second jobs glow: a soft aura behind the hero and a ring at their feet, in the job's colour
const AURA = { blademaster: '#ff7a4a', wizard: '#b48aff', magicknight: '#6ad8ff', windrunner: '#8af0c8', moonranger: '#b8c8ff', beastmaster: '#ff9a5a', phantom: '#9a6aff', shadowblade: '#a24aff', hunter: '#ff4a4a', voodoo: '#7aff4a' };
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
  if (buffs.ward > 0) sk('ward', 'ward', buffs.ward, `Damage taken −${Math.round(wardCut(wardLv) * 100)}% · casting can't be broken`);
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
  if (player.rootT > 0) out.push({ key: 'root', icon: 'skill_earthsplit', name: 'Rooted', left: player.rootT, fx: "Can't walk, dash or leap away" });
  if (buffs.sub > 0) sk('sub', 'substitute', buffs.sub, `The doll takes your blows: ${Math.ceil(player.barrier)} left · Blight and weaken all within 2.5 paces (blows −${6 + 2 * auraLv}%)`);
  if (doll && dollT > 0) sk('doll', 'voodoodoll', dollT, `${doll.def.name} bound: Blight up to ${BLIGHT.dollMax}, +${3 * dollLv}%`);
  if (player.hiddenT > 0) out.push({ key: 'hidden', icon: SKILLS.vanish.icon, name: 'Hidden', left: player.hiddenT, fx: ambushMul() > 1 ? `Monsters lose you · next blow ×${ambushMul().toFixed(1)} (Ambush)` : 'Monsters lose you' });
  if (buffs.aspd > 0) out.push({ key: 'aspd', icon: 'quick', name: ITEMS.quick.name, left: buffs.aspd, fx: 'Attack speed +10%' });
  if (buffs.oil > 0 && oilEl) out.push({ key: 'oil', icon: OILS[oilEl], name: ITEMS[OILS[oilEl]].name, left: buffs.oil, fx: `Weapon element: ${ELEMENTS[oilEl].name}${weaponKind() === 'bow' ? ' (not with a bow)' : buffs.imbue > 0 ? ' (under Elemental Blade)' : ''}` });
  for (const k of FOOD_STATS) if (buffs[`food_${k}`] > 0) out.push({ key: `food_${k}`, icon: FOODS[k], name: ITEMS[FOODS[k]].name, left: buffs[`food_${k}`], fx: `${k.toUpperCase()} +${FOOD_N}` });
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

// ---------- the camera in a cutscene, and while the hero is made: it frames a point (focus: {x, z}),
// from dist, turning (spin, rad/s), at its own pitch, shifted sideways (side: the hero left of centre) ----------
const CINE_HERO = { x: -999, z: -999, state: 'down', ps: {}, canBeHit: () => false }; // (no hero for the monsters to notice)
function cineShot(s) {
  if (world.id !== s.map) enterMap(s.map, null, s.map === 'camp' ? null : { x: 3, z: 3 }); // (the hero out of the shot)
  dayNight.t = s.time;
  mobs.update(0.01, CINE_HERO); // (a boss's time come: the Fire Giant appears)
  const jarl = () => mobs.list.find((m) => m.type === 'jarl' && m.alive);
  const near = mobs.list.find((m) => m.alive && m.type === 'wisp') || mobs.list.find((m) => m.alive), field = near ? { x: near.x, z: near.z } : { x: 32, z: 32 }; // (where something moves)
  const npc = typeof s.focus === 'string' && s.focus.startsWith('npc:') && NPCS[s.focus.slice(4)], at = typeof s.focus === 'object' && s.focus;
  const focus = npc ? () => npc : at ? () => at : { fire: () => ({ x: 32, z: 32 }), field: () => field, hero: () => player, jarl: () => jarl() || { x: 32, z: 40 } }[s.focus];
  cine = { focus, dist: s.dist, pitch: s.pitch, spin: s.spin, side: 0 };
  cam.yaw = s.yaw;
  const f = focus();
  cam.target.set(f.x, world.heightAt(f.x, f.z), f.z);
  if (s.shake) cam.shake = s.shake;
  if (s.sound) audio.play(s.sound);
}
// the opening cutscene, then the world as a new hero finds it (no trace of the shots kept)
function playIntro(done) {
  playCutscene(INTRO_SHOTS, cineShot, () => {
    cine = null;
    mobs.fieldAt = {}; mobs.bossAt = {}; mobs.bossHp = {};
    for (const k of Object.keys(groundLeft)) delete groundLeft[k];
    enterMap('camp');
    dayNight.t = 0.04;
    cam.yaw = 0; cam.dist = 12;
    done();
  });
}

// ---------- the story's cutscenes in the middle of the game (scenes.js CHAPTER_SHOTS, STEP_SHOTS, SECRET_SHOTS) ----------
// queued as the story reaches them, and played once the hero is out of a fight (not in a stand, a raid or a
// warp, no monster on their heels). The shots may be on other maps: afterwards the hero is back where they
// stood, the clock and the camera as they were, and no land seen only in a cutscene counts as walked
const sceneQueue = [];
function queueScene(shots, then) { if (shots?.length) sceneQueue.push({ shots, then }); else then?.(); }
// the story moved from step s to the next: its big moment, then the next chapter's opening
function storyScenes(s, next) {
  if (STEP_SHOTS[s?.id]) queueScene(STEP_SHOTS[s.id]);
  const ch = (st) => st?.ch.split(':')[0];
  if (next && ch(next) !== ch(s) && CHAPTER_SHOTS[ch(next)]) queueScene(CHAPTER_SHOTS[ch(next)], () => { menus.message(`Story: ${next.title}. ${next.goal}`); backupNudge(); });
  else if (!next) backupNudge();
}
// a new chapter (or the story's end): if no save code was made this past week, a reminder to make one, at most
// once a day (the heroes live on this phone; a code keeps them safe anywhere: title screen, Account)
function backupNudge() {
  const now = Date.now(), DAY = 864e5;
  if (now - backedUpAt() < 7 * DAY || now - (story.flags.nudgedAt || 0) < DAY) return;
  story.flags.nudgedAt = now;
  menus.message('Keep your heroes safe: make a save code now and then (title screen → Account → Back up save) and keep it somewhere else.');
}
const sceneSafe = () => !isDelve(world.id) && !cine && !warping && player.state === 'normal' && !menus.isOpen('story') && !stands.vigil && !raids.raid && !raidOf(world.id)
  && !mobs.list.some((m) => m.alive && (m.state === 'chase' || m.angry > 0) && Math.hypot(m.x - player.x, m.z - player.z) < 14);
// a chapter's cutscenes, to watch again from the Quests window: its opening, and the big moments the hero has passed
function chapterShots(ch) {
  const steps = STORY.map((st, i) => [st, i]).filter(([st]) => st.ch === ch);
  return [...(ch === 'Prologue' ? INTRO_SHOTS : CHAPTER_SHOTS[ch.split(':')[0]] || []), ...steps.filter(([st, i]) => i < story.i && STEP_SHOTS[st.id]).flatMap(([st]) => STEP_SHOTS[st.id])];
}
function tickScenes() { if (sceneQueue.length && sceneSafe()) { const q = sceneQueue.shift(); playScene(q.shots, q.then); } }
function playScene(shots, then) {
  const back = { map: world.id, x: player.x, z: player.z, t: dayNight.t, yaw: cam.yaw, dist: cam.dist, walked: new Set(visited) };
  menus.close(); bigmap.close?.(); player.stop(); stopNav();
  persist(); // (saved where the hero stands, before the shots move anything)
  // the Hunter's traps and the Voodoo's dolls wait, hidden, for the hero's return; the bound monster is found again
  // by its kind and spot (the map's monsters are made afresh when the hero comes back to it)
  const props = [...traps.map((t) => t.s), subProp, dollProp].filter(Boolean);
  sceneKeep = { props, doll: doll && { type: doll.type, x: doll.x, z: doll.z } };
  for (const o of props) o.visible = false;
  document.body.classList.add('cinema');
  playCutscene(shots, cineShot, () => {
    cine = null;
    document.body.classList.remove('cinema');
    for (const v of [...visited]) if (!back.walked.has(v)) visited.delete(v);
    if (world.id !== back.map || Math.hypot(player.x - back.x, player.z - back.z) > 0.01) enterMap(back.map, null, back);
    for (const o of sceneKeep.props) o.visible = true;
    const was = sceneKeep.doll;
    if (was && !mobs.list.includes(doll)) doll = mobs.list.filter((m) => m.alive && m.type === was.type).sort((a, b) => Math.hypot(a.x - was.x, a.z - was.z) - Math.hypot(b.x - was.x, b.z - was.z))[0] || null;
    sceneKeep = null;
    dayNight.t = back.t; dayNight.update(0, 0);
    cam.yaw = back.yaw; cam.dist = back.dist;
    then?.();
  });
}

// ---------- the beasts' health, under the hero's panel and its buttons: a row and a bar for each ----------
const petsEl = document.getElementById('pets');
let petsKey = '', petsT = 0;
function tickPets(dt) {
  if ((petsT -= dt) > 0) return;
  petsT = 0.15;
  const list = allies.beasts.filter((b) => b.alive); // (the beasts' bars: an illusion isn't shown)
  const key = list.map((b) => `${b.kind}${Math.ceil(b.hp)}/${b.maxHp}`).join('|');
  if (key === petsKey) return;
  petsKey = key;
  petsEl.hidden = !list.length;
  document.body.style.setProperty('--pets-h', `${list.length ? list.length * 17 + 8 : 0}px`); // (the toasts step down under them)
  petsEl.innerHTML = list.map((b) => {
    const f = Math.max(0, Math.min(1, b.hp / b.maxHp));
    return `<div class="pet${f < 0.3 ? ' low' : ''}"><b style="color:${b.color}">${b.name}</b><i><s style="width:${(f * 100).toFixed(1)}%;background:${b.color}"></s></i><em>${Math.ceil(b.hp)}</em></div>`;
  }).join('');
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
  for (const w of ['items', 'equip', 'skills', 'status', 'raids', 'journal', 'settings', 'album', 'goals']) if (input.tapped(w) && started && !cine) { menus.toggle(w); if (menus.isOpen(w)) story.flags[`opened_${w}`] = true; } // (a story step may ask for a window)
  if (input.tapped('attack') && started && !cine) attackNow();
  if (input.tapped('hudfold') || input.tapped('hudmenu')) { setFold(!folded); audio.play('ui'); }
  if (input.tapped('close')) { if (bigmap.open) bigmap.close(); else menus.close(); }
  bigmap.update(dt);
  const live = started && !cine; // (a story cutscene: the world goes on, the hero waits)
  const clicks = input.takeClicks();
  if (live) for (const c of clicks) tap(c.x, c.y);
  if (live) holdWalk(dt);

  player.update(live ? dt : 0, b, mobs);
  if (live && player.moving && player.state === 'normal') {
    stepT -= dt;
    if (stepT <= 0) { stepT = 1.4 / player.walkSpeed(); audio.play('step'); } // a footstep every 1.4 tiles
  }
  audio.update(dt, dayNight.night, musicMood(dt));
  hudTick(dt);
  goalTick(dt);
  if (!started && !cine) cam.yaw += dt * 0.05; // slow orbit behind the title screen
  if (cine) mobs.update(dt, CINE_HERO); // (the cutscene's world goes on)
  mobs.cam = b;
  allies.cam = b;
  if (live) mobs.update(dt, player);
  if (live) burnTick(dt);
  if (live) matchupHint();
  if (live) allies.update(dt, player, mobs, player.goal?.mob || player.cast?.target);
  if (live) dayNight.update(dt, t); else dayNight.update(0, t);
  world.update(dt, t);
  villagers.update(dt, player, b);
  if (live) fx.update(dt);
  if (live) { naturalRegen(dt); tickSkills(dt); checkPortals(); tickNav(); tickQuestWorld(dt); }
  if (live) tickWading(dt);
  if (live) { tickVigil(dt); tickStorySpawn(); tickStorySearch(dt); }
  if (live) tickRaid(dt);
  if (live) tickPets(dt);
  if (live) tickScenes();
  dressPeople();
  tickAura(dt, t, b);
  updateCastBar();
  hotbar.update();
  const seen = cine?.focus() || player; // (a cutscene: what hides its focus fades, not what hides the hero)
  world.updateOcclusion(seen.x, seen.z, b, !cine && player.goal?.mob?.alive ? player.goal.mob : null);

  if (cine) { // a cutscene's shot, or the hero's making: the camera frames its own point
    const f = cine.focus(), up = cine.up || 0; // (side: to the screen's right, so the focus sits left; up: toward the camera, so it sits high)
    const rx = Math.cos(cam.yaw) * (cine.side || 0) + Math.sin(cam.yaw) * up, rz = -Math.sin(cam.yaw) * (cine.side || 0) + Math.cos(cam.yaw) * up;
    cam.target.lerp(tmpV.set(f.x + rx, world.heightAt(f.x, f.z), f.z + rz), 1 - Math.exp(-4 * dt));
    cam.yaw += cine.spin * dt;
    cam.dist = cine.dist;
  } else {
    const py = world.heightAt(player.x, player.z);
    cam.target.lerp(tmpV.set(player.x, py, player.z), 1 - Math.exp(-8 * dt));
  }
  const pitch = cine?.pitch ?? lerp(0.72, 0.98, (cam.dist - 7) / 13);
  const horiz = Math.cos(pitch) * cam.dist;
  cam.shake = Math.max(0, cam.shake - dt);
  const sh = settings.get('shake') === false ? 0 : cam.shake * 0.5; // (Settings: Screen shake)
  camera.position.set(
    cam.target.x + Math.sin(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
    cam.target.y + 0.7 + Math.sin(pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
  );
  camera.lookAt(cam.target.x, cam.target.y + 0.7, cam.target.z);
  camera.updateMatrixWorld();
  if (live) { tickGuide(dt); tickGoalArrow(); }

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
  tickPerf();
}

// ---------- the performance readout (Settings: Performance): to measure the game on a real phone ----------
// frames a second and the slowest frame over the last second, the renderer's draw calls and triangles, the
// textures and geometries held, the maps built, and the page's memory where the browser tells it
// (real time, not the game's step, which is capped at 50 ms)
let perfEl = null, perfT = 0, perfN = 0, perfWorst = 0, perfLast = 0;
function tickPerf() {
  const on = settings.get('perf');
  if (!on) { if (perfEl) { perfEl.remove(); perfEl = null; } return; }
  const now = performance.now(), dt = perfLast ? (now - perfLast) / 1000 : 0;
  perfLast = now;
  if (!perfEl) { perfEl = document.createElement('div'); perfEl.id = 'perf'; document.body.appendChild(perfEl); perfT = 0; perfN = 0; perfWorst = 0; }
  perfN++; perfT += dt; perfWorst = Math.max(perfWorst, dt);
  if (perfT < 1) return;
  const i = renderer.info, mem = performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : 'n/a';
  perfEl.textContent = `${Math.round(perfN / perfT)} fps · worst ${Math.round(perfWorst * 1000)} ms\n${i.render.calls} draws · ${Math.round(i.render.triangles / 1000)}k tris\n${i.memory.textures} tex · ${i.memory.geometries} geo · ${world.builtCount?.() ?? '?'} maps\nheap ${mem} · ${world.id}`;
  perfT = 0; perfN = 0; perfWorst = 0;
}

// the hero's panel folds (the ▴ button, or ☰ to open it again; remembered on this phone), and opens by itself
// while a lesson (guide.js) may point at its buttons. The quest list steps back while the hero fights
const FOLD_KEY = 'aria.hudFold';
let folded = false, fightT = 0;
try { folded = localStorage.getItem(FOLD_KEY) === '1'; } catch { /* storage unavailable */ }
function setFold(v, keep = true) {
  folded = v;
  document.body.classList.toggle('hudfold', v);
  if (keep) try { localStorage.setItem(FOLD_KEY, v ? '1' : '0'); } catch { /* storage unavailable */ }
}
setFold(folded, false);
function hudTick(dt) {
  if (guide.running && folded) setFold(false, false); // (a lesson rings the window buttons: they show while it runs)
  const fighting = player.goal?.mob?.alive || mobs.list.some((m) => m.alive && m.state === 'chase' && Math.hypot(m.x - player.x, m.z - player.z) < 7);
  fightT = fighting ? 3 : Math.max(0, fightT - dt);
  tracker.classList.toggle('fighting', fightT > 0 && !guide.running);
}

// the music's mood (audio.js MOODS): a boss fight (a boss or MVP hunting the hero near by, or a raid run,
// held 4 s after), a dungeon, a wonder (the Sphinx's sands, the World Tree), a town, the desert, or a field
const TOWNS = new Set(['camp', 'city', 'magic', 'hunt', 'sand']), SANDS = new Set(['redsands', 'dunes', 'scorpion', 'desert']), WONDERS = new Set(['sphinx', 'ygg']);
let bossMusicT = 0;
function musicMood(dt) {
  const fight = raids.raid || mobs.list.some((m) => m.alive && (m.def.boss || m.def.mvp) && !m.def.decoy && m.state === 'chase' && Math.hypot(m.x - player.x, m.z - player.z) < 16);
  bossMusicT = fight ? 4 : Math.max(0, bossMusicT - dt);
  if (bossMusicT > 0) return 'boss';
  const id = world.id;
  return MAPS[id]?.indoor ? 'dungeon' : WONDERS.has(id) ? 'wonder' : TOWNS.has(id) ? 'town' : SANDS.has(id) ? 'desert' : 'field';
}

// monster names, like Ragnarok: over the one the mouse is on, and over the one you are fighting
const labelEls = { hover: document.querySelector('#moblabels .hover'), target: document.querySelector('#moblabels .target') };
function mobLabels() {
  const target = (player.goal?.mob?.alive ? player.goal.mob : null) || selected(); // the one fought, else the one selected
  const over = input.hover ? pick(input.hover.x, input.hover.y)?.mob : null;
  for (const [k, m] of [['target', target], ['hover', over !== target ? over : null]]) {
    const el = labelEls[k];
    if (!m || !m.alive || !m.sprite.visible) { el.style.display = 'none'; continue; }
    const s = m.sprite, top = s.position.y + s.scale.y * (1 - s.center.y) * 0.92;
    projV.set(m.x, top, m.z).project(camera);
    if (projV.z > 1) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    const name = m.def.name + (m.def.mvp ? ' ✦ MVP' : m.def.boss ? ' ✦' : '');
    if (k === 'target' && settings.get('targetBar')) { // the one you fight: a thin health bar under its name (Settings)
      if (!el.firstChild || el.firstChild.nodeType !== 1) { el.textContent = ''; el.innerHTML = '<b></b><i class="tbar"><s></s></i>'; }
      const f = clamp(m.hp / (m.def.hp || 1), 0, 1);
      if (el.firstChild.textContent !== name) el.firstChild.textContent = name;
      el.lastChild.firstChild.style.width = `${(f * 100).toFixed(1)}%`;
      el.lastChild.classList.toggle('low', f < 0.3);
    } else if (el.textContent !== name || el.firstChild?.nodeType === 1) el.textContent = name;
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
const gender = (d) => (d.look?.body === 'f' ? '<i class="tsex f" title="Female">♀</i>' : '<i class="tsex m" title="Male">♂</i>');
const lvLine = (p) => (p.v === 2 ? `Base Lv ${p.baseLv} · Job Lv ${p.jobLv}` : `Lv ${p.level | 0 || 1}`);
function drawSlots() {
  slotsEl.innerHTML = heroes.map((d, i) => {
    const on = i === picked ? ' on' : '';
    if (!d) return `<button class="tslot empty${on}" data-i="${i}"><span class="tpic">+</span><span><b>Create a hero</b><small>Empty slot</small></span><i class="tslotno">${i + 1}</i></button>`;
    const p = d.prog || {};
    const pic = headsReady() ? `<img class="tpic" src="${lookPortrait({ hair: 'messy', dye: 'brown', ...d.look }, 48)}" alt="">` : '<span class="tpic"></span>';
    // two lines: the name and whether male or female; the job and levels
    return `<button class="tslot${on}" data-i="${i}">${pic}<span><b>${esc(heroName(d))} ${gender(d)}</b><small>${esc(JOBS[p.job]?.name || JOBS.novice.name)} · ${lvLine(p)}</small></span><i class="tslotno">${i + 1}</i></button>`;
  }).join('');
  tContinue.textContent = !heroes[picked] ? 'Create Hero' : picked === slotHere ? 'Continue' : 'Play';
  tNew.hidden = !heroes[picked];
  tBackup.hidden = !heroes.some(Boolean);
  drawPreview();
  if (!headsReady() && heroes.some(Boolean) && !started) setTimeout(drawSlots, 300); // the portraits, once the heads have loaded
}
// the picked hero, full size in the job they wear, turning slowly round (all eight sides)
const TURN = ['down', 'downleft', 'left', 'upleft', 'up', 'upright', 'right', 'downright'];
const tpImg = document.getElementById('tp-img'), tpEmpty = document.getElementById('tp-empty'), tpInfo = document.getElementById('tp-info');
let turnAt = 0;
function drawPreview() {
  const d = heroes[picked];
  tpImg.hidden = !d; tpEmpty.hidden = !!d;
  if (!d) { tpInfo.innerHTML = '<b>A new hero</b><span>Begin a new tale by the last fire</span>'; return; }
  const p = d.prog || {};
  tpImg.src = heroPic(p.job || 'novice', d.look, TURN[turnAt % TURN.length], savedGear(d));
  tpInfo.innerHTML = `<b>${esc(heroName(d))} ${gender(d)}</b><span>${esc(JOBS[p.job]?.name || JOBS.novice.name)} · ${lvLine(p)}</span>`;
}
// it turns by itself, and by hand: drag across it (or the arrows) to turn it, and it waits a moment
// before turning by itself again
let heldT = 0;
const turnTo = (k) => { turnAt = ((turnAt + k) % TURN.length + TURN.length) % TURN.length; const d = heroes[picked]; if (d && headsReady()) tpImg.src = heroPic(d.prog?.job || 'novice', d.look, TURN[turnAt], savedGear(d)); };
const turnTimer = setInterval(() => { if (started || !title.isConnected) { clearInterval(turnTimer); return; } if (performance.now() > heldT) turnTo(1); }, 420);
const tpStage = document.getElementById('tp-stage');
let dragX = null;
tpStage.addEventListener('pointerdown', (e) => { if (e.target.closest('.tp-turn')) return; dragX = e.clientX; heldT = performance.now() + 3000; tpStage.setPointerCapture?.(e.pointerId); });
tpStage.addEventListener('pointermove', (e) => {
  if (dragX === null) return;
  heldT = performance.now() + 3000;
  const steps = Math.trunc((e.clientX - dragX) / 28); // a side every 28 pixels dragged
  if (steps) { turnTo(-steps); dragX += steps * 28; }
});
const dragEnd = () => { dragX = null; };
tpStage.addEventListener('pointerup', dragEnd);
tpStage.addEventListener('pointercancel', dragEnd);
tpStage.addEventListener('click', (e) => { const b = e.target.closest('.tp-turn'); if (!b) return; heldT = performance.now() + 3000; turnTo(+b.dataset.turn); audio.play('ui'); });
slotsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.tslot');
  if (!b || +b.dataset.i === picked) return;
  picked = +b.dataset.i;
  confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn'); tNew.classList.add('ghost');
  audio.play('ui');
  drawSlots();
});
const soundLabel = () => { tSound.textContent = audio.enabled ? '🔊' : '🔇'; tSound.title = `Sound: ${audio.enabled ? 'On' : 'Off'}`; };
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
// the Account menu (top right): back up or restore every hero and the storage
const tAccount = document.getElementById('t-account'), acctMenu = document.getElementById('t-acctmenu');
const acctOpen = (on) => { acctMenu.hidden = !on; tAccount.setAttribute('aria-expanded', String(on)); };
tAccount.addEventListener('click', (e) => { e.stopPropagation(); audio.play('ui'); acctOpen(acctMenu.hidden); });
title.addEventListener('click', (e) => { if (!e.target.closest('.t-acct')) acctOpen(false); });
tBackup.addEventListener('click', () => { acctOpen(false); openCode('backup'); });
tRestore.addEventListener('click', () => { acctOpen(false); openCode('restore'); });
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
  if (!got) { codeMsg.textContent = 'That code did not load: it is cut short or not a save code. Copy it whole, from ARIA2: to its last letter.'; return; }
  if (got === 'slot') setActiveSlot(picked);
  codeMsg.textContent = 'Save restored. Starting…';
  resetting = true; // don't let the running game write over it
  toSelectNext();
  setTimeout(() => location.reload(), 600);
});
// Delete: the picked hero is gone for good (the shared storage stays), so it asks twice
let confirmNew = false, confirmT = 0;
tNew.addEventListener('click', () => {
  if (!confirmNew) {
    confirmNew = true;
    tNew.textContent = `Tap again to delete ${heroName(heroes[picked])}`;
    tNew.classList.remove('ghost');
    tNew.classList.add('warn');
    clearTimeout(confirmT);
    confirmT = setTimeout(() => { confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn'); tNew.classList.add('ghost'); }, 3000);
    return;
  }
  clearTimeout(confirmT);
  confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn'); tNew.classList.add('ghost');
  clearSave(picked);
  heroes[picked] = null;
  if (picked === slotHere) { resetting = true; toSelectNext(); location.reload(); return; } // the hero in the game: start the page over without it
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
  if (!save && !cine) { // a new hero: the opening cutscene first, then the making
    setTimeout(() => { title.style.display = 'none'; playIntro(enterGame); }, 450);
    return;
  }
  enterGame();
}
function enterGame() {
  document.getElementById('hud').classList.remove('pre');
  started = true;
  input.enabled = true;
  cam.yaw = save?.yaw ?? 0;
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* not supported */ }
  setTimeout(() => {
    title.remove();
    ui.showZone(world.id);
    if (!save) { // a new character: their making, the camera close on them as they turn
      const wide = innerWidth > 640; // (a phone held upright: the hero above the choices)
      cine = { focus: () => player, dist: wide ? 5.2 : 7, pitch: wide ? 0.38 : 0.5, spin: 0.35, side: wide ? 1.35 : 0, up: wide ? 0 : 5 };
      villagers.show(null); // (the camp's people step out of the picture)
      menus.openLook('new', player.look);
    } else startStory();
    const hint = document.getElementById('hint');
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 6000);
  }, 450);
}
const GO_KEY = 'aria.go', SELECT_KEY = 'aria.select'; // (SELECT_KEY: back to the hero select, not the tap-to-start screen)
function toSelectNext() { try { sessionStorage.setItem(SELECT_KEY, '1'); } catch { /* the tap-to-start screen first, then */ } }
drawSlots();
let go = false;
try { go = sessionStorage.getItem(GO_KEY) === '1'; sessionStorage.removeItem(GO_KEY); } catch { /* storage unavailable */ }
if (go) { // picked on the title screen before the page started over: the sound waits for a tap
  window.addEventListener('pointerdown', () => audio.start(), { once: true });
  begin();
}

// the loading screen, ready now: it turns into the tap-to-start screen over the world (the tap also
// lets the sound start), and the hero select comes up behind it. Straight on, with no tap, into a hero
// already picked, or back to the select after a restore or a delete started the page over
const boot = document.getElementById('boot');
const bootGone = () => { boot.classList.add('hide'); setTimeout(() => boot.remove(), 500); };
let toSelect = false;
try { toSelect = sessionStorage.getItem(SELECT_KEY) === '1'; sessionStorage.removeItem(SELECT_KEY); } catch { /* storage unavailable */ }
if (go || toSelect) { title.classList.remove('wait'); bootGone(); } else {
  boot.querySelector('.bver').textContent = `v1.0.${__BUILD__}`;
  boot.classList.add('ready');
  const tap = (e) => {
    if (e.type === 'keydown' && e.repeat) return;
    removeEventListener('keydown', tap);
    boot.removeEventListener('pointerdown', tap);
    audio.start();
    audio.play('ui');
    title.classList.remove('wait');
    bootGone();
  };
  boot.addEventListener('pointerdown', tap);
  addEventListener('keydown', tap);
}

window.__aria = { scene, renderer, lib, MAPS, settings, album, goals, warp, enterMap, useSkill, useItem, story, SPOTS, player, world, cam, camera, mobs, allies, fx, inv, prog, quests, villagers, menus, hotbar, dayNight, audio, stats: world.stats, raid: () => raids.raid, raidAt: () => raids.raidAt, raidGo, raidLog: () => raidLog, storyDone, queueScene, chapterShots, cineShot, cine: () => cine, traps, delve, questWorld, keepers, visited, savePoint: () => savePoint, keepers, gainExp };
