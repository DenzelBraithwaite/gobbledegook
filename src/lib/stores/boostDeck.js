import { writable } from 'svelte/store';

// TODO:
const boostDeck = writable([
  'chastity',
  'rejuvenate',
  'rejuvenate',
  'charge',
  'charge',
  'dwarvenCall',
  'dwarvenCall',
  'growth',
  'growth', 
  'feast',
  'feast'
  // 'eradicate', 🐛 Boost that removes a race from the game (draw pile) Eradicate, 1 in deck.
  // 'gaze' 🐛Boost that lets you pick next race card, 1 in deck 
]);

export default boostDeck;