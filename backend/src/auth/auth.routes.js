const express = require('express');
const router = express.Router();

const { validateRegisterInput } = require('../shared/middleware/validate'); 
const { register } = require('./auth.controller');

router.post('/register', validateRegisterInput, register);

module.exports = router;