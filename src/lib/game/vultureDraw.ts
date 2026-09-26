// ai generated: Select the same non-Beast outcome as rerolling a deck, then a card, until Scraps allows it.
export function selectNonBeastDraw(
  deckTypes: string[],
  fullDeck: Record<string, string[]>,
  isBeast: (card: string) => boolean,
  random: () => number = Math.random
): { deck: string; card: string } | null {
  const choices = deckTypes.flatMap(deck => {
    const cards = fullDeck[deck] ?? [];
    if (cards.length === 0) return [];

    // ai generated: Elf Champion overrides the usual random Elf pick, so preserve that rule on a reroll.
    const forcedChampion = deck === 'elves' && cards.includes('elfChampion');
    const eligibleCards = forcedChampion ? ['elfChampion'] : cards.filter(card => !isBeast(card));
    if (eligibleCards.length === 0) return [];
    return [{ deck, cards: eligibleCards, weight: forcedChampion ? 1 : eligibleCards.length / cards.length }];
  });

  // ai generated: A Beast-only remaining deck cannot satisfy Scraps; the original Beast draw is allowed instead.
  if (choices.length === 0) return null;
  const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
  let roll = random() * totalWeight;
  for (const choice of choices) {
    roll -= choice.weight;
    if (roll < 0) return { deck: choice.deck, card: choice.cards[Math.floor(random() * choice.cards.length)] };
  }
  const lastChoice = choices[choices.length - 1];
  return { deck: lastChoice.deck, card: lastChoice.cards[lastChoice.cards.length - 1] };
}
