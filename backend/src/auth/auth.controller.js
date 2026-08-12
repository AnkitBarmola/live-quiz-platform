const { registerUser } = require('./auth.service');

async function register(req, res) {
  const { username, email, password } = req.body;

  try {
    const user = await registerUser(username, email, password);
    return res.status(201).json({ user });
  } catch (err) {
    if (err.code === '23505') { // <- verify this is the right code, look it up
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { register };