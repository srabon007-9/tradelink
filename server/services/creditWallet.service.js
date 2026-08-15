'use strict';

/**
 * services/creditWallet.service.js — Credit Wallet System
 *
 * Every user has a credit wallet (created lazily on first use). Credits
 * are earned by completing a trade — see transaction.service.js's
 * confirmCompletion, which calls earnCredits() for both the requester
 * and the provider the instant an escrow Transaction releases.
 *
 * Credits can be redeemed to discount a future trade's money cost — see
 * tradeProposal.service.js's createProposal, which calls
 * previewRedemption() to compute the capped discount and redeemCredits()
 * to actually spend them. Credits never replace money; the trade still
 * settles in BDT, just for a smaller amount.
 */

const CreditWallet = require('../models/CreditWallet.model');
const CreditLedgerEntry = require('../models/CreditLedgerEntry.model');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ─── Tunables ─────────────────────────────────────────────────────────────────

const BDT_PER_CREDIT_EARNED = 100; // 1 credit earned per ৳100 of completed trade value
const CREDIT_VALUE_IN_BDT = 10; // 1 credit is worth ৳10 off when redeemed
const MAX_DISCOUNT_PERCENT = 20; // redemption can never discount more than this share of the price

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrCreateWallet = async userId => {
  let wallet = await CreditWallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await CreditWallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

// ─── Service ──────────────────────────────────────────────────────────────────

const creditWalletService = {
  /** Credits earned for completing a trade of this money value. */
  creditsForTradeValue: amountBDT => Math.max(1, Math.round(amountBDT / BDT_PER_CREDIT_EARNED)),

  /** Wallet balance + recent history for the logged-in user. */
  getMyWallet: async userId => {
    const wallet = await getOrCreateWallet(userId);
    const entries = await CreditLedgerEntry.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();

    return {
      balance: wallet.balance,
      creditValueInBDT: CREDIT_VALUE_IN_BDT,
      maxDiscountPercent: MAX_DISCOUNT_PERCENT,
      entries,
    };
  },

  /**
   * Pure calculation — how much of `priceBDT` would `creditsRequested`
   * actually discount, once capped by the user's balance and the max
   * discount percentage. Never throws; clamps to what's actually usable.
   */
  previewRedemption: async (userId, priceBDT, creditsRequested = 0) => {
    const wallet = await getOrCreateWallet(userId);

    const maxDiscountBDT = Math.floor((priceBDT * MAX_DISCOUNT_PERCENT) / 100);
    const maxCreditsByDiscount = Math.floor(maxDiscountBDT / CREDIT_VALUE_IN_BDT);
    const maxCreditsAllowed = Math.max(0, Math.min(wallet.balance, maxCreditsByDiscount));

    const creditsApplied = Math.max(0, Math.min(creditsRequested, maxCreditsAllowed));
    const discountBDT = creditsApplied * CREDIT_VALUE_IN_BDT;
    const finalPriceBDT = Math.round((priceBDT - discountBDT) * 100) / 100;

    return {
      walletBalance: wallet.balance,
      creditsApplied,
      discountBDT,
      finalPriceBDT,
      maxCreditsAllowed,
      creditValueInBDT: CREDIT_VALUE_IN_BDT,
      maxDiscountPercent: MAX_DISCOUNT_PERCENT,
    };
  },

  /** Award credits (e.g. on trade completion). */
  earnCredits: async (userId, amount, reason, { relatedTransaction } = {}) => {
    if (amount <= 0) return null;

    const wallet = await getOrCreateWallet(userId);
    wallet.balance += amount;
    await wallet.save();

    const entry = await CreditLedgerEntry.create({
      user: userId,
      type: 'earned',
      amount,
      reason,
      balanceAfter: wallet.balance,
      relatedTransaction,
    });

    logger.info(`[CreditWallet] ${userId} earned ${amount} credits (${reason}) — balance now ${wallet.balance}`);
    return entry;
  },

  /**
   * Spend credits (e.g. redeeming toward a trade proposal). Re-validates
   * against the current balance — never trust a client-supplied amount.
   */
  redeemCredits: async (userId, amount, reason, { relatedTradeProposal } = {}) => {
    if (amount <= 0) return null;

    const wallet = await getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw ApiError.badRequest('Not enough credits for that redemption');
    }

    wallet.balance -= amount;
    await wallet.save();

    const entry = await CreditLedgerEntry.create({
      user: userId,
      type: 'redeemed',
      amount,
      reason,
      balanceAfter: wallet.balance,
      relatedTradeProposal,
    });

    logger.info(`[CreditWallet] ${userId} redeemed ${amount} credits (${reason}) — balance now ${wallet.balance}`);
    return entry;
  },
};

module.exports = creditWalletService;
