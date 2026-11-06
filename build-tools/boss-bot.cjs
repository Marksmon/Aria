// A playtest bot: a BladeMaster fights one boss in the real game (the built game in Chromium), to check what
// build-tools/mvp-sim.mjs says about the boss tiers. The hero is the sim's own (its Base 75 MELEE stat build, the
// BladeMaster's skills), in the sim's good gear (a Giant Sword +7, armor at +4) or shop gear; the field round the
// boss is cleared (a duel, as the sim has it). Each tenth of a second it keeps on the boss, uses Blade Dance,
// Final Blade, Piercing Edge and Twin Fang when they are ready, drinks a White Potion below half HP, and steps
// aside from each Tremor (Blue Potions are not counted, as in the sim). It runs on Playwright's fake clock, so a
// fight takes about as long as it would in play (swiftshader draws slowly), or less.
//
//   npx vite build && node build-tools/boss-bot.cjs [boss type] [map] [base] [good|shop]
//   node build-tools/boss-bot.cjs koboldKing coalpit 75 good      (the defaults)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const [, , BOSS = 'koboldKing', MAP = 'coalpit', BASE = '75', GEAR = 'good'] = process.argv;
const path = require('node:path');
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, '../node_modules/vite/bin/vite.js'), 'preview', '--port', '4181', '--strictPort'], { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 640, height: 300 }, hasTouch: true });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:4181/');
  await page.waitForSelector('#boot .tap', { state: 'visible', timeout: 120000 });
  await page.click('#boot'); await page.waitForTimeout(1500);
  await page.click('#t-continue'); await page.waitForTimeout(1200);
  await page.click('.cine-skip').catch(() => {}); await page.waitForTimeout(1500);
  await page.fill('#lookname', 'Bot'); await page.click('[data-act="lookok"]'); await page.waitForTimeout(4000);
  await page.keyboard.press('Escape');
  const setupInfo = await page.evaluate(({ base, gear }) => {
    const a = window.__aria, p = a.prog;
    document.querySelector('.g-skip')?.click();
    a.story.load({ id: 'done', last: 'goldring', flags: { intro: true } });
    while (p.baseLv < base) a.gainExp(p.baseNeed, 0);
    Object.assign(p, { job: 'blademaster', unlocked: ['swordman', 'blademaster'], firstLv: 50, jobLv: Math.min(50, base - 40) });
    Object.assign(p.stats, { pow: 69, qkn: 52, end: 35, knl: 9, fns: 35, ftn: 10 });
    p.skills = { basics: 9, discipline: 10, ironhide: 10, cleave: 10, heavy: 5, warcry: 3, rhythm: 1, laststand: 1, twinfang: 10, pierce: 10, blademastery: 10, comboedge: 10, momentum: 5, finalblade: 5, bladedance: 5 };
    const kit = gear === 'good' ? ['hornblade|r7', 'chain_mail|r4', 'round_shield|r4', 'wool_cape|r4', 'leather_boots|r4'] : ['iron_sword', 'chain_mail', 'round_shield', 'wool_cape', 'leather_boots'];
    const worn = kit.map((k) => { a.inv.add(k, 1); return a.inv.equip(k); });
    a.inv.add('potion3', 400);
    a.player.hp = a.player.maxHp;
    return { worn, lv: p.baseLv, hp: a.player.maxHp, atk: a.player.ps?.atk };
  }, { base: +BASE, gear: GEAR });
  console.log('hero', JSON.stringify(setupInfo));
  await page.evaluate((map) => window.__aria.warp(map, null), MAP);
  await page.waitForTimeout(6000); // (real time: the new job's sheets load)
  // (the job was set by hand, not by a trial: the body is not re-dressed, so a missing frame is skipped)
  await page.evaluate(() => { const p = window.__aria.player, f = p.placeHead.bind(p); p.placeHead = (...a) => { try { return f(...a); } catch { /* a sheet still loading */ } }; });
  await page.clock.install();
  await page.evaluate((type) => {
    const a = window.__aria, boss = a.mobs.list.find((m) => m.type === type && m.alive);
    const bot = window.bot = { t: 0, potions: 0, tremors: 0, done: null, start: boss?.hp, name: boss?.def.name };
    if (!boss) { bot.done = 'no boss'; return; }
    for (const m of a.mobs.list) if (m !== boss && !m.def.boss && Math.hypot(m.x - boss.x, m.z - boss.z) < 14) a.mobs.remove(m); // (the field cleared round it: a duel, as the sim has it)
    a.player.setPos(boss.x + 2.5, boss.z);
    a.mobs.on('tremor', () => { bot.tremors++; setTimeout(() => { const p = a.player, ang = Math.random() * 6.28; p.setPos(p.x + Math.cos(ang) * 2.2, p.z + Math.sin(ang) * 2.2); p.command({ mob: boss }); }, 300); });
    const order = ['bladedance', 'finalblade', 'pierce', 'twinfang'];
    let potT = 0;
    setInterval(() => {
      if (bot.done) return;
      bot.t += 0.1;
      const p = a.player;
      if (!boss.alive) { bot.done = 'win'; return; }
      if (p.state === 'down' || a.world.id !== a.MAPS[a.world.id] && false) { bot.done = 'fainted'; bot.left = boss.hp / boss.def.hp; return; }
      if (bot.t > 900) { bot.done = 'time'; bot.left = boss.hp / boss.def.hp; return; }
      if (p.hp < p.maxHp * 0.5 && bot.t >= potT) { a.useItem('potion3'); bot.potions++; potT = bot.t + 0.25; }
      if (p.sp < 60) p.sp = p.maxSp; // (Blue Potions: not counted, as the sim)
      if (!p.target || p.target !== boss) p.command({ mob: boss });
      if (Math.hypot(p.x - boss.x, p.z - boss.z) < 3) for (const id of order) a.useSkill(id);
    }, 100);
  }, BOSS);
  const t0 = Date.now();
  for (let i = 0; i < 960; i++) {
    await page.clock.runFor(1000);
    const s = await page.evaluate(() => window.bot);
    if (i % 30 === 0) console.log(`  t=${s.t.toFixed(0)}s potions=${s.potions} tremors=${s.tremors} real=${((Date.now() - t0) / 1000).toFixed(0)}s`);
    if (s.done) { console.log('result', JSON.stringify(s)); break; }
  }
  console.log('errors', errs.slice(0, 5));
  await b.close(); srv.kill();
})();
