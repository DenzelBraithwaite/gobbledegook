// @ts-ignore
import { writable } from 'svelte/store';

const player2 = writable({
  id: undefined,
  title: 'Player 2',
  points: {
    beasts: 0,
    bots: 0,
    dwarves: 0,
    elves: 0,
    humans: 0,
    goblins: 0,
    xenos: 0,
  },
  highestPoints: 0,
  justWon: false,
  wins: 0,
  losses: 0,
  draws: 0,
  dwarfNextTurn: false,
  goblinLordMarked: false,
  turn: false,
  hand: [],
  discards: []
});

export default player2;