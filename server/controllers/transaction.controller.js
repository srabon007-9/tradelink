'use strict';

/**
 * controllers/transaction.controller.js — Escrow System (Transaction) HTTP Layer
 */

const transactionService = require('../services/transaction.service');

const transactionController = {
  // ─── GET /api/transactions/mine ──────────────────────────────────────────────
  getMine: async (req, res, next) => {
    try {
      const transactions = await transactionService.getMyTransactions(req.user.id);
      return res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/transactions/:id ───────────────────────────────────────────────
  getById: async (req, res, next) => {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data: transaction });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/transactions/:id/confirm ─────────────────────────────────────
  confirm: async (req, res, next) => {
    try {
      const transaction = await transactionService.confirmCompletion(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message:
          transaction.status === 'released'
            ? 'Both parties confirmed — funds released to the provider.'
            : 'Confirmed. Waiting for the other party to confirm before funds are released.',
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = transactionController;
