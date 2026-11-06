// A playtest bot for the early fields: a young hero hunts in one field of the real game (the built game in
// Chromium) for some minutes of game time, the way a careful new player would: it fights the nearest monster,
// drinks a Red Potion below 35% HP and sits to rest below 55% when nothing is after it. It counts kills, faints,
// potions drunk and the shop value of the loot (sold at half price), so the early economy and the fields'
// crowding can be checked after a change (docs/game-audit-2026-11.md, QA-2 and QA-3).
//
//   npx vite build && node build-tools/field-bot.cjs [scenario] [minutes]
//   scenarios: trainee5 (Moss Field), trainee9 (Fen Shore), blader12 (Fen Shore), blader18 (Birch Grove), all
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const SCENARIOS = {
  trainee5: { map: 'grove', base: 5, job: 'novice', gear: ['twig_sword', 'clothes'] },
  trainee9: { map: 'fen', base: 9, job: 'novice', gear: ['stone_blade', 'leaf_tunic', 'woven_cap'] },
  blader12: { map: 'fen', base: 12, job: 'swordman', gear: ['stone_blade', 'leaf_tunic', 'round_shield', 'woven_cap'] },
  blader18: { map: 'birch', base: 18, job: 'swordman', gear: ['ember_edge', 'shell_mail', 'round_shield', 'woven_cap', 'leather_boots'] },
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
    if (sc.job !== 'novice') Object.assign(p, { job: sc.job, unlocked: [sc.job], firstLv: 1, jobLv: 1 });
    // a plain build: POW, QKN and END, two to one to one
    const order = ['pow', 'pow', 'qkn', 'end'];
    for (let i = 0, stuck = 0; stuck < 4; i++) { if (p.raise(order[i % 4])) stuck = 0; else stuck++; }
    for (const k of sc.gear) { a.inv.add(k, 1); a.inv.equip(k); }
    a.inv.add('potion', 30);
    a.player.hp = a.player.maxHp;
  }, { sc });
  await page.evaluate((map) => window.__aria.warp(map, null), sc.map);
  await page.waitForTimeout(4000);
  await page.evaluate(({ map, PRICES }) => {
    const a = window.__aria;
    const bot = window.bot = { t: 0, kills: 0, faints: 0, potions: 0, loot: 0, rests: 0, hpLowest: 1 };
    a.mobs.on('death', (m, drops) => {
      if (a.world.id !== map) return;
      bot.kills++;
      for (const [id, n] of drops || []) bot.loot += Math.floor((PRICES[id] || 0) / 2) * (n || 1);
    });
    let potT = 0, down = false;
    setInterval(() => {
      bot.t += 0.1;
      const p = a.player;
      if (p.state === 'down') { if (!down) { down = true; bot.faints++; } return; }
      if (down) { down = false; setTimeout(() => a.warp(map, null), 3000); return; }
      if (a.world.id !== map) return;
      bot.hpLowest = Math.min(bot.hpLowest, p.hp / p.maxHp);
      const chasers = a.mobs.list.filter((m) => m.alive && (m.state === 'chase' || m.angry > 0) && Math.hypot(m.x - p.x, m.z - p.z) < 8);
      if (p.hp < p.maxHp * 0.35 && bot.t >= potT && a.inv.bag.count('potion')) { a.useItem('potion'); bot.potions++; potT = bot.t + 1; }
      if (p.state === 'sit') { if (p.hp >= p.maxHp * 0.95 || chasers.length) a.useSkill('rest'); return; }
      if (!chasers.length && p.hp < p.maxHp * 0.55 && !p.target?.alive) { a.useSkill('rest'); if (p.state === 'sit') bot.rests++; return; }
      if (p.target?.alive) return;
      const near = a.mobs.list.filter((m) => m.alive && !m.def.boss && !m.def.decoy).sort((x, y) => Math.hypot(x.x - p.x, x.z - p.z) - Math.hypot(y.x - p.x, y.z - p.z));
      const m = chasers[0] || near[0];
      if (m) p.command({ mob: m });
    }, 100);
  }, { map: sc.map, PRICES });
  const secs = +MIN * 60;
  for (let i = 0; i < secs; i += 5) await page.clock.runFor(5000);
  const r = await page.evaluate(() => ({ ...window.bot, base: window.__aria.prog.baseLv, job: window.__aria.prog.jobLv }));
  const cost = r.potions * (PRICES.potion || 50);
  console.log(`${name.padEnd(9)} ${MIN} min: kills ${r.kills}, faints ${r.faints}, potions ${r.potions} (${cost} perz), loot ${r.loot} perz, net ${r.loot - cost}/${MIN} min, lowest HP ${(r.hpLowest * 100).toFixed(0)}%, rests ${r.rests}, now Base ${r.base} Job ${r.job}`);
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
