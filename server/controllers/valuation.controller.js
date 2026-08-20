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
        .sort({ priceBDT: -1 })
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
      if (!category) {throw ApiError.notFound(`Skill category '${req.params.slug}' not found`);}

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
      const categories = await SkillCategory.find().sort({ priceBDT: -1 }).lean();

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

  // ─── GET /api/valuations/:slug/history ──────────────────────────────────────
  // Historical price data for charting, with trend analysis and market signal.
  // Query: ?range=24h|7d|30d|all (default: 7d)
  getCategoryHistory: async (req, res, next) => {
    try {
      const { slug } = req.params;
      const range    = req.query.range || '7d';

      // Resolve the category
      const category = await SkillCategory.findOne({ slug }).lean();
      if (!category) {throw ApiError.notFound(`Skill category '${slug}' not found`);}

      // Build date filter based on range
      const now = new Date();
      let dateFilter = {};

      switch (range) {
        case '24h':
          dateFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
          break;
        case '7d':
          dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
          break;
        case '30d':
          dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
          break;
        case 'all':
        default:
          dateFilter = {};
          break;
      }

      // Query snapshots sorted chronologically (oldest first for chart rendering)
      const snapshots = await ValuationSnapshot
        .find({ categorySlug: slug, ...dateFilter })
        .sort({ createdAt: 1 })
        .select('priceBDT supply demand ratio explanation createdAt')
        .lean();

      // Map to chart-friendly data points
      const dataPoints = snapshots.map(s => ({
        timestamp:   s.createdAt.toISOString(),
        priceBDT:    s.priceBDT,
        supply:      s.supply,
        demand:      s.demand,
        ratio:       s.ratio,
        explanation: s.explanation || '',
      }));

      // Compute trend from first vs last data point
      let trendPercent   = 0;
      let trendDirection = 'stable';
      let marketSignal   = '→ Market is stable for this skill.';

      if (dataPoints.length >= 2) {
        const firstPrice = dataPoints[0].priceBDT;
        const lastPrice  = dataPoints[dataPoints.length - 1].priceBDT;

        if (firstPrice > 0) {
          trendPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
          trendPercent = Math.round(trendPercent * 10) / 10;
        }

        if (trendPercent > 0.5)       {trendDirection = 'up';}
        else if (trendPercent < -0.5)  {trendDirection = 'down';}
        else                           {trendDirection = 'stable';}

        // Generate market signal text
        if (trendPercent > 15) {
          marketSignal = '💡 Demand is surging for this skill. Great time to offer it!';
        } else if (trendPercent > 5) {
          marketSignal = '📈 This skill\'s value is rising. Consider offering it soon.';
        } else if (trendPercent < -15) {
          marketSignal = '📉 Demand is falling. May be a good time to request this skill at a lower cost.';
        } else if (trendPercent < -5) {
          marketSignal = '⚠️ This skill\'s credit value is declining slightly.';
        } else {
          marketSignal = '→ Market is stable for this skill.';
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          category: { name: category.name, slug: category.slug },
          dataPoints,
          trendPercent,
          trendDirection,
          marketSignal,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/valuations/compare ────────────────────────────────────────────
  // Compare historical prices for up to 3 skill categories side by side.
  // Query: ?slugs=web-development,graphic-design&range=7d
  compareCategories: async (req, res, next) => {
    try {
      const { slugs, range } = req.query;

      if (!slugs) {
        throw ApiError.badRequest('slugs query parameter is required (comma-separated)');
      }

      const slugList = slugs.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);

      if (slugList.length < 1) {
        throw ApiError.badRequest('At least one slug is required');
      }

      // Build date filter
      const now = new Date();
      let dateFilter = {};
      const r = range || '7d';

      switch (r) {
        case '24h':
          dateFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
          break;
        case '7d':
          dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
          break;
        case '30d':
          dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
          break;
        case 'all':
        default:
          dateFilter = {};
          break;
      }

      // Fetch all categories and their histories in parallel
      const datasets = await Promise.all(
        slugList.map(async (slug) => {
          const category = await SkillCategory.findOne({ slug }).lean();
          if (!category) {return null;}

          const snapshots = await ValuationSnapshot
            .find({ categorySlug: slug, ...dateFilter })
            .sort({ createdAt: 1 })
            .select('priceBDT supply demand createdAt')
            .lean();

          const dataPoints = snapshots.map(s => ({
            timestamp: s.createdAt.toISOString(),
            priceBDT:  s.priceBDT,
            supply:    s.supply,
            demand:    s.demand,
          }));

          // Trend calculation
          let trendPercent   = 0;
          let trendDirection = 'stable';

          if (dataPoints.length >= 2) {
            const first = dataPoints[0].priceBDT;
            const last  = dataPoints[dataPoints.length - 1].priceBDT;
            if (first > 0) {
              trendPercent = Math.round(((last - first) / first) * 100 * 10) / 10;
            }
            trendDirection = trendPercent > 0.5 ? 'up' : trendPercent < -0.5 ? 'down' : 'stable';
          }

          return {
            slug,
            name: category.name,
            dataPoints,
            trendPercent,
            trendDirection,
          };
        })
      );

      // Filter out null entries (categories not found)
      const validDatasets = datasets.filter(Boolean);

      return res.status(200).json({
        success: true,
        data: { datasets: validDatasets },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = valuationController;
