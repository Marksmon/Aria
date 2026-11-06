# Releasing Aria to a store

Why this exists: the everyday APK (`.github/workflows/android.yml`) is signed with `build-tools/debug.keystore`,
which is committed to this public repository. Anyone can read that key, so anyone could sign an APK that a
phone accepts as an "update" to Aria (`docs/game-audit-2026-11.md`, QA-1). The owner's rule stands: that key never
changes, so phones that have the everyday APK keep updating. A store release is a **second app** with its own id
(`com.marksmon.aria`) and its own key, kept only in the repository's secrets.

## Once: make the release key

On your own computer (Java's `keytool`), never in this repository:

```bash
keytool -genkeypair -v -keystore aria-release.jks -alias aria -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 aria-release.jks > aria-release.b64     # macOS: base64 -i aria-release.jks -o aria-release.b64
```

Keep `aria-release.jks` and its passwords somewhere safe (a password manager and an offline copy). If it is lost,
the store app can never be updated again under the same listing (Google Play App Signing can hold a copy for you).

## Once: give it to GitHub

Repository → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `RELEASE_KEYSTORE_B64` | the contents of `aria-release.b64` |
| `RELEASE_STORE_PASSWORD` | the keystore's password |
| `RELEASE_KEY_ALIAS` | `aria` (or the alias you chose) |
| `RELEASE_KEY_PASSWORD` | the key's password |

## Each release

Actions → **Store release** → Run workflow. It runs the tests, builds the game, signs a bundle (`Aria-store.aab`,
for Google Play) and an APK (`Aria-store.apk`) with the release key, checks the signature is the release key and
not the public one, and keeps both as the run's artifact.

## Moving players over

The store app is a different app, so its saves start empty. Players move with the save code: in the old app,
title screen → Account → **Back up save**; in the store app, **Restore save**. Every hero and the shared storage
come along.

## Rules

- No keystore other than `build-tools/debug.keystore` is ever committed (`npm test` checks it).
- The store app's id is never the everyday app's (`com.marksmon.aibachu`); the workflow refuses it.
