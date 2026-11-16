// The story's stands (moved out of main.js): survive steps (waves round a spot; Meteor Rain on the last), story
// searches (spots on any map, found by walking over them) and a story step's own monster. main.js calls
// installStands once, where these lines were, and reads the stand under way as stands.vigil.
import { guardDef, heraldDef } from './mobs.js';

export function installStands(ctx) {
  const { audio, cam, fx, mobs, overHead, persist, player, prog, refreshQuests, story, world } = ctx;
  // ---------- survive steps: hold a spot against waves (the Ember's Light in Moss Field, the vigil on Ember
  // Hill while Vigdis sings). A step may set its own heralds ({ early, late, after }), wave gap (every),
  // how many may stand before the next wave comes (most), colour, and words (startText, breakText), and the level its
  // heralds come at (heraldLv: the stand's own, never above the hero's; without it they are their kind's) ----------
  let vigil = null, giantWarnT = -99; // vigil: { t, next, list }
  const VIGIL_WAVE = 15; // seconds between waves of heralds (lesser ones, like a boss's guards)
  const giantOf = () => mobs.list.find((m) => m.alive && m.def.mvp && m.type === 'jarl');
  // every other boss on the map (a mini-boss, an MVP) is held by the song too while it lasts, as the Giant is (November
  // 2026: the Rainbow Runner or Poseidon would join a stand's waves); a blow wakes one, as ever
  const bossesHere = () => mobs.list.filter((m) => m.alive && (m.def.boss || m.def.mvp) && !m.def.storyBoss && !m.temp && m.type !== 'jarl');
  function endVigil(why) {
    const g = giantOf();
    if (g) g.lulled = false;
    for (const m of vigil?.held || []) if (m.alive) m.lulled = false;
    for (const m of vigil.list) if (mobs.list.includes(m)) { fx.puff(m.x, world.heightAt(m.x, m.z) + 0.3, m.z, m.def.w); mobs.remove(m); }
    vigil = null;
    story.count = 0;
    if (why) ctx.menus.message(why);
    refreshQuests();
  }
  function tickVigil(dt) {
    const s = story.step;
    if (!ctx.storyLive() || s?.kind !== 'survive') { if (vigil) endVigil(); return; }
    const y = world.heightAt(s.at.x, s.at.z);
    if (!vigil) {
      if (world.id !== s.map || story.flags[s.id]) return; // (held already: the story moves on, the circle doesn't start again)
      if (Math.random() < dt * 3) fx.sparkle(s.at.x, y + 0.4, s.at.z, s.color || '#b48aff', 4); // where to stand
      if (Math.hypot(s.at.x - player.x, s.at.z - player.z) > 3 || player.state !== 'normal') return;
      // the Fire Giant roams the hill: the song would only wake him if he stood close, and once it
      // begins it lulls him while it lasts
      const g = giantOf();
      if (g && Math.hypot(g.x - s.at.x, g.z - s.at.z) < 14) {
        if (ctx.skillClock - giantWarnT > 8) { giantWarnT = ctx.skillClock; ctx.menus.message('The Fire Giant prowls too close to the circle: the song would wake him. Wait for him to wander off.'); }
        return;
      }
      if (g) { g.lulled = true; g.state = 'wander'; }
      const held = bossesHere();
      for (const m of held) { m.lulled = true; m.state = 'wander'; }
      vigil = { t: 0, next: 2, list: [], giant: g, held };
      ctx.menus.message(s.startText || 'The runes in the circle light up, and Vigdis\'s song rises out of them. The hill trembles: the heralds are coming!');
      cam.shake = 0.35;
      audio.play('night');
      return;
    }
    if (world.id !== s.map || player.state === 'down') { endVigil(s.breakText || 'The song breaks off. Go back to the hill road and begin again.'); return; }
    if (Math.hypot(s.at.x - player.x, s.at.z - player.z) > 12) { endVigil(s.breakText || 'You strayed too far, and the song breaks off. Stand by the rune circle and begin again.'); return; }
    if (vigil.giant?.alive && !vigil.giant.lulled) { endVigil('You struck the Fire Giant: he wakes, and the song breaks off. Let him wander off, then begin again.'); return; }
    vigil.t += dt;
    story.count = Math.floor(vigil.t);
    if (Math.random() < dt * 6) fx.sparkle(s.at.x + (Math.random() - 0.5) * 3, y + 0.3, s.at.z + (Math.random() - 0.5) * 3, s.color || '#b48aff', 3); // the song in the air
    const up = vigil.list.filter((m) => m.alive).length;
    if (vigil.t >= vigil.next && vigil.t < s.secs - 4 && up < (s.most || 4)) { // a wave of heralds from all round the hill (held back while four still stand)
      vigil.next += s.every || VIGIL_WAVE;
      const H = s.heralds || { early: ['beetle', 'wisp'], late: ['beetle', 'beetle', 'wisp'], after: 30 };
      const kinds = vigil.t > H.after ? H.late : H.early, a0 = Math.random() * Math.PI * 2; // the hill grows angrier
      kinds.forEach((type, i) => {
        const a = a0 + (i / kinds.length) * Math.PI * 2;
        let x = s.at.x + Math.cos(a) * 8, z = s.at.z + Math.sin(a) * 8;
        if (!world.walkable(x, z)) { x = s.at.x + Math.cos(a) * 4; z = s.at.z + Math.sin(a) * 4; }
        const m = mobs.add(type, x, z);
        m.def = s.heraldLv ? heraldDef(type, Math.min(s.heraldLv, prog.baseLv)) : guardDef(type);
        m.hp = m.def.hp;
        m.temp = true;
        m.provoke();
        vigil.list.push(m);
      });
      fx.puff(s.at.x, y + 0.2, s.at.z, 2);
      cam.shake = 0.3;
    }
    // the Giant's Meteor Rain (meteors): red circles round the hero, the first where they stand
    const M = s.meteors;
    if (M && vigil.t >= (vigil.metAt ??= M.first || 5) && vigil.t < s.secs - 2) {
      vigil.metAt += M.every;
      const map = world.id, run = vigil;
      for (let i = 0; i < M.n; i++) {
        const a = Math.random() * Math.PI * 2, r = i ? 1.6 + Math.random() * 2.6 : 0;
        const x = player.x + Math.cos(a) * r, z = player.z + Math.sin(a) * r, wait = M.wind + i * 0.35;
        if (!world.walkable(x, z)) continue;
        fx.warn(x, z, M.r, wait);
        setTimeout(() => {
          if (world.id !== map || vigil !== run) return;
          const gy = world.heightAt(x, z);
          fx.puff(x, gy + 0.2, z, M.r * 1.2);
          fx.sparkle(x, gy + 0.3, z, '#ff7a2a', 14);
          audio.play('hit');
          if (Math.hypot(player.x - x, player.z - z) <= M.r + 0.3 && player.canBeHit() && player.state !== 'down') { cam.shake = 0.3; player.takeDamage(Math.max(1, Math.round(player.maxHp * M.hp)), x, z); }
        }, wait * 1000);
      }
      if (vigil.t < M.every + 6) fx.number(player.x, overHead(player, 1.9), player.z, 'Meteor Rain!', 'skill');
    }
    if (vigil.t >= s.secs) { story.flag(s.id); endVigil(); }
  }

  // ---------- a story search (story.js kind 'search'): what is still to be found glints gold, and is found by
  // walking over it; the spots may be on different maps ----------
  let storySearchT = 0;
  function tickStorySearch(dt) {
    const s = story.step;
    if (!ctx.storyLive() || s?.kind !== 'search' || ctx.warping) return;
    if ((storySearchT -= dt) <= 0) {
      storySearchT = 0.6;
      for (const p of story.toFind()) if (p.map === world.id && Math.hypot(p.x - player.x, p.z - player.z) < 26) fx.sparkle(p.x, world.heightAt(p.x, p.z) + 0.4, p.z, '#ffe37a', 4);
    }
    const got = story.onSearch(world.id, player.x, player.z);
    if (!got) return;
    fx.sparkle(got.spot.x, world.heightAt(got.spot.x, got.spot.z) + 0.6, got.spot.z, '#ffe37a', 16);
    audio.play('pickup');
    ctx.menus.message(`${s.verb || 'Found'}: ${s.thing} ${got.n}/${got.of}`);
    refreshQuests();
    persist();
  }

  // ---------- a story step's own monster (spawn: { mob, at }): there whenever the hero is on its map ----------
  function tickStorySpawn() {
    const s = story.step, sp = s?.spawn;
    if (!ctx.storyLive() || !sp || world.id !== s.map || story.count >= s.n || ctx.warping) return;
    if (mobs.list.some((m) => m.type === sp.mob && m.alive)) return;
    const at = world.walkable(sp.at.x, sp.at.z) ? sp.at : mobs.findSpot(Math.random, player);
    if (!at) return;
    const m = mobs.add(sp.mob, at.x, at.z);
    m.temp = true; // (gone when the hero leaves; back when they return, until it is beaten)
    m.story = true; // (not a quest's rare hunt: refreshQuests leaves it be)
  }

  // ---------- a story step's fires (story.js kind 'fires': the backward ring's four fires, the Giant's feeding-fires):
  // each burns at its spot on the step's map, fed by heralds of the step's level (heraldLv) that come when the hero
  // draws near; the fire goes out when its heralds are beaten. A fire left half-fought is whole again on the way back ----------
  let fires = null; // { id, list: [{ i, x, z, mobs }] }
  const NEAR_FIRE = 15;
  function dropFires() {
    for (const f of fires?.list || []) for (const m of f.mobs || []) if (m.alive && mobs.list.includes(m)) mobs.remove(m);
    fires = null;
  }
  function tickStoryFires(dt) {
    const s = story.step;
    if (!ctx.storyLive() || s?.kind !== 'fires' || world.id !== s.map || ctx.warping) { if (fires) dropFires(); return; }
    if (fires?.id !== s.id) { dropFires(); fires = { id: s.id, list: [] }; }
    const burning = story.burning(s);
    fires.list = burning.map((b) => fires.list.find((f) => f.i === b.i) || { ...b, mobs: null });
    for (const f of fires.list) {
      const y = world.heightAt(f.x, f.z), d = Math.hypot(f.x - player.x, f.z - player.z);
      if (d < 30 && Math.random() < dt * 14) fx.sparkle(f.x + (Math.random() - 0.5) * 0.9, y + 0.3 + Math.random() * 1.5, f.z + (Math.random() - 0.5) * 0.9, Math.random() < 0.5 ? '#ff6a2a' : '#ffc04a', 3); // the fire itself
      if (!f.mobs && d < NEAR_FIRE && player.state !== 'down') { // its heralds wake as the hero comes
        f.mobs = s.guards.map((type, k) => {
          const a = (k / s.guards.length) * Math.PI * 2;
          let x = f.x + Math.cos(a) * 2.2, z = f.z + Math.sin(a) * 2.2;
          if (!world.walkable(x, z)) { x = f.x; z = f.z; }
          const m = mobs.add(type, x, z);
          m.def = heraldDef(type, Math.min(s.heraldLv || 0, prog.baseLv));
          m.hp = m.def.hp;
          m.temp = true; m.story = true;
          return m;
        });
      }
      if (f.mobs && f.mobs.every((m) => !m.alive)) { // every herald down: the fire dies
        const n = story.fireOut(f.i);
        f.mobs = null;
        fx.puff(f.x, y + 0.3, f.z, 2.2);
        cam.shake = 0.3;
        audio.play('night');
        ctx.menus.message(`${s.verb || 'A fire goes out'}: ${n}/${s.fires.length}`);
        refreshQuests();
        persist();
      }
    }
  }
  return { tickVigil, tickStorySearch, tickStorySpawn, tickStoryFires, get vigil() { return vigil; } };
}
