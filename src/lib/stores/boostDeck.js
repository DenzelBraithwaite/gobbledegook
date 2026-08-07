import { writable } from 'svelte/store';

// TODO: add 4 more boosts (maybe a new type, or 2 new ones? ;)
const boostDeck = writable([
  'chastity',
  'rejuvenate',
  'rejuvenate',
  'charge',
  'charge',
  'dwarvenCall',
  'dwarvenCall'
]);

export default boostDeck;