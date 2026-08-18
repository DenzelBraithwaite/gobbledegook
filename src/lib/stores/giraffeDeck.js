// @ts-ignore
import { writable } from 'svelte/store';

// 2 total (since egg grows into 1)
const giraffeDeck = writable([
  'nightTerror',
  'elderGiraffe',
  'adultGiraffe',
  'kidGiraffe'
  // 'eggGiraffe' // technically in beast
]);

export default giraffeDeck;