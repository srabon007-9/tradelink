'use strict';

/**
 * controllers/valuation.controller.js — Dynamic Valuation Engine HTTP Layer
 */

const SkillCategory      = require('../models/SkillCategory.model');
const ValuationSnapshot  = require('../models/ValuationSnapshot.model');
const valuationService   = require('../services/valuation.service');
const ApiError           = require('../utils/ApiError');

const valuationController = {

  // ─── GET /api/valuations ────────────────────────────────────────────────────
  // All categories sorted by credit value (highest first)
  getAllCategories: async (req, res, next) => {
    try {
      const categories = await SkillCategory.find()
        .sort({ creditValue: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/valuations/:slug ──────────────────────────────────────────────
  // Single category with its last 50 valuation snapshots for charting
  getCategory: async (req, res, next) => {
    try {
      const category = await SkillCategory.findOne({ slug: req.params.slug }).lean();
      if (!category) throw ApiError.notFound(`Skill category '${req.params.slug}' not found`);

      const history = await ValuationSnapshot
        .find({ category: category._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('-__v')
        .lean();

      return res.status(200).json({
        success: true,
        data: { category, history },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /api/valuations/recalculate ──────────────────────────────────────
  // Manually trigger a full recalculation of all categories (admin / testing)
  recalculateAll: async (req, res, next) => {
    try {
      await valuationService.recalculateAll('manual');
      const categories = await SkillCategory.find().sort({ creditValue: -1 }).lean();

      return res.status(200).json({
        success: true,
        message: `All ${categories.length} categories recalculated`,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/valuations/:slug/supply ────────────────────────────────────
  // Provider went active (+1) or inactive (-1) for this skill
  // Body: { delta: 1 | -1 }
  updateSupply: async (req, res, next) => {
    try {
      const { delta } = req.body;

      if (delta !== 1 && delta !== -1) {
        throw ApiError.unprocessable('delta must be exactly 1 (provider joined) or -1 (provider left)');
      }

      const { category, result } = await valuationService.updateSupply(req.params.slug, delta);

      return res.status(200).json({
        success: true,
        message: `Supply ${delta > 0 ? 'increased' : 'decreased'}. Price recalculated.`,
        data: {
          slug:        category.slug,
          supply:      category.supply,
          demand:      category.demand,
          priceBDT:    category.priceBDT,
          explanation: result.explanation,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/valuations/:slug/demand ────────────────────────────────────
  // A service request was opened (+1) or closed/cancelled (-1)
  // Body: { delta: 1 | -1 }
  updateDemand: async (req, res, next) => {
    try {
      const { delta } = req.body;

      if (delta !== 1 && delta !== -1) {
        throw ApiError.unprocessable('delta must be exactly 1 (request opened) or -1 (request closed)');
      }

      const { category, result } = await valuationService.updateDemand(req.params.slug, delta);

      return res.status(200).json({
        success: true,
        message: `Demand ${delta > 0 ? 'increased' : 'decreased'}. Price recalculated.`,
        data: {
          slug:        category.slug,
          supply:      category.supply,
          demand:      category.demand,
          priceBDT:    category.priceBDT,
          explanation: result.explanation,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = valuationController;
