'use strict';

/**
 * models/Review.model.js — Trade Review & Rating Schema
 *
 * After a trade proposal is accepted and completed, either party can leave
 * a review for the other. The rating feeds into the Reputation Score Engine
 * (see services/reputation.service.js).
 *
 * Constraints:
 *  - One review per reviewer per trade proposal (unique compound index)
 *  - Rating is 1–5 stars
 *  - isDisputed flag is reserved for future dispute system integration
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    tradeProposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradeProposal',
      required: [true, 'Trade proposal reference is required'],
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
      index: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment must be under 500 characters'],
      default: '',
      trim: true,
    },
    isDisputed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews: one reviewer can only review a given proposal once
ReviewSchema.index({ tradeProposal: 1, reviewer: 1 }, { unique: true });

// Efficient lookup for reputation calculations
ReviewSchema.index({ reviewee: 1, createdAt: -1 });

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;
