const express = require('express');

const app = express();

app.use(express.json());

const authRoutes = require('./auth/auth.routes');
app.use('/api/auth', authRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Live Quiz Platform backend' });
});

module.exports = app;