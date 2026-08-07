'use strict';

/**
 * routes/auth.routes.js — Authentication Routes
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../validations/auth.validation');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
