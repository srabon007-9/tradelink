'use strict';

/**
 * controllers/wallet.controller.js — Wallet System HTTP Layer
 */

const walletService = require('../services/wallet.service');

const walletController = {
  // ─── GET /api/wallet ────────────────────────────────────────────────────────
  // Get authenticated student's wallet balance & summary
  getWallet: async (req, res, next) => {
    try {
      const summary = await walletService.getWalletSummary(req.user.id);
      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/wallet/transactions ───────────────────────────────────────────
  // Get authenticated student's transaction history (newest first)
  getTransactions: async (req, res, next) => {
    try {
      const transactions = await walletService.getTransactions(req.user.id);
      return res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /api/wallet/purchase ──────────────────────────────────────────────
  // Purchase credit package (starter, popular, pro)
  purchaseCredits: async (req, res, next) => {
    try {
      const { packageId, paymentId } = req.body;
      const result = await walletService.purchaseCredits(req.user.id, { packageId, paymentId });

      return res.status(200).json({
        success: true,
        message: 'Credits purchased successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /api/wallet/dev-action ───────────────────────────────────────────
  // Dev / Testing action helper (earn, spend, bonus) for manual testing in UI
  devAction: async (req, res, next) => {
    try {
      const { action, amount, reason } = req.body;
      let result;

      if (action === 'earn') {
        result = await walletService.addCredits(req.user.id, amount, reason);
      } else if (action === 'spend') {
        result = await walletService.spendCredits(req.user.id, amount, reason);
      } else if (action === 'bonus') {
        result = await walletService.addBonusCredits(req.user.id, amount, reason);
      }

      return res.status(200).json({
        success: true,
        message: `Action '${action}' completed successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = walletController;
