'use strict';

/**
<<<<<<< Updated upstream
 * routes/transaction.routes.js — Escrow System Routes
=======
 * routes/transaction.routes.js — Escrow System (Transaction) Routes
 *
 * GET   /api/transactions/mine        → transactions where I'm requester or provider
 * GET   /api/transactions/income/mine → my total confirmed income + paid transaction history (provider-only view)
 * GET   /api/transactions/:id         → single transaction (either party only)
 * PATCH /api/transactions/:id/deliver → provider confirms the service was delivered
 * PATCH /api/transactions/:id/receive → requester confirms they received it (must follow /deliver)
 * POST  /api/transactions/:id/pay     → requester opens an SSLCommerz payment session (must follow /receive)
>>>>>>> Stashed changes
 */

const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

<<<<<<< Updated upstream
router.use(protect);

router.get('/mine', transactionController.getMyTransactions);
router.get('/:id', transactionController.getTransaction);
router.patch('/:id/confirm', transactionController.confirmCompletion);
=======
router.get('/mine', protect, transactionController.getMine);
router.get('/income/mine', protect, transactionController.getMyIncome);
router.get('/:id', protect, validateTransactionId, transactionController.getById);
router.patch('/:id/deliver', protect, validateTransactionId, transactionController.confirmDelivery);
router.patch('/:id/receive', protect, validateTransactionId, transactionController.confirmReceipt);
router.post('/:id/pay', protect, validateTransactionId, transactionController.pay);
>>>>>>> Stashed changes

module.exports = router;