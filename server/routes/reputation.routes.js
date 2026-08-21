'use strict';

/**
 * routes/reputation.routes.js — Reputation Score & Review Routes
 *
 * GET  /api/reputation/me          → own reputation (auth required)
 * GET  /api/reputation/leaderboard → top 10 users by score (public)
 * GET  /api/reputation/:userId     → any user's public reputation
 * POST /api/reputation/reviews     → submit a review (auth required)
 */

const express              = require('express');
const { protect }          = require('../middleware/auth');
const reputationController = require('../controllers/reputation.controller');

const router = express.Router();

// Auth-protected routes first (before :userId catch-all)
router.get('/me',          protect, reputationController.getMyReputation);
router.get('/leaderboard',          reputationController.getLeaderboard);
router.post('/reviews',    protect, reputationController.submitReview);

// Public parameterized route (must be last)
router.get('/:userId',              reputationController.getUserReputation);

module.exports = router;
