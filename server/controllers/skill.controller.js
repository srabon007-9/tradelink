/**
 * controllers/skill.controller.js — Skill listing HTTP handlers.
 */

'use strict';

const ApiResponse = require('../utils/ApiResponse');
const skillService = require('../services/skill.service');

const getOwnerId = req => req.user.id;

const createSkill = async (req, res, next) => {
  try {
    const skill = await skillService.createSkill(getOwnerId(req), req.body);
    return ApiResponse.created(res, { skill }, 'Skill listing created successfully');
  } catch (error) {
    return next(error);
  }
};

const listSkills = async (req, res, next) => {
  try {
    const skills = await skillService.listSkills(req.query);
    return ApiResponse.success(res, { skills }, 'Skill listings fetched successfully');
  } catch (error) {
    return next(error);
  }
};

const listMySkills = async (req, res, next) => {
  try {
    const skills = await skillService.listMySkills(getOwnerId(req), req.query);
    return ApiResponse.success(res, { skills }, 'Your skill listings fetched successfully');
  } catch (error) {
    return next(error);
  }
};

const getSkill = async (req, res, next) => {
  try {
    const skill = await skillService.getSkillById(req.params.id);
    return ApiResponse.success(res, { skill }, 'Skill listing fetched successfully');
  } catch (error) {
    return next(error);
  }
};

const updateSkill = async (req, res, next) => {
  try {
    const skill = await skillService.updateSkill(req.params.id, getOwnerId(req), req.body);
    return ApiResponse.success(res, { skill }, 'Skill listing updated successfully');
  } catch (error) {
    return next(error);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    await skillService.deleteSkill(req.params.id, getOwnerId(req));
    return ApiResponse.noContent(res);
  } catch (error) {
    return next(error);
  }
};

const updateSkillStatus = async (req, res, next) => {
  try {
    const skill = await skillService.updateSkillStatus(req.params.id, getOwnerId(req), req.body.status);
    return ApiResponse.success(res, { skill }, 'Skill listing status updated successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSkill,
  listSkills,
  listMySkills,
  getSkill,
  updateSkill,
  deleteSkill,
  updateSkillStatus,
};
