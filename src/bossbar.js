// The boss's big health bar (moved out of raids.js, November 2026): a raid's boss, and any mini-boss or MVP that
// fights the hero in the open. An MVP is a fight of minutes with a plan (its guards at 80/50/25%, its rage below
// half, Davy Jones's phases), and its HP was only a thin bar over a sprite taller than the screen: the bar says
// how the fight stands, with a mark at each of those turns. main.js calls installBossBar once and ticks it.
import { callMarks, fierce, MVP_RAGE, tierOf } from './mobs.js';

const NEAR = 18, HOLD = 3; // paces a boss's fight is shown from; seconds the bar stays once it stops

// the shares of its HP where a boss turns: it calls its guards, rages, or moves on to its next phase
export const bossMarks = (d) => [...new Set([...(d.summon ? callMarks(d) : []), ...(fierce(d) ? [MVP_RAGE.below] : []), ...(d.phases || []).map((p) => p.below)])]
  .filter((v) => v > 0 && v < 1).sort((a, b) => b - a);
// the boss whose bar shows: the raid's, else the nearest one that fights the hero (the one they picked first)
export function bossToShow(list, player, raidBoss = null) {
  if (raidBoss?.alive) return raidBoss;
  const target = player.goal?.mob;
  let best = null, score = Infinity;
  for (const m of list) {
    if (!m.alive || !(m.def.boss || m.def.mvp) || m.def.decoy) continue;
    const d = Math.hypot(m.x - player.x, m.z - player.z);
    if (d > NEAR || !(m === target || m.state === 'chase' || m.act)) continue;
    const k = m === target ? -1 : d;
    if (k < score) { score = k; best = m; }
  }
  return best;
}

export function installBossBar(ctx) {
  const { mobs, player } = ctx;
  const el = document.getElementById('bossbar'), nameEl = el.querySelector('.bb-name'), bar = el.querySelector('.bb-bar'), fill = bar.querySelector('i');
  let boss = null, shown = 1, holdT = 0, placeT = 0;
  // between the hero's panel (and a Beastmaster's beasts) on the left and the buttons by the minimap on the right
  function place() {
    const z = ctx.zoom?.() || 1, edge = (id, side) => { const e = document.getElementById(id); return e && !e.hidden && e.offsetWidth ? e.getBoundingClientRect()[side] : null; };
    const left = Math.max(edge('info', 'right') ?? 0, edge('pets', 'right') ?? 0) + 10;
    const right = Math.min(edge('goalsbtn', 'left') ?? innerWidth, edge('minimap', 'left') ?? innerWidth) - 10;
    const w = Math.max(150, Math.min(520 * z, right - left));
    el.style.width = `${w / z}px`;
    el.style.left = `${(left + Math.max(0, right - left - w) / 2) / z}px`;
  }
  function show(m) {
    boss = m;
    shown = 1;
    const tier = m.def.raidLv ? null : tierOf(m.type);
    nameEl.textContent = `${m.def.name}${m.def.mvp ? ' ✦ MVP' : ''} · Lv ${m.def.lv}${tier ? ` · for Base ${tier}+` : ''}`;
    for (const s of bar.querySelectorAll('s')) s.remove();
    for (const v of bossMarks(m.def)) { const s = document.createElement('s'); s.style.left = `${v * 100}%`; bar.appendChild(s); }
    place();
    el.hidden = false;
  }
  function tick(dt) {
    const now = bossToShow(mobs.list, player, ctx.raidBoss?.());
    if (now && now !== boss) show(now);
    if (now) holdT = HOLD;
    else if (boss && (!boss.alive || (holdT -= dt) <= 0 || !mobs.list.includes(boss))) boss = null;
    el.hidden = !boss;
    if (!boss) return;
    if ((placeT -= dt) <= 0) { placeT = 1; place(); }
    const f = Math.max(0, Math.min(1, boss.hp / (boss.def.hp || 1)));
    fill.style.width = `${(f * 100).toFixed(1)}%`;
    el.classList.toggle('low', f < 0.3);
    if (f < shown - 0.001) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); } // a blow lands: the bar flashes
    shown = f;
  }
  return { tick, get boss() { return boss; } };
}
