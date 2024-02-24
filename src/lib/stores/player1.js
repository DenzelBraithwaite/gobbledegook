// @ts-ignore
import { writable } from 'svelte/store';

const player1 = writable({
  id: undefined,
  title: 'Player 1',
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
  playedFirst: false,
  playingTwice: false,
  turn: false,
  dwarfNextTurn: false,
  drewWarchief: false,
  goblinLordMarked: false,
  hand: [],
  startingHand: [],
  cardsDrawn: [],
  discards: [],
  boosts: [],
  traps: [],
  neutrals: [],
  chargeDrawnTurns: [],
  infectDrawnTurns: [],
  hasChastity: false,
  hasCorruption: false,
  hasVision: false,
  chargePoints: 0,
  infectPoints: 0,
});

export default player1;