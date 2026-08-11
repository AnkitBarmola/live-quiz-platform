function validateRegisterInput(req, res, next) {
  const { username, email, password } = req.body || {};
  const errors = [];

  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long.');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid email address.');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid registration input',
      details: errors,
    });
  }

  return next();
}

module.exports = {
  validateRegisterInput,
};