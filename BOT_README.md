# Gobbledegook Singleplayer Bot

This document is the source of truth for the balanced singleplayer bot. When the bot's rules, knowledge, priorities, or debug controls change, update this file with the code.

## Starting a game

The mode selector is in the connected-users panel. Singleplayer is local: it does not connect to `server.js`. The human remains Player 1 and presses **Ready** when they want the round to begin. Player 2 is assigned a random name from the small `botNames` array in `Game.svelte`. The host can click either connected-user name to rename themselves or the bot.

Multiplayer continues to use the Socket.IO server. Switching modes is allowed only between rounds because the selector is shown while the game is over. The server remembers each connected player's ready state, so someone joining or returning from singleplayer sees the correct `0/2` or `1/2` count.

## Files

- `src/lib/game/botStrategy.ts` contains both the bot's strategy and card-counting knowledge model. They are separated into functions and comments rather than separate files for now.
- `src/lib/components/Game.svelte` owns local turn timing, builds fair observations, calls the real scoring functions on cloned players, and performs the selected action.
- `src/lib/components/BotInfo.svelte` is the small in-game A.I. explanation modal.
- `src/lib/game/botStrategy.test.mjs` tests the most important strategy decisions without starting Svelte or the server.

## What the bot knows

The bot may use:

- Its own hand, status effects, draws, and discards.
- Public discards and effects.
- The original deck composition and the cards that a card-counting human could eliminate from it.
- The human hand only while Spirit King, Vision, or Exposed legitimately reveals it.
- Which race decks remain available.

The bot does not directly inspect the human's hidden hand for a decision. When the hand is hidden, the human's five cards are included in the same unknown pool as cards still in the deck. This produces the same remaining possibilities that a careful card counter could derive.

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

## Declaring Gobbledegook

The bot does not use a fixed rule such as “45 points is always enough.” Once declaration is unlocked at turn 15, it samples possible hidden human hands from the fair unseen pool. Each sampled human gets six cards and is allowed to keep its best five, approximating the human's final turn after the bot declares.

The bot declares when its estimated win chance reaches roughly 72%. That threshold relaxes slightly near the end of the deck. A 500,000-point special hand declares immediately. The default 240 samples are intentionally small enough to calculate immediately during the normal thinking delay.

## Timing and debug output

The bot waits a random 650–2,199 ms before drawing and another 1,100–2,399 ms while holding six cards and considering its discard. The deliberate delay stays below five seconds; scoring usually takes only a small fraction of that time.

`botStrategyDebugEnabled` near the top of `Game.svelte` is the testing toggle. Set it to `false` to silence detailed console explanations. With it enabled, each turn logs:

- The current path.
- The chosen discard and its calculated value.
- A snapshot of the bot's current hand.
- The bot's complete discard array for the round.
- Whether boosts and traps are blocked.
- Whether Neutralize is still possible.
- The A.I. theft penalty when the Bot path is active.
- Gobbledegook declaration win estimates.

The A.I. side button opens the same current path and a shorter explanation in the game UI.

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

For deterministic future tests, pass a fixed random function to the strategy functions, as the current tests do. Add a focused test whenever a new card changes which discard, path, or declaration should be preferred.

## Current scope

There is one normal balanced personality. Difficulty settings are intentionally deferred. The first implementation prioritizes understandable decisions and reuse of the real scoring rules over a perfect opponent or a large architecture rewrite.
