'use strict';

/**
 * controllers/reputation.controller.js — Reputation Score HTTP Layer
 *
 * Endpoints:
 *   GET  /api/reputation/me          — logged-in user's own reputation (auth)
 *   GET  /api/reputation/leaderboard — top 10 users by score (public)
 *   GET  /api/reputation/:userId     — any user's public reputation (public)
 *   POST /api/reputation/reviews     — submit a review for a completed trade (auth)
 */

const TradeProposal     = require('../models/TradeProposal.model');
const Review            = require('../models/Review.model');
const reputationService = require('../services/reputation.service');
const ApiError          = require('../utils/ApiError');
const logger            = require('../utils/logger');

const reputationController = {

  // ─── GET /api/reputation/me ───────────────────────────────────────────────
  getMyReputation: async (req, res, next) => {
    try {
      const reputation = await reputationService.calculateReputation(req.user.id);

      return res.status(200).json({
        success: true,
        data: reputation,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/reputation/leaderboard ──────────────────────────────────────
  getLeaderboard: async (req, res, next) => {
    try {
      const leaderboard = await reputationService.getLeaderboard(10);

      return res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/reputation/:userId ──────────────────────────────────────────
  getUserReputation: async (req, res, next) => {
    try {
      const { userId } = req.params;

      const reputation = await reputationService.calculateReputation(userId);

      return res.status(200).json({
        success: true,
        data: reputation,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /api/reputation/reviews ─────────────────────────────────────────
  submitReview: async (req, res, next) => {
    try {
      const { tradeProposalId, rating, comment } = req.body;
      const reviewerId = req.user.id;

      // ── Validate input ──────────────────────────────────────────────────
      if (!tradeProposalId) {
        throw ApiError.badRequest('tradeProposalId is required');
      }
      if (!rating || rating < 1 || rating > 5) {
        throw ApiError.badRequest('Rating must be between 1 and 5');
      }

      // ── Fetch the trade proposal ────────────────────────────────────────
      const proposal = await TradeProposal.findById(tradeProposalId).lean();

      if (!proposal) {
        throw ApiError.notFound('Trade proposal not found');
      }

      // ── Validate proposal status ────────────────────────────────────────
      if (proposal.status !== 'accepted') {
        throw ApiError.badRequest('You can only review accepted (completed) trade proposals');
      }

      // ── Validate reviewer is a participant ──────────────────────────────
      const isRequester = proposal.requester.toString() === reviewerId;
      const isProvider  = proposal.provider.toString() === reviewerId;

      if (!isRequester && !isProvider) {
        throw ApiError.forbidden('You are not a participant of this trade proposal');
      }

      // ── Determine reviewee (the other party) ───────────────────────────
      const revieweeId = isRequester
        ? proposal.provider.toString()
        : proposal.requester.toString();

      // ── Cannot review yourself ──────────────────────────────────────────
      if (reviewerId === revieweeId) {
        throw ApiError.badRequest('You cannot review yourself');
      }

      // ── Create the review (unique index prevents duplicates) ────────────
      const review = await Review.create({
        tradeProposal: tradeProposalId,
        reviewer:      reviewerId,
        reviewee:      revieweeId,
        rating:        Math.round(rating),
        comment:       (comment || '').trim().slice(0, 500),
      });

      logger.info(`Review submitted: ${reviewerId} → ${revieweeId} (${rating}★) for proposal ${tradeProposalId}`);

      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
      });
    } catch (err) {
      // Handle MongoDB duplicate key error (unique index violation)
      if (err.code === 11000) {
        return next(ApiError.conflict('You have already reviewed this trade proposal'));
      }
      next(err);
    }
  },
};

module.exports = reputationController;
