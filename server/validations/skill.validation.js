/**
 * validations/skill.validation.js — Skill listing validation.
 */

'use strict';

const { body, query, param, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const {
  SKILL_CATEGORIES,
  EXPERIENCE_LEVELS,
  SKILL_STATUSES,
} = require('../models/Skill.model');

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.array().map(error => error.msg).join(', ');
    return next(ApiError.unprocessable(message));
  }

  return next();
};

const normalizeTags = value => {
  if (Array.isArray(value)) {
    return value.map(tag => String(tag).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map(tag => tag.trim()).filter(Boolean);
  }

  return [];
};

const skillBodyValidation = (isUpdate = false) => {
  const maybeOptional = validation => (isUpdate ? validation.optional() : validation);

  return [
  body('title')
    .trim()
    .if((_value, { req }) => !isUpdate || Object.prototype.hasOwnProperty.call(req.body, 'title'))
    .isLength({ min: 5, max: 80 })
    .withMessage('Title must be between 5 and 80 characters'),
  body('description')
    .trim()
    .if((_value, { req }) => !isUpdate || Object.prototype.hasOwnProperty.call(req.body, 'description'))
    .isLength({ min: 30, max: 1000 })
    .withMessage('Description must be between 30 and 1000 characters'),
  maybeOptional(body('category'))
    .isIn(SKILL_CATEGORIES)
    .withMessage('Category is not supported'),
  maybeOptional(body('baseRate'))
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage('Base rate must be a positive number'),
  body('experienceLevel')
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage('Experience level is not supported'),
  body('estimatedDuration')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Estimated duration cannot exceed 120 characters'),
  body('tags')
    .optional()
    .customSanitizer(normalizeTags)
    .isArray({ max: 10 })
    .withMessage('Tags must contain 10 items or fewer'),
  body('thumbnail')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Thumbnail URL cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(SKILL_STATUSES)
    .withMessage('Status is not supported'),
  ];
};

const validateCreateSkill = [...skillBodyValidation(), validateRequest];

const validateUpdateSkill = [
  param('id').isMongoId().withMessage('Invalid skill id'),
  ...skillBodyValidation(true),
  validateRequest,
];

const validateSkillId = [
  param('id').isMongoId().withMessage('Invalid skill id'),
  validateRequest,
];

const validateStatusUpdate = [
  param('id').isMongoId().withMessage('Invalid skill id'),
  body('status')
    .isIn(['active', 'paused'])
    .withMessage('Status must be active or paused'),
  validateRequest,
];

const validateSkillQuery = [
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Search is too long'),
  query('category').optional().isIn(SKILL_CATEGORIES).withMessage('Category is not supported'),
  query('status').optional().isIn(SKILL_STATUSES).withMessage('Status is not supported'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'alphabetical', 'baseRate'])
    .withMessage('Sort option is not supported'),
  validateRequest,
];

module.exports = {
  validateCreateSkill,
  validateUpdateSkill,
  validateSkillId,
  validateStatusUpdate,
  validateSkillQuery,
};
