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
