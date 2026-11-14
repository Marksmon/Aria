// Gold Bars at the smiths: with Pay with Gold Bars on, each bar pays GOLD_FEE of a fee, never more
// bars than the fee needs whole, and none unless the hero asks.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { load, close } from './load.mjs';

const { Inventory } = await load('inventory');
const { GOLD_FEE, PRICES, sellPrice } = await load('items');
after(close);

test('Gold Bars pay part of a fee only when asked, and are worth more spent than sold', () => {
  const inv = new Inventory();
  inv.perz = 15000;
  inv.add('gold_bar', 3);
  assert.equal(inv.canPay(50000), false, 'off: perz alone');
  inv.goldPay = true;
  assert.deepEqual(inv.feeSplit(50000), { bars: 2, perz: 50000 - 2 * GOLD_FEE });
  assert.equal(inv.canPay(50000), true);
  inv.payFee(50000);
  assert.equal(inv.have('gold_bar'), 1);
  assert.equal(inv.perz, 15000 - (50000 - 2 * GOLD_FEE));
  assert.deepEqual(inv.feeSplit(5000), { bars: 0, perz: 5000 }, 'a small fee is perz');
  assert.ok(GOLD_FEE >= 2 * sellPrice('gold_bar'), `a bar pays ${GOLD_FEE}, sells for ${sellPrice('gold_bar')} (price ${PRICES.gold_bar})`);
});

test('no monster pays far less than the monsters near its level (build-tools/econ-sim.mjs)', async () => {
  const { monsters, income, outliers, FAR } = await import('../build-tools/econ-sim.mjs');
  const { MOB_DEFS } = await import('../src/mobs.js');
  const rows = monsters().map((t) => ({ name: MOB_DEFS[t].name, lv: MOB_DEFS[t].lv, ...income(MOB_DEFS[t]) }));
  assert.ok(rows.length > 60, `${rows.length} monsters live on a map`);
  for (const r of rows) assert.ok(r.steady > 0, `${r.name} drops nothing a shop buys`);
  assert.deepEqual(outliers(rows).map((r) => `${r.name} (${Math.round(r.steady)} perz a kill)`), [], `paying under ${FAR * 100}% of their neighbours`);
});
