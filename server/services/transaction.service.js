'use strict';

/**
 * services/transaction.service.js — Escrow System (feature name: "Transaction")
 *
 * Business logic for the escrow ledger: opened the moment a trade
 * proposal is accepted, held 'pending', and released to the provider
 * only once both the requester and the provider have independently
 * confirmed the work was completed.
 */

const Transaction = require('../models/Transaction.model');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const transactionService = {
  /**
   * Called from tradeProposal.service.js the instant a proposal is
   * accepted — opens the escrow hold for that trade.
   * @param {import('../models/TradeProposal.model')} proposal
   */
  createForProposal: async proposal => {
    const existing = await Transaction.findOne({ tradeProposal: proposal._id });
    if (existing) return existing;

    const transaction = await Transaction.create({
      tradeProposal: proposal._id,
      requester: proposal.requester,
      provider: proposal.provider,
      listingTitle: proposal.listingTitle,
      amount: proposal.priceAtProposal,
    });

    logger.info(`[Transaction] Escrow opened for proposal ${proposal._id} — ৳${transaction.amount} BDT pending.`);
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
    if (!transaction) throw ApiError.notFound('Transaction not found');

    if (transaction.requester._id.toString() !== userId && transaction.provider._id.toString() !== userId) {
      throw ApiError.forbidden('You are not part of this transaction');
    }
    return transaction;
  },

  /**
   * Either party confirms the work was completed. Once both have
   * confirmed, the escrow releases to the provider.
   */
  confirmCompletion: async (id, userId) => {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw ApiError.notFound('Transaction not found');

    const isRequester = transaction.requester.toString() === userId;
    const isProvider = transaction.provider.toString() === userId;
    if (!isRequester && !isProvider) {
      throw ApiError.forbidden('You are not part of this transaction');
    }

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
    return transaction;
  },
};

module.exports = transactionService;
