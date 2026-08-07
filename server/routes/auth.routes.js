/**
 * routes/auth.routes.js — Authentication Routes
 *
 * TODO (Member 1 — Backend):
 *  - POST /api/auth/register
 *  - POST /api/auth/login
 *  - POST /api/auth/logout
 *  - POST /api/auth/refresh-token
 *  - POST /api/auth/forgot-password
 *  - PATCH /api/auth/reset-password/:token
 *  - GET  /api/auth/verify-email/:token
 */

'use strict';

const express = require('express');
// const authController = require('../controllers/auth.controller');
// const { validateRegister, validateLogin } = require('../validations/auth.validation');

const router = express.Router();

// Routes will be implemented in the auth feature sprint.
// Example structure (DO NOT uncomment until implementing):
// router.post('/register', validateRegister, authController.register);
// router.post('/login', validateLogin, authController.login);
// router.post('/logout', protect, authController.logout);

module.exports = router;
