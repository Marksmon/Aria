// The owner's damage balance (CLAUDE.md, docs/job-rules.md), checked with the fight simulators: a
// balance change that breaks one of these rules fails here before it reaches a phone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { sim } from '../build-tools/sim.mjs';
import { MOB_DEFS } from '../src/mobs.js';

test('the Assassin kills field monsters about 1.4x as fast as the Blader (geometric mean)', () => {
  let logs = 0, n = 0;
  for (const [k, d] of Object.entries(MOB_DEFS)) {
    if (d.boss || d.mvp || d.night || d.raid || d.decoy || d.noRespawn || d.lv < 12) continue; // (below 12 the hero is still a Trainee)
    const b = sim('blader', d.lv, k), a = sim('assassin', d.lv, k);
    if (!b.wins || !a.wins) continue;
    logs += Math.log(Math.max(b.t, 0.5) / Math.max(a.t, 0.5)); n++;
  }
  const r = Math.exp(logs / n);
  assert.ok(n > 20, `${n} monsters`);
  assert.ok(r >= 1.25 && r <= 1.6, `Assassin / Blader ${r.toFixed(2)} (wanted about 1.4)`);
});

test('a same-level first job beats every daytime field monster from Lv 12 on (85% of fights)', () => {
  const weak = [];
  for (const [k, d] of Object.entries(MOB_DEFS)) {
    if (d.boss || d.mvp || d.night || d.raid || d.decoy || d.noRespawn || d.rare || d.lv < 12) continue;
    const best = Math.max(...['blader', 'archer', 'assassin'].map((j) => sim(j, d.lv, k).wins));
    if (best < 0.85) weak.push(`${d.name} ${Math.round(best * 100)}%`);
  }
  assert.deepEqual(weak, []);
});

test('the crosses stay in their bands, the Windrunner ahead on one target (second-sim --check)', () => {
  const out = execFileSync(process.execPath, [new URL('../build-tools/second-sim.mjs', import.meta.url).pathname, '--check'], { encoding: 'utf8' });
  assert.match(out, /every cross in its band/);
});
