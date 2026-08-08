'use strict';

/**
 * models/ValuationSnapshot.model.js — Valuation History
 *
 * Every time a category's credit value is recalculated, a snapshot is saved here.
 * This powers:
 *  - Historical charts (stock-price-style view of credit value over time)
 *  - Dispute resolution (what was the market rate at the time of a trade?)
 *  - Audit trail (why did the price change?)
 */

const mongoose = require('mongoose');

const ValuationSnapshotSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillCategory',
      required: true,
      index: true,
    },
    categorySlug: {
      type: String,
      required: true,
      index: true,
    },

    // ─── Calculated Price ─────────────────────────────────────────────────────
    priceBDT: {
      type: Number,
      required: true,
    },

    // ─── Inputs (snapshot of market state at calculation time) ────────────────
    supply: { type: Number, required: true },
    demand: { type: Number, required: true },

    // ─── Formula Factors (full transparency — nothing is a black box) ─────────
    ratio:      { type: Number, required: true }, // demand / max(supply, 1)
    multiplier: { type: Number, required: true }, // ratio ^ alpha
    baseRate:   { type: Number, required: true }, // baseline credit value
    alpha:      { type: Number, required: true }, // sensitivity exponent used
    floor:      { type: Number, required: true }, // floor that was in effect
    ceiling:    { type: Number, required: true }, // ceiling that was in effect

    // ─── Context ──────────────────────────────────────────────────────────────
    trigger: {
      type: String,
      enum: ['scheduled', 'event', 'manual', 'seed'],
      required: true,
    },
    explanation: {
      type: String, // human-readable walkthrough of the formula
    },
  },
  {
    timestamps: true,
    // TTL index: automatically delete snapshots older than 90 days
    // to keep the collection from growing unbounded
  }
);

// Compound index for efficient history queries (category + time)
ValuationSnapshotSchema.index({ category: 1, createdAt: -1 });
ValuationSnapshotSchema.index({ categorySlug: 1, createdAt: -1 });

const ValuationSnapshot = mongoose.model('ValuationSnapshot', ValuationSnapshotSchema);

module.exports = ValuationSnapshot;
