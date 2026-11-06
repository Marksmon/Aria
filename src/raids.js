// Raids on the map (moved out of main.js; raid.js holds the raids' data): setting out, the waves and the boss
// against the clock, the raid's bar, the boss's health bar, the history (raidLog), the cooldowns (raidAt) and the
// pay. main.js calls installRaids once, where these lines were, and reads the run under way as raids.raid.
import { ITEMS, maybeSlotted } from './items.js';
import { MAPS, ZONE_NAMES } from './world.js';
import { NPCS } from './quests.js';
import { RAIDS, rollReward } from './raid.js';
import { raidDef } from './mobs.js';

export function installRaids(ctx) {
  const { audio, cam, fx, gainExp, goalEvent, inv, lib, mobs, persist, player, prog, refreshQuests, save, story, warp, world } = ctx;
  // ---------- raids (raid.js): three waves and a boss against the clock ----------
  // The Boatman rows you out; the waves come in from the shore all round and never give up; after each
  // wave a breather (and before the boss a full heal). EXP is held while you fight and paid when the
  // run ends, x1.5, on a clear. Leaving, fainting or the tide (the timer) ends it, and so does closing
  // the game mid-run: a failed run pays nothing and costs no cooldown. One cooldown for every
  // difficulty, from going in, started by a clear. The story's Tutorial run (only while the story waits
  // on the raid) starts no cooldown; only a clear of it moves the story on and pays (a lost one is a
  // failed run like any other). Every run goes in the raid history (raidLog), with what it paid.
  // when each raid opens again (ms since 1970): { bloop, kobold, goblin }. A save from when Bloop
  // Island was the only raid kept one number
  let raidAt = typeof save?.raidAt === 'number' ? { bloop: save.raidAt } : { ...(save?.raidAt || {}) };
  let raid = null; // { id, diff, left, wave, phase: land | fight | rest, restT, list, boss, exp: [base, job], arrived, shown, back }
  // the raids this hero has done once at their guide: from then on they can set out from anywhere (the
  // Raids window), and come back to where they were (raid.back). A hero who set out on one before
  // (raidAt), or took Bloop Island's story crossing, has it open already
  const raidsDone = new Set([...(save?.raidsDone || []), ...Object.keys(raidAt), ...(save?.story?.flags?.bloopisle ? ['bloop'] : [])]);
  // every run, newest first: { id, diff, at, secs, won, why, perz, exp: [base, job], items: [[id, n]] } (saved)
  const raidLog = Array.isArray(save?.raidLog) ? save.raidLog : [];
  const RAID_LOG = 50; // runs kept
  function logRaid(e) { raidLog.unshift(e); raidLog.length = Math.min(raidLog.length, RAID_LOG); }
  // a run the game was closed in the middle of: a failure, nothing paid (save.raidRun)
  if (save?.raidRun && RAIDS[save.raidRun.id] && !raidLog.some((e) => e.at === save.raidRun.at)) logRaid({ ...save.raidRun, secs: null, won: false, why: 'The game was closed mid-run', perz: 0, exp: [0, 0], items: [] });
  const raidBar = document.getElementById('raidbar'), bossBar = document.getElementById('bossbar');
  raidBar.querySelector('.rb-leave').addEventListener('click', () => { if (raid) endRaid(false, RAIDS[raid.id].words.leave, false, 'Left the raid'); });
  const raidOf = (map) => Object.entries(RAIDS).find(([, R]) => R.map === map)?.[1] || null;
  const storyRaid = (id) => ctx.storyLive() && story.step?.kind === 'raid' && story.step.raid === id;
  const boatSpot = (R) => ({ x: NPCS[R.npc].x, z: NPCS[R.npc].z + 1.4 });
  // a monster as it stands, facing you, as a picture (the Boatman shows the raid's boss): its first
  // standing frame, cropped to what is painted, cached
  const mobPics = {};
  function mobPortrait(art) {
    if (art in mobPics) return mobPics[art];
    try {
      const set = lib.mobs[art], anims = set.anims.down || Object.values(set.anims)[0];
      const img = (anims.idle || Object.values(anims)[0])[0].image;
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (px[(y * c.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 < 0) return set.loaded ? (mobPics[art] = null) : null; // (a sheet still loading: asked again later)
      const w = x1 - x0 + 1, h = y1 - y0 + 1, out = document.createElement('canvas');
      out.width = w; out.height = h;
      out.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
      return (mobPics[art] = out.toDataURL());
    } catch { return (mobPics[art] = null); }
  }
  function raidInfo(id) {
    return { wait: Math.max(0, (raidAt[id] || 0) - Date.now()), story: storyRaid(id) };
  }
  function raidGo(id, diff, anywhere = false) {
    const R = RAIDS[id], D = R.difficulties[diff], info = raidInfo(id);
    if (raid || ctx.warping || !D || (D.tutorial ? !info.story : info.wait)) return;
    if (anywhere && !raidsDone.has(id)) { ctx.menus.message(`Raid once with ${NPCS[R.npc].name} in ${ZONE_NAMES[R.from]} first.`); return; }
    if (anywhere && (raidOf(world.id) || ctx.questWorld.defense)) { ctx.menus.message('Not from here.'); return; }
    if (!D.tutorial && prog.baseLv < D.lv) { ctx.menus.message(`${D.name} needs Base Level ${D.lv}.`); return; } // (each difficulty needs its level)
    raid = { id, diff, start: Date.now(), left: R.secs, wave: -1, phase: 'land', restT: 2.5, list: [], boss: null, exp: [0, 0], arrived: false, shown: 1,
      back: anywhere ? { map: world.id, x: player.x, z: player.z } : null }; // (set out from anywhere: back there after)
    ctx.menus.close('talk');
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
      ctx.menus.message(`Wave ${raid.wave + 1} of ${R.waves.length}! ${R.words.wave}`);
      audio.play('night');
      cam.shake = 0.25;
    } else {
      const [type, off] = R.boss;
      raid.boss = raidSpawn(R, type, D.lv + off, D.boss, D.wave);
      ctx.menus.message(`${raid.boss.def.name} ${R.words.boss}`);
      audio.play('night');
      cam.shake = 0.6;
    }
  }
  function tickRaid(dt) {
    if (!raid) return;
    const R = RAIDS[raid.id], D = R.difficulties[raid.diff];
    if (!raid.arrived) {
      if (world.id !== R.map || ctx.warping) return;
      raid.arrived = true;
      ctx.menus.message(`${R.name}, ${D.name}: ${R.words.arrive}. ${R.secs / 60} minutes ${R.words.time}!`);
    }
    if (world.id !== R.map) { endRaid(false, 'You left the arena, and the raid is lost.', true, 'Left the arena'); return; }
    if (player.state === 'down') { endRaid(false, 'You fainted, and the raid is lost.', true, 'Fainted'); return; }
    raid.left -= dt;
    if (raid.left <= 0) { endRaid(false, R.words.timeUp, false, 'Out of time'); return; }
    if (raid.phase === 'fight' && !raid.list.some((m) => m.alive && mobs.list.includes(m))) {
      if (raid.boss) { winRaid(R, D); return; }
      const last = raid.wave === R.waves.length - 1, k = last && R.bossHeal ? 1 : R.breather;
      player.heal(Math.ceil(player.maxHp * k));
      player.healSp(Math.ceil(player.maxSp * k));
      fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.6, player.z, '#9fe8a8', 14);
      ctx.menus.message(last ? 'The last wave falls, and the ground shakes... Your HP and SP are restored. Get ready!' : `Wave ${raid.wave + 1} cleared! Catch your breath (HP and SP partly restored).`);
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
    ctx.menus.message(`${R.name} cleared on ${D.name} with ${Math.floor(raid.left / 60)}:${String(Math.floor(raid.left % 60)).padStart(2, '0')} to spare!`);
    endRaid(true, null);
  }
  // the clear reward: perz, items, and the rare roll. Returns what was given: { perz, items: [[id, n]] }
  function raidReward(id, diff) {
    const r = rollReward(id, diff), got = [];
    if (r.perz) { inv.addPerz(r.perz); ctx.menus.message(`+${r.perz.toLocaleString()} perz`); }
    const give = (item, n) => { const kept = inv.add(item, n); if (kept < n) inv.chest.add(item, n - kept); ctx.menus.toast(item, n); got.push([item, n]); };
    for (const [item, n] of Object.entries(r.items)) give(item, n);
    if (r.rare) r.rare = maybeSlotted(r.rare); // a raid's rare can come with a card slot too
    if (r.rare) { give(r.rare, 1); audio.play('heart'); ctx.menus.message(`Rare find! ${ITEMS[r.rare].name}!`); }
    if (r.ultra) { const u = maybeSlotted(r.ultra); give(u, 1); audio.play('heart'); cam.shake = 0.3; ctx.menus.message(`ULTRA RARE! ${ITEMS[u].name}!`); }
    if (r.card) { give(r.card, 1); audio.play('heart'); ctx.menus.message(`Rare find! ${ITEMS[r.card].name}!`); }
    return { perz: r.perz || 0, items: got };
  }
  // the run is over: its monsters go, the EXP held is paid, and (unless the hero went elsewhere) the
  // Boatman rows them back
  function endRaid(win, why, stay = false, short = why) {
    const R = RAIDS[raid.id], D = R.difficulties[raid.diff], run = raid;
    // EXP: all of it x1.5 on a clear, nothing on a failed run
    const k = win ? 1.5 : 0, b = Math.round(run.exp[0] * k), j = Math.round(run.exp[1] * k);
    for (const m of [...mobs.list]) if (m.def.raidLv) mobs.remove(m);
    raid = null;
    raidsDone.add(run.id); // done once: the Raids window may send them from anywhere now
    if (win && !D.tutorial) raidAt[run.id] = run.start + R.cooldown; // only a clear starts the cooldown (from going in)
    if (win && !D.tutorial) goalEvent({ kind: 'raid' });
    // only a clear pays; a cleared Tutorial run (and only that) moves the story on
    const paid = win ? raidReward(run.id, run.diff) : { perz: 0, items: [] };
    logRaid({ id: run.id, diff: run.diff, at: run.start, secs: Math.round(R.secs - Math.max(0, run.left)), won: win, why: win ? null : short, perz: paid.perz, exp: [b, j], items: paid.items });
    if (win && D.tutorial && storyRaid(run.id)) story.flag(story.step.id);
    raidBar.hidden = bossBar.hidden = true;
    if (why) ctx.menus.message(why);
    if (b || j) {
      ctx.menus.message(`Raid EXP: +${b.toLocaleString()} Base, +${j.toLocaleString()} Job${win ? ' (x1.5 for the clear)' : ''}`);
      gainExp(b, j); // already at the battle rate
    } else if (!win) ctx.menus.message(D.tutorial ? 'The raid failed: no rewards. The Boatman will row you out again whenever you are ready.' : 'The raid failed: no rewards, and no cooldown. Try again when you are ready.');
    if (!stay) setTimeout(() => (run.back ? warp(run.back.map, null, run.back) : warp(R.from, null, boatSpot(R))), win ? 2500 : 700);
    refreshQuests();
    persist();
  }

  return { raidsDone, raidLog, raidOf, boatSpot, mobPortrait, raidInfo, raidGo, tickRaid, get raid() { return raid; }, get raidAt() { return raidAt; } };
}
