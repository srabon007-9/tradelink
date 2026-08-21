'use strict';

/**
 * services/transaction.service.js — Escrow System + SSLCommerz Payment
 *
<<<<<<< Updated upstream
 * Business logic for the escrow ledger: opened the moment a trade
 * proposal is accepted, held 'pending', and released to the provider
 * only once both the requester and the provider have independently
 * confirmed the work was completed.
 *
 * The instant a transaction releases, both the requester and the
 * provider earn Credit Wallet credits from it (see
 * creditWallet.service.js) — that's what "completing a trade" means for
 * the Credit Wallet System.
 */

const Transaction = require('../models/Transaction.model');
const creditWalletService = require('./creditWallet.service');
=======
 * Lifecycle of a transaction (opened the instant a trade proposal is
 * accepted — see tradeProposal.service.js's acceptProposal):
 *
 *   pending           →  the provider still owes the service
 *   delivered         →  provider confirmed delivery; waiting on the buyer
 *   awaiting_payment  →  buyer confirmed receipt; ready to pay
 *   paid              →  SSLCommerz payment validated; funds now count
 *                         toward the provider's income
 *   payment_failed    →  a payment attempt failed/was cancelled; buyer can
 *                         retry
 *
 * Each step is only reachable from the previous one — the buyer can't
 * confirm receipt before the provider confirms delivery, and can't pay
 * before confirming receipt. Combined with never marking a transaction
 * "paid" without SSLCommerz's own server-side validation, this is what
 * protects both sides from either party backing out mid-trade.
 */

const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const sslcommerzService = require('./sslcommerz.service');
const { config } = require('../config/env');
>>>>>>> Stashed changes
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const callbackUrls = () => ({
  successUrl: `${config.serverUrl}/api/payments/success`,
  failUrl: `${config.serverUrl}/api/payments/fail`,
  cancelUrl: `${config.serverUrl}/api/payments/cancel`,
  ipnUrl: `${config.serverUrl}/api/payments/ipn`,
});

/** Confirms the user is a party to the transaction and returns which side. */
const assertParty = (transaction, userId) => {
  const isRequester = transaction.requester.toString() === userId;
  const isProvider = transaction.provider.toString() === userId;
  if (!isRequester && !isProvider) {
    throw ApiError.forbidden('You are not part of this transaction');
  }
  return { isRequester, isProvider };
};

// ─── Service ──────────────────────────────────────────────────────────────────

const transactionService = {
  /**
   * Called from tradeProposal.service.js the instant a proposal is
   * accepted — opens the escrow hold for that trade.
   * @param {import('../models/TradeProposal.model')} proposal
   */
  createForProposal: async proposal => {
    const existing = await Transaction.findOne({ tradeProposal: proposal._id });
    if (existing) {return existing;} // safety net — a proposal only ever gets accepted once

    const transaction = await Transaction.create({
      tradeProposal: proposal._id,
      requester: proposal.requester,
      provider: proposal.provider,
      listingTitle: proposal.listingTitle,
      amount: proposal.finalPriceBDT,
    });

    logger.info(`[Transaction] Escrow opened for proposal ${proposal._id} — ৳${transaction.amount} BDT pending delivery.`);
    return transaction;
  },

  /** Every transaction the user is party to, with their role in each. */
  getMyTransactions: async userId => {
    const transactions = await Transaction.find({ $or: [{ requester: userId }, { provider: userId }] })
      .sort({ createdAt: -1 })
      .populate('requester', 'name email avatar')
      .populate('provider', 'name email avatar')
      .lean();

    return transactions.map(t => ({
      ...t,
      viewerRole: t.requester._id.toString() === userId ? 'requester' : 'provider',
    }));
  },

  getTransactionById: async (id, userId) => {
    const transaction = await Transaction.findById(id)
      .populate('requester', 'name email avatar')
      .populate('provider', 'name email avatar');
<<<<<<< Updated upstream
    if (!transaction) {throw ApiError.notFound('Transaction not found');}
=======
    if (!transaction) throw ApiError.notFound('Transaction not found');
    assertParty(transaction, userId);
    return transaction;
  },
>>>>>>> Stashed changes

  /** Step 1 — provider confirms the service was delivered. */
  confirmDelivery: async (id, userId) => {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw ApiError.notFound('Transaction not found');
    const { isProvider } = assertParty(transaction, userId);

    if (!isProvider) throw ApiError.forbidden('Only the provider can confirm delivery');
    if (transaction.status !== 'pending') {
      throw ApiError.badRequest(`Delivery was already confirmed for this transaction (status: ${transaction.status})`);
    }

    transaction.providerConfirmed = true;
    transaction.providerConfirmedAt = new Date();
    transaction.status = 'delivered';
    await transaction.save();

    logger.info(`[Transaction] ${transaction._id} marked delivered by provider.`);
    return transaction;
  },

  /** Step 2 — requester confirms they received the service. Must follow delivery. */
  confirmReceipt: async (id, userId) => {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw ApiError.notFound('Transaction not found');
    const { isRequester } = assertParty(transaction, userId);

    if (!isRequester) throw ApiError.forbidden('Only the requester can confirm receipt');
    if (transaction.status === 'pending') {
      throw ApiError.badRequest("The provider hasn't confirmed delivery yet — there's nothing to confirm.");
    }
    if (transaction.status !== 'delivered') {
      throw ApiError.badRequest(`Receipt was already confirmed for this transaction (status: ${transaction.status})`);
    }

    transaction.requesterConfirmed = true;
    transaction.requesterConfirmedAt = new Date();
    transaction.status = 'awaiting_payment';
    await transaction.save();

    logger.info(`[Transaction] ${transaction._id} receipt confirmed by requester — ready for payment.`);
    return transaction;
  },

  /** Step 3 — requester starts an SSLCommerz payment session. */
  initiatePayment: async (id, userId) => {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw ApiError.notFound('Transaction not found');
    const { isRequester } = assertParty(transaction, userId);

    if (!isRequester) throw ApiError.forbidden('Only the requester can pay for this transaction');
    if (!['awaiting_payment', 'payment_failed'].includes(transaction.status)) {
      throw ApiError.badRequest(`This transaction isn't ready for payment yet (status: ${transaction.status})`);
    }

    const requester = await User.findById(transaction.requester).select('name email phone');
    const tranId = `TXN-${transaction._id}-${Date.now()}`;

    let gatewayUrl;
    try {
      ({ gatewayUrl } = await sslcommerzService.initiateSession({
        tranId,
        amount: transaction.amount,
        customerName: requester.name,
        customerEmail: requester.email,
        customerPhone: requester.phone,
        productName: transaction.listingTitle,
        ...callbackUrls(),
      }));
    } catch (err) {
      logger.error(`[Transaction] SSLCommerz session init failed for ${transaction._id}: ${err.message}`);
      throw new ApiError(502, err.message || 'Could not start the payment session. Please try again shortly.');
    }

    transaction.payment.tranId = tranId;
    transaction.payment.status = 'initiated';
    await transaction.save();

    logger.info(`[Transaction] Payment session opened for ${transaction._id} (tran_id=${tranId}).`);
    return { gatewayUrl };
  },

  /**
   * Finalizes a payment after SSLCommerz confirms it — called from both
   * the success redirect and the IPN webhook. Idempotent: whichever
   * fires first wins, the second call is a no-op.
   *
   * @param {string} tranId
   * @param {string} valId
   */
  finalizePayment: async (tranId, valId) => {
    if (!tranId) return null;

    const transaction = await Transaction.findOne({ 'payment.tranId': tranId });
    if (!transaction) {
      logger.error(`[Transaction] Payment callback for unknown tran_id: ${tranId}`);
      return null;
    }

    if (transaction.status === 'paid') return transaction; // already finalized — idempotent

    let validation;
    try {
      validation = await sslcommerzService.validateTransaction(valId);
    } catch (err) {
      logger.error(`[Transaction] SSLCommerz validation call failed for ${transaction._id}: ${err.message}`);
      transaction.payment.status = 'failed';
      transaction.status = 'payment_failed';
      await transaction.save();
      return transaction;
    }

    const amountMatches = Math.round(validation.amount) === Math.round(transaction.amount);

    if (!validation.isValid || !amountMatches) {
      transaction.payment.status = 'failed';
      transaction.payment.gatewayResponse = validation.raw;
      transaction.status = 'payment_failed';
      await transaction.save();
      logger.error(
        `[Transaction] Payment validation failed for ${transaction._id} (tran_id=${tranId}, amountMatches=${amountMatches}).`
      );
      return transaction;
    }

    transaction.status = 'paid';
    transaction.payment.status = 'paid';
    transaction.payment.valId = valId;
    transaction.payment.method = validation.cardIssuer || validation.cardType || 'Unknown';
    transaction.payment.gatewayResponse = validation.raw;
    transaction.payment.paidAt = new Date();
    transaction.releasedAt = new Date();
    await transaction.save();

    logger.info(`[Transaction] Payment confirmed for ${transaction._id} — ৳${transaction.amount} BDT paid to provider.`);
    return transaction;
  },

  /** Marks a payment attempt as failed/cancelled so the requester can retry. */
  markPaymentFailed: async tranId => {
    if (!tranId) return null;
    const transaction = await Transaction.findOne({ 'payment.tranId': tranId });
    if (!transaction || transaction.status === 'paid') return transaction;

    transaction.payment.status = 'failed';
    transaction.status = 'payment_failed';
    await transaction.save();

    logger.info(`[Transaction] Payment marked failed/cancelled for ${transaction._id} (tran_id=${tranId}).`);
    return transaction;
  },

  /**
   * Provider-only: total confirmed income + paid transaction history.
   * Always scoped to the logged-in user — there's no route that exposes
   * another member's income or payment history.
   */
<<<<<<< Updated upstream
  confirmCompletion: async (id, userId) => {
    const transaction = await Transaction.findById(id);
    if (!transaction) {throw ApiError.notFound('Transaction not found');}
=======
  getMyIncome: async providerId => {
    const paidTransactions = await Transaction.find({ provider: providerId, status: 'paid' })
      .sort({ 'payment.paidAt': -1 })
      .populate('requester', 'name email avatar')
      .lean();
>>>>>>> Stashed changes

    const totalIncome = paidTransactions.reduce((sum, t) => sum + t.amount, 0);

<<<<<<< Updated upstream
    if (transaction.status === 'released') {
      throw ApiError.badRequest('This transaction has already been released');
    }

    if (isRequester) {
      if (transaction.requesterConfirmed) {
        throw ApiError.badRequest("You've already confirmed completion for this transaction");
      }
      transaction.requesterConfirmed = true;
      transaction.requesterConfirmedAt = new Date();
    } else {
      if (transaction.providerConfirmed) {
        throw ApiError.badRequest("You've already confirmed completion for this transaction");
      }
      transaction.providerConfirmed = true;
      transaction.providerConfirmedAt = new Date();
    }

    if (transaction.requesterConfirmed && transaction.providerConfirmed) {
      transaction.status = 'released';
      transaction.releasedAt = new Date();
      logger.info(`[Transaction] Escrow released for ${transaction._id} — ৳${transaction.amount} BDT to provider.`);
    }

    await transaction.save();

    if (transaction.status === 'released') {
      const credits = creditWalletService.creditsForTradeValue(transaction.amount);
      await creditWalletService.earnCredits(
        transaction.requester,
        credits,
        `Completed trade as requester — "${transaction.listingTitle}"`,
        { relatedTransaction: transaction._id }
      );
      await creditWalletService.earnCredits(
        transaction.provider,
        credits,
        `Completed trade as provider — "${transaction.listingTitle}"`,
        { relatedTransaction: transaction._id }
      );
    }

    return transaction;
=======
    return { totalIncome, count: paidTransactions.length, transactions: paidTransactions };
>>>>>>> Stashed changes
  },
};

module.exports = transactionService;