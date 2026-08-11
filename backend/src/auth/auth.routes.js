const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { validateRegisterInput } = require('../shared/middleware/validate');

router.post('/register', validateRegisterInput, controller.register);
router.post('/login', controller.login);

module.exports = router;
