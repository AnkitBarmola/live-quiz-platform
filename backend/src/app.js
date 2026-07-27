const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Live Quiz Platform backend' });
});

// Mount auth routes if present
try {
  const authRoutes = require('./auth/auth.routes');
  app.use('/auth', authRoutes);
} catch (err) {
  // ignore if auth routes not implemented yet
}

module.exports = app;
