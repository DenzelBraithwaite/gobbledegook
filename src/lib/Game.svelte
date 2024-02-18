<script>
  // Hooks
  import { onMount } from 'svelte';

  // Transitions
  import { fade } from 'svelte/transition';

  // Stores
  import { player1, player2, cardDetails, xenoDeck, beastDeck, botDeck, dwarfDeck, elfDeck, goblinDeck, humanDeck } from './stores';

  // Custom components
  import { Button } from './index';
  import GGCard from '../lib/Card.svelte';

  // Websocket
  import { io } from 'socket.io-client';
  import { emitKeypressEvents } from 'readline';

  $: console.log({p1: $player1, p2: $player2});
  let socket = io('http://192.168.2.10:6912');
  let gobbledegookDeclared = false;
  let gobbledegookDisabled = false;
  let startBtnDisabled = false;
  let gameOver = true;
  let winMessage = '';
  let loseMessage = '';
  let turnCount = 0;
  // Deck players draw from, includes all race decks
  let fullDeck = {
    beasts: [...$beastDeck],
    bots: [...$botDeck],
    dwarves: [...$dwarfDeck],
    elves: [...$elfDeck], 
    goblins: [...$goblinDeck],
    humans: [...$humanDeck],
    xenos: [...$xenoDeck]
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
        player1.update(store => {
          store.id = users['p1'];
          return store;
        });

        player2.update(store => {
          store.id = users['p2'];
          return store;
        });

        // TODO: Handle guests.
      }); 
    });

    // Resets game and updates player hands
    socket.on('game-started', data => {
      resetGame();

      // Update player hands
      player1.update(store => {
        store.hand = data.player1.hand;
        store.startingHand = data.player1.hand;
        store.turn = data.player1.turn;
        return store;
      });

      player2.update(store => {
        store.hand = data.player2.hand;
        store.startingHand = data.player2.hand;
        store.turn = data.player2.turn;
        return store;
      });

      fullDeck = {...data.fullDeck};
    });

    // Handles turn change for all users
    socket.on('turn-changed', data => {
      turnCount += 0.5;
      player1.update(store => {
        store.turn = !data.player1.turn;
        return store;
      });

      player2.update(store => {
        store.turn = !data.player2.turn;
        return store;
      });
    });

    // Handles card draw for all users
    socket.on('card-drawn', data => {
      fullDeck = {...data.fullDeck};
      deckTypes = data.deckTypes;

      // Make sure player's (hands) are consistent.
      player1.set(data.player1);
      player2.set(data.player2);
    });

    // Handles card discard for all users
    socket.on('card-discarded', data => {
      player1.set(data.player1);
      player2.set(data.player2);
    });

    // Handles gobbledegook declaration for all users
    socket.on('gdg-declared', () => gobbledegookDeclared = true);

    // Handles game end for all users
    socket.on('game-ended', () => endGame());

    // Lets server know client is ready.
    socket.emit('client-ready');
  });

  // Ends current round
  function endGame() {
    gameOver = true;
    startBtnDisabled = false;
    gobbledegookDisabled = true;
    
    player1.update(store => {
      store.turn = false;
      return store;
    });
    player2.update(store => {
      store.turn = false;
      return store;
    });

    calculateTotalPoints($player1, $player2);
    calculateTotalPoints($player2, $player1);
    determineWinner();

    // Loggs decks to console
    showDeck();
    showDeck(true);
  }

  // Resets values to restart the game.
  function resetGame() {
    // Reset p1
    player1.update(store => {
      store.highestPoints = 0;
      store.points.beasts = 0;
      store.points.bots = 0;
      store.points.dwarves = 0;
      store.points.elves = 0;
      store.points.goblins = 0;
      store.points.humans = 0;
      store.points.xenos = 0;
      store.discards = [];
      store.justWon = false;
      return store;
    });

    // Reset p2
    player2.update(store => {
      store.highestPoints = 0;
      store.points.beasts = 0;
      store.points.bots = 0;
      store.points.dwarves = 0;
      store.points.elves = 0;
      store.points.goblins = 0;
      store.points.humans = 0;
      store.points.xenos = 0;
      store.discards = [];
      store.justWon = false;
      return store;
    });

    // Reset Deck
    fullDeck['humans'] = [...$humanDeck];
    fullDeck['goblins'] = [...$goblinDeck];
    fullDeck['elves'] = [...$elfDeck];
    fullDeck['dwarves'] = [...$dwarfDeck];
    fullDeck['bots'] = [...$botDeck];
    fullDeck['beasts'] = [...$beastDeck];
    fullDeck['xenos'] = [...$xenoDeck];

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
    dealCards($player1.hand);
    dealCards($player2.hand);
    decideFirstPlayer();

    // Send data to websocket server
    socket.emit('start-game', {player1: $player1, player2: $player2, fullDeck});
  }

  // Ensures player 1 isn't always first to start
  function decideFirstPlayer() {
    const num = Math.ceil(Math.random() * 2);
    if (num === 1) {
      $player1.turn = true
      $player2.turn = false;
    } else {
      $player1.turn = false
      $player2.turn = true;
    }
  }

  // Logs how many cards are left in the deck
  function showDeck(allDecks = false) {
    const beastCardsLeft = fullDeck['beasts'].length || 0;
    const botCardsLeft = fullDeck['bots'].length || 0;
    const dwarfCardsLeft = fullDeck['dwarves'].length || 0;
    const elfCardsLeft = fullDeck['elves'].length || 0;
    const goblinCardsLeft = fullDeck['goblins'].length || 0;
    const humanCardsLeft = fullDeck['humans'].length || 0;
    const xenoCardsLeft = fullDeck['xenos'].length || 0;

    if (allDecks) {
      console.log(`Cards remaining per deck:\n
      Humans: ${humanCardsLeft}\n
      Goblins: ${goblinCardsLeft}\n
      Elves: ${elfCardsLeft}\n
      Dwarves: ${dwarfCardsLeft}\n)
      Bots: ${botCardsLeft}\n)
      Xenos: ${xenoCardsLeft}\n)
      Beasts: ${beastCardsLeft}\n`);
    } else {
      const cardsLeft = humanCardsLeft + goblinCardsLeft + elfCardsLeft + dwarfCardsLeft + botCardsLeft + beastCardsLeft + xenoCardsLeft;
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
    return false;
  }

  // Changes active player turn
  function changeTurns() {
    socket.emit('change-turns', {player1: $player1, player2: $player2});
  }

  // Deals 5 cards to each player at the start of the round
  function dealCards(playerHand) {
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
      playerHand.push(cardDrawn);
    }

    // Need to reassign for svelte to be reactive
    if ($player1.hand === playerHand) {
      player1.update(store => {
        store.hand = playerHand;
        store.startingHand = playerHand;
        return store;
      });
    } else {
      player2.update(store => {
        store.hand = playerHand;
        store.startingHand = playerHand;
        return store;
      });
    }
  }

  // Draws and removes 1 random card from the deck
  function drawCard(player) {
    if (gameOver) return;
    let currentDeck = '';
    let cardDrawn = '';
    let randomNum = 0;

    // Player can't declare gobbledegook if they drew that turn
    gobbledegookDisabled = true;

    // Player can't draw when he has 6 cards
    if (player.hand.length > 5) return;
    
    // If player has longbeard leader, next card is a dwarf
    if (player.dwarfNextTurn) {
      player.dwarfNextTurn = false;
      if (fullDeck['dwarves'].length !== 0) {
        currentDeck = 'dwarves';
      } else {
        // If no remaining dwarves, random deck 
        randomNum = Math.floor(Math.random() * deckTypes.length);
        currentDeck = deckTypes[randomNum];
      }
    } else {
      // Grab random deck 
      randomNum = Math.floor(Math.random() * deckTypes.length);
      currentDeck = deckTypes[randomNum];
    }

    // When the last card is drawn, currentDeck becomes undefined. This will catch that
    if (deckTypes.length === 0 && currentDeck === undefined) {
      console.log("No more cards!");
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
      // Grab random card from that deck
      randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
      cardDrawn = fullDeck[currentDeck][randomNum];
    
      // If it's the longbeard leader or dwarf commander, the next card will be dwarf
      if (cardDrawn === 'longbeardLeader' || cardDrawn === 'dwarfCommander') player.dwarfNextTurn = true;

      // If it's the goblin lord's mark, the next card will be the goblin lord
      if (cardDrawn === 'goblinLordsMark') player.goblinLordMarked = true;

      // If it's the warpstalker, generate point value for card between 8-12 inclusive.
      // if (cardDrawn === 'warpstalker') $cardDetails[cardDrawn].points = Math.ceil(Math.random() * 5) + 7;
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
    if (player.title === 'Player 1') {
      player1.update(store => {
        store.hand = [...store.hand, cardDrawn];
        store.cardsDrawn = [cardDrawn, ...player.cardsDrawn];
        return store;
      });
    } else {
      player2.update(store => {
        store.hand = [...store.hand, cardDrawn];
        store.cardsDrawn = [cardDrawn, ...player.cardsDrawn];
        return store;
      });
    }
    
    // Emits to server that a card was drawn
    socket.emit('draw-card', {player1: $player1, player2: $player2, deckTypes: deckTypes, fullDeck: fullDeck});
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

    if (isPlayerTurn() && $player1.turn) {
      const index = $player1.hand.indexOf(card);
      player1.update(store => {
        store.hand.splice(index, 1);
        store.discards = [...store.discards, card];
        return store;
      });
    }
    
    if (isPlayerTurn() && $player2.turn) {
      const index = $player2.hand.indexOf(card);
      player2.update(store => {
        store.hand.splice(index, 1);
        store.discards = [...store.discards, card];
        return store;
      });
   }

    // Emits to server that a card was discarded
    socket.emit('discard-card', {player1: $player1, player2: $player2});

    if (gobbledegookDeclared) {
      socket.emit('end-game');
    } else {
      changeTurns();
      gobbledegookDisabled = false;
    }
  };
  
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
      socket.emit('end-game');
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
      $player1.justWon = true;
      $player1.wins += 1;
      $player2.losses += 1;

      winMessage = `Player 1 is the winner with ${$player1.highestPoints} points!🎊🥳🍾`;
      loseMessage = `Player 2 loses with ${$player2.highestPoints} points...${$player2.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
    } else if($player2.highestPoints > $player1.highestPoints) {
      $player2.justWon = true;
      $player2.wins += 1;
      $player1.losses += 1;

      winMessage = `Player 2 is the winner with ${$player2.highestPoints} points!🎊🥳🍾`;
      loseMessage = `Player 1 loses with ${$player1.highestPoints} points...${$player1.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
    } else if ($player1.highestPoints === 500_000 && $player2.highestPoints === 500_000) {
      $player1.justWon = true;
      $player2.justWon = true;
      $player2.draws += 1;
      $player1.draws += 1;

      winMessage = `It seems neither the goblins nor the elves want to go to war with each other while their leaders are on the field...`;
      loseMessage = " it's a draw!😓😓😓"
    } else {
      $player1.justWon = true;
      $player2.justWon = true;
      $player2.draws += 1;
      $player1.draws += 1;

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

        case 'xeno':
          player.points.xenos += $cardDetails[card].points;
        break;

        default:
          console.log("Didn't match a race???");
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

    // Because calculateTotalPoints() is run back to back, firtst with p1 as player, p2 might calculate bot points even when "hacked" by crusher.
    if (enemy.hand.includes('crusher541A57')) player.points.bots = 0;

    // Special cards)
    if (player.hand.includes('commander')) calculateCommander(player); // Must be before emperor since emperor multiplies final points.
    if (player.hand.includes('emperor')) calculateEmperor(player);
    if (player.hand.includes('goblinLord')) calculateGoblinLord(player, enemy);
    if (player.hand.includes('elfKing')) calculateElfKing(player, enemy);
    if (player.hand.includes('dreamDestroyer')) calculateDreamDestroyer(player);
    if (player.hand.includes('dreamDestroyer')) calculateDreamDestroyer(player);
    if (player.hand.includes('crusher541A57')) calculateCrusher(player, enemy);
    if (player.hand.includes('ai')) calculateAI(player, enemy); // Must be after crusher since crusher resets bot points.
    if (player.hand.includes('longbeardLeader')) calculateLongbeard(player);

    // Elf twins bonus 10 points, placed after calculateElfKing() since it does not stack with elf king
    if (player.hand.includes('nelladan') && player.hand.includes('nadallen')) player.points.elves += 10;

    player.highestPoints = Math.max(
      player.points.beasts,
      player.points.bots,
      player.points.dwarves,
      player.points.elves,
      player.points.goblins,
      player.points.humans,
      player.points.xenos
    );

    console.log({
      player: player.title,
      highestPoints: player.highestPoints,
      beastPoints: player.points.beasts,
      botPoints: player.points.bots,
      dwarfPoints: player.points.dwarves,
      elfPoints: player.points.elves,
      goblinPoints: player.points.goblins,
      humanPoints: player.points.humans,
      xenoPoints: player.points.xenos
    });
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
  function calculateAI(player, enemy) {
    let numOfAi = player.hand.filter(card => card === 'ai').length;
    let numOfViruses = player.hand.filter(card => card === 'virus').length;

    // If player also has crusher, steal their bots too
    if (player.hand.includes('crusher541A57')) {
      numOfAi += enemy.hand.filter(card => card === 'ai').length;
      numOfViruses += enemy.hand.filter(card => card === 'virus').length;
    }
      
    player.hand.forEach(card => {
      if (card === 'virus') player.points.bots += 8; // since -2 + 8 = 6
      if (card === 'ai') player.points.bots += (numOfAi * numOfViruses); // buffed for each virus
    });

    if (player.hand.includes('crusher541A57')) {
      enemy.hand.forEach(card => {
        if (card === 'virus') player.points.bots += 8; // since -2 + 8 = 6
        if (card === 'ai') player.points.bots += (numOfAi * numOfViruses); // buffed for each virus
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
  function calculateCrusher(player, enemy) {  
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

    // Check if there are more discarded dwarves than remaining dwarves in the deck, account for if deck has been removed
    if (fullDeck['dwarves']) {
      discardedDwarvesCount >= fullDeck['dwarves'].length ? player.points.dwarves += 50 : player.points.dwarves += 0;
    } else {
      // If the deck has been removed, give the bonus points since there are no more dwarves to draw
      player.points.dwarves += 50
    }
  }
</script>

<main>
  {#if !startBtnDisabled}
    <Button on:click={startGame} customClasses="btn__green w-25">Start game</Button>
  {:else}
    <Button customClasses="btn__green_disabled w-25">Game in progress...</Button>
  {/if}

  {#if winMessage}
    <div class="results-screen" transition:fade>
      <div class="results-messages-flex-wrapper">
        <div>
          <p>{winMessage}</p>
          <p>{loseMessage}</p>
          <h2 class="results-player-floating-header results-player-float-left">Player 1</h2>
        </div>
        <div>
          <p>Player 1 Win/Lose/Draw: {$player1.wins}/{$player1.losses}/{$player1.draws}</p>
          <p>Player 2 Win/Lose/Draw: {$player2.wins}/{$player2.losses}/{$player2.draws}</p>
          <h2 class="results-player-floating-header results-player-float-right">Player 2</h2>
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
              points={$cardDetails[card].points}
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
             points={$cardDetails[card].points}
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
                points={$cardDetails[card].points}
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
               points={$cardDetails[card].points}
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
              points={$cardDetails[card].points}
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
             points={$cardDetails[card].points}
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
                points={$cardDetails[card].points}
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
               points={$cardDetails[card].points}
              />
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <div class="game-board {gobbledegookDeclared ? 'gobble-declared' : ''}">
      <div class="card-section card-section__ally {$player1.turn || $player1.justWon ? "section-active" : ""}">
        <p class="p1-name {$player1.turn ? "turn-active" : ""}">Player 1</p>
        {#each $player1.hand as card}
          <GGCard
            on:cardClick={(event) => selectCard(event, $player1.hand)}
            faceUp={isCardVisible('p1') || gameOver}
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
      <div class="card-section card-section__enemy {$player2.turn || $player2.justWon ? "section-active" : ""}">
        <p class="p2-name {$player2.turn ? "turn-active" : ""}">Player 2</p>
        {#each $player2.hand as card}
          <GGCard
            on:cardClick={(event) => selectCard(event, $player2.hand)}
            faceUp={isCardVisible('p2') || gameOver}
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
        <GGCard on:click={deckClickHandler} faceUp={false} />
        {#if gobbledegookDisabled || turnCount < 3}
          <Button round={true} customClasses="btn__orange_disabled">Gobbledegook!</Button>
        {:else}
          <Button on:click={gobbledegook} round={true} customClasses="btn__orange">Gobbledegook!</Button>
        {/if}
      </div>
      {#if startBtnDisabled}
        <p class="turn-text">{$player1.turn ? "Player 1" : "Player 2"}<span>'s turn</span></p>
      {/if}
    </div>
  {/if}
</main>


<style>
  /* Game End */
  .results-screen {
    z-index: 1;
    width: 95%;
    height: 85dvh;
    font-size: 1.25rem;
    padding: 1rem;
    color: #fff;
    background: linear-gradient(214deg, #ddceee50, #855a2a50, #69c0ad50, #78c06950, #c0736950, #c2a84c50);
    box-shadow: 0 4px 20px #000000;
    border: 10px double #976f39bd;
    border-radius: 0.5rem;
    margin: 1rem auto 0.25rem;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.1;
    overflow-y: scroll;

    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .results-screen::-webkit-scrollbar {
    appearance: none;
  }

  .results-messages-flex-wrapper {
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

    position: sticky;
    top: 0;
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
    height: 85dvh;
    width: 90%;
    padding: 0.5rem;
    max-width: 1500px;
    margin: 1rem auto;
    border-radius: 1rem;
    background-color: #200f009d;
    box-shadow: 0 4px 20px #000000;
    border: 2px solid #e4802e3f;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .gobble-declared {
    border: 10px dotted #e29836;
  }

  .card-section {
    width: 85%;
    padding: 1rem;
    background-color: #e4c82e1f;
    height: 32%;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
  }

  .card-section__ally {
    border-radius: 1rem 1rem 0 0;
    position: absolute;
    bottom: 0;
  }
  
  .card-section__enemy {
    border-radius: 0 0 1rem 1rem;
    position: absolute;
    top: 0;
  }

  .section-active {
    background-color: #7abe8b75;
  }

  .turn-text {
    z-index: 1;
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.75rem;
    color: #af4819;
  }

  .turn-text > span {
    color: #CAB097;
  }

  .p1-name {
    position: absolute;
    font-size: 1.5rem;
    color: #af4819;
    bottom: 17.5rem;
    right: 0;
  }

  .p2-name {
    position: absolute;
    font-size: 1.5rem;
    color: #af4819;
    top: 17.5rem;
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
</style>