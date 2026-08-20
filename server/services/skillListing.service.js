'use strict';

/**
 * services/skillListing.service.js — Skill Listing Profiles
 *
 * Business logic for creating and managing the skills a user offers.
 * Every active listing on a seeded category counts as one unit of supply
 * in the Dynamic Valuation Engine (services/valuation.service.js) —
 * creating a listing is how a user "activates" as a provider for that
 * skill. Listings never carry a user-set price; the cost shown is always
 * the category's live valuation-engine price.
 */

const SkillListing = require('../models/SkillListing.model');
const SkillCategory = require('../models/SkillCategory.model');
const valuationService = require('./valuation.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * A category is valid if it's the literal 'other' or the slug of an
 * existing SkillCategory. Throws ApiError.badRequest otherwise.
 */
const resolveCategory = async category => {
  if (category === 'other') {return null;}

  const categoryDoc = await SkillCategory.findOne({ slug: category });
  if (!categoryDoc) {
    throw ApiError.badRequest(
      `'${category}' is not a known skill category — choose one of the listed categories or 'other'`
    );
  }
  return categoryDoc;
};

/** Best-effort supply adjustment — a listing's lifecycle shouldn't fail on a valuation hiccup. */
const adjustSupply = async (category, delta) => {
  if (!category || category === 'other') {return;}
  try {
    await valuationService.updateSupply(category, delta);
  } catch (err) {
    logger.error(`[SkillListing] Failed to adjust supply for '${category}' (${delta}): ${err.message}`);
  }
};

/** Attaches the category's current valuation-engine price to a listing (lean object). */
const withLivePrice = async listing => {
  if (listing.category === 'other') {
    return { ...listing, currentPriceBDT: null };
  }
  const categoryDoc = await SkillCategory.findOne({ slug: listing.category })
    .select('priceBDT')
    .lean();
  return { ...listing, currentPriceBDT: categoryDoc ? categoryDoc.priceBDT : null };
};

// ─── Service ──────────────────────────────────────────────────────────────────

const skillListingService = {
  /** Create a new skill listing for a user; activates supply (+1) if the category is tracked. */
  createListing: async (userId, { title, description, category, customCategoryName }) => {
    await resolveCategory(category);

    const listing = await SkillListing.create({
      user: userId,
      title,
      description,
      category,
      customCategoryName: category === 'other' ? customCategoryName : null,
    });

    await adjustSupply(category, 1);

    return withLivePrice(listing.toObject());
  },

  /** All listings owned by a user (any status) — for "manage my listings". */
  getUserListings: async userId => {
    const listings = await SkillListing.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return Promise.all(listings.map(withLivePrice));
  },

  /** Public browse — active listings only, optionally filtered by category. */
  getActiveListings: async ({ category } = {}) => {
    const query = { status: 'active' };
    if (category) {query.category = category.toLowerCase();}

    const listings = await SkillListing.find(query)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    return Promise.all(listings.map(withLivePrice));
  },

  /** Single listing by id, with the live valuation-engine price attached. */
  getListingById: async id => {
    const listing = await SkillListing.findById(id).populate('user', 'name avatar').lean();
    if (!listing) {throw ApiError.notFound('Skill listing not found');}
    return withLivePrice(listing);
  },

  /**
   * Update a listing (owner only). Keeps valuation-engine supply in sync
   * when the category changes or the listing is activated/deactivated.
   */
  updateListing: async (id, userId, updates) => {
    const listing = await SkillListing.findById(id);
    if (!listing) {throw ApiError.notFound('Skill listing not found');}
    if (listing.user.toString() !== userId) {
      throw ApiError.forbidden('You can only edit your own listings');
    }

    const prevCategory = listing.category;
    const prevStatus = listing.status;

    if (updates.category && updates.category !== prevCategory) {
      await resolveCategory(updates.category);
      listing.category = updates.category;
      listing.customCategoryName =
        updates.category === 'other' ? updates.customCategoryName : null;
    } else if ('customCategoryName' in updates && listing.category === 'other') {
      listing.customCategoryName = updates.customCategoryName;
    }

    if ('title' in updates) {listing.title = updates.title;}
    if ('description' in updates) {listing.description = updates.description;}
    if ('status' in updates) {listing.status = updates.status;}

    await listing.save();

    const wasSupply = prevStatus === 'active';
    const isSupply = listing.status === 'active';

    if (prevCategory !== listing.category) {
      if (wasSupply) {await adjustSupply(prevCategory, -1);}
      if (isSupply) {await adjustSupply(listing.category, 1);}
    } else if (wasSupply !== isSupply) {
      await adjustSupply(listing.category, isSupply ? 1 : -1);
    }

    return withLivePrice(listing.toObject());
  },

  /** Delete a listing (owner only) — releases its supply slot if it was active. */
  deleteListing: async (id, userId) => {
    const listing = await SkillListing.findById(id);
    if (!listing) {throw ApiError.notFound('Skill listing not found');}
    if (listing.user.toString() !== userId) {
      throw ApiError.forbidden('You can only delete your own listings');
    }

    if (listing.status === 'active') {
      await adjustSupply(listing.category, -1);
    }

    await listing.deleteOne();
  },
};

module.exports = skillListingService;
