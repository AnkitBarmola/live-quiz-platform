const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function registerUser(username, email, password) {
  // 1. hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 2. insert into DB using a parameterized query
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
    [username, email, hashedPassword]
  );

  // 3. return the newly created user row
  return result.rows[0];

  // (duplicate-key handling happens in the CONTROLLER's try/catch, not here —
  //  the DB will throw error code 23505 if username or email already exists,
  //  and the controller's try/catch interprets that and returns 409 Conflict)
}

module.exports = { registerUser };