// @ts-ignore
import { writable } from 'svelte/store';

// 3 total (since egg grows into 3 versions)
const xenoEggDeck = writable([
  'drainite',
  'xerandium',
  'sporax',
  'growingXeno',
  'xenoEgg'
]);

export default xenoEggDeck;