'use strict';

/**
 * validations/watchlist.validation.js — Watchlist Input Validation
 */

const { body, param, validationResult } = require('express-validator');

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

const validateCreateWatch = [
  body('category').trim().toLowerCase().notEmpty().withMessage('Category is required'),

  body('condition')
    .isIn(['below', 'above'])
    .withMessage('Condition must be "below" or "above"'),

  body('thresholdBDT')
    .isFloat({ min: 0 })
    .withMessage('Target price threshold must be a positive number'),

  validate,
];

const validateWatchId = [
  param('id').isMongoId().withMessage('Invalid watch id'),
  validate,
];

module.exports = { validateCreateWatch, validateWatchId };
