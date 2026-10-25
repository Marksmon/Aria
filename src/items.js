// Items (materials, usables and equipment) and recipes, plus the painted icons used both on the ground and in menus.
import * as THREE from 'three';
import { headgearIcon, headgearReady } from './headgear.js';

// type: use (Usables tab), equip (Equips tab, one per slot, never stacks) or misc (Miscs tab).
// jobs: who may wear a piece (novice = Trainee, swordman = Blader, mage = Sorcerer); none = anyone.
// el: a weapon's element: its normal attacks hit with it, and a staff's adds 15% to spells of it.
// Equipment: slot (weapon, armor, shoes, light, acc), atk + wlv for weapons, def, and fx for a
// special effect. icon names the painted icon when it isn't the item's own id.
const BASE_ITEMS = {
  gel:    { type: 'misc', name: 'Slime Gel',  desc: 'A wobbly blob left behind by a Slime. Sticky enough to glue a boot. Cooks, crafters and potion-makers all want it.', from: 'Slimes' },
  dew:    { type: 'misc', name: 'Water Drop',   desc: 'Cool water that never quite spills, gathered from Blue Slimes. Brewers swear by it for clean potions.', from: 'Blue Slimes' },
  seed:   { type: 'misc', name: 'Seed', desc: 'A Sprout\'s seed. It wiggles when you hold it, as if it still wants to run. Used in charms and teas.', from: 'Sprouts' },
  leaf:   { type: 'misc', name: 'Leaf', desc: 'Soft, green and surprisingly tough. Woven into tunics and caps, or tossed into a potion for colour.', from: 'Sprouts' },
  shell:  { type: 'misc', name: 'Shell',  desc: 'A hard pink piece of Crab shell. Smiths layer it into armor; it turns a blade better than you would think.', from: 'Crabs' },
  spore:  { type: 'misc', name: 'Spore',  desc: 'A Mushroom\'s spore cap. Smells like rain in the woods. Breathe too much and your head swims.', from: 'Mushrooms' },
  stone:  { type: 'misc', name: 'Stone', desc: 'Sharp stone from a Beetle\'s back, the same grey rock as Glodberg. Smiths grind it into blades.', from: 'Beetles' },
  glow:   { type: 'misc', name: 'Glow Dust',  desc: 'Faintly warm dust shaken from night Wisps. It glows in the dark for days. Sorcerers use it in nearly everything.', from: 'Wisps' },
  thorn:  { type: 'misc', name: 'Thorn', desc: 'A springy, thorny twig from a Red Sprout. Brambles from Birkilund bind staves and make a bitter tea.', from: 'Red Sprouts' },
  salt:   { type: 'misc', name: 'Salt', desc: 'White crystals left by Sea Slimes. It tastes of the sea, and it keeps old ink from fading.', from: 'Sea Slimes' },
  pearl:  { type: 'misc', name: 'Pearl', desc: 'A small pearl with a blue sheen, found in one Blue Crab in a dozen. Traders love these.', from: 'Blue Crabs' },
  gloom:  { type: 'misc', name: 'Dark Spore', desc: 'A Dark Mushroom spore that glows a dull violet. Herbalists brew it into the strongest potions.', from: 'Dark Mushrooms' },
  shade:  { type: 'misc', name: 'Dark Crystal', desc: 'A sliver of cold purple light from a Dark Wisp. Runecarvers set it into stone to make runes shine.', from: 'Dark Wisps' },
  cinder: { type: 'misc', name: 'Burnt Shell', desc: 'A Fire Beetle\'s shell, black outside and still warm inside. It never quite cools, even in snow.', from: 'Fire Beetles' },
  ember_dust: { type: 'misc', name: 'Fire Dust', desc: 'Glowing orange flakes from a Fire Wisp. They never cool. Keep them away from your hair.', from: 'Fire Wisps' },
  // boss materials: rare, and the makings of the best gear Gunnar can forge
  heartwood:   { type: 'misc', rare: true, name: 'Giant Root', desc: 'The living core of the Giant Sprout, still green and still growing. Staffwrights pay a fortune for it.', from: 'the Giant Sprout (30%)' },
  king_pearl:  { type: 'misc', rare: true, name: "Big Pearl", desc: 'A golden pearl as big as an egg, from the shell of the King Crab. A treasure fit for a staff.', from: 'the King Crab (30%)' },
  gloom_heart: { type: 'misc', rare: true, name: 'Mushroom Heart', desc: 'The heart of the Giant Mushroom. It pulses slowly, like something asleep. Robes woven round it drink the light.', from: 'the Giant Mushroom (30%)' },
  cinder_core: { type: 'misc', rare: true, name: 'Fire Core', desc: 'A coal from the Giant Beetle that has burnt for a hundred years. Swords quenched in it never cool.', from: 'the Giant Beetle (30%)' },
  jarl_horn:   { type: 'misc', rare: true, name: "Giant Horn", desc: 'A black horn from the Fire Giant, cracked with orange light. Only the greatest weapons are worth it.', from: 'the Fire Giant (25%)' },
  // the kobold and goblin lands, and the ores Holger refines gear with
  kobold_fur:   { type: 'misc', name: 'Kobold Fur', desc: 'A tuft of coarse brown fur from a Kobold. It smells of smoke and wet dog. Tanners in Steinborg buy it by the sack.', from: 'Kobolds' },
  goblin_tooth: { type: 'misc', name: 'Goblin Tooth', desc: 'A yellow Goblin tooth, filed sharp. Goblins wear strings of them; nobody likes to ask whose.', from: 'Goblins' },
  iron_ore:     { type: 'misc', name: 'Iron Ore', desc: 'A lump of rusty iron ore. Holger uses it to refine Lv 1 weapons.', from: 'Kobolds, and Holger sells it' },
  steel_ore:    { type: 'misc', name: 'Steel Ore', desc: 'Dark ore with a blue shine. Holger uses it to refine Lv 2 weapons.', from: 'Kobolds and Goblins, and Holger sells it' },
  hard_ore:     { type: 'misc', name: 'Hard Ore', desc: 'Ore so hard it rings when you tap it. Holger refines Lv 3 and Lv 4 weapons with it, and Seyla wants it for her enchanting.', from: 'Kobolds, Goblins and their kings (1-2%)' },
  armor_ore:    { type: 'misc', name: 'Armor Ore', desc: 'A heavy grey ore that never seems to scratch. Holger refines armor, shields, capes, boots and head gear with it.', from: 'Kobolds, Goblins and their kings (1-2%)' },
  ember_heart: { type: 'misc', name: 'Fire Heart', desc: 'The Fire Giant\'s smouldering heart, still beating: proof that you were the one who brought it down.', from: 'the Fire Giant (MVP reward)' },

  // usables, like Ragnarok's potions and wings. use: hp/sp [min, max], warp (random | camp),
  // buff + t (seconds), cure (ends the Mushling spores' slow)
  potion:  { type: 'use', usable: true, name: 'Red Potion', use: { hp: [45, 65] }, desc: 'A red potion brewed from slime gel and herbs, the first thing every Trainee learns to carry. Restores 45–65 HP.' },
  potion2: { type: 'use', usable: true, name: 'Orange Potion',  use: { hp: [105, 145] }, desc: 'An orange potion, thick and strong: a Red Potion boiled down with spores. Restores 105–145 HP.' },
  potion3: { type: 'use', usable: true, name: 'White Potion', use: { hp: [175, 235] }, desc: 'A white potion that shines like milk in moonlight, brewed with glow dust or dark spores. Restores 175–235 HP.' },
  tonic:   { type: 'use', usable: true, name: 'Blue Potion', use: { sp: [40, 60] }, desc: 'A blue potion that tastes like cold rain. Sorcerers drink it by the bottle. Restores 40–60 SP.' },
  berry:   { type: 'use', usable: true, name: 'Berry', use: { hp: [16, 22] }, desc: 'A wild berry, sweet and juicy, found on Slimes and Sprouts. A quick bite between fights. Restores 16–22 HP.', from: 'Slimes and Sprouts' },
  crableg: { type: 'use', usable: true, name: 'Crab Leg', use: { hp: [70, 100] }, desc: 'A Crab leg, roasted in its own shell. Astrid at the camp says nothing tastes better. Restores 70–100 HP.', from: 'Crabs' },
  herb:    { type: 'use', usable: true, name: 'Green Herb', use: { hp: [5, 8], cure: true }, desc: 'A bitter green herb that clears the head. Cures spore sickness and restores a little HP.', from: 'Sprouts and Mushrooms' },
  quick:   { type: 'use', usable: true, name: 'Speed Potion', use: { buff: 'aspd', t: 180 }, desc: 'A fizzing potion that makes your hands faster than your thoughts. +10% attack speed for 3 minutes.' },
  wander:  { type: 'use', usable: true, name: 'Teleport Feather', use: { warp: 'random' }, desc: 'A feather a Wisp left behind. Throw it up and the wind whisks you to a random spot on this map.', from: 'Wisps' },
  homeward: { type: 'use', usable: true, name: 'Return Feather', use: { warp: 'camp' }, desc: 'A feather that remembers where you saved. Hold it tight and it carries you back to your save point (the camp, until you save with a Keeper).' },

  // one-handed swords (Ragnarok rules, see rules.js)
  twig_sword:   { type: 'equip', slot: 'weapon', jobs: ['novice', 'swordman'], name: 'Wooden Sword',  atk: 15, wlv: 1, icon: 'weapon0', desc: 'A practice sword whittled from a branch. A stick with ambitions; every Trainee starts with one.' },
  stone_blade:  { type: 'equip', slot: 'weapon', el: 'earth', jobs: ['novice', 'swordman'], name: 'Stone Sword', atk: 25, wlv: 1, icon: 'weapon1', desc: 'Ridge stone knapped to an edge and bound to a grip. Crude, but it bites.' },
  ember_edge:   { type: 'equip', slot: 'weapon', jobs: ['novice', 'swordman'], el: 'fire', name: 'Fire Sword',  atk: 44, wlv: 2, icon: 'weapon2', desc: 'A stone blade worked with glow dust until it took the fire. Warm to the touch, glowing at the edge.' },
  iron_sword:   { type: 'equip', slot: 'weapon', jobs: ['novice', 'swordman'], name: 'Iron Sword',  atk: 58, wlv: 2, icon: 'weapon_iron', desc: 'Plain Steinborg steel, well balanced and well made. The Watch carries these.' },
  // staves: weak to hit with, but they raise MATK (the Sorcerer's weapon)
  oak_staff:    { type: 'equip', slot: 'weapon', jobs: ['novice', 'mage'], kind: 'staff', name: 'Wooden Staff', atk: 15, wlv: 1, matk: 15, icon: 'staff0', desc: 'Gnarled oak with a chip of crystal at the tip. Every new Sorcerer is handed one.' },
  birch_staff:  { type: 'equip', slot: 'weapon', jobs: ['mage'], kind: 'staff', name: 'Birch Staff', atk: 22, wlv: 1, matk: 20, stats: { knl: 1 }, icon: 'staff_birch', desc: 'White birch from Birkilund with a pale crystal. Light, and it hums when you chant.' },
  frost_staff:  { type: 'equip', slot: 'weapon', el: 'water', jobs: ['mage'], kind: 'staff', name: 'Ice Staff', atk: 28, wlv: 2, matk: 28, stats: { fns: 2 }, icon: 'staff_frost', desc: 'Frost never melts on its tip. Water spells run through it like a river.' },
  tide_staff:   { type: 'equip', slot: 'weapon', el: 'water', jobs: ['mage'], kind: 'staff', name: 'Water Staff', atk: 30, wlv: 3, matk: 32, stats: { knl: 2 }, msp: 40, icon: 'staff_tide', desc: 'A Big Pearl set in driftwood from the Saltvik shore. It smells of the sea when you cast.' },
  ember_staff:  { type: 'equip', slot: 'weapon', el: 'fire', jobs: ['mage'], kind: 'staff', name: 'Fire Staff', atk: 45, wlv: 4, matk: 38, stats: { knl: 2, ftn: 1 }, icon: 'staff_ember', desc: 'Built round a Fire Core. Its coal heart glows brighter the longer you chant.' },
  shade_staff:  { type: 'equip', slot: 'weapon', el: 'shadow', jobs: ['mage'], kind: 'staff', rare: true, name: 'Dark Staff', atk: 34, wlv: 3, matk: 34, stats: { knl: 2, fns: 1 }, icon: 'staff_shade', desc: 'A Dark Wisp is bound in its crystal. On quiet nights you can hear it whisper.', from: 'Dark Wisps (0.2%)' },
  jarl_staff:   { type: 'equip', slot: 'weapon', el: 'fire', jobs: ['mage'], kind: 'staff', rare: true, name: 'Flame Staff', atk: 60, wlv: 4, matk: 50, stats: { knl: 4, fns: 2 }, icon: 'staff_jarl', desc: 'Black stone from the Fire Giant\'s lair, shot through with living fire.', from: 'the Fire Giant (2%)' },
  runeking_staff: { type: 'equip', slot: 'weapon', jobs: ['mage'], kind: 'staff', name: "Great Staff", atk: 55, wlv: 4, matk: 55, stats: { knl: 4, fns: 3 }, msp: 50, icon: 'staff_runeking', desc: 'Three boss hearts bound with Orm\'s best runes: the greatest staff in Aria.' },
  rune_staff:   { type: 'equip', slot: 'weapon', jobs: ['mage'], kind: 'staff', name: 'Rune Staff', atk: 30, wlv: 2, matk: 25, stats: { knl: 2 }, icon: 'staff1', desc: 'Carved all over with runes that glow when spells are sung through it.' },
  frostbite:    { type: 'equip', slot: 'weapon', jobs: ['swordman'], el: 'water', name: 'Ice Sword', atk: 62, wlv: 2, icon: 'weapon_frost', desc: 'Forged cold with salt and dew; rime creeps along the blade even in summer. Fire beasts hate it.' },
  gale_blade:   { type: 'equip', slot: 'weapon', jobs: ['swordman'], el: 'wind', name: 'Wind Sword', atk: 72, wlv: 3, stats: { qkn: 1 }, icon: 'weapon_gale', desc: 'Thin and quick, with a pearl in the hilt. It whistles as it cuts.' },
  emberbrand:   { type: 'equip', slot: 'weapon', jobs: ['swordman'], el: 'fire', rare: true, name: 'Flame Sword', atk: 110, wlv: 4, icon: 'weapon3', desc: 'The Fire Giant\'s own blade, still burning. Few have held it and fewer have kept it.', from: 'the Fire Giant' },
  // rare drops, Ragnarok style: each from one kind of monster at a fraction of a percent.
  // stats: bonus points to POW, QKN, END, KNL, FNS, FTN; mhp / msp: extra Max HP / SP
  gooey_ring:   { type: 'equip', slot: 'acc', rare: true, name: 'Slime Ring', stats: { ftn: 2 }, mhp: 20, icon: 'r_gooey', desc: 'A ring of hardened slime that never quite dries. Lucky, they say.', from: 'Slimes (0.5%)' },
  tide_pendant: { type: 'equip', slot: 'acc', rare: true, name: 'Water Necklace', stats: { knl: 2 }, msp: 15, icon: 'r_tide', desc: 'A drop of Blue Slime water held in glass. Cool to the touch, like deep water.', from: 'Blue Slimes (0.3%)' },
  seedling_band: { type: 'equip', slot: 'acc', rare: true, name: 'Leaf Bracelet', stats: { end: 1, qkn: 1 }, fx: 'regen', icon: 'r_seed', desc: 'A living green bracelet that sprouted from a Sprout\'s seed. HP recovers twice as fast.', from: 'Sprouts (0.4%)' },
  mud_buckler:  { type: 'equip', slot: 'shield', jobs: ['novice', 'swordman'], rare: true, name: 'Shell Buckler', def: 3, mhp: 40, icon: 'r_buckler', desc: 'A small round shield cut from a big Crab\'s shell, light and hard.', from: 'Crabs (0.3%)' },
  spore_cloak:  { type: 'equip', slot: 'garment', rare: true, name: 'Mushroom Cloak', def: 1, flee: 4, icon: 'r_cloak', desc: 'Woven from mushroom threads, light as mist. Blows aside like it was never there.', from: 'Mushrooms (0.25%)' },
  horn_blade:   { type: 'equip', slot: 'weapon', jobs: ['swordman'], el: 'earth', rare: true, name: 'Horn Sword', atk: 68, wlv: 3, stats: { pow: 1 }, icon: 'weapon_horn', desc: 'A sword ground from a Beetle\'s horn, harder than iron. Beetles rarely give one up.', from: 'Beetles (0.15%)' },
  pebble_ring:  { type: 'equip', slot: 'acc', rare: true, name: 'Stone Ring', stats: { end: 2 }, def: 1, icon: 'r_pebble', desc: 'A plain stone band from a Beetle\'s back. It makes you feel as heavy as a hill.', from: 'Beetles (0.3%)' },
  wisp_lantern: { type: 'equip', slot: 'light', rare: true, name: 'Lantern', fx: 'light', stats: { knl: 1, fns: 1 }, icon: 'r_lantern', desc: 'A Wisp sleeps inside, glowing softly. Lights the night, and clears the mind.', from: 'Wisps (0.4%)' },
  // boss drops
  thorn_mantle: { type: 'equip', slot: 'garment', rare: true, name: 'Thorn Cape', def: 3, flee: 2, stats: { pow: 1 }, icon: 'r_thorncloak', desc: 'Briars from the Giant Sprout, woven tight as mail. Hug it at your peril.', from: 'the Giant Sprout (3%)' },
  tidebreaker:  { type: 'equip', slot: 'weapon', jobs: ['swordman'], el: 'water', rare: true, name: 'Sea Sword', atk: 85, wlv: 4, stats: { qkn: 2 }, icon: 'weapon_tide', desc: 'A blade from the King Crab\'s claw, curved like a breaking wave. It feels lighter than it is.', from: 'the King Crab (2%)' },
  gloom_staff:  { type: 'equip', slot: 'weapon', el: 'shadow', jobs: ['mage'], kind: 'staff', rare: true, name: 'Mushroom Staff', atk: 40, wlv: 4, matk: 40, stats: { knl: 3 }, icon: 'staff2', desc: 'A staff grown, not carved, from the Giant Mushroom\'s stalk. It drinks shadow and breathes out spells.', from: 'the Giant Mushroom (2%)' },
  cinder_greaves: { type: 'equip', slot: 'shoes', rare: true, name: 'Fire Boots', def: 3, mhp: 60, icon: 'boots_cinder', desc: 'Black shell boots from the Giant Beetle that never cool. Lava is merely rude to them.', from: 'the Giant Beetle (3%)' },
  jarl_mantle:  { type: 'equip', slot: 'garment', rare: true, name: "Giant Cape", def: 4, mhp: 100, stats: { end: 2 }, icon: 'r_jarlcloak', desc: 'Smouldering hide from the Fire Giant. It is warm, heavy, and slightly terrifying.', from: 'the Fire Giant (3%)' },
  // forged from boss materials (Gunnar)
  heartwood_staff: { type: 'equip', slot: 'weapon', el: 'earth', jobs: ['mage'], kind: 'staff', name: 'Root Staff', atk: 35, wlv: 3, matk: 30, stats: { knl: 2, fns: 2 }, icon: 'staff3', desc: 'Carved from the Giant Sprout\'s living root. The wood still grows, slowly, in your hands.' },
  pearl_mail:   { type: 'equip', slot: 'armor', jobs: ['swordman', 'mage'], name: 'Pearl Armor', def: 7, mhp: 40, msp: 30, icon: 'armor_pearl', desc: 'Crab shell scales set with pearls from the King Crab. It shimmers like wet sand.' },
  gloom_robe:   { type: 'equip', slot: 'armor', jobs: ['mage'], name: 'Dark Robe', def: 4, msp: 60, stats: { knl: 2 }, icon: 'armor_gloom', desc: 'Spore silk spun round a Mushroom Heart. It drinks the light around you.' },
  cinderfang:   { type: 'equip', slot: 'weapon', jobs: ['swordman'], el: 'fire', name: 'Lava Sword', atk: 95, wlv: 4, stats: { pow: 2 }, icon: 'weapon_cinder', desc: 'A blade quenched in a Fire Core. Its edge glows red when it is angry, which is always.' },
  hornblade:    { type: 'equip', slot: 'weapon', jobs: ['swordman'], el: 'fire', name: 'Giant Sword', atk: 120, wlv: 4, stats: { pow: 3, end: 1 }, icon: 'weapon_jarl', desc: 'Ground from the Fire Giant\'s own horn and quenched in its heart. The finest sword in Aria.' },
  prism_ring:   { type: 'equip', slot: 'acc', name: 'Rainbow Ring', stats: { pow: 1, qkn: 1, end: 1, knl: 1, fns: 1, ftn: 1 }, icon: 'r_prism', desc: 'Shimmering gel set in pearl. It catches every colour, and a little of every strength.' },
  slime_band:   { type: 'equip', slot: 'acc', name: 'Slime Band', stats: { ftn: 2, knl: 2 }, mhp: 30, msp: 20, icon: 'r_twin', desc: 'A green ring and a blue pendant, melted into one. Two slimes\' worth of luck.' },
  bramble_ring: { type: 'equip', slot: 'acc', rare: true, name: 'Thorn Ring', stats: { pow: 1 }, hit: 3, icon: 'r_bramble', desc: 'A ring of Red Sprout thorns. It bites back, and so do you.', from: 'Red Sprouts (0.3%)' },
  coral_shield: { type: 'equip', slot: 'shield', rare: true, name: 'Coral Shield', def: 4, msp: 20, icon: 'r_coral', desc: 'Coral from the Saltvik shore, light, hard, and humming with the sea.', from: 'Blue Crabs (0.25%)' },
  gloom_hood:   { type: 'equip', slot: 'garment', rare: true, name: 'Dark Hood', def: 2, flee: 3, stats: { knl: 1 }, icon: 'r_hood', desc: 'Woven from violet spore threads. Things in the dark see you less clearly.', from: 'Dark Mushrooms (0.25%)' },
  cinder_mail:  { type: 'equip', slot: 'armor', jobs: ['swordman'], rare: true, name: 'Fire Armor', def: 8, mhp: 80, icon: 'armor_cinder', desc: 'Black Fire Beetle plates with a warm glow inside. It never lets the cold in.', from: 'Fire Beetles (0.2%)' },
  ember_charm:  { type: 'equip', slot: 'acc', rare: true, name: 'Fire Charm', stats: { pow: 1, knl: 1 }, mhp: 30, icon: 'r_ember', desc: 'A Fire Wisp curled up asleep in a glass bead. Warm and strangely cheerful.', from: 'Fire Wisps (0.3%)' },
  kobold_ring:  { type: 'equip', slot: 'acc', rare: true, name: 'King\'s Ring', stats: { pow: 2, end: 1 }, mhp: 50, icon: 'r_kobold', desc: 'A heavy gold ring from the Kobold King\'s paw, much too big for a person. It feels like a fist.', from: 'the Kobold King (5%)' },
  goblin_charm: { type: 'equip', slot: 'acc', rare: true, name: 'Tooth Necklace', stats: { qkn: 2, fns: 1 }, hit: 5, icon: 'r_goblin', desc: 'The Goblin King\'s necklace of teeth. It rattles when you move, and you move faster.', from: 'the Goblin King (5%)' },
  // MVP cards (Ragnarok's monster cards, and like its MVP cards, overpowered): pressed into a
  // slotted weapon for good (a weapon that breaks at Holger's gives its cards back), see Seyla and
  // the Insert button. card: where it goes and what it adds: atk, def, matk (% MATK), hit, flee,
  // mhpRate / mspRate (% Max HP / SP), aspd (% faster attacks), el (the weapon's element) and stats
  kobold_card:  { type: 'misc', rare: true, name: 'Kobold King Card', icon: 'card_kobold', card: { on: 'weapon', mhpRate: 40, def: 10, flee: 10, stats: { end: 10 } }, desc: 'The Kobold King on a gilded card, too stubborn to fall. In a weapon with a slot: Max HP +40%, DEF +10, FLEE +10, END +10.', from: 'the Kobold King (1%)' },
  goblin_card:  { type: 'misc', rare: true, name: 'Goblin King Card', icon: 'card_goblin', card: { on: 'weapon', atk: 100, aspd: 15, stats: { pow: 10, qkn: 10 } }, desc: 'The Goblin King on a gilded card, grinning. In a weapon with a slot: ATK +100, POW +10, QKN +10, attacks 15% faster.', from: 'the Goblin King (1%)' },
  // mini-boss cards: a step above an ordinary piece of gear, well below an MVP's
  sprout_card:  { type: 'misc', rare: true, name: 'Giant Sprout Card', icon: 'card_sprout', card: { on: 'weapon', mhpRate: 10, stats: { end: 4 } }, desc: 'The Giant Sprout on a leafy card. In a weapon with a slot: Max HP +10%, END +4.', from: 'the Giant Sprout (1%)' },
  crab_card:    { type: 'misc', rare: true, name: 'King Crab Card', icon: 'card_crab', card: { on: 'weapon', flee: 8, aspd: 5, stats: { qkn: 4 } }, desc: 'The King Crab on a sea-stained card. In a weapon with a slot: QKN +4, FLEE +8, attacks 5% faster.', from: 'the King Crab (1%)' },
  mushroom_card: { type: 'misc', rare: true, name: 'Giant Mushroom Card', icon: 'card_mushroom', card: { on: 'weapon', matk: 15, mspRate: 10, stats: { knl: 4 } }, desc: 'The Giant Mushroom on a violet card that smells of rain. In a weapon with a slot: MATK +15%, KNL +4, Max SP +10%.', from: 'the Giant Mushroom (1%)' },
  beetle_card:  { type: 'misc', rare: true, name: 'Giant Beetle Card', icon: 'card_beetle', card: { on: 'weapon', atk: 25, stats: { pow: 4 } }, desc: 'The Giant Beetle on a scorched card. In a weapon with a slot: ATK +25, POW +4.', from: 'the Giant Beetle (1%)' },
  jarl_card:    { type: 'misc', rare: true, name: 'Fire Giant Card', icon: 'card_jarl', card: { on: 'weapon', matk: 60, mspRate: 30, mhpRate: 15, el: 'fire', stats: { knl: 12, fns: 8 } }, desc: 'The Fire Giant on a scorched card, still warm: a sorcerer\'s treasure. In a weapon with a slot: MATK +60%, KNL +12, FNS +8 (quicker casting), Max SP +30%, Max HP +15%, and the weapon turns to Fire (a staff then adds 15% to Fire spells).', from: 'the Fire Giant (1%)' },
  shiny_gel:    { type: 'misc', rare: true, name: 'Shiny Gel', desc: 'Slime gel that shimmers with every colour, found once in a hundred slimes. Collectors and ring-makers prize it.', from: 'any slime (1%)' },

  // headgear: worn on the head and seen on your character (see headgear.js): Head pieces on the
  // crown, Face pieces on the eyes of the head layer
  round_glasses: { type: 'equip', slot: 'face', name: 'Glasses', hit: 3, desc: 'Round wire glasses with blue dew-glass lenses. Everything is sharper, and so is your aim.' },
  raven_mask:   { type: 'equip', slot: 'face', name: 'Bird Mask', flee: 2, desc: 'Black feathers and a short beak. You look like trouble, and you are harder to hit.' },
  ember_crown:  { type: 'equip', slot: 'head', rare: true, name: "Horned Crown", def: 4, stats: { pow: 2, end: 1 }, desc: 'A horned iron crown from the Fire Giant, still warm. Wearing it feels like holding a hearth.', from: 'the Fire Giant' },
  flame_circlet: { type: 'equip', slot: 'head', rare: true, name: 'Fire Crown', def: 2, stats: { pow: 1, ftn: 1 }, desc: 'An iron band crowned with living flame, forged around a Fire Heart. The fire never burns its wearer.' },
  woven_cap:    { type: 'equip', slot: 'head', name: 'Leaf Cap', def: 1, desc: 'A little cap of leaves woven tight, with a sturdy cloth band. Popular with Trainees.' },
  flower_wreath: { type: 'equip', slot: 'head', name: 'Flower Crown', def: 0, flee: 1, desc: 'Meadow flowers on a green ring. Sprouts drop them sometimes; nobody knows where they find them.' },
  horned_helm:  { type: 'equip', slot: 'head', name: 'Horned Helm', def: 3, desc: 'Iron, brass and two proud horns. Heavy, loud, and very good at stopping clubs.' },
  // body armor: hard DEF
  clothes:      { type: 'equip', slot: 'armor', name: 'Cotton Shirt', def: 1, icon: 'armor0', desc: 'Patched cotton, comfortable and cheap. Better than nothing, but not by much.' },
  leaf_tunic:   { type: 'equip', slot: 'armor', name: 'Leaf Tunic',  def: 2, icon: 'armor1', desc: 'Leaves woven tight over a linen shirt. Surprisingly tough, and it smells of spring.' },
  shell_mail:   { type: 'equip', slot: 'armor', name: 'Shell Armor',  def: 4, icon: 'armor2', desc: 'Overlapping Crab shell plates sewn onto leather. It clacks when you run.' },
  beetle_plate: { type: 'equip', slot: 'armor', jobs: ['swordman'], name: 'Beetle Armor', def: 6, icon: 'armor3', desc: 'Heavy plates of Beetle shell, dark and very hard. Bladers only: it takes a strong back.' },
  chain_mail:   { type: 'equip', slot: 'armor', jobs: ['swordman'], name: 'Chain Mail', def: 5, icon: 'armor_chain', desc: 'Iron rings, oiled and tight, from Gunnar\'s own forge. The Watch\'s standard armor.' },
  mage_robe:    { type: 'equip', slot: 'armor', jobs: ['mage'], name: 'Robe', def: 2, msp: 30, icon: 'armor_robe', desc: 'Blue wool stitched with silver runes. Galdrheim\'s apprentices wear these.' },
  round_shield: { type: 'equip', slot: 'shield', jobs: ['novice', 'swordman'], name: 'Round Shield', def: 2, icon: 'shield_round', desc: 'Linden boards with an iron boss. Simple, and it has saved more lives than any sword.' },
  wool_cape:    { type: 'equip', slot: 'garment', name: 'Wool Cape', def: 1, icon: 'cape', desc: 'Warm, grey and hard-wearing. Every traveller in Aria owns one.' },
  leather_boots: { type: 'equip', slot: 'shoes', name: 'Leather Boots', def: 1, icon: 'boots_leather', desc: 'Good leather soles for long roads. Your feet will thank you.' },
  swift_boots:  { type: 'equip', slot: 'shoes', name: 'Swift Boots', def: 1, fx: 'speed', icon: 'boots', desc: 'Light boots soled with shell and laced with leaf. Walk 20% quicker (a haste, like Increase AGI's: hastes don't stack).' },
  torch:        { type: 'equip', slot: 'light', name: 'Torch', fx: 'light', desc: 'A pine torch dipped in pitch. Lights your way at night.' },
  // accessories: one can be worn at a time
  sprout_charm: { type: 'equip', slot: 'acc', name: 'Sprout Charm', fx: 'regen', icon: 'charm_sprout', desc: 'A Sprout seed in a woven knot. It keeps growing, and so do your wounds close. HP recovers twice as fast.' },
  spore_charm:  { type: 'equip', slot: 'acc', name: 'Spore Charm',  fx: 'aspd',  icon: 'charm_spore', desc: 'A spore cap in a pouch. Its scent keeps your hands quick. +10% attack speed.' },
  shell_charm:  { type: 'equip', slot: 'acc', name: 'Shell Charm',  fx: 'block', icon: 'charm_shell', desc: 'A polished shell on a cord. It turns aside blows you never saw. 1 in 5 hits is blocked.' },
  glow_charm:   { type: 'equip', slot: 'acc', name: 'Glow Charm',   fx: 'exp',   icon: 'charm_glow', desc: 'A pinch of glow dust in a glass vial. Every lesson seems brighter. +25% experience.' },
};

// ---------- upgraded gear: refine level, card slots and cards ----------
// A refined, slotted or carded piece is kept under a key: 'iron_sword|r7|s1|cgoblin_card' (its base
// item, then r = refine level, s = slots, c = the cards in them). ITEMS[key] is the base item with
// the upgrades worked in (name '+7 Iron Sword [1]', more ATK or DEF, the cards' bonuses), so
// everything that reads ITEMS works on upgraded gear too. A plain item stays its plain id.
export const baseOf = (key) => String(key).split('|')[0];
export function parseKey(key) {
  const [base, ...parts] = String(key).split('|'), u = { base, refine: 0, slots: 0, cards: [] };
  for (const p of parts) {
    if (p[0] === 'r') u.refine = p.slice(1) | 0;
    else if (p[0] === 's') u.slots = p.slice(1) | 0;
    else if (p[0] === 'c') u.cards = p.slice(1).split(',').filter(Boolean);
  }
  return u;
}
export function makeKey(base, { refine = 0, slots = 0, cards = [] } = {}) {
  return [base, refine ? `r${refine}` : '', slots ? `s${slots}` : '', cards.length ? `c${cards.join(',')}` : ''].filter(Boolean).join('|');
}
// Ragnarok's refine bonus: weapon ATK per level by weapon level; other gear +1 DEF per level
const REFINE_ATK = { 1: 2, 2: 3, 3: 5, 4: 7 };
const upgraded = new Map();
function upgradedItem(key) {
  if (upgraded.has(key)) return upgraded.get(key);
  const u = parseKey(key), b = BASE_ITEMS[u.base];
  if (!b) return undefined;
  const it = { ...b, base: u.base, refine: u.refine, slots: u.slots, cards: u.cards, icon: b.icon || u.base, stats: { ...(b.stats || {}) } };
  if (u.refine) {
    if (b.slot === 'weapon') it.atk = (b.atk || 0) + u.refine * REFINE_ATK[b.wlv || 1];
    else it.def = (b.def || 0) + u.refine;
  }
  for (const c of u.cards) {
    const cd = BASE_ITEMS[c]?.card;
    if (!cd) continue;
    for (const k of ['atk', 'def', 'matk', 'hit', 'flee', 'mhpRate', 'mspRate', 'aspd']) if (cd[k]) it[k] = (it[k] || 0) + cd[k];
    if (cd.el) it.el = cd.el;
    for (const [k, v] of Object.entries(cd.stats || {})) it.stats[k] = (it.stats[k] || 0) + v;
  }
  it.name = `${u.refine ? `+${u.refine} ` : ''}${b.name}${u.slots ? ` [${u.slots}]` : ''}`;
  upgraded.set(key, it);
  return it;
}
export const ITEMS = new Proxy(BASE_ITEMS, {
  get: (t, k) => (typeof k === 'string' && k.includes('|') ? upgradedItem(k) : t[k]),
  has: (t, k) => (typeof k === 'string' && k.includes('|') ? !!upgradedItem(k) : k in t),
});
// what an upgraded piece has had done to it, for the item details
export function upgradeLine(it) {
  const p = [];
  if (it.refine) p.push(`Refined +${it.refine}`);
  if (it.slots) p.push(`Slots ${it.cards?.length || 0}/${it.slots}${it.cards?.length ? ': ' + it.cards.map((c) => BASE_ITEMS[c]?.name || c).join(', ') : ''}`);
  return p.join(' · ');
}

// Holger's refining, at Hollgrehenn's rates (Ragnarok classic, normal ores): safe up to a level
// by weapon level (armor: +4), then each try has a chance, and a failure breaks the piece.
export const REFINABLE = ['weapon', 'armor', 'shield', 'garment', 'shoes', 'head'];
export const MAX_REFINE = 10;
const SAFE = { 1: 7, 2: 6, 3: 5, 4: 4, armor: 4 };
const REFINE_RATES = { 1: [60, 40, 19], 2: [60, 40, 20, 19], 3: [60, 50, 20, 20, 19], 4: [60, 40, 40, 20, 20, 9], armor: [60, 40, 40, 20, 20, 9] };
const REFINE_COST = { 1: ['iron_ore', 50], 2: ['steel_ore', 200], 3: ['hard_ore', 5000], 4: ['hard_ore', 20000], armor: ['armor_ore', 2000] };
// the next refine of a piece: { level (now), next, chance %, safe, ore, fee }, or null if it can't be refined
export function refineInfo(key) {
  const it = ITEMS[key];
  if (!it || it.type !== 'equip' || !REFINABLE.includes(it.slot)) return null;
  const k = it.slot === 'weapon' ? it.wlv || 1 : 'armor', level = it.refine || 0, next = level + 1;
  if (level >= MAX_REFINE) return { level, max: true };
  const safe = next <= SAFE[k];
  const [ore, fee] = REFINE_COST[k];
  return { level, next, safe, chance: safe ? 100 : REFINE_RATES[k][next - SAFE[k] - 1], ore, fee, safeTo: SAFE[k] };
}

// Seyla's enchanting: a card slot at a time, up to two. The first works half the time; the second
// a quarter of the time, for twice the materials. A failure breaks the piece (its card comes back).
// For now only Lv 4 weapons take slots (and every card is a weapon card).
export const SLOTTABLE = ['weapon'];
export const MAX_SLOTS = 2;
export const ENCHANT = { chance: [50, 25], perz: 50000, items: { hard_ore: 5, shade: 5 }, boss: ['heartwood', 'king_pearl', 'gloom_heart', 'cinder_core'] };
// the next enchant of a piece: { slots (after it), chance %, mult (x the materials) }
export const enchantStep = (key) => { const n = ITEMS[key]?.slots || 0; return { slots: n + 1, chance: ENCHANT.chance[n], mult: n + 1 }; };
export const canEnchant = (key) => { const it = ITEMS[key]; return !!it && it.type === 'equip' && SLOTTABLE.includes(it.slot) && it.wlv === 4 && (it.slots || 0) < MAX_SLOTS; };
// a card fits a piece of its kind with a free slot
export const canInsert = (card, key) => {
  const cd = ITEMS[card]?.card, it = ITEMS[key];
  return !!cd && !!it && it.type === 'equip' && it.slot === cd.on && (it.slots || 0) > (it.cards?.length || 0);
};

// Prices in perz (Aria's coin, like Ragnarok's zeny): what a shop asks; any shop buys for half. 0 = can't be sold.
export const PRICES = {
  gel: 6, dew: 10, seed: 8, leaf: 8, shell: 24, spore: 40, stone: 60, glow: 50, ember_heart: 4000,
  kobold_fur: 260, goblin_tooth: 380, iron_ore: 50, steel_ore: 200, hard_ore: 4000, armor_ore: 4000,
  kobold_ring: 20000, goblin_charm: 24000, kobold_card: 40000, goblin_card: 40000, jarl_card: 60000, sprout_card: 16000, crab_card: 18000, mushroom_card: 20000, beetle_card: 22000,
  thorn: 70, salt: 90, pearl: 600, gloom: 150, shade: 180, cinder: 240, ember_dust: 220, shiny_gel: 1200,
  potion: 50, potion2: 180, potion3: 550, tonic: 300, berry: 20, crableg: 60, herb: 30, quick: 600, wander: 120, homeward: 300,
  twig_sword: 50, stone_blade: 500, ember_edge: 2400, iron_sword: 3800, oak_staff: 400, rune_staff: 4200, emberbrand: 40000,
  gooey_ring: 4000, tide_pendant: 5000, seedling_band: 5000, mud_buckler: 6000, spore_cloak: 7000, horn_blade: 15000, pebble_ring: 5000,
  wisp_lantern: 6000, bramble_ring: 6000, coral_shield: 8000, gloom_hood: 9000, cinder_mail: 14000, ember_charm: 9000,
  ember_crown: 30000, flame_circlet: 20000, round_glasses: 600, raven_mask: 400, woven_cap: 300, flower_wreath: 200, horned_helm: 1800,
  clothes: 10, leaf_tunic: 300, shell_mail: 1100, beetle_plate: 2800, chain_mail: 3200, mage_robe: 2600,
  round_shield: 1200, wool_cape: 700, leather_boots: 500, swift_boots: 1000, torch: 100,
  sprout_charm: 700, spore_charm: 1000, shell_charm: 1000, glow_charm: 1200,
  heartwood: 3000, king_pearl: 4000, gloom_heart: 5000, cinder_core: 6000, jarl_horn: 8000,
  thorn_mantle: 12000, tidebreaker: 20000, gloom_staff: 22000, cinder_greaves: 16000, jarl_mantle: 30000,
  heartwood_staff: 14000, frostbite: 5200, gale_blade: 9000, birch_staff: 1800, frost_staff: 3600, tide_staff: 12000, ember_staff: 20000, shade_staff: 16000, jarl_staff: 42000, runeking_staff: 50000, pearl_mail: 12000, gloom_robe: 14000, cinderfang: 24000, hornblade: 45000, prism_ring: 8000, slime_band: 12000,
};
export const sellPrice = (id) => Math.floor((PRICES[baseOf(id)] || 0) / 2); // upgraded gear sells at its base price

// what each Steinborg shop sells
export const SHOPS = {
  hild: ['potion', 'potion2', 'tonic', 'herb', 'berry', 'wander', 'homeward', 'torch'],
  holger: ['iron_ore', 'steel_ore'], // the refiner's ores (Hard and Armor Ore only drop)
  gunnar: ['twig_sword', 'stone_blade', 'iron_sword', 'clothes', 'chain_mail', 'round_shield', 'wool_cape', 'leather_boots'],
  // Galdrheim: Kari's curios (like Hild's, and Speed Potions), Orm's staves and robes
  kari: ['potion', 'potion2', 'tonic', 'herb', 'berry', 'quick', 'wander', 'homeward', 'torch'],
  orm: ['oak_staff', 'birch_staff', 'frost_staff', 'rune_staff', 'mage_robe', 'wool_cape', 'leather_boots'],
};
// who crafts a recipe: 'use' (Ragna's brews), 'magic' (Orm's staves and sorcerers' gear), 'gear' (Gunnar's forge)
export const recipeKind = (r) => {
  const it = ITEMS[r.item];
  if (it.type !== 'equip') return 'use';
  return it.kind === 'staff' || (it.jobs && it.jobs.every((j) => j === 'mage')) ? 'magic' : 'gear';
};

// equipment slots, in the Equipment window's order
export const JOB_NAMES = { novice: 'Trainee', swordman: 'Blader', mage: 'Sorcerer' };
// job: one job id, or the list of jobs a hero has earned (any of them will do); second jobs wear
// what the jobs before them wear
const WEARS_AS = { blademaster: ['swordman'], wizard: ['mage'], magicknight: ['swordman', 'mage'] };
export const canWear = (id, job) => {
  const it = ITEMS[id], jobs = [job].flat().flatMap((j) => [j, ...(WEARS_AS[j] || [])]);
  return !it?.jobs || jobs.some((j) => it.jobs.includes(j));
};
// who can wear it, for item descriptions
export const jobLine = (it) => (it.jobs ? it.jobs.map((j) => JOB_NAMES[j]).join(', ') + ' only' : 'All jobs');

// headgear: Head (hats, on the crown) and Face (glasses and masks, on the eyes)
export const SLOTS = { head: 'Head', face: 'Face', weapon: 'Weapon', shield: 'Shield', garment: 'Garment', armor: 'Armor', shoes: 'Shoes', light: 'Light', acc: 'Accessory', acc2: 'Accessory' };

// one line on what a piece of equipment does
export function equipLine(it) {
  const p = [];
  if (it.atk) p.push(`ATK ${it.atk}`, `Weapon Lv ${it.wlv}`);
  if (it.el) p.push(`${it.el[0].toUpperCase() + it.el.slice(1)} element`);
  if (it.def) p.push(`DEF ${it.def}`);
  if (it.hit) p.push(`HIT +${it.hit}`);
  if (it.matk) p.push(`MATK +${it.matk}%`);
  for (const [k, v] of Object.entries(it.stats || {})) p.push(`${k.toUpperCase()} +${v}`);
  if (it.mhp) p.push(`Max HP +${it.mhp}`);
  if (it.mhpRate) p.push(`Max HP +${it.mhpRate}%`);
  if (it.mspRate) p.push(`Max SP +${it.mspRate}%`);
  if (it.aspd) p.push(`attacks ${it.aspd}% faster`);
  if (it.msp) p.push(`Max SP +${it.msp}`);
  if (it.flee) p.push(`FLEE +${it.flee}`);
  return p.join(' · ');
}

// Everything crafts into an item in the bag; lv = Base Level needed to craft it
export const RECIPES = [
  { item: 'stone_blade', lv: 3, cost: { stone: 4, shell: 3 } },
  { item: 'ember_edge',  lv: 6, cost: { stone: 6, glow: 4, spore: 3 } },
  { item: 'leaf_tunic',  lv: 2, cost: { leaf: 6, seed: 4 } },
  { item: 'shell_mail',  lv: 4, cost: { shell: 6, gel: 4 } },
  { item: 'beetle_plate', lv: 7, cost: { stone: 8, dew: 4, spore: 2 } },
  { item: 'potion', cost: { gel: 2, dew: 1, leaf: 1 } },
  { item: 'potion2', lv: 5, cost: { potion: 2, spore: 1 } },
  { item: 'potion3', lv: 10, cost: { potion2: 2, glow: 2 } },
  { item: 'tonic', lv: 3, cost: { dew: 3, glow: 1 } },
  { item: 'quick', lv: 6, cost: { spore: 2, dew: 2, stone: 1 } },
  { item: 'tonic', lv: 8, cost: { salt: 2, dew: 1 } },
  { item: 'potion3', lv: 18, cost: { gloom: 2, potion2: 1 } },
  { item: 'wander', lv: 2, cost: { glow: 1, leaf: 1 } },
  { item: 'homeward', lv: 2, cost: { glow: 2, seed: 1 } },
  { item: 'torch', cost: { glow: 3, leaf: 2 } },
  { item: 'swift_boots', cost: { shell: 4, dew: 3, leaf: 3 } },
  { item: 'flower_wreath', cost: { leaf: 3, seed: 2 } },
  { item: 'woven_cap', lv: 2, cost: { leaf: 5, seed: 2 } },
  { item: 'flame_circlet', lv: 12, cost: { ember_heart: 1, glow: 6, stone: 6 } },
  { item: 'raven_mask', lv: 3, cost: { wander: 2, gel: 2 } },
  { item: 'round_glasses', lv: 5, cost: { dew: 3, stone: 2 } },
  { item: 'horned_helm', lv: 8, cost: { stone: 6, shell: 4, glow: 1 } },
  { item: 'rune_staff', lv: 12, cost: { shade: 4, glow: 6, thorn: 4 } },
  { item: 'mage_robe', lv: 8, cost: { salt: 3, glow: 4, leaf: 6 } },
  { item: 'wool_cape', lv: 5, cost: { thorn: 3, leaf: 4 } },
  { item: 'round_shield', lv: 6, cost: { thorn: 4, stone: 3 } },
  // from boss materials and rare finds
  { item: 'frostbite', lv: 12, cost: { salt: 4, dew: 6, stone: 4 } },
  { item: 'gale_blade', lv: 16, cost: { pearl: 1, glow: 8, stone: 6, thorn: 4 } },
  { item: 'heartwood_staff', lv: 14, cost: { heartwood: 1, shade: 3, glow: 5 } },
  { item: 'frost_staff', lv: 10, cost: { salt: 4, dew: 6, glow: 4 } },
  { item: 'tide_staff', lv: 16, cost: { king_pearl: 1, pearl: 2, salt: 4 } },
  { item: 'ember_staff', lv: 20, cost: { cinder_core: 1, ember_dust: 6, glow: 6 } },
  { item: 'runeking_staff', lv: 25, cost: { jarl_horn: 1, gloom_heart: 1, heartwood: 1, shade: 5 } },
  { item: 'pearl_mail', lv: 14, cost: { king_pearl: 1, pearl: 2, shell: 10 } },
  { item: 'gloom_robe', lv: 18, cost: { gloom_heart: 1, gloom: 6, salt: 3 } },
  { item: 'cinderfang', lv: 22, cost: { cinder_core: 1, cinder: 6, stone: 8 } },
  { item: 'hornblade', lv: 25, cost: { jarl_horn: 1, ember_heart: 1, cinder_core: 1 } },
  { item: 'prism_ring', lv: 10, cost: { shiny_gel: 3, pearl: 1 } },
  { item: 'slime_band', lv: 12, cost: { gooey_ring: 1, tide_pendant: 1, shiny_gel: 1 } },
  { item: 'sprout_charm', lv: 2, cost: { seed: 5, leaf: 3 } },
  { item: 'spore_charm',  lv: 4, cost: { spore: 5, gel: 3 } },
  { item: 'shell_charm',  lv: 4, cost: { shell: 5, stone: 2 } },
  { item: 'glow_charm',   lv: 5, cost: { glow: 4, dew: 2 } },
];

// ---------- icons ----------
const OUT = '#2e2118';
function mk() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.lineJoin = g.lineCap = 'round';
  return { c, g };
}
function shape(g, draw, fill, lw = 3.5) {
  g.beginPath(); draw(); g.fillStyle = fill; g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke();
}
function gloss(g, x, y, rx = 5, ry = 3.5) {
  g.beginPath(); g.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill();
}

function swordIcon(g, blade, guard, edge) {
  g.save(); g.translate(32, 32); g.rotate(Math.PI / 4);
  shape(g, () => { g.moveTo(-4.5, 6); g.lineTo(4.5, 6); g.lineTo(4.5, -18); g.lineTo(0, -26); g.lineTo(-4.5, -18); g.closePath(); }, blade);
  if (edge) { g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -22); g.strokeStyle = edge; g.lineWidth = 2; g.stroke(); }
  shape(g, () => g.roundRect(-11, 5, 22, 6, 2), guard, 2.5);
  shape(g, () => g.roundRect(-3, 10, 6, 12, 2), '#6b4426', 2.5);
  shape(g, () => g.arc(0, 24, 4, 0, Math.PI * 2), guard, 2.5);
  g.restore();
}

function armorIcon(g, main, trim) {
  shape(g, () => {
    g.moveTo(16, 16); g.lineTo(26, 11); g.quadraticCurveTo(32, 17, 38, 11); g.lineTo(48, 16);
    g.lineTo(52, 30); g.lineTo(45, 32); g.lineTo(45, 54); g.lineTo(19, 54); g.lineTo(19, 32); g.lineTo(12, 30); g.closePath();
  }, main);
  g.beginPath(); g.moveTo(19, 44); g.lineTo(45, 44); g.strokeStyle = trim; g.lineWidth = 4; g.stroke();
  gloss(g, 26, 24);
}

// a pendant on a cord; gem colour per charm
function charmIcon(g, gem, rim) {
  g.beginPath(); g.moveTo(14, 8); g.quadraticCurveTo(32, 30, 50, 8); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke();
  g.strokeStyle = '#b07a4c'; g.lineWidth = 2.5; g.stroke();
  shape(g, () => g.arc(32, 38, 17, 0, Math.PI * 2), rim);
  shape(g, () => { g.moveTo(32, 26); g.lineTo(43, 38); g.lineTo(32, 50); g.lineTo(21, 38); g.closePath(); }, gem, 2.5);
  gloss(g, 28, 34, 3, 2.5);
}

function staffIcon(g, wood, gem) {
  g.save(); g.translate(32, 32); g.rotate(Math.PI / 4);
  shape(g, () => g.roundRect(-3, -14, 6, 42, 3), wood, 2.5);
  shape(g, () => { g.moveTo(-8, -14); g.quadraticCurveTo(-10, -24, 0, -28); g.quadraticCurveTo(10, -24, 8, -14); g.closePath(); }, wood, 2.5);
  shape(g, () => g.arc(0, -21, 5, 0, Math.PI * 2), gem, 2);
  g.restore();
}

function potionIcon(g, col) {
  shape(g, () => g.roundRect(26, 8, 12, 12, 3), '#b07a4c', 3);
  shape(g, () => { g.moveTo(24, 20); g.lineTo(40, 20); g.lineTo(40, 26); g.quadraticCurveTo(54, 32, 52, 44); g.quadraticCurveTo(50, 56, 32, 56); g.quadraticCurveTo(14, 56, 12, 44); g.quadraticCurveTo(10, 32, 24, 26); g.closePath(); }, col);
  gloss(g, 22, 38, 4, 6);
}

function featherIcon(g, vane, rib) {
  shape(g, () => { g.moveTo(14, 54); g.quadraticCurveTo(12, 22, 48, 8); g.quadraticCurveTo(52, 34, 20, 52); g.closePath(); }, vane);
  g.beginPath(); g.moveTo(10, 58); g.quadraticCurveTo(26, 34, 46, 12); g.strokeStyle = rib; g.lineWidth = 3; g.stroke();
  for (const t of [0.35, 0.55, 0.75]) { g.beginPath(); g.moveTo(14 + t * 30, 50 - t * 38); g.lineTo(22 + t * 30, 44 - t * 34); g.strokeStyle = rib; g.lineWidth = 1.5; g.stroke(); }
}

// a lump of ore with glints of metal
function oreIcon(g, rock, glint) {
  shape(g, () => { g.moveTo(10, 44); g.lineTo(16, 22); g.lineTo(32, 12); g.lineTo(50, 18); g.lineTo(56, 38); g.lineTo(44, 54); g.lineTo(20, 54); g.closePath(); }, rock);
  for (const [x, y, r] of [[26, 26, 5], [40, 30, 4], [30, 42, 4.5], [46, 44, 3]]) {
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fillStyle = glint; g.fill();
  }
  gloss(g, 24, 20, 4, 2.5);
}

// a monster card: a gilded frame round a little portrait (a crowned head in the race's colour)
function cardIcon(g, face, crown) {
  shape(g, () => g.roundRect(14, 6, 36, 52, 4), '#f4ead0');
  shape(g, () => g.roundRect(18, 10, 28, 30, 2), '#7aa0c8', 2);
  shape(g, () => g.arc(32, 30, 8, 0, Math.PI * 2), face, 2);
  shape(g, () => { g.moveTo(24, 22); g.lineTo(24, 14); g.lineTo(28, 18); g.lineTo(32, 12); g.lineTo(36, 18); g.lineTo(40, 14); g.lineTo(40, 22); g.closePath(); }, crown, 2);
  for (const y of [46, 51]) { g.beginPath(); g.moveTo(20, y); g.lineTo(44, y); g.strokeStyle = '#b8a070'; g.lineWidth = 2; g.stroke(); }
  g.strokeStyle = '#e3b341'; g.lineWidth = 2; g.strokeRect(16.5, 8.5, 31, 47);
}

// skill icons: a coloured disc with a white symbol
function skillIcon(g, col, draw) {
  shape(g, () => g.arc(32, 32, 26, 0, Math.PI * 2), col);
  g.strokeStyle = g.fillStyle = '#fff4dc';
  g.lineWidth = 5;
  draw();
}

const PAINT = {
  gel: (g) => {
    shape(g, () => { g.moveTo(10, 50); g.bezierCurveTo(6, 26, 22, 14, 32, 14); g.bezierCurveTo(42, 14, 58, 26, 54, 50); g.quadraticCurveTo(32, 56, 10, 50); }, '#7fd05a');
    gloss(g, 24, 26, 7, 4.5);
  },
  dew: (g) => {
    shape(g, () => { g.moveTo(32, 8); g.bezierCurveTo(40, 22, 50, 30, 50, 40); g.arc(32, 40, 18, 0, Math.PI); g.bezierCurveTo(14, 30, 24, 22, 32, 8); }, '#6cc4ef');
    gloss(g, 25, 38, 4, 6);
  },
  seed: (g) => {
    shape(g, () => g.ellipse(32, 40, 15, 12, 0, 0, Math.PI * 2), '#b9874f');
    g.beginPath(); g.moveTo(32, 28); g.quadraticCurveTo(30, 18, 34, 12); g.strokeStyle = OUT; g.lineWidth = 6; g.stroke();
    g.strokeStyle = '#5fae45'; g.lineWidth = 3; g.stroke();
    shape(g, () => g.ellipse(42, 14, 8, 4, -0.4, 0, Math.PI * 2), '#7cc455', 2.5);
    gloss(g, 26, 36);
  },
  leaf: (g) => {
    shape(g, () => { g.moveTo(12, 52); g.quadraticCurveTo(10, 16, 52, 10); g.quadraticCurveTo(50, 50, 12, 52); }, '#6bbd4a');
    g.beginPath(); g.moveTo(14, 50); g.quadraticCurveTo(30, 34, 46, 16); g.strokeStyle = '#3f7a35'; g.lineWidth = 2.5; g.stroke();
  },
  shell: (g) => {
    shape(g, () => { g.moveTo(32, 52); g.lineTo(10, 26); g.quadraticCurveTo(32, 2, 54, 26); g.closePath(); }, '#f2a8a0');
    for (const a of [-0.6, -0.2, 0.2, 0.6]) {
      g.beginPath(); g.moveTo(32, 50); g.lineTo(32 + Math.sin(a) * 26, 50 - Math.cos(a) * 32); g.strokeStyle = '#c9726a'; g.lineWidth = 2; g.stroke();
    }
  },
  spore: (g) => {
    shape(g, () => g.roundRect(26, 32, 12, 22, 4), '#efe2c4', 3);
    shape(g, () => { g.moveTo(8, 36); g.quadraticCurveTo(32, -4, 56, 36); g.closePath(); }, '#8a64b8');
    for (const [x, y] of [[22, 26], [34, 20], [44, 28]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fillStyle = '#e0d2f5'; g.fill(); }
  },
  stone: (g) => {
    shape(g, () => { g.moveTo(12, 46); g.lineTo(20, 18); g.lineTo(40, 12); g.lineTo(54, 30); g.lineTo(46, 52); g.lineTo(22, 54); g.closePath(); }, '#a09a8e');
    g.beginPath(); g.moveTo(20, 20); g.lineTo(40, 14); g.lineTo(34, 34); g.closePath(); g.fillStyle = '#c4beb2'; g.fill();
  },
  glow: (g) => {
    const star = (x, y, r, col) => shape(g, () => {
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath();
    }, col, 2.5);
    star(28, 34, 18, '#ffe37a'); star(46, 18, 9, '#fff3b0'); star(48, 46, 7, '#ffd34a');
  },
  potion: (g) => potionIcon(g, '#e2554a'),
  potion2: (g) => potionIcon(g, '#f08a32'),
  potion3: (g) => potionIcon(g, '#f2cf3a'),
  tonic: (g) => potionIcon(g, '#4a8ce8'),
  quick: (g) => { potionIcon(g, '#a36ad8'); g.beginPath(); g.moveTo(34, 30); g.lineTo(27, 42); g.lineTo(33, 42); g.lineTo(29, 52); g.strokeStyle = '#fff4dc'; g.lineWidth = 3; g.stroke(); },
  berry: (g) => {
    for (const [x, y] of [[24, 40], [40, 40], [32, 28]]) { shape(g, () => g.arc(x, y, 11, 0, Math.PI * 2), '#d23a5a', 3); gloss(g, x - 4, y - 4, 3, 2.5); }
    shape(g, () => g.ellipse(40, 14, 9, 4.5, -0.5, 0, Math.PI * 2), '#6bbd4a', 2.5);
  },
  crableg: (g) => {
    shape(g, () => { g.moveTo(10, 50); g.lineTo(30, 30); g.lineTo(36, 36); g.lineTo(16, 56); g.closePath(); }, '#e86a4a');
    shape(g, () => { g.moveTo(30, 30); g.quadraticCurveTo(36, 8, 54, 10); g.quadraticCurveTo(50, 22, 40, 26); g.quadraticCurveTo(52, 26, 56, 34); g.quadraticCurveTo(40, 40, 36, 36); g.closePath(); }, '#f08a6a');
    gloss(g, 40, 18, 4, 2.5);
  },
  herb: (g) => {
    for (const a of [-0.9, 0, 0.9]) {
      g.save(); g.translate(32, 50); g.rotate(a);
      shape(g, () => { g.moveTo(0, 0); g.quadraticCurveTo(-12, -20, 0, -40); g.quadraticCurveTo(12, -20, 0, 0); }, '#5fae45', 3);
      g.restore();
    }
  },
  wander: (g) => featherIcon(g, '#9fd4ff', '#4a8ce8'),
  homeward: (g) => featherIcon(g, '#ffd27a', '#e08a3a'),
  weapon0: (g) => swordIcon(g, '#c49a63', '#8a5a33', '#a07848'),
  weapon1: (g) => swordIcon(g, '#cfd6de', '#7a7f8a', '#9aa4b2'),
  weapon2: (g) => swordIcon(g, '#ffb35a', '#c8463c', '#ffe27a'),
  weapon3: (g) => swordIcon(g, '#3a2a2a', '#e05a1a', '#ff9a3a'),
  weapon_horn: (g) => swordIcon(g, '#e8dcc0', '#6a6a72', '#fff4dc'),
  weapon_frost: (g) => swordIcon(g, '#cfeaff', '#4a7aa8', '#ffffff'),
  weapon_gale: (g) => swordIcon(g, '#e8f4c8', '#6a9a4a', '#fff27a'),
  weapon_iron: (g) => swordIcon(g, '#b8c0ca', '#4a4e58', '#e8eef5'),
  staff0: (g) => staffIcon(g, '#8a5a33', '#9fd4ff'),
  staff1: (g) => staffIcon(g, '#4a3a5a', '#c8a0ff'),
  r_gooey: (g) => charmIcon(g, '#7fd05a', '#c8f0a8'),
  r_bramble: (g) => {
    g.beginPath(); g.arc(32, 36, 16, 0, Math.PI * 2); g.strokeStyle = OUT; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#8a4a2a'; g.lineWidth = 6; g.stroke();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; shape(g, () => { g.moveTo(32 + Math.cos(a) * 19, 36 + Math.sin(a) * 19); g.lineTo(32 + Math.cos(a + 0.2) * 26, 36 + Math.sin(a + 0.2) * 26); g.lineTo(32 + Math.cos(a + 0.35) * 19, 36 + Math.sin(a + 0.35) * 19); }, '#c86a3a', 2); }
  },
  r_coral: (g) => {
    shape(g, () => g.arc(32, 32, 24, 0, Math.PI * 2), '#e86a7a');
    shape(g, () => g.arc(32, 32, 15, 0, Math.PI * 2), '#9fd4ff', 2.5);
    gloss(g, 24, 22, 5, 3);
  },
  r_hood: (g) => {
    shape(g, () => { g.moveTo(32, 6); g.quadraticCurveTo(54, 14, 52, 56); g.lineTo(12, 56); g.quadraticCurveTo(10, 14, 32, 6); g.closePath(); }, '#5a3a7a');
    shape(g, () => g.ellipse(32, 32, 11, 13, 0, 0, Math.PI * 2), '#2a1e34', 2.5);
  },
  r_ember: (g) => charmIcon(g, '#ff8a3a', '#3a2a2a'),
  armor_cinder: (g) => armorIcon(g, '#3a2a2a', '#ff8a3a'),
  armor_chain: (g) => armorIcon(g, '#9aa4b2', '#5a5e68'),
  armor_robe: (g) => armorIcon(g, '#3a5aa8', '#cfd6de'),
  shield_round: (g) => {
    shape(g, () => g.arc(32, 32, 24, 0, Math.PI * 2), '#b0743d');
    for (const x of [24, 40]) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 54); g.strokeStyle = '#7a4a26'; g.lineWidth = 2; g.stroke(); }
    shape(g, () => g.arc(32, 32, 7, 0, Math.PI * 2), '#8c8478', 2.5);
  },
  cape: (g) => {
    shape(g, () => { g.moveTo(20, 10); g.lineTo(44, 10); g.quadraticCurveTo(56, 34, 52, 56); g.lineTo(12, 56); g.quadraticCurveTo(8, 34, 20, 10); g.closePath(); }, '#8c8a86');
    shape(g, () => g.arc(32, 12, 4, 0, Math.PI * 2), '#e3b341', 2);
  },
  boots_leather: (g) => {
    shape(g, () => { g.moveTo(18, 10); g.lineTo(34, 10); g.lineTo(34, 40); g.lineTo(52, 44); g.quadraticCurveTo(56, 54, 48, 56); g.lineTo(14, 56); g.lineTo(18, 34); g.closePath(); }, '#6b4426');
    g.beginPath(); g.moveTo(18, 20); g.lineTo(34, 20); g.strokeStyle = '#3e2c20'; g.lineWidth = 4; g.stroke();
  },
  thorn: (g) => {
    g.beginPath(); g.moveTo(12, 54); g.quadraticCurveTo(30, 34, 52, 10); g.strokeStyle = OUT; g.lineWidth = 9; g.stroke();
    g.strokeStyle = '#8a4a2a'; g.lineWidth = 5; g.stroke();
    for (const t of [0.25, 0.45, 0.65, 0.85]) { const x = 12 + t * 40, y = 54 - t * 44; shape(g, () => { g.moveTo(x - 2, y); g.lineTo(x - 9, y - 7); g.lineTo(x + 2, y - 3); }, '#c86a3a', 2); }
  },
  salt: (g) => {
    shape(g, () => { g.moveTo(8, 52); g.quadraticCurveTo(32, 14, 56, 52); g.closePath(); }, '#f4f2ec');
    for (const [x, y] of [[24, 40], [34, 32], [40, 44], [30, 46]]) { g.beginPath(); g.rect(x, y, 4, 4); g.fillStyle = '#c8d4dc'; g.fill(); }
  },
  pearl: (g) => { shape(g, () => g.arc(32, 34, 18, 0, Math.PI * 2), '#e8f0f8'); gloss(g, 26, 28, 6, 4); g.beginPath(); g.arc(36, 40, 10, 0, 7); g.fillStyle = 'rgba(120,170,230,.3)'; g.fill(); },
  gloom: (g) => {
    shape(g, () => g.roundRect(26, 32, 12, 22, 4), '#c8b8d8', 3);
    shape(g, () => { g.moveTo(8, 36); g.quadraticCurveTo(32, -4, 56, 36); g.closePath(); }, '#4a2a6a');
    for (const [x, y] of [[22, 26], [34, 20], [44, 28]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fillStyle = '#b08aff'; g.fill(); }
  },
  shade: (g) => {
    shape(g, () => { g.moveTo(32, 6); g.lineTo(46, 30); g.lineTo(34, 58); g.lineTo(20, 30); g.closePath(); }, '#8a6ad8');
    g.beginPath(); g.moveTo(32, 10); g.lineTo(26, 30); g.lineTo(32, 50); g.fillStyle = '#c8b0ff'; g.fill();
  },
  cinder: (g) => {
    shape(g, () => { g.moveTo(10, 44); g.quadraticCurveTo(12, 14, 32, 12); g.quadraticCurveTo(52, 14, 54, 44); g.closePath(); }, '#3a2a2a');
    g.beginPath(); g.moveTo(32, 14); g.lineTo(32, 44); g.moveTo(20, 24); g.lineTo(26, 40); g.moveTo(44, 24); g.lineTo(38, 40); g.strokeStyle = '#ff8a3a'; g.lineWidth = 2.5; g.stroke();
  },
  ember_dust: (g) => {
    const star = (x, y, r, col) => shape(g, () => {
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath();
    }, col, 2.5);
    star(28, 34, 18, '#ff8a3a'); star(46, 18, 9, '#ffc06a'); star(48, 46, 7, '#ff6a1a');
  },
  skill_manawell: (g) => skillIcon(g, '#3a5aa8', () => { g.beginPath(); g.moveTo(32, 12); g.bezierCurveTo(42, 26, 48, 32, 48, 40); g.arc(32, 40, 16, 0, Math.PI); g.bezierCurveTo(16, 32, 22, 26, 32, 12); g.fill(); }),
  skill_spark: (g) => skillIcon(g, '#c8461a', () => { g.beginPath(); g.arc(38, 28, 9, 0, 7); g.fill(); for (const [y, w] of [[24, 14], [32, 18], [40, 10]]) { g.beginPath(); g.moveTo(10, y + 4); g.lineTo(10 + w, y); g.lineWidth = 3; g.stroke(); } }),
  skill_frost: (g) => skillIcon(g, '#3a8ac8', () => { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; g.beginPath(); g.moveTo(32 + Math.cos(a) * 18, 32 + Math.sin(a) * 18); g.lineTo(32 - Math.cos(a) * 18, 32 - Math.sin(a) * 18); g.lineWidth = 4; g.stroke(); } }),
  skill_arc: (g) => skillIcon(g, '#b89a1a', () => { g.beginPath(); g.moveTo(38, 10); g.lineTo(24, 34); g.lineTo(34, 34); g.lineTo(26, 54); g.lineTo(44, 28); g.lineTo(34, 28); g.closePath(); g.fill(); }),
  skill_flamering: (g) => skillIcon(g, '#d8541a', () => { g.beginPath(); g.arc(32, 32, 15, 0, 7); g.lineWidth = 5; g.stroke(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.beginPath(); g.arc(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, 3.5, 0, 7); g.fill(); } }),
  skill_ward: (g) => skillIcon(g, '#4a6ab8', () => { g.beginPath(); g.arc(32, 32, 16, 0, 7); g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(32, 20); g.lineTo(32, 44); g.moveTo(32, 26); g.lineTo(40, 20); g.moveTo(32, 32); g.lineTo(24, 26); g.lineWidth = 3.5; g.stroke(); }),
  skill_blink: (g) => skillIcon(g, '#7a5ab8', () => { g.beginPath(); g.arc(22, 34, 6, 0, 7); g.fill(); g.beginPath(); g.arc(44, 30, 8, 0, 7); g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(28, 33); g.lineTo(36, 31); g.setLineDash([3, 3]); g.stroke(); g.setLineDash([]); }),
  skill_swiftchant: (g) => skillIcon(g, '#5a7ac8', () => { g.beginPath(); g.arc(32, 32, 15, -Math.PI / 2, Math.PI); g.lineWidth = 4; g.stroke(); g.beginPath(); g.moveTo(32, 32); g.lineTo(32, 20); g.moveTo(32, 32); g.lineTo(40, 36); g.lineWidth = 3; g.stroke(); }),
  heartwood: (g) => { shape(g, () => g.roundRect(12, 20, 40, 26, 10), '#7a5232'); shape(g, () => g.ellipse(46, 33, 8, 13, 0, 0, Math.PI * 2), '#9fd060', 2.5); g.beginPath(); g.ellipse(46, 33, 3.5, 6, 0, 0, 7); g.strokeStyle = '#4a8a36'; g.lineWidth = 2; g.stroke(); },
  king_pearl: (g) => { shape(g, () => g.arc(32, 34, 20, 0, Math.PI * 2), '#f2cf6a'); gloss(g, 25, 27, 7, 5); },
  gloom_heart: (g) => { shape(g, () => { g.moveTo(32, 54); g.bezierCurveTo(4, 34, 14, 8, 32, 22); g.bezierCurveTo(50, 8, 60, 34, 32, 54); }, '#6a3a9a'); gloss(g, 22, 28, 4, 3); },
  cinder_core: (g) => { shape(g, () => g.arc(32, 32, 20, 0, Math.PI * 2), '#2a1e1e'); g.beginPath(); g.arc(32, 32, 10, 0, 7); g.fillStyle = '#ff8a3a'; g.fill(); g.beginPath(); g.arc(30, 30, 4, 0, 7); g.fillStyle = '#ffe27a'; g.fill(); },
  jarl_horn: (g) => shape(g, () => { g.moveTo(14, 54); g.quadraticCurveTo(10, 20, 48, 8); g.quadraticCurveTo(30, 26, 30, 56); g.closePath(); }, '#3a2a2a'),
  r_thorncloak: (g) => { shape(g, () => { g.moveTo(22, 10); g.lineTo(42, 10); g.quadraticCurveTo(54, 34, 52, 56); g.lineTo(12, 56); g.quadraticCurveTo(10, 34, 22, 10); g.closePath(); }, '#8a4a2a'); for (const [x, y] of [[24, 30], [38, 38], [28, 46], [40, 24]]) shape(g, () => { g.moveTo(x, y); g.lineTo(x + 5, y - 6); g.lineTo(x + 4, y + 2); }, '#c86a3a', 1.5); },
  r_jarlcloak: (g) => { shape(g, () => { g.moveTo(22, 10); g.lineTo(42, 10); g.quadraticCurveTo(54, 34, 52, 56); g.lineTo(12, 56); g.quadraticCurveTo(10, 34, 22, 10); g.closePath(); }, '#3a2a2a'); g.beginPath(); g.moveTo(20, 50); g.lineTo(28, 30); g.lineTo(34, 44); g.lineTo(42, 24); g.strokeStyle = '#ff8a3a'; g.lineWidth = 2.5; g.stroke(); },
  weapon_tide: (g) => swordIcon(g, '#8ac8ff', '#2a5a9a', '#e8f8ff'),
  weapon_cinder: (g) => swordIcon(g, '#2a1e1e', '#ff7a3a', '#ffb35a'),
  weapon_jarl: (g) => swordIcon(g, '#4a3a3a', '#ffd23a', '#ff6a1a'),
  staff2: (g) => staffIcon(g, '#5a3a7a', '#b08aff'),
  staff_birch: (g) => staffIcon(g, '#e8e4da', '#cfe8ff'),
  staff_frost: (g) => staffIcon(g, '#6a8aa8', '#e8f8ff'),
  staff_tide: (g) => staffIcon(g, '#8a7a5a', '#f2cf6a'),
  staff_ember: (g) => staffIcon(g, '#3a2a2a', '#ff8a3a'),
  staff_shade: (g) => staffIcon(g, '#2a1e34', '#c8a0ff'),
  staff_jarl: (g) => staffIcon(g, '#2a1e1e', '#ffd23a'),
  staff_runeking: (g) => staffIcon(g, '#3a5aa8', '#ffffff'),
  staff3: (g) => staffIcon(g, '#5a8a3a', '#d8ff9a'),
  boots_cinder: (g) => { shape(g, () => { g.moveTo(18, 10); g.lineTo(34, 10); g.lineTo(34, 40); g.lineTo(52, 44); g.quadraticCurveTo(56, 54, 48, 56); g.lineTo(14, 56); g.lineTo(18, 34); g.closePath(); }, '#2a1e1e'); g.beginPath(); g.moveTo(18, 20); g.lineTo(34, 20); g.strokeStyle = '#ff8a3a'; g.lineWidth = 4; g.stroke(); },
  armor_pearl: (g) => armorIcon(g, '#d8e4f0', '#f2cf6a'),
  armor_gloom: (g) => armorIcon(g, '#4a2a6a', '#b08aff'),
  r_prism: (g) => {
    const grd = g.createLinearGradient(14, 20, 50, 56); grd.addColorStop(0, '#ff9ab8'); grd.addColorStop(0.5, '#9fd4ff'); grd.addColorStop(1, '#b6ec8e');
    g.beginPath(); g.arc(32, 38, 16, 0, Math.PI * 2); g.strokeStyle = OUT; g.lineWidth = 10; g.stroke(); g.strokeStyle = grd; g.lineWidth = 6; g.stroke();
    shape(g, () => g.arc(32, 20, 7, 0, Math.PI * 2), '#e8f0f8', 2.5);
  },
  r_twin: (g) => { charmIcon(g, '#7fd05a', '#3a8ce8'); },
  coin: (g) => { shape(g, () => g.arc(32, 32, 20, 0, Math.PI * 2), '#e3b341'); shape(g, () => g.arc(32, 32, 13, 0, Math.PI * 2), '#f2cf3a', 2); gloss(g, 26, 26, 4, 3); },
  r_tide: (g) => charmIcon(g, '#3a8ce8', '#9fd4ff'),
  r_kobold: (g) => {
    g.beginPath(); g.ellipse(32, 38, 18, 14, 0, 0, Math.PI * 2); g.strokeStyle = OUT; g.lineWidth = 11; g.stroke();
    g.strokeStyle = '#f2c040'; g.lineWidth = 7; g.stroke();
    shape(g, () => { g.moveTo(22, 26); g.lineTo(22, 12); g.lineTo(27, 18); g.lineTo(32, 10); g.lineTo(37, 18); g.lineTo(42, 12); g.lineTo(42, 26); g.closePath(); }, '#f2c040', 2.5);
    shape(g, () => g.arc(32, 21, 3, 0, Math.PI * 2), '#d02a3a', 2);
  },
  r_goblin: (g) => {
    g.beginPath(); g.moveTo(10, 12); g.quadraticCurveTo(32, 46, 54, 12); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#8a5a33'; g.lineWidth = 2.5; g.stroke();
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7, x = 10 + 44 * t, y = 12 + 34 * 4 * t * (1 - t) * 0.5 + 2;
      shape(g, () => { g.moveTo(x - 3.5, y); g.lineTo(x + 3.5, y); g.lineTo(x, y + 12 + (i === 3 ? 6 : 0)); g.closePath(); }, '#efe6cc', 2);
    }
  },
  card_kobold: (g) => cardIcon(g, '#8a5a32', '#f2c040'),
  card_goblin: (g) => cardIcon(g, '#5f9a45', '#efe6cc'),
  card_jarl: (g) => cardIcon(g, '#c8502a', '#3a3a42'),
  card_sprout: (g) => cardIcon(g, '#ff9a6a', '#5fae45'),
  card_crab: (g) => cardIcon(g, '#8ab8ff', '#f2a8a0'),
  card_mushroom: (g) => cardIcon(g, '#9a7cff', '#efe2c4'),
  card_beetle: (g) => cardIcon(g, '#ff7a4a', '#6a6a72'),
  kobold_fur: (g) => {
    for (const [x, y, a] of [[24, 40, -0.5], [32, 36, 0], [40, 40, 0.5]]) shape(g, () => g.ellipse(x, y, 7, 18, a, 0, Math.PI * 2), '#9a6a3c', 3);
    for (const [x, y] of [[26, 30], [34, 26]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 14); g.strokeStyle = '#c49260'; g.lineWidth = 2; g.stroke(); }
  },
  goblin_tooth: (g) => {
    shape(g, () => { g.moveTo(20, 14); g.quadraticCurveTo(32, 8, 44, 14); g.quadraticCurveTo(44, 30, 36, 44); g.quadraticCurveTo(30, 54, 24, 58); g.quadraticCurveTo(26, 40, 20, 14); }, '#efe2b8');
    g.beginPath(); g.moveTo(22, 18); g.quadraticCurveTo(32, 14, 42, 18); g.strokeStyle = '#b8a070'; g.lineWidth = 2.5; g.stroke();
    gloss(g, 30, 24, 3, 6);
  },
  iron_ore: (g) => oreIcon(g, '#8a7466', '#c86a3a'),
  steel_ore: (g) => oreIcon(g, '#5a6070', '#7ab0e8'),
  hard_ore: (g) => oreIcon(g, '#4a4a58', '#e8eef8'),
  armor_ore: (g) => oreIcon(g, '#6a6a62', '#c8c8b8'),
  r_seed: (g) => {
    g.beginPath(); g.ellipse(32, 36, 20, 14, 0, 0, Math.PI * 2); g.strokeStyle = OUT; g.lineWidth = 9; g.stroke();
    g.strokeStyle = '#5fae45'; g.lineWidth = 5; g.stroke();
    for (const [x, y] of [[14, 30], [32, 22], [50, 30]]) shape(g, () => g.ellipse(x, y, 6, 3.5, -0.4, 0, Math.PI * 2), '#8fd060', 2);
  },
  r_buckler: (g) => {
    shape(g, () => g.arc(32, 32, 24, 0, Math.PI * 2), '#c9726a');
    shape(g, () => g.arc(32, 32, 16, 0, Math.PI * 2), '#f2a8a0', 2.5);
    shape(g, () => g.arc(32, 32, 6, 0, Math.PI * 2), '#8c8478', 2.5);
    gloss(g, 24, 22, 5, 3);
  },
  r_cloak: (g) => {
    shape(g, () => { g.moveTo(22, 10); g.lineTo(42, 10); g.quadraticCurveTo(54, 34, 52, 56); g.lineTo(12, 56); g.quadraticCurveTo(10, 34, 22, 10); g.closePath(); }, '#8a64b8');
    for (const [x, y] of [[24, 30], [38, 38], [28, 46]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fillStyle = '#e0d2f5'; g.fill(); }
    shape(g, () => g.rect(20, 8, 24, 6), '#efe2c4', 2.5);
  },
  r_pebble: (g) => {
    g.beginPath(); g.arc(32, 38, 16, 0, Math.PI * 2); g.strokeStyle = OUT; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#a09a8e'; g.lineWidth = 6; g.stroke();
    shape(g, () => { g.moveTo(24, 22); g.lineTo(32, 10); g.lineTo(40, 22); g.closePath(); }, '#c4beb2', 2.5);
  },
  r_lantern: (g) => {
    shape(g, () => g.roundRect(18, 16, 28, 36, 6), '#3a3a42');
    shape(g, () => g.roundRect(23, 21, 18, 26, 4), '#ffe37a', 2);
    g.beginPath(); g.arc(32, 34, 5, 0, 7); g.fillStyle = '#fff8d0'; g.fill();
    g.beginPath(); g.moveTo(26, 16); g.quadraticCurveTo(32, 4, 38, 16); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
  },
  shiny_gel: (g) => {
    const grd = g.createLinearGradient(10, 14, 54, 52);
    grd.addColorStop(0, '#ff9ab8'); grd.addColorStop(0.5, '#9fd4ff'); grd.addColorStop(1, '#b6ec8e');
    shape(g, () => { g.moveTo(10, 50); g.bezierCurveTo(6, 26, 22, 14, 32, 14); g.bezierCurveTo(42, 14, 58, 26, 54, 50); g.quadraticCurveTo(32, 56, 10, 50); }, grd);
    gloss(g, 24, 26, 7, 4.5);
  },
  crown: (g) => {
    shape(g, () => { g.moveTo(12, 46); g.lineTo(12, 24); g.lineTo(22, 34); g.lineTo(32, 16); g.lineTo(42, 34); g.lineTo(52, 24); g.lineTo(52, 46); g.closePath(); }, '#6a6a72');
    for (const x of [22, 32, 42]) { shape(g, () => g.arc(x, 40, 3.5, 0, Math.PI * 2), '#ff8a3a', 2); }
    shape(g, () => { g.moveTo(12, 26); g.quadraticCurveTo(2, 16, 6, 6); g.quadraticCurveTo(14, 14, 16, 28); }, '#e8e0cc', 2.5);
    shape(g, () => { g.moveTo(52, 26); g.quadraticCurveTo(62, 16, 58, 6); g.quadraticCurveTo(50, 14, 48, 28); }, '#e8e0cc', 2.5);
  },
  ember_heart: (g) => {
    shape(g, () => { g.moveTo(32, 54); g.bezierCurveTo(4, 34, 14, 8, 32, 22); g.bezierCurveTo(50, 8, 60, 34, 32, 54); }, '#d8401a');
    g.beginPath(); g.moveTo(26, 30); g.lineTo(32, 38); g.lineTo(28, 46); g.strokeStyle = '#ffd23a'; g.lineWidth = 2.5; g.stroke();
    gloss(g, 22, 28, 4, 3);
  },
  armor0: (g) => armorIcon(g, '#4a78b5', '#6b4426'),
  armor1: (g) => armorIcon(g, '#6bbd4a', '#3f7a35'),
  armor2: (g) => armorIcon(g, '#f2a8a0', '#c9726a'),
  armor3: (g) => armorIcon(g, '#8c8478', '#e3b341'),
  torch: (g) => {
    shape(g, () => { g.moveTo(26, 30); g.lineTo(38, 30); g.lineTo(35, 58); g.lineTo(29, 58); g.closePath(); }, '#8a5a33');
    shape(g, () => { g.moveTo(22, 30); g.quadraticCurveTo(20, 16, 32, 4); g.quadraticCurveTo(44, 16, 42, 30); g.closePath(); }, '#f59a2b');
    g.beginPath(); g.moveTo(27, 28); g.quadraticCurveTo(27, 18, 32, 12); g.quadraticCurveTo(37, 18, 37, 28); g.fillStyle = '#ffe27a'; g.fill();
  },
  skill_lore: (g) => skillIcon(g, '#7a8a9a', () => { g.beginPath(); g.moveTo(32, 14); g.lineTo(40, 32); g.lineTo(32, 50); g.lineTo(24, 32); g.closePath(); g.stroke(); g.beginPath(); g.arc(32, 32, 3, 0, 7); g.fill(); }),
  skill_rest: (g) => skillIcon(g, '#6b8a5a', () => { g.beginPath(); g.arc(28, 20, 6, 0, 7); g.fill(); g.beginPath(); g.moveTo(28, 27); g.lineTo(30, 40); g.lineTo(44, 40); g.lineTo(44, 50); g.stroke(); }),
  skill_mend: (g) => skillIcon(g, '#c8463c', () => { g.save(); g.translate(32, 32); g.rotate(-0.6); g.fillRect(-14, -6, 28, 12); g.restore(); g.fillStyle = '#c8463c'; g.beginPath(); g.arc(32, 32, 3, 0, 7); g.fill(); }),
  skill_secondwind: (g) => skillIcon(g, '#4aa88a', () => { for (const y of [22, 32, 42]) { g.beginPath(); g.moveTo(14, y); g.quadraticCurveTo(32, y - 8, 50, y); g.stroke(); } }),
  skill_stone: (g) => skillIcon(g, '#8a7a6a', () => { g.beginPath(); g.ellipse(38, 36, 9, 7, 0.3, 0, 7); g.fill(); for (const [y, w] of [[26, 12], [34, 16], [42, 10]]) { g.beginPath(); g.moveTo(10, y); g.lineTo(10 + w, y); g.lineWidth = 3; g.stroke(); } }),
  skill_hush: (g) => skillIcon(g, '#5a5a7a', () => { g.beginPath(); g.moveTo(22, 32); g.lineTo(42, 32); g.stroke(); g.beginPath(); g.moveTo(32, 18); g.lineTo(32, 46); g.lineWidth = 3; g.stroke(); }),
  skill_quickfeet: (g) => skillIcon(g, '#4a90d8', () => { g.beginPath(); g.moveTo(20, 46); g.lineTo(30, 18); g.lineTo(36, 32); g.lineTo(46, 22); g.stroke(); }),
  skill_thrust: (g) => skillIcon(g, '#6a7a9a', () => { g.beginPath(); g.moveTo(14, 32); g.lineTo(50, 32); g.lineWidth = 5; g.stroke(); g.beginPath(); g.moveTo(42, 24); g.lineTo(52, 32); g.lineTo(42, 40); g.stroke(); }),
  skill_guard: (g) => skillIcon(g, '#7a6a4a', () => { g.beginPath(); g.moveTo(16, 46); g.lineTo(46, 16); g.lineWidth = 5; g.stroke(); g.beginPath(); g.moveTo(22, 22); g.lineTo(30, 30); g.stroke(); }),
  skill_discipline: (g) => skillIcon(g, '#5a6a8a', () => { g.beginPath(); g.moveTo(18, 46); g.lineTo(46, 18); g.stroke(); g.beginPath(); g.moveTo(16, 34); g.lineTo(30, 48); g.stroke(); }),
  skill_ironhide: (g) => skillIcon(g, '#6a7480', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(50, 20); g.quadraticCurveTo(48, 42, 32, 52); g.quadraticCurveTo(16, 42, 14, 20); g.closePath(); g.fill(); }),
  skill_cleave: (g) => skillIcon(g, '#c86a2a', () => { g.beginPath(); g.arc(32, 40, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.moveTo(46, 22); g.lineTo(52, 30); g.lineTo(42, 30); g.closePath(); g.fill(); }),
  skill_rend: (g) => skillIcon(g, '#a83a2a', () => { for (const dx of [-8, 0, 8]) { g.beginPath(); g.moveTo(26 + dx, 16); g.lineTo(38 + dx, 48); g.lineWidth = 4; g.stroke(); } }),
  skill_warcry: (g) => skillIcon(g, '#b03a4a', () => { for (const r of [8, 14, 20]) { g.beginPath(); g.arc(22, 32, r, -0.7, 0.7); g.lineWidth = 3.5; g.stroke(); } }),
  skill_standfirm: (g) => skillIcon(g, '#8a7a3a', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(50, 20); g.quadraticCurveTo(48, 42, 32, 52); g.quadraticCurveTo(16, 42, 14, 20); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(32, 22); g.lineTo(32, 42); g.stroke(); }),
  skill_earthsplit: (g) => skillIcon(g, '#8a5a2a', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(28, 26); g.lineTo(36, 34); g.lineTo(26, 52); g.lineWidth = 4; g.stroke(); g.beginPath(); g.moveTo(14, 46); g.lineTo(50, 46); g.stroke(); }),
  skill_rhythm: (g) => skillIcon(g, '#3a7aa0', () => { g.beginPath(); g.moveTo(10, 34); g.lineTo(20, 34); g.lineTo(26, 18); g.lineTo(34, 48); g.lineTo(40, 30); g.lineTo(54, 30); g.lineWidth = 4; g.stroke(); }),
  skill_laststand: (g) => skillIcon(g, '#a01a1a', () => { g.beginPath(); g.moveTo(32, 12); g.lineTo(32, 40); g.lineWidth = 6; g.stroke(); g.beginPath(); g.arc(32, 48, 3.5, 0, 7); g.fill(); }),
  talk: (g) => {
    shape(g, () => { g.roundRect(6, 8, 52, 36, 12); g.moveTo(18, 42); g.lineTo(14, 56); g.lineTo(30, 43); }, '#fff4dc');
    for (const x of [20, 32, 44]) { g.beginPath(); g.arc(x, 26, 3.5, 0, Math.PI * 2); g.fillStyle = OUT; g.fill(); }
  },
  charm_sprout: (g) => charmIcon(g, '#7cc455', '#e3b341'),
  charm_spore: (g) => charmIcon(g, '#a383d6', '#e3b341'),
  charm_shell: (g) => charmIcon(g, '#f2a8a0', '#cfd6de'),
  charm_glow: (g) => charmIcon(g, '#ffe37a', '#cfd6de'),
  boots: (g) => {
    shape(g, () => { g.moveTo(18, 10); g.lineTo(34, 10); g.lineTo(34, 40); g.lineTo(52, 44); g.quadraticCurveTo(56, 54, 48, 56); g.lineTo(14, 56); g.lineTo(18, 34); g.closePath(); }, '#8a5a33');
    g.beginPath(); g.moveTo(18, 20); g.lineTo(34, 20); g.strokeStyle = '#6cc4ef'; g.lineWidth = 4; g.stroke();
    shape(g, () => { g.moveTo(12, 24); g.lineTo(4, 18); g.lineTo(6, 30); g.closePath(); }, '#ffffff', 2);
  },
};

const cache = {};
export function iconCanvas(id) {
  if (!cache[id] || cache[id].pending) {
    const { c, g } = mk();
    if (ITEMS[id]?.slot === 'head' || ITEMS[id]?.slot === 'face') { headgearIcon(g, baseOf(id)); c.pending = !headgearReady(baseOf(id)); }
    else (PAINT[ITEMS[id]?.icon || id] || PAINT.gel)(g);
    cache[id] = c;
  }
  return cache[id];
}

const urls = {};
export function iconURL(id) {
  if (urls[id]) return urls[id];
  const c = iconCanvas(id), u = c.toDataURL();
  if (!c.pending) urls[id] = u; // headgear art still loading: draw it again next time
  return u;
}

const texes = {};
export function iconTexture(id) {
  if (!texes[id]) {
    const t = new THREE.CanvasTexture(iconCanvas(id));
    t.colorSpace = THREE.SRGBColorSpace;
    texes[id] = t;
  }
  return texes[id];
}
