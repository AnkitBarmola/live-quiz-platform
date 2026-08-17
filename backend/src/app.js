const express = require('express');

const app = express();

app.use(express.json());

const authRoutes = require('./auth/auth.routes');
app.use('/api/auth', authRoutes);

const quizRoutes = require('./quizzes/quiz.routes');
app.use('/api/quizzes', quizRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Live Quiz Platform backend' });
});

module.exports = app;