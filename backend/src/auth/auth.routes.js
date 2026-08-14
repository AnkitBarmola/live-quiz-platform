const express = require('express');
const router = express.Router();

const { validateRegisterInput, validateLoginInput } = require('../shared/middleware/validate'); 
const { register, login } = require('./auth.controller');

router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);

module.exports = router;