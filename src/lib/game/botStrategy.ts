// ai generated: KNOWLEDGE MODEL — these types describe only the hand, public effects, and countable unseen cards available to the bot.
export type BotRace = 'humans' | 'goblins' | 'elves' | 'dwarves' | 'beasts' | 'bots' | 'xenos' | 'spirits' | 'cookies';
export type BotOpponentInsightSource = 'spiritKing' | 'vision' | 'exposed' | 'gaze';

export type BotCardDetails = Record<string, {
  race: string;
  otherRaces: string[];
}>;

export type BotObservation = {
  hand: string[];
  turnCount: number;
  activeDecks: string[];
  unseenCards: string[];
  knownOpponentCards: string[];
  rememberedOpponentCards: string[];
  opponentMemoryAge: number | null;
  opponentMemorySource: BotOpponentInsightSource | '';
  boosts: string[];
  traps: string[];
  boostsBlocked: boolean;
  trapsBlocked: boolean;
  neutralizePossiblyAvailable: boolean;
  cardDetails: BotCardDetails;
};

export type BotPathEvaluation = {
  race: BotRace;
  utility: number;
  currentPoints: number;
  drawPotential: number;
  risk: number;
  explanation: string;
};

export type BotDiscardDecision = {
  cardTitle: string;
  path: BotPathEvaluation;
  candidateScore: number;
  explanation: string;
};

export type BotDeclarationDecision = {
  declare: boolean;
  estimatedWinChance: number;
  botScore: number;
  sampledGames: number;
  explanation: string;
};

export type BotMemory = {
  turnsPlayed: number;
  lastPath: BotRace | '';
  discardedCards: string[];
  opponentHandSnapshot: string[];
  opponentHandObservedAtTurn: number | null;
  opponentHandSource: BotOpponentInsightSource | '';
  opponentHandAge: number;
};

type ScoreResult = {
  highestPoints: number;
  points: Record<string, number>;
};

export type BotScoreEvaluator = (hand: string[]) => ScoreResult;
export type BotMatchEvaluator = (opponentHand: string[]) => { botScore: number; opponentScore: number };

const raceCards: Record<Exclude<BotRace, 'cookies'>, string> = {
  humans: 'human',
  goblins: 'goblin',
  elves: 'elf',
  dwarves: 'dwarf',
  beasts: 'beast',
  bots: 'bot',
  xenos: 'xeno',
  spirits: 'spirit'
};

const scoreKeys: Record<Exclude<BotRace, 'cookies'>, string> = {
  humans: 'humans',
  goblins: 'goblins',
  elves: 'elves',
  dwarves: 'dwarves',
  beasts: 'beasts',
  bots: 'bots',
  xenos: 'xenos',
  spirits: 'spirits'
};

const strategicallyStickyCards = ['emperor', 'goblinLord', 'elfKing', 'longbeardLeader', 'dreamDestroyer', 'ai', 'spiritKing'];

// ai generated: The memory records only information the bot was legitimately allowed to observe.
export function createBotMemory(): BotMemory {
  return {
    turnsPlayed: 0,
    lastPath: '',
    discardedCards: [],
    opponentHandSnapshot: [],
    opponentHandObservedAtTurn: null,
    opponentHandSource: '',
    opponentHandAge: 0
  };
}

// ai generated: Legitimate Spirit King, Vision, Exposed, and Gaze information is remembered without continuing to inspect a hidden hand.
export function rememberOpponentHand(
  memory: BotMemory,
  cards: string[],
  turnCount: number,
  source: BotOpponentInsightSource
): BotMemory {
  return {
    ...memory,
    opponentHandSnapshot: [...cards],
    opponentHandObservedAtTurn: turnCount,
    opponentHandSource: source,
    opponentHandAge: 0
  };
}

// ai generated: Memory age follows actual human turns instead of the mutable game counter, which Tick Tock and Tock Tick can change.
export function ageOpponentHandMemory(memory: BotMemory): BotMemory {
  if (memory.opponentHandSnapshot.length === 0) return memory;
  return { ...memory, opponentHandAge: memory.opponentHandAge + 1 };
}

// ai generated: This state helper keeps Echo's draw-at-six and discard-at-seven order explicit and testable.
export function getBotEchoAction(hand: string[], playingTwice: boolean): 'draw' | 'discard-echo' | null {
  if (!playingTwice) return null;
  if (hand.length === 6) return 'draw';
  if (hand.length >= 7 && hand.includes('echo')) return 'discard-echo';
  return null;
}

// ai generated: STRATEGY MODEL — this evaluator compares every supported winning path without changing authoritative game points.
export function evaluateBotPaths(observation: BotObservation, evaluate: BotScoreEvaluator): BotPathEvaluation[] {
  const score = evaluate(observation.hand);
  const neutralizeChance = observation.neutralizePossiblyAvailable
    ? chanceOfDrawingAny(['neutralize'], observation)
    : 0;

  const paths: BotPathEvaluation[] = (Object.keys(raceCards) as Exclude<BotRace, 'cookies'>[]).map(race => {
    const matchingCards = observation.hand.filter(card => cardHasRace(card, raceCards[race], observation.cardDetails));
    const unseenMatchingCards = observation.unseenCards.filter(card => cardHasRace(card, raceCards[race], observation.cardDetails));
    const currentPoints = score.points[scoreKeys[race]] ?? 0;
    const concentration = matchingCards.length * matchingCards.length * 1.5;
    const drawChance = observation.unseenCards.length === 0 ? 0 : unseenMatchingCards.length / observation.unseenCards.length;
    let drawPotential = drawChance * (10 + matchingCards.length * 4);
    let risk = 0;
    const reasons = [`${matchingCards.length} matching card${matchingCards.length === 1 ? '' : 's'}`, `${currentPoints} current points`];

    if (race === 'humans' && observation.hand.includes('emperor')) {
      drawPotential += 20;
      reasons.push('Emperor keeps mixed non-xeno hands flexible');
    }

    if (race === 'goblins') {
      const goblinLordChance = chanceOfDrawingAny(['goblinLord', 'warchief', 'goblinLordsMark'], observation);
      if (observation.hand.includes('goblinLord')) drawPotential += matchingCards.length * 18;
      else drawPotential += goblinLordChance * matchingCards.length * 22;
      reasons.push(`Goblin Lord route ${formatChance(goblinLordChance)}`);
    }

    if (race === 'elves' && observation.hand.includes('elfKing')) {
      drawPotential += matchingCards.length * 14;
      reasons.push('Elf King payoff is active');
    }

    if (race === 'elves') {
      const bards = ['bardLute', 'bardFlute', 'bardHorn', 'bardDrum', 'bardSinger'];
      const bardCount = observation.hand.filter(card => bards.includes(card)).length;
      if (bardCount >= 2) {
        const bardChance = chanceOfDrawingAny(bards, observation);
        drawPotential += bardCount * 3 + bardChance * 18;
        reasons.push(`${bardCount} bards make the full-band route ${formatChance(bardChance)}`);
      }
    }

    if (race === 'dwarves' && observation.hand.some(card => ['longbeardLeader', 'dwarfCommander', 'dwarvenCall'].includes(card))) {
      drawPotential += 10;
      reasons.push('a forced dwarf draw is available or likely');
    }

    if (race === 'bots') {
      const aiRisk = estimateOpponentAiRisk(observation);
      const botValueAtRisk = Math.max(16, currentPoints * 0.8);
      risk += aiRisk * botValueAtRisk;
      reasons.push(`opposing A.I. theft risk ${formatChance(aiRisk)}`);
    }

    if (race === 'spirits') {
      const redCount = observation.hand.filter(card => card === 'redSpirit').length;
      const blueCount = observation.hand.filter(card => card === 'blueSpirit').length;
      const majority = Math.max(redCount, blueCount);
      drawPotential += majority * majority * 4;
      if (majority >= 3) reasons.push(`${majority}/5 matching djinns makes the lottery route plausible`);
    }

    if (observation.boostsBlocked) {
      const recovery = neutralizeChance * 7;
      drawPotential += recovery;
      reasons.push(`boosts are blocked; Neutralize recovery ${formatChance(neutralizeChance)}`);
    }

    if (observation.trapsBlocked) {
      reasons.push('traps are blocked, so trap penalties are currently harmless');
    }

    return {
      race,
      utility: currentPoints + concentration + drawPotential - risk,
      currentPoints,
      drawPotential,
      risk,
      explanation: reasons.join('; ')
    };
  });

  const cookieCards = observation.hand.filter(card => cardHasRace(card, 'boost', observation.cardDetails) || card.includes('Cookie'));
  const cookieChance = chanceOfDrawingAny(['cookieJar', 'oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie', 'cookieCrumbs'], observation);
  const cookieCurrentPoints = observation.hand.includes('cookieJar') && cookieCards.length === observation.hand.length && !observation.boostsBlocked ? 40 : 0;
  const cookieRisk = observation.boostsBlocked ? 30 : 0;
  paths.push({
    race: 'cookies',
    utility: cookieCurrentPoints + cookieCards.length * cookieCards.length * 2 + cookieChance * 26 - cookieRisk,
    currentPoints: cookieCurrentPoints,
    drawPotential: cookieChance * 26,
    risk: cookieRisk,
    explanation: `${cookieCards.length} cookie/boost cards; Cookie route ${formatChance(cookieChance)}; boosts ${observation.boostsBlocked ? 'blocked' : 'active'}`
  });

  return paths.sort((a, b) => b.utility - a.utility);
}

// ai generated: Each possible discard is scored with the real game scorer, then adjusted for future card-counting value.
export function chooseBotDiscard(
  observation: BotObservation,
  evaluate: BotScoreEvaluator,
  random: () => number = Math.random
): BotDiscardDecision {
  if (observation.hand.length === 0) throw new Error('The bot cannot discard from an empty hand.');

  const decisions = observation.hand.map((cardTitle, index) => {
    const candidateHand = observation.hand.filter((_, cardIndex) => cardIndex !== index);
    const candidateObservation = { ...observation, hand: candidateHand };
    const path = evaluateBotPaths(candidateObservation, evaluate)[0];
    const authoritativeScore = evaluate(candidateHand).highestPoints;
    const specialCardCost = specialDiscardCost(cardTitle, candidateHand, observation);
    const tieBreaker = random() * 0.001;
    return {
      cardTitle,
      path,
      candidateScore: authoritativeScore + path.utility - specialCardCost + tieBreaker,
      explanation: `Discard ${cardTitle}: ${authoritativeScore} scored points; ${path.race} path utility ${path.utility.toFixed(1)}; ${path.explanation}`
    };
  });

  decisions.sort((a, b) => b.candidateScore - a.candidateScore);
  return decisions[0];
}

// ai generated: Declaration uses hidden-card sampling and gives the human one final optimized discard, matching the game's last-turn rule.
export function decideBotDeclaration(
  observation: BotObservation,
  evaluateBot: BotScoreEvaluator,
  evaluateOpponent: BotScoreEvaluator,
  random: () => number = Math.random,
  simulations = 240,
  evaluateMatch?: BotMatchEvaluator
): BotDeclarationDecision {
  const botScore = evaluateBot(observation.hand).highestPoints;
  if (observation.turnCount < 15) {
    return {
      declare: false,
      estimatedWinChance: 0,
      botScore,
      sampledGames: 0,
      explanation: 'Gobbledegook is locked until turn 15.'
    };
  }

  if (botScore >= 500_000) {
    return {
      declare: true,
      estimatedWinChance: 1,
      botScore,
      sampledGames: 0,
      explanation: 'The bot has a guaranteed special-score hand.'
    };
  }

  let wins = 0;
  let ties = 0;
  const pool = [...observation.unseenCards];

  for (let game = 0; game < simulations; game++) {
    const sampled = sampleOpponentTurnHand(observation, pool, random);
    const possibleFinalHands = sampled.length > 5
      ? sampled.map((_, discardIndex) => sampled.filter((__, cardIndex) => cardIndex !== discardIndex))
      : [sampled];
    const outcomes = possibleFinalHands.map(hand => evaluateMatch
      ? evaluateMatch(hand)
      : { botScore, opponentScore: evaluateOpponent(hand).highestPoints });
    const hardestOutcome = outcomes.sort((a, b) => (a.botScore - a.opponentScore) - (b.botScore - b.opponentScore))[0];
    if (hardestOutcome.botScore > hardestOutcome.opponentScore) wins++;
    else if (hardestOutcome.botScore === hardestOutcome.opponentScore) ties++;
  }

  const estimatedWinChance = simulations === 0 ? 0 : (wins + ties * 0.25) / simulations;
  const earlyTurnCaution = Math.max(0, Math.min(0.08, (23 - observation.turnCount) * 0.01));
  const activeDeckPressure = observation.turnCount >= 25 && observation.unseenCards.length < 25 ? -0.04 : 0;
  const declarationThreshold = 0.72 + earlyTurnCaution + activeDeckPressure;
  const declare = estimatedWinChance >= declarationThreshold;
  const knowledgeDescription = observation.knownOpponentCards.length > 0
    ? 'current revealed-hand information'
    : observation.rememberedOpponentCards.length > 0
      ? `${observation.opponentMemorySource} memory from ${observation.opponentMemoryAge ?? 0} turn(s) ago`
      : 'a synergy-weighted hidden hand';
  return {
    declare,
    estimatedWinChance,
    botScore,
    sampledGames: simulations,
    explanation: `${botScore} points produced a ${(estimatedWinChance * 100).toFixed(0)}% estimated win chance across ${simulations} samples using ${knowledgeDescription}; threshold ${(declarationThreshold * 100).toFixed(0)}%.`
  };
}

// ai generated: The path tracker can be reset each round without losing the bot implementation itself.
export function rememberBotDecision(memory: BotMemory, decision: BotDiscardDecision): BotMemory {
  return {
    ...memory,
    turnsPlayed: memory.turnsPlayed + 1,
    lastPath: decision.path.race,
    discardedCards: [...memory.discardedCards, decision.cardTitle]
  };
}

function cardHasRace(card: string, race: string, details: BotCardDetails): boolean {
  const cardInfo = details[card];
  return Boolean(cardInfo && [cardInfo.race, ...cardInfo.otherRaces].includes(race));
}

function estimateOpponentAiRisk(observation: BotObservation): number {
  if (observation.knownOpponentCards.includes('ai')) return 1;
  const aiRemaining = observation.unseenCards.filter(card => card === 'ai').length;
  if (aiRemaining === 0 || observation.unseenCards.length === 0) return 0;
  const unknownSlots = Math.max(0, 5 - observation.knownOpponentCards.length);
  const unseenRisk = 1 - Math.pow(1 - aiRemaining / observation.unseenCards.length, unknownSlots);
  if (!observation.rememberedOpponentCards.includes('ai')) return unseenRisk;
  const rememberedRace = findDominantRace(observation.rememberedOpponentCards, observation.cardDetails);
  return Math.max(unseenRisk, rememberedCardRetentionChance('ai', rememberedRace, observation));
}

function chanceOfDrawingAny(cards: string[], observation: BotObservation): number {
  if (observation.unseenCards.length === 0) return 0;
  const matching = observation.unseenCards.filter(card => cards.includes(card)).length;
  const matchingDecks = new Set(observation.unseenCards
    .filter(card => cards.includes(card))
    .map(card => observation.cardDetails[card]?.race)
    .filter(Boolean));
  const activeDeckFactor = observation.activeDecks.length === 0
    ? 1
    : Math.min(1, Math.max(1, matchingDecks.size) / observation.activeDecks.length * 3);
  return Math.min(1, matching / observation.unseenCards.length * activeDeckFactor * 4);
}

function specialDiscardCost(cardTitle: string, candidateHand: string[], observation: BotObservation): number {
  let cost = 0;
  if (['emperor', 'goblinLord', 'elfKing', 'longbeardLeader', 'dreamDestroyer', 'ai', 'spiritKing'].includes(cardTitle)) cost += 16;
  if (cardTitle === 'neutralize' && (observation.boostsBlocked || observation.trapsBlocked)) cost += 10;
  if (cardTitle === 'goblinLordsMark' && candidateHand.some(card => cardHasRace(card, 'goblin', observation.cardDetails))) cost += 12;
  if (['redSpirit', 'blueSpirit'].includes(cardTitle) && candidateHand.filter(card => card === cardTitle).length >= 2) cost += 8;
  if (cardTitle === 'cookieJar' && !observation.boostsBlocked) cost += 10;
  return cost;
}

// ai generated: Declaration samples preserve remembered threats and mildly favor a coherent race, reflecting a human who has curated five cards by turn 15.
function sampleOpponentTurnHand(observation: BotObservation, cards: string[], random: () => number): string[] {
  const pool = [...cards];
  const currentlyKnown = observation.knownOpponentCards.slice(0, 5);
  if (currentlyKnown.length > 0) return [...currentlyKnown, ...sampleWithoutReplacement(pool, 1, random)];

  const remembered = observation.rememberedOpponentCards.slice(0, 5);
  const rememberedRace = findDominantRace(remembered, observation.cardDetails);
  const age = observation.opponentMemoryAge ?? 99;
  const hand: string[] = [];

  remembered.forEach(card => {
    const poolIndex = pool.indexOf(card);
    if (poolIndex === -1) return;
    const retentionChance = rememberedCardRetentionChance(card, rememberedRace, observation, age);
    if (random() < retentionChance) hand.push(...pool.splice(poolIndex, 1));
  });

  // ai generated: With no remembered anchor, one ordinary race card gives the sample a modest strategy direction instead of five unrelated random cards.
  if (hand.length === 0) {
    const strategicIndexes = pool
      .map((card, index) => ({ index, race: getStrategicRace(card, observation.cardDetails) }))
      .filter(candidate => candidate.race !== '');
    if (strategicIndexes.length > 0) {
      const chosen = strategicIndexes[Math.floor(random() * strategicIndexes.length)];
      hand.push(...pool.splice(chosen.index, 1));
    }
  }

  const targetRace = findDominantRace(hand, observation.cardDetails);
  while (hand.length < 5 && pool.length > 0) {
    const chosenIndex = chooseWeightedCardIndex(pool, targetRace, observation.cardDetails, random);
    hand.push(...pool.splice(chosenIndex, 1));
  }

  return [...hand, ...sampleWithoutReplacement(pool, 1, random)];
}

function rememberedCardRetentionChance(card: string, rememberedRace: string, observation: BotObservation, age = observation.opponentMemoryAge ?? 99): number {
  const isSticky = strategicallyStickyCards.includes(card);
  const matchesRememberedRace = rememberedRace !== '' && cardHasRace(card, rememberedRace, observation.cardDetails);
  const retentionPerTurn = isSticky ? 0.97 : matchesRememberedRace ? 0.90 : 0.75;
  const minimumRetention = isSticky ? 0.55 : matchesRememberedRace ? 0.20 : 0.05;
  return Math.max(minimumRetention, Math.pow(retentionPerTurn, age));
}

// ai generated: Only the eight scoring races define a synergy direction; boosts, traps, and neutrals remain possible off-path cards.
function getStrategicRace(card: string, details: BotCardDetails): string {
  const scoringRaces = Object.values(raceCards);
  const cardInfo = details[card];
  if (!cardInfo) return '';
  return [cardInfo.race, ...cardInfo.otherRaces].find(race => scoringRaces.includes(race)) ?? '';
}

function findDominantRace(cards: string[], details: BotCardDetails): string {
  const counts = new Map<string, number>();
  cards.forEach(card => {
    const race = getStrategicRace(card, details);
    if (race) counts.set(race, (counts.get(race) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

function chooseWeightedCardIndex(cards: string[], targetRace: string, details: BotCardDetails, random: () => number): number {
  if (!targetRace) return Math.floor(random() * cards.length);
  const weights = cards.map(card => cardHasRace(card, targetRace, details) ? 3 : 1);
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  let selection = random() * totalWeight;
  for (let index = 0; index < weights.length; index++) {
    selection -= weights[index];
    if (selection < 0) return index;
  }
  return cards.length - 1;
}

function sampleWithoutReplacement(cards: string[], count: number, random: () => number): string[] {
  const copy = [...cards];
  const result: string[] = [];
  while (result.length < count && copy.length > 0) {
    const index = Math.floor(random() * copy.length);
    result.push(copy[index]);
    copy.splice(index, 1);
  }
  return result;
}

function formatChance(chance: number): string {
  return `${Math.round(chance * 100)}%`;
}
