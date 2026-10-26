# Jobs, skill points and second jobs: the rules

These are design rules agreed with the game's owner. Keep them when adding jobs, skills or
quests. Code: `src/progress.js` (jobs, levels, points), `src/skills.js` (trees, `learnBlock`,
`secondJobOpen`, weapon needs), `src/quests.js` (trials, `Quests.status`), `src/menus.js`
(trainer and Keeper dialogue).

## Jobs

| Tier | Jobs | Job Level |
|---|---|---|
| 0 | Trainee (`novice`) | 1–10 |
| 1 | Blader (`swordman`), Sorcerer (`mage`), Archer (`archer`) | 1–50, one level shared by all |
| 2 | BladeMaster (`blademaster`, from Blader), Wizard (`wizard`, from Sorcerer), Magic Knight (`magicknight`, from Blader and Sorcerer), Windrunner (`windrunner`, from Archer), Moon Ranger (`moonranger`, from Sorcerer and Archer), Beastmaster (`beastmaster`, from Blader and Archer) | 1–50, starts again at 1 |

## First jobs: walking several paths

- A Trainee takes one first job through its trial: Trainee Job 10 and Basic Training 9.
- A first-job hero may also take **another** first job's trial (a Blader the Sorcerer's or the
  Archer's, and so on). They then hold each one earned.
- The first jobs share **one Job Level and one pool of skill points**. Example: at Job 40 there
  are 39 first-job points (plus the Trainee's 9), which may be split, e.g. 20 as a Blader and 19
  as a Sorcerer.
- Switching between first jobs is done at a **Keeper** (the Keepers' ledger must be signed).
  Trainers do not switch jobs.

## The Archer

- Trained by **Huntmaster Sigrid** in Veidheim. Trial: 5 Yellow Bloops in Willow Marsh, wax a
  bowstring with 5 Bloop Gel (a quiz with items, like the Sorcerer's brew), her three questions.
  A new Archer is handed a Hunting Bow and Wooden Arrows, worn at once.
- **Bows** (`kind: 'bow'`) take both hands (no shield). A bow's normal attack and the bow skills
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

## Skill points

- Points can only be put into the **active job's** trees: the current job and the jobs before it.
  For example, a Blader's points go to the Blader and Trainee trees; a Magic Knight's go to the
  Magic Knight, Blader, Sorcerer and Trainee trees. To train the other first job, switch to it at
  a Keeper first.
- Skill points earned: 9 from the Trainee, plus (first-job level − 1), plus (second-job level − 1)
  once in a second job. Every point spent in any tree counts against that pool.
- Everything learnt in any earned tree stays usable whatever the current job:
  - **passives** always apply;
  - **actives** need the right weapon in hand (`weapon` on the skill in `skills.js`).

### Skills that need a weapon

| Needs a sword (or bare hands) | Needs a staff | Needs a bow |
|---|---|---|
| Cleave, Heavy Strike, Ground Slash (Blader) | Ember Bolt, Frost Shard, Arc Lightning, Flame Ring (Sorcerer) | Double Shot, Arrow Rain (Archer) |
| Twin Fang, Piercing Edge, Final Blade, Blade Dance (BladeMaster) | Stone Spike, Earthquake, Meteor Storm, Storm Gust, Thunderstorm (Wizard) | |
| Elemental Edge, Elemental Blade, Elemental Nova (Magic Knight) | | |

No weapon needed: Mend, Thrust, Guard, Rest, War Cry, Stand Firm, Rune Ward, Blink, Stone Aegis,
Focus, Hunter's Mark, Leap Back.

- Gear follows every job earned, so a Blader who passed the Sorcerer's trial may hold a staff,
  and one who passed the Archer's a bow.

## Second jobs: who may take which trial

- A second-job trial opens from **Job Level 40** of the first job (first jobs go to 50).
- **Magic Knight:** both first jobs earned, and **at least 20 skill points spent in each**
  first-job tree (Blader and Sorcerer).
- **Moon Ranger:** the Sorcerer and the Archer earned, and **at least 20 skill points spent in
  each** of their trees. **Beastmaster:** the same with the Blader and the Archer. The two-path rule (`secondJobOpen`) takes the pair from the job's `from`,
  so the Magic Knight and the Moon Ranger follow the same rule.
- **BladeMaster / Wizard / Windrunner (one path):** for a hero who earned only one first job, the matching
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
- **Retraining a second job** (Liv, Ingrid, Sven: Reset my job skills) unlearns the first-job and
  second-job skills (the Trainee's stay). The rule above then makes the hero rebuild the first jobs
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
  Moonveil. Beastmaster: Summon Bear, Summon Wolves, Summon Hawk, Pack Frenzy.

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
- **Magic Knight:** between the two on one target, close to the BladeMaster on packs, with the most
  HP and its Stone Aegis barrier.

## Trials

- Each trial is a **three-step series**. Each step accepts itself as soon as the step before is
  handed in. In a second-job trial, a hunt on the way hands itself in where it is finished, so
  only the last step goes back to the trainer. Job quests show in **green**.
- **No reward for the steps on the way:** only completing the whole series pays, and the last step
  pays the total of all its steps (`rewardOf` in `quests.js`).
- First-job trials are for a Trainee of Base ~10 and need one trip to the easy field beside the
  trainer: a hunt (Slimes and Sprouts, or Blue Slimes), a step made from what it dropped (proof,
  or the Sorcerer's brew), and the trainer's questions (`kind: 'quiz'`). A wrong answer only gets
  a hint; the question can be tried again. Second-job trials are harder: Base 40–50 monsters and
  a mini-boss.
- Trainers:
  - Captain Ulfr (Blader, BladeMaster), Steinborg.
  - Archmage Vigdis (Sorcerer, Wizard), Galdrheim.
  - Hrafn the Stargazer (Moon Ranger), Galdrheim: 20 Dark Wisps, 10 Fire Wisps, the Giant Mushroom.
  - Huntmaster Sigrid (Archer, Windrunner), Veidheim.
  - Bjarki the Beastmaster (Beastmaster), Veidheim: 15 Wolves, 10 Bears, the Great Bear. The Windrunner's trial: 20 Wolves, 10 Snakes,
    the Alpha Wolf (all in Barley Field).
  - Sir Eirik the Runeblade (Magic Knight), Steinborg.
- Taking a second job:
  - Job Level goes back to 1, and the first-job level is kept for its points (`firstLv`).
  - The look: second jobs wear the first job's outfit recoloured, with an aura. The Magic Knight
    has its own sprite.
