// Saves: a hero written comes back, a broken save falls back to its backup copy, and a save code
// carries every hero and the shared storage.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { if (globalThis.localStorage.full) throw new Error('QuotaExceededError'); mem.set(k, String(v)); },
  removeItem: (k) => mem.delete(k),
};
const { loadSave, writeSave, clearSave, saveCode, loadCode, loadStorage, writeStorage } = await import('../src/save.js');
const hero = (name, lv = 10) => ({ look: { name }, prog: { v: 2, baseLv: lv }, inv: { bag: [] } });
beforeEach(() => { mem.clear(); globalThis.localStorage.full = false; });

test('a hero written comes back', () => {
  assert.equal(writeSave(hero('Ada'), 0, 1e9), true);
  assert.equal(loadSave(0).look.name, 'Ada');
  assert.equal(loadSave(1), null);
});

test('a broken save falls back to its backup copy', () => {
  writeSave(hero('Ada', 10), 0, 1e9);   // the backup is written with it
  writeSave(hero('Ada', 11), 0, 1e9 + 1000); // (under a minute later: the backup stays at Lv 10)
  assert.equal(loadSave(0).prog.baseLv, 11);
  mem.set('aibachu.save.v1', '{"prog": {"baseLv": 12'); // cut short
  assert.equal(loadSave(0).prog.baseLv, 10);
  writeSave(hero('Ada', 13), 0, 1e9 + 70000); // a minute on: the backup follows
  mem.set('aibachu.save.v1', 'not json');
  assert.equal(loadSave(0).prog.baseLv, 13);
});

test('a refused write says so, and the old save stays', () => {
  writeSave(hero('Ada', 10), 0, 1e9);
  globalThis.localStorage.full = true;
  assert.equal(writeSave(hero('Ada', 20), 0, 2e9), false);
  globalThis.localStorage.full = false;
  assert.equal(loadSave(0).prog.baseLv, 10);
});

test('deleting a hero takes its backup too', () => {
  writeSave(hero('Ada'), 2, 1e9);
  clearSave(2);
  assert.equal(loadSave(2), null);
  assert.equal([...mem.keys()].filter((k) => k.includes('.3')).length, 0);
});

test('a save code carries every hero and the storage', () => {
  writeSave(hero('Ada', 30), 0, 1e9);
  writeSave(hero('Bo', 40), 2, 1e9);
  writeStorage([['potion', 5]]);
  const code = saveCode();
  assert.match(code, /^ARIA2:/);
  mem.clear();
  assert.equal(loadCode(`my backup: ${code} (keep it)`), 'all');
  assert.equal(loadSave(0).look.name, 'Ada');
  assert.equal(loadSave(1), null);
  assert.equal(loadSave(2).prog.baseLv, 40);
  assert.deepEqual(loadStorage(), [['potion', 5]]);
  assert.equal(loadCode('ARIA2:garbage'), false);
});

test("an old save's chest moves into the shared storage once", () => {
  mem.set('aibachu.save.v1', JSON.stringify({ ...hero('Old'), inv: { bag: [], chest: [['gel', 3]] } }));
  assert.deepEqual(loadSave(0).inv.chest, []);
  assert.deepEqual(loadStorage(), [['gel', 3]]);
  loadSave(0);
  assert.deepEqual(loadStorage(), [['gel', 3]]);
});
