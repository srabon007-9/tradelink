'use strict';

/**
 * routes/wallet.routes.js — Credit Wallet Routes
 *
 * GET  /api/wallet               → get current student's wallet & summary
 * GET  /api/wallet/transactions  → get transaction history
 * POST /api/wallet/purchase      → purchase credits using BDT packages
 * POST /api/wallet/dev-action     → dev/test helper (earn/spend/bonus)
 */

const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth');
const { validatePurchase, validateDevAction } = require('../validations/wallet.validation');

const router = express.Router();

router.get('/', protect, walletController.getWallet);
router.get('/transactions', protect, walletController.getTransactions);

router.post('/purchase', protect, validatePurchase, walletController.purchaseCredits);
router.post('/dev-action', protect, validateDevAction, walletController.devAction);

module.exports = router;
