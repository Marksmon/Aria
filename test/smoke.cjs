// A smoke test of the built game in Chromium (Playwright), at a phone's size held on its side:
// boot, make a hero, open every window, change the settings, fight a little and walk into every map.
// It fails on any page error, or on a window button that can't be tapped.
//
//   npm run build && node test/smoke.cjs        (CI: .github/workflows/test.yml)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 4179, URL = `http://localhost:${PORT}/`;
const root = path.join(__dirname, '..');
const fail = [];
const step = (s) => console.log(`- ${s}`);

async function waitFor(url, ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`no server at ${url}`);
}

(async () => {
  const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' });
  let browser;
  try {
    await waitFor(URL);
    browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
    page.on('pageerror', (e) => fail.push(`page error: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) fail.push(`console: ${m.text()}`); });
    // a button that can be tapped: on screen, and the topmost thing where it stands
    const tappable = (sel) => page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return `${sel}: missing`;
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (r.width === 0 || x < 0 || y < 0 || x > innerWidth || y > innerHeight) return `${sel}: off screen`;
      const top = document.elementFromPoint(x, y);
      return top === el || el.contains(top) ? null : `${sel}: covered by ${top?.id || top?.className || top?.tagName}`;
    }, sel);

    step('boot');
    await page.goto(URL);
    await page.waitForSelector('#boot .tap', { state: 'visible', timeout: 120000 });
    await page.click('#boot');
    await page.waitForTimeout(1500);
    step('make a hero');
    await page.click('#t-continue');
    await page.waitForTimeout(1200);
    await page.click('.cine-skip', { timeout: 10000 }).catch(() => fail.push('the opening cutscene has no Skip'));
    await page.waitForTimeout(1500);
    await page.fill('#lookname', 'Smoke');
    const go = await tappable('[data-act="lookok"]');
    if (go) fail.push(`hero creation: Begin your journey can't be tapped (${go})`);
    await page.click('[data-act="lookok"]');
    await page.waitForTimeout(4000);
    const a = await page.evaluate(() => ({ map: window.__aria.world.id, step: window.__aria.story.step?.id }));
    if (a.map !== 'camp' || a.step !== 'wake') fail.push(`a new hero starts at ${a.map} on ${a.step}`);
    await page.keyboard.press('Escape');

    step('every window');
    for (const w of ['status', 'equip', 'items', 'skills', 'journal', 'settings']) {
      await page.evaluate((w) => window.__aria.menus.show(w), w);
      await page.waitForTimeout(300);
      if (!(await page.$(`#windows .w-${w}, #windows [data-win="${w}"], #windows > *`))) fail.push(`window ${w} did not open`);
      await page.keyboard.press('Escape');
    }
    step('the folding panel');
    await page.evaluate(() => document.querySelector('.g-skip')?.click());
    await page.tap('#hudfold');
    await page.waitForTimeout(200);
    if (!(await page.evaluate(() => document.body.classList.contains('hudfold')))) fail.push('the panel did not fold');
    await page.tap('#hudmenu');
    await page.waitForTimeout(200);
    if (await page.evaluate(() => document.body.classList.contains('hudfold'))) fail.push('☰ Menu did not open the panel');
    step('the Monster Album');
    await page.tap('#albumbtn');
    await page.waitForTimeout(300);
    const al = await page.evaluate(() => document.querySelectorAll('#windows .al-row').length);
    if (al < 50) fail.push(`the Monster Album shows ${al} monsters`);
    for (const t of ['met', 'boss', 'sets', 'all']) { await page.click(`[data-act="albumtab"][data-id="${t}"]`); await page.waitForTimeout(100); }
    await page.keyboard.press('Escape');
    step('goals');
    await page.tap('#goalsbtn');
    await page.waitForTimeout(3500); // (the week's hunts come with the first check)
    await page.evaluate(() => window.__aria.menus.render('goals'));
    const hunts = await page.evaluate(() => document.querySelectorAll('#windows .al-row').length);
    if (hunts < 3) fail.push(`the Goals window shows ${hunts} hunts`);
    await page.click('[data-act="goalstab"][data-id="ach"]'); await page.waitForTimeout(150);
    await page.keyboard.press('Escape');
    step('settings');
    await page.evaluate(() => window.__aria.menus.show('settings'));
    await page.waitForTimeout(300);
    for (const act of ['targetbar', 'graphics', 'targetbar', 'graphics']) { await page.click(`[data-act="${act}"]`); await page.waitForTimeout(150); }
    // the Interface size: Normal -> Large -> Larger, every HUD button still on screen and tappable there, then round to Normal
    for (let i = 0; i < 2; i++) { await page.click('[data-act="uiscale"]'); await page.waitForTimeout(150); }
    await page.keyboard.press('Escape');
    if ((await page.evaluate(() => window.__aria.settings.get('uiScale'))) !== 1.3) fail.push('the Interface size did not reach Larger');
    for (const sel of ['#winbtns [data-btn="status"]', '#winbtns [data-btn="journal"]', '#atkbtn', '#optbtn', '#goalsbtn', '#minimap']) {
      const why = await tappable(sel);
      if (why) fail.push(`at the Larger size: ${why}`);
    }
    await page.evaluate(() => window.__aria.menus.show('settings'));
    await page.waitForTimeout(300);
    for (let i = 0; i < 2; i++) { await page.click('[data-act="uiscale"]'); await page.waitForTimeout(150); }
    if ((await page.evaluate(() => window.__aria.settings.get('uiScale'))) !== 1) fail.push('the Interface size did not come round to Normal');
    await page.keyboard.press('Escape');

    step('a fight with the target bar');
    await page.evaluate(() => { const a = window.__aria; a.gainExp(3000, 0); a.warp('grove', null); });
    await page.waitForTimeout(3000);
    const near = await page.evaluate(() => {
      const a = window.__aria, m = a.mobs.list.filter((m) => m.alive).sort((p, q) => Math.hypot(p.x - a.player.x, p.z - a.player.z) - Math.hypot(q.x - a.player.x, q.z - a.player.z))[0];
      if (!m) return false;
      a.player.setPos(m.x + 1.2, m.z);
      return true;
    });
    if (!near) fail.push('no monster in Moss Field');
    await page.waitForTimeout(400);
    await page.tap('#atkbtn'); // the attack button: the nearest monster
    await page.waitForTimeout(1500);
    const bar = await page.evaluate(() => { const el = document.querySelector('#moblabels .target'); return el.style.display === 'block' && !!el.querySelector('.tbar'); });
    if (!bar) fail.push('no health bar over the target');

    // the walk through every map is about loading them: the hero takes no blows (an MVP may stand by a portal)
    await page.evaluate(() => { window.__aria.player.takeDamage = () => 0; });

    step('the job line, for every job name');
    // (a long second-job name with the + badge showing: the Job Level must not be cut off)
    const cut = await page.evaluate(() => {
      const el = document.querySelector('#info .who'), lv = el.querySelector('.lv'), jn = el.querySelector('.jobname'), em = el.querySelector('em');
      const was = [jn.textContent, lv.textContent, em.hidden, el.classList.contains('long')], bad = [];
      for (const n of ['Trainee', 'Sorcerer', 'Assassin', 'BladeMaster', 'Magic Knight', 'Windrunner', 'Moon Ranger', 'Beastmaster', 'Shadowblade']) {
        jn.textContent = n; el.classList.toggle('long', n.length > 8); lv.textContent = 'Lv 99 · Job 50'; em.hidden = false;
        window.__aria.ui.fitWho(); // (the game fits the line to the phone's font)
        if (lv.scrollWidth > lv.clientWidth + 0.5) bad.push(`${n} (${lv.scrollWidth} px in ${lv.clientWidth})`);
      }
      jn.textContent = was[0]; lv.textContent = was[1]; em.hidden = was[2]; el.classList.toggle('long', was[3]);
      window.__aria.ui.fitWho();
      return bad;
    });
    if (cut.length) fail.push(`the hero panel cuts off the Job Level: ${cut.join(', ')}`);

    step('a maze is dark until walked');
    await page.evaluate(() => window.__aria.warp('halls1', null));
    await page.waitForTimeout(2500);
    const maze = await page.evaluate(() => { const a = window.__aria, e = a.explored; return { here: e.seen('halls1', a.player.x, a.player.z), far: e.seen('halls1', 5, 5) || e.seen('halls1', 58, 58) }; });
    if (!maze.here || maze.far) fail.push(`the maze's map: lit where the hero stands ${maze.here}, lit far away ${maze.far}`);
    await page.tap('#minimap');
    await page.waitForTimeout(500);
    const stairs = await page.evaluate(() => document.querySelectorAll('#bigmap .bm-row.portal').length);
    if (stairs) fail.push(`the big map lists ${stairs} of a maze's stairs before they are found`);
    await page.tap('#bigmap .bm-x');

    step('an MVP has its big health bar');
    await page.evaluate(() => window.__aria.warp('storm', null));
    await page.waitForTimeout(3000);
    await page.evaluate(() => { const a = window.__aria, m = a.mobs.list.find((m) => m.type === 'poseidon' && m.alive); if (m) { a.player.setPos(m.x + 2.5, m.z); a.player.command({ mob: m }); } });
    await page.waitForTimeout(1500);
    const bb = await page.evaluate(() => {
      const el = document.getElementById('bossbar'), r = el.getBoundingClientRect(), info = document.getElementById('info').getBoundingClientRect(), mm = document.getElementById('minimap').getBoundingClientRect();
      return { hidden: el.hidden, name: el.querySelector('.bb-name').textContent, marks: el.querySelectorAll('.bb-bar s').length, clear: r.left >= info.right && r.right <= mm.left && r.width >= 150 };
    });
    if (bb.hidden || !/Poseidon/.test(bb.name) || bb.marks < 3) fail.push(`the boss bar in an MVP fight: ${JSON.stringify(bb)}`);
    else if (!bb.clear) fail.push('the boss bar runs under the hero panel or the minimap');

    step('a second job changes path at Job 50, for its fee (JOB_CHANGE)');
    await page.evaluate(() => window.__aria.warp('city', null));
    await page.waitForTimeout(2500);
    const jc = await page.evaluate(async () => {
      const a = window.__aria, p = a.prog, q = a.quests, out = {};
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      while (p.baseLv < 85) a.gainExp(p.baseNeed, 0);
      Object.assign(p, { job: 'blademaster', unlocked: ['swordman', 'mage', 'blademaster'], firstLv: 50, jobLv: 50 });
      p.skills = { basics: 9, discipline: 10, cleave: 10, spark: 10, frost: 10, blademastery: 10, bladedance: 5 };
      a.inv.perz = 600000;
      a.menus.talkTo('eirik'); await wait(200);
      const talk = a.menus.wins.talk;
      out.offer = /costs you/.test(talk.innerText);
      talk.querySelector('[data-act="accept"]')?.click(); await wait(200);
      out.paid = 600000 - a.inv.perz;
      out.active = Object.keys(q.active);
      // (the trial walked: its three steps handed in)
      for (const id of ['mknight_trial', 'mknight_trial2', 'mknight_trial3']) { delete q.active[id]; if (!q.done.includes(id)) q.done.push(id); }
      a.menus.close('talk'); a.menus.talkTo('eirik'); await wait(200);
      const btn = talk.querySelector('[data-act="jobchange"]');
      out.button = !!btn;
      btn?.click(); await wait(300);
      out.job = p.job; out.jobLv = p.jobLv;
      out.oldSkills = ['blademastery', 'bladedance'].filter((k) => p.skills[k]);
      out.firstSkills = ['cleave', 'spark'].every((k) => p.skills[k] === 10);
      return out;
    });
    if (!jc.offer || jc.paid !== 500000 || !jc.active.includes('mknight_trial') || !jc.button || jc.job !== 'magicknight' || jc.jobLv !== 1 || jc.oldSkills.length || !jc.firstSkills) fail.push(`the second-job change: ${JSON.stringify(jc)}`);

    step('every map');
    const moods = [];
    const ids = await page.evaluate(() => Object.entries(window.__aria.MAPS).filter(([, m]) => !m.arena).map(([id]) => id)); // (a raid's arena only in a run)
    for (const id of ids) {
      const before = fail.length;
      await page.evaluate((id) => window.__aria.warp(id, null), id).catch((e) => fail.push(`warp ${id}: ${e.message}`));
      await page.waitForTimeout(1200);
      const here = await page.evaluate(() => window.__aria.world.id);
      if (here !== id) fail.push(`warp to ${id} landed in ${here}`);
      if (fail.length > before) fail.push(`(while entering ${id})`);
      // the music follows the map (audio.js MOODS), once the sound has started
      const want = { city: 'town', halls1: 'dungeon', desert: 'desert', grove: 'field', ygg: 'wonder' }[id];
      const mood = await page.evaluate(() => (window.__aria.audio.ctx && window.__aria.audio.enabled ? window.__aria.audio.mood : null));
      if (want && mood && mood !== want && mood !== 'boss') fail.push(`music in ${id}: ${mood}, not ${want}`);
      if (want && mood) moods.push(`${id} ${mood}`);
    }
    console.log(`${ids.length} maps visited; music: ${moods.join(', ') || 'no sound in this browser'}`);
  } catch (e) {
    fail.push(`smoke test stopped: ${e.message}`);
  } finally {
    await browser?.close();
    server.kill();
  }
  if (fail.length) { console.error('SMOKE TEST FAILED\n' + fail.map((f) => `  ${f}`).join('\n')); process.exit(1); }
  console.log('smoke test passed');
})();
