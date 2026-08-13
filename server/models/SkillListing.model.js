'use strict';

/**
 * models/SkillListing.model.js — Skill Listing Profiles
 *
 * A listing is one skill a user offers on TradeLink: title, description,
 * and a category (tied to the Dynamic Valuation Engine's SkillCategory, or
 * a free-text "other" category when the skill isn't in the seeded 10).
 *
 * Listings don't carry their own price — the cost is entirely determined
 * by the valuation engine's live price for the category (see
 * skillListing.service.js's withLivePrice). Every active listing on a
 * tracked category counts as one unit of supply for that category.
 */

const mongoose = require('mongoose');

const SkillListingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be under 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description must be under 1000 characters'],
    },

    // ─── Category ──────────────────────────────────────────────────────────────
    // Either the slug of one of the 10 seeded SkillCategory documents, or the
    // literal 'other' when the skill isn't in that list yet.
    category: {
      type: String,
      required: [true, 'Category is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    // Only used (and required) when category === 'other'.
    customCategoryName: {
      type: String,
      trim: true,
      maxlength: [100, 'Custom category name must be under 100 characters'],
      default: null,
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

SkillListingSchema.index({ category: 1, status: 1 });

// A custom name is required for 'other' listings and meaningless otherwise.
SkillListingSchema.pre('validate', function (next) {
  if (this.category === 'other' && !this.customCategoryName) {
    this.invalidate(
      'customCategoryName',
      'Custom category name is required when category is "other"'
    );
  }
  if (this.category !== 'other') {
    this.customCategoryName = null;
  }
  next();
});

const SkillListing = mongoose.model('SkillListing', SkillListingSchema);

module.exports = SkillListing;
