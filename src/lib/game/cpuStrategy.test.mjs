import test from 'node:test';
import assert from 'node:assert/strict';
import { ageOpponentHandMemory, chooseCpuDiscard, createCpuMemory, decideCpuDeclaration, evaluateCpuPaths, getCpuEchoAction, getForcedCpuRacePath, isCpuDeclarationDisabledByName, rememberCpuDecision, rememberOpponentHand } from './cpuStrategy.ts';

const details = {
  goblinLord: { race: 'goblin', otherRaces: [] },
  troll: { race: 'goblin', otherRaces: [] },
  shaman: { race: 'goblin', otherRaces: [] },
  hobgoblin: { race: 'goblin', otherRaces: [] },
  emperor: { race: 'human', otherRaces: [], rarity: 'legendary' },
  knight: { race: 'human', otherRaces: [] },
  ai: { race: 'bot', otherRaces: [] },
  protectron: { race: 'bot', otherRaces: [] },
  android: { race: 'bot', otherRaces: [] },
  lightSpirit: { race: 'spirit', otherRaces: [] },
  neutralize: { race: 'neutral', otherRaces: [] },
  switcharoo: { race: 'neutral', otherRaces: [], rarity: 'epic' },
  rareKnight: { race: 'human', otherRaces: [], rarity: 'legendary' },
  commonKnight: { race: 'human', otherRaces: [], rarity: 'poor' },
  rareBoost: { race: 'boost', otherRaces: [], rarity: 'legendary' },
  plainBoost: { race: 'boost', otherRaces: [], rarity: 'poor' },
  rareTrap: { race: 'trap', otherRaces: [], rarity: 'legendary' },
  plainTrap: { race: 'trap', otherRaces: [], rarity: 'poor' },
  rareNeutral: { race: 'neutral', otherRaces: [], rarity: 'legendary' },
  plainNeutral: { race: 'neutral', otherRaces: [], rarity: 'poor' }
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
    publicOpponentCards: [],
    rememberedOpponentCards: [],
    opponentMemoryAge: null,
    opponentMemorySource: '',
    boosts: [],
    traps: [],
    boostsBlocked: false,
    trapsBlocked: false,
    neutralizePossiblyAvailable: true,
    infectPoints: 0,
    numOfInfects: 0,
    chargePoints: 0,
    numOfCharges: 0,
    forcedRacePath: '',
    cardDetails: details,
    ...overrides
  };
}

test('keeps a concentrated goblin route and discards the weaker off-race card', () => {
  const decision = chooseCpuDiscard(observation(), score, () => 0.5);
  assert.equal(decision.cardTitle, 'knight');
  assert.equal(decision.path.race, 'goblins');
});

test('recognizes only exact plural race names as case-insensitive forced paths', () => {
  const validNames = new Map([
    ['Humans', 'humans'],
    ['gObLiNs', 'goblins'],
    ['ELVES', 'elves'],
    ['Dwarves', 'dwarves'],
    ['BEASTS', 'beasts'],
    ['Bots', 'bots'],
    ['xEnOs', 'xenos'],
    ['spIriTs', 'spirits']
  ]);
  validNames.forEach((race, name) => assert.equal(getForcedCpuRacePath(name), race));
  assert.equal(getForcedCpuRacePath('spirit'), '');
  assert.equal(getForcedCpuRacePath('spirits cpu'), '');
  assert.equal(getForcedCpuRacePath(' cookies'), '');
});

test('a race-named CPU always evaluates and discards for its forced path', () => {
  const decision = chooseCpuDiscard(observation({ forcedRacePath: 'humans' }), score, () => 0.5);
  assert.equal(decision.path.race, 'humans');
  assert.equal(details[decision.cardTitle].race, 'goblin');
  assert.deepEqual(evaluateCpuPaths(observation({ forcedRacePath: 'humans' }), score).map(path => path.race), ['humans']);
});

test('a forced path cannot declare using a stronger off-race score', () => {
  const mixedCpuScore = () => ({
    highestPoints: 100,
    points: { humans: 100, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 10 }
  });
  const opponentTwenty = () => ({
    highestPoints: 20,
    points: { humans: 20, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const decision = decideCpuDeclaration(observation({ forcedRacePath: 'spirits' }), mixedCpuScore, opponentTwenty, () => 0.5, 20);
  assert.equal(decision.cpuScore, 10);
  assert.equal(decision.declare, false);
});

test('only the exact case-insensitive name test disables CPU declarations', () => {
  assert.equal(isCpuDeclarationDisabledByName('test'), true);
  assert.equal(isCpuDeclarationDisabledByName('TeSt'), true);
  assert.equal(isCpuDeclarationDisabledByName('tester'), false);
  assert.equal(isCpuDeclarationDisabledByName('test cpu'), false);
});

test('lowers the Bot-race path when the opposing A.I. is known', () => {
  const safe = evaluateCpuPaths(observation({ hand: ['protectron', 'android'] }), score)
    .find(path => path.race === 'bots');
  const threatened = evaluateCpuPaths(observation({ hand: ['protectron', 'android'], knownOpponentCards: ['ai'] }), score)
    .find(path => path.race === 'bots');
  assert.ok(safe && threatened);
  assert.ok(threatened.utility < safe.utility);
  assert.equal(threatened.risk, Math.max(16, threatened.currentPoints * 0.8));
});

test('explains blocked boosts and the chance that Neutralize can restore them', () => {
  const path = evaluateCpuPaths(observation({ boostsBlocked: true }), score)[0];
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
  const decision = decideCpuDeclaration(observation(), powerful, weakOpponent, () => 0.25, 40);
  assert.equal(decision.declare, true);
  assert.equal(decision.estimatedWinChance, 1);
});

test('never declares before the game threshold', () => {
  const decision = decideCpuDeclaration(observation({ turnCount: 14 }), score, score, () => 0.5, 20);
  assert.equal(decision.declare, false);
  assert.equal(decision.sampledGames, 0);
});

test('declaration samples apply opposing A.I. theft to the CPU score', () => {
  const winningCpu = () => ({
    highestPoints: 80,
    points: { humans: 0, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 80, xenos: 0, spirits: 0 }
  });
  const weakerOpponent = () => ({
    highestPoints: 40,
    points: { humans: 40, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const withAiRisk = hand => ({ cpuScore: hand.includes('ai') ? 0 : 80, opponentScore: 40 });
  const riskyObservation = observation({
    unseenCards: ['ai', 'knight', 'knight', 'troll', 'shaman', 'hobgoblin', 'protectron']
  });
  const decision = decideCpuDeclaration(riskyObservation, winningCpu, weakerOpponent, () => 0, 20, withAiRisk);
  assert.equal(decision.declare, false);
  assert.equal(decision.estimatedWinChance, 0);
});

test('draws at six and only forces the active Echo discard after reaching seven cards', () => {
  assert.equal(getCpuEchoAction(['troll', 'echo', 'knight', 'emperor', 'ai', 'shaman'], true), 'draw');
  assert.equal(getCpuEchoAction(['troll', 'echo', 'knight', 'emperor', 'ai', 'shaman', 'hobgoblin'], true), 'discard-echo');
  assert.equal(getCpuEchoAction(['troll', 'echo', 'knight', 'emperor', 'ai', 'shaman', 'hobgoblin'], false), null);
  assert.equal(getCpuEchoAction(['troll', 'knight', 'emperor', 'ai', 'shaman', 'hobgoblin', 'goblinLord'], true), null);
});

test('keeps Spirit King, Vision, Exposed, and Gaze knowledge through later discard decisions', () => {
  const decision = chooseCpuDiscard(observation(), score, () => 0.5);
  for (const source of ['spiritKing', 'vision', 'exposed', 'gaze']) {
    const remembered = rememberOpponentHand(createCpuMemory(), ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'knight'], 8, source);
    const updated = rememberCpuDecision(remembered, decision);
    assert.deepEqual(updated.opponentHandSnapshot, remembered.opponentHandSnapshot);
    assert.equal(updated.opponentHandObservedAtTurn, 8);
    assert.equal(updated.opponentHandSource, source);
    assert.equal(ageOpponentHandMemory(updated).opponentHandAge, 1);
  }
});

test('an aging remembered leader prevents confidence against a previously strong hand', () => {
  const cpuThirty = () => ({
    highestPoints: 30,
    points: { humans: 0, goblins: 30, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const rememberedThreat = hand => ({
    cpuScore: 30,
    opponentScore: hand.includes('goblinLord') ? 60 : score(hand).highestPoints
  });
  const threatened = observation({
    turnCount: 15,
    unseenCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'knight', 'android', 'protectron', 'neutralize'],
    rememberedOpponentCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'knight'],
    opponentMemoryAge: 7,
    opponentMemorySource: 'vision'
  });
  const decision = decideCpuDeclaration(threatened, cpuThirty, score, () => 0.5, 80, rememberedThreat);
  assert.equal(decision.declare, false);
  assert.ok(decision.estimatedWinChance < 0.8);
  assert.match(decision.explanation, /vision memory from 7 turn/);
});

test('turn-15 hidden-hand samples assume some human race synergy', () => {
  const cpuThirty = () => ({
    highestPoints: 30,
    points: { humans: 0, goblins: 30, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const synergizedOpponent = hand => ({ cpuScore: 30, opponentScore: score(hand).highestPoints });
  const decision = decideCpuDeclaration(observation({
    turnCount: 15,
    unseenCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'troll', 'shaman', 'knight', 'emperor', 'android', 'protectron']
  }), cpuThirty, score, () => 0, 20, synergizedOpponent);
  assert.equal(decision.declare, false);
});

test('anchors a public Brite while still sampling the rest of the hidden hand', () => {
  const steadyCpu = () => ({
    highestPoints: 40,
    points: { humans: 0, goblins: 40, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 }
  });
  const publicBriteThreat = hand => ({
    cpuScore: 40,
    opponentScore: hand.includes('lightSpirit') && hand.length === 5 ? 60 : 0
  });
  const decision = decideCpuDeclaration(observation({
    publicOpponentCards: ['lightSpirit'],
    unseenCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'knight', 'android', 'protectron']
  }), steadyCpu, score, () => 0.5, 20, publicBriteThreat);
  assert.equal(decision.declare, false);
  assert.match(decision.explanation, /publicly visible lightSpirit/);
});

test('Switcharoo evaluates the revealed hand it receives, not the strong hand it gives away', () => {
  const hand = ['switcharoo', 'emperor', 'knight', 'knight', 'knight', 'knight'];
  const strongOpponent = observation({ hand, knownOpponentCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'troll'] });
  const weakOpponent = observation({ hand, knownOpponentCards: ['neutralize', 'neutralize', 'neutralize', 'neutralize', 'neutralize'] });
  assert.equal(chooseCpuDiscard(strongOpponent, score, () => 0.5).cardTitle, 'switcharoo');
  assert.notEqual(chooseCpuDiscard(weakOpponent, score, () => 0.5).cardTitle, 'switcharoo');
});

test('Switcharoo samples a hidden opponent hand before deciding to trade', () => {
  const decision = chooseCpuDiscard(observation({
    hand: ['switcharoo', 'emperor', 'knight', 'knight', 'knight', 'knight'],
    unseenCards: ['goblinLord', 'troll', 'shaman', 'hobgoblin', 'troll']
  }), score, () => 0.5);
  assert.equal(decision.cardTitle, 'switcharoo');
  assert.match(decision.explanation, /20 sampled opponent hands/);
});

test('Switcharoo passes both the received and given hands to the real swap scorer', () => {
  const hand = ['switcharoo', 'emperor', 'knight', 'knight', 'knight', 'knight'];
  const opponentHand = ['neutralize', 'neutralize', 'neutralize', 'neutralize', 'neutralize'];
  const scoredTrades = [];
  chooseCpuDiscard(observation({ hand, knownOpponentCards: opponentHand }), score, () => 0.5,
    (receivedHand, givenHand) => {
      scoredTrades.push({ receivedHand, givenHand });
      return { highestPoints: 60, points: { humans: 60, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 } };
    });
  assert.ok(scoredTrades.length > 0);
  assert.deepEqual(scoredTrades[0].receivedHand, opponentHand);
  assert.deepEqual(scoredTrades[0].givenHand, hand.filter(card => card !== 'switcharoo'));
});

test('rarity only breaks an otherwise close discard choice', () => {
  const decision = chooseCpuDiscard(observation({
    hand: ['rareKnight', 'commonKnight', 'emperor', 'knight', 'knight', 'knight']
  }), score, () => 0.5);
  assert.equal(decision.cardTitle, 'commonKnight');
});

test('boost, trap, and neutral rarity does not break equivalent discard choices', () => {
  for (const [rare, plain] of [
    ['rareBoost', 'plainBoost'],
    ['rareTrap', 'plainTrap'],
    ['rareNeutral', 'plainNeutral']
  ]) {
    const decision = chooseCpuDiscard(observation({
      hand: [rare, plain, 'emperor', 'knight', 'knight', 'knight']
    }), score, () => 0.5);
    assert.equal(decision.cardTitle, rare);
  }
});

test('active Infect favors Spirits while growing Charge favors Humans and Bots', () => {
  const base = observation({ hand: ['knight', 'lightSpirit'], unseenCards: ['knight', 'lightSpirit'] });
  const baseline = evaluateCpuPaths(base, score);
  const infected = evaluateCpuPaths({ ...base, numOfInfects: 2, infectPoints: 8 }, score);
  const charged = evaluateCpuPaths({ ...base, numOfCharges: 2, chargePoints: 8 }, score);
  const value = (paths, race) => paths.find(path => path.race === race).utility;
  assert.ok(value(infected, 'spirits') > value(baseline, 'spirits'));
  assert.ok(value(infected, 'humans') < value(baseline, 'humans'));
  assert.ok(value(charged, 'humans') > value(baseline, 'humans'));
  assert.ok(value(charged, 'bots') > value(baseline, 'bots'));
});

test('a 17-point CPU does not declare on a fragile 94% hidden-hand estimate', () => {
  const cpuSeventeen = () => ({ highestPoints: 17, points: { humans: 0, goblins: 17, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 } });
  let sample = 0;
  const decision = decideCpuDeclaration(observation({ turnCount: 15 }), cpuSeventeen, score, () => 0.5, 100,
    () => ({ cpuScore: 17, opponentScore: Math.floor(sample++ / 6) < 94 ? 10 : 30 }));
  assert.equal(decision.estimatedWinChance, 0.94);
  assert.equal(decision.declare, false);
});

test('hidden-hand samples sometimes preserve an available matching-race legendary', () => {
  const cpuFifty = () => ({ highestPoints: 50, points: { humans: 50, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 } });
  const uncertain = observation({ unseenCards: ['knight', 'emperor', ...Array(12).fill('knight')] });
  const match = hand => ({ cpuScore: 50, opponentScore: hand.includes('emperor') ? 100 : 10 });
  const withLeader = decideCpuDeclaration(uncertain, cpuFifty, score, () => 0, 1, match);
  const withoutLeader = decideCpuDeclaration(uncertain, cpuFifty, score, () => 0.99, 1, match);
  assert.equal(withLeader.estimatedWinChance, 0);
  assert.equal(withoutLeader.estimatedWinChance, 1);
});

test('active Infect can justify ending a reasonable hand sooner while Charge supports waiting', () => {
  const cpuFifty = () => ({ highestPoints: 50, points: { humans: 50, goblins: 0, elves: 0, dwarves: 0, beasts: 0, bots: 0, xenos: 0, spirits: 0 } });
  const decisionAt = (overrides, wins) => {
    let sample = 0;
    return decideCpuDeclaration(observation({ turnCount: 15, ...overrides }), cpuFifty, score, () => 0.5, 100,
      () => ({ cpuScore: 50, opponentScore: Math.floor(sample++ / 6) < wins ? 40 : 60 }));
  };
  assert.equal(decisionAt({}, 82).declare, false);
  assert.equal(decisionAt({ numOfInfects: 2, infectPoints: 10 }, 82).declare, true);
  assert.equal(decisionAt({}, 85).declare, true);
  assert.equal(decisionAt({ numOfCharges: 2, chargePoints: 10 }, 85).declare, false);
});
