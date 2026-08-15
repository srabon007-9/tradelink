'use strict';

/**
 * controllers/transaction.controller.js — Escrow System Controller
 */

const transactionService = require('../services/transaction.service');

const transactionController = {
  getMyTransactions: async (req, res, next) => {
    try {
      const data = await transactionService.getMyTransactions(req.user.id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getTransaction: async (req, res, next) => {
    try {
      const data = await transactionService.getTransactionById(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  confirmCompletion: async (req, res, next) => {
    try {
      const data = await transactionService.confirmCompletion(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message:
          data.status === 'released'
            ? 'Work completed! Escrow funds have been released.'
            : 'Completion confirmed. Waiting for counterparty confirmation.',
        data,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = transactionController;
