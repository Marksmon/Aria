// Quests out in the world (moved out of main.js): what a search quest still wants glints and is found by walking
// over it, a rare hunt shows itself on its map (at night, if it keeps to the night), a defence's waves come while
// the hero stands by the place, and the Sphinx's door. main.js calls installQuestWorld once, where these lines
// were, and reads a defence under way as questWorld.defense.
import { MOB_DEFS } from './mobs.js';
import { QUESTS } from './quests.js';
import { ZONE_NAMES } from './world.js';

export function installQuestWorld(ctx) {
  const { audio, cam, fx, inv, mobs, player, questComplete, quests, refreshQuests, world } = ctx;
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
        const time = !q.rare.night || ctx.dayNight.night > 0.6;
        if (!out && time && !quests.ready(id, inv)) {
          const m = mobs.add(q.mob, q.rare.x, q.rare.z);
          m.temp = true;
          ctx.menus.message(`Something golden rises over ${ZONE_NAMES[world.id]}... the ${MOB_DEFS[q.mob].name}!`);
          audio.play('night');
        } else if (out && !time) { mobs.remove(out); ctx.menus.message(`Dawn: the ${MOB_DEFS[q.mob].name} fades away. It will be back tonight.`); }
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
      ctx.menus.message(`${q.verb || 'Found'}: ${q.thing} ${n}/${q.spots.length}`);
      if (id === 'sphinx6') { // the Sphinx Eye set in the obelisk: the hidden way south opens
        ctx.secretScene?.('sphinx6'); // (its cutscene: the way, and what waits beyond)
        cam.shake = 0.6; audio.play('night');
        fx.sparkle(player.x, y(player.x, player.z) + 1.2, player.z, '#7ad8ff', 30);
        ctx.menus.message('The Sphinx Eye clicks into the obelisk, and the whole desert sighs. To the south, a way opens through the sand...');
      }
      if (id === 'tree6') { // the World Tree's seed planted: the hidden way north of the Old Forest opens
        ctx.secretScene?.('tree6'); // (its cutscene: the way, and what waits beyond)
        cam.shake = 0.6; audio.play('night');
        fx.sparkle(player.x, y(player.x, player.z) + 1.2, player.z, '#9affc0', 30);
        ctx.menus.message('The seed sinks into the dark earth, and the ground shakes. Roots heave up through the moss, and to the north the trees part: a way opens toward something enormous...');
      }
      if (quests.ready(id, inv)) questComplete(id); else refreshQuests();
    }
    tickDefense(dt);
    sphinxDoor();
  }
  // the Giant Sphinx's door (Sphinx Sands): its seal gives way, and steps lead down into the Sphinx's
  // Halls, the first dungeon (dungeon.js; the portal in front of it: world.js MAPS.sphinx)
  let doorSaid = false;
  function sphinxDoor() {
    const door = world.id === 'sphinx' && world.monument?.door;
    const near = door && Math.hypot(door.x - player.x, door.z - player.z) < 3;
    if (near && !doorSaid) {
      doorSaid = true;
      audio.play('night');
      fx.sparkle(door.x, world.heightAt(door.x, door.z) + 1.4, door.z - 1.2, '#7ad8ff', 16);
      ctx.menus.message('The seal on the great door glows and gives way. Steps lead down into the dark: the Sphinx\'s Halls, four floors deep, each harder than the last. At the bottom, something old is waking.');
    } else if (!near && doorSaid && (!door || Math.hypot(door.x - player.x, door.z - player.z) > 6)) doorSaid = false;
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
    ctx.menus.message(`Wave ${quests.active[id] + 1} of ${q.waves.length}: ${count} ${MOB_DEFS[type].name}s come for ${q.place}!`);
  }
  function tickDefense(dt) {
    if (!defense) return;
    const q = QUESTS[defense.id];
    // walked away, fainted, or left the map: the wave scatters (waves already held still count)
    if (!(defense.id in quests.active) || world.id !== q.map || player.state === 'down' || Math.hypot(q.at.x - player.x, q.at.z - player.z) > 16) {
      for (const m of defense.list) if (mobs.list.includes(m)) mobs.remove(m);
      defense = null;
      if (q.map === world.id) ctx.menus.message(`You left ${q.place}, and the wave scatters. Come back to try again.`);
      return;
    }
    if (defense.list.some((m) => m.alive)) return;
    quests.waveHeld(defense.id);
    const id = defense.id;
    defense = null;
    audio.play('levelup');
    if (quests.ready(id, inv)) questComplete(id);
    else { waveRest = 6; ctx.menus.message(`Wave held! Catch your breath: the next one comes in a few seconds.`); refreshQuests(); }
  }
  return { tickQuestWorld, get defense() { return defense; } };
}
