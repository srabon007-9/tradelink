'use strict';

/**
 * services/rushPricing.service.js — Time-Decay Rush Pricing
 *
 * A self-contained pricing layer, separate from the Dynamic Valuation
 * Engine's own supply/demand formula (services/valuation.service.js) —
 * this never touches that formula, it only adds a surcharge on top of
 * whatever live price the valuation engine already produced. Marking a
 * trade proposal urgent reuses its own proposedSessionAt as the
 * "deadline" the surcharge decays against (see tradeProposal.service.js).
 *
 * FORMULA — exponential time-decay curve
 * ────────────────────────────────────────
 *   hoursUntilDeadline = (deadline − now) in hours
 *   multiplier = 1 + (MAX_RUSH_MULTIPLIER − 1) × e^(−hoursUntilDeadline / DECAY_HOURS)
 *
 *   - Right at the deadline (0 hours out): multiplier = MAX_RUSH_MULTIPLIER
 *     (100% premium by default) — maximum rush compensation.
 *   - As the deadline moves further into the future, e^(−h/24) shrinks
 *     toward 0, so the multiplier decays smoothly back toward 1 (no
 *     premium) — an exponential decay curve, the same shape flight/ride
 *     "book last-minute" pricing uses.
 *   - Beyond RUSH_WINDOW_HOURS the premium is negligible, so no surcharge
 *     is applied at all even if the requester checked "urgent" — the
 *     objective time-to-deadline governs the price, not the checkbox.
 *
 * Example curve (MAX=2.0, DECAY_HOURS=24):
 *   0h out  → ×2.00 (100% premium)
 *   6h out  → ×1.78
 *   12h out → ×1.61
 *   24h out → ×1.37
 *   48h out → ×1.14
 *   72h out → ×1.05
 *   96h+    → ×1.00 (no premium — outside the rush window)
 */

const MAX_RUSH_MULTIPLIER = 2.0; // 100% premium at the deadline itself
const DECAY_HOURS = 24; // controls how fast the premium decays with lead time
const RUSH_WINDOW_HOURS = 96; // beyond ~4 days out, no rush premium applies

/**
 * Pure function — the rush multiplier for a deadline relative to now.
 * @param {Date} deadline
 * @param {Date} [now]
 * @returns {{ hoursUntilDeadline: number, multiplier: number, withinRushWindow: boolean }}
 */
const computeRushMultiplier = (deadline, now = new Date()) => {
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDeadline <= 0 || hoursUntilDeadline > RUSH_WINDOW_HOURS) {
    return { hoursUntilDeadline, multiplier: 1, withinRushWindow: false };
  }

  const rawMultiplier = 1 + (MAX_RUSH_MULTIPLIER - 1) * Math.exp(-hoursUntilDeadline / DECAY_HOURS);
  const multiplier = Math.round(rawMultiplier * 1000) / 1000;

  return { hoursUntilDeadline, multiplier, withinRushWindow: true };
};

/**
 * Applies the rush multiplier to a base price.
 * @param {number} basePriceBDT
 * @param {Date} deadline
 * @returns {{ rushMultiplier: number, rushSurchargeBDT: number, priceWithRushBDT: number }}
 */
const applyRushPricing = (basePriceBDT, deadline) => {
  const { multiplier } = computeRushMultiplier(deadline);
  const priceWithRushBDT = Math.round(basePriceBDT * multiplier * 100) / 100;
  const rushSurchargeBDT = Math.round((priceWithRushBDT - basePriceBDT) * 100) / 100;

  return { rushMultiplier: multiplier, rushSurchargeBDT, priceWithRushBDT };
};

module.exports = {
  computeRushMultiplier,
  applyRushPricing,
  MAX_RUSH_MULTIPLIER,
  DECAY_HOURS,
  RUSH_WINDOW_HOURS,
};
