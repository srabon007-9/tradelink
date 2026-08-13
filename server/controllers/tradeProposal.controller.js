'use strict';

/**
 * controllers/tradeProposal.controller.js — Trade Proposal Builder HTTP Layer
 */

const tradeProposalService = require('../services/tradeProposal.service');

const tradeProposalController = {
  // ─── POST /api/trade-proposals ───────────────────────────────────────────────
  createProposal: async (req, res, next) => {
    try {
      const { listingId, proposedSessionAt, message } = req.body;
      const proposal = await tradeProposalService.createProposal(req.user.id, {
        listingId,
        proposedSessionAt,
        message,
      });

      return res.status(201).json({
        success: true,
        message: 'Trade proposal sent — waiting for the provider to accept.',
        data: proposal,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/trade-proposals/sent ───────────────────────────────────────────
  getSent: async (req, res, next) => {
    try {
      const proposals = await tradeProposalService.getSentProposals(req.user.id);
      return res.status(200).json({ success: true, count: proposals.length, data: proposals });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/trade-proposals/received ───────────────────────────────────────
  getReceived: async (req, res, next) => {
    try {
      const proposals = await tradeProposalService.getReceivedProposals(req.user.id);
      return res.status(200).json({ success: true, count: proposals.length, data: proposals });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/trade-proposals/:id ────────────────────────────────────────────
  getById: async (req, res, next) => {
    try {
      const proposal = await tradeProposalService.getProposalById(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data: proposal });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/trade-proposals/:id/accept ───────────────────────────────────
  accept: async (req, res, next) => {
    try {
      const proposal = await tradeProposalService.acceptProposal(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: proposal.session.calendarSynced
          ? 'Trade accepted — a calendar invite has been sent to both of you.'
          : 'Trade accepted, but the calendar invite could not be sent automatically.',
        data: proposal,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/trade-proposals/:id/decline ──────────────────────────────────
  decline: async (req, res, next) => {
    try {
      const proposal = await tradeProposalService.declineProposal(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Trade proposal declined', data: proposal });
    } catch (err) {
      next(err);
    }
  },

  // ─── DELETE /api/trade-proposals/:id ─────────────────────────────────────────
  cancel: async (req, res, next) => {
    try {
      const proposal = await tradeProposalService.cancelProposal(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Trade proposal cancelled', data: proposal });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = tradeProposalController;
