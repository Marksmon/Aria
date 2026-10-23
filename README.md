# Aibachu

A small 2.5D open-world fantasy RPG for phones, in the spirit of old-school Ragnarok Online:
painted 2D sprites standing in a 3D world. You camp in the valley of Aibachu, explore freely,
fight small monsters and collect what they drop.

Built with Three.js + Vite, wrapped as an Android app with Capacitor.

## Get the APK

Every push to `main` builds a new APK automatically (about 5–10 minutes).
Download it from **Releases → "Aibachu — latest build"** → `Aibachu.apk`.
New builds install over old ones (same signing key), so your save is kept.

## Controls

| Touch | Desktop |
|---|---|
| Left side: floating joystick | WASD / arrows |
| Right side drag: rotate camera | Q / E |
| Pinch: zoom | Mouse wheel |

Add `?debug` to the URL for an FPS / position readout.

## Map

One 64×64 map. Camp in the center, four open zones around it:

| Zone | Direction | Look |
|---|---|---|
| Mossy Grove | North-west | Lush green woods, flowers |
| Old Hollow | North-east | Dark teal forest, big mushrooms |
| Ember Ridge | South-east | Raised ochre ground, rocks, dead trees |
| Fen Shore | South-west | Lake, reeds, willows |

## Roadmap

- [x] **M1** Map, movement, camera, camp
- [ ] **M2** Combat (attack speed, hidden HP) + Slimes and Sproutlings
- [ ] **M3** Drops, inventory, campfire crafting
- [ ] **M4** Remaining mobs across all zones
- [ ] **M5** Day/night, night spawns, save
- [ ] **M6** Sound, title screen, polish

## Dev

```bash
npm install
npm run dev      # local server, open on your phone via LAN
npm run build    # single-file build in dist/index.html
```

Art is painted in code (`src/sprites.js`) as placeholders; every sprite can be swapped for
real art without touching game logic.
