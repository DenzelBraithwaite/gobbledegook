import { writable } from 'svelte/store';

// TODO: need to make more so there's lower chance of game crashing if all are drawn turn one.
const neutralDeck = writable([
  'neutralize',
  'echo',
  'echo',
  'echo',
  'switcharoo',
  'ticktock',
  'ticktock',
  'ticktock',
  'vision',
  'vision',
  'xenoBloom',
  'xenoBloom'
]);

export default neutralDeck;