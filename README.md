# Aria

A small 2.5D open-world fantasy RPG for phones, in the spirit of old-school Ragnarok Online:
painted 2D sprites standing in a 3D world. You camp in the valley of Aria, travel from map to map,
fight monsters and bosses, sell their loot for perz in the walled city of Steinborg and have
better gear made from what they drop.

Built with Three.js + Vite, wrapped as an Android app with Capacitor. The player, monsters and
villagers are PixelLab pixel-art sprites in a Ragnarok Online-like style; the world is painted in
code and all sound is synthesized, so the game ships as one offline HTML file.

## Get the APK

Every push to `main` builds a new APK automatically (about 3–5 minutes).
Download it from **Releases → "Aria — latest build"** → `Aria.apk`.
New builds install over old ones as an **update**: they share the signing key, and each build's
version (1.0.*build number*, shown on the title screen) is higher than the last. Just open the new
APK and tap **Update**; don't uninstall first, or your save goes with the old app.

## Controls

Ragnarok-style: no on-screen controller. Landscape.

| Touch | Desktop |
|---|---|
| Tap the ground: walk there (tile by tile) | Click |
| Hold a finger on the ground: keep walking towards it; move the finger to steer | Hold the mouse button |
| Tap a monster: walk up and keep attacking it | Click |
| Tap an item on the ground: pick it up | Click |
| Tap a person, the chest (camp or Steinborg storage) or the tent: talk / open / rest | Click |
| Step onto a glowing portal: go to the next map | |
| Tap the minimap: the big map. People, portals and monsters are numbered, and named in a list on the left (mini-bosses and MVPs say if they are out). Tap a person, a portal or open ground, on the map or in the list, and the hero walks there; monsters are only for reading | Click |
| Hotbar (bottom): tap a slot to use a skill or item; the button at its end flips between 3 pages | 1–6 · Tab: next page |
| Drag active skills (Skills window) and usable items (Items window) onto the hotbar; drag a slot off to clear it | Drag |
| Drag one finger: turn the camera · pinch: zoom | Drag or Q / E · mouse wheel |
| Window buttons under the HP / SP box: Status, Equip, Items, Skills | Alt+A, Alt+Q, Alt+E (or I / B), Alt+S · Esc closes |

The hotbar starts empty. Windows are small, can be dragged anywhere by their title bar, and the
game keeps running while they are open. A monster's name shows over it when the mouse is on it,
and in gold over the one you are fighting. Rare drops glow gold on the ground.

## Maps

Eldrun Camp and Steinborg are safe town maps; everything else is a 64×64 field. Only two
portals leave the camp (Moss Field to the north, Fen Shore to the west); every other map is
reached by travelling on. The fields have plain names; the towns' are Old Norse in style.

```
                               Serpent Wood
                                  |
                              Burnt Wood
                                  |
                              Galdrheim    Steinborg - Birch Grove
                                  |            |           |
                                  |        Moss Field  -  Dark Dale  -  Black Wood
                                  |            |           |           |
Coal Pit - Stone Field - Salt Bay - Fen Shore - Eldrun Camp   Ember Hill  -  Ash Heath
```

Goblin country (Burnt Wood, then Serpent Wood) lies beyond Galdrheim's north gate; the kobolds' hills
(Stone Field, then Coal Pit) lie west of Salt Bay, along the road round its bay.

| Map | Level | Monsters | Boss |
|---|---|---|---|
| Moss Field | 1–6 | Slime (Lv 1), Sprout (3) | |
| Fen Shore | 5–12 | Blue Slime (6, splits), Crab (9) | |
| Dark Dale | 12–18 | Mushroom (14, slowing spores) | |
| Birch Grove | 16–26 | Red Sprout (18), Sprout, Slime | Giant Sprout (25) |
| Salt Bay | 20–32 | Sea Slime (22), Blue Crab (26), Crab | King Crab (32) |
| Ember Hill | 28–36 | Beetle (30) | **Fire Giant (60, MVP)** |
| Black Wood | 32–42 | Dark Mushroom (34), Dark Wisp (38), Mushroom | Giant Mushroom (40) |
| Ash Heath | 40–50 | Fire Beetle (42), Fire Wisp (45), Beetle | Giant Beetle (48) |
| Stone Field | 28–34 | Kobold (28), Kobold Archer (30), Kobold Assassin (33) | |
| Coal Pit | 30–50 | Kobold Assassin, Kobold, Kobold Archer | **Kobold King (50, MVP)** |
| Burnt Wood | 38–44 | Goblin (38), Goblin Archer (41), Goblin Assassin (44) | |
| Serpent Wood | 40–55 | Goblin Assassin, Goblin, Goblin Archer | **Goblin King (55, MVP)** |
| Any field in the valley, more at night (Moss Field only at night) | | Wisp (11) | |

**Passive monsters.** Like most of Ragnarok's field monsters, they leave you alone until you hit
them; then they fight back for a while. Only the Dark Wisps, the fire beasts of Ash Heath, the
kobolds and goblins, the mini-bosses and the MVPs attack on sight. A Sprout runs away, and fights only when
cornered.

The new lands' monsters are palette swaps of the valley's, like Ragnarok's slime family. No
health bars: monsters flash white when hit and wobble when nearly beaten. They respawn 60 s
after they fall, twice as fast at night.

**Kobolds and goblins** (hand-drawn in code for now, `src/painted.js`) come in three kinds:
warriors close in and hit hard, **archers** keep about five paces away and shoot arrows (step in
and they back off), and **assassins** are quick, dart the last few steps and sometimes strike twice.
They drop Kobold Fur and Goblin Teeth, ores for refining, and now and then Hard Ore or Armor Ore.

**Bosses.** Each new field has a mini-boss: big, slow, stomping the ground around it, back 5–8
minutes after it falls. Like the MVPs, each calls 2 guards of its own kind below 60% HP (Red
Sprouts, Blue Crabs, Dark Mushrooms, Fire Beetles), and again 2 minutes after the last one falls. They drop a rare material (30%) that forges the best gear, and a rare
equip of their own (2–3%). Their guards are lesser servants of their kind (half the HP, 60% of
the ATK): cut them down first. At the level their quests suggest (Giant Sprout 28, King Crab 34,
Giant Mushroom 43, Giant Beetle 50) each is about a two-minute fight on a dozen or so Orange
Potions; see `docs/balance.md`.

**MVP.** The Fire Giant (Lv 60, 24,000 HP, Fire), optional and not part of the story, waits in the south of Ember Hill and stomps the
ground around it every few seconds. It is made for one Base 50 hero in the best gear: about three
minutes and a bag of potions (a Blader drinks around 50 White Potions; a Sorcerer who keeps
moving needs far fewer, but Blue Potions too). Whoever brings it down gets **MVP** over their
head, bonus Base EXP and MVP items straight to the bag, plus its drops (its horn, crown, cape or
sword). It comes back 15 minutes later, even if you leave the map or close the game.

Two more MVPs rule the new lands: the **Kobold King** (Lv 50, 18,000 HP, Earth) holds court in the
south of Coal Pit, and the **Goblin King** (Lv 55, 21,000 HP, Wind) in the north of Serpent Wood. Both
stomp like the Fire Giant, and each MVP keeps its own timer (20 and 30 minutes). **Every MVP calls
guards** when it first falls below 60% HP: the Fire Giant 2 Fire Wisps and 3 Fire Beetles, each
king 4 of his own (2 warriors, an archer and an assassin). It never calls while a guard is still
standing: once the last one falls, it can call again 2 minutes later, if it is still fighting. Guards are lesser
monsters of their kind (half the HP, 60% of the ATK): they follow their MVP, fight whoever it
fights, and vanish when it falls (no EXP, no drops). The kings drop ores, a rare accessory (5%) and their **card** (1%), as does the Fire Giant.

**Steinborg.** A walled market city north of Moss Field: stone walls with towers and two gates
(south to Moss Field, east to Birch Grove), timber houses round a fountain square, a forge, market
stalls and the seeress's tower. The buildings are 3D, like Ragnarok's towns, and fade when they
stand between you and the camera. Its storehouse opens the same chest as the camp's.

**Galdrheim.** The city of sorcerers, north of Fen Shore, with a north gate onto goblin country: pale lavender stone, violet and teal
roofs, star banners over the gate and crystals glowing on every tower. In its square a circle of
runes glows over the rune-well, with a crystal floating above it; the Archmage's three-tiered
tower stands to the north, the library to the west, the Staffwright's workshop to the east, the
Watcher runestones and the stargazer's observatory to the south. Sorcerers take their job trial
here, and their gear is made here. It has a storehouse too (the same chest).

## Character

Ragnarok's classic rules with Aria's own stat names (see `docs/ragnarok-mechanics.md`):
POW (STR), QKN (AGI), END (VIT), KNL (INT), FNS (DEX), FTN (LUK). Base Level and Job Level
gain EXP separately; stat points come from Base Levels, skill points from Job Levels. HP does
not recover while you walk. Resting (sitting, or standing in a town) doubles it and also gives
back 5% of Max HP and 6% of Max SP a tick, so a full rest takes about a minute. Fainting sends
you to your save point with half your HP and SP and costs 1% of the EXP to the next level.

**Placing stat points.** In the Status window, ▲ places a point (shown in green, with how many
are pending); **Confirm** locks them in and **Reset** takes back any not yet locked in. Closing
the window also takes back unconfirmed points.

**Rates.** 4x, for a quicker climb: every Base and Job EXP gain from monsters, MVPs and quests is
four times Ragnarok's own (`RATES` in `src/progress.js`). Quest windows show the EXP you will get.

## Jobs and skills

Aria's own jobs and skills, kept modest. A **Trainee** puts points into **Basic Training**; the
other Trainee skills come free with Job Levels. At Trainee Job 10 with Basic Training 9, a job
trial opens: three short steps a Trainee of Base Level ~10 can do, each needing one trip to the
easy field beside the trainer: a hunt, something made from what it dropped, and the trainer's
questions (tap an answer; a wrong one only earns a hint). **Captain Ulfr** in Steinborg tests
Bladers (6 Slimes and 4 Sprouts in Moss Field, 5 Slime Gel and 3 Seeds as proof, three questions
on fighting); **Archmage Vigdis** in Galdrheim tests Sorcerers (4 Blue Slimes in Fen Shore, brew a
Blue Draught from 3 Slime Gel and 2 Water Drops, three questions on elements and chanting). Pass,
and they change your job. Elder Halvard sends ready Trainees on to the city.

| Trainee | | |
|---|---|---|
| Basic Training | passive, 9 | +1 ATK per level; Lv 3 Rest; Lv 9 opens the job trials |
| Rest | from Basic Training 3 | HP and SP recover twice as fast |
| Mend | Job 1, 4 SP | heals 5 HP + 3% Max HP |
| Thrust | Job 3, 3 SP | a quick stab for 125% damage |
| Guard | Job 5, 4 SP | 4 s: 15% less damage, no flinching |
| Footwork | Job 7, passive | +3 FLEE |

| Blader | | |
|---|---|---|
| Blade Discipline | passive, 10 | +2 ATK per level with swords |
| Iron Hide | passive, 10 | +1 DEF, +1% Max HP per level |
| Cleave | 10 | 110–200% to the target, half to monsters beside it |
| Heavy Strike | 10, needs Cleave 3 | 167–320%, +3% hit per level |
| War Cry | 10 | monsters within 6 paces turn on you; ATK +1% per level for 20 s |
| Stand Firm | 10, needs War Cry 3 | no flinching, 1% less damage per level |
| Ground Slash | 10, needs Heavy Strike 5 | 110–200% to everything close, pushing it back a little |
| Battle Rhythm | Job 10, passive | every 3rd hit restores 3 SP |
| Last Stand | Job 10, passive | below 25% HP: +15% ATK |

**Sorcerers** cast from range. A spell walks you into range, then you stand and chant (the cast
bar over the hotbar); getting hit breaks the chant. Magic never misses: damage comes from MATK
(KNL, plus a staff's MATK %), softened by the monster's MDEF and VIT. FNS shortens cast times.
A new Sorcerer is handed an Wooden Staff.

| Sorcerer | | |
|---|---|---|
| Mana Well | passive, 10 | +2% Max SP and +1 SP per recovery tick, per level |
| Ember Bolt | 10, 7–16 SP | a fire bolt: 120–300% MATK |
| Frost Shard | 10, 9–18 SP | 100–190% MATK, 4% per level to freeze for 2.5 s |
| Arc Lightning | 10, needs Ember Bolt 4 | 90–180% MATK, leaps to 2 monsters nearby for half |
| Flame Ring | 10, needs Ember Bolt 5 | 112–220% MATK to every monster around you |
| Rune Ward | 10, needs Mana Well 3 | 30 s: 2% less damage per level, hits don't break your chant |
| Blink | Job 10 | reappear 4 paces ahead |
| Swift Chant | Job 10, passive | spells cast 15% faster |

### Walking both paths

A Blader can also take the Sorcerer's trial with Archmage Vigdis (and a Sorcerer the Blader's with
Captain Ulfr). Both first jobs then share **one Job Level and one pool of skill points**: at Job 40
you have the same points whichever you are, and could put 20 into each tree. Switch between them
at any **Keeper** you have signed with. Points only go into the **active job's** trees; to train
the other path, switch to it first.

Every skill you have learnt keeps working, whatever job you wear. Passives always apply; actives
need the right weapon in hand. Gear follows every job you have earned, so a Blader who passed the
Sorcerer's trial may hold a staff to cast.

| Needs a sword (any weapon but a staff) | Needs a staff |
|---|---|
| Cleave, Heavy Strike, Ground Slash (Blader) | Ember Bolt, Frost Shard, Arc Lightning, Flame Ring (Sorcerer) |
| Twin Fang, Piercing Edge, Final Blade (BladeMaster) | Stone Spike, Earthquake, Meteor Storm, Storm Gust, Thunderstorm (Wizard) |
| Flame Edge, Frost Edge, Thunder Edge (Magic Knight) | |

No weapon needed: Mend, Thrust, Guard, Rest, War Cry, Stand Firm, Rune Ward, Blink, Stone Aegis.

### Second jobs

From **Job Level 40** of a first job (it goes to 50), a three-step trial opens a second job. Job
Level starts again at 1 (up to 50, on Ragnarok's second-job table); your first-job skills and
points stay. Second jobs wear their first job's outfit in new colours and glow with a small aura
(the Magic Knight has its own sprite).

- **BladeMaster** (Captain Ulfr): 30 Goblins, 20 Kobold Assassins, the Giant Beetle.
- **Wizard** (Archmage Vigdis): 10 Fire Dust and 10 Dark Crystals, 25 Goblin Archers, the Giant Mushroom.
- **Magic Knight** (Sir Eirik the Runeblade, Steinborg, beside Ulfr): 30 Kobolds, 10 Dark Crystals and
  15 Glow Dust, the King Crab. Only for heroes who walked both paths with **at least 20 skill
  points in each tree**.
- A hero of both paths may take the BladeMaster or Wizard trial only for the first job with the most
  points (a tie opens both). A Job 50 hero with 30 points as a Blader and 20 as a Sorcerer may
  become a BladeMaster or a Magic Knight; with 25 and 25, any of the three; with 35 and 15, only a
  BladeMaster. Only one second job can be taken: once you accept a step of one trial, the other
  trials close. Quit a trial midway (Quit quest in the Quest View) and it starts over, and you may
  pick any trial you qualify for again.
- Job trials pay nothing for the steps on the way: the whole trial's reward comes with its last
  step.

| BladeMaster: one target, cut down fast | |
|---|---|
| Blade Mastery | passive, 10: +3 ATK and +1 HIT per level with swords |
| Combo Edge | passive, 10: Thrust, Cleave, Heavy Strike, Twin Fang and Piercing Edge have 4% per level to Combo, a free extra strike |
| Momentum | passive, 5: each Combo adds a stack (up to 5, 8 s), +1% ATK per level per stack |
| Twin Fang | 10: two cuts of 112–220%, each can Combo |
| Piercing Edge | 10, needs Twin Fang 3: 250–520%, ignoring half the monster's DEF |
| Final Blade | 5, needs Piercing Edge 5 and Momentum 1: spends every Momentum stack, 360–600% +50% per stack |

| Wizard: the elements, over an area | |
|---|---|
| Elemental Attunement | passive, 10: spells +3% per level |
| Resonance | passive, 5: a spell of a different element from the last (within 8 s) +6% per level |
| Stone Spike | 10: 125–260% MATK, Earth (new element for spells); Shatters the monster: the next spell of another element on it +30% |
| Earthquake | 10, needs Stone Spike 3: 51–105% MATK Earth within 3 paces of the target, may stun |
| Meteor Storm | 10, needs Ember Bolt 5: three falls of 34–70% MATK Fire around the target |
| Storm Gust | 10, needs Frost Shard 5: 51–105% MATK Water around the target, may freeze |
| Thunderstorm | 10, needs Arc Lightning 5: 51–105% MATK Wind around the target |

| Magic Knight: ATK and MATK together | |
|---|---|
| Spellblade | passive, 10: sword hits add 3% of your MATK per level |
| Elemental Chain | passive, 5: an Edge of a different element from your last (within 6 s) +6% per level and 3 SP back |
| Flame Edge | 10: 110–200% ATK plus 47–110% MATK, Fire |
| Frost Edge | 10: 100–190% ATK plus 57–120% MATK, Water; may freeze |
| Thunder Edge | 10, needs Flame and Frost Edge 3: 90–180% ATK plus 47–110% MATK, Wind; half to monsters beside |
| Stone Aegis | 10: 20 s barrier soaking 60–150% of your ATK plus as much of your MATK, +1 DEF per level |

**Elements.** Every monster has an element, as in Ragnarok, and so do spells and some weapons.
Ember Bolt and Flame Ring are Fire, Frost Shard is Water, Arc Lightning is Wind; normal attacks
are Neutral unless the weapon has one (Fire Sword, Flame Sword, Lava Sword and the Giant Sword
are Fire, Sea Sword and Ice Sword Water, Wind Sword Wind, Stone Sword and Horn Sword
Earth). An elemental staff also adds 15% to spells of its own element (Frostwood and Tidecaller
Water, Emberheart and the Giant's staff Fire, Giant Root Earth, Nightshade and Mothercap Shadow).
A strong hit (150%) shows in gold, a weak one (25–50%) in grey.

| Attack \ Monster | Water | Earth | Fire | Wind | Shadow |
|---|---|---|---|---|---|
| Fire | 50% | **150%** | 25% | 100% | 100% |
| Water | 25% | 100% | **150%** | 50% | 100% |
| Wind | **150%** | 50% | 100% | 25% | 100% |
| Earth | 100% | 25% | 50% | **150%** | 100% |

Water: the slimes, crabs, King Crab · Earth: Sprouts, Mushrooms, beetles, Giant Sprout ·
Fire: Fire Beetles, Fire Wisps, Giant Beetle, Fire Giant · Wind: Wisps, goblins, Goblin King ·
Earth also: kobolds, Kobold King · Shadow:
Dark Mushrooms, Dark Wisps, Giant Mushroom.

**Staves** raise MATK: Wooden (+15%, given on the job change), Birch (+20%, Orm), Rune (+25%),
Ice (+28%), Root (+30%), Water (+32%), Dark (+34%, Dark Wisp 0.2%), Fire (+38%), Mushroom (+40%,
Giant Mushroom 2%), Flame (+50%, MVP 2%) and Great Staff (+55%, from three boss materials).

## Items

The Items window has three tabs: **Usables**, **Equips** and **Miscs**. Weapons, armor, boots,
torch, headgear and charms are items: equip them from the Equips tab (the piece taken off lands in
the same bag slot). In the Equipment window, tap a worn piece to see what it is and double-tap it
to take it off. Shops sell 1, 10 or all, and "Sell all" keeps what an active quest still needs.

| Usable | Effect | Where |
|---|---|---|
| Red / Orange / White Potion | 45–65 / 105–145 / 175–235 HP | Hild's shop, Ragna; drops |
| Blue Potion | 40–60 SP | Hild's shop, Ragna; Blue and Sea Slimes |
| Berry · Crab Leg | 16–22 · 70–100 HP | Slimes, Sprouts · Crabs |
| Green Herb | cures spore sickness, a little HP | Sprouts, Mushrooms |
| Speed Potion | +10% attack speed for 3 minutes | Ragna |
| Teleport Feather | random spot on this map | Hild's shop, Ragna; Wisps |
| Return Feather | back to your save point (the camp until you save with a Keeper) | Hild's shop, Ragna |

**Rare drops.** Like Ragnarok, each monster has a rare equip it drops very seldom. A rare find
bursts gold on the ground and shows in gold in your bag.

| Rare item | Slot | Effect | From |
|---|---|---|---|
| Slime Ring | Accessory | FTN +2, Max HP +20 | Slime, 0.5% |
| Water Necklace | Accessory | KNL +2, Max SP +15 | Blue Slime, 0.3% |
| Leaf Bracelet | Accessory | END +1, QKN +1, HP recovers twice as fast | Sprout, 0.4% |
| Flower Crown | Head | FLEE +1 | Sprout, 0.5% (also crafted) |
| Shell Buckler | Shield | DEF 3, Max HP +40 | Crab, 0.3% |
| Mushroom Cloak | Garment | DEF 1, FLEE +4 | Mushroom, 0.25% |
| Stone Ring | Accessory | END +2, DEF 1 | Beetle, 0.3% |
| Horn Sword | Weapon | ATK 68, weapon Lv 3, POW +1 | Beetle, 0.15% |
| Lantern | Light | lights the night, KNL +1, FNS +1 | Wisp, 0.4% |
| Shiny Gel | Misc | a collector's prize | Green and Blue Slimes, 1% |
| Horned Crown | Head | DEF 4, POW +2, END +1 | Fire Giant, 5% |
| Flame Sword | Weapon | ATK 110, weapon Lv 4 | Fire Giant, 1% |
| King's Ring | Accessory | POW +2, END +1, Max HP +50 | Kobold King, 5% |
| Tooth Necklace | Accessory | QKN +2, FNS +1, HIT +5 | Goblin King, 5% |
| Giant Cape | Garment | DEF 4, Max HP +100, END +2 | Fire Giant, 3% |
| Thorn Ring · Coral Shield · Dark Hood · Fire Armor · Fire Charm | | | the new lands' monsters, 0.2–0.3% |
| Thorn Cape · Sea Sword · Mushroom Staff · Fire Boots | | | the mini-bosses, 2–3% |

Two accessory slots, a shield and a garment slot join head, face, armor, weapon, shoes and light.

**Weapon levels.** Lv 4 weapons are the best there are: the Giant Sword, Flame Sword, Lava Sword
and Sea Sword, and the Great, Flame, Fire and Mushroom Staves. They refine for the most ATK
(+7 a level) and are the only gear that can take a card slot.

## Refining, slots and cards

**Holger the Refiner** (Steinborg, beside Gunnar's forge) refines weapons, armor, shields,
capes, boots and head gear, worn or in the bag, one level at a time up to **+10**, at
Hollgrehenn's rates from Ragnarok. Each level adds ATK to a weapon (+2 / +3 / +5 / +7 by weapon
level) or 1 DEF to anything else. Up to the safe level a try always works; past it, a failed try
**breaks the piece** (any card in it comes back to you). The window shows the chance and asks
twice before a risky try.

| | Safe to | Then, per level | Each try |
|---|---|---|---|
| Weapon Lv 1 | +7 | 60 / 40 / 19% | Iron Ore + 50 perz |
| Weapon Lv 2 | +6 | 60 / 40 / 20 / 19% | Steel Ore + 200 perz |
| Weapon Lv 3 | +5 | 60 / 50 / 20 / 20 / 19% | Hard Ore + 5,000 perz |
| Weapon Lv 4 | +4 | 60 / 40 / 40 / 20 / 20 / 9% | Hard Ore + 20,000 perz |
| Armor, shield, cape, boots, head | +4 | 60 / 40 / 40 / 20 / 20 / 9% | Armor Ore + 2,000 perz |

Holger sells Iron and Steel Ore; Hard Ore and Armor Ore only drop, from the kobolds, goblins and
their kings.

**Seyla the Enchanter** (Galdrheim, east of the square) opens **card slots** in Lv 4 weapons, up
to two: "+7 Giant Sword [1]", then "[2]". The first slot works half the time; each try costs 5
Hard Ore, 5 Dark Crystals, one boss material (a Giant Root, Big Pearl, Mushroom Heart or Fire
Core) and 50,000 perz. The second works a quarter of the time and costs twice as much (10, 10, 2
boss materials in any mix, 100,000 perz). A failed try breaks the weapon; any card in it comes
back to you.

**Cards.** Each MVP drops its card (1%), and like Ragnarok's MVP cards they are overpowered.
Each mini-boss drops one too (1%): a good step up, but nothing like an MVP's.
Select a card in the Miscs tab and tap **Insert** to press it into a weapon with a
free slot. It stays there for good, unless the weapon later breaks at Holger's.

| Card | Goes in | Effect | From |
|---|---|---|---|
| Kobold King Card | Weapon | Max HP +40%, DEF +10, FLEE +10, END +10 | Kobold King, 1% |
| Goblin King Card | Weapon | ATK +100, POW +10, QKN +10, attacks 15% faster | Goblin King, 1% |
| Giant Sprout Card | Weapon | Max HP +10%, END +4 | Giant Sprout, 1% |
| King Crab Card | Weapon | QKN +4, FLEE +8, attacks 5% faster | King Crab, 1% |
| Giant Mushroom Card | Weapon | MATK +15%, KNL +4, Max SP +10% | Giant Mushroom, 1% |
| Giant Beetle Card | Weapon | ATK +25, POW +4 | Giant Beetle, 1% |
| Fire Giant Card | Weapon (a sorcerer's card) | MATK +60%, KNL +12, FNS +8, Max SP +30%, Max HP +15%, weapon turns Fire (+15% Fire spells with a staff) | Fire Giant, 1% |

**Who can wear what.** Swords up to the Iron Sword: Trainee and Blader; rare and elemental
swords: Blader only. Staves: Sorcerer only (the Wooden Staff also Trainees). Heavy armor
(Beetle Armor, Chain Mail, Fire Armor): Blader only; robes: Sorcerer only; Pearl Armor:
Blader and Sorcerer. Bucklers and round shields: Trainee and Blader. Everything else: any job.
A job change puts away what the new job can't use.

**Headgear you can see.** Two slots, Head and Face. Hats hide the hair they cover: Horned Helm,
Leaf Cap, Flower Crown, Horned Crown, and the animated **Fire Crown** (crafted from the
MVP's Fire Heart).

**Your look, Ragnarok style.** A character is layers: the job's body, then one shared head (the
standard face: eyes only, no mouth), then your hairstyle, then headgear. You choose a hairstyle
(Tousled or Long) and a hair dye (8 colours) when you start a new game; **Embla the Stylist** by
Steinborg's fountain changes them for 1,000 perz. Your hair stays the same through job changes,
and the job changes your outfit. Headgear snaps to the head layer, so hats sit on the crown and
glasses and masks sit on the eyes, in every direction and every frame. See
`docs/character-standard.md`.

**Perz and shops.** Perz is Aria's coin (Ragnarok's zeny). Monsters don't drop perz, as in Ragnarok: sell your loot. In Steinborg,
**Hild the Trader** sells potions, herbs, feathers and torches, and **Gunnar** sells swords,
armor, shields, capes and boots. In Galdrheim, **Kari** sells the same goods as Hild (and Speed
Potions), and **Orm the Staffwright** sells staves and robes. Any shop buys anything for half its
price.
Quests pay perz too. Your perz shows in the Items window.

**Crafting** is done in the cities (the campfire is just a fire now): in Steinborg, **Gunnar the
Gear Crafter** forges weapons, armor, headgear and charms, and **Ragna the Herbalist** brews
potions and feathers; in Galdrheim, **Orm the Staffwright** makes the sorcerers' gear (staves,
robes), all from materials in your bag and storage. Recipes need a Base Level. The best
gear comes from boss materials:

| Forged | Made from |
|---|---|
| Root Staff (MATK +30%, KNL +2, FNS +2) | Giant Root (Giant Sprout) |
| Pearl Armor (DEF 7, Max HP +40, Max SP +30) | Big Pearl (King Crab) |
| Dark Robe (DEF 4, Max SP +60, KNL +2) | Mushroom Heart (Giant Mushroom) |
| Lava Sword (ATK 95, weapon Lv 4, POW +2) | Fire Core (Giant Beetle) |
| Giant Sword (ATK 120, weapon Lv 4, POW +3, END +1) | Giant Horn + Fire Heart + Fire Core |
| Rainbow Ring (every stat +1) | Shiny Gel |
| Slime Band (FTN +2, KNL +2, Max HP +30, Max SP +20) | Slime Ring + Water Necklace |

## Story

**The Last Fire-Ring.** Long ago the fire-jotnar slept beneath the hills of Aria, and the first
settlers lit a ring of fires to keep them dreaming: Eldrun, the fire-ring. Now the fires burn low,
the ground of Ember Hill shakes, and the Fire Giant is waking. You arrive as a stranger with a
practice sword, asleep by the camp's last fire.

The story runs beside the other quests, in chapters. Its current step sits at the top of the
quest list (purple), with directions to the next map ("Head north to Steinborg"); the minimap
rings the portal to take, or the person to talk to. A purple **!** marks who the story wants.

| Chapter | Steps |
|---|---|
| Prologue (the tutorial) | Talk to the Elder · raise a stat · defeat 3 Slimes in Moss Field · learn Basic Training · put a potion on the hotbar · back to the Elder |
| 1: The Stone-Fort | Travel to Steinborg · tell Captain Ulfr the fires are failing · sign Keeper Bera's ledger (the Keepers: healing, storage, save point, teleport) · meet Saeunn the Seeress · sell something for perz |
| 2: Blade or Rune | Pass a job trial and become a Blader or a Sorcerer |
| 3: Embers in the Wilds | Saeunn's warning · defeat the Giant Sprout in Birch Grove · travel to Ember Hill |
| 4: The Fire-Ring | Archmage Vigdis sings the fire-ring's runes anew · bring the song home: the fire-ring rekindled |
| 5: The Salt Road | Captain Ulfr: kobolds rob the salt carts · Hakon the Carter in Salt Bay · defeat 12 kobolds in Stone Field · Saeunn and the glowing red coal · go down into Coal Pit · Dag the Miner: the goblins drive the kobolds to dig for a "Waking Fire" |
| 6: The Goblin War-Band | tell Ulfr · defeat 15 goblins in Burnt Wood · Archmage Vigdis reads the two coal trails |
| 7: The Second Path | take a second job (BladeMaster, Wizard or Magic Knight) |
| 8: The Waking Fire | defeat the Giant Beetle in Ash Heath · travel to Serpent Wood · defeat 20 goblins, the keepers of the goblins' backward fire-ring · the backward rune-stone to Vigdis · home to the Elder |

The second saga (chapters 5–8) runs from about Base 32 to Base 55. A hero who finished the first saga
picks up at Chapter 5. No MVP is part of the story: the Fire Giant, the Kobold King and the Goblin
King wait as optional fights for the strongest.

The quest list folds away with a tap on its title bar and scrolls when it is long.

## People and quests

Tap someone to talk. A **!** bubble means they have a quest (or a job change) for you, a **?**
means you can hand one in. Active quests show under the clock.

A few big jobs instead of many errands: one each in the camp, and a handful in Steinborg.

**Kinds of quest.** Hunt (defeat monsters), gather (bring items), **cook or brew** (bring the
makings, then answer the cook's or brewer's questions; a wrong answer only gets a hint), **search**
(walk over the glinting things on a map), **defend** (stand by a place and hold it against waves; walk
away and the wave scatters), **deliver** (carry something to someone in another land) and **rare
hunt** (a unique monster that appears only while the quest is on, some only at night). "Go there"
leads to each.

| Who | Where | Quests (Base Level) |
|---|---|---|
| Elder Halvard | camp | The Mushroom Wood (12): hold Dark Dale's old waystone against 3 waves of Mushrooms |
| Astrid the Cook | camp | A Feast for Eldrun (10): bring 10 Slime Gel, 5 Crab Legs, 5 Spores, then cook it with her |
| Sigrun the Scout | camp | The Lantern Wisp (14): hunt the golden Wisp that rises over Fen Shore's pond at night |
| Gyda the Healer | camp | heals HP and SP for free |
| Keeper Tova, Bera, Asa | camp, Steinborg, Galdrheim | sign the ledger, then: storage, healing, Save here (where you wake after fainting, and where Return Feathers go), switch first jobs, and teleport to any other Keeper you signed with (300–500 perz) |
| Sir Eirik the Runeblade | Steinborg | the Magic Knight's trial |
| Hild the Trader | Steinborg | shop · Hild's Crate (24): take a crate of potions to Hakon in Salt Bay |
| Gunnar the Gear Crafter | Steinborg | shop, forge · Stone for the Forge (34): 30 Stone, 15 Burnt Shells |
| Holger the Refiner | Steinborg | refines gear up to +10; sells Iron and Steel Ore |
| Ragna the Herbalist | Steinborg | brewing · The Great Remedy (38): bring 6 Dark Spores and 6 Fire Dust, then brew it with her |
| Captain Ulfr | Steinborg | The Blader's Trial · The King of the Shore (30): the King Crab · The Beetle of Ash Heath (46): the Giant Beetle |
| Saeunn the Seeress | Steinborg | the story; lore of the Fire Giant and Galdrheim |
| Embla the Stylist | Steinborg | hairstyle and dye, 1,000 perz |
| Ivar the Ferryman | Steinborg | carts to any land you have walked, 300–3,000 perz |
| Liv the Guide | Steinborg | who does what in the city · rethinks your training: one free stat reset and one free first-job skill reset (before a second job), then 20,000 perz each |
| Bjorn the Gate Guard | Steinborg | which monsters attack on sight |
| Hakon the Carter | Salt Bay, by the west road | the story (Chapter 5) |
| Dag the Miner | Coal Pit, by the east road | the story (Chapter 5) |
| Archmage Vigdis | Galdrheim | The Rune Trial · The Mother of Spores (40): the Giant Mushroom |
| Orm the Staffwright | Galdrheim | shop, crafts sorcerers' gear (staves, robes) · The Living Wood (26): a Giant Root, 8 Thorns |
| Seyla the Enchanter | Galdrheim | opens a card slot in a Lv 4 weapon (50%) |
| Kari the Curio Seller | Galdrheim | shop: potions, feathers, torches, Speed Potions |
| Brynja the Lorekeeper | Galdrheim | The Drowned Tomes (20): find 4 tomes washed up on the Salt Bay shore |
| Torvald the Runecarver | Galdrheim | Shadows in Black Wood (38): take rubbings of 3 Watcher stones in Black Wood |
| Hrafn the Stargazer, Signy the Apprentice | Galdrheim | tales of the city, the stars and the jotnar |
| Runa the Gatewarden | Galdrheim | the rune-gate: to any land you have walked, 300–3,000 perz |

People without a PixelLab sprite of their own are dressed from a bald hero body (Trainee, Blader,
Sorcerer or Magic Knight) in their own colours, with the shared head, a hairstyle, a dye and
headgear (`dress` in `src/quests.js`). No one's look repeats except a role every town can have: the
Keepers share theirs, as do the smiths (Holger, Seyla) and the carters and gate-wardens (Ivar,
Runa); Galdrheim's Orm and Kari dress like Steinborg's Gunnar and Hild. People with tales to tell have a **Tell me more** button.

**Quest list.** Tap a quest under the clock (or the story step) for its **Quest View**: who gave
it, the goal, your progress, the reward and where to go. **Go there** walks you to it by itself,
portal by portal: to the nearest map with the monster, or for a gathering quest the nearest map
where an item you still need drops, or back to whoever is waiting for you. Tap the ground to stop.
Job quests show in green, and the steps of a series (the job trials) start on their own when the
step before is handed in. A second-job trial's hunts hand themselves in where you stand, so only
its last step goes back to the trainer. Monsters an active quest still wants respawn twice as fast.
Quit quest sits at the left of the Quest View's buttons and asks twice. The main people greet you
differently as your job and the story change.

**Water.** The shallow edge of a lake (Fen Shore's pond, Salt Bay's bay) can be waded: the hero and
monsters are cut at the waterline, Ragnarok style, and rings spread round them as they move.

## Day and night

A full day lasts 10 minutes. Night brings Wisps and extra monsters. Rest in the tent
to restore HP, save, and sleep until morning.

## Roadmap

- [x] **M1–M6** Map, combat, drops and crafting, monsters, day/night, sound and title screen
- [x] **M7** PixelLab sprites for the whole cast
- [x] **M8** Leveling and equipment
- [x] **M9** Camp villagers and quest chains
- [x] Ragnarok-style controls, rules, windows, maps and portals; Aria's own skills; MVP boss
- [x] Steinborg, four new lands, mini-bosses, perz and shops, the Sorcerer and job trials
- [ ] Cards, more jobs

## Dev

```bash
npm install
npm run dev      # local server, open on your phone via LAN
npm run build    # single-file build in dist/index.html
```

Code map: `world.js` (maps, portals, props), `city.js` (Steinborg's walls and buildings), `player.js`, `mobs.js` (all monster AI and the MVP),
`rules.js` (battle rules), `skills.js`, `items.js` + `inventory.js` + `menus.js` (items, crafting,
gear, windows), `progress.js` (levels and stats), `story.js` (the main story), `quests.js` + `villagers.js` (people,
shops and quests), `hotbar.js`, `daynight.js`, `audio.js`,
`sprites.js` (painted art plus the PixelLab sheets — swap any sprite without touching game logic).

## PixelLab art

Every character is made with PixelLab's Pro mode from a style reference: the player from a
Ragnarok Online sprite (kept out of the repo), everyone else from the player, so the cast shares
one look. Raw exports live in `art/pixellab/<name>/`; older versions stay in `*_v1` / `*_v2`.

```bash
# needs PIXELLAB_API_KEY (and PIXELLAB_STYLE_REF for the player)
python3 build-tools/pixellab.py generate art/pixellab crab   # make one character
python3 build-tools/pixellab.py finish art/pixellab crab     # fill in missing animations
python3 build-tools/pack-sprites.py                          # write src/art/<name>.png + .json
```

Each character has 4 standing directions; the player and monsters add `walk` or `hop` and
`attack`. The packer crops frames to one box per character, erases stray specks and records where
the feet are so sprites stand on their shadows.
