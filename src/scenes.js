// The opening cutscene's shots (main.js plays them, cutscene.js draws the bars and the words).
// the opening, before a new hero is made: the old tale, told by the world itself
export const INTRO_SHOTS = [
  { map: 'camp', time: 0.8, focus: 'fire', dist: 19, yaw: 0.4, spin: 0.05, secs: 6, text: 'Long ago, the fire-jotnar slept beneath the hills of Aria.' },
  { map: 'camp', time: 0.82, focus: 'fire', dist: 8.5, pitch: 0.55, yaw: 2.2, spin: 0.09, secs: 6, text: 'The first settlers lit a ring of fires to keep them dreaming, and named their camp Eldrun: the fire-ring.' },
  { map: 'ridge', time: 0.63, focus: 'jarl', dist: 12, pitch: 0.6, yaw: 0.8, spin: 0.06, secs: 6.5, shake: 0.6, sound: 'night', text: 'Now the fires burn low. And beneath Ember Hill, the Fire Giant stirs in his sleep...' },
  { map: 'grove', time: 0.83, focus: 'field', dist: 13, yaw: 3.6, spin: 0.07, secs: 5.5, text: 'Monsters wander the fields, and strange lights drift through the night.' },
  { map: 'camp', time: 0.92, focus: 'hero', dist: 7.5, pitch: 0.62, yaw: 5.2, spin: 0.05, secs: 6, text: 'And over the mountains came a stranger, with a practice sword and a head full of songs...' },
  { map: 'camp', time: 0.92, focus: 'fire', dist: 11, yaw: 5.6, spin: 0.03, secs: 5, card: { title: 'Aria', sub: 'The Last Fire-Ring' } },
];

// ---------- the story's cutscenes (main.js playScene): shots like the opening's, on any map; the hero is put
// back where they stood afterwards, the clock as it was. focus: 'fire' (Eldrun's), 'field' (something moving),
// 'hero', 'jarl' (the Fire Giant, or where he sleeps), 'npc:<id>' (someone standing at their spot) or { x, z }.
// Each plays once, as the story reaches it; the Quests window's Main tab can show a chapter's again.

// a chapter's opening, played as its first step begins (keyed by the chapter's number: story.js `ch`)
export const CHAPTER_SHOTS = {
  'Chapter 1': [
    { map: 'camp', time: 0.08, focus: 'fire', dist: 12, yaw: 0.6, spin: 0.05, secs: 5.5, text: 'The Heart-Ember is home, and the fire-ring burns again. But the ground still trembles, and the Elder\'s eyes keep turning south.' },
    { map: 'city', time: 0.12, focus: 'npc:ulfr', pitch: 0.92, dist: 15, yaw: 3.0, spin: 0.04, secs: 6, text: 'North, past Moss Field, the walls of Steinborg stand as they have for three hundred years. The Stone-Fort has never needed the old songs.' },
    { map: 'city', time: 0.14, focus: 'npc:saeunn', pitch: 0.92, dist: 10, yaw: 1.2, spin: 0.06, secs: 5.5, text: 'And in her tower, a Seeress casts her runes, and does not like what they say.', card: { title: 'Chapter 1', sub: 'The Stone-Fort' } },
  ],
  'Chapter 2': [
    { map: 'camp', time: 0.66, focus: 'fire', dist: 9, pitch: 0.55, yaw: 2.4, spin: 0.06, secs: 5.5, text: 'By Eldrun\'s fire, the Elder waits. A Trainee can only carry a practice sword so far.' },
    { map: 'city', time: 0.2, focus: 'npc:ulfr', pitch: 0.92, dist: 9, yaw: 0.4, spin: 0.07, secs: 4.5, text: 'The Blade, in Steinborg...' },
    { map: 'magic', time: 0.22, focus: 'npc:vigdis', pitch: 0.92, dist: 9, yaw: 5.6, spin: 0.07, secs: 4.5, text: 'the Rune, in Galdrheim...' },
    { map: 'hunt', time: 0.24, focus: 'npc:sigrid', pitch: 0.92, dist: 9, yaw: 2.0, spin: 0.07, secs: 4.5, text: 'the Bow, in Veidheim...' },
    { map: 'sand', time: 0.26, focus: 'npc:kol', pitch: 0.92, dist: 9, yaw: 3.4, spin: 0.07, secs: 5, text: 'and the Dagger, in Rytingborg, where the desert begins.', card: { title: 'Chapter 2', sub: 'The Four Paths' } },
  ],
  'Chapter 3': [
    { map: 'birch', time: 0.55, focus: 'field', dist: 12, yaw: 1.4, spin: 0.06, secs: 5.5, text: 'In Birch Grove the Sprouts have turned red, and their roots run warm, as if something under the ground were breathing.' },
    { map: 'ridge', time: 0.6, focus: 'jarl', dist: 17, pitch: 0.5, yaw: 0.6, spin: 0.04, secs: 6, shake: 0.4, sound: 'night', text: 'South, Ember Hill smoulders. The beetles there glow like coals.', card: { title: 'Chapter 3', sub: 'Embers in the Wilds' } },
  ],
  'Chapter 4': [
    { map: 'magic', time: 0.7, focus: 'npc:vigdis', pitch: 0.92, dist: 13, yaw: 0.3, spin: 0.05, secs: 6, text: 'Galdrheim, the rune-city. Every rune cut here drinks from its well, and its Archmage knows the oldest song of all.' },
    { map: 'ridge', time: 0.82, focus: 'jarl', dist: 18, pitch: 0.48, yaw: 2.6, spin: 0.04, secs: 6, shake: 0.5, sound: 'night', text: 'The song that put the Giant to sleep. It must be sung again, on the hill itself.', card: { title: 'Chapter 4', sub: 'The Fire-Ring' } },
  ],
  'Chapter 5': [
    { map: 'coast', time: 0.1, focus: 'npc:hakon', dist: 14, pitch: 0.5, yaw: 1.0, spin: 0.05, secs: 6, text: 'Salt Bay. The salt carts have stopped rolling west, and the carters will not say why.' },
    { map: 'stones', time: 0.16, focus: 'field', dist: 13, yaw: 4.0, spin: 0.06, secs: 6, text: 'Beyond the bay, in the Stone Field, the kobolds have come up out of the hills: more of them than anyone has ever counted.', card: { title: 'Chapter 5', sub: 'The Salt Road' } },
  ],
  'Chapter 6': [
    { map: 'coalpit', time: 0.74, focus: { x: 32, z: 40 }, dist: 15, pitch: 0.55, yaw: 0.2, spin: 0.05, secs: 6, sound: 'night', text: 'In Coal Pit the kobolds dig day and night, for coal that glows without fire. Someone is paying them for it.' },
    { map: 'burnt', time: 0.76, focus: 'field', dist: 13, yaw: 2.4, spin: 0.06, secs: 6, text: 'And north of Galdrheim, in the Burnt Wood, the goblins have gathered a war-band to carry it away.', card: { title: 'Chapter 6', sub: 'The Goblin War-Band' } },
  ],
  'Chapter 7': [
    { map: 'camp', time: 0.04, focus: 'fire', dist: 10, pitch: 0.6, yaw: 4.4, spin: 0.05, secs: 5.5, text: 'Every path forks, sooner or later.' },
    { map: 'city', time: 0.3, focus: 'npc:ulfr', pitch: 0.92, dist: 11, yaw: 1.8, spin: 0.06, secs: 5.5, text: 'The trainers of Aria have waited a long time for someone worth teaching the second step.', card: { title: 'Chapter 7', sub: 'The Second Path' } },
  ],
  'Chapter 8': [
    { map: 'heath', time: 0.62, focus: 'field', dist: 13, yaw: 0.9, spin: 0.06, secs: 5.5, text: 'Ash Heath. The Fire Beetles feast on stolen coal, and grow fat and bright.' },
    { map: 'serpent', time: 0.78, focus: { x: 32, z: 16 }, dist: 16, pitch: 0.5, yaw: 3.2, spin: 0.04, secs: 6, shake: 0.3, sound: 'night', text: 'And deep in the Serpent Wood the goblins have lit a fire of their own: a ring, cut backwards.', card: { title: 'Chapter 8', sub: 'The Waking Fire' } },
  ],
  'Chapter 9': [
    { map: 'magic', time: 0.72, focus: 'npc:vigdis', pitch: 0.92, dist: 9, yaw: 1.6, spin: 0.06, secs: 5.5, text: 'Under the backward runes, the stone has kept a second mark: a sun over sand.' },
    { map: 'scorpion', time: 0.58, focus: { x: 42, z: 26 }, dist: 19, pitch: 0.42, yaw: 0.4, spin: 0.04, secs: 6, text: 'South of Rytingborg, caravans vanish on the Pyramid road, and a robed figure walks the dunes, drawing in the sand with a staff.' },
    { map: 'desert', time: 0.6, focus: { x: 30, z: 26 }, dist: 16, pitch: 0.5, yaw: 2.8, spin: 0.05, secs: 5.5, text: 'Something under the Great Desert is listening.', card: { title: 'Chapter 9', sub: 'The Eye in the Sand' } },
  ],
  'Chapter 10': [
    { map: 'magic', time: 0.84, focus: 'npc:hrafn', pitch: 0.92, dist: 10, yaw: 0.8, spin: 0.05, secs: 5.5, text: 'Over Galdrheim, the Wolf\'s Eye burns brighter than it has in a hundred years. Its light falls north.' },
    { map: 'oldwood', time: 0.8, focus: { x: 34, z: 26 }, dist: 14, pitch: 0.55, yaw: 3.6, spin: 0.05, secs: 6, sound: 'night', text: 'In the Old Forest past Veidheim, the roots are rotting, and the rot runs up the trunks in lines, like writing.', card: { title: 'Chapter 10', sub: 'The Gnawed Roots' } },
  ],
  'Chapter 11': [
    { map: 'magic', time: 0.86, focus: 'npc:brynja', pitch: 0.92, dist: 11, yaw: 2.2, spin: 0.05, secs: 5.5, text: 'In the night, Galdrheim\'s runes go dim, one by one, and the Lorekeeper\'s books go blank at the edges.' },
    { map: 'magic', time: 0.87, focus: 'npc:torvald', pitch: 0.92, dist: 8, yaw: 5.0, spin: 0.07, secs: 6, text: 'Only a runecarver could reach the rune-well. Only one has carved the city\'s runes for thirty years.', card: { title: 'Chapter 11', sub: 'The Hand That Cuts Backwards' } },
  ],
  'Chapter 12': [
    { map: 'camp', time: 0.9, focus: 'fire', dist: 9, pitch: 0.6, yaw: 1.0, spin: 0.06, secs: 5.5, text: 'In Eldrun, the first flame burns white and gold, and two voices begin the oldest song.' },
    { map: 'ridge', time: 0.9, focus: 'jarl', dist: 18, pitch: 0.45, yaw: 4.2, spin: 0.05, secs: 6.5, shake: 0.7, sound: 'night', text: 'On Ember Hill, four backward fires blaze round the place where the Giant sleeps lightest.', card: { title: 'Chapter 12', sub: 'The Last Fire-Ring' } },
  ],
};

// the story's big moments, played after a step's lines (keyed by the step's id)
export const STEP_SHOTS = {
  // the first sight of Ember Hill: the Giant turns in his sleep
  emberhill: [
    { map: 'ridge', time: 0.64, focus: 'jarl', dist: 13, pitch: 0.5, yaw: 1.1, spin: 0.08, secs: 6, shake: 0.9, sound: 'night', text: 'The hill heaves. Far below, something vast turns over in its sleep, and every ember on Ember Hill flares at once.' },
    { map: 'camp', time: 0.66, focus: 'fire', dist: 8, pitch: 0.55, yaw: 3.3, spin: 0.06, secs: 5.5, shake: 0.3, text: 'In Eldrun, the fire-ring gutters, and the Elder begins to remember the words of a very old song.' },
  ],
  // the first saga ends
  rekindled: [
    { map: 'camp', time: 0.9, focus: 'fire', dist: 11, pitch: 0.5, yaw: 0.2, spin: 0.05, secs: 6, sound: 'heart', text: 'Eldrun\'s fire-ring burns high and steady, and the Giant sleeps once more.' },
    { map: 'ridge', time: 0.02, focus: 'jarl', dist: 18, pitch: 0.5, yaw: 3.0, spin: 0.03, secs: 6, text: 'But under Ember Hill the coals are still warm. Somewhere, a hand that knows the old runes is waiting.', card: { title: 'The First Saga', sub: 'The Fire-Ring' } },
  ],
  // the second saga ends: the backward ring broken
  twofires: [
    { map: 'serpent', time: 0.04, focus: { x: 32, z: 16 }, dist: 14, pitch: 0.5, yaw: 1.8, spin: 0.04, secs: 6, text: 'In the Serpent Wood, the backward fire is cold ash. The goblins have scattered into the trees.' },
    { map: 'magic', time: 0.84, focus: 'npc:torvald', pitch: 0.92, dist: 9, yaw: 2.6, spin: 0.05, secs: 6, text: 'And in Galdrheim, a runecarver works late into the night, as he always has.', card: { title: 'The Second Saga', sub: 'The Waking Fire' } },
  ],
  // the twist: Torvald unmasked, and gone
  unmasked: [
    { map: 'magic', time: 0.9, focus: 'npc:torvald', pitch: 0.92, dist: 7, yaw: 0.6, spin: 0.1, secs: 5.5, shake: 0.6, sound: 'night', text: 'Where the runecarver stood, there is only a scorched circle in the stones, and the smell of burnt runes.' },
    { map: 'deep', time: 0.9, focus: { x: 26, z: 46 }, dist: 11, pitch: 0.55, yaw: 3.9, spin: 0.06, secs: 5.5, text: 'In Black Wood, the recarved Watcher glows backwards in the dark. He was the one who taught the city to read them.' },
    { map: 'ridge', time: 0.92, focus: 'jarl', dist: 19, pitch: 0.45, yaw: 5.4, spin: 0.04, secs: 6.5, shake: 0.8, text: 'Far to the south, on Ember Hill, four fires flare up in the dark, one after another. His last ring is lit.' },
  ],
  // the climax won: the Giant sinks back into the hill
  lastring: [
    { map: 'ridge', time: 0.97, focus: 'jarl', dist: 16, pitch: 0.5, yaw: 0.4, spin: 0.06, secs: 6, shake: 0.9, sound: 'heart', text: 'The song swells into one great note, and the Giant bends to it, and sinks, and sinks, until the hill closes over him like water.' },
    { map: 'ridge', time: 0.02, focus: { x: 32, z: 24 }, dist: 10, pitch: 0.6, yaw: 2.2, spin: 0.05, secs: 5.5, text: 'Dawn comes up over Ember Hill. For the first time in a hundred years, the ground is cool.' },
  ],
  // the story's ending: the first cities safe, the Giant asleep
  goldring: [
    { map: 'camp', time: 0.04, focus: 'fire', dist: 12, pitch: 0.5, yaw: 0.6, spin: 0.05, secs: 6, sound: 'heart', text: 'The fire-ring of Eldrun burns gold, as it did when the first settlers lit it.' },
    { map: 'city', time: 0.1, focus: 'npc:saeunn', pitch: 0.92, dist: 14, yaw: 2.4, spin: 0.04, secs: 5, text: 'In Steinborg, the Seeress\'s runes fall quiet and kind.' },
    { map: 'magic', time: 0.12, focus: 'npc:vigdis', pitch: 0.92, dist: 14, yaw: 4.6, spin: 0.04, secs: 5, text: 'In Galdrheim, the rune-well runs clear, and Brynja writes a new page in the oldest book.' },
    { map: 'hunt', time: 0.14, focus: 'npc:ingrid', pitch: 0.92, dist: 14, yaw: 1.4, spin: 0.04, secs: 5, text: 'In Veidheim, green shoots break through the rotted roots of the Old Forest.' },
    { map: 'sand', time: 0.16, focus: 'npc:thora', pitch: 0.92, dist: 14, yaw: 3.2, spin: 0.04, secs: 5, text: 'And in Rytingborg, the caravans ride the Pyramid road again.' },
    { map: 'ridge', time: 0.2, focus: 'jarl', dist: 20, pitch: 0.42, yaw: 0.2, spin: 0.03, secs: 6.5, text: 'The Giant sleeps deep. The other jotnar sleep in their stone. Aria\'s first cities are safe, thanks to a stranger from over the mountains.' },
    { map: 'camp', time: 0.66, focus: 'hero', dist: 9, pitch: 0.6, yaw: 5.0, spin: 0.04, secs: 6, text: 'And past the mountains lie lands no song of Eldrun has ever reached...' },
    { map: 'camp', time: 0.68, focus: 'fire', dist: 12, yaw: 5.4, spin: 0.03, secs: 6, card: { title: 'Aria', sub: 'The Last Fire-Ring' } },
  ],
};

// the secret series' last steps: the hidden ways open (keyed by the quest's id)
export const SECRET_SHOTS = {
  sphinx6: [
    { map: 'desert', time: 0.58, focus: { x: 32, z: 50 }, dist: 12, pitch: 0.5, yaw: 0.3, spin: 0.07, secs: 5.5, shake: 0.6, sound: 'night', text: 'The Sphinx Eye clicks into the obelisk, and the whole Great Desert sighs. To the south, the sand pours away like water.' },
    { map: 'sphinx', time: 0.6, focus: { x: 32, z: 40 }, dist: 22, pitch: 0.36, yaw: 0.05, spin: 0.02, secs: 7, shake: 0.4, text: 'Beyond it rises a stone face as big as a hill, with a door in its chest that no hand has pushed in a thousand years.', card: { title: 'Sphinx Sands', sub: 'The Giant Sphinx' } },
  ],
  tree6: [
    { map: 'oldwood', time: 0.3, focus: { x: 32, z: 10 }, dist: 12, pitch: 0.62, yaw: 0.1, spin: 0.05, secs: 5.5, shake: 0.6, sound: 'night', text: 'The seed sinks into the dark earth. Roots heave up through the moss, and to the north the old trees part.' },
    { map: 'ygg', time: 0.32, focus: { x: 32, z: 36 }, dist: 20, pitch: 0.3, yaw: 0.05, spin: 0.02, secs: 7, shake: 0.4, text: 'Beyond them stands a trunk so great it fills the sky: the World Tree, Yggdrasil, its roots drinking from three wells.', card: { title: 'Yggdrasil', sub: 'The World Tree' } },
  ],
};
