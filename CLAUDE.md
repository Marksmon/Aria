# Aria: notes for Claude

Aria is a Ragnarok Online-style phone RPG (Three.js + Vite, packed to one HTML file and an
Android APK with Capacitor). See README.md for the game and docs/ for the details.

## Rules agreed with the owner (keep them in future updates)

- **The plan (the owner's roadmap):** Aria will have at least 10 cities: 5 early-game cities (the
  first four are Steinborg, Galdrheim, Veidheim and Rytingborg, the desert's oasis city; the owner will add the fifth), then 5
  late-game cities. The first half of development ends when the 5 early-game cities are done; the
  late-game cities come after. Build new cities and their maps to the map defaults below.

- **Jobs, skill points and second jobs:** read `docs/job-rules.md` before touching jobs, skills
  or job quests. In short:
  - The first jobs (Blader, Sorcerer, Archer, Assassin) share one Job Level and one pool of skill points.
    Points go into any tree the hero earned, active or not (`trainTrees`); switching first jobs at
    a Keeper changes the job worn. Job Lv 1 of a first
    or second job counts: a Job 50 Blader has 50 points (the Trainee's stay 9).
  - Learnt skills stay usable with the right weapon. Blade skills need a sword (bare hands are no
    sword); Archer, Windrunner and Moon Ranger shots need a bow; Venom Strike, Dual Rend and Thousand Cuts need a dagger (a sword is no dagger); the Shadowblade's skills a sword, Killing Shot a bow (the Hunter's traps and the Voodoo's skills none); spells (Sorcerer, Wizard,
    Starfall), buffs and moves (War Cry, Stand Firm, Focus, Hunter's Mark, Leap Back, Tailwind,
    Gale Step, Venom Cloud, Shadow Step, Vanish, Pilfer, Phantom Double, Mirage Step) and the Beastmaster's skills need none. With no bow an Archer
    fights hand to hand. Gear follows the job worn (and a second job's first jobs); switching jobs
    puts away what the new job can't use.
  - The Archer (Huntmaster Sigrid, Veidheim) shoots from 5 paces with ATK from FNS; a bow needs
    arrows in the Arrows slot, bought once and never used up (an elemental arrow sets the shot's
    element). Its second job, the Windrunner (also Sigrid's), is about attack speed and short
    bursts of movement.
  - The Assassin (Master Kol, Rytingborg) fights with daggers. **Daggers can be held by every job**
    (no `jobs` list, the Trainee too: the owner's call): weaker than a sword (about 75%), quicker
    (`DAGGER` 0.8 of the sword's delay), with a shield. Poison is a status like burn (a fifth of
    the blow a second). Its second job, the **Phantom** (also Kol's), is about double weapons and
    illusions (the owner's call): a second dagger in the Shield slot only for a Phantom (`inv.dual`),
    the left hand striking with every blow (Twin Blades, `DUAL` 1.15x slower), and illusions
    (`allies.js` `shade`/`mirage`) that fight and draw the monsters.
  - Second jobs open at Job 40. The Magic Knight needs 20+ points in both the Blader and
    Sorcerer trees; the Moon Ranger (Hrafn the Stargazer) 20+ in both the Sorcerer and Archer trees;
    the Beastmaster (Bjarki, Veidheim) 20+ in both the Blader and Archer trees; the Assassin's crosses
    the same with the Assassin: the **Shadowblade** (Rurik, Steinborg; Blader + Assassin, swords: the
    Ambush out of hiding, `AMBUSH`, Backstab, and Umbral Step's teleport to a monster's back), the **Hunter** (Greta the Trapper, Veidheim; Archer + Assassin,
    bows and traps at its feet, `traps`, the Land Mine the biggest blast) and the **Voodoo** (Mother Hulda, Galdrheim; Sorcerer +
    Assassin, staves and daggers: Blight that stacks, `BLIGHT`; Substitute, a doll paid for in HP that takes its blows). The Beastmaster uses
    swords and bows, and its own tree holds only beast skills: the Bear (END), the Wolves (FNS) and
    the Hawk (QKN) can all be out together, and the hero's stats feed theirs (`src/allies.js`, `beastStats` in `main.js`; the owner's call: END mostly the Bear's HP and DEF, FNS mostly the Wolves' HIT and ATK, QKN mostly the Hawk's attack speed and reach, FTN every beast's crit and lucky dodge, POW every beast's ATK, KNL their instincts: harder, sooner, longer stuns and slows (`sharp`), every other stat a little, `MINOR`). The Wolves are the Black Wolf and the White Wolf. Each beast has one instinct it uses by itself on its own cooldown (the owner's call, `INSTINCTS`: the Bear's Maul stuns, the Wolves' Hamstring leaps and slows, the Hawk's Dive never misses; bosses resist as ever); they are the beasts' moves, not the hero's skills, and the Bear keeps its Roar, a war cry (the owner's call: every 10 s while it fights it taunts the monsters round it and the pack hits 10% harder for 6 s, `ROAR`). The Hawk is out of reach of melee (the owner's call): only arrows and a boss's thrown or falling blows reach it. The beasts' health bars sit beside the hero's panel (`#pets`). BladeMaster/Wizard/Windrunner/Phantom open only for the first job with the most points (a tie
    opens each tied one). Only one second job can be taken; quitting a trial midway starts it over and
    lets the hero pick again. Job trials pay only when the whole series is done.
  - A second job's own skills are raised only while its opening rule still holds (MK: 20 Blader and
    20 Sorcerer points) and every Trainee and first-job point is spent (`secondJobBlock`). A second
    job's skill reset unlearns first- and second-job skills, so the first jobs are rebuilt first. A
    two-path second job's tree that has 20 points takes no more until the other path's has 20, and
    a third first-job tree (a Magic Knight's Archer) takes none until both have 20.
  - Second jobs also train every other first job they earned (`trainTrees`), but for BladeMaster,
    Wizard, Windrunner and Phantom another first-job tree never passes the path's own (Wizard: Blader <= Sorcerer).
- **Damage balance:** second jobs hit about 2–4x their first job; Blader and Sorcerer stay close.
  The Assassin and the Phantom out-damage the Blader and the BladeMaster (the owner's call: they are
  much squishier): the Assassin about 1.4x the Blader, the Phantom 1.2–1.4x the BladeMaster.
  The Assassin's area poison skill is Venom Cloud, a new skill in Sonic Blow's place (the owner's call:
  a cloud at the target that bites everything in it through DEF while the hero fights on).
  The crosses (`build-tools/second-sim.mjs`): the Shadowblade about 1.1x the BladeMaster on a lone boss
  (more in a field, where kills hide it), the Hunter about 0.9x the Windrunner, the Voodoo about 1.1x
  the Wizard over a long fight.
  Do not even out the BladeMaster and the Wizard: the BladeMaster is not elemental and keeps the
  higher steady damage, while the Wizard's elements make up the gap (see `docs/job-rules.md`).
- **Second-job skills:** every second job keeps to 3–4 active skills (the Beastmaster's are its three summons and Pack Frenzy; the Phantom's Dual Rend, Phantom Double, Mirage Step, Thousand Cuts; the Shadowblade's Shadow Slash, Umbral Step, Eclipse, Shadow Bloom; the Hunter's Bear and Shock Traps, Land Mine and Killing Shot; the Voodoo's Poison Throw, Curse Circle, Substitute, Voodoo Doll) (add
  passives, not actives).
- **Every second job plays its own way** (the owner's call): each has one mechanic no other job
  shares, and its own strength and weakness (`JOB_TRAITS` in `progress.js`, shown at the job change;
  the table in `docs/job-rules.md`). A new second job gets a new mechanic and a `JOB_TRAITS` line,
  never a copy of another's. Area and multi-hit skills work Ragnarok style; their freeze, paralyze, stun
  and burn work on bosses too, at a third of the chance for half as long.
- **Walking speed:** Ragnarok's walk times (ms a tile: hero 150, monsters from Ragnarok's monster
  database) taken twice as long for Aria's smaller maps (`WALK_SCALE` in `rules.js`). Haste and slow
  follow Ragnarok's rule: only the strongest of each counts, never under 40%. No gear or skill hastes the walk
  (the owner's call: speed is a big buff in Aria), except the Windrunner's short bursts: Tailwind's
  4 s rush and the 2 s after Gale Step (the owner's call: bursts only, never a lasting haste).
- **Map defaults (every map, and any new map gets them unless the owner says otherwise):**
  - Monsters follow the hero round the map with no time limit while the hero is near, and give up
    only past `FOLLOW.lose` x their aggro range (or on safe ground / Play Dead). They are never
    anchored: once they give up they wander on from there (their home moves); only a dead one
    respawns at its first spot (`spawn`). No leash back home for field monsters (`mobs.js`).
  - Every map keeps its monsters as the hero left them: spot, HP, count, respawn timers, the timers
    running on while away (`fieldAt`, saved). Bosses and MVPs keep their spot, wounds and guards
    (`bossAt`, `bossHp`). Drops stay on their map with their 45/90 s timer running (`groundLeft`).
  - The map lives on while the hero is away: on return, each monster has wandered (random walk at
    its stroll, `AWAY` in `mobs.js`: `wander`) and each boss has roamed spot to spot (`roamAway`)
    for the time away (capped at 3 min), done at once on arrival.
  - A new map only needs its `SPAWNS` entry in `main.js`; all of the above comes with it. A dungeon floor is a map
    with `maze` (and `indoor`) in `world.js` MAPS (`dungeon.js`); a portal's `out` says where you arrive beside it.
- **The first-job pick comes at Trainee Job 9** (the owner's call: little grinding): a Trainee who reaches
  `CALL_JOB` anywhere after the Seeress is called home to Eldrun's 'paths' step at once (`Story.callHome`,
  the rest of Chapter 1 is skipped); there is no grind step before it. Keep Chapter 1 short.
- **The Prologue's lessons are guided** (the owner's call: a stat point is costly to take back): `GUIDES` in
  `main.js` (stats, equip, Basic Training's skills, hotbar, the Gel Thief), drawn by `src/guide.js` (a ring round what to tap, a
  bubble saying what it is, a hand for a drag). The stats guide explains every stat and which path
  wants it before a point is placed. During the Prologue (and for a story monster) a gold arrow points to
  the goal (`tickGoalArrow`). A new lesson for a new step only needs its `GUIDES` entry. Once a first job is worn, a lesson on its skills runs once (`jobSkillsGuide`: the tree, an
  active skill, the hotbar; it never spends a point for the hero, the owner's call: points are their build;
  skipped for a hero who already has one there). The first talk with a crafter
  (any `craft` NPC, the raid guides too), Holger (refining) or Seyla (card slots) runs that craft's lesson
  once (`NPC_GUIDES` in `main.js`; walking off before opening their window keeps it for next time).
- **The Keepers' storage opens with a first job** (the owner's call): a Trainee can't open it (`Menus.show`).
- **Quests window** (the Quests button under the hero's panel, `journal` in `menus.js`, `questBook`
  in `main.js`): tabs Main (the story step and chapters), Job (trials), Series (quest chains, a
  title with a number: "The Forge 2: ..."), Side (standalone quests and bounties).
- **Refining stones drop almost anywhere** (the owner's call, `ORE_DROPS` in `mobs.js`): Iron Ore
  1% from most monsters, Steel Ore 1% from Lv 10, Hard Ore and Armor Ore 0.5% from Lv 30 (mini-bosses
  4%); kobolds, goblins and their kings keep their higher chances. New monsters get them too.
- **MVP gear is spread over every MVP** (the owner's call): each drops pieces for several builds (weapons
  for more than one job, plus armor or a garment), not just the Fire Giant.
- **Bosses and MVPs** spawn at random spots and roam their whole map; each has a respawn timer
  (`mvpAt`, saved) that holds across map changes and restarts. One left alive keeps its spot
  when the hero leaves the map (`bossAt`, saved). Dropped items stay on their map too, their
  45/90 s still counting while the hero is away (`groundLeft` in `main.js`). Every map's own
  monsters are kept the same way: spot, HP, count and respawn timers, the timers running on while
  away (`fieldAt`, saved; a map whose spawn list changed spawns afresh).
- **MVPs are the hardest fights in Aria** (the owner's call): several minutes each, with skills of
  their own that need a plan (Fire Giant: Meteor Rain and burning ground; Kobold King: Tribe's
  Shield and Burrow; Goblin King: Mirror Image; Ancient Treant: Grasping Roots and Bark Armor; Sand Wyrm: almost half the fight under the sand,
  unhittable, moving only while under and rooted while up, `WYRM`/`wyrmTick` in `mobs.js`; Eternal Sphinx: The Riddle,
  three answers in three circles round the hero: the right one Dumbstruck, a wrong one or none its Judgment and
  Exalted, `RIDDLE`/`RIDDLES`; the owner's call: it tests through riddles and combat; Nidhogg: Gnaw the Roots, a race to
  tear it away before it heals and frenzies, `MOVES.gnaw`), and
  enraged below half HP (`MVP_RAGE`). Even a Lv 99 hero without good, upgraded gear should not beat
  one. Mini-bosses are half as hard as an MVP and fierce like one (the owner's call). Their levels say so (55–66: Giant Sprout and Elder Willow 55, King Crab 58, Giant Mushroom 60, Giant Beetle 62, Alpha Wolf 64, Great Bear 66; the desert's Cactus Lord 60 and Rainbow Runner 64; the Sphinx's Halls' Ammit 74; Yggdrasil's Ratatoskr 74, small for a boss: the owner's call), and they come only for second-job heroes (the owner's call, `picksFight` in `mobs.js`): a Trainee or first job is left be unless it strikes or taunts one. So no main story
  step or job trial needs a boss (they hunt the boss's kin); the one quest that does is Sigrid's The
  Waking Wood (Lv 70: the Great Bear and the Alpha Wolf, two mini-bosses), and it can be quit. Boss and MVP cards drop at 1%
  (other cards 0.1%); an MVP's card and ultra rare rise a tenth of their chance with every kill they miss, up
  to ten times it, back once they drop (the owner's call, `PITY` in `mobs.js`, saved as `mvpPity`). **Cards are monsters** (the owner's call): one card per monster, named after it,
  never a second card or a card that is not a monster. More Head/Face cards (for fighters: today's
  lean to casters and archers) wait for new monsters in a map extension. The MVP and raid boss cards
  each have an effect of their own, after the boss's moves (`card.perk`: Fire Giant burn, Kobold
  King guard, Goblin King lucky dodge, Ancient Treant reflect, Sand Wyrm devour, Eternal Sphinx cheaper skills, `sage`; Nidhogg Root Rot, a monster struck takes more, `rot`; BleepBloop lifesteal, Kobold Warlord
  stun, Goblin Warlord melee and double blows, Pharaoh soul tax). Mini-boss cards have smaller ones of their own,
  never a weaker copy of an MVP's or raid boss's (the owner's call: Giant Sprout HP regen, King Crab
  never slowed, Giant Mushroom SP regen, Giant Beetle DEF pierce, Elder Willow faster casting,
  Alpha Wolf crits, Great Bear harder blows at low HP, Cactus Lord venom, Rainbow Runner quick after a kill, Ammit harder on a monster under 30% HP, `execute`; Ratatoskr harder from 4 paces off, `farshot`). Every card keeps its stats
  (the owner's call; MVP and boss cards too); an effect comes on top.
  **Boss AI** (`BRAIN` in `mobs.js`, every mini-boss, raid boss and MVP): it aims where a running
  hero is going (not a step aside), picks moves for the moment (gap-closers on kiters and casters,
  area moves on a hero standing still), gives chase in a burst when kited, bounds over a rock that
  keeps it off you, and a mini-boss hunts like an MVP (gives up only 18 paces off, heals only after
  10 s out of the fight). Every monster steers round obstacles; a blocked boss finds a way round with
  A* over the map (`src/path.js`), roaming or hunting.
  Each MVP has a matchup (`takes` in `mobs.js`, applied in `rules.js`): easiest for one job family
  and hardest for another (Fire Giant: bows / casters; Kobold King: casters / bows; Goblin King:
  blades / bows and casters; Ancient Treant: beasts / blades; Sand Wyrm: blades and daggers / beasts; Eternal Sphinx: casters / beasts; Nidhogg: bows / blades and daggers).
- **Card paintings** (the owner's call): a card can have an anime painting (2:3, the name and a BOSS badge painted in, after the Ragnarok card art), `src/art/cards/<card id>.jpg` (640 wide). A card with one gets a View art button in the Items window and an Art button where it sits in a piece; it opens full screen, the picture alone with no text under it, a tap closes it (`src/cardart.js`, loaded only when opened). The five first MVP cards have theirs; the Eternal Sphinx's, the mini-boss and raid cards come next.
- **The desert and the Sphinx:** Rytingborg (`sand`), the Red Sands (a Trainee's field), the Cactus
  Dunes, Scorpion Sands (the Pyramid: the raid guide) and the Great Desert (the Sand Wyrm). The
  Carters always offer Rytingborg (`ALWAYS_FARES`). A secret 6-step series (Old Gunnhild, The
  Sphinx's Riddle) stays out of sight until the hero has walked all four sands (`needZones`); its
  last step opens a hidden portal (`need: 'sphinx6'` on the portal) to Sphinx Sands: the Giant
  Sphinx (about half the map), no monsters, and the door in its chest: a portal down into the
  **Sphinx's Halls, the first dungeon** (`src/dungeon.js`, `halls1`-`halls4` in `world.js` MAPS); its monsters live
  only inside the Sphinx, none outside (the owner's call). Three maze floors, then the great hall alone (the owner's
  call): a maze is 14x14 cells of 3x3 tiles, walls a tile thick on the tile grid, carved from a seed (`maze`: rooms,
  loops; the stairs in pillarless portal rooms), walls cut away between camera and hero (a shader dither), always
  dim (`indoor`: `daynight.js` STATES.dungeon). Floors get harder for levelling (the owner's call): 1 Scarab, Cobra
  (65-72); 2 Mummy, Lamia, Pharaoh's Servant (73-80); 3 Sphinx Cub, Sand Elemental, Sarcophagus and Ammit the
  mini-boss (81-88; Ammit stays Lv 74); 4 the great hall (`maze.hall` with `only`, `world.hall`; 89-99): the Jackal Guardians and Falcon
  Sentinels (`hall: true`, they keep to it) and the **Eternal Sphinx** (Lv 99 MVP, `hall: true`: it never leaves the
  hall and fights only a hero in it; it summons its cubs and Guardians, the owner's call). It drops Gold Bars (always,
  and as its MVP reward) and the ultra rare **Sphinx's All-Seeing Eye** (Face, 1%, the owner's call: all stats +3, MATK +10%, HIT
  +10; drawn by `build-tools/draw-eye.py`). The dungeon's monsters are painted in code in `src/halls.js` (the Scarabs
  and Mummies borrow the tomb's sprites, as field monsters `hallScarab`/`hallMummy`).
- **Yggdrasil, the World Tree:** a secret 6-step series (Old Ingrid the Seedkeeper, Veidheim's well, The World
  Tree) stays out of sight until the hero has walked Veidheim's four lands (`needZones`: marsh, oldwood, farm,
  wolfhill), like the Sphinx's; its last step (the seed planted by the stump north in the Old Forest) opens a
  hidden portal (`need: 'tree6'`) to Yggdrasil (`ygg`, `src/yggdrasil.js`): no monsters, a trunk so big only it
  can be seen (the owner's call), great roots round it with colliders (each fades on its own when it hides the hero), and one root you climb (its rise is in the
  terrain, `rampAt` in `world.js`; low roots along its sides) to the door portal in the trunk. Inside, the
  **second dungeon**, Yggdrasil's Hollows (`ygg1`-`ygg4`, `dungeon.js` looks `tree1`-`tree4`: bark walls, moss
  tops, glowing runes, earth floors, living-trunk pillars, glowing mushrooms for torches): three maze floors and the
  great hall, Base 45-75 (the owner's call, November 2026: the two dungeons staggered, the Sphinx's Halls 65-99, so
  each opens at the level of its secret series; the bosses and mini-bosses kept their levels; from Lv 61 the
  dungeons' monsters pay 2x EXP for the late climb). 1 Root Squirrel, Bramble (45-52); 2 Root Serpent, Moss
  Golem, Dark Elf (53-60); 3 Great Stag, Dryad, Rot Beetle (61-68) and Ratatoskr the mini-boss (74; the owner's call, after the owner's sheet: the
  messenger squirrel in runed plate with a fiery tail, a Bloop's size, the same as its followers, the Root Squirrels (the owner's call), quick, hard to hit); 4 the great
  hall: Root Wardens, Thorn Drakes (`hall: true`) and **Nidhogg** (Lv 99 MVP, `hall: true`; after the owner's
  picture: black, red-cracked, torn crimson wings with holes), whose mechanic is Gnaw the Roots (`MOVES.gnaw`:
  it heals while the rot withers the hall; tear it away with `tear` of its HP in time, or it rises gorged in a
  frenzy). It drops World Tree Berries (always: full HP and SP, `use.full`), the World Tree Crown (Head, 1%,
  `build-tools/draw-crown.py`) and its ultra rare, **Nidhogg Wings** (1%, the owner's call; `wingart.js` `nidhogg`,
  after the owner's sheet), animated even standing still (the owner's call, `wings.js`: a pulsing glow layer,
  `WING_GLOW`, embers, and every few seconds at rest a slow spread with the glow flaring, `SPREAD`). The tree is
  big with many roots (the owner's call: great roots with branches, small ones breaking the ground all round).
  Ratatoskr drops Ratatoskr's Tail (Wings, 2%: one piece, not a pair, `SINGLE` in `wingart.js`, its runes pulsing,
  a swish at rest). Its monsters are painted in code in `src/roots.js`, every one with a design of its own (the owner's call).
- **Quests:** side quests and job trials can be quit from the Quest View; the main story quest
  can never be quit.
- **EXP rates:** battles pay x4 (`RATES`: monsters, mini-bosses, MVPs, raids); quests pay x2
  (`QUEST_RATE`: side quests, job trials, the main story).
- **Raids** (`src/raid.js`): Bloop Island (the Boatman, Salt Bay), the Kobold Camp (Brokk, Coal Pit),
  the Goblin Lair (Ylva, Serpent Wood) and Pharaoh's Tomb (Sindri, Scorpion Sands, at the Pyramid). 3 waves of relentless monsters, then a boss with a
  big health bar, all within 10 minutes, in a small round arena. Half HP/SP back after each wave,
  all of it before the boss. Each raid has one 3 h cooldown shared by its difficulties, from
  setting out, started only by a clear (the owner's call): a failed run (left, fainted, out of time,
  or the game closed or restarted mid-run: `raidRun` in the save) pays nothing and costs no
  cooldown. Every run goes in the hero's raid history (`raidLog`, saved, the Raids window's History
  tab: cleared or failed and why, perz, EXP, items). A clear pays the raid's cores x1/x3/x9/x27 by difficulty (3/9/27/81), its rare finds
  at 3% on any difficulty (each raid has a rare for every build: blade POW, tough END, quick QKN,
  archer FNS, caster KNL, lucky FTN: the owner's call), and its ultra rare (a Head, Face or Wings piece: Angel Wings, the Giant Goat
  Horn Helm, Elven Ears, the Pharaoh's Headdress) and its card at 1%; its guide makes the rares and the ultra rare
  from cores (the rarer, the more; an ultra rare 500, always made, 10% of them with a card slot). The story's step gets a
  Tutorial run: no cooldown; only a clear of it completes the story step and pays (the owner's call:
  a lost Tutorial is a failed run, and Easy and up don't complete the step). Easy/Normal/Hard/Hell need Base 40/55/70/85 (the owner's call):
  (the Kobold Camp 45/60/75/90, the Goblin Lair 50/65/80/95, Pharaoh's Tomb 55/70/85/99). Easy a first job with no potions,
  Normal a second job with 20 White, Hard with 30. Once a hero has done a raid at its guide, the Raids
  window sets out on it from anywhere and brings them back where they were (`raidsDone`, `raid.back`; a Back button returns to the list), and the guides wear a RAID tag; Hell's boss is fierce (as
  hard and tricky as a field MVP: `FIERCE` in `mobs.js`), for a hero in the best gear. Clear rewards
  (perz, materials) x1/x3/x6/x9. Raid EXP is held and paid at the end: x1.5 on a clear,
  nothing on a failure (the Tutorial too).
- **Character slots and storage** (`src/save.js`): three heroes, picked on the title screen (slot 1
  keeps the old save key). The Keepers' storage is one chest shared by every hero (from a first job on), saved apart from
  them; a save code backs up every hero and the storage together.
- **Character art:** bodies are bald to the standard in `docs/character-standard.md`; the game
  paints the shared head, hair and headgear. Each hairstyle is for one body only (the owner's call,
  `HAIR_BODY` in `hair.js`): Tousled and Long for male heroes, Straight and Ponytail for female; a
  save with the other body's style gets one of its own on load.
- **Picking a path:** once the hero picks a first job by Elder Halvard's fire, he sends them straight
  to that job's town, beside its trainer, and the town is saved as theirs: its Keeper signs them in
  and their save point moves there, as a Save here would (the owner's call, `toTrainer` in `main.js`).
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
- Start-up stays light (phones stalled on a blank sky when it wasn't): a map is built the first time it
  is entered (`buildWorld`; its people stand there then, `Villagers.build`), a monster's sprite set is
  made the first time one is met (`mobs` in `createSprites`), and a sheet's frames get their canvas and
  are drawn the first time an animation is shown (`pixelSet`). New maps, monsters and sheets get this
  for free; don't paint every frame or build every map at load.
- `npx vite build` must pass. Test in the browser with Playwright (the game exposes
  `window.__aria`).
- `npm test` must pass (`test/`: the job rules, the data, saves, the balance bands; it also runs
  before every APK build), and `npm run smoke` after a build (the built game in Chromium). Both run
  on every push (`.github/workflows/test.yml`). A new owner rule that code can check gets a test.
- The README's usables, monster-drop and card tables are written from the game's data between
  `<!-- tables:... -->` markers: after changing items, drops or cards run `node build-tools/readme-tables.mjs`
  (`npm test` fails while they are out of date). The prose round them is kept by hand.
- Never commit the PixelLab API key, or the Ragnarok reference image used as a style reference.
