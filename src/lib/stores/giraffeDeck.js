// @ts-ignore
import { writable } from 'svelte/store';

const giraffeDeck = writable([
  'nightTerror',
  'elderGiraffe',
  'adultGiraffe',
  'kidGiraffe'
  // 'eggGiraffe' // technically in beast
]);

export default giraffeDeck;