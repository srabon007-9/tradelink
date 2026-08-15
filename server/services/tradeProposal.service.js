'use strict';

/**
 * services/tradeProposal.service.js — Trade Proposal Builder With Session Scheduling
 */

const TradeProposal = require('../models/TradeProposal.model');
const SkillListing = require('../models/SkillListing.model');
const SkillCategory = require('../models/SkillCategory.model');
const User = require('../models/User.model');
const valuationService = require('./valuation.service');
const googleCalendarService = require('./googleCalendar.service');
const transactionService = require('./transaction.service');
const creditWalletService = require('./creditWallet.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const SESSION_DURATION_MINUTES = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** The live valuation-engine price for a category right now, or null if untracked. */
const getLivePrice = async category => {
  if (category === 'other') return null;
  const categoryDoc = await SkillCategory.findOne({ slug: category }).select('priceBDT').lean();
  return categoryDoc ? categoryDoc.priceBDT : null;
};

/** Best-effort demand adjustment — a proposal's lifecycle shouldn't fail on a valuation hiccup. */
const adjustDemand = async (category, delta) => {
  if (!category || category === 'other') return;
  try {
    await valuationService.updateDemand(category, delta);
  } catch (err) {
    logger.error(`[TradeProposal] Failed to adjust demand for '${category}' (${delta}): ${err.message}`);
  }
};

// ─── Service ──────────────────────────────────────────────────────────────────

const tradeProposalService = {
  /**
   * Propose a trade: book a listing's session at its current live price,
   * optionally redeeming wallet credits to discount that price.
   * @param {string} requesterId
   * @param {{ listingId: string, proposedSessionAt: string, message?: string, creditsToRedeem?: number }} data
   */
  createProposal: async (requesterId, { listingId, proposedSessionAt, message, creditsToRedeem }) => {
    const listing = await SkillListing.findById(listingId);
    if (!listing) throw ApiError.notFound('Skill listing not found');
    if (listing.status !== 'active') {
      throw ApiError.badRequest('This listing is not currently active');
    }
    if (listing.user.toString() === requesterId) {
      throw ApiError.badRequest('You cannot propose a trade on your own listing');
    }

    const priceAtProposal = await getLivePrice(listing.category);
    if (priceAtProposal == null) {
      throw ApiError.badRequest(
        "This skill isn't priced by the valuation engine yet, so trade proposals aren't available for it."
      );
    }

    const sessionDate = new Date(proposedSessionAt);
    if (Number.isNaN(sessionDate.getTime()) || sessionDate <= new Date()) {
      throw ApiError.badRequest('Proposed session time must be a valid date in the future');
    }

    // Cap the redemption against the requester's actual balance and the
    // max-discount-percent rule — never trust the requested amount as-is.
    const redemption = await creditWalletService.previewRedemption(
      requesterId,
      priceAtProposal,
      creditsToRedeem || 0
    );

    const proposal = await TradeProposal.create({
      listing: listing._id,
      requester: requesterId,
      provider: listing.user,
      listingTitle: listing.title,
      category: listing.category,
      priceAtProposal,
      creditsRedeemed: redemption.creditsApplied,
      discountBDT: redemption.discountBDT,
      finalPriceBDT: redemption.finalPriceBDT,
      proposedSessionAt: sessionDate,
      message: message || '',
    });

    if (redemption.creditsApplied > 0) {
      await creditWalletService.redeemCredits(
        requesterId,
        redemption.creditsApplied,
        `Redeemed toward trade proposal for "${listing.title}"`,
        { relatedTradeProposal: proposal._id }
      );
    }

    await adjustDemand(listing.category, 1);

    return proposal;
  },

  /** Proposals the user sent, as requester. */
  getSentProposals: async userId =>
    TradeProposal.find({ requester: userId })
      .sort({ createdAt: -1 })
      .populate('provider', 'name email avatar')
      .lean(),

  /** Proposals the user received, on listings they own as provider. */
  getReceivedProposals: async userId =>
    TradeProposal.find({ provider: userId })
      .sort({ createdAt: -1 })
      .populate('requester', 'name email avatar')
      .lean(),

  getProposalById: async (id, userId) => {
    const proposal = await TradeProposal.findById(id)
      .populate('requester', 'name email avatar')
      .populate('provider', 'name email avatar');
    if (!proposal) throw ApiError.notFound('Trade proposal not found');
    if (proposal.requester._id.toString() !== userId && proposal.provider._id.toString() !== userId) {
      throw ApiError.forbidden('You are not part of this trade proposal');
    }
    return proposal;
  },

  /**
   * Provider accepts — the second and final acceptance. Flips the
   * proposal to 'accepted', releases its demand slot, and (best effort)
   * creates a shared Google Calendar session for both users.
   */
  acceptProposal: async (id, providerId) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) throw ApiError.notFound('Trade proposal not found');
    if (proposal.provider.toString() !== providerId) {
      throw ApiError.forbidden('Only the provider can accept this proposal');
    }
    if (proposal.status !== 'pending') {
      throw ApiError.badRequest(`This proposal is already ${proposal.status}`);
    }

    const [requester, provider] = await Promise.all([
      User.findById(proposal.requester).select('name email'),
      User.findById(proposal.provider).select('name email'),
    ]);

    const calendarResult = await googleCalendarService.createSessionEvent({
      summary: `TradeLink session: ${proposal.listingTitle}`,
      description:
        `Skill exchange session between ${requester.name} and ${provider.name} via TradeLink.\n` +
        `Agreed price: ৳${proposal.finalPriceBDT} BDT` +
        (proposal.creditsRedeemed > 0
          ? ` (৳${proposal.priceAtProposal} less ${proposal.creditsRedeemed} redeemed credits).`
          : '.') +
        (proposal.message ? `\nNote: ${proposal.message}` : ''),
      startTime: proposal.proposedSessionAt,
      durationMinutes: SESSION_DURATION_MINUTES,
      attendeeEmails: [requester.email, provider.email],
    });

    proposal.providerAccepted = true;
    proposal.status = 'accepted';
    proposal.session = {
      scheduledAt: proposal.proposedSessionAt,
      durationMinutes: SESSION_DURATION_MINUTES,
      calendarSynced: calendarResult.synced,
      calendarEventId: calendarResult.eventId,
      calendarEventLink: calendarResult.eventLink,
      calendarError: calendarResult.error,
    };

    await proposal.save();
    await adjustDemand(proposal.category, -1);
    await transactionService.createForProposal(proposal);

    return proposal;
  },

  declineProposal: async (id, providerId) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) throw ApiError.notFound('Trade proposal not found');
    if (proposal.provider.toString() !== providerId) {
      throw ApiError.forbidden('Only the provider can decline this proposal');
    }
    if (proposal.status !== 'pending') {
      throw ApiError.badRequest(`This proposal is already ${proposal.status}`);
    }

    proposal.status = 'declined';
    await proposal.save();
    await adjustDemand(proposal.category, -1);

    return proposal;
  },

  cancelProposal: async (id, requesterId) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) throw ApiError.notFound('Trade proposal not found');
    if (proposal.requester.toString() !== requesterId) {
      throw ApiError.forbidden('Only the requester can cancel this proposal');
    }
    if (proposal.status !== 'pending') {
      throw ApiError.badRequest(`This proposal is already ${proposal.status}`);
    }

    proposal.status = 'cancelled';
    await proposal.save();
    await adjustDemand(proposal.category, -1);

    return proposal;
  },
};

module.exports = tradeProposalService;
