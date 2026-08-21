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
    try {
      const data = await transactionService.getTransactionById(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/transactions/:id/deliver ─────────────────────────────────────
  confirmDelivery: async (req, res, next) => {
    try {
      const transaction = await transactionService.confirmDelivery(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Delivery confirmed. Waiting for the buyer to confirm they received it.',
        data: transaction,
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

  // ─── POST /api/transactions/:id/pay/offline ──────────────────────────────────
  payOffline: async (req, res, next) => {
    try {
      const transaction = await transactionService.confirmOfflinePayment(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Offline payment confirmed — funds released to the provider.',
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /api/transactions/:id/pay/bkash ────────────────────────────────────
  payBkash: async (req, res, next) => {
    try {
      const transaction = await transactionService.submitBkashPayment(
        req.params.id,
        req.user.id,
        req.body.bkashTransactionId
      );
      return res.status(200).json({
        success: true,
        message: 'bKash Transaction ID submitted — waiting for the provider to verify it.',
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/transactions/:id/verify-bkash ────────────────────────────────
  verifyBkash: async (req, res, next) => {
    try {
      const transaction = await transactionService.verifyBkashPayment(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Payment verified — funds released to the provider.',
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/transactions/:id/reject-bkash ────────────────────────────────
  rejectBkash: async (req, res, next) => {
    try {
      const transaction = await transactionService.rejectBkashPayment(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: "Transaction ID rejected — the buyer can resubmit or switch payment method.",
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = transactionController;