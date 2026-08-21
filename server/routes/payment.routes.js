'use strict';

/**
 * routes/payment.routes.js — SSLCommerz Callback Routes
 *
 * POST/GET /api/payments/success → browser redirect after a completed payment
 * POST/GET /api/payments/fail    → browser redirect after a failed payment
 * POST/GET /api/payments/cancel  → browser redirect after the buyer cancels
 * POST/GET /api/payments/ipn     → server-to-server webhook (reliable source of truth)
 *
 * These are called directly by SSLCommerz, not by our own frontend, so
 * they're intentionally NOT behind `protect`. SSLCommerz can be configured
 * to hit these via GET or POST depending on the integration, so both are
 * registered for safety.
 */

const express = require('express');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

router.route('/success').get(paymentController.success).post(paymentController.success);
router.route('/fail').get(paymentController.fail).post(paymentController.fail);
router.route('/cancel').get(paymentController.cancel).post(paymentController.cancel);
router.route('/ipn').get(paymentController.ipn).post(paymentController.ipn);

module.exports = router;