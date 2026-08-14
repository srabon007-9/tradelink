'use strict';

/**
 * models/Wallet.model.js — Student Credit Wallet
 *
 * Stores the persistent TradeLink credit balance for a student.
 * Credits are an internal platform currency (NOT BDT).
 * MongoDB is the permanent source of truth for all balances.
 */

const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Wallet balance cannot be negative'],
    },
  },
  { timestamps: true }
);

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
