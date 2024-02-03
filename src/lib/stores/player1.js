// @ts-ignore
import { writable } from 'svelte/store';

const player1 = writable({
  title: 'Player 1',
  points: 0,
  justWon: false,
  wins: 0,
  losses: 0,
  draws: 0,
  turn: false,
  dwarfNextTurn: false,
  hacked: false,
  hand: [],
  discards: []
});

export default player1;