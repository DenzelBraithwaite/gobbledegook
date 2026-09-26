export type OngoingEffectState = {
  chargePoints: number;
  growthPoints: number;
  infectPoints: number;
  numOfCharges: number;
  numOfGrowths: number;
  numOfInfects: number;
};

// ai generated: Blocked effects keep their earned totals but gain nothing this turn; Neutralize handles permanent clearing separately.
export function advanceOngoingEffects(player: OngoingEffectState, boostsBlocked: boolean, trapsBlocked: boolean): void {
  if (!boostsBlocked) {
    player.chargePoints += player.numOfCharges;
    player.growthPoints += player.numOfGrowths;
  }

  if (!trapsBlocked) player.infectPoints += player.numOfInfects;
}
