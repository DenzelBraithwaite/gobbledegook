// ai generated: Both the local game and the multiplayer server use the same inclusive turn range.
export const minimumGdgTurn = 10;
export const maximumGdgTurn = 25;

export function rollGdgUnlockTurn(random = Math.random) {
  const roll = Math.max(0, Math.min(random(), 1 - Number.EPSILON));
  return minimumGdgTurn + Math.floor(roll * (maximumGdgTurn - minimumGdgTurn + 1));
}

// ai generated: Once GDG has been declared, the opponent's final-turn button remains available.
export function isGdgUnlocked(turnCount, unlockTurn, alreadyDeclared = false) {
  if (alreadyDeclared) return true;
  if (unlockTurn < minimumGdgTurn || unlockTurn > maximumGdgTurn) return false;
  return turnCount >= unlockTurn;
}
