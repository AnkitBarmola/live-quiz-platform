require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // tighten this later once you have a real frontend URL
  },
});

io.on('connection', (socket) => {
  const { participantId, quizId } = socket.handshake.auth;

  if (quizId) {
    socket.join(quizId.toString());
    console.log(`Socket ${socket.id} joined room ${quizId}`);

    // Notify everyone else in the room (not this socket) that someone joined
    socket.to(quizId.toString()).emit('player-joined', { participantId });
  }

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});