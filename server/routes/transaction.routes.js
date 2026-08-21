'use strict';

/**
 * routes/transaction.routes.js — Escrow System (Transaction) Routes
 */

const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/mine',
  protect,
  transactionController.getMyTransactions
);

router.get(
  '/income/mine',
  protect,
  transactionController.getMyIncome
);

router.get(
  '/:id',
  protect,
  transactionController.getById
);

router.patch(
  '/:id/deliver',
  protect,
  transactionController.confirmDelivery
);

router.patch(
  '/:id/receive',
  protect,
  transactionController.confirmReceipt
);

router.patch(
  '/:id/confirm',
  protect,
  transactionController.confirmCompletion
);

router.post(
  '/:id/pay',
  protect,
  transactionController.pay
);

module.exports = router;