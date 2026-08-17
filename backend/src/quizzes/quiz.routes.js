const express = require('express');
const router = express.Router();

const authenticateToken = require('../shared/middleware/authenticateToken');
const { validateCreateQuiz } = require('../shared/middleware/validate');
const { create } = require('./quiz.controller');

router.post('/', validateCreateQuiz, authenticateToken, create);

module.exports = router;