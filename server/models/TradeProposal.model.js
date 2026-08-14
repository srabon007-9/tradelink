'use strict';

/**
 * models/TradeProposal.model.js — Trade Proposal Builder With Session Scheduling
 *
 * A requester proposes booking a provider's skill listing at its live
 * valuation-engine price, for a specific session time. The price is
 * captured at proposal time (priceAtProposal) so both sides are looking at
 * the exact same number — it doesn't drift if the live price moves later.
 *
 * requesterAccepted is true from creation (proposing IS committing, since
 * the requester has already seen the live price before submitting).
 * providerAccepted flips true when the provider accepts; once both are
 * true the proposal is 'accepted' and a shared Google Calendar session is
 * created for both users (see services/tradeProposal.service.js).
 *
 * Listing details are denormalized (listingTitle/category) so a proposal
 * stays meaningful and displayable even if the underlying listing is later
 * edited or deleted.
 */

const mongoose = require('mongoose');

const TradeProposalSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillListing',
      required: true,
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
    category: { type: String, required: true },

    // The exact live valuation-engine price at the moment of proposal —
    // the number both parties see and are committing to.
    priceAtProposal: {
      type: Number,
      required: true,
      min: 0,
    },

    proposedSessionAt: {
      type: Date,
      required: [true, 'A proposed session time is required'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message must be under 500 characters'],
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    requesterAccepted: { type: Boolean, default: true },
    providerAccepted: { type: Boolean, default: false },

    // ─── Session (populated once both sides accept) ────────────────────────────
    session: {
      scheduledAt: Date,
      durationMinutes: { type: Number, default: 60 },
      calendarSynced: { type: Boolean, default: false },
      calendarEventId: String,
      calendarEventLink: String,
      calendarError: String,
    },
  },
  { timestamps: true }
);

TradeProposalSchema.index({ requester: 1, status: 1 });
TradeProposalSchema.index({ provider: 1, status: 1 });

const TradeProposal = mongoose.model('TradeProposal', TradeProposalSchema);

module.exports = TradeProposal;
