// The repository itself: no signing key but the public debug one is ever committed (docs/release.md), and the
// store release keeps its own app id.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('no release key is committed: the only keystore is the public debug key', () => {
  const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter((f) => /\.(jks|keystore|p12|pfx)$/i.test(f));
  assert.deepEqual(files, ['build-tools/debug.keystore']);
});

test('the store release has its own app id, never the everyday one', () => {
  const wf = readFileSync('.github/workflows/release.yml', 'utf8'), cap = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
  const id = wf.match(/default: ([\w.]+)/)?.[1];
  assert.ok(id && id !== cap.appId, `store app id ${id} vs everyday ${cap.appId}`);
  assert.match(wf, /secrets\.RELEASE_KEYSTORE_B64/);
});
