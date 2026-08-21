'use strict';

/**
 * services/transaction.service.js — Escrow System + SSLCommerz Payment
 *
 * Transaction lifecycle:
 *
 *   pending
 *       ↓
 *   delivered
 *       ↓
 *   awaiting_payment
 *       ↓
 *   paid
 *
 * Payment is handled through SSLCommerz.
 */

const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const sslcommerzService = require('./sslcommerz.service');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const callbackUrls = () => ({
  successUrl: `${config.serverUrl}/api/payments/success`,
  failUrl: `${config.serverUrl}/api/payments/fail`,
  cancelUrl: `${config.serverUrl}/api/payments/cancel`,
  ipnUrl: `${config.serverUrl}/api/payments/ipn`,
});

/**
 * Confirms the user is a party to the transaction
 * and returns which side they are on.
 */
const assertParty = (transaction, userId) => {
  const isRequester =
    transaction.requester.toString() === userId;

  const isProvider =
    transaction.provider.toString() === userId;

  if (!isRequester && !isProvider) {
    throw ApiError.forbidden(
      'You are not part of this transaction'
    );
  }

  return {
    isRequester,
    isProvider,
  };
};

// ─── Service ──────────────────────────────────────────────────────────────────

const transactionService = {
  /**
   * Called when a trade proposal is accepted.
   * Opens the escrow transaction.
   */
  createForProposal: async proposal => {
    const existing = await Transaction.findOne({
      tradeProposal: proposal._id,
    });

    if (existing) {
      return existing;
    }

    const transaction = await Transaction.create({
      tradeProposal: proposal._id,
      requester: proposal.requester,
      provider: proposal.provider,
      listingTitle: proposal.listingTitle,
      amount: proposal.finalPriceBDT,
    });

    logger.info(
      `[Transaction] Escrow opened for proposal ${proposal._id} — ` +
      `৳${transaction.amount} BDT pending delivery.`
    );

    return transaction;
  },

  /**
   * Every transaction the logged-in user is part of.
   */
  getMyTransactions: async userId => {
    const transactions = await Transaction.find({
      $or: [
        { requester: userId },
        { provider: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('requester', 'name email avatar')
      .populate('provider', 'name email avatar')
      .lean();

    return transactions.map(t => ({
      ...t,
      viewerRole:
        t.requester._id.toString() === userId
          ? 'requester'
          : 'provider',
    }));
  },

  /**
   * Get one transaction.
   */
  getTransactionById: async (id, userId) => {
    const transaction = await Transaction.findById(id)
      .populate('requester', 'name email avatar')
      .populate('provider', 'name email avatar');

    if (!transaction) {
      throw ApiError.notFound(
        'Transaction not found'
      );
    }

    assertParty(transaction, userId);

    return transaction;
  },

  /**
   * Step 1:
   * Provider confirms that the service was delivered.
   */
  confirmDelivery: async (id, userId) => {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw ApiError.notFound(
        'Transaction not found'
      );
    }

    const { isProvider } =
      assertParty(transaction, userId);

    if (!isProvider) {
      throw ApiError.forbidden(
        'Only the provider can confirm delivery'
      );
    }

    if (transaction.status !== 'pending') {
      throw ApiError.badRequest(
        `Delivery was already confirmed for this transaction ` +
        `(status: ${transaction.status})`
      );
    }

    transaction.providerConfirmed = true;
    transaction.providerConfirmedAt = new Date();
    transaction.status = 'delivered';

    await transaction.save();

    logger.info(
      `[Transaction] ${transaction._id} marked delivered by provider.`
    );

    return transaction;
  },

  /**
   * Step 2:
   * Requester confirms they received the service.
   */
  confirmReceipt: async (id, userId) => {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw ApiError.notFound(
        'Transaction not found'
      );
    }

    const { isRequester } =
      assertParty(transaction, userId);

    if (!isRequester) {
      throw ApiError.forbidden(
        'Only the requester can confirm receipt'
      );
    }

    if (transaction.status === 'pending') {
      throw ApiError.badRequest(
        "The provider hasn't confirmed delivery yet — " +
        "there's nothing to confirm."
      );
    }

    if (transaction.status !== 'delivered') {
      throw ApiError.badRequest(
        `Receipt was already confirmed for this transaction ` +
        `(status: ${transaction.status})`
      );
    }

    transaction.requesterConfirmed = true;
    transaction.requesterConfirmedAt = new Date();
    transaction.status = 'awaiting_payment';

    await transaction.save();

    logger.info(
      `[Transaction] ${transaction._id} receipt confirmed by requester — ` +
      `ready for payment.`
    );

    return transaction;
  },

  /**
   * Backwards-compatible confirmation method.
   *
   * If an older frontend/route still calls:
   *
   *   PATCH /transactions/:id/confirm
   *
   * this method automatically performs the correct step
   * depending on the logged-in user's role.
   */
  confirmCompletion: async (id, userId) => {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw ApiError.notFound(
        'Transaction not found'
      );
    }

    const {
      isRequester,
      isProvider,
    } = assertParty(transaction, userId);

    if (isProvider) {
      return transactionService.confirmDelivery(
        id,
        userId
      );
    }

    if (isRequester) {
      return transactionService.confirmReceipt(
        id,
        userId
      );
    }

    throw ApiError.forbidden(
      'You are not part of this transaction'
    );
  },

  /**
   * Step 3:
   * Requester starts an SSLCommerz payment session.
   */
  initiatePayment: async (id, userId) => {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw ApiError.notFound(
        'Transaction not found'
      );
    }

    const { isRequester } =
      assertParty(transaction, userId);

    if (!isRequester) {
      throw ApiError.forbidden(
        'Only the requester can pay for this transaction'
      );
    }

    if (
      ![
        'awaiting_payment',
        'payment_failed',
      ].includes(transaction.status)
    ) {
      throw ApiError.badRequest(
        `This transaction isn't ready for payment yet ` +
        `(status: ${transaction.status})`
      );
    }

    const requester = await User.findById(
      transaction.requester
    ).select('name email phone');

    if (!requester) {
      throw ApiError.notFound(
        'Requester not found'
      );
    }

    const tranId =
      `TXN-${transaction._id}-${Date.now()}`;

    let gatewayUrl;

    try {
      ({ gatewayUrl } =
        await sslcommerzService.initiateSession({
          tranId,
          amount: transaction.amount,
          customerName: requester.name,
          customerEmail: requester.email,
          customerPhone: requester.phone,
          productName: transaction.listingTitle,
          ...callbackUrls(),
        }));
    } catch (err) {
      logger.error(
        `[Transaction] SSLCommerz session init failed for ` +
        `${transaction._id}: ${err.message}`
      );

      throw new ApiError(
        502,
        err.message ||
        'Could not start the payment session. Please try again shortly.'
      );
    }

    transaction.payment.tranId = tranId;
    transaction.payment.status = 'initiated';

    await transaction.save();

    logger.info(
      `[Transaction] Payment session opened for ${transaction._id} ` +
      `(tran_id=${tranId}).`
    );

    return {
      gatewayUrl,
    };
  },

  /**
   * Finalizes a payment after SSLCommerz validation.
   *
   * Called by success redirect and IPN webhook.
   */
  finalizePayment: async (tranId, valId) => {
    if (!tranId) {
      return null;
    }

    const transaction =
      await Transaction.findOne({
        'payment.tranId': tranId,
      });

    if (!transaction) {
      logger.error(
        `[Transaction] Payment callback for unknown ` +
        `tran_id: ${tranId}`
      );

      return null;
    }

    // Already paid — don't process twice.
    if (transaction.status === 'paid') {
      return transaction;
    }

    let validation;

    try {
      validation =
        await sslcommerzService.validateTransaction(
          valId
        );
    } catch (err) {
      logger.error(
        `[Transaction] SSLCommerz validation call failed ` +
        `for ${transaction._id}: ${err.message}`
      );

      transaction.payment.status = 'failed';
      transaction.status = 'payment_failed';

      await transaction.save();

      return transaction;
    }

    const amountMatches =
      Math.round(validation.amount) ===
      Math.round(transaction.amount);

    if (
      !validation.isValid ||
      !amountMatches
    ) {
      transaction.payment.status = 'failed';

      transaction.payment.gatewayResponse =
        validation.raw;

      transaction.status =
        'payment_failed';

      await transaction.save();

      logger.error(
        `[Transaction] Payment validation failed for ` +
        `${transaction._id} ` +
        `(tran_id=${tranId}, ` +
        `amountMatches=${amountMatches}).`
      );

      return transaction;
    }

    transaction.status = 'paid';

    transaction.payment.status = 'paid';

    transaction.payment.valId =
      valId;

    transaction.payment.method =
      validation.cardIssuer ||
      validation.cardType ||
      'Unknown';

    transaction.payment.gatewayResponse =
      validation.raw;

    transaction.payment.paidAt =
      new Date();

    transaction.releasedAt =
      new Date();

    await transaction.save();

    logger.info(
      `[Transaction] Payment confirmed for ` +
      `${transaction._id} — ` +
      `৳${transaction.amount} BDT paid to provider.`
    );

    return transaction;
  },

  /**
   * Marks a payment attempt as failed/cancelled.
   * The requester can retry.
   */
  markPaymentFailed: async tranId => {
    if (!tranId) {
      return null;
    }

    const transaction =
      await Transaction.findOne({
        'payment.tranId': tranId,
      });

    if (
      !transaction ||
      transaction.status === 'paid'
    ) {
      return transaction;
    }

    transaction.payment.status =
      'failed';

    transaction.status =
      'payment_failed';

    await transaction.save();

    logger.info(
      `[Transaction] Payment marked failed/cancelled ` +
      `for ${transaction._id} ` +
      `(tran_id=${tranId}).`
    );

    return transaction;
  },

  /**
   * Provider-only:
   * Returns the logged-in provider's paid transactions
   * and total income.
   */
  getMyIncome: async providerId => {
    const paidTransactions =
      await Transaction.find({
        provider: providerId,
        status: 'paid',
      })
        .sort({ 'payment.paidAt': -1 })
        .populate(
          'requester',
          'name email avatar'
        )
        .lean();

    const totalIncome =
      paidTransactions.reduce(
        (sum, transaction) =>
          sum + transaction.amount,
        0
      );

    return {
      totalIncome,
      count: paidTransactions.length,
      transactions: paidTransactions,
    };
  },
};

module.exports = transactionService;