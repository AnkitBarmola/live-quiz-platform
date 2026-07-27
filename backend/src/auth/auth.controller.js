const authService = require('./auth.service');

module.exports = {
  register: async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const hash = await authService.hashPassword(password);
    // NOTE: This is a stub. Persist the user to your DB instead.
    return res.status(201).json({ username, passwordHash: hash });
  },

  login: async (_req, res) => {
    return res.status(501).json({ error: 'not implemented' });
  },
};
