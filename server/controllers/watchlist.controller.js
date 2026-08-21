'use strict';

/**
 * controllers/watchlist.controller.js — Watchlist HTTP Layer
 */

const watchlistService = require('../services/watchlist.service');

const watchlistController = {
  // ─── POST /api/watchlist ─────────────────────────────────────────────────────
  create: async (req, res, next) => {
    try {
      const { category, condition, thresholdBDT } = req.body;
      const watch = await watchlistService.createWatch(req.user.id, { category, condition, thresholdBDT });
      return res.status(201).json({ success: true, message: 'Added to your watchlist.', data: watch });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/watchlist/mine ──────────────────────────────────────────────────
  getMine: async (req, res, next) => {
    try {
      const watches = await watchlistService.getMyWatches(req.user.id);
      return res.status(200).json({ success: true, count: watches.length, data: watches });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/watchlist/:id/reactivate ─────────────────────────────────────
  reactivate: async (req, res, next) => {
    try {
      const watch = await watchlistService.reactivateWatch(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Watch reactivated.', data: watch });
    } catch (err) {
      next(err);
    }
  },

  // ─── DELETE /api/watchlist/:id ────────────────────────────────────────────────
  remove: async (req, res, next) => {
    try {
      await watchlistService.deleteWatch(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Removed from your watchlist.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = watchlistController;
