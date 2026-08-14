'use strict';

/**
 * routes/transaction.routes.js — Escrow System (Transaction) Routes
 *
 * GET   /api/transactions/mine        → transactions where I'm requester or provider
 * GET   /api/transactions/:id         → single transaction (either party only)
 * PATCH /api/transactions/:id/confirm → confirm work completed; releases once both confirm
 */

const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');
const { validateTransactionId } = require('../validations/transaction.validation');

const router = express.Router();

router.get('/mine', protect, transactionController.getMine);
router.get('/:id', protect, validateTransactionId, transactionController.getById);
router.patch('/:id/confirm', protect, validateTransactionId, transactionController.confirm);

module.exports = router;
