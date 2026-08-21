'use strict';

/**
 * controllers/payment.controller.js — SSLCommerz Callback HTTP Layer
 *
 * These four endpoints are hit directly by SSLCommerz — success/fail/cancel
 * as a browser redirect after the buyer finishes on their hosted page, and
 * ipn as a server-to-server webhook. None of them carry our JWT (SSLCommerz
 * has no notion of it), so they're intentionally public routes. Authenticity
 * is verified inside transactionService.finalizePayment() via SSLCommerz's
 * own Validation API — never trust the redirect/webhook body alone.
 */

const transactionService = require('../services/transaction.service');
const { config } = require('../config/env');
const logger = require('../utils/logger');

// The Transactions page lives at /dashboard/transactions (see
// client/src/routes/AppRouter.jsx), not /transactions — this must match
// exactly or the buyer lands on the app's 404 page right after paying.
const TRANSACTIONS_PAGE_PATH = '/dashboard/transactions';

// SSLCommerz may send fields as form-encoded POST body or query string
// depending on configuration — read both, defensively.
const extractFields = req => ({ ...req.query, ...req.body });

const paymentController = {
  /** Browser redirect after a successful payment. */
  success: async (req, res) => {
    const { tran_id: tranId, val_id: valId } = extractFields(req);
    try {
      await transactionService.finalizePayment(tranId, valId);
    } catch (err) {
      logger.error(`[Payment] success handler error: ${err.message}`);
    }
    return res.redirect(
      `${config.clientUrl}${TRANSACTIONS_PAGE_PATH}?payment=success&tranId=${encodeURIComponent(tranId || '')}`
    );
  },

  /** Browser redirect after a failed payment. */
  fail: async (req, res) => {
    const { tran_id: tranId } = extractFields(req);
    try {
      await transactionService.markPaymentFailed(tranId);
    } catch (err) {
      logger.error(`[Payment] fail handler error: ${err.message}`);
    }
    return res.redirect(
      `${config.clientUrl}${TRANSACTIONS_PAGE_PATH}?payment=failed&tranId=${encodeURIComponent(tranId || '')}`
    );
  },

  /** Browser redirect when the buyer cancels on SSLCommerz's page. */
  cancel: async (req, res) => {
    const { tran_id: tranId } = extractFields(req);
    try {
      await transactionService.markPaymentFailed(tranId);
    } catch (err) {
      logger.error(`[Payment] cancel handler error: ${err.message}`);
    }
    return res.redirect(
      `${config.clientUrl}${TRANSACTIONS_PAGE_PATH}?payment=cancelled&tranId=${encodeURIComponent(tranId || '')}`
    );
  },

  /**
   * Server-to-server webhook — the reliable source of truth, since it
   * doesn't depend on the buyer's browser successfully completing the
   * redirect. SSLCommerz just needs any 200 response to consider it delivered.
   */
  ipn: async (req, res) => {
    const { tran_id: tranId, val_id: valId, status } = extractFields(req);
    try {
      if (status === 'VALID' || status === 'VALIDATED') {
        await transactionService.finalizePayment(tranId, valId);
      } else {
        await transactionService.markPaymentFailed(tranId);
      }
    } catch (err) {
      logger.error(`[Payment] IPN handler error: ${err.message}`);
    }
    return res.status(200).send('IPN received');
  },
};

module.exports = paymentController;