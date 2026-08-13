const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

  
}

async function loginUser(email, password) {

  const result = await pool.query(
    'SELECT id, username, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Remove the password hash from the returned user object
  delete user.password_hash;

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
}

module.exports = { registerUser, loginUser };