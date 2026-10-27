# Aria: notes for Claude

Aria is a Ragnarok Online-style phone RPG (Three.js + Vite, packed to one HTML file and an
Android APK with Capacitor). See README.md for the game and docs/ for the details.

## Rules agreed with the owner (keep them in future updates)

- **Jobs, skill points and second jobs:** read `docs/job-rules.md` before touching jobs, skills
  or job quests. In short:
  - The first jobs (Blader, Sorcerer, Archer) share one Job Level and one pool of skill points.
    Points go into any tree the hero earned, active or not (`trainTrees`); switching first jobs at
    a Keeper changes the job worn. Job Lv 1 of a first
    or second job counts: a Job 50 Blader has 50 points (the Trainee's stay 9).
  - Learnt skills stay usable with the right weapon. Blade skills need a sword (bare hands are no
    sword); Archer, Windrunner and Moon Ranger shots need a bow; spells (Sorcerer, Wizard,
    Starfall), buffs and moves (War Cry, Stand Firm, Focus, Hunter's Mark, Leap Back, Tailwind,
    Gale Step) and the Beastmaster's skills need none. With no bow an Archer
    fights hand to hand. Gear follows the job worn (and a second job's first jobs); switching jobs
    puts away what the new job can't use.
  - The Archer (Huntmaster Sigrid, Veidheim) shoots from 5 paces with ATK from FNS; a bow needs
    arrows in the Arrows slot, bought once and never used up (an elemental arrow sets the shot's
    element). Its second job, the Windrunner (also Sigrid's), is about attack speed and short
    bursts of movement.
  - Second jobs open at Job 40. The Magic Knight needs 20+ points in both the Blader and
    Sorcerer trees; the Moon Ranger (Hrafn the Stargazer) 20+ in both the Sorcerer and Archer trees;
    the Beastmaster (Bjarki, Veidheim) 20+ in both the Blader and Archer trees. The Beastmaster uses
    swords and bows, and its own tree holds only beast skills: the Bear (END), the Wolves (FNS) and
    the Hawk (QKN) can all be out together, and the hero's stats feed theirs (`src/allies.js`). BladeMaster/Wizard open only for the first job with the most points (a tie
    opens each tied one). Only one second job can be taken; quitting a trial midway starts it over and
    lets the hero pick again. Job trials pay only when the whole series is done.
  - A second job's own skills are raised only while its opening rule still holds (MK: 20 Blader and
    20 Sorcerer points) and every Trainee and first-job point is spent (`secondJobBlock`). A second
    job's skill reset unlearns first- and second-job skills, so the first jobs are rebuilt first. A
    two-path second job's tree that has 20 points takes no more until the other path's has 20, and
    a third first-job tree (a Magic Knight's Archer) takes none until both have 20.
  - Second jobs also train every other first job they earned (`trainTrees`), but for BladeMaster,
    Wizard and Windrunner another first-job tree never passes the path's own (Wizard: Blader <= Sorcerer).
- **Damage balance:** second jobs hit about 2–4x their first job; Blader and Sorcerer stay close.
  Do not even out the BladeMaster and the Wizard: the BladeMaster is not elemental and keeps the
  higher steady damage, while the Wizard's elements make up the gap (see `docs/job-rules.md`).
- **Second-job skills:** every second job keeps to 3–4 active skills (the Beastmaster's are its three summons and Pack Frenzy) (add
  passives, not actives). Area and multi-hit skills work Ragnarok style; their freeze, paralyze, stun
  and burn work on bosses too, at a third of the chance for half as long.
- **Walking speed:** Ragnarok's walk times (ms a tile: hero 150, monsters from Ragnarok's monster
  database) taken twice as long for Aria's smaller maps (`WALK_SCALE` in `rules.js`). Haste and slow
  follow Ragnarok's rule: only the strongest of each counts, never under 40%. No gear or skill hastes the walk
  (the owner's call: speed is a big buff in Aria), except the Windrunner's short bursts: Tailwind's
  4 s rush and the 2 s after Gale Step (the owner's call: bursts only, never a lasting haste).
- **Bosses and MVPs** spawn at random spots and roam their whole map; each has a respawn timer
  (`mvpAt`, saved) that holds across map changes and restarts.
- **MVPs are the hardest fights in Aria** (the owner's call): several minutes each, with skills of
  their own that need a plan (Fire Giant: Meteor Rain and burning ground; Kobold King: Tribe's
  Shield and Burrow; Goblin King: Mirror Image; Ancient Treant: Grasping Roots and Bark Armor), and
  enraged below half HP (`MVP_RAGE`). Even a Lv 99 hero without good, upgraded gear should not beat
  one. So no main story step needs a boss, and boss and MVP cards drop at 1% (other cards 0.1%).
  Each MVP has a matchup (`takes` in `mobs.js`, applied in `rules.js`): easiest for one job family
  and hardest for another (Fire Giant: bows / casters; Kobold King: casters / bows; Goblin King:
  blades / bows and casters; Ancient Treant: beasts / blades).
- **Quests:** side quests and job trials can be quit from the Quest View; the main story quest
  can never be quit.
- **EXP rates:** battles pay x4 (`RATES`: monsters, mini-bosses, MVPs, raids); quests pay x2
  (`QUEST_RATE`: side quests, job trials, the main story).
- **Raids** (`src/raid.js`): 3 waves of relentless monsters, then a boss with a big health bar, all
  within 10 minutes, in a small round arena. Half HP/SP back after each wave, all of it before the
  boss. One 3 h cooldown shared by every difficulty, from setting out. The story's step gets a
  Tutorial run: no cooldown, and the clear reward win or lose (a loss gets the Boatman's "we finished
  it for you, but not next time"). Easy/Normal/Hard/Hell are made for Base 30/40/50/60: Easy with no
  potions, Normal with 20 Orange, Hard and Hell for a second job with 30 and 50 White. Clear rewards
  x1/x3/x6/x9 and a rare chance of 5/10/15/20%. Raid EXP is held and paid at the end: x1.5 on a clear,
  the kills alone on a failure.
- **Character slots and storage** (`src/save.js`): three heroes, picked on the title screen (slot 1
  keeps the old save key). The Keepers' storage is one chest shared by every hero, saved apart from
  them; a save code backs up every hero and the storage together.
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
