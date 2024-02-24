import { writable } from 'svelte/store';

// TODO: need to make more so there's lower chance of game crashing if all are drawn turn one.
const neutralDeck = writable([
  'echo',
  'echo',
  'switcharoo',
  'ticktock',
  'ticktock',
  'vision',
  'vision',
]);

export default neutralDeck;