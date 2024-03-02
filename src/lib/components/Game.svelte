<script>
  // Hooks
  import { onMount } from 'svelte';

  // Transitions
  import { fade } from 'svelte/transition';

  // Stores
  import { player1, player1Reset, player2, player2Reset, cardDetails, beastDeck, botDeck, dwarfDeck, elfDeck, goblinDeck, humanDeck, xenoDeck, boostDeck,  trapDeck, neutralDeck } from '../stores';

  // Custom components
  import { Button, Library, Spinner, RacePoints } from './index';
  import GGCard from './Card.svelte';

  // Websocket
  import { io } from 'socket.io-client';
  // import { emitKeypressEvents } from 'readline';

  // let socket = io('http://10.3.144.164:6912'); // HO
  // let socket = io('http://192.168.2.10:6912'); // Thanos
  // let socket = io('http://192.168.2.21:6912'); // MacBook
  let socket = io('http://192.168.2.51:6912'); // Mat's place
  let gobbledegookDeclared = false;
  let gobbledegookDisabled = false;
  let startBtnDisabled = false;
  let gameOver = true;
  let winMessage = '';
  let loseMessage = '';
  let turnCount = 0;
  let showSpinner = false;
  let eventMessage = '';
  let libraryVisible = false;
  let showEventMessage = false;
  let remoteCardDetails = {...$cardDetails}; // This is because deckDetails will differ between client and remote, e.g. voidRunner.
  // Deck players draw from, includes all race decks
  let fullDeck = {
    beasts: [...$beastDeck],
    bots: [...$botDeck],
    dwarves: [...$dwarfDeck],
    elves: [...$elfDeck],
    goblins: [...$goblinDeck],
    humans: [...$humanDeck],
    xenos: [...$xenoDeck],
    boosts: [...$boostDeck],
    traps: [...$trapDeck],
    neutrals: [...$neutralDeck]
  };
  // array for each deck, humans, goblins, elves and dwarves
  let deckTypes = Object.keys(fullDeck);
  
  onMount(() => {
    // Handles connects
    socket.on('connect', () => console.log(`User ID: ${socket.id} connected!`));

    // Handles connection errors
    socket.on('connect_error', error => console.error('Connection error:', error));

    // Sets users (Beware that p1 might be titled player 2 and vice versa due to server.js)
    socket.on('set-users', users => {
      Object.entries(users).forEach(([username, userId]) => {
        player1.update($player1 => {
          $player1.id = users['p1'];
          return $player1;
        });
        player1Reset.set({...$player1});

        player2.update($player2 => {
          $player2.id = users['p2'];
          return $player2;
        });
        player2Reset.set({...$player2});

        // TODO: Handle guests.
      }); 
    });

    // Resets game and updates player hands
    socket.on('game-started', data => {
      resetGame();

      // Update player hands
      player1.set(data.player1);
      player2.set(data.player2);
      fullDeck = {...data.fullDeck};
    });

    // Counts turns
    socket.on('add-turn-count', () => turnCount++);

    // Handles turn change for all users
    socket.on('turn-changed', data => {
      player1.update($player1 => {
        $player1.turn = !data.player1.turn;
        $player1.playingTwice = false;
        $player1.hasVision = false;
        return $player1;
      });

      player2.update($player2 => {
        $player2.turn = !data.player2.turn;
        $player2.playingTwice = false;
        $player2.hasVision = false;
        return $player2;
      });
    });

    // Increase turn count
    socket.on('turn-count-increased', () => turnCount += 3);

    // Handles card draw for all users
    socket.on('card-drawn', data => {
      fullDeck = {...data.fullDeck};
      deckTypes = data.deckTypes;

      // Make sure player's (hands) are consistent.
      player1.set(data.player1);
      player2.set(data.player2);
    });

    // Handles cards that make players swap hands
    socket.on('hands-swapped', data => {
      player1.set(data.player1);
      player2.set(data.player2);
    });

    // Handles neutralize card
    socket.on('deck-neutralized', () => neutralizeDeck());

    // Handles displaying events
    socket.on('event-displayed', card => showEvent(card));

    // Handles card discard for all users
    socket.on('card-discarded', data => {
      player1.set(data.player1);
      player2.set(data.player2);
    });

    // Handles gobbledegook declaration for all users
    socket.on('gdg-declared', () => gobbledegookDeclared = true);

    // Handles first server reply for xeno updates (like 3 way handshake pt 1)
    socket.on('end-game-sync-started', data => {
      // The goal is to update the remote player's xeno points (since they will differ)
      if (playingAs() === 'p1') player2.set(data.player2);
      if (playingAs() === 'p2') player1.set(data.player1);

      // Update remote client's remote deck, then send their deck to the client that started the handshake so they can update their remote deck
      remoteCardDetails = {...data.cardDetails};

      // For guests TODO: test later
      // if (!['p1', 'p2'].includes(playingAs())) {
      //   player1.set(data.player1);
      //   player2.set(data.player2);
      // }

      // Make sure client who initiated the update gets their data updated as well.
      socket.emit('finish-end-game-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
    });

    // Handles last server reply for xeno updates (like 3 way handshake pt 2)
    socket.on('end-game-sync-finished', data => {
      // The goal is to update the remote player's xeno points (since they will differ)
      player1.set(data.player1);
      player2.set(data.player2);
      remoteCardDetails = {...data.cardDetails};

      // For guests TODO: test later
      // if (!['p1', 'p2'].includes(playingAs())) {
      //   player1.set(data.player1);
      //   player2.set(data.player2);
      // }
    });

    // Handles game end for all users
    socket.on('game-ended', data => endGame());

    // Lets server know client is ready.
    socket.emit('client-ready');
  });

  // Ends current round
  function endGame() {
    gameOver = true;
    startBtnDisabled = false;
    gobbledegookDisabled = true;
    
    player1.update($player1 => {
      $player1.turn = false;
      return $player1;
    });
    player2.update($player2 => {
      $player2.turn = false;
      return $player2;
    });

    calculateTotalPoints($player1, $player2);
    calculateTotalPoints($player2, $player1);
    console.log({p1: $player1, p2: $player2});
    determineWinner();

    // Loggs decks to console
    showDeck();
    showDeck(true);
    console.log($player1, $player2);
  }

  // Resets values to restart the game.
  function resetGame() {
    // Reset p1
    player1.set({...$player1Reset});
    // Reset p2
    player2.set({...$player2Reset});

    // Reset Deck
    fullDeck = {
      beasts: [...$beastDeck],
      bots: [...$botDeck],
      dwarves: [...$dwarfDeck],
      elves: [...$elfDeck],
      goblins: [...$goblinDeck],
      humans: [...$humanDeck],
      xenos: [...$xenoDeck],
      boosts: [...$boostDeck],
      traps: [...$trapDeck],
      neutrals: [...$neutralDeck]
    };
    $cardDetails['warpstalker'].points = 0;
    $cardDetails['voidRunner'].points = 0;
    deckTypes = Object.keys(fullDeck);
    remoteCardDetails = {...$cardDetails};

    // General resets
    turnCount = 0;
    gameOver = false;
    startBtnDisabled = true;
    gobbledegookDeclared = false;
    gobbledegookDisabled = false;
    winMessage = '';
  }
  
  // Initiaties a new round
  function startGame() {
    resetGame();
    
    // Start
    dealCards($player1);
    dealCards($player2);
    decideFirstPlayer();

    // Send data to websocket server
    socket.emit('start-game', {player1: $player1, player2: $player2, fullDeck});
  }

  // Ensures player 1 isn't always first to start
  function decideFirstPlayer() {
    const num = Math.ceil(Math.random() * 2);
    if (num === 1) {
      $player1.playedFirst = true;
      $player1.turn = true;
      $player2.turn = false;
    } else {
      $player2.playedFirst = true;
      $player1.turn = false;
      $player2.turn = true;
    }
  }

  // Counts if 1 full turn has passed
  function calculateNewTurn(player) {
    // Not a new turn if player got echo and is drawing/discarding more cards. Must wait for actual turn change.
    if (player.playingTwice) return;
    if (player.hand.length >= 6) return;
    if (($player1.playedFirst && $player1.turn) || ($player2.playedFirst && $player2.turn)) socket.emit('new-turn');
  }

  // Logs how many cards are left in the deck
  function showDeck(allDecks = false) {
    const beastCardsLeft = fullDeck['beasts'] ? fullDeck['beasts'].length : 0;
    const botCardsLeft = fullDeck['bots'] ? fullDeck['bots'].length : 0;
    const dwarfCardsLeft = fullDeck['dwarves'] ? fullDeck['dwarves'].length : 0;
    const elfCardsLeft = fullDeck['elves'] ? fullDeck['elves'].length : 0;
    const goblinCardsLeft = fullDeck['goblins'] ? fullDeck['goblins'].length : 0;
    const humanCardsLeft = fullDeck['humans'] ? fullDeck['humans'].length : 0;
    const xenoCardsLeft = fullDeck['xenos'] ? fullDeck['xenos'].length : 0;
    const boostCardsLeft = fullDeck['boosts'] ? fullDeck['boosts'].length : 0;
    const trapCardsLeft = fullDeck['traps'] ? fullDeck['traps'].length : 0;
    const neutralCardsLeft = fullDeck['neutrals'] ? fullDeck['neutrals'].length : 0;

    if (allDecks) {
      console.log(`Cards remaining per deck:\n
      Beasts: ${beastCardsLeft}\n
      Humans: ${humanCardsLeft}\n
      Goblins: ${goblinCardsLeft}\n
      Elves: ${elfCardsLeft}\n
      Dwarves: ${dwarfCardsLeft}\n)
      Bots: ${botCardsLeft}\n)
      Xenos: ${xenoCardsLeft}\n)
      Boosts: ${boostCardsLeft}\n)
      Traps: ${trapCardsLeft}\n)
      Neutrals: ${neutralCardsLeft}\n`);
    } else {
      const cardsLeft = humanCardsLeft + goblinCardsLeft + elfCardsLeft + dwarfCardsLeft + botCardsLeft + beastCardsLeft + xenoCardsLeft + boostCardsLeft + trapCardsLeft + neutralCardsLeft;
      console.log(`Cards remaining in deck: ${cardsLeft}`);
    }
  }

  // Determine if it is the player's turn or not
  function isPlayerTurn() {
    if ($player1.id === socket.id && $player1.turn) return true;
    if ($player2.id === socket.id && $player2.turn) return true;
    return false;
  }

  // Determine's if the player is p1, p2 or guest
  function playingAs() {
    if ($player1.id === socket.id) return 'p1';
    if ($player2.id === socket.id) return 'p2';
    return 'guest';
  }

  // Determines if card should be visible or not
  function isCardVisible(playerSide) {
    if (gameOver) return true;
    if (playingAs() === 'guest') return true;
    if (playingAs() === 'p1' && playerSide === 'p1') return true;
    if (playingAs() === 'p2' && playerSide === 'p2') return true;

    // player has vision?
    return false;
  }

  // Changes active player turn
  function changeTurns() {
    socket.emit('change-turns', {player1: $player1, player2: $player2});
  }

  // Deals 5 cards to each player at the start of the round
  function dealCards(player) {
    // Make sure hand is empty
    player.hand = [];
    
    for(let counter = 1; counter <= 5; counter++) {
      // Grab random deck 
      let randomNum = Math.floor(Math.random() * deckTypes.length);
      let currentDeck = deckTypes[randomNum];

      // Grab random card from that deck
      randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
      const cardDrawn = fullDeck[currentDeck][randomNum];

      const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
      fullDeck[currentDeck].splice(removedCardIndex, 1);

      // Add to player's hand
      player.hand.push(cardDrawn);

      // If the card is a trap that triggers even without being drawn, handle it.
      if (['corruption'].includes(cardDrawn)) addTrapCard(player, cardDrawn);

      // If the card is a boost that triggers even without being drawn, handle it.
      if (['chastity'].includes(cardDrawn)) addBoostCard(player, cardDrawn);

      // If the card is a neutral that triggers even without being drawn, handle it.
      if (['switcharoo'].includes(cardDrawn)) addneutralCard(player, cardDrawn);
    }

    // Need to reassign for svelte to be reactive
    if ($player1 === player) {
      player1.update($player1 => {
        $player1.hand = player.hand;
        $player1.startingHand = player.hand;
        return $player1;
      });
    } else {
      player2.update($player2 => {
        $player2.hand = player.hand;
        $player2.startingHand = player.hand;
        return $player2;
      });
    }
  }

  // Draws and removes 1 random card from the deck
  function drawCard(player, newTurn = true) {
    if (gameOver) return;
    if (newTurn) calculateNewTurn(player);
    let currentDeck = '';
    let cardDrawn = '';
    let randomNum = 0;

    // Player can't declare gobbledegook if they drew that turn
    gobbledegookDisabled = true;

    // If new turn and player was recently exposed, remove it, not when use draws echo and keeps drawing.
    if (newTurn && player.hand.length === 5) player.isExposed = false;

    // Player can't draw when he has more than 5 cards unless due to echo. Player can't draw more than 7 cards (echo + 1)
    if ((player.hand.length > 5 && !player.playingTwice) || player.hand.length >= 7) return;
    
    // Determines if the next card will be a dwarf or just a random deck.
    if (player.dwarfNextTurn) {
      currentDeck = isDwarfNext(player);
    } else {
      // If no remaining dwarves, random deck 
      randomNum = Math.floor(Math.random() * deckTypes.length);
      currentDeck = deckTypes[randomNum];
    }

    // When the last card is drawn, currentDeck becomes undefined. This will catch that
    if (deckTypes.length === 0 && currentDeck === undefined) {
      console.log("No more cards!");
      showSpinner = true;
      socket.emit('start-end-game-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
      setTimeout(() => {
        socket.emit('end-game');
        showSpinner = false;
      }, 1500);
      
      return;
    };

    // If player has goblin lord's mark, next card is the goblin lord
    if (player.goblinLordMarked) {
      player.goblinLordMarked = false;
      fullDeck['goblins'].length === 0 ? currentDeck = deckTypes[randomNum] : currentDeck = 'goblins';

      if (fullDeck['goblins'].includes('goblinLord')) {
        cardDrawn = fullDeck['goblins'].find(card => card === 'goblinLord')
      } else {
        // If the goblin lord isn't in deck, grab a random goblin
        randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
        cardDrawn = fullDeck[currentDeck][randomNum];
      };
    } else {
      // Grab random card from that deck, if elf deck, look for elf champion.
      if (currentDeck === 'elves' && fullDeck['elves'].includes('elfChampion')) {
        cardDrawn = fullDeck['elves'].find(card => card === 'elfChampion');
      } else {
        // If the elf champion isn't in deck, grab a random elf
        randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
        cardDrawn = fullDeck[currentDeck][randomNum];
      }

      // Change card drawn to goblin lord's mark if player last drew warchief and goblin lord's mark is in deck
      if (player.drewWarchief && canDrawGoblinLordMark(player)) {
        currentDeck = 'goblins';
        cardDrawn = 'goblinLordsMark';
      }

      // If player has chastity but draws the trap card "lost", draw again.
      if (cardDrawn === 'lost' && player.hand.includes('chastity')) {
        // Remove card from deck
        const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
        fullDeck[currentDeck].splice(removedCardIndex, 1);

        // Was it the last card in it's race deck? Remove deck.
        if (fullDeck[currentDeck].length === 0) {
          // Remove deck from main deck
          const index = deckTypes.indexOf(currentDeck);
          deckTypes.splice(index, 1);
        }

        // Draw new card but doesn't count as new turn
        drawCard(player, false);
        return;
      };

      // TODO: break this out into a function
      // If it's the longbeard leader, dwarf commander or dwarvenCall, the next card will be dwarf
      if (cardDrawn === 'longbeardLeader' || cardDrawn === 'dwarfCommander' || (cardDrawn === 'dwarvenCall' && !player.hasCorruption)) player.dwarfNextTurn = true;

      // If it's the warchief, the next card will be the goblin lord's mark.
      if (cardDrawn === 'warchief') player.drewWarchief = true;

      // If it's the goblin lord's mark, the next card will be the goblin lord
      if (cardDrawn === 'goblinLordsMark') player.goblinLordMarked = true;

      // If the card is a special xeno card, handle it.
      if (cardDrawn === 'warpstalker' || cardDrawn === 'voidRunner') calculateSpecialXenoCard(player, cardDrawn);

      // If the card is a trap, handle it.
      if ($cardDetails[cardDrawn].race === 'trap') addTrapCard(player, cardDrawn);

      // If the card is a boost, handle it.
      if ($cardDetails[cardDrawn].race === 'boost') addBoostCard(player, cardDrawn);

      // If the card is a neutral, handle it.
      if ($cardDetails[cardDrawn].race === 'neutral') addneutralCard(player, cardDrawn);
    }

    // Remove card from deck
    const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
    fullDeck[currentDeck].splice(removedCardIndex, 1);

    // When a smaller race deck runs out, it will be removed here. Placed below the cardDrawn logic to ensure the card is actually drawn (think goblin lord's mark)
    if (fullDeck[currentDeck].length === 0) {
      // Remove deck from main deck
      const index = deckTypes.indexOf(currentDeck);
      deckTypes.splice(index, 1);
    }

    // Checks if player is player 1 or 2, then adds card to hand
    if (playingAs() === 'p1') {
      player1.update($player1 => {
        $player1.hand = [...$player1.hand, cardDrawn];
        $player1.cardsDrawn = [...player.cardsDrawn, cardDrawn];
        return $player1;
      });
    } else {
      player2.update($player2 => {
        $player2.hand = [...$player2.hand, cardDrawn];
        $player2.cardsDrawn = [...player.cardsDrawn, cardDrawn];
        return $player2;
      });
    }
    
    // Emits to server that a card was drawn
    socket.emit('draw-card', {player1: $player1, player2: $player2, deckTypes: deckTypes, fullDeck: fullDeck});
  }

  // Determines of the next card will be a dwarf.
  function isDwarfNext(player) {
    player.dwarfNextTurn = false;
    let currentDeck = '';
    let randomNum = 0;

    if (fullDeck['dwarves'] && fullDeck['dwarves'].length !== 0) {
      currentDeck = 'dwarves';
    } else {
      // If no remaining dwarves, random deck 
      randomNum = Math.floor(Math.random() * deckTypes.length);
      currentDeck = deckTypes[randomNum];
    }
    return currentDeck;
  }

  // Determines of the next card will be a dwarf.
  function canDrawGoblinLordMark(player) {
    player.drewWarchief = false;
    return (fullDeck['goblins'] && fullDeck['goblins'].includes('goblinLordsMark')) ? true : false;
  }

  // Determines who can click on deck
  function deckClickHandler() {
    if (gameOver) return;
    if (playingAs() === 'guest') return;
    if (isPlayerTurn() && $player1.turn) drawCard($player1);
    if (isPlayerTurn() && $player2.turn) drawCard($player2);
  }

  // Removes card from hand if player hand has over 6 cards
  function discard(card) {
    if (!isPlayerTurn()) return;

    // Who's playing?
    const player = playingAs() === 'p1' ? $player1 : $player2;

    // Using store update methods instead of player var ^
    if ($player1.turn) {
      const index = $player1.hand.indexOf(card);
      player1.update($player1 => {
        $player1.hand.splice(index, 1);
        $player1.discards = [...$player1.discards, card];
        return $player1;
      });
    } else if ($player2.turn) {
      const index = $player2.hand.indexOf(card);
      player2.update($player2 => {
        $player2.hand.splice(index, 1);
        $player2.discards = [...$player2.discards, card];
        return $player2;
      });
   }

    // Emits to server that a card was discarded
    socket.emit('discard-card', {player1: $player1, player2: $player2});

    // Check if card discarded is switcharoo, if so, swap hands, but don't swap if they have echo in effect (too many cards)
    if (card === 'switcharoo' && player.hand.length === 5 && !gobbledegookDeclared) swapHands();

    // If player is playing twice, let them draw again.
    if (player.playingTwice && card !== 'echo') player.playingTwice = false;

    // Check if card discarded is dwarf alchemist, if so, calculate 50% chance to draw dwarf next turn.
    if (card === 'alchemist') player.dwarfNextTurn = Math.random() < 0.5 ? true : false;

    // Don't change turns until player only has 5 cards
    if (player.hand.length > 5) return;

    if (gobbledegookDeclared) {
      showSpinner = true;
      socket.emit('start-end-game-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
      setTimeout(() => {
        socket.emit('end-game');
        showSpinner = false;
      }, 1500);
      
    } else {
      changeTurns();
      gobbledegookDisabled = false;
    }
  };

  function swapHands() {
    // Show switcharoo message for both playesr
    socket.emit('display-event', 'switcharoo');

      let tempHand = [...$player2.hand];

      player2.update($player2 => {
        $player2.hand = [...$player1.hand];
        return $player2;
      });
      player1.update($player1 => {
        $player1.hand = [...tempHand];
        return $player1;
      });

    // Let clients know hands swapped
    socket.emit('swap-hands', {player1: $player1, player2: $player2});
  }
  
  // Handles player click on card
  function selectCard(event, playerHand) {
    // Gather info about the card, what card was just clicked? Title is most important
    let title = event.detail.title;

    if (playerHand.length > 5) {
      discard(title);
    }
  }
 
  // Handles player click on gobbledegook button
  function gobbledegook() {
    // Check if it's player's turn
    if (!isPlayerTurn()) return;
    if (gameOver) return;

    if (gobbledegookDeclared) {
      showSpinner = true;
      socket.emit('start-end-game-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
      setTimeout(() => {
        socket.emit('end-game');
        showSpinner = false;
      }, 2000);
      
    } else {
      console.log('Gobbledegook declared!!');
      changeTurns();
      gobbledegookDeclared = true;
      socket.emit('gdg-declared');
    }
  }

  // Display game results
  function determineWinner() {
    if($player1.highestPoints > $player2.highestPoints) {
      player1.update($player1 => {
        $player1.wins += 1;
        return $player1;
      });
      player1Reset.update($player1Reset => {
        $player1Reset.wins += 1;
        return $player1Reset;
      });
      player2.update($player2 => {
        $player2.losses += 1;
        return $player2;
      });
      player2Reset.update($player2Reset => {
        $player2Reset.losses += 1;
        return $player2Reset;
      });

      winMessage = `Player 1 is the winner with ${$player1.highestPoints} points!🎊🥳🍾`;
      loseMessage = `Player 2 loses with ${$player2.highestPoints} points...${$player2.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
    } else if($player2.highestPoints > $player1.highestPoints) {
      player1.update($player1 => {
        $player1.losses += 1;
        return $player1;
      });
      player1Reset.update($player1Reset => {
        $player1Reset.losses += 1;
        return $player1Reset;
      });
      player2.update($player2 => {
        $player2.wins += 1;
        return $player2;
      });
      player2Reset.update($player2Reset => {
        $player2Reset.wins += 1;
        return $player2Reset;
      });

      winMessage = `Player 2 is the winner with ${$player2.highestPoints} points!🎊🥳🍾`;
      loseMessage = `Player 1 loses with ${$player1.highestPoints} points...${$player1.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
    } else if ($player1.highestPoints === 500_000 && $player2.highestPoints === 500_000) {
      player1.update($player1 => {
        $player1.draws += 1;
        return $player1;
      });
      player1Reset.update($player1Reset => {
        $player1Reset.draws += 1;
        return $player1Reset;
      });
      player2.update($player2 => {
        $player2.draws += 1;
        return $player2;
      });
      player2Reset.update($player2Reset => {
        $player2Reset.draws += 1;
        return $player2Reset;
      });

      winMessage = `It seems neither the goblins nor the elves want to go to war with each other while their leaders are on the field...`;
      loseMessage = " it's a draw!😓😓😓"
    } else {
      player1.update($player1 => {
        $player1.draws += 1;
        return $player1;
      });
      player2.update($player2 => {
        $player2.draws += 1;
        return $player2;
      });

      winMessage = `Player 1 had ${$player1.highestPoints} points and player 2 had ${$player2.highestPoints} points...`;
      loseMessage = " it's a draw!😓"
    }
  }

  // Calculates card points by race, doesn't include special traits
  function calculateBasePoints(player) {
    player.hand.forEach(card => {
      const race = $cardDetails[card].race;
      switch(race) {
        case 'beast':
          player.points.beasts += $cardDetails[card].points;
        break;

        case 'bot':
          if ($cardDetails[card].title === 'faeBot') player.points.elves += $cardDetails[card].points;
           player.points.bots += $cardDetails[card].points;
        break;

        case 'elf':
          player.points.elves += $cardDetails[card].points;
        break;

        case 'dwarf':
          if ($cardDetails[card].title === 'hobbit') player.points.humans += $cardDetails[card].points;
            player.points.dwarves += $cardDetails[card].points;
        break;

        case 'goblin':
          player.points.goblins += $cardDetails[card].points;
        break;

        case 'human':
          player.points.humans += $cardDetails[card].points;
        break;

        // Points may vary between clients with Xenos, handle this.
        case 'xeno':
          player.points.xenos += ((playingAs() === 'p1' && player === $player1) || (playingAs() === 'p2' && player === $player2)) ? $cardDetails[card].points : remoteCardDetails[card].points;
        break;

        default:
          console.log(`Didn't match a race? This was the race of the card: ${race}`);
      }

      player.highestPoints = Math.max(
        player.points.beasts,
        player.points.bots,
        player.points.dwarves,
        player.points.elves,
        player.points.goblins,
        player.points.humans,
        player.points.xenos
      );
    });
  }

  // Calculates total points (special and base)
  function calculateTotalPoints(player, enemy) {
    calculateBasePoints(player);

    // Because calculateTotalPoints() is run back to back, firtst with p1 as player, p2 might calculate bot points even when "hacked" by A.I..
    if (enemy.hand.includes('ai')) player.points.bots = 0;

    // Special cards)
    if (player.hand.includes('commander')) calculateCommander(player); // Must be before emperor since emperor multiplies final points.
    if (player.hand.includes('emperor')) calculateEmperor(player);
    if (player.hand.includes('goblinLord')) calculateGoblinLord(player, enemy);
    if (player.hand.includes('elfKing')) calculateElfKing(player, enemy);
    if (player.hand.includes('dreamDestroyer')) calculateDreamDestroyer(player);
    if (player.hand.includes('dreamDestroyer')) calculateDreamDestroyer(player);
    if (player.hand.includes('ai')) calculateAi(player, enemy);
    if (player.hand.includes('protectron')) calculateProtectron(player, enemy); // Must be after A.I. since A.I. resets bot points.
    if (player.hand.includes('longbeardLeader')) calculateLongbeard(player);

    // Elf twins bonus 10 points, placed after calculateElfKing() since it does not stack with elf king
    if (player.hand.includes('nelladan') && player.hand.includes('nadallen')) player.points.elves += 10;

    // Nebulites buff xenos by 4 points
    if (player.hand.includes('nebulite')) calculateSpecialXenoCard(player, 'nebulite');

    // Handles end game boost cards
    endGameBoostHandler(player);

    // Handles end game trap cards
    endGameTrapHandler(player);

    // Handles end game neutral cards
    endGameNeutralHandler(player);

    // FIXME: for some reason, after xenobloom, it coints the points but doesn't recognize that xenos are the highest points.
    player.highestPoints = Math.max(
      player.points.beasts,
      player.points.bots,
      player.points.dwarves,
      player.points.elves,
      player.points.goblins,
      player.points.humans,
      player.points.xenos
    );
  }

  // Adds all card points in hand, regardless of race. Humans worth double
  function calculateEmperor(player) {
    player.points.humans *= 2;

    player.hand.forEach(card => {
      if ($cardDetails[card].race !== 'human' && $cardDetails[card].race !== 'xeno' && $cardDetails[card].title !== 'hobbit') player.points.humans += $cardDetails[card].points;
    });
  }

  // Handles human commanders who buff their team
  function calculateCommander(player) {
    let numOfCommanders = player.hand.filter(card => card === 'commander').length;
      
      player.hand.forEach(card => {
        if ($cardDetails[card].race === 'human' || $cardDetails[card].title === 'hobbit') player.points.humans += numOfCommanders;
      });
  }
  // Handles human commanders who buff their team
  function calculateProtectron(player, enemy) {
    let numOfProtectrons = player.hand.filter(card => card === 'protectron').length;
    let numOfViruses = player.hand.filter(card => card === 'virus').length;

    // If player also has A.I. steal their bots too
    if (player.hand.includes('ai')) {
      numOfProtectrons += enemy.hand.filter(card => card === 'protectron').length;
      numOfViruses += enemy.hand.filter(card => card === 'virus').length;
    }
      
    player.hand.forEach(card => {
      if (card === 'virus') player.points.bots += 8; // since -2 + 8 = 6
      if (card === 'protectron') player.points.bots += (numOfProtectrons * numOfViruses); // buffed for each virus
    });

    if (player.hand.includes('ai')) {
      enemy.hand.forEach(card => {
        if (card === 'virus') player.points.bots += 8; // since -2 + 8 = 6
        if (card === 'protectron') player.points.bots += (numOfProtectrons * numOfViruses); // buffed for each virus
      });
    }
  }

  // Instant win for goblins unless enemy has full elf hand + elf king, if so, then instant draw.
  function calculateGoblinLord(player, enemy) {
    // Checks if player hand has only goblins
    const goblinHand = player.hand.every(card => { 
      return $cardDetails[card].race === 'goblin';
    });
    console.log(`from inside calculateGoblinLord, goblinHand = ${goblinHand}`)
    
    // Checks if enemy has only elves
    const enemyFullElf = enemy.hand.every(card => {
      return $cardDetails[card].race === 'elf';
    });

    // Checks if enemy has the elf king
    const enemyElfKing = enemy.hand.includes('elfKing');

    if (goblinHand && (enemyFullElf && enemyElfKing)) {
      player.points.goblins = 500_000;
    } else if (goblinHand) {
      player.points.goblins = 1_000_000;
    }
  }

  function calculateElfKing(player, enemy) {
    // Checks if enemy hand has only goblins
    const goblinHand = enemy.hand.every(card => { 
      return $cardDetails[card].race === 'goblin';
    });

    // Checks if hand has only elves or faebots
    const fullElfHand = player.hand.every(card => $cardDetails[card].race === 'elf' || $cardDetails[card].title === 'faeBot');

    // Checks if enemy has the goblin king
    const enemyGoblinKing = enemy.hand.includes('goblinLord');

    if (goblinHand && enemyGoblinKing && fullElfHand) {
      player.points.elves = 500_000;
    } else if (fullElfHand) {
      // Multiples all card points by 3 due to elf king bonus
      player.points.elves *= 3;
    } else {
      player.points.elves *=2;
    }
  }

  // Adds all card points in hand, regardless of race
  function calculateDreamDestroyer(player) {
    // Need to reset since beast points are added in calculateBasePoints()
    player.points.beasts = 0;
    player.hand.forEach(card => {
      if ($cardDetails[card].race === 'beast') player.points.beasts += 12;
    });
  }

  // Adds ALL bot card points on the field to players score, and bots have +2
  function calculateAi(player, enemy) {  
    // Need to reset since bot points are added in calculateBasePoints()
    player.points.bots = 0;
    enemy.points.bots = 0;

    // Add all bot points from both hands
    player.hand.forEach(card => {
      if ($cardDetails[card].race === 'bot') player.points.bots += ($cardDetails[card].points + 2);
    });
    enemy.hand.forEach(card => {
      if ($cardDetails[card].race === 'bot') player.points.bots += ($cardDetails[card].points + 2);
    });
  }

  // If there are more discarded dwarves than remaining dwarves in the deck, dwarves receive bonus points.
  function calculateLongbeard(player) {  
    let discardedDwarvesCount = 0;

    // Count how many dwarves have been discarded
    $player1.discards.forEach(card => {
      if ($dwarfDeck.includes(card)) discardedDwarvesCount += 1;
    });
    $player2.discards.forEach(card => {
      if ($dwarfDeck.includes(card)) discardedDwarvesCount += 1;
    });

    // Longbeard leader gains +5 points per discarded dwarf.
    player.points.dwarves += (discardedDwarvesCount * 5);
  }

  // Calculates special xeno card points
  function calculateSpecialXenoCard(player, card) {
    // If card drawn is warpstalker, generate point value for card between 7-13 inclusive.
    if (card === 'warpstalker') {
      $cardDetails[card].points = Math.ceil(Math.random() * 7) + 6;
    }

    // If card drwan is voidRunner, set points equal to amount of turns passed
    if (card === 'voidRunner') {
      $cardDetails[card].points = turnCount;
    }

    // Nebulites buff xenos by 4 points
    if (card === 'nebulite') {
      player.hand.forEach(card => {
        if ($cardDetails[card].race === 'xeno' && $cardDetails[card].title !== 'nebulite') player.points.xenos += 4;
      });
    }
  }

  // For displaying special void points at the end of the game
  function endGameXenoPointHandler(cardTitle, player) {
    // Return regular points if it's not special xeno card
    if (!['warpstalker', 'voidRunner'].includes(cardTitle)) return $cardDetails[cardTitle].points;
    
    if (playingAs() === player) {
      if (cardTitle === 'warpstalker') return $cardDetails['warpstalker'].points;
      if (cardTitle === 'voidRunner') return $cardDetails['voidRunner'].points;
    } else {
      if (cardTitle === 'warpstalker') return remoteCardDetails['warpstalker'].points;
      if (cardTitle === 'voidRunner') return remoteCardDetails['voidRunner'].points;
    } 
  }

  // Adds boost card to players boosts array
  function addBoostCard(player, card) {
    player.boosts = [...player.boosts, card];

    if (card === 'chastity') player.hasChastity = true;
    if (card === 'charge') player.chargeDrawnTurns = [...player.chargeDrawnTurns, turnCount];
  }

  // Handles boost cards at the end of the game
  function endGameBoostHandler(player) {
    // Corruption card blocks all boosts
    if (player.hand.includes('xenoguard') || player.hand.includes('corruption') || player.discards.includes('corruption')) return;

    // Handles charge boost
    for (let i = 0; i < player.chargeDrawnTurns.length; i++) player.chargePoints += (turnCount - player.chargeDrawnTurns[i]);
    player.points.bots += player.chargePoints;
    player.points.humans += player.chargePoints;

    // Handles other boosts
    player.boosts.forEach(boost => {
      if (boost === 'rejuvenate') Object.entries(player.points).forEach(([deck, deckPoints]) => player.points[deck] += 10);
    });
  }

  // Adds trap card to players traps array
  function addTrapCard(player, card) {
    player.traps = [...player.traps, card];

    if (card === 'corruption') player.hasCorruption = true;
    if (card === 'infect') player.infectDrawnTurns = [...player.infectDrawnTurns, turnCount];
    if (card === 'exposed' && !player.hasChastity && !player.hand.includes('chastity')) player.isExposed = true;
  }

  // Handles trap cards at the end of the game
  function endGameTrapHandler(player) {
    // Corruption card blocks all boosts, also checks for rhino in hand at end
    if (player.hand.includes('rhino') || player.hand.includes('chastity') || player.discards.includes('chastity')) return;

    // Handles infect trap
    for (let i = 0; i < player.infectDrawnTurns.length; i++) player.infectPoints += (turnCount - player.infectDrawnTurns[i]);
    Object.entries(player.points).forEach(([deck, deckPoints]) => player.points[deck] -= player.infectPoints);

    // Handles other traps
    player.traps.forEach(trap => {
      if (trap === 'sap') Object.entries(player.points).forEach(([deck, deckPoints]) => player.points[deck] -= 10);
      if (trap === 'xenophobia') player.points.xenos -= 10;
    });
  }

  // Adds neutral card to players neutrals array
  function addneutralCard(player, card) {
    player.neutrals = [...player.neutrals, card];

    // If Echo card, player draws and plays twice
    if (card === 'echo') player.playingTwice = true;

    // If vision card, player sees enemy's hand for one turn
    if (card === 'vision') player.hasVision = true;

    // Add turn to turnCount if card is Ticktock
    if (card === 'ticktock') {
      socket.emit('increase-turn-count');
      socket.emit('display-event', 'ticktock');
    }

    // If card is neutralize, reset boosts and traps
    if (card === 'neutralize') socket.emit('neutralize-deck');

    // If card is xenoBloom, let both players know they received 15 xeno points
    if (card === 'xenoBloom') socket.emit('display-event', 'xenoBloom');
  }

  // Neutralizes deeck (remove boosts / traps in effect)
  function neutralizeDeck() {
    socket.emit('display-event', 'neutralize');

      player1.update($player1 => {
        $player1.boosts = [];
        $player1.traps = [];
        $player1.neutrals = [];
        $player1.chargeDrawnTurns = [];
        $player1.infectDrawnTurns = [];
        $player1.hasChastity = false;
        $player1.hasCorruption = false;
        $player1.hasVision = false;
        $player1.isExposed = false;
        $player1.chargePoints = 0;
        $player1.infectPoints = 0;
        return $player1;
      });
      player2.update($player2 => {
        $player2.boosts = [];
        $player2.traps = [];
        $player2.neutrals = [];
        $player2.chargeDrawnTurns = [];
        $player2.infectDrawnTurns = [];
        $player2.hasChastity = false;
        $player2.hasCorruption = false;
        $player2.hasVision = false;
        $player2.isExposed = false;
        $player2.chargePoints = 0;
        $player2.infectPoints = 0;
        return $player2;
      });
  }

  // Handles neutral cards at the end of the game
  function endGameNeutralHandler(player) {
    player.neutrals.forEach(neutral => {
      if (neutral === 'xenoBloom') {
        player1.update($player1 => {
          $player1.points.xenos += 15;
          return $player1;
        })
        player2.update($player2 => {
          $player2.points.xenos += 15;
          return $player2;
        })
      }
    });
  }

  // Show visual feedback for certain events
  // TODO: turn change flash
  function showEvent(card) {
    showEventMessage = true;
    setTimeout(() => showEventMessage = false, 2000);

    if (card === 'neutralize') eventMessage = "Neutralized!";
    if (card === 'switcharoo') eventMessage = "Switcharoo!";
    if (card === 'xenoBloom') eventMessage = "XenoBloom!";
    if (card === 'ticktock') eventMessage = "Tick Tock!";
  }

  // Toggles card library visibility
  function viewLibraryHandler() {
    libraryVisible = !libraryVisible;
  }
</script>

<main class="main-content">
  <!-- Card Library -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <svg on:click={viewLibraryHandler} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="card-library-btn">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
  {#if libraryVisible}
    <Library />
  {/if}

  <!-- Eng game view -->
  {#if winMessage}
    <div class="results-screen" transition:fade>
      <!-- Play again btn -->
      {#if !startBtnDisabled}
        <span class="play-again-btn"><Button on:click={startGame} round={true} customClasses="btn__green">Rematch</Button></span>
      {/if}

      <div class="results-messages-flex-wrapper">
        <div>
          <p>{winMessage}</p>
          <p class="margin-bottom-sm">{loseMessage}</p>

          <p>Player1 Boosts: </p>
          {#each $player1.boosts as boost}
            <span class="color-blue">{boost} &nbsp;</span>
          {/each}
          <p class="margin-bottom-sm">Charge boost points: <span class="color-blue">{$player1.chargePoints}</span></p>

          <p>Player1 Traps: </p>
          <span>Trap cards: </span>
          {#each $player1.traps as trap}
            <span class="color-red">{trap} &nbsp;</span>
          {/each}
          <p class="margin-bottom-sm">Infect trap penalty: <span class="color-red">{$player1.infectPoints}</span></p>

          <span>Neutral cards: </span>
          {#each $player1.neutrals as neutral}
            <span class="color-purple">{neutral} &nbsp;</span>
          {/each}

          <!-- Show all race points -->
          <RacePoints player={$player1}/>

          <h2 class="results-player-floating-header results-player-float-left">Player 1</h2>
        </div>
        <div>
          <p>Player 1 Win/Lose/Draw: {$player1.wins}/{$player1.losses}/{$player1.draws}</p>
          <p class="margin-bottom-sm">Player 2 Win/Lose/Draw: {$player2.wins}/{$player2.losses}/{$player2.draws}</p>


          <p>Player2 Boosts: </p>
          <span>Boost cards: </span>
          {#each $player2.boosts as boost}
            <span class="color-blue">{boost} &nbsp;</span>
          {/each}
          <p class="margin-bottom-sm">Charge boost points: <span class="color-blue">{$player2.chargePoints}</span></p>

          <p>Player2 Traps: </p>
          <span>Trap cards: </span>
          {#each $player2.traps as trap}
            <span class="color-red">{trap} &nbsp;</span>
          {/each}
          <p class="margin-bottom-sm">Infect trap penalty: <span class="color-red">{$player2.infectPoints}</span></p>

          <span>Neutral cards: </span>
          {#each $player2.neutrals as neutral}
            <span class="color-purple">{neutral} &nbsp;</span>
          {/each}

          <!-- Show all race points -->
          <RacePoints player={$player2}/>

          <h2 class="results-player-floating-header results-player-float-right">Player 2</h2>
          <h2 class="results-player-floating-header results-turn-count-float-middle">Turn count: {turnCount}</h2>
        </div>
      </div>

      <div class="player-history-wrapper">
        <!-- Cards Drawn -->
        <div class="history__cards-drawn">
          <!-- Starting hand, placed here so it's at the beginning, left side of parent -->
          <p class="history__small-header">Starting Hand:</p>
          {#each $player1.startingHand as card}
            <div class="history__card-wrapper">
              <GGCard
              displayTitle={$cardDetails[card].displayTitle}
              title={$cardDetails[card].title}
              img={$cardDetails[card].image}
              race={$cardDetails[card].race}
              rarity={$cardDetails[card].rarity}
              points={endGameXenoPointHandler(card, 'p1')}
              />
            </div>
          {/each}

          <p class="history__small-header">Cards drawn:</p>
          {#each $player1.cardsDrawn as card}
          <div class="history__card-wrapper">
            <GGCard
             displayTitle={$cardDetails[card].displayTitle}
             title={$cardDetails[card].title}
             img={$cardDetails[card].image}
             race={$cardDetails[card].race}
             rarity={$cardDetails[card].rarity}
             points={endGameXenoPointHandler(card, 'p1')}
            />
          </div>
          {/each}
        </div>
        <div class="history__cards-discarded">
          <!-- Final hand, placed here so it's at the beginning, right side of parent -->
          <p class="history__small-header">Final Hand:</p>
          {#each $player1.hand as card}
            <div class="history__card-wrapper">
              <GGCard
                displayTitle={$cardDetails[card].displayTitle}
                title={$cardDetails[card].title}
                img={$cardDetails[card].image}
                race={$cardDetails[card].race}
                rarity={$cardDetails[card].rarity}
                points={endGameXenoPointHandler(card, 'p1')}
              />
            </div>
          {/each}

          <!-- Cards Discarded -->
          <p class="history__small-header">Cards discarded:</p>
          {#each $player1.discards as card}
            <div class="history__card-wrapper">
              <GGCard
               displayTitle={$cardDetails[card].displayTitle}
               title={$cardDetails[card].title}
               img={$cardDetails[card].image}
               race={$cardDetails[card].race}
               rarity={$cardDetails[card].rarity}
               points={endGameXenoPointHandler(card, 'p1')}
              />
            </div>
          {/each}
        </div>
      </div>

      <div class="player-history-wrapper">
        <!-- Cards Drawn -->
        <div class="history__cards-drawn">
          <!-- Starting hand, placed here so it's at the beginning, left side of parent -->
          <p class="history__small-header">Starting Hand:</p>
          {#each $player2.startingHand as card}
            <div class="history__card-wrapper">
              <GGCard
               displayTitle={$cardDetails[card].displayTitle}
               title={$cardDetails[card].title}
               img={$cardDetails[card].image}
               race={$cardDetails[card].race}
               rarity={$cardDetails[card].rarity}
               points={endGameXenoPointHandler(card, 'p2')}
              />
            </div>
          {/each}

          <p class="history__small-header">Cards drawn:</p>
          {#each $player2.cardsDrawn as card}
          <div class="history__card-wrapper">
            <GGCard
             displayTitle={$cardDetails[card].displayTitle}
             title={$cardDetails[card].title}
             img={$cardDetails[card].image}
             race={$cardDetails[card].race}
             rarity={$cardDetails[card].rarity}
             points={endGameXenoPointHandler(card, 'p2')}
            />
          </div>
          {/each}
        </div>
        <div class="history__cards-discarded">
          <!-- Final hand, placed here so it's at the beginning, right side of parent -->
          <p class="history__small-header">Final Hand:</p>
          {#each $player2.hand as card}
            <div class="history__card-wrapper">
              <GGCard
               displayTitle={$cardDetails[card].displayTitle}
               title={$cardDetails[card].title}
               img={$cardDetails[card].image}
               race={$cardDetails[card].race}
               rarity={$cardDetails[card].rarity}
               points={endGameXenoPointHandler(card, 'p2')}
              />
            </div>
          {/each}

          <!-- Cards Discarded -->
          <p class="history__small-header">Cards discarded:</p>
          {#each $player2.discards as card}
            <div class="history__card-wrapper">
              <GGCard
               displayTitle={$cardDetails[card].displayTitle}
               title={$cardDetails[card].title}
               img={$cardDetails[card].image}
               race={$cardDetails[card].race}
               rarity={$cardDetails[card].rarity}
               points={endGameXenoPointHandler(card, 'p2')}
              />
            </div>
          {/each}
        </div>
      </div>
    </div>
  
  <!-- Game / Board view -->
  {:else}
    <!-- Loading screen -->
    {#if showSpinner}
      <Spinner />
    {/if}

    <div class="game-board {showEventMessage ? 'game-event' : ''} {gobbledegookDeclared ? 'gobble-declared' : ''}">
      {#if showEventMessage}
        <p class="game-event-message" in:fade>{eventMessage}</p>
      {/if}
      <div class="card-section card-section__ally {$player1.turn ? "section-active" : ""}">
        <p class="p1-name {$player1.turn ? "turn-active" : ""}">Player 1</p>
        {#each $player1.hand as card}
          <GGCard
            on:cardClick={(event) => selectCard(event, $player1.hand)}
            faceUp={isCardVisible('p1') || $player2.hasVision || $player1.isExposed}
            displayTitle={$cardDetails[card].displayTitle}
            title={$cardDetails[card].title}
            img={$cardDetails[card].image}
            trait={$cardDetails[card].trait}
            traitTitle={$cardDetails[card].traitTitle}
            description={$cardDetails[card].description}
            race={$cardDetails[card].race}
            rarity={$cardDetails[card].rarity}
            points={$cardDetails[card].points}
          />
        {/each}
      </div>
      <div class="card-section card-section__enemy {$player2.turn ? "section-active" : ""}">
        <p class="p2-name {$player2.turn ? "turn-active" : ""}">Player 2</p>
        {#each $player2.hand as card}
          <GGCard
            on:cardClick={(event) => selectCard(event, $player2.hand)}
            faceUp={isCardVisible('p2') || $player1.hasVision || $player2.isExposed}
            displayTitle={$cardDetails[card].displayTitle}
            title={$cardDetails[card].title}
            img={$cardDetails[card].image}
            trait={$cardDetails[card].trait}
            traitTitle={$cardDetails[card].traitTitle}
            description={$cardDetails[card].description}
            race={$cardDetails[card].race}
            rarity={$cardDetails[card].rarity}
            points={$cardDetails[card].points}
          />
        {/each}
      </div>

      <div class="game-buttons">
        <h1 class="turn-count">Turn {turnCount}</h1>
        <GGCard on:click={deckClickHandler} faceUp={false} />
        {#if !startBtnDisabled}
          <Button on:click={startGame} round={true} customClasses="btn__green">Start</Button>
        {:else if gobbledegookDisabled || turnCount < 5}
          <Button round={true} customClasses="btn__orange_disabled">GDG</Button>
        {:else}
          <Button on:click={gobbledegook} round={true} customClasses="btn__orange">GDG</Button>
        {/if}
      </div>
      {#if startBtnDisabled}
        <p class="turn-text">{$player1.turn ? "Player 1" : "Player 2"}<span>'s turn</span></p>
      {/if}
    </div>
  {/if}
</main>


<style lang="scss">
  .main-content {
    position: relative;
    overflow-y: hidden;
  }

  .card-library-btn {
    border-radius: 0.5rem;
    z-index: 6; // 1 higher than library to make sure it's never hidden behind.
    stroke: #327738;
    fill: #32773874;
    stroke-width: 2;
    width: 3rem;
    transition: scale 0.1s ease-out;

    position: absolute;
    top: 0;
    right: 1rem;

    &:hover {
      cursor: pointer;
      scale: 1.1;
    }
  }

  /* Game End */
  .results-screen {
    z-index: 1;
    width: 95dvw;
    height: 95dvh;
    font-size: 1.25rem;
    padding: 1rem;
    color: #fff;
    background: linear-gradient(214deg, #ddceee50, #855a2a50, #69c0ad50, #78c06950, #c0736950, #c2a84c50);
    box-shadow: 0 4px 20px #00000085;
    border: 10px double #976f39bd;
    border-radius: 0.5rem;
    margin: 1rem auto 0.25rem;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.1;
    overflow-y: scroll;

    display: grid;
    grid-template-columns: repeat(2, 1fr);

    &::-webkit-scrollbar {
      appearance: none;
    }
  }

  .results-messages-flex-wrapper {
    position: relative;
    padding: 1rem;
    background-color: #000000d1;
    box-shadow: 0 4px 8px #00000082;
    border-radius: 0.5rem;
    border: 2px solid #deffbf36;
    z-index: 5; /* To be above card hover */

    grid-column: 1 / -1;
    grid-row: 1 / 2;
    margin-bottom: 3rem;

    display: flex;
    justify-content: space-evenly;
  }
  
  .results-player-floating-header {
    background-color: #000000a6;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border-left: 2px solid #deffbf36;
    border-right: 2px solid #deffbf36;
    border-bottom: 2px solid #deffbf36;
    
    position: absolute;
    bottom: -3.3rem; /* To blend with message border */
  }

  .results-player-float-left {
    left: 25%;
    transform: translateX(-25%);
  }

  .results-player-float-right {
    right: 25%;
    transform: translateX(25%);
  }

  .results-turn-count-float-middle {
    left: 50%;
    transform: translateX(-50%);
  }

  .player-history-wrapper {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 2rem;
  }

  .history__card-wrapper {
    margin-bottom: 2rem;
  }

  .history__small-header {
    text-shadow: 4px 2px 6px #000000c9;
    font-size: 1.5rem;
    color: #ccff9c;
    font-weight: bold;
    margin-bottom: 2rem;
  }

  /* Game board */

  .game-board {
    position: relative;
    height: 95dvh;
    width: 95dvw;
    padding: 0.5rem;
    max-width: 1500px;
    margin: 0 auto;
    border-radius: 1rem;
    background-color: #200f009d;
    box-shadow: 0 4px 20px #000000;
    border: 8px double #6d380d4f;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .gobble-declared {
    border: 10px dotted #e29836;
  }

  .game-event {
    border: 10px dotted #462e59;

    .game-event-message {
      font-weight: bold;
      display: block;
      z-index: 2;
      position: absolute;
      bottom: 50%;
      right: 50%;
      transform: translate(50%, 50%);
      font-size: 4rem;
      color: #6a428b;
      text-shadow: 2px 2px 4px #000000;
      background: linear-gradient(214deg, #ddceee50, #855a2a50, #69c0ad50, #78c06950, #c0736950, #c2a84c50);
      padding: 4rem;
      border-radius: 100px;
    }
  }

  .card-section {
    width: 95%;
    padding: 1rem 0;
    height: 30%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    box-shadow: inset 0 0 8px #0006;
  }

  .card-section__ally {
    background: linear-gradient(180deg, #ffb45540, #371c00);
    border-radius: 1rem 1rem 0 0;
    position: absolute;
    bottom: 0;
  }
  
  .card-section__enemy {
    background: linear-gradient(0deg, #ffb45540, #371c00);
    border-radius: 0 0 1rem 1rem;
    position: absolute;
    top: 0;
  }

  .section-active {
    background: linear-gradient(275deg, #d4ffd540, #19391f);
    border: 2px solid #6fff9340;
  }

  .turn-text {
    z-index: 1;
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.75rem;
    color: #af4819;

    span {
      color: #CAB097;
    }
  }

  .turn-count {
    font-size: 1.25rem;
    font-weight: bold;
    color: #b77a5e;
  }

  .p1-name {
    font-size: 1.5rem;
    font-weight: bold;
    color: #b77a5e;
    
    position: absolute;
    top: -1.6rem;
    right: 0;
  }

  .p2-name {
    font-size: 1.5rem;
    font-weight: bold;
    color: #b77a5e;
    
    position: absolute;
    bottom: -1.6rem;
    left: 0;
  }

  .turn-active {
    color: #6fff93;
    font-size: 1.75rem;
  }

  .game-buttons {
    z-index: 1;

    display: flex;
    gap: 2rem;
    justify-content: center;
    align-items: center;
  }

  .play-again-btn {
    font-size: 1.5rem;
    position: absolute;
    bottom: 0;
    right: 46%; // to center between discards
    transform: translateY(42%);
  }

  /* Utility */
  .margin-bottom-sm {
    margin-bottom: 1rem;
  }

  .hide {
    display: none;
  }

  .bold {
    font-weight: bold;
  }

  .color-red {
    color: #d32929;
  }

  .color-blue {
    color: #40559a;
  }

  .color-green {
    color: #327738;
  }

  .color-brown {
    color: #55431e;
  }

  .color-grey {
    color: #424242;
  }

  .color-maroon {
    color: #c07369;
  }

  .color-purple {
    color: #593b71;
  }

  .color-silver {
    color: #ddceee;
  }

  .color-yellow {
    color: #8e7419;
  }

  /* For smaller devices */
  @media only screen and (max-width: 1100px) {
    .card-library-btn {
      stroke-width: 2;
      width: 3rem;

      position: absolute;
      top: 0;
      right: 1rem;

      // instead of hover on desktop
      &:active {
        cursor: pointer;
        scale: 1.1;
      }
    }

    .results-screen {
      font-size: 0.75rem;
      padding: 0.75rem;
      border: 8px double #976f39bd;
      border-radius: 0.25rem;
    }

    .results-messages-flex-wrapper {
      padding: 0.75rem;
    }
    
    .results-player-floating-header {
      border-radius: 0.25rem;
    }

    .player-history-wrapper {
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .history__card-wrapper {
      margin-bottom: 1.5rem;
    }

    .history__small-header {
      font-size: 1.125rem;
      margin-bottom: 1.5rem;
    }

    .game-board {
      border-radius: 0.75rem;
    }

    .card-section {
      justify-content: space-evenly;
      padding: 0.5rem 0;
      gap: 1rem;
    }

    .card-section__ally {
      border-radius: 0.75rem 0.75rem 0 0;
    }
    
    .card-section__enemy {
      border-radius: 0 0 0.75rem 0.75rem;
    }

    .turn-text {
      font-size: 1rem;
    }

    .turn-count {
      font-size: 0.9rem;
    }

    .p1-name {
      font-size: 1rem;
      top: -1.1rem;
    }

    .p2-name {
      font-size: 1rem;
      bottom: -1.1rem;
    }

    .turn-active {
      font-size: 1.125rem;
    }

    .game-buttons {
      gap: 1.5rem;
    }

    .play-again-btn {
      font-size: 1rem;
      transform: translateY(42%);
    }
  }

  @media only screen and (max-width: 800px) {
    .card-library-btn {
      // remove scale on mobile hover, since no hover.
      &:hover {
        scale: 1;
      }
    }

    .results-screen {
      font-size: 0.5rem;
      padding: 0.5rem;
    }

    .results-messages-flex-wrapper {
      padding: 0.5rem;
    }
    
    .results-player-floating-header {
      border-radius: 0.125rem;
    }

    .player-history-wrapper {
      gap: 1rem;
      margin-top: 1rem;
    }

    .history__card-wrapper {
      margin-bottom: 1rem;
    }

    .history__small-header {
      font-size: 1rem;
      margin-bottom: 1.25rem;
    }

    .game-board {
      border-radius: 0.75rem;
    }

    .card-section {
      padding: 0.25rem 0;
      gap: 0.5rem;
    }

    .turn-text {
      font-size: 0.75rem;
    }

    .turn-count {
      font-size: 0.6rem;
    }

    .p1-name {
      font-size: 0.75rem;
    }

    .p2-name {
      font-size: 0.75rem;
    }

    .turn-active {
      font-size: 0.9rem;
    }

    .game-buttons {
      gap: 1rem;
    }

    .play-again-btn {
      font-size: 0.75rem;
    }
  }
  
</style>