/**
 * controllers/skill.controller.js — Skill Listing & Category Browsing HTTP handlers.
 */

'use strict';

const skillService = require('../services/skill.service');
const ApiResponse = require('../utils/ApiResponse');

const skillController = {
  /**
   * GET /api/skills
   * Query: search, category, availability, minPrice, maxPrice, sort, page, limit
   * Returns active skill listings (each with a computed `liveValue`) plus a
   * `categories` summary in meta for the browse page's filter chips/cards.
   */
  browseSkills: async (req, res, next) => {
    try {
      const { search, category, availability, minPrice, maxPrice, sort, page, limit } = req.query;

      const { items, categories, pagination } = await skillService.getBrowseData({
        search,
        category,
        availability,
        minPrice,
        maxPrice,
        sort,
        page,
        limit,
      });

      return ApiResponse.success(res, items, 'Skill listings fetched successfully', {
        pagination,
        categories,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/skills/categories
   * Live credit value + supply/demand snapshot for every category on its
   * own — useful for rendering category cards without fetching listings.
   */
  getCategorySummary: async (req, res, next) => {
    try {
      const { categories } = await skillService.getBrowseData({ limit: 1 });
      return ApiResponse.success(res, categories, 'Category valuations fetched successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/skills
   * Creates a new skill listing (Skill Listing Profiles). It becomes part of
   * the active pool immediately, so it appears in Browse on the next fetch.
   */
  createSkill: async (req, res, next) => {
    try {
      const skill = await skillService.createSkill(req.body);
      return ApiResponse.created(res, skill, 'Skill listing created successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = skillController;