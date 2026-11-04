# Jobs, skill points and second jobs: the rules

These are design rules agreed with the game's owner. Keep them when adding jobs, skills or
quests. Code: `src/progress.js` (jobs, levels, points), `src/skills.js` (trees, `learnBlock`,
`secondJobOpen`, weapon needs), `src/quests.js` (trials, `Quests.status`), `src/menus.js`
(trainer and Keeper dialogue).

## Jobs

| Tier | Jobs | Job Level |
|---|---|---|
| 0 | Trainee (`novice`) | 1–10 |
| 1 | Blader (`swordman`), Sorcerer (`mage`), Archer (`archer`), Assassin (`assassin`) | 1–50, one level shared by all |
| 2 | BladeMaster (`blademaster`, from Blader), Wizard (`wizard`, from Sorcerer), Magic Knight (`magicknight`, from Blader and Sorcerer), Windrunner (`windrunner`, from Archer), Moon Ranger (`moonranger`, from Sorcerer and Archer), Beastmaster (`beastmaster`, from Blader and Archer), Phantom (`phantom`, from Assassin), Shadowblade (`shadowblade`, from Blader and Assassin), Hunter (`hunter`, from Archer and Assassin), Voodoo (`voodoo`, from Sorcerer and Assassin) | 1–50, starts again at 1 |

## First jobs: walking several paths

- A Trainee takes one first job through its trial: Trainee Job 10 and Basic Training 9.
- A first-job hero may also take **another** first job's trial (a Blader the Sorcerer's, the
  Archer's or the Assassin's, and so on). They then hold each one earned.
- The first jobs share **one Job Level and one pool of skill points**. Example: at Job 40 there
  are 40 first-job points (plus the Trainee's 9), which may be split, e.g. 20 as a Blader and 20
  as a Sorcerer.
- Switching between first jobs is done at a **Keeper** (the Keepers' ledger must be signed).
  Trainers do not switch jobs.

## The Archer

- Trained by **Huntmaster Sigrid** in Veidheim. Trial: 5 Yellow Bloops in Willow Marsh, wax a
  bowstring with 5 Bloop Gel (a quiz with items, like the Sorcerer's brew), her three questions.
  A new Archer is handed a Hunting Bow and Wooden Arrows, worn at once.
- **Bows** (`kind: 'bow'`) can be worn with a shield (the owner's call; they used to take both hands): an
  Archer's shield is strapped to the forearm, so the hand still draws the string. A bow's normal attack and the bow skills
  reach `BOW_RANGE` (5) paces, +0.2 a level of Long Sight; the arrow flies and the hit is rolled
  when it lands.
- **Ragnarok's ranged rule:** with a bow, status ATK comes from FNS (`fns + (fns/10)^2 + pow/5 +
  ftn/5`) instead of POW (`derive`, `gear.bow`). The bow draws at the job's `delay.bow`.
- **Arrows** are an equipment slot (`ammo`), bought once and never used up (the owner's call). The
  arrows' ATK adds to the bow's; an elemental arrow sets the shot's element (over the bow's own).
  No arrows: the bow can't shoot ("Equip arrows to shoot").
- Five actives like the Blader (Double Shot, Arrow Rain, Focus, Hunter's Mark, Leap Back) and
  passives (Keen Eye, Long Sight, Steady Aim). Leap Back and Steady Aim come free at Job 10.
- Balance: about the Blader's damage on one target (`build-tools/sim.mjs`); it takes less damage
  by shooting first and stepping back, and has fewer HP and less DEF.

## The Assassin and daggers

- Trained by **Master Kol** in Rytingborg, the desert's oasis city. Trial: 5 Red Bloops in the Red
  Sands, oil a blade with 5 Ant Mandibles (a quiz with items), his three questions. A new Assassin
  is handed a **Rusty Dagger**, put on at once unless a dagger is already in hand.
- **Daggers** (`kind: 'dagger'`) have **no `jobs` list: every job can hold one**, the Trainee too
  (the owner's call). Lower ATK than a sword of the same tier (about 75%) but quicker: a job with no
  `delay.dagger` swings one at `delay.sword * DAGGER` (0.8, `rules.js`). A dagger is no sword:
  Blade skills still need a sword. Spells, buffs and moves work with a dagger in hand. Daggers go
  with a shield.
- Five actives (Venom Strike, Venom Cloud, Shadow Step, Vanish, Pilfer) and passives (Dagger
  Mastery, Double Attack, Improve Dodge, Lethal Edge). Pilfer and Lethal Edge come free at Job 10.
  **Venom Cloud** is the area poison skill (the owner's call: a new skill in Sonic Blow's place; old
  saves' Sonic Blow points and hotbar slots go to it, `RENAMED_SKILLS` in `progress.js`): a vial of
  venom smashed at the target from 4 paces, a cloud 2.2 paces round that bites everything in it every
  half second for 5 s (`hits`/`every`/`area`), through DEF (venom goes through armour), each bite a
  poison roll. It needs no weapon (a vial), and the hero fights on while it works.
- **Poison** (Venom Strike, Venom Cloud, Thousand Cuts, the Stinger, the Cactus Lord Card) is a status like
  burn: a fifth of the blow that set it, each second, for its time; a new poison replaces the old.
  Bosses resist (a third of the chance, half as long). Sand Scorpions poison the hero: 1.5% of Max
  HP a second for 6 s, cured by a Green Herb.
- Balance (the owner's call): **the Assassin out-damages the Blader, the Phantom the BladeMaster**,
  because they are far squishier (fewer HP, less DEF; FLEE instead). The Assassin kills about 1.4x as
  fast as the Blader (`build-tools/sim.mjs` has an Assassin build); the Phantom deals 1.2–1.4x the
  BladeMaster's single-target damage (`docs/balance.md`). Weaker blows, quicker swings, Double
  Attack, poison.

## The Phantom (the Assassin's second job)

- Master Kol's second trial: 20 Sand Scorpions, 20 Dune Worms, 25 Soldier Ants. A one-path second
  job like the BladeMaster: open for the first job with the most points.
- **Two daggers** (the owner's call: "double weapon"): only a Phantom puts a second dagger in the
  Shield slot (`inv.dual`); switching away from the Phantom puts the left dagger away
  (`dropUnwearable`). Every blow of the right hand is followed by the left at Twin Blades' share
  (55–100%) of the left dagger's own damage (`leftHit`); the pair swings `DUAL` (1.15x) slower.
  Dual Rend cuts right and left in turn.
- **Illusions** (the owner's call): Phantom Double sends two illusions of the hero to fight
  (`allies.js`, kind `shade`), Mirage Step leaves one behind that draws every monster near it
  (`mirage`, `still`, a 4-pace taunt). Illusions are companions without a health panel; Lingering
  Shade and Phantom Grace feed on them.
- Actives: Dual Rend, Phantom Double, Mirage Step, Thousand Cuts (four, the owner's rule).

## Every second job its own way (the owner's call)

No two second jobs play alike: each has **one mechanic of its own** that no other job shares, and
its **own strength and weakness** (`JOB_TRAITS` in `progress.js`, shown at the job change). A new
second job gets a new mechanic and a line in `JOB_TRAITS` and in this table; it never copies
another's (no second stack-and-spend like Momentum, no second set of pets like the beasts).

| Second job | Its own mechanic | Strong | Weak |
|---|---|---|---|
| BladeMaster | Combo and Momentum (stacks spent by Final Blade) | the steadiest damage on one target, the same on every monster; most HP of the blades | no element; few area skills |
| Wizard | elements, Resonance, Shatter | packs; a monster weak to its element | frail; long casts; far behind on a monster that resists |
| Magic Knight | Elemental Blade and Chain, ATK + MATK | the toughest (HP, Stone Aegis); its element of choice | neither the hardest hitter nor the best on packs; SP |
| Windrunner | attack speed, bursts of speed | the quickest shots, a dash out of any corner | little burst, thin on packs, frail up close |
| Moon Ranger | ATK + MATK arrows, the moon | the best bow on packs, stronger at night | weaker by day; SP |
| Beastmaster | three beasts fed by its stats | never alone: the beasts take the blows | modest own blows; a fallen beast is gone 20 s |
| Phantom | two daggers, illusions | the highest steady melee damage | far squishier than a BladeMaster |
| Shadowblade | **the Ambush** (a blow out of hiding), executions | the biggest single blows; every kill hides it again (Night Stalker) | bosses see through hiding (only the Ambush of Umbral Step lands on them); Shadow cuts barely scratch Shadow monsters; one area skill; fewer HP than a BladeMaster |
| Hunter | **traps** set at its feet | holds, paralysis and blasts on whole packs; trap damage never misses and goes through DEF | traps need a monster to walk in (floating Wisps never do; one that stands off never springs them); less steady damage than a Windrunner |
| Voodoo | **Blight**, a curse that stacks | through MDEF and never resisted: the strongest over a long fight; Curse Circle makes everything take more | slow to start, little burst; the frailest second job; Shadow is weak on Shadow monsters |

## The Assassin's crosses: Shadowblade, Hunter, Voodoo

Two-path second jobs like the Magic Knight (`from` of two first jobs: 20 points in each, the same
`secondJobOpen` / `secondJobBlock` / `learnBlock` rules). Each wears the gear of both its paths.

- **Shadowblade** (Rurik the Shadowblade, Steinborg; Blader + Assassin): swords (and daggers, like
  everyone). Its look is the Phantom's grand coat in black and vivid violet, with long glowing
  blades. The **Ambush** (`AMBUSH` 2 in `skills.js`, Night Stalker +10% a level): the first blow out
  of any hiding (Vanish, Umbral Step, Night Stalker's kill) lands that much harder (`unhide` in
  `main.js`). Actives: Shadow Slash (two Shadow cuts), Umbral Step (a line cut to the target's
  back, then hidden 2 s), Eclipse (one huge Shadow blow, +1% for every 1% of HP the monster has
  lost), Shadow Bloom (area, **blind**: a blinded monster misses `BLIND` 40% of its blows, bosses
  resist). Passives: Umbral Edge (sword ATK and crit), Night Stalker (a kill hides you), Cruel Edge
  (more below half HP). Trial: 20 Goblin Assassins, 20 Dark Wisps, 25 Fire Beetles.
- **Hunter** (Greta the Trapper, Veidheim; Archer + Assassin): bows. The Moon Ranger's cut in black
  and blood red. **Traps** (`traps`, `tickTraps`, `springTrap` in `main.js`; drawn by `fx.prop`):
  set at the hero's feet (never on safe ground), armed after 0.6 s, waiting 30 s (+2 a level of Trap
  Mastery), 3 out at once (+1 at Trap Mastery 5 and 10; the oldest is picked up); the first monster
  that walks in springs it, never one that flies (`def.fly`). Trap damage is (FNS x 1.5 + KNL + Base
  Lv x 2) x the trap's %, never misses, through DEF, the trap's element. Bear Trap holds (the monster
  can't walk, `slowBy` 1; bosses half as long), Shock Trap paralyzes a pack, Blast Trap blows one
  apart. Killing Shot (bow) hits a held, stunned, frozen or paralyzed monster 60% harder; Predator
  adds to arrows on a caught or poisoned one; Barbed Traps poison. Trial: 15 Snakes, 10 Bears,
  25 Wolves.
- **Voodoo** (Mother Hulda, Galdrheim; Sorcerer + Assassin): staves and daggers. The Wizard's robe in
  black over toxic green. **Blight** (`BLIGHT` in `skills.js`; `blight`, `blightDmg` in `main.js`):
  stacks on a monster, up to 5 (8 on the Voodoo Doll's), for 6 s, refreshed by each new stack; each
  stack eats 8% of the MATK a second (+1.6% a level of Hexcraft), in Shadow, through MDEF, and no boss
  resists it (it is no hold). Poison Throw (a short cast) adds 1–2 stacks; Curse Circle (6 s, 3
  paces) a stack a second, and its monsters walk 30% slower and take 2% a level more from everything
  (`curseT` in `mobs.js`); Poison Aura a stack a second round the hero and **Weakened** (their blows
  softer, `weakT`); the Voodoo Doll binds one monster (Blight to 8, harder, and every Poison Throw
  pins it too). Toxic Blade: a dagger's blows add stacks; Soul Siphon: a Blighted death gives SP
  back and its stacks leap on. Trial: 20 Goblins, 15 Fire Wisps, 25 Dune Worms.

## Skill points

- Points go into **any tree the hero earned**, active job or not (`trainTrees`, the owner's call): a
  Blader who also earned the Sorcerer raises Sorcerer skills without switching at a Keeper, and a
  Wizard who walked the Blader's path can still raise Blader skills. Switching first jobs at a Keeper
  still changes the job worn (its name, look and job bonus stats). For a one-path second job (BladeMaster, Wizard,
  Windrunner) another first job's tree can never pass the path's own: a Wizard's Blader points stay
  at or under its Sorcerer points (`learnBlock`).
- Skill points earned: 9 from the Trainee, plus the first-job level (Job 1 counts: a Job 50 Blader
  has 50), plus the second-job level once in a second job (the owner's call; the Trainee's stay 9). Every point spent in any tree counts against that pool.
- Everything learnt in any earned tree stays usable whatever the current job:
  - **passives** always apply;
  - **actives** need the right weapon in hand (`weapon` on the skill in `skills.js`).

### Skills that need a weapon

| Needs a sword | Needs a bow | Needs no weapon |
|---|---|---|
| Cleave, Heavy Strike, Ground Slash (Blader) | Double Shot, Arrow Rain (Archer) | Ember Bolt, Frost Shard, Arc Lightning, Flame Ring, Rune Ward, Blink (Sorcerer) |
| Twin Fang, Piercing Edge, Final Blade, Blade Dance (BladeMaster) | Hurricane Volley, Cyclone Arrow (Windrunner) | Stone Spike, Earthquake, Meteor Storm, Storm Gust, Thunderstorm (Wizard) |
| Elemental Edge, Elemental Blade, Elemental Nova (Magic Knight) | Lunar Multishot, Crescent Arrow (Moon Ranger) | War Cry, Stand Firm (Blader); Focus, Hunter's Mark, Leap Back (Archer); Tailwind, Gale Step (Windrunner) |
| | | Starfall, Moonveil (Moon Ranger), Stone Aegis (Magic Knight), the Beastmaster's summons and Pack Frenzy; Mend, Thrust, Guard, Rest (Trainee) |

Needs a **dagger**: Venom Strike (Assassin), Dual Rend, Thousand Cuts (Phantom). Needs no weapon:
Venom Cloud, Shadow Step, Vanish, Pilfer (Assassin), Phantom Double, Mirage Step (Phantom).
Needs a **sword**: Shadow Slash, Umbral Step, Eclipse, Shadow Bloom (Shadowblade). Needs a **bow**:
Killing Shot (Hunter); its traps need no weapon. The Voodoo's skills need none (a vial, a curse, a doll).

Bare hands are no sword: with no weapon a hero fights hand to hand and has no blade skills, and an
Archer or Windrunner with no bow fights hand to hand too. Starfall needs no bow and still falls from
bow range.

- Gear follows **the job worn** (`wearJobs`): a Blader holds swords, a Sorcerer staves, an Archer
  bows, anyone daggers; a second job, those of the first jobs it stands on (a Magic Knight swords and staves, a
  Beastmaster swords and bows). Switching jobs at a Keeper puts away what the new job can't use
  (`dropUnwearable`), e.g. a Blader's sword when switching to Archer (the owner's call).

## Second jobs: who may take which trial

- A second-job trial opens from **Job Level 40** of the first job (first jobs go to 50).
- **Magic Knight:** both first jobs earned, and **at least 20 skill points spent in each**
  first-job tree (Blader and Sorcerer). The Shadowblade (Blader + Assassin), the Hunter (Archer +
  Assassin) and the Voodoo (Sorcerer + Assassin) follow the same rule.
- **Moon Ranger:** the Sorcerer and the Archer earned, and **at least 20 skill points spent in
  each** of their trees. **Beastmaster:** the same with the Blader and the Archer. The two-path rule (`secondJobOpen`) takes the pair from the job's `from`,
  so the Magic Knight and the Moon Ranger follow the same rule.
- **BladeMaster / Wizard / Windrunner / Phantom (one path):** for a hero who earned only one first job, the matching
  second job. For a hero who earned several, only the second job of the first job with the **most
  points spent** of all those walked. A tie opens each tied one.
- The 20/20 rule opens only the Magic Knight. It does not open both BladeMaster and Wizard.
- The current job does not matter; only the points do.
- **Only one second job can be taken.** Once a step of one second-job trial is accepted, the other
  trials close.
- **A second job's own skills** (`secondJobBlock` in `skills.js`) can only be raised while the
  job's opening rule still holds (the Magic Knight's 20 Blader and 20 Sorcerer points, the Moon
  Ranger's and the Beastmaster's pairs, the most points in the path for BladeMaster, Wizard and
  Windrunner) **and every Trainee and first-job skill point has been spent** in those trees.
- **Two paths, 20 each first:** for the Magic Knight, Moon Ranger and Beastmaster, once one path's
  tree has 20 points it takes no more until the other path's tree has 20 too, and a third first job
  they walked (a Magic Knight's Archer tree) takes no points until both have 20 (`learnBlock`).
- **Retraining a second job** (Liv, Ingrid, Sven: Reset my job skills) unlearns the second job's
  skills and every first-job tree it trains (the Trainee's stay). The rule above then makes the hero rebuild the first jobs
  before the second job's skills open again, so a reset never dodges it.
- **Quitting a trial** (Quit quest in the Quest View) before it is finished starts that trial over
  from its first step and lifts the choice. The hero may then pick any second-job trial they
  qualify for, again, by going to its quest giver.

### Examples (Job 50, points spent as Blader / as Sorcerer)

| Points | Trials open |
|---|---|
| 35 / 15 | BladeMaster |
| 30 / 20 | BladeMaster, Magic Knight |
| 25 / 25 | BladeMaster, Wizard, Magic Knight |
| 20 / 5 | BladeMaster |
| 5 / 20 | Wizard |
| any, below Job 40 | none |

## Second-job skills

- **Three or four active skills per second job** (the owner's rule). Windrunner: Tailwind, Gale
  Step, Hurricane Volley, Cyclone Arrow. Moon Ranger: Lunar Multishot, Starfall, Crescent Arrow,
  Moonveil. Beastmaster: Summon Bear, Summon Wolves, Summon Hawk, Pack Frenzy. Phantom: Dual Rend,
  Phantom Double, Mirage Step, Thousand Cuts. Shadowblade: Shadow Slash, Umbral Step, Eclipse,
  Shadow Bloom. Hunter: Bear Trap, Shock Trap, Blast Trap, Killing Shot. Voodoo: Poison Throw, Curse
  Circle, Poison Aura, Voodoo Doll.

## The Beastmaster and its beasts (the owner's rules)

- Uses **swords and bows** (it wears Blader and Archer gear and keeps their skills); its look
  follows the weapon in hand (cleaver or horned bow).
- Its own tree holds **only beast skills**: three summons, Pack Frenzy, and passives for the beasts.
- **All three beasts can be out together** (Bear, two Wolves, Hawk). **The hero's stats feed
  theirs** (`beastStats` in `main.js`): the Bear from END and Max HP (HP, DEF), the Wolves from FNS
  (ATK, HIT), the Hawk from QKN (attack speed, FLEE, ATK). A summon's level sets the share, 40% at
  Lv 1 to 80% at Lv 5, plus 2% a level of Beast Bond. Raising a stat updates the beasts at once.
- Companions (`src/allies.js`): they follow, take the hero's target or the nearest monster coming
  for the hero, and fight. Monsters fight back: one a beast bites may turn on it (35%), and the
  Bear's roar (every 6 s) turns the monsters round it on it. A monster's AI aims at one foe
  (`Mob.update(dt, foe)`): the hero, or the beast in `m.foe`. Beasts don't block tiles, follow
  through portals, vanish when the hero faints, and a fallen one can be called again after 20 s.
- Damage aimed: the hero's own hits plus the pack about the other bow second jobs' (Base 60, a Lv 55
  boss: the pack about 490 a second, the hero's Double Shot on top while SP lasts). BladeMaster: Twin Fang,
  Piercing Edge, Final Blade, Blade Dance. Magic Knight: Elemental Edge, Elemental Blade,
  Elemental Nova, Stone Aegis. Wizard: Stone Spike, Earthquake, Meteor Storm, Storm Gust,
  Thunderstorm (its area spells were asked for by name). Add passives rather than more actives.
- **Multi-hit, Ragnarok style:** the Wizard's area spells strike again and again over a few seconds
  (Storm Gust, Lord of Vermillion), and so do Piercing Edge, Final Blade, Elemental Edge and
  Elemental Nova. `hits`/`every` on the skill, `power` per hit.
- **Status effects** (freeze, paralyze, stun, burn) come with area skills and by element. Bosses
  resist: a third of the chance for half as long, never immune.

## Damage balance between jobs

Checked with the fight simulator (a neutral Lv 55 boss and a pack of six Lv 38 monsters, Base 60 and
70). Skill numbers live on each skill in `skills.js` (`power`, and `mpower` for the Magic Knight's
MATK part), used by both the damage and the skill text.

- **Second jobs are much stronger than first jobs:** about 2–4x their own first job.
- **First jobs are close to each other:** a Blader does about 0.8–0.9x a Sorcerer's single-target
  damage, clears packs as fast, and takes about as long on the Kobold and Goblin Kings.
- **BladeMaster vs Wizard: do not even them out.** The BladeMaster is not elemental: its damage is
  the same on every monster, so it keeps the higher steady single-target damage (about 1.4x the
  Wizard's on a neutral monster). The Wizard makes up the gap with elements: on a monster weak to
  its element it clearly out-damages the BladeMaster (about 1.4x, helped by Elemental Attunement's
  extra damage on a weakness), and on one that resists it, it falls far behind.
  It is also the best at packs.
- **Windrunner:** about 2.9x the Archer on one target (Base 60, a Lv 55 neutral boss, SP counted):
  its strength is quick steady shots (Windborne, Gale Rhythm, Tailwind; ASPD is capped at
  Ragnarok's 190) and moving to a better spot, not a burst. **Walking haste only in bursts** (the
  owner's call): Tailwind's first 4 s (30%) and 2 s after Gale Step (24–40%); only the strongest
  counts. Nothing else hastes the walk.
- **Moon Ranger:** arrows of ATK and MATK together (`power` + `mpower`, like the Magic Knight's
  sword). About 1.05x the Windrunner on one target by day and 1.2x at night (Moonlit Hunter), the
  best of the bow jobs on packs (Lunar Multishot, Starfall). "Night" is `dayNight.isNight`
  (`night > 0.6`), the same test as the night monsters.
- **Phantom:** 1.2–1.4x the BladeMaster on one target (the owner's call: higher than the BladeMaster,
  being much squishier): Dual Rend, both hands on every blow, Double Attack, and its illusions, which
  also draw blows away. The Assassin likewise out-damages the Blader (about 1.4x).
- **Magic Knight:** between the two on one target, close to the BladeMaster on packs, with the most
  HP and its Stone Aegis barrier.
- **The Assassin's crosses** (`node build-tools/second-sim.mjs`, a rotation model: Base 80, Job 30,
  a neutral Lv 55 boss of 300,000 HP): the **Shadowblade** about 0.95x the BladeMaster on a lone boss
  (its hiding loop needs kills; in a field of monsters, Night Stalker's Ambushes carry it past), the
  biggest single blows in Aria; the **Hunter** about 0.9x the Windrunner on one target, and the best
  at holding a pack; the **Voodoo** about 1.1x the Wizard over a long fight, far behind it on packs
  and in the first seconds.

## Trials

- Each trial is a **three-step series**. Each step accepts itself as soon as the step before is
  handed in. In a second-job trial, a hunt on the way hands itself in where it is finished, so
  only the last step goes back to the trainer. Job quests show in **green**.
- **No reward for the steps on the way:** only completing the whole series pays, and the last step
  pays the total of all its steps (`rewardOf` in `quests.js`).
- First-job trials are for a Trainee of Base ~10 and need one trip to the easy field beside the
  trainer: a hunt (Slimes and Sprouts, or Blue Slimes), a step made from what it dropped (proof,
  or the Sorcerer's brew), and the trainer's questions (`kind: 'quiz'`). A wrong answer only gets
  a hint; the question can be tried again. Second-job trials are harder: Base 40–55 monsters, the
  third step a big hunt of a mini-boss's kin (mini-bosses are half as hard as an MVP: no trial or
  quest needs one).
- Trainers:
  - Captain Ulfr (Blader, BladeMaster), Steinborg.
  - Archmage Vigdis (Sorcerer, Wizard), Galdrheim.
  - Hrafn the Stargazer (Moon Ranger), Galdrheim: 20 Dark Wisps, 10 Fire Wisps, 25 Dark Mushrooms.
  - Huntmaster Sigrid (Archer, Windrunner), Veidheim.
  - Bjarki the Beastmaster (Beastmaster), Veidheim: 15 Wolves, 10 Bears, 12 more Bears. The Windrunner's trial: 20 Wolves, 10 Snakes,
    25 more Wolves (all in Barley Field).
  - Sir Eirik the Runeblade (Magic Knight), Steinborg.
  - Master Kol (Assassin, Phantom), Rytingborg.
  - Rurik the Shadowblade (Shadowblade), Steinborg, beside Sir Eirik.
  - Greta the Trapper (Hunter), Veidheim, by the east wall.
  - Mother Hulda (Voodoo), Galdrheim, past the Stargazer.
- Taking a second job:
  - Job Level goes back to 1, and the first-job level is kept for its points (`firstLv`).
  - The look: second jobs wear the first job's outfit recoloured, with an aura. The Magic Knight
    has its own sprite.
