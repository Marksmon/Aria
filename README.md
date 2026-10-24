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
             Steinborg - Birkilund
                 |           |
  Saltvik    Mosvangr  -  Myrkdal  -  Svartskog
     |           |           |           |
 Fenstrand - Eldrun Camp   Glodberg  -  Askheid
```

| Map | Level | Monsters | Boss |
|---|---|---|---|
| Mosvangr (moss-field) | 1–6 | Green Slime (Lv 1), Sproutling (3) | |
| Fenstrand (fen-shore) | 4–8 | Blue Slime (5, splits), Mudcrab (7) | |
| Birkilund (birch grove) | 6–12 | Russet Sproutling (9), Sproutling, Green Slime | Bramble Matron (14) |
| Saltvik (salt bay) | 9–15 | Brine Slime (10), Tidecrab (11), Mudcrab | Tide King (17) |
| Myrkdal (dark dale) | 10–16 | Mushling (12, slowing spores) | |
| Glodberg (ember-hill) | 14–25 | Pebble Beetle (16) | **Ember Jarl (25, MVP)** |
| Svartskog (black wood) | 16–22 | Gloomcap (18), Shade Wisp (19), Mushling | Gloom Mother (22) |
| Askheid (ash heath) | 20–28 | Cinder Beetle (23), Ember Wisp (21), Pebble Beetle | Cinder Lord (26) |
| Any field, at night | | Firefly Wisp (8) | |

The new lands' monsters are palette swaps of the valley's, like Ragnarok's slime family. No
health bars: monsters flash white when hit and wobble when nearly beaten. They respawn 60 s
after they fall, twice as fast at night.

**Bosses.** Each new field has a mini-boss: big, slow, stomping the ground around it, back 5–8
minutes after it falls. They drop a rare material (30%) that forges the best gear, and a rare
equip of their own (2–3%).

**MVP.** The Ember Jarl waits in the south of Glodberg. It stomps the ground around it every few
seconds. Whoever brings it down gets **MVP** over their head, bonus Base EXP and MVP items
straight to the bag, plus its drops (its horn, crown, mantle or sword). It comes back 15
minutes later, even if you leave the map or close the game. For now it is softened (Lv 25,
3,200 HP) so a Base ~25 Blader or Sorcerer can take it alone with a few Strong Draughts.

**Steinborg.** A walled market city north of Mosvangr: stone walls with towers and two gates
(south to Mosvangr, east to Birkilund), timber houses round a fountain square, a forge, market
stalls and the seeress's tower. The buildings are 3D, like Ragnarok's towns, and fade when they
stand between you and the camera. Its storehouse opens the same chest as the camp's.

## Character

Ragnarok's classic rules with Aria's own stat names (see `docs/ragnarok-mechanics.md`):
POW (STR), QKN (AGI), END (VIT), KNL (INT), FNS (DEX), FTN (LUK). Base Level and Job Level
gain EXP separately; stat points come from Base Levels, skill points from Job Levels. HP does
not recover while you walk; resting doubles it.

**Placing stat points.** In the Status window, ▲ places a point (shown in green, with how many
are pending); **Confirm** locks them in and **Reset** takes back any not yet locked in. Closing
the window also takes back unconfirmed points.

**Rates.** Like a Ragnarok server's "x8 / x12", every Base EXP gain is ×8 and every Job EXP
gain ×12 (`RATES` in `src/main.js`), so you can reach the Ember Jarl in about half an hour.

## Jobs and skills

Aria's own jobs and skills, kept modest. A **Trainee** puts points into **Basic Training**; the
other Trainee skills come free with Job Levels. At Trainee Job 10 with Basic Training 9, a job
trial opens in Steinborg: **Captain Ulfr** tests Bladers (defeat 8 Russet Sproutlings),
**Saeunn the Seeress** tests Sorcerers (bring Glow Dust, Dew Drops and Sprout Seeds). Pass, and
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
A new Sorcerer is handed an Apprentice Staff.

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
are Neutral unless the weapon has one (Ember Edge, Emberbrand, Cinderfang and the Jarl Hornblade
are Fire, Tidebreaker and Frostbite Water, Galeblade Wind, Stone Blade and Beetlehorn Blade
Earth). An elemental staff also adds 15% to spells of its own element (Frostwood and Tidecaller
Water, Emberheart and the Jarl's staff Fire, Heartwood Earth, Nightshade and Mothercap Shadow).
A strong hit (150%) shows in gold, a weak one (25–50%) in grey.

| Attack \ Monster | Water | Earth | Fire | Wind | Shadow |
|---|---|---|---|---|---|
| Fire | 50% | **150%** | 25% | 100% | 100% |
| Water | 25% | 100% | **150%** | 50% | 100% |
| Wind | **150%** | 50% | 100% | 25% | 100% |
| Earth | 100% | 25% | 50% | **150%** | 100% |

Water: the slimes, crabs, Tide King · Earth: Sproutlings, Mushlings, beetles, Bramble Matron ·
Fire: Cinder Beetles, Ember Wisps, Cinder Lord, Ember Jarl · Wind: Firefly Wisps · Shadow:
Gloomcaps, Shade Wisps, Gloom Mother.

**Staves** raise MATK: Apprentice (+15%, given on the job change), Birchwood (+20%, Gunnar),
Rune (+25%), Frostwood (+28%), Heartwood (+30%), Tidecaller (+32%), Nightshade (+34%, Shade Wisp
0.2%), Emberheart (+38%), Mothercap (+40%, Gloom Mother 2%), Staff of the Ember Jarl (+50%, MVP
2%) and Runeking's Staff (+55%, forged from three boss materials).

## Items

The Items window has three tabs: **Usables**, **Equips** and **Miscs**. Weapons, armor, boots,
torch, headgear and charms are items: equip them from the Equips tab, and tap a worn piece in
the Equipment window to take it off.

| Usable | Effect | Where |
|---|---|---|
| Healing / Strong / Greater Draught | 45–65 / 105–145 / 175–235 HP | Hild's shop, Ragna; drops |
| Mana Tonic | 40–60 SP | Hild's shop, Ragna; Blue and Brine Slimes |
| Wild Berry · Crab Leg | 16–22 · 70–100 HP | Slimes, Sproutlings · Mudcrabs |
| Green Herb | cures spore sickness, a little HP | Sproutlings, Mushlings |
| Quickening Draught | +10% attack speed for 3 minutes | Ragna |
| Wander Feather | random spot on this map | Hild's shop, Ragna; Wisps |
| Homeward Feather | back to camp | Hild's shop, Ragna |

**Rare drops.** Like Ragnarok, each monster has a rare equip it drops very seldom. A rare find
bursts gold on the ground and shows in gold in your bag.

| Rare item | Slot | Effect | From |
|---|---|---|---|
| Gooey Ring | Accessory | FTN +2, Max HP +20 | Green Slime, 0.5% |
| Tidewater Pendant | Accessory | KNL +2, Max SP +15 | Blue Slime, 0.3% |
| Seedling Band | Accessory | END +1, QKN +1, HP recovers twice as fast | Sproutling, 0.4% |
| Flower Wreath | Head | FLEE +1 | Sproutling, 0.5% (also crafted) |
| Mudshell Buckler | Shield | DEF 3, Max HP +40 | Mudcrab, 0.3% |
| Sporeweave Cloak | Garment | DEF 1, FLEE +4 | Mushling, 0.25% |
| Pebble Ring | Accessory | END +2, DEF 1 | Pebble Beetle, 0.3% |
| Beetlehorn Blade | Weapon | ATK 68, weapon Lv 3, POW +1 | Pebble Beetle, 0.15% |
| Wisp Lantern | Light | lights the night, KNL +1, FNS +1 | Firefly Wisp, 0.4% |
| Shimmering Gel | Misc | a collector's prize | Green and Blue Slimes, 1% |
| Jarl's Ember Crown | Head | DEF 4, POW +2, END +1 | Ember Jarl, 5% |
| Emberbrand | Weapon | ATK 110, weapon Lv 3 | Ember Jarl, 1% |
| Jarl's Mantle | Garment | DEF 4, Max HP +100, END +2 | Ember Jarl, 3% |
| Bramble Ring · Coral Shield · Gloom Hood · Cinder Mail · Ember Charm | | | the new lands' monsters, 0.2–0.3% |
| Thornweave Mantle · Tidebreaker · Mothercap Staff · Cinder Greaves | | | the mini-bosses, 2–3% |

Two accessory slots, a shield and a garment slot join head, face, armor, weapon, shoes and light.

**Who can wear what.** Swords up to the Iron Sword: Trainee and Blader; rare and elemental
swords: Blader only. Staves: Sorcerer only (the Apprentice Staff also Trainees). Heavy armor
(Beetle Plate, Chain Mail, Cinder Mail): Blader only; robes: Sorcerer only; Pearlscale Mail:
Blader and Sorcerer. Bucklers and round shields: Trainee and Blader. Everything else: any job.
A job change puts away what the new job can't use.

**Headgear you can see.** Two slots, Head and Face. Hats hide the hair they cover: Horned Helm,
Woven Cap, Flower Wreath, Jarl's Ember Crown, and the animated **Flame Circlet** (crafted from the
MVP's Ember Heart).

**Your look, Ragnarok style.** A character is layers: the job's body, then one shared head (the
standard face: eyes only, no mouth), then your hairstyle, then headgear. You choose a hairstyle
(Tousled or Long) and a hair dye (8 colours) when you start a new game; **Embla the Stylist** by
Steinborg's fountain changes them for 1,000 perz. Your hair stays the same through job changes,
and the job changes your outfit. Headgear snaps to the head layer, so hats sit on the crown and
glasses and masks sit on the eyes, in every direction and every frame. See
`docs/character-standard.md`.

**Perz and shops.** Perz is Aria's coin (Ragnarok's zeny). Monsters don't drop perz, as in Ragnarok: sell your loot. In Steinborg,
**Hild the Trader** sells draughts, tonics, herbs, feathers and torches, and **Gunnar** sells
swords, staves, armor, shields, capes and boots. Any shop buys anything for half its price.
Quests pay perz too. Your perz shows in the Items window.

**Crafting** is done in Steinborg (the campfire is just a fire now): **Gunnar the Gear Crafter**
forges weapons, staves, armor, headgear and charms, and **Ragna the Herbalist** brews draughts,
tonics and feathers, from materials in your bag and storage. Recipes need a Base Level. The best
gear comes from boss materials:

| Forged | Made from |
|---|---|
| Heartwood Staff (MATK +30%, KNL +2, FNS +2) | Heartwood (Bramble Matron) |
| Pearlscale Mail (DEF 7, Max HP +40, Max SP +30) | King's Pearl (Tide King) |
| Gloomweave Robe (DEF 4, Max SP +60, KNL +2) | Gloom Heart (Gloom Mother) |
| Cinderfang (ATK 95, POW +2) | Cinder Core (Cinder Lord) |
| Jarl Hornblade (ATK 120, weapon Lv 4, POW +3, END +1) | Jarl's Horn + Ember Heart + Cinder Core |
| Prism Ring (every stat +1) | Shimmering Gel |
| Twin Slime Band (FTN +2, KNL +2, Max HP +30, Max SP +20) | Gooey Ring + Tidewater Pendant |

## Story

**The Last Fire-Ring.** Long ago the fire-jotnar slept beneath the hills of Aria, and the first
settlers lit a ring of fires to keep them dreaming: Eldrun, the fire-ring. Now the fires burn low,
the ground of Glodberg shakes, and the Ember Jarl is waking. You arrive as a stranger with a
practice sword, asleep by the camp's last fire.

The story runs beside the other quests, in chapters. Its current step sits at the top of the
quest list (purple), with directions to the next map ("Head north to Steinborg"); the minimap
rings the portal to take, or the person to talk to. A purple **!** marks who the story wants.

| Chapter | Steps |
|---|---|
| Prologue (the tutorial) | Talk to the Elder · raise a stat · defeat 3 Green Slimes in Mosvangr · learn Basic Training · put a draught on the hotbar · back to the Elder |
| 1: The Stone-Fort | Travel to Steinborg · tell Captain Ulfr the fires are failing · meet Saeunn the Seeress · sell something for perz |
| 2: Blade or Rune | Pass a job trial and become a Blader or a Sorcerer |
| 3: Embers in the Wilds | Saeunn's warning · defeat the Bramble Matron in Birkilund · travel to Glodberg · reach Base Level 22 |
| 4: The Ember Jarl | The Elder's last gifts · defeat the Ember Jarl · the fire-ring rekindled |

The quest list folds away with a tap on its title bar and scrolls when it is long.

## People and quests

Tap someone to talk. A **!** bubble means they have a quest (or a job change) for you, a **?**
means you can hand one in. Active quests show under the clock.

| Who | Where | Quests (Base Level) |
|---|---|---|
| Elder Halvard | camp | The Green Blight (1), Claws of the Fen (5), The Rot of Myrkvid (10), Wrath of the Stone-Backs (14) |
| Astrid the Cook | camp | Jelly for the Mead-Hall (1), Water from Urd's Well (4), Sól's Lantern Soup (6), The Jarl's Stew (8) |
| Sigrun the Scout | camp | The Four Realms (1), Seeds of Yggdrasil (2), Twin-Born of the Fen (4), Lights of the Álfar (7) |
| Hild the Trader | Steinborg | shop · Roads for Trade (5), Pearls of Saltvik (10) |
| Gunnar the Gear Crafter | Steinborg | shop, forge · Stone for the Forge (10) |
| Ragna the Herbalist | Steinborg | brewing · Bramble Tea (6), Salt of the Sea (9), Spores of Svartskog (16), Embers of Askheid (20) |
| Captain Ulfr | Steinborg | The Blader's Trial · Briars on the Road (7), The Saltvik Shore (10), Into the Black Wood (16), Fire on the Heath (20) |
| Saeunn the Seeress | Steinborg | The Rune Trial · Shadows in Svartskog (16) |

## Day and night

A full day lasts 10 minutes. Night brings Firefly Wisps and extra monsters. Rest in the tent
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
