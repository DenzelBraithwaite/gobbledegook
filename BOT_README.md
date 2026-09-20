# Gobbledegook Singleplayer Bot

This document is the source of truth for the balanced singleplayer bot. When the bot's rules, knowledge, priorities, or debug controls change, update this file with the code.

## Starting a game

The mode selector is in the connected-users panel. Singleplayer is local: it does not connect to `server.js`. The human remains Player 1 and presses **Ready** when they want the round to begin. Player 2 is assigned a random name from the small `botNames` array in `Game.svelte`. The host can click either connected-user name to rename themselves or the bot.

Multiplayer continues to use the Socket.IO server. Switching modes is allowed only between rounds because the selector is shown while the game is over. The server remembers each connected player's ready state, so someone joining or returning from singleplayer sees the correct `0/2` or `1/2` count.

## Files

- `src/lib/game/botStrategy.ts` contains both the bot's strategy and card-counting knowledge model. They are separated into functions and comments rather than separate files for now.
- `src/lib/components/Game.svelte` owns local turn timing, builds fair observations, calls the real scoring functions on cloned players, and performs the selected action.
- `src/lib/game/botStrategy.test.mjs` tests the most important strategy decisions without starting Svelte or the server.

## What the bot knows

The bot may use:

- Its own hand, status effects, draws, and discards.
- Public discards and effects.
- The original deck composition and the cards that a card-counting human could eliminate from it.
- The human hand while Spirit King, Vision, or Exposed legitimately reveals it.
- The human hand inferred from the exact remaining deck while the bot holds an unblocked Gaze.
- Which race decks remain available.

The bot does not directly inspect the human's hidden hand for a decision. A legitimately learned hand is stored with its source and turn number. Once hidden again, remembered cards become less certain on each later human turn; leaders and cards matching the previously observed strategy are treated as more likely to have been retained. This age is independent of the game counter, so Tick Tock and Tock Tick do not make memory artificially newer or older. A public discard or other state change that makes a remembered card impossible removes it from plausible samples.

Without a current or remembered hand, the human's five cards remain in the same unknown pool as the deck. Declaration samples receive a modest same-race bias at turn 15 and later because a real player has been selecting cards for synergy rather than keeping five unrelated random cards.

## How a discard is chosen

After drawing, the strategy tries every card as the possible discard. For every resulting five-card hand it:

1. Runs the existing authoritative game scoring functions on `structuredClone` copies of both players.
2. Compares Human, Goblin, Elf, Dwarf, Beast, Bot, Xeno, Spirit, and Cookie paths.
3. Adds modest future value for cards that can still be drawn and for a hand already concentrated in one race.
4. Protects leaders and high-value setup cards from casual discards.
5. Chooses the highest combined immediate score and future path value.

The strategy has explicit awareness of Emperor flexibility, the Goblin Lord/Warchief/Mark route, Elf King, forced Dwarf draws, matching Red/Blue Spirit lottery hands, Cookie Jar hands, and the effect of Neutralize.

## A.I. card risk

When considering a Bot-race path, the bot estimates the chance that the human holds the `ai` card. A visibly held A.I. means 100% risk. When the hand is hidden, risk is estimated from the number of A.I. cards still possible and the number of unknown opponent slots. The path loses utility in proportion to the Bot points that A.I. could steal.

The Gobbledegook declaration simulation also uses the real end-game scorer. Therefore, sampled human hands containing A.I. apply the actual point-stealing behavior instead of only a heuristic penalty.

## Boosts, traps, and Neutralize

The observation says whether the bot's boosts are blocked by Corruption/Xeno Guard and whether its traps are blocked by Chastity/Rhino. The authoritative scorer already applies or ignores those effects correctly.

The strategy also checks whether Neutralize is still in the unseen pool. When boosts are blocked, a possible Neutralize gives a small recovery value; it is not treated as guaranteed. When traps are blocked, their current penalties are recognized as harmless. Cookie paths receive a strong penalty while boosts are blocked.

## Echo turns

When the bot draws Echo as its sixth card, it immediately draws again to reach seven cards. At seven cards it discards Echo, draws a replacement back to seven, and then makes the two normal strategic discards needed to finish with five cards. In practice, Echo therefore gives the bot two new non-Echo cards rather than consuming its normal draw. If a replacement is another Echo, the discard-and-replacement step repeats.

Human Echo behavior remains unchanged. Humans may choose whether to discard Echo first at seven cards and continue its draw chain, or discard a different card first and end the Echo effect.

## Declaring Gobbledegook

The bot does not use a fixed rule such as “45 points is always enough.” Once declaration is unlocked at turn 15, it samples possible hidden human hands using current reveals, aging Spirit King/Vision/Exposed/Gaze memory, and a modest human-synergy assumption. Each sampled human gets a final draw and is allowed to keep its best five, approximating the human's final turn after the bot declares.

The declaration threshold starts at 80% on turn 15 and gradually returns to 72% by turn 23. It relaxes slightly near the end of the deck only from turn 25 onward. A 500,000-point special hand declares immediately. The default 240 samples are intentionally small enough to calculate immediately during the normal thinking delay.

## Timing and debug output

The bot waits a random 650–2,199 ms before drawing and another 1,100–2,399 ms while holding six cards and considering its discard. The deliberate delay stays below five seconds; scoring usually takes only a small fraction of that time.

`botStrategyDebugEnabled` near the top of `Game.svelte` is the testing toggle. Set it to `false` to silence detailed console explanations. With it enabled, each turn logs:

- The current path.
- The chosen discard and its calculated value.
- A snapshot of the bot's current hand.
- The bot's complete discard array for the round.
- An array of the bot's current Human, Goblin, Elf, Dwarf, Beast, Bot, Xeno, and Spirit point totals.
- Whether boosts and traps are blocked.
- Whether Neutralize is still possible.
- The A.I. theft penalty when the Bot path is active.
- Gobbledegook declaration win estimates.
- The currently known or remembered opponent hand, its information source, and its age.
- Forced Echo discards and the extra draw they trigger.

## Running the tests

Use:

```sh
pnpm test:bot
```

The tests use Node's built-in test runner. No test framework or server is required. They currently verify that the bot:

- Preserves a concentrated Goblin path.
- Penalizes a Bot path when the opposing A.I. is known.
- Understands blocked boosts and possible Neutralize recovery.
- Declares when simulations are safely dominant.
- Never declares before turn 15.
- Applies opposing A.I. theft to the bot's score inside declaration samples.
- Waits until seven cards before forcing the bot's active Echo discard.
- Preserves legitimately observed opponent-hand memory through later decisions.
- Treats a remembered leader as a meaningful threat as the memory ages.
- Gives turn-15 hidden-hand samples modest race synergy.

For deterministic future tests, pass a fixed random function to the strategy functions, as the current tests do. Add a focused test whenever a new card changes which discard, path, or declaration should be preferred.

## Current scope

There is one normal balanced personality. Difficulty settings are intentionally deferred. The first implementation prioritizes understandable decisions and reuse of the real scoring rules over a perfect opponent or a large architecture rewrite.
