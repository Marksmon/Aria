# Aria

A small 2.5D open-world fantasy RPG for phones, in the spirit of old-school Ragnarok Online:
painted 2D sprites standing in a 3D world. You camp in the valley of Aria, explore freely,
fight small monsters, collect what they drop and craft better gear at the campfire.

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
| Tap a villager, the campfire, chest or tent: talk / craft / open / rest | Click |
| Step onto a glowing portal: go to the next map | |
| Hotbar (bottom): tap a slot to use a skill or item | 1–6 |
| Drag active skills (Skills window) and usable items (Items window) onto the hotbar; drag a slot off to clear it | Drag |
| Drag one finger: turn the camera · pinch: zoom | Drag or Q / E · mouse wheel |
| Window buttons under the HP / SP box: Status, Equip, Items, Skills | Alt+A, Alt+Q, Alt+E (or I / B), Alt+S · Esc closes |

The hotbar starts empty. Windows are small, can be dragged anywhere by their title bar, and the
game keeps running while they are open.

## Maps

Eldrun Camp is a safe town map. Four portals lead to the field maps, and neighbouring fields
link to each other. Each map is 64×64; place names are Old Norse in style.

| Map | From camp | Monsters | Drops |
|---|---|---|---|
| Mosvangr (moss-field) | North | Green Slime (Lv 1), Sproutling (3) | Slime Gel, Wild Berry · Sprout Seed, Fresh Leaf, Green Herb |
| Myrkdal (dark dale) | East | Mushling (12, slowing spores) | Spore Cap, Green Herb |
| Glodberg (ember-hill) | South | Pebble Beetle (16), **Ember Jarl (MVP)** | Stone Chip, Strong Draught |
| Fenstrand (fen-shore) | West | Blue Slime (5, splits), Mudcrab (7) | Slime Gel, Dew Drop, Mana Tonic · Shell Bit, Crab Leg |
| Any field, at night | | Firefly Wisp (8) | Glow Dust, Wander Feather |

No health bars: monsters flash white when hit and wobble when nearly beaten. They respawn 60 s
after they fall, twice as fast at night.

**MVP.** The Ember Jarl waits in the south of Glodberg. It stomps the ground around it every few
seconds. Whoever brings it down gets **MVP** over their head, bonus Base EXP and MVP items
straight to the bag, plus its drops (it may drop its crown or its sword). It comes back 15
minutes later, even if you leave the map or close the game.

## Character

Ragnarok's classic rules with Aria's own stat names (see `docs/ragnarok-mechanics.md`):
POW (STR), QKN (AGI), END (VIT), KNL (INT), FNS (DEX), FTN (LUK). Base Level and Job Level
gain EXP separately; stat points come from Base Levels, skill points from Job Levels. HP does
not recover while you walk; resting doubles it.

## Skills

Aria's own skills: plain sword craft, kept modest. A Novice is a swordsman's apprentice and puts
points into **Sword Basics**; the other Novice skills come free with Job Levels. At Novice Job 10
with Sword Basics 9, talk to **Elder Halvard** at camp to become a Swordsman.

| Novice | | |
|---|---|---|
| Sword Basics | passive, 9 | +1 ATK per level; Lv 3 Rest; Lv 9 opens the Swordsman job |
| Rest | from Sword Basics 3 | HP and SP recover twice as fast |
| Mend | Job 1, 4 SP | heals 5 HP + 3% Max HP |
| Dodge Roll | Job 1 | dive away, briefly untouchable |
| Thrust | Job 3, 3 SP | a quick stab for 125% damage |
| Guard | Job 5, 4 SP | 4 s: 15% less damage, no flinching |
| Footwork | Job 7, passive | +3 FLEE |

| Swordsman | | |
|---|---|---|
| Blade Discipline | passive, 10 | +2 ATK per level |
| Iron Hide | passive, 10 | +1 DEF, +1% Max HP per level |
| Cleave | 10 | 110–200% to the target, half to monsters beside it |
| Heavy Strike | 10, needs Cleave 3 | 145–280%, +3% hit per level |
| War Cry | 10 | monsters within 6 paces turn on you; ATK +1% per level for 20 s |
| Stand Firm | 10, needs War Cry 3 | no flinching, 1% less damage per level |
| Ground Slash | 10, needs Heavy Strike 5 | 110–200% to everything close, pushing it back a little |
| Battle Rhythm | Job 10, passive | every 5th hit restores 1 SP |
| Last Stand | Job 10, passive | below 25% HP: +15% ATK |

## Items

The Items window has three tabs: **Usables**, **Equips** and **Miscs**. Weapons, armor, boots,
torch, headgear and charms are items: equip them from the Equips tab, and tap a worn piece in
the Equipment window to take it off.

| Usable | Effect | Where |
|---|---|---|
| Healing / Strong / Greater Draught | 45–65 / 105–145 / 175–235 HP | campfire; drops |
| Mana Tonic | 40–60 SP | campfire; Blue Slimes |
| Wild Berry · Crab Leg | 16–22 · 70–100 HP | Slimes, Sproutlings · Mudcrabs |
| Green Herb | cures spore sickness, a little HP | Sproutlings, Mushlings |
| Quickening Draught | +10% attack speed for 3 minutes | campfire |
| Wander Feather | random spot on this map | campfire; Wisps |
| Homeward Feather | back to camp | campfire |

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

Two accessory slots, a shield and a garment slot join head, face, armor, weapon, shoes and light.

**Headgear you can see.** Hats are drawn on your character, pinned to the head in every frame,
for any job's sprite, and hide the hair they cover: Horned Helm, Woven Cap, Flower Wreath, Jarl's
Ember Crown, and the animated **Flame Circlet** (crafted from the MVP's Ember Heart). Face pieces
are made but left out for now.

**Looks by job.** Novices wear plain linen with a wooden practice sword; the Swordsman look comes
with the job change.

The campfire crafts weapons, armor, boots, the torch, the four charms and all of the above from
materials in your bag and the camp chest. Gear and charms need a Base Level.

## Villagers and quests

Three villagers live at camp. Tap one to talk. A **!** bubble means they have a quest for you,
a **?** means you can hand one in. Active quests show under the clock.

| Villager | Quests (Base Level) |
|---|---|
| Elder Halvard | The Green Blight (1), Claws of the Fen (5), The Rot of Myrkvid (10), Wrath of the Stone-Backs (14); job change |
| Astrid the Cook | Jelly for the Mead-Hall (1), Water from Urd's Well (4), Sól's Lantern Soup (6), The Jarl's Stew (8) |
| Sigrun the Scout | The Four Realms (1), Seeds of Yggdrasil (2), Twin-Born of the Fen (4), Lights of the Álfar (7) |

## Day and night

A full day lasts 10 minutes. Night brings Firefly Wisps and extra monsters. Rest in the tent
to restore HP, save, and sleep until morning.

## Roadmap

- [x] **M1–M6** Map, combat, drops and crafting, monsters, day/night, sound and title screen
- [x] **M7** PixelLab sprites for the whole cast
- [x] **M8** Leveling and equipment
- [x] **M9** Camp villagers and quest chains
- [x] Ragnarok-style controls, rules, windows, maps and portals; Aria's own skills; MVP boss
- [ ] Zeny, shop, more equipment slots, cards

## Dev

```bash
npm install
npm run dev      # local server, open on your phone via LAN
npm run build    # single-file build in dist/index.html
```

Code map: `world.js` (maps, portals, props), `player.js`, `mobs.js` (all monster AI and the MVP),
`rules.js` (battle rules), `skills.js`, `items.js` + `inventory.js` + `menus.js` (items, crafting,
gear, windows), `progress.js` (levels and stats), `quests.js` + `villagers.js` (camp NPCs and
quests), `hotbar.js`, `daynight.js`, `audio.js`,
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
