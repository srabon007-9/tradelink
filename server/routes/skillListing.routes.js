'use strict';

/**
 * routes/skillListing.routes.js — Skill Listing Profile Routes
 *
 * GET    /api/skill-listings         → browse active listings (optional ?category=)
 * GET    /api/skill-listings/mine    → the logged-in user's own listings (any status)
 * GET    /api/skill-listings/:id     → single listing
 * POST   /api/skill-listings         → create a listing
 * PATCH  /api/skill-listings/:id     → update/manage a listing (owner only)
 * DELETE /api/skill-listings/:id     → delete a listing (owner only)
 */

const express = require('express');
const skillListingController = require('../controllers/skillListing.controller');
const { protect } = require('../middleware/auth');
const {
  validateCreateListing,
  validateUpdateListing,
  validateListingId,
} = require('../validations/skillListing.validation');

const router = express.Router();

router.get('/', skillListingController.getActiveListings);
router.get('/mine', protect, skillListingController.getMyListings);
router.get('/:id', validateListingId, skillListingController.getListing);

router.post('/', protect, validateCreateListing, skillListingController.createListing);
router.patch('/:id', protect, validateUpdateListing, skillListingController.updateListing);
router.delete('/:id', protect, validateListingId, skillListingController.deleteListing);

module.exports = router;
