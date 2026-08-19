const pool = require('../config/db');
const { generateRoomCode } = require('./quiz.utils');

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

module.exports = { createQuiz, addQuestion };