'use strict';

/**
 * models/WalletTransaction.model.js — Wallet Transaction Ledger
 *
 * Immutable historical record of every wallet credit change (purchase, earned, spent, bonus).
 * Stores the resulting balance (balanceAfter) and optional bdtAmount for purchases.
 */

const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'earned', 'spent', 'bonus'],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
    },
    description: {
      type: String,
      required: [true, 'Transaction description is required'],
      trim: true,
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Balance after transaction is required'],
      min: [0, 'Balance after transaction cannot be negative'],
    },
    // Required only for 'purchase' transactions (stored in real Bangladeshi Taka)
    bdtAmount: {
      type: Number,
      default: null,
    },
    // Optional payment reference ID to prevent duplicate purchase processing
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);

module.exports = WalletTransaction;
