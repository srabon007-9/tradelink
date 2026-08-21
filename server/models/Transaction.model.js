'use strict';

/**
 * models/Transaction.model.js — Escrow System (feature name: "Transaction")
 *
 * Opened automatically the moment a Trade Proposal is accepted (see
<<<<<<< Updated upstream
 * tradeProposal.service.js's acceptProposal). The agreed price is held in
 * a 'pending' state — not released to the provider — until BOTH the
 * requester and the provider independently confirm the work/session was
 * completed. This is what protects both sides from either party backing
 * out mid-trade.
=======
 * tradeProposal.service.js's acceptProposal). The agreed price is held
 * until real money has actually changed hands — the lifecycle is:
 *
 *   pending           → provider still owes the service
 *   delivered         → provider confirmed they delivered it
 *   awaiting_payment  → requester confirmed they received it; can now pay
 *   paid              → SSLCommerz payment validated; funds count as the
 *                        provider's income
 *   payment_failed    → a payment attempt failed/was cancelled; requester
 *                        can retry from here
 *
 * Confirmation is intentionally sequential and enforced in
 * transaction.service.js: the requester can only confirm receipt AFTER the
 * provider confirms delivery, and can only pay AFTER confirming receipt.
 * That ordering — plus never marking paid without SSLCommerz's own
 * server-to-server validation — is what protects both sides from either
 * party backing out mid-trade.
 *
 * Amount is denormalized from the proposal's already-locked
 * priceAtProposal, so it can never drift from what both parties agreed to.
>>>>>>> Stashed changes
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
      enum: ['pending', 'delivered', 'awaiting_payment', 'paid', 'payment_failed'],
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

    // Step 3: the actual SSLCommerz payment.
    payment: {
      method: { type: String, default: null }, // e.g. "bKash", "Visa" — from SSLCommerz's card_issuer/card_type
      status: {
        type: String,
        enum: ['unpaid', 'initiated', 'paid', 'failed'],
        default: 'unpaid',
      },
      tranId: { type: String, default: null, index: true }, // our generated tran_id for this payment attempt
      valId: { type: String, default: null }, // SSLCommerz's val_id, used to validate authenticity server-side
      gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null }, // raw validation response, for audit/debug
      paidAt: { type: Date, default: null },
    },

    // Set the moment payment is validated — when funds are considered
    // released to the provider.
    releasedAt: Date,
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;