# Gobbledegook Singleplayer CPU

This document is the source of truth for the balanced singleplayer CPU. “CPU” means the computer-controlled opponent, “Bot” means the card race, and “A.I.” means the A.I. card.

## Starting a game

The mode selector is in the connected-users panel. Singleplayer is local: it does not connect to `server.js`. The human remains Player 1 and presses **Ready** when they want the round to begin. The CPU is Player 2 and receives a random name from the small `cpuNames` array in `Game.svelte`. The host can click either connected-user name to rename themselves or the CPU.

Multiplayer continues to use the Socket.IO server. Switching modes is allowed only between rounds because the selector is shown while the game is over. The server remembers each connected player's ready state, so someone joining or returning from singleplayer sees the correct `0/2` or `1/2` count.

## Files

- `src/lib/game/cpuStrategy.ts` contains both the CPU's strategy and card-counting knowledge model. They are separated into functions and comments rather than separate files for now.
- `src/lib/components/Game.svelte` owns local turn timing, builds fair observations, calls the real scoring functions on cloned players, and performs the selected action.
- `src/lib/game/cpuStrategy.test.mjs` tests the most important strategy decisions without starting Svelte or the server.

## What the CPU knows

The CPU may use:

- Its own hand, status effects, draws, and discards.
- Public discards and effects.
- The original deck composition and the cards that a card-counting human could eliminate from it.
- The human hand while Spirit King, Vision, or Exposed legitimately reveals it.
- A human-held Brite because Brite is publicly visible, without treating the other four cards as revealed. Darqnos remains the normal visibility exception.
- The human hand inferred from the exact remaining deck while the CPU holds an unblocked Gaze.
- Which race decks remain available.

The CPU does not directly inspect the human's hidden hand for a decision. A legitimately learned hand is stored with its source and turn number. Once hidden again, remembered cards become less certain on each later human turn; leaders and cards matching the previously observed strategy are treated as more likely to have been retained. This age is independent of the game counter, so Tick Tock and Tock Tick do not make memory artificially newer or older. A public discard or other state change that makes a remembered card impossible removes it from plausible samples.

Without a current or remembered hand, the human's five cards remain in the same unknown pool as the deck. Declaration samples receive a modest same-race bias at turn 15 and later because a real player has been selecting cards for synergy rather than keeping five unrelated random cards. Some samples include an available matching-race legendary; many do not. The sampler cannot invent a legendary that is no longer in the unseen pool.

## How a discard is chosen

After drawing, the strategy tries every card as the possible discard. For every resulting five-card hand it:

1. Runs the existing authoritative game scoring functions on `structuredClone` copies of both players.
2. Compares Human, Goblin, Elf, Dwarf, Beast, Bot, Xeno, Spirit, and Cookie paths.
3. Adds modest future value for cards that can still be drawn and for a hand already concentrated in one race.
4. Protects leaders and high-value setup cards from casual discards.
5. Uses rarity only as a tiny tie-breaker between scoring-race cards. Boost, trap, and neutral rarity gives no automatic retention value; those cards are judged by useful effects and paths instead.
6. Chooses the highest combined immediate score, main path value, and a small share of the second-best path value.

The backup path is recomputed for every possible post-discard hand. Its utility has a 12% weight, so the CPU can preserve a promising second route without abandoning a clearly stronger main route. Race leaders receive meaningful retention value, including Night Terror. A Jar with zero or one Cookie-compatible card is only a weak lottery setup; the CPU resists discarding a race leader just to make a bare-Jar bonus-only hand. The previous primary and backup labels are remembered for debug purposes, not locked in. A race-name testing cheat still forces its named primary path; the backup is logged but does not influence that forced choice.

The strategy has explicit awareness of Emperor flexibility, the Goblin Lord/Warchief/Mark route, Elf King, forced Dwarf draws, matching Red/Blue Spirit lottery hands, Cookie Jar hands, and the effect of Neutralize. Red/Blue Djinn lottery potential only starts with three matching cards and depends on a matching card still being drawable. Active Infect modestly lowers non-Spirit paths as its penalty grows; Spirits remain immune. An unblocked Charge modestly improves the future Human and Bot paths. The real scorer still determines today's points.

### Longbeard's discarded Dwarves

When considering a discard, the CPU scores a cloned player with that proposed card added to its discard pile. Longbeard therefore receives the same +5 from a discarded Dwarf that the real game awards after the discard. A Dwarf printed at 5 points breaks even or improves the Dwarf total when recycled, while one below 5 improves it; the CPU also avoids treating such a recycled card as lost Dwarf-path progress. This is a preference, not an unconditional rule: another race path, a card's ability, or a stronger immediate hand can still justify keeping the Dwarf. The simulation does not alter the real discard pile before the CPU acts.

### Cookie Jar path

The Cookie path distinguishes a Boost/Neutral-only hand with a Jar (+40, including Bots) from the exact one-Jar-and-four-Cookie-compatible-cards hand (+100, including Bots). Leon can stand in for a Cookie, while Cookie Crumbs and other Boosts or Neutrals can qualify for the +40 hand but not the +100 hand. Any Trap still in hand prevents both bonuses; previously discarded Traps do not. A bare Jar or a single Cookie-compatible card adds no speculative setup value; two or more make the path worth considering, and three with a Jar create the strongest near-complete incentive. A blocked Jar has no current bonus.

The CPU estimates the chance of drawing a needed Cookie or Leon from their respective active decks. With a Jar and three Cookie-compatible cards, it values the fourth-card possibility and modestly raises its declaration threshold while one remains drawable. This encourages waiting but does not forbid a declaration when the present hand is already convincingly ahead. These estimates guide decisions; the authoritative game scorer still supplies the actual points.

Discarding Switcharoo at five cards is evaluated as a hand trade, not as keeping the CPU's old hand. If the human hand is revealed, the CPU scores those exact received cards. Otherwise it samples plausible hidden hands and includes a small uncertainty cost. The simulation gives the human the CPU's old five cards, so opposing A.I. and other hand-dependent effects are recalculated; evolving Xeno card values follow the transferred cards. A Switcharoo discard that leaves six cards does not trigger this hand-swap evaluation because the game will not swap yet.

Discarding Shuffler from six cards is evaluated as a full replacement, not as keeping the CPU's other five cards. The CPU samples five-card hands from cards it has not seen and applies a modest uncertainty cost, so it prefers a known strong hand over a speculative redraw. At seven cards, Shuffler is a safe ordinary discard. The actual replacement uses all remaining card types and has no immediate draw effects, except eggs still set up later hatching.

### Race-name testing cheat

Rename the CPU to the exact plural name of a scoring race to force that strategy path: `humans`, `goblins`, `elves`, `dwarves`, `beasts`, `bots`, `xenos`, or `spirits`. Matching is case-insensitive, so a name such as `spIriTs` works. Singular names, extra words, and `cookies` do not activate the cheat. While active, discard decisions and Gobbledegook checks use the forced race's score instead of quietly relying on a stronger off-race total.

Rename the CPU to exactly `test`, case-insensitively, to prevent it from declaring Gobbledegook. This is intended for manually testing longer games; every other CPU behavior remains active.

## A.I. card risk

When considering a Bot-race path, the CPU estimates the chance that the human holds the `ai` card. A visibly held A.I. means 100% risk. When the hand is hidden, risk is estimated from the number of A.I. cards still possible and the number of unknown opponent slots. The path loses utility in proportion to the Bot points that A.I. could steal.

The Gobbledegook declaration simulation also uses the real end-game scorer. Therefore, sampled human hands containing A.I. apply the actual point-stealing behavior instead of only a heuristic penalty.

## Boosts, traps, and Neutralize

The observation says whether the CPU's boosts are blocked by Corruption/Xeno Guard and whether its traps are blocked by Chastity/Rhino. The authoritative scorer already applies or ignores those effects correctly.

The strategy also checks whether Neutralize is still in the unseen pool. When boosts are blocked, a possible Neutralize gives a small recovery value; it is not treated as guaranteed. When traps are blocked, their current penalties are recognized as harmless. Cookie paths receive a strong penalty while boosts are blocked.

## Echo turns

When the CPU draws Echo as its sixth card, it immediately draws again to reach seven cards. At seven cards it discards Echo, draws a replacement back to seven, and then makes the two normal strategic discards needed to finish with five cards. In practice, Echo therefore gives the CPU two new non-Echo cards rather than consuming its normal draw. If a replacement is another Echo, the discard-and-replacement step repeats.

Human Echo behavior remains unchanged. Humans may choose whether to discard Echo first at seven cards and continue its draw chain, or discard a different card first and end the Echo effect.

## Declaring Gobbledegook

The CPU does not use a fixed rule such as “45 points is always enough.” Once declaration is unlocked at turn 15, it samples possible hidden human hands using current reveals, public cards such as Brite, aging Spirit King/Vision/Exposed/Gaze memory, and a modest human-synergy assumption. Some plausible hands include a matching legendary when one remains unseen. Each sampled human gets a final draw and is allowed to keep its best five, approximating the human's final turn after the CPU declares.

The base confidence threshold starts at 80% on turn 15 and gradually returns to 72% by turn 23. Scores at 20 or below require near-certainty (or strong current-hand knowledge); 21–34 points require extra caution; 35–69 points are treated as ordinary; 100+ points can declare at a somewhat lower confidence threshold. Active, unblocked Infect slightly lowers the threshold for a reasonable hand because its score will decay. Unblocked Charge slightly raises the threshold for a growing Human/Bot route under 100 points. A Jar with three Cookie-compatible cards also modestly raises the threshold while a fourth remains drawable. These are small decision adjustments, not changes to game scoring. A 500,000-point special hand still declares immediately. The default 240 samples are intentionally small enough to calculate immediately during the normal thinking delay.

## Timing and debug output

The CPU waits a random 650–2,199 ms before drawing and another 1,100–2,399 ms while holding six cards and considering its discard. The deliberate delay stays below five seconds; scoring usually takes only a small fraction of that time.

`cpuStrategyDebugEnabled` near the top of `Game.svelte` is the testing toggle. Set it to `false` to silence detailed console explanations. With it enabled, each turn logs:

- The current path.
- The secondary backup path, its utility, and its reasoning; it is informational only when a race-name cheat forces the primary path.
- The chosen discard and its calculated value.
- A snapshot of the CPU's current hand.
- The CPU's complete discard array for the round.
- An array of the CPU's current Human, Goblin, Elf, Dwarf, Beast, Bot, Xeno, and Spirit point totals.
- Whether boosts and traps are blocked.
- Whether Neutralize is still possible.
- The A.I. theft penalty when the Bot path is active.
- Infect and Charge growth considerations in the path and declaration explanations.
- Whether a Switcharoo trade used an exact revealed hand or sampled hidden hands.
- Whether Shuffler's replacement was compared with sampled unseen hands.
- Gobbledegook declaration win estimates.
- Currently revealed, publicly visible, or remembered opponent cards, along with their information source and age.
- The complete remembered opponent-hand array in every ordinary decision and Echo status log, even when that array is empty.
- Forced Echo discards and the extra draw they trigger.

## Running the tests

Use:

```sh
pnpm test:cpu
```

The tests use Node's built-in test runner. No test framework or server is required. They currently verify that the CPU:

- Preserves a concentrated Goblin path.
- Penalizes a Bot path when the opposing A.I. is known.
- Understands blocked boosts and possible Neutralize recovery.
- Declares when simulations are safely dominant.
- Never declares before turn 15.
- Applies opposing A.I. theft to the CPU's score inside declaration samples.
- Waits until seven cards before forcing the CPU's active Echo discard.
- Preserves legitimately observed opponent-hand memory through later decisions.
- Treats a remembered leader as a meaningful threat as the memory ages.
- Gives turn-15 hidden-hand samples modest race synergy.
- Anchors a publicly visible Brite while continuing to sample the rest of the hidden hand.
- Recognizes every case-insensitive plural race-name path override and rejects singular or extended names.
- Uses the forced race score, rather than a stronger off-race score, for Gobbledegook decisions.
- Prevents Gobbledegook declarations only when the CPU is named exactly `test`, case-insensitively.
- Scores a Switcharoo discard using the hand received from the human, with either exact or sampled knowledge.
- Evaluates Shuffler as a full redraw rather than pretending the old hand survives.
- Uses rarity only for close discard choices.
- Makes low-score declarations cautious and accounts for active Infect and Charge growth.
- Preserves a viable backup route in balanced discard decisions without weakening forced race-name testing.
- Distinguishes Cookie Jar's +40 bonus, exact +100 hand, Cookie Crumbs, and the chance of drawing a fourth Cookie before declaring.
- Scores each proposed discard in a cloned discard pile so Longbeard can bank +5 for a weak Dwarf.

For deterministic future tests, pass a fixed random function to the strategy functions, as the current tests do. Add a focused test whenever a new card changes which discard, path, or declaration should be preferred.

## Current scope

There is one normal balanced personality. Difficulty settings are intentionally deferred. The first implementation prioritizes understandable decisions and reuse of the real scoring rules over a perfect opponent or a large architecture rewrite.

## Future refinements

- Monitor whether the new backup weighting is enough to preserve paired Elf Twins in real games.
- Consider growing Xenos alongside Charge in future timing decisions.
- Continue tuning unusual card abilities (such as Rhino and Xeno Guard) after real-game testing.
