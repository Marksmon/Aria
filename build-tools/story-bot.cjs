// A playtest bot for the whole main story (the review, November 2026): from Chapter 1 to the ending, in the built
// game, each step done the way its own trigger wants it: a talk by talking to the person on their map (they must
// stand there), a visit by going there, a kill by beating monsters of that kind (spawned by the hero: it checks the
// kind lives on the step's map), a search by walking over every spot, a stand by holding the circle while the
// heralds come (the bot strikes down any that reach the hero or the ward), a fire by beating its guards, the story's
// last boss by beating it in its arena. The hero is kept at the level of its chapter and cannot be hurt (the stands
// and bosses are measured by stand-bot.cjs and mvp-sim.mjs); a raid step is marked done (raid-sim.mjs runs raids).
// It says, step by step, how long each took and anything that did not work: a person missing, a map that will not
// load, a monster that does not live where the step sends the hero, a step that never finishes.
//
//   npx vite build && node build-tools/story-bot.cjs [from step] [port]
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const [, , FROM = 'north', PORT = '4210'] = process.argv;
// the Base Level a hero has by each chapter (test/data.test.mjs AT)
const AT = { 1: 6, 2: 10, 3: 18, 4: 28, 5: 32, 6: 38, 7: 40, 8: 45, 9: 55, 10: 60, 11: 66, 12: 72, 13: 75, 14: 76, 15: 78, 16: 85, 17: 86, 18: 87, 19: 88, 20: 90 };
const STEP_LIMIT = 260; // seconds of game time a step may take

(async () => {
  const srv = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', PORT, '--strictPort'], { cwd: root, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 640, height: 300 }, deviceScaleFactor: 0.5, hasTouch: true });
  const errs = []; page.on('pageerror', (e) => errs.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  const out = [];
  try {
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#boot .tap', { state: 'visible', timeout: 120000 });
    await page.click('#boot'); await page.waitForTimeout(1500);
    await page.click('#t-continue'); await page.waitForTimeout(1200);
    await page.click('.cine-skip').catch(() => {}); await page.waitForTimeout(1500);
    await page.fill('#lookname', 'Bot'); await page.click('[data-act="lookok"]'); await page.waitForTimeout(3000);
    await page.keyboard.press('Escape');
    await page.evaluate(({ from, AT }) => {
      const a = window.__aria, p = a.prog;
      document.querySelector('.g-skip')?.click();
      a.story.load({ id: from, flags: { intro: true, pick: 'blade' } });
      a.player.takeDamage = () => {}; // (the bot is not here to test the fights)
      window.AT = AT;
    }, { from: FROM, AT });
    await page.clock.install();
    const issues = [];
    let last = null, since = 0, steps = 0;
    for (let tick = 0; tick < 40000; tick++) {
      const r = await page.evaluate(() => {
        const a = window.__aria, p = a.prog, s = a.story.step, pl = a.player, w = a.world;
        if (!s) return { done: true };
        const ch = +(/Chapter (\d+)/.exec(s.ch)?.[1] || 0), lv = window.AT[ch] || 0;
        const note = [];
        while (p.baseLv < lv) a.gainExp(p.baseNeed, 0);
        pl.hp = pl.maxHp; pl.sp = pl.maxSp;
        if (a.cine() || document.getElementById('cine')) { document.querySelector('.cine-skip')?.click(); return { id: s.id, kind: s.kind, act: 'cutscene' }; }
        if (a.menus.isOpen('story')) { a.menus.close('story'); return { id: s.id, kind: s.kind, act: 'story window' }; }
        for (const k of ['talk', 'shop', 'journal']) if (a.menus.isOpen(k)) a.menus.close(k);
        const go = (map, at) => { if (w.id !== map) { a.warp(map, null, at || null); return true; } if (at && Math.hypot(pl.x - at.x, pl.z - at.z) > 1) pl.setPos(at.x, at.z); return false; };
        // strike down what comes at the hero or a ward (a strong player's part)
        const strike = (r = 12) => { for (const m of a.mobs.list) if (m.alive && (m.temp || m.story) && !m.def.storyBoss && Math.hypot(m.x - pl.x, m.z - pl.z) < r) m.hit(m.hp + 1, pl.x, pl.z); };
        switch (s.kind) {
          case 'talk': {
            const n = a.villagers.list.find((v) => v.id === s.npc);
            const map = a.story.map();
            if (go(map)) return { id: s.id, kind: s.kind, act: `to ${map}` };
            if (!n || n.map !== w.id) return { id: s.id, kind: s.kind, act: 'talk', issue: `${s.npc} does not stand on ${w.id}` };
            pl.setPos(n.x, n.z + 1.4);
            a.storyDone();
            return { id: s.id, kind: s.kind, act: 'talked' };
          }
          case 'visit': go(s.map); return { id: s.id, kind: s.kind, act: `to ${s.map}` };
          case 'kill': {
            const map = s.map || w.id;
            if (go(map)) return { id: s.id, kind: s.kind, act: `to ${map}` };
            const types = s.mobs || [s.mob];
            const spawns = (a.SPAWNS?.[map] || []).map(([t]) => t);
            const boss = types.some((t) => a.mobs.list.some((m) => m.type === t && m.def.storyBoss));
            for (const t of types) if (a.SPAWNS && !spawns.includes(t) && !boss) note.push(`${t} does not live on ${map}`);
            const live = a.mobs.list.find((m) => m.alive && types.includes(m.type));
            if (live) { live.hit(live.hp + 1, pl.x, pl.z); return { id: s.id, kind: s.kind, act: `beat a ${live.type}`, issue: note[0] }; }
            if (!a.mobs.list.some((m) => m.def.storyBoss)) { const m = a.mobs.add(types[0], pl.x + 2, pl.z); m.hit(m.hp + 1, pl.x, pl.z); }
            return { id: s.id, kind: s.kind, act: 'spawned one', issue: note[0] };
          }
          case 'search': {
            const next = a.story.toFind(s)[0];
            if (!next) return { id: s.id, kind: s.kind, act: 'all found' };
            if (go(next.map, { x: next.x, z: next.z })) return { id: s.id, kind: s.kind, act: `to ${next.map}` };
            if (!w.walkable(next.x, next.z)) note.push(`a spot on ${next.map} at ${next.x},${next.z} is not walkable`);
            return { id: s.id, kind: s.kind, act: 'walking the spots', issue: note[0] };
          }
          case 'survive': {
            if (go(s.map, s.at)) return { id: s.id, kind: s.kind, act: `to ${s.map}` };
            strike(14);
            return { id: s.id, kind: s.kind, act: `holding ${a.story.count}/${s.secs}` };
          }
          case 'fires': {
            if (go(s.map)) return { id: s.id, kind: s.kind, act: `to ${s.map}` };
            const f = a.story.burning(s)[0];
            if (!f) return { id: s.id, kind: s.kind, act: 'all out' };
            if (Math.hypot(f.x - pl.x, f.z - pl.z) > 1.5) pl.setPos(f.x + 1, f.z);
            strike(8);
            return { id: s.id, kind: s.kind, act: `fire ${f.i}` };
          }
          case 'raid': a.story.flag(s.id); return { id: s.id, kind: s.kind, act: 'raid marked (raid-sim runs raids)' };
          case 'job': Object.assign(p, { job: 'swordman', unlocked: ['swordman'], firstLv: 1, jobLv: 1 }); a.prog.jobLv = 40; return { id: s.id, kind: s.kind, act: 'took the Blader' };
          case 'job2': Object.assign(p, { job: 'blademaster', unlocked: ['swordman', 'blademaster'], firstLv: 50, jobLv: 1 }); return { id: s.id, kind: s.kind, act: 'took the BladeMaster' };
          case 'job2skill': p.skills.bladedance = Math.max(1, p.skills.bladedance || 0); return { id: s.id, kind: s.kind, act: 'learnt a skill' };
          case 'level': while (p.baseLv < s.lv) a.gainExp(p.baseNeed, 0); return { id: s.id, kind: s.kind, act: `Base ${s.lv}` };
          case 'keeper': a.keepers.add(s.npc || 'keeper_city'); a.keepers.add('keeper_camp'); return { id: s.id, kind: s.kind, act: 'signed in' };
          default: return { id: s.id, kind: s.kind, act: 'waiting', issue: `the bot does not know a ${s.kind} step` };
        }
      });
      if (r.done) { if (last) console.log(`${last.padEnd(14)} ${String(Math.round(since)).padStart(4)} s`); console.log('the story is told'); steps++; break; }
      if (r.id !== last) {
        if (last) { steps++; out.push(`${last.padEnd(14)} ${String(Math.round(since)).padStart(4)} s`); console.log(out.at(-1)); }
        last = r.id; since = 0;
      }
      if (r.issue && !issues.some((i) => i.id === r.id && i.issue === r.issue)) issues.push({ id: r.id, issue: r.issue });
      const dt = /^to /.test(r.act) ? 2500 : 400; // (a warp: give the map time to build)
      if (/^to /.test(r.act)) await page.waitForTimeout(1500);
      try { await page.clock.runFor(dt); } catch (e) { issues.push({ id: r.id, issue: `the game threw: ${e.message.split('\n')[0]}` }); }
      since += dt / 1000;
      if (since > STEP_LIMIT) { issues.push({ id: r.id, issue: `never finished (${r.act})` }); out.push(`${last.padEnd(14)} STUCK: ${r.act}`); break; }
    }
    console.log(`steps done: ${steps}`);
    console.log('issues', JSON.stringify(issues, null, 1));
  } finally {
    console.log('errors', errs.slice(0, 5));
    await b.close(); srv.kill();
  }
})();
