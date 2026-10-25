# Aria: notes for Claude

Aria is a Ragnarok Online-style phone RPG (Three.js + Vite, packed to one HTML file and an
Android APK with Capacitor). See README.md for the game and docs/ for the details.

## Rules agreed with the owner (keep them in future updates)

- **Jobs, skill points and second jobs:** read `docs/job-rules.md` before touching jobs, skills
  or job quests. In short:
  - The Blader and Sorcerer share one Job Level and one pool of skill points. Points go only into
    the active job's trees; switch first jobs at a Keeper.
  - Learnt skills stay usable with the right weapon (sword or staff).
  - Second jobs open at Job 40. The Magic Knight needs 20+ points in both the Blader and
    Sorcerer trees. BladeMaster/Wizard open only for the first job with the most points (a tie
    opens both). Only one second job can be taken; quitting a trial midway starts it over and
    lets the hero pick again. Job trials pay only when the whole series is done.
- **Damage balance:** second jobs hit about 2–4x their first job; Blader and Sorcerer stay close.
  Do not even out the BladeMaster and the Wizard: the BladeMaster is not elemental and keeps the
  higher steady damage, while the Wizard's elements make up the gap (see `docs/job-rules.md`).
- **Second-job skills:** the BladeMaster and Magic Knight keep to 3–4 active skills each (add
  passives, not actives). Area and multi-hit skills work Ragnarok style; their freeze, paralyze, stun
  and burn work on bosses too, at a third of the chance for half as long.
- **Walking speed:** Ragnarok's walk times (ms a tile: hero 150, monsters from Ragnarok's monster
  database) taken twice as long for Aria's smaller maps (`WALK_SCALE` in `rules.js`). Haste and slow
  follow Ragnarok's rule: only the strongest of each counts, never under 40%. No gear or skill hastes the walk
  (the owner's call: speed is a big buff in Aria).
- **Bosses and MVPs** spawn at random spots and roam their whole map; each has a respawn timer
  (`mvpAt`, saved) that holds across map changes and restarts.
- **Quests:** side quests and job trials can be quit from the Quest View; the main story quest
  can never be quit.
- **Character art:** bodies are bald to the standard in `docs/character-standard.md`; the game
  paints the shared head, hair and headgear.
- **Names:** plain common names in game; the cooler Old Norse names wait in `docs/names-later.md`.
- **README:** never mention Ragnarok (or its names: Poring, zeny...) in `README.md`; describe Aria
  on its own. The design notes in `docs/` and the code may still refer to it.

## Working on the repo

- Develop on the session's branch, then merge to `main`: every push to `main` builds the APK
  (`.github/workflows/android.yml`). Each build's version is 1.0.<run number>, so APKs install
  as updates. Every APK must be signed with `build-tools/debug.keystore` (set in the app's
  `build.gradle` by `build-tools/patch-android.mjs`; the workflow fails a build whose signature
  differs). Never change that key: phones would refuse the update and players lose their saves.
- After a build, give the owner the APK link:
  https://github.com/Marksmon/Aria/releases/download/apk-latest/Aria.apk
- `npx vite build` must pass. Test in the browser with Playwright (the game exposes
  `window.__aria`).
- Never commit the PixelLab API key, or the Ragnarok reference image used as a style reference.
