require('dotenv').config();

const jwt = require('jsonwebtoken');
const pool = require('./config/db');

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const redisClient = require('./config/redis');
const { startQuestion, submitAnswer, getLeaderboard } = require('./quizzes/quiz.service');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', async (socket) => {
  const { token, participantId, quizId } = socket.handshake.auth;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.hostId = decoded.id;
      socket.join(quizId.toString());
      console.log(`Host ${decoded.id} joined room ${quizId}`);
    } catch (err) {
      socket.emit('auth-error', { message: 'Invalid or expired token' });
      socket.disconnect();
      return;
    }
  } else if (participantId && quizId) {
    try {
      const result = await pool.query(
        'SELECT id FROM quiz_participants WHERE id = $1 AND quiz_id = $2',
        [participantId, quizId]
      );
      if (result.rows.length === 0) {
        socket.emit('auth-error', { message: 'Invalid participant or quiz' });
        socket.disconnect();
        return;
      }
      socket.participantId = participantId;
      socket.join(quizId.toString());
      console.log(`Participant ${participantId} joined room ${quizId}`);
      socket.to(quizId.toString()).emit('player-joined', { participantId });
    } catch (err) {
      console.error(err);
      socket.disconnect();
      return;
    }
  } else {
    socket.emit('auth-error', { message: 'Missing credentials' });
    socket.disconnect();
    return;
  }

  socket.on('host:start-question', async ({ quizId, questionId }) => {
    if (!socket.hostId) return;

    try {
      const question = await startQuestion(quizId, questionId);
      io.to(quizId.toString()).emit('question:started', question);
    } catch (err) {
      socket.emit('error-event', { message: err.message });
    }
  });

  socket.on('player:submit-answer', async ({ quizId, questionId, selectedOption }) => {
    if (!socket.participantId) return;

    try {
      const result = await submitAnswer(quizId, socket.participantId, questionId, selectedOption);
      socket.emit('answer:result', result);

      const leaderboard = await getLeaderboard(quizId);
      io.to(quizId.toString()).emit('leaderboard:update', leaderboard);
    } catch (err) {
      socket.emit('error-event', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});