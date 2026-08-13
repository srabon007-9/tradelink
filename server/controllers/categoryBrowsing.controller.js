'use strict';

/**
 * controllers/categoryBrowsing.controller.js — Category Browsing HTTP Layer
 */

const categoryBrowsingService = require('../services/categoryBrowsing.service');

const categoryBrowsingController = {
  // ─── GET /api/browse ──────────────────────────────────────────────────────────
  // Optional query: ?category=<slug|other>&search=<text>&sort=newest|oldest|price_asc|price_desc
  browse: async (req, res, next) => {
    try {
      const { category, search, sort } = req.query;

      const [categories, listings] = await Promise.all([
        categoryBrowsingService.getCategorySummary(),
        categoryBrowsingService.getListings({ category, search, sort }),
      ]);

      return res.status(200).json({
        success: true,
        data: { categories, listings },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = categoryBrowsingController;
