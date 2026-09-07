const express = require('express');
const router = express.Router();

const authenticateToken = require('../shared/middleware/authenticateToken');
const {
	validateCreateQuiz,
	validateAddQuestion,
} = require('../shared/middleware/validate');
const { create, addQuestionToQuiz, getQuiz } = require('./quiz.controller');

router.post('/', validateCreateQuiz, authenticateToken, create);
router.post('/:quizId/questions', authenticateToken, validateAddQuestion, addQuestionToQuiz);
router.get('/:quizId', authenticateToken, getQuiz);

module.exports = router;