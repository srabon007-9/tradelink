'use strict';

/**
 * services/transaction.service.js — Escrow System (feature name: "Transaction")
 */

const Transaction = require('../models/Transaction.model');
const creditWalletService = require('./creditWallet.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const transactionService = {
  createForProposal: async proposal => {
    const existing = await Transaction.findOne({ tradeProposal: proposal._id });
    if (existing) return existing;

    const transaction = await Transaction.create({
      tradeProposal: proposal._id,
      requester: proposal.requester,
      provider: proposal.provider,
      listingTitle: proposal.listingTitle,
      amount: proposal.finalPriceBDT,
    });

    logger.info(`[Transaction] Escrow opened for proposal ${proposal._id} — ৳${transaction.amount} BDT pending.`);
    return transaction;
  },

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
  },
};

module.exports = transactionService;
