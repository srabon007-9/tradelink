'use strict';

/**
 * routes/user.routes.js — User Routes
 */

const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { validateUpdateProfile } = require('../validations/user.validation');

const router = express.Router();

// GET /api/users — list all members
router.get('/', userController.getUsers);

// PATCH /api/users/profile — update authenticated user profile
router.patch('/profile', protect, validateUpdateProfile, userController.updateProfile);

// GET /api/users/:id — single member public profile
router.get('/:id', userController.getUser);

module.exports = router;
