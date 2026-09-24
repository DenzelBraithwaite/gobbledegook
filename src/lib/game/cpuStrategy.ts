// ai generated: KNOWLEDGE MODEL — these types describe only the hand, public effects, and countable unseen cards available to the CPU.
export type CpuRace = 'humans' | 'goblins' | 'elves' | 'dwarves' | 'beasts' | 'bots' | 'xenos' | 'spirits' | 'cookies';
export type CpuForcedRace = Exclude<CpuRace, 'cookies'>;
export type CpuOpponentInsightSource = 'spiritKing' | 'vision' | 'exposed' | 'gaze';

export type CpuCardDetails = Record<string, {
  race: string;
  otherRaces: string[];
  rarity?: string;
  points?: number;
}>;

export type CpuObservation = {
  hand: string[];
  turnCount: number;
  activeDecks: string[];
  unseenCards: string[];
  knownOpponentCards: string[];
  publicOpponentCards: string[];
  rememberedOpponentCards: string[];
  opponentMemoryAge: number | null;
  opponentMemorySource: CpuOpponentInsightSource | '';
  boosts: string[];
  traps: string[];
  boostsBlocked: boolean;
  trapsBlocked: boolean;
  neutralizePossiblyAvailable: boolean;
  infectPoints: number;
  numOfInfects: number;
  chargePoints: number;
  numOfCharges: number;
  forcedRacePath: CpuForcedRace | '';
  cardDetails: CpuCardDetails;
};

export type CpuPathEvaluation = {
  race: CpuRace;
  utility: number;
  currentPoints: number;
  drawPotential: number;
  risk: number;
  explanation: string;
};

export type CpuDiscardDecision = {
  cardTitle: string;
  path: CpuPathEvaluation;
  backupPath: CpuPathEvaluation;
  candidateScore: number;
  explanation: string;
};

export type CpuDeclarationDecision = {
  declare: boolean;
  estimatedWinChance: number;
  cpuScore: number;
  sampledGames: number;
  explanation: string;
};

export type CpuMemory = {
  turnsPlayed: number;
  lastPath: CpuRace | '';
  lastBackupPath: CpuRace | '';
  discardedCards: string[];
  opponentHandSnapshot: string[];
  opponentHandObservedAtTurn: number | null;
  opponentHandSource: CpuOpponentInsightSource | '';
  opponentHandAge: number;
};

type ScoreResult = {
  highestPoints: number;
  points: Record<string, number>;
};

export type CpuScoreEvaluator = (hand: string[]) => ScoreResult;
export type CpuMatchEvaluator = (opponentHand: string[]) => { cpuScore: number; opponentScore: number };

const raceCards: Record<CpuForcedRace, string> = {
  humans: 'human',
  goblins: 'goblin',
  elves: 'elf',
  dwarves: 'dwarf',
  beasts: 'beast',
  bots: 'bot',
  xenos: 'xeno',
  spirits: 'spirit'
};

const scoreKeys: Record<CpuForcedRace, string> = {
  humans: 'humans',
  goblins: 'goblins',
  elves: 'elves',
  dwarves: 'dwarves',
  beasts: 'beasts',
  bots: 'bots',
  xenos: 'xenos',
  spirits: 'spirits'
};

const strategicallyStickyCards = ['emperor', 'goblinLord', 'elfKing', 'longbeardLeader', 'dreamDestroyer', 'nightTerror', 'ai', 'spiritKing'];
const rarityDiscardCost: Record<string, number> = { legendary: 0.4, epic: 0.25, amazing: 0.15, great: 0.08 };
const cookieNames = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
const backupPathWeight = 0.12;

// ai generated: An exact plural race name, in any letter case, is the deliberate testing cheat that locks the CPU to that path.
export function getForcedCpuRacePath(cpuName: string): CpuForcedRace | '' {
  const normalizedName = cpuName.toLowerCase();
  return (Object.keys(raceCards) as CpuForcedRace[]).includes(normalizedName as CpuForcedRace)
    ? normalizedName as CpuForcedRace
    : '';
}

// ai generated: The exact testing name keeps long-running test games open without weakening normal CPU declaration logic.
export function isCpuDeclarationDisabledByName(cpuName: string): boolean {
  return cpuName.toLowerCase() === 'test';
}

// ai generated: These two testing names make the CPU declare on its first legal opportunity, regardless of estimated odds.
export function isCpuDeclarationForcedByName(cpuName: string): boolean {
  return ['gdg', 'gobbledegook'].includes(cpuName.toLowerCase());
}

// ai generated: The memory records only information the CPU was legitimately allowed to observe.
export function createCpuMemory(): CpuMemory {
  return {
    turnsPlayed: 0,
    lastPath: '',
    lastBackupPath: '',
    discardedCards: [],
    opponentHandSnapshot: [],
    opponentHandObservedAtTurn: null,
    opponentHandSource: '',
    opponentHandAge: 0
  };
}

// ai generated: Legitimate Spirit King, Vision, Exposed, and Gaze information is remembered without continuing to inspect a hidden hand.
export function rememberOpponentHand(
  memory: CpuMemory,
  cards: string[],
  turnCount: number,
  source: CpuOpponentInsightSource
): CpuMemory {
  return {
    ...memory,
    opponentHandSnapshot: [...cards],
    opponentHandObservedAtTurn: turnCount,
    opponentHandSource: source,
    opponentHandAge: 0
  };
}

// ai generated: Memory age follows actual human turns instead of the mutable game counter, which Tick Tock and Tock Tick can change.
export function ageOpponentHandMemory(memory: CpuMemory): CpuMemory {
  if (memory.opponentHandSnapshot.length === 0) return memory;
  return { ...memory, opponentHandAge: memory.opponentHandAge + 1 };
}

// ai generated: This state helper keeps Echo's draw-at-six and discard-at-seven order explicit and testable.
export function getCpuEchoAction(hand: string[], playingTwice: boolean): 'draw' | 'discard-echo' | null {
  if (!playingTwice) return null;
  if (hand.length === 6) return 'draw';
  if (hand.length >= 7 && hand.includes('echo')) return 'discard-echo';
  return null;
}

// ai generated: STRATEGY MODEL — this evaluator compares every supported winning path without changing authoritative game points.
export function evaluateCpuPaths(observation: CpuObservation, evaluate: CpuScoreEvaluator): CpuPathEvaluation[] {
  const score = evaluate(observation.hand);
  const neutralizeChance = observation.neutralizePossiblyAvailable
    ? chanceOfDrawingAny(['neutralize'], observation)
    : 0;

  const paths: CpuPathEvaluation[] = (Object.keys(raceCards) as CpuForcedRace[]).map(race => {
    const matchingCards = observation.hand.filter(card => cardHasRace(card, raceCards[race], observation.cardDetails));
    const unseenMatchingCards = observation.unseenCards.filter(card => cardHasRace(card, raceCards[race], observation.cardDetails));
    const currentPoints = score.points[scoreKeys[race]] ?? 0;
    const concentration = matchingCards.length * matchingCards.length * 1.5;
    const drawChance = observation.unseenCards.length === 0 ? 0 : unseenMatchingCards.length / observation.unseenCards.length;
    let drawPotential = drawChance * (10 + matchingCards.length * 4);
    let risk = 0;
    const reasons = [`${matchingCards.length} matching card${matchingCards.length === 1 ? '' : 's'}`, `${currentPoints} current points`];
    if (observation.forcedRacePath === race) reasons.unshift(`CPU name forces the ${race} path`);

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
      const cpuValueAtRisk = Math.max(16, currentPoints * 0.8);
      risk += aiRisk * cpuValueAtRisk;
      reasons.push(`opposing A.I. theft risk ${formatChance(aiRisk)}`);
    }

    if (race === 'spirits') {
      const redCount = observation.hand.filter(card => card === 'redSpirit').length;
      const blueCount = observation.hand.filter(card => card === 'blueSpirit').length;
      const majority = Math.max(redCount, blueCount);
      // ai generated: Djinn sets are a lottery until three match; only remaining matching draws justify future value.
      if (majority >= 3 && majority < 5) {
        const color = redCount >= blueCount ? 'redSpirit' : 'blueSpirit';
        const matchingDrawChance = chanceOfDrawingAny([color], observation);
        drawPotential += majority * majority * 2 * matchingDrawChance;
        reasons.push(`${majority}/5 matching djinns; matching draw ${formatChance(matchingDrawChance)}`);
      }
    }

    // ai generated: The real scorer already includes today's Infect/Charge points; these small adjustments value only a few future turns.
    if (observation.numOfInfects > 0 && !observation.trapsBlocked) {
      const futureInfectLoss = observation.numOfInfects * 4 * (1 - neutralizeChance * 0.5);
      if (race === 'spirits') {
        drawPotential += Math.min(8, futureInfectLoss);
        reasons.push('Spirits are immune to worsening Infect');
      } else {
        risk += futureInfectLoss;
        reasons.push(`Infect may cost another ${futureInfectLoss.toFixed(1)} points over the next few turns`);
      }
    }

    if (observation.numOfCharges > 0 && !observation.boostsBlocked && ['humans', 'bots'].includes(race)) {
      const futureChargeGain = observation.numOfCharges * 4;
      drawPotential += futureChargeGain;
      reasons.push(`Charge may add another ${futureChargeGain} points over the next few turns`);
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

  // ai generated: Cookie Jar's +40 accepts only Boost/Neutral hands; +100 needs one Jar and four Cookies or Cookie-mimicking Leons.
  const cookiePlan = getCookiePlan(observation);
  // ai generated: One loose Cookie or an empty Jar is not enough to count as a serious lottery setup.
  const cookieSetup = cookiePlan.cookieCount < 2 ? 0
    : cookiePlan.jarCount > 0 ? cookiePlan.cookieCount * cookiePlan.cookieCount * 2
    : cookiePlan.cookieCount * cookiePlan.jarDrawChance * 10;
  const cookieDrawPotential = cookiePlan.jarCount > 0 && cookiePlan.cookieCount === 3
    ? cookiePlan.fourDrawCookieChance * (cookiePlan.currentBonus > 0 ? 60 : 100)
    : cookiePlan.jarCount === 0 && cookiePlan.cookieCount >= 2 ? cookiePlan.jarDrawChance * 40 : 0;
  const cookieRisk = observation.boostsBlocked && cookiePlan.jarCount > 0 ? 30 : 0;
  paths.push({
    race: 'cookies',
    utility: cookiePlan.currentBonus + cookieSetup + cookieDrawPotential - cookieRisk,
    currentPoints: cookiePlan.currentBonus,
    drawPotential: cookieDrawPotential,
    risk: cookieRisk,
    explanation: `${cookiePlan.jarCount} jar(s), ${cookiePlan.cookieCount}/4 Cookie-compatible cards; ${cookiePlan.currentBonus} current Jar bonus; next-compatible draw ${formatChance(cookiePlan.nextCookieDrawChance)}; boosts ${observation.boostsBlocked ? 'blocked' : 'active'}`
  });

  const rankedPaths = paths.sort((a, b) => b.utility - a.utility);
  return observation.forcedRacePath
    ? rankedPaths.filter(path => path.race === observation.forcedRacePath)
    : rankedPaths;
}

// ai generated: Each possible discard is scored with the real game scorer, then adjusted for future card-counting value.
export function chooseCpuDiscard(
  observation: CpuObservation,
  evaluate: CpuScoreEvaluator,
  random: () => number = Math.random,
  evaluateSwappedHand?: (receivedHand: string[], givenHand: string[]) => ScoreResult,
  evaluateAfterDiscard?: (hand: string[], discardedCard: string) => ScoreResult
): CpuDiscardDecision {
  if (observation.hand.length === 0) throw new Error('The CPU cannot discard from an empty hand.');

  const decisions = observation.hand.map((cardTitle, index) => {
    const candidateHand = observation.hand.filter((_, cardIndex) => cardIndex !== index);
    // ai generated: Discarding Switcharoo at five cards actually hands these cards away, so judge the received hand instead.
    if (cardTitle === 'switcharoo' && candidateHand.length === 5) {
      const exactHand = observation.knownOpponentCards.length === 5;
      const sampleCount = exactHand ? 1 : 20;
      const outcomes = Array.from({ length: sampleCount }, () => {
        const receivedHand = exactHand
          ? [...observation.knownOpponentCards]
          : sampleOpponentCurrentHand(observation, observation.unseenCards, random);
        const swappedEvaluator: CpuScoreEvaluator = hand => evaluateSwappedHand
          ? evaluateSwappedHand(hand, candidateHand)
          : evaluate(hand);
        const { path, backupPath } = selectCpuPaths({ ...observation, hand: receivedHand }, swappedEvaluator);
        const scored = swappedEvaluator(receivedHand);
        const authoritativeScore = observation.forcedRacePath
          ? scored.points[scoreKeys[observation.forcedRacePath]] ?? 0
          : scored.highestPoints;
        return { path, backupPath, authoritativeScore, value: authoritativeScore + path.utility + backupValue(backupPath, observation) };
      });
      const expectedValue = outcomes.reduce((total, outcome) => total + outcome.value, 0) / outcomes.length;
      const representative = [...outcomes].sort((a, b) => a.value - b.value)[Math.floor(outcomes.length / 2)];
      const uncertaintyCost = exactHand ? 0 : 4;
      return {
        cardTitle,
        path: representative.path,
        backupPath: representative.backupPath,
        candidateScore: expectedValue - uncertaintyCost + random() * 0.001,
        explanation: `Discard switcharoo: ${exactHand ? 'known' : `${sampleCount} sampled`} opponent hand${exactHand ? '' : 's'} become the CPU hand; expected post-swap value ${expectedValue.toFixed(1)}${uncertaintyCost ? ` less ${uncertaintyCost} uncertainty points` : ''}; representative backup ${representative.backupPath.race}.`
      };
    }
    // ai generated: Shuffle replaces the entire kept hand; compare sampled replacement hands with keeping known cards.
    if (cardTitle === 'shuffle' && candidateHand.length === 5) {
      const sampleCount = 24;
      const outcomes = Array.from({ length: sampleCount }, () => {
        const replacementHand = sampleWithoutReplacement(observation.unseenCards, 5, random);
        const replacementEvaluator: CpuScoreEvaluator = hand => evaluateAfterDiscard
          ? evaluateAfterDiscard(hand, 'shuffle')
          : evaluate(hand);
        const { path, backupPath } = selectCpuPaths({ ...observation, hand: replacementHand }, replacementEvaluator);
        const scored = replacementEvaluator(replacementHand);
        const authoritativeScore = observation.forcedRacePath
          ? scored.points[scoreKeys[observation.forcedRacePath]] ?? 0
          : scored.highestPoints;
        return { path, backupPath, value: authoritativeScore + path.utility + backupValue(backupPath, observation) };
      });
      const expectedValue = outcomes.reduce((total, outcome) => total + outcome.value, 0) / sampleCount;
      const representative = [...outcomes].sort((a, b) => a.value - b.value)[Math.floor(sampleCount / 2)];
      const uncertaintyCost = 8;
      return {
        cardTitle,
        path: representative.path,
        backupPath: representative.backupPath,
        candidateScore: expectedValue - uncertaintyCost + random() * 0.001,
        explanation: `Discard shuffle: ${sampleCount} sampled five-card replacements average ${expectedValue.toFixed(1)} value, less ${uncertaintyCost} points for giving up a known hand; representative backup ${representative.backupPath.race}.`
      };
    }
    const candidateObservation = { ...observation, hand: candidateHand };
    // ai generated: Score the discard pile after this exact card leaves the hand, so Longbeard's +5 is not missed.
    const candidateEvaluator: CpuScoreEvaluator = evaluateAfterDiscard
      ? hand => evaluateAfterDiscard(hand, cardTitle)
      : evaluate;
    const { path, backupPath } = selectCpuPaths(candidateObservation, candidateEvaluator);
    const candidateEvaluation = candidateEvaluator(candidateHand);
    const authoritativeScore = observation.forcedRacePath
      ? candidateEvaluation.points[scoreKeys[observation.forcedRacePath]] ?? 0
      : candidateEvaluation.highestPoints;
    const specialCardCost = specialDiscardCost(cardTitle, candidateHand, observation);
    // ai generated: A recycled low Dwarf still advances Longbeard's route; do not penalize its loss of hand concentration twice.
    const lowDwarfRecycled = Boolean(evaluateAfterDiscard) && candidateHand.includes('longbeardLeader')
      && observation.cardDetails[cardTitle]?.race === 'dwarf'
      && (observation.cardDetails[cardTitle]?.points ?? Infinity) <= 5;
    const dwarfCountBeforeDiscard = observation.hand.filter(card => cardHasRace(card, 'dwarf', observation.cardDetails)).length;
    const recycledDwarfValue = lowDwarfRecycled
      ? (dwarfCountBeforeDiscard * dwarfCountBeforeDiscard - (dwarfCountBeforeDiscard - 1) * (dwarfCountBeforeDiscard - 1)) * 1.5
        * (path.race === 'dwarves' ? 1 : backupPath.race === 'dwarves' && !observation.forcedRacePath ? backupPathWeight : 0)
      : 0;
    const tieBreaker = random() * 0.001;
    return {
      cardTitle,
      path,
      backupPath,
      candidateScore: authoritativeScore + path.utility + backupValue(backupPath, observation) - specialCardCost + recycledDwarfValue + tieBreaker,
      explanation: `Discard ${cardTitle}: ${authoritativeScore} scored points; primary ${path.race} utility ${path.utility.toFixed(1)}; backup ${backupPath.race} utility ${backupPath.utility.toFixed(1)}${observation.forcedRacePath ? ' (informational only under forced path)' : ''}${lowDwarfRecycled ? `; Longbeard banks +5 from this Dwarf${recycledDwarfValue > 0 ? ` and preserves ${recycledDwarfValue.toFixed(1)} Dwarf-path value` : ''}` : ''}; ${path.explanation}`
    };
  });

  decisions.sort((a, b) => b.candidateScore - a.candidateScore);
  return decisions[0];
}

// ai generated: A backup is recomputed for each candidate hand and mildly rewards a viable second route without locking the CPU to yesterday's plan.
function selectCpuPaths(observation: CpuObservation, evaluate: CpuScoreEvaluator): { path: CpuPathEvaluation; backupPath: CpuPathEvaluation } {
  const ranked = evaluateCpuPaths({ ...observation, forcedRacePath: '' }, evaluate);
  const path = observation.forcedRacePath
    ? evaluateCpuPaths(observation, evaluate)[0]
    : ranked[0];
  const backupPath = ranked.find(candidate => candidate.race !== path.race) ?? ranked[1];
  return { path, backupPath };
}

function backupValue(backupPath: CpuPathEvaluation, observation: CpuObservation): number {
  return observation.forcedRacePath ? 0 : Math.max(0, backupPath.utility) * backupPathWeight;
}

// ai generated: Declaration uses hidden-card sampling and gives the human one final optimized discard, matching the game's last-turn rule.
export function decideCpuDeclaration(
  observation: CpuObservation,
  evaluateCpu: CpuScoreEvaluator,
  evaluateOpponent: CpuScoreEvaluator,
  random: () => number = Math.random,
  simulations = 240,
  evaluateMatch?: CpuMatchEvaluator
): CpuDeclarationDecision {
  const cpuEvaluation = evaluateCpu(observation.hand);
  const cpuScore = observation.forcedRacePath
    ? cpuEvaluation.points[scoreKeys[observation.forcedRacePath]] ?? 0
    : cpuEvaluation.highestPoints;
  if (observation.turnCount < 15) {
    return {
      declare: false,
      estimatedWinChance: 0,
      cpuScore,
      sampledGames: 0,
      explanation: 'Gobbledegook is locked until turn 15.'
    };
  }

  if (cpuScore >= 500_000) {
    return {
      declare: true,
      estimatedWinChance: 1,
      cpuScore,
      sampledGames: 0,
      explanation: 'The CPU has a guaranteed special-score hand.'
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
      : { cpuScore, opponentScore: evaluateOpponent(hand).highestPoints });
    const hardestOutcome = outcomes.sort((a, b) => (a.cpuScore - a.opponentScore) - (b.cpuScore - b.opponentScore))[0];
    if (hardestOutcome.cpuScore > hardestOutcome.opponentScore) wins++;
    else if (hardestOutcome.cpuScore === hardestOutcome.opponentScore) ties++;
  }

  const estimatedWinChance = simulations === 0 ? 0 : (wins + ties * 0.25) / simulations;
  const earlyTurnCaution = Math.max(0, Math.min(0.08, (23 - observation.turnCount) * 0.01));
  const activeDeckPressure = observation.turnCount >= 25 && observation.unseenCards.length < 25 ? -0.04 : 0;
  let declarationThreshold = 0.72 + earlyTurnCaution + activeDeckPressure;
  // ai generated: A 20-point lead is fragile, 35–70 is ordinary, and 100+ is exceptional; these are confidence guidelines, not substitute scores.
  if (cpuScore <= 20) declarationThreshold = observation.knownOpponentCards.length === 5 ? 0.94 : 0.995;
  else if (cpuScore < 35) declarationThreshold = Math.max(declarationThreshold, 0.86 + earlyTurnCaution);
  else if (cpuScore < 70) declarationThreshold += 0.04;
  else if (cpuScore >= 100) declarationThreshold = Math.min(declarationThreshold, 0.70);

  // ai generated: Active Infect makes a reasonable score decay, while unblocked Charge gives a Human/Bot route a little more time to grow.
  const activeInfects = observation.trapsBlocked ? 0 : observation.numOfInfects;
  if (cpuScore > 20 && activeInfects > 0) declarationThreshold -= Math.min(0.05, activeInfects * 0.025);
  const chargePathActive = cpuEvaluation.points.humans === cpuScore || cpuEvaluation.points.bots === cpuScore;
  if (cpuScore < 100 && chargePathActive && observation.numOfCharges > 0 && !observation.boostsBlocked) {
    declarationThreshold += Math.min(0.03, observation.numOfCharges * 0.015);
  }
  // ai generated: Three Cookie-compatible cards plus a Jar can be one draw from +100; wait only while a Cookie or Leon remains drawable.
  const cookiePlan = getCookiePlan(observation);
  const nearCompleteCookieJar = cpuScore < 100 && cookiePlan.jarCount === 1 && cookiePlan.cookieCount === 3
    && !observation.boostsBlocked && cookiePlan.nextCookieDrawChance > 0;
  if (nearCompleteCookieJar) declarationThreshold += Math.min(0.08, 0.02 + cookiePlan.fourDrawCookieChance * 0.15);
  declarationThreshold = Math.max(0.6, Math.min(0.995, declarationThreshold));
  const declare = estimatedWinChance >= declarationThreshold;
  const knowledgeDescription = observation.knownOpponentCards.length > 0
    ? 'current revealed-hand information'
    : observation.publicOpponentCards.length > 0
      ? `publicly visible ${observation.publicOpponentCards.join(', ')} plus a synergy-weighted hidden hand`
    : observation.rememberedOpponentCards.length > 0
      ? `${observation.opponentMemorySource} memory from ${observation.opponentMemoryAge ?? 0} turn(s) ago`
      : 'a synergy-weighted hidden hand';
  return {
    declare,
    estimatedWinChance,
    cpuScore,
    sampledGames: simulations,
    explanation: `${cpuScore} points produced a ${(estimatedWinChance * 100).toFixed(0)}% estimated win chance across ${simulations} samples using ${knowledgeDescription}; threshold ${(declarationThreshold * 100).toFixed(1)}%${activeInfects ? ` (active Infect ×${activeInfects} favors ending sooner)` : ''}${chargePathActive && observation.numOfCharges > 0 && !observation.boostsBlocked ? ' (Charge favors waiting for growth)' : ''}${nearCompleteCookieJar ? ` (Jar + 3 Cookie-compatible cards: fourth-card draw ${formatChance(cookiePlan.nextCookieDrawChance)} favors waiting)` : ''}.`
  };
}

// ai generated: The path tracker can be reset each round without losing the CPU implementation itself.
export function rememberCpuDecision(memory: CpuMemory, decision: CpuDiscardDecision): CpuMemory {
  return {
    ...memory,
    turnsPlayed: memory.turnsPlayed + 1,
    lastPath: decision.path.race,
    lastBackupPath: decision.backupPath.race,
    discardedCards: [...memory.discardedCards, decision.cardTitle]
  };
}

function cardHasRace(card: string, race: string, details: CpuCardDetails): boolean {
  const cardInfo = details[card];
  return Boolean(cardInfo && [cardInfo.race, ...cardInfo.otherRaces].includes(race));
}

function estimateOpponentAiRisk(observation: CpuObservation): number {
  if ([...observation.knownOpponentCards, ...observation.publicOpponentCards].includes('ai')) return 1;
  const aiRemaining = observation.unseenCards.filter(card => card === 'ai').length;
  if (aiRemaining === 0 || observation.unseenCards.length === 0) return 0;
  const unknownSlots = Math.max(0, 5 - observation.knownOpponentCards.length - observation.publicOpponentCards.length);
  const unseenRisk = 1 - Math.pow(1 - aiRemaining / observation.unseenCards.length, unknownSlots);
  if (!observation.rememberedOpponentCards.includes('ai')) return unseenRisk;
  const rememberedRace = findDominantRace(observation.rememberedOpponentCards, observation.cardDetails);
  return Math.max(unseenRisk, rememberedCardRetentionChance('ai', rememberedRace, observation));
}

function chanceOfDrawingAny(cards: string[], observation: CpuObservation): number {
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

// ai generated: This uses the game's one-deck-then-one-card draw pattern for Cookie planning, rather than treating all unseen cards as equally drawable next.
function chanceOfDrawingBoostCards(cards: string[], observation: CpuObservation): number {
  if (observation.activeDecks.length > 0 && !observation.activeDecks.includes('boosts')) return 0;
  const unseenBoosts = observation.unseenCards.filter(card => cardHasRace(card, 'boost', observation.cardDetails));
  if (unseenBoosts.length === 0) return 0;
  const matching = unseenBoosts.filter(card => cards.includes(card)).length;
  const boostDeckChance = observation.activeDecks.length > 0 ? 1 / observation.activeDecks.length : 1;
  return boostDeckChance * matching / unseenBoosts.length;
}

// ai generated: Leon is drawn from Neutrals, so a near-complete Jar may be finished by a Cookie or by Leon.
function chanceOfDrawingLeon(observation: CpuObservation): number {
  if (observation.activeDecks.length > 0 && !observation.activeDecks.includes('neutrals')) return 0;
  const unseenNeutrals = observation.unseenCards.filter(card => cardHasRace(card, 'neutral', observation.cardDetails));
  if (unseenNeutrals.length === 0) return 0;
  const neutralDeckChance = observation.activeDecks.length > 0 ? 1 / observation.activeDecks.length : 1;
  return neutralDeckChance * unseenNeutrals.filter(card => card === 'leon').length / unseenNeutrals.length;
}

// ai generated: Leon can substitute for a Cookie in the five-card Jar hand; Cookie Crumbs cannot.
function getCookiePlan(observation: CpuObservation) {
  const jarCount = observation.hand.filter(card => card === 'cookieJar').length;
  const cookieCount = observation.hand.filter(card => cookieNames.includes(card) || card === 'leon').length;
  const bonusOnly = observation.hand.every(card => ['boost', 'neutral'].some(race => cardHasRace(card, race, observation.cardDetails)));
  const fullCookieHand = observation.hand.length === 5 && jarCount === 1
    && observation.hand.every(card => card === 'cookieJar' || cookieNames.includes(card) || card === 'leon');
  const currentBonus = jarCount > 0 && bonusOnly && !observation.boostsBlocked
    ? fullCookieHand ? 100 : jarCount * 40
    : 0;
  const nextCookieDrawChance = Math.min(1, chanceOfDrawingBoostCards(cookieNames, observation) + chanceOfDrawingLeon(observation));
  const jarDrawChance = chanceOfDrawingBoostCards(['cookieJar'], observation);
  const fourDrawCookieChance = 1 - Math.pow(1 - nextCookieDrawChance, Math.min(4, observation.unseenCards.length));
  return { jarCount, cookieCount, bonusOnly, currentBonus, nextCookieDrawChance, jarDrawChance, fourDrawCookieChance };
}

function specialDiscardCost(cardTitle: string, candidateHand: string[], observation: CpuObservation): number {
  const cardMatchesForcedRace = observation.forcedRacePath
    ? cardHasRace(cardTitle, raceCards[observation.forcedRacePath], observation.cardDetails)
    : true;
  // ai generated: Rarity is a tiny tie-breaker only for scoring-race cards; boost, trap, and neutral abilities need their own context.
  const isScoringRaceCard = getStrategicRace(cardTitle, observation.cardDetails) !== '';
  let cost = isScoringRaceCard && cardMatchesForcedRace
    ? rarityDiscardCost[observation.cardDetails[cardTitle]?.rarity ?? ''] ?? 0
    : 0;
  // ai generated: A forced path does not protect an unrelated race leader merely because that leader is normally valuable.
  // ai generated: A real race leader is worth retaining through a weak detour; a bare Jar is not a completed Cookie strategy.
  if (cardMatchesForcedRace && strategicallyStickyCards.includes(cardTitle)) cost += 30;
  if (!observation.forcedRacePath && strategicallyStickyCards.includes(cardTitle)
    && candidateHand.includes('cookieJar')
    && candidateHand.filter(card => cookieNames.includes(card)).length <= 1
    && candidateHand.every(card => ['boost', 'neutral'].some(race => cardHasRace(card, race, observation.cardDetails)))) cost += 30;
  if (cardTitle === 'neutralize' && (observation.boostsBlocked || observation.trapsBlocked)) cost += 10;
  if ((!observation.forcedRacePath || observation.forcedRacePath === 'goblins') && cardTitle === 'goblinLordsMark' && candidateHand.some(card => cardHasRace(card, 'goblin', observation.cardDetails))) cost += 12;
  if ((!observation.forcedRacePath || observation.forcedRacePath === 'spirits') && ['redSpirit', 'blueSpirit'].includes(cardTitle) && candidateHand.filter(card => card === cardTitle).length >= 2) cost += 8;
  if (!observation.forcedRacePath && cardTitle === 'cookieJar' && !observation.boostsBlocked) cost += 10;
  return cost;
}

// ai generated: A declaration adds the human's final draw to a plausible current five-card hand; Switcharoo uses that five-card hand directly.
function sampleOpponentTurnHand(observation: CpuObservation, cards: string[], random: () => number): string[] {
  const hand = sampleOpponentCurrentHand(observation, cards, random);
  if (hand.length < 5) return hand;
  const remaining = [...cards];
  // ai generated: A currently revealed hand is already excluded from the unseen deck; sampled hidden cards must be removed one copy at a time.
  if (observation.knownOpponentCards.length !== 5) {
    hand.forEach(card => {
      const index = remaining.indexOf(card);
      if (index !== -1) remaining.splice(index, 1);
    });
  }
  return [...hand, ...sampleWithoutReplacement(remaining, 1, random)];
}

// ai generated: Hidden hands reflect cards the human has deliberately kept, including occasional available leaders and matching race cards.
function sampleOpponentCurrentHand(observation: CpuObservation, cards: string[], random: () => number): string[] {
  const pool = [...cards];
  const currentlyKnown = observation.knownOpponentCards.slice(0, 5);
  if (currentlyKnown.length === 5) return currentlyKnown;

  // ai generated: Always-visible cards such as Brite anchor only their own slot; the CPU still samples the remaining hidden cards fairly.
  const hand = currentlyKnown.length > 0 ? currentlyKnown : observation.publicOpponentCards.slice(0, 5);
  const remembered = observation.rememberedOpponentCards.slice(0, 5);
  const rememberedRace = findDominantRace([...hand, ...remembered], observation.cardDetails);
  const age = observation.opponentMemoryAge ?? 99;

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
  // ai generated: By turn 15 a curated human hand can contain a rare leader; sample that possibility without assuming one every game.
  if (hand.length < 5 && targetRace && random() < Math.min(0.28, 0.16 + Math.max(0, observation.turnCount - 15) * 0.01)) {
    const leaders = pool
      .map((card, index) => ({ card, index }))
      .filter(candidate => observation.cardDetails[candidate.card]?.rarity === 'legendary'
        && cardHasRace(candidate.card, targetRace, observation.cardDetails));
    if (leaders.length > 0) {
      const leader = leaders[Math.floor(random() * leaders.length)];
      hand.push(...pool.splice(leader.index, 1));
    }
  }
  while (hand.length < 5 && pool.length > 0) {
    const chosenIndex = chooseWeightedCardIndex(pool, targetRace, observation.cardDetails, random);
    hand.push(...pool.splice(chosenIndex, 1));
  }

  return hand;
}

function rememberedCardRetentionChance(card: string, rememberedRace: string, observation: CpuObservation, age = observation.opponentMemoryAge ?? 99): number {
  const isSticky = strategicallyStickyCards.includes(card);
  const matchesRememberedRace = rememberedRace !== '' && cardHasRace(card, rememberedRace, observation.cardDetails);
  const retentionPerTurn = isSticky ? 0.97 : matchesRememberedRace ? 0.90 : 0.75;
  const minimumRetention = isSticky ? 0.55 : matchesRememberedRace ? 0.20 : 0.05;
  return Math.max(minimumRetention, Math.pow(retentionPerTurn, age));
}

// ai generated: Only the eight scoring races define a synergy direction; boosts, traps, and neutrals remain possible off-path cards.
function getStrategicRace(card: string, details: CpuCardDetails): string {
  const scoringRaces = Object.values(raceCards);
  const cardInfo = details[card];
  if (!cardInfo) return '';
  return [cardInfo.race, ...cardInfo.otherRaces].find(race => scoringRaces.includes(race)) ?? '';
}

function findDominantRace(cards: string[], details: CpuCardDetails): string {
  const counts = new Map<string, number>();
  cards.forEach(card => {
    const race = getStrategicRace(card, details);
    if (race) counts.set(race, (counts.get(race) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

function chooseWeightedCardIndex(cards: string[], targetRace: string, details: CpuCardDetails, random: () => number): number {
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
