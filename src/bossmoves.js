// Boss moves on screen (moved out of main.js): the red circles and what lands when they fill, each boss's own
// mechanic (Meteor Rain's burning ground, the Riddle, Mirror Image, Gnaw...), the MVP's death and its rewards,
// and the hints a boss fight gives. main.js calls installBossMoves once, where these lines used to be, with the
// game's pieces; menus is read through ctx when a move lands (it is made later in main.js).
import * as THREE from 'three';
import { MOVES, MVP_MOVE, RIDDLE, RIDDLES, fierce } from './mobs.js';
import { mobAttack } from './rules.js';
import { RATES } from './progress.js';
import { clamp } from './noise.js';

export function installBossMoves(ctx) {
  const { allies, audio, cam, fx, gainExp, inv, mobs, overHead, persist, player, scene, world } = ctx;
  // ---------- boss moves (mobs.js MOVES): a red circle shows where each lands ----------
  const MOVE_COL = { fire: '#ff6a1a', earth: '#c8a06a', wind: '#dff7c8', water: '#9fe0ff', shadow: '#a89cff' };
  // a boss move lands: mult x the boss's ATK if you stand within r of (x, z)
  function bossBlow(m, mult, x, z, r, ranged = false) {
    if (ranged) for (const b of allies.list) { // a thrown or falling blow (Boulder, Meteor Rain...) reaches the Hawk in the air too
      if (!b.K.fly || !b.canBeHit(true) || Math.hypot(b.x - x, b.z - z) > r + b.K.r) continue;
      const res = mobAttack(m.def, b.ps, mult * m.fury, fierce(m.def) ? MVP_MOVE : undefined);
      if (res.miss) fx.number(b.x, overHead(b, b.sprite.scale.y * 0.7), b.z, 'Miss', 'miss');
      else b.takeDamage(res.dmg, x, z);
    }
    if (Math.hypot(player.x - x, player.z - z) > r + 0.3 || !player.canBeHit() || player.state === 'down') return;
    cam.shake = 0.3;
    const res = mobAttack(m.def, player.ps, mult * m.fury, fierce(m.def) ? MVP_MOVE : undefined); // (an MVP's: no FLEE, little DEF)
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
    if (a.kind === 'roots') for (const p of a.spots) fx.warn(p.x, p.z, a.mv.r, MOVES.roots.wind + MOVES.roots.land);
    if (a.kind === 'devour') fx.warn(a.spot.x, a.spot.z, 1.4, MOVES.devour.wind);
    if (a.kind === 'surge') { // the line the serpent will run, marked all along
      const M = MOVES.surge;
      for (let d = 1.6; d <= M.len; d += 1.5) fx.warn(a.from.x + a.dir.x * d, a.from.z + a.dir.z * d, M.w, M.wind + d / M.len * 0.65, MOVE_COL.water);
    }
    if (a.kind === 'prison') fx.warn(a.spot.x, a.spot.z, MOVES.prison.r, MOVES.prison.wind);
    if (a.kind === 'maelstrom') { fx.warn(a.spot.x, a.spot.z, MOVES.maelstrom.r, MOVES.maelstrom.wind, MOVE_COL.water); fx.warn(a.spot.x, a.spot.z, MOVES.maelstrom.core, MOVES.maelstrom.wind); }
  });
  // ---------- Poseidon's moves (mobs.js MOVES.surge, prison, maelstrom) ----------
  // Leviathan Surge: a sea serpent rushes down the marked line; whoever is on it when it passes is struck, once
  mobs.on('surge', (m, a) => {
    const map = world.id, M = MOVES.surge, steps = Math.ceil(M.len / 1.2);
    let hit = false;
    audio.play('dodge');
    for (let i = 0; i <= steps; i++) setTimeout(() => {
      if (world.id !== map) return;
      const d = 1 + i * 1.2, x = a.from.x + a.dir.x * d, z = a.from.z + a.dir.z * d, gy = world.heightAt(x, z);
      fx.puff(x, gy + 0.2, z, M.w * 1.1);
      fx.sparkle(x, gy + 0.5, z, i % 2 ? '#f2fbff' : MOVE_COL.water, 6);
      if (!hit && m.alive && Math.hypot(player.x - x, player.z - z) <= M.w + 0.3 && player.canBeHit() && player.state !== 'down') {
        hit = true;
        bossBlow(m, a.mv.mult, x, z, M.w);
      }
    }, i * M.every * 1000);
  });
  // Oceanic Prison: caught in its circle, a cage of water closes round you. You can't walk away and he is shielded
  // while it stands; it drowns you every second, and crashes down on you if it still stands when its time is up.
  // Break it (it takes your blows, and your beasts')
  const prisons = [];
  mobs.on('prison', (m, a) => {
    const M = MOVES.prison, { x, z } = a.spot, gy = world.heightAt(x, z);
    fx.puff(x, gy + 0.2, z, M.r * 1.2);
    fx.sparkle(x, gy + 0.6, z, MOVE_COL.water, 18);
    audio.play('hit');
    if (Math.hypot(player.x - x, player.z - z) > M.r + 0.3 || !player.canBeHit() || player.state === 'down' || !m.alive) return;
    const cell = mobs.prison(m, player.x, player.z);
    prisons.push({ m, cell, mv: a.mv, map: world.id, t: M.hold * (m.enraged ? 0.8 : 1), tick: M.tick });
    player.rootT = Math.max(player.rootT, 0.5); player.path = [];
    player.command?.({ mob: cell });
    fx.number(player.x, overHead(player, 1.6), player.z, 'Imprisoned!', 'miss');
    ctx.menus.message('Poseidon\'s Oceanic Prison closes round you! Break it before you drown: strike the water, quickly!');
  });
  function prisonTick(dt) {
    for (let i = prisons.length - 1; i >= 0; i--) {
      const P = prisons[i], { m, cell } = P;
      if (!cell.alive) { // broken
        prisons.splice(i, 1);
        player.rootT = 0;
        if (world.id === P.map) { fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#f2fbff', 24); ctx.menus.message('You break out of the Oceanic Prison!'); }
        continue;
      }
      if (world.id !== P.map || !m.alive || player.state === 'down') { mobs.vanish(cell); prisons.splice(i, 1); player.rootT = 0; continue; }
      cell.x = player.x; cell.z = player.z; // (it holds you where you are)
      player.rootT = Math.max(player.rootT, 0.25);
      if ((P.tick -= dt) <= 0) {
        P.tick = MOVES.prison.tick;
        fx.number(player.x, overHead(player, 1.6), player.z, 'Drowning!', 'miss');
        bossBlow(m, P.mv.drown, player.x, player.z, 99);
      }
      if ((P.t -= dt) <= 0) { // it crashes down on you
        mobs.vanish(cell); prisons.splice(i, 1); player.rootT = 0;
        cam.shake = 0.5;
        fx.puff(player.x, world.heightAt(player.x, player.z) + 0.2, player.z, 2.2);
        fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, MOVE_COL.water, 30);
        audio.play('hit');
        bossBlow(m, P.mv.crash, player.x, player.z, 99);
        ctx.menus.message('The Oceanic Prison crashes down on you!');
      }
    }
  }
  // Raging Maelstrom: a whirlpool round where you stood, pulling you in to its heart, which strikes whoever is in it
  const whirls = [];
  mobs.on('maelstrom', (m, a) => {
    const M = MOVES.maelstrom, { x, z } = a.spot;
    whirls.push({ m, mv: a.mv, map: world.id, x, z, t: M.dur, tick: 0, spin: 0 });
    fx.warn(x, z, M.r, M.dur, MOVE_COL.water);
    fx.warn(x, z, M.core, M.dur);
    cam.shake = 0.3; audio.play('night');
    ctx.menus.message('Poseidon raises a Raging Maelstrom! It drags you to its heart: walk out of it, away from the middle!');
  });
  function whirlTick(dt) {
    const M = MOVES.maelstrom;
    for (let i = whirls.length - 1; i >= 0; i--) {
      const W = whirls[i];
      if ((W.t -= dt) <= 0 || !W.m.alive || world.id !== W.map) { whirls.splice(i, 1); continue; }
      W.spin += dt * 4;
      if (Math.random() < dt * 14) { const a = W.spin + Math.random() * 6.3, r = 0.6 + Math.random() * M.r; fx.sparkle(W.x + Math.cos(a) * r, world.heightAt(W.x, W.z) + 0.2, W.z + Math.sin(a) * r, Math.random() < 0.3 ? '#f2fbff' : MOVE_COL.water, 2); }
      const dx = W.x - player.x, dz = W.z - player.z, d = Math.hypot(dx, dz);
      if (d > M.r || player.state === 'down' || !player.canBeHit()) continue;
      if (d > 0.05) { // the pull (walls still stop it)
        const k = Math.min(d, M.pull * (W.m.enraged ? 1.25 : 1) * dt) / d;
        const [nx, nz] = world.resolve(player.x + dx * k, player.z + dz * k, 0.3);
        if (world.walkable(nx, nz) && !world.isSafe(nx, nz)) { player.x = nx; player.z = nz; }
      }
      if (d <= M.core && (W.tick -= dt) <= 0) { W.tick = M.tick; bossBlow(W.m, W.mv.mult, W.x, W.z, M.core); }
    }
  }
  // Tremor (mobs.js TREMOR): the ground cracks under a hero who stands still by an MVP; step aside
  mobs.on('tremor', (m, spot, T) => {
    const map = world.id;
    fx.warn(spot.x, spot.z, T.hit, T.wind);
    fx.number(player.x, overHead(player, 1.6), player.z, 'Tremor!', 'skill');
    setTimeout(() => {
      if (world.id !== map || !m.alive) return;
      const gy = world.heightAt(spot.x, spot.z);
      fx.puff(spot.x, gy + 0.2, spot.z, T.hit * 1.2);
      fx.sparkle(spot.x, gy + 0.3, spot.z, MOVE_COL[m.def.el] || '#ffffff', 14);
      audio.play('hit');
      bossBlow(m, T.mult, spot.x, spot.z, T.hit);
    }, T.wind * 1000);
  });
  // Devour (Ammit): it rears and bites where the red circle is; caught, it heals on what it tore from you
  mobs.on('devour', (m, mv, spot) => {
    const y = world.heightAt(spot.x, spot.z);
    fx.puff(spot.x, y + 0.2, spot.z, 1.4);
    fx.sparkle(spot.x, y + 0.4, spot.z, '#c83a3a', 14);
    audio.play('hit');
    const caught = Math.hypot(player.x - spot.x, player.z - spot.z) <= 1.7 && player.canBeHit() && player.state !== 'down';
    bossBlow(m, mv.mult, spot.x, spot.z, 1.4);
    if (!caught || !m.alive) return;
    const n = Math.round(m.def.hp * (mv.heal || 0));
    m.hp = Math.min(m.def.hp, m.hp + n);
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Devoured!', 'skill');
    ctx.menus.message(`${TheName(m)} devours what it tore from you, and its wounds close!`);
  });
  // Gnaw the Roots (Nidhogg, mobs.js MOVES.gnaw): it sinks its teeth into the World Tree's roots, healing
  // as it gnaws while the rot withers whoever is in its hall; tear it away (enough damage in time) or it rises gorged
  mobs.on('gnaw', (m, act) => {
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Gnaw the Roots', 'skill');
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 0.6, m.z, '#9aff6a', 30);
    cam.shake = 0.4; audio.play('night');
    ctx.menus.message(`Nidhogg sinks its teeth into the World Tree's roots! It heals as it gnaws, and the rot withers everything in the hall. Hit it hard, fast: ${act.need.toLocaleString()} damage tears it away!`);
  });
  mobs.on('gnawTick', (m, act) => {
    fx.puff(m.x, world.heightAt(m.x, m.z) + 0.3, m.z, 2.2);
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, `Torn ${Math.min(99, Math.floor(act.taken / act.need * 100))}%`, 'miss');
    if (mobs.inHall(player.x, player.z)) { // the rot: wherever you stand in the hall
      fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.4, player.z, '#9aff6a', 6);
      bossBlow(m, act.mv.mult, player.x, player.z, 99);
    }
  });
  mobs.on('gnawTorn', (m) => {
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Torn Away!', 'crit');
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.5, m.z, '#ffd23a', 30);
    audio.play('levelup');
    ctx.menus.message('You tear Nidhogg away from the roots! It reels: strike now, its scales are open!');
  });
  mobs.on('gnawDone', (m) => {
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Gorged!', 'skill');
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff4a3a', 24);
    audio.play('night');
    ctx.menus.message('Nidhogg rises from the roots, gorged and furious!');
  });
  let lastRiddle = -1;
  function riddleLabel(text) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 72;
    const g = c.getContext('2d');
    g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = '#1a1008'; g.strokeText(text, 160, 36);
    g.fillStyle = '#ffe9a8'; g.fillText(text, 160, 36);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    sp.scale.set(3.2, 0.72, 1);
    sp.renderOrder = 6;
    return sp;
  }
  mobs.on('riddle', (m, act) => {
    let k = Math.floor(Math.random() * RIDDLES.length);
    if (k === lastRiddle) k = (k + 1) % RIDDLES.length;
    lastRiddle = k;
    const [q, right, ...wrong] = RIDDLES[k];
    const answers = [right, ...wrong].sort(() => Math.random() - 0.5);
    // three circles round the hero, inside the hall, on open ground (not in a pillar)
    const H = world.hall, turn = Math.random() * Math.PI * 2;
    act.circles = answers.map((word, i) => {
      const a = turn + (i / 3) * Math.PI * 2;
      let x = player.x + Math.cos(a) * RIDDLE.ring, z = player.z + Math.sin(a) * RIDDLE.ring;
      if (H) { x = clamp(x, H.x0 + 2, H.x1 - 2); z = clamp(z, H.z0 + 2, H.z1 - 2); }
      [x, z] = world.resolve(x, z, RIDDLE.r * 0.6);
      fx.warn(x, z, RIDDLE.r, act.t, '#ffd23a');
      const label = riddleLabel(word);
      label.position.set(x, world.heightAt(x, z) + 1.4, z);
      scene.add(label);
      return { x, z, word, right: word === right, label };
    });
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'The Riddle', 'skill');
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 2, m.z, '#ffd23a', 30);
    audio.play('night');
    ctx.menus.message(`The Eternal Sphinx asks: "${q}" Stand in the circle of the right answer, quickly!`);
  });
  mobs.on('riddleEnd', (m, act) => {
    for (const c of act.circles || []) { scene.remove(c.label); c.label.material.map.dispose(); c.label.material.dispose(); }
    if (!m.alive || !act.circles) return;
    const at = act.circles.find((c) => Math.hypot(player.x - c.x, player.z - c.z) <= RIDDLE.r + 0.25);
    const answer = act.circles.find((c) => c.right).word;
    if (at?.right) { // right: it is struck dumb, and its stone gives
      m.stunT = RIDDLE.stun; m.status = 'stun'; m.exposeT = RIDDLE.exposeFor;
      fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Dumbstruck!', 'crit');
      fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 24);
      audio.play('levelup');
      ctx.menus.message(`"${answer}"... Right! The Eternal Sphinx is dumbstruck: strike now, its stone gives way!`);
      return;
    }
    // wrong, or no answer: its Judgment falls on whoever stands in its hall, and it is Exalted
    m.exaltT = RIDDLE.exaltFor;
    cam.shake = 0.6;
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1.5, player.z, '#ffd23a', 30);
    fx.puff(player.x, world.heightAt(player.x, player.z) + 0.2, player.z, 1.6);
    if (mobs.inHall(player.x, player.z)) bossBlow(m, act.mv.mult, player.x, player.z, 99);
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Exalted!', 'skill');
    ctx.menus.message(`${at ? 'Wrong!' : 'No answer!'} The answer was "${answer}". Judgment falls, and the Eternal Sphinx is exalted: it takes half as much for a while.`);
  });
  // Grasping Roots (the Ancient Treant): they burst up `land` s later; caught, you are held there
  mobs.on('roots', (m, spots, mv, land) => {
    const map = world.id;
    setTimeout(() => {
      if (world.id !== map || !m.alive) return;
      for (const p of spots) {
        const gy = world.heightAt(p.x, p.z);
        fx.puff(p.x, gy + 0.2, p.z, mv.r * 1.1);
        fx.sparkle(p.x, gy + 0.3, p.z, '#8a6a3a', 14);
      }
      audio.play('hit');
      const caught = spots.some((p) => Math.hypot(player.x - p.x, player.z - p.z) <= mv.r + 0.3);
      if (!caught || !player.canBeHit() || player.state === 'down') return;
      bossBlow(m, mv.mult, player.x, player.z, mv.r);
      player.rootT = (mv.hold || 3) * (m.enraged ? 1.4 : 1);
      player.path = [];
      ctx.menus.message('Roots hold you fast! You can still fight, but not get away.');
      fx.number(player.x, overHead(player, 1.5), player.z, 'Rooted!', 'miss');
    }, land * 1000);
  });
  // Bark Armor (the Ancient Treant): its bark hardens, and what hits it hits back
  mobs.on('bark', (m, mv) => {
    ctx.menus.message(`The ${m.def.name} hardens its bark! Hits bounce back at you: hold off for a moment.`);
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, mv.name || 'Bark Armor', 'skill');
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#c8a05a', 24);
    audio.play('block');
  });
  mobs.on('reflect', (m, n, from) => {
    const foe = from || player;
    if (!foe.canBeHit?.() || foe.state === 'down') return;
    if (foe === player) fx.number(player.x, overHead(player, 1.6), player.z, 'Reflected', 'miss');
    foe.takeDamage(n, m.x, m.z);
  });
  // a boss you keep away from gives chase in a burst (mobs.js BRAIN)
  mobs.on('pursuit', (m) => { fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Pursues!', 'skill'); fx.puff(m.x, world.heightAt(m.x, m.z) + 0.15, m.z, 1.0); });
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
        bossBlow(m, mv.mult, spot.x, spot.z, mv.r, true);
      }, 0.9);
    }, Math.max(0, land - travel) * 1000);
  });
  mobs.on('slam', (m, mv) => {
    const y = world.heightAt(m.x, m.z);
    fx.puff(m.x, y + 0.2, m.z, mv.r * 1.3);
    fx.sparkle(m.x, y + 0.3, m.z, MOVE_COL[m.def.el] || '#ffffff', 20);
    audio.play('hit');
    bossBlow(m, mv.mult, m.x, m.z, mv.r);
    if (m.def.burns) burnGround(m, m.x, m.z);
  });
  // burning ground (the Fire Giant's def.burns): where its meteors and leaps land, the ground burns
  // for a while; standing in it burns you every half second (mult x its ATK)
  const burning = [];
  function burnGround(m, x, z) {
    const b = m.def.burns;
    burning.push({ m, map: world.id, x, z, r: b.r, t: b.dur, tick: 0.5 });
    fx.warn(x, z, b.r, b.dur, b.color || '#ff8a2a');
  }
  function burnTick(dt) {
    prisonTick(dt); whirlTick(dt); // (Poseidon's, above)
    for (let i = burning.length - 1; i >= 0; i--) {
      const b = burning[i];
      b.t -= dt;
      if (b.t <= 0 || !b.m.alive || world.id !== b.map) { burning.splice(i, 1); continue; }
      const B = b.m.def.burns;
      if (Math.random() < dt * 3) fx.sparkle(b.x + (Math.random() - 0.5) * b.r, world.heightAt(b.x, b.z) + 0.2, b.z + (Math.random() - 0.5) * b.r, B.color || '#ff7a2a', 2);
      if ((b.tick -= dt) > 0) continue;
      b.tick = 0.5;
      if (Math.hypot(player.x - b.x, player.z - b.z) > b.r || !player.canBeHit() || player.state === 'down') continue;
      if (B.slow) player.slowT = Math.max(player.slowT, 0.8); // (sticky gel: it slows you too)
      const res = mobAttack(b.m.def, player.ps, B.mult * b.m.fury, MVP_MOVE);
      if (!res.miss) { player.takeDamage(res.dmg, b.x, b.z); fx.number(player.x, overHead(player, 1.6), player.z, B.word || 'Burning!', 'miss'); }
    }
  }
  // an MVP's matchup (mobs.js def.takes): told once when it first comes for you
  function matchupHint() {
    for (const m of mobs.list) {
      if (!m.alive || !m.def.takesText || m.def.decoy || m.toldTakes || m.state !== 'chase' || Math.hypot(m.x - player.x, m.z - player.z) > 10) continue;
      m.toldTakes = true;
      ctx.menus.message(`${TheName(m)}: ${m.def.takesText}.`);
    }
  }
  // Meteor Rain (the Fire Giant): fireballs fall one after another round you, each a red circle first
  mobs.on('meteors', (m, mv, n) => {
    const map = world.id, M = MOVES.meteors;
    ctx.menus.message(`${TheName(m)} calls down ${mv.name || 'a Meteor Rain'}! Keep moving!`);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (world.id !== map || !m.alive) return;
        const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 2.8; // the first where you are (or going: mobs.js BRAIN)
        const spot = i ? { x: player.x + Math.cos(a) * r, z: player.z + Math.sin(a) * r } : m.aimAt(player, M.land);
        fx.warn(spot.x, spot.z, mv.r, M.land);
        const gy = world.heightAt(spot.x, spot.z), fall = 9 / 13; // (fx.bolt flies 13 paces a second)
        setTimeout(() => {
          if (world.id !== map || !m.alive) return;
          fx.bolt(spot.x, gy + 9, spot.z, { x: spot.x, z: spot.z, alive: true }, mv.color || '#ff6a1a', () => {
            if (world.id !== map || !m.alive) return;
            fx.puff(spot.x, gy + 0.2, spot.z, mv.r * 1.2);
            fx.sparkle(spot.x, gy + 0.3, spot.z, mv.color || '#ff6a1a', 14);
            audio.play('hit');
            bossBlow(m, mv.mult, spot.x, spot.z, mv.r, true);
            if (m.def.burns) burnGround(m, spot.x, spot.z);
          }, 0.9);
        }, Math.max(0, M.land - fall) * 1000);
      }, i * M.every * 1000);
    }
  });
  // Burrow (the Kobold King): he digs in (he can't be hit), and a red circle marks where he bursts out
  mobs.on('burrow', (m) => {
    const y = world.heightAt(m.x, m.z);
    fx.puff(m.x, y + 0.2, m.z, 1.4);
    fx.sparkle(m.x, y + 0.3, m.z, '#c8a06a', 16);
    audio.play('dodge');
    ctx.menus.message(m.def.wyrm ? `The ${m.def.name} dives under the sand! Watch for its mound, and keep moving.` : `The ${m.def.name} burrows into the ground! Watch your feet.`);
  });
  mobs.on('burrowMark', (m, spot, mv, t) => fx.warn(spot.x, spot.z, mv.r, t));
  mobs.on('erupt', (m, mv, spot) => {
    const y = world.heightAt(spot.x, spot.z);
    fx.puff(spot.x, y + 0.2, spot.z, mv.r * 1.3);
    fx.sparkle(spot.x, y + 0.3, spot.z, '#c8a06a', 22);
    audio.play('hit');
    cam.shake = 0.35;
    bossBlow(m, mv.mult, spot.x, spot.z, mv.r);
  });
  // Mirror Image (the Goblin King): shadows of him, and he hides among them
  mobs.on('mirror', (m, mv) => {
    ctx.menus.message(mv.text || `The ${m.def.name} splits into three! Cut down his shadows: he is shrouded while they stand.`);
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, mv.name || 'Mirror Image', 'skill');
    audio.play('night');
  });
  // a blow that barely lands (mobs.js ward): underground, behind his tribe, shrouded by shadows
  const WARD_HINT = { prison: 'Shielded!', under: 'Underground!', tribe: 'Guarded!', mirror: 'Shrouded!', jelly: 'Jelly Wall!', jar: 'Sealed!', exalt: 'Exalted!' };
  let wardHintAt = 0;
  mobs.on('warded', (m) => {
    const why = mobs.decoysOf(m)[0]?.type === 'tidePrison' ? 'prison' : m.under ? 'under' : m.exaltT > 0 ? 'exalt' : m.def.tribe && mobs.guardsOf(m).some((g) => !g.def.decoy) ? 'tribe' : mobs.decoysOf(m)[0]?.type === 'jellyCore' ? 'jelly' : mobs.decoysOf(m)[0]?.type === 'canopicJar' ? 'jar' : 'mirror';
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, WARD_HINT[why], 'miss');
    if (why === 'tribe' && performance.now() - wardHintAt > 15000) { wardHintAt = performance.now(); ctx.menus.message(`The ${m.def.name} hides behind his tribe! Bring down his guards first.`); }
  });
  // "the Fire Giant", but BleepBloop is a name
  const theName = (m) => (m.def.raidLv || m.def.proper ? m.def.name : `the ${m.def.name}`);
  const TheName = (m) => theName(m)[0].toUpperCase() + theName(m).slice(1);
  mobs.on('enrage', (m) => { // an MVP (or the Hell raid's boss) below half its HP (mobs.js MVP_RAGE)
    ctx.menus.message(`${TheName(m)} is enraged! It hits harder and faster now.`);
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Enraged!', 'skill');
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff3a2a', 28);
    cam.shake = 0.4;
    audio.play('night');
  });
  mobs.on('frenzy', (m) => {
    ctx.menus.message(`${TheName(m)} flies into a frenzy!`);
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
    fx.bolt(m.x, y, m.z, foe === player ? playerMark : foe, m.def.shot || '#efe2c0', () => {
      if (!m.alive && !mobs.list.includes(m)) return;
      if (!foe.canBeHit(true) || foe.state === 'down') return; // (an arrow: it reaches the Hawk too)
      const res = mobAttack(m.def, foe.ps);
      if (res.miss) fx.number(foe.x, overHead(foe, 1.3), foe.z, res.dodge ? 'Lucky!' : 'Miss', 'miss');
      else foe.takeDamage(res.dmg, m.x, m.z);
    }, 0.2);
  });
  mobs.on('dash', (m) => { audio.play('dodge'); fx.puff(m.x, world.heightAt(m.x, m.z) + 0.15, m.z, 0.5); });
  mobs.on('double', () => fx.number(player.x, overHead(player, 1.6), player.z, 'Double!', 'miss'));
  mobs.on('summon', (m) => {
    ctx.menus.message(m.def.summonText || `The ${m.def.name} calls his guards!`);
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.5, m.z, '#ffd23a', 14);
    audio.play('night');
  });
  mobs.on('mvpSpawn', (m) => { // an MVP announces itself; a mini-boss just turns up
    if (!m.def.mvp) return;
    ctx.menus.message(m.def.wake || `The ${m.def.name} has appeared!`);
    audio.play('night');
  });
  mobs.on('bossDown', (m) => {
    const mins = Math.round(m.def.respawn / 60);
    setTimeout(() => ctx.menus.message(`${TheName(m)} will return in about ${mins} minutes.`), 2500);
    persist();
  });
  // Ragnarok's MVP: the announcement over the slayer's head, MVP EXP and items straight to the bag
  mobs.on('mvp', (m) => {
    const d = m.def;
    fx.number(player.x, overHead(player, 1.7), player.z, 'MVP', 'mvp', player);
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 30);
    audio.play('levelup');
    ctx.menus.message(`You defeated ${theName(m)}! MVP! +${d.mvpExp * RATES.base} Base EXP`);
    for (const [id, n] of d.mvpDrops) {
      const got = inv.add(id, n);
      if (got < n) inv.chest.add(id, n - got);
      ctx.menus.toast(id, n);
    }
    gainExp(d.mvpExp, 0, RATES);
    const mins = Math.round(d.respawn / 60);
    setTimeout(() => ctx.menus.message(`${TheName(m)} will return in about ${mins} minutes.`), 2500);
    persist();
  });
  return { burnTick, matchupHint };
}
