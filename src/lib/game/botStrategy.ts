// ai generated: KNOWLEDGE MODEL — these types describe only the hand, public effects, and countable unseen cards available to the bot.
export type BotRace = 'humans' | 'goblins' | 'elves' | 'dwarves' | 'beasts' | 'bots' | 'xenos' | 'spirits' | 'cookies';

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

// ai generated: The memory records only information the bot was legitimately allowed to observe.
export function createBotMemory(): BotMemory {
  return { turnsPlayed: 0, lastPath: '', discardedCards: [] };
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
  const knownCards = observation.knownOpponentCards.slice(0, 5);
  const cardsNeededForTurn = Math.max(0, 6 - knownCards.length);

  for (let game = 0; game < simulations; game++) {
    const sampled = [...knownCards, ...sampleWithoutReplacement(pool, cardsNeededForTurn, random)];
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
  const activeDeckPressure = observation.unseenCards.length < 25 ? -0.04 : 0;
  const declarationThreshold = 0.72 + activeDeckPressure;
  const declare = estimatedWinChance >= declarationThreshold;
  return {
    declare,
    estimatedWinChance,
    botScore,
    sampledGames: simulations,
    explanation: `${botScore} points produced a ${(estimatedWinChance * 100).toFixed(0)}% estimated win chance across ${simulations} fair hidden-hand samples; threshold ${(declarationThreshold * 100).toFixed(0)}%.`
  };
}

// ai generated: The path tracker can be reset each round without losing the bot implementation itself.
export function rememberBotDecision(memory: BotMemory, decision: BotDiscardDecision): BotMemory {
  return {
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
  return 1 - Math.pow(1 - aiRemaining / observation.unseenCards.length, unknownSlots);
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
