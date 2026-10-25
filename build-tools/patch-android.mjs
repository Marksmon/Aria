// Runs after `npx cap add android` in CI: landscape lock, fullscreen theme, and a version that
// rises with every build (BUILD_NUMBER), so each new APK installs as an update over the last one.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

// versionCode must grow from build to build: phones refuse (or fuss over) an "update" that isn't newer
const build = parseInt(process.env.BUILD_NUMBER, 10);
if (build > 0) {
  const gradle = 'android/app/build.gradle';
  let g = readFileSync(gradle, 'utf8');
  g = g.replace(/versionCode \d+/, `versionCode ${build}`).replace(/versionName "[^"]*"/, `versionName "1.0.${build}"`);
  writeFileSync(gradle, g);
}

// Every build signs with the same key (build-tools/debug.keystore), named here in the app's own
// build file. Copying it to ~/.android was not enough: Gradle made a fresh debug key on each CI
// machine, so each APK had a different signature and Android refused it as an update
// ("package conflicts with an existing package").
{
  const gradle = 'android/app/build.gradle';
  let g = readFileSync(gradle, 'utf8');
  const store = resolve('build-tools/debug.keystore').replace(/\\/g, '/');
  const signing = `
    signingConfigs {
        debug {
            storeFile file("${store}")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }`;
  if (!g.includes('signingConfigs {')) g = g.replace(/android\s*\{/, (m) => m + signing);
  if (!/buildTypes\s*\{[\s\S]*?debug\s*\{/.test(g)) g = g.replace(/buildTypes\s*\{/, (m) => `${m}\n        debug {\n            signingConfig signingConfigs.debug\n        }`);
  if (!g.includes(store)) throw new Error('could not add the signing key to build.gradle');
  writeFileSync(gradle, g);
}

console.log(`Patched manifest (landscape), styles (fullscreen), version (build ${build || 'none'}) and signing key.`);
