# Aibachu

A small 2.5D open-world fantasy RPG for phones, in the spirit of old-school Ragnarok Online:
painted 2D sprites standing in a 3D world. You camp in the valley of Aibachu, explore freely,
fight small monsters, collect what they drop and craft better gear at the campfire.

Built with Three.js + Vite, wrapped as an Android app with Capacitor. All art is painted in
code and all sound is synthesized, so the game ships as one offline HTML file.

## Get the APK

Every push to `main` builds a new APK automatically (about 3–5 minutes).
Download it from **Releases → "Aibachu — latest build"** → `Aibachu.apk`.
New builds install over old ones (same signing key), so your save is kept.

## Controls

| Touch | Desktop |
|---|---|
| Left side: floating joystick | WASD / arrows |
| Hold ⚔: attack (auto-aims the nearest monster) | Space / J |
| ↻: dodge roll (brief invincibility) | Shift / K |
| Context button at camp: Craft / Chest / Rest | F |
| Bag button (top left) | I / B |
| Right side drag: rotate camera · pinch: zoom | Q / E · mouse wheel |

Add `?debug` to the URL for an FPS / position readout.

## The valley

One 64×64 open map. Camp in the center is a safe zone where hearts slowly refill.

| Zone | Direction | Monsters (hidden HP) | Drops |
|---|---|---|---|
| Mossy Grove | North-west | Green Slime (3), Sproutling (3) | Slime Gel · Sprout Seed, Fresh Leaf |
| Fen Shore | South-west | Blue Slime (4, splits), Mudcrab (5) | Slime Gel, Dew Drop · Shell Bit |
| Old Hollow | North-east | Mushling (4, slowing spores) | Spore Cap |
| Ember Ridge | South-east | Pebble Beetle (6, hits hard) | Stone Chip |
| Anywhere, at night | | Firefly Wisp (2) | Glow Dust |

No health bars: monsters flash white when hit, wobble and slow down when nearly beaten,
and vanish in a puff. Any monster can drop a heart (15%). Monsters respawn 60 s after you
leave the area, twice as fast at night.

## Crafting (campfire)

| Recipe | Cost | Effect |
|---|---|---|
| Stone Blade | 4 Stone Chip, 3 Shell Bit | 1.5 damage, 1.8 swings/s |
| Ember Edge | 6 Stone Chip, 4 Glow Dust, 3 Spore Cap | 2 damage, 2.2 swings/s |
| Leaf Tunic | 6 Fresh Leaf, 4 Sprout Seed | +1 heart |
| Shell Mail | 6 Shell Bit, 4 Slime Gel | +2 hearts |
| Beetle Plate | 8 Stone Chip, 4 Dew Drop, 2 Spore Cap | +3 hearts |
| Healing Draught | 2 Slime Gel, 1 Dew Drop, 1 Fresh Leaf | restores 3 hearts |
| Torch | 3 Glow Dust, 2 Fresh Leaf | lights the night |
| Swift Boots | 4 Shell Bit, 3 Dew Drop, 3 Fresh Leaf | +20% move speed |

Crafting uses items from both your bag (16 slots) and the camp chest (32 slots).

## Day and night

A full day lasts 10 minutes. Night brings Firefly Wisps and extra monsters. Rest in the tent
to restore hearts, save, and sleep until morning.

## Roadmap

- [x] **M1** Map, movement, camera, camp
- [x] **M2** Combat (attack speed, hidden HP, dodge) + Slimes and Sproutlings
- [x] **M3** Drops, inventory, campfire crafting, chest
- [x] **M4** Monsters in every zone
- [x] **M5** Day/night, night spawns, sleeping, save
- [x] **M6** Sound and music, title screen, polish
- [ ] PixelLab sprites for the player and monsters (`build-tools/pixellab.py`, workflow "PixelLab sprites")

## Dev

```bash
npm install
npm run dev      # local server, open on your phone via LAN
npm run build    # single-file build in dist/index.html
```

Code map: `world.js` (terrain, zones, props), `player.js`, `mobs.js` (all monster AI),
`items.js` + `inventory.js` + `menus.js` (loot and crafting), `daynight.js`, `audio.js`,
`sprites.js` (all placeholder art — swap any sprite without touching game logic).
