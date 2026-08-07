/**
 * services/valuation.service.js — Live Credit Valuation
 *
 * Computes "current live credit value" per category and per listing for the
 * Category Browsing with Live Price Filtering feature.
 *
 * IMPORTANT — interim implementation:
 * The full Dynamic Valuation Engine (Module 1, Feature 1) is its own,
 * separately-owned feature that is meant to continuously track real demand
 * (open service requests) vs. real supply (active providers) and adjust
 * credit values from that. That module isn't built yet, so this file
 * provides a self-contained, pluggable stand-in so Browse has real,
 * computed numbers today instead of static placeholders.
 *
 * Supply is exact (active listings per category, straight from the DB).
 * Demand is approximated from `Skill.interestCount`, a lightweight counter
 * that other features (trade proposals, watchlist hits, etc.) can increment
 * as they're built. Whoever implements the real engine only needs to swap
 * out `getDemandUnits()` below — everything downstream (skill.service.js,
 * the browse API contract, the frontend) keeps working unchanged.
 */

'use strict';

const MIN_MULTIPLIER = 0.7;
const MAX_MULTIPLIER = 1.6;

const round = value => Math.round(value * 100) / 100;

/** Number of active listings in a category — the supply side. */
const getSupplyUnits = skills => skills.length;

/**
 * Demand proxy for a category: total recorded interest across its listings.
 * Replace with real trade-request volume once that module exists.
 */
const getDemandUnits = skills => skills.reduce((sum, skill) => sum + (skill.interestCount || 0), 0);

/**
 * Bounded scarcity multiplier for one category's active listings.
 *  - No listings yet          -> neutral (1.0)
 *  - No recorded interest yet -> neutral (1.0), i.e. price = base rate
 *  - Interest > supply        -> multiplier rises (scarce/high-demand skill)
 *  - Supply keeps growing with flat interest -> multiplier falls toward MIN
 */
const getCategoryMultiplier = skills => {
  const supply = getSupplyUnits(skills);
  if (supply === 0) return 1;

  const demand = getDemandUnits(skills);
  const ratio = (supply + demand) / supply;

  return round(Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, ratio)));
};

/** Average self-declared base rate across a category's active listings. */
const getAverageBaseRate = skills => {
  if (skills.length === 0) return 0;
  const total = skills.reduce((sum, skill) => sum + skill.baseRate, 0);
  return total / skills.length;
};

/** Live credit value for one listing, given its category's multiplier. */
const getLiveValueForSkill = (skill, categoryMultiplier) =>
  Math.max(1, Math.round(skill.baseRate * categoryMultiplier));

/**
 * Builds `{ [category]: { multiplier, liveValue, supply, demand } }` from a
 * flat list of active skills. `liveValue` here is the category's headline
 * number (average base rate adjusted by its multiplier) shown on category
 * chips/cards; each listing also gets its own liveValue in skill.service.js.
 */
const buildCategoryValuationMap = activeSkills => {
  const byCategory = activeSkills.reduce((map, skill) => {
    if (!map[skill.category]) map[skill.category] = [];
    map[skill.category].push(skill);
    return map;
  }, {});

  const valuationMap = {};

  Object.keys(byCategory).forEach(category => {
    const skills = byCategory[category];
    const multiplier = getCategoryMultiplier(skills);

    valuationMap[category] = {
      multiplier,
      liveValue: Math.max(1, Math.round(getAverageBaseRate(skills) * multiplier)),
      supply: getSupplyUnits(skills),
      demand: getDemandUnits(skills),
    };
  });

  return valuationMap;
};

module.exports = {
  getCategoryMultiplier,
  getLiveValueForSkill,
  buildCategoryValuationMap,
};