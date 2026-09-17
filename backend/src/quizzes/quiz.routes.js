const express = require('express');
const router = express.Router();

const authenticateToken = require('../shared/middleware/authenticateToken');
const {
	validateCreateQuiz,
	validateAddQuestion,
	validateJoinQuiz,
} = require('../shared/middleware/validate');
const {
	create,
	addQuestionToQuiz,
	getQuiz,
	start,
	endQuizHandler,
	join,
} = require('./quiz.controller');

router.post('/', validateCreateQuiz, authenticateToken, create);
router.post('/:quizId/questions', authenticateToken, validateAddQuestion, addQuestionToQuiz);
router.post('/:quizId/start', authenticateToken, start);
router.post('/:quizId/end', authenticateToken, endQuizHandler);
router.post('/join', validateJoinQuiz, join);
router.get('/:quizId', authenticateToken, getQuiz);

module.exports = router;