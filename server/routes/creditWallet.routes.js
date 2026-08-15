'use strict';

/**
 * routes/creditWallet.routes.js — Credit Wallet System Routes
 *
 * GET /api/wallet/mine               → balance + recent earn/redeem history
 * GET /api/wallet/preview-redemption → live discount preview for a given price + credit amount
 */

const express = require('express');
const creditWalletController = require('../controllers/creditWallet.controller');
const { protect } = require('../middleware/auth');
const { validatePreviewRedemption } = require('../validations/creditWallet.validation');

const router = express.Router();

router.get('/mine', protect, creditWalletController.getMine);
router.get('/preview-redemption', protect, validatePreviewRedemption, creditWalletController.previewRedemption);

module.exports = router;
