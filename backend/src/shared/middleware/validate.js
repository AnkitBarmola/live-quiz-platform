const validator = require('validator');

function validateRegisterInput(req, res, next) {
  const { username, email, password } = req.body || {};
  const errors = [];

  if (typeof username !== 'string') {
    errors.push('Username must be a string.');
  } else if (username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long.');
  }

  if (typeof email !== 'string') {
    errors.push('Email must be a string.');
  } else if (!validator.isEmail(email)) {
    errors.push('Email must be a valid email address.');
  }

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

function validateLoginInput(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (typeof email !== 'string') {
    errors.push('Email must be a string.');
  } else if (!validator.isEmail(email)) {
    errors.push('Email must be a valid email address.');
  }

  if (typeof password !== 'string') {
    errors.push('Password must be a string.');
  } else if (password.length === 0) {
    errors.push('Password cannot be empty.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid login input',
      details: errors,
    });
  }

  return next();
}

function validateCreateQuiz(req, res, next) {
  const { title, description } = req.body || {};
  const errors = [];

  if (typeof title !== 'string') {
    errors.push('Title must be a string.');
  } else if (title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long.');
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push('Description must be a string.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid quiz input',
      details: errors,
    });
  }

  return next();
}

function validateAddQuestion(req, res, next) {
  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
  } = req.body || {};
  const errors = [];

  if (typeof question_text !== 'string' || question_text.trim().length === 0) {
    errors.push('Question text is required.');
  }

  const options = { option_a, option_b, option_c, option_d };
  for (const [key, value] of Object.entries(options)) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`${key} is required.`);
    }
  }

  if (
    typeof correct_option !== 'string' ||
    !['A', 'B', 'C', 'D'].includes(correct_option)
  ) {
    errors.push('correct_option must be one of A, B, C, D.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid question input',
      details: errors,
    });
  }

  return next();
}

function validateJoinQuiz(req, res, next) {
  const { roomCode, displayName } = req.body || {};
  const errors = [];

  if (typeof roomCode !== 'string' || roomCode.trim().length === 0) {
    errors.push('Room code is required.');
  }

  if (typeof displayName !== 'string' || displayName.trim().length === 0) {
    errors.push('Display name is required.');
  } else if (displayName.trim().length > 50) {
    errors.push('Display name must be 50 characters or fewer.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid join input',
      details: errors,
    });
  }

  return next();
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateCreateQuiz,
  validateAddQuestion,
  validateJoinQuiz,
};