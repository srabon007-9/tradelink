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
 *
 * There's no payment gateway or credit wallet wired up yet (those are
 * separate, not-yet-built features), so this models the escrow *state* —
 * the ledger record and its pending/released lifecycle — rather than
 * moving real money. Amount is denormalized from the proposal's already-
 * locked priceAtProposal, so it can never drift from what both parties
 * actually agreed to.
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
