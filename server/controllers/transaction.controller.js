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

<<<<<<< Updated upstream
  getTransaction: async (req, res, next) => {
=======
  // ─── GET /api/transactions/income/mine ───────────────────────────────────────
  getMyIncome: async (req, res, next) => {
    try {
      const income = await transactionService.getMyIncome(req.user.id);
      return res.status(200).json({ success: true, data: income });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/transactions/:id ───────────────────────────────────────────────
  getById: async (req, res, next) => {
>>>>>>> Stashed changes
    try {
      const data = await transactionService.getTransactionById(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

<<<<<<< Updated upstream
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
=======
  // ─── PATCH /api/transactions/:id/deliver ─────────────────────────────────────
  confirmDelivery: async (req, res, next) => {
    try {
      const transaction = await transactionService.confirmDelivery(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Delivery confirmed. Waiting for the buyer to confirm they received it.',
        data: transaction,
>>>>>>> Stashed changes
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/transactions/:id/receive ─────────────────────────────────────
  confirmReceipt: async (req, res, next) => {
    try {
      const transaction = await transactionService.confirmReceipt(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Receipt confirmed. You can now pay to release funds to the provider.',
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /api/transactions/:id/pay ──────────────────────────────────────────
  pay: async (req, res, next) => {
    try {
      const { gatewayUrl } = await transactionService.initiatePayment(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data: { gatewayUrl } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = transactionController;