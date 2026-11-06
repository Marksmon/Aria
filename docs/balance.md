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
- **Archer:** FNS 45%, QKN 20%, END 25%, POW 10%; Double Shot 5, Keen Eye 5, Double Shot 10, Keen
  Eye 10, Focus, Long Sight, Arrow Rain... Hunting Bow and Wooden Arrows, then a +5 Composite Bow,
  Iron Arrows, Chain Mail, Wool Cape and Leather Boots (and a shield if they like: a bow no longer takes both hands). It
  shoots twice as a monster closes in, steps back so 30% of a monster's swings miss (half of a
  boss's), and uses Arrow Rain on a boss's guards.

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

The Archer column came with the Archer: close to the Blader, a little safer against field monsters
(it shoots first and steps back) and a little weaker against the Great Bear and its Bears.
The Assassin column came with the Assassin (a Knife, then a +5 and +6 Sand Kris; Venom Strike first,
then Venom Cloud, Double Attack, Dagger Mastery and Improve Dodge). **The Assassin out-damages the
Blader** (the owner's call: it has far fewer HP and less DEF): over every field monster at its level it
kills about 1.4x as fast (geometric mean; 1.1–2.6x, the Lv 24 Treant about even against the Blader's
+5 sword). Venom Cloud's bites go through DEF and keep biting while the hero fights on; at low skill
levels Venom Strike pays more for its SP, so the sim throws a cloud only where it pays.

| Monster | Lv | Blader at its level | Sorcerer at its level | Archer at its level | Assassin at its level |
|---|---|---|---|---|---|
| Bloop | 1 | 100% win · 1 s · 100% HP left | 100% win · 1 s · 100% HP left | 100% win · 0 s · 100% HP left | 100% win · 1 s · 100% HP left |
| Little Bloop | 2 | 100% win · 1 s · 100% HP left | 100% win · 1 s · 100% HP left | 100% win · 0 s · 100% HP left | 100% win · 1 s · 100% HP left |
| Gel Thief | 3 | 100% win · 4 s · 95% HP left | 100% win · 9 s · 82% HP left | 100% win · 1 s · 100% HP left | 100% win · 3 s · 93% HP left |
| Sprout | 3 | 100% win · 2 s · 100% HP left | 100% win · 4 s · 93% HP left | 100% win · 0 s · 100% HP left | 100% win · 2 s · 93% HP left |
| Blue Bloop | 4 | 100% win · 3 s · 94% HP left | 100% win · 8 s · 77% HP left | 100% win · 0 s · 100% HP left | 100% win · 3 s · 94% HP left |
| Crab | 6 | 100% win · 6 s · 81% HP left | 99% win · 15 s · 40% HP left | 100% win · 2 s · 100% HP left | 100% win · 5 s · 82% HP left |
| Yellow Bloop | 7 | 100% win · 6 s · 90% HP left | 100% win · 14 s · 62% HP left | 100% win · 2 s · 100% HP left | 100% win · 5 s · 89% HP left |
| Willow | 8 | 100% win · 7 s · 90% HP left | 100% win · 18 s · 57% HP left | 100% win · 2 s · 100% HP left | 100% win · 6 s · 93% HP left |
| Red Bloop | 9 | 100% win · 9 s · 89% HP left | 100% win · 23 s · 33% HP left | 100% win · 3 s · 98% HP left | 100% win · 7 s · 85% HP left |
| Wisp | 11 | 83% win · 13 s · 21% HP left | 0% win · 12 s · boss at 57% | 100% win · 7 s · 79% HP left | 89% win · 11 s · 26% HP left |
| Giant Ant | 12 | 100% win · 12 s · 59% HP left | 100% win · 9 s · 56% HP left | 100% win · 5 s · 93% HP left | 100% win · 6 s · 81% HP left |
| Mushroom | 14 | 98% win · 22 s · 25% HP left | 100% win · 10 s · 56% HP left | 100% win · 9 s · 83% HP left | 100% win · 9 s · 69% HP left |
| Lantern Wisp | 16 | 0% win · 18 s · boss at 33% | 0% win · 15 s · boss at 29% | 79% win · 17 s · 18% HP left | 36% win · 15 s · 0% HP left |
| Red Sprout | 18 | 96% win · 5 s · 73% HP left | 100% win · 8 s · 53% HP left | 100% win · 4 s · 88% HP left | 100% win · 2 s · 88% HP left |
| Sea Bloop | 22 | 100% win · 3 s · 80% HP left | 94% win · 11 s · 15% HP left | 100% win · 3 s · 100% HP left | 100% win · 2 s · 88% HP left |
| Treant | 24 | 100% win · 5 s · 77% HP left | 100% win · 10 s · 37% HP left | 100% win · 8 s · 71% HP left | 100% win · 6 s · 65% HP left |
| Blue Crab | 26 | 100% win · 3 s · 79% HP left | 99% win · 10 s · 9% HP left | 100% win · 2 s · 100% HP left | 100% win · 2 s · 86% HP left |
| Kobold | 28 | 100% win · 4 s · 76% HP left | 100% win · 5 s · 66% HP left | 100% win · 3 s · 85% HP left | 99% win · 4 s · 74% HP left |
| Beetle | 30 | 100% win · 5 s · 67% HP left | 100% win · 5 s · 66% HP left | 100% win · 4 s · 83% HP left | 100% win · 4 s · 74% HP left |
| Kobold Archer | 30 | 100% win · 3 s · 90% HP left | 100% win · 4 s · 87% HP left | 100% win · 2 s · 100% HP left | 100% win · 2 s · 89% HP left |
| Kobold Assassin | 33 | 95% win · 4 s · 66% HP left | 100% win · 4 s · 67% HP left | 100% win · 2 s · 100% HP left | 96% win · 3 s · 72% HP left |
| Dark Mushroom | 34 | 100% win · 5 s · 69% HP left | 100% win · 10 s · 18% HP left | 100% win · 4 s · 86% HP left | 99% win · 4 s · 75% HP left |
| Dark Wisp | 38 | 99% win · 5 s · 67% HP left | 100% win · 9 s · 26% HP left | 100% win · 3 s · 88% HP left | 98% win · 4 s · 70% HP left |
| Goblin | 38 | 100% win · 5 s · 75% HP left | 100% win · 9 s · 31% HP left | 100% win · 5 s · 86% HP left | 100% win · 4 s · 70% HP left |
| Goblin Archer | 41 | 100% win · 4 s · 88% HP left | 100% win · 6 s · 75% HP left | 100% win · 3 s · 90% HP left | 100% win · 3 s · 90% HP left |
| Fire Beetle | 42 | 100% win · 7 s · 69% HP left | 100% win · 9 s · 41% HP left | 100% win · 6 s · 75% HP left | 100% win · 5 s · 68% HP left |
| Goblin Assassin | 44 | 98% win · 6 s · 66% HP left | 100% win · 5 s · 59% HP left | 100% win · 3 s · 89% HP left | 98% win · 4 s · 70% HP left |
| Fire Wisp | 45 | 99% win · 7 s · 68% HP left | 100% win · 7 s · 40% HP left | 100% win · 4 s · 86% HP left | 98% win · 5 s · 63% HP left |
| Snake | 46 | 100% win · 6 s · 71% HP left | 100% win · 5 s · 71% HP left | 100% win · 4 s · 88% HP left | 100% win · 4 s · 69% HP left |
| Root Squirrel | 46 | 99% win · 8 s · 63% HP left | 100% win · 5 s · 64% HP left | 100% win · 5 s · 80% HP left | 99% win · 6 s · 66% HP left |
| Wolf | 48 | 100% win · 8 s · 59% HP left | 100% win · 5 s · 58% HP left | 100% win · 4 s · 87% HP left | 98% win · 6 s · 61% HP left |
| Bramble | 51 | 100% win · 7 s · 75% HP left | 100% win · 6 s · 73% HP left | 100% win · 7 s · 77% HP left | 100% win · 5 s · 81% HP left |
| Bear | 53 | 100% win · 10 s · 64% HP left | 100% win · 10 s · 34% HP left | 100% win · 12 s · 55% HP left | 100% win · 6 s · 72% HP left |
| Giant Sprout | 55 | 0% win · 99 s · boss at 94% · 20 pots | 0% win · 91 s · boss at 85% · 20 pots | 0% win · 84 s · boss at 95% · 20 pots | 0% win · 61 s · boss at 95% · 20 pots |
| Elder Willow | 55 | 0% win · 106 s · boss at 93% · 20 pots | 0% win · 98 s · boss at 87% · 20 pots | 0% win · 91 s · boss at 94% · 20 pots | 0% win · 66 s · boss at 95% · 20 pots |
| Cactus | 55 | 100% win · 8 s · 78% HP left | 100% win · 6 s · 76% HP left | 100% win · 8 s · 80% HP left | 100% win · 5 s · 78% HP left |
| Root Serpent | 55 | 100% win · 10 s · 60% HP left | 100% win · 5 s · 74% HP left | 100% win · 7 s · 70% HP left | 100% win · 7 s · 66% HP left |
| King Crab | 58 | 0% win · 112 s · boss at 92% · 20 pots | 0% win · 108 s · boss at 90% · 20 pots | 0% win · 104 s · boss at 94% · 20 pots | 0% win · 70 s · boss at 94% · 20 pots |
| Dune Worm | 58 | 100% win · 9 s · 65% HP left | 100% win · 6 s · 67% HP left | 100% win · 7 s · 70% HP left | 100% win · 7 s · 67% HP left |
| Moss Golem | 58 | 100% win · 11 s · 72% HP left | 100% win · 8 s · 65% HP left | 99% win · 21 s · 33% HP left | 100% win · 9 s · 78% HP left |
| Giant Mushroom | 60 | 0% win · 124 s · boss at 91% · 20 pots | 0% win · 106 s · boss at 89% · 20 pots | 0% win · 102 s · boss at 93% · 20 pots | 0% win · 72 s · boss at 93% · 20 pots |
| Cactus Lord | 60 | 0% win · 141 s · boss at 92% · 20 pots | 0% win · 132 s · boss at 76% · 20 pots | 0% win · 126 s · boss at 93% · 20 pots | 0% win · 87 s · boss at 94% · 20 pots |
| Dark Elf | 60 | 100% win · 10 s · 71% HP left | 100% win · 11 s · 30% HP left | 100% win · 6 s · 83% HP left | 100% win · 7 s · 70% HP left |
| Sand Scorpion | 61 | 100% win · 10 s · 67% HP left | 100% win · 5 s · 75% HP left | 100% win · 9 s · 65% HP left | 100% win · 7 s · 69% HP left |
| Giant Beetle | 62 | 0% win · 89 s · boss at 94% · 20 pots | 0% win · 84 s · boss at 87% · 20 pots | 0% win · 81 s · boss at 95% · 20 pots | 0% win · 56 s · boss at 95% · 20 pots |
| Soldier Ant | 62 | 100% win · 10 s · 68% HP left | 100% win · 5 s · 75% HP left | 100% win · 11 s · 52% HP left | 100% win · 6 s · 76% HP left |
| Great Stag | 63 | 94% win · 12 s · 50% HP left | 100% win · 8 s · 40% HP left | 100% win · 9 s · 61% HP left | 98% win · 9 s · 54% HP left |
| Alpha Wolf | 64 | 0% win · 77 s · boss at 94% · 20 pots | 0% win · 77 s · boss at 81% · 20 pots | 0% win · 76 s · boss at 94% · 20 pots | 0% win · 51 s · boss at 95% · 20 pots |
| Sand Runner | 64 | 92% win · 12 s · 45% HP left | 100% win · 8 s · 42% HP left | 100% win · 7 s · 69% HP left | 94% win · 9 s · 59% HP left |
| Rainbow Runner | 64 | 0% win · 119 s · boss at 96% · 20 pots | 0% win · 96 s · boss at 86% · 20 pots | 0% win · 94 s · boss at 94% · 20 pots | 0% win · 66 s · boss at 97% · 20 pots |
| Great Bear | 66 | 0% win · 91 s · boss at 93% · 20 pots | 0% win · 84 s · boss at 86% · 20 pots | 0% win · 83 s · boss at 95% · 20 pots | 0% win · 57 s · boss at 95% · 20 pots |
| Scarab | 66 | 100% win · 11 s · 64% HP left | 100% win · 6 s · 65% HP left | 83% win · 22 s · 17% HP left | 100% win · 8 s · 68% HP left |
| Dryad | 66 | 100% win · 8 s · 79% HP left | 100% win · 7 s · 65% HP left | 100% win · 6 s · 81% HP left | 100% win · 6 s · 77% HP left |
| Rot Beetle | 68 | 100% win · 9 s · 76% HP left | 100% win · 9 s · 48% HP left | 100% win · 10 s · 67% HP left | 100% win · 6 s · 77% HP left |
| Cobra | 71 | 98% win · 13 s · 52% HP left | 100% win · 5 s · 77% HP left | 100% win · 8 s · 66% HP left | 97% win · 8 s · 57% HP left |
| Root Warden | 72 | 100% win · 10 s · 72% HP left | 100% win · 6 s · 79% HP left | 100% win · 18 s · 42% HP left | 100% win · 7 s · 73% HP left |
| Ammit | 74 | 0% win · 284 s · boss at 77% · 20 pots | 0% win · 154 s · boss at 65% · 20 pots | 0% win · 170 s · boss at 83% · 20 pots | 0% win · 124 s · boss at 86% · 20 pots |
| Ratatoskr | 74 | 0% win · 144 s · boss at 95% · 20 pots | 0% win · 89 s · boss at 84% · 20 pots | 0% win · 90 s · boss at 90% · 20 pots | 0% win · 69 s · boss at 96% · 20 pots |
| Mummy | 75 | 100% win · 10 s · 72% HP left | 100% win · 11 s · 51% HP left | 100% win · 16 s · 51% HP left | 100% win · 7 s · 79% HP left |
| Thorn Drake | 75 | 100% win · 12 s · 68% HP left | 100% win · 8 s · 61% HP left | 100% win · 9 s · 71% HP left | 100% win · 8 s · 72% HP left |
| Lamia | 78 | 100% win · 9 s · 78% HP left | 100% win · 13 s · 42% HP left | 100% win · 8 s · 85% HP left | 100% win · 7 s · 81% HP left |
| Pharaoh's Servant | 80 | 100% win · 8 s · 83% HP left | 100% win · 13 s · 42% HP left | 100% win · 9 s · 84% HP left | 100% win · 6 s · 83% HP left |
| Sphinx Cub | 83 | 90% win · 17 s · 36% HP left | 100% win · 6 s · 61% HP left | 100% win · 10 s · 62% HP left | 80% win · 12 s · 37% HP left |
| Sand Elemental | 86 | 100% win · 10 s · 75% HP left | 100% win · 9 s · 53% HP left | 100% win · 12 s · 70% HP left | 100% win · 7 s · 77% HP left |
| Sarcophagus | 88 | 100% win · 13 s · 72% HP left | 100% win · 15 s · 40% HP left | 100% win · 25 s · 37% HP left | 100% win · 9 s · 77% HP left |
| Jackal Guardian | 92 | 100% win · 15 s · 67% HP left | 100% win · 10 s · 54% HP left | 100% win · 15 s · 58% HP left | 100% win · 9 s · 68% HP left |
| Falcon Sentinel | 97 | 100% win · 18 s · 67% HP left | 100% win · 10 s · 56% HP left | 100% win · 11 s · 73% HP left | 100% win · 9 s · 70% HP left |

The Sorcerer's column is with the November 2026 Rune Ward (the owner's call: a little help for the early
Sorcerer, spell damage unchanged): it needs nothing now, costs 8 SP and cuts 25% of the damage from its first
point (30% at Lv 10, was 2% a level), and the reference Sorcerer takes its first point right after Ember Bolt 5.
Before it, a same-level Sorcerer won only 67% against Sea Bloops, 37% against Blue Crabs and 80% against Dark
Mushrooms; now every field monster from Lv 12 is 85% or better. (A Frost Shard slow was tried too: Frost is
Water, so it barely touched the Water monsters behind those losses, and its points cost damage. Left out.)

## Mini-bosses at their old hinted levels, 20 Orange Potions (history)

From before the mini-bosses became second-job game (Lv 55-66, `picksFight` in `src/mobs.js`): the bosses
then were Lv 23-56 with a tenth of today's HP. Kept for the record; today's numbers are under
"Mini-bosses: half as hard as an MVP" below.

| Boss | Blader | Sorcerer |
|---|---|---|
| Giant Sprout at Base 28 | 100% win · 70 s · 57% HP left · 10 pots | 100% win · 36 s · 62% HP left · 5 pots |
| King Crab at Base 34 | 100% win · 83 s · 52% HP left · 10 pots | 99% win · 82 s · 59% HP left · 12 pots |
| Giant Mushroom at Base 43 | 100% win · 84 s · 50% HP left · 8 pots | 100% win · 73 s · 54% HP left · 12 pots |
| Giant Beetle at Base 50 | 100% win · 84 s · 49% HP left · 5 pots | 100% win · 41 s · 51% HP left · 7 pots |
| Alpha Wolf at Base 54 | 100% win · 72 s · 48% HP left · 4 pots | 100% win · 21 s · 51% HP left · 2 pots |
| Great Bear at Base 59 | 100% win · 84 s · 48% HP left · 4 pots | 100% win · 36 s · 50% HP left · 8 pots |
| Elder Willow at Base 26 | 100% win · 66 s · 57% HP left · 8 pots | 99% win · 47 s · 64% HP left · 6 pots |
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

## Veidheim and its lands

The gentle lands on the road to the village: Willow Marsh, by Veidheim, is a Trainee's field like
Moss Field and Fen Shore (the Archer's first trial is there): its Willow (Lv 8) and Yellow Bloop
(Lv 7, Wind; the raid rebuilds its own from the raid's level) fall to a Base 10 Trainee again and
again, for big Trainee Job EXP (tjob). The Treant (Lv 24) sits between the Giant Sprout and the
Blue Crab, and the Elder Willow (Lv 55 today; it was Lv 23) is a mini-boss like the Giant Sprout, game for a
second job.
The predators' lands (Snake 46, Wolf 48, Bear 53) sit on the same curve as the goblins and fire
beasts; the Sorcerer is shorter against the Bear, which is Neutral and hits hard. Their mini-bosses,
the Alpha Wolf (64) and the Great Bear (66), fit between the Giant Beetle and the MVPs; the Alpha's
pounce and dodging make it the harder of the two at its own level. The Ancient
Treant (Lv 62) is the strongest MVP: like the Goblin King, a first-job hero cannot finish it
(`node build-tools/sim.mjs ancientTreant 62`), a second job hitting 2-4x as hard can. Its guards
are Wolves and Snakes, not Treants and Bears, which would make it a wall.

## MVPs: the hardest fights in Aria

The owner's call: an MVP takes several minutes and a plan, and even a Lv 99 hero without good,
upgraded gear can't beat one. So no main story step needs a boss, and boss and MVP cards drop at 1%.

| MVP | HP | ATK | Its own skills (the plan) |
|---|---|---|---|
| Fire Giant (60) | 400,000 | 300-400 | Meteor Rain, burning ground: keep moving, fight from clear ground, Ice Arrows |
| Kobold King (50) | 600,000 | 330-430 | Tribe's Shield (80% less damage while a guard stands, guards every 30 s), Burrow: clear the guards first |
| Goblin King (55) | 600,000 | 276-360 | Mirror Image (90% less damage while a shadow stands), Frenzy: cut down the shadows |
| Ancient Treant (62) | 550,000 | 400-520 | Grasping Roots (held 2.5 s), Bark Armor (30% back): hold off while its bark is hard |

All four are enraged below half HP (`MVP_RAGE` in `src/mobs.js`: +25% damage, attacks 35% faster,
15% faster walk, a stomp every 4.5 s, moves sooner), call guards at 80/50/25% and a minute after the
last falls, and give up the chase only 22 paces off. They swing slowly for their ATK but with high
DEX (140-165); their stomp (now a red circle too), moves and burning ground can't be dodged with
FLEE and go through 75% of DEF (`MVP_MOVE`), so armor alone never makes a hero safe: stepping out of
the circles does. Mini-bosses are second-job game, half as hard as an MVP (see below).

Playtested in the browser with a Windrunner bot that steps out of red and orange circles, holds fire
during Bark Armor, cuts down guards and shadows first, drinks a White Potion below half HP and a
Blue one below 60 SP (300 of each in the bag):

| MVP | Lv 99, best gear (+10 Great Bow with the Goblin King card, +7 armor with MVP cards, the right arrows) | Lv 99, shop gear (Composite Bow, Iron Arrows, no cards or upgrades) | The owner's Base 72 (Goblin Bow, King Crab card) |
|---|---|---|---|
| Fire Giant | won, 3:33, 220 White Potions | fainted at 4:21, the Giant at 52% | fainted (at 480,000 HP) |
| Kobold King | won, 3:06, 101 | fainted at 4:55, the King at 44% | won at 300,000 HP in 1:31; at 1,200,000 out of reach |
| Goblin King | won, 3:30, 47 | fainted at 6:02, the King at 42% | fainted (at 420,000 HP) |
| Ancient Treant | won, 3:27, 145 (rooted 14 times) | fainted at 7:11, the Treant at 29% | fainted (at 500,000 HP) |

## Raids at Base 40/55/70/85

Each difficulty needs its Base Level (Easy 40, Normal 55, Hard 70, Hell 85; the owner's call). Easy
is made for a first job without potions, Normal and Hard for a second job at that level, checked
with `node build-tools/raid-sim.mjs` (its second job is the sim's first-job build at x2.5-3 damage,
in shop gear, so a real one has an easier time):

| Difficulty | Hero | Blader | Sorcerer |
|---|---|---|---|
| Easy | Base 40, first job | 0 pots: 100% (3.7 min) | 0 pots: 100% (2.0 min) |
| Normal | Base 55, second job, 20 White | 20 pots: 100% (2.4 min, 7 used) · 0 pots: 74% | 20 pots: 100% (1.3 min, 13 used) |
| Hard | Base 70, second job, 30 White | 30 pots: 99% (3.1 min, 18 used) · 0 pots: 28% | 30 pots: 100% (1.3 min, 17 used) |

Hell's BleepBloop is fierce (`FIERCE` in `src/mobs.js`): an MVP's rules (enraged below half, moves
that FLEE can't dodge and that go through 75% of DEF), about 210,000 HP at Lv 90, ATK about 210-260, Bloop Rain
with sticky puddles, Jelly Wall (three Jelly Cores, 90% less damage while one stands), and a
matchup (spells +30%; blades and fists −30%, beasts −20%).

## Mini-bosses: half as hard as an MVP

The owner's call: mini-bosses are half as hard as an MVP (190,000-290,000 HP since the owner halved them, ATK about half an
MVP's, DEX 120-145, slower swings) and fierce like one (enraged below half HP, moves that FLEE
can't dodge and that go through 75% of DEF, guards at 80/50/25%), and a decent Lv 70 can beat them.
No quest or trial needs one any more: those hunt their kin. Playtested with the same Windrunner bot
(steps out of circles, guards first, potions as needed). The levels in brackets are the ones they had then
(today: Great Bear 66, Alpha Wolf 64, Giant Mushroom 60, Elder Willow 55):

| Mini-boss | Lv 70, decent gear (Goblin Bow +7, armor +4, King Crab card, the right arrows) | Lv 99, shop gear | Lv 99, best gear |
|---|---|---|---|
| Great Bear (56) | won, 3:28, 1 White Potion | won, 4:16, none | won, 2:13, no HP lost |
| Alpha Wolf (51) | won, 1:48, 20 White Potions | | |
| Giant Mushroom (40) | won, 2:09, none | | |
| Elder Willow (23) | | | won, 2:02 |

Hell's BleepBloop on its own (the waves aside), the Lv 99 bot in the best gear at 490,000 HP and
ATK x1.2: won in 4:04 (67 White Potions) and 5:08 (180), leaving the waves about 5 minutes of the
10. At 770,000 HP, ATK x2 and DEF 42 the same hero fainted with him at 80%.

The owner then halved every MVP's and mini-boss's HP (and Hell's boss's: about 210,000 HP at its
Lv 90), and moved the raids to Base 40/55/70/85: the playtests above were at the old HP.
After the halving: Hell (Base 85) fell to a Lv 85 bot in the best gear in 3:44 (92 White Potions),
and a Lv 99 in shop gear still fainted against the Goblin King (at 5:30, the King at 41%).

## The Kobold Camp and the Goblin Lair

Two more raids on Bloop Island's ladder of strength (raid.js LADDER), at Base 45/60/75/90 and
50/65/80/95, their waves of kobolds and goblins, their bosses the Kobold and Goblin Warlords
(fierce in Hell, mobs.js FIERCE). `node build-tools/raid-sim.mjs`:

| Raid | Difficulty | Hero | Blader | Sorcerer |
|---|---|---|---|---|
| Kobold Camp | Easy | Base 45, first job | 0 pots: 100% (3.6 min) | 0 pots: 100% (1.3 min) |
| Kobold Camp | Normal | Base 60, second job, 20 White | 20 pots: 100% (2.4 min, 8 used) | 20 pots: 100% (0.8 min, 1 used) |
| Kobold Camp | Hard | Base 75, second job, 30 White | 30 pots: 99% (3.3 min, 23 used) | 30 pots: 100% (0.7 min) |
| Goblin Lair | Easy | Base 50, first job | 0 pots: 100% (3.5 min) | 0 pots: 100% (1.6 min) |
| Goblin Lair | Normal | Base 65, second job, 20 White | 20 pots: 100% (2.5 min, 9 used) | 20 pots: 100% (1.2 min, 8 used) |
| Goblin Lair | Hard | Base 80, second job, 30 White | 30 pots: 96% (3.7 min, 30 used) | 30 pots: 100% (1.0 min, 4 used) |

Kobolds are Earth, so the Sorcerer's Ember Bolt walks through the Den. Every raid's rare finds now
drop at 3% on every difficulty (`RARE` in `src/raid.js`; it was 1% for a while); the cores (3/9/27/81 a clear) buy them from the raid's guide.

The Hell Warlords were too quick next to BleepBloop (the Lv 99 bot in the best gear: the Kobold
Warlord in 76 s with 8 White Potions, the Goblin Warlord in 69 s with none; BleepBloop 2.5-5 min,
35-180 potions). Each got a barrage like Bloop Rain that leaves the ground dangerous (the Kobold
Warlord's Rockslide: slowing rubble; the Goblin Warlord's Firepot Rain: burning ground, his Hurled
Axe gone for it), the Goblin Warlord a third shadow in his Mirror Image, and both 1.8x HP in Hell
(FIERCE hpScale). The same bot, the same day: BleepBloop 171 s (73 potions), the Kobold Warlord
171 s (78), the Goblin Warlord 174 s (74).

## Boss AI (BRAIN in src/mobs.js)

The bosses got a smarter fight: they read a running hero, pick their moves for the moment, give
chase when kited, steer round rocks and bound over one that keeps them off you, and mini-bosses hunt
like MVPs. Testing it turned up two old faults: a mini-boss could be held off for good behind a rock
the hero stood tucked against (the earlier mini-boss playtests above were won that way, the boss
never landing a blow), and a boss's aim that led a hero who only stepped aside sent its circles into
empty ground (now it reads only a hero who has been running 0.6 s).

The playtest bot (an archer that stands and shoots, and steps out of every red circle), new AI:
| Fight | Hero | Time | White Potions | Old AI |
|---|---|---|---|---|
| Fire Giant | Lv 99, best gear | 55-101 s (5 runs) | 2-72 | 90-110 s, 56-92 |
| Ancient Treant | Lv 99, best gear | 125 s | 76 | 121 s, 70 |
| Kobold King | Lv 99, best gear | 190 s | 78 | 191 s, 79 |
| Hell BleepBloop | Lv 99, best gear | 138 s | 19 | 152-308 s |
| Great Bear | Lv 70, decent gear | 112 s | 68 (down to 885 HP) | never reached the hero |
| Alpha Wolf | Lv 70, decent gear | 55 s | 28 | 55 s, 27 |
| Giant Mushroom | Lv 70, decent gear | 70 s | 24 | never reached the hero |
| Giant Beetle | Lv 70, decent gear | 63 s | 24 | - |
The bot fights like a turret, so it barely meets the new AI's reading and chasing (made for heroes
who run, kite and cast); against it the bosses are about as hard as before, the mini-bosses harder
(they now reach it).

Bosses stuck in the terrain: a blocked boss (no nearer for 0.35 s) now finds a way round with A* on a
one-pace grid of its map (src/path.js: cells it fits in, clear of rocks, trees, tents and walls, off
safe ground and away from portals) and follows it. Checked on every boss map: four of each boss
roaming 30 s (none stuck more than 3 s), and four chases each from 8-12 paces at random spots, the
hero standing still: every boss reached the hero, in 1-10 s (the raid arenas 1-4 s).

## Rytingborg and the desert

- **The Assassin** (`node build-tools/sim.mjs`, the Assassin column above): about 1.4x the Blader's
  speed on one target, with fewer HP (`hpFactor` 70). Tuned to it: Venom Strike 198–450% (+3% hit per
  level, 6–11 SP), Venom Cloud 10 bites of 27–54% through DEF over 5 s to everything within 2.2 paces
  of the target, each 6–24% to poison (20–38 SP, 7 s cooldown), Dagger Mastery +4 ATK a level. A dagger swings at
  0.8x the job's sword delay (`DAGGER`).
- **The Phantom** (a rotation model with the game's rules, Base 80, Job 30, weapons of the same tier
  at +7: a sword 100, daggers 76): 1.2–1.4x the BladeMaster's single-target damage (the Goblin and
  Kobold Kings 1.4x, the Sand Wyrm 1.2x), with about 5,000 HP against the BladeMaster's 8,000. Dual
  Rend 6 x 101–200%, the left dagger with every blow at Twin Blades' 55–100% (the pair 1.15x slower,
  `DUAL`), Double Attack on the right hand, and two illusions out three quarters of the time.
- **The desert's field monsters** (Lv 55–64) are fights of 6–12 s for every first job at its level;
  the Sand Runner (quick, high DEX, kicks twice) is the hardest of them.
- **The Sand Wyrm** (Lv 70, 900,000 HP): up 9 s, under about 6 (6.5 and 4.5 enraged): it can't be
  hit under the sand and doesn't move while up (`WYRM`). Tested in the browser: no blow lands while
  it is under, and the boss leash no longer drags it back above the sand.
- **Pharaoh's Tomb** (`node build-tools/raid-sim.mjs`): in line with the other raids. Easy (Base 55,
  a first job, no potions) 100% for both; Normal (Base 70) 93–100%; Hard (Base 85) 96% for a Blader
  with 30 White Potions; Hell (Base 99) is the fierce Pharaoh and his Sarcophagus (4 Canopic Jars,
  90% less damage while they stand), tested in the browser like the other raids' Hell bosses.

## The Assassin's crosses

`node build-tools/second-sim.mjs`: a rotation model with the game's rules, Base 80, Job 30, weapons of
one tier at +7, a neutral Lv 55 boss of 300,000 HP, SP not counted. Times to bring it down (median of
40): BladeMaster 153 s, **Shadowblade 134 s**, Windrunner 104 s, **Hunter 117 s**, Wizard 179 s,
**Voodoo 165 s**.

- **Shadowblade** about 1.1x the BladeMaster on a lone boss (under the Phantom's 1.2–1.4x): there its
  hiding comes only from Umbral Step (bosses see through it), so one Ambush (x2, x3 with Night Stalker
  5) every 6 s, best spent on Eclipse (460–1000%, up to double on a wounded boss), with Backstab's +50%
  for the 2 s it stands at the boss's back. In a field Night Stalker hides it after every
  kill, and the next monster takes an Ambush: its strength is picking packs apart one by one, not
  bosses. Its HP (`hpFactor` 105) is under the BladeMaster's 150.
- **Hunter** about 0.9x the Windrunner on one target, counting 70% of its traps sprung (a kiting
  hero sets one, steps back, and the boss walks in). Trap damage (FNS x 1.5 + KNL + Base Lv x 2) never
  misses and goes through DEF; a held boss takes Killing Shot at x1.6 and Predator's +25%. The Land
  Mine (1500% at Lv 10, every 10 s) is the biggest single blast in Aria: a whole pack in one go.
- **Voodoo** about 1.1x the Wizard over a long fight on a neutral boss: Blight at 5 stacks (8 bound
  to the doll) is about 120–200% MATK a second through MDEF, on top of Poison Throws. It takes
  several seconds to build, so short fights and packs stay the Wizard's; on Shadow monsters (Dark
  Mushrooms, Dark Wisps, the Pharaoh's tomb) it falls to a quarter.

## Mini-boss EXP (November 2026 review)

The older mini-bosses paid far less than the newer ones for the same fight: the Giant Sprout 4,200 Base
EXP for 200,000 HP (about 3x a same-level field monster), the desert's and the dungeons' mini-bosses
22-28x. They now all pay about half of an MVP's EXP (its EXP and MVP bonus together), in line with
"half as hard as an MVP" (Base / Job EXP, before the x4 rate):

| Mini-boss | Lv | Was | Now |
|---|---|---|---|
| Giant Sprout | 55 | 4,200 / 2,940 | 30,000 / 21,000 |
| Elder Willow | 55 | 3,600 / 2,520 | 28,000 / 19,600 |
| King Crab | 58 | 8,400 / 5,880 | 32,000 / 22,400 |
| Giant Mushroom | 60 | 17,000 / 11,900 | 46,000 / 32,200 |
| Giant Beetle | 62 | 28,000 / 19,600 | 48,000 / 33,600 |
| Alpha Wolf | 64 | 32,000 / 22,400 | 54,000 / 37,800 |
| Great Bear | 66 | 42,000 / 29,400 | 60,000 / 42,000 |

The Cactus Lord (52,000), Rainbow Runner (64,000), Ammit and Ratatoskr (80,000) are unchanged.

## Tests

`npm test` (`test/*.test.mjs`, also run before every APK build) checks the owner's rules that can be
checked in code: which second-job trials open (the examples in `docs/job-rules.md`), skill points,
3-4 actives per second job (the Wizard's five by name), one card per monster, the game's data (every
drop, recipe, shop item, quest monster, portal), saves and their backup copy, and the balance:
the Assassin about 1.4x the Blader over the field monsters (1.25-1.6), a same-level first job winning
85% of its fights against every daytime field monster from Lv 12, and the crosses' bands
(`node build-tools/second-sim.mjs --check`: Shadowblade / BladeMaster 0.98-1.25, Hunter / Windrunner
0.78-1.02, Voodoo / Wizard 0.97-1.22; and the Windrunner ahead of the BladeMaster and the Wizard on one
target, as its trait says). `npm run smoke` (after `npm run build`) plays the built game in
Chromium at 844x390: a new hero, every window, the settings, a fight, every map, with no page error.

## The dungeons staggered (November 2026)

The owner's call: both dungeons covered Base 31-90 and opened only from their secret series (the World
Tree's at Base 45-48, the Sphinx's at 60-64), so nobody met their first floors at those floors' levels. The
World Tree's Hollows are now Base 45-75 (floors 45-52, 53-60, 61-68, the great hall 69-75) and the Sphinx's
Halls Base 65-99 (65-72, 73-80, 81-88, the great hall 89-99). Ammit, Ratatoskr, the Eternal Sphinx and
Nidhogg kept their levels. Each monster's stats moved along the curve the dungeons' monsters already followed
(HP about level^1.66, ATK ^1.2, EXP ^3), so it keeps its own character. From Lv 61 the dungeons' monsters pay
2x EXP (the owner's call: the climb past 75 took about 250 kills a level at Lv 86): a Falcon Sentinel (now
Lv 97) pays 71,084 Base EXP a kill against 24,800 before, so the last levels take about a third of the kills.
Every first job still wins nearly all its fights against them at their level (the table above).

## The bosses' tiers (November 2026)

The owner's call: MVPs beatable by tier, a hero of the tier's Base Level in the best gear short of MVP gear (a
Lv 4 weapon at +7, armor at +4, monster and mini-boss cards): Base 75 the Kobold King and the Goblin King, 85 the
Fire Giant, the Ancient Treant and the Sand Wyrm, 95 the Eternal Sphinx and Nidhogg (the hardest for now). The
mini-bosses for a Lv 75 second job in shop gear; each raid's Hell boss for its Hell level in the same good gear.
"Beatable" is for a middle matchup: the median of six second jobs (measure by measure) wins 80% of the time in about 3-6 minutes (a
mini-boss 1.5-5, a Hell boss 2-5, leaving the waves their time) on 100 White Potions or fewer.

`node build-tools/mvp-sim.mjs` models the fights (see its header): each job's rotation from second-sim.mjs
against the boss itself, the boss's swings, stomp and moves (half stepped out of), its rage, guards, shields and
own mechanic, and White Potions as fast as a thumb taps them. Each boss's ATK and HP were then set so its middle
job lands in the bar. Before, no MVP fell to a tier hero (every one killed the median job, through potions);
mini-bosses fell in 90-200 s, the newer four not at all. MVP ATK came down to 0.16-0.42x (their moves still hit
for 1.4-2.4x of it through 75% of DEF), and HP moved both ways to keep each fight several minutes (the Fire
Giant up to 765,000, Nidhogg down to 365,000: its Gnaw heals it, so a long fight never ends). Matchups still
matter: an MVP's worst jobs can lose (a Wizard against the Goblin King, the Shadow jobs against Nidhogg).
Every MVP, Hell boss and mini-boss also has **Tremor** (`TREMOR` in `mobs.js`): a hero who stands still 4 s
within 9 paces gets a red circle at their feet that bursts 1.2 s later (1.5x, a boss move), at most every 9 s. The
sim has the hero step out of it every time it comes (0.4 s of blows lost, 0.25 s for a bow or a caster), one
step in twelve too late; with it the Giant Beetle's ATK came down 3% to stay in its bar.
This is a model (with a fixed random seed per fight, so its check is steady and one fight's change never moves another's): the in-game feel should be playtested. `npm test` runs `mvp-sim --check`.

| Fight | Base, gear | blademaster | shadowblade | windrunner | hunter | wizard | voodoo | middle |
|---|---|---|---|---|---|---|---|---|
| Kobold King | 75, good | 100% 292s 87p | 100% 243s 74p | 100% 348s 101p | 100% 294s 83p | 100% 291s 90p | 100% 262s 75p | **100% 291s 85p** |
| Goblin King | 75, good | 100% 210s 73p | 100% 174s 63p | 100% 278s 88p | 100% 330s 111p | 0% 900s 383p | 100% 527s 199p | **100% 304s 100p** |
| Fire Giant | 85, good | 100% 337s 86p | 100% 283s 76p | 100% 149s 30p | 100% 231s 54p | 0% 900s 166p | 100% 447s 125p | **100% 310s 81p** |
| Ancient Treant | 85, good | 100% 460s 129p | 100% 396s 117p | 100% 162s 31p | 100% 217s 51p | 100% 350s 96p | 100% 277s 72p | **100% 313s 84p** |
| Sand Wyrm | 85, good | 100% 291s 77p | 100% 241s 64p | 100% 256s 66p | 100% 293s 80p | 100% 429s 131p | 100% 342s 95p | **100% 292s 79p** |
| Eternal Sphinx | 95, good | 100% 445s 150p | 100% 435s 170p | 100% 217s 42p | 100% 267s 73p | 100% 316s 87p | 100% 283s 78p | **100% 299s 83p** |
| Nidhogg | 95, good | 100% 322s 123p | 0% 900s 289p | 100% 92s 26p | 100% 126s 38p | 100% 165s 63p | 0% 900s 234p | **100% 243s 93p** |
| Giant Sprout | 75, shop | 100% 222s 114p | 100% 191s 101p | 100% 138s 45p | 100% 180s 62p | 100% 247s 97p | 100% 219s 83p | **100% 205s 90p** |
| King Crab | 75, shop | 100% 218s 97p | 100% 189s 89p | 100% 146s 40p | 100% 168s 50p | 100% 246s 82p | 100% 204s 63p | **100% 197s 73p** |
| Giant Mushroom | 75, shop | 100% 189s 85p | 100% 597s 308p | 100% 127s 36p | 100% 144s 47p | 100% 259s 89p | 0% 900s 327p | **100% 224s 87p** |
| Giant Beetle | 75, shop | 100% 227s 136p | 100% 191s 115p | 100% 153s 60p | 100% 161s 63p | 100% 442s 197p | 100% 188s 79p | **100% 190s 97p** |
| Elder Willow | 75, shop | 100% 220s 104p | 100% 193s 95p | 100% 142s 44p | 100% 178s 56p | 100% 303s 108p | 100% 246s 85p | **100% 207s 90p** |
| Alpha Wolf | 75, shop | 100% 198s 142p | 100% 200s 146p | 100% 130s 59p | 100% 151s 71p | 100% 213s 103p | 100% 189s 90p | **100% 194s 97p** |
| Great Bear | 75, shop | 100% 238s 160p | 100% 207s 143p | 100% 169s 73p | 100% 152s 65p | 100% 188s 89p | 100% 189s 87p | **100% 188s 88p** |
| Cactus Lord | 75, shop | 100% 220s 105p | 100% 191s 96p | 100% 156s 52p | 100% 152s 52p | 100% 264s 104p | 100% 204s 79p | **100% 197s 88p** |
| Rainbow Runner | 75, shop | 100% 325s 207p | 100% 314s 207p | 100% 169s 65p | 100% 167s 66p | 100% 185s 78p | 100% 215s 90p | **100% 200s 84p** |
| Ammit | 75, shop | 100% 211s 118p | 100% 730s 443p | 100% 129s 41p | 100% 114s 38p | 100% 184s 68p | 100% 627s 237p | **100% 198s 93p** |
| Ratatoskr | 75, shop | 100% 356s 256p | 100% 391s 288p | 100% 124s 55p | 100% 127s 59p | 100% 197s 102p | 100% 188s 96p | **100% 193s 99p** |
| BleepBloop (Hell) | 85, good | 100% 900s 447p | 100% 762s 369p | 100% 158s 51p | 100% 248s 93p | 100% 183s 72p | 100% 249s 97p | **100% 248s 95p** |
| Kobold Warlord (Hell) | 90, good | 100% 382s 147p | 100% 398s 166p | 100% 218s 71p | 100% 216s 72p | 100% 134s 44p | 100% 144s 49p | **100% 217s 72p** |
| Goblin Warlord (Hell) | 95, good | 100% 418s 204p | 100% 337s 161p | 100% 160s 48p | 100% 263s 102p | 100% 147s 55p | 100% 209s 84p | **100% 236s 93p** |
| Pharaoh (Hell) | 99, good | 100% 315s 122p | 0% 900s 426p | 100% 141s 35p | 100% 207s 67p | 100% 95s 32p | 100% 562s 241p | **100% 261s 95p** |
