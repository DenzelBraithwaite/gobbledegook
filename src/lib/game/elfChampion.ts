// ai generated: Champion ascends only on its real draw if Elf King is already absent from the Elf deck.
export function shouldAscendElfChampion(cardDrawn: string, elfDeck: readonly string[]): boolean {
  return cardDrawn === 'elfChampion' && !elfDeck.includes('elfKing');
}

// ai generated: Giraffe and Xeno evolutions keep priority; otherwise an ascended held Champion forces Elf draws while Elves remain.
export function shouldForceElfDraw(
  ascended: boolean,
  hand: readonly string[],
  elfDeck: readonly string[],
  currentDeck: string
): boolean {
  if (['giraffe', 'xenoEgg'].includes(currentDeck)) return false;
  return ascended && hand.includes('elfChampion') && elfDeck.length > 0;
}

export function hasAscendedElfChampion(ascended: boolean, hand: readonly string[]): boolean {
  return ascended && hand.includes('elfChampion');
}
