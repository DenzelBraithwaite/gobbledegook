<script>
  // Hooks
  import { onMount } from 'svelte';

  // Stores
  import { player1, player2, cardDetails, beastDeck, botDeck, dwarfDeck, elfDeck, goblinDeck, humanDeck } from './stores';

  // Custom components
  import { Button } from './index';
  import GGCard from '../lib/Card.svelte';

  // Websocket
  import { io } from 'socket.io-client';

  $: console.log({p1: $player1, p2: $player2});
  let socket = io('http://192.168.2.10:6912');
  let gobbledegookDeclared = false;
  let gobbledegookDisabled = false;
  let startBtnDisabled = false;
  let gameOver = true;
  let winMessage = '';
  let loseMessage = '';
  let boardBlur = false;
  let turnCount = 0;
  // Deck players draw from, includes all race decks
  let fullDeck = {
    humans: [...$humanDeck],
    goblins: [...$goblinDeck],
    elves: [...$elfDeck], 
    dwarves: [...$dwarfDeck],
    bots: [...$botDeck],
    beasts: [...$beastDeck],
  };
  
  onMount(() => {
    // Handles connects
    socket.on('connect', () => console.log(`User ID: ${socket.id} connected!`));

    // Handles connection errors
    socket.on('connect_error', error => console.error('Connection error:', error));

    // Handles game start
    socket.on('start-game', (data) => {
      console.log('Game started:', data);

      player1.update(store => {
        store.hand = data.player1.hand;
        return store;
      });

      player2.update(store => {
        store.hand = data.player2.hand;
        return store;
      });

      fullDeck = {...data.fullDeck};
    });

    // Sets users (Beware that p1 might be titled player 2 and vice versa due to server.js)
    socket.on('set-users', data => {
      console.log('Setting users:', data);
      Object.entries(data).forEach(([key, value]) => {
        if (socket.id === value) {
          player1.update(store => {
            store.id = value;
            store.title = key;
            return store;
          });
        } else {
          player2.update(store => {
            store.id = value;
            store.title = key;
            return store;
          });
        }
      });  
    });

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
      store.points = calculateTotalPoints($player1, $player2);
      return store;
    });

    player2.update(store => {
      store.turn = false;
      store.points = calculateTotalPoints($player2, $player1);
      return store;
    });
    
    // Remove bot points from players hands if hacked
    if ($player1.hacked) playerHacked($player1);
    if ($player2.hacked) playerHacked($player2);
    determineWinner();
    showDeck();
    showDeck(true);
  }

  // Resets values to restart the game.
  function resetGame() {
    // Reset p1
    player1.update(store => {
      store.points = 0;
      store.discards = [];
      store.hacked = false;
      store.justWon = false;
      return store;
    });

    // Reset p2
    player2.update(store => {
      store.points = 0;
      store.discards = [];
      store.hacked = false;
      store.justWon = false;
      return store;
    });

    // General reset
    turnCount = 0;
    gameOver = false;
    startBtnDisabled = true;
    gobbledegookDeclared = false;
    gobbledegookDisabled = false;
    winMessage = '';
    fullDeck['humans'] = [...$humanDeck];
    fullDeck['goblins'] = [...$goblinDeck];
    fullDeck['elves'] = [...$elfDeck];
    fullDeck['dwarves'] = [...$dwarfDeck];
    fullDeck['bots'] = [...$botDeck];
    fullDeck['beasts'] = [...$beastDeck];
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

  // TODO: Joins a user's game
  function joinGame() {
    console.log('Joining game...');

    resetGame();
  }

  // array for each deck, humans, goblins, elves and dwarves
  const deckTypes = Object.keys(fullDeck);

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
    boardBlur = !boardBlur;
  }

  // Controller logic for game
  function showDeck(allDecks = false) {
    const humanCardsLeft = fullDeck['humans'].length || 0;
    const goblinCardsLeft = fullDeck['goblins'].length || 0;
    const elfCardsLeft = fullDeck['elves'].length || 0;
    const dwarfCardsLeft = fullDeck['dwarves'].length || 0;
    const botCardsLeft = fullDeck['bots'].length || 0;
    const beastCardsLeft = fullDeck['beasts'].length || 0;
    if (allDecks) {
      console.log(`Cards remaining per deck:\n
      Humans: ${humanCardsLeft}\n
      Goblins: ${goblinCardsLeft}\n
      Elves: ${elfCardsLeft}\n
      Dwarves: ${dwarfCardsLeft}\n)
      Bots: ${botCardsLeft}\n)
      Beasts: ${beastCardsLeft}\n`);
    } else {
      const cardsLeft = humanCardsLeft + goblinCardsLeft + elfCardsLeft + dwarfCardsLeft + botCardsLeft + beastCardsLeft;
      console.log(`Cards remaining in deck: ${cardsLeft}`);
    }
  }

  // Changes active player turn
  function changeTurns() {
    turnCount += 0.5;
    $player1.turn = !$player1.turn;
    $player2.turn = !$player2.turn;
    boardBlur = !boardBlur;
  }

  // Deals 5 cards to each player at the start of the round
  function dealCards(playerHand) {
    
    // Clear players hands before drawing cards, keeps reference to array without reassigning.
    playerHand.length = 0;

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
    if (playerHand === $player1.hand) {
      $player1.hand = [...playerHand];
    } else {
      $player2.hand = [...playerHand];
    }
  }

  // Draws and removes 1 random card from the deck
  function drawCard(player) {
    if (gameOver) return;
    let currentDeck = '';
    let randomNum = 0;

    // Player can't declare gobbledegook if they drew that turn
    gobbledegookDisabled = true;

    // Player can't draw when he has 6 cards
    if (player.hand.length > 5) return;
    
    // If player has longbeard leader, next card is dward
    if (player.dwarfNextTurn) {
      currentDeck = 'dwarf';
      player.dwarfNextTurn = false;
    } else {
      // Grab random deck 
      randomNum = Math.floor(Math.random() * deckTypes.length);
      currentDeck = deckTypes[randomNum];
    }

    // When the last card is drawn, currentDeck becomes undefined. This will catch that
    if (deckTypes.length === 0 && currentDeck === undefined) {
      console.log("No more cards!");
      endGame();
      return;
    };

    // When a smaller race deck runs out, it will be removed here.
    if (fullDeck[currentDeck].length <= 1) {
      // Remove deck from main deck
      const index = deckTypes.indexOf(currentDeck);
      deckTypes.splice(index, 1);
    }

    // Grab random card from that deck
    randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
    const cardDrawn = fullDeck[currentDeck][randomNum];

    // If it's the longbeard leader, the next card will be dwarf
    if (cardDrawn === 'longbeardLeader') player.dwarfNextTurn = true;

    // const removedCard = fullDeck[currentDeck].find(card => card === cardDrawn);
    const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
    fullDeck[currentDeck].splice(removedCardIndex, 1);

    // Add to player's hand and trigger reactivity
    (player.title === 'Player 1') ? $player1.hand = [...player.hand, cardDrawn] : $player2.hand = [...player.hand, cardDrawn];
  }

  // Removes card from hand if player hand has over 6 cards
  function discard(card) {
    if ($player1.turn) {
      const index = $player1.hand.indexOf(card);
      $player1.hand.splice(index, 1)
      $player1.hand = [...$player1.hand];
      $player1.discards = [...$player1.discards, card];
    } else {
      const index = $player2.hand.indexOf(card);
      $player2.hand.splice(index, 1)
      $player2.hand = [...$player2.hand];
      $player2.discards = [...$player2.discards, card];
    }
    if (gobbledegookDeclared) {
      endGame();
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
 
  // End the game
  function gobbledegook() {
    if (gameOver) return;

    if (gobbledegookDeclared) {
      endGame();
    } else {
      console.log('Gobbledegook declared!!');
      changeTurns();
      gobbledegookDeclared = true;
    }
  }

  // Display game results
  function determineWinner() {
    if($player1.points > $player2.points) {
      $player1.justWon = true;
      $player1.wins += 1;
      $player2.losses += 1;

      winMessage = `Player 1 is the winner with ${$player1.points} points!🎊🥳🍾`;
      loseMessage = `Player 2 loses with ${$player2.points} points...${$player2.points <= 0 ? '💩💩💩' : '💩'}`;
    } else if($player2.points > $player1.points) {
      $player2.justWon = true;
      $player2.wins += 1;
      $player1.losses += 1;

      winMessage = `Player 2 is the winner with ${$player2.points} points!🎊🥳🍾`;
      loseMessage = `Player 1 loses with ${$player1.points} points...${$player1.points <= 0 ? '💩💩💩' : '💩'}`;
    } else if ($player1.points === 500_000 && $player2.points === 500_000) {
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

      winMessage = `Player 1 had ${$player1.points} points and player 2 had ${$player2.points} points...`;
      loseMessage = " it's a draw!😓"
    }
  }

  // Calculates card points by race, doesn't include special traits
  function calculateBasePoints(playerHand, options={elfBonus: 0}) {
    let highestPoints = 0;
    const allPoints = {
      humanPoints: 0,
      goblinPoints: 0,
      elfPoints: 0 + options.elfBonus, // To handle elf twins
      dwarfPoints: 0,
      botPoints: 0,
      beastPoints: 0
    };

    // calculates points based on race, picks highest points
    playerHand.forEach((card) => {
      const race = $cardDetails[card].race;
      switch(race) {
        case 'human':
          allPoints.humanPoints += $cardDetails[card].points;
        break;

        case 'goblin':
          allPoints.goblinPoints += $cardDetails[card].points;
        break;

        case 'elf':
          allPoints.elfPoints += $cardDetails[card].points;
        break;

        case 'dwarf':
          if ($cardDetails[card].title = 'hobbit') {
            allPoints.dwarfPoints += $cardDetails[card].points;
            allPoints.humanPoints += $cardDetails[card].points;
          } else {
            allPoints.dwarfPoints += $cardDetails[card].points;
          }
        break;

        case 'bot':
          $cardDetails[card].title = 'faeBot' ? allPoints.elfPoints += $cardDetails[card].points : allPoints.botPoints += $cardDetails[card].points;
        break;

        case 'beast':
          allPoints.beastPoints += $cardDetails[card].points;
        break;

        default:
          console.log("Didn't match a race???");
      }

      highestPoints = Math.max(
        allPoints.humanPoints,
        allPoints.goblinPoints,
        allPoints.elfPoints,
        allPoints.dwarfPoints,
        allPoints.botPoints,
        allPoints.beastPoints
      );
    });
    return highestPoints;
  }

  // Calculates total points (special and base)
  function calculateTotalPoints(player, enemy) {
    let highestPoints = 0;
    let humanPoints = 0;
    let goblinPoints = 0;
    let elfPoints = 0;
    let dwarfPoints = 0;
    let botPoints = 0;
    let beastPoints = 0;

    highestPoints = calculateBasePoints(player.hand);

    // Deck leaders
    if (player.hand.includes('emperor')) humanPoints = calculateEmperor(player);

    if (player.hand.includes('goblinLord')) goblinPoints = calculateGoblinLord(player, enemy);

    if (player.hand.includes('elfKing')) {
        elfPoints = calculateElfKing(player, enemy);
    } else if (player.hand.includes('nelladan') && player.hand.includes('nadallen')) {
        // Elf twins bonus 10 points, elf king bonus (*3 points) handled in calculateElfKing()
        elfPoints += 10;
    }

    if (player.hand.includes('dreamDestroyer')) beastPoints = calculateDreamDestroyer(player);

    if (player.hand.includes('crusher541A57')) botPoints = calculateCrusher(player, enemy);

    if (player.hand.includes('longbeardLeader')) dwarfPoints = calculateLongbeard(player);

    // Human commander
    if (player.hand.includes('commander')) {
      if (!player.hand.includes('emperor')) {
        let numOfCommanders = 0;

        player.hand.forEach(card => {
          if ($cardDetails[card].title === 'commander') numOfCommanders += 1;
        });

        player.hand.forEach(card => {
          if ($cardDetails[card].race === 'human') humanPoints += $cardDetails[card].points + numOfCommanders;
        });
      }
    };
        
    highestPoints = Math.max(
      highestPoints,
      humanPoints,
      goblinPoints,
      elfPoints,
      dwarfPoints,
      botPoints,
      beastPoints
    );

    console.log({
      player: player.title,
      highestPoints: highestPoints,
      humanPoints: humanPoints,
      goblinPoints: goblinPoints,
      elfPoints: elfPoints,
      dwarfPoints: dwarfPoints,
      botPoints: botPoints,
      beastPoints: beastPoints,
    });

    return highestPoints;
  }

  // Adds all card points in hand, regardless of race. Humans worth double
  function calculateEmperor(player) {
    let points = 0;
    let numOfCommanders = 0;

    // Checks for commanders
    player.hand.forEach(card => {
      if ($cardDetails[card].title === 'commander') numOfCommanders += 1;
    });

    player.hand.forEach(card => {
      if ($cardDetails[card].race === 'human') {
        points += (($cardDetails[card].points + numOfCommanders) * 2);
      } else {
        points += $cardDetails[card].points;
      }
    });
    return points;
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
      return 500_000;
    } else if (goblinHand) {
      return 1_000_000;
    } else {
      console.log('inside calculateGoblinLord(), else statement :(');
      return calculateBasePoints(player.hand);
    }
  }

  function calculateElfKing(player, enemy) {
    let totalElfPoints = 0;

    // Checks if enemy hand has only goblins
    const goblinHand = enemy.hand.every(card => { 
      return $cardDetails[card].race === 'goblin';
    });

    // Checks if hand has only elves or faebots
    const fullElfHand = player.hand.every(card => $cardDetails[card].race === 'elf' || $cardDetails[card].title === 'faeBot');

    // Checks if hand has the elf king
    const elfKing = player.hand.includes('elfKing');

    if (goblinHand && (fullElfHand && elfKing)) {
      return 500_000;
    } else if (fullElfHand && elfKing) {
      // Multiples all card points by 3 due to elf king bonus
      player.hand.forEach(card => {
        totalElfPoints += $cardDetails[card].points * 3;
      })
      
      // Checks if player has the only Nadallen in deck, then adds bonus to nadallen and one nelladan.
      if (player.hand.includes('nadallen') && player.hand.includes('nelladan')) {
        let nadPts = 4 * 3;
        let nelPts = 2 * 3;
        totalElfPoints -= (nadPts + nelPts);

        nadPts = 9 * 3;
        nelPts = 7 * 3;
        totalElfPoints += (nadPts + nelPts);
      }

      return totalElfPoints;
    } else if (player.hand.includes('nelladan') && player.hand.includes('nadallen')) {
      return calculateBasePoints(player.hand, {elfBonus: 10});
    } else {
      console.log('inside calculateElfKing(), else statement :(');
      return calculateBasePoints(player.hand);
    }
  }

  // Adds all card points in hand, regardless of race
  function calculateDreamDestroyer(player) {  
    let points = 0;      
    // Checks if player hand has only beasts
    const fullBeastHand = player.hand.every(card => { 
      return $cardDetails[card].race === 'beast';
    });

    if (fullBeastHand) {
      return 50;
    } else {
      player.hand.forEach(card => {
        if ($cardDetails[card].race === 'beast') points += 10;
      })
      return points;
    }
  }

  // Adds ALL bot card points on the field to players score, and bots have +2
  function calculateCrusher(player, enemy) {  
    let allBotPoints = 0;      

    // Add all bot points
    player.hand.forEach(card => {
      if ($cardDetails[card].race === 'bot') allBotPoints += ($cardDetails[card].points + 2);
    });

    enemy.hand.forEach(card => {
      if ($cardDetails[card].race === 'bot') allBotPoints += ($cardDetails[card].points + 2);
    });

    enemy.hacked = true;
    return allBotPoints;
  }

  // Adds ALL bot card points on the field to players score, and bots have +2
  function calculateLongbeard(player) {  
    let points = 0;

    player.hand.forEach(card => {
      if ($cardDetails[card].race === 'dwarf') points += ($cardDetails[card].points);
    });

    const mostCards = Math.max(
      fullDeck['humans'].length,
      fullDeck['goblins'].length,
      fullDeck['elves'].length,
      fullDeck['dwarves'].length,
      fullDeck['bots'].length,
      fullDeck['beasts'].length
    )

    return mostCards === fullDeck['dwarves'].length ? (points + 40) : 0;  
  }

  // Reduce bot points if player got hacked
  function playerHacked(player) {
    player.hand.forEach(card => {
      if ($cardDetails[card].race === 'bot') {
        // FIXME: Shouldn't deduct from total points, but bot points.
        // TODO: add race points to player objects
        // TODO: if not reactive, update stores to trigger reactivity.
        if ($cardDetails[card].points > 0) {
          player.points -= $cardDetails[card].points;
        } else {
          player.points += 0;
        }
      }
    }); 
  }
</script>

<main>
  {#if !startBtnDisabled}
    <Button on:click={startGame} customClasses="btn__green w-25">Start game</Button>
  {:else}
    <Button customClasses="btn__green_disabled w-25">Game in progress...</Button>
  {/if}

  <div class="game-end-wrapper">
    {#if winMessage}
      <div class="game-results">
        <p>{winMessage}</p>
        <p>{loseMessage}</p>
        <br>
        <p>Player 1 stats: Wins: {$player1.wins}, Losses: {$player1.losses}, Draws: {$player1.draws}</p>
        <p>Player 2 stats: Wins: {$player2.wins}, Losses: {$player2.losses}, Draws: {$player2.draws}</p>
        <div class="lg-discard-wrapper">
          <div class="discard-wrapper">
            <h4>Player 1 cards discarded:</h4>
            <ul class="discarded-cards">
              {#each $player1.discards as card}
                <GGCard
                displayTitle={$cardDetails[card].displayTitle}
                title={$cardDetails[card].title}
                img={$cardDetails[card].image}
                race={$cardDetails[card].race}
                points={$cardDetails[card].points} />
              {/each}
            </ul>
          </div>
          <div class="discard-wrapper">
            <h4>Player 2 cards discarded:</h4>
            <ul class="discarded-cards">
              {#each $player2.discards as card}
                <GGCard
                displayTitle={$cardDetails[card].displayTitle}
                title={$cardDetails[card].title}
                img={$cardDetails[card].image}
                race={$cardDetails[card].race}
                points={$cardDetails[card].points} />
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <div class="game-board {gobbledegookDeclared ? 'gobble-declared' : ''}">
      <!-- Blurs board between turns -->
      {#if boardBlur}
        {#if $player1.turn}
          <p class="player-turn-alert"><span class="text-orange">Player 1</span>, click when ready.</p>
        {/if}
        {#if $player2.turn}
          <p class="player-turn-alert"><span class="text-orange">Player 2</span>, click when ready.</p>
        {/if}
        <div on:click={() => boardBlur = false} class="board-blurred"></div>
      {:else}
        <div class="card-section card-section__ally {$player1.turn || $player1.justWon ? "section-active" : ""}">
          <p class="p1-name {$player1.turn ? "turn-active" : ""}">Player 1</p>
          {#each $player1.hand as cardTitle}
            <GGCard
             on:cardClick={(event) => selectCard(event, $player1.hand)}
             faceDown={$player1.turn || gameOver? false : true}
             displayTitle={$cardDetails[cardTitle].displayTitle}
             title={$cardDetails[cardTitle].title}
             img={$cardDetails[cardTitle].image}
             trait={$cardDetails[cardTitle].trait}
             traitTitle={$cardDetails[cardTitle].traitTitle}
             description={$cardDetails[cardTitle].description}
             race={$cardDetails[cardTitle].race}
             points={$cardDetails[cardTitle].points}
             newToHand={$player1.hand[5] === cardTitle ? true : false}/>
          {/each}
        </div>
        <div class="card-section card-section__enemy {$player2.turn || $player2.justWon ? "section-active" : ""}">
          <p class="p2-name {$player2.turn ? "turn-active" : ""}">Player 2</p>
          {#each $player2.hand as cardTitle}
            <GGCard
             on:cardClick={(event) => selectCard(event, $player2.hand)}
             faceDown={$player2.turn || gameOver ? false : true}
             displayTitle={$cardDetails[cardTitle].displayTitle}
             title={$cardDetails[cardTitle].title}
             img={$cardDetails[cardTitle].image}
             trait={$cardDetails[cardTitle].trait}
             traitTitle={$cardDetails[cardTitle].traitTitle}
             description={$cardDetails[cardTitle].description}
             race={$cardDetails[cardTitle].race}
             points={$cardDetails[cardTitle].points}
             newToHand={$player2.hand[5] === cardTitle ? true : false}/>
          {/each}
        </div>

        <div class="game-buttons">
          <GGCard on:click={() => {$player1.turn ? drawCard($player1) : drawCard($player2)}} faceDown={true} />
          {#if gobbledegookDisabled || turnCount < 3}
            <Button round={true} customClasses="btn__orange_disabled">Gobbledegook!</Button>
          {:else}
            <Button on:click={gobbledegook} round={true} customClasses="btn__orange">Gobbledegook!</Button>
          {/if}
        </div>
      {/if}
      {#if startBtnDisabled}
        <p class="turn-text">{$player1.turn ? "Player 1" : "Player 2"}<span>'s turn</span></p>
      {/if}
    </div>
  </div>
</main>


<style>
    .game-end-wrapper {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 1rem;
        gap: 1rem;
    }

    .game-results {
        font-size: 1.5rem;
        background-color: #200f009d;
        box-shadow: 0 4px 20px #000000;
        border: 10px double #e29836;
        color: #fff;
        border-radius: 0.5rem;
        padding: 1rem;
        flex-basis: 40%;
        line-height: 1.5;
        z-index: 100;
        height: 85dvh;
        overflow-y: scroll;

    }

    .game-results::-webkit-scrollbar {
        appearance: none;
    }

    .lg-discard-wrapper {
        margin-top: 3rem;
        display: flex;
    }

    .discarded-cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .board-blurred {
        z-index: 100;
        height: 110%;
        width: 110%;

        position: absolute;
    }

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

    .player-turn-alert {
        z-index: 10;
        color: #ccc;
        text-shadow: 0 4px 10px #cacaca28;
        font-size: 3rem;
        cursor: default;
        font-family: 'Franklin Gothic Medium';
    }

    /* Utility */
    .text-orange {
        color: #af4819;
    }
</style>