'use strict';

/**
 * validations/skillListing.validation.js — Skill Listing Input Validation
 */

const { body, param, validationResult } = require('express-validator');
const SkillCategory = require('../models/SkillCategory.model');

// ─── Reusable validation runner middleware ────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// A category is valid if it's the literal 'other' or the slug of a seeded SkillCategory.
const isKnownCategoryOrOther = async value => {
  if (value === 'other') return true;
  const exists = await SkillCategory.exists({ slug: value });
  if (!exists) {
    throw new Error(`'${value}' is not a known skill category — choose a listed category or 'other'`);
  }
  return true;
};

// ─── Create ───────────────────────────────────────────────────────────────────
const validateCreateListing = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be under 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description must be under 1000 characters'),

  body('category')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Category is required')
    .custom(isKnownCategoryOrOther),

  body('customCategoryName')
    .if(body('category').equals('other'))
    .trim()
    .notEmpty()
    .withMessage('Custom category name is required when category is "other"')
    .isLength({ max: 100 })
    .withMessage('Custom category name must be under 100 characters'),

  validate,
];

// ─── Update ───────────────────────────────────────────────────────────────────
const validateUpdateListing = [
  param('id').isMongoId().withMessage('Invalid listing id'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title must be under 100 characters'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Description must be under 1000 characters'),

  body('category')
    .optional()
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .custom(isKnownCategoryOrOther),

  body('customCategoryName')
    .if(body('category').equals('other'))
    .trim()
    .notEmpty()
    .withMessage('Custom category name is required when category is "other"')
    .isLength({ max: 100 })
    .withMessage('Custom category name must be under 100 characters'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),

  validate,
];

// ─── Id-only (get / delete) ──────────────────────────────────────────────────
const validateListingId = [
  param('id').isMongoId().withMessage('Invalid listing id'),
  validate,
];

module.exports = { validateCreateListing, validateUpdateListing, validateListingId };
