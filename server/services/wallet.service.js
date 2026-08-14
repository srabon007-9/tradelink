'use strict';

/**
 * services/wallet.service.js — Credit Wallet Business Logic
 *
 * Provides reusable functions for purchasing, earning, spending, and awarding
 * bonus TradeLink Credits. Permanent data persistence in MongoDB is guaranteed.
 */

const Wallet = require('../models/Wallet.model');
const WalletTransaction = require('../models/WalletTransaction.model');
const User = require('../models/User.model');
const emailService = require('./email.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Available BDT → TradeLink Credit packages
const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Package',
    bdtAmount: 100,
    credits: 100,
    bonusLabel: null,
  },
  popular: {
    id: 'popular',
    name: 'Popular Package',
    bdtAmount: 500,
    credits: 550,
    bonusLabel: '+50 Bonus Credits',
  },
  pro: {
    id: 'pro',
    name: 'Pro Package',
    bdtAmount: 1000,
    credits: 1200,
    bonusLabel: '+200 Bonus Credits',
  },
};

/** Helper to trigger email notification safely without blocking or throwing */
const notifyUserAsync = async (userId, type, amount, balanceAfter, bdtAmount, description) => {
  try {
    const userDoc = await User.findById(userId).select('name email').lean();
    if (userDoc && userDoc.email) {
      emailService.sendWalletNotification({
        toEmail: userDoc.email,
        userName: userDoc.name,
        type,
        amount,
        balanceAfter,
        bdtAmount,
        description,
      });
    }
  } catch (err) {
    logger.warn(`[WalletService] Email notification lookup failed: ${err.message}`);
  }
};

const walletService = {
  /** Exposed packages list for UI / API */
  CREDIT_PACKAGES,

  /**
   * Find a user's wallet, or lazily create a new one with 0 balance.
   */
  getOrCreateWallet: async userId => {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    return wallet;
  },

  /**
   * Returns wallet balance and aggregated summary statistics (total purchased, earned, spent, bonus).
   */
  getWalletSummary: async userId => {
    const wallet = await walletService.getOrCreateWallet(userId);

    const totals = await WalletTransaction.aggregate([
      { $match: { user: wallet.user } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const summaryMap = totals.reduce((acc, curr) => {
      acc[curr._id] = curr.totalAmount;
      return acc;
    }, {});

    return {
      balance: wallet.balance,
      totalPurchased: summaryMap.purchase || 0,
      totalEarned: summaryMap.earned || 0,
      totalSpent: Math.abs(summaryMap.spent || 0),
      bonusCredits: summaryMap.bonus || 0,
    };
  },

  /**
   * Get transaction history for a user, sorted newest first.
   */
  getTransactions: async userId => {
    const wallet = await walletService.getOrCreateWallet(userId);
    return WalletTransaction.find({ user: wallet.user }).sort({ createdAt: -1 }).lean();
  },

  /**
   * Purchase credits using BDT packages.
   * Prevents double processing if paymentId reference is provided.
   */
  purchaseCredits: async (userId, { packageId, paymentId = null }) => {
    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      throw ApiError.badRequest(`Invalid credit package '${packageId}'. Choose starter, popular, or pro.`);
    }

    // Prevent duplicate credit award if paymentId is passed
    if (paymentId) {
      const existingPayment = await WalletTransaction.findOne({ paymentId });
      if (existingPayment) {
        throw ApiError.conflict(`Payment reference '${paymentId}' has already been processed.`);
      }
    }

    const wallet = await walletService.getOrCreateWallet(userId);

    // Increase balance
    wallet.balance += pkg.credits;
    await wallet.save();

    // Create transaction
    const description = `Purchased ${pkg.credits} TradeLink Credits for ৳${pkg.bdtAmount}`;
    const transaction = await WalletTransaction.create({
      user: userId,
      type: 'purchase',
      amount: pkg.credits,
      bdtAmount: pkg.bdtAmount,
      description,
      balanceAfter: wallet.balance,
      paymentId: paymentId || undefined,
    });

    // Trigger email notification
    notifyUserAsync(userId, 'purchase', pkg.credits, wallet.balance, pkg.bdtAmount, description);

    return { wallet, transaction };
  },

  /**
   * Earn credits by providing a skill service.
   */
  addCredits: async (userId, amount, reason) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw ApiError.badRequest('Amount to add must be a positive number');
    }

    const wallet = await walletService.getOrCreateWallet(userId);

    wallet.balance += numericAmount;
    await wallet.save();

    const description = reason || 'Earned credits for providing skill service';
    const transaction = await WalletTransaction.create({
      user: userId,
      type: 'earned',
      amount: numericAmount,
      description,
      balanceAfter: wallet.balance,
    });

    notifyUserAsync(userId, 'earned', numericAmount, wallet.balance, null, description);

    return { wallet, transaction };
  },

  /**
   * Spend credits to request/learn a skill.
   * GUARANTEE: Rejects if balance is insufficient. Balance can NEVER become negative.
   */
  spendCredits: async (userId, amount, reason) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw ApiError.badRequest('Amount to spend must be a positive number');
    }

    const wallet = await walletService.getOrCreateWallet(userId);

    if (wallet.balance < numericAmount) {
      throw ApiError.badRequest(
        `Insufficient credits. Your balance is ${wallet.balance} Credits, but ${numericAmount} Credits are required.`
      );
    }

    wallet.balance -= numericAmount;
    await wallet.save();

    const description = reason || 'Spent credits to request skill learning';
    const transaction = await WalletTransaction.create({
      user: userId,
      type: 'spent',
      amount: -numericAmount,
      description,
      balanceAfter: wallet.balance,
    });

    notifyUserAsync(userId, 'spent', -numericAmount, wallet.balance, null, description);

    return { wallet, transaction };
  },

  /**
   * Award activity bonus credits to a student.
   */
  addBonusCredits: async (userId, amount, reason) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw ApiError.badRequest('Bonus amount must be a positive number');
    }

    const wallet = await walletService.getOrCreateWallet(userId);

    wallet.balance += numericAmount;
    await wallet.save();

    const description = reason || 'TradeLink activity bonus';
    const transaction = await WalletTransaction.create({
      user: userId,
      type: 'bonus',
      amount: numericAmount,
      description,
      balanceAfter: wallet.balance,
    });

    notifyUserAsync(userId, 'bonus', numericAmount, wallet.balance, null, description);

    return { wallet, transaction };
  },
};

module.exports = walletService;
