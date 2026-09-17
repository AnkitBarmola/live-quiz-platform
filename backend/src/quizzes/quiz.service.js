const pool = require('../config/db');
const redisClient = require('../config/redis');
const { generateRoomCode, QUESTION_TIME_LIMIT_MS } = require('./quiz.utils');

async function createQuiz(hostId, title, description) {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode();
    try {
      const result = await pool.query(
        'INSERT INTO quizzes (host_id, title, description, room_code) VALUES ($1, $2, $3, $4) RETURNING *',
        [hostId, title, description, roomCode]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505' && attempt < MAX_ATTEMPTS - 1) {
        continue;
      }
      throw err;
    }
  }
}

async function addQuestion(quizId, hostId, questionData) {
  const quizResult = await pool.query(
    'SELECT id FROM quizzes WHERE id = $1 AND host_id = $2',
    [quizId, hostId]
  );

  if (quizResult.rows.length === 0) {
    throw new Error('Not authorized to modify this quiz');
  }

  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
  } = questionData;

  const questionResult = await pool.query(
    `INSERT INTO questions
      (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
    [quizId, question_text, option_a, option_b, option_c, option_d, correct_option]
  );

  return questionResult.rows[0];
}

async function startQuiz(quizId, hostId) {
  const quizResult = await pool.query(
    'SELECT id FROM quizzes WHERE id = $1 AND host_id = $2',
    [quizId, hostId]
  );

  if (quizResult.rows.length === 0) {
    throw new Error('Not authorized to modify this quiz');
  }

  const questionResult = await pool.query(
    'SELECT id FROM questions WHERE quiz_id = $1 LIMIT 1',
    [quizId]
  );

  if (questionResult.rows.length === 0) {
    throw new Error('Quiz must have at least one question');
  }

  const startedQuizResult = await pool.query(
    "UPDATE quizzes SET status = 'active', started_at = NOW() WHERE id = $1 RETURNING *",
    [quizId]
  );

  return startedQuizResult.rows[0];
}

async function endQuiz(quizId, hostId) {
  const quizResult = await pool.query(
    'SELECT id FROM quizzes WHERE id = $1 AND host_id = $2',
    [quizId, hostId]
  );

  if (quizResult.rows.length === 0) {
    throw new Error('Not authorized to modify this quiz');
  }

  const endedQuizResult = await pool.query(
    "UPDATE quizzes SET status = 'ended', ended_at = NOW() WHERE id = $1 RETURNING *",
    [quizId]
  );

  await redisClient.del(`quiz:${quizId}:activeQuestion`);

  return endedQuizResult.rows[0];
}

async function joinQuiz(roomCode, displayName) {
  const quizResult = await pool.query(
    'SELECT id, status FROM quizzes WHERE LOWER(room_code) = LOWER($1)',
    [roomCode]
  );

  if (quizResult.rows.length === 0) {
    throw new Error('Quiz not found');
  }

  const quiz = quizResult.rows[0];
  if (quiz.status === 'ended') {
    throw new Error('Quiz is not accepting participants');
  }

  const participantResult = await pool.query(
    'INSERT INTO quiz_participants (quiz_id, display_name) VALUES ($1, $2) RETURNING *',
    [quiz.id, displayName]
  );

  return participantResult.rows[0];
}

async function getQuizWithQuestions(quizId, hostId) {
  const quizResult = await pool.query(
    'SELECT id, host_id, title, description, room_code, status, created_at FROM quizzes WHERE id = $1 AND host_id = $2',
    [quizId, hostId]
  );

  if (quizResult.rows.length === 0) {
    throw new Error('Not authorized to view this quiz');
  }

  const questionsResult = await pool.query(
    'SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option FROM questions WHERE quiz_id = $1 ORDER BY id ASC',
    [quizId]
  );

  const quiz = quizResult.rows[0];
  quiz.questions = questionsResult.rows;
  return quiz;
}

async function startQuestion(quizId, questionId) {
  const result = await pool.query(
    'SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option FROM questions WHERE id = $1 AND quiz_id = $2',
    [questionId, quizId]
  );

  if (result.rows.length === 0) {
    throw new Error('Question not found');
  }

  const question = result.rows[0];
  const startTime = Date.now();

  await redisClient.hSet(`quiz:${quizId}:activeQuestion`, {
    questionId: question.id.toString(),
    correctOption: question.correct_option,
    startTime: startTime.toString(),
  });

  const { correct_option, ...safeQuestion } = question;
  return safeQuestion;
}

async function submitAnswer(quizId, participantId, questionId, selectedOption) {
  const activeQuestion = await redisClient.hGetAll(`quiz:${quizId}:activeQuestion`);

  if (!activeQuestion.questionId || activeQuestion.questionId !== questionId.toString()) {
    throw new Error('No active question or question mismatch');
  }

  const alreadyAnsweredKey = `quiz:${quizId}:question:${questionId}:answered`;
  const alreadyAnswered = await redisClient.sIsMember(
    alreadyAnsweredKey,
    participantId.toString()
  );
  if (alreadyAnswered) {
    throw new Error('Already answered this question');
  }
  await redisClient.sAdd(alreadyAnsweredKey, participantId.toString());

  const startTime = parseInt(activeQuestion.startTime, 10);
  const elapsed = Math.min(Date.now() - startTime, QUESTION_TIME_LIMIT_MS);
  const isCorrect =
    elapsed < QUESTION_TIME_LIMIT_MS && selectedOption === activeQuestion.correctOption;

  const points = isCorrect
    ? 100 + Math.floor(100 * (1 - elapsed / QUESTION_TIME_LIMIT_MS))
    : 0;

  await pool.query(
    `INSERT INTO answers
      (quiz_id, participant_id, question_id, selected_option, is_correct, response_time_ms, points_awarded)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [quizId, participantId, questionId, selectedOption, isCorrect, elapsed, points]
  );

  if (points > 0) {
    await redisClient.zIncrBy(`quiz:${quizId}:leaderboard`, points, participantId.toString());
  }

  return { isCorrect, points };
}

async function getLeaderboard(quizId) {
  const raw = await redisClient.zRangeWithScores(
    `quiz:${quizId}:leaderboard`,
    0,
    -1,
    { REV: true }
  );

  return raw.map((entry) => ({
    participantId: entry.value,
    score: entry.score,
  }));
}

module.exports = {
  createQuiz,
  addQuestion,
  startQuiz,
  endQuiz,
  joinQuiz,
  getQuizWithQuestions,
  startQuestion,
  submitAnswer,
  getLeaderboard,
};