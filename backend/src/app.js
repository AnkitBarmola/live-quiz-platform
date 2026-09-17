const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ],
}));
app.use(express.json());

const authRoutes = require('./auth/auth.routes');
app.use('/api/auth', authRoutes);

const quizRoutes = require('./quizzes/quiz.routes');
app.use('/api/quizzes', quizRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Live Quiz Platform backend' });
});

module.exports = app;