'use strict';

/**
 * routes/watchlist.routes.js — Watchlist Routes
 *
 * GET    /api/watchlist/mine          → my watches, with each category's live price attached
 * POST   /api/watchlist               → add a category to my watchlist
 * PATCH  /api/watchlist/:id/reactivate→ resume checking a triggered watch
 * DELETE /api/watchlist/:id           → remove a watch
 */

const express = require('express');
const watchlistController = require('../controllers/watchlist.controller');
const { protect } = require('../middleware/auth');
const { validateCreateWatch, validateWatchId } = require('../validations/watchlist.validation');

const router = express.Router();

router.get('/mine', protect, watchlistController.getMine);
router.post('/', protect, validateCreateWatch, watchlistController.create);
router.patch('/:id/reactivate', protect, validateWatchId, watchlistController.reactivate);
router.delete('/:id', protect, validateWatchId, watchlistController.remove);

module.exports = router;
