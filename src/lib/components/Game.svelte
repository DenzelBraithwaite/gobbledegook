<script lang="ts">
  // Hooks
  import { onMount } from 'svelte';

  // Transitions
  import { fade } from 'svelte/transition';

  // Helpers
  import wait from '../helpers/wait';

  // Stores
  import { type Player, player1, player1Reset, player2, player2Reset, cardDetails, beastDeck, botDeck, dwarfDeck, elfDeck, goblinDeck, humanDeck, xenoDeck, boostDeck,  trapDeck, neutralDeck, giraffeDeck } from '../stores';

  // Custom components
  import { Button, Discards, Library, Spinner, RacePoints } from './index';
  import GGCard from './Card.svelte';

  // Websocket
  import { io } from 'socket.io-client';

  type DeckRace = 'humans' | 'goblins' | 'elves' | 'dwarves' | 'beasts' | 'bots' | 'xenos' | 'boosts' | 'traps' | 'neutrals' | 'giraffe' | '';
  type Race = 'human' | 'goblin' | 'elf' | 'dwarf' | 'beast' | 'bot' | 'xeno' | 'boost' | 'trap' | 'neutral' | '';

  // Thanos: http://192.168.2.10:6912; 
  let socket = io('http://192.168.2.10:6912'); // Currently work
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
    playingAs: '' as 'p1' | 'p2'
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
  let deckTypes: DeckRace[] | string[] = Object.keys(fullDeck);
  
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

      // Calculate points
      const player = gameState.playingAs === 'p1' ? $player1 : $player2;
      calculateCurrentPlayerPoints(player);
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
      
      const player = gameState.playingAs === 'p1' ? $player1 : $player2;
      calculateCurrentPlayerPoints(player);
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
      const player = gameState.playingAs === 'p1' ? $player1 : $player2;
      calculateCurrentPlayerPoints(player);
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

  // ---------------------------------------------------------------- \\
  // --------------------- GAME STATE CONTROLS ---------------------- \\
  // ---------------------------------------------------------------- \\

  // Initiaties a new round
  async function startGame() {
    resetGame();
    await dealCards($player1);
    await dealCards($player2);
    decideFirstPlayer();

    const player = gameState.playingAs === 'p1' ? $player1 : $player2;
    calculateCurrentPlayerPoints(player);

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

    calculateEndGamePlayerPoints($player1);
    calculateEndGamePlayerPoints($player2);
    determineWinner();

    // Loggs decks to console
    logDeck();
    logDeck(true);
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
    deckTypes = Object.keys(fullDeck);
    remoteCardDetails = {...$cardDetails};

    // General resets
    gameState = {...gameState,
      turnCount: 0,
      gameOver: false,
      startBtnDisabled: true,
      gobbledegookDeclared: false,
      gobbledegookDisabled: false,
      winMessage: '',
      loseMessage: '',
      eventMessage: ''
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
  
  // Changes active player turn
  function changeTurns() {
    socket.emit('change-turns', {player1: $player1, player2: $player2});
  }

  // Deals 5 cards to each player at the start of the round
  async function dealCards(player: Player) {
    // Make sure hand is empty
    player.hand = [];
    
    for(let counter = 1; counter <= 5; counter++) {
      // Grab random deck 
      let randomNum = Math.floor(Math.random() * deckTypes.length);
      let currentDeck = deckTypes[randomNum];

      // Grab random card from that deck
      randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
      let cardDrawn = fullDeck[currentDeck][randomNum];

      // Make sure player never starts with the egg
      while (cardDrawn === 'eggGiraffe') {
        randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
        cardDrawn = fullDeck[currentDeck][randomNum];
      }

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
  async function drawCard(player: Player, newTurn = true) {
    if (gameState.gameOver) return;
    if (newTurn) calculateNewTurn(player);
    let currentDeck: DeckRace = '';
    let cardDrawn = '';
    let randomNum = 0;

    // Player can't declare gobbledegook if they drew that turn
    gameState.gobbledegookDisabled = true;

    // If new turn and player was recently exposed, remove it, not when use draws echo and keeps drawing.
    if (newTurn && player.hand.length === 5) player.isExposed = false;

    // Player can't draw when he has more than 5 cards unless due to echo. Player can't draw more than 7 cards (echo + 1)
    if ((player.hand.length > 5 && !player.playingTwice) || player.hand.length >= 7) return;
    
    // Checks if there's a giraffe counter, if so return the appropriate giraffe.
    if ([1, 2, 3, 4].includes(player.giraffeCounter)) {
      currentDeck = 'giraffe';

    } else if (player.dwarfNextTurn) {

    // Determines if the next card will be a dwarf or just a random deck.
      currentDeck = isDwarfNext(player);
    } else {

      // If no remaining dwarves, random deck 
      randomNum = Math.floor(Math.random() * deckTypes.length);
      currentDeck = deckTypes[randomNum] as DeckRace; // to appease ts gods
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
      fullDeck['goblins'].length === 0 ? currentDeck = deckTypes[randomNum] as DeckRace : currentDeck = 'goblins'; // to appease ts gods

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
      } else if (currentDeck === 'giraffe') {
        cardDrawn = drawGiraffeCards(player);

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

      // If it's the giraffe egg, get the next giraffe.
      if (cardDrawn === 'eggGiraffe') player.giraffeCounter = 1;

      // If player has chastity but draws the trap card "lost", draw again.
      if (cardDrawn === 'lost' && areTrapsBlocked(player)) {
        // Remove card from deck
        const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
        fullDeck[currentDeck].splice(removedCardIndex, 1);

        // Was it the last card in it's race deck? Remove deck.
        if (fullDeck[currentDeck].length === 0) removeRaceDeck(currentDeck);

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
      if (getRaces(cardDrawn).includes('trap')) await addTrapCard(player, cardDrawn);

      // If the card is a boost, handle it.
      if (getRaces(cardDrawn).includes('boost')) addBoostCard(player, cardDrawn);

      // If the card is a neutral, handle it.
      if (getRaces(cardDrawn).includes('neutral')) await addneutralCard(player, cardDrawn);
    }

    // Remove card from deck unless special giraffe deck
    if (currentDeck !== 'giraffe') {
      const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
      fullDeck[currentDeck].splice(removedCardIndex, 1);

      // When a smaller race deck runs out, it will be removed here. Placed below the cardDrawn logic to ensure the card is actually drawn (think goblin lord's mark)
      if (fullDeck[currentDeck].length === 0) removeRaceDeck(currentDeck);
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
    calculateCurrentPlayerPoints(player);
    
    // Emits to server that a card was drawn
    socket.emit('draw-card', {player1: $player1, player2: $player2, deckTypes: deckTypes, fullDeck: fullDeck});
  }

  // Removes card from hand if player hand has over 6 cards
  async function discard(card) {
    if (!isPlayerTurn()) return;

    // Who's playing?
    const player = gameState.playingAs === 'p1' ? $player1 : $player2;

    // So player doesn't get free hand of beasts as giraffe grows.
    if (player.hand.includes('eggGiraffe')) card = 'eggGiraffe';
    if (player.hand.includes('kidGiraffe')) card = 'kidGiraffe';
    if (player.hand.includes('adultGiraffe')) card = 'adultGiraffe';

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

  // Handles Switcharoo hand swap
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

  // Sets all of players point values (including charge/infect) to 0
  function setPlayerPointsToZero(player: Player): void {
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
    player.growthPoints = 0;
    player.infectPoints = 0;
  }

  // Determine if it is the player's turn or not
  function isPlayerTurn() {
    if ($player1.id === socket.id && $player1.turn) return true;
    if ($player2.id === socket.id && $player2.turn) return true;
    return false;
  }

  // Remove deck from main deck
  function removeRaceDeck(race: DeckRace): void {
    const index = deckTypes.indexOf(race);
    deckTypes.splice(index, 1);
  }
  
  // ---------------------------------------------------------------- \\
  // ------------------------- CALCULATIONS ------------------------- \\
  // ---------------------------------------------------------------- \\

  // Counts if 1 full turn has passed
  function calculateNewTurn(player: Player) {
    // Not a new turn if player got echo and is drawing/discarding more cards. Must wait for actual turn change.
    if (player.playingTwice) return;
    if (player.hand.length >= 6) return;
    if (($player1.playedFirst && $player1.turn) || ($player2.playedFirst && $player2.turn)) socket.emit('new-turn');
  }

  // Calculates all player race points, used to determine the winner.
  function calculateCurrentPlayerPoints(player: Player) {
    const otherPlayer = player.id === $player1.id ? $player2 : $player1;

    setPlayerPointsToZero(player);
    calculateHumanPoints(player);
    calculateGoblinPoints(player, otherPlayer);
    calculateElfPoints(player, otherPlayer);
    calculateDwarfPoints(player);
    calculateBeastPoints(player); // TODO: either leave as is or show highest? Since this is after human calc, lupin will get +12 if dreamdestroyer & human elite/leader in hand.
    calculateBotPoints(player, otherPlayer); // TODO: either leave as is or show highest? Since this is after human calc, cyborg will get +2 if ai & human elite/leader in hand.
    calculateXenoPoints(player, otherPlayer);
    calculatePlayerHighestPoints(player);
    
    // Even though points are calculated, still need to set the infect/charge/growth points for end game results screen.
    for (let i = 0; i < player.infectDrawnTurns.length; i++) player.infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    for (let i = 0; i < player.chargeDrawnTurns.length; i++) player.chargePoints += (gameState.turnCount - player.chargeDrawnTurns[i]);
    for (let i = 0; i < player.growthDrawnTurns.length; i++) player.growthPoints += (gameState.turnCount - player.growthDrawnTurns[i]);
  }

  // Calculates all player race points, used to determine the winner.
  function calculateEndGamePlayerPoints(player: Player) {
    const otherPlayer = player.id === $player1.id ? $player2 : $player1;

    setPlayerPointsToZero(player);
    calculateHumanPoints(player);
    calculateGoblinPoints(player, otherPlayer, true);
    calculateElfPoints(player, otherPlayer, true);
    calculateDwarfPoints(player, true);
    calculateBeastPoints(player);
    calculateBotPoints(player, otherPlayer, true);
    calculateXenoPoints(player, otherPlayer);
    calculatePlayerHighestPoints(player);
    
    // Even though points are calculated, still need to set the infect/charge/growth points for end game results screen.
    for (let i = 0; i < player.infectDrawnTurns.length; i++) player.infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    for (let i = 0; i < player.chargeDrawnTurns.length; i++) player.chargePoints += (gameState.turnCount - player.chargeDrawnTurns[i]);
    for (let i = 0; i < player.growthDrawnTurns.length; i++) player.growthPoints += (gameState.turnCount - player.growthDrawnTurns[i]);
  }

  // Calculates and updates player's highest points among races.
  function calculatePlayerHighestPoints(player: Player) {
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

  // Modifies card points depending on cards in player hand
  function displayCardPoints(player: Player, cardTitle: string): number {
    const triggerTwinEffect = player.hand.includes('nelladan') && player.hand.includes('nadallen');
    if ((player.hand.some(card => ['dreamDestroyer', 'nightTerror'].includes(card)) || cardTitle === 'dog' || cardTitle === 'wolf') && getRaces(cardTitle).includes('beast')) return displayBeastPoints(player, cardTitle);
    if ((player.hand.includes('ai') || player.hand.includes('protectron')) && getRaces(cardTitle).includes('bot')) return displayBotPoints(player, cardTitle);
    if (triggerTwinEffect || (player.hand.includes('elfKing') && getRaces(cardTitle).includes('elf'))) return displayElfPoints(player, cardTitle);
    if ((player.hand.includes('emperor') || player.hand.includes('commander')) && getRaces(cardTitle).includes('human')) return displayHumanPoints(player, cardTitle);
    
    // If this is being called on player 1/2's hand and the card is a voidrunner/warp and I'm player 2/1 return appropriate points.
    const xenoCards = ['voidRunner', 'warpstalker', 'nebulite'];
    if (player.hand.some(c => xenoCards.includes(c)) && getRaces(cardTitle).includes('xeno')) return determineXenoPoints(player, cardTitle);

    return $cardDetails[cardTitle].points;
  }

  // --------------------- HUMAN CALCULATIONS ----------------------- \\

  // Calculates all human points including boosts, traps, etc.
  function calculateHumanPoints(player: Player): void {
    const humanCards = player.hand.filter(card => getRaces(card).includes('human'));
    humanCards.forEach(card => player.points.humans += $cardDetails[card].points);

    // Must calculate commander before emperor since emperor multiples * 2 then adds other races
    if (player.hand.includes('commander')) calculateCommander(player);
    if (player.hand.includes('emperor')) calculateEmperor(player);

    // Currently no neutrals that affect human points
    calculateHumanBoosts(player);
    calculateHumanTraps(player);
  }

  // Calculates all boosts that apply to humans and adds them to human points.
  function calculateHumanBoosts(player: Player): void {
    if (areBoostsBlocked(player)) return;

    // Add charge points
    let chargePoints = 0;
    for (let i = 0; i < player.chargeDrawnTurns.length; i++) chargePoints += (gameState.turnCount - player.chargeDrawnTurns[i]);
    player.points.humans += chargePoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.humans += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to humans and deducts them from human points.
  function calculateHumanTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    let infectPoints = 0;
    for (let i = 0; i < player.infectDrawnTurns.length; i++) infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    player.points.humans -= infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.humans -= (numOfSaps * 10);
  }

  // Doubles human points and adds other races as well except Xenos.
  function calculateEmperor(player: Player) {
    player.points.humans *= 2;
    const otherRaceCards = player.hand.filter(card => !getRaces(card).includes('human') && !getRaces(card).includes('xeno'));
    otherRaceCards.forEach(card => player.points.humans += $cardDetails[card].points);
  }

  // Handles human commanders who buff their team
  function calculateCommander(player: Player) {
    let numOfCommanders = player.hand.filter(card => card === 'commander').length;
    let humanCards = player.hand.filter(card => getRaces(card).includes('human'));
    let numOfHumanCards = humanCards.length;
    player.points.humans += numOfHumanCards * numOfCommanders;
  }

  function displayHumanPoints(player: Player, cardTitle: string): number {
    const hasEmperor = player.hand.includes('emperor');
    const numOfCommanders = player.hand.filter(card => card === 'commander').length;

    if (hasEmperor) return ($cardDetails[cardTitle].points + numOfCommanders) * 2;
    if (!hasEmperor) return ($cardDetails[cardTitle].points + numOfCommanders);
  }

  // --------------------- GOBLIN CALCULATIONS ----------------------- \\

  function calculateGoblinPoints(player: Player, otherPlayer: Player, forEndGameCalculation = false): void {
    const goblinCards = player.hand.filter(card => getRaces(card).includes('goblin'));
    goblinCards.forEach(card => player.points.goblins += $cardDetails[card].points);
    if (player.hand.includes('goblinLord')) calculateGoblinLord(player, otherPlayer, forEndGameCalculation);

    // Currently no neutrals that affect goblin points
    calculateGoblinBoosts(player);
    calculateGoblinTraps(player);
  }

  // Calculates all boosts that apply to goblins and adds them to goblin points.
  function calculateGoblinBoosts(player: Player): void {
    if (areBoostsBlocked(player)) return;

    // Add growth points
    let growthPoints = 0;
    for (let i = 0; i < player.growthDrawnTurns.length; i++) growthPoints += (gameState.turnCount - player.growthDrawnTurns[i]);
    player.points.goblins += growthPoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.goblins += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to goblins and deducts them from goblin points.
  function calculateGoblinTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    let infectPoints = 0;
    for (let i = 0; i < player.infectDrawnTurns.length; i++) infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    player.points.goblins -= infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.goblins -= (numOfSaps * 10);
  }
  
  // Determins if goblin mark can be drawn.
  function canDrawGoblinLordMark(player: Player) {
    player.drewWarchief = false;
    return (fullDeck['goblins'] && fullDeck['goblins'].includes('goblinLordsMark')) ? true : false;
  }

  // Instant win for goblins unless otherPlayer has full elf hand + elf king, if so, then instant draw.
  function calculateGoblinLord(player: Player, otherPlayer: Player, calculateElfDefense = false): void {
    // Checks if player hand has only goblins
    const goblinHand = player.hand.every(card => getRaces(card).includes('goblin'));
    
    // Checks if otherPlayer has only elves
    const otherPlayerFullElf = otherPlayer.hand.every(card => getRaces(card).includes('elf'));

    // Checks if otherPlayer has the elf king
    const otherPlayerElfKing = otherPlayer.hand.includes('elfKing');
    
    // Ignore otherPlayer cards if the game is still going on
    if (!calculateElfDefense && goblinHand) {
      player.points.goblins = 1_000_000;
    } else if (calculateElfDefense && goblinHand && otherPlayerFullElf && otherPlayerElfKing) {
      player.points.goblins = 500_000;
    } else if (goblinHand) {
      player.points.goblins = 1_000_000;
    }
  }

  // --------------------- ELF CALCULATIONS ----------------------- \\

  function calculateElfPoints(player: Player, otherPlayer: Player, forEndGameCalculation = false): void {
    const elfCards = player.hand.filter(card => getRaces(card).includes('elf'));
    elfCards.forEach(card => player.points.elves += $cardDetails[card].points);

    // Handles elf twins. Must calculate before elf king since elf king multiples elf points *2/*3
    if (player.hand.includes('nelladan') && player.hand.includes('nadallen')) calculateElfTwins(player);

    // Determines if otherPlayer has full goblin hand and if player has full elf hand, assigns points accordingly.
    if (player.hand.includes('elfKing')) calculateElfKing(player, otherPlayer, forEndGameCalculation);
    
    // Currently no neutrals that affect elf points
    calculateElfBoosts(player);
    calculateElfTraps(player);
  }

  // Calculates all boosts that apply to elves and adds them to elf points.
  function calculateElfBoosts(player: Player): void {
    if (areBoostsBlocked(player)) return;

    // Add growth points
    let growthPoints = 0;
    for (let i = 0; i < player.growthDrawnTurns.length; i++) growthPoints += (gameState.turnCount - player.growthDrawnTurns[i]);
    player.points.elves += growthPoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.elves += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to elves and deducts them from elf points.
  function calculateElfTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    let infectPoints = 0;
    for (let i = 0; i < player.infectDrawnTurns.length; i++) infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    player.points.elves -= infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.elves -= (numOfSaps * 10);
  }

  // Adds bonus points for matching elf twins
  function calculateElfTwins(player: Player) {
    // Each Nelladan gets +5 points and Nadallen gets +5p for each Nelladan. So +10 per Nelladan.
    const bonusTwinPoints = player.hand.filter(card => card === 'nelladan').length * 10;
    player.points.elves += bonusTwinPoints;
  }

  // Calculates special elf king effects
  function calculateElfKing(player: Player, otherPlayer: Player, calculateGoblinKing = false) {
    // Checks if hand has only elves or faebots
    const fullElfHand = player.hand.every(card => getRaces(card).includes('elf'));
    if (!calculateGoblinKing && fullElfHand) player.points.elves *= 3;
    if (!calculateGoblinKing && !fullElfHand) player.points.elves *= 2;
    if (calculateGoblinKing) {
      // Checks if otherPlayer hand has only goblins
      const goblinHand = otherPlayer.hand.every(card => getRaces(card).includes('goblin'));

      // Checks if otherPlayer has the goblin king
      const otherPlayerGoblinKing = otherPlayer.hand.includes('goblinLord');

      if (goblinHand && otherPlayerGoblinKing && fullElfHand) {
        player.points.elves = 500_000;
      } else if (fullElfHand) {
        player.points.elves *= 3;
      } else {
        player.points.elves *= 2;
      }
    }
  }

  // Only called if twins OR elf king + full elf hand (including faeBot)
  function displayElfPoints(player: Player, cardTitle: string): number {
    const hasElfKing = player.hand.includes('elfKing');
    const numOfNelladans = player.hand.filter(card => card === 'nelladan').length;
    const numOfNadallens = player.hand.filter(card => card === 'nadallen').length;
    const fullElfHand = player.hand.every(c => getRaces(c).includes('elf'));
    const triggerTwinEffect = numOfNelladans > 0 && numOfNadallens > 0;

    // Elf king, full hand and twins
    if ((hasElfKing && fullElfHand && triggerTwinEffect)) {
      if (cardTitle === 'nadallen') return ($cardDetails[cardTitle].points + (numOfNelladans * 5) * 3);
      if (cardTitle === 'nelladan') return (($cardDetails[cardTitle].points + 5) * 3);
      
      // Elf king and full hand
    } else if (hasElfKing && fullElfHand) {
      return $cardDetails[cardTitle].points * 3;
      
      // Twins
    } else if (triggerTwinEffect) {
      if (cardTitle === 'nadallen') return ($cardDetails[cardTitle].points + (numOfNelladans * 5));
      if (cardTitle === 'nelladan') return ($cardDetails[cardTitle].points + 5);
    }

    // Default
    return getRaces(cardTitle).includes('elf') ? $cardDetails[cardTitle].points * 2 : $cardDetails[cardTitle].points;
  }

  // --------------------- DWARF CALCULATIONS ----------------------- \\

  function calculateDwarfPoints(player: Player, forEndGameCalculation = false): void {
    const dwarfCards = player.hand.filter(card => getRaces(card).includes('dwarf'));
    dwarfCards.forEach(card => player.points.dwarves += $cardDetails[card].points);

    // Calculates +5 dwarf points per discarded dwarf by any player.
    if (player.hand.includes('longbeardLeader')) calculateLongbeard(player, forEndGameCalculation);
    
    // Currently no neutrals that affect dwarf points
    calculateDwarfBoosts(player);
    calculateDwarfTraps(player);
  }

  // Calculates all boosts that apply to dwaves and adds them to dwarf points.
  function calculateDwarfBoosts(player: Player): void {
    if (areBoostsBlocked(player)) return;

    // Add growth points
    let growthPoints = 0;
    for (let i = 0; i < player.growthDrawnTurns.length; i++) growthPoints += (gameState.turnCount - player.growthDrawnTurns[i]);
    player.points.dwarves += growthPoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.dwarves += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to dwarves and deducts them from dwarf points.
  function calculateDwarfTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    let infectPoints = 0;
    for (let i = 0; i < player.infectDrawnTurns.length; i++) infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    player.points.dwarves -= infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.dwarves -= (numOfSaps * 10);
  }
  
  // Attempts to draw a dwarf next if there are dwarves remaining.
  function isDwarfNext(player: Player): DeckRace {
    player.dwarfNextTurn = false;
    let currentDeck: DeckRace = '';
    let randomNum = 0;

    if (fullDeck['dwarves'] && fullDeck['dwarves'].length !== 0) {
      currentDeck = 'dwarves';
    } else {
      // If no remaining dwarves, random deck 
      randomNum = Math.floor(Math.random() * deckTypes.length);
      currentDeck = deckTypes[randomNum] as DeckRace; // to appease ts gods
    }
    return currentDeck;
  }

  // Draws the giraffe deck cards.
  function drawGiraffeCards(player: Player): string {
    if (player.giraffeCounter === 1) {
      player.giraffeCounter ++; 
      return 'kidGiraffe';
      
    } else if (player.giraffeCounter === 2) {
      player.giraffeCounter ++; 
      return 'adultGiraffe';
      
    } if (player.giraffeCounter === 3) {
      player.giraffeCounter ++; 
      return 'elderGiraffe';

    } if (player.giraffeCounter === 4) {
      player.giraffeCounter ++; 
      return 'nightTerror';
    }
  }

  // Player gains +5 points per discarded dwarf.
  function calculateLongbeard(player: Player, calculateOtherPlayerDiscards = false) {  
    let discardedDwarvesCount = 0;

    if (!calculateOtherPlayerDiscards) {
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

  // --------------------- BEAST CALCULATIONS ----------------------- \\

  function calculateBeastPoints(player: Player): void {
    const beastCards = player.hand.filter(card => getRaces(card).includes('beast'));
    beastCards.forEach(card => player.points.beasts += $cardDetails[card].points);

    if (player.hand.some(card => ['dreamDestroyer', 'nightTerror'].includes(card))) calculateDreamDestroyer(player);

    // If player has humans/hobbits, pawl barkington gains +10 points.
    if (player.hand.includes('dog') && player.hand.some(card => getRaces(card).includes('human'))) {
      const numOfDogs = player.hand.filter(card => card === 'dog').length;
      player.points.beasts += (10 * numOfDogs);
    }

    // Player gains +2 for every wolf on the field, including himself.
    if (player.hand.includes('wolf')) calculateWolfPack(player);
    
    // Currently no neutrals that affect beast points
    calculateBeastBoosts(player);
    calculateBeastTraps(player);
  }

  // Calculates all boosts that apply to dwaves and adds them to beast points.
  function calculateBeastBoosts(player: Player): void {
    if (areBoostsBlocked(player)) return;

    // Add feast points
    const numOfFeasts = player.boosts.filter(boost => boost === 'feast').length;
    player.points.beasts += (numOfFeasts * 10);

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.beasts += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to beasts and deducts them from beast points.
  function calculateBeastTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    let infectPoints = 0;
    for (let i = 0; i < player.infectDrawnTurns.length; i++) infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    player.points.beasts -= infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.beasts -= (numOfSaps * 10);
  }

  // Adds all card points in hand, regardless of race
  function calculateDreamDestroyer(player: Player) {
    const numOfBeastCards = player.hand.filter(card => getRaces(card).includes('beast')).length;
    player.points.beasts = 0;
    player.points.beasts += (numOfBeastCards * 12);
  }

  // +2 points for every wolf on the field, including himself (base wolf points already calculated in calculateBasePoints)
  function calculateWolfPack(player: Player) {
    const numOfWolves = player.hand.filter(card => card === 'wolf').length;
    const numOfWereWolves = player.hand.filter(card => card === 'lupin').length;
    player.points.beasts += numOfWolves * (numOfWolves * 2) + (numOfWereWolves * 2);
  }

  function displayBeastPoints(player: Player, cardTitle: string): number {
    const hasHumans = player.hand.some(c => getRaces(c).includes('human'));
    const hasDreamDestroyer = player.hand.some(card => ['dreamDestroyer', 'nightTerror'].includes(card));

    if (cardTitle === 'wolf') {
      const numOfWolves = player.hand.filter(card => card === 'wolf').length;
      const numOfWerewolves = player.hand.filter(card => card === 'lupin').length;
      return $cardDetails[cardTitle].points + (numOfWolves * 2) + (numOfWerewolves * 2) + (hasDreamDestroyer ? (12 - $cardDetails[cardTitle].points) : 0);
    }
    if (cardTitle === 'dog' && hasHumans && hasDreamDestroyer) return 22;
    if (cardTitle === 'dog' && hasHumans) return 14;
    if (hasDreamDestroyer) return 12;
    return $cardDetails[cardTitle].points;
  }

  // --------------------- BOT CALCULATIONS ----------------------- \\

  function calculateBotPoints(player: Player, otherPlayer: Player, forEndGameCalculation = false): void {
    const botCards = player.hand.filter(card => getRaces(card).includes('bot'));
    botCards.forEach(card => player.points.bots += $cardDetails[card].points);

    // Wipe points if other player has ai
    if (forEndGameCalculation && otherPlayer.hand.includes('ai')) {
      player.points.bots = 0;
    } else {
      // Adds +2 to all bot cards (player + otherPlayer) then steals all bot points.
      if (player.hand.includes('ai')) calculateAi(player, otherPlayer, forEndGameCalculation);
  
      // Must be after A.I. since A.I. resets bot points. Quarantine all viruses adding +8 to their value and +1 bot point to Protectron per quarantined virus.
      if (player.hand.includes('protectron')) calculateProtectron(player, otherPlayer, forEndGameCalculation);
    }
    
    // Currently no neutrals that affect bot points
    calculateBotBoosts(player, otherPlayer);
    calculateBotTraps(player);
  }

  // Calculates all boosts that apply to bots and adds them to bot points.
  function calculateBotBoosts(player: Player, otherPlayer: Player): void {
    if (areBoostsBlocked(player)) return;

    if (!otherPlayer.hand.includes('ai')) {
      // Add charge points
      let chargePoints = 0;
      for (let i = 0; i < player.chargeDrawnTurns.length; i++) chargePoints += (gameState.turnCount - player.chargeDrawnTurns[i]);
      player.points.bots += chargePoints;
    }

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.bots += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to bots and deducts them from bot points.
  function calculateBotTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.bots -= (numOfSaps * 10);
  }

  // Handles Protectrons who negate viruses
  function calculateProtectron(player: Player, otherPlayer: Player, calculateHackingAbility = false) {
    let numOfProtectrons = player.hand.filter(card => card === 'protectron').length;
    let numOfViruses = player.hand.filter(card => card === 'virus').length;
    
    player.hand.forEach(card => {
      if (card === 'virus') player.points.bots += (numOfProtectrons * 8);

      // Buffed for each virus, base points already calculated.
      if (card === 'protectron') player.points.bots += (numOfProtectrons * numOfViruses);
    });

    // If player also has A.I. steal otherPlayer bots too
    if (calculateHackingAbility && player.hand.includes('ai')) {
      let otherPlayerNumOfProtectrons = otherPlayer.hand.filter(card => card === 'protectron').length;
      let otherPlayerNumOfViruses = otherPlayer.hand.filter(card => card === 'virus').length;
      
      otherPlayer.hand.forEach(card => {
        if (card === 'virus') player.points.bots += (numOfProtectrons * 8);
        
        // Buffed for each virus, base points already calculated.
        if (card === 'protectron') player.points.bots += (otherPlayerNumOfProtectrons * otherPlayerNumOfViruses);
      });
    }
  }

  // Adds ALL bot card points on the field to players score, and bots have +2
  function calculateAi(player: Player, otherPlayer: Player, calculateOpponentCards = false) {  
    // Need to reset since base bot points already calculated
    player.points.bots = 0;
    player.hand.forEach(card => {
      if (getRaces(card).includes('bot')) player.points.bots += ($cardDetails[card].points + 2);
    });

    if (calculateOpponentCards) {
      // Add all bot points from otherPlayer hand as well
      otherPlayer.points.bots = 0;
      otherPlayer.hand.forEach(card => {
        if (getRaces(card).includes('bot')) player.points.bots += ($cardDetails[card].points + 2);
      });
    }
  }

  function displayBotPoints(player: Player, cardTitle: string): number {
    let numOfProtectrons = player.hand.filter(card => card === 'protectron').length;
    let numOfViruses = player.hand.filter(card => card === 'virus').length;

    if (player.hand.includes('ai') && player.hand.includes('protectron') && cardTitle === 'virus') return (numOfProtectrons * 8);
    if (player.hand.includes('protectron') && cardTitle === 'virus') return (numOfProtectrons * 8) - 2; // $cardDetails[card].points -s a negative num here
    if (player.hand.includes('ai') && cardTitle === 'virus') return $cardDetails[cardTitle].points + 2;
    if (player.hand.includes('ai') && cardTitle === 'protectron') return $cardDetails[cardTitle].points + numOfViruses + 2;
    if (cardTitle === 'protectron') return $cardDetails[cardTitle].points + numOfViruses;
    if (player.hand.includes('ai')) return $cardDetails[cardTitle].points + 2;

    return $cardDetails[cardTitle].points;
  }

  // --------------------- XENO CALCULATIONS ----------------------- \\

  // Calculates all xeno points including boosts, traps, etc.
  function calculateXenoPoints(player: Player, otherPlayer: Player): void {
    const calculatingForSelf = (player.id === $player1.id && gameState.playingAs === 'p1') || (player.id === $player2.id && gameState.playingAs === 'p2');
    const xenoCards = player.hand.filter(card => getRaces(card).includes('xeno'));
    xenoCards.forEach(card => calculatingForSelf ? player.points.xenos += $cardDetails[card].points : player.points.xenos += remoteCardDetails[card].points);

    // Nebulites buff xenos by 4 points
    if (player.hand.includes('nebulite')) calculateSpecialXenoCard(player, 'nebulite');

    calculateXenoBoosts(player);
    calculateXenoTraps(player);
    calculateXenoNeutrals(player, otherPlayer);
  }

  // Calculates all boosts that apply to xenos and adds them to xeno points.
  function calculateXenoBoosts(player: Player): void {
    if (areBoostsBlocked(player)) return;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.xenos += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to xenos and deducts them from xeno points.
  function calculateXenoTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    let infectPoints = 0;
    for (let i = 0; i < player.infectDrawnTurns.length; i++) infectPoints += (gameState.turnCount - player.infectDrawnTurns[i]);
    player.points.xenos -= infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.xenos -= (numOfSaps * 10);

    // Xenophobia
    const numOfXenophobias = player.traps.filter(trap => trap === 'xenophobia').length;
    player.points.xenos -= (numOfXenophobias * 10);
  }

  // Calculates all traps that apply to xenos and deducts them from xeno points.
  function calculateXenoNeutrals(player: Player, otherPlayer: Player): void {
    const numOfXenoBlooms = player.neutrals.filter(n => n === 'xenoBloom').length + otherPlayer.neutrals.filter(n => n === 'xenoBloom').length;
    const numOfXenoBlossoms = player.neutrals.filter(n => n === 'xenoBlossom').length + otherPlayer.neutrals.filter(n => n === 'xenoBlossom').length;
    player.points.xenos += ((numOfXenoBlooms * 15) + (numOfXenoBlossoms * 5));
  }

  function determineXenoPoints(player: Player, cardTitle: string): number {
    const specialXenoCards = ['voidRunner', 'warpstalker'];
    const numOfNebulites = player.hand.filter(card => card === 'nebulite').length;

    if (player.id === $player1.id && (numOfNebulites > 0 && cardTitle !== 'nebulite')) {
      return (specialXenoCards.includes(cardTitle) && gameState.playingAs === 'p2') ? remoteCardDetails[cardTitle].points + 4 : $cardDetails[cardTitle].points + 4;
    } else if (player.id === $player1.id) {
      return (specialXenoCards.includes(cardTitle) && gameState.playingAs === 'p2') ? remoteCardDetails[cardTitle].points : $cardDetails[cardTitle].points;
    } else if (player.id === $player2.id && (numOfNebulites > 0 && cardTitle !== 'nebulite')) {
      return (specialXenoCards.includes(cardTitle) && gameState.playingAs === 'p1') ? remoteCardDetails[cardTitle].points + 4 : $cardDetails[cardTitle].points + 4;
    } else if (player.id === $player2.id) {
      return (specialXenoCards.includes(cardTitle) && gameState.playingAs === 'p1') ? remoteCardDetails[cardTitle].points : $cardDetails[cardTitle].points;
    }
  }

  // Calculates special xeno card points
  function calculateSpecialXenoCard(player: Player, cardTitle: string) {
    // If card drawn is warpstalker, generate point value for card between 7-13 inclusive.
    if (cardTitle === 'warpstalker') $cardDetails[cardTitle].points = Math.ceil(Math.random() * 7) + 6;

    // If card drawn is voidRunner, set points equal to amount of turns passed
    if (cardTitle === 'voidRunner') $cardDetails[cardTitle].points = gameState.turnCount;

    // Nebulites buff xenos by 4 points
    if (cardTitle === 'nebulite') {
      const numOfNonNebuliteXenos = player.hand.filter(card => getRaces(card).includes('xeno') && card !== 'nebulite').length;
      player.points.xenos += (numOfNonNebuliteXenos * 4);
    }
  }

  // Return regular points if it's not special xeno card
  function endGameXenoPointHandler(cardTitle: string, player: 'p1' | 'p2'): number {
    if (!['warpstalker', 'voidRunner'].includes(cardTitle)) return $cardDetails[cardTitle].points;
    
    if (gameState.playingAs === player) {
      if (cardTitle === 'warpstalker') return $cardDetails['warpstalker'].points;
      if (cardTitle === 'voidRunner') return $cardDetails['voidRunner'].points;
    } else {
      if (cardTitle === 'warpstalker') return remoteCardDetails['warpstalker'].points;
      if (cardTitle === 'voidRunner') return remoteCardDetails['voidRunner'].points;
    } 
    
    return 0; // Should not run, just to appease the ts gods
  }

  // Trades warpstalker and voidrunner client values before calculation
  function updateClientsForSpecialXenoCards() {
    gameState.showSpinner = true;
    socket.emit('start-xeno-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
  }

  // -------------- BOOST/TRAP/NEUTRAL CALCULATIONS ---------------- \\

  // Adds boost card to players boosts array
  function addBoostCard(player: Player, cardTitle: string) {
    player.boosts = [...player.boosts, cardTitle];
    
    if (cardTitle === 'chastity') player.hasChastity = true;
    if (cardTitle === 'charge') player.chargeDrawnTurns.push(gameState.turnCount);
    if (cardTitle === 'growth') player.growthDrawnTurns.push(gameState.turnCount);
  }

  // Adds trap card to players traps array
  async function addTrapCard(player: Player, card) {
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

  // Adds neutral card to players neutrals array
  async function addneutralCard(player: Player, card, drawn = true) {
    player.neutrals = [...player.neutrals, card];

    // If Echo card, player draws and plays twice
    if (card === 'echo') {
      player.playingTwice = true;
      socket.emit('display-event', 'echo');
    }

    // If vision card, player sees otherPlayer's hand for one turn
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

    calculateCurrentPlayerPoints(player);
  }

  // Neutralizes deck (remove boosts / traps in effect)
  function neutralizeDeck() {
    showEvent('neutralize');

    player1.update($player1 => {
      $player1.neutralizedCards = [...$player1.boosts, ...$player1.traps, ...$player1.neutrals];
      $player1.boosts = [];
      $player1.traps = [];
      $player1.neutrals = [];
      $player1.chargeDrawnTurns = [];
      $player1.growthDrawnTurns = [];
      $player1.infectDrawnTurns = [];
      $player1.hasChastity = false;
      $player1.hasCorruption = false;
      $player1.hasVision = false;
      $player1.isExposed = false;
      $player1.chargePoints = 0;
      $player1.growthPoints = 0;
      $player1.infectPoints = 0;
      return $player1;
    });

    player2.update($player2 => {
      $player2.neutralizedCards = [...$player2.boosts, ...$player2.traps, ...$player2.neutrals];
      $player2.boosts = [];
      $player2.traps = [];
      $player2.neutrals = [];
      $player2.chargeDrawnTurns = [];
      $player2.growthDrawnTurns = [];
      $player2.infectDrawnTurns = [];
      $player2.hasChastity = false;
      $player2.hasCorruption = false;
      $player2.hasVision = false;
      $player2.isExposed = false;
      $player2.chargePoints = 0;
      $player2.growthPoints = 0;
      $player2.infectPoints = 0;
      return $player2;
    });

    const player = gameState.playingAs === 'p1' ? $player1 : $player2;
    calculateCurrentPlayerPoints(player);
  }

  // ---------------------------------------------------------------- \\
  // ------------------------ UI/UX/VISUALS  ------------------------ \\
  // ---------------------------------------------------------------- \\

  function toggleP1NameChangeVisibility(): void {
    if (gameState.playingAs === 'p2') return;
    gameState.p1NameChangeVisible = !gameState.p1NameChangeVisible;
  }
  
  function toggleP2NameChangeVisibility(): void {
    if (gameState.playingAs === 'p1') return;
    gameState.p2NameChangeVisible = !gameState.p2NameChangeVisible;
  }

  function displayBonusCardIcons(cardTitle: string): string {
    return $cardDetails[cardTitle].image;
  }

  // Converts race card bg to legendary if player is holding the leader of that race.
  function determineRarity(player: Player, cardTitle: string): '' |  'common' | 'uncommon' | 'rare' | 'amazing' | 'epic' | 'legendary' {
    if (player.hand.includes('emperor') && getRaces(cardTitle).includes('human')) return 'legendary';
    if (player.hand.includes('goblinLord') && getRaces(cardTitle).includes('goblin')) return 'legendary';
    if (player.hand.includes('elfKing') && getRaces(cardTitle).includes('elf')) return 'legendary';
    if (player.hand.includes('longbeardLeader') && getRaces(cardTitle).includes('dwarf')) return 'legendary';
    if (player.hand.includes('ai') && getRaces(cardTitle).includes('bot')) return 'legendary';
    if (player.hand.some(card => ['dreamDestroyer', 'nightTerror'].includes(card)) && getRaces(cardTitle).includes('beast')) return 'legendary';
    return $cardDetails[cardTitle].rarity;
  }

  // Conditionally displays card points as green if they are buffed.
  function determineIfPointColorGreen(player: Player, cardTitle: string): boolean {
    const specialXenoCards = ['voidRunner', 'warpstalker'];
    const pointValue = displayCardPoints(player, cardTitle);
    const isPeakingAtOtherHand = ((gameState.playingAs === 'p1' && player.id === $player2.id) || gameState.playingAs === 'p2' && player.id === $player1.id);

    if (isPeakingAtOtherHand && specialXenoCards.includes(cardTitle)) return (pointValue > remoteCardDetails[cardTitle].points);
    return (pointValue > $cardDetails[cardTitle].points);
  }

  function updateUsernameForOtherClient(): void {
    gameState.playingAs === 'p1' ? gameState.p1NameChangeVisible = false : gameState.p2NameChangeVisible = false;
    const player = gameState.playingAs === 'p1' ? $player1 : $player2;
    player.title = gameState.newPlayerTitle;
    socket.emit('username-changed', player.title);
  }

  function updateUsernameForThisClient(newUsername: string): void {
    gameState.playingAs === 'p1' ? $player2.title = newUsername : $player1.title = newUsername;
  }

  function toggleLibraryVisibility() {
    gameState.discardsVisible = false;
    gameState.libraryVisible = !gameState.libraryVisible;
  }

  // Toggles card discards visibility
  function toggleDiscardVisibility() {
    gameState.libraryVisible = false;
    gameState.discardsVisible = !gameState.discardsVisible;
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

  // Determines if card should be visible or not
  function isCardVisible(playerSide: string) {
    if (gameState.gameOver) return true;
    if (gameState.playingAs === 'p1' && playerSide === 'p1') return true;
    if (gameState.playingAs === 'p2' && playerSide === 'p2') return true;

    // player has vision?
    return false;
  }

  // Opens library to card clicked
  function openLibraryToCard(race: Race): void {
    gameState.discardsVisible = false;
    gameState.libraryVisible = true;
    // So library has time to open and DOM can create elements
    setTimeout(() => {
      const element = document.getElementById(`${race}-section`);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  // ---------------------------------------------------------------- \\
  // ------------------------ UTILITY & LOGS ------------------------ \\
  // ---------------------------------------------------------------- \\

  // Logs how many cards are left in the deck
  function logDeck(allDecks = false) {
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

  // Determines who can click on deck
  async function clickOnDeck() {
    if (gameState.gameOver) return;
    if (isPlayerTurn() && $player1.turn) await drawCard($player1);
    if (isPlayerTurn() && $player2.turn) await drawCard($player2);
  }
  
  // Handles player click on card
  async function clickOnCard(event, playerHand) {
    // Gather info about the card, what card was just clicked? Title is most important
    let title = event.detail.title;

    if (playerHand.length > 5) await discard(title);
  }
 
  // Handles player click on gobbledegook button
  async function clickOnGobbledegook() {
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

  // Check if boosts should be calculated or skipped
  function areBoostsBlocked(player: Player): boolean {
    return player.hand.includes('xenoGuard') || (player.hand.includes('corruption') || player.hasCorruption);
  }

  // Check if traps should be calculated or skipped
  function areTrapsBlocked(player: Player): boolean {
    return player.hand.includes('rhino') || (player.hand.includes('chastity') || player.hasChastity);
  }

  // Returns all races associated with a card
  function getRaces(cardTitle: string): string[] {
    return [$cardDetails[cardTitle].race, ...$cardDetails[cardTitle].otherRaces];
  }

  // Determines if current player is the winner
  function isPlayerWinner(): boolean {
    return ((gameState.playingAs === 'p1' && $player1.highestPoints > $player2.highestPoints) ||
             gameState.playingAs === 'p2' && $player2.highestPoints > $player1.highestPoints)
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
 {#if ['p1', 'p2'].includes(gameState.playingAs)}
  <main class="main-content">
    <!-- Discards -->
    <svg on:click={toggleDiscardVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="card-discards-btn">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
    {#if gameState.discardsVisible}
      <Discards discards={gameState.playingAs === 'p1' ? $player1.discards : $player2.discards}/>
    {/if}

    <!-- Card Library -->
    <svg on:click={toggleLibraryVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="card-library-btn">
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
            <p class:color-green={isPlayerWinner()}>{gameState.winMessage}</p>
            <p class="margin-bottom-sm" class:color-red={!isPlayerWinner()}>{gameState.loseMessage}</p>

            <hr>

            <h2 class:player-name-bordered-yellow={gameState.playingAs === 'p1'}>
              {#if gameState.playingAs === 'p1'}&rarr;{/if}
              {$player1.title}
              {#if gameState.playingAs === 'p1'}&larr;{/if}
            </h2>

            <span>Boosts: </span>
            {#each $player1.boosts as boost}
              <span class="color-blue" class:line-through={areBoostsBlocked($player1)}>{boost} &nbsp;</span>
            {/each}
            <p>Charge Points: <span class="color-blue" class:line-through={areBoostsBlocked($player1)}>{$player1.chargePoints}</span></p>
            <p class="margin-bottom-sm">Growth Points: <span class="color-blue" class:line-through={areBoostsBlocked($player1)}>{$player1.growthPoints}</span></p>

            <span>Traps: </span>
            {#each $player1.traps as trap}
              <span class="color-red" class:line-through={areTrapsBlocked($player1)}>{trap} &nbsp;</span>
            {/each}
            <p class="margin-bottom-sm">Infect Penalty: <span class="color-red" class:strikethrough={areTrapsBlocked($player1)}>{$player1.infectPoints}</span></p>

            <span>Neutral Cards: </span>
            {#each $player1.neutrals as neutral}
              <span class="color-purple">{neutral} &nbsp;</span>
            {/each}

            <p>Other Neutral Effects: 
              {#each $player2.neutrals.filter(n => ['neutralize', 'switcharoo', 'ticktock', 'tocktick', 'xenoBloom', 'xenoBlossom'].includes(n)) as neutral}
                <span class="color-purple">{neutral} &nbsp;</span>
              {/each}
            </p>

            <p>Neutralized Cards: 
              {#each $player2.neutralizedCards as card}
                <span class="line-through"
                  class:color-purple={getRaces(card).includes('neutral')}
                  class:color-blue={getRaces(card).includes('boost')}
                  class:color-red={getRaces(card).includes('trap')}>
                    {card} &nbsp;
                </span>
              {/each}
            </p>

            <!-- Show all race points -->
            <RacePoints player={$player1}/>

            <h2 class="results-player-floating-header results-player-float-left" class:color-yellow__bright={gameState.playingAs === 'p1'}>{$player1.title}</h2>
          </div>

          <div>
            <p>{$player1.title} Win/Lose/Draw: {$player1.wins}/{$player1.losses}/{$player1.draws}</p>
            <p class="margin-bottom-sm">{$player2.title} Win/Lose/Draw: {$player2.wins}/{$player2.losses}/{$player2.draws}</p>
            
            <hr>

            <h2 class:player-name-bordered-yellow={gameState.playingAs === 'p2'}>
              {#if gameState.playingAs === 'p2'}&rarr;{/if}
              {$player2.title}
              {#if gameState.playingAs === 'p2'}&larr;{/if}
            </h2>

            <span>Boosts: </span>
            {#each $player2.boosts as boost}
              <span class="color-blue" class:line-through={areBoostsBlocked($player2)}>{boost} &nbsp;</span>
            {/each}
            <p>Charge Points: <span class="color-blue" class:line-through={areBoostsBlocked($player2)}>{$player2.chargePoints}</span></p>
            <p class="margin-bottom-sm">Growth Points: <span class="color-blue" class:line-through={areBoostsBlocked($player2)}>{$player2.growthPoints}</span></p>

            <span>Traps: </span>
            {#each $player2.traps as trap}
              <span class="color-red" class:line-through={areTrapsBlocked($player2)}>{trap} &nbsp;</span>
            {/each}
            <p class="margin-bottom-sm">Infect Penalty: <span class="color-red" class:line-through={areTrapsBlocked($player2)}>{$player2.infectPoints}</span></p>

            <span>Neutral Cards: </span>
            {#each $player2.neutrals as neutral}
              <span class="color-purple">{neutral} &nbsp;</span>
            {/each}

            <p>Other Neutral Effects: 
              {#each $player1.neutrals.filter(n => ['neutralize', 'switcharoo', 'ticktock', 'tocktick', 'xenoBloom', 'xenoBlossom'].includes(n)) as neutral}
                <span class="color-purple">{neutral} &nbsp;</span>
              {/each}
            </p>

            <p>Neutralized Cards: 
              {#each $player1.neutralizedCards as card}
                <span class="line-through"
                  class:color-purple={getRaces(card).includes('neutral')}
                  class:color-blue={getRaces(card).includes('boost')}
                  class:color-red={getRaces(card).includes('trap')}>
                    {card} &nbsp;
                </span>
              {/each}
            </p>

            <!-- Show all race points -->
            <RacePoints player={$player2}/>

            <h2 class="results-player-floating-header results-player-float-right" class:color-yellow__bright={gameState.playingAs === 'p2'}>{$player2.title}</h2>
            <h2 class="results-player-floating-header results-turn-count-float-middle">Turn count: {gameState.turnCount}</h2>
          </div>
        </div>

        <div class="player-history-wrapper-container">
          <div class="player-history-wrapper {$player1.highestPoints > $player2.highestPoints ? 'player-history-wrapper__winner' : 'player-history-wrapper__loser'}"
            class:player-history-wrapper__tie={$player1.highestPoints === $player2.highestPoints}
            class:border-yellow={gameState.playingAs === 'p1'}>
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
                  modifiedPoints={displayCardPoints($player1, card)}
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
                modifiedPoints={displayCardPoints($player1, card)}
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
                    modifiedPoints={displayCardPoints($player1, card)}
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
                  modifiedPoints={displayCardPoints($player1, card)}
                  />
                </div>
              {/each}
            </div>
          </div>
  
          <div class="player-history-wrapper {$player2.highestPoints > $player1.highestPoints ? 'player-history-wrapper__winner' : 'player-history-wrapper__loser'}"
            class:player-history-wrapper__tie={$player1.highestPoints === $player2.highestPoints}
            class:border-yellow={gameState.playingAs === 'p2'}>
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
                  modifiedPoints={displayCardPoints($player2, card)}
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
                modifiedPoints={displayCardPoints($player2, card)}
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
                  modifiedPoints={displayCardPoints($player2, card)}
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
                  modifiedPoints={displayCardPoints($player2, card)}
                  />
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    
    <!-- Game / Board view -->
    {:else}
      <!-- Loading screen -->
      {#if gameState.showSpinner}
        <Spinner />
      {/if}

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
                  <div on:contextmenu|preventDefault={() => openLibraryToCard('boost')} class="bonus-card-icons-section bonus-card-icons-section__boosts" class:bonus-card-icons-section__blocked={areBoostsBlocked($player1)}>
                    {#each $player1.boosts as boost}
                      <img src={displayBonusCardIcons(boost)} alt={displayBonusCardIcons(boost)} class="bonus-card-icon">
                    {/each}
                  </div>
                  
                  <div on:contextmenu|preventDefault={() => openLibraryToCard('trap')} class="bonus-card-icons-section bonus-card-icons-section__traps" class:bonus-card-icons-section__blocked={areTrapsBlocked($player1)}>
                    {#each $player1.traps as trap}
                      <img src={displayBonusCardIcons(trap)} alt={displayBonusCardIcons(trap)} class="bonus-card-icon">
                    {/each}
                  </div>
                    
                  <div on:contextmenu|preventDefault={() => openLibraryToCard('neutral')} class="bonus-card-icons-section bonus-card-icons-section__neutrals">
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
              on:cardClick={async event => await clickOnCard(event, $player1.hand)}
              on:contextmenu={() => openLibraryToCard($cardDetails[card].race)}        
              faceUp={isCardVisible('p1') || $player2.hasVision || $player1.isExposed}
              displayTitle={$cardDetails[card].displayTitle}
              title={$cardDetails[card].title}
              img={$cardDetails[card].image}
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
              race={$cardDetails[card].race}
              rarity={determineRarity($player1, card)}
              points={endGameXenoPointHandler(card, 'p1')}
              modifiedPoints={displayCardPoints($player1, card)}
              buffed={determineIfPointColorGreen($player1, card)}
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
                  <div on:contextmenu|preventDefault={() => openLibraryToCard('boost')} class="bonus-card-icons-section bonus-card-icons-section__boosts" class:bonus-card-icons-section__blocked={areBoostsBlocked($player2)}>
                    {#each $player2.boosts as boost}
                      <img src={displayBonusCardIcons(boost)} alt={displayBonusCardIcons(boost)} class="bonus-card-icon">
                    {/each}
                  </div>
                  
                  <div on:contextmenu|preventDefault={() => openLibraryToCard('trap')} class="bonus-card-icons-section bonus-card-icons-section__traps" class:bonus-card-icons-section__blocked={areTrapsBlocked($player2)}>
                    {#each $player2.traps as trap}
                      <img src={displayBonusCardIcons(trap)} alt={displayBonusCardIcons(trap)} class="bonus-card-icon">
                    {/each}
                  </div>
                    
                  <div on:contextmenu|preventDefault={() => openLibraryToCard('neutral')} class="bonus-card-icons-section bonus-card-icons-section__neutrals">
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
              on:cardClick={async (event) => await clickOnCard(event, $player2.hand)}
              on:contextmenu={() => openLibraryToCard($cardDetails[card].race)}
              faceUp={isCardVisible('p2') || $player1.hasVision || $player2.isExposed}
              displayTitle={$cardDetails[card].displayTitle}
              title={$cardDetails[card].title}
              img={$cardDetails[card].image}
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
              race={$cardDetails[card].race}
              rarity={determineRarity($player2, card)}
              points={endGameXenoPointHandler(card, 'p2')}
              modifiedPoints={displayCardPoints($player2, card)}
              buffed={determineIfPointColorGreen($player2, card)}
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
            <Button on:click={async () => clickOnGobbledegook()} round={true} customClasses="btn__orange">GDG</Button>
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

  .player-history-wrapper-container {
    grid-column: span 3; // So I can use flex with gap to separate player sections
    display: flex;
    justify-content: space-evenly;
  }

  .player-history-wrapper {
    padding: 20px;
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

  .bonus-card-icons-section__blocked {
    box-shadow: none;
    background: #222;
    border-left: 4px double #3d3d3d;
    border-right: 4px double #3d3d3d;
  }

  .bonus-card-icon {
    width: 24px;
    height: 20px;

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

  .color-yellow__bright {
    color: #ffd400;
  }
  
  .line-through {
    text-decoration: line-through;
  }
  
  .border-yellow {
    border: 2px dashed #ffd400;
  }
  
  .player-name-bordered-yellow {
    color: #ffd400;
    border: 1px dotted #ffd400;
    border-radius: 4px;
    text-align: center;
    margin-bottom: 2px;
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