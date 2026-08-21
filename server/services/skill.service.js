/**
 * services/skill.service.js — Skill listing business logic.
 */

'use strict';

const ApiError = require('../utils/ApiError');
const { Skill } = require('../models/Skill.model');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  alphabetical: { title: 1 },
  baseRate: { baseRate: 1 },
};

const buildQuery = (ownerId, filters = {}) => {
  const query = {};

  if (ownerId) {
    query.owner = ownerId;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
    ];
  }

  return query;
};

const createSkill = async (ownerId, payload) => {
  const skill = await Skill.create({
    ...payload,
    owner: ownerId,
  });

  return skill;
};

const listSkills = async (filters = {}) => {
  const sort = SORTS[filters.sort] || SORTS.newest;
  return Skill.find(buildQuery(null, filters)).sort(sort);
};

const listMySkills = async (ownerId, filters = {}) => {
  const sort = SORTS[filters.sort] || SORTS.newest;
  return Skill.find(buildQuery(ownerId, filters)).sort(sort);
};

const getSkillById = async (skillId, ownerId = null) => {
  const skill = await Skill.findById(skillId);

  if (!skill) {
    throw ApiError.notFound('Skill listing not found');
  }

  if (ownerId && skill.owner._id.toString() !== ownerId.toString()) {
    throw ApiError.forbidden('You do not have access to this skill listing');
  }

  return skill;
};

const updateSkill = async (skillId, ownerId, payload) => {
  const skill = await Skill.findOne({ _id: skillId, owner: ownerId });

  if (!skill) {
    throw ApiError.notFound('Skill listing not found');
  }

  Object.assign(skill, payload);
  await skill.save();
  return skill;
};

const deleteSkill = async (skillId, ownerId) => {
  const skill = await Skill.findOneAndDelete({ _id: skillId, owner: ownerId });

  if (!skill) {
    throw ApiError.notFound('Skill listing not found');
  }

  return skill;
};

const updateSkillStatus = async (skillId, ownerId, status) => {
  const skill = await Skill.findOne({ _id: skillId, owner: ownerId });

  if (!skill) {
    throw ApiError.notFound('Skill listing not found');
  }

  skill.status = status;
  // TODO: Notify Dynamic Valuation Engine when active listings change status.
  await skill.save();
  return skill;
};

module.exports = {
  createSkill,
  listSkills,
  listMySkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  updateSkillStatus,
};
