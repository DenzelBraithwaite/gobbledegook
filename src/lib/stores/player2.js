// @ts-ignore
import { writable } from 'svelte/store';

export const player2 = writable({
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
  hasChastity: false,
  hasCorruption: false,
  hasVision: false,
  isExposed: false,
  chargeDrawnTurns: [],
  infectDrawnTurns: [],
  chargePoints: 0,
  infectPoints: 0,
});

export const player2Reset = writable({
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
  hasChastity: false,
  hasCorruption: false,
  hasVision: false,
  isExposed: false,
  chargeDrawnTurns: [],
  infectDrawnTurns: [],
  chargePoints: 0,
  infectPoints: 0,
});