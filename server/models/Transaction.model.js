'use strict';

/**
 * models/Transaction.model.js — Escrow System (feature name: "Transaction")
 *
 * Opened automatically the moment a Trade Proposal is accepted (see
 * tradeProposal.service.js's acceptProposal). The agreed price is held in
 * a 'pending' state — not released to the provider — until BOTH the
 * requester and the provider independently confirm the work/session was
 * completed. This is what protects both sides from either party backing
 * out mid-trade.
 */

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    tradeProposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradeProposal',
      required: true,
      unique: true,
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    listingTitle: { type: String, required: true },

    // Locked at creation from the trade proposal's priceAtProposal (BDT).
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'released'],
      default: 'pending',
      index: true,
    },

    requesterConfirmed: { type: Boolean, default: false },
    providerConfirmed: { type: Boolean, default: false },
    requesterConfirmedAt: Date,
    providerConfirmedAt: Date,
    releasedAt: Date,
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
