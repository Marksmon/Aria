// A playtest bot for the story's stands (survive steps): a BladeMaster in shop gear (an Iron Sword, Chain Mail: the
// gear the story's own boss is tuned for, build-tools/mvp-sim.mjs STORY) stands in the circle of one step in the built
// game, fights the heralds that come, steps out of the danger marks it sees (0.35 s after they show; pass 0 to stand
// still), drinks a White Potion below half HP, and says whether the stand was held, on how many potions, and how
// much of the damage was the heralds' blows (small) and the falling fire's (big), and who dealt it (by). The Fire Giant is kept in a far
// corner (his wandering by breaks the song). It runs on Playwright's fake clock.
//
//   npx vite build && node build-tools/stand-bot.cjs [step] [base] [dodge 1|0] [port]
//   node build-tools/stand-bot.cjs lastring 72        (Chapter 12's stand; bindingring 88, rotheart 62, runespring 68)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const [, , STEP = 'lastring', BASE = '72', DODGE = '1', PORT = '4194'] = process.argv;
(async () => {
  const srv = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', PORT, '--strictPort'], { cwd: root, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 640, height: 300 }, hasTouch: true });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('#boot .tap', { state: 'visible', timeout: 120000 });
  await page.click('#boot'); await page.waitForTimeout(1500);
  await page.click('#t-continue'); await page.waitForTimeout(1200);
  await page.click('.cine-skip').catch(() => {}); await page.waitForTimeout(1500);
  await page.fill('#lookname', 'Bot'); await page.click('[data-act="lookok"]'); await page.waitForTimeout(4000);
  await page.keyboard.press('Escape');
  const info = await page.evaluate(({ base, step }) => {
    const a = window.__aria, p = a.prog;
    document.querySelector('.g-skip')?.click();
    a.story.load({ id: step, flags: { intro: true } });
    while (p.baseLv < base) a.gainExp(p.baseNeed, 0);
    Object.assign(p, { job: 'blademaster', unlocked: ['swordman', 'blademaster'], firstLv: 50, jobLv: Math.min(50, Math.max(1, base - 40)) });
    const pts = { pow: 69, qkn: 52, end: 35, knl: 9, fns: 35, ftn: 10 }, k = Math.min(1, base / 75);
    for (const s of Object.keys(pts)) p.stats[s] = Math.max(1, Math.round(pts[s] * k));
    p.skills = { basics: 9, discipline: 10, ironhide: 10, cleave: 10, heavy: 5, warcry: 3, rhythm: 1, laststand: 1, twinfang: 10, pierce: 10, blademastery: 10, comboedge: 10, momentum: 5, finalblade: 5, bladedance: 5 };
    for (const g of ['iron_sword', 'chain_mail', 'round_shield', 'wool_cape', 'leather_boots']) { a.inv.add(g, 1); a.inv.equip(g); }
    a.inv.add('potion3', 400);
    a.player.hp = a.player.maxHp;
    const s = a.story.step;
    return { lv: p.baseLv, hp: a.player.maxHp, step: s.id, map: s.map, at: s.at, secs: s.secs, points: p.statPoints };
  }, { base: +BASE, step: STEP });
  console.log('hero', JSON.stringify(info));
  await page.evaluate((m) => window.__aria.warp(m, null), info.map);
  await page.waitForTimeout(6000);
  await page.evaluate(() => { const p = window.__aria.player, f = p.placeHead.bind(p); p.placeHead = (...a) => { try { return f(...a); } catch { } }; });
  await page.clock.install();
  await page.evaluate(({ at, dodge }) => {
    const a = window.__aria, p = a.player;
    // (the Fire Giant sent off: the song won't start with him near)
    const pin = () => { for (const m of a.mobs.list) if (m.def.mvp || m.def.boss) { m.x = 4; m.z = 60; m.home = { x: 4, z: 60 }; m.state = 'wander'; } }; pin(); window.pin = pin;
    // (the ground round the circle cleared first, as a player would before they begin: what is left is the stand)
    for (const m of [...a.mobs.list]) if (m.alive && !m.def.boss && !m.def.mvp && Math.hypot(m.x - at.x, m.z - at.z) < 15) a.mobs.remove(m);
    p.setPos(at.x, at.z);
    const bot = window.bot = { t: 0, potions: 0, kills: 0, done: null, low: 1, hits: 0, heralds: 0, seen: new Set() };
    const map0 = a.world.id, td = p.takeDamage.bind(p); bot.dmg = { big: 0, bigN: 0, small: 0, smallN: 0 };
    bot.by = {}; p.takeDamage = (n, ...r) => { const got = td(n, ...r); const v = typeof n === 'number' ? n : 0; const [sx, sz] = r; const src = a.mobs.list.filter((m) => m.alive).sort((u, w) => Math.hypot(u.x - sx, u.z - sz) - Math.hypot(w.x - sx, w.z - sz))[0]; if (src && Math.hypot(src.x - sx, src.z - sz) < 0.5) { const k = `${src.def.name}${src.temp ? '' : ' (field)'}`; bot.by[k] = (bot.by[k] || 0) + v; } if (v >= p.maxHp * 0.08) { bot.dmg.big += v; bot.dmg.bigN++; } else { bot.dmg.small += v; bot.dmg.smallN++; } return got; };
    bot.map0 = map0;
    bot.said = []; const msg = a.menus.message.bind(a.menus); a.menus.message = (t, ...r) => { if (!/^Bought|Level|\+\d/.test(t)) bot.said.push(`${bot.t.toFixed(0)}s: ${String(t).slice(0, 90)}`); return msg(t, ...r); };
    const warn = a.fx.warn.bind(a.fx);
    // a danger mark near the hero: step out of it (a player's dodge), 0.35 s after it shows
    a.fx.warn = (x, z, r, ...rest) => { if (dodge && Math.hypot(x - p.x, z - p.z) < r + 0.3) setTimeout(() => { const ang = Math.atan2(p.z - z, p.x - x) || 0, d = r + 0.9; let nx = x + Math.cos(ang) * d, nz = z + Math.sin(ang) * d; if (Math.hypot(nx - at.x, nz - at.z) > 9) { nx = at.x; nz = at.z; } p.setPos(nx, nz); }, 350); return warn(x, z, r, ...rest); };
    const order = ['bladedance', 'finalblade', 'pierce', 'twinfang', 'cleave'];
    let potT = 0, started = false, hp0 = p.hp;
    setInterval(() => {
      if (bot.done) return;
      bot.t += 0.1;
      window.pin();
      const s = a.story.step;
      if (s.id !== window.botStep && window.botStep) { bot.done = 'held'; return; }
      window.botStep = s.id;
      if (p.state === 'down' || a.world.id !== bot.map0) { bot.done = 'fainted'; return; }
      if (bot.t > 150) { bot.done = 'time'; return; }
      bot.up = a.mobs.list.filter((m) => m.alive && m.temp).length;
      bot.low = Math.min(bot.low, p.hp / p.maxHp);
      if (p.hp < p.maxHp * 0.5 && bot.t >= potT) { a.useItem('potion3'); bot.potions++; potT = bot.t + 0.25; }
      if (p.sp < 60) p.sp = p.maxSp;
      const ms = a.mobs.list.filter((m) => m.alive && (m.temp || (m.state === 'chase' && !m.lulled && !m.def.boss && !m.def.mvp))).sort((u, v) => Math.hypot(u.x - p.x, u.z - p.z) - Math.hypot(v.x - p.x, v.z - p.z));
      for (const m of ms) if (m.temp && !bot.seen.has(m)) { bot.seen.add(m); bot.heralds++; bot.sample = `${m.def.name} Lv ${m.def.lv} hp ${m.def.hp} atk ${m.def.atk.join('-')}`; }
      const m = ms[0];
      if (m && Math.hypot(m.x - at.x, m.z - at.z) < 7) { if (p.goal?.mob !== m) p.command({ mob: m }); if (Math.hypot(m.x - p.x, m.z - p.z) < 2.5) for (const id of order) a.useSkill(id); }
      else if (Math.hypot(p.x - at.x, p.z - at.z) > 2) p.command({ x: at.x, z: at.z });
    }, 100);
  }, { at: info.at, dodge: DODGE === '1' });
  for (let i = 0; i < 170; i++) {
    await page.clock.runFor(1000);
    const s = await page.evaluate(() => ({ ...window.bot, seen: undefined, count: window.__aria.story.count, hp: Math.round(window.__aria.player.hp) }));
    if (i % 15 === 0) console.log(`  t=${s.t.toFixed(0)}s held=${s.count}s hp=${s.hp} potions=${s.potions} heralds=${s.heralds} up=${s.up} dmg=${JSON.stringify(s.dmg)}`);
    if (s.done) { console.log('RESULT', STEP, 'base', BASE, 'dodge', DODGE, JSON.stringify(s)); break; }
  }
  console.log('errors', errs.slice(0, 3));
  await b.close(); srv.kill();
})();
