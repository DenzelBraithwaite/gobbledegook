<script lang="ts">
  // Hooks
  import { onMount, tick } from 'svelte';

  // Transitions
  import { fade } from 'svelte/transition';

  // Helpers
  import wait from '../helpers/wait';

  // Stores
  import { type Player, player1, player1Reset, player2, player2Reset, cardDetails, beastDeck, botDeck, dwarfDeck, elfDeck, goblinDeck, humanDeck, xenoDeck, spiritDeck, boostDeck,  trapDeck, neutralDeck } from '../stores';

  // Custom components
  import { Button, Discards, RemainingCardsModal, Library, RankingsModal, Spinner, RacePoints } from './index';
  import GGCard from './Card.svelte';

  // ai generated: The decision engine stays independent from Svelte and receives only the information a real player could know.
  import { ageOpponentHandMemory, chooseCpuDiscard, createCpuMemory, decideCpuDeclaration, getCpuEchoAction, getForcedCpuRacePath, isCpuDeclarationDisabledByName, isCpuDeclarationForcedByName, rememberCpuDecision, rememberOpponentHand, type CpuObservation, type CpuOpponentInsightSource } from '../game/cpuStrategy';

  // Websocket
  import { io } from 'socket.io-client';

  type DeckRace = 'humans' | 'goblins' | 'elves' | 'dwarves' | 'beasts' | 'bots' | 'xenos' | 'spirits' | 'boosts' | 'traps' | 'neutrals' | 'giraffe' | 'xenoEgg' | '';
  type Race = 'human' | 'goblin' | 'elf' | 'dwarf' | 'beast' | 'bot' | 'xeno' | 'spirit' | 'boost' | 'trap' | 'neutral' | '';
  const bardCards = ['bardLute', 'bardFlute', 'bardHorn', 'bardDrum', 'bardSinger'];
  const aiBotCardBonus = 4;
  let socket = io('http://192.168.2.14:6912', { autoConnect: false });
  let gameMode: 'singleplayer' | 'multiplayer' = 'singleplayer';
  // ai generated: These are server-owned multiplayer records; singleplayer never loads or saves them.
  type MultiplayerRecord = { name: string; wins: number; losses: number; draws: number; elo: number };
  let multiplayerRecords: { p1: MultiplayerRecord; p2: MultiplayerRecord } = {
    p1: { name: 'Player 1', wins: 0, losses: 0, draws: 0, elo: 1000 },
    p2: { name: 'Player 2', wins: 0, losses: 0, draws: 0, elo: 1000 }
  };
  // ai generated: Badge tiers only affect the multiplayer display; ELO changes still come from the server.
  type EloBadge = 'loser' | 'wood' | 'silver' | 'gold' | 'goblin';
  // ai generated: One descending list drives both the live badge and the explanatory rankings modal.
  const eloRanks: { badge: EloBadge; label: string; threshold: string; minElo: number }[] = [
    { badge: 'goblin', label: 'Goblin', threshold: '1300+', minElo: 1300 },
    { badge: 'gold', label: 'Gold', threshold: '1100–1299', minElo: 1100 },
    { badge: 'silver', label: 'Silver', threshold: '900–1099', minElo: 900 },
    { badge: 'wood', label: 'Wood', threshold: '700–899', minElo: 700 },
    { badge: 'loser', label: 'Loser', threshold: '699 or less', minElo: Number.NEGATIVE_INFINITY }
  ];
  function getEloBadge(elo: number): EloBadge {
    return eloRanks.find(rank => elo >= rank.minElo)?.badge ?? 'loser';
  }
  $: p1EloBadge = getEloBadge(multiplayerRecords.p1.elo);
  $: p2EloBadge = getEloBadge(multiplayerRecords.p2.elo);
  let rankingsVisible = false;
  // ai generated: The rankings list takes focus visually without leaving another card-info modal underneath it.
  function openRankings(): void {
    gameState.libraryVisible = false;
    gameState.discardsVisible = false;
    gameState.remainingCardsVisible = false;
    rankingsVisible = true;
  }
  // ai generated: Before a build copies badge art into public, keep its space without a broken-image icon.
  function setBadgeImageVisibility(event: Event, visible: boolean): void {
    (event.currentTarget as HTMLImageElement).style.visibility = visible ? 'visible' : 'hidden';
  }
  // ai generated: Toggle this value while testing to show or hide detailed CPU path explanations in the browser console.
  let cpuStrategyDebugEnabled = true;
  const cpuNames = ['Gruntilda', 'KazBot', 'TinkBot', 'CPU', 'AI', 'Guest#445', 'LawjokerBot', 'DefinitelyNotABot', 'Player 2', 'Challenger', 'Mr Quack', 'Mrs Quack', 'A Duck', 'Bot', 'Benny'];
  let cpuMemory = createCpuMemory();
  let cpuTurnTimeout: ReturnType<typeof setTimeout> | undefined;
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
    remainingCardsVisible: false,
    showEventMessage: false,
    newPlayerTitle: 'Unknown Player',
    connectedNameChangeSide: '' as '' | 'p1' | 'p2',
    p1NameChangeVisible: false,
    p2NameChangeVisible: false,
    playingAs: '' as 'p1' | 'p2',
    playersRevealed: false,
  };
  let remainingLegendaries = [];
  let remainingXenoEggs = ['drainite', 'xerandium', 'sporax'];
  // Deep clone nested card objects so runtime point changes cannot alter the defaults used for rematches.
  let controlCopyOfCardDetails = structuredClone($cardDetails);
  let remoteCardDetails = structuredClone($cardDetails);
  // For checking if user is connected
  let p1Connected = false;
  let p2Connected = false;
  let intervalId;
  let timeoutId;
  const heartBeatInterval = 500;
  const heartBeatTimeout = 1000;
  // Deck players draw from, includes all race decks
  let fullDeck = {
    humans: [...$humanDeck],
    goblins: [...$goblinDeck],
    elves: [...$elfDeck],
    dwarves: [...$dwarfDeck],
    beasts: [...$beastDeck],
    bots: [...$botDeck],
    xenos: [...$xenoDeck],
    spirits: [...$spiritDeck],
    boosts: [...$boostDeck],
    traps: [...$trapDeck],
    neutrals: [...$neutralDeck]
  };
  // array for each deck, humans, goblins, elves and dwarves
  let deckTypes: DeckRace[] | string[] = Object.keys(fullDeck);

  onMount(() => {
    // Respons to connection 
    socket.on('check-connected-users-response', () => {
      // If we get a reply, cancel the "disconnect" timeout and mark connected
      if (timeoutId) clearTimeout(timeoutId);
      markOtherClientAsConnected();

      // Schedule next timeout for the next ping
      timeoutId = setTimeout(markOtherClientAsDisconnected, heartBeatTimeout);
    });

    // Handles connects
    socket.on('connect', () => console.log(`User ID: ${socket.id} connected!`));

    // Handles connection errors
    socket.on('connect_error', error => console.error('Connection error:', error));

    // Takes users from server and sets them on clients' frontend
    socket.on('set-users', users => setUsers(users));

    // Readies up players and starts game if both players ready.
    socket.on('player-readied-up', data => {
      player1.set({...$player1, isReady: data.player1.isReady});
      player2.set({...$player2, isReady: data.player2.isReady});
    });

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

    // Counts turns, broacast not io emit.
    socket.on('add-turn-count', () => gameState.turnCount++);

    // Handles turn change for all users
    socket.on('turn-changed', data => void applyTurnChange(data));

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
      $cardDetails['drainite'].points = data.copyOfXenoPoints.drainite;
      $cardDetails['xerandium'].points = data.copyOfXenoPoints.xerandium;
      $cardDetails['sporax'].points = data.copyOfXenoPoints.sporax;
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
    socket.on('game-ended', data => {
      endGame();
      // ai generated: Only the server-selected reporter submits scores, so both clients cannot count one game twice.
      if (data.reporterId === socket.id) socket.emit('record-game-result', { p1: $player1.highestPoints, p2: $player2.highestPoints });
    });

    socket.on('player-records', records => { multiplayerRecords = records; });
    socket.on('player-names', names => {
      player1.update(player => ({ ...player, title: names.p1 }));
      player2.update(player => ({ ...player, title: names.p2 }));
    });
    socket.on('record-save-error', () => console.error('Multiplayer record could not be saved on the server.'));

    // Let's user change their username at anytime
    socket.on('update-username', data => updateUsernameForThisClient(data))

    // Reveal both players (this is an io emit)
    socket.on('players-revealed', () => gameState.playersRevealed = true);

    // Conceal both players (this is an io emit)
    socket.on('players-concealed', () => gameState.playersRevealed = false);

    // Eradicate traps (this is an io emit)
    socket.on('traps-eradicated', () => {
      fullDeck['traps'] = [];
      removeRaceDeck('traps');
      gameState.showSpinner = false;
    });

    // Remove legendary from remainingLegendaries for both players.
    socket.on('remaining-legendary-removed', card => {
      remainingLegendaries = remainingLegendaries.filter(l => l[0] !== card);

      // Then remove from deck both are using
      const race = $cardDetails[card].race;
      const deck = getDeckTypeFromRace(race);
      const removedCardIndex = fullDeck[deck].indexOf(card);
      if (removedCardIndex !== -1) {
        fullDeck[deck].splice(removedCardIndex, 1);
        
        if (gameState.playingAs === 'p1') {
          player1.update($player1 => {
            $player1.cardsDrawn = [...$player1.cardsDrawn, card];
            return $player1;
          });

        } else {
          player2.update($player2 => {
            $player2.cardsDrawn = [...$player2.cardsDrawn, card];
            return $player2;
          });
        }
      };
    });

    // Remove xeno egg version from remainingXenoEggs for both players.
    socket.on('xeno-egg-removed', card => {
      remainingXenoEggs = remainingXenoEggs.filter(c => c !== card);
      gameState.showSpinner = false;
    });

    // ai generated: Singleplayer initializes locally and never opens the websocket connection.
    initializeSingleplayer();

    // ai generated: Clearing timers and the optional socket prevents rematches or navigation from leaving ghost CPU turns behind.
    return () => {
      stopHeartbeat();
      if (cpuTurnTimeout) clearTimeout(cpuTurnTimeout);
      socket.disconnect();
    };
  });

  // ai generated: The heartbeat exists only for multiplayer because singleplayer has no server dependency.
  function startHeartbeat(): void {
    stopHeartbeat();
    intervalId = setInterval(() => socket.emit('check-connected-users'), heartBeatInterval);
  }

  // ai generated: Keeping heartbeat cleanup in one place makes switching modes safe.
  function stopHeartbeat(): void {
    if (intervalId) clearInterval(intervalId);
    if (timeoutId) clearTimeout(timeoutId);
    intervalId = undefined;
    timeoutId = undefined;
  }

  // ai generated: Player one is always the human and player two is always the local CPU in the first singleplayer version.
  function initializeSingleplayer(): void {
    stopHeartbeat();
    socket.disconnect();
    gameState.playingAs = 'p1';
    p1Connected = true;
    p2Connected = true;
    const cpuName = cpuNames[Math.floor(Math.random() * cpuNames.length)];
    player1.update(player => ({ ...player, id: 'singleplayer-human' }));
    player2.update(player => ({ ...player, id: 'singleplayer-cpu', title: cpuName }));
    player1Reset.update(player => ({ ...player, id: 'singleplayer-human' }));
    player2Reset.update(player => ({ ...player, id: 'singleplayer-cpu', title: cpuName }));
    cpuMemory = createCpuMemory();
  }

  // ai generated: Mode changes are available between rounds and preserve the original server-backed multiplayer flow.
  function selectGameMode(mode: 'singleplayer' | 'multiplayer'): void {
    if (gameMode === mode || !gameState.gameOver) return;
    if (cpuTurnTimeout) clearTimeout(cpuTurnTimeout);
    gameState.connectedNameChangeSide = '';
    gameState.p1NameChangeVisible = false;
    gameState.p2NameChangeVisible = false;
    gameMode = mode;
    if (mode === 'singleplayer') {
      initializeSingleplayer();
      return;
    }

    // ai generated: Wait for fresh records from the multiplayer server; no solo result carries over.
    multiplayerRecords = {
      p1: { name: 'Player 1', wins: 0, losses: 0, draws: 0, elo: 1000 },
      p2: { name: 'Player 2', wins: 0, losses: 0, draws: 0, elo: 1000 }
    };
    stopHeartbeat();
    p1Connected = false;
    p2Connected = false;
    gameState.playingAs = 'p1';
    player1.update(player => ({ ...player, id: undefined, isReady: false }));
    player2.update(player => ({ ...player, id: undefined, title: 'Player 2', isReady: false }));
    player1Reset.update(player => ({ ...player, id: undefined }));
    player2Reset.update(player => ({ ...player, id: undefined, title: 'Player 2' }));
    socket.connect();
    startHeartbeat();
  }

  // ai generated: Gameplay emits use the existing server in multiplayer and equivalent local handlers in singleplayer.
  function emitGameEvent(eventName: string, data?: any): void {
    if (gameMode === 'multiplayer') {
      socket.emit(eventName, data);
      return;
    }

    switch (eventName) {
      case 'change-turns':
        void applyTurnChange(data);
        break;
      case 'remove-remaining-legendary':
        removeRemainingLegendaryLocally(data);
        break;
      case 'end-game':
        endGame();
        break;
      case 'eradicate-traps':
        fullDeck['traps'] = [];
        removeRaceDeck('traps');
        gameState.showSpinner = false;
        break;
      case 'display-event':
        void showEvent(data);
        break;
      case 'swap-hands':
        Object.entries(data.copyOfXenoPoints).forEach(([card, points]) => remoteCardDetails[card].points = points);
        break;
      case 'reveal-players':
        gameState.playersRevealed = true;
        break;
      case 'conceal-players':
        gameState.playersRevealed = false;
        break;
      case 'start-xeno-sync':
        gameState.showSpinner = false;
        break;
      case 'remove-xeno-egg':
        remainingXenoEggs = remainingXenoEggs.filter(card => card !== data);
        gameState.showSpinner = false;
        break;
      case 'increase-turn-count':
        gameState.turnCount += 3;
        break;
      case 'decrease-turn-count':
        gameState.turnCount = gameState.turnCount >= 5 ? gameState.turnCount - 5 : 0;
        break;
      case 'neutralize-deck':
        neutralizeDeck();
        break;
      case 'gdg-declared':
        gameState.gobbledegookDeclared = true;
        break;
    }
  }

  // ai generated: The shared turn handler keeps local and server games on the same turn-reset rules.
  async function applyTurnChange(data: { player1: Player, player2: Player }): Promise<void> {
    player1.update(player => ({ ...player, turn: !data.player1.turn, playingTwice: false, hasVision: false }));
    player2.update(player => ({ ...player, turn: !data.player2.turn, playingTwice: false, hasVision: false }));
    // ai generated: Starting a new human turn ages previously learned cards by one opportunity to draw and replace something.
    if (gameMode === 'singleplayer' && $player1.turn) cpuMemory = ageOpponentHandMemory(cpuMemory);

    const activePlayer = gameMode === 'singleplayer'
      ? ($player1.turn ? $player1 : $player2)
      : (gameState.playingAs === 'p1' ? $player1 : $player2);
    if (activePlayer.turn && activePlayer.hand.some(card => ['drainite', 'xerandium', 'sporax'].includes(card))) {
      await calculateXenoEggs(activePlayer);
    }

    calculateCurrentPlayerPoints(activePlayer);
    const localPlayer = gameState.playingAs === 'p1' ? $player1 : $player2;
    const gdgButtonAvailable = !gameState.gameOver && !gameState.gobbledegookDeclared && gameState.turnCount >= 15;
    if (gdgButtonAvailable && isPlayerTurn(localPlayer)) gameState.gobbledegookDisabled = false;
    if (isPlayerTurn(localPlayer)) void showEvent('turn-change');
    if (gameMode === 'singleplayer' && $player2.turn) scheduleCpuTurn();
  }

  // ai generated: Chester's selected legendary is removed from both the choice list and the shared local deck immediately.
  function removeRemainingLegendaryLocally(card: string): void {
    remainingLegendaries = remainingLegendaries.filter(legendary => legendary[0] !== card);
    const deck = getDeckTypeFromRace($cardDetails[card].race);
    if (!deck || !fullDeck[deck]) return;
    const removedCardIndex = fullDeck[deck].indexOf(card);
    if (removedCardIndex !== -1) fullDeck[deck].splice(removedCardIndex, 1);
  }

  // sets users based on [username, id] from server.js
  function setUsers(users: [string, string][]): void {
    users.forEach(user => {
      if (user[0] === 'p1') {
        player1.update($player1 => {
          $player1.id = user[1]; // socket id 2nd item in arr
          return $player1;
        });
        player1Reset.update(player => ({ ...player, id: user[1], isReady: false }));
      }
      
      if (user[0] === 'p2') {
        player2.update($player2 => {
          $player2.id = user[1]; // socket id 2nd item in arr
          return $player2;
        });
        player2Reset.update(player => ({ ...player, id: user[1], isReady: false }));
      }
    });

    if (socket.id === $player1.id) gameState.playingAs = 'p1';
    if (socket.id === $player2.id) gameState.playingAs = 'p2';
    gameState.playingAs === 'p1' ? p1Connected = true : p2Connected = true;
  }

  function markOtherClientAsConnected() {
    gameState.playingAs === 'p1' ? p2Connected = true : p1Connected = true;
  }

  function markOtherClientAsDisconnected() {
    gameState.playingAs === 'p1' ? p2Connected = false : p1Connected = false;
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
    emitGameEvent('start-game', {player1: $player1, player2: $player2, fullDeck});
    if (gameMode === 'singleplayer' && $player2.turn) scheduleCpuTurn();
  }

  // When both players are ready the game starts/restarts
  async function readyUpPlayer(): Promise<void> {
    if (gameMode === 'singleplayer') {
      player1.set({...$player1, isReady: true});
      player2.set({...$player2, isReady: true});
      await startGame();
      return;
    }
    if (!socket.connected || ![$player1.id, $player2.id].includes(socket.id)) return;
    gameState.playingAs === 'p1' ? player1.set({...$player1, isReady: !$player1.isReady}) : player2.set({...$player2, isReady: !$player2.isReady});
    emitGameEvent('ready-up-player', {player1: $player1, player2: $player2});
    if ($player1.isReady && $player2.isReady) await startGame();
  }

  // Ends current round
  function endGame() {
    if (cpuTurnTimeout) clearTimeout(cpuTurnTimeout);
    // ai generated: A remote end-of-round event should not leave the rankings guide over the result screen.
    rankingsVisible = false;
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
    if (cpuTurnTimeout) clearTimeout(cpuTurnTimeout);
    // Reset p1
    player1.set({...$player1Reset, title: $player1.title});
    // Reset p2
    player2.set({...$player2Reset, title: $player2.title});

    fullDeck = {
      humans: [...$humanDeck],
      goblins: [...$goblinDeck],
      elves: [...$elfDeck],
      dwarves: [...$dwarfDeck],
      beasts: [...$beastDeck],
      bots: [...$botDeck],
      xenos: [...$xenoDeck],
      spirits: [...$spiritDeck],
      boosts: [...$boostDeck],
      traps: [...$trapDeck],
      neutrals: [...$neutralDeck]
    };

    cardDetails.set(structuredClone(controlCopyOfCardDetails));
    deckTypes = Object.keys(fullDeck);
    remoteCardDetails = structuredClone($cardDetails);

    // General resets
    gameState = {...gameState,
      turnCount: 0,
      gameOver: false,
      startBtnDisabled: true,
      gobbledegookDeclared: false,
      gobbledegookDisabled: false,
      playersRevealed: false,
      remainingCardsVisible: false,
      winMessage: '',
      loseMessage: '',
      eventMessage: ''
    }

    remainingLegendaries = getAllLegendaries();
    remainingXenoEggs = ['drainite', 'xerandium', 'sporax'];
    cpuMemory = createCpuMemory();
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
    emitGameEvent('change-turns', {player1: $player1, player2: $player2});
  }

  function getDeckTypeFromRace(race: Race): DeckRace {
    if (race === 'human') return 'humans';
    if (race === 'goblin') return 'goblins';
    if (race === 'elf') return 'elves';
    if (race === 'dwarf') return 'dwarves';
    if (race === 'beast') return 'beasts';
    if (race === 'bot') return 'bots';
    if (race === 'xeno') return 'xenos';
    if (race === 'spirit') return 'spirits';
    if (race === 'boost') return 'boosts';
    if (race === 'trap') return 'traps';
    if (race === 'neutral') return 'neutrals';
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

      // Make sure player never starts with bonus cards or specific cards.
      const cardsThatMustBeDrawn = ['goblinLordsMark', 'eggGiraffe', 'xenoEgg', 'spiritKing', 'warpstalker'];
      const safeBonusCards = ['chastity', 'corruption'];
      while (!safeBonusCards.includes(cardDrawn) && (cardsThatMustBeDrawn.includes(cardDrawn) || ['boost', 'trap', 'neutral'].some(race => getRaces(cardDrawn).includes(race)))) {
        // Grab new card
        randomNum = Math.floor(Math.random() * deckTypes.length);
        currentDeck = deckTypes[randomNum];
        randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
        cardDrawn = fullDeck[currentDeck][randomNum];
      }

      // Remove from deck
      const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
      if (removedCardIndex !== -1) fullDeck[currentDeck].splice(removedCardIndex, 1);

      // Other client getting update? if a legendary is drawn must also remove it from gamestate so no duplicates
      const exemptLegendaries = ['nightTerror', 'chastity', 'corruption', 'neutralize'];
      if ($cardDetails[cardDrawn].rarity === 'legendary' && !exemptLegendaries.includes(cardDrawn)) emitGameEvent('remove-remaining-legendary', cardDrawn);

      // If the card is a trap that triggers even without being drawn, handle it.
      if (['corruption'].includes(cardDrawn)) await addTrapCard(player, cardDrawn);

      // If the card is a boost that triggers even without being drawn, handle it.
      if (['chastity'].includes(cardDrawn)) addBoostCard(player, cardDrawn);

      // Add to player's hand
      player.hand.push(cardDrawn);
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
    
    // Checks if there's a xeno egg counter, if so return the appropriate xeno.
    } else if ([1, 2].includes(player.xenoEggCounter)) {
      currentDeck = 'xenoEgg';
    
    // Determines if the next card will be a dwarf or just a random deck.
    } else if (player.dwarfNextTurn) {
      currentDeck = setDeckAsDwarfDeck(player);

    // Otherwise draw a random deck (must be if/else or wipes eggs)
    } else {
      randomNum = Math.floor(Math.random() * deckTypes.length);
      currentDeck = deckTypes[randomNum] as DeckRace; // to appease ts gods
    }

    // When the last card is drawn, currentDeck becomes undefined. This will catch that
    if (deckTypes.length === 0 && currentDeck === undefined) {
      console.log("No more cards!");
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsToShareState();
      while (gameState.showSpinner) await wait(500);
      
      emitGameEvent('end-game');
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

      } else if (currentDeck === 'xenoEgg') {
        cardDrawn = await drawXenoEggCards(player);

      } else if (player.redSpiritNextTurn) {
        const jinnDraw = getJinn(player, 'red');
        cardDrawn = jinnDraw.cardDrawn;
        currentDeck = jinnDraw.currentDeck;

      } else if (player.blueSpiritNextTurn) {
        const jinnDraw = getJinn(player, 'blue');
        cardDrawn = jinnDraw.cardDrawn;
        currentDeck = jinnDraw.currentDeck;

      } else if (player.drewWarchief && canDrawGoblinLordMark(player)) {
        // Change card drawn to goblin lord's mark if player last drew warchief and goblin lord's mark is in deck
        currentDeck = 'goblins';
        cardDrawn = 'goblinLordsMark';

      } else {
        // Grab a random card
        randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
        cardDrawn = fullDeck[currentDeck][randomNum];
      }

      // other client getting update? if a legendary is drawn must also remove it from gamestate so no duplicates
      const exemptLegendaries = ['nightTerror', 'chastity', 'corruption', 'neutralize'];
      if ($cardDetails[cardDrawn].rarity === 'legendary' && !exemptLegendaries.includes(cardDrawn)) emitGameEvent('remove-remaining-legendary', cardDrawn);

      // If it's the giraffe egg, get the next giraffe.
      if (cardDrawn === 'eggGiraffe') player.id === $player1.id ? player1.set({...$player1, giraffeCounter: 1}) : player2.set({...$player2, giraffeCounter: 1});

      // If it's the xeno egg, get the next xeno.
      if (cardDrawn === 'xenoEgg') player.id === $player1.id ? player1.set({...$player1, xenoEggCounter: 1}) : player2.set({...$player2, xenoEggCounter: 1});

      // If player traps are blocked but draws the trap card "lost", draw again.
      if (cardDrawn === 'lost' && areTrapsBlocked(player)) {
        // Remove card from deck
        const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
        if (removedCardIndex !== -1) fullDeck[currentDeck].splice(removedCardIndex, 1);

        // Was it the last card in it's race deck? Remove deck.
        if (fullDeck[currentDeck].length === 0) removeRaceDeck(currentDeck);

        // Draw new card but doesn't count as new turn
        await drawCard(player, false);
        return;
      };

      // Blocked Chester and Chjester cannot be found, so consume the card and draw again.
      if ((cardDrawn === 'chester' && areBoostsBlocked(player)) || (cardDrawn === 'chjester' && areTrapsBlocked(player))) {
        const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
        if (removedCardIndex !== -1) fullDeck[currentDeck].splice(removedCardIndex, 1);
        if (fullDeck[currentDeck].length === 0) removeRaceDeck(currentDeck);

        await drawCard(player, false);
        return;
      };

      // If it's the longbeard leader, dwarf commander or dwarvenCall, the next card will be dwarf
      if (cardDrawn === 'longbeardLeader' || cardDrawn === 'dwarfCommander' || cardDrawn === 'dwarvenCall') player.dwarfNextTurn = true;

      // If it's fire spirit the next card will be red jinn. If it's lightning spirit then 50% chance next card is red jinn.
      if (cardDrawn === 'fireSpirit' || (cardDrawn === 'lightningSpirit' && Math.random() < 0.5)) player.redSpiritNextTurn = true;
      
      // If it's ice spirit the next card will be blue jinn. If it's water spirit then 50% chance next card is blue jinn.
      if (cardDrawn === 'iceSpirit' || (cardDrawn === 'waterSpirit' && Math.random() < 0.5)) player.blueSpiritNextTurn = true;

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

    // Remove card from deck unless special giraffe/xeno egg deck
    if (!['giraffe', 'xenoEgg'].includes(currentDeck)) {
      const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
      if (removedCardIndex !== -1) fullDeck[currentDeck].splice(removedCardIndex, 1);

      // When a smaller race deck runs out, it will be removed here. Placed below the cardDrawn logic to ensure the card is actually drawn (think goblin lord's mark)
      if (fullDeck[currentDeck].length === 0) removeRaceDeck(currentDeck);
    }

    // Checks if player is player 1 or 2, then adds card to hand
    if (player.id === $player1.id) {
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

    // ai generated: Reveal only after Spirit King is in the hand so both the card draw and face-up opponent hand render together.
    if (cardDrawn === 'spiritKing') await revealPlayers();
    refreshCpuOpponentMemory();

    calculateCurrentPlayerPoints(player, isNewTurn(player));
    
    // Emits to server that a card was drawn
    emitGameEvent('draw-card', {player1: $player1, player2: $player2, deckTypes: deckTypes, fullDeck: fullDeck});
  }

  // Removes card from hand if player hand has over 6 cards
  async function discard(cardTitle: string, player: Player) {
    if (!isPlayerTurn(player)) return;

    // So player doesn't get free hand of beasts as giraffe grows.
    if (player.hand.includes('adultGiraffe')) cardTitle = 'adultGiraffe';
    if (player.hand.includes('kidGiraffe')) cardTitle = 'kidGiraffe';
    if (player.hand.includes('eggGiraffe')) cardTitle = 'eggGiraffe';

    // So player doesn't get extra xenos that should only be temporary.
    if (player.hand.includes('growingXeno')) cardTitle = 'growingXeno';
    if (player.hand.includes('xenoEgg')) cardTitle = 'xenoEgg';

    if (cardTitle === 'chjester') {
      const exemptLegendaries = ['chastity', 'corruption', 'neutralize'];
      const legendariesInHand = player.hand.filter(l => !exemptLegendaries.includes(l) && $cardDetails[l].rarity === 'legendary');

      // Remove legendaries if they are found
      if (legendariesInHand.length > 0) {
        const randomLegendaryIndex = Math.floor(Math.random() * legendariesInHand.length);
        cardTitle = legendariesInHand[randomLegendaryIndex];
      }
    }

    // Using store update methods instead of player var ^
    if (player.id === $player1.id) {
      const index = $player1.hand.indexOf(cardTitle);
      if (index === -1) return;
      player1.update($player1 => {
        $player1.hand.splice(index, 1);
        $player1.discards = [...$player1.discards, cardTitle];
        return $player1;
      });
    } else if (player.id === $player2.id) {
      const index = $player2.hand.indexOf(cardTitle);
      if (index === -1) return;
      player2.update($player2 => {
        $player2.hand.splice(index, 1);
        $player2.discards = [...$player2.discards, cardTitle];
        return $player2;
      });
   }

    // Emits to server that a card was discarded
    emitGameEvent('discard-card', {player1: $player1, player2: $player2});
    // ai generated: If the hand is currently visible, remember its post-discard five-card state before Spirit King or another reveal ends.
    refreshCpuOpponentMemory();

    // Remove all traps from deck
    if (cardTitle === 'eradicate') await eradicateTraps();

    // Check if card discarded is spirit king, if so, hide hands.
    if (cardTitle === 'spiritKing') await concealPlayers();

    // Check if card discarded is switcharoo, if so, swap hands, but don't swap if they have echo in effect (too many cards)
    if (cardTitle === 'switcharoo' && player.hand.length === 5 && !gameState.gobbledegookDeclared) await swapHands();

    // ai generated: Like Switcharoo, Shuffle only fires after a normal six-card hand becomes five; seven to six safely discards it.
    // ai generated: Unlike Switcharoo, a declared GDG does not block Shuffle because it changes only this player's final hand.
    if (cardTitle === 'shuffle' && player.hand.length === 5) {
      const replacedFullHand = await shuffleHand(player);
      if (!replacedFullHand) return;
    }

    // If player is playing twice, let them draw again.
    if (player.playingTwice && cardTitle !== 'echo') player.playingTwice = false;

    // Check if card discarded is dwarf alchemist, if so, calculate 50% chance to draw dwarf next turn.
    if (cardTitle === 'alchemist') player.dwarfNextTurn = Math.random() < 0.5 ? true : false;

    // If chester, swap for a legendary and don't end turn.
    if (cardTitle === 'chester' && remainingLegendaries.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingLegendaries.length);
      const legendaryObj = remainingLegendaries[randomIndex];
      player.hand = [...player.hand, legendaryObj[0]];
      
      // If it's the spirit king, expose both hands.
      if (legendaryObj[0] === 'spiritKing') await revealPlayers();
      
      // Then remove from gamestate remaining legendaries
      emitGameEvent('remove-remaining-legendary', legendaryObj[0]);

      return;
    }

    // Don't change turns until player only has 5 cards
    if (player.hand.length > 5) return;

    if (gameState.gobbledegookDeclared) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsToShareState();
      while (gameState.showSpinner) await wait(500);
      
      emitGameEvent('end-game');
    } else {
      changeTurns();
    }
  };

  // ai generated: Shuffle is a fresh five-card deal, not five ordinary draws: cleared cards have no discard effects and replacements have no draw effects.
  async function shuffleHand(player: Player): Promise<boolean> {
    const discardedHand = [...player.hand];
    const replacementHand: string[] = [];

    for (let count = 0; count < 5; count++) {
      // ai generated: Unlike the opening deal, every remaining card is eligible, including eggs and bonus cards.
      const availableDecks = deckTypes.filter(deck => fullDeck[deck]?.length > 0);
      if (availableDecks.length === 0) break;

      const chosenDeck = availableDecks[Math.floor(Math.random() * availableDecks.length)];
      const cardDrawn = fullDeck[chosenDeck][Math.floor(Math.random() * fullDeck[chosenDeck].length)];
      fullDeck[chosenDeck].splice(fullDeck[chosenDeck].indexOf(cardDrawn), 1);
      if (fullDeck[chosenDeck].length === 0) removeRaceDeck(chosenDeck as DeckRace);
      replacementHand.push(cardDrawn);

      // ai generated: Eggs are the exception to the no-draw-effects rule: their counters still hatch on later normal draws.
      if (cardDrawn === 'eggGiraffe') player.giraffeCounter = 1;
      if (cardDrawn === 'xenoEgg') player.xenoEggCounter = 1;

      const exemptLegendaries = ['nightTerror', 'chastity', 'corruption', 'neutralize'];
      if ($cardDetails[cardDrawn].rarity === 'legendary' && !exemptLegendaries.includes(cardDrawn)) emitGameEvent('remove-remaining-legendary', cardDrawn);
    }

    const playerStore = player.id === $player1.id ? player1 : player2;
    playerStore.update(current => ({
      ...current,
      hand: replacementHand,
      discards: [...current.discards, ...discardedHand],
      cardsDrawn: [...current.cardsDrawn, ...replacementHand],
      playingTwice: false
    }));

    // ai generated: Clearing a held Spirit King ends its reveal even though Shuffle skips the King's ordinary discard handler.
    if (discardedHand.includes('spiritKing') && !$player1.hand.includes('spiritKing') && !$player2.hand.includes('spiritKing')) await concealPlayers();
    refreshCpuOpponentMemory();
    calculateCurrentPlayerPoints(player.id === $player1.id ? $player1 : $player2);
    emitGameEvent('draw-card', {player1: $player1, player2: $player2, deckTypes, fullDeck});
    // ai generated: Shuffle is private feedback for the player whose discard actually replaced their hand.
    const localPlayer = gameState.playingAs === 'p1' ? $player1 : $player2;
    if (player.id === localPlayer.id) void showEvent('shuffle');

    // ai generated: If the entire draw pile runs out mid-refill, score the partial hand instead of leaving an unplayable turn.
    if (replacementHand.length < 5) {
      emitGameEvent('end-game');
      return false;
    }
    return true;
  }

  async function eradicateTraps(): Promise<void> {
    gameState.showSpinner = true;
    emitGameEvent('eradicate-traps');
    while (gameState.showSpinner) await wait(500);
    emitGameEvent('display-event', 'eradicate');
  }

  // Handles Switcharoo hand swap
  async function swapHands() {
    // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
    updateClientsToShareState();
    while (gameState.showSpinner) await wait(500);

    const copyOfXenoPoints = {
      voidRunner: $cardDetails['voidRunner'].points,
      warpstalker: $cardDetails['warpstalker'].points,
      drainite: $cardDetails['drainite'].points,
      xerandium: $cardDetails['xerandium'].points,
      sporax: $cardDetails['sporax'].points,
    }
    $cardDetails['voidRunner'].points = remoteCardDetails['voidRunner'].points;
    $cardDetails['warpstalker'].points = remoteCardDetails['warpstalker'].points;
    $cardDetails['drainite'].points = remoteCardDetails['drainite'].points;
    $cardDetails['xerandium'].points = remoteCardDetails['xerandium'].points;
    $cardDetails['sporax'].points = remoteCardDetails['sporax'].points;

    let tempHand = [...$player2.hand];
    player2.update($player2 => {
      $player2.hand = [...$player1.hand];
      return $player2;
    });
    player1.update($player1 => {
      $player1.hand = [...tempHand];
      return $player1;
    });

    emitGameEvent('swap-hands', {player1: $player1, player2: $player2, copyOfXenoPoints});
    emitGameEvent('display-event', 'switcharoo');
  }

  // Display game results
  function determineWinner() {
    // ai generated: This only describes the round; multiplayer lifetime totals come from the server, and solo retains none.
    if($player1.highestPoints > $player2.highestPoints) {
      gameState.winMessage = `${$player1.title} is the winner with ${$player1.highestPoints} points!🎊🥳🍾`;
      gameState.loseMessage = `${$player2.title} loses with ${$player2.highestPoints} points...${$player2.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
    } else if($player2.highestPoints > $player1.highestPoints) {
      gameState.winMessage = `${$player2.title} is the winner with ${$player2.highestPoints} points!🎊🥳🍾`;
      gameState.loseMessage = `${$player1.title} loses with ${$player1.highestPoints} points...${$player1.highestPoints <= 0 ? '💩💩💩' : '💩'}`;
    } else if ($player1.highestPoints === 500_000 && $player2.highestPoints === 500_000) {
      gameState.winMessage = `It seems neither the goblins nor the elves want to go to war with each other while their leaders are on the field...`;
      gameState.loseMessage = " it's a draw!😓😓😓"
    } else {
      gameState.winMessage = `${$player1.title} had ${$player1.highestPoints} points and ${$player2.title} had ${$player2.highestPoints} points...`;
      gameState.loseMessage = " it's a draw!😓"
    }
  }

  // Sets all of players point values (not charge/growth/infect) to 0
  function setPlayerPointsToZero(player: Player): void {
    player.points = {
      humans: 0,
      goblins: 0,
      elves: 0,
      dwarves: 0,
      beasts: 0,
      bots: 0,
      xenos: 0,
      spirits: 0
    };
    player.highestPoints = 0;
  }

  // Determine if it is the player's turn or not
  function isPlayerTurn(player: Player = gameState.playingAs === 'p1' ? $player1 : $player2) {
    if (gameMode === 'singleplayer') return player.turn;
    return player.id === socket.id && player.turn;
  }

  // Remove deck from main deck
  function removeRaceDeck(race: DeckRace): void {
    const index = deckTypes.indexOf(race);
    if (index !== -1) deckTypes.splice(index, 1); // make sure it was found
  }

  // Optional chaining so if I comment out a race, the game doesn't crash.
  function getAllLegendaries(): string[][] {
    const legendaries = [];
    if (fullDeck['humans']?.includes('emperor')) legendaries.push(['emperor', 'humans']);
    if (fullDeck['goblins']?.includes('goblinLord')) legendaries.push(['goblinLord', 'goblins']);
    if (fullDeck['elves']?.includes('elfKing')) legendaries.push(['elfKing', 'elves']);
    if (fullDeck['dwarves']?.includes('longbeardLeader')) legendaries.push(['longbeardLeader', 'dwarves']);
    if (fullDeck['beasts']?.includes('dreamDestroyer')) legendaries.push(['dreamDestroyer', 'beasts']);
    if (fullDeck['bots']?.includes('ai')) legendaries.push(['ai', 'bots']);
    if (fullDeck['spirits']?.includes('spiritKing')) legendaries.push(['spiritKing', 'spirits']);

    return legendaries;
  }
  
  async function revealPlayers(): Promise<void> {
    // ai generated: Reassigning gameState gives Svelte an explicit reveal update before any multiplayer synchronization begins.
    gameState = {...gameState, playersRevealed: true};
    refreshCpuOpponentMemory('spiritKing');
    await tick();
    // Must be before updateClientsToShareState()
    emitGameEvent('reveal-players');
    updateClientsToShareState();
    while (gameState.showSpinner) await wait(500);
    emitGameEvent('display-event', 'revealed');
  }

  async function concealPlayers(): Promise<void> {
    emitGameEvent('conceal-players');
    updateClientsToShareState();
    while (gameState.showSpinner) await wait(500);
  }
  // ---------------------------------------------------------------- \\
  // ------------------------- CALCULATIONS ------------------------- \\
  // ---------------------------------------------------------------- \\

  // Adds to turn count if 1 full turn has passed
  function calculateNewTurn(player: Player) {
    // Not a new turn if player got echo and is drawing/discarding more cards. Must wait for actual turn change.
    if (player.playingTwice || player.hand.length >= 6) return;
    if (($player1.playedFirst && $player1.turn) || ($player2.playedFirst && $player2.turn)) {
      gameState.turnCount++;
      emitGameEvent('new-turn');
    };
  }

  // Checks if it's a new turn (1 full rotation)
  function isNewTurn(player: Player): boolean {
    if (player.playingTwice) return false;
    return ($player1.playedFirst && $player1.turn) || ($player2.playedFirst && $player2.turn);
  }

  // Calculates all player race points, used to determine the winner.
  function calculateCurrentPlayerPoints(player: Player, isNewTurn = false) {
    const otherPlayer = player.id === $player1.id ? $player2 : $player1;

    // If chastity/corruption, wipe the bonus points, otherwise temporarily stop accumulating.
    if (isNewTurn) {
      calculateAccumulatingBonusCards($player1);
      calculateAccumulatingBonusCards($player2);
    };


    calculatePlayerPointsAgainst(player, otherPlayer);
  }

  // If chastity/corruption, wipe the bonus points, otherwise temporarily stop accumulating.
  function calculateAccumulatingBonusCards(player: Player) : void {
    if (player.hasCorruption) {
      player.chargePoints = 0;
      player.growthPoints = 0;
    } else if (!player.hand.includes('xenoGuard')) {
      player.chargePoints += player.numOfCharges;
      player.growthPoints += player.numOfGrowths;
    }

    if (player.hasChastity) {
      player.infectPoints = 0;
    } else if (!player.hand.includes('rhino')) {
      player.infectPoints += player.numOfInfects;
    }
  }

  // Calculates all player race points, used to determine the winner.
  function calculateEndGamePlayerPoints(player: Player) {
    const otherPlayer = player.id === $player1.id ? $player2 : $player1;

    calculatePlayerPointsAgainst(player, otherPlayer, true);
  }

  // ai generated: The CPU calls this same authoritative scoring pipeline on cloned players, so its predictions cannot alter the live match.
  function calculatePlayerPointsAgainst(player: Player, otherPlayer: Player, forEndGameCalculation = false): void {
    setPlayerPointsToZero(player);
    calculateHumanPoints(player);
    calculateGoblinPoints(player, otherPlayer, forEndGameCalculation);
    calculateElfPoints(player, otherPlayer, forEndGameCalculation);
    calculateDwarfPoints(player, forEndGameCalculation);
    calculateBeastPoints(player);
    calculateBotPoints(player, otherPlayer, forEndGameCalculation);
    calculateXenoPoints(player, otherPlayer);
    calculateSpiritPoints(player, otherPlayer);
    calculatePlayerHighestPoints(player);
  }

  // ai generated: These are the four legitimate ways the CPU can learn the human hand; Darqnos blocks direct reveals but not Gaze's deck deduction.
  function getCpuOpponentInsightSource(): CpuOpponentInsightSource | '' {
    if (gameMode !== 'singleplayer') return '';
    const directRevealBlocked = $player1.hand.includes('darkSpirit');
    if (!directRevealBlocked && gameState.playersRevealed) return 'spiritKing';
    if (!directRevealBlocked && $player1.isExposed) return 'exposed';
    if (!directRevealBlocked && $player2.hasVision) return 'vision';
    if ($player2.hand.includes('gaze') && !areBoostsBlocked($player2)) return 'gaze';
    return '';
  }

  // ai generated: A snapshot is taken only while information is legitimately available; later decisions use this aging memory rather than rereading the hidden hand.
  function refreshCpuOpponentMemory(source = getCpuOpponentInsightSource()): void {
    if (gameMode !== 'singleplayer' || !source) return;
    if (source !== 'gaze' && $player1.hand.includes('darkSpirit')) return;
    cpuMemory = rememberOpponentHand(cpuMemory, $player1.hand, gameState.turnCount, source);
  }

  // ai generated: This observation contains the CPU's hand, public information, and an unseen pool derived by card counting rather than opponent-hand cheating.
  function buildCpuObservation(): CpuObservation {
    const insightSource = getCpuOpponentInsightSource();
    refreshCpuOpponentMemory(insightSource);
    const canSeeHumanHand = insightSource !== '';
    const knownOpponentCards = canSeeHumanHand ? [...$player1.hand] : [];
    const publicOpponentCards: string[] = canSeeHumanHand || $player1.hand.includes('darkSpirit')
      ? []
      : $player1.hand.filter(card => card === 'lightSpirit');
    const cardsStillInDeck = Object.values(fullDeck).flat() as string[];
    const hiddenOpponentCards = $player1.hand.filter(card => !publicOpponentCards.includes(card));
    const unseenCards = canSeeHumanHand ? cardsStillInDeck : [...cardsStillInDeck, ...hiddenOpponentCards];
    return {
      hand: [...$player2.hand],
      turnCount: gameState.turnCount,
      activeDecks: [...deckTypes],
      unseenCards,
      knownOpponentCards,
      publicOpponentCards,
      rememberedOpponentCards: [...cpuMemory.opponentHandSnapshot],
      opponentMemoryAge: cpuMemory.opponentHandObservedAtTurn === null ? null : cpuMemory.opponentHandAge,
      opponentMemorySource: cpuMemory.opponentHandSource,
      boosts: [...$player2.boosts],
      traps: [...$player2.traps],
      boostsBlocked: areBoostsBlocked($player2),
      trapsBlocked: areTrapsBlocked($player2),
      neutralizePossiblyAvailable: unseenCards.includes('neutralize'),
      infectPoints: $player2.infectPoints,
      numOfInfects: $player2.numOfInfects,
      chargePoints: $player2.chargePoints,
      numOfCharges: $player2.numOfCharges,
      forcedRacePath: getForcedCpuRacePath($player2.title),
      cardDetails: $cardDetails
    };
  }

  // ai generated: Cloning protects live hands, point totals, counters, and status effects while the CPU asks many what-if questions.
  function scoreCpuHand(hand: string[], prospectiveDiscard = '') {
    const cpuCopy = structuredClone($player2);
    const humanCopy = structuredClone($player1);
    cpuCopy.hand = [...hand];
    // ai generated: Only the cloned scorer sees a proposed discard; the live discard list changes after the real action.
    if (prospectiveDiscard) cpuCopy.discards = [...cpuCopy.discards, prospectiveDiscard];
    humanCopy.hand = getCpuOpponentInsightSource() ? [...$player1.hand] : [];
    calculatePlayerPointsAgainst(cpuCopy, humanCopy, true);
    return { highestPoints: cpuCopy.highestPoints, points: { ...cpuCopy.points } };
  }

  // ai generated: Switcharoo trades the CPU's kept cards for the human's hand, so score the received cards against the cards handed away.
  function scoreCpuSwappedHand(receivedHand: string[], givenHand: string[]) {
    const cpuCopy = structuredClone($player2);
    const humanCopy = structuredClone($player1);
    cpuCopy.hand = [...receivedHand];
    humanCopy.hand = [...givenHand];
    calculatePlayerPointsAgainst(cpuCopy, humanCopy, true);
    // ai generated: Switcharoo also trades evolving Xeno values; the scorer still sees the pre-swap copies, so adjust only those card bases.
    const transferredXenos = ['voidRunner', 'warpstalker', 'drainite', 'xerandium', 'sporax'];
    receivedHand.forEach(card => {
      if (transferredXenos.includes(card)) cpuCopy.points.xenos += $cardDetails[card].points - remoteCardDetails[card].points;
    });
    calculatePlayerHighestPoints(cpuCopy);
    return { highestPoints: cpuCopy.highestPoints, points: { ...cpuCopy.points } };
  }

  // ai generated: Console snapshots use the CPU's fair strategy scorer so the logged race totals match what informed its decision.
  function getCpuRacePointsForLog(): { race: string; points: number }[] {
    return Object.entries(scoreCpuHand($player2.hand).points).map(([race, points]) => ({ race, points }));
  }

  // ai generated: Keeping opponent knowledge in every CPU status log makes reveal and memory behavior observable during manual testing.
  function getCpuOpponentKnowledgeForLog(observation: CpuObservation) {
    return {
      currentlyKnownHand: [...observation.knownOpponentCards],
      publiclyVisibleCards: [...observation.publicOpponentCards],
      rememberedHand: [...observation.rememberedOpponentCards],
      memorySource: observation.opponentMemorySource || 'none',
      memoryAge: observation.opponentMemoryAge
    };
  }

  // ai generated: Opponent simulations use the same rules, including A.I. stealing the CPU's Bot-race points at end game.
  function scoreHumanHand(hand: string[]) {
    const humanCopy = structuredClone($player1);
    const cpuCopy = structuredClone($player2);
    humanCopy.hand = [...hand];
    calculatePlayerPointsAgainst(humanCopy, cpuCopy, true);
    return { highestPoints: humanCopy.highestPoints, points: { ...humanCopy.points } };
  }

  // ai generated: Declaration samples score both sides together so a hidden human A.I. can really steal the CPU's Bot path in that sample.
  function scoreMatchAgainstHumanHand(hand: string[]) {
    const humanCopy = structuredClone($player1);
    const cpuCopy = structuredClone($player2);
    humanCopy.hand = [...hand];
    calculatePlayerPointsAgainst(cpuCopy, humanCopy, true);
    calculatePlayerPointsAgainst(humanCopy, cpuCopy, true);
    calculatePlayerHighestPoints(cpuCopy);
    const forcedRacePath = getForcedCpuRacePath($player2.title);
    const cpuScore = forcedRacePath ? cpuCopy.points[forcedRacePath] : cpuCopy.highestPoints;
    return { cpuScore, opponentScore: humanCopy.highestPoints };
  }

  // ai generated: A short randomized pause makes the local opponent feel responsive without ever deliberately waiting five seconds.
  function scheduleCpuTurn(): void {
    if (gameMode !== 'singleplayer' || gameState.gameOver || !$player2.turn) return;
    if (cpuTurnTimeout) clearTimeout(cpuTurnTimeout);
    const thinkingDelay = 650 + Math.floor(Math.random() * 1550);
    cpuTurnTimeout = setTimeout(() => void runCpuTurn(), thinkingDelay);
  }

  // ai generated: The controller preserves Echo's full draw-seven, discard-Echo, draw-seven sequence before its final two discards.
  async function runCpuTurn(): Promise<void> {
    if (gameMode !== 'singleplayer' || gameState.gameOver || !$player2.turn) return;

    let observation = buildCpuObservation();
    const declarationDisabledForTesting = isCpuDeclarationDisabledByName($player2.title);

    // ai generated: The visible GDG button belongs to the human, so the name cheat checks the CPU's own legal start-of-turn state.
    const cpuCanDeclare = !gameState.gobbledegookDeclared && gameState.turnCount >= 15 && $player2.hand.length === 5;
    if (cpuCanDeclare && isCpuDeclarationForcedByName($player2.title)) {
      if (cpuStrategyDebugEnabled) console.info(`[Gobbledegook CPU] ${$player2.title} declares GDG because its name forces the first legal opportunity.`);
      await clickOnGobbledegook($player2);
      return;
    }

    if (!gameState.gobbledegookDeclared && gameState.turnCount >= 15 && !declarationDisabledForTesting) {
      const declaration = decideCpuDeclaration(observation, scoreCpuHand, scoreHumanHand, Math.random, 240, scoreMatchAgainstHumanHand);
      if (cpuStrategyDebugEnabled) {
        console.groupCollapsed(`[Gobbledegook CPU] Declaration check for ${$player2.title}`);
        console.info(declaration.explanation);
        console.info('Opponent knowledge:', getCpuOpponentKnowledgeForLog(observation));
        console.groupEnd();
      }
      if (declaration.declare) {
        await clickOnGobbledegook($player2);
        return;
      }
    } else if (!gameState.gobbledegookDeclared && gameState.turnCount >= 15 && declarationDisabledForTesting && cpuStrategyDebugEnabled) {
      console.info(`[Gobbledegook CPU] ${$player2.title} will not declare while its name is "test".`);
    }

    // ai generated: This is the CPU's ordinary once-per-turn draw; Echo follow-up draws are handled below.
    await drawCard($player2);
    if (gameState.gameOver || !$player2.turn) return;
    await wait(1100 + Math.floor(Math.random() * 1300));

    // ai generated: Three Echo cards can legitimately repeat this loop; 12 actions is only a fail-safe against a broken card state trapping the browser forever.
    const maxCpuTurnActions = 12;
    let cpuTurnActionCount = 0;
    while ($player2.turn && !gameState.gameOver && cpuTurnActionCount < maxCpuTurnActions) {
      cpuTurnActionCount++;
      const echoAction = getCpuEchoAction($player2.hand, $player2.playingTwice);

      if (echoAction === 'draw') {
        if (cpuStrategyDebugEnabled) {
          console.groupCollapsed(`[Gobbledegook CPU] ${$player2.title} takes Echo's immediate extra draw`);
          console.info('Echo does not replace the normal turn draw, so the CPU draws up to seven before discarding.');
          console.info('Visible status:', {
            currentHand: [...$player2.hand],
            discards: [...$player2.discards],
            racePoints: getCpuRacePointsForLog(),
            opponentKnowledge: getCpuOpponentKnowledgeForLog(observation)
          });
          console.groupEnd();
        }
        await wait(500 + Math.floor(Math.random() * 800));
        // ai generated: false prevents an Echo follow-up from being counted as the start of a new turn.
        await drawCard($player2, false);
        if (gameState.gameOver || !$player2.turn) return;
        await wait(1100 + Math.floor(Math.random() * 1300));
        continue;
      }

      if ($player2.hand.length <= 5) return;
      observation = buildCpuObservation();
      if (echoAction === 'discard-echo') {
        if (cpuStrategyDebugEnabled) {
          console.groupCollapsed(`[Gobbledegook CPU] ${$player2.title} discards Echo and draws back to seven`);
          console.info('Discarding Echo first preserves its replacement draw before the CPU makes its final two discards.');
          console.info('Visible status:', {
            currentHand: [...$player2.hand],
            discards: [...$player2.discards],
            racePoints: getCpuRacePointsForLog(),
            opponentKnowledge: getCpuOpponentKnowledgeForLog(observation)
          });
          console.groupEnd();
        }
        await discard('echo', $player2);
        continue;
      }

      const decision = chooseCpuDiscard(observation, scoreCpuHand, Math.random, scoreCpuSwappedHand, scoreCpuHand);
      cpuMemory = rememberCpuDecision(cpuMemory, decision);
      if (cpuStrategyDebugEnabled) {
        console.groupCollapsed(`[Gobbledegook CPU] ${$player2.title} follows the ${decision.path.race} path`);
        console.info(decision.explanation);
        // ai generated: Show both live priorities so a secondary route is visible while testing discard decisions.
        console.info('Primary path:', { race: decision.path.race, utility: decision.path.utility, reasoning: decision.path.explanation });
        console.info('Backup path:', { race: decision.backupPath.race, utility: decision.backupPath.utility, reasoning: decision.backupPath.explanation });
        console.info('Visible status:', {
          currentHand: [...$player2.hand],
          discards: [...$player2.discards],
          racePoints: getCpuRacePointsForLog(),
          boostsBlocked: observation.boostsBlocked,
          trapsBlocked: observation.trapsBlocked,
          neutralizePossiblyAvailable: observation.neutralizePossiblyAvailable,
          forcedRacePath: observation.forcedRacePath || 'balanced strategy',
          opponentKnowledge: getCpuOpponentKnowledgeForLog(observation),
          opposingAiRisk: decision.path.race === 'bots' ? decision.path.risk : 'not the active path'
        });
        console.groupEnd();
      }
      await discard(decision.cardTitle, $player2);
      if ($player2.turn && $player2.hand.length > 5) await wait(700 + Math.floor(Math.random() * 900));
    }
  }

  // Calculates and updates player's highest points among races.
  function calculatePlayerHighestPoints(player: Player) {
    player.highestPoints = Math.max(
      player.points.humans,
      player.points.goblins,
      player.points.elves,
      player.points.dwarves,
      player.points.beasts,
      player.points.bots,
      player.points.xenos,
      player.points.spirits
    );
  }

  // Modifies card points depending on cards in player hand
  function displayCardPoints(player: Player, cardTitle: string): number {
    if (cardTitle === 'bear' && player.hand.filter(card => ['bear', 'leon'].includes(card)).length > 1) return 0;

    let highestPoints = cardTitle === 'virus' ? -2 : 0; // only virus starts below 0.
    const triggerTwinEffect = player.hand.some(c => ['nelladan', 'leon'].includes(c)) && player.hand.includes('nadallen');
    if ((player.hand.some(card => ['dreamDestroyer', 'nightTerror'].includes(card)) || ['dog', 'wolf', 'lion', 'bear'].includes(cardTitle)) && getRaces(cardTitle).includes('beast')) highestPoints = Math.max(highestPoints, displayBeastPoints(player, cardTitle));
    if ((player.hand.includes('ai') || player.hand.includes('protectron')) && getRaces(cardTitle).includes('bot')) highestPoints = Math.max(highestPoints, displayBotPoints(player, cardTitle));
    if (triggerTwinEffect || player.hand.some(card => bardCards.includes(card)) || (player.hand.includes('elfKing') && getRaces(cardTitle).includes('elf'))) highestPoints = Math.max(highestPoints, displayElfPoints(player, cardTitle));
    if ((player.hand.includes('emperor') || player.hand.includes('commander')) && getRaces(cardTitle).includes('human')) highestPoints = Math.max(highestPoints, displayHumanPoints(player, cardTitle));
    if (player.hand.every(card => ['redSpirit', 'leon'].includes(card) || ['blueSpirit', 'leon'].includes(card))) highestPoints = Math.max(highestPoints, displaySpiritPoints(player, cardTitle));
    if (cardTitle === 'longbeardLeader') highestPoints = Math.max(highestPoints, displayDwarfPoints(player));
    if (cardTitle === 'cookieJar' && isCookieJarActive(player)) highestPoints = Math.max(highestPoints, 40);
    
    // If this is being called on player 1/2's hand and the card is a voidrunner/warp and I'm player 2/1 return appropriate points.
    const xenoCards = ['voidRunner', 'warpstalker', 'nebulite'];
    if (player.hand.some(c => xenoCards.includes(c)) && getRaces(cardTitle).includes('xeno')) highestPoints = Math.max(highestPoints, displayXenoPoints(player, cardTitle));

    return Math.max(highestPoints, getRuntimeCardDetails(player)[cardTitle].points);
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
    player.points.humans += player.chargePoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.humans += (numOfRejuvenates * 10);

    // Add cookie points
    const cookies = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
    const numOfCookies = player.boosts.filter(boost => cookies.includes(boost)).length;
    player.points.humans += (numOfCookies * 5);

    // Add cookie crumbs points
    const numOfCookieCrumbs = player.boosts.filter(boost => boost === 'cookieCrumbs').length;
    player.points.humans += (numOfCookieCrumbs * 3);

    // Add cookie jar points
    if (isCookieJarActive(player)) {
      const numOfCookieJars = player.hand.filter(card => card === 'cookieJar').length;
      const fullCookieJar = isFullCookieJarHand(player, cookies);
      fullCookieJar ? player.points.humans += 100 : player.points.humans += (numOfCookieJars * 40);
    }
  }

  // Calculates all traps that apply to humans and deducts them from human points.
  function calculateHumanTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    player.points.humans -= player.infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.humans -= (numOfSaps * 10);

    // Rotten Cookie Crumbs
    const numOfRottenCrumbs = player.traps.filter(trap => trap === 'rottenCookieCrumbs').length;
    player.points.humans -= (numOfRottenCrumbs * 3);
  }

  // Doubles human points and adds other races as well except Xenos.
  function calculateEmperor(player: Player) {
    player.points.humans *= 2;
    const otherRaceCards = player.hand.filter(card => !getRaces(card).includes('human') && !getRaces(card).includes('xeno'));
    // ai generated: Emperor adds printed base points; displayCardPoints can show bonuses from a different race and is only for the card label.
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
    player.points.goblins += player.growthPoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.goblins += (numOfRejuvenates * 10);

    // Add cookie points
    const cookies = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
    const numOfCookies = player.boosts.filter(boost => cookies.includes(boost)).length;
    player.points.goblins += (numOfCookies * 5);

    // Add cookie crumbs points
    const numOfCookieCrumbs = player.boosts.filter(boost => boost === 'cookieCrumbs').length;
    player.points.goblins += (numOfCookieCrumbs * 3);

    // Add cookie jar points
    if (isCookieJarActive(player)) {
      const numOfCookieJars = player.hand.filter(card => card === 'cookieJar').length;
      const fullCookieJar = isFullCookieJarHand(player, cookies);
      fullCookieJar ? player.points.goblins += 100 : player.points.goblins += (numOfCookieJars * 40);
    }
  }

  // Calculates all traps that apply to goblins and deducts them from goblin points.
  function calculateGoblinTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    player.points.goblins -= player.infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.goblins -= (numOfSaps * 10);

    // Rotten Cookie Crumbs
    const numOfRottenCrumbs = player.traps.filter(trap => trap === 'rottenCookieCrumbs').length;
    player.points.goblins -= (numOfRottenCrumbs * 3);
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

    // Handles elf twins. Must calculate before elf king since elf king multiples elf points *2/*3. Worth more than bards so put first.
    if (player.hand.some(c => ['nelladan', 'leon'].includes(c)) && player.hand.includes('nadallen')) calculateElfTwins(player);

    // Handles bards Must calculate before elf king since elf king multiples elf points *2/*3
    if (player.hand.some(card => bardCards.includes(card) || card === 'leon')) calculateBards(player);

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
    player.points.elves += player.growthPoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.elves += (numOfRejuvenates * 10);

    // Add cookie points
    const cookies = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
    const numOfCookies = player.boosts.filter(boost => cookies.includes(boost)).length;
    player.points.elves += (numOfCookies * 5);

    // Add cookie crumbs points
    const numOfCookieCrumbs = player.boosts.filter(boost => boost === 'cookieCrumbs').length;
    player.points.elves += (numOfCookieCrumbs * 3);

    // Add cookie jar points
    if (isCookieJarActive(player)) {
      const numOfCookieJars = player.hand.filter(card => card === 'cookieJar').length;
      const fullCookieJar = isFullCookieJarHand(player, cookies);
      fullCookieJar ? player.points.elves += 100 : player.points.elves += (numOfCookieJars * 40);
    }
  }

  // Calculates all traps that apply to elves and deducts them from elf points.
  function calculateElfTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    player.points.elves -= player.infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.elves -= (numOfSaps * 10);

    // Rotten Cookie Crumbs
    const numOfRottenCrumbs = player.traps.filter(trap => trap === 'rottenCookieCrumbs').length;
    player.points.elves -= (numOfRottenCrumbs * 3);
  }

  // Adds bonus points for matching elf twins
  function calculateElfTwins(player: Player) {
    // ai generated: Leon pairs with Nadallen, but only Nadallen receives the +5 from that pairing.
    const numOfNelladans = player.hand.filter(card => card === 'nelladan').length;
    const numOfLeons = player.hand.filter(card => card === 'leon').length;
    const bonusTwinPoints = numOfNelladans * 10 + numOfLeons * 5;
    player.points.elves += bonusTwinPoints;
  }

  // Adds bonus points for matching bards
  function calculateBards(player: Player) {
    // ai generated: Leon completes Bard synergies but does not receive a Bard's personal +1-per-other-Bard bonus.
    const fullBand = player.hand.every(card => bardCards.includes(card) || card === 'leon');
    const numOfBards = player.hand.filter(card => bardCards.includes(card) || card === 'leon').length;
    const numOfActualBards = player.hand.filter(card => bardCards.includes(card)).length;

    if (fullBand) player.points.elves += 20;
    player.points.elves += numOfActualBards * (numOfBards - 1);
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
    const numOfNelladans = player.hand.filter(card => card === 'nelladan' || card === 'leon').length;
    const numOfNadallens = player.hand.filter(card => card === 'nadallen').length;
    const triggerTwinEffect = numOfNelladans > 0 && numOfNadallens > 0;
    const numOfBards = player.hand.filter(card => bardCards.includes(card) || card === 'leon').length;
    const fullElfHand = player.hand.every(c => getRaces(c).includes('elf'));

    // Elf king, full hand and twins (can't have full band + elf king)
    if ((hasElfKing && fullElfHand && triggerTwinEffect)) {
      // ai generated: Multiply Nadallen's full twin-adjusted value, including Leon's trigger, under a full-hand Elf King.
      if (cardTitle === 'nadallen') return ($cardDetails[cardTitle].points + numOfNelladans * 5) * 3;
      // ai generated: Leon triggers the twin pair but does not receive Nelladan's personal +5.
      if (cardTitle === 'nelladan') return (($cardDetails[cardTitle].points + 5) * 3);
      if (bardCards.includes(cardTitle) && numOfBards > 1) return (($cardDetails[cardTitle].points + (numOfBards - 1)) * 3);
      
      // Elf king and full hand (can't have full band + elf king)
    } else if (hasElfKing && fullElfHand) {
      if (bardCards.includes(cardTitle)) return (($cardDetails[cardTitle].points + (numOfBards - 1)) * 3);
      return $cardDetails[cardTitle].points * 3;
      

      // Elf King + Twins
    } else if (hasElfKing && triggerTwinEffect) {
      if (cardTitle === 'nadallen') return (($cardDetails[cardTitle].points + (numOfNelladans * 5)) * 2);
      if (cardTitle === 'nelladan') return ($cardDetails[cardTitle].points + 5) * 2;
    
      // Twins
    } else if (triggerTwinEffect) {
      if (cardTitle === 'nadallen') return ($cardDetails[cardTitle].points + (numOfNelladans * 5));
      if (cardTitle === 'nelladan') return ($cardDetails[cardTitle].points + 5);
    }

    // Bards and elf king
    else if (hasElfKing && numOfBards > 1) {
      if (bardCards.includes(cardTitle)) return (($cardDetails[cardTitle].points + (numOfBards - 1)) * 2);
    }
    
    // King
    else if (hasElfKing) {
      return $cardDetails[cardTitle].points * 2;
    }

    // Bards
    else if (numOfBards > 1) {
      if (bardCards.includes(cardTitle)) return ($cardDetails[cardTitle].points + (numOfBards - 1));
    }

    // Default
    return $cardDetails[cardTitle].points;
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
    player.points.dwarves += player.growthPoints;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.dwarves += (numOfRejuvenates * 10);

    // Add cookie points
    const cookies = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
    const numOfCookies = player.boosts.filter(boost => cookies.includes(boost)).length;
    player.points.dwarves += (numOfCookies * 5);

    // Add cookie crumbs points
    const numOfCookieCrumbs = player.boosts.filter(boost => boost === 'cookieCrumbs').length;
    player.points.dwarves += (numOfCookieCrumbs * 3);

    // Add cookie jar points
    if (isCookieJarActive(player)) {
      const numOfCookieJars = player.hand.filter(card => card === 'cookieJar').length;
      const fullCookieJar = isFullCookieJarHand(player, cookies);
      fullCookieJar ? player.points.dwarves += 100 : player.points.dwarves += (numOfCookieJars * 40);
    }
  }

  // Calculates all traps that apply to dwarves and deducts them from dwarf points.
  function calculateDwarfTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    player.points.dwarves -= player.infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.dwarves -= (numOfSaps * 10);

    // Rotten Cookie Crumbs
    const numOfRottenCrumbs = player.traps.filter(trap => trap === 'rottenCookieCrumbs').length;
    player.points.dwarves -= (numOfRottenCrumbs * 3);
  }
  
  // Attempts to draw a dwarf next if there are dwarves remaining.
  function setDeckAsDwarfDeck(player: Player): DeckRace {
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

  // Player gains +5 points per discarded dwarf.
  function calculateLongbeard(player: Player, calculateOtherPlayerDiscards = false) {  
    let numOfDiscardedDwarves = 0;

    if (!calculateOtherPlayerDiscards) {
      player.discards.forEach(card => {
        if (getRaces(card).includes('dwarf')) numOfDiscardedDwarves += 1;
      });
    } else {
      $player1.discards.forEach(card => {
        if (getRaces(card).includes('dwarf')) numOfDiscardedDwarves += 1;
      });
      $player2.discards.forEach(card => {
        if (getRaces(card).includes('dwarf')) numOfDiscardedDwarves += 1;
      });
    }

    player.points.dwarves += (numOfDiscardedDwarves * 5);
  }

  function displayDwarfPoints(player: Player): number {
    let numOfDiscardedDwarves = 0;
    
    player.discards.forEach(card => {
      if (getRaces(card).includes('dwarf')) numOfDiscardedDwarves += 1;
    });

    return $cardDetails['longbeardLeader'].points + (numOfDiscardedDwarves * 5);
  }

  // --------------------- BEAST CALCULATIONS ----------------------- \\

  function calculateBeastPoints(player: Player): void {
    const beastCards = player.hand.filter(card => getRaces(card).includes('beast'));
    const numOfBears = player.hand.filter(card => ['bear', 'leon'].includes(card)).length;

    beastCards.forEach(card => player.points.beasts += $cardDetails[card].points);

    if (player.hand.includes('nightTerror')) calculateNightTerror(player);
    if (player.hand.includes('dreamDestroyer')) calculateDreamDestroyer(player); // wipes nightTerror

    // If player has humans/hobbits, pawl barkington gains +10 points.
    if (player.hand.includes('dog') && player.hand.some(card => getRaces(card).includes('human'))) {
      const numOfDogs = player.hand.filter(card => card === 'dog').length;
      player.points.beasts += (10 * numOfDogs);
    }

    // ai generated: Leon joins the pride count, but only real Lions receive its personal bonus.
    if (player.hand.includes('lion')) calculateLionPride(player);

    // ai generated: Leon joins the pack count, but only real Wolves receive its personal bonus.
    if (player.hand.includes('wolf')) calculateWolfPack(player);

    // Bears worth 0 points if other bears in hand.
    if (numOfBears > 1) deductBearPoints(player);
    
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

    // Add cookie points
    const cookies = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
    const numOfCookies = player.boosts.filter(boost => cookies.includes(boost)).length;
    player.points.beasts += (numOfCookies * 5);

    // Add cookie crumbs points
    const numOfCookieCrumbs = player.boosts.filter(boost => boost === 'cookieCrumbs').length;
    player.points.beasts += (numOfCookieCrumbs * 3);

    // Add cookie jar points
    if (isCookieJarActive(player)) {
      const numOfCookieJars = player.hand.filter(card => card === 'cookieJar').length;
      const fullCookieJar = isFullCookieJarHand(player, cookies);
      fullCookieJar ? player.points.beasts += 100 : player.points.beasts += (numOfCookieJars * 40);
    }
  }

  // Calculates all traps that apply to beasts and deducts them from beast points.
  function calculateBeastTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    player.points.beasts -= player.infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.beasts -= (numOfSaps * 10);

    // Rotten Cookie Crumbs
    const numOfRottenCrumbs = player.traps.filter(trap => trap === 'rottenCookieCrumbs').length;
    player.points.beasts -= (numOfRottenCrumbs * 3);
  }

  // ai generated: Night Terror sets every Beast's base contribution to 15 before other Beast bonuses.
  function calculateNightTerror(player: Player) {
    const numOfBeastCards = player.hand.filter(card => getRaces(card).includes('beast')).length;
    player.points.beasts = 0;
    player.points.beasts += (numOfBeastCards * 15);
  }
  
  // ai generated: Dream Destroyer overrides Night Terror and sets every Beast's base contribution to 18.
  function calculateDreamDestroyer(player: Player) {
    const numOfBeastCards = player.hand.filter(card => getRaces(card).includes('beast')).length;
    player.points.beasts = 0;
    player.points.beasts += (numOfBeastCards * 18);
  }

  // ai generated: Each real Lion gains +3 per Lion-compatible card, including Leon; Leon receives none of this bonus.
  function calculateLionPride(player: Player) {
    const numOfLions = player.hand.filter(card => card === 'lion' || card === 'leon').length;
    const numOfActualLions = player.hand.filter(card => card === 'lion').length;
    player.points.beasts += numOfActualLions * numOfLions * 3;
  }

  // ai generated: Each real Wolf gains pack points from Wolf-compatible cards; Leon contributes but does not receive them.
  function calculateWolfPack(player: Player) {
    const numOfWolves = player.hand.filter(card => card === 'wolf' || card === 'leon').length;
    const numOfActualWolves = player.hand.filter(card => card === 'wolf').length;
    const numOfWereWolves = player.hand.filter(card => card === 'lupin').length;
    // ai generated: Lupin contributes +2 to each real Wolf, matching each Wolf's displayed pack value.
    player.points.beasts += numOfActualWolves * (numOfWolves * 2 + numOfWereWolves * 2);
  }

  // Remove bear points if player has more than 1 bear in hand.
  function deductBearPoints(player: Player) {
    // Here Leon shouldn't always count since he starts at 0 points.
    const numOfBears = player.hand.filter(card => card === 'bear').length;

    if (player.hand.includes('dreamDestroyer')) {
      player.points.beasts -= numOfBears * 18; // ai generated: Remove the new Dream Destroyer value for each zero-point Bear.
      
    } else if (player.hand.includes('nightTerror')) {
      player.points.beasts -= numOfBears * 15; // ai generated: Remove the new Night Terror value for each zero-point Bear.

    } else {
      player.points.beasts -= numOfBears * $cardDetails['bear'].points;
    }
  }

  function displayBeastPoints(player: Player, cardTitle: string): number {
    const hasHumans = player.hand.some(c => getRaces(c).includes('human'));
    const hasNightTerror = player.hand.includes('nightTerror');
    const hasDreamDestroyer = player.hand.includes('dreamDestroyer');
    const numOfWolves = player.hand.filter(card => ['wolf', 'leon'].includes(card)).length;
    const numOfWerewolves = player.hand.filter(card => card === 'lupin').length;
    const numOfLions = player.hand.filter(card => ['lion', 'leon'].includes(card)).length;
    const numOfBears = player.hand.filter(card => ['bear', 'leon'].includes(card)).length;
    let wolfPackPoints = 0;
    let lionPridePoints = 0;

    if (['lion', 'leon'].includes(cardTitle)) {
      let leaderBonus = 0;
      if (hasNightTerror) leaderBonus = 15;
      if (hasDreamDestroyer) leaderBonus = 18; // ai generated: Dream Destroyer overrides Night Terror.

      lionPridePoints = $cardDetails[cardTitle].points + (numOfLions * 3) + ((hasDreamDestroyer || hasNightTerror) ? (leaderBonus - $cardDetails[cardTitle].points) : 0);
      if (cardTitle === 'lion') return lionPridePoints;
    }
    
    if (['wolf', 'leon'].includes(cardTitle)) {
      let leaderBonus = 0;
      if (hasNightTerror) leaderBonus = 15;
      if (hasDreamDestroyer) leaderBonus = 18; // ai generated: Dream Destroyer overrides Night Terror.
      
      wolfPackPoints = $cardDetails[cardTitle].points + (numOfWolves * 2) + (numOfWerewolves * 2) + ((hasDreamDestroyer || hasNightTerror) ? (leaderBonus - $cardDetails[cardTitle].points) : 0);
      if (cardTitle === 'wolf') return wolfPackPoints;
    }
    
    // ai generated: Leon triggers Wolf and Lion bonuses without displaying either card-specific bonus himself.
    if (cardTitle === 'leon') return hasDreamDestroyer ? 18 : hasNightTerror ? 15 : 0;

    // Check for extra bears, wipe points if multiple.
    if (cardTitle === 'bear' && numOfBears > 1) return 0;

    // dog base points already calculated
    if (cardTitle === 'dog' && hasHumans && hasDreamDestroyer) return 28;
    if (cardTitle === 'dog' && hasHumans && hasNightTerror) return 25;
    if (cardTitle === 'dog' && hasHumans) return 14;
    if (hasDreamDestroyer) return 18;
    if (hasNightTerror) return 15;

    return $cardDetails[cardTitle].points;
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

  // --------------------- BOT CALCULATIONS ----------------------- \\

  function calculateBotPoints(player: Player, otherPlayer: Player, forEndGameCalculation = false): void {
    const botCards = player.hand.filter(card => getRaces(card).includes('bot'));
    botCards.forEach(card => player.points.bots += $cardDetails[card].points);

    // Wipe points if other player has ai
    if (forEndGameCalculation && otherPlayer.hand.includes('ai')) {
      player.points.bots = 0;
    } else {
      // Adds +4 to all bot cards (player + otherPlayer) then steals all bot points.
      if (player.hand.includes('ai')) calculateAi(player, otherPlayer, forEndGameCalculation);
  
      // ai generated: Run after A.I. resets Bot points; real Viruses gain +8, while Viruses and Leon each trigger Protectron's +1.
      const shouldCalculateProtectrons = player.hand.includes('protectron') || (forEndGameCalculation && player.hand.includes('ai') && otherPlayer.hand.includes('protectron'));
      if (shouldCalculateProtectrons) calculateProtectron(player, otherPlayer, forEndGameCalculation);
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
      player.points.bots += player.chargePoints;
    }

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.bots += (numOfRejuvenates * 10);

    // Add cookie points
    const cookies = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
    const numOfCookies = player.boosts.filter(boost => cookies.includes(boost)).length;
    player.points.bots += (numOfCookies * 10); // doubled for bots

    // Add cookie crumbs points
    const numOfCookieCrumbs = player.boosts.filter(boost => boost === 'cookieCrumbs').length;
    player.points.bots += (numOfCookieCrumbs * 6); // doubled for bots

    // Add cookie jar points
    if (isCookieJarActive(player)) {
      const numOfCookieJars = player.hand.filter(card => card === 'cookieJar').length;
      const fullCookieJar = isFullCookieJarHand(player, cookies);
      // ai generated: Unlike Cookie and Cookie Crumbs, the Jar's +40/+100 bonus is not doubled for Bots.
      fullCookieJar ? player.points.bots += 100 : player.points.bots += (numOfCookieJars * 40);
    }
  }

  // Calculates all traps that apply to bots and deducts them from bot points.
  function calculateBotTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    player.points.bots -= player.infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.bots -= (numOfSaps * 10);
  }

  // Handles Protectrons who negate viruses
  function calculateProtectron(player: Player, otherPlayer: Player, calculateHackingAbility = false) {
    const numOfProtectrons = player.hand.filter(card => card === 'protectron').length;
    const numOfViruses = player.hand.filter(card => card === 'virus').length;
    // ai generated: Leon triggers each Protectron's +1 like a Virus, but only real Viruses receive the +8 cleanup.
    // TODO (ai generated): Audit Leon's trigger-only interactions across every race; he should not inherit card-specific self-bonuses by default.
    const numOfVirusTriggers = player.hand.filter(card => card === 'virus' || card === 'leon').length;
    if (numOfProtectrons > 0) player.points.bots += numOfViruses * 8;
    player.points.bots += numOfProtectrons * numOfVirusTriggers;

    // If player also has A.I. steal otherPlayer bots too
    if (calculateHackingAbility && player.hand.includes('ai')) {
      const otherPlayerNumOfProtectrons = otherPlayer.hand.filter(card => card === 'protectron').length;
      const otherPlayerNumOfViruses = otherPlayer.hand.filter(card => card === 'virus').length;
      const otherPlayerNumOfVirusTriggers = otherPlayer.hand.filter(card => card === 'virus' || card === 'leon').length;
      if (otherPlayerNumOfProtectrons > 0) player.points.bots += otherPlayerNumOfViruses * 8;
      player.points.bots += otherPlayerNumOfProtectrons * otherPlayerNumOfVirusTriggers;
    }
  }

  // Adds ALL bot card points on the field to players score, and bots have +4
  function calculateAi(player: Player, otherPlayer: Player, calculateOpponentCards = false) {  
    // Need to reset since base bot points already calculated
    player.points.bots = 0;
    player.hand.forEach(card => {
      if (getRaces(card).includes('bot')) player.points.bots += ($cardDetails[card].points + aiBotCardBonus);
    });

    if (calculateOpponentCards) {
      // Add all bot points from otherPlayer hand as well
      otherPlayer.points.bots = 0;
      otherPlayer.hand.forEach(card => {
        if (getRaces(card).includes('bot')) player.points.bots += ($cardDetails[card].points + aiBotCardBonus);
      });
    }
  }

  function displayBotPoints(player: Player, cardTitle: string): number {
    const numOfProtectrons = player.hand.filter(card => card === 'protectron').length;
    const numOfVirusTriggers = player.hand.filter(card => card === 'virus' || card === 'leon').length;
    const aiBonus = player.hand.includes('ai') ? aiBotCardBonus : 0;

    if (cardTitle === 'virus') return $cardDetails[cardTitle].points + aiBonus + (numOfProtectrons > 0 ? 8 : 0);
    if (cardTitle === 'protectron') return $cardDetails[cardTitle].points + aiBonus + numOfVirusTriggers;
    if (player.hand.includes('ai')) return $cardDetails[cardTitle].points + aiBotCardBonus;

    return $cardDetails[cardTitle].points;
  }

  // --------------------- XENO CALCULATIONS ----------------------- \\

  // Calculates all xeno points including boosts, traps, etc.
  function calculateXenoPoints(player: Player, otherPlayer: Player): void {
    const calculatingForSelf = (player.id === $player1.id && gameState.playingAs === 'p1') || (player.id === $player2.id && gameState.playingAs === 'p2');
    const xenoCards = player.hand.filter(card => getRaces(card).includes('xeno'));
    xenoCards.forEach(card => calculatingForSelf ? player.points.xenos += $cardDetails[card].points : player.points.xenos += remoteCardDetails[card].points);

    // ai generated: A Nebulite adds 5 to each other Xeno and multiple Nebulites do not stack this bonus.
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

    // Add cookie points
    const cookies = ['oreoCookie', 'chocoChipCookie', 'thumbprintCookie', 'oatmealCookie'];
    const numOfCookies = player.boosts.filter(boost => cookies.includes(boost)).length;
    player.points.xenos += (numOfCookies * 5);

    // Add cookie crumbs points
    const numOfCookieCrumbs = player.boosts.filter(boost => boost === 'cookieCrumbs').length;
    player.points.xenos += (numOfCookieCrumbs * 3);

    // Add cookie jar points
    if (isCookieJarActive(player)) {
      const numOfCookieJars = player.hand.filter(card => card === 'cookieJar').length;
      const fullCookieJar = isFullCookieJarHand(player, cookies);
      fullCookieJar ? player.points.xenos += 100 : player.points.xenos += (numOfCookieJars * 40);
    }
  }

  // Calculates all traps that apply to xenos and deducts them from xeno points.
  function calculateXenoTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Infects
    player.points.xenos -= player.infectPoints;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.xenos -= (numOfSaps * 10);

    // Rotten Cookie Crumbs
    const numOfRottenCrumbs = player.traps.filter(trap => trap === 'rottenCookieCrumbs').length;
    player.points.xenos -= (numOfRottenCrumbs * 3);

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

  function displayXenoPoints(player: Player, cardTitle: string): number {
    const runtimeCardDetails = getRuntimeCardDetails(player);
    const numOfNebulites = player.hand.filter(card => card === 'nebulite').length;
    return runtimeCardDetails[cardTitle].points + (numOfNebulites > 0 && cardTitle !== 'nebulite' ? 5 : 0);
  }

  // Calculates special xeno card points
  function calculateSpecialXenoCard(player: Player, cardTitle: string): void {
    const runtimeCardDetails = getRuntimeCardDetails(player);
    // If card drawn is warpstalker, generate point value for card between 10-20 inclusive.
    if (cardTitle === 'warpstalker') runtimeCardDetails[cardTitle].points = Math.ceil(Math.random() * 11) + 9;

    // If card drawn is voidRunner, set points equal to amount of turns passed
    if (cardTitle === 'voidRunner') runtimeCardDetails[cardTitle].points = gameState.turnCount;

    // Nebulites buff xenos by 4 points
    if (cardTitle === 'nebulite') {
      const numOfNonNebuliteXenos = player.hand.filter(card => getRaces(card).includes('xeno') && card !== 'nebulite').length;
      player.points.xenos += (numOfNonNebuliteXenos * 5);
    }
  }

  async function calculateXenoEggs(player: Player) {
    const runtimeCardDetails = getRuntimeCardDetails(player);
    // If sporax gain +2
    if (player.hand.includes('sporax')) runtimeCardDetails['sporax'].points += 2;

    // If xerandium randomize points between 0 - 30
    if (!gameState.gobbledegookDeclared && player.hand.includes('xerandium')) runtimeCardDetails['xerandium'].points = Math.floor(Math.random() * 31);

    // If sporax gain +2
    if (player.hand.includes('drainite') && runtimeCardDetails['drainite'].points >= 2) runtimeCardDetails['drainite'].points -= 2;

    // So both clients show the same points for these cards
    updateClientsToShareState();
    while (gameState.showSpinner) await wait(500);
  }

  // ai generated: Singleplayer stores the human's changing xeno values locally and the CPU's in the existing remote-value copy.
  function getRuntimeCardDetails(player: Player) {
    const playerIsLocal = (gameState.playingAs === 'p1' && player.id === $player1.id)
      || (gameState.playingAs === 'p2' && player.id === $player2.id);
    return playerIsLocal ? $cardDetails : remoteCardDetails;
  }

  // Return regular points if it's not special xeno card
  function endGameXenoPointHandler(cardTitle: string, player: 'p1' | 'p2'): number {
    switch (cardTitle) {
      case 'warpstalker':
        return gameState.playingAs === player ? $cardDetails['warpstalker'].points : remoteCardDetails['warpstalker'].points;
      case 'voidRunner':
        return gameState.playingAs === player ? $cardDetails['voidRunner'].points : remoteCardDetails['voidRunner'].points;
      case 'drainite':
        return gameState.playingAs === player ? $cardDetails['drainite'].points : remoteCardDetails['drainite'].points;
      case 'xerandium':
        return gameState.playingAs === player ? $cardDetails['xerandium'].points : remoteCardDetails['xerandium'].points;
      case 'sporax':
        return gameState.playingAs === player ? $cardDetails['sporax'].points : remoteCardDetails['sporax'].points;
      default:
        return $cardDetails[cardTitle].points;
    }
  }

  // Trades warpstalker and voidrunner client values before calculation
  function updateClientsToShareState() {
    gameState.showSpinner = true;
    emitGameEvent('start-xeno-sync', {player1: $player1, player2: $player2, cardDetails: $cardDetails});
  }

  // Draws the xeno egg deck cards.
  async function drawXenoEggCards(player: Player): Promise<'growingXeno' | 'drainite' | 'xerandium' | 'sporax'> {
    if (player.xenoEggCounter === 1) {
      player.xenoEggCounter ++;
      return 'growingXeno';
      
    } else if (player.xenoEggCounter === 2) {
      gameState.showSpinner = true;
      player.xenoEggCounter ++; 
      const randomNum = Math.floor(Math.random() * remainingXenoEggs.length);
      const cardDrawn = remainingXenoEggs[randomNum] as 'drainite' | 'xerandium' | 'sporax';

      // Make sure client is updated
      emitGameEvent('remove-xeno-egg', cardDrawn);
      while (gameState.showSpinner) await wait(500);

      return cardDrawn;
    }
  }

  // --------------------- SPIRIT CALCULATIONS ----------------------- \\

  // Calculates all spirit points including boosts, traps, etc.
  function calculateSpiritPoints(player: Player, otherPlayer: Player): void {
    const spiritCards = player.hand.filter(card => getRaces(card).includes('spirit'));
    const specialSpiritCards = ['blueSpirit', 'redSpirit'];
    spiritCards.forEach(card => player.points.spirits += $cardDetails[card].points);

    // Set points to fixed 100/200 if full hand of blue/red spirits.
    if (player.hand.some(card => specialSpiritCards.includes(card))) calculateSpecialSpiritCard(player);    

    calculateSpiritBoosts(player);
    calculateSpiritTraps(player);
  }

  // Calculates all boosts that apply to spirits and adds them to spirit points.
  function calculateSpiritBoosts(player: Player): void {
    if (areBoostsBlocked(player)) return;

    // Add rejuvenate points
    const numOfRejuvenates = player.boosts.filter(boost => boost === 'rejuvenate').length;
    player.points.spirits += (numOfRejuvenates * 10);
  }

  // Calculates all traps that apply to spirits and deducts them from spirit points.
  function calculateSpiritTraps(player: Player): void {
    if (areTrapsBlocked(player)) return;

    // Saps
    const numOfSaps = player.traps.filter(trap => trap === 'sap').length;
    player.points.spirits -= (numOfSaps * 10);
  }

  function displaySpiritPoints(player: Player, cardTitle: string): number {
    // ai generated: Leon completes a Jinn hand, but only actual Jinns display their personal share of that hand's score.
    if (player.hand.every(card => ['redSpirit', 'leon'].includes(card)) && cardTitle === 'redSpirit') return 20;
    if (player.hand.every(card => ['blueSpirit', 'leon'].includes(card)) && cardTitle === 'blueSpirit') return 40;
    
    return $cardDetails[cardTitle].points;
  }

  // Calculates special xeno card points
  function calculateSpecialSpiritCard(player: Player) {
    const fullRedSpiritHand = player.hand.every(card => ['redSpirit', 'leon'].includes(card));
    const fullBlueSpiritHand = player.hand.every(card => ['blueSpirit', 'leon'].includes(card));
    
    if (fullRedSpiritHand) player.points.spirits = 100;
    if (fullBlueSpiritHand) player.points.spirits = 200;
  }

  // Attempts to draw a red jinn next if there are any remaining.
  function getJinn(player: Player, color: 'red' | 'blue'): {cardDrawn: string, currentDeck: DeckRace} {
    color === 'red' ? player.redSpiritNextTurn = false : player.blueSpiritNextTurn = false;
    if (color === 'red' && fullDeck['spirits'] && fullDeck['spirits'].includes('redSpirit')) return {cardDrawn: 'redSpirit', currentDeck: 'spirits'};
    if (color === 'blue' && fullDeck['spirits'] && fullDeck['spirits'].includes('blueSpirit')) return {cardDrawn: 'blueSpirit', currentDeck: 'spirits'};

    // But if no red jinns remain
    const randomNum = Math.floor(Math.random() * deckTypes.length);
    const randomDeck = deckTypes[randomNum] as DeckRace;
    const deck = fullDeck['spirits']?.length > 0 ? 'spirits' : randomDeck;
    const randomNum2 = Math.floor(Math.random() * fullDeck[deck].length);
    const cardDrawn = fullDeck[deck][randomNum2];
    
    return {cardDrawn, currentDeck: deck};
  }

  // -------------- BOOST/TRAP/NEUTRAL CALCULATIONS ---------------- \\

  // Adds boost card to players boosts array
  async function addBoostCard(player: Player, cardTitle: string): Promise<void> {
    player.boosts = [...player.boosts, cardTitle];
    
    if (cardTitle === 'chastity') player.hasChastity = true;
    if (cardTitle === 'charge') player.numOfCharges += 1;
    if (cardTitle === 'growth') player.numOfGrowths += 1;
    // ai generated: Gaze reveals private information, so only the player who drew it sees its event.
    const localPlayer = gameState.playingAs === 'p1' ? $player1 : $player2;
    if (cardTitle === 'gaze' && player.id === localPlayer.id) void showEvent('gaze');
  }

  // Adds trap card to players traps array
  async function addTrapCard(player: Player, cardTitle: string) {
    player.traps = [...player.traps, cardTitle];

    if (cardTitle === 'corruption') player.hasCorruption = true;
    if (cardTitle === 'infect') player.numOfInfects += 1;
    if (cardTitle === 'exposed' && !player.hasChastity && !player.hand.includes('chastity')) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      player.id === $player1.id ? player1.set({...$player1, isExposed: true}) : player2.set({...$player2, isExposed: true});
      updateClientsToShareState();
      while (gameState.showSpinner) await wait(500);
      emitGameEvent('display-event', 'exposed');
    }
  }

  // Adds neutral card to players neutrals array
  async function addneutralCard(player: Player, card, drawn = true) {
    player.neutrals = [...player.neutrals, card];

    // If Echo card, player draws and plays twice
    if (card === 'echo') {
      player.playingTwice = true;
      emitGameEvent('display-event', 'echo');
    }

    // If vision card, player sees otherPlayer's hand for one turn
    if (card === 'vision' && drawn) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      player.id === $player1.id ? player1.set({...$player1, hasVision: true}) : player2.set({...$player2, hasVision: true});
      updateClientsToShareState();
      while (gameState.showSpinner) await wait(500);
      // ai generated: A CPU turn runs in the human's browser, so only show this private event when the on-screen player drew Vision.
      const localPlayer = gameState.playingAs === 'p1' ? $player1 : $player2;
      if (player.id === localPlayer.id) void showEvent('vision');
    }

    // Add turn to turnCount if card is Ticktock
    if (card === 'ticktock') {
      emitGameEvent('increase-turn-count');
      emitGameEvent('display-event', 'ticktock');
    }

    // Subtract turn from turnCount if card is Tocktick
    if (card === 'tocktick') {
      emitGameEvent('decrease-turn-count');
      emitGameEvent('display-event', 'tocktick');
    }

    // If card is neutralize, reset boosts and traps
    if (card === 'neutralize') emitGameEvent('neutralize-deck');

    // If card is xenoBloom, let both players know they received 15 xeno points
    if (card === 'xenoBloom') emitGameEvent('display-event', 'xenoBloom');

    // If card is xenoBlossom, let both players know they received 5 xeno points
    if (card === 'xenoBlossom') emitGameEvent('display-event', 'xenoBlossom');

    calculateCurrentPlayerPoints(player);
  }

  // Neutralizes deck (remove boosts / traps in effect)
  function neutralizeDeck() {
    showEvent('neutralize');

    // Does not remove shrouded bcuz it should not.
    player1.update($player1 => {
      $player1.neutralizedCards = [...$player1.boosts, ...$player1.traps, ...$player1.neutrals];
      $player1.boosts = [];
      $player1.traps = [];
      $player1.neutrals = [];
      $player1.numOfCharges = 0;
      $player1.numOfGrowths = 0;
      $player1.numOfInfects = 0;
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
      $player2.numOfCharges = 0;
      $player2.numOfGrowths = 0;
      $player2.numOfInfects = 0;
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

  // ai generated: A held Trap now breaks the Jar hand; Boosts and Neutrals (including Leon) remain eligible.
  function isCookieJarActive(player: Player): boolean {
    const bonusRaces = ['boost', 'neutral'];
    const isHandOnlyBonusCards = player.hand.every(card => getRaces(card).some(race => bonusRaces.includes(race)));
    return isHandOnlyBonusCards && !areBoostsBlocked(player);
  }

  // ai generated: Leon counts as a Cookie for the exact Jar hand, but does not create a Cookie's separate draw boost.
  function isFullCookieJarHand(player: Player, cookies: string[]): boolean {
    return player.hand.length === 5
      && player.hand.filter(card => card === 'cookieJar').length === 1
      && player.hand.every(card => card === 'cookieJar' || cookies.includes(card) || card === 'leon');
  }

  // ---------------------------------------------------------------- \\
  // ------------------------ UI/UX/VISUALS  ------------------------ \\
  // ---------------------------------------------------------------- \\

  function toggleP1NameChangeVisibility(): void {
    if (!canEditPlayerName('p1')) return;
    gameState.p2NameChangeVisible = false;
    if (!gameState.p1NameChangeVisible) gameState.newPlayerTitle = $player1.title;
    gameState.p1NameChangeVisible = !gameState.p1NameChangeVisible;
  }
  
  function toggleP2NameChangeVisibility(): void {
    if (!canEditPlayerName('p2')) return;
    gameState.p1NameChangeVisible = false;
    if (!gameState.p2NameChangeVisible) gameState.newPlayerTitle = $player2.title;
    gameState.p2NameChangeVisible = !gameState.p2NameChangeVisible;
  }

  function canEditPlayerName(playerSide: 'p1' | 'p2'): boolean {
    if (gameMode === 'singleplayer') return true;
    const player = playerSide === 'p1' ? $player1 : $player2;
    return gameState.playingAs === playerSide && player.id === socket.id;
  }

  function toggleConnectedNameChange(playerSide: 'p1' | 'p2'): void {
    if (!canEditPlayerName(playerSide)) return;
    const player = playerSide === 'p1' ? $player1 : $player2;
    gameState.newPlayerTitle = player.title;
    gameState.connectedNameChangeSide = gameState.connectedNameChangeSide === playerSide ? '' : playerSide;
  }

  function displayBonusCardIcons(cardTitle: string): string {
    return $cardDetails[cardTitle].image;
  }

  // Converts race card bg to legendary if player is holding the leader of that race.
  function determineRarity(player: Player, cardTitle: string): 'legendary' | 'epic' | 'amazing' | 'great' | 'poor' {
    if (player.hand.includes('emperor') && getRaces(cardTitle).includes('human')) return 'legendary';
    if (player.hand.includes('goblinLord') && getRaces(cardTitle).includes('goblin')) return 'legendary';
    if (player.hand.includes('elfKing') && getRaces(cardTitle).includes('elf')) return 'legendary';
    if (player.hand.includes('longbeardLeader') && getRaces(cardTitle).includes('dwarf')) return 'legendary';
    if (player.hand.includes('ai') && getRaces(cardTitle).includes('bot')) return 'legendary';
    if (player.hand.some(card => ['dreamDestroyer', 'nightTerror'].includes(card)) && getRaces(cardTitle).includes('beast')) return 'legendary';
    if (player.hand.includes('spiritKing') && getRaces(cardTitle).includes('spirit')) return 'legendary';
    // ai generated: Card stars use the current five rarity labels; old/empty labels fall back to one star.
    const rarity = $cardDetails[cardTitle].rarity;
    if (rarity === 'legendary' || rarity === 'epic' || rarity === 'amazing' || rarity === 'great' || rarity === 'poor') return rarity;
    return 'poor';
  }

  // ai generated: Bear and Drainite use their printed values as the neutral color baseline, while other cards retain the existing buff comparison.
  function getCardPointColorBaseline(cardTitle: string): number {
    if (cardTitle === 'drainite') return controlCopyOfCardDetails['drainite'].points;
    return controlCopyOfCardDetails[cardTitle].points;
  }

  // ai generated: A changed Bear or Drainite shows its printed value crossed out so the effective green/red value is easy to compare.
  function getCardPointsForDisplay(player: Player, cardTitle: string): number {
    const effectivePoints = displayCardPoints(player, cardTitle);
    if (cardTitle === 'drainite' && effectivePoints === getCardPointColorBaseline(cardTitle)) return effectivePoints;
    if (['bear', 'drainite'].includes(cardTitle) && effectivePoints !== getCardPointColorBaseline(cardTitle)) {
      return getCardPointColorBaseline(cardTitle);
    }
    return getRuntimeCardDetails(player)[cardTitle].points;
  }

  // Conditionally displays card points as green if they are buffed.
  function determineIfPointColorGreen(player: Player, cardTitle: string): boolean {
    const pointValue = displayCardPoints(player, cardTitle);
    const baseline = cardTitle === 'drainite'
      ? getCardPointColorBaseline(cardTitle)
      : getRuntimeCardDetails(player)[cardTitle].points;

    return pointValue > baseline;
  }

  // ai generated: Only intentionally degrading cards opt into the red point display; normal negative or random values keep their usual color.
  function determineIfPointColorRed(player: Player, cardTitle: string): boolean {
    if (!['bear', 'drainite'].includes(cardTitle)) return false;
    return displayCardPoints(player, cardTitle) < getCardPointColorBaseline(cardTitle);
  }

  function updateUsernameForOtherClient(playerSide: 'p1' | 'p2' = gameState.playingAs): void {
    const newTitle = gameState.newPlayerTitle.trim();
    gameState.connectedNameChangeSide = '';
    gameState.p1NameChangeVisible = false;
    gameState.p2NameChangeVisible = false;
    if (!canEditPlayerName(playerSide)) return;
    if (!newTitle) return;

    if (playerSide === 'p1') player1.update(player => ({ ...player, title: newTitle }));
    if (playerSide === 'p2') player2.update(player => ({ ...player, title: newTitle }));
    if (gameMode === 'multiplayer') emitGameEvent('username-changed', newTitle);
  }

  function updateUsernameForThisClient(newUsername: string): void {
    gameState.playingAs === 'p1' ? $player2.title = newUsername : $player1.title = newUsername;
  }

  function toggleLibraryVisibility() {
    gameState.discardsVisible = false;
    gameState.remainingCardsVisible = false;
    gameState.libraryVisible = !gameState.libraryVisible;
  }

  // Toggles card discards visibility
  function toggleDiscardVisibility() {
    gameState.libraryVisible = false;
    gameState.remainingCardsVisible = false;
    gameState.discardsVisible = !gameState.discardsVisible;
  }

  // Show visual feedback for certain events
  async function showEvent(trigger: 'neutralize' | 'switcharoo' | 'shuffle' | 'xenoBloom' | 'xenoBlossom' | 'ticktock' | 'tocktick' | 'exposed' | 'revealed' |'vision' | 'echo' | 'eradicate' | 'gaze' | 'turn-change') {
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
      case 'revealed':
        gameState.eventMessage = "Reveal 🔦!";
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
      case 'shuffle':
        gameState.eventMessage = "Shuffle!";
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
      case 'eradicate':
        gameState.eventMessage = "Eradicate ☠️!";
        break;
      case 'gaze':
        gameState.eventMessage = "Gaze 🔭!";
        break;
    }
    setTimeout(() => gameState.showEventMessage = false, timer);
  }

  // Determines if card should be visible or not
  function isCardVisible(playerSide: 'p1' | 'p2', card: string, viewerHasVision: boolean, playersRevealed: boolean) {
    const isLookingAtOwnSide = (gameState.playingAs === 'p1' && playerSide === 'p1') || (gameState.playingAs === 'p2' && playerSide === 'p2');
    const isExposed = (gameState.playingAs === 'p1' && $player2.isExposed && playerSide === 'p2') || (gameState.playingAs === 'p2' && $player1.isExposed && playerSide === 'p1');
    const visionBlockedByDarkSpirit = (gameState.playingAs === 'p1' && $player2.hand.includes('darkSpirit') && playerSide === 'p2') || (gameState.playingAs === 'p2' && $player1.hand.includes('darkSpirit') && playerSide === 'p1');
    const visionBlockedByChastityOrRhino = (gameState.playingAs === 'p1' && ($player2.hasChastity || $player2.hand.some(card => ['chastity', 'rhino'].includes(card))) || (gameState.playingAs === 'p2' && ($player1.hasChastity || $player1.hand.some(card => ['chastity', 'rhino'].includes(card)))));
    const cardIsLightSpirit = card === 'lightSpirit';
    
    if (isLookingAtOwnSide) return true;
    if (isExposed && !visionBlockedByDarkSpirit && !visionBlockedByChastityOrRhino) return true;
    if (viewerHasVision && !visionBlockedByDarkSpirit) return true;
    if ((cardIsLightSpirit || playersRevealed) && !visionBlockedByDarkSpirit) return true;

    // player has vision?
    return false;
  }

  // Opens library to card clicked
  function openLibraryToCard(race: Race): void {
    gameState.discardsVisible = false;
    gameState.remainingCardsVisible = false;
    gameState.libraryVisible = true;
    // So library has time to open and DOM can create elements
    setTimeout(() => {
      const element = document.getElementById(`${race}-section`);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  // For Gaze card, shows remaining cards
  function toggleRemainingCardsModal(): void {
    gameState.discardsVisible = false;
    gameState.libraryVisible = false;
    gameState.remainingCardsVisible = !gameState.remainingCardsVisible;
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
    const spiritCardsLeft = fullDeck['spirits'] ? fullDeck['spirits'].length : 0;
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
      Spirits: ${spiritCardsLeft}\n)
      Boosts: ${boostCardsLeft}\n)
      Traps: ${trapCardsLeft}\n)
      Neutrals: ${neutralCardsLeft}\n`);
    } else {
      const cardsLeft = humanCardsLeft + goblinCardsLeft + elfCardsLeft + dwarfCardsLeft + botCardsLeft + beastCardsLeft + xenoCardsLeft + spiritCardsLeft + boostCardsLeft + trapCardsLeft + neutralCardsLeft;
      console.log(`Cards remaining in deck: ${cardsLeft}`);
    }
  }

  // Determines who can click on deck
  async function clickOnDeck() {
    if (gameState.gameOver) return;
    if (isPlayerTurn($player1) && $player1.turn) await drawCard($player1);
    if (gameMode === 'multiplayer' && isPlayerTurn($player2) && $player2.turn) await drawCard($player2);
  }
  
  // Handles player click on card (player is the player whos side ur clicking not playingAs)
  async function clickOnCard(player: Player, cardTitle: string) {
    const currentPlayer = gameState.playingAs === 'p1' ? $player1 : $player2;
    if (player.hand.length > 5) await discard(cardTitle, player);
    // Want to make sure other player can't click on it when they have vision
    if (player.hand.length === 5 && cardTitle === 'gaze' && currentPlayer.hand.includes('gaze') && !areBoostsBlocked(player)) toggleRemainingCardsModal();
  }
 
  // Handles player click on gobbledegook button
  async function clickOnGobbledegook(player: Player = gameState.playingAs === 'p1' ? $player1 : $player2) {
    // Check if it's player's turn
    if (!isPlayerTurn(player)) return;
    if (gameState.gameOver) return;

    if (gameState.gobbledegookDeclared) {
      // Puts spinner while game while updating xenos, every .5s checks if done before continuing.
      updateClientsToShareState();
      while (gameState.showSpinner) await wait(500);
      
      emitGameEvent('end-game');
    } else {
      // Need to add turn count here otherwise it won't go up cuz it's usually triggered on card draw.
      calculateNewTurn(player);
      changeTurns();

      // Have this last so if player gdg other player can still click the button.
      emitGameEvent('gdg-declared');
    }
  }

  // Check if boosts should be calculated or skipped
  function areBoostsBlocked(player: Player): boolean {
    return areBoostsBlockedByXeno(player) || areBoostsBlockedByCorruption(player);
  }

  // Check if boosts are blocked specifically by corruption
  function areBoostsBlockedByCorruption(player: Player): boolean {
    return player.hand.includes('corruption') || player.hasCorruption;
  }

  // Check if boosts are blocked specifically by xeno
  function areBoostsBlockedByXeno(player: Player): boolean {
    return player.hand.includes('xenoGuard');
  }

  // Check if traps should be calculated or skipped
  function areTrapsBlocked(player: Player): boolean {
    return areTrapsBlockedByRhino(player) || areTrapsBlockedByChastity(player);
  }

  // Check if traps are blocked specifically by chastity
  function areTrapsBlockedByChastity(player: Player): boolean {
    return (player.hand.includes('chastity') || player.hasChastity)
  }

  // Check if traps are blocked specifically by rhino
  function areTrapsBlockedByRhino(player: Player): boolean {
    return player.hand.includes('rhino');
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
  
  {#if gameState.gameOver}
    <div class="connected-users">
      <!-- ai generated: Mode can be changed between rounds; singleplayer still begins only when the human presses Ready. -->
      <div class="mode-select" aria-label="Game mode">
        <button class:active={gameMode === 'singleplayer'} on:click={() => selectGameMode('singleplayer')}>Singleplayer</button>
        <span>|</span>
        <button class:active={gameMode === 'multiplayer'} on:click={() => selectGameMode('multiplayer')}>Multiplayer</button>
      </div>
      {#if gameState.connectedNameChangeSide === 'p1'}
        <input class="connected-name-input" bind:value={gameState.newPlayerTitle} on:blur={() => updateUsernameForOtherClient('p1')} type="text" maxlength="20"/>
      {:else}
        <p class:name-editable={canEditPlayerName('p1')} on:click={() => toggleConnectedNameChange('p1')}>{p1Connected ? '🟢 ' + $player1.title : '🔴 Player 1'}</p>
      {/if}
      {#if gameState.connectedNameChangeSide === 'p2'}
        <input class="connected-name-input" bind:value={gameState.newPlayerTitle} on:blur={() => updateUsernameForOtherClient('p2')} type="text" maxlength="20"/>
      {:else}
        <p class:name-editable={canEditPlayerName('p2')} on:click={() => toggleConnectedNameChange('p2')}>{p2Connected ? '🟢 ' + $player2.title : gameMode === 'singleplayer' ? '🟢 Local CPU' : '🔴 Player 2'}</p>
      {/if}
    </div>
  {/if}

    <!-- Discards -->
     <svg on:click={toggleDiscardVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="card-discards-btn">
      <path d="M15 12h-5"/>
      <path d="M15 8h-5"/>
      <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>
    </svg>
    {#if gameState.discardsVisible}
      <Discards
        draws={gameState.playingAs === 'p1' ? $player1.cardsDrawn : $player2.cardsDrawn}
        discards={gameState.playingAs === 'p1' ? $player1.discards : $player2.discards}
        player={gameState.playingAs === 'p1' ? $player1 : $player2}
        boostsBlocked={areBoostsBlocked(gameState.playingAs === 'p1' ? $player1 : $player2)}
        trapsBlocked={areTrapsBlocked(gameState.playingAs === 'p1' ? $player1 : $player2)}
        otherNeutralEffects={(gameState.playingAs === 'p1' ? $player2 : $player1).neutrals.filter(neutral => ['neutralize', 'switcharoo', 'ticktock', 'tocktick', 'xenoBloom', 'xenoBlossom'].includes(neutral))}
      />
    {/if}

    <!-- Gaze, remaining cards library -->
    {#if gameState.remainingCardsVisible}
      <RemainingCardsModal on:close={toggleRemainingCardsModal} {fullDeck} {deckTypes}/>
    {/if}

    <!-- Card Library -->
    <svg on:click={toggleLibraryVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="card-library-btn">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
    {#if gameState.libraryVisible}
      <Library />
    {/if}

    <!-- ai generated: Either player's badge opens the same ordered guide; closing it does not affect the game. -->
    {#if rankingsVisible}
      <RankingsModal ranks={eloRanks} on:close={() => rankingsVisible = false}/>
    {/if}

    <!-- Eng game view -->
    {#if gameState.winMessage}
      <div class="results-screen" transition:fade>
        <!-- Play again btn -->
        {#if !gameState.startBtnDisabled}
          <span class="play-again-btn">
            <Button on:click={async () => await readyUpPlayer()} round={true} customClasses="btn__green">
              {#if gameMode === 'multiplayer' && (($player1.isReady && !$player2.isReady) || ($player2.isReady && !$player1.isReady))}
                1/2
                <br>
              {:else if gameMode === 'multiplayer' && !$player1.isReady && !$player2.isReady}
                0/2
                <br>
              {/if}
              Rematch
            </Button>
          </span>
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
            <RacePoints player={$player1}/>

            <h2 class="results-player-floating-header results-player-float-left" class:color-yellow__bright={gameState.playingAs === 'p1'}>{$player1.title}</h2>
          </div>

          <div>
            {#if gameMode === 'multiplayer'}
              <!-- ai generated: These lifetime totals come from the shared CSV, not the resettable round stores. -->
              <p>{$player1.title} Win/Lose/Draw: {multiplayerRecords.p1.wins}/{multiplayerRecords.p1.losses}/{multiplayerRecords.p1.draws} · ELO: {multiplayerRecords.p1.elo}</p>
              <p class="margin-bottom-sm">{$player2.title} Win/Lose/Draw: {multiplayerRecords.p2.wins}/{multiplayerRecords.p2.losses}/{multiplayerRecords.p2.draws} · ELO: {multiplayerRecords.p2.elo}</p>
            {/if}
            
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
                    points={getCardPointsForDisplay($player1, card)}
                    modifiedPoints={displayCardPoints($player1, card)}
                    buffed={determineIfPointColorGreen($player1, card)}
                    reduced={determineIfPointColorRed($player1, card)}
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
                  points={getCardPointsForDisplay($player2, card)}
                  modifiedPoints={displayCardPoints($player2, card)}
                  buffed={determineIfPointColorGreen($player2, card)}
                  reduced={determineIfPointColorRed($player2, card)}
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
                <span>| XNO <span class="color-yellow">{$player1.points.xenos}</span></span>
                <span>| SPT <span class="color-pink">{$player1.points.spirits} </span>| </span>

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
                      {#if neutral !== 'leon'} <!-- Leon is weird here, it's more liek a raceless card than a neutral-->
                        <img src={displayBonusCardIcons(neutral)} alt={displayBonusCardIcons(neutral)} class="bonus-card-icon">
                      {/if}
                    {/each}
                  </div>
                </div>
              </div>
            {/if}

            <!-- ai generated: Own ELO sits below the editable name; the opponent's rating stays beside their name. -->
            <div class="player-nameplate" class:player-nameplate__own={gameState.playingAs === 'p1'}>
              {#if gameState.p1NameChangeVisible}
                <input bind:value={gameState.newPlayerTitle} on:blur={() => updateUsernameForOtherClient('p1')} type="text" maxlength="20"/>
              {:else}
                <p on:click={toggleP1NameChangeVisibility} class="p1-name {$player1.turn ? "turn-active" : ""}">{$player1.title}</p>
              {/if}
              {#if gameMode === 'multiplayer'}
                <span class="player-elo" class:player-elo__opponent={gameState.playingAs !== 'p1'}>
                  <!-- ai generated: The badge identifies this number as ELO; a pipe separates the opponent's inline rating from their name. -->
                  {gameState.playingAs === 'p1' ? '' : '| '}{multiplayerRecords.p1.elo}
                  {#if p1EloBadge}
                    <!-- ai generated: Only the badge is clickable, so rating text and editable player names keep their own actions. -->
                    <button class="elo-badge-button" type="button" aria-label="View rank badges and thresholds" title="View rankings" on:click={openRankings}>
                      <img class="elo-badge" src="/badges/{p1EloBadge}_badge.png" alt="" on:load={event => setBadgeImageVisibility(event, true)} on:error={event => setBadgeImageVisibility(event, false)}/>
                    </button>
                  {/if}
                </span>
              {/if}
            </div>
          </div>

          {#each $player1.hand as card}
            <GGCard
              on:cardClick={async () => await clickOnCard($player1, card)}
              on:contextmenu={() => openLibraryToCard($cardDetails[card].race)}        
              faceUp={isCardVisible('p1', card, $player2.hasVision, gameState.playersRevealed)}
              displayTitle={$cardDetails[card].displayTitle}
              title={$cardDetails[card].title}
              img={$cardDetails[card].image}
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
              race={$cardDetails[card].race}
              rarity={determineRarity($player1, card)}
              points={getCardPointsForDisplay($player1, card)}
              modifiedPoints={displayCardPoints($player1, card)}
              buffed={determineIfPointColorGreen($player1, card)}
              reduced={determineIfPointColorRed($player1, card)}
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
                <span>| XNO <span class="color-yellow">{$player2.points.xenos}</span></span>
                <span>| SPT <span class="color-pink">{$player2.points.spirits} </span>| </span>
                
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

            <!-- ai generated: The same nameplate works when multiplayer assigns either side to the local player. -->
            <div class="player-nameplate" class:player-nameplate__own={gameState.playingAs === 'p2'}>
              {#if gameState.p2NameChangeVisible}
                <input bind:value={gameState.newPlayerTitle} on:blur={() => updateUsernameForOtherClient('p2')} type="text" maxlength="20"/>
              {:else}
                <p on:click={toggleP2NameChangeVisibility} class="p2-name {$player2.turn ? "turn-active" : ""}">{$player2.title}</p>
              {/if}
              {#if gameMode === 'multiplayer'}
                <span class="player-elo" class:player-elo__opponent={gameState.playingAs !== 'p2'}>
                  {gameState.playingAs === 'p2' ? '' : '| '}{multiplayerRecords.p2.elo}
                  {#if p2EloBadge}
                    <button class="elo-badge-button" type="button" aria-label="View rank badges and thresholds" title="View rankings" on:click={openRankings}>
                      <img class="elo-badge" src="/badges/{p2EloBadge}_badge.png" alt="" on:load={event => setBadgeImageVisibility(event, true)} on:error={event => setBadgeImageVisibility(event, false)}/>
                    </button>
                  {/if}
                </span>
              {/if}
            </div>
          </div>
          {#each $player2.hand as card}
            <GGCard
              on:cardClick={async () => await clickOnCard($player2, card)}
              on:contextmenu={() => openLibraryToCard($cardDetails[card].race)}
              faceUp={isCardVisible('p2', card, $player1.hasVision, gameState.playersRevealed)}
              displayTitle={$cardDetails[card].displayTitle}
              title={$cardDetails[card].title}
              img={$cardDetails[card].image}
              trait={$cardDetails[card].trait}
              traitTitle={$cardDetails[card].traitTitle}
              description={$cardDetails[card].description}
              race={$cardDetails[card].race}
              rarity={determineRarity($player2, card)}
              points={getCardPointsForDisplay($player2, card)}
              modifiedPoints={displayCardPoints($player2, card)}
              buffed={determineIfPointColorGreen($player2, card)}
              reduced={determineIfPointColorRed($player2, card)}
            />
          {/each}
        </div>

        <div class="game-buttons">
          <h1 class="turn-count">Turn {gameState.turnCount}</h1>
          <GGCard on:click={async() => await clickOnDeck()} faceUp={false} />
          {#if !gameState.startBtnDisabled}
            <Button on:click={async () => await readyUpPlayer()} round={true} customClasses="btn__green">
              Ready
              {#if gameMode === 'multiplayer' && (($player1.isReady && !$player2.isReady) || ($player2.isReady && !$player1.isReady))}
                <br>
                1/2
              {:else if gameMode === 'multiplayer' && !$player1.isReady && !$player2.isReady}
                <br>
                0/2
              {/if}
            </Button>
          {:else if gameState.gobbledegookDisabled || gameState.turnCount < 15}
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

  .connected-users {
    z-index: 1;
    border-radius: 0.5rem;
    color: #d44215;
    border: 1px solid #d44215;
    stroke-width: 1.5;
    background-color: #0c0c0cd3;
    padding: 0.25rem;
    transition: all 0.15s ease-out;
    box-shadow: 0 4px 8px #d44215;
    display: flex;
    flex-direction: column;
    gap: 2px;

    position: absolute;
    top: 2px;
    left: 8px;

    // ai generated
    > p:first-of-type {
      padding-bottom: 4px;
      margin-bottom: 4px;
      border-bottom: 1px solid #d4421527;
    }

    > p.name-editable {
      cursor: pointer;

      &:hover {
        color: #9abd9d;
      }
    }

    .connected-name-input {
      width: 100%;
      min-width: 9rem;
      padding: 0.2rem 0.35rem;
      color: #fff0d2;
      border: 1px solid #d44215;
      border-radius: 0.25rem;
      background: #080808;
    }

    // ai generated
    .mode-select {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding-bottom: 0.35rem;
      margin-bottom: 0.25rem;
      border-bottom: 1px solid #d4421527;

      button {
        padding: 0;
        color: #a9a09d;
        border: 0;
        background: transparent;
        cursor: pointer;
      }

      button.active {
        color: #9abd9d;
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    }
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

  // ai generated: Keep the local rating beneath its name, but keep the other player's rating on one line.
  .player-nameplate {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    white-space: nowrap;
  }

  .player-nameplate__own {
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
  }

  .player-elo {
    color: #fff0d2;
    font-size: 0.85rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  // ai generated: A fixed-size art slot keeps each badge aligned with the number without moving card-score rows.
  .elo-badge {
    width: 1.35rem;
    height: 1.35rem;
    object-fit: contain;
    flex: none;
  }

  // ai generated: Leave the badge's small rank art unframed while making it keyboard- and mouse-clickable.
  .elo-badge-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid #fff0d2;
      outline-offset: 2px;
      border-radius: 0.25rem;
    }
  }

  .player-elo__opponent {
    color: #d9c4a5;
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
    z-index: 3;

    position: absolute;
    bottom: 30px;
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

  .color-pink {
    color: #b63bac;
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
    .card-library-btn, .card-discards-btn {
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
