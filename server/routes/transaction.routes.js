'use strict';

/**
 * routes/transaction.routes.js — Escrow System Routes
 */

const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/mine', transactionController.getMyTransactions);
router.get('/:id', transactionController.getTransaction);
router.patch('/:id/confirm', transactionController.confirmCompletion);

module.exports = router;
