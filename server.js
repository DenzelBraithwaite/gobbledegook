import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow GET and POST methods
  },
});

io.on('connection', socket => {
  socket.on('message', message => {
    // Broadcast the message to all other connected clients
    socket.broadcast.emit('message', message);
  });

  socket.on('start-game', data => {
    // Broadcast the message to all other connected clients
    socket.broadcast.emit('start-game', data);
  });
});

server.listen(6912, () => console.log('Listening on port 6912'));