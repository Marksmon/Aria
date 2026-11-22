// A playtest bot: a BladeMaster fights one boss in the real game (the built game in Chromium), to check what
// build-tools/mvp-sim.mjs says about the boss tiers. The hero is the sim's own (its Base 75 MELEE stat build, the
// BladeMaster's skills), in good gear (a Khopesh +7, the one Neutral Lv 4 sword that is no MVP's: ATK 100 to the sim's 120; armor at +4) or
// shop gear; the field round the
// boss is cleared (a duel, as the sim has it). Each tenth of a second it keeps on the boss, uses Blade Dance,
// Final Blade, Piercing Edge and Twin Fang when they are ready, drinks a White Potion below half HP, and steps
// out of every danger mark under it (a boss move, a Tremor), 0.35 s after it shows (Blue Potions are not counted, as in the sim). It runs on Playwright's fake clock, so a
// fight takes about as long as it would in play (swiftshader draws slowly), or less.
//
//   npx vite build && node build-tools/boss-bot.cjs [boss type] [map] [base] [good|shop] [blade|bow] [refill|count]
//   node build-tools/boss-bot.cjs koboldKing coalpit 75 good      (the defaults: a BladeMaster, SP refilled)
// bow: a Windrunner (the sim's BOW build, a Heartwood Bow +7 and Iron Arrows; Volley, Cyclone and Double Shot,
// kept off with Leap Back whenever it is ready and the boss is on it, else standing to shoot; a Thorn Coat +4, as Chain Mail is the Blader's). count: SP is counted as in play (no Blue Potions: a skill only with the SP for it), to set
// beside build-tools/sp-sim.mjs.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const [, , BOSS = 'koboldKing', MAP = 'coalpit', BASE = '75', GEAR = 'good', JOB = 'blade', SP = 'refill'] = process.argv;
const path = require('node:path');
const PORT = process.env.PORT || '4181';
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, '../node_modules/vite/bin/vite.js'), 'preview', '--port', PORT, '--strictPort'], { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
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
  const setupInfo = await page.evaluate(({ base, gear, job }) => {
    const a = window.__aria, p = a.prog;
    document.querySelector('.g-skip')?.click();
    a.story.load({ id: 'done', last: 'goldring', flags: { intro: true } });
    while (p.baseLv < base) a.gainExp(p.baseNeed, 0);
    const bow = job === 'bow';
    Object.assign(p, { job: bow ? 'windrunner' : 'blademaster', unlocked: bow ? ['archer', 'windrunner'] : ['swordman', 'blademaster'], firstLv: 50, jobLv: Math.min(50, base - 40) });
    Object.assign(p.stats, bow ? { fns: 69, qkn: 52, end: 35, pow: 18, ftn: 9, knl: 26 } : { pow: 69, qkn: 52, end: 35, knl: 9, fns: 35, ftn: 10 });
    p.skills = bow
      ? { basics: 9, keeneye: 10, longsight: 10, doubleshot: 10, arrowrain: 5, focus: 5, huntmark: 5, leapback: 1, steadyaim: 1, windborne: 10, galerhythm: 5, skirmisher: 5, volley: 10, cyclone: 10 }
      : { basics: 9, discipline: 10, ironhide: 10, cleave: 10, heavy: 5, warcry: 3, rhythm: 1, laststand: 1, twinfang: 10, pierce: 10, blademastery: 10, comboedge: 10, momentum: 5, finalblade: 5, bladedance: 5 };
    const kit = bow
      ? (gear === 'good' ? ['heartwood_bow|r7', 'iron_arrow', 'thorn_coat|r4', 'wool_cape|r4', 'leather_boots|r4'] : ['hunting_bow', 'iron_arrow', 'leaf_tunic', 'wool_cape', 'leather_boots'])
      : gear === 'good' ? ['khopesh|r7', 'chain_mail|r4', 'round_shield|r4', 'wool_cape|r4', 'leather_boots|r4'] : ['iron_sword', 'chain_mail', 'round_shield', 'wool_cape', 'leather_boots'];
    const worn = kit.map((k) => { a.inv.add(k, 1); return a.inv.equip(k); });
    a.inv.add('potion3', 400);
    a.player.hp = a.player.maxHp;
    return { worn, lv: p.baseLv, hp: a.player.maxHp, atk: a.player.ps?.atk };
  }, { base: +BASE, gear: GEAR, job: JOB });
  console.log('hero', JSON.stringify(setupInfo));
  await page.evaluate((map) => window.__aria.warp(map, null), MAP);
  await page.waitForTimeout(6000); // (real time: the new job's sheets load)
  // (the job was set by hand, not by a trial: the body is not re-dressed, so a missing frame is skipped)
  await page.evaluate(() => { const p = window.__aria.player, f = p.placeHead.bind(p); p.placeHead = (...a) => { try { return f(...a); } catch { /* a sheet still loading */ } }; });
  await page.clock.install();
  await page.evaluate(({ type, bow, count }) => {
    const a = window.__aria, boss = a.mobs.list.find((m) => m.type === type && m.alive);
    const bot = window.bot = { t: 0, potions: 0, tremors: 0, done: null, start: boss?.hp, name: boss?.def.name };
    if (!boss) { bot.done = 'no boss'; return; }
    for (const m of a.mobs.list) if (m !== boss && !m.def.boss && Math.hypot(m.x - boss.x, m.z - boss.z) < 14) a.mobs.remove(m); // (the field cleared round it: a duel, as the sim has it)
    a.player.setPos(boss.x + (bow ? 4 : 2.5), boss.z);
    // a danger mark under the hero (a boss move, a Tremor, falling fire): step out of it 0.35 s after it shows, as a
    // player who watches the ground does (fx.warn takes x, z, r)
    const warn = a.fx.warn.bind(a.fx);
    a.fx.warn = (x, z, r, ...rest) => { const p = a.player; if (Math.hypot(x - p.x, z - p.z) < r + 0.3) setTimeout(() => { if (Math.hypot(x - p.x, z - p.z) >= r + 0.3) return; const ang = Math.atan2(p.z - z, p.x - x) || 0; for (const turn of [0, 0.7, -0.7, 1.4, -1.4, 3.1]) { const nx = x + Math.cos(ang + turn) * (r + 0.9), nz = z + Math.sin(ang + turn) * (r + 0.9); if (a.world.walkable(nx, nz)) { p.setPos(nx, nz); bot.dodged++; break; } } }, 350); return warn(x, z, r, ...rest); };
    bot.dodged = 0; bot.kites = 0;
    let kiteT = 0;
    a.mobs.on('tremor', () => { bot.tremors++; setTimeout(() => { const p = a.player, ang = Math.random() * 6.28; p.setPos(p.x + Math.cos(ang) * 2.2, p.z + Math.sin(ang) * 2.2); p.command({ mob: boss }); }, 300); });
    const order = bow ? ['volley', 'cyclone', 'doubleshot'] : ['bladedance', 'finalblade', 'pierce', 'twinfang'];
    bot.spDry = null;
    let potT = 0;
    setInterval(() => {
      if (bot.done) return;
      bot.t += 0.1;
      const p = a.player;
      if (!boss.alive) { bot.done = 'win'; return; }
      if (p.state === 'down' || a.world.id !== a.MAPS[a.world.id] && false) { bot.done = 'fainted'; bot.left = boss.hp / boss.def.hp; return; }
      if (bot.t > 900) { bot.done = 'time'; bot.left = boss.hp / boss.def.hp; return; }
      if (p.hp < p.maxHp * 0.5 && bot.t >= potT) { a.useItem('potion3'); bot.potions++; potT = bot.t + 0.25; }
      if (!count && p.sp < 60) p.sp = p.maxSp; // (Blue Potions: not counted, as the sim)
      if (count && bot.spDry == null && p.sp < 15) bot.spDry = +bot.t.toFixed(0);
      const d = Math.hypot(p.x - boss.x, p.z - boss.z);
      // a bow keeps its distance as a player does: Leap Back whenever it is ready and the boss is on it, and
      // otherwise stands and shoots (walking off a boss as quick as the hero only loses the shots)
      if (bow && d < 2.5 && bot.t >= kiteT) { kiteT = bot.t + 6; bot.kites++; a.useSkill('leapback'); }
      if (!p.target || p.target !== boss) p.command({ mob: boss });
      if (d < (bow ? 6 : 3)) for (const id of order) a.useSkill(id);
    }, 100);
  }, { type: BOSS, bow: JOB === 'bow', count: SP === 'count' });
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
