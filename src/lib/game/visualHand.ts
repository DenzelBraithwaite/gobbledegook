// ai generated: These keys identify only rendered copies, never cards in Player.hand or socket messages.
export type VisualCard = { title: string; key: number };

// ai generated: Preserve existing card views and explicitly drop the clicked duplicate when its title count decreases.
export function reconcileVisualHand(previous: VisualCard[], hand: string[], clickedKey: number | null, lastKey: number) {
  const clickedCard = previous.find(card => card.key === clickedKey);
  const clickedTitleWasRemoved = clickedCard && previous.filter(card => card.title === clickedCard.title).length
    > hand.filter(card => card === clickedCard.title).length;
  const available = clickedTitleWasRemoved ? previous.filter(card => card.key !== clickedKey) : [...previous];
  const cards = hand.map(title => {
    const matchingIndex = available.findIndex(card => card.title === title);
    return matchingIndex === -1 ? { title, key: ++lastKey } : available.splice(matchingIndex, 1)[0];
  });
  return { cards, lastKey };
}

// ai generated: Ordinary clicks remove their exact hand slot; forced discards and CPU choices still resolve by card name.
export function findDiscardIndex(hand: string[], cardTitle: string, clickedHandIndex?: number): number {
  return clickedHandIndex !== undefined && hand[clickedHandIndex] === cardTitle
    ? clickedHandIndex : hand.indexOf(cardTitle);
}
