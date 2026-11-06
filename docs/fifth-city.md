# The fifth city: Hafnvik (the owner's calls, November 2026)

The fifth and last early-game city closes the first half of Aria's making. **Built so far (the world):** Hafnvik
(`port`, `city.js` LAYOUTS.port, after the owner's picture: white like Santorini), reached overland east of
Scorpion Sands through the Tide Cliffs (the owner's call); Beacon Moor north, the Coral Shallows south; the Storm
Isles and Loki's Gate by Captain Asgeir's ship (`ship` in NPCS, `voyage` maps); 13 monsters (`coast.js`), every one a
kind new to Aria (the owner's call), the
Hafnvik's Coast album set; the Keeper, Sela's shop, Brand the Smith, Ylfa the Priestess (healer), and Loki at the
Deep Halls' door. **Next:** the region's MVP, **Poseidon, Lord of the Tides** (the owner's sheet; Merrows and Glass
Jellies his summons), then the story chapter before the ending, the city's quests and series, a mini-boss or two. What the owner has decided:

## The city

A **port city** with a harbour of big ships and a **Ship Captain** whose ship sails to destinations (an NPC like the
carters, with destinations instead of lands). It should feel apart from Salt Bay (Salt Bay is a shore with the
Boatman and Bloop Island; the port is a real harbour: ships, a lighthouse, a fish market).

## Its four fields

- They fill the gap in open fields: today no field goes past Base 64 (the desert), and Base 65–99 is only in the two
  dungeons. Suggested bands: about 65–70, 70–76, 76–82 and 82–88.
- **Mostly Neutral monsters, with some elemental ones for variety** (the owner's call). Every element hits Neutral at
  100%, so no one weapon element rules the late game: if every monster were Water (an ice region), everyone would
  wear Wind and every other late weapon would be wasted.
- Keep in mind: the Wizard keeps up with the BladeMaster through elements (`docs/job-rules.md`); the few elemental
  monsters are where a Wizard's or an elemental weapon's edge still shows.
- Each field still gets a look and a hazard of its own (tidal cliffs, coral shallows to wade in, storm isles, a
  lighthouse moor were the first ideas), and its own Monster Album set (a new region gets a set).

## The endless dungeon

- **The Deep Halls** (`src/delve.js`) are built and tested but have no entrance yet: an endless maze dungeon, each
  floor carved from its own seed in the stone of the other dungeons, three kinds of monsters from Aria's fields and
  dungeons near the floor's level (85 on floor 1, 99 from floor 8, then stronger floor by floor), a checkpoint and a
  cache every fifth floor, the deepest floor kept in the save.
- It is an **unlockable destination of the Ship Captain from Base 90**.
- Its gatekeeper is **Loki the Mischiefbringer**, at its door. To open it: give him an NPCS entry where the ship lands,
  with `delve: true`; his talk window then offers the floors (`menus.js`, `main.js delveGo`), and the stairs up bring
  the hero home beside him. Point the Deep Halls' up-portals (`world.js` delveA/delveB) at that map.

## The story

The fifth city's chapter goes just before the ending (`goldring` stays last); the ending cutscene gets a shot of it.

## Set aside

The Sunken Ship dungeon (the owner's call: not for now).
