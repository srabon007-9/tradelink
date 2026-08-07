'use strict';

/**
 * routes/user.routes.js — User Routes
 */

const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

// GET /api/users — list all members
router.get('/', userController.getUsers);

// GET /api/users/:id — single member public profile
router.get('/:id', userController.getUser);

module.exports = router;
