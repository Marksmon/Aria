# Balance: the fight simulator's numbers

Made with `node build-tools/sim.mjs` (and `node build-tools/sim.mjs <monster> <Base Level>` for one
fight in detail). The simulator uses the game's own rules (`src/rules.js`), monster data
(`src/mobs.js`) and skills (`src/skills.js`), and a **reference hero** for each Base Level:

- **Blader:** POW 45%, END 25%, FNS 15%, QKN 15% of the stat points; Cleave 3, Heavy Strike 10,
  Blade Discipline, Iron Hide... Below Base 20: Stone Sword, Leaf Tunic and Cap. From 20: +5 Iron
  Sword, Chain Mail, Round Shield, Wool Cape, Leather Boots. From 35: the sword at +6 and two
  pieces at +4.
- **Sorcerer:** KNL 50%, FNS 25%, END 20%, QKN 5%; Ember Bolt 5, Arc Lightning 5, Ember Bolt 10,
  Mana Well... It casts whichever bolt hits the monster hardest. Wooden Staff, then Rune Staff and
  a Robe.

The hero stands and fights: a skill when there is SP, a normal attack otherwise, a potion below 45%
HP. Bosses stomp (half the stomps are stepped out of) and call guards, which the hero cuts down
first. A Sorcerer kites a boss (half its swings miss) and drinks Blue Potions. Each fight runs 200
times; the table shows the median. Rows below Base 12 for the Sorcerer are not meaningful (a hero
is still a Trainee there).

## Targets

- A same-level hero beats a field monster at least 85% of the time with at least 25% HP left.
- A mini-boss falls in about 1.5 to 3 minutes to a hero at its hinted level with 20 Orange Potions.
- The Sorcerer kills faster than the Blader but is far more fragile. The plan aimed for kill times
  within 25% of each other; cutting spell damage made the Sorcerer lose fights it cannot escape, so
  only the Blader was raised (Heavy Strike), and the Sorcerer still kills about 1.8x faster.

## What changed (October 2026 review)

- Field monsters: Crab ATK -15%; Wisp ATK -25% and QKN 24 to 20; Mushroom ATK about -35%; Red Sprout
  HP and ATK -20%; Sea Bloop ATK -10%; Blue Crab HP -20%. The agile late monsters dodged three blows
  in four: Kobold Assassin QKN 58 to 50, Dark Wisp 60 to 47, Fire Beetle 34 to 31, Goblin Assassin
  75 to 60, Fire Wisp 70 to 53.
- Mini-bosses: Giant Sprout 9,000 to 7,200 HP and ATK 80-108 to 44-59; King Crab 11,000 to 8,900 HP,
  ATK 92-120 to 41-54; Giant Mushroom 14,000 to 11,200 HP, ATK 122-158 to 55-71; Giant Beetle
  16,000 to 10,800 HP, ATK 125-162 to 56-73.
- A boss's guards are lesser servants: half their kind's HP and 60% of its ATK (`GUARD` in
  `src/mobs.js`). Two full-strength guards were what made every mini-boss unwinnable.
- Heavy Strike 145-280% to 167-320%. Battle Rhythm: 3 SP every 3rd hit (was 1 SP every 5th).
- Early loot sells for more (Bloop Gel 3 to 7 perz, Seed 4 to 8, Shell 12 to 25...).
- Story EXP for Chapters 3-4 cut (the last delivery gave 160,000 EXP), so a hero who beat the Giant
  Sprout at about Base 28 reaches Chapter 5 at about 32 instead of 38.
- Liv the Guide (Steinborg) rethinks your training: one free stat reset and one free first-job skill
  reset, then 20,000 perz each.

## After merging main's skill and boss rework

Main's newer commits reworked skills (multi-hit spells, statuses, Blade Dance, one Elemental Edge),
raised the Blader's skills, trimmed the Sorcerer's spells and gave bosses telegraphed moves. The
simulator now models multi-hit spells, the Sorcerer's opening cast from 5 paces, and boss moves
against a kiting Sorcerer (half stepped out of). The bosses stay inside the targets for both jobs.
The trimmed spells leave the Sorcerer short against some Water monsters at Base 22-34 (Sea Bloop,
Blue Crab, Dark Mushroom); that is left as main's balance decision. Rows below Base 12 are a
Trainee, not a Sorcerer.

## Every monster at its own level (bosses with 20 Orange Potions; the Lantern Wisp without any)

| Monster | Lv | Blader at its level | Sorcerer at its level |
|---|---|---|---|
| Bloop | 1 | 100% win · 1 s · 100% HP left | 100% win · 1 s · 100% HP left |
| Sprout | 3 | 100% win · 2 s · 95% HP left | 100% win · 4 s · 93% HP left |
| Little Bloop | 4 | 100% win · 1 s · 100% HP left | 100% win · 1 s · 100% HP left |
| Blue Bloop | 6 | 100% win · 4 s · 80% HP left | 99% win · 12 s · 42% HP left |
| Crab | 9 | 89% win · 12 s · 24% HP left | 0% win · 12 s · boss at 58% |
| Wisp | 11 | 88% win · 13 s · 23% HP left | 0% win · 12 s · boss at 58% |
| Mushroom | 14 | 96% win · 22 s · 25% HP left | 100% win · 10 s · 55% HP left |
| Lantern Wisp | 16 | 1% win · 18 s · 0% HP left | 0% win · 12 s · boss at 38% |
| Red Sprout | 18 | 98% win · 5 s · 73% HP left | 100% win · 6 s · 52% HP left |
| Sea Bloop | 22 | 100% win · 3 s · 80% HP left | 62% win · 10 s · 6% HP left |
| Giant Sprout | 25 | 100% win · 89 s · 58% HP left · 15 pots | 91% win · 44 s · 66% HP left · 6 pots |
| Blue Crab | 26 | 100% win · 3 s · 79% HP left | 44% win · 8 s · 0% HP left |
| Kobold | 28 | 100% win · 4 s · 76% HP left | 100% win · 4 s · 77% HP left |
| Beetle | 30 | 100% win · 5 s · 67% HP left | 100% win · 4 s · 77% HP left |
| Kobold Archer | 30 | 100% win · 3 s · 89% HP left | 100% win · 2 s · 100% HP left |
| King Crab | 32 | 100% win · 94 s · 53% HP left · 15 pots | 97% win · 84 s · 60% HP left · 13 pots |
| Kobold Assassin | 33 | 99% win · 4 s · 68% HP left | 100% win · 2 s · 78% HP left |
| Dark Mushroom | 34 | 100% win · 5 s · 69% HP left | 76% win · 9 s · 11% HP left |
| Dark Wisp | 38 | 99% win · 6 s · 67% HP left | 99% win · 7 s · 21% HP left |
| Goblin | 38 | 100% win · 5 s · 74% HP left | 100% win · 7 s · 25% HP left |
| Giant Mushroom | 40 | 100% win · 123 s · 49% HP left · 18 pots | 100% win · 82 s · 55% HP left · 15 pots |
| Goblin Archer | 41 | 100% win · 4 s · 88% HP left | 100% win · 5 s · 69% HP left |
| Fire Beetle | 42 | 100% win · 7 s · 69% HP left | 100% win · 7 s · 22% HP left |
| Goblin Assassin | 44 | 97% win · 6 s · 66% HP left | 100% win · 4 s · 62% HP left |
| Fire Wisp | 45 | 98% win · 7 s · 66% HP left | 100% win · 6 s · 27% HP left |
| Giant Beetle | 48 | 99% win · 111 s · 48% HP left · 14 pots | 100% win · 42 s · 53% HP left · 8 pots |

## Mini-bosses at their hinted level, 20 Orange Potions

| Boss | Blader | Sorcerer |
|---|---|---|
| Giant Sprout at Base 28 | 100% win · 70 s · 57% HP left · 10 pots | 100% win · 36 s · 62% HP left · 5 pots |
| King Crab at Base 34 | 100% win · 83 s · 52% HP left · 10 pots | 99% win · 82 s · 59% HP left · 12 pots |
| Giant Mushroom at Base 43 | 100% win · 84 s · 50% HP left · 8 pots | 100% win · 73 s · 54% HP left · 12 pots |
| Giant Beetle at Base 50 | 100% win · 84 s · 49% HP left · 5 pots | 100% win · 41 s · 51% HP left · 7 pots |
| Lantern Wisp at Base 16 | 100% win · 33 s · 65% HP left · 3 pots | 100% win · 22 s · 88% HP left · 3 pots |

## Raids: whole runs (`node build-tools/raid-sim.mjs`)

Every monster of a wave attacks at once, HP and SP carry over with natural regen, half of each comes
back after a wave and all of it before the boss. Each difficulty is checked against the hero it is
made for: Tutorial, Easy and Normal a first job, Hard and Hell a second job (2.5x and 3x a first
job's damage, its area skills hitting up to 3 more of a wave). A first job can't clear Hard or Hell.
Runs end well inside the 10 minutes; the tighter time comes in a real game, from walking.

Bloop Island: 120 runs each, the hero at the advised level

| Difficulty | Hero | Blader | Sorcerer |
|---|---|---|---|
| Tutorial | Base 28, first job | 0 pots: 100% (1.5 min) | 0 pots: 100% (2.0 min) |
| Easy | Base 30, first job | 0 pots: 100% (1.9 min) | 0 pots: 100% (2.5 min) |
| Normal | Base 40, first job, 20 Orange | 20 pots: 100% (5.1 min, 6 used) · 10 pots: 100% (5.0 min, 6 used) · 0 pots: 43% (4.8 min) | 20 pots: 100% (2.6 min, 19 used) · 10 pots: 0% · 0 pots: 0% |
| Hard | Base 50, second job, 30 White | 30 pots: 100% (2.2 min, 8 used) · 15 pots: 100% (2.2 min, 8 used) · 0 pots: 54% (2.1 min) | 30 pots: 100% (1.6 min, 24 used) · 15 pots: 7% (1.6 min, 15 used) · 0 pots: 0% |
| Hell | Base 60, second job, 50 White | 50 pots: 100% (3.1 min, 26 used) · 25 pots: 94% (3.0 min, 25 used) · 0 pots: 0% | 50 pots: 100% (1.7 min, 45 used) · 25 pots: 0% · 0 pots: 0% |
