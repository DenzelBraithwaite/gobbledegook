import { writable } from 'svelte/store';

// TODO:
// 🐛Boost that removes a race from the game (draw pile) Eradicate, 1 in deck.
// 🐛Boost that lets you pick next race card, 1 in deck 
// 🐛 some other kind of a charge for goblins, elves and dwarves +1 each turn *2 in deck
// 🐛 Beasts worth +5 each? *2 i ndeck
const boostDeck = writable([
  'chastity',
  'rejuvenate',
  'rejuvenate',
  'charge',
  'charge',
  'dwarvenCall',
  'dwarvenCall',
  // 'growth',
  // 'growth',
  // 'feast',
  // 'feast',
  // 'eradicate',
  // 'gaze'
]);

export default boostDeck;