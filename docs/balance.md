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
  HP and ATK -20%; Mudskipper ATK -10%; Blue Crab HP -20%. The agile late monsters dodged three blows
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
The trimmed spells leave the Sorcerer short against some Water monsters at Base 22-34 (Mudskipper,
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
| Gel Thief | 3 | 100% win · 4 s · 93% HP left | 100% win · 9 s · 82% HP left | 100% win · 1 s · 100% HP left | 100% win · 3 s · 95% HP left |
| Sprout | 3 | 100% win · 2 s · 95% HP left | 100% win · 3 s · 100% HP left | 100% win · 0 s · 100% HP left | 100% win · 2 s · 93% HP left |
| Blue Bloop | 4 | 100% win · 4 s · 94% HP left | 100% win · 8 s · 77% HP left | 100% win · 0 s · 100% HP left | 100% win · 3 s · 94% HP left |
| Crab | 6 | 100% win · 6 s · 79% HP left | 95% win · 14 s · 35% HP left | 100% win · 2 s · 100% HP left | 100% win · 5 s · 83% HP left |
| Yellow Bloop | 7 | 100% win · 6 s · 89% HP left | 100% win · 14 s · 62% HP left | 100% win · 2 s · 100% HP left | 100% win · 5 s · 89% HP left |
| Willow | 8 | 100% win · 7 s · 90% HP left | 100% win · 18 s · 58% HP left | 100% win · 2 s · 100% HP left | 100% win · 6 s · 93% HP left |
| Red Bloop | 9 | 100% win · 9 s · 89% HP left | 100% win · 24 s · 31% HP left | 100% win · 3 s · 98% HP left | 100% win · 7 s · 84% HP left |
| Wisp | 11 | 88% win · 12 s · 25% HP left | 0% win · 12 s · boss at 58% | 100% win · 6 s · 80% HP left | 89% win · 11 s · 27% HP left |
| Giant Ant | 12 | 100% win · 12 s · 53% HP left | 100% win · 9 s · 55% HP left | 100% win · 5 s · 93% HP left | 100% win · 5 s · 78% HP left |
| Mushroom | 14 | 97% win · 22 s · 27% HP left | 100% win · 11 s · 55% HP left | 100% win · 8 s · 82% HP left | 100% win · 9 s · 70% HP left |
| Lantern Wisp | 16 | 77% win · 23 s · 14% HP left | 25% win · 21 s · 0% HP left | 100% win · 12 s · 63% HP left | 98% win · 10 s · 56% HP left |
| Red Sprout | 18 | 97% win · 5 s · 71% HP left | 100% win · 8 s · 60% HP left | 100% win · 4 s · 88% HP left | 100% win · 2 s · 89% HP left |
| Mudskipper | 22 | 100% win · 3 s · 81% HP left | 94% win · 11 s · 15% HP left | 100% win · 3 s · 89% HP left | 100% win · 2 s · 88% HP left |
| Treant | 24 | 100% win · 5 s · 77% HP left | 100% win · 10 s · 33% HP left | 100% win · 8 s · 58% HP left | 100% win · 6 s · 72% HP left |
| Blue Crab | 26 | 100% win · 3 s · 79% HP left | 99% win · 10 s · 9% HP left | 100% win · 2 s · 100% HP left | 100% win · 2 s · 87% HP left |
| Kobold | 28 | 100% win · 4 s · 76% HP left | 100% win · 5 s · 66% HP left | 100% win · 3 s · 86% HP left | 100% win · 4 s · 74% HP left |
| Beetle | 30 | 100% win · 5 s · 66% HP left | 100% win · 5 s · 66% HP left | 100% win · 4 s · 73% HP left | 100% win · 4 s · 74% HP left |
| Kobold Archer | 30 | 100% win · 3 s · 90% HP left | 100% win · 4 s · 86% HP left | 100% win · 2 s · 100% HP left | 100% win · 2 s · 89% HP left |
| Kobold Assassin | 33 | 98% win · 4 s · 68% HP left | 100% win · 4 s · 67% HP left | 100% win · 2 s · 100% HP left | 97% win · 3 s · 73% HP left |
| Dark Mushroom | 34 | 100% win · 5 s · 70% HP left | 100% win · 10 s · 18% HP left | 100% win · 4 s · 86% HP left | 100% win · 4 s · 75% HP left |
| Dark Wisp | 38 | 100% win · 5 s · 67% HP left | 100% win · 9 s · 27% HP left | 100% win · 3 s · 88% HP left | 99% win · 4 s · 77% HP left |
| Goblin | 38 | 100% win · 6 s · 75% HP left | 99% win · 9 s · 38% HP left | 100% win · 5 s · 77% HP left | 100% win · 4 s · 70% HP left |
| Goblin Archer | 41 | 100% win · 4 s · 88% HP left | 100% win · 6 s · 75% HP left | 100% win · 3 s · 90% HP left | 100% win · 3 s · 90% HP left |
| Fire Beetle | 42 | 100% win · 7 s · 60% HP left | 99% win · 9 s · 26% HP left | 100% win · 6 s · 73% HP left | 100% win · 5 s · 66% HP left |
| Goblin Assassin | 44 | 97% win · 6 s · 65% HP left | 100% win · 5 s · 59% HP left | 100% win · 3 s · 89% HP left | 96% win · 4 s · 69% HP left |
| Fire Wisp | 45 | 99% win · 7 s · 66% HP left | 100% win · 7 s · 35% HP left | 100% win · 4 s · 87% HP left | 100% win · 5 s · 63% HP left |
| Snake | 46 | 100% win · 6 s · 71% HP left | 100% win · 7 s · 54% HP left | 100% win · 4 s · 88% HP left | 100% win · 4 s · 69% HP left |
| Root Squirrel | 46 | 97% win · 9 s · 62% HP left | 100% win · 5 s · 65% HP left | 100% win · 5 s · 80% HP left | 98% win · 6 s · 66% HP left |
| Wolf | 48 | 98% win · 8 s · 60% HP left | 100% win · 7 s · 30% HP left | 100% win · 4 s · 79% HP left | 99% win · 5 s · 61% HP left |
| Bramble | 51 | 100% win · 7 s · 74% HP left | 100% win · 10 s · 45% HP left | 100% win · 7 s · 77% HP left | 100% win · 5 s · 82% HP left |
| Bear | 53 | 100% win · 10 s · 59% HP left | 99% win · 10 s · 28% HP left | 100% win · 12 s · 45% HP left | 100% win · 6 s · 61% HP left |
| Giant Sprout | 55 | 0% win · 139 s · boss at 92% · 20 pots | 0% win · 126 s · boss at 79% · 20 pots | 0% win · 125 s · boss at 93% · 20 pots | 0% win · 82 s · boss at 94% · 20 pots |
| Elder Willow | 55 | 0% win · 150 s · boss at 91% · 20 pots | 0% win · 136 s · boss at 79% · 20 pots | 0% win · 132 s · boss at 92% · 20 pots | 0% win · 89 s · boss at 93% · 20 pots |
| Cactus | 55 | 100% win · 8 s · 78% HP left | 100% win · 6 s · 76% HP left | 100% win · 8 s · 80% HP left | 100% win · 5 s · 83% HP left |
| Root Serpent | 55 | 99% win · 10 s · 59% HP left | 100% win · 8 s · 39% HP left | 100% win · 7 s · 70% HP left | 100% win · 7 s · 67% HP left |
| King Crab | 58 | 0% win · 158 s · boss at 90% · 20 pots | 0% win · 153 s · boss at 88% · 20 pots | 0% win · 148 s · boss at 91% · 20 pots | 0% win · 97 s · boss at 93% · 20 pots |
| Dune Worm | 58 | 100% win · 9 s · 61% HP left | 100% win · 6 s · 74% HP left | 100% win · 7 s · 62% HP left | 100% win · 7 s · 65% HP left |
| Moss Golem | 58 | 100% win · 11 s · 72% HP left | 100% win · 8 s · 65% HP left | 100% win · 21 s · 31% HP left | 100% win · 9 s · 78% HP left |
| Giant Mushroom | 60 | 0% win · 173 s · boss at 88% · 20 pots | 0% win · 146 s · boss at 78% · 20 pots | 0% win · 147 s · boss at 90% · 20 pots | 0% win · 98 s · boss at 92% · 20 pots |
| Cactus Lord | 60 | 0% win · 200 s · boss at 89% · 20 pots | 0% win · 172 s · boss at 74% · 20 pots | 0% win · 182 s · boss at 90% · 20 pots | 0% win · 118 s · boss at 93% · 20 pots |
| Dark Elf | 60 | 100% win · 10 s · 64% HP left | 100% win · 11 s · 27% HP left | 100% win · 6 s · 80% HP left | 100% win · 7 s · 65% HP left |
| Sand Scorpion | 61 | 100% win · 10 s · 64% HP left | 100% win · 8 s · 39% HP left | 100% win · 9 s · 60% HP left | 100% win · 7 s · 67% HP left |
| Giant Beetle | 62 | 0% win · 131 s · boss at 92% · 20 pots | 0% win · 119 s · boss at 81% · 20 pots | 0% win · 119 s · boss at 93% · 20 pots | 0% win · 78 s · boss at 94% · 20 pots |
| Soldier Ant | 62 | 100% win · 10 s · 66% HP left | 100% win · 8 s · 44% HP left | 100% win · 11 s · 53% HP left | 100% win · 6 s · 68% HP left |
| Great Stag | 63 | 97% win · 12 s · 51% HP left | 100% win · 8 s · 40% HP left | 100% win · 9 s · 61% HP left | 96% win · 8 s · 60% HP left |
| Alpha Wolf | 64 | 0% win · 110 s · boss at 93% · 20 pots | 0% win · 110 s · boss at 73% · 20 pots | 0% win · 110 s · boss at 91% · 20 pots | 0% win · 70 s · boss at 94% · 20 pots |
| Sand Runner | 64 | 95% win · 13 s · 46% HP left | 100% win · 8 s · 43% HP left | 100% win · 7 s · 65% HP left | 96% win · 9 s · 54% HP left |
| Rainbow Runner | 64 | 0% win · 168 s · boss at 94% · 20 pots | 0% win · 132 s · boss at 81% · 20 pots | 0% win · 133 s · boss at 92% · 20 pots | 0% win · 90 s · boss at 95% · 20 pots |
| Quill Porcupine | 65 | 98% win · 12 s · 63% HP left | 100% win · 9 s · 54% HP left | 100% win · 7 s · 81% HP left | 98% win · 8 s · 69% HP left |
| Great Bear | 66 | 0% win · 127 s · boss at 91% · 20 pots | 0% win · 117 s · boss at 80% · 20 pots | 0% win · 119 s · boss at 93% · 20 pots | 0% win · 78 s · boss at 94% · 20 pots |
| Tusk Boar | 66 | 100% win · 11 s · 57% HP left | 100% win · 9 s · 29% HP left | 43% win · 20 s · 0% HP left | 100% win · 8 s · 62% HP left |
| Scarab | 66 | 100% win · 11 s · 64% HP left | 100% win · 6 s · 65% HP left | 86% win · 22 s · 17% HP left | 100% win · 8 s · 69% HP left |
| Dryad | 66 | 100% win · 8 s · 79% HP left | 100% win · 7 s · 66% HP left | 100% win · 6 s · 81% HP left | 100% win · 6 s · 77% HP left |
| Rot Beetle | 68 | 100% win · 9 s · 76% HP left | 100% win · 9 s · 48% HP left | 100% win · 10 s · 72% HP left | 100% win · 6 s · 79% HP left |
| Cliff Bandit | 69 | 100% win · 11 s · 70% HP left | 100% win · 11 s · 43% HP left | 100% win · 22 s · 31% HP left | 100% win · 8 s · 73% HP left |
| Blade Mantis | 71 | 98% win · 12 s · 46% HP left | 100% win · 8 s · 31% HP left | 100% win · 8 s · 63% HP left | 92% win · 9 s · 40% HP left |
| Cobra | 71 | 99% win · 12 s · 54% HP left | 100% win · 5 s · 77% HP left | 100% win · 8 s · 68% HP left | 99% win · 8 s · 57% HP left |
| Root Warden | 72 | 100% win · 10 s · 72% HP left | 100% win · 6 s · 79% HP left | 100% win · 18 s · 42% HP left | 100% win · 7 s · 73% HP left |
| Chest Mimic | 73 | 100% win · 13 s · 62% HP left | 100% win · 9 s · 46% HP left | 68% win · 25 s · 7% HP left | 100% win · 9 s · 71% HP left |
| Glass Jelly | 74 | 100% win · 8 s · 80% HP left | 100% win · 12 s · 35% HP left | 100% win · 7 s · 83% HP left | 100% win · 5 s · 80% HP left |
| Ammit | 74 | 0% win · 392 s · boss at 69% · 20 pots | 0% win · 210 s · boss at 63% · 20 pots | 0% win · 245 s · boss at 77% · 20 pots | 0% win · 167 s · boss at 81% · 20 pots |
| Ratatoskr | 74 | 0% win · 200 s · boss at 89% · 20 pots | 0% win · 126 s · boss at 78% · 20 pots | 0% win · 131 s · boss at 87% · 20 pots | 0% win · 90 s · boss at 92% · 20 pots |
| Merrow | 75 | 100% win · 9 s · 78% HP left | 100% win · 13 s · 37% HP left | 100% win · 8 s · 83% HP left | 100% win · 7 s · 80% HP left |
| Mummy | 75 | 100% win · 10 s · 72% HP left | 100% win · 11 s · 51% HP left | 100% win · 16 s · 51% HP left | 100% win · 7 s · 79% HP left |
| Thorn Drake | 75 | 100% win · 11 s · 68% HP left | 100% win · 8 s · 61% HP left | 100% win · 9 s · 74% HP left | 100% win · 8 s · 70% HP left |
| Gale Moth | 77 | 98% win · 13 s · 54% HP left | 100% win · 8 s · 50% HP left | 100% win · 8 s · 69% HP left | 96% win · 9 s · 54% HP left |
| Lamia | 78 | 100% win · 9 s · 79% HP left | 100% win · 13 s · 42% HP left | 100% win · 8 s · 85% HP left | 100% win · 7 s · 81% HP left |
| Living Armor | 79 | 100% win · 12 s · 70% HP left | 100% win · 9 s · 51% HP left | 100% win · 10 s · 68% HP left | 100% win · 8 s · 71% HP left |
| Headless Knight | 80 | 0% win · 441 s · boss at 60% · 20 pots | 0% win · 169 s · boss at 60% · 20 pots | 0% win · 228 s · boss at 80% · 20 pots | 0% win · 166 s · boss at 80% · 20 pots |
| Pharaoh's Servant | 80 | 100% win · 8 s · 83% HP left | 100% win · 13 s · 41% HP left | 100% win · 9 s · 84% HP left | 100% win · 6 s · 82% HP left |
| Moss Troll | 81 | 100% win · 14 s · 70% HP left | 100% win · 10 s · 52% HP left | 93% win · 29 s · 23% HP left | 100% win · 10 s · 72% HP left |
| Owlbear | 83 | 91% win · 17 s · 42% HP left | 100% win · 9 s · 49% HP left | 100% win · 10 s · 67% HP left | 82% win · 12 s · 44% HP left |
| Sphinx Cub | 83 | 87% win · 17 s · 39% HP left | 100% win · 6 s · 61% HP left | 100% win · 10 s · 62% HP left | 82% win · 12 s · 38% HP left |
| Moor Witch | 84 | 100% win · 11 s · 78% HP left | 100% win · 14 s · 27% HP left | 100% win · 17 s · 44% HP left | 100% win · 8 s · 80% HP left |
| Conch | 85 | 100% win · 12 s · 75% HP left | 100% win · 16 s · 24% HP left | 100% win · 23 s · 40% HP left | 100% win · 8 s · 81% HP left |
| Puffer Fish | 86 | 100% win · 10 s · 76% HP left | 100% win · 16 s · 23% HP left | 100% win · 10 s · 77% HP left | 100% win · 6 s · 82% HP left |
| Fire Salamander | 86 | 100% win · 9 s · 71% HP left | 100% win · 8 s · 41% HP left | 100% win · 8 s · 70% HP left | 100% win · 6 s · 71% HP left |
| Sand Elemental | 86 | 100% win · 10 s · 75% HP left | 100% win · 9 s · 54% HP left | 100% win · 12 s · 70% HP left | 100% win · 7 s · 77% HP left |
| Zombie | 88 | 100% win · 12 s · 76% HP left | 100% win · 11 s · 57% HP left | 100% win · 17 s · 61% HP left | 100% win · 8 s · 82% HP left |
| Sarcophagus | 88 | 100% win · 13 s · 72% HP left | 100% win · 15 s · 39% HP left | 100% win · 25 s · 38% HP left | 100% win · 9 s · 77% HP left |
| Pirate Skeleton | 89 | 100% win · 13 s · 65% HP left | 100% win · 9 s · 53% HP left | 100% win · 12 s · 65% HP left | 100% win · 8 s · 71% HP left |
| Blowgun Pirate | 90 | 100% win · 11 s · 77% HP left | 100% win · 9 s · 63% HP left | 100% win · 9 s · 80% HP left | 100% win · 7 s · 77% HP left |
| Fire Giant | 90 | 0% win · 600 s · boss at 67% | 0% win · 361 s · boss at 69% · 20 pots | 0% win · 577 s · boss at 63% · 20 pots | 0% win · 451 s · boss at 66% · 20 pots |
| Octopus | 92 | 100% win · 12 s · 75% HP left | 100% win · 14 s · 28% HP left | 100% win · 12 s · 66% HP left | 100% win · 8 s · 77% HP left |
| Jackal Guardian | 92 | 100% win · 15 s · 66% HP left | 100% win · 9 s · 53% HP left | 100% win · 15 s · 58% HP left | 100% win · 9 s · 68% HP left |
| Ghost | 93 | 100% win · 8 s · 80% HP left | 100% win · 9 s · 47% HP left | 100% win · 4 s · 87% HP left | 100% win · 5 s · 83% HP left |
| Kraken | 94 | 0% win · 506 s · boss at 47% · 20 pots | 0% win · 252 s · boss at 67% · 20 pots | 0% win · 336 s · boss at 65% · 20 pots | 0% win · 238 s · boss at 60% · 20 pots |
| Skeleton Assassin | 95 | 60% win · 28 s · 24% HP left | 100% win · 9 s · 37% HP left | 100% win · 10 s · 67% HP left | 79% win · 15 s · 32% HP left |
| Falcon Sentinel | 97 | 100% win · 19 s · 65% HP left | 100% win · 10 s · 57% HP left | 100% win · 11 s · 73% HP left | 100% win · 9 s · 74% HP left |
| Hydra | 98 | 100% win · 14 s · 74% HP left | 95% win · 18 s · 5% HP left | 100% win · 20 s · 48% HP left | 100% win · 8 s · 75% HP left |

*(Measured again in November 2026 with every region: the coast round Hafnvik, the Sunken Galleon and the dungeons. A mini-boss past Lv 75 (the Headless Knight, the Kraken) is a second job's fight, made for a Lv 75 second job in shop gear: see the bosses' tiers below; a first job in shop gear is not meant to win it.)*

The Sorcerer's column is with the November 2026 Rune Ward (the owner's call: a little help for the early
Sorcerer, spell damage unchanged): it needs nothing now, costs 8 SP and cuts 25% of the damage from its first
point (30% at Lv 10, was 2% a level), and the reference Sorcerer takes its first point right after Ember Bolt 5.
Before it, a same-level Sorcerer won only 67% against Mudskippers, 37% against Blue Crabs and 80% against Dark
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
**In the real game** (`build-tools/boss-bot.cjs`, November 2026): a bot BladeMaster built like the sim's, fighting
in the built game with its skills, White Potions below half HP and a step aside from each Tremor. The Kobold King
(Base 75, good gear) fell in 364 s on 76 potions (the sim: 292 s, 87); the Giant Sprout (Base 75, shop gear) in
190 s on 58 (the sim: 222 s, 114). Both inside their bands: the sim's tiers hold in play, the real fight a little
slower on the MVP (the bot loses time walking back to the boss) and cheaper on potions (it steps out of Tremor's
circles, and some of the boss's swings miss as it turns).
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

## All ten second jobs, and how far apart they lie (November 2026 review, measured; nothing retuned yet)

The second-job and boss simulators held six of the ten second jobs. The Phantom, the Magic Knight, the Moon Ranger and
the Beastmaster are in them now (`build-tools/second-sim.mjs`: the Phantom's two daggers and illusions, the Magic
Knight's blade in the boss's weakest element, the Moon Ranger's ATK + MATK arrows by day and by night, the
Beastmaster's Double Shots and its pack, the beasts' numbers as `main.js` `beastStats` makes them). The tiers'
check still judges each fight by the middle of the first six, so nothing moved; the four are reported beside them.

`node build-tools/second-sim.mjs` (a neutral Lv 55 boss of 300,000 HP, Base 80, Job 30, one tier of weapons at +7):

```
blademaster   153 s    1965 a second
shadowblade   134 s    2234 a second
windrunner    104 s    2885 a second
hunter        116 s    2595 a second
wizard        180 s    1669 a second
voodoo        165 s    1822 a second
phantom       131 s    2284 a second
magicknight   288 s    1041 a second
moonranger    115 s    2603 a second
moonrangerNight   82 s    3644 a second
beastmaster   147 s    2037 a second

Shadowblade / BladeMaster 1.14 · Hunter / Windrunner 0.90 · Voodoo / Wizard 1.09
Phantom / BladeMaster 1.16 (the rule: 1.2-1.4) · Moon Ranger / Windrunner by day 0.90 (1.05), by night 1.26 (1.2) · Magic Knight / BladeMaster 0.53 (between the BladeMaster and the Wizard) · Beastmaster / Windrunner 0.71 (about the other bow jobs)
```

Against what `docs/job-rules.md` says of them: the Phantom is a little under its 1.2-1.4x the BladeMaster; the Moon
Ranger is under the Windrunner by day (0.9x, the rule says 1.05x) and over it by night (1.26x, the rule 1.2x); the
Beastmaster is about the BladeMaster, 0.7x the Windrunner; and **the Magic Knight deals about half the BladeMaster's
damage on a neutral boss** (the rule: between the BladeMaster and the Wizard). These are rotation models, and the
Magic Knight's Stone Aegis is not counted, but that gap is too wide to be the model's.

`node build-tools/mvp-sim.mjs` now prints every fight for all ten, and the spread of each:

| Fight | Base, gear | blademaster | shadowblade | windrunner | hunter | wizard | voodoo | phantom | magicknight | moonranger | beastmaster | middle |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kobold King | 75, good | 100% 292s 87p | 100% 243s 74p | 100% 348s 101p | 100% 294s 83p | 100% 291s 90p | 100% 262s 75p | 100% 251s 87p | 100% 327s 106p | 100% 335s 98p | 100% 307s 63p | **100% 291s 85p** |
| Goblin King | 75, good | 100% 210s 73p | 100% 174s 63p | 100% 278s 88p | 100% 330s 111p | 0% 900s 383p | 100% 527s 199p | 100% 171s 68p | 100% 350s 149p | 100% 488s 179p | 100% 362s 95p | **100% 304s 100p** |
| Fire Giant | 85, good | 100% 337s 86p | 100% 283s 76p | 100% 149s 30p | 100% 231s 54p | 0% 900s 166p | 100% 447s 125p | 100% 282s 85p | 100% 453s 124p | 100% 203s 49p | 100% 301s 42p | **100% 310s 81p** |
| Ancient Treant | 85, good | 100% 460s 129p | 100% 396s 117p | 100% 162s 31p | 100% 217s 51p | 100% 350s 96p | 100% 277s 72p | 100% 385s 128p | 100% 484s 141p | 100% 196s 47p | 100% 161s 13p | **100% 313s 84p** |
| Sand Wyrm | 85, good | 100% 291s 77p | 100% 241s 64p | 100% 256s 66p | 100% 293s 80p | 100% 429s 131p | 100% 342s 95p | 100% 243s 70p | 100% 364s 104p | 100% 279s 76p | 100% 525s 112p | **100% 292s 79p** |
| Eternal Sphinx | 95, good | 100% 445s 150p | 100% 435s 170p | 100% 217s 42p | 100% 267s 73p | 100% 316s 87p | 100% 283s 78p | 100% 424s 158p | 100% 528s 185p | 100% 241s 60p | 100% 418s 78p | **100% 299s 83p** |
| Nidhogg | 95, good | 100% 322s 123p | 0% 900s 289p | 100% 92s 26p | 100% 126s 38p | 100% 165s 63p | 0% 900s 234p | 100% 292s 138p | 0% 900s 367p | 100% 106s 30p | 100% 163s 27p | **100% 243s 93p** |
| Poseidon | 95, good | 100% 259s 96p | 100% 226s 89p | 100% 141s 39p | 100% 181s 60p | 100% 343s 135p | 100% 209s 79p | 100% 230s 101p | 100% 360s 157p | 100% 166s 49p | 100% 173s 25p | **100% 218s 84p** |
| Davy Jones | 99, good | 100% 439s 138p | 100% 415s 158p | 100% 199s 42p | 100% 297s 83p | 100% 226s 69p | 100% 219s 66p | 100% 458s 183p | 100% 834s 326p | 100% 219s 54p | 0% 900s 183p | **100% 261s 76p** |
| Giant Sprout | 75, shop | 100% 222s 114p | 100% 191s 101p | 100% 138s 45p | 100% 180s 62p | 100% 247s 97p | 100% 219s 83p | 100% 173s 95p | 100% 227s 119p | 100% 158s 56p | 100% 150s 39p | **100% 205s 90p** |
| King Crab | 75, shop | 100% 218s 97p | 100% 189s 89p | 100% 146s 40p | 100% 168s 50p | 100% 246s 82p | 100% 204s 63p | 100% 181s 89p | 100% 228s 104p | 100% 159s 48p | 100% 165s 33p | **100% 197s 73p** |
| Giant Mushroom | 75, shop | 100% 189s 85p | 100% 597s 308p | 100% 127s 36p | 100% 144s 47p | 100% 259s 89p | 0% 900s 327p | 100% 159s 79p | 100% 344s 171p | 100% 160s 51p | 100% 144s 30p | **100% 224s 87p** |
| Giant Beetle | 75, shop | 100% 227s 136p | 100% 191s 115p | 100% 153s 60p | 100% 161s 63p | 100% 442s 197p | 100% 188s 79p | 100% 191s 124p | 100% 231s 141p | 100% 163s 65p | 100% 171s 55p | **100% 190s 97p** |
| Elder Willow | 75, shop | 100% 220s 104p | 100% 193s 95p | 100% 142s 44p | 100% 178s 56p | 100% 303s 108p | 100% 246s 85p | 100% 176s 88p | 100% 245s 119p | 100% 170s 55p | 100% 153s 34p | **100% 207s 90p** |
| Alpha Wolf | 75, shop | 100% 198s 142p | 100% 200s 146p | 100% 130s 59p | 100% 151s 71p | 100% 213s 103p | 100% 189s 90p | 100% 183s 142p | 100% 217s 159p | 100% 144s 66p | 100% 147s 51p | **100% 194s 97p** |
| Great Bear | 75, shop | 100% 238s 160p | 100% 207s 143p | 100% 169s 73p | 100% 152s 65p | 100% 188s 89p | 100% 189s 87p | 100% 219s 154p | 100% 382s 275p | 100% 176s 81p | 100% 193s 72p | **100% 188s 88p** |
| Cactus Lord | 75, shop | 100% 220s 102p | 100% 194s 94p | 100% 156s 49p | 100% 149s 50p | 100% 263s 101p | 100% 203s 73p | 100% 194s 101p | 100% 259s 128p | 100% 179s 61p | 100% 175s 43p | **100% 198s 84p** |
| Rainbow Runner | 75, shop | 100% 325s 207p | 100% 314s 207p | 100% 169s 65p | 100% 167s 66p | 100% 185s 78p | 100% 215s 90p | 100% 312s 211p | 100% 320s 205p | 100% 182s 74p | 100% 195s 59p | **100% 200s 84p** |
| Kraken | 75, shop | 100% 315s 166p | 100% 307s 168p | 100% 167s 50p | 100% 142s 41p | 100% 307s 117p | 100% 193s 64p | 100% 338s 198p | 100% 371s 193p | 100% 198s 63p | 100% 201s 46p | **100% 250s 91p** |
| Headless Knight | 75, shop | 100% 224s 109p | 100% 833s 453p | 100% 139s 47p | 100% 123s 36p | 100% 190s 69p | 100% 656s 252p | 100% 245s 136p | 100% 426s 235p | 100% 161s 54p | 100% 162s 38p | **100% 207s 89p** |
| Ammit | 75, shop | 100% 211s 118p | 100% 730s 443p | 100% 129s 41p | 100% 114s 38p | 100% 184s 68p | 100% 627s 237p | 100% 219s 139p | 100% 377s 218p | 100% 152s 52p | 100% 154s 36p | **100% 198s 93p** |
| Ratatoskr | 75, shop | 100% 356s 256p | 100% 391s 288p | 100% 124s 55p | 100% 127s 59p | 100% 197s 102p | 100% 188s 96p | 100% 373s 291p | 100% 363s 266p | 100% 160s 81p | 100% 162s 60p | **100% 193s 99p** |
| Fire Giant (the story's) | 90, shop | 100% 291s 70p | 100% 246s 60p | 100% 170s 31p | 100% 213s 45p | 100% 486s 136p | 100% 231s 55p | 100% 261s 77p | 100% 311s 77p | 100% 170s 35p | 100% 224s 18p | **100% 239s 58p** |
| BleepBloop (Hell) | 85, good | 100% 866s 383p | 100% 796s 356p | 100% 158s 44p | 100% 247s 85p | 100% 183s 63p | 100% 249s 88p | 100% 721s 355p | 0% 900s 357p | 100% 155s 49p | 100% 350s 84p | **100% 248s 87p** |
| Kobold Warlord (Hell) | 90, good | 100% 382s 139p | 100% 356s 132p | 100% 218s 65p | 100% 228s 72p | 100% 137s 44p | 100% 144s 45p | 100% 376s 154p | 100% 297s 104p | 100% 162s 48p | 100% 241s 45p | **100% 223s 69p** |
| Goblin Warlord (Hell) | 95, good | 100% 418s 183p | 100% 352s 155p | 100% 160s 39p | 100% 247s 84p | 100% 147s 49p | 100% 209s 75p | 100% 295s 133p | 100% 439s 217p | 100% 146s 42p | 100% 245s 44p | **100% 228s 80p** |
| Pharaoh (Hell) | 99, good | 100% 316s 111p | 0% 900s 393p | 100% 141s 33p | 100% 225s 69p | 100% 94s 24p | 100% 561s 216p | 100% 261s 107p | 0% 900s 425p | 100% 108s 21p | 100% 212s 27p | **100% 271s 90p** |

| Fight | middle of ten | loses it | hardest that wins | over 100 potions |
|---|---|---|---|---|
| Kobold King | 100% 293s 87p | - | windrunner: 1.2x the time, 1.2x the potions | windrunner, magicknight |
| Goblin King | 100% 340s 103p | wizard | voodoo: 1.6x the time, 1.9x the potions | hunter, wizard, voodoo, magicknight, moonranger |
| Fire Giant | 100% 292s 81p | wizard | magicknight: 1.6x the time, 1.5x the potions | wizard, voodoo, magicknight |
| Ancient Treant | 100% 313s 84p | - | magicknight: 1.5x the time, 1.7x the potions | blademaster, shadowblade, phantom, magicknight |
| Sand Wyrm | 100% 292s 79p | - | beastmaster: 1.8x the time, 1.4x the potions | wizard, magicknight, beastmaster |
| Eternal Sphinx | 100% 367s 83p | - | magicknight: 1.4x the time, 2.2x the potions | blademaster, shadowblade, phantom, magicknight |
| Nidhogg | 100% 229s 93p | shadowblade, voodoo, magicknight | phantom: 1.3x the time, 1.5x the potions | blademaster, shadowblade, voodoo, phantom, magicknight |
| Poseidon | 100% 218s 84p | - | magicknight: 1.7x the time, 1.9x the potions | wizard, phantom, magicknight |
| Davy Jones | 100% 356s 111p | beastmaster | magicknight: 2.3x the time, 3.0x the potions | blademaster, shadowblade, phantom, magicknight, beastmaster |
| Giant Sprout | 100% 186s 89p | - | magicknight: 1.2x the time, 1.3x the potions | blademaster, shadowblade, magicknight |
| King Crab | 100% 185s 73p | - | magicknight: 1.2x the time, 1.4x the potions | magicknight |
| Giant Mushroom | 100% 175s 82p | voodoo | shadowblade: 3.4x the time, 3.8x the potions | shadowblade, voodoo, magicknight |
| Giant Beetle | 100% 190s 97p | - | wizard: 2.3x the time, 2.0x the potions | blademaster, shadowblade, wizard, phantom, magicknight |
| Elder Willow | 100% 186s 87p | - | wizard: 1.6x the time, 1.2x the potions | blademaster, wizard, magicknight |
| Alpha Wolf | 100% 186s 97p | - | magicknight: 1.2x the time, 1.6x the potions | blademaster, shadowblade, wizard, phantom, magicknight |
| Great Bear | 100% 191s 88p | - | magicknight: 2.0x the time, 3.1x the potions | blademaster, shadowblade, phantom, magicknight |
| Cactus Lord | 100% 194s 84p | - | magicknight: 1.3x the time, 1.5x the potions | blademaster, wizard, phantom, magicknight |
| Rainbow Runner | 100% 205s 84p | - | blademaster: 1.6x the time, 2.5x the potions | blademaster, shadowblade, phantom, magicknight |
| Kraken | 100% 254s 91p | - | magicknight: 1.5x the time, 2.1x the potions | blademaster, shadowblade, wizard, phantom, magicknight |
| Headless Knight | 100% 207s 89p | - | shadowblade: 4.0x the time, 5.1x the potions | blademaster, shadowblade, voodoo, phantom, magicknight |
| Ammit | 100% 198s 93p | - | shadowblade: 3.7x the time, 4.8x the potions | blademaster, shadowblade, voodoo, phantom, magicknight |
| Ratatoskr | 100% 193s 99p | - | shadowblade: 2.0x the time, 2.9x the potions | blademaster, shadowblade, wizard, phantom, magicknight |
| Fire Giant (the story's) | 100% 239s 58p | - | wizard: 2.0x the time, 2.4x the potions | wizard |
| BleepBloop (Hell) | 100% 299s 87p | magicknight | blademaster: 2.9x the time, 4.4x the potions | blademaster, shadowblade, phantom, magicknight |
| Kobold Warlord (Hell) | 100% 235s 69p | - | phantom: 1.6x the time, 2.2x the potions | blademaster, shadowblade, phantom, magicknight |
| Goblin Warlord (Hell) | 100% 246s 80p | - | magicknight: 1.8x the time, 2.7x the potions | blademaster, shadowblade, phantom, magicknight |
| Pharaoh (Hell) | 100% 243s 88p | shadowblade, magicknight | voodoo: 2.3x the time, 2.5x the potions | blademaster, shadowblade, voodoo, phantom, magicknight |

10 matchups lost outright; 21 of 27 fights have a winning job past 1.6x the middle. The melee jobs pay most: the BladeMaster drinks over 100 White Potions in 19 of the 27 fights, the Magic
Knight in 26. The Beastmaster is the cheapest on potions nearly everywhere (its beasts take the blows), and cannot
win Davy Jones at all: its beasts' blows are Neutral, and a Ghost takes nothing from them.

### In gear a hero can have before any MVP has fallen

The tiers assume "the best gear short of MVP gear: a Lv 4 weapon at +7". That weapon is the Giant Sword, forged from
the Fire Giant's own horn; 34 of the 42 Lv 4 weapons come from MVPs (dropped, or made from what they drop), and +5 to
+7 on a Lv 4 weapon holds 9.6% of the time (60% x 40% x 40%), the weapon lost on a failure. `--reach` runs the MVP and
Hell fights in a Lv 3 weapon from the dungeons at its safe +5 instead (the Warden's Greatsword, the Dark Elven Bow,
the Dryad Staff; the same armor at +4):

| Fight | Base, gear | blademaster | shadowblade | windrunner | hunter | wizard | voodoo | phantom | magicknight | moonranger | beastmaster | middle |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kobold King | 75, reach | 100% 314s 94p | 100% 266s 85p | 100% 389s 113p | 100% 302s 88p | 100% 329s 105p | 100% 297s 88p | 100% 266s 96p | 100% 345s 111p | 100% 355s 108p | 100% 318s 64p | **100% 308s 91p** |
| Goblin King | 75, reach | 100% 229s 84p | 100% 175s 63p | 100% 348s 115p | 100% 330s 112p | 0% 900s 372p | 100% 703s 283p | 100% 189s 78p | 100% 370s 160p | 100% 617s 243p | 100% 369s 95p | **100% 339s 114p** |
| Fire Giant | 85, reach | 100% 360s 91p | 100% 312s 83p | 100% 164s 35p | 100% 239s 58p | 0% 900s 159p | 100% 505s 143p | 100% 297s 92p | 100% 481s 133p | 100% 222s 52p | 100% 314s 47p | **100% 336s 87p** |
| Ancient Treant | 85, reach | 100% 495s 141p | 100% 406s 115p | 100% 186s 38p | 100% 228s 54p | 100% 399s 112p | 100% 317s 80p | 100% 396s 128p | 100% 505s 147p | 100% 207s 49p | 100% 163s 13p | **100% 358s 96p** |
| Sand Wyrm | 85, reach | 100% 326s 90p | 100% 242s 62p | 100% 293s 79p | 100% 306s 81p | 100% 513s 162p | 100% 392s 115p | 100% 244s 71p | 100% 390s 115p | 100% 326s 93p | 100% 526s 113p | **100% 316s 86p** |
| Eternal Sphinx | 95, reach | 100% 488s 167p | 100% 497s 193p | 100% 264s 62p | 100% 277s 72p | 100% 353s 103p | 100% 343s 113p | 100% 457s 181p | 100% 547s 191p | 100% 260s 63p | 100% 451s 87p | **100% 348s 108p** |
| Nidhogg | 95, reach | 100% 351s 133p | 0% 900s 285p | 100% 107s 29p | 100% 126s 39p | 100% 191s 76p | 0% 900s 219p | 100% 323s 148p | 0% 900s 355p | 100% 118s 38p | 100% 172s 30p | **100% 271s 105p** |
| Poseidon | 95, reach | 100% 279s 113p | 100% 258s 104p | 100% 164s 48p | 100% 183s 62p | 100% 390s 156p | 100% 240s 90p | 100% 246s 110p | 100% 380s 167p | 100% 187s 66p | 100% 183s 26p | **100% 249s 97p** |
| Davy Jones | 99, reach | 100% 450s 147p | 100% 449s 167p | 100% 228s 55p | 100% 307s 86p | 100% 270s 81p | 100% 248s 76p | 100% 492s 196p | 100% 880s 357p | 100% 242s 66p | 0% 900s 180p | **100% 288s 84p** |
| BleepBloop (Hell) | 85, reach | 0% 900s 403p | 0% 900s 406p | 100% 175s 51p | 100% 276s 93p | 100% 227s 81p | 100% 330s 124p | 100% 783s 387p | 0% 900s 345p | 100% 175s 55p | 100% 370s 91p | **100% 303s 109p** |
| Kobold Warlord (Hell) | 90, reach | 100% 403s 148p | 100% 418s 160p | 100% 244s 77p | 100% 244s 77p | 100% 160s 51p | 100% 161s 51p | 100% 396s 166p | 100% 304s 108p | 100% 172s 53p | 100% 248s 45p | **100% 244s 77p** |
| Goblin Warlord (Hell) | 95, reach | 100% 493s 233p | 100% 367s 161p | 100% 189s 52p | 100% 283s 101p | 100% 193s 73p | 100% 280s 121p | 100% 335s 155p | 100% 474s 241p | 100% 175s 55p | 100% 264s 52p | **100% 281s 111p** |
| Pharaoh (Hell) | 99, reach | 100% 366s 143p | 0% 900s 366p | 100% 165s 42p | 100% 228s 70p | 100% 114s 34p | 100% 720s 283p | 100% 297s 126p | 0% 900s 428p | 100% 123s 30p | 100% 227s 26p | **100% 297s 107p** |

The middle fight is 6-23% longer and takes 6-31 more potions: six of the thirteen middles pass the 100-potion bar,
and the BladeMaster and the Shadowblade no longer win Hell's BleepBloop.

## The economy at each level (`node build-tools/econ-sim.mjs`, November 2026 review)

A same-level reference hero (the fights of `build-tools/sim.mjs`; from Base 55 a second job, its fights a third as
long) against every monster that lives on a map: what a kill sells for at the shops (the steady drops; a card or a
rare piece is a windfall, beside it), what the fight costs, and the perz an hour two ways: **drinking** every HP lost
straight back (the potion of that level: Red to Base 19, Orange to 49, White from 50), or **resting** it off for free
(HP comes back by itself, and sitting gives 5% of Max HP every 3 s).

| Monster | Lv | Blader: fight | HP lost | A kill pays | (windfall) | Potions to mend it | Perz an hour, drinking | Perz an hour, resting | Best job, resting |
|---|---|---|---|---|---|---|---|---|---|
| Bloop | 1 | 1 s | 0 (0%) | 18 | 10 | 0 perz of Red | 12,903 | 12,903 | archer 16,380 |
| Sprout | 3 | 2 s | 0 (0%) | 20 | 10 | 0 perz of Red | 11,453 | 11,453 | archer 17,595 |
| Blue Bloop | 4 | 3 s | 4 (6%) | 26 | 8 | 3 perz of Red | 11,392 | 10,575 | archer 22,950 |
| Crab | 6 | 6 s | 16 (19%) | 46 | 9 | 13 perz of Red | 11,352 | 10,004 | archer 26,013 |
| Yellow Bloop | 7 | 5 s | 10 (10%) | 24 | 0 | 7 perz of Red | 6,358 | 6,707 | archer 13,742 |
| Willow | 8 | 6 s | 11 (10%) | 35 | 6 | 8 perz of Red | 9,479 | 9,297 | archer 17,183 |
| Red Bloop | 9 | 9 s | 13 (11%) | 29 | 0 | 8 perz of Red | 5,905 | 6,770 | archer 11,654 |
| Wisp | 11 | 13 s | 118 (79%) | 37 | 12 | 101 perz of Red | -13,915 | 2,782 | archer 6,996 |
| Giant Ant | 12 | 13 s | 70 (42%) | 33 | 2 | 58 perz of Red | -5,339 | 3,646 | archer 11,199 |
| Mushroom | 14 | 22 s | 149 (74%) | 53 | 9 | 125 perz of Red | -9,971 | 3,385 | archer 9,629 |
| Red Sprout | 18 | 5 s | 84 (30%) | 32 | 9 | 73 perz of Red | -16,066 | 5,198 | assassin 9,786 |
| Mudskipper | 22 | 3 s | 74 (20%) | 43 | 10 | 104 perz of Orange | -30,693 | 9,321 | assassin 12,595 |
| Treant | 24 | 5 s | 99 (23%) | 43 | 7 | 136 perz of Orange | -36,454 | 7,845 | blader 7,845 |
| Blue Crab | 26 | 3 s | 106 (22%) | 67 | 10 | 148 perz of Orange | -41,061 | 14,129 | archer 39,186 |
| Kobold | 28 | 4 s | 133 (24%) | 85 | 47 | 186 perz of Orange | -44,638 | 15,585 | archer 21,760 |
| Beetle | 30 | 5 s | 205 (33%) | 73 | 39 | 287 perz of Orange | -83,970 | 10,727 | archer 12,823 |
| Kobold Archer | 30 | 3 s | 66 (11%) | 99 | 60 | 90 perz of Orange | 4,800 | 30,054 | archer 58,580 |
| Kobold Assassin | 33 | 4 s | 253 (34%) | 138 | 50 | 357 perz of Orange | -97,459 | 20,152 | archer 81,635 |
| Dark Mushroom | 34 | 5 s | 247 (31%) | 103 | 31 | 347 perz of Orange | -96,201 | 15,158 | archer 25,940 |
| Dark Wisp | 38 | 5 s | 318 (32%) | 89 | 71 | 447 perz of Orange | -142,339 | 13,037 | archer 24,706 |
| Goblin | 38 | 5 s | 255 (25%) | 145 | 72 | 356 perz of Orange | -83,925 | 24,397 | archer 33,382 |
| Goblin Archer | 41 | 4 s | 150 (13%) | 135 | 74 | 206 perz of Orange | -32,245 | 34,188 | assassin 41,433 |
| Fire Beetle | 42 | 7 s | 379 (30%) | 145 | 49 | 529 perz of Orange | -125,281 | 19,942 | archer 23,253 |
| Goblin Assassin | 44 | 6 s | 451 (33%) | 188 | 104 | 632 perz of Orange | -160,020 | 25,582 | archer 55,458 |
| Fire Wisp | 45 | 7 s | 490 (34%) | 111 | 64 | 685 perz of Orange | -188,314 | 14,211 | archer 21,766 |
| Snake | 46 | 6 s | 443 (30%) | 138 | 35 | 621 perz of Orange | -174,602 | 19,969 | archer 37,259 |
| Root Squirrel | 46 | 8 s | 526 (35%) | 112 | 41 | 735 perz of Orange | -187,544 | 13,675 | archer 21,749 |
| Wolf | 48 | 8 s | 653 (40%) | 200 | 34 | 916 perz of Orange | -215,697 | 22,306 | archer 39,379 |
| Bramble | 51 | 7 s | 466 (26%) | 142 | 42 | 1,204 perz of White | -350,173 | 21,788 | assassin 28,217 |
| Bear | 53 | 9 s | 645 (33%) | 212 | 46 | 1,671 perz of White | -410,366 | 26,172 | assassin 31,759 |
| Cactus | 55 | 3 s | 150 (7%) | 184 | 37 | 385 perz of White | -109,905 | 65,278 | assassin 77,159 |
| Root Serpent | 55 | 3 s | 285 (14%) | 159 | 49 | 741 perz of White | -289,808 | 40,650 | sorcerer 58,307 |
| Dune Worm | 58 | 3 s | 280 (12%) | 211 | 39 | 729 perz of White | -269,981 | 58,987 | archer 66,426 |
| Moss Golem | 58 | 4 s | 216 (9%) | 351 | 52 | 552 perz of White | -95,720 | 104,653 | assassin 118,123 |
| Dark Elf | 60 | 3 s | 265 (11%) | 236 | 63 | 683 perz of White | -223,158 | 68,201 | archer 99,017 |
| Sand Scorpion | 61 | 3 s | 289 (11%) | 226 | 42 | 747 perz of White | -260,329 | 63,571 | sorcerer 83,061 |
| Soldier Ant | 62 | 3 s | 293 (11%) | 77 | 39 | 758 perz of White | -340,570 | 21,859 | sorcerer 28,646 |
| Great Stag | 63 | 4 s | 454 (16%) | 289 | 54 | 1,181 perz of White | -394,640 | 63,272 | archer 77,944 |
| Sand Runner | 64 | 4 s | 541 (19%) | 236 | 39 | 1,408 perz of White | -498,387 | 47,552 | archer 69,124 |
| Quill Porcupine | 65 | 4 s | 359 (12%) | 189 | 26 | 925 perz of White | -325,489 | 47,702 | archer 71,695 |
| Tusk Boar | 66 | 4 s | 424 (14%) | 202 | 26 | 1,099 perz of White | -414,270 | 49,061 | assassin 56,783 |
| Scarab | 66 | 4 s | 364 (12%) | 112 | 41 | 939 perz of White | -381,608 | 29,336 | sorcerer 34,538 |
| Dryad | 66 | 3 s | 220 (7%) | 314 | 52 | 565 perz of White | -138,455 | 111,633 | archer 123,668 |
| Rot Beetle | 68 | 3 s | 265 (8%) | 401 | 57 | 682 perz of White | -147,362 | 132,007 | assassin 149,034 |
| Cliff Bandit | 69 | 4 s | 332 (10%) | 239 | 27 | 850 perz of White | -282,818 | 67,720 | assassin 76,527 |
| Blade Mantis | 71 | 4 s | 591 (17%) | 244 | 27 | 1,540 perz of White | -576,677 | 53,005 | archer 78,460 |
| Cobra | 71 | 4 s | 546 (15%) | 142 | 48 | 1,419 perz of White | -568,253 | 32,182 | sorcerer 54,632 |
| Root Warden | 72 | 3 s | 343 (9%) | 426 | 65 | 882 perz of White | -220,205 | 126,210 | sorcerer 163,590 |
| Chest Mimic | 73 | 4 s | 473 (13%) | 259 | 27 | 1,217 perz of White | -411,358 | 63,624 | assassin 79,480 |
| Glass Jelly | 74 | 3 s | 257 (7%) | 264 | 27 | 656 perz of White | -207,312 | 93,920 | assassin 105,207 |
| Merrow | 75 | 3 s | 297 (7%) | 277 | 28 | 757 perz of White | -243,168 | 91,951 | archer 107,305 |
| Mummy | 75 | 3 s | 370 (9%) | 259 | 46 | 951 perz of White | -335,646 | 76,993 | assassin 94,625 |
| Thorn Drake | 75 | 4 s | 420 (11%) | 506 | 58 | 1,081 perz of White | -267,805 | 139,588 | assassin 154,446 |
| Gale Moth | 77 | 5 s | 673 (16%) | 289 | 28 | 1,745 perz of White | -606,742 | 62,059 | archer 88,774 |
| Lamia | 78 | 3 s | 312 (7%) | 211 | 51 | 796 perz of White | -296,741 | 70,890 | archer 83,963 |
| Living Armor | 79 | 4 s | 451 (10%) | 314 | 28 | 1,157 perz of White | -378,480 | 86,081 | assassin 101,395 |
| Pharaoh's Servant | 80 | 3 s | 262 (6%) | 236 | 52 | 667 perz of White | -229,064 | 88,089 | assassin 95,328 |
| Moss Troll | 81 | 5 s | 468 (10%) | 352 | 28 | 1,190 perz of White | -350,608 | 93,171 | assassin 103,157 |
| Owlbear | 83 | 6 s | 829 (17%) | 377 | 29 | 2,144 perz of White | -669,410 | 75,279 | archer 108,016 |
| Sphinx Cub | 83 | 6 s | 1,058 (21%) | 392 | 49 | 2,753 perz of White | -866,423 | 68,046 | sorcerer 112,009 |
| Moor Witch | 84 | 4 s | 431 (8%) | 402 | 29 | 1,101 perz of White | -328,125 | 121,029 | assassin 136,113 |
| Conch | 85 | 4 s | 435 (8%) | 467 | 28 | 1,107 perz of White | -289,866 | 138,324 | assassin 158,953 |
| Puffer Fish | 86 | 3 s | 421 (8%) | 479 | 29 | 1,076 perz of White | -292,681 | 152,295 | assassin 189,060 |
| Fire Salamander | 86 | 3 s | 520 (10%) | 439 | 29 | 1,348 perz of White | -464,621 | 131,382 | assassin 145,654 |
| Sand Elemental | 86 | 3 s | 438 (8%) | 417 | 57 | 1,122 perz of White | -345,678 | 130,489 | assassin 145,773 |
| Zombie | 88 | 4 s | 442 (8%) | 506 | 29 | 1,124 perz of White | -280,645 | 152,881 | assassin 186,102 |
| Sarcophagus | 88 | 4 s | 514 (9%) | 506 | 78 | 1,312 perz of White | -352,713 | 141,378 | assassin 169,868 |
| Pirate Skeleton | 89 | 4 s | 664 (12%) | 517 | 30 | 1,711 perz of White | -522,613 | 131,765 | assassin 159,515 |
| Blowgun Pirate | 90 | 4 s | 505 (8%) | 517 | 30 | 1,287 perz of White | -349,898 | 152,655 | assassin 179,595 |
| Octopus | 92 | 4 s | 573 (9%) | 542 | 31 | 1,458 perz of White | -400,743 | 153,614 | assassin 186,182 |
| Jackal Guardian | 92 | 5 s | 715 (11%) | 289 | 64 | 1,828 perz of White | -627,321 | 72,073 | assassin 83,469 |
| Ghost | 93 | 2 s | 379 (6%) | 567 | 31 | 968 perz of White | -225,451 | 219,706 | archer 278,313 |
| Skeleton Assassin | 95 | 8 s | 1,600 (22%) | 592 | 32 | 4,128 perz of White | -1,074,609 | 91,544 | archer 165,159 |
| Falcon Sentinel | 97 | 6 s | 887 (12%) | 314 | 66 | 2,245 perz of White | -692,648 | 71,277 | archer 94,339 |
| Hydra | 98 | 5 s | 692 (9%) | 656 | 32 | 1,747 perz of White | -445,230 | 178,487 | assassin 214,512 |

67 of 75 monsters cost a Blader more in potions than they pay (drinking back every HP lost): Wisp, Giant Ant, Mushroom, Red Sprout, Mudskipper, Treant, Blue Crab, Kobold, Beetle, Kobold Assassin, Dark Mushroom, Dark Wisp, Goblin, Goblin Archer, Fire Beetle, Goblin Assassin, Fire Wisp, Snake, Root Squirrel, Wolf, Bramble, Bear, Cactus, Root Serpent, Dune Worm, Moss Golem, Dark Elf, Sand Scorpion, Soldier Ant, Great Stag, Sand Runner, Quill Porcupine, Tusk Boar, Scarab, Dryad, Rot Beetle, Cliff Bandit, Blade Mantis, Cobra, Root Warden, Chest Mimic, Glass Jelly, Merrow, Mummy, Thorn Drake, Gale Moth, Lamia, Living Armor, Pharaoh's Servant, Moss Troll, Owlbear, Sphinx Cub, Moor Witch, Conch, Puffer Fish, Fire Salamander, Sand Elemental, Zombie, Sarcophagus, Pirate Skeleton, Blowgun Pirate, Octopus, Jackal Guardian, Ghost, Skeleton Assassin, Falcon Sentinel, Hydra
Paying under 60% of the monsters near its level: Treant (43), Soldier Ant (77), Scarab (112), Cobra (142), Jackal Guardian (289), Falcon Sentinel (314)

What it says: resting, a hero earns about 3,000-15,000 perz an hour to Base 45, 50,000-150,000 from Base 55. Drinking
to keep going loses perz from Lv 11 on: a potion heals a flat amount (a White Potion 175-235 HP for 550 perz) while
a kill at Base 80 sells for about 300 perz and costs 300-600 HP. Potions are for bosses and emergencies, and one MVP
attempt (about 85 White Potions, 47,000 perz) is twenty minutes to an hour of field income at its tier. The monsters
that pay far less than those beside them are the Treant, the Soldier Ant and four of the Sphinx's Halls' monsters.

## The story's stands and fires at the hero's level (November 2026 review)

The late stands called their map's own monsters as heralds: Ember Hill's Lv 30 Beetles and Lv 11 Wisps against a Base
72 hero in Chapter 12, Lv 42-45 ones against Base 88 in Chapter 19, the Old Forest's Lv 24 Treants at Base 60. They
died to one blow and only the Meteor Rain could hurt. A step's `heraldLv` now grows each herald to the stand's level
(`mobs.js` `heraldDef`: HP by level^1.66 and ATK by level^1.2, as the dungeons' monsters grow; then a lesser one, half
the HP, and a swarm one, its ATK at 0.35 of a guard's, for they come up to six or seven at once), never above the
hero's own level: Chapter 10's stand at 60, Chapter 11's at 66, Chapter 12's at 70, Chapter 19's at 86. The two
hunts on Ember Hill (Chapters 12 and 18: 25 and 30 of those same Beetles and Wisps) are four fires each now, every
fire fed by four or five heralds of the step's level (`kind: 'fires'`, `stands.js` `tickStoryFires`).

Played in the built game with `build-tools/stand-bot.cjs` (a BladeMaster in shop gear, an Iron Sword and Chain Mail,
who fights the heralds, steps out of the danger marks it sees and drinks a White Potion below half HP):

| Stand | Hero | Held | White Potions | Of them for the heralds' blows | For the falling fire |
|---|---|---|---|---|---|
| Chapter 10, The Forest's Heart (60 s) | Base 62 | yes | 0 | (1,700 HP, healed by itself) | - |
| Chapter 11, The Rune-Spring (60 s) | Base 68 | yes | 2 | 2 | - |
| Chapter 12, The Last Fire-Ring (120 s) | Base 72 | yes | 72 | about 15 | about 57 (20 circles of 12% of Max HP) |
| Chapter 19, The Ring of Binding (120 s) | Base 88 | yes | 145 | about 50 | about 95 (19 circles of 14%) |

(The first two rows were played with the swarm factor at 0.5; the last two at 0.35.) The heralds are a real fight
now and still the smaller part of a climax: the Meteor Rain is what costs, and the bot is clumsy with it (it is hit by
about four circles in ten; a player who keeps moving takes fewer). The bot also showed that the Fire Giant, wandering
into the circle, breaks the song when a sweeping skill touches him.

## R3: the retune (November 2026 review, the owner's calls)

The owner chose: **every job can win every boss**, the hardest matchup taking at most 1.6x the middle fight's time; the
**Magic Knight raised** to sit between the BladeMaster and the Wizard; the tiers kept on the **Lv 4 +7 weapon**, with
a hero ten levels past a tier in lesser gear still able to win; and **potions that heal more with END** (+2% a point).
The tables in the two sections above are from before it.

What changed:

- **Potions** heal 2% more for every point of END (`rules.js` `potionHeal`, in the game and in every simulator). A
  Base 80 hero of END 40 heals about 1.8x per potion; a middle MVP fight now takes about 25-60 White Potions where it
  took 75-100, and the tiers' bar is 60 potions (was 100).
- **The Magic Knight**: Elemental Edge 340% ATK + 220% MATK at Lv 10 (was 200% + 135%), Elemental Nova 305% + 180% at
  Lv 5 (was 180% + 110%): 164 s on the neutral boss, between the BladeMaster's 153 s and the Wizard's 180 s
  (`second-sim --check` holds it there).
- **Shadow arts**: the Shadowblade's and the Voodoo's Shadow land 75% on a Shadow monster (any other Shadow blow 25%).
- **Beasts and oils**: a battle oil on a Beastmaster coats its beasts' claws, so it can hurt Davy Jones (a Ghost).
- **The simulated Wizard** now picks its spells by the boss's element (its own mechanic); it cast Fire at Fire bosses.
- **The tiers' middle** is the median of all ten second jobs (it was the first six).
- **Matchups** (`takes`), found by a search that raised a family running over 1.45x the middle and held back one under
  0.6x, then checked by hand that each MVP stays easiest and hardest for the families the owner gave it:

| Boss | Was | Now |
|---|---|---|
| Fire Giant | arrows 1.4, spells 0.6, beasts 0.8 | arrows 1.2, spells 1.05, beasts 0.8 |
| Goblin King (and his shadows) | blades 1.4, arrows 0.7, spells 0.7 | blades 1.2, arrows 0.8, spells 1.1 |
| Ancient Treant | blades 0.6, spells 1.1, beasts 1.6 | blades 0.8, arrows 0.95, spells 1.1, beasts 1.55 |
| Sand Wyrm | blades 1.3, arrows 0.9, beasts 0.6 | blades 1.3, arrows 0.9, spells 1.05, beasts 0.9 |
| Eternal Sphinx | spells 1.3, blades 0.85, beasts 0.7 | spells 1.3, blades 0.95, beasts 0.75 |
| Nidhogg | arrows 1.3, blades 0.75 | arrows 1.15, blades 1.1 |
| Poseidon | beasts 1.3, spells 0.75 | beasts 1.3, spells 0.85 |
| Davy Jones | spells 1.2, blades 0.85 | spells 1.2, blades 0.95 |
| Giant Mushroom, Elder Willow | none | spells 1.5; spells 1.15 |
| Rainbow Runner, Kraken | none | blades 1.2; blades 1.2, spells 1.1 |
| Headless Knight, Ratatoskr | none | blades 1.05, arrows 0.95; blades 1.6 |
| BleepBloop (Hell) | blades 0.7, spells 1.3, beasts 0.8 | blades 1.25, arrows 0.6, spells 1.15, beasts 0.8 |
| Kobold Warlord (Hell) | arrows 0.6, spells 1.3 | arrows 0.6, spells 1.1, blades 1.25 |
| Goblin Warlord (Hell) | blades 1.3, arrows 0.8, spells 0.8 | blades 1.6, arrows 0.8, spells 0.8 |
| Pharaoh (Hell) | blades 1.2, spells 1.2, arrows 0.7, beasts 0.8 | blades 1.35, spells 1.05, arrows 0.55, beasts 0.8 |

No boss's ATK or HP had to move: every middle stayed inside 150-400 s and the new 60-potion bar.

`node build-tools/second-sim.mjs`:

```
blademaster   152 s    1974 a second
shadowblade   134 s    2234 a second
windrunner    104 s    2885 a second
hunter        116 s    2595 a second
wizard        193 s    1557 a second
voodoo        165 s    1822 a second
phantom       131 s    2284 a second
magicknight   164 s    1833 a second
moonranger    115 s    2603 a second
moonrangerNight   82 s    3644 a second
beastmaster   147 s    2037 a second

Shadowblade / BladeMaster 1.13 · Hunter / Windrunner 0.90 · Voodoo / Wizard 1.17
Phantom / BladeMaster 1.16 (the rule: 1.2-1.4) · Moon Ranger / Windrunner by day 0.90 (1.05), by night 1.26 (1.2) · Magic Knight / BladeMaster 0.93 (between the BladeMaster and the Wizard) · Beastmaster / Windrunner 0.71 (about the other bow jobs)
```

`node build-tools/mvp-sim.mjs` (all ten, then each fight's spread):

| Fight | Base, gear | blademaster | shadowblade | windrunner | hunter | wizard | voodoo | phantom | magicknight | moonranger | beastmaster | middle |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kobold King | 75, good | 100% 292s 50p | 100% 243s 43p | 100% 348s 58p | 100% 294s 48p | 100% 279s 53p | 100% 258s 45p | 100% 248s 56p | 100% 182s 29p | 100% 335s 58p | 100% 307s 30p | **100% 285s 49p** |
| Goblin King | 75, good | 100% 256s 56p | 100% 204s 46p | 100% 229s 40p | 100% 293s 54p | 100% 368s 80p | 100% 370s 78p | 100% 209s 56p | 100% 163s 32p | 100% 337s 67p | 100% 350s 42p | **100% 274s 55p** |
| Fire Giant | 85, good | 100% 337s 47p | 100% 283s 42p | 100% 173s 20p | 100% 263s 36p | 100% 404s 66p | 100% 365s 55p | 100% 282s 51p | 100% 241s 31p | 100% 214s 29p | 100% 321s 21p | **100% 283s 39p** |
| Ancient Treant | 85, good | 100% 354s 51p | 100% 285s 42p | 100% 173s 19p | 100% 216s 27p | 100% 331s 52p | 100% 277s 41p | 100% 286s 53p | 100% 218s 27p | 100% 208s 29p | 100% 171s 7p | **100% 247s 35p** |
| Sand Wyrm | 85, good | 100% 291s 42p | 100% 241s 35p | 100% 256s 36p | 100% 293s 44p | 100% 379s 67p | 100% 341s 55p | 100% 243s 43p | 100% 194s 26p | 100% 280s 42p | 100% 393s 33p | **100% 285s 42p** |
| Eternal Sphinx | 95, good | 100% 412s 70p | 100% 395s 74p | 100% 223s 28p | 100% 269s 34p | 100% 285s 44p | 100% 270s 41p | 100% 388s 88p | 100% 259s 34p | 100% 241s 33p | 100% 398s 28p | **100% 277s 38p** |
| Nidhogg | 95, good | 100% 185s 30p | 100% 232s 48p | 100% 105s 15p | 100% 125s 20p | 100% 181s 37p | 100% 203s 44p | 100% 171s 42p | 100% 198s 35p | 100% 116s 23p | 100% 173s 12p | **100% 177s 33p** |
| Poseidon | 95, good | 100% 259s 50p | 100% 226s 46p | 100% 141s 20p | 100% 181s 31p | 100% 274s 58p | 100% 202s 40p | 100% 225s 58p | 100% 177s 32p | 100% 162s 27p | 100% 172s 9p | **100% 192s 36p** |
| Davy Jones | 99, good | 100% 391s 61p | 100% 335s 57p | 100% 199s 22p | 100% 283s 41p | 100% 243s 38p | 100% 195s 28p | 100% 398s 90p | 100% 392s 62p | 100% 219s 28p | 100% 311s 18p | **100% 297s 40p** |
| Giant Sprout | 75, shop | 100% 222s 66p | 100% 191s 59p | 100% 138s 26p | 100% 180s 36p | 100% 233s 54p | 100% 219s 49p | 100% 175s 63p | 100% 134s 38p | 100% 157s 31p | 100% 150s 17p | **100% 177s 44p** |
| King Crab | 75, shop | 100% 218s 56p | 100% 189s 52p | 100% 146s 23p | 100% 168s 29p | 100% 244s 50p | 100% 202s 37p | 100% 181s 56p | 100% 132s 32p | 100% 159s 28p | 100% 163s 17p | **100% 175s 35p** |
| Giant Mushroom | 75, shop | 100% 189s 49p | 100% 215s 60p | 100% 127s 22p | 100% 145s 25p | 100% 184s 38p | 100% 237s 49p | 100% 159s 49p | 100% 174s 45p | 100% 141s 26p | 100% 144s 15p | **100% 166s 42p** |
| Giant Beetle | 75, shop | 100% 227s 78p | 100% 191s 67p | 100% 153s 35p | 100% 161s 37p | 100% 180s 48p | 100% 188s 48p | 100% 192s 80p | 100% 131s 43p | 100% 163s 37p | 100% 171s 26p | **100% 176s 46p** |
| Elder Willow | 75, shop | 100% 220s 60p | 100% 193s 55p | 100% 142s 25p | 100% 178s 32p | 100% 250s 53p | 100% 233s 48p | 100% 176s 57p | 100% 139s 36p | 100% 163s 31p | 100% 153s 16p | **100% 177s 42p** |
| Alpha Wolf | 75, shop | 100% 198s 82p | 100% 200s 85p | 100% 130s 34p | 100% 151s 41p | 100% 204s 62p | 100% 188s 55p | 100% 184s 91p | 100% 127s 50p | 100% 144s 39p | 100% 148s 25p | **100% 167s 53p** |
| Great Bear | 75, shop | 100% 238s 92p | 100% 207s 83p | 100% 169s 42p | 100% 152s 38p | 100% 201s 59p | 100% 189s 52p | 100% 219s 100p | 100% 207s 79p | 100% 176s 47p | 100% 194s 33p | **100% 197s 56p** |
| Cactus Lord | 75, shop | 100% 220s 59p | 100% 194s 55p | 100% 156s 29p | 100% 149s 29p | 100% 257s 60p | 100% 202s 45p | 100% 194s 64p | 100% 140s 36p | 100% 179s 36p | 100% 177s 22p | **100% 187s 41p** |
| Rainbow Runner | 75, shop | 100% 273s 99p | 100% 274s 102p | 100% 169s 37p | 100% 170s 38p | 100% 189s 49p | 100% 215s 54p | 100% 269s 118p | 100% 161s 53p | 100% 182s 43p | 100% 195s 28p | **100% 192s 51p** |
| Kraken | 75, shop | 100% 253s 69p | 100% 235s 67p | 100% 167s 29p | 100% 141s 24p | 100% 272s 61p | 100% 188s 38p | 100% 281s 102p | 100% 158s 37p | 100% 192s 36p | 100% 199s 21p | **100% 195s 38p** |
| Headless Knight | 75, shop | 100% 218s 60p | 100% 293s 92p | 100% 146s 28p | 100% 121s 23p | 100% 209s 47p | 100% 222s 47p | 100% 223s 78p | 100% 212s 57p | 100% 167s 34p | 100% 167s 19p | **100% 210s 47p** |
| Ammit | 75, shop | 100% 211s 68p | 100% 278s 96p | 100% 129s 24p | 100% 120s 23p | 100% 200s 45p | 100% 209s 46p | 100% 220s 89p | 100% 191s 53p | 100% 152s 30p | 100% 154s 17p | **100% 196s 46p** |
| Ratatoskr | 75, shop | 100% 222s 87p | 100% 243s 101p | 100% 124s 31p | 100% 131s 36p | 100% 200s 64p | 100% 188s 59p | 100% 230s 111p | 100% 157s 61p | 100% 159s 46p | 100% 160s 28p | **100% 174s 60p** |
| Fire Giant (the story's) | 90, shop | 100% 291s 37p | 100% 246s 32p | 100% 170s 17p | 100% 213s 24p | 100% 192s 25p | 100% 231s 31p | 100% 261s 47p | 100% 177s 19p | 100% 170s 18p | 100% 227s 9p | **100% 220s 25p** |
| BleepBloop (Hell) | 85, good | 100% 490s 115p | 100% 459s 104p | 100% 260s 43p | 100% 299s 58p | 100% 226s 46p | 100% 264s 53p | 100% 405s 115p | 100% 399s 88p | 100% 213s 39p | 100% 423s 46p | **100% 349s 56p** |
| Kobold Warlord (Hell) | 90, good | 100% 309s 54p | 100% 327s 64p | 100% 218s 35p | 100% 216s 36p | 100% 134s 23p | 100% 155s 26p | 100% 306s 73p | 100% 165s 24p | 100% 176s 29p | 100% 244s 19p | **100% 217s 32p** |
| Goblin Warlord (Hell) | 95, good | 100% 332s 72p | 100% 314s 70p | 100% 160s 20p | 100% 250s 42p | 100% 160s 31p | 100% 210s 39p | 100% 246s 64p | 100% 146s 24p | 100% 155s 23p | 100% 244s 18p | **100% 227s 35p** |
| Pharaoh (Hell) | 99, good | 100% 277s 47p | 100% 320s 65p | 100% 173s 21p | 100% 232s 38p | 100% 112s 19p | 100% 193s 32p | 100% 246s 61p | 100% 231s 38p | 100% 139s 18p | 100% 231s 13p | **100% 231s 35p** |

| Fight | middle of ten | loses it | hardest that wins | over 100 potions |
|---|---|---|---|---|
| Kobold King | 100% 285s 49p | - | windrunner: 1.2x the time, 1.2x the potions | - |
| Goblin King | 100% 274s 55p | - | wizard: 1.3x the time, 1.5x the potions | wizard, voodoo, moonranger |
| Fire Giant | 100% 283s 39p | - | wizard: 1.4x the time, 1.7x the potions | wizard |
| Ancient Treant | 100% 247s 35p | - | blademaster: 1.4x the time, 1.5x the potions | - |
| Sand Wyrm | 100% 285s 42p | - | wizard: 1.3x the time, 1.6x the potions | wizard |
| Eternal Sphinx | 100% 277s 38p | - | phantom: 1.4x the time, 2.3x the potions | blademaster, shadowblade, phantom |
| Nidhogg | 100% 177s 33p | - | shadowblade: 1.3x the time, 1.5x the potions | - |
| Poseidon | 100% 192s 36p | - | wizard: 1.4x the time, 1.6x the potions | - |
| Davy Jones | 100% 297s 40p | - | phantom: 1.3x the time, 2.3x the potions | blademaster, phantom, magicknight |
| Giant Sprout | 100% 177s 44p | - | blademaster: 1.3x the time, 1.5x the potions | blademaster, phantom |
| King Crab | 100% 175s 35p | - | blademaster: 1.3x the time, 1.6x the potions | - |
| Giant Mushroom | 100% 166s 42p | - | shadowblade: 1.3x the time, 1.4x the potions | - |
| Giant Beetle | 100% 176s 46p | - | blademaster: 1.3x the time, 1.7x the potions | blademaster, shadowblade, phantom |
| Elder Willow | 100% 177s 42p | - | wizard: 1.4x the time, 1.3x the potions | - |
| Alpha Wolf | 100% 167s 53p | - | phantom: 1.1x the time, 1.7x the potions | blademaster, shadowblade, wizard, phantom |
| Great Bear | 100% 197s 56p | - | phantom: 1.1x the time, 1.8x the potions | blademaster, shadowblade, phantom, magicknight |
| Cactus Lord | 100% 187s 41p | - | wizard: 1.4x the time, 1.5x the potions | phantom |
| Rainbow Runner | 100% 192s 51p | - | phantom: 1.4x the time, 2.3x the potions | blademaster, shadowblade, phantom |
| Kraken | 100% 195s 38p | - | phantom: 1.4x the time, 2.7x the potions | blademaster, shadowblade, wizard, phantom |
| Headless Knight | 100% 210s 47p | - | shadowblade: 1.4x the time, 2.0x the potions | shadowblade, phantom |
| Ammit | 100% 196s 46p | - | shadowblade: 1.4x the time, 2.1x the potions | blademaster, shadowblade, phantom |
| Ratatoskr | 100% 174s 60p | - | phantom: 1.3x the time, 1.9x the potions | blademaster, shadowblade, wizard, phantom, magicknight |
| Fire Giant (the story's) | 100% 220s 25p | - | phantom: 1.2x the time, 1.9x the potions | - |
| BleepBloop (Hell) | 100% 349s 56p | - | blademaster: 1.4x the time, 2.1x the potions | blademaster, shadowblade, phantom, magicknight |
| Kobold Warlord (Hell) | 100% 217s 32p | - | phantom: 1.4x the time, 2.3x the potions | shadowblade, phantom |
| Goblin Warlord (Hell) | 100% 227s 35p | - | blademaster: 1.5x the time, 2.1x the potions | blademaster, shadowblade, phantom |
| Pharaoh (Hell) | 100% 231s 35p | - | shadowblade: 1.4x the time, 1.9x the potions | shadowblade, phantom |

0 matchups lost outright; 0 of 27 fights have a job past 1.6x the middle's time, 18 one past 1.6x its potions (the frail jobs, by design). The potion spread is left: the Phantom (much squishier by the owner's call) and the blades take every swing that
the bows and casters kite away, so they drink up to about 3x the middle. `mvp-sim --check` holds the time spread, no
lost matchup, the tiers, and the lesser-gear rule (each MVP and Hell boss falls to a hero ten levels past its tier with
a Lv 3 weapon at +5).

The economy with END healing (`node build-tools/econ-sim.mjs`): 63 of the 75 field and dungeon monsters (68 before)
still cost a Blader more in potions than they pay when every HP lost is drunk straight back (a Base 80 kill sells for
about 300 perz); resting stays free, and earns 50,000-150,000 perz an hour from Base 55.

## R5: fields that teach (November 2026 review, the owner's calls)

- **Wind-ups** (`TELL`): 17 field monster kinds wind up a blow of 1.4-1.5x on a marked spot (step out). `build-tools/sim.mjs`
  models them (half stepped out of). The Blue Crab and the Dark Mushroom were to get one too, but with it a same-level
  Sorcerer fell under its 85% floor against them (66% and 52%): they are the Sorcerer's weak spots already, so they
  have none.
- **Pack leaders** (`CHIEFS`): Barley Field and Wolf Hills (Wolves), Stone Field (Kobolds), Burnt Wood (Goblins), the
  Great Desert (Soldier Ants), the Tide Cliffs (Tusk Boars), Beacon Moor (Owlbears). Played in the built game: the
  Wolf's leader (8,400 HP to a Wolf's 2,800) called the Wolves within 10 paces as it came.
- **Elements at Base 45-64**: Earth was 10 of 15 kinds; now Earth 4, Wind 5, Fire 3, Shadow 2, Neutral 1. The Snake and
  the Root Serpent were tried as Water first, but the Sorcerer (whose early spells are weak on Water) fell to 73-79%
  against them, so they are Shadow and Wind; the three Fire kinds give Water weapons a target.

## R6: the late game (November 2026 review, the owner's calls)

- **Hafnvik's quests**: 23 of them, Base 66-97 (quests from Base 70 went from 7 to 28), in kill, fetch, search,
  defend, quiz, deliver and visit; kill and fetch are 65% of all 145 quests. Rewards follow the curve of the other
  late quests (420,000 EXP at Base 66 to 2,400,000 at 97, before the x2 quest rate).
- **The Base 85 gate** (Chapter 16): the story alone brings a hero to about Base 76 there; with Hafnvik's quests under
  85 to about 84, and the fights on the way do the rest. The gate stays at 85.
- **The Deep Halls** pay 20% more EXP a floor (`DEPTH.exp`): a Base 98 level took about 1,367 kills of the best monster
  in the game; from floor 10 it takes about 400, from floor 20 about 230.
- **Weekly hunts** already choose monsters within 8 levels of the hero from every field and dungeon, the coast and the
  Galleon included.


## SP over a long fight (`node build-tools/sp-sim.mjs`, November 2026 review, measured; nothing retuned yet)

`second-sim` and `mvp-sim` leave SP out ("potions"), and the stand bot fills SP back up. Counted, at Base 80 against a
boss that does not fall (Max SP to start, the regen every 8 s, a skill only with the SP for it, a plain blow otherwise):

| Job (Base 80) | Max SP | Regen (SP / 8 s) | Rotation wants (SP / min) | Regen gives (SP / min) | Dry after | Blue Potions / min to keep it | Damage over 5 min with no Blue Potions |
|---|---|---|---|---|---|---|---|
| blademaster | 275 | 4 | 1307 | 30 | 13 s | 25.5 | 23% |
| windrunner | 377 | 9 | 3135 | 68 | 7 s | 61.4 | 17% |

So the rotations every balance number rests on can't be kept up for long: a BladeMaster spends its SP in 13 s and
would drink about 25 Blue Potions a minute to keep going (a Windrunner, whose Double Shot is a skill on every
shot, about 61); with none it deals about a fifth of the damage the sims count. The tiers (3–6 minute MVP fights on
60 White Potions) are measured on that damage. This is the owner's call (more regen, cheaper skills, an SP item, or
SP counted in the sims and the bosses retuned to it); the casters (high KNL) are not in the table yet.
