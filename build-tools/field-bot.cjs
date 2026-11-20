// A playtest bot for the early fields: a young hero hunts in one field of the real game (the built game in
// Chromium) for some minutes of game time, the way a careful new player would: it fights the nearest monster,
// drinks a Red Potion below 35% HP and sits to rest below 55% when nothing is after it. It counts kills, faints,
// potions drunk and the shop value of the loot (sold at half price), so the early economy and the fields'
// crowding can be checked after a change (docs/game-audit-2026-11.md, QA-2 and QA-3).
//
//   npx vite build && node build-tools/field-bot.cjs [scenario] [minutes]
//   scenarios: trainee5 (Moss Field), trainee9 (Fen Shore), blader12 (Fen Shore), blader18 (Birch Grove),
//   blademaster66 (the Tide Cliffs), all
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const SCENARIOS = {
  trainee5: { map: 'grove', base: 5, job: 'novice', gear: ['twig_sword', 'clothes'] },
  trainee9: { map: 'fen', base: 9, job: 'novice', gear: ['stone_blade', 'leaf_tunic', 'woven_cap'] },
  blader12: { map: 'fen', base: 12, job: 'swordman', gear: ['stone_blade', 'leaf_tunic', 'round_shield', 'woven_cap'] },
  blader18: { map: 'birch', base: 18, job: 'swordman', gear: ['ember_edge', 'shell_mail', 'round_shield', 'woven_cap', 'leather_boots'] },
  // the coast's first field (the review, November 2026): a BladeMaster at the Tide Cliffs' low end in Hafnvik's shop gear
  blademaster66: { map: 'tidecliff', base: 66, job: 'blademaster', from: ['swordman'], potion: 'potion3', enter: 'scorpion', build: ['pow', 'pow', 'qkn', 'end', 'fns', 'pow', 'qkn', 'fns'], // (the sims' melee build: FNS too, or it misses; in from Scorpion Sands, as a player comes)
    gear: ['iron_sword', 'chain_mail', 'round_shield', 'travel_cloak', 'leather_boots'] },
};
const [, , WHICH = 'all', MIN = '10'] = process.argv;
const PORT = String(4184 + Math.max(0, Object.keys(SCENARIOS).indexOf(WHICH)));

async function prices() {
  const { load, close } = await import(path.join(__dirname, '../test/load.mjs'));
  const { PRICES } = await load('items');
  await close();
  return PRICES;
}

async function run(page, name, sc, PRICES) {
  await page.evaluate(({ sc }) => {
    const a = window.__aria, p = a.prog;
    document.querySelector('.g-skip')?.click();
    a.story.load({ id: 'done', last: 'goldring', flags: { intro: true } });
    while (p.baseLv < sc.base) a.gainExp(p.baseNeed, 0);
    if (sc.job !== 'novice') Object.assign(p, { job: sc.job, unlocked: [...(sc.from || []), sc.job], firstLv: sc.from ? 50 : 1, jobLv: sc.from ? 30 : 1 });
    // a plain build: POW, QKN and END, two to one to one
    const order = sc.build || ['pow', 'pow', 'qkn', 'end'];
    for (let i = 0, stuck = 0; stuck < order.length; i++) { if (p.raise(order[i % order.length])) stuck = 0; else stuck++; }
    for (const k of sc.gear) { a.inv.add(k, 1); a.inv.equip(k); }
    a.inv.add(sc.potion || 'potion', 30);
    a.player.hp = a.player.maxHp;
  }, { sc });
  await page.evaluate(({ map, enter }) => window.__aria.warp(map, enter || null), { map: sc.map, enter: sc.enter });
  await page.waitForTimeout(sc.from ? 6000 : 4000);
  // (a job set by hand, not by a trial: the body is not re-dressed, so a missing frame is skipped, as stand-bot.cjs)
  await page.evaluate(() => { const p = window.__aria.player, f = p.placeHead.bind(p); p.placeHead = (...a) => { try { return f(...a); } catch { /* a sheet still loading */ } }; });
  await page.evaluate(({ map, PRICES, pot, enterFrom }) => {
    const a = window.__aria;
    const bot = window.bot = { t: 0, kills: 0, faints: 0, potions: 0, loot: 0, rests: 0, hpLowest: 1 };
    a.mobs.on('death', (m, drops) => {
      if (a.world.id !== map) return;
      bot.kills++;
      for (const [id, n] of drops || []) bot.loot += Math.floor((PRICES[id] || 0) / 2) * (n || 1);
    });
    // a wind-up's mark under the hero: step out of it, 0.35 s after it shows (a careful player; mobs.js TELL)
    const warn = a.fx.warn.bind(a.fx);
    a.fx.warn = (x, z, r, ...rest) => { const p = a.player; if (Math.hypot(x - p.x, z - p.z) < r + 0.3) setTimeout(() => { const ang = Math.atan2(p.z - z, p.x - x) || 0; const nx = x + Math.cos(ang) * (r + 0.9), nz = z + Math.sin(ang) * (r + 0.9); if (a.world.walkable(nx, nz)) { p.setPos(nx, nz); bot.dodged = (bot.dodged || 0) + 1; } }, 350); return warn(x, z, r, ...rest); };
    let potT = 0, down = false;
    setInterval(() => {
      bot.t += 0.1;
      const p = a.player;
      if (p.state === 'down') { if (!down) { down = true; bot.faints++; } return; }
      if (down) { down = false; setTimeout(() => a.warp(map, enterFrom), 3000); return; }
      if (a.world.id !== map) return;
      bot.hpLowest = Math.min(bot.hpLowest, p.hp / p.maxHp);
      const chasers = a.mobs.list.filter((m) => m.alive && (m.state === 'chase' || m.angry > 0) && Math.hypot(m.x - p.x, m.z - p.z) < 8);
      if (p.hp < p.maxHp * 0.35 && bot.t >= potT && a.inv.bag.count(pot)) { a.useItem(pot); bot.potions++; potT = bot.t + 1; }
      if (p.state === 'sit') { if (p.hp >= p.maxHp * 0.95 || chasers.length) a.useSkill('rest'); return; }
      if (!chasers.length && p.hp < p.maxHp * 0.55 && !p.target?.alive) { a.useSkill('rest'); if (p.state === 'sit') bot.rests++; return; }
      if (p.target?.alive) return;
      const near = a.mobs.list.filter((m) => m.alive && !m.def.boss && !m.def.decoy).sort((x, y) => Math.hypot(x.x - p.x, x.z - p.z) - Math.hypot(y.x - p.x, y.z - p.z));
      const m = chasers[0] || near[0];
      if (m) p.command({ mob: m });
    }, 100);
  }, { map: sc.map, PRICES, pot: sc.potion || 'potion', enterFrom: sc.enter || null });
  const secs = +MIN * 60;
  for (let i = 0; i < secs; i += 5) await page.clock.runFor(5000);
  const r = await page.evaluate(() => ({ ...window.bot, base: window.__aria.prog.baseLv, job: window.__aria.prog.jobLv }));
  const cost = r.potions * (PRICES[sc.potion || 'potion'] || 50);
  console.log(`${name.padEnd(9)} ${MIN} min: kills ${r.kills}, faints ${r.faints}, potions ${r.potions} (${cost} perz), loot ${r.loot} perz, net ${r.loot - cost}/${MIN} min, lowest HP ${(r.hpLowest * 100).toFixed(0)}%, dodged ${r.dodged || 0}, rests ${r.rests}, now Base ${r.base} Job ${r.job}`);
  return r;
}

(async () => {
  const PRICES = await prices();
  const srv = spawn(process.execPath, [path.join(__dirname, '../node_modules/vite/bin/vite.js'), 'preview', '--port', PORT, '--strictPort'], { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const [name, sc] of Object.entries(SCENARIOS)) {
      if (WHICH !== 'all' && WHICH !== name) continue;
      const page = await b.newPage({ viewport: { width: 640, height: 300 }, deviceScaleFactor: 0.5, hasTouch: true });
      const errs = []; page.on('pageerror', (e) => errs.push(e.stack.split('\n').slice(0, 3).join(' | ')));
      await page.goto(`http://localhost:${PORT}/`);
      await page.waitForSelector('#boot .tap', { state: 'visible', timeout: 120000 });
      await page.click('#boot'); await page.waitForTimeout(1500);
      await page.click('#t-continue'); await page.waitForTimeout(1200);
      await page.click('.cine-skip').catch(() => {}); await page.waitForTimeout(1500);
      await page.fill('#lookname', 'Bot'); await page.click('[data-act="lookok"]'); await page.waitForTimeout(3000);
      await page.keyboard.press('Escape');
      await page.clock.install();
      await run(page, name, sc, PRICES);
      if (errs.length) console.log('  errors', errs.slice(0, 3));
      await page.close();
    }
  } finally { await b.close(); srv.kill(); }
})();
