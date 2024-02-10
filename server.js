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
  res.sendFile('index.html', {root: __dirname + '/public'}); // Send a simple response for GET requests to the root path
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
    username = `Player ${numUsers + 1}`;
  } else {
    username = `Guest_${Math.floor(Math.random() * 100)}`;
    while (users[username]) username = `Guest_${Math.floor(Math.random() * 100)}`;
    if (!users['Player 1']) username = 'Player 1';
    if (!users['Player 2']) username = 'Player 2';
  }

  if (users[username] && username === 'Player 1') username = 'Player 2';
  if (users[username] && username === 'Player 2') username = 'Player 1';
  return username;
}

io.on('connection', socket => {
  const username = assignUsernames();
  users[username] = socket.id;
  console.log(`\n${username} connected.`);

  // Remove users from list of users.
  socket.on('disconnect', () => { 
    console.log(`\n${username} disconnected.`);
    delete users[username];
    logUsers();
  });

  // Start game
  socket.on('start-game', data => io.emit('start-game', data));

  // emit that client is ready to all clients
  logUsers();
  socket.on('client-ready', () => io.emit('set-users', users));

});

// Start the server
server.listen(port, ip, () => console.log(`Listening on port ${port} at IP ${ip}`));