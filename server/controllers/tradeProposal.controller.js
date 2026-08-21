'use strict';

/**
 * controllers/tradeProposal.controller.js — Trade Proposal Builder HTTP Layer
 */

const tradeProposalService = require('../services/tradeProposal.service');
const rushPricingService = require('../services/rushPricing.service');

const tradeProposalController = {
  // ─── POST /api/trade-proposals ───────────────────────────────────────────────
  createProposal: async (req, res, next) => {
    try {
      const { listingId, proposedSessionAt, message, creditsToRedeem, isUrgent } = req.body;
      const proposal = await tradeProposalService.createProposal(req.user.id, {
        listingId,
        proposedSessionAt,
        message,
        creditsToRedeem,
        isUrgent,
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

  // ─── GET /api/trade-proposals/rush-preview ───────────────────────────────────
  // Live Time-Decay Rush Pricing preview before submitting — pure calculation,
  // no side effects.
  previewRush: async (req, res, next) => {
    try {
      const priceBDT = Number(req.query.priceBDT);
      const deadline = new Date(req.query.deadline);
      const preview = rushPricingService.applyRushPricing(priceBDT, deadline);
      return res.status(200).json({ success: true, data: preview });
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

  // ─── PATCH /api/trade-proposals/:id/dispute ──────────────────────────────────
  dispute: async (req, res, next) => {
    try {
      const proposal = await tradeProposalService.raiseDispute(req.params.id, req.user.id, req.body.reason);
      return res.status(200).json({
        success: true,
        message: "Dispute raised — an admin will review it against the recorded market rate.",
        data: proposal,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/trade-proposals/disputes/mine ──────────────────────────────────
  getMyDisputes: async (req, res, next) => {
    try {
      const disputes = await tradeProposalService.getMyDisputes(req.user.id);
      return res.status(200).json({ success: true, data: disputes });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/trade-proposals/:id/messages ───────────────────────────────────
  getMessages: async (req, res, next) => {
    try {
      const isAdmin = req.user.role === 'admin';
      const messages = await tradeProposalService.getMessages(req.params.id, req.user.id, isAdmin);
      return res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /api/trade-proposals/:id/messages ──────────────────────────────────
  postMessage: async (req, res, next) => {
    try {
      const isAdmin = req.user.role === 'admin';
      const message = await tradeProposalService.postMessage(req.params.id, req.user.id, isAdmin, req.body.message);
      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = tradeProposalController;
