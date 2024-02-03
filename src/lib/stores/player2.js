// @ts-ignore
import { writable } from 'svelte/store';

const player2 = writable({
  title: 'Player 2',
  points: 0,
  justWon: false,
  wins: 0,
  losses: 0,
  draws: 0,
  dwarfNextTurn: false,
  hacked: false,
  turn: false,
  hand: [],
  discards: []
});

export default player2;