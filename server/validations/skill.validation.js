/**
 * validations/skill.validation.js — Skill input validation.
 */

'use strict';

const { body, query, validationResult } = require('express-validator');
const Skill = require('../models/Skill.model');
const ApiError = require('../utils/ApiError');

const SORT_VALUES = ['match', 'newest', 'price-low', 'price-high', 'availability'];

const runValidation = validations => async (req, res, next) => {
  await Promise.all(validations.map(validation => validation.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return next(ApiError.unprocessable(errors.array().map(e => e.msg).join(', ')));
};

const validateBrowseQuery = runValidation([
  query('category').optional({ checkFalsy: true }).isIn(Skill.CATEGORY_VALUES).withMessage('Invalid category'),
  query('availability')
    .optional({ checkFalsy: true })
    .isIn(Skill.AVAILABILITY_VALUES)
    .withMessage('Invalid availability'),
  query('sort').optional({ checkFalsy: true }).isIn(SORT_VALUES).withMessage('Invalid sort option'),
  query('minPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('minPrice must be a positive number'),
  query('maxPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('maxPrice must be a positive number'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
]);

const validateCreateSkill = runValidation([
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('category').isIn(Skill.CATEGORY_VALUES).withMessage('Invalid category'),
  body('categoryLabel')
    .if(body('category').equals('other'))
    .trim()
    .notEmpty()
    .withMessage('Please name the skill category (e.g. "Music Lessons") when choosing "Other"')
    .isLength({ max: 60 }),
  body('baseRate').isFloat({ min: 0 }).withMessage('baseRate must be a positive number'),
  body('availability').optional({ checkFalsy: true }).isIn(Skill.AVAILABILITY_VALUES),
  body('location').optional().trim().isLength({ max: 120 }),
  body('tags').optional().isArray({ max: 10 }).withMessage('tags must be an array of up to 10 items'),
  body('providerName').trim().notEmpty().withMessage('providerName is required').isLength({ max: 80 }),
]);

module.exports = { validateBrowseQuery, validateCreateSkill };