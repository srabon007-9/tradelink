'use strict';

/**
 * models/CreditWallet.model.js — Credit Wallet System
 *
 * One wallet per user. Credits are earned by completing a trade (as
 * either the provider or the requester — see transaction.service.js,
 * which awards credits the moment an escrow Transaction releases) and
 * can be redeemed to discount the money cost of a future trade proposal
 * (see tradeProposal.service.js), up to a capped percentage. Credits are
 * never a substitute for money — the underlying trade still settles in
 * BDT through the Escrow/Transaction system.
 *
 * balance is a cached running total; every change to it is also recorded
 * as a CreditLedgerEntry so a user can see exactly how they earned or
 * spent their credits.
 */

const mongoose = require('mongoose');

const CreditWalletSchema = new mongoose.Schema(
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
      min: 0,
    },
  },
  { timestamps: true }
);

const CreditWallet = mongoose.model('CreditWallet', CreditWalletSchema);

module.exports = CreditWallet;
