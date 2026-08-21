'use strict';

/**
 * models/CreditLedgerEntry.model.js — Credit Wallet System (history)
 *
 * An append-only log of every credit earn/redeem event, so a user's
 * wallet history is fully explainable rather than just a bare number.
 * balanceAfter is a snapshot for easy display, not authoritative — the
 * wallet's own `balance` field is the source of truth.
 */

const mongoose = require('mongoose');

const CreditLedgerEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['earned', 'redeemed'],
      required: true,
    },
    // Always positive — `type` tells you the direction.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    // Whichever of these applies, set at creation for traceability.
    relatedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    relatedTradeProposal: { type: mongoose.Schema.Types.ObjectId, ref: 'TradeProposal' },
  },
  { timestamps: true }
);

CreditLedgerEntrySchema.index({ user: 1, createdAt: -1 });

const CreditLedgerEntry = mongoose.model('CreditLedgerEntry', CreditLedgerEntrySchema);

module.exports = CreditLedgerEntry;
