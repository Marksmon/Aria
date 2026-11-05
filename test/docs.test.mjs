// The README's item and card tables are written from the game's data (build-tools/readme-tables.mjs):
// this fails when a change to the items, drops or cards leaves them behind. Rewrite them with
//   node build-tools/readme-tables.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('the README tables match the game data', () => {
  const out = execFileSync(process.execPath, [new URL('../build-tools/readme-tables.mjs', import.meta.url).pathname, '--check'], { encoding: 'utf8' });
  assert.match(out, /up to date/);
});
