'use strict';

/**
 * controllers/skillListing.controller.js — Skill Listing Profiles HTTP Layer
 */

const skillListingService = require('../services/skillListing.service');

const skillListingController = {
  // ─── POST /api/skill-listings ────────────────────────────────────────────────
  createListing: async (req, res, next) => {
    try {
      const { title, description, category, customCategoryName } = req.body;

      const listing = await skillListingService.createListing(req.user.id, {
        title,
        description,
        category,
        customCategoryName,
      });

      return res.status(201).json({
        success: true,
        message: 'Skill listing created successfully',
        data: listing,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/skill-listings ─────────────────────────────────────────────────
  // Public browse — active listings only. Optional ?category=<slug|other>
  getActiveListings: async (req, res, next) => {
    try {
      const { category } = req.query;
      const listings = await skillListingService.getActiveListings({ category });

      return res.status(200).json({ success: true, count: listings.length, data: listings });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/skill-listings/mine ────────────────────────────────────────────
  // The logged-in user's own listings, any status — for managing listings.
  getMyListings: async (req, res, next) => {
    try {
      const listings = await skillListingService.getUserListings(req.user.id);
      return res.status(200).json({ success: true, count: listings.length, data: listings });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/skill-listings/:id ─────────────────────────────────────────────
  getListing: async (req, res, next) => {
    try {
      const listing = await skillListingService.getListingById(req.params.id);
      return res.status(200).json({ success: true, data: listing });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/skill-listings/:id ───────────────────────────────────────────
  // Owner-only: edit fields and/or toggle status (active/inactive).
  updateListing: async (req, res, next) => {
    try {
      const listing = await skillListingService.updateListing(req.params.id, req.user.id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Skill listing updated successfully',
        data: listing,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── DELETE /api/skill-listings/:id ──────────────────────────────────────────
  deleteListing: async (req, res, next) => {
    try {
      await skillListingService.deleteListing(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Skill listing deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = skillListingController;
