// ai generated: Draw effects can replace a store object, so later scoring must use its current value.
export function resolveCurrentPlayer<Player extends { id: string | undefined }>(
  player: Player,
  first: Player,
  second: Player
): Player {
  if (player === first || (player.id !== undefined && player.id === first.id)) return first;
  if (player === second || (player.id !== undefined && player.id === second.id)) return second;
  return player;
}

// ai generated: Refresh locally owned race totals after state changes; only a real new turn supplies advance.
export function refreshRaceScores<Player>({
  first,
  second,
  score,
  publish,
  advance,
  refreshSecond = true
}: {
  first: Player;
  second: Player;
  score: (player: Player, otherPlayer: Player) => void;
  publish: () => void;
  advance?: (player: Player) => void;
  refreshSecond?: boolean;
}): void {
  if (advance) {
    advance(first);
    advance(second);
  }

  score(first, second);
  // ai generated: In multiplayer, only the opponent's browser knows its current dynamic Xeno values.
  if (refreshSecond) score(second, first);
  publish();
}
