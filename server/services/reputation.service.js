'use strict';

/**
 * services/reputation.service.js — Reputation Score Engine
 *
 * Calculates a dynamic trust score (0–100) for any user based on:
 *   1. Trade Completion Rate (weight: 40%)
 *   2. Average Review Rating  (weight: 40%)
 *   3. Dispute Penalty         (weight: 20%) — placeholder, defaults to 0
 *
 * Time-Decay Weighting:
 *   W(t) = e^(-λ * daysSince)   where λ = 0.015 (half-life ≈ 46 days)
 *   Applied to each review and trade proposal when computing averages.
 *
 * Trust Tiers:
 *   90–100  →  Elite Trader   (gold)
 *   75–89   →  Verified Partner (green)
 *   60–74   →  Rising Peer    (blue)
 *    0–59   →  High Risk      (red)
 */

const TradeProposal = require('../models/TradeProposal.model');
const Review        = require('../models/Review.model');
const User          = require('../models/User.model');
const logger        = require('../utils/logger');

const DECAY_LAMBDA = 0.015;

const WEIGHTS = {
  completionWeight: 0.40,
  ratingWeight:     0.40,
  disputeWeight:    0.20,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate days since a given date from now.
 */
const daysSince = (date) => {
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
};

/**
 * Exponential decay weight for a given date.
 */
const decayWeight = (date) => Math.exp(-DECAY_LAMBDA * daysSince(date));

/**
 * Classify a numeric score (0–100) into a trust tier.
 */
const classifyTier = (score) => {
  if (score >= 90) {return { tier: 'Elite Trader',    tierColor: 'gold' };}
  if (score >= 75) {return { tier: 'Verified Partner', tierColor: 'green' };}
  if (score >= 60) {return { tier: 'Rising Peer',     tierColor: 'blue' };}
  return                   { tier: 'High Risk',       tierColor: 'red' };
};

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the full reputation breakdown for a given user.
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {Promise<Object>} Full reputation breakdown object
 */
const calculateReputation = async (userId) => {
  // ── 1. Trade Completion Rate ──────────────────────────────────────────────
  // Fetch all proposals where the user participated and the proposal reached
  // a terminal state (accepted = completed, declined, cancelled).
  const proposals = await TradeProposal.find({
    $or: [{ requester: userId }, { provider: userId }],
    status: { $in: ['accepted', 'declined', 'cancelled'] },
  })
    .select('status createdAt')
    .lean();

  let weightedCompleted = 0;
  let weightedTotal     = 0;

  for (const p of proposals) {
    const w = decayWeight(p.createdAt);
    weightedTotal += w;
    if (p.status === 'accepted') {
      weightedCompleted += w;
    }
  }

  const completedTrades = proposals.filter(p => p.status === 'accepted').length;
  const totalTrades     = proposals.length;

  // Completion rate as a 0–100 percentage (time-decay weighted)
  const completionRate = weightedTotal > 0
    ? (weightedCompleted / weightedTotal) * 100
    : 0;

  // ── 2. Average Rating ─────────────────────────────────────────────────────
  const reviews = await Review.find({ reviewee: userId })
    .select('rating createdAt')
    .lean();

  let weightedRatingSum = 0;
  let weightedReviewCount = 0;

  for (const r of reviews) {
    const w = decayWeight(r.createdAt);
    weightedRatingSum   += r.rating * w;
    weightedReviewCount += w;
  }

  const averageRating = weightedReviewCount > 0
    ? weightedRatingSum / weightedReviewCount
    : 0;

  // Map 1–5 rating scale to 0–100 score
  const ratingScore = averageRating > 0
    ? ((averageRating - 1) / 4) * 100
    : 0;

  // ── 3. Dispute Penalty ────────────────────────────────────────────────────
  // Placeholder — will be wired to the dispute system later.
  // Each active/lost dispute would deduct points here.
  const disputePenalty = 0;

  // ── 4. Final Score ────────────────────────────────────────────────────────
  const rawScore =
    (completionRate * WEIGHTS.completionWeight) +
    (ratingScore    * WEIGHTS.ratingWeight) +
    ((100 - disputePenalty) * WEIGHTS.disputeWeight);

  const score = Math.round(Math.min(100, Math.max(0, rawScore)) * 10) / 10;

  // ── 5. Tier Classification ────────────────────────────────────────────────
  const { tier, tierColor } = classifyTier(score);

  return {
    userId,
    score,
    tier,
    tierColor,
    breakdown: {
      completionRate:  Math.round(completionRate * 10) / 10,
      totalTrades,
      completedTrades,
      averageRating:   Math.round(averageRating * 100) / 100,
      totalReviews:    reviews.length,
      disputePenalty,
    },
    weights: { ...WEIGHTS },
    decayLambda: DECAY_LAMBDA,
    lastCalculated: new Date(),
  };
};

/**
 * Get the top N users by reputation score (leaderboard).
 *
 * @param {number} [limit=10] - Max users to return
 * @returns {Promise<Array>} Sorted array of { user, reputation } objects
 */
const getLeaderboard = async (limit = 10) => {
  // Fetch all users, calculate reputation for each, sort by score
  const users = await User.find()
    .select('_id name avatar')
    .lean();

  const results = [];

  for (const user of users) {
    try {
      const rep = await calculateReputation(user._id);
      results.push({
        userId:    user._id,
        name:      user.name,
        avatar:    user.avatar,
        score:     rep.score,
        tier:      rep.tier,
        tierColor: rep.tierColor,
        breakdown: rep.breakdown,
      });
    } catch (err) {
      logger.error(`Failed to calculate reputation for user ${user._id}: ${err.message}`);
    }
  }

  // Sort descending by score, take top N
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
};

module.exports = {
  calculateReputation,
  getLeaderboard,
};
