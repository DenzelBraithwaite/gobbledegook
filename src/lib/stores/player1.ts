import { writable } from 'svelte/store';

export const player1 = writable<Player>({
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
  wins: 0,
  losses: 0,
  draws: 0,
  playedFirst: false,
  playingTwice: false,
  turn: false,
  giraffeCounter: 0,
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
  neutralizedCards: [],
  chargeDrawnTurns: [],
  growthDrawnTurns: [],
  infectDrawnTurns: [],
  hasChastity: false,
  hasCorruption: false,
  hasVision: false,
  isExposed: false,
  chargePoints: 0,
  growthPoints: 0,
  infectPoints: 0,
});

export const player1Reset = writable<Player>({
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
  wins: 0,
  losses: 0,
  draws: 0,
  playedFirst: false,
  playingTwice: false,
  turn: false,
  giraffeCounter: 0,
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
  neutralizedCards: [],
  chargeDrawnTurns: [],
  growthDrawnTurns: [],
  infectDrawnTurns: [],
  hasChastity: false,
  hasCorruption: false,
  hasVision: false,
  isExposed: false,
  chargePoints: 0,
  growthPoints: 0,
  infectPoints: 0,
});

export type Player = {
  id: undefined | string; // Used to confirm who user is playing as
  title: string; // For UI, no logic attached.
  points: {
    beasts: number;
    bots: number;
    dwarves: number;
    elves: number;
    humans: number;
    goblins: number;
    xenos: number;
  },
  highestPoints: number; // Determines winner
  wins: number;
  losses: number;
  draws: number;
  playedFirst: boolean; // Relevant for keeping track of turn count.
  playingTwice: boolean; // Echo card which allows player to draw multiple.
  turn: boolean; // Is it the player's turn.
  giraffeCounter: number; // Counts how many giraffes player has picked up.
  dwarfNextTurn: boolean; // Determines if player's next card will be a dwarf.
  drewWarchief: boolean; // Player next card will be goblin mark if available.
  goblinLordMarked: boolean; // Player next card will be goblin lord if available.
  hand: string[]; // Current cards in player's hand.
  startingHand: string[]; // For end game results, shows starting hand.
  cardsDrawn: string[]; // For end game results, shows log of all cards drawn.
  discards: string[]; // For end game results, shows log of all cards discarded.
  boosts: string[]; // Log of all boosts in effect (other cards may clear this e.g. corruption).
  traps: string[]; // Log of all traps in effect (other cards may clear this e.g. chastity).
  neutrals: string[]; // Log of all neutrals in effect (other cards may clear this e.g. neutralize).
  neutralizedCards: string[]; // Logs all neutralized cards since they disappear from other logs.
  chargeDrawnTurns: number[]; // Logs the exact turn each charge card was drawn.
  growthDrawnTurns: number[]; // Logs the exact turn each growth card was drawn.
  infectDrawnTurns: number[]; // Logs the exact turn each infect card was drawn.
  hasChastity: boolean; // If dealt turn 1 or drawn, marks player. Blocks all traps unless neutralized.
  hasCorruption: boolean; // If dealt turn 1 or drawn, marks player. Blocks all boosts unless neutralized.
  hasVision: boolean; // When player draws vision, they briefly can see enemy cards.
  isExposed: boolean; // When player draws exposed, enemy can see their cards until next player card drawn.
  chargePoints: number; // Total num of charge points (for humans and bots).
  growthPoints: number; // Total num of growth points (for goblins, elves and dwarves).
  infectPoints: number; // Total num of infect points (excludes bots).
};