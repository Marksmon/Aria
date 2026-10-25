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
  HP and ATK -20%; Sea Slime ATK -10%; Blue Crab HP -20%. The agile late monsters dodged three blows
  in four: Kobold Assassin QKN 58 to 50, Dark Wisp 60 to 47, Fire Beetle 34 to 31, Goblin Assassin
  75 to 60, Fire Wisp 70 to 53.
- Mini-bosses: Giant Sprout 9,000 to 7,200 HP and ATK 80-108 to 44-59; King Crab 11,000 to 8,900 HP,
  ATK 92-120 to 41-54; Giant Mushroom 14,000 to 11,200 HP, ATK 122-158 to 55-71; Giant Beetle
  16,000 to 10,800 HP, ATK 125-162 to 56-73.
- A boss's guards are lesser servants: half their kind's HP and 60% of its ATK (`GUARD` in
  `src/mobs.js`). Two full-strength guards were what made every mini-boss unwinnable.
- Heavy Strike 145-280% to 167-320%. Battle Rhythm: 3 SP every 3rd hit (was 1 SP every 5th).
- Early loot sells for more (Slime Gel 3 to 7 perz, Seed 4 to 8, Shell 12 to 25...).
- Story EXP for Chapters 3-4 cut (the last delivery gave 160,000 EXP), so a hero who beat the Giant
  Sprout at about Base 28 reaches Chapter 5 at about 32 instead of 38.
- Liv the Guide (Steinborg) rethinks your training: one free stat reset and one free first-job skill
  reset, then 20,000 perz each.

## Every monster at its own level (bosses with 20 Orange Potions; the Lantern Wisp without any)

| Monster | Lv | Blader at its level | Sorcerer at its level |
|---|---|---|---|
| Slime | 1 | 100% win · 1 s · 100% HP left | 100% win · 3 s · 88% HP left |
| Sprout | 3 | 100% win · 2 s · 100% HP left | 100% win · 5 s · 78% HP left |
| Little Slime | 4 | 100% win · 1 s · 100% HP left | 100% win · 3 s · 87% HP left |
| Blue Slime | 6 | 100% win · 5 s · 79% HP left | 91% win · 13 s · 26% HP left |
| Crab | 9 | 91% win · 11 s · 27% HP left | 0% win · 10 s · boss at 65% |
| Wisp | 11 | 87% win · 13 s · 21% HP left | 0% win · 10 s · boss at 67% |
| Mushroom | 14 | 99% win · 21 s · 27% HP left | 100% win · 8 s · 67% HP left |
| Lantern Wisp | 16 | 0% win · 18 s · boss at 39% | 0% win · 11 s · boss at 19% |
| Red Sprout | 18 | 88% win · 11 s · 33% HP left | 100% win · 4 s · 67% HP left |
| Sea Slime | 22 | 100% win · 4 s · 78% HP left | 99% win · 8 s · 9% HP left |
| Giant Sprout | 25 | 100% win · 106 s · 58% HP left · 18 pots | 100% win · 27 s · 67% HP left · 3 pots |
| Blue Crab | 26 | 100% win · 4 s · 68% HP left | 87% win · 6 s · 17% HP left |
| Kobold | 28 | 100% win · 6 s · 56% HP left | 100% win · 2 s · 76% HP left |
| Beetle | 30 | 100% win · 6 s · 54% HP left | 100% win · 4 s · 60% HP left |
| Kobold Archer | 30 | 100% win · 4 s · 81% HP left | 100% win · 2 s · 81% HP left |
| King Crab | 32 | 100% win · 114 s · 53% HP left · 18 pots | 98% win · 60 s · 58% HP left · 7 pots |
| Kobold Assassin | 33 | 89% win · 5 s · 52% HP left | 100% win · 2 s · 62% HP left |
| Dark Mushroom | 34 | 99% win · 7 s · 60% HP left | 100% win · 6 s · 35% HP left |
| Dark Wisp | 38 | 97% win · 7 s · 58% HP left | 100% win · 5 s · 41% HP left |
| Goblin | 38 | 100% win · 7 s · 60% HP left | 100% win · 5 s · 43% HP left |
| Giant Mushroom | 40 | 91% win · 145 s · 33% HP left · 20 pots | 100% win · 50 s · 55% HP left · 6 pots |
| Goblin Archer | 41 | 100% win · 5 s · 86% HP left | 100% win · 4 s · 67% HP left |
| Fire Beetle | 42 | 100% win · 10 s · 55% HP left | 88% win · 7 s · 18% HP left |
| Goblin Assassin | 44 | 92% win · 8 s · 50% HP left | 100% win · 4 s · 59% HP left |
| Fire Wisp | 45 | 95% win · 9 s · 52% HP left | 90% win · 6 s · 5% HP left |
| Giant Beetle | 48 | 77% win · 137 s · 19% HP left · 20 pots | 100% win · 37 s · 52% HP left · 6 pots |

## Mini-bosses at their hinted level, 20 Orange Potions

| Boss | Blader | Sorcerer |
|---|---|---|
| Giant Sprout at Base 28 | 100% win · 85 s · 55% HP left · 13 pots | 100% win · 22 s · 65% HP left · 2 pots |
| King Crab at Base 34 | 100% win · 101 s · 52% HP left · 13 pots | 100% win · 58 s · 60% HP left · 6 pots |
| Giant Mushroom at Base 43 | 100% win · 108 s · 49% HP left · 13 pots | 100% win · 44 s · 54% HP left · 4 pots |
| Giant Beetle at Base 50 | 100% win · 110 s · 49% HP left · 14 pots | 100% win · 37 s · 52% HP left · 5 pots |
| Lantern Wisp (rare hunt) at Base 16 | 100% win · 35 s · 68% HP left · 3 pots | 100% win · 14 s · 86% HP left · 2 pots |
