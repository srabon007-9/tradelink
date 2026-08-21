'use strict';

/**
 * services/watchlist.service.js — Watchlist
 *
 * CRUD for a user's personal watchlist. The actual threshold-checking and
 * email-notification trigger lives in jobs/watchlistCron.js — this file
 * is only data management (add / list / reactivate / remove).
 */

const Watchlist = require('../models/Watchlist.model');
const SkillCategory = require('../models/SkillCategory.model');
const ApiError = require('../utils/ApiError');

const watchlistService = {
  /** Add a category to the user's watchlist. */
  createWatch: async (userId, { category, condition, thresholdBDT }) => {
    const categoryDoc = await SkillCategory.findOne({ slug: category });
    if (!categoryDoc) {
      throw ApiError.badRequest(
        `'${category}' is not a known skill category — choose one of the listed categories`
      );
    }

    try {
      return await Watchlist.create({
        user: userId,
        category: categoryDoc.slug,
        condition,
        thresholdBDT,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw ApiError.conflict('You already have this exact watch (category, condition, and threshold) saved.');
      }
      throw err;
    }
  },

  /** All of the user's watches, with each category's current live price attached. */
  getMyWatches: async userId => {
    const watches = await Watchlist.find({ user: userId }).sort({ createdAt: -1 }).lean();
    if (watches.length === 0) {return [];}

    const slugs = [...new Set(watches.map(w => w.category))];
    const categories = await SkillCategory.find({ slug: { $in: slugs } })
      .select('slug name priceBDT')
      .lean();
    const bySlug = categories.reduce((acc, c) => {
      acc[c.slug] = c;
      return acc;
    }, {});

    return watches.map(w => ({
      ...w,
      categoryName: bySlug[w.category]?.name || w.category,
      currentPriceBDT: bySlug[w.category]?.priceBDT ?? null,
    }));
  },

  /** Reactivate a triggered watch so it resumes checking. */
  reactivateWatch: async (id, userId) => {
    const watch = await Watchlist.findById(id);
    if (!watch) {throw ApiError.notFound('Watch not found');}
    if (watch.user.toString() !== userId) {
      throw ApiError.forbidden('You can only manage your own watchlist');
    }
    if (watch.status !== 'triggered') {
      throw ApiError.badRequest('Only a triggered watch can be reactivated');
    }

    watch.status = 'active';
    watch.triggeredAt = undefined;
    watch.triggeredAtPriceBDT = undefined;
    await watch.save();
    return watch;
  },

  /** Remove a watch entirely. */
  deleteWatch: async (id, userId) => {
    const watch = await Watchlist.findById(id);
    if (!watch) {throw ApiError.notFound('Watch not found');}
    if (watch.user.toString() !== userId) {
      throw ApiError.forbidden('You can only manage your own watchlist');
    }
    await watch.deleteOne();
  },
};

module.exports = watchlistService;
