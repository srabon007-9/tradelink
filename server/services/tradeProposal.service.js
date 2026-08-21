'use strict';

/**
 * services/tradeProposal.service.js — Trade Proposal Builder With Session Scheduling
 *
 * Business logic for proposing, accepting/declining, and cancelling trade
 * proposals. A proposal captures the exact live valuation-engine price at
 * the moment it's made, so both sides commit to a known number. Once the
 * provider accepts, a shared Google Calendar session is created (best
 * effort — see googleCalendar.service.js).
 *
 * A pending proposal is an open "request" for its category, exactly what
 * valuation.service.js's updateDemand() was built for — creating a
 * proposal counts as +1 demand, and it's released (-1) the moment the
 * proposal stops being pending (accepted, declined, or cancelled).
 *
 * The instant a proposal is accepted, an escrow hold is opened for it
 * (see transaction.service.js / the "Transaction" feature) — the agreed
 * price is held pending until both sides confirm the work was done.
 *
 * A requester can redeem Credit Wallet credits when proposing a trade to
 * discount its cost (see creditWallet.service.js) — the escrow that later
 * opens on acceptance holds the discounted finalPriceBDT, not the raw
 * priceAtProposal. If the proposal never becomes a real trade (declined or
 * cancelled), any redeemed credits are refunded — they were only ever
 * meant to discount a trade that actually happens.
 *
 * A requester can also mark a proposal urgent, adding a Time-Decay Rush
 * Pricing surcharge (see rushPricing.service.js) computed from how soon
 * proposedSessionAt is — that surcharge is applied to priceAtProposal
 * BEFORE the credit discount, so a bigger (rush-adjusted) price also
 * unlocks a bigger absolute discount under the same percentage cap.
 */

const TradeProposal = require('../models/TradeProposal.model');
const SkillListing = require('../models/SkillListing.model');
const SkillCategory = require('../models/SkillCategory.model');
const User = require('../models/User.model');
const DisputeMessage = require('../models/DisputeMessage.model');
const valuationService = require('./valuation.service');
const googleCalendarService = require('./googleCalendar.service');
const transactionService = require('./transaction.service');
const creditWalletService = require('./creditWallet.service');
const rushPricingService = require('./rushPricing.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const SESSION_DURATION_MINUTES = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** The live valuation-engine price for a category right now, or null if untracked. */
const getLivePrice = async category => {
  if (category === 'other') {return null;}
  const categoryDoc = await SkillCategory.findOne({ slug: category }).select('priceBDT').lean();
  return categoryDoc ? categoryDoc.priceBDT : null;
};

/** Best-effort demand adjustment — a proposal's lifecycle shouldn't fail on a valuation hiccup. */
const adjustDemand = async (category, delta) => {
  if (!category || category === 'other') {return;}
  try {
    await valuationService.updateDemand(category, delta);
  } catch (err) {
    logger.error(`[TradeProposal] Failed to adjust demand for '${category}' (${delta}): ${err.message}`);
  }
};

/**
 * Redeemed credits were only ever meant to discount a trade that actually
 * happens — if the proposal falls through (declined/cancelled) before that,
 * give them back rather than letting them vanish.
 */
const refundRedeemedCredits = async proposal => {
  if (!proposal.creditsRedeemed) {return;}
  await creditWalletService.earnCredits(
    proposal.requester,
    proposal.creditsRedeemed,
    `Refund: trade proposal for "${proposal.listingTitle}" was ${proposal.status}`
  );
};

// ─── Service ──────────────────────────────────────────────────────────────────

const tradeProposalService = {
  /**
   * Propose a trade: book a listing's session at its current live price,
   * optionally marked urgent (Time-Decay Rush Pricing surcharge) and/or
   * redeeming wallet credits to discount the resulting price.
   * @param {string} requesterId
   * @param {{ listingId: string, proposedSessionAt: string, message?: string, creditsToRedeem?: number, isUrgent?: boolean }} data
   */
  createProposal: async (requesterId, { listingId, proposedSessionAt, message, creditsToRedeem, isUrgent }) => {
    const listing = await SkillListing.findById(listingId);
    if (!listing) {throw ApiError.notFound('Skill listing not found');}
    if (listing.status !== 'active') {
      throw ApiError.badRequest('This listing is not currently active');
    }
    if (listing.user.toString() === requesterId) {
      throw ApiError.badRequest('You cannot propose a trade on your own listing');
    }

    const priceAtProposal = await getLivePrice(listing.category);
    if (priceAtProposal === null || priceAtProposal === undefined) {
      throw ApiError.badRequest(
        "This skill isn't priced by the valuation engine yet, so trade proposals aren't available for it."
      );
    }

    const sessionDate = new Date(proposedSessionAt);
    if (Number.isNaN(sessionDate.getTime()) || sessionDate <= new Date()) {
      throw ApiError.badRequest('Proposed session time must be a valid date in the future');
    }

    // Time-Decay Rush Pricing — proposedSessionAt doubles as the
    // "deadline" the surcharge decays against. Never touches the
    // valuation engine's own price, only adds on top of it.
    const rush = isUrgent
      ? rushPricingService.applyRushPricing(priceAtProposal, sessionDate)
      : { rushMultiplier: 1, rushSurchargeBDT: 0, priceWithRushBDT: priceAtProposal };
    const priceAfterRush = rush.priceWithRushBDT;

    const requestedCredits = Math.max(0, Number(creditsToRedeem) || 0);

    const redemption = await creditWalletService.previewRedemption(
      requesterId,
      priceAfterRush,
      requestedCredits
    );

    if (requestedCredits > 0) {
      if (requestedCredits > redemption.walletBalance) {
        throw ApiError.badRequest(
          `Insufficient credits: You requested ${requestedCredits} credit${requestedCredits !== 1 ? 's' : ''} but only have ${redemption.walletBalance} available in your wallet.`
        );
      }
      if (requestedCredits > redemption.maxCreditsAllowed) {
        throw ApiError.badRequest(
          `Discount cap exceeded: You can only redeem up to ${redemption.maxCreditsAllowed} credit${redemption.maxCreditsAllowed !== 1 ? 's' : ''} on this trade (max 20% discount).`
        );
      }
    }

    const proposal = await TradeProposal.create({
      listing: listing._id,
      requester: requesterId,
      provider: listing.user,
      listingTitle: listing.title,
      category: listing.category,
      priceAtProposal,
      isUrgent: Boolean(isUrgent),
      rushMultiplier: rush.rushMultiplier,
      rushSurchargeBDT: rush.rushSurchargeBDT,
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

    await notificationService.notify(listing.user, {
      category: 'request',
      type: 'trade_request_received',
      title: 'New trade request',
      message: `Someone proposed a trade on "${listing.title}".`,
      link: '/dashboard/requests',
      relatedTradeProposal: proposal._id,
    });

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
    if (!proposal) {throw ApiError.notFound('Trade proposal not found');}
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
    if (!proposal) {throw ApiError.notFound('Trade proposal not found');}
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
        (proposal.isUrgent && proposal.rushSurchargeBDT > 0
          ? ` (includes ৳${proposal.rushSurchargeBDT} rush surcharge, ×${proposal.rushMultiplier})`
          : '') +
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

    await notificationService.notify(proposal.requester, {
      category: 'request',
      type: 'trade_request_accepted',
      title: 'Trade request accepted',
      message: `Your trade request for "${proposal.listingTitle}" was accepted.`,
      link: '/dashboard/requests',
      relatedTradeProposal: proposal._id,
    });

    return proposal;
  },

  declineProposal: async (id, providerId) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) {throw ApiError.notFound('Trade proposal not found');}
    if (proposal.provider.toString() !== providerId) {
      throw ApiError.forbidden('Only the provider can decline this proposal');
    }
    if (proposal.status !== 'pending') {
      throw ApiError.badRequest(`This proposal is already ${proposal.status}`);
    }

    proposal.status = 'declined';
    await proposal.save();
    await adjustDemand(proposal.category, -1);
    await refundRedeemedCredits(proposal);

    await notificationService.notify(proposal.requester, {
      category: 'request',
      type: 'trade_request_declined',
      title: 'Trade request declined',
      message: `Your trade request for "${proposal.listingTitle}" was declined.`,
      link: '/dashboard/requests',
      relatedTradeProposal: proposal._id,
    });

    return proposal;
  },

  cancelProposal: async (id, requesterId) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) {throw ApiError.notFound('Trade proposal not found');}
    if (proposal.requester.toString() !== requesterId) {
      throw ApiError.forbidden('Only the requester can cancel this proposal');
    }
    if (proposal.status !== 'pending') {
      throw ApiError.badRequest(`This proposal is already ${proposal.status}`);
    }

    proposal.status = 'cancelled';
    await proposal.save();
    await adjustDemand(proposal.category, -1);
    await refundRedeemedCredits(proposal);

    return proposal;
  },

  /**
   * Either party on an accepted trade can flag a disagreement — puts the
   * proposal in front of an admin for resolution (see admin.service.js's
   * resolveDispute, which shows the market rate that was in effect at
   * proposal time before deciding).
   */
  raiseDispute: async (id, userId, reason) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) {throw ApiError.notFound('Trade proposal not found');}
    if (proposal.requester.toString() !== userId && proposal.provider.toString() !== userId) {
      throw ApiError.forbidden('You are not part of this trade proposal');
    }
    if (proposal.status !== 'accepted') {
      throw ApiError.badRequest(`Only an accepted trade can be disputed (status: ${proposal.status})`);
    }

    proposal.status = 'disputed';
    proposal.disputeReason = reason;
    proposal.disputedBy = userId;
    proposal.disputedAt = new Date();
    await proposal.save();

    logger.info(`[TradeProposal] ${proposal._id} disputed by ${userId}.`);

    const otherPartyId = proposal.requester.toString() === userId ? proposal.provider : proposal.requester;
    await notificationService.notify(otherPartyId, {
      category: 'profile',
      type: 'dispute_raised',
      title: 'A dispute was raised against your trade',
      message: `A dispute was raised for "${proposal.listingTitle}". See My Profile for details.`,
      link: '/dashboard/profile',
      relatedTradeProposal: proposal._id,
    });

    return proposal;
  },

  /** Every trade proposal (past or present) this user was disputed on. */
  getMyDisputes: async userId => {
    const proposals = await TradeProposal.find({
      $or: [{ requester: userId }, { provider: userId }],
      disputedAt: { $ne: null },
    })
      .sort({ disputedAt: -1 })
      .populate('requester', 'name email avatar')
      .populate('provider', 'name email avatar')
      .lean();

    return proposals.map(p => ({
      ...p,
      viewerRole: p.requester._id.toString() === userId ? 'requester' : 'provider',
    }));
  },

  /** The shared message thread for a disputed trade — requester, provider, and admin all read/write the same thread. */
  getMessages: async (id, userId, isAdmin) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) {throw ApiError.notFound('Trade proposal not found');}
    if (!isAdmin && proposal.requester.toString() !== userId && proposal.provider.toString() !== userId) {
      throw ApiError.forbidden('You are not part of this trade proposal');
    }

    return DisputeMessage.find({ tradeProposal: id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .lean();
  },

  /** Post into a disputed trade's message thread — participants while it's active, admin any time it's on record. */
  postMessage: async (id, userId, isAdmin, message) => {
    const proposal = await TradeProposal.findById(id);
    if (!proposal) {throw ApiError.notFound('Trade proposal not found');}

    const isRequester = proposal.requester.toString() === userId;
    const isProvider = proposal.provider.toString() === userId;
    if (!isAdmin && !isRequester && !isProvider) {
      throw ApiError.forbidden('You are not part of this trade proposal');
    }
    if (!proposal.disputedAt) {
      throw ApiError.badRequest('Messages can only be sent on a trade that has been disputed');
    }
    if (!isAdmin && proposal.status !== 'disputed') {
      throw ApiError.badRequest(`This dispute is already resolved (status: ${proposal.status})`);
    }

    const senderRole = isAdmin ? 'admin' : isRequester ? 'requester' : 'provider';
    const doc = await DisputeMessage.create({ tradeProposal: id, sender: userId, senderRole, message });
    const populated = await doc.populate('sender', 'name avatar');

    // Notify whoever didn't send it — the other party (and, if admin sent
    // it, both parties). Participants never notify admins here — admins
    // monitor new messages directly from the Disputes Queue.
    const recipients = isAdmin
      ? [proposal.requester.toString(), proposal.provider.toString()]
      : [isRequester ? proposal.provider.toString() : proposal.requester.toString()];

    await Promise.all(
      recipients.map(recipientId =>
        notificationService.notify(recipientId, {
          category: 'profile',
          type: 'dispute_message',
          title: isAdmin ? 'New message from admin' : 'New message on your dispute',
          message: `New message on the dispute for "${proposal.listingTitle}".`,
          link: '/dashboard/profile',
          relatedTradeProposal: proposal._id,
        })
      )
    );

    return populated;
  },

  // Exposed for admin.service.js's resolveDispute — refunding a disputed
  // trade's redeemed credits reuses the exact same logic as decline/cancel.
  refundRedeemedCredits,
};

module.exports = tradeProposalService;
