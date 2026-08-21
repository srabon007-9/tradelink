'use strict';

/**
 * services/sslcommerz.service.js — SSLCommerz Payment Gateway Integration
 *
 * Two calls, both plain REST (no SDK needed):
 *
 *   1. initiateSession() — opens a payment session and returns SSLCommerz's
 *      hosted GatewayPageURL. The buyer is redirected there and chooses
 *      their own payment method (card, bKash, Nagad, Rocket, net banking,
 *      etc.) on SSLCommerz's own page — TradeLink never touches card or
 *      wallet details directly.
 *
 *   2. validateTransaction() — after SSLCommerz redirects/IPNs back with a
 *      val_id, this asks SSLCommerz server-to-server to confirm the
 *      payment is genuine. Never trust a redirect's query/body alone —
 *      tran_id/amount in a browser redirect can be spoofed by anyone.
 *
 * Uses the sandbox gateway by default. Set SSLCOMMERZ_IS_LIVE=true once you
 * have production store credentials (see .env.example).
 */

const { config } = require('../config/env');
const logger = require('../utils/logger');

const BASE_URL = config.sslcommerz.isLive
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

const isConfigured = () => Boolean(config.sslcommerz.storeId && config.sslcommerz.storePassword);

/**
 * Opens a payment session for one transaction.
 *
 * @param {{
 *   tranId: string,
 *   amount: number,
 *   customerName: string,
 *   customerEmail: string,
 *   customerPhone?: string,
 *   productName: string,
 *   successUrl: string,
 *   failUrl: string,
 *   cancelUrl: string,
 *   ipnUrl: string,
 * }} opts
 * @returns {Promise<{ gatewayUrl: string }>}
 */
const initiateSession = async ({
  tranId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  productName,
  successUrl,
  failUrl,
  cancelUrl,
  ipnUrl,
}) => {
  if (!isConfigured()) {
    throw new Error('SSLCommerz is not configured (missing SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD).');
  }

  const body = new URLSearchParams({
    store_id: config.sslcommerz.storeId,
    store_passwd: config.sslcommerz.storePassword,
    total_amount: String(amount),
    currency: 'BDT',
    tran_id: tranId,
    success_url: successUrl,
    fail_url: failUrl,
    cancel_url: cancelUrl,
    ipn_url: ipnUrl,
    shipping_method: 'NO',
    product_name: productName,
    product_category: 'Skill Exchange Service',
    product_profile: 'general',
    cus_name: customerName,
    cus_email: customerEmail,
    cus_add1: 'N/A',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: customerPhone || '01700000000',
    num_of_item: '1',
  });

  const response = await fetch(`${BASE_URL}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();

  if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
    logger.error(`[SSLCommerz] Session init failed: ${data.failedreason || JSON.stringify(data)}`);
    throw new Error(data.failedreason || 'SSLCommerz could not open a payment session.');
  }

  return { gatewayUrl: data.GatewayPageURL };
};

/**
 * Confirms a payment is genuine by asking SSLCommerz directly, server to
 * server — never trust val_id/amount from a browser redirect alone.
 *
 * @param {string} valId
 * @returns {Promise<{ isValid: boolean, amount?: number, cardType?: string, cardIssuer?: string, raw: object }>}
 */
const validateTransaction = async valId => {
  if (!isConfigured()) {
    throw new Error('SSLCommerz is not configured (missing SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD).');
  }

  const params = new URLSearchParams({
    val_id: valId,
    store_id: config.sslcommerz.storeId,
    store_passwd: config.sslcommerz.storePassword,
    format: 'json',
  });

  const response = await fetch(`${BASE_URL}/validator/api/validationserverAPI.php?${params.toString()}`);
  const data = await response.json();

  const isValid = data.status === 'VALID' || data.status === 'VALIDATED';

  return {
    isValid,
    amount: data.amount ? Number(data.amount) : undefined,
    cardType: data.card_type,
    cardIssuer: data.card_issuer,
    raw: data,
  };
};

module.exports = { initiateSession, validateTransaction, isConfigured };