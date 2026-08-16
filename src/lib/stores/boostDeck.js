import { writable } from 'svelte/store';

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
  // 'gaze' 🐛 Boost that lets you pick next race card, 1 in deck 
  // 'Cookie Jar' 🐛 Boost that gives +50 points to all races if card is in hand and no race cards in hand. Jackpot? Cookie jar? :)
]);

export default boostDeck;