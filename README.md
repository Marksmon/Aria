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
New builds install over old ones (same signing key), so your save is kept.

## Controls

Ragnarok-style: no on-screen controller. Landscape.

| Touch | Desktop |
|---|---|
| Tap the ground: walk there (tile by tile) | Click |
| Tap a monster: walk up and keep attacking it | Click |
| Tap an item on the ground: pick it up | Click |
| Tap a person, the chest (camp or Steinborg storage) or the tent: talk / open / rest | Click |
| Step onto a glowing portal: go to the next map | |
| Hotbar (bottom): tap a slot to use a skill or item | 1–6 |
| Drag active skills (Skills window) and usable items (Items window) onto the hotbar; drag a slot off to clear it | Drag |
| Drag one finger: turn the camera · pinch: zoom | Drag or Q / E · mouse wheel |
| Window buttons under the HP / SP box: Status, Equip, Items, Skills | Alt+A, Alt+Q, Alt+E (or I / B), Alt+S · Esc closes |

The hotbar starts empty. Windows are small, can be dragged anywhere by their title bar, and the
game keeps running while they are open.

## Maps

Eldrun Camp and Steinborg are safe town maps; everything else is a 64×64 field. Only two
portals leave the camp (Mosvangr to the north, Fenstrand to the west); every other map is
reached by travelling on. Place names are Old Norse in style.

```
  Galdrheim  Steinborg - Birkilund
     |           |           |
     |       Mosvangr  -  Myrkdal  -  Svartskog
     |           |           |           |
 Fenstrand - Eldrun Camp   Glodberg  -  Askheid
     |
  Saltvik
```

| Map | Level | Monsters | Boss |
|---|---|---|---|
| Mosvangr (moss-field) | 1–6 | Slime (Lv 1), Sprout (3) | |
| Fenstrand (fen-shore) | 5–12 | Blue Slime (6, splits), Crab (9) | |
| Myrkdal (dark dale) | 12–18 | Mushroom (14, slowing spores) | |
| Birkilund (birch grove) | 16–26 | Red Sprout (18), Sprout, Slime | Giant Sprout (25) |
| Saltvik (salt bay) | 20–32 | Sea Slime (22), Blue Crab (26), Crab | King Crab (32) |
| Glodberg (ember-hill) | 28–36 | Beetle (30) | **Fire Giant (60, MVP)** |
| Svartskog (black wood) | 32–42 | Dark Mushroom (34), Dark Wisp (38), Mushroom | Giant Mushroom (40) |
| Askheid (ash heath) | 40–50 | Fire Beetle (42), Fire Wisp (45), Beetle | Giant Beetle (48) |
| Any field, at night | | Wisp (11) | |

**Passive monsters.** Like most of Ragnarok's field monsters, they leave you alone until you hit
them; then they fight back for a while. Only the Dark Wisps, the fire beasts of Askheid, the
mini-bosses and the Fire Giant attack on sight. A Sprout runs away, and fights only when
cornered.

The new lands' monsters are palette swaps of the valley's, like Ragnarok's slime family. No
health bars: monsters flash white when hit and wobble when nearly beaten. They respawn 60 s
after they fall, twice as fast at night.

**Bosses.** Each new field has a mini-boss: big, slow, stomping the ground around it, back 5–8
minutes after it falls. They drop a rare material (30%) that forges the best gear, and a rare
equip of their own (2–3%). They hit hard: at their own level each is a 3–4 minute fight and a
bag of potions, so most players come a few levels above them (Giant Sprout 25, King Crab 32,
Giant Mushroom 40, Giant Beetle 48).

**MVP.** The Fire Giant (Lv 60, 24,000 HP, Fire), optional and not part of the story, waits in the south of Glodberg and stomps the
ground around it every few seconds. It is made for one Base 50 hero in the best gear: about three
minutes and a bag of potions (a Blader drinks around 50 White Potions; a Sorcerer who keeps
moving needs far fewer, but Blue Potions too). Whoever brings it down gets **MVP** over their
head, bonus Base EXP and MVP items straight to the bag, plus its drops (its horn, crown, cape or
sword). It comes back 15 minutes later, even if you leave the map or close the game.

**Steinborg.** A walled market city north of Mosvangr: stone walls with towers and two gates
(south to Mosvangr, east to Birkilund), timber houses round a fountain square, a forge, market
stalls and the seeress's tower. The buildings are 3D, like Ragnarok's towns, and fade when they
stand between you and the camera. Its storehouse opens the same chest as the camp's.

**Galdrheim.** The city of sorcerers, north of Fenstrand: pale lavender stone, violet and teal
roofs, star banners over the gate and crystals glowing on every tower. In its square a circle of
runes glows over the rune-well, with a crystal floating above it; the Archmage's three-tiered
tower stands to the north, the library to the west, the Staffwright's workshop to the east, the
Watcher runestones and the stargazer's observatory to the south. Sorcerers take their job trial
here, and their gear is made here. It has a storehouse too (the same chest).

## Character

Ragnarok's classic rules with Aria's own stat names (see `docs/ragnarok-mechanics.md`):
POW (STR), QKN (AGI), END (VIT), KNL (INT), FNS (DEX), FTN (LUK). Base Level and Job Level
gain EXP separately; stat points come from Base Levels, skill points from Job Levels. HP does
not recover while you walk; resting doubles it.

**Placing stat points.** In the Status window, ▲ places a point (shown in green, with how many
are pending); **Confirm** locks them in and **Reset** takes back any not yet locked in. Closing
the window also takes back unconfirmed points.

**Rates.** 1x, like an official Ragnarok server: Base and Job EXP are what the monsters and quests
give (`RATES` in `src/main.js`).

## Jobs and skills

Aria's own jobs and skills, kept modest. A **Trainee** puts points into **Basic Training**; the
other Trainee skills come free with Job Levels. At Trainee Job 10 with Basic Training 9, a job
trial opens: three short steps a Trainee of Base Level ~10 can do. **Captain Ulfr** in Steinborg
tests Bladers (10 Slimes, 8 Sprouts, 5 Crabs); **Archmage Vigdis** in Galdrheim tests Sorcerers
(Water Drops and Seeds, 6 Blue Slimes, then Glow Dust from the night Wisps). Pass, and
they change your job. Elder Halvard sends ready Trainees on to the city.

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
| Heavy Strike | 10, needs Cleave 3 | 145–280%, +3% hit per level |
| War Cry | 10 | monsters within 6 paces turn on you; ATK +1% per level for 20 s |
| Stand Firm | 10, needs War Cry 3 | no flinching, 1% less damage per level |
| Ground Slash | 10, needs Heavy Strike 5 | 110–200% to everything close, pushing it back a little |
| Battle Rhythm | Job 10, passive | every 5th hit restores 1 SP |
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
Fire: Fire Beetles, Fire Wisps, Giant Beetle, Fire Giant · Wind: Wisps · Shadow:
Dark Mushrooms, Dark Wisps, Giant Mushroom.

**Staves** raise MATK: Wooden (+15%, given on the job change), Birch (+20%, Orm), Rune (+25%),
Ice (+28%), Root (+30%), Water (+32%), Dark (+34%, Dark Wisp 0.2%), Fire (+38%), Mushroom (+40%,
Giant Mushroom 2%), Flame (+50%, MVP 2%) and Great Staff (+55%, from three boss materials).

## Items

The Items window has three tabs: **Usables**, **Equips** and **Miscs**. Weapons, armor, boots,
torch, headgear and charms are items: equip them from the Equips tab, and tap a worn piece in
the Equipment window to take it off.

| Usable | Effect | Where |
|---|---|---|
| Healing / Strong / White Potion | 45–65 / 105–145 / 175–235 HP | Hild's shop, Ragna; drops |
| Blue Potion | 40–60 SP | Hild's shop, Ragna; Blue and Sea Slimes |
| Berry · Crab Leg | 16–22 · 70–100 HP | Slimes, Sprouts · Crabs |
| Green Herb | cures spore sickness, a little HP | Sprouts, Mushrooms |
| Speed Potion | +10% attack speed for 3 minutes | Ragna |
| Teleport Feather | random spot on this map | Hild's shop, Ragna; Wisps |
| Return Feather | back to camp | Hild's shop, Ragna |

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
| Flame Sword | Weapon | ATK 110, weapon Lv 3 | Fire Giant, 1% |
| Giant Cape | Garment | DEF 4, Max HP +100, END +2 | Fire Giant, 3% |
| Thorn Ring · Coral Shield · Dark Hood · Fire Armor · Fire Charm | | | the new lands' monsters, 0.2–0.3% |
| Thorn Cape · Sea Sword · Mushroom Staff · Fire Boots | | | the mini-bosses, 2–3% |

Two accessory slots, a shield and a garment slot join head, face, armor, weapon, shoes and light.

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
| Lava Sword (ATK 95, POW +2) | Fire Core (Giant Beetle) |
| Giant Sword (ATK 120, weapon Lv 4, POW +3, END +1) | Giant Horn + Fire Heart + Fire Core |
| Rainbow Ring (every stat +1) | Shiny Gel |
| Slime Band (FTN +2, KNL +2, Max HP +30, Max SP +20) | Slime Ring + Water Necklace |

## Story

**The Last Fire-Ring.** Long ago the fire-jotnar slept beneath the hills of Aria, and the first
settlers lit a ring of fires to keep them dreaming: Eldrun, the fire-ring. Now the fires burn low,
the ground of Glodberg shakes, and the Fire Giant is waking. You arrive as a stranger with a
practice sword, asleep by the camp's last fire.

The story runs beside the other quests, in chapters. Its current step sits at the top of the
quest list (purple), with directions to the next map ("Head north to Steinborg"); the minimap
rings the portal to take, or the person to talk to. A purple **!** marks who the story wants.

| Chapter | Steps |
|---|---|
| Prologue (the tutorial) | Talk to the Elder · raise a stat · defeat 3 Slimes in Mosvangr · learn Basic Training · put a potion on the hotbar · back to the Elder |
| 1: The Stone-Fort | Travel to Steinborg · tell Captain Ulfr the fires are failing · meet Saeunn the Seeress · sell something for perz |
| 2: Blade or Rune | Pass a job trial and become a Blader or a Sorcerer |
| 3: Embers in the Wilds | Saeunn's warning · defeat the Giant Sprout in Birkilund · travel to Glodberg |
| 4: The Fire-Ring | Archmage Vigdis sings the fire-ring's runes anew · bring the song home: the fire-ring rekindled |

The Fire Giant is no part of the story: it waits in Glodberg as an optional MVP for the strongest.

The quest list folds away with a tap on its title bar and scrolls when it is long.

## People and quests

Tap someone to talk. A **!** bubble means they have a quest (or a job change) for you, a **?**
means you can hand one in. Active quests show under the clock.

A few big jobs instead of many errands: one each in the camp, and a handful in Steinborg.

| Who | Where | Quests (Base Level) |
|---|---|---|
| Elder Halvard | camp | The Mushroom Wood (12): 25 Mushrooms |
| Astrid the Cook | camp | A Feast for Eldrun (10): 20 Slime Gel, 10 Crab Legs, 10 Spores |
| Sigrun the Scout | camp | Lights in the Dark (10): 15 Wisps, at night |
| Gyda the Healer | camp | heals HP and SP for free |
| Hild the Trader | Steinborg | shop · Pearls of Saltvik (24): 5 Pearls |
| Gunnar the Gear Crafter | Steinborg | shop, forge · Stone for the Forge (34): 30 Stone, 15 Burnt Shells |
| Ragna the Herbalist | Steinborg | brewing · The Great Remedy (38): 12 Dark Spores, 12 Fire Dust |
| Captain Ulfr | Steinborg | The Blader's Trial · The King of the Shore (30): the King Crab · The Beetle of Askheid (46): the Giant Beetle |
| Saeunn the Seeress | Steinborg | the story; lore of the Fire Giant and Galdrheim |
| Embla the Stylist | Steinborg | hairstyle and dye, 1,000 perz |
| Ivar the Ferryman | Steinborg | carts to any land you have walked, 300–1,800 perz |
| Liv the Guide | Steinborg | who does what in the city |
| Bjorn the Gate Guard | Steinborg | which monsters attack on sight |
| Archmage Vigdis | Galdrheim | The Rune Trial · The Mother of Spores (40): the Giant Mushroom |
| Orm the Staffwright | Galdrheim | shop, crafts sorcerers' gear (staves, robes) · The Living Wood (26): a Giant Root, 8 Thorns |
| Kari the Curio Seller | Galdrheim | shop: potions, feathers, torches, Speed Potions |
| Brynja the Lorekeeper | Galdrheim | The Drowned Tomes (20): 15 Salt, 10 Water Drops |
| Torvald the Runecarver | Galdrheim | Shadows in Svartskog (38): 10 Dark Crystals |
| Hrafn the Stargazer, Signy the Apprentice | Galdrheim | tales of the city, the stars and the jotnar |
| Runa the Gatewarden | Galdrheim | the rune-gate: to any land you have walked, 300–1,800 perz |

Gyda, Ivar, Liv, Bjorn and the people of Galdrheim borrow other people's sprites until their own are drawn. People with tales to tell have a **Tell me more** button.

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
