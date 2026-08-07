/**
 * services/skillService.js — Skill Listing & Category Browsing API client.
 *
 * Wraps the /api/skills endpoints used by the Browse Skills page:
 *  - getSkills()          → filtered/sorted/paginated listings + live category values
 *  - getCategorySummary() → live credit value per category on its own
 *  - createSkill()        → post a new skill listing
 */

import api from './api';

/**
 * @param {{
 *   search?: string,
 *   category?: string,
 *   availability?: string,
 *   minPrice?: number|string,
 *   maxPrice?: number|string,
 *   sort?: 'match'|'newest'|'price-low'|'price-high'|'availability',
 *   page?: number,
 *   limit?: number,
 * }} params
 * @returns {Promise<{ items: object[], categories: object[], pagination: object }>}
 */
export const getSkills = async (params = {}) => {
  // Strip empty values so we don't send e.g. category=&availability=
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );

  const { data } = await api.get('/skills', { params: cleanParams });

  return {
    items: data.data ?? [],
    categories: data.meta?.categories ?? [],
    pagination: data.meta?.pagination ?? { total: 0, page: 1, limit: 20, pages: 1 },
  };
};

/** @returns {Promise<object[]>} live credit value + supply/demand per category */
export const getCategorySummary = async () => {
  const { data } = await api.get('/skills/categories');
  return data.data ?? [];
};

/** @param {object} payload matches server/validations/skill.validation.js */
export const createSkill = async payload => {
  const { data } = await api.post('/skills', payload);
  return data.data;
};