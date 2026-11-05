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
    step('the Monster Album');
    await page.tap('#albumbtn');
    await page.waitForTimeout(300);
    const al = await page.evaluate(() => document.querySelectorAll('#windows .al-row').length);
    if (al < 50) fail.push(`the Monster Album shows ${al} monsters`);
    for (const t of ['met', 'boss', 'all']) { await page.click(`[data-act="albumtab"][data-id="${t}"]`); await page.waitForTimeout(100); }
    await page.keyboard.press('Escape');
    step('settings');
    await page.evaluate(() => window.__aria.menus.show('settings'));
    await page.waitForTimeout(300);
    for (const act of ['targetbar', 'graphics', 'targetbar', 'graphics']) { await page.click(`[data-act="${act}"]`); await page.waitForTimeout(150); }
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

    step('every map');
    const ids = await page.evaluate(() => Object.entries(window.__aria.MAPS).filter(([, m]) => !m.arena).map(([id]) => id)); // (a raid's arena only in a run)
    for (const id of ids) {
      const before = fail.length;
      await page.evaluate((id) => window.__aria.warp(id, null), id).catch((e) => fail.push(`warp ${id}: ${e.message}`));
      await page.waitForTimeout(1200);
      const here = await page.evaluate(() => window.__aria.world.id);
      if (here !== id) fail.push(`warp to ${id} landed in ${here}`);
      if (fail.length > before) fail.push(`(while entering ${id})`);
    }
    console.log(`${ids.length} maps visited`);
  } catch (e) {
    fail.push(`smoke test stopped: ${e.message}`);
  } finally {
    await browser?.close();
    server.kill();
  }
  if (fail.length) { console.error('SMOKE TEST FAILED\n' + fail.map((f) => `  ${f}`).join('\n')); process.exit(1); }
  console.log('smoke test passed');
})();
