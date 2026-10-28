# Aria

A small 2.5D open-world fantasy RPG for phones, in the spirit of old-school MMORPGs:
painted 2D sprites standing in a 3D world. You camp in the valley of Aria, travel from map to map,
fight monsters and bosses, sell their loot for perz in the walled city of Steinborg and have
better gear made from what they drop.

Built with Three.js + Vite, wrapped as an Android app with Capacitor. The player, monsters and
villagers are PixelLab pixel-art sprites in a classic MMORPG style; the world is painted in
code and all sound is synthesized, so the game ships as one offline HTML file.

## Get the APK

Every push to `main` builds a new APK automatically (about 3–5 minutes).
Every APK is signed with the same key (`build-tools/debug.keystore`), so a new build installs over
the old one and keeps your save. On the title screen, **Back up save** shows your save (every hero
and the shared storage) as a code to copy somewhere safe, and **Restore save** puts one back (on
this phone or another).

## Heroes and storage

The title screen has three character slots. Tap a hero and **Continue** (or **Play**), or tap an
empty slot to make a new one; **Delete** removes the picked hero (it asks twice). In the game, the **⚙**
button (next to Skills) opens Settings: Sound on or off, and **Back to main menu**, which saves and
goes back to the title screen to play another hero. Every
hero keeps their own level, job, bag, gear, perz and quests, but the Keepers' storage (300 slots) is
shared: what one hero puts away, the others can take out. Its window has sections (All, Usables,
Equips, Miscs, Cards), each showing the bag's and the storage's items of that kind; tap a stack to
choose how many to store or take.
Download it from **Releases → "Aria — latest build"** → `Aria.apk`.
New builds install over old ones as an **update**: they share the signing key, and each build's
version (1.0.*build number*, shown on the title screen) is higher than the last. Just open the new
APK and tap **Update**; don't uninstall first, or your save goes with the old app.

## Controls

Classic MMORPG style: no on-screen controller. Landscape.

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
| Hold a buff icon (left of the minimap: each buff on you, with its time left) to see what it does | Hover |
| Attack button (left of the hotbar, showing your weapon): attack your target, or the nearest monster in sight if you have none (a melee hero walks to it) | Click |
| Drag one finger: turn the camera · pinch: zoom | Drag or Q / E · mouse wheel |
| Window buttons under the HP / SP box: Status, Equip, Items, Skills | Alt+A, Alt+Q, Alt+E (or I / B), Alt+S · Esc closes |

The hotbar starts empty. Windows are small, can be dragged anywhere by their title bar, and the
game keeps running while they are open. A monster's name shows over it when the mouse is on it,
and in gold over the one you are fighting. Rare drops glow gold on the ground. A drop lies there
45 seconds (a rare one 90); leave the map and it is still there when you come back, though its time
runs on while you are away.

## Maps

Eldrun Camp and Steinborg are safe town maps; everything else is a 64×64 field. Only two
portals leave the camp (Moss Field to the north, Fen Shore to the west); every other map is
reached by travelling on. The fields have plain names; the towns' are Old Norse in style.

```
                               Serpent Wood
                                  |
                              Burnt Wood                                            Old Forest
                                  |                                                      |
                              Galdrheim    Steinborg - Birch Grove - Willow Marsh - Veidheim
                                  |            |           |
                                  |        Moss Field  -  Dark Dale  -  Black Wood - Barley Field
                                  |            |           |           |                 |
Coal Pit - Stone Field - Salt Bay - Fen Shore - Eldrun Camp   Ember Hill  -  Ash Heath - Wolf Hills
                                                                  |
                                                 Red Sands - Rytingborg - Cactus Dunes
                                                                                |
                                                        Great Desert  -  Scorpion Sands
                                                             :
                                               (hidden) Sphinx Sands
```

Goblin country (Burnt Wood, then Serpent Wood) lies beyond Galdrheim's north gate; the kobolds' hills
(Stone Field, then Coal Pit) lie west of Salt Bay, along the road round its bay. East of Birch
Grove, through Willow Marsh, is **Veidheim**, the hunters' village, with the gentle Old Forest north
of its gate. Far from it, east of Black Wood and Ash Heath, lie the predators' lands, Barley Field
and Wolf Hills, for heroes near their second job. South of Ember Hill lies the desert, and in its heart the oasis city of **Rytingborg**, the city of
sand and daggers. West of it are the Red Sands, a Trainee's field; east, the Cactus Dunes, then
Scorpion Sands with its Pyramid, then the Great Desert, where the Sand Wyrm hunts.

| Map | Level | Monsters | Boss |
|---|---|---|---|
| Moss Field | 1–6 | Bloop (Lv 1), Sprout (3) | |
| Fen Shore | 3–10 | Blue Bloop (4, splits), Crab (6); Wisps only at night | |
| Dark Dale | 12–18 | Mushroom (14, slowing spores) | |
| Birch Grove | 16–26 | Red Sprout (18), Sprout, Bloop | Giant Sprout (55) |
| Salt Bay | 20–32 | Sea Bloop (22), Blue Crab (26), Crab | King Crab (58) |
| Ember Hill | 28–36 | Beetle (30) | **Fire Giant (60, MVP)** |
| Black Wood | 32–42 | Dark Mushroom (34), Dark Wisp (38), Mushroom | Giant Mushroom (60) |
| Ash Heath | 40–50 | Fire Beetle (42), Fire Wisp (45), Beetle | Giant Beetle (62) |
| Stone Field | 28–34 | Kobold (28), Kobold Archer (30), Kobold Assassin (33) | |
| Coal Pit | 30–50 | Kobold Assassin, Kobold, Kobold Archer | **Kobold King (50, MVP)** |
| Burnt Wood | 38–44 | Goblin (38), Goblin Archer (41), Goblin Assassin (44) | |
| Serpent Wood | 40–55 | Goblin Assassin, Goblin, Goblin Archer | **Goblin King (55, MVP)** |
| Willow Marsh | 5–10 | Yellow Bloop (7), Willow (8, slowing seeds) | Elder Willow (55) |
| Old Forest | 8–26 | Treant (24), Willow | **Ancient Treant (62, MVP)** |
| Barley Field | 44–54 | Snake (46), Wolf (48) | Alpha Wolf (64) |
| Wolf Hills | 46–62 | Wolf, Bear (53), Snake | Great Bear (66) |
| Red Sands | 6–14 | Red Bloop (9), Giant Ant (12) | |
| Cactus Dunes | 55–60 | Cactus (55, throws needles), Dune Worm (58) | Cactus Lord (60) |
| Scorpion Sands | 60–66 | Sand Scorpion (61, poison), Sand Runner (64) | Rainbow Runner (64) |
| Great Desert | 62–70 | Soldier Ant (62), Cactus, Dune Worm, Sand Scorpion, Sand Runner | **Sand Wyrm (70, MVP)** |
| Any field in the valley, more at night (Moss Field and Fen Shore only at night) | | Wisp (11) | |

Moss Field and Fen Shore, by the camp and the city, Willow Marsh by Veidheim and the Red Sands by Rytingborg are a Trainee's fields: a Base 10 Trainee
beats any of their monsters again and again, and a Trainee earns big Job EXP there (Job 10 in
about 20–30 kills).

**Passive monsters.** Most field monsters leave you alone until you hit
them; then they fight back for a while. Only the Dark Wisps, the fire beasts of Ash Heath, the
kobolds and goblins, the mini-bosses and the MVPs attack on sight. A Sprout runs away, and fights only when
cornered.

The new lands' monsters are palette swaps of the valley's, like a family of bloops in many colours. No
health bars: monsters flash white when hit and wobble when nearly beaten. They respawn 60 s
after they fall, twice as fast at night.

**Kobolds and goblins** (hand-drawn in code for now, `src/painted.js`) come in three kinds:
warriors close in and hit hard, **archers** keep about five paces away and shoot arrows (step in
and they back off), and **assassins** are quick, dart the last few steps and sometimes strike twice.
They drop Kobold Fur and Goblin Teeth, ores for refining, and now and then Hard Ore or Armor Ore.

**Veidheim's beasts** (painted in code, `src/beasts.js`). Round the village the gentle ones, which
only fight back: Willows, weeping willow spirits with branch antlers and long green hair, shake
their seeds over you (you slow down), and Treants, great oak giants with mossy beards, are slow and
heavy. Yellow Bloops hop about Willow Marsh too. Far off, the predators attack on sight: Snakes dart
in to bite, sometimes twice; Wolves run in packs and are as quick; Bears are slow, heavy and hit
hard. They drop twigs, bark, pelts, skins and claws for Leif's leatherworks, Honey, and their own
rare gear.

**The desert's monsters** (painted in code, `src/desert.js`). Red Bloops warm themselves on the Red
Sands beside Giant Ants, red-brown and busy; both only fight back. Further out, Cacti stand still and
throw needles from afar, Dune Worms rise out of the sand to bite, Sand Scorpions sting (a sting may
**poison** you: you lose a little HP each second for 6 seconds, and a Green Herb cures it), and Sand
Runners, big saddled desert birds with a spiky crest, run as fast as you and kick twice. Black
Soldier Ants guard the Great Desert. They drop needles, hides, stingers, feathers and jaws for
Rytingborg's dagger-smiths.

Moss Field and Fen Shore, by the camp and the city, Willow Marsh by Veidheim and the Red Sands by Rytingborg are a Trainee's fields: big, stomping the ground around it, back 5–8
minutes after it falls (its timer holds when you leave the map or close the game, as an MVP's does).
Mini-bosses are big game for heroes of a **second job**: their levels (55–66) say so, and they
come for a second-job hero on sight. A Trainee or a first job they leave be as they roam, unless
it strikes or taunts one first; then it fights like any mini-boss. Mini-bosses are **half as hard as an MVP** (190,000–290,000 HP) and fierce like one: enraged below
half their HP, and their stomps and moves can't be dodged by FLEE and go through most of your DEF.
They are fights for a hero in good gear whatever their level, and no quest needs one (the quests
and trials that once did now hunt their kin). Like the MVPs, each calls 2 guards of its own kind at
80%, 50% and 25% HP (Red Sprouts, Blue Crabs, Dark Mushrooms, Fire Beetles), and again a minute
after the last one falls. They drop a rare material (30%) that forges the best gear, and a rare
equip of their own (2–3%). Each is a boss of its own, not a big copy of its kind: the Giant Sprout
rust-red with a thorny vine round its bulb, the King Crab sea-blue and crusted with barnacles with
gold claw tips, the Giant Mushroom near-black with glowing magenta spots and drips, the Giant Beetle
charcoal with its cracks glowing like embers; the Alpha Wolf black with a silver ruff, red eyes and a
scarred face; the Great Bear a grizzly with a silver-tipped hump, amber eyes and scars. Every boss of
this kind (and the Elder Willow and the Ancient Treant) has an **aura**: a glow pulsing on the ground under it and motes rising round it, in
its colour. Their guards are lesser servants of their kind (half the HP, 60% of
the ATK): cut them down first. See `docs/balance.md`.

**MVP.** The Fire Giant (Lv 60, 400,000 HP, Fire), optional and not part of the story, roams Ember Hill and stomps the
ground around it every few seconds. MVPs are the hardest fights in Aria, made for a strong second
job in the best gear, upgraded and carded: several minutes each, a big bag of White and Blue
Potions, and a plan. Even a Lv 99 hero in plain gear falls to one. Their stomps, red circles and
burning ground can't be dodged by FLEE and go through most of your DEF: step out of them.
Each has skills of its own that punish standing and shooting, and the wrong element (Fire Arrows
on the Fire Giant) can cost you the fight. The Fire Giant calls down a **Meteor Rain**: five
fireballs (seven when enraged) fall one after another around you, each a red circle first, and
wherever its meteors and leaps land the ground **burns** for 6 seconds (an orange circle), burning
anyone who stands in it. Keep moving, fight from clear ground, and bring Ice Arrows. Whoever brings it down gets **MVP** over their
head, bonus Base EXP and MVP items straight to the bag, plus its drops (its horn, crown, cape or
sword). It comes back 15 minutes later, even if you leave the map or close the game.

The predators have two mini-bosses: the **Alpha Wolf** (Lv 64) leads the packs of Barley Field and
pounces from afar, calling 2 Wolves; the **Great Bear** (Lv 66) rules Wolf Hills beside the Ancient
Treant, charging and calling 2 Bears. Their pelt and heart (30%) make Leif's best hunting gear.

The **Elder Willow** of Willow Marsh (Lv 55: silvery, wide antlers with fireflies on their tips,
water-lilies in its hair) is the mini-boss on the road to Veidheim, a step after the Giant Sprout,
calling Willows out of the reeds. The **Ancient Treant** (Lv 62, 550,000 HP, Earth: pale with age,
glowing runes carved down its body, blossoms in its crown), the oldest tree in Aria, has woken in the Old Forest
and is its MVP: it stomps, hurls stones and charges, and calls 2 Treants and 2 Willows. It is the hardest MVP, a fight of several minutes, with two skills of its
own. **Grasping Roots** burst out where you stand (a red circle first) and hold you there for 3
seconds (4 when it is enraged, and then in three patches): you can still fight, but not walk, dash
or leap away, so even a quick hero who keeps their distance gets caught while it comes for them.
**Bark Armor** hardens its bark for 6 seconds (it glows brown): it takes 30% less damage and sends
30% of every hit back at whoever struck it, you or your beasts. Hold off until it passes. It comes back 35 minutes
after it falls.

Two more MVPs rule the new lands: the **Kobold King** (Lv 50, 600,000 HP, Earth) in
Coal Pit, and the **Goblin King** (Lv 55, 600,000 HP, Wind) in Serpent Wood. Both
stomp like the Fire Giant, and each MVP keeps its own timer (20 and 30 minutes). The Kobold King
hides behind his tribe (**Tribe's Shield**): while any of his guards stands he takes 80% less
damage, and he calls them back every 30 seconds, so cut the guards down first (Arrow Rain and
other area skills shine here). He also **Burrows**: he digs in, can't be hit while under, and
bursts out where you stood (a red circle shows it just before). The Goblin King's **Mirror Image**
calls two shadow Goblin Kings that look just like him and fight beside him, and he trades places
with one of them: while a shadow stands he takes 90% less damage, so find the shadows and bring
them down. **Every MVP calls
guards** at 80%, 50% and 25% of its HP: the Fire Giant 2 Fire Wisps and 3 Fire Beetles, each
king 4 of his own (2 warriors, an archer and an assassin); a call brings back only the guards that
are missing. Once the last guard falls, it calls again a minute later, if it is still fighting. Guards are lesser
monsters of their kind (half the HP, 60% of the ATK): they follow their MVP, fight whoever it
fights, and vanish when it falls (no EXP, no drops). The kings drop ores, a rare accessory (5%) and their **card** (1%), as does the Fire Giant.

**Matchups.** Each MVP takes more from some kinds of blow and less from others, so each is
easiest for some jobs and hardest for others (it tells you when it first comes for you):

| MVP | Takes more from | Takes less from | Easiest for | Hardest for |
|---|---|---|---|---|
| Fire Giant | arrows +40% (a huge target) | spells −40% (its fire soul swallows them), beasts −20% | Archer, Windrunner | Sorcerer, Wizard |
| Kobold King | spells +40% (kobolds fear sorcery) | arrows −50% (his tribe's shields) | Sorcerer, Wizard | Archer, Windrunner |
| Goblin King | blades and fists +40% | arrows and spells −30% (his crown's wind ward) | Blader, BladeMaster | the bow jobs and casters |
| Ancient Treant | beasts +60% (fangs and claws tear bark), spells +10% | blades and fists −40% (the bark turns them) | Beastmaster | Blader, BladeMaster |
| Sand Wyrm | blades, daggers and fists +30% (soft flesh between its plates) | beasts −40%, arrows −10% (its plated hide) | Blader, Assassin and their second jobs | Beastmaster |

The two-path jobs sit between: a Magic Knight's sword is half steel and half spell, a Moon
Ranger's arrows half arrow and half spell.

**Enraged.** Below half its HP an MVP is enraged for good (it glows red, and calms down only if it
heals back over 60%): it hits 25% harder and 35% faster, walks 15% faster, stomps every 4.5
seconds instead of 7, and uses its moves sooner and more often. An MVP doesn't tire of you
either: it chases you over its map and gives up only when you are far away (22 paces), at camp or
playing dead.

**The desert's bosses.** The **Cactus Lord** (Lv 60, Cactus Dunes: a tall dark cactus with a crown
of spikes, yellow diamond eyes and a jagged grin) rains needles round you (**Needle Storm**) and
charges, calling Cacti. The **Rainbow Runner** (Lv 64, Scorpion Sands: a white Sand Runner in
rainbow plumage) charges and leaps on you, calling Sand Runners. The **Sand Wyrm** (Lv 70, 900,000
HP, Earth), the Great Desert's MVP, is a giant ringed worm whose maw opens like a flower round rings
of hooked teeth. It spends almost half the fight **under the sand**, where nothing can hit it: a
mound of sand with spines breaking through swims after you, then bursts up beneath you (a red
circle shows it just before). **Up**, it can't move: it stays where it rose, and that is the time to
hit it. Up, it bites, sweeps the ground, spits sand (**Sand Spit**), drops sand from the sky
(**Sandfall**) and leaves quicksand that burns; it calls Dune Worms and Soldier Ants. Enraged, it
stays up for less time and dives sooner. Blades, daggers and fists find the soft flesh between its
plates (+30%); arrows glance off (−10%) and claws and fangs barely scratch it (beasts −40%). It comes
back 30 minutes after it falls, and drops the Wyrm Fang (a dagger), the Dune Bow, the Dune Staff,
the Wyrmhide Cloak, Sandwalker Boots, the Wyrm Ring and its card.

**How bosses fight.** Every boss (mini-boss, raid boss and MVP) reads you:
- **It aims where you're going.** Once you have been running a moment, its throws, leaps, roots,
  burrows, charges and first meteor often land where you are heading, not where you stand. The red
  circle shows where, so turn or stop rather than run on in a straight line.
- **It picks its move for the moment:** a leap, charge or burrow when you keep away or stand
  casting, something thrown or rained down when you stand still in its range. It rarely uses the
  same move twice in a row, and the pause between moves is never quite the same.
- **Kiting has a limit.** Kept out of reach for a few seconds, it gives chase in a burst
  ("Pursues!"), and its moves come sooner.
- **Rocks don't save you.** It finds its way round rocks, trees, tents and walls, out of any dead
  end, whether it is hunting you or roaming its map; stuck behind something too tight for it, it
  bounds over onto you (Bound, a red circle first).
- **An enraged MVP or Hell boss** may follow one move straight into another.
- **Mini-bosses hunt like MVPs.** They follow you up to 18 paces and heal only after 10 seconds
  out of the fight, so stepping away briefly doesn't reset them.

**Where bosses are.** Mini-bosses and MVPs appear at a random spot on their map, away from you and
the portals, and roam the whole map. Struck on its way somewhere, a boss turns and fights there. A
boss you leave behind stays where it stood, and keeps its wounds and its guards (and
how often it has called them): come back, or wake up at your save point after fainting, and the
fight is where you left it, the boss a little healed (5% of its HP a minute while it isn't
fighting you). This holds over a restart too. No monster ever steps onto a portal.

**Monsters follow you.** A monster that comes for you (or that you hit) follows you round the
map for as long as you stay near, and gives up only once you are well away (a bit over twice the
range it spots you from), on safe ground or playing dead. It isn't tied to one spot: it wanders on
from where it gave up, and only a monster that died comes back where it first appeared.

**Every monster stays as you left it.** Leave a map and come back (or restart the game) and its
monsters are where they were, as many, as hurt as you left them; the ones you killed come back
when their respawn time is up, and that time runs on while you are away.

**The map lives on while you are away.** Come back to a map and its monsters have wandered about
in the meantime, as far as they would have gone in that time, and its bosses have roamed on across
it; after a long absence they are simply somewhere else.

These rules hold on every map, and are the defaults for any new one.

**Walking speed** suits Aria's small maps: the hero takes 300 ms a tile, and monsters their own
time (Bloops 800 ms, Kobolds 400, Goblins 300, Goblin Assassins 200, the Kobold King 300, the
Goblin King 240 and the Fire Giant 260), so some are quicker than you. Speed changes: only the
strongest slow (spores: +50% walk time) and the strongest haste count, they don't stack, and the walk time never falls under 40%. No gear
or skill hastes the walk for now: in Aria walking speed is a big buff. Monsters keep their pace however hurt they are.

**Boss moves.** Bosses walk at a boss's quick pace (the Goblin King and the Fire Giant are quicker than you), don't slow down when wounded,
and have moves beside the stomp. A **red circle** on the ground shows where each will land, and
fills up until it hits: step out of it.

| Boss | Moves |
|---|---|
| Kobold King | **Burrow** (bursts out under you) · **Charge**: crouches, then rushes at you in a straight line (stands winded after) · **Boulder**: thrown where you stand, lands 1 s later · **Tribe's Shield** while his guards stand |
| Goblin King | **Mirror Image** (two shadow kings) · **Leap**: jumps onto where you stand · **Hurled Axe** · **Frenzy** below half HP: 8 s of faster steps and attacks (he glows red) |
| Fire Giant | **Meteor Rain** · **Fireball** (wide) · **Leap** · burning ground where they land |
| Giant Sprout · Giant Mushroom | **Seed Pod** · **Spore Pod**, thrown at you |
| King Crab · Giant Beetle | **Charge** |
| Elder Willow | **Seed Cloud**, thrown at you |
| Alpha Wolf · Great Bear | **Pounce** (a leap) · **Mauling Charge** |
| Ancient Treant | **Grasping Roots** (hold you in place) · **Bark Armor** (hits bounce back) · **Root Stone** (thrown) · **Uprooting Charge** |

Each move hits for 1.4–2x the boss's ATK. Staying far away no longer keeps you safe: spells reach
5 paces, and every boss has a move for 3–9 paces.

**Steinborg.** A walled market city north of Moss Field: stone walls with towers and two gates
(south to Moss Field, east to Birch Grove), timber houses round a fountain square, a forge, market
stalls and the seeress's tower. The buildings are 3D and fade when they
stand between you and the camera. Its storehouse opens the same chest as the camp's.

**Galdrheim.** The city of sorcerers, north of Fen Shore, with a north gate onto goblin country: pale lavender stone, violet and teal
roofs, star banners over the gate and crystals glowing on every tower. In its square a circle of
runes glows over the rune-well, with a crystal floating above it; the Archmage's three-tiered
tower stands to the north, the library to the west, the Staffwright's workshop to the east, the
Watcher runestones and the stargazer's observatory to the south. Sorcerers take their job trial
here, and their gear is made here. It has a storehouse too (the same chest).

**Veidheim.** The hunters' village east of Birch Grove and Willow Marsh: a palisade of sharpened
logs with wooden watchtowers and two gates (west to the marsh, north to the Old Forest), dirt lanes crossing on a green round the well, thatched and turf roofs
among the pines. Nearly everyone is an archer and carries a longbow and a quiver on their back. The
hunters' lodge has antlers over its door; the archery range has three targets and a fence; a
windmill turns over the village's wheat and cabbage plots, beside the red barn; Leif's leatherworks
hangs its hides on drying racks. The fields outside are farmland and forest: fenced plots of barley,
cabbages and pumpkins with haystacks and scarecrows in Barley Field (the old farms the wolves took),
pines and hunters' camps in Wolf Hills, willows round a pond in Willow Marsh, and huge old oaks in
the Old Forest.

**Rytingborg.** The desert's oasis city, south of Ember Hill: sandstone walls and houses with arched
windows, blue domes with gold tips and slim minarets. In its heart lies a turquoise lake with an
island kiosk, crossed by four stone bridges, with little sailboats drifting on it. At the back a
palace stands on a rock terrace, two waterfalls pouring from it into the lake. Round the shore are a
bazaar of striped awnings, palms, and the Assassins' guild hall in the palace's shadow. Gates lead
north to Ember Hill, west to the Red Sands and east to the Cactus Dunes. Assassins take their job
trial here, daggers are forged here, and it has a storehouse (the same chest). The Carters always
offer the ride to Rytingborg, so a Trainee can get there without crossing Ember Hill.

**The Sphinx.** Someone in Rytingborg knows an old secret, but only tells it to a hero who has walked
every sand round the city. It opens a hidden way out of the Great Desert to **Sphinx Sands**, where a
Giant Sphinx half the size of the map lies among ruins. Its great door is still sealed: the halls
inside are Aria's first dungeon, still being dug out.

## Raids

A raid is a timed run in an arena of its own: **three waves** of monsters that attack on sight and
never stop following you, then a **boss**, all within the time limit (`src/raid.js`). There are
four, each with its own guide and its own cooldown:

| Raid | Guide | Where | Difficulties need |
|---|---|---|---|
| **Bloop Island**, a small round island out in Salt Bay | the Boatman | Salt Bay, by the water | Base 40 / 55 / 70 / 85 |
| **Kobold Camp**, the kobolds' walled war camp beyond Coal Pit: Coal Pit's dark stone, rock walls and kobold tents | Brokk the Miner | Coal Pit, by the east portal | Base 45 / 60 / 75 / 90 |
| **Goblin Lair**, the goblins' lair under Serpent Wood's dark trees: giant mushrooms and goblin tents | Ylva the Scout | Serpent Wood, by the south portal | Base 50 / 65 / 80 / 95 |
| **Pharaoh's Tomb**, the Pharaoh's burial hall under the Pyramid: sandstone pillars, torches and sarcophagi | Sindri the Tomb Guide | Scorpion Sands, at the Pyramid's door | Base 55 / 70 / 85 / 99 |

A guide's window lists the difficulties down the left (locked until you have the level) and, for
the one you pick, the boss (its picture, level, HP, ATK, element, skills and matchup), the waves,
the clear reward, the cores, the rare finds and the boss's card.

- **Bloop Island:** wave 1 is Green and Blue Bloops, wave 2 Blue and **Yellow Bloops** (also met in Willow Marsh), wave 3 Yellow
  and **Red Bloops**. Then comes **BleepBloop**, a giant orange bloop general with a white beard, a plumed general's hat and a mantle. He
  belly-flops onto you, charges and stomps, and calls Red Bloops at 60% HP. A big health bar shows his
  HP while you fight him.
- **10 minutes** for the lot. After each wave you get back half your HP and SP, and before the boss
  all of it.
- **The Kobold Camp:** Kobolds and Kobold Archers, then Kobold Assassins, then the **Kobold
  Warlord**, the Kobold King's look in war-paint: he charges and hurls boulders and calls his
  warriors. **The Goblin Lair:** Goblins and Goblin Archers, then Goblin Assassins, then the
  **Goblin Warlord**: he leaps on you, hurls axes, flies into frenzies and calls the horde.
  **Pharaoh's Tomb:** Scarabs and Mummies, then Tomb Scorpions, then the **Pharaoh**, a mummy king in a
  gold headdress with crook and flail. On Hell he seals himself in his **Sarcophagus**: four Canopic
  Jars rise round him, and he takes 90% less damage until they are broken.
- **Difficulty:** you choose when you set out, and each needs its Base Level (above). The monsters'
  level and strength follow it.

| Difficulty | Made for | Rewards | Cores | Rare | Ultra rare, card |
|---|---|---|---|---|---|
| Easy | a first job, no potions needed | x1 | 3 | 3% | 1% each |
| Normal | a second job, 20 White Potions | x3 | 9 | 3% | 1% each |
| Hard | a strong second job, 30 White Potions | x6 | 27 | 3% | 1% each |
| Hell | the best gear, upgraded and carded, and a big bag of White Potions | x9 | 81 | 3% | 1% each |

- **Hell's Warlords** are fierce like BleepBloop, and as long a fight (about 400,000 HP each). The
  Kobold Warlord **Burrows**, brings down a **Rockslide** (rocks falling round you, leaving rubble that
  hurts and slows), and hides behind his guards (70% less damage while one stands); his warriors'
  shields catch arrows (−40%) but kobolds fear sorcery (+30%). The Goblin Warlord casts **Mirror
  Image** (three shadows of him; 90% less damage while one stands) and **Firepot Rain** (fire pots
  round you, leaving burning ground); his war-paint wards off arrows and spells (−20%) but not steel
  (+30%).

- **Hell's BleepBloop** is as hard and tricky as a field MVP (210,000 HP). He is enraged below half
  his HP, and his stomp and moves can't be dodged with FLEE and go through most of your DEF: step
  out of the red circles. **Bloop Rain** drops bloops all round you, and each leaves a **sticky
  puddle** that slows and hurts whoever stands in it. **Jelly Wall** raises three Jelly Cores round
  him: while one stands he takes 90% less damage, so pop them first. He belly-flops and charges
  harder too, and his jelly takes spells well (+30%) but swallows blades and fists (−30%) and
  beasts (−20%).

- **EXP is held while you fight** and paid when the run ends. A clear pays all of it **x1.5**.
- **A failed run pays nothing** and costs no cooldown: the time runs out, you faint, you leave, or
  you close or restart the game mid-run. Try again whenever you are ready.
- **Raid history:** the Raids window's History tab lists every run, newest first: cleared or failed
  (and why), when, how long it took, and what it paid (perz, Base and Job EXP, items).
- **A clear** pays perz and materials (times the difficulty's reward), the raid's **cores** (3, 9, 27
  or 81), a 3% chance at one of its rare finds, and 1% chances at its **ultra rare** and at its boss's
  card. Bloop Island
  pays Bloop Gel, Water Drops and maybe Shiny Gel; the Kobold Camp Kobold Fur, Iron and Steel Ore;
  the Goblin Lair Goblin Teeth, Steel and Armor Ore; Pharaoh's Tomb Red Gel, Scorpion Tails and Hard Ore.
- **Cores buy the rare finds.** Each guide makes its raid's rare finds from its cores (and a few
  materials): the rarer the piece, the more cores. A Hell clear pays enough for most pieces at once.

| Raid | Rare finds, and what the guide asks for them |
|---|---|
| Bloop Island | Bloop Ring, Water Necklace (25 Bloop Cores) · Sea-Glass Charm (40) · Bleep Ring, Hopper Boots (60) · Bloop Buckler, Veteran's Boots, Bubble Robe (80) · ultra rare: **Angel Wings** (500) |
| Kobold Camp | Pickaxe Charm (30 Kobold Cores) · Miner's Lamp Charm (40) · Ore-Heart Ring, Lucky Nugget (60) · Earthshaker Boots, Stonehide Mantle (80) · Miner's Plate (120) · Quarry Shield (150) · ultra rare: **Giant Goat Horn Helm** (500) |
| Goblin Lair | Totem Charm (30 Goblin Cores) · Fang Charm (40) · War-Drum Pendant (60) · Windstep Boots, Raider's Cloak (80) · Horde Leather, Shaman's Robe (120) · Spiked Buckler (150) · ultra rare: **Elven Ears** (500) |
| Pharaoh's Tomb | Golden Scarab, Falcon Eye Charm, Ankh Charm (40 Tomb Cores) · Royal Linen (80) · Scarab Kris (100) · Tomb Guard Mail (120) · Canopic Shield, Khopesh (150) · ultra rare: **Pharaoh's Headdress** (500) |

**Ultra rares** are worn where everyone can see them: the Giant Goat Horn Helm (Head: a
gunmetal helm worked in gold with a gold crest, two great dark horns banded in gold curling round
beside it, and the ears left bare; DEF 6, POW +4, END +4, Max HP +10%), Elven Ears
(Face: long pointed ears over the hero's own, dressed in silver: cuffs and spikes, sapphires,
crystal earrings and a band round the back of the head; QKN +4, FNS +4, HIT +10, FLEE +5) and Angel Wings (Wings: folded white wings trimmed in gold, a crystal crest between them; KNL +4, FTN +4, FLEE +6, Max SP +80, Max HP +5%). The Pharaoh's Headdress (Head: a striped cloth of gold and lapis over the head, a gold cobra on
the brow, lappets to the shoulders and a tail at the back; DEF 6, KNL +4, FTN +4, END +2, Max SP +10%).

Each raid has a rare find for every kind of hero: blades (POW), the toughest (END, Max HP), the
quick (QKN, FLEE), archers (FNS, HIT), casters (KNL, SP) and the lucky (FTN).

| Raid | Piece | Slot | Effect | For |
|---|---|---|---|---|
| Bloop Island | Veteran's Boots | Shoes | DEF 3, FLEE +3, END +1, Max HP +60 | tough |
| Bloop Island | Bloop Buckler | Shield | DEF 4, Max HP +80 | tough |
| Bloop Island | Bleep Ring | Accessory | FTN +3, POW +1 | lucky |
| Bloop Island | Bloop Ring | Accessory | FTN +2, Max HP +20 | lucky |
| Bloop Island | Water Necklace | Accessory | KNL +2, Max SP +15 | caster |
| Bloop Island | Bubble Robe | Armor | DEF 3, KNL +2, Max SP +50 | caster |
| Bloop Island | Sea-Glass Charm | Accessory | FNS +2, HIT +5 | archer |
| Bloop Island | Hopper Boots | Shoes | DEF 2, QKN +2, FLEE +4 | quick |
| Kobold Camp | Pickaxe Charm | Accessory | POW +3, HIT +6 | blade |
| Kobold Camp | Earthshaker Boots | Shoes | DEF 4, POW +2, HIT +4 | blade |
| Kobold Camp | Stonehide Mantle | Garment | DEF 5, END +2, Max HP +150 | tough |
| Kobold Camp | Miner's Plate | Armor | DEF 8, END +2, Max HP +150 | tough |
| Kobold Camp | Quarry Shield | Shield | DEF 7, END +2, Max HP +8% | tough |
| Kobold Camp | Ore-Heart Ring | Accessory | KNL +3, Max SP +5% | caster |
| Kobold Camp | Miner's Lamp Charm | Accessory | FNS +3, HIT +6 | archer |
| Kobold Camp | Lucky Nugget | Accessory | FTN +4, Max HP +60 | lucky |
| Goblin Lair | Spiked Buckler | Shield | DEF 6, POW +2 | blade |
| Goblin Lair | War-Drum Pendant | Accessory | FTN +3, POW +2 | lucky |
| Goblin Lair | Windstep Boots | Shoes | DEF 3, FLEE +6, QKN +3 | quick |
| Goblin Lair | Raider's Cloak | Garment | DEF 3, FLEE +8, QKN +2 | quick |
| Goblin Lair | Horde Leather | Armor | DEF 6, FNS +2, HIT +6 | archer |
| Goblin Lair | Fang Charm | Accessory | FNS +3, HIT +5 | archer |
| Goblin Lair | Totem Charm | Accessory | KNL +3, Max SP +60 | caster |
| Goblin Lair | Shaman's Robe | Armor | DEF 4, KNL +3, Max SP +80 | caster |
| Pharaoh's Tomb | Khopesh | Weapon (Blader) | ATK 100, POW +3 | blade |
| Pharaoh's Tomb | Tomb Guard Mail | Armor | DEF 8, END +2, Max HP +160 | tough |
| Pharaoh's Tomb | Canopic Shield | Shield | DEF 6, END +1, Max HP +100 | tough |
| Pharaoh's Tomb | Scarab Kris | Dagger | ATK 74, QKN +3 | quick |
| Pharaoh's Tomb | Royal Linen | Garment | DEF 3, FLEE +8, QKN +2 | quick |
| Pharaoh's Tomb | Falcon Eye Charm | Accessory | FNS +3, HIT +6 | archer |
| Pharaoh's Tomb | Ankh Charm | Accessory | KNL +3, Max SP +60 | caster |
| Pharaoh's Tomb | Golden Scarab | Accessory | FTN +4, Max HP +60 | lucky |

| Raid boss card | Slot | Effect |
|---|---|---|
| Kobold Warlord Card | Head or face card | DEF +7, Max HP +25%, END +7, POW +4; **Earthshaker:** blows and spells stun a monster 8% of the time (Kobold Camp, 1%) |
| Goblin Warlord Card | Head or face card | ATK +60, QKN +7, POW +4, blows up close (not arrows) +15%; **Frenzy:** 10% of them land twice (Goblin Lair, 1%) |
| Pharaoh Card | Head or face card | MATK +15, Max SP +15%, KNL +6, FTN +4; **Soul Tax:** 4% of the damage you deal comes back as SP (Pharaoh's Tomb, 1%) |

- **The Raids window** (the Raids button): every raid, its boss, levels, guide and whether it is
  ready. Once you have done a raid at its guide (win or lose), you can set out on it from anywhere
  through this window, and you come back to where you were when it ends. Opened from here, a
  raid's panel has a Back button to the list.
- **Raid guides** (the Boatman in Salt Bay, Brokk in the Coal Pit, Ylva in Serpent Wood, Sindri in Scorpion Sands) have a gold
  ✦ RAID over their heads.
- **Cooldowns:** each raid has one 3-hour cooldown for all its difficulties, counted from setting
  out, but only a clear starts it; the four are separate.
- **The Tutorial crossing** (Chapter 5): while the story waits on the raid, the Boatman also offers
  a gentler Tutorial run (Lv 24–33 monsters). It starts no cooldown; only a clear of it moves the
  story on and pays the clear reward. Lose it and it pays nothing, but you can try again at once.
- Easy to Hard were tuned with a whole-run simulation (every monster of a wave at once, natural
  regen, the breathers); Hell was tested in the game like the MVPs.

## Character

Classic MMORPG rules with Aria's own stat names (see the mechanics notes in `docs/`):
POW (STR), QKN (AGI), END (VIT), KNL (INT), FNS (DEX), FTN (LUK). Base Level and Job Level
gain EXP separately; stat points come from Base Levels, skill points from Job Levels (one a level: a Trainee earns 9 by
Job 10, a Job 50 Blader has 50 more, and a second job adds one for each of its own). HP does
not recover while you walk. Resting (sitting, or standing in a town) doubles it and also gives
back 5% of Max HP and 6% of Max SP a tick, so a full rest takes about a minute. Fainting sends
you to your save point with half your HP and SP and costs 1% of the EXP to the next level.

**Placing stat points.** In the Status window, ▲ places a point (shown in green, with how many
are pending); **Confirm** locks them in and **Reset** takes back any not yet locked in. Closing
the window also takes back unconfirmed points.

**Rates.** Battles pay 4x: every Base and Job EXP gain from monsters, mini-bosses, MVPs and raids is
four times the base rate (`RATES` in `src/progress.js`). Quests pay 2x (`QUEST_RATE`): side quests,
job trials and the main story. So the climb comes mostly from fighting. Quest windows show the EXP
you will get.

## Jobs and skills

**The Skills window** is a skill tree: tabs for the trees you have earned, with the points spent in
each (the Trainee first, then your first jobs in one tab: tap it again to pick another from its ▾
list, then your second job, marked **2nd Job**), the tree itself (each skill a node, square for actives and
round for passives, its level on a badge; lines run from each skill to what it opens and turn gold
once the need is met; it scrolls when it is bigger than the window), and beside it the skill you
tap: what it does now and at the next level, its SP, cast time, cooldown and weapon, what it
needs (other trees' skills too), and **Raise**, or why it can't be raised yet. Drag a learnt active
from the tree onto the hotbar.

Aria's own jobs and skills, kept modest. A **Trainee** puts points into **Basic Training**; the
other Trainee skills come free with Job Levels. At Trainee Job 10 with Basic Training 9, a job
trial opens: three short steps a Trainee of Base Level ~10 can do, each needing one trip to the
easy field beside the trainer: a hunt, something made from what it dropped, and the trainer's
questions (tap an answer; a wrong one only earns a hint). **Captain Ulfr** in Steinborg tests
Bladers (6 Bloops and 4 Sprouts in Moss Field, 5 Bloop Gel and 3 Seeds as proof, three questions
on fighting); **Archmage Vigdis** in Galdrheim tests Sorcerers (4 Blue Bloops in Fen Shore, brew a
Blue Draught from 3 Bloop Gel and 2 Water Drops, three questions on elements and chanting);
**Huntmaster Sigrid** in Veidheim tests Archers (5 Yellow Bloops in Willow Marsh, wax a bowstring
with 5 Bloop Gel, three questions on range, arrows and Leap Back); **Master Kol** in Rytingborg
tests Assassins (5 Red Bloops in the Red Sands, oil a blade with 5 Ant Mandibles, three questions
on daggers, venom and Vanish). Pass, and they change your job.
Elder Halvard sends ready Trainees on to the city.

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
| Cleave | 10 | 134–260% to the target, half to monsters beside it |
| Heavy Strike | 10, needs Cleave 3 | 195–420%, +3% hit per level |
| War Cry | 10 | monsters within 6 paces turn on you; ATK +1% per level for 20 s |
| Stand Firm | 10, needs War Cry 3 | no flinching, 1% less damage per level |
| Ground Slash | 10, needs Heavy Strike 5 | 145–280% to everything close, pushing it back a little; 2% per level to stun for 1 s |
| Battle Rhythm | Job 10, passive | every 3rd hit restores 3 SP |
| Last Stand | Job 10, passive | below 25% HP: +15% ATK |

**Sorcerers** cast from range. A spell walks you into range, then you stand and chant (the cast
bar over the hotbar); getting hit breaks the chant. Magic never misses: damage comes from MATK
(KNL, plus a staff's MATK %), softened by the monster's MDEF and VIT. FNS shortens cast times.
A new Sorcerer is handed an Wooden Staff.

| Sorcerer | | |
|---|---|---|
| Mana Well | passive, 10 | +2% Max SP and +1 SP per recovery tick, per level |
| Ember Bolt | 10, 5–14 SP | a fire bolt: 82–190% MATK |
| Frost Shard | 10, 7–16 SP | like Cold Bolt: one shard of ice per level, falling one after another, 21–30% MATK each |
| Arc Lightning | 10, needs Ember Bolt 4 | 67–130% MATK, leaps to 2 monsters nearby for half; 2% per level to paralyze each for 1.2 s |
| Flame Ring | 10, needs Ember Bolt 5 | 78–150% MATK to every monster around you; 2% per level to set each burning for 3 s |
| Rune Ward | 10, needs Mana Well 3 | 30 s: 2% less damage per level, hits don't break your chant |
| Blink | Job 10 | reappear 4 paces ahead |
| Swift Chant | Job 10, passive | spells cast 15% faster |

**Archers** shoot from about five paces (more with Long Sight): tap a monster and the hero stops
at bow range and looses arrows, each hit rolled when the arrow lands. With a bow, ATK comes from
FNS instead of POW, and FNS also brings the HIT that lets arrows find quick monsters. A bow needs
**arrows** in the Arrows slot of the Equipment window: they are bought once and never run out.
Elemental arrows (Fire, Ice, Wind, Earth) give every shot their element and a little ATK; Iron
Arrows hit harder. An Archer can carry a shield too: it is strapped to the forearm, so the hand
stays free to draw the string. A new Archer is handed a Hunting Bow and
Wooden Arrows, already worn. Asa the Fletcher in Veidheim sells bows and arrows and makes better
ones at her workbench (**Make bows**); Kobold and Goblin Archers, the Goblin King and the Fire Giant
drop rare bows.

| Archer | | |
|---|---|---|
| Keen Eye | passive, 10 | +1 FNS per level |
| Long Sight | passive, 10 | the bow reaches 0.2 paces further and +1 HIT per level |
| Double Shot | 10, 10–15 SP | two arrows at once, 78–150% each |
| Arrow Rain | 10, needs Double Shot 5 | arrows fall round the target: 88–160% to every monster within 2.5 paces, pushing them back a little |
| Focus | 10 | +1 QKN and +1 FNS per level for 60 s |
| Hunter's Mark | 5, needs Keen Eye 3 | marks a monster for 10 s: everything you hit it with deals 4% more per level |
| Leap Back | Job 10 | spring 3 paces back, away from the nearest monster |
| Steady Aim | Job 10, passive | +10% damage with a bow to a monster 4 or more paces away |

**Assassins** fight with **daggers**: lighter blows than a sword, but much quicker, and Double
Attack makes many of them land twice. They have fewer HP than a Blader and dodge instead (Improve
Dodge). **Poison**, their venom, makes a monster lose a fifth of the blow that poisoned it every
second for 6 s (it shows green); bosses resist it like any status. A new Assassin is handed a
**Rusty Dagger**, put on at once if no dagger is in hand. Yrsa the Dagger-smith in Rytingborg sells
daggers and makes better ones (**Make daggers**); the desert's monsters drop them too.

| Assassin | | |
|---|---|---|
| Dagger Mastery | passive, 10 | +3 ATK per level with daggers |
| Double Attack | passive, 10 | with a dagger, 5% of your normal attacks per level strike twice |
| Improve Dodge | passive, 10 | +3 FLEE per level |
| Venom Strike | 10, 6–11 SP | 175–400%, +3% hit per level; 26–80% to poison for 6 s |
| Sonic Blow | 10, needs Venom Strike 3 | eight blows in a blur, 57–120% each. 2 s cooldown |
| Shadow Step | 5, needs Improve Dodge 3 | step to your target's back from up to 6 paces; your next blow +10–50% |
| Vanish | 5, needs Improve Dodge 5 | 4–8 s in the shadows: monsters lose you (bosses and MVPs see through it); attacking ends it, and your first blow out of it deals 10–50% more |
| Pilfer | Job 10 | lift something off a monster: a chance (more with FNS) at one of its drops (never a card), once per monster |
| Lethal Edge | Job 10, passive | +5% crits with a dagger |

**Daggers** can be held by every job, the Trainee too: a Sorcerer with a dagger still casts, and an
Archer with a dagger fights hand to hand without its bow skills. A dagger is no sword: Blade skills
still need a sword. Daggers go with a shield.

### Walking several paths

A Blader can also take the Sorcerer's trial with Archmage Vigdis, the Archer's with Huntmaster
Sigrid or the Assassin's with Master Kol (and so on, for any of the four). Every first job then shares **one Job Level and one pool
of skill points**: at Job 40 you have the same points whichever you are, and could put 20 into two
trees. Points go into any path you earned, whichever job you are wearing; switch between them at
any **Keeper** you have signed with to change the job you wear. A second job trains every first
job you earned too, but a BladeMaster, Wizard or Windrunner never puts more points into another path
than into its own (a Wizard's Blader tree stays at or under its Sorcerer tree).

Every skill you have learnt keeps working, whatever job you wear. Passives always apply; actives
need the right weapon in hand (spells need none). Gear follows the job you wear: a Blader holds
swords, a Sorcerer staves, an Archer bows, and anyone daggers (a second job, those of the first jobs it stands on), and
switching jobs at a Keeper puts away what the new job can't use and, if your hands are empty, puts
on the best weapon in your bag that it can (and arrows, for a bow).

| Needs a sword | Needs a bow | Needs no weapon |
|---|---|---|
| Cleave, Heavy Strike, Ground Slash (Blader) | Double Shot, Arrow Rain (Archer) | Ember Bolt, Frost Shard, Arc Lightning, Flame Ring, Rune Ward, Blink (Sorcerer) |
| Twin Fang, Piercing Edge, Final Blade, Blade Dance (BladeMaster) | Hurricane Volley, Cyclone Arrow (Windrunner) | Stone Spike, Earthquake, Meteor Storm, Storm Gust, Thunderstorm (Wizard) |
| Elemental Edge, Elemental Blade, Elemental Nova (Magic Knight) | Lunar Multishot, Crescent Arrow (Moon Ranger) | War Cry, Stand Firm (Blader); Focus, Hunter's Mark, Leap Back (Archer); Tailwind, Gale Step (Windrunner) |
| | | Starfall, Moonveil (Moon Ranger), Stone Aegis (Magic Knight), the Beastmaster's summons and Pack Frenzy; Mend, Thrust, Guard, Rest (Trainee) |

Venom Strike and Sonic Blow (Assassin), Dual Rend and Thousand Cuts (Phantom) need a **dagger**;
Shadow Step, Vanish and Pilfer (Assassin), Phantom Double and Mirage Step (Phantom) need no weapon.

Bare hands are no sword: with no weapon a hero fights hand to hand and has no blade skills, and an
Archer or Windrunner with no bow fights hand to hand too. Starfall needs no bow and still falls from
bow range.

### Second jobs

From **Job Level 40** of a first job (it goes to 50), a three-step trial opens a second job. Job
Level starts again at 1 (up to 50, on the second-job EXP table); your first-job skills and
points stay. Second jobs wear their first job's outfit in new colours and glow with a small aura
(the Magic Knight, the Windrunner, the Moon Ranger and the Beastmaster have their own).

- **BladeMaster** (Captain Ulfr): 30 Goblins, 20 Kobold Assassins, 25 Fire Beetles.
- **Wizard** (Archmage Vigdis): 10 Fire Dust and 10 Dark Crystals, 20 Kobolds in Stone Field (Earth: fire burns them), 25 Dark Mushrooms.
- **Magic Knight** (Sir Eirik the Runeblade, Steinborg, beside Ulfr): 30 Kobolds, 10 Dark Crystals and
  15 Glow Dust, 25 Blue Crabs. Only for heroes who walked both paths with **at least 20 skill
  points in each tree**.
- **Windrunner** (Huntmaster Sigrid, Veidheim): 20 Wolves and 10 Snakes in Barley Field, then 25 more Wolves.
- **Moon Ranger** (Hrafn the Stargazer, Galdrheim): 20 Dark Wisps in Black Wood, 10 Fire Wisps in
  Ash Heath, 25 Dark Mushrooms. Only for heroes who walked the Sorcerer's and the Archer's paths
  with **at least 20 skill points in each tree**.
- **Beastmaster** (Bjarki, by Veidheim's lodge, his wolf Grimr at his side): 15 Wolves, 10 Bears,
  12 more Bears. Only for heroes who walked the Blader's and the Archer's paths with **at least 20
  skill points in each tree**.
- **Phantom** (Master Kol, Rytingborg): 20 Sand Scorpions, 20 Dune Worms, 25 Soldier Ants.
- A hero of several paths may take the BladeMaster, Wizard, Windrunner or Phantom trial only for the first
  job with the most points (a tie opens each tied one). A Job 50 hero with 30 points as a Blader and 20 as a Sorcerer may
  become a BladeMaster or a Magic Knight; with 25 and 25, any of the three; with 35 and 15, only a
  BladeMaster. Only one second job can be taken: once you accept a step of one trial, the other
  trials close. Quit a trial midway (Quit quest in the Quest View) and it starts over, and you may
  pick any trial you qualify for again.
- Job trials pay nothing for the steps on the way: the whole trial's reward comes with its last
  step.
- A second job's own skills can be raised only once **every Trainee and first-job skill point is
  spent**, and while the job's own rule still holds (a Magic Knight keeps 20 points in Blader and 20
  in Sorcerer). The Skills window says what is missing. For a Magic Knight, Moon Ranger or
  Beastmaster, a path's tree that has 20 points takes no more until the other path's has 20 too,
  and any other first job you walked takes no points until both have their 20.

| BladeMaster: one target, cut down fast | |
|---|---|
| Blade Mastery | passive, 10: +3 ATK and +1 HIT per level with swords |
| Combo Edge | passive, 10: Thrust, Cleave, Heavy Strike, Twin Fang and Piercing Edge have 4% per level to Combo, a free extra strike |
| Momentum | passive, 5: each Combo adds a stack (up to 5, 8 s), +1% ATK per level per stack |
| Twin Fang | 10: two cuts of 146–290%, each can Combo |
| Piercing Edge | 10, needs Twin Fang 3: three quick thrusts of 108–225% each, ignoring half the monster's DEF |
| Final Blade | 5, needs Piercing Edge 5 and Momentum 1: spends every Momentum stack on a flurry of 8 cuts, 66–110% each, +8% each per stack |
| Blade Dance | 5, needs Piercing Edge 3 and Combo Edge 3: like Omnislash, you vanish and dash from monster to monster within 5 paces of your target, one at a time, 5–9 slashes of 164–260% (each can Combo); nothing can touch you while you dance. 18 s cooldown |

| Wizard: the elements, over an area | |
|---|---|
| Elemental Attunement | passive, 10: spells +3% per level, and a further +3% per level to a monster weak to the spell's element |
| Resonance | passive, 5: a spell of a different element from the last (within 8 s) +6% per level |
| Stone Spike | 10: 114–240% MATK, Earth (new element for spells); Shatters the monster: the next spell of another element on it +30% |
| Earthquake | 10, needs Stone Spike 3: three shocks of 44–80% MATK Earth within 3 paces of the target; 1.5% per level each to stun for 1.5 s |
| Meteor Storm | 10, needs Ember Bolt 5: 3–7 meteors crash one after another at random spots within 3 paces of the target, 55–100% MATK Fire around each; 3% per level to set each monster hit burning |
| Storm Gust | 10, needs Frost Shard 5: a 3 s blizzard, 10 gusts of 13–22% MATK Water within 3 paces; from a monster's third gust, 2% per level each to freeze it for 2.5 s |
| Thunderstorm | 10, needs Arc Lightning 5: like Lord of Vermillion, 6 waves of lightning, 20–38% MATK Wind each within 3 paces; 1.5% per level each to paralyze for 1.5 s |

| Magic Knight: ATK and MATK together | |
|---|---|
| Spellblade | passive, 10: sword hits add 3% of your MATK per level |
| Elemental Chain | passive, 5: an Elemental Edge of a different element from your last (within 6 s) +6% per level and 3 SP back |
| Elemental Edge | 10: two quick cuts of 110–200% ATK plus 63–135% MATK each, in your blade's element (none without Elemental Blade). 3% per level each: Fire burns, Water freezes, Earth stuns, Wind crackles into the monsters beside for half and may paralyze them |
| Elemental Blade | 5, needs Spellblade 1: imbue your sword for 90–210 s; normal attacks, Edges and Novas strike as its element. Use it again to switch, free while it lasts: Fire → Water → Wind → Earth |
| Elemental Nova | 5, needs Elemental Edge 3 and Elemental Chain 1: three waves of your blade's element roll out around you to 2.5, 4 and 5.5 paces, 116–180% ATK plus 70–110% MATK each; 4% per level each to burn, freeze, paralyze or stun by element |
| Stone Aegis | 10: 20 s barrier soaking 60–150% of your ATK plus as much of your MATK, +1 DEF per level |

| Windrunner: quick shots and bursts of speed | |
|---|---|
| Windborne | passive, 10: your bow shoots 2% faster per level |
| Gale Rhythm | passive, 5, needs Windborne 3: every arrow that lands adds a stack (up to 5, 6 s), shots 1% faster per level per stack |
| Skirmisher | passive, 5: after a burst of speed, your next 3 arrows deal 8% more per level |
| Tailwind | 10: 22–40 s of bow shots 2–20% faster; for its first 4 s you rush, walking 30% quicker |
| Gale Step | 5: dash 4 paces away from the nearest monster, untouchable on the way, then walk 24–40% quicker for 2 s. 6 s cooldown |
| Hurricane Volley | 10, needs Windborne 5: a stream of 5–10 arrows, 68–140% each |
| Cyclone Arrow | 10, needs Hurricane Volley 3 and Tailwind 3: a whirlwind where the arrow lands, 7 gusts over 3 s of 39–75% to everything within 2.5 paces, pulling them in; 2% per level each to paralyze for 1.2 s |

| Moon Ranger: bow and spell, stronger at night | |
|---|---|
| Moonlit Hunter | passive, 10: at night, every skill +2% per level and +1 FLEE per level |
| Lunar Tide | passive, 5, needs Moonlit Hunter 3: at night, SP comes back 10% faster per level and Starfall costs 4% less SP per level |
| Star Sight | passive, 5: Lunar Multishot and Starfall reach 0.5 paces further per level |
| Lunar Multishot | 10: a fan of 3–6 arrows, one at the target and the rest at the monsters nearest it (all at the target if alone), each 78–150% ATK + 46–100% MATK |
| Starfall | 10, needs Lunar Multishot 3: 2–7 waves of falling stars round the target, each 34–70% ATK + 51–105% MATK to everything within 3 paces; 1.5% per level each to stun for 1.5 s |
| Crescent Arrow | 10, needs Lunar Multishot 5: a charged arrow through every monster in an 8-pace line, 168–330% ATK + 90–180% MATK |
| Moonveil | 5, needs Moonlit Hunter 1: 15 s of 4–20% less damage taken; at night every Lunar Multishot looses 2 more arrows |

The Moon Ranger's arrows hit with ATK and MATK together (KNL matters as much as FNS), in the
arrows' element. Night is when the sky is darkest; a small moon by the hotbar shows when its night
passives are at work.

| Beastmaster: sword or bow, and three beasts | |
|---|---|
| Summon Bear | 5: a Bear with gold runes and a spiked collar. Its HP and DEF grow mostly with your END; it soaks blows and roars (every 10 s), a war cry: the monsters round it turn on it, and all your beasts hit 10% harder for 6 s. **Instinct: Maul** (every 12 s), a heavy blow for 250% that stuns |
| Summon Wolves | 5: the Black Wolf and the White Wolf, in skull barding. Their HIT and ATK grow mostly with your FNS; they bite quickly, sometimes twice. **Instinct: Hamstring** (every 10 s each), a leap from up to 4 paces and a bite for 180% that slows the monster's walk by 40% for 4 s |
| Summon Hawk | 5: a brown and gold Hawk. Its attack speed and reach grow mostly with your QKN; it flies out of reach of every blow up close: only arrows and thrown or falling blows (a boss's Boulder, a Meteor Rain) reach it. **Instinct: Dive** (every 9 s), it climbs, then drops on its foe for 300%, a blow that never misses |
| Pack Frenzy | 10, needs Summon Wolves 1: for 15 s every beast attacks 3% faster and hits 3% harder per level. 30 s cooldown |
| Beast Bond | passive, 10: your beasts take 2% more of your stats per level, and you get +1 DEF per level for each beast out |
| Thick Hide | passive, 5, needs Summon Bear 3: the Bear takes 4% less damage per level, and its roar reaches further |
| Pack Tactics | passive, 5, needs Summon Wolves 3: the Wolves bite 6% harder per level while both are on the same monster |
| Wind Talons | passive, 5, needs Summon Hawk 3: the Hawk strikes 3% faster per level, and each dive has 2% per level to stun for 1 s |

Each beast stands for one of your stats, which counts a lot for it (END the Bear, FNS the Wolves, QKN the Hawk); FTN gives every beast its crits and lucky dodges, POW adds to every beast's ATK, KNL sharpens their instincts (Maul, Hamstring and Dive hit harder and come sooner, and the stun and the slow last longer), and your other stats still help each a little. A beast gets 30–80% of your stats by its Summon level (plus Beast Bond). The beasts out show beside your hero's panel, each with its health bar.

All three beasts can be out together. Each takes a share of your stats (40% at a summon's Lv 1 to
80% at Lv 5), so raising END, FNS or QKN makes them stronger at once. They follow you, take your
target (or the nearest monster coming for you), and come with you through portals; a monster they
bite may turn on them. One that falls can be called again after 20 s, and they all go home if you
faint. The Beastmaster keeps every Blader and Archer skill, and holds a cleaver or a bow (its look
changes with the weapon).

| Phantom: two daggers and illusions | |
|---|---|
| Twin Blades | passive, 10: a dagger in your left hand (the Shield slot) strikes with every blow of the right, at 55–100% of its own damage. Only a Phantom holds two daggers; the pair swings a little slower than one |
| Lingering Shade | passive, 5, needs Phantom Double 1: your illusions last 2–10 s longer and strike 6–30% harder |
| Phantom Grace | passive, 5: +1–5 QKN, and +2–10 FLEE for each illusion you have out |
| Dual Rend | 10: six cuts, right hand and left in turn, 90–180% each. 1 s cooldown |
| Phantom Double | 5: two illusions of you step out of your shadow for 15 s and fight your target with 36–60% of your damage; monsters they strike may turn on them. 20 s cooldown |
| Mirage Step | 5, needs Phantom Double 1: dash 4 paces away, untouchable, leaving an illusion where you stood: for 4–8 s every monster within 4 paces turns on it. 8 s cooldown |
| Thousand Cuts | 10, needs Dual Rend 3: spin with both blades five times, 61–115% each to every monster within 2.6 paces; 2–20% each to poison. 5 s cooldown |

Walking speed is never raised for long in Aria: the Windrunner's bursts (Tailwind's rush, the
moment after Gale Step) are the only haste, a few seconds at a time.

**Status effects.** Some skills may **freeze**, **paralyze** or **stun** a monster (it stands
helpless, tinted blue, yellow or grey) or set it **burning** (it loses a fifth of the hit that lit it
every second for 3 s, flickering orange) or **poisoned** (a fifth of the blow every second for its
time, tinted green). Bosses and MVPs resist: a third of the chance, for half as
long, and nothing takes hold while a boss is in the middle of a move.

**Elements.** Every monster has an element, and so do spells and some weapons.
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

Water: the bloops, crabs, King Crab · Earth: Sprouts, Mushrooms, beetles, Giant Sprout ·
Fire: Fire Beetles, Fire Wisps, Giant Beetle, Fire Giant · Wind: Wisps, goblins, Goblin King ·
Earth also: kobolds, Kobold King · Shadow:
Dark Mushrooms, Dark Wisps, Giant Mushroom · the desert: Earth for ants, cacti, worms, scorpions and
the Sand Wyrm, Wind for the Runners, Shadow for the Pharaoh's tomb.

**Staves** raise MATK: Wooden (+15%, given on the job change), Birch (+20%, Orm), Rune (+25%),
Ice (+28%), Root (+30%), Water (+32%), Dark (+34%, Dark Wisp 0.2%), Fire (+38%), Mushroom (+40%,
Giant Mushroom 2%), Flame (+50%, MVP 2%) and Great Staff (+55%, from three boss materials).

## Items

The Items window has three tabs: **Usables**, **Equips** and **Miscs**. Weapons, armor, boots,
wings, headgear and charms are items: equip them from the Equips tab (the piece taken off lands in
the same bag slot). In the Equipment window, tap a worn piece to see what it is and double-tap it
to take it off. Shops sell 1, 10 or all, and "Sell all" keeps what an active quest still needs.

| Usable | Effect | Where |
|---|---|---|
| Red / Orange / White Potion | 45–65 / 105–145 / 175–235 HP | Hild's shop, Ragna; drops |
| Blue Potion | 40–60 SP | Hild's shop, Ragna; Blue and Sea Bloops |
| Berry · Crab Leg | 16–22 · 70–100 HP | Bloops, Sprouts · Crabs |
| Green Herb | cures spore sickness, a little HP | Sprouts, Mushrooms |
| Speed Potion | +10% attack speed for 3 minutes | Ragna |
| Teleport Feather | random spot on this map | Hild's shop, Ragna; Wisps |
| Return Feather | back to your save point (the camp until you save with a Keeper) | Hild's shop, Ragna |
| Honey | 150–210 HP | Eydis's shop (Veidheim); Bears |

**Bows and arrows** (Archers). A shield goes with a bow, strapped to the forearm. Arrows go in the Arrows slot and are
never used up; an elemental arrow sets every shot's element.

| Bow or arrows | ATK | Where |
|---|---|---|
| Hunting Bow | 30, weapon Lv 1 | Asa's shop (600 perz); a new Archer is given one |
| Composite Bow | 55, weapon Lv 2 | Asa's shop (3,800 perz) |
| Vine Bow | 42, weapon Lv 2, Earth | Asa makes it (Base 6): 8 Leaves, 6 Seeds, 3 Shells |
| Ice Bow | 62, weapon Lv 2, Water | Asa makes it (Base 12): 4 Salt, 6 Water Drops, 6 Shells |
| Willow Longbow | 75, weapon Lv 3, FNS +1 | Asa makes it (Base 20): 10 Willow Twigs, 4 Old Bark, 4 Thorns |
| Fire Bow | 82, weapon Lv 3, Fire | Asa makes it (Base 22): 6 Burnt Shells, 6 Glow Dust, 6 Willow Twigs |
| Steel Bow | 88, weapon Lv 3, FNS +1 | Asa makes it (Base 32): 4 Steel Ore, 6 Kobold Fur, 6 Willow Twigs |
| Gale Bow | 92, weapon Lv 3, Wind, QKN +2 | Asa makes it (Base 50): the Alpha Pelt, 4 Wolf Fangs, 8 Willow Twigs |
| Heartwood Bow | 120, weapon Lv 4, FNS +3, QKN +1 | Asa makes it (Base 58): Ancient Heartwood, the Bear Heart, 6 Old Bark |
| Kobold Bow · Goblin Bow · Flame Bow · Great Bow | 74 · 95 · 110 · 115 | rare drops (below) |
| Wooden Arrows · Iron Arrows | +2 · +10 | Asa's shop (20 · 1,500 perz) |
| Fire · Ice · Wind · Earth Arrows | +5, and their element | Asa's shop (2,500 perz each) |

**Rare drops.** Each monster has a rare equip it drops very seldom. A rare find
bursts gold on the ground and shows in gold in your bag.

| Rare item | Slot | Effect | From |
|---|---|---|---|
| Bloop Ring | Accessory | FTN +2, Max HP +20 | Bloop, 0.5% |
| Water Necklace | Accessory | KNL +2, Max SP +15 | Blue Bloop, 0.3% |
| Leaf Bracelet | Accessory | END +1, QKN +1, HP recovers twice as fast | Sprout, 0.4% |
| Flower Crown | Head | FLEE +1 | Sprout, 0.5% (also crafted) |
| Shell Buckler | Shield | DEF 3, Max HP +40 | Crab, 0.3% |
| Mushroom Cloak | Garment | DEF 1, FLEE +4 | Mushroom, 0.25% |
| Stone Ring | Accessory | END +2, DEF 1 | Beetle, 0.3% |
| Horn Sword | Weapon | ATK 68, weapon Lv 3, POW +1 | Beetle, 0.15% |
| Lantern | Wings (floats at your shoulder, glowing) | KNL +1, FNS +1 | Wisp, 0.4% |
| Dark Wisp | Wings (floats at your shoulder, glowing) | KNL +2, Max SP +30 | Dark Wisp, 0.25% |
| Ember Wings | Wings (fiery wings on your back) | POW +1, KNL +1, Max HP +50 | Fire Wisp, 0.25% |
| Shiny Gel | Misc | a collector's prize | Green and Blue Bloops, 1% |
| Veteran's Boots | Shoes | DEF 3, FLEE +3, END +1, Max HP +60 | Bloop Island (a clear: 3%), or the Boatman makes it from Bloop Cores |
| Bloop Buckler | Shield | DEF 4, Max HP +80 | Bloop Island (a clear: 3%), or the Boatman makes it from Bloop Cores |
| Bleep Ring | Accessory | FTN +3, POW +1 | Bloop Island (a clear: 3%), or the Boatman makes it from Bloop Cores |
| Horned Crown | Head | DEF 4, POW +2, END +1 | Fire Giant, 5% |
| Flame Sword | Weapon | ATK 110, weapon Lv 4 | Fire Giant, 1% |
| King's Ring | Accessory | POW +2, END +1, Max HP +50 | Kobold King, 5% |
| Tooth Necklace | Accessory | QKN +2, FNS +1, HIT +5 | Goblin King, 5% |
| Giant Cape | Garment | DEF 4, Max HP +100, END +2 | Fire Giant, 3% |
| Snakeskin Boots | Shoes | DEF 3, FLEE +5, QKN +1 | Snake, 0.25% |
| Wolf Cape | Garment | DEF 3, FLEE +3, POW +1, QKN +1 | Wolf, 0.2% |
| Willow Staff | Weapon (staff) | ATK 28, MATK +26%, weapon Lv 2, Earth, KNL +2 | Willow, 0.2%; Elder Willow, 3% |
| Bear Hide | Armor (Blader) | DEF 9, Max HP +120 | Bear, 0.15% |
| Bark Shield | Shield | DEF 3, Max HP +60 | Treant, 0.2% |
| Willow Charm | Accessory | FNS +1, KNL +1, Max SP +20 | Elder Willow, 4% |
| Oak Ring | Accessory | END +3, POW +1, Max HP +80 | Ancient Treant, 5% |
| Grove Sword | Weapon | ATK 125, weapon Lv 4, Earth, POW +2, END +2 | Ancient Treant, 1% |
| Kobold Bow | Weapon (bow) | ATK 74, weapon Lv 3, Earth, FNS +1, QKN +1 | Kobold Archer, 0.25% |
| Goblin Bow | Weapon (bow) | ATK 95, weapon Lv 3, HIT +5, FNS +2 | Goblin Archer, 0.2% |
| Flame Bow | Weapon (bow) | ATK 110, weapon Lv 4, Fire, FNS +2 | Fire Giant, 1% |
| Great Bow | Weapon (bow) | ATK 115, weapon Lv 4, Wind, QKN +2, FNS +1 | Goblin King, 2% |
| Quarry Cleaver | Weapon (sword) | ATK 116, weapon Lv 4, Earth, POW +2, END +1 | Kobold King, 1% |
| Runestone Staff | Weapon (staff) | ATK 52, MATK +48%, weapon Lv 4, Earth, KNL +3, FNS +1, Max SP +40 | Kobold King, 2% |
| King's Mantle | Garment | DEF 5, END +2, FTN +1, Max HP +120 | Kobold King, 3% |
| Goblin King's Blade | Weapon (sword) | ATK 118, weapon Lv 4, Wind, QKN +2, POW +1 | Goblin King, 1% |
| Hexbone Staff | Weapon (staff) | ATK 50, MATK +46%, weapon Lv 4, Shadow, KNL +3, FTN +2 | Goblin King, 2% |
| Trickster Boots | Shoes | DEF 4, FLEE +7, QKN +2, FTN +1 | Goblin King, 3% |
| Ancient Bow | Weapon (bow) | ATK 122, weapon Lv 4, Earth, FNS +3, QKN +1 | Ancient Treant, 1% |
| Elder Staff | Weapon (staff) | ATK 58, MATK +54%, weapon Lv 4, Earth, KNL +4, FNS +1, Max SP +60 | Ancient Treant, 2% |
| Barkskin Mail | Armor | DEF 9, END +2, Max HP +150, Max SP +30 | Ancient Treant, 3% |
| Thorn Ring · Coral Shield · Dark Hood · Fire Armor · Fire Charm | | | the new lands' monsters, 0.2–0.3% |
| Thorn Cape · Sea Sword · Mushroom Staff · Fire Boots | | | the mini-bosses, 2–3% |

Two accessory slots, a shield, a garment and an arrows slot join head, face, armor, weapon, shoes and wings.

**Shields, garments and shoes.** Between the first pieces from Gunnar's shop and the rare drops:

| Piece | Slot | Effect | Where |
|---|---|---|---|
| Leaf Cape | Garment | DEF 1, FLEE +2 | Gunnar crafts it (Base 8): 12 Leaves, 4 Seeds |
| Traveler's Cloak | Garment | DEF 2, FLEE +1, Max HP +30 | Gunnar's shop (2,600 perz) |
| Shell Boots | Shoes | DEF 2, Max HP +40 | Gunnar crafts them (Base 12): 8 Shells, 2 Crab Legs, 2 Leaves |
| Iron Buckler | Shield | DEF 3, Max HP +30 | Gunnar crafts it (Base 16): 6 Iron Ore, 4 Shells |
| Rune Slippers | Shoes (Sorcerer) | DEF 1, KNL +1, Max SP +30 | Orm crafts them (Base 16): 6 Glow Dust, 6 Water Drops, 4 Leaves |
| Rune Mantle | Garment (Sorcerer) | DEF 1, KNL +1, Max SP +40 | Orm crafts it (Base 18): 10 Glow Dust, 4 Dark Crystals, 4 Water Drops |
| Rune Shield | Shield (Sorcerer) | DEF 2, KNL +1, Max SP +60 | Orm crafts it (Base 22): 5 Dark Crystals, 8 Glow Dust, 3 Salt |
| Iron Greaves | Shoes (Blader) | DEF 4, Max HP +50 | Gunnar crafts them (Base 24): 8 Iron Ore, 6 Stones, 4 Shells |
| Beetle Shield | Shield | DEF 5, Max HP +5% | Gunnar crafts it (Base 38): 6 Burnt Shells, 10 Stones, 3 Steel Ore |
| Tower Shield | Shield (Blader) | DEF 7, Max HP +120 | Gunnar crafts it (Base 48): 8 Steel Ore, 2 Hard Ore, 6 Kobold Fur |
| Sea Cloak ✦ | Garment | DEF 2, FLEE +2, Max SP +30 | Sea Bloop, 0.25% |
| Kobold Shield ✦ | Shield | DEF 4, END +1, Max HP +50 | Kobold, 0.25% |
| Kobold Sandals ✦ | Shoes | DEF 2, FNS +1, FLEE +3 | Kobold Archer, 0.25% |
| Goblin Shield ✦ | Shield | DEF 5, POW +1 | Goblin, 0.2% |
| Goblin Shroud ✦ | Garment | DEF 2, QKN +1, FLEE +6 | Goblin Assassin, 0.2% |
| Bear Paws ✦ | Shoes | DEF 4, POW +1, Max HP +80 | Bear, 0.15% |

**Wings.** The Wings slot holds wings, worn on the back (they flap gently, and cover your back when
you turn away), or a light that floats at your shoulder and glows: a Wisp, a little flame of light
with a face and fluttering wings, or the Lantern, iron and gilt, swaying on its ring with its flame
flickering. Nights are lit for every hero, so
no torch is needed.

| Wings | Look | Effect | Where |
|---|---|---|---|
| Leaf Wings | two great leaves a side, swaying | FLEE +2 | Gunnar crafts them (Base 8): 12 Leaves, 6 Seeds, 2 Shells |
| Wisp | a pale blue Wisp at your shoulder | KNL +1, Max SP +20 | Orm crafts it (Base 14): 12 Glow Dust, 6 Water Drops |
| Fairy Wings | a butterfly's, thin and sky blue, fluttering | FLEE +3, QKN +1 | Orm crafts them (Base 26): 15 Glow Dust, 10 Water Drops, a Shiny Gel |
| Lantern | a lantern at your shoulder | KNL +1, FNS +1 | Wisp, 0.4% |
| Dark Wisp | a violet Wisp at your shoulder | KNL +2, Max SP +30 | Dark Wisp, 0.25% |
| Ember Wings | tongues of flame fanning out, flickering | POW +1, KNL +1, Max HP +50 | Fire Wisp, 0.25% |
| Angel Wings | folded white wings trimmed in gold, a gold crest set with crystals down the spine | KNL +4, FTN +4, FLEE +6, Max SP +80, Max HP +5% | Bloop Island's ultra rare (a clear: 1%), or the Boatman makes them from 500 Bloop Cores |
| Devil Wings | crimson bat wings of torn membrane on dark spiked bone, with a spined tail and a barbed spear tip (the tail curls out past the legs, so it shows from the front too) | POW +2, END +1, Max HP +80 | Fire Giant, 3% |

**Weapon levels.** Lv 4 weapons are the best there are: the Giant Sword, Flame Sword, Lava Sword
and Sea Sword, the Great, Flame, Fire and Mushroom Staves, and the Heartwood, Great and Flame Bows. They refine for the most ATK
(+7 a level) and are the only gear that can take a card slot.

## Refining, slots and cards

**Holger the Refiner** (Steinborg, beside Gunnar's forge) refines weapons, armor, shields,
capes, boots and head gear, worn or in the bag, one level at a time up to **+10**, at
classic refining rates. Each level adds ATK to a weapon (+2 / +3 / +5 / +7 by weapon
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

Holger sells Iron and Steel Ore. The refining stones also drop almost anywhere: Iron Ore from most
monsters (1%), Steel Ore from level 10 (1%), and the precious Hard Ore and Armor Ore from every
monster from level 30, but only at 0.5% (the mini-bosses 4%); the kobolds, the goblins and their
kings drop them more often.

**Slotted gear.** Any piece of gear (weapons, armor, shields, garments, shoes, head and face gear,
accessories and wings; not arrows) also comes in a slotted version with one card slot, written
"Wolf Cape [1]". Slotted pieces are rarer: one in ten pieces of gear that drop, are crafted or come
from a raid has a slot, except Lv 4 weapons: they always come plain, and only Seyla opens their
slots. Shops sell the plain ones.

**Seyla the Enchanter** (Galdrheim, east of the square) opens **card slots** in Lv 4 weapons, up
to two: "+7 Giant Sword [1]", then "[2]". The first slot works half the time; each try costs 5
Hard Ore, 5 Dark Crystals, one boss material (a Giant Root, Big Pearl, Mushroom Heart or Fire
Core) and 50,000 perz. The second works a quarter of the time and costs twice as much (10, 10, 2
boss materials in any mix, 100,000 perz). A failed try breaks the weapon; any card in it comes
back to you.

**Cards.** Each MVP drops its card (1%: they are very hard to bring down), and like classic MVP cards they are overpowered.
Each mini-boss drops one too (1%): a good step up, but nothing like an MVP's. The Goblin King's, the
Fire Giant's, the Great Bear's and the Giant Beetle's go in weapons; the rest in other gear.
Every other monster drops a card too (0.1%), for every kind of gear, smaller but welcome (all but the
Little Bloops a Blue Bloop splits into: they drop neither gear nor cards).
Select a card in the Miscs tab and tap **Insert** to press it into a piece of its kind with a
free slot: the window shows what the piece becomes before you press it in. Each card gives the piece
a word in its name ("Bouncy Shell Armor [1]"; two of one card, "Double"). A piece's details list its
cards and what each does. **Seyla** draws cards out again for 50,000 perz a card ("Remove a card"):
they come back whole and the slot stays open. A piece that breaks at Holger's gives its cards back too.

| Card | Goes in | Effect | From |
|---|---|---|---|
| Bloop Card (Bouncy) | Armor | Max HP +100, FTN +1 | Bloop, 0.1% |
| Blue Crab Card (Plated) | Armor | DEF +3, Max HP +5% | Blue Crab, 0.1% |
| Crab Card (Shelled) | Shield | DEF +2, Max HP +60 | Crab, 0.1% |
| Treant Card (Rooted) | Shield | Max HP +8% | Treant, 0.1% |
| Wisp Card (Flickering) | Garment | FLEE +5 | Wisp, 0.1% |
| Snake Card (Slithering) | Garment | FLEE +3, QKN +1 | Snake, 0.1% |
| Mushroom Card (Sturdy) | Shoes | Max HP +5%, END +1 | Mushroom, 0.1% |
| Wolf Card (Swift) | Shoes | QKN +2, FLEE +2 | Wolf, 0.1% |
| Sprout Card (Sprouting) | Head or face | KNL +1, Max SP +30 | Sprout, 0.1% |
| Dark Mushroom Card (Mystic) | Head or face | KNL +2 | Dark Mushroom, 0.1% |
| Kobold Card (Strong) | Accessory | POW +2 | Kobold, 0.1% |
| Goblin Archer Card (Keen) | Accessory | FNS +2, HIT +5 | Goblin Archer, 0.1% |
| Yellow Bloop Card (Lucky) | Accessory | FTN +3 | Yellow Bloop, 0.1% |
| Dark Wisp Card (Shadowed) | Wings | KNL +2, Max SP +5% | Dark Wisp, 0.1% |
| Fire Wisp Card (Blazing) | Wings | POW +1, KNL +1, Max HP +50 | Fire Wisp, 0.1% |
| Blue Bloop Card (Calm) | Head or face | Max SP +40 | Blue Bloop, 0.1% |
| Beetle Card (Hardy) | Armor | DEF +2, END +1 | Beetle, 0.1% |
| Lantern Wisp Card (Glowing) | Wings | FNS +2, KNL +1 | Lantern Wisp, 0.1% |
| Red Bloop Card (Fiery) | Weapon | ATK +10 | Red Bloop (Bloop Island), 0.1% |
| BleepBloop Card (Grand) | Wings | ATK +40, Max HP +20%, FTN +7, KNL +4; **Gulp:** 5% of the damage you deal heals you | BleepBloop, 1% |
| Red Sprout Card (Thorny) | Garment | Max HP +5%, FLEE +2 | Red Sprout, 0.1% |
| Sea Bloop Card (Briny) | Shield | DEF +1, Max SP +5% | Sea Bloop, 0.1% |
| Fire Beetle Card (Scorched) | Armor | DEF +2, POW +1 | Fire Beetle, 0.1% |
| Kobold Archer Card (Sharp-eyed) | Head or face | FNS +2 | Kobold Archer, 0.1% |
| Kobold Assassin Card (Silent) | Shoes | QKN +1, FLEE +4 | Kobold Assassin, 0.1% |
| Goblin Card (Vicious) | Weapon | ATK +12, HIT +3 | Goblin, 0.1% |
| Goblin Assassin Card (Nimble) | Accessory | QKN +2, FLEE +2 | Goblin Assassin, 0.1% |
| Willow Card (Whispering) | Wings | KNL +1, Max SP +40 | Willow, 0.1% |
| Bear Card (Mighty) | Armor | Max HP +8%, POW +1 | Bear, 0.1% |

| Card | Goes in | Effect | From |
|---|---|---|---|
| Kobold King Card (Stubborn) | Armor | Max HP +30%, DEF +7, FLEE +7, END +7; **Tribe's Shield:** monsters' blows land 15% softer | Kobold King, 1% |
| Goblin King Card (Tyrant) | Weapon | ATK +75, POW +7, QKN +7, attacks 10% faster; **Mirror Image:** +10% lucky dodge (works on an MVP's moves too) | Goblin King, 1% |
| Giant Sprout Card (Blooming) | Accessory | Max HP +10%, END +4; **Bloom:** HP comes back 30% faster | Giant Sprout, 1% |
| King Crab Card (Tidal) | Garment | QKN +5, FLEE +8; **Sea Legs:** nothing slows you (spores, sticky or rubbled ground; roots still hold) | King Crab, 1% |
| Giant Mushroom Card (Dreaming) | Head or face | KNL +6, Max SP +10%; **Dream Spores:** SP comes back 30% faster | Giant Mushroom, 1% |
| Giant Beetle Card (Burning) | Weapon | ATK +25, POW +4; **Shell Breaker:** your blows go through 25% of a monster's DEF | Giant Beetle, 1% |
| Elder Willow Card (Elder) | Wings | FNS +3, KNL +3; **Whispering Seeds:** spells cast 15% faster | Elder Willow, 1% |
| Alpha Wolf Card (Wild) | Shoes | QKN +6, FLEE +10; **Keen Fangs:** +8% critical hits | Alpha Wolf, 1% |
| Great Bear Card (Savage) | Weapon | ATK +30, POW +5, Max HP +10%; **Wounded Fury:** below 40% HP your blows hit 20% harder | Great Bear, 1% |
| Ancient Treant Card (Ancient) | Shield | DEF +10, Max HP +20%, POW +6, END +7; **Bark Armor:** a monster striking you up close takes back 20% of the blow | Ancient Treant, 1% |
| Fire Giant Card (Infernal) | Weapon (a sorcerer's card) | MATK +30%, KNL +6, FNS +4, Max SP +15%, weapon turns Fire (+15% Fire spells with a staff); **Meteor Heart:** spells and blows set a monster burning 10% of the time | Fire Giant, 1% |

**Who can wear what.** Swords up to the Iron Sword: Trainee and Blader; rare and elemental
swords: Blader only. Staves: Sorcerer only (the Wooden Staff also Trainees). Bows and arrows:
Archer only. Heavy armor
(Beetle Armor, Chain Mail, Fire Armor): Blader only; robes: Sorcerer only; Pearl Armor:
Blader and Sorcerer. The Round Shield and Shell Buckler: Trainee, Blader and Archer. The Tower Shield and Iron
Greaves: Blader only. The Rune Shield, Rune Mantle and Rune Slippers: Sorcerer only. Everything else: any job.
A job change puts away what the new job can't use.

**Headgear you can see.** Two slots, Head and Face. Hats hide the hair they cover: Horned Helm,
Leaf Cap, Flower Crown, Horned Crown, and the animated **Fire Crown** (crafted from the
MVP's Fire Heart).

**Your look.** A character is layers: the job's body, then one shared head (the
standard face: eyes only, no mouth), then your hairstyle, then headgear. You choose your hero's
name (up to 16 letters, shown over your job and in Status), a male or female body, a hairstyle
(Tousled, Long, Straight or Ponytail, a heroine's first pick) and a hair dye (8 colours) when you start a new game; **Embla the
Stylist** by Steinborg's fountain changes them for 1,000 perz. Your hair stays
the same through job changes, and the job changes your outfit: the Trainee's browns, the Blader's
navy capelet, the Sorcerer's purple coat, the Archer's leather vest over green with a quiver on the back (on her a blue crop top, a laced
corset, shorts and over-knee boots), then the second jobs' (the Windrunner's green and gold with a
feathered collar and a long teal cape, the Moon Ranger's silver over navy with a starry cape, the
Beastmaster's horned skulls, war paint and wolf-pelt cape; on her a fitted bodice, a short skirt
and thigh-high boots), the BladeMaster's black and gold armour, the
Wizard's navy and red robe or the Magic Knight's orange coat, each holding its weapon (the Trainee
a dagger) and each with its own walk and attack. A heroine's outfits are cut to suit her in every
job: short skirts or shorts, bare thighs above over-knee or thigh-high boots, a slimmer waist, and
for the Trainee, Blader, Sorcerer, Archer, Windrunner and Beastmaster a bare midriff. Headgear snaps to the head layer, so hats sit on the crown and
glasses and masks sit on the eyes, in every direction and every frame. See
`docs/character-standard.md`.

**Perz and shops.** Perz is Aria's coin. Monsters don't drop perz: sell your loot. In Steinborg,
**Hild the Trader** sells potions, herbs and feathers, and **Gunnar** sells swords,
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
| Bloop Band (FTN +2, KNL +2, Max HP +30, Max SP +20) | Bloop Ring + Water Necklace |

## Story

**The Last Fire-Ring.** Long ago the fire-jotnar slept beneath the hills of Aria, and the first
settlers lit a ring of fires to keep them dreaming: Eldrun, the fire-ring. Now the fires burn low,
the ground of Ember Hill shakes, and the Fire Giant is waking. You arrive as a stranger with a
practice sword, asleep by the camp's last fire, and wake to the Elder's shout: a thief has stolen
the fire-ring's Heart-Ember.

**Character select.** The title screen lists your three hero slots on the left; the one picked
turns slowly in the middle (drag it, or the arrows, to turn it by hand), full size in the job it
wears with its headgear, face piece and wings, and its name (♂ or ♀), job and levels; Play (or Create Hero for an empty slot) and Delete sit under it. The **Account** menu
(top right) backs up or restores every hero and the shared storage; the speaker button turns the
sound on and off.

**A new hero** first sees the opening cutscene: the world itself tells the old tale, shot by shot
under letterbox bars (the fire-ring at night, the Fire Giant stirring on Ember Hill, the fields,
the stranger by the fire), ending on the title card; Skip ends it. Then comes the hero's making, a
screen of its own: the hero turns slowly beside the choices (name, body, a hairstyle picked from
pictures of each, hair colour, or Random). Each body has its own hairstyles: Tousled and Long for a
male hero, Straight and Ponytail for a female one, and **Begin your journey**.

The story runs beside the other quests, in chapters. Its current step sits at the top of the
quest list (purple), with directions to the next map ("Head north to Steinborg"); the minimap
rings the portal to take, or the person to talk to. A purple **!** marks who the story wants.

| Chapter | Steps |
|---|---|
| Prologue (the tutorial) | The Elder: the Heart-Ember is stolen · **lessons** on stats (raise one), equipment (wear the Elder's Traveler's Cloak), skills (Basic Training) and items (a potion on the hotbar) · defeat 3 Bloops in Moss Field · **the Gel Thief**: chase down the golden bloop that runs from you (corner it, or land a blow, and it turns to fight) · **the Ember's Light**: the ember's glow draws every bloop in the field, so hold the old stone ring for 40 seconds · bring the Heart-Ember home · the **quests** lesson: take a quest from someone with a ! and open the Quests window |
| 1: The Stone-Fort | Travel to Steinborg (Ember Hill rumbles as you arrive) · tell Captain Ulfr the fires are failing · sign the Keeper's ledger (the Keepers: healing, storage, save point, teleport) · **Saeunn reads your runes**: answer her three questions, and the runes name your calling, the Blade, the Rune or the Bow · **the hunters' village**: take her warning east to Veidheim, where young Finn swears the willows walk at night · **the Marsh Road**: hold the old way-stone in Willow Marsh for 40 seconds against the willows and bloops coming out of the water · Huntmaster Sigrid hears the warning · sign Veidheim's Keeper's ledger · sell something to Eydis on the green |
| 2: The Three Paths | A Trainee's road: 15 Blue Bloops or Crabs in Fen Shore · **by the fire** in Eldrun: the Elder tells what each first job grows into (Blader to BladeMaster, Sorcerer to Wizard, Archer to Windrunner) and the mixed second jobs of two paths (Magic Knight, Moon Ranger, Beastmaster), each shown as it would look on your own hero (a mixed job with the two first jobs it comes from), and you pick your first path · the story sends you to that trainer's town (Steinborg, Galdrheim or Veidheim) · pass a job trial. Any trainer will still try you if you change your mind, and once you have passed one trial the other first-job trials stay open: the story says so, and notices which path you took |
| 3: Embers in the Wilds | Saeunn's warning · defeat 12 Red Sprouts in Birch Grove · travel to Ember Hill |
| 4: The Fire-Ring | Archmage Vigdis will sing the fire-ring's runes anew · **the Vigil on Ember Hill**: stand in her rune circle and hold off the Giant's heralds for 75 seconds while her song reaches him · bring the song home: the fire-ring rekindled |
| 5: The Salt Road | Captain Ulfr: kobolds rob the salt carts · Hakon the Carter in Salt Bay · **Bloop Island**: the Boatman's Tutorial crossing (the first raid) · defeat 12 kobolds in Stone Field · Saeunn and the glowing red coal · go down into Coal Pit · Dag the Miner: the goblins drive the kobolds to dig for a "Waking Fire" |
| 6: The Goblin War-Band | tell Ulfr · defeat 15 goblins in Burnt Wood · Archmage Vigdis reads the two coal trails |
| 7: The Second Path | take a second job (BladeMaster, Wizard or Magic Knight) |
| 8: The Waking Fire | defeat 20 Fire Beetles in Ash Heath · travel to Serpent Wood · defeat 20 goblins, the keepers of the goblins' backward fire-ring · the backward rune-stone to Vigdis · home to the Elder |

The second saga (chapters 5–8) runs from about Base 32 to Base 55. A hero who finished the first saga
picks up at Chapter 5. No MVP is part of the story: the Fire Giant, the Kobold King and the Goblin
King wait as optional fights for the strongest.

The quest list folds away with a tap on its title bar and scrolls when it is long.

## People and quests

Tap someone to talk. A **!** bubble means they have a quest (or a job change) for you, a **?**
means you can hand one in. Active quests show under the clock.

Most quest givers have a **series**: each step pays when you hand it in, and the next is offered at
once (when you have its level), from Base 2 up to Base 90, so there is always a paying quest near the
fields you hunt. Quests pay 2x. At the top of a few late series is a **bounty**: once done, it is
offered again, for heroes past 75 whose levels take millions of EXP (each pays about a third of a
level).

**Kinds of quest.** Hunt (defeat monsters), gather (bring items), **cook or brew** (bring the
makings, then answer the cook's or brewer's questions; a wrong answer only gets a hint), **search**
(walk over the glinting things on a map), **defend** (stand by a place and hold it against waves; walk
away and the wave scatters), **deliver** (carry something to someone in another land) and **rare
hunt** (a unique monster that appears only while the quest is on, some only at night). "Go there"
leads to each.

| Who | Where | Quests (Base Level) |
|---|---|---|
| Elder Halvard | camp | The Valley Watch: Bloops at the Gate (2): 12 Bloops, 8 Sprouts · The Fen Road (6): 12 Blue Bloops, 6 Crabs · The Mushroom Wood (12): hold Dark Dale's old waystone against 3 waves of Mushrooms · The Spore Blight (14): 20 Mushrooms |
| Astrid the Cook | camp | Astrid's Kitchen: A Feast for Eldrun (10): bring 10 Bloop Gel, 5 Crab Legs, 5 Spores, then cook it with her · Crab Boil (12): 8 Crab Legs, 10 Shells · Forest Stew (16): 12 Spores, 4 Green Herbs · Salted Supper (24): 10 Salt, 10 Bloop Gel · Honey Cake (56): 6 Honey |
| Sigrun the Scout | camp | Sigrun's Map: The Lantern Wisp (14): hunt the golden Wisp that rises over Fen Shore's pond at night · The Southern Lands (32): walk Ember Hill, Black Wood and Ash Heath · The Far Lands (46): walk Barley Field, Wolf Hills, Serpent Wood and Coal Pit |
| Gyda the Healer | camp | heals HP and SP for free |
| The Keepers (butlers in black) | camp, Steinborg, Galdrheim, Veidheim, Rytingborg | sign the ledger, then: storage (shared by all your heroes), healing, Save here (where you wake after fainting, and where Return Feathers go), switch first jobs, and teleport to any other Keeper you signed with (300–500 perz) |
| Sir Eirik the Runeblade | Steinborg | the Magic Knight's trial |
| Hild the Trader | Steinborg | shop · The Trade Road: Hild's Crate (24): take a crate of potions to Hakon in Salt Bay · Kobold Fur (30): 15 · Goblin Teeth (40): 15 · Snakeskin (48): 12 |
| Gunnar the Gear Crafter | Steinborg | shop, forge · The Forge: Stone for the Forge (34): 30 Stone, 15 Burnt Shells · Iron and Steel (44): 10 Iron Ore, 4 Steel Ore · Claws and Fangs (58): 12 Bear Claws, 6 Wolf Fangs |
| Holger the Refiner | Steinborg | refines gear up to +10; sells Iron and Steel Ore |
| Ragna the Herbalist | Steinborg | brewing · The Herbalist: The Great Remedy (38): bring 6 Dark Spores and 6 Fire Dust, then brew it with her · Snake Venom (47): 8 Snakeskins, 8 Green Herbs · Honey Salve (60): 8 Honey |
| Captain Ulfr | Steinborg | The Blader's Trial · The King's Shore (30): 20 Blue Crabs · The Beetles of Ash Heath (46): 20 Fire Beetles · The Watch at War: Serpent Wood (52): 20 Goblins, 15 Archers, 15 Assassins · Coal Pit (58): 20 Kobolds, 15 Archers, 15 Assassins · The Beasts of the Shore and Heath (72): the King Crab and the Giant Beetle · Watch Bounty (80, again and again): 30 Goblin and 30 Kobold Assassins |
| Saeunn the Seeress | Steinborg | the story; lore of the Fire Giant and Galdrheim |
| Embla the Stylist | Steinborg | hairstyle and dye, 1,000 perz |
| Ivar the Ferryman | Steinborg | carts to any land you have walked, 300–3,000 perz |
| Liv the Guide | Steinborg | who does what in the city · **Reset stats / skills**: one free stat reset and one free skill reset, then 20,000 perz each. A second job's reset unlearns its first-job skills too: rebuild those first (a Magic Knight: 20 points in Blader and 20 in Sorcerer, and every first-job point spent) before its own skills open again |
| Ingrid the Tutor · Sven the Trainer · Geir the Trainer | Galdrheim · Veidheim · Rytingborg (beside the Keeper) | **Reset stats / skills**, as Liv does |
| Bjorn the Gate Guard | Steinborg | which monsters attack on sight |
| Hakon the Carter | Salt Bay, by the west road | the story (Chapter 5) |
| Boatman | Salt Bay, by the water | rows you out to **Bloop Island**, the raid (see Raids) |
| Dag the Miner | Coal Pit, by the east road | the story (Chapter 5) |
| Archmage Vigdis | Galdrheim | The Rune Trial · The Mother of Spores (40): 20 Dark Mushrooms · Fire and Ash (50): 15 Fire Dust, 10 Burnt Shells · The Spore Mother (70): the Giant Mushroom · Archmage's Bounty (85, again and again): the Giant Mushroom and the Elder Willow |
| Orm the Staffwright | Galdrheim | shop, crafts sorcerers' gear (staves, robes) · The Staffwright: The Living Wood (26): a Giant Root, 8 Thorns · Dark Ink (36): 8 Dark Crystals, 8 Dark Spores · Ember Ink (45): 10 Fire Dust, 15 Glow Dust |
| Seyla the Enchanter | Galdrheim | opens a card slot in a Lv 4 weapon (50%) |
| Kari the Curio Seller | Galdrheim | shop: potions, feathers, Speed Potions |
| Brynja the Lorekeeper | Galdrheim | The Lorekeeper: The Drowned Tomes (20): find 4 tomes washed up on the Salt Bay shore · Thorny Pages (22): 25 Red Sprouts · The Shore Library (28): 25 Blue Crabs |
| Torvald the Runecarver | Galdrheim | The Runecarver: Shadows in Black Wood (38): take rubbings of 3 Watcher stones in Black Wood · Backward Runes (42): 15 Goblins, 10 Archers, 5 Assassins · The Deep Carvers (55): 20 Kobold and 20 Goblin Assassins |
| Hrafn the Stargazer, Signy the Apprentice | Galdrheim | tales of the city, the stars and the jotnar |
| Runa the Gatewarden | Galdrheim | the rune-gate: to any land you have walked, 300–3,000 perz |
| Huntmaster Sigrid | Veidheim, at the archery range | The Archer's Trial · The Walking Willows (10): 20 Willows · The Pack in the Hills (48): 25 Wolves · The Alpha's Pack (54): 20 Wolves · The Waking Wood (70): the Great Bear and the Alpha Wolf · Hunter's Bounty (78, again and again): 30 Bears, 30 Wolves |
| Ottar the Farmer | Veidheim, by the barn | The Farmer: The Lost Lambs (16): find 3 lambs in Willow Marsh · Snakes in the Barley (46): 20 Snakes · Guard the Harvest (56): 25 Snakes, 15 Wolves |
| Leif the Tanner | Veidheim | makes hunters' gear (Hunter's Cloak and Boots, Claw Charm, Bark Armor, Alpha Cloak, Bear Heart Charm) · Pelts for the Winter (50): 10 Wolf Pelts, 5 Bear Claws · The Great Bear's Kin (59): 12 Bears · Winter Hides (64): 20 Wolf Pelts, 10 Bear Claws · Tanner's Bounty (90, again and again): the Great Bear and 20 Bears |
| Bjarki the Beastmaster | Veidheim, by the lodge | the Beastmaster's trial; his wolf Grimr never bites (unless asked) |
| Asa the Fletcher | Veidheim | shop: bows and arrows · makes bows (Vine, Ice, Willow, Fire, Steel, Gale, Heartwood) · The Fletcher: Wood for Bows (22): 12 Willow Twigs, 4 Thorns · Fang and Feather (48): 6 Wolf Fangs, 10 Willow Twigs |
| Eydis the Trader | Veidheim | shop: potions (White too), Honey, Speed Potions, feathers |
| Halla the Healer | Veidheim | heals HP and SP for free |
| Kalf the Gate Archer | Veidheim, at the north gate | The Gate Watch: Marsh Patrol (8): 12 Yellow Bloops, 8 Willows (no early quests send you into the Old Forest: the Ancient Treant roams it) |
| Bodil the Sentry, Finn the Young Archer | Veidheim | tales of the village and its lands |
| Tove the Carter | Veidheim | carts to any land you have walked |
| Master Kol | Rytingborg | The Assassin's Trial · the Phantom's trial |
| Dalla the Trader | Rytingborg, the bazaar | shop (potions, Dates, Water Skins) · The Bazaar: Warm Gel (6): 8 Red Gel · Jaws in the Sacks (10): 15 Giant Ants |
| Steinar the Smith | Rytingborg | shop, forge · The Smith: Soldier's Shells (62): 20 Ant Mandibles, 6 Worm Hides |
| Yrsa the Bladewright | Rytingborg | daggers, **Make daggers** · The Bladewright: Venom for Steel (60): 10 Scorpion Tails, 10 Cactus Needles |
| Thora the Caravan Master | Rytingborg | The Caravan: Needles on the Road (56): 20 Cacti · The Stinging Road (62): 25 Sand Scorpions · The Humming Sand (66): 20 Soldier Ants, 10 Dune Worms · Caravan Bounty (68, again and again): 30 Soldier Ants, 20 Sand Scorpions |
| Ketil the Water-seller | Rytingborg | The Water-seller: Skins for Water (58): 8 Worm Hides · Feathers for the Shade (63): 10 Runner Feathers |
| Arne the Gate Guard | Rytingborg, the north gate | The Gate Watch: Red Sands (8): 20 Red Bloops |
| Saga the Healer · Orvar the Caravaneer · Little Toki | Rytingborg | healing · carts to any land you have walked · lore |
| Sindri the Tomb Guide | Scorpion Sands, at the Pyramid | leads you into **Pharaoh's Tomb**, the raid, and makes its rare finds from Tomb Cores |

People without a PixelLab sprite of their own are dressed from a bald hero body (Trainee, Blader,
Sorcerer or Magic Knight) in their own colours, with the shared head, a hairstyle, a dye and
headgear (`dress` in `src/quests.js`). No one's look repeats except a role every town can have: the
Keepers share theirs, as do the smiths (Holger, Seyla) and the carters and gate-wardens (Ivar,
Runa, Tove) and Veidheim's sentries; Galdrheim's Orm and Kari dress like Steinborg's Gunnar and Hild.
Veidheim's archers wear a longbow and a quiver on their backs (`src/bow.js`), painted onto their frames. People with tales to tell have a **Tell me more** button.

**Quests window** (the Quests button under your hero's panel): every quest in four tabs. **Main**
is the story: the step you are on (tap it for its Quest View) and each chapter, done, under way or
ahead. **Job** holds the job trials, **Series** the quest chains people give one after another
(The Valley Watch 1, 2, 3...), and **Side** the quests that stand alone and the bounties. Each tab
lists what is ready to hand in, what is under way (with your progress), what is on offer and from
whom and where, what waits on a level, and what you have done; a tab's number is how many are
under way. Tap a quest under way for its Quest View; a quest on offer has a **Go there** button
that walks you to whoever offers it.

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
monsters are cut at the waterline, and rings spread round them as they move.

## Day and night

A full day lasts 10 minutes. Night brings Wisps and extra monsters. Rest in the tent
to restore HP, save, and sleep until morning.

## Roadmap

- [x] **M1–M6** Map, combat, drops and crafting, monsters, day/night, sound and title screen
- [x] **M7** PixelLab sprites for the whole cast
- [x] **M8** Leveling and equipment
- [x] **M9** Camp villagers and quest chains
- [x] Classic MMORPG-style controls, rules, windows, maps and portals; Aria's own skills; MVP boss
- [x] Steinborg, four new lands, mini-bosses, perz and shops, the Sorcerer and job trials
- [x] Cards, more jobs, raids, the Beastmaster's pack
- [x] Rytingborg and the desert: the Assassin and the Phantom, the Sand Wyrm, Pharaoh's Tomb, the Sphinx's secret
- [ ] **The Sphinx's halls**, Aria's first dungeon (four maps inside the Giant Sphinx)
- [ ] **Ten cities.** Five early-game cities (Steinborg, Galdrheim, Veidheim and Rytingborg so far,
  one more to come), then five late-game ones. The first half of Aria's making ends with the fifth city.

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

The hero's job bodies are painted in code, male and female, from the owner's uniform sheets
(`src/trainees.js`, `bladers.js`, `mages.js`, `mknights.js`, with the moves in `design-anim.js`);
`art/designs/` holds their sheets. Every other character is made with PixelLab's Pro mode from a
style reference: the first hero from a style reference sprite (kept out of the repo), everyone
else from it, so the cast shares one look. Raw exports live in `art/pixellab/<name>/`; older versions stay in `*_v1` / `*_v2`.

```bash
# needs PIXELLAB_API_KEY (and PIXELLAB_STYLE_REF for the player)
python3 build-tools/pixellab.py generate art/pixellab crab   # make one character
python3 build-tools/pixellab.py finish art/pixellab crab     # fill in missing animations
python3 build-tools/pack-sprites.py                          # write src/art/<name>.png + .json
```

Each character has 4 standing directions; the player and monsters add `walk` or `hop` and
`attack`. The packer crops frames to one box per character, erases stray specks and records where
the feet are so sprites stand on their shadows.
