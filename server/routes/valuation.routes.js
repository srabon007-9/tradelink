'use strict';

/**
 * routes/valuation.routes.js — Dynamic Valuation Engine Routes
 *
 * GET  /api/valuations              → all categories with live credit values
 * GET  /api/valuations/:slug        → single category + valuation history
 * POST /api/valuations/recalculate  → manually trigger full recalculation
 * PATCH /api/valuations/:slug/supply → update provider count (delta: 1|-1)
 * PATCH /api/valuations/:slug/demand → update request count (delta: 1|-1)
 */

const express              = require('express');
const valuationController  = require('../controllers/valuation.controller');

const router = express.Router();

router.get('/',                         valuationController.getAllCategories);
router.post('/recalculate',             valuationController.recalculateAll);
router.get('/:slug',                    valuationController.getCategory);
router.patch('/:slug/supply',           valuationController.updateSupply);
router.patch('/:slug/demand',           valuationController.updateDemand);

module.exports = router;
