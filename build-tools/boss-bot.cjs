// A playtest bot: a BladeMaster or a Windrunner fights one boss in the real game (the built game in Chromium), to
// check what build-tools/mvp-sim.mjs says about the boss tiers. The hero is the sim's own (its Base 75 stat build, the
// job's skills) in good gear (a Khopesh +7, the one Neutral Lv 4 sword that is no MVP's, ATK 100 to the sim's 120;
// armor at +4), field gear (field-bot.cjs's: an Iron Sword +6, armor at +4; a blade only) or shop gear; the field round the boss is cleared (a duel, as the sim has it). Each tenth of a second
// it keeps on the boss, uses its skills one at a time as a player taps them (a skill rides the next swing, and one
// tapped before it lands takes its place: the bot waits till it is paid), drinks a White Potion below half HP, and
// steps out of every danger mark under it (a boss move, a Tremor) 0.35 s after it shows. Blue Potions are not
// counted (SP refilled, as in the sim) unless `count`. It runs on Playwright's fake clock.
//
//   npx vite build && node build-tools/boss-bot.cjs [boss type] [map] [base] [good|field|shop] [blade|bow] [refill|count]
//   node build-tools/boss-bot.cjs koboldKing coalpit 75 good      (the defaults: a BladeMaster, SP refilled)
//   DUMMY=1 node build-tools/boss-bot.cjs jarl ridge 85 good bow   (60 s unhurt, the boss kept up: damage a second)
// blade: Blade Dance, Final Blade, Piercing Edge, Twin Fang. bow: the sim's BOW build, a Heartwood Bow +7 and Iron
// Arrows, a Thorn Coat +4 (Chain Mail is the Blader's); Tailwind, Focus and Hunter's Mark kept up as the sim has
// them, then Volley, Cyclone and Double Shot; Leap Back whenever it is ready and the boss is on it, else it stands
// and shoots. count: SP as in play (a skill only with the SP for it), beside build-tools/sp-sim.mjs. The result
// lists the skills that went off (casts) and those tapped but dropped (fails).
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
      ? { basics: 9, keeneye: 10, longsight: 10, doubleshot: 10, arrowrain: 5, focus: 5, huntmark: 5, leapback: 1, steadyaim: 1, windborne: 10, galerhythm: 5, tailwind: 10, volley: 10, cyclone: 10 }
      : { basics: 9, discipline: 10, ironhide: 10, cleave: 10, heavy: 5, warcry: 3, rhythm: 1, laststand: 1, twinfang: 10, pierce: 10, blademastery: 10, comboedge: 10, momentum: 5, finalblade: 5, bladedance: 5 };
    const kit = bow
      ? (gear === 'good' ? ['heartwood_bow|r7', 'iron_arrow', 'thorn_coat|r4', 'wool_cape|r4', 'leather_boots|r4'] : ['hunting_bow', 'iron_arrow', 'leaf_tunic', 'wool_cape', 'leather_boots'])
      : gear === 'good' ? ['khopesh|r7', 'chain_mail|r4', 'round_shield|r4', 'wool_cape|r4', 'leather_boots|r4'] : gear === 'field' ? ['iron_sword|r6', 'chain_mail|r4', 'round_shield|r4', 'travel_cloak', 'leather_boots'] : ['iron_sword', 'chain_mail', 'round_shield', 'wool_cape', 'leather_boots'];
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
  await page.evaluate(({ type, bow, count, dummy, pick }) => {
    const a = window.__aria, boss = a.mobs.list.filter((m) => m.type === type && m.alive)[pick] || null; // (PICK=n: the nth of its kind; the first is a field's Pack Leader)
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
    // one skill at a time, as a player taps them: a skill is paid (its cooldown and the half-second lock start) when
    // the swing it rides lands, and one tapped before that takes its place. Each id: the time before it is used again
    // (its cooldown; a buff's, while it lasts: Tailwind, Focus, Hunter's Mark, kept up as the sims have them)
    const ORDER = bow ? [['tailwind', 30], ['focus', 55], ['huntmark', 9.5], ['volley', 1.5], ['cyclone', 4], ['doubleshot', 0]]
      : [['bladedance', 18], ['finalblade', 6], ['pierce', 1.5], ['twinfang', 0.8]];
    const again = {};
    let pend = null; // (a skill waiting on the swing or on reach: paid when it goes off, or dropped)
    const note = (k, id) => { (bot[k] ||= {})[id] = (bot[k][id] || 0) + 1; };
    const cast = () => {
      const p = a.player;
      if (pend) {
        if ((p.goal?.skill || p.goal?.spell) === pend.sk && bot.t - pend.t < 1.5) return; // (still waiting on the swing)
        if (p.sp < pend.sp) { again[pend.id] = pend.t + pend.cd; note('casts', pend.id); } else { again[pend.id] = bot.t + 3; note('fails', pend.id); } // (not paid: short of SP, or the swing never came; plain blows meanwhile, as a player out of SP)
        pend = null;
      }
      for (const [id, cd] of ORDER) {
        if (bot.t < (again[id] || 0)) continue;
        const sp = p.sp;
        a.useSkill(id);
        if (p.sp < sp) { again[id] = bot.t + cd; note('casts', id); return; } // (went off at once: a buff, a move)
        const q = p.goal?.skill || p.goal?.spell; // (it rides the next swing, or is cast in reach: Blade Dance, Hunter's Mark)
        if (q) { pend = { id, cd, t: bot.t, sp, sk: q }; return; }
        // (refused at once: the half-second lock, its cooldown, out of reach: the next one)
      }
    };
    let was = boss.hp;
    if (dummy) { a.player.takeDamage = () => {}; bot.dealt = 0; }
    bot.spDry = null;
    let potT = 0;
    setInterval(() => {
      if (bot.done) return;
      bot.t += 0.1;
      const p = a.player;
      if (!boss.alive) { bot.done = 'win'; return; }
      if (p.state === 'down' || a.world.id !== a.MAPS[a.world.id] && false) { bot.done = 'fainted'; bot.left = boss.hp / boss.def.hp; return; }
      if (dummy) { bot.dealt += Math.max(0, was - boss.hp); boss.hp = Math.max(boss.hp, boss.def.hp * 0.6); was = boss.hp; if (bot.t > 60) { bot.done = 'measured'; bot.dps = Math.round(bot.dealt / 60); return; } }
      if (bot.t > 900) { bot.done = 'time'; bot.left = boss.hp / boss.def.hp; return; }
      if (p.hp < p.maxHp * 0.5 && bot.t >= potT) { a.useItem('potion3'); bot.potions++; potT = bot.t + 0.25; }
      if (!count && p.sp < 60) { p.sp = p.maxSp; if (pend) pend.sp = p.sp; } // (Blue Potions: not counted, as the sim)
      if (count && pend && p.sp > pend.sp) pend.sp = p.sp; // (regen)
      if (count && bot.spDry == null && p.sp < 15) bot.spDry = +bot.t.toFixed(0);
      const d = Math.hypot(p.x - boss.x, p.z - boss.z);
      // a bow keeps its distance as a player does: Leap Back whenever it is ready and the boss is on it, and
      // otherwise stands and shoots (walking off a boss as quick as the hero only loses the shots)
      if (bow && d < 2.5 && bot.t >= kiteT) { kiteT = bot.t + 6; bot.kites++; a.useSkill('leapback'); }
      if (p.goal?.mob !== boss) p.command({ mob: boss }); // (a new order wipes a skill waiting on the swing)
      if (d < (bow ? 6 : 3)) cast();
    }, 100);
  }, { type: BOSS, bow: JOB === 'bow', count: SP === 'count', dummy: !!process.env.DUMMY, pick: +(process.env.PICK || 0) });
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
