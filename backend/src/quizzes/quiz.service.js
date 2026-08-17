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

module.exports = { createQuiz };