'use strict';

/**
 * models/Transaction.model.js — Escrow System (feature name: "Transaction")
 *
 * Opened automatically the moment a Trade Proposal is accepted (see
 * tradeProposal.service.js's acceptProposal). The agreed price is held
 * until real money has actually changed hands — the lifecycle is:
 *
 *   pending             → provider still owes the service
 *   delivered           → provider confirmed they delivered it
 *   awaiting_payment    → requester confirmed they received it; can now pay
 *   payment_submitted   → requester submitted a bKash Transaction ID;
 *                          waiting on the provider to verify it
 *   paid                → funds count as the provider's income — reached
 *                          either instantly (offline payment, requester's
 *                          own word is trusted) or once the provider
 *                          verifies a submitted bKash Transaction ID
 *   payment_failed      → reserved for a failed/cancelled SSLCommerz
 *                          attempt (legacy path, see payment.controller.js)
 *
 * Confirmation is intentionally sequential and enforced in
 * transaction.service.js: the requester can only confirm receipt AFTER the
 * provider confirms delivery, and can only pay AFTER confirming receipt.
 * Offline payment is a one-step, trust-based confirmation; bKash payment
 * requires the provider to independently verify the submitted Transaction
 * ID before funds count as released. That ordering is what protects both
 * sides from either party backing out mid-trade.
 *
 * Amount is denormalized from the proposal's already-locked
 * priceAtProposal, so it can never drift from what both parties agreed to.
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
      enum: ['pending', 'delivered', 'awaiting_payment', 'payment_submitted', 'paid', 'payment_failed'],
      default: 'pending',
      index: true,
    },

    // Step 1: provider confirms the service was delivered.
    providerConfirmed: { type: Boolean, default: false },
    providerConfirmedAt: Date,

    // Step 2: requester confirms they received it. Only valid once
    // providerConfirmed is already true (enforced in the service layer).
    requesterConfirmed: { type: Boolean, default: false },
    requesterConfirmedAt: Date,

    // Step 3: how the requester actually paid — offline (trusted, one-step)
    // or bKash (requester submits a Transaction ID, provider verifies it).
    payment: {
      method: { type: String, enum: ['offline', 'bkash', null], default: null },
      status: {
        type: String,
        enum: ['unpaid', 'pending_verification', 'paid', 'initiated', 'failed'],
        default: 'unpaid',
      },
      bkashTransactionId: { type: String, default: null }, // TrxID the requester typed in, for the provider to verify
      submittedAt: { type: Date, default: null }, // when the bKash Transaction ID was submitted
      verifiedAt: { type: Date, default: null }, // when the provider verified it
      paidAt: { type: Date, default: null },

      // Legacy SSLCommerz fields — no longer written by the active payment
      // flow, kept only so payment.controller.js's (now-unreachable)
      // webhook handlers don't break if ever hit.
      tranId: { type: String, default: null, index: true },
      valId: { type: String, default: null },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    // Set the moment payment is validated — when funds are considered
    // released to the provider.
    releasedAt: Date,
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;