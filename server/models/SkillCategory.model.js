'use strict';

/**
 * models/SkillCategory.model.js — Skill Category with Live Valuation
 *
 * Each document represents one skill category on TradeLink.
 * supply  = number of active providers currently offering this skill
 * demand  = number of open service requests for this skill
 * creditValue = current market price in credits (recalculated dynamically)
 */

const mongoose = require('mongoose');

const SkillCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },

    // ─── Live Metrics ──────────────────────────────────────────────────────────
    supply: {
      type: Number,
      default: 0,
      min: [0, 'Supply cannot be negative'],
    },
    demand: {
      type: Number,
      default: 0,
      min: [0, 'Demand cannot be negative'],
    },

    // ─── Price in BDT ──────────────────────────────────────────────────────────
    priceBDT: {
      type: Number,
      default: 1500,
    },

    // ─── Formula Parameters (configurable per category) ───────────────────────
    baseRate: {
      type: Number,
      default: 1500, // BDT price when supply === demand (balanced market)
    },
    floor: {
      type: Number,
      default: 500, // minimum price ever (~33% of base)
    },
    ceiling: {
      type: Number,
      default: 10000, // maximum price ever (~6.7× base)
    },
    alpha: {
      type: Number,
      default: 0.5, // sensitivity exponent: 0 = flat, 1 = linear, 0.5 = sqrt (recommended)
    },

    // ─── Last Calculation Details (for transparency) ──────────────────────────
    lastSnapshot: {
      priceBDT:    Number,
      ratio:       Number,   // demand / max(supply, 1)
      multiplier:  Number,   // ratio ^ alpha
      trigger:     String,   // 'scheduled' | 'event' | 'manual' | 'seed'
      explanation: String,   // human-readable formula walkthrough
      calculatedAt: Date,
    },
  },
  { timestamps: true }
);

const SkillCategory = mongoose.model('SkillCategory', SkillCategorySchema);

module.exports = SkillCategory;
