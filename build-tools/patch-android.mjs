// Runs after `npx cap add android` in CI: landscape lock + fullscreen theme.
import { readFileSync, writeFileSync } from 'node:fs';

const manifest = 'android/app/src/main/AndroidManifest.xml';
let m = readFileSync(manifest, 'utf8');
if (!m.includes('screenOrientation')) {
  m = m.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"');
}
writeFileSync(manifest, m);

const styles = 'android/app/src/main/res/values/styles.xml';
let s = readFileSync(styles, 'utf8');
const full = '<item name="android:windowFullscreen">true</item>';
s = s.replace(/(<style name="AppTheme\.NoActionBar(?:Launch)?"[^>]*>)/g, `$1\n        ${full}`);
writeFileSync(styles, s);

console.log('Patched manifest (landscape) and styles (fullscreen).');
