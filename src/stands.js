// The story's stands (moved out of main.js): survive steps (waves round a spot; Meteor Rain on the last), story
// searches (spots on any map, found by walking over them) and a story step's own monster. main.js calls
// installStands once, where these lines were, and reads the stand under way as stands.vigil.
import { guardDef } from './mobs.js';

export function installStands(ctx) {
  const { audio, cam, fx, mobs, overHead, persist, player, refreshQuests, story, world } = ctx;
  // ---------- survive steps: hold a spot against waves (the Ember's Light in Moss Field, the vigil on Ember
  // Hill while Vigdis sings). A step may set its own heralds ({ early, late, after }), wave gap (every),
  // how many may stand before the next wave comes (most), colour, and words (startText, breakText) ----------
  let vigil = null, giantWarnT = -99; // vigil: { t, next, list }
  const VIGIL_WAVE = 15; // seconds between waves of heralds (lesser ones, like a boss's guards)
  const giantOf = () => mobs.list.find((m) => m.alive && m.def.mvp && m.type === 'jarl');
  function endVigil(why) {
    const g = giantOf();
    if (g) g.lulled = false;
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
      if (world.id !== s.map) return;
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
      vigil = { t: 0, next: 2, list: [], giant: g };
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
        m.def = guardDef(type);
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
  return { tickVigil, tickStorySearch, tickStorySpawn, get vigil() { return vigil; } };
}
