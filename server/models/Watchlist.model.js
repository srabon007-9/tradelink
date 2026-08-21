'use strict';

/**
 * models/Watchlist.model.js — Watchlist
 *
 * A user watches a skill category with a target price threshold and a
 * direction ('below' or 'above'). A separate periodic job (see
 * jobs/watchlistCron.js) compares each active watch against the
 * category's current live price — set by the Dynamic Valuation Engine —
 * and emails the user the moment the condition is met. This subsystem
 * only ever *reads* that price; it never touches the valuation formula.
 *
 * Once triggered, a watch stops re-checking (status flips to 'triggered')
 * so a price that stays past the threshold doesn't spam the user every
 * cycle. The user can reactivate it to resume watching.
 */

const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    condition: {
      type: String,
      enum: ['below', 'above'],
      required: [true, 'Condition is required — notify when price goes below or above the threshold'],
    },
    thresholdBDT: {
      type: Number,
      required: [true, 'Target price threshold is required'],
      min: [0, 'Threshold cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'triggered'],
      default: 'active',
      index: true,
    },
    triggeredAt: Date,
    triggeredAtPriceBDT: Number,
  },
  { timestamps: true }
);

// Prevent saving the exact same watch twice.
WatchlistSchema.index({ user: 1, category: 1, condition: 1, thresholdBDT: 1 }, { unique: true });
WatchlistSchema.index({ status: 1, category: 1 });

const Watchlist = mongoose.model('Watchlist', WatchlistSchema);

module.exports = Watchlist;
