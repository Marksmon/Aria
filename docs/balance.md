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
| Gel Thief | 3 | 100% win · 4 s · 95% HP left | 100% win · 8 s · 82% HP left | 100% win · 1 s · 100% HP left | 100% win · 3 s · 93% HP left |
| Sprout | 3 | 100% win · 2 s · 100% HP left | 100% win · 4 s · 100% HP left | 100% win · 0 s · 100% HP left | 100% win · 2 s · 93% HP left |
| Blue Bloop | 4 | 100% win · 3 s · 94% HP left | 100% win · 8 s · 77% HP left | 100% win · 0 s · 100% HP left | 100% win · 3 s · 94% HP left |
| Crab | 6 | 100% win · 6 s · 83% HP left | 100% win · 15 s · 40% HP left | 100% win · 2 s · 100% HP left | 100% win · 5 s · 82% HP left |
| Yellow Bloop | 7 | 100% win · 5 s · 90% HP left | 100% win · 14 s · 62% HP left | 100% win · 2 s · 100% HP left | 100% win · 5 s · 91% HP left |
| Willow | 8 | 100% win · 7 s · 90% HP left | 100% win · 18 s · 59% HP left | 100% win · 2 s · 100% HP left | 100% win · 6 s · 93% HP left |
| Red Bloop | 9 | 100% win · 9 s · 89% HP left | 99% win · 23 s · 33% HP left | 100% win · 5 s · 96% HP left | 100% win · 7 s · 85% HP left |
| Wisp | 11 | 86% win · 13 s · 21% HP left | 0% win · 12 s · boss at 58% | 100% win · 6 s · 79% HP left | 89% win · 11 s · 26% HP left |
| Giant Ant | 12 | 100% win · 12 s · 58% HP left | 100% win · 9 s · 56% HP left | 100% win · 5 s · 93% HP left | 100% win · 5 s · 83% HP left |
| Mushroom | 14 | 99% win · 22 s · 26% HP left | 100% win · 10 s · 55% HP left | 100% win · 9 s · 82% HP left | 100% win · 9 s · 71% HP left |
| Lantern Wisp | 16 | 0% win · 18 s · boss at 33% | 0% win · 12 s · boss at 39% | 77% win · 17 s · 21% HP left | 39% win · 15 s · 0% HP left |
| Red Sprout | 18 | 97% win · 5 s · 75% HP left | 100% win · 6 s · 54% HP left | 100% win · 4 s · 88% HP left | 100% win · 2 s · 88% HP left |
| Sea Bloop | 22 | 100% win · 3 s · 80% HP left | 66% win · 10 s · 6% HP left | 100% win · 3 s · 100% HP left | 100% win · 2 s · 88% HP left |
| Treant | 24 | 100% win · 5 s · 77% HP left | 100% win · 8 s · 37% HP left | 100% win · 8 s · 71% HP left | 100% win · 6 s · 64% HP left |
| Blue Crab | 26 | 100% win · 3 s · 78% HP left | 45% win · 8 s · 0% HP left | 100% win · 2 s · 100% HP left | 100% win · 2 s · 87% HP left |
| Kobold | 28 | 100% win · 4 s · 76% HP left | 100% win · 4 s · 76% HP left | 100% win · 3 s · 85% HP left | 100% win · 4 s · 74% HP left |
| Beetle | 30 | 100% win · 5 s · 67% HP left | 100% win · 4 s · 77% HP left | 100% win · 4 s · 83% HP left | 100% win · 4 s · 74% HP left |
| Kobold Archer | 30 | 100% win · 3 s · 90% HP left | 100% win · 2 s · 100% HP left | 100% win · 2 s · 100% HP left | 100% win · 2 s · 89% HP left |
| Kobold Assassin | 33 | 98% win · 4 s · 68% HP left | 100% win · 2 s · 78% HP left | 100% win · 2 s · 100% HP left | 100% win · 3 s · 73% HP left |
| Dark Mushroom | 34 | 100% win · 5 s · 69% HP left | 70% win · 9 s · 10% HP left | 100% win · 4 s · 86% HP left | 100% win · 4 s · 76% HP left |
| Dark Wisp | 38 | 100% win · 6 s · 67% HP left | 99% win · 7 s · 23% HP left | 100% win · 3 s · 88% HP left | 99% win · 4 s · 70% HP left |
| Goblin | 38 | 100% win · 5 s · 75% HP left | 100% win · 7 s · 25% HP left | 100% win · 5 s · 86% HP left | 100% win · 4 s · 70% HP left |
| Goblin Archer | 41 | 100% win · 4 s · 88% HP left | 100% win · 5 s · 68% HP left | 100% win · 3 s · 89% HP left | 100% win · 3 s · 90% HP left |
| Fire Beetle | 42 | 100% win · 7 s · 70% HP left | 100% win · 7 s · 21% HP left | 100% win · 6 s · 75% HP left | 100% win · 5 s · 68% HP left |
| Goblin Assassin | 44 | 99% win · 6 s · 66% HP left | 100% win · 4 s · 62% HP left | 100% win · 3 s · 89% HP left | 99% win · 4 s · 70% HP left |
| Fire Wisp | 45 | 98% win · 7 s · 66% HP left | 100% win · 6 s · 37% HP left | 100% win · 4 s · 87% HP left | 99% win · 5 s · 62% HP left |
| Snake | 46 | 100% win · 6 s · 71% HP left | 100% win · 4 s · 80% HP left | 100% win · 4 s · 88% HP left | 100% win · 4 s · 69% HP left |
| Wolf | 48 | 99% win · 8 s · 59% HP left | 100% win · 4 s · 62% HP left | 100% win · 4 s · 87% HP left | 99% win · 5 s · 61% HP left |
| Bear | 53 | 100% win · 9 s · 68% HP left | 100% win · 8 s · 28% HP left | 100% win · 12 s · 55% HP left | 100% win · 6 s · 72% HP left |
| Giant Sprout | 55 | 0% win · 86 s · boss at 89% · 20 pots | 0% win · 60 s · boss at 81% · 20 pots | 0% win · 73 s · boss at 91% · 20 pots | 0% win · 55 s · boss at 91% · 20 pots |
| Elder Willow | 55 | 0% win · 93 s · boss at 87% · 20 pots | 0% win · 66 s · boss at 81% · 20 pots | 0% win · 83 s · boss at 89% · 20 pots | 0% win · 59 s · boss at 90% · 20 pots |
| Cactus | 55 | 100% win · 8 s · 78% HP left | 100% win · 5 s · 83% HP left | 100% win · 8 s · 80% HP left | 100% win · 5 s · 83% HP left |
| King Crab | 58 | 0% win · 84 s · boss at 90% · 20 pots | 0% win · 63 s · boss at 90% · 20 pots | 0% win · 81 s · boss at 92% · 20 pots | 0% win · 55 s · boss at 93% · 20 pots |
| Dune Worm | 58 | 100% win · 9 s · 66% HP left | 100% win · 4 s · 82% HP left | 100% win · 7 s · 71% HP left | 100% win · 7 s · 67% HP left |
| Giant Mushroom | 60 | 0% win · 76 s · boss at 91% · 20 pots | 0% win · 52 s · boss at 93% · 20 pots | 0% win · 66 s · boss at 93% · 20 pots | 0% win · 48 s · boss at 94% · 20 pots |
| Cactus Lord | 60 | 0% win · 57 s · boss at 96% · 20 pots | 0% win · 42 s · boss at 93% · 20 pots | 0% win · 56 s · boss at 96% · 20 pots | 0% win · 38 s · boss at 97% · 20 pots |
| Sand Scorpion | 61 | 100% win · 9 s · 66% HP left | 100% win · 4 s · 82% HP left | 100% win · 9 s · 62% HP left | 100% win · 7 s · 69% HP left |
| Giant Beetle | 62 | 0% win · 72 s · boss at 93% · 20 pots | 0% win · 54 s · boss at 90% · 20 pots | 0% win · 70 s · boss at 95% · 20 pots | 0% win · 47 s · boss at 95% · 20 pots |
| Soldier Ant | 62 | 100% win · 10 s · 68% HP left | 100% win · 4 s · 83% HP left | 100% win · 11 s · 52% HP left | 100% win · 6 s · 76% HP left |
| Alpha Wolf | 64 | 0% win · 67 s · boss at 94% · 20 pots | 0% win · 52 s · boss at 85% · 20 pots | 0% win · 65 s · boss at 93% · 20 pots | 0% win · 45 s · boss at 95% · 20 pots |
| Sand Runner | 64 | 95% win · 13 s · 43% HP left | 100% win · 7 s · 36% HP left | 100% win · 7 s · 66% HP left | 95% win · 8 s · 55% HP left |
| Rainbow Runner | 64 | 0% win · 47 s · boss at 97% · 20 pots | 0% win · 31 s · boss at 95% · 20 pots | 0% win · 42 s · boss at 97% · 20 pots | 0% win · 30 s · boss at 98% · 20 pots |
| Great Bear | 66 | 0% win · 68 s · boss at 94% · 20 pots | 0% win · 49 s · boss at 92% · 20 pots | 0% win · 63 s · boss at 95% · 20 pots | 0% win · 45 s · boss at 95% · 20 pots |

## Mini-bosses at their hinted level, 20 Orange Potions

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
Blue Crab, and the Elder Willow (Lv 23) is a mini-boss like the Giant Sprout (about a minute at its
hinted Base 26 with 20 Orange Potions).
The predators' lands (Snake 46, Wolf 48, Bear 53) sit on the same curve as the goblins and fire
beasts; the Sorcerer is shorter against the Bear, which is Neutral and hits hard. Their mini-bosses,
the Alpha Wolf (51) and the Great Bear (56), fit between the Giant Beetle and the MVPs; the Alpha's
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
the circles does. Mini-bosses are unchanged: they are made for first jobs at their level.

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
(steps out of circles, guards first, potions as needed):

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
drop at 1% on every difficulty; the cores (3/9/27/81 a clear) buy them from the raid's guide.

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
