'use strict';

/**
 * routes/tradeProposal.routes.js — Trade Proposal Builder With Session Scheduling
 *
 * POST   /api/trade-proposals            → propose a trade on a listing
 * GET    /api/trade-proposals/sent       → proposals I sent (as requester)
 * GET    /api/trade-proposals/received   → proposals sent to my listings (as provider)
 * GET    /api/trade-proposals/rush-preview → live Time-Decay Rush Pricing preview
 * GET    /api/trade-proposals/disputes/mine → every trade I've been disputed on, past or present
 * GET    /api/trade-proposals/:id        → single proposal (requester or provider only)
 * PATCH  /api/trade-proposals/:id/accept → provider accepts → creates the calendar session
 * PATCH  /api/trade-proposals/:id/decline→ provider declines
 * PATCH  /api/trade-proposals/:id/dispute→ either party flags an accepted trade as disputed
 * GET    /api/trade-proposals/:id/messages → the dispute's shared message thread
 * POST   /api/trade-proposals/:id/messages → post into the dispute's message thread
 * DELETE /api/trade-proposals/:id        → requester cancels while pending
 */

const express = require('express');
const tradeProposalController = require('../controllers/tradeProposal.controller');
const { protect } = require('../middleware/auth');
const {
  validateCreateProposal,
  validateProposalId,
  validateRushPreview,
  validateDispute,
  validateDisputeMessage,
} = require('../validations/tradeProposal.validation');

const router = express.Router();

router.post('/', protect, validateCreateProposal, tradeProposalController.createProposal);
router.get('/sent', protect, tradeProposalController.getSent);
router.get('/received', protect, tradeProposalController.getReceived);
router.get('/rush-preview', protect, validateRushPreview, tradeProposalController.previewRush);
router.get('/disputes/mine', protect, tradeProposalController.getMyDisputes);
router.get('/:id', protect, validateProposalId, tradeProposalController.getById);
router.patch('/:id/accept', protect, validateProposalId, tradeProposalController.accept);
router.patch('/:id/decline', protect, validateProposalId, tradeProposalController.decline);
router.patch('/:id/dispute', protect, validateDispute, tradeProposalController.dispute);
router.get('/:id/messages', protect, validateProposalId, tradeProposalController.getMessages);
router.post('/:id/messages', protect, validateDisputeMessage, tradeProposalController.postMessage);
router.delete('/:id', protect, validateProposalId, tradeProposalController.cancel);

module.exports = router;
