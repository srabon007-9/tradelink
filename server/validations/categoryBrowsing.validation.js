'use strict';

/**
 * validations/categoryBrowsing.validation.js — Category Browsing Query Validation
 */

const { query, validationResult } = require('express-validator');

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

const validateBrowseQuery = [
  query('category').optional().trim().toLowerCase().isLength({ max: 100 }),

  query('search').optional().trim().isLength({ max: 200 }).withMessage('Search text must be under 200 characters'),

  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'price_asc', 'price_desc'])
    .withMessage('Sort must be one of: newest, oldest, price_asc, price_desc'),

  validate,
];

module.exports = { validateBrowseQuery };
