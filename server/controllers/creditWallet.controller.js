'use strict';

/**
 * controllers/creditWallet.controller.js — Credit Wallet System HTTP Layer
 */

const creditWalletService = require('../services/creditWallet.service');

const creditWalletController = {
  // ─── GET /api/wallet/mine ────────────────────────────────────────────────────
  getMine: async (req, res, next) => {
    try {
      const wallet = await creditWalletService.getMyWallet(req.user.id);
      return res.status(200).json({ success: true, data: wallet });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/wallet/preview-redemption?price=&credits= ─────────────────────
  // Live preview used by the Trade Proposal Builder before a proposal is sent.
  previewRedemption: async (req, res, next) => {
    try {
      const price = Number(req.query.price);
      const credits = Number(req.query.credits) || 0;

      const preview = await creditWalletService.previewRedemption(req.user.id, price, credits);
      return res.status(200).json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = creditWalletController;
