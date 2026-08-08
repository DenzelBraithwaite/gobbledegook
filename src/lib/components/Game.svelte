<script lang="ts">
  // Hooks
  import { onMount } from 'svelte';

  // Transitions
  import { fade } from 'svelte/transition';

  // Helpers
  import wait from '../helpers/wait';

  // Stores
  import { player1, player1Reset, player2, player2Reset, cardDetails, beastDeck, botDeck, dwarfDeck, elfDeck, goblinDeck, humanDeck, xenoDeck, boostDeck,  trapDeck, neutralDeck } from '../stores';

  // Custom components
  import { Button, Discards, Library, Spinner, RacePoints } from './index';
  import GGCard from './Card.svelte';

  // Websocket
  import { io } from 'socket.io-client';

  // let socket = io('http://10.3.144.90:6912'); // Work MacBook at work, changes a lot.
  // let socket = io('http://192.168.2.19:6912'); // Work MacBook at home
  // let socket = io('http://192.168.2.21:6912'); // Personal MacBook at home (ofc)
  let socket = io('http://192.168.2.10:6912'); // Thanos
  $: gameState = {
    gobbledegookDeclared: false,
    gobbledegookDisabled: false,
    startBtnDisabled: false,
    gameOver: true,
    winMessage: '',
    loseMessage: '',
    turnCount: 0,
    showSpinner: false,
    eventMessage: '',
    libraryVisible: false,
    discardsVisible: false,
    showEventMessage: false,
    newPlayerTitle: 'Unknown Player',
    p1NameChangeVisible: false,
    p2NameChangeVisible: false,
    playingAs: ''
  };
  let controlCopyOfCardDetails = {...$cardDetails};
  let remoteCardDetails = {...$cardDetails};
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

    // Takes users from server and sets them on clients' frontend
    socket.on('set-users', users => setUsers(users));

    // Resets game and updates player hands
    socket.on('game-started', data => {
      resetGame();

      // Update player hands
      player1.set(data.player1);
      player2.set(data.player2);
      fullDeck = {...data.fullDeck};
      calculateCurrentPlayerPoints();
    });

    // Counts turns
    socket.on('add-turn-count', () => gameState.turnCount++);

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
      
      calculateCurrentPlayerPoints();
      const gdgButtonAvailable = (!gameState.gameOver && !gameState.gobbledegookDeclared && gameState.turnCount >= 10);
      if (gdgButtonAvailable && isPlayerTurn()) gameState.gobbledegookDisabled = false;
      if (isPlayerTurn()) showEvent('turn-change');
    });

    // Increase turn count
    socket.on('turn-count-increased', () => gameState.turnCount += 3);
    
    // Decrease turn count
    socket.on('turn-count-decreased', () => gameState.turnCount >= 5 ? gameState.turnCount -= 5 : gameState.turnCount = 0);

    // Handles card draw for all users
    socket.on('card-drawn', data => {
      fullDeck = {...data.fullDeck};
      deckTypes = data.deckTypes;

      // Make sure player's (hands) are consistent.
      player1.set(data.player1);
      player2.set(data.player2);

      // Recalculate points otherwise client gets stale points from other client (seems to fix weird point glitch)
      calculateCurrentPlayerPoints();
    });

    // Handles cards that make players swap hands, updates xenos too (client sending broadcast already updated)
    socket.on('hands-swapped', data => {
      $cardDetails['voidRunner'].points = data.copyOfXenoPoints.voidRunner;
      $cardDetails['warpstalker'].points = data.copyOfXenoPoints.warpstalker;
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
    socket.on('gdg-declared', () => gameState.gobbledegookDeclared = true);

    // Handles first server reply for xeno updates (like 3 way handshake pt 1)
    socket.on('xeno-sync-started', data => {
      // The goal is to update the remote player's xeno points (since they will differ)
      if (gameState.playingAs === 'p1') player2.set(data.player2);
      if (gameState.playingAs === 'p2') player1.set(data.player1);

      // Update remote client's remote deck, then send their deck to the client that started the handshake so they can update their remote deck
      remoteCardDetails = {...data.cardDetails};

      // Make sure client who initiated the update gets their data updated as well.
      socket.emit('continue-xeno-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
    });

    // Handles last server reply for xeno updates (like 3 way handshake pt 2)
    socket.on('finish-xeno-sync', data => {
      // The goal is to update the remote player's xeno points (since they will differ)
      player1.set(data.player1);
      player2.set(data.player2);
      remoteCardDetails = {...data.cardDetails};
      gameState.showSpinner = false;
    });

    // Handles game end for all users
    socket.on('game-ended', data => endGame());

    // Let's user change their username at anytime
    socket.on('update-username', data => updateUsernameForThisClient(data))
  });

  // sets users based on [username, id] from server.js
  function setUsers(users: [string, string][]): void {
    users.forEach(user => {
      if (user[0] === 'p1') {
        player1.update($player1 => {
          $player1.id = user[1]; // socket id 2nd item in arr
          return $player1;
        });
        player1Reset.set({...$player1});
      }
      
      if (user[0] === 'p2') {
        player2.update($player2 => {
          $player2.id = user[1]; // socket id 2nd item in arr
          return $player2;
        });
        player2Reset.set({...$player2});
      }
    });

    if (socket.id === $player1.id) gameState.playingAs = 'p1';
    if (socket.id === $player2.id) gameState.playingAs = 'p2';
  }

  // Initiaties a new round
  async function startGame() {
    resetGame();
    await dealCards($player1);
    await dealCards($player2);
    decideFirstPlayer();
    calculateCurrentPlayerPoints();

    // Send data to websocket server
    socket.emit('start-game', {player1: $player1, player2: $player2, fullDeck});
  }

  // Ends current round
  function endGame() {
    gameState.gameOver = true;
    gameState.startBtnDisabled = false;
    gameState.gobbledegookDisabled = true;
    
    player1.update($player1 => {
      $player1.turn = false;
      return $player1;
    });
    player2.update($player2 => {
      $player2.turn = false;
      return $player2;
    });

    const options = {calculateOpponentCards: true, swapPlayers: false, recursive: true};
    calculateCurrentPlayerPoints(options);
    determineWinner();

    // Loggs decks to console
    showDeck();
    showDeck(true);
    console.log($player1, $player2);
  }

  // Resets values to restart the game.
  function resetGame() {
    // Reset p1
    player1.set({...$player1Reset, title: $player1.title});
    // Reset p2
    player2.set({...$player2Reset, title: $player2.title});

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

    cardDetails.set({...controlCopyOfCardDetails});
    // $cardDetails['warpstalker'].points = 0; // TODO: remove once confirming above line fixes issue (also restart issue)
    // $cardDetails['voidRunner'].points = 0;
    deckTypes = Object.keys(fullDeck);
    remoteCardDetails = {...$cardDetails};

    // General resets
    gameState = {...gameState,
      turnCount: 0,
      gameOver: false,
      startBtnDisabled: true,
      gobbledegookDeclared: false,
      gobbledegookDisabled: false,
      winMessage: ''
    }
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

  // Determines if card should be visible or not
  function isCardVisible(playerSide) {
    if (gameState.gameOver) return true;
    if (gameState.playingAs === 'p1' && playerSide === 'p1') return true;
    if (gameState.playingAs === 'p2' && playerSide === 'p2') return true;

    // player has vision?
    return false;
  }

  // Changes active player turn
  function changeTurns() {
    socket.emit('change-turns', {player1: $player1, player2: $player2});
  }

  // Deals 5 cards to each player at the start of the round
  async function dealCards(player) {
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
      if (['corruption'].includes(cardDrawn)) await addTrapCard(player, cardDrawn);

      // If the card is a boost that triggers even without being drawn, handle it.
      if (['chastity'].includes(cardDrawn)) addBoostCard(player, cardDrawn);

      // If the card is a neutral that triggers even without being drawn, handle it.
      if (['switcharoo'].includes(cardDrawn)) await addneutralCard(player, cardDrawn, false);
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
  async function drawCard(player, newTurn = true) {
    if (gameState.gameOver) return;
    if (newTurn) calculateNewTurn(player);
    let currentDeck = '';
    let cardDrawn = '';
    let randomNum = 0;

    // Player can't declare gobbledegook if they drew that turn
    gameState.gobbledegookDisabled = true;

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
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsForSpecialXenoCards();
      while (gameState.showSpinner) await wait(500);
      
      socket.emit('end-game');
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
        await drawCard(player, false);
        return;
      };

      // If it's the longbeard leader, dwarf commander or dwarvenCall, the next card will be dwarf
      if (cardDrawn === 'longbeardLeader' || cardDrawn === 'dwarfCommander' || (cardDrawn === 'dwarvenCall' && !player.hasCorruption)) player.dwarfNextTurn = true;

      // If it's the warchief, the next card will be the goblin lord's mark.
      if (cardDrawn === 'warchief') player.drewWarchief = true;

      // If it's the goblin lord's mark, the next card will be the goblin lord
      if (cardDrawn === 'goblinLordsMark') player.goblinLordMarked = true;

      // If the card is a special xeno card, handle it.
      if (cardDrawn === 'warpstalker' || cardDrawn === 'voidRunner') calculateSpecialXenoCard(player, cardDrawn);

      // If the card is a trap, handle it.
      if ($cardDetails[cardDrawn].race === 'trap') await addTrapCard(player, cardDrawn);

      // If the card is a boost, handle it.
      if ($cardDetails[cardDrawn].race === 'boost') addBoostCard(player, cardDrawn);

      // If the card is a neutral, handle it.
      if ($cardDetails[cardDrawn].race === 'neutral') await addneutralCard(player, cardDrawn);
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
    if (gameState.playingAs === 'p1') {
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
    calculateCurrentPlayerPoints();
    
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
  async function clickOnDeck() {
    if (gameState.gameOver) return;
    if (isPlayerTurn() && $player1.turn) await drawCard($player1);
    if (isPlayerTurn() && $player2.turn) await drawCard($player2);
  }

  // Removes card from hand if player hand has over 6 cards
  async function discard(card) {
    if (!isPlayerTurn()) return;

    // Who's playing?
    const player = gameState.playingAs === 'p1' ? $player1 : $player2;

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
    if (card === 'switcharoo' && player.hand.length === 5 && !gameState.gobbledegookDeclared) await swapHands();

    // If player is playing twice, let them draw again.
    if (player.playingTwice && card !== 'echo') player.playingTwice = false;

    // Check if card discarded is dwarf alchemist, if so, calculate 50% chance to draw dwarf next turn.
    if (card === 'alchemist') player.dwarfNextTurn = Math.random() < 0.5 ? true : false;

    // Don't change turns until player only has 5 cards
    if (player.hand.length > 5) return;

    if (gameState.gobbledegookDeclared) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsForSpecialXenoCards();
      while (gameState.showSpinner) await wait(500);
      
      socket.emit('end-game');
    } else {
      changeTurns();
    }
  };

  async function swapHands() {
    // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
    updateClientsForSpecialXenoCards();
    while (gameState.showSpinner) await wait(500);

    const copyOfXenoPoints = {
      voidRunner: $cardDetails['voidRunner'].points,
      warpstalker: $cardDetails['warpstalker'].points,
    }
    $cardDetails['voidRunner'].points = remoteCardDetails['voidRunner'].points;
    $cardDetails['warpstalker'].points = remoteCardDetails['warpstalker'].points;

    let tempHand = [...$player2.hand];
    player2.update($player2 => {
      $player2.hand = [...$player1.hand];
      return $player2;
    });
    player1.update($player1 => {
      $player1.hand = [...tempHand];
      return $player1;
    });

    socket.emit('swap-hands', {player1: $player1, player2: $player2, copyOfXenoPoints});
    socket.emit('display-event', 'switcharoo');
  }
  
  // Handles player click on card
  async function selectCard(event, playerHand) {
    // Gather info about the card, what card was just clicked? Title is most important
    let title = event.detail.title;

    if (playerHand.length > 5) await discard(title);
  }
 
  // Handles player click on gobbledegook button
  async function gobbledegook() {
    // Check if it's player's turn
    if (!isPlayerTurn()) return;
    if (gameState.gameOver) return;

    if (gameState.gobbledegookDeclared) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsForSpecialXenoCards();
      while (gameState.showSpinner) await wait(500);
      
      socket.emit('end-game');
    } else {
      // Need to add turn count here otherwise it won't go up cuz it's usually triggered on card draw.
      const player = gameState.playingAs === 'p1' ? $player1 : $player2;
      calculateNewTurn(player);
      changeTurns();

      // Have this last so if player gdg other player can still click the button.
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

      gameState.winMessage = `${$player1.title} is the winner with ${$player1.highestPoints} points!🎊🥳🍾`;
      gameState.loseMessage = `${$player2.title} loses with ${$player2.highestPoints} points...${$player2.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
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

      gameState.winMessage = `${$player2.title} is the winner with ${$player2.highestPoints} points!🎊🥳🍾`;
      gameState.loseMessage = `${$player1.title} loses with ${$player1.highestPoints} points...${$player1.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
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

      gameState.winMessage = `It seems neither the goblins nor the elves want to go to war with each other while their leaders are on the field...`;
      gameState.loseMessage = " it's a draw!😓😓😓"
    } else {
      player1.update($player1 => {
        $player1.draws += 1;
        return $player1;
      });
      player2.update($player2 => {
        $player2.draws += 1;
        return $player2;
      });

      gameState.winMessage = `${$player1.title} had ${$player1.highestPoints} points and ${$player2.title} had ${$player2.highestPoints} points...`;
      gameState.loseMessage = " it's a draw!😓"
    }
  }

  // Calculates up-to-date current player points, wipes each time to avoid adding points to previous ones.
  function calculateCurrentPlayerPoints(options = {calculateOpponentCards: false, swapPlayers: false, recursive: false}) {
    let player;
    let enemy;
    if (options.swapPlayers) {
      player = gameState.playingAs === 'p1' ? $player2 : $player1;
      enemy = gameState.playingAs === 'p1' ? $player1 : $player2;
    } else {
      player = gameState.playingAs === 'p1' ? $player1 : $player2;
      enemy = gameState.playingAs === 'p1' ? $player2 : $player1;
    }

    // Reset points each time for a clean calculation then calculates hand before special cards.
    setPlayerPointsToZero(player);
    calculateBasePoints(player);
    calculateSpecialTraits(player, enemy, options);

    // Handles end game boost, trap and neutral cards. These occur AFTER special traits are calculated.
    endGameBoostHandler(player, enemy, options);
    endGameTrapHandler(player);
    endGameNeutralHandler(player);

    // Determines player's race with the most points to compare to other player.
    setPlayerHighestPoints(player);

    if (options.recursive) calculateCurrentPlayerPoints({calculateOpponentCards: true, swapPlayers: true, recursive: false});
  }

  // Calculates card points by race, doesn't include special traits
  function calculateBasePoints(player) {
    player.hand.forEach(card => {
      const race = $cardDetails[card].race;
      switch(race) {
        // When calculating dreamdestroyer, it resets beast points
        case 'beast':
          player.points.beasts += $cardDetails[card].points;
        break;

        // When calculating A.I., it resets bot points
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

        // This ensures that if this function runs on player client from the enemy perspective that it should use the remote cardDetails for xenos.
        // This would happen because calculateCurrentPlayerPoints can run recursively, swapping perspective to enemy to calculate their points for end game for current player.
        case 'xeno':
          player.points.xenos += ((gameState.playingAs === 'p1' && player === $player1) || (gameState.playingAs === 'p2' && player === $player2)) ? $cardDetails[card].points : remoteCardDetails[card].points;
        break;

        // Don't care about these
        case 'boost':
        case 'trap':
        case 'neutral':
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

  // Calculates all race card special traits
  function calculateSpecialTraits(player, enemy, options = {calculateOpponentCards: false, swapPlayers: false, recursive: false}): void {
    // Only wipe player's bot points if they know enemy has AI
    if (options.calculateOpponentCards && enemy.hand.includes('ai')) player.points.bots = 0;
    
    // Must be before emperor calculation for proper result, adds bonus points to all humans.
    if (player.hand.includes('commander')) calculateCommander(player);

    // Multiplies human points by 2 then adds rest of hand as human points.
    if (player.hand.includes('emperor')) calculateEmperor(player);

    // Determines if player has full goblin hand and if enemy has full elf hand with elf leader, assigns points accordingly.
    if (player.hand.includes('goblinLord')) calculateGoblinLord(player, enemy, options.calculateOpponentCards);

    // If elf twins in hand player gains bonus points depending on how many. Must be before Elf king calculation for proper calculation.
    if (player.hand.includes('nelladan') && player.hand.includes('nadallen')) calculateElfTwins(player);

    // Determines if enemy has full goblin hand and if player has full elf hand, assigns points accordingly.
    if (player.hand.includes('elfKing')) calculateElfKing(player, enemy, options.calculateOpponentCards);

    // Calculates all beasts as if they are worth 12 points.
    if (player.hand.includes('dreamDestroyer')) calculateDreamDestroyer(player);

    // If player has humans/hobbits, pawl barkington gains +10 points.
    if (player.hand.includes('dog') && (player.hand.includes('hobbit') || player.hand.some(card => $cardDetails[card].race === 'human'))) {
      const numOfDogs = player.hand.filter(c => c === 'dog').length;
      player.points.beasts += 10 * numOfDogs;
    }

    // Player gains +2 for every wolf on the field, including himself.
    if (player.hand.includes('wolf')) calculateWolfPack(player);

    // Adds +2 to all bot cards (player + enemy) then steals all bot points.
    if (player.hand.includes('ai')) calculateAi(player, enemy, options);

    // Must be after A.I. since A.I. resets bot points. Quarantine all viruses adding +8 to their value and +1 bot point to Protectron per quarantined virus.
    if (player.hand.includes('protectron')) calculateProtectron(player, enemy, options.calculateOpponentCards);

    // Calculates +5 dwarf points per discarded dwarf by any player.
    if (player.hand.includes('longbeardLeader')) calculateLongbeard(player, options.calculateOpponentCards);

    // Nebulites buff xenos by 4 points
    if (player.hand.includes('nebulite')) calculateSpecialXenoCard(player, 'nebulite');
  }

  // Trades warpstalker and voidrunner client values before calculation
  function updateClientsForSpecialXenoCards() {
    gameState.showSpinner = true;
    socket.emit('start-xeno-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
  }

  // Calculates and updates player's highest points among races.
  function setPlayerHighestPoints(player) {
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

  // Handles Protectrons who negate viruses
  function calculateProtectron(player, enemy, calculateHackingAbility = false) {
    let numOfProtectrons = player.hand.filter(card => card === 'protectron').length;
    let numOfViruses = player.hand.filter(card => card === 'virus').length;
    
    player.hand.forEach(card => {
      if (card === 'virus') player.points.bots += ((numOfProtectrons * 8));

      // Buffed for each virus, base points already calculated.
      if (card === 'protectron') player.points.bots += (numOfProtectrons * numOfViruses);
    });

    // If player also has A.I. steal enemy bots too
    if (calculateHackingAbility && player.hand.includes('ai')) {
      let enemyNumOfProtectrons = enemy.hand.filter(card => card === 'protectron').length;
      let enemyNumOfViruses = enemy.hand.filter(card => card === 'virus').length;
      
      enemy.hand.forEach(card => {
        if (card === 'virus') player.points.bots += (numOfProtectrons * 8);
        
        // Buffed for each virus, base points already calculated.
        if (card === 'protectron') player.points.bots += (enemyNumOfProtectrons * enemyNumOfViruses);
      });
    }
  }

  // Instant win for goblins unless enemy has full elf hand + elf king, if so, then instant draw.
  function calculateGoblinLord(player, enemy, calculateElfDefense = false) {
    // Checks if player hand has only goblins
    const goblinHand = player.hand.every(card => { 
      return $cardDetails[card].race === 'goblin';
    });
    
    // Ignore enemy cards if the game is still going on
    if (!calculateElfDefense && goblinHand) {
      player.points.goblins = 1_000_000;
      return;
    }
    
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

  // Adds bonus points for matching elf twins
  function calculateElfTwins(player) {
    // Each Nelladan gets +5 points for matching with Nadallen and Nadallen gets +5 points per Nelladan. Amount * 5 * 2 
    const bonusTwinPoints = player.hand.filter(card => card === 'nelladan').length * 10;

    player.points.elves += bonusTwinPoints;
  }

  // Calculates special elf king effects
  function calculateElfKing(player, enemy, calculateGoblinKing = false) {
    // Checks if hand has only elves or faebots
    const fullElfHand = player.hand.every(card => $cardDetails[card].race === 'elf' || $cardDetails[card].title === 'faeBot');
    if (!calculateGoblinKing && fullElfHand) player.points.elves *= 3;
    if (!calculateGoblinKing && !fullElfHand) player.points.elves *= 2;
    if (calculateGoblinKing) {
      // Checks if enemy hand has only goblins
      const goblinHand = enemy.hand.every(card => { 
        return $cardDetails[card].race === 'goblin';
      });

      // Checks if enemy has the goblin king
      const enemyGoblinKing = enemy.hand.includes('goblinLord');

      if (goblinHand && enemyGoblinKing && fullElfHand) {
        player.points.elves = 500_000;
      } else if (fullElfHand) {
        player.points.elves *= 3;
      } else {
        player.points.elves *= 2;
      }
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

  // +2 points for every wolf on the field, including himself (base wolf points already calculated in calculateBasePoints)
  function calculateWolfPack(player) {
    const numOfWolves = player.hand.filter(card => card === 'wolf').length;
    player.points.beasts += numOfWolves * (numOfWolves * 2);
  }

  // Adds ALL bot card points on the field to players score, and bots have +2
  function calculateAi(player, enemy, options = {calculateOpponentCards: false, swapPlayers: false, recursive: false}) {  
    // Need to reset since bot points are added in calculateBasePoints()
    player.points.bots = 0;
    player.hand.forEach(card => {
      if ($cardDetails[card].race === 'bot') player.points.bots += ($cardDetails[card].points + 2);
    });

    if (options.calculateOpponentCards) {
      // Add all bot points from enemy hand as well
      enemy.points.bots = 0;
      enemy.hand.forEach(card => {
        if ($cardDetails[card].race === 'bot') player.points.bots += ($cardDetails[card].points + 2);
      });
    }
  }

  // Player gains +5 points per discarded dwarf.
  function calculateLongbeard(player, calculateEnemyDiscards = false) {  
    let discardedDwarvesCount = 0;

    if (!calculateEnemyDiscards) {
      player.discards.forEach(card => {
        if ($dwarfDeck.includes(card)) discardedDwarvesCount += 1;
      });
    } else {
      $player1.discards.forEach(card => {
        if ($dwarfDeck.includes(card)) discardedDwarvesCount += 1;
      });
      $player2.discards.forEach(card => {
        if ($dwarfDeck.includes(card)) discardedDwarvesCount += 1;
      });
    }

    player.points.dwarves += (discardedDwarvesCount * 5);
  }

  // Calculates special xeno card points
  function calculateSpecialXenoCard(player, card) {
    // If card drawn is warpstalker, generate point value for card between 7-13 inclusive.
    if (card === 'warpstalker') {
      $cardDetails[card].points = Math.ceil(Math.random() * 7) + 6;
    }

    // If card drawn is voidRunner, set points equal to amount of turns passed
    if (card === 'voidRunner') {
      $cardDetails[card].points = gameState.turnCount;
    }

    // Nebulites buff xenos by 4 points
    if (card === 'nebulite') {
      player.hand.forEach(card => {
        if ($cardDetails[card].race === 'xeno' && $cardDetails[card].title !== 'nebulite') player.points.xenos += 4;
      });
    }
  }

  // For displaying special void points at the end of the game
  function endGameXenoPointHandler(cardTitle, player): number {
    // Return regular points if it's not special xeno card
    if (!['warpstalker', 'voidRunner'].includes(cardTitle)) return $cardDetails[cardTitle].points;
    
    if (gameState.playingAs === player) {
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
    if (card === 'charge') player.chargeDrawnTurns.push(gameState.turnCount);
  }

  // Handles boost cards at the end of the game
  function endGameBoostHandler(player, enemy, options = {calculateOpponentCards: false, swapPlayers: false, recursive: false}) {
    // These cards block all boosts
    if (player.hand.includes('xenoGuard') ||
        (player.hand.includes('corruption') || player.discards.includes('corruption'))
    ) return;

    // Add charge points to human and bot points
    for (let i = 0; i < player.chargeDrawnTurns.length; i++) player.chargePoints += (gameState.turnCount - player.chargeDrawnTurns[i]);
    
    // calculateAI runs before this, charge points should be stolen if a player has 'ai'
    options.calculateOpponentCards && enemy.hand.includes('ai') ? enemy.points.bots += player.chargePoints : player.points.bots += player.chargePoints;
    player.points.humans += player.chargePoints;

    // Handles other boosts
    player.boosts.forEach(boost => {
      if (boost === 'rejuvenate') Object.entries(player.points).forEach(([deck, deckPoints]) => player.points[deck] += 10);
    });
  }

  // Adds trap card to players traps array
  async function addTrapCard(player, card) {
    player.traps = [...player.traps, card];

    if (card === 'corruption') player.hasCorruption = true;
    if (card === 'infect') player.infectDrawnTurns.push(gameState.turnCount);
    if (card === 'exposed' && !player.hasChastity && !player.hand.includes('chastity')) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsForSpecialXenoCards();
      while (gameState.showSpinner) await wait(500);
      player.id === $player1.id ? player1.set({...$player1, isExposed: true}) : player2.set({...$player2, isExposed: true});
      socket.emit('display-event', 'exposed');
    }
  }

  // Handles trap cards at the end of the game
  function endGameTrapHandler(player) {
    // Corruption card blocks all boosts, also checks for rhino in hand at end
    if (player.hand.includes('rhino') ||
        (player.hand.includes('chastity') || player.discards.includes('chastity'))
    ) return;

    // Handles infect trap
    for (let i = 0; i < player.infectDrawnTurns.length; i++) player.infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    Object.entries(player.points).forEach(([deck, deckPoints]) => player.points[deck] -= player.infectPoints);

    // Handles other traps
    player.traps.forEach(trap => {
      if (trap === 'sap') Object.entries(player.points).forEach(([deck, deckPoints]) => player.points[deck] -= 10);
      if (trap === 'xenophobia') player.points.xenos -= 10;
    });
  }

  // Adds neutral card to players neutrals array
  async function addneutralCard(player, card, drawn = true) {
    player.neutrals = [...player.neutrals, card];

    // If Echo card, player draws and plays twice
    if (card === 'echo') {
      player.playingTwice = true;
      socket.emit('display-event', 'echo');
    }

    // If vision card, player sees enemy's hand for one turn
    if (card === 'vision' && drawn) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsForSpecialXenoCards();
      while (gameState.showSpinner) await wait(500);
      player.id === $player1.id ? player1.set({...$player1, hasVision: true}) : player2.set({...$player2, hasVision: true});
      showEvent('vision');
    }

    // Add turn to turnCount if card is Ticktock
    if (card === 'ticktock') {
      socket.emit('increase-turn-count');
      socket.emit('display-event', 'ticktock');
    }

    // Subtract turn from turnCount if card is Tocktick
    if (card === 'tocktick') {
      socket.emit('decrease-turn-count');
      socket.emit('display-event', 'tocktick');
    }

    // If card is neutralize, reset boosts and traps
    if (card === 'neutralize') socket.emit('neutralize-deck');

    // If card is xenoBloom, let both players know they received 15 xeno points
    if (card === 'xenoBloom') socket.emit('display-event', 'xenoBloom');

    // If card is xenoBlossom, let both players know they received 5 xeno points
    if (card === 'xenoBlossom') socket.emit('display-event', 'xenoBlossom');

    calculateCurrentPlayerPoints();
  }

  // Neutralizes deeck (remove boosts / traps in effect)
  function neutralizeDeck() {
    showEvent('neutralize');

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
    calculateCurrentPlayerPoints();
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

      if (neutral === 'xenoBlossom') {
        player1.update($player1 => {
          $player1.points.xenos += 5;
          return $player1;
        })

        player2.update($player2 => {
          $player2.points.xenos += 5;
          return $player2;
        })
      }
    });
  }

  // Show visual feedback for certain events
  async function showEvent(trigger: 'neutralize' | 'switcharoo' | 'xenoBloom' | 'xenoBlossom' | 'ticktock' | 'tocktick' | 'exposed' | 'vision' | 'echo' | 'turn-change') {
    while (gameState.showEventMessage) await wait(100);
    let timer = 1500;
    gameState.showEventMessage = true;
    switch (trigger) {
      case 'turn-change':
        timer = 750;
        gameState.eventMessage = "It's Your Turn!";
        break;
      case 'exposed':
        gameState.eventMessage = "Exposed 🔍!";
        break;
      case 'echo':
        gameState.eventMessage = "( ((Echo!)) )";
        break;
      case 'vision':
        gameState.eventMessage = "Vision 👁️_👁️!";
        break;
      case 'neutralize':
        gameState.eventMessage = "Neutralized ⚖️!";
        break;
      case 'switcharoo':
          gameState.eventMessage = "Switcharoo 🔃!";
          break;
      case 'xenoBloom':
        gameState.eventMessage = "Xeno Bloom 👽!";
        break;
      case 'xenoBlossom':
        gameState.eventMessage = "Xeno Blossom 👾!";
        break;
      case 'ticktock':
        gameState.eventMessage = "Tick Tock ⏰!";
        break;
      case 'tocktick':
        gameState.eventMessage = "!⏰ Tock Tick";
        break;
    }
    setTimeout(() => gameState.showEventMessage = false, timer);
  }

  // Toggles card library visibility
  function viewLibraryHandler() {
    gameState.libraryVisible = !gameState.libraryVisible;
  }

  // Toggles card discards visibility
  function viewDiscardHandler() {
    gameState.discardsVisible = !gameState.discardsVisible;
  }

  function updateUsernameForOtherClient(): void {
    gameState.playingAs === 'p1' ? gameState.p1NameChangeVisible = false : gameState.p2NameChangeVisible = false;
    const player = gameState.playingAs === 'p1' ? $player1 : $player2;
    player.title = gameState.newPlayerTitle;
    socket.emit('username-changed', player.title);
  }

  function updateUsernameForThisClient(newUsername): void {
    gameState.playingAs === 'p1' ? $player2.title = newUsername : $player1.title = newUsername;
  }

  function setPlayerPointsToZero(player): void {
    player.points = {
      beasts: 0,
      bots: 0,
      dwarves: 0,
      elves: 0,
      humans: 0,
      goblins: 0,
      xenos: 0
    };
    player.highestPoints = 0;
    player.chargePoints = 0;
    player.infectPoints = 0;
  }

  function toggleP1NameChangeVisibility(): void {
    if (gameState.playingAs === 'p2') return;
    gameState.p1NameChangeVisible = !gameState.p1NameChangeVisible;
  }
  
  function toggleP2NameChangeVisibility(): void {
    if (gameState.playingAs === 'p1') return;
    gameState.p2NameChangeVisible = !gameState.p2NameChangeVisible;
  }

  function displayBonusCardIcons(card): string {
    return $cardDetails[card].image;
  }

  // Converts race card bg to legendary if player is holding the leader of that race.
  function determineRarity(player, card): '' |  'common' | 'uncommon' | 'rare' | 'amazing' | 'epic' | 'legendary' {
    if (player.hand.includes('emperor') && ($cardDetails[card].race === 'human' || card === 'hobbit')) return 'legendary';
    if (player.hand.includes('goblinLord') && $cardDetails[card].race === 'goblin') return 'legendary';
    if (player.hand.includes('elfKing') && ($cardDetails[card].race === 'elf' || card === 'faeBot')) return 'legendary';
    if (player.hand.includes('longbeardLeader') && $cardDetails[card].race === 'dwarf') return 'legendary';
    if (player.hand.includes('ai') && $cardDetails[card].race === 'bot') return 'legendary';
    if (player.hand.includes('dreamDestroyer') && $cardDetails[card].race === 'beast') return 'legendary';
    return $cardDetails[card].rarity;
  }

  // Determines if the points will be green to show they are being buffed
  function determineIfBuffed(player, card): boolean {
    const specialXenoCards = ['voidRunner', 'warpstalker'];
    const pointValue = determinePoints(player, card);
    const isPeakingAtOtherHand = ((gameState.playingAs === 'p1' && player.id === $player2.id) || gameState.playingAs === 'p2' && player.id === $player1.id);

    
    if (isPeakingAtOtherHand && specialXenoCards.includes(card)) console.log({pointValue, remoteDetails: remoteCardDetails[card].points});
    if (isPeakingAtOtherHand && specialXenoCards.includes(card)) return (pointValue > remoteCardDetails[card].points);
    
    console.log({pointValue, cardDetails: controlCopyOfCardDetails[card].points});
    return (pointValue > $cardDetails[card].points);
  }

  // Modifies card points depending on cards in player hand
  function determinePoints(player, card): number {
    const triggerTwinEffect = player.hand.includes('nelladan') && player.hand.includes('nadallen');
    if ((player.hand.includes('dreamDestroyer') || card === 'dog') && $cardDetails[card].race === 'beast') return determineBeastPoints(player, card);
    if ((player.hand.includes('ai') || player.hand.includes('protectron')) && $cardDetails[card].race === 'bot') return determineBotPoints(player, card);
    if (triggerTwinEffect || (player.hand.includes('elfKing') && ($cardDetails[card].race === 'elf' || card === 'faeBot'))) return determineElfPoints(player, card);
    if ((player.hand.includes('emperor') || player.hand.includes('commander')) && ($cardDetails[card].race === 'human' || card === 'hobbit')) return determineHumanPoints(player, card);
    
    // If this is being called on player 1/2's hand and the card is a voidrunner/warp and I'm player 2/1 return appropriate points.
    const xenoCards = ['voidRunner', 'warpstalker', 'nebulite'];
    if (player.hand.some(c => xenoCards.includes(c)) && $cardDetails[card].race === 'xeno') return determineXenoPoints(player, card);

    return $cardDetails[card].points;
  }

  function determineBeastPoints(player, card): number {
    const hasHumans = player.hand.some(c => $cardDetails[c].race === 'human' || c === 'hobbit');
    const hasDreamDestroyer = player.hand.includes('dreamDestroyer');

    if (card === 'dog' && hasHumans && hasDreamDestroyer) return 22;
    if (card === 'dog' && hasHumans) return 14;
    if (hasDreamDestroyer) return 12;
    return $cardDetails[card].points;
  }

  function determineBotPoints(player, card): number {
    let numOfProtectrons = player.hand.filter(card => card === 'protectron').length;
    let numOfViruses = player.hand.filter(card => card === 'virus').length;

    if (player.hand.includes('ai') && player.hand.includes('protectron') && card === 'virus') return (numOfProtectrons * 8);
    if (player.hand.includes('protectron') && card === 'virus') return (numOfProtectrons * 8) - 2; // $cardDetails[card].points -s a negative num here
    if (player.hand.includes('ai') && card === 'virus') return $cardDetails[card].points + 2;
    if (player.hand.includes('ai') && card === 'protectron') return $cardDetails[card].points + numOfViruses + 2;
    if (card === 'protectron') return $cardDetails[card].points + numOfViruses;
    if (player.hand.includes('ai')) return $cardDetails[card].points + 2;

    return $cardDetails[card].points;
  }

  // Only called if twins OR elf king + full elf hand (including faeBot)
  function determineElfPoints(player, card): number {
    const hasElfKing = player.hand.includes('elfKing');
    const numOfNelladans = player.hand.filter(c => c === 'nelladan').length;
    const numOfNadallens = player.hand.filter(c => c === 'nadallen').length;
    const fullElfHand = player.hand.every(c => $cardDetails[c].race === 'elf' || c === 'faeBot');
    const triggerTwinEffect = numOfNelladans > 0 && numOfNadallens > 0;

    // Elf king, full hand and twins
    if ((hasElfKing && fullElfHand && triggerTwinEffect)) {
      if (card === 'nadallen') return ($cardDetails[card].points + (numOfNelladans * 5) * 3);
      if (card === 'nelladan') return (($cardDetails[card].points + 5) * 3);
      
      // Elf king and full hand
    } else if (hasElfKing && fullElfHand) {
      return $cardDetails[card].points * 3;
      
      // Twins
    } else if (triggerTwinEffect) {
      if (card === 'nadallen') return ($cardDetails[card].points + (numOfNelladans * 5) * 2);
      if (card === 'nelladan') return (($cardDetails[card].points + 5) * 2);
    }

    // Default
    return $cardDetails[card].points * 2;
  }

  function determineHumanPoints(player, card): number {
    const hasEmperor = player.hand.includes('emperor');
    const numOfCommanders = player.hand.filter(c => c === 'commander').length;

    if (hasEmperor) return ($cardDetails[card].points + numOfCommanders) * 2;
    if (!hasEmperor) return ($cardDetails[card].points + numOfCommanders);
  }

  function determineXenoPoints(player, card): number {
    const specialXenoCards = ['voidRunner', 'warpstalker'];
    const numOfNebulites = player.hand.filter(c => c === 'nebulite').length;

    if (player.id === $player1.id && (numOfNebulites > 0 && card !== 'nebulite')) {
      return (specialXenoCards.includes(card) && gameState.playingAs === 'p2') ? remoteCardDetails[card].points + 4 : $cardDetails[card].points + 4;
    } else if (player.id === $player1.id) {
      return (specialXenoCards.includes(card) && gameState.playingAs === 'p2') ? remoteCardDetails[card].points : $cardDetails[card].points;
    } else if (player.id === $player2.id && (numOfNebulites > 0 && card !== 'nebulite')) {
      return (specialXenoCards.includes(card) && gameState.playingAs === 'p1') ? remoteCardDetails[card].points + 4 : $cardDetails[card].points + 4;
    } else if (player.id === $player2.id) {
      return (specialXenoCards.includes(card) && gameState.playingAs === 'p1') ? remoteCardDetails[card].points : $cardDetails[card].points;
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 {#if ['p1', 'p2'].includes(gameState.playingAs)}
  <main class="main-content">
    <!-- Discards -->
    <svg on:click={viewDiscardHandler} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="card-discards-btn">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
    {#if gameState.discardsVisible}
      <Discards discards={gameState.playingAs === 'p1' ? $player1.discards : $player2.discards}/>
    {/if}

    <!-- Card Library -->
    <svg on:click={viewLibraryHandler} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="card-library-btn">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
    {#if gameState.libraryVisible}
      <Library />
    {/if}

    <!-- Eng game view -->
    {#if gameState.winMessage}
      <div class="results-screen" transition:fade>
        <!-- Play again btn -->
        {#if !gameState.startBtnDisabled}
          <span class="play-again-btn"><Button on:click={async () => await startGame()} round={true} customClasses="btn__green">Rematch</Button></span>
        {/if}

        <div class="results-messages-flex-wrapper">
          <div>
            <p>{gameState.winMessage}</p>
            <p class="margin-bottom-sm">{gameState.loseMessage}</p>

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

            <p>Other Neutral Effects: 
              {#each $player2.neutrals.filter(n => ['neutralize', 'switcharoo', 'ticktock', 'tocktick', 'xenoBloom', 'xenoBlossom'].includes(n)) as neutral}
                <span class="color-purple">{neutral} &nbsp;</span>
              {/each}
            </p>

            <!-- Show all race points -->
            <RacePoints player={$player1}/>

            <h2 class="results-player-floating-header results-player-float-left">{$player1.title}</h2>
          </div>

          <div>
            <p>{$player1.title} Win/Lose/Draw: {$player1.wins}/{$player1.losses}/{$player1.draws}</p>
            <p class="margin-bottom-sm">{$player2.title} Win/Lose/Draw: {$player2.wins}/{$player2.losses}/{$player2.draws}</p>

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

            <p>Other Neutral Effects: 
              {#each $player1.neutrals.filter(n => ['neutralize', 'switcharoo', 'ticktock', 'tocktick', 'xenoBloom', 'xenoBlossom'].includes(n)) as neutral}
                <span class="color-purple">{neutral} &nbsp;</span>
              {/each}
            </p>

            <!-- Show all race points -->
            <RacePoints player={$player2}/>

            <h2 class="results-player-floating-header results-player-float-right">{$player2.title}</h2>
            <h2 class="results-player-floating-header results-turn-count-float-middle">Turn count: {gameState.turnCount}</h2>
          </div>
        </div>

        <div class="player-history-wrapper {$player1.highestPoints > $player2.highestPoints ? 'player-history-wrapper__winner' : 'player-history-wrapper__loser'}" class:player-history-wrapper__tie={$player1.highestPoints === $player2.highestPoints}>
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
                trait={$cardDetails[card].trait}
                traitTitle={$cardDetails[card].traitTitle}
                description={$cardDetails[card].description}
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
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
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
                  trait={$cardDetails[card].trait}
                  traitTitle={$cardDetails[card].traitTitle}
                  description={$cardDetails[card].description}
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
                trait={$cardDetails[card].trait}
                traitTitle={$cardDetails[card].traitTitle}
                description={$cardDetails[card].description}
                race={$cardDetails[card].race}
                rarity={$cardDetails[card].rarity}
                points={endGameXenoPointHandler(card, 'p1')}
                />
              </div>
            {/each}
          </div>
        </div>

        <div class="player-history-wrapper {$player2.highestPoints > $player1.highestPoints ? 'player-history-wrapper__winner' : 'player-history-wrapper__loser'}" class:player-history-wrapper__tie={$player1.highestPoints === $player2.highestPoints}>
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
                trait={$cardDetails[card].trait}
                traitTitle={$cardDetails[card].traitTitle}
                description={$cardDetails[card].description}
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
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
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
                trait={$cardDetails[card].trait}
                traitTitle={$cardDetails[card].traitTitle}
                description={$cardDetails[card].description}
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
                trait={$cardDetails[card].trait}
                traitTitle={$cardDetails[card].traitTitle}
                description={$cardDetails[card].description}
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
      {#if gameState.showSpinner}
        <Spinner />
      {/if}

      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="game-board" class:game-event={gameState.showEventMessage} class:gobble-declared={gameState.gobbledegookDeclared}>
        {#if gameState.showEventMessage}
          <p class="game-event-message">{gameState.eventMessage}</p>
        {/if}

        <div class="card-section card-section__ally" class:section-active={gameState.playingAs === 'p1' && $player1.turn} class:enemy-section-active={gameState.playingAs === 'p2' && $player1.turn}>
          <div class="player-scores-wrapper player-scores-wrapper__ally" class:player-scores-wrapper__ally_adjusted={gameState.playingAs === 'p2'}>
            {#if gameState.playingAs === 'p1'}
              <div class="player-scores">
                <span>HUM <span class="color-blue">{$player1.points.humans} </span></span>
                <span>| GBL <span class="color-green">{$player1.points.goblins}</span></span>
                <span>| ELF <span class="color-silver">{$player1.points.elves}</span></span>
                <span>| DWF <span class="color-maroon">{$player1.points.dwarves}</span></span>
                <span>| BST <span class="color-brown">{$player1.points.beasts}</span></span>
                <span>| BOT <span class="color-grey">{$player1.points.bots}</span></span>
                <span>| XNO <span class="color-yellow">{$player1.points.xenos} </span>| </span>

                <!-- Displays all bonus cards (boost/trap/neutral) player currently has in effect -->
                <div class="bonus-card-icons-section-wrapper">
                  <div class="bonus-card-icons-section bonus-card-icons-section__boosts">
                    {#each $player1.boosts as boost}
                      <img src={displayBonusCardIcons(boost)} alt={displayBonusCardIcons(boost)} class="bonus-card-icon">
                    {/each}
                  </div>
                  
                  <div class="bonus-card-icons-section bonus-card-icons-section__traps">
                    {#each $player1.traps as trap}
                      <img src={displayBonusCardIcons(trap)} alt={displayBonusCardIcons(trap)} class="bonus-card-icon">
                    {/each}
                  </div>
                    
                  <div class="bonus-card-icons-section bonus-card-icons-section__neutrals">
                    {#each $player1.neutrals as neutral}
                      <img src={displayBonusCardIcons(neutral)} alt={displayBonusCardIcons(neutral)} class="bonus-card-icon">
                    {/each}
                  </div>
                </div>
              </div>
            {/if}

            {#if gameState.p1NameChangeVisible}
              <input bind:value={gameState.newPlayerTitle} on:blur={updateUsernameForOtherClient} type="text" maxlength="20"/>
            {:else}
              <p on:click={toggleP1NameChangeVisibility} class="p1-name {$player1.turn ? "turn-active" : ""}">{$player1.title}</p>
            {/if}
          </div>

          {#each $player1.hand as card}
            <GGCard
              on:cardClick={async (event) => await selectCard(event, $player1.hand)}
              faceUp={isCardVisible('p1') || $player2.hasVision || $player1.isExposed}
              displayTitle={$cardDetails[card].displayTitle}
              title={$cardDetails[card].title}
              img={$cardDetails[card].image}
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
              race={$cardDetails[card].race}
              rarity={determineRarity($player1, card)}
              points={determinePoints($player1, card)}
              buffed={determineIfBuffed($player1, card)}
            />
          {/each}
        </div>

        <div class="card-section card-section__enemy" class:section-active={gameState.playingAs === 'p2' && $player2.turn} class:enemy-section-active={gameState.playingAs === 'p1' && $player2.turn}>
          <div class="player-scores-wrapper player-scores-wrapper__enemy" class:player-scores-wrapper__enemy_adjusted={gameState.playingAs === 'p1'}>
            {#if gameState.playingAs === 'p2'}
              <div class="player-scores">
                <span>HUM <span class="color-blue">{$player2.points.humans} </span></span>
                <span>| GBL <span class="color-green">{$player2.points.goblins}</span></span>
                <span>| ELF <span class="color-silver">{$player2.points.elves}</span></span>
                <span>| DWF <span class="color-maroon">{$player2.points.dwarves}</span></span>
                <span>| BST <span class="color-brown">{$player2.points.beasts}</span></span>
                <span>| BOT <span class="color-grey">{$player2.points.bots}</span></span>
                <span>| XNO <span class="color-yellow">{$player2.points.xenos} </span>| </span>
                
                 <!-- Displays all bonus cards (boost/trap/neutral) player currently has in effect -->
                <div class="bonus-card-icons-section-wrapper">
                  <div class="bonus-card-icons-section bonus-card-icons-section__boosts">
                    {#each $player2.boosts as boost}
                      <img src={displayBonusCardIcons(boost)} alt={displayBonusCardIcons(boost)} class="bonus-card-icon">
                    {/each}
                  </div>
                  
                  <div class="bonus-card-icons-section bonus-card-icons-section__traps">
                    {#each $player2.traps as trap}
                      <img src={displayBonusCardIcons(trap)} alt={displayBonusCardIcons(trap)} class="bonus-card-icon">
                    {/each}
                  </div>
                    
                  <div class="bonus-card-icons-section bonus-card-icons-section__neutrals">
                    {#each $player2.neutrals as neutral}
                      <img src={displayBonusCardIcons(neutral)} alt={displayBonusCardIcons(neutral)} class="bonus-card-icon">
                    {/each}
                  </div>
                </div>
              </div>
            {/if}

            {#if gameState.p2NameChangeVisible}
              <input bind:value={gameState.newPlayerTitle} on:blur={updateUsernameForOtherClient} type="text" maxlength="20"/>
            {:else}
              <p on:click={toggleP2NameChangeVisibility} class="p2-name {$player2.turn ? "turn-active" : ""}">{$player2.title}</p>
            {/if}
          </div>
          {#each $player2.hand as card}
            <GGCard
              on:cardClick={async (event) => await selectCard(event, $player2.hand)}
              faceUp={isCardVisible('p2') || $player1.hasVision || $player2.isExposed}
              displayTitle={$cardDetails[card].displayTitle}
              title={$cardDetails[card].title}
              img={$cardDetails[card].image}
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
              race={$cardDetails[card].race}
              rarity={determineRarity($player2, card)}
              points={determinePoints($player2, card)}
              buffed={determineIfBuffed($player2, card)}
            />
          {/each}
        </div>

        <div class="game-buttons">
          <h1 class="turn-count">Turn {gameState.turnCount}</h1>
          <GGCard on:click={async() => await clickOnDeck()} faceUp={false} />
          {#if !gameState.startBtnDisabled}
            <Button on:click={async () => await startGame()} round={true} customClasses="btn__green">Start</Button>
          {:else if gameState.gobbledegookDisabled || gameState.turnCount < 10}
            <Button round={true} customClasses="btn__orange_disabled">GDG</Button>
          {:else}
            <Button on:click={async () => gobbledegook()} round={true} customClasses="btn__orange">GDG</Button>
          {/if}
        </div>
      </div>
    {/if}
  </main>
{/if}


<style lang="scss">
  .main-content {
    position: relative;
    overflow-y: hidden;
    padding: 16px;
  }

  .card-library-btn, .card-discards-btn {
    border-radius: 0.5rem;
    z-index: 7; // 1 higher than library to make sure it's never hidden behind.
    stroke: #d44215;
    fill: #d442158a;
    border: 1px solid #d44215;
    stroke-width: 1.5;
    background-color: #0c0c0cd3;
    width: 40px;
    padding: 0.125rem;
    transition: all 0.15s ease-out;

    position: absolute;
    top: 8px;
    right: 8px;

    &:hover {
      cursor: pointer;
      stroke: #327738;
      fill: #32773874;
      scale: 1.1;
      border: 1px solid #327738;
    }
  }

  .card-discards-btn {
    stroke: #745f58;
    fill: #745f588a;
    border: 1px solid #745f58;
    top: 64px;

    &:hover {
      stroke: #9abd9d;
      fill: #9abd9d74;
      border: 1px solid #9abd9d;
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
    border-radius: 8px;
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    gap: 2rem;
  }

  .player-history-wrapper__winner {
    background: linear-gradient(275deg, #d4ffd540, #19391f);
  }
  
  .player-history-wrapper__loser {
    background: linear-gradient(275deg, #ffd4d440, #391919);
  }

  .player-history-wrapper__tie {
    background: linear-gradient(275deg, #38464d7d, #656565);
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
    padding: 8px;
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
      display: block;
      z-index: 2;
      padding: 4rem;
      width: 70dvw;
      font-weight: bold;
      font-size: 3.5rem;
      color: #6a428b;
      background: linear-gradient(214deg, #ddceee50, #855a2a50, #69c0ad50, #78c06950, #c0736950, #c2a84c50);
      text-align: center;
      text-shadow: 2px 2px 4px #000000;
      border-radius: 100px;

      position: absolute;
      bottom: 50%;
      right: 50%;
      transform: translate(50%, 50%);
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

  .enemy-section-active {
    background: linear-gradient(275deg, #ffd4d440, #391919);
    border: 2px solid #ff6f8740;
  }

  .bonus-card-icons-section-wrapper {
    margin-top: 2px;
    padding-top: 4px;
    border-top: 3px dashed #45240E;

    display: flex;
    gap: 12px;
    justify-content: flex-start;
    align-items: center;
  }

  .bonus-card-icons-section {
    border-radius: 6px;
    padding: 2px;
    width: 33%;
    height: 24px;
    overflow-x: hidden;
    
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  
  .bonus-card-icons-section__boosts {
    background: linear-gradient(180deg, #b8ebf380, #90beff70 50%);
    box-shadow: 0 2px 8px 2px #b8ebf331;
    border-left: 4px double #90beff;
    border-right: 4px double #90beff;
  }
  
  .bonus-card-icons-section__traps {
    background: linear-gradient(0deg, #0000001a, #ff404044 75%);
    box-shadow: 0 2px 8px 2px #ff40402c;
    border-left: 4px double #a32727;
    border-right: 4px double #a32727;
  }
  
  .bonus-card-icons-section__neutrals {
    box-shadow: 0 2px 8px 2px #933ce93f;
    background: linear-gradient(270deg,#31273e,#933ce94d 50%);
    border-left: 4px double #933ce9;
    border-right: 4px double #933ce9;
  }

  .bonus-card-icon {
    width: 24px;
    height: 20px;

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

  .player-scores-wrapper {
    width: 100%;
    padding: 4px;
    border-radius: 8px;
    background-color: #311a0fc2;
    border: 2px solid #45240E;

    display: flex;
    justify-content: space-between;
    align-items: center;

    position: absolute;
  }

  .player-scores-wrapper__ally {
    top: -65px;
    right: 0;
  }
  
  .player-scores-wrapper__enemy {
    bottom: -65px;
    left: 0;
  }
  
  // These need to be adjusted since players see more overhead on their side.
  .player-scores-wrapper__ally_adjusted { top: -30px; }
  .player-scores-wrapper__enemy_adjusted { bottom: -30px; }

  .player-scores {
    width: 85%;
    border-radius: 4px;
    color: #B77A59;
  }

  .p1-name, .p2-name {
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: bold;
    color: #b77a5e;
    text-wrap: nowrap;
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

  .text-12px {
    font-size: 0.75rem;
  }

  /* For smaller devices */
  @media only screen and (max-width: 1100px) {
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