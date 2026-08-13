'use strict';

/**
 * routes/categoryBrowsing.routes.js — Category Browsing Routes
 *
 * GET /api/browse  → { categories, listings }
 *   categories — all skill categories with their live price + active listing count
 *   listings   — active listings, filtered/sorted by ?category, ?search, ?sort
 */

const express = require('express');
const categoryBrowsingController = require('../controllers/categoryBrowsing.controller');
const { validateBrowseQuery } = require('../validations/categoryBrowsing.validation');

const router = express.Router();

router.get('/', validateBrowseQuery, categoryBrowsingController.browse);

module.exports = router;
