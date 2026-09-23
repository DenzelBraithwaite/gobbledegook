import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createRecordStore, normalizeName } from './playerRecords.js';

const users = {};
const readyPlayers = { p1: false, p2: false };
// ai generated: Only multiplayer connects here; the server owns names, records, and one result per round.
const playerNames = { p1: 'Player 1', p2: 'Player 2' };
const recordStore = createRecordStore(join(dirname(fileURLToPath(import.meta.url)), 'data', 'player-records.csv'));
let roundActive = false;
let roundEnding = false;
let roundRecorded = false;
let resultReporterId = '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = 6912;
const ip = '0.0.0.0'; // Listen on all network interfaces.
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins.
    methods: ["GET"], // Allow GET and POST methods.
  },
});

// Serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
  // Send a simple response for GET requests to the root path
  res.sendFile('index.html', {root: __dirname + '/public'});
});

// Log new users and list of users.
function logUsers() {
  console.log('\n|---------------Users--------------|');
  Object.entries(users).forEach(([key, value]) => console.log(`${key}: ID: ${value}`))
  console.log('-----------------------------------');
}

// Returns Bool if user limit of 2 is reached.
function userLimitReached() {
  if (Object.keys(users).length >= 2) return true;
}

function assignUsernames() {
  let username = '';
  if (userLimitReached()) {
    username = `Guest_${Math.floor(Math.random() * 100)}`;
    while (users[username]) username = `Guest_${Math.floor(Math.random() * 100)}`;
    if (!users['p1']) username = 'p1';
    if (!users['p2']) username = 'p2';
    return username;
  }

  const numOfUsers = Object.keys(users).length;
  username = 'p' + (numOfUsers + 1);
  if (users[username] && username === 'p1') username = 'p2';
  if (users[username] && username === 'p2') username = 'p1';
  return username;
}

io.on('connection', socket => {
  const username = assignUsernames();
  users[username] = socket.id;
  console.log(`\n${username} connected with ID:${users[username]}.`);
  const players = Object.entries(users).filter(([key, val]) => ['p1', 'p2'].includes(key));
  if (['p1', 'p2'].includes(username)) {
    io.emit('set-users', players);
    io.emit('player-names', playerNames);
    // ai generated: A client returning from singleplayer receives readiness that was set before it connected.
    socket.emit('player-readied-up', {
      player1: { isReady: readyPlayers.p1 },
      player2: { isReady: readyPlayers.p2 }
    });
    socket.emit('player-records', { p1: recordStore.get(playerNames.p1), p2: recordStore.get(playerNames.p2) });
  }

  // Remove users from list of users.
  socket.on('disconnect', () => {
    console.log(`\n${username} with ID:${users[username]} disconnected.`);
    delete users[username];
    if (username === 'p1' || username === 'p2') {
      readyPlayers[username] = false;
      // ai generated: A disconnected human invalidates any unfinished multiplayer round.
      if (!roundRecorded) roundActive = false;
      playerNames[username] = username === 'p1' ? 'Player 1' : 'Player 2';
      io.emit('player-names', playerNames);
      io.emit('player-records', { p1: recordStore.get(playerNames.p1), p2: recordStore.get(playerNames.p2) });
      // ai generated: Remaining clients immediately stop displaying a disconnected player as ready.
      io.emit('player-readied-up', {
        player1: { isReady: readyPlayers.p1 },
        player2: { isReady: readyPlayers.p2 }
      });
    }
    logUsers();
  });

  // For frontend, checks if other client is still connected.
  socket.on('check-connected-users', () => socket.broadcast.emit('check-connected-users-response'));

  // Start game
  socket.on('start-game', data => {
    // ai generated: A second start event must not reset the one-result guard for an active round.
    if (!['p1', 'p2'].includes(username) || roundActive) return;
    roundActive = true;
    roundEnding = false;
    roundRecorded = false;
    resultReporterId = '';
    readyPlayers.p1 = false;
    readyPlayers.p2 = false;
    socket.broadcast.emit('game-started', data);
  });

  // Ready up the player
  socket.on('ready-up-player', data => {
    if (username === 'p1') readyPlayers.p1 = data.player1.isReady;
    if (username === 'p2') readyPlayers.p2 = data.player2.isReady;
    // ai generated: Readiness is server-owned so late connections and mode switches see the same count.
    socket.broadcast.emit('player-readied-up', {
      player1: { isReady: readyPlayers.p1 },
      player2: { isReady: readyPlayers.p2 }
    });
  });

  // Change username / player title
  socket.on('username-changed', data => {
    if (!['p1', 'p2'].includes(username)) return;
    const name = normalizeName(data);
    if (!name) return;
    playerNames[username] = name;
    socket.broadcast.emit('update-username', name);
    io.emit('player-names', playerNames);
    // ai generated: Reading a name does not create a save; the first completed multiplayer game does.
    io.emit('player-records', { p1: recordStore.get(playerNames.p1), p2: recordStore.get(playerNames.p2) });
  });

  // Count turns
  socket.on('new-turn', () => socket.broadcast.emit('add-turn-count'));

  // Change turns
  socket.on('change-turns', data => io.emit('turn-changed', data));

  // Card drawn
  socket.on('draw-card', data => socket.broadcast.emit('card-drawn', data));

  // Swap hand
  socket.on('swap-hands', data => socket.broadcast.emit('hands-swapped', data));

  // Display event message like switcharoo
  socket.on('display-event', data => io.emit('event-displayed', data));

  // Neutralize deck
  socket.on('neutralize-deck', () => io.emit('deck-neutralized'));

  // Reveal both player hands
  socket.on('reveal-players', () => io.emit('players-revealed'));

  // Remove traps from both clients
  socket.on('eradicate-traps', () => io.emit('traps-eradicated'));

  // Update remainingLegendaries for both players
  socket.on('remove-remaining-legendary', data => io.emit('remaining-legendary-removed', data));

  // Update remainingXenoEggs for both players
  socket.on('remove-xeno-egg', data => io.emit('xeno-egg-removed', data));

  // Conceal both player hands
  socket.on('conceal-players', () => io.emit('players-concealed'));

  // Increase turn count
  socket.on('increase-turn-count', () => io.emit('turn-count-increased'));

  // Increase turn count
  socket.on('decrease-turn-count', () => io.emit('turn-count-decreased'));

  // Card discarded
  socket.on('discard-card', data => socket.broadcast.emit('card-discarded', data));

  // Gobbledegook declared
  socket.on('gdg-declared', () => io.emit('gdg-declared'));

  // Game ended
  socket.on('end-game', () => {
    if (!roundActive || roundEnding || !['p1', 'p2'].includes(username)) return;
    roundEnding = true;
    resultReporterId = socket.id;
    io.emit('game-ended', { reporterId: resultReporterId });
  });

  // ai generated: The declaring client reports final calculated scores once; duplicate end events cannot double-save.
  socket.on('record-game-result', scores => {
    if (!roundActive || !roundEnding || roundRecorded || socket.id !== resultReporterId) return;
    try {
      const records = recordStore.recordMatch(playerNames.p1, playerNames.p2, scores?.p1, scores?.p2);
      roundRecorded = true;
      roundActive = false;
      io.emit('player-records', records);
    } catch (error) {
      console.error('Could not save multiplayer record:', error);
      socket.emit('record-save-error');
    }
  });

  // Start updating xeno points, like 3 way handshake part 1
  socket.on('start-xeno-sync', data => socket.broadcast.emit('xeno-sync-started', data));

  // Finish updating xeno points
  socket.on('continue-xeno-sync', data => socket.broadcast.emit('finish-xeno-sync', data)); 

  // Log connected users in the server console.
  logUsers();
});

// Start the server
server.listen(port, ip, () => console.log(`Listening on port ${port} at IP ${ip}`));
