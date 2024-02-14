// TODO: Limit to 2 users

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const users = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = 6912;
const ip = '0.0.0.0'; // Listen on all network interfaces.
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins.
    methods: ["GET", "POST"], // Allow GET and POST methods.
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
  const numUsers = Object.keys(users).length;
  let username = '';
  if (numUsers < 2) {
    username = 'p' + (numUsers + 1);
    if (users[username] && username === 'p1') username = 'p2';
    if (users[username] && username === 'p2') username = 'p1';
  } else {
    username = `Guest_${Math.floor(Math.random() * 100)}`;
    while (users[username]) username = `Guest_${Math.floor(Math.random() * 100)}`;
    if (!users['p1']) username = 'p1';
    if (!users['p2']) username = 'p2';
  }

  return username;
}

io.on('connection', socket => {
  const username = assignUsernames();
  users[username] = socket.id;
  console.log(`\n${username} connected.`);
  
  // emit that client is ready to all clients
  socket.on('client-ready', () => io.emit('set-users', users));

  // Remove users from list of users.
  socket.on('disconnect', () => {
    console.log(`\n${username} disconnected.`);
    delete users[username];
    logUsers();
  });

  // Start game
  socket.on('start-game', data => socket.broadcast.emit('game-started', data));

  // Change turns
  socket.on('change-turns', data => io.emit('turn-changed', data));

  // Card drawn
  socket.on('draw-card', data => socket.broadcast.emit('card-drawn', data));

  // Card discarded
  socket.on('discard-card', data => socket.broadcast.emit('card-discarded', data));

  // Gobbledegook declared
  socket.on('gdg-declared', () => socket.broadcast.emit('gdg-declared'));

  // Game ended
  socket.on('end-game', data => io.emit('game-ended', data));

  // Log connected users in the server console.
  logUsers();
});

// Start the server
server.listen(port, ip, () => console.log(`Listening on port ${port} at IP ${ip}`));