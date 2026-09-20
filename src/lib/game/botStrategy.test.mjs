import test from 'node:test';
import assert from 'node:assert/strict';
import { ageOpponentHandMemory, chooseBotDiscard, createBotMemory, decideBotDeclaration, evaluateBotPaths, getBotEchoAction, rememberBotDecision, rememberOpponentHand } from './botStrategy.ts';

const details = {
  goblinLord: { race: 'goblin', otherRaces: [] },
  troll: { race: 'goblin', otherRaces: [] },
  shaman: { race: 'goblin', otherRaces: [] },
  hobgoblin: { race: 'goblin', otherRaces: [] },
  emperor: { race: 'human', otherRaces: [] },
  knight: { race: 'human', otherRaces: [] },
  ai: { race: 'bot', otherRaces: [] },
  protectron: { race: 'bot', otherRaces: [] },
  android: { race: 'bot', otherRaces: [] },
  neutralize: { race: 'neutral', otherRaces: [] }
};

// ai generated: This small scorer keeps these tests focused on strategy behavior instead of duplicating production scoring.
const score = hand => {
  const goblins = hand.filter(card => details[card]?.race === 'goblin').length * 10;
  const humans = hand.filter(card => details[card]?.race === 'human').length * 8;
  const bots = hand.filter(card => details[card]?.race === 'bot').length * 11;
  return {
    highestPoints: Math.max(goblins, humans, bots),
    points: { humans, goblins, elves: 0, dwarves: 0, beasts: 0, bots, xenos: 0, spirits: 0 }
  };
};

function observation(overrides = {}) {
  return {
    hand: ['troll', 'shaman', 'hobgoblin', 'knight', 'emperor'],
    turnCount: 20,
    activeDecks: ['humans', 'goblins', 'bots', 'neutrals'],
    unseenCards: ['goblinLord', 'troll', 'protectron', 'android', 'neutralize', 'knight'],
    knownOpponentCards: [],
    rememberedOpponentCards: [],
    opponentMemoryAge: null,
    opponentMemorySource: '',
    boosts: [],
    traps: [],
    boostsBlocked: false,
    trapsBlocked: false,
    neutralizePossiblyAvailable: true,
    cardDetails: details,
    ...overrides
  };
}

test('keeps a concentrated goblin route and discards the weaker off-race card', () => {
  const decision = chooseBotDiscard(observation(), score, () => 0.5);
  assert.equal(decision.cardTitle, 'knight');
  assert.equal(decision.path.race, 'goblins');
});

test('lowers the bot path when the opposing A.I. is known', () => {
  const safe = evaluateBotPaths(observation({ hand: ['protectron', 'android'] }), score)
    .find(path => path.race === 'bots');
  const threatened = evaluateBotPaths(observation({ hand: ['protectron', 'android'], knownOpponentCards: ['ai'] }), score)
    .find(path => path.race === 'bots');
  assert.ok(safe && threatened);
  assert.ok(threatened.utility < safe.utility);
  assert.equal(threatened.risk, Math.max(16, threatened.currentPoints * 0.8));
});

test('explains blocked boosts and the chance that Neutralize can restore them', () => {
  const path = evaluateBotPaths(observation({ boostsBlocked: true }), score)[0];
  assert.match(path.explanation, /boosts are blocked/);
  assert.match(path.explanation, /Neutralize recovery/);
});

test('declares with a safely dominant score after turn 15', () => {
  const powerful = hand => ({
    highestPoints: hand.length * 30,
    points: { humans: hand.length * 30, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const weakOpponent = hand => ({
    highestPoints: hand.length * 2,
    points: { humans: hand.length * 2, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const decision = decideBotDeclaration(observation(), powerful, weakOpponent, () => 0.25, 40);
  assert.equal(decision.declare, true);
  assert.equal(decision.estimatedWinChance, 1);
});

test('never declares before the game threshold', () => {
  const decision = decideBotDeclaration(observation({ turnCount: 14 }), score, score, () => 0.5, 20);
  assert.equal(decision.declare, false);
  assert.equal(decision.sampledGames, 0);
});

test('declaration samples apply opposing A.I. theft to the bot score', () => {
  const winningBot = () => ({
    highestPoints: 80,
    points: { humans: 0, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 80, xenos: 0, spirits: 0 }
  });
  const weakerOpponent = () => ({
    highestPoints: 40,
    points: { humans: 40, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const withAiRisk = hand => ({ botScore: hand.includes('ai') ? 0 : 80, opponentScore: 40 });
  const riskyObservation = observation({
    unseenCards: ['ai', 'knight', 'knight', 'troll', 'shaman', 'hobgoblin', 'protectron']
  });
  const decision = decideBotDeclaration(riskyObservation, winningBot, weakerOpponent, () => 0, 20, withAiRisk);
  assert.equal(decision.declare, false);
  assert.equal(decision.estimatedWinChance, 0);
});

test('draws at six and only forces the active Echo discard after reaching seven cards', () => {
  assert.equal(getBotEchoAction(['troll', 'echo', 'knight', 'emperor', 'ai', 'shaman'], true), 'draw');
  assert.equal(getBotEchoAction(['troll', 'echo', 'knight', 'emperor', 'ai', 'shaman', 'hobgoblin'], true), 'discard-echo');
  assert.equal(getBotEchoAction(['troll', 'echo', 'knight', 'emperor', 'ai', 'shaman', 'hobgoblin'], false), null);
  assert.equal(getBotEchoAction(['troll', 'knight', 'emperor', 'ai', 'shaman', 'hobgoblin', 'goblinLord'], true), null);
});

test('keeps Spirit King, Vision, Exposed, and Gaze knowledge through later discard decisions', () => {
  const decision = chooseBotDiscard(observation(), score, () => 0.5);
  for (const source of ['spiritKing', 'vision', 'exposed', 'gaze']) {
    const remembered = rememberOpponentHand(createBotMemory(), ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'knight'], 8, source);
    const updated = rememberBotDecision(remembered, decision);
    assert.deepEqual(updated.opponentHandSnapshot, remembered.opponentHandSnapshot);
    assert.equal(updated.opponentHandObservedAtTurn, 8);
    assert.equal(updated.opponentHandSource, source);
    assert.equal(ageOpponentHandMemory(updated).opponentHandAge, 1);
  }
});

test('an aging remembered leader prevents confidence against a previously strong hand', () => {
  const botThirty = () => ({
    highestPoints: 30,
    points: { humans: 0, goblins: 30, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const rememberedThreat = hand => ({
    botScore: 30,
    opponentScore: hand.includes('goblinLord') ? 60 : score(hand).highestPoints
  });
  const threatened = observation({
    turnCount: 15,
    unseenCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'knight', 'android', 'protectron', 'neutralize'],
    rememberedOpponentCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'knight'],
    opponentMemoryAge: 7,
    opponentMemorySource: 'vision'
  });
  const decision = decideBotDeclaration(threatened, botThirty, score, () => 0.5, 80, rememberedThreat);
  assert.equal(decision.declare, false);
  assert.ok(decision.estimatedWinChance < 0.8);
  assert.match(decision.explanation, /vision memory from 7 turn/);
});

test('turn-15 hidden-hand samples assume some human race synergy', () => {
  const botThirty = () => ({
    highestPoints: 30,
    points: { humans: 0, goblins: 30, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const synergizedOpponent = hand => ({ botScore: 30, opponentScore: score(hand).highestPoints });
  const decision = decideBotDeclaration(observation({
    turnCount: 15,
    unseenCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'troll', 'shaman', 'knight', 'emperor', 'android', 'protectron']
  }), botThirty, score, () => 0, 20, synergizedOpponent);
  assert.equal(decision.declare, false);
});
