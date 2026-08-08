/**
 * services/skill.service.js — Skill Listing & Category Browsing business logic.
 *
 * Owns:
 *  - createSkill()   → Skill Listing Profiles (Module 1, Feature 2)
 *  - getBrowseData() → Category Browsing with Live Price Filtering (Module 1, Feature 3)
 */

'use strict';

const Skill = require('../models/Skill.model');
const valuationService = require('./valuation.service');

const AVAILABILITY_RANK = { available: 0, limited: 1, booked: 2 };

/**
 * Reads every active listing once, computes the live per-category valuation
 * map from that single snapshot, then applies filters/sort/pagination in
 * memory. Categories are a small fixed set, so this keeps the listings and
 * the category summary (used for the browse page's chips/cards) perfectly
 * consistent with each other on every request — both are "live" together.
 *
 * @param {object} params
 * @param {string} [params.search]       free-text match on title/description/tags/provider/location
 * @param {string} [params.category]     restrict to one category id
 * @param {string} [params.availability] restrict to one availability value
 * @param {number} [params.minPrice]     minimum live credit value
 * @param {number} [params.maxPrice]     maximum live credit value
 * @param {string} [params.sort]         'match' | 'newest' | 'price-low' | 'price-high' | 'availability'
 * @param {number} [params.page]
 * @param {number} [params.limit]
 */
const getBrowseData = async ({
  search = '',
  category = '',
  availability = '',
  minPrice,
  maxPrice,
  sort = 'match',
  page = 1,
  limit = 20,
} = {}) => {
  const activeSkills = await Skill.find({ status: 'active' }).sort({ createdAt: -1 }).lean();

  // Category live values are always computed from the FULL active pool,
  // not the filtered subset — so switching filters never changes the
  // "current live credit value" shown for a category, only which listings
  // are visible underneath it.
  const valuationMap = valuationService.buildCategoryValuationMap(activeSkills);

  let enriched = activeSkills.map(skill => {
    const catValuation = valuationMap[skill.category] || { multiplier: 1 };
    return {
      ...skill,
      liveValue: valuationService.getLiveValueForSkill(skill, catValuation.multiplier),
      categoryMultiplier: catValuation.multiplier,
    };
  });

  // ─── Filtering ──────────────────────────────────────────────────────────
  const searchTerm = search.trim().toLowerCase();
  if (searchTerm) {
    enriched = enriched.filter(skill => {
      const haystack = [
        skill.title,
        skill.description,
        skill.categoryLabel,
        skill.provider?.name,
        skill.location,
        ...(skill.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  if (category) {
    enriched = enriched.filter(skill => skill.category === category);
  }

  if (availability) {
    enriched = enriched.filter(skill => skill.availability === availability);
  }

  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (!Number.isNaN(min) && minPrice !== undefined && minPrice !== '') {
    enriched = enriched.filter(skill => skill.liveValue >= min);
  }
  if (!Number.isNaN(max) && maxPrice !== undefined && maxPrice !== '') {
    enriched = enriched.filter(skill => skill.liveValue <= max);
  }

  // ─── Sorting ────────────────────────────────────────────────────────────
  switch (sort) {
    case 'price-low':
      enriched.sort((a, b) => a.liveValue - b.liveValue);
      break;
    case 'price-high':
      enriched.sort((a, b) => b.liveValue - a.liveValue);
      break;
    case 'availability':
      enriched.sort((a, b) => AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability]);
      break;
    case 'newest':
    case 'match': // no auth/profile-matching signal yet — fall back to newest
    default:
      enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ─── Pagination ─────────────────────────────────────────────────────────
  const total = enriched.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const start = (pageNum - 1) * limitNum;
  const items = enriched.slice(start, start + limitNum);

  const categories = Object.keys(valuationMap).map(id => ({
    id,
    liveValue: valuationMap[id].liveValue,
    multiplier: valuationMap[id].multiplier,
    supply: valuationMap[id].supply,
    demand: valuationMap[id].demand,
  }));

  return {
    items,
    categories,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/** Creates a new skill listing. It's part of the active pool immediately. */
const createSkill = async data => {
  const skill = await Skill.create({
    title: data.title,
    description: data.description || '',
    category: data.category,
    categoryLabel: data.category === 'other' ? data.categoryLabel : '',
    baseRate: data.baseRate,
    availability: data.availability || 'available',
    location: data.location || 'Remote',
    tags: Array.isArray(data.tags) ? data.tags : [],
    provider: {
      name: data.providerName,
      initials: data.providerInitials || String(data.providerName).slice(0, 2).toUpperCase(),
    },
  });

  return skill.toObject();
};

module.exports = { getBrowseData, createSkill };