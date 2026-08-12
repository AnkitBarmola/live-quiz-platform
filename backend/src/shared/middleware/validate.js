const validator = require('validator');

function validateRegisterInput(req, res, next) {
  const { username, email, password } = req.body || {};
  const errors = [];

  // Type check: username must be a string
  if (typeof username !== 'string') {
    errors.push('Username must be a string.');
  } else if (username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long.');
  }

  // Type check: email must be a string
  // Using validator.isEmail() instead of hand-rolled regex for robustness.
  // Email validation is a known complexity trap (RFCs 5321/5322). Battle-tested
  // library beats hand-rolled regex that may miss edge cases.
  if (typeof email !== 'string') {
    errors.push('Email must be a string.');
  } else if (!validator.isEmail(email)) {
    errors.push('Email must be a valid email address.');
  }

  // Type check: password must be a string
  if (typeof password !== 'string') {
    errors.push('Password must be a string.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
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