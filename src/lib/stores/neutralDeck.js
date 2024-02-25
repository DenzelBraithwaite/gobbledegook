import { writable } from 'svelte/store';

// TODO: need to make more so there's lower chance of game crashing if all are drawn turn one.
const neutralDeck = writable([
  'echo',
  'echo',
  'echo',
  'switcharoo',
  'switcharoo',
  'ticktock',
  'ticktock',
  'ticktock',
  'vision',
  'vision',
  'xenoBloom',
]);

export default neutralDeck;