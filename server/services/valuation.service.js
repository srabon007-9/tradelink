'use strict';

/**
 * services/valuation.service.js — Dynamic Valuation Engine
 *
 * Core logic for TradeLink's live BDT pricing system. Each skill category
 * has its own baseRate, floor, ceiling, and alpha — this is never a single
 * global price, it's computed per category from that category's own
 * live supply (active providers) and demand (open trade proposals).
 *
 * FORMULA
 * ───────
 *   ratio      = (demand + 1) / (supply + 1)   // Laplace-smoothed ratio —
 *                                               // no divide-by-zero, and no
 *                                               // instant cliff to the floor
 *                                               // the moment supply arrives
 *                                               // with zero demand yet
 *   multiplier = ratio ^ alpha                  // power-law sensitivity curve
 *   rawValue   = baseRate × multiplier
 *   priceBDT   = clamp(rawValue, floor, ceiling)
 *
 * WHY (demand + 1) / (supply + 1) INSTEAD OF demand / supply?
 * ─────────────────────────────────────────────────────────────
 *   - demand = supply = 0 (brand new category): ratio = 1 → price = baseRate,
 *     with no special-cased branch needed — the smoothing makes it fall out
 *     of the formula naturally.
 *   - First provider joins, demand still 0: ratio = 1/2 = 0.5 → multiplier
 *     ≈ 0.71 → price eases down toward the floor, it doesn't jump straight
 *     to it the instant one provider shows up.
 *   - Balanced market (demand ≈ supply): ratio ≈ 1 → price ≈ baseRate.
 *   - High demand (demand > supply): ratio > 1 → price rises above baseRate,
 *     scaling with the square root of the ratio (alpha = 0.5) so a demand
 *     spike doesn't cause wild, linear price swings.
 *   - alpha is stored and configurable per category for future tuning.
 *
 * RECALCULATION STRATEGY: Hybrid (event-driven + cron safety net)
 * ───────────────────────────────────────────────────────────────
 *   Primary:  event-driven — recalculate immediately when supply/demand changes
 *   Backup:   cron job every 15 minutes — ensures no stale state accumulates
 *   Every recalculation writes a timestamped ValuationSnapshot, which is
 *   what later powers historical price charts and dispute resolution
 *   (showing what the price actually was at the moment a trade was agreed).
 */

const SkillCategory    = require('../models/SkillCategory.model');
const ValuationSnapshot = require('../models/ValuationSnapshot.model');
const logger           = require('../utils/logger');

// ─── Core Formula ─────────────────────────────────────────────────────────────

/**
 * Pure function — computes credit value from market metrics.
 * Returns all intermediate values for transparency.
 *
 * @param {{ demand, supply, baseRate, alpha, floor, ceiling }} params
 * @returns {{ ratio, multiplier, rawValue, priceBDT, wasClamped, clampReason, explanation }}
 */
const computeValue = ({ demand, supply, baseRate, alpha, floor, ceiling }) => {
  // Laplace-smoothed ratio — never divides by zero, and never cliffs
  // straight to the floor the moment the first provider joins with no
  // demand yet. demand = supply = 0 naturally resolves to ratio = 1
  // (price = baseRate) with no special-cased branch required.
  const ratio = (demand + 1) / (supply + 1);

  // Power-law: ratio^alpha. When alpha=0.5 this is the square root.
  const multiplier = Math.pow(ratio, alpha);

  const rawValue = baseRate * multiplier;

  // Round to 2 decimal places then clamp
  const rounded  = Math.round(rawValue * 100) / 100;
  const priceBDT = Math.max(floor, Math.min(ceiling, rounded));

  const wasClamped  = priceBDT !== rounded;
  const clampReason = priceBDT <= floor ? 'floor' : priceBDT >= ceiling ? 'ceiling' : null;

  const clampNote =
    clampReason === 'floor'
      ? ` (floor applied — minimum is ৳${floor} BDT)`
      : clampReason === 'ceiling'
      ? ` (ceiling applied — maximum is ৳${ceiling} BDT)`
      : '';

  const noActivityNote =
    demand === 0 && supply === 0 ? ' No active providers or open requests yet — this is the base rate.' : '';

  const explanation =
    `Supply: ${supply} active provider${supply !== 1 ? 's' : ''}. ` +
    `Demand: ${demand} open request${demand !== 1 ? 's' : ''}. ` +
    `Ratio = (${demand}+1)/(${supply}+1) = ${ratio.toFixed(4)}. ` +
    `Multiplier = ${ratio.toFixed(4)}^${alpha} = ${multiplier.toFixed(6)}. ` +
    `Raw price = ${baseRate} × ${multiplier.toFixed(6)} = ${rawValue.toFixed(2)} BDT. ` +
    `Final price = ৳${priceBDT}${clampNote}.${noActivityNote}`;

  return { ratio, multiplier, rawValue, priceBDT, wasClamped, clampReason, explanation };
};

// ─── Recalculate a single category ───────────────────────────────────────────

/**
 * Recalculate the credit value for one category, persist a snapshot, and
 * update the category document.
 *
 * @param {string} categoryId
 * @param {'scheduled'|'event'|'manual'|'seed'} trigger
 * @returns {{ category, result }}
 */
const recalculateCategory = async (categoryId, trigger = 'event') => {
  const category = await SkillCategory.findById(categoryId);
  if (!category) throw new Error(`SkillCategory ${categoryId} not found`);

  const { demand, supply, baseRate, alpha, floor, ceiling } = category;
  const result = computeValue({ demand, supply, baseRate, alpha, floor, ceiling });

  // Update category with new value and snapshot metadata
  category.priceBDT     = result.priceBDT;
  category.lastSnapshot = {
    priceBDT:     result.priceBDT,
    ratio:        result.ratio,
    multiplier:   result.multiplier,
    trigger,
    explanation:  result.explanation,
    calculatedAt: new Date(),
  };
  await category.save();

  // Persist full snapshot for history / disputes / charts
  await ValuationSnapshot.create({
    category:     category._id,
    categorySlug: category.slug,
    priceBDT:     result.priceBDT,
    supply,
    demand,
    ratio:       result.ratio,
    multiplier:  result.multiplier,
    baseRate,
    alpha,
    floor,
    ceiling,
    trigger,
    explanation: result.explanation,
  });

  logger.info(
    `[Valuation] "${category.name}" → ৳${result.priceBDT} BDT ` +
    `(D=${demand} S=${supply} ratio=${result.ratio.toFixed(3)} trigger=${trigger})`
  );

  return { category, result };
};

// ─── Recalculate all categories ───────────────────────────────────────────────

/**
 * Recalculate every category — used by the cron job or a manual admin trigger.
 * @param {'scheduled'|'manual'} trigger
 */
const recalculateAll = async (trigger = 'scheduled') => {
  const categories = await SkillCategory.find().select('_id');
  const results = [];

  for (const { _id } of categories) {
    try {
      const r = await recalculateCategory(_id.toString(), trigger);
      results.push(r);
    } catch (err) {
      logger.error(`[Valuation] Failed to recalculate category ${_id}: ${err.message}`);
    }
  }

  logger.info(
    `[Valuation] Batch recalculation complete — ${results.length}/${categories.length} categories updated (trigger=${trigger})`
  );
  return results;
};

// ─── Event-Driven Supply / Demand Updates ─────────────────────────────────────

/**
 * Call this when a provider activates (+1) or deactivates (-1) for a skill.
 * Immediately recalculates the category credit value.
 *
 * @param {string} slug   - Category slug (e.g. 'web-development')
 * @param {1|-1}   delta  - +1 provider joined, -1 provider left
 */
const updateSupply = async (slug, delta) => {
  let category = await SkillCategory.findOneAndUpdate(
    { slug },
    { $inc: { supply: delta } },
    { new: true }
  );

  if (!category) throw new Error(`SkillCategory with slug '${slug}' not found`);

  // Guard: supply must never go below 0
  if (category.supply < 0) {
    category.supply = 0;
    await category.save();
  }

  return recalculateCategory(category._id.toString(), 'event');
};

/**
 * Call this when a service request is opened (+1) or closed/cancelled (-1).
 * Immediately recalculates the category credit value.
 *
 * @param {string} slug   - Category slug
 * @param {1|-1}   delta  - +1 request opened, -1 request closed/cancelled
 */
const updateDemand = async (slug, delta) => {
  let category = await SkillCategory.findOneAndUpdate(
    { slug },
    { $inc: { demand: delta } },
    { new: true }
  );

  if (!category) throw new Error(`SkillCategory with slug '${slug}' not found`);

  // Guard: demand must never go below 0
  if (category.demand < 0) {
    category.demand = 0;
    await category.save();
  }

  return recalculateCategory(category._id.toString(), 'event');
};

// ─── Seed Initial Categories ──────────────────────────────────────────────────

const INITIAL_CATEGORIES = [
  { name: 'Web Development',   slug: 'web-development',   description: 'Frontend, backend, and full-stack development services.' },
  { name: 'Graphic Design',    slug: 'graphic-design',    description: 'Logo design, branding, UI/UX, and visual assets.' },
  { name: 'Content Writing',   slug: 'content-writing',   description: 'Blog posts, copywriting, editing, and SEO content.' },
  { name: 'Digital Marketing', slug: 'digital-marketing', description: 'Social media, ads, email campaigns, and analytics.' },
  { name: 'Data Analysis',     slug: 'data-analysis',     description: 'Spreadsheets, dashboards, data cleaning, and reporting.' },
  { name: 'Business Support',  slug: 'business-support',  description: 'Admin assistance, scheduling, research, and documentation.' },
  { name: 'Tutoring',          slug: 'tutoring',          description: 'Academic tutoring, skill coaching, and mentoring.' },
  { name: 'Video Editing',     slug: 'video-editing',     description: 'Video production, editing, motion graphics, and thumbnails.' },
  { name: 'Translation',       slug: 'translation',       description: 'Document translation, localization, and language assistance.' },
  { name: 'Photography',       slug: 'photography',       description: 'Product, portrait, event, and stock photography.' },
];

/**
 * Seeds the skill categories collection on first boot.
 * Skips if categories already exist.
 */
const seedCategories = async () => {
  const existing = await SkillCategory.countDocuments();

  if (existing > 0) {
    // Migration: if categories still have old credit-based baseRate (10), update to BDT
    const outdated = await SkillCategory.countDocuments({ baseRate: { $lt: 100 } });
    if (outdated > 0) {
      logger.info(`[Valuation] Migrating ${outdated} categories from credits to BDT (base: 10 → 1500)...`);
      await SkillCategory.updateMany(
        { baseRate: { $lt: 100 } },
        { $set: { baseRate: 1500, floor: 500, ceiling: 10000, priceBDT: 1500 } }
      );
      await recalculateAll('seed');
      logger.info('[Valuation] Migration complete.');
      return;
    }
    logger.info(`[Valuation] ${existing} skill categories already exist — skipping seed.`);
    return;
  }

  await SkillCategory.insertMany(INITIAL_CATEGORIES);
  logger.info(`[Valuation] Seeded ${INITIAL_CATEGORIES.length} skill categories.`);

  // Run initial valuation so every category starts with a proper snapshot
  await recalculateAll('seed');
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  computeValue,        // pure formula — useful for unit tests
  recalculateCategory,
  recalculateAll,
  updateSupply,
  updateDemand,
  seedCategories,
};
