'use strict';

/**
 * models/DisputeMessage.model.js — Dispute Resolution Messaging Thread
 *
 * One shared thread per disputed TradeProposal — the requester, the
 * provider, and any admin all post into the same thread, so nothing is
 * said to one party behind the other's back. Only postable while the
 * proposal's status is 'disputed' (see tradeProposal.service.js's
 * postMessage) — once admin resolves it, the thread becomes read-only
 * history.
 */

const mongoose = require('mongoose');

const DisputeMessageSchema = new mongoose.Schema(
  {
    tradeProposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradeProposal',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['admin', 'requester', 'provider'],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

DisputeMessageSchema.index({ tradeProposal: 1, createdAt: 1 });

const DisputeMessage = mongoose.model('DisputeMessage', DisputeMessageSchema);

module.exports = DisputeMessage;
