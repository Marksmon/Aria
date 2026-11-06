# Story outline: Chapters 9–12, the third saga (in the game, November 2026; Chapters 13–20 followed, see src/story.js)

The owner's answers: the rune-cutter is **Torvald**; the World Tree stays **secret** (Chapter 10 searches rotted
runestones instead); the climax is **120 s with the Giant's Meteor Rain**; the keepsake is **Torvald's Chisel**.
All of it is in `src/story.js` (steps `sunmark` to `goldring`), with a new step kind, `search` (spots on any map,
found by walking over them: `main.js tickStorySearch`), and `meteors` on a survive step (`tickVigil`). Torvald is
gone from Galdrheim after `unmasked` (`main.js AWAY`). Where the game differs from the draft below: Chapter 11
opens with Brynja (a talk, not a visit: the hero is already in Galdrheim), the rune-spring stand is in Fen Shore
(towns are safe ground, where monsters don't fight), Chapter 12's heralds are Ember Hill's own Beetles and Wisps,
and the chisel is found in the ash (a search) before the last talk. Meteor Rain costs 12% of Max HP a circle.

The draft, as approved: talk, visit, kill (a monster's kin, never a boss: the owner's rule),
search, defend, survive, deliver. Levels follow the map: the second saga ends at about Base 55, the World
Tree's Hollows are Base 45–75 and the Sphinx's Halls 65–99.

## Cutscenes and the ending (November 2026)

The owner asked for cutscenes and for the story to be finished in the first five cities (a new main story comes
with the late-game cities). Every chapter now opens with a cutscene (`scenes.js` `CHAPTER_SHOTS`), and the big
beats have their own (`STEP_SHOTS`: `emberhill`, `rekindled`, `twofires`, `unmasked`, `lastring`, `goldring`; and
`SECRET_SHOTS` for The Sphinx's Riddle 6 and The World Tree 6). The twist stays Torvald's unmasking, now shown:
his empty workshop, the recarved Watcher, and his four fires flaring on Ember Hill. Halvard's last lines no longer
leave the "someone taught Torvald" thread open: the jotnar sleep long with every ring whole, and the ending
cutscene walks through Eldrun, Steinborg, Galdrheim, Veidheim and Rytingborg at peace, ending on the title card
(the game never says "Part One"). When the fifth early city comes, its chapter goes before `goldring` and a
shot of it joins the ending.

## Where the story stands

Chapter 8 ends with the goblins' backward fire-ring broken and one rune-stone of it in Vigdis's hands: "cut
backwards, and by a hand that knew Hallveig's runes as well as I do". Elder Halvard: "a hand that cuts runes
backwards is still out there." Threads already in the game to pick up:

- **Nine jotnar**, eight sung into the stone long ago (Brynja). Only the Fire Giant's sleep was tied to a
  fire-ring; the other eight's places are never named.
- **The Watchers** of Black Wood glow when the jotnar stir (Torvald); **the Wolf's Eye** burns brightest when
  they dream, never as bright as this year (Hrafn).
- **The Sphinx**: "a face but no eyes that open … a door that no hand may push"; the desert sighed when it woke.
- **The World Tree**: "roots that drink from three wells"; "something gnaws at its roots" (Nidhogg).
- **Only beating the Giant in the waking world ends the danger for good** (Brynja). The Fire Giant MVP stays
  the optional fight; the story's ending puts him back to sleep instead.

## The rune-cutter (the owner's pick)

Someone who learnt Hallveig's runes in Galdrheim. Three choices, each fitting what is already said:

| Choice | Why it fits | Cost |
|---|---|---|
| **A. Torvald the Runecarver** (recommended) | He carves runes "so the promises last", reads the Watchers, and sent the hero after the goblins' "backward runes" (The Runecarver 2): he was steering the hunt away from himself. His Watcher rubbings were never for the Watchers. | A familiar face turns; his quests read differently afterwards (no change needed to them). |
| B. Mother Hulda | Vigdis "keeps her in a corner"; she deals in curses and slow things. | She is the Voodoo's trainer: a hero who took the Voodoo would lose their trainer's warmth. |
| C. A new figure: Hallveig's last apprentice, thought dead | Clean: no one's trainer turns. | A new person, met only late. |

The outline below is written for A; B or C change only who is unmasked in Chapter 11.

## Chapter 9: The Eye in the Sand (about Base 55–60)

The backward rune-stone holds a second ring's mark: a sun over sand. Vigdis sends the hero to Rytingborg.

1. **talk** Vigdis: the stone's other mark points south.
2. **visit** Rytingborg; **talk** Thora the Caravan Master: caravans are missing near the Pyramid, and the
   drivers saw a robed figure "drawing in the sand with a staff".
3. **kill** 20 Sand Scorpions round the Pyramid (Scorpion Sands), the caravans' road.
4. **search** three backward runes cut into the dunes (Cactus Dunes, Scorpion Sands, Great Desert), glinting
   like Watcher stones. Each rubbing shows the same hand.
5. **talk** Old Gunnhild: the runes ring the old stone face under the sand: someone is trying to wake
   *what sleeps in the desert*. (If the hero has done The Sphinx's Riddle, she says so: "you have seen it
   yourself".)
6. **talk** Vigdis: eight jotnar were sung into the stone; the stone face in the desert is one of their
   prisons, and the Sphinx is its keeper. The rune-cutter is not waking the Fire Giant alone: they are
   loosening every prison.

## Chapter 10: The Gnawed Roots (about Base 60–66)

1. **talk** Hrafn: the Wolf's Eye flared the night the runes were cut; its light falls on the north.
2. **visit** Veidheim; **talk** Old Ingrid: the Old Forest's roots are rotting, and the rot runs backwards up
   the trunks, "like writing".
3. **defend** the great stump in the Old Forest against three waves of Treants maddened by the rot.
4. **kill** 15 Rot Beetles … *only if the hero can reach Yggdrasil's Hollows* (Floor 3). Otherwise the step is
   **search**: three rotted runestones in the Old Forest. (The owner's choice: make the World Tree's series a
   step of the story, or keep it secret and give the story this other way.)
5. **talk** Bjarki: his wolf Grimr will not go near the north; something below the tree is *awake*, and fed.
   (Nidhogg, never named; the MVP stays optional.)
6. **talk** Vigdis: the tree's roots drink from three wells; one of them is Galdrheim's rune-well. The
   rune-cutter is poisoning the song at its spring.

## Chapter 11: The Hand That Cuts Backwards (about Base 66–72)

1. **visit** Galdrheim at night: the rune-well's crystal has sunk.
2. **survive** 60 s by the rune-well while Vigdis holds the crystal up (Dark Wisps and Fire Wisps pour out).
3. **search** Black Wood: the three Watchers. One has been recarved backwards, and Torvald's chisel lies at
   its foot.
4. **talk** Torvald, unmasked. He wants the jotnar free: "They did not hate us. They simply burnt. We caged
   them for being what they are." (Brynja's line, turned.) He flees to Ember Hill, where his last ring waits.
5. **talk** Saeunn: she saw it in the runes and did not want to believe it; she will sing with Vigdis.
6. **deliver** Saeunn's rune-lantern to Elder Halvard: Eldrun's fire-ring must burn at full as the song is sung.

## Chapter 12: The Last Fire-Ring (about Base 72–75)

1. **visit** Ember Hill: Torvald's backward ring is lit round the Giant's sleeping place; the ground splits.
2. **kill** 25 of the Giant's heralds (Fire Beetles and Fire Wisps) to break the ring's four fires.
3. **survive** *The Last Fire-Ring* (120 s, the climax): the Fire Giant half-wakes and rises from the hill,
   too vast to fight. The hero holds the rune circle while Vigdis, Saeunn and Halvard sing: waves of heralds,
   and the Giant's **Meteor Rain** falling as red circles all round (the MVP's own move, aimed at the hero,
   to be stepped out of). Walk out of the circle and the song breaks. Not a boss fight: the Giant never takes
   damage (the owner's rule: no story step needs a boss).
4. **talk** at the end of the song the Giant sinks back, deeper than before. Torvald, caught in his own
   ring's fire, is gone; his chisel is left in the ash.
5. **talk** Elder Halvard by Eldrun's fire: the ring burns gold. "He sleeps. But the others are still in their
   stone, and someone taught Torvald." (A hook for the late-game cities.)

Rewards by the same pacing as before (story EXP at QUEST_RATE, enough to carry a hero to the next chapter's
level), and at the end a keepsake: **Torvald's Chisel** (an accessory, KNL/FNS, no power creep), plus the
title of the story's end in the Quests window.

## What it needs in the game

- Story steps in `story.js` (all of these kinds exist), new lines for Thora, Gunnhild, Ingrid, Bjarki, Hrafn,
  Saeunn, Vigdis and Torvald, and "search" spots on the desert, forest and Black Wood maps.
- The survive climax reuses the Vigil's code (`kind: 'survive'`) with the Fire Giant shown on Ember Hill (not
  as a monster: a scene piece, like the cutscene's) and his Meteor Rain falling round the circle.
- Torvald leaves Galdrheim after Chapter 11 (his quests are done or hidden once unmasked).
- No change to the Fire Giant MVP, the dungeons, or any boss.
