'use strict';

/**
 * routes/transaction.routes.js — Escrow System (Transaction) Routes
 *
 * GET   /api/transactions/mine             → transactions where I'm requester or provider
 * GET   /api/transactions/income/mine      → my total confirmed income + paid transaction history (provider-only view)
 * GET   /api/transactions/:id              → single transaction (either party only)
 * PATCH /api/transactions/:id/deliver      → provider confirms the service was delivered
 * PATCH /api/transactions/:id/receive      → requester confirms they received it (must follow /deliver)
 * POST  /api/transactions/:id/pay/offline  → requester confirms an offline (cash/in-person) payment — one step
 * POST  /api/transactions/:id/pay/bkash    → requester submits a bKash Transaction ID for the provider to verify
 * PATCH /api/transactions/:id/verify-bkash → provider confirms the submitted bKash Transaction ID matches
 * PATCH /api/transactions/:id/reject-bkash → provider rejects it — requester can resubmit or switch method
 */

const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');
const { validateTransactionId, validateBkashPayment } = require('../validations/transaction.validation');

const router = express.Router();

router.get('/mine', protect, transactionController.getMyTransactions);
router.get('/income/mine', protect, transactionController.getMyIncome);
router.get('/:id', protect, validateTransactionId, transactionController.getById);
router.patch('/:id/deliver', protect, validateTransactionId, transactionController.confirmDelivery);
router.patch('/:id/receive', protect, validateTransactionId, transactionController.confirmReceipt);
router.post('/:id/pay/offline', protect, validateTransactionId, transactionController.payOffline);
router.post('/:id/pay/bkash', protect, validateBkashPayment, transactionController.payBkash);
router.patch('/:id/verify-bkash', protect, validateTransactionId, transactionController.verifyBkash);
router.patch('/:id/reject-bkash', protect, validateTransactionId, transactionController.rejectBkash);

module.exports = router;